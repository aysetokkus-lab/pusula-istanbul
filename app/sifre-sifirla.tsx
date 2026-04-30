import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Palette, type TemaRenkleri } from '../constants/theme';

/* ═══════════════════════════════════════════
   Şifre Sıfırlama Ekranı
   ─────────────────────────────────────────
   Kullanıcı maildeki "Şifremi Sıfırla" linkine tıkladıktan sonra
   bu ekrana yönlendirilir. _layout.tsx içindeki deep link handler
   recovery token'ını yakalayıp session kurar, sonra buraya getirir.

   Bu ekrana sadece geçerli bir recovery session ile gelinir.
   Yeni şifre belirlendikten sonra signOut yapılıp giriş'e yönlendirilir.
   ═══════════════════════════════════════════ */

export default function SifreSifirla() {
  const { t } = useTema();
  const styles = createStyles(t);

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
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.icerik}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <View style={styles.logoRow}>
            <Text style={styles.logoPusula}>PUSULA</Text>
            <Image
              source={require('../assets/images/logo-icon.png')}
              style={styles.logoGorsel}
              contentFit="contain"
              tintColor={t.accent}
            />
            <Text style={styles.logoIstanbul}>İSTANBUL</Text>
          </View>
          <Text style={styles.altBaslik}>Profesyonel Turist Rehberinin Dijital Asistanı</Text>
        </View>

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

        <TouchableOpacity style={styles.buton} onPress={sifreyiGuncelle} disabled={yukleniyor}>
          {yukleniyor
            ? <ActivityIndicator color={t.bg} />
            : <Text style={styles.butonYazi}>Şifreyi Güncelle</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.iptalBtn} onPress={iptalEt} disabled={yukleniyor}>
          <Text style={styles.iptalYazi}>Vazgeç</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    icerik: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    logo: { alignItems: 'center', marginBottom: 36 },
    logoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10 },
    logoGorsel: { width: 56, height: 56, marginTop: -6 },
    logoPusula: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: t.accent, letterSpacing: 4 },
    logoIstanbul: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: t.accent, letterSpacing: 3 },
    altBaslik: { color: t.textSecondary, fontSize: 13, marginTop: 10 },
    baslik: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 22,
      color: t.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    aciklama: {
      color: t.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 22,
    },
    sifreWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bgInput,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.divider,
      marginBottom: 12,
      paddingRight: 12,
    },
    sifreInput: {
      flex: 1,
      padding: 16,
      color: t.text,
      fontSize: 15,
    },
    sifreToggle: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    sifreToggleYazi: {
      color: t.accent,
      fontSize: 13,
      fontWeight: '600',
    },
    hata: { color: Palette.kapali, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    buton: { backgroundColor: t.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    butonYazi: { color: t.bg, fontSize: 16, fontWeight: '700' },
    iptalBtn: { alignItems: 'center', marginTop: 18 },
    iptalYazi: { color: t.textSecondary, fontSize: 14, fontWeight: '600' },
  });
}
