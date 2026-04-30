# Pusula Istanbul - Statik Proje Bilgisi

Bu dosya proje mimarisi, dosya yapisi, is mantigi ve tasarim kurallarini iceriyor — nadiren degisir. Yeni ekran/feature gelistirirken, kod patterni dogrularken oku.

---

## 1. PROJE TANIMI

**Pusula Istanbul** - Istanbul'daki profesyonel turist rehberleri icin gelistirilen mobil uygulama.
Canli saha durumu, muze kuyruk bilgileri, ulasim verileri, rehber sohbeti, etkinlikler ve acil durum bilgileri sunar.

- **Gelistirici:** Ayse Tokkus Bayar (info@pusulaistanbul.app)
- **GitHub:** https://github.com/aysetokkus-lab/pusula-istanbul.git
- **Domain:** pusulaistanbul.app
- **Proje dizini (Mac):** `/Users/aysetokkus/istanbul-rehber` — HER ZAMAN bu yolu kullan
- **Bundle ID (iOS + Android):** `com.pusulaistanbul.app`
- **Scheme:** `pusulaistanbul`
- **Apple Team ID:** 7UJVL94SMJ
- **App Store Connect App ID:** 6761419678
- **SKU:** pusulaistanbul001

---

## 2. TEKNIK YAPI

### Platform & Framework
- **React Native** + **Expo SDK 54**
- **Expo Router** (tab-based navigation + Stack screens)
- **TypeScript**
- Test cihazi: Samsung S22 5G Android
- Node 20 GEREKLI (v24 uyumsuz): `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"`
- Development build: `npx expo start --dev-client` (Expo Go ARTIK CALISMAZ — native modules var)

### Backend - Supabase
- **URL:** `https://rzlfghjpsximthlolfxo.supabase.co`
- **Auth:** Email/Password (Email confirmation ACIK)
- **Site URL:** https://pusulaistanbul.app
- **Redirect URLs:** pusulaistanbul://, https://pusulaistanbul.app, pusulaistanbul://giris, https://pusulaistanbul.app/dogrulandi.html
- **Tablolar:** `profiles`, `sohbet_mesajlari`, `yogunluk`, `canli_durum`, `raporlanan_mesajlar`, `etkinlikler`, `kufur_listesi`, `havalimani_seferleri`, `bogaz_turlari`, `mekan_saatleri`, `engellenen_kullanicilar`, `ulasim_uyarilari`, `saha_noktalari`, `acil_rehber`

### Onemli Kutuphaneler
```json
{
  "expo": "~54.0.33",
  "expo-router": "~6.0.23",
  "expo-image": "~3.0.11",
  "expo-linear-gradient": "~15.0.8",
  "expo-notifications": "~0.32.16",
  "expo-screen-capture": "~8.0.9",
  "@supabase/supabase-js": "^2.99.0",
  "@expo-google-fonts/poppins": "^0.4.1",
  "react-native-svg": "15.12.1",
  "react-native-purchases": "RevenueCat IAP"
}
```

### Konfigurasyon Notlari
- `app.json`: `newArchEnabled: true` (reanimated 4.x zorunlu), `reactCompiler` KALDIRILDI
- `expo-screen-capture` plugins'den CIKARILDI (plugin.js yok)
- `usesNonExemptEncryption: false` (sifreleme beyani)
- `app.json backgroundColor: #005A8D` (adaptive icon + splash hepsi ayni)

### Font Ailesi
Poppins: 400Regular, 600SemiBold, 700Bold, 800ExtraBold

### Renk Paleti (`constants/theme.ts`)
```
Primary: #0077B6 (Istanbul Mavi)
Medium:  #0096C7
Light:   #48CAE4
Bright:  #00A8E8
Dark:    #005A8D
Uyari:   #E09F3E (amber)
Kapali:  #D62828 (kirmizi)
Acik:    #0096C7 (mavi)
Murdum:  #7B2D8E (muzeler icin mor)
Altin:   #C77A15 (saraylar / uyari vurgusu)
```

