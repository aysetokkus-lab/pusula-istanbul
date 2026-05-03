-- Pusula Istanbul - Mekan Saatleri FULL SYNC (Excel = tek dogruluk kaynagi)
-- Kaynak: mekan-saatleri-veri-giris.xlsx
-- Mod: FULL SYNC (bos hucre = NULL, dolu hucre = o deger)
-- 57 UPDATE + 0 INSERT

BEGIN;

-- ═══════════════ UPDATE'ler (full sync) ═══════════════

UPDATE mekan_saatleri SET
  isim = 'Eyüp Sultan Camii',
  tip = 'cami',
  kategori = 'camiler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 5,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = NULL,
  fiyat_yabanci = NULL,
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = NULL,
  site = NULL,
  kaynak = NULL,
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'eyüp_sultan_camii';

UPDATE mekan_saatleri SET
  isim = 'Kariye Camii',
  tip = 'cami',
  kategori = 'camiler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '18:00',
  gise_kapanis = '17:55',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 5,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = NULL,
  fiyat_yabanci = '20 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecmez',
  ozel_not = '🔸 Cami, namaz vakitlerinden 15 dakika önce ziyaretçilere kapatılacak ve namaz süresince kapalı kalacaktır.',
  site = 'https://www.demmuseums.com/tr/kariye-cami-ziyaretci-kurallari',
  kaynak = NULL,
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'kariye';

UPDATE mekan_saatleri SET
  isim = 'Süleymaniye Camii',
  tip = 'cami',
  kategori = 'camiler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '18:00:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = NULL,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = NULL,
  fiyat_yabanci = NULL,
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔸 Cuma günleri saat 12:00''de ziyarete kapanır, namaz sonrası tekrar açılır',
  site = NULL,
  kaynak = NULL,
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'süleymaniye_camii';

UPDATE mekan_saatleri SET
  isim = 'Sultanahmet Camii',
  tip = 'cami',
  kategori = 'camiler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '08:30',
  kapanis = '18:30',
  gise_kapanis = NULL,
  yaz_acilis = '08:30',
  yaz_kapanis = '19:00',
  yaz_gise_kapanis = NULL,
  kis_acilis = '08:30',
  kis_kapanis = '18:00',
  kis_gise_kapanis = NULL,
  kapali_gun = NULL,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = NULL,
  fiyat_yabanci = NULL,
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔹Gün içindeki ziyaret saatleri için ana sayfadaki Sultanahmet Camii sekmesini takip ediniz.
🔸 Cuma günleri saat 14:30''a kadar ziyarete kapalıdır.',
  site = 'https://sultanahmetcami.org/index.php',
  kaynak = NULL,
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sultanahmet_camii';

UPDATE mekan_saatleri SET
  isim = 'Aynalıkavak Kasrı',
  tip = 'kasir',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '80 TL',
  fiyat_yabanci = '280 TL',
  fiyat_indirimli = '50 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Bahçe Bilet Fiyatı: 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/9/Aynalikavak-Kasri',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'aynalıkavak';

UPDATE mekan_saatleri SET
  isim = 'Aynalıkavak Mûsikî Müzesi',
  tip = 'muze',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '18:00:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '-',
  fiyat_yabanci = '-',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/14/aynalikavak-musiki-muzesi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'musiki_muze';

UPDATE mekan_saatleri SET
  isim = 'Beykoz Cam ve Billur Müzesi',
  tip = 'muze',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '150 TL',
  fiyat_yabanci = '400 TL',
  fiyat_indirimli = '75 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/12/beykoz-cam-ve-billur-muzesi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'beykoz_cam';

UPDATE mekan_saatleri SET
  isim = 'Beykoz Mecidiye Kasrı',
  tip = 'kasir',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '120 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '60 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Bahçe Bilet Fiyatı: 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/8/Beykoz-Mecidiye-Pavilions',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'beykoz_mecidiye';

UPDATE mekan_saatleri SET
  isim = 'Beylerbeyi Sarayı',
  tip = 'saray',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = 'Harem kısmında restorasyon çalışmaları devam ediyor.',
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '200 TL',
  fiyat_yabanci = '800 TL',
  fiyat_indirimli = '100 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Harem restorasyon sebebiyle kapalı. 
🔹 Bahçe bilet fiyatı 100 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 İndirimli meslek grupları (Öğretmen, Asker, Polis) Dolmabahçe Sarayı, Yıldız Sarayı, Beylerbeyi Sarayı''nda indirimli biletin %50 fazlasını öder.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/4/beylerbeyi-sarayi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'beylerbeyi';

UPDATE mekan_saatleri SET
  isim = 'Dolmabahçe Saat Müzesi',
  tip = 'muze',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '-',
  fiyat_yabanci = '-',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = NULL,
  site = 'https://millisaraylar.gov.tr/Lokasyon/16/dolmabahce-saat-muzesi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'saat_muzesi';

UPDATE mekan_saatleri SET
  isim = 'Dolmabahçe Sarayı',
  tip = 'saray',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '250 TL',
  fiyat_yabanci = '2000 TL',
  fiyat_indirimli = '150 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Müzekart Selamlık''ta geçmez.
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/3/dolmabahce-sarayi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'dolmabahce';

