// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Canlı saha durumu: özet kartı (kicker + mekan satırları + safran "Sahadan bildir"),
// Tümü / Detay / Bildir modalları ModalKapak diliyle. Supabase + realtime mantığı use-canli-durum'da, aynen.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../constants/theme';
import { BirincilButon, BosDurum, DurumNoktasi, Kart, Kicker, ModalKapak, Rozet } from './ui/pusula-ui';
import {
  useCanliDurum,
  DURUM_SECENEKLERI,
  durumBilgi,
  zamanOnce,
  type DurumTipi,
  type CanliDurumItem,
  type SahaNokta,
} from '../hooks/use-canli-durum';

// ═══ Durum → tema rengi (yeşil / safran / kırmızı / nötr) ═══
function durumRenk(durum: DurumTipi, t: TemaRenkleri): string {
  switch (durum) {
    case 'normal': return t.durumAcik;
    case 'kuyruk':
    case 'kismi_kapali':
    case 'erken_kapanis': return t.durumUyari;
    case 'yogun_kuyruk':
    case 'kapali': return t.durumKapali;
    case 'restorasyon': return t.durumBilgi;
    case 'gec_acilis': return t.secondary;
    case 'serbest_not': return t.primary;
    default: return t.durumBilgi;
  }
}

// ═══ Küçük inline ikonlar (24px stroke) ═══
function ArtiIkon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
function OkSagIkon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function OkSolIkon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════
// 1) ANA SAYFA ÜSTÜNDEKİ ÖZET PANEL
// ═══════════════════════════════════════════════════════
// ═══ Dışarıdan Bildir Modal'ı açmak için hook ═══
export function useSahaBildir() {
  const { noktalar, gonderiyor, durumBildir } = useCanliDurum();
  const { t } = useTema();
  const [bildirModal, setBildirModal] = useState(false);
  const [girisYapildi, setGirisYapildi] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setGirisYapildi(!!user));
  }, []);

  const bildirAc = () => {
    if (!girisYapildi) {
      Alert.alert(
        'Giriş Gerekli',
        'Saha bildirimi yapabilmek için üye girişi yapmalısın.\n\nAcil sekmesinden giriş yapabilirsin.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }
    setBildirModal(true);
  };

  const BildirModalEl = () => (
    <DurumBildirModal
      visible={bildirModal}
      onClose={() => setBildirModal(false)}
      noktalar={noktalar}
      gonderiyor={gonderiyor}
      t={t}
      onBildir={async (payload) => {
        const ok = await durumBildir(payload);
        if (ok) setBildirModal(false);
        return ok;
      }}
    />
  );

  return { bildirAc, BildirModal: BildirModalEl };
}

export function CanliDurumOzet() {
  const { durumlar, noktalar, yukleniyor, gonderiyor, hata, durumBildir, yenile } = useCanliDurum();
  const { t } = useTema();
  const [tumunuGorModal, setTumunuGorModal] = useState(false);
  const [bildirModal, setBildirModal] = useState(false);
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [detayItem, setDetayItem] = useState<CanliDurumItem | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setGirisYapildi(!!user));
  }, []);

  const bildirTikla = () => {
    if (!girisYapildi) {
      Alert.alert(
        'Giriş Gerekli',
        'Saha bildirimi yapabilmek için üye girişi yapmalısın.\n\nAcil sekmesinden giriş yapabilirsin.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }
    setBildirModal(true);
  };

  // Sabitlenmiş bildirimler süre filtresinden muaf
  const sabitDurumlar = durumlar.filter(d => d.sabitlendi);
  // Son 2 saat içindeki normal bildirimler
  const guncelDurumlar = durumlar.filter(d => d.dakika_once < 120 && !d.sabitlendi);
  // Birleştir: önce sabit, sonra önemli, sonra normal
  const onemliDurumlar = guncelDurumlar.filter(d => d.durum !== 'normal');
  const normalDurumlar = guncelDurumlar.filter(d => d.durum === 'normal');
  const sirali = [...sabitDurumlar, ...onemliDurumlar, ...normalDurumlar];
  // Tekrar eden id'leri filtrele
  const benzersiz: typeof sirali = [];
  const gorulenId = new Set<string>();
  for (const d of sirali) {
    if (!gorulenId.has(d.id)) { gorulenId.add(d.id); benzersiz.push(d); }
  }
  const OZET_LIMIT = 3;
  const gosterilecek = benzersiz.slice(0, OZET_LIMIT);
  // Tümünü gör için birleşik liste
  const tumDurumlar = [...sabitDurumlar, ...guncelDurumlar].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
  // Sağ üstteki "12 dk önce" — en taze bildirimin yaşı
  const enTazeDakika = tumDurumlar.length > 0 ? Math.min(...tumDurumlar.map(d => d.dakika_once)) : null;

  return (
    <View style={s.panelSarmal}>
      <Kart>
        <View style={s.panelHeader}>
          <Kicker color={Palette.acik}>Canlı Saha Durumu</Kicker>
          {enTazeDakika !== null && (
            <View style={s.zamanSatir}>
              <DurumNoktasi renk={Palette.acik} boyut={8} />
              <Text style={[s.zamanYazi, { color: t.textSecondary }]}>{zamanOnce(enTazeDakika)}</Text>
            </View>
          )}
        </View>

        {yukleniyor ? (
          <ActivityIndicator color={t.primary} style={{ marginVertical: 12 }} />
        ) : tumDurumlar.length === 0 ? (
          <View style={s.bosKutu}>
            <Text style={[s.bosYazi, { color: t.textSecondary }]}>Henüz saha bildirimi yok</Text>
            <Text style={[s.bosAlt, { color: t.textMuted }]}>İlk bildirimi sen yap!</Text>
          </View>
        ) : (
          <View>
            {onemliDurumlar.length > 0 && (
              <Rozet renk={t.durumUyari} style={{ marginBottom: 6 }}>{onemliDurumlar.length} mekanda dikkat gerektiren durum</Rozet>
            )}
            {gosterilecek.map(d => (
              <DurumKartKucuk key={d.id} item={d} t={t} onPress={setDetayItem} />
            ))}
            {tumDurumlar.length > gosterilecek.length && (
              <TouchableOpacity style={s.tumunuGorBtn} onPress={() => setTumunuGorModal(true)} activeOpacity={0.7}>
                <Text style={[s.tumunuGorYazi, { color: t.primary }]}>Tümünü Gör ({tumDurumlar.length} bildirim) ›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {hata && <Text style={[s.hataYazi, { color: t.durumKapali }]}>{hata}</Text>}

        <BirincilButon baslik="Sahadan bildir" onPress={bildirTikla} varyant="cta" sol={<ArtiIkon />} style={{ marginTop: 4 }} />
      </Kart>

      {/* TÜMÜNÜ GÖR MODAL */}
      <TumDurumlarModal
        visible={tumunuGorModal}
        onClose={() => setTumunuGorModal(false)}
        durumlar={tumDurumlar}
        onBildir={() => { setTumunuGorModal(false); setBildirModal(true); }}
        t={t}
      />

      {/* DETAY MODAL */}
      <DurumDetayModal
        item={detayItem}
        onClose={() => setDetayItem(null)}
        t={t}
      />

      {/* BİLDİR MODAL */}
      <DurumBildirModal
        visible={bildirModal}
        onClose={() => setBildirModal(false)}
        noktalar={noktalar}
        gonderiyor={gonderiyor}
        t={t}
        onBildir={async (payload) => {
          const ok = await durumBildir(payload);
          if (ok) setBildirModal(false);
          return ok;
        }}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// 2) KÜÇÜK DURUM SATIRI (Ana Sayfa özeti) — DurumNoktasi + ad + sağda renkli durum
// ═══════════════════════════════════════════════════════
function DurumKartKucuk({ item, t, onPress }: { item: CanliDurumItem; t?: TemaRenkleri; onPress?: (item: CanliDurumItem) => void }) {
  const { t: temaTt } = useTema();
  const tema = t || temaTt;
  const info = durumBilgi(item.durum);
  const renk = durumRenk(item.durum, tema);
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress: () => onPress(item), activeOpacity: 0.7 } : {};
  return (
    <Wrapper {...wrapperProps} style={[s.satir, { borderBottomColor: tema.divider }]}>
      <DurumNoktasi renk={renk} />
      <View style={s.satirIcerik}>
        <View style={s.satirIsimRow}>
          {item.sabitlendi && <Rozet renk={tema.primary} style={s.pinRozet}>SABiT</Rozet>}
          <Text style={[s.satirIsim, { color: tema.text }]} numberOfLines={1}>{item.nokta_isim}</Text>
        </View>
        {item.not_metni ? <Text style={[s.satirNot, { color: tema.textSecondary }]} numberOfLines={2}>{item.not_metni}</Text> : null}
        <Text style={[s.satirMeta, { color: tema.textMuted }]} numberOfLines={1}>
          {item.sabitlendi ? 'Sabitlendi' : zamanOnce(item.dakika_once)}
          {item.rehber_isim ? ` · ${item.rehber_isim}` : ''}
        </Text>
      </View>
      <View style={s.satirSag}>
        <Text style={[s.satirDurum, { color: renk }]} numberOfLines={1}>{info.label}</Text>
        {item.bekleme_dk ? <Text style={[s.satirBekleme, { color: tema.durumUyari }]}>~{item.bekleme_dk}dk</Text> : null}
      </View>
    </Wrapper>
  );
}

// ═══════════════════════════════════════════════════════
// 3) TÜM DURUMLAR MODAL
// ═══════════════════════════════════════════════════════
function TumDurumlarModal({
  visible, onClose, durumlar, onBildir, t,
}: {
  visible: boolean; onClose: () => void; durumlar: CanliDurumItem[]; onBildir: () => void; t: TemaRenkleri;
}) {
  const [detayItem, setDetayItem] = useState<CanliDurumItem | null>(null);
  // Kategori bazlı grupla
  const kategoriler = [
    { key: 'genel', label: 'Genel Duyurular' },
    { key: 'cami', label: 'Camiler' },
    { key: 'saray', label: 'Saraylar' },
    { key: 'muze', label: 'Müzeler' },
    { key: 'carsi', label: 'Çarşılar' },
    { key: 'meydan', label: 'Meydanlar' },
    { key: 'iskele', label: 'İskeleler' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ModalKapak baslik="Saha Durumu — Tümü" alt={`${durumlar.length} aktif bildirim`} onKapat={onClose}>
        <ScrollView style={{ maxHeight: 480 }}>
          {kategoriler.map(kat => {
            const katDurumlar = durumlar.filter(d =>
              kat.key === 'muze' ? (d.nokta_kategori === 'muze' || d.nokta_kategori === 'ozel_muze') : d.nokta_kategori === kat.key
            );
            if (katDurumlar.length === 0) return null;
            return (
              <View key={kat.key}>
                <Kicker color={t.primary} style={s.katBaslik}>{kat.label}</Kicker>
                {katDurumlar.map(d => <DurumKartKucuk key={d.id} item={d} t={t} onPress={setDetayItem} />)}
              </View>
            );
          })}
          {durumlar.length === 0 && (
            <BosDurum metin="Aktif bildirim yok" />
          )}
        </ScrollView>
        <BirincilButon baslik="+ Durum Bildir" onPress={onBildir} varyant="cta" style={{ marginTop: 12 }} />
        <DurumDetayModal item={detayItem} onClose={() => setDetayItem(null)} t={t} />
      </ModalKapak>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// 3b) BİLDİRİM DETAY MODAL
// ═══════════════════════════════════════════════════════
function DurumDetayModal({ item, onClose, t }: { item: CanliDurumItem | null; onClose: () => void; t: TemaRenkleri }) {
  if (!item) return null;
  const info = durumBilgi(item.durum);
  const renk = durumRenk(item.durum, t);
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      {/* Arka plana dokununca kapanır (eski davranış); içerik alanı dokunuşu yutar */}
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <ModalKapak baslik={item.nokta_isim} onKapat={onClose}>
          <View onStartShouldSetResponder={() => true}>
            <View style={s.detayDurumRow}>
              <DurumNoktasi renk={renk} />
              <Text style={[s.detayDurum, { color: renk }]}>{info.label}</Text>
              {item.sabitlendi && <Rozet renk={t.primary} style={{ marginLeft: 'auto' }}>Sabitlendi</Rozet>}
            </View>

            {item.bekleme_dk ? (
              <View style={[s.detaySatirBilgi, { borderBottomColor: t.divider }]}>
                <Text style={[s.detayLabelBilgi, { color: t.textSecondary }]}>Tahmini bekleme</Text>
                <Text style={[s.detayDeger, { color: t.text }]}>~{item.bekleme_dk} dakika</Text>
              </View>
            ) : null}

            {item.kapali_bolum ? (
              <View style={[s.detaySatirBilgi, { borderBottomColor: t.divider }]}>
                <Text style={[s.detayLabelBilgi, { color: t.textSecondary }]}>Kapalı bölüm</Text>
                <Text style={[s.detayDeger, { color: t.text }]}>{item.kapali_bolum}</Text>
              </View>
            ) : null}

            {item.not_metni ? (
              <View style={s.detayNotKutu}>
                <Text style={[s.detayLabelBilgi, { color: t.textSecondary, marginBottom: 6 }]}>Not</Text>
                <Text style={[s.detayNot, { color: t.text }]}>{item.not_metni}</Text>
              </View>
            ) : null}

            <Text style={[s.detayZaman, { color: t.textMuted }]}>
              {zamanOnce(item.dakika_once)}{item.rehber_isim ? ` — ${item.rehber_isim}` : ''}
            </Text>
          </View>
        </ModalKapak>
      </TouchableOpacity>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// 4) DURUM BİLDİR MODAL (Hızlı + Detay)
// ═══════════════════════════════════════════════════════
function DurumBildirModal({
  visible, onClose, noktalar, gonderiyor, onBildir, t,
}: {
  visible: boolean;
  onClose: () => void;
  noktalar: SahaNokta[];
  gonderiyor: boolean;
  onBildir: (p: { nokta_id: string; durum: DurumTipi; bekleme_dk?: number; not_metni?: string; kapali_bolum?: string }) => Promise<boolean>;
  t: TemaRenkleri;
}) {
  const [adim, setAdim] = useState<'nokta' | 'durum' | 'detay'>('nokta');
  const [secilenNokta, setSecilenNokta] = useState<SahaNokta | null>(null);
  const [secilenDurum, setSecilenDurum] = useState<DurumTipi | null>(null);
  const [detayAcik, setDetayAcik] = useState(false);
  const [bekleme, setBekleme] = useState('');
  const [notMetni, setNotMetni] = useState('');
  const [kapaliBolum, setKapaliBolum] = useState('');
  const [arama, setArama] = useState('');
  const [seciliKategori, setSeciliKategori] = useState<string | null>(null);

  const sifirla = () => {
    setAdim('nokta');
    setSecilenNokta(null);
    setSecilenDurum(null);
    setDetayAcik(false);
    setBekleme('');
    setNotMetni('');
    setKapaliBolum('');
    setArama('');
    setSeciliKategori(null);
  };

  const kapat = () => { sifirla(); onClose(); };

  const gonder = async () => {
    if (!secilenNokta || !secilenDurum) return;
    if (secilenDurum === 'serbest_not' && !notMetni.trim()) {
      Alert.alert('Not Gerekli', 'Genel bildirim için bir metin yazmalısın.');
      return;
    }
    const ok = await onBildir({
      nokta_id: secilenNokta.id,
      durum: secilenDurum,
      bekleme_dk: bekleme ? parseInt(bekleme) : undefined,
      not_metni: notMetni.trim() || undefined,
      kapali_bolum: kapaliBolum.trim() || undefined,
    });
    if (ok) { sifirla(); }
  };

  const filtreliNoktalar = noktalar.filter(n => {
    const aramaUygun = !arama || n.isim.toLowerCase().includes(arama.toLowerCase());
    const katUygun = !seciliKategori || (seciliKategori === 'muze' ? (n.kategori === 'muze' || n.kategori === 'ozel_muze') : n.kategori === seciliKategori);
    return aramaUygun && katUygun;
  });

  const kategoriListesi = [
    { key: null, label: 'Tümü' },
    { key: 'cami', label: 'Cami' },
    { key: 'saray', label: 'Saray' },
    { key: 'muze', label: 'Müze' },
    { key: 'carsi', label: 'Çarşı' },
    { key: 'meydan', label: 'Meydan' },
    { key: 'iskele', label: 'İskele' },
  ];

  const inputStil = [s.input, { backgroundColor: t.bgInput, borderColor: t.kartBorder, color: t.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={kapat}>
      {/* ADIM 1: Nokta Sec */}
      {adim === 'nokta' && (
        <ModalKapak baslik="Mekan Seç" alt="Hangi mekan için bildirim yapacaksın?" onKapat={kapat} altButonBaslik="İptal">
          <TextInput
            style={inputStil}
            placeholder="Mekan ara..."
            placeholderTextColor={t.textMuted}
            value={arama}
            onChangeText={setArama}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.katScrollRow} contentContainerStyle={s.katScrollIcerik}>
            {kategoriListesi.map(k => (
              <TouchableOpacity
                key={k.key ?? 'all'}
                onPress={() => setSeciliKategori(k.key)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8 }}
              >
                <Rozet renk={t.primary} dolu={seciliKategori === k.key} style={s.katChip}>{k.label}</Rozet>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView style={{ maxHeight: 340 }}>
            {filtreliNoktalar.map(n => (
              <TouchableOpacity
                key={n.id}
                style={[s.noktaSatir, { borderBottomColor: t.divider }]}
                onPress={() => { setSecilenNokta(n); setAdim('durum'); }}
                activeOpacity={0.7}
              >
                <Text style={[s.noktaIsim, { color: t.text }]}>{n.isim}</Text>
                <OkSagIkon color={t.textMuted} />
              </TouchableOpacity>
            ))}
            {filtreliNoktalar.length === 0 && (
              <BosDurum metin="Mekan bulunamadı" />
            )}
          </ScrollView>
        </ModalKapak>
      )}

      {/* ADIM 2: Durum Seç */}
      {adim === 'durum' && secilenNokta && (
        <ModalKapak baslik={secilenNokta.isim} alt="Mevcut durumu seç" onKapat={kapat} altButonBaslik="İptal">
          <TouchableOpacity onPress={() => setAdim('nokta')} style={s.geriBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <OkSolIkon color={t.primary} />
            <Text style={[s.geriYazi, { color: t.primary }]}>Geri</Text>
          </TouchableOpacity>
          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
            <View style={s.durumGrid}>
              {DURUM_SECENEKLERI.map(d => {
                const renk = durumRenk(d.key, t);
                const secili = secilenDurum === d.key;
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[
                      s.durumBtn,
                      { borderColor: t.kartBorder, backgroundColor: t.bgCard },
                      secili && { borderColor: renk, backgroundColor: `${renk}22` },
                    ]}
                    onPress={() => setSecilenDurum(d.key)}
                    activeOpacity={0.7}
                  >
                    <DurumNoktasi renk={renk} />
                    <Text style={[s.durumBtnLabel, { color: secili ? renk : t.text }]} numberOfLines={1}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {secilenDurum && !detayAcik && secilenDurum !== 'erken_kapanis' && secilenDurum !== 'gec_acilis' && secilenDurum !== 'serbest_not' && (
              <TouchableOpacity style={s.detayEkleBtn} onPress={() => setDetayAcik(true)} activeOpacity={0.7}>
                <Text style={[s.detayEkleBtnYazi, { color: t.primary }]}>+ Detay Ekle (opsiyonel)</Text>
              </TouchableOpacity>
            )}

            {(detayAcik || secilenDurum === 'erken_kapanis' || secilenDurum === 'gec_acilis' || secilenDurum === 'serbest_not') && (
              <View style={[s.detayAlani, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                {secilenDurum !== 'erken_kapanis' && secilenDurum !== 'gec_acilis' && secilenDurum !== 'serbest_not' && (
                  <View style={s.detaySatir}>
                    <Text style={[s.detayLabel, { color: t.textSecondary }]}>Bekleme (dk)</Text>
                    <TextInput
                      style={[s.detayInput, { backgroundColor: t.bgInput, borderColor: t.kartBorder, color: t.text }]}
                      placeholder="örn: 30"
                      placeholderTextColor={t.textMuted}
                      keyboardType="numeric"
                      value={bekleme}
                      onChangeText={setBekleme}
                    />
                  </View>
                )}
                {(secilenDurum === 'kismi_kapali' || secilenDurum === 'restorasyon') && (
                  <View style={s.detaySatir}>
                    <Text style={[s.detayLabel, { color: t.textSecondary }]}>Kapalı bölüm</Text>
                    <TextInput
                      style={[s.detayInput, { backgroundColor: t.bgInput, borderColor: t.kartBorder, color: t.text }]}
                      placeholder="örn: Harem bölümü"
                      placeholderTextColor={t.textMuted}
                      value={kapaliBolum}
                      onChangeText={setKapaliBolum}
                    />
                  </View>
                )}
                <View style={s.detaySatir}>
                  <Text style={[s.detayLabel, { color: t.textSecondary }]}>
                    {secilenDurum === 'erken_kapanis' ? 'Kaçta kapanacak?'
                      : secilenDurum === 'gec_acilis' ? 'Kaçta açılacak?'
                      : secilenDurum === 'serbest_not' ? 'Notunuzu yazın'
                      : 'Not'}
                  </Text>
                  <TextInput
                    style={[s.detayInput, { height: secilenDurum === 'serbest_not' ? 80 : 50, backgroundColor: t.bgInput, borderColor: t.kartBorder, color: t.text }]}
                    placeholder={
                      secilenDurum === 'erken_kapanis' ? 'örn: Bugün 15:00\'te kapanacak'
                      : secilenDurum === 'gec_acilis' ? 'örn: Bugün 11:00\'de açılacak'
                      : secilenDurum === 'serbest_not' ? 'Mekanla ilgili bilgi, uyarı veya not yazın...'
                      : 'Kısa açıklama...'
                    }
                    placeholderTextColor={t.textMuted}
                    multiline
                    value={notMetni}
                    onChangeText={setNotMetni}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {secilenDurum ? (
            <BirincilButon baslik="Bildir" onPress={gonder} varyant="cta" yukleniyor={gonderiyor} style={{ marginTop: 12 }} />
          ) : null}
        </ModalKapak>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// STİLLER — renkler inline token ile verilir (HEX yok)
// ═══════════════════════════════════════════════════════
const s = StyleSheet.create({
  // Özet kartı zarfı
  panelSarmal: { paddingHorizontal: 16, marginBottom: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zamanSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zamanYazi: { fontFamily: Font.semibold, fontSize: 11 },

  // Mekan satırı
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  satirIcerik: { flex: 1 },
  satirIsimRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  satirIsim: { fontFamily: Font.bold, fontSize: 14, letterSpacing: -0.3, flexShrink: 1 },
  satirNot: { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  satirMeta: { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
  satirSag: { alignItems: 'flex-end', marginLeft: 8 },
  satirDurum: { fontFamily: Font.bold, fontSize: 13 },
  satirBekleme: { fontFamily: Font.semibold, fontSize: 11, marginTop: 1 },
  pinRozet: { paddingHorizontal: 7, paddingVertical: 2 },

  // Boş durum
  bosKutu: { alignItems: 'center', paddingVertical: 16 },
  bosYazi: { fontFamily: Font.semibold, fontSize: 13, textAlign: 'center' },
  bosAlt: { fontFamily: Font.regular, fontSize: 11, marginTop: 4 },

  // Tümünü gör
  tumunuGorBtn: { alignItems: 'center', paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  tumunuGorYazi: { fontFamily: Font.bold, fontSize: 12 },

  // Hata
  hataYazi: { fontFamily: Font.regular, fontSize: 11, textAlign: 'center' },

  // Kategori başlık (Tüm modal)
  katBaslik: { marginTop: 14, marginBottom: 4 },

  // Detay modal
  detayDurumRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detayDurum: { fontFamily: Font.bold, fontSize: 14 },
  detaySatirBilgi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detayLabelBilgi: { fontFamily: Font.regular, fontSize: 13 },
  detayDeger: { fontFamily: Font.semibold, fontSize: 14 },
  detayNotKutu: { paddingTop: 12, paddingBottom: 8 },
  detayNot: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21 },
  detayZaman: { fontFamily: Font.regular, fontSize: 12, marginTop: 12 },

  // Bildir modal — arama & chip
  input: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: Font.regular,
    fontSize: 14,
    marginBottom: 10,
  },
  katScrollRow: { marginBottom: 8, flexGrow: 0 },
  katScrollIcerik: { gap: 6, paddingVertical: 4 },
  katChip: { paddingHorizontal: 12, paddingVertical: 6 },

  // Nokta seçim listesi
  noktaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 8,
  },
  noktaIsim: { fontFamily: Font.regular, fontSize: 14, flex: 1 },

  // Geri
  geriBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: 6 },
  geriYazi: { fontFamily: Font.bold, fontSize: 13 },

  // Durum seçim grid
  durumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  durumBtn: {
    width: '48%' as any,
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durumBtnLabel: { fontFamily: Font.bold, fontSize: 13, flexShrink: 1 },

  // Detay ekle
  detayEkleBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 8, minHeight: 44, justifyContent: 'center' },
  detayEkleBtnYazi: { fontFamily: Font.semibold, fontSize: 13 },

  // Detay alanı
  detayAlani: {
    marginTop: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
  },
  detaySatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  detayLabel: { fontFamily: Font.regular, fontSize: 12, width: 100 },
  detayInput: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: Font.regular,
    fontSize: 13,
  },
});
