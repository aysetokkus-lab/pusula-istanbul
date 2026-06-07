// Pusula Istanbul — Turyol Bogaz Turu (Eminonu) Sefer Saatleri Senkronizasyonu
//
// AMAC:
//   turyol.com sefer saatleri sayfasindan Eminonu kalkisli Bogaz Turu tarifesini
//   (haftaici / cumartesi / pazar saatleri + bilet fiyati) ceker ve Supabase
//   `bogaz_turlari` tablosundaki TURYOL kaydini gunceller. UI realtime ile tepki
//   verir, `push_bogaz_trigger` fiyat/saat degisiminde admin kategorisi push atar.
//
// KAYNAK:
//   POST https://www.turyol.com/Home/Tarifeler
//   Form: TarifeKalkisId=4_104_1_101 (Bogaz Turu > Eminonu Iskele), TarifeVarisId bos
//   Cevap: server-rendered HTML — #sonucDiv icinde 3 kolonlu tablo
//   (HAFTAICI | CUMARTESI | PAZAR) + "Bilet Fiyati : NNN TL" satiri.
//
// DB ESLEME:
//   bogaz_turlari WHERE sirket_adi=TURYOL AND tur_tipi=standart (tek satir)
//   hafta_ici_saatler  ← HAFTAICI kolonu
//   hafta_sonu_saatler ← CUMARTESI kolonu (PAZAR farkliysa union alinir + uyari loglanir;
//                        DB'de tek hafta sonu kolonu var)
//   fiyat              ← "300 TL" formatinda
//
// GUVENLIK AGI (bozuk scrape'e karsi):
//   - Haftaici listesi 5 seferden azsa VEYA saat formati bozuksa DB'ye YAZILMAZ, hata cikar.
//   - Sadece degisiklik varsa UPDATE atilir (idempotent — push trigger bos yere tetiklenmez).
//
// KULLANIM:
//   node scripts/turyol-senkron.mjs              # gercek senkron
//   node scripts/turyol-senkron.mjs --dry        # DB yazmadan rapor
//   node scripts/turyol-senkron.mjs --auto       # scheduled task icin (kisitli log)
//   node scripts/turyol-senkron.mjs --verbose    # detayli rapor
//
// LOG:
//   scripts/data/turyol-senkron-log.json — her run + degisiklik audit.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const LOG_DIR = resolve(__dirname, 'data');
const LOG_PATH = resolve(LOG_DIR, 'turyol-senkron-log.json');

// === Bayraklar ===
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const AUTO = args.includes('--auto');
const VERBOSE = args.includes('--verbose');

// === .env yukleme ===
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

const TURYOL_URL = 'https://www.turyol.com/Home/Tarifeler';
const KALKIS_KODU = '4_104_1_101'; // Bogaz Turu > Eminonu Iskele

function log(...a) { if (!AUTO || VERBOSE) console.log(...a); }
function logAlways(...a) { console.log(...a); }

