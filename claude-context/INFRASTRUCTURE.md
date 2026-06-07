# Pusula Istanbul - Altyapi ve Servisler

Bu dosya disaridaki servislerle (Resend, EAS, RevenueCat, GoDaddy, Apple, Google) iliskileri tasiyor. Yeni feature'da DNS / SMTP / EAS env / store config ile ilgili bir sey yapacaksan once buraya bak.

---

## 1. EMAIL ALTYAPISI — Custom SMTP (26 Nisan 2026)

### Genel Mimari
Auth e-postalari (kayit dogrulama, sifre sifirlama, email degisikligi vb.) artik Supabase'in default SMTP'sinden DEGIL, kendi domain'imiz uzerinden Resend araciligi ile gonderiliyor.

```
Supabase Auth → Custom SMTP (smtp.resend.com:465) → Resend → AWS SES (eu-west-1 / Dublin) → Kullanici inbox
```

Gonderici: **Pusula Istanbul \<noreply@pusulaistanbul.app\>**

### Resend Konfigurasyonu
- **Hesap:** https://resend.com — **Pro plan $20/ay** (50.000 email/ay limit)
- **Domain:** pusulaistanbul.app (Verified, Region: Ireland eu-west-1, KVKK uyumu icin AB icinde)
- **API Key:** Supabase Dashboard'a yapistirilmis (encrypted), ad: `pusula-supabase-prod`, permission: Sending access

### DNS Kayitlari (GoDaddy'de)
- **TXT** `resend._domainkey` → DKIM key (`p=MIGfMA0...wIDAQAB`)
- **TXT** `send` → SPF (`v=spf1 include:amazonses.com ~all`)
- **MX** `send` → `feedback-smtp.eu-west-1.amazonses.com` priority 10

