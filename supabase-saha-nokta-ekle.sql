-- ═══════════════════════════════════════════════════════════════
-- SAHA NOKTALARI — Eksik Noktalar + Genel Duyuru + Kategori Fix
-- Supabase SQL Editor'de calistir
-- Tarih: 25 Nisan 2026
-- ═══════════════════════════════════════════════════════════════

-- 1) GENEL DUYURU — en basta (sira: 0)
INSERT INTO saha_noktalari (id, isim, emoji, kategori, aktif, sira)
VALUES ('genel_duyuru', 'Genel Duyuru', '', 'genel', true, 0)
ON CONFLICT (id) DO NOTHING;

-- 2) EKSIK 7 MUZE — mekan_saatleri'nde var ama saha_noktalari'nda yok
INSERT INTO saha_noktalari (id, isim, emoji, kategori, aktif, sira) VALUES
  ('havalimani_muze', 'İstanbul Havalimanı Müzesi', '', 'muze', true, 27),
  ('islam_bilim', 'İslam Bilim ve Teknoloji Tarihi Müzesi', '', 'muze', true, 28),
  ('mehmet_akif', 'Mehmet Akif Ersoy Hatıra Evi', '', 'muze', true, 29),
  ('hafiza_15_temmuz', 'Hafıza 15 Temmuz Müzesi', '', 'muze', true, 30),
  ('adam_mickiewicz', 'Adam Mickiewicz Müzesi', '', 'muze', true, 31),
  ('turbeler_muze', 'Türbeler Müzesi', '', 'muze', true, 32),
  ('sinema_muze', 'Sinema Müzesi', '', 'muze', true, 33)
ON CONFLICT (id) DO NOTHING;

-- 3) KATEGORİ DÜZELTMESİ — Ayasofya ve Kariye artık cami
UPDATE saha_noktalari SET kategori = 'cami' WHERE id = 'ayasofya';
UPDATE saha_noktalari SET kategori = 'cami' WHERE id = 'kariye';

-- 4) ÖZEL MÜZE SIRA KAYDIRMASI — yeni müzeler 27-33 aldı, özel müzeler 34'ten başlasın
UPDATE saha_noktalari SET sira = 34 WHERE id = 'irhm';
UPDATE saha_noktalari SET sira = 35 WHERE id = 'ist_modern';
UPDATE saha_noktalari SET sira = 36 WHERE id = 'masumiyet';
UPDATE saha_noktalari SET sira = 37 WHERE id = 'pera';
UPDATE saha_noktalari SET sira = 38 WHERE id = 'rahmi_koc';
UPDATE saha_noktalari SET sira = 39 WHERE id = 'sabanci';
UPDATE saha_noktalari SET sira = 40 WHERE id = 'sadberk';
UPDATE saha_noktalari SET sira = 41 WHERE id = 'salt';
UPDATE saha_noktalari SET sira = 42 WHERE id = 'santral';

-- 5) CAMİ SIRASI — Sultanahmet + Ayasofya + Kariye birlikte
UPDATE saha_noktalari SET sira = 44 WHERE id = 'sultanahmet_camii';
UPDATE saha_noktalari SET sira = 45 WHERE id = 'ayasofya';
UPDATE saha_noktalari SET sira = 46 WHERE id = 'kariye';

-- ═══ KONTROL SORGUSU ═══
-- Calistirdiktan sonra asagidaki sorguyu calistirarak dogrula:
-- SELECT id, isim, kategori, sira, aktif FROM saha_noktalari WHERE aktif = true ORDER BY sira;
