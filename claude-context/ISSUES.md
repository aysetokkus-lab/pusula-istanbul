# Pusula Istanbul - Bilinen Sorunlar ve Cozumleri

Bu dosya tum cozulmus bug'larin kaydi — yeni bir bug ile karsilastiginda once buraya bak, ayni dert tekrar etti mi?

---

## DIKKAT EDILECEKLER (Genel)

- Expo Go'da SVG `tintColor` calisiyor (expo-image ile)
- `react-native-svg-transformer` yuklenmis ama metro.config.js gerekebilir
- **Supabase email confirmation ACIK** (25 Nisan 2026 itibariyle)
- 3 ozel ekran (hos-geldin, deneme-baslat, abone-ol) dark mode destekli ama gradient header sinirli fark yapar
- Node 20 GEREKLI (v24 uyumsuz): `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"`
- Development build icin Metro: `npx expo start --dev-client`
- app.json: `newArchEnabled: true` (reanimated 4.x zorunlu), `reactCompiler` KALDIRILDI
- expo-screen-capture plugins'den CIKARILDI (plugin.js yok)
- **Expo Go ARTIK CALISMAZ** — uygulamada native modules var. Custom dev client gerekir.
- **Service role key sadece scheduled task'lar icin** (.env'de SUPABASE_SERVICE_ROLE_KEY, EXPO_PUBLIC_ prefix YOK)

---

## COZULMUS SORUNLAR

### Auth & Session
1. **Paywall race condition (v1.0)** — Yeni kayit olan kullaniciya paywall gosteriliyordu → useAbonelik'e auth state listener eklendi
2. **Console error "REPLACE giris not handled"** — `router.replace('/giris')` navigator hazir olmadan cagriliyordu → Gereksiz replace kaldirildi, initialRouteName kullanildi
3. **Foreign key constraint (kullanici silme)** — `sohbet_mesajlari` referansi → Sirasiyla sohbet_mesajlari > profiles > auth.users silinmeli
59. **Kayit ekrani loading'de kaliyordu (25 Nisan 2026)** — Email confirmation acikken signUp sonrasi session null geliyor, profil INSERT RLS'e takiliyordu → `if (data.session)` kontrolu eklendi, session yoksa profil INSERT atlanir, profil ilk giriste metadata'dan olusturulur
60. **Supabase Site URL localhost:3000 (25 Nisan 2026)** — Email dogrulama linkleri localhost:3000'a yonlendiriyordu → Site URL: https://pusulaistanbul.app olarak degistirildi
56. **KRITIK: IAP satin alma sonrasi premium aktive olmuyor (23 Nisan 2026)** — 3 ayri bug (sessiz basarisizlik + RC listener + Supabase realtime eksik) → bkz. DECISIONS.md "3 Katmanli Guvenlik Agi"

### Sifre Sifirlama (v1.0.7-1.0.9)
- v1.0.7'de eklendi (sifre-sifirla.tsx + deep link handler) AMA Apple onayi sonrasi bug fark edildi
- v1.0.8'de Stack mount race (pending pattern OLMADAN) cozum denendi → tutmadi
- v1.0.9'da Pending Pattern ile **kalici cozum** → bkz. DECISIONS.md "Pending Pattern"

### EAS Build & Deploy
4. **SQL migration syntax error** — Dosya adi yapistirilmis icerik yerine → Gercek SQL kodu verildi
5. **EAS Build BuildConfig hatasi** — expo prebuild package declaration mismatch → `plugins/fix-buildconfig.js` config plugin
23. **EAS secret deprecated** — `eas secret:*` artik calismaz → `eas env:*` kullan. EXPO_PUBLIC_ prefix `--visibility secret` kabul etmez → `--visibility sensitive`
24. **Google Play eas submit izin hatasi** — Service account izinleri propagasyonu yavas → Manuel Play Console'dan yukleme
25. **Android "already submitted" hatasi** — eas submit basarisiz gibi gorundugu halde aslinda Draft yuklenmis → Play Console'dan manuel yayinla

### Sohbet & Realtime
6. **Sohbet realtime tek yonlu** — Supabase Realtime event aliyor ama FlatList guncellenmiyor → setTimeout + setGuncelSayac + extraData + 5sn polling yedegi
7. **sohbet_mesajlari Realtime yok** — Tablo supabase_realtime publication'da degil → ALTER PUBLICATION ile eklendi
8. **Saha bildirimi realtime gecikme** — durumBildir() sonrasi liste guncellenmiyor → await durumlariCek() eklendi
11. **Etkinlik silme/ekleme realtime yok** — useEtkinlikler'de subscription yoktu → Realtime + 15sn polling eklendi
- **Sohbet klavye altinda kalma fix (v1.0.7)** — KeyboardAvoidingView en dis container'a tasindi, Android behavior 'undefined' → 'height', textAlignVertical='top'

### Bogaz Turlari
9. **Dentur fiyat admin'den guncellenemiyor** — Admin modali sadece fiyat+saatler gosteriyordu → Modal genisletildi (kalkis_noktalari, kalkis_yeri, ozel_not, hafta sonu saatleri)
10. **Yeni bogaz turu yanlis sirket_id** — Otomatik uretim Turkce karakterlerle bozuluyordu → Zorunlu sirket_id input alani

### Admin Mekan Yonetimi
12. **Admin mekan formu yanlis tip/kapali_gun** — Serbest metin girisi hataya acikti → Buton seciciler eklendi
14. **Camiler muzekart "Gecmez" gosteriyor** — muzekart NULL oldugunda default "Gecmez" → `tip !== 'cami'` kontrolu ile camilerde muzekart bolumu gizlendi
15. **Admin panelden mekan isim degistirilemiyor/silinemiyor** — Sadece saatler duzenlenebiliyordu → isim duzenleme input'u + silme butonu
16. **Mevsimsel gise saati duzenlenemiyor** — Sadece acilis/kapanis vardi → yaz_gise_kapanis ve kis_gise_kapanis alanlari
22. **Muzekart admin constraint hatasi** — admin-saatler.tsx 'Muzekart gecer' gonderiyordu, constraint 'gecerli' bekliyordu → Uc katmanli fix: kod + constraint genislet + normalize trigger
26. **Muzeler yanlis mevsim gosterimi** — mevsimsel=true yapildiginda aktif_mevsim='yaz' (saraylar icin gecirilmisti) → Muzeler icin ayri `UPDATE ... SET aktif_mevsim='kis'`

