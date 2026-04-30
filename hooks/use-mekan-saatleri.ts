import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MekanSaat {
  id: string;
  mekan_id: string;
  isim: string;
  tip: string;
  kategori: string;
  acilis: string;
  kapanis: string;
  gise_kapanis: string | null;
  kapali_gun: number | null;
  mevsimsel: boolean;
  yaz_acilis: string | null;
  yaz_kapanis: string | null;
  kis_acilis: string | null;
  kis_kapanis: string | null;
  yaz_gise_kapanis: string | null;
  kis_gise_kapanis: string | null;
  aktif_mevsim: string;
  haftaici_acilis: string | null;
  haftaici_kapanis: string | null;
  haftaici_gise: string | null;
  haftasonu_acilis: string | null;
  haftasonu_kapanis: string | null;
  haftasonu_gise: string | null;
  sali_kapanis: string | null;
  cuma_kapanis: string | null;
  cuma_kapali_bas: string | null;
  cuma_kapali_bit: string | null;
  pazar_acilis: string | null;
  pazar_kapanis: string | null;
  gece_acilis: string | null;
  gece_kapanis: string | null;
  gece_gise: string | null;
  fiyat_yerli: string | null;
  fiyat_yabanci: string | null;
  fiyat_indirimli: string | null;
  muzekart: string | null;
  ozel_not: string | null;
  kaynak: string | null;
  site: string | null;
  renk: string;
  ulasim_notu: string | null;
  ekstra: string | null;
  aktif: boolean;
  restorasyon: boolean;
  restorasyon_notu: string | null;
  guncelleme_tarihi: string;
}

export function useMekanSaatleri(kategori?: string) {
  const [mekanlar, setMekanlar] = useState<MekanSaat[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const veriCek = async () => {
    try {
      let query = supabase.from('mekan_saatleri').select('*').eq('aktif', true).order('isim');
      if (kategori) query = query.eq('kategori', kategori);
      const { data, error } = await query;
      if (error) throw error;
      setMekanlar(data || []);
      setHata(null);
    } catch (e: any) {
      setHata(e.message);
      // Hata durumunda mevcut veriyi koru
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    veriCek();

    // Realtime dinleme
    const channel = supabase
      .channel('mekan-saatleri-degisim')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mekan_saatleri' }, () => {
        veriCek();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [kategori]);

  return { mekanlar, yukleniyor, hata, yenile: veriCek };
}

// Belirli bir mekani ID ile cek
export function useMekanDetay(mekanId: string) {
  const [mekan, setMekan] = useState<MekanSaat | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const cek = async () => {
      const { data } = await supabase
        .from('mekan_saatleri')
        .select('*')
        .eq('mekan_id', mekanId)
        .single();
      setMekan(data);
      setYukleniyor(false);
    };
    cek();
  }, [mekanId]);

  return { mekan, yukleniyor };
}
