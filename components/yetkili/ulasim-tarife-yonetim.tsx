/* ═══════════════════════════════════════════
   ULAŞIM TARİFE YÖNETİMİ — Inline yönetim bileşeni
   Havalimanı seferleri (HAVAiST/HAVABUS) ve boğaz turlarının
   saat/fiyat/güzergâh bilgilerini düzenler, yeni kayıt ekler.
   Mount: app/(tabs)/ulasim.tsx (tip="havalimani") ve
   app/(tabs)/bogaz.tsx (tip="bogaz"), listelerin altında <YetkiliBolum> içinde.
   Eyl 2026: admin paneli kaldırıldı, inline yönetim (eski: app/admin-ulasim-tarife.tsx).
   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi
   (hex → token, Poppins, Segmentler/BirincilButon/BosDurum; modal yapısı aynı).
   ═══════════════════════════════════════════ */
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import { useAdmin } from '../../hooks/use-admin';
import { supabase } from '../../lib/supabase';
import type { HavalimaniSefer } from '../../hooks/use-ulasim-tarife';
import type { BogazTuru } from '../../hooks/use-bogaz-turlari';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, Segmentler } from '../ui/pusula-ui';

type Firma = 'havaist' | 'havabus';

export function UlasimTarifeYonetim({ tip }: { tip: 'havalimani' | 'bogaz' }) {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();
  // Havalimanı modunda firma seçimi (HAVAiST / HAVABUS); boğaz modunda kullanılmaz
  const [firma, setFirma] = useState<Firma>('havaist');
  const [seferler, setSeferler] = useState<HavalimaniSefer[]>([]);
  const [bogazTurlar, setBogazTurlar] = useState<BogazTuru[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Duzenleme modali
  const [seferModal, setSeferModal] = useState(false);
  const [seciliSefer, setSeciliSefer] = useState<HavalimaniSefer | null>(null);
  const [sehirdenHavStr, setSehirdenHavStr] = useState('');
  const [havdanSehirStr, setHavdanSehirStr] = useState('');
  const [sehirdenHavGuzergah, setSehirdenHavGuzergah] = useState('');
  const [havdanSehirGuzergah, setHavdanSehirGuzergah] = useState('');
  const [fiyatForm, setFiyatForm] = useState('');
  const [sureForm, setSureForm] = useState('');

  // Bogaz duzenleme
  const [bogazModal, setBogazModal] = useState(false);
  const [seciliTur, setSeciliTur] = useState<BogazTuru | null>(null);
  const [bogazSaatlerStr, setBogazSaatlerStr] = useState('');
  const [bogazHsSaatlerStr, setBogazHsSaatlerStr] = useState('');
  const [bogazFiyatForm, setBogazFiyatForm] = useState('');
  const [bogazKalkisNoktaStr, setBogazKalkisNoktaStr] = useState('');
  const [bogazKalkisYeri, setBogazKalkisYeri] = useState('');
  const [bogazOzelNot, setBogazOzelNot] = useState('');

  // Yeni ekleme modlari
  const [yeniSeferModu, setYeniSeferModu] = useState(false);
  const [yeniSeferAdi, setYeniSeferAdi] = useState('');
  const [yeniSeferHavalimani, setYeniSeferHavalimani] = useState('IST');
  const [yeniBogazModu, setYeniBogazModu] = useState(false);
  const [yeniBogazSirket, setYeniBogazSirket] = useState('');
  const [yeniBogazSirketId, setYeniBogazSirketId] = useState('');
  const [yeniBogazTurTipi, setYeniBogazTurTipi] = useState('standart');
  const [yeniBogazRenk, setYeniBogazRenk] = useState(Palette.kobalt);
  const [yeniBogazSure, setYeniBogazSure] = useState('');

  const veriCek = async () => {
    setYukleniyor(true);
    if (tip === 'bogaz') {
      const { data } = await supabase.from('bogaz_turlari').select('*').eq('aktif', true).order('sirket_id');
      setBogazTurlar((data as BogazTuru[]) || []);
    } else {
      const { data } = await supabase.from('havalimani_seferleri').select('*').eq('firma', firma).eq('aktif', true).order('durak_adi');
      setSeferler((data as HavalimaniSefer[]) || []);
    }
    setYukleniyor(false);
  };

  useEffect(() => { if (isYetkili) veriCek(); }, [tip, firma, isYetkili]);

  const yeniSeferAc = () => {
    setYeniSeferModu(true);
    setSeciliSefer(null);
    setYeniSeferAdi('');
    setYeniSeferHavalimani(firma === 'havaist' ? 'IST' : 'SAW');
    setSehirdenHavStr('');
    setHavdanSehirStr('');
    setSehirdenHavGuzergah('');
    setHavdanSehirGuzergah('');
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
    setYeniBogazRenk(Palette.kobalt);
    setYeniBogazSure('');
    setBogazSaatlerStr('');
    setBogazHsSaatlerStr('');
    setBogazFiyatForm('');
    setBogazKalkisNoktaStr('');
    setBogazKalkisYeri('');
    setBogazOzelNot('');
    setBogazModal(true);
  };

  const seferDuzenleAc = (s: HavalimaniSefer) => {
    setYeniSeferModu(false);
    setSeciliSefer(s);
    setSehirdenHavStr((s.sehirden_hav || []).join(', '));
    setHavdanSehirStr((s.havdan_sehir || []).join(', '));
    setSehirdenHavGuzergah(s.sehirden_hav_guzergah || '');
    setHavdanSehirGuzergah(s.havdan_sehir_guzergah || '');
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
        Alert.alert('Hata', 'Durak adı boş olamaz.');
        return;
      }
      const durakId = yeniSeferAdi.trim().toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '_').replace(/_+/g, '_');
      const { error } = await supabase.from('havalimani_seferleri').insert({
        firma: firma === 'havaist' ? 'havaist' : 'havabus',
        havalimani: yeniSeferHavalimani,
        durak_id: durakId,
        durak_adi: yeniSeferAdi.trim(),
        sehirden_hav: yeniSehirden,
        havdan_sehir: yeniHavdan,
        sehirden_hav_guzergah: sehirdenHavGuzergah.trim() || null,
        havdan_sehir_guzergah: havdanSehirGuzergah.trim() || null,
        fiyat: fiyatForm || null,
        sure: sureForm || null,
        aktif: true,
        guncelleme_tarihi: new Date().toISOString(),
        guncelleyen: user?.id,
      });

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', `${yeniSeferAdi.trim()} eklendi.`);
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
          sehirden_hav_guzergah: sehirdenHavGuzergah.trim() || null,
          havdan_sehir_guzergah: havdanSehirGuzergah.trim() || null,
          fiyat: fiyatForm || null,
          sure: sureForm || null,
          guncelleme_tarihi: new Date().toISOString(),
          guncelleyen: user?.id,
        })
        .eq('id', seciliSefer.id);

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', `${seciliSefer.durak_adi} seferleri güncellendi.`);
        setSeferModal(false);
        veriCek();
      }
    }
  };

  const bogazDuzenleAc = (t: BogazTuru) => {
    setYeniBogazModu(false);
    setSeciliTur(t);
    setBogazSaatlerStr((t.hafta_ici_saatler || []).join(', '));
    setBogazHsSaatlerStr((t.hafta_sonu_saatler || []).join(', '));
    setBogazFiyatForm(t.fiyat || '');
    setBogazKalkisYeri(t.kalkis_yeri || '');
    setBogazOzelNot(t.ozel_not || '');
    // kalkis_noktalari: [{durak, fiyat}] → "Kabatas: 300 TL, Besiktas: 250 TL"
    const knStr = (t.kalkis_noktalari || []).map((k: any) => `${k.durak}: ${k.fiyat}`).join(', ');
    setBogazKalkisNoktaStr(knStr);
    setBogazModal(true);
  };

  const bogazKaydet = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const saatParse = (str: string) => str.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s));
    const yeniSaatler = saatParse(bogazSaatlerStr);

    // kalkis_noktalari parse: "Kabatas: 300 TL, Besiktas: 250 TL" → [{durak, fiyat}]
    const kalkisNoktaParse = (str: string) => {
      if (!str.trim()) return [];
      return str.split(',').map(s => {
        const [durak, ...fiyatParts] = s.split(':');
        return { durak: (durak || '').trim(), fiyat: fiyatParts.join(':').trim() };
      }).filter(k => k.durak);
    };

    const hsSaatler = saatParse(bogazHsSaatlerStr);
    const kalkisNoktalari = kalkisNoktaParse(bogazKalkisNoktaStr);

    if (yeniBogazModu) {
      if (!yeniBogazSirket.trim()) {
        Alert.alert('Hata', 'Şirket adı boş olamaz.');
        return;
      }
      if (!yeniBogazSirketId.trim()) {
        Alert.alert('Hata', 'Şirket ID boş olamaz. Örnek: turyol, dentur, sehirhatlari_kisa');
        return;
      }
      const sirketId = yeniBogazSirketId.trim();
      const { error } = await supabase.from('bogaz_turlari').insert({
        sirket_id: sirketId,
        sirket_adi: yeniBogazSirket.trim(),
        renk: yeniBogazRenk,
        tur_tipi: yeniBogazTurTipi,
        fiyat: bogazFiyatForm || null,
        sure: yeniBogazSure || null,
        hafta_ici_saatler: yeniSaatler,
        hafta_sonu_saatler: hsSaatler.length > 0 ? hsSaatler : yeniSaatler,
        gidis_guzergah: [],
        donus_guzergah: [],
        kalkis_noktalari: kalkisNoktalari,
        kalkis_yeri: bogazKalkisYeri || null,
        ozel_not: bogazOzelNot || null,
        aktif: true,
        aktif_mevsim: 'kis',
        guncelleme_tarihi: new Date().toISOString(),
        guncelleyen: user?.id,
      });

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', `${yeniBogazSirket.trim()} eklendi.`);
        setBogazModal(false);
        veriCek();
      }
    } else {
      if (!seciliTur) return;
      const { error } = await supabase
        .from('bogaz_turlari')
        .update({
          hafta_ici_saatler: yeniSaatler,
          hafta_sonu_saatler: hsSaatler.length > 0 ? hsSaatler : yeniSaatler,
          fiyat: bogazFiyatForm || null,
          kalkis_noktalari: kalkisNoktalari.length > 0 ? kalkisNoktalari : (seciliTur.kalkis_noktalari || []),
          kalkis_yeri: bogazKalkisYeri || seciliTur.kalkis_yeri || null,
          ozel_not: bogazOzelNot || null,
          guncelleme_tarihi: new Date().toISOString(),
          guncelleyen: user?.id,
        })
        .eq('id', seciliTur.id);

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        Alert.alert('Başarılı', `${seciliTur.sirket_adi} turları güncellendi.`);
        setBogazModal(false);
        veriCek();
      }
    }
  };

  return (
    <View style={s.kutu}>
      {/* Havalimanı modunda firma seçici (HAVAiST / HAVABUS) */}
      {tip === 'havalimani' && (
        <View style={s.firmaKutu}>
          <Segmentler
            secenekler={[
              { id: 'havaist' as Firma, baslik: 'HAVAiST' },
              { id: 'havabus' as Firma, baslik: 'HAVABUS' },
            ]}
            aktif={firma}
            onSec={setFirma}
          />
        </View>
      )}

      <View style={s.ustSatir}>
        {/* Yeni Ekle Butonu */}
        <BirincilButon
          baslik={tip === 'bogaz' ? '+ Yeni Boğaz Turu Ekle' : '+ Yeni Güzergâh Ekle'}
          onPress={tip === 'bogaz' ? yeniBogazAc : yeniSeferAc}
          varyant="cta"
          style={s.yeniEkleBtn}
        />
        <TouchableOpacity onPress={veriCek} style={s.yenileBtn} activeOpacity={0.7}>
          <Text style={s.yenileYazi}>Yenile</Text>
        </TouchableOpacity>
      </View>

      {yukleniyor ? (
        <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 16 }} />
      ) : tip === 'bogaz' ? (
        /* BOGAZ TURLARI */
        bogazTurlar.length === 0 ? (
          <BosDurum metin="Boğaz turu bulunamadı." />
        ) : (
          bogazTurlar.map(t => (
            <TouchableOpacity key={t.id} style={s.kartKutu} onPress={() => bogazDuzenleAc(t)} activeOpacity={0.7}>
              <View style={[s.kartRenk, { backgroundColor: t.renk }]} />
              <View style={s.kartBilgi}>
                <Text style={s.kartIsim}>{t.sirket_adi}</Text>
                <Text style={s.kartAlt}>
                  {t.tur_tipi === 'standart' ? (t.kalkis_yeri || 'Çoklu kalkış') : `${t.tur_tipi} tur`}
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
          <BosDurum metin="Sefer bulunamadı." />
        ) : (
          seferler.map(sf => (
            <TouchableOpacity key={sf.id} style={s.kartKutu} onPress={() => seferDuzenleAc(sf)} activeOpacity={0.7}>
              <View style={[s.kartRenk, { backgroundColor: t.primary }]} />
              <View style={s.kartBilgi}>
                <Text style={s.kartIsim}>{sf.durak_adi}</Text>
                <Text style={s.kartAlt}>
                  {sf.not_bilgi || sf.havalimani}
                  {sf.fiyat ? ` — ${sf.fiyat}` : ''}
                  {sf.sure ? ` (${sf.sure})` : ''}
                </Text>
                <Text style={s.kartSaat}>
                  Şehir→Hav: {sf.sehirden_hav?.length || 0} sefer / Hav→Şehir: {sf.havdan_sehir?.length || 0} sefer
                </Text>
                {sf.tarife_donemi && <Text style={s.kartDonemi}>Tarife: {sf.tarife_donemi}</Text>}
              </View>
              <Text style={s.kartOk}>{'>'}</Text>
            </TouchableOpacity>
          ))
        )
      )}

      {/* Sefer Duzenleme Modali */}
      <Modal visible={seferModal} transparent animationType="slide" onRequestClose={() => setSeferModal(false)}>
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalBaslik}>{yeniSeferModu ? 'Yeni Güzergâh Ekle' : seciliSefer?.durak_adi}</Text>
              <Text style={s.modalAlt}>{yeniSeferModu ? (firma === 'havaist' ? 'HAVAiST' : 'HAVABUS') : `${seciliSefer?.firma?.toUpperCase()} — ${seciliSefer?.havalimani}`}</Text>

              {yeniSeferModu && (
                <>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Durak Adı *</Text>
                    <TextInput style={s.input} value={yeniSeferAdi} onChangeText={setYeniSeferAdi} placeholder="Örnek: Taksim" />
                  </View>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Havalimani</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {['IST', 'SAW'].map(h => (
                        <TouchableOpacity key={h}
                          style={[s.havSecBtn, yeniSeferHavalimani === h && s.havSecBtnAktif]}
                          onPress={() => setYeniSeferHavalimani(h)}>
                          <Text style={[s.havSecYazi, yeniSeferHavalimani === h && s.havSecYaziAktif]}>
                            {h === 'IST' ? 'İstanbul (IST)' : 'Sabiha Gökçen (SAW)'}
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
                    <Text style={s.inputLabel}>Süre</Text>
                    <TextInput style={s.input} value={sureForm} onChangeText={setSureForm} placeholder="~90 dk" />
                  </View>
                </View>
              )}

              <Text style={s.bolumBaslik}>
                Şehir → Havalimanı ({sehirdenHavStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <Text style={s.ipucu}>Saatleri virgül ile ayırın: 08:00, 09:30, 10:00</Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={sehirdenHavStr}
                onChangeText={setSehirdenHavStr} multiline placeholder="08:00, 09:00, 10:00..." />

              <View style={{ marginTop: 8 }}>
                <Text style={s.inputLabel}>Şehir → Havalimanı Güzergahı</Text>
                <Text style={s.ipucu}>Örnek: Aksaray Metro - O-3 - Mahmutbey - Basın Ekspres - Havalimanı</Text>
                <TextInput style={[s.input, s.inputCokSatir]} value={sehirdenHavGuzergah}
                  onChangeText={setSehirdenHavGuzergah} multiline
                  placeholder="Bu yönde geçilen ana duraklar/yollar..." />
              </View>

              <Text style={s.bolumBaslik}>
                Havalimanı → Şehir ({havdanSehirStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={havdanSehirStr}
                onChangeText={setHavdanSehirStr} multiline placeholder="08:00, 09:00, 10:00..." />

              <View style={{ marginTop: 8 }}>
                <Text style={s.inputLabel}>Havalimanı → Şehir Güzergahı</Text>
                <Text style={s.ipucu}>Örnek: Havalimanı - Basın Ekspres - Mahmutbey - O-3 - Aksaray Metro</Text>
                <TextInput style={[s.input, s.inputCokSatir]} value={havdanSehirGuzergah}
                  onChangeText={setHavdanSehirGuzergah} multiline
                  placeholder="Bu yönde geçilen ana duraklar/yollar..." />
              </View>

              <BirincilButon baslik="Kaydet" onPress={seferKaydet} varyant="kobalt" style={s.kaydetBtn} />
              <BirincilButon baslik="İptal" onPress={() => setSeferModal(false)} varyant="hayalet" style={s.iptalBtn} />
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
              <Text style={s.modalBaslik}>{yeniBogazModu ? 'Yeni Boğaz Turu Ekle' : seciliTur?.sirket_adi}</Text>
              <Text style={s.modalAlt}>{yeniBogazModu ? 'Boğaz Turları' : `${seciliTur?.tur_tipi} tur — ${seciliTur?.tarife_donemi}`}</Text>

              {yeniBogazModu && (
                <>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Şirket Adı *</Text>
                    <TextInput style={s.input} value={yeniBogazSirket} onChangeText={setYeniBogazSirket} placeholder="Örnek: Dentur Avrasya" />
                  </View>
                  <View style={s.inputGrup}>
                    <Text style={s.inputLabel}>Şirket ID * (küçük harf, boşluksuz)</Text>
                    <TextInput style={s.input} value={yeniBogazSirketId} onChangeText={setYeniBogazSirketId}
                      placeholder="turyol, dentur, sehirhatlari_kisa" autoCapitalize="none" />
                  </View>
                  <View style={s.satirKutu}>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Tur Tipi</Text>
                      <TextInput style={s.input} value={yeniBogazTurTipi} onChangeText={setYeniBogazTurTipi} placeholder="standart/uzun/kisa" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Süre</Text>
                      <TextInput style={s.input} value={yeniBogazSure} onChangeText={setYeniBogazSure} placeholder="~2 saat" />
                    </View>
                    <View style={s.inputGrup}>
                      <Text style={s.inputLabel}>Renk</Text>
                      <TextInput style={s.input} value={yeniBogazRenk} onChangeText={setYeniBogazRenk} placeholder={Palette.kobalt} placeholderTextColor={t.textMuted} />
                    </View>
                  </View>
                </>
              )}

              <View style={s.satirKutu}>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Fiyat (genel)</Text>
                  <TextInput style={s.input} value={bogazFiyatForm} onChangeText={setBogazFiyatForm} placeholder="300 TL" />
                </View>
                <View style={s.inputGrup}>
                  <Text style={s.inputLabel}>Kalkış Yeri</Text>
                  <TextInput style={s.input} value={bogazKalkisYeri} onChangeText={setBogazKalkisYeri} placeholder="Eminonu" />
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={s.inputLabel}>Kalkış Noktaları ve Fiyatları</Text>
                <Text style={s.ipucu}>Format: Kabatas: 300 TL, Besiktas: 250 TL</Text>
                <TextInput style={[s.input, { marginTop: 4 }]} value={bogazKalkisNoktaStr}
                  onChangeText={setBogazKalkisNoktaStr} placeholder="Kabatas: 300 TL, Besiktas: 250 TL" />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={s.inputLabel}>Özel Not</Text>
                <TextInput style={s.input} value={bogazOzelNot} onChangeText={setBogazOzelNot} placeholder="Opsiyonel açıklama..." />
              </View>

              <Text style={s.bolumBaslik}>
                Hafta İçi Saatleri ({bogazSaatlerStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <Text style={s.ipucu}>Saatleri virgül ile ayırın: 10:00, 11:00, 12:00</Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={bogazSaatlerStr}
                onChangeText={setBogazSaatlerStr} multiline placeholder="10:00, 11:00, 12:00..." />

              <Text style={s.bolumBaslik}>
                Hafta Sonu Saatleri ({bogazHsSaatlerStr.split(',').filter(s => s.trim()).length} sefer)
              </Text>
              <Text style={s.ipucu}>Boş bırakırsanız hafta içi saatleri kullanılır</Text>
              <TextInput style={[s.input, s.inputCokSatir]} value={bogazHsSaatlerStr}
                onChangeText={setBogazHsSaatlerStr} multiline placeholder="10:00, 11:00, 12:00..." />

              <BirincilButon baslik="Kaydet" onPress={bogazKaydet} varyant="kobalt" style={s.kaydetBtn} />
              <BirincilButon baslik="İptal" onPress={() => setBogazModal(false)} varyant="hayalet" style={s.iptalBtn} />
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  kutu: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },

  // Firma seçici (Segmentler sarmalayıcısı)
  firmaKutu: { marginBottom: 10 },

  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  yenileBtn: { paddingHorizontal: 10, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  yenileYazi: { fontFamily: Font.bold, color: t.primary, fontSize: 12 },

  kartKutu: { backgroundColor: t.bgCard, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: t.kartBorder, minHeight: 44 },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartBilgi: { flex: 1, padding: 14 },
  kartIsim: { fontFamily: Font.bold, fontSize: 15, color: t.text, letterSpacing: -0.3 },
  kartAlt: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginTop: 3 },
  kartSaat: { fontFamily: Font.semibold, fontSize: 11, color: t.primary, marginTop: 3 },
  kartDonemi: { fontFamily: Font.regular, fontSize: 10, color: t.textMuted, marginTop: 2 },
  kartOk: { fontFamily: Font.regular, color: t.textMuted, fontSize: 20, marginRight: 16 },

  // Modal (mevcut yapı; sadece renk/tipografi)
  modalArka: { flex: 1, backgroundColor: t.modalOverlay, justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: t.modalBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  modalBaslik: { fontFamily: Font.extrabold, color: t.text, fontSize: 20, letterSpacing: -0.3 },
  modalAlt: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 12, marginBottom: 8 },
  bolumBaslik: { fontFamily: Font.bold, color: t.text, fontSize: 13, marginTop: 16, marginBottom: 4 },
  ipucu: { fontFamily: Font.regular, color: t.textMuted, fontSize: 11, marginBottom: 6 },
  satirKutu: { flexDirection: 'row', gap: 10, marginTop: 8 },
  inputGrup: { flex: 1 },
  inputLabel: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 11, marginBottom: 4 },
  input: { minHeight: 48, backgroundColor: t.bgInput, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder },
  inputCokSatir: { marginTop: 4, minHeight: 80, textAlignVertical: 'top' },
  kaydetBtn: { marginTop: 20 },
  iptalBtn: { marginTop: 10 },

  // Yeni ekle (BirincilButon cta)
  yeniEkleBtn: { flex: 1 },
  havSecBtn: { flex: 1, paddingVertical: 10, minHeight: 44, borderRadius: Radius.sm, backgroundColor: t.bgSecondary, borderWidth: 1, borderColor: t.kartBorder, alignItems: 'center', justifyContent: 'center' },
  havSecBtnAktif: { backgroundColor: t.primary, borderColor: t.primary },
  havSecYazi: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary },
  havSecYaziAktif: { color: '#FFFFFF' },
});
