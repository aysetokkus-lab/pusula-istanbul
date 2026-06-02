// ═══════════════════════════════════════════════════════════════
// Pusula Istanbul — X (Twitter) → ulasim_uyarilari Senkronizasyon
// Edge Function (Deno)
//
// Kaynak: client-side hook'tan port edildi (hooks/use-x-ulasim.ts)
// Tetikleme: pg_cron her 15 dk'da bir HTTP POST atar
// Auth: verify_jwt=false (public endpoint), CRON_SECRET header kontrolü
//       (service role key kullanıcının kopyalamasını gerektirmesin diye)
// ═══════════════════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const X_BEARER_TOKEN = Deno.env.get("X_BEARER_TOKEN") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const X_API = "https://api.x.com/2";

// Takip edilen X hesapları
const HESAPLAR = [
  { id: "380813681",          kullanici: "metroistanbul",   kaynak: "x:metroistanbul" },
  { id: "768121108482629632", kullanici: "TCDDTasimacilik", kaynak: "x:TCDDTasimacilik" },
  { id: "2168117880",         kullanici: "Marmaraytcdd",    kaynak: "x:Marmaraytcdd" },
  { id: "154653111",          kullanici: "4444154",         kaynak: "x:IBBUlasim" },
];

// ─── Hat tespiti ───────────────────────────────────────────────
const HAT_REGEX: { regex: RegExp; hat: string }[] = [
  { regex: /\bM1[A-B]?\b/i, hat: "M1" },
  { regex: /\bM2\b/i, hat: "M2" },
  { regex: /\bM3\b/i, hat: "M3" },
  { regex: /\bM4\b/i, hat: "M4" },
  { regex: /\bM5\b/i, hat: "M5" },
  { regex: /\bM6\b/i, hat: "M6" },
  { regex: /\bM7\b/i, hat: "M7" },
  { regex: /\bM8\b/i, hat: "M8" },
  { regex: /\bM9\b/i, hat: "M9" },
  { regex: /\bM11\b/i, hat: "M11" },
  { regex: /\bM12\b/i, hat: "M12" },
  { regex: /\bM14\b/i, hat: "M14" },
  { regex: /\bT1\b/i, hat: "T1" },
  { regex: /\bT2\b/i, hat: "T2" },
  { regex: /\bT3\b/i, hat: "T3" },
  { regex: /\bT4\b/i, hat: "T4" },
  { regex: /\bT5\b/i, hat: "T5" },
  { regex: /\bF1\b/i, hat: "F1" },
  { regex: /\bF2\b/i, hat: "F2" },
  { regex: /\bF3\b/i, hat: "F3" },
  { regex: /\bF4\b/i, hat: "F4" },
  { regex: /\bTF1\b/i, hat: "TF1" },
  { regex: /\bTF2\b/i, hat: "TF2" },
  { regex: /marmaray/i, hat: "Marmaray" },
  { regex: /halkal[ıi].?bah[çc]e[şs]ehir/i, hat: "Halkali-Bahcesehir" },
  { regex: /gayrettepe.{0,15}(havali|airport)/i, hat: "M11" },
  { regex: /metrob[üu]s/i, hat: "Metrobus" },
  { regex: /34[A-Z]?\s/i, hat: "Metrobus" },
  { regex: /15\s?temmuz/i, hat: "Kopru-15Temmuz" },
  { regex: /FSM|fatih\s?sultan/i, hat: "Kopru-FSM" },
  { regex: /yavuz\s?sultan/i, hat: "Kopru-YSS" },
  { regex: /k[öo]pr[üu]/i, hat: "Kopru" },
  { regex: /\bE-?5\b/i, hat: "E-5" },
  { regex: /\bTEM\b/i, hat: "TEM" },
  { regex: /\bO-?[1-7]\b/i, hat: "Otoyol" },
  { regex: /\bD-?100\b/i, hat: "E-5" },
  { regex: /avrasya\s?t[üu]nel/i, hat: "Avrasya-Tunel" },
  { regex: /trafik\s?(yo[ğg]un|s[ıi]k[ıi][şs])/i, hat: "Trafik" },
  { regex: /yol\s?(kapan|[çc]al[ıi][şs]ma)/i, hat: "Yol-Calisma" },
  { regex: /kabata[şs].?ba[ğg]c[ıi]lar/i, hat: "T1" },
  { regex: /emin[öo]n[üu].?alibey/i, hat: "T5" },
  { regex: /kad[ıi]k[öo]y.?moda/i, hat: "T3" },
];

