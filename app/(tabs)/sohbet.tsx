import { useCallback, useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenCapture from 'expo-screen-capture';
import { useTema } from '../../hooks/use-tema';
import { Palette, Space, Radius, Typo, type TemaRenkleri } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useKufurFiltre } from '../../hooks/use-kufur-filtre';
import { useOkunmamisMesaj } from '../../hooks/use-okunmamis-mesaj';
import { useAbonelik } from '../../hooks/use-abonelik';

/* ═══════════════════════════════════════════
   Tipler
   ═══════════════════════════════════════════ */
interface Mesaj {
  id: string;
  kullanici_id: string;
  kullanici_isim: string;
  mesaj: string;
  created_at: string;
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

function renkUret(isim: string): string {
  const renkler = [
    '#0077B6', // Primary blue
    '#00B4D8', // Light blue
    '#023E8A', // Dark blue
    '#0096C7', // Medium blue
    '#0077B6', // Repeat primary
  ];
  const kod = isim.charCodeAt(0);
  return renkler[kod % renkler.length];
}

/* ═══════════════════════════════════════════
   Ana Bileşen
   ═══════════════════════════════════════════ */
export default function SohbetEkrani() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const styles = createStyles(t);
  const flatListRef = useRef<FlatList>(null);
  const { premiumMi, yukleniyor: abonelikYukleniyor } = useAbonelik();

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
    if (!yeniMesaj.trim() || !kullanici) return;

    // Ban kontrolü
    if (banliMi) {
      Alert.alert('Erişim Engeli', 'Hesabınız askıya alındığı için mesaj gönderemezsiniz.');
      return;
    }

    // Küfür filtresi
    const filtreResult = filtrele(yeniMesaj.trim());
    if (filtreResult.engellendi) {
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

      const { data: inserted, error } = await supabase.from('sohbet_mesajlari').insert({
        kullanici_id: kullanici.id,
        kullanici_isim: kullaniciIsim,
        mesaj: yeniMesaj.trim(),
      }).select().single();

      if (error) throw error;

      // Şüpheli içerik varsa admin kuyruğuna gönder (mesaj yine gönderilir)
      if (filtreResult.supheli && inserted) {
        kuyruğaEkle(inserted.id, yeniMesaj.trim(), kullanici.id, kullaniciIsim);
      }

      setYeniMesaj('');
      await mesajlariYukle();
    } catch (e: any) {
      console.warn('Mesaj gönderme hatası:', e);
    } finally {
      setGonderiyor(false);
    }
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