UPDATE mekan_saatleri SET
  isim = 'Ihlamur Kasrı',
  tip = 'kasir',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '100 TL',
  fiyat_yabanci = '280 TL',
  fiyat_indirimli = '50 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Bahçe bilet fiyatı 60 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/7/Ihlamur-Pavilions',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ihlamur';

UPDATE mekan_saatleri SET
  isim = 'İslam Medeniyetleri Müzesi',
  tip = 'muze',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '17:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = '400 TL',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔹 Yabancı Öğrenci Bilet Fiyatı: 150 TL',
  site = 'https://millisaraylar.gov.tr/Lokasyon/13/islam-medeniyetleri-muzesi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'islam_medeniyetleri';

UPDATE mekan_saatleri SET
  isim = 'Küçüksu Kasrı',
  tip = 'kasir',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '120 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '60 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Küçüksu Kasrı Mesire Alanında Müzekart geçmemektedir. 
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Öğrenci kimlik belgesini ibraz eden 07-25 yaş arasındaki öğrencilere indirimli bilet hizmeti sunulmaktadır.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/6/Kucuksu-Pavilionshttps://millisaraylar.gov.tr/Lokasyon/6/kucuksu-kasri',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'kucuksu';

UPDATE mekan_saatleri SET
  isim = 'Maslak Kasırları',
  tip = 'kasir',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '80 TL',
  fiyat_yabanci = '280 TL',
  fiyat_indirimli = '50 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Bahçe bilet fiyatı 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/10/maslak-kasri',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'maslak';

UPDATE mekan_saatleri SET
  isim = 'Milli Saraylar Resim Müzesi',
  tip = 'saray',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '200 TL',
  fiyat_yabanci = '600 TL',
  fiyat_indirimli = '100 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Bahçe bilet fiyatı 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/11/resim-muzesi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ms_resim';

UPDATE mekan_saatleri SET
  isim = 'Saray Koleksiyonları Müzesi',
  tip = 'muze',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '80 TL',
  fiyat_yabanci = '280 TL',
  fiyat_indirimli = '50 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Bahçe bilet fiyatı 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = NULL,
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'saray_koleksiyonlari';

UPDATE mekan_saatleri SET
  isim = 'Topkapı Sarayı',
  tip = 'saray',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 2,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '2750 TL',
  fiyat_indirimli = '200 TL',
  muzekart = 'gecerli',
  ozel_not = '🔹 Müzekart Haremde ve Aya İrini''de geçmez.
🔹Harem yerli ziyaretçi 300 TL, indirimli 150 TL
🔹Aya İrini yerli ziyaretçi 250 TL, indirimli 100 TL
🔹Okul öğrenci grupları 75 TL
Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yerli öğrenci bireysel ziyaretler de 6-25 yaş arası bilet ücretli olup 100 TL ''dir 
🔹 Öğrenci kimlik belgesini ibraz eden 07-25 yaş arasındaki öğrencilere indirimli bilet hizmeti sunulmaktadır.
 🔹 18-25 yaş (25 yaş dâhil) arası T.C. ve K.K.T.C. vatandaşı öğrenciler için Topkapı Sarayı’nda indirimli bilet geçerlidir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/2/topkapi-sarayi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'topkapi';

UPDATE mekan_saatleri SET
  isim = 'Yıldız Çini ve Porselen Fabrikası',
  tip = 'muze',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '17:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '100 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '50 TL',
  muzekart = 'gecerli',
  ozel_not = NULL,
  site = 'https://millisaraylar.gov.tr/Lokasyon/18/yildiz-cini-ve-porselen-fabrikasi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yildiz_cini';

UPDATE mekan_saatleri SET
  isim = 'Yıldız Sarayı',
  tip = 'saray',
  kategori = 'milli_saraylar',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:30:00',
  gise_kapanis = '17:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 3,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '175 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '60 TL',
  muzekart = 'gecerli',
  ozel_not = '🔸  Müzekart Harem, Hasbahçe ve Küçük Mabeyn''de geçerli değildir.

🔹 Yerli öğrenci bireysel ziyaretler de 6-25 yaş arası bilet ücretli olup 100 TL ''dir 
🔹 Öğrenci kimlik belgesini ibraz eden 07-25 yaş arasındaki öğrencilere indirimli bilet hizmeti sunulmaktadır.
 🔹 18-25 yaş (25 yaş dâhil) arası T.C. ve K.K.T.C. vatandaşı öğrenciler için Topkapı Sarayı’nda indirimli bilet geçerlidir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/5/yildiz-sarayi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yildiz';

UPDATE mekan_saatleri SET
  isim = 'Adam Mickiewicz Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '19:00',
  gise_kapanis = '18:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = 'gecmez',
  ozel_not = '🔹Her gün açık 
🔹 Ücretsiz',
  site = 'https://muze.gov.tr/muze-detay?sectionId=IDM01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'mickiewicz';

UPDATE mekan_saatleri SET
  isim = 'Arkeoloji Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = 'Kısmi restorasyon',
  acilis = '09:00',
  kapanis = '21:00',
  gise_kapanis = '20:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '15 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔸 Müze Klasik Binanın Kuzey Kanadı, Çinili Köşk, Eski Şark Eserleri Bölümü restorasyon ve sergileme çalışmaları sebebiyle ziyarete kapalıdır.

