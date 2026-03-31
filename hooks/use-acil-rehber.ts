import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AcilKayit {
  id: string;
  kategori: 'acil_numara' | 'turizm_polisi' | 'meslek_kurulusu' | 'faydali_link';
  isim: string;
  numara: string | null;
  goruntu: string | null;
  url: string | null;
  aciklama: string | null;
  sira: number;
  aktif: boolean;
}

export function useAcilRehber() {
  const [kayitlar, setKayitlar] = useState<AcilKayit[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const veriCek = async () => {
    try {
      const { data, error } = await supabase
        .from('acil_rehber')
        .select('*')
        .eq('aktif', true)
        .order('sira');
      if (error) throw error;
      setKayitlar(data || []);
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
      .channel('acil-rehber-degisim')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acil_rehber' }, () => {
        veriCek();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Kategoriye gore filtrele
  const turizmPolisi = kayitlar.filter(k => k.kategori === 'turizm_polisi');
  const acilNumaralar = kayitlar.filter(k => k.kategori === 'acil_numara');
  const meslekKuruluslari = kayitlar.filter(k => k.kategori === 'meslek_kurulusu');
  const faydaliLinkler = kayitlar.filter(k => k.kategori === 'faydali_link');

  return {
    kayitlar,
    turizmPolisi,
    acilNumaralar,
    meslekKuruluslari,
    faydaliLinkler,
    yukleniyor,
    hata,
    yenile: veriCek,
  };
}
