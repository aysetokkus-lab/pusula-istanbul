-- ═══════════════════════════════════════════════════════════════════
-- ACIL NUMARALAR 112'DE TOPLANDI — SUPABASE GUNCELLEMESI
-- ═══════════════════════════════════════════════════════════════════
-- Türkiye'de 2021'den itibaren tüm acil çağrı numaraları (110, 155,
-- 156, 122, 158, 177) 112'ye yönlendirildi.
-- Kaynak: EGM duyurusu (14 Kasım 2021), Resmi Gazete 18.02.2018 Yön.
--
-- Bu SQL:
-- 1) Eski acil numaraları (112 hariç) pasif yapar (silmez — geri donus icin)
-- 2) 112 kaydı yoksa ekler, varsa görünümünü düzeltir
-- 3) Sıralamayı sıfırlar (112 listede tek görünür)
-- ═══════════════════════════════════════════════════════════════════

-- 1) 112 dışındaki tüm acil numaraları pasif yap
UPDATE acil_rehber
SET aktif = false
WHERE kategori = 'acil_numara'
  AND numara <> '112';

-- 2) 112 kaydı zaten varsa güncelle (etiket + sıra)
UPDATE acil_rehber
SET
  isim = 'Tüm Acil Durumlar',
  goruntu = '112',
  aciklama = 'Polis, ambulans, itfaiye, jandarma, AFAD, sahil güvenlik ve orman yangın için tek numara',
  sira = 1,
  aktif = true
WHERE kategori = 'acil_numara'
  AND numara = '112';

-- 3) 112 kaydı yoksa ekle
INSERT INTO acil_rehber (kategori, isim, numara, goruntu, aciklama, sira, aktif)
SELECT 'acil_numara', 'Tüm Acil Durumlar', '112', '112',
       'Polis, ambulans, itfaiye, jandarma, AFAD, sahil güvenlik ve orman yangın için tek numara',
       1, true
WHERE NOT EXISTS (
  SELECT 1 FROM acil_rehber WHERE kategori = 'acil_numara' AND numara = '112'
);

-- KONTROL — calistirdiktan sonra bunu da calistir:
-- SELECT id, isim, numara, goruntu, aktif, sira FROM acil_rehber
-- WHERE kategori = 'acil_numara' ORDER BY aktif DESC, sira;
--
-- Beklenen sonuc:
-- - aktif=true olan tek kayit: 112 / Tum Acil Durumlar
-- - aktif=false olan eski kayitlar: 110, 155, 156, 158 vb. (geri donus icin)
