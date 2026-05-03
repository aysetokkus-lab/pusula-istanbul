-- Pusula Istanbul - Mekan Saatleri Toplu Guncelleme
-- Kaynak: mekan-saatleri-veri-giris.xlsx
-- Olusturulma: $(date)
-- 55 UPDATE + 0 INSERT

BEGIN;

-- ═══════════════ UPDATE'ler ═══════════════

UPDATE mekan_saatleri SET
  fiyat_yabanci = '20',
  ozel_not = '🔸 Cami, namaz vakitlerinden 15 dakika önce ziyaretçilere kapatılacak ve namaz süresince kapalı kalacaktır.',
  site = 'https://www.demmuseums.com/tr/kariye-cami-ziyaretci-kurallari',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'kariye';

UPDATE mekan_saatleri SET
  kapanis = '18:00:00',
  ozel_not = '🔸 Cuma günleri saat 12:00''de ziyarete kapanır, namaz sonrası tekrar açılır',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'süleymaniye_camii';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  ozel_not = '🔹Gün içindeki ziyaret saatleri için ana sayfadaki Sultanahmet Camii sekmesini takip ediniz.
🔸 Cuma günleri saat 14:30''a kadar ziyarete kapalıdır.',
  site = 'https://sultanahmetcami.org/index.php',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sultanahmet_camii';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  kapanis = '17:00:00',
  ozel_not = '🔹 Bahçe Bilet Fiyatı: 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/9/Aynalikavak-Kasri',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'aynalıkavak';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  kapanis = '18:00:00',
  ozel_not = '🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/14/aynalikavak-musiki-muzesi',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'musiki_muze';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  fiyat_indirimli = '75 TL',
  ozel_not = '🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/12/beykoz-cam-ve-billur-muzesi',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'beykoz_cam';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  ozel_not = '🔹 Bahçe Bilet Fiyatı: 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'beykoz_mecidiye';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  ozel_not = '🔹 Harem restorasyon sebebiyle kapalı. 
🔹 Bahçe bilet fiyatı 100 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 İndirimli meslek grupları (Öğretmen, Asker, Polis) Dolmabahçe Sarayı, Yıldız Sarayı, Beylerbeyi Sarayı''nda indirimli biletin %50 fazlasını öder.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/4/beylerbeyi-sarayi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'beylerbeyi';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  kapanis = '17:00:00',
  site = 'https://millisaraylar.gov.tr/Lokasyon/16/dolmabahce-saat-muzesi',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'saat_muzesi';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  ozel_not = '🔹 Müzekart Selamlık''ta geçmez.
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/3/dolmabahce-sarayi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'dolmabahce';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  ozel_not = '🔹 Bahçe bilet fiyatı 60 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ihlamur';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  fiyat_yerli = 'Ücretsiz',
  ozel_not = '🔹 Yabancı Öğrenci Bilet Fiyatı: 150 TL',
  site = 'https://millisaraylar.gov.tr/Lokasyon/13/islam-medeniyetleri-muzesi',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'islam_medeniyetleri';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  ozel_not = '🔹 Küçüksu Kasrı Mesire Alanında Müzekart geçmemektedir. 
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Öğrenci kimlik belgesini ibraz eden 07-25 yaş arasındaki öğrencilere indirimli bilet hizmeti sunulmaktadır.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/6/Kucuksu-Pavilionshttps://millisaraylar.gov.tr/Lokasyon/6/kucuksu-kasri',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'kucuksu';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  ozel_not = '🔹 Bahçe bilet fiyatı 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/10/maslak-kasri',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'maslak';

UPDATE mekan_saatleri SET
  gise_kapanis = '17:30:00',
  ozel_not = '🔹 Bahçe bilet fiyatı 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  site = 'https://millisaraylar.gov.tr/Lokasyon/11/resim-muzesi',
  kaynak = 'millisaraylar.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ms_resim';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
  fiyat_indirimli = '50 TL',
  ozel_not = '🔹 Bahçe bilet fiyatı 50 TL
