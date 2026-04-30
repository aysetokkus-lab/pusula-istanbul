import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ulasimUyarisiMi } from '../components/ulasim-uyari';
import { X_BEARER_TOKEN } from '../lib/config';

/* ═══════════════════════════════════════════
   X (Twitter) API → Supabase Senkronizasyonu

   3 hesaptan tweet ceker, ulasim uyarisi olanlari
   filtreler ve ulasim_uyarilari tablosuna yazar.
   ═══════════════════════════════════════════ */

const X_API = 'https://api.x.com/2';

// Takip edilen hesaplar ve X user ID'leri
const HESAPLAR = [
  { id: '380813681',          kullanici: 'metroistanbul',    kaynak: 'x:metroistanbul' },
  { id: '768121108482629632', kullanici: 'TCDDTasimacilik', kaynak: 'x:TCDDTasimacilik' },
  { id: '2168117880',         kullanici: 'Marmaraytcdd',    kaynak: 'x:Marmaraytcdd' },
  { id: '154653111',          kullanici: '4444154',          kaynak: 'x:IBBUlasim' },
];

/* ═══════════════════════════════════════════
   Hat tespiti (tweet iceriginden)
   ═══════════════════════════════════════════ */
const HAT_REGEX = [
  // Metro hatlari
  { regex: /\bM1[A-B]?\b/i,        hat: 'M1' },
  { regex: /\bM2\b/i,              hat: 'M2' },
  { regex: /\bM3\b/i,              hat: 'M3' },
  { regex: /\bM4\b/i,              hat: 'M4' },
  { regex: /\bM5\b/i,              hat: 'M5' },
  { regex: /\bM6\b/i,              hat: 'M6' },
  { regex: /\bM7\b/i,              hat: 'M7' },
  { regex: /\bM8\b/i,              hat: 'M8' },
  { regex: /\bM9\b/i,              hat: 'M9' },
  { regex: /\bM11\b/i,             hat: 'M11' },
  { regex: /\bM12\b/i,             hat: 'M12' },
  { regex: /\bM14\b/i,             hat: 'M14' },
  // Tramvay hatlari
  { regex: /\bT1\b/i,              hat: 'T1' },
  { regex: /\bT2\b/i,              hat: 'T2' },
  { regex: /\bT3\b/i,              hat: 'T3' },
  { regex: /\bT4\b/i,              hat: 'T4' },
  { regex: /\bT5\b/i,              hat: 'T5' },
  // Funikuler
  { regex: /\bF1\b/i,              hat: 'F1' },
  { regex: /\bF2\b/i,              hat: 'F2' },
  { regex: /\bF3\b/i,              hat: 'F3' },
  { regex: /\bF4\b/i,              hat: 'F4' },
  // Teleferik
  { regex: /\bTF1\b/i,             hat: 'TF1' },
  { regex: /\bTF2\b/i,             hat: 'TF2' },
  // Marmaray
  { regex: /marmaray/i,            hat: 'Marmaray' },
  // Halkali-Bahcesehir (yeni hat)
  { regex: /halkal[ıi].?bah[çc]e[şs]ehir/i, hat: 'Halkali-Bahcesehir' },
  // Gayrettepe-Havalimani
  { regex: /gayrettepe.{0,15}(havali|airport)/i, hat: 'M11' },
  // Metrobus
  { regex: /metrob[üu]s/i,            hat: 'Metrobus' },
  { regex: /34[A-Z]?\s/i,             hat: 'Metrobus' },
  // Kopruler
  { regex: /15\s?temmuz/i,            hat: 'Kopru-15Temmuz' },
  { regex: /FSM|fatih\s?sultan/i,     hat: 'Kopru-FSM' },
  { regex: /yavuz\s?sultan/i,         hat: 'Kopru-YSS' },
  { regex: /k[öo]pr[üu]/i,           hat: 'Kopru' },
  // Otoyol ve ana arterler
  { regex: /\bE-?5\b/i,              hat: 'E-5' },
  { regex: /\bTEM\b/i,               hat: 'TEM' },
  { regex: /\bO-?[1-7]\b/i,          hat: 'Otoyol' },
  { regex: /\bD-?100\b/i,            hat: 'E-5' },
  // Avrasya Tuneli
  { regex: /avrasya\s?t[üu]nel/i,    hat: 'Avrasya-Tunel' },
  // IBB genel trafik
  { regex: /trafik\s?(yo[ğg]un|s[ıi]k[ıi][şs])/i, hat: 'Trafik' },
  { regex: /yol\s?(kapan|[çc]al[ıi][şs]ma)/i,      hat: 'Yol-Calisma' },
  // Genel istasyon isimleri (fallback)
  { regex: /kabata[şs].?ba[ğg]c[ıi]lar/i,    hat: 'T1' },
  { regex: /emin[öo]n[üu].?alibey/i,          hat: 'T5' },
  { regex: /kad[ıi]k[öo]y.?moda/i,            hat: 'T3' },
];

