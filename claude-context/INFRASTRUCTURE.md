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

4 task aktif, hepsi `.env`'den `SUPABASE_SERVICE_ROLE_KEY` okuyup REST API ile yazar:

1. **`sehir-hatlari-iptal-takip`** — 15 dk araliklarla
   - Firecrawl ile https://sehirhatlari.istanbul/tr/iptal-seferler scrape
   - Supabase ulasim_uyarilari tablosuna service_role key ile yazar
   - Tarih kontrolu: basliktan tarih parse, gecmis duyurular otomatik aktif=false
   - Idempotent: tweet_id basliktan SHA256 hash
   - Sayfada gorulmeyen aktif kayitlari otomatik pasif

2. **`havalimani-tarife-guncelle`** — Haftalik (Pazartesi sabahi)
   - Firecrawl ile havabus.com + bilet.hava.ist scrape
   - havalimani_seferleri PATCH (jsonb format)
   - Detayli yapi ve fiyat tablosu icin asagi bak (Bolum 12)

3. **`muze-saatleri-guncelle`** — Periyodik
   - muze.gov.tr veri kontrolu

4. **`saraylar-saatleri-guncelle`** — Periyodik
   - millisaraylar.gov.tr URL pattern: `/Lokasyon/{ID}/Capitalized-English-Name`

### Onemli Notlar
- Service role key sadece scheduled task'lar — mobile'a girmemeli
- Sehir Hatlari skill'i vapur iptal seferlerini gercek zamanli yakalar (v1.0.7'de eklendi)

---

## 9. FIRECRAWL MCP (Web Scraping)

- **Plan:** Hobby (~3000 kredi/ay)
- Kullanim: scheduled task'larda
- Hedef siteler: havabus.com, bilet.hava.ist, sehirhatlari.istanbul, millisaraylar.gov.tr, muze.gov.tr

---

## 10. X (TWITTER) API

- **Bearer Token:** `.env`'de + EAS env (sensitive)
- 4 hesap takip ediliyor:
  - Metro hatlari (M1-M14)
  - Tramvay (T1-T5)
  - Funikuler/Marmaray
  - **@4444154 (IBB Ulasim Yonetim Merkezi)** — trafik, kopru, metrobus, yol calismasi
- **Otomatik odeme aktif** (kredi tukenmesi onlendi — 27 Nisan'da bir kere oldu)
- v1.1.0'da scheduled task'a tasinacak (mobile'dan merkezi cozume)

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

---

## 12. HAVALIMANI ULASIM VERI PIPELINE'I (Detayli)

### Genel Bakis
"Havalimani Ulasim" sekmesi (`app/(tabs)/ulasim.tsx`) Supabase `havalimani_seferleri` tablosundan veri ceker. Bu tablo Havaist (IST) ve Havabus (SAW) seferlerini, fiyatlarini ve sefer saatlerini icerir. Veriler `havalimani-tarife-guncelle` scheduled task'i ile haftalik guncellenir.

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

### Veri Kaynaklari ve Scraping
1. **bilet.hava.ist** — Havaist resmi bilet satisi. Fiyatlar kesin. Firecrawl ile scrape edilebilir.
2. **havabus.com** — Havabus resmi site. URL pattern: `havabus.com/yolcuservisi/...aspx` (eski `/istanbul/...` 404 veriyordu). Her rota icin detay sayfasi:
   - havabus.com/yolcuservisi/...aspx (Taksim, Kadikoy, Yenisahra)
   - havabus.com/yolcuservisi/...sakarya... (Sakarya)
3. **birgun.net** — Ocak 2026 tarife tablosu (eksik Havaist fiyatlari icin)
4. **bilet.havabus.com** — Havabus online bilet sistemi (alternatif fiyat kaynagi)

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

### Haftalik Otomatik Guncelleme
Scheduled task: `havalimani-tarife-guncelle`
- Periyot: Haftada 1 (Pazartesi sabahi)
- Yontem: Firecrawl MCP ile scrape → Supabase REST API PATCH
- API: `https://rzlfghjpsximthlolfxo.supabase.co/rest/v1/havalimani_seferleri`
- Headers: `apikey: <SERVICE_ROLE_KEY>`, `Authorization: Bearer <SERVICE_ROLE_KEY>`
- PATCH ornegi: `?firma=eq.havabus&durak_id=ilike.*taksim*`

### SQL Dosyalari
- **`havalimani_guncelle.sql`** (proje kokunde) — Toplu fiyat + sefer saati update'lerini icerir, Supabase SQL Editor'de calistirilir
- **`havabus_insert.py`** — KULLANMA, eski yanlis dosya (bogaz_turlari'na yanlis insert yapiyordu)

### Saraylar Skill (Iliskili Pipeline)
`saraylar-saatleri-guncelle` scheduled task:
- millisaraylar.gov.tr URL pattern: `/Lokasyon/{ID}/Capitalized-English-Name`
- Eski Turkce slug'lar yanlis lokasyonlari donuyordu, yeni pattern skill'e yazildi
