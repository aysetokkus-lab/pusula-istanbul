-- ═══════════════════════════════════════════════════════
-- Tüm saha_noktalari isimlerini Türkçe karakterlerle düzelt
-- Supabase Dashboard → SQL Editor'de çalıştırılacak
-- ═══════════════════════════════════════════════════════

-- Saraylar
UPDATE saha_noktalari SET isim = 'Beylerbeyi Sarayı' WHERE id = 'beylerbeyi';
UPDATE saha_noktalari SET isim = 'Dolmabahçe Sarayı' WHERE id = 'dolmabahce';
UPDATE saha_noktalari SET isim = 'Ihlamur Kasrı' WHERE id = 'ihlamur';
UPDATE saha_noktalari SET isim = 'Milli Saraylar Resim Müzesi' WHERE id = 'ms_resim';
UPDATE saha_noktalari SET isim = 'Topkapı Sarayı' WHERE id = 'topkapi';
UPDATE saha_noktalari SET isim = 'Yıldız Sarayı' WHERE id = 'yildiz';

-- Müzeler
UPDATE saha_noktalari SET isim = 'Arkeoloji Müzesi' WHERE id = 'arkeoloji';
UPDATE saha_noktalari SET isim = 'Askeri Müze' WHERE id = 'askeri';
UPDATE saha_noktalari SET isim = 'Ayasofya Camii (Galeri)' WHERE id = 'ayasofya';
UPDATE saha_noktalari SET isim = 'Deniz Müzesi' WHERE id = 'deniz';
UPDATE saha_noktalari SET isim = 'Dijital Deneyim Merkezi' WHERE id = 'dijital';
UPDATE saha_noktalari SET isim = 'Galata Kulesi' WHERE id = 'galata_kulesi';
UPDATE saha_noktalari SET isim = 'Galata Mevlevihanesi' WHERE id = 'mevlevihane';
UPDATE saha_noktalari SET isim = 'Kariye Camii' WHERE id = 'kariye';
UPDATE saha_noktalari SET isim = 'Kız Kulesi' WHERE id = 'kiz_kulesi';
UPDATE saha_noktalari SET isim = 'Miniatürk' WHERE id = 'miniaturk';
UPDATE saha_noktalari SET isim = 'Panorama 1453' WHERE id = 'panorama';
UPDATE saha_noktalari SET isim = 'Rumeli Hisarı' WHERE id = 'rumeli';
UPDATE saha_noktalari SET isim = 'Şerefiye Sarnıcı' WHERE id = 'serefiye';
UPDATE saha_noktalari SET isim = 'Tekfur Sarayı' WHERE id = 'tekfur';
UPDATE saha_noktalari SET isim = 'Türk & İslam Eserleri' WHERE id = 'tiem';
UPDATE saha_noktalari SET isim = 'Yedikule Hisarı' WHERE id = 'yedikule';
UPDATE saha_noktalari SET isim = 'Yerebatan Sarnıcı' WHERE id = 'yerebatan';

-- Özel Müzeler
UPDATE saha_noktalari SET isim = 'İRHM (MSGSÜ)' WHERE id = 'irhm';
UPDATE saha_noktalari SET isim = 'İstanbul Modern' WHERE id = 'ist_modern';
UPDATE saha_noktalari SET isim = 'Masumiyet Müzesi' WHERE id = 'masumiyet';
UPDATE saha_noktalari SET isim = 'Pera Müzesi' WHERE id = 'pera';
UPDATE saha_noktalari SET isim = 'Rahmi Koç Müzesi' WHERE id = 'rahmi_koc';
UPDATE saha_noktalari SET isim = 'Sakıp Sabancı Müzesi' WHERE id = 'sakip_sabanci';

-- Camiler
UPDATE saha_noktalari SET isim = 'Sultanahmet Camii' WHERE id = 'sultanahmet_camii';

-- Diğer
UPDATE saha_noktalari SET isim = 'Galataport' WHERE id = 'galataport';

-- Kontrol: Güncel isimleri listele
SELECT id, isim FROM saha_noktalari ORDER BY sira;
