import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENT_ID, revenueCatLogin, isRCReady } from '../lib/revenuecat';

/* ═══════════════════════════════════════════
   Abonelik Durumu Hook'u — FREEMIUM MODEL
   ─────────────────────────────────────────
   Uygulama ucretsiz indirilir, temel ozellikler
   herkese acik. Premium ozellikler (sohbet, canli
   durum, etkinlikler, ulasim uyarilari) icin
   IAP abonelik gerekir.

   RevenueCat: _layout.tsx'de anonim olarak baslatilir.
   Kullanici giris yapinca revenueCatLogin() ile
   eslestirilir. Gercek satin alma durumu (tek kaynak).
   Supabase: Admin/mod rol kontrolu + fallback

   Deneme suresi KALDIRILDI — Apple 3.1.1 uyumu icin
   tum ucretli erisim IAP uzerinden saglanir.
   ═══════════════════════════════════════════ */

export interface AbonelikDurumu {
  yukleniyor: boolean;
  aktifAbonelik: boolean;
  premiumMi: boolean;        // aktifAbonelik || admin/mod
  denemeSuresi: boolean;     // Artik her zaman false (geriye uyumluluk)
  denemeBitis: Date | null;  // Artik her zaman null
  kalanGun: number;          // Artik her zaman 0
  paywallGoster: boolean;    // Artik her zaman false (global paywall yok)
  yenile: () => Promise<void>;
}

// RevenueCat'ten abonelik durumu sorgula
async function rcAbonelikKontrol(): Promise<boolean> {
  if (!isRCReady()) return false;
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
  const [isAdminMod, setIsAdminMod] = useState(false);
  const [authDegisti, setAuthDegisti] = useState(0);

  const kontrolEt = useCallback(async () => {
    setYukleniyor(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Oturumsuz kullanici — temel ozelliklere erisebilir, premium'a erisemez
        setAktifAbonelik(false);
        setIsAdminMod(false);
        setYukleniyor(false);
        return;
      }

      // Kullaniciyi RevenueCat'e tanimla (RC _layout'ta anonim baslatildi)
      await revenueCatLogin(user.id);

      // Tek query ile hem rol hem abonelik durumunu cek
      const { data: profil, error } = await supabase
        .from('profiles')
        .select('rol, abonelik_durumu, abonelik_bitis')
        .eq('id', user.id)
        .single();

      // Profil bulunamazsa (yeni kayit)
      if (error || !profil) {
        console.log('Profil bulunamadi — premium degil');
        setAktifAbonelik(false);
        setIsAdminMod(false);
        setYukleniyor(false);
        return;
      }

      // Admin/moderator → premium erisim (IAP gerekmez)
      if (profil.rol === 'admin' || profil.rol === 'moderator') {
        setAktifAbonelik(true);
        setIsAdminMod(true);
        setYukleniyor(false);
        return;
      }

      // 1) RevenueCat'ten kontrol (gercek IAP satin alma — tek kaynak)
      const rcAktif = await rcAbonelikKontrol();
      if (rcAktif) {
        setAktifAbonelik(true);
        setIsAdminMod(false);
        setYukleniyor(false);

        // Supabase'i de guncelle (senkronizasyon)
        if (profil.abonelik_durumu !== 'aktif') {
          await supabase.from('profiles').update({
            abonelik_durumu: 'aktif',
          }).eq('id', user.id);
        }
        return;
      }

      // 2) Supabase'den kontrol (fallback — manual abonelik veya demo hesap)
      if (profil.abonelik_durumu === 'aktif' && profil.abonelik_bitis) {
        const bitis = new Date(profil.abonelik_bitis);
        if (bitis > new Date()) {
          setAktifAbonelik(true);
          setIsAdminMod(false);
          setYukleniyor(false);
          return;
        }
      }

      // Premium aktif degil
      setAktifAbonelik(false);
      setIsAdminMod(false);
    } catch (e) {
      console.warn('Abonelik kontrol hatasi:', e);
      // Hata → premium aktif sayma (IAP odakli model)
      setAktifAbonelik(false);
      setIsAdminMod(false);
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

  // Supabase profiles tablosundaki abonelik degisikliklerini dinle
  useEffect(() => {
    const channel = supabase
      .channel('abonelik-degisim')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        if (payload.new?.abonelik_durumu === 'aktif') {
          setAktifAbonelik(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // RevenueCat listener — satin alma sonrasi otomatik guncelle
  // RC hazir olana kadar polling ile bekle, hazir olunca listener ekle
  useEffect(() => {
    let iptal = false;
    let cleanupListener: (() => void) | null = null;

    const listenerEkle = () => {
      if (iptal) return;
      const listener = (customerInfo: CustomerInfo) => {
        const aktif = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (aktif) {
          setAktifAbonelik(true);
          // Supabase'i de senkronize et
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('profiles').update({
                abonelik_durumu: 'aktif',
              }).eq('id', user.id);
            }
          });
        }
      };
      Purchases.addCustomerInfoUpdateListener(listener);
      cleanupListener = () => { Purchases.removeCustomerInfoUpdateListener(listener); };
    };

    if (isRCReady()) {
      listenerEkle();
    } else {
      // RC henuz hazir degil — 2sn arayla kontrol et (max 30sn)
      let deneme = 0;
      const timer = setInterval(() => {
        deneme++;
        if (isRCReady()) {
          clearInterval(timer);
          listenerEkle();
        } else if (deneme >= 15) {
          clearInterval(timer);
        }
      }, 2000);
      cleanupListener = () => { clearInterval(timer); };
    }

    return () => {
      iptal = true;
      if (cleanupListener) cleanupListener();
    };
  }, []);

  useEffect(() => {
    kontrolEt();
  }, [kontrolEt]);

  const premiumMi = aktifAbonelik || isAdminMod;

  return {
    yukleniyor,
    aktifAbonelik,
    premiumMi,
    denemeSuresi: false,    // Geriye uyumluluk — freemium'da deneme yok
    denemeBitis: null,
    kalanGun: 0,
    paywallGoster: false,   // Global paywall yok — ekran bazinda kontrol
    yenile: kontrolEt,
  };
}
