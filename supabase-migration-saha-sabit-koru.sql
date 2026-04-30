-- =================================================================
-- SABİT BİLDİRİMLER OTOMATİK TEMİZLİKTEN MUAF
-- =================================================================
-- Sorun: eskiyen_durumlari_kaldir() fonksiyonu (her dakika cron ile
-- çalışıyor) 2 saatten eski TÜM bildirimleri gecerli_mi=false yapıyordu.
-- Admin tarafından sabitlenmiş bildirimleri de kapsadığı için, admin
-- "sabitledim" sandığı bildirim 2 saat sonra otomatik kayboluyordu.
--
-- Çözüm: WHERE clause'a sabitlendi=false koşulunu ekle. Sabit
-- bildirimleri bu otomatik temizlik atlasın, sadece admin "Sabiti
-- Kaldır" + "Kaldır" diziliminden geçerse kayboluşunlar.
-- =================================================================

CREATE OR REPLACE FUNCTION eskiyen_durumlari_kaldir()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE canli_durum
  SET gecerli_mi = false
  WHERE gecerli_mi = true
    AND COALESCE(sabitlendi, false) = false  -- Sabit olanlari atla
    AND created_at < now() - INTERVAL '2 hours';
END;
$$;

-- Doğrulama (manuel test için):
-- 1) Bir bildirim ekle, admin panelden sabitle (sabitlendi=true).
-- 2) Bildirimin created_at'ini 3 saat geriye al:
--    UPDATE canli_durum SET created_at = now() - INTERVAL '3 hours' WHERE id = '<id>';
-- 3) Manuel olarak temizleme fonksiyonunu çalıştır:
--    SELECT eskiyen_durumlari_kaldir();
-- 4) Sabit bildirim hâlâ aktif (gecerli_mi=true) olmalı.
