// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Gradyan bant → Kart + Kicker; duyurular sol accent (safran = sabit, kobalt = normal) + SABİT Rozet.
// Modallar ModalKapak dilinde; hook'lar, state'ler, Alert akışları ve aksiyon barı birebir korundu.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTema } from '../hooks/use-tema';
import { useAdmin } from '../hooks/use-admin';
import { useGenelDuyuru, type Duyuru } from '../hooks/use-genel-duyuru';
import { Font, Palette, Radius, type TemaRenkleri } from '../constants/theme';
import { BirincilButon, BolumBaslik, BosDurum, Kart, Kicker, ModalKapak, Rozet } from './ui/pusula-ui';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ═══════════════════════════════════════════
   Tarih formatla (zaman once)
   ═══════════════════════════════════════════ */
function zamanOnce(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return 'şimdi';
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  if (gun < 7) return `${gun} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

/* ═══════════════════════════════════════════
   ANA SAYFA ÖZET PANELİ
   ═══════════════════════════════════════════ */
export function GenelDuyuruPanel() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();
  const { duyurular, yukleniyor, duyuruEkle, duyuruGuncelle, duyuruSil, duyuruSabitle, gorselYukle } = useGenelDuyuru();

  const [detayDuyuru, setDetayDuyuru] = useState<Duyuru | null>(null);
  const [tamEkranGorsel, setTamEkranGorsel] = useState<string | null>(null);
  const [ekleModal, setEkleModal] = useState(false);
  const [duzenleDuyuru, setDuzenleDuyuru] = useState<Duyuru | null>(null);  // v1.1.0: edit modu

  // Goster sirasi: sabit once, sonra son 5 normal
  const sabitler = duyurular.filter(d => d.sabitlendi);
  const normaller = duyurular.filter(d => !d.sabitlendi).slice(0, 5);
  const goster = [...sabitler, ...normaller];

  if (yukleniyor) {
    return (
      <View style={s.bolum}>
        <Kart>
          <BolumBaslik baslik="Genel Duyurular" renk={t.primary} />
          <View style={s.placeholder}>
            <ActivityIndicator size="small" color={t.primary} />
          </View>
        </Kart>
      </View>
    );
  }

  return (
    <View style={s.bolum}>
      <Kart>
        {/* Kicker + yetkiliye "+ Yeni" (safran) */}
        <BolumBaslik
          baslik="Genel Duyurular"
          renk={t.primary}
          sag={isYetkili ? '+ Yeni' : undefined}
          onSag={isYetkili ? () => setEkleModal(true) : undefined}
        />

        {goster.length === 0 ? (
          <BosDurum metin={isYetkili ? '+ Yeni dokunarak ilk duyuruyu yaz' : 'Henüz duyuru yok'} />
        ) : (
          <View style={s.liste}>
            {goster.map((d, i) => (
              <View
                key={d.id}
                style={[s.duyuru, i > 0 && { borderTopWidth: 1, borderTopColor: t.divider }]}>
                <View style={s.duyuruSatir}>
                  {/* Sol accent: sabit = safran, normal = kobalt */}
                  <View style={[s.duyuruAccent, { backgroundColor: d.sabitlendi ? t.accent : t.primary }]} />
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setDetayDuyuru(d)}
                      style={s.kartIcerikSarmal}>
                      <View style={{ flex: 1 }}>
                        <View style={s.kartUst}>
                          {d.sabitlendi && (
                            <Rozet renk={Palette.altin}>SABİT</Rozet>
                          )}
                          <Text style={[s.kartBaslik, { color: t.text }]} numberOfLines={2}>
                            {d.baslik}
                          </Text>
                        </View>
                        {d.icerik && (
                          <Text style={[s.kartIcerik, { color: t.textSecondary }]} numberOfLines={2}>
                            {d.icerik}
                          </Text>
                        )}
                        <View style={s.kartAlt}>
                          <Text style={[s.kartMeta, { color: t.textMuted }]}>
                            {d.olusturan_isim || 'Yetkili'} · {zamanOnce(d.created_at)}
                          </Text>
                          {d.gorsel_url && (
                            <Text style={[s.kartMetaLink, { color: t.primary }]}>Görsel ›</Text>
                          )}
                        </View>
                      </View>
                      {d.gorsel_url && (
                        <TouchableOpacity onPress={() => setTamEkranGorsel(d.gorsel_url)} activeOpacity={0.7}>
                          <Image source={{ uri: d.gorsel_url }} style={s.kartThumb} resizeMode="cover" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {/* v1.1.0: Yetkili aksiyon butonlari — kart altinda, gorunur */}
                    {isYetkili && (
                      <View style={[s.yetkiliAksiyonBar, { borderTopColor: t.divider }]}>
                        <TouchableOpacity
                          onPress={() => { setDuzenleDuyuru(d); setEkleModal(true); }}
                          style={s.yetkiliBtn}
                          activeOpacity={0.6}>
                          <Text style={[s.yetkiliBtnText, { color: t.primary }]}>Düzenle</Text>
                        </TouchableOpacity>
                        <View style={[s.yetkiliBtnAyrac, { backgroundColor: t.divider }]} />
                        <TouchableOpacity
                          onPress={() => duyuruSabitle(d.id, !d.sabitlendi)}
                          style={s.yetkiliBtn}
                          activeOpacity={0.6}>
                          <Text style={[s.yetkiliBtnText, { color: Palette.altin }]}>
                            {d.sabitlendi ? 'Sabit Kaldır' : 'Sabitle'}
                          </Text>
                        </TouchableOpacity>
                        <View style={[s.yetkiliBtnAyrac, { backgroundColor: t.divider }]} />
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert('Duyuruyu Sil', `"${d.baslik}" silinecek. Emin misin?`, [
                              { text: 'Vazgeç', style: 'cancel' },
                              {
                                text: 'Sil',
                                style: 'destructive',
                                onPress: async () => {
                                  const basarili = await duyuruSil(d.id);
                                  if (!basarili) {
                                    Alert.alert(
                                      'Silinemedi',
                                      'Duyuru silinemedi. Yetkin olduğundan ve internet bağlantın olduğundan emin ol.',
                                    );
                                  }
                                },
                              },
                            ]);
                          }}
                          style={s.yetkiliBtn}
                          activeOpacity={0.6}>
                          <Text style={[s.yetkiliBtnText, { color: t.durumKapali }]}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </Kart>

      {/* Detay modal (uzun metin + buyuk gorsel) */}
      <DetayModal
        duyuru={detayDuyuru}
        onClose={() => setDetayDuyuru(null)}
        onGorselTikla={(url) => {
          setDetayDuyuru(null);
          setTimeout(() => setTamEkranGorsel(url), 200);
        }}
        t={t}
      />

      {/* Tam ekran gorsel modal */}
      <TamEkranGorselModal
        url={tamEkranGorsel}
        onClose={() => setTamEkranGorsel(null)}
      />

      {/* Yeni / Duzenle duyuru modal */}
      {isYetkili && (
        <EkleModal
          visible={ekleModal}
          duyuru={duzenleDuyuru}
          onClose={() => { setEkleModal(false); setDuzenleDuyuru(null); }}
          onEkle={duyuruEkle}
          onGuncelle={duyuruGuncelle}
          onGorselYukle={gorselYukle}
          t={t}
        />
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════
   YETKİLİ AKSIYONLARI (uzun basma)
   ═══════════════════════════════════════════ */
function yetkiliAksiyonlari(
  d: Duyuru,
  duyuruSil: (id: string) => Promise<boolean>,
  duyuruSabitle: (id: string, s: boolean) => Promise<boolean>,
) {
  Alert.alert(
    d.baslik,
    'Duyuru için ne yapmak istersiniz?',
    [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: d.sabitlendi ? 'Sabit kaldır' : 'Sabitle',
        onPress: () => duyuruSabitle(d.id, !d.sabitlendi),
      },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Emin misin?', 'Bu duyuru kalıcı olarak silinecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Sil',
              style: 'destructive',
              onPress: async () => {
                const basarili = await duyuruSil(d.id);
                if (!basarili) {
                  Alert.alert(
                    'Silinemedi',
                    'Duyuru silinemedi. Yetkin olduğundan ve internet bağlantın olduğundan emin ol.',
                  );
                }
              },
            },
          ]);
        },
      },
    ]
  );
}

/* ═══════════════════════════════════════════
   DETAY MODAL (tam metin + thumbnail) — ModalKapak dili
   ═══════════════════════════════════════════ */
function DetayModal({
  duyuru,
  onClose,
  onGorselTikla,
  t,
}: {
  duyuru: Duyuru | null;
  onClose: () => void;
  onGorselTikla: (url: string) => void;
  t: TemaRenkleri;
}) {
  if (!duyuru) return null;
  const s = createStyles(t);

  return (
    <Modal visible={!!duyuru} animationType="slide" transparent onRequestClose={onClose}>
      <ModalKapak
        baslik={duyuru.baslik}
        alt={`${duyuru.olusturan_isim || 'Yetkili'} · ${zamanOnce(duyuru.created_at)}`}
        onKapat={onClose}>
        <ScrollView style={s.detayScroll} contentContainerStyle={{ paddingBottom: 8 }}>
          {duyuru.icerik && (
            <Text style={[s.detayIcerik, { color: t.text }]}>{duyuru.icerik}</Text>
          )}
          {duyuru.gorsel_url && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => onGorselTikla(duyuru.gorsel_url!)}>
              <Image source={{ uri: duyuru.gorsel_url }} style={s.detayGorsel} resizeMode="cover" />
              <Text style={[s.detayGorselHint, { color: t.textMuted }]}>
                Tam ekran için dokun
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </ModalKapak>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   TAM EKRAN GÖRSEL MODAL (pinch-to-zoom)
   ═══════════════════════════════════════════ */
function TamEkranGorselModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;

  return (
    <Modal visible={!!url} animationType="fade" transparent onRequestClose={onClose}>
      <View style={tamEkranStyles.overlay}>
        <TouchableOpacity onPress={onClose} style={tamEkranStyles.kapatBtn} hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <Text style={tamEkranStyles.kapatBtnText}>Kapat ×</Text>
        </TouchableOpacity>

        <ScrollView
          style={tamEkranStyles.scrollView}
          contentContainerStyle={tamEkranStyles.scrollContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          pinchGestureEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          centerContent>
          <Image
            source={{ uri: url }}
            style={{ width: SCREEN_W, height: SCREEN_H * 0.85 }}
            resizeMode="contain"
          />
        </ScrollView>

        <Text style={tamEkranStyles.altYazi}>İki parmakla yakınlaştırın · Kapatmak için yukarıdaki butona dokunun</Text>
      </View>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   YENİ DUYURU EKLE MODAL (admin/moderator) — ModalKapak dili
   ═══════════════════════════════════════════ */
function EkleModal({
  visible,
  duyuru,  // v1.1.0: edit modu icin (varsa initial value'lar dolar, "Guncelle" butonuna donusur)
  onClose,
  onEkle,
  onGuncelle,
  onGorselYukle,
  t,
}: {
  visible: boolean;
  duyuru?: Duyuru | null;
  onClose: () => void;
  onEkle: (p: { baslik: string; icerik?: string; gorsel_url?: string; sabitlendi?: boolean }) => Promise<boolean>;
  onGuncelle: (id: string, p: { baslik?: string; icerik?: string | null; gorsel_url?: string | null; sabitlendi?: boolean }) => Promise<boolean>;
  onGorselYukle: (uri: string, mime?: string) => Promise<string | null>;
  t: TemaRenkleri;
}) {
  const s = createStyles(t);
  const editMode = !!duyuru;

  const [baslik, setBaslik] = useState(duyuru?.baslik || '');
  const [icerik, setIcerik] = useState(duyuru?.icerik || '');
  const [gorselUri, setGorselUri] = useState<string | null>(duyuru?.gorsel_url || null);
  const [gorselMime, setGorselMime] = useState<string>('image/jpeg');
  const [gorselYeniSecildi, setGorselYeniSecildi] = useState(false);
  const [sabitlendi, setSabitlendi] = useState(duyuru?.sabitlendi || false);
  const [yuklemede, setYuklemede] = useState(false);

  // Edit mode: prop degisirse formu yeniden doldur
  useEffect(() => {
    if (visible && duyuru) {
      setBaslik(duyuru.baslik);
      setIcerik(duyuru.icerik || '');
      setGorselUri(duyuru.gorsel_url || null);
      setGorselYeniSecildi(false);
      setSabitlendi(duyuru.sabitlendi);
    }
  }, [visible, duyuru]);

  const sifirla = () => {
    setBaslik('');
    setIcerik('');
    setGorselUri(null);
    setGorselMime('image/jpeg');
    setGorselYeniSecildi(false);
    setSabitlendi(false);
    setYuklemede(false);
  };

  const kapat = () => {
    sifirla();
    onClose();
  };

  const fotoSec = async () => {
    try {
      const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!izin.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişimi gerekli.');
        return;
      }
      const sonuc = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85, // hafif sikistirma, okunabilirlik korunsun
        allowsEditing: false,
        exif: false,
      });
      if (sonuc.canceled || !sonuc.assets || sonuc.assets.length === 0) return;
      const asset = sonuc.assets[0];
      setGorselUri(asset.uri);
      setGorselMime(asset.mimeType || 'image/jpeg');
      setGorselYeniSecildi(true);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Fotoğraf seçilemedi.');
    }
  };

  const kaydet = async () => {
    if (!baslik.trim()) {
      Alert.alert('Eksik', 'Başlık zorunlu.');
      return;
    }
    setYuklemede(true);
    try {
      // Gorsel: yeni secildiyse yukle, yoksa mevcut url'yi koru (edit mode'da)
      let gorsel_url: string | undefined | null = undefined;
      if (gorselYeniSecildi && gorselUri) {
        const yuklenenUrl = await onGorselYukle(gorselUri, gorselMime);
        if (!yuklenenUrl) {
          Alert.alert('Hata', 'Görsel yüklenemedi. Tekrar denenecek mi?');
          setYuklemede(false);
          return;
        }
        gorsel_url = yuklenenUrl;
      } else if (editMode && !gorselUri) {
        // Edit mode'da mevcut gorsel kaldirildi
        gorsel_url = null;
      }

      let ok = false;
      if (editMode && duyuru) {
        // Edit mode: guncelle
        const updateParams: any = {
          baslik: baslik.trim(),
          icerik: icerik.trim() || null,
          sabitlendi,
        };
        if (gorsel_url !== undefined) updateParams.gorsel_url = gorsel_url;
        ok = await onGuncelle(duyuru.id, updateParams);
      } else {
        // Ekle modu
        ok = await onEkle({
          baslik: baslik.trim(),
          icerik: icerik.trim() || undefined,
          gorsel_url: gorsel_url || undefined,
          sabitlendi,
        });
      }

      if (ok) {
        kapat();
      } else {
        Alert.alert('Hata', editMode ? 'Duyuru güncellenemedi.' : 'Duyuru eklenemedi.');
      }
    } finally {
      setYuklemede(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={kapat}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* Yükleme sırasında kapatma kilitli (eski "×" butonunun disabled davranışı) */}
        <ModalKapak
          baslik={editMode ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}
          onKapat={() => { if (!yuklemede) kapat(); }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            <Kicker style={s.ekleLabel}>Başlık</Kicker>
            <TextInput
              style={[s.ekleInput, { color: t.text, borderColor: t.kartBorder, backgroundColor: t.bgInput }]}
              value={baslik}
              onChangeText={setBaslik}
              placeholder="Kısa, dikkat çekici"
              placeholderTextColor={t.textMuted}
              maxLength={120}
            />

            <Kicker style={s.ekleLabel}>İçerik (opsiyonel)</Kicker>
            <TextInput
              style={[s.ekleInput, s.ekleInputCok, { color: t.text, borderColor: t.kartBorder, backgroundColor: t.bgInput }]}
              value={icerik}
              onChangeText={setIcerik}
              placeholder="Açıklama, detay, link..."
              placeholderTextColor={t.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Kicker style={s.ekleLabel}>Görsel (opsiyonel)</Kicker>
            {gorselUri ? (
              <View>
                <Image source={{ uri: gorselUri }} style={s.ekleGorselOnizle} resizeMode="cover" />
                <TouchableOpacity onPress={() => setGorselUri(null)} style={[s.ekleGorselDegistir, { backgroundColor: t.bgSecondary }]}>
                  <Text style={[s.ekleGorselDegistirText, { color: t.primary }]}>Görseli Kaldır</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={fotoSec} style={[s.ekleGorselSec, { borderColor: t.primary, backgroundColor: t.bgCard }]}>
                <Text style={[s.ekleGorselSecText, { color: t.primary }]}>+ Galeriden Foto Seç</Text>
              </TouchableOpacity>
            )}

            <View style={[s.ekleSabit, { borderColor: t.kartBorder, backgroundColor: t.bgCard }]}>
              <View>
                <Text style={[s.ekleSabitBaslik, { color: t.text }]}>Sabitle</Text>
                <Text style={[s.ekleSabitNot, { color: t.textMuted }]}>Üstte sürekli görünür</Text>
              </View>
              <Switch
                value={sabitlendi}
                onValueChange={setSabitlendi}
                trackColor={{ false: t.divider, true: t.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <BirincilButon
              baslik={editMode ? 'Güncelle' : 'Yayınla ve Bildirim Gönder'}
              onPress={kaydet}
              varyant="cta"
              yukleniyor={yuklemede}
              disabled={yuklemede || !baslik.trim()}
              style={s.ekleKaydetBtn}
            />

            <Text style={[s.ekleBilgi, { color: t.textMuted }]}>
              {editMode
                ? 'Düzenleme push bildirimi tetiklemez.'
                : 'Yayınlanır yayınlanmaz tüm rehberlere push bildirim gönderilir.'}
            </Text>
          </ScrollView>
        </ModalKapak>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */
const createStyles = (t: TemaRenkleri) =>
  StyleSheet.create({
    bolum: {
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    placeholder: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    liste: {
      marginTop: 2,
    },
    duyuru: {
      paddingVertical: 10,
    },
    duyuruSatir: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    duyuruAccent: {
      width: 4,
      borderRadius: 2,
      marginRight: 12,
    },
    kartUst: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    kartBaslik: {
      flex: 1,
      fontFamily: Font.bold,
      fontSize: 14,
      letterSpacing: -0.3,
    },
    kartIcerik: {
      fontFamily: Font.regular,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 4,
    },
    kartAlt: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    kartMeta: {
      fontFamily: Font.regular,
      fontSize: 11,
    },
    kartMetaLink: {
      fontFamily: Font.semibold,
      fontSize: 11,
    },
    kartThumb: {
      width: 56,
      height: 56,
      borderRadius: Radius.sm,
      backgroundColor: t.bgSecondary,
    },

    // v1.1.0: Yetkili aksiyon bar (kart altinda gorunur butonlar)
    kartIcerikSarmal: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    yetkiliAksiyonBar: {
      flexDirection: 'row',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
    },
    yetkiliBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
    },
    yetkiliBtnText: {
      fontFamily: Font.semibold,
      fontSize: 12,
    },
    yetkiliBtnAyrac: {
      width: 1,
      marginVertical: 4,
    },

    // Detay modal
    detayScroll: {
      maxHeight: 600,
    },
    detayIcerik: {
      fontFamily: Font.regular,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
    },
    detayGorsel: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: Radius.md,
      backgroundColor: t.bgSecondary,
    },
    detayGorselHint: {
      fontFamily: Font.regular,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 6,
    },

    // Ekle modal
    ekleLabel: {
      marginTop: 14,
      marginBottom: 6,
    },
    ekleInput: {
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: Font.regular,
      fontSize: 14,
    },
    ekleInputCok: {
      minHeight: 100,
    },
    ekleGorselSec: {
      paddingVertical: 18,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      alignItems: 'center',
    },
    ekleGorselSecText: {
      fontFamily: Font.semibold,
      fontSize: 13,
    },
    ekleGorselOnizle: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: Radius.md,
      backgroundColor: t.bgSecondary,
    },
    ekleGorselDegistir: {
      marginTop: 6,
      paddingVertical: 10,
      borderRadius: Radius.sm,
      alignItems: 'center',
    },
    ekleGorselDegistirText: {
      fontFamily: Font.semibold,
      fontSize: 12,
    },
    ekleSabit: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    ekleSabitBaslik: {
      fontFamily: Font.semibold,
      fontSize: 13,
    },
    ekleSabitNot: {
      fontFamily: Font.regular,
      fontSize: 11,
      marginTop: 2,
    },
    ekleKaydetBtn: {
      marginTop: 18,
    },
    ekleBilgi: {
      fontFamily: Font.regular,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 8,
    },
  });

/* ═══════════════════════════════════════════
   Tam ekran gorsel styles (tema-bagimsiz, siyah)
   ═══════════════════════════════════════════ */
const tamEkranStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Palette.siyah,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kapatBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: Palette.seffafBeyaz20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  kapatBtnText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  altYazi: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.6,
    paddingHorizontal: 20,
  },
});
