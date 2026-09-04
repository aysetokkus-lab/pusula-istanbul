import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTema } from '../hooks/use-tema';
import { supabase } from '../lib/supabase';
import { Font, Radius } from '../constants/theme';

/* ═══════════════════════════════════════════
   Sohbet Görsel Paylaşımı (Eyl 2026)
   ─────────────────────────────────────────
   Bucket: sohbet-gorseller (public okuma; giriş yapan kullanıcı kendi
   klasörüne yükler: <uid>/<zaman>-<rnd>.<ext>, 5 MB, sadece resim).
   - gorselSec(): Kamera / Galeri seçimi (Alert), quality 0.7
   - sohbetGorselYukle(): storage'a yükler, public URL döner
   - GorselButon: yazma kutusunun solundaki ikon
   - GorselOnizleme: seçilen görselin gönderim öncesi şeridi
   - MesajGorseli: balon içi küçük resim (dokununca tam ekran)
   - TamEkranGorsel: tam ekran modal
   EMOJİ YOK — ikonlar SVG.
   ═══════════════════════════════════════════ */

const { width: EKRAN_W, height: EKRAN_H } = Dimensions.get('window');

export interface SecilenGorsel { uri: string; mime: string; width?: number; height?: number }

export async function gorselSec(): Promise<SecilenGorsel | null> {
  return new Promise((resolve) => {
    const galeri = async () => {
      try {
        const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!izin.granted) { Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişimi gerekli.'); return resolve(null); }
        const sonuc = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: false, exif: false,
        });
        if (sonuc.canceled || !sonuc.assets?.length) return resolve(null);
        const a = sonuc.assets[0];
        resolve({ uri: a.uri, mime: a.mimeType || 'image/jpeg', width: a.width, height: a.height });
      } catch (e: any) { Alert.alert('Hata', e?.message || 'Fotoğraf seçilemedi.'); resolve(null); }
    };
    const kamera = async () => {
      try {
        const izin = await ImagePicker.requestCameraPermissionsAsync();
        if (!izin.granted) { Alert.alert('İzin Gerekli', 'Fotoğraf çekebilmek için kamera erişimi gerekli.'); return resolve(null); }
        const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false, exif: false });
        if (sonuc.canceled || !sonuc.assets?.length) return resolve(null);
        const a = sonuc.assets[0];
        resolve({ uri: a.uri, mime: a.mimeType || 'image/jpeg', width: a.width, height: a.height });
      } catch (e: any) { Alert.alert('Hata', e?.message || 'Fotoğraf çekilemedi.'); resolve(null); }
    };
    Alert.alert('Görsel Paylaş', 'Sahadan bir kare ekle', [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(null) },
      { text: 'Kamera', onPress: kamera },
      { text: 'Galeri', onPress: galeri },
    ]);
  });
}

/** Storage'a yükle → public URL (hata: null) */
export async function sohbetGorselYukle(uri: string, mime: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş gerekli');
    const res = await fetch(uri);
    const blob = await res.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      Alert.alert('Görsel çok büyük', 'En fazla 5 MB. Lütfen daha küçük bir görsel seçin.');
      return null;
    }
    const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('sohbet-gorseller').upload(path, arrayBuffer, { contentType: mime, upsert: false });
    if (error) throw error;
    return supabase.storage.from('sohbet-gorseller').getPublicUrl(path).data.publicUrl;
  } catch (e: any) {
    console.warn('[Sohbet] görsel yükleme hatası:', e?.message);
    return null;
  }
}

/** Kamera ikonu — 24px stroke */
export function KameraIkon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.9} strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

function KapatIkon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

/** Yazma kutusu solundaki görsel butonu */
export function GorselButon({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const { t } = useTema();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel="Görsel ekle"
      style={[s.gorselBtn, { backgroundColor: t.bgSecondary, borderColor: t.kartBorder, opacity: disabled ? 0.5 : 1 }]}
    >
      <KameraIkon color={t.primary} />
    </TouchableOpacity>
  );
}

