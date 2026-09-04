// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + Segmentler + Kart/Rozet/DurumNoktasi ile yeniden boyandı. Eyl 2026: hafta içi + hafta sonu tarifeleri aynı anda inline (modal kaldırıldı).
// TURYOL / Dentur / Şehir Hatları verileri, sonraki sefer hesabı, saat modalı ve YetkiliBolum aynen korundu.
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { UlasimTarifeYonetim } from '../../components/yetkili/ulasim-tarife-yonetim';
import { useBogazTurlari, type BogazTuru } from '../../hooks/use-bogaz-turlari';
import { useTema } from '../../hooks/use-tema';
import { BilgiNotu, BirincilButon, BolumBaslik, BosDurum, DurumNoktasi, GradyanHeader, HeaderBaslik, Kart, Kicker, Rozet, Segmentler } from '../../components/ui/pusula-ui';
import { Font, Radius } from '../../constants/theme';

const ADALAR_LINKLERI = [
  { sirket: 'Şehir Hatları', url: 'https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/adalar-hatlari-176' },
  { sirket: 'Dentur Avrasya', url: 'https://denturavrasya.com/tr-TR/hatlarimiz/adalar' },
  { sirket: 'Turyol', url: 'https://www.turyol.com/Home/Tarifeler' },
  { sirket: 'Mavi Marmara', url: 'https://mavimarmara.net/wp-content/uploads/mavimarmara-2026-yazagecis-tarife-listesi.pdf?pid=4575' },
];

const SIRKETLER = [
  { id: 'turyol', baslik: 'Turyol' },
  { id: 'dentur', baslik: 'Dentur' },
  { id: 'sehirhatlari', baslik: 'Şehir H.' },
] as const;

