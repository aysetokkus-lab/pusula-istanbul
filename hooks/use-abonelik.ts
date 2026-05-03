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

/**
 * RevenueCat product identifier'dan plan tipini cikar.
 * Apple format:    "com.pusulaistanbul.app.yillik"
 * Play format:     "com.pusulaistanbul.app.yillik:yillik-yeni"
 * Ikisi de "yillik" veya "aylik" alt-stringini icerir.
 */
function planFromProductId(productId: string | undefined | null): 'yillik' | 'aylik' | null {
  if (!productId) return null;
  if (productId.includes('yillik')) return 'yillik';
  if (productId.includes('aylik')) return 'aylik';
  return null;
}

interface RCSonuc {
  aktif: boolean;
  productId?: string;
  expirationDate?: string; // ISO string, RC entitlement.expirationDate
}

// RevenueCat'ten abonelik durumu sorgula — plan ve bitis tarihiyle birlikte
async function rcAbonelikKontrol(): Promise<RCSonuc> {
  if (!isRCReady()) return { aktif: false };
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return { aktif: false };
    return {
      aktif: true,
      productId: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate ?? undefined,
    };
  } catch (e) {
    console.warn('RevenueCat abonelik sorgu hatasi:', e);
    return { aktif: false };
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
        .select('rol, abonelik_durumu, abonelik_plani, abonelik_bitis')
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
      const rcSonuc = await rcAbonelikKontrol();
      if (rcSonuc.aktif) {
        setAktifAbonelik(true);
        setIsAdminMod(false);
        setYukleniyor(false);

        // Supabase'i de guncelle (durumu + plan + bitis)
        // BUG FIX (v1.0.11): onceden sadece abonelik_durumu yaziyordu, plan/bitis
        // NULL kaliyordu (6 kullanicida tespit edildi, bkz. DECISIONS.md #30/#31).
        // Artik RC entitlement'tan productIdentifier ve expirationDate'i de yansitiyoruz.
        const yeniPlan = planFromProductId(rcSonuc.productId);
        const update: Record<string, any> = {};
        if (profil.abonelik_durumu !== 'aktif') update.abonelik_durumu = 'aktif';
        if (yeniPlan && profil.abonelik_plani !== yeniPlan) update.abonelik_plani = yeniPlan;
        if (rcSonuc.expirationDate && profil.abonelik_bitis !== rcSonuc.expirationDate) {
          update.abonelik_bitis = rcSonuc.expirationDate;
        }
        if (Object.keys(update).length > 0) {
          await supabase.from('profiles').update(update).eq('id', user.id);
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
        const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (entitlement) {
          setAktifAbonelik(true);

          // Supabase'i de senkronize et — durum + plan + bitis
          // BUG FIX (v1.0.11): listener da onceden sadece abonelik_durumu yaziyordu.
          const yeniPlan = planFromProductId(entitlement.productIdentifier);
          const update: Record<string, any> = { abonelik_durumu: 'aktif' };
          if (yeniPlan) update.abonelik_plani = yeniPlan;
          if (entitlement.expirationDate) update.abonelik_bitis = entitlement.expirationDate;

          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('profiles').update(update).eq('id', user.id);
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
