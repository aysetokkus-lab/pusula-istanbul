// Pusula Istanbul — Kurban Bayrami Hediye Mail Gonderici
//
// 27 Mayis 2026 sabah atomic SQL ile abonelik_bitis=2026-06-01 yapilan
// 172 freemium kullaniciya, kurban bayrami tebrigi + 5 gunluk premium
// hediye duyurusu icerikli markali email gonderir.
//
// Alici listesi RUNTIME'DA Supabase'den cekilir (hardcode degil) — bu sayede
// script calismadan once UPDATE'de eklenen/silinen kullanicilara duyarli kalir.
//
// Kullanim:
//   node scripts/kurban-bayrami-hediye.mjs --dry             # listeyi cek + icerik onizle
//   node scripts/kurban-bayrami-hediye.mjs --test <email>    # tek bir test maili gonder
//   node scripts/kurban-bayrami-hediye.mjs --all             # tum alicilara gercek gonderim
//
// .env: RESEND_API_KEY + SUPABASE_SERVICE_ROLE_KEY gerekli.

import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');

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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!RESEND_API_KEY) {
  console.error('HATA: RESEND_API_KEY .env dosyasinda yok.');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('HATA: SUPABASE_SERVICE_ROLE_KEY .env dosyasinda yok.');
  process.exit(1);
}

const SENDER = 'Pusula Istanbul <info@pusulaistanbul.app>';
const REPLY_TO = 'info@pusulaistanbul.app';
const SUBJECT = "Pusula Istanbul'dan Kurban Bayramı Hediyeniz";

// Logo: pusulaistanbul.app/logo-icon.png — external URL (Gmail base64 inline'i
// guvenilir render etmiyor, sifre sifirlama mailindeki tasarima donduk).
const LOGO_URL = 'https://pusulaistanbul.app/logo-icon.png';

const SUPABASE_FETCH_URL =
  `${SUPABASE_URL}/rest/v1/profiles` +
  `?select=isim,soyisim,email,abonelik_durumu,abonelik_bitis,rol` +
  `&abonelik_bitis=eq.2026-06-01T00:00:00%2B03:00` +
  `&rol=not.in.(admin,moderator)` +
  `&email=not.is.null` +
  `&order=email.asc`;

// Checkpoint dosyasi — kismi calismalar arasinda zaten gonderilenleri atla.
// Cowork sandbox bash cagrisi 45 saniye ile sinirli ve --die-with-parent
// nedeniyle background process bir sonraki cagriya tasinamiyor. Bu nedenle
// script batch'ler halinde calistirilabilir. KURBAN_MAX_PER_RUN env var ile
// her batch boyutu kontrol edilir.
const CHECKPOINT_PATH = process.env.KURBAN_CHECKPOINT || '/tmp/kurban-hediye-sent.txt';
const MAX_PER_RUN = process.env.KURBAN_MAX_PER_RUN
  ? parseInt(process.env.KURBAN_MAX_PER_RUN, 10)
  : Infinity;

