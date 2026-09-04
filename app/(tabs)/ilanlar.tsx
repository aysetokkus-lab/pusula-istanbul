// Eyl 2026 — "İş İlanları" sekmesi (yeni ekran), "Kobalt & Menekşe" tasarım dili.
// Yedek rehber arama / transfer ilanları: liste + filtreler + ilan formu + bildirim dilleri.
// Veri: hooks/use-ilanlar.ts (realtime + polling). Push filtresi profiles.diller üzerinden sunucuda çalışır.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTema } from '../../hooks/use-tema';
import { useAdmin } from '../../hooks/use-admin';
import { konusmaBaslat } from '../../hooks/use-dm';
import { useTelefonGerekli } from '../../components/telefon-modal';
import { telefonNumaraRaporla } from '../../hooks/use-ilanlar';
import { TELEFON_HATA, telefonNormalize } from '../../lib/telefon';
import { TurebRozet } from '../../components/tureb-rozet';
import { useTurebRozetleri, type TurebDurum } from '../../hooks/use-tureb';
// Eyl 2026: ilan sahibinin profil fotoğrafı (yoksa harf)
import { Avatar } from '../../components/avatar';
import { useAvatarlar } from '../../hooks/use-avatarlar';
import { useIlanlar, useProfilDilleri, gunStr, type Ilan, type IlanPayload, type IlanSonuc, type IlanSure, type IlanTur } from '../../hooks/use-ilanlar';
import { DILLER, dilKisa } from '../../constants/diller';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, GradyanHeader, HeaderBaslik, Kart, Kicker, ModalKapak, Rozet, Segmentler } from '../../components/ui/pusula-ui';
import { Takvim, tarihUzun } from '../../components/ui/takvim';
import { SaatSecici } from '../../components/ui/saat-secici';
import { tabanUcret, tlFormat, ucretSayi, TUREB_TABAN_YILI } from '../../constants/tureb-taban';

/* ═══════════════════════════════════════════
   Sabitler
   ═══════════════════════════════════════════ */
type Filtre = 'tumu' | 'rehber_araniyor' | 'diger' | 'benim';

const FILTRE_SECENEK: { id: Filtre; baslik: string }[] = [
  { id: 'tumu', baslik: 'Tümü' },
  { id: 'rehber_araniyor', baslik: 'Rehber aranıyor' },
  { id: 'diger', baslik: 'Diğer' },
  { id: 'benim', baslik: 'İlanlarım' },
];

const TUR_SECENEK: { id: IlanTur; baslik: string }[] = [
  { id: 'rehber_araniyor', baslik: 'Rehber aranıyor' },
  { id: 'diger', baslik: 'Transfer / Diğer' },
];

const SURE_SECENEK: { id: IlanSure; baslik: string }[] = [
  { id: 'yarim_gun', baslik: 'Yarım gün' },
  { id: 'tam_gun', baslik: 'Tam gün' },
  { id: 'coklu_gun', baslik: 'Çok gün' },
  { id: 'transfer', baslik: 'Transfer' },
  { id: 'diger', baslik: 'Diğer' },
];

const SURE_ETIKET: Record<IlanSure, string> = {
  yarim_gun: 'Yarım gün',
  tam_gun: 'Tam gün',
  coklu_gun: 'Çok günlü',
  transfer: 'Transfer',
  diger: 'Diğer',
};

const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/* ═══════════════════════════════════════════
   Yardımcılar
   ═══════════════════════════════════════════ */
function turBilgi(tur: IlanTur, t: TemaRenkleri): { etiket: string; renk: string } {
  if (tur === 'rehber_araniyor') return { etiket: 'Rehber aranıyor', renk: Palette.safran };
  if (tur === 'is_ariyorum') return { etiket: 'İş arıyorum', renk: t.primary }; // eski kayıtlar için
  return { etiket: 'Diğer', renk: Palette.bilgi };
}

function isoToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** "Yarın · 09:00" / "Cmt 6 Eyl · 14:00" */
function tarihEtiket(tarih: string, saat: string | null, bitis?: string | null): string {
  // 4 Eyl 2026: çok günlü ilan → "12 – 30 Eyl (19 gün) · 09:00"
  if (bitis && bitis > tarih) {
    const d1 = isoToDate(tarih), d2 = isoToDate(bitis);
    if (d1 && d2) {
      const n = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
      const aralik = d1.getMonth() === d2.getMonth()
        ? `${d1.getDate()} – ${d2.getDate()} ${AY_KISA[d1.getMonth()]} (${n} gün)`
        : `${d1.getDate()} ${AY_KISA[d1.getMonth()]} – ${d2.getDate()} ${AY_KISA[d2.getMonth()]} (${n} gün)`;
      return saat ? `${aralik} · ${saat}` : aralik;
    }
  }
  const d = isoToDate(tarih);
  let metin = tarih;
  if (d) {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const fark = Math.round((d.getTime() - bugun.getTime()) / 86400000);
    if (fark === 0) metin = 'Bugün';
    else if (fark === 1) metin = 'Yarın';
    else if (fark === -1) metin = 'Dün';
    else metin = `${GUN_KISA[d.getDay()]} ${d.getDate()} ${AY_KISA[d.getMonth()]}`;
  }
  return saat ? `${metin} · ${saat}` : metin;
}

function zamanOnce(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return 'şimdi';
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} sa önce`;
  const gun = Math.floor(saat / 24);
  if (gun < 7) return `${gun} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

/** tel: için — rakam ve + dışında her şeyi at */
function telNumara(iletisim: string): string {
  return (iletisim || '').replace(/[^\d+]/g, '');
}

