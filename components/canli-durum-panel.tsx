import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { type TemaRenkleri } from '../constants/theme';
import {
  useCanliDurum,
  DURUM_SECENEKLERI,
  durumBilgi,
  zamanOnce,
  type DurumTipi,
  type CanliDurumItem,
  type SahaNokta,
} from '../hooks/use-canli-durum';

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

  return (
    <View style={[s.panel, { backgroundColor: t.bgSecondary, borderBottomColor: t.kartBorder }]}>
      <View style={s.panelHeader}>
        <Text style={[s.panelBaslik, { color: t.primary }]}>Saha Durumu</Text>
        <View style={s.panelBtnRow}>
          <TouchableOpacity onPress={bildirTikla} activeOpacity={0.7}>
            <View style={s.bildirBtnShadow}>
              <LinearGradient
                colors={['#00A8E8', '#0077B6', '#005A8D']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={s.bildirBtn}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={s.btnGloss}
                />
                <Text style={s.bildirBtnYazi}>＋ Bildir</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {yukleniyor ? (
        <ActivityIndicator color={t.primary} style={{ marginVertical: 12 }} />
      ) : tumDurumlar.length === 0 ? (
        <View style={s.bosKutu}>
          <Text style={[s.bosYazi, { color: t.textSecondary }]}>Henüz saha bildirimi yok</Text>
          <Text style={[s.bosAlt, { color: t.textMuted }]}>İlk bildirimi sen yap!</Text>
        </View>
      ) : (
        <>
          {onemliDurumlar.length > 0 && (
            <View style={s.uyariBant}>
              <Text style={s.uyariBantYazi}>{onemliDurumlar.length} mekanda dikkat gerektiren durum</Text>
            </View>
          )}
          {gosterilecek.map(d => (
            <DurumKartKucuk key={d.id} item={d} t={t} onPress={setDetayItem} />
          ))}
          {tumDurumlar.length > gosterilecek.length && (
            <TouchableOpacity style={s.tumunuGorBtn} onPress={() => setTumunuGorModal(true)} activeOpacity={0.7}>
              <Text style={[s.tumunuGorYazi, { color: t.primary }]}>Tümünü Gör ({tumDurumlar.length} bildirim) ›</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {hata && <Text style={s.hataYazi}>{hata}</Text>}

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
// 2) KÜÇÜK DURUM KARTI (Ana Sayfa özeti)
// ═══════════════════════════════════════════════════════
function DurumKartKucuk({ item, t, onPress }: { item: CanliDurumItem; t?: TemaRenkleri; onPress?: (item: CanliDurumItem) => void }) {
  const { t: temaTt } = useTema();
  const tema = t || temaTt;
  const info = durumBilgi(item.durum);
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress: () => onPress(item), activeOpacity: 0.7 } : {};
  return (
    <Wrapper {...wrapperProps} style={[s.kartKucuk, { borderLeftColor: info.renk, backgroundColor: tema.bgCard, borderBottomColor: tema.kartBorder }, item.sabitlendi && [s.kartSabit, { borderColor: tema.kartBorder, backgroundColor: tema.bgCardAlt }]]}>
      <View style={[s.kartSimge, { backgroundColor: info.renk }]}>
        <Text style={s.kartSimgeYazi}>{info.simge}</Text>
      </View>
      <View style={s.kartIcerik}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {item.sabitlendi && <View style={s.pinBadge}><Text style={s.pinBadgeYazi}>SABiT</Text></View>}
          <Text style={[s.kartIsim, { color: tema.text }]} numberOfLines={1}>{item.nokta_isim}</Text>
        </View>
        <View style={s.kartAltSatir}>
          <Text style={[s.kartDurum, { color: info.renk }]}>{info.label}</Text>
          {item.bekleme_dk ? <Text style={s.kartBekleme}>~{item.bekleme_dk}dk</Text> : null}
        </View>
        {item.not_metni ? <Text style={[s.kartNot, { color: tema.textSecondary }]} numberOfLines={2}>{item.not_metni}</Text> : null}
      </View>
      <View style={s.kartSag}>
        {item.sabitlendi
          ? <Text style={[s.kartSabitYazi, { color: tema.primary }]}>Sabitlendi</Text>
          : <Text style={[s.kartZaman, { color: tema.textMuted }]}>{zamanOnce(item.dakika_once)}</Text>
        }
        {item.rehber_isim ? <Text style={[s.kartRehber, { color: tema.textMuted }]}>{item.rehber_isim}</Text> : null}
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
      <View style={[s.modalArka, { backgroundColor: t.modalOverlay }]}>
        <View style={[s.modalKutu, { backgroundColor: t.modalBg }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalBaslik, { color: t.text }]}>Saha Durumu — Tümü</Text>
            <Text style={[s.modalAlt, { color: t.textSecondary }]}>{durumlar.length} aktif bildirim</Text>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            {kategoriler.map(kat => {
              const katDurumlar = durumlar.filter(d =>
                kat.key === 'muze' ? (d.nokta_kategori === 'muze' || d.nokta_kategori === 'ozel_muze') : d.nokta_kategori === kat.key
              );
              if (katDurumlar.length === 0) return null;
              return (
                <View key={kat.key}>
                  <Text style={[s.katBaslik, { color: t.primary }]}>{kat.label}</Text>
                  {katDurumlar.map(d => <DurumKartKucuk key={d.id} item={d} t={t} onPress={setDetayItem} />)}
                </View>
              );
            })}
            {durumlar.length === 0 && (
              <View style={s.bosKutu}>
                <Text style={[s.bosYazi, { color: t.textSecondary }]}>Aktif bildirim yok</Text>
              </View>
            )}
          </ScrollView>
          <View style={s.modalAltBar}>
            <TouchableOpacity style={s.bildirBtnBuyuk} onPress={onBildir} activeOpacity={0.7}>
              <Text style={s.bildirBtnBuyukYazi}>+ Durum Bildir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.kapatBtn, { backgroundColor: t.bgSecondary }]} onPress={onClose}>
              <Text style={[s.kapatYazi, { color: t.primary }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <DurumDetayModal item={detayItem} onClose={() => setDetayItem(null)} t={t} />
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// 3b) BİLDİRİM DETAY MODAL
// ═══════════════════════════════════════════════════════
function DurumDetayModal({ item, onClose, t }: { item: CanliDurumItem | null; onClose: () => void; t: TemaRenkleri }) {
  if (!item) return null;
  const info = durumBilgi(item.durum);
  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={[s.modalArka, { backgroundColor: t.modalOverlay, justifyContent: 'center' }]} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[s.detayModalKutu, { backgroundColor: t.modalBg }]}>
          <View style={[s.detayModalHeader, { borderBottomColor: t.divider }]}>
            <View style={[s.detayModalSimge, { backgroundColor: info.renk }]}>
              <Text style={s.kartSimgeYazi}>{info.simge}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.detayModalIsim, { color: t.text }]}>{item.nokta_isim}</Text>
              <Text style={[s.detayModalDurum, { color: info.renk }]}>{info.label}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[s.detayModalKapat, { color: t.textMuted }]}>X</Text>
            </TouchableOpacity>
          </View>

          {item.bekleme_dk ? (
            <View style={[s.detayModalSatir, { borderBottomColor: t.divider }]}>
              <Text style={[s.detayModalLabel, { color: t.textSecondary }]}>Tahmini bekleme</Text>
              <Text style={[s.detayModalDeger, { color: t.text }]}>~{item.bekleme_dk} dakika</Text>
            </View>
          ) : null}

          {item.kapali_bolum ? (
            <View style={[s.detayModalSatir, { borderBottomColor: t.divider }]}>
              <Text style={[s.detayModalLabel, { color: t.textSecondary }]}>Kapalı bölüm</Text>
              <Text style={[s.detayModalDeger, { color: t.text }]}>{item.kapali_bolum}</Text>
            </View>
          ) : null}

          {item.not_metni ? (
            <View style={s.detayModalNotKutu}>
              <Text style={[s.detayModalLabel, { color: t.textSecondary, marginBottom: 6 }]}>Not</Text>
              <Text style={[s.detayModalNot, { color: t.text }]}>{item.not_metni}</Text>
            </View>
          ) : null}

          <View style={s.detayModalFooter}>
            <Text style={[s.detayModalZaman, { color: t.textMuted }]}>
              {zamanOnce(item.dakika_once)}{item.rehber_isim ? ` — ${item.rehber_isim}` : ''}
            </Text>
            {item.sabitlendi && <Text style={[s.kartSabitYazi, { color: t.primary }]}>Sabitlendi</Text>}
          </View>

          <TouchableOpacity
            style={[s.kapatBtn, { backgroundColor: t.bgSecondary, marginHorizontal: 16, marginBottom: 16, marginTop: 4 }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[s.kapatYazi, { color: t.primary }]}>Kapat</Text>
          </TouchableOpacity>
        </TouchableOpacity>
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={kapat}>
      <View style={[s.modalArka, { backgroundColor: t.modalOverlay }]}>
        <View style={[s.modalKutu, { backgroundColor: t.modalBg }]}>
          {/* ADIM 1: Nokta Sec */}
          {adim === 'nokta' && (
            <>
              <View style={s.modalHeader}>
                <Text style={[s.modalBaslik, { color: t.text }]}>Mekan Seç</Text>
                <Text style={[s.modalAlt, { color: t.textSecondary }]}>Hangi mekan için bildirim yapacaksın?</Text>
              </View>
              <TextInput
                style={[s.aramaInput, { backgroundColor: t.bgCard, borderColor: t.kartBorder, color: t.text }]}
                placeholder="Mekan ara..."
                placeholderTextColor={t.textMuted}
                value={arama}
                onChangeText={setArama}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.katScrollRow}>
                {kategoriListesi.map(k => (
                  <TouchableOpacity
                    key={k.key ?? 'all'}
                    style={[s.katChip, { backgroundColor: t.bgCard, borderColor: t.kartBorder }, seciliKategori === k.key && s.katChipAktif]}
                    onPress={() => setSeciliKategori(k.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.katChipYazi, { color: t.textSecondary }, seciliKategori === k.key && s.katChipYaziAktif]}>{k.label}</Text>
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
                    <Text style={[s.noktaOk, { color: t.primary }]}>{'>'}</Text>
                  </TouchableOpacity>
                ))}
                {filtreliNoktalar.length === 0 && (
                  <Text style={[s.bosYazi, { color: t.textSecondary }]}>Mekan bulunamadı</Text>
                )}
              </ScrollView>
              <TouchableOpacity style={[s.kapatBtn, { backgroundColor: t.bgSecondary }]} onPress={kapat}>
                <Text style={[s.kapatYazi, { color: t.primary }]}>İptal</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ADIM 2: Durum Seç */}
          {adim === 'durum' && secilenNokta && (
            <>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setAdim('nokta')}>
                  <Text style={[s.geriBtn, { color: t.primary }]}>{'< Geri'}</Text>
                </TouchableOpacity>
                <Text style={[s.modalBaslik, { color: t.text }]}>{secilenNokta.isim}</Text>
                <Text style={[s.modalAlt, { color: t.textSecondary }]}>Mevcut durumu seç</Text>
              </View>
              <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
                <View style={s.durumGrid}>
                  {DURUM_SECENEKLERI.map(d => (
                    <TouchableOpacity
                      key={d.key}
                      style={[
                        s.durumBtn,
                        { borderColor: d.renk, backgroundColor: t.bgCard },
                        secilenDurum === d.key && { backgroundColor: d.renk + '25' },
                      ]}
                      onPress={() => setSecilenDurum(d.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.durumBtnSimge, { color: d.renk }]}>{d.simge}</Text>
                      <Text style={[s.durumBtnLabel, { color: d.renk }]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {secilenDurum && !detayAcik && secilenDurum !== 'erken_kapanis' && secilenDurum !== 'gec_acilis' && secilenDurum !== 'serbest_not' && (
                  <TouchableOpacity style={s.detayEkleBtn} onPress={() => setDetayAcik(true)} activeOpacity={0.7}>
                    <Text style={[s.detayEkleBtnYazi, { color: t.primary }]}>+ Detay Ekle (opsiyonel)</Text>
                  </TouchableOpacity>
                )}

                {(detayAcik || secilenDurum === 'erken_kapanis' || secilenDurum === 'gec_acilis' || secilenDurum === 'serbest_not') && (
                  <View style={[s.detayAlani, { backgroundColor: t.bgCard }]}>
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

              <View style={s.modalAltBar}>
                {secilenDurum ? (
                  <TouchableOpacity
                    style={[s.gonderBtn, gonderiyor && { opacity: 0.5 }]}
                    onPress={gonder}
                    disabled={gonderiyor}
                    activeOpacity={0.7}
                  >
                    {gonderiyor
                      ? <ActivityIndicator color={t.text} size="small" />
                      : <Text style={s.gonderBtnYazi}>Bildir</Text>
                    }
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[s.kapatBtn, { backgroundColor: t.bgSecondary }]} onPress={kapat}>
                  <Text style={[s.kapatYazi, { color: t.primary }]}>İptal</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// STİLLER
// ═══════════════════════════════════════════════════════
const s = StyleSheet.create({
  // Panel (Ana Sayfa üstü) — Mavi-beyaz tema
  panel: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: '#EAF4FB',
    padding: 14,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#9DC5DB',
    borderLeftWidth: 0.5,
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  panelBaslik: {
    color: '#0077B6',
    fontSize: 16,
    fontWeight: '700',
  },
  panelBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bildirBtnShadow: {
    borderRadius: 8,
    shadowColor: '#003D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  bildirBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderRightColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.25)',
  },
  btnGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  bildirBtnYazi: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Uyarı bandı
  uyariBant: {
    backgroundColor: '#FEF3E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E09F3E',
  },
  uyariBantYazi: {
    color: '#E09F3E',
    fontSize: 12,
    fontWeight: '600',
  },

  // Küçük kart
  kartKucuk: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1.5,
    borderBottomColor: '#D6EAF8',
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  kartSimge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 10,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightColor: 'rgba(0,0,0,0.1)',
    borderBottomColor: 'rgba(0,0,0,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  kartSimgeYazi: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' as const },
  kartIcerik: { flex: 1 },
  kartIsim: { color: '#1A1A2E', fontSize: 13, fontWeight: '600' },
  kartAltSatir: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 },
  kartDurum: { fontSize: 12, fontWeight: '600' },
  kartBekleme: { color: '#E09F3E', fontSize: 11 },
  kartNot: { color: '#5A7A8A', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  kartSag: { alignItems: 'flex-end', marginLeft: 8 },
  kartZaman: { color: '#5A7A8A', fontSize: 10 },
  kartRehber: { color: '#7A9AAA', fontSize: 9, marginTop: 2 },

  // Sabitlenmiş kart
  kartSabit: {
    borderLeftColor: '#0077B6',
    borderWidth: 1,
    borderColor: '#B0D4E8',
    backgroundColor: '#F0F8FF',
  },
  kartSabitYazi: { color: '#0077B6', fontSize: 10, fontWeight: '600' },
  pinBadge: {
    backgroundColor: '#0077B620',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pinBadgeYazi: { color: '#0077B6', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  // Boş durum
  bosKutu: { alignItems: 'center', paddingVertical: 16 },
  bosYazi: { color: '#5A7A8A', fontSize: 13, textAlign: 'center' },
  bosAlt: { color: '#7A9AAA', fontSize: 11, marginTop: 4 },

  // Tümünü gör
  tumunuGorBtn: { alignItems: 'center', paddingTop: 8 },
  tumunuGorYazi: { color: '#0077B6', fontSize: 12, fontWeight: '600' },

  // Hata
  hataYazi: { color: '#D62828', fontSize: 11, textAlign: 'center', marginTop: 6 },

  // Kategori başlık (Tüm modal)
  katBaslik: { color: '#0077B6', fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 6, marginLeft: 4 },

  // Modal ortak
  modalArka: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKutu: {
    backgroundColor: '#F0F8FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: { marginBottom: 12 },
  modalBaslik: { color: '#1A1A2E', fontSize: 18, fontWeight: '700' },
  modalAlt: { color: '#5A7A8A', fontSize: 12, marginTop: 4 },
  modalAltBar: { marginTop: 12, gap: 8 },

  // Bildir butonu büyük
  bildirBtnBuyuk: {
    backgroundColor: '#0077B6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderRightColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#003D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  bildirBtnBuyukYazi: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Kapat
  kapatBtn: {
    backgroundColor: '#D6EAF8',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  kapatYazi: { color: '#0077B6', fontSize: 14, fontWeight: '600' },

  // Geri
  geriBtn: { color: '#0077B6', fontSize: 16, fontWeight: '700', marginBottom: 6 },

  // Arama
  aramaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    color: '#1A1A2E',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#B0D4E8',
    marginBottom: 8,
  },

  // Kategori chip'leri
  katScrollRow: { marginBottom: 8, maxHeight: 36 },
  katChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#B0D4E8',
  },
  katChipAktif: { backgroundColor: '#0077B620', borderColor: '#0077B6' },
  katChipYazi: { color: '#5A7A8A', fontSize: 12 },
  katChipYaziAktif: { color: '#0077B6' },

  // Nokta seçim listesi
  noktaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D6EAF8',
  },
  // noktaEmoji kaldirildi (emoji yok)
  noktaIsim: { color: '#1A1A2E', fontSize: 14, flex: 1 },
  noktaOk: { color: '#0077B6', fontSize: 20 },

  // Durum seçim grid
  durumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  durumBtn: {
    width: '47%' as any,
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  durumBtnSimge: { fontSize: 24, fontWeight: '700' as const, marginBottom: 4 },
  durumBtnLabel: { fontSize: 13, fontWeight: '700' },

  // Detay ekle
  detayEkleBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  detayEkleBtnYazi: { color: '#0077B6', fontSize: 13, fontWeight: '600' },

  // Detay alanı
  detayAlani: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
  },
  detaySatir: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detayLabel: { color: '#5A7A8A', fontSize: 12, width: 100 },
  detayInput: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 8,
    color: '#1A1A2E',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#B0D4E8',
  },

  // Detay modal
  detayModalKutu: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  detayModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D6EAF8',
    gap: 12,
  },
  detayModalSimge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  detayModalIsim: { fontSize: 16, fontWeight: '700' as const },
  detayModalDurum: { fontSize: 13, fontWeight: '600' as const, marginTop: 2 },
  detayModalKapat: { fontSize: 18, fontWeight: '600' as const, padding: 4 },
  detayModalSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D6EAF8',
  },
  detayModalLabel: { fontSize: 13, fontWeight: '500' as const },
  detayModalDeger: { fontSize: 14, fontWeight: '600' as const },
  detayModalNotKutu: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  detayModalNot: { fontSize: 14, lineHeight: 21 },
  detayModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
  },
  detayModalZaman: { fontSize: 12 },

  // Gönder butonu
  gonderBtn: {
    backgroundColor: '#00A8E8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderRightColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.2)',
    shadowColor: '#005A8D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  gonderBtnYazi: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
