// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + Segmentler + Kart/Rozet/DurumNoktasi + ModalKapak ile yeniden boyandı.
// Deep-link (mekanId, kat), realtime sorgular ve YetkiliBolum yerleşimi aynen korundu.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { MekanSaatleriYonetim } from '../../components/yetkili/mekan-saatleri-yonetim';
import { useMekanSaatleri, type MekanSaat } from '../../hooks/use-mekan-saatleri';
import { useTema } from '../../hooks/use-tema';
import { BilgiNotu, BirincilButon, BosDurum, DurumNoktasi, GradyanHeader, HeaderBaslik, Kart, Kicker, ModalKapak, Rozet, Segmentler } from '../../components/ui/pusula-ui';
import { Font, Palette, Radius } from '../../constants/theme';

const GUNLER = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

function yazMi(m: MekanSaat) { return m.aktif_mevsim === 'yaz'; }
function cumaGunuMu() { return new Date().getDay() === 5; }
function haftaSonu() { const g = new Date().getDay(); return g === 0 || g === 6; }

const KATEGORILER = [
  { id: 'milli_saraylar', baslik: 'Milli Saraylar', renk: Palette.altin },
  { id: 'muzeler', baslik: 'Müzeler', renk: Palette.menekse },
  { id: 'ozel_muzeler', baslik: 'Özel Müzeler', renk: Palette.kobalt },
  { id: 'camiler', baslik: 'Camiler', renk: Palette.acik },
];

// ═══ Durum Hesaplama ═══
function getAcilis(m: MekanSaat) {
  if (m.mevsimsel) return yazMi(m) ? m.yaz_acilis! : m.kis_acilis!;
  const hs = haftaSonu();
  if (hs && m.haftasonu_acilis) return m.haftasonu_acilis;
  if (m.haftaici_acilis) return m.haftaici_acilis;
  const g = new Date().getDay();
  if (g === 0 && m.pazar_acilis) return m.pazar_acilis;
  return m.acilis;
}

function getKapanis(m: MekanSaat) {
  if (m.mevsimsel) return yazMi(m) ? m.yaz_kapanis! : m.kis_kapanis!;
  const g = new Date().getDay();
  if (g === 2 && m.sali_kapanis) return m.sali_kapanis;
  if (g === 5 && m.cuma_kapanis) return m.cuma_kapanis;
  if (g === 0 && m.pazar_kapanis) return m.pazar_kapanis;
  const hs = haftaSonu();
  if (hs && m.haftasonu_kapanis) return m.haftasonu_kapanis;
  if (m.haftaici_kapanis) return m.haftaici_kapanis;
  return m.kapanis;
}

function getGise(m: MekanSaat) {
  if (m.mevsimsel) {
    const yaz = yazMi(m);
    if (yaz && m.yaz_gise_kapanis) return m.yaz_gise_kapanis;
    if (!yaz && m.kis_gise_kapanis) return m.kis_gise_kapanis;
  }
  const hs = haftaSonu();
  if (hs && m.haftasonu_gise) return m.haftasonu_gise;
  if (m.haftaici_gise) return m.haftaici_gise;
  return m.gise_kapanis;
}

function durum(m: MekanSaat) {
  if (m.restorasyon) return { d: 'RESTORASYON', r: Palette.restorasyon, s: m.restorasyon_notu || 'Restorasyon nedeniyle kapalı' };
  const gun = new Date().getDay();
  const saatStr = new Date().toTimeString().slice(0, 5);
  const acilis = getAcilis(m);
  const kapanis = getKapanis(m);
  const gise = getGise(m);

  if (m.kapali_gun !== null && m.kapali_gun === gun)
    return { d: 'KAPALI', r: Palette.kapali, s: `${GUNLER[m.kapali_gun]} kapalı` };
  if (cumaGunuMu() && m.cuma_kapali_bas && m.cuma_kapali_bit)
    if (saatStr >= m.cuma_kapali_bas && saatStr < m.cuma_kapali_bit)
      return { d: 'KAPALI', r: Palette.kapali, s: `Cuma arası — ${m.cuma_kapali_bit}'de açılacak` };
  if (saatStr < acilis) return { d: 'KAPALI', r: Palette.kapali, s: `${acilis}'de açılıyor` };
  if (saatStr >= kapanis) return { d: 'KAPALI', r: Palette.kapali, s: 'Bugün kapandı' };
  if (gise && saatStr >= gise) return { d: 'GİŞE KAPALI', r: Palette.uyari, s: 'Giriş durdu' };
  return { d: 'AÇIK', r: Palette.acik, s: `Gişe ${gise || kapanis}'e kadar` };
}

