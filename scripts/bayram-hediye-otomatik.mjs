// Pusula Istanbul — Bayram Hediyesi Otomatik Yeni Kayit Yakalayicisi
//
// AMAC:
//   28-30 May 2026 (Kurban Bayrami) doneminde yeni kayit olan kullanicilara
//   otomatik olarak premium uyelik hediyesi tanir (1 Haziran 2026 00:00'a kadar)
//   ve "hos geldin + bayram hediyesi" mailini Resend uzerinden gonderir.
//
// CALISMA:
//   Scheduled task tarafindan her 15 dakikada bir tetiklenir.
//   Idempotent: hediye SQL filtresi (abonelik_durumu != 'aktif') sayesinde ayni
//   kullanici 2. kez yakalanmaz; mail de gitmez.
//
// OTO-KAPANIS:
//   Script tarihi kontrol eder. 1 Haziran 2026 00:00 Istanbul (UTC+3) sonrasi
//   no-op doner ve "kampanya bitti" mesaji basar.
//
// KULLANIM:
//   node scripts/bayram-hediye-otomatik.mjs            # gercek calisma
//   node scripts/bayram-hediye-otomatik.mjs --dry      # sadece raporla, eylem alma
//
// LOG:
//   scripts/data/bayram-hediye-otomatik-log.json — her gonderilen mail ve
//   uygulanan hediye burada audit amaciyla saklanir (gitignore disinda).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const LOG_DIR = resolve(__dirname, 'data');
const LOG_PATH = resolve(LOG_DIR, 'bayram-hediye-otomatik-log.json');

