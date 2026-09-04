import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   Sohbet Tepkileri Hook'u (Eyl 2026)
   ─────────────────────────────────────────
   Tablo: sohbet_tepkileri (mesaj_id, kullanici_id, kullanici_isim, tip)
   - Kullanıcı başına mesaj başına TEK tepki (PK). Aynı tipe tekrar dokunmak
     tepkiyi KALDIRIR, farklı tip UPSERT ile değiştirir.
   - Realtime (INSERT/UPDATE/DELETE) + mesaj listesi değişince toplu yükleme.
   - Optimistic update: dokunuşta anında yansır, hata olursa geri alınır.
   ═══════════════════════════════════════════ */

export type TepkiTipi = 'begen' | 'begenme' | 'kalp' | 'saskin';
export const TEPKI_TIPLERI: TepkiTipi[] = ['begen', 'begenme', 'kalp', 'saskin'];
export const TEPKI_ETIKET: Record<TepkiTipi, string> = {
  begen: 'Beğen',
  begenme: 'Beğenme',
  kalp: 'Kalp',
  saskin: 'Şaşkın',
};

export interface Tepki {
  mesaj_id: string;
  kullanici_id: string;
  kullanici_isim: string | null;
  tip: TepkiTipi;
  created_at?: string;
}

export interface TepkiOzeti {
  tip: TepkiTipi;
  sayi: number;
  benim: boolean;
  isimler: string[];
}

type TepkiHaritasi = Record<string, Tepki[]>;

export function useSohbetTepkileri(mesajIdleri: string[], kullaniciId: string | null) {
  const [tepkiler, setTepkiler] = useState<TepkiHaritasi>({});
  const yuklenenIdler = useRef<Set<string>>(new Set());
  const kanalRef = useRef<any>(null);

  /* ─── Toplu yükleme: sadece henüz yüklenmemiş mesajlar için ─── */
  const yukle = useCallback(async (idler: string[]) => {
    const yeni = idler.filter(id => !yuklenenIdler.current.has(id));
    if (yeni.length === 0) return;
    yeni.forEach(id => yuklenenIdler.current.add(id));
    try {
      const { data, error } = await supabase
        .from('sohbet_tepkileri')
        .select('mesaj_id, kullanici_id, kullanici_isim, tip, created_at')
        .in('mesaj_id', yeni);
      if (error) throw error;
      setTepkiler(prev => {
        const sonraki: TepkiHaritasi = { ...prev };
        yeni.forEach(id => { if (!sonraki[id]) sonraki[id] = []; });
        (data as Tepki[] | null)?.forEach(tp => {
          const liste = (sonraki[tp.mesaj_id] ?? []).filter(x => x.kullanici_id !== tp.kullanici_id);
          sonraki[tp.mesaj_id] = [...liste, tp];
        });
        return sonraki;
      });
    } catch (e) {
      yeni.forEach(id => yuklenenIdler.current.delete(id));
      console.warn('Tepki yükleme hatası:', e);
    }
  }, []);

  useEffect(() => {
    if (mesajIdleri.length > 0) yukle(mesajIdleri);
  }, [mesajIdleri, yukle]);

  /* ─── Realtime ─── */
  useEffect(() => {
    const kanal = supabase
      .channel('sohbet-tepki-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sohbet_tepkileri' }, (payload: any) => {
        setTepkiler(prev => {
          const sonraki: TepkiHaritasi = { ...prev };
          if (payload.eventType === 'DELETE') {
            const eski = payload.old as Partial<Tepki>;
            if (eski?.mesaj_id && eski?.kullanici_id) {
              sonraki[eski.mesaj_id] = (sonraki[eski.mesaj_id] ?? []).filter(x => x.kullanici_id !== eski.kullanici_id);
            }
            return sonraki;
          }
          const yeni = payload.new as Tepki;
          if (!yeni?.mesaj_id) return prev;
          const liste = (sonraki[yeni.mesaj_id] ?? []).filter(x => x.kullanici_id !== yeni.kullanici_id);
          sonraki[yeni.mesaj_id] = [...liste, yeni];
          return sonraki;
        });
      })
      .subscribe();
    kanalRef.current = kanal;
    return () => {
      if (kanalRef.current) supabase.removeChannel(kanalRef.current);
      kanalRef.current = null;
    };
  }, []);

  /* ─── Tepki ver / değiştir / kaldır (optimistic) ─── */
  const tepkiVer = useCallback(async (mesajId: string, tip: TepkiTipi, kullaniciIsim: string): Promise<boolean> => {
    if (!kullaniciId) return false;
    const mevcut = (tepkiler[mesajId] ?? []).find(x => x.kullanici_id === kullaniciId);
    const kaldir = mevcut?.tip === tip;
    const onceki = tepkiler[mesajId] ?? [];

    // Optimistic
    setTepkiler(prev => {
      const liste = (prev[mesajId] ?? []).filter(x => x.kullanici_id !== kullaniciId);
      return {
        ...prev,
        [mesajId]: kaldir ? liste : [...liste, { mesaj_id: mesajId, kullanici_id: kullaniciId, kullanici_isim: kullaniciIsim, tip }],
      };
    });

    try {
      if (kaldir) {
        const { error } = await supabase
          .from('sohbet_tepkileri')
          .delete()
          .eq('mesaj_id', mesajId)
          .eq('kullanici_id', kullaniciId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sohbet_tepkileri')
          .upsert(
            { mesaj_id: mesajId, kullanici_id: kullaniciId, kullanici_isim: kullaniciIsim, tip },
            { onConflict: 'mesaj_id,kullanici_id' },
          );
        if (error) throw error;
      }
      return true;
    } catch (e) {
      console.warn('Tepki kaydetme hatası:', e);
      setTepkiler(prev => ({ ...prev, [mesajId]: onceki }));
      return false;
    }
  }, [kullaniciId, tepkiler]);

  /* ─── Özet: tip bazında sayı + benim mi + isimler ─── */
  const ozet = useCallback((mesajId: string): TepkiOzeti[] => {
    const liste = tepkiler[mesajId] ?? [];
    return TEPKI_TIPLERI
      .map(tip => {
        const olanlar = liste.filter(x => x.tip === tip);
        return {
          tip,
          sayi: olanlar.length,
          benim: olanlar.some(x => x.kullanici_id === kullaniciId),
          isimler: olanlar.map(x => x.kullanici_isim || 'Rehber'),
        };
      })
      .filter(o => o.sayi > 0);
  }, [tepkiler, kullaniciId]);

  const benimTepkim = useCallback((mesajId: string): TepkiTipi | null => {
    return (tepkiler[mesajId] ?? []).find(x => x.kullanici_id === kullaniciId)?.tip ?? null;
  }, [tepkiler, kullaniciId]);

  return { tepkiler, ozet, benimTepkim, tepkiVer };
}
