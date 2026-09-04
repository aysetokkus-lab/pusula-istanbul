// Eyl 2026 — TUR EKRANI (Stack route /tur/[id]): tur bilgisi + MASRAF PUSULASI + dışa aktarma.
// Header (geri + başlık + menü: Düzenle / Sil) · Tur bilgisi kartı · Masraflar (satır dokun → düzenle/sil, fiş küçük resmi) ·
// Avanslar · Özet (para birimi bazında masraf − avans = kalan) · Dışa aktar: PDF/Word/Excel seç → "Acenteye mail gönder"
// (telefonun mail uygulaması, ekli), "WhatsApp ile gönder" (paylaşım sayfası) ya da "Telefona kaydet" (Android SAF / iOS Dosyalar). Veri: use-ajanda (useTur) + use-masraflar; üretim: lib/masraf-disa-aktar.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTema } from '../../hooks/use-tema';
import { bugunStr, cokGunlu, gunSayisi, kacinciGun, tarihAraligiKisa, turGunleri, useTur, type Tur, type TurPayload } from '../../hooks/use-ajanda';
import { fisSec, fisUrl, kalanEtiket, useMasraflar, type Masraf, type MasrafPayload, type MasrafTip, type SecilenFis } from '../../hooks/use-masraflar';
import { supabase } from '../../lib/supabase';
import { FORMATLAR, mailGovdesi, mailUygulamasiniAc, masrafDosyalariniUret, telefonaKaydet, whatsappIleGonder, type DisaAktarFormat } from '../../lib/masraf-disa-aktar';
import { MASRAF_KATEGORILERI, PARA_BIRIMLERI, kategoriBaslik, paraTR, tutarParse, type MasrafKategori, type ParaBirimi } from '../../constants/masraf';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, GradyanHeader, Kart, Kicker, ModalKapak, Segmentler } from '../../components/ui/pusula-ui';
import { tarihUzun } from '../../components/ui/takvim';
import { TurFormModal } from '../../components/tur-form-modal';
import { onayla, uyar } from '../../lib/uyari';

/* ═══ İkonlar ═══ */
function GeriIkon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function MenuIkon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={2} fill={color} /><Circle cx={12} cy={12} r={2} fill={color} /><Circle cx={19} cy={12} r={2} fill={color} />
    </Svg>
  );
}
function FisIkon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/* ═══ Fiş küçük resmi (özel bucket → imzalı URL, modül önbelleği) ═══ */
const urlOnbellek = new Map<string, string>();
function FisKucuk({ path, boyut = 40, onPress }: { path: string; boyut?: number; onPress?: () => void }) {
  const { t } = useTema();
  const [url, setUrl] = useState<string | null>(urlOnbellek.get(path) ?? null);
  useEffect(() => {
    let iptal = false;
    if (!url) fisUrl(path).then(u => { if (u && !iptal) { urlOnbellek.set(path, u); setUrl(u); } });
    return () => { iptal = true; };
  }, [path, url]);
  const icerik = url
    ? <Image source={{ uri: url }} style={{ width: boyut, height: boyut, borderRadius: 8 }} contentFit="cover" transition={150} />
    : <View style={{ width: boyut, height: boyut, borderRadius: 8, backgroundColor: t.bgSecondary, alignItems: 'center', justifyContent: 'center' }}><FisIkon color={t.textMuted} /></View>;
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{icerik}</TouchableOpacity>;
  return icerik;
}

/* ═══ Masraf / avans satırı ═══ */
function MasrafSatiri({ m, t, onPress }: { m: Masraf; t: TemaRenkleri; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[s.satir, { borderColor: t.kartBorder }]}>
      {m.fis_path ? <FisKucuk path={m.fis_path} /> : (
        <View style={[s.satirIkon, { backgroundColor: m.tip === 'avans' ? Palette.safranTint : m.tip === 'ucret' ? Palette.menekseTint : Palette.kobaltTint }]}>
          <Text style={[s.satirIkonYazi, { color: m.tip === 'avans' ? Palette.altin : m.tip === 'ucret' ? Palette.menekse : t.primary }]}>{m.sira}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.satirKategori, { color: t.text }]} numberOfLines={1}>{kategoriBaslik(m.tip === 'masraf' ? m.kategori : m.tip)}</Text>
        <Text style={[s.satirAciklama, { color: t.textSecondary }]} numberOfLines={2}>{m.aciklama || (m.fis_path ? 'Fiş ekli' : '—')}</Text>
      </View>
      <Text style={[s.satirTutar, { color: t.text }]}>{paraTR(m.tutar, m.para_birimi)}</Text>
    </TouchableOpacity>
  );
}

