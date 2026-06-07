# Pusula Istanbul - Claude Oturum Indeksi

**Tarih (son guncelleme):** 6 Haziran 2026 — **v1.1.1 HER IKI PLATFORMDA YAYINDA. 48 mimari karar.** Bu oturumda (5-6 Haz): (1) **KRITIK: Push notification'lar 2 Haz'dan beri sessiz oluydu, duzeltildi** — Security Advisor temizliginde `push_gonder_async`'in PUBLIC EXECUTE'u revoke edilince trigger'lar (SECURITY INVOKER) authenticated kullanicida "permission denied" aliyordu; zirhsiz 3 trigger'da (bogaz/havalimani/mekan_saatleri) admin panel UPDATE'leri komple FAIL, zirhli 6'sinda push sessizce olu. Fix: 9 `trg_push_*` fonksiyonu SECURITY DEFINER + 3'une EXCEPTION sargisi (migration `push_trigger_security_definer_ve_exception_zirh`). DECISIONS #48 + ISSUES #84. **Push uctan uca testi HALA BEKLIYOR** (sohbet mesaji → kapali cihaza push). (2) **Bogaz turu tarife otomasyonu kuruldu:** `turyol-senkron` scheduled task (07:30+19:30, `scripts/turyol-senkron.mjs`, turyol.com form POST — SCRIPTS.md #3) + `bogaz-diger-senkron` (08:00+20:00, Sehir Hatlari kisa/uzun + Dentur, prompt-driven Firecrawl cunku Dentur SPA — INFRASTRUCTURE Bolum 11). TURYOL tarife elle duzeltildi (haftaici saat basi 10-21, hafta sonu 14 sefer), Sehir Hatlari'nin BOS duran saat alanlari dolduruldu (kisa 14:40, uzun 10:35). (3) Leaked Password Protection Dashboard'ta acilacakti (Attack Protection → "Configure in email provider"), onay teyit edilmedi — kontrol et. (4) `sehir-hatlari-iptal-takip` 964 okunmamis bildirim biriktirmis — prompt'u sessiz moda cevrilmeli (bekleyen is). Onceki ozet (4 Haziran): v1.1.1 iOS onayi geldi, app_versions iOS 1.1.1 UPDATE edildi. Genel Duyuru silme bug'i cozuldu: butonlar tum paketlerde VARDI ama `kart` stili `flexDirection: 'row'` kaldigi icin 0 genislikte gorunmez render oluyordu; fix kart → column+stretch (commit 29ee7a6), dagitim EAS Update OTA ile (runtime 1.1.1, magaza build'i GEREKMEDI — OTA'nin ilk basarili gercek kullanimi). Tani tuzaklari (Hermes bundle'da Turkce karakterli string grep yanlis negatifi): DECISIONS #47 + ISSUES #83. Bir sonraki store surumu 1.1.2 olacak. Daha onceki ozet (2 Haziran gece): v1.1.0 Android sabah yayına çıktıktan sonra ayni gün öğleden sonra iki kritik bug fark edildi (Android push notification ses gelmiyor + Genel Duyuru silme UI eksik) → hemen v1.1.1 hotfix paketlendi. iOS v1.1.0 review iptal edildi, doğrudan v1.1.1'e geçildi. Android v1.1.1 onaylandı, Ayşe öğleden sonra "Yayınla" bastı, app_versions UPDATE ile eski sürüm kullanıcılarına güncelleme bandı görünüyor. iOS Apple Review devam ediyor (~24-72 saat). **Bu oturumda (2 Haziran, sabah → gece) BÜYÜK İŞLER:** (1) **Havaist Senkron Pipeline kuruldu** — hava.ist resmi backend API'si keşfedildi (`s.hava.ist/api.php`), `scripts/havaist-senkron.mjs` + scheduled task `havaist-senkron` (cron `0 7 * * *`), 14 IST kaydı taze veriyle + hat kodları (HVL-1..9, HVİST-5A/7/11/13) + her iki yönde güzergah text alanları (DECISIONS #44, SCRIPTS.md #2). (2) **Push notification ses bug fix** — `setNotificationChannelAsync({ sound: 'default' })` string'i sessiz kanal oluşturuyordu, server-side Edge Function push-gonder v2 deploy (KANAL_MAP `-v2` suffix) ile mevcut v1.1.0 kullanıcısı için anlık çözüldü, client-side fix v1.1.1'de (eski kanallar silinir, yeni `-v2` ID'li sound parametresiz oluşur) (DECISIONS #45). (3) **Yeni kayıt 7 gün premium trial sistemi** — Vault'a `resend_api_key`, Edge Function `yeni-kayit-hediye`, SQL trigger `trg_yeni_kayit_hediye` ON profiles INSERT, markalı hoş geldin maili (Ayşe onaylı) — anlık tetikleme, idempotent (DECISIONS #46). (4) **Genel duyuru silme defansif kod** — RLS sessiz reddi yakalama (DELETE ... RETURNING), optimistic state update, Alert ile başarısızlık bildirimi (v1.1.1'de aktif). (5) **GitHub'a 1 aylık birikmiş 58 dosya yedeklendi** — kritik untracked durumdaydı, commit + push yapıldı. (6) **Security Advisor temizliği** — 32 warning → 3 (12 search_path fix + 8 PUBLIC EXECUTE revoke + storage list policy + rls_auto_enable), kalan 3 false positive (is_admin/is_admin_or_mod RLS için zorunlu) + Leaked Password Protection (Ayşe Dashboard'tan açacak). **46 mimari karar** (#44 Havaist API, #45 Android kanal ses bug, #46 Yeni kayıt trial).

