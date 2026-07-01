import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   use-push-token.ts (v1.1.0)
   ───────────────────────────────────────────
   Cihaza ait Expo Push Token'i alir ve
   profiles.expo_push_token kolonuna yazar.

   - Sadece dev-build'de calisir (Expo Go'da push API yok)
   - Web'de calismaz (web push henuz desteklenmiyor)
   - Giris yapilmamissa hicbir sey yapmaz
   - Logout'ta token NULL'a cevrilir
   - Token cihaza ozeldir, kullanici degistiginde yeniden alinmaz
     ama profiles satiri degisir — auth listener bunu hallediyor
   ═══════════════════════════════════════════ */

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const EAS_PROJECT_ID = '4b230ae7-f56f-4c77-af07-acfcdea0efe6';

let Notifications: typeof import('expo-notifications') | null = null;
let pushDestekleniyor = false;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    pushDestekleniyor = true;
  } catch {
    pushDestekleniyor = false;
  }
}

/* ═══════════════════════════════════════════
   Yardimci: Izin iste (gerekirse)
   ═══════════════════════════════════════════ */
async function izinIste(): Promise<boolean> {
  if (!Notifications || !pushDestekleniyor) return false;
  try {
    const { status: mevcut } = await Notifications.getPermissionsAsync();
    if (mevcut === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('Bildirim izni hata:', e);
    return false;
  }
}

/* ═══════════════════════════════════════════
   Yardimci: Token al (EAS projectId ile)
   ═══════════════════════════════════════════ */
async function tokenAl(): Promise<string | null> {
  if (!Notifications || !pushDestekleniyor) return null;
  try {
    const tokenObj = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    return tokenObj?.data || null;
  } catch (e) {
    console.warn('Push token alma hata:', e);
    return null;
  }
}

/* ═══════════════════════════════════════════
   Yardimci: Token'i Supabase'e yaz (RPC)
   ───────────────────────────────────────────
   push_token_kaydet RPC'si (SECURITY DEFINER) ayni token'i
   tasiyan DIGER profilleri de temizler. Expo push token
   CIHAZA aittir, hesaba degil — ayni cihazda hesap
   degistirilirse token son giris yapan kullaniciya gecer.
   (ISSUES #87: duplike token yuzunden kullanici baska
   hesabin bildirim tercihleriyle push aliyordu.)
   Her cagri idempotent; "ayni token'sa yazma" optimizasyonu
   bilerek kaldirildi — her acilis stale duplikasyonu supurur.
   ═══════════════════════════════════════════ */
async function tokenKaydet(token: string): Promise<void> {
  try {
    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
    const { error } = await supabase.rpc('push_token_kaydet', {
      p_token: token,
      p_platform: platform,
    });

    if (error) {
      console.warn('Push token kaydetme hata:', error.message);
    }
  } catch (e) {
    console.warn('Push token kaydetme exception:', e);
  }
}

/* ═══════════════════════════════════════════
   Token'i Supabase'den temizle — EXPORT'lu.
   ───────────────────────────────────────────
   DIKKAT (ISSUES #87): Bu fonksiyon signOut()'tan ONCE
   cagrilmali. SIGNED_OUT event'inde cagirmak ise yaramaz:
   oturum kapandigi icin RLS update'i SESSIZCE reddeder
   (0 satir, hata yok — DECISIONS "RLS Sessiz Reddedebilir").
   Cikis akisi: await pushTokenTemizle(); await signOut();
   ═══════════════════════════════════════════ */
export async function pushTokenTemizle(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        expo_push_token: null,
        push_token_platform: null,
        push_token_guncellendi: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      console.warn('Push token temizleme hata:', error.message);
    }
  } catch (e) {
    console.warn('Push token temizleme exception:', e);
  }
}

/* ═══════════════════════════════════════════
   Hook: usePushToken
   _layout.tsx'te bir kere cagrilir.
   ═══════════════════════════════════════════ */
export function usePushToken() {
  const sonUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pushDestekleniyor) return;

    let iptal = false;

    const yenile = async (userId: string | null) => {
      if (iptal) return;

      // SIGNED_OUT: burada token temizligi YAPILMAZ — oturum kapandigi
      // icin RLS update'i sessizce reddeder (ISSUES #87). Temizlik
      // signOut oncesi pushTokenTemizle() ile yapilir (profil.tsx).
      // Guvenlik agi: temizlik kacsa bile bir sonraki girista
      // push_token_kaydet RPC'si stale token'i diger profilden supurur.
      if (!userId) {
        sonUserIdRef.current = null;
        return;
      }

      sonUserIdRef.current = userId;

      // Izin + token al + kaydet
      const izin = await izinIste();
      if (!izin) return;

      const token = await tokenAl();
      if (!token) return;

      await tokenKaydet(token);
    };

    // Baslangic: mevcut user'i kontrol et
    supabase.auth.getUser().then(({ data }) => {
      yenile(data.user?.id || null);
    });

    // Auth degisikliklerini dinle (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        yenile(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        yenile(session?.user?.id || null);
      }
    });

    return () => {
      iptal = true;
      subscription.unsubscribe();
    };
  }, []);

  return { pushDestekleniyor };
}