function hatTespit(metin: string): string {
  for (const { regex, hat } of HAT_REGEX) {
    if (regex.test(metin)) return hat;
  }
  return 'Genel';
}

/* ═══════════════════════════════════════════
   Tip tespiti (ariza/kesinti/gecikme/bilgi/duyuru)
   ═══════════════════════════════════════════ */
const TIP_KURALLAR: { regex: RegExp; tip: string }[] = [
  // Ariza (en ciddi)
  { regex: /ar[ıi]za/i,                          tip: 'ariza' },
  { regex: /sinyalizasyon/i,                      tip: 'ariza' },
  // Kesinti
  { regex: /yap[ıi]lamamaktad[ıi]r/i,            tip: 'kesinti' },
  { regex: /yap[ıi]lam[ıi]yor/i,                 tip: 'kesinti' },
  { regex: /durdu|durdurulmu/i,                   tip: 'kesinti' },
  { regex: /iptal/i,                              tip: 'kesinti' },
  { regex: /kapan/i,                              tip: 'kesinti' },
  { regex: /trafi[ğg]e kapat/i,                   tip: 'kesinti' },
  // Gecikme / yogunluk (IBB Ulasim)
  { regex: /gecikme/i,                            tip: 'gecikme' },
  { regex: /gecikmeli/i,                          tip: 'gecikme' },
  { regex: /aksama|aksıyor/i,                     tip: 'gecikme' },
  { regex: /yo[ğg]un\s?trafik/i,                 tip: 'gecikme' },
  { regex: /s[ıi]k[ıi][şs][ıi]k/i,              tip: 'gecikme' },
  { regex: /yava[şs]lama/i,                       tip: 'gecikme' },
  { regex: /tek hat/i,                            tip: 'gecikme' },
  { regex: /aras[ıi]nda yap[ıi]lmaktad[ıi]r/i,  tip: 'gecikme' },  // kismi sefer
  // Bilgi (cozuldu)
  { regex: /normale d[öo]nm[üu][şs]/i,           tip: 'bilgi' },
  { regex: /ba[şs]lanm[ıi][şs]t[ıi]r/i,         tip: 'bilgi' },
  { regex: /ba[şs]lanm[ıi][şs]\s+olup/i,        tip: 'bilgi' },
  { regex: /[çc]ift hat(tan)?\s+i[şs]let/i,      tip: 'bilgi' },
  { regex: /sorun giderilmi[şs]/i,               tip: 'bilgi' },
  { regex: /tekrar hizmete/i,                     tip: 'bilgi' },
  { regex: /a[çc][ıi]ld[ıi]/i,                   tip: 'bilgi' },
  // Duyuru (ek sefer, ucretsiz vb.)
  { regex: /ilave.*sefer/i,                       tip: 'duyuru' },
  { regex: /[üu]cretsiz/i,                        tip: 'duyuru' },
  { regex: /ek sefer/i,                           tip: 'duyuru' },
];

function tipTespit(metin: string): 'ariza' | 'kesinti' | 'gecikme' | 'bilgi' | 'duyuru' {
  for (const { regex, tip } of TIP_KURALLAR) {
    if (regex.test(metin)) return tip as any;
  }
  return 'bilgi';
}

/* ═══════════════════════════════════════════
   "Cozuldu" tespiti — uyarinin kapanmasi
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   X API'den tweet cek
   ═══════════════════════════════════════════ */
interface XTweet {
  id: string;
  text: string;
  created_at: string;
}

async function hesaptanTweetCek(
  userId: string,
  maxResults: number = 10
): Promise<XTweet[]> {
  try {
    const url = `${X_API}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,text&exclude=retweets,replies`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    });

    if (!res.ok) {
      console.warn(`X API hata (${userId}):`, res.status);
      return [];
    }

    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.warn(`X API fetch hata (${userId}):`, e);
    return [];
  }
}

/* ═══════════════════════════════════════════
   Senkronizasyon: X → Supabase
   ─────────────────────────────────────────
   Deduplication: Birden fazla bilesen (ulasim-uyari,
   trafik-uyari) ayni anda cagirabilir. Modul seviyesinde
   kilit + minimum aralik ile cift API cagrisi onlenir.
   ═══════════════════════════════════════════ */
let _sonSenkronZaman = 0;
let _senkronKilidi = false;
const MIN_SENKRON_ARALIK_MS = 30 * 1000; // 30 saniye icinde tekrar cagriyi atla

