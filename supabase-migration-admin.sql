-- ============================================================
-- PUSULA REHBER — Admin Panel & Moderasyon Migration
-- ============================================================
-- Bu migration şunları oluşturur:
--   1. profiles tablosuna 'rol' kolonu (admin/moderator/user)
--   2. kufur_listesi tablosu (otomatik küfür filtresi)
--   3. raporlanan_mesajlar tablosu (şüpheli mesaj kuyruğu)
--   4. banlanan_kullanicilar tablosu
--   5. RLS politikaları
-- ============================================================

-- 1. PROFİLLERE ROL KOLONU EKLE
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'user'
  CHECK (rol IN ('admin', 'moderator', 'user'));

-- İlk admin'i ata (Ayşe'nin hesabı — email ile bul)
UPDATE profiles
SET rol = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'ayse.tokkus@gmail.com'
  LIMIT 1
);

-- 2. KÜFÜR LİSTESİ TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS kufur_listesi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kelime TEXT NOT NULL UNIQUE,
  seviye TEXT DEFAULT 'kesin' CHECK (seviye IN ('kesin', 'suphe')),
  -- 'kesin' = direkt engelle, 'suphe' = admin kuyruğuna düşür
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Türkçe temel küfür listesi (yaygın olanlar)
INSERT INTO kufur_listesi (kelime, seviye) VALUES
  ('amk', 'kesin'),
  ('aq', 'kesin'),
  ('orospu', 'kesin'),
  ('piç', 'kesin'),
  ('siktirgit', 'kesin'),
  ('siktir', 'kesin'),
  ('sikerim', 'kesin'),
  ('yarrak', 'kesin'),
  ('götveren', 'kesin'),
  ('pezevenk', 'kesin'),
  ('kahpe', 'kesin'),
  ('gavat', 'kesin'),
  ('ibne', 'kesin'),
  ('amcık', 'kesin'),
  ('oç', 'kesin'),
  ('mk', 'suphe'),
  ('salak', 'suphe'),
  ('gerizekalı', 'suphe'),
  ('aptal', 'suphe'),
  ('mal', 'suphe'),
  ('dangalak', 'suphe')
ON CONFLICT (kelime) DO NOTHING;

-- 3. RAPORLANAN MESAJLAR TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS raporlanan_mesajlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesaj_id UUID NOT NULL,
  mesaj_metni TEXT NOT NULL,
  mesaj_sahibi_id UUID REFERENCES auth.users(id),
  mesaj_sahibi_isim TEXT,
  raporlayan_id UUID REFERENCES auth.users(id),
  -- raporlayan NULL ise otomatik filtre tarafından yakalanmış
  sebep TEXT DEFAULT 'kufur' CHECK (sebep IN ('kufur', 'spam', 'uygunsuz', 'diger')),
  otomatik BOOLEAN DEFAULT false,
  -- otomatik = true ise küfür filtresi yakalamış
  durum TEXT DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'onaylandi', 'reddedildi', 'silindi')),
  -- bekliyor: henüz incelenmedi
  -- onaylandi: mesaj uygun, rapor reddedildi
  -- reddedildi: mesaj uygunsuz ama silinmedi (uyarı verildi)
  -- silindi: mesaj silindi
  islem_yapan_id UUID REFERENCES auth.users(id),
  islem_notu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  islem_tarihi TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rapor_durum
  ON raporlanan_mesajlar(durum, created_at DESC);

-- 4. BANLANAN KULLANICILAR TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS banlanan_kullanicilar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID NOT NULL REFERENCES auth.users(id),
  sebep TEXT NOT NULL,
  banlayan_id UUID REFERENCES auth.users(id),
  sure_dk INTEGER,
  -- NULL = kalıcı ban, sayı = geçici ban (dakika)
  bitis_tarihi TIMESTAMPTZ,
  -- NULL = kalıcı, tarih = geçici ban bitiş
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ban_kullanici
  ON banlanan_kullanicilar(kullanici_id, aktif);

-- Not: Geçici banların otomatik kaldırılması uygulama tarafında kontrol edilir
-- (bitis_tarihi < now() kontrolü ile)

-- 5. RLS POLİTİKALARI
-- ============================================================

-- kufur_listesi: Herkes okuyabilir (filtre için), sadece admin yazabilir
ALTER TABLE kufur_listesi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kufur_herkes_oku" ON kufur_listesi
  FOR SELECT USING (true);

CREATE POLICY "kufur_admin_yaz" ON kufur_listesi
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'moderator')
    )
  );

-- raporlanan_mesajlar: Admin/mod okur-yazar, normal kullanıcı sadece rapor ekler
ALTER TABLE raporlanan_mesajlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rapor_admin_oku" ON raporlanan_mesajlar
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'moderator')
    )
  );

CREATE POLICY "rapor_herkes_ekle" ON raporlanan_mesajlar
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rapor_admin_guncelle" ON raporlanan_mesajlar
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'moderator')
    )
  );

-- banlanan_kullanicilar: Admin/mod tam erişim, herkes okuyabilir (ban kontrolü için)
ALTER TABLE banlanan_kullanicilar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ban_herkes_oku" ON banlanan_kullanicilar
  FOR SELECT USING (true);

CREATE POLICY "ban_admin_yaz" ON banlanan_kullanicilar
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'moderator')
    )
  );

-- 6. ADMIN KONTROL FONKSİYONU
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_or_mod()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND rol IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. SOHBET MESAJLARINI SİLME İZNİ (admin/mod için)
-- ============================================================
-- Mevcut RLS'ye admin silme politikası ekle
DO $$
BEGIN
  -- Eğer sohbet_mesajlari tablosu varsa silme politikası ekle
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sohbet_mesajlari') THEN
    EXECUTE 'CREATE POLICY "admin_mesaj_sil" ON sohbet_mesajlari
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.rol IN (''admin'', ''moderator'')
        )
      )';
  END IF;
END $$;