// ═══ Ana Bileşen ═══
export default function Muzeler() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const params = useLocalSearchParams<{ mekanId?: string; kat?: string }>();
  const [secili, setSecili] = useState<MekanSaat | null>(null);
  const [aktifKat, setAktifKat] = useState(0);

  // Supabase'den veri cek (realtime)
  const kategoriId = KATEGORILER[aktifKat].id;
  const { mekanlar, yukleniyor } = useMekanSaatleri(kategoriId);

  // Arama / grid ekranından gelen deep-link parametresi
  useEffect(() => {
    if (params.kat !== undefined) {
      const idx = parseInt(params.kat, 10);
      if (!isNaN(idx) && idx >= 0 && idx < KATEGORILER.length) {
        setAktifKat(idx);
      }
    }
  }, [params.kat]);

  // mekanId ile deep-link (tum kategorileri tara)
  const { mekanlar: tumMekanlar } = useMekanSaatleri();
  useEffect(() => {
    if (params.mekanId && tumMekanlar.length > 0) {
      const bulunan = tumMekanlar.find(m => m.mekan_id === params.mekanId);
      if (bulunan) {
        const katIdx = KATEGORILER.findIndex(k => k.id === bulunan.kategori);
        if (katIdx >= 0) setAktifKat(katIdx);
        setTimeout(() => setSecili(bulunan), 150);
      }
    }
  }, [params.mekanId, tumMekanlar]);

  const katRenk = KATEGORILER[aktifKat].renk;

  return (
    <ScrollView style={[st.container, { backgroundColor: t.bg }]}>
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Müze · Saray · Cami" alt="Detay için dokunun" />
      </GradyanHeader>

      {/* Kategori seçici */}
      <View style={st.segKutu}>
        <Segmentler
          secenekler={KATEGORILER.map(k => ({ id: k.id, baslik: k.baslik }))}
          aktif={kategoriId}
          onSec={id => setAktifKat(KATEGORILER.findIndex(k => k.id === id))}
          renk={katRenk}
        />
      </View>

      {/* Mekan listesi */}
      {yukleniyor ? (
        <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
      ) : mekanlar.length === 0 ? (
        <BosDurum metin="Bu kategoride mekan bulunamadı." />
      ) : (
        <View style={st.liste}>
          {mekanlar.map(m => {
            const d = durum(m);
            const acilis = getAcilis(m);
            const kapanis = getKapanis(m);
            const gise = getGise(m);
            return (
              <Kart key={m.id} accent={m.renk} onPress={() => setSecili(m)}>
                <View style={st.kartUst}>
                  <Text style={[st.kartIsim, { color: t.text }]} numberOfLines={2}>{m.isim}</Text>
                  <Rozet renk={d.r}>{d.d}</Rozet>
                </View>
                <View style={st.kartAlt}>
                  <DurumNoktasi renk={d.r} boyut={8} />
                  <Text style={[st.saatBilgi, { color: t.textSecondary }]}>{acilis}–{kapanis}</Text>
                  {gise && <Text style={[st.giseBilgi, { color: t.textSecondary }]}>Gişe: {gise}</Text>}
                </View>
                {m.kapali_gun !== null && <Text style={[st.kapaliGun, { color: t.durumKapali }]}>{GUNLER[m.kapali_gun]} kapalı</Text>}
                {cumaGunuMu() && m.cuma_kapali_bas && <Text style={[st.kapaliGun, { color: t.durumKapali }]}>Cuma {m.cuma_kapali_bas}-{m.cuma_kapali_bit} kapalı</Text>}
                {m.fiyat_yabanci && <Text style={[st.fiyatOnizleme, { color: t.textMuted }]}>Yabancı: {m.fiyat_yabanci}</Text>}
              </Kart>
            );
          })}
        </View>
      )}
      <YetkiliBolum baslik="Mekan Saatleri" aciklama="Saat, fiyat, MüzeKart ve mevsim geçişi">
        <MekanSaatleriYonetim kategori={kategoriId} />
      </YetkiliBolum>
      <View style={{ height: 40 }} />

      {/* DETAY MODAL */}
      <Modal visible={!!secili} transparent animationType="slide" onRequestClose={() => setSecili(null)}>
        {secili && (() => {
          const d = durum(secili);
          const acilis = getAcilis(secili);
          const kapanis = getKapanis(secili);
          const gise = getGise(secili);
          return (
            <ModalKapak baslik={secili.isim} onKapat={() => setSecili(null)}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Durum bandı */}
                <Kart accent={d.r} style={st.modalKart}>
                  <View style={st.durumSatir}>
                    <Rozet renk={d.r}>{d.d}</Rozet>
                    <Text style={[st.durumBandYazi, { color: d.r }]}>{d.s}</Text>
                  </View>
                </Kart>

                {/* Saatler */}
                <View style={st.detayGrid}>
                  <View style={[st.detayKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                    <Text style={[st.detayEtiket, { color: t.textSecondary }]}>Açılış</Text>
                    <Text style={[st.detayDeger, { color: t.text }]}>{acilis}</Text>
                  </View>
                  <View style={[st.detayKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                    <Text style={[st.detayEtiket, { color: t.textSecondary }]}>Kapanış</Text>
                    <Text style={[st.detayDeger, { color: t.text }]}>{kapanis}</Text>
                  </View>
                  <View style={[st.detayKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                    <Text style={[st.detayEtiket, { color: t.textSecondary }]}>Gişe Kapanış</Text>
                    <Text style={[st.detayDeger, { color: t.text }]}>{gise || '—'}</Text>
                  </View>
                  <View style={[st.detayKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                    <Text style={[st.detayEtiket, { color: t.textSecondary }]}>Kapalı Gün</Text>
                    <Text style={[st.detayDeger, { color: t.text }]}>{secili.kapali_gun !== null ? GUNLER[secili.kapali_gun] : 'Yok'}</Text>
                  </View>
                </View>

                {/* Mevsimsel */}
                {secili.mevsimsel && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Mevsimsel</Kicker>
                    <Text style={[st.infoYazi, { color: t.textSecondary }, yazMi(secili) && [st.infoAktif, { color: t.text }]]}>• Yaz: {secili.yaz_acilis}–{secili.yaz_kapanis}</Text>
                    <Text style={[st.infoYazi, { color: t.textSecondary }, !yazMi(secili) && [st.infoAktif, { color: t.text }]]}>• Kış: {secili.kis_acilis}–{secili.kis_kapanis}</Text>
                  </Kart>
                )}

                {/* Gece Müzeciliği */}
                {secili.gece_acilis && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Gece Müzeciliği</Kicker>
                    <Text style={[st.infoYazi, { color: t.textSecondary }]}>{secili.gece_acilis}–{secili.gece_kapanis} · Gişe: {secili.gece_gise}</Text>
                  </Kart>
                )}

                {/* Farklı gün saatleri */}
                {secili.haftasonu_acilis && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Günlere Göre</Kicker>
                    <Text style={[st.infoYazi, { color: t.textSecondary }, !haftaSonu() && [st.infoAktif, { color: t.text }]]}>• Hafta içi: {secili.haftaici_acilis || secili.acilis}–{secili.haftaici_kapanis || secili.kapanis}</Text>
                    <Text style={[st.infoYazi, { color: t.textSecondary }, haftaSonu() && [st.infoAktif, { color: t.text }]]}>• Hafta sonu: {secili.haftasonu_acilis}–{secili.haftasonu_kapanis}</Text>
                  </Kart>
                )}
                {secili.sali_kapanis && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Özel Günler</Kicker>
                    <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Salı: 10:00–{secili.sali_kapanis}</Text>
                    {secili.cuma_kapanis && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Cuma: 10:00–{secili.cuma_kapanis}</Text>}
                    {secili.pazar_acilis && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Pazar: {secili.pazar_acilis}–{secili.pazar_kapanis}</Text>}
                  </Kart>
                )}
                {!secili.sali_kapanis && secili.cuma_kapanis && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Özel Günler</Kicker>
                    <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Cuma: 10:00–{secili.cuma_kapanis}</Text>
                    {secili.pazar_acilis && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Pazar: {secili.pazar_acilis}–{secili.pazar_kapanis}</Text>}
                  </Kart>
                )}

                {/* Cuma kapalı */}
                {secili.cuma_kapali_bas && (
                  <Kart accent={t.durumUyari} style={st.modalKart}>
                    <Text style={[st.cumaYazi, { color: t.durumUyari }]}>• Cuma {secili.cuma_kapali_bas}–{secili.cuma_kapali_bit} kapalı</Text>
                  </Kart>
                )}

                {/* Fiyatlar */}
                {(secili.fiyat_yerli || secili.fiyat_yabanci) && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Fiyat</Kicker>
                    {secili.fiyat_yabanci && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Yabancı: {secili.fiyat_yabanci}</Text>}
                    {secili.fiyat_yerli && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• Yerli: {secili.fiyat_yerli}</Text>}
                    {secili.fiyat_indirimli && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• İndirimli: {secili.fiyat_indirimli}</Text>}
                    {secili.ekstra && <Text style={[st.infoYazi, { color: t.textSecondary }]}>• {secili.ekstra}</Text>}
                  </Kart>
                )}

                {/* Müzekart — camilerde gösterme (ücretsiz giriş) */}
                {secili.tip !== 'cami' && (
                <Kart style={st.modalKart}>
                  <Kicker color={t.secondary}>MüzeKart</Kicker>
                  <View style={st.durumSatir}>
                    <DurumNoktasi renk={secili.muzekart === 'gecerli' ? t.durumAcik : secili.muzekart === 'indirimli' ? t.durumUyari : t.durumKapali} boyut={8} />
                    <Text style={[st.infoYazi, st.infoAktif, { color: secili.muzekart === 'gecerli' ? t.durumAcik : secili.muzekart === 'indirimli' ? t.durumUyari : t.durumKapali }]}>
                      {secili.muzekart === 'gecerli' ? 'Geçerli' : secili.muzekart === 'indirimli' ? 'İndirimli giriş' : 'Geçmez'}
                    </Text>
                  </View>
                </Kart>
                )}

                {/* Ulaşım (Kız Kulesi) */}
                {secili.ulasim_notu && (
                  <Kart style={st.modalKart}>
                    <Kicker color={t.secondary}>Ulaşım</Kicker>
                    <Text style={[st.infoYazi, { color: t.textSecondary }]}>{secili.ulasim_notu}</Text>
                  </Kart>
                )}

                {/* Özel not */}
                {secili.ozel_not && (
                  <Kart accent={t.primary} style={st.modalKart}>
                    <Text style={[st.ozelYazi, { color: t.primary }]}>{secili.ozel_not}</Text>
                  </Kart>
                )}

                {/* Site linki */}
                {secili.site && (
                  <BirincilButon baslik="Resmi Site →" varyant="hayalet" onPress={() => Linking.openURL(secili.site!)} style={st.siteBtn} />
                )}

                <Text style={[st.kaynakYazi, { color: t.textMuted }]}>Kaynak: {secili.kaynak}</Text>
              </ScrollView>
            </ModalKapak>
          );
        })()}
      </Modal>
      <BilgiNotu />
    </ScrollView>
  );
}

