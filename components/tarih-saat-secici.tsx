import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet,
} from 'react-native';
import { useTema } from '../hooks/use-tema';

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

function isoFormat(yil: number, ay: number, gun: number, saat: number, dakika: number): string {
  return `${yil}-${pad(ay + 1)}-${pad(gun)}T${pad(saat)}:${pad(dakika)}:00`;
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

  return (
    <View>
      <Text style={[s.label, { color: t.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity style={[s.seciciBtn, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]} onPress={ac} activeOpacity={0.7}>
        <Text style={[s.seciciBtnYazi, { color: t.text }, !goruntuMetni && { color: t.textMuted }]}>
          {goruntuMetni || 'Tarih ve saat seç...'}
        </Text>
        <Text style={[s.seciciOk, { color: t.textMuted }]}>▼</Text>
      </TouchableOpacity>

      <Modal visible={acik} transparent animationType="slide" onRequestClose={() => setAcik(false)}>
        <View style={[s.modalArka, { backgroundColor: t.modalOverlay }]}>
          <View style={[s.modalKutu, { backgroundColor: t.modalBg }]}>
            {/* Baslik */}
            <View style={[s.modalHeader, { borderBottomColor: t.divider }]}>
              <TouchableOpacity onPress={() => setAcik(false)}>
                <Text style={[s.modalIptal, { color: t.textSecondary }]}>Kapat</Text>
              </TouchableOpacity>
              <Text style={[s.modalBaslik, { color: t.text }]}>
                {adim === 'tarih' ? 'Tarih Seç' : 'Saat Seç'}
              </Text>
              <TouchableOpacity onPress={temizle}>
                <Text style={s.modalTemizle}>Temizle</Text>
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
              <TouchableOpacity style={[s.adimBtn, { backgroundColor: t.bgInput }, adim === 'tarih' && s.adimBtnAktif]}
                onPress={() => setAdim('tarih')}>
                <Text style={[s.adimBtnYazi, { color: t.textSecondary }, adim === 'tarih' && s.adimBtnYaziAktif]}>Tarih</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.adimBtn, { backgroundColor: t.bgInput }, adim === 'saat' && s.adimBtnAktif]}
                onPress={() => setAdim('saat')}>
                <Text style={[s.adimBtnYazi, { color: t.textSecondary }, adim === 'saat' && s.adimBtnYaziAktif]}>Saat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.icerik} showsVerticalScrollIndicator={false}>
              {adim === 'tarih' ? (
                <>
                  {/* Yil secici */}
                  <View style={s.yilKutu}>
                    {yillar.map(y => (
                      <TouchableOpacity key={y} style={[s.yilBtn, { backgroundColor: t.bgInput }, yil === y && s.yilBtnAktif]}
                        onPress={() => setYil(y)}>
                        <Text style={[s.yilBtnYazi, { color: t.textSecondary }, yil === y && s.yilBtnYaziAktif]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Ay secici */}
                  <View style={s.ayKutu}>
                    {AYLAR.map((a, i) => (
                      <TouchableOpacity key={i} style={[s.ayBtn, { backgroundColor: t.bgInput }, ay === i && s.ayBtnAktif]}
                        onPress={() => { setAy(i); if (gun > ayGunSayisi(yil, i)) setGun(ayGunSayisi(yil, i)); }}>
                        <Text style={[s.ayBtnYazi, { color: t.textSecondary }, ay === i && s.ayBtnYaziAktif]}>{a.substring(0, 3)}</Text>
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
                        style={[s.takvimHucre, h === gecerliGun && s.takvimHucreAktif]}
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
                  <TouchableOpacity style={[s.sonrakiBtn, { backgroundColor: t.bgSecondary }]} onPress={() => setAdim('saat')}>
                    <Text style={[s.sonrakiBtnYazi, { color: t.primary }]}>Saat Seçimi</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Saat secici */}
                  <Text style={[s.saatLabel, { color: t.text }]}>Saat</Text>
                  <View style={s.saatGrid}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <TouchableOpacity key={h} style={[s.saatBtn, { backgroundColor: t.bgInput }, saat === h && s.saatBtnAktif]}
                        onPress={() => setSaat(h)}>
                        <Text style={[s.saatBtnYazi, { color: t.textSecondary }, saat === h && s.saatBtnYaziAktif]}>{pad(h)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Dakika secici */}
                  <Text style={[s.saatLabel, { color: t.text }]}>Dakika</Text>
                  <View style={s.saatGrid}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <TouchableOpacity key={m} style={[s.saatBtn, { backgroundColor: t.bgInput }, dakika === m && s.saatBtnAktif]}
                        onPress={() => setDakika(m)}>
                        <Text style={[s.saatBtnYazi, { color: t.textSecondary }, dakika === m && s.saatBtnYaziAktif]}>{pad(m)}</Text>
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
            <TouchableOpacity style={s.onaylaBtn} onPress={onayla} activeOpacity={0.8}>
              <Text style={s.onaylaBtnYazi}>
                {turkceFormat(yil, ay, gecerliGun, saat, dakika)} — Onayla
              </Text>
            </TouchableOpacity>
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
  label: { fontSize: 12, fontWeight: '600', color: '#8A9BAE', marginTop: 16, marginBottom: 6 },

  seciciBtn: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  seciciBtnYazi: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  seciciBtnPlaceholder: { color: '#94A3B8' },
  seciciOk: { fontSize: 10, color: '#94A3B8' },

  // Modal
  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  modalIptal: { color: '#64748B', fontSize: 14 },
  modalBaslik: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  modalTemizle: { color: '#D62828', fontSize: 14 },

  // Onizleme
  onizleme: { backgroundColor: '#EAF4FB', paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  onizlemeYazi: { fontSize: 16, fontWeight: '700', color: '#0077B6' },

  // Adim sekmeleri
  adimKutu: { flexDirection: 'row', padding: 12, gap: 8 },
  adimBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#F5F7FA' },
  adimBtnAktif: { backgroundColor: '#0077B6' },
  adimBtnYazi: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  adimBtnYaziAktif: { color: '#FFF' },

  icerik: { paddingHorizontal: 16 },

  // Yil
  yilKutu: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  yilBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#F5F7FA' },
  yilBtnAktif: { backgroundColor: '#0077B6' },
  yilBtnYazi: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  yilBtnYaziAktif: { color: '#FFF' },

  // Ay
  ayKutu: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  ayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F5F7FA' },
  ayBtnAktif: { backgroundColor: '#0077B6' },
  ayBtnYazi: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  ayBtnYaziAktif: { color: '#FFF' },

  // Takvim
  takvimBaslik: { flexDirection: 'row', marginBottom: 4 },
  takvimBaslikHucre: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  takvimBaslikYazi: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  takvimGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  takvimHucre: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  takvimHucreAktif: { backgroundColor: '#0077B6' },
  takvimGunYazi: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
  takvimGunYaziAktif: { color: '#FFF', fontWeight: '700' },

  // Sonraki adim
  sonrakiBtn: { backgroundColor: '#EAF4FB', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16, marginBottom: 12 },
  sonrakiBtnYazi: { color: '#0077B6', fontWeight: '700', fontSize: 14 },

  // Saat
  saatLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 8, marginBottom: 8 },
  saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  saatBtn: { width: 48, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F7FA' },
  saatBtnAktif: { backgroundColor: '#0077B6' },
  saatBtnYazi: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  saatBtnYaziAktif: { color: '#FFF' },

  geriBtn: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  geriBtnYazi: { color: '#64748B', fontWeight: '600', fontSize: 13 },

  // Onayla
  onaylaBtn: { backgroundColor: '#0077B6', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  onaylaBtnYazi: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