export default function Bogaz() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const { turlar, yukleniyor } = useBogazTurlari();

  const simdi = new Date();
  const simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
  const saatDk = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const gunTip = simdi.getDay() === 0 || simdi.getDay() === 6 ? 'haftasonu' : 'hafta';

  // Sirkete gore gruplama
  const turyol = turlar.find(tr => tr.sirket_id === 'turyol');
  const dentur = turlar.find(tr => tr.sirket_id === 'dentur');
  const shKisa = turlar.find(tr => tr.sirket_id === 'sehirhatlari_kisa');
  const shUzun = turlar.find(tr => tr.sirket_id === 'sehirhatlari_uzun');

  /* Eyl 2026: Hafta içi + hafta sonu tarifeleri AYNI ANDA görünür (Ayşe: "salı günü hafta sonunu
     göremiyordu"). Bugünün bloğu "Bugün" rozeti alır ve geçmiş saatleri sönük gösterir;
     diğer blok tam liste. Hafta sonu listesi boşsa tek blok "Her gün". */
  const SaatBloklari = ({ tr, renk }: { tr: BogazTuru; renk: string }) => {
    const ici = tr.hafta_ici_saatler || [];
    const sonu = tr.hafta_sonu_saatler || [];
    const bloklar = sonu.length > 0
      ? [
          { baslik: 'Hafta içi', alt: 'Pzt – Cum', saatler: ici, bugun: gunTip === 'hafta' },
          { baslik: 'Hafta sonu', alt: 'Cmt – Paz', saatler: sonu, bugun: gunTip === 'haftasonu' },
        ]
      : [{ baslik: 'Her gün', alt: 'Tüm günler aynı', saatler: ici, bugun: true }];
    return (
      <>
        {bloklar.map(b => {
          const sonraki = b.bugun ? b.saatler.find(sa => saatDk(sa) > simdiDk) : undefined;
          return (
            <Kart key={b.baslik} accent={b.bugun ? renk : undefined}>
              <View style={s.blokBaslikSatir}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.blokBaslik, { color: t.text }]}>{b.baslik} · {b.saatler.length} sefer</Text>
                  <Text style={[s.blokAlt, { color: t.textSecondary }]}>{b.alt}{sonraki ? ` · Sonraki sefer ${sonraki}` : ''}</Text>
                </View>
                {b.bugun && <Rozet renk={renk} dolu>BUGÜN</Rozet>}
              </View>
              <View style={s.saatGrid}>
                {b.saatler.map((saat, i) => {
                  const gecti = b.bugun && saatDk(saat) <= simdiDk;
                  const sonrakiMi = b.bugun && saat === sonraki;
                  return (
                    <View
                      key={i}
                      style={[
                        s.saatKutu,
                        { backgroundColor: sonrakiMi ? renk : t.bgCardAlt, borderColor: sonrakiMi ? renk : gecti ? t.kartBorder : `${renk}66` },
                        gecti && s.saatGecti,
                      ]}
                    >
                      <Text style={[s.saatYazi, { color: sonrakiMi ? '#FFFFFF' : gecti ? t.textMuted : t.text }]}>{saat}</Text>
                    </View>
                  );
                })}
              </View>
            </Kart>
          );
        })}
      </>
    );
  };

  const [aktifSirket, setAktifSirket] = useState<'turyol' | 'dentur' | 'sehirhatlari'>('turyol');

  const tarife = turlar.length > 0 ? (turlar[0].tarife_donemi || '') : '';

  // Güzergah satırı (Şehir Hatları kısa/uzun tur) — geçmiş saatler sönük
  const guzergahSatiri = (d: any, i: number) => {
    const gecti = saatDk(d.saat) <= simdiDk;
    return (
      <View key={i} style={s.guzergahSatir}>
        <DurumNoktasi renk={gecti ? t.textMuted : t.primary} boyut={8} />
        <Text style={[s.guzergahDurak, { color: t.text }]}>{d.durak}</Text>
        <Text style={[s.guzergahSaat, { color: gecti ? t.textMuted : t.primary }]}>{d.saat}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]}>
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Boğaz Turları" alt={`Güncel sefer saatleri${tarife ? ` — ${tarife} tarifesi` : ''}`} />
      </GradyanHeader>

      {yukleniyor ? (
        <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
      ) : turlar.length === 0 ? (
        <BosDurum metin="Boğaz turu verisi bulunamadı." />
      ) : (
        <>
          {/* Firma seçici */}
          <View style={s.segKutu}>
            <Segmentler
              secenekler={SIRKETLER.map(f => ({ id: f.id, baslik: f.baslik }))}
              aktif={aktifSirket}
              onSec={id => setAktifSirket(id)}
            />
          </View>

          {/* TURYOL */}
          {aktifSirket === 'turyol' && turyol && (() => {
            const cokluKalkis = turyol.kalkis_noktalari && turyol.kalkis_noktalari.length > 0;
            return (
              <View style={s.bolum}>
                <View style={s.sirketBaslik}>
                  <Kicker color={turyol.renk || t.primary}>TURYOL</Kicker>
                  <Text style={[s.sirketAlt, { color: t.textSecondary }]}>
                    {cokluKalkis
                      ? turyol.kalkis_noktalari.map((d: any) => d.durak).join(' & ') + ' kalkışlı'
                      : `${turyol.kalkis_yeri} kalkışlı`}
                  </Text>
                </View>
                {cokluKalkis ? (
                  <View style={s.durakSatir}>
                    {turyol.kalkis_noktalari.map((d: any) => (
                      <Kart key={d.durak} style={s.durakKart}>
                        <Text style={[s.durakAdi, { color: t.text }]}>{d.durak}</Text>
                        <Text style={[s.durakFiyat, { color: turyol.renk || t.primary }]}>{d.fiyat}</Text>
                      </Kart>
                    ))}
                  </View>
                ) : (
                  <View style={s.durakSatir}>
                    <Kart style={s.durakKart}>
                      <Text style={[s.durakAdi, { color: t.text }]}>{turyol.kalkis_yeri}</Text>
                      <Text style={[s.durakFiyat, { color: turyol.renk || t.primary }]}>{turyol.fiyat}</Text>
                    </Kart>
                  </View>
                )}
                {/* Eyl 2026: hafta içi + hafta sonu aynı anda */}
                <SaatBloklari tr={turyol} renk={turyol.renk || t.primary} />
                {turyol.ozel_not && (
                  <Kart accent={t.durumUyari}><Text style={[s.uyariYazi, { color: t.text }]}>{turyol.ozel_not}</Text></Kart>
                )}
                <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: {turyol.kaynak} • {turyol.tarife_donemi}</Text>
              </View>
            );
          })()}

          {/* DENTUR */}
          {aktifSirket === 'dentur' && dentur && (() => {
            return (
              <View style={s.bolum}>
                <View style={s.sirketBaslik}>
                  <Kicker color={dentur.renk || t.primary}>DENTUR AVRASYA</Kicker>
                  <Text style={[s.sirketAlt, { color: t.textSecondary }]}>Kabataş & Beşiktaş kalkışlı</Text>
                </View>
                {dentur.kalkis_noktalari?.length > 0 && (
                  <View style={s.durakSatir}>
                    {dentur.kalkis_noktalari.map((d: any) => (
                      <Kart key={d.durak} style={s.durakKart}>
                        <Text style={[s.durakAdi, { color: t.text }]}>{d.durak}</Text>
                        <Text style={[s.durakFiyat, { color: dentur.renk || t.primary }]}>{d.fiyat}</Text>
                      </Kart>
                    ))}
                  </View>
                )}
                {/* Eyl 2026: hafta içi + hafta sonu aynı anda */}
                <SaatBloklari tr={dentur} renk={dentur.renk || t.primary} />
                {dentur.ozel_not && (
                  <Kart accent={t.durumUyari}><Text style={[s.uyariYazi, { color: t.text }]}>{dentur.ozel_not}</Text></Kart>
                )}
                <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: {dentur.kaynak} • {dentur.tarife_donemi}</Text>
              </View>
            );
          })()}

          {/* ŞEHİR HATLARI */}
          {aktifSirket === 'sehirhatlari' && (
            <View style={s.bolum}>
              <View style={s.sirketBaslik}>
                <Kicker color={t.primary}>ŞEHİR HATLARI</Kicker>
                <Text style={[s.sirketAlt, { color: t.textSecondary }]}>Kısa & Uzun Boğaz Turu — Her gün 1 sefer, hafta içi ve hafta sonu aynı</Text>
              </View>

              {/* Kısa Tur */}
              {shKisa && (
                <Kart>
                  <View style={[s.turBaslikSatir, { borderBottomColor: t.divider }]}>
                    <Text style={[s.turBaslik, { color: t.text }]}>Kısa Boğaz Turu</Text>
                    <View style={s.rozetSatir}>
                      {(shKisa.hafta_ici_saatler || []).map((sa, i) => <Rozet key={i} renk={t.primary} dolu>{sa}</Rozet>)}
                      <Rozet renk={t.primary}>{shKisa.sure}</Rozet>
                    </View>
                  </View>
                  {(shKisa.gidis_guzergah || []).map(guzergahSatiri)}
                </Kart>
              )}

              {/* Uzun Tur */}
              {shUzun && (
                <Kart>
                  <View style={[s.turBaslikSatir, { borderBottomColor: t.divider }]}>
                    <Text style={[s.turBaslik, { color: t.text }]}>Uzun Boğaz Turu</Text>
                    <View style={s.rozetSatir}>
                      {(shUzun.hafta_ici_saatler || []).map((sa, i) => <Rozet key={i} renk={t.primary} dolu>{sa}</Rozet>)}
                      <Rozet renk={t.primary}>{shUzun.sure}</Rozet>
                    </View>
                  </View>
                  <Text style={[s.turYonBaslik, { color: t.primary }]}>→ Gidiş</Text>
                  {(shUzun.gidis_guzergah || []).map(guzergahSatiri)}
                  <View style={[s.molaKutu, { backgroundColor: t.bgCardAlt, borderColor: t.kartBorder }]}>
                    <DurumNoktasi renk={t.durumUyari} boyut={8} />
                    <Text style={[s.molaYazi, { color: t.textSecondary }]}>Anadolu Kavağı'nda mola — 15:00'e kadar</Text>
                  </View>
                  <Text style={[s.turYonBaslik, { color: t.primary }]}>← Dönüş</Text>
                  {(shUzun.donus_guzergah || []).map(guzergahSatiri)}
                </Kart>
              )}
              <BirincilButon
                baslik="Resmi sayfada detay →"
                varyant="hayalet"
                style={s.tumBtn}
                onPress={() => Linking.openURL('https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/adalar-hatlari-176')}
              />
              <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: sehirhatlari.istanbul • {shKisa?.tarife_donemi || ''}</Text>
            </View>
          )}
        </>
      )}

      {/* ADA SEFERLERİ */}
      <View style={s.adaBolum}>
        <BolumBaslik baslik="Ada Seferleri" renk={t.primary} />
        {ADALAR_LINKLERI.map(link => (
          <Kart key={link.sirket} onPress={() => Linking.openURL(link.url)}>
            <View style={s.adaSatir}>
              <DurumNoktasi renk={t.primary} boyut={8} />
              <Text style={[s.adaAdi, { color: t.primary }]}>{link.sirket} — Sefer Saatleri →</Text>
            </View>
          </Kart>
        ))}
      </View>

      <YetkiliBolum baslik="Boğaz Tarifeleri" aciklama="Sefer saatleri ve fiyatlar" sadeceAdmin>
        <UlasimTarifeYonetim tip="bogaz" />
      </YetkiliBolum>
      <BilgiNotu />
    </ScrollView>
  );
}

