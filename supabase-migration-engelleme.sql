-- ═══════════════════════════════════════════
-- KULLANICI ENGELLEME SISTEMI
-- Apple 1.2 UGC guideline — block abusive users
-- ═══════════════════════════════════════════

-- 1) Engellenen kullanicilar tablosu
CREATE TABLE IF NOT EXISTS engellenen_kullanicilar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engelleyen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engellenen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engellenen_isim TEXT,
  sebep TEXT,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  bildirildi BOOLEAN DEFAULT FALSE,
  UNIQUE (engelleyen_id, engellenen_id)
);

-- 2) Index'ler (hizli filtreleme icin)
CREATE INDEX IF NOT EXISTS idx_engelleyen ON engellenen_kullanicilar(engelleyen_id);
CREATE INDEX IF NOT EXISTS idx_engellenen ON engellenen_kullanicilar(engellenen_id);
CREATE INDEX IF NOT EXISTS idx_bildirildi ON engellenen_kullanicilar(bildirildi) WHERE bildirildi = FALSE;

-- 3) RLS aktive et
ALTER TABLE engellenen_kullanicilar ENABLE ROW LEVEL SECURITY;

-- 4) Policy: Kullanici sadece kendi engelleme listesini gorebilir
DROP POLICY IF EXISTS "Kendi engellemelerini gor" ON engellenen_kullanicilar;
CREATE POLICY "Kendi engellemelerini gor"
  ON engellenen_kullanicilar FOR SELECT
  USING (engelleyen_id = auth.uid());

-- 5) Policy: Kullanici sadece kendi adina engelleme ekleyebilir
DROP POLICY IF EXISTS "Kendi adina engelle" ON engellenen_kullanicilar;
CREATE POLICY "Kendi adina engelle"
  ON engellenen_kullanicilar FOR INSERT
  WITH CHECK (engelleyen_id = auth.uid());

-- 6) Policy: Kullanici kendi engellemesini kaldirabilir
DROP POLICY IF EXISTS "Kendi engellemesini kaldir" ON engellenen_kullanicilar;
CREATE POLICY "Kendi engellemesini kaldir"
  ON engellenen_kullanicilar FOR DELETE
  USING (engelleyen_id = auth.uid());

-- 7) Admin/moderator tum engellemeleri gorebilir
DROP POLICY IF EXISTS "Admin tum engellemeleri gor" ON engellenen_kullanicilar;
CREATE POLICY "Admin tum engellemeleri gor"
  ON engellenen_kullanicilar FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('admin', 'moderator')
    )
  );

-- 8) Admin bildirildi flag'ini guncelleyebilir
DROP POLICY IF EXISTS "Admin bildirimi isaretle" ON engellenen_kullanicilar;
CREATE POLICY "Admin bildirimi isaretle"
  ON engellenen_kullanicilar FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('admin', 'moderator')
    )
  );

-- 9) Realtime publication'a ekle (anlik feed guncellemesi icin)
ALTER PUBLICATION supabase_realtime ADD TABLE engellenen_kullanicilar;

-- ═══════════════════════════════════════════
-- KURULUM TAMAMLANDI
-- ═══════════════════════════════════════════
