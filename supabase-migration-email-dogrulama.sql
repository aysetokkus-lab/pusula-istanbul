-- ═══════════════════════════════════════════
-- Pusula Istanbul — Email Doğrulama Migration
-- ─────────────────────────────────────────
-- Bu dosyayı Supabase SQL Editor'de çalıştır.
--
-- AYRICA Supabase Dashboard'dan şu adımları yap:
-- 1. Authentication > Providers > Email > "Confirm email" → AÇIK yap
-- 2. Authentication > Email Templates > "Confirm signup" şablonunu
--    aşağıdaki Türkçe versiyonla değiştir
-- ═══════════════════════════════════════════

-- Trigger: Yeni kullanıcı kaydında profil otomatik oluşturma
-- (Email doğrulama açıkken session olmayabilir, RLS engeller.
--  Bu trigger auth.users INSERT'inde çalışır, RLS'i bypass eder.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, isim, soyisim, sehir, ruhsat_no)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'isim', ''),
    COALESCE(NEW.raw_user_meta_data->>'soyisim', ''),
    'İstanbul',
    NEW.raw_user_meta_data->>'ruhsat_no'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger'ı bağla (varsa sil, yeniden oluştur)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════
-- SUPABASE DASHBOARD AYARLARI (MANUEL YAPILACAK)
-- ═══════════════════════════════════════════
--
-- 1. Authentication > Providers > Email:
--    - "Confirm email" → AÇIK (toggle on)
--    - "Double confirm email changes" → İsteğe bağlı
--    - "Secure email change" → İsteğe bağlı
--
-- 2. Authentication > Email Templates > "Confirm signup":
--    Subject: Pusula İstanbul — E-posta Doğrulama
--    Body (HTML):
--
--    <h2>Pusula İstanbul'a Hoş Geldiniz!</h2>
--    <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
--    <p><a href="{{ .ConfirmationURL }}">E-postamı Doğrula</a></p>
--    <p>Bu bağlantı 24 saat geçerlidir.</p>
--    <p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı dikkate almayın.</p>
--    <br>
--    <p style="color: #666; font-size: 12px;">Pusula İstanbul — Profesyonel Turist Rehberinin Dijital Asistanı</p>
--
-- 3. Authentication > URL Configuration:
--    - Site URL: pusulaistanbul://  (deep link scheme)
--    - Redirect URLs: pusulaistanbul://**  (wildcard)
--
-- ═══════════════════════════════════════════
