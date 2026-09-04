// Pusula Istanbul - Push Notification Gonderici
// Edge Function (Deno) - verify_jwt=false, CRON_SECRET header check
// v1.1.0 - Server-side push gonderim altyapisi
// v1.1.1 fix (2 Haz 2026) - KANAL_MAP -v2 suffix'li ID'lere cevrildi (Android ses bug).
// v1.1.2 fix (14 Haz 2026) - KANAL_MAP -v3'e cevrildi (sound:'default' kanallari).
// v4 fix (2 Tem 2026, ISSUES #87) - TOKEN DEDUPE (ayni token birden fazla profilde → en guncel kazanir).
// v5 (3 Eyl 2026) - UCRETSIZ MODEL + SOHBET YANIT:
//   * PREMIUM filtresi KALDIRILDI: sahaDurumu/ulasim/trafik/etkinlikler push'lari artik TUM kullanicilara
//     (abonelik_durumu kontrolu yok — uygulama tamamen ucretsiz).
//   * hedef_kullanici_id: yalnizca tek kullaniciya push (mesaja yanit bildirimi).
//   * haric_liste: birden fazla kullaniciyi haric tut (yanit akisinda gonderen + yanitlanan).
// v6 (3 Eyl 2026) - ILANLAR kategorisi: veri.diller ile hedef filtresi (profiles.diller bos → tumu; doluysa kesisim).
// Kaynak repoda: supabase/functions/push-gonder/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type Kategori = "ulasim" | "trafik" | "sahaDurumu" | "etkinlikler" | "sohbet" | "admin" | "ilanlar";

// v1.1.2: -v3 suffix'li ID'ler (sound:'default' ile olusturulan sesli kanallar)
const KANAL_MAP: Record<Kategori, string> = {
  ulasim: "ulasim-uyari-v3",
  trafik: "trafik-uyari-v3",
  sahaDurumu: "saha-durumu-v3",
  etkinlikler: "etkinlikler-v3",
  sohbet: "sohbet-v3",
  admin: "sistem-v3",
  ilanlar: "ilanlar-v3",
};

interface IstekBody {
  kategori: Kategori;
  baslik: string;
  icerik: string;
  veri?: Record<string, any>;
  kullanici_id_haric?: string;
  haric_liste?: string[];
  hedef_kullanici_id?: string;
  test_token?: string;
}

interface ExpoPushMesaj {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  channelId?: string;
  priority?: "default" | "high";
  badge?: number;
}

interface ExpoPushSonuc {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

async function expoPushGonder(mesajlar: ExpoPushMesaj[]): Promise<ExpoPushSonuc[]> {
  if (mesajlar.length === 0) return [];
  const sonuclar: ExpoPushSonuc[] = [];
  for (let i = 0; i < mesajlar.length; i += 100) {
    const batch = mesajlar.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json", "Accept-Encoding": "gzip, deflate" },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.warn(`Expo Push API hata: ${res.status} ${res.statusText}`);
        batch.forEach(() => sonuclar.push({ status: "error", message: `HTTP ${res.status}` }));
        continue;
      }
      const j = await res.json();
      sonuclar.push(...((j.data ?? []) as ExpoPushSonuc[]));
    } catch (e) {
      console.warn("Expo Push fetch exception:", e);
      batch.forEach(() => sonuclar.push({ status: "error", message: String(e) }));
    }
  }
  return sonuclar;
}

