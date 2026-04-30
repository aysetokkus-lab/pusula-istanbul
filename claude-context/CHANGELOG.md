# Pusula Istanbul - Surum Gecmisi

Bu dosya **append-only** — eski surum bilgilerini silmeyiz, yeni surumler ust uste eklenir. Sadece "geriye dogru ne yaptik?" sorusuna bakmak icin acilir.

---

## v1.0.9 (BUILD HAZIR — 27-28 Nisan 2026)

**Sorun:** v1.0.8'deki sifre sifirlama fix'i Apple ve Google'da yayina cikti AMA hata hala mevcut. Iki kullanici (ayse.tokkus@gmail vs kelebekiamarket@gmail) ile A/B testi sonucu kesin tani: **Stack mount race condition.**

### Tani Sureci (27 Nisan 2026)
1. ayse.tokkus icin: sifre sifirlama maili → linke bas → app aciliyor → "kendi kendine login" → ana ekran (sifre-sifirla GELMIYOR)
2. kelebekiamarket icin AYNI akis CALISIYOR
3. last_sign_in_at karsilastirmasi: ayse.tokkus 14:44:16 (deep link sonrasi GUNCELLENMEDI), kelebekiamarket 14:46:48 (GUNCELLENDI). Demek ki ayse.tokkus icin setSession koshmadi/yarisi kaybetti.
4. Hipotez A (mevcut acik oturum) hard kill + logout + iPhone 7 clean install ile CURUDU
5. lib/supabase.ts'te `detectSessionInUrl: false` — SDK auto-detect yapmiyor
6. **Cold start senaryosu:** app mount → fonts/oturum/abonelik bekleme ile Stack hic render edilmiyor → handleAuthDeepLink kosar, setSession basarili → router.replace('/sifre-sifirla') Expo Router'da silently fail → fonts resolve, Stack mount, initialRouteName="(tabs)" → kullanici ana ekrana dusuyor

### Fix: Pending Pattern (Stack Mount-Aware Navigation)
`app/_layout.tsx`:
- Yeni state `sifreSifirlamaPending`
- handleAuthDeepLink icinde dogrudan router.replace YERINE `setSifreSifirlamaPending(true)`
- PASSWORD_RECOVERY event handler ayni patterne cevrildi
- Yeni useEffect Stack hazir olunca navigate eder (dependency'ler Stack render kosullariyla AYNI)

### app.json Bumped
- version: 1.0.8 → **1.0.9**
- iOS buildNumber: 23 → **24**
- Android versionCode: 24 → **25**

### Tamamlanan Adimlar (28 Nisan 2026)
1. ✓ `eas build --platform all --profile production` — TAMAMLANDI
2. ✓ `eas submit --platform ios --latest` — App Store Connect'e yuklendi
3. ✓ `eas submit --platform android --latest` — Play Store Alpha'ya yuklendi
4. ✓ Alpha'ya v1.0.9 rollout, Ayse telefonuna tester olarak kurdu, **sifre sifirlama akisi DOGRULANDI**
5. ✓ iOS App Store Connect'te version 1.0.9 olusturuldu, build secildi, release notes + review notes eklendi, **Manual release** secildi, submit edildi (Apple Review'da bekliyor, ~24-48 saat)
6. ✓ Google Play Production'a v1.0.9 ile yeni release olusturuldu, sürüm kodu 26. Türkiye eklemesi inceleme'de.
7. ✓ v1.0.8 Production review v1.0.9 ile **degistirildi**

### Release Notes (Turkce)
```
v1.0.9 — Sifre sifirlama akisi duzeltildi

• Sifre sifirlama maili sonrasi Yeni Sifre ekrani artik dogru aciliyor
• Recovery deep link timing sorunu giderildi
```

### DERSLER
- **router.replace silently fail eder Stack mount edilmeden once** — Expo Router'in tipik davranisi
- **A/B test paha bicilemez** — kelebekiamarket vs ayse.tokkus karsilastirmasi olmasaydi, "kullanici yanlis denedi" varsayimina dusulebilirdi
- **last_sign_in_at gibi metadata alanlari debug arac olarak kullanilabilir**
- **detectSessionInUrl: false ile manuel handler'in TIMING ve completeness'i kritik**

---

## v1.0.8 (BUILD ALINDI + SUBMIT EDILDI — 26 Nisan 2026)

v1.0.7 yayina cikip sifremi unuttum bug'i fark edilince acilen v1.0.8 hazirlandi. Apple Review'da bekliyor (Build 22), Google Play Alpha'da yayinda (versionCode 23).

