import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTema } from '../hooks/use-tema';
import { Font, Palette, Radius } from '../constants/theme';
import { BirincilButon } from './ui/pusula-ui';
import { TEPKI_ETIKET, TEPKI_TIPLERI, type TepkiOzeti, type TepkiTipi } from '../hooks/use-sohbet-tepkileri';

/* ═══════════════════════════════════════════
   Sohbet Tepkileri — UI parçaları (Eyl 2026)
   ─────────────────────────────────────────
   EMOJİ YOK (proje kuralı): 4 tepki 24px stroke SVG olarak çizilir.
   - TepkiIkon: begen / begenme / kalp / saskin
   - TepkiSatiri: balon altındaki sayaçlı pill'ler (benimki dolu)
   - MesajMenusu: uzun basma / (...) ile açılan alt sayfa — üstte 4 tepki, altta aksiyonlar
   - TepkiVerenlerModal: sayıya dokununca isim listesi
   ═══════════════════════════════════════════ */

export const TEPKI_RENK: Record<TepkiTipi, string> = {
  begen: Palette.kobalt,
  begenme: Palette.bilgi,
  kalp: Palette.kapali,
  saskin: Palette.safran,
};

export function TepkiIkon({ tip, size = 20, color, dolu = false }: { tip: TepkiTipi; size?: number; color: string; dolu?: boolean }) {
  const sw = 1.9;
  const fill = dolu ? color : 'none';
  switch (tip) {
    case 'begen':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill={fill} />
          <Path d="M7 10l4.2-7a2 2 0 0 1 3.6 1.4L14 9h5a2 2 0 0 1 2 2.3l-1.3 7.5A2 2 0 0 1 17.7 21H7" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill={fill} />
        </Svg>
      );
    case 'begenme':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3z" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill={fill} />
          <Path d="M17 14l-4.2 7a2 2 0 0 1-3.6-1.4L10 15H5a2 2 0 0 1-2-2.3l1.3-7.5A2 2 0 0 1 6.3 3H17" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill={fill} />
        </Svg>
      );
    case 'kalp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 20.5s-7.5-4.6-9.3-9.3A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 9.3 4.6C19.5 15.9 12 20.5 12 20.5z" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill={fill} />
        </Svg>
      );
    case 'saskin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={sw} fill={dolu ? `${color}33` : 'none'} />
          <Circle cx={9} cy={10} r={1.2} fill={color} />
          <Circle cx={15} cy={10} r={1.2} fill={color} />
          <Path d="M9.8 16.3a2.2 2.6 0 1 0 4.4 0 2.2 2.6 0 1 0-4.4 0z" stroke={color} strokeWidth={sw} fill={dolu ? color : 'none'} />
        </Svg>
      );
  }
}

