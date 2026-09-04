// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + BolumBaslik (kicker) + Kart/DurumNoktasi diliyle yeniden boyandı.
// Linking hedefleri, Supabase filtreleri ve metinler aynen korundu.
import { useMemo } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../hooks/use-tema';
import { useMekanSaatleri } from '../../hooks/use-mekan-saatleri';
import { Font, Palette, type TemaRenkleri } from '../../constants/theme';
import { BolumBaslik, BosDurum, DurumNoktasi, GradyanHeader, HeaderBaslik, Kart, Kicker } from '../../components/ui/pusula-ui';

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

  // Supabase'den muzekart durumuna gore filtrele — isim + opsiyonel parantez ici not (orn. "Harem'de geçmez")
  const gecenYerler = useMemo(() =>
    mekanlar.filter(m => m.muzekart === 'gecerli').map(m => ({ isim: m.isim, not: m.muzekart_not })),
    [mekanlar]
  );

  const gecmeyenYerler = useMemo(() =>
    mekanlar.filter(m => m.muzekart === 'gecmez').map(m => ({ isim: m.isim, not: m.muzekart_not })),
    [mekanlar]
  );

  return (
    <ScrollView style={styles.container}>
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="MüzeKart" />
      </GradyanHeader>

      {/* RESMI LINK */}
      <View style={styles.bolumIlk}>
        <Kart accent={t.accent} onPress={() => Linking.openURL('https://muze.gov.tr/MuseumPass')}>
          <Text style={styles.resmiLinkYazi}>muze.gov.tr/MuseumPass — Resmi Satış Sitesi</Text>
        </Kart>
      </View>

      {/* FATIH SATIS NOKTALARI */}
      <View style={styles.bolum}>
        <BolumBaslik baslik="Fatih'te Satış Noktaları" renk={t.secondary} />
        {SATIS_NOKTALARI.map((s, i) => (
          <Kart key={i} accent={s.yogunluk === 'dusuk' ? Palette.acik : Palette.uyari}>
            <Text style={styles.satisIsim}>{s.isim}</Text>
            <Text style={styles.satisAdres}>{s.adres}</Text>
            <View style={styles.satirIc}>
              <DurumNoktasi renk={s.yogunluk === 'dusuk' ? Palette.acik : Palette.uyari} boyut={8} />
              <Text style={styles.satisNot}>{s.not}</Text>
            </View>
          </Kart>
        ))}
      </View>

      {/* KART TIPLERI */}
      <View style={styles.bolum}>
        <BolumBaslik baslik="Kart Tipleri" renk={t.secondary} />
        <View style={styles.kartGrid}>
          <Kart style={styles.tipKart} onPress={() => Linking.openURL('https://muze.gov.tr/urun-detay?CatalogNo=KRT-MBL01-99-008')}>
            <View style={styles.tipIc}>
              <DurumNoktasi renk={t.accent} boyut={12} />
              <Text style={[styles.tipAdi, { color: t.accent }]}>MüzeKart</Text>
              <Text style={styles.tipAlt}>T.C. Vatandaşı</Text>
              <Text style={styles.tipAciklama}>Kimlik ile satın alınır. Yıllık geçerli.</Text>
              <Text style={styles.tipLink}>Satın Al</Text>
            </View>
          </Kart>
          <Kart style={styles.tipKart} onPress={() => Linking.openURL('https://muze.gov.tr/urun-detay?CatalogNo=WEB-MSP01-27-009')}>
            <View style={styles.tipIc}>
              <DurumNoktasi renk={Palette.acik} boyut={12} />
              <Text style={[styles.tipAdi, { color: Palette.acik }]}>Museum Pass</Text>
              <Text style={styles.tipAlt}>Yabancı Ziyaretçi</Text>
              <Text style={styles.tipAciklama}>72 saat geçerli. Topkapı Harem dahil.</Text>
              <Text style={styles.tipLink}>Satın Al</Text>
            </View>
          </Kart>
        </View>
      </View>

      {/* GECEN YERLER */}
      <View style={styles.bolum}>
        <BolumBaslik baslik="MüzeKart Geçen Yerler" renk={Palette.acik} />
        {yukleniyor && gecenYerler.length === 0 ? (
          <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 20 }} />
        ) : gecenYerler.length === 0 ? (
          <BosDurum metin="Henüz veri yok" />
        ) : (
          <Kart>
            {gecenYerler.map((y, i) => (
              <View key={i} style={[styles.satir, i > 0 && styles.satirAyirici]}>
                <DurumNoktasi renk={Palette.acik} />
                <Text style={styles.satirIsim}>
                  {y.isim}
                  {y.not ? <Text style={styles.satirNot}> ({y.not})</Text> : null}
                </Text>
              </View>
            ))}
          </Kart>
        )}
      </View>

      {/* GECMEYEN YERLER */}
      <View style={styles.bolum}>
        <BolumBaslik baslik="MüzeKart Geçmeyen Yerler" renk={Palette.kapali} />
        {yukleniyor && gecmeyenYerler.length === 0 ? (
          <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 20 }} />
        ) : gecmeyenYerler.length === 0 ? (
          <BosDurum metin="Henüz veri yok" />
        ) : (
          <Kart>
            {gecmeyenYerler.map((y, i) => (
              <View key={i} style={[styles.satir, i > 0 && styles.satirAyirici]}>
                <DurumNoktasi renk={Palette.kapali} />
                <Text style={styles.satirIsim}>
                  {y.isim}
                  {y.not ? <Text style={styles.satirNot}> ({y.not})</Text> : null}
                </Text>
              </View>
            ))}
          </Kart>
        )}
      </View>

      {/* REHBERLIK IPUCU */}
      <View style={styles.bolum}>
        <Kart accent={t.accent}>
          <Kicker color={t.accent}>Rehber İpucu</Kicker>
          <Text style={styles.ipucuYazi}>
            Turistleri kalabalık Topkapı gişesi yerine Arkeoloji Müzesi veya
            Türk ve İslam Eserleri gişesine yönlendir — aynı kart, çok daha az bekleme.
          </Text>
        </Kart>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    bolumIlk: { paddingHorizontal: 16, paddingTop: 16 },
    bolum: { paddingHorizontal: 16, marginTop: 20, gap: 14 },
    resmiLinkYazi: { color: t.text, fontFamily: Font.bold, fontSize: 13, letterSpacing: -0.3 },
    kartGrid: { flexDirection: 'row', gap: 10 },
    tipKart: { flex: 1 },
    tipIc: { alignItems: 'center', gap: 4 },
    tipAdi: { fontFamily: Font.extrabold, fontSize: 15, letterSpacing: -0.3, marginTop: 4 },
    tipAlt: { color: t.textSecondary, fontFamily: Font.regular, fontSize: 11 },
    tipAciklama: { color: t.textSecondary, fontFamily: Font.regular, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },
    tipLink: { color: t.accent, fontFamily: Font.bold, fontSize: 12, marginTop: 4 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
    satirAyirici: { borderTopWidth: 1, borderTopColor: t.divider },
    satirIc: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    satirIsim: { color: t.text, fontFamily: Font.semibold, fontSize: 13, flex: 1 },
    satirNot: { color: t.textSecondary, fontFamily: Font.regular, fontSize: 12, fontStyle: 'italic' },
    satisIsim: { color: t.text, fontFamily: Font.bold, fontSize: 14, letterSpacing: -0.3 },
    satisAdres: { color: t.textSecondary, fontFamily: Font.regular, fontSize: 12 },
    satisNot: { color: t.textSecondary, fontFamily: Font.regular, fontSize: 11 },
    ipucuYazi: { color: t.textSecondary, fontFamily: Font.regular, fontSize: 13, lineHeight: 20 },
  });
}
