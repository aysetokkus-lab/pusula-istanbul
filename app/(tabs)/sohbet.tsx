// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + HeaderBaslik, kendi mesaj = kobalt balon / beyaz yazı, diğerleri = kart zemini.
// Hook'lar, realtime, polling, Alert akışları, KeyboardAvoidingView/FlatList yapısı birebir korundu.
// Eyl 2026 DM: header altında Segmentler [Genel | Mesajlarım]; "Mesajlarım" konuşma listesi (hooks/use-dm.ts),
// genel sohbette isim dokunma / menü "Özel mesaj gönder" → /dm/[id]. Genel sohbet işlevleri AYNEN.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import * as ScreenCapture from 'expo-screen-capture';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Space, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, GradyanHeader, HeaderBaslik, Kart, Segmentler } from '../../components/ui/pusula-ui';
import { ChatIcon } from '../../components/tab-icons';
import { supabase } from '../../lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useKufurFiltre } from '../../hooks/use-kufur-filtre';
import { useOkunmamisMesaj } from '../../hooks/use-okunmamis-mesaj';
import { useAdmin } from '../../hooks/use-admin';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { SohbetYonetim } from '../../components/yetkili/sohbet-yonetim';
import { usePinliMesajlar } from '../../hooks/use-pinli-mesajlar';
import { useSohbetTepkileri, type TepkiTipi } from '../../hooks/use-sohbet-tepkileri';
import { MesajMenusu, TepkiSatiri, TepkiVerenlerModal, YanitAlinti, YanitSeridi, type MenuAksiyon } from '../../components/sohbet-tepkiler';
import { GorselButon, GorselOnizleme, MesajGorseli, TamEkranGorsel, gorselSec, sohbetGorselYukle, type SecilenGorsel } from '../../components/sohbet-gorsel';
import { konusmaBaslat, useDmKonusmalar, type DmKonusma } from '../../hooks/use-dm';
import { useTelefonGerekli } from '../../components/telefon-modal';

type SohbetSekme = 'genel' | 'dm';

/* ═══════════════════════════════════════════
   Tipler
   ═══════════════════════════════════════════ */
interface Mesaj {
  id: string;
  kullanici_id: string;
  kullanici_isim: string;
  mesaj: string;
  created_at: string;
  pinned?: boolean;        // v1.1.0: admin/moderator sabitleyebilir
  pinned_at?: string | null;
  pinned_by?: string | null;
  pinned_by_isim?: string | null;
  yanit_id?: string | null;   // Eyl 2026: mesaja yanıt
  gorsel_url?: string | null; // Eyl 2026: görsel paylaşımı
}

interface KullaniciBilgi {
  id: string;
  email: string;
}

/* ═══════════════════════════════════════════
   Yardımcı Fonksiyonlar
   ═══════════════════════════════════════════ */
function basHarfler(isim: string): string {
  return isim.trim().charAt(0).toUpperCase() || '?';
}

