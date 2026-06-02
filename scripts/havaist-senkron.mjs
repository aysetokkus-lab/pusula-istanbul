// Pusula Istanbul — Havaist Sefer Saatleri Senkronizasyonu
//
// AMAC:
//   hava.ist resmi backend API'sinden tum Havaist hatlarinin (HVL ve HVIST)
//   sefer saatlerini, fiyatlarini ve guzergahlarini ceker ve Supabase
//   `havalimani_seferleri` tablosunu gunceller. UI tarafi realtime subscription
//   ile anlik tepki verir (`use-ulasim-tarife.ts`), trigger `push_havalimani_trigger`
//   ise fiyat/saat degisikliklerinde tum kullaniciya push notification gonderir.
//
// KAYNAK:
//   POST https://s.hava.ist/api.php?query=get-from-stations         (tum duraklar + line_id)
//   POST https://s.hava.ist/api.php?query=get-to-stations-price     (her hat icin saat + fiyat)
//   Headers: Origin/Referer = www.hava.ist, X-Requested-With = XMLHttpRequest
//
// KAPSAM:
//   Sadece Havaist (IST + HVIST-13 Sabiha transferi dahil). Havabus (SAW) bu
//   API'de yok — eski admin panel + Excel pattern'i ile yonetilmeye devam edilir.
//
// IDEMPOTENT:
//   Her hat icin (line_id, lineType, durak_id) anahtariyla UPSERT yapilir. Mevcut
//   kayitlarin user-friendly alanlari (`durak_adi`, `not_bilgi`, guzergah aciklamalari)
//   override EDILMEZ. Sadece su kolonlar guncellenir: sehirden_hav, havdan_sehir,
//   fiyat, sure, kaynak, tarife_donemi, guncelleme_tarihi.
//
// KULLANIM:
//   node scripts/havaist-senkron.mjs              # gercek senkron (sessiz)
//   node scripts/havaist-senkron.mjs --dry        # hicbir DB yazma, sadece rapor
//   node scripts/havaist-senkron.mjs --auto       # scheduled task icin (kisitli log)
//   node scripts/havaist-senkron.mjs --verbose    # detayli rapor
//
// LOG:
//   scripts/data/havaist-senkron-log.json — her run + degisiklik audit.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const LOG_DIR = resolve(__dirname, 'data');
const LOG_PATH = resolve(LOG_DIR, 'havaist-senkron-log.json');

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

const HAVAIST_API = 'https://s.hava.ist/api.php';
const API_HEADERS = {
  'Origin': 'https://www.hava.ist',
  'Referer': 'https://www.hava.ist/',
  'User-Agent': 'PusulaIstanbul/Senkron (Node)',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/x-www-form-urlencoded',
};

function log(...a) { if (!AUTO || VERBOSE) console.log(...a); }
function logAlways(...a) { console.log(...a); }

