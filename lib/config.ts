/* ═══════════════════════════════════════════
   Pusula Istanbul — Uygulama Konfigurasyonu

   Environment variable'lardan okur.
   EAS Build icin: eas env:create ile tanimla
   Lokal gelistirme icin: .env dosyasi veya eas.json env blogu

   v1.1.0: X API client-side senkronu kaldirildi (Edge Function'a tasindi,
   bkz. DECISIONS #36 + INFRASTRUCTURE.md Bolum 13). Eski X_BEARER_TOKEN,
   X_SENKRON_ARALIK_DK, X_MAX_TWEET sabitleri silindi.
   ═══════════════════════════════════════════ */

// Su an konfigurasyon sabit yok — server-side env (Edge Function) kullaniliyor.
export {};
