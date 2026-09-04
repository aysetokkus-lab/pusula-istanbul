import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette } from '../../constants/theme';
import { BosDurum, Rozet, Segmentler } from '../ui/pusula-ui';

/* ═══════════════════════════════════════════
   TurebYonetim (Eyl 2026) — yalnızca admin; profil ekranında YetkiliBolum içinde
   TUREB eşleşmesi olmayan hesaplar: bulunamadı / çoklu (seçmemiş) / ulaşılamadı / hiç kontrol edilmemiş.
   Sahte ya da yanlış adla kayıt olanları burada görürsün; işlem: kullanıcıyla iletişim (e-posta).
   ═══════════════════════════════════════════ */

type Satir = { id: string; isim: string; soyisim: string; email: string | null; tureb_durum: string | null; tureb_kontrol_at: string | null; created_at: string };
type Filtre = 'sorunlu' | 'eylemsiz' | 'eylemli';

export function TurebYonetim() {
  const { t } = useTema();
  const [filtre, setFiltre] = useState<Filtre>('sorunlu');
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [sayilar, setSayilar] = useState<Record<string, number>>({});
  const [yukleniyor, setYukleniyor] = useState(true);

  const cek = useCallback(async () => {
    setYukleniyor(true);
    let q = supabase.from('profiles').select('id, isim, soyisim, email, tureb_durum, tureb_kontrol_at, created_at').order('created_at', { ascending: false }).limit(200);
    if (filtre === 'sorunlu') q = q.or('tureb_durum.in.(bulunamadi,coklu,bilinmiyor),tureb_durum.is.null');
    else q = q.eq('tureb_durum', filtre);
    const [{ data }, { data: ozet }] = await Promise.all([
      q,
      supabase.from('profiles').select('tureb_durum'),
    ]);
    setSatirlar((data as Satir[]) ?? []);
    const s: Record<string, number> = {};
    for (const p of ozet ?? []) { const k = (p as any).tureb_durum ?? 'yok'; s[k] = (s[k] ?? 0) + 1; }
    setSayilar(s);
    setYukleniyor(false);
  }, [filtre]);

  useEffect(() => { cek(); }, [cek]);

  const etiket = (d: string | null) => d === 'bulunamadi' ? 'Bulunamadı' : d === 'coklu' ? 'Seçim bekliyor' : d === 'bilinmiyor' ? 'Ulaşılamadı' : d === 'eylemli' ? 'Eylemli' : d === 'eylemsiz' ? 'Eylemsiz' : 'Kontrol yok';
  const renk = (d: string | null) => d === 'eylemli' ? Palette.acik : d === 'eylemsiz' ? t.textMuted : d === 'bulunamadi' ? t.durumKapali : Palette.uyari;

  return (
    <View style={{ gap: 10 }}>
      <Text style={[s.ozet, { color: t.textSecondary }]}>
        Eylemli {sayilar.eylemli ?? 0} · Eylemsiz {sayilar.eylemsiz ?? 0} · Bulunamadı {sayilar.bulunamadi ?? 0} · Seçim bekliyor {sayilar.coklu ?? 0} · Ulaşılamadı {sayilar.bilinmiyor ?? 0} · Kontrol yok {sayilar.yok ?? 0}
      </Text>
      <Segmentler secenekler={[{ id: 'sorunlu', baslik: 'Eşleşmeyen' }, { id: 'eylemsiz', baslik: 'Eylemsiz' }, { id: 'eylemli', baslik: 'Eylemli' }]} aktif={filtre} onSec={setFiltre} />
      {yukleniyor ? <BosDurum metin="Yükleniyor…" /> : satirlar.length === 0 ? <BosDurum metin="Kayıt yok" /> : satirlar.map(p => (
        <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={cek} style={[s.satir, { borderColor: t.kartBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.ad, { color: t.text }]} numberOfLines={1}>{p.isim} {p.soyisim}</Text>
            <Text style={[s.alt, { color: t.textMuted }]} numberOfLines={1}>{p.email || '—'} · kayıt {new Date(p.created_at).toLocaleDateString('tr-TR')}</Text>
          </View>
          <Rozet renk={renk(p.tureb_durum)}>{etiket(p.tureb_durum)}</Rozet>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  ozet: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingVertical: 8 },
  ad: { fontFamily: Font.semibold, fontSize: 14 },
  alt: { fontFamily: Font.regular, fontSize: 11, marginTop: 1 },
});
