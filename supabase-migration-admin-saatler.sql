-- ═══════════════════════════════════════════════════════════════
-- PUSULA ISTANBUL — Admin Saat & Tarife Yonetimi Migration
-- Tarih: 2026-03-29
-- Aciklama: Muze/saray saatleri, cami ziyaret bilgileri,
--           bogaz tur tarifeleri ve havalimani ulasim seferleri
--           artik admin panelinden yonetilebilir.
-- ═══════════════════════════════════════════════════════════════

-- ═══ 1. MEKAN SAATLERİ TABLOSU ═══
-- Muzeler, saraylar, camiler, kuleler, sarniclar vb.
CREATE TABLE IF NOT EXISTS mekan_saatleri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mekan_id TEXT NOT NULL UNIQUE,
  isim TEXT NOT NULL,
  tip TEXT NOT NULL CHECK (tip IN ('muze','saray','cami','kule','sarnic','hisar','ozel_muze','kasir','kultur_merkezi','acik_hava')),
  kategori TEXT NOT NULL CHECK (kategori IN ('milli_saraylar','muzeler','ozel_muzeler','camiler')),

  -- Standart saatler
  acilis TEXT NOT NULL DEFAULT '09:00',
  kapanis TEXT NOT NULL DEFAULT '18:00',
  gise_kapanis TEXT DEFAULT '17:00',
  kapali_gun INTEGER, -- 0=Paz,1=Pzt,2=Sal,3=Car,4=Per,5=Cum,6=Cmt / NULL=her gun acik

  -- Mevsimsel saatler (yaz/kis gecisi icin)
  mevsimsel BOOLEAN DEFAULT false,
  yaz_acilis TEXT,
  yaz_kapanis TEXT,
  kis_acilis TEXT,
  kis_kapanis TEXT,
  aktif_mevsim TEXT DEFAULT 'kis' CHECK (aktif_mevsim IN ('yaz','kis')),

  -- Hafta ici / Hafta sonu farklari
  haftaici_acilis TEXT,
  haftaici_kapanis TEXT,
  haftaici_gise TEXT,
  haftasonu_acilis TEXT,
  haftasonu_kapanis TEXT,
  haftasonu_gise TEXT,

  -- Gun bazli ozel saatler
  sali_kapanis TEXT,
  cuma_kapanis TEXT,
  cuma_kapali_bas TEXT,  -- Cuma namaz arasi baslangic
  cuma_kapali_bit TEXT,  -- Cuma namaz arasi bitis
  pazar_acilis TEXT,
  pazar_kapanis TEXT,

  -- Gece muzeciligi
  gece_acilis TEXT,
  gece_kapanis TEXT,
  gece_gise TEXT,

  -- Fiyatlar
  fiyat_yerli TEXT,
  fiyat_yabanci TEXT,
  fiyat_indirimli TEXT,
  muzekart TEXT CHECK (muzekart IN ('gecerli','gecmez','indirimli')),

  -- Ek bilgiler
  ozel_not TEXT,
  kaynak TEXT,
  site TEXT,
  renk TEXT DEFAULT '#0077B6',
  ulasim_notu TEXT,
  ekstra TEXT,

  -- Durum
  aktif BOOLEAN DEFAULT true,
  restorasyon BOOLEAN DEFAULT false,
  restorasyon_notu TEXT,

  -- Meta
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleyen UUID REFERENCES auth.users(id)
);

