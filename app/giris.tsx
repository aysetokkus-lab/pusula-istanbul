import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Font, Palette, type TemaRenkleri } from '../constants/theme';
import { BirincilButon, GradyanHeader, Segmentler } from '../components/ui/pusula-ui';

/* ═══════════════════════════════════════════
   Giriş / Kayıt Ekranı
   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi.
   Gradyan üst alan + logo, Segmentler sekme, safran CTA.
   ═══════════════════════════════════════════ */

export default function Giris() {
  const { t } = useTema();
  const styles = createStyles(t);
  const insets = useSafeAreaInsets();  // v1.1.0: edge-to-edge icin

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

  // Sekme değişimi — eski iki TouchableOpacity'nin onPress davranışları birebir
  const sekmeSec = (id: 'giris' | 'kayit') => {
    if (id === 'giris') {
      setMod('giris'); setHata(''); setBasari(''); setSifreTekrar('');
    } else {
      setMod('kayit'); setHata(''); setBasari('');
    }
  };

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
          <View style={styles.sekmeKutu}>
            <Segmentler
              secenekler={[{ id: 'giris', baslik: 'Giriş Yap' }, { id: 'kayit', baslik: 'Kayıt Ol' }]}
              aktif={mod}
              onSec={sekmeSec}
            />
          </View>

          {mod === 'kayit' && (
            <>
              <Text style={styles.ruhsatUyari}>
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

          <BirincilButon
            baslik={mod === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
            onPress={mod === 'giris' ? girisYap : kayitOl}
            varyant="cta"
            yukleniyor={yukleniyor}
            disabled={yukleniyor}
            style={styles.buton}
          />

          {/* Uygulama ücretli — misafir girişi kapatıldı */}
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
    form: { flex: 1, paddingHorizontal: 16, paddingTop: 24, justifyContent: 'center' },
    sekmeKutu: { marginBottom: 20 },
    ruhsatUyari: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginBottom: 10, fontStyle: 'italic', textAlign: 'center' },
    satirGrid: { flexDirection: 'row', gap: 10 },
    input: {
      backgroundColor: t.bgCard,
      borderRadius: 14,
      height: 48,
      paddingHorizontal: 16,
      color: t.text,
      fontFamily: Font.regular,
      fontSize: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.kartBorder,
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
    basariKutu: { backgroundColor: `${t.durumAcik}22`, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: `${t.durumAcik}55` },
    basariBaslik: { color: t.durumAcik, fontSize: 14, fontFamily: Font.bold, textAlign: 'center', marginBottom: 6 },
    basariYazi: { fontFamily: Font.regular, color: t.durumAcik, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    buton: { marginTop: 8 },
    sifreBtn: { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4, minHeight: 24, justifyContent: 'center' },
    sifreYazi: { color: t.primary, fontFamily: Font.semibold, fontSize: 12 },
  });
}
