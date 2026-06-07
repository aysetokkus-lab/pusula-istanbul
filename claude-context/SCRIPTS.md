# Pusula Istanbul — Script Arsivi

Bu dosya, projedeki kritik scheduled task'lara bagli script'lerin **tam kaynak kodunu** ve scheduled task SKILL.md prompt'larini barindirir. Amac: bir script silinir, bozulur veya bir yeni oturum mantigini hizlica gormek isterse referans olarak burada bulsun.

**ICERIK:**
- [1. bayram-hediye-otomatik](#1-bayram-hediye-otomatik) — 28 May 2026'da kuruldu, recurring */15 dk

---

## 1. bayram-hediye-otomatik

### Scheduled Task Meta

| Alan | Deger |
|------|-------|
| Task ID | `bayram-hediye-otomatik` |
| Cron | `*/15 * * * *` (her 15 dakikada) |
| Tetiklenme | Recurring — Cowork acik oldugu surece |
| Kurulus tarihi | 28 May 2026 (Kurban Bayrami 2. gunu, sabah) |
| Kampanya penceresi | 28 May 2026 00:00 +03 → 1 Haz 2026 00:00 +03 |
| Oto-kapanis | Script tarihi kontrol eder, 1 Haz sonrasi no-op |
| **Manuel disable hatirlatici** | **1 Haziran 2026 sabahi `mcp__scheduled-tasks__update_scheduled_task taskId=bayram-hediye-otomatik enabled=false` cagrilmali** (recurring oldugu icin her 15 dk no-op cikti gurultusu yaratir) |
| Script | `scripts/bayram-hediye-otomatik.mjs` |
| Audit log | `scripts/data/bayram-hediye-otomatik-log.json` |
| Idempotency | SQL filtresi `abonelik_durumu != 'aktif'` — ayni kullanici 2. kez yakalanmaz |

### Scheduled Task SKILL.md Prompt

```markdown
## Gorev: Pusula Istanbul'a 28-30 May 2026 doneminde yeni kayit olan rehberlere otomatik premium hediye + hos geldin maili gonder

### Baglam
Kurban Bayrami kampanyasi: 28-30 May 2026 araliginda kayit olan kullanicilara 1 Haziran 2026 00:00'a kadar otomatik premium uyelik veriliyor. Bu task her 15 dakikada bir tetiklenir; yeni kayit varsa otomatik isler.

Kullanici (Ayse) hicbir komut vermeden bu kampanya otomatik calismali.

### Calistirilacak komut
Tek bir node script'i, hersey iceride:

`cd /Users/aysetokkus/istanbul-rehber && node scripts/bayram-hediye-otomatik.mjs`

Bu script:
1. .env'den SUPABASE_SERVICE_ROLE_KEY ve RESEND_API_KEY okur
2. Profiles tablosundan 28 May 00:00 - 1 Haz 00:00 +03 araliginda kayitli + abonelik_durumu != 'aktif' kullanicilari ceker (yani henuz hediye almamis yeni kayitlar)
3. Her birine atomic UPDATE: abonelik_durumu='aktif', abonelik_plani='aylik', abonelik_bitis='2026-06-01T00:00:00+03:00'
4. Hos geldin + bayram hediyesi mailini Resend ile gonderir (Subject: "Pusula Istanbul'a Hos Geldiniz - Bayram Hediyeniz Hazir")
5. Audit log: scripts/data/bayram-hediye-otomatik-log.json (her run + her kullanici kaydi)

### Idempotency
Script idempotent: SQL filtresi (abonelik_durumu != 'aktif') sayesinde ayni kullanici 2. kez yakalanmaz. Mail tekrar gonderilmez.

### Oto-kapanis
1 Haziran 2026 00:00 +03 sonrasi script tarihi kontrol eder ve "kampanya bitti" mesaji ile no-op doner. Eylem alinmaz.

### Calistir ve raporla

1. Yukarıdaki bash komutunu calistir (mcp__workspace__bash kullan)
2. Output'tan su satirlari rapor et:
   - "Yakalanan yeni kayit: N"
   - "OZET: X hediye, Y mail, Z hata"
3. Eger hata varsa veya yakalanan > 0 ise detayli rapor ver
4. Hicbir kayit yoksa kisa "0 yeni kayit, no-op" raporu ile bitir (gurultu yapma)

### Hatalar

- "Kampanya bitti" mesaji gorursen: bu task'i disable etmek icin Ayse'ye bildir (kampanya bitti, manuel disable gerekli)
- Resend hatasi (HTTP 4xx/5xx): hatayi raporla, script audit log'a yazar, sonraki run otomatik retry edemez (cunku SQL basarili sayilir) — bu durumlari ayrica vurgu ile raporla
- SQL hatasi: script kaydeder, raporla

### Beklenmedik durum

Eger script kosmazsa (node yok, dosya yok, env yok), olduğun gibi raporla — Ayse manuel mudahale eder.

### Kisitlar

- Asla --dry modu kullanma (canli calismali)
- Asla SUPABASE_SERVICE_ROLE_KEY veya RESEND_API_KEY'i loglama
- Cikti varsa Turkce raporla (Ayse'nin tercihi)
```

### Script Tam Kaynak Kod: `scripts/bayram-hediye-otomatik.mjs`

```javascript
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
```

### Tasarim Notlari (DECISIONS bagi)

- **External URL logo:** DECISIONS #40 — base64 inline degil, `https://pusulaistanbul.app/logo-icon.png` (Gmail rasterize) referansli
- **3 sutunlu PUSULA-logo-ISTANBUL pattern:** INFRASTRUCTURE.md Bolum 1 "Email Tasarim DNA'si" — markali butun mailler bu duzeni izler
- **Italic gri kutu:** Premium plan tanitimi (aylik 99 TL / yillik 699 TL %41 avantajli) — agresif satis tonu degil, bilgilendirme
- **Idempotency garantisi:** `or=(abonelik_durumu.is.null,abonelik_durumu.neq.aktif)` — yeni kayitlarda profile satiri henuz `created_at`'ten birkac saniye sonra olusur, abonelik_durumu null veya freemium oldugu surece yakalanir; hediye uygulandiktan sonra aktif olur ve bir daha yakalanmaz
- **500ms gecikme:** Resend rate-limit guvenligi (yakalanan 5+ kayit oldugunda)

---

## 2. havaist-senkron

### Scheduled Task Meta

| Alan | Deger |
|------|-------|
| Task ID | `havaist-senkron` |
| Cron | `0 7 * * *` (her gun 07:00 TR) |
| Tetiklenme | Recurring — Cowork acik oldugu surece |
| Kurulus tarihi | 2 Haziran 2026 |
| Yer aldigi DB tablo | `havalimani_seferleri` (sadece `firma='havaist'`, `havalimani='IST'`) |
| Etkilenen DB satir sayisi | 14 IST kaydi (HVL-1..9, HVIST-5A, 7, 11, 13) |
| Script | `scripts/havaist-senkron.mjs` |
| Audit log | `scripts/data/havaist-senkron-log.json` |
| API kaynak | `https://s.hava.ist/api.php` (resmi Havaist backend) |
| Idempotency | Outbound + inbound saat dizilerinin element-wise karsilastirmasi + fiyat/sure scalar karsilastirmasi. Fark yoksa PATCH atmaz, `push_havalimani_trigger` tetiklenmez. |

### Bagli Karar
**DECISIONS #44** — Havaist Resmi Backend API > Firecrawl Scrape.

### Scheduled Task SKILL.md Prompt

Yukaridaki "Calistirilacak komut" satiri: `cd /Users/aysetokkus/istanbul-rehber && node scripts/havaist-senkron.mjs --auto`. `--auto` modu: yalniz OZET satiri ve hata varsa detay basar (gunluk no-op gurultusunu engeller). Tam prompt: `/Users/aysetokkus/Documents/Claude/Scheduled/havaist-senkron/SKILL.md`.

### Script Tam Kaynak Kod

Tam kaynak `scripts/havaist-senkron.mjs` dosyasinda — buraya kopyalamiyorum cunku 280+ satir ve canli kaynak hep guncel kalir. Onemli yapi parcalari:

1. **`loadEnv()`** — `.env` dosyasini manuel parse eder, `SUPABASE_SERVICE_ROLE_KEY`'i yukler. dotenv paketi gereksinmiyor.
2. **`DURAKLAR` array** — Her DB satirini (`durak_id`) bir Havaist hattin'a (`line_id`, `type`) baglar. Bu mapping en kritik tablo:
   - HVL-1 aksaray (line 26, ibb), HVL-2 beylikduzu (15, ibb), HVL-3 otogar_esenler (6, ibb), HVL-4 merter_bakirkoy (9, ibb)
   - HVL-6 kadikoy (32, ibb), HVL-7 avcilar + bahcesehir_merkez (17, ibb), HVL-8 halkali_i_stasyon (31, ibb)
   - HVL-9 taksim + besiktas (23, ibb) — iki durak ayni hat, ayni saatleri paylasir
   - HVIST-5A arnavutkoy (30, havaist), HVIST-7 silivri_catalca (14, havaist), HVIST-11 sultanahmet_catladikapi (32, havaist), HVIST-13 sabiha_gokcen (3, havaist)
3. **`api()`** — POST cagri yardimcisi (Origin/Referer/X-Requested-With headers olmazsa 403 doner)
4. **`sbSelect/sbPatch/sbInsert`** — Supabase REST API REST cagrilari. Service role key kullanir, RLS bypass.
5. **Ana akis** — 4 adim:
   - (a) `get-from-stations` → tum 57 duraktan unique (line_id, type) ciftlerini cikar
   - (b) Her cifte 1-2 `get-to-stations-price` cagrisi (outbound + inbound). Outbound = airport'tan kalkan (havdan_sehir), inbound = sehir master'indan kalkan (sehirden_hav)
   - (c) DB'deki mevcut Havaist/IST kayitlarini SELECT
   - (d) DURAKLAR tablosunun her satiri icin: DB'de varsa fark karsilastir → PATCH, yoksa INSERT
6. **Override etmedigi alanlar** — `durak_adi`, `not_bilgi`, `sehirden_hav_guzergah`, `havdan_sehir_guzergah` (kullanici dostu metinler, admin panelden duzenlenebilir kalir)
7. **Audit log** — Her run icin `scripts/data/havaist-senkron-log.json`'a entry yazar. Sadece gercek run (non-dry).

### Push Trigger Etkilesimi

`push_havalimani_trigger` AFTER UPDATE ON `havalimani_seferleri` FOR EACH ROW. Her UPDATE bir push tetikler ('etkinlikler' kategori, "Havalimani Tarife Guncellemesi" baslik). Idempotency'nin onemi burada:
- Eger script fark yoksa PATCH atmazsa, trigger tetiklenmez, kullaniciya bos push gitmez
- Eger gercek bir fiyat veya saat degisikligi olursa, ilgili durak icin tek bir push gider

**Ilk migration (2 Haz 2026):** 7 UPDATE + 7 INSERT vardi. 7 UPDATE'in 7 push tetiklemesini onlemek icin trigger gecici DISABLE → senkron → ENABLE yapildi. Sonraki gunluk run'larda zaten cok az degisiklik bekleniyor — trigger her zaman aktif kalir.

### Kullanim Modlari

- **Normal** (`node scripts/havaist-senkron.mjs`) — Sessiz, audit log + OZET satiri + Degisiklikler bloku
- **--dry** — DB'ye yazma yok, sadece raporlar. Test/preview icin
- **--auto** — Scheduled task tarafindan cagirilir. Sadece OZET ve hata logu
- **--verbose** — Tum log satirlari (debug)

### Hatalar ve Sinirlamalar

- API HTTP 4xx/5xx → senkron yarida kalir, ilgili hat atlanir (`HATA: hat ...` log), digerleri devam eder, `errorCount` artar, exit code 1
- Bos saat listesi → hat atlanir (`ATLA: bos saat listesi`)
- Supabase 4xx/5xx → spesifik durak atlanir, digerleri devam eder
- Havabus (SAW) bu script'in disindadir, admin panel ile yonetilir


---

## 3. turyol-senkron

| Alan | Deger |
|------|-------|
| Task ID | `turyol-senkron` |
| Cron | `30 7,19 * * *` (07:30 + 19:30 TR, gunde 2 kez) |
| Kuruldu | 5 Haziran 2026 |
| Durum | AKTIF |
| Script | `scripts/turyol-senkron.mjs` |
| Audit log | `scripts/data/turyol-senkron-log.json` |

### Ne Yapar
turyol.com/Home/Tarifeler sayfasina form POST atar (`TarifeKalkisId=4_104_1_101&TarifeVarisId=` — Bogaz Turu > Eminonu Iskele; varis alani bogaz turunda kullanilmaz). Cevap server-rendered HTML: `#datatable-responsive` tablosu 3 kolon (HAFTAICI | CUMARTESI | PAZAR) + `Bilet Fiyati : NNN TL` metni. Parse edilen veriler `bogaz_turlari` tablosundaki TURYOL/standart satirina yazilir: `hafta_ici_saatler` ← HAFTAICI, `hafta_sonu_saatler` ← CUMARTESI (Pazar farkliysa union + uyari — DB'de tek hafta sonu kolonu var), `fiyat` ← "300 TL" formati.

### Tasarim Notlari
1. **Idempotent** — alanlar tek tek karsilastirilir, degisim yoksa UPDATE atilmaz (push trigger bosa tetiklenmez).
2. **Guvenlik agi** — haftaici veya cumartesi <5 sefer ise ya da hucrede saat-olmayan deger varsa FATAL, DB'ye yazilmaz (site bozulursa veri korunur).
3. **Saat normalize** — "9:00" → "09:00".
4. **Push** — gercek degisimde `push_bogaz_trigger` 'admin' kategorisinde "Tarife Guncellendi" push'u atar (DECISIONS #48: trigger'lar SECURITY DEFINER).
5. **Form kodu cozumu** — `TarifeKalkisId` degeri `mainHatTuru_hatTuru_mainKalkis_kalkis` formatinda; Bogaz turu mainHatTuru=4, Eminonu kalkis=1. Site JS'i bogaz turunda Nereye combobox'unu gizler, POST bos `TarifeVarisId` ile gider.

### Calistirma Modlari
- `node scripts/turyol-senkron.mjs` — normal (log + OZET)
- `--dry` — DB yazmadan rapor
- `--auto` — scheduled task modu (yalniz OZET + hatalar)
- `--verbose` — saat listeleri dahil detay

### SKILL.md Prompt (ozet)
Komut: `cd /Users/aysetokkus/istanbul-rehber && export PATH="/opt/homebrew/opt/node@20/bin:$PATH" && node scripts/turyol-senkron.mjs --auto`. "degisim yok" → sessiz bitir; "GUNCELLENDI" → kisa ozet bildir; "Cumartesi ile Pazar farkli" uyarisi → mutlaka bildir; FATAL → log dosyasindan tani + bildir. Tam prompt: `/Users/aysetokkus/Documents/Claude/Scheduled/turyol-senkron/SKILL.md`.