/** Balon altı: tepki pill'leri */
export function TepkiSatiri({ ozet, kendi, onTepki, onKimler }: {
  ozet: TepkiOzeti[]; kendi: boolean; onTepki: (tip: TepkiTipi) => void; onKimler: () => void;
}) {
  const { t } = useTema();
  if (ozet.length === 0) return null;
  return (
    <View style={[s.satir, kendi && { justifyContent: 'flex-end' }]}>
      {ozet.map(o => {
        const renk = TEPKI_RENK[o.tip];
        return (
          <TouchableOpacity
            key={o.tip}
            onPress={() => onTepki(o.tip)}
            onLongPress={onKimler}
            delayLongPress={350}
            activeOpacity={0.7}
            accessibilityLabel={`${TEPKI_ETIKET[o.tip]} ${o.sayi}`}
            style={[s.pill, { backgroundColor: o.benim ? renk : t.bgCard, borderColor: o.benim ? renk : t.kartBorder }]}
          >
            <TepkiIkon tip={o.tip} size={14} color={o.benim ? '#FFFFFF' : renk} dolu={o.benim} />
            <Text style={[s.pillSayi, { color: o.benim ? '#FFFFFF' : t.textSecondary }]}>{o.sayi}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onKimler} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityLabel="Tepki verenler">
        <Text style={[s.kimler, { color: t.textMuted }]}>kimler ›</Text>
      </TouchableOpacity>
    </View>
  );
}

export interface MenuAksiyon {
  baslik: string;
  onPress: () => void;
  tehlike?: boolean;
  vurgulu?: boolean;
}

/** Mesaj menüsü — alt sayfa: tepki satırı + aksiyon listesi */
export function MesajMenusu({ acik, baslik, ozetMetin, benimTepkim, aksiyonlar, onTepki, onKapat }: {
  acik: boolean; baslik: string; ozetMetin: string; benimTepkim: TepkiTipi | null;
  aksiyonlar: MenuAksiyon[]; onTepki: (tip: TepkiTipi) => void; onKapat: () => void;
}) {
  const { t } = useTema();
  return (
    <Modal visible={acik} transparent animationType="fade" onRequestClose={onKapat}>
      <TouchableOpacity activeOpacity={1} onPress={onKapat} style={[s.overlay, { backgroundColor: t.modalOverlay }]}>
        <TouchableOpacity activeOpacity={1} style={[s.menuKutu, { backgroundColor: t.modalBg }]}>
          <View style={[s.tutamac, { backgroundColor: t.kartBorder }]} />
          <Text style={[s.menuBaslik, { color: t.text }]} numberOfLines={1}>{baslik}</Text>
          <Text style={[s.menuOzet, { color: t.textSecondary }]} numberOfLines={2}>{ozetMetin}</Text>

          {/* Tepki satırı */}
          <View style={s.tepkiSecici}>
            {TEPKI_TIPLERI.map(tip => {
              const renk = TEPKI_RENK[tip];
              const secili = benimTepkim === tip;
              return (
                <TouchableOpacity
                  key={tip}
                  onPress={() => { onTepki(tip); onKapat(); }}
                  activeOpacity={0.7}
                  accessibilityLabel={TEPKI_ETIKET[tip]}
                  style={[s.tepkiBtn, { backgroundColor: secili ? renk : t.bgSecondary, borderColor: secili ? renk : t.kartBorder }]}
                >
                  <TepkiIkon tip={tip} size={26} color={secili ? '#FFFFFF' : renk} dolu={secili} />
                  <Text style={[s.tepkiEtiket, { color: secili ? '#FFFFFF' : t.textSecondary }]}>{TEPKI_ETIKET[tip]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Aksiyonlar */}
          <View style={[s.aksiyonListe, { borderColor: t.kartBorder }]}>
            {aksiyonlar.map((a, i) => (
              <TouchableOpacity
                key={a.baslik}
                onPress={() => { onKapat(); setTimeout(a.onPress, 120); }}
                activeOpacity={0.6}
                style={[s.aksiyon, i < aksiyonlar.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.divider }]}
              >
                <Text style={[s.aksiyonYazi, { color: a.tehlike ? t.durumKapali : a.vurgulu ? t.primary : t.text }]}>{a.baslik}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <BirincilButon baslik="Vazgeç" varyant="hayalet" onPress={onKapat} style={{ marginTop: 12 }} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/** Tepki verenler listesi */
export function TepkiVerenlerModal({ acik, ozet, onKapat }: { acik: boolean; ozet: TepkiOzeti[]; onKapat: () => void }) {
  const { t } = useTema();
  const toplam = ozet.reduce((a, o) => a + o.sayi, 0);
  return (
    <Modal visible={acik} transparent animationType="slide" onRequestClose={onKapat}>
      <View style={[s.overlay, { backgroundColor: t.modalOverlay }]}>
        <View style={[s.menuKutu, { backgroundColor: t.modalBg }]}>
          <View style={[s.tutamac, { backgroundColor: t.kartBorder }]} />
          <Text style={[s.menuBaslik, { color: t.text }]}>Tepkiler · {toplam}</Text>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 14, paddingTop: 8 }}>
            {ozet.map(o => (
              <View key={o.tip} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TepkiIkon tip={o.tip} size={18} color={TEPKI_RENK[o.tip]} dolu />
                  <Text style={[s.grupBaslik, { color: TEPKI_RENK[o.tip] }]}>{TEPKI_ETIKET[o.tip]} · {o.sayi}</Text>
                </View>
                {o.isimler.map((isim, i) => (
                  <Text key={`${o.tip}-${i}`} style={[s.isim, { color: t.text }]}>{isim}</Text>
                ))}
              </View>
            ))}
          </ScrollView>
          <BirincilButon baslik="Kapat" varyant="kobalt" onPress={onKapat} style={{ marginTop: 16 }} />
        </View>
      </View>
    </Modal>
  );
}

/** Yanıt alıntısı — balon içinde, orijinal mesajın özeti */
export function YanitAlinti({ isim, metin, kendi, onPress }: { isim: string; metin: string; kendi: boolean; onPress?: () => void }) {
  const { t } = useTema();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[s.alinti, { backgroundColor: kendi ? 'rgba(255,255,255,0.16)' : t.bgSecondary, borderLeftColor: kendi ? '#FFFFFF' : t.primary }]}
    >
      <Text style={[s.alintiIsim, { color: kendi ? '#FFFFFF' : t.primary }]} numberOfLines={1}>{isim}</Text>
      <Text style={[s.alintiMetin, { color: kendi ? 'rgba(255,255,255,0.9)' : t.textSecondary }]} numberOfLines={2}>{metin}</Text>
    </TouchableOpacity>
  );
}

/** Yazma kutusunun üstündeki "X'e yanıt veriyorsun" şeridi */
export function YanitSeridi({ isim, metin, onIptal }: { isim: string; metin: string; onIptal: () => void }) {
  const { t } = useTema();
  return (
    <View style={[s.serit, { backgroundColor: t.bgSecondary, borderTopColor: t.divider }]}>
      <View style={[s.seritCizgi, { backgroundColor: t.primary }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.seritBaslik, { color: t.primary }]} numberOfLines={1}>{isim} adlı rehbere yanıt</Text>
        <Text style={[s.seritMetin, { color: t.textSecondary }]} numberOfLines={1}>{metin}</Text>
      </View>
      <TouchableOpacity onPress={onIptal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Yanıtı iptal et">
        <Text style={[s.seritIptal, { color: t.textMuted }]}>İptal</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 46 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 9, height: 26 },
  pillSayi: { fontFamily: Font.bold, fontSize: 11 },
  kimler: { fontFamily: Font.semibold, fontSize: 11, paddingHorizontal: 4 },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  menuKutu: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 },
  tutamac: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  menuBaslik: { fontFamily: Font.extrabold, fontSize: 18, letterSpacing: -0.3 },
  menuOzet: { fontFamily: Font.regular, fontSize: 13, marginTop: 2, marginBottom: 14 },
  tepkiSecici: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tepkiBtn: { flex: 1, height: 68, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tepkiEtiket: { fontFamily: Font.semibold, fontSize: 11 },
  aksiyonListe: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  aksiyon: { height: 48, justifyContent: 'center', paddingHorizontal: 16 },
  aksiyonYazi: { fontFamily: Font.semibold, fontSize: 14 },
  grupBaslik: { fontFamily: Font.bold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  isim: { fontFamily: Font.regular, fontSize: 14, paddingLeft: 26 },

  alinti: { borderLeftWidth: 3, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
  alintiIsim: { fontFamily: Font.bold, fontSize: 11 },
  alintiMetin: { fontFamily: Font.regular, fontSize: 12, lineHeight: 16 },

  serit: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  seritCizgi: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  seritBaslik: { fontFamily: Font.bold, fontSize: 12 },
  seritMetin: { fontFamily: Font.regular, fontSize: 12 },
  seritIptal: { fontFamily: Font.bold, fontSize: 12 },
});
