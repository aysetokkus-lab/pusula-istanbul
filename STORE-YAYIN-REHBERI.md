# Pusula Istanbul — Store Yayin Rehberi

Bu rehber, uygulamayi App Store ve Google Play'de yayinlamak icin gereken tum adimlari kapsar.
Her adimdaki komutlari kendi bilgisayarinda (VS Code terminali veya normal terminal) calistir.

---

## ADIM 0: On Gereksinimler

Bilgisayarinda sunlar kurulu olmali:

```bash
# Node.js (v18+) kontrol
node --version

# Expo CLI (global)
npm install -g expo-cli

# EAS CLI (global) — build ve submit islemleri icin
npm install -g eas-cli

# EAS CLI versiyon kontrol
eas --version
```

---

## ADIM 1: Expo Hesabi

1. https://expo.dev adresinde hesap olustur (veya mevcut hesabinla giris yap)
2. Terminalde giris yap:

```bash
eas login
# Email: ayse.tokkus@gmail.com
# Sifre: Expo hesap sifren
```

3. Projeyi Expo'ya bagla:

```bash
cd pusula-istanbul
eas init
```

Bu komut sana bir **Project ID** verecek. Bu ID'yi `app.json` icindeki iki yere yapistir:
- `expo.extra.eas.projectId`
- `expo.updates.url` (sonundaki `BURAYA_EAS_PROJECT_ID_GELECEK` kismini degistir)

---

## ADIM 2: Ilk Development Build (Android)

Samsung S22'nde test etmek icin development build:

```bash
# Development APK olustur (Expo sunucularinda build edilir)
eas build --platform android --profile development
```

Build tamamlaninca sana bir APK indirme linki verecek.
Samsung S22'ne yukle ve test et. Artik Expo Go DEGIL, kendi uygulamani kullaniyorsun.

Not: Ilk build biraz uzun surer (10-20 dk). Sonrakiler daha hizli.

---

## ADIM 3: iOS Development Build (Opsiyonel)

iOS build icin **Apple Developer Account** ($99/yil) gerekli.
Hesabin varsa:

```bash
eas build --platform ios --profile development
```

EAS senden Apple ID ve sifre isteyecek. Provisioning profile ve sertifikalari otomatik olusturur.

---

## ADIM 4: Test Et, Sorunlari Gider

Development build'de kontrol listesi:

- [ ] Kayit / giris calisiyor mu?
- [ ] 3 onboarding ekrani (hos-geldin, deneme-baslat, abone-ol) dogru gorunuyor mu?
- [ ] Tab navigation calisiyor mu?
- [ ] Sohbet realtime calisiyor mu?
- [ ] Push bildirimler geliyor mu? (Development build'de artik calismali!)
- [ ] Muze saatleri, bogaz turlari, ulasim tarifeleri yukleniyor mu?
- [ ] Doviz cevirici calisiyor mu?
- [ ] Gemi takvimi geliyor mu?
- [ ] Admin paneli calisiyor mu?
- [ ] Profil ekrani, bildirim ayarlari calisiyor mu?

---

## ADIM 5: Store Gelistirici Hesaplari

### Google Play Console
1. https://play.google.com/console adresine git
2. Gelistirici hesabi olustur — **$25 tek seferlik** ucret
3. "Uygulama olustur" tikla:
   - Uygulama adi: **Pusula Istanbul**
   - Varsayilan dil: Turkce
   - Uygulama tipi: Uygulama
   - Ucretsiz/Ucretli: Ucretli (veya ucretsiz + uygulama ici satin alma)

### Apple Developer Program
1. https://developer.apple.com adresine git
2. Apple Developer Program'a katil — **$99/yil**
3. Onay sureci 24-48 saat surebilir
4. Onaylandiktan sonra App Store Connect'e giris yap
5. "My Apps" > "+" > "New App":
   - Platform: iOS
   - Name: Pusula Istanbul
   - Primary Language: Turkish
   - Bundle ID: com.pusulaistanbul.app
   - SKU: pusula-istanbul-v1

---

## ADIM 6: Store Listing Materyalleri

### Ekran Goruntuleri (Zorunlu)

**Android (Google Play):**
- En az 2, en fazla 8 ekran goruntusu
- Boyut: 1080x1920 px (veya 16:9 oran)
- Tavsiye: Ana Sayfa, Muzeler, Sohbet, Profil, Acil Durum

**iOS (App Store):**
- 6.7" (iPhone 15 Pro Max): 1290x2796 px — zorunlu
- 6.5" (iPhone 14 Plus): 1284x2778 px — tavsiye
- 5.5" (iPhone 8 Plus): 1242x2208 px — opsiyonel
- iPad: 2048x2732 px — tablet destegi varsa

### Uygulama Ikonu
- 1024x1024 px PNG (seffaf arkaplan YOK, alpha kanali YOK)
- Mevcut `assets/images/icon.png` dosyasini kontrol et

### Feature Graphic (Google Play)
- 1024x500 px
- Marka renginde arka plan + logo + kisa slogan

### Uygulama Aciklamasi

**Kisa aciklama (Google Play — maks 80 karakter):**
```
Istanbul'daki profesyonel turist rehberleri icin canli saha bilgi uygulamasi
```

**Uzun aciklama (Her iki store):**
```
Pusula Istanbul, Istanbul'daki profesyonel turist rehberleri icin tasarlanmis
kapsamli bir saha bilgi uygulamasidir.

Ozellikler:
- Muze, saray ve cami guncel acilis/kapanis saatleri
- Metro, tramvay ve Marmaray anlik ariza ve gecikme duyurulari
- Havaist ve Havabus sefer saatleri
- Galataport kruvaziyer gemi takvimi
- Doviz kuru cevirici
- Rehberler arasi ozel sohbet odasi
- Kent etkinlikleri ve guzergah degisiklikleri
- Acil durum numaralari ve nobetci eczane
- Muzekart gecerlilik bilgileri ve satis noktalari
- Namaz vakitleri ve canli hava durumu

7 gun ucretsiz deneme ile hemen baslayabilirsiniz.
Aylik 99 TL veya yillik 699 TL (%41 tasarruf).
```

---

## ADIM 7: RevenueCat Entegrasyonu (Odeme)

Gercek odeme almak icin RevenueCat kullanacagiz. Development build SART.

### 7a. RevenueCat Hesabi
1. https://www.revenuecat.com adresinde ucretsiz hesap olustur
2. Yeni proje olustur: "Pusula Istanbul"
3. Google Play ve App Store baglantilarini ekle

### 7b. Google Play Baglantisi
1. Google Play Console > API Erisimi > Hizmet Hesabi olustur
2. JSON anahtar dosyasini indir
3. RevenueCat'e yukle

### 7c. App Store Baglantisi
1. App Store Connect > Shared Secret al
2. RevenueCat'e gir

### 7d. Urunleri Tanimla (Her iki store'da)

**Google Play Console > Abonelikler:**
- `pusula_aylik` — 99 TL/ay
- `pusula_yillik` — 699 TL/yil

**App Store Connect > Subscriptions:**
- Subscription Group: "Pusula Abonelik"
- `pusula_aylik` — 99 TL/ay
- `pusula_yillik` — 699 TL/yil

### 7e. RevenueCat'te Offerings
1. Entitlements > "pro" olustur
2. Products > Store urunlerini ekle (aylik + yillik)
3. Offerings > "default" olustur > 2 paketi ekle

### 7f. Kod Entegrasyonu

```bash
# Kurulum
npx expo install react-native-purchases
```

Sonra `hooks/use-abonelik.ts` dosyasini RevenueCat ile guncelleyecegiz.
(Bu adimi birlikte yapabiliriz — kodlama gerekli.)

---

## ADIM 8: Production Build

Her sey test edilip hazirlansa:

```bash
# Android (AAB — Google Play icin)
eas build --platform android --profile production

# iOS (IPA — App Store icin)
eas build --platform ios --profile production
```

---

## ADIM 9: Store'a Gonder

### Otomatik (EAS Submit ile)

```bash
# Google Play'e gonder (internal test track)
eas submit --platform android --profile production

# App Store'a gonder
eas submit --platform ios --profile production
```

### Manuel
- **Google Play:** AAB dosyasini Console'a yukle > Internal Testing > Review'a gonder
- **App Store:** IPA'yi App Store Connect'e yukle > TestFlight > Review'a gonder

---

## ADIM 10: Review Sureci

**Google Play:**
- Ilk inceleme: 3-7 gun
- Guncelleme incelemeleri: 1-3 gun
- Yas siniri (IARC): Tum yaslar

**App Store:**
- Ilk inceleme: 1-3 gun (bazen 7 gun)
- Guncelleme incelemeleri: 1-2 gun
- Red nedenleri: Eksik privacy policy, calismayan ozellikler, yaniltici aciklama
- Privacy Policy URL'i zorunlu (gizlilik-politikasi ekranindaki icerigi bir web sayfasina da koy)

---

## ONEMLI HATIRLATMALAR

1. **Supabase Migration**: `supabase-migration-acil-rehber.sql` ve `supabase-migration-ulasim-uyarilari.sql` henuz UYGULANMADI — production'a gecmeden once uygula

2. **API Anahtarlari**: `lib/config.ts` dosyasindaki anahtarlari kontrol et. Production icin ayri anahtarlar kullanmayi dusun.

3. **Gizlilik Politikasi URL**: App Store ve Google Play icin web'de erisebilir bir gizlilik politikasi sayfasi gerekli. Mevcut `gizlilik-politikasi.tsx` icerigini bir web sayfasina da koy.

4. **Destek E-postasi**: Store listing'de bir destek e-postasi gerekli (ayse.tokkus@gmail.com)

5. **app.json owner**: `"owner": "aysetokkus"` — Expo hesap kullanici adini buraya yaz (degisebilir)

---

## TAHMINI BUTCE

| Kalem | Ucret |
|-------|-------|
| Google Play Console | $25 (tek sefer) |
| Apple Developer Program | $99/yil |
| Expo EAS Build (ucretsiz plan) | $0 (ayda 30 build) |
| RevenueCat (ucretsiz plan) | $0 (aylik $2500 gelire kadar) |
| Supabase (ucretsiz plan) | $0 (500MB veritabani) |
| **Toplam baslangic** | **~$124 (~4.000 TL)** |

---

## SIRADAKI ADIMLAR (ONCELIK SIRASI)

1. `eas login` + `eas init` — Projeyi Expo'ya bagla
2. `eas build --platform android --profile development` — Ilk dev build
3. Samsung S22'de test et (push bildirimler dahil)
4. Google Play Console hesabi ac ($25)
5. Apple Developer Program'a katil ($99/yil)
6. RevenueCat entegrasyonu (birlikte kodlayacagiz)
7. Store listing materyallerini hazirla
8. Production build + submit
9. Review sonucunu bekle
10. LANSMAN!