### Ana Sayfa & Ekranlar
13. **Android splash renk uyumsuzlugu** — Adaptive icon bg #0077B6 vs splash bg #005A8D → Hepsi #005A8D
17. **Sohbet mesajlari tarih gostermiyor** — Tum mesajlarda sadece saat → Bugun/Dun/Gun/Tarih akilli format
18. **Bildirim tercihleri Turkce karakter eksik** — ulasim ve trafik kategorilerinde ASCII → Turkce karakter
19. **Trafik uyarilari cok uzun suruyor** — 24 saat → 2 saate
20. **Muzekart gecmeyen yerler yabanci fiyat** — Muzekart sadece TC vatandasi ile ilgili → Yabanci fiyat kaldirildi
21. **Giris ekrani alt metin** — "Profesyonel Rehber Uygulamasi" → "Profesyonel Turist Rehberinin Dijital Pusulasi" → "Dijital Asistani" (v1.0.5)
- **Ana sayfa sabit "Iyi turlar" yazisi** — Dinamik selamlama zaten var → wishlText satiri silindi (20 Nisan)
- **Etkinlik tip harfleri cirkin** — TIP_SIMGE (M/Y/B/D/R/F/E) kullaniciya anlamsiz → Tamamen kaldirildi (20 Nisan)
- **8'li grid sadelestirme (v1.0.7)** — Muze butonu kaldirildi (Saraylar ile aynı), "Saraylar" → "Muze · Saray · Cami" label, "Gemi Tarihleri" kaldirildi (duplicate), IHL/SAW Ucuslari eklendi
- **Acil ekrani 5'li grid kaldirildi (v1.0.7)** — 110/155/156/158 hepsi 2021'den beri 112'ye yonlendiriliyor → Tek BUYUK 112 karti

### X API & Ulasim Uyarilari
27. **Cozuldu tespiti calismiyor** — X API tweet'leri en yeniden eskiye donduruyor, ayni batch'te ariza+cozum gelince "normale donmustur" once isleniyor → Tweet'ler eskiden yeniye siralanarak isleniyor
53. **Cift X API senkronizasyonu** — ulasim-uyari.tsx ve trafik-uyari.tsx bagimsiz useXUlasim() + setInterval → Bilesenlerdeki senkron kaldirildi, tek global timer _layout.tsx'e tasindi
- **X API deduplication (v1.0.5)** — Module-level mutex + 30sn minimum aralik (use-x-ulasim.ts)
79. **X API senkronu sadece app aciksa calisiyor** (6 May 2026) — `hooks/use-x-ulasim.ts` her 15 dk'da bir cagriliyordu AMA sadece kullanici uygulamayi acmissa. 6 May 15:00'te Marmaray Fatih intihar arizasi → 16:18'de "cift hattan isletilmeye baslanmis" duzelme tweet'i Marmaraytcdd'den geldi → 33 dk sonra Ayse uygulamayi actiginda hala arizali gorunuyordu. Cunku o 33 dk'da kimse app'i acmamis, duzelme tweet'i hic ingest edilmemisti. Geriye donuk: 13 Nis, 9 Nis, 7 Nis, 31 Mart Marmaray "uzucu olay" arizalarinin hicbiri otomatik kapatilmamis. → **Cozum:** `supabase/functions/ulasim-senkron/index.ts` Edge Function olarak port edildi, `pg_cron` ile `*/15 * * * *` schedule kuruldu. Bot artik server-side, kullanici sayisindan bagimsiz. Bkz. DECISIONS #36.
80. **EXPO_PUBLIC_X_BEARER_TOKEN bundle'a gomulu** (6 May 2026) — `lib/config.ts` line 10: `EXPO_PUBLIC_X_BEARER_TOKEN`. Expo'da bu prefix env'i client bundle'ina gomuyor. APK decompile riski. → **Cozum:** Twitter'da bearer token Regenerate (eski otomatik gecersiz oldu), yeni token sadece Supabase Edge Function secret'a kondu. Mevcut bundle'lar artik gecersiz token tasiyor — zararsiz no-op (UNIQUE constraint dedup yapar). v1.1.0 build'inde `EXPO_PUBLIC_X_BEARER_TOKEN` EAS env'den silinecek, `lib/config.ts`/`hooks/use-x-ulasim.ts` temizlenecek.
81. **Geriye donuk Marmaray arizalari cozuldu=false kaldi** (6 May 2026) — Bot bug'i 5 Marmaray "uzucu olay" arizasi kaydini birakmisti (aktif=false ama cozuldu=false), veri tutarsizligi. → **Cozum:** Toplu UPDATE `cozuldu = true, cozulme_tarihi = COALESCE(cozulme_tarihi, tarih + interval '90 minutes')` Marmaray arizalari icin + benzeri tum hatlar icin 24h+ eski aktif=false ariza/gecikme/kesinti kayitlari icin.

### Havalimani Ulasim Veri Pipeline
28. **Havalimani verisi yanlis tabloya eklendi (bogaz_turlari)** — 11 Havaist/Havabus kaydi yanlis tabloya → REST API DELETE
29. **Yanlis ulasim_tarife tablosu olusturuldu** — Hook havalimani_seferleri kullaniyor, SQL migration dosya adindan yanlis cikarim → DROP TABLE
31. **jsonb vs text[] tip uyumsuzlugu** — sehirden_hav/havdan_sehir kolonlari jsonb tipinde → `'["03:00","03:30"]'::jsonb`
32. **Tepeustu duragi bos** — Anahat degil, durak — 0 sefer ve veri yok → Silindi
33. **Besiktas fiyat NULL** — UPDATE'de spesifik komut yazilmamisti → 426TL olarak guncellendi (15 Nisan)

### Paywall (abone-ol.tsx)
34. **Radio button bug** — Secilmeyen plan da secili gorunuyordu → Secilmeyen plan bos daire `<View style={styles.planRadio} />`
35. **Fiyat overflow** — 699 TL/yil fiyati kucuk ekranlarda tasiyordu → fontSize 28→24, numberOfLines={1}, adjustsFontSizeToFit
36. **Esit olmayan kart genislikleri** — Aylik ve yillik plan farkli yukseklikte → minHeight: 180, justifyContent: 'center'
42. **abone-ol.tsx "Ödeme sistemi hazırlaniyor" hatasi** — RC offerings yuklenemeyince paket null kaliyor → Fallback: `Purchases.getProducts + purchaseStoreProduct` (v1.0.4)

### RLS & RevenueCat
30. **RLS policy'de 'role' yerine 'rol'** — profiles tablosunda kolon adi `rol` (Turkce) → Policy'ler `rol` ile yazilmali (bkz. DECISIONS.md)
41. **RevenueCat ENTITLEMENT_ID uyumsuzlugu** — lib/revenuecat.ts'de 'premium', RC dashboard'da 'pro' → 'pro' olarak duzeltildi (v1.0.4)

