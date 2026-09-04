import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Font, Palette } from '../constants/theme';

/* ═══════════════════════════════════════════
   Avatar (Eyl 2026) — profil fotoğrafı varsa yuvarlak resim, yoksa harf avatarı
   ─────────────────────────────────────────
   Renk verilmezse isimden deterministik üretilir (sohbet.tsx ile aynı mantık).
   boyut: çap (px). harf: verilmezse ismin ilk harfi.
   ═══════════════════════════════════════════ */

export function avatarRenk(isim: string): string {
  const renkler = [Palette.kobalt, Palette.kobaltAcik, Palette.kobaltKoyu, Palette.menekse, Palette.kobaltOrta];
  const kod = (isim || '?').charCodeAt(0);
  return renkler[kod % renkler.length];
}

export function avatarHarf(isim: string): string {
  return (isim || '').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';
}

export function Avatar({ url, isim, boyut = 36, renk, harf, cerceveRenk, style }: {
  url?: string | null;
  isim: string;
  boyut?: number;
  renk?: string;
  harf?: string;
  cerceveRenk?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const daire: ViewStyle = {
    width: boyut, height: boyut, borderRadius: boyut / 2,
    ...(cerceveRenk ? { borderWidth: 2, borderColor: cerceveRenk } : null),
  };
  if (url) {
    return (
      <View style={[daire, s.kirp, { backgroundColor: Palette.seffafBeyaz20 }, style]}>
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={120} cachePolicy="memory-disk" accessibilityLabel={`${isim} profil fotoğrafı`} />
      </View>
    );
  }
  return (
    <View style={[daire, s.orta, { backgroundColor: renk ?? avatarRenk(isim) }, style]}>
      <Text style={[s.harf, { fontSize: Math.round(boyut * 0.4) }]}>{harf ?? avatarHarf(isim)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kirp: { overflow: 'hidden' },
  orta: { justifyContent: 'center', alignItems: 'center' },
  harf: { fontFamily: Font.bold, color: '#FFFFFF', letterSpacing: 0.5 },
});
