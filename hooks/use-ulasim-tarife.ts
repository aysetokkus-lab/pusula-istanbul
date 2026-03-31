import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface HavalimaniSefer {
  id: string;
  firma: string;
  havalimani: string;
  durak_id: string;
  durak_adi: string;
  sure: string | null;
  fiyat: string | null;
  not_bilgi: string | null;
  sehirden_hav: string[];
  havdan_sehir: string[];
  aktif: boolean;
  kaynak: string | null;
  tarife_donemi: string | null;
}

export function useUlasimTarife(havalimani?: 'IST' | 'SAW') {
  const [seferler, setSeferler] = useState<HavalimaniSefer[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const veriCek = async () => {
    try {
      let query = supabase
        .from('havalimani_seferleri')
        .select('*')
        .eq('aktif', true)
        .order('durak_adi');
      if (havalimani) query = query.eq('havalimani', havalimani);
      const { data, error } = await query;
      if (error) throw error;
      setSeferler(data || []);
      setHata(null);
    } catch (e: any) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    veriCek();

    const channel = supabase
      .channel('havalimani-seferleri-degisim')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'havalimani_seferleri' }, () => {
        veriCek();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [havalimani]);

  return { seferler, yukleniyor, hata, yenile: veriCek };
}