---

## 3. DOSYA YAPISI

### Ekranlar (`app/`)
```
app/
  _layout.tsx          -- Root layout: auth + abonelik gating + routing + deep link handler
  giris.tsx            -- Login/Register ekrani
  hos-geldin.tsx       -- EKRAN 1: Onboarding (kayit sonrasi)
  deneme-baslat.tsx    -- EKRAN 2: REDIRECT (eski 7 gun deneme — kullanilmiyor)
  abone-ol.tsx         -- EKRAN 3: Paywall (premium gate)
  sifre-sifirla.tsx    -- Sifre sifirlama ekrani (deep link recovery)
  gizlilik-politikasi.tsx
  kullanim-kosullari.tsx
  admin.tsx            -- Admin panel ana ekrani
  admin-etkinlik.tsx
  admin-moderasyon.tsx
  admin-banlar.tsx
  admin-kufur.tsx
  admin-saatler.tsx    -- Muze/saray/cami saat yonetimi (mevsim gecisi dahil)
  admin-ulasim-tarife.tsx
  admin-acil.tsx
  admin-saha.tsx
  modal.tsx

app/(tabs)/
  _layout.tsx          -- Tab navigator (5 tab + 4 gizli)
  index.tsx            -- Ana Sayfa (hava, namaz, gemi, canli durum, ulasim, etkinlikler)
  acil.tsx             -- Acil durum (tek 112 + sozlesmeler)
  sohbet.tsx           -- Rehber sohbet (realtime, kufur filtreli, screenshot korumali)
  ara.tsx              -- Arama
  profil.tsx           -- Profil (abonelik durumu, gorunum secici)
  muzeler.tsx          -- Muze/saray/cami (gizli tab)
  bogaz.tsx            -- Bogaz turlari (gizli tab)
  ulasim.tsx           -- Havalimani ulasim (gizli tab)
  muzeKart.tsx         -- MuzeKart (gizli tab)
```

### Hook'lar (`hooks/`)
```
use-abonelik.ts          -- Abonelik durumu (freemium: premiumMi flag) + RC + Supabase realtime
use-admin.ts             -- Admin/moderator rol kontrolu
use-canli-durum.ts       -- Canli muze kuyruk bilgileri
use-kufur-filtre.ts      -- Sohbet kufur filtresi
use-tema.tsx             -- Tema hook'u (TemaProvider context + AsyncStorage tercih)
use-ulasim-bildirim.ts   -- Ulasim ariza bildirimleri
use-bildirim-tercihleri.ts -- 6 kategorili bildirim tercih yonetimi
use-okunmamis-mesaj.ts   -- Sohbet okunmamis mesaj badge takibi
use-mekan-saatleri.ts    -- Muze/saray/cami saatleri
use-bogaz-turlari.ts     -- Bogaz tur tarifeleri
use-ulasim-tarife.ts     -- Havalimani sefer tarifeleri
use-acil-rehber.ts       -- Acil durum numaralari
use-gemi-takvimi.ts      -- Galataport gemi takvimi
use-x-ulasim.ts          -- X (Twitter) API'den ulasim uyarisi
use-bildirimler.ts       -- Birlesik bildirim sistemi (6 kategori)
```

### Bilesenler (`components/`)
```
canli-durum-panel.tsx  -- Muze yogunluk paneli + DurumDetayModal
etkinlikler.tsx        -- Etkinlik bandi (realtime + 15sn polling yedegi)
ulasim-uyari.tsx       -- Ulasim uyari bandi (rayli sistem — IBB Ulasim haric)
trafik-uyari.tsx       -- Trafik bandi (IBB Ulasim — kopru, metrobus, karayolu)
tab-icons.tsx          -- SVG tab ikonlari
tarih-saat-secici.tsx  -- Turkce tarih-saat picker
```