### Apple App Store
43. **App Store IAP subscriptions version'a baglanmamis** — Subscription urunleri "Missing Metadata" → Subscription Group Localization eklendikten sonra "Ready to Submit" oldu (bkz. DECISIONS.md)
44. **App Store EULA linki eksik (Guideline 3.1.2c)** — Auto-renewable subscription icin Terms of Use linki metadata'da olmali → Custom License Agreement (Turkce + Ingilizce) App Information > License Agreement
45. **wttr.in API kesintisi** — Hava durumu servisi "weather data source not available" → Kod hatasi degil, dis servis sorunu, kendisi duzelecek
46. **Subscription "Missing Metadata" asil sebebi** — Subscription GROUP Localization eksik (bkz. DECISIONS.md)
47. **IAP purchase failed (6. reject — 20 Nisan 2026)** — Reviewer iPad Air M3'te satin alma yapamiyor → Kod sorunu DEGIL, Paid Apps Agreement "Pending User Info" idi (bkz. DECISIONS.md)

### Sifre Sifirlama Akisi (v1.0.8 → v1.0.9)
- v1.0.8: Stack mount race tespit edildi, fix denendi ama tutmadi
- **v1.0.9: Pending Pattern (DECISIONS.md #1)** — kalici cozum

### Freemium Model Gecisi (v1.0.3)
37. **kullanim-kosullari.tsx eski deneme referansi** — Bolum 4'te "7 günlük ücretsiz deneme" hala yaziyordu → Tamamen freemium aciklamasiyla degistirildi
38. **profil.tsx eski deneme UI** — `denemeSuresi ? 'Deneme' : 'Pasif'` → `premiumMi ? 'Premium' : 'Ücretsiz'`
39. **Tum kodda emoji kalintilar** — v1.0.1/v1.0.2'de temizlenemeyen → v1.0.3'te kapsamli tarama
40. **muzeler.tsx kategori tipi gosterimi** — Kart ve modal'da "ozel_muze", "saray" gibi teknik tip → kartTip/modalTip render satiri silindi

### Supabase Security
50. **Function Search Path Mutable** — eskiyen_durumlari_kaldir, is_admin_or_mod, muzekart_normalize → `ALTER FUNCTION ... SET search_path = public`
51. **Security Definer View** — v_canli_durum view SECURITY DEFINER ile tanimli, RLS atliyor → `ALTER VIEW ... SET (security_invoker = on)`

### Logo & Asset
52. **Giris ekrani logo gorulmuyor** — logo.svg beyaz, feColorMatrix filtreleri tintColor'u override ediyor → splash-icon.png'den kirpilmis logo-icon.png + tintColor={t.accent}

### Dark Mode (v1.0.5)
54. **Dark mode beyaz cizgiler** — Hardcoded #004E7A border, #003D5C shadow, rgba 3D efektler → t.divider ve t.kartShadow
55. **Sistem dark mode zorlama** — Cihaz dark mode'dayken uygulama dark aciliyordu → Varsayilan 'acik', kullanici profilden secmedikce light kalir

### Sozlesme Indirme & Genel Bildirim
57. **Sozlesme indirme basarisiz (24 Nisan 2026)** — acil.tsx'de docx linkleri WebBrowser.openBrowserAsync, eski URL → Linking.openURL + pusulaistanbul.app URL'i (v1.0.6)
58. **Genel Bildirim (serbest_not) calismiyordu (24 Nisan 2026)** — Kod hazirdi ama canli_durum CHECK constraint'e 'serbest_not' eklenmemisti → ALTER TABLE

### Saha Bildirimleri (v1.0.8 SQL fix'leri)
- **Admin baskasinin bildirimini "Kaldir" basamiyor** — UPDATE policy sadece bildirimi yapan kullaniciya izin veriyordu → `is_admin_or_mod()` ile ek policy
- **Sabitlenen bildirim 2 saat sonra kayboluyor** — `eskiyen_durumlari_kaldir()` cron sabitlendi=true bildirimleri de temizliyordu → WHERE clause'a `AND COALESCE(sabitlendi, false) = false`

### Detay Modal & UI
61. **Bildirim kartlari tiklanamiyordu (25 Nisan 2026)** — DurumKartKucuk plain View, not_metni numberOfLines={1} ile kesiliyordu → DurumDetayModal bilesen, kartlar TouchableOpacity (v1.0.7)
62. **Google Play opt-in linki yanlis kullanildi (25 Nisan 2026)** — `play.google.com/apps/testing/...` calismiyor → Dogru: `https://play.google.com/store/apps/details?id=com.pusulaistanbul.app`. Ders: link uydurmak yerine Play Console'dan dogrulanmali.
- **Cikis Yap fix (v1.0.8)** — `cikisYap` sadece signOut() cagiriyordu, local state guncellenmiyordu → setKullanici(null) + router.replace('/giris')
- **Saha karti not_metni 1 satira kesiliyor (v1.0.8)** — `numberOfLines={1}` → `numberOfLines={2}`
- **durumKaldir sessiz fail (v1.0.8)** — RLS sessiz reddederse data.length === 0 olur → `.select()` ile kontrol, kullaniciya mesaj (bkz. DECISIONS.md "RLS Sessiz Reddedebilir")

### 1 Mayis 2026 — Yayin Gunu Cozulen Sorunlar

63. **Play Store Yillik Plan config bug (1 Mayis 2026)** — `com.pusulaistanbul.app.yillik` urununun base plan'i (`yillik`) AYLIK fatura donemi olarak konfigure edilmisti, halbuki Yillik Plan olarak satiliyordu. Kullanicilar yillik 699,99 TL bekleyerek aboneliyor, ay sonunda tekrar 699,99 TL kesilecekti (12x amaclanan). 2 musteri etkilendi (Mustafa Tanribilir, Sebnem Buyukkaragoz). **Cozum:** Yeni `yillik-yeni` base plan olusturuldu (Yillik dönem, 699,99 TL), eski `yillik` devre disi birakildi, RC offering yeni urune yonlendirildi. Etkilenenlere refund + 1 yil ucretsiz premium grant. Detay: DECISIONS.md #27.

64. **abone-ol.tsx + profil.tsx — "Apple ID" hardcoded UX bug (1 Mayis 2026)** — Restore purchases akisinda "Aktif Abonelik Bulunamadi" Alert metninde "Bu Apple ID ile..." hardcoded. Android kullanicilar yanlis platform jargonu goruyordu. **Cozum:** Iki dosyada da generic "Hesabiniz ile..." metni. v1.0.11'de yayina cikacak. Detay: DECISIONS.md #27 sondaki ders.

65. **Sebnem'in profili kismi NULL durumu (1 Mayis 2026)** — Yillik plan satin almasi sonrasi profile'da abonelik_durumu='aktif' set olmus ama abonelik_plani ve abonelik_bitis NULL kalmis. 3-Katmanli Guvenlik Agi'nin (DECISIONS.md #4) bir varyanti — kismi sync. **Cozum:** Manuel SQL UPDATE ile dolduruldu. v1.1.0'da abone-ol.tsx audit yapilacak (atomik update tum alanlari beraber set etmeli). Detay: DECISIONS.md #30.

66. **Orcun'un satin alma akisi: banka karti bloke etti (1 Mayis 2026)** — Restore purchases denerken yeni satin alma tetiklendi, banka guvenlik filtresi cekimi bloke etti. Para kayip yok ama kullanici teknik akista takildi. **Cozum:** Hesabini Supabase admin yetkisiyle olusturduk, manuel premium grant 1 yil. Detay: DECISIONS.md #28.

67. **CLAUDE.md'de yanlis entitlement adi (1 Mayis 2026 fark edildi)** — CLAUDE.md "RC Entitlement: pro" yaziyordu, gercekte lib/revenuecat.ts'te `ENTITLEMENT_ID = 'premium'`. **Cozum:** CLAUDE.md guncellendi, dogru entitlement: 'premium'. DECISIONS.md #19'da da bu eski bilgiye atif var, oraya da not eklendi.

### 3 Mayis 2026 — use-abonelik.ts NULL Profile Sistematik Bug

68. **use-abonelik.ts RC senkronizasyonunda eksik alan yazimi (3 Mayis 2026)** — Hook'un iki yerinde (line 100-105 RC dali + line 173-175 RC listener callback) RC entitlement aktif kullanici icin Supabase'e SADECE `abonelik_durumu='aktif'` yaziliyordu, `abonelik_plani` ve `abonelik_bitis` NULL kaliyordu. Sonuc: 6 kullanicida (Selim/Nadriye/Betul/Ebru + 2 dev hesap) yarim profile. Sebnem'in (1 May) durumu da ayni desende — race condition yorumu yanlismis. **Cozum (v1.0.11):** `planFromProductId()` helper, `rcAbonelikKontrol()` zenginlestirildi, iki yerin de update'i durumu+plan+bitis hepsini yaziyor (idempotent reconciler — sadece eksik/farkli alanlari). Detay: DECISIONS.md #31.

69. **Ebru/Betul/Nadriye/Selim — manuel SQL doldurma (3 Mayis 2026)** — v1.0.11 yayina cikmadan once 4 etkilenen kullanicinin profile alanlari RC verisinden manuel SQL ile dolduruldu (atomic transaction). RC'de hepsinin satin alma kayitlari tarandi: hepsi iOS Apple App Store, ikisi yillik (Ebru, Betul → 2027-05 bitis), ikisi aylik (Nadriye, Selim → 2026-06 bitis). 2 dev hesap (proteste_angel, ayse.tokkus@gmail) atlandi (Ayse'nin test profilleri). **Cozum:** atomic UPDATE yapildi, dogrulama temiz.

