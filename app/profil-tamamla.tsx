import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Font, type TemaRenkleri } from '../constants/theme';
import { BirincilButon, GradyanHeader, HeaderBaslik, Kart, Kicker } from '../components/ui/pusula-ui';
import { TelefonAlani } from '../components/telefon-modal';
import { TELEFON_HATA, telefonGoster, telefonNormalize } from '../lib/telefon';
import { profilEksikMi } from '../lib/oauth';

/* ═══════════════════════════════════════════
   Profilini Tamamla (Eyl 2026) — OAuth (Google/Apple) ile gelen kullanıcı
   ───────────────────────────────────────────
   Kayıtta zorunlu olan TUREB ruhsat no + telefon OAuth'ta gelmez. _layout,
   profil eksikse (ruhsat_no ya da isim boş) buraya yönlendirir; tamamlanmadan
   sekmelere geçilemez. İsim/soyisim sağlayıcıdan (given_name/family_name /
   full_name) doldurulur, düzenlenebilir. Çıkış yapmak serbest.
   ═══════════════════════════════════════════ */

export default function ProfilTamamla() {
  const { t } = useTema();
  const styles = createStyles(t);
  const insets = useSafeAreaInsets();

  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [ruhsatNo, setRuhsatNo] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/giris'); return; }
      setEmail(user.email || '');
      const meta = user.user_metadata || {};
      const { eksik, profil } = await profilEksikMi(user.id);
      if (!eksik) { router.replace('/(tabs)'); return; }

      // İsim/soyisim: önce profil, sonra sağlayıcı metadata'sı (Google: given_name/family_name; Apple: isim/soyisim; yedek: full_name/name)
      const tamAd = String(meta.full_name || meta.name || '').trim();
      const [ilk, ...kalan] = tamAd.split(/\s+/).filter(Boolean);
      setIsim(profil?.isim || meta.isim || meta.given_name || ilk || '');
      setSoyisim(profil?.soyisim || meta.soyisim || meta.family_name || kalan.join(' ') || '');
      setRuhsatNo(profil?.ruhsat_no || '');
      setTelefon(profil?.telefon ? telefonGoster(profil.telefon) : '');
      setYukleniyor(false);
    })();
  }, []);

  const kaydet = async () => {
    setHata('');
    const i = isim.trim(), s = soyisim.trim(), r = ruhsatNo.trim();
    if (!i || !s || !r || !telefon.trim()) { setHata('Tüm alanları doldurun.'); return; }
    const tel = telefonNormalize(telefon);
    if (!tel) { setHata(TELEFON_HATA); return; }
    setKaydediliyor(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, isim: i, soyisim: s, sehir: 'İstanbul', ruhsat_no: r, telefon: tel }, { onConflict: 'id' })
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Profil kaydedilemedi');
      // Metadata da güncel kalsın (giriş ekranındaki "profil yoksa oluştur" yedeği için)
      await supabase.auth.updateUser({ data: { isim: i, soyisim: s, ruhsat_no: r, telefon: tel } }).catch(() => {});
      router.replace('/hos-geldin');
    } catch (e: any) {
      setHata(e?.message || 'Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setKaydediliyor(false);
    }
  };

  const cikis = () => {
    Alert.alert('Çıkış', 'Profilini tamamlamadan çıkarsan bir sonraki girişte yine sorulur.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); router.replace('/giris'); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior="padding">
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Profilini tamamla" alt={email ? `${email} ile giriş yaptın` : undefined} />
      </GradyanHeader>
      <ScrollView contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.aciklama}>
          Pusula İstanbul yalnızca profesyonel turist rehberleri içindir. Devam etmek için ruhsatnamendeki ad-soyadını, TUREB ruhsat numaranı ve telefonunu gir.
        </Text>

        {yukleniyor ? null : (
          <Kart>
            <Kicker>Kimlik</Kicker>
            <View style={styles.satir}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="İsim" placeholderTextColor={t.textMuted} value={isim} onChangeText={setIsim} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Soyisim" placeholderTextColor={t.textMuted} value={soyisim} onChangeText={setSoyisim} />
            </View>
            <Text style={styles.not}>Lütfen adını ve soyadını ruhsatnamendeki gibi yaz.</Text>
            <TextInput style={styles.input} placeholder="TUREB Ruhsat No" placeholderTextColor={t.textMuted} value={ruhsatNo} onChangeText={setRuhsatNo} autoCapitalize="characters" />

            <Kicker style={{ marginTop: 6 }}>Telefon</Kicker>
            <TelefonAlani deger={telefon} onDegis={setTelefon} />
            <Text style={styles.not}>Rehber Aranıyor ilanlarında ve özel mesajlarda meslektaşların sana bu numaradan ulaşır. Doğrulama kodu gönderilmez.</Text>

            {hata ? <Text style={styles.hata}>{hata}</Text> : null}
            <BirincilButon baslik="Kaydet ve devam et" onPress={kaydet} varyant="cta" yukleniyor={kaydediliyor} style={{ marginTop: 4 }} />
            <BirincilButon baslik="Çıkış yap" onPress={cikis} varyant="hayalet" />
          </Kart>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (t: TemaRenkleri) =>
  StyleSheet.create({
    icerik: { padding: 16, gap: 14 },
    aciklama: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: t.textSecondary },
    satir: { flexDirection: 'row', gap: 10 },
    input: { fontFamily: Font.regular, fontSize: 15, height: 48, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: t.kartBorder, backgroundColor: t.bgInput, color: t.text },
    not: { fontFamily: Font.regular, fontSize: 12, lineHeight: 16, color: t.textMuted },
    hata: { fontFamily: Font.semibold, fontSize: 13, color: t.durumKapali },
  });
