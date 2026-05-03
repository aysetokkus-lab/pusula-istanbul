# Pusula Istanbul - Mevcut Durum

Son guncelleme: **3 Mayis 2026** — use-abonelik.ts NULL profile bug'i kalici cozumlendi (v1.0.11 fix kodda hazir), 4 etkilenen kullanicinin profili manuel SQL ile dogrulandi/dolduruldu, RC'de Ebru/Betul/Nadriye/Selim'in hepsi iOS Apple'dan satin almis (sifir yeni Play Store config bug magduru — sadece Mustafa+Sebnem)

Bu dosya HER SURUM degisikliginde guncellenmeli. Yeni oturumda Claude buraya bakar, "su an ne yapiyoruz" anlar.

---

## SU ANKI SURUM DURUMU

| Platform | Surum | Durum |
|----------|-------|-------|
| iOS App Store | **v1.0.10** | YAYINDA (1 Mayis 2026 — sifre sifirlama bug'i COZULDU) |
| Android Play Production | **v1.0.10** | YAYINDA (1 Mayis 2026 — versionCode 28) |
| Android Play Alpha | **v1.0.9** | Yayinda (12 test kullanicisi) — kapatilmasi planlandi |

### Build Numaralari
- **v1.0.10:** version 1.0.10, iOS buildNumber 27, Android versionCode 28 (yayinda)
- **v1.0.11:** version 1.0.11, iOS buildNumber 28, Android versionCode 29 (`app.json` bumped, build/submit bekliyor)

### Cozulen Bug (v1.0.10 fix — YAYINDA)
v1.0.9'da Pending Pattern eklenmisti AMA sadece cold-start'i cozmustu — warm-start (app arka planda iken mailden link tiklanmasi) hala bug'liydi. App ana ekrana acilip recovery session kuruluyordu ama `/sifre-sifirla` ekranina yonlendirme yapilmiyordu. Sebep: Expo Router'in route group escape sirasinda state batching ile race girmesi. **Fix: Pending Pattern useEffect'ine + PASSWORD_RECOVERY event handler'ina 150ms setTimeout defer eklendi** (bkz. DECISIONS.md "Pending Pattern" guncellenmis hali ve `_layout.tsx` line ~146 ve ~213). **1 Mayis 2026'da App Store ve Google Play'de yayina alindi — onay her iki platformdan da 24 saatten kisa surede geldi.**

### v1.0.10 Test Sonuclari (30 Nisan 2026)
- iOS: TestFlight'a yuklendi, Mac'te "Designed for iPad" olarak test edildi (iPhone7 iOS 15.8'de TestFlight calismadigi icin Mac M1 alternatif kullanildi). Sifre sifirlama akisi BASTAN SONA dogrulandi: email gonder → mail link → app acildi → /sifre-sifirla ekrani geldi → yeni sifre belirle → giris ekranina dondu → yeni sifre ile login. ✓
- Android: Preview APK Samsung S22'ye yuklendi, ayni akis test edildi, ayni sekilde calisti. ✓

---

## SON OTURUMDA NE YAPILDI (1 Mayis 2026 - 20+ saatlik buyuk gun)

### Sabah: v1.0.10 yayina cikti
1. **Apple Review onaylandi** (~24 saatten kisa surede) — beklenen 24-48 saatten cok daha hizli. v1.0.10 "Release This Version" basildi, App Store'da yayinda.
2. **Google Play onaylandi** (~24 saatten kisa surede) — beklenen 3-7 gunden cok daha hizli. v1.0.10 "Yayinla" basildi, Production'da yayinda.

### Ogleden sonra: Play Store Yillik Plan config bug kesfedildi
3. **Bug tanisi:** Orcun Taran (taranorcun@gmail.com) WhatsApp uzerinden bildirdi: yillik plan satin alma ekraninda "TRY 699,99/month" goruyor. Aslinda yillik 699,99 TL olarak tasarlanmis ama Play Console'da Yillik Plan urununun base plan'i (`yillik`) **AYLIK** olarak konfigure edilmis. Kullanicilar "yillik aldim" diyerek 699,99 TL odiyor, sonra her ay 699,99 TL kesilecek (12x fazla).
4. **Etkilenen kullanicilar tespit edildi:** RC Recent Transactions ve Supabase cross-reference ile 2 kisi:
   - Mustafa Tanribilir (mtanribilir60@yahoo.com) — RC alias e3df2404-c523-4c6a-befa-552a52483bcf
   - Sebnem Buyukkaragoz (sebnem.buyukkaragoz@gmail.com) — RC alias 6035f525-9f7c-4266-b58e-e66ff3f2ae90
5. **Play Console fix:**
   - Eski `yillik` base plan icin billing period DEGISTIRILEMEZ (Google kurali)
   - YENI base plan olusturuldu: `yillik-yeni`, Yillik dönem (P1Y), 699,99 TL Türkiye
   - Aktif edildi, eski `yillik` base plan devre disi birakildi
6. **RC offering guncellendi:** Play Store yillik urunu `com.pusulaistanbul.app.yillik:yillik-yeni`'ye yonlendirildi (Import + Attach entitlement + Edit offering's annual package).
7. **Mustafa & Sebnem icin tam cozum:** Play Console'dan refund (her biri 699,99 TL), abonelik iptal, RC'de 1 yil manuel premium grant (2027-05-01'e kadar). Sebnem'in profile alanlari NULL'di (3-katmanli guvenlik agi varyanti), manuel SQL ile dolduruldu.
8. **Orcun (3. kullanici):** Bug'i raporladi, banka cekimi bloke etti (para gitmedi). Hesabi Supabase Dashboard'dan admin yetkisiyle yaratildi (taranorcun@gmail.com, gecici sifre Pusula2026!), profile manuel INSERT, abonelik_durumu='aktif'+yillik+2027-05-01. App `use-abonelik.ts` Supabase fallback ile premium gosterecek.
9. **WhatsApp + email iletisimi:** Mustafa ve Sebnem'e Türkce ozur emaili (refund + 1 yil ucretsiz premium hediyesi), Orcun'a WhatsApp mesaji (gecici sifre + giriş + sifre degistirme talimatlari).
10. **UX bug fix kodda:** `app/abone-ol.tsx` line 185 ve `app/(tabs)/profil.tsx` line 276 — "Bu Apple ID ile..." metni Android kullanicilarda Apple ID gorunuyordu. Generic "Hesabiniz ile iliskili..." olarak duzeltildi. **v1.0.11'de yayina cikacak.**

### Aksam: Google Play tax + payment setup baslatildi
11. **ABD W-8BEN formu doldurulup gonderildi:** Türkiye-ABD Vergi Anlasmasi Article 12 paragraf 2, %10 stopaj. **ONAYLANDI** (gecerlilik 31 Aralik 2029'a kadar). Apple W-8BEN'in kardesi.
12. **Türkiye vergi formu:** Bireysel (KDV no bos, mukellef degil) — gonderildi. Sayfa cache'den dolayi hala "Kayitli vergi bilgisi yok" gorunuyor olabilir, yenilemek lazim.
13. **Irlanda vergi formu BASLATILDI ama duraksandi:** Türkiye-Irlanda Vergi Anlasmasi (royalty %10) icin **Vergi Mukimlik Belgesi** istiyor (resmi Türkiye belgesi, posta ile geliyor). Ayse vergi MUKELLEFI olmasa da vergi MUKIMI (kafa karistirici ayrim — bkz. DECISIONS.md). e-Devlet'ten "Mukimlik Belgesi" talebi olusturuldu, posta ile 1-2 hafta icinde gelecek.
14. **Banka hesabi, Tayvan vergi formu, %15 hizmet ucreti programi kaydi:** YAPILMADI, yarinki gunde tamamlanacak.

### Ucuncu olum: 20 saatten fazla bilgisayar basinda gecirildi
- Sabah email/Whatsapp/refund iletisimi
- Ogle-aksam Google Play config + RC senkronizasyonu
- Aksam vergi formlari
- Ayse molasi 22:00'den sonra alindi.

---

## ONCEKI OTURUM (30 Nisan 2026)

1. **Bug tani:** v1.0.9 yayinda olmasina ragmen Ayse iPhone7'de sifre sifirlamayi denemis, hala ana ekrana dusuyor. Email URL'i incelendi — SafeLinks problemi olduu sanildi ama Outlook forward sirasinda eklendi (alis sirasinda yok), gercek email link normal Supabase URL'i. Mac M1 + iPhone7 iOS 15.8 ile test sirasinda tani: warm-start davranisi v1.0.9'da hala bug'li. Pending Pattern Stack mount race'ini cozmus, ama Expo Router group escape race'i (warm-start) cozmemis.
2. **Fix:** `app/_layout.tsx`'e iki yerde 150ms setTimeout defer eklendi (PASSWORD_RECOVERY event listener + Pending Pattern useEffect). Cift guvence: warm-start ve cold-start ayri yollardan handle edilir.
3. **Build:** `app.json` version 1.0.9 → 1.0.10. iOS production build (~5 dk cache hit) + Android production build (~25 dk).
4. **Test:** iOS TestFlight Internal Testing ("Gelistirici" grubu olusturuldu, aysetokkus@hotmail.com tester eklendi). Mac M1 Designed for iPad'de yukle + test. Android: preview APK link → Samsung S22'de yukle + test.
5. **Submit:** iOS App Store Submit for Review (Manual Release secildi). Android Play Console Production track'a Draft yuklendi → release notes (TR) yazildi → incelemeye gonderildi (v1.0.9 otomatik "Devre disi" oldu).
6. **Release Notes (her iki platform):** "E-posta uzerinden gelen sifre sifirlama baglantisi artik dogru ekrana yonlendiriyor. Bazi kullanicilarin Yeni Sifre Belirle ekranini goremedigi teknik sorun duzeltildi."
7. **Apple Review Notes:** Detayli Bug/Root cause/Fix metni, Test Account, Test scenario yazildi.
8. **Git commit/push:** v1.0.0 → v1.0.10 toplu birikim (80 dosya, 8337 insertion) tek commit'le GitHub'a push edildi (commit `48249ed`). 3 haftalik birikim artik kayipta degil. `.gitignore` guncellendi (google-service-account.json + raporlar exclude). `eas.json`'da production submit track "internal" → "production" yapildi.

---

## SON OTURUMDA NE YAPILDI (3 Mayis 2026)

### Sabah-ogle: NULL profile sistematik tarama + use-abonelik.ts fix
1. **Tarama:** `abonelik_durumu='aktif' AND (abonelik_plani IS NULL OR abonelik_bitis IS NULL)` → 6 satir: Selim, Nadriye, Betul, Ebru + 2 dev hesap (proteste_angel, ayse.tokkus@gmail). Sebnem (1 May) + bu 6 = sistematik bug, race condition degil.
2. **RC'de dogrulama (4 gercek kullanici, dev hesaplar atlandi):** Hepsi iOS Apple'dan satin almis. Ebru + Betul → Yillik (TRY 699,99, Subscription renews in 1 year), Nadriye + Selim → Aylik (TRY 99,99). Hiçbiri Play Store'da degil → 1 Mayis Play Store config bug'indan **yeni magdur YOK** (sadece Mustafa+Sebnem). Apple'in urun modeli farkli, base plan ayrımı yok, billing period ürün özelligi.
3. **Manuel SQL (atomic transaction):** 4 kullanicinin profile alanlari RC verisinden dolduruldu (yillik → 2027-05 bitis, aylik → 2026-06 bitis). Dogrulama sorgu temiz: sadece 2 dev hesap kaldi.
4. **Kalici fix (`hooks/use-abonelik.ts`):** Iki yer guncellendi (line 100-105 RC sync + line 173-175 RC listener), `planFromProductId()` helper eklendi, `rcAbonelikKontrol()` artik `{aktif, productId, expirationDate}` donduruyor. Idempotent reconciler — sadece eksik/farkli alanlari yazar. Yorum bloklarinda `BUG FIX (v1.0.11)` etiketi var.
5. **`app.json` bumped:** version 1.0.10 → 1.0.11, iOS buildNumber 27 → 28, Android versionCode 28 → 29.
6. **Dokumantasyon disiplini:** DECISIONS.md #31 (use-abonelik kalici fix), CHANGELOG.md (v1.0.11 use-abonelik genisletildi), ISSUES.md (4 yeni cozulen bug), STATE.md (bu dosya), CLAUDE.md (tarih + tabloda DECISIONS sayisi 26→31).

### Bekleyen — Build & Yayin
- **EAS build her iki platform** — Ayse Mac terminalinde `eas build --platform all --profile production`
- **EAS submit** — `eas submit --platform ios --latest && eas submit --platform android --latest`
- **Manual release sec** (DECISIONS.md #5)
- **Release notes (TR):** "Bazi abone kullanicilarda plan ve bitis tarihi bilgisinin profilde gorunmemesi sorunu giderildi. Ayrica abonelik ekranlarindaki 'Apple ID' ifadesi platform-bagimsiz 'Hesabiniz' olarak guncellendi."

---

## AKTIF/BEKLEYEN GOREVLER (3 Mayis 2026 itibariyle)

### EN YUKSEK ONCELIK
0. ✓ **TAMAMLANDI (3 May):** NULL profile bug kalici cozumu — kod fix v1.0.11'de hazir, 4 etkilenen kullanici manuel doldurma ile temizlendi.

1. **Google Play Odeme profili eksiklerini tamamla:**
   - **Banka hesabi ekle** (Apple'da kullanilan IBAN ile ayni olabilir) — odeme almanin on kosulu
   - **Tayvan vergi formu** — Pusula Istanbul'un Tayvan kullanicisi yok, "ilgili degil" / minimal bilgi yeterli
   - **Irlanda formu**: "Hayir, vergi anlasmasindan yararlanmiyorum" ile gecici tamamla, %20 stopaj kabul. Mukimlik Belgesi posta ile geldiginde formu guncelle, %10'a in
   - **%15 hizmet ucreti programi kaydi** — bonus, ilk $1M revenue icin Google komisyonu %30 → %15

2. **v1.0.11 build & yayin (iki fix bir arada):**
   - **Fix A (UX):** `app/abone-ol.tsx` + `app/(tabs)/profil.tsx` — "Apple ID" hardcoded → generic "Hesabiniz" (1 May'da yapilmisti)
   - **Fix B (use-abonelik.ts NULL profile sistemik bug — 3 May):** `planFromProductId()` helper + `rcAbonelikKontrol()` zenginlestirme + iki RC sync noktasi guncellendi. Detay: DECISIONS.md #31.
   - `app.json` version 1.0.11, iOS buildNumber 28, Android versionCode 29 — **bumped, hazir**
   - EAS build (her iki platform), submit, manual release
   - Hizli kabul olur (kod degisikligi minimal, davranis ayni — sadece Supabase senkronizasyonu daha tamam yaziyor)

3. **Pusula-Alpha kapali test kanalini kapat/sil** — v1.0.10 hem alpha hem production'da, alpha gerek yok. Test kullanicilari production'a otomatik gecer.

### ORTA ONCELIK
4. **Mukimlik Belgesi geldikten sonra Irlanda formunu guncelle** (1-2 hafta icinde posta ile geliyor)
5. **Eski 13 yillik abonenin (bitis 2027-04 araligi) platform dogrulamasi** — Play Store mu App Store mu, Play Store'daysa onlar da etkilenmis olabilir (config bug aylar oncesi yapilmis olabilir). RC Customers tarayisi gerekli. Cok ihtimalle cogu Ayse'nin test hesabi ve App Store kullanicilari, ama emin olalim.
6. **v1.1.0 kapsamini kesinlestir** — asagidaki listeden ilk tur secimi.

### DOKUMANTASYON GUNCELLEMELERI (yapildi 3 May 2026)
- ✓ STATE.md (bu dosya — 3 May durumu)
- ✓ CHANGELOG.md (v1.0.11 use-abonelik fix eklendi, eski UX fix korundu)
- ✓ DECISIONS.md (#31 USE-ABONELIK.TS RC LISTENER EKSIK SYNC eklendi — kalici cozum)
- ✓ ISSUES.md (4 yeni cozulen sorun: NULL profile sistematik bug + 4 manuel doldurma)
- ✓ CLAUDE.md (tarih 30 Nisan → 3 Mayis, DECISIONS sayisi 26 → 31)
- ✓ app.json (1.0.11 + buildNumber 28 + versionCode 29)
- ✓ hooks/use-abonelik.ts (kod fix uygulandi)

### (1 May aksami yapilan dokumantasyon)
- ✓ DECISIONS.md (4 yeni karar — #27 Play Console base plan + #28 admin user creation + #29 vergi mukimi vs mukellefi + #30 NULL profile varyanti)
- ✓ ISSUES.md (3 yeni cozulen sorun)
- ✓ CLAUDE.md (entitlement adi 'pro' → 'premium' duzeltildi)

### MEVSIM GECISI — TAMAMLANDI (1 Mayis 2026)
- Saraylar: 12 Nisan 2026'da yaz saatine gecirildi
- Muzeler: **1 Mayis 2026'da yaz saatine gecirildi** (Ayse SQL'i Supabase'de calistirdi)
- Sonraki gecis: 1 Kasim 2026 (kis saatine donus — STATE.md'ye yeniden eklenecek)

### v1.1.0 PLANLANAN OZELLIKLER
1. **Profil ekrani surum no dinamiklestir** — Su an "v1.0.0" hardcoded, hic guncellenmiyor. `expo-application` paketinden `Application.nativeApplicationVersion` ile dinamik cek. Debug icin kritik (kullanici hangi build'i test ettigini bilemiyor).
2. **Edge-to-edge Android 15 uyumu** — `app.json`'a `edgeToEdgeEnabled: true` ve `expo-build-properties` ile `targetSdkVersion: 35`. Tab layout + gradient header'lara safe area inset entegrasyonu. Detayli plan: `v1.1.0-CHECKLIST.md` (outputs klasorunde).
3. **Push Notification altyapisi** — Uygulama kapaliyken bildirim. Cihaz token (`expo-notifications.getExpoPushTokenAsync`) → Supabase → Edge Function → APNs/FCM. ~2-3 gun is.
4. **X API senkronizasyonunu scheduled task'a tasi** — Su an `_layout.tsx` global timer SADECE app aciksa calisir. Sehir Hatlari pattern ile (`x-ulasim-takip` scheduled task) merkezi cozume tasinmali.
5. **Ana ekran widget** — Sultanahmet Camii saatleri + ulasim uyarilari. `react-native-android-widget` + `expo-apple-targets`.
6. **Sehir Hatlari/Saraylar fiyat tablosu scrape** — JS-rendered, browser otomasyonu gerekir (Firecrawl `browser_create+interact` veya Claude in Chrome).
7. **RC'ye email attribute yaz (1 May 2026 ogrenildi):** `lib/revenuecat.ts`'te login sonrasi `Purchases.setAttributes({'$email': user.email})` cagir. Boylece RC dashboard'da musteri email ile aranabilir, anonymous user'larin Supabase user'a baglanmasi izlenebilir. Su an email aramasi RC'de bos donuyor.
8. **Supabase data hygiene (1 May 2026 ogrenildi):** RC'de 8 active subscription, Supabase'de 25 abonelik_durumu='aktif' kullanici. Stale kayitlar (Ayse'nin test hesaplari + iptal etmis ama DB guncellenmemis) icin temizlik scheduled task'i. RC webhook → Supabase Edge Function ile expired subscriptions'i pasif yap.

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
- **Production:** **v1.0.10 YAYINDA** (versionCode 28, 1 Mayis 2026'da yayinlandi). v1.0.9 (versionCode 26) atlandi.
- **Kapali test (Alpha):** v1.0.9 yayinda, 12 test kullanicisi — kapatilmasi planlandi
- **Play Store linki:** https://play.google.com/store/apps/details?id=com.pusulaistanbul.app
- **License testing:** Dahili Test listesi (ayse.tokkus@gmail.com + aysetokkusbayar@gmail.com), RESPOND_NORMALLY
- **Service Account:** revenuecat@pusula-istanbul.iam.gserviceaccount.com (Admin izinleri)
- **Yonetilen yayinlanma:** ACIK (manuel onay gerekli)
- **Uygulama kategorisi:** Araclar (Tools)
- **Abonelikler:**
  - com.pusulaistanbul.app.aylik (base plan: aylik) — Etkin, 99,99 TL/ay
  - com.pusulaistanbul.app.yillik (base plan: **yillik-yeni**) — Etkin, **yillik 699,99 TL** (1 May 2026 fix sonrasi)
  - com.pusulaistanbul.app.yillik (base plan: yillik) — **DEVRE DISI** (eski bozuk plan, aylik fatura donemi vardi)
- **Uygulama icerigi beyanlari:** 11/11 tamamlandi
- **IARC:** 12+ (sohbet ozelligi)
- **eas.json submit track:** "production" (30 Nisan'da "internal"dan degistirildi)

#### Google Play Odeme/Vergi Profili (1 Mayis 2026 itibariyle)
- ✅ **ABD vergi formu W-8BEN ONAYLANDI** — Article 12, paragraph 2, **%10 stopaj** (royalty income). Gecerlilik 31 Aralik 2029. TC Kimlik 10125030394 yabanci TIN olarak girildi.
- ✅ **Türkiye vergi formu** — Bireysel, KDV no bos (mukellef degil). Gonderildi (cache'den dolayi sayfa yenilemesi gerekebilir gormek icin).
- ⏳ **Irlanda vergi formu** — DURAKLATILDI. "Vergi Mukimlik Belgesi" istiyor (e-Devlet posta talebi yapildi, 1-2 hafta icinde geliyor). Gecici cozum: "Hayir, anlasmadan yararlanmiyorum" secip %20 stopaj kabul. Belge gelince guncellenecek %10 icin.
- ❌ **Banka hesabi (odeme yontemi)** — Henuz eklenmedi. Yarinki gunde Apple'a verilen IBAN ile eklenecek.
- ❌ **Tayvan vergi formu** — Henuz doldurulmadi (Pusula Istanbul'un Tayvan kullanicisi yok, "ilgili degil" yetebilir).
- ❌ **%15 hizmet ucreti programi kaydi** — Henuz yapilmadi. Bonus ama acil — ilk $1M revenue icin Google komisyonu %30 yerine %15 olur.

#### Play Console'da yapilanlar (1 May 2026)
- Yillik Plan urununde yeni base plan `yillik-yeni` (Yillik dönem, 699,99 TL) olusturuldu
- Eski `yillik` base plan (yanlislikla aylik fatura donemi) devre disi birakildi
- 2 etkilenen kullaniciya refund yapildi (Sipariş yönetimi ekraninden)

### Apple App Store Connect
- **Apple Developer:** Aktif (Team ID: 7UJVL94SMJ, Provider ID: 128724610)
- **App Store Connect App ID:** 6761419678
- **App Store:** **v1.0.10 YAYINDA** (1 Mayis 2026 — sifre sifirlama warm-start bug'i COZULDU)
- **iOS IPA:** v1.0.10 build 27 (yayinda)
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
- **Entitlement:** **`premium`** — tum urunler bagli (lib/revenuecat.ts'te `ENTITLEMENT_ID = 'premium'`)
- **Offering:** "default" — Monthly ($rc_monthly) + Yearly ($rc_annual) + Lifetime ($rc_lifetime)
- **Products:**
  - App Store: Aylik + Yillik
  - Play Store: aylik:aylik + **yillik-yeni** (1 May 2026'da degistirildi, eski `yillik:yillik` devre disi)
  - Test Store: Monthly + Yearly + Lifetime
- **Manuel grant uygulanmis kullanicilar (1 May 2026 — bug iadesi sonrasi 1 yil hediyye):**
  - Mustafa Tanribilir (e3df...3bcf alias) — 2027-05-01'e kadar
  - Sebnem Buyukkaragoz (6035...ae90 alias) — 2027-05-01'e kadar
  - Orcun Taran (Supabase fallback ile, RC'de henuz yok — ilk girisle olusacak)

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
- **Mekan Saatleri Excel-as-Source-of-Truth (1 May 2026):** 57 mekanin kapsamli toplu revizyonu yapildi. `mekan-saatleri-veri-giris.xlsx` Ayse tarafindan dolduruldu (saraylar mevsimsel=false, EUR fiyatlari, vb.), `scripts/excel-full-sync-sql.py` ile SQL uretildi, atomic transaction ile uygulandi. Bkz. DECISIONS.md #25.

## TOPLU VERI YONETIM DOSYALARI

- **Excel kaynak:** `mekan-saatleri-veri-giris.xlsx` (proje kokunde — 57 satir, tek dogruluk kaynagi)
- **Toplu SQL son uretim:** `mekan-saatleri-full-sync.sql` (proje kokunde — son uretilen, gerekirse tekrar calistirilabilir)
- **Pipeline scripts (proje koku/scripts/):**
  - `template-olustur.py` — Sifirdan bos Excel template uret
  - `template-doldur.py` — Bos template'i DB'den mevcut kayitlarla doldur (yeni revizyon oncesi yenile)
  - `excel-full-sync-sql.py` — Excel'den SQL ureten ana script
  - `excel-diff-sql.py` — Eski diff-based versiyonu (full-sync ile degistirildi, kalmasinin sebebi: kucuk degisiklikler icin hala tercih edilebilir)
- **Hibrit yonetim:** kucuk degisiklik admin panelden, buyuk revizyon Excel'den. Cakisma onlemek icin admin degisiklikleri Excel'e de yansitilmali.

---

## SU AN ICEYI BAKARKEN BAKMAN GEREKEN DOSYALAR

- **Yeni feature/bug uzerinde calisirken:** PROJECT.md (mimari) + ISSUES.md (benzer sorun var mi?)
- **Sifre sifirlama / deep link / auth flow:** DECISIONS.md "Pending Pattern" + ISSUES.md
- **Yeni surum cikarirken:** CHANGELOG.md (eski release notes formati) + INFRASTRUCTURE.md (EAS env, store ayarlari)
- **Email template / SMTP / DNS:** INFRASTRUCTURE.md "Email Altyapisi"
- **Supabase RLS / SQL pattern:** PROJECT.md + DECISIONS.md "RLS Sessiz Reddedebilir"
- **v1.1.0 plan:** outputs klasorunde `v1.1.0-CHECKLIST.md`
