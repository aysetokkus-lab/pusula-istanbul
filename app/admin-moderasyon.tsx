import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';

interface Rapor {
  id: string;
  mesaj_id: string;
  mesaj_metni: string;
  mesaj_sahibi_id: string;
  mesaj_sahibi_isim: string;
  raporlayan_id: string | null;
  sebep: string;
  otomatik: boolean;
  durum: string;
  created_at: string;
}

const SEBEP_RENK: Record<string, string> = {
  kufur: '#D62828',
  spam: '#E09F3E',
  uygunsuz: '#7B8FA1',
  diger: '#94A3B8',
};

export default function AdminModerasyon() {
  const insets = useSafeAreaInsets();
  const { isYetkili, yukleniyor: adminYukleniyor } = useAdmin();

  const [raporlar, setRaporlar] = useState<Rapor[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [filtre, setFiltre] = useState<'bekliyor' | 'hepsi'>('bekliyor');

  // Ban modal
  const [banModal, setBanModal] = useState(false);
  const [banHedef, setBanHedef] = useState<{ id: string; isim: string } | null>(null);
  const [banSebep, setBanSebep] = useState('');
  const [banSure, setBanSure] = useState('');

  const cek = useCallback(async () => {
    let query = supabase
      .from('raporlanan_mesajlar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filtre === 'bekliyor') {
      query = query.eq('durum', 'bekliyor');
    }

    const { data } = await query;
    if (data) setRaporlar(data);
    setYukleniyor(false);
    setYenileniyor(false);
  }, [filtre]);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const islemYap = async (rapor: Rapor, yeniDurum: 'onaylandi' | 'silindi') => {
    const { data: { user } } = await supabase.auth.getUser();

    // Raporu güncelle
    await supabase
      .from('raporlanan_mesajlar')
      .update({
        durum: yeniDurum,
        islem_yapan_id: user?.id,
        islem_tarihi: new Date().toISOString(),
      })
      .eq('id', rapor.id);

    // Mesajı sil (eğer 'silindi' ise)
    if (yeniDurum === 'silindi') {
      await supabase
        .from('sohbet_mesajlari')
        .delete()
        .eq('id', rapor.mesaj_id);
    }

    cek();
  };

  const mesajSilOnayla = (rapor: Rapor) => {
    Alert.alert(
      'Mesajı Sil',
      `"${rapor.mesaj_metni.substring(0, 80)}..." mesajı silinecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => islemYap(rapor, 'silindi'),
        },
      ]
    );
  };

  const banAc = (rapor: Rapor) => {
    setBanHedef({ id: rapor.mesaj_sahibi_id, isim: rapor.mesaj_sahibi_isim });
    setBanSebep(`Uygunsuz mesaj: "${rapor.mesaj_metni.substring(0, 50)}..."`);
    setBanSure('');
    setBanModal(true);
  };

  const banUygula = async () => {
    if (!banHedef) return;

    const { data: { user } } = await supabase.auth.getUser();
    const sureDk = banSure ? parseInt(banSure) : null;

    await supabase.from('banlanan_kullanicilar').insert({
      kullanici_id: banHedef.id,
      sebep: banSebep || 'Uygunsuz davranış',
      banlayan_id: user?.id,
      sure_dk: sureDk,
      bitis_tarihi: sureDk
        ? new Date(Date.now() + sureDk * 60 * 1000).toISOString()
        : null,
      aktif: true,
    });

    setBanModal(false);
    Alert.alert('Ban Uygulandı', `${banHedef.isim} banlandı.`);
  };

  if (adminYukleniyor || yukleniyor) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0077B6" />
      </View>
    );
  }

  if (!isYetkili) { router.back(); return null; }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Admin Panel</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Sohbet Moderasyonu</Text>
        <Text style={s.headerAlt}>{raporlar.length} rapor</Text>
      </LinearGradient>

      {/* Filtre */}
      <View style={s.filtreBar}>
        {(['bekliyor', 'hepsi'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filtreBtn, filtre === f && s.filtreBtnAktif]}
            onPress={() => { setFiltre(f); setYukleniyor(true); }}
          >
            <Text style={[s.filtreBtnYazi, filtre === f && s.filtreBtnYaziAktif]}>
              {f === 'bekliyor' ? 'Bekleyenler' : 'Tümü'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rapor Listesi */}
      <ScrollView
        style={s.liste}
        refreshControl={
          <RefreshControl refreshing={yenileniyor} onRefresh={() => { setYenileniyor(true); cek(); }} />
        }
      >
        {raporlar.length === 0 ? (
          <View style={s.bosContainer}>
            <Text style={s.bosYazi}>Bekleyen rapor yok</Text>
          </View>
        ) : (
          raporlar.map(r => (
            <View key={r.id} style={s.kart}>
              {/* Üst bilgi */}
              <View style={s.kartUst}>
                <View style={s.kartBilgi}>
                  <Text style={s.kartIsim}>{r.mesaj_sahibi_isim}</Text>
                  <Text style={s.kartTarih}>
                    {new Date(r.created_at).toLocaleString('tr-TR')}
                  </Text>
                </View>
                <View style={s.kartEtiketler}>
                  <View style={[s.etiket, { backgroundColor: SEBEP_RENK[r.sebep] + '20' }]}>
                    <Text style={[s.etiketYazi, { color: SEBEP_RENK[r.sebep] }]}>
                      {r.sebep}
                    </Text>
                  </View>
                  {r.otomatik && (
                    <View style={[s.etiket, { backgroundColor: '#EAF4FB' }]}>
                      <Text style={[s.etiketYazi, { color: '#0077B6' }]}>Otomatik</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Mesaj içeriği */}
              <View style={s.mesajKutu}>
                <Text style={s.mesajMetni}>{r.mesaj_metni}</Text>
              </View>

              {/* İşlem butonları */}
              {r.durum === 'bekliyor' ? (
                <View style={s.kartAlt}>
                  <TouchableOpacity
                    style={[s.islemBtn, s.onayBtn]}
                    onPress={() => islemYap(r, 'onaylandi')}
                  >
                    <Text style={s.onayBtnYazi}>Uygun</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.islemBtn, s.silBtn]}
                    onPress={() => mesajSilOnayla(r)}
                  >
                    <Text style={s.silBtnYazi}>Mesajı Sil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.islemBtn, s.banBtn]}
                    onPress={() => banAc(r)}
                  >
                    <Text style={s.banBtnYazi}>Banla</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.kartAlt}>
                  <View style={[s.durumEtiket,
                    r.durum === 'silindi' && { backgroundColor: '#FEE2E2' },
                    r.durum === 'onaylandi' && { backgroundColor: '#DCFCE7' },
                  ]}>
                    <Text style={[s.durumEtiketYazi,
                      r.durum === 'silindi' && { color: '#D62828' },
                      r.durum === 'onaylandi' && { color: '#16A34A' },
                    ]}>
                      {r.durum === 'silindi' ? 'Silindi' :
                        r.durum === 'onaylandi' ? 'Onaylandı' : r.durum}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Ban Modal */}
      <Modal visible={banModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modal, { paddingTop: insets.top + 16 }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setBanModal(false)}>
              <Text style={s.modalIptal}>İptal</Text>
            </TouchableOpacity>
            <Text style={s.modalBaslik}>Kullanıcı Banla</Text>
            <TouchableOpacity onPress={banUygula}>
              <Text style={s.modalKaydet}>Banla</Text>
            </TouchableOpacity>
          </View>

          <View style={s.formAlani}>
            <Text style={s.label}>Kullanıcı</Text>
            <Text style={s.banIsim}>{banHedef?.isim}</Text>

            <Text style={s.label}>Sebep</Text>
            <TextInput
              style={s.input}
              value={banSebep}
              onChangeText={setBanSebep}
              placeholder="Ban sebebi"
              placeholderTextColor="#94A3B8"
              multiline
            />

            <Text style={s.label}>Süre (dakika, boş = kalıcı)</Text>
            <TextInput
              style={s.input}
              value={banSure}
              onChangeText={setBanSure}
              placeholder="Boş bırakırsan kalıcı ban"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            <View style={s.sureSec}>
              {[
                { label: '1 saat', dk: '60' },
                { label: '1 gün', dk: '1440' },
                { label: '1 hafta', dk: '10080' },
                { label: 'Kalıcı', dk: '' },
              ].map(o => (
                <TouchableOpacity
                  key={o.label}
                  style={[s.sureBtn, banSure === o.dk && s.sureBtnAktif]}
                  onPress={() => setBanSure(o.dk)}
                >
                  <Text style={[s.sureBtnYazi, banSure === o.dk && s.sureBtnYaziAktif]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },

  header: { paddingBottom: 16, paddingHorizontal: 16 },
  geriTus: { marginBottom: 8 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  filtreBar: {
    flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 8,
  },
  filtreBtn: {
    backgroundColor: '#FFF', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  filtreBtnAktif: { backgroundColor: '#0077B6', borderColor: '#0077B6' },
  filtreBtnYazi: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filtreBtnYaziAktif: { color: '#FFF' },

  liste: { flex: 1, paddingHorizontal: 16 },
  bosContainer: { paddingVertical: 60, alignItems: 'center' },
  bosYazi: { color: '#94A3B8', fontSize: 15 },

  kart: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kartBilgi: { flex: 1 },
  kartIsim: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  kartTarih: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  kartEtiketler: { flexDirection: 'row', gap: 6 },
  etiket: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  etiketYazi: { fontSize: 10, fontWeight: '700' },

  mesajKutu: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12,
    marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#E2E8F0',
  },
  mesajMetni: { fontSize: 13, color: '#1E293B', lineHeight: 18 },

  kartAlt: { flexDirection: 'row', marginTop: 12, gap: 8 },
  islemBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  onayBtn: { backgroundColor: '#DCFCE7' },
  onayBtnYazi: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  silBtn: { backgroundColor: '#FEE2E2' },
  silBtnYazi: { fontSize: 12, fontWeight: '700', color: '#D62828' },
  banBtn: { backgroundColor: '#1E293B' },
  banBtnYazi: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  durumEtiket: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  durumEtiketYazi: { fontSize: 12, fontWeight: '700' },

  // Modal
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFF',
  },
  modalIptal: { color: '#64748B', fontSize: 15 },
  modalBaslik: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  modalKaydet: { color: '#D62828', fontSize: 15, fontWeight: '700' },

  formAlani: { padding: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#8A9BAE', marginTop: 16, marginBottom: 6 },
  banIsim: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  input: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0',
  },
  sureSec: { flexDirection: 'row', gap: 8, marginTop: 16 },
  sureBtn: {
    backgroundColor: '#FFF', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  sureBtnAktif: { backgroundColor: '#0077B6', borderColor: '#0077B6' },
  sureBtnYazi: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  sureBtnYaziAktif: { color: '#FFF' },
});
