-- =================================================================
-- ADMIN/MODERATOR — canli_durum tablosunda BAŞKASININ bildirimini
-- güncelleme yetkisi
-- =================================================================
-- Sorun: Admin panelden "Kaldır" butonu çalışmıyordu çünkü mevcut
-- RLS policy'si sadece bildirimi yapan kullanıcının kendi
-- bildirimini güncellemesine izin veriyordu. Admin başka birinin
-- bildirimini gecerli_mi=false yapamıyordu (UPDATE silently fail).
--
-- Çözüm: is_admin_or_mod() koşulu ile ikinci bir UPDATE policy'si
-- ekliyoruz. RLS'de policy'ler OR ile birleşir, yani:
--   - Kullanıcı kendi bildirimini güncelleyebilir (mevcut policy)
--   - VEYA admin/moderator olabilir (yeni policy)
-- =================================================================

-- Önceden eklenmemiş olduğunu kontrol et — idempotent yapalım
DROP POLICY IF EXISTS "canli_durum_admin_gunceller" ON canli_durum;

CREATE POLICY "canli_durum_admin_gunceller" ON canli_durum
  FOR UPDATE USING (is_admin_or_mod());

-- Doğrulama (manuel test için):
-- 1) Admin olarak başka bir kullanıcının bildirimini gecerli_mi=false yap:
--    UPDATE canli_durum SET gecerli_mi = false WHERE id = '<bildirim_id>';
-- 2) Etki: 1 row affected dönmeli (eskiden 0 dönüyordu).
-- 3) Admin paneldeki liste ve ana sayfadaki saha durumu paneli
--    realtime subscription ile otomatik güncellenecek.