-- ═══ 2. BOGAZ TURLARI TABLOSU ═══
CREATE TABLE IF NOT EXISTS bogaz_turlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sirket_id TEXT NOT NULL,
  sirket_adi TEXT NOT NULL,
  renk TEXT DEFAULT '#0077B6',

  -- Tur bilgisi
  tur_tipi TEXT NOT NULL CHECK (tur_tipi IN ('standart','kisa','uzun','ada')),
  kalkis_yeri TEXT,
  fiyat TEXT,
  sure TEXT,

  -- Sefer saatleri (JSON array)
  hafta_ici_saatler JSONB DEFAULT '[]',
  hafta_sonu_saatler JSONB DEFAULT '[]',

  -- Guzergah (JSON array) — uzun/kisa turlar icin
  gidis_guzergah JSONB DEFAULT '[]',   -- [{durak, saat}]
  donus_guzergah JSONB DEFAULT '[]',

  -- Ek kalkis noktalari (Dentur gibi)
  kalkis_noktalari JSONB DEFAULT '[]',  -- [{durak, fiyat}]

  -- Notlar
  ozel_not TEXT,
  kaynak TEXT,
  tarife_donemi TEXT, -- 'Kis 2025-2026', 'Yaz 2026'

  -- Durum
  aktif BOOLEAN DEFAULT true,
  aktif_mevsim TEXT DEFAULT 'kis' CHECK (aktif_mevsim IN ('yaz','kis')),

  -- Meta
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleyen UUID REFERENCES auth.users(id)
);

-- ═══ 3. HAVALIMANI SEFERLERI TABLOSU ═══
CREATE TABLE IF NOT EXISTS havalimani_seferleri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firma TEXT NOT NULL CHECK (firma IN ('havaist','havabus')),
  havalimani TEXT NOT NULL CHECK (havalimani IN ('IST','SAW')),
  durak_id TEXT NOT NULL,
  durak_adi TEXT NOT NULL,

  -- Sefer bilgileri
  sure TEXT,        -- '~90 dk'
  fiyat TEXT,       -- '440 TL'
  not_bilgi TEXT,   -- 'Sultanahmet icin en yakin durak'

  -- Sefer saatleri (JSON array of time strings)
  sehirden_hav JSONB NOT NULL DEFAULT '[]',  -- ["00:15","01:45",...]
  havdan_sehir JSONB NOT NULL DEFAULT '[]',

  -- Durum
  aktif BOOLEAN DEFAULT true,
  kaynak TEXT,
  tarife_donemi TEXT,

  -- Meta
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleyen UUID REFERENCES auth.users(id),

  UNIQUE(firma, durak_id)
);

-- ═══ 4. MEVSİM GEÇİŞ KAYITLARI ═══
-- Toplu yaz/kis gecislerinin logunu tutar
CREATE TABLE IF NOT EXISTS mevsim_gecis_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mevsim TEXT NOT NULL CHECK (mevsim IN ('yaz','kis')),
  gecis_tarihi TIMESTAMPTZ DEFAULT now(),
  yapan UUID REFERENCES auth.users(id),
  etkilenen_mekan_sayisi INTEGER DEFAULT 0,
  notlar TEXT
);


-- ═══ RLS POLİTİKALARI ═══

ALTER TABLE mekan_saatleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE bogaz_turlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE havalimani_seferleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE mevsim_gecis_log ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "mekan_saatleri_herkes_okur" ON mekan_saatleri FOR SELECT USING (true);
CREATE POLICY "bogaz_turlari_herkes_okur" ON bogaz_turlari FOR SELECT USING (true);
CREATE POLICY "havalimani_herkes_okur" ON havalimani_seferleri FOR SELECT USING (true);
CREATE POLICY "mevsim_log_herkes_okur" ON mevsim_gecis_log FOR SELECT USING (true);

-- Sadece admin/moderator yazabilir
CREATE POLICY "mekan_saatleri_admin_yazar" ON mekan_saatleri
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('admin','moderator'))
  );

CREATE POLICY "bogaz_turlari_admin_yazar" ON bogaz_turlari
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('admin','moderator'))
  );

CREATE POLICY "havalimani_admin_yazar" ON havalimani_seferleri
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('admin','moderator'))
  );

CREATE POLICY "mevsim_log_admin_yazar" ON mevsim_gecis_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('admin','moderator'))
  );


