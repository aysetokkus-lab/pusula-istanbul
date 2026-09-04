// Pusula İstanbul — Masraf Pusulası dışa aktarma Edge Function (v2, Eyl 2026 — v2: rehberlik ücreti + çok günlü tur / gün sütunu)
//
// POST { tur_id: uuid, formatlar?: ('pdf'|'docx'|'xlsx')[] }  (Authorization: Bearer <kullanıcı JWT>, verify_jwt AÇIK)
// → { dosyalar: [{ ad, mime, base64 }] }
//
// Veri, kullanıcının KENDİ oturumuyla okunur (anon key + Authorization header → RLS): ajanda_turlar + masraflar + profiles.
// Fiş görselleri özel bucket `masraf-fisler`den yine kullanıcı oturumuyla indirilir (storage RLS: yalnızca sahibi).
// Üretim: pdf.ts (pdf-lib + Poppins alt kümesi), docx.ts (docx), xlsx.ts (exceljs). Palet + logo: ortak.ts / varliklar.ts.
// Kaynak repoda: supabase/functions/masraf-disa-aktar/

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { pdfUret } from "./pdf.ts";
import { docxUret } from "./docx.ts";
import { xlsxUret } from "./xlsx.ts";
import { type ParaBirimi, type Satir, type Veri, bytesToBase64, dosyaAdi, ozetHesapla } from "./ortak.ts";
import { varliklariYukle } from "./varliklar.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Format = "pdf" | "docx" | "xlsx";
const MIME: Record<Format, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ hata: "POST bekleniyor" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ hata: "Giriş gerekli" }, 401);

  let govde: { tur_id?: string; formatlar?: Format[] };
  try { govde = await req.json(); } catch { return json({ hata: "Geçersiz istek" }, 400); }
  const turId = govde.tur_id;
  if (!turId || !/^[0-9a-f-]{36}$/i.test(turId)) return json({ hata: "tur_id gerekli" }, 400);
  const formatlar = (govde.formatlar?.length ? govde.formatlar : ["pdf"]).filter((f): f is Format => f in MIME);
  if (!formatlar.length) return json({ hata: "Geçerli format yok" }, 400);

  // Kullanıcının kendi oturumu → RLS
  const sb = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user }, error: uErr } = await sb.auth.getUser();
  if (uErr || !user) return json({ hata: "Oturum doğrulanamadı" }, 401);

  const [{ data: tur, error: tErr }, { data: satirlar, error: mErr }, { data: profil }] = await Promise.all([
    sb.from("ajanda_turlar").select("tarih, bitis_tarih, baslik, acente, acente_email, grup, saat, bulusma, notlar").eq("id", turId).maybeSingle(),
    sb.from("masraflar").select("tip, kategori, tarih, aciklama, tutar, para_birimi, fis_path, sira, created_at").eq("tur_id", turId).order("tarih", { ascending: true, nullsFirst: true }).order("sira").order("created_at"),
    sb.from("profiles").select("isim, soyisim, telefon, email, ruhsat_no").eq("id", user.id).maybeSingle(),
  ]);
  if (tErr) return json({ hata: `Tur okunamadı: ${tErr.message}` }, 500);
  if (!tur) return json({ hata: "Tur bulunamadı" }, 404);
  if (mErr) return json({ hata: `Masraflar okunamadı: ${mErr.message}` }, 500);

  const masraflar: Satir[] = [];
  const avanslar: Satir[] = [];
  const ucretler: Satir[] = [];
  for (const s of satirlar ?? []) {
    const tip: Satir["tip"] = s.tip === "avans" ? "avans" : s.tip === "ucret" ? "ucret" : "masraf";
    const hedef = tip === "avans" ? avanslar : tip === "ucret" ? ucretler : masraflar;
    hedef.push({
      sira: hedef.length + 1,
      tip,
      kategori: tip === "masraf" ? String(s.kategori ?? "diger") : tip,
      tarih: s.tarih ? String(s.tarih) : String(tur.tarih),
      aciklama: s.aciklama ? String(s.aciklama).trim() || null : null,
      tutar: Number(s.tutar) || 0,
      para_birimi: (["TRY", "EUR", "USD"].includes(s.para_birimi) ? s.para_birimi : "TRY") as ParaBirimi,
      fis_path: s.fis_path ?? null,
      fis: null,
    });
  }

  // Fiş görsellerini indir (en fazla 20; WebP → pdf-lib desteklemez, atlanır)
  const fisli = masraflar.filter((s) => s.fis_path).slice(0, 20);
  await Promise.all(fisli.map(async (s) => {
    try {
      const { data, error } = await sb.storage.from("masraf-fisler").download(s.fis_path!);
      if (error || !data) return;
      const mime = data.type || (s.fis_path!.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
      if (!/jpe?g|png/.test(mime)) return;
      s.fis = { bytes: new Uint8Array(await data.arrayBuffer()), mime };
    } catch { /* fiş yoksa devam */ }
  }));

  const adSoyad = [profil?.isim, profil?.soyisim].filter(Boolean).join(" ").trim() || user.email || "Rehber";
  const veri: Veri = {
    rehber: { adSoyad, telefon: profil?.telefon ?? null, email: profil?.email ?? user.email ?? null, ruhsatNo: profil?.ruhsat_no ?? null },
    tur: {
      tarih: String(tur.tarih), bitis_tarih: tur.bitis_tarih ? String(tur.bitis_tarih) : null, baslik: tur.baslik, acente: tur.acente,
      acente_email: tur.acente_email, grup: tur.grup, saat: tur.saat, bulusma: tur.bulusma, notlar: tur.notlar,
    },
    masraflar, avanslar, ucretler, ozet: ozetHesapla(masraflar, avanslar, ucretler), olusturma: new Date(),
  };

  const dosyalar: { ad: string; mime: string; base64: string }[] = [];
  try {
    const v = await varliklariYukle();
    for (const f of formatlar) {
      const bytes = f === "pdf" ? await pdfUret(veri, v) : f === "docx" ? await docxUret(veri, v) : await xlsxUret(veri, v);
      dosyalar.push({ ad: dosyaAdi(veri.tur, f), mime: MIME[f], base64: bytesToBase64(bytes) });
    }
  } catch (e) {
    console.error("[masraf-disa-aktar] üretim hatası:", e);
    return json({ hata: `Dosya üretilemedi: ${(e as Error)?.message ?? e}` }, 500);
  }

  return json({
    dosyalar,
    ozet: veri.ozet,
    acente_email: veri.tur.acente_email,
    konu: `Masraf Pusulası – ${veri.tur.baslik} – ${veri.tur.tarih}${veri.tur.bitis_tarih && veri.tur.bitis_tarih !== veri.tur.tarih ? ` / ${veri.tur.bitis_tarih}` : ""}`,
  });
});
