// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + Segmentler (havalimanı / yön) + Kart/Rozet + ModalKapak ile yeniden boyandı.
// Havaist / Havabüs listesi, fiyat, sonraki sefer hesabı, "Tüm saatler" modalı ve YetkiliBolum aynen korundu.
import { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUlasimTarife, type HavalimaniSefer } from '../../hooks/use-ulasim-tarife';
import { useTema } from '../../hooks/use-tema';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { UlasimTarifeYonetim } from '../../components/yetkili/ulasim-tarife-yonetim';
import { BilgiNotu, BosDurum, GradyanHeader, HeaderBaslik, Kart, Kicker, ModalKapak, Rozet, Segmentler } from '../../components/ui/pusula-ui';
import { Font, Palette, Radius } from '../../constants/theme';

type Yon = 'gidis' | 'donus';

interface ModalVeri {
  durak: string;
  saatler: string[];
  yon: string;
  guzergah: string | null;  // Yon'e gore guzergah aciklamasi (admin panelinden duzenlenebilir)
}

const HAVALIMANLARI = [
  { id: 'IST', baslik: 'İST — İstanbul' },
  { id: 'SAW', baslik: 'SAW — Sabiha' },
] as const;

const YONLER = [
  { id: 'gidis', baslik: 'Şehir → Havalimanı' },
  { id: 'donus', baslik: 'Havalimanı → Şehir' },
] as const;