// ═══ Stiller ═══
const st = StyleSheet.create({
  container: { flex: 1 },
  segKutu: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  liste: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  kartUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kartIsim: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3, flex: 1 },
  kartAlt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saatBilgi: { fontFamily: Font.semibold, fontSize: 13 },
  giseBilgi: { fontFamily: Font.regular, fontSize: 12 },
  kapaliGun: { fontFamily: Font.semibold, fontSize: 12 },
  fiyatOnizleme: { fontFamily: Font.regular, fontSize: 11 },
  // Modal
  modalKart: { marginBottom: 10, padding: 14 },
  durumSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  durumBandYazi: { fontFamily: Font.semibold, fontSize: 13, flexShrink: 1 },
  detayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  detayKutu: { borderRadius: Radius.md, borderWidth: 1, padding: 12, width: '47%', flexGrow: 1 },
  detayEtiket: { fontFamily: Font.regular, fontSize: 11, marginBottom: 2 },
  detayDeger: { fontFamily: Font.bold, fontSize: 18, letterSpacing: -0.3 },
  infoYazi: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19 },
  infoAktif: { fontFamily: Font.semibold },
  cumaYazi: { fontFamily: Font.semibold, fontSize: 12 },
  ozelYazi: { fontFamily: Font.regular, fontSize: 12, lineHeight: 18 },
  siteBtn: { marginBottom: 10 },
  kaynakYazi: { fontFamily: Font.regular, fontSize: 11, textAlign: 'right', marginBottom: 4 },
});
