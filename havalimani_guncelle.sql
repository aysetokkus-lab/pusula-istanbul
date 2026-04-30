-- ============================================================
-- HAVALİMANI SEFERLERİ GÜNCELLEME + TEMİZLİK
-- Supabase SQL Editor'de çalıştır
-- Tarih: 15 Nisan 2026
-- ============================================================

-- 1. YANLIŞ OLUŞTURULAN TABLOYU TEMİZLE
DROP TABLE IF EXISTS ulasim_tarife;

-- 2. HAVAİST FİYATLARINI GÜNCELLE (mevcut kayıtlar)

UPDATE havalimani_seferleri SET fiyat = '426₺', kaynak = 'bilet.hava.ist', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%taksim%';

UPDATE havalimani_seferleri SET fiyat = '384₺', kaynak = 'bilet.hava.ist', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%bakirkoy%';

UPDATE havalimani_seferleri SET fiyat = '420₺', kaynak = 'bilet.hava.ist', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%beylikduzu%';

UPDATE havalimani_seferleri SET fiyat = '355₺', kaynak = 'birgun.net (Ocak 2026)', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%aksaray%';

UPDATE havalimani_seferleri SET fiyat = '390₺', kaynak = 'birgun.net (Ocak 2026)', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%kadikoy%';

UPDATE havalimani_seferleri SET fiyat = '265₺', kaynak = 'birgun.net (Ocak 2026)', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND (durak_id ILIKE '%basaksehir%' OR durak_id ILIKE '%halkali%');

UPDATE havalimani_seferleri SET fiyat = '130₺', kaynak = 'birgun.net (Ocak 2026)', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%arnavutkoy%';

UPDATE havalimani_seferleri SET fiyat = '315₺', kaynak = 'birgun.net (Ocak 2026)', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%sultanahmet%';

-- 3. HAVABÜS FİYATLARI + SEFER SAATLERİ GÜNCELLE (jsonb formatında)

UPDATE havalimani_seferleri SET
  fiyat = '440₺',
  sure = '~90 dk',
  sehirden_hav = '["03:00","03:30","04:00","04:30","05:00","05:30","06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00"]'::jsonb,
  havdan_sehir = '["06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30","00:00","00:30"]'::jsonb,
  kaynak = 'havabus.com',
  tarife_donemi = 'Nisan 2026',
  guncelleme_tarihi = NOW()
WHERE firma = 'havabus' AND durak_id ILIKE '%taksim%';

UPDATE havalimani_seferleri SET
  fiyat = '270₺',
  sure = '~60 dk',
  sehirden_hav = '["03:15","04:15","04:45","05:15","06:00","06:45","07:30","08:15","09:00","09:45","10:30","11:15","12:00","12:45","13:30","14:15","15:00","15:45","16:30","17:15","18:00","18:45","19:30","20:15","21:00","21:45","22:30","23:15"]'::jsonb,
  havdan_sehir = '["05:45","06:30","07:00","07:45","08:30","09:15","10:00","10:45","11:30","12:15","13:00","13:45","14:30","15:15","16:00","16:45","17:30","18:15","19:00","19:45","20:30","21:15","22:00","22:45","23:30","00:30","01:00","01:30"]'::jsonb,
  kaynak = 'havabus.com',
  tarife_donemi = 'Nisan 2026',
  guncelleme_tarihi = NOW()
WHERE firma = 'havabus' AND durak_id ILIKE '%kadikoy%';

-- 4. BEŞİKTAŞ FİYAT GÜNCELLE (NULL idi)
UPDATE havalimani_seferleri SET fiyat = '426₺', kaynak = 'bilet.hava.ist', tarife_donemi = 'Nisan 2026', guncelleme_tarihi = NOW()
WHERE firma = 'havaist' AND durak_id ILIKE '%besiktas%';

-- 5. TEPEÜSTÜ DURAĞI SİL (anahat değil, 0 sefer)
DELETE FROM havalimani_seferleri WHERE durak_id ILIKE '%tepe%';

-- 6. DOĞRULAMA
SELECT firma, havalimani, durak_adi, fiyat, sure,
       jsonb_array_length(sehirden_hav) as gidis_sefer,
       jsonb_array_length(havdan_sehir) as donus_sefer,
       kaynak, tarife_donemi
FROM havalimani_seferleri
WHERE aktif = true
ORDER BY havalimani, firma, durak_adi;