70. **Ebru "3. magdur" hipotezi curudu (3 Mayis 2026)** — Ebru 1 May 11:39'da kayit oldu (Play Store config bug fix oncesi), kritik magdur olabilirdi. RC'de profili acildi: iOS App Store, Yillik Plan TRY 699,99, "Subscription renews in 1 year" — Apple urununde billing period dogru. **Cozum:** Ebru magdur DEGIL. Apple subscription model'inde base plan ayrımı yok, billing period yanlisligi mumkun degil → 1 May Play Store config bug yalnizca Mustafa+Sebnem'i etkiledi, baska magdur YOK.

71. **RC'de email araması bos donuyor (2 Mayis 2026 fark edildi)** — `gokteke@yahoo.com` ile RC search "No results found" donduruyor. Aslinda customer mevcut, ama email attribute set edilmemis. RC anonymous user merge'inde `Purchases.logIn(user.id)` cagrildi ama `Purchases.setAttributes({'$email': user.email})` cagrilmadi. **Gecici cozum:** UUID ile arama (Supabase'den UUID al, RC'de UUID ile ara — anonymous alias'a geri donuyor). **Kalici cozum:** v1.1.0'da `lib/revenuecat.ts`'e ekleme. Detay: STATE.md "v1.1.0 PLANLANAN OZELLIKLER" #7.

### 4 Mayis 2026 — Mekan Verisi + Admin Panel Bugs

72. **15 mekanda yanlis "Pazar kapali" gosterimi (4 Mayis 2026)** — Yerebatan, TIEM, Galata Kulesi, Kiz Kulesi, Camlica Kulesi, Serefiye, Ayasofya Muzesi (tarih ve deneyim), Arkeoloji, Islam Bilim, Adam Mickiewicz, Mehmet Akif, Santralistanbul, Yildiz Cini, Havalimani Muzesi, Akvaryum (PASIF) — hepsi her gun acik mekanlardi ama app'te "Pazar kapali" yazisi cikiyordu. Kok sebep: **konvensiyon yanilgisi**. Excel'de Ayse "0 = her gun acik" mantigiyla doldurmus, frontend `GUNLER = ['Paz','Pzt',...,'Cmt']` (JS Date.getDay() ile uyumlu, Pazar=0) konvansiyonunda yorumlamis → `GUNLER[0]` = 'Paz' goruntulemis. **Cozum:** Konvensiyon netlestirildi: NULL = yok, 0..6 = gunun JS Date.getDay() indeksi. 15 kayit DB'de NULL'a cevrildi, Excel'de hucreler bosaltildi, sync script'i ayni konvensiyona hizalandi, kaynak SQL guncellendi. Detay: DECISIONS.md #32.

73. **Admin moderator atama: column profiles.email does not exist (4 Mayis 2026)** — `app/admin.tsx`'in moderator atama akisi (line 84-88) `profiles` tablosunda `email` kolonu sorguluyordu, ama Supabase standardinda email `auth.users`'da durur, `profiles`'ta yoktu. Schema bug'i. **Cozum:** `profiles` tablosuna `email TEXT` kolonu eklendi, `auth.users`'tan 96 mevcut profil dolduruldu, iki trigger kuruldu (auth.users -> profiles email senkronu + profiles INSERT'te email auto-fill), case-insensitive index eklendi. Frontend kodu degismedi. Detay: DECISIONS.md #33.