### Yeni Dosya: `app/sifre-sifirla.tsx`
Dedicated sifre sifirlama ekrani. Mailden gelen recovery linki bu ekrani acar (deep link handler ile). UI: yeni sifre + sifre tekrar input'lari, validation (8+ karakter, harf+rakam, eslesme), "Sifreyi Guncelle" butonu, "Vazgec" kacis kapisi. Kullanici yeni sifre belirledikten sonra signOut + /giris'e donus.

### `app/_layout.tsx` (deep link handler)
- `expo-linking` import
- `Linking.getInitialURL()` + `addEventListener('url', ...)` ile recovery URL yakalanir
- URL hash parse: `#access_token=...&refresh_token=...&type=recovery` (implicit flow)
- URL query parse: `?code=...&type=recovery` (PKCE flow) — backup
- `setSession()` veya `exchangeCodeForSession()` ile recovery session kurulur
- Race condition fix: `useRef` ile senkron flag
- `Stack.Screen name="sifre-sifirla"` route eklendi
- Routing logic'e `sifreSifirlamaEkraninda || sifreSifirlamaRef.current || sifreSifirlamaModu` exception

### `app/(tabs)/profil.tsx` (Cikis Yap fix)
Sorun: `cikisYap` sadece `supabase.auth.signOut()` cagiriyordu, local state `kullanici` guncellenmiyordu.
Fix: `await signOut()` + `setKullanici(null)` + `router.replace('/giris')`. Ayni Hesap Silme akisinda da.

### `components/canli-durum-panel.tsx`
- `not_metni` Text bileseninde `numberOfLines={1}` → `numberOfLines={2}`

### `hooks/use-canli-durum.ts` (durumKaldir error handling)
RLS sessiz reddederse error donmuyor, sadece `data.length === 0` oluyordu. Fix: `.select()` eklendi, satir sayisi kontrol, "yetki sorunu olabilir" mesaji.

### Supabase Production-Applied SQL
**1) `supabase-migration-saha-admin-update.sql`** — UPDATE policy: `is_admin_or_mod()` ile ek policy (admin baskasinin bildirimi `gecerli_mi=false` yapamiyordu)
**2) `supabase-migration-saha-sabit-koru.sql`** — `eskiyen_durumlari_kaldir()` cron sabitlendi=true bildirimleri de temizliyordu → WHERE `AND COALESCE(sabitlendi, false) = false`

### app.json Bumped
- version: 1.0.7 → **1.0.8**
- iOS buildNumber: 19 → 21 → **22**
- Android versionCode: 20 → 22 → **23**

### Submit Notlari
- App Review Information notes: kibar Ingilizce sablon (Test Account: aysetokkus@hotmail.com / 123456 — premium grant)
- Demo hesap sifresi reset: `UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')) WHERE email = 'aysetokkus@hotmail.com';`

### DERSLER
- **v1.0.7 review hizla onaylandi** ve otomatik release edildi (Manuel secilmedigi icin) — sifremi unuttum bug'i ile birlikte yayina cikti
- **Bundan sonra her release'de Manuel release sec** ki kritik bug fark edilirse cancel/reject sansi olsun
- **Kalite > momentum:** Ayse'nin pozisyonu (sifre sifirlama gibi temel ozellik fix'ini iceren bir ucretli app cikamaz)
- **State async, ref senkron**
- **Supabase RLS sessiz reddedebilir**

---

## v1.0.7 (BUILD ALINDI — 25 Nisan 2026, iOS buildNumber 20, Android versionCode 21)

### Bildirim Karti Detay Modali (canli-durum-panel.tsx)
- DurumDetayModal bileseni eklendi (mekan ismi, durum, bekleme suresi, kapali bolum, tam not_metni, zaman, rehber ismi)
- DurumKartKucuk'a onPress prop, kartlar TouchableOpacity ile tiklanabiir
- TumDurumlarModal'a da detayItem state + DurumDetayModal render
- Kategorilere 'genel' (Genel Duyurular) eklendi
- DurumDetayModal'a alt "Kapat" butonu

### Kayit Ekrani Email Confirmation Fix (giris.tsx)
- kayitOl: profiles INSERT `if (data.session)` kontrolune alindi — session yoksa atlanir, RLS engeli giderilir
- emailRedirectTo: `https://pusulaistanbul.app/dogrulandi.html` (iOS Mail in-app browser uyumu)
- sifremiUnuttum: `redirectTo: 'pusulaistanbul://giris'`
- TypeScript .catch hatalari try/catch'e cevrildi (PostgrestFilterBuilder thenable, .catch yok)

### Sohbet Klavye Altinda Kalma Fix (sohbet.tsx)
- KeyboardAvoidingView en dis container'a tasindi
- Android icin behavior 'undefined' → 'height'
- TextInput'a textAlignVertical='top', minHeight 44

