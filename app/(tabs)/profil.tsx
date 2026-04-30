import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import { useTema, type TemaTercihi } from '../../hooks/use-tema';
import { Palette, Radius, Space, type TemaRenkleri } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../hooks/use-admin';
import { useAbonelik } from '../../hooks/use-abonelik';
import { ENTITLEMENT_ID } from '../../lib/revenuecat';
import {
  useBildirimTercihleri,
  BILDIRIM_KATEGORI_BILGI,
  type BildirimKategori,
} from '../../hooks/use-bildirim-tercihleri';

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

/* ═══════════════════════════════════════════
   Ana Bileşen
   ═══════════════════════════════════════════ */
export default function ProfilEkrani() {
  const insets = useSafeAreaInsets();
  const { t, isDark, tercih, setTercih } = useTema();

  const [kullanici, setKullanici] = useState<KullaniciBilgi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);

  // Düzenleme modal
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const [editIsim, setEditIsim] = useState('');
  const [editSoyisim, setEditSoyisim] = useState('');

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

  // Abonelik hook'u
  const abonelik = useAbonelik();

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

    // Isim degismemisse direkt kapat
    if (eskiIsim === yeniIsim && eskiSoyisim === yeniSoyisim) {
      setDuzenleAcik(false);
      return;
    }

    setKayitYukleniyor(true);
    try {
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

  /* ─── Satin almalari geri yukle (Apple 3.1.1 zorunlu) ─── */
  const satinAlmalariGeriYukle = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const aktif = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (aktif) {
        if (kullanici) {
          await supabase.from('profiles').update({
            abonelik_durumu: 'aktif',
          }).eq('id', kullanici.id);
        }
        Alert.alert('Başarılı', 'Aboneliğiniz geri yüklendi. Uygulamayı yeniden başlatmanız gerekebilir.');
      } else {
        Alert.alert(
          'Aktif Abonelik Bulunamadı',
          'Bu Apple ID / Google hesabı ile ilişkili aktif bir abonelik bulunamadı.'
        );
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Geri yükleme başarısız.');
    }
  };

  /* ─── Geri bildirim gonder ─── */
  const geriBildirimGonder = () => {
    const konu = encodeURIComponent('Pusula İstanbul - Geri Bildirim');
    const govde = encodeURIComponent(`\n\n---\nKullanıcı: ${kullanici?.profil.isim} ${kullanici?.profil.soyisim}\nE-posta: ${kullanici?.email}\nSürüm: v1.0.0`);
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
    setDuzenleAcik(true);
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
        <LinearGradient
          colors={[t.headerGradientStart, t.headerGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Text style={styles.headerTitle}>Profil</Text>
        </LinearGradient>

        <View style={styles.misafirIcerik}>
          <View style={[styles.misafirIkon, { backgroundColor: t.bgSecondary }]}>
            <Text style={{ fontSize: 48, color: '#94A3B8' }}>?</Text>
          </View>
          <Text style={[styles.misafirBaslik, { color: t.text }]}>Misafir Modu</Text>
          <Text style={[styles.misafirAciklama, { color: t.textSecondary }]}>
            Profilinizi görmek, yoğunluk bildirmek ve uygulamanın tüm özelliklerinden faydalanmak için giriş yapın.
          </Text>
          <TouchableOpacity
            style={[styles.girisBtn, { backgroundColor: t.primary }]}
            onPress={() => router.replace('/giris')}
          >
            <Text style={styles.girisBtnYazi}>Giriş Yap / Kayıt Ol</Text>
          </TouchableOpacity>
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
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[t.headerGradientStart, t.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Profil</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollIcerik}>
        {/* ── Avatar + İsim ── */}
        <View style={styles.avatarBolum}>
          <LinearGradient
            colors={[Palette.istanbulMavi, Palette.maviKoyu]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarDaire}
          >
            <Text style={styles.avatarHarf}>{initialler}</Text>
          </LinearGradient>
          <Text style={[styles.adSoyad, { color: t.text }]}>{adSoyad}</Text>
          <Text style={[styles.email, { color: t.textSecondary }]}>{email}</Text>
          <View style={[styles.etiketSatir]}>
            <View style={[styles.etiket, { backgroundColor: `${Palette.istanbulMavi}20` }]}>
              <Text style={[styles.etiketYazi, { color: Palette.istanbulMavi }]}>Üye: {tarihFormat(kayitTarihi)}</Text>
            </View>
          </View>
        </View>

        {/* ── Mini Istatistik Kartlari ── */}
        <View style={styles.statSatir}>
          <View style={[styles.statKart, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
            <Text style={[styles.statSayi, { color: t.text }]}>{bildirimSayisi}</Text>
            <Text style={[styles.statAciklama, { color: t.textSecondary }]}>Saha Bildirimi</Text>
          </View>
          <View style={[styles.statKart, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
            <Text style={[styles.statSayi, { color: abonelik.premiumMi ? Palette.acik : Palette.kapali }]}>
              {abonelik.premiumMi ? 'Premium' : 'Ücretsiz'}
            </Text>
            <Text style={[styles.statAciklama, { color: t.textSecondary }]}>
              Hesap Durumu
            </Text>
          </View>
        </View>

        {/* ── Hesap Ayarlari ── */}
        <View style={[styles.menuCard, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: t.divider }]} onPress={duzenleAc}>
            <View style={[styles.menuDot, { backgroundColor: Palette.istanbulMavi }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Profili Düzenle</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: t.divider }]} onPress={() => { setYeniSifre(''); setYeniSifreTekrar(''); setSifreAcik(true); }}>
            <View style={[styles.menuDot, { backgroundColor: Palette.istanbulMavi }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Şifre Değiştir</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: t.divider }]} onPress={() => setBildirimAyarAcik(true)}>
            <View style={[styles.menuDot, { backgroundColor: Palette.istanbulMavi }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuText, { color: t.text }]}>Bildirim Ayarları</Text>
              <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                {Object.values(bildirimTercihleri).filter(Boolean).length} / {Object.keys(bildirimTercihleri).length} kategori açık
              </Text>
            </View>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
          {/* ── Görünüm (Tema) Seçici ── */}
          <View style={[styles.menuItem, { borderBottomColor: t.divider }]}>
            <View style={[styles.menuDot, { backgroundColor: '#8B5CF6' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuText, { color: t.text, marginBottom: 8 }]}>Görünüm</Text>
              <View style={styles.temaBtnSatir}>
                {([
                  { key: 'sistem' as TemaTercihi, label: 'Sistem' },
                  { key: 'acik' as TemaTercihi, label: 'Açık' },
                  { key: 'koyu' as TemaTercihi, label: 'Koyu' },
                ]).map((item) => {
                  const secili = tercih === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.temaBtn,
                        { borderColor: secili ? Palette.istanbulMavi : t.kartBorder, backgroundColor: secili ? `${Palette.istanbulMavi}15` : t.bgCard },
                      ]}
                      onPress={() => setTercih(item.key)}
                    >
                      <View style={[styles.temaRadio, { borderColor: secili ? Palette.istanbulMavi : t.textMuted }]}>
                        {secili && <View style={[styles.temaRadioIc, { backgroundColor: Palette.istanbulMavi }]} />}
                      </View>
                      <Text style={[styles.temaBtnYazi, { color: secili ? Palette.istanbulMavi : t.textSecondary }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setHakkindaAcik(true)}>
            <View style={[styles.menuDot, { backgroundColor: Palette.istanbulMavi }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Hakkında</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Destek ── */}
        <View style={[styles.menuCard, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: t.divider }]} onPress={geriBildirimGonder}>
            <View style={[styles.menuDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Geri Bildirim Gönder</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: t.divider }]} onPress={satinAlmalariGeriYukle}>
            <View style={[styles.menuDot, { backgroundColor: '#0077B6' }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Satın Almaları Geri Yükle</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: t.divider }]} onPress={() => router.push('/kullanim-kosullari' as any)}>
            <View style={[styles.menuDot, { backgroundColor: '#64748B' }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Kullanım Koşulları</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/gizlilik-politikasi' as any)}>
            <View style={[styles.menuDot, { backgroundColor: '#64748B' }]} />
            <Text style={[styles.menuText, { color: t.text }]}>Gizlilik Politikası</Text>
            <Text style={[styles.menuOk, { color: t.textMuted }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Admin Panel — sadece yetkililere gorunur ── */}
        {isYetkili && (
          <View style={[styles.menuCard, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/admin')}>
              <View style={[styles.menuDot, { backgroundColor: '#0077B6' }]} />
              <Text style={[styles.menuText, { color: '#0077B6' }]}>Admin Panel</Text>
              <Text style={[styles.menuOk, { color: '#0077B6' }]}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Cikis ve Hesap Sil ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={cikisYap}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hesapSilBtn} onPress={hesabiSil}>
          <Text style={styles.hesapSilText}>Hesabımı Sil</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ════════════════════════════════════════
          MODAL — Profili Düzenle
         ════════════════════════════════════════ */}
      <Modal visible={duzenleAcik} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalKutu, { backgroundColor: t.modalBg }]}>
            <Text style={[styles.modalBaslik, { color: t.text }]}>Profili Düzenle</Text>

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

            <View style={styles.modalBtnSatir}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: t.bgSecondary }]}
                onPress={() => setDuzenleAcik(false)}
              >
                <Text style={[styles.modalBtnYazi, { color: t.text }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Palette.istanbulMavi }]}
                onPress={profilGuncelle}
                disabled={kayitYukleniyor}
              >
                {kayitYukleniyor ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalBtnYazi, { color: '#fff' }]}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════
          MODAL — Sifre Degistir
         ════════════════════════════════════════ */}
      <Modal visible={sifreAcik} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalKutu, { backgroundColor: t.modalBg }]}>
            <Text style={[styles.modalBaslik, { color: t.text }]}>Şifre Değiştir</Text>

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

            <View style={styles.modalBtnSatir}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: t.bgSecondary }]}
                onPress={() => setSifreAcik(false)}
              >
                <Text style={[styles.modalBtnYazi, { color: t.text }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Palette.istanbulMavi }]}
                onPress={sifreDegistir}
                disabled={sifreYukleniyor}
              >
                {sifreYukleniyor ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalBtnYazi, { color: '#fff' }]}>Değiştir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════
          MODAL — Hakkında
         ════════════════════════════════════════ */}
      <Modal visible={hakkindaAcik} animationType="fade" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setHakkindaAcik(false)}>
          <View style={[styles.modalKutu, { backgroundColor: t.modalBg }]}>
            <Text style={[styles.modalBaslik, { color: t.text, textAlign: 'center' }]}>Pusula İstanbul</Text>
            <Text style={[styles.hakkindaAlt, { color: t.textSecondary }]}>Pusula İstanbul v1.0.0</Text>
            <Text style={[styles.hakkindaAlt, { color: t.textSecondary, marginTop: 4 }]}>
              Profesyonel turist rehberleri için güncel saha bilgi uygulaması
            </Text>

            <View style={[styles.hakkindaDivider, { backgroundColor: t.divider }]} />

            <Text style={[styles.hakkindaDetay, { color: t.textMuted }]}>
              Geliştirici: Ayşe Tokkuş Bayar{'\n'}
              © 2026 Tüm hakları saklıdır.
            </Text>

            <TouchableOpacity
              style={[styles.modalKapatBtn, { backgroundColor: t.bgSecondary }]}
              onPress={() => setHakkindaAcik(false)}
            >
              <Text style={[styles.modalBtnYazi, { color: t.text }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* ════════════════════════════════════════
          MODAL — Bildirim Ayarları
         ════════════════════════════════════════ */}
      <Modal visible={bildirimAyarAcik} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBildirimAyarAcik(false)}>
          <View style={[styles.modalKutu, { backgroundColor: t.modalBg }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalBaslik, { color: t.text }]}>Bildirim Ayarları</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary, marginBottom: 16, marginTop: -12 }}>
              Hangi bildirim türlerini almak istediğinizi seçin
            </Text>

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
                    <View style={[styles.bildirimDot, { backgroundColor: aktif ? Palette.acik : t.textMuted }]} />
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
                    trackColor={{ false: t.divider, true: `${Palette.istanbulMavi}80` }}
                    thumbColor={aktif ? Palette.istanbulMavi : t.textMuted}
                  />
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.modalKapatBtn, { backgroundColor: t.bgSecondary }]}
              onPress={() => setBildirimAyarAcik(false)}
            >
              <Text style={[styles.modalBtnYazi, { color: t.text }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: Space.lg,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Scroll
  scrollIcerik: {
    paddingHorizontal: Space.lg,
    paddingTop: 24,
  },

  // Avatar bölümü
  avatarBolum: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarDaire: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  avatarHarf: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  adSoyad: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    marginBottom: 10,
  },

  // Etiketler
  etiketSatir: {
    flexDirection: 'row',
    gap: 8,
  },
  etiket: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  etiketYazi: {
    fontSize: 12,
    fontWeight: '600',
  },

  // İstatistik kartları
  statSatir: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statKart: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statSayi: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statAciklama: {
    fontSize: 11,
  },

  // Menü kartı
  menuCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 14,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  menuOk: {
    fontSize: 22,
    fontWeight: '300',
  },

  // Cikis
  logoutBtn: {
    backgroundColor: '#D62828',
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hesapSilBtn: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D62828',
  },
  hesapSilText: {
    color: '#D62828',
    fontSize: 13,
    fontWeight: '600',
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

  // Modal ortak
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalKutu: {
    borderRadius: Radius.lg,
    padding: 24,
  },
  modalBaslik: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalBtnSatir: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnYazi: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalKapatBtn: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  // Düzenleme input
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },

  // Hakkinda modal
  hakkindaAlt: {
    fontSize: 13,
    textAlign: 'center',
  },
  hakkindaDivider: {
    height: 1,
    marginVertical: 16,
  },
  hakkindaDetay: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bildirim ayarları modal
  bildirimSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  bildirimSol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  bildirimDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  bildirimBaslik: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bildirimAciklama: {
    fontSize: 11,
  },

  // Tema secici
  temaBtnSatir: {
    flexDirection: 'row',
    gap: 8,
  },
  temaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    gap: 6,
  },
  temaBtnYazi: {
    fontSize: 13,
    fontWeight: '600',
  },
  temaRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temaRadioIc: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
