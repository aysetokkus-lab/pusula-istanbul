/* ═══════════════════════════════════════════
   Pusula Istanbul — RevenueCat Konfigurasyonu
   ─────────────────────────────────────────
   API anahtarlari, urun ID'leri ve
   baslatma / giris yardimci fonksiyonlari.

   Onemli: configure() uygulama acilirken (_layout)
   anonim olarak cagirilir. Kullanici giris yapinca
   logIn() ile eslestirilir.
   ═══════════════════════════════════════════ */

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// RevenueCat API Keys
// Apps & providers > Public API Key (her platform icin ayri)
export const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_UEZZvNMSObhbFKHuNIRfnRPBOXa',
  android: 'goog_mduKuiBtLQZiodClUWLlbOgImSm',
  default: '',
}) as string;

// Entitlement ID (RevenueCat dashboard'da tanimladik)
export const ENTITLEMENT_ID = 'premium';

// Urun ID'leri (store'larda tanimladigimiz)
export const PRODUCT_IDS = {
  aylik: 'com.pusulaistanbul.app.aylik',
  yillik: 'com.pusulaistanbul.app.yillik',
};

// RevenueCat Offering ID
export const OFFERING_ID = 'default';

/* ─── Baslatma & Giris Yardimcilari ─── */

let rcBaslatildi = false;

/** Uygulama acilirken bir kez cagir (anonim kullanici). */
export async function revenueCatInit(): Promise<void> {
  if (rcBaslatildi || !REVENUECAT_API_KEY) return;
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    rcBaslatildi = true;
    console.log('RevenueCat baslatildi (anonim)');
  } catch (e) {
    console.warn('RevenueCat baslatilamadi:', e);
  }
}

/** Kullanici giris yapinca cagir — anonim kullaniciyi gercek kullaniciyla eslestirir. */
export async function revenueCatLogin(userId: string): Promise<void> {
  if (!rcBaslatildi) await revenueCatInit();
  if (!rcBaslatildi) return;
  try {
    await Purchases.logIn(userId);
    console.log('RevenueCat logIn basarili, user:', userId);
  } catch (e) {
    console.warn('RevenueCat logIn hatasi:', e);
  }
}

/** Kullanici cikis yapinca cagir. */
export async function revenueCatLogout(): Promise<void> {
  if (!rcBaslatildi) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('RevenueCat logOut hatasi:', e);
  }
}

/** RevenueCat hazir mi? */
export function isRCReady(): boolean {
  return rcBaslatildi;
}
