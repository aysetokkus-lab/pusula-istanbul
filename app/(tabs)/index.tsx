import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import { CanliDurumOzet } from '../../components/canli-durum-panel';
import { UlasimUyariBandi } from '../../components/ulasim-uyari';
import { TrafikUyariBandi } from '../../components/trafik-uyari';
import { EtkinliklerBandi } from '../../components/etkinlikler';
import { useTema } from '../../hooks/use-tema';
import { useMekanDetay } from '../../hooks/use-mekan-saatleri';
import { useGemiTakvimi } from '../../hooks/use-gemi-takvimi';
import { Palette, Typo, Space, Radius, type TemaRenkleri } from '../../constants/theme';
import { useAbonelik } from '../../hooks/use-abonelik';

interface NamazVakti { Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string; }

// ═══ Galataport Gemi Takvimi — cruisetimetables.com'dan otomatik cekilir ═══

const GUNLER_TR = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const AYLAR_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const NAMAZ_ETIKETLERI = [
  { key: 'Fajr' as keyof NamazVakti, label: 'İmsak' },
  { key: 'Sunrise' as keyof NamazVakti, label: 'Güneş' },
  { key: 'Dhuhr' as keyof NamazVakti, label: 'Öğle' },
  { key: 'Asr' as keyof NamazVakti, label: 'İkindi' },
  { key: 'Maghrib' as keyof NamazVakti, label: 'Akşam' },
  { key: 'Isha' as keyof NamazVakti, label: 'Yatsı' },
];

// ═══ Hızlı Erişim Butonları ═══
const HIZLI_ERISIM = [
  { key: 'saha', label: 'Saha', renk: Palette.istanbulMavi },
  { key: 'muzeler', label: 'Müzeler', renk: Palette.murdum },
  { key: 'vapur', label: 'Vapur', renk: '#0096C7' },
  { key: 'ulasim', label: 'Ulaşım', renk: '#48CAE4' },
];

// ═══ Yardımcı Fonksiyonlar ═══
function bugunStr() {
  const s = new Date();
  return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`;
}
function tarihFormat(iso: string) {
  const [y,m,d] = iso.split('-').map(Number);
  const t = new Date(y,m-1,d);
  return `${d} ${AYLAR_TR[m-1]} ${GUNLER_TR[t.getDay()]}`;
}
function kalanGun(iso: string) {
  const b = new Date(); b.setHours(0,0,0,0);
  const [y,m,d] = iso.split('-').map(Number);
  const f = Math.ceil((new Date(y,m-1,d).getTime()-b.getTime())/86400000);
  if (f===0) return 'Bugün'; if (f===1) return 'Yarın'; return `${f} gün sonra`;
}
function saatDk(s: string) { const [h,m] = s.split(':').map(Number); return h*60+m; }
function dkSaat(dk: number) { return `${String(Math.floor(dk/60)).padStart(2,'0')}:${String(dk%60).padStart(2,'0')}`; }
function yazMi() { const ay = new Date().getMonth(); return ay >= 3 && ay <= 8; }

function yuvarla30(dk: number) {
  const saat = Math.floor(dk / 60);
  const dakika = dk % 60;
  if (dakika === 0) return dk;
  if (dakika <= 30) return saat * 60 + 30;
  return (saat + 1) * 60;
}

// ═══ Sultanahmet Camii — Admin panelden gelen ziyaret pencereleri ═══
interface ZiyaretPencere { etiket: string; acilis: string; kapanis: string; }
interface SultanahmetEkstra { pencereler: ZiyaretPencere[]; cuma_pencereler: ZiyaretPencere[]; }

function sultanahmetPencereleriniAl(mekan: any, cumaGunu: boolean): ZiyaretPencere[] {
  if (!mekan?.ekstra) return [];
  try {
    const ekstra: SultanahmetEkstra = typeof mekan.ekstra === 'string' ? JSON.parse(mekan.ekstra) : mekan.ekstra;
    return cumaGunu ? (ekstra.cuma_pencereler || []) : (ekstra.pencereler || []);
  } catch {
    return [];
  }
}

function sultanahmetDurum(mekan: any, simdiDk: number, cumaGunu: boolean) {
  if (!mekan) return { durum: 'YUKLENIYOR', renk: '#7B8FA1', mesaj: 'Yükleniyor...' };

  const pencereler = sultanahmetPencereleriniAl(mekan, cumaGunu);
  if (pencereler.length === 0) return { durum: 'BİLGİ YOK', renk: '#7B8FA1', mesaj: 'Ziyaret saatleri henüz girilmedi' };

  for (const p of pencereler) {
    const ac = saatDk(p.acilis), kap = saatDk(p.kapanis);
    if (simdiDk >= ac && simdiDk < kap) {
      const kalan = kap - simdiDk;
      if (kalan <= 15) return { durum: 'KAPANACAK', renk: Palette.uyari, mesaj: `${kalan} dk içinde kapanıyor` };
      return { durum: 'AÇIK', renk: Palette.acik, mesaj: `${p.kapanis}'e kadar açık` };
    }
  }
  const sonraki = pencereler.find(p => saatDk(p.acilis) > simdiDk);
  if (sonraki) return { durum: 'KAPALI', renk: Palette.kapali, mesaj: `Namaz sebebiyle kapalı — ${sonraki.acilis}'de açılacak` };

  const ilkPencere = pencereler[0];
  if (ilkPencere && simdiDk < saatDk(ilkPencere.acilis)) {
    return { durum: 'KAPALI', renk: Palette.kapali, mesaj: `${ilkPencere.acilis}'de açılacak` };
  }
  return { durum: 'KAPALI', renk: Palette.kapali, mesaj: 'Bugün için kapalı' };
}

function ayasofyaDurum(simdiDk: number, cumaGunu: boolean) {
  const acilis = yazMi() ? '08:00' : '09:00';
  const kapanis = '19:30';
  const gise = '18:30';
  const acDk = saatDk(acilis), kapDk = saatDk(kapanis), giseDk = saatDk(gise);
  if (cumaGunu && simdiDk >= saatDk('12:30') && simdiDk < saatDk('14:30'))
    return { durum: 'KAPALI', renk: Palette.kapali, mesaj: "Cuma arası — 14:30'da açılacak" };
  if (simdiDk < acDk) return { durum: 'KAPALI', renk: Palette.kapali, mesaj: `${acilis}'de açılacak` };
  if (simdiDk >= kapDk) return { durum: 'KAPALI', renk: Palette.kapali, mesaj: 'Bugün için kapalı' };
  if (simdiDk >= giseDk) return { durum: 'GİŞE KAPALI', renk: Palette.uyari, mesaj: 'Gişe kapandı' };
  if (cumaGunu && simdiDk >= saatDk('12:15') && simdiDk < saatDk('12:30'))
    return { durum: 'KAPANACAK', renk: Palette.uyari, mesaj: "12:30'da Cuma arası kapanacak" };
  return { durum: 'AÇIK', renk: Palette.acik, mesaj: `Gişe ${gise}'e kadar açık` };
}

