import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAcilRehber } from '../../hooks/use-acil-rehber';
import { useTema } from '../../hooks/use-tema';

/* ═══════════════════════════════════════════
   Fallback veriler — Supabase'den veri gelmezse
   ═══════════════════════════════════════════ */
const FALLBACK_TURIZM = { isim: 'Turizm Polisi', numara: '02125274503', goruntu: '0212 527 45 03', aciklama: 'Turistlere yönelik güvenlik birimi' };
// 2021 itibarıyla tüm acil çağrı numaraları (110, 155, 156, 122, 158, 177) 112'de toplandı.
// Kaynak: EGM duyurusu (14 Kasım 2021) — Resmi Gazete 18.02.2018 yönetmelik
const FALLBACK_ACIL = [
  { isim: 'Tüm Acil Durumlar', numara: '112', goruntu: '112' },
];
const FALLBACK_MESLEK = [
  { isim: 'İstanbul Rehberler Odası (İRO)', numara: '02122920520', goruntu: '0212 292 05 20' },
  { isim: 'TUREB', numara: '03124170392', goruntu: '0312 417 03 92' },
];
const FALLBACK_LINK = [
  { isim: 'Nöbetçi Eczane', url: 'https://www.eczaneler.gen.tr/nobetci-istanbul' },
];