---

## OKUMAN GEREKEN DOSYALAR — ZORUNLU, OPSIYONEL DEGIL

Bu CLAUDE.md'yi gordugun anda HEMEN, kullaniciya tek soru sormadan once, sirasiyla SU IKI DOSYAYI DA OKU:

1. `claude-context/STATE.md` — Su anki surum durumu, deploy durumu, aktif gorevler
2. `claude-context/PROJECT.md` — Tum teknik yapi, dosya yapisi, is mantigi, tasarim kurallari

Bu uc dosyayi (CLAUDE.md + STATE.md + PROJECT.md) okumadan kullaniciya cevap YAZMA. Toplam ~8k token, hepsi birden okunabilir, sorun degil.

Konu spesifikse asagidaki tabloya bak, **uygun moduli da hemen oku**. Birden fazla satira uyuyorsa hepsini oku.

| Kullanici sunlardan bahsediyorsa... | Hemen oku |
|---|---|
| Auth, sifre sifirlama, kayit, deep link, recovery, oturum acma | `DECISIONS.md` (ozellikle "Pending Pattern" + "RLS Sessiz Reddedebilir") |
| RevenueCat, IAP, satin alma, abonelik, premium gate, paywall | `DECISIONS.md` ("3 Katmanli Guvenlik Agi" + #31 NULL profile + #41 profile.id==RC alias) + `INFRASTRUCTURE.md` ("RevenueCat") |
| revenuecat_id NULL, RC alias yok, manuel baglama | `DECISIONS.md` (#41) — profile.id zaten RC app_user_id, direkt kopyala |
| Supabase, RLS, SQL, migration, jsonb, realtime | `DECISIONS.md` ("RLS Sessiz Reddedebilir", "Service Role Key") + `INFRASTRUCTURE.md` ("Supabase") |
| Email, SMTP, Resend, DKIM, DNS, template | `INFRASTRUCTURE.md` ("Email Altyapisi") |
| Yeni surum cikarma, build, eas submit, release notes | `INFRASTRUCTURE.md` ("EAS") + `CHANGELOG.md` (release notes formati) |
| Apple reject, App Store, EULA, subscription metadata | `DECISIONS.md` ("Paid Apps Agreement", "Subscription Group Localization") + `INFRASTRUCTURE.md` ("Apple") |
| Google Play, manifest, publish, alpha, license testing | `INFRASTRUCTURE.md` ("Google Play") |
| Bug, hata, "calismiyor", "olmuyor" — neyse | `ISSUES.md` (82 bug indeksli — benzer bir bug var mi diye once burada ara) |
| react-native-screens, ScreenStack, drawing crash, IndexOutOfBoundsException | `DECISIONS.md` (#37 "RNS 4.24 atlandi") + `ISSUES.md` (#79-80) |
| Microsoft/Hotmail/Outlook/Yahoo spam filtresi, onay maili gitmedi, manuel onay | `DECISIONS.md` (#39 "Microsoft Spam Pattern") + `ISSUES.md` (#81) + `scripts/manuel-onay-bilgilendirme.mjs` |
| CSS text-transform Turkce karakter bozuluyor (İ ı) | `DECISIONS.md` (#38 "text-transform: uppercase Turkce bozar") |
| Bayram hediyesi, toplu premium grant, freemium kullaniciya hediye | `STATE.md` (27 May 2026 TAMAMLANANLAR + BEKLEYEN bolumleri) |
| Push notification, expo_push_token, FCM V1, APNs Key, push-gonder, trigger | `STATE.md` (1 Haz 2026 — Push Notification Altyapisi bolumu — adim 6-15) |
| Android push sessiz, ses gelmiyor, notification channel sound default bug, kanal -v2 suffix | `DECISIONS.md` (#45 "Android Notification Channel Ses Bug") — server-side hotfix Edge Function v2, client v1.1.1'de deleteNotificationChannel + yeniden olustur |
| Yeni kayit auto-premium, 7 gun trial, hos geldin maili otomatik, profiles INSERT trigger | `DECISIONS.md` (#46 "Yeni Kayit 7 Gun Premium Trial") — Edge Function `yeni-kayit-hediye`, vault'tan resend_api_key, trg_yeni_kayit_hediye |
| Vault secret, get_resend_api_key, pusula_cron_secret, vault.decrypted_secrets | `DECISIONS.md` (#46 Vault Pattern) — Service Role ile programmatik secret yonetimi |
| Security warnings, search_path mutable, SECURITY DEFINER PUBLIC, Supabase advisor | `DECISIONS.md` (#46 sonu) — 32 warning → 3 false positive (2 Haz 2026 temizlik) |
| Genel duyuru, foto upload, duyuru-gorseller storage, GenelDuyuruPanel | `STATE.md` (1 Haz 2026 — Genel Duyuru Ozelligi adim 16-21) |
| Buton/UI gorunmuyor ama kod var, gorunmez render, flexDirection, OTA ile fix dagitma, bundle icerik dogrulama | `DECISIONS.md` (#47 "Gorunmez UI Bug") + `ISSUES.md` (#83) |
| Push gitmiyor, permission denied for function, trigger SECURITY DEFINER, EXECUTE revoke, admin panel UPDATE hatasi | `DECISIONS.md` (#48) + `ISSUES.md` (#84) |
| Bogaz turu tarife senkronu, turyol-senkron, bogaz-diger-senkron, Sehir Hatlari/Dentur scrape | `SCRIPTS.md` (#3 turyol-senkron) + `INFRASTRUCTURE.md` (Bolum 11) |
| Sohbet pin, "Sahadan Onemli", PinliMesajBandi, pinned_at 48h | `STATE.md` (1 Haz 2026 adim 34) |
| Guncelleme bandi, app_versions tablosu, store_url, semver kontrol | `STATE.md` (1 Haz 2026 adim 31) |
| edge-to-edge, edgeToEdgeEnabled, Android 15 safe area | `STATE.md` (1 Haz 2026 adim 29) |
| Etkinlik tarih/saat 3 saat fark, tarih-saat-secici TZ bug | `STATE.md` (1 Haz 2026 adim 27) — fix: isoFormat'a +03:00 ekle |
| Email template, marka logosu, Gmail render, base64 vs URL, aspect ratio | `DECISIONS.md` (#40 "Email Template Logo — Base64 Inline Degil, External URL") + `INFRASTRUCTURE.md` (Bolum 1 Tasarim DNA'si) |
| Scheduled task ekleme/listeleme, Cowork bildirimleri, one-shot fireAt | `INFRASTRUCTURE.md` (Bolum 11 "Aktif Scheduled Task'lar") + `SCRIPTS.md` (kritik script kaynak kodlari) |
| bayram-hediye-otomatik, yeni kayit auto-premium, 28-30 May kampanya | `SCRIPTS.md` (1. bayram-hediye-otomatik) — tam script + SKILL.md prompt. **DEVRE DISI (1 Haz 2026)** — kampanya raporu: `claude-context/raporlar/bayram-hediye-otomatik-rapor.md` |
| X API, Twitter, ulasim uyarisi, trafik bandi, Marmaray bot, gecikme/ariza tespiti | `DECISIONS.md` (#36 "X API Senkronu Edge Function'a Tasindi") + `INFRASTRUCTURE.md` (Bolum 13 "Ulasim-Senkron Edge Function") |
| Edge Function, pg_cron, Vault, supabase functions | `INFRASTRUCTURE.md` (Bolum 13) + `DECISIONS.md` (#36) |
| Havalimani Ulasim, IST, SAW, Havaist, Havabus, HVL, HVIST, s.hava.ist API, havaist-senkron | `INFRASTRUCTURE.md` (Bolum 12 "Havalimani Ulasim Veri Pipeline'i") + `DECISIONS.md` (#44 "Havaist Resmi API > Firecrawl") + `SCRIPTS.md` (#2 havaist-senkron) |
| Eski surum ne degisti? v1.0.x ne icindeydi? | `CHANGELOG.md` |
| Tasarim kurali, emoji, renk, logo, font | `PROJECT.md` ("Tasarim Kurallari") |
| "Bu nasil yapilirdi?" / mimari tartisma | `DECISIONS.md` (46 mimari karar) |
| Mekan saatleri/fiyat toplu yonetim, Excel pipeline, mevsim gecisi | `DECISIONS.md` ("Excel-as-Source-of-Truth") + `STATE.md` ("Toplu Veri Yonetim Dosyalari") |

---

## ASLA SORMAYACAGIN SORULAR

Asagidaki sorulari kullaniciya **sorma** — cevaplar bu dosyada veya okuman gereken modullerde mevcut. Sormak Ayse'nin vaktini bosa harcar ve onu sinirlendirir.

- "React Native surumun kac?" — **0.81.5** (`package.json`)
- "Expo SDK kac?" — **~54.0.33**
- "TypeScript surumun kac?" — **~5.9.2**
- "React surumun kac?" — **19.1.0**
- "Expo Router var mi?" — **Evet, ~6.0.23**
- "Hedef Android API/SDK kac?" — **Expo SDK 54'un getirdigi target = API 36 (Android 14)**, Expo prebuild ile yonetilir, app.json'da explicit yazmiyor
- "newArchEnabled aktif mi?" — **Evet** (reanimated 4.x icin zorunlu)
- "Bu uygulamayi tek basina mi gelistiriyorsun, ekiple mi?" — **Tek basina** (Ayse Tokkus Bayar — gelistirici, urun sahibi, profesyonel turist rehberi)
- "Bir geliştirici/ajansla mi calisiyorsun?" — **Hayir, Ayse + Claude**
- "Hangi backend kullaniyorsun?" — **Supabase** (URL: rzlfghjpsximthlolfxo.supabase.co)
- "Auth nasil?" — **Supabase Email/Password, email confirmation acik, custom SMTP (Resend)**
- "IAP nasil?" — **RevenueCat (entitlement: `premium`)** — App Store + Play Store
- "Bundle ID nedir?" — **com.pusulaistanbul.app**
- "Domain ne?" — **pusulaistanbul.app**
- "Hangi Node surumu?" — **Node 20 zorunlu (v24 uyumsuz)**
- "Expo Go calisir mi?" — **HAYIR**, native modules var (RC, expo-notifications, screen-capture). Custom dev client gerekir: `npx expo start --dev-client`
- "Apple/Google hesap aktif mi?" — **Ikisi de aktif**, Paid Apps Agreement Active (5 Nis 2026 - 31 Mar 2027)
- "Su an hangi surum yayinda?" — **STATE.md'ye bak, sorma. v1.1.1 HER IKI PLATFORMDA YAYINDA (Android 2 Haz, iOS 4 Haz 2026). `app_versions` her iki platform icin 1.1.1. Yayindaki cihazlara ek olarak EAS Update OTA (4 Haz, duyuru buton gorunurluk fix'i) dagitildi.**
- "Proje dizini nerede?" — **/Users/aysetokkus/istanbul-rehber** (her zaman bu, sorma)

Eger `package.json`'a, `app.json`'a, ya da `eas.json`'a bakman lazim olan basit bir teknik soru varsa **dosyaya kendin bak**, kullaniciya sorma.

---

## KULLANICI: AYSE TOKKUS BAYAR

- **Tercih ettigi dil:** Türkçe (UI, kod yorumu, sohbet — hepsi)
- **Bilimsel/kanitli bilgi odakli, ateist, bilime inanir**
- **Iletisim tonu:** cesaret verici, konuskan, hossohbet, pratik, hemen konuya gir, kurumsal jargonla yaz
- **Yanitlarda empatik ve anlayisli ol, ileri gorusluluk benimse, guclu fikirleri rahatlikla paylas**
- **Uygun durumlarda hizli ve zekice esprilerle renklendir**
- **Ilgi alanlari (proje disi):** Tarihi Istanbul'da sokak yasami, sosyal hayat, ticaret, uretim, emek gucu
- **EMOJI YOK** (kesinlikle, kodda da, sohbette de — istemediginde kullanma)
- **Iyi Fransizca, orta Ingilizce, az Ispanyolca**
- 17 yasinda oglu var, evli
- Tup mide ameliyatli (8 Ocak 2024)
- **Iletisim:** info@pusulaistanbul.app — ayni zamanda app gelistiricisi

---

## PROJE OZETI — Hemen Anla

### Bu Uygulama Nasil Yapiliyor
**Pusula Istanbul, Claude Cowork ile gelistiriliyor.** Ayse Tokkus Bayar (profesyonel turist rehberi, 30 yillik marka emegi) urunun tek sahibi ve gelistiricisi — gelistirme partner'i olarak Claude'u (Cowork modu) kullaniyor. Klasik anlamda yazilim ekibi YOK, baska gelistirici/ajans YOK. Kararlari Ayse aliyor, kodu Claude yaziyor — ama kalite kontrol Ayse'de.

### Ne Yapan Bir Uygulama
**Pusula Istanbul** — Istanbul'daki profesyonel turist rehberleri icin **freemium** mobil uygulama. Hedef kullanici dar ve net: TUREB ruhsatli, sahada turla calisan rehber. Sundugu sey:

- **Operasyonel veri:** muze/saray/cami ziyaret saatleri (mevsimsel), gise kapanislari, giris ucretleri, MuzeKart gecerlilik
- **Anlik saha bilgisi:** muze yogunlugu/kuyruk durumu, ulasim arizalari (rayli sistem + IBB Ulasim trafigi), etkinlikler, gemi takvimi
- **Rehberden rehbere iletisim:** canli sohbet, saha guncellemeleri, raporlama/engelleme
- **Yardimcı:** havalimani transferleri (Havaist/Havabus), Bogaz turlari, doviz, namaz vakitleri (musterileri icin), acil durum (112)

### Temel Altyapi
- **Frontend:** React Native + Expo SDK 54 + TypeScript + Expo Router (tab + stack)
- **Backend:** Supabase (Postgres + Auth + Realtime + RLS)
- **Odeme:** RevenueCat (App Store + Play Store, entitlement: `premium`)
- **Email:** Custom SMTP (Resend Pro → AWS SES Dublin → kullanici)
- **Web:** GitHub Pages + custom domain (pusulaistanbul.app)
- **Web scraping:** Firecrawl MCP (havabus, sehirhatlari, millisaraylar)
- **CI/CD:** EAS Build + EAS Submit
- **Yapay zeka destek:** Claude Cowork (kod + mimari + bu dosyalar)

### Su An Hangi Asamadayiz (27 Mayis 2026 - Kurban Bayrami 1. gunu)
**v1.0.14 HER IKI PLATFORMDA YAYINDA** (27 May gece — Apple expedited onayi sabah submit'inden ~12 saat sonra geldi, Google Play onayi ayni gun). Son 20 gunde 107+ yeni rehber kayit + 27 May'da 13 yeni kayit + Asli Cetin organik yillik conversion. **IRO maili 7 May'da yayinlanmadi (Ayse yeniden talep gonderecek)**, bu nedenle tum trafik TAMAMEN ORGANIK (kulaktan kulaga / App Store / sosyal medya). v1.0.13'te react-native-screens 4.16.0 ScreenStack drawing crash bug'i ortaya cikti (Play Console Vitals: **16 onaylanmis kullanici etkilendi**, 12 farkli cihaz markasi = OEM uyumsuzluk degil, kod bug'i). Fix: **react-native-screens 4.16.0 → 4.23.0** (4.24 atlandi - BottomTabs eksik, 4.25+ atlandi - RN 0.82 peer dep). Bkz. DECISIONS #37, ISSUES #82-83.

**27 May (Kurban Bayrami 1. gunu) yapilanlar — sabahtan geceye:**
1. **v1.0.14 hotfix build + submit** her iki platforma (sabah, buildNumber 37 / versionCode 37). Apple Review'a (Manual Release, expedited request) + Google Play DRAFT'a yuklendi.
2. **16 onaysiz kullaniciyi 2 grup halinde manuel onay** (Microsoft/Yahoo spam filtresi magdurlari). 1 olu typo'lu hesap silindi (Timucin .vom).
3. **172 freemium kullaniciya kurban bayrami premium hediyesi** (1 Haziran 2026 00:00'a kadar). Atomic SQL ile abonelik_durumu='aktif'.
4. **`scripts/manuel-onay-bilgilendirme.mjs` yazildi** — 1. grup 7 kisiye bilgilendirme maili gonderildi (Resend Delivered).
5. **`scripts/kurban-bayrami-hediye.mjs` yazildi + 07:00 scheduled task** — 168 kisiye gercek gonderim (DECISIONS #40: external URL logo pattern).
6. **Bugun yeni kayit dalgasi 13 rehber** — IRO mail yayinlanmamis durumda, tamamen organik. Asli Cetin (27 May 10:06 kayit, 4 dk sonra yillik abonelik) tam organik conversion sinyali.
7. **11 yeni kayit kullaniciya bayram hediye + mail** (aksam) — atomic UPDATE + `scripts/yeni-kayit-bayram-hediye.mjs` (hardcode 11 alici, "hos geldin + bayram hediyesi" tonu, %41 indirimli yillik plan tanitimi italic kutuda). 11/11 basarili gonderim.
8. **Bugun trafik artisi olculdu Supabase'den:** 17 giris (dun 4, +325%), 13 yeni kayit (dun 4, +225%), canli durum bildirimi 0→5. Hediye alanlardan sadece 3 giris yapmis — push notification olmadan mail tek basina yeterli farkindalik aracı degil (v1.1.0 plani).
9. **v1.0.14 GECE HER IKI PLATFORMDA YAYINDA** — Apple expedited review onayi sabah submit'inden ~12 saat sonra geldi, Google Play onayi ayni gun. Ayse manuel Release/Yayinla basti. ScreenStack drawing crash kapaklandigi an.
10. **IRO duzeltmesi md'lerde** — STATE.md ve CLAUDE.md'deki "IRO sonrasi" referanslari Ayse'nin duzeltmesi uzerine temizlendi (IRO maili 7 May'da yayinlanmadi, yeniden talep gonderecek).
11. **Atakan Ceyhan hesap silme talebi (gece) — KVKK Madde 11 kapanis maili gonderildi** — ID + email + isim uclu eslesme dogrulandi, iliskili tablolarda (sohbet, canli_durum, yogunluk, rapor, engelleme) hicbir kayit yoktu, temiz silme. Tek atomik SQL: profiles + auth.users DELETE (CTE chain + RETURNING ile dogrulandi). Kullanici 1 May 21:22 kayit / 21:23 son giris (bir dakika sonra cikmis, donmemis) — bugunku 168'lik bayram mail listesinden tetiklenmis olabilir. KVKK Madde 11 kapanis maili `scripts/hesap-silme-onay-atakan.mjs` ile yollandi (sablon: en ust HEDEF blogu config, gelecekteki silme talepleri icin yeniden kullanilabilir). v1.1.0'a yeni 12. madde eklendi: admin panel hesap silme + KVKK mail tek tik butonu (4-5 saatlik is, audit log + onay dialog + service role Edge Function).

**BEKLEYEN (yeni oturum):** (a) Play Console Vitals'i 24-48 saat izle, ScreenStack crash sifirlanmali (DECISIONS #37 dogrulanir), (b) 2. grup 8 onaysiza bilgilendirme maili + manuel-onay-bilgilendirme.mjs'i external URL logo pattern'ine cevir, (c) IRO mail yeniden talep gonderiminden sonra organik baseline ile karsilastir, (d) test-kullanici-mail.html Turkce karakter bug fix (DECISIONS #38), (e) v1.0.14 yayina cikinca Apple ve Google'da release notes ekrani gozden gecir. Detay: STATE.md.

- **App Store:** **v1.0.14 yayinda** (27 May gece — expedited review onayi geldi, manuel release). v1.0.13 onceki yayindi.
- **Google Play:** **v1.0.14 yayinda** (27 May gece — versionCode 37, manuel "Yayinla" basildi). v1.0.13 onceki yayindi.
- **v1.0.13 yeni (yayinda):** Kayit zorunlulugu (oturumsuz kullanim kapali) + Saraylar bedava + Muzeler/Ozel/Camiler premium + Bogaz Turyol bedava + Dentur/Sehir Hatlari/tum saatler premium + Sultanahmet bant detay premium + sozlesme indirme premium. DECISIONS #35.
- **v1.0.12 degisiklikleri (v1.0.13 ile birlikte canliya cikti):** (1) admin moderator atama RLS sessiz red defansif kod (DECISIONS #34), (2) havalimani ulasim guzergah ozelligi (yon-spesifik, admin duzenlenebilir), (3) MuzeKart sekmesinde mekan adina parantez ici istisna notu (Topkapi Harem, Dolmabahce Selamlik).
- **v1.0.11 fix'leri (yayinlanmisti):** use-abonelik.ts NULL profile sistematik bug + UX "Apple ID → Hesabınız" generic metin (DECISIONS #31).
- **Play Store + IAP global aktif:** uygulama 175+ ulkede indirilebilir, IAP fiyatlari yerel para biriminde otomatik dagildi (TR 99,99/699,99 korundu, ABD 1,99/13,99 ortalama).
- **DB veri saglik durumu:** kapali_gun konvensiyonu netlesti (NULL=yok, 0=Paz...6=Cmt), 15 kayit duzeltildi. Galataport gemi takvimi 5 haftadir donmus 204 yanlis kayit silindi, 224 dogru kayit yuklendi (Mayis-Aralik 2026 sezonu). profiles.email schema fix + auth.users sync trigger. Excel-DB tutarliligi %100.
- **6 Apple reject** atlatildi (Demo hesap, IAP Restore, iPad Design, EULA, Subscription Group Localization, Paid Apps Agreement). Hepsinin dersi `DECISIONS.md`'de.
- **Custom SMTP** kuruldu (26 Nis), email akisi calisiyor, 5 markali Turkce template hazir.
- **1 scheduled task** aktif (sehir hatlari iptal seferleri) + 3 devre disi (saraylar + muzeler 1 Mayis 2026'da, havalimani tarife 4 Mayis 2026'da kapatildi — hepsi admin panelden manuel yonetiliyor; havalimani icin sonraki oturumda Excel pipeline kurulacak; bkz. DECISIONS.md #24).
- **1 Edge Function** aktif (`ulasim-senkron`, 6 May 2026'da kuruldu) — pg_cron her 15 dk'da bir tetikler, 4 X hesabini cekip `ulasim_uyarilari` tablosuna yazar. Bkz. INFRASTRUCTURE.md Bolum 13.
- **v1.1.0 planlamasi (12 madde — Sehir Hatlari/Saraylar fiyat scrape silindi, manual Excel pattern'i kazandi):** profil version no dinamiklestir, Android 15 edge-to-edge, push notification altyapisi, **X API client-side cleanup** (server tasima 6 May'da bitti, bundle temizligi kaldi), Galataport gemi takvimi scheduled task (4 May fark edildi), Havalimani+Bogaz Excel pipeline (4 May talep edildi), **in-app guncelleme uyari bandi** (4 May talep edildi), **admin panel hesap silme + KVKK mail tek tik butonu** (27 May Atakan vakasi sonrasi talep edildi — 4-5 saatlik is, audit log + onay dialog), **kritik sohbet mesajlarini ana sayfada one cikarma (pin/bayrak sistemi)** (27 May Huseyin Hizmetci Yerebatan vakasi sonrasi talep edildi — sohbete girmeyen rehbere kritik saha bilgisi gorunsun, push notification ile entegre, ~3-4 saat). Detayli STATE.md'de.

Detayli surum durumu icin: `claude-context/STATE.md`

---

## CLAUDE-CONTEXT KLASORU YAPISI

```
istanbul-rehber/
├── CLAUDE.md                          (BU DOSYA — yalin index, ~2.5k token)
├── CLAUDE.md.eski                     (eski tek dosya, 31k token, yedek)
└── claude-context/
    ├── STATE.md                       (mevcut dinamik durum: surum, deploy, aktif gorevler)
    ├── PROJECT.md                     (statik proje bilgisi: tech, dosya, is mantigi, tasarim)
    ├── CHANGELOG.md                   (surum gecmisi, release notes, eski v1.0.x)
    ├── DECISIONS.md                   (36 mimari karar + ders — SIK BAKILACAK!)
    ├── ISSUES.md                      (bilinen sorunlar, 81 cozulmus bug)
    ├── INFRASTRUCTURE.md              (email, EAS, Apple, Google, RC, DNS, scheduled tasks, edge functions, havalimani pipeline)
    └── SCRIPTS.md                     (kritik scheduled task script'lerinin tam kaynak kodu + SKILL.md prompt'lari)
```

### Dosyalari Guncel Tutma Disiplini
- **Yeni surum cikarinca:** `STATE.md` ve `CHANGELOG.md` guncellenir
- **Yeni mimari karar / kalici ders:** `DECISIONS.md`'ye eklenir
- **Yeni bug fix:** `ISSUES.md`'ye eklenir
- **Yeni servis / DNS / EAS env:** `INFRASTRUCTURE.md` guncellenir
- **Yeni hook / ekran / kategori:** `PROJECT.md` guncellenir
- **Yeni scheduled task script'i (kritik, kampanya/recurring):** `SCRIPTS.md`'ye tam kaynak kod + SKILL.md prompt eklenir; INFRASTRUCTURE.md Bolum 11'e ozet satir eklenir
- **Bu dosya (`CLAUDE.md`):** YALNIZCA "snapshot" + tablo guncellemesi gerekiyorsa

---

## HIZLI KOMUT REFERANSI

### Build & Submit
```bash
eas build --platform all --profile production
eas submit --platform ios --latest
eas submit --platform android --latest
```

### EAS Env (eski `eas secret:*` deprecated)
```bash
eas env:create --name <NAME> --value "..." --environment production --visibility sensitive
eas env:list --environment production
```

### Mevsim Gecisi (Muzeler — 1 Mayis'ta calistirilacak)
```sql
UPDATE mekan_saatleri SET aktif_mevsim = 'yaz', guncelleme_tarihi = NOW()
WHERE mevsimsel = true AND tip NOT IN ('saray', 'kasir');
```

### Demo Hesap Sifre Reset
```sql
UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'aysetokkus@hotmail.com';
```

### Node 20
```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
```

### Development Build
```bash
npx expo start --dev-client
```

---

## TEMEL KIMLIKLER

| Servis | Bilgi |
|--------|-------|
| Apple Team ID | `7UJVL94SMJ` |
| App Store App ID | `6761419678` |
| Bundle/Package | `com.pusulaistanbul.app` |
| Scheme | `pusulaistanbul` |
| Supabase URL | `https://rzlfghjpsximthlolfxo.supabase.co` |
| RC Entitlement | `premium` |
| Demo (premium) | aysetokkus@hotmail.com / 123456 |
| Demo (suresi dolmus) | demo.test@pusulaistanbul.app / 123456 |
| Web | https://pusulaistanbul.app |

Detayli kimlikler, API anahtarlari ve servis konfigurasyonlari `INFRASTRUCTURE.md`'de.

---

## ERISIMLER (Yeni oturumda lazim olabilir)

Asagidaki linklere ihtiyacin olabilir, kullanici tarayicidan acabilir veya sana yapistirabilir:

- Supabase Dashboard: https://supabase.com/dashboard/project/rzlfghjpsximthlolfxo
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- EAS Build: https://expo.dev/accounts/pusula-istanbul-app/projects/pusula-istanbul/builds
- RevenueCat: https://app.revenuecat.com
- Resend: https://resend.com
- GoDaddy DNS: https://dcc.godaddy.com/manage/dns
- Web Sayfasi: https://pusulaistanbul.app
- Scheduled Task Klasoru (Mac): `/Users/aysetokkus/Documents/Claude/Scheduled`
- Firecrawl MCP: Web scraping (Hobby plan, ~3000 kredi/ay)
