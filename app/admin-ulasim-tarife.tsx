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
import type { HavalimaniSefer } from '../hooks/use-ulasim-tarife';
import type { BogazTuru } from '../hooks/use-bogaz-turlari';

type Sekme = 'havaist' | 'havabus' | 'bogaz';

export default function AdminUlasimTarife() {
  const insets = useSafeAreaInsets();
  const { isYetkili, yukleniyor: adminYukleniyor } = useAdmin();
  const [sekme, setSekme] = useState<Sekme>('havaist');
  const [seferler, setSeferler] = useState<HavalimaniSefer[]>([]);
  const [bogazTurlar, setBogazTurlar] = useState<BogazTuru[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Duzenleme modali
  const [seferModal, setSeferModal] = useState(false);
  const [seciliSefer, setSeciliSefer] = useState<HavalimaniSefer | null>(null);
  const [sehirdenHavStr, setSehirdenHavStr] = useState('');
  const [havdanSehirStr, setHavdanSehirStr] = useState('');
  const [fiyatForm, setFiyatForm] = useState('');
  const [sureForm, setSureForm] = useState('');

  // Bogaz duzenleme
  const [bogazModal, setBogazModal] = useState(false);
  const [seciliTur, setSeciliTur] = useState<BogazTuru | null>(null);
  const [bogazSaatlerStr, setBogazSaatlerStr] = useState('');
  const [bogazFiyatForm, setBogazFiyatForm] = useState('');

  // Yeni ekleme modlari
  const [yeniSeferModu, setYeniSeferModu] = useState(false);
  const [yeniSeferAdi, setYeniSeferAdi] = useState('');
  const [yeniSeferHavalimani, setYeniSeferHavalimani] = useState('IST');
  const [yeniBogazModu, setYeniBogazModu] = useState(false);
  const [yeniBogazSirket, setYeniBogazSirket] = useState('');
  const [yeniBogazSirketId, setYeniBogazSirketId] = useState('');
  const [yeniBogazTurTipi, setYeniBogazTurTipi] = useState('standart');
  const [yeniBogazRenk, setYeniBogazRenk] = useState('#0077B6');
  const [yeniBogazSure, setYeniBogazSure] = useState('');

  const veriCek = async () => {
    setYukleniyor(true);
    if (sekme === 'bogaz') {
      const { data } = await supabase.from('bogaz_turlari').select('*').eq('aktif', true).order('sirket_id');
      setBogazTurlar((data as BogazTuru[]) || []);
    } else {
      const firma = sekme === 'havaist' ? 'havaist' : 'havabus';
      const { data } = await supabase.from('havalimani_seferleri').select('*').eq('firma', firma).eq('aktif', true).order('durak_adi');
      setSeferler((data as HavalimaniSefer[]) || []);
    }
    setYukleniyor(false);
  };

  useEffect(() => { if (isYetkili) veriCek(); }, [sekme, isYetkili]);

  const yeniSeferAc = () => {
    setYeniSeferModu(true);
    setSeciliSefer(null);
    setYeniSeferAdi('');
    setYeniSeferHavalimani(sekme === 'havaist' ? 'IST' : 'SAW');
    setSehirdenHavStr('');
    setHavdanSehirStr('');
    setFiyatForm('');
    setSureForm('');
    setSeferModal(true);
  };

  const yeniBogazAc = () => {
    setYeniBogazModu(true);
    setSeciliTur(null);
    setYeniBogazSirket('');
    setYeniBogazSirketId('');
    setYeniBogazTurTipi('standart');
    setYeniBogazRenk('#0077B6');
    setYeniBogazSure('');
    setBogazSaatlerStr('');
    setBogazFiyatForm('');
    setBogazModal(true);
  };

  const seferDuzenleAc = (s: HavalimaniSefer) => {
    setYeniSeferModu(false);
    setSeciliSefer(s);
    setSehirdenHavStr((s.sehirden_hav || []).join(', '));
    setHavdanSehirStr((s.havdan_sehir || []).join(', '));
    setFiyatForm(s.fiyat || '');
    setSureForm(s.sure || '');
    setSeferModal(true);
  };

  const seferKaydet = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const saatParse = (str: string) => str.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s));
    const yeniSehirden = saatParse(sehirdenHavStr);
    const yeniHavdan = saatParse(havdanSehirStr);

    if (yeniSeferModu) {
      if (!yeniSeferAdi.trim()) {
        Alert.alert('Hata', 'Durak adi bos olamaz.');
        return;
      }
      const durakId = yeniSeferAdi.trim().toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '_').replace(/_+/g, '_');
      const { error } = await supabase.from('havalimani_seferleri').insert({
        firma: sekme === 'havaist' ? 'havaist' : 'havabus',
        havalimani: yeniSeferHavalimani,
        durak_id: durakId,
        durak_adi: yeniSeferAdi.trim(),
        sehirden_hav: yeniSehirden,
        havdan_sehir: yeniHavdan,
        fiyat: fiyatForm || null,
        sure: sureForm || null,
        aktif: true,
        guncelleme_tarihi: new Date().toISOString(),
        guncelleyen: user?.id,
      });

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Basarili', `${yeniSeferAdi.trim()} eklendi.`);
        setSeferModal(false);
        veriCek();
      }
    } else {
      if (!seciliSefer) return;
      if (yeniSehirden.length === 0 && yeniHavdan.length === 0) {
        Alert.alert('Hata', 'En az bir sefer saati girilmeli. Format: 08:00, 09:30, 10:00');
        return;
      }

      const { error } = await supabase
        .from('havalimani_seferleri')
        .update({
          sehirden_hav: yeniSehirden,
          havdan_sehir: yeniHavdan,
          fiyat: fiyatForm || null,
          sure: sureForm || null,
          guncelleme_tarihi: new Date().toISOString(),
          guncelleyen: user?.id,
        })
        .eq('id', seciliSefer.id);

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Basarili', `${seciliSefer.durak_adi} seferleri guncellendi.`);
        setSeferModal(false);
        veriCek();
      }
    }
  };

  const bogazDuzenleAc = (t: BogazTuru) => {
    setYeniBogazModu(false);
    setSeciliTur(t);
    setBogazSaatlerStr((t.hafta_ici_saatler || []).join(', '));
    setBogazFiyatForm(t.fiyat || '');
    setBogazModal(true);
  };

  const bogazKaydet = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const saatParse = (str: string) => str.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s));
    const yeniSaatler = saatParse(bogazSaatlerStr);

    if (yeniBogazModu) {
      if (!yeniBogazSirket.trim()) {
        Alert.alert('Hata', 'Sirket adi bos olamaz.');
        return;
      }
      const sirketId = yeniBogazSirketId.trim() || yeniBogazSirket.trim().toLowerCase().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      const { error } = await supabase.from('bogaz_turlari').insert({
        sirket_id: sirketId,
        sirket_adi: yeniBogazSirket.trim(),
        renk: yeniBogazRenk,
        tur_tipi: yeniBogazTurTipi,
        fiyat: bogazFiyatForm || null,
        sure: yeniBogazSure || null,
        hafta_ici_saatler: yeniSaatler,
        hafta_sonu_saatler: yeniSaatler,
        gidis_guzergah: [],
        donus_guzergah: [],
        kalkis_noktalari: [],
        aktif: true,
        aktif_mevsim: 'kis',
        guncelleme_tarihi: new Date().toISOString(),
        guncelleyen: user?.id,
      });

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Basarili', `${yeniBogazSirket.trim()} eklendi.`);
        setBogazModal(false);
        veriCek();
      }
    } else {
      if (!seciliTur) return;
      const { error } = await supabase
        .from('bogaz_turlari')
        .update({
          hafta_ici_saatler: yeniSaatler,
          hafta_sonu_saatler: yeniSaatler,
          fiyat: bogazFiyatForm || null,
          guncelleme_tarihi: new Date().toISOString(),
          guncelleyen: user?.id,
        })
        .eq('id', seciliTur.id);

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Basarili', `${seciliTur.sirket_adi} turlari guncellendi.`);
        setBogazModal(false);
        veriCek();
      }
    }
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

  return (
    <View style={s.container}>
      <LinearGradient colors={['#005A8D','#0077B6','#0096C7']} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Geri</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Ulasim Tarifeleri</Text>
        <Text style={s.headerAlt}>Havalimani seferleri ve bogaz turlari</Text>
      </LinearGradient>

      {/* Sekmeler */}
      <View style={s.sekmeKutu}>
        {[
          { id: 'havaist' as Sekme, label: 'HAVAiST' },
          { id: 'havabus' as Sekme, label: 'HAVABUS' },
          { id: 'bogaz' as Sekme, label: 'Bogaz Turlari' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={[s.sekmeBtn, sekme === t.id && s.sekmeBtnAktif]}
            onPress={() => setSekme(t.id)}>
            <Text style={[s.sekmeYazi, sekme === t.id && s.sekmeYaziAktif]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.liste} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Yeni Ekle Butonu */}
        <TouchableOpacity style={s.yeniEkleBtn} onPress={sekme === 'bogaz' ? yeniBogazAc : yeniSeferAc} activeOpacity={0.7}>
          <Text style={s.yeniEklePlus}>+</Text>
          <Text style={s.yeniEkleYazi}>{sekme === 'bogaz' ? 'Yeni Bogaz Turu Ekle' : 'Yeni Guzergah Ekle'}</Text>
        </TouchableOpacity>

        {yukleniyor ? (
          <ActivityIndicator size="large" color="#0077B6" style={{ marginTop: 40 }} />
        ) : sekme === 'bogaz' ? (
          /* BOGAZ TURLARI */
          bogazTurlar.length === 0 ? (
            <Text style={s.bosYazi}>Bogaz turu bulunamadi.</Text>
          ) : (
            bogazTurlar.map(t => (
              <TouchableOpacity key={t.id} style={s.kartKutu} onPress={() => bogazDuzenleAc(t)} activeOpacity={0.7}>
                <View style={[s.kartRenk, { backgroundColor: t.renk }]} />
                <View style={s.kartBilgi}>
                  <Text style={s.kartIsim}>{t.sirket_adi}</Text>
                  <Text style={s.kartAlt}>
                    {t.tur_tipi === 'standart' ? (t.kalkis_yeri || 'Coklu kalkis') : `${t.tur_tipi} tur`}
                    {t.fiyat ? ` — ${t.fiyat}` : ''}
                  </Text>
                  <Text style={s.kartSaat}>
                    {t.hafta_ici_saatler?.length || 0} sefer
                    {t.tarife_donemi ? ` (${t.tarife_donemi})` : ''}
                  </Text>
                </View>
                <Text style={s.kartOk}>{'>'}</Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          /* HAVALİMANI SEFERLERİ */
          seferler.length === 0 ? (
            <Text style={s.bosYazi}>Sefer bulunamadi.</Text>
          ) : (
            seferler.map(sf => (
              <TouchableOpacity key={sf.id} style={s.kartKutu} onPress={() => seferDuzenleAc(sf)} activeOpacity={0.7}>
                <View style={[s.kartRenk, { backgroundColor: '#0077B6' }]} />
                <View style={s.kartBilgi}>
                  <Text style={s.kartIsim}>{sf.durak_adi}</Text>
                  <Text style={s.kartAlt}>
                    {sf.not_bilgi || sf.havalimani}
                    {sf.fiyat ? ` — ${sf.fiyat}` : ''}
                    {sf.sure ? ` (${sf.sure})` : ''}
                  </Text>
                  <Text style={s.kartSaat}>
                    Sehir→Hav: {sf.sehirden_hav?.length || 0} sefer / Hav→Sehir: {sf.havdan_sehir?.length || 0} sefer
                  </Text>
                  {sf.tarife_donemi && <Text style={s.kartDonemi}>Tarife: {sf.tarife_donemi}</Text>}
                </View>
                <Text style={s.kartOk}>{'>'}</Text>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>

      {/* Sefer Duzenleme Modali */}
      <Modal visible={seferModal} transparent animationType="slide" onRequestClose={() => setSeferModal(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>{yeniSeferModu ? 'Yeni Guzergah Ekle' : seciliSefer?.durak_adi}</Text>
              <Text style={s.modalAlt}>{yeniSeferModu ? (sekme === 'havaist' ? 'HAVAiST' : 'HAVABUS') : `${seciliSefer?.firma?.toUpperCase()} — ${seciliSefer?.havalimani}`}</Text>

              {yeniSeferModu && (
                <>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Durak Adi *</Text>
                    <TextInput style={s.input} value={yeniSeferAdi} onChangeText={setYeniSeferAdi} placeholder="Ornek: Taksim" />
                  </View>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Havalimani</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {['IST', 'SAW'].map(h => (
                        <TouchableOpacity key={h}
                          style={[s.havSecBtn, yeniSeferHavalimani === h && s.havSecBtnAktif]}
                          onPress={() => setYeniSeferHavalimani(h)}>
                          <Text style={[s.havSecYazi, yeniSeferHavalimani === h && s.havSecYaziAktif]}>
                            {h === 'IST' ? 'Istanbul (IST)' : 'Sabiha Gokcen (SAW)'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {(yeniSeferModu || seciliSefer?.fiyat !== undefined) && (
                <View style={s.satirKutu}>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Fiyat</Text>
                    <TextInput style={s.input} value={fiyatForm} onChangeText={setFiyatForm} placeholder="440 TL" />
                  </View>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Sure</Text>
                    <TextInput style={s.input} value={sureForm} onChangeText={setSureForm} placeholder="~90 dk" />
                  </View>
                </View>
              )}

              <Text style={s.bolumBaslik}>
                Sehir → Havalimani ({sehirdenHavStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <Text style={s.ipucu}>Saatleri virgul ile ayirin: 08:00, 09:30, 10:00</Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={sehirdenHavStr}
                onChangeText={setSehirdenHavStr} multiline placeholder="08:00, 09:00, 10:00..." />

              <Text style={s.bolumBaslik}>
                Havalimani → Sehir ({havdanSehirStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={havdanSehirStr}
                onChangeText={setHavdanSehirStr} multiline placeholder="08:00, 09:00, 10:00..." />

              <TouchableOpacity style={s.kaydetBtn} onPress={seferKaydet}>
                <Text style={s.kaydetBtnYazi}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.iptalBtn} onPress={() => setSeferModal(false)}>
                <Text style={s.iptalBtnYazi}>Iptal</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bogaz Duzenleme Modali */}
      <Modal visible={bogazModal} transparent animationType="slide" onRequestClose={() => setBogazModal(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>{yeniBogazModu ? 'Yeni Bogaz Turu Ekle' : seciliTur?.sirket_adi}</Text>
              <Text style={s.modalAlt}>{yeniBogazModu ? 'Bogaz Turlari' : `${seciliTur?.tur_tipi} tur — ${seciliTur?.tarife_donemi}`}</Text>

              {yeniBogazModu && (
                <>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Sirket Adi *</Text>
                    <TextInput style={s.input} value={yeniBogazSirket} onChangeText={setYeniBogazSirket} placeholder="Ornek: Dentur Avrasya" />
                  </View>
                  <View style={s.satirKutu}>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Tur Tipi</Text>
                      <TextInput style={s.input} value={yeniBogazTurTipi} onChangeText={setYeniBogazTurTipi} placeholder="standart/uzun" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Sure</Text>
                      <TextInput style={s.input} value={yeniBogazSure} onChangeText={setYeniBogazSure} placeholder="~2 saat" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Renk</Text>
                      <TextInput style={s.input} value={yeniBogazRenk} onChangeText={setYeniBogazRenk} placeholder="#0077B6" />
                    </View>
                  </View>
                </>
              )}

              <View style={{ marginTop: 12 }}>
                <Text style={s.inputLabel}>Fiyat</Text>
                <TextInput style={s.input} value={bogazFiyatForm} onChangeText={setBogazFiyatForm} placeholder="300 TL" />
              </View>

              <Text style={s.bolumBaslik}>
                Sefer Saatleri ({bogazSaatlerStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <Text style={s.ipucu}>Saatleri virgul ile ayirin: 10:00, 11:00, 12:00</Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={bogazSaatlerStr}
                onChangeText={setBogazSaatlerStr} multiline placeholder="10:00, 11:00, 12:00..." />

              <TouchableOpacity style={s.kaydetBtn} onPress={bogazKaydet}>
                <Text style={s.kaydetBtnYazi}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.iptalBtn} onPress={() => setBogazModal(false)}>
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

  sekmeKutu: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: '#FFF', borderRadius: 10, padding: 4 },
  sekmeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  sekmeBtnAktif: { backgroundColor: '#0077B6' },
  sekmeYazi: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  sekmeYaziAktif: { color: '#FFF', fontWeight: '700' },

  liste: { flex: 1, paddingHorizontal: 16 },
  bosYazi: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },

  kartKutu: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartBilgi: { flex: 1, padding: 14 },
  kartIsim: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  kartAlt: { fontSize: 12, color: '#64748B', marginTop: 3 },
  kartSaat: { fontSize: 11, color: '#0096C7', marginTop: 3 },
  kartDonemi: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  kartOk: { color: '#94A3B8', fontSize: 20, marginRight: 16 },

  // Modal
  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalBaslik: { color: '#0077B6', fontSize: 20, fontWeight: '800' },
  modalAlt: { color: '#64748B', fontSize: 12, marginBottom: 8 },
  bolumBaslik: { color: '#1E293B', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  ipucu: { color: '#94A3B8', fontSize: 11, marginBottom: 6 },
  satirKutu: { flexDirection: 'row', gap: 10, marginTop: 8 },
  inputGrup: { flex: 1 },
  inputLabel: { color: '#64748B', fontSize: 11, marginBottom: 4 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
  inputCokSatir: { marginTop: 4, minHeight: 80, textAlignVertical: 'top' },
  kaydetBtn: { backgroundColor: '#0077B6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  kaydetBtnYazi: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  iptalBtn: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  iptalBtnYazi: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // Yeni ekle
  yeniEkleBtn: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, padding: 14, borderWidth: 1.5, borderColor: '#0077B6', borderStyle: 'dashed' },
  yeniEklePlus: { color: '#0077B6', fontSize: 22, fontWeight: '700', marginRight: 8 },
  yeniEkleYazi: { color: '#0077B6', fontSize: 14, fontWeight: '700' },
  havSecBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#E2E8F0', alignItems: 'center' },
  havSecBtnAktif: { backgroundColor: '#0077B6' },
  havSecYazi: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  havSecYaziAktif: { color: '#FFF' },
});
