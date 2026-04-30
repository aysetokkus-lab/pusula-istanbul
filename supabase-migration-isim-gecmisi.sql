-- =============================================
-- ISIM GECMISI TABLOSU
-- Kullanici isim degisikliklerini kayit altina alir
-- Ayda en fazla 1 degisiklik siniri uygulamada kontrol edilir
-- =============================================

-- Tablo olustur
CREATE TABLE IF NOT EXISTS isim_gecmisi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eski_isim TEXT NOT NULL,
  eski_soyisim TEXT NOT NULL,
  yeni_isim TEXT NOT NULL,
  yeni_soyisim TEXT NOT NULL,
  degistirilme_tarihi TIMESTAMPTZ DEFAULT now()
);

-- Index: kullanici bazli hizli sorgulama
CREATE INDEX IF NOT EXISTS idx_isim_gecmisi_kullanici ON isim_gecmisi(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_isim_gecmisi_tarih ON isim_gecmisi(degistirilme_tarihi DESC);

-- RLS aktif et
ALTER TABLE isim_gecmisi ENABLE ROW LEVEL SECURITY;

-- Kullanici sadece kendi gecmisine INSERT yapabilir
CREATE POLICY "Kullanici kendi isim degisikligini kaydedebilir"
  ON isim_gecmisi FOR INSERT
  WITH CHECK (auth.uid() = kullanici_id);

-- Kullanici kendi gecmisini gorebilir
CREATE POLICY "Kullanici kendi isim gecmisini gorebilir"
  ON isim_gecmisi FOR SELECT
  USING (auth.uid() = kullanici_id);

-- Admin tum gecmisleri gorebilir
CREATE POLICY "Admin tum isim gecmisini gorebilir"
  ON isim_gecmisi FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );

-- Realtime (admin panelde anlik takip icin)
ALTER PUBLICATION supabase_realtime ADD TABLE isim_gecmisi;
