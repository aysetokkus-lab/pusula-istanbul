-- ═══════════════════════════════════════════════════════════════
-- Pusula Istanbul — Ulaşım Uyarıları Tablosu
-- X (Twitter) API'den çekilen metro/tramvay/marmaray duyuruları
-- ═══════════════════════════════════════════════════════════════

-- 1. Tablo oluştur
CREATE TABLE IF NOT EXISTS ulasim_uyarilari (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id      TEXT UNIQUE,                          -- X tweet ID (duplikasyon engellemek için)
  icerik        TEXT NOT NULL,                         -- Tweet metni
  tip           TEXT DEFAULT 'bilgi'
                CHECK (tip IN ('ariza','kesinti','gecikme','bilgi','duyuru')),
  hat           TEXT DEFAULT 'Genel',                  -- M1, T1, T3, Marmaray, F4, vb.
  tarih         TIMESTAMPTZ DEFAULT now(),             -- Tweet tarihi
  aktif         BOOLEAN DEFAULT true,                  -- Gösterilsin mi
  kaynak        TEXT DEFAULT 'manuel',                 -- "x:metroistanbul", "x:Marmaraytcdd", "x:TCDDTasimacilik", "manuel"
  cozuldu       BOOLEAN DEFAULT false,                 -- Sorun çözüldü mü
  cozulme_tarihi TIMESTAMPTZ,                          -- Ne zaman çözüldü
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_ulasim_aktif ON ulasim_uyarilari(aktif, tarih DESC);
CREATE INDEX IF NOT EXISTS idx_ulasim_tweet ON ulasim_uyarilari(tweet_id);
CREATE INDEX IF NOT EXISTS idx_ulasim_hat ON ulasim_uyarilari(hat);

-- 3. RLS aktif et
ALTER TABLE ulasim_uyarilari ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (rehberler)
DROP POLICY IF EXISTS "ulasim_uyarilari_herkes_okur" ON ulasim_uyarilari;
CREATE POLICY "ulasim_uyarilari_herkes_okur" ON ulasim_uyarilari
  FOR SELECT USING (true);

-- Sadece admin/moderator yazabilir + uygulama service key ile
DROP POLICY IF EXISTS "ulasim_uyarilari_admin_yazar" ON ulasim_uyarilari;
CREATE POLICY "ulasim_uyarilari_admin_yazar" ON ulasim_uyarilari
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin','moderator')
    )
  );

-- Admin güncelleyebilir
DROP POLICY IF EXISTS "ulasim_uyarilari_admin_gunceller" ON ulasim_uyarilari;
CREATE POLICY "ulasim_uyarilari_admin_gunceller" ON ulasim_uyarilari
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin','moderator')
    )
  );

-- Admin silebilir
DROP POLICY IF EXISTS "ulasim_uyarilari_admin_siler" ON ulasim_uyarilari;
CREATE POLICY "ulasim_uyarilari_admin_siler" ON ulasim_uyarilari
  FOR DELETE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin','moderator')
    )
  );

-- 4. Realtime aç (bildirim hook'u dinliyor)
ALTER PUBLICATION supabase_realtime ADD TABLE ulasim_uyarilari;

-- 5. Otomatik temizlik: 7 günden eski çözülmüş uyarıları pasifleştir
-- (Bu bir cron job veya Edge Function ile çalıştırılabilir)
-- SELECT cron.schedule('temizle-eski-uyarilar', '0 4 * * *',
--   $$UPDATE ulasim_uyarilari SET aktif = false WHERE cozuldu = true AND cozulme_tarihi < now() - interval '7 days'$$
-- );
