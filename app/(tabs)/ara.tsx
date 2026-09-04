// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + arama kutusu Kart içinde + Rozet filtre chip'leri + Kart sonuç satırları.
// Arama / normalizasyon mantığı, veri birleştirme ve router hedefleri aynen korundu.
import { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTema } from '../../hooks/use-tema';
import { useMekanSaatleri, type MekanSaat } from '../../hooks/use-mekan-saatleri';
import { useBogazTurlari, type BogazTuru } from '../../hooks/use-bogaz-turlari';
import { useAcilRehber, type AcilKayit } from '../../hooks/use-acil-rehber';
import { SearchIcon } from '../../components/tab-icons';
import { DurumNoktasi, GradyanHeader, HeaderBaslik, Kart, Rozet } from '../../components/ui/pusula-ui';
import { Font, Palette, Space } from '../../constants/theme';

// ═══ Aranabilir içerik veritabanı — Supabase'den dinamik ═══
interface AramaOgesi {
  id: string;
  isim: string;
  kategori: 'muze' | 'vapur' | 'ulasim' | 'acil' | 'mekan' | 'bilgi';
  alt: string;
  etiketler: string[];
  aksiyon: () => void;
}

const GUNLER = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

function kapaliGunYazi(kapaliGun: number | null): string {
  if (kapaliGun === null || kapaliGun < 0 || kapaliGun > 6) return '';
  return GUNLER[kapaliGun] + ' kapalı';
}

function mekanlarDanArama(mekanlar: MekanSaat[]): AramaOgesi[] {
  return mekanlar.map((m) => {
    const kapali = kapaliGunYazi(m.kapali_gun);
    const fiyat = m.fiyat_yabanci ? `Yabancı: ${m.fiyat_yabanci}` : '';
    const muzekart = m.muzekart === 'gecerli' ? 'MüzeKart geçerli' : m.muzekart === 'gecmez' ? 'MüzeKart geçmez' : '';
    const altParts = [m.kategori, kapali, fiyat, muzekart].filter(Boolean);

    // Arama etiketleri olustur
    const etiketler = [
      m.mekan_id,
      m.tip,
      m.kategori,
      'muze', 'muze', 'museum',
      m.ozel_not || '',
      m.ulasim_notu || '',
      m.muzekart === 'gecerli' ? 'muzekart' : '',
      kapali,
    ].filter(Boolean);

    return {
      id: `mekan_${m.mekan_id}`,
      isim: m.isim,
      kategori: 'muze' as const,
      alt: altParts.join(' · ') || m.tip,
      etiketler,
      aksiyon: () => router.push({ pathname: '/(tabs)/muzeler', params: { mekanId: m.mekan_id } }),
    };
  });
}

function bogazDanArama(turlar: BogazTuru[]): AramaOgesi[] {
  return turlar.map((t) => {
    const fiyat = t.fiyat ? `${t.fiyat}` : '';
    const sure = t.sure ? `${t.sure}` : '';
    const altParts = [t.sirket_adi, t.tur_tipi, fiyat, sure].filter(Boolean);

    return {
      id: `bogaz_${t.id}`,
      isim: `${t.sirket_adi} — ${t.tur_tipi}`,
      kategori: 'vapur' as const,
      alt: altParts.join(' · '),
      etiketler: [t.sirket_id, t.sirket_adi, t.tur_tipi, 'bogaz', 'tur', 'vapur', t.kalkis_yeri || ''].filter(Boolean),
      aksiyon: () => router.push('/(tabs)/bogaz'),
    };
  });
}

function acilDenArama(kayitlar: AcilKayit[]): AramaOgesi[] {
  return kayitlar.map((k) => {
    const alt = k.numara ? (k.goruntu || k.numara) : (k.url || k.aciklama || '');

    return {
      id: `acil_${k.id}`,
      isim: k.isim,
      kategori: 'acil' as const,
      alt: alt,
      etiketler: [k.isim, k.kategori, k.numara || '', k.aciklama || '', 'acil'].filter(Boolean),
      aksiyon: () => {
        if (k.numara) Linking.openURL(`tel:${k.numara.replace(/\s/g, '')}`);
        else if (k.url) Linking.openURL(k.url);
        else router.push('/(tabs)/acil' as any);
      },
    };
  });
}

