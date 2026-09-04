// Eyl 2026 — AJANDA tam ekran (Stack route /ajanda, ?yeni=1 → form açık, ?tarih=YYYY-MM-DD → o gün seçili).
// GradyanHeader (geri + "Ajandam" + "+ Tur" pill) · Takvim (dolu günler noktalı, geçmiş açık) · seçili günün turları ·
// yaklaşan turlar. Tur kartı → /tur/[id] (tur bilgisi + masraf pusulası). Veri: hooks/use-ajanda.ts.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, InteractionManager, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '../hooks/use-tema';
import { bugunStr, cokGunlu, tarihAraligiKisa, turBitis, turGunleri, turKapsar, useAjanda, type Tur, type TurPayload } from '../hooks/use-ajanda';
import { Font, Palette, Radius } from '../constants/theme';
import { BosDurum, GradyanHeader, Kart, Kicker, Rozet } from '../components/ui/pusula-ui';
import { Takvim, tarihUzun } from '../components/ui/takvim';
import { TurFormModal } from '../components/tur-form-modal';

function GeriIkon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function tarihRozet(iso: string): { gun: string; no: number; ay: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return { gun: GUN_KISA[(dt.getDay() + 6) % 7], no: d, ay: AY_KISA[m - 1] };
}

function TurKarti({ tur, t, onPress, gecmis }: { tur: Tur; t: ReturnType<typeof useTema>['t']; onPress: () => void; gecmis: boolean }) {
  const r = tarihRozet(tur.tarih);
  return (
    <Kart onPress={onPress} accent={gecmis ? t.textMuted : t.primary}>
      <View style={s.turSatir}>
        <View style={[s.tarihKutu, { backgroundColor: gecmis ? t.bgSecondary : Palette.kobaltTint }]}>
          <Text style={[s.tarihGun, { color: gecmis ? t.textMuted : t.primary }]}>{r.gun}</Text>
          <Text style={[s.tarihNo, { color: gecmis ? t.textSecondary : t.primary }]}>{r.no}</Text>
          <Text style={[s.tarihAy, { color: gecmis ? t.textMuted : t.primary }]}>{r.ay}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.turBaslik, { color: t.text }]} numberOfLines={2}>{tur.baslik}</Text>
          {cokGunlu(tur) ? <Text style={[s.turAralik, { color: gecmis ? t.textMuted : t.secondary }]}>{tarihAraligiKisa(tur)}</Text> : null}
          <Text style={[s.turMeta, { color: t.textSecondary }]} numberOfLines={1}>
            {[tur.saat, tur.acente, tur.grup].filter(Boolean).join(' · ') || 'Detay için dokun'}
          </Text>
          {tur.bulusma ? <Text style={[s.turMeta, { color: t.textMuted }]} numberOfLines={1}>{tur.bulusma}</Text> : null}
        </View>
        <Text style={[s.ok, { color: t.primary }]}>›</Text>
      </View>
    </Kart>
  );
}

