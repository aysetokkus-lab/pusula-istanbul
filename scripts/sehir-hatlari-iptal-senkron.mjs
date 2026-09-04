// Pusula Istanbul — Sehir Hatlari Iptal Sefer Duyurulari Senkronu
//
// AMAC:
//   Sehir Hatlari iptal/sefer duyurularini cekip Supabase `ulasim_uyarilari`
//   tablosuna senkronize eder. Etki tarihi gecmis duyurular otomatik pasif yapilir.
//
// FIRECRAWL'SIZ (24 Haz 2026 — Firecrawl aboneligi iptal edildi):
//   sehirhatlari.istanbul sayfalari server-rendered HTML → dogrudan fetch + parse.
//   Bkz. DECISIONS #50.
//
// BUGFIX (3 Agu 2026):
//   Eski surum, iptal-seferler sayfasinda GOSTERILEN duyurunun govdesini
//   "Diger Duyurular" listesindeki EN YENI duyurunun basligiyla birlestiriyordu.
//   Sonuc: "Mehtap Turu" basligi + sis iptali govdesi gibi karisik kayitlar.
//   Ayrica 'DivTumDuyurular' kesim noktasi bir tag ID'sinin ortasina denk
//   geldiginden metne "<div id=ctl00_..." yarim HTML etiketi siziyordu.
//   YENI MANTIK:
//     A) iptal-seferler'de gosterilen guncel iptal duyurusu → KENDI kaydi
//        (tweet_id = "sh-iptal-<icerik-hash>", baslik eklenmez).
//        "Iptal seferimiz bulunmamaktadir" goruluyorsa kayit acilmaz.
//     B) Diger Duyurular'daki en yeni duyuru → KENDI detay sayfasindan
//        baslik + govde + yayin tarihi cekilir (tutarli tek kaynak).
//        Ekstra maliyet: kosu basina +1 istek (30 dk'da bir → onemsiz).
//   `tarih` artik cekim ani degil, duyurunun yayin tarihi (varsa).
//
// KAYNAK:
//   https://sehirhatlari.istanbul/tr/iptal-seferler
//   + /tr/duyurular/<slug>-<id> detay sayfalari
//
// SESSIZ MOD:
//   delta = (yeni + guncellenen + pasiflesen) kayit sayisi.
//   delta = 0 → rapor/bildirim yok, tek satir "Degisiklik yok (delta=0)".
//   Hata olursa her zaman bildirilir.
//
// TABLO: ulasim_uyarilari
//   tweet_id (UNIQUE, "sh-<id>" veya "sh-iptal-<hash>"), kaynak ('web:sehirhatlari'),
//   icerik, tip ('kesinti'/'duyuru'), hat, aktif (bool), cozuldu (false), tarih (timestamptz)
//
// KULLANIM:
//   node scripts/sehir-hatlari-iptal-senkron.mjs            # gercek senkron
//   node scripts/sehir-hatlari-iptal-senkron.mjs --dry      # DB yazmadan rapor
//   node scripts/sehir-hatlari-iptal-senkron.mjs --auto     # scheduled task
//   node scripts/sehir-hatlari-iptal-senkron.mjs --verbose  # detayli
//
// LOG: scripts/data/sehir-hatlari-iptal-senkron-log.json

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const LOG_DIR = resolve(__dirname, 'data');
const LOG_PATH = resolve(LOG_DIR, 'sehir-hatlari-iptal-senkron-log.json');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const AUTO = args.includes('--auto');
const VERBOSE = args.includes('--verbose');

function loadEnv() {
  try {
    const raw = readFileSync(ENV_PATH, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch (e) { console.error('.env okunamadi:', e.message); process.exit(1); }
}
loadEnv();

const SUPABASE_URL = 'https://rzlfghjpsximthlolfxo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY .env\'de yok.'); process.exit(1); }

const BASE = 'https://sehirhatlari.istanbul';
const IPTAL_URL = `${BASE}/tr/iptal-seferler`;
const KAYNAK = 'web:sehirhatlari';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PusulaIstanbul/Senkron';

const AYLAR = { 'ocak': 1, 'şubat': 2, 'subat': 2, 'mart': 3, 'nisan': 4, 'mayıs': 5, 'mayis': 5, 'haziran': 6, 'temmuz': 7, 'ağustos': 8, 'agustos': 8, 'eylül': 9, 'eylul': 9, 'ekim': 10, 'kasım': 11, 'kasim': 11, 'aralık': 12, 'aralik': 12 };

function log(...a) { if (!AUTO || VERBOSE) console.log(...a); }
function logAlways(...a) { console.log(...a); }

