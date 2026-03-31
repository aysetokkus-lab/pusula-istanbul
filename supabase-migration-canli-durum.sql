-- ═══════════════════════════════════════════════════════════════
-- CANLI DURUM PANELİ — Supabase Migration
-- Pusula Rehber · istanbul-rehber
-- ═══════════════════════════════════════════════════════════════

-- 1) Saha Noktaları — Rehberin durum bildirebileceği mekanlar
CREATE TABLE IF NOT EXISTS saha_noktalari (
  id TEXT PRIMARY KEY,
  isim TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📍',
  kategori TEXT NOT NULL DEFAULT 'genel',
  -- kategori: 'saray' | 'muze' | 'ozel_muze' | 'cami' | 'carsi' | 'iskele' | 'meydan' | 'genel'
  aktif BOOLEAN NOT NULL DEFAULT true,
  sira INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Canlı Durum Bildirimleri
CREATE TABLE IF NOT EXISTS canli_durum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nokta_id TEXT NOT NULL REFERENCES saha_noktalari(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Hızlı durum seçimi
  durum TEXT NOT NULL CHECK (durum IN ('normal', 'kuyruk', 'yogun_kuyruk', 'kismi_kapali', 'kapali', 'restorasyon')),

  -- Detaylı bilgi (opsiyonel)
  bekleme_dk INTEGER,           -- Tahmini bekleme süresi (dakika)
  not_metni TEXT,               -- Kısa açıklama
  kapali_bolum TEXT,            -- Hangi bölüm kapalı

  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gecerli_mi BOOLEAN NOT NULL DEFAULT true  -- 2 saat sonra otomatik false olacak
);

-- 3) Index'ler (performans)
CREATE INDEX idx_canli_durum_nokta ON canli_durum(nokta_id, created_at DESC);
CREATE INDEX idx_canli_durum_gecerli ON canli_durum(gecerli_mi, created_at DESC);
CREATE INDEX idx_canli_durum_kullanici ON canli_durum(kullanici_id, created_at DESC);

-- 4) RLS (Row Level Security)
ALTER TABLE saha_noktalari ENABLE ROW LEVEL SECURITY;
ALTER TABLE canli_durum ENABLE ROW LEVEL SECURITY;

-- Herkes saha noktalarını okuyabilir
CREATE POLICY "saha_noktalari_herkes_okur" ON saha_noktalari
  FOR SELECT USING (true);

-- Herkes canlı durumları okuyabilir
CREATE POLICY "canli_durum_herkes_okur" ON canli_durum
  FOR SELECT USING (true);

-- Giriş yapmış kullanıcılar durum bildirebilir
CREATE POLICY "canli_durum_kullanici_yazar" ON canli_durum
  FOR INSERT WITH CHECK (auth.uid() = kullanici_id);

-- Kullanıcı kendi bildirimini güncelleyebilir
CREATE POLICY "canli_durum_kullanici_gunceller" ON canli_durum
  FOR UPDATE USING (auth.uid() = kullanici_id);

-- 5) Realtime'ı aç
ALTER PUBLICATION supabase_realtime ADD TABLE canli_durum;

-- 6) Eski bildirimleri otomatik geçersiz kılan fonksiyon (2 saat sonra)
CREATE OR REPLACE FUNCTION eskiyen_durumlari_kaldir()
RETURNS void AS $$
BEGIN
  UPDATE canli_durum
  SET gecerli_mi = false
  WHERE gecerli_mi = true
    AND created_at < now() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Cron job (pg_cron extension gerekli, Supabase'de varsayılan aktif)
-- Her 15 dakikada bir eski bildirimleri temizle
SELECT cron.schedule(
  'temizle-eski-durumlar',
  '*/15 * * * *',
  'SELECT eskiyen_durumlari_kaldir()'
);

-- 8) En güncel durumu getiren view
CREATE OR REPLACE VIEW v_canli_durum AS
SELECT DISTINCT ON (cd.nokta_id)
  cd.id,
  cd.nokta_id,
  sn.isim AS nokta_isim,
  sn.emoji AS nokta_emoji,
  sn.kategori AS nokta_kategori,
  cd.durum,
  cd.bekleme_dk,
  cd.not_metni,
  cd.kapali_bolum,
  cd.created_at,
  cd.kullanici_id,
  p.isim AS rehber_isim,
  -- Kaç dakika önce bildirildi
  EXTRACT(EPOCH FROM (now() - cd.created_at)) / 60 AS dakika_once
