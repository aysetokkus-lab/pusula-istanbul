// Pusula Istanbul — Manuel Onay Bilgilendirme Mail Gonderici
//
// Microsoft (Hotmail/Outlook) ve Yahoo spam filtrelerine takilan kullanicilara,
// hesaplarinin manuel olarak onaylandigini bildiren markali email gonderir.
//
// Kullanim:
//   node scripts/manuel-onay-bilgilendirme.mjs --dry             # icerigi yazdir, gonderme
//   node scripts/manuel-onay-bilgilendirme.mjs --test <email>    # tek bir test maili gonder
//   node scripts/manuel-onay-bilgilendirme.mjs --all             # 7 kullaniciya gercekten gonder
//
// .env dosyasinda RESEND_API_KEY tanimli olmali (Sending access yeterli).

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');

// .env'i manuel parse et (dotenv paketi gereksinmiyor)
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
const SUBJECT = 'Pusula İstanbul Hesabınız Hakkında Bilgilendirme';

// Inline logo (test-kullanici-mail.html'den alindi, marka tutarliligi icin).
// 80x80 PNG, windrose pusula, mavi tema. Base64 gomulu — alici client'i internet
// erisimi olmadan da render eder.
const LOGO_BASE64 = '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';

// 27 Mayis 2026 manuel onay listesi (Microsoft + Yahoo spam filtresi magdurlari)
const ALICILAR = [
  { ad: 'Erol',     soyad: 'Zeybey',             email: 'ezeybey@hotmail.com',         hitap: 'Bey'   },
  { ad: 'Mustafa',  soyad: 'Soysal',             email: 'soysalmustafa@hotmail.com',   hitap: 'Bey'   },
  { ad: 'Yavuz',    soyad: 'Doğanay',            email: 'yavuzdo@hotmail.com',         hitap: 'Bey'   },
  { ad: 'Ali',      soyad: 'Karaçaylı',          email: 'alikaracayli@hotmail.com.tr', hitap: 'Bey'   },
  { ad: 'Sevgi',    soyad: 'Aktaş Kaymakçalan',  email: 'sevgi_tr_lv@hotmail.com',     hitap: 'Hanım' },
  { ad: 'Kadri',    soyad: 'Vanlıoğlu',          email: 'kvanlioglu@hotmail.com',      hitap: 'Bey'   },
  { ad: 'Fevziye',  soyad: 'Akman',              email: 'fevziye22@yahoo.com',         hitap: 'Hanım' },
];

function htmlIcerik({ ad, hitap }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pusula İstanbul Hesabınız Hakkında Bilgilendirme</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:32px 16px;">
<tr>
<td align="center">

<!-- Ana Kart -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,90,141,0.12);">

<!-- Header Gradient -->
<tr>
<td style="background:linear-gradient(135deg, #005A8D 0%, #0077B6 50%, #0096C7 100%); padding:40px 40px 32px 40px; text-align:center;">

<!-- Logo -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
<tr><td style="text-align:center;">
<img src="data:image/png;base64,${LOGO_BASE64}" alt="Pusula Istanbul" width="80" height="80" style="display:block; margin:0 auto; border-radius:16px;" />
</td></tr>
</table>

<h1 style="margin:0 0 4px 0; font-size:26px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">
PUSULA İSTANBUL
</h1>
<p style="margin:0; font-size:13px; color:rgba(255,255,255,0.8); letter-spacing:2px;">
PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI
</p>

</td>
</tr>

<!-- Icerik -->
<tr>
<td style="padding:36px 40px 12px 40px;">

<p style="margin:0 0 24px 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
Sayın ${ad} ${hitap},
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Pusula İstanbul'a kayıt olduğunuz için teşekkür ederiz.
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Kayıt işleminiz esnasında sistemimiz tarafından iletilen doğrulama bağlantısının, e-posta sağlayıcınızın filtrelerine (Hotmail/Outlook vb.) takılmış olabileceği tespit edilmiştir. Uygulamaya erişiminizde herhangi bir gecikme yaşamamanız adına hesabınız tarafımızca manuel olarak onaylanmıştır. Kayıt sırasında belirlediğiniz şifreniz ile sisteme doğrudan giriş yapabilirsiniz.
</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Şifrenizi hatırlamamanız durumunda, giriş ekranında yer alan <strong style="color:#005A8D;">"Şifremi Unuttum"</strong> bağlantısı üzerinden yeni bir şifre talep edebilirsiniz. İlgili e-postanın tarafınıza ulaşmaması hâlinde, bu mesaja yanıt vererek bizimle iletişime geçmeniz durumunda size memnuniyetle yardımcı olacağız.
</p>

<!-- Guncelleme Kutusu -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="background:linear-gradient(135deg, #005A8D 0%, #0077B6 100%); border-radius:12px; padding:24px 28px;">

