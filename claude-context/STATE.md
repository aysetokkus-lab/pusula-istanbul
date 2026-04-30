# Pusula Istanbul - Mevcut Durum

Son guncelleme: **28 Nisan 2026**

Bu dosya HER SURUM degisikliginde guncellenmeli. Yeni oturumda Claude buraya bakar, "su an ne yapiyoruz" anlar.

---

## SU ANKI SURUM DURUMU

| Platform | Surum | Durum |
|----------|-------|-------|
| iOS App Store | **v1.0.8** | YAYINDA (sifre sifirlama bug'i HALA VAR — fix tutmadi) |
| iOS App Review | **v1.0.9** | Bekliyor (~24-48 saat) — Manual release secildi |
| Android Play Production | v1.0.8 | onaylandi ama YAYINLANMADI — v1.0.9 ile degistirilecek |
| Android Play Production | **v1.0.9** | Inceleme'de (3-7 gun) |
| Android Play Alpha | **v1.0.9** | YAYINDA — Ayse tester olarak telefonuna kurdu, fix DOGRULANDI |

### Build Numaralari
- **v1.0.9:** version 1.0.9, iOS buildNumber 24, Android versionCode 25 (EAS auto-bump 26 olarak gitti)

### Onaylanmamis Eski Sorun
- v1.0.8'de tespit edilen kritik bug (yayindaki surum): ayse.tokkus@gmail icin sifre sifirlama maili gelse de "Yeni Sifre Belirle" ekrani acilmiyor, kullanici dogrudan login olup ana ekrana atiliyor. v1.0.9'da Pending Pattern ile cozuldu (bkz. DECISIONS.md).

---

## SON OTURUMDA NE YAPILDI (28 Nisan 2026)

- v1.0.9 fix Alpha'da DOGRULANDI: Ayse v1.0.9'u tester olarak telefonuna kurdu, sifre sifirlama akisi sorunsuz calistigini bizzat dogruladi. Stack mount race fix tuttu.
- v1.0.9 iOS App Store Connect'e submit edildi, Apple Review'da bekliyor
- v1.0.9 Android Production'a submit edildi, Turkiye eklemesi inceleme'de
- v1.0.8 Production "yayinlanmadi" durumunda kaldi — v1.0.9 ile degistirilecek
- "Yonetilen yayinlanma" acik (Apple manual release pattern'in Android karsiligi)

### Henuz lansman YOK
Urgency dusuk — kalici fix odakli ilerliyoruz. Ayse marka emegini koruyor, hatasiz cikis tercihi.

---

## AKTIF/BEKLEYEN GOREVLER

### EN YUKSEK ONCELIK
1. **v1.0.9 Apple Review onayini bekle** (~24-48 saat) — Manual release secildi, onay gelince Ayse "Release" basacak
2. **v1.0.9 Google Play Production onayini bekle** (3-7 gun) — Turkiye eklemesi sonra release
3. **v1.0.8 Production'i v1.0.9 ile degistirme** — onay gelince Ayse "Yayinla" basacak

### YUKSEK ONCELIK — MEVSIM GECISI (1 Mayis 2026)
1 Mayis'ta muzeleri yaz saatine gecir:
```sql
UPDATE mekan_saatleri SET aktif_mevsim = 'yaz', guncelleme_tarihi = NOW()
WHERE mevsimsel = true AND tip NOT IN ('saray', 'kasir');
```
NOT: Saraylar zaten 12 Nisan'da yaz saatine gecirildi.

### v1.1.0 PLANLANAN OZELLIKLER
1. **Push Notification altyapisi** — Uygulama kapaliyken bildirim. Cihaz token (`expo-notifications.getExpoPushTokenAsync`) → Supabase → Edge Function → APNs/FCM. ~2-3 gun is.
2. **Ana ekran widget** — Sultanahmet Camii saatleri + ulasim uyarilari. `react-native-android-widget` + `expo-apple-targets`.
3. **X API senkronizasyonunu scheduled task'a tasi** — Su an `_layout.tsx` global timer SADECE app aciksa calisir. Sehir Hatlari pattern ile (`x-ulasim-takip` scheduled task) merkezi cozume tasinmali. **Avantajlar:** (a) telefon kapali olsa bile devam, (b) X API maliyet azalir, (c) "anlik veri" hedefi karsilanir. 28 Nisan 12:30-12:40 arasi 10 dk "boslukta" sinirlama gozlendi. Yapilis: Sehir Hatlari skill'inden kopyala, ~1 saat.
4. **Sehir Hatlari/Saraylar fiyat tablosu scrape** — JS-rendered, browser otomasyonu gerekir (Firecrawl `browser_create+interact` veya Claude in Chrome).

### ORTA ONCELIK
- Farkli cihaz/ekran boyutu testleri
- Play Store fotograf/video izni temizligi — `READ_MEDIA_IMAGES` izni gereksiz, sonraki build'de kaldirilmali
- Bos Pusula-Alpha kapali test kanalini sil — karisiklik olmamasi icin
- Eksik Havabus rotalari DB'ye ekle: Yenisahra (270TL, ~45dk), Sakarya (500TL, ~95dk)
- Galata Mevlevihanesi muze.gov.tr URL'i — GMM01 redirect Gumushane'ye, dogru SectionId arastirilmali

### DUSUK ONCELIK
- Performans optimizasyonu
- Circular dependency fix (`components/ulasim-uyari.tsx` <-> `hooks/use-x-ulasim.ts`)
- Eski rapor dosyalarini temizle (`muze-guncelleme-raporu-*.txt`, `haftalik-tarife-raporu-*.md`, `rapor-saraylar-*.md`)
- RevenueCat Dashboard kontrolu (opsiyonel) — RC user ID mismatch, entitlement bagi, S2S Notifications

---

## STORE YAYIN DURUMU

### Google Play Console
- **Hesap:** Aktif ($25 odendi)
- **Production:** v1.0.9 inceleme'de (sürüm kodu 26, 28 Nisan 2026)
- **Kapali test (Alpha):** v1.0.9 yayinda, 12 test kullanicisi
- **Play Store linki:** https://play.google.com/store/apps/details?id=com.pusulaistanbul.app
- **License testing:** Dahili Test listesi (ayse.tokkus@gmail.com + aysetokkusbayar@gmail.com), RESPOND_NORMALLY
- **Kapali test 14 gun bekleme:** 12 Nisan'dan 27 Nisan'a kadar surdu — TAMAMLANDI
- **Service Account:** revenuecat@pusula-istanbul.iam.gserviceaccount.com (Admin izinleri)
- **Yonetilen yayinlanma:** ACIK (manuel onay gerekli)
- **Uygulama kategorisi:** Araclar (Tools)
- **Abonelikler:** com.pusulaistanbul.app.aylik + com.pusulaistanbul.app.yillik (her ikisi Etkin)
- **Uygulama icerigi beyanlari:** 11/11 tamamlandi
- **IARC:** 12+ (sohbet ozelligi)

### Apple App Store Connect
- **Apple Developer:** Aktif (Team ID: 7UJVL94SMJ, Provider ID: 128724610)
- **App Store Connect App ID:** 6761419678
- **iOS IPA:** v1.0.9 build 24 (EAS auto-bump muhtemelen 25)
- **App Store:** v1.0.8 YAYINDA (sifre sifirlama bug'i ile birlikte — v1.0.7 felaketi nedeniyle Manual release zorunlu hale geldi)
- **Onceki reject sayisi:** 6 (v1.0 / v1.0.1 / v1.0.2 / v1.0.3 / v1.0.4 — bkz. CHANGELOG.md)
- **Demo hesaplar (Supabase'de ayarli):**
  - demo.test@pusulaistanbul.app / 123456 — suresi dolmus abonelik (ucretsiz katman test)
  - aysetokkus@hotmail.com / 123456 — aktif abonelik (premium test, 2027'ye kadar)
- **Subscription Group:** "Pusula Istanbul Premium" — Turkish lokalizasyon eklendi
- **EULA:** Custom License Agreement (Turkce + Ingilizce)
- **Manual release:** v1.0.7'den itibaren ZORUNLU (otomatik release felaketi yasandi)

### RevenueCat
- **Proje:** Pusula Istanbul
- **Entitlement:** "pro" — tum urunler bagli
- **Offering:** "default" — Monthly ($rc_monthly) + Yearly ($rc_annual) + Lifetime ($rc_lifetime)
- **Products:**
  - App Store: Aylik + Yillik
  - Play Store: aylik:aylik + yillik:yillik
  - Test Store: Monthly + Yearly + Lifetime

### Web Sayfasi (pusulaistanbul.app)
- GitHub Pages aktif, custom domain baglandi (GoDaddy DNS → A kayitlari + CNAME)
- Kaynak: `docs/index.html` (landing + gizlilik + kullanim)
- Ek: `docs/CNAME`, `docs/logo-icon.png`, `docs/ss-1.png ~ ss-5.png`, `docs/dogrulandi.html`, `docs/musteri-rehber-sozlesmesi.docx`, `docs/acente-hizmet-sozlesmesi.docx`
- Sayfa sirasi: Hero > Screenshots > Features > Premium > Legal > Footer

### Email Altyapisi (Custom SMTP)
- Resend Pro $20/ay + Supabase Pro $25/ay = $45/ay
- 5 Turkce HTML template tamamen markali
- Bkz. INFRASTRUCTURE.md

---

## OPERASYONEL NOTLAR

- **X API kredisi:** 27 Nisan 12:33'te tukenmisti, kredi yenilendi + **otomatik odeme aktif** — bir daha kesinti yok
- **Paid Apps Agreement:** Active (5 Nis 2026 - 31 Mar 2027)
- **W-8BEN:** Active (Turkey, Article 12(2), %10 withholding)
- **U.S. Certificate of Foreign Status:** Active
- **Bank Account:** Active

---

## SU AN ICEYI BAKARKEN BAKMAN GEREKEN DOSYALAR

- **Yeni feature/bug uzerinde calisirken:** PROJECT.md (mimari) + ISSUES.md (benzer sorun var mi?)
- **Sifre sifirlama / deep link / auth flow:** DECISIONS.md "Pending Pattern" + ISSUES.md #56-#62
- **Yeni surum cikarirken:** CHANGELOG.md (eski release notes formati) + INFRASTRUCTURE.md (EAS env, store ayarlari)
- **Email template / SMTP / DNS:** INFRASTRUCTURE.md "Email Altyapisi"
- **Supabase RLS / SQL pattern:** PROJECT.md + DECISIONS.md "RLS Sessiz Reddedebilir"
