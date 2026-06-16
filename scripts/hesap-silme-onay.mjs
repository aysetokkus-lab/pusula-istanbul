// Pusula Istanbul — Hesap Silme Onay Maili (KVKK Madde 11) — GENERIC / yeniden kullanilabilir
//
// Bir kullanicinin hesabi (profiles + auth.users) silindikten SONRA, KVKK Madde 11
// kapanis/bilgilendirme maili gondermek icin. Atakan Ceyhan (27 May 2026) icin
// yazilan hesap-silme-onay-atakan.mjs sablonunun genel surumu.
//
// Yeni silme talebinde: asagidaki HEDEF blogunu duzenle, --dry ile onizle,
// --test <kendi-mail> ile dene, --send ile gercek gonder.
//
// Kullanim:
//   node scripts/hesap-silme-onay.mjs --dry             # icerik onizle
//   node scripts/hesap-silme-onay.mjs --test <email>    # test maili
//   node scripts/hesap-silme-onay.mjs --send            # HEDEF'e gercek gonderim
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

// ===== HEDEF BLOGU — her silme talebinde sadece bu kismi duzenle =====
const HEDEF = {
  ad: 'Ayfer',
  soyad: 'Artuç',
  email: 'afa_ss@hotmail.com',
  silme_tarihi_metin: '16 Haziran 2026', // mail icindeki tarih ibaresi
};
// ====================================================================

const SENDER = 'Pusula Istanbul <info@pusulaistanbul.app>';
const REPLY_TO = 'info@pusulaistanbul.app';
const SUBJECT = 'Pusula İstanbul Hesap Silme Talebiniz Sonuçlandı';
const LOGO_URL = 'https://pusulaistanbul.app/logo-icon.png';

