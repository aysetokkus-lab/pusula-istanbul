import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Palette, Radius, Space } from '../constants/theme';

/* ═══════════════════════════════════════════
   EKRAN 2: 7 Gün Ücretsiz Deneme
   ─────────────────────────────────────────
   Kayıt sonrası, uygulamaya girmeden önce
   deneme süresini ve kredi kartı gereksizliğini vurgular.
   ═══════════════════════════════════════════ */

export default function DenemeBaslat() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* ── Gradient Üst Alan ── */}
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ustBolum, { paddingTop: insets.top + 32 }]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoPusula}>PUSULA</Text>
          <Image
            source={require('../assets/icons/logo.svg')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.logoIstanbul}>İSTANBUL</Text>
        </View>
      </LinearGradient>

      {/* ── İçerik ── */}
      <View style={styles.icerik}>
        {/* ── Yeşil Deneme Kartı ── */}
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.denemeKart}
        >
          <Text style={styles.denemeBaslik}>7 Gün Ücretsiz Deneme</Text>
          <Text style={styles.denemeAciklama}>
            Pusula İstanbul'un tüm ayrıcalıklarını sahada test edin.{'\n'}
            Kredi kartı gerekmez, anında kullanmaya başlayın.
          </Text>
        </LinearGradient>

        {/* ── Alt Bilgi ── */}
        <Text style={styles.altBilgi}>
          Deneme süresi boyunca hiçbir özellik kısıtlaması yoktur.
        </Text>
      </View>

      {/* ── Sticky Footer Buton ── */}
      <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.baslaBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.baslaGradient}
          >
            <Text style={styles.baslaYazi}>7 Günlük Ücretsiz Denememi Başlat</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.yasalNot}>
          Devam ederek{' '}
          <Text style={styles.yasalLink} onPress={() => router.push('/kullanim-kosullari' as any)}>
            Kullanım Koşullarını
          </Text>
          {' '}ve{' '}
          <Text style={styles.yasalLink} onPress={() => router.push('/gizlilik-politikasi' as any)}>
            Gizlilik Politikasını
          </Text>
          {' '}kabul etmiş olursunuz.
        </Text>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Gradient üst
  ustBolum: {
    paddingHorizontal: Space.lg,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoPusula: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  logoIstanbul: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: 3,
  },

  // İçerik
  icerik: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Deneme kartı
  denemeKart: {
    borderRadius: Radius.lg,
    padding: 28,
    alignItems: 'center',
  },
  denemeBaslik: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  denemeAciklama: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 23,
  },

  // Alt bilgi
  altBilgi: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 19,
  },

  // Sticky footer
  footerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  baslaBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  baslaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  baslaYazi: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  yasalNot: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  yasalLink: {
    color: Palette.istanbulMavi,
    fontFamily: 'Poppins_600SemiBold',
    textDecorationLine: 'underline',
  },
});