🔹 Sesli Rehberlik Hizmeti Vardır',
  site = 'https://muze.gov.tr/muze-detay?sectionId=IAR01&distId=IAR',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'arkeoloji';

UPDATE mekan_saatleri SET
  isim = 'Ayasofya Tarih ve Deneyim Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '19:00',
  gise_kapanis = '18:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '25 €',
  fiyat_yabanci = '25 €',
  fiyat_indirimli = NULL,
  muzekart = 'indirimli',
  ozel_not = '🔹 Yetişkin Ziyaretçiler 8 Yaş Üstü Tüm T.C. Vatandaşları: Giriş ücreti 25 Euro''dur. 
🔹 T.C. vatandaşları için ücret, ziyaret günündeki döviz kuru üzerinden Türk Lirası olarak tahsil edilir. 
🔹 Müzekart sahibi T.C. vatandaşlarına %50 indirim uygulanır.',
  site = 'https://muze.gov.tr/muze-detay?sectionId=YSM01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ayasofya';

UPDATE mekan_saatleri SET
  isim = 'Büyük Saray Mozaikleri Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = TRUE,
  restorasyon_notu = '🔸 Restorasyon sebebiyle kapalı.',
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '17:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = NULL,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '10 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔸 Restorasyon Sebebiyle Kapalı',
  site = 'https://muze.gov.tr/muze-detay?sectionId=MOZ01&distId=MOZ',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'buyuk_saray_mozaikleri';

UPDATE mekan_saatleri SET
  isim = 'Deniz Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '16:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = '10:00',
  haftasonu_kapanis = '18:00',
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '400 TL',
  fiyat_yabanci = '400 TL',
  fiyat_indirimli = NULL,
  muzekart = 'gecmez',
  ozel_not = '🔹 Deniz Kuvvetleri Komutanlığı bünyesindedir. 
🔸 Pazartesi ve salı günleri kapalı.',
  site = 'https://denizmuzeleri.dzkk.tsk.tr/v1/besiktas-deniz-muzesi-komutanligi',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'deniz';

UPDATE mekan_saatleri SET
  isim = 'Dijital Deneyim Merkezi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:45',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '330 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '90 TL',
  muzekart = 'gecmez',
  ozel_not = '🔸 Pazartesi günleri kapalı. 

🔸 VR: Hamileler, epilepsi, 8↓ ve 70↑ yaş uygun değil.',
  site = 'https://www.dijitaldeneyimmerkezi.com/Home/Index',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'dijital';

UPDATE mekan_saatleri SET
  isim = 'Galata Kulesi',
  tip = 'kule',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '08:30',
  kapanis = '18:30',
  gise_kapanis = '18:15',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '30 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔹 MüzeKart sahibi Türk vatandaşları 200 TL karşılığında Gece Müzeciliği bileti alarak giriş yapabilirler.

🔹 Sesli Rehberlik Hizmeti Vardır

🔹 Gece Müzeciliği

- Açılış Saati: 18:30
- Kapanış Saati: 23:00
- Gişe Kapanış Saati: 22:00',
  site = 'https://muze.gov.tr/muze-detay?sectionId=GLT04&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'galata_kulesi';

UPDATE mekan_saatleri SET
  isim = 'Galata Mevlevihanesi Ve Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '19:00',
  gise_kapanis = '18:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '7 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔸 Pazartesi günü kapalı',
  site = 'https://muze.gov.tr/muze-detay?sectionId=GLT01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'mevlevihane';

UPDATE mekan_saatleri SET
  isim = 'Hafıza 15 Temmuz Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '18:30',
  gise_kapanis = '18:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔸 Pazartesi günü kapalı',
  site = 'https://muze.gov.tr/muze-detay?sectionId=HFZ01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'hafiza_15temmuz';

UPDATE mekan_saatleri SET
  isim = 'Harbiye Askeri Müze ve Kültür Sitesi Komutanlığı',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '16:30',
  gise_kapanis = '16:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = NULL,
  fiyat_yabanci = NULL,
  fiyat_indirimli = NULL,
  muzekart = 'gecmez',
  ozel_not = '🔹 Dini bayramların ilk günü kapalıdır, resmî bayramlarda açıktır.

🔹 Mehter konserleri salı ve perşembe günleri saat 15.00''te icra edilmektedir.

🔹 Mehter konserleri ücretsizdir.',
  site = 'https://askerimuze.msb.gov.tr/iletisim.html',
  kaynak = 'askerimuze.msb.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'askeri';

UPDATE mekan_saatleri SET
  isim = 'İslam Bilim ve Teknoloji Tarihi Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '18:00',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '10 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔹 Her gün açık',
  site = 'https://muze.gov.tr/muze-detay?sectionId=IBT01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'islam_bilim';

UPDATE mekan_saatleri SET
  isim = 'İstanbul Havalimanı Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '08:30',
  kapanis = '23:00',
  gise_kapanis = '22:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '13 €',
  fiyat_yabanci = '13 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecmez',
  ozel_not = NULL,
  site = 'https://muze.gov.tr/muze-detay?sectionId=IHM01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'havalimani_muze';

