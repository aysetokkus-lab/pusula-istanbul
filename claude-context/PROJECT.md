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
  ajanda.tsx           -- Eyl 2026: AJANDA (Stack) — tur takvimi, ?yeni=1 form, ?tarih=YYYY-MM-DD
  tur/[id].tsx         -- Eyl 2026: TUR + MASRAF PUSULASI + acenteye gonder (PDF/Word/Excel)
  _layout.tsx          -- Root layout: auth + abonelik gating + routing + deep link handler
  giris.tsx            -- Login/Register ekrani
  hos-geldin.tsx       -- EKRAN 1: Onboarding (kayit sonrasi)
  sifre-sifirla.tsx    -- Sifre sifirlama ekrani (deep link recovery)
  gizlilik-politikasi.tsx
  kullanim-kosullari.tsx
  (admin*.tsx Eyl 2026'da SILINDI → components/yetkili/)
  modal.tsx

app/(tabs)/
  _layout.tsx          -- Tab navigator (5 tab + 4 gizli)
  index.tsx            -- Ana Sayfa (hava, namaz, gemi, canli durum, ulasim, etkinlikler)
  acil.tsx             -- Acil durum (tek 112 + sozlesmeler)
  sohbet.tsx           -- Rehber sohbet (realtime, kufur filtreli, screenshot korumali)
  ara.tsx              -- Arama (Eyl 2026: alt bardan cikti, href:null; ana sayfa header buyutec butonundan acilir)
  ilanlar.tsx          -- Eyl 2026: Is ilanlari sekmesi (hooks/use-ilanlar.ts)
  profil.tsx           -- Profil (abonelik durumu, gorunum secici)
  muzeler.tsx          -- Muze/saray/cami (gizli tab)
  bogaz.tsx            -- Bogaz turlari (gizli tab)
  ulasim.tsx           -- Havalimani ulasim (gizli tab)
  muzeKart.tsx         -- MuzeKart (gizli tab)
```

### Hook'lar (`hooks/`)
```
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
use-ajanda.ts            -- Eyl 2026: ajanda_turlar CRUD (useAjanda / useTur)
use-masraflar.ts         -- Eyl 2026: masraflar (masraf+avans) CRUD, fis yukleme (masraf-fisler), ozet
```

### Bilesenler (`components/`)
```
canli-durum-panel.tsx  -- Muze yogunluk paneli + DurumDetayModal
etkinlikler.tsx        -- Etkinlik bandi (realtime + 15sn polling yedegi)
ulasim-uyari.tsx       -- Ulasim uyari bandi (rayli sistem — IBB Ulasim haric)
trafik-uyari.tsx       -- Trafik bandi (IBB Ulasim — kopru, metrobus, karayolu)
tab-icons.tsx          -- SVG tab ikonlari
tarih-saat-secici.tsx  -- Turkce tarih-saat picker
ajanda-karti.tsx       -- Eyl 2026: ana sayfa Ajandam karti (hafta seridi, bugun/siradaki tur)
tur-form-modal.tsx     -- Eyl 2026: tur ekle/duzenle formu
ui/takvim.tsx          -- aylik takvim (gecmisSecilebilir + isaretler destegi)
```

### Kutuphane & Sabitler
```
lib/supabase.ts        -- Supabase client (detectSessionInUrl: false — onemli!)
lib/config.ts          -- API anahtarlari (.gitignore'da)
constants/theme.ts     -- Tema sistemi (light+dark, Palette, Typo, Space, Radius)
constants/masraf.ts    -- Eyl 2026: masraf kategorileri, para birimleri, TR para bicimi (DB CHECK + Edge Function ile ayni)
lib/masraf-disa-aktar.ts -- Eyl 2026: Edge Function cagrisi + dosya yazma + MailComposer/Sharing (web: indirme + mailto)
lib/uyari.ts           -- Eyl 2026: uyar()/onayla() — web'de Alert.alert no-op oldugu icin window.alert/confirm yedegi
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

## 4. ERISIM MODELI — TAMAMEN UCRETSIZ (Eyl 2026)

- Uygulama profesyonel turist rehberlerine **tamamen ucretsiz**. IAP/abonelik/paywall/RevenueCat YOK (Eyl 2026'da kaldirildi; onceki freemium modeli icin CHANGELOG + DECISIONS #52).
- Kayit zorunlu (v1.0.13), TUREB ruhsat no formda var ama dogrulanmaz. Giris yapan herkes tum ozelliklere erisir.
- `profiles.abonelik_*` kolonlari DB'de duruyor (tarihsel), kod okumuyor. `app_versions` guncelleme bandi ayni.
- Silinen dosyalar: abone-ol.tsx, deneme-baslat.tsx, hooks/use-abonelik.ts, lib/revenuecat.ts; `react-native-purchases` package.json'dan cikti.

---

## 5. TASARIM SISTEMI v2 — "KOBALT & MENEKSE" (Eyl 2026 redesign) — KESINLIKLE UYULACAK

- **Kaynak:** `constants/theme.ts` (Palette, Gradient, Tema light/dark, Font, Typo, Radius) + ortak parcalar `components/ui/pusula-ui.tsx` (Kicker, BolumBaslik, Kart, Rozet, DurumNoktasi, BirincilButon, IkonKaro, GradyanHeader, HeaderBaslik, ModalKapak, Segmentler, BosDurum). Yeni ekran/bilesen YALNIZCA bu parcalarla yazilir.
- **Palet:** kobalt `#1E40AF` (ana: header, kobalt buton, aktif tab), menekse `#7C3AED` (ikincil: gradyan ucu, muzeler, rozet), safran `#F59E0B` (CTA: "Sahadan bildir", "+ Yeni", Kaydet/Ekle), durum: acik `#16A34A` / uyari `#F59E0B` / kapali `#DC2626`, altin `#B45309` (saraylar). Zemin beyaz, kart `#F6F7FD` (acik lavanta), border `#E6E8F5`, metin `#121A3E`. Dark mod tokenlarla otomatik. Hey Istanbul'dan ayrisma: turkuaz/mercan/krem KULLANILMAZ.
- **Header:** yalnizca ekran header'i gradyan (`GradyanHeader`, kobalt→menekse, alt koseler 28px). Bolum basliklari gradyan bant DEGIL — KICKER (11px, bold, 1px letter-spacing, uppercase) + `Kart` (radius 24, ince border).
- **HEX YAZMA** — `t.*` / `Palette.*` / `Gradient.*`; tek istisna `#FFFFFF`. `fontFamily` varken `fontWeight` VERME (Android sahte-bold). Poppins ailesi (Font.regular/semibold/bold/extrabold).
- **EMOJI YOK** — hicbir ekranda, hicbir kodda. Durum = `DurumNoktasi`; ikon = react-native-svg (assets/icons/*.svg, tab-icons.tsx, inline 24px stroke).
- Modallar `ModalKapak` (alttan, 28px, tutamac, kobalt "Kapat"). Sekmeler `Segmentler`. Ikon izgarasi `IkonKaro` (58px kobalt karo, beyaz ikon).
- Kart/duyuru/etkinlik gibi bloklarda **sol accent cizgisi** (5px) yalnizca durum tasidiginda (acik/kapali, sabit) kullanilir.
- **MuzeKart yazimi** — "MuzeKart" (M ve K buyuk, bitisik). **Turkce karakter** tum UI metinlerinde duzgun. **Sayfa basliklari = buton metinleri**.
- Mekan kartlarinda kategori tipi (ozel_muze, saray vb.) GOSTERILMEZ. Kendi logosu `assets/icons/logo.svg`, beyaz arkaplanda `tintColor={t.primary}`.
- Eski `Palette.istanbulMavi/maviAcik/maviOrta/maviKoyu` adlari geriye uyumluluk icin duruyor, yeni degerlere baglidir — yeni kodda `Palette.kobalt` vb. kullan.

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

## 6a. GOOGLE + APPLE ILE GIRIS (Eyl 2026)

- `lib/oauth.ts`: `googleIleGiris()` (tarayici akisi: `signInWithOAuth({provider:'google', redirectTo:'pusulaistanbul://giris', skipBrowserRedirect})` + `WebBrowser.openAuthSessionAsync` → `oauthDonusuIsle(url)`: #access_token → setSession, ?code → exchangeCodeForSession; web'de redirect + giris.tsx mount'ta isleme), `appleIleGiris()` (yalnizca iOS, `expo-apple-authentication` → `signInWithIdToken({provider:'apple'})`; ilk giriste fullName → profiles isim/soyisim), `appleGirisiVarMi()`, `profilEksikMi(userId)` (ruhsat_no/isim bos → eksik).
- Android'de Apple girisi YOK (bilincli: Supabase Apple client secret 6 ayda bir yenilenir; native iOS akisi secret istemez). Supabase Apple provider: Client IDs = `com.pusulaistanbul.app`.
- **Profilini tamamla** `app/profil-tamamla.tsx`: OAuth ile gelen kullanicida ruhsat no + telefon zorunlu; `_layout.tsx` `profilEksik` state ile her rotadan buraya yonlendirir (yonlendirmeden once taze kontrol). Kaydet → `profiles` upsert + `auth.updateUser` (USER_UPDATED → _layout yeniden kontrol) → /hos-geldin.
- Ayni e-posta ile mevcut hesap: Supabase dogrulanmis e-postayi otomatik baglar (ikinci hesap acilmaz).
- Konsol: Google Cloud proje `pusula-istanbul` (Google Auth Platform: Branding/Audience/Clients), Web istemci "Supabase Auth"; Apple Developer'da Sign in with Apple capability; app.json `ios.usesAppleSignIn` + plugin `expo-apple-authentication`.
- Giris ekrani: e-posta formu + ayrac "ya da" + "Google ile devam et" + (iOS) "Apple ile devam et". Google "G" logosu HEX istisnasi (marka kilavuzu).

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

## 8. YETKILI (ADMIN/MODERATOR) SISTEMI — INLINE YONETIM (Eyl 2026)

- `profiles.rol`: 'admin', 'moderator', 'user'. `useAdmin` hook'u: isAdmin, isMod, isYetkili.
- **Ayri admin paneli YOK** (app/admin*.tsx Eyl 2026'da silindi). Yonetim, ilgili bolumun hemen altinda `components/yetkili/yetkili-bolum.tsx` (`YetkiliBolum`) sarmalayicisiyla yapilir: yetkisiz kullaniciya hic render edilmez, yetkiliye "YONET · <baslik>" satiri + acilir panel; `sadeceAdmin` prop'u moderatoru de gizler; panel kapaliyken cocuk mount edilmez.
- Bilesenler (`components/yetkili/`): `SahaYonetim` (ana sayfa, CanliDurumOzet alti, herkes), `EtkinlikYonetim` (EtkinliklerBandi alti, herkes), `MekanSaatleriYonetim kategori=...` (muzeler sekmesi, aktif kategoriyle senkron; moderator sadece camiler), `SohbetYonetim` (sohbet FlatList ListHeaderComponent, 3 sekme Raporlar/Banlar/Kufur, admin), `UlasimTarifeYonetim tip='bogaz'|'havalimani'` (bogaz/ulasim sekmeleri, admin), `AcilRehberYonetim` (acil sekmesi, admin), `ModeratorYonetim` (profil, admin). Genel duyurular zaten inline (GenelDuyuruPanel).
- Moderator yetkileri degismedi: saha bildirimi, etkinlik, genel duyuru, cami saatleri (kategori `camiler`e kilitli, silme yok). GOREMEZ: sohbet moderasyonu/ban/kufur, mevsim gecisi, diger mekan kategorileri, ulasim tarifeleri, acil rehber.
- Kural: yeni bir yonetim ozelligi eklerken ayri ekran ACMA — ilgili bolumun altina `YetkiliBolum` ile ekle. Ic ice scroll yasak (bilesenler zaten ScrollView icinde).

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
- **Tepkiler (Eyl 2026):** tablo `sohbet_tepkileri` (mesaj_id+kullanici_id PK, tip: begen|begenme|kalp|saskin, realtime). Hook `hooks/use-sohbet-tepkileri.ts` (optimistic upsert/delete, ayni tip=kaldir). UI `components/sohbet-tepkiler.tsx`: `TepkiIkon` (SVG, emoji YOK), `TepkiSatiri` (balon alti pill'ler, benimki dolu), `MesajMenusu` (uzun basma / (...) → alt sayfa: 4 tepki + Yanitla/Raporla/Engelle/Sabitle/Sil), `TepkiVerenlerModal` ("kimler ›" veya pill'e uzun basma). **Cift dokunma = Begen** (300 ms).
- **Yanit (Eyl 2026):** `sohbet_mesajlari.yanit_id` (self FK, ON DELETE SET NULL). Balonda `YanitAlinti` (isim + ozet, dokununca orijinale scrollToIndex), yazma kutusu ustunde `YanitSeridi` (iptal). Push: `trg_push_sohbet` yanit ise yanitlanana HEDEFLI push ("X mesajina yanit verdi", veri.yanit=true) + genel "Yeni Mesaj" push'u gonderen ve yanitlanani haric tutar (`push_gonder_async` yeni imza: hedef_kullanici_id, haric_liste; eski 5-arg cagrilar uyumlu). push-gonder Edge Function **v5**: premium filtresi KALKTI (ucretsiz model), hedef_kullanici_id + haric_liste destegi. Kaynak repoda `supabase/functions/push-gonder/index.ts`.
- **Gorsel paylasimi (Eyl 2026):** `sohbet_mesajlari.gorsel_url`; bucket `sohbet-gorseller` (public okuma, giris yapan kullanici kendi `<uid>/` klasorune yukler, 5 MB, sadece resim; silme: sahibi veya admin/mod). `components/sohbet-gorsel.tsx`: `gorselSec()` (Kamera/Galeri Alert, quality 0.7), `sohbetGorselYukle()`, `GorselButon` (yazma kutusu solunda), `GorselOnizleme` (gonderim oncesi serit), `MesajGorseli` (balon ici 62% genislik, dokununca `TamEkranGorsel`). Gorsel-only mesaj (bos metin) gonderilebilir; push metni '[Görsel] ...' / 'Görsel gönderdi'. app.json: expo-image-picker plugin + NSCamera/NSPhotoLibrary aciklamalari (native build gerekir).

---

## 9a. OZEL MESAJLASMA — DM (Eyl 2026)

- Tablolar `dm_konusmalar` (a<b sirali cift, a_isim/b_isim, son_mesaj/_at/_gonderen, a/b_okundu_at) + `dm_mesajlar` (konusma_id, gonderen, mesaj, gorsel_url). **RLS: yalnizca iki katilimci okur; admin/moderator GOREMEZ** (mahremiyet — Ayse karari). Yazma yalnizca RPC: `dm_konusma_getir(alici_id)` (engel kontrolu, var olani doner/olusturur), `dm_gonder(konusma, mesaj, gorsel_url)` (ban+engel kontrolu, son_mesaj gunceller, aliciya HEDEFLI push 'sohbet' kategorisi, veri.dm=true), `dm_okundu(konusma)`, `dm_okunmamis_sayisi()`.
- Rapor: `raporlanan_mesajlar` (mesaj_id = dm mesaj id, kaynak='dm', sebep 'uygunsuz') → moderator yalnizca raporlanan metni gorur. Engelleme: `engellenen_kullanicilar` iki yonlu gecerli.
- UI: `hooks/use-dm.ts`; sohbet ekrani ustunde Segmentler **Genel | Mesajlarim (N)**; konusma listesi → `app/dm/[id].tsx` (balonlar, gorsel — sohbet-gorsel.tsx aynen, Okundu/Iletildi, uzun basma: Raporla / Sil, header "...": Engelle). Giris noktalari: genel sohbette isme dokunma veya MesajMenusu 'Ozel mesaj gonder'; Rehber Araniyor kartinda 'Mesaj' pill'i. Sohbet tab rozeti: genel okunmamis VEYA dm okunmamis.

## 9b. IS ILANLARI (Eyl 2026)

- Tablo `ilanlar` (tur rehber_araniyor|is_ariyorum|diger, baslik, diller[], tarih, saat, sure, grup_buyuklugu, ucret, iletisim, durum aktif|dolduruldu|kaldirildi). RLS: giris yapan okur, ekleme kendi, guncelleme/silme kendi veya admin/mod. Realtime. **Hemen yayinlanir** (Ayse karari), yetkili "Kaldir" ile durum=kaldirildi.
- Push: INSERT trigger `trg_push_ilan` → kategori **ilanlar** (kanal `ilanlar-v3`, 7. bildirim tercihi). push-gonder **v6**: ilanin `diller` ile kullanicinin `profiles.diller` kesisimi (profil dili bos → herkes alir). Dil listesi `constants/diller.ts` (40 dil: TUREB 'Rehberler Dillere Gore' listesi (39, eylemli rehber sayisina gore sirali) + en sonda Turkce (Turk grup ilanlari, Turkce taban) — Ayse, 4 Eyl 2026; ekleme tek satir). **Tarih secimi `components/ui/takvim.tsx` (bagimliliksiz aylik takvim, Pzt baslangic, gecmis gunler kapali).** **Ucret: sadece rakam, TUREB taban altina izin yok** — `constants/tureb-taban.ts` (2026: yabanci dil gunluk 5.566 / transfer-gece 2.790 / paket gunluk 6.708; Turkce 3.897 / 1.953 / 4.696; yarim gun = gunluk taban; sadece 'Turkce' secilmisse Turkce tarife). Her yil bu dosya guncellenir (kaynak tureb.org.tr/Sayfa?id=16). **Ilan turleri UI'da yalnizca 'Rehber araniyor' ve 'Transfer / Diger'** — 'is_ariyorum' Ayse istegiyle formdan ve filtreden cikarildi (DB CHECK'te duruyor, eski kayit gelirse rozet yine basilir).
- UI: `app/(tabs)/ilanlar.tsx` — alt barda Ara'nin yerine (Ana · Acil · Sohbet · Ilanlar · Profil); Segmentler filtre + dil chip'leri; kart: tur rozeti, tarih/saat, dil rozetleri, sure/grup/ucret, Ara (tel:) + WhatsApp (wa.me); kendi ilaninda Dolduruldu/Sil; "+ Ilan Ver" formu (hizli tarih chip'leri, profil dilleri on-secili, telefon profile kaydedilir). Header'da "Bildirim dilleri" modali → profiles.diller. Profil duzenleme modalina Telefon + Dillerim eklendi.

## 9b-1. TELEFON — BEYAN USULU (Eyl 2026)

- `profiles.telefon` E.164 (`+905321234567`); dogrulama SMS'i/WhatsApp kodu YOK (Ayse, 4 Eyl 2026: sirket evraki yok, ayri numara almak istemiyor; maliyet arastirmasi STATE.md). Kayitta ZORUNLU (`giris.tsx` → auth metadata `telefon` → `handle_new_user` trigger'i profile yazar). Profil duzenlemede zorunlu, ilan formunda zorunlu, DM baslatmadan once `useTelefonGerekli` (telefon yoksa `TelefonModal`).
- Yardimcilar `lib/telefon.ts`: `telefonNormalize` (05xx / 5xx / +90 / 0090 / yurt disi +), `telefonGoster` (+90 532 123 45 67), `whatsappLink`, `aramaLink`, `TELEFON_HATA/YARDIM`. UI parcalari `components/telefon-modal.tsx` (`TelefonAlani` — input + bicim uyarisi + "WhatsApp'ta ac" kendi kendine saglama; `TelefonModal`; `useTelefonGerekli`), `components/telefon-karti.tsx` (ana sayfa, telefonu bos mevcut kullanicilara tek seferlik; AsyncStorage `telefon-karti-ertele` 3 gun).
- Topluluk denetimi: baskasinin ilaninda "Numaraya ulasilamiyor mu? Bildir" → `telefonNumaraRaporla` → `raporlanan_mesajlar` (kaynak='telefon', sebep='diger', mesaj_id = ilan id) → yetkili SohbetYonetim Raporlar'da gorur.
- Kural: yeni kodda telefonu ham string olarak KAYDETME — once `telefonNormalize`, `useProfilDilleri().telefonKaydet` zaten normalize eder (gecersizse false).

## 9b-2. TUREB DOGRULAMASI — ROZET (Eyl 2026)

- Kaynak: TUREB acik rehber veritabani (`POST https://www.tureb.org.tr/RehberVeritabani/AraAdiSoyadi`, adi/soyadi). Donen: ad soyad, oda, yabanci dil, eylemli/eylemsiz. **Ruhsat no yok** → eslesme ad-soyadla; `profiles.ruhsat_no` beyan olarak kalir.
- Kural (Ayse): rozet modeli, kayit engellenmez; eylemsiz rehber de ilan verir ve basvurur (gri rozet).
- DB: `profiles.tureb_durum/oda/dil/ad/adaylar/kontrol_at`; trigger `profiles_tureb_koru` (kullanici tureb_* yazamaz). HTTP cagrisi pg_net ile (`tureb_http_baslat/sonuc`, service_role) — Deno fetch TUREB'in TLS'ine baglanamiyor.
- Edge Function `tureb-dogrula` (kaynak `supabase/functions/tureb-dogrula/`): `{}` → sorgu; `{secim:n}` → coklu eslesmede secim. Eslesme: tam ad → tek/coklu; 4 asamali soyad/ad denemesi; profiles.diller bossa TUREB dili yazilir.
- Istemci: `hooks/use-tureb.ts` (useTureb, useTurebOtomatik acilista 1 kez, useTurebRozetleri toplu), `components/tureb-rozet.tsx` (TurebRozet, TurebKarti), `components/yetkili/tureb-yonetim.tsx` (admin listesi). Rozet: profil header, ilan karti. Yeni yerde rozet gostermek = `useTurebRozetleri([id])` + `<TurebRozet>`.

## 9c. AJANDA + MASRAF PUSULASI (Eyl 2026) — rota planlayicinin YERINE

- **Karar (Ayse, 3 Eyl):** rota planlayici "anlamsiz" → tamamen SILINDI (kod + `rotalar` tablosu; git gecmisinde durur). Yerine rehberin kendi tur ajandasi + her tur icin masraf pusulasi.
- **Tablolar:** `ajanda_turlar` (kullanici_id, tarih, baslik, acente, acente_email, grup, saat HH:MM, bulusma, notlar; RLS yalnizca kendi; trg updated_at) ve `masraflar` (tur_id, kullanici_id, tip masraf|avans, kategori CHECK: muze_giris, ulasim, otoyol_kopru, otopark, kaptan_yemek, rehber_yemek, bahsis, telefon, diger, avans; tutar numeric(12,2); para_birimi TRY|EUR|USD; fis_path; sira). Migration `ajanda_ve_masraf_pusulasi`. Fisler OZEL bucket `masraf-fisler` (<uid>/<tur_id>/<dosya>, 8 MB, jpeg/png/webp; policy: yalnizca sahibi okur/yukler/siler).
- **Avans + rehberlik ucreti (v2, Ayse):** `masraflar.tip` masraf|avans|**ucret** (kategori 'ucret' = Rehberlik Ucreti, TRY/EUR/USD); ozet para birimi bazinda **`masraf + ucret − avans = kalan`** (>0 "Acenteden alinacak", <0 "Acenteye iade", 0 "Hesap kapandi").
- **Cok gunlu tur (v2, Ayse: "12 Eylul baslar 30 Eylul biter"):** `ajanda_turlar.bitis_tarih` (NULL = tek gun; CHECK >= tarih), `masraflar.tarih` = satirin gunu (NULL = baslangic). Migration `ajanda_cok_gunlu_tur_ve_rehberlik_ucreti`. Form: "Cok gunlu tur" anahtari + ikinci Takvim (minDate = baslangic). Ajanda/kart: tur aralik boyunca dolu sayilir (`turKapsar`, `turGunleri`, `kacinciGun`, `tarihAraligiKisa` — hooks/use-ajanda.ts). Tur ekraninda masraf formu gun chip'leri (varsayilan: bugun aralikta ise bugun), satirlar gune gore gruplanir; ciktilarda GUN sutunu + "12 – 30 Eylul 2026 (19 gun)" basligi.
- **UI:** `components/ajanda-karti.tsx` ana sayfada PinliMesajBandi altinda (haftanin 7 gunu: turlu gun dolu kobalt daire, bugun safran halka; bugunku tur yoksa siradaki; "+ Tur ekle"). `app/ajanda.tsx` (Takvim gecmisSecilebilir + isaretler, secili gunun turlari, yaklasan turlar). `app/tur/[id].tsx` (tur bilgisi, masraf/avans satirlari — satira dokun → duzenle/sil, fis kucuk resmi imzali URL —, ozet, "Acenteye gonder" karti). Form: `components/tur-form-modal.tsx`; masraf formu tur ekraninda (kategori chip'leri, tutar `tutarParse` "1.250,50" kabul, para birimi Segmentler, fis kamera/galeri).
- **Disa aktarma (Edge Function `masraf-disa-aktar`, verify_jwt ACIK, kaynak `supabase/functions/masraf-disa-aktar/`):** POST {tur_id, formatlar[]} → {dosyalar[{ad,mime,base64}], ozet, acente_email, konu}. Veri kullanicinin kendi JWT'siyle okunur (RLS), fisler ozel bucket'tan indirilir. PDF: pdf-lib + Poppins alt kumesi (`docs/varliklar/Poppins-*-tr.ttf`, yedek google/fonts) — kobalt→menekse bant, minik beyaz logo (22pt), lavanta bilgi kartlari, kobalt basli tablo, safran ozet, fis sayfalari 2×2. Word: `docx` (kobalt logo 20pt ustbilgi, tablo, ozet, fis gorselleri). Excel: `exceljs` (kobalt bant + logo, SUMIF formulleri, IF'li kalan etiketi, "Fisler" sayfasi; sutunlar A # · B Gun (tek gunlu turda gizli) · C Kategori · D Aciklama · E Fis · F Tutar · G PB). Her uc ciktida Masraflar / Rehberlik ucreti / Avanslar tablolari + 4 satirli ozet. **Fonksiyon v2 deploy (3 Eyl).** Logo/font `https://pusulaistanbul.app/varliklar/` (docs/varliklar → GitHub Pages; yayina cikana kadar cikti logosuz, font google/fonts'tan). Dosya adi `Masraf-Pusulasi_<tarih>_<slug>.<ext>`.
- **Gonderim (Ayse karari) — 3 buton:** **Mail Gonder** = telefonun mail uygulamasi ekli acilir (`expo-mail-composer`, alici = acente_email, konu + ozetli govde; imza REHBERIN adi + telefonu, Pusula imzasi YOK); **WhatsApp ile Gonder** = paylasim sayfasi (`expo-sharing`, dosyalar sirayla; WhatsApp yuklu degilse uyari); **Telefona Kaydet** = Android `StorageAccessFramework` (klasor sec → base64 yaz), iOS Dosyalar'a kaydet sayfasi. Web'de (Chrome inceleme) tarayici ek ekleyemez: dosyalar indirilir + `mailto:` / `wa.me`. Dosyalar `cacheDirectory/masraf-pusulasi/`.
- **Native:** expo-mail-composer + expo-sharing + expo-file-system eklendi (plugin `expo-mail-composer`) → 1.2.0 store build'ine dahil; kamera/galeri izin metinleri fis'i de kapsar.
- Yeni kodda EMOJI YOK, HEX YOK (Palette/t.*), Poppins; tsconfig `exclude: supabase/functions` (Deno kodu tsc'den cikarildi → tsc 0 hata).

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
