import { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUlasimTarife, type HavalimaniSefer } from '../../hooks/use-ulasim-tarife';

type Yon = 'gidis' | 'donus';

interface ModalVeri {
  durak: string;
  saatler: string[];
  yon: string;
}

export default function Ulasim() {
  const insets = useSafeAreaInsets();
  const [aktifHavaAlani, setAktifHavaAlani] = useState<'IST' | 'SAW'>('IST');
  const [yon, setYon] = useState<Yon>('gidis');
  const [modal, setModal] = useState<ModalVeri | null>(null);

  // Supabase'den veri cek (realtime)
  const { seferler: tumSeferler, yukleniyor } = useUlasimTarife();

  // Havalimani ve firmaya gore filtrele
  const istSeferler = tumSeferler.filter(s => s.havalimani === 'IST');
  const sawSeferler = tumSeferler.filter(s => s.havalimani === 'SAW');
  const seferler = aktifHavaAlani === 'IST' ? istSeferler : sawSeferler;

  const simdi = new Date();
  const simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
  const saatDk = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const sonraki = (saatler: string[]) => saatler.find(s => saatDk(s) > simdiDk);

  const firmaAdi = aktifHavaAlani === 'IST' ? 'HAVAİST' : 'HAVABÜS';
  const havAlaniAdi = aktifHavaAlani === 'IST' ? 'İstanbul Havalimanı (İST)' : 'Sabiha Gökçen Havalimanı (SAW)';
  const kaynak = seferler.length > 0
    ? `${seferler[0].kaynak || ''} • ${seferler[0].tarife_donemi || ''}`
    : '';

  return (
    <ScrollView style={s.container}>
      <LinearGradient colors={['#00A8E8','#0077B6','#0096C7','#48CAE4']} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerBaslik}>Havalimanı Ulaşımı</Text>
        <Text style={s.headerAlt}>Duraklara tıklayın → tüm saatleri görün</Text>
      </LinearGradient>

      <View style={s.segmentKutu}>
        <TouchableOpacity style={[s.segBtn, aktifHavaAlani === 'IST' && s.segAktif]} onPress={() => setAktifHavaAlani('IST')}>
          <Text style={[s.segYazi, aktifHavaAlani === 'IST' && s.segYaziAktif]}>İST — İstanbul</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.segBtn, aktifHavaAlani === 'SAW' && s.segAktif]} onPress={() => setAktifHavaAlani('SAW')}>
          <Text style={[s.segYazi, aktifHavaAlani === 'SAW' && s.segYaziAktif]}>SAW — Sabiha</Text>
        </TouchableOpacity>
      </View>

      <View style={s.segmentKutu}>
        <TouchableOpacity style={[s.segBtn, yon === 'gidis' && s.segAktif]} onPress={() => setYon('gidis')}>
          <Text style={[s.segYazi, yon === 'gidis' && s.segYaziAktif]}>Şehir → Havalimanı</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.segBtn, yon === 'donus' && s.segAktif]} onPress={() => setYon('donus')}>
          <Text style={[s.segYazi, yon === 'donus' && s.segYaziAktif]}>Havalimanı → Şehir</Text>
        </TouchableOpacity>
      </View>

      {yukleniyor ? (
        <ActivityIndicator size="large" color="#0077B6" style={{ marginTop: 40 }} />
      ) : seferler.length === 0 ? (
        <Text style={s.bosYazi}>Sefer verisi bulunamadı.</Text>
      ) : (
        <View style={s.bolum}>
          <Text style={s.sirketAdi}>{firmaAdi}</Text>
          <Text style={s.sirketAlt}>{havAlaniAdi}</Text>
          {seferler.map(durak => {
            const saatler = yon === 'gidis' ? (durak.sehirden_hav || []) : (durak.havdan_sehir || []);
            const snrk = sonraki(saatler);
            return (
              <TouchableOpacity key={durak.id} style={s.durakKart}
                onPress={() => setModal({ durak: durak.durak_adi, saatler, yon: yon === 'gidis' ? 'Şehir → Havalimanı' : 'Havalimanı → Şehir' })}>
                <View style={s.durakUst}>
                  <View style={s.durakBilgi}>
                    <Text style={s.durakAdi}>{durak.durak_adi}</Text>
                    <Text style={s.durakNot}>
                      {durak.not_bilgi || durak.havalimani}
                      {durak.fiyat ? ` • ${durak.fiyat}` : ''}
                      {durak.sure ? ` (${durak.sure})` : ''}
                    </Text>
                  </View>
                  <View style={s.seferKutu}>
                    <Text style={s.seferSayi}>{saatler.length}</Text>
                    <Text style={s.seferYazi}>sefer</Text>
                  </View>
                </View>
                <View style={s.snrkSatir}>
                  <Text style={s.snrkEtiket}>Sonraki:</Text>
                  <Text style={s.snrkSaat}>{snrk || '—'}</Text>
                  <Text style={s.tumBtn}>Tümü →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {kaynak ? <Text style={s.kaynak}>Kaynak: {kaynak}</Text> : null}
        </View>
      )}

      <View style={{ height: 30 }} />

      {/* MODAL — TÜM SAATLER */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <View style={s.modalBaslik}>
              <Text style={s.modalBaslikYazi}>{modal?.durak}</Text>
              <Text style={s.modalAlt}>{modal?.yon}</Text>
            </View>
            <ScrollView>
              <View style={s.saatGrid}>
                {modal?.saatler.map((saat, i) => {
                  const gecti = saatDk(saat) <= simdiDk;
                  return (
                    <View key={i} style={[s.saatKutu, gecti && s.saatGecti]}>
                      <Text style={[s.saatYazi, gecti && s.saatGectiYazi]}>{saat}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity style={s.kapat} onPress={() => setModal(null)}>
              <Text style={s.kapatYazi}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingBottom: 16, paddingHorizontal: 16 },
  headerBaslik: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  bosYazi: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },
  segmentKutu: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segAktif: { backgroundColor: '#0077B6' },
  segYazi: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  segYaziAktif: { color: '#FFFFFF' },
  bolum: { marginHorizontal: 16, marginTop: 8 },
  sirketAdi: { color: '#1E293B', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  sirketAlt: { color: '#64748B', fontSize: 12, marginTop: 2, marginBottom: 12 },
  durakKart: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#0077B6', borderWidth: 1, borderColor: '#E2E8F0' },
  durakUst: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  durakBilgi: { flex: 1 },
  durakAdi: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  durakNot: { color: '#64748B', fontSize: 11, marginTop: 2 },
  seferKutu: { alignItems: 'center', backgroundColor: '#EAF4FB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  seferSayi: { color: '#0077B6', fontSize: 20, fontWeight: '800' },
  seferYazi: { color: '#64748B', fontSize: 10 },
  snrkSatir: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
  snrkEtiket: { color: '#64748B', fontSize: 12, marginRight: 6 },
  snrkSaat: { color: '#0077B6', fontSize: 16, fontWeight: '700', flex: 1 },
  tumBtn: { color: '#0077B6', fontSize: 12, fontWeight: '600' },
  kaynak: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 8 },
  // Modal
  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalBaslik: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12 },
  modalBaslikYazi: { color: '#0077B6', fontSize: 20, fontWeight: '700' },
  modalAlt: { color: '#64748B', fontSize: 13, marginTop: 4 },
  saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  saatKutu: { backgroundColor: '#F5F7FA', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#0096C7' },
  saatGecti: { borderColor: '#E2E8F0', opacity: 0.5 },
  saatYazi: { color: '#1E293B', fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  saatGectiYazi: { color: '#94A3B8' },
  kapat: { backgroundColor: '#0077B6', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  kapatYazi: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
