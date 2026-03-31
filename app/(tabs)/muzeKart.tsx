import { useMemo } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTema } from '../../hooks/use-tema';
import { useMekanSaatleri } from '../../hooks/use-mekan-saatleri';
import { Palette, type TemaRenkleri } from '../../constants/theme';

// Statik satis noktalari — bunlar nadiren degisir, admin panelden mekan_saatleri'ne ek alan eklenebilir
const SATIS_NOKTALARI = [
  { isim: 'İstanbul Arkeoloji Müzeleri', adres: 'Osman Hamdi Bey Yokuşu, Fatih', not: 'Sakin, tavsiye edilir', yogunluk: 'dusuk' },
  { isim: 'Topkapı Sarayı Müzesi', adres: 'Sultanahmet, Fatih', not: 'En işlek — kuyruk olabilir', yogunluk: 'yuksek' },
  { isim: 'Türk ve İslam Eserleri Müzesi', adres: 'At Meydanı, Sultanahmet', not: 'Nispeten sakin', yogunluk: 'dusuk' },
  { isim: 'Aya İrini Anıt Müzesi', adres: 'Topkapı Sarayı 1. Avlu, Fatih', not: 'Az bekleme', yogunluk: 'dusuk' },
  { isim: 'Sultanahmet Meydan Gişe', adres: 'Sultanahmet Meydanı, Fatih', not: 'Merkezi konum', yogunluk: 'orta' },
];

