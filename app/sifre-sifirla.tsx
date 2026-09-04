import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Font, Palette, type TemaRenkleri } from '../constants/theme';
import { BirincilButon, GradyanHeader } from '../components/ui/pusula-ui';

/* ═══════════════════════════════════════════
   Şifre Sıfırlama Ekranı
   ─────────────────────────────────────────
   Kullanıcı maildeki "Şifremi Sıfırla" linkine tıkladıktan sonra
   bu ekrana yönlendirilir. _layout.tsx içindeki deep link handler
   recovery token'ını yakalayıp session kurar, sonra buraya getirir.

   Bu ekrana sadece geçerli bir recovery session ile gelinir.
   Yeni şifre belirlendikten sonra signOut yapılıp giriş'e yönlendirilir.

   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi.
   Giriş ekranıyla aynı form dili (gradyan üst alan, Kart zeminli alanlar, safran CTA).
   ═══════════════════════════════════════════ */

export default function SifreSifirla() {
  const { t } = useTema();
  const styles = createStyles(t);
  const insets = useSafeAreaInsets();  // v1.1.0: edge-to-edge icin

  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [sifreTekrarGorunur, setSifreTekrarGorunur] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [oturumKontrol, setOturumKontrol] = useState(true);

  // Geçerli recovery session olmadan bu ekrana gelinmemeli.
  // Yine de güvence için session kontrolü yapıyoruz.
  useEffect(() => {
    let iptal = false;
    const kontrolEt = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (iptal) return;
      if (!session) {
        Alert.alert(
          'Oturum Bulunamadı',
          'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı talep edin.',
          [{ text: 'Tamam', onPress: () => router.replace('/giris') }],
        );
      }
      setOturumKontrol(false);
    };
    kontrolEt();
    return () => { iptal = true; };
  }, []);

  const sifreyiGuncelle = async () => {
    if (!yeniSifre || !yeniSifreTekrar) {
      setHata('Lütfen her iki alanı da doldurun.');
      return;
    }
    if (yeniSifre.length < 8) {
      setHata('Şifre en az 8 karakter olmalı ve hem harf hem rakam içermelidir.');
      return;
    }
    if (!/[a-zA-Z]/.test(yeniSifre) || !/[0-9]/.test(yeniSifre)) {
      setHata('Şifre hem harf hem rakam içermelidir.');
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setHata('Şifreler eşleşmiyor.');
      return;
    }

    setYukleniyor(true);
    setHata('');

    const { error } = await supabase.auth.updateUser({ password: yeniSifre });

    if (error) {
      console.log('ŞİFRE GÜNCELLEME HATASI:', error.message);
      if (error.message.includes('same as the old')) {
        setHata('Yeni şifreniz eski şifrenizle aynı olamaz.');
      } else if (error.message.includes('weak')) {
        setHata('Şifre çok zayıf. Daha güçlü bir şifre seçin.');
      } else {
        setHata(`Şifre güncellenemedi: ${error.message}`);
      }
      setYukleniyor(false);
      return;
    }

    // Başarılı güncelleme — recovery session'ı sonlandır, giriş ekranına yönlendir
    Alert.alert(
      'Şifreniz güncellendi',
      'Yeni şifrenizle giriş yapabilirsiniz.',
      [{
        text: 'Giriş Yap',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/giris');
        },
      }],
      { cancelable: false },
    );
    setYukleniyor(false);
  };

  const iptalEt = () => {
    Alert.alert(
      'Şifre sıfırlamayı iptal et?',
      'Şifreniz değiştirilmeyecek ve giriş ekranına döneceksiniz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/giris');
          },
        },
      ],
    );
  };

  if (oturumKontrol) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradyan üst alan + logo ── */}
        <GradyanHeader paddingTop={insets.top + 20} style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoPusula}>PUSULA</Text>
            <View style={styles.logoDisk}>
              <Image
                source={require('../assets/images/logo-icon.png')}
                style={styles.logoGorsel}
                contentFit="contain"
                tintColor={t.primary}
              />
            </View>
            <Text style={styles.logoIstanbul}>İSTANBUL</Text>
          </View>
          <Text style={styles.altBaslik}>Profesyonel Turist Rehberinin Dijital Asistanı</Text>
        </GradyanHeader>

        <View style={styles.form}>
          <Text style={styles.baslik}>Yeni şifre belirleyin</Text>
          <Text style={styles.aciklama}>
            Hesabınız için yeni bir şifre belirleyin. Şifreniz en az 8 karakter olmalı ve hem harf hem rakam içermelidir.
          </Text>

          <View style={styles.sifreWrap}>
            <TextInput
              style={styles.sifreInput}
              placeholder="Yeni şifre"
              placeholderTextColor={t.textSecondary}
              value={yeniSifre}
              onChangeText={setYeniSifre}
              secureTextEntry={!sifreGorunur}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.sifreToggle}
              onPress={() => setSifreGorunur(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sifreToggleYazi}>{sifreGorunur ? 'Gizle' : 'Göster'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sifreWrap}>
            <TextInput
              style={styles.sifreInput}
              placeholder="Yeni şifre tekrar"
              placeholderTextColor={t.textSecondary}
              value={yeniSifreTekrar}
              onChangeText={setYeniSifreTekrar}
              secureTextEntry={!sifreTekrarGorunur}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.sifreToggle}
              onPress={() => setSifreTekrarGorunur(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sifreToggleYazi}>{sifreTekrarGorunur ? 'Gizle' : 'Göster'}</Text>
            </TouchableOpacity>
          </View>

          {hata ? <Text style={styles.hata}>{hata}</Text> : null}

          <BirincilButon
            baslik="Şifreyi Güncelle"
            onPress={sifreyiGuncelle}
            varyant="cta"
            yukleniyor={yukleniyor}
            disabled={yukleniyor}
            style={styles.buton}
          />

          <TouchableOpacity style={styles.iptalBtn} onPress={iptalEt} disabled={yukleniyor}>
            <Text style={styles.iptalYazi}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    icerik: { flexGrow: 1 },
    header: { alignItems: 'center', paddingBottom: 30 },
    logoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
    logoDisk: { width: 64, height: 64, borderRadius: 32, backgroundColor: Palette.beyaz, alignItems: 'center', justifyContent: 'center' },
    logoGorsel: { width: 44, height: 44 },
    logoPusula: { fontFamily: Font.bold, fontSize: 20, color: '#FFFFFF', letterSpacing: 4 },
    logoIstanbul: { fontFamily: Font.bold, fontSize: 19, color: '#FFFFFF', letterSpacing: 3 },
    altBaslik: { fontFamily: Font.regular, color: t.headerSubtext, fontSize: 13, marginTop: 12, textAlign: 'center' },
    form: { flex: 1, paddingHorizontal: 16, paddingTop: 28, justifyContent: 'center' },
    baslik: {
      fontFamily: Font.bold,
      fontSize: 20,
      letterSpacing: -0.3,
      color: t.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    aciklama: {
      fontFamily: Font.regular,
      color: t.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    sifreWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bgCard,
      borderRadius: 14,
      height: 48,
      borderWidth: 1,
      borderColor: t.kartBorder,
      marginBottom: 12,
      paddingRight: 8,
    },
    sifreInput: {
      flex: 1,
      height: 46,
      paddingHorizontal: 16,
      color: t.text,
      fontFamily: Font.regular,
      fontSize: 14,
    },
    sifreToggle: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    sifreToggleYazi: {
      color: t.primary,
      fontFamily: Font.semibold,
      fontSize: 12,
    },
    hata: { fontFamily: Font.regular, color: t.durumKapali, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    buton: { marginTop: 8 },
    iptalBtn: { alignItems: 'center', justifyContent: 'center', marginTop: 12, minHeight: 44 },
    iptalYazi: { fontFamily: Font.semibold, color: t.textSecondary, fontSize: 14 },
  });
}