// === Env yukleme ===
function loadEnv() {
  try {
    const raw = readFileSync(ENV_PATH, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (e) {
    console.error('.env okunamadi:', e.message);
    process.exit(1);
  }
}
loadEnv();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = 'https://rzlfghjpsximthlolfxo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!RESEND_API_KEY) {
  console.error('HATA: RESEND_API_KEY .env dosyasinda yok.');
  process.exit(1);
}
if (!SUPABASE_KEY) {
  console.error('HATA: SUPABASE_SERVICE_ROLE_KEY .env dosyasinda yok.');
  process.exit(1);
}

// === Sabitler ===
const KAMPANYA_BASLAMA_UTC = '2026-05-28T00:00:00+03:00'; // 28 May 00:00 IST
const KAMPANYA_BITIS_UTC = '2026-06-01T00:00:00+03:00';   // 1 Haz 00:00 IST
const HEDIYE_BITIS = '2026-06-01T00:00:00+03:00';
const SENDER = 'Pusula Istanbul <info@pusulaistanbul.app>';
const REPLY_TO = 'info@pusulaistanbul.app';
const SUBJECT = "Pusula İstanbul'a Hoş Geldiniz - Bayram Hediyeniz Hazır";
const LOGO_URL = 'https://pusulaistanbul.app/logo-icon.png';

// === Oto-kapanis kontrolu ===
const NOW = new Date();
const KAMPANYA_BITIS_DATE = new Date(KAMPANYA_BITIS_UTC);
if (NOW >= KAMPANYA_BITIS_DATE) {
  console.log('[bayram-hediye-otomatik] Kampanya bitti (1 Haziran 2026 00:00 +03 gecti).');
  console.log('Bu task artik no-op doner. Manuel olarak disable edilebilir.');
  process.exit(0);
}

// === Log yonetimi ===
function logYukle() {
  if (!existsSync(LOG_PATH)) {
    return { runs: [], users: {} };
  }
  try {
    return JSON.parse(readFileSync(LOG_PATH, 'utf8'));
  } catch (e) {
    console.error('Log okunamadi, sifirdan baslatiliyor:', e.message);
    return { runs: [], users: {} };
  }
}

function logKaydet(log) {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

// === Supabase fetch helpers ===
async function profilesQuery(qs) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?${qs}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase SELECT HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function profileUpdate(id, patch) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Supabase PATCH HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// === Yeni kayit yakalama ===
async function yakalanacakKayitlar() {
  // Hedef: kampanya doneminde yeni kayit + henuz hediye almamis
  const filters = [
    `created_at=gte.${encodeURIComponent(KAMPANYA_BASLAMA_UTC)}`,
    `created_at=lt.${encodeURIComponent(KAMPANYA_BITIS_UTC)}`,
    `or=(abonelik_durumu.is.null,abonelik_durumu.neq.aktif)`,
    `select=id,isim,soyisim,email,abonelik_durumu,created_at`,
    `order=created_at.asc`,
  ];
  return profilesQuery(filters.join('&'));
}

// === Hediye uygulama ===
async function hediyeUygula(userId) {
  return profileUpdate(userId, {
    abonelik_durumu: 'aktif',
    abonelik_plani: 'aylik',
    abonelik_bitis: HEDIYE_BITIS,
  });
}

// === Mail template ===
function htmlIcerik({ ad, soyad }) {
  const adSoyad = soyad ? `${ad} ${soyad}` : ad;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pusula İstanbul'a Hoş Geldiniz</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:32px 16px;">
<tr>
<td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,90,141,0.12);">

<tr>
<td style="background-color:#0077B6; padding:36px 40px 30px 40px; text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
<tr>
<td style="vertical-align:middle; padding-right:20px;">
<span style="font-size:30px; font-weight:700; color:#ffffff; letter-spacing:3px; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">PUSULA</span>
</td>
<td style="vertical-align:middle; padding:0 10px;">
<img src="${LOGO_URL}" alt="" width="70" height="50" style="display:block; border:0; outline:none;" />
</td>
<td style="vertical-align:middle; padding-left:20px;">
<span style="font-size:30px; font-weight:700; color:#ffffff; letter-spacing:3px; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">İSTANBUL</span>
</td>
</tr>
</table>
<p style="margin:20px 0 0 0; font-size:12px; color:rgba(255,255,255,0.8); letter-spacing:2.5px; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI
</p>
</td>
</tr>

<tr>
<td style="padding:36px 40px 12px 40px;">

<p style="margin:0 0 24px 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
Sayın ${adSoyad},
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Pusula İstanbul'a katıldığınız için teşekkür ederiz. Profesyonel turist rehberlerinin saha asistanı olarak tasarlanan bu uygulamada sizi aramızda görmekten memnuniyet duyuyoruz.
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Aramıza Kurban Bayramı süresince katıldığınızı fark ettik. Bu güzel tesadüfü kutlamak isteriz; bayramınızı içtenlikle kutlar, sevdiklerinizle huzur ve sağlık içinde geçirmenizi dileriz.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="background:linear-gradient(135deg, #C77A15 0%, #E09F3E 100%); border-radius:12px; padding:24px 28px;">
<p style="margin:0 0 10px 0; font-size:16px; font-weight:700; color:#ffffff;">
Hoş Geldiniz Hediyeniz: Premium Üyelik
</p>
<p style="margin:0; font-size:14px; color:rgba(255,255,255,0.97); line-height:1.8;">
Hesabınız <strong style="color:#ffffff;">1 Haziran 2026 saat 00:00'a</strong> kadar Premium üyelik kapsamında etkinleştirilmiştir. Bayram boyunca <strong>rehber sohbeti, canlı saha durumu, ulaşım uyarıları ve etkinlik bandı</strong> dahil tüm premium özelliklere herhangi bir ücret talep edilmeksizin erişebilirsiniz.
</p>
</td>
</tr>
</table>

<p style="margin:0 0 20px 0; font-size:14px; color:#4a5b6c; line-height:1.8; font-style:italic;">
Hediye süresinin sonunda hesabınız otomatik olarak ücretsiz katmana dönecektir. Sizden herhangi bir abonelik ücreti tahsil edilmeyecek; ödeme bilgisi de talep edilmemektedir. Bayram sonrası premium özellikleri kullanmaya devam etmek isterseniz aylık 99 TL veya yıllık 699 TL (%41 avantajlı) planlarımızdan birini seçerek erişiminizi sürdürebilirsiniz.
</p>

<p style="margin:24px 0 0 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Görüş, öneri veya sahadan paylaşmak istediğiniz her türlü bilgi için bu e-postayı yanıtlayabilir ya da <a href="mailto:info@pusulaistanbul.app" style="color:#005A8D; text-decoration:none; font-weight:600;">info@pusulaistanbul.app</a> adresinden bizlere ulaşabilirsiniz.
</p>

<p style="margin:28px 0 0 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
İyi turlar ve nice bayramlar dileriz,<br>
<strong style="color:#005A8D;">Pusula İstanbul</strong>
</p>

</td>
</tr>

<tr>
<td style="padding:0 40px;">
<div style="border-top:1px solid #e2e8f0; margin:20px 0 0 0;"></div>
</td>
</tr>

<tr>
<td style="padding:20px 40px 32px 40px; text-align:center;">
<p style="margin:0 0 8px 0; font-size:13px; color:#8899aa;">
<a href="https://pusulaistanbul.app" style="color:#005A8D; text-decoration:none;">pusulaistanbul.app</a>
&nbsp;·&nbsp; info@pusulaistanbul.app
</p>
<p style="margin:0; font-size:12px; color:#aabbcc;">
Pusula İstanbul — Profesyonel Turist Rehberinin Dijital Asistanı
</p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;
}

function textIcerik({ ad, soyad }) {
  const adSoyad = soyad ? `${ad} ${soyad}` : ad;
  return `Sayın ${adSoyad},

Pusula İstanbul'a katıldığınız için teşekkür ederiz. Profesyonel turist rehberlerinin saha asistanı olarak tasarlanan bu uygulamada sizi aramızda görmekten memnuniyet duyuyoruz.

Aramıza Kurban Bayramı süresince katıldığınızı fark ettik. Bu güzel tesadüfü kutlamak isteriz; bayramınızı içtenlikle kutlar, sevdiklerinizle huzur ve sağlık içinde geçirmenizi dileriz.

HOŞ GELDİNİZ HEDİYENİZ: PREMIUM ÜYELİK
Hesabınız 1 Haziran 2026 saat 00:00'a kadar Premium üyelik kapsamında etkinleştirilmiştir. Bayram boyunca rehber sohbeti, canlı saha durumu, ulaşım uyarıları ve etkinlik bandı dahil tüm premium özelliklere herhangi bir ücret talep edilmeksizin erişebilirsiniz.

Hediye süresinin sonunda hesabınız otomatik olarak ücretsiz katmana dönecektir. Sizden herhangi bir abonelik ücreti tahsil edilmeyecek; ödeme bilgisi de talep edilmemektedir. Bayram sonrası premium özellikleri kullanmaya devam etmek isterseniz aylık 99 TL veya yıllık 699 TL (%41 avantajlı) planlarımızdan birini seçerek erişiminizi sürdürebilirsiniz.

Görüş, öneri veya sahadan paylaşmak istediğiniz her türlü bilgi için bu e-postayı yanıtlayabilir ya da info@pusulaistanbul.app adresinden bizlere ulaşabilirsiniz.

İyi turlar ve nice bayramlar dileriz,
Pusula İstanbul

—
pusulaistanbul.app
Profesyonel Turist Rehberinin Dijital Asistanı
`;
}

// === Mail gonderim ===
async function mailGonder(alici) {
  const body = {
    from: SENDER,
    to: alici.email,
    reply_to: REPLY_TO,
    subject: SUBJECT,
    html: htmlIcerik(alici),
    text: textIcerik(alici),
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// === Ana akis ===
const DRY_RUN = process.argv.includes('--dry');

(async () => {
  const startedAt = new Date().toISOString();
  console.log(`[bayram-hediye-otomatik] Baslangic: ${startedAt}`);
  console.log(`[bayram-hediye-otomatik] Mod: ${DRY_RUN ? 'DRY-RUN' : 'CANLI'}`);
  console.log(`[bayram-hediye-otomatik] Pencere: ${KAMPANYA_BASLAMA_UTC} -> ${KAMPANYA_BITIS_UTC}`);

  const log = logYukle();
  const kayitlar = await yakalanacakKayitlar();

  console.log(`[bayram-hediye-otomatik] Yakalanan yeni kayit: ${kayitlar.length}`);

  if (kayitlar.length === 0) {
    console.log('[bayram-hediye-otomatik] Yapilacak is yok. Cikiliyor.');
    log.runs.push({
      ran_at: startedAt,
      mode: DRY_RUN ? 'dry' : 'live',
      caught: 0,
      gifted: 0,
      mailed: 0,
    });
    if (!DRY_RUN) logKaydet(log);
    process.exit(0);
  }

  let hediyeUygulanan = 0;
  let mailGonderilen = 0;
  let basarisiz = 0;
  const hataLog = [];

  for (const u of kayitlar) {
    const ad = (u.isim || '').trim();
    const soyad = (u.soyisim || '').trim();
    const email = (u.email || '').trim();

    if (!email) {
      console.log(`  SKIP ${u.id}: email yok`);
      continue;
    }

    process.stdout.write(`  ${ad} ${soyad} <${email}> ... `);

    if (DRY_RUN) {
      console.log('DRY (eylem yok)');
      continue;
    }

    try {
      await hediyeUygula(u.id);
      hediyeUygulanan++;
    } catch (e) {
      console.log(`SQL HATA: ${e.message}`);
      basarisiz++;
      hataLog.push({ id: u.id, email, asama: 'sql', hata: e.message });
      continue;
    }

    try {
      const resendResp = await mailGonder({ ad, soyad, email });
      mailGonderilen++;
      console.log(`OK (mail: ${resendResp.id})`);

      log.users[u.id] = {
        email,
        isim: ad,
        soyisim: soyad,
        gift_applied_at: new Date().toISOString(),
        mail_sent_at: new Date().toISOString(),
        mail_resend_id: resendResp.id,
      };
    } catch (e) {
      console.log(`MAIL HATA: ${e.message}`);
      basarisiz++;
      hataLog.push({ id: u.id, email, asama: 'mail', hata: e.message });
      // SQL basarili, mail basarisiz — log'a yine de hediye ekle, mail eksik
      log.users[u.id] = {
        email,
        isim: ad,
        soyisim: soyad,
        gift_applied_at: new Date().toISOString(),
        mail_sent_at: null,
        mail_error: e.message,
      };
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  log.runs.push({
    ran_at: startedAt,
    finished_at: new Date().toISOString(),
    mode: 'live',
    caught: kayitlar.length,
    gifted: hediyeUygulanan,
    mailed: mailGonderilen,
    failed: basarisiz,
    errors: hataLog,
  });
  logKaydet(log);

  console.log(`\n[bayram-hediye-otomatik] OZET: ${hediyeUygulanan} hediye, ${mailGonderilen} mail, ${basarisiz} hata.`);
  process.exit(basarisiz === 0 ? 0 : 1);
})().catch((e) => {
  console.error('[bayram-hediye-otomatik] BEKLENMEDIK HATA:', e);
  process.exit(2);
});
