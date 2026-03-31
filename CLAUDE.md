# Pusula Istanbul - Proje Devam Dosyasi

Bu dosya, yeni bir Claude oturumunda projenin tam durumunu aktarmak icin hazirlanmistir.
Yeni oturumda bu dosyayi Claude'a at, tam context ile devam edilsin.

---

## 1. PROJE TANIMI

**Pusula Istanbul** - Istanbul'daki profesyonel turist rehberleri icin gelistirilen mobil uygulama.
Canli saha durumu, muze kuyruk bilgileri, ulasim verileri, rehber sohbeti, etkinlikler ve acil durum bilgileri sunar.

**Gelistirici:** Ayse Tokkus (ayse.tokkus@gmail.com)
**Durum:** Aktif gelistirme asamasinda, Expo Go ile test ediliyor

---

## 2. TEKNIK YAPI

### Platform & Framework
- **React Native** + **Expo SDK 54** (Expo Go uzerinde test)
- **Expo Router** (tab-based navigation + Stack screens)
- **TypeScript**
- Test cihazi: Samsung S22 5G Android

### Backend
- **Supabase** (Auth + PostgreSQL + Realtime + RLS)
  - URL: `https://rzlfghjpsximthlolfxo.supabase.co`
  - Auth: Email/Password (Email confirmation KAPALI)
  - Tablolar: `profiles`, `sohbet_mesajlari`, `yogunluk`, `canli_durum`, `raporlanan_mesajlar`, `etkinlikler`, `kufur_listesi`

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
  "react-native-svg": "15.12.1"
}
```

### Font Ailesi
Poppins: 400Regular, 600SemiBold, 700Bold, 800ExtraBold

### Renk Paleti
```
Primary: #0077B6 (Istanbul Mavi)
Medium:  #0096C7
Light:   #48CAE4
Bright:  #00A8E8
Dark:    #005A8D
Uyari:   #E09F3E (amber)
Kapali:  #D62828 (kirmizi)
Acik:    #0096C7 (mavi)
```

---

## 3. DOSYA YAPISI

### Ekranlar (app/)
```
app/
  _layout.tsx          -- Root layout: auth + abonelik gating + routing
  giris.tsx            -- Login/Register ekrani
  hos-geldin.tsx       -- EKRAN 1: Onboarding (kayit sonrasi)
  deneme-baslat.tsx    -- EKRAN 2: 7 gun ucretsiz deneme baslat
  abone-ol.tsx         -- EKRAN 3: Paywall (deneme bittikten sonra)
  gizlilik-politikasi.tsx -- KVKK uyumlu gizlilik politikasi
  kullanim-kosullari.tsx  -- Kullanim kosullari (13 bolum)
  admin.tsx            -- Admin panel ana ekrani
  admin-etkinlik.tsx   -- Etkinlik yonetimi
  admin-moderasyon.tsx -- Sohbet moderasyonu
  admin-banlar.tsx     -- Ban yonetimi
  admin-kufur.tsx      -- Kufur filtresi yonetimi
  admin-saatler.tsx    -- Muze/saray/cami saat yonetimi (mevsim gecisi dahil)
  admin-ulasim-tarife.tsx -- Havalimani seferleri + bogaz turlari yonetimi
  admin-acil.tsx       -- Acil durum numaralari ve link yonetimi
  modal.tsx            -- Genel modal

app/(tabs)/
  _layout.tsx          -- Tab navigator (5 tab + 4 gizli)
  index.tsx            -- Ana Sayfa (hava, namaz, gemi takvimi, canli durum, ulasim, etkinlikler)
  acil.tsx             -- Acil durum numaralari
  sohbet.tsx           -- Rehber sohbet odasi (realtime, kufur filtreli, screenshot korumalı)
  ara.tsx              -- Arama
  profil.tsx           -- Profil (abonelik durumu gosterir)
  muzeler.tsx          -- Muze detaylari (gizli tab)
  bogaz.tsx            -- Bogaz turlari (gizli tab)
  ulasim.tsx           -- Ulasim detay (gizli tab)
  muzeKart.tsx         -- Muze kart bilgileri (gizli tab)