function appendLog(entry) {
  try {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
    let arr = [];
    if (existsSync(LOG_PATH)) { try { arr = JSON.parse(readFileSync(LOG_PATH, 'utf8')); } catch { arr = []; } }
    arr.push(entry);
    writeFileSync(LOG_PATH, JSON.stringify(arr, null, 2));
  } catch (e) { if (!AUTO) console.error('Log yazma hatasi:', e.message); }
}

function htmlDecode(s) {
  return s
    .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
    .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

// BUGFIX: sondaki YARIM (kapanmamis) etiket de temizlenir — "<div id=ctl00_..."
// sizintisinin ikinci savunma hatti.
function stripTags(s) {
  return htmlDecode(s.replace(/<[^>]+>/g, ' ').replace(/<[^>]*$/, ' ')).replace(/\s+/g, ' ').trim();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.text();
}

// Duyuru detay govdesini temiz cikar: notice-detail-text-content div'inin
// ICERIGI → DivTumDuyurular'in TAG BASLANGICINA ('<' karakterine) kadar.
// BUGFIX: eskiden kesim 'DivTumDuyurular' string'inden yapiliyordu; bu nokta
// "<div id=ctl00_ContentPlaceHolder1_DivTumDuyurular" tag'inin ORTASI oldugundan
// yarim etiket metne siziyordu. Yayin tarihi paragrafi (news-detail-date)
// etki tarihi hesabini kirletmesin diye atilir.
function extractBody(html) {
  const i = html.indexOf('notice-detail-text-content');
  if (i === -1) return '';
  const gt = html.indexOf('>', i);
  if (gt === -1) return '';
  const td = html.indexOf('DivTumDuyurular', gt);
  let end;
  if (td !== -1) {
    const lt = html.lastIndexOf('<', td);
    end = lt > gt ? lt : td;
  } else {
    end = Math.min(gt + 4000, html.length);
  }
  let block = html.slice(gt + 1, end);
  block = block.replace(/<p[^>]*news-detail-date[^>]*>[\s\S]*?<\/p>/i, '');
  return stripTags(block);
}

// Sayfadaki yayin tarihini (dd.mm.yyyy) cek
function yayinTarihiBul(html) {
  const m = html.match(/news-detail-date"?>\s*([\d.]+)/);
  return m ? m[1].trim() : null;
}

// "dd.mm.yyyy" → ISO (Istanbul gunu baslangici). Parse edilemezse null.
function trToIso(ddmmyyyy) {
  if (!ddmmyyyy) return null;
  const m = ddmmyyyy.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  const [, g, a, y] = m;
  if (+a < 1 || +a > 12 || +g < 1 || +g > 31) return null;
  return `${y}-${String(a).padStart(2, '0')}-${String(g).padStart(2, '0')}T00:00:00+03:00`;
}

function bugun0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

// Metinden TUM tarihleri topla, en gec olani dondur (etki tarihi sonu).
// Destekler: "22-29 Haziran 2026", "29 Haziran - 2 Temmuz 2026", "5 Haziran 2026", "16.06.2026"
function enGecEtkiTarihi(text) {
  const t = text.toLocaleLowerCase('tr');
  const adaylar = [];
  // gun-gun Ay Yil  (22-29 Haziran 2026)
  for (const m of t.matchAll(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/g)) {
    const ay = AYLAR[m[3]]; if (ay) adaylar.push(new Date(+m[4], ay - 1, +m[2]));
  }
  // gun Ay - gun Ay Yil  (29 Haziran - 2 Temmuz 2026)
  for (const m of t.matchAll(/(\d{1,2})\s+([a-zçğıöşü]+)\s*[-–]\s*(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/g)) {
    const ay2 = AYLAR[m[4]]; if (ay2) adaylar.push(new Date(+m[5], ay2 - 1, +m[3]));
  }
  // gun Ay Yil  (5 Haziran 2026)
  for (const m of t.matchAll(/(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/g)) {
    const ay = AYLAR[m[2]]; if (ay) adaylar.push(new Date(+m[3], ay - 1, +m[1]));
  }
  // dd.mm.yyyy
  for (const m of t.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})/g)) {
    adaylar.push(new Date(+m[3], +m[2] - 1, +m[1]));
  }
  const gecerli = adaylar.filter(d => !isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() < 2100);
  if (!gecerli.length) return null;
  return new Date(Math.max(...gecerli.map(d => d.getTime())));
}

// Etki tarihine gore aktiflik. Tarih yoksa guvenli varsayim: aktif=true.
function aktifMi(text) {
  const son = enGecEtkiTarihi(text);
  if (!son) return true;
  return son.getTime() >= bugun0().getTime();
}

function hatTespit(text) {
  // 1) Tire'li hat adi: "Bostancı-Moda-Karaköy-Kabataş Hattı"
  let m = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:-[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)\s+Hatt[ıi]/);
  if (m) return `${m[1]} Hattı`;
  // 2) Tek/iki buyuk harfli kelime: "Boğaz Hattı", "Adalar Hattı"
  m = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?)\s+Hatt[ıi]/);
  if (m) return `${m[1]} Hattı`;
  return 'Şehir Hatları';
}

