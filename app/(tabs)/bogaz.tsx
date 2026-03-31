import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useBogazTurlari, type BogazTuru } from '../../hooks/use-bogaz-turlari';

const ADALAR_LINKLERI = [
  { sirket: 'Dentur Avrasya', url: 'https://denturavrasya.com/tr-TR/hatlarimiz/adalar', renk: '#0096C7' },
  { sirket: 'Şehir Hatları', url: 'https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/adalar-hatlari-176', renk: '#0077B6' },
];

export default function Bogaz() {
  const insets = useSafeAreaInsets();
  const { turlar, yukleniyor } = useBogazTurlari();
  const [saatModal, setSaatModal] = useState<{ baslik: string; saatler: string[] } | null>(null);

  const simdi = new Date();
  const simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
  const saatDk = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const gunTip = simdi.getDay() === 0 || simdi.getDay() === 6 ? 'haftasonu' : 'hafta';

  // Sirkete gore gruplama
  const turyol = turlar.find(t => t.sirket_id === 'turyol');
  const dentur = turlar.find(t => t.sirket_id === 'dentur');
  const shKisa = turlar.find(t => t.sirket_id === 'sehirhatlari_kisa');
  const shUzun = turlar.find(t => t.sirket_id === 'sehirhatlari_uzun');

  const getSaatler = (t: BogazTuru) => {
    if (gunTip === 'haftasonu' && t.hafta_sonu_saatler?.length > 0) return t.hafta_sonu_saatler;
    return t.hafta_ici_saatler || [];
  };

  const [aktifSirket, setAktifSirket] = useState<'turyol' | 'dentur' | 'sehirhatlari'>('turyol');

  const tarife = turlar.length > 0 ? (turlar[0].tarife_donemi || '') : '';

  return (
    <ScrollView style={s.container}>
      <LinearGradient colors={['#00A8E8','#0077B6','#0096C7','#48CAE4']} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerBaslik}>Boğaz & Adalar</Text>
        <Text style={s.headerAlt}>Güncel sefer saatleri{tarife ? ` — ${tarife} tarifesi` : ''}</Text>
      </LinearGradient>

      {yukleniyor ? (
        <ActivityIndicator size="large" color="#0077B6" style={{ marginTop: 40 }} />
      ) : turlar.length === 0 ? (
        <Text style={s.bosYazi}>Boğaz turu verisi bulunamadı.</Text>
      ) : (
        <>
          {/* Firma seçici */}
          <View style={s.segKutu}>
            {(['turyol', 'dentur', 'sehirhatlari'] as const).map(f => (
              <TouchableOpacity key={f} style={[s.segBtn, aktifSirket === f && s.segAktif]}
                onPress={() => setAktifSirket(f)}>
                <Text style={[s.segYazi, aktifSirket === f && s.segYaziAktif]}>
                  {f === 'turyol' ? 'Turyol' : f === 'dentur' ? 'Dentur' : 'Şehir H.'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TURYOL */}
          {aktifSirket === 'turyol' && turyol && (() => {
            const saatler = getSaatler(turyol);
            const sonraki = saatler.find(sa => saatDk(sa) > simdiDk);
            return (
              <View style={s.bolum}>
                <View style={[s.sirketBaslikKutu, { borderLeftColor: turyol.renk }]}>
                  <Text style={[s.sirketAdi, { color: turyol.renk }]}>TURYOL</Text>
                  <Text style={s.sirketAlt}>{turyol.kalkis_yeri} kalkışlı • {turyol.fiyat}</Text>
                </View>
                <View style={s.infoKart}>
                  <Text style={s.infoSatir}>• Kalkış: <Text style={s.infoVurgu}>{turyol.kalkis_yeri} İskelesi</Text></Text>
                  <Text style={s.infoSatir}>• Tarife: <Text style={s.infoVurgu}>
                    {gunTip === 'haftasonu' ? 'Haftasonu' : 'Hafta içi'} — {saatler.length} sefer
                  </Text></Text>
                  {sonraki && (
                    <View style={s.sonrakiKutu}>
                      <Text style={s.sonrakiYazi}>• Sonraki sefer: <Text style={s.sonrakiSaat}>{sonraki}</Text></Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={[s.tumBtn, { borderColor: turyol.renk }]}
                  onPress={() => setSaatModal({ baslik: `TURYOL — ${turyol.kalkis_yeri}`, saatler })}>
                  <Text style={[s.tumBtnYazi, { color: turyol.renk }]}>Tüm sefer saatleri →</Text>
                </TouchableOpacity>
                <Text style={s.kaynak}>Kaynak: {turyol.kaynak} • {turyol.tarife_donemi}</Text>
              </View>
            );
          })()}

          {/* DENTUR */}
          {aktifSirket === 'dentur' && dentur && (() => {
            const saatler = getSaatler(dentur);
            const sonraki = saatler.find(sa => saatDk(sa) > simdiDk);
            return (
              <View style={s.bolum}>
                <View style={[s.sirketBaslikKutu, { borderLeftColor: dentur.renk }]}>
                  <Text style={[s.sirketAdi, { color: dentur.renk }]}>DENTUR AVRASYA</Text>
                  <Text style={s.sirketAlt}>Kabataş & Beşiktaş kalkışlı</Text>
                </View>
                {dentur.kalkis_noktalari?.length > 0 && (
                  <View style={s.durakSatir}>
                    {dentur.kalkis_noktalari.map((d: any) => (
                      <View key={d.durak} style={s.durakKutu}>
                        <Text style={s.durakAdi}>{d.durak}</Text>
                        <Text style={[s.durakFiyat, { color: dentur.renk }]}>{d.fiyat}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={s.infoKart}>
                  <Text style={s.infoSatir}>• Toplam: <Text style={s.infoVurgu}>{saatler.length} sefer</Text></Text>
                  {sonraki && (
                    <View style={s.sonrakiKutu}>
                      <Text style={s.sonrakiYazi}>• Sonraki sefer: <Text style={s.sonrakiSaat}>{sonraki}</Text></Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={[s.tumBtn, { borderColor: dentur.renk }]}
                  onPress={() => setSaatModal({ baslik: 'DENTUR — Kabataş / Beşiktaş', saatler })}>
                  <Text style={[s.tumBtnYazi, { color: dentur.renk }]}>Tüm sefer saatleri →</Text>
                </TouchableOpacity>
                {dentur.ozel_not && (
                  <View style={s.uyariKutu}><Text style={s.uyariYazi}>{dentur.ozel_not}</Text></View>
                )}
                <Text style={s.kaynak}>Kaynak: {dentur.kaynak} • {dentur.tarife_donemi}</Text>
              </View>
            );
          })()}

          {/* ŞEHİR HATLARI */}
          {aktifSirket === 'sehirhatlari' && (
            <View style={s.bolum}>
              <View style={[s.sirketBaslikKutu, { borderLeftColor: '#0077B6' }]}>
                <Text style={[s.sirketAdi, { color: '#0077B6' }]}>ŞEHİR HATLARI</Text>
                <Text style={s.sirketAlt}>Kısa & Uzun Boğaz Turu — Her gün 1 sefer</Text>
              </View>

              {/* Kısa Tur */}
              {shKisa && (
                <View style={s.turKart}>
                  <View style={s.turBaslikSatir}>
                    <Text style={s.turBaslik}>Kısa Boğaz Turu</Text>
                    <Text style={s.turSure}>{shKisa.sure}</Text>
                  </View>
                  {(shKisa.gidis_guzergah || []).map((d: any, i: number) => (
                    <View key={i} style={s.guzergahSatir}>
                      <View style={[s.nokta, { backgroundColor: saatDk(d.saat) <= simdiDk ? '#94A3B8' : '#0096C7' }]} />
                      <Text style={s.guzergahDurak}>{d.durak}</Text>
                      <Text style={[s.guzergahSaat, saatDk(d.saat) <= simdiDk && s.gectiSaat]}>{d.saat}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Uzun Tur */}
              {shUzun && (
                <View style={s.turKart}>
                  <View style={s.turBaslikSatir}>
                    <Text style={s.turBaslik}>Uzun Boğaz Turu</Text>
                    <Text style={s.turSure}>{shUzun.sure}</Text>
                  </View>
                  <Text style={s.turYonBaslik}>→ Gidiş</Text>
                  {(shUzun.gidis_guzergah || []).map((d: any, i: number) => (
                    <View key={i} style={s.guzergahSatir}>
                      <View style={[s.nokta, { backgroundColor: saatDk(d.saat) <= simdiDk ? '#3a4a5a' : '#0077B6' }]} />
                      <Text style={s.guzergahDurak}>{d.durak}</Text>
                      <Text style={[s.guzergahSaat, saatDk(d.saat) <= simdiDk && s.gectiSaat]}>{d.saat}</Text>
                    </View>
                  ))}
                  <View style={s.molaBand}>
                    <Text style={s.molaYazi}>• Anadolu Kavağı'nda mola — 15:00'e kadar</Text>
                  </View>
                  <Text style={s.turYonBaslik}>← Dönüş</Text>
                  {(shUzun.donus_guzergah || []).map((d: any, i: number) => (
                    <View key={i} style={s.guzergahSatir}>
                      <View style={[s.nokta, { backgroundColor: saatDk(d.saat) <= simdiDk ? '#3a4a5a' : '#0077B6' }]} />
                      <Text style={s.guzergahDurak}>{d.durak}</Text>
                      <Text style={[s.guzergahSaat, saatDk(d.saat) <= simdiDk && s.gectiSaat]}>{d.saat}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={s.kaynak}>Kaynak: sehirhatlari.istanbul • {shKisa?.tarife_donemi || ''}</Text>
            </View>
          )}
        </>
      )}

      {/* ADA SEFERLERİ */}
      <View style={s.adaBolum}>
        <Text style={s.adaBaslik}>Ada Seferleri</Text>
        {ADALAR_LINKLERI.map(link => (
          <TouchableOpacity key={link.sirket} style={[s.adaBtn, { borderColor: link.renk }]}
            onPress={() => Linking.openURL(link.url)}>
            <Text style={[s.adaBtnYazi, { color: link.renk }]}>{link.sirket} — Sefer Saatleri →</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />

      {/* Saat Modal */}
      <Modal visible={!!saatModal} transparent animationType="slide" onRequestClose={() => setSaatModal(null)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <Text style={s.modalBaslik}>{saatModal?.baslik}</Text>
            <Text style={s.modalAlt}>{gunTip === 'haftasonu' ? 'Haftasonu tarifesi' : 'Hafta içi tarifesi'}</Text>
            <View style={s.saatGrid}>
              {saatModal?.saatler.map((saat, i) => {
                const gecti = saatDk(saat) <= simdiDk;
                return (
                  <View key={i} style={[s.saatKutu, gecti && s.saatGecti]}>
                    <Text style={[s.saatYazi, gecti && s.saatGectiYazi]}>{saat}</Text>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity style={s.kapatBtn} onPress={() => setSaatModal(null)}>
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
  segKutu: { flexDirection: 'row', margin: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segAktif: { backgroundColor: '#0077B6' },
  segYazi: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  segYaziAktif: { color: '#FFFFFF', fontWeight: '700' },
  bolum: { marginHorizontal: 16 },
  sirketBaslikKutu: { borderLeftWidth: 4, paddingLeft: 12, marginBottom: 14 },
  sirketAdi: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  sirketAlt: { color: '#64748B', fontSize: 12, marginTop: 3 },
  infoKart: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  infoSatir: { color: '#64748B', fontSize: 13, marginBottom: 6 },
  infoVurgu: { color: '#1E293B', fontWeight: '600' },
  sonrakiKutu: { backgroundColor: '#EAF4FB', borderRadius: 8, padding: 10, marginTop: 6, borderLeftWidth: 3, borderLeftColor: '#0096C7' },
  sonrakiYazi: { color: '#64748B', fontSize: 13 },
  sonrakiSaat: { color: '#0077B6', fontWeight: '700', fontSize: 16 },
  tumBtn: { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  tumBtnYazi: { fontSize: 14, fontWeight: '700' },
  uyariKutu: { backgroundColor: '#EAF4FB', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#0077B6' },
  uyariYazi: { color: '#0077B6', fontSize: 11 },
  kaynak: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 16 },
  durakSatir: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  durakKutu: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  durakAdi: { color: '#1E293B', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  durakFiyat: { fontSize: 13, fontWeight: '600' },
  turKart: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  turBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10 },
  turBaslik: { color: '#0077B6', fontSize: 15, fontWeight: '700' },
  turSure: { color: '#64748B', fontSize: 12 },
  turYonBaslik: { color: '#0077B6', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  guzergahSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nokta: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  guzergahDurak: { color: '#1E293B', fontSize: 13, flex: 1 },
  guzergahSaat: { color: '#0077B6', fontSize: 14, fontWeight: '700' },
  gectiSaat: { color: '#94A3B8' },
  molaBand: { backgroundColor: '#EAF4FB', borderRadius: 8, padding: 10, marginVertical: 10, borderLeftWidth: 3, borderLeftColor: '#0077B6' },
  molaYazi: { color: '#0077B6', fontSize: 12 },
  // Modal
  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalBaslik: { color: '#0077B6', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalAlt: { color: '#64748B', fontSize: 12, marginBottom: 16 },
  saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  saatKutu: { backgroundColor: '#F5F7FA', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#0096C7', alignItems: 'center' },
  saatGecti: { borderColor: '#E2E8F0', opacity: 0.45 },
  saatYazi: { color: '#1E293B', fontSize: 15, fontWeight: '600' },
  saatGectiYazi: { color: '#94A3B8' },
  kapatBtn: { backgroundColor: '#0077B6', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 10 },
  kapatYazi: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  // Adalar
  adaBolum: { marginHorizontal: 16, marginTop: 8 },
  adaBaslik: { color: '#0077B6', fontSize: 15, fontWeight: '700', marginBottom: 12, letterSpacing: 1 },
  adaBtn: { borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 10, alignItems: 'center' },
  adaBtnYazi: { fontSize: 14, fontWeight: '600' },
});
