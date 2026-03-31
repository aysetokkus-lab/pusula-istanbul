import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ═══ Tipler ═══
export interface GemiVeri {
  gemi: string;
  sirket: string;
  yolcu: number;
  tarih: string;       // "2026-04-23"
  gelisSaat: string;   // "07:00" veya ""
  gidisSaat: string;   // "18:00" veya ""
}

/* ═══════════════════════════════════════════
   Galataport Gemi Takvimi Hook'u

   Supabase gemi_takvimi tablosundan okur.
   Veri kaynagi: cruisetimetables.com
   (brotli compression nedeniyle direkt fetch yapilamiyor,
    veri Supabase'e server-side yuklenip buradan okunuyor)
   ═══════════════════════════════════════════ */

// ═══ Hook ═══
export function useGemiTakvimi() {
  const [gemiler, setGemiler] = useState<GemiVeri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [sonGuncelleme, setSonGuncelleme] = useState<Date | null>(null);

  const fetchGemiler = useCallback(async () => {
    try {
      setYukleniyor(true);
      setHata(null);

      const bugun = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('gemi_takvimi')
        .select('*')
        .gte('tarih', bugun)
        .order('tarih', { ascending: true });

      if (error) throw error;

      const parsed: GemiVeri[] = (data || []).map((row: any) => ({
        gemi: row.gemi,
        sirket: row.sirket || '',
        yolcu: row.yolcu || 0,
        tarih: row.tarih,
        gelisSaat: row.gelis_saat || '',
        gidisSaat: row.gidis_saat || '',
      }));

      setGemiler(parsed);
      setSonGuncelleme(new Date());
    } catch (err: any) {
      console.warn('[GemiTakvimi] Supabase hatasi:', err.message);
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    fetchGemiler();
  }, [fetchGemiler]);

  // Bugunku gemi
  const bugun = new Date().toISOString().split('T')[0];
  const bugunGemi = gemiler.find((g) => g.tarih === bugun) || null;

  // Gelecek gemiler (bugun dahil, zaten sorgu bugundan itibaren cekildi)
  const gelecekGemiler = gemiler;

  // Onumuzdeki 7 gun
  const birHaftaSonra = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const haftaninGemileri = gemiler.filter((g) => g.tarih <= birHaftaSonra);

  return {
    gemiler,
    bugunGemi,
    gelecekGemiler,
    haftaninGemileri,
    yukleniyor,
    hata,
    sonGuncelleme,
    yenile: fetchGemiler,
  };
}
