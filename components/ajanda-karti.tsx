// Eyl 2026 — "Ajandam" ana sayfa kartı (rota kartının yerine; Kobalt & Menekşe).
// Bu haftanın 7 günü şerit halinde: turu olan günler dolu kobalt daire, bugün safran halka.
// Altında bugünkü tur (yoksa sıradaki tur). Dokunma → /ajanda, "+ Tur ekle" → /ajanda?yeni=1.
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTema } from '../hooks/use-tema';
import { bugunStr, gunStr, kacinciGun, gunSayisi, tarihAraligiKisa, turBitis, turKapsar, useAjanda, type Tur } from '../hooks/use-ajanda';
import { Font } from '../constants/theme';
import { Kart, Kicker, Rozet } from './ui/pusula-ui';

const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function haftaGunleri(): Date[] {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const pzt = new Date(bugun); pzt.setDate(bugun.getDate() - ((bugun.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(pzt); d.setDate(pzt.getDate() + i); return d; });
}

function tarihKisa(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${GUN_KISA[(dt.getDay() + 6) % 7]} ${d} ${AY_KISA[m - 1]}`;
}

export function AjandaKarti() {
  const { t } = useTema();
  const { turlar, yukleniyor, yenile } = useAjanda();

  // Ajanda/tur ekranından dönünce sessizce tazele
  useFocusEffect(useCallback(() => { yenile(true); }, [yenile]));

  const bugun = bugunStr();
  const hafta = useMemo(haftaGunleri, []);
  // Haftanın her günü için o günü kapsayan tur sayısı (çok günlü turlar aralık boyunca dolu sayılır)
  const gunSayim = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of hafta) { const iso = gunStr(d); m.set(iso, turlar.filter(tr => turKapsar(tr, iso)).length); }
    return m;
  }, [turlar, hafta]);

  const bugunku = useMemo(() => turlar.filter(tr => turKapsar(tr, bugun)), [turlar, bugun]);
  const siradaki: Tur | undefined = useMemo(() => turlar.find(tr => tr.tarih > bugun), [turlar, bugun]);
  const buHafta = useMemo(() => {
    const ilk = gunStr(hafta[0]), son = gunStr(hafta[6]);
    return turlar.filter(tr => tr.tarih <= son && turBitis(tr) >= ilk).length;
  }, [turlar, hafta]);

  const ac = () => router.push('/ajanda' as never);
  const yeni = () => router.push({ pathname: '/ajanda', params: { yeni: '1' } } as never);
  const turAc = (id: string) => router.push({ pathname: '/tur/[id]', params: { id } } as never);

  if (yukleniyor && turlar.length === 0) return null;

  return (
    <View style={s.zarf}>
      <Kart onPress={ac}>
        <View style={s.ustSatir}>
          <Kicker color={t.primary}>Ajandam</Kicker>
          <Rozet renk={buHafta > 0 ? t.primary : t.textMuted}>{buHafta > 0 ? `Bu hafta ${buHafta} tur` : 'Bu hafta boş'}</Rozet>
        </View>

        {/* Hafta şeridi */}
        <View style={s.hafta}>
          {hafta.map((d, i) => {
            const iso = gunStr(d);
            const dolu = (gunSayim.get(iso) ?? 0) > 0;
            const bugunMu = iso === bugun;
            const gecmis = iso < bugun;
            return (
              <View key={iso} style={s.gun}>
                <Text style={[s.gunAd, { color: i >= 5 ? t.secondary : t.textMuted }]}>{GUN_KISA[i]}</Text>
                <View style={[
                  s.daire,
                  dolu && { backgroundColor: gecmis ? t.textMuted : t.primary },
                  bugunMu && { borderWidth: 2, borderColor: t.accent },
                ]}>
                  <Text style={[s.gunNo, { color: dolu ? '#FFFFFF' : gecmis ? t.textMuted : t.text }]}>{d.getDate()}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bugün / sıradaki */}
        {bugunku.length > 0 ? (
          bugunku.slice(0, 2).map(tr => (
            <TouchableOpacity key={tr.id} onPress={() => turAc(tr.id)} activeOpacity={0.7} style={[s.turSatir, { borderColor: t.kartBorder, backgroundColor: t.bgCardAlt }]}>
              <View style={[s.turCizgi, { backgroundColor: t.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.turEtiket, { color: t.accent }]}>
                  BUGÜN{gunSayisi(tr) > 1 ? ` · ${kacinciGun(tr, bugun)}/${gunSayisi(tr)}. GÜN` : ''}{tr.saat && tr.tarih === bugun ? ` · ${tr.saat}` : ''}
                </Text>
                <Text style={[s.turBaslik, { color: t.text }]} numberOfLines={1}>{tr.baslik}</Text>
                {tr.acente ? <Text style={[s.turAlt, { color: t.textSecondary }]} numberOfLines={1}>{tr.acente}{tr.grup ? ` · ${tr.grup}` : ''}</Text> : null}
              </View>
              <Text style={[s.link, { color: t.primary }]}>Masraf ›</Text>
            </TouchableOpacity>
          ))
        ) : siradaki ? (
          <TouchableOpacity onPress={() => turAc(siradaki.id)} activeOpacity={0.7} style={[s.turSatir, { borderColor: t.kartBorder, backgroundColor: t.bgCardAlt }]}>
            <View style={[s.turCizgi, { backgroundColor: t.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.turEtiket, { color: t.primary }]}>
                SIRADAKİ · {(gunSayisi(siradaki) > 1 ? tarihAraligiKisa(siradaki) : tarihKisa(siradaki.tarih)).toLocaleUpperCase('tr-TR')}{siradaki.saat ? ` · ${siradaki.saat}` : ''}
              </Text>
              <Text style={[s.turBaslik, { color: t.text }]} numberOfLines={1}>{siradaki.baslik}</Text>
              {siradaki.acente ? <Text style={[s.turAlt, { color: t.textSecondary }]} numberOfLines={1}>{siradaki.acente}</Text> : null}
            </View>
            <Text style={[s.link, { color: t.primary }]}>Aç ›</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[s.bos, { color: t.textSecondary }]}>Tur tarihlerini not et; her tur için masraf pusulası tut, acenteye tek dokunuşla gönder.</Text>
        )}

        <View style={s.altSatir}>
          <TouchableOpacity onPress={yeni} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.link, { color: t.accent }]}>+ Tur ekle</Text>
          </TouchableOpacity>
          <Text style={[s.link, { color: t.primary }]}>Ajandayı aç ›</Text>
        </View>
      </Kart>
    </View>
  );
}

const s = StyleSheet.create({
  zarf: { paddingHorizontal: 16 },
  ustSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hafta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  gun: { alignItems: 'center', gap: 4, flex: 1 },
  gunAd: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.3 },
  daire: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  gunNo: { fontFamily: Font.semibold, fontSize: 14 },
  turSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12, paddingLeft: 10 },
  turCizgi: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  turEtiket: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.8 },
  turBaslik: { fontFamily: Font.bold, fontSize: 14, letterSpacing: -0.2, marginTop: 1 },
  turAlt: { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },
  bos: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17 },
  altSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontFamily: Font.bold, fontSize: 12 },
});
