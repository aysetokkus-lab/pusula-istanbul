import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMekanSaatleri, type MekanSaat } from '../../hooks/use-mekan-saatleri';

const GUNLER = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

function yazMi(m: MekanSaat) { return m.aktif_mevsim === 'yaz'; }
function cumaGunuMu() { return new Date().getDay() === 5; }
function haftaSonu() { const g = new Date().getDay(); return g === 0 || g === 6; }

const KATEGORILER = [
  { id: 'milli_saraylar', baslik: 'Milli Saraylar', renk: '#0077B6' },
  { id: 'muzeler', baslik: 'Müzeler', renk: '#0096C7' },
  { id: 'ozel_muzeler', baslik: 'Özel Müzeler', renk: '#005A8D' },
  { id: 'camiler', baslik: 'Camiler', renk: '#0077B6' },
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
  const hs = haftaSonu();
  if (hs && m.haftasonu_gise) return m.haftasonu_gise;
  if (m.haftaici_gise) return m.haftaici_gise;
  return m.gise_kapanis;
}

function durum(m: MekanSaat) {
  if (m.restorasyon) return { d: 'RESTORASYON', r: '#7B8FA1', s: m.restorasyon_notu || 'Restorasyon nedeniyle kapalı' };
  const gun = new Date().getDay();
  const saatStr = new Date().toTimeString().slice(0, 5);
  const acilis = getAcilis(m);
  const kapanis = getKapanis(m);
  const gise = getGise(m);

  if (m.kapali_gun !== null && m.kapali_gun === gun)
    return { d: 'KAPALI', r: '#D62828', s: `${GUNLER[m.kapali_gun]} kapalı` };
  if (cumaGunuMu() && m.cuma_kapali_bas && m.cuma_kapali_bit)
    if (saatStr >= m.cuma_kapali_bas && saatStr < m.cuma_kapali_bit)
      return { d: 'KAPALI', r: '#D62828', s: `Cuma arası — ${m.cuma_kapali_bit}'de açılacak` };
  if (saatStr < acilis) return { d: 'KAPALI', r: '#D62828', s: `${acilis}'de açılıyor` };
  if (saatStr >= kapanis) return { d: 'KAPALI', r: '#D62828', s: 'Bugün kapandı' };
  if (gise && saatStr >= gise) return { d: 'GİŞE KAPALI', r: '#D62828', s: 'Giriş durdu' };
  return { d: 'AÇIK', r: '#0096C7', s: `Gişe ${gise || kapanis}'e kadar` };
}

