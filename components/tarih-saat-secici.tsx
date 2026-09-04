// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Tarih/saat seçici tokenlarla yeniden boyandı: Segmentler (Tarih/Saat), Rozet dilinde yıl/ay/saat çipleri,
// kobalt seçili gün, safran BirincilButon "Onayla". +03:00 TZ mantığı, prop imzası ve tüm state'ler birebir.
import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '../hooks/use-tema';
import { Font, Radius } from '../constants/theme';
import { BirincilButon, Kicker, Segmentler } from './ui/pusula-ui';

/* ═══════════════════════════════════════════
   Turkce aylar ve gunler
   ═══════════════════════════════════════════ */
const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const GUNLER_KISA = ['Pz', 'Pt', 'Sa', 'Ca', 'Pe', 'Cu', 'Ct'];

function ayGunSayisi(yil: number, ay: number): number {
  return new Date(yil, ay + 1, 0).getDate();
}

function ayBaslangicGunu(yil: number, ay: number): number {
  return new Date(yil, ay, 1).getDay();
}

/* ═══════════════════════════════════════════
   Formatlama
   ═══════════════════════════════════════════ */
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// v1.1.0 BUG FIX: Onceden TZ yok idi (`...T08:00:00`), PostgreSQL UTC olarak parse edip
// geri okurken cihazda +3 saat goruluyordu. Sabit +03:00 (Turkiye, DST yok 2016'dan beri).
function isoFormat(yil: number, ay: number, gun: number, saat: number, dakika: number): string {
  return `${yil}-${pad(ay + 1)}-${pad(gun)}T${pad(saat)}:${pad(dakika)}:00+03:00`;
}

function turkceFormat(yil: number, ay: number, gun: number, saat: number, dakika: number): string {
  return `${gun} ${AYLAR[ay]} ${yil}, ${pad(saat)}:${pad(dakika)}`;
}

function parseISO(iso: string): { yil: number; ay: number; gun: number; saat: number; dakika: number } | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return { yil: d.getFullYear(), ay: d.getMonth(), gun: d.getDate(), saat: d.getHours(), dakika: d.getMinutes() };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════
   Küçük ikon: aşağı ok (24px stroke SVG, inline)
   ═══════════════════════════════════════════ */
function AsagiOkIkon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ═══════════════════════════════════════════
   Props
   ═══════════════════════════════════════════ */
interface Props {
  label: string;
  value: string;           // ISO string veya bos
  onChange: (iso: string) => void;
  required?: boolean;
}

/* ═══════════════════════════════════════════
   Ana Bilesen
   ═══════════════════════════════════════════ */