// ═══ Stiller ═══
const s = StyleSheet.create({
  container: { flex: 1 },
  segKutu: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  bolum: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  sirketBaslik: { gap: 2 },
  sirketAlt: { fontFamily: Font.regular, fontSize: 12 },
  infoSatir: { fontFamily: Font.regular, fontSize: 13 },
  infoVurgu: { fontFamily: Font.semibold },
  sonrakiSatir: { flexDirection: 'row', alignItems: 'center' },
  blokBaslikSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blokBaslik: { fontFamily: Font.bold, fontSize: 14 },
  blokAlt: { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },
  rozetSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  sonrakiYazi: { fontFamily: Font.regular, fontSize: 13 },
  sonrakiSaat: { fontFamily: Font.bold, fontSize: 16 },
  tumBtn: { marginTop: 0 },
  uyariYazi: { fontFamily: Font.regular, fontSize: 12, lineHeight: 18 },
  kaynak: { fontFamily: Font.regular, fontSize: 11, textAlign: 'right', marginBottom: 4 },
  durakSatir: { flexDirection: 'row', gap: 10 },
  durakKart: { flex: 1, padding: 14, alignItems: 'center' },
  durakAdi: { fontFamily: Font.bold, fontSize: 14, letterSpacing: -0.3, textAlign: 'center' },
  durakFiyat: { fontFamily: Font.semibold, fontSize: 13, textAlign: 'center' },
  turBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 10 },
  turBaslik: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3 },
  turYonBaslik: { fontFamily: Font.bold, fontSize: 12, marginTop: 4 },
  guzergahSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  guzergahDurak: { fontFamily: Font.regular, fontSize: 13, flex: 1 },
  guzergahSaat: { fontFamily: Font.bold, fontSize: 14 },
  molaKutu: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.md, borderWidth: 1, padding: 10 },
  molaYazi: { fontFamily: Font.regular, fontSize: 12, flex: 1 },
  // Modal
  saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  saatKutu: { borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, alignItems: 'center' },
  saatGecti: { opacity: 0.45 },
  saatYazi: { fontFamily: Font.semibold, fontSize: 15 },
  // Adalar
  adaBolum: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  adaSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 },
  adaAdi: { fontFamily: Font.semibold, fontSize: 14, flex: 1 },
});
