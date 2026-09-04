/*
  Acil Durum Rehberi inline yönetim bileşeni (numara, kurum, faydalı link CRUD).
  Mount yeri: Acil sekmesi (app/(tabs)/acil.tsx), listelerin altında
  <YetkiliBolum baslik="Acil Durum Rehberi" sadeceAdmin> içinde render edilir.
  Eyl 2026: admin paneli kaldırıldı, inline yönetim. Eski kaynak: app/admin-acil.tsx
  Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi
  (hex → token, Poppins, Segmentler/BirincilButon/BosDurum; modal yapısı aynı).
*/
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import { useAdmin } from '../../hooks/use-admin';
import { supabase } from '../../lib/supabase';
import type { AcilKayit } from '../../hooks/use-acil-rehber';
import { useTema } from '../../hooks/use-tema';
import { Font, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, Segmentler } from '../ui/pusula-ui';

const KATEGORILER = [
  { id: 'turizm_polisi', baslik: 'Turizm Polisi' },
  { id: 'acil_numara', baslik: 'Acil Numaralar' },
  { id: 'meslek_kurulusu', baslik: 'Meslek Kuruluşları' },
  { id: 'faydali_link', baslik: 'Faydalı Linkler' },
];

type Kategori = 'turizm_polisi' | 'acil_numara' | 'meslek_kurulusu' | 'faydali_link';

