# Pusula Istanbul - Mevcut Durum

> ## YENI OTURUM BURADAN BASLA (3 Eylul 2026, gece — oturum kapanisi)
>
> **OTURUM KAPANISI (3 Eyl 2026, ikinci oturum sonu — Ayse "md'yi guncelle, oturumu sonlandiralim").** `git status` ~97 dosya, COMMIT YOK. Bu oturumda: Ajanda + Masraf Pusulasi (v1 → v2 rehberlik ucreti + cok gunlu tur → v3 metin rotuslari + Mail/WhatsApp/Telefona kaydet → v4 imza = rehberin adi). Supabase: 2 migration uygulandi, Edge Function `masraf-disa-aktar` v2 CANLI (E2E test edildi, test verisi silindi). tsc 0 / eslint (yeni dosyalar) 0. **Yeni oturumda sira:** (1) Ayse telefonda test edecek → **yeni dev build sart** (`eas build --profile development` ya da `npx expo run:android`; expo-mail-composer/sharing/file-system native) — Chrome'da e-posta eki eklenemez, orada yalnizca indirme + mailto. (2) "commit'le" derse tek commit (mesaj asagida, "Ajanda + Masraf Pusulasi" dahil) + push → `docs/varliklar/` GitHub Pages'e cikar → ciktilarda logo gorunur. (3) app.json 1.2.0 + build numaralari → EAS store build. Detay: asagidaki bloklar, PROJECT.md 9c, DECISIONS #53, CHANGELOG v1.2.0. Acik nokta: PDF/Word/Excel alt bilgisindeki "Pusula Istanbul ile olusturuldu" ibaresi duruyor (Ayse istemedi mi net degil — sorulacak).
>
> **YARIN ILK YAPILACAKLAR (Ayse, 3 Eyl 2026 oturum kapanisinda verdi — sirayla):**
> 1. **Telefon numarasi ile uyelik** + **dogrulama SMS'i** (Supabase Auth phone/OTP; SMS saglayici secimi gerekir — Twilio/MessageBird/Vonage ya da Turkiye'de Netgsm/Iletimerkezi; maliyet + KIRMIZI CIZGI: Supabase plani Hey Istanbul ile ortak, plan degisikligi ONERME). `profiles.telefon` zaten var (~301 profilde bos).
> 2. **Google ve Apple hesabi ile giris** (Supabase Auth OAuth: Google + Sign in with Apple; Expo tarafinda `expo-apple-authentication` + Google native/OAuth akisi, deep link `pusulaistanbul://`; Apple: App Store'da ucuncu taraf giris varsa Apple girisi ZORUNLU; yeni native modul → store build).
> 3. **TUREB veritabanindan ruhsatname kontrolu** (`profiles.ruhsat_no` var; TUREB'in resmi sorgu servisi/sayfasi arastirilacak — 3 Eyl karari "kayit serbest, TUREB dogrulamasi yok" idi, Ayse simdi kontrol istiyor: kayitta mi, sonradan rozet mi, karar sorulacak).
> 4. **Rehber ilanindaki dil listesinin guncellenmesi** (`constants/diller.ts`, 74 dil; Ayse'den guncel liste/degisiklik alinacak — TUREB dil listesiyle karsilastir).
> 5. **Profil fotografi + sohbette isim yaninda kucuk resim** — profil duzenlemeye foto secimi (expo-image-picker zaten var; yeni bucket `profil-fotolari` public okuma, sahibi yazar, kare kirpma/kucultme), `profiles.avatar_url` kolonu; sohbet/DM balonlarinda ve ilan kartlarinda avatar harfi yerine kucuk resim (foto yoksa mevcut harf avatari kalir); DM listesi ve tepki verenler listesinde de.
> 6. **GIZLILIK — ozel mesajlar + ajanda/masraf pusulalari ADMIN DAHIL kimseye gorunmez** (Ayse: "insanlar yaptiklari isin gorunecegini, kazandiklarinin bilinmesinden korkabilir"). **Mevcut teknik durum (3 Eyl gece pg_policies ile dogrulandi):** `ajanda_turlar` / `masraflar` RLS yalnizca `kullanici_id = auth.uid()` (admin/moderator policy'si YOK); `dm_konusmalar` / `dm_mesajlar` yalnizca iki katilimci; `masraf-fisler` bucket ozel, yalnizca sahibi okur/yazar/siler; Edge Function `masraf-disa-aktar` kullanicinin kendi JWT'siyle calisir. **ACIK:** DM gorselleri `sohbet-gorseller` bucket'inda (PUBLIC okuma + admin silebilir) → DM icin OZEL bucket + imzali URL'e tasinmali. **YAPILACAK:** (a) DM gorselleri ozel bucket; (b) UI'da acik gizlilik ifadeleri — DM ekrani ustu/altinda "Bu konusma yalnizca ikinize gorunur; yoneticiler dahil kimse okuyamaz", ajanda/tur ekraninda "Ajandan, masraflarin ve ucretlerin yalnizca sana gorunur; Pusula yoneticileri dahil kimse goremez, hicbir yerde paylasilmaz" (ajanda.tsx dipnotu genisletilir), profil'e "Gizlilik" bolumu; (c) `app/gizlilik-politikasi.tsx` + `kullanim-kosullari.tsx` + magaza gizlilik metnine "Ozel mesajlar ve masraf verileri" maddesi (DURUST yaz: uygulama icinde yonetici erisimi yok, RLS ile veritabani seviyesinde kisitli, sifreli baglanti/depolama; veritabani sahibinin teknik erisimi vardir — 'kimse goremez' yerine 'uygulama uzerinden hicbir yonetici goremez'); (d) ileri secenek (Ayse'ye sorulacak): masraf tutarlarini istemci tarafinda sifreleme (uctan uca) — o zaman disa aktarma istemcide uretilmeli, maliyetli.
> Bunlar ajanda/masraf isinin commit + build adimlarindan BAGIMSIZ; once dunku kodun commit'i mi, once bunlar mi — Ayse'ye sorulacak.
>
> **[3 Eyl 2026, ikinci oturum — AJANDA + MASRAF PUSULASI eklendi, ROTA PLANLAYICI SILINDI]** Ayse: "rota olustur yerine ajanda + her gun icin masraf pusulasi; Excel/Word/PDF disa aktarma + mail; ciktilar logolu ve palette, logo minik". Kararlari: mail = telefonun mail uygulamasi (Pusula gondermez); kategoriler muze/giris, ulasim, otoyol/kopru, otopark, kaptan yemek, rehber yemek, bahsis, telefon, diger; fis fotografi; doviz (TRY/EUR/USD); AVANS ayri satir, masraflardan duser; ajanda = ana sayfa karti (haftanin dolu gunleri renkli) + tam ekran; rota kodu tamamen sil. **YAPILDI:** migration `ajanda_ve_masraf_pusulasi` UYGULANDI (rotalar DROP — 2 test satiri vardi; ajanda_turlar, masraflar, bucket masraf-fisler + 3 policy); Edge Function **`masraf-disa-aktar` v1 DEPLOY EDILDI** (verify_jwt acik; pdf-lib/docx/exceljs; E2E test demo hesapla basarili: PDF+Word+Excel 3.7 sn, fis gomuldu; test turu silindi); kod: `constants/masraf.ts`, `hooks/use-ajanda.ts`, `hooks/use-masraflar.ts`, `lib/masraf-disa-aktar.ts`, `components/ajanda-karti.tsx`, `components/tur-form-modal.tsx`, `app/ajanda.tsx`, `app/tur/[id].tsx`, `components/ui/takvim.tsx` (gecmisSecilebilir/isaretler), `_layout` Stack (ajanda, tur/[id]), index.tsx `<AjandaKarti />`; `app/rota.tsx` + `lib/rota-motoru.ts` + `hooks/use-rota.ts` + `components/rota-karti.tsx` SILINDI; `npx expo install expo-mail-composer expo-sharing expo-file-system` (app.json plugin eklendi, izin metinleri fis'i kapsar); `tsconfig exclude: supabase/functions` → **tsc 0 hata**, eslint yeni dosyalarda 0 (index.tsx:552 eski bir `react/no-unescaped-entities` hatasi var, bana ait degil); fonksiyon kaynagi `supabase/functions/masraf-disa-aktar/` (6 dosya); varliklar `docs/varliklar/` (Poppins TR alt kumesi ×3 + logo kobalt/beyaz 192px). **DIKKAT:** ciktilardaki logo `https://pusulaistanbul.app/varliklar/` yayina cikinca (commit+push → GitHub Pages) gorunur; o ana kadar PDF/Word/Excel logosuz, font google/fonts'tan gelir. Bkz. PROJECT.md 9c + DECISIONS #53 + CHANGELOG v1.2.0. **v4:** mail/WhatsApp metninde imza = KULLANICININ ADI (profiles isim soyisim, yoksa e-posta kullanici adi) + telefonu; "Pusula Istanbul ile hazirlandi" satiri KALDIRILDI (Ayse: gonderen Pusula olmasin). Profil gonderim aninda okunur (bos imza yarisi kapandi). **v3 rotuslar (Ayse, Chrome testinden sonra):** form metinleri ("Tur / Musteri adi", acente e-posta alti not "Tur sonunda masraf pusulasini gondermek istediginiz e-posta adresini giriniz.", modal alt yazisi "Ajandaniza kayitli turlarinizin masraflarini yazabilir, fis/fatura gorsellerini ekleyerek dogrudan acenteye ya da kendinize gonderebilirsiniz."); "Paylas" yerine UC BUTON: **Mail Gonder** (MailComposer ekli) · **WhatsApp ile Gonder** (paylasim sayfasi, WhatsApp secilir; `Linking.canOpenURL('whatsapp://')` ile yuklu mu uyarisi) · **Telefona Kaydet** (Android: `FileSystem.StorageAccessFramework` klasor sec + yaz; iOS: Dosyalar'a kaydet sayfasi). Web'de (Ayse'nin gordugu "kaydetme ekrani"): tarayici e-postaya ek EKLEYEMEZ → dosyalar indirilir + `mailto:` (`window.location.href`) / `wa.me` acilir, uyar() ile aciklanir; `dosyalariIndir` artik eylem aninda (uretimde degil). Gercek akis yalnizca telefonda (yeni dev build gerekir). **v2 (ayni gun, Ayse'nin iki eki):** (1) **Rehberlik ucreti** — `masraflar.tip='ucret'` (TRY/EUR/USD), tur ekraninda "Rehberlik ucreti" bolumu (+ Ucret), ozet 4 satir: masraf + ucret − avans = kalan. (2) **Cok gunlu tur** — `ajanda_turlar.bitis_tarih`, `masraflar.tarih` (satirin gunu); form "Cok gunlu tur" anahtari + bitis takvimi; ajanda kartinda/takvimde aralik boyunca dolu gunler, "BUGUN · 3/19. GUN" etiketi; masraf formunda gun chip'leri, listeler gune gore gruplu; ciktilarda GUN sutunu ve "12 – 30 Eylul 2026 (19 gun)". Migration `ajanda_cok_gunlu_tur_ve_rehberlik_ucreti` UYGULANDI, Edge Function **v2 deploy + E2E test OK** (test verisi silindi). tsc 0, eslint 0. Kod incelemesi (ikinci tur) sonrasi duzeltmeler: Takvim `value` degisince ay senkronu; `tutarParse` TR binlik ("1.250" = 1250); tur silinince fis klasoru temizlenir; `lib/uyari.ts` (web'de Alert no-op → window.alert/confirm); web'de fis secici dogrudan galeri; MailComposer hatasi 'unavailable'; tur ekraninda "Turu Sil" butonu; yeni tur → modal kapaninca InteractionManager ile tur ekranina gecis. **Cihaz testi bekliyor:** ajanda karti/takvim, tur formu, masraf formu (fis kamera/galeri, tutar "1.250,50"), avans, ozet, "Mail Gonder" (mail uygulamasi ekli acilmali) ve "Paylas"; Chrome'da dosyalar indirilir + mailto acilir.
>
> **Durum:** 3 Eylul boyunca yapilan BUTUN is Mac'teki calisma kopyasinda, **HENUZ COMMIT EDILMEDI** (`git status` ~82 degisik dosya; ayrica Agustos'tan kalan CLAUDE.md/STATE.md/ISSUES.md/scripts degisiklikleri de ayni commit'e girecek). Supabase tarafi (migration'lar + Edge Function'lar) ise CANLI ve uygulanmis durumda — DB ile kod arasinda su an "kod geride" durumu var, yani eski 1.1.1 kullanicilari yeni tablolari gormez ama kirilma da olmaz (eski kod yeni kolonlari kullanmiyor; push-gonder v6 eski kanallara geri uyumlu).
>
> **Bu oturumda tamamlananlar (hepsi kodlandi, tsc app 0 hata, eslint 0 error):**
> 1. Tamamen ucretsiz model (RevenueCat/paywall cikti; `yeni-kayit-hediye` v3; magaza urunleri satistan kalkti).
> 2. Admin paneli yerine inline yonetim (`components/yetkili/*`, 9 admin ekrani silindi).
> 3. Maliyet raporu `raporlar/maliyet-raporu-2026-09.md`.
> 4. UI redesign "Kobalt & Menekse" (theme v2 + pusula-ui + 31 dosya; logo kilidi eski yerlesim; yeni splash + ikonlar).
> 5. Sohbet: tepkiler + yanit + gorsel paylasimi (2 migration, push-gonder v5).
> 6. Bogaz: hafta ici + hafta sonu tarifeleri ayni anda.
> 7. "Rehber Araniyor" ilan sekmesi (Ara sekmesinin yerine; migration `ilanlar_ve_rotalar`, push-gonder v6 dil filtreli, takvim, TUREB taban kontrolu, 74 dil, "Bildirim dillerim").
> 8. ~~Rota planlayici~~ → ikinci oturumda TAMAMEN SILINDI; yerine AJANDA + MASRAF PUSULASI (yukaridaki blok).
> 9. Ozel mesajlasma (DM): migration `ozel_mesajlasma`, `hooks/use-dm.ts`, `app/dm/[id].tsx`, sohbet.tsx "Genel | Mesajlarim" segmenti, ilan kartinda "Mesaj"; admin okuyamaz, engelleme sunucuda, hedefli push.
>
> **Sirada olan (Ayse onayi gerekli, sirayla):**
> - (a) **Cihaz testi.** Ayse Mac'te Chrome web ile bakiyor (`npx expo start` → `w`). Telefonda dev client "invalid URL host / tunnel" sorunu COZULMEDI; oneri: USB + `a` (Android) ya da yeni dev build (expo-mail-composer/sharing native → yeni dev build gerekir). Test oncelikleri: **ajanda + masraf pusulasi + acenteye gonder**, inline yetkili panelleri (MekanSaatleriYonetim kategori senkronu, SohbetYonetim ListHeader), sohbet cift dokunma + scrollToIndex, gorsel yukleme (bucket `sohbet-gorseller`), ilan formu (takvim + taban ucret uyarisi), DM akisi (isme dokun → konusma → okundu), kicker uppercase Turkce I/i.
> - (b) **git commit** — Ayse "commit'le" demeden ATMA. Onerilen mesaj: `v1.2.0 hazirlik: ucretsiz model, inline yonetim, Kobalt&Menekse redesign, sohbet tepki/yanit/gorsel, Rehber Araniyor ilanlari, DM, Ajanda + Masraf Pusulasi` (+ Co-Authored-By satiri).
> - (c) `app.json` version **1.1.1 → 1.2.0** (+ ios buildNumber / android versionCode bump; ONCEKI: iOS build 39/1.1.1, Android versionCode 43).
> - (d) **EAS STORE BUILD sart** (OTA YETMEZ): native degisiklikler = react-native-purchases kaldirildi, yeni ikon/splash, expo-image-picker plugin + kamera/galeri izin metinleri, expo-mail-composer + expo-sharing + expo-file-system. `eas build --platform all --profile production` → submit → review → yayin sonrasi `app_versions` UPDATE (guncelleme bandi).
> - (e) Yayin sonrasi: `docs/index.html` web sayfasi hala eski mavi palet (ayri is); TÜREB taban ucreti her yil `constants/tureb-taban.ts`'de guncellenir; magaza listeleme metinlerinde "premium/abonelik" ifadesi kalmadigini kontrol et; kullanici duyurusu (Genel Duyuru + push: "Pusula artik tamamen ucretsiz").
>
> **Fikir havuzu (yapilmadi):** "bugun ozel durum" banner'i, otobus indirme-bindirme noktalari, tum camiler icin dinamik namaz penceresi, ihtiyac noktalari (WC/eczane), taksi tahmini, mekan bilgi kartlari, deniz durumu, offline mod, rota planlayicinin sade hali ("Bugun nereye gidiyorsun?" mekan cipleri → uyari listesi).
>
> **Kirmizi cizgi:** Resend / Expo / Supabase abonelikleri Hey Istanbul ile ORTAK — asla iptal/downgrade onerme. `havalimani_seferleri` tablosunu Hey Istanbul da okur.
>
> **Calisma duzeni (bu oturumda oturdu):** kod konteynerde `/home/claude/work/src2` kopyasinda yazilip `device_commit_files` ile Mac'e yazildi; dogrulama Mac'te `npx tsc --noEmit` (17 hata = hepsi `supabase/functions` Deno, bilinen) + `npx eslint`. Yeni oturumda konteyner kopyasi YOK — once Mac'teki guncel dosyalari oku/stage et, eskimis kopya uzerinden yazma.

Son guncelleme: **3 Eylul 2026 (ikinci oturum — Ajanda + Masraf Pusulasi; ustteki blok)**. Onceki: **3 Eylul 2026 (aksam, devam)** — **SOHBET TEPKILERI + YANIT eklendi** (Ayse istedi: begen/begenme/kalp/saskin + mesaja cevap; secimleri: 4'lu set, yanitlanana push, tepki verenler listesi). Migration `sohbet_tepki_ve_yanit` UYGULANDI (tablo+RLS+realtime, yanit_id, push_gonder_async yeni imza, trg_push_sohbet yanit dallanmasi). push-gonder **v5** deploy: **premium filtresi kaldirildi** (ucretsiz modelin gozden kacan parcasi — sahaDurumu/ulasim/trafik/etkinlikler push'lari artik herkese), hedefli push + haric listesi. Kod: `hooks/use-sohbet-tepkileri.ts`, `components/sohbet-tepkiler.tsx`, `app/(tabs)/sohbet.tsx` (Alert menusu yerine MesajMenusu alt sayfasi; eski Raporla/Engelle/Sabitle/Sil akislari ve onay Alert'leri birebir). tsc app 0 hata, eslint 0 error. Bkz. PROJECT.md Bolum 9. Cihaz testi bekliyor (ozellikle cift dokunma + scrollToIndex). **+ GORSEL PAYLASIMI:** migration `sohbet_gorsel_paylasimi` (gorsel_url kolonu, bucket sohbet-gorseller + 3 policy, trg_push_sohbet gorsel metni), `components/sohbet-gorsel.tsx`, sohbet.tsx (kamera butonu, onizleme seridi, balon ici resim, tam ekran). app.json'a expo-image-picker plugin + kamera izin metni eklendi → native build sart. **+ BOGAZ TARIFESI:** Ayse 'Sali gunu hafta sonunu goremiyorduk' dedi → bogaz.tsx'te TURYOL ve DENTUR icin hafta ici + hafta sonu saat bloklari AYNI ANDA inline (bugunun blogu BUGUN rozeti + gecmis saatler sonuk + sonraki sefer dolu kutu; hafta sonu listesi bossa 'Her gun'). 'Tum sefer saatleri' modali KALDIRILDI (bilincli — Ayse istegi). Sehir Hatlari'nda kalkis saatleri rozet olarak eklendi ('her gun ayni' notu). **+ IS ILANLARI + ROTA PLANLAYICI (3 Eyl gece):** migration `ilanlar_ve_rotalar` (ilanlar tablosu+RLS+realtime+push trigger; rotalar tablosu), push-gonder **v6** (ilanlar kategorisi + dil filtresi), `hooks/use-bildirimler.ts` ilanlar-v3 kanali, `use-bildirim-tercihleri.ts` 7. kategori. Yeni: app/(tabs)/ilanlar.tsx (Ara sekmesinin yerine; Ara gizli route + ana sayfa header buyutec), hooks/use-ilanlar.ts, constants/diller.ts, lib/rota-motoru.ts, hooks/use-rota.ts, app/rota.tsx, components/rota-karti.tsx; profil duzenlemeye Telefon+Dillerim. tsc app 0 hata, eslint 0 error. Bkz. PROJECT.md 9b/9c. **ROTA PLANLAYICI GIZLENDI (Ayse: 'anlamsiz oldu' → 'kaldir, sonra bakariz'):** kod ve `rotalar` tablosu duruyor, `<RotaKarti />` index.tsx'te yorumda, /rota route'u Stack'te ama hicbir yerden link yok. Yeniden acmak = 2 satir. Sadelestirme fikri kayitta: 'Bugun nereye gidiyorsun?' mekan cipleri → aninda uyari listesi (saat/transfer/kalis ayari olmadan). Ilanlar: 'Bildirim dillerim' metni, filtre 'Ilanlarim', takvim, TUREB taban kontrolu. Sekme adi **'Rehber Araniyor'** (Ayse), 'Is ariyorum' turu kaldirildi, dil listesi 74. **+ OZEL MESAJLASMA (DM):** migration `ozel_mesajlasma` (dm_konusmalar/dm_mesajlar + 4 RPC + raporlanan_mesajlar.kaynak), hooks/use-dm.ts, app/dm/[id].tsx, sohbet.tsx Genel|Mesajlarim sekmesi, ilan kartinda Mesaj. tsc app 0 hata. Bkz. PROJECT.md 9a. Cihaz testi bekliyor. NOT: profiles.diller/telefon 301 profilde bos — kullanicilar profilden dolduracak; dil bos olan HERKES ilan push'u alir.

Onceki guncelleme: **3 Eylul 2026 (gece)** — **UI REDESIGN KODLANDI: 'Kobalt & Menekse' (commit/build henuz YOK).** Ayse 3 tur mockup sonrasi (once Hey'e cok yakin, sonra mavisiz) 'ana renk kobalt olsun' dedi, Kobalt 2 yonunu secti. Uygulandi: `constants/theme.ts` v2 (kobalt #1E40AF / menekse #7C3AED / safran CTA #F59E0B, beyaz zemin + lavanta kart, radius 24, Poppins Font tokenlari, dark mod), yeni `components/ui/pusula-ui.tsx` (Kicker/Kart/Rozet/BirincilButon/IkonKaro/GradyanHeader/ModalKapak/Segmentler...), 31 dosya yerinde yeniden boyandi (tum tabs ekranlari, giris/hos-geldin/sifre/yasal, canli-durum/genel-duyuru/etkinlikler/ulasim/trafik/pinli/guncelleme/tarih-secici bilesenleri, 8 yetkili bileseni). **Fonksiyon kaybi SIFIR ilkesi** — her dosyada onPress/Modal/hook envanteri once/sonra karsilastirildi (5 ana sayfa modali, gemi ileri-tarih listesi, tum Linking/router hedefleri, klavye/FlatList yapilari, pushTokenTemizle→signOut sirasi korundu). tsc: app kodunda 0 hata (18 hata hepsi supabase/functions Deno — yeni-kayit-hediye eklenince 13→18, bilinen). ESLint: 0 error. Emoji taramasi temiz. Kucuk bilincli degisiklikler: yeni mekan/tur varsayilan `renk` '#0077B6'→Palette.kobalt; sohbet-yonetim Raporlar sekmesi rozeti 'Raporlar (N)' oldu; kicker'lar uppercase (RN textTransform Turkce I/i locale'e bagli — cihazda kontrol). **EK (3 Eyl ogleden sonra):** ana sayfa logo kilidi eski yerlesime dondu (ortali PUSULA — windrose 52px — ISTANBUL). **Acilis ekrani + uygulama ikonlari yenilendi:** assets/images/{icon, android-icon-foreground/background/monochrome, splash-icon, favicon, play-store-icon, feature-graphic, logo-icon}.png — kobalt→menekse gradyan + beyaz windrose; splash: beyaz windrose + PUSULA ISTANBUL + slogan, zemin #1E40AF (dark #0F1530), imageWidth 240; adaptive icon backgroundImage gradyan. app.json guncellendi (eski #005A8D gitti). Kaynak: assets/icons/logo.svg → cairosvg/Pillow (konteyner). NOT: docs/index.html (web sayfasi) hala eski mavi palette — ayri is. Ayse Mac'te Chrome (web) ile inceliyor; telefon dev client baglantisi (invalid URL host / tunnel) cozulemedi, USB + 'a' onerildi. **BEKLEYEN:** cihazda gorsel test, commit, app.json version 1.2.0 bump, EAS store build (native modul cikti, OTA yetmez; ikon/splash degisikligi de native build ister). Mockup: artifact 'Pusula Istanbul Yeni Tasarim'. Bkz. PROJECT.md Bolum 5 (Tasarim Sistemi v2).

Onceki guncelleme: **3 Eylul 2026** — **YENIDEN YAPILANMA OTURUMU.** Ayse'nin 4 talebi: UI redesign, maliyet raporu, admin paneli yerine inline yonetim, tamamen ucretsiz model. Kararlar: mevcut aboneler donem sonunda biter (iade yok), kayit serbest/TUREB dogrulamasi yok, palet kaynagi /Users/aysetokkus/hey-istanbul (klasor erisimi verildi), siralama maliyet→ucretsiz→inline admin→redesign. TAMAMLANAN: (a) maliyet raporu `raporlar/maliyet-raporu-2026-09.md`; (b) ucretsiz model kodu (RC/paywall tamamen cikti, native modul gitti → store build sart, v1.2.0); (c) inline yonetim `components/yetkili/*` (8 dosya), `app/admin*.tsx` silindi, _layout Stack'ten admin ekranlari cikti, profil 'Admin Panel' butonu yerine ModeratorYonetim. TAMAMLANDI (3 Eyl aksam): Supabase MCP artik Pusula projesini goruyor (Ayse baglayiciyi yeniden bagladi); `yeni-kayit-hediye` **v3** deploy edildi — premium grant YOK, yalnizca 'tamamen ucretsiz' hos geldin maili (test maili Resend id 01a06679, 200 OK); kaynak artik repoda `supabase/functions/yeni-kayit-hediye/index.ts`. Ayse magaza abonelik urunlerini satistan kaldirdi. BEKLEYEN: (3) cihazda inline panellerin testi (ozellikle MekanSaatleriYonetim kategori senkronu ve SohbetYonetim ListHeader); (4) UI redesign mockup; (5) commit + store build 1.2.0. NOT: Agustos'ta commit edilmemis degisiklikler vardi (CLAUDE.md, STATE.md, ISSUES.md, scripts/*.mjs 3 Agu bugfix) — hepsi ayni commit'e girecek.

Onceki guncelleme: **2 Temmuz 2026** — **BILDIRIM TERCIHI BUG'I COZULDU (duplike push token).** Ayse trafik bildirimlerini kapatmasina ragmen S22'ye gelmeye devam ediyordu. Tercih sistemi saglamdi (DB dogru, Edge Function filtresi dogru); kok sebep: S22'nin push token'i Ela'nin (kelebekiamarket) profilinde DE kayitliydi (26 Haz moderator testi girisi) ve Ela'nin tercihi NULL oldugu icin server trafik push'unu onun satiri uzerinden ayni cihaza gonderiyordu. Ikinci bug: logout token temizligi SIGNED_OUT event'inde (signOut SONRASI) calistigi icin RLS sessizce reddediyordu — uretimde hic temizlik olmuyordu. Fix: (1) Ela'nin satirindaki token NULL (trafik hedef 27→26, aninda kesildi), (2) migration `push_token_kaydet_rpc_token_benzersizligi` — SECURITY DEFINER RPC, token kaydinda ayni token'i diger profillerden supurur, (3) use-push-token.ts RPC'ye gecti + `pushTokenTemizle()` profil.tsx'te signOut ONCESINE alindi, (4) push-gonder Edge Function v4: token dedupe sigortasi (`dedupe_elenen` alani). tsc temiz, duplike token 0. Bkz. DECISIONS #51 + ISSUES #87. **DAGITILDI (2 Tem 2026 gece):** commit `599d86d` + EAS Update OTA branch `production`, runtime 1.1.1, android+ios, **update group `32247996-f854-4ab8-884f-68d2c60fab66`**. Magaza build'i GEREKMEDI. NOT: commit'e 4 ilgisiz dosya da girdi (aboneler-premium.xlsx, pusula-kapak.png, scripts/aboneler-excel.py, `~$aboneler-premium.xlsx` — sonuncusu Excel gecici kilit dosyasi, git'ten cikarilip `~$*` .gitignore'a eklenmeli). **BEKLEYEN:** (a) Ela app'i acsin — kendi token'i otomatik geri yazilir, o zamana kadar push alamaz, (b) OTA sonrasi Ayse S22'de dogrulama: trafik kapali kalirken acik kategorilerden (or. sohbet) push gelmeli, (c) `~$aboneler-premium.xlsx` git temizligi.

Onceki guncelleme: **26 Haziran 2026** — **MODERATOR CAMI YONETIMI ACILDI (OTA yayinda).** Talep: tum moderatorler Mekan Saatleri'nde Sultanahmet ozel kartina ek olarak TUM camileri (kategori=`camiler`, 5 kayit) duzenleyebilsin + yeni cami ekleyebilsin. Cozum tamamen frontend (`app/admin-saatler.tsx`) — RLS zaten admin+moderator'a aciydi (`mekan_saatleri_admin_yazar`). Degisiklikler: (a) moderatorde kategori `camiler`e kilitli (useEffect ile zorlanir), (b) mekan listesi + "Yeni Mekan Ekle" + duzenleme modali artik `isYetkili` (eski: `isAdmin`), (c) header alt yazi role-aware ("Cami saatlerini yonet"), (d) mevsim gecisi + kategori sekmeleri + mekan SILME butonu admin'e ozel kaldi (`isAdmin`). Onceki kafa karisikligi netlesti: Orcun ve Ela ikisi de moderator, kod yetkiyi role gore verir (kullaniciya gore degil) — iki moderator hep ayni seyi gorur; "Orcun tek/Ela uc" algisi iki ekran goruntusunun farkli derinlikte olmasindandi (ana panel 3 kart vs Mekan Saatleri alt ekrani). Genel duyurular da zaten moderatorlerde aciktı (ana sayfa GenelDuyuruPanel, gating isYetkili + RLS admin+moderator). Dogrulama: tsc temiz (kalan 13 hata Edge Function/Deno, ilgisiz). Dagitim: **EAS Update OTA**, branch `production`, runtime `1.1.1`, android+ios, **update group `198c7265-9a4f-4253-8cf0-e8bb463d937a`**, commit `53fdf07`. Magaza build'i GEREKMEDI. Bkz. PROJECT.md Bolum 8 (Moderator Yetkileri guncellendi). BEKLEYEN: moderator (Ela/Orcun/Huseyin) cihazinda Mekan Saatleri'ne girip cami listesi + yeni ekle akisini test etsin.

Onceki guncelleme: **14 Haziran 2026** — **(1) PUSH UCTAN UCA TEST TAMAMLANDI (iOS + Android).** iOS (aysetokkus@hotmail.com, test_token): kapali cihazda banner + ses TAM. Android S22 (ayse.tokkus@gmail.com): bildirim geldi (titresim + saat) ama SES YOKTU. Kok sebep: -v2 kanallari `sound` verilmeden olusturuldugu icin Samsung OneUI'da SESSIZ (expo-notifications 0.32.16: `sound` anahtari yoksa `setSound` cagrilmaz; DECISIONS #45 teshisi yanlisti). **(2) SES FIX (v1.1.2):** kanallar `sound: 'default'` (-> DEFAULT_NOTIFICATION_URI) + ID'ler `-v3`; eski v1/v2 kanallar silinir. Edge Function `push-gonder` v3 deploy (`KANAL_MAP` -v3) — OTA almamis cihazlarda -v3 yok → default kanal fallback → ses ANINDA geri geldi (65 token'li kullanici, S22'de dogrulandi). Kalici client fix EAS Update OTA (runtime 1.1.1, group `ff7eceb9`). Bkz. DECISIONS #49 + ISSUES #86. Trigger zinciri ayrica saglikli: 10 push fonksiyonu SECURITY DEFINER, `net._http_response` son 25 cagri hepsi 200. **(3) Acil ekrani fix** (commit `cda8fac`): `acil_numara` kategorisi ekranda render edilmiyordu (sabit 112), "Faydali Telefonlar" bolumu eklendi (TURYOL dogrudan arama), OTA group `6929e072`. **BU OTURUMDA AYRICA TAMAMLANDI:** (c) `sehir-hatlari-iptal-takip` SESSIZ MODA cevrildi (delta=0 ise rapor/bildirim yok) + notifyOnCompletion kapatildi → 964 okunmamis bildirim birikimi durdu. (d) Leaked Password Protection Dashboard'tan ACILDI, advisor'da uyari kalkti (teyit edildi). **BEKLEYEN:** (a) Ayse OTA sonrasi S22'de -v3 kanallarini dogrulasin (opsiyonel — fallback zaten ses veriyor), (b) push ses fix commit'i ATILDI (Ayse onayladi: "commit done"). (e) OPSIYONEL guvenlik temizligi: advisor'da 19 "SECURITY DEFINER fonksiyon RPC'den cagrilabilir" uyarisi var (10 trg_push_* + is_admin/is_admin_or_mod) — trg_push_* trigger fonksiyonlarindan anon/authenticated EXECUTE revoke edilebilir (trigger'lar EXECUTE'a bagli degil, push kirilmaz), Ayse onayi bekliyor.

**HESAP SILME (KVKK Madde 11) — 6 Tem 2026:** Mahmut Özdemir (id `a6185880-b0f8-4cc4-961d-85d1eef56f6e`, mamt3452@gmail.com) talebi uzerine silindi. Uclu eslesme (id+email+isim) dogrulandi, rol=user, TUM iliskili tablolarda (uuid kolon taramasi, 20 tablo) 0 kayit — temiz silme. Abonelik=aktif idi ama 7-gun yeni-kayit trial'iydi (kayit 5 Tem 22:35, bitis 12 Tem — gercek RC satin almasi yok, iade gerekmedi). Son giris 5 Tem 22:52 (Atakan pattern'i: kayit olup 17 dk sonra birakmis). Silme: profiles DELETE (id+email guard, RETURNING) + auth admin API DELETE, ikisi de dogrulandi (0 kayit / 404). KVKK kapanis maili `scripts/hesap-silme-onay.mjs` ile gonderildi (Resend id `d8e80784`). **NOT:** Supabase MCP bu oturumda SADECE hey-istanbul projesine erisebiliyordu (Pusula projesi token kapsaminda degil) — islem `.env`'deki SUPABASE_SERVICE_ROLE_KEY ile REST/auth admin API uzerinden yapildi. MCP baglantisi Pusula projesini kapsayacak sekilde duzeltilmeli.

**HESAP SILME (KVKK Madde 11) — 16 Haz 2026:** Ayfer Artuç (id `0bbcab41-4d3d-4f4c-a008-a77d60520fbd`, afa_ss@hotmail.com) talebi uzerine silindi. Uclu eslesme (id+email+isim) dogrulandi, rol=user, iliskili tablolarda (sohbet/canli_durum/yogunluk/isim_gecmisi/rapor/engelleme/ban/duyuru) HICBIR kayit yoktu — temiz silme. Tek atomik CTE: profiles (id+email guard) + auth.users DELETE ... RETURNING. Abonelik=aktif idi ama bu 7-gun yeni-kayit trial'iydi (Supabase tarafi, gercek RC satin almasi degil; iade/iptal gerekmedi). Kayit 11 Haz 09:20 / son giris 09:26. KVKK kapanis maili `scripts/hesap-silme-onay.mjs` (Atakan sablonunun GENERIC surumu, HEDEF blogu duzenlenir) ile gonderildi (Resend id `24b3352b`). Atakan'a ozel `hesap-silme-onay-atakan.mjs` tarihsel kayit olarak duruyor; bundan boyle generic script kullanilir.

Onceki guncelleme: **6 Haziran 2026** — **(1) PUSH TRIGGER PERMISSION FIX (kritik):** 2 Haz security temizliginde `push_gonder_async` PUBLIC EXECUTE revoke edilince tum kullanici-kaynakli push'lar sessiz olmustu + admin panel bogaz/havalimani/mekan saat UPDATE'leri "permission denied" ile FAIL ediyordu. Fix: 9 `trg_push_*` fonksiyonu SECURITY DEFINER, zirhsiz 3'une (bogaz, havalimani, mekan_saatleri) EXCEPTION sargisi. Migration: `push_trigger_security_definer_ve_exception_zirh`. Authenticated rol simulasyonuyla dogrulandi. Bkz. DECISIONS #48 + ISSUES #84. **BEKLEYEN: push uctan uca testi** (bir cihazdan sohbet mesaji → kapali cihaza push gelmeli). **(2) BOGAZ TURU TARIFE OTOMASYONU:** TURYOL tarife elle duzeltildi (haftaici saat basi 10:00-21:00 = 12 sefer; hafta sonu 10:00-21:00 = 14 sefer, 12:45-17:15 arasi 45dk araliklı) + `turyol-senkron` scheduled task kuruldu (cron `30 7,19 * * *`, `scripts/turyol-senkron.mjs`, turyol.com'a form POST `TarifeKalkisId=4_104_1_101`, idempotent + guvenlik agli, SCRIPTS.md #3). Sehir Hatlari kisa/uzun BOS saat alanlari dolduruldu (kisa: Eminonu 14:40; uzun: Eminonu 10:35, donus Anadolu Kavagi 15:00) + `bogaz-diger-senkron` scheduled task (cron `0 8,20 * * *`, prompt-driven: Firecrawl scrape + Supabase MCP — Dentur SPA oldugu icin script yazilamadi, tarife src'siz iframe'e JS ile enjekte ediliyor; Dentur'da ** isaretli talebe-bagli seferler DB'ye dahil edilmez). Dentur DB verisi siteyle uyumlu dogrulandi. INFRASTRUCTURE Bolum 11 guncellendi. **(3)** Leaked Password Protection Dashboard'tan acilacakti (Authentication → Attack Protection → "Prevent use of leaked passwords" → Configure in email provider) — Ayse'nin actigi TEYIT EDILMEDI, sonraki oturumda kontrol et. **(4) BEKLEYEN:** `sehir-hatlari-iptal-takip` task'i 964 okunmamis bildirim biriktirmis, prompt'u "degisiklik yoksa sessiz bitir" moduna cevrilmeli.

Onceki guncelleme: **4 Haziran 2026 (oglen)** — **v1.1.1 HER IKI PLATFORMDA YAYINDA.** iOS v1.1.1 Apple onayindan gecip "Ready for Distribution" oldu; `app_versions` iOS kaydi 1.1.1'e UPDATE edildi (4 Haz, eski surum iOS kullanicilarina guncelleme bandi aktif). **Genel Duyuru silme bug'i COZULDU:** v1.1.1'deki "Duzenle | Sabitle | Sil" butonlari aslinda TUM paketlerde vardi ama `kart` stili `flexDirection: 'row'` kaldigi icin 0 genislikte/gorunmez render oluyordu. Fix (commit 29ee7a6): `kart` → column + stretch. Dagitim: EAS Update OTA (runtime 1.1.1, update group `afd5d662`) — magaza build'i GEREKMEDI, Android vc43 + iOS 1.1.1 cihazlarin tamami OTA ile duzeldi. OTA altyapisinin ilk basarili gercek kullanimi. Tani tuzaklari (Turkce karakterli string ile Hermes bundle grep yanlis negatifi vb.): DECISIONS #47 + ISSUES #83. NOT: app.json version su an 1.1.1 (OTA runtime eslesmesi icin), bir sonraki store surumu 1.1.2 olarak bump'lanacak.

Onceki guncelleme: **2 Haziran 2026 (oglen sonu)** — v1.1.0 ANDROID YAYINDA (review tamamlandi), iOS v1.1.0 IPTAL EDILDI, v1.1.1 her iki magazada REVIEW'DA. **YENI KAYIT 7 GUN PREMIUM TRIAL SISTEMI canliya alindi (2 Haz oglen)** — `yeni-kayit-hediye` Edge Function + SQL trigger `trg_yeni_kayit_hediye` ON profiles INSERT. Anlik tetikleme: kayit olan kullaniciya `abonelik_durumu='aktif'` + `abonelik_bitis=NOW()+7days` + Resend ile markali hos geldin maili. Bkz. DECISIONS #46. **IKI YENI ISIN BITTIGI YOGUN OGLEDEN SONRA:**

**(1) Havaist Senkron Pipeline kuruldu** — hava.ist resmi backend API'sinden (`s.hava.ist/api.php`) gunluk otomatik tarife/saat senkronu, `scripts/havaist-senkron.mjs` + `havaist-senkron` scheduled task (cron `0 7 * * *`). 14 IST kaydi (eski 7 + yeni 7: Beylikduzu, Otogar Esenler, Merter/Bakirkoy, Avcilar, Arnavutkoy, Silivri/Catalca, Sabiha Gokcen). Aksaray fiyat 355₺→426₺, Kadikoy 390₺→468₺, Taksim/Beşiktaş 34→30 sefer guncellendi. Eski Firecrawl-based `havalimani-tarife-guncelle` task'i DEAD, yenisi gunluk idempotent. Bkz. DECISIONS #44 + SCRIPTS.md #2 + INFRASTRUCTURE.md Bolum 12.

**(2) Android Notification Channel ses bug'i tespit edilip cozuldu** — v1.1.0 Android'de push bildirim banner'i gozukuyor ama **ses cikmiyordu**. Kok sebep: `setNotificationChannelAsync({ sound: 'default' })` string'i Android'de "default.wav" aramaya gidiyor, dosya yok, kanal sessiz olusturuluyor. Android kurali: kanal ayari olusturulduktan sonra kod ile degistirilemez (immutable). **Iki asamali fix:**
   - **Asama 1 (server, deploy edildi):** Edge Function `push-gonder` v2 deploy — `KANAL_MAP`'te tum kategoriler `-v2` suffix'li ID'lere point ediyor. v1.1.0 cihazlarda bu ID'ler bulunamaz → Android default kanala fallback → ses cikar (manuel ayar gerek yok, tum v1.1.0 kullanicisi otomatik duzeldi).
   - **Asama 2 (client, v1.1.1 paketinde):** `hooks/use-bildirimler.ts` `deleteNotificationChannelAsync` ile eski 6 kanal siliyor, yeni 6 kanal `-v2` ID + `sound` parametresi VERILMEDEN olusuyor (Expo varsayilan = sistem ses).
   - **Genel duyuru silme defansif fix:** `hooks/use-genel-duyuru.ts` + `components/genel-duyuru-panel.tsx` — RLS sessiz reddi yakalama (DELETE ... RETURNING ile satir kontrolu), optimistic state update, basarisiz silme'de Alert.
   - Bkz. DECISIONS #45 + ISSUES.md. iOS build 39 App Store Connect'e submit edildi (Manual Release), Android versionCode 40 Play Console DRAFT → Yayın'a kullanıma sunuldu (Yönetilen Yayınlanma açık). Apple Review 24-72 saat, Google Review 6-24 saat. Onay sonrası Ayşe manuel "Release / Yayınla" basacak, sonra Supabase `app_versions` UPDATE ile eski sürümdeki kullanıcılara güncelleme bandı tetiklenecek. Onceki gun (1 Haziran 2026, gece): DEVASA gun. Sabah bayram kampanyasi kapanis ve veri temizligi (193 hediye → 192 'suresi_dolmus'), sonra **v1.1.0 paketi tamamen kuruldu**: push notification altyapisi (token + Edge Function + 8 trigger + client refactor), genel duyuru ozelligi (foto + push), in-app guncelleme uyari bandi, edge-to-edge Android 15, profil surum no dinamiklestirme, X API client-side cleanup, kritik sohbet pin sistemi (push entegre), RC email attribute, 36 kullanici revenuecat_id geri-doldurma, etkinlik takvimi TZ fix, sohbet dogrudan silme (admin + kendi), Galataport ana sayfa sadeleştirme. Apple APNs Key (V7FM2HN5N7) ve Firebase projesi (pusula-istanbul) kuruldu, EAS credentials'a yuklendi. 16 degisiklik. v1.0.x sürümlerinden hiçbiriyle kıyaslanamayacak büyüklükte.

---

## SON OTURUMDA NE YAPILDI (1 Haziran 2026 — Tam Gun)

### Sabah - Bayram Kampanyasi Kapanis + Veri Temizligi

1. **`bayram-hediye-otomatik` scheduled task disable edildi** (~08:00 TR) — recurring `*/15 * * * *` cron'un no-op gurultusunu durdurmak icin. Description'a "DEVRE DISI (1 Haz 2026)" notu. Audit log: `scripts/data/bayram-hediye-otomatik-log.json` (196 run, 6 user, 0 hata).

2. **Bayram kampanyasi kapsamli rapor** — `claude-context/raporlar/bayram-hediye-otomatik-rapor.md`. Bulgular: 193 hediye, %13.5 engagement (26/193 giris), 3 yillik conversion (Asli+Ceren+Melike), 0 teknik hata, %75 oto-task yakalama orani.

3. **3 yillik conversion icin `revenuecat_id` elle baglandi** — Ayse RC dashboard'dan `active.csv` indirdi. CSV'den `first_purchase_at` timestamp'leri abonelik_bitis ile capraz eslestirildi. Asli (87122d26...), Ceren (cefc02ab...), Melike (1e538543...) → her 3'unde `profile.id == RC app_user_id` keşfi (DECISIONS #41).

4. **192 freemium kullanici 'suresi_dolmus' yapildi** — bayram bitisinden sonra DB kozmetik temizlik. `UPDATE profiles SET abonelik_durumu='suresi_dolmus' WHERE abonelik_bitis='2026-05-31 21:00:00+00' AND abonelik_durumu='aktif'`. Kullanici tarafi zaten freemium gosteriyordu (use-abonelik.ts client-side `bitis > now()` kontrolu var), ama DB tarafi temizlendi.

5. **DECISIONS #41 dokumantasyon** — profile.id == RC app_user_id keşfi DECISIONS.md'ye eklendi, sonraki destek vakalari icin altin bilgi.

### Push Notification Altyapisi (v1.1.0)

6. **Supabase token kolonlari** — `profiles` tablosuna 4 yeni kolon: `expo_push_token TEXT`, `push_token_platform TEXT CHECK in ('ios','android')`, `push_token_guncellendi TIMESTAMPTZ`, `bildirim_tercihleri JSONB`. Partial index `idx_profiles_push_token`.

7. **hooks/use-push-token.ts (yeni)** — Login/logout'a duyarli, EAS projectId (`4b230ae7-f56f-4c77-af07-acfcdea0efe6`) ile `Notifications.getExpoPushTokenAsync()` cagirir, Supabase'e yazar. Idempotent (ayni token tekrar yazmaz). Logout'ta token NULL'a cevrilir.

8. **Edge Function `push-gonder` deploy** — `verify_jwt=false`, `x-pusula-cron-secret` header auth. Payload: `{kategori, baslik, icerik, veri?, kullanici_id_haric?, test_token?}`. Premium gate `PREMIUM_KATEGORILER = ['sahaDurumu','ulasim','trafik','etkinlikler']`, sohbet+admin freemium'a da gider. Expo Push API'sine 100'erlik batch. DeviceNotRegistered hatasi alan token'lari otomatik NULL'a cevirir.

9. **8 Supabase trigger kuruldu** — `public.push_gonder_async(kategori, baslik, icerik, veri, kullanici_id_haric)` helper SQL function (pg_net ile fire-and-forget HTTP POST, vault'tan `pusula_cron_secret` okur). Trigger'lar:
   - `push_ulasim_trigger` — `ulasim_uyarilari` INSERT (kaynak='x:IBBUlasim' ise trafik, degilse ulasim kategori)
   - `push_saha_trigger` — `canli_durum` INSERT (sadece yogun/cok_yogun)
   - `push_etkinlik_trigger` — `etkinlikler` INSERT VEYA UPDATE (aktif=true)
   - `push_sohbet_trigger` — `sohbet_mesajlari` INSERT (gonderen `kullanici_id` haric)
   - `push_mekan_saatleri_trigger` — `mekan_saatleri` UPDATE (acilis/kapanis/fiyat degisikligi)
   - `push_havalimani_trigger` — `havalimani_seferleri` UPDATE (fiyat/saat)
   - `push_bogaz_trigger` — `bogaz_turlari` UPDATE (fiyat/saat)
   - `push_duyuru_trigger` — `genel_duyurular` INSERT (aktif=true)

10. **hooks/use-bildirimler.ts REFACTOR** — Eski 6 realtime listener (200+ satir) SILINDI. Artik sadece: izin alma + Android kanallari + tiklama handler. Server-side trigger'lar zaten ayni isi yapiyor, cift bildirim olmasin diye client tarafi temizlendi. Push handler `shouldShowAlert: true` ile foreground'da da push gosterir.

11. **hooks/use-bildirim-tercihleri.ts** — `toggle()` ve `hepsiniGuncelle()` artik AsyncStorage + Supabase eszamanli yazar. `supabaseTercihYaz()` helper. Server-side push gonderim filtre icin gerekli — `push-gonder` Edge Function profiles.bildirim_tercihleri JSONB'sini sorgular.

12. **app.json + .gitignore** — `android.googleServicesFile: "./google-services.json"` eklendi. iOS infoPlist'e `NSPhotoLibraryUsageDescription` + `NSPhotoLibraryAddUsageDescription` eklendi (genel duyuru foto secimi icin). `.gitignore`'a `google-services.json` eklendi.

13. **Apple APNs Key oluşturuldu** — `https://developer.apple.com/account/resources/authkeys/` → Pusula Istanbul APNs Key, **Key ID: V7FM2HN5N7**, Sandbox & Production, Team Scoped (All Topics). `.p8` indirildi. `eas credentials` ile mevcut eski key (P946RU8GS4) **revoke + remove** edildi, yeni key (V7FM2HN5N7) Set Up edildi → `Push Key assigned to pusula-istanbul`.

14. **Firebase projesi kuruldu** — `https://console.firebase.google.com` → `pusula-istanbul` (Spark plan). Android app eklendi (package: `com.pusulaistanbul.app`, nickname: Pusula Istanbul). `google-services.json` indirildi → projeye kopya. Project Settings → Service accounts → "Generate new private key" → Firebase Admin SDK JSON indirildi. `mv ~/Downloads/pusula-istanbul-4a055-firebase-adminsdk-fbsvc-73e59fb5a9.json ./firebase-service-account.json`. `eas credentials` → Android → Google Service Account → FCM V1 → Set up → Path: `./firebase-service-account.json`. FCM V1 push aktif.

15. **expo-image-picker paketi yuklendi** — `npx expo install expo-image-picker` (SDK 54 uyumlu).

### Genel Duyuru Ozelligi (Saha Bildirimine Yeni Box)

16. **Supabase: `genel_duyurular` tablosu** — `id, baslik, icerik, gorsel_url, olusturan_id, olusturan_isim, aktif, sabitlendi, created_at, updated_at`. `REPLICA IDENTITY FULL` (DELETE realtime icin). RLS: SELECT herkes, INSERT/UPDATE/DELETE sadece admin/moderator.

17. **Storage bucket `duyuru-gorseller`** — public read, admin/moderator write/delete, file_size_limit=10MB, allowed_mime_types=jpeg/png/webp. RLS policies: `Duyuru gorsel public read`, `Duyuru gorsel admin upload`, `Duyuru gorsel admin delete`.

18. **Push trigger `trg_push_duyuru`** — INSERT (aktif=true) → 'etkinlikler' kategori, baslik 'Duyuru: <baslik>', icerik ilk 200 char, veri.duyuruId + veri.gorselUrl.

19. **hooks/use-genel-duyuru.ts (yeni)** — CRUD + realtime (INSERT/UPDATE/DELETE) + foto upload (storage.upload → publicUrl).

20. **components/genel-duyuru-panel.tsx (yeni)** — 4 komponent: `GenelDuyuruPanel` (ana ozet), `DetayModal` (uzun metin + thumbnail), `TamEkranGorselModal` (siyah arkaplan + ScrollView pinch-zoom maximumZoomScale=4 + Kapat butonu), `EkleModal` (admin form: baslik + icerik + galeri foto + sabitle toggle + "Yayinla ve Bildirim Gonder").

21. **Ana sayfa entegrasyonu** — Saha durumu altina yerlestirildi. Sabitlenmis duyurular altin cerceveli, normaller mavi. Tiklayinca detay modal. Yetkili uzun bas → Sabitle/Kaldir + Sil.

### Diger Ozellikler

22. **hooks/use-gemi-takvimi.ts genisletildi** — `bugunGemi` (find — tek, geriye uyumluluk) yanina `bugunGemileri` (filter — array, bug fix: bir gunde birden fazla gemi olabilir) + `gelecekGunlerGemileri` (bugun haric) eklendi.

23. **Ana sayfa Galataport bandi sadelesti** — eski `haftaninGemileri.map` 7 gun listesi → `bugunGemileri.map` sadece bugun. Altina "Onumuzdeki gunler · X gemi ›" tiklanabilir expand satiri. Bugun gemi yoksa "Sonraki: X" + "ve Y gemi daha". Mevcut modal kullaniliyor "Tum Liste" icin. Stil: `gemiExpandSatir`, `gemiExpandText`, `gemiExpandArrow` eklendi.

24. **Sohbet ekrani — Admin/moderator dogrudan mesaj silme** — `useAdmin` import edildi. `mesajSil` callback (DELETE + lokal state'ten kaldir). `mesajAksiyonlari` menusunde isYetkili icin "Mesaji Sil (Yetkili)" butonu (kirmizi).

25. **Sohbet ekrani — Kullanici kendi mesajini silme** — RLS: `kullanici_kendi_mesajini_sil` policy (kullanici_id=auth.uid()). `mesajAksiyonlari` menusu: kendi mesaj icin sadece "Vazgec + Sil", baskasinin icin Raporla/Engelle/(yetkili ise) Sil.

26. **Sohbet ekrani — Realtime DELETE event eklendi** — Eskiden sadece INSERT dinleniyordu. Silinen mesaj diger cihazlarda anlik kaybolur.

27. **Etkinlik takvimi timezone fix** — `components/tarih-saat-secici.tsx` `isoFormat` fonksiyonu artik `+03:00` (TR sabit, DST yok) ekliyor. Eski: `2026-06-15T08:00:00` (TZ yok) → PostgreSQL UTC sanip cihazda 11 TR gosteriyordu. Yeni: `2026-06-15T08:00:00+03:00` → PostgreSQL dogru parse, cihazda 8 TR. 1 mevcut etkinlik (29 May Fetih, gecmis) Ayse'nin pasif yapacagi sekilde.

28. **Profil ekrani surum no dinamiklestirme** — `Constants.expoConfig?.version` ile app.json'dan otomatik okuma. Module-level `APP_VERSION = Constants.expoConfig?.version ?? '?'`. Iki yer: geri bildirim mailtosu gövdesi (`Sürüm: v${APP_VERSION}`) + Hakkında modal (`Pusula İstanbul v${APP_VERSION}`).

29. **Edge-to-edge Android 15 uyumu** — `app.json` `edgeToEdgeEnabled: false → true`. 5 ana tab ekran zaten `insets.top` kullaniyordu (önceki sprint). Admin ekranlari, auth ekranlari (abone-ol, hos-geldin, gizlilik, kullanim, admin) zaten safe area uyumlu. `app/giris.tsx` ve `app/sifre-sifirla.tsx` eklendi: `useSafeAreaInsets()` + ScrollView contentContainer'a `paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20`. Test gerek (S22 Android 15+).

30. **X API client-side cleanup** — `app/_layout.tsx`: `useXUlasim` import + `useEffect`+`setInterval` blogu SILINDI. `lib/config.ts`: `X_BEARER_TOKEN`, `X_SENKRON_ARALIK_DK`, `X_MAX_TWEET` sabitleri silindi (export {} kaldi). `hooks/use-x-ulasim.ts` dosyasi silindi (Ayse terminalde). `eas env:delete --variable-name EXPO_PUBLIC_X_BEARER_TOKEN` calistirildi. Server-side `ulasim-senkron` Edge Function 6 May'dan beri 15 dk'da bir tetikleniyor zaten.

31. **In-app guncelleme uyari bandi** — Supabase `app_versions` tablosu: `platform (PK), version, store_url, updated_at`. RLS: SELECT herkes, ALL admin/moderator. Ilk kayitlar v1.0.14. `hooks/use-guncelleme-kontrol.ts`: Supabase'den platform'a gore son surum cek, lokal ile karsilastir (basit semver), AsyncStorage'da sessizlestirme kontrolu (surume ozel, 24 saat). `components/guncelleme-bandi.tsx`: mavi gradient serit (#48CAE4→#0096C7→#0077B6) + sol "Pusula'nin yeni surumu mevcut" + "v1.1.1 — Guncellemek icin dokunun" + sag X butonu (24 saat sustur). Tiklanir → Linking.openURL(store_url). Web'de hic gozukmez. Ana sayfa: gradient header altina yerlestirildi. **YAYIN AKIS:** v1.1.0 yayinlanip Ayse manuel Release/Yayinla bastiktan sonra: `UPDATE app_versions SET version='1.1.0', updated_at=NOW()`.

32. **RC email attribute** — `lib/revenuecat.ts` `revenueCatLogin(userId, email?, displayName?)` 3 parametreli oldu. `Purchases.setAttributes({'$email': email, '$displayName': displayName})` ile RC dashboard'a yaziliyor. `hooks/use-abonelik.ts`: profile sorgusu artik isim+soyisim de cekiyor, displayName olusturup `revenueCatLogin`'a geciriyor. **Sonuc:** Yeni girisler RC dashboard'da email ile aranabilir hale gelecek (DECISIONS #41 destekleyici fix).

33. **revenuecat_id geri-doldurma — 36 KULLANICI** — `UPDATE profiles SET revenuecat_id = id::text WHERE revenuecat_id IS NULL AND abonelik_durumu='aktif' AND abonelik_plani IN ('aylik','yillik') AND abonelik_bitis > NOW()+'7 days' AND rol NOT IN ('admin','moderator')`. Bayram hediyesi alanlar haric. Listede 1 May Play Store bug magdurlari (Mustafa, Sebnem, Orcun), 3 May NULL profile magdurlari (Ebru, Betul), Elvan, 9 ocak 2027 expired test/beta kayitlari, ve organik kullanicilar.

34. **Kritik sohbet pin sistemi (v1.1.0 madde 12)** —
    - Supabase: `sohbet_mesajlari` tablosuna `pinned BOOLEAN DEFAULT false`, `pinned_at TIMESTAMPTZ`, `pinned_by UUID`, `pinned_by_isim TEXT` kolonlari. Partial index `idx_sohbet_pinned`. RLS: `sohbet_pin_admin` policy (UPDATE admin/moderator). REPLICA IDENTITY FULL.
    - Push trigger `trg_push_sohbet_pin`: UPDATE'te `pinned` false→true gectiyse 'sohbet' kategorisi ile push gonder, baslik "Sahadan Onemli", icerik ilk 200 char. `WHEN (OLD.pinned IS DISTINCT FROM NEW.pinned)` ile sadece pin degisikliklerinde tetiklenir.
    - `hooks/use-pinli-mesajlar.ts` (yeni): son 48 saat pin'li mesajlari cek, realtime UPDATE/DELETE listener (48h omur dolanlari client filter'da cikar), `pinle(id)` ve `pinKaldir(id)` callbacks (`pinned_by_isim` profile'dan otomatik).
    - `components/pinli-mesaj-bandi.tsx` (yeni): altin gradient header (`Palette.altin → #B8651A → Palette.altin`) "Sahadan Onemli" + sayac, 3 kart onizleme (numberOfLines=3), "X sabit mesaj daha — Sohbete git" expand, detay modal (mesaj + "Sohbete Git" butonu).
    - Sohbet ekrani: `Mesaj` tipine `pinned`, `pinned_at`, `pinned_by`, `pinned_by_isim` (optional) eklendi. `usePinliMesajlar` hook import. mesajAksiyonlari menusune isYetkili icin "Sabitle (Yetkili)" / "Sabitten Kaldir" butonu. Pinleme oncesi onay dialog: "Bu mesaj 48 saat boyunca ana sayfada gosterilecek ve tum kullanicilara push gonderilecek".
    - Ana sayfa: Saat/selamlama seridi ile Saha Durumu arasina yerlestirildi (clock strip altinda). En yuksek gorunurluk.

35. **app.json version bump** — `1.0.14 → 1.1.0`, iOS `buildNumber: 37 → 38`. Android `versionCode: 37` (EAS autoIncrement ile build'de 38'e cikar).

### Hala Yapilmamis — v1.1.1 veya Sonrasina Birakildi

- **Madde 5 (eski 6):** Ana ekran widget (iOS/Android native widget, ayri teknik domain)
- **Madde 7 (eski 8):** Supabase data hygiene scheduled task (RC webhook → expired aboneler temizlik)
- **Madde 8 (eski 9):** Galataport gemi takvimi scheduled task (Firecrawl ile aylik scrape)
- **Madde 9 (eski 10):** Havalimani + Bogaz Excel pipeline (mekan-saatleri pattern'i)
- **Madde 11 (eski 12):** Admin panel hesap silme + KVKK mail tek tik butonu (4-5 saat, audit log + onay dialog + service role Edge Function)

### v1.1.0 Build/Test Plani — YENI OTURUMDA

**A) Build hazirlik:**
1. Hala silinmesi gereken: `hooks/use-x-ulasim.ts` dosyasi (Ayse `rm` ile silmeyi unutmamali). DOGRULAMA: `ls hooks/use-x-ulasim.ts` → "No such file" cikmali.
2. Hala silinmesi gereken: kok klasoreki `AuthKey_V7FM2HN5N7.p8` (eas credentials yuklendi, lokalde gereksiz + guvenlik). DOGRULAMA: `ls AuthKey*` → "No matches".
3. `firebase-service-account.json` proje kokunde — gitignore'da `*-service-account.json` ile match olur, git'e karismaz. Sandbox'ta gerektiginde lazim. Aslen EAS'a yuklendigi icin lokalde silinebilir ama kalsa sorun degil.
4. `google-services.json` proje kokunde — `app.json`'da `googleServicesFile: "./google-services.json"` config'iyle build sirasinda EAS kullanir. Asla silme.

**B) iOS TestFlight build + submit:**
```bash
cd /Users/aysetokkus/istanbul-rehber
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
eas build --platform ios --profile production
# Build basarili: ~15-25 dk
eas submit --platform ios --latest
# TestFlight Internal Testing'e otomatik gider (Manual Release secili production track, ama TestFlight Internal Testing onaysiz)
```

**C) Android preview APK (cihazda test):**
```bash
eas build --platform android --profile preview
# Build basarili: ~20-30 dk
# Indirme link'ini Samsung S22'ye gonder, sideload yukle (Bilinmeyen kaynaklara izin ver)
```

**D) iOS test (Mac M1 — iPhone7 iOS 15.8 TestFlight uyumsuz):**
1. TestFlight uygulamasi Mac'te zaten kurulu olmali (Designed for iPad)
2. Internal Testing → Gelistirici grubu (aysetokkus@hotmail.com tester eklenmis)
3. Otomatik dagilim aktif, build geldigi an TestFlight'ta gozukur (~10-15 dk submit sonra)
4. Yukle + ac + test

**E) Test kontrolleri (her 6 kategori + yeni ozellikler):**
- Edge-to-edge: gradient header status bar'a kadar uzaniyor mu, tab bar gesture bar ile cakismiyor mu, ekran kenarlarinda siyah bant kalmadi mi
- Profil ekrani: Sürüm "v1.1.0" gözüküyor mu (artik dinamik)
- Genel duyurular: Admin olarak "+ Yeni" → form → foto sec → yayinla → push ulasti mi diger cihazda, ana sayfada gözüktü mü, tikla → detay modal → foto tikla → tam ekran zoom
- Sohbet pin: Admin olarak mesaja uzun bas → "Sabitle" → onay → ana sayfada "Sahadan Onemli" altin gradient bandı çıktı mı, push notification geldi mi (kapali cihaza), 48 saat sonra otomatik kaybolacak (client filter)
- Sohbet doğrudan silme: Admin olarak mesaja uzun bas → "Mesajı Sil (Yetkili)" → diğer cihazda anlık kayboldu mu
- Kendi mesaj silme: Sohbette kendi mesajına uzun bas → "Mesajı Sil" çıkıyor mu, sildikten sonra kayboluyor mu
- Etkinlik takvimi: Admin → admin-etkinlik → yeni etkinlik 8:00 yaz → kaydet → app'da 8:00 gözüküyor mu (artık 11 değil)
- Galataport bandı: Ana sayfada sadece bugünkü gemiler, "Önümüzdeki günler · X gemi ›" tıklanabilir
- Güncelleme bandı: app_versions'da version'u manuel '1.1.1' yaparak test et → ana ekranda mavi bant çıkıyor mu, X ile sustur, tıklayınca mağazaya yönlendiriyor mu
- Push notification gerçek senaryo: Cihaza push token kaydedildi mi (Supabase profiles.expo_push_token NULL değil mi), Edge Function manuel curl ile test: 
```bash
curl -X POST 'https://rzlfghjpsximthlolfxo.supabase.co/functions/v1/push-gonder' \
  -H 'Content-Type: application/json' \
  -H 'x-pusula-cron-secret: <vault_secret>' \
  -d '{"kategori":"sohbet","baslik":"Test","icerik":"Push notification testi","test_token":"<expo_token>"}'
```

**F) Build sonrasi DB guncellemesi (sürüm yayına çıkınca):**
```sql
UPDATE public.app_versions SET version='1.1.0', updated_at=NOW();
```
Bu komut çalıştırılınca v1.0.14'te kalan kullanıcılar uygulamayı açtığında güncelleme bandını görür.

---

## 2 HAZIRAN 2026 (sabah) — v1.1.0 BUILD + SUBMIT + BUG FIX'LER

### Build & Submit Akisi

1. **iOS prebuild + production build** — `npx expo prebuild --clean` → CocoaPods 1.16.2 brew ile kuruldu (gem patladi, brew dustu). `eas build --platform all --profile production` ile baslatildi. Android ilk denemede `google-services.json missing` hatasi (gitignore'da idi). Fix: gitignore'dan cikarildi (Firebase docs zaten "source control'e ekleyin" diyor, public config). git commit `02349ef`. Ikinci denemede iOS production buildNumber 39 + Android versionCode 39 (autoIncrement) basariyla bitti.

2. **EAS Update denemesi BASARISIZ** — Mac M1 TestFlight build'inde EAS Update push edildi (`eas update --branch production --message "Genel Duyuru: bant rengi + Düzenle/Sil butonları + Edit modu"`, group `31146bba-16d0-45a9-8d0b-7f0ee45c7489`). Defalarca kapat-ac'a ragmen Mac TestFlight bundle cache'i yenilemedi. Mac M1 "Designed for iPad" tarafindaki bilinen sorun olabilir. Yeni production build alindi.

3. **Genel Duyuru ozelligi 4 kritik bug fix** —
   - **Realtime publication eksik:** Yeni eklenen `genel_duyurular` tablosu `supabase_realtime` publication'a otomatik eklenmiyor. INSERT event'i client'a hic ulasmiyordu. Fix: `ALTER PUBLICATION supabase_realtime ADD TABLE public.genel_duyurular`.
   - **Bant rengi uyumsuz:** Eski koyu mavi gradient `['#005A8D', '#0077B6', '#0096C7']`. Yeni: diger bantlarla uyumlu acik mavi `['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']`.
   - **Yonetim aksiyonlari gorunmuyor:** Uzun bas menusu kullanici tarafindan kesfedilemedi. Fix: kart altina yetkili icin 3 gorunur buton (Duzenle | Sabitle | Sil). 1px ayrac, renkli text (primary mavi / altin / kapali kirmizi).
   - **Edit modu yok:** Hook'a `duyuruGuncelle(id, params)` eklendi. EkleModal `duyuru?` prop'u ile edit modu desteklemeye basladi: initial value'lar duyuru'dan dolar, "Yayinla ve Bildirim Gonder" yerine "Guncelle" butonu (duzenleme push tetiklemez).

4. **Sohbet/Saha bildirimi bloke olmustu — KRITIK trigger fix** — Yeni eklediğim push trigger'lari INSERT'leri bloke ediyordu cunku:
   - `push_gonder_async` SQL hatasi (vault, pg_net) atinca INSERT geri aliniyordu
   - `trg_push_saha` DECLARE'da `NEW.yogunluk`, `NEW.seviye`, `NEW.mekan_id`, `NEW.aciklama` referansliyordu — bu kolonlar `canli_durum` tablosunda **YOK**, gercek kolonlar: `nokta_id`, `durum`, `not_metni`, `bekleme_dk`
   - DECLARE asamasinda kolon parse hatasi BEGIN/EXCEPTION'in disinda olur → INSERT fail
   - **Fix 1:** Tum push trigger function'lari (`trg_push_sohbet`, `trg_push_saha`, `trg_push_etkinlik`, `trg_push_ulasim`, `trg_push_sohbet_pin`, `trg_push_duyuru`) icindeki `PERFORM push_gonder_async(...)` cagrilari `BEGIN ... EXCEPTION WHEN OTHERS THEN RAISE WARNING` icine alindi. Push fail olsa bile INSERT/UPDATE devam eder.
   - **Fix 2:** `trg_push_saha` dogru kolonlarla yeniden yazildi (`durum`, `nokta_id`, `not_metni`, `bekleme_dk`). Filtre: `durum NOT IN ('cok_yogun', 'yogun', 'kalabalik', 'kapali', 'arıza', 'ariza')` ise push gonderme. 5 dk'dan eski kayitlar replay icin push gondermesin.
   - **Ders (DECISIONS #43'e ek):** Trigger function'larin DECLARE bloklarinda NEW.kolon referansi yapilmasin — sadece BEGIN bloguna gec, exception-safe yap. **Yeni karar yazimi:** DECISIONS.md'ye sonradan #44 olarak eklenebilir ("Trigger function'larin DECLARE bloklari kolon-bagimsiz olmali").
   - **Hala kontrol edilmemis trigger'lar:** `trg_push_mekan_saatleri`, `trg_push_havalimani`, `trg_push_bogaz`. Yine ayni kolon-isim bug'i olabilir. Admin panelden bir test update yapinca patlarsa hizli fix.

5. **Production REBUILD + SUBMIT** —
   - Kod degisiklikleri sonrasi: bant rengi, Duzenle/Sil butonlari, edit modu, trigger fix'leri
   - `eas build --platform all --profile production` tekrar (kod guncellendigi icin) → iOS buildNumber 39 (autoIncrement zaten arttirmis), Android versionCode 40
   - **iOS submit:** `eas submit --platform ios --latest` → App Store Connect'e v1.1.0 build 39 yuklendi
   - **Android submit:** `eas submit --platform android --latest` → Play Console Yayın track'ine DRAFT olarak yuklendi (versionCode 40)

6. **Mağaza submit'leri** —
   - **App Store Connect:** Pusula İstanbul → App Store sekmesi → "+ Version" → 1.1.0 → "What's New" Türkçe release notes yapıştırıldı → Build 39 secildi → App Review Notes (test hesabi aysetokkus@hotmail.com / 123456) → "Manually release this version" secili → Submit for Review. Apple Review bekleniyor (24-72 saat).
   - **Google Play Console:** Yayın → Üretim → DRAFT v1.1.0 (versionCode 40) → Sürümü düzenle → Türkçe sürüm notları yapıştırıldı → Sürümü incele → Yayına kullanıma sun. "Yönetilen yayınlanma" acik oldugu icin Google review sonrasi Ayse manuel "Yayınla" basacak.
   - **Release notes (kullanici):** "Anlık bildirimler, yetkili duyuruları ve performans iyileştirmeleri." (kisa, Ayse'nin tarzina uygun)

### v1.1.0 Yayina Cikinca Yapilacaklar (SONRAKI OTURUM)

1. **Apple Review onaylanir** (mail gelir) → App Store Connect'te **Release This Version** bas
2. **Google Review onaylanir** (mail gelir) → Play Console'da **Yayınla** bas
3. **Iki platform da yayinda olunca Supabase guncellemesi:**
   ```sql
   UPDATE public.app_versions SET version='1.1.0', updated_at=NOW();
   ```
   Bu komut calistigi an v1.0.14'te kalan kullanicilar Pusula'yi actiginda **guncelleme uyari bandi** gorur.
4. **STATE.md ve CHANGELOG.md guncelle** — yayina cikma tarihi
5. **Push notification test edilmedi henuz** — yayina cikinca:
   - Bir test cihazindan giris yap → profiles.expo_push_token dolacak
   - Diger cihazdan sohbet mesaji at → push gelmeli (kapali iken bile)
   - Saha bildirimi at → push gelmeli (yogun/cok_yogun durumda)
   - Genel duyuru at → push gelmeli
   - Sohbet pin et → "Sahadan Önemli" baslikli push



 Apple expedited review onayi + Google Play onayi ayni gun icinde geldi (her ikisi de 24 saatten cok daha hizli — bayram gunu olmasina ragmen). Ayse manuel "Release"/"Yayinla" basarak v1.0.13'u v1.0.14 ile degistirdi. ScreenStack drawing crash kapaklandi, Play Console Vitals'ta yeni crash gozlemi onumuzdeki 24-48 saatte yapilacak. **NOT:** IRO maili 7 May'da YAYINLANMADI, Ayse yeniden talep gonderecek. Yani son 20 gunun 107+ yeni rehber kaydi + Asli Cetin organik yillik conversion'i (27 May 10:06 kayit -> 10:10 yillik satin alma) + bugunku 13 yeni kayit TAMAMEN ORGANIK trafik (kulaktan kulaga, App Store/Play Store kesfi, sosyal medya). IRO mail cikinca dalganin daha buyuk olacagi sinyali guclu. v1.0.13'te kritik bir Android crash bug'i ortaya cikti: **react-native-screens 4.16.0 ScreenStack drawing race condition** (java.lang.IndexOutOfBoundsException: getChildDrawingOrder()). Play Console Vitals'ta **16 onaylanmis kullanici etkilendi** (12 farkli cihaz markasi — Samsung baskin ama dagilim cok genis = kod bug'i kesin, OEM uyumsuzluk degil). **Cozum: 4.16.0 → 4.23.0 upgrade.** 4.24.0 atlandi (BottomTabs implementation eksik, yarim kalmis surum — iOS Xcode "RNSBottomTabsScreenComponentView undeclared identifier" patlatti). 4.25.0+ atlandi (RN 0.82 peer dep, bizde 0.81.5). Bkz. DECISIONS #37, ISSUES #79-80.

**Bu sabah (27 May) yapilan bes buyuk is:**
1. **v1.0.14 hotfix build + submit:** Her iki platform basariyla build edildi (artifact link'ler EAS), iOS Apple Review'a, Android Play Console DRAFT olarak yuklendi (incelemede). Apple Review Notes'ta crash detayi + react-native-screens 4.23 upgrade + expedited review request belirtildi. Onay bekleniyor (24-72 saat).
2. **16 onaysiz kullaniciyi manuel onay (2 grup halinde):** Microsoft (Hotmail/Outlook) ve Yahoo spam filtresine takilan onay maillerinin magduru olan kullanicilar. Resend'de "Delivered" status'una ragmen kullaniciya gorunmemis. Bkz. DECISIONS #39, ISSUES #84. Ek olarak 1 typo'lu olu hesap silindi (Timucin Aslan `.vom` → `.com` zaten aktif).
3. **172 freemium kullaniciya KURBAN BAYRAMI PREMIUM HEDIYESI:** abonelik_durumu='aktif', abonelik_plani='aylik', abonelik_bitis='2026-06-01 00:00:00+03'. 5 gun premium hediye, bayram boyunca sahada premium feature'lara kesintisiz erisim. RevenueCat'te degisiklik yok — sadece Supabase tarafi (use-abonelik Supabase fallback ile premiumMi=true).
4. **Yeni mail aracligi:** `scripts/manuel-onay-bilgilendirme.mjs` yazildi (Resend API direct, runtime Supabase fetch yapabilen, dry-run + test + all modlari olan, markali HTML template ile). 7 kisi sabahki gruba bilgilendirme maili gitti. 8 kisi 2. grup BEKLIYOR (yeni oturum).
5. **Bayram hediye maili scripti + scheduled task:** `scripts/kurban-bayrami-hediye.mjs` yazildi — manuel-onay-bilgilendirme.mjs pattern'i taban alindi ama farkliliklar: (a) ALICILAR hardcode degil, runtime'da Supabase'den fetch (abonelik_bitis=2026-06-01 + rol non-admin/moderator), (b) cinsiyetsiz hitap "Sayin {ad} {soyad}", (c) altin gradient hediye kutusu + mavi gradient guncelleme kutusu, (d) RFC2606 + test domain filtresi (example.com, example.org, example.net, test.com — 4 kayit otomatik atlandi, 172 → 168 gercek alici), (e) header tasarimi base64 inline logo'dan external URL'e cevrildi (`https://pusulaistanbul.app/logo-icon.png`), yatay "PUSULA [logo] ISTANBUL" banner. Bkz. DECISIONS #40. 2 test maili Ayse'ye gonderildi (Resend id'leri: cebf830a, fc49d885, 185b5291), tasarim onaylandi. **Gercek gonderim 27 May 07:00 TR'de scheduled task ile (taskId: `kurban-bayrami-hediye-mail-gonderim`, one-shot, fireAt=2026-05-27T07:00:00+03:00).**

Bu dosya HER SURUM degisikliginde guncellenmeli. Yeni oturumda Claude buraya bakar, "su an ne yapiyoruz" anlar.

---

## SU ANKI SURUM DURUMU

| Platform | Surum | Durum |
|----------|-------|-------|
| iOS App Store | **v1.0.14** | **YAYINDA** (27 Mayis 2026 — buildNumber 37 — Apple onayi geldi, manuel "Release" basildi) |
| iOS App Store | v1.0.13 | Eski yayin (v1.0.14 ile degisti) |
| Android Play Production | **v1.0.14** | **YAYINDA** (27 Mayis 2026 — versionCode 37 — Google Play onayi geldi, manuel "Yayinla" basildi) |
| Android Play Production | v1.0.13 | Eski yayin (v1.0.14 ile degisti) |
| Android Play Alpha | **v1.0.9** | Yayinda (12 test kullanicisi) — hala kapatilmasi planlandi |

### Build Numaralari
- **v1.0.10:** version 1.0.10, iOS buildNumber 27, Android versionCode 28 (eski yayin, atlandi)
- **v1.0.11:** version 1.0.11, iOS buildNumber 29, Android versionCode 30 (4 May 2026 sabah yayinlandi)
- **v1.0.12:** version 1.0.12, iOS buildNumber 30, Android versionCode 31 (atlandi, v1.0.13 ile degistirildi)
- **v1.0.13:** version 1.0.13, iOS buildNumber 32, Android versionCode 33 (6 May yayina cikti)
- **v1.0.14:** version 1.0.14, iOS buildNumber 37, Android versionCode 37 (27 May 2026 — **REVIEW'DA**, EAS autoIncrement ile 34/35 yerine 37 atandi)

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

## AKTIF/BEKLEYEN GOREVLER (28 Mayis 2026 itibariyle)

### TAMAMLANANLAR (28 May 2026 - Kurban Bayrami 2. gunu, sabah)

0000k. ✓ **27 May gec saat freemium kalan 5 yeni kayda da bayram hediyesi** — Sorgu ile tespit (27 May kayit, abonelik_durumu='deneme' veya NULL, dun 17:33-20:39 arasi kayit): Ali Hizmetci (yahoo), Tahir Uruc, Ersem Ozcan Tek, Zeynep Sozmen (yahoo), Ali Dogan Karacik. Hediye SQL atomic UPDATE ile uygulandi (abonelik_durumu='aktif', abonelik_plani='aylik', abonelik_bitis='2026-06-01 00:00:00+03'). Yeni script: `scripts/yeni-kayit-bayram-hediye-gec.mjs` (yeni-kayit-bayram-hediye.mjs pattern'i, 5 alici hardcode). 5/5 mail Resend Delivered (id'ler: bb1918c1, 8316adfd, 427a3288, a40e090b, 11a7e65e). **Toplam bayram premium grant'i**: 172 (sabah) + 11 (aksam) + 5 (28 May sabah) = **188 kisi** + 1 yillik (Asli Cetin, gerçek satin alma).

0000l. ✓ **`bayram-hediye-otomatik` scheduled task kuruldu** (28 May 2026 ~07:45 IST) — 28-30 May 2026 boyunca yeni kayit olacak kullanicilara OTOMATIK premium hediye + hos geldin maili. Recurring cron `*/15 * * * *`. Script: `scripts/bayram-hediye-otomatik.mjs` (yeni). Self-contained: .env env yukleme + Supabase PATCH + Resend mail + JSON audit log (`scripts/data/bayram-hediye-otomatik-log.json`, .gitignore'da). Idempotent (SQL filtresi `abonelik_durumu != 'aktif'`). Oto-kapanis: 1 Haz 00:00 +03 sonrasi no-op + "kampanya bitti" mesaji. **1 Haziran sabahi MANUEL DISABLE EDILMELI** (recurring oldugu icin no-op cikti her 15 dk surer — gurultu yapmasin diye kapatilmali). Test calismasi yapildi (0 yakalandi, beklenen), log dosyasi olustu. Bkz. INFRASTRUCTURE.md Bolum 11 (Aktif Scheduled Task'lar) + bu STATE.md.

### TAMAMLANANLAR (27 May 2026 - Kurban Bayrami 1. gunu, gece guncellemesi)

0000j. ✓ **v1.0.14 HER IKI PLATFORMDA YAYINDA** (27 May gece) — Apple expedited review request kabul edildi, onay sabah submit'inden ~12 saat icinde geldi (normal sure 24-48 saat). Ayni gun Google Play production track onayi geldi. Ayse manuel "Release This Version" (App Store Connect) + "Yayinla" (Play Console) basarak v1.0.13'u v1.0.14 ile degistirdi. **Onemli sonuc:** ScreenStack drawing crash kapsami artik daraldigi an. **Takip:** sonraki 24-48 saatte Play Console Vitals'i izle — yeni `IndexOutOfBoundsException` kaydi sifirlanmali (4.23.0 fix dogrulanmis olur). Eger crash devam ederse Plan B: `patch-package` ile 4.24'teki defansif kodu 4.23'e transplant (DECISIONS #37). **Yan kazanim:** Bayram gunu expedited review hizli geldi — Apple'in "critical hotfix + small change" sinyalini iyi okudugu dogrulandi.

0000g. ✓ **Bayram gunu organik trafik artisi tespiti** (17:00 itibariyle Supabase olcumu) — Bugun toplam 17 giris (dun 4 = +325%), bugun 13 yeni rehber kaydi (dun 4 = +225%), canli saha durumu bildirimi 0→5 (premium feature, premium kullanicilar sahada). Sohbet trafigi sabit (1 mesaj). Bayram hediyesi alanlardan (168 kisi) sadece 3'u bugun giris yapmis — push notification olmamasi sebep (v1.1.0 planinda), kullanici uygulamayi acmadan hediyeden haberi olmuyor. **Trafik artisinin cogu organik:** 17 girisin 14'u hediye almayanlardan. Bayram gunu rehberlerin sahada calismasi + canli durum bildirimleri bunu dogruluyor.

0000h. ✓ **Asli Cetin tam organik yillik conversion** (aslim.cetin.1999@gmail.com, 27 May 10:06 kayit, TUREB 13745, 1999 dogumlu) — IRO maili henuz yayinlanmadigi icin TAMAMEN organic kanaldan (kulaktan kulaga / App Store / sosyal medya) gelmis. Kayit -> 24sn sonra giris -> 4 dk sonra com.pusulaistanbul.app.yillik:yillik-yeni satin alma (2027-05-27'ye kadar). Hicbir manuel grant veya hediye yok, tamamen RC zincirinden geldi. **B2B niche app icin guclu sinyal:** IRO mail destekciligi olmadan, bayram gunu, 4 dakikada yillik conversion = yuksek niyet kullanicisi var. Risk: revenuecat_id NULL (use-abonelik.ts client-side listener bu spesifik senaryoda eksik kalmis — RC dashboard'da email aramayla bulunur, v1.1.0 setAttributes plani bunu kapatacak).

0000i. ✓ **27 May kayit olan 11 yeni rehbere bayram hediyesi grant + bilgilendirme maili** —
- **SQL:** UPDATE public.profiles SET abonelik_durumu='aktif', abonelik_plani='aylik', abonelik_bitis='2026-06-01 00:00:00+03'::timestamptz WHERE created_at >= '2026-05-27 00:00:00+03' AND rol NOT IN ('admin','moderator') AND (abonelik_durumu IS NULL OR abonelik_durumu = 'deneme'). RETURNING ile 11 satir dogrulandi.
- **Atlanaalar:** Suha Alincak (alincak@gmail.com, 00:09 kayit — sabahki 172'lik hediye SQL'inde zaten yakalanmis); Asli Cetin (aslim.cetin.1999@gmail.com, 10:06 kayit — yillik abone, hediyeye gerek yok).
- **Mail:** `scripts/yeni-kayit-bayram-hediye.mjs` yazildi (hardcode 11 alici, kurban-bayrami-hediye.mjs pattern'i). Tonu farkli: "hos geldin + bayram hediyesi" cercevesi, mavi guncelleme kutusu kaldirildi (v1.0.14 henuz Review'da, bu kullanicilar yeni indirmis), italic kutuda ucretsiz katmana baskici olmayan teskik metni eklendi ("aylik 99 TL veya yillik 699 TL (%41 avantajli) planlarimizdan birini secerek erisiminizi surdurebilirsiniz"). 11/11 basarili gonderim (Resend id'ler: ac6e9392, f3a66626, 177a7f2e, bed86dfe, 7f2571b4, 7dbd1735, 3c282f70, 2dcc30e2, 8f3be089, d5ef6bd4, 0873743b).
- **Microsoft pattern riski:** Erdogan Ozdemir (erdogan.ozdemirr@hotmail.com), Lara Karaman (lara_karaman@hotmail.com) — Resend Delivered status'una ragmen spam'e dusebilir. Resend dashboard'da takip edilmeli.
- **Toplam hediye:** 172 (sabah, Suha dahil) + 11 (aksam) = **183 kisi** bayram suresince premium. Asli yillik abone oldugu icin hariç.

### TAMAMLANANLAR (27 May 2026 - Kurban Bayrami 1. gunu sabah)

0000a. ✓ **v1.0.14 hotfix build + submit** — react-native-screens 4.16.0 → 4.23.0 upgrade ile ScreenStack drawing crash fix. iOS buildNumber 37 + Android versionCode 37. Her iki platform basariyla build edildi (EAS artifacts), submit edildi. Apple Review'da (Manual Release secildi, expedited review istendi). Google Play DRAFT'ta, incelemeye gonderildi. Onay bekleniyor (24-72 saat). Bkz. DECISIONS #37 (RNS 4.24 atlandi - BottomTabs eksik), ISSUES #79 (orijinal crash), ISSUES #80 (RNS 4.24 deneysel).

0000b. ✓ **16 onaysiz kullaniciyi 2 grup halinde manuel onay** — Microsoft (Hotmail/Outlook) ve Yahoo spam filtreleri Resend'den gelen Supabase Auth dogrulama maillerini "Onemsiz e-posta" klasorune atti, kullanicilar gormeyip hesabini aktive edemedi. Resend dashboard'da "Delivered" status'una ragmen. Cozum: SQL ile email_confirmed_at = NOW() manuel onay.
- **1. grup (sabah 01:37 onaylandi, 7 kisi):** ezeybey@hotmail.com, soysalmustafa@hotmail.com, yavuzdo@hotmail.com, alikaracayli@hotmail.com.tr, sevgi_tr_lv@hotmail.com, kvanlioglu@hotmail.com, fevziye22@yahoo.com.
- **2. grup (sabah 03:14 onaylandi, 8 kisi - daha eski kayitlar):** omur.kahraman@hotmail.com, ersin.yigid@gmail.com, abdullah_er21@hotmail.de, tinapinto73@hotmail.com, melikekorkmaz@hotmail.com, aliakkaya@laposte.net, merttaner@hotmail.com, buraksan@superonline.com.
- **Ayrica 1 olu hesap silindi:** Timucin Alp Aslan'in `timucin.aslan1956@gmail.vom` typo'lu kaydi (DELETE FROM auth.users + profiles). `gmail.com` versionu 9 May'dan beri aktif.

Bkz. DECISIONS #39 (Microsoft spam pattern), ISSUES #81-82.

0000c. ✓ **scripts/manuel-onay-bilgilendirme.mjs yazildi + 7 kisiye bilgilendirme maili gonderildi** — Resend API direct fetch (Supabase Auth bypass), markali HTML template (test-kullanici-mail.html pattern: gradient header + 80x80 windrose logo base64 inline + buyuk basligli "PUSULA ISTANBUL" + alt yazi). Uc mod: --dry (sadece icerik onizle), --test <email> (kendine), --all (ALICILAR listesindekine). Sender: `Pusula Istanbul <info@pusulaistanbul.app>`. Subject: "Pusula Istanbul Hesabiniz Hakkinda Bilgilendirme". Hitap: "Sayin {ad} {Bey/Hanim}". Mavi gradient kutuda v1.0.14 guncelleme uyarisi. Footer: pusulaistanbul.app. 1. grup 7 kisiye basariyla gonderildi (Resend Delivered). 2. grup 8 kisiye GONDERILMEDI (yeni oturumda ALICILAR listesini guncelleyip --all calistir).

0000d. ✓ **172 freemium kullaniciya KURBAN BAYRAMI PREMIUM HEDIYESI** — Atomic SQL: UPDATE public.profiles SET abonelik_durumu='aktif', abonelik_plani='aylik', abonelik_bitis='2026-06-01 00:00:00+03'::timestamptz WHERE rol NOT IN ('admin', 'moderator') AND (abonelik_durumu = 'deneme' OR abonelik_durumu IS NULL). 5 gun premium hediye, kurban bayrami sahasi suresince premium feature'lara kesintisiz erisim. RC'de degisiklik yok (use-abonelik Supabase fallback ile premiumMi=true). Test hesaplari otomatik haric (aysetokkus@icloud.com / demo.test@ / arasbayar@ / proteste_angel@ / aysetokkusbayar@ — hepsi `aktif` veya `suresi_dolmus` durumunda, `deneme` degil, sorgu eslestirmedi).

0000e. ✓ **.env'e RESEND_API_KEY eklendi** — `re_***REDACTED*** (.env)` (yeni key, isim: "manuel-bilgilendirme", Sending access permission). pusula-supabase-prod key'i (Supabase Auth SMTP) ayri, dokunulmadi. Comment: ".env'de `# Resend API key — SADECE manuel mail gonderim scriptlerinde kullanilir." notu eklendi.

0000f. ✓ **scripts/kurban-bayrami-hediye.mjs yazildi + 07:00 scheduled task kuruldu** (27 May 2026 sabah 04:00-05:00) — `manuel-onay-bilgilendirme.mjs` pattern'i taban alindi, runtime Supabase fetch + cinsiyetsiz hitap + altin gradient hediye kutusu + test domain filtresi (4 kayit otomatik atlandi, 172 → 168 gercek alici). Dry-run dogrulandi (168), Ayse'ye 3 test maili gonderildi (id'ler: cebf830a, fc49d885, 185b5291). **Onemli tasarim cevirme:** test-kullanici-mail.html'deki base64 inline logo Gmail'de render edilmiyordu (Ayse 1. test mailinde "?" gordu) — Supabase Auth template'lerindeki external URL pattern'ine cevirilmis ("PUSULA [logo] ISTANBUL" yatay banner, `https://pusulaistanbul.app/logo-icon.png`). Logo asimetrik gozukmesin diye width=70 height=50 (PNG 288x206 = 1.4:1 oran). Bkz. DECISIONS #40. **Gercek gonderim**: scheduled task `kurban-bayrami-hediye-mail-gonderim`, one-shot, `fireAt=2026-05-27T07:00:00+03:00`, prompt'unda `node scripts/kurban-bayrami-hediye.mjs --all` komutu var, otomatik disable olur (bkz. INFRASTRUCTURE.md). Yedek: Cowork uygulamasi 07:00'de acik olmali, kapaliysa sonraki acilista tetiklenir.

### BEKLEYEN ISLER (28 May 2026 sonrasinda — YENI OTURUM)

**EN YUKSEK ONCELIK:**

0. **1 Haziran 2026 sabah `bayram-hediye-otomatik` task'ini MANUEL DISABLE et** — Recurring cron `*/15 * * * *`. 1 Haz 00:00 +03 sonrasi script tarihi kontrol edip no-op donecek, ama task hala 15 dk'da bir tetiklenip Cowork notification gurultusu yapacak. Manage: Cowork sidebar → Scheduled → `bayram-hediye-otomatik` → disable. Audit log: `scripts/data/bayram-hediye-otomatik-log.json`'da kac kisi yakalandigi ve mail aldigi gorulebilir, kampanya raporu icin gerekli.

1. **07:00 TR scheduled task sonucu izle** — 07:00'de `kurban-bayrami-hediye-mail-gonderim` tetiklenecek, 168 kisiye mail gidecek. Cowork bildirimi gelince sonuca bak: kac basarili / kac hatali. Bounce'lar varsa email kolonunda typo olabilir, kontrol et. Resend dashboard: https://resend.com/emails

2. **2. grup 8 onaysiz kullaniciya bilgilendirme maili** — manuel-onay-bilgilendirme.mjs'deki ALICILAR listesini 8 yeni kisi ile guncelle, isim/soyisim/cinsiyet hitabi ata, `--all` ile gonder. Bonus: bu scripti de external URL logo pattern'ine cevir (bayram maili gibi) — base64 inline logo Gmail'de yamuk render ediyor, sabahki 7 kisiye bozuk gitmis olabilir. DECISIONS #40 referans alinmali.

3. **v1.0.14 crash takibi (yayindan sonraki 24-48 saat):**
   - v1.0.14 27 May gece yayina cikti her iki platformda — Play Console Vitals'i izle.
   - **Sifirlanma beklenir:** `java.lang.IndexOutOfBoundsException` Marmaray/ScreenStack crash kayitlari yeni gelmemeli.
   - **Crash sifirlanirsa:** 4.23.0 fix gercekten cozdu (DECISIONS #37 onaylanmis olur). ISSUES #79 ve #80 "Cozuldu" stamp'i.
   - **Crash devam ederse Plan B:** `patch-package` ile 4.24'teki ScreenStack defansif kodunu (currentVisibleBottom + updateA11yForVisibleScreens + shouldDisableFocusabilityBeneathTopScreen) 4.23 source'una transplant et.
   - **Otomatik guncelleme dalgasi:** ~%85 kullanici 24-48 saat icinde v1.0.14'e gecer, %15 manuel guncelleyici eski v1.0.13'te kalir (DECISIONS uzun vadeli: v1.1.0'da in-app guncelleme uyarisi).

**ORTA ONCELIK:**

4. **test-kullanici-mail.html Turkce karakter bug fix** — `text-transform: uppercase` CSS Turkce `i` → `I` ASCII'ye ceviriyor, `İ` ve `ı` karakterleri bozuyor. Cozum: text-transform kaldir, direkt buyuk harf yaz: "PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI". Bkz. DECISIONS #38. Bu hata Supabase Auth template'lerinde de var (sifre sifirlama vs.) — onlari da kontrol et.

5. **Google Play Odeme profili eksiklerini tamamla:** (bu sabah dokunulmadi, eski oncelik)
   - Banka hesabi ekle (Apple IBAN'i)
   - Tayvan vergi formu (minimal)
   - Irlanda formu (Mukimlik Belgesi geldi mi, kontrol et)
   - %15 hizmet ucreti programi kaydi

6. **v1.0.14 yayina cikinca DOKUMANTASYON kapaklamasi:**
   - CHANGELOG.md'ye v1.0.14 release notes (var, ama yayin tarihi ile guncellenmeli)
   - STATE.md'de "REVIEW'DA" → "YAYINDA" + tarihi belirt
   - CLAUDE.md tarih + tablo guncellemesi

### TAMAMLANANLAR (7 May 2026)
000a. ✓ **Elvan Ozbay (elvanozbay@gmail.com) - 1 yil premium hediye** (7 May 2026) — organik kanaldan gelen ilk destek vakasi. Google Play hesap ulke uyumsuzlugu (turdayken) sebebiyle satin alma yapamadi. RC alias YOK (revenuecat_id NULL — satin alma denemesi RC zincirine bile ulasmadi, Play Store seviyesinde bloke). Manuel grant: abonelik_durumu='aktif', abonelik_plani='yillik', abonelik_bitis='2027-05-07'. Mustafa/Sebnem pattern'inin yumusatilmis varyanti (onlar para odemis ve refund + 1 yil hediye almistilar; Elvan para odeyemedi ama markali destek olarak hediye verildi). Mesaj WhatsApp/Messenger ile gonderildi.

### TAMAMLANANLAR (6 May 2026)
00. ✓ **v1.0.13 yayinlandi her iki platformda** (6 May 2026 sabah) — kayit zorunlulugu + freemium kapsam sikilastirma. Apple review ~24 saatten kisa surede onay verdi. Google Play onaylandi, manuel "Yayinla" basildi. v1.0.12 atlandi (v1.0.13 ile degistirildi).
00a. ✓ **X bot client-side → Edge Function tasima** (6 May aksami) — Marmaray duzelme tweet'i 33 dk gectigi halde ingest edilmemisti. Sebep: client-side bot kullaniciya bagli. Cozum: `supabase/functions/ulasim-senkron/index.ts` deploy + `pg_cron *​/15 * * * *` schedule + Vault secret + Edge Function secrets. Twitter Bearer Token Regenerate (eski revoke). Geriye donuk 5 Marmaray + tum 24h+ aktif=false ariza/gecikme/kesinti kayitlari `cozuldu=true` yapildi. Build gerektirmedi (server-side degisim). Tahmini X API maliyet tasarrufu: aylik $20 → $3-5. Bkz. DECISIONS #36.

### TAMAMLANANLAR (4 May 2026)
0. ✓ **v1.0.11 yayinlandi** her iki platformda (4 May 2026, ~24 saat onay)
0a. ✓ **Mekan saatleri konvensiyon bug** — 15 mekan "Pazar kapali" yanlis gosterimi cozuldu (DECISIONS #32)
0b. ✓ **profiles.email schema fix** — kolon eklendi, auth.users sync trigger kuruldu (DECISIONS #33)
0c. ✓ **Profiles UPDATE RLS policy** — admin baskasinin profilini guncelleyebiliyor (DECISIONS #34)
0d. ✓ **admin.tsx RLS defansif kod** — moderatorAta + moderatorKaldir artik sessiz red yakalar (v1.0.12'de yayinlanacak)
0e. ✓ **Play Store global yayin** — uygulama tum ulkelerde (175+) indirilebilir, IAP fiyatlari da global (Aylik 83,33 TRY baz, Yillik 583,33 TRY baz, Turkiye 99,99/699,99 TL korundu)
0f. ✓ **Apple App Store** — zaten 175 ulkede yayinda, IAP fiyatlari otomatik dagildi
0g. ✓ **Galataport gemi takvimi** — 5 haftadir donmus 204 yanlis kayit silindi, 224 dogru kayit yuklendi (Mayis-Aralik 2026)
0h. ✓ **Excel ↔ DB tutarliligi** — mekan_saatleri 58/58 kayit, gun ve saat alanlari %100 hizali

### EN YUKSEK ONCELIK
1. **IRO mail yeniden talep + organik trafik karsilastirma temeli:**
   - **DURUM (27 May):** IRO maili 7 May'da yayinlanmadi, Ayse yeniden talep gonderecek. Bu arada uygulamaya 20 gunde 107+ rehber kayit ve bugun 13 ek kayit + 1 organik yillik conversion (Asli Cetin) ulasti — TAMAMEN organik (kulaktan kulaga, App Store/Play Store, sosyal medya).
   - **IRO ciktiktan sonra:** asagidaki metrikleri organik baseline ile karsilastir
   - Yeni kayit oranini gunluk izle: `SELECT date_trunc('day', created_at) gun, count(*) FROM auth.users WHERE created_at >= '2026-05-07' GROUP BY 1 ORDER BY 1;`
   - Aktivasyon orani: kayit sonrasi ilk 24 saatte premium duvara ulasan / kayit
   - Conversion: 7 gun icinde abonelige donusen / kayit. Organik baseline: ~1/120 (Asli) = %0.8. IRO sonrasi hedef %5+ (B2B niche app standardi).
   - Destek mesaji volumune hazir ol: Elvan-vari "abone olamiyorum", VPN/ulke uyumsuzlugu, ilk kez kayit takintisi vb.

2. **v1.0.13 yayin sonrasi monitoring (6-13 May 2026):**
   - **Kayit oranini izle:** Misafir akis kapali, oturum acmayan kullanici core value goremez. 1-2 hafta veri toplandiktan sonra yeni kayit/aktif kullanici/conversion oranina bakilacak.
   - **Otomatik guncelleme kapali ~%15 kullanici:** Eski v1.0.12 ile takilirlar. Sikayet/destek mesaji gelirse "App Store/Play Store'dan guncellemek lazim" yanitlari hazir.
   - **Premium duvar tepkilerini topla:** Ozellikle Bogaz Turlari Dentur+Sehir Hatlari premium oldu, kullanici tepkisi olcum altinda.

2. **Google Play Odeme profili eksiklerini tamamla:**
   - **Banka hesabi ekle** (Apple'da kullanilan IBAN ile ayni olabilir) — odeme almanin on kosulu
   - **Tayvan vergi formu** — Pusula Istanbul'un Tayvan kullanicisi yok, "ilgili degil" / minimal bilgi yeterli
   - **Irlanda formu**: "Hayir, vergi anlasmasindan yararlanmiyorum" ile gecici tamamla, %20 stopaj kabul. Mukimlik Belgesi posta ile geldiginde formu guncelle, %10'a in
   - **%15 hizmet ucreti programi kaydi** — bonus, ilk $1M revenue icin Google komisyonu %30 → %15

3. **Pusula-Alpha kapali test kanalini kapat/sil** — v1.0.11 production'da, alpha gerek yok. Test kullanicilari production'a otomatik gecer.

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
4. **X API senkronizasyonu client-side cleanup** — Server-side tasima 6 May 2026'da TAMAMLANDI (`supabase/functions/ulasim-senkron`, pg_cron `*​/15 * * * *`). v1.1.0 build'inde client-side artiklari sil: (a) `app/_layout.tsx` line 183-188: `useXUlasim()` cagrisini ve import'u kaldir, (b) `hooks/use-x-ulasim.ts` dosyasini sil, (c) `lib/config.ts` line 10-13: `X_BEARER_TOKEN` ve `X_SENKRON_ARALIK_DK` sil, (d) `eas env:delete --name EXPO_PUBLIC_X_BEARER_TOKEN --environment production`. Bkz. DECISIONS #36, INFRASTRUCTURE.md Bolum 13.
5. **Ana ekran widget** — Sultanahmet Camii saatleri + ulasim uyarilari. `react-native-android-widget` + `expo-apple-targets`.
6. **RC'ye email attribute yaz (1 May 2026 ogrenildi):** `lib/revenuecat.ts`'te login sonrasi `Purchases.setAttributes({'$email': user.email})` cagir. Boylece RC dashboard'da musteri email ile aranabilir, anonymous user'larin Supabase user'a baglanmasi izlenebilir. Su an email aramasi RC'de bos donuyor.
7. **Supabase data hygiene (1 May 2026 ogrenildi):** RC'de 8 active subscription, Supabase'de 25 abonelik_durumu='aktif' kullanici. Stale kayitlar (Ayse'nin test hesaplari + iptal etmis ama DB guncellenmemis) icin temizlik scheduled task'i. RC webhook → Supabase Edge Function ile expired subscriptions'i pasif yap.
8. **Galataport gemi takvimi scheduled task (4 May 2026 fark edildi):** Mevcut sistem 29 Mart 2026'da bir kerelik scrape ile 204 yanlis kayit insert etmisti, sonra 5 hafta dokunulmadi. Veri donmustu, tarih kaymalari + eksik gemiler vardi. 4 May'da Firecrawl ile Mayis-Aralik 2026 sezonu yeniden cekildi (224 dogru kayit). Kalici cozum: `havalimani-tarife-guncelle` pattern'ini takip eden `galataport-gemi-takvimi-guncelle` scheduled task. Gunluk veya haftalik calistir, cruisetimetables.com ay sayfalarini Firecrawl ile scrape et, gemi_takvimi tablosunu UPSERT et. Tahmini sure: ~2 saat. Bkz. ISSUES #75.

9. **Havalimani Ulasim Excel pipeline (4 May 2026 talep edildi):** `mekan-saatleri-veri-giris.xlsx` pattern'i mukemmel calisiyor — Ayse Excel'den toplu duzenleyip sync atabiliyor. Ayni mantiki havalimani seferleri icin de uygula. Gerekenler: (a) `havalimani-seferleri-veri-giris.xlsx` template (durak_adi, firma, havalimani, sehirden_hav saatleri virgullu, havdan_sehir saatleri virgullu, sehirden_hav_guzergah, havdan_sehir_guzergah, fiyat, sure, not_bilgi, aktif), (b) `template-olustur.py` ve `template-doldur.py` benzeri scriptler havalimani icin, (c) `excel-full-sync-sql-havalimani.py` (saatler icin jsonb donusumu dahil). Bonus: `bogaz-turlari-veri-giris.xlsx` da ayni pattern'le birlikte yapilabilir (kalkis_noktalari, hafta_ici_saatler, hafta_sonu_saatler, fiyat, sure). Tahmini sure: ~3-4 saat (havalimani + bogaz beraber).

10. **Kullanici guncelleme farkindaligi (4 May 2026 talep edildi):** Su an Pusula'da in-app guncelleme uyarisi YOK. Otomatik guncelleme (Wi-Fi'da) aktif olan ~%85 kullanici 24-48 saatte yeni surumu alir; otomatik kapali olan %15 kullanici eski surumde takilir. **Cozum (orta vadeli):** Profil ekranina surum kontrolu ile "Guncelleme mevcut" bant + ana ekran ustunde nazik uyarisi. `react-native-version-check` paketi hem iOS hem Android icin Apple/Google public API'sinden son surumu ceker, lokal ile karsilastirir. Tiklaninca App Store/Play Store'a yonlendirir. Tahmini sure: ~2-3 saat. **Ileri vadeli (v1.2.0):** EAS Update / `expo-updates` paketi ile OTA — frontend bug fix'ler review-bypass canliya gider (sadece native degisikliklerde build/review gerekir). ~1 gun setup. Apple'in "OTA sadece bug fix icin" kurali var, dikkatli kullanmak gerek.

11. **Admin panel hesap silme + KVKK onay maili tek tik butonu (27 May 2026 talep edildi):** Su an hesap silme talebi geldiginde manuel akis var — Claude'a yaz, SQL sorgu cek, atomic DELETE at, `scripts/hesap-silme-onay-atakan.mjs` pattern'inden tek mail gonder. Cogu zaman 5-10 dakika is ama hata payi var (yanlis ID, FK kaynakli yetim satir). Atakan Ceyhan vakasi (27 May 2026) ilk dokumante edilen silme talebi, organik trafik buyuduyse aylik 1-3 talep beklenir. **Cozum:** `app/admin-kullanici-yonetim.tsx` yeni ekran — admin/moderator gorebilsin, kullanici ara (email veya isim), kayit detayi goster (rol, abonelik durumu, RC alias, kac mesaj/saha bildirimi vb.), "Hesabi Sil + KVKK Mail Gonder" butonu. Buton akisi: (a) tum bagli tablolardan DELETE (sohbet_mesajlari, canli_durum, yogunluk, raporlanan_mesajlar, engellenen_kullanicilar — engelleyen + engellenen), (b) profiles DELETE, (c) auth.users DELETE (Supabase admin API uzerinden, service role gerektigi icin Edge Function veya RPC), (d) Resend API ile KVKK kapanis maili gonder (`scripts/hesap-silme-onay-atakan.mjs` HEDEF blogu template haline getir). Onay dialog'u zorunlu: "Bu islem geri alinamaz. Devam edilsin mi?". Audit log: `kvkk_silme_kayitlari` tablosuna kim sildi/ne zaman/hangi email/silen admin id. Tahmini sure: ~4-5 saat. **Bonus alternatif:** moderator'a sadece "talep al" yetkisi ver, admin'e "onay + sil" yetkisi — iki-asamali yapinin hesap silme gibi kritik bir aksiyonda iyi olur. Bkz. scripts/hesap-silme-onay-atakan.mjs (template hazir), DECISIONS #34 (RLS sessiz red defansif kod).

12. **Kritik sohbet mesajlarini ana sayfada one cikarma — pin/bayrak sistemi (27 May 2026 talep edildi):** Tetikleyici vaka: Huseyin Hizmetci (moderator, TUREB 44, kidemli rehber) 12 May 2026 18:48'de sohbete attigi mesaj — "Yerebatan konusunda yeni bir gelisme var. Mahkeme yurutmeyi durdurmus. Simdilik bir devir teslim yok. A surec nasil devam edecek bilmiyorum." Tam bir moderator katkisi (Yerebatan Sarnici isletme devri hukuki gelisme), ama sohbet ekraninda mesaj akisinda kaybolup gidiyor. Su an sohbete girmeyen rehber bu kritik saha bilgisini goremiyor. **Cozum:** (a) `sohbet_mesajlari` tablosuna `pinned BOOLEAN DEFAULT false` + `pinned_at TIMESTAMPTZ` + `pinned_by UUID` kolonlari ekle, (b) admin/moderator icin sohbet ekranindaki mesajlara uzun basinca "Sabitle" secenegi (yetki: useAdmin().isYetkili), (c) ana sayfada (`app/(tabs)/index.tsx`) yeni bir bant: "Sahadan Onemli" basligi + son 48 saatin pin'li mesajlari (gradient kart + pin ikonu + mesaj metni + atan kullanici + zamani), tiklayinca sohbete yonlendir, (d) otomatik unpin: 48 saat sonra `pinned = false` (scheduled task veya app-side filter), (e) RLS: pin yazma sadece admin/moderator, pin okuma herkes (premium gate YOK — bu acil saha bilgisi, bedava katmanda da gozuksun, premium teskik degeri korunur). **v1.1.0 push notification (madde 3) ile entegrasyon:** mesaj pin'lendigi anda tum kullanicilara push gonder — "Sahadan: <mesaj baligi/ilk 60 kar>". Tahmini sure: ~3-4 saat (kolon migration + sohbet UI + ana sayfa bant + scheduled task). Bkz. sohbet_mesajlari Realtime calisiyor (ISSUES #7), pin degisiklikleri de aninda yansir.

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
- **Production:** **v1.0.12 YAYINDA** (versionCode 31, 4 Mayis 2026 aksam — onaylandi, manuel "Yayinla" basildi, kullanicilara ~24-48 saatte yayilacak). v1.0.11 (versionCode 30) onceki yayindi. v1.0.9 (versionCode 26) ve v1.0.10 (versionCode 28) atlandi.
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
- **App Store:** **v1.0.11 YAYINDA** (4 Mayis 2026 sabah — use-abonelik NULL profile fix + UX). **v1.0.12 REVIEW'DA** (4 May aksam submit — uc degisiklik).
- **iOS IPA:** v1.0.11 build 29 (yayinda), v1.0.12 build 30 (review'da)
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
