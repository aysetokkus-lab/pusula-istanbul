import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useBildirimTercihleri, type BildirimKategori } from './use-bildirim-tercihleri';

/* ═══════════════════════════════════════════
   Expo Go'da expo-notifications desteklenmiyor
   (SDK 53+). Sadece dev-build'de aktif.
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
   Yardımcı: İzin isteme
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
   Yardımcı: Lokal bildirim gönder
   ═══════════════════════════════════════════ */
async function bildirimGonder(baslik: string, icerik: string, kanal: string, veri?: Record<string, any>) {
  if (!Notifications || !bildirimDestekleniyor) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: baslik,
        body: icerik,
        data: veri || {},
        ...(Platform.OS === 'android' && { channelId: kanal }),
      },
      trigger: null,
    });
  } catch {
    bildirimDestekleniyor = false;
  }
}

/* ═══════════════════════════════════════════
   Yardımcı: Android kanalları oluştur
   ═══════════════════════════════════════════ */
async function androidKanallariOlustur() {
  if (Platform.OS !== 'android' || !Notifications || !bildirimDestekleniyor) return;
  const kanallar = [
    { id: 'ulasim-uyari', name: 'Ulaşım Uyarıları', importance: 4 },
    { id: 'trafik-uyari', name: 'Trafik ve Yol Durumu', importance: 4 },
    { id: 'saha-durumu', name: 'Saha Durumu', importance: 3 },
    { id: 'etkinlikler', name: 'Etkinlikler', importance: 3 },
    { id: 'sohbet', name: 'Sohbet Mesajları', importance: 4 },
    { id: 'sistem', name: 'Sistem Güncellemeleri', importance: 2 },
  ];
  try {
    for (const k of kanallar) {
      await Notifications.setNotificationChannelAsync(k.id, {
        name: k.name,
        importance: k.importance as any,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }
  } catch {
    bildirimDestekleniyor = false;
  }
}

/* ═══════════════════════════════════════════
   Tip etiketleri
   ═══════════════════════════════════════════ */
const ULASIM_TIP: Record<string, string> = {
  ariza: 'ARIZA', kesinti: 'KESİNTİ', gecikme: 'GECİKME', bilgi: 'BİLGİ', duyuru: 'DUYURU',
};

/* ═══════════════════════════════════════════
   Hook: useBildirimler
   Tüm 6 kategoriyi tek hook'ta yönetir.
   Tercihlere göre Supabase Realtime dinler.
   ═══════════════════════════════════════════ */
export function useBildirimler() {
  const { tercihler, yuklendi } = useBildirimTercihleri();
  const kanallarRef = useRef<Record<string, any>>({});
  const izinRef = useRef(false);

  // Kanal temizleme yardımcısı
  const kanalKaldir = useCallback((ad: string) => {
    if (kanallarRef.current[ad]) {
      supabase.removeChannel(kanallarRef.current[ad]);
      delete kanallarRef.current[ad];
    }
  }, []);

  const kanalEkle = useCallback((ad: string, kanal: any) => {
    kanallarRef.current[ad] = kanal;
  }, []);

  // ── 1. Başlangıç: İzin + Android kanalları ──
  useEffect(() => {
    (async () => {
      await androidKanallariOlustur();
      izinRef.current = await bildirimIzniIste();
    })();
    return () => {
      // Tüm kanalları temizle
      Object.keys(kanallarRef.current).forEach(k => {
        supabase.removeChannel(kanallarRef.current[k]);
      });
      kanallarRef.current = {};
    };
  }, []);

  // ── 2. Ulaşım Uyarıları (raylı sistem + trafik ayrı tercihle) ──
  // IBB Ulaşım kaynaklı uyarılar: tercihler.trafik
  // Diğer tüm raylı sistem uyarıları: tercihler.ulasim
  const TRAFIK_KAYNAK = 'x:IBBUlasim';

  useEffect(() => {
    if (!yuklendi) return;
    const AD = 'bildirim-ulasim';
    // Her iki tercihten biri bile açıksa subscription gerekli
    if (!tercihler.ulasim && !tercihler.trafik) { kanalKaldir(AD); return; }

    const ch = supabase
      .channel(AD)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ulasim_uyarilari' }, (p: any) => {
        const y = p.new;
        if (!y || !y.aktif) return;

        // Cozulmus uyarilar icin bildirim GONDERME
        if (y.cozuldu) return;

        // 1 saatten eski tweet'ler icin bildirim GONDERME
        // (uygulama acildiginda eski tweet'ler senkronize olabilir)
        const tweetYasi = Date.now() - new Date(y.tarih).getTime();
        if (tweetYasi > 60 * 60 * 1000) return;

        // Kaynak bazlı tercih kontrolü
        const trafikKaynagi = y.kaynak === TRAFIK_KAYNAK;
        if (trafikKaynagi && !tercihler.trafik) return;
        if (!trafikKaynagi && !tercihler.ulasim) return;

        const etiket = ULASIM_TIP[y.tip] || 'BİLGİ';
        const kanal = trafikKaynagi ? 'trafik-uyari' : 'ulasim-uyari';
        bildirimGonder(`[${etiket}] ${y.hat}`, y.icerik, kanal, { hat: y.hat, tip: y.tip, kaynak: y.kaynak });
      })
      .subscribe();
    kanalEkle(AD, ch);
    return () => kanalKaldir(AD);
  }, [yuklendi, tercihler.ulasim, tercihler.trafik]);

  // ── 3. Saha Durumu (canlı müze yoğunluk) ──
  useEffect(() => {
    if (!yuklendi) return;
    const AD = 'bildirim-saha';
    if (!tercihler.sahaDurumu) { kanalKaldir(AD); return; }

    const ch = supabase
      .channel(AD)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canli_durum' }, (p: any) => {
        const y = p.new;
        if (!y) return;
        // Sadece yüksek yoğunluk uyarısı gönder
        const yogunlukSeviye = y.yogunluk || y.seviye || '';
        if (yogunlukSeviye === 'cok_yogun' || yogunlukSeviye === 'yogun') {
          bildirimGonder(
            'Saha Durumu',
            `${y.mekan_isim || y.mekan_id || 'Bir mekan'}: ${yogunlukSeviye === 'cok_yogun' ? 'Çok yoğun' : 'Yoğun'}${y.aciklama ? ' — ' + y.aciklama : ''}`,
            'saha-durumu',
            { mekan: y.mekan_id },
          );
        }
      })
      .subscribe();
    kanalEkle(AD, ch);
    return () => kanalKaldir(AD);
  }, [yuklendi, tercihler.sahaDurumu]);

  // ── 4. Yaklaşan Etkinlikler ──
  useEffect(() => {
    if (!yuklendi) return;
    const AD = 'bildirim-etkinlik';
    if (!tercihler.etkinlikler) { kanalKaldir(AD); return; }

    const ch = supabase
      .channel(AD)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'etkinlikler' }, (p: any) => {
        const y = p.new;
        if (!y || !y.aktif) return;
        bildirimGonder(
          'Yeni Etkinlik',
          `${y.baslik}${y.tarih ? ' — ' + y.tarih : ''}${y.aciklama ? '\n' + y.aciklama : ''}`,
          'etkinlikler',
          { etkinlikId: y.id },
        );
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'etkinlikler' }, (p: any) => {
        const y = p.new;
        const eski = p.old;
        // Sadece aktif hale getirilen veya güncellenen etkinlikleri bildir
        if (!y || !y.aktif) return;
        if (eski && eski.aktif === y.aktif && eski.baslik === y.baslik) return;
        bildirimGonder(
          'Etkinlik Güncellendi',
          `${y.baslik}${y.tarih ? ' — ' + y.tarih : ''}`,
          'etkinlikler',
          { etkinlikId: y.id },
        );
      })
      .subscribe();
    kanalEkle(AD, ch);
    return () => kanalKaldir(AD);
  }, [yuklendi, tercihler.etkinlikler]);

  // ── 5. Sohbet Mesajları ──
  useEffect(() => {
    if (!yuklendi) return;
    const AD = 'bildirim-sohbet';
    if (!tercihler.sohbet) { kanalKaldir(AD); return; }

    // Kendi kullanıcı ID'mizi al (kendimize bildirim göndermeyelim)
    let benimId: string | null = null;
    supabase.auth.getUser().then(({ data }) => { benimId = data.user?.id || null; });

    const ch = supabase
      .channel(AD)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sohbet_mesajlari' }, (p: any) => {
        const y = p.new;
        if (!y) return;
        // Kendi mesajımıza bildirim gönderme
        if (y.kullanici_id === benimId) return;
        const gonderenAd = y.kullanici_isim || 'Bir rehber';
        bildirimGonder(
          'Yeni Mesaj',
          `${gonderenAd}: ${(y.mesaj || y.icerik || '').substring(0, 100)}`,
          'sohbet',
          { mesajId: y.id },
        );
      })
      .subscribe();
    kanalEkle(AD, ch);
    return () => kanalKaldir(AD);
  }, [yuklendi, tercihler.sohbet]);

  // ── 6. Sistem Güncellemeleri (admin değişiklikleri) ──
  useEffect(() => {
    if (!yuklendi) return;
    const AD = 'bildirim-sistem';
    if (!tercihler.admin) { kanalKaldir(AD); return; }

    const ch = supabase
      .channel(AD)
      // Mekan saatleri değişikliği
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mekan_saatleri' }, (p: any) => {
        const y = p.new;
        const eski = p.old;
        if (!y) return;
        // Sadece saat değişikliklerini bildir
        if (eski && eski.acilis === y.acilis && eski.kapanis === y.kapanis && eski.fiyat_yabanci === y.fiyat_yabanci) return;
        const degisiklik = [];
        if (eski?.acilis !== y.acilis || eski?.kapanis !== y.kapanis) degisiklik.push('saat');
        if (eski?.fiyat_yabanci !== y.fiyat_yabanci) degisiklik.push('fiyat');
        bildirimGonder(
          'Saat Güncellendi',
          `${y.isim}: ${degisiklik.join(' ve ')} değişti${y.acilis ? ' — ' + y.acilis + '/' + y.kapanis : ''}`,
          'sistem',
          { mekanId: y.mekan_id },
        );
      })
      // Havalimanı sefer tarife değişikliği
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'havalimani_seferleri' }, (p: any) => {
        const y = p.new;
        if (!y) return;
        bildirimGonder('Tarife Güncellendi', `${y.durak_adi || 'Bir güzergah'} tarife bilgisi değişti${y.fiyat ? ' — ' + y.fiyat : ''}`, 'sistem');
      })
      // Boğaz turu tarife değişikliği
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bogaz_turlari' }, (p: any) => {
        const y = p.new;
        if (!y) return;
        bildirimGonder('Tarife Güncellendi', `${y.sirket_adi || 'Bir tur'} tarife bilgisi değişti`, 'sistem');
      })
      .subscribe();
    kanalEkle(AD, ch);
    return () => kanalKaldir(AD);
  }, [yuklendi, tercihler.admin]);

  return { bildirimDestekleniyor };
}
