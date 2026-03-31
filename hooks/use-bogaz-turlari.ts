import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface BogazTuru {
  id: string;
  sirket_id: string;
  sirket_adi: string;
  renk: string;
  tur_tipi: string;
  kalkis_yeri: string | null;
  fiyat: string | null;
  sure: string | null;
  hafta_ici_saatler: string[];
  hafta_sonu_saatler: string[];
  gidis_guzergah: { durak: string; saat: string; not?: string }[];
  donus_guzergah: { durak: string; saat: string; not?: string }[];
  kalkis_noktalari: { durak: string; fiyat: string }[];
  ozel_not: string | null;
  kaynak: string | null;
  tarife_donemi: string | null;
  aktif: boolean;
  aktif_mevsim: string;
}

export function useBogazTurlari() {
  const [turlar, setTurlar] = useState<BogazTuru[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const veriCek = async () => {
    try {
      const { data, error } = await supabase
        .from('bogaz_turlari')
        .select('*')
        .eq('aktif', true)
        .order('sirket_id');
      if (error) throw error;
      setTurlar(data || []);
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
      .channel('bogaz-turlari-degisim')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bogaz_turlari' }, () => {
        veriCek();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { turlar, yukleniyor, hata, yenile: veriCek };
}