// === DB durak_id → API line_id mapping ===
//
// Her DB satiri bir Havaist hattinin "endpoint" durağına karşılık gelir.
// Bir hatta birden fazla durak DB'de varsa (orn: HVL-9 Taksim + Besiktas),
// hepsi ayni saatleri paylasir cunku ayni hattir. Bahcesehir = HVL-7 ara durak.
//
// type: 'ibb' (HVL kodlu) veya 'havaist' (HVIST kodlu)
//
// firma her zaman 'havaist', havalimani 'IST'. HVIST-13 (Sabiha transferi) de
// IST sekmesi altinda gosterilir: kullanici "IST'e Sabiha'dan nasil gidilir"
// sorusunu IST sekmesinden bekler.
const DURAKLAR = [
  // === HVL hatlari (IBB tipi) ===
  { durak_id: 'aksaray',                  durak_adi: 'Aksaray',                  line_id: 26, type: 'ibb',     not_bilgi: 'Sultanahmet için en yakın durak' },
  { durak_id: 'beylikduzu',               durak_adi: 'Beylikdüzü',               line_id: 15, type: 'ibb',     not_bilgi: 'HVL-2 hattı (Marmarapark başlangıç)' },
  { durak_id: 'otogar_esenler',           durak_adi: 'Otogar (Esenler)',         line_id:  6, type: 'ibb',     not_bilgi: 'HVL-3 hattı' },
  { durak_id: 'merter_bakirkoy',          durak_adi: 'Merter / Bakırköy',        line_id:  9, type: 'ibb',     not_bilgi: 'HVL-4 hattı (Bakırköy İDO ana)' },
  { durak_id: 'kadikoy',                  durak_adi: 'Kadıköy',                  line_id: 32, type: 'ibb',     not_bilgi: 'HVL-6 hattı — Anadolu yakası' },
  { durak_id: 'avcilar',                  durak_adi: 'Avcılar',                  line_id: 17, type: 'ibb',     not_bilgi: 'HVL-7 hattı' },
  { durak_id: 'bahçeşehir_merkez',        durak_adi: 'Bahçeşehir Merkez',        line_id: 17, type: 'ibb',     not_bilgi: 'HVL-7 hattı (Avcılar ara durak)' },
  { durak_id: 'halkalı_i_stasyon',        durak_adi: 'Halkalı İstasyon',         line_id: 31, type: 'ibb',     not_bilgi: 'HVL-8 hattı' },
  { durak_id: 'taksim',                   durak_adi: 'Taksim',                   line_id: 23, type: 'ibb',     not_bilgi: 'HVL-9 hattı (Beşiktaş + 4. Levent ara durak)' },
  { durak_id: 'besiktas',                 durak_adi: 'Beşiktaş',                 line_id: 23, type: 'ibb',     not_bilgi: 'HVL-9 Taksim hattı ara durağı' },

  // === HVIST hatlari (Havaist tipi) ===
  { durak_id: 'arnavutkoy',               durak_adi: 'Arnavutköy',               line_id: 30, type: 'havaist', not_bilgi: 'HVİST-5A hattı' },
  { durak_id: 'silivri_catalca',          durak_adi: 'Silivri / Çatalca',        line_id: 14, type: 'havaist', not_bilgi: 'HVİST-7 hattı' },
  { durak_id: 'sultanahmet_çatladıkapı',  durak_adi: 'Sultanahmet-Çatladıkapı',  line_id: 32, type: 'havaist', not_bilgi: 'HVİST-11 hattı (Eminönü-Şişhane ara)' },
  { durak_id: 'sabiha_gokcen',            durak_adi: 'Sabiha Gökçen Havalimanı', line_id:  3, type: 'havaist', not_bilgi: 'HVİST-13 — IST-SAW arası transfer' },
];

// === Yardimcilar ===
async function api(query, body = {}) {
  const url = `${HAVAIST_API}?query=${query}`;
  const form = new URLSearchParams(body);
  const res = await fetch(url, { method: 'POST', headers: API_HEADERS, body: form.toString() });
  if (!res.ok) throw new Error(`API ${query} HTTP ${res.status}`);
  const data = await res.json();
  if (!data.status) throw new Error(`API ${query} status=false: ${JSON.stringify(data).slice(0,200)}`);
  return data.data;
}

