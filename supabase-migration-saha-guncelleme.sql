-- ═══════════════════════════════════════════════════════
-- Saha Bildirimi Guncelleme — Tek Seferde Calistir
-- 1. Yeni durum tipleri (erken_kapanis, gec_acilis)
-- 2. Sabitleme kolonu (sabitlendi)
-- 3. View guncelleme
-- ═══════════════════════════════════════════════════════

-- 1. CHECK constraint'i kaldir ve yenisini ekle
ALTER TABLE canli_durum DROP CONSTRAINT IF EXISTS canli_durum_durum_check;
ALTER TABLE canli_durum ADD CONSTRAINT canli_durum_durum_check
  CHECK (durum IN ('normal', 'kuyruk', 'yogun_kuyruk', 'kismi_kapali', 'kapali', 'restorasyon', 'erken_kapanis', 'gec_acilis'));

-- 2. sabitlendi kolonu ekle
ALTER TABLE canli_durum
ADD COLUMN IF NOT EXISTS sabitlendi BOOLEAN DEFAULT false;

-- 3. Sabitlenmis bildirimleri hizli sorgulamak icin index
CREATE INDEX IF NOT EXISTS idx_canli_durum_sabitlendi
ON canli_durum (sabitlendi)
WHERE sabitlendi = true AND gecerli_mi = true;

-- 4. Eski view'i sil ve yeniden olustur (kolon degisikligi nedeniyle DROP gerekli)
DROP VIEW IF EXISTS v_canli_durum;
CREATE VIEW v_canli_durum AS
SELECT
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
  cd.sabitlendi,
  EXTRACT(EPOCH FROM (now() - cd.created_at)) / 60.0 AS dakika_once
FROM canli_durum cd
JOIN saha_noktalari sn ON sn.id = cd.nokta_id
LEFT JOIN profiles p ON p.id = cd.kullanici_id
WHERE cd.gecerli_mi = true
  AND (
    cd.sabitlendi = true
    OR cd.created_at > now() - interval '2 hours'
  )
ORDER BY cd.sabitlendi DESC, cd.created_at DESC;

-- Bitti! Artik erken_kapanis ve gec_acilis bildirimleri calisacak.