function saat(iso: string): string {
  try {
    const d = new Date(iso);
    const simdi = new Date();
    const sa = String(d.getHours()).padStart(2, '0');
    const dk = String(d.getMinutes()).padStart(2, '0');
    const saatStr = `${sa}:${dk}`;

    // Bugün mü?
    if (d.toDateString() === simdi.toDateString()) return saatStr;

    // Dün mü?
    const dun = new Date(simdi);
    dun.setDate(dun.getDate() - 1);
    if (d.toDateString() === dun.toDateString()) return `Dün ${saatStr}`;

    // Bu hafta içinde mi? (7 gün)
    const farkGun = Math.floor((simdi.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (farkGun < 7) {
      const gunler = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      return `${gunler[d.getDay()]} ${saatStr}`;
    }

    // Daha eski
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    return `${gun}.${ay} ${saatStr}`;
  } catch {
    return '';
  }
}

// Avatar rengi: isim ilk harfine göre deterministik (mantık aynı, renkler paletten)
function renkUret(isim: string): string {
  const renkler = [
    Palette.kobalt,       // ana kobalt
    Palette.kobaltAcik,   // açık kobalt
    Palette.kobaltKoyu,   // koyu kobalt
    Palette.menekse,      // menekşe
    Palette.kobaltOrta,   // orta kobalt
  ];
  const kod = isim.charCodeAt(0);
  return renkler[kod % renkler.length];
}

/* Kilit ikonu (misafir modu) — 24px stroke SVG, emoji yok */
function KilitIkon({ size = 40, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={10} width={16} height={11} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 14v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/* ═══════════════════════════════════════════
   Ana Bileşen
   ═══════════════════════════════════════════ */
export default function SohbetEkrani() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const styles = createStyles(t);
  const flatListRef = useRef<FlatList>(null);
  const { isYetkili } = useAdmin();  // admin/moderator: dogrudan mesaj silme yetkisi (v1.1.0)
  const { telefonGerekli, telefonModal } = useTelefonGerekli();  // Eyl 2026: DM için profilde telefon şart
  const { pinle, pinKaldir } = usePinliMesajlar();  // v1.1.0: sabitle/pin kaldir

  // Okunmamış mesaj badge yönetimi
  const { sohbeteGirdi, sohbettenCikti } = useOkunmamisMesaj();

  // Ekran görüntüsü engeli + okundu işaretleme — sadece sohbet ekranı aktifken
  useFocusEffect(
    useCallback(() => {
      ScreenCapture.preventScreenCaptureAsync();
      sohbeteGirdi();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
        sohbettenCikti();
      };
    }, [sohbeteGirdi, sohbettenCikti])
  );

  // Küfür filtresi
  const { filtrele, kuyruğaEkle } = useKufurFiltre();

  // Durum
  const [kullanici, setKullanici] = useState<KullaniciBilgi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);
  const [tekrarYukleniyor, setTekrarYukleniyor] = useState(false);
  const [guncelSayac, setGuncelSayac] = useState(0);
  const subscriptionRef = useRef<any>(null);

  // Eyl 2026: tepkiler + yanıt + mesaj menüsü
  const [yanitlanan, setYanitlanan] = useState<Mesaj | null>(null);
  const [secilenGorsel, setSecilenGorsel] = useState<SecilenGorsel | null>(null);  // Eyl 2026: görsel
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [tamEkranUrl, setTamEkranUrl] = useState<string | null>(null);
  const [menuMesaj, setMenuMesaj] = useState<Mesaj | null>(null);
  const [kimlerMesajId, setKimlerMesajId] = useState<string | null>(null);
  const [kullaniciIsim, setKullaniciIsim] = useState<string>('Rehber');
  const sonDokunus = useRef<{ id: string; zaman: number }>({ id: '', zaman: 0 });

  // Eyl 2026 DM: sekme + konuşma listesi
  const [sekme, setSekme] = useState<SohbetSekme>('genel');
  const { konusmalar, yukleniyor: dmYukleniyor, okunmamisSayisi: dmOkunmamis } = useDmKonusmalar();
  const mesajIdleri = useMemo(() => mesajlar.map(m => m.id), [mesajlar]);
  const { ozet: tepkiOzet, benimTepkim, tepkiVer } = useSohbetTepkileri(mesajIdleri, kullanici?.id ?? null);

  /* ─── Kullanıcı bilgisi çek ─── */
  const kullaniciBilgiCek = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setKullanici(null);
        setYukleniyor(false);
        return;
      }
      setKullanici({
        id: user.id,
        email: user.email || '',
      });
      // Tepki/yanıt için görünen ad (mesajGonder ile aynı mantık)
      const { data: p } = await supabase.from('profiles').select('isim, soyisim').eq('id', user.id).single();
      setKullaniciIsim(p && (p.isim || p.soyisim) ? `${p.isim || ''} ${p.soyisim || ''}`.trim() : (user.email || '').split('@')[0]);
    } catch (e) {
      console.warn('Kullanıcı bilgisi çekme hatası:', e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  /* ─── Mesajları yükle (son 7 gün) ─── */
  const mesajlariYukle = useCallback(async () => {
    try {
      const birHaftaOnce = new Date();
      birHaftaOnce.setDate(birHaftaOnce.getDate() - 7);

      const { data, error } = await supabase
        .from('sohbet_mesajlari')
        .select('*')
        .gte('created_at', birHaftaOnce.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMesajlar((data || []) as Mesaj[]);
    } catch (e) {
      console.warn('Mesaj yükleme hatası:', e);
    }
  }, []);

  /* ─── Realtime subscription ─── */
  const realtimeKurul = useCallback(() => {
    // Önceki subscription'ı temizle
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Yeni subscription kur
    const channel = supabase
      .channel('sohbet-mesaj-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sohbet_mesajlari',
        },
        (payload: any) => {
          const yeniMesajData = payload.new as Mesaj;
          console.log('REALTIME MESAJ GELDI:', yeniMesajData.id, yeniMesajData.mesaj?.substring(0, 30));
          // setTimeout ile UI thread'de güncelleme zorla
          setTimeout(() => {
            setMesajlar((prev) => {
              // Duplikat engelle
              if (prev.some(m => m.id === yeniMesajData.id)) return prev;
              console.log('MESAJ LISTEYE EKLENDI, toplam:', prev.length + 1);
              return [...prev, yeniMesajData];
            });
            // FlatList'i yeniden render etmeye zorla
            setGuncelSayac((c) => c + 1);
          }, 50);
        }
      )
      // v1.1.0: admin/moderator mesaj silince diger cihazlarda da anlik kaybolsun
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sohbet_mesajlari',
        },
        (payload: any) => {
          const silinen = payload.old as { id?: string };
          if (!silinen?.id) return;
          console.log('REALTIME MESAJ SILINDI:', silinen.id);
          setMesajlar((prev) => prev.filter((m) => m.id !== silinen.id));
          setGuncelSayac((c) => c + 1);
        }
      )
      .subscribe((status) => {
        console.log('Sohbet Realtime durumu:', status);
      });

    subscriptionRef.current = channel;
  }, []);

  /* ─── İlk yükleme ─── */
  useEffect(() => {
    const basla = async () => {
      await kullaniciBilgiCek();
      await mesajlariYukle();
    };
    basla();
    realtimeKurul();

    // Polling yedegi: Realtime baglantisi kopsa bile mesajlar gelsin (5 saniye aralik)
    const pollingInterval = setInterval(() => {
      mesajlariYukle();
    }, 5000);

    return () => {
      clearInterval(pollingInterval);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [kullaniciBilgiCek, mesajlariYukle, realtimeKurul]);

  /* ─── Ban kontrolü ─── */
  const [banliMi, setBanliMi] = useState(false);

  useEffect(() => {
    const banKontrol = async () => {
      if (!kullanici) return;
      const { data } = await supabase
        .from('banlanan_kullanicilar')
        .select('id')
        .eq('kullanici_id', kullanici.id)
        .eq('aktif', true)
        .limit(1);
      setBanliMi((data?.length || 0) > 0);
    };
    banKontrol();
  }, [kullanici]);

  /* ─── Engellenen kullanıcılar (bu kullanıcının engellediği) ─── */
  const [engellenenIdler, setEngellenenIdler] = useState<Set<string>>(new Set());

  const engellenenleriYukle = useCallback(async () => {
    if (!kullanici) return;
    try {
      const { data } = await supabase
        .from('engellenen_kullanicilar')
        .select('engellenen_id')
        .eq('engelleyen_id', kullanici.id);
      setEngellenenIdler(new Set((data || []).map((e: any) => e.engellenen_id)));
    } catch (e) {
      console.warn('Engellenen kullanici listesi yuklenemedi:', e);
    }
  }, [kullanici]);

  useEffect(() => {
    engellenenleriYukle();
  }, [engellenenleriYukle]);

  /* ─── Kullanıcı engelle ─── */
  const kullaniciEngelle = useCallback(async (engellenenId: string, engellenenIsim: string, mesajMetni: string) => {
    if (!kullanici) return;
    if (engellenenId === kullanici.id) {
      Alert.alert('Bilgi', 'Kendinizi engelleyemezsiniz.');
      return;
    }

    Alert.alert(
      'Kullanıcıyı Engelle',
      `${engellenenIsim} adlı kullanıcıyı engellemek istiyor musunuz?\n\nEngellediğiniz kullanıcının mesajları sohbetten anında kaldırılacak ve bir daha görünmeyecek. Uygunsuz içerik geliştiriciye bildirilecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('engellenen_kullanicilar').insert({
                engelleyen_id: kullanici.id,
                engellenen_id: engellenenId,
                engellenen_isim: engellenenIsim,
                sebep: mesajMetni.substring(0, 200),
                bildirildi: false,
              });
              if (error && !error.message.includes('duplicate')) throw error;

              // Anlık feed'den kaldır
              setEngellenenIdler((prev) => new Set([...prev, engellenenId]));
              setMesajlar((prev) => prev.filter((m) => m.kullanici_id !== engellenenId));

              Alert.alert(
                'Engellendi',
                `${engellenenIsim} engellendi. Mesajları sohbetinizden kaldırıldı. Geliştirici bu durumdan haberdar edildi.`
              );
            } catch (e: any) {
              Alert.alert('Hata', e?.message || 'Engelleme başarısız. Lütfen tekrar deneyin.');
            }
          },
        },
      ]
    );
  }, [kullanici]);

  /* ─── Mesaj gönder ─── */
  const mesajGonder = async () => {
    if ((!yeniMesaj.trim() && !secilenGorsel) || !kullanici) return;

    // Ban kontrolü
    if (banliMi) {
      Alert.alert('Erişim Engeli', 'Hesabınız askıya alındığı için mesaj gönderemezsiniz.');
      return;
    }

    // Küfür filtresi (görsel-only mesajda boş metin filtreden geçer)
    const filtreResult = filtrele(yeniMesaj.trim());
    if (yeniMesaj.trim() && filtreResult.engellendi) {
      Alert.alert(
        'Mesaj Engelendi',
        'Mesajınız uygunsuz içerik barındırıyor. Lütfen düzenleyip tekrar gönderin.'
      );
      return;
    }

    setGonderiyor(true);
    try {
      // Kullanıcı ismini al
      const { data: profil } = await supabase
        .from('profiles')
        .select('isim, soyisim')
        .eq('id', kullanici.id)
        .single();

      const kullaniciIsim = profil && (profil.isim || profil.soyisim)
        ? `${profil.isim || ''} ${profil.soyisim || ''}`.trim()
        : kullanici.email.split('@')[0];

      // Eyl 2026: görsel varsa önce storage'a yükle
      let gorselUrl: string | null = null;
      if (secilenGorsel) {
        setGorselYukleniyor(true);
        gorselUrl = await sohbetGorselYukle(secilenGorsel.uri, secilenGorsel.mime);
        setGorselYukleniyor(false);
        if (!gorselUrl) {
          Alert.alert('Görsel yüklenemedi', 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
          return;
        }
      }

      const { data: inserted, error } = await supabase.from('sohbet_mesajlari').insert({
        kullanici_id: kullanici.id,
        kullanici_isim: kullaniciIsim,
        mesaj: yeniMesaj.trim(),
        yanit_id: yanitlanan?.id ?? null,   // Eyl 2026: mesaja yanıt
        gorsel_url: gorselUrl,              // Eyl 2026: görsel
      }).select().single();

      if (error) throw error;

      // Şüpheli içerik varsa admin kuyruğuna gönder (mesaj yine gönderilir)
      if (filtreResult.supheli && inserted) {
        kuyruğaEkle(inserted.id, yeniMesaj.trim(), kullanici.id, kullaniciIsim);
      }

      setYeniMesaj('');
      setYanitlanan(null);
      setSecilenGorsel(null);
      await mesajlariYukle();
    } catch (e: any) {
      console.warn('Mesaj gönderme hatası:', e);
    } finally {
      setGonderiyor(false);
      setGorselYukleniyor(false);
    }
  };

  /* ─── Eyl 2026: görsel seç ─── */
  const gorselEkle = async () => {
    if (banliMi) { Alert.alert('Erişim Engeli', 'Hesabınız askıya alındığı için görsel paylaşamazsınız.'); return; }
    const g = await gorselSec();
    if (g) setSecilenGorsel(g);
  };

  /* ─── Aşağı kaydır ─── */
  useEffect(() => {
    if (mesajlar.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [mesajlar]);

  /* ─── Mesaj Raporla ─── */
  const mesajRaporla = useCallback(async (mesaj: Mesaj) => {
    if (!kullanici) return;
    // Kendi mesajini raporlayamasin
    if (mesaj.kullanici_id === kullanici.id) {
      Alert.alert('Bilgi', 'Kendi mesajınızı raporlayamazsınız.');
      return;
    }

    Alert.alert(
      'Mesajı Raporla',
      `"${mesaj.mesaj.substring(0, 80)}${mesaj.mesaj.length > 80 ? '...' : ''}"\n\nBu mesajı uygunsuz içerik olarak raporlamak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('raporlanan_mesajlar').insert({
                mesaj_id: mesaj.id,
                raporlayan_id: kullanici.id,
                mesaj_metni: mesaj.mesaj,
                mesaj_sahibi_id: mesaj.kullanici_id,
                mesaj_sahibi_isim: mesaj.kullanici_isim,
              });
              if (error) throw error;
              Alert.alert('Teşekkürler', 'Raporunuz moderatörlere iletildi.');
            } catch {
              Alert.alert('Hata', 'Rapor gönderilemedi. Lütfen tekrar deneyin.');
            }
          },
        },
      ]
    );
  }, [kullanici]);

  /* ─── Admin/Moderator: Mesajı doğrudan sil (v1.1.0) ─── */
  const mesajSil = useCallback(async (mesaj: Mesaj) => {
    Alert.alert(
      'Mesajı Sil',
      `"${mesaj.mesaj.substring(0, 100)}${mesaj.mesaj.length > 100 ? '...' : ''}"\n\nBu mesaj kalıcı olarak silinecek. Devam edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sohbet_mesajlari')
                .delete()
                .eq('id', mesaj.id);
              if (error) throw error;
              // Lokalde de mesajı kaldır (realtime gecikmesi olabilir)
              setMesajlar(prev => prev.filter(m => m.id !== mesaj.id));
            } catch (e: any) {
              Alert.alert('Hata', e?.message || 'Mesaj silinemedi. Lütfen tekrar deneyin.');
            }
          },
        },
      ]
    );
  }, []);

  /* ─── Mesaj aksiyonları menüsü (Eyl 2026: alt sayfa — tepkiler + Yanıtla + eski aksiyonlar) ───
     Kendi mesaj:    Yanıtla + Sil
     Başkasının:     Yanıtla + Raporla + Engelle + (yetkili ise) Sabitle + Sil */
  const mesajAksiyonlari = useCallback((mesaj: Mesaj) => {
    if (!kullanici) return;
    setMenuMesaj(mesaj);
  }, [kullanici]);

  /* ─── Eyl 2026 DM: özel mesaj başlat → /dm/[id] ─── */
  const dmBaslat = useCallback((aliciId: string, aliciIsim: string) => {
    if (!kullanici) return;
    if (aliciId === kullanici.id) { Alert.alert('Bilgi', 'Kendinize özel mesaj gönderemezsiniz.'); return; }
    // Eyl 2026: profilde telefon yoksa önce TelefonModal, kaydedince devam
    telefonGerekli(async () => {
      try {
        const id = await konusmaBaslat(aliciId);
        router.push({ pathname: '/dm/[id]', params: { id, isim: aliciIsim } } as never);
      } catch (e: any) {
        Alert.alert('Mesaj gönderilemiyor', e?.message || 'Konuşma başlatılamadı. Lütfen tekrar deneyin.');
      }
    });
  }, [kullanici, telefonGerekli]);

  const dmKonusmaAc = useCallback((k: DmKonusma) => {
    router.push({ pathname: '/dm/[id]', params: { id: k.id, isim: k.karsi_isim } } as never);
  }, []);

  const menuAksiyonlari = useMemo<MenuAksiyon[]>(() => {
    if (!menuMesaj || !kullanici) return [];
    const mesaj = menuMesaj;
    const kendi = mesaj.kullanici_id === kullanici.id;
    const liste: MenuAksiyon[] = [];
    // Eyl 2026 DM: başkasının mesajında EN ÜSTE "Özel mesaj gönder"
    if (!kendi) liste.push({ baslik: 'Özel mesaj gönder', vurgulu: true, onPress: () => dmBaslat(mesaj.kullanici_id, mesaj.kullanici_isim) });
    liste.push({ baslik: 'Yanıtla', vurgulu: true, onPress: () => setYanitlanan(mesaj) });
    if (kendi) {
      liste.push({ baslik: 'Mesajı Sil', tehlike: true, onPress: () => mesajSil(mesaj) });
      return liste;
    }
    liste.push({ baslik: 'Mesajı Raporla', onPress: () => mesajRaporla(mesaj) });
    liste.push({ baslik: 'Kullanıcıyı Engelle', tehlike: true, onPress: () => kullaniciEngelle(mesaj.kullanici_id, mesaj.kullanici_isim, mesaj.mesaj) });
    if (isYetkili) {
      // v1.1.0: Pin/Sabit kaldir (kritik saha bilgisini ana sayfada one cikar)
      liste.push({
        baslik: mesaj.pinned ? 'Sabitten Kaldır' : 'Sabitle (Yetkili)',
        onPress: async () => {
          if (mesaj.pinned) {
            const ok = await pinKaldir(mesaj.id);
            if (!ok) Alert.alert('Hata', 'Sabit kaldırılamadı.');
          } else {
            Alert.alert(
              'Mesajı Sabitle',
              'Bu mesaj 48 saat boyunca ana sayfada "Sahadan Önemli" altında gösterilecek ve tüm kullanıcılara push bildirim gönderilecek. Devam edilsin mi?',
              [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Sabitle ve Bildir',
                  onPress: async () => {
                    const ok = await pinle(mesaj.id);
                    if (!ok) Alert.alert('Hata', 'Sabitlenemedi.');
                  },
                },
              ]
            );
          }
        },
      });
      liste.push({ baslik: 'Mesajı Sil (Yetkili)', tehlike: true, onPress: () => mesajSil(mesaj) });
    }
    return liste;
  }, [menuMesaj, kullanici, mesajRaporla, kullaniciEngelle, mesajSil, isYetkili, pinle, pinKaldir, dmBaslat]);

  /* ─── Tepki ver (menüden, pill'den veya çift dokunuşla) ─── */
  const tepkiUygula = useCallback((mesajId: string, tip: TepkiTipi) => {
    tepkiVer(mesajId, tip, kullaniciIsim);
  }, [tepkiVer, kullaniciIsim]);

  // Balona ÇİFT DOKUNMA = Beğen (300 ms içinde ikinci dokunuş)
  const balonaDokun = useCallback((mesaj: Mesaj) => {
    const simdi = Date.now();
    if (sonDokunus.current.id === mesaj.id && simdi - sonDokunus.current.zaman < 300) {
      sonDokunus.current = { id: '', zaman: 0 };
      tepkiUygula(mesaj.id, 'begen');
      return;
    }
    sonDokunus.current = { id: mesaj.id, zaman: simdi };
  }, [tepkiUygula]);

  // Yanıt alıntısına dokununca orijinal mesaja kaydır
  const mesajaKaydir = useCallback((mesajId: string) => {
    const gorunen = mesajlar.filter((m) => !engellenenIdler.has(m.kullanici_id));
    const idx = gorunen.findIndex(m => m.id === mesajId);
    if (idx >= 0) flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
  }, [mesajlar, engellenenIdler]);

  /* ─── Yenile ─── */
  const yenile = async () => {
    setTekrarYukleniyor(true);
    try {
      await mesajlariYukle();
    } finally {
      setTekrarYukleniyor(false);
    }
  };

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  // ─── Yükleniyor ───
  if (yukleniyor) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  // ─── Misafir modu (giris yapilmamis) ───
  if (!kullanici) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <GradyanHeader paddingTop={insets.top + 12}>
          <HeaderBaslik baslik="Sohbet" />
        </GradyanHeader>

        <View style={styles.misafirIcerik}>
          <View style={[styles.misafirIkon, { backgroundColor: Palette.kobaltTint }]}>
            <KilitIkon color={t.primary} />
          </View>
          <Text style={[styles.misafirBaslik, { color: t.text }]}>Sohbet Kilitli</Text>
          <Text style={[styles.misafirAciklama, { color: t.textSecondary }]}>
            Diğer rehberlerle sohbet etmek ve mesaj görmek için giriş yapmanız gerekiyor.
          </Text>
          <BirincilButon
            baslik="Giriş Yap / Kayıt Ol"
            varyant="cta"
            onPress={() => router.push('/giris')}
            style={styles.girisBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ── Gradyan Header ── */}
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Rehber Sohbeti" alt="Uzun bas: tepki ver, yanıtla, raporla · Çift dokun: beğen" />
      </GradyanHeader>

      {/* ── Eyl 2026 DM: Genel | Mesajlarım ── */}
      <View style={styles.sekmeler}>
        <Segmentler<SohbetSekme>
          secenekler={[
            { id: 'genel', baslik: 'Genel' },
            { id: 'dm', baslik: dmOkunmamis > 0 ? `Mesajlarım (${dmOkunmamis})` : 'Mesajlarım' },
          ]}
          aktif={sekme}
          onSec={setSekme}
        />
      </View>

      {/* ── Eyl 2026 DM: konuşma listesi ── */}
      {sekme === 'dm' && (
        <FlatList
          data={konusmalar}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.dmListesi}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Kart onPress={() => dmKonusmaAc(item)} style={styles.dmKart}>
              <View style={styles.dmSatir}>
                <View style={[styles.mesajAvatar, { backgroundColor: renkUret(item.karsi_isim) }]}>
                  <Text style={styles.mesajAvatarHarf}>{basHarfler(item.karsi_isim)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[item.okunmamis ? styles.dmIsimKalin : styles.dmIsim, { color: t.text }]} numberOfLines={1}>
                    {item.karsi_isim}
                  </Text>
                  <Text style={[item.okunmamis ? styles.dmOzetKalin : styles.dmOzet, { color: item.okunmamis ? t.text : t.textSecondary }]} numberOfLines={1}>
                    {item.son_mesaj || 'Görsel'}
                  </Text>
                </View>
                <View style={styles.dmSag}>
                  {item.son_mesaj_at ? (
                    <Text style={[styles.dmZaman, { color: item.okunmamis ? t.primary : t.textMuted }]}>{saat(item.son_mesaj_at)}</Text>
                  ) : null}
                  {item.okunmamis && <View style={[styles.dmNokta, { backgroundColor: t.primary }]} />}
                </View>
              </View>
            </Kart>
          )}
          ListEmptyComponent={
            dmYukleniyor ? (
              <ActivityIndicator size="small" color={t.primary} style={{ marginTop: 32 }} />
            ) : (
              <BosDurum metin="Henüz özel mesajın yok. Genel sohbette bir rehberin adına dokunarak yazabilirsin." />
            )
          }
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Mesajlar (Genel) ── */}
      {sekme === 'genel' && (
      <FlatList
        ref={flatListRef}
        data={mesajlar.filter((m) => !engellenenIdler.has(m.kullanici_id))}
        extraData={guncelSayac}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mesajListesi}
        ListHeaderComponent={
          <YetkiliBolum baslik="Sohbet Moderasyonu" aciklama="Raporlar, banlar, küfür listesi" sadeceAdmin>
            <SohbetYonetim />
          </YetkiliBolum>
        }
        renderItem={({ item }) => {
          const isimHarf = basHarfler(item.kullanici_isim);
          const avatarRenk = renkUret(item.kullanici_isim);
          const kendi = kullanici && item.kullanici_id === kullanici.id;
          const ozet = tepkiOzet(item.id);
          return (
            <View style={styles.mesajBlok}>
            <TouchableOpacity
              style={[styles.mesajSatir, kendi && styles.mesajSatirKendi]}
              activeOpacity={0.7}
              onPress={() => balonaDokun(item)}
              onLongPress={() => mesajAksiyonlari(item)}
              delayLongPress={600}
            >
              {/* Avatar harfi — renk isimden üretilir */}
              <View style={[styles.mesajAvatar, { backgroundColor: avatarRenk }]}>
                <Text style={styles.mesajAvatarHarf}>{isimHarf}</Text>
              </View>

              <View
                style={[
                  styles.mesajBubble,
                  kendi
                    ? [styles.mesajBubbleKendi, { backgroundColor: t.primary }]
                    : [styles.mesajBubbleDiger, { backgroundColor: t.bgCard, borderColor: t.kartBorder }],
                ]}
              >
                <View style={styles.mesajUstSatir}>
                  {/* Eyl 2026 DM: başkasının adına dokun → özel mesaj */}
                  {kendi ? (
                    <Text style={[styles.mesajIsim, { color: t.headerSubtext, flex: 1 }]} numberOfLines={1}>
                      {item.kullanici_isim}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => dmBaslat(item.kullanici_id, item.kullanici_isim)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`${item.kullanici_isim} adlı rehbere özel mesaj gönder`}
                    >
                      <Text style={[styles.mesajIsim, { color: t.primary }]} numberOfLines={1}>
                        {item.kullanici_isim}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Gorünür Raporla/Engelle butonu (iPad uyumlu — Apple Guideline 4) */}
                  {kullanici && item.kullanici_id !== kullanici.id && (
                    <TouchableOpacity
                      style={styles.aksiyonBtn}
                      onPress={() => mesajAksiyonlari(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.aksiyonBtnYazi, { color: t.textMuted }]}>...</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* Eyl 2026: yanıt alıntısı */}
                {item.yanit_id && (() => {
                  const orijinal = mesajlar.find(m => m.id === item.yanit_id);
                  return (
                    <YanitAlinti
                      isim={orijinal?.kullanici_isim ?? 'Önceki mesaj'}
                      metin={orijinal ? (orijinal.mesaj || (orijinal.gorsel_url ? 'Görsel' : '')) : 'Mesaj artık görüntülenemiyor'}
                      kendi={!!kendi}
                      onPress={orijinal ? () => mesajaKaydir(orijinal.id) : undefined}
                    />
                  );
                })()}
                {/* Eyl 2026: görsel */}
                {item.gorsel_url && (
                  <MesajGorseli url={item.gorsel_url} onPress={() => setTamEkranUrl(item.gorsel_url!)} />
                )}
                {!!item.mesaj && (
                  <Text style={[styles.mesajMetin, { color: kendi ? t.textOnPrimary : t.text }]}>
                    {item.mesaj}
                  </Text>
                )}
                <Text style={[styles.mesajSaat, { color: kendi ? t.headerSubtext : t.textMuted }]}>
                  {saat(item.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
            {/* Eyl 2026: tepki pill'leri */}
            <TepkiSatiri
              ozet={ozet}
              kendi={!!kendi}
              onTepki={(tip) => tepkiUygula(item.id, tip)}
              onKimler={() => setKimlerMesajId(item.id)}
            />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.bosMesaj}>
            <View style={[styles.bosIkon, { backgroundColor: Palette.kobaltTint }]}>
              <ChatIcon size={28} color={t.primary} />
            </View>
            <Text style={[styles.bosMesajYazi, { color: t.text }]}>Henüz mesaj yok</Text>
            <Text style={[styles.bosMesajAlt, { color: t.textSecondary }]}>
              Sohbeti başlatmak için ilk mesajı gönderin
            </Text>
          </View>
        }
        onEndReachedThreshold={0.3}
        onEndReached={yenile}
        inverted={false}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 }), 300);
        }}
        scrollEnabled={true}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />
      )}

      {/* ── Eyl 2026: yanıt şeridi ── */}
      {sekme === 'genel' && yanitlanan && (
        <YanitSeridi isim={yanitlanan.kullanici_isim} metin={yanitlanan.mesaj || (yanitlanan.gorsel_url ? 'Görsel' : '')} onIptal={() => setYanitlanan(null)} />
      )}

      {/* ── Eyl 2026: seçilen görsel önizleme ── */}
      {sekme === 'genel' && secilenGorsel && (
        <GorselOnizleme gorsel={secilenGorsel} yukleniyor={gorselYukleniyor} onKaldir={() => setSecilenGorsel(null)} />
      )}

      {/* ── Giriş Alanı — görsel butonu + yuvarlak kutu + safran gönder (Genel sekmesi) ── */}
      {sekme === 'genel' && (
      <View style={[styles.girisBolumu, { paddingBottom: insets.bottom + 8 }]}>
        <GorselButon onPress={gorselEkle} disabled={gonderiyor} />
        <TextInput
          style={[styles.girisiInput, { backgroundColor: t.bgInput, color: t.text, borderColor: t.kartBorder }]}
          placeholder="Mesaj yazın..."
          placeholderTextColor={t.textMuted}
          value={yeniMesaj}
          onChangeText={setYeniMesaj}
          multiline={true}
          maxLength={500}
          editable={!gonderiyor}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.gonderBtn, { backgroundColor: t.accent, opacity: gonderiyor || (!yeniMesaj.trim() && !secilenGorsel) ? 0.6 : 1 }]}
          onPress={mesajGonder}
          disabled={gonderiyor || (!yeniMesaj.trim() && !secilenGorsel)}
        >
          {gonderiyor ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.gonderBtnYazi}>Gönder</Text>
          )}
        </TouchableOpacity>
      </View>
      )}

      {/* ── Eyl 2026: mesaj menüsü (tepkiler + aksiyonlar) ── */}
      <MesajMenusu
        acik={!!menuMesaj}
        baslik={menuMesaj ? (menuMesaj.kullanici_id === kullanici.id ? 'Mesajınız' : menuMesaj.kullanici_isim) : ''}
        ozetMetin={menuMesaj ? (menuMesaj.mesaj ? `"${menuMesaj.mesaj.substring(0, 100)}${menuMesaj.mesaj.length > 100 ? '...' : ''}"` : 'Görsel') : ''}
        benimTepkim={menuMesaj ? benimTepkim(menuMesaj.id) : null}
        aksiyonlar={menuAksiyonlari}
        onTepki={(tip) => { if (menuMesaj) tepkiUygula(menuMesaj.id, tip); }}
        onKapat={() => setMenuMesaj(null)}
      />
      <TamEkranGorsel url={tamEkranUrl} onKapat={() => setTamEkranUrl(null)} />
      <TepkiVerenlerModal
        acik={!!kimlerMesajId}
        ozet={kimlerMesajId ? tepkiOzet(kimlerMesajId) : []}
        onKapat={() => setKimlerMesajId(null)}
      />
      {telefonModal}
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },

    // Eyl 2026 DM: sekmeler + konuşma listesi
    sekmeler: {
      paddingHorizontal: Space.lg,
      paddingTop: Space.md,
      paddingBottom: Space.xs,
    },
    dmListesi: {
      flexGrow: 1,
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
    },
    dmKart: {
      paddingVertical: 12,
    },
    dmSatir: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 44,
    },
    dmIsim: {
      fontFamily: Font.semibold,
      fontSize: 14,
    },
    dmIsimKalin: {
      fontFamily: Font.extrabold,
      fontSize: 14,
    },
    dmOzet: {
      fontFamily: Font.regular,
      fontSize: 12,
      marginTop: 1,
    },
    dmOzetKalin: {
      fontFamily: Font.semibold,
      fontSize: 12,
      marginTop: 1,
    },
    dmSag: {
      alignItems: 'flex-end',
      gap: 6,
    },
    dmZaman: {
      fontFamily: Font.regular,
      fontSize: 11,
    },
    dmNokta: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    // Mesajlar
    mesajListesi: {
      flexGrow: 1,
      paddingHorizontal: Space.lg,
      paddingVertical: Space.lg,
    },
    mesajBlok: {
      marginBottom: 14,
    },
    mesajSatir: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    // Kendi mesajı: sağa yaslı, avatar sağda
    mesajSatirKendi: {
      flexDirection: 'row-reverse',
    },
    mesajAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mesajAvatarHarf: {
      fontFamily: Font.bold,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    mesajBubble: {
      flex: 1,
      maxWidth: '84%',
      borderRadius: Radius.lg,
      paddingHorizontal: Space.md,
      paddingVertical: 10,
    },
    // Diğerleri: kart zemini + ince border, sol üst köşe sivri
    mesajBubbleDiger: {
      borderWidth: 1,
      borderTopLeftRadius: 6,
    },
    // Kendi: kobalt dolu, sağ üst köşe sivri
    mesajBubbleKendi: {
      borderTopRightRadius: 6,
    },
    mesajUstSatir: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    aksiyonBtn: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.sm,
      marginLeft: 4,
    },
    aksiyonBtnYazi: {
      fontFamily: Font.extrabold,
      fontSize: 18,
      lineHeight: 18,
      letterSpacing: 1,
    },
    mesajIsim: {
      fontFamily: Font.bold,
      fontSize: 12,
    },
    mesajMetin: {
      fontFamily: Font.regular,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    mesajSaat: {
      fontFamily: Font.regular,
      fontSize: 11,
    },

    // Boş durum
    bosMesaj: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    bosIkon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    bosMesajYazi: {
      fontFamily: Font.bold,
      fontSize: 16,
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    bosMesajAlt: {
      fontFamily: Font.regular,
      fontSize: 13,
      textAlign: 'center',
    },

    // Giriş alanı
    girisBolumu: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Space.lg,
      paddingTop: Space.md,
      gap: Space.sm,
      backgroundColor: t.bg,
      borderTopWidth: 1,
      borderTopColor: t.divider,
    },
    girisiInput: {
      flex: 1,
      borderRadius: Radius.xl,
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
      fontFamily: Font.regular,
      fontSize: 14,
      minHeight: 48,
      maxHeight: 100,
      borderWidth: 1,
    },
    gonderBtn: {
      height: 48,
      borderRadius: Radius.xl,
      paddingHorizontal: Space.lg,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 76,
    },
    gonderBtnYazi: {
      fontFamily: Font.bold,
      color: '#FFFFFF',
      fontSize: 13,
    },

    // Misafir ekranı
    misafirIcerik: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    misafirIkon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    misafirBaslik: {
      fontFamily: Font.bold,
      fontSize: 22,
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    misafirAciklama: {
      fontFamily: Font.regular,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    girisBtn: {
      alignSelf: 'stretch',
    },
  });
}
