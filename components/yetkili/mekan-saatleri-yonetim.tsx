/* ═══════════════════════════════════════════
   MEKAN SAATLERİ YÖNETİMİ — Inline Yönetim Bileşeni
   Müze/Saray/Cami sekmesinde (app/(tabs)/muzeler.tsx) mekan listesinin
   hemen altında <YetkiliBolum> içinde render edilir. Saat/fiyat/restorasyon
   düzenleme, yeni mekan ekleme, mevsim geçişi (admin) ve Sultanahmet Camii
   ziyaret pencereleri buradan yönetilir. `kategori` prop'u verilirse bileşen
   o kategoriye kilitlenir (aktif sekme ile senkron).
   Eyl 2026: admin paneli kaldırıldı, inline yönetim (eski: app/admin-saatler.tsx).
   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi
   (hex → token, Poppins, Segmentler/BirincilButon/BosDurum; modal yapısı aynı).
   ═══════════════════════════════════════════ */
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal, Switch
} from 'react-native';
import { useAdmin } from '../../hooks/use-admin';
import { supabase } from '../../lib/supabase';
import type { MekanSaat } from '../../hooks/use-mekan-saatleri';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, Segmentler } from '../ui/pusula-ui';

const GUNLER = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

const KATEGORILER = [
  { id: 'milli_saraylar', baslik: 'Milli Saraylar' },
  { id: 'muzeler', baslik: 'Müzeler' },
  { id: 'ozel_muzeler', baslik: 'Özel Müzeler' },
  { id: 'camiler', baslik: 'Camiler' },
];

type Sekme = 'milli_saraylar' | 'muzeler' | 'ozel_muzeler' | 'camiler';

const gecerliSekme = (k?: string): k is Sekme => !!k && KATEGORILER.some(x => x.id === k);

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
      // Kapanisa 30 dk veya daha az kaldiysa safran
      if (kapDk - dakika <= 30) return Palette.uyari;
      return Palette.acik; // yesil — acik
    }
  }
  return Palette.kapali; // kirmizi — kapali
}