<p style="margin:0 0 10px 0; font-size:16px; font-weight:700; color:#ffffff;">
Önemli Güncelleme
</p>
<p style="margin:0; font-size:14px; color:rgba(255,255,255,0.95); line-height:1.8;">
Bugün yayına alınacak olan yeni sürümümüz <strong style="color:#48CAE4;">(v1.0.14)</strong>, bazı kullanıcılarımızda karşılaşılan uygulama açılış aksaklıklarını gidermektedir. Kesintisiz bir kullanım deneyimi için App Store veya Google Play üzerinden uygulamanızı güncel tutmanızı rica ederiz.
</p>

</td>
</tr>
</table>

<p style="margin:24px 0 0 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Tüm soru, görüş ve önerileriniz için bu e-postayı yanıtlayabilir veya <a href="mailto:info@pusulaistanbul.app" style="color:#005A8D; text-decoration:none; font-weight:600;">info@pusulaistanbul.app</a> adresi üzerinden bizimle iletişime geçebilirsiniz.
</p>

<p style="margin:28px 0 0 0; font-size:16px; color:#1a2b3c; line-height:1.8;">
İyi turlar dileriz,<br>
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

function textIcerik({ ad, hitap }) {
  return `Sayın ${ad} ${hitap},

Pusula İstanbul'a kayıt olduğunuz için teşekkür ederiz.

Kayıt işleminiz esnasında sistemimiz tarafından iletilen doğrulama bağlantısının, e-posta sağlayıcınızın filtrelerine (Hotmail/Outlook vb.) takılmış olabileceği tespit edilmiştir. Uygulamaya erişiminizde herhangi bir gecikme yaşamamanız adına hesabınız tarafımızca manuel olarak onaylanmıştır. Kayıt sırasında belirlediğiniz şifreniz ile sisteme doğrudan giriş yapabilirsiniz.

Şifrenizi hatırlamamanız durumunda, giriş ekranında yer alan "Şifremi Unuttum" bağlantısı üzerinden yeni bir şifre talep edebilirsiniz. İlgili e-postanın tarafınıza ulaşmaması hâlinde, bu mesaja yanıt vererek bizimle iletişime geçmeniz durumunda size memnuniyetle yardımcı olacağız.

Ayrıca önemli bir güncellemeyi de paylaşmak isteriz: Bugün yayına alınacak olan yeni sürümümüz (v1.0.14), bazı kullanıcılarımızda karşılaşılan uygulama açılış aksaklıklarını gidermektedir. Kesintisiz bir kullanım deneyimi için App Store veya Google Play üzerinden uygulamanızı güncel tutmanızı rica ederiz.

Tüm soru, görüş ve önerileriniz için bu e-postayı yanıtlayabilir veya info@pusulaistanbul.app adresi üzerinden bizimle iletişime geçebilirsiniz.

İyi turlar dileriz,

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
  const ornek = ALICILAR[0];
  console.log(`Sender: ${SENDER}`);
  console.log(`Reply-To: ${REPLY_TO}`);
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Ornek alici: ${ornek.ad} ${ornek.soyad} ${ornek.hitap} <${ornek.email}>\n`);
  console.log('--- TEXT versiyonu (HTML render edemeyen istemciler icin) ---\n');
  console.log(textIcerik(ornek));
  console.log('\n--- Toplam alici listesi ---');
  for (const a of ALICILAR) {
    console.log(`  - ${a.ad} ${a.soyad} ${a.hitap} <${a.email}>`);
  }
  console.log(`\nToplam: ${ALICILAR.length} kisi.`);
  console.log('\nIcerigi onayliyorsan: --test <kendi-email-adresin> ile teste gec.');
  process.exit(0);
}

if (mode === '--test') {
  const testEmail = args[1];
  if (!testEmail) {
    console.error('HATA: --test moduna email parametresi gerekli. Ornek:');
    console.error('  node scripts/manuel-onay-bilgilendirme.mjs --test ayse.tokkus@gmail.com');
    process.exit(1);
  }
  const testAlici = { ad: 'Test', soyad: 'Kullanici', email: testEmail, hitap: 'Hanım' };
  console.log(`Test maili gonderiliyor: ${testEmail}`);
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
  console.log(`Gercek gonderim baslatiliyor — ${ALICILAR.length} kisi.\n`);
  let basarili = 0;
  let basarisiz = 0;
  for (const alici of ALICILAR) {
    process.stdout.write(`  ${alici.ad} ${alici.soyad} <${alici.email}> ... `);
    try {
      const sonuc = await gonder(alici);
      console.log(`OK (id: ${sonuc.id})`);
      basarili++;
    } catch (e) {
      console.log(`HATA: ${e.message}`);
      basarisiz++;
    }
    // Rate limit korumasi (Resend free tier 10/saniye, biz 2/saniye gidiyoruz)
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n=== Sonuc: ${basarili} basarili, ${basarisiz} basarisiz ===`);
  console.log('Resend dashboard\'da gorebilir: https://resend.com/emails');
  process.exit(basarisiz === 0 ? 0 : 1);
}

console.error('Bilinmeyen mod. Kullanim:');
console.error('  node scripts/manuel-onay-bilgilendirme.mjs --dry');
console.error('  node scripts/manuel-onay-bilgilendirme.mjs --test <email>');
console.error('  node scripts/manuel-onay-bilgilendirme.mjs --all');
process.exit(1);
