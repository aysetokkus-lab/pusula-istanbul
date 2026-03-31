/* ═══════════════════════════════════════════
   Pusula Istanbul — RevenueCat Konfigurasyonu
   ─────────────────────────────────────────
   API anahtarlari ve urun ID'leri
   ═══════════════════════════════════════════ */

import { Platform } from 'react-native';

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
