# Pusula Istanbul - Mevcut Durum

Son guncelleme: **30 Nisan 2026**

Bu dosya HER SURUM degisikliginde guncellenmeli. Yeni oturumda Claude buraya bakar, "su an ne yapiyoruz" anlar.

---

## SU ANKI SURUM DURUMU

| Platform | Surum | Durum |
|----------|-------|-------|
| iOS App Store | **v1.0.9** | YAYINDA (warm-start sifre sifirlama bug'i hala mevcut) |
| iOS Apple Review | **v1.0.10** | Inceleme'de (~24-48 saat) — Manual release secildi |
| Android Play Production | v1.0.8 | Yayinda (eski) |
| Android Play Production | **v1.0.10** | Inceleme'de (3-7 gun) — v1.0.9 atlandi (Devre disi) |
| Android Play Alpha | **v1.0.9** | Yayinda (12 test kullanicisi) |

### Build Numaralari
- **v1.0.10:** version 1.0.10, iOS buildNumber 27, Android versionCode 28

### Cozulen Bug (v1.0.10 fix)
v1.0.9'da Pending Pattern eklenmisti AMA sadece cold-start'i cozmustu — warm-start (app arka planda iken mailden link tiklanmasi) hala bug'liydi. App ana ekrana acilip recovery session kuruluyordu ama `/sifre-sifirla` ekranina yonlendirme yapilmiyordu. Sebep: Expo Router'in route group escape sirasinda state batching ile race girmesi. **Fix: Pending Pattern useEffect'ine + PASSWORD_RECOVERY event handler'ina 150ms setTimeout defer eklendi** (bkz. DECISIONS.md "Pending Pattern" guncellenmis hali ve `_layout.tsx` line ~146 ve ~213).

### v1.0.10 Test Sonuclari (30 Nisan 2026)
- iOS: TestFlight'a yuklendi, Mac'te "Designed for iPad" olarak test edildi (iPhone7 iOS 15.8'de TestFlight calismadigi icin Mac M1 alternatif kullanildi). Sifre sifirlama akisi BASTAN SONA dogrulandi: email gonder → mail link → app acildi → /sifre-sifirla ekrani geldi → yeni sifre belirle → giris ekranina dondu → yeni sifre ile login. ✓
- Android: Preview APK Samsung S22'ye yuklendi, ayni akis test edildi, ayni sekilde calisti. ✓

---

## SON OTURUMDA NE YAPILDI (30 Nisan 2026)

1. **Bug tani:** v1.0.9 yayinda olmasina ragmen Ayse iPhone7'de sifre sifirlamayi denemis, hala ana ekrana dusuyor. Email URL'i incelendi — SafeLinks problemi olduu sanildi ama Outlook forward sirasinda eklendi (alis sirasinda yok), gercek email link normal Supabase URL'i. Mac M1 + iPhone7 iOS 15.8 ile test sirasinda tani: warm-start davranisi v1.0.9'da hala bug'li. Pending Pattern Stack mount race'ini cozmus, ama Expo Router group escape race'i (warm-start) cozmemis.
2. **Fix:** `app/_layout.tsx`'e iki yerde 150ms setTimeout defer eklendi (PASSWORD_RECOVERY event listener + Pending Pattern useEffect). Cift guvence: warm-start ve cold-start ayri yollardan handle edilir.
3. **Build:** `app.json` version 1.0.9 → 1.0.10. iOS production build (~5 dk cache hit) + Android production build (~25 dk).
4. **Test:** iOS TestFlight Internal Testing ("Gelistirici" grubu olusturuldu, aysetokkus@hotmail.com tester eklendi). Mac M1 Designed for iPad'de yukle + test. Android: preview APK link → Samsung S22'de yukle + test.
5. **Submit:** iOS App Store Submit for Review (Manual Release secildi). Android Play Console Production track'a Draft yuklendi → release notes (TR) yazildi → incelemeye gonderildi (v1.0.9 otomatik "Devre disi" oldu).
6. **Release Notes (her iki platform):** "E-posta uzerinden gelen sifre sifirlama baglantisi artik dogru ekrana yonlendiriyor. Bazi kullanicilarin Yeni Sifre Belirle ekranini goremedigi teknik sorun duzeltildi."
7. **Apple Review Notes:** Detayli Bug/Root cause/Fix metni, Test Account, Test scenario yazildi.
8. **Git commit/push:** v1.0.0 → v1.0.10 toplu birikim (80 dosya, 8337 insertion) tek commit'le GitHub'a push edildi (commit `48249ed`). 3 haftalik birikim artik kayipta degil. `.gitignore` guncellendi (google-service-account.json + raporlar exclude). `eas.json`'da production submit track "internal" → "production" yapildi.

---

## AKTIF/BEKLEYEN GOREVLER

### EN YUKSEK ONCELIK
1. **v1.0.10 Apple Review onayini bekle** (~24-48 saat) — Manual release secildi, onay gelince Ayse "Release" basacak
2. **v1.0.10 Google Play Production onayini bekle** (3-7 gun) — Yonetilen yayinlanma acik, Ayse "Yayinla" basacak
3. **Onay sonrasi STATE.md ve CHANGELOG.md guncelle** — yayinlandi olarak isaretle

### YUKSEK ONCELIK — MEVSIM GECISI (1 Mayis 2026)
1 Mayis'ta muzeleri yaz saatine gecir (yarin):
```sql
UPDATE mekan_saatleri SET aktif_mevsim = 'yaz', guncelleme_tarihi = NOW()
WHERE mevsimsel = true AND tip NOT IN ('saray', 'kasir');
```
NOT: Saraylar zaten 12 Nisan'da yaz saatine gecirildi.

### v1.1.0 PLANLANAN OZELLIKLER
1. **Profil ekrani surum no dinamiklestir** — Su an "v1.0.0" hardcoded, hic guncellenmiyor. `expo-application` paketinden `Application.nativeApplicationVersion` ile dinamik cek. Debug icin kritik (kullanici hangi build'i test ettigini bilemiyor).
2. **Edge-to-edge Android 15 uyumu** — `app.json`'a `edgeToEdgeEnabled: true` ve `expo-build-properties` ile `targetSdkVersion: 35`. Tab layout + gradient header'lara safe area inset entegrasyonu. Detayli plan: `v1.1.0-CHECKLIST.md` (outputs klasorunde).
3. **Push Notification altyapisi** — Uygulama kapaliyken bildirim. Cihaz token (`expo-notifications.getExpoPushTokenAsync`) → Supabase → Edge Function → APNs/FCM. ~2-3 gun is.
4. **X API senkronizasyonunu scheduled task'a tasi** — Su an `_layout.tsx` global timer SADECE app aciksa calisir. Sehir Hatlari pattern ile (`x-ulasim-takip` scheduled task) merkezi cozume tasinmali.
5. **Ana ekran widget** — Sultanahmet Camii saatleri + ulasim uyarilari. `react-native-android-widget` + `expo-apple-targets`.
6. **Sehir Hatlari/Saraylar fiyat tablosu scrape** — JS-rendered, browser otomasyonu gerekir (Firecrawl `browser_create+interact` veya Claude in Chrome).

### ORTA ONCELIK
- Farkli cihaz/ekran boyutu testleri
- Play Store fotograf/video izni temizligi — `READ_MEDIA_IMAGES` izni gereksiz, sonraki build'de kaldirilmali
- Bos Pusula-Alpha kapali test kanalini sil — karisiklik olmamasi icin
- Eksik Havabus rotalari DB'ye ekle: Yenisahra (270TL, ~45dk), Sakarya (500TL, ~95dk)
- Galata Mevlevihanesi muze.gov.tr URL'i — GMM01 redirect Gumushane'ye, dogru SectionId arastirilmali
- Android 16 buyuk ekran (foldable/tablet) uyumu — `screenOrientation` ve `resizeableActivity` durumu, **v1.2.0**'ya birakilabilir

### DUSUK ONCELIK
- Performans optimizasyonu
- Circular dependency fix (`components/ulasim-uyari.tsx` <-> `hooks/use-x-ulasim.ts`)
- RevenueCat Dashboard kontrolu (opsiyonel) — RC user ID mismatch, entitlement bagi, S2S Notifications

---

## STORE YAYIN DURUMU

### Google Play Console
- **Hesap:** Aktif ($25 odendi)
- **Production:** v1.0.10 inceleme'de (versionCode 28, 30 Nisan 2026), v1.0.9 (versionCode 26) "Devre disi" durumunda — atlanacak
- **Kapali test (Alpha):** v1.0.9 yayinda, 12 test kullanicisi
- **Play Store linki:** https://play.google.com/store/apps/details?id=com.pusulaistanbul.app
- **License testing:** Dahili Test listesi (ayse.tokkus@gmail.com + aysetokkusbayar@gmail.com), RESPOND_NORMALLY
- **Service Account:** revenuecat@pusula-istanbul.iam.gserviceaccount.com (Admin izinleri)
- **Yonetilen yayinlanma:** ACIK (manuel onay gerekli)
- **Uygulama kategorisi:** Araclar (Tools)
- **Abonelikler:** com.pusulaistanbul.app.aylik + com.pusulaistanbul.app.yillik (her ikisi Etkin)
- **Uygulama icerigi beyanlari:** 11/11 tamamlandi
- **IARC:** 12+ (sohbet ozelligi)
- **TestFlight Grubu:** "Gelistirici" Internal Testing — automatic distribution acik
- **eas.json submit track:** "production" (30 Nisan'da "internal"dan degistirildi)

### Apple App Store Connect
- **Apple Developer:** Aktif (Team ID: 7UJVL94SMJ, Provider ID: 128724610)
- **App Store Connect App ID:** 6761419678
- **App Store:** v1.0.9 YAYINDA (warm-start sifre sifirlama bug'i ile birlikte — v1.0.10 onayini bekliyor)
- **iOS IPA:** v1.0.10 build 27 (Apple Review'da)
- **Onceki reject sayisi:** 6 (v1.0 / v1.0.1 / v1.0.2 / v1.0.3 / v1.0.4 — bkz. CHANGELOG.md)
- **Demo hesaplar (Supabase'de ayarli):**
  - demo.test@pusulaistanbul.app / 123456 — suresi dolmus abonelik (ucretsiz katman test)
  - aysetokkus@hotmail.com / 123456 — aktif abonelik (premium test, 2027'ye kadar)
- **Subscription Group:** "Pusula Istanbul Premium" — Turkish lokalizasyon eklendi
- **EULA:** Custom License Agreement (Turkce + Ingilizce)
- **Manual release:** v1.0.7'den itibaren ZORUNLU (otomatik release felaketi yasandi)
- **Sign-In Information:** aysetokkus@hotmail.com / 123456 (App Review icin)

### TestFlight (Internal Testing)
- Grup: "Gelistirici" (Apple ASC default Türkçe karakter normalize etti — gosterim "Gelistirici")
- Tester: aysetokkus@hotmail.com (Account Holder + Admin)
- Automatic distribution: ACIK
- **Onemli not:** iPhone7 iOS 15.8 + TestFlight uyumsuzlugu var (TestFlight iOS 16+ gerektiriyor). Test icin Mac M1 "Designed for iPad" alternatif kullanildi.

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

### GitHub
- Repo: https://github.com/aysetokkus-lab/pusula-istanbul.git
- Son commit: `48249ed` (30 Nisan 2026, "feat: v1.0.0 -> v1.0.10 toplu surum birikimi")
- Branch: main, push edildi
- Onceki commit (a476bd9) ile arasinda 80 dosya, 8337 insertion delta
- `.gitignore` guncel: google-service-account.json + .env + raporlar + *.eski exclude

---

## OPERASYONEL NOTLAR

- **X API kredisi:** 27 Nisan'da tukenmisti, otomatik odeme aktif — bir daha kesinti yok
- **Paid Apps Agreement:** Active (5 Nis 2026 - 31 Mar 2027)
- **W-8BEN:** Active (Turkey, Article 12(2), %10 withholding)
- **U.S. Certificate of Foreign Status:** Active
- **Bank Account:** Active

---

## SU AN ICEYI BAKARKEN BAKMAN GEREKEN DOSYALAR

- **Yeni feature/bug uzerinde calisirken:** PROJECT.md (mimari) + ISSUES.md (benzer sorun var mi?)
- **Sifre sifirlama / deep link / auth flow:** DECISIONS.md "Pending Pattern" + ISSUES.md
- **Yeni surum cikarirken:** CHANGELOG.md (eski release notes formati) + INFRASTRUCTURE.md (EAS env, store ayarlari)
- **Email template / SMTP / DNS:** INFRASTRUCTURE.md "Email Altyapisi"
- **Supabase RLS / SQL pattern:** PROJECT.md + DECISIONS.md "RLS Sessiz Reddedebilir"
- **v1.1.0 plan:** outputs klasorunde `v1.1.0-CHECKLIST.md`
