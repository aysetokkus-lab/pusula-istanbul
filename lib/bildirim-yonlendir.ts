import { router } from 'expo-router';

/* ═══════════════════════════════════════════
   Bildirim yönlendirme (4 Eyl 2026)
   ─────────────────────────────────────────
   Push payload'ı (data.kategori + veri) ve uygulama içi Bildirimler listesi aynı haritayı kullanır.
   Tetikleyicilerin veri anahtarları: dm/konusmaId (dm_gonder), mesajId/yanit/pinned (sohbet),
   ilanId (ilan), nokta_id (saha), hat/tip (ulasım), etkinlikId, duyuruId, mekanId (mekan saatleri),
   turId (bogaz), durakId (havalimani).
   ═══════════════════════════════════════════ */

export type BildirimVeri = Record<string, unknown> | null | undefined;

/** Kategori + veri → gidilecek rota (null = ana sayfa) */
export function bildirimHedefi(kategori: string | undefined, veri: BildirimVeri): { pathname: string; params?: Record<string, string> } {
  const v = (veri ?? {}) as Record<string, unknown>;
  if (v.dm === true && typeof v.konusmaId === 'string') return { pathname: '/dm/[id]', params: { id: v.konusmaId } };
  if (kategori === 'sohbet') return { pathname: '/(tabs)/sohbet' };
  if (kategori === 'ilanlar' || typeof v.ilanId === 'string') return { pathname: '/(tabs)/ilanlar' };
  if (typeof v.mekanId === 'string') return { pathname: '/(tabs)/muzeler' };
  if (typeof v.turId === 'string') return { pathname: '/(tabs)/bogaz' };
  if (typeof v.durakId === 'string') return { pathname: '/(tabs)/ulasim' };
  // sahaDurumu, ulasim, trafik, etkinlikler, admin (duyuru) → ana sayfa (bantlar orada)
  return { pathname: '/(tabs)' };
}

/** Rotaya git — Stack mount olmadan çağrılırsa expo-router sessizce düşer; çağıran hazır olmayı beklemeli. */
export function bildirimeGit(kategori: string | undefined, veri: BildirimVeri) {
  const hedef = bildirimHedefi(kategori, veri);
  try {
    if (hedef.params) router.push({ pathname: hedef.pathname, params: hedef.params } as never);
    else router.push(hedef.pathname as never);
  } catch (e) {
    console.warn('[Bildirim] yönlendirme hatası:', e);
  }
}