🔹 Yerli/yabancı 0-6 yaş arası bütün ziyaretçiler için saray, köşk, kasır, müze ve tarihi fabrikalar ücretsizdir.
🔹 Yabancı öğrenciler, indirimli biletin 2 katı ücretle gezerler.
🔹 12-25 yaş arası yabancı öğrencilerden Uluslararası Öğrenci Kimlik Kartını (ISIC: International Student Identity Card) fiziki olarak ibraz edilmesi talep edilir.',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'saray_koleksiyonlari';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
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
  mevsimsel = FALSE,
  fiyat_indirimli = '50 TL',
  site = 'https://millisaraylar.gov.tr/Lokasyon/18/yildiz-cini-ve-porselen-fabrikasi',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yildiz_cini';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  gise_kapanis = '17:30:00',
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
  kapali_gun = 0,
  site = 'https://muze.gov.tr/muze-detay?sectionId=IDM01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'mickiewicz';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yabanci = '15',
  site = 'https://muze.gov.tr/muze-detay?sectionId=IAR01&distId=IAR',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'arkeoloji';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yerli = '25',
  fiyat_yabanci = '25',
  site = 'https://muze.gov.tr/muze-detay?sectionId=YSM01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ayasofya';

UPDATE mekan_saatleri SET
  fiyat_yabanci = '10',
  ozel_not = '🔸 Restorasyon Sebebiyle Kapalı',
  site = 'https://muze.gov.tr/muze-detay?sectionId=MOZ01&distId=MOZ',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'buyuk_saray_mozaikleri';

UPDATE mekan_saatleri SET
  fiyat_yerli = '400 TL',
  fiyat_yabanci = '400 TL',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'deniz';

UPDATE mekan_saatleri SET
  fiyat_yerli = '330 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '90 TL',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'dijital';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yabanci = '30',
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
  fiyat_yabanci = '7',
  site = 'https://muze.gov.tr/muze-detay?sectionId=GLT01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'mevlevihane';

UPDATE mekan_saatleri SET
  kapali_gun = 1,
  site = 'https://muze.gov.tr/muze-detay?sectionId=HFZ01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'hafiza_15temmuz';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yabanci = '10',
  site = 'https://muze.gov.tr/muze-detay?sectionId=IBT01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'islam_bilim';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yerli = '13',
  fiyat_yabanci = '13',
  site = 'https://muze.gov.tr/muze-detay?sectionId=IHM01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'havalimani_muze';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yabanci = '35',
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
  kapali_gun = 0,
  site = 'https://muze.gov.tr/muze-detay?sectionId=MAE01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'mehmet_akif';

UPDATE mekan_saatleri SET
  fiyat_yerli = '330 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '90 TL',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'miniaturk';

UPDATE mekan_saatleri SET
  fiyat_yerli = '330 TL',
  fiyat_yabanci = '330 TL',
  fiyat_indirimli = '90 TL',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'panorama';

UPDATE mekan_saatleri SET
  fiyat_yabanci = '6',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'rumeli';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yerli = '900 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '90 TL',
  ozel_not = '🔸 yalnızca kredi/banka kartı ve İstanbulkart ile ödeme yapılır.

🔸Toplu bilet alımlarında e-fatura talebinde bulunanların işlem öncesi gişeye bilgi vermesi gerekmektedir. Bilet satışı sonrası geriye dönük işlem yapılamamaktadır. E-fatura oluşturulabilmesi için ise tüzel kişiler için firma ünvanı, vergi dairesi, vergi kimlik numarası; bireysel alımlarda ise ad-soyad ve T.C. kimlik numarası gişeye bildirilmelidir.',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'serefiye';

UPDATE mekan_saatleri SET
  kapali_gun = 1,
  fiyat_yerli = '300 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '200 TL',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sinema_muze';

UPDATE mekan_saatleri SET
  fiyat_yerli = '160 TL',
  fiyat_yabanci = '570 TL',
  fiyat_indirimli = '65 TL',
  muzekart = 'gecmez',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'tekfur';

UPDATE mekan_saatleri SET
  aktif = FALSE,
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'turbeler';

