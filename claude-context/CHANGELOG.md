# Pusula Istanbul - Surum Gecmisi

Bu dosya **append-only** — eski surum bilgilerini silmeyiz, yeni surumler ust uste eklenir. Sadece "geriye dogru ne yaptik?" sorusuna bakmak icin acilir.

---

## v1.2.0 (HAZIRLIK — surum bump 4 Eylul 2026, store build ERTELENDI; liste bitince tek build)

**Ozet:** Tamamen ucretsiz model, inline yonetim, "Kobalt & Menekse" redesign, sohbet tepki/yanit/gorsel, Bogaz hafta ici + hafta sonu, "Rehber Araniyor" ilanlari, DM, **AJANDA + MASRAF PUSULASI** (rota planlayici kaldirildi). Native degisiklikler (react-native-purchases cikti; expo-image-picker, expo-mail-composer, expo-sharing girdi; yeni ikon/splash) → **store build sart, OTA yetmez.**

### Ajanda + Masraf Pusulasi (3 Eyl 2026)
- Ana sayfada "Ajandam" karti (haftanin dolu gunleri), `app/ajanda.tsx`, `app/tur/[id].tsx`
- Masraf satirlari: 9 kategori, TRY/EUR/USD, fis fotografi (ozel bucket `masraf-fisler`), ayri avans bolumu, para birimi bazli kalan
- Rehberlik ucreti satirlari (TRY/EUR/USD) ve cok gunlu turlar (baslangic–bitis, gun bazli masraf, ciktida Gun sutunu) — migration `ajanda_cok_gunlu_tur_ve_rehberlik_ucreti`
- PDF / Word / Excel (Edge Function `masraf-disa-aktar`, Pusula logolu, palet uyumlu) → mail uygulamasi ekli / Paylas
- Migration `ajanda_ve_masraf_pusulasi` (rotalar DROP, ajanda_turlar, masraflar, bucket + policy'ler)

### Telefon — beyan usulu (4 Eyl 2026)
- Kayitta zorunlu cep telefonu (E.164, +90 varsayilan; yurt disi + ile). SMS/WhatsApp dogrulama kodu YOK (Ayse karari: sirket evraki / ayri numara istemiyor). Kendi kendine saglama: "Numarami WhatsApp'ta ac ve kontrol et".
- Mevcut kullanicilara ana sayfada "Telefon numarani ekle" karti (Sonra = 3 gun). Ozel mesaj baslatmak ve ilan vermek icin telefon sart (TelefonModal).
- Baskasinin ilaninda "Numaraya ulasilamiyor mu? Bildir" → raporlanan_mesajlar (kaynak='telefon'). Migration `handle_new_user_telefon`.

### Google + Apple ile giris (4 Eyl 2026)
- "Google ile devam et" (tum platformlar, tarayici akisi) ve "Apple ile devam et" (yalnizca iOS, yerli). OAuth ile gelen kullanici "Profilini tamamla" ekraninda TUREB ruhsat no + telefon girer.
- Native: `expo-apple-authentication` + `ios.usesAppleSignIn` → store build sart. Migration `handle_new_user_oauth_metadata`.

### TUREB rozeti + dil listesi (4 Eyl 2026)
- TUREB rehber veritabaniyla ad-soyad eslesmesi → "TUREB · Oda" rozeti (profil, ilan karti); coklu eslesmede kullanici kendi kaydini secer; eylemsiz gri rozet; kayit engellenmez. Edge Function `tureb-dogrula` (pg_net), migration'lar `tureb_dogrulama`, `tureb_http_pg_net_rpc`.
- Ilan dil listesi: TUREB'in 39 dili + Turkce.

### Release Notes taslagi (TR)
> Pusula Istanbul artik tamamen ucretsiz. Yeni tasarim. Ajanda: tur tarihlerinizi not edin, her tur icin masraf pusulasi tutun, fisleri cekin; PDF/Word/Excel olarak acentenize tek dokunusla gonderin. Rehber Araniyor ilanlari, ozel mesajlasma, sohbette tepki ve gorsel paylasimi, Bogaz tarifelerinde hafta ici/hafta sonu birlikte.

---

## v1.1.1 (HOTFIX, BUILD HAZIRLIK — 2 Haziran 2026)

**Yayin durumu:** v1.1.0 Android yayinda (2 Haz sabah), iOS hala review'da. v1.1.0'da iki sorun tespit edildi → v1.1.1 hotfix paketi hazirlandi:

1. **Android push notification ses gelmiyor** — `setNotificationChannelAsync({ sound: 'default' })` string'i Android'de "default.wav" aramaya gidiyor, dosya yok, kanal sessiz olusturuluyor. v1.1.0 yuklu cihazlarda bildirim banner'i goruluyor ama ses cikmiyor. **Server-side hotfix (2 Haz oglen):** push-gonder Edge Function v2 deploy edildi, KANAL_MAP yeni `-v2` ID'lere point ediyor → v1.1.0 cihazlarda Android default kanala fallback → ses calar. Manuel ayar gerekmez. v1.1.1 build'inde de client-side kalici fix var: eski sessiz kanallar silinir, yeni kanallar `sound` parametresi verilmeden olusturulur. Bkz. DECISIONS #45.

2. **Genel Duyuru silme UI'si yok** — v1.1.0 build'inde kart altinda gorunur "Sil" butonu paketlenmemis. Kullanici uzun bas yapmayi kesfetse bile o handler da paketlenmemis. Yetkili kullanici DB'den silmeden duyuru kaldiramiyor. Geçici çözüm: admin manuel SQL ile siler. **v1.1.1 fix:** kart altinda gorunur "Düzenle | Sabitle | Sil" butonlari + RLS sessiz reddi yakalama (DELETE ... RETURNING) + optimistic state update + basarisiz silme'de Alert.

### Dahil Olan Dosya Degisiklikleri

- `app.json`: version 1.1.0 → 1.1.1, iOS buildNumber 40 → 41, Android versionCode 41 → 42
- `hooks/use-bildirimler.ts`: eski 6 kanal silinir (`deleteNotificationChannelAsync`), yeni 6 kanal `-v2` suffix'li ID'lerle olusur, `sound` parametresi VERILMEDI (Expo varsayilan = sistem ses)
- `hooks/use-genel-duyuru.ts` (untracked'tan tracked'a): `duyuruSil` artik `.select('id')` ile silinen satiri geri ister; bos array = RLS reddi; optimistic state update; hata varsa false doner
- `components/genel-duyuru-panel.tsx` (untracked'tan tracked'a): kart altinda gorunur "Düzenle | Sabitle | Sil" butonlari (uzun bas yedek menude); silme basarisiz olursa Alert ile bilgilendirir

### Release Notes (her iki platform, TR)
> Bazi Android cihazlarda push bildirimlerinin sessiz gelmesi sorunu giderildi. Yetkili kullanicilarin genel duyurulari silebilmesi icin "Sil" butonu eklendi. Genel kararlilik iyilestirmeleri.

### Apple Review Notes (EN)
> Hotfix for v1.1.0:
> 1. Fixed Android notification channel sound configuration — push notifications were arriving silently on Android due to a channel sound parameter that was being misinterpreted as a missing custom sound file.
> 2. Restored UI for deleting general announcements (admin/moderator feature missing from v1.1.0 build).
> No new features, no permission changes.

### Server-side Hotfix Bilgisi
v1.1.1 store onayi beklerken **mevcut v1.1.0 yayindaki tum kullanicilar icin ses sorunu zaten cozulmus durumda** (Edge Function v2 deploy). Genel Duyuru silme icin admin uygulamada UI yok ama Ayse veritabanindan manuel silebilir.

### Yan Etkinlikler

- **Havaist Senkron Pipeline kuruldu** (DECISIONS #44 + SCRIPTS.md #2): `scripts/havaist-senkron.mjs` + scheduled task `havaist-senkron` (gunluk 07:00). hava.ist resmi backend API'sinden 14 IST kaydi otomatik senkronlanir. Aksaray fiyat 355₺→426₺, Kadikoy 390₺→468₺, 7 yeni hat eklendi (Beylikduzu, Otogar Esenler, Merter/Bakirkoy, Avcilar, Arnavutkoy, Silivri/Catalca, Sabiha Gokcen).

---

## v1.0.14 (HOTFIX, YAYINDA HER IKI PLATFORMDA — 27 Mayis 2026)

**Yayin durumu:** 27 May sabah build edildi (iOS buildNumber 37 + Android versionCode 37, EAS autoIncrement ile manuel 34/35'ten daha yukseye atandi). iOS Apple Review'a gonderildi (Manual Release secildi, **expedited review istendi** — Critical hotfix notu). **Apple onayi sabahki submit'ten ~12 saat sonra geldi** (normal sure 24-48 saat — bayram gunu olmasina ragmen Apple "critical hotfix + small change" sinyalini iyi okudu). Ayni gun Google Play production track onayi geldi. Ayse her iki platformda manuel "Release"/"Yayinla" basarak v1.0.13'u v1.0.14 ile degistirdi. **v1.0.14 her iki platformda yayinda.** Crash kaybolma takibi onumuzdeki 24-48 saatte Play Console Vitals'tan yapilacak.

**Tetikleyici:** v1.0.13 production'da `java.lang.IndexOutOfBoundsException: getChildDrawingOrder() returned invalid index 2 (child count is 2)` — Android crash. Play Console Vitals'ta **16 onaylanmis kullanici** etkilendi (12 farkli cihaz markasi, OEM uyumsuzluk degil kod bug'i kesin). Bilinen `react-native-screens` 4.x serisi ScreenStack drawing race condition bug'i. IRO maili sonrasi 20 gunde kullanici tabani buyuyunce bug yuzeye cikti (cogu yeni rehber Android). Bkz. ISSUES #79.

### Tek Buyuk Degisiklik: react-native-screens 4.16.0 → 4.23.0

Kod degisikligi yok, sadece package.json'da `react-native-screens: "4.23.0"` exact pin. Native modul upgrade ile ScreenStack drawing icindeki off-by-one race condition kapaniyor (4.16'dan 7 minor surum sonra birikmis iyilestirmeler).

**Atlanan surumler:**
- **4.24.0** atlandi — yarim kalmis surum, BottomTabs implementasyonu silinmis ama codegen referansi kalmis (iOS Xcode "RNSBottomTabsScreenComponentView undeclared identifier" patlatti). Bkz. ISSUES #80, DECISIONS #37.
- **4.25.0+** atlandi — peer dep `react-native: >=0.82.0` ister, bizde 0.81.5 var (Expo SDK 54).

**Plan B (gerekirse):** 4.23 ile crash devam ederse `patch-package` ile 4.24'teki ScreenStack defansif kodunu (currentVisibleBottom + updateA11yForVisibleScreens + shouldDisableFocusabilityBeneathTopScreen) 4.23 source'una transplant et.

### Release Notes (her iki platform, TR)
> Bazi kullanicilarda uygulamanin acilisinda veya ekran gecislerinde yasanan beklenmedik kapanma sorunu giderildi. Daha kararli bir deneyim icin ekran cizim altyapisi guncellendi.

### Apple Review Notes (EN — submit sirasinda yazildi)
> Critical hotfix for v1.0.13 production crash affecting 16+ confirmed Android users (Google Play Vitals data). Crash signature: java.lang.IndexOutOfBoundsException in com.swmansion.rnscreens.ScreenStack.performDraw — known bug in react-native-screens 4.16.0.
>
> Fix: Upgraded react-native-screens dependency from 4.16.0 to 4.23.0 (note: 4.24.0 was skipped due to upstream packaging issue with BottomTabs implementation). No application code modified.
>
> No new features, no UI changes, no permission changes.
>
> We respectfully request expedited review given the production impact.

### Yan Etkinlikler (build paketinde olmayan ama 27 May'da yapilan)

- **16 onaysiz kullaniciyi 2 grup halinde manuel onay** (Microsoft/Yahoo spam filtresi magdurlari). Bkz. DECISIONS #39, ISSUES #81.
- **1 olu typo'lu hesap silindi** (Timuçin Aslan `.vom` → `.com` zaten aktif). Bkz. ISSUES #82.
- **172 freemium kullaniciya KURBAN BAYRAMI PREMIUM HEDIYESI** — 1 Haziran 2026 00:00'a kadar premium gece grant. Atomic SQL ile abonelik_durumu='aktif', RC'de degisiklik yok (use-abonelik Supabase fallback).
- **`scripts/manuel-onay-bilgilendirme.mjs` yeni mail araci** — Resend API direct, markali HTML, dry/test/all modlari. 1. grup 7 kisiye bilgilendirme maili gonderildi.
- **`scripts/kurban-bayrami-hediye.mjs` + 07:00 one-shot scheduled task** — 168 mevcut freemium kullaniciya bayram hediye maili (runtime Supabase fetch + altin gradient hediye kutusu + external URL logo pattern, DECISIONS #40).
- **27 May'da kayit olan 13 yeni rehber tespiti** — 17:00 Supabase analizi: +325% giris, +225% kayit (dune kiyasla). Asli Cetin (1999 dogumlu, TUREB 13745) 27 May 10:06 kayit -> 10:10 yillik abonelik = **IRO maili olmadan, tamamen organik kanaldan ilk yillik conversion** (revenuecat_id NULL kuyrugu var, v1.1.0 setAttributes plani kapatacak).
- **11 yeni kayit kullaniciya bayram hediyesi grant + mail** (aksam) — Atomic UPDATE (Suha sabah listesinde, Asli yillik abone) + `scripts/yeni-kayit-bayram-hediye.mjs` (hardcode 11 alici, "hos geldin + bayram hediyesi" toplu olarak farkli ton + "aylik 99 TL veya yillik 699 TL (%41 avantajli)" italic kutuda yumusak teskik). 11/11 basarili gonderim.
- **IRO maili durum duzeltmesi (Ayse'nin notu)** — IRO 7 May'da yayinlanmadi (yeniden talep gonderilecek). STATE.md + CLAUDE.md'deki "IRO sonrasi" referanslari temizlendi. Son 20 gunun 107+ rehber + bugunku 13 yeni kayit + Asli'nin yillik conversion'i TAMAMEN organik kanaldan. Bu IRO mail cikinca dalganin daha buyuk olacagini gosteren bir sinyal.

---

## v1.0.13 (YAYINDA HER IKI PLATFORMDA — 6 Mayis 2026)

**Yayin durumu:** App Store review onayi geldi (~24 saat icinde), manuel release yapildi. Google Play production'da yayinda. v1.0.12 (iOS REVIEW'da, Android kismen yayilmis) v1.0.13 ile degistirildi — her iki magazada artik v1.0.13 aktif. **IRO maili gonderme on kosulu tamamlandi.**



**Stratejik baglam:** Ayse'nin gozlemi tetikledi — "rehberler uygulamayi catir catir kullanip kayit bile olmuyor". Insta'da paylasan, ama kayitsiz kalan rehberler yuzunden ne sayim var, ne pazarlama listesi, ne premium conversion firsati. v1.0.13 bunu kokten cozer + IRO mailini gondermeden once kayit zorunlulugu yerine oturmus olur.

**Iki buyuk degisiklik:**

### 1. Kayit Zorunlulugu (auth gate)

Onceki freemium akisinda misafirler tab'lara direkt giriyordu. v1.0.13'te uygulama acildiginda **oturum yoksa giris ekranina yonlendirilir**. "Misafir devam" yok. Kayit formu degismedi (Ad-Soyad, e-posta, sifre, TUREB ruhsat no).

**Kod:** `app/_layout.tsx` routing useEffect'ine yeni kural eklendi:
```typescript
if (!oturum && !girisEkraninda) {
  router.replace('/giris');
  return;
}
```

`Stack initialRouteName` da oturuma bagli — `oturum ? "(tabs)" : "giris"` — splash sonrasi flicker'i onler.

**Korunan ekranlar:** giris, hos-geldin, gizlilik-politikasi, kullanim-kosullari, abone-ol, sifre-sifirla. Bunlar oturumsuz da erisilebilir kalir (yasal sayfalar Apple gerekligi, abone-ol paywall, sifre-sifirla deep link recovery).

### 2. Freemium Kapsam Sikilastirma

Saraylar bedava + premium duvarlar diger noktalara konuldu. Asagidaki yerler artik premium gerektirir:

- **Muze · Saray · Cami sekmesi** (`muzeler.tsx`): Saraylar (Milli Saraylar) sekmesi bedava, **Muzeler** + **Ozel Muzeler** + **Camiler** sekmeleri premium duvar. Ekstra: deep link bypass kapatildi (arama sayfasindan saray-disi mekana tiklama da premium'a yonlendirir).
- **Bogaz Turlari sekmesi** (`bogaz.tsx`): Turyol kart sayfasi bedava, **"Tum sefer saatleri" dugmesi** premium duvar (metin "Tüm sefer saatleri (Premium) →" olarak guncellendi). **Dentur** ve **Sehir Hatlari** sekmeleri tamamen premium duvar.
- **Ana sayfa Sultanahmet Camii bandi** (`(tabs)/index.tsx`): Bant gorunur (anlik AÇIK/KAPALI durumu vitrin olarak), banta tiklayinca acilan saatler ekrani premium duvar. Bant alt yazisi premium olmayanlar icin "Detaylar için Premium ›".
- **Acil sekmesi sozlesmeler** (`acil.tsx`): Iki sozlesme (Müşteri-Rehber + Acente-Rehber) indirme satirlari premium duvar. Bolum basligi "Sözleşme Örnekleri (Premium)" olarak guncellendi.

**Bedava kalan ozellikler:** Havalimani Ulasim, MuzeKart, Acil numaralar (112), Arama, Hava durumu, Namaz vakitleri, Galataport gemi takvimi.

**Mevcut premium ozellikler degismedi:** Rehber Sohbeti, Canli Saha Durumu, Ulasim/Trafik Uyarilari, Etkinlikler.

### Mevcut Kullanici Etki Analizi (4 grup)

1. **Premium aboneler** (~8-10 kisi): Etkilenmez, oturum acik, tum sayfa onlara acik.
2. **Kayitli ucretsiz kullanicilar**: Oturum acik, giris ekranina atilmazlar. Premium duvarlari fark ederler — tepki gelebilir, planin parcasi.
3. **Misafir/kayitsiz kullanicilar** (en buyuk grup): Splash sonrasi giris ekrani gorur. Ya kayit olur (zafer), ya kapatip gider (temizlik). Insta-paylasan ama kayit olmayan rehberler bu gruptan.
4. **Otomatik guncelleme kapali olanlar (~%15)**: Eski v1.0.12 ile takilirlar. v1.1.0'da eklenecek "in-app guncelleme uyarisi" ile cozulecek.

### Stratejik Sebebi (DECISIONS.md #35)

Conversion mimari hatasi vardi: kayit olmadan core value veriyorduk. v1.0.13 once "kayit kapisini kapat", **2-3 hafta saf veri** topla, sonra premium gate'leri tekrar ayarla. Iki buyuk degisikligi ayni surume koymak olcum temizligini bozar; ama IRO maili yaklasiyor — kayit zorunlulugu maili gondermeden once oturmus olmali. Bu sebeple v1.0.13'e iki degisiklik birden alindi (premium gating + kayit zorunlulugu) — disiplinin istisnasi, IRO firsatinin onceligi.

### Build Numaralari
- version 1.0.13
- iOS buildNumber 32
- Android versionCode 33

### Apple Review Notes (English, App Store Connect)

> Version 1.0.13 introduces required registration. The app no longer allows guest access because it provides a meaningful service tied to the registered account: peer-to-peer messaging between licensed tour guides, personalized push notifications for live field updates, and subscription-based premium features. This is consistent with App Store Review Guideline 5.1.1(iv).
>
> Test account: aysetokkus@hotmail.com / 123456 (active premium)
> Free-tier test account: demo.test@pusulaistanbul.app / 123456 (registered, no subscription)

### Release Notes (TR, her iki platform)

> Üyelik sistemi yenilendi: uygulamayı kullanmak için artık hesap açmak gerekiyor. Müze ve Saray Cami sekmesinde Saraylar herkese açık; Müzeler, Özel Müzeler ve Camiler için Premium gerekir. Boğaz Turlarında Turyol genel görünümü herkese açık; Dentur, Şehir Hatları ve tüm sefer saatleri Premium oldu. Sultanahmet Camii saat penceresi ve sözleşme indirmeleri Premium kapsamına alındı.

### Bekleyen Adimlar (6 May 2026 itibariyle TAMAMLANDI)
- ✓ iOS production build alindi
- ✓ Android APK telefonda test edildi (Samsung S22)
- ✓ `eas submit --platform all --latest` calistirildi
- ✓ Apple review onaylandi (~24 saat)
- ✓ Google Play review onaylandi, manuel "Yayinla" basildi
- **Sonraki adim:** IRO maili gonderme zamani — Ayse hazir oldugunda gonderebilir, teknik on kosul tamam

---

## v1.0.12 (ATLANDI — v1.0.13 ile degistirildi, 6 Mayis 2026)

**Akibeti:** Google Play'de 4-6 May arasinda kismen yayildi (v1.0.13 yayinlanana kadar). iOS App Store'da review'da iken v1.0.13 submit edildi, v1.0.13 onayi gelince v1.0.12 atlandi. Bu sebeple v1.0.12 icindeki uc fix de v1.0.13 yayinda otomatik olarak canliya cikti — separate bir yayin gerekmedi.

---

## v1.0.12 (Google Play YAYINDA, iOS bekliyor — 4 Mayis 2026 aksam)

Uc degisiklik: (1) admin moderator atama akisinda RLS sessiz red'e karsi defansif kod, (2) havalimani ulasim sayfasina yon-spesifik guzergah bilgisi ozelligi, (3) MuzeKart sekmesinde mekan adina parantez ici istisna notu (Topkapi Harem, Dolmabahce Selamlik vb.).

### Yayin durumu
- **Google Play Production: 4 May 2026 aksam YAYINDA** — submit + onay + manuel "Yayinla" tamamlandi. Kullanicilara ~24-48 saatte yayilir.
- iOS App Store: 4 May 2026 aksam submit edildi — **REVIEW'DA**, onay bekleniyor.

### Sorun (4 Mayis 2026, Ela Karaman atama vakasi)
Ayse admin panelden Ela Karaman'i (kelebekiamarket@gmail.com) moderator olarak atadi, frontend "Basarili: Ela Karaman moderator olarak atandi" Alert'i gosterdi. Ama DB'de Ela'nin `rol` alani hala `user`. Iki kok sebep arka arkaya cozuldu:

1. **profiles.email kolonu yoktu** — admin.tsx `select('email')` calistiriyordu, hata: `column profiles.email does not exist`. Cozuldu: schema'ya kolon eklendi + auth.users sync trigger (DECISIONS #33).

2. **profiles UPDATE RLS policy admin'e izin vermiyordu** — sadece `auth.uid() = id` kontrolu vardi, admin baskasinin satirini UPDATE edemiyordu. RLS satiri gizledi, UPDATE 0 satir etkiledi, PostgREST hata atmadi, frontend "basarili" yalanini gosterdi. Cozuldu: `is_admin()` SECURITY DEFINER helper + yeni "Admin tum profilleri guncelleyebilir" UPDATE policy (DECISIONS #34).

### Fix (admin.tsx defansif kod, v1.0.12)
DB'de RLS duzeltildi ama gelecekte baska bir RLS bug'i ayni sessiz reddi yaratmasin diye admin.tsx'in iki fonksiyonu defansif yazildi:

```typescript
// moderatorAta + moderatorKaldir
const { data: guncel, error } = await supabase
  .from('profiles')
  .update({ rol: '...' })
  .eq('id', profil.id)
  .select()
  .single();
if (error) throw error;
if (!guncel) throw new Error('Yetki sorunu — kayıt güncellenmedi.');
```

`.select().single()` UPDATE'in sonucunu donduruyor. RLS satiri gizlerse `data` null donuyor, kullaniciya "Yetki sorunu" alert'i gosteriliyor. DECISIONS.md "RLS Sessiz Reddedebilir" pattern'inin uygulamasi.

Bu pattern artik Pusula'da uc fonksiyonda kullaniliyor: `durumKaldir`, `moderatorAta`, `moderatorKaldir`. Yeni admin operasyonlari da bu sablonu izlemeli.

### Yan kazanim (DB seviyesinde, build gerektirmez)
- `profiles.email` kolonu + sync trigger (96 mevcut profile auto-doldu)
- `is_admin()` helper fonksiyonu
- "Admin tum profilleri guncelleyebilir" RLS policy

### Yeni Ozellik — Havalimani Ulasim Guzergah Bilgisi (4 Mayis 2026)

Aylar boyunca eksik kalan bir kullanici talebi: rehberler havalimani transfer seferlerinin **hangi yollardan/duraklarrdan gectigini** bilmek istiyordu. Saat tablosu yeterli degildi.

**DB:** `havalimani_seferleri` tablosuna iki yeni TEXT kolon:
- `sehirden_hav_guzergah` — Sehir -> Havalimani yonu icin guzergah aciklamasi
- `havdan_sehir_guzergah` — Havalimani -> Sehir yonu icin (genelde ters istikamet ama farkli yollar olabilir)

**Frontend (`app/(tabs)/ulasim.tsx`):** Durak modal'inda saatler grid'inin altina yon-spesifik guzergah kutucugu. Sol mavi accent bar, "GÜZERGAH" basligi, multi-line aciklama. **Sadece dolu olduğunda gorunur** — bos kayitlar icin ekrani kalabalik etmez.

**Admin (`app/admin-ulasim-tarife.tsx`):** Sefer duzenleme modal'inda her saat alanindan sonra ona ait guzergah TextInput'u (multiline). Placeholder ornekleri:
- Sehir -> Hav: `Aksaray Metro - O-3 - Mahmutbey - Basin Ekspres - Havalimani`
- Hav -> Sehir: `Havalimani - Basin Ekspres - Mahmutbey - O-3 - Aksaray Metro`

**Yayin sonrasi:** v1.0.12 yayina cikinca admin panelden Ayse mevcut duraklarin guzergahlarini manuel doldurur. Doldurulmamis kayitlar icin frontend kutucugu gostermez (geriye uyumluluk).

**Tasarim notu:** Iki ayri kolon, cunku farkli yollar olabilir. Ornegin Aksaray icin sehirden gidiste E-5 / Yenikapi rotasi kullanilabilir, donuste TEM / Mahmutbey daha hizli olabilir. Tek kolon yerine iki kolon esneklik saglar.

### Yeni Ozellik — MuzeKart Mekanlar Listesinde Parantez Ici Istisna Notu (4 Mayis 2026)

**Sorun:** MuzeKart sekmesindeki "MuzeKart Geçen Yerler" listesinde Topkapi ve Dolmabahce sadece isimle yer aliyordu. Ama bu mekanlarda **sarayin tamami MuzeKart kapsaminda degil**:
- Topkapi'da **Harem bolumu** ek bilet gerektirir
- Dolmabahce'de **Selamlik bolumu** ek bilet gerektirir

Bu bilgi rehberin sahada bilmesi gereken kritik bir ayrinti.

**DB:** `mekan_saatleri` tablosuna `muzekart_not TEXT` kolonu eklendi. Topkapi -> "Harem'de geçmez", Dolmabahce -> "Selamlik'ta geçmez" otomatik dolduruldu (migration ile).

**Frontend (`app/(tabs)/muzeKart.tsx`):** Geçen ve geçmeyen yerler listesinde mekan adinin yaninda parantez ici (italik) not gosterilir. Sadece dolu olduğunda gosterilir, bos kayitlar icin sade isim kalir.

**Admin (`app/admin-saatler.tsx`):** MuzeKart durumu (Geçer/Geçmez) secildiginde yeni bir "Istisna / Aciklama Notu" TextInput'u gorulur. Format aciklamasi placeholder'da: "Harem'de geçmez", "Selamlik'ta geçmez".

**Excel pipeline:** `mekan-saatleri-veri-giris.xlsx`'e "MuzeKart Not" kolonu eklendi (MuzeKart kolonundan sonra), Topkapi + Dolmabahce dolu. `excel-full-sync-sql.py` ve `excel-diff-sql.py` KOLON_MAP'lerine ve SYNC_ALANLAR'a "muzekart_not" eklendi — gelecek sync'lerde dahil olur.

**Tasarim notu — neden ayri kolon, "ozel_not" yerine:** `ozel_not` zaten mekan ile ilgili genel bilgi (saat istisnalari, gizem, vb.). MuzeKart-spesifik istisna AYRI bir konu — listede gosterim icin spesifik bir alan gerek. Karistirmamak icin yeni kolon dogru karar.

### app.json (bumpsiz hazir)
- version: 1.0.11 → **1.0.12**
- iOS buildNumber: 29 → **30**
- Android versionCode: 30 → **31**

### Build & yayin
1. EAS build her iki platform — `eas build --platform all --profile production`
2. iOS + Android submit + Manual Release
3. Onay sonrasi manuel "Release"

### Release Notes — Store (TR, kullaniciya gorunen "Whats New")
```
Havalimanı ulaşım sayfasına güzergah bilgisi eklendi. MüzeKart listesinde saraylar için istisna bilgisi (Topkapı Harem, Dolmabahçe Selamlık) gösterimi. Performans ve kararlilik iyilestirmeleri.
```

**Karar gerekcesi:** Yeni ozellikler (guzergah + muzekart istisna notu) kullaniciya pozitif duyuru — spesifik olmasi marka guvenine zarar vermez. Internal RLS fix'i ise "performans ve kararlilik" altinda gizliyoruz cunku son kullaniciya gorunmuyor.

### App Review Information — iOS Reviewer Notes (EN, kullanici GORMEZ)
```
v1.0.12 — Three changes:

1. Internal admin operation safety improvement.
Fixed: admin moderator assignment flow now correctly detects RLS policy denials. Previously a server-side RLS rule could silently block the UPDATE while the client thought it succeeded. Adds a defensive check on the returned row to surface the failure as a user-facing error.

2. New feature: airport transit route information.
Added two columns to the airport_routes table (sehirden_hav_guzergah, havdan_sehir_guzergah) and surfaced them in the airport route detail modal. Admins can now describe the streets/stations a transit line passes through; users see this when they tap a stop. Optional, only shown when filled.

3. New feature: MuseumPass exception note for venues.
Added a muzekart_not column to the venues table to surface partial-coverage info (e.g., "Topkapı Palace MuseumPass valid except Harem section"). Shown in italic parentheses next to the venue name in the MuseumPass tab list. Optional, only shown when filled.

No permissions changes, no IAP changes.

Test account: aysetokkus@hotmail.com / 123456 (admin role for testing the features).
```

### DERSLER
- **`.select()` after UPDATE** — PostgREST UPDATE 0 satir etkiledigi durumlarda hata atmaz. `.select().single()` ile etkilenen satiri geri al, null kontrolu yap. Bu sablon artik tum kritik admin operasyonlarinda zorunlu.
- **RLS yetki modeli iki katmanli:** Kendi profili icin ALL policy + admin icin UPDATE policy. Birden fazla PERMISSIVE policy `OR` mantigiyla birlesir. Yeni rol tipleri eklenirse (orn. content_moderator) ayri policy yazilir, mevcutlar genisletilmez.
- **Yon-spesifik metadata icin iki ayri kolon** — Havalimani guzergahi ornek: gidis ve donus farkli yollar olabilir. Tek kolonla "iki yon icin de gecerli" varsayimi gercekligi yansitmaz. Ayri kolonlar marjinal storage maliyeti ile esneklik kazandirir.

---

## v1.0.11 (YAYINDA — 4 Mayis 2026)

İki bagimsiz fix tek surumde toplandi: 1 Mayis'ta tespit edilen UX bug + 3 Mayis'ta tani konulan sistematik kod bug'i.

### Yayin durumu
- iOS App Store: 4 May 2026 (~24 saat onay)
- Google Play Production: 4 May 2026 (~24 saat onay, beklenen 3-7 gunden cok daha hizli)
- Manual release ikisinde de basildi

### Build numaralari (yayinda)
- iOS buildNumber: **29**
- Android versionCode: **30**

(Not: STATE.md'de daha onceki cevaplarda buildNumber 28/versionCode 29 yazilmisti — son "Yayinla" oncesi yeniden build alindi, gercek buildNumber 29/versionCode 30.)



Iki bagimsiz fix tek surumde toplandi: 1 Mayis'ta tespit edilen UX bug + 3 Mayis'ta tani konulan sistematik kod bug'i.

### Fix A — "Apple ID" Hardcoded UX (1 Mayis 2026)

**Sorun:** Orcun Taran (taranorcun@gmail.com) Android cihazinda Pusula Istanbul'u kullanirken "Aktif Abonelik Bulunamadi" hata Alert'inde "Bu Apple ID ile..." metnini gordu. Cihaz Android, Apple ID jargonu yanlis ve kafa karistirici.

**Sebep:** `app/abone-ol.tsx` line 185 ve `app/(tabs)/profil.tsx` line 276 — restore purchases akisinda hata mesaji platform-aware degildi. Eski kod Apple/iOS varsayimi yapiyordu.

**Fix:** Iki dosyada da generic metin: "Hesabiniz ile iliskili aktif bir abonelik bulunamadi." Platform agnostic, hem iOS hem Android icin dogru.

### Fix B — use-abonelik.ts NULL Profile Sistematik Bug (3 Mayis 2026)

**Sorun:** 2 Mayis sabahi Supabase taramasinda 6 kullanicida ayni desen tespit edildi: `abonelik_durumu='aktif'`, `abonelik_plani=NULL`, `abonelik_bitis=NULL`. Sebnem (1 May "race condition" denilen vaka) tek vaka degildi — sistematik kod hatasi. Etkilenen 4 gercek kullanici (Selim, Nadriye, Betul, Ebru) + 2 dev hesap.

**Sebep:** `hooks/use-abonelik.ts`'de RC entitlement aktif olunca Supabase'e sadece `abonelik_durumu` yaziliyordu, plan ve bitis NULL kaliyordu. Iki yerde ayni hata:
- Line 100-105: `kontrolEt()` icindeki RC dali
- Line 173-175: `addCustomerInfoUpdateListener` callback'i

`abone-ol.tsx`'in satin alma akisi zaten uc alani da yaziyordu, ama restore/merge/yeniden-giris yollari hep bu iki bug'li yerden geciyordu.

**Fix:**
- Yeni helper `planFromProductId()` — Apple (`com.pusulaistanbul.app.yillik`) ve Play (`com.pusulaistanbul.app.yillik:yillik-yeni`) format'larini `includes('yillik')` / `includes('aylik')` ile yakalar
- `rcAbonelikKontrol()` artik `boolean` yerine `{aktif, productId, expirationDate}` donduruyor
- Iki RC sync noktasi guncellendi — durumu + plan + bitis hepsini, idempotent reconciler mantigiyla (sadece eksik/farkli alanlari yazar)
- Profile select cumlesine `abonelik_plani` eklendi (karsilastirma icin gerekli)
- Yorum bloklarinda `BUG FIX (v1.0.11)` etiketi var

**Manuel doldurma (3 May, build ONCESI):** 4 etkilenen kullanicinin profili RC verisinden atomic SQL ile dolduruldu. v1.0.11 yayina cikinca yeni vakalarda kod kendi kendini duzeltir, eski vakalar manuel ile temizlendi.

**Bonus bulgu:** RC'de 4 kullanicinin de satin alma kayitlari iOS App Store. **Yeni Play Store config bug magduru YOK** — sadece 1 May'daki 2 magdur (Mustafa, Sebnem). Apple subscription model'inde base plan billing period yanlislugu mumkun degil.

Detay: DECISIONS.md #31.

### app.json (yapildi 3 May)
- version: 1.0.10 → **1.0.11** ✓
- iOS buildNumber: 27 → **28** ✓
- Android versionCode: 28 → **29** ✓

### Build & yayin
1. EAS build her iki platform — `eas build --platform all --profile production`
2. iOS submit + Manual Release — `eas submit --platform ios --latest`
3. Android submit + Yonetilen yayinlanma — `eas submit --platform android --latest`
4. Onay sonrasi manuel "Release This Version" + "Yayinla"

### Release Notes — Store (TR, kullaniciya gorunen "Whats New")
```
Performans ve kararlilik iyilestirmeleri.
```

**Karar gerekcesi:** v1.0.11 fix'leri kullanicinin gorunur dunyasinda hicbir sey degistirmiyor — abonelik validasyonu zaten RC entitlement'tan geciyordu, NULL profile durumunda da kullanici premium goruyordu. Spesifik release notes ("plan/bitis bilgisi gorunmuyordu") kullanicinin kafasinda "demek bir sey calismiyormus" sorusu yaratir, marka guvenine zarar verir. Generic "performans ve kararlilik" formulu hem profesyonel hem de hicbir aksaklik imasi vermez.

### App Review Information — iOS Reviewer Notes (EN, kullanici GORMEZ)
```
v1.0.11 — Internal data sync improvement and minor UX text fix.

- Fixed: subscription metadata (plan + expiration) not always written to user profile cache after RevenueCat sync. Behavior unchanged for end users (subscription validation goes through RC entitlements directly).
- Fixed: error message in restore-purchases flow used "Apple ID" hardcoded text; now generic "your account" wording for cross-platform correctness.

No new features, no permissions changes, no IAP changes.

Test account: aysetokkus@hotmail.com / 123456 (premium subscription granted via Supabase fallback for review testing).
```

### DERSLER
- **Generic UI metni > Platform-spesifik metin:** "Hesabiniz" gibi platform-agnostic yazma, hem dogru hem evrensel. Platform-spesifik metin yazacaksan `Platform.OS` ile cek (ama gereksiz karmasiklik).
- **Race condition tek vakada hipotez, ikinci vakada tarama yap.** N=1 → race condition mumkun, N=2+ → sistematik bug. Sebnem'in vakasi (DECISIONS.md #30) bagimsiz ele alindi, ama 6 kullanicilik tarama sonucu gercek tani cikti.
- **RC entitlement tek dogruluk kaynagi.** `productIdentifier` + `expirationDate` her zaman guncel. Supabase profile bunu yansitmali, manuel tutmamali. Yeni satin alma yollari eklendiginde hep "RC'den oku, Supabase'e yaz" disiplini.
- **Idempotent reconciler > atomic update**, eger birden fazla kod yolundan veri yazmaya geliyorsan. Atomic disiplini birden fazla yerde kirilabilir; reconciler kendi kendini duzeltir.

---

## v1.0.10 (YAYINDA — 1 Mayis 2026, her iki platformda)

**Sorun:** v1.0.9'daki Pending Pattern fix'i Apple ve Google'da yayina cikti, **cold-start senaryosunu** cozdu. AMA Ayse iPhone7 iOS 15.8'de test ettiginde sifre sifirlama hala calismadi: app ana ekrana acilip recovery session kuruluyor, ama `/sifre-sifirla` ekranina yonlendirme yapilmiyor. Bu **warm-start** senaryosu (app arka planda iken Mail'den linke basildiginda).

### Tani Sureci (30 Nisan 2026)
1. Ayse iPhone7'de test → "kendi kendine login oluyorum" → ana ekran (sifre-sifirla GELMIYOR)
2. Mail link uzun bas → URL `https://rzlfghjpsximthlolfxo.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=pusulaistanbul://giris` (SafeLinks YOK, normal Supabase URL)
3. Tikla → Safari → "Pusula Istanbul ile Acilsin mi?" popup → Ac → app foreground → ana ekran
4. **Hipotez:** App arka planda → 'url' event fire eder → handleAuthDeepLink koshar → setSession basarili (recovery session kurulur, kullanici "login" gorunur) → setSifreSifirlamaPending(true) → useEffect tetiklenir → router.replace('/sifre-sifirla') AMA SILENTLY FAIL → kullanici /(tabs)'da kalir
5. **Sebep:** Expo Router `(tabs)` group'tan disari escape (route group escape) sirasinda React state batching ile race girer. Pending Pattern fonts/oturum/abonelik bekliyor (cold-start icin), ama warm-start'ta bunlar zaten hazir → router.replace immediate cagriliyor → router transition tick stable degil → silently fail.

### Fix: setTimeout(150) Defer (cift guvence)
`app/_layout.tsx` (~line 137-150 ve ~207-220):
- **PASSWORD_RECOVERY event handler:** `setSifreSifirlamaModu(true) + setSifreSifirlamaPending(true)` sonrasi `setTimeout(() => router.replace('/sifre-sifirla'), 150)` direkt navigate (warm-start path)
- **Pending Pattern useEffect:** `router.replace` cagrisi `setTimeout(() => { router.replace... }, 150)` ile defer edildi (cold-start path)
- 150ms defer = Expo Router internal stack state stable olana kadar bekleme suresi
- Cift yol birbirinin yedek (cold-start'ta ikisi de tetiklenebilir, warm-start'ta sadece event listener tetiklenir, race condition azalir)

### Dogrulama Test Akisi (30 Nisan 2026)
- iOS: iPhone7 iOS 15.8 + TestFlight uyumsuzlugu (TestFlight iOS 16+ gerektiriyor) → Mac M1 + TestFlight + "Designed for iPad" alternatifi kullanildi. App acildi → login + sifremi unuttum + email + link → /sifre-sifirla ekrani GELDI ✓ → yeni sifre belirle → giris ekranina don → yeni sifre ile login ✓
- Android: Preview APK Samsung S22'ye yuklendi, ayni akis test edildi → /sifre-sifirla ekrani GELDI ✓ → tum akis basarili ✓

### app.json Bumped
- version: 1.0.9 → **1.0.10**
- iOS buildNumber: 26 → **27** (EAS auto-bump)
- Android versionCode: 27 → **28** (EAS auto-bump)

### Tamamlanan Adimlar (30 Nisan 2026)
1. ✓ `_layout.tsx`'e cift defer fix uygulandi
2. ✓ `app.json` version 1.0.10
3. ✓ iOS production build (~5 dk cache hit) — IPA hazir
4. ✓ Android production AAB build (~25 dk) — AAB hazir
5. ✓ Android preview APK (telefon testi icin) — APK hazir
6. ✓ iOS `eas submit` → ASC processing → TestFlight Internal Testing'e yuklendi
7. ✓ TestFlight "Gelistirici" grubu olusturuldu, automatic distribution acik, aysetokkus@hotmail.com tester olarak eklendi
8. ✓ Mac M1 + TestFlight ile sifre sifirlama akisi DOGRULANDI
9. ✓ Samsung S22 + APK ile sifre sifirlama akisi DOGRULANDI
10. ✓ iOS App Store Submit for Review (Manual Release secildi, App Review notes detayli yazildi)
11. ✓ `eas.json` submit track "internal" → "production" (EAS CLI 18.x'te `--track` flag kaldirildi)
12. ✓ Android `eas submit --platform android --latest` → Play Console Production Draft yuklendi
13. ✓ Play Console v1.0.9 (versionCode 26) "Devre disi" oldu (atlanacak), v1.0.10 (versionCode 28) inceleme'ye gonderildi
14. ✓ `.gitignore` guvenlik guncellemesi: google-service-account.json + raporlar + *.eski exclude
15. ✓ v1.0.0 → v1.0.10 toplu git commit + push (commit `48249ed`, 80 dosya, 8337 insertion) — 3 haftalik birikim GitHub'da yedeklendi

### Yayin Adimlari (1 Mayis 2026)
16. ✓ Apple Review onayi geldi (~24 saatten kisa surede — beklenen 24-48 saatten cok daha hizli) → "Pending Developer Release" durumu
17. ✓ Google Play onayi geldi (~24 saatten kisa surede — beklenen 3-7 gunden cok daha hizli) → "Yayinlanmaya hazir" durumu
18. ✓ App Store Connect: "Release This Version" tusuna manuel basildi → v1.0.10 App Store'da yayina cikti
19. ✓ Play Console: "Yayinla" tusuna manuel basildi → v1.0.10 Google Play'de yayina cikti
20. ✓ STATE.md ve CHANGELOG.md guncellendi (yayin durumu)

### Yayin Sonrasi 1 Mayis 2026 (ayni gun, ayri olaylar)
- **Play Store Yillik Plan config bug kesfedildi:** Yayinlandiktan birkac saat sonra Orcun Taran (taranorcun@gmail.com) bildirdi: yillik plan satin alma ekraninda "TRY 699,99/month" goruyor. Aslinda Play Console'daki Yillik Plan urununun base plan'i (`yillik`) **AYLIK** fatura donemi olarak konfigure edilmisti — kod hatasi degil, store yapilandirma hatasi. Bug v1.0.10 ile alakasiz ama ayni gun ortaya cikti.
- **Etkilenen 2 musteri (Mustafa Tanribilir + Sebnem Buyukkaragoz)** icin Play Console'dan refund yapildi (her biri 699,99 TL = 1.399,98 TL toplam). Abonelikleri iptal edildi. RC'de manuel premium grant ile 2027-05-01'e kadar ucretsiz erisim verildi (1 yil hediye).
- **Orcun Taran (3. kullanici)** karti banka tarafindan bloke edildigi icin satin alma gerceklesmedi (ironik kazanc). Hesabi Supabase Dashboard admin yetkisiyle yaratildi, abonelik_durumu='aktif'+yillik+2027-05-01 olarak set edildi. Onun da 1 yil ucretsiz premium kazanci.
- **Play Console fix:** Yeni `yillik-yeni` base plan olusturuldu (Yillik dönem, 699,99 TL), aktif edildi, eski `yillik` base plan devre disi birakildi. RC offering yeni urune yonlendirildi.
- **UX bug fix kodda:** `app/abone-ol.tsx` ve `app/(tabs)/profil.tsx`'te "Apple ID" hardcoded metni Android'de yanlis gorunuyordu — generic "Hesabiniz" olarak duzeltildi (v1.0.11'de yayina cikacak).
- **Detayli incident raporu:** ISSUES.md "Bugun cozulen" bolumu ve DECISIONS.md #27 "Play Console Base Plan Billing Period Verification".

### Release Notes (Turkce, her iki platform)
```
E-posta uzerinden gelen sifre sifirlama baglantisi artik dogru ekrana yonlendiriyor.
Bazi kullanicilarin "Yeni Sifre Belirle" ekranini goremedigi teknik sorun duzeltildi.
```

### Apple App Review Notes (Ingilizce)
"Bug → Root cause → Fix" formatinda detayli teknik aciklama yazildi (race condition + group escape + setTimeout defer). Test Account ve adim adim test scenario eklendi.

### DERSLER
- **Pending Pattern tek basina yetmez** — Stack mount ek olarak Expo Router route group escape race'i de var, defer ile cozuluyor
- **Mac M1 + Designed for iPad** — eski iOS cihazlar TestFlight'a yetisemediginde altin alternatif (iPhone7 iOS 15.8 → TestFlight 16+, Mac M1 cozdu)
- **EAS CLI 18.x `--track` flag kaldirildi** — eas.json'a koyma zorunlu, komut satirinda override edilemez
- **TestFlight Internal Testing review YOK** — Submit for Review tusuna BASMADIKCA Apple inceleme baslamiyor, internal tester'lar anlik test edebilir
- **Microsoft Defender SafeLinks debug tuzaklari** — Outlook'tan kendine forward edersen safelinks ekleniyor, gercek email link'i kafa karistiriyor. Test icin SafeLinks'siz mail (Gmail/iCloud) kullan.
- **Git commit eksikligi kritik risk** — v1.0.0'dan v1.0.10'a 3 haftalik birikim sadece local diskte tutuluyordu. Toplu commit ile cozuldu, ileride her surumde commit zorunlu.
- **Onay sureleri tahmin edilenden hizli olabilir** — v1.0.10'da hem Apple hem Google 24 saatten kisa surede onayladi. Beklenen sure (Apple 24-48 saat, Google 3-7 gun) konservatif tahminler — gercek sure cogu zaman daha kisa. Manuel release secimi bu yuzden onemli: hizli onayda da Ayse'nin son kontrol sansi olur.
- **Tester hesabi production'i goremez** — Ayse'nin hesabi alpha test listesinde oldugu icin Play Store'da Beta rozetiyle gorundu. Production yayini dogrulamak icin tester olmayan baska bir hesap/cihaz gerekli. Bu karisikligi onlemek icin alpha kanali kapatilmali.

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
