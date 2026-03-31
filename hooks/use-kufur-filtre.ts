import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface KufurKelime {
  kelime: string;
  seviye: 'kesin' | 'suphe';
}

interface FiltreResult {
  temiz: boolean;        // mesaj temiz mi?
  engellendi: boolean;   // kesin küfür var, engellenmeli
  supheli: boolean;      // şüpheli kelime var, kuyruğa düşmeli
  eslesen: string[];     // eşleşen kelimeler
}

export function useKufurFiltre() {
  const [kelimeler, setKelimeler] = useState<KufurKelime[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Küfür listesini Supabase'den çek
  useEffect(() => {
    const cek = async () => {
      const { data } = await supabase
        .from('kufur_listesi')
        .select('kelime, seviye')
        .eq('aktif', true);

      if (data) setKelimeler(data);
      setYukleniyor(false);
    };

    cek();
  }, []);

  // Mesajı filtrele
  const filtrele = useCallback((mesaj: string): FiltreResult => {
    const temizMesaj = mesaj
      .toLowerCase()
      .replace(/[.,!?;:'"()\-_]/g, '')  // noktalama temizle
      .replace(/\s+/g, ' ')              // çoklu boşluk temizle
      .trim();

    const kelimeListesi = temizMesaj.split(' ');
    const eslesen: string[] = [];
    let kesinVar = false;
    let supheVar = false;

    for (const kufur of kelimeler) {
      const kucuk = kufur.kelime.toLowerCase();

      // Tam kelime eşleşmesi
      const tamEslesti = kelimeListesi.some(k => k === kucuk);

      // Kelime içinde geçme (bitişik yazma hilesi için)
      const icindeGecti = temizMesaj.includes(kucuk);

      if (tamEslesti || icindeGecti) {
        eslesen.push(kufur.kelime);
        if (kufur.seviye === 'kesin') kesinVar = true;
        if (kufur.seviye === 'suphe') supheVar = true;
      }
    }

    return {
      temiz: !kesinVar && !supheVar,
      engellendi: kesinVar,
      supheli: !kesinVar && supheVar,
      eslesen,
    };
  }, [kelimeler]);

  // Şüpheli mesajı admin kuyruğuna gönder
  const kuyruğaEkle = useCallback(async (
    mesajId: string,
    mesajMetni: string,
    mesajSahibiId: string,
    mesajSahibiIsim: string,
    sebep: 'kufur' | 'spam' | 'uygunsuz' | 'diger' = 'kufur'
  ) => {
    await supabase.from('raporlanan_mesajlar').insert({
      mesaj_id: mesajId,
      mesaj_metni: mesajMetni,
      mesaj_sahibi_id: mesajSahibiId,
      mesaj_sahibi_isim: mesajSahibiIsim,
      sebep,
      otomatik: true,
      durum: 'bekliyor',
    });
  }, []);

  return {
    filtrele,
    kuyruğaEkle,
    yukleniyor,
    kelimeSayisi: kelimeler.length,
  };
}
