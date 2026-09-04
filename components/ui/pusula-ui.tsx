import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTema } from '../../hooks/use-tema';
import { Font, Gradient, Palette, Radius } from '../../constants/theme';

/* ═══════════════════════════════════════════
   PUSULA UI — ortak tasarım parçaları (Eyl 2026 redesign, "Kobalt & Menekşe")
   ─────────────────────────────────────────
   Tüm ekranlar bu parçaları kullanır ki görünüm tek elden yönetilsin.
   Kural: EMOJİ YOK, ikon = react-native-svg, fontFamily varken fontWeight verme.
   ═══════════════════════════════════════════ */

/** KICKER — bölüm etiketi: büyük harf, 11px, 1px letter-spacing */
export function Kicker({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const { t } = useTema();
  return <Text style={[s.kicker, { color: color ?? t.textSecondary }, style]}>{children}</Text>;
}

/** Bölüm başlığı satırı: sol kicker, sağ opsiyonel aksiyon (ör. "+ Yeni", "Tümü ›") */
export function BolumBaslik({ baslik, renk, sag, onSag }: { baslik: string; renk?: string; sag?: ReactNode; onSag?: () => void }) {
  const { t } = useTema();
  return (
    <View style={s.bolumBaslik}>
      <Kicker color={renk ?? t.primary}>{baslik}</Kicker>
      {sag != null && (
        onSag ? (
          <TouchableOpacity onPress={onSag} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {typeof sag === 'string' ? <Text style={[s.bolumSag, { color: t.accent }]}>{sag}</Text> : sag}
          </TouchableOpacity>
        ) : (typeof sag === 'string' ? <Text style={[s.bolumSag, { color: t.textMuted }]}>{sag}</Text> : sag)
      )}
    </View>
  );
}

/** KART — tüm içerik bloklarının zarfı (radius 24, ince border, hafif gölge) */
export function Kart({ children, style, onPress, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accent?: string }) {
  const { t } = useTema();
  const inner = (
    <View style={[s.kart, { backgroundColor: t.bgCard, borderColor: t.kartBorder, shadowColor: t.kartShadow }, accent ? s.kartAccentli : null, style]}>
      {accent ? <View style={[s.kartAccent, { backgroundColor: accent }]} /> : null}
      <View style={{ flex: 1, gap: 10 }}>{children}</View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{inner}</TouchableOpacity>;
  return inner;
}

/** ROZET — küçük pill: durum / sayaç ("2 aktif", "AÇIK", "SABİT") */
export function Rozet({ children, renk, dolu, style }: { children: ReactNode; renk?: string; dolu?: boolean; style?: StyleProp<ViewStyle> }) {
  const { t } = useTema();
  const r = renk ?? t.primary;
  return (
    <View style={[s.rozet, { backgroundColor: dolu ? r : `${r}22` }, style]}>
      <Text style={[s.rozetYazi, { color: dolu ? '#FFFFFF' : r }]}>{children}</Text>
    </View>
  );
}

/** DURUM NOKTASI — 10px renkli daire (açık/uyarı/kapalı) */
export function DurumNoktasi({ renk, boyut = 10 }: { renk: string; boyut?: number }) {
  return <View style={{ width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: renk }} />;
}

/** BİRİNCİL BUTON — safran CTA (varsayılan) veya kobalt; 48px yükseklik */
export function BirincilButon({ baslik, onPress, varyant = 'cta', yukleniyor, disabled, sol, style }: {
  baslik: string; onPress: () => void; varyant?: 'cta' | 'kobalt' | 'hayalet' | 'tehlike'; yukleniyor?: boolean; disabled?: boolean; sol?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTema();
  const bg = varyant === 'cta' ? t.accent : varyant === 'kobalt' ? t.primary : varyant === 'tehlike' ? t.durumKapali : 'transparent';
  const fg = varyant === 'hayalet' ? t.primary : '#FFFFFF';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || yukleniyor}
      activeOpacity={0.8}
      style={[s.buton, { backgroundColor: bg }, varyant === 'hayalet' && { borderWidth: 1.5, borderColor: t.primary }, (disabled || yukleniyor) && { opacity: 0.55 }, style]}
    >
      {yukleniyor ? <ActivityIndicator size="small" color={fg} /> : (
        <>
          {sol}
          <Text style={[s.butonYazi, { color: fg }]}>{baslik}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/** İKON KAROSU — 8'li ızgara karosu: kobalt dolgu + beyaz ikon + alt etiket */
export function IkonKaro({ ikon, etiket, onPress }: { ikon: ReactNode; etiket: string; onPress: () => void }) {
  const { t } = useTema();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={s.karo}>
      <View style={[s.karoKutu, { backgroundColor: t.tileBg }]}>{ikon}</View>
      <Text style={[s.karoEtiket, { color: t.text }]} numberOfLines={2}>{etiket}</Text>
    </TouchableOpacity>
  );
}

/** GRADYAN HEADER — kobalt→menekşe; alt köşeleri yuvarlak */
export function GradyanHeader({ children, style, paddingTop }: { children: ReactNode; style?: StyleProp<ViewStyle>; paddingTop: number }) {
  const { isDark } = useTema();
  return (
    <LinearGradient
      colors={isDark ? [...Gradient.headerKoyu] : [...Gradient.header]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.header, { paddingTop }, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** Ekran başlığı (header içinde): büyük başlık + alt yazı */
export function HeaderBaslik({ baslik, alt, sag }: { baslik: string; alt?: string; sag?: ReactNode }) {
  return (
    <View style={s.headerBaslikSatir}>
      <View style={{ flex: 1 }}>
        <Text style={s.headerBaslik}>{baslik}</Text>
        {alt ? <Text style={s.headerAlt}>{alt}</Text> : null}
      </View>
      {sag}
    </View>
  );
}

/** MODAL KAPAK — alttan açılan modal içeriği: tutamaç + başlık + kapat */
export function ModalKapak({ baslik, alt, onKapat, children, altButonBaslik = 'Kapat' }: { baslik: string; alt?: string; onKapat: () => void; children: ReactNode; altButonBaslik?: string }) {
  const { t } = useTema();
  /* 4 Eyl 2026 (Ayşe: "klavye metni tamamen kapatıyor"): klavye kaçınma ARTIK BURADA, tek yerde.
     Android'de (edge-to-edge) dıştaki `behavior: undefined` sarmalayıcılar hiçbir şey yapmıyordu → alttan açılan
     sayfa klavyenin altında kalıyordu. Her iki platformda 'padding': sayfa klavyenin üstündeki alana SIĞACAK şekilde
     küçülür (kutu maxHeight kalan alanın %88'i, içerideki ScrollView flexShrink ile daralır), odaklanan alan görünür
     kalır. ('position' denendi: sayfa yukarı kayınca üstteki alanlar ekran dışına taşıyordu — Başlık görünmüyordu.)
     Ekranlardaki dış KeyboardAvoidingView'ler nötr (behavior undefined) bırakıldı. */
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[s.modalOverlay, { backgroundColor: t.modalOverlay }]}
    >
      <View style={[s.modalKutu, { backgroundColor: t.modalBg }]}>
        <View style={[s.modalTutamac, { backgroundColor: t.kartBorder }]} />
        <Text style={[s.modalBaslik, { color: t.text }]}>{baslik}</Text>
        {alt ? <Text style={[s.modalAlt, { color: t.textSecondary }]}>{alt}</Text> : null}
        <View style={{ flexShrink: 1, minHeight: 0 }}>{children}</View>
        <BirincilButon baslik={altButonBaslik} onPress={onKapat} varyant="kobalt" style={{ marginTop: 16 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

/** Bilgi notu (4 Eyl 2026, Ayşe) — kurum verisi gösteren ekranların altı: sorumluluk sınırı, sabit metin */
export const BILGI_NOTU_METNI = 'Saat ve ücretler ilgili kurumların resmî kaynaklarından derlenir; kurum tarafından değiştirilmiş olabilir. Ziyaret öncesi teyit ediniz.';
export function BilgiNotu({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTema();
  return (
    <View style={[s.bilgiNotu, style]}>
      <Text style={[s.bilgiNotuYazi, { color: t.textMuted }]}>{BILGI_NOTU_METNI}</Text>
    </View>
  );
}

/** Segment (sekme) satırı — kategori seçici */
export function Segmentler<T extends string>({ secenekler, aktif, onSec, renk }: { secenekler: { id: T; baslik: string }[]; aktif: T; onSec: (id: T) => void; renk?: string }) {
  const { t } = useTema();
  const r = renk ?? t.primary;
  return (
    <View style={[s.segmentler, { backgroundColor: t.bgSecondary, borderColor: t.kartBorder }]}>
      {secenekler.map(sec => {
        const on = sec.id === aktif;
        return (
          <TouchableOpacity key={sec.id} onPress={() => onSec(sec.id)} activeOpacity={0.8} style={[s.segment, on && { backgroundColor: r }]}>
            <Text style={[s.segmentYazi, { color: on ? '#FFFFFF' : t.textSecondary }]} numberOfLines={1}>{sec.baslik}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Boş durum metni */
export function BosDurum({ metin }: { metin: string }) {
  const { t } = useTema();
  return <Text style={[s.bos, { color: t.textMuted }]}>{metin}</Text>;
}

const s = StyleSheet.create({
  kicker: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  bolumBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bolumSag: { fontFamily: Font.bold, fontSize: 12 },
  kart: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  kartAccentli: { paddingLeft: 12 },
  kartAccent: { width: 5, borderRadius: 3, marginRight: 12, alignSelf: 'stretch' },
  rozet: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  rozetYazi: { fontFamily: Font.bold, fontSize: 11 },
  buton: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  butonYazi: { fontFamily: Font.bold, fontSize: 14 },
  karo: { alignItems: 'center', gap: 8, width: '22%' },
  karoKutu: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  karoEtiket: { fontFamily: Font.semibold, fontSize: 11, textAlign: 'center', lineHeight: 14 },
  header: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerBaslikSatir: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  headerBaslik: { fontFamily: Font.extrabold, fontSize: 24, color: '#FFFFFF', letterSpacing: -0.5 },
  headerAlt: { fontFamily: Font.regular, fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  bilgiNotu: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36 },
  bilgiNotuYazi: { fontFamily: Font.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalKutu: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28, maxHeight: '88%' },
  modalTutamac: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  modalBaslik: { fontFamily: Font.extrabold, fontSize: 20, letterSpacing: -0.3 },
  modalAlt: { fontFamily: Font.regular, fontSize: 13, marginTop: 2, marginBottom: 10 },
  segmentler: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segment: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentYazi: { fontFamily: Font.semibold, fontSize: 12 },
  bos: { fontFamily: Font.regular, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
});

export { Palette };