UPDATE mekan_saatleri SET
  isim = 'Kız Kulesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '21:00',
  gise_kapanis = '20:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '35 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔹 Müzekart geçerli + 110 TL ulaşım.

🛥️ Kız Kulesi Tekne Ziyareti

Kız Kulesi tekne ziyareti hem Karaköy (Ziraat Bankası önündeki iskele) hem de Salacak (Harem) sahilden yapılmaktadır.

📍 Salacak İskele: Salacak Mah. Harem Sahil Yolu Cd. No:26/1, Üsküdar/İstanbul

📍 Karaköy İskele: Kemankeş Karamustafa Paşa Mah. Rıhtım Cd. Beyoğlu/Karaköy

⚠️ Vapur saatlerinde hava koşullarına bağlı olarak değişiklik yapılabilir.

Salacak (Harem) Seferleri

⏰ Salacak → Kız Kulesi	Kız Kulesi → Salacak

09:30	10:40
10:30	11:40
11:30	12:40
12:30	13:10
13:00	13:40
13:30	14:10
14:00	14:40
14:30	15:10
15:00	15:40
15:30	16:10
16:00	16:40
16:30	17:10
17:00	17:45


Karaköy Seferleri

⏰ Karaköy → Kız Kulesi	Kız Kulesi → Karaköy
09:30	10:30
11:00	12:00
12:30	13:30
14:00	15:00
15:30	16:30
17:00	17:50',
  site = 'https://muze.gov.tr/muze-detay?sectionId=KZK02&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'kiz_kulesi';

UPDATE mekan_saatleri SET
  isim = 'Mehmet Akif Ersoy Hatıra Evi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '19:00',
  gise_kapanis = '18:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔹 Her gün açık
🔹 Ücretsiz',
  site = 'https://muze.gov.tr/muze-detay?sectionId=MAE01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'mehmet_akif';

UPDATE mekan_saatleri SET
  isim = 'Miniatürk',
  tip = 'acik_hava',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '330 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '90 TL',
  muzekart = 'gecmez',
  ozel_not = '🔸 Pazartesi günü kapalı 

🔹 Miniatürk bilet gişesinde kredi/banka kartı ve İstanbulkart ile ödeme kabul edilmektedir. Nakit geçerli değildir. Döviz kabul edilmez.
🔸 Müze Kart geçmez.
🔸 Giriş bileti sadece alındığı gün için geçerlidir.
🔸 Satılan biletin iadesi yoktur.
🔸 Müzeden çıktıktan sonra aynı biletle ücretsiz ikinci bir giriş yapılmaz.
🔸 Müze gişeleri, bilet kioskları ve Passo online bilet satış kanalları dışındaki herhangi bir bilet satış kaynağından alınan biletlerden Kültür AŞ sorumlu değildir. Yetkisiz bilet satıcılarından bilet satın almaktan kaçınınız.
🔸 Toplu bilet alımlarında e-fatura talebi için işlem öncesinde gişeye bilgi verilmesi zorunludur. Satış sonrası e-fatura düzenlenemez.
E-fatura düzenlenebilmesi için tüzel kişilerde firma unvanı, vergi dairesi ve vergi kimlik numarası; bireysel alımlarda ad-soyad ve T.C. kimlik numarası gişeye bildirilmelidir.
🔹 Aile beraberinde gelen 5 yaş ve altındaki çocuklar ücretsizdir.
🔹 Anaokulu ve kreş kapsamında gerçekleştirilen grup ziyaretlerinde 5 yaş ve altındaki çocuklar ücrete tabidir.
🔹 Engelli kartı sahipleri ve yanlarında birinci derece yakını olan 1 refakatçi ücretsizdir.
🔹 T.C. ve K.K.T.C. vatandaşı 65 yaş ve üzeri ziyaretçiler ücretsizdir.
🔹 T.C. ve K.K.T.C. vatandaşı şehit ve gaziler ve birinci derece yakınları ücretsizdir.
🔹 Ücretsiz kategorideki biletler yalnızca Miniatürk gişesinden alınabilir.
🔹 Tüm indirimli ve ücretsiz girişlerde kimlik ibrazı zorunludur.
🔸 Gruplara refakat eden öğretmenlerin öğrencilerin yanından ayrılmaması zorunludur.
🔸 Müzeye çantalı veya çantasız evcil hayvanlarla girmek yasaktır.
🔸 Adli ve genel kolluk kuvvetleri hariç ateşli silahlarla giriş yasaktır.
🔸 Maketlere dokunmak yasaktır.
🔸 Tripod ve profesyonel çekimler izne tabidir.
🔹 Bebek alt değiştirme ünitesi, iniş rampasının sağ tarafındaki kadın WC’nin yanında, çocuk parkının karşısında yer almaktadır.
🔹 Engelli ziyaretçiler için engelli WC ve engelli park yeri bulunmaktadır.

🔹 Tekerlekli sandalyeler girişte ücretsiz olarak temin edilebilir.',
  site = 'https://www.miniaturk.com.tr/Home/Index',
  kaynak = 'miniaturk.com.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'miniaturk';

