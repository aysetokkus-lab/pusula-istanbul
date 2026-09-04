/*
  ETKİNLİK YÖNETİMİ — Inline yönetim bileşeni.
  Ana sayfada EtkinliklerBandi bileşeninin hemen altında,
  <YetkiliBolum baslik="Etkinlikler"> sarmalayıcısı içinde render edilir.
  Yetki kontrolü sarmalayıcıda yapılır; burada yalnızca liste + ekle/düzenle/sil akışı vardır.
  Eyl 2026: admin paneli kaldırıldı, inline yönetim (eski: app/admin-etkinlik.tsx).
  Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi (hex → token, Poppins, BirincilButon/Rozet/BosDurum).
*/
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useAdmin } from '../../hooks/use-admin';
import { supabase } from '../../lib/supabase';
import { TarihSaatSecici } from '../tarih-saat-secici';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, Rozet } from '../ui/pusula-ui';

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

/** Kapalı durumda listede gösterilecek en fazla etkinlik sayısı */
const GORUNUR_LIMIT = 10;

export function EtkinlikYonetim() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();

  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [tumunuGoster, setTumunuGoster] = useState(false);
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

  if (yukleniyor) {
    return (
      <View style={s.yukleniyorSatir}>
        <ActivityIndicator size="small" color={t.primary} />
      </View>
    );
  }

  const gorunenler = tumunuGoster ? etkinlikler : etkinlikler.slice(0, GORUNUR_LIMIT);
  const gizliSayi = etkinlikler.length - gorunenler.length;

  return (
    <View style={s.alan}>
      {/* Üst satır: sayaç + Yenile + Yeni Etkinlik */}
      <View style={s.ustSatir}>
        <Text style={s.sayac}>{etkinlikler.length} etkinlik</Text>
        <View style={s.ustSatirSag}>
          <TouchableOpacity
            onPress={() => { setYenileniyor(true); cek(); }}
            disabled={yenileniyor}
            style={s.yenileBtn}
          >
            <Text style={[s.yenileYazi, yenileniyor && { opacity: 0.5 }]}>
              {yenileniyor ? 'Yenileniyor...' : 'Yenile'}
            </Text>
          </TouchableOpacity>
          <BirincilButon baslik="+ Yeni Etkinlik" onPress={yeniEkle} varyant="cta" style={s.ekleBtn} />
        </View>
      </View>

      {/* Liste */}
      {etkinlikler.length === 0 ? (
        <BosDurum metin="Henüz etkinlik yok." />
      ) : null}

      {gorunenler.map(e => (
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
            <Rozet renk={e.aktif ? t.primary : t.durumKapali}>{e.aktif ? 'Aktif' : 'Pasif'}</Rozet>
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

      {etkinlikler.length > GORUNUR_LIMIT ? (
        <TouchableOpacity
          style={s.tumunuGosterBtn}
          onPress={() => setTumunuGoster(v => !v)}
        >
          <Text style={s.tumunuGosterYazi}>
            {tumunuGoster ? 'Daha az göster' : `Tümünü göster (${gizliSayi} daha)`}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Form Modal */}
      <Modal visible={modalAcik} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={s.modal} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={s.modalHeader}>
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
  alan: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  yukleniyorSatir: { paddingVertical: 16, alignItems: 'center' },

  ustSatir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  ustSatirSag: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sayac: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary },
  yenileBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  yenileYazi: { fontFamily: Font.bold, fontSize: 12, color: t.primary },
  ekleBtn: { height: 40, paddingHorizontal: 14 },

  kart: {
    backgroundColor: t.bgCard, borderRadius: Radius.lg, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: t.kartBorder,
  },
  kartPasif: { opacity: 0.5 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kartBilgi: { flex: 1, marginRight: 12 },
  kartBaslik: { fontFamily: Font.bold, fontSize: 15, color: t.text, letterSpacing: -0.3 },
  kartMeta: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginTop: 3 },
  kartTarih: { fontFamily: Font.semibold, fontSize: 12, color: t.primary, marginTop: 2 },

  kartAlt: { flexDirection: 'row', marginTop: 12, gap: 8 },
  islemBtn: {
    backgroundColor: Palette.kobaltTint, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 8, minHeight: 32, justifyContent: 'center',
  },
  islemBtnYazi: { fontFamily: Font.bold, fontSize: 12, color: t.primary },
  silBtn: { backgroundColor: Palette.kapaliTint },
  silBtnYazi: { color: t.durumKapali },

  tumunuGosterBtn: {
    alignItems: 'center', paddingVertical: 10, minHeight: 44, justifyContent: 'center',
    borderRadius: Radius.md, borderWidth: 1, borderColor: t.kartBorder,
    backgroundColor: t.bgCard,
  },
  tumunuGosterYazi: { fontFamily: Font.semibold, fontSize: 13, color: t.primary },

  // Modal
  modal: { flex: 1, backgroundColor: t.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: t.kartBorder, backgroundColor: t.bgCard,
  },
  modalIptal: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 15 },
  modalBaslik: { fontFamily: Font.bold, fontSize: 16, color: t.text, letterSpacing: -0.3 },
  modalKaydet: { fontFamily: Font.bold, color: t.primary, fontSize: 15 },

  formAlani: { padding: 16 },
  label: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary, marginTop: 16, marginBottom: 6 },
  input: {
    minHeight: 48, backgroundColor: t.bgInput, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder,
  },
  inputCok: { minHeight: 80, textAlignVertical: 'top' },

  secimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secimBtn: {
    backgroundColor: t.bgCard, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: t.kartBorder,
  },
  secimBtnAktif: { backgroundColor: t.primary, borderColor: t.primary },
  secimBtnYazi: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary },
  secimBtnYaziAktif: { color: '#FFFFFF' },

  aktifToggle: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20, minHeight: 48,
    backgroundColor: t.bgCard, borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: t.kartBorder,
  },
  toggleDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: t.kartBorder, marginRight: 10,
  },
  toggleDotAktif: { backgroundColor: Palette.acik },
  aktifToggleYazi: { fontFamily: Font.semibold, fontSize: 14, color: t.text },
});