### Acil Ekrani Tek 112 Sadelestirme (acil.tsx)
- Eski 5'li grid (112/110/155/156/158) kaldirildi
- BUYUK tek "112 — Tum Acil Durumlar" karti (kirmizi #D62828, 44px font)
- Bilgilendirici alt metin: "Eski numaralar (155, 110, 156, 158, 122, 177) 2021'den bu yana 112'ye yonlendirilir"
- FALLBACK_ACIL dizisi tek 112 kaydina indirildi
- Supabase: `supabase-acil-numara-112.sql` calistirildi — 112 disindaki acil_rehber kayitlari aktif=false

### Sifre Goster/Gizle Butonu (giris.tsx)
- Sifre + Sifre Tekrar alanlarinin sagina kucuk "Goster"/"Gizle" yazili buton (emoji yok, screen reader uyumlu)
- secureTextEntry={!sifreGorunur} ile toggle, iki alan bagimsiz

### Email Dogrulama Akisi (`docs/dogrulandi.html`)
- Yesil ✓ ikonlu mobil-uyumlu basari sayfasi (SVG, emoji yok)
- "E-posta Adresiniz Dogrulandi" basligi + "Uygulamayi Ac" butonu (deep link)
- Mavi gradient arkaplan
- Supabase Auth Redirect URLs whitelist'e https://pusulaistanbul.app/dogrulandi.html EKLENDI

### Bildirim Badge Sifirlama (_layout.tsx)
- expo-notifications + AppState import
- App acilisinda + foreground gecisinde Notifications.setBadgeCountAsync(0) + dismissAllNotificationsAsync()

### Ana Sayfa 8'li Grid Sadelestirme (index.tsx)
- Muze butonu KALDIRILDI (Saraylar ile aynı ekran)
- "Saraylar" → "Muze\nSaray\nCami" label
- "Gemi Tarihleri" KALDIRILDI (duplicate)
- "IHL Ucuslari" eklendi → istairport.com/ucuslar/ucus-bilgileri/gelen-ucuslar
- "SAW Ucuslari" eklendi → sabihagokcen.aero/yolcu-ve-ziyaretciler/yolcu-rehberi/ucus-bilgi-ekrani
- Ozgun ucak ikonu: `assets/icons/ucus.svg`
- Yeni grid sirasi:
  - Ust: Namaz Vakitleri, Muze/Saray/Cami, Bogaz Turlari, MuzeKart Satis Noktalari
  - Alt: IHL Ucuslari, SAW Ucuslari, Havalimani Ulasim, Doviz Kuru
- "Guncel Kurlar" alt baslik kaldirildi

### Bogaz Turlari Sayfa Duzeni (bogaz.tsx)
- Sayfa basligi: "Bogaz & Adalar" → "Bogaz Turlari"
- 3 sekme (Turyol, Dentur, Sehir Hatlari) ortak yapida
- Turyol'a Dentur tarzi durak fiyat kutusu, "Resmi sayfada detay" butonu, ozel_not destegi
- Mola bandi uyariKutu stiline cevrildi
- ADALAR_LINKLERI: Sehir Hatlari, Dentur Avrasya, Turyol, Mavi Marmara
  - Mavi Marmara URL: https://mavimarmara.net/wp-content/uploads/mavimarmara-2026-yazagecis-tarife-listesi.pdf

### Sayfa Basliklari Tutarlilik
- "Muzeler & Saraylar" → "Muze · Saray · Cami"
- "Havalimani Ulasimi" → "Havalimani Ulasim"

### MuzeKart Yazim Butunlestirme (11 yer)
- Tum varyasyonlar (Muze Kart, Muzekart) → "MuzeKart"
- Dosyalar: ara.tsx (2), hos-geldin.tsx (1), admin-saatler.tsx (1), index.tsx (2), muzeKart.tsx (4), muzeler.tsx (1)
- STORE-LISTING-BILGILERI.md guncellendi
- Route key'lere ve database value'larina dokunulmadi

### MuzeKart Sayfasi Sadelestirme
- "Museum Pass Istanbul bilgileri" alt yazisi kaldirildi
- Satis noktalari kartlarinda "Sakin"/"Kalabalik" badge'i kaldirildi
- Sol kenardaki yogunluk renk seridi korundu

### Sehir Hatlari Vapur Iptal Seferleri (Scheduled Task)
- `sehir-hatlari-iptal-takip` scheduled task olusturuldu (15 dk araliklarla)
- Firecrawl ile https://sehirhatlari.istanbul/tr/iptal-seferler scrape
- Supabase ulasim_uyarilari tablosuna service_role key ile yazar (RLS bypass)
- Tarih kontrolu, idempotent (tweet_id basliktan SHA256 hash)

### Build & Config
- app.json: version 1.0.7, buildNumber "19" (EAS auto-bump 20), versionCode 20 (EAS auto-bump 21)
- .env: SUPABASE_SERVICE_ROLE_KEY eklendi (sadece scheduled task'lar)
- docs/dogrulandi.html: Yeni dosya, GitHub'a push'landi (commit: a476bd9)

### Veritabani
- supabase-acil-numara-112.sql calistirildi
- 5 muze saat duzeltmesi: Galata Kulesi (kis_kapanis 18:30, gise 18:14), Ayasofya (acilis 09:00, kapanis 19:00, gise 18:30), TIEM (gise 17:30), Islam Bilim (tum saatler 09:00-18:00, gise 17:30), Kiz Kulesi (gise 17:00)
- bogaz_turlari Dentur ozel_not, Turyol kalkis_noktalari + ozel_not

### 4 Scheduled Task Service Role Key
- Hepsi guncellendi: sehir-hatlari-iptal-takip, havalimani-tarife-guncelle, muze-saatleri-guncelle, saraylar-saatleri-guncelle
- Saraylar skill: millisaraylar.gov.tr URL pattern duzeltildi (`/Lokasyon/{ID}/Capitalized-English-Name`)
- Havalimani skill: havabus.com URL pattern duzeltildi (`/yolcuservisi/...aspx`)

### Release Notes (Turkce)
```
v1.0.7 — Daha akici, daha sade

• Sohbet ekraninda klavye acilinca yazdiginizi net gorursunuz
• Acil ekrani sadelesti: 2021'den bu yana tum acil cagrilar tek numarada — 112
• Sifre alanlarina Goster/Gizle butonu eklendi
• Yeni e-posta dogrulama akisi, gorsel onay sayfasi
• Ana sayfa grid'i yeniden duzenlendi: IHL ve SAW ucus bilgilerine tek dokunusla
• Bogaz Turlari: Mavi Marmara eklendi, 4 firma yan yana
• Bildirim sayaci uygulama acilinca otomatik sifirlanir
• Sayfa basliklari ve menu adlari arasinda tutarlilik
• Muze/saray/cami bilgileri tek menude
• Cesitli gorsel ve performans iyilestirmeleri
```

### NOT
v1.0.7 review HIZLA onaylandi ve otomatik release edildi → sifremi unuttum bug'i ile birlikte yayina cikti. Bu nedenle sonraki release'lerde **Manuel release ZORUNLU** karari alindi.

---

## v1.0.6 (BUILD ALINDI — 24 Nisan 2026, iOS build 18 + Android build 18)

### KRITIK IAP BUG FIX (3 ayri bug)
**(BUG 1) abone-ol.tsx sessiz basarisizlik:** Satin alma sonrasi `entitlements.active['pro']` false donerse kod hicbir sey yapmiyordu (Alert yok, Supabase update yok, navigate yok). Kullanici limbo'da kaliyordu.
- **FIX:** Entitlement bulunamazsa otomatik restore deneniyor, Supabase HER DURUMDA guncelleniyor, kullaniciya basari mesaji.

**(BUG 2) use-abonelik.ts RC listener dependency:** Dependency `[aktifAbonelik]` idi. RC ilk render'da hazir degilse listener HICBIR ZAMAN eklenmiyordu.
- **FIX:** Dependency `[]`, RC hazir olana kadar 2sn arayla polling (max 30sn), listener icinde Supabase senkronizasyonu.

**(BUG 3) Supabase realtime dinleme eksik:** abone-ol.tsx Supabase'i guncelliyor ama hook bunu bilmiyordu.
- **FIX:** `abonelik-degisim` channel ile profiles tablosu UPDATE event'leri dinleniyor.

### Uc Katmanli Guvenlik Agi
Satin alma akisi: (1) RC entitlement check → (2) basarisizsa otomatik restore → (3) Supabase fallback update → (4) Supabase realtime listener ile hook otomatik guncelleme

### Turkce Karakter Duzeltmeleri (98 ADET)
- admin-saatler.tsx (41), admin-ulasim-tarife.tsx (28), canli-durum-panel.tsx (12), sohbet.tsx (3), index.tsx (3), admin-acil.tsx (3), admin-etkinlik.tsx (2), tarih-saat-secici.tsx (2), admin-saha.tsx (2), etkinlikler.tsx (1), muzeKart.tsx (1) — TAMAMLANDI

### Sozlesme Indirme Fix
- acil.tsx: WebBrowser.openBrowserAsync → Linking.openURL
- URL aysetokkus-lab.github.io → pusulaistanbul.app

### Genel Bildirim (serbest_not) Constraint Fix
- canli_durum tablosundaki CHECK constraint'e 'serbest_not' eklendi

### Build & Config
- app.json: version 1.0.6, buildNumber "17" (EAS → 18), versionCode 18

### iOS ONAYLANDI (25 Nisan 2026) — Ready for Distribution

---

## v1.0.5 (BUILD ALINDI + ONAYLANDI — 22-23 Nisan 2026)

### DARK MODE TAM DESTEK (4 Faz)
- **Faz 1:** useTema hook'u context tabanliya donusturuldu (TemaProvider), use-tema.ts → use-tema.tsx, AsyncStorage'da tercih saklama, varsayilan light
- **Faz 2a:** Onboarding ekranlari (hos-geldin.tsx, abone-ol.tsx, deneme-baslat.tsx)
- **Faz 2b:** Tab ekranlari (bogaz.tsx, ulasim.tsx, acil.tsx, muzeler.tsx)
- **Faz 2c:** Yasal ekranlar (gizlilik-politikasi.tsx, kullanim-kosullari.tsx)
- **Faz 3:** 9 admin ekrani (createStyles(t) pattern)
- **Faz 4:** Bilesenler (canli-durum-panel.tsx, etkinlikler.tsx, trafik-uyari.tsx, ulasim-uyari.tsx, tarih-saat-secici.tsx, _layout.tsx tab bar)

### Gorunum Secici (profil.tsx)
- 3'lu tema secici (Sistem/Acik/Koyu)
- AsyncStorage'da saklanir, varsayilan "Acik" (cihaz dark olsa bile light acilir)

### Diger
- Ana sayfa gorsel temizlik: hardcoded shadow/border kaldirildi
- Giris ekrani logo fix: logo.svg → logo-icon.png + tintColor={t.accent}
- Giris ekrani alt yazi: "Dijital Pusulasi" → "Dijital Asistani"
- RevenueCat merkezi init (revenueCatInit + revenueCatLogin)
- Hesabi sil akisi duzeltildi (yaniltici metin kaldirildi)
- Cift X senkronu duzeltildi (tek global timer _layout.tsx'e tasindi)
- X API deduplication (module-level mutex + 30sn minimum aralik)
- Bildirim yanlış tablo fix (ulasim_tarifeleri silinmis → havalimani_seferleri + bogaz_turlari)
- Sohbet bildirim alan fix (y.icerik → y.mesaj || y.icerik)
- Tab bar safe area fix (insets.bottom)
- Etkinlik tip harfleri (TIP_SIMGE) tamamen kaldirildi
- Ana sayfa "Iyi turlar" sabit yazisi kaldirildi
- Supabase Security Advisor temizligi (search_path, security_invoker)

### Build
- iOS build 14, Android build 15 (22 Nisan 2026)
- App Store ONAYLANDI (23 Nisan 2026) — 6 reject sonrasi NIHAYET
- Google Play Alpha v1.0.5 yayinlandi (23 Nisan 2026)

---

## v1.0.4 (BUILD ALINDI — 17 Nisan 2026, iOS build 12 + Android build 13)

### REJECT SAYISI: 6 (Apple)
- Reject 1 (v1.0): 2.1.0 Performance — demo hesap sifresi
- Reject 2 (v1.0.1): 1.2.0 Safety: UGC + 3.1.1 IAP Restore Purchases
- Reject 3 (v1.0.2): Guideline 4 (iPad Design) + 3.1.1 (IAP) + 2.1 (Demo) + 2.1(b) (IAP not submitted)
- Reject 4 (v1.0.3): 2.1(b) (IAP "subscription being prepared") + 3.1.2(c) (EULA missing)
- Reject 5 (v1.0.4 ilk submit): TEKRAR 2.1(b)
- Reject 6 (v1.0.4 ikinci submit, 20 Nisan): 2.1(b) — IAP purchase failed (iPad Air M3) — **Paid Apps Agreement "Pending User Info" idi, vergi formlari eksikti**

### Cozumler
**KOD:**
- ENTITLEMENT_ID 'premium' → 'pro' (lib/revenuecat.ts) — RC dashboard ile esleme
- abone-ol.tsx fallback satin alma (Purchases.getProducts + purchaseStoreProduct)

**APP STORE CONNECT:**
- Custom License Agreement (EULA) eklendi — Turkce + Ingilizce
- **Subscription Group Localization** eklendi — Turkish "Pusula İstanbul Premium" (BU MISSING METADATA'NIN ASIL SEBEBIYDI!)
- Subscription'lar "Ready to Submit" oldu, version sayfasina baglandi
- Subscription siralama: Yillik=Level 1, Aylik=Level 2 (descending)
- Description freemium guncellendi
- Review Notes guncellendi

**BUSINESS (20 Nisan 2026):**
- W-8BEN vergi formu (Turkey, Article 12(2), %10 withholding, TC Kimlik No)
- U.S. Certificate of Foreign Status (Individual/Sole proprietor)
- Banka hesabi Active → Paid Apps Agreement "Active"

**GITHUB PAGES:**
- docs/index.html Bolum 4 (freemium) + Bolum 6 (moderasyon) guncellendi

### Kapsamli Turkce Karakter Duzeltmesi (v1.0.3 build'de YOKTU, v1.0.4'e girdi)
- index.tsx, trafik-uyari.tsx, ulasim-uyari.tsx, admin.tsx, admin-acil.tsx, admin-saatler.tsx, admin-ulasim-tarife.tsx, admin-saha.tsx

### Build & Config
- app.json: version 1.0.4, versionCode 12, buildNumber "11"
- 12 test kullanicisi premium yapildi (Supabase SQL ile abonelik_bitis 2027-01-01)

### Etkinlik Tip Harfleri Kaldirildi (20 Nisan)
- etkinlikler.tsx'den TIP_SIMGE objesi tamamen silindi
- Etkinlik detay modal baslik iyilestirildi (fontSize 18→20)

### Supabase Security Advisor Temizligi (20 Nisan)
- 3 fonksiyona search_path=public eklendi
- v_canli_durum view security_invoker=on yapildi

---

## v1.0.3 (BUILD ALINDI + REJECT EDILDI — 16 Nisan 2026)

### FREEMIUM MODELE GECIS (15 Nisan 2026)
Apple 4x reject sonrasi is modeli tamamen degistirildi:
- 7 gunluk deneme KALDIRILDI
- premiumMi flag eklendi
- denemeSuresi/paywallGoster daima false
- Kayit/giris zorunlulugu kaldirildi (uygulama direkt /(tabs)'a acilir)

### Degisiklikler
- **hooks/use-abonelik.ts:** Tamamen yeniden yazildi
- **app/_layout.tsx:** Freemium routing — initialRouteName daima "(tabs)"
- **app/hos-geldin.tsx:** UCRETSIZ_OZELLIKLER (3 kart, mavi accent) + PREMIUM_OZELLIKLER (3 kart, mor accent #7B2D8E)
- **app/deneme-baslat.tsx:** 205 satirlik ekran → sadece redirect
- **app/(tabs)/index.tsx:** Premium gate (canli durum, ulasim uyari, trafik, etkinlikler)
- **app/(tabs)/sohbet.tsx:** Premium gate + gorsel "..." aksiyon butonu (iPad Guideline 4)

### Paywall Duzeltmeleri (16 Nisan)
- abone-ol.tsx: Baslik "Dijital Asistanınızı Kesintisiz Kullanın", buton "Pusula İstanbul'u Aktifleştir"
- Radio button bug fix (secilmeyen plan bos daire)
- Esit kart genisligi (minHeight:180)
- Fiyat overflow fix (fontSize 24, adjustsFontSizeToFit)
- Yasal kabul metni eklendi
- Tum Alert'ler Turkce karakterli
- "Geri Dön" butonu (eski "Cikis Yap" yerine)

### Kapsamli Emoji Temizligi (16 Nisan — TUM DOSYALAR)
- index.tsx: NAMAZ_ETIKETLERI, HIZLI_ERISIM, hava ikonu, PARA_BIRIMLERI bayrak/kod, mevsim/fiyat/doviz/hata
- giris.tsx: warning/check emojiler
- etkinlikler.tsx: TIP_EMOJI → TIP_SIMGE (harf), varsayilan '📌' → 'E'
- hello-wave.tsx: el sallama
- muzeler.tsx: kategori tipi yazisi (kartTip/modalTip)

### Build & Config
- app.json: version 1.0.3, versionCode 10, buildNumber "9"
- APPLE-CEVAP-v1.0.3.md: 4 guideline cevap metni
- supabase-demo-hesap.sql: Demo hesap SQL'i

### REJECT EDILDI (16 Nisan)
Guideline 2.1b + 3.1.2c — v1.0.4'te cozuldu

---

## v1.0.2 (BUILD ALINDI — 15 Nisan 2026, Android surumkodu 9, iOS build 8)

### Apple 1.2 UGC Uyumlulugu
- Sohbete kullanici engelleme: uzun basma action sheet (Raporla + Engelle)
- engellenen_kullanicilar tablosu olusturuldu
- engellenenIdler state (Set), anlik UI filtreleme

### Apple 3.1.1 IAP Uyumlulugu
- "Satin Almalari Geri Yukle" butonu paywall + profil ekranina (Purchases.restorePurchases)

### Kullanim Kosullari Guncellendi
- Sifir tolerans politikasi
- Icerik raporlama+engelleme arac listesi
- 24 saat moderasyon taahhudu

### Build & Config
- app.json: version 1.0.2, versionCode 8 (EAS 9), buildNumber "7" (EAS 8)

### Havalimani Veri Pipeline'i Kuruldu (15 Nisan)
- Firecrawl ile havabus.com + bilet.hava.ist scrape
- Havabus 4 rota (Taksim 440TL, Kadikoy 270TL, Yenisahra 270TL, Sakarya 500TL)
- Havaist 8 hat fiyat guncellendi
- havalimani_seferleri tablosu UPDATE
- Yanlis ulasim_tarife tablosu DROP edildi
- bogaz_turlari'na yanlis eklenen 11 havalimani kaydi silindi

### Engelleme Sistemi (15 Nisan)
- engellenen_kullanicilar tablosu (id, engelleyen_id, engellenen_id, engellenen_isim, sebep, olusturulma_tarihi, bildirildi)
- Index'ler ve RLS policy'leri
- Realtime publication

---

## v1.0.1 (BUILD ALINDI — 12 Nisan 2026, Android versionCode 7, iOS buildNumber 6)

### Mekan Yonetimi
- muzeler.tsx: Camilerde muzekart bolumu gizlendi (`secili.tip !== 'cami'`)
- muzeler.tsx: getGise() mevsimsel yaz/kis gise saatini destekliyor
- admin-saatler.tsx: Mevcut mekan isim degistirme + silme butonu
- admin-saatler.tsx: yaz_gise_kapanis ve kis_gise_kapanis input alanlari
- admin-saatler.tsx: Muzekart key degerleri duzeltildi ('gecerli'/'gecmez')
- hooks/use-mekan-saatleri.ts: yaz_gise_kapanis ve kis_gise_kapanis interface

### UI Iyilestirmeleri
- giris.tsx: Alt metin "Profesyonel Turist Rehberinin Dijital Pusulasi"
- giris.tsx: Turkce karakter duzeltmesi
- hooks/use-bildirim-tercihleri.ts: ulasim + trafik kategorileri Turkce karakter
- muzeKart.tsx: Gecmeyen yerler listesinden yabanci fiyat kaldirildi
- sohbet.tsx: Mesaj tarih gosterimi (Bugun/Dun/Bu hafta/Eski)
- trafik-uyari.tsx: Gosterim suresi 24 saat → 2 saat

### Saha Bildirimleri
- DURUM_SECENEKLERI emoji → simge (●/◐/✕/⚙ Unicode)
- canli-durum-panel.tsx: Tum emoji gosterimleri kaldirildi
- Saha bildirimi sabitleme ozelligi (admin pin/unpin — sabitlendi kolonu + SABIT badge)
- "Erken Kapanacak" ve "Gec Acilacak" durum tipleri eklendi
- v_canli_durum view yeniden olusturuldu

### Veritabani
- 7 yeni muze eklendi (havalimani_muze, islam_bilim, mehmet_akif, hafiza_15_temmuz, adam_mickiewicz, turbeler_muze, sinema_muze)
- Fiyatlar dosim.ktb.gov.tr'den guncellendi
- Mevsimsel yaz/kis saatleri eklendi (5 muze)
- Saraylar yaz saatine gecirildi (12 Nisan)
- Muzeler kis saatinde (1 Mayis'ta gecilecek)
- Galata Kulesi kapanis saati: 18:14 → 18:00

### Cozuldu Tespiti Bug Fix (13 Nisan)
- X API tweet'leri eskiden yeniye siralanarak isleniyor (use-x-ulasim.ts)

### EAS
- EAS env komutu ile X Bearer Token guncellendi (eas secret deprecated → eas env:create)
- v1.0.1 Android (versionCode 7) + iOS (buildNumber 6) build alindi

---

## v1.0.0 (BUILD 2-4 — 6-7 Nisan 2026)

### Ilk Production Build
- iOS production build tamamlandi (EAS Build)
- iOS IPA App Store Connect'e yuklendi (Waiting for Review — 6 Nisan)
- Google Play kapali test (Alpha) aktif — v1.0.0 build 4, Turkiye, 11 test kullanicisi (7 Nisan)

### Apple Developer & Play Console Kurulum
- Apple Developer Program (Turkiye: Utilities, 1029 TL)
- Google Play Console hesabi ($25 odendi)
- Apple Developer aktif (Team ID: 7UJVL94SMJ)
- Google Cloud Service Account + JSON key
- Play Console'a service account eklendi
- RevenueCat kurulumu (Products, Entitlements, Offerings)
- App Store Connect aboneli tanimlari (aylik + yillik)
- Play Console abonelikler (aylik + yillik)
- Google Payments odeme profili
- Production AAB build + Play Console'a yukleme (build 2)
- RevenueCat'te Play Store urunleri import + Offering'lere baglandi
- App Store Description, Promotional Text, Keywords, Support URL, Marketing URL, Categories, Age Rating

### Yardimci Altyapi
- GitHub Pages aktif (gizlilik politikasi + kullanim kosullari)
- IARC icerik derecelendirmesi alindi (12+)
- Play Console uygulama icerigi beyanlari tamamlandi (11/11)

### Reject 1 (v1.0 build 4 — Apple)
2.1.0 Performance: App Completeness — demo hesap sifresi sorunu

---

## ILK TEMEL OZELLIKLER (Surum 1.0 Oncesi — Mart-Nisan 2026)

### Uygulama Iskeleti
- Temel yapisi (tabs, navigation, tema)
- Supabase entegrasyonu (auth, profiles, realtime)
- Muze canli durum sistemi
- Rehber sohbet odasi (realtime + kufur filtre + screenshot koruma)
- Admin panel (etkinlik, moderasyon, ban, kufur)
- Ulasim bildirim sistemi
- Abonelik altyapisi (Supabase migration)

### Ekranlar
- Onboarding akisi (3 ekran: hos-geldin, deneme-baslat, abone-ol)
- Giris ekrani (logo, sifre tekrar)
- KVKK gizlilik politikasi + kullanim kosullari
- _layout.tsx routing korumasi
- Profil ekraninda abonelik durumu

### Mekan Yonetimi
- Admin mekan saatleri sistemi (muze/saray/cami — Supabase tablosu + admin)
- Admin ulasim tarife sistemi (havalimani + bogaz turlari)
- Mevsim gecis sistemi (yaz/kis tek tusla)
- 32 muze/saray + Sultanahmet Camii + 3 bogaz sirketi + 6 havalimani duragi seed data

### Bildirim Sistemi
- Bildirim tercihleri (5 kategori: ulasim, saha durumu, etkinlikler, sohbet, admin)
- Sohbet okunmamis mesaj badge
- Birlesik bildirim sistemi (use-bildirimler.ts — 6 kategori)
- Trafik bildirim kategorisi (IBB Ulasim ayrildi)
- Trafik ve Yol Durumu bandi ana sayfaya
- Bildirim tercihleri senkronizasyonu (in-memory listener)

### X API Entegrasyonu
- 4 ulasim hesabindan tweet cekme
- Hat tespiti (M1-M14, T1-T5, F1-F4, TF1-TF2, Marmaray, Metrobus, Kopru, E-5, TEM)
- Tip tespiti (ariza/kesinti/gecikme/bilgi/duyuru)
- IBB Ulasim Yonetim Merkezi (@4444154) eklendi
- ulasim_uyarilari tablosu + senkronizasyon hook'u (use-x-ulasim.ts)

### Diger
- Acil durum sayfasi dinamik Supabase verisi + admin ekrani
- Galataport gemi takvimi (cruisetimetables.com — sonra Supabase'e tasindi)
- Arama sayfasi dinamik
- MuzeKart sayfasi dinamik
- Isim degisikligi siniri (ayda 1) + isim_gecmisi tablosu
- Cozuldu tespiti — "normale donmustur" ile otomatik kapanis
- Moderator atama sistemi (admin panelden email ile)
- Moderator yetki kisitlamasi (admin-saatler.tsx)
- Header gradient tutarliligi
- Profil hakkinda metni
- EAS Build yapilandirmasi (development/preview/production profilleri)
- Custom config plugin: plugins/fix-buildconfig.js
- Sohbet realtime iki yonlu (polling + Supabase Realtime)
- sohbet_mesajlari Supabase Realtime publication'a eklendi
- supabase-migration-acil-rehber.sql (12 kayit seed data)
- supabase-migration-ulasim-uyarilari.sql (RLS + Realtime)
- Canva ile logo, adaptive icon, splash screen
- Profil ekrani profesyonellesti (Sifre Degistir, Hesabi Sil, Geri Bildirim)
- Admin saha bildirimleri yonetim ekrani (admin-saha.tsx)
- Iletisim email'i info@pusulaistanbul.app
- GitHub'a kod push (gh CLI)
- Saha bildirimi realtime fix
- Etkinlikler realtime subscription (INSERT/UPDATE/DELETE + 15sn polling)
- Sohbet mesaj raporlama UI (uzun basma → raporlama dialog)
- Tarih-saat secici bilesen (takvim grid + saat/dakika)
- Admin etkinlik formu tarih girisi (gorsel picker)
- etkinlikler tablosu Supabase Realtime publication'a eklendi
- Ayasofya/Kariye kategori muzeler → camiler
- Camilerde muzekart bolumu gizlendi
- Mevsimsel gise kapanis saati (yaz_gise_kapanis, kis_gise_kapanis)