  /* ─── Mesaj aksiyonları menüsü (Raporla / Engelle) ─── */
  const mesajAksiyonlari = useCallback((mesaj: Mesaj) => {
    if (!kullanici) return;
    // Kendi mesajinda aksiyon menusu gosterme
    if (mesaj.kullanici_id === kullanici.id) return;

    Alert.alert(
      mesaj.kullanici_isim,
      `"${mesaj.mesaj.substring(0, 100)}${mesaj.mesaj.length > 100 ? '...' : ''}"`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Mesajı Raporla',
          onPress: () => mesajRaporla(mesaj),
        },
        {
          text: 'Kullanıcıyı Engelle',
          style: 'destructive',
          onPress: () => kullaniciEngelle(mesaj.kullanici_id, mesaj.kullanici_isim, mesaj.mesaj),
        },
      ]
    );
  }, [kullanici, mesajRaporla, kullaniciEngelle]);

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
        <ActivityIndicator size="large" color={Palette.istanbulMavi} />
      </View>
    );
  }

  // ─── Misafir modu (giris yapilmamis) ───
  if (!kullanici) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <LinearGradient
          colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Text style={styles.headerTitle}>Sohbet</Text>
        </LinearGradient>

        <View style={styles.misafirIcerik}>
          <View style={[styles.misafirIkon, { backgroundColor: '#EAF4FB' }]}>
            <Text style={{ fontSize: 36, color: '#94A3B8' }}>⊘</Text>
          </View>
          <Text style={[styles.misafirBaslik, { color: t.text }]}>Sohbet Kilitli</Text>
          <Text style={[styles.misafirAciklama, { color: t.textSecondary }]}>
            Diğer rehberlerle sohbet etmek ve mesaj görmek için giriş yapmanız gerekiyor.
          </Text>
          <TouchableOpacity
            style={[styles.girisBtn, { backgroundColor: Palette.istanbulMavi }]}
            onPress={() => router.push('/giris')}
          >
            <Text style={styles.girisBtnYazi}>Giriş Yap / Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Premium gate (giris yapilmis ama abonelik yok) ───
  if (!premiumMi && !abonelikYukleniyor) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <LinearGradient
          colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Text style={styles.headerTitle}>Sohbet</Text>
          <Text style={styles.headerAlt}>Premium özellik</Text>
        </LinearGradient>

        <View style={styles.misafirIcerik}>
          <View style={[styles.misafirIkon, { backgroundColor: '#F3E8FF' }]}>
            <Text style={{ fontSize: 36, color: '#7B2D8E' }}>P</Text>
          </View>
          <Text style={[styles.misafirBaslik, { color: t.text }]}>Premium Özellik</Text>
          <Text style={[styles.misafirAciklama, { color: t.textSecondary }]}>
            Rehber sohbet odası premium abonelere özeldir. Diğer rehberlerle anlık iletişim kurabilmek için abone olun.
          </Text>
          <TouchableOpacity
            style={[styles.girisBtn, { backgroundColor: '#7B2D8E' }]}
            onPress={() => router.push('/abone-ol')}
          >
            <Text style={styles.girisBtnYazi}>Abone Ol</Text>
          </TouchableOpacity>
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
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Rehber Sohbeti</Text>
        <Text style={styles.headerAlt}>Uygunsuz içerik için mesajdaki (...) butonunu kullanın</Text>
      </LinearGradient>

      {/* ── Mesajlar ── */}
      <FlatList
        ref={flatListRef}
        data={mesajlar.filter((m) => !engellenenIdler.has(m.kullanici_id))}
        extraData={guncelSayac}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mesajListesi}
        renderItem={({ item }) => {
          const isimHarf = basHarfler(item.kullanici_isim);
          const avatarRenk = renkUret(item.kullanici_isim);
          return (
            <TouchableOpacity
              style={styles.mesajSatir}
              activeOpacity={0.7}
              onLongPress={() => mesajAksiyonlari(item)}
              delayLongPress={600}
            >
              <LinearGradient
                colors={[avatarRenk, `${avatarRenk}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mesajAvatar}
              >
                <Text style={styles.mesajAvatarHarf}>{isimHarf}</Text>
              </LinearGradient>

              <View style={[styles.mesajBubble, { backgroundColor: t.bgCard }]}>
                <View style={styles.mesajUstSatir}>
                  <Text style={[styles.mesajIsim, { color: Palette.istanbulMavi, flex: 1 }]}>
                    {item.kullanici_isim}
                  </Text>
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
                <Text style={[styles.mesajMetin, { color: t.text }]}>
                  {item.mesaj}
                </Text>
                <Text style={[styles.mesajSaat, { color: t.textMuted }]}>
                  {saat(item.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.bosMesaj}>
            <Text style={{ fontSize: 36, marginBottom: 12, color: '#94A3B8' }}>—</Text>
            <Text style={[styles.bosMesajYazi, { color: t.text }]}>Henüz mesaj yok</Text>
            <Text style={[styles.bosMesajAlt, { color: t.textSecondary }]}>
              Sohbeti başlatmak için ilk mesajı gönderin
            </Text>
          </View>
        }
        onEndReachedThreshold={0.3}
        onEndReached={yenile}
        inverted={false}
        scrollEnabled={true}
      />

      {/* ── Giriş Alanı ── */}
      <View style={[styles.girisBolumu, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[styles.girisiInput, { backgroundColor: t.bgInput, color: t.text, borderColor: t.divider }]}
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
          style={[styles.gonderBtn, { backgroundColor: Palette.istanbulMavi, opacity: gonderiyor || !yeniMesaj.trim() ? 0.6 : 1 }]}
          onPress={mesajGonder}
          disabled={gonderiyor || !yeniMesaj.trim()}
        >
          {gonderiyor ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.gonderBtnYazi}>Gönder</Text>
          )}
        </TouchableOpacity>
      </View>
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

    // Header
    header: {
      paddingHorizontal: Space.lg,
      paddingBottom: 14,
    },
    headerTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 20,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 4,
    },
    headerAlt: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
    },

    // Mesajlar
    mesajListesi: {
      flexGrow: 1,
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
    },
    mesajSatir: {
      flexDirection: 'row',
      marginBottom: Space.lg,
      alignItems: 'flex-start',
    },
    mesajAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Space.md,
    },
    mesajAvatarHarf: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    mesajBubble: {
      flex: 1,
      borderRadius: Radius.lg,
      paddingHorizontal: Space.md,
      paddingVertical: Space.sm,
      borderWidth: 1,
      borderColor: t.kartBorder,
    },
    mesajUstSatir: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    aksiyonBtn: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 4,
    },
    aksiyonBtnYazi: {
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
      letterSpacing: 1,
    },
    mesajIsim: {
      fontSize: 13,
      fontWeight: '700',
    },
    mesajMetin: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    mesajSaat: {
      fontSize: 11,
    },

    // Boş durum
    bosMesaj: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    bosMesajYazi: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    bosMesajAlt: {
      fontSize: 13,
      textAlign: 'center',
    },

    // Giriş alanı
    girisBolumu: {
      flexDirection: 'row',
      paddingHorizontal: Space.lg,
      paddingTop: Space.md,
      gap: Space.sm,
      backgroundColor: t.bg,
      borderTopWidth: 1,
      borderTopColor: t.divider,
    },
    girisiInput: {
      flex: 1,
      borderRadius: Radius.md,
      paddingHorizontal: Space.md,
      paddingVertical: Space.sm,
      fontSize: 14,
      minHeight: 44,
      maxHeight: 100,
      borderWidth: 1,
    },
    gonderBtn: {
      borderRadius: Radius.md,
      paddingHorizontal: Space.md,
      paddingVertical: Space.sm,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 70,
    },
    gonderBtnYazi: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
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
      fontFamily: 'Poppins_700Bold',
      fontSize: 22,
      marginBottom: 8,
    },
    misafirAciklama: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    girisBtn: {
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: Radius.md,
    },
    girisBtnYazi: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
