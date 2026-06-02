// Pusula Istanbul — Yeni Kayit Bayram Hediye Mail Gonderici (gec gelenler)
//
// 27 Mayis 2026 (Kurban Bayrami 1. gunu) ilk dalga script'i 11 kisiye gonderildikten
// SONRA kayit olan ve hediye disinda kalan 5 kullaniciya ayni "hos geldin + bayram
// hediyesi" maili gonderir.
//
// Hediye SQL ile zaten uygulandi (abonelik_durumu='aktif', abonelik_plani='aylik',
// abonelik_bitis='2026-06-01 00:00:00+03'). Bu script SADECE mail yollar.
//
// Bu 5 kisi: ilk dalga script'inden sonra (aksamustu 17:33 - 20:39) kayit olan ve
// "freemium" sayim sorgusunda gorulen kullanicilar (28 May sabah tespit edildi).
//
// Kullanim:
//   node scripts/yeni-kayit-bayram-hediye-gec.mjs --dry
//   node scripts/yeni-kayit-bayram-hediye-gec.mjs --test <email>
//   node scripts/yeni-kayit-bayram-hediye-gec.mjs --all
//
// .env: RESEND_API_KEY gerekli.

import { readFileSync } from 'node:fs';
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
if (!RESEND_API_KEY) {
  console.error('HATA: RESEND_API_KEY .env dosyasinda yok.');
  process.exit(1);
}

const SENDER = 'Pusula Istanbul <info@pusulaistanbul.app>';
const REPLY_TO = 'info@pusulaistanbul.app';
const SUBJECT = "Pusula İstanbul'a Hoş Geldiniz - Bayram Hediyeniz Hazır";
const LOGO_URL = 'https://pusulaistanbul.app/logo-icon.png';

// 27 May 2026 (Kurban Bayrami 1. gunu) ilk hediye dalgasindan SONRA kayit olan 5 kisi.
// Source-of-truth: profiles tablosunda created_at = 2026-05-27, abonelik_durumu='deneme' iken
// 28 May sabah hediye SQL'i ile aktif edilen kullanicilar (UPDATE RETURNING dogrulandi).
const ALICILAR = [
  { ad: 'Ali', soyad: 'Hizmetçi', email: 'ali.hizmetci@yahoo.com' },
  { ad: 'Tahir', soyad: 'Uruç', email: 'tahiruruc@gmail.com' },
  { ad: 'Ersem', soyad: 'Özcan Tek', email: 'ersemozcan@gmail.com' },
  { ad: 'Zeynep', soyad: 'Sözmen', email: 'zsozmen@yahoo.com' },
  { ad: 'Ali Doğan', soyad: 'Karacık', email: 'alidogankaracik@gmail.com' },
];

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
Aramıza Kurban Bayramı'nın ilk gününde katıldığınızı fark ettik. Bu güzel tesadüfü kutlamak isteriz; bayramınızı içtenlikle kutlar, sevdiklerinizle huzur ve sağlık içinde geçirmenizi dileriz.
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

Aramıza Kurban Bayramı'nın ilk gününde katıldığınızı fark ettik. Bu güzel tesadüfü kutlamak isteriz; bayramınızı içtenlikle kutlar, sevdiklerinizle huzur ve sağlık içinde geçirmenizi dileriz.

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

const args = process.argv.slice(2);
const mode = args[0] || '--dry';

if (mode === '--dry') {
  console.log('=== DRY-RUN: Gercek mail GONDERILMEYECEK ===\n');
  console.log(`Sender: ${SENDER}`);
  console.log(`Reply-To: ${REPLY_TO}`);
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Toplam alici: ${ALICILAR.length}\n`);
  console.log('--- Alici listesi ---');
  for (const a of ALICILAR) {
    console.log(`  - ${a.ad} ${a.soyad} <${a.email}>`);
  }
  console.log('\n--- TEXT versiyonu (ornek: ilk alici) ---\n');
  console.log(textIcerik(ALICILAR[0]));
  console.log('\nIcerigi onayliyorsan: --test <kendi-email-adresin> ile teste gec.');
  process.exit(0);
}

if (mode === '--test') {
  const testEmail = args[1];
  if (!testEmail) {
    console.error('HATA: --test moduna email parametresi gerekli.');
    console.error('  node scripts/yeni-kayit-bayram-hediye-gec.mjs --test ayse.tokkus@gmail.com');
    process.exit(1);
  }
  const testAlici = { ad: 'Ayşe', soyad: 'Tokkuş Bayar', email: testEmail };
  console.log(`Test maili gonderiliyor: ${testEmail}`);
  try {
    const sonuc = await gonder(testAlici);
    console.log('OK:', sonuc);
    console.log('\nResend dashboard: https://resend.com/emails');
  } catch (e) {
    console.error('HATA:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (mode === '--all') {
  console.log(`Gercek gonderim baslatiliyor. Toplam: ${ALICILAR.length} kisi.\n`);
  let basarili = 0;
  let basarisiz = 0;
  const hataLog = [];

  for (let i = 0; i < ALICILAR.length; i++) {
    const alici = ALICILAR[i];
    process.stdout.write(`  [${i+1}/${ALICILAR.length}] ${alici.ad} ${alici.soyad} <${alici.email}> ... `);
    try {
      const sonuc = await gonder(alici);
      console.log(`OK (id: ${sonuc.id})`);
      basarili++;
    } catch (e) {
      console.log(`HATA: ${e.message}`);
      basarisiz++;
      hataLog.push({ email: alici.email, hata: e.message });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== SONUC: ${basarili} basarili, ${basarisiz} basarisiz ===`);
  if (hataLog.length > 0) {
    console.log('\nHatali gonderimler:');
    for (const h of hataLog) {
      console.log(`  - ${h.email}: ${h.hata}`);
    }
  }
  console.log('\nResend dashboard: https://resend.com/emails');
  process.exit(basarisiz === 0 ? 0 : 1);
}

console.error('Bilinmeyen mod. Kullanim:');
console.error('  node scripts/yeni-kayit-bayram-hediye-gec.mjs --dry');
console.error('  node scripts/yeni-kayit-bayram-hediye-gec.mjs --test <email>');
console.error('  node scripts/yeni-kayit-bayram-hediye-gec.mjs --all');
process.exit(1);
