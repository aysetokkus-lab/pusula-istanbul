import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import { avatarDinleyicileriUyar, avatarOnbellek } from '../hooks/use-avatarlar';

/* expo-image-manipulator NATIVE modul: uygulamanin ustunde import edilmez — eski dev build'de
   (modul yokken) tum ekranin yuklenmesini bozuyordu (4 Eyl: Sohbet/Ilanlar/Profil sekmeleri kayboldu).
   Ihtiyac aninda require edilir; modul yoksa kucultme atlanir, picker'in kare kirpmasi kullanilir. */
function manipulatorGetir(): typeof import('expo-image-manipulator') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-manipulator');
  } catch (e: any) {
    console.warn('[Avatar] expo-image-manipulator yok, kucultme atlaniyor:', e?.message);
    return null;
  }
}

/* ═══════════════════════════════════════════
   Profil fotoğrafı (Eyl 2026)
   ─────────────────────────────────────────
   İsteğe bağlı. Kamera/Galeri → kare kırp → 512px → JPEG (0.85) →
   bucket `profil-fotolari/<uid>/avatar.jpg` (upsert; herkes okur, sahibi yazar/siler,
   admin/moderator silebilir) → profiles.avatar_url (public URL + ?v=zaman: aynı yol
   yeniden yüklendiğinde expo-image önbelleği eskisini göstermesin).
   - avatarSec(): seçim (allowsEditing kare)
   - avatarIsle(): kare kırp + küçült
   - avatarYukle(): yükle + profil güncelle → URL
   - avatarKaldir(): dosyayı sil + profil alanını boşalt
   Önbellek: avatarOnbellek (hooks/use-avatarlar.ts toplu okur; kendi değişikliği anında yansır)
   ═══════════════════════════════════════════ */

export const AVATAR_BUCKET = 'profil-fotolari';
export const AVATAR_BOYUT = 512;

export interface SecilenAvatar { uri: string; width?: number; height?: number }

/** Kamera / Galeri seçimi — kare kırpma editörü açık */
export async function avatarSec(): Promise<SecilenAvatar | null> {
  const secenek = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 1, exif: false };
  return new Promise((resolve) => {
    const galeri = async () => {
      try {
        const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!izin.granted) { Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişimi gerekli.'); return resolve(null); }
        const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, ...secenek });
        if (sonuc.canceled || !sonuc.assets?.length) return resolve(null);
        const a = sonuc.assets[0];
        resolve({ uri: a.uri, width: a.width, height: a.height });
      } catch (e: any) { Alert.alert('Hata', e?.message || 'Fotoğraf seçilemedi.'); resolve(null); }
    };
    const kamera = async () => {
      try {
        const izin = await ImagePicker.requestCameraPermissionsAsync();
        if (!izin.granted) { Alert.alert('İzin Gerekli', 'Fotoğraf çekebilmek için kamera erişimi gerekli.'); return resolve(null); }
        const sonuc = await ImagePicker.launchCameraAsync({ ...secenek, cameraType: ImagePicker.CameraType.front });
        if (sonuc.canceled || !sonuc.assets?.length) return resolve(null);
        const a = sonuc.assets[0];
        resolve({ uri: a.uri, width: a.width, height: a.height });
      } catch (e: any) { Alert.alert('Hata', e?.message || 'Fotoğraf çekilemedi.'); resolve(null); }
    };
    Alert.alert('Profil Fotoğrafı', 'Sohbette ve ilanlarda adının yanında görünür', [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(null) },
      { text: 'Kamera', onPress: kamera },
      { text: 'Galeri', onPress: galeri },
    ]);
  });
}

/** Ortadan kare kırp + 512px küçült + JPEG. Boyut bilinmiyorsa sadece küçültür. */
export async function avatarIsle(secim: SecilenAvatar): Promise<string> {
  const im = manipulatorGetir();
  if (!im) return secim.uri;
  const { ImageManipulator, SaveFormat } = im;
  const ctx = ImageManipulator.manipulate(secim.uri);
  if (secim.width && secim.height && secim.width !== secim.height) {
    const kenar = Math.min(secim.width, secim.height);
    ctx.crop({
      originX: Math.floor((secim.width - kenar) / 2),
      originY: Math.floor((secim.height - kenar) / 2),
      width: kenar,
      height: kenar,
    });
  }
  ctx.resize({ width: AVATAR_BOYUT, height: AVATAR_BOYUT });
  const resim = await ctx.renderAsync();
  const kayit = await resim.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  resim.release();
  return kayit.uri;
}

/** Seçilen fotoğrafı işle, yükle, profili güncelle → yeni URL (hata: null) */
export async function avatarYukle(secim: SecilenAvatar): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş gerekli');
    const uri = await avatarIsle(secim);
    const res = await fetch(uri);
    const arrayBuffer = await new Response(await res.blob()).arrayBuffer();
    if (arrayBuffer.byteLength > 2 * 1024 * 1024) throw new Error('Fotoğraf çok büyük (en fazla 2 MB).');
    const path = `${user.id}/avatar.jpg`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const url = `${supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const { error: pe } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    if (pe) throw pe;
    avatarOnbellek.set(user.id, url);
    avatarDinleyicileriUyar();
    return url;
  } catch (e: any) {
    console.warn('[Avatar] yükleme hatası:', e?.message);
    Alert.alert('Yüklenemedi', e?.message || 'Fotoğraf yüklenemedi, tekrar dene.');
    return null;
  }
}

/** Fotoğrafı kaldır: dosya silinir, profiles.avatar_url NULL */
export async function avatarKaldir(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş gerekli');
    await supabase.storage.from(AVATAR_BUCKET).remove([`${user.id}/avatar.jpg`]);
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    if (error) throw error;
    avatarOnbellek.set(user.id, null);
    avatarDinleyicileriUyar();
    return true;
  } catch (e: any) {
    Alert.alert('Kaldırılamadı', e?.message || 'Tekrar dene.');
    return false;
  }
}

export { avatarDinle, avatarOnbellek } from '../hooks/use-avatarlar';
