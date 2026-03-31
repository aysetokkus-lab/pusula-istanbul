-- =====================================================
-- acil_rehber tablosundaki Turkce karakter duzeltmeleri
-- Supabase SQL Editor'de calistirin
-- =====================================================

-- Itfaiye → İtfaiye
UPDATE acil_rehber SET isim = 'İtfaiye' WHERE isim ILIKE '%tfaiye%';

-- Istanbul Rehberler Odasi → İstanbul Rehberler Odası (İRO)
UPDATE acil_rehber SET isim = 'İstanbul Rehberler Odası (İRO)' WHERE isim ILIKE '%stanbul rehberler%';

-- TUREB / Turist Rehberleri Odalari Birligi → Turist Rehberleri Odaları Birliği (TUREB)
UPDATE acil_rehber SET isim = 'Turist Rehberleri Odaları Birliği (TUREB)' WHERE isim ILIKE '%tureb%' OR isim ILIKE '%rehberler%birli%';

-- Istanbul Il Kultur ve Turizm Mudurlugu → İstanbul İl Kültür ve Turizm Müdürlüğü
UPDATE acil_rehber SET isim = 'İstanbul İl Kültür ve Turizm Müdürlüğü' WHERE isim ILIKE '%kultur%turizm%mudurlugu%' OR isim ILIKE '%kültür%turizm%müdürlüğü%';

-- IBB Turizm Danisma Ofisi → İBB Turizm Danışma Ofisi
UPDATE acil_rehber SET isim = 'İBB Turizm Danışma Ofisi' WHERE isim ILIKE '%bb turizm%' OR isim ILIKE '%danisma ofisi%' OR isim ILIKE '%danışma ofisi%';

-- Nobetci Eczane → Nöbetçi Eczane
UPDATE acil_rehber SET isim = 'Nöbetçi Eczane' WHERE isim ILIKE '%nobetci%' OR isim ILIKE '%nöbetçi%';

-- Muze ve Oren Yerleri → Müze ve Ören Yerleri
UPDATE acil_rehber SET isim = 'Müze ve Ören Yerleri' WHERE isim ILIKE '%muze%oren%' OR isim ILIKE '%müze%ören%';

-- Turizm Polisi aciklama duzeltmesi (eger varsa)
UPDATE acil_rehber SET aciklama = 'Turistlere yönelik güvenlik birimi' WHERE isim ILIKE '%turizm polisi%' AND aciklama IS NOT NULL;

-- Deniz Kurtarma → kontrol (zaten dogru olabilir)
UPDATE acil_rehber SET isim = 'Deniz Kurtarma' WHERE isim ILIKE '%deniz kurtarma%';

-- Polis, Ambulans, Jandarma zaten ASCII-uyumlu, sorun yok

-- Sonucu kontrol et
SELECT id, kategori, isim, numara, goruntu, url FROM acil_rehber WHERE aktif = true ORDER BY sira;
