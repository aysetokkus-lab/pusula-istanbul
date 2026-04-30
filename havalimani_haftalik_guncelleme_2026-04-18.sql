-- Havalimani Tarife Haftalik Guncelleme — 18 Nisan 2026
-- Kaynak: havabus.com (canli scrape) + ajansbesiktas.com / havalimaniulasim.com (Havaist fiyat dogrulama)
-- Sonuc: Fiyatlar ve sefer saatleri degismedi, sadece Kadikoy havdan_sehir'e 00:00 eklendi

-- ====================================
-- HAVABUS TAKSIM (SAW) — Fiyat ve saatler AYNI, sadece tarih guncelle
-- ====================================
UPDATE havalimani_seferleri
SET
  guncelleme_tarihi = NOW(),
  tarife_donemi = 'Nisan 2026',
  kaynak = 'havabus.com'
WHERE firma = 'havabus' AND durak_id = 'taksim_saw';

-- ====================================
-- HAVABUS KADIKOY (SAW) — havdan_sehir'e 00:00 eklendi (28 → 29 sefer)
-- ====================================
UPDATE havalimani_seferleri
SET
  havdan_sehir = '["05:45","06:30","07:00","07:45","08:30","09:15","10:00","10:45","11:30","12:15","13:00","13:45","14:30","15:15","16:00","16:45","17:30","18:15","19:00","19:45","20:30","21:15","22:00","22:45","23:30","00:00","00:30","01:00","01:30"]'::jsonb,
  guncelleme_tarihi = NOW(),
  tarife_donemi = 'Nisan 2026',
  kaynak = 'havabus.com'
WHERE firma = 'havabus' AND durak_id = 'kadikoy_saw';

-- ====================================
-- HAVAIST — Fiyatlar dogrulandi, degisiklik YOK
-- ====================================
-- Taksim: 426₺ (bilet.hava.ist Nisan 2026) — degismedi
-- Besiktas: 426₺ (bilet.hava.ist Nisan 2026) — degismedi
-- Aksaray: 355₺ (birgun.net Ocak 2026, ajansbesiktas.com ile teyit) — degismedi
-- Kadikoy: 390₺ (birgun.net Ocak 2026, ajansbesiktas.com ile teyit) — degismedi
--
-- NOT: ajansbesiktas.com 11 hat listesinde Taksim-Besiktas hatti ayri goruntulenmedi.
-- bilet.hava.ist dinamik site oldugundan fiyat cekilemedi. Mevcut 426₺ korunuyor.
-- Diger hatlar (Bakirkoy 320₺, Beylikduzu 350₺, Sultanahmet 315₺, Arnavutkoy 130₺,
-- Halkali-Basaksehir 265₺) henuz DB'de kayit olarak mevcut degil.

-- ====================================
-- DOGRULAMA — Guncelleme sonrasi kontrol
-- ====================================
SELECT firma, havalimani, durak_adi, fiyat, sure, kaynak, tarife_donemi, guncelleme_tarihi,
       jsonb_array_length(COALESCE(sehirden_hav, '[]'::jsonb)) AS gidis_sefer,
       jsonb_array_length(COALESCE(havdan_sehir, '[]'::jsonb)) AS donus_sefer
FROM havalimani_seferleri
WHERE aktif = true
ORDER BY havalimani, firma, durak_adi;
