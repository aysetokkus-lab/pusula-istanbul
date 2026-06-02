import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGuncellemeKontrol } from '../hooks/use-guncelleme-kontrol';

/* ═══════════════════════════════════════════
   GuncellemeBandi (v1.1.0)
   ───────────────────────────────────────────
   Ana ekran ustunde nazik bant. Yeni surum varsa
   gozukur, X ile 24 saat sessizlestirilir (surume ozel),
   tiklaninca App Store / Play Store'a yonlendirir.
   ═══════════════════════════════════════════ */

export function GuncellemeBandi() {
  const { yeniSurumVar, latestVersion, storeUrl, sessizlestir } = useGuncellemeKontrol();

  if (!yeniSurumVar || !storeUrl) return null;

  const magazaAc = () => {
    Linking.openURL(storeUrl).catch(() => {
      // sessizce gec — kullanici daha sonra deneyebilir
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={magazaAc}>
      <LinearGradient
        colors={['#48CAE4', '#0096C7', '#0077B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.bant}>
        <View style={{ flex: 1 }}>
          <Text style={s.baslik}>Pusula'nın yeni sürümü mevcut</Text>
          <Text style={s.altYazi}>
            v{latestVersion} — Güncellemek için dokunun
          </Text>
        </View>
        <TouchableOpacity
          onPress={sessizlestir}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          style={s.kapatBtn}>
          <Text style={s.kapatBtnYazi}>×</Text>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bant: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    gap: 12,
  },
  baslik: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  altYazi: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 1,
  },
  kapatBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kapatBtnYazi: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 22,
  },
});