UPDATE mekan_saatleri SET
  isim = 'Panorama 1453',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '08:30',
  kapanis = '16:30',
  gise_kapanis = '16:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '330 TL',
  fiyat_yabanci = '330 TL',
  fiyat_indirimli = '90 TL',
  muzekart = 'gecmez',
  ozel_not = '🔸 Pazartesi günü kapalı
🔸 Bebek arabası ile girilmez
🔸 Yalnızca kredi/banka kartı ve İstanbulkart ile ödeme yapılır',
  site = 'https://www.panoramikmuze.com/',
  kaynak = 'panoramikmuze.com',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'panorama';

UPDATE mekan_saatleri SET
  isim = 'Rumeli Hisarı',
  tip = 'hisar',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '19:00',
  gise_kapanis = '18:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '6 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = '🔸 Pazartesi günü kapalı',
  site = NULL,
  kaynak = 'muze.gov.tr + firecrawl scrape (15 Nisan 2026)',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'rumeli';

UPDATE mekan_saatleri SET
  isim = 'Şerefiye Sarnıcı',
  tip = 'sarnic',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '900 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '90 TL',
  muzekart = 'gecmez',
  ozel_not = '🔸 yalnızca kredi/banka kartı ve İstanbulkart ile ödeme yapılır.

🔸Toplu bilet alımlarında e-fatura talebinde bulunanların işlem öncesi gişeye bilgi vermesi gerekmektedir. Bilet satışı sonrası geriye dönük işlem yapılamamaktadır. E-fatura oluşturulabilmesi için ise tüzel kişiler için firma ünvanı, vergi dairesi, vergi kimlik numarası; bireysel alımlarda ise ad-soyad ve T.C. kimlik numarası gişeye bildirilmelidir.',
  site = 'https://www.serefiyesarnici.istanbul/Home/Index',
  kaynak = 'istanbulinsider',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'serefiye';

UPDATE mekan_saatleri SET
  isim = 'Sinema Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '11:00',
  kapanis = '19:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '300 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '200 TL',
  muzekart = 'gecmez',
  ozel_not = '🔸 Pazartesi günü kapalı
🔹 Çarşamba halk günü biletler 140 TL
🔹 7 yaş altı ücretsiz
🔹 Engelli ziyaretçiler ücretsiz',
  site = NULL,
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sinema_muze';

UPDATE mekan_saatleri SET
  isim = 'Tekfur Sarayı',
  tip = 'saray',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '16:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '160 TL',
  fiyat_yabanci = '570 TL',
  fiyat_indirimli = '65 TL',
  muzekart = 'gecmez',
  ozel_not = '🔸 Pazartesi günü kapalı 
🔸 Nakit geçmez.
🔹 65 yaş üstü ve 10 yaş altı ücretsiz.',
  site = 'https://ataturkkitapligi.ibb.gov.tr/tr/Kitaplik/Muzelerimiz/Tekfur-Sarayi/10',
  kaynak = NULL,
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'tekfur';

UPDATE mekan_saatleri SET
  isim = 'Türbeler Müzesi',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = FALSE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '17:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = NULL,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = NULL,
  site = NULL,
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'turbeler';

UPDATE mekan_saatleri SET
  isim = 'Türk & İslam Eserleri',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '21:00:00',
  gise_kapanis = '20:00:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Müzekart',
  fiyat_yabanci = '17 €',
  fiyat_indirimli = NULL,
  muzekart = 'gecerli',
  ozel_not = NULL,
  site = 'https://muze.gov.tr/muze-detay?sectionId=EIE01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'tiem';

UPDATE mekan_saatleri SET
  isim = 'Yedikule Hisarı',
  tip = 'hisar',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00',
  gise_kapanis = '16:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '50 TL',
  fiyat_yabanci = '400 TL',
  fiyat_indirimli = '20 TL',
  muzekart = 'gecmez',
  ozel_not = NULL,
  site = 'https://www.yedikulehisari.com/ziyaretci-bilgileri/',
  kaynak = 'www.fatih.bel.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yedikule';

UPDATE mekan_saatleri SET
  isim = 'Yerebatan Sarnıcı',
  tip = 'sarnic',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '18:30',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '1950 TL',
  fiyat_indirimli = '90 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 09.00-18.30 saatleri arasında ücretlendirme

Yerli Ziyaretçi: 450 TL

Yabancı Ziyaretçi: 1.950 TL

Öğrenci: 90 TL

Audio Guide: 300 TL

Sesli Rehber(Yerli) 100 TL

Ticket + Audio Guide : 2.150 TL

🔹 19.30-22.00 saatleri arasında ücretlendirme

Yerli Ziyaretçi: 750 TL

Yabancı Ziyaretçi: 3.000 TL

Öğrenci: 400 TL

Audio Guide: 300 TL

Sesli Rehber(Yerli): 100 TL

🔹 09.00-18.30 saatleri arasındaki ziyaretleriniz için biletlerinizi hem gişelerimizden hem de Passo üzerinden online satın alabilirsiniz.

🔹 Hızlı, güvenli ve pratik bir ziyaret deneyimi için 1 Ağustos 2025 itibarıyla müze girişlerinde yalnızca kredi/banka kartı ve İstanbulkart ile ödeme kabul edilecektir.

