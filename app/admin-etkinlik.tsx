import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';
import { TarihSaatSecici } from '../components/tarih-saat-secici';
import { useTema } from '../hooks/use-tema';
import type { TemaRenkleri } from '../constants/theme';

interface Etkinlik {
  id: string;
  baslik: string;
  aciklama: string;
  tarih: string;
  bitis_tarih?: string;
  konum: string;
  etki: string;
  etkilenen_yollar: string;
  tip: string;
  aktif: boolean;
}

const TIP_SECENEKLERI = [
  { value: 'maraton', label: 'Maraton' },
  { value: 'yuruyus', label: 'Yürüyüş' },
  { value: 'bisiklet', label: 'Bisiklet' },
  { value: 'diplomatik', label: 'Diplomatik' },
  { value: 'miting', label: 'Miting' },
  { value: 'festival', label: 'Festival' },
  { value: 'resmi_toren', label: 'Resmi Tören' },
  { value: 'diger', label: 'Diğer' },
];

const ETKI_SECENEKLERI = [
  { value: 'yol_kapanma', label: 'Yol Kapanma' },
  { value: 'kopru_kapanma', label: 'Köprü Kapanma' },
  { value: 'trafik', label: 'Trafik' },
  { value: 'gezi_kisitlama', label: 'Gezi Kısıtlama' },
  { value: 'diger', label: 'Diğer' },
];

const BOS_FORM = {
  baslik: '', aciklama: '', tarih: '', bitis_tarih: '', konum: '',
  etki: 'diger', etkilenen_yollar: '', tip: 'diger', aktif: true,
};