function tipTespit(text) {
  return /(iptal|yapılamayacak|uğrama|kaldır|gerçekleştirileme|seferler.{0,6}iptal)/i.test(text) ? 'kesinti' : 'duyuru';
}

// Ulasimla acikca ALAKASIZ duyurular (kurumsal/idari) atlanir.
function alakasizMi(baslik) {
  return /(genel kurul|kamuoyu|ihale|kongre|bilanço|olağan|çağrı)/i.test(baslik);
}

// "Iptal seferimiz bulunmamaktadir" → aktif kesinti yok demektir.
function iptalYokMu(text) {
  return /iptal\s+seferimiz\s+bulunmamaktad/i.test(text);
}

function idFromSlug(href) {
  const m = href.match(/-(\d+)\/?$/);
  return m ? m[1] : null;
}

// === Iptal sayfasini parse et: gosterilen duyuru govdesi + diger duyuru linkleri ===
function parseIndex(html) {
  const anaMetin = extractBody(html);
  const yayinTarihi = yayinTarihiBul(html);
  const tumDuyIdx = html.indexOf('DivTumDuyurular');

  const linkler = [];
  if (tumDuyIdx !== -1) {
    const blok = html.slice(tumDuyIdx, tumDuyIdx + 4000);
    for (const m of blok.matchAll(/<a[^>]+href="([^"]*\/tr\/duyurular\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = m[1]; const baslik = stripTags(m[2]);
      const id = idFromSlug(href);
      if (!id || !baslik || /tüm duyurular/i.test(baslik)) continue;
      linkler.push({ id, baslik, href: href.startsWith('http') ? href : BASE + href });
    }
  }
  return { anaMetin, yayinTarihi, linkler };
}