function htmlIcerik({ ad, soyad, silme_tarihi_metin }) {
  const adSoyad = `${ad} ${soyad}`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pusula İstanbul Hesap Silme Talebiniz Sonuçlandı</title>
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
Pusula İstanbul nezdindeki hesabınızın silinmesine yönelik talebiniz tarafımıza ulaşmış ve başarıyla işleme alınmıştır. ${silme_tarihi_metin} tarihi itibarıyla hesabınız ve sistemlerimizde kayıtlı tüm kişisel verileriniz kalıcı olarak imha edilmiştir.
</p>

<p style="margin:0 0 16px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Sistemlerimizden kalıcı olarak silinen veri kategorileri aşağıda bilginize sunulmuştur:
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
<tr>
<td style="background-color:#f8fafc; border-left:4px solid #005A8D; border-radius:8px; padding:20px 24px;">

<p style="margin:0 0 12px 0; font-size:14px; color:#1a2b3c; line-height:1.9;">
&bull;&nbsp;&nbsp;<strong style="color:#005A8D;">Profil Bilgileri:</strong> Ad, soyad, e-posta adresi
</p>
<p style="margin:0 0 12px 0; font-size:14px; color:#1a2b3c; line-height:1.9;">
&bull;&nbsp;&nbsp;<strong style="color:#005A8D;">Mesleki Bilgiler:</strong> TUREB ruhsat numarası, çalışma bölgesi, dil tercihleri
</p>
<p style="margin:0 0 12px 0; font-size:14px; color:#1a2b3c; line-height:1.9;">
&bull;&nbsp;&nbsp;<strong style="color:#005A8D;">Sistem Kayıtları:</strong> Hesap oturum kayıtları (loglar)
</p>
<p style="margin:0; font-size:14px; color:#1a2b3c; line-height:1.9;">
&bull;&nbsp;&nbsp;<strong style="color:#005A8D;">Uygulama İçi Veriler:</strong> Mesajlar, bildirimler ve abonelik kayıtları
</p>

</td>
</tr>
</table>

<p style="margin:0 0 20px 0; font-size:14px; color:#4a5b6c; line-height:1.8;">
Söz konusu imha işlemi, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Madde 11'de belirtilen veri sahibi hakları doğrultusunda gerçekleştirilmiş olup, silinen verilerin teknik olarak geri getirilmesi veya kurtarılması mümkün değildir.
</p>

<p style="margin:24px 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Platformumuzu deneyimlediğiniz için teşekkür eder, mesleki çalışmalarınızda başarılar dileriz. İlerleyen dönemde Pusula İstanbul'a yeniden katılmak istemeniz halinde, aynı e-posta adresiyle geçmiş verilerden tamamen bağımsız yeni bir hesap oluşturabilirsiniz.
</p>

<p style="margin:0 0 24px 0; font-size:14px; color:#4a5b6c; line-height:1.8;">
Bu işlemle veya veri güvenliğinizle ilgili her türlü soru ve bilgi talebiniz için <a href="mailto:info@pusulaistanbul.app" style="color:#005A8D; text-decoration:none; font-weight:600;">info@pusulaistanbul.app</a> adresi üzerinden bizimle iletişime geçebilirsiniz.
</p>

<p style="margin:28px 0 0 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
Saygılarımızla,<br>
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

function textIcerik({ ad, soyad, silme_tarihi_metin }) {
  const adSoyad = `${ad} ${soyad}`;
  return `Sayın ${adSoyad},

Pusula İstanbul nezdindeki hesabınızın silinmesine yönelik talebiniz tarafımıza ulaşmış ve başarıyla işleme alınmıştır. ${silme_tarihi_metin} tarihi itibarıyla hesabınız ve sistemlerimizde kayıtlı tüm kişisel verileriniz kalıcı olarak imha edilmiştir.

Sistemlerimizden kalıcı olarak silinen veri kategorileri aşağıda bilginize sunulmuştur:

  - Profil Bilgileri: Ad, soyad, e-posta adresi
  - Mesleki Bilgiler: TUREB ruhsat numarası, çalışma bölgesi, dil tercihleri
  - Sistem Kayıtları: Hesap oturum kayıtları (loglar)
  - Uygulama İçi Veriler: Mesajlar, bildirimler ve abonelik kayıtları

Söz konusu imha işlemi, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Madde 11'de belirtilen veri sahibi hakları doğrultusunda gerçekleştirilmiş olup, silinen verilerin teknik olarak geri getirilmesi veya kurtarılması mümkün değildir.

Platformumuzu deneyimlediğiniz için teşekkür eder, mesleki çalışmalarınızda başarılar dileriz. İlerleyen dönemde Pusula İstanbul'a yeniden katılmak istemeniz halinde, aynı e-posta adresiyle geçmiş verilerden tamamen bağımsız yeni bir hesap oluşturabilirsiniz.

Bu işlemle veya veri güvenliğinizle ilgili her türlü soru ve bilgi talebiniz için info@pusulaistanbul.app adresi üzerinden bizimle iletişime geçebilirsiniz.

Saygılarımızla,
Pusula İstanbul

—
pusulaistanbul.app
Profesyonel Turist Rehberinin Dijital Asistanı
`;
}

async function gonder(toEmail, payload) {
  const body = {
    from: SENDER,
    to: toEmail,
    reply_to: REPLY_TO,
    subject: SUBJECT,
    html: htmlIcerik(payload),
    text: textIcerik(payload),
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
  console.log(`Hedef: ${HEDEF.ad} ${HEDEF.soyad} <${HEDEF.email}>`);
  console.log(`Tarih: ${HEDEF.silme_tarihi_metin}\n`);
  console.log('--- TEXT versiyonu ---\n');
  console.log(textIcerik(HEDEF));
  console.log('\nIcerigi onayliyorsan: --test <kendi-email-adresin> ile teste gec.');
  process.exit(0);
}

if (mode === '--test') {
  const testEmail = args[1];
  if (!testEmail) {
    console.error('HATA: --test moduna email parametresi gerekli.');
    console.error('  node scripts/hesap-silme-onay.mjs --test ayse.tokkus@gmail.com');
    process.exit(1);
  }
  console.log(`Test maili gonderiliyor: ${testEmail}`);
  console.log(`(Hedef bilgileri ile, sadece TO baska adres)`);
  try {
    const sonuc = await gonder(testEmail, HEDEF);
    console.log('OK:', sonuc);
    console.log('\nResend dashboard: https://resend.com/emails');
  } catch (e) {
    console.error('HATA:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (mode === '--send') {
  console.log(`Gercek gonderim: ${HEDEF.ad} ${HEDEF.soyad} <${HEDEF.email}>`);
  try {
    const sonuc = await gonder(HEDEF.email, HEDEF);
    console.log('OK:', sonuc);
    console.log('\nResend dashboard: https://resend.com/emails');
  } catch (e) {
    console.error('HATA:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

console.error('Bilinmeyen mod. Kullanim:');
console.error('  node scripts/hesap-silme-onay.mjs --dry');
console.error('  node scripts/hesap-silme-onay.mjs --test <email>');
console.error('  node scripts/hesap-silme-onay.mjs --send');
process.exit(1);