async function sbSelect(qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/havalimani_seferleri?${qs}`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase SELECT HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(qs, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/havalimani_seferleri?${qs}`, {
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

async function sbInsert(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/havalimani_seferleri`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Supabase INSERT HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

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

function tariffePeriyot() {
  const now = new Date();
  const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return `${aylar[now.getMonth()]} ${now.getFullYear()}`;
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// === Ana akis ===
async function main() {
  const baslangic = new Date();
  log(`Havaist senkron — ${baslangic.toISOString()}${DRY ? ' [DRY]' : ''}`);

  // 1. API'den tum istasyonlari cek (line_id -> endpoint station eslemesi icin)
  const stations = await api('get-from-stations');
  log(`API: ${stations.length} durak alindi`);

  // 2. Her benzersiz (line_id, type) icin endpoint station_id'leri belirle
  //    - airport (station_id=3, master=1) outbound icin
  //    - non-airport stations inbound icin (hepsi ayni saati doner, ilkini al)
  const lineEndpoint = new Map();  // key: `${line_id}_${type}` → { airportSid:3, nonAirportSid:N }
  for (const s of stations) {
    if (!s.line) continue;
    const k = `${s.line.line_id}_${s.type}`;
    if (!lineEndpoint.has(k)) lineEndpoint.set(k, { airportSid: 3, nonAirportSid: null, lineInfo: s.line });
    const entry = lineEndpoint.get(k);
    if (s.master === 0 && entry.nonAirportSid === null) entry.nonAirportSid = s.station_id;
  }

  // 3. Her hat icin outbound + inbound saatlerini cek
  const hatVerisi = new Map();  // key: `${line_id}_${type}` → { sehirden_hav, havdan_sehir, fiyat, sure, shortname }
  for (const [k, ep] of lineEndpoint.entries()) {
    const [lid, typ] = k.split('_');
    try {
      // outbound: airport → city
      const out = await api('get-to-stations-price', {
        branch_id: '1', line_id: lid, from_station_id: String(ep.airportSid), lineType: typ,
      });
      // inbound: city → airport (varsa)
      let inb = null;
      if (ep.nonAirportSid !== null) {
        inb = await api('get-to-stations-price', {
          branch_id: '1', line_id: lid, from_station_id: String(ep.nonAirportSid), lineType: typ,
        });
      }
      const fiyat = out?.price?.ticket?.price ? `${out.price.ticket.price}₺` : null;
      const sure = out?.travel_time ? `${out.travel_time} dk` : null;
      hatVerisi.set(k, {
        havdan_sehir: out?.all_trips || [],         // airport'tan kalkanlar = havalimanindan sehre
        sehirden_hav: inb?.all_trips || [],         // sehirden kalkanlar = sehirden havalimanina
        fiyat, sure,
        shortname: out?.shortname || ep.lineInfo?.shortname,
      });
      log(`  ${out?.shortname || k}: gidis=${(inb?.all_trips||[]).length} donus=${(out?.all_trips||[]).length} fiyat=${fiyat}`);
      // Hafif rate-limit
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      logAlways(`  HATA: hat ${k} cekilemedi — ${e.message}`);
    }
  }

  // 4. DB'deki mevcut tum havaist/IST kayitlarini cek
  const dbRows = await sbSelect('select=id,durak_id,durak_adi,fiyat,sure,sehirden_hav,havdan_sehir,not_bilgi&firma=eq.havaist&havalimani=eq.IST');
  const dbByDurakId = new Map(dbRows.map(r => [r.durak_id, r]));
  log(`DB: ${dbRows.length} mevcut Havaist/IST kaydi`);

  // 5. Her tanimli durak icin update veya insert
  const periyot = tariffePeriyot();
  const kaynak = 's.hava.ist API';
  const degisiklikler = [];
  let updateCount = 0, insertCount = 0, noChangeCount = 0, errorCount = 0;

  for (const durak of DURAKLAR) {
    const hatKey = `${durak.line_id}_${durak.type}`;
    const veri = hatVerisi.get(hatKey);
    if (!veri) {
      logAlways(`  ATLA: ${durak.durak_id} — hat verisi yok (line ${hatKey})`);
      errorCount++;
      continue;
    }
    if (!veri.sehirden_hav.length && !veri.havdan_sehir.length) {
      logAlways(`  ATLA: ${durak.durak_id} — bos saat listesi`);
      errorCount++;
      continue;
    }

    const mevcut = dbByDurakId.get(durak.durak_id);
    const guncelPayload = {
      sehirden_hav: veri.sehirden_hav,
      havdan_sehir: veri.havdan_sehir,
      fiyat: veri.fiyat,
      sure: veri.sure,
      kaynak,
      tarife_donemi: periyot,
      guncelleme_tarihi: new Date().toISOString(),
    };

    if (mevcut) {
      // Degisim var mi?
      const farkVar =
        !arraysEqual(mevcut.sehirden_hav || [], veri.sehirden_hav) ||
        !arraysEqual(mevcut.havdan_sehir || [], veri.havdan_sehir) ||
        mevcut.fiyat !== veri.fiyat ||
        mevcut.sure !== veri.sure;

      if (!farkVar) {
        noChangeCount++;
        continue;
      }

      degisiklikler.push({
        type: 'update',
        durak_id: durak.durak_id,
        eski_fiyat: mevcut.fiyat,
        yeni_fiyat: veri.fiyat,
        eski_gidis: (mevcut.sehirden_hav || []).length,
        yeni_gidis: veri.sehirden_hav.length,
        eski_donus: (mevcut.havdan_sehir || []).length,
        yeni_donus: veri.havdan_sehir.length,
      });

      if (!DRY) {
        try {
          await sbPatch(`id=eq.${mevcut.id}`, guncelPayload);
          updateCount++;
        } catch (e) {
          logAlways(`  UPDATE HATASI ${durak.durak_id}: ${e.message}`);
          errorCount++;
        }
      } else {
        updateCount++;
      }
    } else {
      // INSERT: yeni durak
      const insertPayload = {
        ...guncelPayload,
        firma: 'havaist',
        havalimani: 'IST',
        durak_id: durak.durak_id,
        durak_adi: durak.durak_adi,
        not_bilgi: durak.not_bilgi,
        aktif: true,
      };
      degisiklikler.push({
        type: 'insert',
        durak_id: durak.durak_id,
        durak_adi: durak.durak_adi,
        fiyat: veri.fiyat,
        gidis: veri.sehirden_hav.length,
        donus: veri.havdan_sehir.length,
      });
      if (!DRY) {
        try {
          await sbInsert(insertPayload);
          insertCount++;
        } catch (e) {
          logAlways(`  INSERT HATASI ${durak.durak_id}: ${e.message}`);
          errorCount++;
        }
      } else {
        insertCount++;
      }
    }
  }

  // 6. Ozet
  const bitis = new Date();
  const sureMs = bitis - baslangic;
  const ozet = {
    timestamp: bitis.toISOString(),
    dry: DRY,
    auto: AUTO,
    api_hat_sayisi: hatVerisi.size,
    db_kayit_sayisi: dbRows.length,
    update: updateCount,
    insert: insertCount,
    no_change: noChangeCount,
    error: errorCount,
    sure_ms: sureMs,
    degisiklikler,
  };

  if (!DRY) appendLog(ozet);

  logAlways('');
  logAlways(`OZET: ${updateCount} guncelleme · ${insertCount} yeni durak · ${noChangeCount} degisim yok · ${errorCount} hata · ${(sureMs/1000).toFixed(1)}s${DRY ? ' [DRY]' : ''}`);
  if (degisiklikler.length && (!AUTO || VERBOSE)) {
    logAlways('Degisiklikler:');
    for (const d of degisiklikler) {
      if (d.type === 'update') {
        logAlways(`  UPDATE ${d.durak_id}: fiyat ${d.eski_fiyat} → ${d.yeni_fiyat}, gidis ${d.eski_gidis}→${d.yeni_gidis}, donus ${d.eski_donus}→${d.yeni_donus}`);
      } else {
        logAlways(`  INSERT ${d.durak_id} (${d.durak_adi}): ${d.fiyat}, gidis ${d.gidis}, donus ${d.donus}`);
      }
    }
  }

  if (errorCount > 0) process.exit(1);
}

main().catch(e => {
  logAlways('FATAL:', e.message);
  appendLog({ timestamp: new Date().toISOString(), error: e.message, fatal: true });
  process.exit(1);
});