export function AcilRehberYonetim() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();
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
      Alert.alert('Hata', 'İsim boş olamaz.');
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
        Alert.alert('Başarılı', `${formIsim.trim()} eklendi.`);
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
        Alert.alert('Başarılı', `${formIsim.trim()} güncellendi.`);
        setModalAcik(false);
        veriCek();
      }
    }
  };

  const sil = () => {
    if (!secili) return;
    Alert.alert('Kaydı Sil', `"${secili.isim}" silinecek. Emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          const { error } = await supabase
            .from('acil_rehber')
            .update({ aktif: false })
            .eq('id', secili.id);
          if (error) {
            Alert.alert('Hata', error.message);
          } else {
            Alert.alert('Silindi', `${secili.isim} kaldırıldı.`);
            setModalAcik(false);
            veriCek();
          }
        },
      },
    ]);
  };

  const linkKategorisi = sekme === 'faydali_link';

  return (
    <View style={s.kutu}>
      {/* Sekmeler (iç içe scroll yasak: sarmalanan satır) */}
      <View style={s.sekmeContainer}>
        <Segmentler secenekler={KATEGORILER} aktif={sekme} onSec={id => setSekme(id as Kategori)} />
      </View>

      <View style={s.liste}>
        {/* Yeni Ekle */}
        <BirincilButon
          baslik={`+ Yeni ${linkKategorisi ? 'Link' : 'Numara'} Ekle`}
          onPress={yeniAc}
          varyant="cta"
          style={s.yeniEkleBtn}
        />

        {yukleniyor ? (
          <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 20 }} />
        ) : kayitlar.length === 0 ? (
          <BosDurum metin="Bu kategoride kayıt bulunamadı." />
        ) : (
          kayitlar.map(k => (
            <TouchableOpacity key={k.id} style={s.kartKutu} onPress={() => duzenleAc(k)} activeOpacity={0.7}>
              <View style={[s.kartRenk, { backgroundColor: linkKategorisi ? t.secondary : t.primary }]} />
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
      </View>

      {/* Duzenleme / Ekleme Modali */}
      <Modal visible={modalAcik} transparent animationType="slide" onRequestClose={() => setModalAcik(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>{yeniModu ? `Yeni ${linkKategorisi ? 'Link' : 'Kayıt'} Ekle` : secili?.isim}</Text>
              <Text style={s.modalAlt}>{KATEGORILER.find(k => k.id === sekme)?.baslik}</Text>

              <View style={s.inputGrup}>
                <Text style={s.inputLabel}>İsim *</Text>
                <TextInput style={s.input} value={formIsim} onChangeText={setFormIsim} placeholder="Örnek: Ambulans" placeholderTextColor={t.textMuted} />
              </View>

              {!linkKategorisi && (
                <View style={s.satirKutu}>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Numara</Text>
                    <TextInput style={s.input} value={formNumara} onChangeText={setFormNumara} placeholder="02125274503" keyboardType="phone-pad" placeholderTextColor={t.textMuted} />
                  </View>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Görüntü</Text>
                    <TextInput style={s.input} value={formGoruntu} onChangeText={setFormGoruntu} placeholder="0212 527 45 03" placeholderTextColor={t.textMuted} />
                  </View>
                </View>
              )}

              {linkKategorisi && (
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>URL</Text>
                  <TextInput style={s.input} value={formUrl} onChangeText={setFormUrl} placeholder="https://..." autoCapitalize="none" placeholderTextColor={t.textMuted} />
                </View>
              )}

              <View style={s.satirKutu}>
                <View style={[s.inputGrup, { flex: 2 }]}>
                  <Text style={s.inputLabel}>Açıklama</Text>
                  <TextInput style={s.input} value={formAciklama} onChangeText={setFormAciklama} placeholder="Kısa açıklama..." placeholderTextColor={t.textMuted} />
                </View>
                <View style={[s.inputGrup, { flex: 1 }]}>
                  <Text style={s.inputLabel}>Sira</Text>
                  <TextInput style={s.input} value={formSira} onChangeText={setFormSira} placeholder="1" keyboardType="numeric" placeholderTextColor={t.textMuted} />
                </View>
              </View>

              <BirincilButon baslik="Kaydet" onPress={kaydet} varyant="kobalt" style={s.kaydetBtn} />

              {!yeniModu && (
                <BirincilButon baslik="Kaydı Kaldır" onPress={sil} varyant="tehlike" style={s.silBtn} />
              )}

              <BirincilButon baslik="İptal" onPress={() => setModalAcik(false)} varyant="hayalet" style={s.iptalBtn} />

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  kutu: { paddingBottom: 8 },

  // Sekmeler (Segmentler sarmalayıcısı)
  sekmeContainer: { paddingHorizontal: 16, paddingTop: 12 },

  liste: { paddingHorizontal: 16, marginTop: 12 },

  kartKutu: { backgroundColor: t.bgCard, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: t.kartBorder, minHeight: 44 },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartBilgi: { flex: 1, padding: 14 },
  kartIsim: { fontFamily: Font.bold, fontSize: 14, color: t.text, letterSpacing: -0.3 },
  kartAlt: { fontFamily: Font.semibold, fontSize: 12, color: t.primary, marginTop: 3 },
  kartAciklama: { fontFamily: Font.regular, fontSize: 11, color: t.textSecondary, marginTop: 2 },
  kartSira: { fontFamily: Font.regular, color: t.textMuted, fontSize: 11, marginRight: 8 },
  kartOk: { fontFamily: Font.regular, color: t.textMuted, fontSize: 20, marginRight: 16 },

  // Yeni ekle (BirincilButon cta)
  yeniEkleBtn: { marginBottom: 10 },

  // Modal (mevcut yapı; sadece renk/tipografi)
  modalArka: { flex: 1, backgroundColor: t.modalOverlay, justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: t.modalBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  modalBaslik: { fontFamily: Font.extrabold, color: t.text, fontSize: 20, letterSpacing: -0.3 },
  modalAlt: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 12, marginBottom: 16 },
  satirKutu: { flexDirection: 'row', gap: 10, marginTop: 8 },
  inputGrup: { flex: 1, marginTop: 8 },
  inputLabel: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 11, marginBottom: 4 },
  input: { minHeight: 48, backgroundColor: t.bgInput, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder },
  kaydetBtn: { marginTop: 20 },
  silBtn: { marginTop: 10 },
  iptalBtn: { marginTop: 10 },
});
