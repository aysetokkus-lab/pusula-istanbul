-- ═══════════════════════════════════════════
-- Pusula Istanbul — Acil Durum Rehber Tablosu
-- Supabase SQL Editor'de calistirilmali
-- ═══════════════════════════════════════════

-- 1) Tablo olustur
CREATE TABLE IF NOT EXISTS acil_rehber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori TEXT NOT NULL CHECK (kategori IN ('acil_numara', 'turizm_polisi', 'meslek_kurulusu', 'faydali_link')),
  isim TEXT NOT NULL,
  numara TEXT,               -- telefon numarasi (arkaplan araması icin, bosluksuz)
  goruntu TEXT,              -- gorunecek format (0212 527 45 03 gibi)
  url TEXT,                  -- web linki (faydali_link icin)
  aciklama TEXT,             -- kisa aciklama
  sira INTEGER DEFAULT 0,   -- sıralama
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleyen UUID REFERENCES auth.users(id)
);

-- 2) Index
CREATE INDEX IF NOT EXISTS idx_acil_rehber_kategori ON acil_rehber(kategori);
CREATE INDEX IF NOT EXISTS idx_acil_rehber_aktif ON acil_rehber(aktif);

-- 3) RLS
ALTER TABLE acil_rehber ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "acil_rehber_herkes_okur"
  ON acil_rehber FOR SELECT
  USING (true);

-- Sadece admin/moderator yazabilir
CREATE POLICY "acil_rehber_admin_yazar"
  ON acil_rehber FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'moderator')
    )
  );

-- 4) Seed Data
INSERT INTO acil_rehber (kategori, isim, numara, goruntu, aciklama, sira) VALUES
  -- Turizm Polisi (one cikan)
  ('turizm_polisi', 'Turizm Polisi', '02125274503', '0212 527 45 03', 'Turistlere yonelik guvenlik birimi', 1),

  -- Acil Numaralar
  ('acil_numara', 'Ambulans', '112', NULL, NULL, 1),
  ('acil_numara', 'Itfaiye', '110', NULL, NULL, 2),
  ('acil_numara', 'Polis', '155', NULL, NULL, 3),
  ('acil_numara', 'Jandarma', '156', NULL, NULL, 4),
  ('acil_numara', 'Deniz Kurtarma', '158', NULL, NULL, 5),

  -- Meslek Kuruluslari
  ('meslek_kurulusu', 'Istanbul Rehberler Odasi (IRO)', '02122920520', '0212 292 05 20', NULL, 1),
  ('meslek_kurulusu', 'Turist Rehberleri Odalari Birligi (TUREB)', '03124170392', '0312 417 03 92', NULL, 2),
  ('meslek_kurulusu', 'Istanbul Il Kultur ve Turizm Mudurlugu', '02125183600', '0212 518 36 00', NULL, 3),
  ('meslek_kurulusu', 'IBB Turizm Danisma Ofisi', '02124554400', '0212 455 44 00', NULL, 4),

  -- Faydali Linkler
  ('faydali_link', 'Nobetci Eczane (Istanbul)', NULL, NULL, NULL, 1),
  ('faydali_link', 'Muze ve Oren Yerleri (muze.gov.tr)', NULL, NULL, NULL, 2);

-- Linkleri ayri guncelle (URL'ler INSERT'te sorun cikartabiliyor)
UPDATE acil_rehber SET url = 'https://www.eczaneler.gen.tr/nobetci-istanbul'
  WHERE kategori = 'faydali_link' AND isim LIKE '%Eczane%';
UPDATE acil_rehber SET url = 'https://muze.gov.tr'
  WHERE kategori = 'faydali_link' AND isim LIKE '%muze.gov.tr%';
