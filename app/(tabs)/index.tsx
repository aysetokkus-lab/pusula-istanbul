// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Eski gradyan bant + whiteSeparator mimarisi yerine GradyanHeader + 14px boşluklu Kart'lar.
// Tüm hook'lar, modallar, Linking/router hedefleri ve metinler birebir korundu.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import { CanliDurumOzet } from '../../components/canli-durum-panel';
import { GenelDuyuruPanel } from '../../components/genel-duyuru-panel';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { SahaYonetim } from '../../components/yetkili/saha-yonetim';
import { EtkinlikYonetim } from '../../components/yetkili/etkinlik-yonetim';
import { GuncellemeBandi } from '../../components/guncelleme-bandi';
import { BellIcon, SearchIcon } from '../../components/tab-icons';
// 4 Eyl 2026: uygulama içi Bildirimler — zil + okunmamış rozeti
import { useBildirimOkunmamis } from '../../hooks/use-bildirim-gecmisi';
import { PinliMesajBandi } from '../../components/pinli-mesaj-bandi';
import { AjandaKarti } from '../../components/ajanda-karti';
import { TelefonKarti } from '../../components/telefon-karti';
import { UlasimUyariBandi } from '../../components/ulasim-uyari';
import { TrafikUyariBandi } from '../../components/trafik-uyari';
import { EtkinliklerBandi } from '../../components/etkinlikler';
import { useTema } from '../../hooks/use-tema';
import { useMekanDetay } from '../../hooks/use-mekan-saatleri';
import { useGemiTakvimi } from '../../hooks/use-gemi-takvimi';
import { Palette, Font, Radius } from '../../constants/theme';
import { BirincilButon, BolumBaslik, BosDurum, DurumNoktasi, GradyanHeader, IkonKaro, Kart, Kicker, ModalKapak, Rozet } from '../../components/ui/pusula-ui';

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
  if (!mekan) return { durum: 'YUKLENIYOR', renk: Palette.bilgi, mesaj: 'Yükleniyor...' };

  const pencereler = sultanahmetPencereleriniAl(mekan, cumaGunu);
  if (pencereler.length === 0) return { durum: 'BİLGİ YOK', renk: Palette.bilgi, mesaj: 'Ziyaret saatleri henüz girilmedi' };

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

