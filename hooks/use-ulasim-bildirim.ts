import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const BILDIRIM_KEY = 'ulasim_bildirim_aktif';

/* ═══════════════════════════════════════════
   Expo Go'da expo-notifications çalışmıyor
   (SDK 53+). Modülü sadece dev-build'de yükle.
   ═══════════════════════════════════════════ */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;
let bildirimDestekleniyor = false;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    bildirimDestekleniyor = true;
  } catch {
    bildirimDestekleniyor = false;
  }
}

/* ═══════════════════════════════════════════
   Tip → Emoji eşleştirme
   ═══════════════════════════════════════════ */
const TIP_ETIKET: Record<string, string> = {
  ariza: '[ARIZA]',
  kesinti: '[KESINTI]',
  gecikme: '[GECIKME]',
  bilgi: '[BILGI]',
  duyuru: '[DUYURU]',
};

/* ═══════════════════════════════════════════
   İzin isteme (güvenli)
   ═══════════════════════════════════════════ */
async function bildirimIzniIste(): Promise<boolean> {
  if (!Notifications || !bildirimDestekleniyor) return false;
  try {
    const { status: mevcut } = await Notifications.getPermissionsAsync();
    if (mevcut === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    bildirimDestekleniyor = false;
    return false;
  }
}

/* ═══════════════════════════════════════════
   Local bildirim gönder (güvenli)
   ═══════════════════════════════════════════ */
async function localBildirimGonder(baslik: string, icerik: string, hat: string) {
  if (!Notifications || !bildirimDestekleniyor) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: baslik,
        body: icerik,
        data: { hat },
        ...(Platform.OS === 'android' && {
          channelId: 'ulasim-uyari',
        }),
      },
      trigger: null,
    });
  } catch {
    bildirimDestekleniyor = false;
  }
}

/* ═══════════════════════════════════════════
   Android bildirim kanalı (güvenli)
   ═══════════════════════════════════════════ */
async function androidKanalOlustur() {
  if (Platform.OS !== 'android' || !Notifications || !bildirimDestekleniyor) return;
  try {
    await Notifications.setNotificationChannelAsync('ulasim-uyari', {
      name: 'Ulaşım Uyarıları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  } catch {
    bildirimDestekleniyor = false;
  }
}

/* ═══════════════════════════════════════════
   Hook: useUlasimBildirim
   ═══════════════════════════════════════════ */
export function useUlasimBildirim() {
  const [aktif, setAktif] = useState(true);
  const [izinVar, setIzinVar] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Kayıtlı tercihi yükle
  useEffect(() => {
    (async () => {
      const kayitli = await AsyncStorage.getItem(BILDIRIM_KEY);
      if (kayitli !== null) {
        setAktif(kayitli === 'true');
      }
      await androidKanalOlustur();
    })();
  }, []);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!aktif) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    const baslat = async () => {
      const izin = await bildirimIzniIste();
      setIzinVar(izin);

      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }

      const channel = supabase
        .channel('ulasim-uyari-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ulasim_uyarilari',
          },
          (payload: any) => {
            const yeni = payload.new;
            if (!yeni || !yeni.aktif) return;

            const etiket = TIP_ETIKET[yeni.tip] || '[BILGI]';

            if (bildirimDestekleniyor && izin) {
              localBildirimGonder(
                `${etiket} ${yeni.hat}`,
                yeni.icerik,
                yeni.hat
              );
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    };

    baslat();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [aktif]);

  const toggle = async () => {
    const yeniDeger = !aktif;

    if (yeniDeger && bildirimDestekleniyor) {
      const izin = await bildirimIzniIste();
      if (!izin) {
        setIzinVar(false);
        Alert.alert(
          'Bildirim İzni',
          'Bildirim göndermek için izin gerekli. Ayarlardan izin verebilirsiniz.',
        );
        return;
      }
      setIzinVar(true);
    }

    setAktif(yeniDeger);
    await AsyncStorage.setItem(BILDIRIM_KEY, String(yeniDeger));
  };

  return { aktif, izinVar, toggle, bildirimDestekleniyor };
}