74. **Moderator atama "Basarili" diyor ama DB'de rol guncelenmiyor (4 Mayis 2026)** — `profiles.email` schema fix sonrasi moderator atama akisi calisti gibi gorundu (frontend "Basarili: Ela Karaman moderator olarak atandi" alert'i), ama DB'de Ela'nin `rol` alani hala `user`. Kok sebep: **RLS sessiz reddi varyanti**. Profiles UPDATE icin RLS policy sadece `auth.uid() = id` kontrolu yapiyordu — admin (Ayse) baskasinin (Ela'nin) satirini UPDATE etmeye calistiginda RLS satiri gizledi, UPDATE 0 satir etkiledi, PostgREST hata atmadi. **Cozum:** `is_admin()` SECURITY DEFINER helper + yeni "Admin tum profilleri guncelleyebilir" UPDATE policy. Frontend defansif kod ekle: `.select().single()` ile data null kontrolu (v1.0.12). Detay: DECISIONS.md #34.

75. **Galataport gemi takvimi 5 haftadir donmus + tarih kaymasi + eksik gemiler (4 Mayis 2026)** — Kullanici Mayis 4-11 araliginda app'te gunde tek gemi gorduyunu raporladi, ama cruisetimetables.com'da multi-gemi var. Inceleme sonucu: DB'de 204 kayit, hepsi 29 Mart 2026 13:24'te tek seferde insert edilmis, 5 hafta hic guncellenmemis. Otomatik mekanizma yok (ne scheduled task, ne edge function, ne pg_cron). Ustelik 29 Mart insert'i hatali — gemilerin geliS/gidiS tarihleri 1-3 gun kaymis, cogu multi-gemi gunu sadece tek gemi gosteriyor (ornegin 8 May'da kaynakta 3 gemi vardi, DB'de 1). **Cozum:** Firecrawl ile cruisetimetables.com'un Mayis-Aralik 2026 ay sayfalarini yeniden scrape et (8 ay), DB temizle, dogru 224 kayit insert et. Sirket adlari DB normalize formatinda (kisaltilmis, ornegin "Regent Seven Seas Cruises" → "Regent Seven Seas"). **Kalici cozum (v1.1.0):** Scheduled task yaz, gunluk veya haftalik calistir. Bkz. STATE.md "v1.1.0 PLANLANAN OZELLIKLER" #9.

76. **Pusula Play Store sadece Turkiye'de yayinda + IAP fiyatlari sadece TR (4 Mayis 2026)** — Bir kullanici "Bu oge ulkenizde kullanilamiyor" uyarisi aldi (Turkiye'de oldugu halde — Google hesabi Turkiye disinda olabilir). Kontrol ettik: Pusula Play Console'da yayin bolgesi olarak sadece Turkiye seciliydi. Apple App Store'da 175 ulkede yayinda, Play tarafi geride kalmis. **Cozum 1:** Play Console → Production → Ulkeler/bolgeler → Tum ulkeleri sec → Yayinlamaya gonder (managed publishing review akisinda). **Cozum 2:** IAP urunleri (`com.pusulaistanbul.app.aylik` ve `com.pusulaistanbul.app.yillik:yillik-yeni`) icin "Set prices" dialog'undan Turkiye baz fiyatindan otomatik donusum: Aylik 83,33 TRY (= 99,99/1,20), Yillik 583,33 TRY (= 699,99/1,20) baz fiyatlar. Google %20 KDV ekleyerek Turkiye'de 99,99/699,99 koruyor, diger ulkelere yerel para birimine donusturuyor (~1,99 USD aylik, ~13,99 USD yillik). Apple zaten otomatik global fiyat ayarlamasi yapiyordu (Base Country: Turkey TRY, sayfada "Apple may automatically adjust prices..." aciklamasi). **Ders:** Yeni urun yayinlanirken global hedef goz onunde tutulmali, fiyat sablonu Turkiye'den baslayip otomatik donusum guvenli yontem.

---

## BILINEN SINIRLAR (KABUL EDILEN ISTISNALAR)

Bu bolumdeki sorunlar **kasten cozulmemis** — fix-yarari/yatirim-edilecek-zaman dengesi cozumu desteklemiyor. Belgelenmis sebepleriyle birlikte burada tutuluyor ki gelecekte bir kullanici sikayet ettiginde hizli yanit verilebilsin.

### iPhone 7 (iOS 15.8) — Sifre Sifirlama Akisinda Race Condition (1 Mayis 2026)

**Sorun:** v1.0.10 yayinda olmasina ragmen iPhone 7 + iOS 15.8 kombinasyonunda sifre sifirlama maili linkine basildiginda kullanici dogru ekrana yonlendirilmiyor — app ana ekrana acilip orada kaliyor.

**Test verileri (1 Mayis 2026):**
- Mac M1 (Designed for iPad): calisiyor
- Samsung S22 (Snapdragon 8 Gen 1, 8GB RAM): calisiyor
- iPhone 11 (A13, 4GB RAM, iOS 17): calisiyor
- iPhone 7 (A10 Fusion, 2GB RAM, iOS 15.8): calismiyor

**Mekanizma:** v1.0.10 fix'i `setTimeout(..., 150)` ile Expo Router Stack mount race'ini cozuyor. 150ms degeri modern donanima (M1, S22) gore kalibre edildi. iPhone 7'nin A10 + 2GB RAM kombinasyonu Stack mount'u 150ms'den uzun surede tamamliyor → router.replace yine "stack hazir degilken" tetikleniyor → silently fail. Yani v1.0.9'daki ayni race condition'in donanim-spesifik (zaman) versiyonu.

**Neden Cozulmuyor:**
- Hedef kitle: TUREB ruhsatli profesyonel turist rehberleri. iPhone 7 (2016 modeli) bu kitlede yok denecek kadar az — sahada gunlerce dayanmasi gereken bir cihazi 10 yillik modelle yapan rehber yok.
- Apple iOS 15 destegini kesti — iPhone 7 son donemini yasiyor.
- Maliyet: setTimeout'i 500ms'ye cikarmak ya da `useRootNavigationState` ile event-driven hazirlik kontrolune gecmek mumkun, ama bu sadece bir-iki kullaniciyi etkileyen sorun icin yeni bir build + review cycle anlamina gelir.

**Eger Bir Kullanici Sikayet Ederse:**
- Once cihaz modelini sor. iPhone 7 ise, "bu cihazda bilinen bir teknik sinirlama" oldugunu ve daha yeni cihazlarda calistigini soyle.
- Alternatif: kullanici bilgisayardan veya baska bir telefondan sifresini yenileyebilir (web link bir tarayicida acilirsa Supabase auth flow yine calisir).
- Eger yeterli sayida iPhone 7 sikayeti gelirse v1.1.x'te `setTimeout` 500ms'ye cikartilabilir veya `useRootNavigationState` ile kalici cozume gecilebilir.

