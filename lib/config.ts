/* ═══════════════════════════════════════════
   Pusula Istanbul — Uygulama Konfigurasyonu

   Environment variable'lardan okur.
   EAS Build icin: eas secret:create ile tanimla
   Lokal gelistirme icin: .env dosyasi veya eas.json env blogu
   ═══════════════════════════════════════════ */

// X (Twitter) API Bearer Token
export const X_BEARER_TOKEN = process.env.EXPO_PUBLIC_X_BEARER_TOKEN || '';

// X API senkronizasyon ayarlari
export const X_SENKRON_ARALIK_DK = 15;  // Her 15 dakikada bir senkronize et
export const X_MAX_TWEET = 10;           // Hesap basina max tweet sayisi
