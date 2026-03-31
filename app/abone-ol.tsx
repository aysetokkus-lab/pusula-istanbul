import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import { Palette, Radius, Space } from '../constants/theme';
import { ENTITLEMENT_ID } from '../lib/revenuecat';

/* ═══════════════════════════════════════════
   EKRAN 3: Paywall / Abonelik
   ─────────────────────────────────────────
   Deneme süresi biten kullanıcılara gösterilir.
   Yeni metinler, ikon yok, temiz tipografi.
   ═══════════════════════════════════════════ */

type Plan = 'aylik' | 'yillik';

export default function AboneOl() {
  const insets = useSafeAreaInsets();
  const [secilenPlan, setSecilenPlan] = useState<Plan>('yillik');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [paketler, setPaketler] = useState<{
    aylik?: PurchasesPackage;
    yillik?: PurchasesPackage;
  }>({});
  const [fiyatlar, setFiyatlar] = useState<{
    aylik: string;
    yillik: string;
    aylikBirimYillik: string;
  }>({ aylik: '99 TL', yillik: '699 TL', aylikBirimYillik: '58,25 TL' });

  // RevenueCat'ten guncel fiyatlari cek
  useEffect(() => {
    const fiyatlariCek = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        if (!current) return;

        const aylikPaket = current.monthly;
        const yillikPaket = current.annual;

        const yeniPaketler: typeof paketler = {};
        const yeniFiyatlar = { ...fiyatlar };

        if (aylikPaket) {
          yeniPaketler.aylik = aylikPaket;
          yeniFiyatlar.aylik = aylikPaket.product.priceString;
        }
        if (yillikPaket) {
          yeniPaketler.yillik = yillikPaket;
          yeniFiyatlar.yillik = yillikPaket.product.priceString;
          // Aylik birim fiyat hesapla
          const aylikBirim = yillikPaket.product.price / 12;
          yeniFiyatlar.aylikBirimYillik = aylikBirim.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + ' TL';
        }

        setPaketler(yeniPaketler);
        setFiyatlar(yeniFiyatlar);
      } catch (e) {
        console.warn('RevenueCat fiyat cekme hatasi:', e);
        // Hata durumunda hardcoded fiyatlar kullanilir
      }
    };
    fiyatlariCek();
  }, []);

  const satinAl = async () => {
    setYukleniyor(true);
    try {
      const paket = secilenPlan === 'yillik' ? paketler.yillik : paketler.aylik;

      if (!paket) {
        // RevenueCat henuz hazir degil (API key eksik veya store'da urun yok)
        Alert.alert(
          'Bilgi',
          'Odeme sistemi henuz hazirlanıyor. Lutfen daha sonra tekrar deneyin.',
          [{ text: 'Tamam' }],
        );
        return;
      }

      // RevenueCat ile satin alma
      const { customerInfo } = await Purchases.purchasePackage(paket);
      const aktif = !!customerInfo.entitlements.active[ENTITLEMENT_ID];

      if (aktif) {
        // Supabase'de de guncelle
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({
            abonelik_durumu: 'aktif',
            abonelik_plani: secilenPlan,
          }).eq('id', user.id);
        }

        Alert.alert(
          'Basarili',
          'Pusula Istanbul aboneliginiz aktif edildi. Hos geldiniz!',
          [{ text: 'Basla', onPress: () => router.replace('/(tabs)') }],
        );
      }
    } catch (e: any) {
      // Kullanici iptal ettiyse sessizce gec
      if (e?.userCancelled) return;
      Alert.alert('Hata', e?.message || 'Satin alma basarisiz. Lutfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollIcerik}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Başlık ── */}
        <Text style={styles.anaBaslik}>
          Profesyonel Pusulanızı{'\n'}Kesintisiz Kullanın
        </Text>
        <Text style={styles.altBaslik}>
          7 günlük ücretsiz keşif süreniz sona erdi.
          İstanbul operasyonunuzu hızlandırmaya devam etmek için
          size en uygun planı seçin.
        </Text>

        {/* ── Plan Kartları ── */}
        <View style={styles.planSatir}>
          {/* Aylık — Standart */}
          <TouchableOpacity
            style={[
              styles.planKart,
              secilenPlan === 'aylik' && styles.planKartAktif,
            ]}
            onPress={() => setSecilenPlan('aylik')}
            activeOpacity={0.7}
          >
            <View style={[styles.planRadio, secilenPlan === 'aylik' && styles.planRadioAktif]}>
              {secilenPlan === 'aylik' && <View style={styles.planRadioIc} />}
            </View>
            <Text style={[styles.planEtiket, secilenPlan === 'aylik' && styles.planEtiketAktif]}>
              Aylık
            </Text>
            <View style={styles.planFiyatSatir}>
              <Text style={[styles.planFiyat, secilenPlan === 'aylik' && styles.planFiyatAktif]}>
                {fiyatlar.aylik}
              </Text>
              <Text style={[styles.planPeriyot, secilenPlan === 'aylik' && styles.planPeriyotAktif]}>
                /ay
              </Text>
            </View>
          </TouchableOpacity>

          {/* Yıllık — Avantajlı */}
          <TouchableOpacity
            style={[
              styles.planKart,
              secilenPlan === 'yillik' && styles.planKartVurgulu,
            ]}
            onPress={() => setSecilenPlan('yillik')}
            activeOpacity={0.7}
          >
            {secilenPlan === 'yillik' ? (
              <LinearGradient
                colors={['#0077B6', '#005A8D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.planKartGradient}
              >
                <View style={styles.tasarrufBadge}>
                  <Text style={styles.tasarrufYazi}>%41 Tasarruf</Text>
                </View>
                <Text style={styles.planEtiketBeyaz}>Avantajlı Yıllık</Text>
                <View style={styles.planFiyatSatir}>
                  <Text style={styles.planFiyatBeyaz}>{fiyatlar.yillik}</Text>
                  <Text style={styles.planPeriyotBeyaz}>/yıl</Text>
                </View>
                <Text style={styles.planAylikBeyaz}>{fiyatlar.aylikBirimYillik}/ay</Text>
              </LinearGradient>
            ) : (
              <>
                <View style={[styles.planRadio, styles.planRadioAktif]}>
                  <View style={styles.planRadioIc} />
                </View>
                <Text style={styles.planEtiket}>Avantajlı Yıllık</Text>
                <View style={styles.planFiyatSatir}>
                  <Text style={styles.planFiyat}>{fiyatlar.yillik}</Text>
                  <Text style={styles.planPeriyot}>/yıl</Text>
                </View>
                <Text style={styles.planAylik}>{fiyatlar.aylikBirimYillik}/ay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Alt Bilgi ── */}
        <Text style={styles.guvenMetni}>
          Sadece 7 günlük ücretsiz süreniz bittikten sonra karar verirsiniz.
          Öncesinde hiçbir ücret alınmaz.
        </Text>

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.satinAlBtn}
          onPress={satinAl}
          disabled={yukleniyor}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0077B6', '#005A8D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.satinAlGradient}
          >
            <Text style={styles.satinAlYazi}>
              {yukleniyor ? 'İşleniyor...' : 'Pusulamı Aktifleştir'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/gizlilik-politikasi' as any)}>
            <Text style={styles.linkYazi}>Gizlilik Politikası</Text>
          </TouchableOpacity>
          <Text style={styles.linkAyrac}>|</Text>
          <TouchableOpacity onPress={() => router.push('/kullanim-kosullari' as any)}>
            <Text style={styles.linkYazi}>Kullanım Koşulları</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Çıkış',
              'Abonelik olmadan uygulamayı kullanamazsınız. Çıkış yapmak istiyor musunuz?',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Çıkış Yap',
                  style: 'destructive',
                  onPress: async () => {
                    await supabase.auth.signOut();
                  },
                },
              ],
            );
          }}
        >
          <Text style={styles.cikisYazi}>Çıkış Yap</Text>
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
    paddingBottom: 24,
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

  // Scroll
  scroll: { flex: 1 },
  scrollIcerik: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  // Başlık
  anaBaslik: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 24,
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 12,
  },
  altBaslik: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#64748B',
    lineHeight: 23,
    marginBottom: 28,
  },

  // Plan kartları
  planSatir: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planKart: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  planKartAktif: {
    borderColor: Palette.istanbulMavi,
    backgroundColor: '#F0F9FF',
  },
  planKartVurgulu: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 0,
    padding: 0,
  },
  planKartGradient: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },

  // Radio
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planRadioAktif: {
    borderColor: Palette.istanbulMavi,
  },
  planRadioIc: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.istanbulMavi,
  },

  // Plan text — normal
  planEtiket: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  planEtiketAktif: {
    color: '#0F172A',
  },
  planFiyatSatir: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planFiyat: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: '#64748B',
  },
  planFiyatAktif: {
    color: Palette.istanbulMavi,
  },
  planPeriyot: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 2,
  },
  planPeriyotAktif: {
    color: '#64748B',
  },
  planAylik: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Plan text — beyaz (gradient kart)
  planEtiketBeyaz: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  planFiyatBeyaz: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  planPeriyotBeyaz: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 2,
  },
  planAylikBeyaz: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Tasarruf badge
  tasarrufBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tasarrufYazi: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 11,
  },

  // Güven metni
  guvenMetni: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  // Sticky footer
  footerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  satinAlBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 10,
  },
  satinAlGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  satinAlYazi: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  linkYazi: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Palette.istanbulMavi,
  },
  linkAyrac: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  cikisYazi: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
