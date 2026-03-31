import { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTema } from '../../hooks/use-tema';
import { useMekanSaatleri, type MekanSaat } from '../../hooks/use-mekan-saatleri';
import { useBogazTurlari, type BogazTuru } from '../../hooks/use-bogaz-turlari';
import { useAcilRehber, type AcilKayit } from '../../hooks/use-acil-rehber';
import { Space, Radius, Palette, type TemaRenkleri } from '../../constants/theme';

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
    const muzekart = m.muzekart === 'gecerli' ? 'Müzekart geçerli' : m.muzekart === 'gecmez' ? 'Müzekart geçmez' : '';
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
      id: 'bilgi_muzekart', isim: 'Museum Pass / Müzekart', kategori: 'bilgi',
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

const KATEGORI_ETIKETLERI: Record<string, { label: string; renk: string }> = {
  muze: { label: 'Müze', renk: '#0096C7' },
  vapur: { label: 'Vapur', renk: '#0096C7' },
  ulasim: { label: 'Ulaşım', renk: '#48CAE4' },
  acil: { label: 'Acil', renk: '#D62828' },
  bilgi: { label: 'Bilgi', renk: '#0077B6' },
  mekan: { label: 'Mekan', renk: '#0096C7' },
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

  const s = createStyles(t);

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={s.headerTitle}>Ara</Text>
      </LinearGradient>

      {/* Arama kutusu */}
      <View style={s.searchBox}>
        <View style={[s.searchInputWrap, { backgroundColor: t.bgInput, borderColor: t.kartBorder }]}>
          <Text style={s.searchIcon}>*</Text>
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
            <TouchableOpacity onPress={() => { setSorgu(''); setAktifFiltre(null); }} style={s.clearBtn}>
              <Text style={[s.clearText, { color: t.textMuted }]}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kategori filtreleri */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtreSatir} contentContainerStyle={s.filtreIcerik}>
        {Object.entries(KATEGORI_ETIKETLERI).map(([key, val]) => (
          <TouchableOpacity
            key={key}
            style={[s.filtreChip, aktifFiltre === key && { backgroundColor: val.renk }]}
            onPress={() => setAktifFiltre(aktifFiltre === key ? null : key)}
          >
            <Text style={[s.filtreText, aktifFiltre === key ? { color: '#FFF' } : { color: t.textSecondary }]}>
              {val.label}
            </Text>
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

        {sonuclar.map(item => {
          const kat = KATEGORI_ETIKETLERI[item.kategori];
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.sonucKart, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}
              onPress={item.aksiyon}
              activeOpacity={0.7}
            >
              <View style={[s.sonucDot, { backgroundColor: kat.renk }]} />
              <View style={s.sonucBilgi}>
                <Text style={[s.sonucIsim, { color: t.text }]} numberOfLines={1}>{item.isim}</Text>
                <Text style={[s.sonucAlt, { color: t.textSecondary }]} numberOfLines={1}>{item.alt}</Text>
              </View>
              <View style={[s.kategoriTag, { backgroundColor: kat.renk + '20' }]}>
                <Text style={[s.kategoriTagText, { color: kat.renk }]}>{kat.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: Space.lg, paddingBottom: 16 },
    headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#FFF', textAlign: 'center' },
    searchBox: { paddingHorizontal: Space.lg, paddingTop: Space.md, paddingBottom: Space.sm },
    searchInputWrap: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: Radius.md, borderWidth: 1,
      paddingHorizontal: Space.md,
    },
    searchIcon: { fontSize: 18, marginRight: Space.sm, color: t.textMuted },
    searchInput: { flex: 1, paddingVertical: 14, fontSize: 15 },
    clearBtn: { padding: Space.sm },
    clearText: { fontSize: 18, fontWeight: '600' },
    filtreSatir: { maxHeight: 44 },
    filtreIcerik: { paddingHorizontal: Space.lg, gap: Space.sm },
    filtreChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: Radius.full,
      backgroundColor: t.bgSecondary,
    },
    filtreText: { fontSize: 13, fontWeight: '600' },
    sonuclar: { flex: 1, paddingHorizontal: Space.lg },
    sonucSayisi: { fontSize: 12, marginTop: Space.md, marginBottom: Space.sm },
    sonucKart: {
      flexDirection: 'row', alignItems: 'center',
      padding: Space.md, marginBottom: Space.sm,
      borderRadius: Radius.md, borderWidth: 1,
    },
    sonucDot: { width: 10, height: 10, borderRadius: 5, marginRight: Space.md },
    sonucBilgi: { flex: 1 },
    sonucIsim: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    sonucAlt: { fontSize: 12 },
    kategoriTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, marginLeft: Space.sm },
    kategoriTagText: { fontSize: 10, fontWeight: '700' },
    emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: Space.xxl, gap: Space.md },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });
}
