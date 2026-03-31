-- ═══════════════════════════════════════════════════════
-- Pusula İstanbul — Abonelik Sistemi Migration
-- Profiles tablosuna abonelik kolonları eklenir.
-- Supabase SQL Editor'da çalıştırın.
-- ═══════════════════════════════════════════════════════

-- 1. Abonelik kolonlarını ekle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS abonelik_durumu TEXT DEFAULT 'deneme'
  CHECK (abonelik_durumu IN ('deneme', 'aktif', 'iptal', 'suresi_dolmus')),
ADD COLUMN IF NOT EXISTS abonelik_bitis TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS abonelik_plani TEXT
  CHECK (abonelik_plani IN ('aylik', 'yillik')),
ADD COLUMN IF NOT EXISTS revenuecat_id TEXT;

-- 2. Mevcut kullanıcıların deneme süresini ayarla
-- (Kayıt tarihi + 7 gün otomatik olarak hook'ta hesaplanır,
--  bu kolon sadece RevenueCat aktifleşince kullanılacak)

-- 3. Admin kullanıcıları için abonelik durumunu 'aktif' yap
UPDATE profiles
SET abonelik_durumu = 'aktif'
WHERE rol IN ('admin', 'moderator');

-- 4. İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_abonelik
ON profiles (abonelik_durumu);

-- ═══════════════════════════════════════════════════════
-- NOT: RevenueCat entegre edildiğinde, webhook ile
-- abonelik_durumu ve abonelik_bitis otomatik güncellenecek.
-- Şu an deneme süresi kullanıcının created_at'inden hesaplanır.
-- ═══════════════════════════════════════════════════════