// === Supabase REST ===
async function sbSelect(qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ulasim_uyarilari?${qs}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase SELECT HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}
async function sbUpsert(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ulasim_uyarilari?on_conflict=tweet_id`, {
    method: 'POST',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase UPSERT HTTP ${res.status}: ${await res.text()}`);
}
async function sbPatch(qs, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ulasim_uyarilari?${qs}`, {
    method: 'PATCH',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Supabase PATCH HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const baslangic = new Date();
  log(`Sehir Hatlari iptal senkron — ${baslangic.toISOString()}${DRY ? ' [DRY]' : ''}`);

  // 1. Index'i cek
  const html = await fetchText(IPTAL_URL);
  const { anaMetin, yayinTarihi, linkler } = parseIndex(html);
  if (!anaMetin && !linkler.length) {
    throw new Error('Iptal sayfasi parse edilemedi (metin de link de yok) — yapi degismis olabilir');
  }

  // 2. DB'deki mevcut kayitlar
  const mevcut = await sbSelect(`kaynak=eq.${KAYNAK}&select=tweet_id,icerik,aktif,tarih`);
  const mevcutMap = new Map(mevcut.map(r => [r.tweet_id, r]));

  const kayitlar = [];

  // 3a. KAYIT A — iptal-seferler'de GOSTERILEN guncel iptal duyurusu.
  //     Kimligi icerik hash'i: metin degisirse yeni kayit acilir, eskisi
  //     adim 6'da otomatik pasiflenir. Baslik EKLENMEZ (baslik listeden degil,
  //     govdenin kendisinden gelmeli — karisik kayit bug'inin kaynagi buydu).
  if (anaMetin && !iptalYokMu(anaMetin)) {
    const hash = createHash('sha1').update(anaMetin).digest('hex').slice(0, 12);
    kayitlar.push({
      tweet_id: `sh-iptal-${hash}`,
      kaynak: KAYNAK,
      icerik: anaMetin.slice(0, 500),
      tip: tipTespit(anaMetin),
      hat: hatTespit(anaMetin),
      aktif: aktifMi(anaMetin),
      cozuldu: false,
      tarih: trToIso(yayinTarihi) || new Date().toISOString(),
    });
    log(`Iptal duyurusu: sh-iptal-${hash} — ${anaMetin.slice(0, 60)}...`);
  } else {
    log('Gosterilen iptal duyurusu yok ("iptal seferimiz bulunmamaktadir" veya bos).');
  }

  // 3b. KAYIT B — Diger Duyurular'daki EN YENI duyuru, KENDI detay sayfasindan.
  //     Baslik + govde + yayin tarihi ayni sayfadan gelir → karisiklik imkansiz.
  //     Detay her kosuda cekilir (+1 istek): DB'deki eski/bozuk icerige
  //     guvenmek onceki bug'da oldugu gibi yaniltici olabiliyor.
  const ana = linkler[0] || null;
  if (ana && !alakasizMi(ana.baslik)) {
    const detayHtml = await fetchText(ana.href);
    const govde = extractBody(detayHtml);
    const detayTarih = trToIso(yayinTarihiBul(detayHtml));
    if (govde) {
      const eskiB = mevcutMap.get(`sh-${ana.id}`);
      kayitlar.push({
        tweet_id: `sh-${ana.id}`,
        kaynak: KAYNAK,
        icerik: `${ana.baslik} — ${govde}`.slice(0, 500),
        tip: tipTespit(`${ana.baslik} ${govde}`),
        hat: hatTespit(govde),
        aktif: aktifMi(govde),
        cozuldu: false,
        // Yayin tarihi > DB'deki eski tarih > simdi (cekim ani SON care)
        tarih: detayTarih || (eskiB && eskiB.tarih) || new Date().toISOString(),
      });
      log(`Duyuru: ${ana.baslik} (sh-${ana.id})`);
    } else {
      log(`UYARI: sh-${ana.id} detay govdesi parse edilemedi, atlandi.`);
    }
  }

  const gorulenTweetIds = new Set(kayitlar.filter(k => k.aktif).map(k => k.tweet_id));

  // 4. Delta hesabi: gercekten yeni veya icerik/aktiflik degisen kayitlar
  let yeni = 0, guncel = 0;
  const degisenler = [];
  const degisenKayitlar = [];
  for (const k of kayitlar) {
    const eski = mevcutMap.get(k.tweet_id);
    if (!eski) {
      yeni++; degisenKayitlar.push(k);
      degisenler.push(`YENI ${k.tweet_id} [${k.aktif ? 'aktif' : 'pasif'}] ${k.icerik.slice(0, 60)}`);
    } else if ((eski.icerik || '') !== k.icerik || !!eski.aktif !== !!k.aktif) {
      guncel++; degisenKayitlar.push(k);
      degisenler.push(`GUNCEL ${k.tweet_id} aktif:${eski.aktif}→${k.aktif}`);
    }
  }

  // 6. Sayfada gorulmeyen AMA DB'de aktif olan kayitlari pasif yap
  const pasifAdaylar = mevcut.filter(r => r.aktif && !gorulenTweetIds.has(r.tweet_id)).map(r => r.tweet_id);
  let pasiflenen = pasifAdaylar.length;

  const delta = yeni + guncel + pasiflenen;

  const ozet = {
    timestamp: baslangic.toISOString(), dry: DRY, auto: AUTO,
    ana: ana ? ana.baslik : null,
    iptalDuyurusu: anaMetin ? anaMetin.slice(0, 80) : null,
    yeni, guncellenen: guncel, pasiflenen, delta,
    degisenler: VERBOSE ? degisenler : degisenler.slice(0, 10),
  };

  // 7. SESSIZ MOD
  if (delta === 0) {
    logAlways(`Değişiklik yok — sessiz çıkış (delta=0)${DRY ? ' [DRY]' : ''}`);
    if (!DRY) appendLog({ ...ozet, sonuc: 'no_change' });
    return;
  }

  // 8. Yaz — SADECE degisen kayitlar (degismeyenlerin tarih'i ellenmez)
  if (!DRY) {
    if (degisenKayitlar.length) await sbUpsert(degisenKayitlar);
    if (pasifAdaylar.length) {
      // PostgREST in.() ile toplu pasif
      const list = pasifAdaylar.map(t => `"${t}"`).join(',');
      await sbPatch(`kaynak=eq.${KAYNAK}&tweet_id=in.(${list})`, { aktif: false });
    }
    appendLog({ ...ozet, sonuc: 'changed' });
  }

  logAlways(`OZET${DRY ? ' [DRY — yazilmadi]' : ''}: yeni=${yeni}, guncellenen=${guncel}, pasiflenen=${pasiflenen} (delta=${delta})`);
  for (const d of (VERBOSE ? degisenler : degisenler.slice(0, 10))) logAlways(`  ${d}`);
  if (pasiflenen) logAlways(`  pasiflenen tweet_id: ${pasifAdaylar.join(', ')}`);
}

main().catch(e => {
  logAlways('FATAL:', e.message);
  appendLog({ timestamp: new Date().toISOString(), error: e.message, fatal: true });
  process.exit(1);
});
