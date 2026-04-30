import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ═══════════════════════════════════════════
   Bildirim Kategorileri
   ═══════════════════════════════════════════ */
export interface BildirimTercihleri {
  ulasim: boolean;       // Ulaşım uyarıları (rayli sistem)
  trafik: boolean;       // Trafik ve yol durumu (IBB Ulasim: kopru, metrobus, E-5, TEM)
  sahaDurumu: boolean;   // Canlı saha durumu (müze yoğunluk)
  etkinlikler: boolean;  // Yaklaşan etkinlikler
  sohbet: boolean;       // Yeni sohbet mesajları
  admin: boolean;        // Admin güncellemeleri (saat değişikliği, mevsim geçişi vb.)
}

export const VARSAYILAN_TERCIHLER: BildirimTercihleri = {
  ulasim: true,
  trafik: true,
  sahaDurumu: true,
  etkinlikler: true,
  sohbet: true,
  admin: true,
};

export type BildirimKategori = keyof BildirimTercihleri;

/* Kategori etiketleri ve açıklamaları */
export const BILDIRIM_KATEGORI_BILGI: Record<BildirimKategori, { baslik: string; aciklama: string; aciklamaKapali: string }> = {
  ulasim: {
    baslik: 'Ulaşım Uyarıları',
    aciklama: 'Metro, tramvay ve Marmaray arıza bildirimleri açık',
    aciklamaKapali: 'Raylı sistem bildirimleri kapalı',
  },
  trafik: {
    baslik: 'Trafik ve Yol Durumu',
    aciklama: 'Köprü, metrobüs, E-5, TEM ve yol çalışması bildirimleri açık',
    aciklamaKapali: 'Trafik bildirimleri kapalı',
  },
  sahaDurumu: {
    baslik: 'Saha Durumu',
    aciklama: 'Müze yoğunluk ve kuyruk güncellemeleri açık',
    aciklamaKapali: 'Saha durumu bildirimleri kapalı',
  },
  etkinlikler: {
    baslik: 'Yaklaşan Etkinlikler',
    aciklama: 'Etkinlik, miting ve yol kapanma bildirimleri açık',
    aciklamaKapali: 'Etkinlik bildirimleri kapalı',
  },
  sohbet: {
    baslik: 'Sohbet Mesajları',
    aciklama: 'Yeni sohbet mesajı bildirimleri açık',
    aciklamaKapali: 'Sohbet bildirimleri kapalı',
  },
  admin: {
    baslik: 'Sistem Güncellemeleri',
    aciklama: 'Saat değişikliği, mevsim geçişi ve tarife güncellemeleri açık',
    aciklamaKapali: 'Sistem güncelleme bildirimleri kapalı',
  },
};

const STORAGE_KEY = 'bildirim_tercihleri';

/* ═══════════════════════════════════════════
   In-memory listener: Birden fazla hook
   instance'ını senkron tutar
   ═══════════════════════════════════════════ */
type Dinleyici = (t: BildirimTercihleri) => void;
const dinleyiciler = new Set<Dinleyici>();

function tercihDuyur(t: BildirimTercihleri) {
  dinleyiciler.forEach(fn => fn(t));
}

/* Web uyumlu storage */
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

/* ═══════════════════════════════════════════
   Hook: useBildirimTercihleri
   Birden fazla component'te kullanılabilir,
   tüm instance'lar senkron kalır.
   ═══════════════════════════════════════════ */
export function useBildirimTercihleri() {
  const [tercihler, setTercihler] = useState<BildirimTercihleri>(VARSAYILAN_TERCIHLER);
  const [yuklendi, setYuklendi] = useState(false);

  // Kayıtlı tercihleri yükle + dinleyici kaydet
  useEffect(() => {
    (async () => {
      try {
        const kayitli = await storageGet(STORAGE_KEY);
        if (kayitli) {
          const parsed = JSON.parse(kayitli) as Partial<BildirimTercihleri>;
          setTercihler(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('Bildirim tercihleri yükleme hatası:', e);
      } finally {
        setYuklendi(true);
      }
    })();

    // Diğer instance'lardan gelen değişiklikleri dinle
    const dinleyici: Dinleyici = (yeniTercihler) => {
      setTercihler(yeniTercihler);
    };
    dinleyiciler.add(dinleyici);
    return () => { dinleyiciler.delete(dinleyici); };
  }, []);

  // Tek bir kategoriyi aç/kapat
  const toggle = useCallback(async (kategori: BildirimKategori) => {
    setTercihler(prev => {
      const yeni = { ...prev, [kategori]: !prev[kategori] };
      storageSet(STORAGE_KEY, JSON.stringify(yeni)).catch(console.warn);
      // Diğer instance'ları bilgilendir
      tercihDuyur(yeni);
      return yeni;
    });
  }, []);

  // Tüm tercihleri güncelle
  const hepsiniGuncelle = useCallback(async (yeniTercihler: BildirimTercihleri) => {
    setTercihler(yeniTercihler);
    tercihDuyur(yeniTercihler);
    try {
      await storageSet(STORAGE_KEY, JSON.stringify(yeniTercihler));
    } catch (e) {
      console.warn('Bildirim tercihleri kaydetme hatası:', e);
    }
  }, []);

  return {
    tercihler,
    yuklendi,
    toggle,
    hepsiniGuncelle,
  };
}
