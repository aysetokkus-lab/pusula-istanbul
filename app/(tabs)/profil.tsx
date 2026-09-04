/* Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
   Gradyan header içinde avatar + ad soyad + üye rozeti; Kart tabanlı menü satırları,
   Segmentler ile tema seçici, ModalKapak ile alttan açılan modallar. Tüm hook/Alert/Linking akışları birebir. */
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTema, type TemaTercihi } from '../../hooks/use-tema';
import { Font, Palette, Radius, Space, type TemaRenkleri } from '../../constants/theme';
import {
  BirincilButon,
  DurumNoktasi,
  GradyanHeader,
  HeaderBaslik,
  Kart,
  ModalKapak,
  Rozet,
  Segmentler,
} from '../../components/ui/pusula-ui';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../hooks/use-admin';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { ModeratorYonetim } from '../../components/yetkili/moderator-yonetim';
import { pushTokenTemizle } from '../../hooks/use-push-token';
import {
  useBildirimTercihleri,
  BILDIRIM_KATEGORI_BILGI,
  type BildirimKategori,
} from '../../hooks/use-bildirim-tercihleri';
// Eyl 2026 — İş İlanları: profil telefonu + dillerim (push filtresi) profil düzenleme modalında
import { useProfilDilleri } from '../../hooks/use-ilanlar';
import { DILLER } from '../../constants/diller';

/* ═══════════════════════════════════════════
   Surum (app.json'dan dinamik — v1.1.0 fix)
   Onceden hardcoded "1.0.0" idi, yeni surum cikarinca
   guncellenmiyordu. Artik expo-constants ile app.json'dan
   okunup hem hakkinda modal'da hem destek mailinde gosterilir.
   ═══════════════════════════════════════════ */
const APP_VERSION = Constants.expoConfig?.version ?? '?';

/* ═══════════════════════════════════════════
   Tipler
   ═══════════════════════════════════════════ */
interface Profil {
  isim: string;
  soyisim: string;
}

interface KullaniciBilgi {
  id: string;
  email: string;
  profil: Profil;
  kayitTarihi: string;
}

/* ═══════════════════════════════════════════
   Yardımcı fonksiyonlar
   ═══════════════════════════════════════════ */
function basHarfler(isim: string, soyisim: string): string {
  const i = isim.trim().charAt(0).toUpperCase();
  const s = soyisim.trim().charAt(0).toUpperCase();
  return `${i}${s}` || '?';
}

