-- ═══════════════════════════════════════════════════════════════
-- Pusula Istanbul — Gemi Takvimi Tablosu
-- cruisetimetables.com verileri burada cache'lenir
-- Uygulama bu tablodan okur (brotli sorunu nedeniyle direkt fetch yapamaz)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gemi_takvimi (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gemi          TEXT NOT NULL,
  sirket        TEXT DEFAULT '',
  yolcu         INTEGER DEFAULT 0,
  tarih         DATE NOT NULL,
  gelis_saat    TEXT DEFAULT '',
  gidis_saat    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_gemi_tarih ON gemi_takvimi(tarih);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gemi_unique ON gemi_takvimi(gemi, tarih);

-- RLS
ALTER TABLE gemi_takvimi ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
DROP POLICY IF EXISTS "gemi_herkes_okur" ON gemi_takvimi;
CREATE POLICY "gemi_herkes_okur" ON gemi_takvimi
  FOR SELECT USING (true);

-- Admin yazabilir
DROP POLICY IF EXISTS "gemi_admin_yazar" ON gemi_takvimi;
CREATE POLICY "gemi_admin_yazar" ON gemi_takvimi
  FOR ALL USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin','moderator')
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE gemi_takvimi;