🔹 19.30-22.00 saatleri arasında gerçekleştirmek istediğiniz ziyaretler için biletinizi saat 19.30 itibarıyla yalnızca Yerebatan Sarnıcı gişesinden temin edebilirsiniz.

🔹 Müze gişelerimiz ve Passo online bilet satış kanallarının dışındaki herhangi bir bilet satış kaynağından alınan biletlerden Kültür AŞ sorumlu değildir. Lütfen yetkilendirilmemiş bilet satıcılarından bilet satın almaktan kaçının.

🔹 Online indirimli bilet alanların girişte kimlik göstermesi zorunludur.

🔹 Satın alınan biletler aynı gün içerisinde bir kez giriş hakkına sahiptir. Bilet iadesi yapılmamaktadır.

🔹 Toplu bilet alımlarında e-fatura talebinde bulunanların işlem öncesi gişeye bilgi vermesi gerekmektedir. Bilet satışı sonrası geriye dönük işlem yapılamamaktadır. E-fatura oluşturulabilmesi için ise tüzel kişiler için firma ünvanı, vergi dairesi, vergi kimlik numarası; bireysel alımlarda ise ad-soyad ve T.C. kimlik numarası gişeye bildirilmelidir.

🔹 65 yaş üstü T.C. vatandaşları ve gazi/şehit ve 1. derece yakınları ile Engelli Kartı sahipleri kimlik ibrazıyla 09.00-18.30 saatleri arasında müzemizi ücretsiz ziyaret edebilmektedir. Bu gruptaki ziyaretçilerimiz için saat 19.30’dan sonraki girişler ücrete tabidir.

🔹 Yerebatan Sarnıcı’nda Night Shift kapsamında 7 yaş altı çocuklar ve kokartlı rehberler ücretsizdir.

🔹 Bedensel ve görme engelliler ile engelli çocuklar ve engel oranı %70 ve üzeri olan ziyaretçilerimize iştirak edenler ve refakatçi kimliği olanlara 09.00-18.30 saatleri arasındaki girişler ücretsizdir.

🔹 Öğretmen, polis ve askerler kimlik; öğrenciler ise aktif öğrenci belgesi ibraz etmek koşuluyla indirimli biletten yararlanabilmektedir. Türkiye Cumhuriyeti kimlik kartı veya oturum izni ibraz edilmesi zorunludur.

🔹 Herhangi bir tahribatla bütünlüğü bozulan ya da üzerinde değişiklik yapılan biletler geçersizdir.

🔹 Kurumumuz Kültür Bakanlığı’na bağlı olmadığı için Müze Kart geçmez.',
  site = 'https://yerebatan.com/yerebatan/ziyaret-bilgileri/',
  kaynak = 'yerebatan.com',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yerebatan';

UPDATE mekan_saatleri SET
  isim = 'Aşiyan Müzesi (Tevfik Fikret)',
  tip = 'muze',
  kategori = 'muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:00',
  kapanis = '17:00:00',
  gise_kapanis = '16:30:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '160 TL',
  fiyat_yabanci = '570 TL',
  fiyat_indirimli = '65 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 Bilet ücretlerinde kredi kartı ve banka kartları geçerlidir. Diğer tahsilat yöntemleri kullanılamamaktadır.

🔹 65 yaş üstü ile 10 yaş altı ziyaretçilere ücretsizdir.',
  site = 'https://ataturkkitapligi.ibb.gov.tr/tr/Kitaplik/Muzelerimiz/Asiyan-Muzesi/1',
  kaynak = 'ataturkkitapligi.ibb.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'asiyan';

UPDATE mekan_saatleri SET
  isim = 'Çamlıca Kulesi',
  tip = 'kule',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '22:00',
  gise_kapanis = '17:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = NULL,
  fiyat_yabanci = NULL,
  fiyat_indirimli = NULL,
  muzekart = 'gecmez',
  ozel_not = '🔹 Ücretler için mutlaka arayın',
  site = 'https://camlicakule.istanbul/',
  kaynak = 'https://camlicakule.istanbul/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'camlica_kulesi';

UPDATE mekan_saatleri SET
  isim = 'İRHM (MSGSÜ)',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '17:00:00',
  gise_kapanis = '16:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '200 TL',
  fiyat_yabanci = '550 TL',
  fiyat_indirimli = '100 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 Salı 20:00''a kadar açık.

🔹 Ücretsiz: 0-18 yaş arası çocuklar / 65 yaş ve üstü Türkiye Cumhuriyeti vatandaşları / Gaziler, şehit ve gazilerin eş ve çocukları / Engelliler ile bir refakatçisi / Öğretmenler / Er ve erbaşlar / AICA, ICOM, ICOMOS ve UNESCO kartı ile Basın kimlik kartı sahipleri.

🔹 Salı günleri 16:00- 20:00 saatleri arasında tüm öğrencilere ücretsizdir. 

🔹 İndirimli Bilet:
100 TL (18 yaş üstü öğrenciler )

🔹 Bayramların birinci günleri ve yılın ilk günü (1 Ocak) kapalıdır.

🔹 Grup indirimi:
%20 (tek seferde 10 bilet ve üstü)',
  site = 'https://irhm.msgsu.edu.tr/',
  kaynak = 'https://irhm.msgsu.edu.tr/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'irhm';