UPDATE mekan_saatleri SET
  mevsimsel = FALSE,
  kapanis = '21:00:00',
  gise_kapanis = '20:00:00',
  kapali_gun = 0,
  fiyat_yabanci = '17',
  site = 'https://muze.gov.tr/muze-detay?sectionId=EIE01&distId=MRK',
  kaynak = 'muze.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'tiem';

UPDATE mekan_saatleri SET
  fiyat_yerli = '50 TL',
  fiyat_yabanci = '400 TL',
  fiyat_indirimli = '20 TL',
  muzekart = 'gecmez',
  site = 'https://www.yedikulehisari.com/ziyaretci-bilgileri/',
  kaynak = 'www.fatih.bel.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yedikule';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '1950 TL',
  fiyat_indirimli = '90 TL',
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
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'yerebatan';

UPDATE mekan_saatleri SET
  kategori = 'muzeler',
  kapanis = '17:00:00',
  gise_kapanis = '16:30:00',
  kapali_gun = 1,
  fiyat_yerli = '160 TL',
  fiyat_yabanci = '570 TL',
  fiyat_indirimli = '65 TL',
  ozel_not = '🔹 Bilet ücretlerinde kredi kartı ve banka kartları geçerlidir. Diğer tahsilat yöntemleri kullanılamamaktadır.

🔹 65 yaş üstü ile 10 yaş altı ziyaretçilere ücretsizdir.',
  site = 'https://ataturkkitapligi.ibb.gov.tr/tr/Kitaplik/Muzelerimiz/Asiyan-Muzesi/1',
  kaynak = 'ataturkkitapligi.ibb.gov.tr',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'asiyan';

UPDATE mekan_saatleri SET
  ozel_not = '🔹 Ücretler için mutlaka arayın',
  site = 'https://camlicakule.istanbul/',
  kaynak = 'https://camlicakule.istanbul/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'camlica_kulesi';

UPDATE mekan_saatleri SET
  kapanis = '17:00:00',
  fiyat_yerli = '200 TL',
  fiyat_yabanci = '550 TL',
  fiyat_indirimli = '100 TL',
  ozel_not = '🔹 Salı 20:00''a kadar açık.

🔹 Ücretsiz: 0-18 yaş arası çocuklar / 65 yaş ve üstü Türkiye Cumhuriyeti vatandaşları / Gaziler, şehit ve gazilerin eş ve çocukları / Engelliler ile bir refakatçisi / Öğretmenler / Er ve erbaşlar / AICA, ICOM, ICOMOS ve UNESCO kartı ile Basın kimlik kartı sahipleri.

🔹 Salı günleri 16:00- 20:00 saatleri arasında tüm öğrencilere ücretsizdir. 

🔹 İndirimli Bilet:
100 TL (18 yaş üstü öğrenciler )

🔹 Bayramların birinci günleri ve yılın ilk günü (1 Ocak) kapalıdır.

🔹 Grup indirimi:
%20 (tek seferde 10 bilet ve üstü)',
  kaynak = 'https://irhm.msgsu.edu.tr/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'irhm';

UPDATE mekan_saatleri SET
  aktif = FALSE,
  fiyat_yerli = '1250 TL',
  fiyat_yabanci = '1250 TL',
  fiyat_indirimli = '1100 TL',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'akvaryum';

UPDATE mekan_saatleri SET
  fiyat_yerli = '550 TL',
  fiyat_yabanci = '900 TL',
  fiyat_indirimli = '320 TL',
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
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'ist_modern';

UPDATE mekan_saatleri SET
  fiyat_yerli = '375 TL',
  fiyat_yabanci = '750 TL',
  fiyat_indirimli = '175 TL',
  ozel_not = '🔹 Sesli Rehber Hizmeti: 50 TL

​🔹 İndirimli Bilet tarifesi sadece ; Öğretmenler, öğrenciler ve 65 yaş üstü ziyaretçiler için geçerlidir.

🔹 Ücretsiz Giriş Hakkı Olanlar: 

- 12 yaş altı çocuklar
- ICOM kart sahipleri
- Profesyonel tur rehberleri
- Engelli bireyler
- Basın Mensupları',
  site = 'https://www.masumiyetmuzesi.org/zi-yaret-g%C3%BCn-ve-saatleri',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'masumiyet';

