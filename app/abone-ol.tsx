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
import { useTema } from '../hooks/use-tema';
import { ENTITLEMENT_ID, revenueCatInit, isRCReady } from '../lib/revenuecat';

/* ═══════════════════════════════════════════
   Premium Abonelik Sayfasi — FREEMIUM MODEL
   ─────────────────────────────────────────
   Premium ozelliklere (sohbet, canli durum,
   etkinlikler, ulasim uyarilari) erisim icin
   IAP abonelik sayfasi.
   Temel ozellikler ucretsiz, burasi sadece
   premium'a yukseltme icin.
   ═══════════════════════════════════════════ */

type Plan = 'aylik' | 'yillik';

export default function AboneOl() {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTema();
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
        // RevenueCat hazir degilse bekle ve baslat
        if (!isRCReady()) await revenueCatInit();
        if (!isRCReady()) return; // Hala hazir degilse hardcoded fiyatlarla devam

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
      // RevenueCat hazir degilse once baslat
      if (!isRCReady()) await revenueCatInit();
      if (!isRCReady()) {
        Alert.alert('Hata', 'Ödeme sistemi başlatılamadı. Lütfen uygulamayı kapatıp yeniden açın.');
        return;
      }

      const paket = secilenPlan === 'yillik' ? paketler.yillik : paketler.aylik;

      let customerInfo;

      if (paket) {
        // RevenueCat paketi varsa paket ile satin al
        const sonuc = await Purchases.purchasePackage(paket);
        customerInfo = sonuc.customerInfo;
      } else {
        // Paket yuklenemedi — dogrudan urun ID ile satin al (fallback)
        const urunId = secilenPlan === 'yillik'
          ? 'com.pusulaistanbul.app.yillik'
          : 'com.pusulaistanbul.app.aylik';
        const products = await Purchases.getProducts([urunId]);
        if (!products || products.length === 0) {
          throw new Error('Abonelik ürünleri yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
        }
        const sonuc = await Purchases.purchaseStoreProduct(products[0]);
        customerInfo = sonuc.customerInfo;
      }
      let aktif = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];

      // Entitlement hemen gorunmeyebilir — restore ile tekrar dene
      if (!aktif) {
        console.warn('Satin alma sonrasi entitlement bulunamadi, restore deneniyor...');
        try {
          const restoreInfo = await Purchases.restorePurchases();
          aktif = !!restoreInfo?.entitlements?.active?.[ENTITLEMENT_ID];
        } catch (restoreErr) {
          console.warn('Restore denemesi basarisiz:', restoreErr);
        }
      }

      // Supabase'i her durumda guncelle (fallback olarak calisir)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          abonelik_durumu: 'aktif',
          abonelik_plani: secilenPlan,
          abonelik_bitis: new Date(Date.now() + (secilenPlan === 'yillik' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', user.id);
      }

      Alert.alert(
        'Başarılı',
        'Pusula İstanbul aboneliğiniz aktif edildi. Hoş geldiniz!',
        [{ text: 'Başla', onPress: () => router.replace('/(tabs)') }],
      );
    } catch (e: any) {
      // Kullanici iptal ettiyse sessizce gec
      if (e?.userCancelled) return;
      Alert.alert('Hata', e?.message || 'Satın alma başarısız. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  };

  // ─── Satın Almaları Geri Yükle (Restore Purchases) ───
  // Apple App Store zorunluluğu: farklı cihaza giriş yapan kullanıcı
  // mevcut aboneliğini geri yükleyebilmeli
  const satinAlmalariGeriYukle = async () => {
    setYukleniyor(true);
    try {
      if (!isRCReady()) await revenueCatInit();
      const customerInfo = await Purchases.restorePurchases();
      const aktif = !!customerInfo.entitlements.active[ENTITLEMENT_ID];

      if (aktif) {
        // Supabase'de de güncelle
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({
            abonelik_durumu: 'aktif',
          }).eq('id', user.id);
        }

        Alert.alert(
          'Başarılı',
          'Aboneliğiniz geri yüklendi. Hoş geldiniz!',
          [{ text: 'Devam', onPress: () => router.replace('/(tabs)') }],
        );
      } else {
        Alert.alert(
          'Aktif Abonelik Bulunamadı',
          'Bu Apple ID ile ilişkili aktif bir abonelik bulunamadı. Yeni bir plan seçerek satın alma yapabilirsiniz.',
        );
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Geri yükleme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
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
        <Text style={[styles.anaBaslik, { color: t.text }]}>
          Dijital Asistanınızı{'\n'}Kesintisiz Kullanın
        </Text>
        <Text style={[styles.altBaslik, { color: t.textSecondary }]}>
          Cami ve müze ziyaret saatleri, canlı saha durumu, ulaşım
          uyarıları, döviz çevirici ve kent etkinlikleri gibi premium
          özelliklere erişmek için size en uygun planı seçin.
        </Text>

        {/* ── Plan Kartları ── */}
        <View style={styles.planSatir}>
          {/* Aylık — Standart */}
          <TouchableOpacity
            style={[
              styles.planKart,
              { backgroundColor: t.bgCard, borderColor: t.kartBorder },
              secilenPlan === 'aylik' && [styles.planKartAktif, { backgroundColor: isDark ? '#0E2A40' : '#F0F9FF' }],
            ]}
            onPress={() => setSecilenPlan('aylik')}
            activeOpacity={0.7}
          >
            <View style={[styles.planRadio, { borderColor: isDark ? '#506070' : '#CBD5E1' }, secilenPlan === 'aylik' && styles.planRadioAktif]}>
              {secilenPlan === 'aylik' && <View style={styles.planRadioIc} />}
            </View>
            <Text style={[styles.planEtiket, { color: t.textSecondary }, secilenPlan === 'aylik' && { color: t.text }]}>
              Aylık
            </Text>
            <View style={styles.planFiyatSatir}>
              <Text style={[styles.planFiyat, { color: t.textSecondary }, secilenPlan === 'aylik' && styles.planFiyatAktif]} numberOfLines={1} adjustsFontSizeToFit>
                {fiyatlar.aylik}
              </Text>
              <Text style={[styles.planPeriyot, { color: t.textMuted }, secilenPlan === 'aylik' && { color: t.textSecondary }]}>
                /ay
              </Text>
            </View>
          </TouchableOpacity>

          {/* Yıllık — Avantajlı */}
          <TouchableOpacity
            style={[
              styles.planKart,
              { backgroundColor: t.bgCard, borderColor: t.kartBorder },
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
                <Text style={styles.planEtiketBeyaz}>Avantajlı{'\n'}Yıllık</Text>
                <View style={styles.planFiyatSatir}>
                  <Text style={styles.planFiyatBeyaz} numberOfLines={1} adjustsFontSizeToFit>{fiyatlar.yillik}</Text>
                  <Text style={styles.planPeriyotBeyaz}>/yıl</Text>
                </View>
                <Text style={styles.planAylikBeyaz}>{fiyatlar.aylikBirimYillik}/ay</Text>
              </LinearGradient>
            ) : (
              <>
                <View style={[styles.planRadio, { borderColor: isDark ? '#506070' : '#CBD5E1' }]} />
                <Text style={[styles.planEtiket, { color: t.textSecondary }]}>Avantajlı{'\n'}Yıllık</Text>
                <View style={styles.planFiyatSatir}>
                  <Text style={[styles.planFiyat, { color: t.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>{fiyatlar.yillik}</Text>
                  <Text style={[styles.planPeriyot, { color: t.textMuted }]}>/yıl</Text>
                </View>
                <Text style={[styles.planAylik, { color: t.textMuted }]}>{fiyatlar.aylikBirimYillik}/ay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Alt Bilgi ── */}
        <Text style={[styles.guvenMetni, { color: t.textMuted }]}>
          Temel özellikler (müze saatleri, ulaşım bilgileri, acil rehber)
          her zaman ücretsizdir. Premium özellikler için abonelik gerekir.
        </Text>
        <Text style={[styles.yasalMetni, { color: t.textMuted }]}>
          Abone olarak Gizlilik Politikası'nı ve Kullanım Koşulları'nı kabul etmiş olursunuz.
        </Text>

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 12, backgroundColor: t.bg, borderTopColor: t.divider }]}>
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
              {yukleniyor ? 'İşleniyor...' : 'Pusula İstanbul\'u Aktifleştir'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={satinAlmalariGeriYukle}
          disabled={yukleniyor}
          style={styles.geriYukleBtn}
        >
          <Text style={[styles.geriYukleYazi, { color: t.accent }]}>Satın Almaları Geri Yükle</Text>
        </TouchableOpacity>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/gizlilik-politikasi' as any)}>
            <Text style={[styles.linkYazi, { color: t.accent }]}>Gizlilik Politikası</Text>
          </TouchableOpacity>
          <Text style={[styles.linkAyrac, { color: t.divider }]}>|</Text>
          <TouchableOpacity onPress={() => router.push('/kullanim-kosullari' as any)}>
            <Text style={[styles.linkYazi, { color: t.accent }]}>Kullanım Koşulları</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={[styles.cikisYazi, { color: t.textMuted }]}>Geri Dön</Text>
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
    minHeight: 180,
    justifyContent: 'center',
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
    justifyContent: 'center',
    borderRadius: Radius.lg,
    minHeight: 180,
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
    textAlign: 'center',
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
    fontSize: 24,
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
    textAlign: 'center',
  },
  planFiyatBeyaz: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 24,
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
  yasalMetni: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginTop: 12,
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
  geriYukleBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  geriYukleYazi: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Palette.istanbulMavi,
    textDecorationLine: 'underline',
  },
});