export default function AjandaEkrani() {
  const { t } = useTema();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ yeni?: string; tarih?: string }>();
  const { turlar, yukleniyor, hata, yenile, turEkle } = useAjanda();

  const bugun = bugunStr();
  const [secili, setSecili] = useState<string>(typeof params.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.tarih) ? params.tarih : bugun);
  const [form, setForm] = useState(false);
  const [yenileniyor, setYenileniyor] = useState(false);

  useEffect(() => { if (params.yeni === '1') setForm(true); }, [params.yeni]);
  useFocusEffect(useCallback(() => { yenile(true); }, [yenile]));

  // Takvim işaretleri: çok günlü turlar aralık boyunca noktalanır (geçmiş günler soluk)
  const isaretler = useMemo(() => {
    const m: Record<string, string> = {};
    for (const tr of turlar) for (const iso of turGunleri(tr)) m[iso] = iso < bugun ? t.textMuted : t.primary;
    return m;
  }, [turlar, bugun, t.primary, t.textMuted]);

  const gunTurlari = useMemo(() => turlar.filter(tr => turKapsar(tr, secili)), [turlar, secili]);
  const yaklasan = useMemo(() => turlar.filter(tr => turBitis(tr) >= bugun).slice(0, 12), [turlar, bugun]);
  const gecmisSayi = useMemo(() => turlar.filter(tr => turBitis(tr) < bugun).length, [turlar, bugun]);

  const turAc = useCallback((id: string) => router.push({ pathname: '/tur/[id]', params: { id } } as never), []);

  // Yeni tur kaydedilince: modal kapansın, animasyon bitsin, sonra tur ekranına geç
  const [bekleyenTur, setBekleyenTur] = useState<string | null>(null);
  useEffect(() => {
    if (form || !bekleyenTur) return;
    const id = bekleyenTur; setBekleyenTur(null);
    const h = InteractionManager.runAfterInteractions(() => turAc(id));
    return () => h.cancel();
  }, [form, bekleyenTur, turAc]);
  const kaydet = async (p: TurPayload) => {
    const r = await turEkle(p);
    if (r.ok && r.id) { setSecili(p.tarih); setBekleyenTur(r.id); }
    return r;
  };

  const elleYenile = async () => { setYenileniyor(true); await yenile(true); setYenileniyor(false); };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <GradyanHeader paddingTop={insets.top + 8} style={s.header}>
        <View style={s.headerSatir}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.headerBtn} accessibilityLabel="Geri" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <GeriIkon />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerBaslik}>Ajandam</Text>
            <Text style={[s.headerAlt, { color: t.headerSubtext }]} numberOfLines={1}>
              {turlar.length ? `${yaklasan.length} yaklaşan · ${gecmisSayi} geçmiş tur` : 'Tur tarihlerin ve masraf pusulaların'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setForm(true)} activeOpacity={0.8} style={[s.headerPill, { backgroundColor: t.accent }]} accessibilityLabel="Tur ekle">
            <Text style={s.headerPillYazi}>+ Tur</Text>
          </TouchableOpacity>
        </View>
      </GradyanHeader>

      <ScrollView
        contentContainerStyle={[s.govde, { paddingBottom: insets.bottom + 30 }]}
        refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={elleYenile} tintColor={t.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        <Takvim value={secili} onChange={setSecili} renk={Palette.kobalt} gecmisSecilebilir isaretler={isaretler} />

        <View style={s.bolum}>
          <View style={s.bolumBaslik}>
            <Kicker color={t.primary}>{secili === bugun ? 'Bugün' : tarihUzun(secili)}</Kicker>
            <TouchableOpacity onPress={() => setForm(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.link, { color: t.accent }]}>+ Bu güne tur ekle</Text>
            </TouchableOpacity>
          </View>
          {yukleniyor && turlar.length === 0 ? (
            <ActivityIndicator color={t.primary} style={{ paddingVertical: 20 }} />
          ) : gunTurlari.length === 0 ? (
            <BosDurum metin={secili < bugun ? 'Bu günde tur kaydı yok.' : 'Bu günde tur yok — boş gün.'} />
          ) : (
            <View style={{ gap: 10 }}>
              {gunTurlari.map(tr => <TurKarti key={tr.id} tur={tr} t={t} onPress={() => turAc(tr.id)} gecmis={turBitis(tr) < bugun} />)}
            </View>
          )}
        </View>

        <View style={s.bolum}>
          <View style={s.bolumBaslik}>
            <Kicker color={t.primary}>Yaklaşan turlar</Kicker>
            {yaklasan.length > 0 ? <Rozet renk={t.primary}>{yaklasan.length}</Rozet> : null}
          </View>
          {yaklasan.length === 0 ? (
            <BosDurum metin="Yaklaşan tur yok. Sağ üstten ekleyebilirsin." />
          ) : (
            <View style={{ gap: 10 }}>
              {yaklasan.map(tr => <TurKarti key={tr.id} tur={tr} t={t} onPress={() => turAc(tr.id)} gecmis={false} />)}
            </View>
          )}
        </View>

        {hata ? <Text style={[s.hata, { color: t.durumKapali }]}>{hata}</Text> : null}
        <Text style={[s.dipnot, { color: t.textMuted }]}>Ajandanız ve masraf kayıtlarınız yalnızca sizin görebileceğiniz özel alanınızdır; Pusula İstanbul yöneticileri dâhil hiç kimseyle paylaşılmaz.</Text>
      </ScrollView>

      <TurFormModal visible={form} varsayilanTarih={secili} onKapat={() => setForm(false)} onKaydet={kaydet} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 16, paddingHorizontal: 12 },
  headerSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.seffafBeyaz20, alignItems: 'center', justifyContent: 'center' },
  headerBaslik: { fontFamily: Font.extrabold, fontSize: 22, color: '#FFFFFF', letterSpacing: -0.4 },
  headerAlt: { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },
  headerPill: { height: 40, borderRadius: Radius.full, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  headerPillYazi: { fontFamily: Font.bold, fontSize: 13, color: '#FFFFFF' },
  govde: { padding: 16, gap: 18 },
  bolum: { gap: 10 },
  bolumBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontFamily: Font.bold, fontSize: 12 },
  turSatir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tarihKutu: { width: 52, borderRadius: 14, paddingVertical: 6, alignItems: 'center' },
  tarihGun: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.5 },
  tarihNo: { fontFamily: Font.extrabold, fontSize: 20, lineHeight: 24 },
  tarihAy: { fontFamily: Font.semibold, fontSize: 10 },
  turBaslik: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3 },
  turAralik: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 0.3 },
  turMeta: { fontFamily: Font.regular, fontSize: 12 },
  ok: { fontFamily: Font.bold, fontSize: 22 },
  hata: { fontFamily: Font.regular, fontSize: 12, textAlign: 'center' },
  dipnot: { fontFamily: Font.regular, fontSize: 11, textAlign: 'center', lineHeight: 16, paddingHorizontal: 12 },
});