export default function Ulasim() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const [aktifHavaAlani, setAktifHavaAlani] = useState<'IST' | 'SAW'>('IST');
  const [yon, setYon] = useState<Yon>('gidis');
  const [modal, setModal] = useState<ModalVeri | null>(null);

  // Supabase'den veri cek (realtime)
  const { seferler: tumSeferler, yukleniyor } = useUlasimTarife();

  // Havalimani ve firmaya gore filtrele
  const istSeferler = tumSeferler.filter(s => s.havalimani === 'IST');
  const sawSeferler = tumSeferler.filter(s => s.havalimani === 'SAW');
  const seferler = aktifHavaAlani === 'IST' ? istSeferler : sawSeferler;

  const simdi = new Date();
  const simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
  const saatDk = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const sonraki = (saatler: string[]) => saatler.find(s => saatDk(s) > simdiDk);

  const firmaAdi = aktifHavaAlani === 'IST' ? 'HAVAİST' : 'HAVABÜS';
  const havAlaniAdi = aktifHavaAlani === 'IST' ? 'İstanbul Havalimanı (İST)' : 'Sabiha Gökçen Havalimanı (SAW)';
  const kaynak = seferler.length > 0
    ? `${seferler[0].kaynak || ''} • ${seferler[0].tarife_donemi || ''}`
    : '';

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]}>
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Havalimanı Ulaşım" alt="Duraklara tıklayın → tüm saatleri görün" />
      </GradyanHeader>

      {/* Havalimanı seçici */}
      <View style={s.segKutu}>
        <Segmentler
          secenekler={HAVALIMANLARI.map(h => ({ id: h.id, baslik: h.baslik }))}
          aktif={aktifHavaAlani}
          onSec={id => setAktifHavaAlani(id)}
        />
      </View>

      {/* Yön seçici */}
      <View style={s.segKutuAlt}>
        <Segmentler
          secenekler={YONLER.map(y => ({ id: y.id, baslik: y.baslik }))}
          aktif={yon}
          onSec={id => setYon(id)}
          renk={Palette.uyari}
        />
      </View>

      {yukleniyor ? (
        <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
      ) : seferler.length === 0 ? (
        <BosDurum metin="Sefer verisi bulunamadı." />
      ) : (
        <View style={s.bolum}>
          <View style={s.sirketBaslik}>
            <Kicker color={Palette.uyari}>{firmaAdi}</Kicker>
            <Text style={[s.sirketAlt, { color: t.textSecondary }]}>{havAlaniAdi}</Text>
          </View>
          {seferler.map(durak => {
            const saatler = yon === 'gidis' ? (durak.sehirden_hav || []) : (durak.havdan_sehir || []);
            const snrk = sonraki(saatler);
            return (
              <Kart
                key={durak.id}
                accent={Palette.uyari}
                onPress={() => setModal({
                  durak: durak.durak_adi,
                  saatler,
                  yon: yon === 'gidis' ? 'Şehir → Havalimanı' : 'Havalimanı → Şehir',
                  guzergah: yon === 'gidis' ? durak.sehirden_hav_guzergah : durak.havdan_sehir_guzergah,
                })}
              >
                <View style={s.durakUst}>
                  <View style={s.durakBilgi}>
                    <Text style={[s.durakAdi, { color: t.text }]}>{durak.durak_adi}</Text>
                    <Text style={[s.durakNot, { color: t.textSecondary }]}>
                      {durak.not_bilgi || durak.havalimani}
                      {durak.fiyat ? ` • ${durak.fiyat}` : ''}
                      {durak.sure ? ` (${durak.sure})` : ''}
                    </Text>
                  </View>
                  <Rozet renk={t.primary}>{saatler.length} sefer</Rozet>
                </View>
                <View style={[s.snrkSatir, { borderTopColor: t.divider }]}>
                  <Text style={[s.snrkEtiket, { color: t.textSecondary }]}>Sonraki:</Text>
                  <Text style={[s.snrkSaat, { color: t.primary }]}>{snrk || '—'}</Text>
                  <Text style={[s.tumBtn, { color: t.accent }]}>Tümü →</Text>
                </View>
              </Kart>
            );
          })}
          {kaynak ? <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: {kaynak}</Text> : null}
        </View>
      )}

      <YetkiliBolum baslik="Havalimanı Tarifeleri" aciklama="Havaist / Havabüs sefer ve fiyat" sadeceAdmin>
        <UlasimTarifeYonetim tip="havalimani" />
      </YetkiliBolum>
      <View style={{ height: 30 }} />

      {/* MODAL — TÜM SAATLER */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <ModalKapak baslik={modal?.durak ?? ''} alt={modal?.yon} onKapat={() => setModal(null)}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.saatGrid}>
              {modal?.saatler.map((saat, i) => {
                const gecti = saatDk(saat) <= simdiDk;
                return (
                  <View key={i} style={[s.saatKutu, { backgroundColor: t.bgCard, borderColor: gecti ? t.kartBorder : t.primary }, gecti && s.saatGecti]}>
                    <Text style={[s.saatYazi, { color: gecti ? t.textMuted : t.text }]}>{saat}</Text>
                  </View>
                );
              })}
            </View>
            {modal?.guzergah ? (
              <Kart accent={Palette.uyari} style={s.guzergahKart}>
                <Kicker color={Palette.uyari}>Güzergah</Kicker>
                <Text style={[s.guzergahYazi, { color: t.text }]}>{modal.guzergah}</Text>
              </Kart>
            ) : null}
          </ScrollView>
        </ModalKapak>
      </Modal>
      <BilgiNotu />
    </ScrollView>
  );
}

// ═══ Stiller ═══
const s = StyleSheet.create({
  container: { flex: 1 },
  segKutu: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  segKutuAlt: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 },
  bolum: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  sirketBaslik: { gap: 2 },
  sirketAlt: { fontFamily: Font.regular, fontSize: 12 },
  durakUst: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  durakBilgi: { flex: 1 },
  durakAdi: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3 },
  durakNot: { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
  snrkSatir: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 10, gap: 6 },
  snrkEtiket: { fontFamily: Font.regular, fontSize: 12 },
  snrkSaat: { fontFamily: Font.bold, fontSize: 16, flex: 1 },
  tumBtn: { fontFamily: Font.bold, fontSize: 12 },
  kaynak: { fontFamily: Font.regular, fontSize: 11, textAlign: 'right', marginBottom: 4 },
  // Modal
  saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  saatKutu: { borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, alignItems: 'center' },
  saatGecti: { opacity: 0.5 },
  saatYazi: { fontFamily: Font.semibold, fontSize: 15, fontVariant: ['tabular-nums'] },
  guzergahKart: { marginTop: 4, marginBottom: 8, padding: 14 },
  guzergahYazi: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20 },
});