export default function MuzeKart() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const { mekanlar, yukleniyor } = useMekanSaatleri();
  const styles = createStyles(t);

  // Supabase'den muzekart durumuna gore filtrele
  const gecenYerler = useMemo(() =>
    mekanlar.filter(m => m.muzekart === 'gecerli').map(m => ({
      isim: m.isim,
      not: m.ozel_not || '',
    })),
    [mekanlar]
  );

  const gecmeyenYerler = useMemo(() =>
    mekanlar.filter(m => m.muzekart === 'gecmez').map(m => ({
      isim: m.isim,
      not: m.fiyat_yabanci ? `Yabanci: ${m.fiyat_yabanci}` : (m.ozel_not || 'Ayri bilet'),
    })),
    [mekanlar]
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#00A8E8','#0077B6','#0096C7','#48CAE4']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerBaslik}>Müze Kart</Text>
        <Text style={styles.headerAlt}>Museum Pass İstanbul bilgileri</Text>
      </LinearGradient>

      {/* RESMI LINK */}
      <TouchableOpacity style={styles.resmiLink}
        onPress={() => Linking.openURL('https://muze.gov.tr/MuseumPass')}>
        <Text style={styles.resmiLinkYazi}>muze.gov.tr/MuseumPass — Resmi Satış Sitesi</Text>
      </TouchableOpacity>

      {/* FATIH SATIS NOKTALARI */}
      <View style={styles.bolum}>
        <Text style={styles.bolumBaslik}>Fatih'te Satış Noktaları</Text>
        {SATIS_NOKTALARI.map((s, i) => (
          <View key={i} style={[styles.satisKart, { borderLeftColor: s.yogunluk === 'dusuk' ? Palette.acik : Palette.uyari }]}>
            <View style={styles.satisUst}>
              <Text style={styles.satisIsim}>{s.isim}</Text>
              <View style={[styles.yogunlukBadge, { backgroundColor: s.yogunluk === 'dusuk' ? Palette.acik + '20' : Palette.uyari + '20' }]}>
                <Text style={[styles.yogunlukYazi, { color: s.yogunluk === 'dusuk' ? Palette.acik : Palette.uyari }]}>
                  {s.yogunluk === 'dusuk' ? 'Sakin' : 'Kalabalik'}
                </Text>
              </View>
            </View>
            <Text style={styles.satisAdres}>{s.adres}</Text>
            <Text style={styles.satisNot}>{s.not}</Text>
          </View>
        ))}
      </View>

      {/* KART TIPLERI */}
      <View style={styles.bolum}>
        <Text style={styles.bolumBaslik}>Kart Tipleri</Text>
        <View style={styles.kartGrid}>
          <TouchableOpacity style={[styles.tipKart, { borderColor: t.accent }]}
            onPress={() => Linking.openURL('https://muze.gov.tr/urun-detay?CatalogNo=KRT-MBL01-99-008')}>
            <View style={[styles.tipDot, { backgroundColor: t.accent }]} />
            <Text style={[styles.tipAdi, { color: t.accent }]}>Müzekart</Text>
            <Text style={styles.tipAlt}>T.C. Vatandaşı</Text>
            <Text style={styles.tipAciklama}>Kimlik ile satın alınır. Yıllık geçerli.</Text>
            <Text style={styles.tipLink}>Satın Al</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tipKart, { borderColor: Palette.acik }]}
            onPress={() => Linking.openURL('https://muze.gov.tr/urun-detay?CatalogNo=WEB-MSP01-27-009')}>
            <View style={[styles.tipDot, { backgroundColor: Palette.acik }]} />
            <Text style={[styles.tipAdi, { color: Palette.acik }]}>Museum Pass</Text>
            <Text style={styles.tipAlt}>Yabancı Ziyaretçi</Text>
            <Text style={styles.tipAciklama}>72 saat geçerli. Topkapı Harem dahil.</Text>
            <Text style={styles.tipLink}>Satın Al</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GECEN YERLER */}
      <View style={styles.bolum}>
        <Text style={styles.bolumBaslik}>Müzekart Geçen Yerler</Text>
        {yukleniyor && gecenYerler.length === 0 ? (
          <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 20 }} />
        ) : gecenYerler.length === 0 ? (
          <Text style={[styles.bosYazi, { color: t.textMuted }]}>Henüz veri yok</Text>
        ) : (
          gecenYerler.map((m, i) => (
            <View key={i} style={styles.gecenSatir}>
              <View style={[styles.durumDot, { backgroundColor: Palette.acik }]} />
              <View style={styles.satirIcerik}>
                <Text style={styles.satirIsim}>{m.isim}</Text>
                {m.not ? <Text style={styles.satirNot}>{m.not}</Text> : null}
              </View>
            </View>
          ))
        )}
      </View>

      {/* GECMEYEN YERLER */}
      <View style={styles.bolum}>
        <Text style={styles.bolumBaslik}>Müzekart Geçmeyen Yerler</Text>
        {yukleniyor && gecmeyenYerler.length === 0 ? (
          <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 20 }} />
        ) : gecmeyenYerler.length === 0 ? (
          <Text style={[styles.bosYazi, { color: t.textMuted }]}>Henüz veri yok</Text>
        ) : (
          gecmeyenYerler.map((m, i) => (
            <View key={i} style={styles.gecmeyenSatir}>
              <View style={[styles.durumDot, { backgroundColor: Palette.kapali }]} />
              <View style={styles.satirIcerik}>
                <Text style={styles.satirIsim}>{m.isim}</Text>
                <Text style={styles.gecmeyenNot}>{m.not}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* REHBERLIK IPUCU */}
      <View style={styles.ipucuKutu}>
        <Text style={styles.ipucuBaslik}>Rehber İpucu</Text>
        <Text style={styles.ipucuYazi}>
          Turistleri kalabalık Topkapı gişesi yerine Arkeoloji Müzesi veya
          Türk ve İslam Eserleri gişesine yönlendir — aynı kart, çok daha az bekleme.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: { paddingBottom: 16, paddingHorizontal: 16 },
    headerBaslik: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
    headerAlt: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center' },
    resmiLink: { margin: 16, backgroundColor: t.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: t.accent, alignItems: 'center' },
    resmiLinkYazi: { color: t.accent, fontSize: 13, fontWeight: '700' },
    bolum: { marginHorizontal: 16, marginTop: 20 },
    bolumBaslik: { color: t.accent, fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
    kartGrid: { flexDirection: 'row', gap: 10 },
    tipKart: { flex: 1, backgroundColor: t.bgCard, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
    tipDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
    tipAdi: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
    tipAlt: { color: t.textSecondary, fontSize: 11, marginBottom: 8 },
    tipAciklama: { color: t.textSecondary, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 8 },
    tipLink: { color: t.accent, fontSize: 12, fontWeight: '700' },
    gecenSatir: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Palette.acik + '15', borderRadius: 8, padding: 12, marginBottom: 6 },
    gecmeyenSatir: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Palette.kapali + '15', borderRadius: 8, padding: 12, marginBottom: 6 },
    durumDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, marginTop: 4 },
    satirIcerik: { flex: 1 },
    satirIsim: { color: t.text, fontSize: 13, fontWeight: '600' },
    satirNot: { color: Palette.uyari, fontSize: 11, marginTop: 2 },
    gecmeyenNot: { color: t.textSecondary, fontSize: 11, marginTop: 2 },
    bosYazi: { textAlign: 'center', fontSize: 13, marginVertical: 16 },
    satisKart: { backgroundColor: t.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
    satisUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    satisIsim: { color: t.text, fontSize: 13, fontWeight: '700', flex: 1 },
    yogunlukBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    yogunlukYazi: { fontSize: 11, fontWeight: '700' },
    satisAdres: { color: t.textSecondary, fontSize: 12, marginBottom: 4 },
    satisNot: { color: t.textSecondary, fontSize: 11 },
    ipucuKutu: { margin: 16, marginTop: 20, backgroundColor: t.bgCardAlt, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: t.accent },
    ipucuBaslik: { color: t.accent, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    ipucuYazi: { color: t.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
