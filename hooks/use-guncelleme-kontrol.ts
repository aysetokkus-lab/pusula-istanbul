import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   use-guncelleme-kontrol.ts (v1.1.0)
   ───────────────────────────────────────────
   Uygulama acilisinda Supabase 'app_versions' tablosundan
   son surum bilgisini ceker, lokal surumle karsilastirir.
   Yeni surum varsa uyari bandi gosterilmesi icin sinyal verir.

   "24 saat sessizlestir" mantigi: kullanici X'e basinca
   timestamp AsyncStorage'a yazilir. Surume ozel
   (yeni surum cikinca yeniden gozukur).
   ═══════════════════════════════════════════ */

interface AppSurum {
  platform: 'ios' | 'android';
  version: string;
  store_url: string;
}

/* ─── Semver karsilastirma (basit) ─── */
function surumDahaYeniMi(latest: string, local: string): boolean {
  const a = latest.split('.').map(n => parseInt(n, 10) || 0);
  const b = local.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

const SESSIZ_SURESI_MS = 24 * 60 * 60 * 1000; // 24 saat
const STORAGE_KEY_PREFIX = 'guncelleme_sessiz_';

export function useGuncellemeKontrol() {
  const [yeniSurumVar, setYeniSurumVar] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  const kontrolEt = useCallback(async () => {
    try {
      const localVersion = Constants.expoConfig?.version || '0.0.0';
      const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';

      // Web'de gosterme
      if (Platform.OS === 'web') return;

      const { data, error } = await supabase
        .from('app_versions')
        .select('platform, version, store_url')
        .eq('platform', platform)
        .single<AppSurum>();

      if (error || !data) return;

      const dahaYeni = surumDahaYeniMi(data.version, localVersion);
      if (!dahaYeni) return;

      // Sessizlestirme kontrolu — surume ozel
      const storageKey = `${STORAGE_KEY_PREFIX}${data.version}`;
      const sessizUntilStr = await AsyncStorage.getItem(storageKey);
      if (sessizUntilStr) {
        const sessizUntil = parseInt(sessizUntilStr, 10);
        if (!isNaN(sessizUntil) && sessizUntil > Date.now()) {
          return; // Hala sessizleme suresinde
        }
      }

      setLatestVersion(data.version);
      setStoreUrl(data.store_url);
      setYeniSurumVar(true);
    } catch (e) {
      // Sessizce gec — bu kritik bir akis degil
      console.warn('[GuncellemeKontrol]', e);
    }
  }, []);

  useEffect(() => {
    kontrolEt();
  }, [kontrolEt]);

  /* ─── X butonu — 24 saat sessizlestir ─── */
  const sessizlestir = useCallback(async () => {
    if (!latestVersion) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${latestVersion}`;
    const sessizUntil = Date.now() + SESSIZ_SURESI_MS;
    try {
      await AsyncStorage.setItem(storageKey, String(sessizUntil));
    } catch {}
    setYeniSurumVar(false);
  }, [latestVersion]);

  return {
    yeniSurumVar,
    latestVersion,
    storeUrl,
    sessizlestir,
  };
}