// Sabit icerikler — bunlar Supabase'de degil
function sabitArama(): AramaOgesi[] {
  return [
    {
      id: 'bilgi_muzekart', isim: 'Museum Pass / MüzeKart', kategori: 'bilgi',
      alt: 'Kart tipleri, satış noktaları', etiketler: ['museum pass', 'muzekart', 'müzekart', 'bilet', 'kart', 'satin al'],
      aksiyon: () => router.push('/(tabs)/muzeKart'),
    },
    {
      id: 'bilgi_gemi', isim: 'Galataport Gemi Takvimi', kategori: 'bilgi',
      alt: 'Kruvaziyer gemi programı', etiketler: ['galataport', 'gemi', 'cruise', 'liman', 'yolcu', 'kruvaziyer'],
      aksiyon: () => router.push('/(tabs)/index' as any),
    },
    {
      id: 'bilgi_sultanahmet', isim: 'Sultanahmet Camii Ziyaret', kategori: 'bilgi',
      alt: 'Namaz saatlerine göre açık/kapalı', etiketler: ['sultanahmet', 'cami', 'namaz', 'ziyaret', 'mavi'],
      aksiyon: () => router.push('/(tabs)/index' as any),
    },
    {
      id: 'bilgi_namaz', isim: 'Namaz Vakitleri', kategori: 'bilgi',
      alt: 'İstanbul güncel namaz saatleri', etiketler: ['namaz', 'vakit', 'ezan', 'imsak', 'iftar'],
      aksiyon: () => router.push('/(tabs)/index' as any),
    },
    {
      id: 'ulasim_havaist', isim: 'HAVAİST — İstanbul Havalimanı', kategori: 'ulasim',
      alt: 'Aksaray, Taksim, Beşiktaş, Kadıköy', etiketler: ['havaist', 'istanbul havalimani', 'ist', 'otobüs', 'shuttle', 'ulaşım'],
      aksiyon: () => router.push('/(tabs)/ulasim'),
    },
    {
      id: 'ulasim_havabus', isim: 'HAVABÜS — Sabiha Gökçen', kategori: 'ulasim',
      alt: 'Taksim & Kadıköy', etiketler: ['havabus', 'sabiha gökçen', 'saw', 'otobüs', 'shuttle', 'ulaşım'],
      aksiyon: () => router.push('/(tabs)/ulasim'),
    },
  ];
}

// Kategori renkleri — tasarım sistemi paletinden (müze = menekşe, ulaşım = safran, acil = kırmızı)
const KATEGORI_ETIKETLERI: Record<string, { label: string; renk: string }> = {
  muze: { label: 'Müze', renk: Palette.menekse },
  vapur: { label: 'Vapur', renk: Palette.kobalt },
  ulasim: { label: 'Ulaşım', renk: Palette.uyari },
  acil: { label: 'Acil', renk: Palette.kapali },
  bilgi: { label: 'Bilgi', renk: Palette.kobaltOrta },
  mekan: { label: 'Mekan', renk: Palette.acik },
};

// ═══ Turkce karakter normalize ═══
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ü/g, 'u')
    .replace(/Ş/g, 's').replace(/Ç/g, 'c').replace(/Ğ/g, 'g');
}

