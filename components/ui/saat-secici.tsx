import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTema } from '../../hooks/use-tema';
import { Font, Radius } from '../../constants/theme';

/* ═══════════════════════════════════════════
   SaatSecici (4 Eyl 2026, Ayşe: "iki nokta yazmak zor, saat formu koy")
   ─────────────────────────────────────────
   Klavyesiz saat seçimi: alana dokun → altında saat (00–23) ve dakika (00,05,…,55) çipleri açılır,
   seçince alan "09:30" olur ve panel kapanır. Değer her zaman "HH:MM" ya da "" (temizlenmiş).
   Formlarda TextInput'un yerine: <SaatSecici value={saat} onChange={setSaat} renk={Palette.safran} />
   ═══════════════════════════════════════════ */

const SAATLER = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const DAKIKALAR = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export function SaatSecici({ value, onChange, renk, placeholder = 'Saat seç', bosalt = true }: {
  value: string;
  onChange: (v: string) => void;
  renk?: string;
  placeholder?: string;
  bosalt?: boolean;   // "Temizle" düğmesi
}) {
  const { t } = useTema();
  const r = renk ?? t.primary;
  const [acik, setAcik] = useState(false);
  const [saat, dakika] = useMemo(() => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    return m ? [m[1].padStart(2, '0'), m[2]] : ['', ''];
  }, [value]);

  // Saat seçimi paneli AÇIK bırakır (dakika seçilsin), dakika seçimi kapatır
  const saatSec = (s: string) => onChange(`${s}:${dakika || '00'}`);
  const dakikaSec = (d: string) => { onChange(`${saat || '09'}:${d}`); setAcik(false); };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setAcik(a => !a)}
        activeOpacity={0.7}
        style={[st.alan, { backgroundColor: t.bgInput, borderColor: acik ? r : t.kartBorder }]}
        accessibilityLabel="Saat seç"
      >
        <Text style={[st.alanYazi, { color: value ? t.text : t.textMuted }]}>{value || placeholder}</Text>
        {bosalt && value ? (
          <TouchableOpacity onPress={() => { onChange(''); setAcik(false); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Saati temizle">
            <Text style={[st.temizle, { color: t.textMuted }]}>Temizle</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {acik ? (
        <View style={[st.panel, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <Text style={[st.etiket, { color: t.textMuted }]}>Saat</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={st.satir}>
            {SAATLER.map(s => {
              const on = s === saat;
              return (
                <TouchableOpacity key={s} onPress={() => saatSec(s)} activeOpacity={0.7}
                  style={[st.cip, { backgroundColor: on ? r : t.bgSecondary, borderColor: on ? r : t.kartBorder }]}>
                  <Text style={[st.cipYazi, { color: on ? '#FFFFFF' : t.text }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={[st.etiket, { color: t.textMuted, marginTop: 8 }]}>Dakika</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={st.satir}>
            {DAKIKALAR.map(d => {
              const on = d === dakika;
              return (
                <TouchableOpacity key={d} onPress={() => dakikaSec(d)} activeOpacity={0.7}
                  style={[st.cip, { backgroundColor: on ? r : t.bgSecondary, borderColor: on ? r : t.kartBorder }]}>
                  <Text style={[st.cipYazi, { color: on ? '#FFFFFF' : t.text }]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  alan: { minHeight: 48, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alanYazi: { fontFamily: Font.semibold, fontSize: 15 },
  temizle: { fontFamily: Font.regular, fontSize: 12 },
  panel: { marginTop: 8, borderWidth: 1, borderRadius: Radius.lg, padding: 10 },
  etiket: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 },
  satir: { gap: 6, paddingRight: 6 },
  cip: { minWidth: 44, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  cipYazi: { fontFamily: Font.semibold, fontSize: 14 },
});