UPDATE mekan_saatleri SET
  fiyat_yerli = '300 TL',
  fiyat_yabanci = '300 TL',
  fiyat_indirimli = '150 TL',
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
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'pera';

UPDATE mekan_saatleri SET
  haftasonu_kapanis = '19:00:00',
  fiyat_yerli = '500 TL',
  fiyat_yabanci = '950 TL',
  fiyat_indirimli = '200 TL',
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
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '330 TL',
  fiyat_indirimli = '330 TL',
  ozel_not = '🔹 İndirimli: 330₺
18 yaş üzeri öğrenciler, öğretmenler, 65 yaş ve üstü ziyaretçiler, SSM üyelerine eşlik eden bir misafir, Sabancı Topluluğu çalışanları ve beraberinde eşlik eden bir misafir, (Afyon Çimento, Agesa, Ak Portföy, Akbank, Akbank AG, Ak Yatırım, Akbank Ventures BV, Akçansa, AkLesae, Aköde, Ak Sigorta, Arvento, Brisa, Bulutistan, Carrefoursa, Çimsa, Çimsa Building Solution, Enerjisa Enerji, Enerjisa Üretim, E-Şarj, Hacı Ömer Sabancı Holding, Kordsa, Mannok Holding, Medisa, Sabancı İklim Teknolojileri, Sabancı Vakfı, Sabancı DX, Sabancı DX BV, Sem, Stablex, Teknosa, Temsa Motorlu Araçlar, Temsa Ulaşım, Tursa) ile Sabancı Üniversitesi çalışanlarına eşlik eden bir misafir için geçerlidir. Kimlik gösterilmesi gerekmektedir.

🔹 Öğrenci: 225₺
12-18 yaş arası öğrenciler için geçerlidir, kimlik gösterilmesi gerekmektedir.

🔹 Ücretsiz: Salı girişleri, SSM Dost Kart sahipleri, 12 yaş ve altı çocuklar, engelli bireyler ve beraberlerinde bir refakatçi, Sabancı Üniversitesi akademik ve idari personeli, Sabancı Üniversitesi öğrencileri, ICOM kart sahipleri, MMKD üyeleri ve basın mensupları',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sabanci';

UPDATE mekan_saatleri SET
  kapali_gun = 3,
  fiyat_yerli = '450 TL',
  fiyat_yabanci = '100 TL',
  fiyat_indirimli = '300 TL',
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
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'sadberk';

UPDATE mekan_saatleri SET
  ozel_not = '🔹 Salı-Cumartesi 11.00-19.00

🔹 Pazar 11.00-18.00

🔹 Ramazan ve Kurban bayramlarının birinci ve ikinci günleriyle, 1 Ocak ve 1 Mayıs günleri kapalıdır.

🔹 Giriş ücretsiz.',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'salt';

UPDATE mekan_saatleri SET
  kapali_gun = 0,
  ozel_not = '🔹 Enerji Müzesi, resmi tatiller ve 1 Ocak’ta ziyarete kapalıdır.

🔹 Müzemiz, tüm ziyaretçiler için ücretsizdir.

🔹 Rehberli tur ücretleri aşağıdaki gibidir:

- Üniversite öğrencileri: 150₺

- Yetişkinler: 200₺

- Gruplar (10 kişi ve üzeri): 150₺ (kişi başı)',
  site = 'https://enerjimuzesi.bilgi.edu.tr/tr/iletisim/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'santral';

UPDATE mekan_saatleri SET
  gise_kapanis = '17:45:00',
  kapali_gun = 1,
  ozel_not = '🔹 Müzemiz 1 Ocak, 1 Mayıs, Ramazan ve Kurban bayramlarının ilk günü ile Pazartesi günleri kapalıdır.',
  site = 'https://issanat.com.tr/turkiye-is-bankasi-muzesi/',
  kaynak = 'https://issanat.com.tr/turkiye-is-bankasi-muzesi/',
  guncelleme_tarihi = NOW()
WHERE mekan_id = 'is_bankasi_muze';

COMMIT;