/** wa.me için — 0 / 00 / + temizle, 10 haneli TR numaraya 90 ekle */
function waNumara(iletisim: string): string {
  let d = (iletisim || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = `90${d}`;
  return d;
}

/** "9:5" → "09:05"; geçersizse null */
function saatNormalize(metin: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(metin.trim());
  if (!m) return null;
  const h = Number(m[1]), dk = Number(m[2]);
  if (h > 23 || dk > 59) return null;
  return `${h < 10 ? `0${h}` : h}:${dk < 10 ? `0${dk}` : dk}`;
}

function dilEsit(a: string, b: string): boolean {
  return a.toLocaleLowerCase('tr') === b.toLocaleLowerCase('tr');
}

/* ═══════════════════════════════════════════
   Dil çipi (dokunulabilir Rozet)
   ═══════════════════════════════════════════ */
function DilChip({ dil, secili, onPress, kisa, renk }: { dil: string; secili: boolean; onPress: () => void; kisa?: boolean; renk?: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }} style={s.chipDokun}>
      <Rozet renk={renk} dolu={secili} style={s.chip}>{kisa ? dilKisa(dil) : dil}</Rozet>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════
   İLAN KARTI
   ═══════════════════════════════════════════ */
function IlanKarti({ ilan, benim, isYetkili, onDurum, onSil, onKaldir, onMesaj, onNumaraRaporla, tureb, avatarUrl, t }: {
  ilan: Ilan;
  benim: boolean;
  isYetkili: boolean;
  onDurum: (id: string, durum: 'dolduruldu' | 'aktif') => void;
  onSil: (ilan: Ilan) => void;
  onKaldir: (ilan: Ilan) => void;
  onMesaj: (ilan: Ilan) => void;   // Eyl 2026: özel mesaj
  onNumaraRaporla: (ilan: Ilan) => void;   // Eyl 2026: numara yanlış/sahte bildirimi
  tureb?: { durum: TurebDurum | null; oda: string | null };   // Eyl 2026: ilan sahibinin TUREB rozeti
  avatarUrl?: string | null;   // Eyl 2026: ilan sahibinin profil fotoğrafı
  t: TemaRenkleri;
}) {
  const tur = turBilgi(ilan.tur, t);
  const dolduruldu = ilan.durum === 'dolduruldu';
  const diller = ilan.diller || [];

  const meta: string[] = [];
  if (ilan.sure) meta.push(SURE_ETIKET[ilan.sure] || ilan.sure);
  if (ilan.grup_buyuklugu) meta.push(`${ilan.grup_buyuklugu} kişi`);
  if (ilan.ucret) meta.push(ilan.ucret);

  const ara = () => {
    const num = telNumara(ilan.iletisim);
    if (!num) { Alert.alert('Numara yok', 'Bu ilanda geçerli bir telefon numarası yok.'); return; }
    Linking.openURL(`tel:${num}`).catch(() => Alert.alert('Hata', 'Arama başlatılamadı.'));
  };
  const whatsapp = () => {
    const num = waNumara(ilan.iletisim);
    if (!num) { Alert.alert('Numara yok', 'Bu ilanda geçerli bir telefon numarası yok.'); return; }
    Linking.openURL(`https://wa.me/${num}`).catch(() => Alert.alert('Hata', 'WhatsApp açılamadı.'));
  };

  return (
    <Kart style={dolduruldu ? { opacity: 0.55 } : undefined}>
      {/* Üst satır: tür rozeti + tarih + dil rozetleri */}
      <View style={s.kartUst}>
        <Rozet renk={tur.renk} dolu>{tur.etiket}</Rozet>
        <Text style={[s.kartTarih, { color: t.text }]}>{tarihEtiket(ilan.tarih, ilan.saat, ilan.bitis_tarih)}</Text>
        {dolduruldu && <Rozet renk={t.textMuted}>DOLDURULDU</Rozet>}
        {diller.map(d => <Rozet key={d} renk={t.secondary}>{dilKisa(d)}</Rozet>)}
      </View>

      <Text style={[s.kartBaslik, { color: t.text }]} numberOfLines={2}>{ilan.baslik}</Text>

      {meta.length > 0 && (
        <Text style={[s.kartMeta, { color: t.textSecondary }]} numberOfLines={1}>{meta.join(' · ')}</Text>
      )}

      {ilan.aciklama ? (
        <Text style={[s.kartAciklama, { color: t.textSecondary }]} numberOfLines={3}>{ilan.aciklama}</Text>
      ) : null}

      {/* Alt bar: isim + zaman · Ara / WhatsApp / Mesaj (kendi ilanı değilse) */}
      <View style={s.kartAlt}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Avatar url={avatarUrl} isim={ilan.kullanici_isim || 'Rehber'} boyut={22} />
          <Text style={[s.kartSahip, { color: t.textMuted, flex: 0 }]} numberOfLines={1}>
            {ilan.kullanici_isim || 'Rehber'} · {zamanOnce(ilan.created_at)}
          </Text>
          <TurebRozet durum={tureb?.durum} oda={tureb?.oda} />
        </View>
        <View style={s.kartAksiyonlar}>
          <TouchableOpacity onPress={ara} activeOpacity={0.75} hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }} style={[s.pill, { backgroundColor: t.primary }]}>
            <Text style={s.pillYazi}>Ara</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={whatsapp} activeOpacity={0.75} hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }} style={[s.pill, { backgroundColor: Palette.acik }]}>
            <Text style={s.pillYazi}>WhatsApp</Text>
          </TouchableOpacity>
          {!benim && (
            <TouchableOpacity onPress={() => onMesaj(ilan)} activeOpacity={0.75} hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }} style={[s.pill, { backgroundColor: t.secondary }]} accessibilityLabel="Özel mesaj gönder">
              <Text style={s.pillYazi}>Mesaj</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Eyl 2026: beyan usulü numara — başkasının ilanında "numara yanlış" bildirimi */}
      {!benim && (
        <TouchableOpacity onPress={() => onNumaraRaporla(ilan)} activeOpacity={0.6} style={s.numaraBildir} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityLabel="Numarayı bildir">
          <Text style={[s.numaraBildirYazi, { color: t.textMuted }]}>Numaraya ulaşılamıyor mu? Bildir</Text>
        </TouchableOpacity>
      )}

      {/* Sahip aksiyonları */}
      {benim && (
        <View style={[s.aksiyonBar, { borderTopColor: t.divider }]}>
          <TouchableOpacity onPress={() => onDurum(ilan.id, dolduruldu ? 'aktif' : 'dolduruldu')} style={s.aksiyonBtn} activeOpacity={0.6}>
            <Text style={[s.aksiyonYazi, { color: dolduruldu ? Palette.acik : t.primary }]}>{dolduruldu ? 'Yeniden aç' : 'Dolduruldu'}</Text>
          </TouchableOpacity>
          <View style={[s.aksiyonAyrac, { backgroundColor: t.divider }]} />
          <TouchableOpacity onPress={() => onSil(ilan)} style={s.aksiyonBtn} activeOpacity={0.6}>
            <Text style={[s.aksiyonYazi, { color: t.durumKapali }]}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin / moderatör: kaldır (kendi ilanında zaten Sil var) */}
      {isYetkili && !benim && (
        <View style={[s.aksiyonBar, { borderTopColor: t.divider }]}>
          <TouchableOpacity onPress={() => onKaldir(ilan)} style={s.aksiyonBtn} activeOpacity={0.6}>
            <Text style={[s.aksiyonYazi, { color: t.durumKapali }]}>Kaldır</Text>
          </TouchableOpacity>
        </View>
      )}
    </Kart>
  );
}

/* ═══════════════════════════════════════════
   BİLDİRİM DİLLERİ MODALI
   ═══════════════════════════════════════════ */