export function TarihSaatSecici({ label, value, onChange, required }: Props) {
  const { t } = useTema();
  const [acik, setAcik] = useState(false);

  const simdi = new Date();
  const parsed = parseISO(value);

  const [yil, setYil] = useState(parsed?.yil ?? simdi.getFullYear());
  const [ay, setAy] = useState(parsed?.ay ?? simdi.getMonth());
  const [gun, setGun] = useState(parsed?.gun ?? simdi.getDate());
  const [saat, setSaat] = useState(parsed?.saat ?? 9);
  const [dakika, setDakika] = useState(parsed?.dakika ?? 0);
  const [adim, setAdim] = useState<'tarih' | 'saat'>('tarih');

  // Modal acildiginda mevcut degerleri yukle
  const ac = useCallback(() => {
    const p = parseISO(value);
    const s = new Date();
    setYil(p?.yil ?? s.getFullYear());
    setAy(p?.ay ?? s.getMonth());
    setGun(p?.gun ?? s.getDate());
    setSaat(p?.saat ?? 9);
    setDakika(p?.dakika ?? 0);
    setAdim('tarih');
    setAcik(true);
  }, [value]);

  const onayla = useCallback(() => {
    onChange(isoFormat(yil, ay, gun, saat, dakika));
    setAcik(false);
  }, [yil, ay, gun, saat, dakika, onChange]);

  const temizle = useCallback(() => {
    onChange('');
    setAcik(false);
  }, [onChange]);

  // Goruntuleme metni
  const goruntuMetni = parsed
    ? turkceFormat(parsed.yil, parsed.ay, parsed.gun, parsed.saat, parsed.dakika)
    : '';

  // Takvim grid
  const gunSayisi = useMemo(() => ayGunSayisi(yil, ay), [yil, ay]);
  const baslangicGunu = useMemo(() => ayBaslangicGunu(yil, ay), [yil, ay]);

  const takvimHucreleri = useMemo(() => {
    const hucreler: (number | null)[] = [];
    for (let i = 0; i < baslangicGunu; i++) hucreler.push(null);
    for (let g = 1; g <= gunSayisi; g++) hucreler.push(g);
    while (hucreler.length % 7 !== 0) hucreler.push(null);
    return hucreler;
  }, [gunSayisi, baslangicGunu]);

  // Gun sinirla
  const gununGecerliMi = gun <= gunSayisi;
  const gecerliGun = gununGecerliMi ? gun : gunSayisi;

  // Yil secenekleri
  const yillar = [simdi.getFullYear(), simdi.getFullYear() + 1, simdi.getFullYear() + 2];

  // Çip stilleri (seçili = kobalt dolu, değil = giriş zemini + ince border)
  const cipZemin = { backgroundColor: t.bgInput, borderColor: t.kartBorder };
  const cipAktif = { backgroundColor: t.primary, borderColor: t.primary };

  return (
    <View>
      <Text style={[s.label, { color: t.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity style={[s.seciciBtn, { backgroundColor: t.bgInput, borderColor: t.kartBorder }]} onPress={ac} activeOpacity={0.7}>
        <Text style={[s.seciciBtnYazi, { color: t.text }, !goruntuMetni && { color: t.textMuted }]}>
          {goruntuMetni || 'Tarih ve saat seç...'}
        </Text>
        <AsagiOkIkon color={t.textMuted} />
      </TouchableOpacity>

      <Modal visible={acik} transparent animationType="slide" onRequestClose={() => setAcik(false)}>
        <View style={[s.modalArka, { backgroundColor: t.modalOverlay }]}>
          <View style={[s.modalKutu, { backgroundColor: t.modalBg }]}>
            <View style={[s.modalTutamac, { backgroundColor: t.kartBorder }]} />

            {/* Baslik */}
            <View style={[s.modalHeader, { borderBottomColor: t.divider }]}>
              <TouchableOpacity onPress={() => setAcik(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.modalIptal, { color: t.textSecondary }]}>Kapat</Text>
              </TouchableOpacity>
              <Text style={[s.modalBaslik, { color: t.text }]}>
                {adim === 'tarih' ? 'Tarih Seç' : 'Saat Seç'}
              </Text>
              <TouchableOpacity onPress={temizle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.modalTemizle, { color: t.durumKapali }]}>Temizle</Text>
              </TouchableOpacity>
            </View>

            {/* Onizleme */}
            <View style={[s.onizleme, { backgroundColor: t.bgSecondary }]}>
              <Text style={[s.onizlemeYazi, { color: t.primary }]}>
                {turkceFormat(yil, ay, gecerliGun, saat, dakika)}
              </Text>
            </View>

            {/* Adim sekmeleri */}
            <View style={s.adimKutu}>
              <Segmentler
                secenekler={[{ id: 'tarih', baslik: 'Tarih' }, { id: 'saat', baslik: 'Saat' }]}
                aktif={adim}
                onSec={id => setAdim(id)}
              />
            </View>

            <ScrollView style={s.icerik} showsVerticalScrollIndicator={false}>
              {adim === 'tarih' ? (
                <>
                  {/* Yil secici */}
                  <View style={s.yilKutu}>
                    {yillar.map(y => (
                      <TouchableOpacity key={y} style={[s.yilBtn, cipZemin, yil === y && cipAktif]}
                        onPress={() => setYil(y)}>
                        <Text style={[s.yilBtnYazi, { color: t.textSecondary }, yil === y && s.cipYaziAktif]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Ay secici */}
                  <View style={s.ayKutu}>
                    {AYLAR.map((a, i) => (
                      <TouchableOpacity key={i} style={[s.ayBtn, cipZemin, ay === i && cipAktif]}
                        onPress={() => { setAy(i); if (gun > ayGunSayisi(yil, i)) setGun(ayGunSayisi(yil, i)); }}>
                        <Text style={[s.ayBtnYazi, { color: t.textSecondary }, ay === i && s.cipYaziAktif]}>{a.substring(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Takvim grid */}
                  <View style={s.takvimBaslik}>
                    {GUNLER_KISA.map(g => (
                      <View key={g} style={s.takvimBaslikHucre}>
                        <Text style={[s.takvimBaslikYazi, { color: t.textMuted }]}>{g}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.takvimGrid}>
                    {takvimHucreleri.map((h, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[s.takvimHucre, h === gecerliGun && { backgroundColor: t.primary }]}
                        onPress={() => h && setGun(h)}
                        disabled={!h}
                        activeOpacity={0.6}
                      >
                        {h ? (
                          <Text style={[s.takvimGunYazi, { color: t.text }, h === gecerliGun && s.takvimGunYaziAktif]}>
                            {h}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Saat adimina gec butonu */}
                  <BirincilButon baslik="Saat Seçimi" onPress={() => setAdim('saat')} varyant="hayalet" style={s.sonrakiBtn} />
                </>
              ) : (
                <>
                  {/* Saat secici */}
                  <Kicker color={t.primary} style={s.saatLabel}>Saat</Kicker>
                  <View style={s.saatGrid}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <TouchableOpacity key={h} style={[s.saatBtn, cipZemin, saat === h && cipAktif]}
                        onPress={() => setSaat(h)}>
                        <Text style={[s.saatBtnYazi, { color: t.textSecondary }, saat === h && s.cipYaziAktif]}>{pad(h)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Dakika secici */}
                  <Kicker color={t.primary} style={s.saatLabel}>Dakika</Kicker>
                  <View style={s.saatGrid}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <TouchableOpacity key={m} style={[s.saatBtn, cipZemin, dakika === m && cipAktif]}
                        onPress={() => setDakika(m)}>
                        <Text style={[s.saatBtnYazi, { color: t.textSecondary }, dakika === m && s.cipYaziAktif]}>{pad(m)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Geri + Onayla */}
                  <TouchableOpacity style={[s.geriBtn, { borderColor: t.divider }]} onPress={() => setAdim('tarih')}>
                    <Text style={[s.geriBtnYazi, { color: t.textSecondary }]}>Tarihe Dön</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Onayla */}
            <BirincilButon
              baslik={`${turkceFormat(yil, ay, gecerliGun, saat, dakika)} — Onayla`}
              onPress={onayla}
              varyant="cta"
              style={s.onaylaBtn}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
const s = StyleSheet.create({
  label: { fontFamily: Font.semibold, fontSize: 12, marginTop: 16, marginBottom: 6 },

  seciciBtn: {
    borderRadius: Radius.md, padding: 14, minHeight: 48,
    borderWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  seciciBtnYazi: { fontFamily: Font.semibold, fontSize: 14, flex: 1 },

  // Modal
  modalArka: { flex: 1, justifyContent: 'flex-end' },
  modalKutu: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingTop: 12 },
  modalTutamac: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 6 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalIptal: { fontFamily: Font.semibold, fontSize: 14 },
  modalBaslik: { fontFamily: Font.extrabold, fontSize: 18, letterSpacing: -0.3 },
  modalTemizle: { fontFamily: Font.semibold, fontSize: 14 },

  // Onizleme
  onizleme: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  onizlemeYazi: { fontFamily: Font.bold, fontSize: 16, letterSpacing: -0.3 },

  // Adim sekmeleri
  adimKutu: { paddingHorizontal: 16, paddingVertical: 12 },

  icerik: { paddingHorizontal: 16 },

  // Ortak çip aktif yazı
  cipYaziAktif: { color: '#FFFFFF' },

  // Yil
  yilKutu: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  yilBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1, alignItems: 'center' },
  yilBtnYazi: { fontFamily: Font.semibold, fontSize: 14 },

  // Ay
  ayKutu: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  ayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  ayBtnYazi: { fontFamily: Font.semibold, fontSize: 12 },

  // Takvim
  takvimBaslik: { flexDirection: 'row', marginBottom: 4 },
  takvimBaslikHucre: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  takvimBaslikYazi: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  takvimGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  takvimHucre: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  takvimGunYazi: { fontFamily: Font.semibold, fontSize: 14 },
  takvimGunYaziAktif: { color: '#FFFFFF', fontFamily: Font.bold },

  // Sonraki adim
  sonrakiBtn: { marginTop: 16, marginBottom: 12 },

  // Saat
  saatLabel: { marginTop: 8, marginBottom: 8 },
  saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  saatBtn: { width: 48, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1, alignItems: 'center' },
  saatBtnYazi: { fontFamily: Font.semibold, fontSize: 14 },

  geriBtn: { borderWidth: 1, borderRadius: Radius.md, padding: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  geriBtnYazi: { fontFamily: Font.semibold, fontSize: 13 },

  // Onayla
  onaylaBtn: { margin: 16 },
});
