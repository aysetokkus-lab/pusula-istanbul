import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '../../hooks/use-tema';
import { Font, Radius } from '../../constants/theme';

/* ═══════════════════════════════════════════
   TAKVİM — aylık tarih seçici (Eyl 2026)
   ─────────────────────────────────────────
   Bağımlılık yok. Pazartesi başlangıçlı, Türkçe ay/gün adları.
   value / onChange: 'YYYY-MM-DD' (lokal). minDate'ten önce seçilemez.
   Eyl 2026 (Ajanda): `gecmisSecilebilir` → geçmiş günler açık, geriye sınırsız gezilir;
   `isaretler` { 'YYYY-MM-DD': renk } → günün altında renkli nokta (dolu günler).
   ═══════════════════════════════════════════ */

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function tarihStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → "Cmt 6 Eylül 2026" */
export function tarihUzun(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const gun = GUNLER[(dt.getDay() + 6) % 7];
  return `${gun} ${d} ${AYLAR[m - 1]} ${y}`;
}

function Ok({ yon, color }: { yon: 'sol' | 'sag'; color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d={yon === 'sol' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Takvim({ value, onChange, minDate, renk, gecmisSecilebilir, isaretler, onAyDegisti }: {
  value: string | null; onChange: (iso: string) => void; minDate?: Date; renk?: string;
  gecmisSecilebilir?: boolean; isaretler?: Record<string, string>; onAyDegisti?: (ay: Date) => void;
}) {
  const { t } = useTema();
  const vurgu = renk ?? t.primary;
  const bugun = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const min = useMemo(() => {
    if (gecmisSecilebilir && !minDate) return new Date(1970, 0, 1);
    const d = new Date(minDate ?? bugun); d.setHours(0, 0, 0, 0); return d;
  }, [minDate, bugun, gecmisSecilebilir]);
  const bugunStr = tarihStr(bugun);

  const baslangicAy = useMemo(() => {
    if (value) { const [y, m] = value.split('-').map(Number); return new Date(y, m - 1, 1); }
    return new Date(bugun.getFullYear(), bugun.getMonth(), 1);
  }, [value, bugun]);
  const [ay, setAy] = useState<Date>(baslangicAy);
  // value sonradan dolarsa (form useEffect ile doldurur) görünen ayı da o tarihe getir
  useEffect(() => {
    if (!value) return;
    const [y, m] = value.split('-').map(Number);
    setAy(prev => (prev.getFullYear() === y && prev.getMonth() === m - 1) ? prev : new Date(y, m - 1, 1));
  }, [value]);

  const hucreler = useMemo(() => {
    const y = ay.getFullYear(), m = ay.getMonth();
    const ilkGun = new Date(y, m, 1);
    const bosluk = (ilkGun.getDay() + 6) % 7; // Pazartesi = 0
    const gunSayisi = new Date(y, m + 1, 0).getDate();
    const liste: (Date | null)[] = Array.from({ length: bosluk }, () => null);
    for (let g = 1; g <= gunSayisi; g++) liste.push(new Date(y, m, g));
    while (liste.length % 7 !== 0) liste.push(null);
    return liste;
  }, [ay]);

  const oncekiAyaGidilebilir = ay > new Date(min.getFullYear(), min.getMonth(), 1);
  const ayaGit = (yeni: Date) => { setAy(yeni); onAyDegisti?.(yeni); };

  return (
    <View style={[s.kutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
      <View style={s.baslikSatir}>
        <TouchableOpacity
          onPress={() => ayaGit(new Date(ay.getFullYear(), ay.getMonth() - 1, 1))}
          disabled={!oncekiAyaGidilebilir}
          style={[s.okBtn, { opacity: oncekiAyaGidilebilir ? 1 : 0.3 }]}
          accessibilityLabel="Önceki ay"
        >
          <Ok yon="sol" color={t.text} />
        </TouchableOpacity>
        <Text style={[s.ayBaslik, { color: t.text }]}>{AYLAR[ay.getMonth()]} {ay.getFullYear()}</Text>
        <TouchableOpacity onPress={() => ayaGit(new Date(ay.getFullYear(), ay.getMonth() + 1, 1))} style={s.okBtn} accessibilityLabel="Sonraki ay">
          <Ok yon="sag" color={t.text} />
        </TouchableOpacity>
      </View>

      <View style={s.satir}>
        {GUNLER.map((g, i) => (
          <Text key={g} style={[s.gunAdi, { color: i >= 5 ? vurgu : t.textMuted }]}>{g}</Text>
        ))}
      </View>

      {Array.from({ length: hucreler.length / 7 }, (_, h) => (
        <View key={h} style={s.satir}>
          {hucreler.slice(h * 7, h * 7 + 7).map((d, i) => {
            if (!d) return <View key={`b${i}`} style={s.hucre} />;
            const iso = tarihStr(d);
            const gecmis = d < min;
            const secili = iso === value;
            const bugunMu = iso === bugunStr;
            const isaret = isaretler?.[iso];
            return (
              <TouchableOpacity
                key={iso}
                onPress={() => onChange(iso)}
                disabled={gecmis}
                activeOpacity={0.7}
                accessibilityLabel={tarihUzun(iso)}
                style={[
                  s.hucre,
                  secili && { backgroundColor: vurgu },
                  !secili && bugunMu && { borderWidth: 1.5, borderColor: vurgu },
                ]}
              >
                <Text style={[s.gunYazi, { color: secili ? '#FFFFFF' : gecmis ? t.textMuted : t.text }, gecmis && { opacity: 0.45 }]}>
                  {d.getDate()}
                </Text>
                {isaret ? <View style={[s.nokta, { backgroundColor: secili ? '#FFFFFF' : isaret }]} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: Radius.lg, padding: 10, gap: 4 },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  okBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ayBaslik: { fontFamily: Font.bold, fontSize: 15 },
  satir: { flexDirection: 'row' },
  gunAdi: { flex: 1, textAlign: 'center', fontFamily: Font.bold, fontSize: 11, paddingVertical: 4 },
  hucre: { flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', margin: 1 },
  gunYazi: { fontFamily: Font.semibold, fontSize: 14 },
  nokta: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3 },
});