function hatTespit(metin: string): string {
  for (const { regex, hat } of HAT_REGEX) {
    if (regex.test(metin)) return hat;
  }
  return "Genel";
}

// ─── Tip tespiti ───────────────────────────────────────────────
const TIP_KURALLAR: { regex: RegExp; tip: string }[] = [
  { regex: /ar[ıi]za/i, tip: "ariza" },
  { regex: /sinyalizasyon/i, tip: "ariza" },
  { regex: /yap[ıi]lamamaktad[ıi]r/i, tip: "kesinti" },
  { regex: /yap[ıi]lam[ıi]yor/i, tip: "kesinti" },
  { regex: /durdu|durdurulmu/i, tip: "kesinti" },
  { regex: /iptal/i, tip: "kesinti" },
  { regex: /kapan/i, tip: "kesinti" },
  { regex: /trafi[ğg]e kapat/i, tip: "kesinti" },
  { regex: /gecikme/i, tip: "gecikme" },
  { regex: /gecikmeli/i, tip: "gecikme" },
  { regex: /aksama|aksıyor/i, tip: "gecikme" },
  { regex: /yo[ğg]un\s?trafik/i, tip: "gecikme" },
  { regex: /s[ıi]k[ıi][şs][ıi]k/i, tip: "gecikme" },
  { regex: /yava[şs]lama/i, tip: "gecikme" },
  { regex: /tek hat/i, tip: "gecikme" },
  { regex: /aras[ıi]nda yap[ıi]lmaktad[ıi]r/i, tip: "gecikme" },
  { regex: /normale d[öo]nm[üu][şs]/i, tip: "bilgi" },
  { regex: /ba[şs]lanm[ıi][şs]t[ıi]r/i, tip: "bilgi" },
  { regex: /ba[şs]lanm[ıi][şs]\s+olup/i, tip: "bilgi" },
  { regex: /[çc]ift hat(tan)?\s+i[şs]let/i, tip: "bilgi" },
  { regex: /sorun giderilmi[şs]/i, tip: "bilgi" },
  { regex: /tekrar hizmete/i, tip: "bilgi" },
  { regex: /a[çc][ıi]ld[ıi]/i, tip: "bilgi" },
  { regex: /ilave.*sefer/i, tip: "duyuru" },
  { regex: /[üu]cretsiz/i, tip: "duyuru" },
  { regex: /ek sefer/i, tip: "duyuru" },
];

type Tip = "ariza" | "kesinti" | "gecikme" | "bilgi" | "duyuru";

function tipTespit(metin: string): Tip {
  for (const { regex, tip } of TIP_KURALLAR) {
    if (regex.test(metin)) return tip as Tip;
  }
  return "bilgi";
}

// ─── Çözüldü tespiti ───────────────────────────────────────────
function cozulduMu(metin: string): boolean {
  return /normale d[öo]nm[üu][şs]/i.test(metin)
    || /ba[şs]lanm[ıi][şs]t[ıi]r/i.test(metin)
    || /ba[şs]lanm[ıi][şs]\s+olup/i.test(metin)
    || /[çc]ift hat(tan)?\s+i[şs]let/i.test(metin)
    || /seferler(i)?\s+normal/i.test(metin)
    || /d[üu]zenleme [çc]al[ıi][şs]malar[ıi]\s+devam/i.test(metin)
    || /a[çc][ıi]ld[ıi]/i.test(metin)
    || /a[çc][ıi]lm[ıi][şs]t[ıi]r/i.test(metin)
    || /sorun giderilmi[şs]/i.test(metin)
    || /tekrar hizmete/i.test(metin);
}

// ─── Ulaşım uyarısı filtresi ──────────────────────────────────
const UYARI_KALIPLARI: RegExp[] = [
  /ar[ıi]za/i,
  /kesinti/i,
  /gecikme/i,
  /gecikmeli/i,
  /iptal/i,
  /yap[ıi]lamamaktad[ıi]r/i,
  /yap[ıi]lam[ıi]yor/i,
  /durdu|durdurulmu/i,
  /aks[ıi]yor|aksama/i,
  /tek hat/i,
  /sinyalizasyon/i,
  /kapal[ıi]/i,
  /kapan[ıi]yor|kapanm[ıi][şs]/i,
  /k[ıi]s[ıi]tl/i,
  /normale d[öo]nm[üu][şs]/i,
  /seferler.*ba[şs]lanm[ıi][şs]/i,
  /[çc]ift hat(tan)?\s+i[şs]let/i,
  /aras[ıi]nda yap[ıi]lmaktad[ıi]r/i,
];

