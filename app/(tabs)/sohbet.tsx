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
    const sa = String(d.getHours()).padStart(2, '0');
    const dk = String(d.getMinutes()).padStart(2, '0');
    return `${sa}:${dk}`;
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

  // ─── Misafir modu ───
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
            onPress={() => router.replace('/giris')}
          >
            <Text style={styles.girisBtnYazi}>Giriş Yap / Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Rehber Sohbeti</Text>
        <Text style={styles.headerAlt}>Tüm rehberler bu sohbet odasını görebilir</Text>
      </LinearGradient>

      {/* ── Mesajlar ── */}
      <FlatList
        ref={flatListRef}
        data={mesajlar}
        extraData={guncelSayac}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mesajListesi}
        renderItem={({ item }) => {
          const isimHarf = basHarfler(item.kullanici_isim);
          const avatarRenk = renkUret(item.kullanici_isim);
          return (
            <View style={styles.mesajSatir}>
              <LinearGradient
                colors={[avatarRenk, `${avatarRenk}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mesajAvatar}
              >
                <Text style={styles.mesajAvatarHarf}>{isimHarf}</Text>
              </LinearGradient>

              <View style={[styles.mesajBubble, { backgroundColor: t.bgCard }]}>
                <Text style={[styles.mesajIsim, { color: Palette.istanbulMavi }]}>
                  {item.kullanici_isim}
                </Text>
                <Text style={[styles.mesajMetin, { color: t.text }]}>
                  {item.mesaj}
                </Text>
                <Text style={[styles.mesajSaat, { color: t.textMuted }]}>
                  {saat(item.created_at)}
                </Text>
              </View>
            </View>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
      >
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
    </View>
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
    mesajIsim: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
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
