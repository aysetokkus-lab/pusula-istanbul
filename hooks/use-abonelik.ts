import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_API_KEY, ENTITLEMENT_ID } from '../lib/revenuecat';

/* ═══════════════════════════════════════════
   Abonelik Durumu Hook'u
   ─────────────────────────────────────────
   RevenueCat + Supabase hibrit sistem:
   - RevenueCat: Gercek satin alma durumu
   - Supabase: Deneme suresi + admin/mod rolu
   ═══════════════════════════════════════════ */

export interface AbonelikDurumu {
  yukleniyor: boolean;
  aktifAbonelik: boolean;
  denemeSuresi: boolean;
  denemeBitis: Date | null;
  kalanGun: number;
  paywallGoster: boolean;
  yenile: () => Promise<void>;
}

const DENEME_GUN = 7;
let rcBaslatildi = false;

// RevenueCat'i baslat (uygulama basinda bir kez)
async function revenueCatBaslat(userId: string): Promise<void> {
  if (rcBaslatildi) return;
  if (!REVENUECAT_API_KEY) {
    console.warn('RevenueCat API key tanimli degil, atlanacak');
    return;
  }
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
    });
    rcBaslatildi = true;
    console.log('RevenueCat baslatildi, user:', userId);
  } catch (e) {
    console.warn('RevenueCat baslatilamadi:', e);
  }
}

// RevenueCat'ten abonelik durumu sorgula
async function rcAbonelikKontrol(): Promise<boolean> {
  if (!rcBaslatildi) return false;
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return !!entitlement;
  } catch (e) {
    console.warn('RevenueCat abonelik sorgu hatasi:', e);
    return false;
  }
}

export function useAbonelik(): AbonelikDurumu {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifAbonelik, setAktifAbonelik] = useState(false);
  const [denemeSuresi, setDenemeSuresi] = useState(true); // Default: deneme aktif (engelleme)
  const [denemeBitis, setDenemeBitis] = useState<Date | null>(null);
  const [kalanGun, setKalanGun] = useState(7);
  const [authDegisti, setAuthDegisti] = useState(0);

  const kontrolEt = useCallback(async () => {
    setYukleniyor(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAktifAbonelik(false);
        setDenemeSuresi(false);
        setKalanGun(0);
        setDenemeBitis(null);
        setYukleniyor(false);
        return;
      }

      // RevenueCat'i baslat (ilk seferde)
      await revenueCatBaslat(user.id);

      // Tek query ile hem rol hem abonelik durumunu cek
      const { data: profil, error } = await supabase
        .from('profiles')
        .select('rol, abonelik_durumu, abonelik_bitis')
        .eq('id', user.id)
        .single();

      // Profil bulunamazsa (yeni kayit, henuz olusmamis olabilir)
      if (error || !profil) {
        console.log('Profil bulunamadi, deneme suresi aktif sayiliyor');
        setAktifAbonelik(false);
        setDenemeSuresi(true);
        setKalanGun(DENEME_GUN);
        setDenemeBitis(null);
        setYukleniyor(false);
        return;
      }

      // Admin/moderator → abonelik gerekmez
      if (profil.rol === 'admin' || profil.rol === 'moderator') {
        setAktifAbonelik(true);
        setDenemeSuresi(false);
        setKalanGun(999);
        setDenemeBitis(null);
        setYukleniyor(false);
        return;
      }

      // 1) RevenueCat'ten kontrol (gercek satin alma)
      const rcAktif = await rcAbonelikKontrol();
      if (rcAktif) {
        setAktifAbonelik(true);
        setDenemeSuresi(false);
        setDenemeBitis(null);
        setYukleniyor(false);

        // Supabase'i de guncelle (senkronizasyon)
        if (profil.abonelik_durumu !== 'aktif') {
          await supabase.from('profiles').update({
            abonelik_durumu: 'aktif',
          }).eq('id', user.id);
        }
        return;
      }

      // 2) Supabase'den kontrol (fallback — ornegin web veya manual)
      if (profil.abonelik_durumu === 'aktif' && profil.abonelik_bitis) {
        const bitis = new Date(profil.abonelik_bitis);
        if (bitis > new Date()) {
          setAktifAbonelik(true);
          setDenemeSuresi(false);
          setDenemeBitis(bitis);
          setYukleniyor(false);
          return;
        }
      }

      // 3) Deneme suresi kontrolu — kayit tarihinden 7 gun
      const kayitTarihi = new Date(user.created_at);
      const denemeBitisT = new Date(kayitTarihi);
      denemeBitisT.setDate(denemeBitisT.getDate() + DENEME_GUN);

      const simdi = new Date();
      const kalanMs = denemeBitisT.getTime() - simdi.getTime();
      const kalanGunHesap = Math.max(0, Math.ceil(kalanMs / (1000 * 60 * 60 * 24)));

      setDenemeBitis(denemeBitisT);
      setKalanGun(kalanGunHesap);

      if (kalanGunHesap > 0) {
        setDenemeSuresi(true);
        setAktifAbonelik(false);
      } else {
        setDenemeSuresi(false);
        setAktifAbonelik(false);
      }
    } catch (e) {
      console.warn('Abonelik kontrol hatasi:', e);
      // Hata → kullaniciyi engelleme, deneme aktif say
      setAktifAbonelik(false);
      setDenemeSuresi(true);
      setKalanGun(7);
    } finally {
      setYukleniyor(false);
    }
  }, [authDegisti]);

  // Auth state degistiginde hook'u yeniden tetikle
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      setAuthDegisti(prev => prev + 1);
    });
    return () => subscription.unsubscribe();
  }, []);

  // RevenueCat listener — satin alma sonrasi otomatik guncelle
  useEffect(() => {
    if (!rcBaslatildi) return undefined;
    const listener = (customerInfo: CustomerInfo) => {
      const aktif = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (aktif) {
        setAktifAbonelik(true);
        setDenemeSuresi(false);
      }
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [rcBaslatildi]);

  useEffect(() => {
    kontrolEt();
  }, [kontrolEt]);

  const paywallGoster = !yukleniyor && !aktifAbonelik && !denemeSuresi;

  return {
    yukleniyor,
    aktifAbonelik,
    denemeSuresi,
    denemeBitis,
    kalanGun,
    paywallGoster,
    yenile: kontrolEt,
  };
}