**Bilimsel Disiplin Notu:** N=4 testle (3 modern cihaz calisiyor, 1 eski cihaz calismiyor) hipotez yeterli derecede dogrulandi. Daha fazla deney (setTimeout 500ms ile yeni iPhone 7 testi) practical certainty icin gereksiz — istatistiksel olarak donanim/iOS yas suclusu netlesti.

---

## ACIK SORUNLAR (v1.0.14 ICIN)

### 77. Namaz Vakitleri SVG ikonu iOS'ta yarim render (5 Mayis 2026)
- **Konum:** Ana sayfa 8'li grid, "Namaz Vakitleri" karti
- **Dosya:** `assets/icons/namaz-vakitleri.svg`
- **Belirti:** iOS'ta cami silueti yarim gorunuyor (sag minare/kubbe kesik), Android'de iki minare tam gorunuyor
- **Olasi sebep:** SVG viewBox="0 0 682.667 682.667" + transform="matrix(1.33333 0 0 -1.33333 0 682.667)" kombinasyonu. iOS react-native-svg negatif olcek + matrix dönüsümünü Android'den farkli isliyor, bazi path'ler clipping disinda kaliyor.
- **Cozum yolu (v1.0.14):** SVG'yi yeniden duzenle — transform kaldirip path'leri direkt pozitif koordinata yaz, viewBox'i element bounds'una sigdir. Veya basit bir alternatif cami SVG'si ile degistir.
- **Aciliyet:** Dusuk — gorsel kozmetik, fonksiyon etkilenmedi. v1.0.13'e dahil edilmedi (review'a gonderildi).

### 78. Abone-ol fiyat para birimi sembolu vs alt yazi tutarsiz (5 Mayis 2026)
- **Konum:** `app/abone-ol.tsx`, plan kartlari + alt yazi
- **Belirti:** Test ortaminda (Mac M1 Designed for iPad / sandbox tester ABD) plan kartlarinda fiyat "$1.99" / "$12.99" gorunurken yillik kart altindaki hesap yazi "1,08 TL/ay" (USD/12 hesabi + hardcoded "TL" etiketi)
- **Etki:** Sadece test ortami. Gercek Turkiye Apple ID kullanicisi 99,99 TL / 699,99 TL ve dogru aylik denkligi gorur.
- **Cozum yolu (v1.0.14):** Alt yazidaki "TL/ay" hardcoded'unu kaldir, RC `priceString` veya `currencyCode`'unu kullan. Format: `${birFiyat.toFixed(2)} ${currency}/ay`.
- **Aciliyet:** Dusuk-orta — production'da gercek kullanici etkilenmiyor ama test/demo sirasinda kafa karistirici, screenshot'lara da olumsuz yansiyabilir.

---

## COZUM PATTERNLERI (Ozetlenmis)

Yeni bir bug ile karsilastiginda dene:
1. **Realtime calismiyor** — Supabase publication'a tablo eklenmis mi? `ALTER PUBLICATION supabase_realtime ADD TABLE ...`
2. **UI guncellenmiyor** — `extraData` prop var mi? Polling yedegi var mi? state assertion timing dogru mu?
3. **RLS reddediyor** — error donmus mu? `.select()` ekleyip data.length kontrol et. Service role key gerekiyor mu? Policy `rol` kolon adi mi kullaniyor (Turkce)?
4. **Deep link / auth** — Pending Pattern uygulanmis mi? Stack mount durumu kontrol ediliyor mu?
5. **EAS env eksik** — `eas env:list --environment production` ile dogrula. EXPO_PUBLIC_ ise `--visibility sensitive`.
6. **Apple reject** — Paid Apps Agreement Active mi? Subscription Group Localization var mi? EULA linki eklenmis mi? Manual release secilmis mi?

### 79. v1.0.13 ScreenStack Drawing Crash — IndexOutOfBoundsException (27 Mayis 2026)
- **Konum:** Android tarafi, `com.swmansion.rnscreens.ScreenStack.performDraw` (react-native-screens 4.16.0 native kod)
- **Belirti:** Bazi kullanicilarda uygulama acildiktan sonra (kayit/giris veya bir ekrana gecis sirasinda) "Pusula Istanbul ile ilgili bir sorun olustu" Android crash dialog'u
- **Stack trace:** `java.lang.IndexOutOfBoundsException: getChildDrawingOrder() returned invalid index 2 (child count is 2)` — ekran geçişi sirasinda child view listesi tutarsizliği, off-by-one race condition
- **Etki:** Play Console Vitals'ta 16 onaylanmis kullanici (~%15 yeni organik rehberden), 12 farkli cihaz markasi (Samsung baskin, Xiaomi, Huawei, Realme, Vivo, Tecno dahil — dagilim cok genis, OEM uyumsuzluk degil kod bug'i)
- **Cozum (v1.0.14):** react-native-screens 4.16.0 → 4.23.0 upgrade. Bkz. DECISIONS #37.
- **Aciliyet:** **Cozuldu (27 May gece)** — v1.0.14 her iki platformda yayinda (Apple expedited onayi ~12 saat icinde, Google Play onayi ayni gun). 24-48 saat icinde Play Console Vitals'tan yeni crash gelmemesi dogrulanacak. Gelirse Plan B: patch-package ile 4.24'teki defansif kodu 4.23'e transplant.

### 80. react-native-screens 4.24.0 Yarim Surum — BottomTabs Implementation Eksik (27 Mayis 2026)
- **Konum:** node_modules/react-native-screens 4.24.0 paketi
- **Belirti:** EAS iOS build patladi (Xcode):
  ```
  use of undeclared identifier 'RNSBottomTabsScreenComponentView'
  unknown type name 'RNSBottomTabsScreenComponentView'; did you mean 'RNSTabsScreenComponentView'?
  ```
- **Tani:** `npm pack react-native-screens@4.24.0 && tar -xzf` ile paket icerigi acildi → BottomTabs iOS implementasyonu 0 dosya, Android 0 dosya, JS spec 0 — ama codegen baska bir yerden hala `RNSBottomTabsScreenComponentView` ariyor. Yarim kalmis surum. 4.25.0'da BottomTabs yeniden eklendi (RN 0.82 ile birlikte).
- **Etki:** 4.16'dan 4.24'e upgrade ile fix gelen ScreenStack defansif kodu (currentVisibleBottom field + updateA11yForVisibleScreens + shouldDisableFocusabilityBeneathTopScreen) erisilemez kaldi. 4.25.0+ peer dep `react-native: >=0.82.0` ister, bizde 0.81.5 — onlar da kapali.
- **Cozum:** 4.24'u atla, **4.23.0** kullan (BottomTabs iOS 28 dosya + Android 4 dosya, saglam). Plan B (gerekirse): `patch-package` ile 4.24'teki ScreenStack defansif kodunu 4.23'e transplant.
- **Aciliyet:** Cozuldu — 4.23.0'a inildi, v1.0.14 her iki platform build edildi.

