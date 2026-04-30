-- Supabase Demo Accounts Setup
-- Execute this SQL in Supabase SQL Editor
-- Date: April 15, 2026

-- IMPORTANT NOTES:
-- 1. Both user accounts must first be created via app registration (Supabase Auth)
--    This SQL only updates the profiles table
-- 2. UUIDs below are EXAMPLE values — replace with actual Supabase Auth user IDs
-- 3. To find the actual UUID for a registered user:
--    SELECT id, email FROM auth.users WHERE email = 'email@example.com';
-- 4. Then use those UUIDs in the UPDATE statements below

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================
-- 1. In the app, register BOTH accounts:
--    a) aysetokkus@hotmail.com / 123456
--    b) demo.test@pusulaistanbul.app / 123456
--
-- 2. In Supabase Dashboard, go to SQL Editor
--
-- 3. Run the following query to find the UUIDs:
--    SELECT id, email FROM auth.users WHERE email IN ('aysetokkus@hotmail.com', 'demo.test@pusulaistanbul.app');
--
-- 4. Copy the UUIDs and substitute in the UPDATE statements below
--
-- 5. Run the full SQL script below
--
-- ============================================================================

-- Update: Active Subscription Demo Account
-- Email: aysetokkus@hotmail.com / Password: 123456
-- This account has an ACTIVE subscription (paid, expires 2027)
-- REPLACE 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' with actual UUID from query above

UPDATE profiles
SET
  abonelik_durumu = 'aktif',
  abonelik_bitis = '2027-12-31'::TIMESTAMPTZ,
  abonelik_plani = 'yillik',
  revenuecat_id = 'revenuecat-aysetokkus',
  guncelleme_tarihi = NOW()
WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' AND email = 'aysetokkus@hotmail.com';

-- ============================================================================

-- Update: Expired/No Subscription Demo Account
-- Email: demo.test@pusulaistanbul.app / Password: 123456
-- This account has NO ACTIVE subscription (expired, shows free tier only)
-- REPLACE 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy' with actual UUID from query above

UPDATE profiles
SET
  abonelik_durumu = 'suresi_dolmus',
  abonelik_bitis = '2026-01-01'::TIMESTAMPTZ,
  abonelik_plani = NULL,
  revenuecat_id = NULL,
  guncelleme_tarihi = NOW()
WHERE id = 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy' AND email = 'demo.test@pusulaistanbul.app';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after the UPDATE statements to verify:

-- Check both demo accounts:
SELECT
  id,
  email,
  isim,
  soyisim,
  abonelik_durumu,
  abonelik_bitis,
  abonelik_plani,
  revenuecat_id,
  olusturulma_tarihi,
  guncelleme_tarihi
FROM profiles
WHERE email IN ('aysetokkus@hotmail.com', 'demo.test@pusulaistanbul.app')
ORDER BY email;

-- ============================================================================
-- DETAILED COLUMN REFERENCE
-- ============================================================================
-- abonelik_durumu (TEXT):
--   - 'aktif'        : User has valid paid subscription
--   - 'suresi_dolmus': Trial/subscription expired, no access to premium features
--   - 'iptal'        : Subscription cancelled by user
--   - NULL           : If using old schema (should not occur)
--
-- abonelik_bitis (TIMESTAMPTZ):
--   - 2027-12-31     : Active subscription lasting until end of 2027
--   - 2026-01-01     : Expired subscription (past date)
--   - NULL           : No subscription tracking needed
--
-- abonelik_plani (TEXT):
--   - 'aylik'        : Monthly subscription plan (₺99/month)
--   - 'yillik'       : Yearly subscription plan (₺699/year)
--   - NULL           : No active subscription
--
-- revenuecat_id (TEXT):
--   - RevenueCat customer ID (set when subscription purchased)
--   - NULL           : No RevenueCat history or subscription

-- ============================================================================
-- CLEANUP / RESTORE TO DEFAULT (if needed)
-- ============================================================================
-- To reset a demo account to free tier (no subscription):
--
-- UPDATE profiles
-- SET
--   abonelik_durumu = 'suresi_dolmus',
--   abonelik_bitis = NOW()::TIMESTAMPTZ,
--   abonelik_plani = NULL,
--   revenuecat_id = NULL,
--   guncelleme_tarihi = NOW()
-- WHERE email = 'aysetokkus@hotmail.com';
--
-- To restore to active subscription:
--
-- UPDATE profiles
-- SET
--   abonelik_durumu = 'aktif',
--   abonelik_bitis = '2027-12-31'::TIMESTAMPTZ,
--   abonelik_plani = 'yillik',
--   revenuecat_id = 'revenuecat-aysetokkus',
--   guncelleme_tarihi = NOW()
-- WHERE email = 'aysetokkus@hotmail.com';

-- ============================================================================
-- NOTES FOR APPLE REVIEW
-- ============================================================================
-- When submitting v1.0.3 to Apple App Store:
--
-- 1. Create BOTH demo accounts in Supabase before sending IPA to review
-- 2. Provide these credentials in the "App Review Information" section:
--
--    Account 1 (Premium):
--    Email: aysetokkus@hotmail.com
--    Password: 123456
--    Subscription: Active (expires 2027)
--    Expected behavior: All features unlock, no paywall
--
--    Account 2 (Free Tier):
--    Email: demo.test@pusulaistanbul.app
--    Password: 123456
--    Subscription: None (expired 2026-01-01)
--    Expected behavior: Free features work, premium features show paywall
--
-- 3. Include note: "Use Account 2 to test the IAP paywall and free tier features"
--
-- ============================================================================
