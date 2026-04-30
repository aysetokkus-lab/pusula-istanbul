-- ═══════════════════════════════════════════════════════
-- Saha Bildirimi Sabitleme Ozelligi
-- Admin tarafindan sabitlenen bildirimler 2 saat suresinden muaf tutulur
-- ve admin kaldirina kadar gorunur kalir.
-- ═══════════════════════════════════════════════════════

-- 1. canli_durum tablosuna sabitlendi kolonu ekle
ALTER TABLE canli_durum
ADD COLUMN IF NOT EXISTS sabitlendi BOOLEAN DEFAULT false;

-- 2. Sabitlenmis bildirimleri hizli sorgulamak icin index
CREATE INDEX IF NOT EXISTS idx_canli_durum_sabitlendi
ON canli_durum (sabitlendi)
WHERE sabitlendi = true AND gecerli_mi = true;

-- Not: Bu SQL'i Supabase SQL Editor'de calistirin.
-- Mevcut tum bildirimler varsayilan olarak sabitlendi=false olacaktir.
