import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal, Switch
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';
import type { MekanSaat } from '../hooks/use-mekan-saatleri';
import { useTema } from '../hooks/use-tema';
import type { TemaRenkleri } from '../constants/theme';

const GUNLER = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

const KATEGORILER = [
  { id: 'milli_saraylar', baslik: 'Milli Saraylar' },
  { id: 'muzeler', baslik: 'Müzeler' },
  { id: 'ozel_muzeler', baslik: 'Özel Müzeler' },
  { id: 'camiler', baslik: 'Camiler' },
];

type Sekme = 'milli_saraylar' | 'muzeler' | 'ozel_muzeler' | 'camiler';

/* ═══════════════════════════════════════════
   Sultanahmet Camii Pencere Tipleri
   ═══════════════════════════════════════════ */
interface ZiyaretPencere {
  etiket: string;
  acilis: string;
  kapanis: string;
}
interface SultanahmetEkstra {
  pencereler: ZiyaretPencere[];
  cuma_pencereler: ZiyaretPencere[];
}
const BOS_EKSTRA: SultanahmetEkstra = {
  pencereler: [
    { etiket: 'Sabah', acilis: '08:30', kapanis: '11:30' },
    { etiket: 'Öğle Sonrası', acilis: '12:15', kapanis: '14:20' },
    { etiket: 'İkindi Sonrası', acilis: '14:45', kapanis: '19:00' },
  ],
  cuma_pencereler: [
    { etiket: 'Cuma Sonrası', acilis: '14:30', kapanis: '14:55' },
    { etiket: 'İkindi Sonrası', acilis: '15:20', kapanis: '19:00' },
  ],
};

/* Sultanahmet acik/kapali/kapanisa yakin durumu */
function sultDurumRenk(ekstra: SultanahmetEkstra): string {
  const simdi = new Date();
  const gun = simdi.getDay(); // 0=Paz, 5=Cum
  const dakika = simdi.getHours() * 60 + simdi.getMinutes();

  const pencereler = gun === 5 ? ekstra.cuma_pencereler : ekstra.pencereler;

  for (const p of pencereler) {
    const [aH, aM] = p.acilis.split(':').map(Number);
    const [kH, kM] = p.kapanis.split(':').map(Number);
    const acDk = aH * 60 + aM;
    const kapDk = kH * 60 + kM;

    if (dakika >= acDk && dakika < kapDk) {
      // Kapanisa 30 dk veya daha az kaldiysa sari
      if (kapDk - dakika <= 30) return '#E09F3E';
      return '#059669'; // yesil — acik
    }
  }
  return '#D62828'; // kirmizi — kapali
}