Deno.serve(async (req: Request) => {
  const incomingSecret = req.headers.get("x-pusula-cron-secret") ?? "";
  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) return json({ ok: false, error: "unauthorized" }, 401);

  let body: IstekBody;
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid json" }, 400); }

  const { kategori, baslik, icerik, veri, kullanici_id_haric, haric_liste, hedef_kullanici_id, test_token } = body;
  if (!kategori || !baslik || !icerik) return json({ ok: false, error: "missing fields: kategori, baslik, icerik" }, 400);
  if (!KANAL_MAP[kategori]) return json({ ok: false, error: `unknown kategori: ${kategori}` }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

  if (test_token) {
    const sonuclar = await expoPushGonder([{
      to: test_token, title: baslik, body: icerik, data: { kategori, ...(veri || {}) },
      sound: "default", channelId: KANAL_MAP[kategori], priority: "high",
    }]);
    return json({ ok: true, mode: "test", sonuclar });
  }

  // v5: premium filtresi YOK — herkes hedef. Tercih filtresi (bildirim_tercihleri) korunur.
  let query = supabase
    .from("profiles")
    .select("id, expo_push_token, push_token_platform, push_token_guncellendi, bildirim_tercihleri, rol, diller")
    .not("expo_push_token", "is", null);

  if (hedef_kullanici_id) {
    query = query.eq("id", hedef_kullanici_id);
  } else {
    if (kullanici_id_haric) query = query.neq("id", kullanici_id_haric);
    const haric = (haric_liste ?? []).filter((x) => typeof x === "string" && x.length > 0);
    if (haric.length > 0) query = query.not("id", "in", `(${haric.join(",")})`);
  }

  const { data: kullanicilar, error: sorguHatasi } = await query;
  if (sorguHatasi) {
    console.warn("Kullanici sorgu hatasi:", sorguHatasi.message);
    return json({ ok: false, error: sorguHatasi.message }, 500);
  }

  // v6: ilan dil filtresi — ilanin dilleri ile kullanicinin profiles.diller kesisimi (bos profil = hepsini alir)
  const ilanDilleri: string[] = kategori === "ilanlar" && Array.isArray(veri?.diller)
    ? (veri!.diller as unknown[]).filter((d): d is string => typeof d === "string").map((d) => d.toLocaleLowerCase("tr"))
    : [];
  const tercihliler = (kullanicilar ?? []).filter((k) => {
    const tercih = k.bildirim_tercihleri as Record<string, boolean> | null;
    if (tercih && tercih[kategori] === false) return false;
    if (kategori === "ilanlar" && ilanDilleri.length > 0) {
      const kd = (Array.isArray(k.diller) ? (k.diller as string[]) : []).map((d) => String(d).toLocaleLowerCase("tr"));
      if (kd.length > 0 && !kd.some((d) => ilanDilleri.includes(d))) return false;
    }
    return true;
  });

  // v4: TOKEN DEDUPE — ayni token birden fazla profildeyse en guncel push_token_guncellendi kazanir.
  const tokenSahibi = new Map<string, (typeof tercihliler)[number]>();
  for (const k of tercihliler) {
    const token = k.expo_push_token as string;
    const mevcut = tokenSahibi.get(token);
    if (!mevcut) { tokenSahibi.set(token, k); continue; }
    const yeniZaman = k.push_token_guncellendi ? Date.parse(k.push_token_guncellendi as string) : 0;
    const eskiZaman = mevcut.push_token_guncellendi ? Date.parse(mevcut.push_token_guncellendi as string) : 0;
    if (yeniZaman > eskiZaman) tokenSahibi.set(token, k);
  }
  const hedefler = [...tokenSahibi.values()];
  const dedupe_elenen = tercihliler.length - hedefler.length;

  if (hedefler.length === 0) return json({ ok: true, gonderildi: 0, sebep: "hedef yok" });

  const mesajlar: ExpoPushMesaj[] = hedefler.map((k) => ({
    to: k.expo_push_token as string, title: baslik, body: icerik,
    data: { kategori, ...(veri || {}) }, sound: "default", channelId: KANAL_MAP[kategori], priority: "high",
  }));

  const sonuclar = await expoPushGonder(mesajlar);

  const temizlenecekTokenlar: string[] = [];
  sonuclar.forEach((s, idx) => {
    if (s.status === "error" && s.details?.error === "DeviceNotRegistered") {
      const token = mesajlar[idx]?.to; if (token) temizlenecekTokenlar.push(token);
    }
  });
  if (temizlenecekTokenlar.length > 0) {
    await supabase.from("profiles").update({ expo_push_token: null, push_token_platform: null }).in("expo_push_token", temizlenecekTokenlar);
  }

  const basarili = sonuclar.filter((s) => s.status === "ok").length;
  return json({
    ok: true, kategori, surum: "v6", hedef: hedefler.length, gonderildi: basarili,
    hatali: sonuclar.length - basarili, dedupe_elenen, temizlenen_token: temizlenecekTokenlar.length,
    zaman: new Date().toISOString(),
  });
});