-- ═══ SEED DATA — MİLLİ SARAYLAR ═══
INSERT INTO mekan_saatleri (mekan_id, isim, tip, kategori, acilis, kapanis, gise_kapanis, kapali_gun, ozel_not, kaynak, renk, site, muzekart) VALUES
  ('beylerbeyi', 'Beylerbeyi Sarayı', 'saray', 'milli_saraylar', '09:00', '17:00', '17:00', 1, 'Anadolu yakası', 'millisaraylar.gov.tr', '#0077B6', 'https://www.millisaraylar.gov.tr/Lokasyon/4/beylerbeyi-sarayi', 'gecerli'),
  ('dolmabahce', 'Dolmabahçe Sarayı', 'saray', 'milli_saraylar', '09:00', '17:00', '17:00', 1, 'Müzekart Selamlık''ta geçmez — Harem için ayrı bilet', 'millisaraylar.gov.tr', '#0077B6', 'https://www.millisaraylar.gov.tr/Lokasyon/3/dolmabahce-sarayi', 'gecerli'),
  ('ihlamur', 'Ihlamur Kasrı', 'kasir', 'milli_saraylar', '09:00', '17:00', '17:00', 1, NULL, 'millisaraylar.gov.tr', '#0077B6', 'https://www.millisaraylar.gov.tr/Lokasyon/7/ihlamur-kasri', 'gecerli'),
  ('ms_resim', 'Milli Saraylar Resim Müzesi', 'muze', 'milli_saraylar', '09:00', '17:00', '17:00', 1, NULL, 'millisaraylar.gov.tr', '#0077B6', 'https://www.millisaraylar.gov.tr/Lokasyon/11/Resim-Muzesi', 'gecerli'),
  ('topkapi', 'Topkapı Sarayı', 'saray', 'milli_saraylar', '09:00', '17:00', '17:00', 2, 'Harem için ayrı bilet gerekir', 'millisaraylar.gov.tr', '#0077B6', 'https://www.millisaraylar.gov.tr/Lokasyon/2/topkapi-sarayi', 'gecerli'),
  ('yildiz', 'Yıldız Sarayı', 'saray', 'milli_saraylar', '09:00', '17:00', '17:00', 3, NULL, 'millisaraylar.gov.tr', '#0077B6', 'https://www.millisaraylar.gov.tr/Lokasyon/5/yildiz-sarayi', 'gecerli')
ON CONFLICT (mekan_id) DO NOTHING;