function tarihFormat(iso: string): string {
  try {
    const d = new Date(iso);
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${d.getDate()} ${aylar[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

/* ─── Sağ ok ikonu (24px stroke SVG — menü satırı ucu) ─── */
function SagOk({ renk }: { renk: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={renk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ─── Menü satırı (48px min dokunma yüksekliği) ─── */
function MenuSatir({ baslik, alt, renk, onPress, son, styles, t }: {
  baslik: string; alt?: string; renk: string; onPress: () => void; son?: boolean; styles: ReturnType<typeof createStyles>; t: TemaRenkleri;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: t.divider, borderBottomWidth: son ? 0 : 1 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuNokta}><DurumNoktasi renk={renk} boyut={8} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuText, { color: t.text }]}>{baslik}</Text>
        {alt ? <Text style={[styles.menuAlt, { color: t.textSecondary }]}>{alt}</Text> : null}
      </View>
      <SagOk renk={t.textMuted} />
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════
   Ana Bileşen
   ═══════════════════════════════════════════ */
export default function ProfilEkrani() {
  const insets = useSafeAreaInsets();
  const { t, tercih, setTercih } = useTema();
  const styles = createStyles(t);

  const [kullanici, setKullanici] = useState<KullaniciBilgi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);

  // Düzenleme modal
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const [editIsim, setEditIsim] = useState('');
  const [editSoyisim, setEditSoyisim] = useState('');
  // Eyl 2026: telefon + dillerim (profiles.telefon / profiles.diller)
  const [editTelefon, setEditTelefon] = useState('');
  const [editDiller, setEditDiller] = useState<string[]>([]);
  const { diller: profilDilleri, kaydet: dillerKaydet, telefon: profilTelefon, telefonKaydet } = useProfilDilleri();

  // Hakkında modal
  const [hakkindaAcik, setHakkindaAcik] = useState(false);

  // Sifre degistir
  const [sifreAcik, setSifreAcik] = useState(false);
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false);

  // Bildirim sayisi
  const [bildirimSayisi, setBildirimSayisi] = useState(0);

  // Bildirim tercihleri hook'u
  const { tercihler: bildirimTercihleri, toggle: bildirimToggle } = useBildirimTercihleri();

  // Bildirim ayarları modal
  const [bildirimAyarAcik, setBildirimAyarAcik] = useState(false);

  // Admin hook'u
  const { isYetkili } = useAdmin();

  /* ─── Kullanıcı bilgisini çek ─── */
  const kullaniciBilgiCek = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setKullanici(null);
        setYukleniyor(false);
        return;
      }

      const { data: profil } = await supabase
        .from('profiles')
        .select('isim, soyisim')
        .eq('id', user.id)
        .single();

      // Saha bildirim sayisi (sadece gecerli olanlar)
      const { count } = await supabase
        .from('canli_durum')
        .select('*', { count: 'exact', head: true })
        .eq('kullanici_id', user.id)
        .eq('gecerli_mi', true);

      setBildirimSayisi(count || 0);

      setKullanici({
        id: user.id,
        email: user.email || '',
        profil: {
          isim: profil?.isim || '',
          soyisim: profil?.soyisim || '',
        },
        kayitTarihi: user.created_at || '',
      });
    } catch (e) {
      console.warn('Profil çekme hatası:', e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { kullaniciBilgiCek(); }, [kullaniciBilgiCek]);

  /* ─── Profil güncelle (ayda 1 degisiklik siniri + gecmis kaydı) ─── */
  const profilGuncelle = async () => {
    if (!kullanici) return;
    if (!editIsim.trim() || !editSoyisim.trim()) {
      Alert.alert('Hata', 'İsim ve soyisim boş olamaz');
      return;
    }

    const eskiIsim = kullanici.profil.isim;
    const eskiSoyisim = kullanici.profil.soyisim;
    const yeniIsim = editIsim.trim();
    const yeniSoyisim = editSoyisim.trim();

    // Eyl 2026: telefon ve diller isim sinirina tabi degil — degistiyse once onlari kaydet
    const yeniTelefon = editTelefon.trim();
    const telefonDegisti = yeniTelefon !== (profilTelefon || '').trim();
    const dillerDegisti =
      editDiller.length !== profilDilleri.length || editDiller.some(d => !profilDilleri.includes(d));

    // Isim degismemisse direkt kapat (telefon/dil varsa kaydedip)
    if (eskiIsim === yeniIsim && eskiSoyisim === yeniSoyisim) {
      if (telefonDegisti || dillerDegisti) {
        setKayitYukleniyor(true);
        const sonuclar = await Promise.all([
          telefonDegisti ? telefonKaydet(yeniTelefon) : Promise.resolve(true),
          dillerDegisti ? dillerKaydet(editDiller) : Promise.resolve(true),
        ]);
        setKayitYukleniyor(false);
        if (sonuclar.some(ok => !ok)) {
          Alert.alert('Hata', 'Telefon veya dil tercihi kaydedilemedi.');
          return;
        }
      }
      setDuzenleAcik(false);
      return;
    }

    setKayitYukleniyor(true);
    try {
      // Telefon / diller (isim siniri uygulanmaz)
      if (telefonDegisti) await telefonKaydet(yeniTelefon);
      if (dillerDegisti) await dillerKaydet(editDiller);

      // Ayda 1 degisiklik siniri kontrolu
      const birAyOnce = new Date();
      birAyOnce.setMonth(birAyOnce.getMonth() - 1);

      const { data: sonDegisiklikler } = await supabase
        .from('isim_gecmisi')
        .select('degistirilme_tarihi')
        .eq('kullanici_id', kullanici.id)
        .gte('degistirilme_tarihi', birAyOnce.toISOString())
        .limit(1);

      if (sonDegisiklikler && sonDegisiklikler.length > 0) {
        Alert.alert(
          'İsim Değişikliği Sınırı',
          'İsim ve soyisminizi ayda en fazla 1 kez değiştirebilirsiniz. Lütfen daha sonra tekrar deneyin.'
        );
        return;
      }

      // Profili guncelle
      const { error } = await supabase
        .from('profiles')
        .update({
          isim: yeniIsim,
          soyisim: yeniSoyisim,
        })
        .eq('id', kullanici.id);

      if (error) throw error;

      // Isim gecmisini kaydet
      await supabase.from('isim_gecmisi').insert({
        kullanici_id: kullanici.id,
        eski_isim: eskiIsim,
        eski_soyisim: eskiSoyisim,
        yeni_isim: yeniIsim,
        yeni_soyisim: yeniSoyisim,
      });

      setKullanici(prev => prev ? {
        ...prev,
        profil: { isim: yeniIsim, soyisim: yeniSoyisim },
      } : null);
      setDuzenleAcik(false);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Güncelleme başarısız');
    } finally {
      setKayitYukleniyor(false);
    }
  };

  /* ─── Çıkış ─── */
  const cikisYap = () => {
    Alert.alert('Çıkış', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
          // ISSUES #87: token temizligi signOut'tan ONCE — sonra RLS sessizce reddeder
          await pushTokenTemizle();
          await supabase.auth.signOut();
          setKullanici(null);
          router.replace('/giris');
        }
      },
    ]);
  };

  /* ─── Sifre degistir ─── */
  const sifreDegistir = async () => {
    if (!yeniSifre || yeniSifre.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    setSifreYukleniyor(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: yeniSifre });
      if (error) throw error;
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setSifreAcik(false);
      setYeniSifre('');
      setYeniSifreTekrar('');
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Şifre güncellenemedi');
    } finally {
      setSifreYukleniyor(false);
    }
  };

  /* ─── Geri bildirim gonder ─── */
  const geriBildirimGonder = () => {
    const konu = encodeURIComponent('Pusula İstanbul - Geri Bildirim');
    const govde = encodeURIComponent(`\n\n---\nKullanıcı: ${kullanici?.profil.isim} ${kullanici?.profil.soyisim}\nE-posta: ${kullanici?.email}\nSürüm: v${APP_VERSION}`);
    const url = `mailto:info@pusulaistanbul.app?subject=${konu}&body=${govde}`;
    import('react-native').then(({ Linking }) => {
      Linking.openURL(url).catch(() => {
        Alert.alert('Hata', 'E-posta uygulaması açılamadı. Geri bildiriminizi info@pusulaistanbul.app adresine gönderebilirsiniz.');
      });
    });
  };

  /* ─── Hesabi sil ─── */
  const hesabiSil = () => {
    Alert.alert(
      'Hesap Silme Talebi',
      'Hesabınızı silmek istediğinize emin misiniz? E-posta uygulamanız açılacak ve silme talebiniz info@pusulaistanbul.app adresine iletilecektir. Talebiniz en geç 7 iş günü içinde işleme alınacaktır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Silme Talebi Gönder',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Son Onay',
              'E-posta ile hesap silme talebi gönderilecek. Talebiniz onaylandığında hesabınız ve verileriniz kalıcı olarak silinecektir.',
              [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Talebi Gönder',
                  style: 'destructive',
                  onPress: async () => {
                    const konu = encodeURIComponent('Pusula İstanbul - Hesap Silme Talebi');
                    const govde = encodeURIComponent(`Hesap silme talebi:\n\nKullanıcı ID: ${kullanici?.id}\nE-posta: ${kullanici?.email}\nİsim: ${kullanici?.profil.isim} ${kullanici?.profil.soyisim}\n\nLütfen hesabımı ve tüm verilerimi silin.`);
                    const url = `mailto:info@pusulaistanbul.app?subject=${konu}&body=${govde}`;
                    try {
                      const { Linking } = await import('react-native');
                      await Linking.openURL(url);
                      Alert.alert(
                        'Talep Hazırlandı',
                        'E-posta uygulamanız açıldı. Lütfen e-postayı gönderin. Talebiniz en geç 7 iş günü içinde işleme alınacaktır. Şimdi çıkış yapılıyor.',
                        [{
                          text: 'Tamam',
                          onPress: async () => {
                            // ISSUES #87: token temizligi signOut'tan ONCE
                            await pushTokenTemizle();
                            await supabase.auth.signOut();
                            setKullanici(null);
                            router.replace('/giris');
                          }
                        }]
                      );
                    } catch {
                      Alert.alert(
                        'E-posta Açılamadı',
                        'E-posta uygulaması bulunamadı. Hesap silme talebinizi manuel olarak info@pusulaistanbul.app adresine gönderebilirsiniz.',
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  /* ─── Duzenleme modal'ini ac ─── */
  const duzenleAc = () => {
    if (!kullanici) return;
    setEditIsim(kullanici.profil.isim);
    setEditSoyisim(kullanici.profil.soyisim);
    setEditTelefon(profilTelefon || '');
    setEditDiller(profilDilleri);
    setDuzenleAcik(true);
  };

  /* ─── Dillerim: çip aç/kapat ─── */
  const editDilToggle = (d: string) => {
    setEditDiller(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]));
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

  // ─── Misafir modu ───
  if (!kullanici) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <GradyanHeader paddingTop={insets.top + 12}>
          <HeaderBaslik baslik="Profil" />
        </GradyanHeader>

        <View style={styles.misafirIcerik}>
          <View style={[styles.misafirIkon, { backgroundColor: t.bgSecondary, borderColor: t.kartBorder }]}>
            <Text style={[styles.misafirSoru, { color: t.textMuted }]}>?</Text>
          </View>
          <Text style={[styles.misafirBaslik, { color: t.text }]}>Misafir Modu</Text>
          <Text style={[styles.misafirAciklama, { color: t.textSecondary }]}>
            Profilinizi görmek, yoğunluk bildirmek ve uygulamanın tüm özelliklerinden faydalanmak için giriş yapın.
          </Text>
          <BirincilButon
            baslik="Giriş Yap / Kayıt Ol"
            varyant="kobalt"
            onPress={() => router.replace('/giris')}
            style={styles.girisBtn}
          />
        </View>
      </View>
    );
  }

  // ─── Giriş yapılmış kullanıcı ───
  const { profil, email, kayitTarihi } = kullanici;
  const adSoyad = `${profil.isim} ${profil.soyisim}`.trim() || 'Rehber';
  const initialler = basHarfler(profil.isim, profil.soyisim);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* ── Gradyan Header: başlık + avatar + ad soyad + üye rozeti ── */}
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Profil" />
        <View style={styles.avatarBolum}>
          <View style={styles.avatarDaire}>
            <Text style={styles.avatarHarf}>{initialler}</Text>
          </View>
          <Text style={styles.adSoyad}>{adSoyad}</Text>
          <Text style={styles.email}>{email}</Text>
          <Rozet renk="#FFFFFF" style={styles.uyeRozet}>Üye: {tarihFormat(kayitTarihi)}</Rozet>
        </View>
      </GradyanHeader>

      <ScrollView contentContainerStyle={styles.scrollIcerik}>
        {/* ── Mini Istatistik Kartlari ── */}
        <View style={styles.statSatir}>
          <Kart style={styles.statKart}>
            <Text style={[styles.statSayi, { color: t.text }]}>{bildirimSayisi}</Text>
            <Text style={[styles.statAciklama, { color: t.textSecondary }]}>Saha Bildirimi</Text>
          </Kart>
          <Kart style={styles.statKart}>
            <Text style={[styles.statSayi, { color: Palette.acik }]}>
              {isYetkili ? 'Yetkili' : 'Rehber'}
            </Text>
            <Text style={[styles.statAciklama, { color: t.textSecondary }]}>
              Hesap Durumu
            </Text>
          </Kart>
        </View>

        {/* ── Hesap Ayarlari ── */}
        <Kart style={styles.menuCard}>
          <View>
            <MenuSatir baslik="Profili Düzenle" renk={t.primary} onPress={duzenleAc} styles={styles} t={t} />
            <MenuSatir
              baslik="Şifre Değiştir"
              renk={t.primary}
              onPress={() => { setYeniSifre(''); setYeniSifreTekrar(''); setSifreAcik(true); }}
              styles={styles}
              t={t}
            />
            <MenuSatir
              baslik="Bildirim Ayarları"
              alt={`${Object.values(bildirimTercihleri).filter(Boolean).length} / ${Object.keys(bildirimTercihleri).length} kategori açık`}
              renk={t.primary}
              onPress={() => setBildirimAyarAcik(true)}
              styles={styles}
              t={t}
            />
            {/* ── Görünüm (Tema) Seçici ── */}
            <View style={[styles.menuItem, { borderBottomColor: t.divider, borderBottomWidth: 1 }]}>
              <View style={styles.menuNokta}><DurumNoktasi renk={t.secondary} boyut={8} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuText, { color: t.text, marginBottom: 10 }]}>Görünüm</Text>
                <Segmentler<TemaTercihi>
                  secenekler={[
                    { id: 'sistem', baslik: 'Sistem' },
                    { id: 'acik', baslik: 'Açık' },
                    { id: 'koyu', baslik: 'Koyu' },
                  ]}
                  aktif={tercih}
                  onSec={(id) => setTercih(id)}
                />
              </View>
            </View>
            <MenuSatir baslik="Hakkında" renk={t.primary} onPress={() => setHakkindaAcik(true)} son styles={styles} t={t} />
          </View>
        </Kart>

        {/* ── Destek ── */}
        <Kart style={styles.menuCard}>
          <View>
            <MenuSatir baslik="Geri Bildirim Gönder" renk={Palette.acik} onPress={geriBildirimGonder} styles={styles} t={t} />
            <MenuSatir baslik="Kullanım Koşulları" renk={Palette.bilgi} onPress={() => router.push('/kullanim-kosullari' as any)} styles={styles} t={t} />
            <MenuSatir baslik="Gizlilik Politikası" renk={Palette.bilgi} onPress={() => router.push('/gizlilik-politikasi' as any)} son styles={styles} t={t} />
          </View>
        </Kart>

        {/* ── Moderatör Yönetimi — yalnızca admin (Eyl 2026: admin paneli kaldırıldı, inline) ── */}
        <View style={{ marginHorizontal: -16 }}>
          <YetkiliBolum baslik="Moderatörler" aciklama="Moderatör ata / kaldır" sadeceAdmin>
            <ModeratorYonetim />
          </YetkiliBolum>
        </View>

        {/* ── Cikis ve Hesap Sil ── */}
        <BirincilButon baslik="Çıkış Yap" varyant="tehlike" onPress={cikisYap} style={styles.logoutBtn} />

        <TouchableOpacity style={[styles.hesapSilBtn, { borderColor: t.durumKapali }]} onPress={hesabiSil} activeOpacity={0.7}>
          <Text style={[styles.hesapSilText, { color: t.durumKapali }]}>Hesabımı Sil</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ════════════════════════════════════════
          MODAL — Profili Düzenle
         ════════════════════════════════════════ */}
      <Modal visible={duzenleAcik} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalKav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ModalKapak baslik="Profili Düzenle" onKapat={() => setDuzenleAcik(false)} altButonBaslik="İptal">
            {/* Eyl 2026: telefon + dillerim eklendi; içerik uzadığı için ScrollView */}
            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>İsim</Text>
              <TextInput
                style={[styles.input, { backgroundColor: t.bgInput, color: t.text, borderColor: t.divider }]}
                value={editIsim}
                onChangeText={setEditIsim}
                placeholder="İsim"
                placeholderTextColor={t.textMuted}
              />

              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Soyisim</Text>
              <TextInput
                style={[styles.input, { backgroundColor: t.bgInput, color: t.text, borderColor: t.divider }]}
                value={editSoyisim}
                onChangeText={setEditSoyisim}
                placeholder="Soyisim"
                placeholderTextColor={t.textMuted}
              />

              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Telefon</Text>
              <TextInput
                style={[styles.input, { backgroundColor: t.bgInput, color: t.text, borderColor: t.divider }]}
                value={editTelefon}
                onChangeText={setEditTelefon}
                placeholder="05xx xxx xx xx (ilanlarda iletişim)"
                placeholderTextColor={t.textMuted}
                keyboardType="phone-pad"
                maxLength={20}
              />

              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Dillerim</Text>
              <Text style={[styles.dilNot, { color: t.textMuted }]}>
                İş ilanı bildirimleri bu dillere göre gelir; boşsa tüm ilanlar.
              </Text>
              <View style={styles.dilSarmal}>
                {DILLER.map(d => (
                  <TouchableOpacity key={d} onPress={() => editDilToggle(d)} activeOpacity={0.7} style={styles.dilChipDokun} hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}>
                    <Rozet renk={t.secondary} dolu={editDiller.includes(d)} style={styles.dilChip}>{d}</Rozet>
                  </TouchableOpacity>
                ))}
              </View>

              <BirincilButon
                baslik="Kaydet"
                varyant="cta"
                onPress={profilGuncelle}
                yukleniyor={kayitYukleniyor}
                style={styles.modalKaydetBtn}
              />
            </ScrollView>
          </ModalKapak>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════
          MODAL — Sifre Degistir
         ════════════════════════════════════════ */}
      <Modal visible={sifreAcik} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalKav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ModalKapak baslik="Şifre Değiştir" onKapat={() => setSifreAcik(false)} altButonBaslik="İptal">
            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Yeni Şifre</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.bgInput, color: t.text, borderColor: t.divider }]}
              value={yeniSifre}
              onChangeText={setYeniSifre}
              placeholder="En az 6 karakter"
              placeholderTextColor={t.textMuted}
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Yeni Şifre Tekrar</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.bgInput, color: t.text, borderColor: t.divider }]}
              value={yeniSifreTekrar}
              onChangeText={setYeniSifreTekrar}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={t.textMuted}
              secureTextEntry
            />

            <BirincilButon
              baslik="Değiştir"
              varyant="cta"
              onPress={sifreDegistir}
              yukleniyor={sifreYukleniyor}
              style={styles.modalKaydetBtn}
            />
          </ModalKapak>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════
          MODAL — Hakkında
         ════════════════════════════════════════ */}
      <Modal visible={hakkindaAcik} animationType="fade" transparent>
        <TouchableOpacity style={styles.modalKav} activeOpacity={1} onPress={() => setHakkindaAcik(false)}>
          <ModalKapak baslik="Pusula İstanbul" alt={`Pusula İstanbul v${APP_VERSION}`} onKapat={() => setHakkindaAcik(false)}>
            <View onStartShouldSetResponder={() => true}>
              <Text style={[styles.hakkindaAlt, { color: t.textSecondary }]}>
                Profesyonel turist rehberleri için güncel saha bilgi uygulaması
              </Text>

              <View style={[styles.hakkindaDivider, { backgroundColor: t.divider }]} />

              <Text style={[styles.hakkindaDetay, { color: t.textMuted }]}>
                Geliştirici: Ayşe Tokkuş Bayar{'\n'}
                © 2026 Tüm hakları saklıdır.
              </Text>
            </View>
          </ModalKapak>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════
          MODAL — Bildirim Ayarları
         ════════════════════════════════════════ */}
      <Modal visible={bildirimAyarAcik} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalKav} activeOpacity={1} onPress={() => setBildirimAyarAcik(false)}>
          <ModalKapak
            baslik="Bildirim Ayarları"
            alt="Hangi bildirim türlerini almak istediğinizi seçin"
            onKapat={() => setBildirimAyarAcik(false)}
          >
            <View onStartShouldSetResponder={() => true}>
              {(Object.keys(BILDIRIM_KATEGORI_BILGI) as BildirimKategori[]).map((kategori, index, arr) => {
                const bilgi = BILDIRIM_KATEGORI_BILGI[kategori];
                const aktif = bildirimTercihleri[kategori];
                return (
                  <View
                    key={kategori}
                    style={[
                      styles.bildirimSatir,
                      { borderBottomColor: t.divider, borderBottomWidth: index < arr.length - 1 ? 1 : 0 },
                    ]}
                  >
                    <View style={styles.bildirimSol}>
                      <View style={styles.bildirimNokta}>
                        <DurumNoktasi renk={aktif ? Palette.acik : t.textMuted} boyut={8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bildirimBaslik, { color: t.text }]}>{bilgi.baslik}</Text>
                        <Text style={[styles.bildirimAciklama, { color: t.textSecondary }]}>
                          {aktif ? bilgi.aciklama : bilgi.aciklamaKapali}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={aktif}
                      onValueChange={() => bildirimToggle(kategori)}
                      trackColor={{ false: t.divider, true: `${t.primary}80` }}
                      thumbColor={aktif ? t.primary : t.textMuted}
                    />
                  </View>
                );
              })}
            </View>
          </ModalKapak>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  container: { flex: 1 },

  // Scroll
  scrollIcerik: {
    paddingHorizontal: Space.lg,
    paddingTop: 18,
    gap: 14,
  },

  // Avatar bölümü (header içinde)
  avatarBolum: {
    alignItems: 'center',
    marginTop: 18,
  },
  avatarDaire: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Space.md,
    backgroundColor: Palette.seffafBeyaz20,
    borderWidth: 2,
    borderColor: Palette.seffafBeyaz20,
  },
  avatarHarf: {
    fontFamily: Font.extrabold,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  adSoyad: {
    fontFamily: Font.bold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  email: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: t.headerSubtext,
    marginBottom: 10,
  },
  uyeRozet: {
    alignSelf: 'center',
  },

  // İstatistik kartları
  statSatir: {
    flexDirection: 'row',
    gap: 10,
  },
  statKart: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statSayi: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  statAciklama: {
    fontFamily: Font.semibold,
    fontSize: 11,
    textAlign: 'center',
  },

  // Menü kartı
  menuCard: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: Space.lg,
    paddingVertical: 10,
  },
  menuNokta: {
    width: 8,
    marginRight: 14,
    alignItems: 'center',
  },
  menuText: {
    fontFamily: Font.semibold,
    fontSize: 14,
  },
  menuAlt: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginTop: 2,
  },

  // Cikis
  logoutBtn: {
    marginTop: 6,
  },
  hesapSilBtn: {
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  hesapSilText: {
    fontFamily: Font.semibold,
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  misafirSoru: {
    fontFamily: Font.extrabold,
    fontSize: 44,
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

  // Modal ortak
  modalKav: {
    flex: 1,
  },
  modalKaydetBtn: {
    marginTop: 4,
  },

  // Düzenleme input
  inputLabel: {
    fontFamily: Font.semibold,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    fontFamily: Font.regular,
    borderRadius: Radius.md,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  // Eyl 2026: Dillerim çip seçici
  dilNot: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginBottom: 8,
  },
  dilSarmal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  dilChipDokun: {
    minHeight: 32,
    justifyContent: 'center',
  },
  dilChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  // Hakkinda modal
  hakkindaAlt: {
    fontFamily: Font.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  hakkindaDivider: {
    height: 1,
    marginVertical: 16,
  },
  hakkindaDetay: {
    fontFamily: Font.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bildirim ayarları modal
  bildirimSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 12,
  },
  bildirimSol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  bildirimNokta: {
    width: 8,
    marginRight: 12,
    alignItems: 'center',
  },
  bildirimBaslik: {
    fontFamily: Font.semibold,
    fontSize: 14,
    marginBottom: 2,
  },
  bildirimAciklama: {
    fontFamily: Font.regular,
    fontSize: 11,
  },
});
