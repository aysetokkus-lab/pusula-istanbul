import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';
import type { AcilKayit } from '../hooks/use-acil-rehber';

const KATEGORILER = [
  { id: 'turizm_polisi', baslik: 'Turizm Polisi' },
  { id: 'acil_numara', baslik: 'Acil Numaralar' },
  { id: 'meslek_kurulusu', baslik: 'Meslek Kuruluslari' },
  { id: 'faydali_link', baslik: 'Faydali Linkler' },
];

type Kategori = 'turizm_polisi' | 'acil_numara' | 'meslek_kurulusu' | 'faydali_link';

export default function AdminAcil() {
  const insets = useSafeAreaInsets();
  const { isYetkili, yukleniyor: adminYukleniyor } = useAdmin();
  const [sekme, setSekme] = useState<Kategori>('acil_numara');
  const [kayitlar, setKayitlar] = useState<AcilKayit[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Modal
  const [modalAcik, setModalAcik] = useState(false);
  const [yeniModu, setYeniModu] = useState(false);
  const [secili, setSecili] = useState<AcilKayit | null>(null);

  // Form
  const [formIsim, setFormIsim] = useState('');
  const [formNumara, setFormNumara] = useState('');
  const [formGoruntu, setFormGoruntu] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAciklama, setFormAciklama] = useState('');
  const [formSira, setFormSira] = useState('0');

  const veriCek = async () => {
    setYukleniyor(true);
    const { data } = await supabase
      .from('acil_rehber')
      .select('*')
      .eq('kategori', sekme)
      .order('sira');
    setKayitlar((data as AcilKayit[]) || []);
    setYukleniyor(false);
  };

  useEffect(() => { if (isYetkili) veriCek(); }, [sekme, isYetkili]);

  const yeniAc = () => {
    setYeniModu(true);
    setSecili(null);
    setFormIsim('');
    setFormNumara('');
    setFormGoruntu('');
    setFormUrl('');
    setFormAciklama('');
    setFormSira(String((kayitlar.length + 1)));
    setModalAcik(true);
  };

  const duzenleAc = (k: AcilKayit) => {
    setYeniModu(false);
    setSecili(k);
    setFormIsim(k.isim);
    setFormNumara(k.numara || '');
    setFormGoruntu(k.goruntu || '');
    setFormUrl(k.url || '');
    setFormAciklama(k.aciklama || '');
    setFormSira(String(k.sira));
    setModalAcik(true);
  };

  const kaydet = async () => {
    if (!formIsim.trim()) {
      Alert.alert('Hata', 'Isim bos olamaz.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const veri = {
      isim: formIsim.trim(),
      numara: formNumara.trim() || null,
      goruntu: formGoruntu.trim() || null,
      url: formUrl.trim() || null,
      aciklama: formAciklama.trim() || null,
      sira: parseInt(formSira) || 0,
      guncelleme_tarihi: new Date().toISOString(),
      guncelleyen: user?.id,
    };

    if (yeniModu) {
      const { error } = await supabase.from('acil_rehber').insert({
        ...veri,
        kategori: sekme,
        aktif: true,
      });
      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Basarili', `${formIsim.trim()} eklendi.`);
        setModalAcik(false);
        veriCek();
      }
    } else {
      if (!secili) return;
      const { error } = await supabase
        .from('acil_rehber')
        .update(veri)
        .eq('id', secili.id);
      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Basarili', `${formIsim.trim()} guncellendi.`);
        setModalAcik(false);
        veriCek();
      }
    }
  };

  const sil = () => {
    if (!secili) return;
    Alert.alert('Kaydi Sil', `"${secili.isim}" silinecek. Emin misiniz?`, [
      { text: 'Iptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          const { error } = await supabase
            .from('acil_rehber')
            .update({ aktif: false })
            .eq('id', secili.id);
          if (error) {
            Alert.alert('Hata', error.message);
          } else {
            Alert.alert('Silindi', `${secili.isim} kaldirildi.`);
            setModalAcik(false);
            veriCek();
          }
        },
      },
    ]);
  };

  if (adminYukleniyor) {
    return <View style={s.yukle}><ActivityIndicator size="large" color="#0077B6" /></View>;
  }
  if (!isYetkili) {
    return (
      <View style={s.yukle}>
        <Text style={s.yetkisiz}>Erisim Engellendi</Text>
        <TouchableOpacity style={s.geriBtn} onPress={() => router.back()}>
          <Text style={s.geriBtnYazi}>Geri Don</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const linkKategorisi = sekme === 'faydali_link';

  return (
    <View style={s.container}>
      <LinearGradient colors={['#005A8D','#0077B6','#0096C7']} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Geri</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Acil Durum Yonetimi</Text>
        <Text style={s.headerAlt}>Numara, kurum ve link yonetimi</Text>
      </LinearGradient>

      {/* Sekmeler */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sekmeScroll} contentContainerStyle={s.sekmeContainer}>
        {KATEGORILER.map(k => (
          <TouchableOpacity key={k.id} style={[s.sekmeBtn, sekme === k.id && s.sekmeBtnAktif]}
            onPress={() => setSekme(k.id as Kategori)}>
            <Text style={[s.sekmeYazi, sekme === k.id && s.sekmeYaziAktif]}>{k.baslik}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.liste} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Yeni Ekle */}
        <TouchableOpacity style={s.yeniEkleBtn} onPress={yeniAc} activeOpacity={0.7}>
          <Text style={s.yeniEklePlus}>+</Text>
          <Text style={s.yeniEkleYazi}>Yeni {linkKategorisi ? 'Link' : 'Numara'} Ekle</Text>
        </TouchableOpacity>

        {yukleniyor ? (
          <ActivityIndicator size="large" color="#0077B6" style={{ marginTop: 40 }} />
        ) : kayitlar.length === 0 ? (
          <Text style={s.bosYazi}>Bu kategoride kayit bulunamadi.</Text>
        ) : (
          kayitlar.map(k => (
            <TouchableOpacity key={k.id} style={s.kartKutu} onPress={() => duzenleAc(k)} activeOpacity={0.7}>
              <View style={[s.kartRenk, { backgroundColor: linkKategorisi ? '#48CAE4' : '#0077B6' }]} />
              <View style={s.kartBilgi}>
                <Text style={s.kartIsim}>{k.isim}</Text>
                {k.numara && <Text style={s.kartAlt}>{k.goruntu || k.numara}</Text>}
                {k.url && <Text style={s.kartAlt} numberOfLines={1}>{k.url}</Text>}
                {k.aciklama && <Text style={s.kartAciklama}>{k.aciklama}</Text>}
              </View>
              <Text style={s.kartSira}>#{k.sira}</Text>
              <Text style={s.kartOk}>{'>'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Duzenleme / Ekleme Modali */}
      <Modal visible={modalAcik} transparent animationType="slide" onRequestClose={() => setModalAcik(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>{yeniModu ? `Yeni ${linkKategorisi ? 'Link' : 'Kayit'} Ekle` : secili?.isim}</Text>
              <Text style={s.modalAlt}>{KATEGORILER.find(k => k.id === sekme)?.baslik}</Text>

              <View style={s.inputGrup}>
                <Text style={s.inputLabel}>Isim *</Text>
                <TextInput style={s.input} value={formIsim} onChangeText={setFormIsim} placeholder="Ornek: Ambulans" />
              </View>

              {!linkKategorisi && (
                <View style={s.satirKutu}>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Numara</Text>
                    <TextInput style={s.input} value={formNumara} onChangeText={setFormNumara} placeholder="02125274503" keyboardType="phone-pad" />
                  </View>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Goruntu</Text>
                    <TextInput style={s.input} value={formGoruntu} onChangeText={setFormGoruntu} placeholder="0212 527 45 03" />
                  </View>
                </View>
              )}

              {linkKategorisi && (
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>URL</Text>
                  <TextInput style={s.input} value={formUrl} onChangeText={setFormUrl} placeholder="https://..." autoCapitalize="none" />
                </View>
              )}

              <View style={s.satirKutu}>
                <View style={[s.inputGrup, { flex: 2 }]}>
                  <Text style={s.inputLabel}>Aciklama</Text>
                  <TextInput style={s.input} value={formAciklama} onChangeText={setFormAciklama} placeholder="Kisa aciklama..." />
                </View>
                <View style={[s.inputGrup, { flex: 1 }]}>
                  <Text style={s.inputLabel}>Sira</Text>
                  <TextInput style={s.input} value={formSira} onChangeText={setFormSira} placeholder="1" keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity style={s.kaydetBtn} onPress={kaydet}>
                <Text style={s.kaydetBtnYazi}>Kaydet</Text>
              </TouchableOpacity>

              {!yeniModu && (
                <TouchableOpacity style={s.silBtn} onPress={sil}>
                  <Text style={s.silBtnYazi}>Kaydi Kaldir</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.iptalBtn} onPress={() => setModalAcik(false)}>
                <Text style={s.iptalBtnYazi}>Iptal</Text>
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  yukle: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  yetkisiz: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  geriBtn: { backgroundColor: '#0077B6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  geriBtnYazi: { color: '#FFF', fontWeight: '700' },

  header: { paddingBottom: 16, paddingHorizontal: 16 },
  geriTus: { marginBottom: 8 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  sekmeScroll: { maxHeight: 48, marginTop: 12 },
  sekmeContainer: { paddingHorizontal: 16, gap: 8 },
  sekmeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#E2E8F0' },
  sekmeBtnAktif: { backgroundColor: '#0077B6' },
  sekmeYazi: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  sekmeYaziAktif: { color: '#FFF' },

  liste: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  bosYazi: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },

  kartKutu: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartBilgi: { flex: 1, padding: 14 },
  kartIsim: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  kartAlt: { fontSize: 12, color: '#0077B6', marginTop: 3, fontWeight: '500' },
  kartAciklama: { fontSize: 11, color: '#64748B', marginTop: 2 },
  kartSira: { color: '#94A3B8', fontSize: 11, marginRight: 8 },
  kartOk: { color: '#94A3B8', fontSize: 20, marginRight: 16 },

  yeniEkleBtn: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, padding: 14, borderWidth: 1.5, borderColor: '#0077B6', borderStyle: 'dashed' },
  yeniEklePlus: { color: '#0077B6', fontSize: 22, fontWeight: '700', marginRight: 8 },
  yeniEkleYazi: { color: '#0077B6', fontSize: 14, fontWeight: '700' },

  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalBaslik: { color: '#0077B6', fontSize: 20, fontWeight: '800' },
  modalAlt: { color: '#64748B', fontSize: 12, marginBottom: 16 },
  satirKutu: { flexDirection: 'row', gap: 10, marginTop: 8 },
  inputGrup: { flex: 1, marginTop: 8 },
  inputLabel: { color: '#64748B', fontSize: 11, marginBottom: 4 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
  kaydetBtn: { backgroundColor: '#0077B6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  kaydetBtnYazi: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  silBtn: { backgroundColor: '#D62828', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  silBtnYazi: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  iptalBtn: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  iptalBtnYazi: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
