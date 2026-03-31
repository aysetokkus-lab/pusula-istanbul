import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';

// ─── Moderator yetki tanimlari ───────────────────
// Moderatorun erisebilecegi ekranlar
const MODERATOR_EKRANLARI = [
  '/admin-saha',        // Saha bildirimleri yonetimi
  '/admin-etkinlik',    // Kent etkinlikleri veri girisi
  '/admin-saatler',     // Sultanahmet Camii saat girisi (mekan saatleri icinde)
];

// ─── Admin Ana Panel ───────────────────────────────
export default function AdminPanel() {
  const insets = useSafeAreaInsets();
  const { rol, isAdmin, isYetkili, yukleniyor } = useAdmin();

  const [bekleyenRapor, setBekleyenRapor] = useState(0);
  const [toplamKullanici, setToplamKullanici] = useState(0);
  const [aktivBan, setAktivBan] = useState(0);

  // Moderator atama
  const [modEmail, setModEmail] = useState('');
  const [modIslem, setModIslem] = useState(false);
  const [moderatorlar, setModeratorlar] = useState<{ id: string; isim: string; soyisim: string; email: string }[]>([]);

  useEffect(() => {
    if (!isYetkili) return;

    const istatistikCek = async () => {
      // Bekleyen rapor sayısı
      const { count: raporSayisi } = await supabase
        .from('raporlanan_mesajlar')
        .select('*', { count: 'exact', head: true })
        .eq('durum', 'bekliyor');
      setBekleyenRapor(raporSayisi || 0);

      // Aktif ban sayısı
      const { count: banSayisi } = await supabase
        .from('banlanan_kullanicilar')
        .select('*', { count: 'exact', head: true })
        .eq('aktif', true);
      setAktivBan(banSayisi || 0);
    };

    istatistikCek();

    // Moderator listesini cek (sadece admin gorur)
    if (rol === 'admin') {
      moderatorlariCek();
    }
  }, [isYetkili, rol]);

  const moderatorlariCek = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, isim, soyisim, email')
      .eq('rol', 'moderator')
      .order('isim');
    setModeratorlar(data || []);
  };

  const moderatorAta = async () => {
    const email = modEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert('Hata', 'E-posta adresi giriniz.');
      return;
    }

    setModIslem(true);
    try {
      // Email ile profil bul
      const { data: profil, error } = await supabase
        .from('profiles')
        .select('id, isim, soyisim, rol')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;

      if (!profil) {
        Alert.alert('Bulunamadı', 'Bu e-posta ile kayıtlı kullanıcı yok.');
        return;
      }

      if (profil.rol === 'admin') {
        Alert.alert('Uyarı', 'Bu kullanıcı zaten admin.');
        return;
      }

      if (profil.rol === 'moderator') {
        Alert.alert('Uyarı', 'Bu kullanıcı zaten moderatör.');
        return;
      }

      // Moderator yap
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ rol: 'moderator' })
        .eq('id', profil.id);

      if (updateErr) throw updateErr;

      Alert.alert('Başarılı', `${profil.isim} ${profil.soyisim} moderatör olarak atandı.`);
      setModEmail('');
      moderatorlariCek();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Bir hata oluştu.');
    } finally {
      setModIslem(false);
    }
  };

  const moderatorKaldir = async (id: string, isim: string) => {
    Alert.alert(
      'Moderatör Kaldır',
      `${isim} adlı kullanıcının moderatörlüğünü kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('profiles')
              .update({ rol: 'user' })
              .eq('id', id);
            if (error) {
              Alert.alert('Hata', error.message);
            } else {
              Alert.alert('Başarılı', 'Moderatörlük kaldırıldı.');
              moderatorlariCek();
            }
          },
        },
      ]
    );
  };

  if (yukleniyor) {
    return (
      <View style={s.yukleniyorContainer}>
        <ActivityIndicator size="large" color="#0077B6" />
      </View>
    );
  }

  if (!isYetkili) {
    return (
      <View style={s.yukleniyorContainer}>
        <Text style={s.yetkisizBaslik}>Erişim Engellendi</Text>
        <Text style={s.yetkisizAlt}>Bu sayfayı görüntüleme yetkiniz yok.</Text>
        <TouchableOpacity style={s.geriBtn} onPress={() => router.back()}>
          <Text style={s.geriBtnYazi}>Geri Dön</Text>

        </TouchableOpacity>
      </View>
    );
  }

  const tumMenuItems = [
    {
      baslik: 'Saha Bildirimleri',
      aciklama: 'Aktif saha durumu bildirimlerini yonet',
      hedef: '/admin-saha' as const,
      renk: '#10B981',
      sadece: 'herkes' as const,
    },
    {
      baslik: 'Etkinlik Yonetimi',
      aciklama: 'Kent etkinliklerini ekle, duzenle, sil',
      hedef: '/admin-etkinlik' as const,
      renk: '#0077B6',
      sadece: 'herkes' as const,
    },
    {
      baslik: 'Sohbet Moderasyonu',
      aciklama: bekleyenRapor > 0
        ? `${bekleyenRapor} bekleyen rapor var`
        : 'Raporlanan mesajları incele',
      hedef: '/admin-moderasyon' as const,
      renk: bekleyenRapor > 0 ? '#D62828' : '#0096C7',
      badge: bekleyenRapor,
      sadece: 'admin' as const,
    },
    {
      baslik: 'Banlanan Kullanıcılar',
      aciklama: `${aktivBan} aktif ban`,
      hedef: '/admin-banlar' as const,
      renk: '#E09F3E',
      sadece: 'admin' as const,
    },
    {
      baslik: 'Küfür Listesi',
      aciklama: 'Yasaklı kelimeleri yönet',
      hedef: '/admin-kufur' as const,
      renk: '#7B8FA1',
      sadece: 'admin' as const,
    },
    {
      baslik: 'Mekan Saatleri',
      aciklama: 'Müze, saray, cami açılış/kapanış saatleri',
      hedef: '/admin-saatler' as const,
      renk: '#0077B6',
      sadece: 'herkes' as const,
    },
    {
      baslik: 'Ulaşım Tarifeleri',
      aciklama: 'Havalimanı seferleri ve boğaz turları',
      hedef: '/admin-ulasim-tarife' as const,
      renk: '#48CAE4',
      sadece: 'admin' as const,
    },
    {
      baslik: 'Acil Durum Rehberi',
      aciklama: 'Numara, kurum ve faydalı link yönetimi',
      hedef: '/admin-acil' as const,
      renk: '#D62828',
      sadece: 'admin' as const,
    },
  ];

  // Moderator sadece izin verilen ekranlari gorur
  const menuItems = tumMenuItems.filter(item =>
    isAdmin || item.sadece === 'herkes'
  );

  return (
    <ScrollView style={s.container}>
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Geri</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Admin Panel</Text>
        <Text style={s.headerAlt}>
          Rol: {rol === 'admin' ? 'Yönetici' : 'Moderatör'}
        </Text>
      </LinearGradient>

      <View style={s.icerik}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={s.menuKart}
            onPress={() => router.push(item.hedef)}
            activeOpacity={0.7}
          >
            <View style={[s.menuRenk, { backgroundColor: item.renk }]} />
            <View style={s.menuBilgi}>
              <Text style={s.menuBaslik}>{item.baslik}</Text>
              <Text style={s.menuAciklama}>{item.aciklama}</Text>
            </View>
            {item.badge && item.badge > 0 ? (
              <View style={s.badge}>
                <Text style={s.badgeYazi}>{item.badge}</Text>
              </View>
            ) : (
              <Text style={s.menuOk}>{'>'}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Moderator Yonetimi (sadece admin gorur) ─── */}
      {isAdmin && (
        <View style={s.modBolum}>
          <Text style={s.modBolumBaslik}>Moderatör Yönetimi</Text>
          <Text style={s.modBolumAciklama}>
            Moderatörler sadece saha durumu bildirimi, kent etkinlikleri ve Sultanahmet Camii saat girişine erişebilir.
          </Text>

          {/* Atama formu */}
          <View style={s.modForm}>
            <TextInput
              style={s.modInput}
              placeholder="Kullanıcı e-posta adresi"
              placeholderTextColor="#94A3B8"
              value={modEmail}
              onChangeText={setModEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!modIslem}
            />
            <TouchableOpacity
              style={[s.modAtaBtn, modIslem && { opacity: 0.5 }]}
              onPress={moderatorAta}
              disabled={modIslem}
            >
              {modIslem ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={s.modAtaBtnYazi}>Ata</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Mevcut moderatorler */}
          {moderatorlar.length > 0 ? (
            <View style={s.modListe}>
              <Text style={s.modListeBaslik}>Aktif Moderatörler ({moderatorlar.length})</Text>
              {moderatorlar.map(m => (
                <View key={m.id} style={s.modSatir}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.modIsim}>{m.isim} {m.soyisim}</Text>
                    <Text style={s.modMail}>{m.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.modKaldirBtn}
                    onPress={() => moderatorKaldir(m.id, `${m.isim} ${m.soyisim}`)}
                  >
                    <Text style={s.modKaldirBtnYazi}>Kaldir</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.modBos}>Henüz atanmış moderatör yok.</Text>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  yukleniyorContainer: {
    flex: 1, backgroundColor: '#F5F7FA',
    justifyContent: 'center', alignItems: 'center',
  },
  yetkisizBaslik: {
    fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8,
  },
  yetkisizAlt: {
    fontSize: 14, color: '#64748B', marginBottom: 24,
  },
  geriBtn: {
    backgroundColor: '#0077B6', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  geriBtnYazi: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Header
  header: { paddingBottom: 20, paddingHorizontal: 16 },
  geriTus: { marginBottom: 12 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: {
    color: '#FFF', fontSize: 24, fontWeight: '800', textAlign: 'center',
  },
  headerAlt: {
    color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4,
  },

  // Menü
  icerik: { padding: 16 },
  menuKart: {
    backgroundColor: '#FFF', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  menuRenk: { width: 5, alignSelf: 'stretch' },
  menuBilgi: { flex: 1, padding: 16 },
  menuBaslik: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  menuAciklama: { fontSize: 12, color: '#64748B', marginTop: 3 },
  menuOk: { color: '#94A3B8', fontSize: 20, marginRight: 16 },
  badge: {
    backgroundColor: '#D62828', borderRadius: 12,
    minWidth: 24, height: 24, alignItems: 'center',
    justifyContent: 'center', marginRight: 16, paddingHorizontal: 8,
  },
  badgeYazi: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Moderator Yonetimi
  modBolum: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#FFF', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  modBolumBaslik: {
    fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4,
  },
  modBolumAciklama: {
    fontSize: 12, color: '#64748B', marginBottom: 16, lineHeight: 18,
  },
  modForm: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  modInput: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0',
  },
  modAtaBtn: {
    backgroundColor: '#0077B6', borderRadius: 10,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  modAtaBtnYazi: {
    color: '#FFF', fontWeight: '700', fontSize: 14,
  },
  modListe: { marginTop: 4 },
  modListeBaslik: {
    fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 10,
  },
  modSatir: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modIsim: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  modMail: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  modKaldirBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  modKaldirBtnYazi: {
    color: '#D62828', fontSize: 12, fontWeight: '700',
  },
  modBos: {
    fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 4,
  },
});
