// Pusula Istanbul — Bogaz Turu Tarife Senkronu: SEHIR HATLARI + DENTUR
//
// AMAC:
//   Sehir Hatlari (kisa + uzun Bogaz Turu) ve Dentur Avrasya (Kabatas/Besiktas
//   Bogaz Turu) tarifelerini cekip Supabase `bogaz_turlari` kayitlariyla
//   karsilastirir, degisiklik varsa gunceller. Turyol AYRI gorevde (turyol-senkron).
//
// FIRECRAWL'SIZ (24 Haz 2026 — Firecrawl aboneligi iptal edildi):
//   - Sehir Hatlari sayfalari server-rendered HTML → dogrudan fetch + regex parse.
//   - Dentur SPA ama arkasinda resmi backend API var:
//       GET https://denturavrasya.com:7284/api/WebSitePage/hatlarimiz/content-detail/bogazturu
//       Header: Accept-Language: tr  →  JSON, icinde sayfa HTML'i (tarife tablosu).
//   Bkz. DECISIONS #50 (Firecrawl yerine resmi kaynak/API pattern'i).
//
// KAYNAKLAR:
//   Sehir Hatlari kisa : https://sehirhatlari.istanbul/tr/seferler/bogaz-turlari/kisa-bogaz-turu-181
//   Sehir Hatlari uzun : https://sehirhatlari.istanbul/tr/seferler/bogaz-turlari/uzun-bogaz-turu-91
//   Dentur API         : https://denturavrasya.com:7284/api/WebSitePage/hatlarimiz/content-detail/bogazturu
//
// DB ESLEME (bogaz_turlari):
//   SEHIR HATLARI / kisa     → hafta_ici_saatler = hafta_sonu_saatler = Eminonu kalkislari
//   SEHIR HATLARI / uzun     → saatler = Eminonu kalkislari; ozel_not = "Eminonu HH:MM kalkis,
//                              Anadolu Kavagi HH:MM donus, Eminonu HH:MM varis"
//   DENTUR AVRASYA / standart→ saatler = Kabatas kolonu YILDIZSIZ (** = talebe bagli, haric)
//                              fiyat DEGISTIRILMEZ (Ayse kontrolunde) — sadece farkliysa bildirilir.
//
// GUVENLIK AGLARI:
//   - Bir kaynak cekilemez/tablo bulunamazsa o sirket ATLANIR, DB'ye dokunulmaz, bildirilir.
//   - Sehir Hatlari'nda 0 saat cikarsa yazilmaz.
//   - Dentur'da yildizsiz saat < 3 ise yazilmaz, bildirilir.
//   - Sadece gercek degisiklikte UPDATE (idempotent — push_bogaz_trigger bos tetiklenmez).
//
// KULLANIM:
//   node scripts/bogaz-diger-senkron.mjs            # gercek senkron
//   node scripts/bogaz-diger-senkron.mjs --dry      # DB yazmadan rapor
//   node scripts/bogaz-diger-senkron.mjs --auto     # scheduled task (kisitli log)
//   node scripts/bogaz-diger-senkron.mjs --verbose  # detayli rapor
//
// LOG: scripts/data/bogaz-diger-senkron-log.json

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const LOG_DIR = resolve(__dirname, 'data');
const LOG_PATH = resolve(LOG_DIR, 'bogaz-diger-senkron-log.json');

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
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch (e) {
    console.error('.env okunamadi:', e.message);
    process.exit(1);
  }
}
loadEnv();

const SUPABASE_URL = 'https://rzlfghjpsximthlolfxo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY .env\'de yok.');
  process.exit(1);
}

const SH_KISA = 'https://sehirhatlari.istanbul/tr/seferler/bogaz-turlari/kisa-bogaz-turu-181';
const SH_UZUN = 'https://sehirhatlari.istanbul/tr/seferler/bogaz-turlari/uzun-bogaz-turu-91';
const DENTUR_API = 'https://denturavrasya.com:7284/api/WebSitePage/hatlarimiz/content-detail/bogazturu';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PusulaIstanbul/Senkron';

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

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function htmlDecode(s) {
  return s
    .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
    .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&şuml;/g, 'ş')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

function saatNormalize(s) {
  const m = s.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...(opts.headers || {}) }, ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.text();
}

