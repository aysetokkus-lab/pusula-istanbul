// Pusula Istanbul - Push Notification Gonderici
// Edge Function (Deno) - verify_jwt=false, CRON_SECRET header check
// v1.1.0 - Server-side push gonderim altyapisi
// v1.1.1 fix (2 Haz 2026) - KANAL_MAP -v2 suffix'li ID'lere cevrildi (Android ses bug).
// v1.1.2 fix (14 Haz 2026) - KANAL_MAP -v3'e cevrildi:
//   * -v2 kanallari `sound` parametresi verilmeden olusturuldugu icin Samsung
//     OneUI'da SESSIZ kaliyordu (expo-notifications: sound anahtari yoksa
//     setSound hic cagrilmaz). Client tarafi -v3 kanallari `sound: 'default'`
//     ile olusturuyor (-> DEFAULT_NOTIFICATION_URI = sistem sesi).
//   * Henuz OTA almamis cihazlarda -v3 ID'si bulunamaz -> Android default
//     kanala fallback yapar -> ses calar (anlik sunucu-taraffi hotfix).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Bildirim kategorileri - use-bildirim-tercihleri.ts ile birebir
type Kategori = "ulasim" | "trafik" | "sahaDurumu" | "etkinlikler" | "sohbet" | "admin";

// Android kanal eslestirmesi - use-bildirimler.ts ile birebir
// v1.1.2: -v3 suffix'li ID'ler (sound:'default' ile olusturulan sesli kanallar)
const KANAL_MAP: Record<Kategori, string> = {
  ulasim: "ulasim-uyari-v3",
  trafik: "trafik-uyari-v3",
  sahaDurumu: "saha-durumu-v3",
  etkinlikler: "etkinlikler-v3",
  sohbet: "sohbet-v3",
  admin: "sistem-v3",
};

// Premium gate'li kategoriler - freemium kullanicilara gonderilmez
// Sohbet ve sistem freemium'a da acik (kritik saha bilgisi pin'li mesajlar dahil)
const PREMIUM_KATEGORILER: Kategori[] = ["sahaDurumu", "ulasim", "trafik", "etkinlikler"];

interface IstekBody {
  kategori: Kategori;
  baslik: string;
  icerik: string;
  veri?: Record<string, any>;
  kullanici_id_haric?: string;  // Sohbet: mesaj gonderene push gonderme
  test_token?: string;          // Tek bir token'a test gonderimi (debug)
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

async function expoPushGonder(mesajlar: ExpoPushMesaj[]): Promise<ExpoPushSonuc[]> {
  if (mesajlar.length === 0) return [];
  const sonuclar: ExpoPushSonuc[] = [];

  // Expo Push API max 100 mesaj/istek
  for (let i = 0; i < mesajlar.length; i += 100) {
    const batch = mesajlar.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.warn(`Expo Push API hata: ${res.status} ${res.statusText}`);
        batch.forEach(() => sonuclar.push({ status: "error", message: `HTTP ${res.status}` }));
        continue;
      }
      const json = await res.json();
      const data = (json.data ?? []) as ExpoPushSonuc[];
      sonuclar.push(...data);
    } catch (e) {
      console.warn("Expo Push fetch exception:", e);
      batch.forEach(() => sonuclar.push({ status: "error", message: String(e) }));
    }
  }

  return sonuclar;
}

Deno.serve(async (req: Request) => {
  // Auth: CRON_SECRET header
  const incomingSecret = req.headers.get("x-pusula-cron-secret") ?? "";
  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: IstekBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { kategori, baslik, icerik, veri, kullanici_id_haric, test_token } = body;

  if (!kategori || !baslik || !icerik) {
    return new Response(JSON.stringify({ ok: false, error: "missing fields: kategori, baslik, icerik" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!KANAL_MAP[kategori]) {
    return new Response(JSON.stringify({ ok: false, error: `unknown kategori: ${kategori}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // === TEST modu - tek token'a gonder, DB'yi sorgulamadan ===
  if (test_token) {
    const sonuclar = await expoPushGonder([{
      to: test_token,
      title: baslik,
      body: icerik,
      data: { kategori, ...(veri || {}) },
      sound: "default",
      channelId: KANAL_MAP[kategori],
      priority: "high",
    }]);
    return new Response(JSON.stringify({ ok: true, mode: "test", sonuclar }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // === Hedef kullanici listesini cek ===
  const premiumGerekli = PREMIUM_KATEGORILER.includes(kategori);
  let query = supabase
    .from("profiles")
    .select("id, expo_push_token, push_token_platform, bildirim_tercihleri, abonelik_durumu, rol")
    .not("expo_push_token", "is", null);

  if (premiumGerekli) {
    // Premium gate: aktif abonelik VEYA admin/moderator
    query = query.or("abonelik_durumu.eq.aktif,rol.in.(admin,moderator)");
  }

  if (kullanici_id_haric) {
    query = query.neq("id", kullanici_id_haric);
  }

  const { data: kullanicilar, error: sorguHatasi } = await query;

  if (sorguHatasi) {
    console.warn("Kullanici sorgu hatasi:", sorguHatasi.message);
    return new Response(JSON.stringify({ ok: false, error: sorguHatasi.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Tercih filtresi: bildirim_tercihleri JSONB NULL ise varsayilan = tum tercihler acik
  const hedefler = (kullanicilar ?? []).filter((k) => {
    const tercih = k.bildirim_tercihleri as Record<string, boolean> | null;
    if (!tercih) return true; // NULL = default tum acik
    // tercih[kategori] explicit false ise gonderme
    return tercih[kategori] !== false;
  });

  if (hedefler.length === 0) {
    return new Response(JSON.stringify({ ok: true, gonderildi: 0, sebep: "hedef yok" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Expo Push mesaj listesi olustur
  const mesajlar: ExpoPushMesaj[] = hedefler.map((k) => ({
    to: k.expo_push_token as string,
    title: baslik,
    body: icerik,
    data: { kategori, ...(veri || {}) },
    sound: "default",
    channelId: KANAL_MAP[kategori],
    priority: "high",
  }));

  const sonuclar = await expoPushGonder(mesajlar);

  // Hatali token'lari temizle (DeviceNotRegistered = artik gecersiz)
  const temizlenecekTokenlar: string[] = [];
  sonuclar.forEach((s, idx) => {
    if (s.status === "error" && s.details?.error === "DeviceNotRegistered") {
      const token = mesajlar[idx]?.to;
      if (token) temizlenecekTokenlar.push(token);
    }
  });

  if (temizlenecekTokenlar.length > 0) {
    await supabase
      .from("profiles")
      .update({ expo_push_token: null, push_token_platform: null })
      .in("expo_push_token", temizlenecekTokenlar);
  }

  const basarili = sonuclar.filter((s) => s.status === "ok").length;
  const hatali = sonuclar.length - basarili;

  return new Response(
    JSON.stringify({
      ok: true,
      kategori,
      hedef: hedefler.length,
      gonderildi: basarili,
      hatali,
      temizlenen_token: temizlenecekTokenlar.length,
      zaman: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
