import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   use-pinli-mesajlar.ts (v1.1.0)
   ───────────────────────────────────────────
   Son 48 saat icinde sabitlenmis (pin'li) sohbet
   mesajlarini ana sayfada gostermek icin.
   - Realtime UPDATE event'leri ile anlik senkron
   - 48 saat sonrasi otomatik unpin (client-side filter)
   - Admin/moderator: pinle / pin kaldir
   ═══════════════════════════════════════════ */

export interface PinliMesaj {
  id: string;
  kullanici_id: string;
  kullanici_isim: string;
  mesaj: string;
  created_at: string;
  pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  pinned_by_isim: string | null;
}

const PIN_OMUR_MS = 48 * 60 * 60 * 1000; // 48 saat

function aktifMi(p: PinliMesaj): boolean {
  if (!p.pinned || !p.pinned_at) return false;
  return Date.now() - new Date(p.pinned_at).getTime() < PIN_OMUR_MS;
}

export function usePinliMesajlar() {
  const [mesajlar, setMesajlar] = useState<PinliMesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const channelRef = useRef<any>(null);

  const yukle = useCallback(async () => {
    try {
      const yas48hOnce = new Date(Date.now() - PIN_OMUR_MS).toISOString();
      const { data, error } = await supabase
        .from('sohbet_mesajlari')
        .select('id, kullanici_id, kullanici_isim, mesaj, created_at, pinned, pinned_at, pinned_by, pinned_by_isim')
        .eq('pinned', true)
        .gte('pinned_at', yas48hOnce)
        .order('pinned_at', { ascending: false });
      if (error) throw error;
      setMesajlar((data || []) as PinliMesaj[]);
    } catch (e) {
      console.warn('[PinliMesajlar] yukleme hatasi:', e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yukle();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel('pinli-mesaj-realtime')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sohbet_mesajlari' },
        (payload: any) => {
          const yeni = payload.new as PinliMesaj;
          if (!yeni?.id) return;
          setMesajlar(prev => {
            // Pin kaldirildi VEYA omru doldu -> listeden cikar
            if (!aktifMi(yeni)) return prev.filter(m => m.id !== yeni.id);
            // Zaten varsa guncelle, yoksa basa ekle
            const varOlanIndex = prev.findIndex(m => m.id === yeni.id);
            if (varOlanIndex >= 0) {
              const yeniListe = [...prev];
              yeniListe[varOlanIndex] = yeni;
              return yeniListe;
            }
            return [yeni, ...prev];
          });
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'sohbet_mesajlari' },
        (payload: any) => {
          const silinen = payload.old as { id?: string };
          if (!silinen?.id) return;
          setMesajlar(prev => prev.filter(m => m.id !== silinen.id));
        })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [yukle]);

  /* ─── Yetkili aksiyonlari ─── */
  const pinle = useCallback(async (mesajId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profil } = await supabase
        .from('profiles')
        .select('isim, soyisim')
        .eq('id', user.id)
        .single();

      const pinned_by_isim = profil
        ? `${profil.isim || ''} ${profil.soyisim || ''}`.trim() || null
        : null;

      const { error } = await supabase
        .from('sohbet_mesajlari')
        .update({
          pinned: true,
          pinned_at: new Date().toISOString(),
          pinned_by: user.id,
          pinned_by_isim,
        })
        .eq('id', mesajId);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn('[PinliMesajlar] pin hatasi:', e?.message);
      return false;
    }
  }, []);

  const pinKaldir = useCallback(async (mesajId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sohbet_mesajlari')
        .update({
          pinned: false,
          pinned_at: null,
          pinned_by: null,
          pinned_by_isim: null,
        })
        .eq('id', mesajId);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn('[PinliMesajlar] pin kaldirma hatasi:', e?.message);
      return false;
    }
  }, []);

  // Sadece aktif pinli (48 saat icinde) olanlari dondur
  const aktifMesajlar = mesajlar.filter(aktifMi);

  return {
    mesajlar: aktifMesajlar,
    yukleniyor,
    yenile: yukle,
    pinle,
    pinKaldir,
  };
}