function ulasimUyarisiMi(metin: string): boolean {
  return UYARI_KALIPLARI.some((r) => r.test(metin));
}

// ─── X API çağrısı ─────────────────────────────────────────────
interface XTweet {
  id: string;
  text: string;
  created_at: string;
}

async function hesaptanTweetCek(userId: string, maxResults = 10): Promise<XTweet[]> {
  if (!X_BEARER_TOKEN) {
    console.warn("X_BEARER_TOKEN tanımlı değil");
    return [];
  }
  try {
    const url = `${X_API}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,text&exclude=retweets,replies`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    });
    if (!res.ok) {
      console.warn(`X API hata (${userId}): ${res.status} ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    return (json.data ?? []) as XTweet[];
  } catch (e) {
    console.warn(`X fetch hata (${userId}):`, e);
    return [];
  }
}

// ─── Ana akış ──────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Auth: ya cron'dan custom header ya da admin manuel test (anon key + custom header)
  const incomingSecret = req.headers.get("x-pusula-cron-secret") ?? "";
  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let yeniSayisi = 0;
  let guncellenenSayisi = 0;
  const hatalar: string[] = [];

  for (const hesap of HESAPLAR) {
    const tweetlerRaw = await hesaptanTweetCek(hesap.id, 10);
    // Eskiden yeniye sırala — çözüldü tespiti doğru çalışsın
    const tweetler = [...tweetlerRaw].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const yirmidortSaatOnce = Date.now() - 24 * 60 * 60 * 1000;

    for (const tweet of tweetler) {
      const tweetZaman = new Date(tweet.created_at).getTime();
      if (tweetZaman < yirmidortSaatOnce) continue;

      const ibbHesabi = hesap.kaynak === "x:IBBUlasim";
      if (!ibbHesabi && !ulasimUyarisiMi(tweet.text)) continue;

      const hat = hatTespit(tweet.text);
      const tip = tipTespit(tweet.text);
      const cozuldu = cozulduMu(tweet.text);

      // Daha önce eklenmiş mi?
      const { data: mevcut } = await supabase
        .from("ulasim_uyarilari")
        .select("id")
        .eq("tweet_id", tweet.id)
        .maybeSingle();

      if (mevcut) continue;

      // Çözüldü tweet'i ise aynı hattaki aktif uyarıları kapat
      if (cozuldu && hat !== "Genel") {
        const { data: kapatilan } = await supabase
          .from("ulasim_uyarilari")
          .update({
            cozuldu: true,
            cozulme_tarihi: new Date().toISOString(),
            aktif: false,
          })
          .eq("hat", hat)
          .eq("aktif", true)
          .eq("cozuldu", false)
          .select("id");
        guncellenenSayisi += kapatilan?.length ?? 0;
      }

      // Yeni uyarıyı ekle
      const { error } = await supabase.from("ulasim_uyarilari").insert({
        tweet_id: tweet.id,
        icerik: tweet.text.replace(/https?:\/\/t\.co\/\S+/g, "").trim(),
        tip,
        hat,
        tarih: tweet.created_at,
        aktif: !cozuldu, // çözüldü tweet'iyse aktif değil
        kaynak: hesap.kaynak,
        cozuldu,
        cozulme_tarihi: cozuldu ? new Date().toISOString() : null,
      });

      if (error) {
        hatalar.push(`${hesap.kullanici}/${tweet.id}: ${error.message}`);
      } else {
        yeniSayisi++;
      }
    }
  }

  // Bakım: 48 saatten eski çözülmüş uyarıları pasifle
  await supabase
    .from("ulasim_uyarilari")
    .update({ aktif: false })
    .eq("cozuldu", true)
    .lt("cozulme_tarihi", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  // 7 günden eski tüm uyarıları pasifle
  await supabase
    .from("ulasim_uyarilari")
    .update({ aktif: false })
    .lt("tarih", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const sonuc = {
    ok: true,
    yeni: yeniSayisi,
    guncellenen: guncellenenSayisi,
    hatalar,
    zaman: new Date().toISOString(),
  };

  return new Response(JSON.stringify(sonuc), {
    headers: { "Content-Type": "application/json" },
  });
});