FROM canli_durum cd
JOIN saha_noktalari sn ON sn.id = cd.nokta_id
LEFT JOIN profiles p ON p.id = cd.kullanici_id
WHERE cd.gecerli_mi = true
ORDER BY cd.nokta_id, cd.created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- BAŞLANGIÇ VERİSİ — Saha Noktaları
-- ═══════════════════════════════════════════════════════════════

INSERT INTO saha_noktalari (id, isim, emoji, kategori, sira) VALUES
  -- Milli Saraylar
  ('beylerbeyi', 'Beylerbeyi Sarayı', '🏯', 'saray', 1),
  ('dolmabahce', 'Dolmabahçe Sarayı', '🏰', 'saray', 2),
  ('ihlamur', 'Ihlamur Kasrı', '🌿', 'saray', 3),
  ('ms_resim', 'Milli Saraylar Resim Müzesi', '🖼', 'saray', 4),
  ('topkapi', 'Topkapı Sarayı', '👑', 'saray', 5),
  ('yildiz', 'Yıldız Sarayı', '⭐', 'saray', 6),
  -- Müzeler
  ('arkeoloji', 'Arkeoloji Müzesi', '🏺', 'muze', 10),
  ('askeri', 'Askeri Müze', '🎖', 'muze', 11),
  ('ayasofya', 'Ayasofya Camii (Galeri)', '🕌', 'muze', 12),
  ('deniz', 'Deniz Müzesi', '⚓', 'muze', 13),
  ('dijital', 'Dijital Deneyim Merkezi', '🎮', 'muze', 14),
  ('galata_kulesi', 'Galata Kulesi', '🗼', 'muze', 15),
  ('mevlevihane', 'Galata Mevlevihanesi', '💫', 'muze', 16),
  ('kariye', 'Kariye Camii', '🕍', 'muze', 17),
  ('kiz_kulesi', 'Kız Kulesi', '🏰', 'muze', 18),
  ('miniaturk', 'Miniatürk', '🏗', 'muze', 19),
  ('panorama', 'Panorama 1453', '⚔', 'muze', 20),
  ('rumeli', 'Rumeli Hisarı', '🏰', 'muze', 21),
  ('serefiye', 'Şerefiye Sarnıcı', '🏛', 'muze', 22),
  ('tekfur', 'Tekfur Sarayı', '🏰', 'muze', 23),
  ('tiem', 'Türk & İslam Eserleri', '🔮', 'muze', 24),
  ('yedikule', 'Yedikule Hisarı', '🏰', 'muze', 25),
  ('yerebatan', 'Yerebatan Sarnıcı', '🏛', 'muze', 26),
  -- Özel Müzeler
  ('irhm', 'İRHM (MSGSÜ)', '🎨', 'ozel_muze', 30),
  ('ist_modern', 'İstanbul Modern', '🎭', 'ozel_muze', 31),
  ('masumiyet', 'Masumiyet Müzesi', '📚', 'ozel_muze', 32),
  ('pera', 'Pera Müzesi', '🖼', 'ozel_muze', 33),
  ('rahmi_koc', 'Rahmi Koç Müzesi', '⚙', 'ozel_muze', 34),
  ('sabanci', 'Sabancı Müzesi', '🏛', 'ozel_muze', 35),
  ('sadberk', 'Sadberk Hanım Müzesi', '🏺', 'ozel_muze', 36),
  ('salt', 'Salt Galata / Beyoğlu', '📖', 'ozel_muze', 37),
  ('santral', 'Santralistanbul', '⚡', 'ozel_muze', 38),
  -- Ekstra Saha Noktaları (Rehberin günlük hayatı)
  ('sultanahmet_camii', 'Sultanahmet Camii', '🕌', 'cami', 40),
  ('kapali_carsi', 'Kapalıçarşı', '🏪', 'carsi', 50),
  ('misir_carsisi', 'Mısır Çarşısı', '🌶', 'carsi', 51),
  ('arasta_carsisi', 'Arasta Çarşısı', '🧵', 'carsi', 52),
  ('galataport', 'Galataport', '🚢', 'iskele', 60),
  ('eminonu_iskele', 'Eminönü İskelesi', '⛴', 'iskele', 61),
  ('kabatas_iskele', 'Kabataş İskelesi', '⛴', 'iskele', 62),
  ('sultanahmet_meydan', 'Sultanahmet Meydanı', '🏛', 'meydan', 70),
  ('taksim_meydan', 'Taksim Meydanı', '🏙', 'meydan', 71),
  ('hipodrom', 'Hipodrom (At Meydanı)', '🏟', 'meydan', 72)
ON CONFLICT (id) DO NOTHING;
