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

---

## COZUM PATTERNLERI (Ozetlenmis)

Yeni bir bug ile karsilastiginda dene:
1. **Realtime calismiyor** — Supabase publication'a tablo eklenmis mi? `ALTER PUBLICATION supabase_realtime ADD TABLE ...`
2. **UI guncellenmiyor** — `extraData` prop var mi? Polling yedegi var mi? state assertion timing dogru mu?
3. **RLS reddediyor** — error donmus mu? `.select()` ekleyip data.length kontrol et. Service role key gerekiyor mu? Policy `rol` kolon adi mi kullaniyor (Turkce)?
4. **Deep link / auth** — Pending Pattern uygulanmis mi? Stack mount durumu kontrol ediliyor mu?
5. **EAS env eksik** — `eas env:list --environment production` ile dogrula. EXPO_PUBLIC_ ise `--visibility sensitive`.
6. **Apple reject** — Paid Apps Agreement Active mi? Subscription Group Localization var mi? EULA linki eklenmis mi? Manual release secilmis mi?
