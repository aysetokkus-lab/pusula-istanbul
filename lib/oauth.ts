/* ═══════════════════════════════════════════
   OAuth girişleri (Eyl 2026) — Google (tarayıcı akışı) + Apple (iOS yerli)
   ───────────────────────────────────────────
   Google: supabase.auth.signInWithOAuth(skipBrowserRedirect) → expo-web-browser
           openAuthSessionAsync → dönen URL'den session kurulur
           (implicit: #access_token / PKCE: ?code). Web'de sayfa yönlenir,
           dönüşte giris.tsx `oauthDonusuIsle(window.location.href)` çağırır.
   Apple:  expo-apple-authentication (yalnızca iOS) → identityToken →
           supabase.auth.signInWithIdToken. Ad/soyad yalnızca ilk girişte gelir,
           profile yazılır. Android'de Apple girişi SUNULMAZ (Ayşe kararı:
           Supabase Apple secret'ının 6 ayda bir yenilenmesi gerekmesin).
   Sonrası: OAuth ile gelen kullanıcıda ruhsat_no / telefon boş → _layout
           /profil-tamamla ekranına yönlendirir (kayıtta ikisi de zorunlu).
   ═══════════════════════════════════════════ */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthSonuc = { ok: true } | { ok: false; iptal?: boolean; hata: string };

const NATIVE_REDIRECT = 'pusulaistanbul://giris';

function webRedirect(): string {
  if (typeof window !== 'undefined' && window.location) return `${window.location.origin}/giris`;
  return 'https://pusulaistanbul.app';
}

/** Dönüş URL'sindeki token/code'dan Supabase oturumu kurar. Oturum kurulduysa true. */
export async function oauthDonusuIsle(url: string): Promise<{ oturum: boolean; hata?: string }> {
  if (!url) return { oturum: false };
  let access_token: string | null = null;
  let refresh_token: string | null = null;
  let code: string | null = null;
  let errDesc: string | null = null;

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const hp = new URLSearchParams(url.substring(hashIndex + 1));
    access_token = hp.get('access_token');
    refresh_token = hp.get('refresh_token');
    errDesc = hp.get('error_description') || hp.get('error');
  }
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
    const qp = new URLSearchParams(url.substring(queryIndex + 1).split('#')[0]);
    code = qp.get('code');
    errDesc = errDesc || qp.get('error_description') || qp.get('error');
  }

  if (errDesc) return { oturum: false, hata: decodeURIComponent(errDesc.replace(/\+/g, ' ')) };

  try {
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return { oturum: false, hata: error.message };
      return { oturum: true };
    }
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { oturum: false, hata: error.message };
      return { oturum: true };
    }
  } catch (e: any) {
    return { oturum: false, hata: e?.message || 'Oturum kurulamadı' };
  }
  return { oturum: false };
}

/** Google ile giriş — Android/iOS: sistem tarayıcısı; Web: sayfa yönlenir (dönüşü giris.tsx işler) */
export async function googleIleGiris(): Promise<OAuthSonuc> {
  const web = Platform.OS === 'web';
  const redirectTo = web ? webRedirect() : NATIVE_REDIRECT;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: !web,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) return { ok: false, hata: error.message };
  if (web) return { ok: true };   // tarayıcı Google'a gitti; dönüş ayrı işlenir
  if (!data?.url) return { ok: false, hata: 'Google giriş bağlantısı alınamadı' };

  const sonuc = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { showInRecents: true });
  if (sonuc.type !== 'success') return { ok: false, iptal: true, hata: 'Giriş iptal edildi' };
  const r = await oauthDonusuIsle(sonuc.url);
  if (!r.oturum) return { ok: false, hata: r.hata || 'Google oturumu kurulamadı' };
  return { ok: true };
}

/** Apple ile giriş — yalnızca iOS. Cihaz desteklemiyorsa false döner. */
export async function appleGirisiVarMi(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try { return await AppleAuthentication.isAvailableAsync(); } catch { return false; }
}

export async function appleIleGiris(): Promise<OAuthSonuc> {
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!cred.identityToken) return { ok: false, hata: 'Apple kimlik belirteci alınamadı' };
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
    if (error) return { ok: false, hata: error.message };

    // Ad/soyad yalnızca İLK Apple girişinde gelir — profile hemen yaz (sonraki girişlerde null)
    const isim = cred.fullName?.givenName?.trim();
    const soyisim = cred.fullName?.familyName?.trim();
    if (data.user && (isim || soyisim)) {
      try {
        const { data: p } = await supabase.from('profiles').select('isim, soyisim').eq('id', data.user.id).single();
        const patch: Record<string, string> = {};
        if (isim && !p?.isim) patch.isim = isim;
        if (soyisim && !p?.soyisim) patch.soyisim = soyisim;
        if (Object.keys(patch).length) await supabase.from('profiles').update(patch).eq('id', data.user.id);
        await supabase.auth.updateUser({ data: { isim: isim || undefined, soyisim: soyisim || undefined } });
      } catch {}
    }
    return { ok: true };
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED' || e?.code === 'ERR_CANCELED') return { ok: false, iptal: true, hata: 'Giriş iptal edildi' };
    return { ok: false, hata: e?.message || 'Apple girişi başarısız' };
  }
}

/**
 * Profil eksik mi? (OAuth ile gelen kullanıcı: ruhsat_no / telefon boş olabilir.)
 * _layout yönlendirmesi ve profil-tamamla ekranı kullanır.
 */
export async function profilEksikMi(userId: string): Promise<{ eksik: boolean; profil: { isim: string; soyisim: string; ruhsat_no: string | null; telefon: string | null } | null }> {
  const { data } = await supabase.from('profiles').select('isim, soyisim, ruhsat_no, telefon').eq('id', userId).maybeSingle();
  if (!data) return { eksik: true, profil: null };
  // Ruhsat no ya da isim yoksa → tamamlama ekranı (telefon orada da zorunlu).
  // Yalnızca telefonu boş olan ESKİ kullanıcılar buraya düşmez — onlara ana sayfadaki TelefonKarti (yumuşak istem).
  const eksik = !data.ruhsat_no?.trim() || !data.isim?.trim();
  return { eksik, profil: data as any };
}
