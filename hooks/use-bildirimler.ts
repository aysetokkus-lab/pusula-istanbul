import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/* ═══════════════════════════════════════════
   use-bildirimler.ts (v1.1.0 sadelestirilmis)
   ───────────────────────────────────────────
   ESKI DAVRANIS (v1.0.x): Bu hook 6 kategori icin
   Supabase Realtime listener kuruyordu, app foreground
   iken local notification uretiyordu. App kapaliyken
   bildirim gelmiyordu.

   YENI DAVRANIS (v1.1.0): Bildirimlerin tamami SERVER
   tarafindan Edge Function (push-gonder) ile uretiliyor.
   Bu hook artik sadece:
   - Notification handler kur (foreground'da push gosterimi)
   - Android kanallarini olustur
   - Bildirim izni iste (use-push-token.ts ile koordineli)

   Tercih kontrolu: server-side, profiles.bildirim_tercihleri
   kolonundan (bkz. push-gonder Edge Function).
   Token yonetimi: use-push-token.ts hook'unda.
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
   Android kanallari (her kategori ayri kanal)
   Channel ID'leri push-gonder Edge Function'da
   KANAL_MAP ile birebir eslesmek zorunda.

   ANDROID QUIRK (v1.1.0'da kesfedildi):
   Bir kanal olusturulduktan sonra kod uzerinden importance,
   ses, titresim ayarlari DEGISTIRILEMEZ. Sadece kullanici
   Android Ayarlardan degistirebilir. v1.1.0 build'inde
   `sound: 'default'` string'i hatali kanal olarak yorumlandi
   ve ses gelmiyordu. Fix: eski kanallari delete + yeni
   versiyon ID'leri ile yeniden olustur (ID'lere '-v2'
   suffix eklendi). push-gonder Edge Function'i da yeni
   ID'lere set edildi.

   v1.1.2 fix (14 Haz 2026) — SES TEKRAR SESSIZ CIKTI:
   -v2 kanallari `sound` parametresi VERILMEDEN olusturuldu. Sanilanin
   aksine bu "sistem sesi" degil, SESSIZ kanal uretiyor: expo-notifications
   0.32.16 kaynaginda (AndroidXNotificationsChannelManager.java) `sound`
   anahtari yoksa `channel.setSound(...)` HIC cagrilmiyor ve kanal Samsung
   OneUI'da sessiz kaliyor. DOGRU COZUM: `sound: 'default'` ver. resolve('default')
   raw dosya bulamayinca Settings.System.DEFAULT_NOTIFICATION_URI'ye duser =
   sistem varsayilan bildirim sesi calar. Kanallar immutable oldugu icin
   ID'ler -v3'e bump'landi; eski (v1 + v2) kanallar silinir.

   ESKI ID'ler (silinecek) -> YENI ID (-v3, sound:'default'):
   ulasim-uyari / -v2    -> ulasim-uyari-v3
   trafik-uyari / -v2    -> trafik-uyari-v3
   saha-durumu  / -v2    -> saha-durumu-v3
   etkinlikler  / -v2    -> etkinlikler-v3
   sohbet       / -v2    -> sohbet-v3
   sistem       / -v2    -> sistem-v3
   ═══════════════════════════════════════════ */
const ESKI_KANAL_IDLER = [
  'ulasim-uyari',
  'trafik-uyari',
  'saha-durumu',
  'etkinlikler',
  'sohbet',
  'sistem',
  'ulasim-uyari-v2',
  'trafik-uyari-v2',
  'saha-durumu-v2',
  'etkinlikler-v2',
  'sohbet-v2',
  'sistem-v2',
];

async function androidKanallariOlustur() {
  if (Platform.OS !== 'android' || !Notifications || !bildirimDestekleniyor) return;

  // v1.1.1 fix: eski kanallari sil (varsa) — kullanici v1.1.0'dan guncelliyorsa
  // sessiz kanal ayarlarini temizler. Yeni kanallar '-v2' ID'li.
  for (const eskiId of ESKI_KANAL_IDLER) {
    try {
      await Notifications.deleteNotificationChannelAsync(eskiId);
    } catch {
      // kanal yoksa hata gelir, normal
    }
  }

  // Yeni -v3 kanallar: sound: 'default' VERILIYOR. expo-notifications bunu
  // raw resource olarak arar, bulamaz ve Settings.System.DEFAULT_NOTIFICATION_URI'ye
  // duser = sistem varsayilan bildirim sesi. (sound HIC verilmezse setSound
  // cagrilmaz ve kanal sessiz kalir — v1.1.1'deki gercek bug buydu.)
  // importance >= 3 (DEFAULT) ses icin sart; 4 (HIGH) ayrica heads-up acar.
  const kanallar = [
    { id: 'ulasim-uyari-v3', name: 'Ulaşım Uyarıları', importance: 4 },
    { id: 'trafik-uyari-v3', name: 'Trafik ve Yol Durumu', importance: 4 },
    { id: 'saha-durumu-v3', name: 'Saha Durumu', importance: 4 },
    { id: 'etkinlikler-v3', name: 'Etkinlikler', importance: 4 },
    { id: 'sohbet-v3', name: 'Sohbet Mesajları', importance: 4 },
    { id: 'sistem-v3', name: 'Sistem Güncellemeleri', importance: 4 },
    { id: 'ilanlar-v3', name: 'Rehber Aranıyor İlanları', importance: 4 },  // Eyl 2026
  ];
  try {
    for (const k of kanallar) {
      await Notifications.setNotificationChannelAsync(k.id, {
        name: k.name,
        importance: k.importance as any,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default', // -> DEFAULT_NOTIFICATION_URI (sistem varsayilan sesi)
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (e) {
    console.warn('Android kanal olusturma hata:', e);
  }
}

/* ═══════════════════════════════════════════
   Bildirim'a tiklayinca uygulamayi acan handler
   Veri payload'inda kategori varsa ilgili ekrana
   yonlendirme buradan tetiklenebilir (v1.1.0 baslangic:
   sadece app'i actir, ekrana yonlendirme v1.1.1'de).
   ═══════════════════════════════════════════ */
function tiklamaHandlerKur() {
  if (!Notifications || !bildirimDestekleniyor) return null;
  try {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      // v1.1.0 ilk turda sadece log
      // v1.1.1+: kategori bazli deep link (sohbet -> /(tabs)/sohbet, ulasim -> ana sayfa, vb.)
      console.log('Bildirim tiklandi:', data);
    });
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════
   Hook: useBildirimler
   _layout.tsx'te bir kere cagrilir.
   Hicbir Supabase Realtime listener kurmaz
   (eskiden 6 kanal vardi — hepsi server-side
   trigger'a tasindi, bkz. DECISIONS.md #42).
   ═══════════════════════════════════════════ */
export function useBildirimler() {
  const handlerRef = useRef<ReturnType<typeof tiklamaHandlerKur>>(null);

  useEffect(() => {
    (async () => {
      await androidKanallariOlustur();
    })();

    handlerRef.current = tiklamaHandlerKur();

    return () => {
      handlerRef.current?.remove();
      handlerRef.current = null;
    };
  }, []);

  return { bildirimDestekleniyor };
}