### Kutuphane & Sabitler
```
lib/supabase.ts        -- Supabase client (detectSessionInUrl: false — onemli!)
lib/revenuecat.ts      -- RC init (ENTITLEMENT_ID = 'pro')
lib/config.ts          -- API anahtarlari (.gitignore'da)
constants/theme.ts     -- Tema sistemi (light+dark, Palette, Typo, Space, Radius)
```

### Asset'ler
```
assets/icons/logo.svg                -- Windrose (pusula) logo, beyaz/gradient kullanim
assets/icons/logo-mavi.svg           -- (KULLANILMIYOR — yedek)
assets/icons/ucus.svg                -- Ucak ikonu (IHL/SAW butonlari)
assets/images/logo-icon.png          -- Giris ekrani mavi logo (splash-icon.png'den kirpilmis)
assets/images/play-store-icon.png    -- 512x512 kare PNG, koseleri duz
assets/images/feature-graphic.png    -- 1024x500 Play Store
android-icon-foreground.png          -- 1024x1024 Canva Pro
splash-icon.png                      -- 288x288
```

### SQL Migration'lar (uygulanmislar)
```
supabase-migration-abonelik.sql
supabase-migration-admin.sql
supabase-migration-canli-durum.sql
supabase-migration-admin-saatler.sql
supabase-migration-acil-rehber.sql
supabase-migration-ulasim-uyarilari.sql
supabase-migration-engelleme.sql
supabase-migration-saha-admin-update.sql
supabase-migration-saha-sabit-koru.sql
havalimani_guncelle.sql
supabase-saha-nokta-ekle.sql
supabase-acil-numara-112.sql
supabase-demo-hesap.sql
```

### Diger
```
APPLE-CEVAP-v1.0.2.md / v1.0.3.md   -- Apple reject cevap metinleri
STORE-LISTING-BILGILERI.md           -- Store listing metinleri
STORE-YAYIN-REHBERI.md               -- Yayin rehberi
plugins/fix-buildconfig.js           -- Custom config plugin (package decl mismatch fix)
google-service-account.json          -- Google Play eas submit icin
.env                                 -- X Bearer Token + SUPABASE_SERVICE_ROLE_KEY (scheduled task'lar icin)
```

---

## 4. ABONELIK SISTEMI (FREEMIUM — v1.0.3'ten beri)

### Is Mantigi
- Uygulama **FREEMIUM** (temel ozellikler ucretsiz, premium ozellikler IAP ile)
- v1.0.3'te 7 gunluk deneme modeli KALDIRILDI (Apple reject'leri sonrasi)
- Kayit/giris GEREKMEZ — uygulama direkt tab'lara acilir
- Premium ozellikler: Rehber Sohbeti, Canli Saha Durumu, Ulasim/Trafik Uyarilari, Etkinlikler
- Ucretsiz: Tur Organizasyonu (muzeler/saraylar/camiler/bogaz/havalimani), Acil Durum, Arama, MuzeKart
- Fiyatlar: Aylik 99 TL / Yillik 699 TL (%41 tasarruf)
- Admin/moderator otomatik premium

### Akis
```
Anonim/Yeni:        Uygulama acilir → /(tabs) [temel ozellikler ucretsiz]
Kayitli ucretsiz:   Giris Yap → /(tabs) [premium ekranlarda "Abone Ol" karti]
Premium:            Giris Yap → /(tabs) [tam erisim]
Admin/Moderator:    Giris Yap → /(tabs) [tam erisim + admin panel]
```

### Premium Gate
- Ana Sayfa premium icerikler (canli durum, ulasim/trafik uyari, etkinlikler) gradient kart ile "Abone Ol" yonlendirir
- Sohbet ekraninda premium olmayanlara "Premium ozelliktir" ekrani
- Kontrol: `const { premiumMi } = useAbonelik();`
- Yonlendirme: `/abone-ol`