function appendLog(entry) {
  try {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
    let arr = [];
    if (existsSync(LOG_PATH)) {
      try { arr = JSON.parse(readFileSync(LOG_PATH, 'utf8')); } catch { arr = []; }
    }
    arr.push(entry);
    writeFileSync(LOG_PATH, JSON.stringify(arr, null, 2));
  } catch (e) {
    if (!AUTO) console.error('Log yazma hatasi:', e.message);
  }
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// "9:00" → "09:00" normalize + dogrulama
function saatNormalize(s) {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

// === Turyol scrape ===
async function turyolCek() {
  const form = new URLSearchParams({ TarifeKalkisId: KALKIS_KODU, TarifeVarisId: '' });
  const res = await fetch(TURYOL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://www.turyol.com',
      'Referer': TURYOL_URL,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PusulaIstanbul/Senkron',
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Turyol HTTP ${res.status}`);
  const html = await res.text();

  // Fiyat: "Bilet Fiyatı : 300 TL" (Turkce karakter varyasyonlarina dayanikli)
  const fiyatMatch = html.match(/Bilet\s+Fiyat[ıi]\s*:\s*([\d.,]+)\s*TL/i);
  const fiyat = fiyatMatch ? `${fiyatMatch[1]} TL` : null;

  // Tablo: id="datatable-responsive" icindeki tbody satirlari, her tr'de 3 td
  const tabloMatch = html.match(/<table id="datatable-responsive"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tabloMatch) throw new Error('Tarife tablosu HTML icinde bulunamadi — sayfa yapisi degismis olabilir');

  const haftaici = [], cumartesi = [], pazar = [];
  const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let tr;
  while ((tr = trRegex.exec(tabloMatch[1])) !== null) {
    const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m =>
      m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()
    );
    if (tds.length < 3) continue;
    const [hi, cmt, paz] = tds;
    const hiN = hi ? saatNormalize(hi) : null;
    const cmtN = cmt ? saatNormalize(cmt) : null;
    const pazN = paz ? saatNormalize(paz) : null;
    if (hi && !hiN) throw new Error(`Haftaici kolonunda saat olmayan deger: "${hi}"`);
    if (cmt && !cmtN) throw new Error(`Cumartesi kolonunda saat olmayan deger: "${cmt}"`);
    if (paz && !pazN) throw new Error(`Pazar kolonunda saat olmayan deger: "${paz}"`);
    if (hiN) haftaici.push(hiN);
    if (cmtN) cumartesi.push(cmtN);
    if (pazN) pazar.push(pazN);
  }

  return { haftaici, cumartesi, pazar, fiyat };
}

// === Supabase REST ===
async function sbSelect(qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bogaz_turlari?${qs}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase SELECT HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(qs, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bogaz_turlari?${qs}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Supabase PATCH HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// === Ana akis ===
async function main() {
  const baslangic = new Date();
  log(`Turyol senkron — ${baslangic.toISOString()}${DRY ? ' [DRY]' : ''}`);

  // 1. Siteden cek
  const { haftaici, cumartesi, pazar, fiyat } = await turyolCek();
  log(`Site: haftaici=${haftaici.length} cumartesi=${cumartesi.length} pazar=${pazar.length} fiyat=${fiyat}`);

  // 2. Guvenlik agi — supheli veri DB'ye yazilmaz
  if (haftaici.length < 5 || cumartesi.length < 5) {
    throw new Error(`Supheli veri: haftaici=${haftaici.length}, cumartesi=${cumartesi.length} sefer — sayfa bozuk olabilir, DB'ye YAZILMADI`);
  }

  // 3. Hafta sonu: cumartesi esas; pazar farkliysa union + uyari
  let haftaSonu = cumartesi;
  let pazarFarkliUyari = null;
  if (!arraysEqual(cumartesi, pazar)) {
    haftaSonu = [...new Set([...cumartesi, ...pazar])].sort();
    pazarFarkliUyari = `UYARI: Cumartesi (${cumartesi.length}) ile Pazar (${pazar.length}) farkli — union alindi (${haftaSonu.length}). DB'de tek hafta_sonu kolonu var, Ayse'ye haber ver.`;
    logAlways(pazarFarkliUyari);
  }

  // 4. DB'deki TURYOL kaydi
  const rows = await sbSelect('select=id,sirket_adi,fiyat,hafta_ici_saatler,hafta_sonu_saatler&sirket_adi=eq.TURYOL&tur_tipi=eq.standart&aktif=eq.true');
  if (rows.length !== 1) throw new Error(`TURYOL standart kaydi bulunamadi veya birden fazla: ${rows.length} satir`);
  const db = rows[0];

  // 5. Degisim kontrolu (idempotent)
  const hiFark = !arraysEqual(db.hafta_ici_saatler || [], haftaici);
  const hsFark = !arraysEqual(db.hafta_sonu_saatler || [], haftaSonu);
  const fiyatFark = fiyat !== null && db.fiyat !== fiyat;

  const ozet = {
    timestamp: new Date().toISOString(),
    dry: DRY,
    auto: AUTO,
    site: { haftaici: haftaici.length, cumartesi: cumartesi.length, pazar: pazar.length, fiyat },
    degisim: { hafta_ici: hiFark, hafta_sonu: hsFark, fiyat: fiyatFark },
    pazar_farkli_uyari: pazarFarkliUyari,
  };

  if (!hiFark && !hsFark && !fiyatFark) {
    logAlways(`OZET: degisim yok (haftaici ${haftaici.length}, hafta sonu ${haftaSonu.length} sefer, fiyat ${fiyat})${DRY ? ' [DRY]' : ''}`);
    if (!DRY) appendLog({ ...ozet, sonuc: 'no_change' });
    return;
  }

  // 6. UPDATE
  const payload = {
    hafta_ici_saatler: haftaici,
    hafta_sonu_saatler: haftaSonu,
    guncelleme_tarihi: new Date().toISOString(),
  };
  if (fiyat !== null) payload.fiyat = fiyat;

  if (!DRY) {
    await sbPatch(`id=eq.${db.id}`, payload);
  }

  ozet.sonuc = 'updated';
  ozet.eski = { fiyat: db.fiyat, hafta_ici: (db.hafta_ici_saatler || []).length, hafta_sonu: (db.hafta_sonu_saatler || []).length };
  ozet.yeni = { fiyat: fiyat ?? db.fiyat, hafta_ici: haftaici.length, hafta_sonu: haftaSonu.length };
  if (!DRY) appendLog(ozet);

  logAlways(`OZET: GUNCELLENDI${DRY ? ' [DRY — yazilmadi]' : ''} — haftaici ${ozet.eski.hafta_ici}→${haftaici.length}, hafta sonu ${ozet.eski.hafta_sonu}→${haftaSonu.length}, fiyat ${db.fiyat} → ${fiyat ?? db.fiyat}`);
  if (VERBOSE) {
    logAlways('  haftaici:', haftaici.join(', '));
    logAlways('  hafta sonu:', haftaSonu.join(', '));
  }
}

main().catch(e => {
  logAlways('FATAL:', e.message);
  appendLog({ timestamp: new Date().toISOString(), error: e.message, fatal: true });
  process.exit(1);
});