/** Temizle ikonu — 24px stroke çarpı */
function KapatIkon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function AraEkrani() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const [sorgu, setSorgu] = useState('');
  const [aktifFiltre, setAktifFiltre] = useState<string | null>(null);

  // Supabase'den dinamik veri
  const { mekanlar, yukleniyor: mekanYukleniyor } = useMekanSaatleri();
  const { turlar, yukleniyor: bogazYukleniyor } = useBogazTurlari();
  const { kayitlar: acilKayitlar, yukleniyor: acilYukleniyor } = useAcilRehber();

  const yukleniyor = mekanYukleniyor || bogazYukleniyor || acilYukleniyor;

  // Tum verileri birlestir
  const tumVeri = useMemo(() => {
    const mekanArama = mekanlarDanArama(mekanlar);
    const bogazArama = bogazDanArama(turlar);
    const acilArama = acilDenArama(acilKayitlar);
    const sabit = sabitArama();
    return [...mekanArama, ...bogazArama, ...acilArama, ...sabit];
  }, [mekanlar, turlar, acilKayitlar]);

  const sonuclar = useMemo(() => {
    const q = normalize(sorgu.trim());

    let liste = tumVeri;

    // Kategori filtresi
    if (aktifFiltre) {
      liste = liste.filter(o => o.kategori === aktifFiltre);
    }

    // Metin aramasi
    if (q.length < 2) return aktifFiltre ? liste : [];

    return liste.filter(o => {
      const isimN = normalize(o.isim);
      const altN = normalize(o.alt);
      const etiketN = o.etiketler.map(normalize);
      return isimN.includes(q) || altN.includes(q) || etiketN.some(e => e.includes(q));
    });
  }, [sorgu, aktifFiltre, tumVeri]);

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Ara" />
      </GradyanHeader>

      {/* Arama kutusu */}
      <View style={s.searchBox}>
        <Kart style={s.searchKart}>
          <View style={[s.searchInputWrap, { backgroundColor: t.bgInput, borderColor: t.kartBorder }]}>
            <View style={s.searchIcon}><SearchIcon size={20} color={t.textMuted} /></View>
            <TextInput
              placeholder="Müze, vapur, hat, yer ara..."
              placeholderTextColor={t.textMuted}
              style={[s.searchInput, { color: t.text }]}
              value={sorgu}
              onChangeText={(text) => { setSorgu(text); if (text.length > 0 && !aktifFiltre) setAktifFiltre(null); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {sorgu.length > 0 && (
              <TouchableOpacity onPress={() => { setSorgu(''); setAktifFiltre(null); }} style={s.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <KapatIkon color={t.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Kart>
      </View>

      {/* Kategori filtreleri */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtreSatir} contentContainerStyle={s.filtreIcerik}>
        {Object.entries(KATEGORI_ETIKETLERI).map(([key, val]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setAktifFiltre(aktifFiltre === key ? null : key)}
            activeOpacity={0.8}
            style={s.filtreChip}
          >
            <Rozet renk={val.renk} dolu={aktifFiltre === key} style={s.filtreRozet}>{val.label}</Rozet>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sonuclar */}
      <ScrollView style={s.sonuclar} contentContainerStyle={{ paddingBottom: 100 }}>
        {yukleniyor && tumVeri.length === 0 && (
          <View style={s.emptyState}>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={[s.emptyText, { color: t.textSecondary, marginTop: 12 }]}>Veriler yükleniyor...</Text>
          </View>
        )}

        {!yukleniyor && sonuclar.length === 0 && sorgu.length < 2 && !aktifFiltre && (
          <View style={s.emptyState}>
            <Text style={[s.emptyTitle, { color: t.text }]}>Ne arıyorsun?</Text>
            <Text style={[s.emptyText, { color: t.textSecondary }]}>
              Müzeler, vapurlar, ulaşım hatları, acil numaralar ve daha fazlasını ara
            </Text>
            <Text style={[s.emptyText, { color: t.textMuted, fontSize: 12, marginTop: 8 }]}>
              {tumVeri.length} kayıt aramanıza hazır
            </Text>
          </View>
        )}

        {sonuclar.length === 0 && (sorgu.length >= 2 || aktifFiltre) && !yukleniyor && (
          <View style={s.emptyState}>
            <Text style={[s.emptyText, { color: t.textSecondary }]}>
              "{sorgu}" için sonuç bulunamadı
            </Text>
          </View>
        )}

        {sonuclar.length > 0 && (
          <Text style={[s.sonucSayisi, { color: t.textMuted }]}>
            {sonuclar.length} sonuç
          </Text>
        )}

        <View style={s.sonucListe}>
          {sonuclar.map(item => {
            const kat = KATEGORI_ETIKETLERI[item.kategori];
            return (
              <Kart key={item.id} onPress={item.aksiyon} style={s.sonucKart}>
                <View style={s.sonucSatir}>
                  <DurumNoktasi renk={kat.renk} />
                  <View style={s.sonucBilgi}>
                    <Text style={[s.sonucIsim, { color: t.text }]} numberOfLines={1}>{item.isim}</Text>
                    <Text style={[s.sonucAlt, { color: t.textSecondary }]} numberOfLines={1}>{item.alt}</Text>
                  </View>
                  <Rozet renk={kat.renk}>{kat.label}</Rozet>
                </View>
              </Kart>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ═══ Stiller ═══
const s = StyleSheet.create({
  container: { flex: 1 },
  searchBox: { paddingHorizontal: Space.lg, paddingTop: 14, paddingBottom: Space.sm },
  searchKart: { padding: 10 },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: Space.md,
  },
  searchIcon: { marginRight: Space.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: Font.regular },
  clearBtn: { padding: Space.xs },
  filtreSatir: { maxHeight: 44 },
  filtreIcerik: { paddingHorizontal: Space.lg, gap: Space.sm, alignItems: 'center' },
  filtreChip: { minHeight: 44, justifyContent: 'center' },
  filtreRozet: { paddingHorizontal: 14, paddingVertical: 7 },
  sonuclar: { flex: 1, paddingHorizontal: Space.lg },
  sonucSayisi: { fontFamily: Font.regular, fontSize: 12, marginTop: Space.md, marginBottom: Space.sm },
  sonucListe: { gap: 10 },
  sonucKart: { padding: 14 },
  sonucSatir: { flexDirection: 'row', alignItems: 'center', gap: Space.md, minHeight: 44 },
  sonucBilgi: { flex: 1 },
  sonucIsim: { fontFamily: Font.semibold, fontSize: 15, marginBottom: 2 },
  sonucAlt: { fontFamily: Font.regular, fontSize: 12 },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: Space.xxl, gap: Space.md },
  emptyTitle: { fontFamily: Font.bold, fontSize: 18, letterSpacing: -0.3 },
  emptyText: { fontFamily: Font.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
