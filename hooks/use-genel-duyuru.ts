import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   useGenelDuyuru (v1.1.0)
   ───────────────────────────────────────────
   - Admin/moderator tarafindan kurulan genel duyurular
   - Aktif duyurular listelenir (sabitlendi=true once, sonra tarihe gore)
   - Realtime listener (INSERT/UPDATE/DELETE)
   - Admin/moderator: duyuruEkle / duyuruSil / duyuruGuncelle
   ═══════════════════════════════════════════ */

export interface Duyuru {
  id: string;
  baslik: string;
  icerik: string | null;
  gorsel_url: string | null;
  olusturan_id: string | null;
  olusturan_isim: string | null;
  aktif: boolean;
  sabitlendi: boolean;
  created_at: string;
  updated_at: string;
}

export function useGenelDuyuru() {
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const yukle = useCallback(async () => {
    try {
      setHata(null);
      const { data, error } = await supabase
        .from('genel_duyurular')
        .select('*')
        .eq('aktif', true)
        .order('sabitlendi', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDuyurular(data || []);
    } catch (e: any) {
      console.warn('[GenelDuyuru] yukleme hatasi:', e.message);
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yukle();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('genel-duyuru-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'genel_duyurular' },
        (payload: any) => {
          const yeni = payload.new as Duyuru;
          if (!yeni?.aktif) return;
          setDuyurular(prev => {
            if (prev.some(d => d.id === yeni.id)) return prev;
            return [yeni, ...prev].sort((a, b) => {
              if (a.sabitlendi !== b.sabitlendi) return a.sabitlendi ? -1 : 1;
              return b.created_at.localeCompare(a.created_at);
            });
          });
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'genel_duyurular' },
        (payload: any) => {
          const guncel = payload.new as Duyuru;
          setDuyurular(prev => {
            // Eger aktif false yapildiysa kaldir
            if (!guncel.aktif) return prev.filter(d => d.id !== guncel.id);
            // Yoksa guncelle
            const yeni = prev.map(d => d.id === guncel.id ? guncel : d);
            return yeni.sort((a, b) => {
              if (a.sabitlendi !== b.sabitlendi) return a.sabitlendi ? -1 : 1;
              return b.created_at.localeCompare(a.created_at);
            });
          });
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'genel_duyurular' },
        (payload: any) => {
          const silinen = payload.old as { id?: string };
          if (!silinen?.id) return;
          setDuyurular(prev => prev.filter(d => d.id !== silinen.id));
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

  /* ─── Admin/moderator aksiyonlari ─── */

  // Foto upload yardimcisi (storage'a base64 yukler, URL doner)
  const gorselYukle = useCallback(async (uri: string, mimeType: string = 'image/jpeg'): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Giris gerekli');

      // Dosya icerigini fetch ile cek (React Native blob)
      const res = await fetch(uri);
      const blob = await res.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const ext = mimeType.split('/')[1] || 'jpg';
      const dosyaAdi = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const path = `${user.id}/${dosyaAdi}`;

      const { error: uploadError } = await supabase.storage
        .from('duyuru-gorseller')
        .upload(path, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('duyuru-gorseller')
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (e: any) {
      console.warn('[GenelDuyuru] gorsel yukleme hatasi:', e.message);
      return null;
    }
  }, []);

  const duyuruEkle = useCallback(async (params: {
    baslik: string;
    icerik?: string;
    gorsel_url?: string;
    sabitlendi?: boolean;
  }): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Olusturan ismini profile'dan cek
      const { data: profil } = await supabase
        .from('profiles')
        .select('isim, soyisim')
        .eq('id', user.id)
        .single();

      const olusturan_isim = profil
        ? `${profil.isim || ''} ${profil.soyisim || ''}`.trim() || null
        : null;

      const { error } = await supabase.from('genel_duyurular').insert({
        baslik: params.baslik,
        icerik: params.icerik || null,
        gorsel_url: params.gorsel_url || null,
        sabitlendi: params.sabitlendi || false,
        olusturan_id: user.id,
        olusturan_isim,
        aktif: true,
      });

      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn('[GenelDuyuru] ekleme hatasi:', e.message);
      return false;
    }
  }, []);

  const duyuruSil = useCallback(async (id: string): Promise<boolean> => {
    try {
      // DECISIONS #34 pattern: RLS sessiz reddini yakala — DELETE ... RETURNING ile
      // silinen satiri geriye iste; bos array donerse policy reddetti demektir.
      const { data, error } = await supabase
        .from('genel_duyurular')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        // RLS reddi veya zaten silinmis — kullanici yetkisi yok
        console.warn('[GenelDuyuru] silme reddedildi (yetki yok veya zaten silinmis)');
        return false;
      }
      // Optimistic update: realtime event'i beklemeden state'ten kaldir
      // (realtime publication yavas olabilir veya channel kopmus olabilir)
      setDuyurular(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (e: any) {
      console.warn('[GenelDuyuru] silme hatasi:', e.message);
      return false;
    }
  }, []);

  const duyuruSabitle = useCallback(async (id: string, sabitlendi: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('genel_duyurular')
        .update({ sabitlendi })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn('[GenelDuyuru] sabitleme hatasi:', e.message);
      return false;
    }
  }, []);

  /* ─── Duyuruyu duzenle (baslik / icerik / gorsel / sabit) ─── */
  const duyuruGuncelle = useCallback(async (id: string, params: {
    baslik?: string;
    icerik?: string | null;
    gorsel_url?: string | null;
    sabitlendi?: boolean;
  }): Promise<boolean> => {
    try {
      const update: Record<string, any> = {};
      if (params.baslik !== undefined) update.baslik = params.baslik;
      if (params.icerik !== undefined) update.icerik = params.icerik;
      if (params.gorsel_url !== undefined) update.gorsel_url = params.gorsel_url;
      if (params.sabitlendi !== undefined) update.sabitlendi = params.sabitlendi;
      const { error } = await supabase
        .from('genel_duyurular')
        .update(update)
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn('[GenelDuyuru] guncelleme hatasi:', e.message);
      return false;
    }
  }, []);

  return {
    duyurular,
    yukleniyor,
    hata,
    yenile: yukle,
    gorselYukle,
    duyuruEkle,
    duyuruGuncelle,
    duyuruSil,
    duyuruSabitle,
  };
}