### Routing Korumasi (`_layout.tsx`)
- `initialRouteName` her zaman `"(tabs)"` — uygulama direkt acilir
- Global paywall redirect YOK
- Admin ekranlari auth gerektirir
- Sifre sifirlama deep link handler ile yakalanir → `/sifre-sifirla` (bkz. DECISIONS.md "Pending Pattern")

### `useAbonelik` Hook'u (FREEMIUM)
- `premiumMi`: Ana flag — IAP aktif VEYA admin/moderator ise true
- `aktifAbonelik`: RevenueCat'ten dogrulanmis abonelik
- `denemeSuresi`: Her zaman false (geriye uyumluluk)
- `paywallGoster`: Her zaman false
- Supabase realtime listener var: `abonelik-degisim` channel ile profiles UPDATE event'leri dinleniyor
- RC listener dependency `[]` (boş — RC ready polling icinde)

### Supabase profiles abonelik kolonlari
```sql
abonelik_durumu TEXT DEFAULT 'deneme' CHECK ('deneme','aktif','iptal','suresi_dolmus')
abonelik_bitis  TIMESTAMPTZ
abonelik_plani  TEXT CHECK ('aylik','yillik')
revenuecat_id   TEXT
```

### RevenueCat Yapilandirmasi
- **Entitlement ID:** `pro` (lib/revenuecat.ts) — RC dashboard ile eslesti
- **Products:** com.pusulaistanbul.app.aylik + com.pusulaistanbul.app.yillik (App Store + Play Store)
- **Offering:** "default" — Monthly ($rc_monthly) + Yearly ($rc_annual)
- **Init:** revenueCatInit() _layout.tsx'de uygulama acilisinda (anonim), revenueCatLogin() giris sonrasi

---

## 5. TASARIM KURALLARI (KESINLIKLE UYULACAK)

- **EMOJI YOK** — Hicbir ekranda, hicbir kodda emoji kullanilmayacak. Yeni kod yazarken de ASLA emoji ekleme.
  - Durum gostergesi: renkli daire View (`width:8, height:8, borderRadius:4`) veya Unicode (●/◐/✕/⚙)
  - Tip gostergesi: tek harf kisaltmalar (M, Y, B, D, R, E) — AMA kullanici icin anlamsiz olduklari icin etkinlikler.tsx'ten KALDIRILDI
  - Hata durumu: "!" metin
- **Muze/saray/cami kartlarinda kategori tipi (ozel_muze, saray vb.) GOSTERILMEZ** — v1.0.3'te kaldirildi
- **Kendi logosu kullanilacak** — `assets/icons/logo.svg` (windrose pusula), beyaz arkaplanda `tintColor="#0077B6"`
- **Ozellik kartlarinda ikon YOK** — Sadece tipografi ve spacing
- **Ozellik kartlarinda sol mavi accent bar** (4px genislik, Palette.istanbulMavi)
- **Sticky footer pattern** — CTA butonlari ekranin altinda sabit
- **LinearGradient** header ve butonlarda: `['#005A8D', '#0077B6', '#0096C7']`
- **Poppins font ailesi** tum ekranlarda explicit (fontFamily belirt)
- **Turkce karakter** — Tum UI metinlerinde duzgun karakter (ı/İ, ö/Ö, ü/Ü, ş/Ş, ç/Ç, ğ/Ğ). 98 duzeltme v1.0.6'da tamamlandi.
- **MuzeKart yazimi** — "MuzeKart" (M ve K buyuk, bitisik). "Muze Kart" veya "Muzekart" KULLANILMAZ.
- **Sayfa basliklari = buton metinleri** — "Muze · Saray · Cami", "Bogaz Turlari", "Havalimani Ulasim" (buton ile uyumlu)

---

## 6. GIRIS EKRANI (`giris.tsx`) DETAYLARI

