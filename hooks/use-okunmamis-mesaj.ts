import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   Web uyumlu storage
   ═══════════════════════════════════════════ */
const storageGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  return AsyncStorage.getItem(key);
};

const storageSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await AsyncStorage.setItem(key, value);
};

const SON_GORULME_KEY = 'sohbet_son_gorulme';

/* ═══════════════════════════════════════════
   Hook: useOkunmamisMesaj

   Sohbet sekmesinde bildirim noktası (badge)
   göstermek için okunmamış mesaj sayısını takip eder.

   - Kullanıcı sohbet ekranındayken mesajlar "okunmuş" sayılır
   - Diğer sekmelerdeyken gelen yeni mesajlar badge'i tetikler
   - Realtime subscription ile anlık güncellenir
   ═══════════════════════════════════════════ */
export function useOkunmamisMesaj() {
  const [okunmamisVar, setOkunmamisVar] = useState(false);
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);
  const sohbetteRef = useRef(false);
  const subscriptionRef = useRef<any>(null);
  const sonGorulmeRef = useRef<string | null>(null);

  /* ─── Son görülme zamanını yükle ─── */
  useEffect(() => {
    (async () => {
      try {
        const kayitli = await storageGet(SON_GORULME_KEY);
        if (kayitli) {
          sonGorulmeRef.current = kayitli;
        }
        // İlk yüklemede okunmamış mesaj sayısını kontrol et
        await okunmamisKontrol(kayitli);
      } catch (e) {
        console.warn('Son görülme yükleme hatası:', e);
      }
    })();
  }, []);

  /* ─── Okunmamış mesaj sayısını kontrol et ─── */
  const okunmamisKontrol = async (sonGorulme: string | null) => {
    try {
      if (!sonGorulme) {
        // Hiç görülmemiş — tüm mesajları okunmuş say (ilk kullanım)
        setOkunmamisVar(false);
        setOkunmamisSayisi(0);
        return;
      }

      const { count, error } = await supabase
        .from('sohbet_mesajlari')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', sonGorulme);

      if (error) throw error;

      const sayi = count || 0;
      setOkunmamisSayisi(sayi);
      setOkunmamisVar(sayi > 0);
    } catch (e) {
      console.warn('Okunmamış mesaj kontrol hatası:', e);
    }
  };

  /* ─── Realtime: yeni mesajları dinle ─── */
  useEffect(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel('okunmamis-mesaj-badge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sohbet_mesajlari',
        },
        () => {
          // Sohbet ekranında değilsek okunmamış sayısını artır
          if (!sohbetteRef.current) {
            setOkunmamisSayisi(prev => prev + 1);
            setOkunmamisVar(true);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  /* ─── Sohbet ekranına girildiğinde çağır ─── */
  const sohbeteGirdi = useCallback(async () => {
    sohbetteRef.current = true;
    setOkunmamisVar(false);
    setOkunmamisSayisi(0);

    const simdi = new Date().toISOString();
    sonGorulmeRef.current = simdi;
    try {
      await storageSet(SON_GORULME_KEY, simdi);
    } catch (e) {
      console.warn('Son görülme kaydetme hatası:', e);
    }
  }, []);

  /* ─── Sohbet ekranından çıkıldığında çağır ─── */
  const sohbettenCikti = useCallback(async () => {
    sohbetteRef.current = false;

    const simdi = new Date().toISOString();
    sonGorulmeRef.current = simdi;
    try {
      await storageSet(SON_GORULME_KEY, simdi);
    } catch (e) {
      console.warn('Son görülme kaydetme hatası:', e);
    }
  }, []);

  return {
    okunmamisVar,
    okunmamisSayisi,
    sohbeteGirdi,
    sohbettenCikti,
  };
}
