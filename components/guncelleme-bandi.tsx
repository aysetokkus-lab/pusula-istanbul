// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Camgöbeği gradyan bant → Kart (kobalt accent şeridi) + sürüm Rozet'i + kobalt BirincilButon.
// useGuncellemeKontrol (app_versions kontrolü), mağaza yönlendirmesi ve X ile 24 saat sessizleştirme birebir.
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '../hooks/use-tema';
import { Font } from '../constants/theme';
import { BirincilButon, Kart, Rozet } from './ui/pusula-ui';
import { useGuncellemeKontrol } from '../hooks/use-guncelleme-kontrol';

/* ═══════════════════════════════════════════
   GuncellemeBandi (v1.1.0)
   ───────────────────────────────────────────
   Ana ekran ustunde nazik bant. Yeni surum varsa
   gozukur, X ile 24 saat sessizlestirilir (surume ozel),
   tiklaninca App Store / Play Store'a yonlendirir.
   ═══════════════════════════════════════════ */

/** Kapat ikonu — 24px stroke SVG (inline) */
function KapatIkon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function GuncellemeBandi() {
  const { t } = useTema();
  const { yeniSurumVar, latestVersion, storeUrl, sessizlestir } = useGuncellemeKontrol();

  if (!yeniSurumVar || !storeUrl) return null;

  const magazaAc = () => {
    Linking.openURL(storeUrl).catch(() => {
      // sessizce gec — kullanici daha sonra deneyebilir
    });
  };

  return (
    <View style={s.zarf}>
      <Kart accent={t.primary} onPress={magazaAc}>
        <View style={s.ustSatir}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[s.baslik, { color: t.text }]}>Pusula'nın yeni sürümü mevcut</Text>
            <Rozet renk={t.primary}>v{latestVersion}</Rozet>
          </View>
          <TouchableOpacity
            onPress={sessizlestir}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            style={[s.kapatBtn, { backgroundColor: t.bgCardAlt, borderColor: t.kartBorder }]}>
            <KapatIkon color={t.textSecondary} />
          </TouchableOpacity>
        </View>
        <BirincilButon baslik="Güncellemek için dokunun" onPress={magazaAc} varyant="kobalt" />
      </Kart>
    </View>
  );
}

const s = StyleSheet.create({
  zarf: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  baslik: {
    fontFamily: Font.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  kapatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