export default function Acil() {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTema();
  const { turizmPolisi, acilNumaralar, meslekKuruluslari, faydaliLinkler, yukleniyor, hata } = useAcilRehber();

  const ara = (numara: string) => Linking.openURL(`tel:${numara}`);
  const ac = (url: string) => Linking.openURL(url);

  // Veri gelmezse fallback kullan
  const tp = turizmPolisi.length > 0 ? turizmPolisi[0] : FALLBACK_TURIZM;
  const aciller = acilNumaralar.length > 0 ? acilNumaralar : FALLBACK_ACIL;
  const meslekler = meslekKuruluslari.length > 0 ? meslekKuruluslari : FALLBACK_MESLEK;
  const linkler = faydaliLinkler.length > 0 ? faydaliLinkler : FALLBACK_LINK;

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]}>
      {/* HEADER */}
      <LinearGradient
        colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={s.headerBaslik}>Acil Durum</Text>
        <Text style={s.headerAlt}>Tüm butonlar doğrudan arama / site açar</Text>
      </LinearGradient>

      {yukleniyor && (
        <ActivityIndicator size="small" color="#0077B6" style={{ marginTop: 16 }} />
      )}

      {/* TURIZM POLISI */}
      <View style={s.bolum}>
        <Text style={[s.bolumBaslik, { color: t.textMuted }]}>Turizm Polisi</Text>
        <TouchableOpacity
          style={[s.turizmKart, { backgroundColor: t.bgCard }]}
          onPress={() => ara(tp.numara || '')}
          activeOpacity={0.7}
        >
          <View style={s.turizmSol}>
            <Text style={[s.turizmIsim, { color: t.text }]}>{tp.isim}</Text>
  {/* aciklama kaldirildi */}
          </View>
          <View style={s.turizmSag}>
            <Text style={s.turizmNumara}>{tp.goruntu || tp.numara}</Text>
            <View style={s.turizmAraBtn}>
              <Text style={s.turizmAraBtnYazi}>Ara</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ACIL NUMARALAR — 2021'den itibaren tüm numaralar 112'de */}
      <View style={s.bolum}>
        <Text style={[s.bolumBaslik, { color: t.textMuted }]}>Acil Durum</Text>
        <TouchableOpacity
          style={[s.acil112Kart, { backgroundColor: t.bgCard }]}
          onPress={() => ara('112')}
          activeOpacity={0.7}
        >
          <View style={s.acil112Sol}>
            <Text style={s.acil112Numara}>112</Text>
            <Text style={[s.acil112Etiket, { color: t.text }]}>Tüm Acil Durumlar</Text>
          </View>
          <View style={s.acil112AraBtn}>
            <Text style={s.acil112AraBtnYazi}>Ara</Text>
          </View>
        </TouchableOpacity>
        <Text style={[s.acil112Bilgi, { color: t.textSecondary }]}>
          Polis, ambulans, itfaiye, jandarma, AFAD, sahil güvenlik ve orman yangın için tek numara.
          Eski numaralar (155, 110, 156, 158, 122, 177) 2021'den bu yana 112'ye yönlendirilir.
        </Text>
      </View>

      {/* MESLEK KURULUSLARI */}
      <View style={s.bolum}>
        <Text style={[s.bolumBaslik, { color: t.textMuted }]}>Meslek Kuruluşları</Text>
        {meslekler.map((k: any, i: number) => (
          <View key={k.id || i} style={[s.listeSatir, { backgroundColor: t.bgCard, borderColor: t.kartBorder, flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text style={[s.listeIsim, { color: t.text }]}>{k.isim}</Text>
            <View style={s.meslekAltSatir}>
              {k.numara ? (
                <TouchableOpacity onPress={() => ara(k.numara)} style={s.araBtn} activeOpacity={0.7}>
                  <Text style={s.araBtnYazi}>{k.goruntu || k.numara}</Text>
                </TouchableOpacity>
              ) : null}
              {k.url ? (
                <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(k.url)} style={s.webBtn} activeOpacity={0.7}>
                  <Text style={s.webBtnYazi}>Web Sitesi</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* FAYDALI KAYNAKLAR */}
      <View style={s.bolum}>
        <Text style={[s.bolumBaslik, { color: t.textMuted }]}>Faydalı Kaynaklar</Text>
        {linkler.map((l: any, i: number) => (
          <TouchableOpacity
            key={l.id || i}
            style={[s.listeSatir, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}
            onPress={() => ac(l.url || '')}
            activeOpacity={0.7}
          >
            <Text style={[s.listeIsim, { color: t.text }]}>{l.isim}</Text>
            <Text style={s.listeOk}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SÖZLEŞME ÖRNEKLERİ */}
      <View style={s.bolum}>
        <Text style={[s.bolumBaslik, { color: t.textMuted }]}>Sözleşme Örnekleri</Text>
        <TouchableOpacity
          style={[s.listeSatir, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}
          onPress={() => Linking.openURL('https://pusulaistanbul.app/musteri-rehber-sozlesmesi.docx')}
          activeOpacity={0.7}
        >
          <View style={s.listeBilgi}>
            <Text style={[s.listeIsim, { color: t.text }]}>Müşteri — Rehber Sözleşmesi</Text>
            <Text style={[s.sozlesmeAlt, { color: t.textSecondary }]}>Word belgesi olarak indir</Text>
          </View>
          <Text style={s.listeOk}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.listeSatir, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}
          onPress={() => Linking.openURL('https://pusulaistanbul.app/acente-hizmet-sozlesmesi.docx')}
          activeOpacity={0.7}
        >
          <View style={s.listeBilgi}>
            <Text style={[s.listeIsim, { color: t.text }]}>Acente — Rehber Hizmet Sözleşmesi</Text>
            <Text style={[s.sozlesmeAlt, { color: t.textSecondary }]}>Word belgesi olarak indir</Text>
          </View>
          <Text style={s.listeOk}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingBottom: 16, paddingHorizontal: 16 },
  headerBaslik: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center' },

  bolum: { marginHorizontal: 16, marginTop: 24 },
  bolumBaslik: { fontSize: 13, fontWeight: '600', marginBottom: 12 },

  acilGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  acilKart: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '30%',
    flexGrow: 1,
    borderWidth: 1.5,
  },
  acilNumara: { fontSize: 24, fontWeight: '800', color: '#0077B6', marginBottom: 6 },
  acilIsim: { fontSize: 11, textAlign: 'center', fontWeight: '500' },

  // 112 — Tüm Acil Durumlar tek büyük kart
  acil112Kart: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#D62828',
    borderLeftWidth: 6,
  },
  acil112Sol: { flex: 1 },
  acil112Numara: {
    fontSize: 44,
    fontWeight: '800',
    color: '#D62828',
    lineHeight: 48,
    letterSpacing: -1,
  },
  acil112Etiket: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  acil112AraBtn: {
    backgroundColor: '#D62828',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  acil112AraBtnYazi: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  acil112Bilgi: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    paddingHorizontal: 4,
  },

  turizmKart: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#0077B6',
    borderLeftWidth: 4,
  },
  turizmSol: { flex: 1, marginRight: 12 },
  turizmIsim: { fontSize: 15, fontWeight: '700' },
  turizmAciklama: { fontSize: 12, marginTop: 3 },
  turizmSag: { alignItems: 'flex-end' },
  turizmNumara: { color: '#0077B6', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  turizmAraBtn: { backgroundColor: '#0077B6', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 7 },
  turizmAraBtnYazi: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  listeSatir: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  listeBilgi: { flex: 1 },
  listeIsim: { fontSize: 14, fontWeight: '600', flex: 1 },
  listeNumara: { color: '#0077B6', fontSize: 13, marginTop: 4, fontWeight: '500' },
  listeOk: { color: '#0077B6', fontSize: 22, fontWeight: '600', marginLeft: 8 },
  sozlesmeAlt: { fontSize: 11, marginTop: 3 },
  meslekAltSatir: { flexDirection: 'row', gap: 8, marginTop: 10 },
  webBtn: { backgroundColor: '#48CAE4', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  webBtnYazi: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  araBtn: { backgroundColor: '#0077B6', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  araBtnYazi: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