// === Tablo parse: HTML icindeki tum <table>'lari satir/hucre dizisine cevir ===
function parseTables(html) {
  const tables = [];
  const seen = new Set();
  for (const t of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    const rows = [];
    for (const tr of t.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
      const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map(m => htmlDecode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
        .filter(c => c);
      if (cells.length) rows.push(cells);
    }
    if (!rows.length) continue;
    const key = JSON.stringify(rows);
    if (seen.has(key)) continue; // mobil/masaustu kopyalarini ele
    seen.add(key);
    tables.push(rows);
  }
  return tables;
}

// Bir satirdaki HH:MM degerlerini sirayla dondurur
function rowTimes(cells) {
  return cells.map(saatNormalize).filter(Boolean);
}

// === SEHIR HATLARI KISA: Eminonu kalkislari ===
async function sehirHatlariKisa() {
  const html = await fetchText(SH_KISA);
  const tables = parseTables(html);
  // Eminonu ilk durak; her sefer satirinin ilk saati = Eminonu kalkis
  const saatler = [];
  for (const rows of tables) {
    const header = rows.find(r => r.some(c => /Eminönü/i.test(c)));
    if (!header) continue;
    for (const r of rows) {
      const ts = rowTimes(r);
      if (ts.length) saatler.push(ts[0]); // ilk saat = Eminonu
    }
    break; // ilk gecerli tablo yeter
  }
  return [...new Set(saatler)].sort();
}

// === SEHIR HATLARI UZUN: Eminonu kalkislari + donus/varis (ozel_not) ===
async function sehirHatlariUzun() {
  const html = await fetchText(SH_UZUN);
  const tables = parseTables(html);
  let gidis = null, donus = null;
  for (const rows of tables) {
    const flat = rows.flat();
    const iEmin = flat.findIndex(c => /Eminönü/i.test(c));
    const iAnad = flat.findIndex(c => /Anadolu Kava/i.test(c));
    if (iEmin === -1 && iAnad === -1) continue;
    // Donus tablosu: Anadolu Kavagi ilk durak (Eminonu'nden once gelir)
    if (iAnad !== -1 && (iEmin === -1 || iAnad < iEmin)) { if (!donus) donus = rows; }
    else { if (!gidis) gidis = rows; }
  }
  const eminKalkis = [];
  let ozelNot = null;
  if (gidis) {
    for (const r of gidis) { const ts = rowTimes(r); if (ts.length) eminKalkis.push(ts[0]); }
  }
  if (donus) {
    // donus ilk satir: ilk saat = Anadolu Kavagi kalkis, son saat = Eminonu varis
    for (const r of donus) {
      const ts = rowTimes(r);
      if (ts.length >= 2 && eminKalkis.length) {
        ozelNot = `Eminönü ${eminKalkis[0]} kalkış, Anadolu Kavağı ${ts[0]} dönüş, Eminönü ${ts[ts.length - 1]} varış`;
        break;
      }
    }
  }
  return { saatler: [...new Set(eminKalkis)].sort(), ozelNot };
}

// === DENTUR: API'den Kabatas yildizsiz saatler + fiyat bilgisi ===
async function denturCek() {
  const res = await fetch(DENTUR_API, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr', 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Dentur API HTTP ${res.status}`);
  const json = await res.json();
  // En uzun string alani = sayfa HTML'i
  let pageHtml = '';
  (function walk(o) {
    if (typeof o === 'string') { if (o.length > pageHtml.length) pageHtml = o; }
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  })(json);
  pageHtml = htmlDecode(pageHtml);

  const tables = parseTables(pageHtml);
  // Kabatas / Besiktas basligini iceren tabloyu bul
  let kabatas = [];
  for (const rows of tables) {
    const header = rows[0] || [];
    const kIdx = header.findIndex(c => /Kabata/i.test(c));
    if (kIdx === -1) continue;
    for (const r of rows.slice(1)) {
      const cell = r[kIdx] || '';
      if (/\*\*/.test(cell)) continue; // ** = talebe bagli, haric
      const s = saatNormalize(cell.replace(/\*/g, '').trim());
      if (s) kabatas.push(s);
    }
    break;
  }
  // Fiyat (sadece bilgi amacli — DB'yi degistirmez)
  const kabFiyat = (pageHtml.match(/Kabata[şs]\s*Tur\s*Fiyat[ıi]\s*:?\s*([\d.,]+)\s*₺/i) || [])[1];
  const besFiyat = (pageHtml.match(/Beşikta[şs]\s*Tur\s*Fiyat[ıi]\s*:?\s*([\d.,]+)\s*₺/i) || [])[1];
  return { saatler: [...new Set(kabatas)].sort(), kabFiyat, besFiyat };
}

// === Supabase REST ===
async function sbSelect(qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bogaz_turlari?${qs}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase SELECT HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}
async function sbPatch(id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bogaz_turlari?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Supabase PATCH HTTP ${res.status}: ${await res.text()}`);
}

// === Tek bir DB satirini guncelle (saatler [+ ozel_not]) ===
async function senkronEt(sonuc, kayit, yeniSaatler, yeniOzelNot) {
  const db = kayit.db;
  const saatFark = !arraysEqual(db.hafta_ici_saatler || [], yeniSaatler);
  const notFark = yeniOzelNot != null && (db.ozel_not || '') !== yeniOzelNot;
  if (!saatFark && !notFark) {
    sonuc.degismedi.push(kayit.ad);
    return;
  }
  const payload = { hafta_ici_saatler: yeniSaatler, hafta_sonu_saatler: yeniSaatler, guncelleme_tarihi: new Date().toISOString() };
  if (notFark) payload.ozel_not = yeniOzelNot;
  if (!DRY) await sbPatch(db.id, payload);
  sonuc.guncellendi.push({
    ad: kayit.ad,
    eski_saat: db.hafta_ici_saatler || [], yeni_saat: yeniSaatler,
    eski_not: db.ozel_not || null, yeni_not: notFark ? yeniOzelNot : undefined,
  });
}

async function main() {
  const baslangic = new Date();
  log(`Bogaz diger senkron — ${baslangic.toISOString()}${DRY ? ' [DRY]' : ''}`);

  const sonuc = { timestamp: baslangic.toISOString(), dry: DRY, auto: AUTO, guncellendi: [], degismedi: [], atlandi: [], fiyat_uyari: [] };

  // DB kayitlari
  const dbRows = await sbSelect("select=id,sirket_adi,tur_tipi,fiyat,hafta_ici_saatler,hafta_sonu_saatler,ozel_not&or=(sirket_adi.ilike.*EHİR HATLAR*,sirket_adi.ilike.*DENTUR*)");
  const findDb = (sirketPart, tur) => dbRows.find(r => r.sirket_adi.toUpperCase().includes(sirketPart) && r.tur_tipi === tur);

  // --- SEHIR HATLARI KISA ---
  try {
    const saatler = await sehirHatlariKisa();
    log(`SH kisa: ${saatler.length} sefer → ${saatler.join(', ')}`);
    if (saatler.length < 1) throw new Error('0 sefer cikti');
    const db = findDb('HATLAR', 'kisa');
    if (!db) throw new Error('DB kisa kaydi yok');
    await senkronEt(sonuc, { ad: 'Sehir Hatlari kisa', db }, saatler, null);
  } catch (e) { sonuc.atlandi.push({ ad: 'Sehir Hatlari kisa', sebep: e.message }); logAlways('ATLANDI (SH kisa):', e.message); }

  // --- SEHIR HATLARI UZUN ---
  try {
    const { saatler, ozelNot } = await sehirHatlariUzun();
    log(`SH uzun: ${saatler.length} sefer → ${saatler.join(', ')} | not: ${ozelNot}`);
    if (saatler.length < 1) throw new Error('0 sefer cikti');
    const db = findDb('HATLAR', 'uzun');
    if (!db) throw new Error('DB uzun kaydi yok');
    await senkronEt(sonuc, { ad: 'Sehir Hatlari uzun', db }, saatler, ozelNot);
  } catch (e) { sonuc.atlandi.push({ ad: 'Sehir Hatlari uzun', sebep: e.message }); logAlways('ATLANDI (SH uzun):', e.message); }

  // --- DENTUR ---
  try {
    const { saatler, kabFiyat, besFiyat } = await denturCek();
    log(`Dentur: ${saatler.length} yildizsiz sefer → ${saatler.join(', ')} | fiyat K:${kabFiyat} B:${besFiyat}`);
    if (saatler.length < 3) throw new Error(`yildizsiz saat ${saatler.length} < 3 (supheli)`);
    const db = findDb('DENTUR', 'standart');
    if (!db) throw new Error('DB Dentur standart kaydi yok');
    await senkronEt(sonuc, { ad: 'Dentur', db }, saatler, null); // fiyat dokunulmaz
    // Fiyat bilgisi degismis mi? (sadece bildir)
    if (kabFiyat || besFiyat) {
      const dbHasK = kabFiyat && db.fiyat && db.fiyat.includes(kabFiyat);
      const dbHasB = besFiyat && db.fiyat && db.fiyat.includes(besFiyat);
      if ((kabFiyat && !dbHasK) || (besFiyat && !dbHasB)) {
        sonuc.fiyat_uyari.push(`Dentur fiyat sitede K:${kabFiyat}₺ B:${besFiyat}₺ — DB: "${db.fiyat}" (elle kontrol et)`);
      }
    }
  } catch (e) { sonuc.atlandi.push({ ad: 'Dentur', sebep: e.message }); logAlways('ATLANDI (Dentur):', e.message); }

  // === Raporlama ===
  const degisimVar = sonuc.guncellendi.length > 0 || sonuc.atlandi.length > 0 || sonuc.fiyat_uyari.length > 0;
  if (!DRY) appendLog(sonuc);

  if (!degisimVar) {
    logAlways(`OZET: degisiklik yok (${sonuc.degismedi.join(', ')})${DRY ? ' [DRY]' : ''}`);
    return;
  }
  logAlways(`OZET${DRY ? ' [DRY — yazilmadi]' : ''}:`);
  for (const g of sonuc.guncellendi) {
    logAlways(`  GUNCELLENDI ${g.ad}: saat [${g.eski_saat.join(',')}] → [${g.yeni_saat.join(',')}]`);
    if (g.yeni_not !== undefined) logAlways(`    not: "${g.eski_not}" → "${g.yeni_not}"`);
  }
  for (const a of sonuc.atlandi) logAlways(`  ATLANDI ${a.ad}: ${a.sebep}`);
  for (const f of sonuc.fiyat_uyari) logAlways(`  FIYAT UYARI: ${f}`);
  if (sonuc.degismedi.length) logAlways(`  degismedi: ${sonuc.degismedi.join(', ')}`);
}

main().catch(e => {
  logAlways('FATAL:', e.message);
  appendLog({ timestamp: new Date().toISOString(), error: e.message, fatal: true });
  process.exit(1);
});
