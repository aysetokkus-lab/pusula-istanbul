// Edge Function: tureb-dogrula (Eyl 2026)
// TUREB "Rehber Veritabanı" (https://www.tureb.org.tr/RehberVeritabani) ad-soyad sorgusu → profiles.tureb_* alanları.
// POST {} → kullanıcının profil adıyla sorgular; POST { secim: n } → çoklu eşleşmede kullanıcının seçtiği adayı yazar.
// verify_jwt AÇIK. Okuma kullanıcının JWT'siyle (RLS), yazma SERVICE ROLE ile (tureb_* alanları kullanıcıya kapalı — trigger).
// TUREB ruhsat numarası YAYINLAMAZ → doğrulama = ad-soyad eşleşmesi + oda + dil + eylemli/eylemsiz (Ayşe kararı: rozet, kayıt engellenmez).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

type Aday = { ad: string; oda: string; dil: string; durum: "eylemli" | "eylemsiz" | "" };

/** "Fransızca, İngilizce" → ["Fransızca","İngilizce"] (profiles.diller için) */
function dilleriAyir(dil: string): string[] {
  return (dil || "").split(/[,/]+/).map((d) => d.trim()).filter(Boolean);
}

/** Türkçe büyük harf + fazla boşluk temizliği — TUREB adları büyük harf döner */
function norm(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
}
function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}
const ENTITY: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
/** Etiketleri at, HTML varlıklarını çöz (TUREB Türkçe harfleri &#231; gibi sayısal varlıkla döndürür) */
function htmlTemizle(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITY[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

/** TUREB HTML tablosunu satırlara çevir: [Adı Soyadı, Oda, Yabancı Dil, Telefon, E-posta, Eylemli/Eylemsiz] */
function parse(html: string): Aday[] {
  const out: Aday[] = [];
  for (const tr of html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => htmlTemizle(m[1]));
    if (tds.length < 3) continue;
    const durumHam = norm(tds[tds.length - 1]);
    const durum: Aday["durum"] = durumHam === "EYLEMLİ" ? "eylemli" : durumHam === "EYLEMSİZ" ? "eylemsiz" : "";
    out.push({ ad: norm(tds[0]), oda: tds[1], dil: tds[2], durum });
  }
  return out;
}

/**
 * TUREB'e HTTP çağrısı — Edge runtime (Deno/rustls) TUREB'in TLS'ine bağlanamıyor ("connection reset"),
 * Postgres pg_net bağlanıyor → çağrı SECURITY DEFINER RPC'lerle pg_net üzerinden (yalnızca service_role).
 * Parametreler query string'de (ASP.NET MVC form/query'yi aynı okur). Sonuç net._http_response'tan yoklanır.
 */
async function turebSor(admin: ReturnType<typeof createClient>, adi: string, soyadi: string): Promise<Aday[]> {
  const qs = `adi=${encodeURIComponent(adi)}&soyadi=${encodeURIComponent(soyadi)}`;
  const { data: rid, error: bErr } = await admin.rpc("tureb_http_baslat", { qs });
  if (bErr || !rid) throw new Error(bErr?.message || "pg_net başlatılamadı");
  const baslangic = Date.now();
  while (Date.now() - baslangic < 14_000) {
    await new Promise((r) => setTimeout(r, 400));
    const { data, error } = await admin.rpc("tureb_http_sonuc", { rid });
    if (error) throw new Error(error.message);
    const satir = Array.isArray(data) ? data[0] : data;
    if (!satir) continue;
    if (satir.error_msg) throw new Error(String(satir.error_msg));
    if (satir.status_code !== 200) throw new Error(`TUREB ${satir.status_code}`);
    return parse(String(satir.content ?? ""));
  }
  throw new Error("TUREB zaman aşımı");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ hata: "POST bekleniyor" }, 405);
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ hata: "Giriş gerekli" }, 401);

  let govde: { secim?: number } = {};
  try { govde = await req.json(); } catch { /* boş gövde olabilir */ }

  const sb = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user }, error: uErr } = await sb.auth.getUser();
  if (uErr || !user) return json({ hata: "Oturum doğrulanamadı" }, 401);

  const { data: profil } = await sb.from("profiles")
    .select("isim, soyisim, diller, tureb_durum, tureb_adaylar")
    .eq("id", user.id).maybeSingle();
  if (!profil) return json({ hata: "Profil bulunamadı" }, 404);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const simdi = new Date().toISOString();

  // ── Çoklu eşleşmede kullanıcı seçimi ──
  if (typeof govde.secim === "number") {
    const adaylar = (profil.tureb_adaylar as Aday[] | null) ?? [];
    const a = adaylar[govde.secim];
    if (!a) return json({ hata: "Geçersiz seçim" }, 400);
    const patch: Record<string, unknown> = {
      tureb_durum: a.durum || "eylemli", tureb_oda: a.oda, tureb_dil: a.dil, tureb_ad: a.ad, tureb_adaylar: null, tureb_kontrol_at: simdi,
    };
    if (!(profil.diller as string[] | null)?.length && dilleriAyir(a.dil).length) patch.diller = dilleriAyir(a.dil);
    const { error } = await admin.from("profiles").update(patch).eq("id", user.id);
    if (error) return json({ hata: error.message }, 500);
    return json({ durum: patch.tureb_durum, oda: a.oda, dil: a.dil, ad: a.ad });
  }

  // ── Ad-soyad sorgusu ──
  const isim = (profil.isim || "").trim();
  const soyisim = (profil.soyisim || "").trim();
  if (!isim || !soyisim) return json({ hata: "Profilde ad ve soyad gerekli" }, 400);

  let satirlar: Aday[] = [];
  try {
    satirlar = await turebSor(admin, isim, soyisim);
    // Çift soyadı (Tokkuş Bayar) TUREB'de bulunamazsa son / ilk kelimeyle dene
    const soyTok = tokens(soyisim);
    if (!satirlar.length && soyTok.length > 1) satirlar = await turebSor(admin, isim, soyTok[soyTok.length - 1]);
    if (!satirlar.length && soyTok.length > 1) satirlar = await turebSor(admin, isim, soyTok[0]);
    if (!satirlar.length && tokens(isim).length > 1) satirlar = await turebSor(admin, tokens(isim)[0], soyisim);
  } catch (e) {
    // TUREB erişilemedi → mevcut sonucu bozma, yalnızca boşsa 'bilinmiyor'
    if (!profil.tureb_durum) await admin.from("profiles").update({ tureb_durum: "bilinmiyor", tureb_kontrol_at: simdi }).eq("id", user.id);
    return json({ durum: profil.tureb_durum || "bilinmiyor", hata: `TUREB'e ulaşılamadı: ${(e as Error).message}` }, 200);
  }

  const tamAd = norm(`${isim} ${soyisim}`);
  const benimTok = tokens(tamAd);
  const tam = satirlar.filter((s) => s.ad === tamAd);
  // Tam eşleşme yoksa: kullanıcının tüm kelimeleri TUREB adında geçiyorsa aday (ikinci ad / çift soyad farkları)
  const yakin = tam.length ? tam : satirlar.filter((s) => { const t = tokens(s.ad); return benimTok.every((k) => t.includes(k)); });
  const adaylar = yakin.length ? yakin : satirlar;

  let patch: Record<string, unknown>;
  if (adaylar.length === 1) {
    const a = adaylar[0];
    patch = { tureb_durum: a.durum || "eylemli", tureb_oda: a.oda, tureb_dil: a.dil, tureb_ad: a.ad, tureb_adaylar: null, tureb_kontrol_at: simdi };
    if (!(profil.diller as string[] | null)?.length && dilleriAyir(a.dil).length) patch.diller = dilleriAyir(a.dil);
  } else if (adaylar.length > 1) {
    patch = { tureb_durum: "coklu", tureb_oda: null, tureb_dil: null, tureb_ad: null, tureb_adaylar: adaylar.slice(0, 20), tureb_kontrol_at: simdi };
  } else {
    patch = { tureb_durum: "bulunamadi", tureb_oda: null, tureb_dil: null, tureb_ad: null, tureb_adaylar: null, tureb_kontrol_at: simdi };
  }
  const { error } = await admin.from("profiles").update(patch).eq("id", user.id);
  if (error) return json({ hata: error.message }, 500);
  return json({ durum: patch.tureb_durum, oda: patch.tureb_oda ?? null, dil: patch.tureb_dil ?? null, ad: patch.tureb_ad ?? null, adaylar: patch.tureb_adaylar ?? null });
});