// ═══ 8'li ızgara öğeleri (ikonlar ve hedefler değişmedi) ═══
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
  // CanliDurumOzet kendi modal'ını yönetiyor

  // Sultanahmet Camii verisi (admin panelinden yonetilir)
  const { mekan: sultanahmetMekan } = useMekanDetay('sultanahmet_camii');

  // Galataport gemi takvimi (cruisetimetables.com'dan otomatik cekilir)
  // v1.1.0: ana ekranda sadece bugunkuler, gelecek gunler modal'da
  const { bugunGemileri, gelecekGunlerGemileri, gelecekGemiler, yukleniyor: gemiYukleniyor, hata: gemiHata, yenile: gemileriYenile } = useGemiTakvimi();

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
  const { sayi: okunmamisBildirim } = useBildirimOkunmamis();   // 4 Eyl 2026: zil rozeti

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
  // bugunGemi/gelecekGemiler/sonrakiGemi olu kodlar kaldirildi (v1.1.0)
  // — bugunGemileri ve gelecekGunlerGemileri hook'tan direkt geliyor
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

  // Izgara karosu ikonu (mevcut SVG'ler; karo zemini kobalt olduğu için tileIcon rengine boyanır)
  const karoIkon = (item: GridItem) => {
    if (item.icon && item.iconText) {
      return (
        <View style={s.karoIkonMetinli}>
          <Image source={item.icon} style={s.karoIkonKucuk} contentFit="contain" tintColor={t.tileIcon} />
          <Text style={[s.karoIkonYazi, { color: t.tileIcon }]} numberOfLines={1}>{item.iconText}</Text>
        </View>
      );
    }
    if (item.icon) {
      return <Image source={item.icon} style={s.karoIkon} contentFit="contain" tintColor={t.tileIcon} />;
    }
    return (
      <Text style={[s.karoHarf, { color: t.tileIcon }]} numberOfLines={1} adjustsFontSizeToFit>
        {item.iconText || 'M'}
      </Text>
    );
  };

  const karoBas = (key: string) => {
    switch (key) {
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
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={onYenile} tintColor={t.primary} />}>

      {/* ═══ 1. GRADYAN HEADER — logo satırı + tarih/saat + selamlama + hava pill'i ═══ */}
      <GradyanHeader paddingTop={insets.top + 10}>
        {/* 4 Eyl 2026 (Ayşe): splash ile aynı marka bloğu — pusula ortada, dairesiz; "PUSULA" / "İSTANBUL" alt alta, tam ortalı.
            Arama butonu mutlak konumlu (sağ) → blok header genişliğine göre kusursuz ortada. */}
        <View style={s.logoSatir}>
          <View style={s.markaBlok}>
            <Image
              source={require('../../assets/images/splash-logo.png')}
              style={s.logoImage}
              contentFit="contain"
              accessibilityLabel="Pusula İstanbul"
            />
            <Text style={s.logoPusula}>PUSULA</Text>
            <Text style={s.logoIstanbul}>İSTANBUL</Text>
          </View>
          {/* 4 Eyl 2026: Bildirimler — sol (aramanın simetriği), okunmamış varsa kırmızı nokta */}
          <TouchableOpacity
            onPress={() => router.push('/bildirimler' as never)}
            activeOpacity={0.7}
            style={[s.araButon, s.zilButon]}
            accessibilityLabel="Bildirimler"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <BellIcon size={20} color="#FFFFFF" />
            {okunmamisBildirim > 0 ? <View style={s.zilNokta} /> : null}
          </TouchableOpacity>
          {/* Eyl 2026: "Ara" sekmesi alt bardan kalktı — arama buradan açılır */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/ara')}
            activeOpacity={0.7}
            style={s.araButon}
            accessibilityLabel="Ara"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <SearchIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={[s.tarihSaat, { color: t.headerSubtext }]}>{tarih.split(',')[0]} · {saat}</Text>
        <View style={s.selamSatir}>
          {/* 4 Eyl 2026: uzun isimler kesilmesin — 22px + gerekirse %70'e kadar küçülür */}
          <Text style={s.selamBaslik} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{kullaniciAdi ? `${selamlama}, ${kullaniciAdi}` : selamlama}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?m=ISTANBUL')} activeOpacity={0.7} style={s.havaPill}>
            <Text style={s.havaYazi}>
              {havaDurumu ? `${havaDurumu.ikon} ${havaDurumu.derece}°C` : '...'}
            </Text>
          </TouchableOpacity>
        </View>
      </GradyanHeader>

      <View style={s.govde}>
        {/* ═══ 1b. GUNCELLEME BANDI (v1.1.0) — yeni surum varsa gozukur ═══ */}
        <GuncellemeBandi />

        {/* ═══ 1c. TELEFON KARTI (Eyl 2026) — profilde telefon yoksa tek seferlik istem ═══ */}
        <TelefonKarti />

        {/* ═══ 2. SAHADAN ONEMLI (v1.1.0) — pin'li sohbet mesajlari ═══ */}
        <PinliMesajBandi />

        {/* ═══ 2b. AJANDAM (Eyl 2026) — tur takvimi + masraf pusulası kartı ═══ */}
        <AjandaKarti />

        {/* ═══ 3. SAHA DURUMU + yetkili yönetimi ═══ */}
        <View>
          <CanliDurumOzet />
          <YetkiliBolum baslik="Saha Bildirimleri" aciklama="Aktif bildirimleri kaldır, sabitle">
            <SahaYonetim />
          </YetkiliBolum>
        </View>

        {/* ═══ 3b. GENEL DUYURULAR (v1.1.0) ═══ */}
        <GenelDuyuruPanel />

        {/* ═══ 4. SULTANAHMET CAMİİ KARTI — sol accent + durum rozeti, dokununca modal ═══ */}
        <View style={s.yatay}>
          <Kart accent={sahDurum.renk} onPress={() => setSultanahmetModal(true)}>
            <Kicker color={sahDurum.renk}>Sultanahmet Camii</Kicker>
            <View style={s.satirArasi}>
              <Text style={[s.kartBaslik, { color: t.text }]}>{sahDurum.mesaj}</Text>
              <Rozet renk={sahDurum.renk}>{sahDurum.durum}</Rozet>
            </View>
            <Text style={[s.sonuk, { color: t.textMuted }]}>Detaylar için dokun ›</Text>
          </Kart>
        </View>

        {/* ═══ 5. 8'Lİ İKON IZGARASI (4x2) ═══ */}
        <View style={[s.yatay, s.izgara]}>
          {GRID_ITEMS.map((item) => (
            <IkonKaro
              key={item.key}
              etiket={item.label.replace(/\n/g, ' ')}
              ikon={karoIkon(item)}
              onPress={() => karoBas(item.key)}
            />
          ))}
        </View>

        {/* ═══ 6. GEMİ TAKVİMİ KARTI — bugünkü gemiler; dokununca modal ═══ */}
        <View style={s.yatay}>
          <Kart>
            <BolumBaslik baslik="Galataport — Bugünkü Gemiler" renk={t.primary} sag="Tüm Liste" onSag={() => setGemiModal(true)} />
            {gemiYukleniyor ? (
              <View style={s.ortaKutu}>
                <ActivityIndicator size="small" color={t.primary} />
                <Text style={[s.ortaYazi, { color: t.textMuted, marginTop: 4 }]}>Gemi takvimi yükleniyor...</Text>
              </View>
            ) : bugunGemileri.length > 0 ? (
              <View>
                {bugunGemileri.map((g, i) => (
                  <TouchableOpacity
                    key={`bugun-${g.tarih}-${i}`}
                    onPress={() => setGemiModal(true)}
                    style={[s.gemiSatir, { borderBottomColor: t.divider }, i === bugunGemileri.length - 1 && s.sonSatir]}
                    activeOpacity={0.7}>
                    <View style={s.gemiTarih}>
                      <Text style={[s.gemiGun, { color: t.primary }]}>{g.tarih.split('-')[2]}</Text>
                      <Text style={[s.gemiAy, { color: t.textSecondary }]}>{AYLAR_TR[parseInt(g.tarih.split('-')[1])-1].slice(0,3)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.gemiIsim, { color: t.text }]}>{g.gemi}</Text>
                      <Text style={[s.gemiSirket, { color: t.textSecondary }]}>{g.sirket} {g.yolcu > 0 ? `· ${g.yolcu.toLocaleString('tr-TR')} yolcu` : ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {g.gelisSaat ? <Text style={[s.gemiSaat, { color: t.text }]}>G {g.gelisSaat}</Text> : null}
                      {g.gidisSaat ? <Text style={[s.gemiSaat, { color: t.textMuted }]}>C {g.gidisSaat}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ))}
                {gelecekGunlerGemileri.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setGemiModal(true)}
                    style={[s.gemiDahaSatir, { backgroundColor: t.bgCardAlt, borderColor: t.kartBorder }]}
                    activeOpacity={0.7}>
                    <Text style={[s.gemiDahaYazi, { color: t.primary }]}>
                      Önümüzdeki günler · {gelecekGunlerGemileri.length} gemi
                    </Text>
                    <Text style={[s.gemiDahaOk, { color: t.primary }]}>›</Text>
                  </TouchableOpacity>
                )}
                <Text style={[s.gemiKaynak, { color: t.textMuted }]}>cruisetimetables.com · Otomatik güncellenir</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setGemiModal(true)} style={s.ortaKutu} activeOpacity={0.7}>
                <Text style={[s.ortaYazi, { color: t.textMuted }]}>Bugün gemi yok{gemiHata ? ' (veri alınamadı)' : ''}</Text>
                {gelecekGunlerGemileri.length > 0 && (
                  <Text style={[s.ortaYazi, { color: t.primary, fontSize: 12, marginTop: 2 }]}>
                    Sonraki: {gelecekGunlerGemileri[0].gemi} — {tarihFormat(gelecekGunlerGemileri[0].tarih)}
                  </Text>
                )}
                {gelecekGunlerGemileri.length > 1 && (
                  <Text style={[s.ortaYazi, { color: t.textMuted, fontSize: 11, marginTop: 2 }]}>
                    ve {gelecekGunlerGemileri.length - 1} gemi daha — Tümünü gör
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </Kart>
        </View>

        {/* ═══ 7. ULAŞIM UYARILARI ═══ */}
        <UlasimUyariBandi t={t} />

        {/* ═══ 7b. TRAFİK VE YOL DURUMU ═══ */}
        <TrafikUyariBandi t={t} />

        {/* ═══ 8. YAKLAŞAN KENT ETKİNLİKLERİ + yetkili yönetimi ═══ */}
        <View>
          <EtkinliklerBandi />
          <YetkiliBolum baslik="Etkinlikler" aciklama="Kent etkinliklerini ekle, düzenle, sil">
            <EtkinlikYonetim />
          </YetkiliBolum>
        </View>
      </View>

      {/* ═══ GEMİ TAKVİMİ MODAL — bugün + ileri tarihli gemiler ═══ */}
      <Modal visible={gemiModal} transparent animationType="slide" onRequestClose={() => setGemiModal(false)}>
        <ModalKapak
          baslik="Galataport Gemi Takvimi"
          alt={`Önümüzdeki gemiler (${gelecekGemiler.length}) • cruisetimetables.com`}
          onKapat={() => setGemiModal(false)}
        >
          <ScrollView style={{ maxHeight: 420 }}>
            {gelecekGemiler.length === 0 ? (
              <BosDurum metin={gemiHata ? `Veri alınamadı: ${gemiHata}` : gemiYukleniyor ? 'Yükleniyor...' : 'Yaklaşan gemi yok'} />
            ) : (
              gelecekGemiler.map((g, i) => {
                const bm = g.tarih === bugun;
                return (
                  <View key={`${g.tarih}-${i}`} style={[s.modalSatir, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                    <View style={[s.modalSatirAccent, { backgroundColor: bm ? Palette.kapali : t.divider }]} />
                    <View style={[s.gemiModalTarih, { borderRightColor: t.divider }]}>
                      <Text style={[s.gemiModalGun, { color: bm ? Palette.kapali : t.text }]}>{g.tarih.split('-')[2]}</Text>
                      <Text style={[s.gemiModalAy, { color: t.textSecondary }]}>{AYLAR_TR[parseInt(g.tarih.split('-')[1])-1].slice(0,3)}</Text>
                      <Text style={[s.gemiModalKalan, { color: bm ? Palette.kapali : Palette.acik }]}>{kalanGun(g.tarih)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.gemiModalIsim, { color: t.text }]}>{g.gemi}</Text>
                      <Text style={[s.gemiModalSirket, { color: t.primary }]}>{g.sirket}</Text>
                      <View style={s.gemiModalDetaySatir}>
                        <Text style={[s.gemiModalDetay, { color: t.textSecondary }]}>Yolcu: {g.yolcu.toLocaleString('tr-TR')}</Text>
                        {g.gelisSaat ? <Text style={[s.gemiModalDetay, { color: t.textSecondary }]}>Geliş: {g.gelisSaat}</Text> : null}
                        {g.gidisSaat ? <Text style={[s.gemiModalDetay, { color: t.textSecondary }]}>Gidiş: {g.gidisSaat}</Text> : null}
                      </View>
                      <Text style={[s.gemiModalTarihYazi, { color: t.textMuted }]}>{tarihFormat(g.tarih)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
          <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: cruisetimetables.com • Otomatik güncellenir</Text>
        </ModalKapak>
      </Modal>

      {/* ═══ SULTANAHMET MODAL ═══ */}
      <Modal visible={sultanahmetModal} transparent animationType="slide" onRequestClose={() => setSultanahmetModal(false)}>
        <ModalKapak baslik="Sultanahmet Camii" onKapat={() => setSultanahmetModal(false)}>
          <View style={[s.durumBant, { backgroundColor: `${sahDurum.renk}22` }]}>
            <DurumNoktasi renk={sahDurum.renk} />
            <Text style={[s.durumBantYazi, { color: sahDurum.renk }]}>
              {sahDurum.durum} — {sahDurum.mesaj}
            </Text>
          </View>
          {cumaGunu && <View style={[s.uyariKutu, { backgroundColor: `${Palette.altin}22` }]}>
            <Text style={[s.uyariYazi, { color: Palette.altin }]}>Cuma günü: Sabah kapalı, 14:30'da açılır</Text>
          </View>}
          <ScrollView style={{ maxHeight: 380 }}>
            {sultPencereler.length > 0 && <View style={s.pencereBolum}>
              <Kicker color={t.primary} style={{ marginBottom: 10 }}>
                {cumaGunu ? 'Cuma Ziyaret Pencereleri' : 'Bugünün Ziyaret Pencereleri'}
              </Kicker>
              {sultPencereler.map((p, i) => {
                const ac = saatDk(p.acilis), kap = saatDk(p.kapanis);
                const aktif = simdiDk >= ac && simdiDk < kap, gecti = simdiDk >= kap;
                const sure = kap - ac, saatS = Math.floor(sure/60), dkS = sure % 60;
                return (
                  <View key={i} style={[s.modalSatir, { backgroundColor: t.bgCard, borderColor: t.kartBorder }, gecti && { opacity: 0.5 }]}>
                    <View style={[s.modalSatirAccent, { backgroundColor: aktif ? Palette.acik : gecti ? t.divider : t.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.pencereEtiket, { color: t.primary }]}>{p.etiket}</Text>
                      <Text style={[s.pencereSaat, { color: t.text }]}>{p.acilis} — {p.kapanis}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[s.pencereSure, { color: t.textSecondary }]}>{saatS > 0 ? `${saatS}s `:''}{dkS > 0 ? `${dkS}dk`:''}</Text>
                      {aktif && <Rozet renk={Palette.acik}>ŞU AN</Rozet>}
                      {gecti && <Rozet renk={t.textMuted}>GEÇTİ</Rozet>}
                    </View>
                  </View>
                );
              })}
            </View>}
            {sultPencereler.length === 0 && <View style={[s.bilgiKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
              <Text style={[s.bilgiBaslik, { color: Palette.uyari }]}>Ziyaret pencereleri henüz girilmedi</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>Ziyaret pencereleri henüz güncellenmedi.</Text>
            </View>}
            <View style={[s.bilgiKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
              <Text style={[s.bilgiBaslik, { color: t.primary }]}>Genel Bilgi</Text>
              <Text style={[s.bilgiYazi, { color: t.text }]}>Kapanış: {sultanahmetMekan?.kapanis || '—'}</Text>
              {sultanahmetMekan?.ozel_not && <Text style={[s.bilgiYazi, { color: t.text }]}>{sultanahmetMekan.ozel_not}</Text>}
            </View>
            <View style={[s.bilgiKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
              <Text style={[s.bilgiBaslik, { color: t.primary }]}>Ziyaret Kuralları</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>Giriş ücretsiz</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>Örtünme zorunlu (emanet elbise kabini var)</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>Bebek arabası giremez</Text>
            </View>
          </ScrollView>
          <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: sultanahmetcamii.org</Text>
        </ModalKapak>
      </Modal>

      {/* ═══ AYASOFYA MODAL ═══ */}
      <Modal visible={ayasofyaModal} transparent animationType="slide" onRequestClose={() => setAyasofyaModal(false)}>
        <ModalKapak baslik="Ayasofya Camii — Galeri Katı" alt="Turist ziyareti (üst kat)" onKapat={() => setAyasofyaModal(false)}>
          <View style={[s.durumBant, { backgroundColor: `${ayaDurum.renk}22` }]}>
            <DurumNoktasi renk={ayaDurum.renk} />
            <Text style={[s.durumBantYazi, { color: ayaDurum.renk }]}>
              {ayaDurum.durum} — {ayaDurum.mesaj}
            </Text>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            <View style={[s.bilgiKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
              <Text style={[s.bilgiBaslik, { color: t.primary }]}>Mevsimsel Saatler</Text>
              <View style={s.mevsimSatir}>
                <Text style={[s.mevsimEtiket, { color: yazMi() ? t.text : t.textMuted }]}>Yaz (1 Nis - 30 Eyl)</Text>
                <Text style={[yazMi() ? s.mevsimSaatKalin : s.mevsimSaat, { color: yazMi() ? t.text : t.textMuted }]}>08:00 – 19:30</Text>
              </View>
              <View style={s.mevsimSatir}>
                <Text style={[s.mevsimEtiket, { color: !yazMi() ? t.text : t.textMuted }]}>Kış (1 Eki - 31 Mar)</Text>
                <Text style={[!yazMi() ? s.mevsimSaatKalin : s.mevsimSaat, { color: !yazMi() ? t.text : t.textMuted }]}>09:00 – 19:30</Text>
              </View>
              <View style={[s.mevsimSatir, { marginTop: 6, borderTopWidth: 1, borderTopColor: t.divider, paddingTop: 8 }]}>
                <Text style={[s.mevsimEtiket, { color: t.textSecondary }]}>Gişe kapanış</Text>
                <Text style={[s.mevsimSaat, { color: t.textSecondary }]}>18:30</Text>
              </View>
            </View>
            <View style={[s.uyariKutu, { backgroundColor: `${Palette.altin}22` }]}>
              <Text style={[s.uyariYazi, { color: Palette.altin }]}>Cuma günleri 12:30 – 14:30 arası kapalı</Text>
            </View>
            <View style={[s.bilgiKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
              <Text style={[s.bilgiBaslik, { color: t.primary }]}>Giriş Ücreti (Galeri Katı)</Text>
              <View style={s.fiyatSatir}>
                <Text style={[s.fiyatEtiket, { color: t.textSecondary }]}>Yabancı</Text>
                <Text style={[s.fiyatDeger, { color: t.text }]}>25 €</Text>
              </View>
              <View style={s.fiyatSatir}>
                <Text style={[s.fiyatEtiket, { color: t.textSecondary }]}>TC Vatandaşı</Text>
                <Text style={[s.fiyatDeger, { color: t.text }]}>800 ₺</Text>
              </View>
              <View style={s.fiyatSatir}>
                <Text style={[s.fiyatEtiket, { color: t.textSecondary }]}>MüzeKart</Text>
                <Text style={[s.fiyatDeger, { color: t.text }]}>425 ₺</Text>
              </View>
            </View>
            <View style={[s.bilgiKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
              <Text style={[s.bilgiBaslik, { color: t.primary }]}>Önemli Bilgiler</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>• Zemin kat = cami (ücretsiz, sadece ibadet)</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>• Üst kat = galeri (ücretli, turist girişi)</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>• Örtünme zorunlu</Text>
              <Text style={[s.bilgiYazi, { color: t.textSecondary }]}>Bilet: dexxmuseums.com</Text>
            </View>
          </ScrollView>
          <Text style={[s.kaynak, { color: t.textMuted }]}>Güncelleme: Mart 2026</Text>
        </ModalKapak>
      </Modal>

      {/* ═══ NAMAZ VAKİTLERİ MODAL ═══ */}
      <Modal visible={namazModal} transparent animationType="slide" onRequestClose={() => setNamazModal(false)}>
        <ModalKapak baslik="Namaz Vakitleri" alt={`İstanbul · ${tarih}`} onKapat={() => setNamazModal(false)}>
          {namaz ? (
            <View style={{ marginTop: 4 }}>
              {NAMAZ_ETIKETLERI.map((v) => {
                const vakit = namaz[v.key]?.slice(0, 5) || '--:--';
                const aktif = sonrakiVakit === v.label;
                return (
                  <View key={v.key} style={[
                    s.namazSatir, { borderBottomColor: t.divider },
                    aktif && { backgroundColor: `${t.primary}22`, marginHorizontal: -12, paddingHorizontal: 12, borderRadius: Radius.sm, borderBottomWidth: 0 },
                  ]}>
                    <DurumNoktasi renk={aktif ? t.primary : t.textMuted} boyut={8} />
                    <Text style={[aktif ? s.namazEtiketAktif : s.namazEtiket, { color: aktif ? t.primary : t.text }]}>{v.label}</Text>
                    <Text style={[s.namazSaat, { color: aktif ? t.primary : t.text }]}>{vakit}</Text>
                    {aktif && <Rozet renk={t.primary} style={{ marginLeft: 8 }}>SONRAKİ</Rozet>}
                  </View>
                );
              })}
            </View>
          ) : (
            <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 30 }} />
          )}
          <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: aladhan.com</Text>
        </ModalKapak>
      </Modal>

      {/* ═══ DÖVİZ ÇEVİRİCİ MODAL ═══ */}
      <Modal visible={dovizModal} transparent animationType="slide" onRequestClose={() => setDovizModal(false)}>
        <ModalKapak baslik="Döviz Çevirici" onKapat={() => setDovizModal(false)}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {dovizYukleniyor ? (
              <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 30 }} />
            ) : dovizRates ? (
              <View>
                {/* ── Çevirici Bölümü ── */}
                <View style={[s.dovizKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
                  {/* Miktar girişi */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <TextInput
                      style={[s.dovizGiris, { color: t.text, borderBottomColor: t.primary }]}
                      value={dovizMiktar}
                      onChangeText={(txt) => setDovizMiktar(txt.replace(/[^0-9.,]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder="1"
                      placeholderTextColor={t.textMuted}
                    />
                  </View>

                  {/* Kaynak para birimi seçici */}
                  <Kicker color={t.textSecondary} style={{ marginBottom: 6 }}>KAYNAK</Kicker>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {PARA_BIRIMLERI.map(p => {
                        const secili = dovizKaynak === p.kod;
                        return (
                          <TouchableOpacity
                            key={`k_${p.kod}`}
                            onPress={() => { if (p.kod === dovizHedef) dovizSwap(); else setDovizKaynak(p.kod); }}
                            activeOpacity={0.8}
                            style={[s.dovizChip, { backgroundColor: secili ? t.primary : t.bgCardAlt, borderColor: secili ? t.primary : t.kartBorder }]}
                          >
                            <Text style={[s.dovizChipKod, { color: secili ? t.headerSubtext : t.textMuted }]}>{p.kod}</Text>
                            <Text style={[s.dovizChipYazi, { color: secili ? t.textOnPrimary : t.text }]}>{p.kod}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Swap butonu */}
                  <TouchableOpacity
                    onPress={dovizSwap}
                    activeOpacity={0.8}
                    style={[s.dovizSwap, { backgroundColor: t.primary }]}
                  >
                    <Text style={[s.dovizSwapYazi, { color: t.textOnPrimary }]}>⇅</Text>
                  </TouchableOpacity>

                  {/* Hedef para birimi seçici */}
                  <Kicker color={t.textSecondary} style={{ marginBottom: 6, marginTop: 8 }}>HEDEF</Kicker>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {PARA_BIRIMLERI.map(p => {
                        const secili = dovizHedef === p.kod;
                        return (
                          <TouchableOpacity
                            key={`h_${p.kod}`}
                            onPress={() => { if (p.kod === dovizKaynak) dovizSwap(); else setDovizHedef(p.kod); }}
                            activeOpacity={0.8}
                            style={[s.dovizChip, { backgroundColor: secili ? t.secondary : t.bgCardAlt, borderColor: secili ? t.secondary : t.kartBorder }]}
                          >
                            <Text style={[s.dovizChipKod, { color: secili ? t.headerSubtext : t.textMuted }]}>{p.kod}</Text>
                            <Text style={[s.dovizChipYazi, { color: secili ? t.textOnPrimary : t.text }]}>{p.kod}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Sonuç */}
                  <View style={[s.dovizSonuc, { backgroundColor: t.bgCardAlt, borderColor: t.kartBorder }]}>
                    <Text style={[s.dovizSonucUst, { color: t.textSecondary }]}>
                      {dovizMiktar || '1'} {dovizKaynak} =
                    </Text>
                    <Text style={[s.dovizSonucDeger, { color: t.secondary }]}>
                      {dovizHesapla(parseFloat(dovizMiktar.replace(',', '.')) || 1, dovizKaynak, dovizHedef)} {PARA_BIRIMLERI.find(p => p.kod === dovizHedef)?.sembol}
                    </Text>
                    <Text style={[s.dovizSonucAlt, { color: t.textMuted }]}>
                      1 {dovizKaynak} = {dovizHesapla(1, dovizKaynak, dovizHedef)} {dovizHedef}
                    </Text>
                  </View>
                </View>

                {/* ── Güncel Kurlar Tablosu (TL bazlı) ── */}
                {PARA_BIRIMLERI.filter(p => p.kod !== 'TRY').map(p => (
                  <TouchableOpacity
                    key={`tablo_${p.kod}`}
                    onPress={() => { setDovizKaynak(p.kod); setDovizHedef('TRY'); setDovizMiktar('1'); }}
                    activeOpacity={0.7}
                    style={[s.dovizTabloSatir, { borderBottomColor: t.divider }]}
                  >
                    <Text style={[s.dovizTabloKod, { color: t.textMuted }]}>{p.kod}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.dovizTabloIsimKalin, { color: t.text }]}>{p.kod}</Text>
                      <Text style={[s.dovizTabloIsim, { color: t.textSecondary }]}>{p.isim}</Text>
                    </View>
                    <Text style={[s.dovizTabloKur, { color: t.primary }]}>
                      {dovizHesapla(1, p.kod, 'TRY')} ₺
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={[s.dovizHataIsaret, { color: t.textMuted }]}>!</Text>
                <Text style={[s.dovizHataYazi, { color: t.textSecondary }]}>Kur bilgisi alınamadı.{'\n'}İnternet bağlantınızı kontrol edin.</Text>
                <BirincilButon baslik="Tekrar Dene" onPress={dovizCek} varyant="kobalt" style={{ marginTop: 16, alignSelf: 'center' }} />
              </View>
            )}
            <Text style={[s.kaynak, { color: t.textMuted }]}>Kaynak: open.er-api.com · Anlık kur</Text>
          </ScrollView>
        </ModalKapak>
      </Modal>

      {/* ═══ SAHA BİLDİR MODAL ═══ */}
      {/* BildirModal artık CanliDurumOzet içinde */}
    </ScrollView>
  );
}

// ═══ STİLLER — renkler inline token'la verilir (t.*), burada sadece yerleşim/tipografi ═══
const s = StyleSheet.create({
  container: { flex: 1 },
  govde: { paddingTop: 14, paddingBottom: 30, gap: 14 },
  yatay: { paddingHorizontal: 16 },

  // HEADER
  logoSatir: { alignItems: 'center', justifyContent: 'center', marginBottom: 12, minHeight: 44 },
  markaBlok: { alignItems: 'center' },
  logoImage: { width: 56, height: 61, marginBottom: 6 },   // splash-logo.png oranı 760/696
  // paddingLeft = letterSpacing: son harften sonraki boşluğu dengeler → optik olarak tam ortada
  logoPusula: { fontFamily: Font.extrabold, fontSize: 15, color: '#FFFFFF', letterSpacing: 4, paddingLeft: 4, textAlign: 'center', lineHeight: 19 },
  logoIstanbul: { fontFamily: Font.extrabold, fontSize: 15, color: '#FFFFFF', letterSpacing: 4, paddingLeft: 4, textAlign: 'center', lineHeight: 19 },
  araButon: { position: 'absolute', right: 0, top: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  zilButon: { right: undefined, left: 0 },
  zilNokta: { position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.kapali, borderWidth: 1.5, borderColor: '#FFFFFF' },
  tarihSaat: { fontFamily: Font.regular, fontSize: 13, marginBottom: 4, fontVariant: ['tabular-nums'] },
  selamSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  selamBaslik: { flex: 1, fontFamily: Font.extrabold, fontSize: 22, color: '#FFFFFF', letterSpacing: -0.4 },
  havaPill: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.seffafBeyaz20, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  havaYazi: { fontFamily: Font.bold, fontSize: 14, color: '#FFFFFF' },

  // KART İÇİ ORTAK
  satirArasi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kartBaslik: { flex: 1, fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3 },
  sonuk: { fontFamily: Font.regular, fontSize: 11 },
  ortaKutu: { alignItems: 'center', paddingVertical: 12 },
  ortaYazi: { fontFamily: Font.regular, fontSize: 13, textAlign: 'center' },

  // İKON IZGARASI
  izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  karoIkon: { width: 30, height: 30 },
  karoIkonMetinli: { alignItems: 'center', justifyContent: 'center' },
  karoIkonKucuk: { width: 22, height: 22, marginBottom: 1 },
  karoIkonYazi: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.5 },
  karoHarf: { fontFamily: Font.extrabold, fontSize: 26 },

  // GEMİ KARTI
  gemiSatir: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 8, borderBottomWidth: 1 },
  sonSatir: { borderBottomWidth: 0 },
  gemiTarih: { width: 40, alignItems: 'center', marginRight: 12 },
  gemiGun: { fontFamily: Font.extrabold, fontSize: 18 },
  gemiAy: { fontFamily: Font.regular, fontSize: 10, marginTop: -2 },
  gemiIsim: { fontFamily: Font.semibold, fontSize: 14 },
  gemiSirket: { fontFamily: Font.regular, fontSize: 11, marginTop: 1 },
  gemiSaat: { fontFamily: Font.regular, fontSize: 11, fontVariant: ['tabular-nums'] },
  gemiDahaSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingVertical: 8, paddingHorizontal: 14, marginTop: 4, borderRadius: Radius.md, borderWidth: 1 },
  gemiDahaYazi: { fontFamily: Font.semibold, fontSize: 13 },
  gemiDahaOk: { fontFamily: Font.regular, fontSize: 22, lineHeight: 22 },
  gemiKaynak: { fontFamily: Font.regular, fontSize: 10, textAlign: 'center', paddingTop: 8 },

  // MODAL SATIRLARI (gemi listesi, ziyaret pencereleri)
  modalSatir: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: 12, marginBottom: 8, minHeight: 44 },
  modalSatirAccent: { width: 4, borderRadius: 2, alignSelf: 'stretch', marginRight: 12 },
  gemiModalTarih: { width: 60, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRightWidth: 1, paddingRight: 10 },
  gemiModalGun: { fontFamily: Font.extrabold, fontSize: 22 },
  gemiModalAy: { fontFamily: Font.semibold, fontSize: 11, textTransform: 'uppercase' },
  gemiModalKalan: { fontFamily: Font.semibold, fontSize: 10, marginTop: 4, textAlign: 'center' },
  gemiModalIsim: { fontFamily: Font.bold, fontSize: 15, marginBottom: 2 },
  gemiModalSirket: { fontFamily: Font.regular, fontSize: 12, marginBottom: 8 },
  gemiModalDetaySatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  gemiModalDetay: { fontFamily: Font.regular, fontSize: 11 },
  gemiModalTarihYazi: { fontFamily: Font.regular, fontSize: 10, marginTop: 2 },

  // DURUM BANDI / UYARI / BİLGİ KUTULARI (modal içi)
  durumBant: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  durumBantYazi: { flex: 1, fontFamily: Font.bold, fontSize: 14 },
  uyariKutu: { borderRadius: Radius.sm, padding: 12, marginBottom: 12 },
  uyariYazi: { fontFamily: Font.semibold, fontSize: 12 },
  bilgiKutu: { borderRadius: Radius.md, borderWidth: 1, padding: 12, marginBottom: 12 },
  bilgiBaslik: { fontFamily: Font.bold, fontSize: 13, marginBottom: 10 },
  bilgiYazi: { fontFamily: Font.regular, fontSize: 12, marginBottom: 5, lineHeight: 18 },

  // ZİYARET PENCERELERİ
  pencereBolum: { marginBottom: 12 },
  pencereEtiket: { fontFamily: Font.semibold, fontSize: 12, marginBottom: 2 },
  pencereSaat: { fontFamily: Font.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
  pencereSure: { fontFamily: Font.regular, fontSize: 12 },

  // MEVSİM / FİYAT SATIRLARI
  mevsimSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
  mevsimEtiket: { fontFamily: Font.regular, fontSize: 12 },
  mevsimSaat: { fontFamily: Font.regular, fontSize: 13 },
  mevsimSaatKalin: { fontFamily: Font.bold, fontSize: 13 },
  fiyatSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fiyatEtiket: { fontFamily: Font.regular, fontSize: 13 },
  fiyatDeger: { fontFamily: Font.bold, fontSize: 16 },

  // NAMAZ
  namazSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 12, borderBottomWidth: 1 },
  namazEtiket: { flex: 1, fontFamily: Font.semibold, fontSize: 16 },
  namazEtiketAktif: { flex: 1, fontFamily: Font.bold, fontSize: 16 },
  namazSaat: { fontFamily: Font.bold, fontSize: 20, fontVariant: ['tabular-nums'] },

  // DÖVİZ
  dovizKutu: { borderRadius: Radius.lg, borderWidth: 1, padding: 16, marginBottom: 16 },
  dovizGiris: { flex: 1, fontFamily: Font.extrabold, fontSize: 28, padding: 8, borderBottomWidth: 2, fontVariant: ['tabular-nums'] },
  dovizChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  dovizChipKod: { fontFamily: Font.bold, fontSize: 14, marginRight: 4 },
  dovizChipYazi: { fontFamily: Font.bold, fontSize: 13 },
  dovizSwap: { alignSelf: 'center', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  dovizSwapYazi: { fontFamily: Font.extrabold, fontSize: 18 },
  dovizSonuc: { borderRadius: Radius.md, borderWidth: 1, padding: 16, alignItems: 'center' },
  dovizSonucUst: { fontFamily: Font.regular, fontSize: 13, marginBottom: 4 },
  dovizSonucDeger: { fontFamily: Font.extrabold, fontSize: 32, fontVariant: ['tabular-nums'] },
  dovizSonucAlt: { fontFamily: Font.regular, fontSize: 12, marginTop: 4 },
  dovizTabloSatir: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 12, borderBottomWidth: 1 },
  dovizTabloKod: { fontFamily: Font.bold, fontSize: 16, marginRight: 10 },
  dovizTabloIsimKalin: { fontFamily: Font.bold, fontSize: 14 },
  dovizTabloIsim: { fontFamily: Font.regular, fontSize: 11 },
  dovizTabloKur: { fontFamily: Font.extrabold, fontSize: 18, fontVariant: ['tabular-nums'] },
  dovizHataIsaret: { fontFamily: Font.bold, fontSize: 18, marginBottom: 10 },
  dovizHataYazi: { fontFamily: Font.regular, fontSize: 14, textAlign: 'center' },

  // KAYNAK
  kaynak: { fontFamily: Font.regular, fontSize: 11, textAlign: 'right', marginTop: 12 },
});