export default function AdminEtkinlik() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili, yukleniyor: adminYukleniyor } = useAdmin();

  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Etkinlik | null>(null);
  const [form, setForm] = useState(BOS_FORM);
  const [kaydediyor, setKaydediyor] = useState(false);

  const cek = useCallback(async () => {
    const { data } = await supabase
      .from('etkinlikler')
      .select('*')
      .order('tarih', { ascending: false })
      .limit(50);
    if (data) setEtkinlikler(data);
    setYukleniyor(false);
    setYenileniyor(false);
  }, []);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const yeniEkle = () => {
    setDuzenlenen(null);
    setForm(BOS_FORM);
    setModalAcik(true);
  };

  const duzenle = (e: Etkinlik) => {
    setDuzenlenen(e);
    setForm({
      baslik: e.baslik,
      aciklama: e.aciklama || '',
      tarih: e.tarih || '',
      bitis_tarih: e.bitis_tarih || '',
      konum: e.konum || '',
      etki: e.etki || 'diger',
      etkilenen_yollar: e.etkilenen_yollar || '',
      tip: e.tip || 'diger',
      aktif: e.aktif,
    });
    setModalAcik(true);
  };

  const kaydet = async () => {
    if (!form.baslik.trim()) {
      Alert.alert('Hata', 'Başlık zorunlu');
      return;
    }
    if (!form.tarih.trim()) {
      Alert.alert('Hata', 'Tarih zorunlu (YYYY-MM-DD SS:DD formatında)');
      return;
    }

    setKaydediyor(true);

    const payload = {
      baslik: form.baslik.trim(),
      aciklama: form.aciklama.trim(),
      tarih: form.tarih.trim(),
      bitis_tarih: form.bitis_tarih.trim() || null,
      konum: form.konum.trim(),
      etki: form.etki,
      etkilenen_yollar: form.etkilenen_yollar.trim(),
      tip: form.tip,
      aktif: form.aktif,
    };

    let hata;
    if (duzenlenen) {
      const { error } = await supabase
        .from('etkinlikler')
        .update(payload)
        .eq('id', duzenlenen.id);
      hata = error;
    } else {
      const { error } = await supabase
        .from('etkinlikler')
        .insert(payload);
      hata = error;
    }

    setKaydediyor(false);

    if (hata) {
      Alert.alert('Hata', hata.message);
    } else {
      setModalAcik(false);
      cek();
    }
  };

  const sil = (e: Etkinlik) => {
    Alert.alert(
      'Etkinliği Sil',
      `"${e.baslik}" silinecek. Emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('etkinlikler').delete().eq('id', e.id);
            if (error) {
              Alert.alert('Hata', `Silinemedi: ${error.message}`);
            } else {
              cek();
            }
          },
        },
      ]
    );
  };

  const aktifToggle = async (e: Etkinlik) => {
    const { error } = await supabase
      .from('etkinlikler')
      .update({ aktif: !e.aktif })
      .eq('id', e.id);
    if (error) {
      Alert.alert('Hata', `Güncellenemedi: ${error.message}`);
    } else {
      cek();
    }
  };

  if (adminYukleniyor || yukleniyor) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0077B6" />
      </View>
    );
  }

  if (!isYetkili) {
    router.back();
    return null;
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Admin Panel</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Etkinlik Yönetimi</Text>
        <Text style={s.headerAlt}>{etkinlikler.length} etkinlik</Text>
      </LinearGradient>

      {/* Liste */}
      <ScrollView
        style={s.liste}
        refreshControl={
          <RefreshControl refreshing={yenileniyor} onRefresh={() => { setYenileniyor(true); cek(); }} />
        }
      >
        {etkinlikler.map(e => (
          <View key={e.id} style={[s.kart, !e.aktif && s.kartPasif]}>
            <View style={s.kartUst}>
              <View style={s.kartBilgi}>
                <Text style={s.kartBaslik}>{e.baslik}</Text>
                <Text style={s.kartMeta}>
                  {e.tip} | {e.konum || 'Konum yok'}
                </Text>
                <Text style={s.kartTarih}>
                  {e.tarih ? new Date(e.tarih).toLocaleDateString('tr-TR') : '-'}
                </Text>
              </View>
              <View style={[s.durumBadge, e.aktif ? s.aktifBadge : s.pasifBadge]}>
                <Text style={s.durumBadgeYazi}>{e.aktif ? 'Aktif' : 'Pasif'}</Text>
              </View>
            </View>
            <View style={s.kartAlt}>
              <TouchableOpacity style={s.islemBtn} onPress={() => duzenle(e)}>
                <Text style={s.islemBtnYazi}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.islemBtn} onPress={() => aktifToggle(e)}>
                <Text style={s.islemBtnYazi}>{e.aktif ? 'Pasifleştir' : 'Aktifleştir'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.islemBtn, s.silBtn]} onPress={() => sil(e)}>
                <Text style={[s.islemBtnYazi, s.silBtnYazi]}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Yeni Ekle FAB */}
      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 20 }]}
        onPress={yeniEkle}
        activeOpacity={0.8}
      >
        <Text style={s.fabYazi}>+ Yeni Etkinlik</Text>
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal visible={modalAcik} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={s.modal} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={[s.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setModalAcik(false)}>
              <Text style={s.modalIptal}>İptal</Text>
            </TouchableOpacity>
            <Text style={s.modalBaslik}>
              {duzenlenen ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
            </Text>
            <TouchableOpacity onPress={kaydet} disabled={kaydediyor}>
              <Text style={[s.modalKaydet, kaydediyor && { opacity: 0.5 }]}>
                {kaydediyor ? '...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.formAlani}>
            <Text style={s.label}>Başlık *</Text>
            <TextInput
              style={s.input}
              value={form.baslik}
              onChangeText={v => setForm(f => ({ ...f, baslik: v }))}
              placeholder="Etkinlik adı"
              placeholderTextColor={t.textMuted}
            />

            <Text style={s.label}>Açıklama</Text>
            <TextInput
              style={[s.input, s.inputCok]}
              value={form.aciklama}
              onChangeText={v => setForm(f => ({ ...f, aciklama: v }))}
              placeholder="Detaylı açıklama"
              placeholderTextColor={t.textMuted}
              multiline
            />

            <TarihSaatSecici
              label="Başlangıç Tarihi"
              value={form.tarih}
              onChange={v => setForm(f => ({ ...f, tarih: v }))}
              required
            />

            <TarihSaatSecici
              label="Bitiş Tarihi"
              value={form.bitis_tarih}
              onChange={v => setForm(f => ({ ...f, bitis_tarih: v }))}
            />

            <Text style={s.label}>Konum</Text>
            <TextInput
              style={s.input}
              value={form.konum}
              onChangeText={v => setForm(f => ({ ...f, konum: v }))}
              placeholder="Sultanahmet Meydanı"
              placeholderTextColor={t.textMuted}
            />

            <Text style={s.label}>Etki Tipi</Text>
            <View style={s.secimGrid}>
              {ETKI_SECENEKLERI.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[s.secimBtn, form.etki === o.value && s.secimBtnAktif]}
                  onPress={() => setForm(f => ({ ...f, etki: o.value }))}
                >
                  <Text style={[s.secimBtnYazi, form.etki === o.value && s.secimBtnYaziAktif]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Etkinlik Tipi</Text>
            <View style={s.secimGrid}>
              {TIP_SECENEKLERI.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[s.secimBtn, form.tip === o.value && s.secimBtnAktif]}
                  onPress={() => setForm(f => ({ ...f, tip: o.value }))}
                >
                  <Text style={[s.secimBtnYazi, form.tip === o.value && s.secimBtnYaziAktif]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Etkilenen Yollar</Text>
            <TextInput
              style={[s.input, s.inputCok]}
              value={form.etkilenen_yollar}
              onChangeText={v => setForm(f => ({ ...f, etkilenen_yollar: v }))}
              placeholder="Kennedy Cd, Sultanahmet çevresi..."
              placeholderTextColor={t.textMuted}
              multiline
            />

            <TouchableOpacity
              style={s.aktifToggle}
              onPress={() => setForm(f => ({ ...f, aktif: !f.aktif }))}
            >
              <View style={[s.toggleDot, form.aktif && s.toggleDotAktif]} />
              <Text style={s.aktifToggleYazi}>
                {form.aktif ? 'Aktif' : 'Pasif'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },

  header: { paddingBottom: 16, paddingHorizontal: 16 },
  geriTus: { marginBottom: 8 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  liste: { flex: 1, padding: 16 },
  kart: {
    backgroundColor: t.bgCard, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: t.kartBorder,
  },
  kartPasif: { opacity: 0.5 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kartBilgi: { flex: 1, marginRight: 12 },
  kartBaslik: { fontSize: 15, fontWeight: '700', color: t.text },
  kartMeta: { fontSize: 12, color: t.textSecondary, marginTop: 3 },
  kartTarih: { fontSize: 12, color: '#0077B6', marginTop: 2, fontWeight: '600' },

  durumBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  aktifBadge: { backgroundColor: t.bgSecondary },
  pasifBadge: { backgroundColor: '#FEE2E2' },
  durumBadgeYazi: { fontSize: 11, fontWeight: '700', color: '#0077B6' },

  kartAlt: { flexDirection: 'row', marginTop: 12, gap: 8 },
  islemBtn: {
    backgroundColor: t.bgSecondary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  islemBtnYazi: { fontSize: 12, fontWeight: '600', color: '#0077B6' },
  silBtn: { backgroundColor: '#FEE2E2' },
  silBtnYazi: { color: '#D62828' },

  fab: {
    position: 'absolute', right: 16,
    backgroundColor: '#0077B6', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  fabYazi: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Modal
  modal: { flex: 1, backgroundColor: t.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: t.kartBorder, backgroundColor: t.bgCard,
  },
  modalIptal: { color: t.textSecondary, fontSize: 15 },
  modalBaslik: { fontSize: 16, fontWeight: '700', color: t.text },
  modalKaydet: { color: '#0077B6', fontSize: 15, fontWeight: '700' },

  formAlani: { padding: 16 },
  label: { fontSize: 12, fontWeight: '600', color: t.textSecondary, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: t.bgCard, borderRadius: 10, padding: 14,
    fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder,
  },
  inputCok: { minHeight: 80, textAlignVertical: 'top' },

  secimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secimBtn: {
    backgroundColor: t.bgCard, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: t.kartBorder,
  },
  secimBtnAktif: { backgroundColor: '#0077B6', borderColor: '#0077B6' },
  secimBtnYazi: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
  secimBtnYaziAktif: { color: '#FFF' },

  aktifToggle: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: t.bgCard, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: t.kartBorder,
  },
  toggleDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: t.kartBorder, marginRight: 10,
  },
  toggleDotAktif: { backgroundColor: '#0077B6' },
  aktifToggleYazi: { fontSize: 14, fontWeight: '600', color: t.text },
});