// Durum noktası bileşeni
function DurumDot({ renk }: { renk: string }) {
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: renk }} />;
}

// ═══ Grid Items for 8-Icon Layout ═══
type GridItem = { key: string; label: string; icon: any; iconText?: string };
const GRID_ITEMS: GridItem[] = [
  // Üst sıra
  { key: 'namaz', label: 'Namaz\nVakitleri', icon: require('../../assets/icons/namaz-vakitleri.svg') },
  { key: 'saraylar', label: 'Müze\nSaray\nCami', icon: require('../../assets/icons/saraylar.svg') },
  { key: 'bogaz', label: 'Boğaz Turları', icon: require('../../assets/icons/bogaz-turlari.svg') },
  { key: 'muzekart', label: 'MüzeKart\nSatış Noktaları', icon: null, iconText: 'M' },
  // Alt sıra
  { key: 'ihl', label: 'İHL\nUçuşları', icon: require('../../assets/icons/ucus.svg'), iconText: 'İHL' },
  { key: 'saw', label: 'SAW\nUçuşları', icon: require('../../assets/icons/ucus.svg'), iconText: 'SAW' },
  { key: 'havalimani', label: 'Havalimanı\nUlaşım', icon: require('../../assets/icons/havalimani-ulasim.svg') },
  { key: 'doviz', label: 'Döviz Kuru', icon: require('../../assets/icons/doviz-kuru.svg') },
];