- Logo: `expo-image` ile `tintColor="#0077B6"` (logo-icon.png, beyaz arkaplan)
- Giriş/Kayıt tab'lari (sekme sistemi)
- Kayit formu: Isim, Soyisim, TUREB Ruhsat No, Email, Sifre, Sifre Tekrar (dogrulama var)
- Sifre min 6 karakter, "Sifreler eslesmiyorsa" hata
- "Misafir olarak devam" KALDIRILDI
- Sifre + Sifre Tekrar alanlarinda "Goster"/"Gizle" butonu (emoji yok, screen reader uyumlu, secureTextEntry toggle)
- Basarili kayit → `router.replace('/hos-geldin')`
- Email confirmation ACIK: `if (data.session)` kontrolu, session yoksa profil INSERT atlanir (RLS engeli)
- emailRedirectTo: `https://pusulaistanbul.app/dogrulandi.html`
- sifremiUnuttum redirectTo: `pusulaistanbul://giris`

---

## 7. 3 OZEL EKRAN

### EKRAN 1: `hos-geldin.tsx` (Onboarding)
- Gradient header + windrose logo + "Pusula Istanbul'a Hos Geldiniz!"
- Alt metin: "Profesyonel turist rehberlerinin dijital asistani."
- **UCRETSIZ OZELLIKLER** (sol mavi accent — 3 kart):
  1. Tur Organizasyonu — Muze/saray/cami ziyaret saatleri, gise kapanislari, giris ucretleri
  2. Kapsamli Ulasim Rehberi — Havalimani transferleri, Bogaz turlari, MuzeKart bilgileri
  3. Acil Durum Rehberi — Hastane, konsolosluk, polis, acil iletisim
