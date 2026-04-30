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
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [sifreTekrarGorunur, setSifreTekrarGorunur] = useState(false);
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [ruhsatNo, setRuhsatNo] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const girisYap = async () => {
    setYukleniyor(true);
    setHata('');
    setBasari('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre });
    if (error) {
      console.log('GİRİŞ HATASI:', error.message, error.status);
      if (error.message.includes('Email not confirmed')) {
        setHata('E-posta adresiniz henüz doğrulanmamış. Kayıt sırasında gönderilen doğrulama bağlantısına tıklayın. Spam klasörünü de kontrol edin.');
      } else if (error.message.includes('Invalid login credentials')) {
        setHata('E-posta veya şifre hatalı.');
      } else {
        setHata(`Giriş hatası: ${error.message}`);
      }
    } else if (data.user) {
      // Profil kontrolü — email doğrulama sonrası ilk girişte profil yoksa oluştur
      const { data: profil } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();
      if (!profil && data.user.user_metadata) {
        const meta = data.user.user_metadata;
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            isim: meta.isim || '',
            soyisim: meta.soyisim || '',
            sehir: 'İstanbul',
            ruhsat_no: meta.ruhsat_no || null,
          });
        } catch {}
      }
      router.replace('/(tabs)');
    }
    setYukleniyor(false);
  };

  const kayitOl = async () => {
    if (!isim || !soyisim || !email || !sifre || !sifreTekrar || !ruhsatNo.trim()) {
      setHata('Tüm alanları doldurun');
      return;
    }
    if (sifre.length < 8) {
      setHata('Şifre en az 8 karakter olmalı ve hem harf hem rakam içermelidir.');
      return;
    }
    if (!/[a-zA-Z]/.test(sifre) || !/[0-9]/.test(sifre)) {
      setHata('Şifre hem harf hem rakam içermelidir.');
      return;
    }
    if (sifre !== sifreTekrar) {
      setHata('Şifreler eşleşmiyor');
      return;
    }
    setYukleniyor(true);
    setHata('');
    setBasari('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password: sifre,
      options: {
        data: {
          isim,
          soyisim,
          ruhsat_no: ruhsatNo.trim() || null,
        },
        emailRedirectTo: 'https://pusulaistanbul.app/dogrulandi.html',
      },
    });
    if (error) {
      if (error.message.includes('already registered')) {
        setHata('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
      } else {
        setHata(error.message);
      }
    } else if (data.user) {
      // Email doğrulama açık — session null gelir, profil bilgileri metadata'da
      // Session varsa profil oluşturmayı dene, yoksa ilk girişte trigger ile oluşturulacak
      if (data.session) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            isim,
            soyisim,
            sehir: 'İstanbul',
            ruhsat_no: ruhsatNo.trim() || null,
          });
        } catch {}
      }

      // Doğrulama e-postası gönderildi mesajı göster
      setBasari(
        `${email} adresine doğrulama bağlantısı gönderildi. E-postanızdaki bağlantıya tıkladıktan sonra giriş yapabilirsiniz. Spam klasörünü de kontrol edin.`
      );
      // Formu giriş moduna çevir
      setMod('giris');
      setSifreTekrar('');
      setIsim('');
      setSoyisim('');
      setRuhsatNo('');
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'pusulaistanbul://giris',
    });
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
            <Text style={[styles.ruhsatUyari, { color: t.textSecondary }]}>
              Lütfen adınızı ve soyadınızı ruhsatnamenizdeki gibi yazınız.
            </Text>
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
        <View style={styles.sifreWrap}>
          <TextInput
            style={styles.sifreInput}
            placeholder="Şifre"
            placeholderTextColor={t.textSecondary}
            value={sifre}
            onChangeText={setSifre}
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

        {mod === 'kayit' && (
          <View style={styles.sifreWrap}>
            <TextInput
              style={styles.sifreInput}
              placeholder="Şifre Tekrar"
              placeholderTextColor={t.textSecondary}
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
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
        )}

        {mod === 'giris' && (
          <TouchableOpacity onPress={sifremiUnuttum} style={styles.sifreBtn}>
            <Text style={styles.sifreYazi}>Şifremi unuttum</Text>
          </TouchableOpacity>
        )}

        {hata ? <Text style={styles.hata}>{hata}</Text> : null}
        {basari ? (
          <View style={styles.basariKutu}>
            <Text style={styles.basariBaslik}>Doğrulama E-postası Gönderildi</Text>
            <Text style={styles.basariYazi}>{basari}</Text>
          </View>
        ) : null}

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
    logoGorsel: { width: 56, height: 56, marginTop: -6 },
    logoPusula: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: t.accent, letterSpacing: 4 },
    logoIstanbul: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: t.accent, letterSpacing: 3 },
    altBaslik: { color: t.textSecondary, fontSize: 13, marginTop: 10 },
    sekmeKutu: { flexDirection: 'row', backgroundColor: t.bgCard, borderRadius: 10, padding: 4, marginBottom: 24 },
    sekme: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    sekmeAktif: { backgroundColor: t.accent },
    sekmeYazi: { color: t.textSecondary, fontSize: 14, fontWeight: '600' },
    sekmeYaziAktif: { color: t.bg, fontWeight: '700' },
    ruhsatUyari: { fontSize: 12, marginBottom: 8, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', textAlign: 'center' },
    satirGrid: { flexDirection: 'row', gap: 10 },
    input: { backgroundColor: t.bgInput, borderRadius: 10, padding: 16, color: t.text, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: t.divider },
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
    basariKutu: { backgroundColor: 'rgba(0, 150, 199, 0.12)', borderRadius: 10, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0, 150, 199, 0.3)' },
    basariBaslik: { color: Palette.acik, fontSize: 15, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 6 },
    basariYazi: { color: Palette.acik, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    buton: { backgroundColor: t.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    butonYazi: { color: t.bg, fontSize: 16, fontWeight: '700' },
    sifreBtn: { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
    sifreYazi: { color: t.accent, fontSize: 13, fontWeight: '600' },
    misafirBtn: { marginTop: 20, alignItems: 'center' },
    misafirYazi: { color: t.textSecondary, fontSize: 13 },
  });
}