// ═══ Ana Bileşen ═══
export default function AnaSayfa() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const { premiumMi } = useAbonelik();
  // CanliDurumOzet kendi modal'ını yönetiyor

  // Sultanahmet Camii verisi (admin panelinden yonetilir)
  const { mekan: sultanahmetMekan } = useMekanDetay('sultanahmet_camii');

  // Galataport gemi takvimi (cruisetimetables.com'dan otomatik cekilir)
  const { bugunGemi: bugunGemiData, gelecekGemiler: gelecekGemilerData, haftaninGemileri, yukleniyor: gemiYukleniyor, hata: gemiHata, yenile: gemileriYenile } = useGemiTakvimi();

  const [saat, setSaat] = useState('');
  const [tarih, setTarih] = useState('');
  const [havaDurumu, setHavaDurumu] = useState<{ derece: number; ikon: string } | null>(null);
  const [namaz, setNamaz] = useState<NamazVakti | null>(null);
  const [namazYukleniyor, setNamazYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [sonrakiVakit, setSonrakiVakit] = useState('');
  const [gemiModal, setGemiModal] = useState(false);
  const [sultanahmetModal, setSultanahmetModal] = useState(false);
  const [ayasofyaModal, setAyasofyaModal] = useState(false);
  const [namazModal, setNamazModal] = useState(false);
  const [dovizModal, setDovizModal] = useState(false);
  const [dovizRates, setDovizRates] = useState<Record<string, number> | null>(null);
  const [dovizYukleniyor, setDovizYukleniyor] = useState(false);
  const [dovizMiktar, setDovizMiktar] = useState('1');
  const [dovizKaynak, setDovizKaynak] = useState('EUR');
  const [dovizHedef, setDovizHedef] = useState('TRY');
  const [simdiDk, setSimdiDk] = useState(0);
  const [kullaniciAdi, setKullaniciAdi] = useState('');

  // Kullanıcı adını çek
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profil } = await supabase.from('profiles').select('isim').eq('id', user.id).single();
        setKullaniciAdi(profil?.isim || user.email?.split('@')[0] || '');
      }
    })();
  }, []);

  const bugun = bugunStr();
  const bugunGemi = bugunGemiData;
  const gelecekGemiler = gelecekGemilerData.slice(0, 15);
  const sonrakiGemi = gelecekGemiler[0];
  const simdi = new Date();
  const cumaGunu = simdi.getDay() === 5;
  const saatNum = simdi.getHours();
  const selamlama = saatNum < 6 ? 'İyi geceler' : saatNum < 19 ? 'İyi turlar' : 'İyi akşamlar';

  useEffect(() => {
    const guncelle = () => {
      const s = new Date();
      setSaat(s.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTarih(s.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      setSimdiDk(s.getHours() * 60 + s.getMinutes());
    };
    guncelle();
    const iv = setInterval(guncelle, 1000);
    return () => clearInterval(iv);
  }, []);

  const namazCek = async () => {
    try {
      const s = new Date();
      const gun = s.toLocaleDateString('en-GB', { timeZone: 'Europe/Istanbul' }).replace(/\//g, '-');
      const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${gun}?city=Istanbul&country=Turkey&method=13`);
      const data = await res.json();
      if (data.code === 200) {
        setNamaz(data.data.timings);
        const simdiStr = new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false });
        const vakitler = NAMAZ_ETIKETLERI.map(v => ({ label: v.label, saat: data.data.timings[v.key] }));
        const snrk = vakitler.find(v => v.saat > simdiStr);
        setSonrakiVakit(snrk ? `${snrk.label}: ${snrk.saat}` : `${vakitler[0].label}: ${vakitler[0].saat}`);
      }
    } catch {} finally { setNamazYukleniyor(false); }
  };

  const havaCek = async () => {
    try {
      const res = await fetch('https://wttr.in/Istanbul?format=j1');
      const data = await res.json();
      const current = data.current_condition?.[0];
      if (current) {
        const kod = parseInt(current.weatherCode, 10);
        let ikon = 'Açık';
        if ([113].includes(kod)) ikon = 'Açık';
        else if ([116].includes(kod)) ikon = 'Parçalı';
        else if ([119, 122].includes(kod)) ikon = 'Bulutlu';
        else if ([143, 248, 260].includes(kod)) ikon = 'Sisli';
        else if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(kod)) ikon = 'Yağmurlu';
        else if ([179, 182, 185, 227, 230, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(kod)) ikon = 'Kar';
        else if ([200, 386, 389, 392, 395].includes(kod)) ikon = 'Fırtına';
        setHavaDurumu({ derece: parseInt(current.temp_C, 10), ikon });
      }
    } catch (e) {
      console.warn('Hava durumu alınamadı:', e);
    }
  };

  const PARA_BIRIMLERI = [
    { kod: 'TRY', isim: 'Türk Lirası', sembol: '₺' },
    { kod: 'EUR', isim: 'Euro', sembol: '€' },
    { kod: 'USD', isim: 'ABD Doları', sembol: '$' },
    { kod: 'GBP', isim: 'Sterlin', sembol: '£' },
    { kod: 'CAD', isim: 'Kanada Doları', sembol: 'C$' },
    { kod: 'CHF', isim: 'İsviçre Frangı', sembol: 'Fr' },
  ];

  const dovizCek = async () => {
    setDovizYukleniyor(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const json = await res.json();
      if (json.rates) {
        setDovizRates(json.rates);
      }
    } catch {
      try {
        const r2 = await fetch('https://api.exchangerate-host.com/latest?base=USD&symbols=TRY,EUR,GBP,CAD,CHF');
        const j2 = await r2.json();
        if (j2.rates) setDovizRates({ USD: 1, ...j2.rates });
      } catch {}
    } finally { setDovizYukleniyor(false); }
  };

  const dovizHesapla = (miktar: number, kaynak: string, hedef: string): string => {
    if (!dovizRates || !dovizRates[kaynak] || !dovizRates[hedef]) return '—';
    const usdMiktar = miktar / dovizRates[kaynak];
    const sonuc = usdMiktar * dovizRates[hedef];
    return sonuc < 0.01 ? sonuc.toFixed(4) : sonuc < 10 ? sonuc.toFixed(3) : sonuc.toFixed(2);
  };

  const dovizSwap = () => {
    setDovizKaynak(dovizHedef);
    setDovizHedef(dovizKaynak);
  };

  useEffect(() => { namazCek(); havaCek(); }, []);
  // Hava durumunu her 30 dakikada bir yenile
  useEffect(() => {
    const interval = setInterval(() => { havaCek(); }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const onYenile = async () => { setYenileniyor(true); await Promise.all([namazCek(), havaCek()]); setYenileniyor(false); };

  const sahDurum = sultanahmetDurum(sultanahmetMekan, simdiDk, cumaGunu);
  const ayaDurum = ayasofyaDurum(simdiDk, cumaGunu);
  const sultPencereler = sultanahmetPencereleriniAl(sultanahmetMekan, cumaGunu);

  return (
    <ScrollView style={[styles(t).container]} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={onYenile} tintColor={t.primary} />}>

      {/* ═══ 1. GRADIENT HEADER ═══ */}
      <LinearGradient
        colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles(t).headerWrapper, { paddingTop: insets.top }]}
      >
        {/* Glossy highlight */}
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles(t).bandGloss}
        />
        <View style={styles(t).headerContent}>
          <View style={styles(t).logoRow}>
            <Text style={styles(t).logoPusula}>PUSULA</Text>
            <Image
              source={require('../../assets/icons/logo.svg')}
              style={styles(t).logoImage}
              contentFit="contain"
            />
            <Text style={styles(t).logoIstanbul}>İSTANBUL</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ═══ 2. CLOCK/DATE + GREETING STRIP ═══ */}
      <View style={styles(t).whiteSeparator} />
      <LinearGradient
        colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles(t).greetingStrip}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles(t).bandGloss}
        />
        <View style={styles(t).greetingLeft}>
          <Text style={styles(t).clockText}>{saat}</Text>
          <Text style={styles(t).dateText}>{tarih.split(',')[0]}</Text>
        </View>
        <View style={styles(t).greetingRight}>
          <Text style={styles(t).greetingName}>{kullaniciAdi ? `${selamlama}, ${kullaniciAdi}` : selamlama}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?m=ISTANBUL')} activeOpacity={0.7}>
            <Text style={styles(t).weatherText}>
              {havaDurumu ? `${havaDurumu.ikon} ${havaDurumu.derece}°C` : '...'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ═══ 3. SAHA DURUMU (Premium) ═══ */}
      <View style={styles(t).whiteSeparator} />
      {premiumMi ? (
        <CanliDurumOzet />
      ) : (
        <TouchableOpacity onPress={() => router.push('/abone-ol')} activeOpacity={0.7}>
          <LinearGradient
            colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, borderRadius: 14 }}
          >
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#FFFFFF' }}>
              Canlı Saha Durumu
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Müze kuyruk bilgileri için Premium'a yükselt
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {/* ═══ 4. SULTANAHMETCAMİİ BAND ═══ */}
      <View style={styles(t).whiteSeparator} />
      <TouchableOpacity onPress={() => setSultanahmetModal(true)} activeOpacity={0.7}>
        <LinearGradient
          colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles(t).sectionBand}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles(t).bandGloss}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles(t).sectionBandTitle}>Sultanahmet Camii</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{sahDurum.mesaj}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sahDurum.renk }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{sahDurum.durum}</Text>
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Detaylar için dokun ›</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ═══ 3. 8-ICON GRID (4x2) ═══ */}
      <View style={styles(t).gridSection}>
        <View style={styles(t).iconGrid}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles(t).iconGridItem}
              activeOpacity={0.7}
              onPress={() => {
                switch (item.key) {
                  case 'saraylar':
                    router.push({ pathname: '/(tabs)/muzeler', params: { kat: '0' } });
                    break;
                  case 'bogaz':
                    router.push('/(tabs)/bogaz');
                    break;
                  case 'havalimani':
                    router.push('/(tabs)/ulasim');
                    break;
                  case 'muzekart':
                    router.push('/(tabs)/muzeKart');
                    break;
                  case 'ihl':
                    WebBrowser.openBrowserAsync('https://www.istairport.com/ucuslar/ucus-bilgileri/gelen-ucuslar');
                    break;
                  case 'saw':
                    WebBrowser.openBrowserAsync('https://www.sabihagokcen.aero/yolcu-ve-ziyaretciler/yolcu-rehberi/ucus-bilgi-ekrani');
                    break;
                  case 'namaz':
                    setNamazModal(true);
                    break;
                  case 'doviz':
                    dovizCek();
                    setDovizModal(true);
                    break;
                }
              }}
            >
              <View style={styles(t).iconCircleShadow}>
                <LinearGradient
                  colors={['#48CAE4', '#0096C7', '#0077B6', '#005A8D']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles(t).iconCircle}
                >
                  {/* Glossy highlight overlay */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.6 }}
                    style={styles(t).glossOverlay}
                  />
                  {item.icon && item.iconText ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Image
                        source={item.icon}
                        style={{ width: 26, height: 26, marginBottom: 2 }}
                        contentFit="contain"
                      />
                      <Text
                        style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 }}
                        numberOfLines={1}
                      >
                        {item.iconText}
                      </Text>
                    </View>
                  ) : item.icon ? (
                    <Image
                      source={item.icon}
                      style={styles(t).iconSvg}
                      contentFit="contain"
                    />
                  ) : (
                    <Text
                      style={[
                        styles(t).muzeKartText,
                        (item.iconText || 'M').length > 1 && { fontSize: 18, letterSpacing: 0.5 },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {item.iconText || 'M'}
                    </Text>
                  )}
                </LinearGradient>
              </View>
              <Text style={[styles(t).iconLabel, { color: t.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ═══ 4. BUGÜNKÜ GEMİ LİSTESİ ═══ */}
      <View style={styles(t).whiteSeparator} />
      <LinearGradient
        colors={['#0077B6', '#0096C7', '#00A8E8', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles(t).bandHeader}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles(t).bandGloss}
        />
        <Text style={styles(t).bandTitle}>Galataport — Haftalık Gemi Takvimi</Text>
        <TouchableOpacity onPress={() => setGemiModal(true)}>
          <Text style={styles(t).viewAllText}>Tüm Liste</Text>
        </TouchableOpacity>
      </LinearGradient>
      {gemiYukleniyor ? (
        <View style={[styles(t).placeholderSection, { backgroundColor: t.bgSecondary }]}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={[styles(t).placeholderText, { color: t.textMuted, marginTop: 4 }]}>Gemi takvimi yükleniyor...</Text>
        </View>
      ) : haftaninGemileri.length > 0 ? (
        <View>
          {haftaninGemileri.map((g, i) => {
            const bugunMu = g.tarih === bugun;
            return (
              <TouchableOpacity
                key={`hafta-${g.tarih}-${i}`}
                onPress={() => setGemiModal(true)}
                style={[styles(t).haftaGemiSatir, { backgroundColor: bugunMu ? `${Palette.istanbulMavi}10` : t.bgCard, borderLeftColor: bugunMu ? Palette.istanbulMavi : t.divider }]}
                activeOpacity={0.7}>
                <View style={styles(t).haftaGemiTarih}>
                  <Text style={[styles(t).haftaGemiGun, { color: bugunMu ? Palette.istanbulMavi : t.text }]}>{g.tarih.split('-')[2]}</Text>
                  <Text style={[styles(t).haftaGemiAy, { color: t.textSecondary }]}>{AYLAR_TR[parseInt(g.tarih.split('-')[1])-1].slice(0,3)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles(t).haftaGemiIsim, { color: t.text }]}>{g.gemi}</Text>
                  <Text style={[styles(t).haftaGemiSirket, { color: t.textSecondary }]}>{g.sirket} {g.yolcu > 0 ? `· ${g.yolcu.toLocaleString('tr-TR')} yolcu` : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {g.gelisSaat ? <Text style={[styles(t).haftaGemiSaat, { color: t.text }]}>G {g.gelisSaat}</Text> : null}
                  {g.gidisSaat ? <Text style={[styles(t).haftaGemiSaat, { color: t.textMuted }]}>C {g.gidisSaat}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          <Text style={[styles(t).gemiKaynak, { color: t.textMuted }]}>cruisetimetables.com · Otomatik güncellenir</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setGemiModal(true)} style={[styles(t).placeholderSection, { backgroundColor: t.bgSecondary }]} activeOpacity={0.7}>
          <Text style={[styles(t).placeholderText, { color: t.textMuted }]}>Bu hafta gemi yok{gemiHata ? ' (veri alınamadı)' : ''}</Text>
          {gelecekGemiler.length > 0 && <Text style={[styles(t).placeholderText, { color: t.primary, fontSize: 12, marginTop: 2 }]}>Sonraki: {gelecekGemiler[0].gemi} — {tarihFormat(gelecekGemiler[0].tarih)}</Text>}
        </TouchableOpacity>
      )}

      {/* ═══ 5. ULAŞIM UYARILARI (Premium) ═══ */}
      <View style={styles(t).whiteSeparator} />
      {premiumMi ? (
        <UlasimUyariBandi t={t} />
      ) : (
        <TouchableOpacity onPress={() => router.push('/abone-ol')} activeOpacity={0.7}>
          <LinearGradient
            colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, borderRadius: 14 }}
          >
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#FFFFFF' }}>
              Ulaşım Uyarıları
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Anlık metro, tramvay arıza bildirimleri için Premium'a yükselt
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ═══ 5b. TRAFİK VE YOL DURUMU (Premium) ═══ */}
      {premiumMi && (
        <>
          <View style={styles(t).whiteSeparator} />
          <TrafikUyariBandi t={t} />
        </>
      )}

      {/* ═══ 6. YAKLAŞAN KENT ETKİNLİKLERİ (Premium) ═══ */}
      {premiumMi && (
        <>
          <View style={styles(t).whiteSeparator} />
          <EtkinliklerBandi />
        </>
      )}

      <View style={{ height: 30 }} />

      {/* ═══ GEMİ TAKVİMİ MODAL ═══ */}
      <Modal visible={gemiModal} transparent animationType="slide" onRequestClose={() => setGemiModal(false)}>
        <View style={[styles(t).modalOverlay]}>
          <View style={[styles(t).modalContent, { backgroundColor: t.bgCard }]}>
            <View style={styles(t).modalHeader}>
              <Text style={[styles(t).modalTitle, { color: t.primary }]}>Galataport Gemi Takvimi</Text>
              <Text style={[styles(t).modalSubtitle, { color: t.textSecondary }]}>Önümüzdeki gemiler ({gelecekGemiler.length}) • cruisetimetables.com</Text>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {gelecekGemiler.length === 0 ? (
                <View style={styles(t).emptyBox}>
                  <Text style={[styles(t).emptyText, { color: t.textMuted }]}>{gemiHata ? `Veri alınamadı: ${gemiHata}` : gemiYukleniyor ? 'Yükleniyor...' : 'Yaklaşan gemi yok'}</Text>
                </View>
              ) : (
                gelecekGemiler.map((g, i) => {
                  const bm = g.tarih === bugun;
                  return (
                    <View key={`${g.tarih}-${i}`} style={[styles(t).shipListItem, { backgroundColor: t.bgSecondary, borderLeftColor: bm ? Palette.kapali : t.divider }]}>
                      <View style={styles(t).shipDateBox}>
                        <Text style={[styles(t).shipDay, { color: bm ? Palette.kapali : t.text }]}>{g.tarih.split('-')[2]}</Text>
                        <Text style={[styles(t).shipMonth, { color: t.textSecondary }]}>{AYLAR_TR[parseInt(g.tarih.split('-')[1])-1].slice(0,3)}</Text>
                        <Text style={[styles(t).shipRemaining, { color: bm ? Palette.kapali : Palette.acik }]}>{kalanGun(g.tarih)}</Text>
                      </View>
                      <View style={styles(t).shipInfo}>
                        <Text style={[styles(t).shipName, { color: t.text }]}>{g.gemi}</Text>
                        <Text style={[styles(t).shipCompany, { color: t.primary }]}>{g.sirket}</Text>
                        <View style={styles(t).shipDetailsRow}>
                          <Text style={[styles(t).shipDetailItem, { color: t.textSecondary }]}>Yolcu: {g.yolcu.toLocaleString('tr-TR')}</Text>
                          {g.gelisSaat ? <Text style={[styles(t).shipDetailItem, { color: t.textSecondary }]}>Geliş: {g.gelisSaat}</Text> : null}
                          {g.gidisSaat ? <Text style={[styles(t).shipDetailItem, { color: t.textSecondary }]}>Gidiş: {g.gidisSaat}</Text> : null}
                        </View>
                        <Text style={[styles(t).shipDate, { color: t.textMuted }]}>{tarihFormat(g.tarih)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
            <Text style={[styles(t).sourceText, { color: t.textMuted }]}>Kaynak: cruisetimetables.com • Otomatik güncellenir</Text>
            <TouchableOpacity style={[styles(t).closeButton, { backgroundColor: t.primary }]} onPress={() => setGemiModal(false)}>
              <Text style={styles(t).closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ SULTANAHMET MODAL ═══ */}
      <Modal visible={sultanahmetModal} transparent animationType="slide" onRequestClose={() => setSultanahmetModal(false)}>
        <View style={[styles(t).modalOverlay]}>
          <View style={[styles(t).modalContent, { backgroundColor: t.bgCard }]}>
            <View style={styles(t).modalHeader}>
              <Text style={[styles(t).modalTitle, { color: t.primary }]}>Sultanahmet Camii</Text>
            </View>
            <View style={[styles(t).statusBand, { backgroundColor: sahDurum.renk + '18', borderLeftColor: sahDurum.renk }]}>
              <Text style={[styles(t).statusBandText, { color: sahDurum.renk }]}>
                {sahDurum.durum} — {sahDurum.mesaj}
              </Text>
            </View>
            {cumaGunu && <View style={[styles(t).warningBox, { backgroundColor: Palette.altin + '12' }]}>
              <Text style={[styles(t).warningText, { color: Palette.altin }]}>Cuma günü: Sabah kapalı, 14:30'da açılır</Text>
            </View>}
            <ScrollView style={{ maxHeight: 380 }}>
              {sultPencereler.length > 0 && <View style={styles(t).windowSection}>
                <Text style={[styles(t).windowTitle, { color: t.primary }]}>
                  {cumaGunu ? 'Cuma Ziyaret Pencereleri' : 'Bugünün Ziyaret Pencereleri'}
                </Text>
                {sultPencereler.map((p, i) => {
                  const ac = saatDk(p.acilis), kap = saatDk(p.kapanis);
                  const aktif = simdiDk >= ac && simdiDk < kap, gecti = simdiDk >= kap;
                  const sure = kap - ac, saatS = Math.floor(sure/60), dkS = sure % 60;
                  return (
                    <View key={i} style={[styles(t).windowCard, { backgroundColor: t.bgSecondary, borderLeftColor: aktif ? Palette.acik : gecti ? t.divider : t.primary }, gecti && { opacity: 0.5 }]}>
                      <View>
                        <Text style={[styles(t).windowLabel, { color: t.primary }]}>{p.etiket}</Text>
                        <Text style={[styles(t).windowTimes, { color: t.text }]}>{p.acilis} — {p.kapanis}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles(t).windowDuration, { color: t.textSecondary }]}>{saatS > 0 ? `${saatS}s `:''}{dkS > 0 ? `${dkS}dk`:''}</Text>
                        {aktif && <Text style={[styles(t).badge, { color: Palette.acik, backgroundColor: Palette.acik + '20' }]}>ŞU AN</Text>}
                        {gecti && <Text style={[styles(t).badgeGray, { color: t.textMuted }]}>GEÇTİ</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>}
              {sultPencereler.length === 0 && <View style={[styles(t).infoBox, { backgroundColor: t.bgSecondary }]}>
                <Text style={[styles(t).infoTitle, { color: Palette.uyari }]}>Ziyaret pencereleri henüz girilmedi</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>Ziyaret pencereleri henüz güncellenmedi.</Text>
              </View>}
              <View style={[styles(t).infoBox, { backgroundColor: t.bgSecondary }]}>
                <Text style={[styles(t).infoTitle, { color: t.primary }]}>Genel Bilgi</Text>
                <Text style={[styles(t).infoText, { color: t.text }]}>Kapanış: {sultanahmetMekan?.kapanis || '—'}</Text>
                {sultanahmetMekan?.ozel_not && <Text style={[styles(t).infoText, { color: t.text }]}>{sultanahmetMekan.ozel_not}</Text>}
              </View>
              <View style={[styles(t).infoBox, { backgroundColor: t.bgSecondary }]}>
                <Text style={[styles(t).infoTitle, { color: t.primary }]}>Ziyaret Kuralları</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>Giriş ücretsiz</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>Örtünme zorunlu (emanet elbise kabini var)</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>Bebek arabası giremez</Text>
              </View>
            </ScrollView>
            <Text style={[styles(t).sourceText, { color: t.textMuted }]}>Kaynak: sultanahmetcamii.org</Text>
            <TouchableOpacity style={[styles(t).closeButton, { backgroundColor: t.primary }]} onPress={() => setSultanahmetModal(false)}>
              <Text style={styles(t).closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ AYASOFYA MODAL ═══ */}
      <Modal visible={ayasofyaModal} transparent animationType="slide" onRequestClose={() => setAyasofyaModal(false)}>
        <View style={[styles(t).modalOverlay]}>
          <View style={[styles(t).modalContent, { backgroundColor: t.bgCard }]}>
            <View style={styles(t).modalHeader}>
              <Text style={[styles(t).modalTitle, { color: t.primary }]}>Ayasofya Camii — Galeri Katı</Text>
              <Text style={[styles(t).modalSubtitle, { color: t.textSecondary }]}>Turist ziyareti (üst kat)</Text>
            </View>
            <View style={[styles(t).statusBand, { backgroundColor: ayaDurum.renk + '18', borderLeftColor: ayaDurum.renk }]}>
              <Text style={[styles(t).statusBandText, { color: ayaDurum.renk }]}>
                {ayaDurum.durum} — {ayaDurum.mesaj}
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={[styles(t).infoBox, { backgroundColor: t.bgSecondary }]}>
                <Text style={[styles(t).infoTitle, { color: t.primary }]}>Mevsimsel Saatler</Text>
                <View style={styles(t).seasonRow}>
                  <Text style={[styles(t).seasonLabel, { color: yazMi() ? t.text : t.textMuted }]}>Yaz (1 Nis - 30 Eyl)</Text>
                  <Text style={[styles(t).seasonTime, { color: yazMi() ? t.text : t.textMuted, fontWeight: yazMi() ? '700' : '400' }]}>08:00 – 19:30</Text>
                </View>
                <View style={styles(t).seasonRow}>
                  <Text style={[styles(t).seasonLabel, { color: !yazMi() ? t.text : t.textMuted }]}>Kış (1 Eki - 31 Mar)</Text>
                  <Text style={[styles(t).seasonTime, { color: !yazMi() ? t.text : t.textMuted, fontWeight: !yazMi() ? '700' : '400' }]}>09:00 – 19:30</Text>
                </View>
                <View style={[styles(t).seasonRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: t.divider, paddingTop: 8 }]}>
                  <Text style={[styles(t).seasonLabel, { color: t.textSecondary }]}>Gişe kapanış</Text>
                  <Text style={[styles(t).seasonTime, { color: t.textSecondary }]}>18:30</Text>
                </View>
              </View>
              <View style={[styles(t).warningBox, { backgroundColor: Palette.altin + '12' }]}>
                <Text style={[styles(t).warningText, { color: Palette.altin }]}>Cuma günleri 12:30 – 14:30 arası kapalı</Text>
              </View>
              <View style={[styles(t).infoBox, { backgroundColor: t.bgSecondary }]}>
                <Text style={[styles(t).infoTitle, { color: t.primary }]}>Giriş Ücreti (Galeri Katı)</Text>
                <View style={styles(t).priceRow}>
                  <Text style={[styles(t).priceLabel, { color: t.textSecondary }]}>Yabancı</Text>
                  <Text style={[styles(t).priceValue, { color: t.text }]}>25 €</Text>
                </View>
                <View style={styles(t).priceRow}>
                  <Text style={[styles(t).priceLabel, { color: t.textSecondary }]}>TC Vatandaşı</Text>
                  <Text style={[styles(t).priceValue, { color: t.text }]}>800 ₺</Text>
                </View>
                <View style={styles(t).priceRow}>
                  <Text style={[styles(t).priceLabel, { color: t.textSecondary }]}>MüzeKart</Text>
                  <Text style={[styles(t).priceValue, { color: t.text }]}>425 ₺</Text>
                </View>
              </View>
              <View style={[styles(t).infoBox, { backgroundColor: t.bgSecondary }]}>
                <Text style={[styles(t).infoTitle, { color: t.primary }]}>Önemli Bilgiler</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>• Zemin kat = cami (ücretsiz, sadece ibadet)</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>• Üst kat = galeri (ücretli, turist girişi)</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>• Örtünme zorunlu</Text>
                <Text style={[styles(t).infoText, { color: t.textSecondary }]}>Bilet: dexxmuseums.com</Text>
              </View>
            </ScrollView>
            <Text style={[styles(t).sourceText, { color: t.textMuted }]}>Güncelleme: Mart 2026</Text>
            <TouchableOpacity style={[styles(t).closeButton, { backgroundColor: t.primary }]} onPress={() => setAyasofyaModal(false)}>
              <Text style={styles(t).closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ NAMAZ VAKİTLERİ MODAL ═══ */}
      <Modal visible={namazModal} transparent animationType="slide" onRequestClose={() => setNamazModal(false)}>
        <View style={styles(t).modalOverlay}>
          <View style={[styles(t).modalContent, { backgroundColor: t.modalBg }]}>
            <Text style={[styles(t).modalTitle, { color: t.text }]}>Namaz Vakitleri</Text>
            <Text style={[styles(t).modalSubtitle, { color: t.textSecondary }]}>İstanbul · {tarih}</Text>
            {namaz ? (
              <View style={{ marginTop: 12 }}>
                {NAMAZ_ETIKETLERI.map((v) => {
                  const vakit = namaz[v.key]?.slice(0, 5) || '--:--';
                  const aktif = sonrakiVakit === v.label;
                  return (
                    <View key={v.key} style={[
                      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.divider },
                      aktif && { backgroundColor: Palette.istanbulMavi + '12', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 10, borderBottomWidth: 0 },
                    ]}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: aktif ? Palette.istanbulMavi : t.textMuted, marginRight: 12 }} />
                      <Text style={[{ flex: 1, fontSize: 16, fontWeight: aktif ? '700' : '500' }, { color: aktif ? Palette.istanbulMavi : t.text }]}>{v.label}</Text>
                      <Text style={[{ fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] as any }, { color: aktif ? Palette.istanbulMavi : t.text }]}>{vakit}</Text>
                      {aktif && <Text style={{ marginLeft: 8, fontSize: 11, color: Palette.istanbulMavi, fontWeight: '600' }}>SONRAKİ</Text>}
                    </View>
                  );
                })}
              </View>
            ) : (
              <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 30 }} />
            )}
            <Text style={[styles(t).sourceText, { color: t.textMuted }]}>Kaynak: aladhan.com</Text>
            <TouchableOpacity style={[styles(t).closeButton, { backgroundColor: t.primary }]} onPress={() => setNamazModal(false)}>
              <Text style={styles(t).closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ DÖVİZ ÇEVİRİCİ MODAL ═══ */}
      <Modal visible={dovizModal} transparent animationType="slide" onRequestClose={() => setDovizModal(false)}>
        <View style={styles(t).modalOverlay}>
          <View style={[styles(t).modalContent, { backgroundColor: t.modalBg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles(t).modalTitle, { color: t.text }]}>Döviz Çevirici</Text>

              {dovizYukleniyor ? (
                <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 30 }} />
              ) : dovizRates ? (
                <View>
                  {/* ── Çevirici Bölümü ── */}
                  <View style={{ backgroundColor: t.bgSecondary, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    {/* Miktar girişi */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <TextInput
                        style={{ flex: 1, fontSize: 28, fontWeight: '800', color: t.text, padding: 8, borderBottomWidth: 2, borderBottomColor: Palette.istanbulMavi, fontVariant: ['tabular-nums'] as any }}
                        value={dovizMiktar}
                        onChangeText={(txt) => setDovizMiktar(txt.replace(/[^0-9.,]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="1"
                        placeholderTextColor={t.textMuted}
                      />
                    </View>

                    {/* Kaynak para birimi seçici */}
                    <Text style={{ fontSize: 11, color: t.textSecondary, fontWeight: '600', marginBottom: 6 }}>KAYNAK</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {PARA_BIRIMLERI.map(p => (
                          <TouchableOpacity
                            key={`k_${p.kod}`}
                            onPress={() => { if (p.kod === dovizHedef) dovizSwap(); else setDovizKaynak(p.kod); }}
                            style={{
                              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
                              borderRadius: 20, backgroundColor: dovizKaynak === p.kod ? Palette.istanbulMavi : t.bgCard,
                              borderWidth: 1, borderColor: dovizKaynak === p.kod ? Palette.istanbulMavi : t.divider,
                            }}
                          >
                            <Text style={{ fontSize: 14, marginRight: 4, fontWeight: '700', color: '#64748B' }}>{p.kod}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: dovizKaynak === p.kod ? '#fff' : t.text }}>{p.kod}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Swap butonu */}
                    <TouchableOpacity
                      onPress={dovizSwap}
                      style={{ alignSelf: 'center', backgroundColor: Palette.istanbulMavi, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: 4 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>⇅</Text>
                    </TouchableOpacity>

                    {/* Hedef para birimi seçici */}
                    <Text style={{ fontSize: 11, color: t.textSecondary, fontWeight: '600', marginBottom: 6, marginTop: 8 }}>HEDEF</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {PARA_BIRIMLERI.map(p => (
                          <TouchableOpacity
                            key={`h_${p.kod}`}
                            onPress={() => { if (p.kod === dovizKaynak) dovizSwap(); else setDovizHedef(p.kod); }}
                            style={{
                              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
                              borderRadius: 20, backgroundColor: dovizHedef === p.kod ? Palette.murdum : t.bgCard,
                              borderWidth: 1, borderColor: dovizHedef === p.kod ? Palette.murdum : t.divider,
                            }}
                          >
                            <Text style={{ fontSize: 14, marginRight: 4, fontWeight: '700', color: '#64748B' }}>{p.kod}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: dovizHedef === p.kod ? '#fff' : t.text }}>{p.kod}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Sonuç */}
                    <View style={{ backgroundColor: t.bgCard, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: t.divider }}>
                      <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 4 }}>
                        {dovizMiktar || '1'} {dovizKaynak} =
                      </Text>
                      <Text style={{ fontSize: 32, fontWeight: '800', color: Palette.murdum, fontVariant: ['tabular-nums'] as any }}>
                        {dovizHesapla(parseFloat(dovizMiktar.replace(',', '.')) || 1, dovizKaynak, dovizHedef)} {PARA_BIRIMLERI.find(p => p.kod === dovizHedef)?.sembol}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                        1 {dovizKaynak} = {dovizHesapla(1, dovizKaynak, dovizHedef)} {dovizHedef}
                      </Text>
                    </View>
                  </View>

                  {/* ── Güncel Kurlar Tablosu (TL bazlı) ── */}
                  {PARA_BIRIMLERI.filter(p => p.kod !== 'TRY').map(p => (
                    <TouchableOpacity
                      key={`tablo_${p.kod}`}
                      onPress={() => { setDovizKaynak(p.kod); setDovizHedef('TRY'); setDovizMiktar('1'); }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.divider }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 10, fontWeight: '700', color: '#64748B' }}>{p.kod}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{p.kod}</Text>
                        <Text style={{ fontSize: 11, color: t.textSecondary }}>{p.isim}</Text>
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: Palette.istanbulMavi, fontVariant: ['tabular-nums'] as any }}>
                        {dovizHesapla(1, p.kod, 'TRY')} ₺
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Text style={{ fontSize: 18, marginBottom: 10, color: '#94A3B8', fontWeight: '700' }}>!</Text>
                  <Text style={{ color: t.textSecondary, textAlign: 'center', fontSize: 14 }}>Kur bilgisi alınamadı.{'\n'}İnternet bağlantınızı kontrol edin.</Text>
                  <TouchableOpacity onPress={dovizCek} style={{ marginTop: 16, backgroundColor: t.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Tekrar Dene</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={[styles(t).sourceText, { color: t.textMuted }]}>Kaynak: open.er-api.com · Anlık kur</Text>
            </ScrollView>
            <TouchableOpacity style={[styles(t).closeButton, { backgroundColor: t.primary }]} onPress={() => setDovizModal(false)}>
              <Text style={styles(t).closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ SAHA BİLDİR MODAL ═══ */}
      {/* BildirModal artık CanliDurumOzet içinde */}
    </ScrollView>
  );
}

// ═══ STYLES FACTORY FUNCTION ═══
function styles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },

    // HEADER
    headerWrapper: {
      overflow: 'hidden',
      shadowColor: t.kartShadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      position: 'relative',
    },
    bandGloss: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '55%',
      zIndex: 1,
    },
    headerContent: {
      paddingVertical: 20,
      paddingHorizontal: Space.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    logoPusula: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 20,
      color: '#FFFFFF',
      letterSpacing: 4,
    },
    logoImage: {
      width: 48,
      height: 48,
    },
    logoIstanbul: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 19,
      color: '#FFFFFF',
      letterSpacing: 3,
    },

    // GREETING STRIP
    greetingStrip: {
      flexDirection: 'row',
      paddingHorizontal: Space.md,
      paddingVertical: Space.sm,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Space.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      position: 'relative',
      overflow: 'hidden',
    },
    greetingLeft: {
      alignItems: 'flex-start',
    },
    clockText: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 22,
      color: '#FFFFFF',
      letterSpacing: 0,
    },
    dateText: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 10,
      color: '#FFFFFFCC',
      marginTop: 1,
    },
    greetingRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    greetingName: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 11,
      color: '#FFFFFF',
    },
    weatherText: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
      color: '#FFFFFF',
      marginTop: 2,
    },
    wishlText: {
      fontSize: 10,
      color: '#FFFFFFCC',
      marginTop: 1,
      fontStyle: 'italic',
    },

    // BAND HEADERS
    bandHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      position: 'relative',
      overflow: 'hidden',
    },
    bandTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    reportBtn: {
      paddingHorizontal: Space.md,
      paddingVertical: 6,
      backgroundColor: '#FFFFFF',
      borderRadius: Radius.sm,
    },
    reportBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#2E7D32',
    },

    // SEPARATOR
    whiteSeparator: {
      height: 1,
      backgroundColor: t.divider,
    },

    // SECTION BAND (Sultanahmet, Etkinlikler, Ulaşım Uyarıları)
    sectionBand: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      position: 'relative',
      overflow: 'hidden',
    },
    sectionBandTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // CANLI DURUM WRAPPER
    canliDurumWrapper: {
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
    },

    // MOSQUE CARD
    mosqueCard: {
      marginHorizontal: Space.lg,
      marginVertical: Space.md,
      borderRadius: Radius.lg,
      padding: Space.lg,
      borderWidth: 1,
      borderColor: t.kartBorder,
    },
    mosqueCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.md,
    },
    mosqueCardEmoji: {
      fontSize: 32,
    },
    mosqueCardText: {
      flex: 1,
    },
    mosqueCardTitle: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 4,
    },
    mosqueCardStatus: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    mosqueCardMessage: {
      fontSize: 11,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },

    // PLACEHOLDER SECTIONS
    placeholderSection: {
      paddingHorizontal: Space.lg,
      paddingVertical: Space.lg,
      marginBottom: Space.md,
    },
    placeholderText: {
      fontSize: 13,
      textAlign: 'center',
    },

    // ICON GRID
    gridSection: {
      paddingHorizontal: Space.lg,
      paddingVertical: Space.lg,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: Space.lg,
    },
    iconGridItem: {
      width: '24%',
      alignItems: 'center',
    },
    iconCircleShadow: {
      width: 64,
      height: 64,
      borderRadius: 32,
      marginBottom: Space.md,
      shadowColor: t.kartShadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.divider,
    },
    glossOverlay: {
      position: 'absolute',
      top: 0,
      left: 4,
      right: 4,
      height: '50%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    iconSvg: {
      width: 44,
      height: 44,
    },
    muzeKartText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    iconLabel: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 14,
    },

    // SHIP CARD
    shipCard: {
      marginHorizontal: Space.lg,
      marginBottom: Space.lg,
      borderRadius: Radius.lg,
      padding: Space.lg,
      borderWidth: 1,
      borderColor: t.kartBorder,
    },
    shipCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: t.text,
      marginBottom: 4,
    },
    shipCardCompany: {
      fontSize: 12,
      marginBottom: Space.md,
    },
    shipCardDetails: {
      flexDirection: 'row' as const,
      gap: Space.md,
      flexWrap: 'wrap' as const,
    },
    shipCardDetail: {
      fontSize: 11,
    },

    // Haftalık gemi bandı
    haftaGemiSatir: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Space.lg,
      paddingVertical: 10,
      borderLeftWidth: 3,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
    },
    haftaGemiTarih: {
      width: 40,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    haftaGemiGun: {
      fontSize: 18,
      fontWeight: '700' as const,
      fontFamily: 'Poppins_700Bold',
    },
    haftaGemiAy: {
      fontSize: 10,
      fontFamily: 'Poppins_400Regular',
      marginTop: -2,
    },
    haftaGemiIsim: {
      fontSize: 14,
      fontWeight: '600' as const,
      fontFamily: 'Poppins_600SemiBold',
    },
    haftaGemiSirket: {
      fontSize: 11,
      fontFamily: 'Poppins_400Regular',
      marginTop: 1,
    },
    haftaGemiSaat: {
      fontSize: 11,
      fontFamily: 'Poppins_400Regular',
    },
    gemiKaynak: {
      fontSize: 10,
      textAlign: 'center' as const,
      paddingVertical: 6,
      fontFamily: 'Poppins_400Regular',
    },

    // MODALS
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Space.lg,
      maxHeight: '85%',
    },
    modalHeader: {
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      paddingBottom: Space.md,
      marginBottom: Space.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    modalSubtitle: {
      fontSize: 12,
      marginTop: 4,
    },
    emptyBox: {
      padding: Space.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
    },

    // SHIP LIST ITEMS
    shipListItem: {
      flexDirection: 'row',
      borderRadius: Radius.md,
      padding: Space.md,
      marginBottom: Space.md,
      borderLeftWidth: 3,
    },
    shipDateBox: {
      width: 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Space.md,
      borderRightWidth: 1,
      borderRightColor: t.divider + '50',
      paddingRight: Space.md,
    },
    shipDay: {
      fontSize: 24,
      fontWeight: '800',
    },
    shipMonth: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    shipRemaining: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 4,
    },
    shipInfo: {
      flex: 1,
    },
    shipName: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 2,
    },
    shipCompany: {
      fontSize: 12,
      marginBottom: Space.md,
    },
    shipDetailsRow: {
      flexDirection: 'row',
      gap: Space.md,
      marginBottom: 4,
    },
    shipDetailItem: {
      fontSize: 11,
    },
    shipDate: {
      fontSize: 10,
      marginTop: 2,
    },

    // STATUS BAND
    statusBand: {
      borderRadius: Radius.md,
      padding: Space.md,
      marginBottom: Space.md,
      borderLeftWidth: 4,
    },
    statusBandText: {
      fontSize: 14,
      fontWeight: '700',
    },

    // WARNING BOX
    warningBox: {
      borderRadius: Radius.sm,
      padding: Space.md,
      marginBottom: Space.md,
      borderLeftWidth: 3,
      borderLeftColor: Palette.altin,
    },
    warningText: {
      fontSize: 12,
      fontWeight: '600',
    },

    // WINDOW SECTION
    windowSection: {
      marginBottom: Space.md,
    },
    windowTitle: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: Space.md,
    },
    windowCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: Radius.md,
      padding: Space.md,
      marginBottom: Space.sm,
      borderLeftWidth: 3,
    },
    windowLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    windowTimes: {
      fontSize: 16,
      fontWeight: '700',
    },
    windowDuration: {
      fontSize: 12,
      marginBottom: 4,
    },

    // INFO BOX
    infoBox: {
      borderRadius: Radius.md,
      padding: Space.md,
      marginBottom: Space.md,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: Space.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Space.sm,
    },
    infoEmoji: {
      fontSize: 16,
      marginRight: Space.md,
    },
    infoText: {
      fontSize: 12,
      marginBottom: 5,
      lineHeight: 18,
    },
    infoNote: {
      fontSize: 11,
      marginTop: Space.md,
      fontStyle: 'italic',
    },

    // SEASON ROW
    seasonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Space.sm,
      paddingVertical: 4,
    },
    seasonLabel: {
      fontSize: 12,
    },
    seasonTime: {
      fontSize: 13,
    },

    // PRICE ROW
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Space.md,
    },
    priceLabel: {
      fontSize: 13,
    },
    priceValue: {
      fontSize: 16,
      fontWeight: '700',
    },

    // BADGE
    badge: {
      fontSize: 10,
      fontWeight: '800',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      overflow: 'hidden',
    },
    badgeGray: {
      fontSize: 10,
      fontWeight: '700',
    },

    // CLOSE BUTTON
    closeButton: {
      borderRadius: Radius.md,
      padding: Space.md,
      alignItems: 'center',
      marginTop: Space.md,
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    // SOURCE TEXT
    sourceText: {
      fontSize: 11,
      textAlign: 'right',
      marginTop: Space.md,
      marginBottom: Space.md,
    },

    // VIEW ALL LINK
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