UPDATE mekan_saatleri SET
  isim = 'İstanbul Akvaryum',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = FALSE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '19:00',
  gise_kapanis = '17:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '1250 TL',
  fiyat_yabanci = '1250 TL',
  fiyat_indirimli = '1100 TL',
  muzekart = 'gecmez',
  ozel_not = '2 yaş altı ücretsiz. Şenlikköy Mah, Yeşilköy Halkalı Cad, Florya.',
  site = NULL,
  kaynak = 'istanbulakvaryum.com',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'akvaryum';

UPDATE mekan_saatleri SET
  isim = 'İstanbul Modern',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '550 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '320 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 YERLİ

Tam: 550 TL
İndirimli (Öğrenci, Öğretmen, 65 Yaş Üstündekiler): 320 TL
Gruplar (10 kişi ve üzeri): 320 TL

🔹 Uluslararası ziyaretçiler
Tam: 900 TL
İndirimli (Öğrenci ve 65 Yaş Üstündekiler): 550 TL
Gruplar (10 kişi ve üzeri): 550 TL
İstanbul Modern Sinema: 320 TL 

🔸 İstanbul Modern Üyeleri, Engelli Ziyaretçiler, 12 Yaşından Küçük Çocuklar, ICOM, CIMAM, MMKD Kart Sahipleri: Ücretsiz
İndirimli giriş için (Öğrenci, Öğretmen ve 65 Yaş Üstündekiler) ilgili kimlik kartının gişede ibraz edilmesi gereklidir.',
  site = 'https://www.istanbulmodern.org/',
  kaynak = 'istanbulmodern.org',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ist_modern';

UPDATE mekan_saatleri SET
  isim = 'Masumiyet Müzesi',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '375 TL',
  fiyat_yabanci = '750 TL',
  fiyat_indirimli = '175 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 Sesli Rehber Hizmeti: 50 TL

​🔹 İndirimli Bilet tarifesi sadece ; Öğretmenler, öğrenciler ve 65 yaş üstü ziyaretçiler için geçerlidir.

🔹 Ücretsiz Giriş Hakkı Olanlar: 

- 12 yaş altı çocuklar
- ICOM kart sahipleri
- Profesyonel tur rehberleri
- Engelli bireyler
- Basın Mensupları',
  site = 'https://www.masumiyetmuzesi.org/zi-yaret-g%C3%BCn-ve-saatleri',
  kaynak = 'masumiyetmuzesi.org',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'masumiyet';

UPDATE mekan_saatleri SET
  isim = 'Pera Müzesi',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '19:00',
  gise_kapanis = '18:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '300 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '150 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 Salı - Cumartesi  10.00-19.00
Cuma 10.00 - 22.00
Pazar 12.00-18.00

🔹 İndirimli: 150 TL
(12 yaş üstü öğrenciler, öğretmenler, 60 yaş ve üstü)
Grup: 200 TL (tek seferde 10 bilet ve üstü)

🔹 Ücretsiz: Pera Müzesi Dostları, gaziler, şehit ve gazilerin eşleri ve çocukları, engelliler ve her engelliye refakat eden bir kişi, 12 yaş ve altı çocuklar, ICOM kart sahipleri, MMKD üyeleri ve basın mensupları, çarşamba günleri öğrenciler, cuma günleri saat 18.00''dan sonra herkes Pera Müzesi’ni ücretsiz ziyaret edebilir.

🔹 Uzun Cuma
Pera Müzesi her cuma 18.00-22.00 saatleri arasında ücretsiz olarak ziyaret edilebilir.

🔹 Genç Çarşamba
Pera Müzesi ziyareti ve Pera Film gösterimleri çarşamba günleri tüm öğrencilere ücretsiz.',
  site = 'https://www.peramuzesi.org.tr/ziyaret',
  kaynak = 'peramuzesi.org.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'pera';

UPDATE mekan_saatleri SET
  isim = 'Rahmi Koç Müzesi',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '09:30',
  kapanis = '17:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = '10:00',
  haftasonu_kapanis = '19:00:00',
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '500 TL',
  fiyat_yabanci = '950 TL',
  fiyat_indirimli = '200 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 200 TL On öğrenci ve üzeri toplu ödemelerde geçerlidir.

🔹 Yabancı öğrenci 450 TL

🔹 Tekne turu: 150 TL / Öğrenci 100 TL
(Hava koşullarına bağlı olarak yapılmaktadır)

🔹 Dini Bayramların arife ve birinci günü ile her yıl 31 Aralık ve 1 Ocak günleri müze kapalıdır.',
  site = 'https://www.rmk-museum.org.tr/istanbul/ziyaret-plani/saatler-ve-ucretler',
  kaynak = 'www.rmk-museum.org.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'rahmi_koc';

UPDATE mekan_saatleri SET
  isim = 'Sabancı Müzesi',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '330 TL',
  fiyat_indirimli = '330 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 İndirimli: 330₺
