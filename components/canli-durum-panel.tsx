import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
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
  const [bildirModal, setBildirModal] = useState(false);
  const [girisYapildi, setGirisYapildi] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setGirisYapildi(!!user));
  }, []);

  const bildirAc = () => {
    if (!girisYapildi) {
      Alert.alert(
        'Giriş Gerekli',
        'Saha bildirimi yapabilmek için üye girişi yapmalısın.\n\n🚨 Acil sekmesinden giriş yapabilirsin.',
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
  const [tumunuGorModal, setTumunuGorModal] = useState(false);
  const [bildirModal, setBildirModal] = useState(false);
  const [girisYapildi, setGirisYapildi] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setGirisYapildi(!!user));
  }, []);

  const bildirTikla = () => {
    if (!girisYapildi) {
      Alert.alert(
        'Giriş Gerekli',
        'Saha bildirimi yapabilmek için üye girişi yapmalısın.\n\n🚨 Acil sekmesinden giriş yapabilirsin.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }
    setBildirModal(true);
  };

  // Sadece son 2 saat içindeki bildirimleri göster
  const guncelDurumlar = durumlar.filter(d => d.dakika_once < 120);
  // Normal olmayanları öne al
  const onemliDurumlar = guncelDurumlar.filter(d => d.durum !== 'normal');
  const gosterilecek = onemliDurumlar.length > 0 ? onemliDurumlar.slice(0, 4) : guncelDurumlar.slice(0, 3);

  return (
    <View style={s.panel}>
      <View style={s.panelHeader}>
        <Text style={s.panelBaslik}>Saha Durumu</Text>
        <View style={s.panelBtnRow}>
          <TouchableOpacity style={s.bildirBtn} onPress={bildirTikla} activeOpacity={0.7}>
            <Text style={s.bildirBtnYazi}>＋ Bildir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {yukleniyor ? (
        <ActivityIndicator color="#0077B6" style={{ marginVertical: 12 }} />
      ) : guncelDurumlar.length === 0 ? (
        <View style={s.bosKutu}>
          <Text style={s.bosYazi}>Henüz saha bildirimi yok</Text>
          <Text style={s.bosAlt}>İlk bildirimi sen yap!</Text>
        </View>
      ) : (
        <>
          {onemliDurumlar.length > 0 && (
            <View style={s.uyariBant}>
              <Text style={s.uyariBantYazi}>⚠️ {onemliDurumlar.length} mekanda dikkat gerektiren durum</Text>
            </View>
          )}
          {gosterilecek.map(d => (
            <DurumKartKucuk key={d.id} item={d} />
          ))}
          {guncelDurumlar.length > gosterilecek.length && (
            <TouchableOpacity style={s.tumunuGorBtn} onPress={() => setTumunuGorModal(true)} activeOpacity={0.7}>
              <Text style={s.tumunuGorYazi}>Tümünü Gör ({guncelDurumlar.length} bildirim) ›</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {hata && <Text style={s.hataYazi}>⚠ {hata}</Text>}

      {/* TÜMÜNÜ GÖR MODAL */}
      <TumDurumlarModal
        visible={tumunuGorModal}
        onClose={() => setTumunuGorModal(false)}
        durumlar={guncelDurumlar}
        onBildir={() => { setTumunuGorModal(false); setBildirModal(true); }}
      />

      {/* BİLDİR MODAL */}
      <DurumBildirModal
        visible={bildirModal}
        onClose={() => setBildirModal(false)}
        noktalar={noktalar}
        gonderiyor={gonderiyor}
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
function DurumKartKucuk({ item }: { item: CanliDurumItem }) {
  const info = durumBilgi(item.durum);
  return (
    <View style={[s.kartKucuk, { borderLeftColor: info.renk }]}>
      <Text style={s.kartEmoji}>{item.nokta_emoji}</Text>
      <View style={s.kartIcerik}>
        <Text style={s.kartIsim} numberOfLines={1}>{item.nokta_isim}</Text>
        <View style={s.kartAltSatir}>
          <Text style={[s.kartDurum, { color: info.renk }]}>{info.emoji} {info.label}</Text>
          {item.bekleme_dk ? <Text style={s.kartBekleme}>~{item.bekleme_dk}dk</Text> : null}
        </View>
        {item.not_metni ? <Text style={s.kartNot} numberOfLines={1}>{item.not_metni}</Text> : null}
      </View>
      <View style={s.kartSag}>
        <Text style={s.kartZaman}>{zamanOnce(item.dakika_once)}</Text>
        {item.rehber_isim ? <Text style={s.kartRehber}>{item.rehber_isim}</Text> : null}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// 3) TÜM DURUMLAR MODAL
// ═══════════════════════════════════════════════════════
function TumDurumlarModal({
  visible, onClose, durumlar, onBildir,
}: {
  visible: boolean; onClose: () => void; durumlar: CanliDurumItem[]; onBildir: () => void;
}) {
  // Kategori bazlı grupla
  const kategoriler = [
    { key: 'cami', label: 'Camiler' },
    { key: 'saray', label: 'Saraylar' },
    { key: 'muze', label: 'Müzeler' },
    { key: 'carsi', label: 'Çarşılar' },
    { key: 'meydan', label: 'Meydanlar' },
    { key: 'iskele', label: 'İskeleler' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalArka}>
        <View style={s.modalKutu}>
          <View style={s.modalHeader}>
            <Text style={s.modalBaslik}>Saha Durumu — Tümü</Text>
            <Text style={s.modalAlt}>{durumlar.length} aktif bildirim</Text>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            {kategoriler.map(kat => {
              const katDurumlar = durumlar.filter(d =>
                kat.key === 'muze' ? (d.nokta_kategori === 'muze' || d.nokta_kategori === 'ozel_muze') : d.nokta_kategori === kat.key
              );
              if (katDurumlar.length === 0) return null;
              return (
                <View key={kat.key}>
                  <Text style={s.katBaslik}>{kat.label}</Text>
                  {katDurumlar.map(d => <DurumKartKucuk key={d.id} item={d} />)}
                </View>
              );
            })}
            {durumlar.length === 0 && (
              <View style={s.bosKutu}>
                <Text style={s.bosYazi}>Aktif bildirim yok</Text>
              </View>
            )}
          </ScrollView>
          <View style={s.modalAltBar}>
            <TouchableOpacity style={s.bildirBtnBuyuk} onPress={onBildir} activeOpacity={0.7}>
              <Text style={s.bildirBtnBuyukYazi}>＋ Durum Bildir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.kapatBtn} onPress={onClose}>
              <Text style={s.kapatYazi}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// 4) DURUM BİLDİR MODAL (Hızlı + Detay)
// ═══════════════════════════════════════════════════════
function DurumBildirModal({
  visible, onClose, noktalar, gonderiyor, onBildir,
}: {
  visible: boolean;
  onClose: () => void;
  noktalar: SahaNokta[];
  gonderiyor: boolean;
  onBildir: (p: { nokta_id: string; durum: DurumTipi; bekleme_dk?: number; not_metni?: string; kapali_bolum?: string }) => Promise<boolean>;
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
      <View style={s.modalArka}>
        <View style={s.modalKutu}>
          {/* ADIM 1: Nokta Seç */}
          {adim === 'nokta' && (
            <>
              <View style={s.modalHeader}>
                <Text style={s.modalBaslik}>Mekan Seç</Text>
                <Text style={s.modalAlt}>Hangi mekan için bildirim yapacaksın?</Text>
              </View>
              <TextInput
                style={s.aramaInput}
                placeholder="Mekan ara..."
                placeholderTextColor="#4a6a7a"
                value={arama}
                onChangeText={setArama}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.katScrollRow}>
                {kategoriListesi.map(k => (
                  <TouchableOpacity
                    key={k.key ?? 'all'}
                    style={[s.katChip, seciliKategori === k.key && s.katChipAktif]}
                    onPress={() => setSeciliKategori(k.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.katChipYazi, seciliKategori === k.key && s.katChipYaziAktif]}>{k.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={{ maxHeight: 340 }}>
                {filtreliNoktalar.map(n => (
                  <TouchableOpacity
                    key={n.id}
                    style={s.noktaSatir}
                    onPress={() => { setSecilenNokta(n); setAdim('durum'); }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.noktaEmoji}>{n.emoji}</Text>
                    <Text style={s.noktaIsim}>{n.isim}</Text>
                    <Text style={s.noktaOk}>›</Text>
                  </TouchableOpacity>
                ))}
                {filtreliNoktalar.length === 0 && (
                  <Text style={s.bosYazi}>Mekan bulunamadı</Text>
                )}
              </ScrollView>
              <TouchableOpacity style={s.kapatBtn} onPress={kapat}>
                <Text style={s.kapatYazi}>İptal</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ADIM 2: Durum Seç */}
          {adim === 'durum' && secilenNokta && (
            <>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setAdim('nokta')}>
                  <Text style={s.geriBtn}>‹ Geri</Text>
                </TouchableOpacity>
                <Text style={s.modalBaslik}>{secilenNokta.emoji} {secilenNokta.isim}</Text>
                <Text style={s.modalAlt}>Mevcut durumu seç</Text>
              </View>
              <View style={s.durumGrid}>
                {DURUM_SECENEKLERI.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[
                      s.durumBtn,
                      { borderColor: d.renk },
                      secilenDurum === d.key && { backgroundColor: d.renk + '25' },
                    ]}
                    onPress={() => setSecilenDurum(d.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.durumBtnEmoji}>{d.emoji}</Text>
                    <Text style={[s.durumBtnLabel, { color: d.renk }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {secilenDurum && !detayAcik && (
                <TouchableOpacity style={s.detayEkleBtn} onPress={() => setDetayAcik(true)} activeOpacity={0.7}>
                  <Text style={s.detayEkleBtnYazi}>＋ Detay Ekle (opsiyonel)</Text>
                </TouchableOpacity>
              )}

              {detayAcik && (
                <View style={s.detayAlani}>
                  <View style={s.detaySatir}>
                    <Text style={s.detayLabel}>Bekleme (dk)</Text>
                    <TextInput
                      style={s.detayInput}
                      placeholder="örn: 30"
                      placeholderTextColor="#4a6a7a"
                      keyboardType="numeric"
                      value={bekleme}
                      onChangeText={setBekleme}
                    />
                  </View>
                  {(secilenDurum === 'kismi_kapali' || secilenDurum === 'restorasyon') && (
                    <View style={s.detaySatir}>
                      <Text style={s.detayLabel}>Kapalı bölüm</Text>
                      <TextInput
                        style={s.detayInput}
                        placeholder="örn: Harem bölümü"
                        placeholderTextColor="#4a6a7a"
                        value={kapaliBolum}
                        onChangeText={setKapaliBolum}
                      />
                    </View>
                  )}
                  <View style={s.detaySatir}>
                    <Text style={s.detayLabel}>Not</Text>
                    <TextInput
                      style={[s.detayInput, { height: 50 }]}
                      placeholder="Kısa açıklama..."
                      placeholderTextColor="#4a6a7a"
                      multiline
                      value={notMetni}
                      onChangeText={setNotMetni}
                    />
                  </View>
                </View>
              )}

              <View style={s.modalAltBar}>
                {secilenDurum ? (
                  <TouchableOpacity
                    style={[s.gonderBtn, gonderiyor && { opacity: 0.5 }]}
                    onPress={gonder}
                    disabled={gonderiyor}
                    activeOpacity={0.7}
                  >
                    {gonderiyor
                      ? <ActivityIndicator color="#08131f" size="small" />
                      : <Text style={s.gonderBtnYazi}>Bildir ✓</Text>
                    }
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={s.kapatBtn} onPress={kapat}>
                  <Text style={s.kapatYazi}>İptal</Text>
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
  bildirBtn: {
    backgroundColor: '#0077B6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  kartEmoji: { fontSize: 22, marginRight: 10 },
  kartIcerik: { flex: 1 },
  kartIsim: { color: '#1A1A2E', fontSize: 13, fontWeight: '600' },
  kartAltSatir: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 },
  kartDurum: { fontSize: 12, fontWeight: '600' },
  kartBekleme: { color: '#E09F3E', fontSize: 11 },
  kartNot: { color: '#5A7A8A', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  kartSag: { alignItems: 'flex-end', marginLeft: 8 },
  kartZaman: { color: '#5A7A8A', fontSize: 10 },
  kartRehber: { color: '#7A9AAA', fontSize: 9, marginTop: 2 },

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
    maxHeight: '85%',
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
  noktaEmoji: { fontSize: 20, marginRight: 12 },
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
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  durumBtnEmoji: { fontSize: 28, marginBottom: 4 },
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

  // Gönder butonu
  gonderBtn: {
    backgroundColor: '#00A8E8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  gonderBtnYazi: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