```

### Hook'lar (hooks/)
```
use-abonelik.ts       -- Abonelik durumu (deneme/aktif/paywall)
use-admin.ts          -- Admin/moderator rol kontrolu
use-canli-durum.ts    -- Canli muze kuyruk bilgileri
use-kufur-filtre.ts   -- Sohbet kufur filtresi
use-tema.ts           -- Light/Dark tema
use-ulasim-bildirim.ts -- Ulasim ariza bildirimleri
use-bildirim-tercihleri.ts -- 5 kategorili bildirim tercih yonetimi (ulasim, saha, etkinlik, sohbet, admin)
use-okunmamis-mesaj.ts -- Sohbet okunmamis mesaj badge takibi (realtime)
use-mekan-saatleri.ts  -- Muze/saray/cami saatleri (Supabase + realtime)
use-bogaz-turlari.ts   -- Bogaz tur tarifeleri (Supabase + realtime)
use-ulasim-tarife.ts   -- Havalimani sefer tarifeleri (Supabase + realtime)
use-acil-rehber.ts     -- Acil durum numaralari ve linkler (Supabase + realtime)
use-gemi-takvimi.ts    -- Galataport gemi takvimi (cruisetimetables.com'dan otomatik cekilir)
use-x-ulasim.ts        -- X (Twitter) API'den ulasim uyarisi cekme ve Supabase'e senkronizasyon
```

### Bilesenler (components/)
```
canli-durum-panel.tsx  -- Muze yogunluk paneli
etkinlikler.tsx        -- Etkinlik bandi
ulasim-uyari.tsx       -- Ulasim uyari bandi
tab-icons.tsx          -- SVG tab ikonlari
```

### Diger
```
lib/supabase.ts        -- Supabase client
lib/config.ts          -- API anahtarlari ve konfigurasyonu (.gitignore'da)
constants/theme.ts     -- Tema sistemi (light+dark, Palette, Typo, Space, Radius)
assets/icons/logo.svg  -- Windrose (pusula) logo
supabase-migration-abonelik.sql  -- Abonelik kolonlari migration'i (UYGULANMIS)
supabase-migration-admin.sql     -- Admin sistemi migration'i (UYGULANMIS)
supabase-migration-canli-durum.sql -- Canli durum migration'i (UYGULANMIS)
supabase-migration-admin-saatler.sql -- Mekan saatleri + bogaz + havalimani + mevsim gecis (UYGULANMIS)
supabase-migration-acil-rehber.sql   -- Acil durum rehberi tablosu + seed data (UYGULANMADI)
supabase-migration-ulasim-uyarilari.sql -- X tweet ulasim uyarilari tablosu (UYGULANMADI)
```

---

## 4. ABONELIK SISTEMI

### Is Mantigi
- Uygulama **UCRETLI** (ucretsiz deneme ile)
- Yeni kayit → 7 gun ucretsiz deneme (kredi karti GEREKMEZ)
- Deneme suresi: `auth.users.created_at + 7 gun` uzerinden hesaplanir
- Deneme bittikten sonra uygulama tamamen KILITLI (paywall)
- Fiyatlar: Aylik 99 TL / Yillik 699 TL (%41 tasarruf)
- Admin/moderator kullanicilar abonelik kontrolunden MUAF

### Akis
```
Yeni Kullanici:
  Kayit Ol → hos-geldin.tsx → deneme-baslat.tsx → /(tabs) [7 gun deneme]

Deneme Biten Kullanici:
  Giris Yap → abone-ol.tsx (paywall, cikis haric hicbir yere gidemez)

Abone Kullanici:
  Giris Yap → /(tabs) [tam erisim]

Admin/Moderator:
  Giris Yap → /(tabs) [tam erisim + admin panel]
```

### Routing Korumasi (_layout.tsx)
- `hos-geldin` ve `deneme-baslat` ekranlari "korumali" — paywall yonlendirmesi bu ekranlardayken CALISMAZ
- `gizlilik-politikasi` ve `kullanim-kosullari` da korumali
- `admin*` ekranlari da korumali
- Oturum yoksa → `initialRouteName='giris'` (ekstra replace YOK)
- Oturum var + giris ekraninda → abonelik durumuna gore yonlendir
- Oturum var + paywall gerekli + paywall'da degil → paywall'a yonlendir

### useAbonelik Hook'u
- Auth state listener ile otomatik yenilenir (register/login sonrasi)
- Default state: `denemeSuresi=true` (hata durumunda kullaniciyi ENGELLEME)
- Profil bulunamazsa (yeni kayit) → deneme aktif say
- Admin/moderator → aktif abonelik say
- `paywallGoster = !yukleniyor && !aktifAbonelik && !denemeSuresi`

### Supabase Profiles Tablosu Abonelik Kolonlari
```sql
abonelik_durumu TEXT DEFAULT 'deneme' CHECK ('deneme','aktif','iptal','suresi_dolmus')
abonelik_bitis  TIMESTAMPTZ
abonelik_plani  TEXT CHECK ('aylik','yillik')
revenuecat_id   TEXT
```

---

## 5. TASARIM KURALLARI (COK ONEMLI)

- **EMOJI YOK** — Hicbir ekranda emoji kullanilmayacak. "Sevmiyorum emoji, kullanma" (kullanici talimat)
- **Kendi logosu kullanilacak** — `assets/icons/logo.svg` (windrose pusula), beyaz arkaplanda `tintColor="#0077B6"`
- **Ozellik kartlarinda ikon YOK** — Sadece tipografi ve spacing ile hiyerarsi
- **Ozellik kartlarinda sol mavi accent bar** (4px genislik, Palette.istanbulMavi)
- **Sticky footer pattern** — CTA butonlari ekranin altinda sabit
- **LinearGradient** header ve butonlarda: `['#005A8D', '#0077B6', '#0096C7']`
- **Poppins font ailesi** tuam ekranlarda explicit kullanilir (fontFamily)

---

## 6. GIRIS EKRANI (giris.tsx) DETAYLARI

- Logo: `expo-image` ile `tintColor="#0077B6"` (beyaz arkaplan icin mavi)
- Giriş/Kayıt tab'ları (sekme sistemi)
- Kayit formunda: Isim, Soyisim, TUREB Ruhsat No, Email, Sifre, **Sifre Tekrar** (dogrulama var)
- Sifre min 6 karakter, "Sifreler eslesmiyorsa" hata mesaji
- "Misafir olarak devam" **KALDIRILDI** (uygulama ucretli)
- Basarili kayit → `router.replace('/hos-geldin')`
- Sifremi unuttum: `supabase.auth.resetPasswordForEmail`

---

## 7. 3 OZEL EKRAN DETAYLARI

### EKRAN 1: hos-geldin.tsx (Onboarding)
- Gradient header ile logo ve "Pusula Istanbul'a Hos Geldiniz!"
- Alt metin: "Profesyonel turist rehberlerinin dijital yol arkadasi."
- 5 ozellik karti (sadece tipografi, ikon yok, sol mavi accent bar):
  1. Canli Saha Durumu — Muzelerdeki anlik kuyruk ve yogunluk bilgileri
  2. Lojistik & Ulasim — Vapur, metro, tramvay ve Galataport kruvaziyer takvimi
  3. Rehber Sohbeti — Meslektaslarinizla anlik iletisim ve saha guncellemeleri
  4. Kent Etkinlikleri — Kapanan yollar, mitingler ve guzergah degisiklikleri
  5. Kritik Bilgiler — Acil durum numaralari ve muze iletisim hatlari
- Sticky footer: "Kesfetmeye Basla" butonu → `/deneme-baslat`

### EKRAN 2: deneme-baslat.tsx (Deneme Baslat)
- Gradient ust alan ile logo ve "Pusula Istanbul"
- Yesil gradient kart (#059669 → #10B981): "7 Gun Ucretsiz Deneme"
- "Kredi karti gerekmez, aninda kullanmaya baslayin."
- Alt bilgi: "Deneme suresi boyunca hicbir ozellik kisitlamasi yoktur."
- Sticky footer: Yesil "7 Gunluk Ucretsiz Denememi Baslat" butonu → `/(tabs)`
- Yasal not: "Devam ederek Kullanim Kosullarini ve Gizlilik Politikasini kabul etmis olursunuz."

### EKRAN 3: abone-ol.tsx (Paywall)
- Gradient header ile logo
- Baslik: "Profesyonel Pusulanizi Kesintisiz Kullanin"
- Alt baslik: "7 gunluk ucretsiz kesfif sureniz sona erdi..."
- 2 plan karti yan yana:
  - Aylik: 99 TL/ay (standart beyaz kart, radio button)
  - Avantajli Yillik: 699 TL/yil = 58,25 TL/ay (%41 tasarruf badge, seciliyken LinearGradient kart)
- Yillik plan default secili
- Guven metni: "Sadece 7 gunluk ucretsiz sureniz bittikten sonra karar verirsiniz."
- Sticky footer: "Pusulami Aktiflestir" butonu
- Gizlilik Politikasi | Kullanim Kosullari linkleri
- Cikis Yap (Alert confirmation ile)
- TODO: RevenueCat entegrasyonu (simdilik Alert gosteriyor)

---

## 8. ADMIN SISTEMI

- `profiles.rol`: 'admin', 'moderator', 'user'
- `useAdmin` hook'u: isAdmin, isMod, isYetkili
- Admin panel butonu profil ekraninda sadece yetkililere gorunur
- Admin ekranlari: etkinlik yonetimi, sohbet moderasyonu, ban yonetimi, kufur filtresi
- Admin/moderator abonelik kontrolunden muaf

### Moderator Sistemi
- Admin panelden email ile moderator atama/kaldirma (admin.tsx)
- Moderator yetkileri (sinirli erisim):
  - Etkinlik yonetimi (admin-etkinlik.tsx — tam erisim)
  - Sultanahmet Camii saat girisi (admin-saatler.tsx — sadece Sultanahmet karti ve modali)
  - Saha durumu bildirim (canli-durum-panel — tum kullanicilar gibi)
- Moderator GOREMEZ: Sohbet moderasyonu, ban yonetimi, kufur listesi, mevsim gecisi, mekan listesi/ekleme/duzenleme, ulasim tarifeleri, acil durum rehberi
- admin-saatler.tsx'de mevsim gecis butonlari, kategori sekmeleri, mekan listesi ve duzenleme modali `{isAdmin && (...)}` ile sarili

---

## 9. SOHBET SISTEMI

- Realtime mesajlasma (Supabase Realtime subscription)
- Kufur filtresi (veritabanindan yuklenir, hook ile)
- Screenshot korunmasi (expo-screen-capture)
- Mesaj raporlama
- Admin moderasyon paneli

---

## 10. ANA SAYFA ICERIKLERI (index.tsx)

- Hava durumu (API'den)
- Namaz vakitleri (Aladhan API)
- Galataport gemi takvimi (cruisetimetables.com'dan otomatik cekilir, useGemiTakvimi hook'u)
- Canli muze kuyruk durumu (canli-durum-panel component)
- Ulasim uyari bandi
- Etkinlikler bandi
- Grid ikonlar: Muzeler, Bogaz Turlari, Ulasim, MuzeKart vb.

---

## 11. TAMAMLANAN ISLER

- [x] Temel uygulama yapisi (tabs, navigation, tema)
- [x] Supabase entegrasyonu (auth, profiles, realtime)
- [x] Muze canli durum sistemi
- [x] Rehber sohbet odasi (realtime + kufur filtre + screenshot koruma)
- [x] Admin panel (etkinlik, moderasyon, ban, kufur yonetimi)
- [x] Ulasim bildirim sistemi
- [x] Abonelik altyapisi (Supabase migration uygulanmis)
- [x] useAbonelik hook'u (auth state listener, race condition fix)
- [x] Onboarding akisi (3 ekran: hos-geldin, deneme-baslat, abone-ol)
- [x] Giris ekrani: logo degisikligi, sifre tekrar, misafir girisi kaldirildi
- [x] KVKK gizlilik politikasi ve kullanim kosullari ekranlari
- [x] _layout.tsx routing korumasi (deneme-baslat dahil)
- [x] Profil ekraninda abonelik durumu gosterimi
- [x] Emoji temizligi (tum ekranlardan kaldirildi)
- [x] Logo degisikligi (kendi windrose logosu, mavi tint beyaz arkaplanda)
- [x] Admin mekan saatleri sistemi (muze/saray/cami — Supabase tablosu + admin ekrani)
- [x] Admin ulasim tarife sistemi (havalimani seferleri + bogaz turlari — Supabase + admin ekrani)
- [x] Mevsim gecis sistemi (yaz/kis toplu saat gecisi — tek tusla)
- [x] useMekanSaatleri, useBogazTurlari, useUlasimTarife hook'lari (realtime)
- [x] 32 muze/saray + Sultanahmet Camii + 3 bogaz sirketi + 6 havalimani duragi seed data olarak hazir
- [x] Bildirim tercihleri sistemi (5 kategori: ulasim, saha durumu, etkinlikler, sohbet, admin)
- [x] Sohbet okunmamis mesaj badge'i (kirmizi nokta, realtime)
- [x] Expo web destegi (react-dom, react-native-web, platform-uyumlu storage)
- [x] Admin panelden yeni mekan/muze/saray/cami ekleme
- [x] Admin panelden yeni havalimani guzergahi ve bogaz turu ekleme
- [x] Acil durum sayfasi dinamik Supabase verisi + admin yonetim ekrani
- [x] Acil durum rehberine yeni numara, kurum ve link ekleme/duzenleme/silme
- [x] Galataport gemi takvimi dinamik (cruisetimetables.com'dan otomatik cekilir, hardcoded veri kaldirildi)
- [x] Arama sayfasi (ara.tsx) tamamen dinamik — Supabase hook'larindan otomatik index olusturur
- [x] MuzeKart sayfasi dinamik — mekan_saatleri'ndeki muzekart alanindan gecen/gecmeyen filtresi
- [x] X (Twitter) API entegrasyonu — 3 ulasim hesabindan otomatik tweet cekme ve filtreleme
- [x] ulasim_uyarilari tablosu ve senkronizasyon hook'u (use-x-ulasim.ts)
- [x] Hat tespiti (M1-M14, T1-T5, F1-F4, TF1-TF2, Marmaray) ve tip tespiti (ariza/kesinti/gecikme/bilgi/duyuru)
- [x] Cozuldu tespiti — "normale donmustur" tweet'i gelince ilgili hattaki uyarilar otomatik kapatilir
- [x] Moderator atama sistemi — admin panelden email ile moderator ata/kaldir (admin.tsx)
- [x] Moderator yetki kisitlamasi — admin-saatler.tsx'de mevsim gecis, kategori, mekan listesi ve duzenleme sadece admin'e acik
- [x] Galataport gemi takvimi Supabase'e tasindi (brotli sorunu cozuldu, haftalik gorunum eklendi)
- [x] Kapsamli Turkce karakter duzeltmesi (ara.tsx, admin.tsx, index.tsx, acil.tsx, muzeKart.tsx, profil.tsx)
- [x] Header gradient tutarliligi (sohbet dahil tum sekmeler ayni gradient)
- [x] Profil hakkinda metni guncellendi (Gelistirici: Ayse Tokkus Bayar)
- [x] Birlesik bildirim sistemi (use-bildirimler.ts) — 5 kategori tek hook'ta: ulasim, saha durumu, etkinlikler, sohbet, sistem
- [x] Bildirim tercihleri senkronizasyonu (in-memory listener ile coklu hook instance destegi)
- [x] EAS Build yapilandirmasi (app.json + eas.json hazir — development/preview/production profilleri)
- [x] Store yayin rehberi dokumani (STORE-YAYIN-REHBERI.md)
- [x] Android development build basarili (EAS Build — Samsung S22 + tablet test edildi)
- [x] Custom config plugin: plugins/fix-buildconfig.js (package declaration mismatch fix)
- [x] Sohbet realtime iki yonlu calisiyor (polling yedegi + Supabase Realtime)
- [x] sohbet_mesajlari Supabase Realtime publication'a eklendi
- [x] supabase-migration-acil-rehber.sql UYGULANMIS (12 kayit seed data)
- [x] supabase-migration-ulasim-uyarilari.sql UYGULANMIS (tablo + RLS + Realtime)

---

## 12. BEKLEYEN GOREVLER (SIRADAKI)

### Yuksek Oncelik — Store Yayini
1. **Store gelistirici hesaplari** — Google Play Console ($25) + Apple Developer ($99/yil)
2. **RevenueCat entegrasyonu** — Gercek abonelik odeme islemleri (development build GEREKLI)
3. **Store listing materyalleri** — Ekran goruntuleri, aciklamalar, featured graphic, 1024x1024 ikon
4. **Gizlilik politikasi web sayfasi** — Store review icin erislebilir URL gerekli
5. **Preview/production build** — Standalone APK/AAB (dev server gerektirmeyen)

### Orta Oncelik
6. **Splash screen ozellestirme** — Development build'de kendi splash'ini kullan
7. **Farkli cihaz/ekran boyutu testleri**
8. **Dark mode tam uyumluluk kontrolu** (3 ozel ekran simdilik light tema)

### Dusuk Oncelik
9. **Performans optimizasyonu**
10. **Circular dependency fix** (components/ulasim-uyari.tsx <-> hooks/use-x-ulasim.ts)

---

## 13. BILINEN SORUNLAR & COZUMLERI

### Cozulmus Sorunlar
1. **Paywall race condition**: Yeni kayit olan kullaniciya paywall gosteriliyordu → useAbonelik'e auth state listener eklendi
2. **Console error "REPLACE giris not handled"**: `router.replace('/giris')` navigator hazir olmadan cagiriliyordu → Gereksiz replace kaldirildi, initialRouteName kullanildi
3. **Foreign key constraint (kullanici silme)**: `sohbet_mesajlari` referansi → Sirasiyla sohbet_mesajlari > profiles > auth.users silinmeli
4. **SQL migration syntax error**: Dosya adi yapistirilmis icerik yerine → Gercek SQL kodu verildi
5. **EAS Build BuildConfig hatasi**: expo prebuild package declaration mismatch → plugins/fix-buildconfig.js config plugin ile cozuldu
6. **Sohbet realtime tek yonlu**: Supabase Realtime event aliyor ama FlatList guncellenmiyor → setTimeout + setGuncelSayac + extraData + 5sn polling yedegi ile cozuldu
7. **sohbet_mesajlari Realtime yok**: Tablo supabase_realtime publication'da degil → ALTER PUBLICATION ile eklendi

### Dikkat Edilecekler
- Expo Go'da SVG `tintColor` calisiyor (expo-image ile)
- `react-native-svg-transformer` yuklenmis ama metro.config.js gerekebilir
- Supabase email confirmation KAPALI (test kolayligi icin)
- 3 ozel ekran (hos-geldin, deneme-baslat, abone-ol) simdilik sadece LIGHT tema
- Node 20 GEREKLI (v24 uyumsuz) — `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"`
- Development build icin Metro gerekli: `npx expo start --dev-client`
- app.json: newArchEnabled: true (reanimated 4.x zorunlu), reactCompiler KALDIRILDI
- expo-screen-capture plugins'den CIKARILDI (plugin.js yok)

---

## 14. KULLANICI TERCIHLERI

- Emoji KULLANMA (kesinlikle)
- Turkce arayuz (tum metinler Turkce)
- Bilimsel/kanitli bilgi odakli
- Ateist, bilime inanir
- Cesaret verici ton, konuskan ve hossohbet
- Pratik ve hemen konuya giren yaklasim
- Ilgi alanlari: Tarihi Istanbul'da sokak yasami, sosyal hayat, ticaret, uretim, emek gucu

---

## 15. ONEMLI NOTLAR

- Uygulama adi: **Pusula Istanbul** (store'da boyle gorunecek)
- Package name: `pusula-istanbul`
- Bundle ID (iOS + Android): `com.pusulaistanbul.app`
- Scheme: `pusulaistanbul`
- Version: 1.0.0
- app.json'da newArchEnabled: true
- typedRoutes experiment aktif (reactCompiler kaldirildi)
- Ana Sayfa'daki namaz vakitleri sadece rehberlerin turlarini planlamasi icin (kullanici ateist, ama musteriler icin bilgi gerekli)
- EAS Build yapilandirmasi hazir (eas.json: development/preview/production profilleri)
- Store yayin rehberi: `STORE-YAYIN-REHBERI.md`
- Gelistirici: Ayse Tokkus Bayar (ayse.tokkus@gmail.com)
