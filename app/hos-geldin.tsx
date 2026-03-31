import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Palette, Radius, Space } from '../constants/theme';

/* ═══════════════════════════════════════════
   EKRAN 1: Onboarding & Değer Önerisi
   ─────────────────────────────────────────
   Yeni kayıt olan kullanıcıya gösterilir.
   Sadece tipografi — ikon yok, emoji yok.
   ═══════════════════════════════════════════ */

const OZELLIKLER = [
  {
    baslik: 'Tur Organizasyonu',
    aciklama: 'Saray, müze ve camilerin güncel açılış-kapanış saatlerini takip edin; Müze Kart satış noktalarının konumlarına anında ulaşın.',
  },
  {
    baslik: 'Kapsamlı Ulaşım Rehberi',
    aciklama: 'Metro, tramvay ve Marmaray hatlarındaki anlık arıza veya iptal duyurularının yanı sıra, Havaist ve Havabüs sefer saatlerini görüntüleyerek havalimanı transferlerinizi aksatmadan planlayın.',
  },
  {
    baslik: 'Pratik Finans Araçları',
    aciklama: 'Uygulama içindeki döviz çevirici ile kurları takip edip anlık hesaplamalarınızı yapın.',
  },
  {
    baslik: 'Etkinlik ve Galataport Takvimi',
    aciklama: 'Maraton, bisiklet yarışı ve miting gibi şehir içi etkinliklerin programını takip edin; Galataport\'a yanaşacak gemi sayısını önceden görerek rotanızı çizin.',
  },
  {
    baslik: 'Anlık İletişim',
    aciklama: 'Özel sohbet bölümü sayesinde sahadaki diğer rehberlerle iletişimde kalın ve önemli gelişmelerden anlık bildirimlerle haberdar olun.',
  },
  {
    baslik: 'Acil Durum Rehberi',
    aciklama: 'Tek bir tıklamayla acil hatlara, ilgili meslek kuruluşlarına ve güncel nöbetçi eczanelerin listesine ulaşın.',
  },
];

export default function HosGeldin() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 28 }]}
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
        <Text style={styles.hosgeldinBaslik}>
          Hoş Geldiniz!
        </Text>
        <Text style={styles.hosgeldinAlt}>
          Profesyonel turist rehberlerinin dijital yol arkadaşı.{'\n'}
          Sahada ihtiyacınız olan her şey tek uygulamada.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollIcerik}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Özellik Kartları (sadece tipografi, ikon yok) ── */}
        {OZELLIKLER.map((oz, i) => (
          <View key={i} style={styles.ozellikKart}>
            <View style={styles.ozellikAccent} />
            <View style={styles.ozellikMetin}>
              <Text style={styles.ozellikBaslik}>{oz.baslik}</Text>
              <Text style={styles.ozellikAciklama}>{oz.aciklama}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>

      {/* ── Sticky Footer Buton ── */}
      <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.baslaBtn}
          onPress={() => router.replace('/deneme-baslat')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0077B6', '#005A8D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.baslaGradient}
          >
            <Text style={styles.baslaYazi}>Keşfetmeye Başla</Text>
          </LinearGradient>
        </TouchableOpacity>
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

  // Header
  header: {
    paddingHorizontal: Space.lg,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
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
  hosgeldinBaslik: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 25,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 33,
  },
  hosgeldinAlt: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollIcerik: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Özellik kartları — sadece tipografi, ikon yok
  ozellikKart: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ozellikAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Palette.istanbulMavi,
    marginRight: 14,
  },
  ozellikMetin: {
    flex: 1,
  },
  ozellikBaslik: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 3,
  },
  ozellikAciklama: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },

  // Sticky footer
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