export default function AdminSaatler() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const s = createStyles(t);
  const { isAdmin, isYetkili, yukleniyor: adminYukleniyor } = useAdmin();
  const [sekme, setSekme] = useState<Sekme>('milli_saraylar');
  const [mekanlar, setMekanlar] = useState<MekanSaat[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [duzenleModal, setDuzenleModal] = useState(false);
  const [seciliMekan, setSeciliMekan] = useState<MekanSaat | null>(null);

  // Sultanahmet Camii ozel state
  const [sultanahmet, setSultanahmet] = useState<MekanSaat | null>(null);
  const [sultModal, setSultModal] = useState(false);
  const [sultEkstra, setSultEkstra] = useState<SultanahmetEkstra>(BOS_EKSTRA);
  const [sultKapanis, setSultKapanis] = useState('19:00');

  // Sultanahmet verisini cek
  const sultanahmetCek = async () => {
    const { data } = await supabase
      .from('mekan_saatleri')
      .select('*')
      .eq('mekan_id', 'sultanahmet_camii')
      .single();
    if (data) {
      setSultanahmet(data as MekanSaat);
      setSultKapanis(data.kapanis || '19:00');
      try {
        if (data.ekstra) {
          const parsed = typeof data.ekstra === 'string' ? JSON.parse(data.ekstra) : data.ekstra;
          setSultEkstra({ ...BOS_EKSTRA, ...parsed });
        }
      } catch { /* fallback */ }
    }
  };

  // Sultanahmet kaydet
  const sultanahmetKaydet = async () => {
    if (!sultanahmet) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('mekan_saatleri')
      .update({
        kapanis: sultKapanis,
        ekstra: JSON.stringify(sultEkstra),
        guncelleme_tarihi: new Date().toISOString(),
        guncelleyen: user?.id,
      })
      .eq('id', sultanahmet.id);

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert('Başarılı', 'Sultanahmet Camii ziyaret pencereleri güncellendi.');
      setSultModal(false);
      sultanahmetCek();
    }
  };

  // Pencere guncelle yardimcisi
  const pencereGuncelle = (tip: 'pencereler' | 'cuma_pencereler', index: number, alan: 'acilis' | 'kapanis' | 'etiket', deger: string) => {
    setSultEkstra(prev => {
      const kopi = { ...prev };
      kopi[tip] = [...kopi[tip]];
      kopi[tip][index] = { ...kopi[tip][index], [alan]: deger };
      return kopi;
    });
  };

  // Pencere ekle
  const pencereEkle = (tip: 'pencereler' | 'cuma_pencereler') => {
    setSultEkstra(prev => ({
      ...prev,
      [tip]: [...prev[tip], { etiket: 'Yeni Pencere', acilis: '08:00', kapanis: '17:00' }],
    }));
  };

  // Pencere sil
  const pencereSil = (tip: 'pencereler' | 'cuma_pencereler', index: number) => {
    setSultEkstra(prev => ({
      ...prev,
      [tip]: prev[tip].filter((_, i) => i !== index),
    }));
  };

  // Yeni ekleme modu
  const [yeniEkleModu, setYeniEkleModu] = useState(false);
  const [yeniIsim, setYeniIsim] = useState('');
  const [yeniMekanId, setYeniMekanId] = useState('');
  const [duzenleIsim, setDuzenleIsim] = useState('');
  const [yeniTip, setYeniTip] = useState('muze');
  const [yeniRenk, setYeniRenk] = useState('#0077B6');
  const [yeniKapaliGun, setYeniKapaliGun] = useState('');

  // Form state
  const [form, setForm] = useState({
    acilis: '', kapanis: '', gise_kapanis: '',
    yaz_acilis: '', yaz_kapanis: '', yaz_gise_kapanis: '', kis_acilis: '', kis_kapanis: '', kis_gise_kapanis: '',
    haftasonu_acilis: '', haftasonu_kapanis: '',
    fiyat_yerli: '', fiyat_yabanci: '', fiyat_indirimli: '',
    ozel_not: '',
    muzekart: '' as string,
    mevsimsel: false,
    restorasyon: false,
    restorasyon_notu: '',
  });

  const veriCek = async () => {
    setYukleniyor(true);
    const { data } = await supabase
      .from('mekan_saatleri')
      .select('*')
      .eq('kategori', sekme)
      .order('isim');
    setMekanlar((data as MekanSaat[]) || []);
    setYukleniyor(false);
  };

  useEffect(() => { if (isYetkili) { veriCek(); sultanahmetCek(); } }, [sekme, isYetkili]);

  const yeniEkleAc = () => {
    setYeniEkleModu(true);
    setSeciliMekan(null);
    setYeniIsim('');
    setYeniMekanId('');
    setYeniTip(sekme === 'camiler' ? 'cami' : sekme === 'milli_saraylar' ? 'saray' : 'muze');
    setYeniRenk('#0077B6');
    setYeniKapaliGun('');
    setForm({
      acilis: '09:00', kapanis: '17:00', gise_kapanis: '',
      yaz_acilis: '', yaz_kapanis: '', yaz_gise_kapanis: '', kis_acilis: '', kis_kapanis: '', kis_gise_kapanis: '',
      haftasonu_acilis: '', haftasonu_kapanis: '',
      fiyat_yerli: '', fiyat_yabanci: '', fiyat_indirimli: '',
      ozel_not: '',
      muzekart: '',
      mevsimsel: false,
      restorasyon: false,
      restorasyon_notu: '',
    });
    setDuzenleModal(true);
  };

  const duzenleAc = (m: MekanSaat) => {
    setYeniEkleModu(false);
    setSeciliMekan(m);
    setDuzenleIsim(m.isim);
    setForm({
      acilis: m.acilis, kapanis: m.kapanis, gise_kapanis: m.gise_kapanis || '',
      yaz_acilis: m.yaz_acilis || '', yaz_kapanis: m.yaz_kapanis || '', yaz_gise_kapanis: m.yaz_gise_kapanis || '',
      kis_acilis: m.kis_acilis || '', kis_kapanis: m.kis_kapanis || '', kis_gise_kapanis: m.kis_gise_kapanis || '',
      haftasonu_acilis: m.haftasonu_acilis || '', haftasonu_kapanis: m.haftasonu_kapanis || '',
      fiyat_yerli: m.fiyat_yerli || '', fiyat_yabanci: m.fiyat_yabanci || '',
      fiyat_indirimli: m.fiyat_indirimli || '',
      ozel_not: m.ozel_not || '',
      muzekart: m.muzekart || '',
      mevsimsel: m.mevsimsel,
      restorasyon: m.restorasyon,
      restorasyon_notu: m.restorasyon_notu || '',
    });
    setDuzenleModal(true);
  };

  const kaydet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const ortakVeri = {
      acilis: form.acilis,
      kapanis: form.kapanis,
      gise_kapanis: form.gise_kapanis || null,
      yaz_acilis: form.yaz_acilis || null,
      yaz_kapanis: form.yaz_kapanis || null,
      yaz_gise_kapanis: form.yaz_gise_kapanis || null,
      kis_acilis: form.kis_acilis || null,
      kis_kapanis: form.kis_kapanis || null,
      kis_gise_kapanis: form.kis_gise_kapanis || null,
      haftasonu_acilis: form.haftasonu_acilis || null,
      haftasonu_kapanis: form.haftasonu_kapanis || null,
      fiyat_yerli: form.fiyat_yerli || null,
      fiyat_yabanci: form.fiyat_yabanci || null,
      fiyat_indirimli: form.fiyat_indirimli || null,
      ozel_not: form.ozel_not || null,
      muzekart: form.muzekart || null,
      mevsimsel: form.mevsimsel,
      restorasyon: form.restorasyon,
      restorasyon_notu: form.restorasyon_notu || null,
      guncelleme_tarihi: new Date().toISOString(),
      guncelleyen: user?.id,
    };

    if (yeniEkleModu) {
      // Yeni mekan ekleme
      if (!yeniIsim.trim()) {
        Alert.alert('Hata', 'Mekan adı boş olamaz.');
        return;
      }
      const mekanId = yeniMekanId.trim() || yeniIsim.trim().toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '_').replace(/_+/g, '_');
      const { error } = await supabase.from('mekan_saatleri').insert({
        ...ortakVeri,
        isim: yeniIsim.trim(),
        mekan_id: mekanId,
        tip: yeniTip,
        kategori: sekme,
        renk: yeniRenk,
        kapali_gun: yeniKapaliGun ? parseInt(yeniKapaliGun) : null,
        aktif: true,
        aktif_mevsim: 'kis',
      });

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', `${yeniIsim.trim()} eklendi.`);
        setDuzenleModal(false);
        veriCek();
      }
    } else {
      // Mevcut mekan guncelleme
      if (!seciliMekan) return;
      const { error } = await supabase
        .from('mekan_saatleri')
        .update({ ...ortakVeri, isim: duzenleIsim.trim() || seciliMekan.isim })
        .eq('id', seciliMekan.id);

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', `${seciliMekan.isim} güncellendi.`);
        setDuzenleModal(false);
        veriCek();
      }
    }
  };

  const mekanSil = async () => {
    if (!seciliMekan) return;
    Alert.alert(
      'Mekan Sil',
      `"${seciliMekan.isim}" kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive', onPress: async () => {
            const { error } = await supabase
              .from('mekan_saatleri')
              .delete()
              .eq('id', seciliMekan.id);
            if (error) {
              Alert.alert('Hata', error.message);
            } else {
              Alert.alert('Silindi', `${seciliMekan.isim} başarıyla silindi.`);
              setDuzenleModal(false);
              veriCek();
            }
          },
        },
      ]
    );
  };

  const mevsimGecisi = async (hedefMevsim: 'yaz' | 'kis') => {
    const mevsimAdi = hedefMevsim === 'yaz' ? 'Yaz' : 'Kış';
    Alert.alert(
      `${mevsimAdi} Saatine Geç`,
      `Tüm mevsimsel mekanların saatleri ${mevsimAdi.toLowerCase()} tarifesine güncellenecek. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: `${mevsimAdi} Saatine Geç`,
          style: 'destructive',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // Tum mevsimsel mekanlari guncelle
            const { data, error } = await supabase
              .from('mekan_saatleri')
              .update({
                aktif_mevsim: hedefMevsim,
                guncelleme_tarihi: new Date().toISOString(),
                guncelleyen: user?.id,
              })
              .eq('mevsimsel', true)
              .select('id');

            if (error) {
              Alert.alert('Hata', error.message);
              return;
            }

            // Mevsimsel olmayan ama tum mekanlarin mevsimini de guncelle (referans icin)
            await supabase
              .from('mekan_saatleri')
              .update({ aktif_mevsim: hedefMevsim })
              .eq('mevsimsel', false);

            // Bogaz turlarinin mevsimini de guncelle
            await supabase
              .from('bogaz_turlari')
              .update({ aktif_mevsim: hedefMevsim });

            // Log kaydi
            await supabase.from('mevsim_gecis_log').insert({
              mevsim: hedefMevsim,
              yapan: user?.id,
              etkilenen_mekan_sayisi: data?.length || 0,
              notlar: `${mevsimAdi} saatine toplu geçiş yapıldı`,
            });

            Alert.alert('Başarılı', `${data?.length || 0} mekan ${mevsimAdi.toLowerCase()} saatine geçirildi.`);
            veriCek();
          },
        },
      ]
    );
  };

  if (adminYukleniyor) {
    return <View style={s.yukle}><ActivityIndicator size="large" color="#0077B6" /></View>;
  }
  if (!isYetkili) {
    return (
      <View style={s.yukle}>
        <Text style={s.yetkisiz}>Erişim Engellendi</Text>
        <TouchableOpacity style={s.geriBtn} onPress={() => router.back()}>
          <Text style={s.geriBtnYazi}>Geri Dön</Text>
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
        <Text style={s.headerBaslik}>Mekan Saatleri</Text>
        <Text style={s.headerAlt}>Müze, saray, cami saatlerini yönet</Text>
      </LinearGradient>

      {/* Mevsim Gecis Butonlari (sadece admin) */}
      {isAdmin && (
        <View style={s.mevsimKutu}>
          <TouchableOpacity style={[s.mevsimBtn, s.mevsimYaz]} onPress={() => mevsimGecisi('yaz')}>
            <Text style={s.mevsimBtnYazi}>Yaz Saatine Geç</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.mevsimBtn, s.mevsimKis]} onPress={() => mevsimGecisi('kis')}>
            <Text style={s.mevsimBtnYazi}>Kış Saatine Geç</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sultanahmet Camii — Ozel Giris (admin + moderator) */}
      {sultanahmet && (
        <TouchableOpacity style={s.sultKart} onPress={() => setSultModal(true)} activeOpacity={0.7}>
          <View style={s.sultSol}>
            <View style={[s.sultDot, { backgroundColor: sultDurumRenk(sultEkstra) }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.sultIsim}>Sultanahmet Camii</Text>
              <Text style={s.sultAlt}>
                {sultEkstra.pencereler.length} hafta ici + {sultEkstra.cuma_pencereler.length} cuma penceresi
              </Text>
            </View>
          </View>
          <Text style={s.duzenleOk}>{'>'}</Text>
        </TouchableOpacity>
      )}

      {/* Kategori Sekmeleri (sadece admin) */}
      {isAdmin && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sekmeScroll} contentContainerStyle={s.sekmeContainer}>
          {KATEGORILER.map(k => (
            <TouchableOpacity key={k.id} style={[s.sekmeBtn, sekme === k.id && s.sekmeBtnAktif]}
              onPress={() => setSekme(k.id as Sekme)}>
              <Text style={[s.sekmeYazi, sekme === k.id && s.sekmeYaziAktif]}>{k.baslik}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Mekan Listesi (sadece admin) */}
      {isAdmin && (
      <ScrollView style={s.liste} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Yeni Ekle Butonu */}
        <TouchableOpacity style={s.yeniEkleBtn} onPress={yeniEkleAc} activeOpacity={0.7}>
          <Text style={s.yeniEklePlus}>+</Text>
          <Text style={s.yeniEkleYazi}>Yeni Mekan Ekle</Text>
        </TouchableOpacity>

        {yukleniyor ? (
          <ActivityIndicator size="large" color="#0077B6" style={{ marginTop: 40 }} />
        ) : mekanlar.length === 0 ? (
          <Text style={s.bosYazi}>Bu kategoride mekan bulunamadı.</Text>
        ) : (
          mekanlar.map(m => (
            <TouchableOpacity key={m.id} style={[s.mekanKart, m.restorasyon && s.mekanKartRestorasyon]}
              onPress={() => duzenleAc(m)} activeOpacity={0.7}>
              <View style={[s.mekanRenk, { backgroundColor: m.renk }]} />
              <View style={s.mekanBilgi}>
                <Text style={s.mekanIsim}>{m.isim}</Text>
                <Text style={s.mekanSaat}>
                  {m.acilis} - {m.kapanis}
                  {m.kapali_gun !== null ? ` (${GUNLER[m.kapali_gun]} kapalı)` : ''}
                </Text>
                {m.mevsimsel && (
                  <Text style={s.mekanMevsim}>
                    Mevsimsel: Yaz {m.yaz_acilis}-{m.yaz_kapanis} / Kış {m.kis_acilis}-{m.kis_kapanis}
                  </Text>
                )}
                {m.restorasyon && <Text style={s.restorasyonYazi}>RESTORASYON</Text>}
                {m.fiyat_yabanci && <Text style={s.mekanFiyat}>Yabancı: {m.fiyat_yabanci}</Text>}
              </View>
              <Text style={s.duzenleOk}>{'>'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      )}

      {/* Sultanahmet Camii Ozel Modali */}
      <Modal visible={sultModal} transparent animationType="slide" onRequestClose={() => setSultModal(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>Sultanahmet Camii</Text>
              <Text style={s.modalAlt}>Ziyaret pencerelerini elle düzenle</Text>

              <View style={s.inputGrup}>
                <Text style={s.inputLabel}>Genel Kapanış Saati</Text>
                <TextInput style={s.input} value={sultKapanis} onChangeText={setSultKapanis} placeholder="19:00" />
              </View>

              {/* Hafta Ici Pencereleri */}
              <Text style={s.bolumBaslik}>Hafta İçi Ziyaret Pencereleri</Text>
              {sultEkstra.pencereler.map((p, i) => (
                <View key={`hi-${i}`} style={s.pencereKart}>
                  <View style={s.satirKutu}>
                    <View style={[s.inputGrup, { flex: 2 }]}>
                      <Text style={s.inputLabel}>Etiket</Text>
                      <TextInput style={s.input} value={p.etiket} onChangeText={v => pencereGuncelle('pencereler', i, 'etiket', v)} />
                    </View>
                    <TouchableOpacity style={s.pencereSilBtn} onPress={() => pencereSil('pencereler', i)}>
                      <Text style={s.pencereSilYazi}>X</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.satirKutu}>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Açılış</Text>
                      <TextInput style={s.input} value={p.acilis} onChangeText={v => pencereGuncelle('pencereler', i, 'acilis', v)} placeholder="08:30" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Kapanış</Text>
                      <TextInput style={s.input} value={p.kapanis} onChangeText={v => pencereGuncelle('pencereler', i, 'kapanis', v)} placeholder="11:30" />
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={s.pencereEkleBtn} onPress={() => pencereEkle('pencereler')}>
                <Text style={s.pencereEkleYazi}>+ Pencere Ekle</Text>
              </TouchableOpacity>

              {/* Cuma Pencereleri */}
              <Text style={s.bolumBaslik}>Cuma Günü Ziyaret Pencereleri</Text>
              {sultEkstra.cuma_pencereler.map((p, i) => (
                <View key={`cm-${i}`} style={s.pencereKart}>
                  <View style={s.satirKutu}>
                    <View style={[s.inputGrup, { flex: 2 }]}>
                      <Text style={s.inputLabel}>Etiket</Text>
                      <TextInput style={s.input} value={p.etiket} onChangeText={v => pencereGuncelle('cuma_pencereler', i, 'etiket', v)} />
                    </View>
                    <TouchableOpacity style={s.pencereSilBtn} onPress={() => pencereSil('cuma_pencereler', i)}>
                      <Text style={s.pencereSilYazi}>X</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.satirKutu}>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Açılış</Text>
                      <TextInput style={s.input} value={p.acilis} onChangeText={v => pencereGuncelle('cuma_pencereler', i, 'acilis', v)} placeholder="14:30" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Kapanış</Text>
                      <TextInput style={s.input} value={p.kapanis} onChangeText={v => pencereGuncelle('cuma_pencereler', i, 'kapanis', v)} placeholder="14:55" />
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={s.pencereEkleBtn} onPress={() => pencereEkle('cuma_pencereler')}>
                <Text style={s.pencereEkleYazi}>+ Pencere Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.kaydetBtn} onPress={sultanahmetKaydet}>
                <Text style={s.kaydetBtnYazi}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.iptalBtn} onPress={() => setSultModal(false)}>
                <Text style={s.iptalBtnYazi}>İptal</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Duzenleme Modali (sadece admin) */}
      {isAdmin && (
      <Modal visible={duzenleModal} transparent animationType="slide" onRequestClose={() => setDuzenleModal(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>{yeniEkleModu ? 'Yeni Mekan Ekle' : 'Mekan Düzenle'}</Text>
              <Text style={s.modalAlt}>{yeniEkleModu ? KATEGORILER.find(k => k.id === sekme)?.baslik : `${seciliMekan?.tip} — ${seciliMekan?.kategori}`}</Text>

              {/* Mevcut mekan isim duzenleme */}
              {!yeniEkleModu && seciliMekan && (
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Mekan Adı</Text>
                  <TextInput style={s.input} value={duzenleIsim} onChangeText={setDuzenleIsim} placeholder="Mekan adı" />
                </View>
              )}

              {/* Yeni mekan bilgileri */}
              {yeniEkleModu && (
                <>
                  <Text style={s.bolumBaslik}>Mekan Bilgileri</Text>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Mekan Adı *</Text>
                    <TextInput style={s.input} value={yeniIsim} onChangeText={setYeniIsim} placeholder="Örnek: Topkapı Sarayı" />
                  </View>
                  {/* Tip secici */}
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Tip</Text>
                    <View style={s.gunSecKutu}>
                      {['muze','saray','cami','kule','sarnic','hisar','ozel_muze','kasir','kultur_merkezi','acik_hava'].map(t => (
                        <TouchableOpacity key={t} style={[s.gunSecBtn, yeniTip === t && s.gunSecAktif]}
                          onPress={() => setYeniTip(t)}>
                          <Text style={[s.gunSecYazi, yeniTip === t && s.gunSecYaziAktif]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Kapalı gün secici */}
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Kapalı Gün</Text>
                    <View style={s.gunSecKutu}>
                      <TouchableOpacity style={[s.gunSecBtn, yeniKapaliGun === '' && s.gunSecAktif]}
                        onPress={() => setYeniKapaliGun('')}>
                        <Text style={[s.gunSecYazi, yeniKapaliGun === '' && s.gunSecYaziAktif]}>Yok</Text>
                      </TouchableOpacity>
                      {GUNLER.map((g, i) => (
                        <TouchableOpacity key={i} style={[s.gunSecBtn, yeniKapaliGun === String(i) && s.gunSecAktif]}
                          onPress={() => setYeniKapaliGun(String(i))}>
                          <Text style={[s.gunSecYazi, yeniKapaliGun === String(i) && s.gunSecYaziAktif]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Renk</Text>
                    <TextInput style={s.input} value={yeniRenk} onChangeText={setYeniRenk} placeholder="#0077B6" />
                  </View>
                </>
              )}

              {/* Standart Saatler */}
              <Text style={s.bolumBaslik}>Standart Saatler</Text>
              <View style={s.satirKutu}>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Açılış</Text>
                  <TextInput style={s.input} value={form.acilis} onChangeText={v => setForm(f => ({...f, acilis: v}))} placeholder="09:00" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Kapanış</Text>
                  <TextInput style={s.input} value={form.kapanis} onChangeText={v => setForm(f => ({...f, kapanis: v}))} placeholder="18:00" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Gişe</Text>
                  <TextInput style={s.input} value={form.gise_kapanis} onChangeText={v => setForm(f => ({...f, gise_kapanis: v}))} placeholder="17:00" />
                </View>
              </View>

              {/* Mevsimsel Toggle */}
              <View style={s.switchSatir}>
                <Text style={s.switchLabel}>Mevsimsel saat farkı var mı?</Text>
                <Switch value={form.mevsimsel} onValueChange={v => setForm(f => ({...f, mevsimsel: v}))} trackColor={{true:'#0077B6'}} />
              </View>

              {form.mevsimsel && (
                <>
                  <Text style={s.bolumBaslik}>Yaz Saatleri</Text>
                  <View style={s.satirKutu}>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Açılış</Text>
                      <TextInput style={s.input} value={form.yaz_acilis} onChangeText={v => setForm(f => ({...f, yaz_acilis: v}))} placeholder="08:00" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Kapanış</Text>
                      <TextInput style={s.input} value={form.yaz_kapanis} onChangeText={v => setForm(f => ({...f, yaz_kapanis: v}))} placeholder="19:00" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Gişe</Text>
                      <TextInput style={s.input} value={form.yaz_gise_kapanis} onChangeText={v => setForm(f => ({...f, yaz_gise_kapanis: v}))} placeholder="18:00" />
                    </View>
                  </View>
                  <Text style={s.bolumBaslik}>Kış Saatleri</Text>
                  <View style={s.satirKutu}>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Açılış</Text>
                      <TextInput style={s.input} value={form.kis_acilis} onChangeText={v => setForm(f => ({...f, kis_acilis: v}))} placeholder="09:00" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Kapanış</Text>
                      <TextInput style={s.input} value={form.kis_kapanis} onChangeText={v => setForm(f => ({...f, kis_kapanis: v}))} placeholder="17:00" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Gişe</Text>
                      <TextInput style={s.input} value={form.kis_gise_kapanis} onChangeText={v => setForm(f => ({...f, kis_gise_kapanis: v}))} placeholder="16:00" />
                    </View>
                  </View>
                </>
              )}

              {/* Hafta Sonu */}
              <Text style={s.bolumBaslik}>Hafta Sonu (farklı ise)</Text>
              <View style={s.satirKutu}>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Açılış</Text>
                  <TextInput style={s.input} value={form.haftasonu_acilis} onChangeText={v => setForm(f => ({...f, haftasonu_acilis: v}))} placeholder="—" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Kapanış</Text>
                  <TextInput style={s.input} value={form.haftasonu_kapanis} onChangeText={v => setForm(f => ({...f, haftasonu_kapanis: v}))} placeholder="—" />
                </View>
              </View>

              {/* Fiyatlar */}
              <Text style={s.bolumBaslik}>Fiyatlar</Text>
              <View style={s.satirKutu}>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Yerli</Text>
                  <TextInput style={s.input} value={form.fiyat_yerli} onChangeText={v => setForm(f => ({...f, fiyat_yerli: v}))} placeholder="—" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Yabancı</Text>
                  <TextInput style={s.input} value={form.fiyat_yabanci} onChangeText={v => setForm(f => ({...f, fiyat_yabanci: v}))} placeholder="—" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>İndirimli</Text>
                  <TextInput style={s.input} value={form.fiyat_indirimli} onChangeText={v => setForm(f => ({...f, fiyat_indirimli: v}))} placeholder="—" />
                </View>
              </View>

              {/* Muzekart */}
              <Text style={s.bolumBaslik}>MüzeKart</Text>
              <View style={s.gunSecKutu}>
                {[
                  { key: '', label: 'Belirtilmemiş' },
                  { key: 'gecerli', label: 'Geçer' },
                  { key: 'gecmez', label: 'Geçmez' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.gunSecBtn, form.muzekart === opt.key && s.gunSecAktif]}
                    onPress={() => setForm(f => ({...f, muzekart: opt.key}))}
                  >
                    <Text style={[s.gunSecYazi, form.muzekart === opt.key && s.gunSecYaziAktif]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Restorasyon */}
              <View style={s.switchSatir}>
                <Text style={s.switchLabel}>Restorasyonda mı?</Text>
                <Switch value={form.restorasyon} onValueChange={v => setForm(f => ({...f, restorasyon: v}))} trackColor={{true:'#D62828'}} />
              </View>
              {form.restorasyon && (
                <TextInput style={[s.input, s.inputGenis]} value={form.restorasyon_notu}
                  onChangeText={v => setForm(f => ({...f, restorasyon_notu: v}))}
                  placeholder="Restorasyon notu..." multiline />
              )}

              {/* Ozel Not */}
              <Text style={s.bolumBaslik}>Özel Not</Text>
              <TextInput style={[s.input, s.inputGenis]} value={form.ozel_not}
                onChangeText={v => setForm(f => ({...f, ozel_not: v}))}
                placeholder="Rehberler için özel bilgi..." multiline />

              {/* Butonlar */}
              <TouchableOpacity style={s.kaydetBtn} onPress={kaydet}>
                <Text style={s.kaydetBtnYazi}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.iptalBtn} onPress={() => setDuzenleModal(false)}>
                <Text style={s.iptalBtnYazi}>İptal</Text>
              </TouchableOpacity>
              {!yeniEkleModu && seciliMekan && (
                <TouchableOpacity style={s.silBtn} onPress={mekanSil}>
                  <Text style={s.silBtnYazi}>Mekanı Sil</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      )}
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  yukle: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
  yetkisiz: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 16 },
  geriBtn: { backgroundColor: '#0077B6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  geriBtnYazi: { color: '#FFF', fontWeight: '700' },

  // Header
  header: { paddingBottom: 16, paddingHorizontal: 16 },
  geriTus: { marginBottom: 8 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  // Mevsim
  mevsimKutu: { flexDirection: 'row', margin: 16, marginBottom: 8, gap: 10 },
  mevsimBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  mevsimYaz: { backgroundColor: '#E09F3E' },
  mevsimKis: { backgroundColor: '#0096C7' },
  mevsimBtnYazi: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Sekmeler
  sekmeScroll: { maxHeight: 48 },
  sekmeContainer: { paddingHorizontal: 16, gap: 8 },
  sekmeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: t.kartBorder },
  sekmeBtnAktif: { backgroundColor: '#0077B6' },
  sekmeYazi: { color: t.textSecondary, fontSize: 12, fontWeight: '600' },
  sekmeYaziAktif: { color: '#FFF' },

  // Liste
  liste: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  bosYazi: { textAlign: 'center', color: t.textMuted, marginTop: 40, fontSize: 14 },
  mekanKart: { backgroundColor: t.bgCard, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: t.kartBorder },
  mekanKartRestorasyon: { borderColor: '#D62828', borderWidth: 1.5 },
  mekanRenk: { width: 5, alignSelf: 'stretch' },
  mekanBilgi: { flex: 1, padding: 14 },
  mekanIsim: { fontSize: 14, fontWeight: '700', color: t.text },
  mekanSaat: { fontSize: 12, color: t.textSecondary, marginTop: 3 },
  mekanMevsim: { fontSize: 11, color: '#0096C7', marginTop: 2 },
  restorasyonYazi: { fontSize: 10, fontWeight: '800', color: '#D62828', marginTop: 3, letterSpacing: 1 },
  mekanFiyat: { fontSize: 11, color: t.textSecondary, marginTop: 2 },
  duzenleOk: { color: t.textMuted, fontSize: 20, marginRight: 16 },

  // Modal
  modalArka: { flex: 1, backgroundColor: t.modalOverlay, justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: t.modalBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalBaslik: { color: '#0077B6', fontSize: 20, fontWeight: '800' },
  modalAlt: { color: t.textSecondary, fontSize: 12, marginBottom: 16 },
  bolumBaslik: { color: t.text, fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  satirKutu: { flexDirection: 'row', gap: 10 },
  inputGrup: { flex: 1 },
  inputLabel: { color: t.textSecondary, fontSize: 11, marginBottom: 4 },
  input: { backgroundColor: t.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder },
  inputGenis: { marginTop: 8, minHeight: 60, textAlignVertical: 'top' },
  switchSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 8 },
  switchLabel: { color: t.text, fontSize: 13, fontWeight: '600' },
  kaydetBtn: { backgroundColor: '#0077B6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  kaydetBtnYazi: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  iptalBtn: { borderWidth: 1, borderColor: t.kartBorder, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  iptalBtnYazi: { color: t.textSecondary, fontSize: 14, fontWeight: '600' },
  silBtn: { borderWidth: 1, borderColor: '#D62828', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  silBtnYazi: { color: '#D62828', fontSize: 14, fontWeight: '700' },

  // Sultanahmet ozel
  sultKart: { backgroundColor: t.bgCard, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 8, padding: 14, borderWidth: 2, borderColor: '#0077B6', borderLeftWidth: 5 },
  sultSol: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sultDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  sultIsim: { fontSize: 15, fontWeight: '800', color: '#0077B6' },
  sultAlt: { fontSize: 11, color: t.textSecondary, marginTop: 2 },
  pencereKart: { backgroundColor: t.bgInput, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: t.kartBorder },
  pencereSilBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#D6282820', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  pencereSilYazi: { color: '#D62828', fontWeight: '800', fontSize: 12 },
  pencereEkleBtn: { borderWidth: 1, borderColor: '#0077B6', borderStyle: 'dashed', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 16 },
  pencereEkleYazi: { color: '#0077B6', fontWeight: '700', fontSize: 12 },

  // Yeni ekle butonu
  yeniEkleBtn: { backgroundColor: t.bgCard, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, padding: 14, borderWidth: 1.5, borderColor: '#0077B6', borderStyle: 'dashed' },
  yeniEklePlus: { color: '#0077B6', fontSize: 22, fontWeight: '700', marginRight: 8 },
  yeniEkleYazi: { color: '#0077B6', fontSize: 14, fontWeight: '700' },

  // Gun / tip secici
  gunSecKutu: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  gunSecBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: t.kartBorder },
  gunSecAktif: { backgroundColor: '#0077B6' },
  gunSecYazi: { fontSize: 11, fontWeight: '600', color: t.textSecondary },
  gunSecYaziAktif: { color: '#FFF' },
});