function BildirimDilleriModal({ visible, mevcut, onKapat, onKaydet, t }: {
  visible: boolean;
  mevcut: string[];
  onKapat: () => void;
  onKaydet: (diller: string[]) => Promise<boolean>;
  t: TemaRenkleri;
}) {
  const [secili, setSecili] = useState<string[]>(mevcut);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => { if (visible) setSecili(mevcut); }, [visible, mevcut]);

  const toggle = (d: string) => {
    setSecili(prev => (prev.some(x => dilEsit(x, d)) ? prev.filter(x => !dilEsit(x, d)) : [...prev, d]));
  };

  const kaydet = async () => {
    setKaydediliyor(true);
    const ok = await onKaydet(secili);
    setKaydediliyor(false);
    if (ok) onKapat();
    else Alert.alert('Hata', 'Dil tercihi kaydedilemedi. Bağlantını kontrol et.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onKapat}>
      <ModalKapak baslik="Bildirim dillerim" onKapat={onKapat}>
        <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={s.chipSarmal} keyboardShouldPersistTaps="handled">
          {DILLER.map(d => (
            <DilChip key={d} dil={d} secili={secili.some(x => dilEsit(x, d))} onPress={() => toggle(d)} />
          ))}
        </ScrollView>
        <Text style={[s.modalNot, { color: t.textMuted }]}>
          {secili.length === 0 ? 'Dil seçilmedi — tüm ilanlar için bildirim gelir' : `${secili.length} dil seçili`}
        </Text>
        <BirincilButon baslik="Kaydet" onPress={kaydet} varyant="cta" yukleniyor={kaydediliyor} style={{ marginTop: 10 }} />
      </ModalKapak>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   İLAN FORMU MODALI
   ═══════════════════════════════════════════ */
function IlanFormModal({ visible, profilDilleri, profilTelefon, onKapat, onKaydet, telefonKaydet, t }: {
  visible: boolean;
  profilDilleri: string[];
  profilTelefon: string;
  onKapat: () => void;
  onKaydet: (p: IlanPayload) => Promise<IlanSonuc>;
  telefonKaydet: (tel: string) => Promise<boolean>;
  t: TemaRenkleri;
}) {
  const [tur, setTur] = useState<IlanTur>('rehber_araniyor');
  const [baslik, setBaslik] = useState('');
  const [tarihISO, setTarihISO] = useState<string | null>(null);
  const [bitisISO, setBitisISO] = useState<string | null>(null);   // 4 Eyl 2026: çok gün
  const [saat, setSaat] = useState('');
  const [sure, setSure] = useState<IlanSure>('tam_gun');
  const [diller, setDiller] = useState<string[]>([]);
  const [grup, setGrup] = useState('');
  const [ucret, setUcret] = useState('');
  const [iletisim, setIletisim] = useState('');
  const [profileKaydet, setProfileKaydet] = useState(true);
  const [aciklama, setAciklama] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Açılışta formu sıfırla; profil dilleri ve telefon ön-dolu
  useEffect(() => {
    if (!visible) return;
    setTur('rehber_araniyor');
    setBaslik('');
    setTarihISO(null);
    setBitisISO(null);
    setSaat('');
    setSure('tam_gun');
    setDiller(profilDilleri);
    setGrup('');
    setUcret('');
    setIletisim(profilTelefon || '');
    setProfileKaydet(true);
    setAciklama('');
    setKaydediliyor(false);
  }, [visible, profilDilleri, profilTelefon]);

  // Ücret alt sınırı: TUREB tabanı (süre + dillere göre)
  const taban = useMemo(() => tabanUcret(sure, diller), [sure, diller]);
  const ucretN = ucretSayi(ucret);
  const ucretDusuk = ucretN !== null && ucretN < taban.tutar;

  // Dil sırası: profil dilleri önce
  const dilSirasi = useMemo(
    () => [...profilDilleri, ...DILLER.filter(d => !profilDilleri.some(p => dilEsit(p, d)))],
    [profilDilleri],
  );
  const dilToggle = (d: string) => {
    setDiller(prev => (prev.some(x => dilEsit(x, d)) ? prev.filter(x => !dilEsit(x, d)) : [...prev, d]));
  };

  const kaydet = async () => {
    if (baslik.trim().length < 3) { Alert.alert('Eksik', 'Başlık en az 3 karakter olmalı.'); return; }
    if (!tarihISO) { Alert.alert('Eksik', 'Takvimden bir tarih seç.'); return; }
    let saatTemiz: string | null = null;
    if (saat.trim()) {
      saatTemiz = saatNormalize(saat);
      if (!saatTemiz) { Alert.alert('Hatalı saat', 'Saat 09:00 biçiminde olmalı.'); return; }
    }
    if (tur === 'rehber_araniyor' && diller.length === 0) { Alert.alert('Eksik', 'Rehber aranıyor ilanı için en az bir dil seç.'); return; }
    if (!iletisim.trim()) { Alert.alert('Eksik', 'İletişim telefonu zorunlu.'); return; }
    const iletisimE164 = telefonNormalize(iletisim);   // Eyl 2026: biçim kontrolü, E.164 saklanır
    if (!iletisimE164) { Alert.alert('Hatalı telefon', TELEFON_HATA); return; }
    if (ucret.trim()) {
      if (ucretN === null) { Alert.alert('Hatalı ücret', 'Ücreti sadece rakamla yaz (örn. 6000).'); return; }
      if (ucretN < taban.tutar) {
        Alert.alert('TUREB taban ücretinin altında', `${TUREB_TABAN_YILI} tabanı ${tlFormat(taban.tutar)} (${taban.etiket}). Bu tutarın altında ilan verilemez.`);
        return;
      }
    }

    if (sure === 'coklu_gun' && (!bitisISO || bitisISO <= tarihISO)) { Alert.alert('Eksik', 'Çok günlü ilan için bitiş tarihini seç (başlangıçtan sonra).'); return; }
    const grupSayi = parseInt(grup.replace(/\D/g, ''), 10);
    setKaydediliyor(true);
    try {
      const sonuc = await onKaydet({
        tur,
        baslik: baslik.trim(),
        aciklama: aciklama.trim() || null,
        diller,
        tarih: tarihISO,
        bitis_tarih: sure === 'coklu_gun' ? bitisISO : null,
        saat: saatTemiz,
        sure,
        grup_buyuklugu: isNaN(grupSayi) ? null : grupSayi,
        ucret: ucretN !== null ? `${tlFormat(ucretN)}${sure === 'coklu_gun' ? ' / gün' : ''}` : null,
        iletisim: iletisimE164,
      });
      if (!sonuc.ok) {
        Alert.alert('Hata', sonuc.hata || 'İlan kaydedilemedi.');
        return;
      }
      if (profileKaydet && iletisimE164 !== (profilTelefon || '').trim()) {
        telefonKaydet(iletisimE164); // arka planda; başarısızlık ilanı etkilemez
      }
      onKapat();
    } finally {
      setKaydediliyor(false);
    }
  };

  const inputStil = [s.input, { color: t.text, borderColor: t.kartBorder, backgroundColor: t.bgInput }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { if (!kaydediliyor) onKapat(); }}>
      <KeyboardAvoidingView behavior={undefined} /* klavye kaçınma ModalKapak içinde (4 Eyl 2026) */ style={{ flex: 1 }}>
        <ModalKapak baslik="İlan Ver" onKapat={() => { if (!kaydediliyor) onKapat(); }} altButonBaslik="İptal">
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Kicker style={s.formEtiket}>Tür</Kicker>
            <Segmentler<IlanTur> secenekler={TUR_SECENEK} aktif={tur} onSec={setTur} renk={tur === 'rehber_araniyor' ? Palette.safran : t.primary} />

            <Kicker style={s.formEtiket}>Başlık</Kicker>
            <TextInput
              style={inputStil}
              value={baslik}
              onChangeText={setBaslik}
              placeholder="Başlık"
              placeholderTextColor={t.textMuted}
              maxLength={120}
            />

            <Kicker style={s.formEtiket}>Tarih{tarihISO ? ` · ${tarihUzun(tarihISO)}` : ''}</Kicker>
            <Takvim value={tarihISO} onChange={setTarihISO} renk={Palette.safran} />
            <Kicker style={s.formEtiket}>Saat</Kicker>
            {/* 4 Eyl 2026: klavyesiz saat seçimi (iki nokta yazmak zordu) */}
            <SaatSecici value={saat} onChange={setSaat} renk={Palette.safran} />

            <Kicker style={s.formEtiket}>Süre</Kicker>
            <Segmentler<IlanSure> secenekler={SURE_SECENEK} aktif={sure} onSec={setSure} />
            {/* 4 Eyl 2026: çok günlü ilan → bitiş tarihi (Ajanda ile aynı desen) */}
            {sure === 'coklu_gun' ? (
              <>
                <Kicker style={s.formEtiket}>Bitiş{bitisISO ? ` · ${tarihUzun(bitisISO)}` : ''}</Kicker>
                <Takvim value={bitisISO} onChange={setBitisISO} renk={Palette.menekse} minDate={tarihISO ? (isoToDate(tarihISO) ?? undefined) : undefined} />
              </>
            ) : null}

            <Kicker style={s.formEtiket}>{tur === 'rehber_araniyor' ? 'Diller (zorunlu)' : 'Diller'}</Kicker>
            <View style={s.chipSarmal}>
              {dilSirasi.map(d => (
                <DilChip key={d} dil={d} secili={diller.some(x => dilEsit(x, d))} onPress={() => dilToggle(d)} renk={t.secondary} />
              ))}
            </View>

            <View style={s.ikiKolon}>
              <View style={{ flex: 1 }}>
                <Kicker style={s.formEtiket}>Grup</Kicker>
                <TextInput
                  style={inputStil}
                  value={grup}
                  onChangeText={setGrup}
                  placeholder="Kişi sayısı"
                  placeholderTextColor={t.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Kicker style={s.formEtiket}>Ücret{sure === 'coklu_gun' ? ' (günlük)' : ''}</Kicker>
                <TextInput
                  style={[inputStil, ucretDusuk && { borderColor: t.durumKapali }]}
                  value={ucret}
                  onChangeText={setUcret}
                  placeholder="TL"
                  placeholderTextColor={t.textMuted}
                  keyboardType="number-pad"
                  maxLength={7}
                />
                <Text style={[s.tabanNot, { color: ucretDusuk ? t.durumKapali : t.textSecondary }]}>
                  TUREB {TUREB_TABAN_YILI} tabanı {tlFormat(taban.tutar)} ({taban.etiket}) — altı yazılamaz
                </Text>
              </View>
            </View>

            <Kicker style={s.formEtiket}>İletişim telefonu</Kicker>
            <TextInput
              style={inputStil}
              value={iletisim}
              onChangeText={setIletisim}
              placeholder="05xx xxx xx xx"
              placeholderTextColor={t.textMuted}
              keyboardType="phone-pad"
              maxLength={20}
            />
            <View style={[s.switchSatir, { borderColor: t.kartBorder, backgroundColor: t.bgCard }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.switchBaslik, { color: t.text }]}>Profilime kaydet</Text>
              </View>
              <Switch
                value={profileKaydet}
                onValueChange={setProfileKaydet}
                trackColor={{ false: t.divider, true: t.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Kicker style={s.formEtiket}>Açıklama</Kicker>
            <TextInput
              style={[...inputStil, s.inputCok]}
              value={aciklama}
              onChangeText={setAciklama}
              placeholder="Açıklama"
              placeholderTextColor={t.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[s.sayac, { color: t.textMuted }]}>{aciklama.length} / 500</Text>

            <BirincilButon baslik="İlanı Yayınla" onPress={kaydet} varyant="cta" yukleniyor={kaydediliyor} disabled={kaydediliyor} style={{ marginTop: 14 }} />
          </ScrollView>
        </ModalKapak>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   EKRAN
   ═══════════════════════════════════════════ */
export default function IlanlarEkrani() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const { isYetkili } = useAdmin();
  const { ilanlar, yukleniyor, hata, benimId, yenile, ilanEkle, ilanSil, durumDegistir } = useIlanlar();
  const { diller: profilDilleri, kaydet: profilDilleriKaydet, telefon: profilTelefon, telefonKaydet } = useProfilDilleri();
  const { telefonGerekli, telefonModal } = useTelefonGerekli();  // Eyl 2026: DM için profilde telefon şart
  const sahipIdleri = useMemo(() => Array.from(new Set(ilanlar.map(i => i.kullanici_id))), [ilanlar]);
  const turebRozetleri = useTurebRozetleri(sahipIdleri);
  const avatarlar = useAvatarlar(sahipIdleri);   // Eyl 2026: profil fotoğrafları

  const [filtre, setFiltre] = useState<Filtre>('tumu');
  const [dilFiltre, setDilFiltre] = useState<string | null>(null);
  const [dilModal, setDilModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [yenileniyor, setYenileniyor] = useState(false);

  // Dil çipleri: profil dilleri önce, sonra ilanlarda geçen diller, sonra kalanlar
  const dilSirasi = useMemo(() => {
    const ilanDilleri = Array.from(new Set<string>(ilanlar.flatMap(i => i.diller || [])));
    const sira: string[] = [];
    const ekle = (d: string) => { if (!sira.some(x => dilEsit(x, d))) sira.push(d); };
    profilDilleri.forEach(ekle);
    ilanDilleri.forEach(ekle);
    DILLER.forEach(ekle);
    return sira;
  }, [profilDilleri, ilanlar]);

  const gosterilen = useMemo(() => ilanlar.filter(i => {
    if (filtre === 'benim') {
      if (!benimId || i.kullanici_id !== benimId) return false;
    } else if (filtre !== 'tumu' && i.tur !== filtre) {
      return false;
    }
    if (dilFiltre && !(i.diller || []).some(d => dilEsit(d, dilFiltre))) return false;
    return true;
  }), [ilanlar, filtre, dilFiltre, benimId]);

  const onYenile = useCallback(async () => {
    setYenileniyor(true);
    await yenile();
    setYenileniyor(false);
  }, [yenile]);

  const onDurum = useCallback(async (id: string, durum: 'dolduruldu' | 'aktif') => {
    const r = await durumDegistir(id, durum);
    if (!r.ok) Alert.alert('Hata', r.hata || 'Durum güncellenemedi.');
  }, [durumDegistir]);

  const onSil = useCallback((ilan: Ilan) => {
    Alert.alert('İlanı Sil', `"${ilan.baslik}" silinecek. Emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          const r = await ilanSil(ilan.id);
          if (!r.ok) Alert.alert('Silinemedi', r.hata || 'İlan silinemedi.');
        },
      },
    ]);
  }, [ilanSil]);

  const onKaldir = useCallback((ilan: Ilan) => {
    Alert.alert('İlanı Kaldır', `"${ilan.baslik}" listeden kaldırılacak (yetkili işlemi).`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır', style: 'destructive',
        onPress: async () => {
          const r = await durumDegistir(ilan.id, 'kaldirildi');
          if (!r.ok) Alert.alert('Kaldırılamadı', r.hata || 'İlan kaldırılamadı.');
        },
      },
    ]);
  }, [durumDegistir]);

  // Eyl 2026: ilan sahibine özel mesaj → /dm/[id]
  const onMesaj = useCallback((ilan: Ilan) => {
    if (benimId && ilan.kullanici_id === benimId) { Alert.alert('Bilgi', 'Bu senin ilanın.'); return; }
    telefonGerekli(async () => {
      try {
        const id = await konusmaBaslat(ilan.kullanici_id);
        router.push({ pathname: '/dm/[id]', params: { id, isim: ilan.kullanici_isim || 'Rehber' } } as never);
      } catch (e: any) {
        Alert.alert('Mesaj gönderilemiyor', e?.message || 'Konuşma başlatılamadı. Lütfen tekrar deneyin.');
      }
    });
  }, [benimId, telefonGerekli]);

  // Eyl 2026: numara yanlış/sahte bildirimi → raporlanan_mesajlar (kaynak='telefon'), yetkili Raporlar sekmesinde görür
  const onNumaraRaporla = useCallback((ilan: Ilan) => {
    Alert.alert('Numarayı bildir', `"${ilan.baslik}" ilanındaki numaraya ulaşılamıyor ya da yanlış mı? Yetkililere bildirilecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Bildir', style: 'destructive',
        onPress: async () => {
          const r = await telefonNumaraRaporla(ilan);
          Alert.alert(r.ok ? 'Teşekkürler' : 'Gönderilemedi', r.ok ? 'Bildirimin yetkililere iletildi.' : (r.hata || 'Tekrar dene.'));
        },
      },
    ]);
  }, []);

  const bosMetin = filtre === 'benim'
    ? 'Henüz ilanın yok. Sağ alttaki "+ İlan Ver" ile ilk ilanını yayınla.'
    : dilFiltre
      ? `${dilFiltre} için aktif ilan yok.`
      : filtre === 'rehber_araniyor'
        ? 'Şu an rehber arayan ilan yok.'
        : filtre === 'diger'
          ? 'Şu an transfer / diğer ilanı yok.'
          : 'Şu an aktif ilan yok. İlk ilanı sen ver.';

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* HEADER */}
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik
          baslik="Rehber Aranıyor"
          sag={
            <TouchableOpacity onPress={() => setDilModal(true)} activeOpacity={0.7} style={s.headerRozet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.headerRozetYazi}>
                {profilDilleri.length > 0 ? `Bildirim dillerim · ${profilDilleri.length}` : 'Bildirim dillerim'}
              </Text>
            </TouchableOpacity>
          }
        />
      </GradyanHeader>

      {/* FİLTRELER */}
      <View style={s.filtreler}>
        <Segmentler<Filtre> secenekler={FILTRE_SECENEK} aktif={filtre} onSec={setFiltre} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={s.chipSatir}>
            {dilSirasi.map(d => (
              <DilChip key={d} dil={d} secili={dilFiltre !== null && dilEsit(dilFiltre, d)} onPress={() => setDilFiltre(prev => (prev && dilEsit(prev, d) ? null : d))} renk={t.secondary} />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* LİSTE */}
      {yukleniyor && ilanlar.length === 0 ? (
        <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={gosterilen}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <IlanKarti
              ilan={item}
              benim={!!benimId && item.kullanici_id === benimId}
              isYetkili={isYetkili}
              onNumaraRaporla={onNumaraRaporla}
              tureb={turebRozetleri[item.kullanici_id]}
              avatarUrl={avatarlar[item.kullanici_id]}
              onDurum={onDurum}
              onSil={onSil}
              onKaldir={onKaldir}
              onMesaj={onMesaj}
              t={t}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          contentContainerStyle={[s.liste, { paddingBottom: insets.bottom + 96 }]}
          refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={onYenile} tintColor={t.primary} />}
          ListEmptyComponent={
            <View style={{ paddingTop: 20 }}>
              <BosDurum metin={hata ? `İlanlar yüklenemedi: ${hata}` : bosMetin} />
              {hata ? <BirincilButon baslik="Tekrar Dene" onPress={onYenile} varyant="kobalt" style={{ alignSelf: 'center' }} /> : null}
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* SABİT CTA */}
      <BirincilButon
        baslik="+ İlan Ver"
        onPress={() => setFormModal(true)}
        varyant="cta"
        style={[s.cta, { bottom: insets.bottom + 16, shadowColor: t.kartShadow }]}
      />

      {/* MODALLAR */}
      <BildirimDilleriModal
        visible={dilModal}
        mevcut={profilDilleri}
        onKapat={() => setDilModal(false)}
        onKaydet={profilDilleriKaydet}
        t={t}
      />
      <IlanFormModal
        visible={formModal}
        profilDilleri={profilDilleri}
        profilTelefon={profilTelefon}
        onKapat={() => setFormModal(false)}
        onKaydet={ilanEkle}
        telefonKaydet={telefonKaydet}
        t={t}
      />
      {telefonModal}
    </View>
  );
}

/* ═══════════════════════════════════════════
   STİLLER — renkler inline token'la (t.*), burada yerleşim/tipografi
   ═══════════════════════════════════════════ */
const s = StyleSheet.create({
  container: { flex: 1 },
  headerRozet: { backgroundColor: Palette.seffafBeyaz20, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 2 },
  headerRozetYazi: { fontFamily: Font.bold, fontSize: 11, color: '#FFFFFF', letterSpacing: 0.3 },

  filtreler: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  chipSatir: { flexDirection: 'row', gap: 6, paddingRight: 16 },
  chipSarmal: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 },
  chipDokun: { minHeight: 32, justifyContent: 'center' },
  chip: { paddingVertical: 6, paddingHorizontal: 12 },

  liste: { paddingHorizontal: 16, paddingTop: 8 },

  // Kart
  kartUst: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  kartTarih: { fontFamily: Font.bold, fontSize: 12, letterSpacing: -0.2 },
  kartBaslik: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3 },
  kartMeta: { fontFamily: Font.semibold, fontSize: 12 },
  kartAciklama: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19 },
  kartAlt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 },
  kartSahip: { flex: 1, fontFamily: Font.regular, fontSize: 11 },
  kartAksiyonlar: { flexDirection: 'row', gap: 8 },
  pill: { height: 40, borderRadius: Radius.full, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  pillYazi: { fontFamily: Font.bold, fontSize: 12, color: '#FFFFFF' },
  aksiyonBar: { flexDirection: 'row', paddingTop: 8, borderTopWidth: 1 },
  aksiyonBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  aksiyonYazi: { fontFamily: Font.semibold, fontSize: 12 },
  numaraBildir: { alignSelf: 'flex-end', marginTop: -4 },
  numaraBildirYazi: { fontFamily: Font.regular, fontSize: 11, textDecorationLine: 'underline' },
  aksiyonAyrac: { width: 1, marginVertical: 4 },

  // CTA
  cta: {
    position: 'absolute',
    right: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },

  // Form
  tabanNot: { fontFamily: Font.regular, fontSize: 11, marginTop: 4, lineHeight: 15 },
  formEtiket: { marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.regular, fontSize: 14 },
  inputCok: { minHeight: 110 },
  ikiKolon: { flexDirection: 'row', gap: 10 },
  switchSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.md, borderWidth: 1 },
  switchBaslik: { fontFamily: Font.semibold, fontSize: 13 },
  switchNot: { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
  sayac: { fontFamily: Font.regular, fontSize: 11, textAlign: 'right', marginTop: 4 },
  modalNot: { fontFamily: Font.regular, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
