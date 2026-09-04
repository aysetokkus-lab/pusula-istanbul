import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Font } from '../constants/theme';
import { useTema } from '../hooks/use-tema';
import { BirincilButon, BolumBaslik, GradyanHeader, Kart } from '../components/ui/pusula-ui';

/* ═══════════════════════════════════════════
   EKRAN 1: Onboarding & Değer Önerisi
   ─────────────────────────────────────────
   Yeni kayıt olan kullanıcıya gösterilir.
   Tamamen ücretsiz model (Eyl 2026): tüm özellikler
   her rehbere açık.
   Sadece tipografi — ikon yok, emoji yok.
   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi.
   Gradyan header + kicker + Kart listesi (kobalt / menekşe accent).
   ═══════════════════════════════════════════ */

const TUR_OZELLIKLERI = [
  {
    baslik: 'Tur Organizasyonu',
    aciklama: 'Saray, müze ve camilerin güncel açılış-kapanış saatlerini takip edin; MüzeKart satış noktalarının konumlarına anında ulaşın.',
  },
  {
    baslik: 'Kapsamlı Ulaşım Rehberi',
    aciklama: 'Havaist ve Havabüs sefer saatlerini, Boğaz tur tarifelerini ve havalimanı transfer bilgilerini görüntüleyin.',
  },
  {
    baslik: 'Acil Durum Rehberi',
    aciklama: 'Tek bir tıklamayla acil hatlara, ilgili meslek kuruluşlarına ve güncel nöbetçi eczanelerin listesine ulaşın.',
  },
];

const SAHA_OZELLIKLERI = [
  {
    baslik: 'Anlık İletişim',
    aciklama: 'Özel sohbet bölümü sayesinde sahadaki diğer rehberlerle iletişimde kalın.',
  },
  {
    baslik: 'Canlı Saha Durumu',
    aciklama: 'Müzelerdeki anlık kuyruk ve yoğunluk bilgilerini görün ve bildirin.',
  },
  {
    baslik: 'Ulaşım Uyarıları ve Etkinlikler',
    aciklama: 'Metro, tramvay arıza duyuruları ile kent etkinlikleri ve yol kapanmalarından haberdar olun.',
  },
];

export default function HosGeldin() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* ── Gradyan Header ── */}
      <GradyanHeader paddingTop={insets.top + 28} style={styles.header}>
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
        <Text style={[styles.hosgeldinAlt, { color: t.headerSubtext }]}>
          Profesyonel turist rehberlerinin dijital asistanı.{'\n'}
          Sahada ihtiyacınız olan her şey tek uygulamada.
        </Text>
      </GradyanHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollIcerik}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ücretsiz Özellikler ── */}
        <BolumBaslik baslik="Tur Organizasyonu" renk={t.primary} />
        {TUR_OZELLIKLERI.map((oz, i) => (
          <Kart key={`u-${i}`} accent={t.primary}>
            <View>
              <Text style={[styles.ozellikBaslik, { color: t.text }]}>{oz.baslik}</Text>
              <Text style={[styles.ozellikAciklama, { color: t.textSecondary }]}>{oz.aciklama}</Text>
            </View>
          </Kart>
        ))}

        {/* ── Saha & İletişim ── */}
        <View style={styles.bolumAra}>
          <BolumBaslik baslik="Saha ve İletişim" renk={t.secondary} />
        </View>
        {SAHA_OZELLIKLERI.map((oz, i) => (
          <Kart key={`p-${i}`} accent={t.secondary}>
            <View>
              <Text style={[styles.ozellikBaslik, { color: t.text }]}>{oz.baslik}</Text>
              <Text style={[styles.ozellikAciklama, { color: t.textSecondary }]}>{oz.aciklama}</Text>
            </View>
          </Kart>
        ))}

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>

      {/* ── Sticky Footer Buton ── */}
      <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 12, backgroundColor: t.bg, borderTopColor: t.divider }]}>
        <BirincilButon
          baslik="Keşfetmeye Başla"
          onPress={() => router.replace('/(tabs)')}
          varyant="cta"
        />

        <Text style={[styles.yasalNot, { color: t.textMuted }]}>
          Devam ederek{' '}
          <Text style={[styles.yasalLink, { color: t.primary }]} onPress={() => router.push('/kullanim-kosullari' as any)}>
            Kullanım Koşullarını
          </Text>
          {' '}ve{' '}
          <Text style={[styles.yasalLink, { color: t.primary }]} onPress={() => router.push('/gizlilik-politikasi' as any)}>
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
  },

  // Header
  header: {
    paddingBottom: 30,
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
    fontFamily: Font.bold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  logoIstanbul: {
    fontFamily: Font.bold,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  hosgeldinBaslik: {
    fontFamily: Font.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  hosgeldinAlt: {
    fontFamily: Font.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollIcerik: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 14,
  },
  bolumAra: { marginTop: 10 },

  // Özellik kartları — sadece tipografi, ikon yok
  ozellikBaslik: {
    fontFamily: Font.bold,
    fontSize: 15,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  ozellikAciklama: {
    fontFamily: Font.regular,
    fontSize: 13,
    lineHeight: 19,
  },

  // Sticky footer
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  yasalNot: {
    fontFamily: Font.regular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  yasalLink: {
    fontFamily: Font.semibold,
    textDecorationLine: 'underline',
  },
});
