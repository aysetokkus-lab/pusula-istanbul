import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tema, type TemaRenkleri } from '../constants/theme';

/* ═══════════════════════════════════════════
   Tema Tercihi: 'sistem' | 'acik' | 'koyu'
   AsyncStorage'da saklanir, uygulama acilisinda yuklenir.
   ═══════════════════════════════════════════ */

export type TemaTercihi = 'sistem' | 'acik' | 'koyu';

const TEMA_KEY = '@pusula_tema_tercihi';

interface TemaContextTipi {
  t: TemaRenkleri;
  isDark: boolean;
  tercih: TemaTercihi;
  setTercih: (yeni: TemaTercihi) => void;
}

const TemaContext = createContext<TemaContextTipi | null>(null);

/* ─── Provider: _layout.tsx'de sar ─── */
export function TemaProvider({ children }: { children: ReactNode }) {
  const sistemSema = useColorScheme();
  // Varsayilan 'acik' — ilk yukleme her zaman light mode.
  // Kullanici profilden degistirirse AsyncStorage'a yazilir.
  const [tercih, setTercihState] = useState<TemaTercihi>('acik');
  const [yuklendi, setYuklendi] = useState(false);

  // Uygulama acilisinda tercihi yukle
  useEffect(() => {
    AsyncStorage.getItem(TEMA_KEY).then(v => {
      if (v === 'acik' || v === 'koyu' || v === 'sistem') {
        setTercihState(v);
      }
      // Hic kayit yoksa 'acik' kalir (varsayilan)
      setYuklendi(true);
    }).catch(() => setYuklendi(true));
  }, []);

  const setTercih = (yeni: TemaTercihi) => {
    setTercihState(yeni);
    AsyncStorage.setItem(TEMA_KEY, yeni).catch(() => {});
  };

  const isDark =
    tercih === 'sistem'
      ? sistemSema === 'dark'
      : tercih === 'koyu';

  const value: TemaContextTipi = {
    t: isDark ? Tema.dark : Tema.light,
    isDark,
    tercih,
    setTercih,
  };

  return (
    <TemaContext.Provider value={value}>
      {children}
    </TemaContext.Provider>
  );
}

/* ─── Hook: her yerde kullan ─── */
export function useTema(): TemaContextTipi {
  const ctx = useContext(TemaContext);
  if (ctx) return ctx;

  // Provider disinda fallback (olmamali ama guvenlik icin)
  return {
    t: Tema.light,
    isDark: false,
    tercih: 'acik' as TemaTercihi,
    setTercih: () => {},
  };
}