- **PREMIUM OZELLIKLER** (sol mor accent #7B2D8E — 3 kart):
  4. Anlik Iletisim — Meslektaslarla canli sohbet, saha guncellemeleri
  5. Canli Saha Durumu — Anlik kuyruk, yogunluk
  6. Ulasim Uyarilari ve Etkinlikler — Metro arizalari, kapanan yollar, kent etkinlikleri
- Sticky footer: "Kesfetmeye Basla" → `/(tabs)` (direkt)
- Yasal linkler: Kullanim Kosullari + Gizlilik Politikasi

### EKRAN 2: `deneme-baslat.tsx` (REDIRECT)
- Eski 7 gunluk deneme ekrani KALDIRILDI
- Sadece `router.replace('/(tabs)')` — eski deep link'ler icin geriye uyumluluk

### EKRAN 3: `abone-ol.tsx` (Paywall)
- Gradient header + logo
- Baslik: "Dijital Asistanınızı Kesintisiz Kullanın"
- Alt baslik: "Cami ve müze ziyaret saatleri, canlı saha durumu, ulaşım uyarıları, döviz çevirici ve kent etkinlikleri gibi premium özelliklere erişmek için size en uygun planı seçin."
- 2 plan karti yan yana (esit, minHeight: 180):
  - Aylik: 99 TL/ay (standart beyaz, bos radio)
  - Avantajli Yillik: 699 TL/yil = 58,25 TL/ay (%41 tasarruf badge, LinearGradient + dolu radio)
- Yillik default secili
- Fiyat: fontSize 24, numberOfLines={1}, adjustsFontSizeToFit
- Sticky footer: "Pusula İstanbul'u Aktifleştir" butonu
- "Satın Almaları Geri Yükle" butonu (Purchases.restorePurchases — Apple 3.1.1)
- Yasal metin: "Abone olarak Gizlilik Politikası'nı ve Kullanım Koşulları'nı kabul etmiş olursunuz."
- "Geri Dön" butonu (`router.back()`)
- **3 katmanli guvenlik agi (v1.0.6 fix):** RC entitlement check → basarisizsa otomatik restore → Supabase fallback update → realtime listener

---

## 8. ADMIN SISTEMI

- `profiles.rol`: 'admin', 'moderator', 'user'
- `useAdmin` hook'u: isAdmin, isMod, isYetkili
- Admin panel butonu profil ekraninda sadece yetkililere
- Ekranlar: etkinlik yonetimi, sohbet moderasyonu, ban yonetimi, kufur filtresi, mekan saatleri, ulasim tarife, acil durum, saha bildirimleri
- Admin/moderator abonelik kontrolunden muaf

### Moderator Yetkileri (sinirli)
- Etkinlik yonetimi (admin-etkinlik.tsx — tam erisim)
- Sultanahmet Camii saat girisi (admin-saatler.tsx — sadece Sultanahmet)
- Saha durumu bildirim (canli-durum-panel — tum kullanicilar gibi)
- **GOREMEZ:** Sohbet moderasyonu, ban yonetimi, kufur listesi, mevsim gecisi, mekan listesi/ekleme/duzenleme, ulasim tarifeleri, acil durum rehberi
- admin-saatler.tsx'de `{isAdmin && (...)}` ile sarili: mevsim gecis butonlari, kategori sekmeleri, mekan listesi/duzenleme

---

## 9. SOHBET SISTEMI

- **PREMIUM ozelliktir** — `premiumMi` kontrolu ile gate'lenmis (v1.0.3)
- Realtime mesajlasma (Supabase Realtime + 5sn polling yedegi)
- Kufur filtresi (DB'den yuklenir, hook ile)
- Screenshot korunmasi (expo-screen-capture)
- Mesaj raporlama: "..." gorsel buton VEYA uzun basma (600ms) → raporlama/engelleme dialog'u (Apple Guideline 4 iPad uyumlulugu)
- Kullanici engelleme: `engellenen_kullanicilar` tablosu + anlik UI filtreleme (Apple 1.2 UGC)
- Kendi mesajini raporlayamama korumasi
- Klavye altinda kalma fix: KeyboardAvoidingView en dis container, Android behavior='height', textAlignVertical='top'
- Mesaj tarih gosterimi: Bugun=saat, Dun=Dun+saat, Bu hafta=Gun+saat, Eski=GG.AA+saat

---

## 10. ANA SAYFA (`index.tsx`) ICERIKLERI — FREEMIUM GATE'LI

- Hava durumu (wttr.in API) — UCRETSIZ
- Namaz vakitleri (Aladhan API) — UCRETSIZ (rehberin musterilerine bilgi)
- Galataport gemi takvimi — UCRETSIZ
- Canli muze kuyruk durumu — **PREMIUM** (premiumMi ? panel : gradient abone-ol karti)
- Ulasim uyari bandi — **PREMIUM** (premiumMi ? bant : gradient abone-ol karti) — sadece rayli sistem
- Trafik uyari bandi — **PREMIUM** (mavi tema, IBB Ulasim kaynakli)
- Etkinlikler bandi — **PREMIUM**
- 8'li grid (v1.0.7 sadelestirildi):
  - Ust: Namaz Vakitleri, Muze/Saray/Cami, Bogaz Turlari, MuzeKart
  - Alt: IHL Ucuslari (istairport.com), SAW Ucuslari (sabihagokcen.aero), Havalimani Ulasim, Doviz Kuru
- Tum varsayilan navigasyon ozgun ucak ikonu (`assets/icons/ucus.svg`) ile

---

## NOT: Bu Dosyanin Sahibi

Bu dosya statik bilgi icerir; teknik degisiklik olunca (yeni hook, yeni ekran, yeni kategori) buraya yansitilmali.

Surum-spesifik bilgiler `CHANGELOG.md`'de.
Mevcut sistem durumu `STATE.md`'de.
Mimari kararlar ve dersler `DECISIONS.md`'de.
Bilinen sorunlar `ISSUES.md`'de.
Email/payment/CI altyapisi `INFRASTRUCTURE.md`'de.