async function tweetleriSenkronize(): Promise<{ yeni: number; guncellenen: number }> {
  // Zaten calisan bir senkronizasyon varsa atla
  if (_senkronKilidi) return { yeni: 0, guncellenen: 0 };

  // Son senkrondan bu yana yeterli sure gecmediyse atla
  const simdi = Date.now();
  if (simdi - _sonSenkronZaman < MIN_SENKRON_ARALIK_MS) {
    return { yeni: 0, guncellenen: 0 };
  }

  _senkronKilidi = true;
  _sonSenkronZaman = simdi;

  try {
    return await _tweetleriSenkronizeIc();
  } finally {
    _senkronKilidi = false;
  }
}

async function _tweetleriSenkronizeIc(): Promise<{ yeni: number; guncellenen: number }> {
  let yeniSayisi = 0;
  let guncellenenSayisi = 0;

  for (const hesap of HESAPLAR) {
    const tweetlerRaw = await hesaptanTweetCek(hesap.id, 10);

    // Eskiden yeniye sirala — "cozuldu" tespitinin dogru calismasi icin
    // (once ariza tweet'i DB'ye yazilmali, sonra "normale dondu" onu kapatmali)
    const tweetler = [...tweetlerRaw].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Son 24 saat siniri
    const yirmidortSaatOnce = Date.now() - 24 * 60 * 60 * 1000;

    for (const tweet of tweetler) {
      // 24 saatten eski tweet'leri atla
      const tweetZaman = new Date(tweet.created_at).getTime();
      if (tweetZaman < yirmidortSaatOnce) continue;

      // Ulasim uyarisi degilse atla
      // IBB Ulasim hesabi trafik odakli — tum tweet'leri al (filtre bypass)
      const ibbHesabi = hesap.kaynak === 'x:IBBUlasim';
      if (!ibbHesabi && !ulasimUyarisiMi(tweet.text)) continue;

      const hat = hatTespit(tweet.text);
      const tip = tipTespit(tweet.text);
      const cozuldu = cozulduMu(tweet.text);

      // Daha once eklenmis mi kontrol et
      const { data: mevcut } = await supabase
        .from('ulasim_uyarilari')
        .select('id, cozuldu')
        .eq('tweet_id', tweet.id)
        .maybeSingle();

      if (mevcut) {
        // Zaten var, atla
        continue;
      }

      // Eger "normale dondu" tipi bir tweet ise,
      // ayni hattaki onceki aktif uyarilari "cozuldu" isaretle
      if (cozuldu && hat !== 'Genel') {
        const { count } = await supabase
          .from('ulasim_uyarilari')
          .update({
            cozuldu: true,
            cozulme_tarihi: new Date().toISOString(),
          })
          .eq('hat', hat)
          .eq('aktif', true)
          .eq('cozuldu', false);

        guncellenenSayisi += (count || 0);
      }

      // Yeni uyari ekle
      const { error } = await supabase
        .from('ulasim_uyarilari')
        .insert({
          tweet_id: tweet.id,
          icerik: tweet.text.replace(/https?:\/\/t\.co\/\S+/g, '').trim(), // t.co linklerini kaldir
          tip,
          hat,
          tarih: tweet.created_at,
          aktif: true,
          kaynak: hesap.kaynak,
          cozuldu,
          cozulme_tarihi: cozuldu ? new Date().toISOString() : null,
        });

      if (!error) yeniSayisi++;
    }
  }

  // 48 saatten eski cozulmus uyarilari pasifle
  await supabase
    .from('ulasim_uyarilari')
    .update({ aktif: false })
    .eq('cozuldu', true)
    .lt('cozulme_tarihi', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  // 7 gunden eski tum uyarilari pasifle
  await supabase
    .from('ulasim_uyarilari')
    .update({ aktif: false })
    .lt('tarih', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return { yeni: yeniSayisi, guncellenen: guncellenenSayisi };
}

/* ═══════════════════════════════════════════
   Hook: useXUlasim
   Uygulamadan cagrilarak senkronizasyonu tetikler
   ═══════════════════════════════════════════ */
export function useXUlasim() {
  const [senkronEdiyor, setSenkronEdiyor] = useState(false);
  const [sonSenkron, setSonSenkron] = useState<Date | null>(null);
  const [sonuc, setSonuc] = useState<{ yeni: number; guncellenen: number } | null>(null);

  const senkronize = useCallback(async () => {
    if (senkronEdiyor) return;
    if (!X_BEARER_TOKEN) {
      console.warn('X Bearer Token ayarlanmamis');
      return;
    }

    try {
      setSenkronEdiyor(true);
      const result = await tweetleriSenkronize();
      setSonuc(result);
      setSonSenkron(new Date());
    } catch (e) {
      console.warn('X senkronizasyon hatasi:', e);
    } finally {
      setSenkronEdiyor(false);
    }
  }, [senkronEdiyor]);

  return { senkronize, senkronEdiyor, sonSenkron, sonuc };
}
