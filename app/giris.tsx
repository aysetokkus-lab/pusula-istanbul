import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Font, Palette, type TemaRenkleri } from '../constants/theme';
import { BirincilButon, GradyanHeader, Segmentler } from '../components/ui/pusula-ui';
import { TELEFON_HATA, TELEFON_YARDIM, telefonNormalize } from '../lib/telefon';
import Svg, { Path } from 'react-native-svg';
import { appleGirisiVarMi, appleIleGiris, googleIleGiris, oauthDonusuIsle } from '../lib/oauth';

/* ═══════════════════════════════════════════
   Giriş / Kayıt Ekranı
   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi.
   Gradyan üst alan + logo, Segmentler sekme, safran CTA.
   ═══════════════════════════════════════════ */

/** Google "G" — dört renkli resmî logo şekli, 20px. HEX istisnası: Google marka renkleri (kılavuz zorunluluğu). */
function GoogleIkon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

/** Apple logosu — tek renk, 20px */
function AppleIkon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#FFFFFF" d="M16.37 12.63c-.02-2.36 1.93-3.5 2.02-3.55-1.1-1.61-2.81-1.83-3.42-1.86-1.46-.15-2.84.86-3.58.86-.74 0-1.88-.84-3.09-.82-1.59.02-3.05.92-3.87 2.35-1.65 2.86-.42 7.1 1.19 9.42.79 1.14 1.72 2.42 2.95 2.37 1.18-.05 1.63-.77 3.06-.77 1.43 0 1.83.77 3.09.75 1.28-.02 2.09-1.16 2.87-2.3.9-1.32 1.27-2.6 1.29-2.66-.03-.01-2.48-.95-2.51-3.79zM14.02 5.7c.65-.79 1.09-1.89.97-2.99-.94.04-2.07.63-2.74 1.42-.6.7-1.13 1.82-.99 2.89 1.05.08 2.11-.53 2.76-1.32z" />
    </Svg>
  );
}

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
  const [telefon, setTelefon] = useState('');   // Eyl 2026: kayıtta zorunlu (beyan usulü, SMS yok)
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  // Eyl 2026: Google / Apple ile giriş
  const [oauthYukleniyor, setOauthYukleniyor] = useState<'google' | 'apple' | null>(null);
  const [appleVar, setAppleVar] = useState(false);

  useEffect(() => { appleGirisiVarMi().then(setAppleVar); }, []);

  // Web'de Google dönüşü: sayfa /giris#access_token=... ya da ?code=... ile açılır
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const url = window.location.href;
    if (!/[#?].*(access_token|code|error)=/.test(url)) return;
    setOauthYukleniyor('google');
    oauthDonusuIsle(url).then(r => {
      setOauthYukleniyor(null);
      if (r.hata) setHata(`Google girişi başarısız: ${r.hata}`);
      try { window.history.replaceState(null, '', window.location.pathname); } catch {}
      // Oturum kurulduysa _layout yönlendirir (profil eksikse /profil-tamamla)
    });
  }, []);

  const oauthGiris = async (saglayici: 'google' | 'apple') => {
    setHata('');
    setBasari('');
    setOauthYukleniyor(saglayici);
    const r = saglayici === 'google' ? await googleIleGiris() : await appleIleGiris();
    setOauthYukleniyor(null);
    if (!r.ok) {
      if (!r.iptal) setHata(`${saglayici === 'google' ? 'Google' : 'Apple'} girişi başarısız: ${r.hata}`);
      return;
    }
    // Oturum kuruldu → _layout: profil eksikse /profil-tamamla, değilse /(tabs)
  };

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
            telefon: meta.telefon || null,
          });
        } catch {}
      }
      router.replace('/(tabs)');
    }
    setYukleniyor(false);
  };

  const kayitOl = async () => {
    if (!isim || !soyisim || !email || !sifre || !sifreTekrar || !ruhsatNo.trim() || !telefon.trim()) {
      setHata('Tüm alanları doldurun');
      return;
    }
    const telefonE164 = telefonNormalize(telefon);
    if (!telefonE164) {
      setHata(TELEFON_HATA);
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
          telefon: telefonE164,
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
            telefon: telefonE164,
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
      setTelefon('');
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
              <TextInput style={styles.input} placeholder="Cep telefonu" placeholderTextColor={t.textSecondary}
                value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" maxLength={20} />
              <Text style={styles.alanNot}>{TELEFON_YARDIM} · İlanlarda ve özel mesajlarda meslektaşların sana ulaşır.</Text>
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

          {/* Eyl 2026: Google / Apple ile giriş (Apple yalnızca iOS) */}
          <View style={styles.ayrac}>
            <View style={styles.ayracCizgi} />
            <Text style={styles.ayracYazi}>ya da</Text>
            <View style={styles.ayracCizgi} />
          </View>
          <TouchableOpacity
            style={styles.sosyalBtn}
            onPress={() => oauthGiris('google')}
            disabled={!!oauthYukleniyor || yukleniyor}
            activeOpacity={0.8}
            accessibilityLabel="Google ile devam et"
          >
            <GoogleIkon />
            <Text style={styles.sosyalYazi}>{oauthYukleniyor === 'google' ? 'Google\u2019a bağlanılıyor…' : 'Google ile devam et'}</Text>
          </TouchableOpacity>
          {appleVar && (
            <TouchableOpacity
              style={[styles.sosyalBtn, styles.appleBtn]}
              onPress={() => oauthGiris('apple')}
              disabled={!!oauthYukleniyor || yukleniyor}
              activeOpacity={0.8}
              accessibilityLabel="Apple ile devam et"
            >
              <AppleIkon />
              <Text style={[styles.sosyalYazi, styles.appleYazi]}>{oauthYukleniyor === 'apple' ? 'Apple\u2019a bağlanılıyor…' : 'Apple ile devam et'}</Text>
            </TouchableOpacity>
          )}
          {mod === 'kayit' && (
            <Text style={styles.alanNot}>Google/Apple ile kayıt olursan ruhsat numaranı ve telefonunu bir sonraki adımda soracağız.</Text>
          )}
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
    alanNot: { fontFamily: Font.regular, fontSize: 11, color: t.textSecondary, marginTop: -6, marginBottom: 10, lineHeight: 15 },
    ayrac: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 12 },
    ayracCizgi: { flex: 1, height: 1, backgroundColor: t.kartBorder },
    ayracYazi: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary },
    sosyalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: 14, borderWidth: 1, borderColor: t.kartBorder, backgroundColor: t.bgCard, marginBottom: 10 },
    sosyalYazi: { fontFamily: Font.semibold, fontSize: 14, color: t.text },
    appleBtn: { backgroundColor: t.text, borderColor: t.text },
    appleYazi: { color: t.bgCard },
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
