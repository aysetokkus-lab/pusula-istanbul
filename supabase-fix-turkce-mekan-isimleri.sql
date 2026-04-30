-- ═══════════════════════════════════════════
-- Pusula Istanbul — Mekân İsimleri Türkçe Karakter Düzeltme
-- ─────────────────────────────────────────
-- Bu dosyayı Supabase SQL Editor'de çalıştır.
-- mekan_saatleri tablosundaki bozuk Türkçe karakterleri düzeltir.
-- ═══════════════════════════════════════════

-- Müze isimleri
UPDATE mekan_saatleri SET isim = 'Sabancı Müzesi' WHERE isim ILIKE '%sabanci%muzesi%' OR isim ILIKE '%sabanci%müzesi%';
UPDATE mekan_saatleri SET isim = 'Sadberk Hanım Müzesi' WHERE isim ILIKE '%sadberk%hanim%' OR isim ILIKE '%sadberk%hanım%muzesi%';
UPDATE mekan_saatleri SET isim = 'Arkeoloji Müzesi' WHERE isim ILIKE '%arkeoloji%muzesi%';
UPDATE mekan_saatleri SET isim = 'Askeri Müze' WHERE isim ILIKE '%askeri%muze' AND isim NOT LIKE '%Müze%';
UPDATE mekan_saatleri SET isim = 'Deniz Müzesi' WHERE isim ILIKE '%deniz%muzesi%';
UPDATE mekan_saatleri SET isim = 'Masumiyet Müzesi' WHERE isim ILIKE '%masumiyet%muzesi%';
UPDATE mekan_saatleri SET isim = 'Pera Müzesi' WHERE isim ILIKE '%pera%muzesi%';
UPDATE mekan_saatleri SET isim = 'Rahmi Koç Müzesi' WHERE isim ILIKE '%rahmi%koc%muzesi%' OR isim ILIKE '%rahmi%koç%muzesi%';
UPDATE mekan_saatleri SET isim = 'Santralistanbul Enerji Müzesi' WHERE isim ILIKE '%santralistanbul%muzesi%' OR isim ILIKE '%santralistanbul%enerji%muzesi%';
UPDATE mekan_saatleri SET isim = 'Milli Saraylar Resim Müzesi' WHERE isim ILIKE '%milli%saray%resim%muzesi%';
UPDATE mekan_saatleri SET isim = 'İstanbul Modern' WHERE isim ILIKE '%istanbul%modern%' AND isim NOT LIKE '%İstanbul%';
UPDATE mekan_saatleri SET isim = 'İRHM (MSGSÜ)' WHERE isim ILIKE '%irhm%' AND isim NOT LIKE '%İRHM%';

-- Yeni eklenen 7 müze (12 Nisan 2026)
UPDATE mekan_saatleri SET isim = 'İstanbul Havalimanı Müzesi' WHERE isim ILIKE '%havalimani%muzesi%' OR isim ILIKE '%havalimanı%muzesi%';
UPDATE mekan_saatleri SET isim = 'İslam Bilim ve Teknoloji Tarihi Müzesi' WHERE isim ILIKE '%islam%bilim%muzesi%' OR isim ILIKE '%islam%bilim%teknoloji%';
UPDATE mekan_saatleri SET isim = 'Mehmet Akif Ersoy Hatıra Evi' WHERE isim ILIKE '%mehmet%akif%hatira%' OR isim ILIKE '%mehmet%akif%hatıra%';
UPDATE mekan_saatleri SET isim = 'Hafıza 15 Temmuz Müzesi' WHERE isim ILIKE '%hafiza%15%temmuz%' OR isim ILIKE '%hafıza%15%';
UPDATE mekan_saatleri SET isim = 'Adam Mickiewicz Müzesi' WHERE isim ILIKE '%adam%mickiewicz%muzesi%';
UPDATE mekan_saatleri SET isim = 'Türbeler Müzesi' WHERE isim ILIKE '%turbeler%muzesi%' OR isim ILIKE '%türbeler%muzesi%';
UPDATE mekan_saatleri SET isim = 'Sinema Müzesi' WHERE isim ILIKE '%sinema%muzesi%';

-- Çarşılar
UPDATE mekan_saatleri SET isim = 'Mısır Çarşısı' WHERE isim ILIKE '%misir%carsisi%' OR isim ILIKE '%mısır%carsisi%';
UPDATE mekan_saatleri SET isim = 'Arasta Çarşısı' WHERE isim ILIKE '%arasta%carsisi%' OR isim ILIKE '%arasta%çarsisi%';

-- Kaleler ve Kuleler
UPDATE mekan_saatleri SET isim = 'Rumeli Hisarı' WHERE isim ILIKE '%rumeli%hisari%' AND isim NOT LIKE '%Hisarı%';
UPDATE mekan_saatleri SET isim = 'Yedikule Hisarı' WHERE isim ILIKE '%yedikule%hisari%' AND isim NOT LIKE '%Hisarı%';
UPDATE mekan_saatleri SET isim = 'Galata Kulesi' WHERE isim ILIKE '%galata%kulesi%';
UPDATE mekan_saatleri SET isim = 'Kız Kulesi' WHERE isim ILIKE '%kiz%kulesi%' AND isim NOT LIKE '%Kız%';

-- Sarnıçlar
UPDATE mekan_saatleri SET isim = 'Yerebatan Sarnıcı' WHERE isim ILIKE '%yerebatan%sarnici%' OR isim ILIKE '%yerebatan%sarnıcı%';
UPDATE mekan_saatleri SET isim = 'Şerefiye Sarnıcı' WHERE isim ILIKE '%serefiye%sarnici%' OR isim ILIKE '%şerefiye%sarnici%';