### Supabase Custom SMTP Ayarlari
Path: **Authentication > Emails > SMTP Settings**
- Sender email: `noreply@pusulaistanbul.app`
- Sender name: `Pusula Istanbul`
- Host: `smtp.resend.com`
- Port: `465` (SSL)
- Username: `resend`
- Password: Resend API key
- Rate limit: **150/saat** (Authentication > Rate Limits — default 30'dan yukseltildi)

### 5 Email Template'i (markali Turkce HTML)
**Authentication > Emails > Templates** altinda:
1. **Confirm signup** — Kayit dogrulama (24 saat)
2. **Reset Password** — Sifre sifirlama (1 saat)
3. **Change Email Address** — Email degisikligi onayi (24 saat)
4. **Magic Link** — Sifresiz giris (1 saat — su an aktif degil ama hazir)
5. **Invite User** — Admin kullanici daveti (24 saat)

### Tasarim DNA'si (5 template ayni)
- **Header:** 4-renk diyagonal gradient (`linear-gradient(135deg, #00A8E8 0%, #0077B6 33%, #0096C7 67%, #48CAE4 100%)`)
- **Layout:** `PUSULA · windrose logo · ISTANBUL` yatay (uppercase, font-weight 800, letter-spacing 5px)
- **Logo:** `https://pusulaistanbul.app/logo-icon.png` (white-on-transparent, width 67 height 48 — proportional 1.4:1)
- **Font:** Poppins (Google Fonts @import — Apple Mail/Outlook'da yuklenir, Gmail system fallback)
- **CTA buton:** `#0077B6` mavi, beyaz metin
- **Footer:** signature ("Pusula Istanbul / Profesyonel Turist Rehberinin Dijital Asistani"), Instagram pembe buton, copyright + linkler
- **Email-safe HTML:** tablo bazli layout (Outlook uyumlu), inline styles

### Maliyet Yapisi
- Resend Pro: **$20/ay** (50K email/ay, 100/gun limit yok)
- Supabase Pro: **$25/ay** (Custom SMTP, daily backup, 100K MAU dahil)
- **Toplam altyapi: ~$45-55/ay**
- Detayli senaryolar: `pusula-istanbul-maliyet-ongoru.xlsx`

### Web Tarafi Logo Aspect Ratio Fix
Eski: `docs/index.html` `.navbar-logo img { width: 48px; height: 48px; }` — windrose oval gorunuyordu
Yeni: `height: 48px; width: auto;` — dogal 1.4:1 oran, kusursuz yuvarlak compass
3 yerde fix: default + 640px breakpoint + 400px breakpoint
**Push edilmeli:** `git add docs/index.html && git commit -m "fix: navbar logo aspect ratio" && git push`

---

## 2. EAS BUILD & SUBMIT YAPILANDIRMASI

### `eas.json`
- **Submit iOS:** appleId: ayse.tokkus@gmail.com, ascAppId: 6761419678, appleTeamId: 7UJVL94SMJ
- **Submit Android:** serviceAccountKeyPath: `./google-service-account.json`, track: internal
- **Profiller:** development, preview, production

### Onemli Anahtarlar
- **Apple API Key (Subscription):** Issuer ID: `76c4733c-987c-4fca-898a-8e1de261086e`, Key ID: `GGLXW2D7L7` (`SubscriptionKey_GGLXW2D7L7.p8` Downloads klasorunde)
- **API Key (EAS olusturdu):** Key ID: `A6LW9W3HRX`
- **Google Service Account:** `revenuecat@pusula-istanbul.iam.gserviceaccount.com` (Admin izinleri)
- **Google Service Account JSON:** `google-service-account.json` (proje kokunde)

### EAS CLI Komutlari (v18.5+ — eski `eas secret:*` DEPRECATED)
```bash
# Env degisken olustur
eas env:create --name EXPO_PUBLIC_X_BEARER_TOKEN --value "..." --environment production --visibility sensitive

# Listele
eas env:list --environment production

# Sil
eas env:delete --name EXPO_PUBLIC_X_BEARER_TOKEN --environment production

# Build
eas build --platform all --profile production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest
```

### KRITIK NOTLAR
- **EXPO_PUBLIC_** prefix'li degiskenler `--visibility secret` kabul ETMEZ → `--visibility sensitive` kullan
- **Her environment icin ayri ayri** olusturulmali (production, preview, development)
- Service account izin propagasyonu yavas — `eas submit` calismiyorsa Play Console'dan manuel yukle

---

## 3. APPLE APP STORE CONNECT

### Kimlik
- Apple Developer: AKTIF (Team ID: **7UJVL94SMJ**, Provider ID: 128724610)
- App Store Connect App ID: **6761419678**
- SKU: `pusulaistanbul001`
- App ID: `com.pusulaistanbul.app`

### Subscriptions
- **Subscription Group:** "Pusula Istanbul Premium" — 2 abonelik (Aylik + Yillik), 175 ulke fiyat ayarli, **Turkish lokalizasyon eklendi (Missing Metadata cozumu — bkz. DECISIONS.md)**
- Aylik Plan: ₺99,99/ay
- Yillik Plan: ₺699 (=58,25 TL/ay, %41 tasarruf)
- **Siralama:** Yillik=Level 1, Aylik=Level 2 (descending order)
- **Review Screenshot:** 1290x2796 iPhone boyutu paywall goruntusu yuklendi

### EULA
- Custom License Agreement (Turkce + Ingilizce) eklendi (App Information > License Agreement)
- Apple Guideline 3.1.2c gerekligi

### Demo Hesaplar (Supabase'de ayarli)
- `demo.test@pusulaistanbul.app` / `123456` — suresi dolmus abonelik (ucretsiz katman test)
- `aysetokkus@hotmail.com` / `123456` — aktif premium (2027'ye kadar SQL ile ayarli)

### Manual Release ZORUNLU (v1.0.7'den itibaren)
v1.0.7 felaketi sonrasi: her release'de Manual release sec, otomatik release yapma. Bkz. DECISIONS.md "Manual Release Zorunlu".

### Business / Vergi (20 Nisan 2026)
- **Paid Apps Agreement:** Active (5 Nis 2026 - 31 Mar 2027)
- **W-8BEN:** Turkey, Article 12(2), %10 withholding (ABD %30 yerine), TC Kimlik No, DOB, Tax Treaty Benefits, Income from sale of applications
- **U.S. Certificate of Foreign Status:** Individual/Sole proprietor, Turkiye
- **Bank Account:** Active

---

## 4. GOOGLE PLAY CONSOLE

### Kimlik
- Hesap: AKTIF ($25 odendi)
- Package: `com.pusulaistanbul.app`
- Play Store linki: https://play.google.com/store/apps/details?id=com.pusulaistanbul.app

### Abonelikler
- com.pusulaistanbul.app.aylik (Aylik Plan)
- com.pusulaistanbul.app.yillik (Yillik Plan)
- Her ikisi de Etkin

### Kapali Test (Alpha)
- 12 test kullanicisi (12 Nisan 2026'da aktive edildi)
- 14 gun bekleme suresi 27 Nisan'da doldu — production'a basvurulabilir
- Bos "Pusula-Alpha" kanali silinebilir (karisiklik onleme)

### License Testing
- Dahili Test listesi: ayse.tokkus@gmail.com + aysetokkusbayar@gmail.com
- RESPOND_NORMALLY
- IAP odeme testi BASARILI (25 Nisan 2026)
- **NOT:** Tester eklendikten sonra propagasyon birkaç saat surebilir. Tablette Play Store cache + veri temizligi + yeniden baslatma gerekebilir.

### Store Listing
- Tamamlandi (Turkce — uygulama adi, aciklamalar, ekran goruntuleri, feature graphic, uygulama ikonu)
- **GUNCELLENMELI:** Description'daki "7 gunluk ucretsiz deneme" referansi freemium modele uygun hale getirilmeli + abonelik iptal bilgisi eklenmeli
- Play Store ikonu: `assets/images/play-store-icon.png` (512x512 kare PNG, koseleri duz)
- Feature graphic: `assets/images/feature-graphic.png` (1024x500)

### Yapilandirma
- Uygulama kategorisi: **Araclar (Tools)**
- Uygulama icerigi beyanlari: 11/11 tamamlandi
- IARC: 12+ (sohbet ozelligi)
- Odeme profili: Google Payments aktif
- **Yonetilen yayinlanma:** ACIK (manuel onay gerekli — Apple manual release pattern karsiligi)

---

## 5. REVENUECAT

### Yapilandirma
- Proje: **Pusula Istanbul**
- **Entitlement ID:** `pro` (lib/revenuecat.ts ile birebir esleme)
- **Offering:** "default" — Monthly (`$rc_monthly`) + Yearly (`$rc_annual`) + Lifetime (`$rc_lifetime`)

### Products
- **App Store:** com.pusulaistanbul.app.aylik + com.pusulaistanbul.app.yillik
- **Play Store:** com.pusulaistanbul.app.aylik:aylik + com.pusulaistanbul.app.yillik:yillik
- **Test Store:** Monthly + Yearly + Lifetime

### SDK Entegrasyonu
- `react-native-purchases` paket `package.json`'da
- `lib/revenuecat.ts` — `revenueCatInit()` (anonim, _layout.tsx'de uygulama acilisinda) + `revenueCatLogin()` (giris sonrasi)
- `hooks/use-abonelik.ts` — entegrasyon

### Bilinen Durum
- Products statusu "Could not check" — dahili test aktif olduktan sonra duzelmesi bekleniyor
- Yearly paketinden App Store aylik plan cikarildi, yillik plan eklendi (DUZELTILDI)

---

## 6. WEB SAYFASI (pusulaistanbul.app)

### Hosting
- **GitHub Pages** aktif, custom domain baglandi
- **GitHub Repo:** https://github.com/aysetokkus-lab/pusula-istanbul.git
- Eski URL: https://aysetokkus-lab.github.io/pusula-istanbul/ (custom domain'e 301 redirect)

### Kaynak Dosyalar (`docs/` klasoru)
- `docs/index.html` — Landing page + gizlilik politikasi + kullanim kosullari (tek dosyada SPA mantigi)
- `docs/CNAME` — pusulaistanbul.app
- `docs/logo-icon.png` — Logo (email template'lerde de kullanilir)
- `docs/ss-1.png ~ ss-5.png` — Promotional screenshots
- `docs/musteri-rehber-sozlesmesi.docx` — Musteri-rehber sozlesmesi
- `docs/acente-hizmet-sozlesmesi.docx` — Acente-hizmet sozlesmesi
- `docs/dogrulandi.html` — Email dogrulama basari sayfasi (yesil checkmark, "Uygulamayi Ac" butonu)

### Sayfa Sirasi
Hero > Screenshots > Features > Premium > Legal > Footer

### GoDaddy DNS Kayitlari
- 4x A kaydi: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages)
- CNAME `www` → `aysetokkus-lab.github.io`
- TXT `_github-pages-challenge` (dogrulama)
- TXT/MX `send` ve TXT `resend._domainkey` — Email icin (yukarida)

---

## 7. SUPABASE

### URL ve Kimlik
- URL: `https://rzlfghjpsximthlolfxo.supabase.co`
- Plan: **Pro $25/ay** (Custom SMTP, daily backup, 100K MAU)
- Dashboard: https://supabase.com/dashboard/project/rzlfghjpsximthlolfxo

### Auth Yapilandirmasi
- Email/Password (Email confirmation **ACIK**)
- Site URL: `https://pusulaistanbul.app`
- Redirect URLs:
  - `pusulaistanbul://`
  - `https://pusulaistanbul.app`
  - `pusulaistanbul://giris`
  - `https://pusulaistanbul.app/dogrulandi.html`
- Rate limit: 150/saat (default 30'dan yukseltildi)

### Tablolar
- `profiles` (kolon adi `rol` Turkce — RLS policy'lerinde dikkat!)
- `sohbet_mesajlari`
- `yogunluk`
- `canli_durum` (CHECK constraint'e 'serbest_not' eklendi)
- `raporlanan_mesajlar`
- `etkinlikler`
- `kufur_listesi`
- `havalimani_seferleri` (sehirden_hav, havdan_sehir **jsonb** tipinde)
- `bogaz_turlari`
- `mekan_saatleri`
- `engellenen_kullanicilar`
- `ulasim_uyarilari`
- `saha_noktalari`
- `acil_rehber`
- `isim_gecmisi` (isim degisikligi siniri, ayda 1)

### Realtime Publications (supabase_realtime'a eklenmesi gerekli)
- sohbet_mesajlari, etkinlikler, engellenen_kullanicilar, ulasim_uyarilari, canli_durum, mekan_saatleri, bogaz_turlari, havalimani_seferleri, acil_rehber

### Helper Fonksiyonlar
- `is_admin_or_mod()` — RLS policy'lerinde kullan, search_path = public
- `eskiyen_durumlari_kaldir()` — cron, sabitlendi=true bildirimleri korur (v1.0.8 fix)
- `muzekart_normalize` — INSERT/UPDATE'de 'Muzekart gecer' → 'gecerli' otomatik

### Service Role Key (.env)
- `.env`'e eklendi: `SUPABASE_SERVICE_ROLE_KEY`
- **EXPO_PUBLIC_** prefix YOK — mobile app'e dahil edilmemeli
- Sadece scheduled task'lar kullanir (RLS bypass)

---

## 8. SCHEDULED TASKS (Local agent mode)

2 task aktif + 2 devre disi, hepsi `.env`'den `SUPABASE_SERVICE_ROLE_KEY` okuyup REST API ile yazar:

1. **`sehir-hatlari-iptal-takip`** — 06:00-20:00 arasi her 30 dk (AKTIF, 1 May 2026'da daraltildi)
   - Cron: `*/30 6-20 * * *` (gece penceresi kapali — eskiden 7/24, 15 dk)
   - Firecrawl ile https://sehirhatlari.istanbul/tr/iptal-seferler scrape
   - Supabase ulasim_uyarilari tablosuna service_role key ile yazar
   - Tarih kontrolu: basliktan tarih parse, gecmis duyurular otomatik aktif=false
   - Idempotent: tweet_id basliktan SHA256 hash
   - Sayfada gorulmeyen aktif kayitlari otomatik pasif
   - **Sebep:** Vapur seferleri 06:00 oncesi ve 20:00 sonrasi nadir, gece scrape'i Firecrawl kredisini bosa harciyor. ~50% kredi tasarrufu.

2. **`havalimani-tarife-guncelle`** — Haftalik Pazartesi 09:01 (AKTIF)
   - Firecrawl ile havabus.com + bilet.hava.ist scrape
   - havalimani_seferleri PATCH (jsonb format)
   - Detayli yapi ve fiyat tablosu icin asagi bak (Bolum 12)

3. **`muze-saatleri-guncelle`** — **DEVRE DISI (1 Mayis 2026)**
   - muze.gov.tr + dosim.ktb.gov.tr veri kontrolu
   - **Iptal sebebi:** muze.gov.tr URL'leri bazi muzelerde yanlis redirect (Galata Mevlevihanesi GMM01 → Gumushane'ye gidiyor, dogru SectionId bulunamiyor). Bazi muzelerde web/dosim/DB uclu celiski (Buyuk Saray Mozaikleri saat: web 09-19, DB 09-17:30, dosim "kapali"). Az sayida lokasyon, dusuk frekansli degisim — Ayse uzmanligi ile elle yonetim daha guvenilir.
   - **Yeni yontem:** Muzeler admin panelden (`admin-saatler.tsx`, kategori 'muzeler' / 'ozel_muzeler' / 'camiler') Ayse tarafindan elle yonetiliyor.
   - Geri acmak istenirse: `mcp__scheduled-tasks__update_scheduled_task taskId=muze-saatleri-guncelle enabled=true cronExpression="0 10 * * 3"`

4. **`saraylar-saatleri-guncelle`** — **DEVRE DISI (1 Mayis 2026)**
   - millisaraylar.gov.tr URL pattern: `/Lokasyon/{ID}/Capitalized-English-Name`
   - **Iptal sebebi:** Site parse'i Yildiz Sarayi gibi lokasyon-ozgu saatleri dogru yakalayamadi (site tek genel saat veriyor, lokasyona gore degisken degil). Aynalikavak/Maslak fiyat dususleri (100 TL → 80 TL) supheli kaldi. 10 sabit lokasyon, dusuk frekansli degisim, Ayse rehberlik uzmanligi ile elle yonetim daha guvenilir.
   - **Yeni yontem:** Saraylar admin panelden (`admin-saatler.tsx`, kategori 'milli_saraylar') Ayse tarafindan elle yonetiliyor.
   - Geri acmak istenirse: `mcp__scheduled-tasks__update_scheduled_task taskId=saraylar-saatleri-guncelle enabled=true`

### Onemli Notlar
- Service role key sadece scheduled task'lar — mobile'a girmemeli
- Sehir Hatlari skill'i vapur iptal seferlerini gercek zamanli yakalar (v1.0.7'de eklendi)
- Saraylar + Muzeler manuel yonetim karari icin bkz. DECISIONS.md "Scheduled Task Ne Zaman Mantiksiz"

---

## 9. FIRECRAWL MCP (Web Scraping)

- **Plan:** Hobby (~3000 kredi/ay)
- Kullanim: scheduled task'larda
- Hedef siteler: havabus.com, bilet.hava.ist, sehirhatlari.istanbul, millisaraylar.gov.tr, muze.gov.tr

---

## 10. X (TWITTER) API

- **Bearer Token:** Sadece Supabase Edge Function secret'inda (`X_BEARER_TOKEN`). 6 May 2026'dan itibaren EXPO_PUBLIC_ prefix'i KALDIRILMASI bekleniyor (v1.1.0 build'inde) — su an hala EAS production env'de mevcut ama ARTIK GECERSIZ (6 May'da Twitter Developer Portal'dan **Regenerate** edildi, eski token revoke oldu).
- 4 hesap takip ediliyor:
  - **@metroistanbul** — Metro hatlari (M1-M14), tramvay (T1-T5), funikuler (F1-F4)
  - **@TCDDTasimacilik** — TCDD genel
  - **@Marmaraytcdd** — Marmaray ozelinde
  - **@4444154 (IBB Ulasim Yonetim Merkezi)** — trafik, kopru, metrobus, yol calismasi
- **Plan:** Pay-per-use (Twitter Developer Portal). Otomatik odeme aktif.
- **Maliyet (6 May 2026 oncesi — client-side bot):** Aylik ~$20 (4 hesap × her aktif cihaz × her 15 dk)
- **Maliyet (6 May 2026 sonrasi — server-side bot):** Tahminen aylik ~$3-5 sabit (4 hesap × tek sunucu × her 15 dk)
- **Mimari:** v1.0.13'e kadar `hooks/use-x-ulasim.ts` client-side. 6 May 2026'dan itibaren Supabase Edge Function `ulasim-senkron` (Bolum 13).

---

## 13. ULASIM-SENKRON EDGE FUNCTION (6 Mayis 2026)

X API tweet senkronizasyonu artik server-side bir Supabase Edge Function tarafindan yapiliyor. pg_cron ile her 15 dakikada bir tetiklenir.

### Ne Yapiyor
4 X hesabindan tweet ceker (`metroistanbul`, `TCDDTasimacilik`, `Marmaraytcdd`, `IBBUlasim`), regex ile hat/tip tespiti yapar, ulasim uyarisi olanlari `ulasim_uyarilari` tablosuna yazar. "Cozuldu" tipi tweet'lerde ayni hattaki aktif uyarilari `cozuldu=true, aktif=false` yapar. 48 saatten eski cozulmus uyarilari ve 7 gunden eski tum uyarilari da pasifle eder.

### Dosyalar
- **Edge Function kodu:** `supabase/functions/ulasim-senkron/index.ts` (288 satir)
  - Kaynak: `hooks/use-x-ulasim.ts`'in birebir port'u (regex'ler, hesap listeleri, mantik korundu)
  - Farklar: (a) Deno + Supabase JS v2, (b) service role key ile RLS bypass, (c) custom header secret check
- **Migration:** Supabase Migrations'ta `ulasim_senkron_cron_v2` adiyla saklandi

### Konfigurasyon (Supabase)
- **Function adi:** `ulasim-senkron`
- **Slug:** `ulasim-senkron`
- **verify_jwt:** `false` (custom header check ile yerine getirildi)
- **URL:** `https://rzlfghjpsximthlolfxo.supabase.co/functions/v1/ulasim-senkron`

### Edge Function Secrets (Dashboard → Edge Functions → Secrets)
- `X_BEARER_TOKEN` — Twitter Developer Portal'dan alinmis Bearer Token (6 May 2026'da Regenerate edildi)
- `CRON_SECRET` — Rastgele 32-byte hex (6 May 2026 set edildi). Supabase Vault'taki `pusula_cron_secret` ile **AYNI** deger olmali.

### Vault Secret (Database)
- **Ad:** `pusula_cron_secret`
- **Aciklama:** "Edge Function cron tetikleyicisi icin paylasilmis secret"
- **Kullanim:** `(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pusula_cron_secret' LIMIT 1)`

### pg_cron Job
- **Job adi:** `ulasim-senkron-15dk`
- **Schedule:** `*/15 * * * *` (her 15 dakikada bir)
- **Komut:** `net.http_post()` ile Edge Function'a HTTP POST atar, header'da Vault'tan cektigi `pusula_cron_secret`'i `x-pusula-cron-secret` olarak yollar.

### Manuel Tetikleme
```sql
SELECT net.http_post(
  url := 'https://rzlfghjpsximthlolfxo.supabase.co/functions/v1/ulasim-senkron',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-pusula-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pusula_cron_secret' LIMIT 1)
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 60000
) AS request_id;
```

### Sonuc Kontrolu
```sql
SELECT id, status_code, content::text AS body, error_msg, created
FROM net._http_response
ORDER BY created DESC LIMIT 5;
```
Basarili: `status_code=200`, `body={"ok":true,"yeni":N,"guncellenen":M,"hatalar":[],"zaman":"..."}`.

### Auth Akisi (kim neyi cagiriyor)
1. **pg_cron** her 15 dk job'i tetikler
2. Job, Vault'tan `pusula_cron_secret`'i okur
3. `net.http_post()` ile Edge Function'a HTTP POST atar, header'da `x-pusula-cron-secret: <secret>`
4. Edge Function `verify_jwt=false` oldugu icin JWT istemez
5. Edge Function ilk satirda `req.headers.get('x-pusula-cron-secret') === Deno.env.get('CRON_SECRET')` kontrolu yapar
6. Esit degilse 401 Unauthorized doner, Esitse devam eder
7. Service role key ile Supabase client olusturur (RLS bypass), tweet ingest eder

### Extension'lar (Database)
- `pg_cron` (extensions schema)
- `pg_net` (extensions schema)
- `supabase_vault` (zaten kurulu)

### Client-Side Hook'un Durumu (geciste)
`hooks/use-x-ulasim.ts` ve `app/_layout.tsx`'teki `useXUlasim()` cagrisi v1.0.13'te HALA AKTIF. Yeni `EXPO_PUBLIC_X_BEARER_TOKEN` (eski token revoke edildi) ile artik calismiyor — fetch 401 doner, fonksiyon early return yapar. Ayrica yeni tweet ingest etmeye calissa bile `tweet_id` UNIQUE constraint nedeniyle Edge Function'in zaten yazdigi tweet'leri yazamaz.

**v1.1.0 temizlik adimi (build gerektirir):**
1. `app/_layout.tsx` line 183-188: `useXUlasim()` import + cagri sil
2. `hooks/use-x-ulasim.ts` dosyasini sil
3. `lib/config.ts` line 10-13: `X_BEARER_TOKEN` ve `X_SENKRON_ARALIK_DK` sil
4. `eas env:delete --name EXPO_PUBLIC_X_BEARER_TOKEN --environment production`

### Maliyet Etkisi
- Once: 4 hesap × ~25 aktif kullanici × her 15 dk = saatte ~400 X API cagrisi
- Sonra: 4 hesap × tek sunucu × her 15 dk = saatte 16 cagri
- **%96 quota tasarrufu**, kullanici sayisindan bagimsiz

### Bkz.
- DECISIONS.md #36 — Tam karar metni
- ISSUES.md #79-#81 — Bug fix kayitlari

---

## 11. PROJE KLASORU YAPISI (Tam)

```
/Users/aysetokkus/istanbul-rehber/
├── CLAUDE.md                          (yeni yalın index)
├── CLAUDE.md.eski                     (eski tek dosya, yedek)
├── claude-context/                    (Claude'un parcali bilgi tabani)
│   ├── PROJECT.md
│   ├── STATE.md
│   ├── CHANGELOG.md
│   ├── DECISIONS.md
│   ├── ISSUES.md
│   └── INFRASTRUCTURE.md             (bu dosya)
├── app/                               (Expo Router ekranlari)
├── hooks/
├── components/
├── lib/
├── constants/
├── assets/
├── docs/                              (GitHub Pages — pusulaistanbul.app)
│   ├── index.html
│   ├── CNAME
│   ├── ss-1.png ~ ss-5.png
│   ├── dogrulandi.html
│   ├── musteri-rehber-sozlesmesi.docx
│   └── acente-hizmet-sozlesmesi.docx
├── plugins/
│   └── fix-buildconfig.js
├── supabase-migration-*.sql
├── havalimani_guncelle.sql
├── google-service-account.json        (Google Play submit)
├── .env                               (X token, Supabase service role)
├── eas.json
├── app.json
└── package.json
```

### Tasarim Klasoru (Mac)
- `~/Desktop/Pusula Rehber Tasarim/` — Canva Pro source dosyalari, ekran goruntuleri, feature graphic kaynaklari

### Scheduled Task Klasoru (Mac)
- `/Users/aysetokkus/Documents/Claude/Scheduled` — task SKILL.md'leri burada
- Cowork uygulamasi acik degilse task **calismaz**; sonraki acilista tetiklenir
- Bir kerelik (`fireAt`) task'lar otomatik disable olur, recurring (`cronExpression`) task'lar suresiz devam eder

### Aktif Scheduled Task'lar (28 May 2026 itibariyle)
- **`sehir-hatlari-iptal-seferleri`** — aktif (recurring), gunluk iptal sefer kontrolu
- **`saraylar-saatleri-guncelle`** — devre disi (1 May 2026'da kapatildi, admin panelden manuel)
- **`muzeler-saatleri-guncelle`** — devre disi (1 May 2026'da kapatildi, admin panelden manuel)
- **`havalimani-tarife-guncelle`** — devre disi (4 May 2026'da kapatildi, eski Firecrawl-based). **YERINE GECEN:** `havaist-senkron` aktif (2 Haz 2026).
- **`havaist-senkron`** — aktif (recurring `0 7 * * *`, 2 Haz 2026'da kuruldu). hava.ist resmi backend API'sinden (`s.hava.ist/api.php`) tum HVL ve HVIST hatlarini gunluk olarak senkronize eder. Sadece `firma='havaist'`, `havalimani='IST'` satirlari (Havabus/SAW dahil DEGIL). Idempotent: degisim yoksa no-op, push tetiklenmez. Gercek bir fiyat/saat degisikliginde DB guncellenir, `push_havalimani_trigger` kullaniciya bildirim gonderir. Script: `scripts/havaist-senkron.mjs`. Audit log: `scripts/data/havaist-senkron-log.json`. Tek run ~12sn, 14 IST kaydi tarar. Bkz. DECISIONS #44, Bolum 12.
- **`turyol-senkron`** — aktif (recurring `30 7,19 * * *` = 07:30 + 19:30 TR, 5 Haz 2026'da kuruldu). turyol.com/Home/Tarifeler'e form POST (`TarifeKalkisId=4_104_1_101` = Bogaz Turu > Eminonu Iskele) atip 3 kolonlu tarife tablosunu (HAFTAICI/CUMARTESI/PAZAR) + bilet fiyatini parse eder, `bogaz_turlari` TURYOL standart kaydini gunceller. Idempotent: degisim yoksa no-op. Guvenlik agi: <5 sefer veya bozuk saat formati = DB'ye yazilmaz. Cumartesi != Pazar ise union alinir + uyari (DB'de tek hafta_sonu kolonu). UPDATE'te `push_bogaz_trigger` admin kategorisi push atar. Script: `scripts/turyol-senkron.mjs`. Audit log: `scripts/data/turyol-senkron-log.json`. Bkz. SCRIPTS.md #3.
- **`bogaz-diger-senkron`** — aktif (recurring `0 8,20 * * *` = 08:00 + 20:00 TR, 6 Haz 2026'da kuruldu). Sehir Hatlari (kisa-bogaz-turu-181 + uzun-bogaz-turu-91 sayfalari) ve Dentur Avrasya (denturavrasya.com/tr-TR/hatlarimiz/bogazturu — SPA, waitFor 8sn sart) tarifelerini Firecrawl MCP ile cekip `bogaz_turlari` kayitlariyla karsilastirir, degisiklikte Supabase MCP ile UPDATE atar. **Script YOK — prompt-driven pattern** (Dentur SPA oldugu icin plain fetch calismaz; tarife tablosu src'siz iframe icine JS ile enjekte ediliyor, backend API kesfedilemedi). Dentur kurali: ** isaretli saatler (talebe bagli) DB'ye dahil edilmez. Guvenlik aglari prompt'ta. Maliyet: ~6 Firecrawl kredi/gun (~180/ay, Hobby 3000'in %6'si). Tam prompt: `/Users/aysetokkus/Documents/Claude/Scheduled/bogaz-diger-senkron/SKILL.md`.
- **`kurban-bayrami-hediye-mail-gonderim`** — one-shot, `fireAt=2026-05-27T07:00:00+03:00`, ~84sn surer, otomatik disable olur. Prompt'unda `node scripts/kurban-bayrami-hediye.mjs --all` calistirir, 168 freemium kullaniciya kurban bayrami premium hediye maili gonderir. Bkz. STATE.md (TAMAMLANANLAR 0000f).
- **`bayram-hediye-otomatik`** — aktif (recurring `*/15 * * * *`, 28 May 2026'da kuruldu), kampanya: 28 May 00:00 - 1 Haz 00:00 +03 araliginda yeni kayit olan kullanicilara otomatik premium hediye (1 Haz'a kadar) + hos geldin maili. Script: `scripts/bayram-hediye-otomatik.mjs`. Idempotent (SQL filtresi `abonelik_durumu != 'aktif'`). Oto-kapanis: 1 Haz 00:00 +03 sonrasi no-op. Audit log: `scripts/data/bayram-hediye-otomatik-log.json`. **1 Haziran sabahi manuel disable EDILMELI** (recurring oldugu icin no-op cikti her 15 dk surer). Bkz. STATE.md.

---

## 12. HAVALIMANI ULASIM VERI PIPELINE'I (Detayli)

### Genel Bakis
"Havalimani Ulasim" sekmesi (`app/(tabs)/ulasim.tsx`) Supabase `havalimani_seferleri` tablosundan veri ceker. Bu tablo Havaist (IST) ve Havabus (SAW) seferlerini, fiyatlarini ve sefer saatlerini icerir.

**ONEMLI MIMARI DEGISIM (2 Haziran 2026):** Veri kaynaklari ayrildi:
- **Havaist (firma='havaist', havalimani='IST')** — `havaist-senkron` scheduled task'i ile hava.ist resmi backend API'sinden gunluk otomatik senkron edilir. 14 IST kaydi (10 HVL + 4 HVIST). Bkz. DECISIONS #44.
- **Havabus (firma='havabus', havalimani='SAW')** — Bu API'de yok. Admin panel (`app/admin-ulasim-tarife.tsx`) ile manuel yonetilir; gerekirse Firecrawl ile havabus.com'dan scrape edilebilir.

### Tablo Yapisi: `havalimani_seferleri`
```
Kolon               | Tip       | Aciklama
---------------------|-----------|------------------------------------------
id                   | uuid      | Primary key (auto)
firma                | text      | 'havaist' veya 'havabus'
havalimani           | text      | 'IST' veya 'SAW'
durak_id             | text      | Durak ID (lowercase, _ ile — orn: 'taksim')
durak_adi            | text      | Gorunen ad (orn: 'Taksim')
sure                 | text      | Tahmini sure (orn: '~90 dk')
fiyat                | text      | Fiyat (orn: '426₺')
not_bilgi            | text      | Ek bilgi notu
sehirden_hav         | jsonb     | Sehirden havalimanina sefer saatleri
havdan_sehir         | jsonb     | Havalimanindan sehire sefer saatleri
aktif                | boolean   | Aktif mi
kaynak               | text      | Veri kaynagi (orn: 'bilet.hava.ist')
tarife_donemi        | text      | Donem bilgisi (orn: 'Nisan 2026')
guncelleme_tarihi    | timestamp | Son guncelleme zamani
```

**KRITIK:** `sehirden_hav` ve `havdan_sehir` kolonlari **jsonb** tipindedir (text[] DEGIL). INSERT/UPDATE'de `'["03:00","03:30","04:00"]'::jsonb` formatinda yazilmali.

### Mevcut Kayitlar (15 Nisan 2026 itibariyle — 6 kayit)

#### Havaist — Istanbul Havalimani (IST)
| Durak       | Fiyat  | Sefer (gidis) | Kaynak                        |
|-------------|--------|---------------|-------------------------------|
| Taksim      | 426₺   | 34            | bilet.hava.ist (Nisan 2026)   |
| Besiktas    | 426₺   | 34            | bilet.hava.ist (Nisan 2026)   |
| Bakirkoy    | 384₺   | (mevcut)      | bilet.hava.ist (Nisan 2026)   |
| Beylikduzu  | 420₺   | (mevcut)      | bilet.hava.ist (Nisan 2026)   |
| Aksaray     | 355₺   | 31            | birgun.net (Ocak 2026)        |
| Kadikoy     | 390₺   | 23            | birgun.net (Ocak 2026)        |
| Basaksehir  | 265₺   | (mevcut)      | birgun.net (Ocak 2026)        |
| Arnavutkoy  | 130₺   | (mevcut)      | birgun.net (Ocak 2026)        |
| Sultanahmet | 315₺   | (mevcut)      | birgun.net (Ocak 2026)        |

**NOT:** birgun.net kaynaklari Ocak 2026 fiyatlari, ~%20 eski olabilir. bilet.hava.ist ile teyit edildikce guncellenecek.

#### Havabus — Sabiha Gokcen Havalimani (SAW)
| Durak    | Fiyat | Sure   | Gidis Sefer | Donus Sefer | Kaynak      |
|----------|-------|--------|-------------|-------------|-------------|
| Taksim   | 440₺  | ~90 dk | 39          | 37          | havabus.com |
| Kadikoy  | 270₺  | ~60 dk | 28          | 28          | havabus.com |

**Bekleyen Eklemeler (DB'ye girilecek):**
- Yenisahra: 270₺, ~45 dk (Kadikoy hattinin ara duragi)
- Sakarya: 500₺, ~95 dk (sehirlerarasi hat)

### Veri Kaynaklari

#### Havaist (Aktif Pipeline — 2 Haz 2026'dan beri)
**Resmi backend API: `https://s.hava.ist/api.php`** — `www.hava.ist` web sitesinin altinda calisan resmi backend. Firecrawl/scrape gerekmez. Iki endpoint:

1. **`POST /api.php?query=get-from-stations`** — Tum duraklari (57 kayit) ve her birinin baglandigi hat bilgisini (line_id, type, shortname) doner.
   - Headers: `Origin: https://www.hava.ist`, `Referer: https://www.hava.ist/`, `X-Requested-With: XMLHttpRequest`, `Content-Type: application/x-www-form-urlencoded`
   - Body: bos

2. **`POST /api.php?query=get-to-stations-price`** — Belirli bir hattin belirli bir yondeki sefer saatleri, fiyat, sure, gunduzergah listesi.
   - Body: `branch_id=1&line_id=<id>&from_station_id=<sid>&lineType=<ibb|havaist>`
   - `from_station_id=3` (havalimani) → outbound (havalimanindan sehre)
   - `from_station_id=<non-airport_master>` → inbound (sehirden havalimanina) — bir hat icin tum non-airport stationlar ayni saatleri doner, ilk olani al
   - Tipik response: `{shortname, name, peron, total_distance, travel_time, price, stations, all_trips, warning, ...}`

**Hat ekosistemi (12 benzersiz hat):**
- **HVL kodlu (lineType='ibb'):** HVL-1 Aksaray, HVL-2 Beylikduzu, HVL-3 Otogar(Esenler), HVL-4 Merter/Bakirkoy, HVL-6 Kadikoy, HVL-7 Avcilar, HVL-8 Halkali, HVL-9 Taksim (Beşiktaş, 4.Levent ara)
- **HVIST kodlu (lineType='havaist'):** HVIST-5A Arnavutkoy, HVIST-7 Silivri/Catalca, HVIST-11 Sultanahmet-Catladikapi, HVIST-13 Sabiha Gokcen (IST-SAW transferi)

#### Havabus (Manuel Yonetim)
1. **havabus.com** — Havabus resmi site (admin panelden veya Firecrawl ile manuel)
2. **bilet.havabus.com** — Online bilet sistemi (alternatif fiyat kaynagi)

### Uygulama Kodu Akisi
```
ulasim.tsx (UI) → useUlasimTarife hook → supabase.from('havalimani_seferleri') → Realtime subscription
```
- Hook: `hooks/use-ulasim-tarife.ts`
- UI: `app/(tabs)/ulasim.tsx`
- Admin: `app/admin-ulasim-tarife.tsx` (3 tab: havaist, havabus, bogaz)
- IST seferleri → `firma='havaist'`, `havalimani='IST'`
- SAW seferleri → `firma='havabus'`, `havalimani='SAW'`
- Realtime: `havalimani-seferleri-degisim` channel

### Otomatik Guncelleme (Havaist)
Scheduled task: **`havaist-senkron`** (gunluk 07:00, recurring `0 7 * * *`)
- Yontem: hava.ist resmi API → Supabase REST API UPSERT (Node script)
- Script: `scripts/havaist-senkron.mjs` (modlar: yok=normal, `--dry`, `--auto`, `--verbose`)
- API: `https://rzlfghjpsximthlolfxo.supabase.co/rest/v1/havalimani_seferleri`
- Headers: `apikey: <SERVICE_ROLE_KEY>`, `Authorization: Bearer <SERVICE_ROLE_KEY>`
- Filtre: Yalnizca `firma=eq.havaist&havalimani=eq.IST` satirlari
- Idempotent: arraysEqual + scalar karsilastirmasi, fark yoksa PATCH atmaz (push tetiklenmez)
- Audit log: `scripts/data/havaist-senkron-log.json`
- Tek run ~12sn, 14 DB satirini tarar

### Otomatik Guncelleme (Havabus — Ayri Pipeline)
Su an aktif scheduled task **yok**. SAW kayitlari (Taksim 440₺, Kadikoy 270₺) admin panelden yonetilir, gerektiginde Firecrawl ile havabus.com scrape edilebilir veya Excel pipeline kurulabilir (v1.1.0 madde olarak duruyor).

### SQL Dosyalari
- **`havalimani_guncelle.sql`** (proje kokunde, eski) — 15 Nis 2026 manuel migration. Artik kullanilmiyor, havaist tarafini script yonetiyor.
- **`havabus_insert.py`** — KULLANMA, eski yanlis dosya (bogaz_turlari'na yanlis insert yapiyordu)

### Ilk Migration Notu (2 Haz 2026)
Ilk havaist-senkron run'unda 7 UPDATE + 7 INSERT yapildi (14 IST kaydi). Kullaniciya 7 push spam'ini onlemek icin `push_havalimani_trigger` migration sirasinda gecici DISABLE edildi, senkron sonrasi tekrar ENABLE edildi. Sonraki gunluk run'larda zaten cok az/sifir degisiklik bekleniyor — trigger her zaman aktif kalir.

### Saraylar Skill (Iliskili Pipeline)
`saraylar-saatleri-guncelle` scheduled task:
- millisaraylar.gov.tr URL pattern: `/Lokasyon/{ID}/Capitalized-English-Name`
- Eski Turkce slug'lar yanlis lokasyonlari donuyordu, yeni pattern skill'e yazildi

---

## 14. Manuel Mail Gonderim Aracligi (27 May 2026 eklendi)

### Genel Bakis

Supabase Auth Custom SMTP otomatik mail gonderimi disinda, **ad-hoc kurumsal mail** gondermek icin yazilmis Node script'leri. Microsoft (Hotmail/Outlook) ve Yahoo spam filtreleri Resend'den gelen Supabase Auth mailleri zaman zaman spam'e atiyor — manuel onay sonrasi kullaniciya "hesabiniz aktif" bildirimi yapmak icin gerekli. Ya da kampanya (kurban bayrami hediyesi gibi) bilgilendirmesi.

### Mevcut Araclar

**`scripts/manuel-onay-bilgilendirme.mjs`** (27 May 2026)
- Microsoft/Yahoo spam filtresine takilan kullanicilara markali "hesabiniz onaylandi" maili gondermek icin
- Subject: "Pusula Istanbul Hesabiniz Hakkinda Bilgilendirme"
- Markali HTML template: gradient header + 80x80 windrose logo base64 inline + buyuk basligli "PUSULA ISTANBUL" + alt yazi "PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI"
- ALICILAR array script icinde hard-code, vakalara gore guncellenir
- Modlari:
  - `--dry`: icerigi yazdir, mail gonderme
  - `--test <email>`: tek bir test maili kendine
  - `--all`: ALICILAR listesindeki herkese 500ms aralikla (rate limit dostu)

**Cinsiyet hitabi (Bey/Hanim):** Az sayidaki kullanici icin manuel atanir. Toplu mail icinde cinsiyetsiz format ("Sayin {ad} {soyad}") tercih edilir — yanlis hitap riski sifirlanir.

### Resend API Key Ayrımı

Iki ayri API key var, **karistirma**:

| Key Adi | Kullanim | .env / Vault konumu |
|---|---|---|
| `pusula-supabase-prod` | Supabase Auth Custom SMTP (kayit/sifre sifirlama otomatik mailleri) | Supabase Dashboard → Auth → SMTP Configuration |
| `manuel-bilgilendirme` (`re_H7PYreCJ...`) | Manuel mail script'leri | `.env` dosyasi → `RESEND_API_KEY=re_...` |

`scripts/manuel-onay-bilgilendirme.mjs` `.env`'den `RESEND_API_KEY`'i okur. **Asla `EXPO_PUBLIC_` prefixi alma** (public bundle'a kacar). `.gitignore`'a `.env` dahil edilmis durumda.

### Yeni Vaka Workflow (Toplu Onaysiz Kullanici Bildirimi)

1. **DB sorgu:** `SELECT email, isim, soyisim FROM auth.users JOIN profiles WHERE email_confirmed_at IS NULL AND ...` (hangi spam filtreye duştügüne bak)
2. **Manuel onay SQL:** `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email IN (...)`
3. **Script ALICILAR listesini guncelle:** isim, soyisim, email, hitap
4. **Onay akisi:** `--dry` → `--test ayse.tokkus@gmail.com` → `--all`
5. **Sonuc dogrulama:** https://resend.com/emails sayfasinda "Delivered" status

### Gelecek Script Adaylari (yeni oturum yazilacak)

- **`scripts/kurban-bayrami-hediye.mjs`** — 172 freemium kullaniciya bayram hediyesi bilgilendirme maili. Runtime Supabase fetch ile alici listesini canli ceker (`abonelik_bitis = '2026-06-01 00:00+03' AND rol NOT IN ('admin','moderator')`). Cinsiyetsiz hitap "Sayin {ad} {soyad}". Subject: "Pusula Istanbul'dan Bayram Hediyesi". Body: bayram tebrik + 5 gun premium duyurusu + v1.0.14 guncelleme + "Hayirli bayramlar". 27 May'dan yeni oturuma birakildi.

### Bilinen Sinirlar

- Resend free tier: 100 mail/gun. Pusula Pro: 50K/ay, 100/gun limit yok.
- Microsoft Outlook IMAP'i bazi mailleri "Onemsiz e-posta"da gosterip ana inbox'a yansitmiyor (web vs mobile farkli klasor takibi). Resend "Delivered" status'una ragmen kullanici goremeyebilir — ek olarak WhatsApp/Messenger ile manuel iletisim her zaman alternatif.
- HTML email template'lerinde `text-transform: uppercase` KULLANMA — Turkce karakter bozar. Direkt buyuk harf yaz. Bkz. DECISIONS #38.