-- ═══ SEED DATA — MÜZELER ═══
INSERT INTO mekan_saatleri (mekan_id, isim, tip, kategori, acilis, kapanis, gise_kapanis, kapali_gun, mevsimsel, yaz_acilis, kis_acilis, yaz_kapanis, kis_kapanis, cuma_kapali_bas, cuma_kapali_bit, haftaici_acilis, haftaici_kapanis, haftaici_gise, haftasonu_acilis, haftasonu_kapanis, haftasonu_gise, gece_acilis, gece_kapanis, gece_gise, fiyat_yerli, fiyat_yabanci, fiyat_indirimli, ozel_not, kaynak, renk, site, muzekart, ulasim_notu, ekstra) VALUES
  ('arkeoloji', 'Arkeoloji Müzesi', 'muze', 'muzeler', '09:00', '18:30', '17:30', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Çinili Köşk, Kuzey Kanat ve Eski Şark Eserleri restorasyon nedeniyle kapalı', 'muze.gov.tr', '#0096C7', NULL, 'gecerli', NULL, NULL),
  ('askeri', 'Askeri Müze', 'muze', 'muzeler', '09:00', '16:30', '16:30', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'askerimuze.msb.gov.tr', '#7B8FA1', 'https://askerimuze.msb.gov.tr/iletisim.html', 'gecmez', NULL, NULL),
  ('ayasofya', 'Ayasofya Camii (Galeri)', 'cami', 'muzeler', '09:00', '19:30', '18:30', NULL, true, '08:00', '09:00', '19:30', '19:30', '12:30', '14:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '800₺', '25€', '425₺ (Müzekart)', 'Zemin kat cami (ücretsiz). Turistler sadece galeri katına girer.', 'dexxmuseums.com', '#0077B6', NULL, 'indirimli', NULL, NULL),
  ('deniz', 'Deniz Müzesi', 'muze', 'muzeler', '09:00', '17:00', '16:00', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '09:00', '17:00', '16:00', '10:00', '18:00', '17:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'denizmuzeleri.dzkk.tsk.tr', '#7B8FA1', 'https://denizmuzeleri.dzkk.tsk.tr/v1/besiktas-deniz-muzesi-komutanligi', 'gecmez', NULL, NULL),
  ('dijital', 'Dijital Deneyim Merkezi', 'muze', 'muzeler', '10:00', '18:00', '17:45', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '330₺', '900₺', '90₺', 'Şu an geçici olarak kapalı (içerik güncellemesi). VR: hamileler, epilepsi, 8↓ ve 70↑ yaş uygun değil.', 'dijitaldeneyimmerkezi.com', '#7B8FA1', 'https://www.dijitaldeneyimmerkezi.com/Home/Index', 'gecmez', NULL, NULL),
  ('galata_kulesi', 'Galata Kulesi', 'kule', 'muzeler', '08:30', '18:14', '17:45', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '19:00', '23:00', '22:00', NULL, '30€', NULL, 'Gece Müzeciliği ayrı bilet. 18 yaş altı ebeveyn ile girmeli.', 'muze.gov.tr', '#0077B6', NULL, 'gecerli', NULL, NULL),
  ('mevlevihane', 'Galata Mevlevihanesi', 'muze', 'muzeler', '09:00', '18:30', '17:00', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '7€', NULL, NULL, 'muze.gov.tr', '#0096C7', NULL, 'gecerli', NULL, NULL),
  ('kariye', 'Kariye Camii', 'cami', 'muzeler', '09:00', '18:00', '17:55', 5, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Müzekart geçmez — Namaz vakitlerinden 15 dk önce turist girişi durur', 'muze.gov.tr', '#0077B6', NULL, 'gecmez', NULL, NULL),
  ('kiz_kulesi', 'Kız Kulesi', 'muze', 'muzeler', '09:00', '18:00', '17:00', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '27€', NULL, 'Hava koşullarına bağlı. Müzekart geçerli + 110₺ ulaşım.', 'muze.gov.tr', '#0077B6', NULL, 'gecerli', 'Salacak: 09:30-17:00 (her 30dk) · Karaköy: 09:30,11:00,12:30,14:00,15:30,17:00', 'Salacak İskele: Harem Sahil Yolu Cd. No:26/1, Üsküdar\nKaraköy İskele: Kemankeş Karamustafa Paşa Mah. Rıhtım Cd.'),
  ('miniaturk', 'Miniatürk', 'acik_hava', 'muzeler', '10:00', '18:00', '17:30', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '250₺', '900₺', '90₺', 'Nakit geçmez, sadece kart/İstanbulkart. 5↓ yaş, 65+, engelli ücretsiz.', 'miniaturk.com.tr', '#7B8FA1', 'https://www.miniaturk.com.tr/Home/Index', 'gecmez', NULL, NULL),
  ('panorama', 'Panorama 1453', 'muze', 'muzeler', '08:30', '16:30', '16:00', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '250₺', '900₺', '90₺', 'Nakit geçmez. Bebek arabası platforma giremez.', 'panoramikmuze.com', '#7B8FA1', 'https://www.panoramikmuze.com/', 'gecmez', NULL, NULL),
  ('rumeli', 'Rumeli Hisarı', 'hisar', 'muzeler', '09:00', '18:00', '17:00', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'muze.gov.tr', '#0096C7', NULL, 'gecerli', NULL, NULL),
  ('serefiye', 'Şerefiye Sarnıcı', 'sarnic', 'muzeler', '10:00', '18:00', '17:30', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '330₺', '900₺', '90₺', 'Nakit geçmez, sadece kart/İstanbulkart.', 'serefiyesarnici.istanbul', '#0096C7', 'https://www.serefiyesarnici.istanbul/Home/Index', 'gecmez', NULL, NULL),
  ('tekfur', 'Tekfur Sarayı', 'saray', 'muzeler', '09:00', '17:00', '16:30', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '160₺', '570₺', '65₺', 'Nakit geçmez. 65+ ve 10↓ yaş ücretsiz.', 'İBB Kültür AŞ', '#7B8FA1', 'https://ataturkkitapligi.ibb.gov.tr/tr/Kitaplik/Muzelerimiz/Tekfur-Sarayi/10', 'gecmez', NULL, NULL),
  ('tiem', 'Türk & İslam Eserleri', 'muze', 'muzeler', '09:00', '18:30', '17:30', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'muze.gov.tr', '#0096C7', NULL, 'gecerli', NULL, NULL),
  ('yedikule', 'Yedikule Hisarı', 'hisar', 'muzeler', '09:00', '17:00', '16:30', 1, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '50₺', '400₺', '20₺', NULL, 'yedikulehisari.com', '#7B8FA1', 'https://www.yedikulehisari.com/', 'gecmez', NULL, NULL),
  ('yerebatan', 'Yerebatan Sarnıcı', 'sarnic', 'muzeler', '09:00', '18:30', '17:30', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'yerebatan.com', '#0096C7', NULL, 'gecmez', NULL, NULL)
ON CONFLICT (mekan_id) DO NOTHING;

-- ═══ SEED DATA — ÖZEL MÜZELER ═══
INSERT INTO mekan_saatleri (mekan_id, isim, tip, kategori, acilis, kapanis, gise_kapanis, kapali_gun, sali_kapanis, cuma_kapanis, pazar_acilis, pazar_kapanis, haftasonu_acilis, haftasonu_kapanis, haftasonu_gise, fiyat_yerli, fiyat_yabanci, fiyat_indirimli, ozel_not, kaynak, renk, site, muzekart, ekstra) VALUES
  ('irhm', 'İRHM (MSGSÜ)', 'ozel_muze', 'ozel_muzeler', '10:00', '17:00', '16:30', 1, '20:00', NULL, NULL, NULL, NULL, NULL, NULL, '200₺', '550₺', '100₺', 'Salı 10:00-20:00 (16-20 arası öğrencilere ücretsiz). MSGSÜ öğrenci/mezun ücretsiz.', 'irhm.msgsu.edu.tr', '#0096C7', 'https://irhm.msgsu.edu.tr/', 'gecmez', NULL),
  ('ist_modern', 'İstanbul Modern', 'ozel_muze', 'ozel_muzeler', '10:00', '18:00', '17:30', 1, NULL, '20:00', NULL, NULL, NULL, NULL, NULL, '550₺', '900₺', '320₺', 'Per 10-14 TR ikamet ücretsiz. Sal 10-14 genç (18-25) ücretsiz.', 'istanbulmodern.org', '#0077B6', 'https://www.istanbulmodern.org/', 'gecmez', NULL),
  ('masumiyet', 'Masumiyet Müzesi', 'ozel_muze', 'ozel_muzeler', '10:00', '18:00', '17:30', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '375₺', '750₺', '175₺', 'Romanın son bölümündeki davetiye gişede damgalatılabilir!', 'masumiyetmuzesi.org', '#0096C7', 'https://www.masumiyetmuzesi.org/', 'gecmez', NULL),
  ('pera', 'Pera Müzesi', 'ozel_muze', 'ozel_muzeler', '10:00', '19:00', '18:30', 1, NULL, '22:00', '12:00', '18:00', NULL, NULL, NULL, '300₺', '300₺', '150₺', 'Cuma 18-22 herkese ücretsiz! Çarşamba öğrencilere ücretsiz.', 'peramuzesi.org.tr', '#0077B6', 'https://www.peramuzesi.org.tr/', 'gecmez', NULL),
  ('rahmi_koc', 'Rahmi Koç Müzesi', 'ozel_muze', 'ozel_muzeler', '09:30', '17:00', '16:30', 1, NULL, NULL, NULL, NULL, '10:00', '18:00', '17:30', '500₺', '950₺', '250₺', 'Tekne turu: 150₺ / Öğrenci 100₺', 'rmk-museum.org.tr', '#0096C7', 'https://rmk-museum.org.tr/istanbul', 'gecmez', NULL),
  ('sabanci', 'Sabancı Müzesi', 'ozel_muze', 'ozel_muzeler', '10:00', '18:00', '17:30', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '450₺', '450₺', '330₺', 'Salı günleri ücretsiz!', 'sakipsabancimuzesi.org', '#0077B6', 'https://www.sakipsabancimuzesi.org/', 'gecmez', 'Öğrenci: 225₺'),
  ('sadberk', 'Sadberk Hanım Müzesi', 'ozel_muze', 'ozel_muzeler', '10:00', '17:00', '16:30', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '450₺', '450₺', '300₺', 'Öğrenci: 100₺. Kokartlı rehber, ICOM, 65+, 7↓ yaş ücretsiz.', 'sadberkhanimmuzesi.org.tr', '#0096C7', 'https://www.sadberkhanimmuzesi.org.tr/tr', 'gecmez', NULL),
  ('salt', 'Salt Galata / Beyoğlu', 'kultur_merkezi', 'ozel_muzeler', '11:00', '19:00', '19:00', 1, NULL, NULL, NULL, '18:00', NULL, NULL, NULL, 'Ücretsiz', 'Ücretsiz', NULL, 'Galata: Bankalar Cad. 11, Karaköy · Beyoğlu: İstiklal Cad. 136', 'saltonline.org', '#0096C7', 'https://saltonline.org/', 'gecmez', NULL),
  ('santral', 'Santralistanbul Enerji Müzesi', 'muze', 'ozel_muzeler', '08:30', '17:00', '17:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Ücretsiz', 'Ücretsiz', NULL, 'Rehberli tur: Yetişkin 200₺, Öğrenci 150₺', 'santralistanbul.org', '#0096C7', 'https://www.santralistanbul.org/tr/hakkinda/', 'gecmez', NULL)
ON CONFLICT (mekan_id) DO NOTHING;

-- ═══ SEED DATA — CAMİLER ═══
INSERT INTO mekan_saatleri (mekan_id, isim, tip, kategori, acilis, kapanis, gise_kapanis, kapali_gun, mevsimsel, yaz_kapanis, kis_kapanis, ozel_not, kaynak, renk) VALUES
  ('sultanahmet_camii', 'Sultanahmet Camii', 'cami', 'camiler', '08:30', '18:00', NULL, NULL, true, '19:00', '18:00', 'Namaz vakitlerinde turist girişi durur. Cuma 14:30''a kadar kapalı. Giriş ücretsiz, kıyafet kuralı var.', 'diyanet.gov.tr', '#0077B6')
ON CONFLICT (mekan_id) DO NOTHING;

-- ═══ SEED DATA — BOĞAZ TURLARI ═══
INSERT INTO bogaz_turlari (sirket_id, sirket_adi, renk, tur_tipi, kalkis_yeri, fiyat, hafta_ici_saatler, hafta_sonu_saatler, ozel_not, kaynak, tarife_donemi) VALUES
  ('turyol', 'TURYOL', '#0077B6', 'standart', 'Eminönü', '300 TL',
   '["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"]',
   '["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"]',
   NULL, 'turyol.com.tr', 'Kış 2025-2026');

INSERT INTO bogaz_turlari (sirket_id, sirket_adi, renk, tur_tipi, kalkis_noktalari, hafta_ici_saatler, ozel_not, kaynak, tarife_donemi) VALUES
  ('dentur', 'DENTUR AVRASYA', '#0096C7', 'standart', NULL,
   '["10:30","11:30","12:30","13:30","14:30","15:30","16:30","17:30","18:30","19:30","20:45"]',
   '** işaretli seferler için önceden irtibat gereklidir', 'denturavrasya.com', 'Kış 2025-2026');

-- Dentur kalkis noktalarini guncelle
UPDATE bogaz_turlari SET kalkis_noktalari = '[{"durak":"Kabataş","fiyat":"300 TL"},{"durak":"Beşiktaş","fiyat":"250 TL"}]' WHERE sirket_id = 'dentur';

INSERT INTO bogaz_turlari (sirket_id, sirket_adi, renk, tur_tipi, sure, gidis_guzergah, kaynak, tarife_donemi) VALUES
  ('sehirhatlari_kisa', 'ŞEHİR HATLARI', '#0077B6', 'kisa', '~1.5 saat',
   '[{"durak":"Eminönü","saat":"14:40"},{"durak":"Üsküdar","saat":"14:55"},{"durak":"Ortaköy","saat":"15:10"}]',
   'sehirhatlari.istanbul', 'Kış 2025-2026');

INSERT INTO bogaz_turlari (sirket_id, sirket_adi, renk, tur_tipi, sure, gidis_guzergah, donus_guzergah, kaynak, tarife_donemi) VALUES
  ('sehirhatlari_uzun', 'ŞEHİR HATLARI', '#0077B6', 'uzun', '~6 saat',
   '[{"durak":"Eminönü","saat":"10:35"},{"durak":"Beşiktaş","saat":"10:50"},{"durak":"Üsküdar","saat":"11:05"},{"durak":"Kanlıca","saat":"11:35"},{"durak":"Sarıyer","saat":"12:05"},{"durak":"Rumeli Kavağı","saat":"12:15"},{"durak":"Anadolu Kavağı","saat":"12:25"}]',
   '[{"durak":"Anadolu Kavağı","saat":"15:00","not":"Mola bitişi"},{"durak":"Rumeli Kavağı","saat":"15:10"},{"durak":"Sarıyer","saat":"15:20"},{"durak":"Kanlıca","saat":"15:40"},{"durak":"Üsküdar","saat":"16:10"},{"durak":"Beşiktaş","saat":"16:25"},{"durak":"Eminönü","saat":"16:40"}]',
   'sehirhatlari.istanbul', 'Kış 2025-2026');

-- ═══ SEED DATA — HAVALİMANI SEFERLERİ ═══
INSERT INTO havalimani_seferleri (firma, havalimani, durak_id, durak_adi, not_bilgi, sehirden_hav, havdan_sehir, kaynak, tarife_donemi) VALUES
  ('havaist', 'IST', 'aksaray', 'Aksaray', 'Sultanahmet için en yakın durak',
   '["00:15","01:45","03:15","04:30","05:30","06:20","07:00","07:40","08:20","09:00","09:40","10:20","11:00","11:40","12:20","13:00","13:40","14:20","15:00","15:40","16:20","17:00","17:40","18:20","19:00","19:40","20:20","21:00","21:40","22:20","23:00"]',
   '["00:20","01:00","02:15","04:00","05:30","06:30","07:15","08:00","08:45","09:30","10:15","11:00","11:40","12:20","13:00","13:40","14:20","15:00","15:40","16:20","17:00","17:40","18:20","19:00","19:40","20:20","21:00","21:40","22:20","23:00","23:40"]',
   'hava.ist', 'Mart 2026'),
  ('havaist', 'IST', 'taksim', 'Taksim', 'Beşiktaş ara durak',
   '["00:40","02:00","03:00","03:45","04:30","05:30","06:15","07:00","07:45","08:30","09:05","09:40","10:15","10:50","11:25","12:00","12:35","13:10","13:45","14:20","14:55","15:30","16:05","16:40","17:20","18:05","18:45","19:25","20:05","20:45","21:25","22:10","23:00","23:50"]',
   '["00:00","00:45","01:30","02:15","03:40","04:40","05:30","06:30","07:30","08:20","09:10","09:55","10:30","11:05","11:40","12:15","12:50","13:25","14:00","14:35","15:05","15:40","16:05","16:50","17:25","18:00","18:35","19:10","19:50","20:30","21:10","21:50","22:35","23:15"]',
   'hava.ist', 'Mart 2026'),
  ('havaist', 'IST', 'besiktas', 'Beşiktaş', 'Taksim hattı ara durağı',
   '["00:40","02:00","03:00","03:45","04:30","05:30","06:15","07:00","07:45","08:30","09:05","09:40","10:15","10:50","11:25","12:00","12:35","13:10","13:45","14:20","14:55","15:30","16:05","16:40","17:20","18:05","18:45","19:25","20:05","20:45","21:25","22:10","23:00","23:50"]',
   '["00:00","00:45","01:30","02:15","03:40","04:40","05:30","06:30","07:30","08:20","09:10","09:55","10:30","11:05","11:40","12:15","12:50","13:25","14:00","14:35","15:05","15:40","16:05","16:50","17:25","18:00","18:35","19:10","19:50","20:30","21:10","21:50","22:35","23:15"]',
   'hava.ist', 'Mart 2026'),
  ('havaist', 'IST', 'kadikoy', 'Kadıköy', 'Anadolu yakası',
   '["00:45","02:30","03:30","04:15","05:00","06:00","07:00","07:45","08:45","09:30","10:15","11:15","12:00","13:00","14:00","15:00","16:00","17:15","18:15","19:30","20:45","22:00","23:15"]',
   '["00:15","01:30","02:45","04:00","05:15","06:15","07:15","08:15","09:15","10:15","11:00","12:00","13:00","13:45","14:30","15:20","16:25","17:30","18:30","19:30","20:30","21:45","23:00"]',
   'hava.ist', 'Mart 2026');

INSERT INTO havalimani_seferleri (firma, havalimani, durak_id, durak_adi, sure, fiyat, sehirden_hav, havdan_sehir, kaynak, tarife_donemi) VALUES
  ('havabus', 'SAW', 'taksim_saw', 'Taksim', '~90 dk', '440 TL',
   '["03:00","03:30","04:00","04:30","05:00","05:30","06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00"]',
   '["06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30","00:00","00:30"]',
   'havabus.com', 'Mart 2026'),
  ('havabus', 'SAW', 'kadikoy_saw', 'Kadıköy', '~60 dk', '270 TL',
   '["03:15","03:45","04:15","04:45","05:15","05:45","06:15","06:45","07:15","07:45","08:15","08:45","09:15","09:45","10:15","10:45","11:15","11:45","12:15","12:45","13:15","13:45","14:15","14:45","15:15","15:45","16:15","16:45","17:15","23:15"]',
   '["05:45","06:15","06:45","07:15","07:45","08:15","08:45","09:15","09:45","10:15","10:45","11:15","11:45","12:15","12:45","13:15","13:45","14:15","14:45","15:15","15:45","16:15","16:45","17:15","17:45","18:15","18:45","19:15","19:45","01:30"]',
   'havabus.com', 'Mart 2026');

-- ═══ İNDEXLER ═══
CREATE INDEX IF NOT EXISTS idx_mekan_saatleri_kategori ON mekan_saatleri(kategori);
CREATE INDEX IF NOT EXISTS idx_mekan_saatleri_tip ON mekan_saatleri(tip);
CREATE INDEX IF NOT EXISTS idx_mekan_saatleri_aktif ON mekan_saatleri(aktif);
CREATE INDEX IF NOT EXISTS idx_bogaz_turlari_sirket ON bogaz_turlari(sirket_id);
CREATE INDEX IF NOT EXISTS idx_havalimani_firma ON havalimani_seferleri(firma);
CREATE INDEX IF NOT EXISTS idx_havalimani_havalimani ON havalimani_seferleri(havalimani);