### 81. Microsoft (Hotmail/Outlook) + Yahoo Spam Filtresi - 16 Kullanici Onay Maili Goremedi (1-27 Mayis 2026)
- **Belirti:** IRO maili sonrasi 20 gunde 16 kullanici kayit yapip hesabini aktive edemedi. Resend dashboard'da Supabase Auth onay mailleri **"Delivered"** statusunda (Microsoft/Yahoo mail sunucularina ulasmis) ama kullanici gelen kutusunda goremedi — Onemsiz e-posta / Junk / Spam klasorlerinde gomulmus.
- **Etkilenen domain dagilimi:** Hotmail.com (14), Hotmail.de (1), Yahoo.com (1), laposte.net (1), superonline.com (1), gmail.com (1, ama yeniden kayit oldugunda doğru `.com` ile aktif)
- **Etkilenen 16 kullanici:**
  - 1. grup (27 May 01:37 manuel onay): ezeybey@hotmail.com, soysalmustafa@hotmail.com, yavuzdo@hotmail.com, alikaracayli@hotmail.com.tr, sevgi_tr_lv@hotmail.com, kvanlioglu@hotmail.com, fevziye22@yahoo.com
  - 2. grup (27 May 03:14 manuel onay, daha eski 1-6 May kayitlari): omur.kahraman@hotmail.com, ersin.yigid@gmail.com, abdullah_er21@hotmail.de, tinapinto73@hotmail.com, melikekorkmaz@hotmail.com, aliakkaya@laposte.net, merttaner@hotmail.com, buraksan@superonline.com
- **Cozum:** SQL ile `email_confirmed_at = NOW()` manuel onay + markali Pusula Istanbul bilgilendirme maili (scripts/manuel-onay-bilgilendirme.mjs). 1. grup 7 kisiye 27 May sabah bilgilendirme maili gonderildi (Resend Delivered). 2. grup 8 kisi bilgilendirme maili icin yeni oturum bekliyor. Bkz. DECISIONS #39.
- **Aciliyet:** Devam ediyor — Microsoft spam filtresi yapisal bir sorun, her IRO benzeri pazarlama hamlesinde tekrarlayacak. v1.1.0 idea: admin panel "Onaysiz Kullanicilar (>24 saat)" widget'i + tek tikla manuel onay + bilgilendirme.

### 82. Timuçin Alp Aslan — Email Typo .vom (9 Mayis 2026)
- **Konum:** auth.users + public.profiles, kullanici email kolonu
- **Belirti:** 9 May 09:21'de `timucin.aslan1956@gmail.vom` yanlis email ile kayit yapildi (`.vom` typo). 2 dakika sonra (09:23) ayni kullanici dogru email `timucin.aslan1956@gmail.com` ile yeniden kayit yapip onayladi ve aktif kullaniyor. Eski `.vom` hesabi olu kaldi (email_confirmed_at NULL, last_sign_in_at NULL).
- **Tespit:** 27 May'da Microsoft spam pattern tanisi sirasinda onaysiz freemium listesinde fark edildi. Ayse'nin baslangictaki tahmini ("buyuk ihtimal email adresini yanlis yazmis") burada gerceklesti — 8 onaysizdan 1'i gerçek typo, 7'si Microsoft spam.
- **Cozum:** `DELETE FROM public.profiles WHERE id = ...` + `DELETE FROM auth.users WHERE id = ...` — olu hesap silindi. Dogru `.com` hesabi zaten aktif, kullanici hayati etkilenmedi.
- **Aciliyet:** Cozuldu.

### 83. Genel Duyuru Yetkili Aksiyon Bari Gorunmez — kart flexDirection 'row' (2-4 Haziran 2026)
- **Konum:** `components/genel-duyuru-panel.tsx` `kart` stili
- **Belirti:** v1.1.1'de eklenen "Duzenle | Sabitle | Sil" butonlari hicbir cihazda gorunmedi. Ayse duyuru silemiyordu; eski basili-tutma menusu de v1.1.1'de kaldirildigi icin HICBIR silme yolu yoktu.
- **Kok sebep:** Kart container'i eski tasarimdan `flexDirection: 'row'` kalmis; aksiyon bari icerigin sagina ~2px genislikte render oluyordu (cocuklar flex:1 → intrinsic 0). Kod tum paketlerde mevcuttu — build/OTA/RLS suclamalari yanlis cikti.
- **Cozum:** `kart` → `flexDirection: 'column', alignItems: 'stretch'` (commit 29ee7a6). EAS Update OTA ile runtime 1.1.1'e dagitildi (update group afd5d662), magaza build'i gerekmedi. Detay: DECISIONS #47.
- **Aciliyet:** Cozuldu (4 Haz 2026).
### 84. Admin Panel Bogaz/Havalimani/Mekan Saatleri UPDATE Hatasi — push_gonder_async Permission Denied (2-5 Haziran 2026)
- **Konum:** `trg_push_bogaz`, `trg_push_havalimani`, `trg_push_mekan_saatleri` trigger fonksiyonlari + `push_gonder_async`
- **Belirti:** Ayse admin panelden Bogaz turu saatlerini guncelleyemiyordu, Alert ile hata. Ayrica (sessiz) tum kullanici-kaynakli push bildirimleri 2 Haz'dan beri gitmiyordu.
- **Kok sebep:** 2 Haz Security Advisor temizliginde `push_gonder_async`'in PUBLIC EXECUTE'u revoke edildi (dogru karar — RPC spam riski). Ama trigger fonksiyonlari DML yapan kullanicinin (authenticated) yetkisiyle calisir → push cagrisi "permission denied". Zirhsiz 3 trigger'da UPDATE komple FAIL; zirhli 6 trigger'da hata yutuldu ama PUSH SESSIZCE OLU kaldi.
- **Cozum:** Tum 9 `trg_push_*` fonksiyonu SECURITY DEFINER yapildi (postgres yetkisiyle calisir, push fonksiyonu kilitli kalir, trigger fonksiyonlari RETURNS trigger oldugu icin dogrudan RPC cagrilamaz = guvenli). Zirhsiz 3'une EXCEPTION sargisi eklendi. Migration: `push_trigger_security_definer_ve_exception_zirh`. Authenticated rol simulasyonuyla dogrulandi.
- **Ders:** SECURITY DEFINER bir fonksiyonun EXECUTE'u revoke edilirken onu cagiran TUM trigger'lar listelenmeli; trigger'lar invoker yetkisiyle calisir. Push akisi degisikliklerinden sonra mutlaka uctan uca push testi yapilmali.
- **Aciliyet:** Cozuldu (5 Haz 2026). TURYOL tarife verisi ayrica SQL ile guncellendi (haftaici saat basi 10-21, hafta sonu 14 sefer 10:00-21:00).