/* ═══ Masraf / avans formu ═══ */
const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function gunEtiketi(iso: string): { gun: string; tarih: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return { gun: GUN_KISA[(dt.getDay() + 6) % 7], tarih: `${d} ${AY_KISA[m - 1]}` };
}

const BASLIK: Record<MasrafTip, [string, string]> = {
  masraf: ['Masraf', 'Kategori seç, tutarı yaz, fişi ekle'],
  avans: ['Avans', 'Acenteden alınan avans; masraf ve ücretten düşülür'],
  ucret: ['Rehberlik Ücreti', 'Günlük ücret, gece farkı vb. — acenteden alınacak tutara eklenir'],
};

function MasrafFormModal({ visible, tip, mevcut, sonParaBirimi, tur, onKapat, onKaydet, onSil }: {
  visible: boolean; tip: MasrafTip; mevcut: Masraf | null; sonParaBirimi: ParaBirimi; tur: Tur | null;
  onKapat: () => void; onKaydet: (p: MasrafPayload) => Promise<{ ok: boolean; hata?: string }>; onSil: () => void;
}) {
  const { t } = useTema();
  const gunler = useMemo(() => (tur && cokGunlu(tur) ? turGunleri(tur) : []), [tur]);
  const [gun, setGun] = useState<string | null>(null);
  const [kategori, setKategori] = useState<MasrafKategori>('muze_giris');
  const [aciklama, setAciklama] = useState('');
  const [tutar, setTutar] = useState('');
  const [pb, setPb] = useState<ParaBirimi>('TRY');
  const [fis, setFis] = useState<SecilenFis | null>(null);
  const [fisKaldir, setFisKaldir] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKategori((mevcut?.kategori as MasrafKategori) && mevcut?.kategori !== 'avans' ? (mevcut!.kategori as MasrafKategori) : 'muze_giris');
    setAciklama(mevcut?.aciklama ?? '');
    setTutar(mevcut ? String(mevcut.tutar).replace('.', ',') : '');
    setPb(mevcut?.para_birimi ?? sonParaBirimi);
    // Gün: mevcut satırın günü; yeni satırda bugün tur aralığındaysa bugün, değilse başlangıç
    const bugun = bugunStr();
    setGun(mevcut?.tarih ?? (tur ? (gunler.includes(bugun) ? bugun : tur.tarih) : null));
    setFis(null); setFisKaldir(false); setKaydediliyor(false);
  }, [visible, mevcut, sonParaBirimi, tur, gunler]);

  const tutarN = tutarParse(tutar);
  const kaydet = async () => {
    if (tutarN == null || tutarN <= 0) { uyar('Tutar', 'Geçerli bir tutar yaz, örn. 450 veya 1.250,50.'); return; }
    setKaydediliyor(true);
    const r = await onKaydet({ tip, kategori: tip === 'masraf' ? kategori : tip, tarih: gun ?? tur?.tarih ?? null, aciklama, tutar: tutarN, para_birimi: pb, fis, fisKaldir });
    setKaydediliyor(false);
    if (!r.ok) { uyar('Kaydedilemedi', r.hata ?? 'Bir sorun oluştu.'); return; }
    onKapat();
  };
  const fisEkle = async () => { const f = await fisSec(); if (f) { setFis(f); setFisKaldir(false); } };
  const kapat = () => { if (!kaydediliyor) onKapat(); };
  const inputStil = [s.input, { color: t.text, borderColor: t.kartBorder, backgroundColor: t.bgInput }];
  const mevcutFisVar = !!mevcut?.fis_path && !fisKaldir && !fis;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={kapat}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ModalKapak
          baslik={mevcut ? `${BASLIK[tip][0]} Düzenle` : `${BASLIK[tip][0]} Ekle`}
          alt={BASLIK[tip][1]}
          onKapat={kapat} altButonBaslik="İptal"
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {gunler.length > 0 ? (
              <>
                <Kicker style={s.etiket}>Gün{gun ? ` · ${kacinciGun(tur!, gun) ?? '?'}/${gunler.length}` : ''}</Kicker>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {gunler.map(iso => {
                      const on = iso === gun; const e = gunEtiketi(iso);
                      return (
                        <TouchableOpacity key={iso} onPress={() => setGun(iso)} activeOpacity={0.8} style={[s.gunChip, { backgroundColor: on ? t.primary : t.bgSecondary, borderColor: on ? t.primary : t.kartBorder }]}>
                          <Text style={[s.gunChipGun, { color: on ? 'rgba(255,255,255,0.8)' : t.textMuted }]}>{e.gun}</Text>
                          <Text style={[s.gunChipTarih, { color: on ? '#FFFFFF' : t.text }]}>{e.tarih}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            ) : null}
            {tip === 'masraf' ? (
              <>
                <Kicker style={s.etiket}>Kategori</Kicker>
                <View style={s.chipSarmal}>
                  {MASRAF_KATEGORILERI.map(k => {
                    const on = k.id === kategori;
                    return (
                      <TouchableOpacity key={k.id} onPress={() => setKategori(k.id)} activeOpacity={0.8} style={[s.chip, { backgroundColor: on ? t.primary : t.bgSecondary, borderColor: on ? t.primary : t.kartBorder }]}>
                        <Text style={[s.chipYazi, { color: on ? '#FFFFFF' : t.textSecondary }]}>{k.baslik}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            <View style={s.ikiKolon}>
              <View style={{ flex: 1.3 }}>
                <Kicker style={s.etiket}>Tutar</Kicker>
                <TextInput
                  style={[inputStil, s.tutarInput, tutar.trim().length > 0 && tutarN == null && { borderColor: t.durumKapali }]}
                  value={tutar} onChangeText={setTutar} placeholder="0,00" placeholderTextColor={t.textMuted}
                  keyboardType="decimal-pad" maxLength={12}
                />
              </View>
              <View style={{ flex: 1.7 }}>
                <Kicker style={s.etiket}>Para birimi</Kicker>
                <Segmentler<ParaBirimi> secenekler={PARA_BIRIMLERI.map(p => ({ id: p.id, baslik: p.baslik }))} aktif={pb} onSec={setPb} />
              </View>
            </View>

            <Kicker style={s.etiket}>Açıklama</Kicker>
            <TextInput
              style={inputStil} value={aciklama} onChangeText={setAciklama}
              placeholder={tip === 'avans' ? 'Örn. Ofisten nakit, tur lideri' : tip === 'ucret' ? 'Örn. 19 gün × 120 € / gece farkı' : 'Örn. Topkapı + Harem, 24 kişi'} placeholderTextColor={t.textMuted} maxLength={200}
            />

            {tip === 'masraf' ? (
              <>
                <Kicker style={s.etiket}>Fiş / fatura</Kicker>
                <View style={[s.fisKutu, { borderColor: t.kartBorder, backgroundColor: t.bgSecondary }]}>
                  {fis ? (
                    <Image source={{ uri: fis.uri }} style={s.fisOnizleme} contentFit="cover" />
                  ) : mevcutFisVar ? (
                    <FisKucuk path={mevcut!.fis_path!} boyut={64} />
                  ) : (
                    <View style={[s.fisOnizleme, { alignItems: 'center', justifyContent: 'center' }]}><FisIkon size={26} color={t.textMuted} /></View>
                  )}
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[s.fisYazi, { color: t.textSecondary }]}>
                      {fis ? 'Yeni fiş seçildi' : mevcutFisVar ? 'Fiş ekli' : 'Fotoğraf çek ya da galeriden seç; PDF/Word/Excel çıktısına eklenir.'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={fisEkle} activeOpacity={0.7}><Text style={[s.link, { color: t.primary }]}>{fis || mevcutFisVar ? 'Değiştir' : '+ Fiş ekle'}</Text></TouchableOpacity>
                      {(fis || mevcutFisVar) ? (
                        <TouchableOpacity onPress={() => { setFis(null); setFisKaldir(true); }} activeOpacity={0.7}><Text style={[s.link, { color: t.durumKapali }]}>Kaldır</Text></TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              </>
            ) : null}

            <BirincilButon baslik={mevcut ? 'Kaydet' : `${BASLIK[tip][0]} Ekle`} onPress={kaydet} yukleniyor={kaydediliyor} style={{ marginTop: 16 }} />
            {mevcut ? <BirincilButon baslik="Satırı Sil" onPress={onSil} varyant="hayalet" style={{ marginTop: 8 }} /> : null}
          </ScrollView>
        </ModalKapak>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══ EKRAN ═══ */
export default function TurEkrani() {
  const { t } = useTema();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const turId = typeof id === 'string' ? id : undefined;
  const { tur, yukleniyor, hata, guncelle, sil } = useTur(turId);
  const { masraflar, avanslar, ucretler, ozet, yukleniyor: masrafYukleniyor, ekle, guncelle: masrafGuncelle, sil: masrafSil } = useMasraflar(turId);

  const [duzenle, setDuzenle] = useState(false);
  const [form, setForm] = useState<{ tip: MasrafTip; mevcut: Masraf | null } | null>(null);
  const [formatlar, setFormatlar] = useState<DisaAktarFormat[]>(['pdf']);
  const [uretiliyor, setUretiliyor] = useState<'mail' | 'whatsapp' | 'kaydet' | null>(null);
  // İmza: kullanıcının kendi adı (mail/WhatsApp metninde gönderen Pusula değil, rehber — Ayşe kararı)
  const [rehber, setRehber] = useState<{ ad: string; telefon: string | null }>({ ad: '', telefon: null });
  const rehberiYukle = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ad: '', telefon: null };
    const { data } = await supabase.from('profiles').select('isim, soyisim, telefon').eq('id', user.id).maybeSingle();
    const ad = [data?.isim, data?.soyisim].filter(Boolean).join(' ').trim() || (user.email?.split('@')[0] ?? '');
    const r = { ad, telefon: data?.telefon ?? null };
    setRehber(r);
    return r;
  }, []);
  useEffect(() => { rehberiYukle(); }, [rehberiYukle]);

  const sonParaBirimi: ParaBirimi = useMemo(() => {
    const son = [...masraflar, ...avanslar, ...ucretler].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    return son?.para_birimi ?? 'TRY';
  }, [masraflar, avanslar, ucretler]);

  const bugun = useMemo(() => bugunStr(), []);
  const gunlu = !!tur && cokGunlu(tur);

  /** Çok günlü turda satırları güne göre grupla (başlık: "Cmt 12 Eyl · 1. gün") */
  const gruplu = (satirlar: Masraf[]) => {
    if (!gunlu || !tur) return [{ baslik: null as string | null, satirlar }];
    const m = new Map<string, Masraf[]>();
    for (const x of satirlar) { const k = x.tarih ?? tur.tarih; if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
    return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([iso, liste]) => {
      const e = gunEtiketi(iso); const n = kacinciGun(tur, iso);
      return { baslik: `${e.gun} ${e.tarih}${n ? ` · ${n}. gün` : ''}`, satirlar: liste };
    });
  };
  // Render yardımcısı (bileşen DEĞİL — her render'da remount olmasın diye)
  const satirListesi = (satirlar: Masraf[], tip: MasrafTip) => (
    <View style={{ gap: 8 }}>
      {gruplu(satirlar).map((g, i) => (
        <View key={g.baslik ?? i} style={{ gap: 8 }}>
          {g.baslik ? <Text style={[s.gunBaslik, { color: t.textMuted }]}>{g.baslik.toLocaleUpperCase('tr-TR')}</Text> : null}
          {g.satirlar.map(m => <MasrafSatiri key={m.id} m={m} t={t} onPress={() => setForm({ tip, mevcut: m })} />)}
        </View>
      ))}
    </View>
  );

  /* ─── Tur menüsü ─── */
  const turuSil = async () => {
    const ok = await onayla('Turu sil', 'Tur ve bağlı tüm masraf satırları (fişler dahil) silinecek. Emin misin?');
    if (!ok) return;
    const r = await sil();
    if (!r.ok) { uyar('Silinemedi', r.hata ?? ''); return; }
    router.back();
  };
  const headerMenu = () => {
    if (Platform.OS === 'web') { setDuzenle(true); return; }   // web'de Alert menüsü yok; silme alttaki butonda
    Alert.alert(tur?.baslik ?? 'Tur', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Düzenle', onPress: () => setDuzenle(true) },
      { text: 'Turu Sil', style: 'destructive', onPress: turuSil },
    ]);
  };

  const turKaydet = useCallback(async (p: TurPayload) => guncelle(p), [guncelle]);

  /* ─── Masraf formu ─── */
  const masrafKaydet = async (p: MasrafPayload) => (form?.mevcut ? masrafGuncelle(form.mevcut.id, p) : ekle(p));
  const masrafSilOnay = async () => {
    const m = form?.mevcut; if (!m) return;
    const ok = await onayla('Satırı sil', `${kategoriBaslik(m.tip === 'masraf' ? m.kategori : m.tip)} · ${paraTR(m.tutar, m.para_birimi)} silinsin mi?`);
    if (!ok) return;
    const r = await masrafSil(m.id);
    if (!r.ok) uyar('Silinemedi', r.hata ?? '');
    setForm(null);
  };

  /* ─── Dışa aktar ─── */
  const formatToggle = (f: DisaAktarFormat) => setFormatlar(prev => (prev.includes(f) ? (prev.length > 1 ? prev.filter(x => x !== f) : prev) : [...prev, f]));

  const uret = async (hedef: 'mail' | 'whatsapp' | 'kaydet') => {
    if (!turId || !tur) return;
    if (masraflar.length === 0 && avanslar.length === 0 && ucretler.length === 0) {
      uyar('Masraf yok', 'Önce en az bir masraf, ücret ya da avans satırı ekle.');
      return;
    }
    setUretiliyor(hedef);
    try {
      const r = await masrafDosyalariniUret(turId, formatlar);
      const imza = rehber.ad ? rehber : await rehberiYukle();   // profil henüz gelmediyse gönderim anında oku
      const govde = mailGovdesi({ turBaslik: tur.baslik, tarihUzun: gunlu ? `${tarihUzun(tur.tarih)} – ${tarihUzun(tur.bitis_tarih!)}` : tarihUzun(tur.tarih), rehberAdi: imza.ad, rehberTelefon: imza.telefon, ozet: r.ozet });

      if (hedef === 'kaydet') {
        const d = await telefonaKaydet(r.dosyalar);
        if (d === 'saved') uyar('Kaydedildi', Platform.OS === 'web' ? 'Dosyalar indirilenler klasörüne indi.' : Platform.OS === 'android' ? `${r.dosyalar.length} dosya seçtiğin klasöre kaydedildi.` : 'Dosyalar kaydedildi.');
        else if (d === 'unavailable') uyar('Kaydedilemedi', 'Bu cihazda dosya kaydetme kullanılamıyor.');
        return;
      }
      if (hedef === 'whatsapp') {
        const d = await whatsappIleGonder(r.dosyalar, `${r.konu}\n\n${govde}`);
        if (d === 'unavailable') uyar('Gönderilemedi', 'Bu cihazda paylaşım sayfası kullanılamıyor.');
        else if (d === 'nowhatsapp') uyar('WhatsApp bulunamadı', 'Açılan listede WhatsApp yoksa yüklü değil; başka bir uygulama seçebilirsin.');
        else if (Platform.OS === 'web') uyar('Tarayıcıda', 'Dosyalar indirildi; WhatsApp Web açılıyor — dosyaları sohbete sürükleyip bırak.');
        return;
      }
      const durum = await mailUygulamasiniAc({ alici: r.acenteEmail, konu: r.konu, govde, dosyalar: r.dosyalar });
      if (durum === 'web') {
        uyar('Tarayıcıda', 'Tarayıcı e-postaya ek ekleyemez: dosyalar indirildi, mail uygulaman konu ve metinle açılıyor — indirilen dosyaları ek olarak ekle. Telefonda "Mail Gönder" dosyaları doğrudan ekler.');
      } else if (durum === 'unavailable') {
        Alert.alert('Mail uygulaması yok', 'Bu cihazda e-posta uygulaması bulunamadı. WhatsApp ile gönderebilir ya da telefona kaydedebilirsin.', [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'WhatsApp', onPress: () => whatsappIleGonder(r.dosyalar, `${r.konu}\n\n${govde}`) },
          { text: 'Kaydet', onPress: () => telefonaKaydet(r.dosyalar) },
        ]);
      }
    } catch (e: any) {
      uyar('Dosya üretilemedi', e?.message || 'Bağlantıyı kontrol edip tekrar dene.');
    } finally {
      setUretiliyor(null);
    }
  };

  /* ─── Render ─── */
  if (!turId || (!yukleniyor && !tur)) {
    return (
      <View style={[s.container, { backgroundColor: t.bg }]}>
        <GradyanHeader paddingTop={insets.top + 8} style={s.header}>
          <View style={s.headerSatir}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.headerBtn} accessibilityLabel="Geri"><GeriIkon /></TouchableOpacity>
            <Text style={s.headerBaslik}>Tur</Text>
          </View>
        </GradyanHeader>
        <BosDurum metin={hata ?? 'Tur bulunamadı.'} />
      </View>
    );
  }

  const gecmis = !!tur && (tur.bitis_tarih ?? tur.tarih) < bugun;

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <GradyanHeader paddingTop={insets.top + 8} style={s.header}>
        <View style={s.headerSatir}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.headerBtn} accessibilityLabel="Geri" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <GeriIkon />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerBaslik} numberOfLines={1}>{tur?.baslik ?? '…'}</Text>
            <Text style={[s.headerAlt, { color: t.headerSubtext }]} numberOfLines={1}>
              {tur ? `${gunlu ? tarihAraligiKisa(tur) : tarihUzun(tur.tarih)}${tur.saat ? ` · ${tur.saat}` : ''}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={headerMenu} activeOpacity={0.7} style={s.headerBtn} accessibilityLabel="Tur menüsü" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MenuIkon />
          </TouchableOpacity>
        </View>
      </GradyanHeader>

      <ScrollView contentContainerStyle={[s.govde, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
        {/* ═══ Tur bilgisi ═══ */}
        {tur ? (
          <Kart accent={gecmis ? t.textMuted : t.primary}>
            <View style={s.bolumBaslik}>
              <Kicker color={t.primary}>Tur bilgisi</Kicker>
              <TouchableOpacity onPress={() => setDuzenle(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.link, { color: t.accent }]}>Düzenle</Text>
              </TouchableOpacity>
            </View>
            {gunlu ? <BilgiSatiri etiket="Tarih" deger={`${tarihUzun(tur.tarih)} → ${tarihUzun(tur.bitis_tarih!)} · ${gunSayisi(tur)} gün${kacinciGun(tur, bugun) ? ` · bugün ${kacinciGun(tur, bugun)}. gün` : ''}`} t={t} cokSatir /> : null}
            <BilgiSatiri etiket="Acente" deger={tur.acente} t={t} />
            <BilgiSatiri etiket="E-posta" deger={tur.acente_email} t={t} eksikMetin="Ekle — pusula tek dokunuşla gitsin" />
            <BilgiSatiri etiket="Grup" deger={tur.grup} t={t} />
            <BilgiSatiri etiket="Buluşma" deger={tur.bulusma} t={t} />
            {tur.notlar ? <BilgiSatiri etiket="Notlar" deger={tur.notlar} t={t} cokSatir /> : null}
          </Kart>
        ) : <ActivityIndicator color={t.primary} style={{ paddingVertical: 20 }} />}

        {/* ═══ Masraflar ═══ */}
        <View style={s.bolum}>
          <View style={s.bolumBaslik}>
            <Kicker color={t.primary}>Masraf pusulası</Kicker>
            <TouchableOpacity onPress={() => setForm({ tip: 'masraf', mevcut: null })} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.link, { color: t.accent }]}>+ Masraf</Text>
            </TouchableOpacity>
          </View>
          <Kart>
            {masrafYukleniyor ? <ActivityIndicator color={t.primary} /> : masraflar.length === 0 ? (
              <BosDurum metin="Henüz masraf yok. Müze girişi, otopark, yemek… kalem kalem ekle, fişini çek." />
            ) : satirListesi(masraflar, 'masraf')}
            <BirincilButon baslik="+ Masraf Ekle" onPress={() => setForm({ tip: 'masraf', mevcut: null })} varyant="cta" style={{ marginTop: 4 }} />
          </Kart>
        </View>

        {/* ═══ Rehberlik ücreti ═══ */}
        <View style={s.bolum}>
          <View style={s.bolumBaslik}>
            <Kicker color={Palette.menekse}>Rehberlik ücreti</Kicker>
            <TouchableOpacity onPress={() => setForm({ tip: 'ucret', mevcut: null })} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.link, { color: t.accent }]}>+ Ücret</Text>
            </TouchableOpacity>
          </View>
          <Kart>
            {ucretler.length === 0 ? (
              <BosDurum metin="Günlük rehberlik ücretini TL, EUR ya da USD olarak ekle; acenteden alınacak tutara eklenir." />
            ) : satirListesi(ucretler, 'ucret')}
          </Kart>
        </View>

        {/* ═══ Avans ═══ */}
        <View style={s.bolum}>
          <View style={s.bolumBaslik}>
            <Kicker color={Palette.altin}>Avans</Kicker>
            <TouchableOpacity onPress={() => setForm({ tip: 'avans', mevcut: null })} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.link, { color: t.accent }]}>+ Avans</Text>
            </TouchableOpacity>
          </View>
          <Kart>
            {avanslar.length === 0 ? (
              <BosDurum metin="Acenteden avans aldıysan buraya yaz; masraf ve ücret toplamından düşülür." />
            ) : satirListesi(avanslar, 'avans')}
          </Kart>
        </View>

        {/* ═══ Özet ═══ */}
        {ozet.length > 0 ? (
          <View style={s.bolum}>
            <Kicker color={t.primary}>Özet</Kicker>
            <Kart accent={t.accent}>
              {ozet.map(o => (
                <View key={o.para_birimi} style={{ gap: 4 }}>
                  <Text style={[s.ozetPb, { color: t.secondary }]}>{PARA_BIRIMLERI.find(p => p.id === o.para_birimi)?.baslik ?? o.para_birimi}</Text>
                  <OzetSatir etiket="Toplam masraf" deger={paraTR(o.masraf, o.para_birimi)} t={t} />
                  <OzetSatir etiket="Rehberlik ücreti" deger={paraTR(o.ucret, o.para_birimi)} t={t} />
                  <OzetSatir etiket="Alınan avans" deger={paraTR(o.avans, o.para_birimi)} t={t} />
                  <OzetSatir etiket={kalanEtiket(o)} deger={paraTR(Math.abs(o.kalan), o.para_birimi)} t={t} kalin renk={o.kalan > 0 ? t.primary : o.kalan < 0 ? t.durumKapali : t.durumAcik} />
                </View>
              ))}
            </Kart>
          </View>
        ) : null}

        {/* ═══ Dışa aktar ═══ */}
        <View style={s.bolum}>
          <Kicker color={t.primary}>Acenteye gönder</Kicker>
          <Kart>
            <Text style={[s.aciklama, { color: t.textSecondary }]}>Pusula İstanbul logolu masraf pusulası; fişler ek sayfada. Format seç, sonra mail ile gönder, WhatsApp ile gönder ya da telefona kaydet.</Text>
            <View style={s.chipSarmal}>
              {FORMATLAR.map(f => {
                const on = formatlar.includes(f.id);
                return (
                  <TouchableOpacity key={f.id} onPress={() => formatToggle(f.id)} activeOpacity={0.8} style={[s.chip, { backgroundColor: on ? t.primary : t.bgSecondary, borderColor: on ? t.primary : t.kartBorder }]}>
                    <Text style={[s.chipYazi, { color: on ? '#FFFFFF' : t.textSecondary }]}>{f.baslik}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {tur && !tur.acente_email ? (
              <Text style={[s.uyari, { color: Palette.altin }]}>Acente e-postası boş — mail alıcısız açılır. Tur bilgisinden ekleyebilirsin.</Text>
            ) : null}
            <BirincilButon
              baslik={tur?.acente_email ? `Mail Gönder · ${tur.acente_email}` : 'Mail Gönder'}
              onPress={() => uret('mail')} yukleniyor={uretiliyor === 'mail'} disabled={uretiliyor !== null}
            />
            <BirincilButon baslik="WhatsApp ile Gönder" onPress={() => uret('whatsapp')} varyant="kobalt" yukleniyor={uretiliyor === 'whatsapp'} disabled={uretiliyor !== null} />
            <BirincilButon baslik="Telefona Kaydet" onPress={() => uret('kaydet')} varyant="hayalet" yukleniyor={uretiliyor === 'kaydet'} disabled={uretiliyor !== null} />
            {uretiliyor ? <Text style={[s.not, { color: t.textMuted }]}>Dosyalar hazırlanıyor… fiş sayısına göre birkaç saniye sürebilir.</Text> : null}
            {Platform.OS === 'web' ? <Text style={[s.not, { color: t.textMuted }]}>Tarayıcıda dosyalar indirilir (e-postaya otomatik eklenemez); birden fazla format seçtiysen Chrome &ldquo;birden çok indirme&rdquo; izni ister. Tam akış telefonda.</Text> : null}
          </Kart>
        </View>

        <BirincilButon baslik="Turu Sil" onPress={turuSil} varyant="hayalet" style={{ borderColor: t.durumKapali }} />
      </ScrollView>

      <TurFormModal visible={duzenle} mevcut={tur} onKapat={() => setDuzenle(false)} onKaydet={turKaydet} />
      <MasrafFormModal
        visible={form !== null} tip={form?.tip ?? 'masraf'} mevcut={form?.mevcut ?? null} sonParaBirimi={sonParaBirimi} tur={tur}
        onKapat={() => setForm(null)} onKaydet={masrafKaydet} onSil={masrafSilOnay}
      />
    </View>
  );
}

function BilgiSatiri({ etiket, deger, t, eksikMetin, cokSatir }: { etiket: string; deger: string | null; t: TemaRenkleri; eksikMetin?: string; cokSatir?: boolean }) {
  return (
    <View style={s.bilgiSatir}>
      <Text style={[s.bilgiEtiket, { color: t.textSecondary }]}>{etiket}</Text>
      <Text style={[s.bilgiDeger, { color: deger ? t.text : t.textMuted }]} numberOfLines={cokSatir ? undefined : 2}>{deger || eksikMetin || '—'}</Text>
    </View>
  );
}

function OzetSatir({ etiket, deger, t, kalin, renk }: { etiket: string; deger: string; t: TemaRenkleri; kalin?: boolean; renk?: string }) {
  return (
    <View style={s.ozetSatir}>
      <Text style={[s.ozetEtiket, { color: t.textSecondary }, kalin && { fontFamily: Font.semibold, color: t.text }]}>{etiket}</Text>
      <Text style={[s.ozetDeger, { color: renk ?? t.text }, kalin && s.ozetDegerKalin]}>{deger}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 14, paddingHorizontal: 12 },
  headerSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.seffafBeyaz20, alignItems: 'center', justifyContent: 'center' },
  headerBaslik: { fontFamily: Font.extrabold, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 },
  headerAlt: { fontFamily: Font.regular, fontSize: 12 },
  govde: { padding: 16, gap: 18 },
  bolum: { gap: 10 },
  bolumBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontFamily: Font.bold, fontSize: 12 },
  bilgiSatir: { flexDirection: 'row', gap: 10 },
  bilgiEtiket: { width: 68, fontFamily: Font.regular, fontSize: 12, paddingTop: 1 },
  bilgiDeger: { flex: 1, fontFamily: Font.semibold, fontSize: 13, lineHeight: 18 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 10 },
  satirIkon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  satirIkonYazi: { fontFamily: Font.bold, fontSize: 13 },
  satirKategori: { fontFamily: Font.bold, fontSize: 13 },
  satirAciklama: { fontFamily: Font.regular, fontSize: 12, lineHeight: 16 },
  satirTutar: { fontFamily: Font.bold, fontSize: 14, letterSpacing: -0.2 },
  gunBaslik: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.8, marginTop: 2 },
  gunChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', minWidth: 58 },
  gunChipGun: { fontFamily: Font.bold, fontSize: 9, letterSpacing: 0.5 },
  gunChipTarih: { fontFamily: Font.semibold, fontSize: 12 },
  ozetPb: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
  ozetSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ozetEtiket: { fontFamily: Font.regular, fontSize: 13 },
  ozetDeger: { fontFamily: Font.semibold, fontSize: 14 },
  ozetDegerKalin: { fontFamily: Font.extrabold, fontSize: 18, letterSpacing: -0.3 },
  aciklama: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17 },
  uyari: { fontFamily: Font.semibold, fontSize: 11, lineHeight: 15 },
  not: { fontFamily: Font.regular, fontSize: 11, textAlign: 'center' },
  chipSarmal: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.full, borderWidth: 1 },
  chipYazi: { fontFamily: Font.semibold, fontSize: 12 },
  etiket: { marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.regular, fontSize: 14 },
  tutarInput: { fontFamily: Font.bold, fontSize: 18 },
  ikiKolon: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  fisKutu: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: Radius.md, padding: 10 },
  fisOnizleme: { width: 64, height: 64, borderRadius: 10 },
  fisYazi: { fontFamily: Font.regular, fontSize: 12, lineHeight: 16 },
});
