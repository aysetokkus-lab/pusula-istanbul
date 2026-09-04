// 4 Eyl 2026 — Bildirimler ekranı (Stack: /bildirimler). Kaynak: bildirim_gecmisi (push-gonder v7).
// Ana sayfa header'ındaki zil ikonundan açılır; açılınca "son görüldü" güncellenir (okunmamış sıfırlanır).
// Satıra dokununca push ile aynı yönlendirme (lib/bildirim-yonlendir.ts). Kobalt & Menekşe dili, emoji yok.
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '../hooks/use-tema';
import { Font, Palette } from '../constants/theme';
import { BosDurum, GradyanHeader, Kart, Kicker, Rozet } from '../components/ui/pusula-ui';
import { sonGorulduOku, sonGorulduYaz, useBildirimGecmisi, type BildirimSatir } from '../hooks/use-bildirim-gecmisi';
import { bildirimeGit } from '../lib/bildirim-yonlendir';

function GeriIkon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const KATEGORI_ETIKET: Record<string, { ad: string; renk: string }> = {
  sahaDurumu: { ad: 'Saha', renk: Palette.acik },
  ulasim: { ad: 'Ulaşım', renk: Palette.kobalt },
  trafik: { ad: 'Trafik', renk: Palette.kobalt },
  etkinlikler: { ad: 'Etkinlik', renk: Palette.menekse },
  sohbet: { ad: 'Sohbet', renk: Palette.kobaltOrta },
  ilanlar: { ad: 'Rehber Aranıyor', renk: Palette.safran },
  admin: { ad: 'Duyuru', renk: Palette.altin },
};

const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function gunEtiketi(iso: string): string {
  const d = new Date(iso); const bugun = new Date(); const dun = new Date(); dun.setDate(bugun.getDate() - 1);
  if (d.toDateString() === bugun.toDateString()) return 'Bugün';
  if (d.toDateString() === dun.toDateString()) return 'Dün';
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`;
}
function saat(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Satir = { tip: 'baslik'; id: string; etiket: string } | { tip: 'bildirim'; id: string; b: BildirimSatir; yeni: boolean };

export default function BildirimlerEkrani() {
  const { t } = useTema();
  const insets = useSafeAreaInsets();
  const { liste, yukleniyor, yenile } = useBildirimGecmisi();
  const [sonGoruldu, setSonGoruldu] = useState<string | null>(null);
  const [yenileniyor, setYenileniyor] = useState(false);

  // Açılışta: önceki "son görüldü" okunur (yeni rozetleri için), sonra şimdi olarak yazılır
  useEffect(() => {
    (async () => {
      setSonGoruldu(await sonGorulduOku());
      await sonGorulduYaz();
    })();
  }, []);

  const satirlar = useMemo<Satir[]>(() => {
    const out: Satir[] = []; let sonEtiket = '';
    for (const b of liste) {
      const e = gunEtiketi(b.created_at);
      if (e !== sonEtiket) { out.push({ tip: 'baslik', id: `b-${e}`, etiket: e }); sonEtiket = e; }
      out.push({ tip: 'bildirim', id: b.id, b, yeni: !!sonGoruldu && b.created_at > sonGoruldu });
    }
    return out;
  }, [liste, sonGoruldu]);

  const elleYenile = async () => { setYenileniyor(true); await yenile(); setYenileniyor(false); };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <GradyanHeader paddingTop={insets.top + 8} style={s.header}>
        <View style={s.headerSatir}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.headerBtn} accessibilityLabel="Geri" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <GeriIkon />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerBaslik}>Bildirimler</Text>
          </View>
        </View>
      </GradyanHeader>

      <FlatList
        data={satirlar}
        keyExtractor={i => i.id}
        contentContainerStyle={[s.govde, { paddingBottom: insets.bottom + 30 }]}
        refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={elleYenile} tintColor={t.primary} />}
        ListEmptyComponent={yukleniyor ? null : <BosDurum metin="Son 30 günde bildirim yok." />}
        renderItem={({ item }) => {
          if (item.tip === 'baslik') return <Kicker style={s.gunBaslik}>{item.etiket}</Kicker>;
          const k = KATEGORI_ETIKET[item.b.kategori] ?? { ad: item.b.kategori, renk: t.textMuted };
          return (
            <Kart onPress={() => bildirimeGit(item.b.kategori, item.b.veri)} accent={item.yeni ? k.renk : undefined} style={s.kart}>
              <View style={s.ustSatir}>
                <Rozet renk={k.renk} dolu={item.yeni}>{k.ad}</Rozet>
                <Text style={[s.saat, { color: t.textMuted }]}>{saat(item.b.created_at)}</Text>
              </View>
              <Text style={[s.baslik, { color: t.text }]} numberOfLines={2}>{item.b.baslik}</Text>
              {item.b.icerik ? <Text style={[s.icerik, { color: t.textSecondary }]} numberOfLines={3}>{item.b.icerik}</Text> : null}
            </Kart>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 16, paddingHorizontal: 12 },
  headerSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.seffafBeyaz20, alignItems: 'center', justifyContent: 'center' },
  headerBaslik: { fontFamily: Font.extrabold, fontSize: 22, color: '#FFFFFF', letterSpacing: -0.4 },
  govde: { padding: 16, gap: 10 },
  gunBaslik: { marginTop: 8, marginBottom: 2 },
  kart: { gap: 6 },
  ustSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  saat: { fontFamily: Font.regular, fontSize: 12 },
  baslik: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.2 },
  icerik: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18 },
});