### 85. Sohbet Ekrani iOS Klavye Tuzagi — Multiline Input Kapatilamiyor (7 Haziran 2026)
- **Konum:** `app/(tabs)/sohbet.tsx` — mesaj giris `TextInput` (`multiline={true}`) + mesaj `FlatList`
- **Belirti (iPhone 11):** Ayse mesaj kutusuna dokunup yazmaya basladiktan sonra vazgecince klavyeyi kapatamiyor, mesaj giris alanindan cikamiyor — uygulamayi tamamen kapatmak zorunda kaliyor. Android'de geri tusu klavyeyi kapattigi icin orada fark edilmiyor.
- **Kok sebep:** iOS'ta `multiline` TextInput'un "return" tusu satir atlatir, klavyeyi kapatmaz (tek satirli input'tan farkli — orada return ile blur olur). Ek olarak FlatList'te `keyboardDismissMode` ayarli degildi → listeyi kaydirinca klavye kapanmiyordu, ve `keyboardShouldPersistTaps` ayarli degildi → bos alana dokunma da ise yaramiyordu. Bos kutuda "Gonder" pasif oldugu icin klavyeyi kapatacak hicbir yol kalmiyordu.
- **Cozum:** FlatList'e `keyboardDismissMode="on-drag"` (sohbeti asagi kaydirinca klavye kapanir — iMessage/WhatsApp standardi) + `keyboardShouldPersistTaps="handled"` (klavye acikken butonlar/tap calismaya devam eder, bos alana ilk dokunmada klavye kapanir) eklendi. JS-only degisiklik, native rebuild gerektirmez → OTA ile dagitilabilir.
- **Ders:** `multiline` TextInput kullanan her ekranda klavye kapatma yolu acikca saglanmali (on-drag dismiss ya da gorunur kapat affordance). Tek satirli input'taki `returnKeyType`/blur davranisina guvenilemez.
- **Aciliyet:** Cozuldu (7 Haz 2026), DAGITILDI (14 Haz 2026 — EAS Update OTA, runtime 1.1.1, group `7b10c8d6`, commit `15bf72f`).

### 86. Android Push Bildirimi Sessiz — Kanal `sound` Verilmeden Olusturulunca SESSIZ (14 Haziran 2026)
- **Konum:** `hooks/use-bildirimler.ts` (Android kanallari) + `supabase/functions/push-gonder` (KANAL_MAP)
- **Belirti (Samsung S22, OneUI):** Push uctan uca testinde bildirim geldi (titresim + akilli saatte gorundu) ama **ses cikmadi**. Cihaz ses modunda, app "Ses ve titresim" anahtari ACIK. iOS'ta ayni push ses verdi. Android Ayarlar → kategori "Sohbet Mesajlari" → ses "Sessiz"; elle acilinca ses geldi → kanal sessiz olusmus.
- **Kok sebep:** v1.1.1'de (-v2 kanallari) `sound` parametresi HIC verilmeden olusturuldu. `expo-notifications@0.32.16` kaynaginda `setSound` sadece `sound` anahtari varsa cagriliyor; yoksa kanal Samsung'da sessiz kalir. (Onceki DECISIONS #45 teshisi "omit = sistem sesi" yanlisti.) Kanallar immutable oldugu icin kod degisikligi mevcut -v2 kanallari duzeltemez.
- **Cozum (v1.1.2):** Kanallar `sound: 'default'` ile (-> DEFAULT_NOTIFICATION_URI) ve yeni `-v3` ID'leri altinda yeniden olusturuldu; eski v1+v2 kanallar silindi. Edge Function `KANAL_MAP` -v3'e alindi (deploy v3) — OTA almamis cihazlarda -v3 yok → Android default kanala fallback → ses ANINDA geri geldi (65 token'li kullanici). Detay: DECISIONS #49.
- **Dogrulama:** S22'de -v3 fallback testi ses verdi (OTA oncesi). Edge Function v3 deploy + EAS Update OTA (runtime 1.1.1, group `ff7eceb9`).
- **Ders:** `sound: 'default'` acikca verilmeli; omit etmek (Samsung'da) sessiz uretir. "Banner geldi" != "ses geldi" — kapali cihazda gercek test sart.
- **Aciliyet:** Cozuldu + dagitildi (14 Haz 2026).

### 87. Trafik Bildirimi Kapatilamiyor — Duplike Push Token (Ela/Ayse Vakasi) + Logout Temizligi RLS Sessiz Reddi (2 Temmuz 2026)
- **Konum:** `hooks/use-push-token.ts` + `profiles.expo_push_token` + Edge Function `push-gonder`
- **Belirti:** Ayse profil > bildirim ayarlarindan trafik'i kapatti, S22'ye trafik push'lari (IBB Ulasim, 15 dk'da bir) gelmeye devam etti. Tercih DB'de dogruydu, Edge Function filtresi dogru calisiyordu.
- **Kok sebep:** S22'nin push token'i IKI profilde kayitliydi — Ayse (trafik:false) + Ela/kelebekiamarket (tercih NULL = hepsi acik). 26 Haz moderator cami testinde Ayse S22'de Ela hesabiyla giris yapinca token Ela'ya da yazilmisti. Server push'u Ela'nin satiri uzerinden gonderiyordu → ayni cihaz. Logout'un token'i temizlememe sebebi: temizlik SIGNED_OUT event'inde (signOut SONRASI) yapiliyordu → RLS sessiz red (0 satir, hata yok). Yan etki: Ela'nin kendi cihazi 26 Haz'dan beri push alamiyordu.
- **Cozum:** (1) Ela'nin satirindaki token NULL'landi (aninda kesildi, trafik hedef 27→26). (2) `push_token_kaydet` SECURITY DEFINER RPC — token kaydinda ayni token'i diger profillerden temizler. (3) `pushTokenTemizle()` signOut ONCESINE alindi (profil.tsx 2 nokta). (4) push-gonder v4: token dedupe sigortasi (en guncel push_token_guncellendi kazanir). Detay: DECISIONS #51.
- **Dogrulama:** Duplike token sorgusu 0 satir, trafik hedef 26, tsc temiz.
- **Aciliyet:** Cozuldu (2 Tem 2026). Client fix OTA dagitimi bekliyor; Ela app'i actiginda kendi token'i otomatik geri yazilir.