// ═══ Ana Bileşen ═══
export default function Muzeler() {
  const insets = useSafeAreaInsets();
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

  return (
    <ScrollView style={st.container}>
      <LinearGradient colors={['#00A8E8','#0077B6','#0096C7','#48CAE4']} start={{x:0,y:0}} end={{x:1,y:1}} style={[st.header, { paddingTop: insets.top + 12 }]}>
        <Text style={st.headerBaslik}>Müzeler & Saraylar</Text>
        <Text style={st.headerAlt}>Detay için dokunun</Text>
      </LinearGradient>

      {/* Kategori seçici */}
      <View style={st.segKutu}>
        {KATEGORILER.map((k, i) => (
          <TouchableOpacity key={k.id} style={[st.segBtn, aktifKat === i && { backgroundColor: k.renk }]}
            onPress={() => setAktifKat(i)}>
            <Text style={[st.segYazi, aktifKat === i && st.segYaziAktif]}>{k.baslik}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mekan listesi */}
      {yukleniyor ? (
        <ActivityIndicator size="large" color="#0077B6" style={{ marginTop: 40 }} />
      ) : mekanlar.length === 0 ? (
        <Text style={st.bosYazi}>Bu kategoride mekan bulunamadı.</Text>
      ) : (
        <View style={st.liste}>
          {mekanlar.map(m => {
            const d = durum(m);
            const acilis = getAcilis(m);
            const kapanis = getKapanis(m);
            const gise = getGise(m);
            return (
              <TouchableOpacity key={m.id} style={[st.kart, { borderLeftColor: m.renk }]}
                onPress={() => setSecili(m)}>
                <View style={st.kartUst}>
                  <View style={st.kartBilgi}>
                    <Text style={st.kartIsim}>{m.isim}</Text>
                    <Text style={st.kartTip}>{m.tip}</Text>
                  </View>
                  <View style={[st.badge, { backgroundColor: d.r + '22', borderColor: d.r }]}>
                    <Text style={[st.badgeYazi, { color: d.r }]}>{d.d}</Text>
                  </View>
                </View>
                <View style={st.kartAlt}>
                  <Text style={st.saatBilgi}>• {acilis}–{kapanis}</Text>
                  {gise && <Text style={st.giseBilgi}>• Gişe: {gise}</Text>}
                </View>
                {m.kapali_gun !== null && <Text style={st.kapaliGun}>• {GUNLER[m.kapali_gun]} kapalı</Text>}
                {cumaGunuMu() && m.cuma_kapali_bas && <Text style={st.kapaliGun}>• Cuma {m.cuma_kapali_bas}-{m.cuma_kapali_bit} kapalı</Text>}
                {m.fiyat_yabanci && <Text style={st.fiyatOnizleme}>• Yabancı: {m.fiyat_yabanci}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={{ height: 40 }} />

      {/* DETAY MODAL */}
      <Modal visible={!!secili} transparent animationType="slide" onRequestClose={() => setSecili(null)}>
        <View style={st.modalArka}>
          <View style={st.modalKutu}>
            {secili && (() => {
              const d = durum(secili);
              const acilis = getAcilis(secili);
              const kapanis = getKapanis(secili);
              const gise = getGise(secili);
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={st.modalBaslikSatir}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.modalIsim}>{secili.isim}</Text>
                      <Text style={st.modalTip}>{secili.tip}</Text>
                    </View>
                    <View style={[st.badge, { backgroundColor: d.r + '22', borderColor: d.r }]}>
                      <Text style={[st.badgeYazi, { color: d.r }]}>{d.d}</Text>
                    </View>
                  </View>

                  <View style={[st.durumBand, { borderLeftColor: d.r, backgroundColor: d.r + '15' }]}>
                    <Text style={[st.durumBandYazi, { color: d.r }]}>{d.s}</Text>
                  </View>

                  {/* Saatler */}
                  <View style={st.detayGrid}>
                    <View style={st.detayKutu}>
                      <Text style={st.detayEtiket}>Açılış</Text>
                      <Text style={st.detayDeger}>{acilis}</Text>
                    </View>
                    <View style={st.detayKutu}>
                      <Text style={st.detayEtiket}>Kapanış</Text>
                      <Text style={st.detayDeger}>{kapanis}</Text>
                    </View>
                    <View style={st.detayKutu}>
                      <Text style={st.detayEtiket}>Gişe Kapanış</Text>
                      <Text style={st.detayDeger}>{gise || '—'}</Text>
                    </View>
                    <View style={st.detayKutu}>
                      <Text style={st.detayEtiket}>Kapalı Gün</Text>
                      <Text style={st.detayDeger}>{secili.kapali_gun !== null ? GUNLER[secili.kapali_gun] : 'Yok'}</Text>
                    </View>
                  </View>

                  {/* Mevsimsel */}
                  {secili.mevsimsel && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Mevsimsel</Text>
                      <Text style={[st.infoYazi, yazMi(secili) && st.infoAktif]}>• Yaz: {secili.yaz_acilis}–{secili.yaz_kapanis}</Text>
                      <Text style={[st.infoYazi, !yazMi(secili) && st.infoAktif]}>• Kış: {secili.kis_acilis}–{secili.kis_kapanis}</Text>
                    </View>
                  )}

                  {/* Gece Müzeciliği */}
                  {secili.gece_acilis && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Gece Müzeciliği</Text>
                      <Text style={st.infoYazi}>{secili.gece_acilis}–{secili.gece_kapanis} · Gişe: {secili.gece_gise}</Text>
                    </View>
                  )}

                  {/* Farklı gün saatleri */}
                  {secili.haftasonu_acilis && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Günlere Göre</Text>
                      <Text style={[st.infoYazi, !haftaSonu() && st.infoAktif]}>• Hafta içi: {secili.haftaici_acilis || secili.acilis}–{secili.haftaici_kapanis || secili.kapanis}</Text>
                      <Text style={[st.infoYazi, haftaSonu() && st.infoAktif]}>• Hafta sonu: {secili.haftasonu_acilis}–{secili.haftasonu_kapanis}</Text>
                    </View>
                  )}
                  {secili.sali_kapanis && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Özel Günler</Text>
                      <Text style={st.infoYazi}>• Salı: 10:00–{secili.sali_kapanis}</Text>
                      {secili.cuma_kapanis && <Text style={st.infoYazi}>• Cuma: 10:00–{secili.cuma_kapanis}</Text>}
                      {secili.pazar_acilis && <Text style={st.infoYazi}>• Pazar: {secili.pazar_acilis}–{secili.pazar_kapanis}</Text>}
                    </View>
                  )}
                  {!secili.sali_kapanis && secili.cuma_kapanis && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Özel Günler</Text>
                      <Text style={st.infoYazi}>• Cuma: 10:00–{secili.cuma_kapanis}</Text>
                      {secili.pazar_acilis && <Text style={st.infoYazi}>• Pazar: {secili.pazar_acilis}–{secili.pazar_kapanis}</Text>}
                    </View>
                  )}

                  {/* Cuma kapalı */}
                  {secili.cuma_kapali_bas && (
                    <View style={st.cumaKutu}><Text style={st.cumaYazi}>• Cuma {secili.cuma_kapali_bas}–{secili.cuma_kapali_bit} kapalı</Text></View>
                  )}

                  {/* Fiyatlar */}
                  {(secili.fiyat_yerli || secili.fiyat_yabanci) && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Fiyat</Text>
                      {secili.fiyat_yabanci && <Text style={st.infoYazi}>• Yabancı: {secili.fiyat_yabanci}</Text>}
                      {secili.fiyat_yerli && <Text style={st.infoYazi}>• Yerli: {secili.fiyat_yerli}</Text>}
                      {secili.fiyat_indirimli && <Text style={st.infoYazi}>• İndirimli: {secili.fiyat_indirimli}</Text>}
                      {secili.ekstra && <Text style={st.infoYazi}>• {secili.ekstra}</Text>}
                    </View>
                  )}

                  {/* Müzekart */}
                  <View style={st.infoKutu}>
                    <Text style={st.infoBaslik}>Müzekart</Text>
                    <Text style={[st.infoYazi, { color: secili.muzekart === 'gecerli' ? '#0096C7' : '#D62828' }]}>
                      {secili.muzekart === 'gecerli' ? '• Geçerli' : secili.muzekart === 'indirimli' ? '• İndirimli giriş' : '• Geçmez'}
                    </Text>
                  </View>

                  {/* Ulaşım (Kız Kulesi) */}
                  {secili.ulasim_notu && (
                    <View style={st.infoKutu}>
                      <Text style={st.infoBaslik}>Ulaşım</Text>
                      <Text style={st.infoYazi}>{secili.ulasim_notu}</Text>
                    </View>
                  )}

                  {/* Özel not */}
                  {secili.ozel_not && (
                    <View style={st.ozelKutu}><Text style={st.ozelYazi}>{secili.ozel_not}</Text></View>
                  )}

                  {/* Site linki */}
                  {secili.site && (
                    <TouchableOpacity style={st.siteBtn} onPress={() => Linking.openURL(secili.site!)}>
                      <Text style={st.siteBtnYazi}>Resmi Site →</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={st.kaynakYazi}>Kaynak: {secili.kaynak}</Text>

                  <TouchableOpacity style={st.kapatBtn} onPress={() => setSecili(null)}>
                    <Text style={st.kapatYazi}>Kapat</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ═══ Stiller ═══
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingBottom: 16, paddingHorizontal: 16 },
  headerBaslik: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  segKutu: { flexDirection: 'row', margin: 12, marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  segYazi: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  segYaziAktif: { color: '#FFFFFF', fontWeight: '700' },
  bosYazi: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },
  liste: { padding: 12, gap: 8 },
  kart: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  kartUst: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  kartBilgi: { flex: 1 },
  kartIsim: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  kartTip: { color: '#64748B', fontSize: 10, marginTop: 1 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeYazi: { fontSize: 10, fontWeight: '700' },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between' },
  saatBilgi: { color: '#64748B', fontSize: 11 },
  giseBilgi: { color: '#64748B', fontSize: 11 },
  kapaliGun: { color: '#D62828', fontSize: 10, marginTop: 4 },
  fiyatOnizleme: { color: '#64748B', fontSize: 10, marginTop: 4 },
  // Modal
  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '88%' },
  modalBaslikSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalIsim: { color: '#1E293B', fontSize: 17, fontWeight: '700' },
  modalTip: { color: '#64748B', fontSize: 11, marginTop: 2 },
  durumBand: { borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 4 },
  durumBandYazi: { fontSize: 13, fontWeight: '600' },
  detayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  detayKutu: { backgroundColor: '#F5F7FA', borderRadius: 8, padding: 10, width: '47%', flexGrow: 1 },
  detayEtiket: { color: '#64748B', fontSize: 10, marginBottom: 3 },
  detayDeger: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  infoKutu: { backgroundColor: '#F5F7FA', borderRadius: 8, padding: 12, marginBottom: 8 },
  infoBaslik: { color: '#0077B6', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  infoYazi: { color: '#64748B', fontSize: 12, marginBottom: 4, lineHeight: 18 },
  infoAktif: { color: '#1E293B', fontWeight: '600' },
  cumaKutu: { backgroundColor: '#EAF4FB', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#0077B6' },
  cumaYazi: { color: '#0077B6', fontSize: 11, fontWeight: '600' },
  ozelKutu: { backgroundColor: '#EAF4FB', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#0077B6' },
  ozelYazi: { color: '#0077B6', fontSize: 11, lineHeight: 16 },
  siteBtn: { borderWidth: 1, borderColor: '#0077B6', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  siteBtnYazi: { color: '#0077B6', fontSize: 13, fontWeight: '700' },
  kaynakYazi: { color: '#94A3B8', fontSize: 10, textAlign: 'right', marginBottom: 8 },
  kapatBtn: { backgroundColor: '#0077B6', borderRadius: 10, padding: 14, alignItems: 'center' },
  kapatYazi: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
