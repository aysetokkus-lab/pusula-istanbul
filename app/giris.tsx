import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Palette, type TemaRenkleri } from '../constants/theme';

export default function Giris() {
  const { t } = useTema();
  const styles = createStyles(t);

  const [mod, setMod] = useState<'giris' | 'kayit'>('giris');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [ruhsatNo, setRuhsatNo] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const girisYap = async () => {
    setYukleniyor(true);
    setHata('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
    if (error) {
      console.log('GİRİŞ HATASI:', error.message, error.status);
      if (error.message.includes('Email not confirmed')) {
        setHata('E-posta doğrulanmamış. Supabase Dashboard\'dan "Confirm email" ayarını kapatın.');
      } else {
        setHata(`Giriş hatası: ${error.message}`);
      }
    }
    else router.replace('/(tabs)');
    setYukleniyor(false);
  };

  const kayitOl = async () => {
    if (!isim || !soyisim || !email || !sifre || !sifreTekrar || !ruhsatNo.trim()) {
      setHata('Tüm alanları doldurun');
      return;
    }
    if (sifre.length < 6) {
      setHata('Şifre en az 6 karakter olmalı');
      return;
    }
    if (sifre !== sifreTekrar) {
      setHata('Şifreler eşleşmiyor');
      return;
    }
    setYukleniyor(true);
    setHata('');
    const { data, error } = await supabase.auth.signUp({ email, password: sifre });
    if (error) {
      setHata(error.message);
    } else if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        isim,
        soyisim,
        sehir: 'İstanbul',
        ruhsat_no: ruhsatNo.trim() || null,
      });
      // Kayıt başarılı → hoş geldin ekranına yönlendir
      router.replace('/hos-geldin');
    }
    setYukleniyor(false);
  };

  const sifremiUnuttum = async () => {
    if (!email) {
      setHata('Önce e-posta adresinizi yazın');
      return;
    }
    setYukleniyor(true);
    setHata('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setHata('Şifre sıfırlama gönderilemedi. E-postayı kontrol edin.');
    } else {
      Alert.alert(
        'Şifre Sıfırlama',
        `${email} adresine şifre sıfırlama bağlantısı gönderildi. Spam klasörünü de kontrol edin.`,
      );
    }
    setYukleniyor(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.logo}>
          <View style={styles.logoRow}>
            <Text style={styles.logoPusula}>PUSULA</Text>
            <Image
              source={require('../assets/icons/logo.svg')}
              style={styles.logoGorsel}
              contentFit="contain"
              tintColor="#0077B6"
            />
            <Text style={styles.logoIstanbul}>İSTANBUL</Text>
          </View>
          <Text style={styles.altBaslik}>Profesyonel Rehber Uygulaması</Text>
        </View>

        <View style={styles.sekmeKutu}>
          <TouchableOpacity style={[styles.sekme, mod === 'giris' && styles.sekmeAktif]} onPress={() => { setMod('giris'); setHata(''); setBasari(''); setSifreTekrar(''); }}>
            <Text style={[styles.sekmeYazi, mod === 'giris' && styles.sekmeYaziAktif]}>Giriş Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sekme, mod === 'kayit' && styles.sekmeAktif]} onPress={() => { setMod('kayit'); setHata(''); setBasari(''); }}>
            <Text style={[styles.sekmeYazi, mod === 'kayit' && styles.sekmeYaziAktif]}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

        {mod === 'kayit' && (
          <>
            <View style={styles.satirGrid}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="İsim" placeholderTextColor={t.textSecondary}
                value={isim} onChangeText={setIsim} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Soyisim" placeholderTextColor={t.textSecondary}
                value={soyisim} onChangeText={setSoyisim} />
            </View>
            <TextInput style={styles.input} placeholder="TUREB Ruhsat No" placeholderTextColor={t.textSecondary}
              value={ruhsatNo} onChangeText={setRuhsatNo} keyboardType="default" autoCapitalize="characters" />
          </>
        )}

        <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor={t.textSecondary}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={t.textSecondary}
          value={sifre} onChangeText={setSifre} secureTextEntry />

        {mod === 'kayit' && (
          <TextInput style={styles.input} placeholder="Şifre Tekrar" placeholderTextColor={t.textSecondary}
            value={sifreTekrar} onChangeText={setSifreTekrar} secureTextEntry />
        )}

        {mod === 'giris' && (
          <TouchableOpacity onPress={sifremiUnuttum} style={styles.sifreBtn}>
            <Text style={styles.sifreYazi}>Şifremi unuttum</Text>
          </TouchableOpacity>
        )}

        {hata ? <Text style={styles.hata}>⚠ {hata}</Text> : null}
        {basari ? <Text style={styles.basariYazi}>✅ {basari}</Text> : null}

        <TouchableOpacity style={styles.buton} onPress={mod === 'giris' ? girisYap : kayitOl} disabled={yukleniyor}>
          {yukleniyor ? <ActivityIndicator color={t.bg} /> : (
            <Text style={styles.butonYazi}>{mod === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
          )}
        </TouchableOpacity>

        {/* Uygulama ücretli — misafir girişi kapatıldı */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    icerik: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    logo: { alignItems: 'center', marginBottom: 40 },
    logoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10 },
    logoGorsel: { width: 48, height: 48 },
    logoPusula: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: t.accent, letterSpacing: 4 },
    logoIstanbul: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: t.accent, letterSpacing: 3 },
    altBaslik: { color: t.textSecondary, fontSize: 13, marginTop: 10 },
    sekmeKutu: { flexDirection: 'row', backgroundColor: t.bgCard, borderRadius: 10, padding: 4, marginBottom: 24 },
    sekme: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    sekmeAktif: { backgroundColor: t.accent },
    sekmeYazi: { color: t.textSecondary, fontSize: 14, fontWeight: '600' },
    sekmeYaziAktif: { color: t.bg, fontWeight: '700' },
    satirGrid: { flexDirection: 'row', gap: 10 },
    input: { backgroundColor: t.bgInput, borderRadius: 10, padding: 16, color: t.text, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: t.divider },
    hata: { color: Palette.kapali, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    basariYazi: { color: Palette.acik, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    buton: { backgroundColor: t.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    butonYazi: { color: t.bg, fontSize: 16, fontWeight: '700' },
    sifreBtn: { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
    sifreYazi: { color: t.accent, fontSize: 13, fontWeight: '600' },
    misafirBtn: { marginTop: 20, alignItems: 'center' },
    misafirYazi: { color: t.textSecondary, fontSize: 13 },
  });
}