-- Saraylar ve Kasırlar
UPDATE mekan_saatleri SET isim = 'Dolmabahçe Sarayı' WHERE isim ILIKE '%dolmabahce%sarayi%' OR isim ILIKE '%dolmabahçe%sarayi%';
UPDATE mekan_saatleri SET isim = 'Topkapı Sarayı' WHERE isim ILIKE '%topkapi%sarayi%' OR isim ILIKE '%topkapı%sarayi%';
UPDATE mekan_saatleri SET isim = 'Beylerbeyi Sarayı' WHERE isim ILIKE '%beylerbeyi%sarayi%' AND isim NOT LIKE '%Sarayı%';
UPDATE mekan_saatleri SET isim = 'Yıldız Sarayı' WHERE isim ILIKE '%yildiz%sarayi%' OR isim ILIKE '%yıldız%sarayi%';
UPDATE mekan_saatleri SET isim = 'Tekfur Sarayı' WHERE isim ILIKE '%tekfur%sarayi%' AND isim NOT LIKE '%Sarayı%';
UPDATE mekan_saatleri SET isim = 'Ihlamur Kasrı' WHERE isim ILIKE '%ihlamur%kasri%' AND isim NOT LIKE '%Kasrı%';

-- Diğer
UPDATE mekan_saatleri SET isim = 'Salt Galata / Beyoğlu' WHERE isim ILIKE '%salt%galata%beyoglu%' OR isim ILIKE '%salt%galata / beyoglu%';
UPDATE mekan_saatleri SET isim = 'Galata Mevlevihanesi' WHERE isim ILIKE '%galata%mevlevihane%';
UPDATE mekan_saatleri SET isim = 'Dijital Deneyim Merkezi' WHERE isim ILIKE '%dijital%deneyim%';
UPDATE mekan_saatleri SET isim = 'Panorama 1453' WHERE isim ILIKE '%panorama%1453%';
UPDATE mekan_saatleri SET isim = 'Miniatürk' WHERE isim ILIKE '%miniaturk%' AND isim NOT LIKE '%Miniatürk%';
UPDATE mekan_saatleri SET isim = 'Türk & İslam Eserleri' WHERE isim ILIKE '%turk%islam%eser%' OR (isim ILIKE '%türk%islam%eser%' AND isim NOT LIKE '%İslam%');
UPDATE mekan_saatleri SET isim = 'Ayasofya Camii (Galeri)' WHERE isim ILIKE '%ayasofya%camii%galeri%';
UPDATE mekan_saatleri SET isim = 'Kariye Camii' WHERE isim ILIKE '%kariye%camii%';
UPDATE mekan_saatleri SET isim = 'Sultanahmet Camii' WHERE isim ILIKE '%sultanahmet%camii%';

-- ═══════════════════════════════════════════
-- Aynı düzeltmeyi saha_noktalari tablosuna da uygula
-- ═══════════════════════════════════════════

UPDATE saha_noktalari SET isim = 'Sabancı Müzesi' WHERE isim ILIKE '%sabanci%muzesi%';
UPDATE saha_noktalari SET isim = 'Sadberk Hanım Müzesi' WHERE isim ILIKE '%sadberk%hanim%muzesi%';
UPDATE saha_noktalari SET isim = 'Mısır Çarşısı' WHERE isim ILIKE '%misir%carsisi%';
UPDATE saha_noktalari SET isim = 'Arasta Çarşısı' WHERE isim ILIKE '%arasta%carsisi%';
UPDATE saha_noktalari SET isim = 'Salt Galata / Beyoğlu' WHERE isim ILIKE '%salt%galata%beyoglu%';
UPDATE saha_noktalari SET isim = 'Rumeli Hisarı' WHERE isim ILIKE '%rumeli%hisari%' AND isim NOT LIKE '%Hisarı%';
UPDATE saha_noktalari SET isim = 'Yedikule Hisarı' WHERE isim ILIKE '%yedikule%hisari%' AND isim NOT LIKE '%Hisarı%';
UPDATE saha_noktalari SET isim = 'Yerebatan Sarnıcı' WHERE isim ILIKE '%yerebatan%sarnici%';
UPDATE saha_noktalari SET isim = 'Şerefiye Sarnıcı' WHERE isim ILIKE '%serefiye%sarnici%';
UPDATE saha_noktalari SET isim = 'Dolmabahçe Sarayı' WHERE isim ILIKE '%dolmabahce%sarayi%';
UPDATE saha_noktalari SET isim = 'Topkapı Sarayı' WHERE isim ILIKE '%topkapi%sarayi%';
UPDATE saha_noktalari SET isim = 'İstanbul Modern' WHERE isim ILIKE '%istanbul%modern%' AND isim NOT LIKE '%İstanbul%';

-- ═══════════════════════════════════════════
-- Sultanahmet Camii ozel_not: "kıyafet kuralı var" kısmını kaldır
-- ═══════════════════════════════════════════
UPDATE mekan_saatleri
SET ozel_not = REPLACE(ozel_not, ', kıyafet kuralı var', '')
WHERE isim ILIKE '%sultanahmet%camii%' AND ozel_not ILIKE '%kıyafet%';

UPDATE mekan_saatleri
SET ozel_not = REPLACE(ozel_not, ', kiyafet kurali var', '')
WHERE isim ILIKE '%sultanahmet%camii%' AND ozel_not ILIKE '%kiyafet%';

-- ═══════════════════════════════════════════
-- Sonucu kontrol et
-- ═══════════════════════════════════════════
SELECT mekan_id, isim, ozel_not FROM mekan_saatleri WHERE isim ILIKE '%sultanahmet%' ORDER BY isim;