export function MekanSaatleriYonetim(props: { kategori?: string }) {
  const { kategori } = props;
  const kilitli = gecerliSekme(kategori);
  const { t } = useTema();
  const s = createStyles(t);
  const { isAdmin, isYetkili, yukleniyor: adminYukleniyor } = useAdmin();
  const [sekme, setSekme] = useState<Sekme>(kilitli ? (kategori as Sekme) : 'milli_saraylar');
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
  const [yeniRenk, setYeniRenk] = useState(Palette.kobalt);
  const [yeniKapaliGun, setYeniKapaliGun] = useState('');

  // Form state
  const [form, setForm] = useState({
    acilis: '', kapanis: '', gise_kapanis: '',
    yaz_acilis: '', yaz_kapanis: '', yaz_gise_kapanis: '', kis_acilis: '', kis_kapanis: '', kis_gise_kapanis: '',
    haftasonu_acilis: '', haftasonu_kapanis: '',
    gece_acilis: '', gece_kapanis: '', gece_gise: '',   // 4 Eyl 2026: gece müzeciliği (boş = yok)
    fiyat_yerli: '', fiyat_yabanci: '', fiyat_indirimli: '',
    ozel_not: '',
    ulasim_notu: '', ekstra: '',   // 4 Eyl 2026: uygulamada gösterilen ama formda olmayan alanlar
    muzekart: '' as string,
    muzekart_not: '',
    mevsimsel: false,
    restorasyon: false,
    restorasyon_notu: '',
  });

  const veriCek = async () => {
    setYukleniyor(true);
    // Moderator (admin degil) HER ZAMAN sadece camileri ceker — sekme degerinden bagimsiz
    // (race condition'i onler: ilk render'da varsayilan sekme 'milli_saraylar' ile cekim yapilmaz)
    const efektifKategori = isAdmin ? sekme : 'camiler';
    const { data } = await supabase
      .from('mekan_saatleri')
      .select('*')
      .eq('kategori', efektifKategori)
      .order('isim');
    setMekanlar((data as MekanSaat[]) || []);
    setYukleniyor(false);
  };

  useEffect(() => { if (isYetkili) { veriCek(); sultanahmetCek(); } }, [sekme, isYetkili]);

  // `kategori` prop'u ile senkron: ust ekranin aktif sekmesi degisince kilitli sekme de degisir
  useEffect(() => {
    if (kilitli && kategori !== sekme) {
      setSekme(kategori as Sekme);
    }
  }, [kategori, kilitli]);

  // Moderator (admin degil) sadece camileri yonetir — kategori 'camiler'e kilitli
  useEffect(() => {
    if (!adminYukleniyor && isYetkili && !isAdmin && sekme !== 'camiler') {
      setSekme('camiler');
    }
  }, [adminYukleniyor, isYetkili, isAdmin, sekme]);

  const yeniEkleAc = () => {
    setYeniEkleModu(true);
    setSeciliMekan(null);
    setYeniIsim('');
    setYeniMekanId('');
    setYeniTip(!isAdmin ? 'cami' : sekme === 'camiler' ? 'cami' : sekme === 'milli_saraylar' ? 'saray' : 'muze');
    setYeniRenk(Palette.kobalt);
    setYeniKapaliGun('');
    setForm({
      acilis: '09:00', kapanis: '17:00', gise_kapanis: '',
      yaz_acilis: '', yaz_kapanis: '', yaz_gise_kapanis: '', kis_acilis: '', kis_kapanis: '', kis_gise_kapanis: '',
      haftasonu_acilis: '', haftasonu_kapanis: '',
      gece_acilis: '', gece_kapanis: '', gece_gise: '',
      fiyat_yerli: '', fiyat_yabanci: '', fiyat_indirimli: '',
      ozel_not: '',
      ulasim_notu: '', ekstra: '',
      muzekart: '',
      muzekart_not: '',
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
      gece_acilis: m.gece_acilis || '', gece_kapanis: m.gece_kapanis || '', gece_gise: m.gece_gise || '',
      fiyat_yerli: m.fiyat_yerli || '', fiyat_yabanci: m.fiyat_yabanci || '',
      fiyat_indirimli: m.fiyat_indirimli || '',
      ozel_not: m.ozel_not || '',
      ulasim_notu: m.ulasim_notu || '', ekstra: m.ekstra || '',
      muzekart: m.muzekart || '',
      muzekart_not: m.muzekart_not || '',
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
      gece_acilis: form.gece_acilis.trim() || null,
      gece_kapanis: form.gece_kapanis.trim() || null,
      gece_gise: form.gece_gise.trim() || null,
      ulasim_notu: form.ulasim_notu.trim() || null,
      ekstra: form.ekstra.trim() || null,
      fiyat_yerli: form.fiyat_yerli || null,
      fiyat_yabanci: form.fiyat_yabanci || null,
      fiyat_indirimli: form.fiyat_indirimli || null,
      ozel_not: form.ozel_not || null,
      muzekart: form.muzekart || null,
      muzekart_not: form.muzekart_not.trim() || null,
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
        kategori: isAdmin ? sekme : 'camiler',
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
    return <ActivityIndicator size="small" color={t.primary} style={s.kucukYukle} />;
  }

  // Moderator, kilitli kategori 'camiler' degilse bu sekmede duzenleme yapamaz
  const moderatorKategoriDisi = !isAdmin && kilitli && kategori !== 'camiler';

  return (
    <View style={s.kutu}>
      {/* Aciklama satiri (eski header alt yazisi) */}
      <Text style={s.altYazi}>{isAdmin ? 'Müze, saray, cami saatlerini yönet' : 'Cami saatlerini yönet'}</Text>

      {/* Mevsim Gecis Butonlari (sadece admin) */}
      {isAdmin && (
        <View style={s.mevsimKutu}>
          <BirincilButon baslik="Yaz Saatine Geç" onPress={() => mevsimGecisi('yaz')} varyant="cta" style={s.mevsimBtn} />
          <BirincilButon baslik="Kış Saatine Geç" onPress={() => mevsimGecisi('kis')} varyant="kobalt" style={s.mevsimBtn} />
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

      {/* Kategori Sekmeleri (sadece admin, kategori prop'u verilmemisse) */}
      {isAdmin && !kilitli && (
        <View style={s.sekmeContainer}>
          <Segmentler secenekler={KATEGORILER} aktif={sekme} onSec={id => setSekme(id as Sekme)} />
        </View>
      )}

      {/* Mekan Listesi (admin: tum kategoriler — moderator: sadece camiler) */}
      {isYetkili && (
      <View style={s.liste}>
        {moderatorKategoriDisi ? (
          <BosDurum metin="Moderatörler yalnızca cami saatlerini düzenleyebilir." />
        ) : (
          <>
            {/* Yeni Ekle Butonu */}
            <BirincilButon baslik="+ Yeni Mekan Ekle" onPress={yeniEkleAc} varyant="cta" style={s.yeniEkleBtn} />

            {yukleniyor ? (
              <ActivityIndicator size="small" color={t.primary} style={{ marginTop: 20 }} />
            ) : mekanlar.length === 0 ? (
              <BosDurum metin="Bu kategoride mekan bulunamadı." />
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
          </>
        )}
      </View>
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

              <BirincilButon baslik="Kaydet" onPress={sultanahmetKaydet} varyant="kobalt" style={s.kaydetBtn} />
              <BirincilButon baslik="İptal" onPress={() => setSultModal(false)} varyant="hayalet" style={s.iptalBtn} />
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Duzenleme Modali (admin + moderator) */}
      {isYetkili && (
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
                    <TextInput style={s.input} value={yeniRenk} onChangeText={setYeniRenk} placeholder={Palette.kobalt} placeholderTextColor={t.textMuted} />
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
                <Switch value={form.mevsimsel} onValueChange={v => setForm(f => ({...f, mevsimsel: v}))} trackColor={{ true: t.primary }} />
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

              {/* Gece Müzeciliği (4 Eyl 2026 — Yerebatan gece müzesi kalktı, silinemiyordu) */}
              <Text style={s.bolumBaslik}>Gece Müzeciliği (yoksa boş bırak)</Text>
              <View style={s.satirKutu}>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Açılış</Text>
                  <TextInput style={s.input} value={form.gece_acilis} onChangeText={v => setForm(f => ({...f, gece_acilis: v}))} placeholder="—" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Kapanış</Text>
                  <TextInput style={s.input} value={form.gece_kapanis} onChangeText={v => setForm(f => ({...f, gece_kapanis: v}))} placeholder="—" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Gişe</Text>
                  <TextInput style={s.input} value={form.gece_gise} onChangeText={v => setForm(f => ({...f, gece_gise: v}))} placeholder="—" />
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
              {(form.muzekart === 'gecerli' || form.muzekart === 'gecmez') && (
                <View style={{ marginTop: 8 }}>
                  <Text style={s.inputLabel}>İstisna / Açıklama Notu (opsiyonel)</Text>
                  <Text style={[s.inputLabel, { fontSize: 11, fontStyle: 'italic', marginTop: 2 }]}>
                    Parantez içinde gösterilir. Örnek: "Harem'de geçmez", "Selamlık'ta geçmez"
                  </Text>
                  <TextInput style={s.input} value={form.muzekart_not}
                    onChangeText={v => setForm(f => ({...f, muzekart_not: v}))}
                    placeholder="Örnek: Harem'de geçmez" />
                </View>
              )}

              {/* Restorasyon */}
              <View style={s.switchSatir}>
                <Text style={s.switchLabel}>Restorasyonda mı?</Text>
                <Switch value={form.restorasyon} onValueChange={v => setForm(f => ({...f, restorasyon: v}))} trackColor={{ true: t.durumKapali }} />
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

              {/* Ulaşım notu + Ekstra (uygulamada mekan detayında görünür) */}
              <Text style={s.bolumBaslik}>Ulaşım Notu</Text>
              <TextInput style={[s.input, s.inputGenis]} value={form.ulasim_notu}
                onChangeText={v => setForm(f => ({...f, ulasim_notu: v}))}
                placeholder="—" multiline />
              <Text style={s.bolumBaslik}>Ekstra Bilgi</Text>
              <TextInput style={[s.input, s.inputGenis]} value={form.ekstra}
                onChangeText={v => setForm(f => ({...f, ekstra: v}))}
                placeholder="—" multiline />

              {/* Butonlar */}
              <BirincilButon baslik="Kaydet" onPress={kaydet} varyant="kobalt" style={s.kaydetBtn} />
              <BirincilButon baslik="İptal" onPress={() => setDuzenleModal(false)} varyant="hayalet" style={s.iptalBtn} />
              {!yeniEkleModu && seciliMekan && isAdmin && (
                <BirincilButon baslik="Mekanı Sil" onPress={mekanSil} varyant="tehlike" style={s.silBtn} />
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
  kutu: { paddingBottom: 12 },
  kucukYukle: { marginVertical: 16 },
  altYazi: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 12, paddingHorizontal: 16, paddingTop: 12 },

  // Mevsim (BirincilButon: yaz = cta/safran, kış = kobalt)
  mevsimKutu: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, marginBottom: 8, gap: 10 },
  mevsimBtn: { flex: 1, paddingHorizontal: 8 },

  // Sekmeler (Segmentler sarmalayıcısı)
  sekmeContainer: { paddingHorizontal: 16, marginTop: 4 },

  // Liste
  liste: { paddingHorizontal: 16, marginTop: 12 },
  mekanKart: { backgroundColor: t.bgCard, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: t.kartBorder, minHeight: 44 },
  mekanKartRestorasyon: { borderColor: t.durumKapali, borderWidth: 1.5 },
  mekanRenk: { width: 5, alignSelf: 'stretch' },
  mekanBilgi: { flex: 1, padding: 14 },
  mekanIsim: { fontFamily: Font.bold, fontSize: 14, color: t.text, letterSpacing: -0.3 },
  mekanSaat: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginTop: 3 },
  mekanMevsim: { fontFamily: Font.regular, fontSize: 11, color: t.primary, marginTop: 2 },
  restorasyonYazi: { fontFamily: Font.extrabold, fontSize: 10, color: t.durumKapali, marginTop: 3, letterSpacing: 1 },
  mekanFiyat: { fontFamily: Font.regular, fontSize: 11, color: t.textSecondary, marginTop: 2 },
  duzenleOk: { fontFamily: Font.regular, color: t.textMuted, fontSize: 20, marginRight: 16 },

  // Modal (mevcut yapı; sadece renk/tipografi)
  modalArka: { flex: 1, backgroundColor: t.modalOverlay, justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: t.modalBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  modalBaslik: { fontFamily: Font.extrabold, color: t.text, fontSize: 20, letterSpacing: -0.3 },
  modalAlt: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 12, marginBottom: 16 },
  bolumBaslik: { fontFamily: Font.bold, color: t.text, fontSize: 13, marginTop: 16, marginBottom: 8 },
  satirKutu: { flexDirection: 'row', gap: 10 },
  inputGrup: { flex: 1 },
  inputLabel: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 11, marginBottom: 4 },
  input: { minHeight: 48, backgroundColor: t.bgInput, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder },
  inputGenis: { marginTop: 8, minHeight: 60, textAlignVertical: 'top' },
  switchSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 8, minHeight: 44 },
  switchLabel: { fontFamily: Font.semibold, color: t.text, fontSize: 13 },
  kaydetBtn: { marginTop: 20 },
  iptalBtn: { marginTop: 10 },
  silBtn: { marginTop: 20 },

  // Sultanahmet ozel
  sultKart: { backgroundColor: t.bgCard, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 8, padding: 14, borderWidth: 2, borderColor: t.primary, borderLeftWidth: 5, minHeight: 44 },
  sultSol: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sultDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  sultIsim: { fontFamily: Font.extrabold, fontSize: 15, color: t.primary, letterSpacing: -0.3 },
  sultAlt: { fontFamily: Font.regular, fontSize: 11, color: t.textSecondary, marginTop: 2 },
  pencereKart: { backgroundColor: t.bgInput, borderRadius: Radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: t.kartBorder },
  pencereSilBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.kapaliTint, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  pencereSilYazi: { fontFamily: Font.extrabold, color: t.durumKapali, fontSize: 12 },
  pencereEkleBtn: { borderWidth: 1, borderColor: t.primary, borderStyle: 'dashed', borderRadius: Radius.sm, padding: 10, minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pencereEkleYazi: { fontFamily: Font.bold, color: t.primary, fontSize: 12 },

  // Yeni ekle butonu (BirincilButon cta)
  yeniEkleBtn: { marginBottom: 10 },

  // Gun / tip secici
  gunSecKutu: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  gunSecBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.sm, backgroundColor: t.bgSecondary, borderWidth: 1, borderColor: t.kartBorder },
  gunSecAktif: { backgroundColor: t.primary, borderColor: t.primary },
  gunSecYazi: { fontFamily: Font.semibold, fontSize: 11, color: t.textSecondary },
  gunSecYaziAktif: { color: '#FFFFFF' },
});