function gonderilenSetiOku() {
  if (!existsSync(CHECKPOINT_PATH)) return new Set();
  try {
    return new Set(
      readFileSync(CHECKPOINT_PATH, 'utf8')
        .split('\n')
        .map(l => l.trim().toLowerCase())
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

function gonderildiOlarakIsaretle(email) {
  appendFileSync(CHECKPOINT_PATH, email.toLowerCase() + '\n');
}

async function aliciListesiCek() {
  const res = await fetch(SUPABASE_FETCH_URL, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase fetch HATA: HTTP ${res.status} - ${txt}`);
  }
  const rows = await res.json();
  // RFC2606 reserved + obvious test domains — bounce eden veya hicbir yere ulasmayan adresler
  const HARIC_DOMAINLER = ['example.com', 'example.org', 'example.net', 'test.com', 'localhost'];
  const atlanan = [];
  const kabul = [];
  for (const r of rows) {
    if (!r.email || !r.email.includes('@')) {
      atlanan.push({ sebep: 'email-yok', email: r.email || '(null)', isim: r.isim, soyisim: r.soyisim });
      continue;
    }
    const domain = r.email.split('@')[1].toLowerCase().trim();
    if (HARIC_DOMAINLER.includes(domain)) {
      atlanan.push({ sebep: 'test-domain', email: r.email, isim: r.isim, soyisim: r.soyisim });
      continue;
    }
    kabul.push({
      ad: (r.isim || '').trim() || 'Değerli Rehberimiz',
      soyad: (r.soyisim || '').trim(),
      email: r.email.trim(),
    });
  }
  if (atlanan.length > 0) {
    console.log(`\nFiltre ile atlanan ${atlanan.length} kayit:`);
    for (const a of atlanan) {
      console.log(`  [${a.sebep}] ${a.isim || ''} ${a.soyisim || ''} <${a.email}>`);
    }
    console.log('');
  }
  return kabul;
}

function htmlIcerik({ ad, soyad }) {
  const adSoyad = soyad ? `${ad} ${soyad}` : ad;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pusula İstanbul'dan Kurban Bayramı Hediyeniz</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:32px 16px;">
<tr>
<td align="center">

<!-- Ana Kart -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,90,141,0.12);">

<!-- Header: Yatay banner — PUSULA [logo] ISTANBUL -->
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

<!-- Icerik -->
<tr>
<td style="padding:36px 40px 12px 40px;">

<p style="margin:0 0 24px 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
Sayın ${adSoyad},
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Kurban Bayramı'nızı içtenlikle kutlar, bu bayramın sevdiklerinizle huzur ve sağlık içinde geçmesini dileriz.
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Bayram günleri rehberlerimiz için aynı zamanda sahada yoğun bir döneme işaret ediyor. Bu vesileyle sizlere küçük bir bayram hediyesi sunmak istedik.
</p>

<!-- Hediye Kutusu -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="background:linear-gradient(135deg, #C77A15 0%, #E09F3E 100%); border-radius:12px; padding:24px 28px;">

<p style="margin:0 0 10px 0; font-size:16px; font-weight:700; color:#ffffff;">
Bayram Hediyeniz: Premium Üyelik
</p>
<p style="margin:0; font-size:14px; color:rgba(255,255,255,0.97); line-height:1.8;">
Hesabınız <strong style="color:#ffffff;">1 Haziran 2026 saat 00:00'a</strong> kadar Premium üyelik kapsamında etkinleştirilmiştir. Bayram boyunca <strong>rehber sohbeti, canlı saha durumu, ulaşım uyarıları ve etkinlik bandı</strong> dahil tüm premium özelliklere herhangi bir ücret talep edilmeksizin erişebilirsiniz.
</p>

</td>
</tr>
</table>

<p style="margin:0 0 20px 0; font-size:14px; color:#4a5b6c; line-height:1.8; font-style:italic;">
Hediye süresinin sonunda hesabınız otomatik olarak ücretsiz katmana dönecektir. Sizden herhangi bir abonelik ücreti tahsil edilmeyecek; ödeme bilgisi de talep edilmemektedir.
</p>

<!-- Guncelleme Kutusu -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="background:linear-gradient(135deg, #005A8D 0%, #0077B6 100%); border-radius:12px; padding:24px 28px;">

<p style="margin:0 0 10px 0; font-size:16px; font-weight:700; color:#ffffff;">
Önemli Güncelleme
</p>
<p style="margin:0; font-size:14px; color:rgba(255,255,255,0.95); line-height:1.8;">
Önümüzdeki günlerde yayına alınacak yeni sürümümüz <strong style="color:#48CAE4;">(v1.0.14)</strong>, bazı kullanıcılarımızda karşılaşılan uygulama açılış aksaklıklarını gidermektedir. Bayram boyunca kesintisiz bir kullanım için App Store veya Google Play üzerinden uygulamanızı güncel tutmanızı rica ederiz.
</p>

</td>
</tr>
</table>

<p style="margin:24px 0 0 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Görüş, öneri veya sahadan paylaşmak istediğiniz her türlü bilgi için bu e-postayı yanıtlayabilir ya da <a href="mailto:info@pusulaistanbul.app" style="color:#005A8D; text-decoration:none; font-weight:600;">info@pusulaistanbul.app</a> adresinden bizlere ulaşabilirsiniz.
</p>

<p style="margin:28px 0 0 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
İyi turlar ve nice bayramlar dileriz,<br>
<strong style="color:#005A8D;">Pusula İstanbul</strong>
</p>

</td>
</tr>

<!-- Alt Cizgi -->
<tr>
<td style="padding:0 40px;">
<div style="border-top:1px solid #e2e8f0; margin:20px 0 0 0;"></div>
</td>
</tr>

<!-- Footer -->
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
<!-- /Ana Kart -->

</td>
</tr>
</table>

</body>
</html>`;
}

function textIcerik({ ad, soyad }) {
  const adSoyad = soyad ? `${ad} ${soyad}` : ad;
  return `Sayın ${adSoyad},

Kurban Bayramı'nızı içtenlikle kutlar, bu bayramın sevdiklerinizle huzur ve sağlık içinde geçmesini dileriz.

Bayram günleri rehberlerimiz için aynı zamanda sahada yoğun bir döneme işaret ediyor. Bu vesileyle sizlere küçük bir bayram hediyesi sunmak istedik:

BAYRAM HEDİYENİZ: PREMIUM ÜYELİK
Hesabınız 1 Haziran 2026 saat 00:00'a kadar Premium üyelik kapsamında etkinleştirilmiştir. Bayram boyunca rehber sohbeti, canlı saha durumu, ulaşım uyarıları ve etkinlik bandı dahil tüm premium özelliklere herhangi bir ücret talep edilmeksizin erişebilirsiniz.

Hediye süresinin sonunda hesabınız otomatik olarak ücretsiz katmana dönecektir. Sizden herhangi bir abonelik ücreti tahsil edilmeyecek; ödeme bilgisi de talep edilmemektedir.

ÖNEMLİ GÜNCELLEME
Önümüzdeki günlerde yayına alınacak yeni sürümümüz (v1.0.14), bazı kullanıcılarımızda karşılaşılan uygulama açılış aksaklıklarını gidermektedir. Bayram boyunca kesintisiz bir kullanım için App Store veya Google Play üzerinden uygulamanızı güncel tutmanızı rica ederiz.

Görüş, öneri veya sahadan paylaşmak istediğiniz her türlü bilgi için bu e-postayı yanıtlayabilir ya da info@pusulaistanbul.app adresinden bizlere ulaşabilirsiniz.

İyi turlar ve nice bayramlar dileriz,
Pusula İstanbul

—
pusulaistanbul.app
Profesyonel Turist Rehberinin Dijital Asistanı
`;
}

async function gonder(alici) {
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
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// ===== Ana Akis =====

const args = process.argv.slice(2);
const mode = args[0] || '--dry';

if (mode === '--dry') {
  console.log('=== DRY-RUN: Gercek mail GONDERILMEYECEK, sadece icerik onizlemesi ===\n');
  console.log('Supabase\'den alici listesi cekiliyor...\n');
  let aliciListesi;
  try {
    aliciListesi = await aliciListesiCek();
  } catch (e) {
    console.error('HATA:', e.message);
    process.exit(1);
  }
  console.log(`Cekilen alici sayisi: ${aliciListesi.length}\n`);

  const ornek = aliciListesi[0] || { ad: 'Ornek', soyad: 'Kullanici', email: 'ornek@ornek.com' };
  console.log(`Sender: ${SENDER}`);
  console.log(`Reply-To: ${REPLY_TO}`);
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Ornek alici: ${ornek.ad} ${ornek.soyad} <${ornek.email}>\n`);
  console.log('--- TEXT versiyonu (HTML render edemeyen istemciler icin) ---\n');
  console.log(textIcerik(ornek));

  console.log('\n--- Ilk 10 alici onizleme ---');
  for (const a of aliciListesi.slice(0, 10)) {
    console.log(`  - ${a.ad} ${a.soyad} <${a.email}>`);
  }
  if (aliciListesi.length > 10) {
    console.log(`  ... +${aliciListesi.length - 10} kisi daha`);
  }
  console.log(`\nToplam: ${aliciListesi.length} kisi.`);
  console.log('\nIcerigi onayliyorsan: --test <kendi-email-adresin> ile teste gec.');
  process.exit(0);
}

if (mode === '--test') {
  const testEmail = args[1];
  if (!testEmail) {
    console.error('HATA: --test moduna email parametresi gerekli. Ornek:');
    console.error('  node scripts/kurban-bayrami-hediye.mjs --test ayse.tokkus@gmail.com');
    process.exit(1);
  }
  const testAlici = { ad: 'Ayşe', soyad: 'Tokkuş Bayar', email: testEmail };
  console.log(`Test maili gonderiliyor: ${testEmail}`);
  console.log(`Test alici: ${testAlici.ad} ${testAlici.soyad}`);
  try {
    const sonuc = await gonder(testAlici);
    console.log('OK:', sonuc);
    console.log('\nResend dashboard\'da gorebilir: https://resend.com/emails');
  } catch (e) {
    console.error('HATA:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (mode === '--all') {
  console.log('Supabase\'den alici listesi cekiliyor...\n');
  let aliciListesi;
  try {
    aliciListesi = await aliciListesiCek();
  } catch (e) {
    console.error('HATA:', e.message);
    process.exit(1);
  }

  const zatenGonderildi = gonderilenSetiOku();
  const kalan = aliciListesi.filter(a => !zatenGonderildi.has(a.email.toLowerCase()));
  const atlananZatenGonderildi = aliciListesi.length - kalan.length;

  if (atlananZatenGonderildi > 0) {
    console.log(`Checkpoint: ${atlananZatenGonderildi} kisi daha onceden gonderildi, atlaniyor.`);
    console.log(`Checkpoint dosyasi: ${CHECKPOINT_PATH}\n`);
  }
  console.log(`Toplam alici: ${aliciListesi.length}, kalan: ${kalan.length}, bu batch limiti: ${MAX_PER_RUN === Infinity ? 'sinirsiz' : MAX_PER_RUN}\n`);
  console.log(`Gercek gonderim baslatiliyor.\n`);

  let basarili = 0;
  let basarisiz = 0;
  const hataLog = [];
  const aslindaKac = Math.min(kalan.length, MAX_PER_RUN);

  for (let i = 0; i < aslindaKac; i++) {
    const alici = kalan[i];
    const globalIndex = aliciListesi.findIndex(a => a.email === alici.email) + 1;
    const prefix = `[${globalIndex}/${aliciListesi.length}]`;
    process.stdout.write(`  ${prefix} ${alici.ad} ${alici.soyad} <${alici.email}> ... `);
    try {
      const sonuc = await gonder(alici);
      gonderildiOlarakIsaretle(alici.email);
      console.log(`OK (id: ${sonuc.id})`);
      basarili++;
    } catch (e) {
      console.log(`HATA: ${e.message}`);
      basarisiz++;
      hataLog.push({ email: alici.email, hata: e.message });
    }
    // Rate limit korumasi (Resend free tier 10/saniye, biz 2/saniye gidiyoruz)
    await new Promise(r => setTimeout(r, 500));
  }

  const sonGonderilenSeti = gonderilenSetiOku();
  const henuzKalan = aliciListesi.filter(a => !sonGonderilenSeti.has(a.email.toLowerCase())).length;

  console.log(`\n=== Bu batch sonucu: ${basarili} basarili, ${basarisiz} basarisiz ===`);
  console.log(`Toplam ilerleme: ${aliciListesi.length - henuzKalan}/${aliciListesi.length} gonderildi, ${henuzKalan} kisi kaldi.`);
  if (hataLog.length > 0) {
    console.log('\nHatali gonderimler:');
    for (const h of hataLog) {
      console.log(`  - ${h.email}: ${h.hata}`);
    }
  }
  if (henuzKalan > 0) {
    console.log(`\nDaha fazla calistir: KURBAN_MAX_PER_RUN=${MAX_PER_RUN} node scripts/kurban-bayrami-hediye.mjs --all`);
  } else {
    console.log('\nTUM 168 KISIYE BASARIYLA GONDERILDI.');
  }
  console.log('Resend dashboard\'da gorebilir: https://resend.com/emails');
  process.exit(basarisiz === 0 ? 0 : 1);
}

console.error('Bilinmeyen mod. Kullanim:');
console.error('  node scripts/kurban-bayrami-hediye.mjs --dry');
console.error('  node scripts/kurban-bayrami-hediye.mjs --test <email>');
console.error('  node scripts/kurban-bayrami-hediye.mjs --all');
process.exit(1);
