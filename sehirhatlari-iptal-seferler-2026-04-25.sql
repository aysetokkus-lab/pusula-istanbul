-- ═══════════════════════════════════════════════════════════════
-- Şehir Hatları İptal Sefer Senkronizasyonu — 25 Nisan 2026 11:11 UTC
-- ═══════════════════════════════════════════════════════════════
-- Kaynak: https://sehirhatlari.istanbul/tr/iptal-seferler
--
-- NOT: Scheduled task (sehir-hatlari-iptal-takip) bu kaydı anon key
-- ile UPSERT etmeye çalıştı, RLS engelledi:
--   "new row violates row-level security policy for table ulasim_uyarilari"
--
-- Mevcut RLS politikası sadece service_role veya admin/moderator yazımına izin veriyor.
-- Aşağıdaki SQL'i Supabase SQL Editor'de (admin oturumla) çalıştırın
-- VEYA dipte önerilen kalıcı çözüm RLS güncellemesini uygulayın.
-- ═══════════════════════════════════════════════════════════════

-- 1) Bu çalışmadaki duyuru — 23 Nisan 2026 Yat Yarışları İptal Seferler
INSERT INTO ulasim_uyarilari (tweet_id, kaynak, icerik, hat, tip, aktif, tarih)
VALUES (
  'sh:c1fa6cfc4a3bcddb',
  'web:sehirhatlari',
  '23 Nisan 2026 Cumhurbaşkanlığı 7. Uluslararası Yat Yarışları sebebiyle İstanbul Boğazı deniz trafiğine kapatıldı. İptal edilen hatlar: Anadolukavağı-Üsküdar, Üsküdar-Anadolukavağı, Rumelikavağı-Eminönü, Eminönü-Rumelikavağı, Kadıköy-Üsküdar-Ortaköy, Çengelköy-Kabataş, Üsküdar-Aşiyan, Eminönü-Beşiktaş-Ortaköy hatları ile Uzun ve Kısa Boğaz Turları.',
  'Boğaz Hatları',
  'kesinti',
  TRUE,
  NOW()
)
ON CONFLICT (tweet_id) DO UPDATE
SET
  icerik = EXCLUDED.icerik,
  hat    = EXCLUDED.hat,
  tip    = EXCLUDED.tip,
  aktif  = TRUE;

-- 2) Sayfada artık olmayan eski web:sehirhatlari duyurularını pasifle
UPDATE ulasim_uyarilari
SET aktif = FALSE
WHERE kaynak = 'web:sehirhatlari'
  AND aktif = TRUE
  AND tweet_id NOT IN ('sh:c1fa6cfc4a3bcddb');

-- 3) Doğrulama sorgusu
SELECT tweet_id, hat, tip, aktif, LEFT(icerik, 100) AS ozet, tarih
FROM ulasim_uyarilari
WHERE kaynak = 'web:sehirhatlari'
ORDER BY tarih DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- KALICI ÇÖZÜM (önerilir) — RLS politikasına web kaynağı izni ekle
-- ═══════════════════════════════════════════════════════════════
-- Aşağıdaki politikaları çalıştırırsanız scheduled task anon key ile
-- doğrudan upsert yapabilir; her seferinde manuel SQL gerekmez.
--
-- DROP POLICY IF EXISTS "ulasim_uyarilari_web_scraper_yazar" ON ulasim_uyarilari;
-- CREATE POLICY "ulasim_uyarilari_web_scraper_yazar" ON ulasim_uyarilari
--   FOR INSERT WITH CHECK (kaynak LIKE 'web:%');
--
-- DROP POLICY IF EXISTS "ulasim_uyarilari_web_scraper_gunceller" ON ulasim_uyarilari;
-- CREATE POLICY "ulasim_uyarilari_web_scraper_gunceller" ON ulasim_uyarilari
--   FOR UPDATE USING (kaynak LIKE 'web:%')
--   WITH CHECK (kaynak LIKE 'web:%');
--
-- Alternatif: scheduled task config'ine SUPABASE_SERVICE_ROLE_KEY env var ekleyin.
-- ═══════════════════════════════════════════════════════════════