/** Gönderim öncesi seçilen görsel şeridi */
export function GorselOnizleme({ gorsel, yukleniyor, onKaldir }: { gorsel: SecilenGorsel; yukleniyor: boolean; onKaldir: () => void }) {
  const { t } = useTema();
  return (
    <View style={[s.onizleme, { backgroundColor: t.bgSecondary, borderTopColor: t.divider }]}>
      <Image source={{ uri: gorsel.uri }} style={s.onizlemeResim} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={[s.onizlemeBaslik, { color: t.primary }]}>Görsel eklendi</Text>
        <Text style={[s.onizlemeAlt, { color: t.textSecondary }]}>{yukleniyor ? 'Yükleniyor…' : 'Gönder ile paylaşılır'}</Text>
      </View>
      {yukleniyor ? (
        <ActivityIndicator size="small" color={t.primary} />
      ) : (
        <TouchableOpacity onPress={onKaldir} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Görseli kaldır" style={[s.kaldirBtn, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <KapatIkon color={t.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Balon içi görsel — dokununca tam ekran */
export function MesajGorseli({ url, onPress }: { url: string; onPress: () => void }) {
  const { t } = useTema();
  const [yuklendi, setYuklendi] = useState(false);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityLabel="Görseli büyüt" style={[s.mesajGorselKutu, { backgroundColor: t.bgSecondary }]}>
      <Image source={{ uri: url }} style={s.mesajGorsel} contentFit="cover" transition={150} onLoadEnd={() => setYuklendi(true)} />
      {!yuklendi && <ActivityIndicator style={StyleSheet.absoluteFill} color={t.primary} />}
    </TouchableOpacity>
  );
}


/* ═══ Eyl 2026 GIZLILIK — DM görselleri ÖZEL bucket `dm-gorseller` ═══
   Yol: <konusma_id>/<uid>/<zaman>-<rnd>.<ext>. Okuma yalnızca iki katılımcıya (RLS), gösterim imzalı URL ile
   (1 saat, oturum önbelleği). dm_mesajlar.gorsel_url'de YOL saklanır; eski kayıtta tam URL varsa olduğu gibi kullanılır. */
const DM_BUCKET = 'dm-gorseller';
const IMZA_SURE_SN = 60 * 60;
const imzaOnbellek = new Map<string, { url: string; son: number }>();

/** DM görselini özel bucket'a yükle → yol (hata: null) */
export async function dmGorselYukle(konusmaId: string, uri: string, mime: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş gerekli');
    const res = await fetch(uri);
    const arrayBuffer = await new Response(await res.blob()).arrayBuffer();
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      Alert.alert('Görsel çok büyük', 'En fazla 5 MB. Lütfen daha küçük bir görsel seçin.');
      return null;
    }
    const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${konusmaId}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(DM_BUCKET).upload(path, arrayBuffer, { contentType: mime, upsert: false });
    if (error) throw error;
    return path;
  } catch (e: any) {
    console.warn('[DM] görsel yükleme hatası:', e?.message);
    return null;
  }
}

/** Yol → imzalı URL (önbellekli). Tam URL verilirse olduğu gibi döner. */
export async function dmGorselUrl(yol: string): Promise<string | null> {
  if (/^https?:\/\//.test(yol)) return yol;
  const c = imzaOnbellek.get(yol);
  if (c && c.son > Date.now() + 60_000) return c.url;
  const { data, error } = await supabase.storage.from(DM_BUCKET).createSignedUrl(yol, IMZA_SURE_SN);
  if (error || !data?.signedUrl) { console.warn('[DM] imzalı URL hatası:', error?.message); return null; }
  imzaOnbellek.set(yol, { url: data.signedUrl, son: Date.now() + IMZA_SURE_SN * 1000 });
  return data.signedUrl;
}

/** DM balonu içi görsel — yolu imzalı URL'e çevirip MesajGorseli çizer */
export function DmMesajGorseli({ yol, onPress }: { yol: string; onPress: (url: string) => void }) {
  const { t } = useTema();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let iptal = false;
    dmGorselUrl(yol).then(u => { if (!iptal) setUrl(u); });
    return () => { iptal = true; };
  }, [yol]);
  if (!url) {
    return (
      <View style={[s.mesajGorselKutu, { backgroundColor: t.bgSecondary }]}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }
  return <MesajGorseli url={url} onPress={() => onPress(url)} />;
}

/** Tam ekran görsel modalı */
export function TamEkranGorsel({ url, onKapat }: { url: string | null; onKapat: () => void }) {
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onKapat}>
      <View style={s.tamEkran}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onKapat} />
        {url && <Image source={{ uri: url }} style={s.tamEkranResim} contentFit="contain" />}
        <TouchableOpacity onPress={onKapat} style={s.tamEkranKapat} accessibilityLabel="Kapat" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <KapatIkon size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  gorselBtn: { width: 48, height: 48, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  onizleme: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  onizlemeResim: { width: 52, height: 52, borderRadius: 12 },
  onizlemeBaslik: { fontFamily: Font.bold, fontSize: 12 },
  onizlemeAlt: { fontFamily: Font.regular, fontSize: 12 },
  kaldirBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mesajGorselKutu: { width: Math.min(EKRAN_W * 0.62, 260), height: Math.min(EKRAN_W * 0.62, 260) * 0.75, borderRadius: 14, overflow: 'hidden', marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  mesajGorsel: { width: '100%', height: '100%' },
  tamEkran: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' },
  tamEkranResim: { width: EKRAN_W, height: EKRAN_H * 0.8 },
  tamEkranKapat: { position: 'absolute', top: 54, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
});