18 yaş üzeri öğrenciler, öğretmenler, 65 yaş ve üstü ziyaretçiler, SSM üyelerine eşlik eden bir misafir, Sabancı Topluluğu çalışanları ve beraberinde eşlik eden bir misafir, (Afyon Çimento, Agesa, Ak Portföy, Akbank, Akbank AG, Ak Yatırım, Akbank Ventures BV, Akçansa, AkLesae, Aköde, Ak Sigorta, Arvento, Brisa, Bulutistan, Carrefoursa, Çimsa, Çimsa Building Solution, Enerjisa Enerji, Enerjisa Üretim, E-Şarj, Hacı Ömer Sabancı Holding, Kordsa, Mannok Holding, Medisa, Sabancı İklim Teknolojileri, Sabancı Vakfı, Sabancı DX, Sabancı DX BV, Sem, Stablex, Teknosa, Temsa Motorlu Araçlar, Temsa Ulaşım, Tursa) ile Sabancı Üniversitesi çalışanlarına eşlik eden bir misafir için geçerlidir. Kimlik gösterilmesi gerekmektedir.

🔹 Öğrenci: 225₺
12-18 yaş arası öğrenciler için geçerlidir, kimlik gösterilmesi gerekmektedir.

🔹 Ücretsiz: Salı girişleri, SSM Dost Kart sahipleri, 12 yaş ve altı çocuklar, engelli bireyler ve beraberlerinde bir refakatçi, Sabancı Üniversitesi akademik ve idari personeli, Sabancı Üniversitesi öğrencileri, ICOM kart sahipleri, MMKD üyeleri ve basın mensupları',
  site = 'https://www.sakipsabancimuzesi.org/',
  kaynak = 'sakipsabancimuzesi.org',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sabanci';

UPDATE mekan_saatleri SET
  isim = 'Sadberk Hanım Müzesi',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '17:00',
  gise_kapanis = '16:30',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 3,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '100 TL',
  fiyat_indirimli = '300 TL',
  muzekart = 'gecmez',
  ozel_not = '🔹 Kapalı Günler:
Çarşamba günleri
1 Ocak
Dini bayramların birinci günü

🔹 Yetişkin Ziyaretçi:
450 TL

🔹 İndirimli Bilet:
300 TL (Müzekart+ ve Museum Pass sahipleri)

🔹 Öğrenci Bileti:
100 TL',
  site = 'https://www.sadberkhanimmuzesi.org.tr/tr',
  kaynak = 'sadberkhanimmuzesi.org.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sadberk';

UPDATE mekan_saatleri SET
  isim = 'Salt Galata / Beyoğlu',
  tip = 'kultur_merkezi',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '11:00',
  kapanis = '19:00',
  gise_kapanis = '19:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔹 Salı-Cumartesi 11.00-19.00

🔹 Pazar 11.00-18.00

🔹 Ramazan ve Kurban bayramlarının birinci ve ikinci günleriyle, 1 Ocak ve 1 Mayıs günleri kapalıdır.

🔹 Giriş ücretsiz.',
  site = 'https://saltonline.org/',
  kaynak = 'saltonline.org',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'salt';

UPDATE mekan_saatleri SET
  isim = 'Santralistanbul Enerji Müzesi',
  tip = 'muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '08:30',
  kapanis = '17:00',
  gise_kapanis = NULL,
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 0,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔹 Enerji Müzesi, resmi tatiller ve 1 Ocak’ta ziyarete kapalıdır.

🔹 Müzemiz, tüm ziyaretçiler için ücretsizdir.

🔹 Rehberli tur ücretleri aşağıdaki gibidir:

- Üniversite öğrencileri: 150₺

- Yetişkinler: 200₺

- Gruplar (10 kişi ve üzeri): 150₺ (kişi başı)',
  site = 'https://enerjimuzesi.bilgi.edu.tr/tr/iletisim/',
  kaynak = 'santralistanbul.org',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'santral';

UPDATE mekan_saatleri SET
  isim = 'Türkiye İş Bankası Müzesi',
  tip = 'ozel_muze',
  kategori = 'ozel_muzeler',
  aktif = TRUE,
  mevsimsel = FALSE,
  restorasyon = FALSE,
  restorasyon_notu = NULL,
  acilis = '10:00',
  kapanis = '18:00',
  gise_kapanis = '17:45:00',
  yaz_acilis = NULL,
  yaz_kapanis = NULL,
  yaz_gise_kapanis = NULL,
  kis_acilis = NULL,
  kis_kapanis = NULL,
  kis_gise_kapanis = NULL,
  kapali_gun = 1,
  haftasonu_acilis = NULL,
  haftasonu_kapanis = NULL,
  cuma_kapali_bas = NULL,
  cuma_kapali_bit = NULL,
  fiyat_yerli = 'Ücretsiz',
  fiyat_yabanci = 'Ücretsiz',
  fiyat_indirimli = NULL,
  muzekart = NULL,
  ozel_not = '🔹 Müzemiz 1 Ocak, 1 Mayıs, Ramazan ve Kurban bayramlarının ilk günü ile Pazartesi günleri kapalıdır.',
  site = 'https://issanat.com.tr/turkiye-is-bankasi-muzesi/',
  kaynak = 'https://issanat.com.tr/turkiye-is-bankasi-muzesi/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'is_bankasi_muze';

COMMIT;
