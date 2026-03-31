import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';

interface Ban {
  id: string;
  kullanici_id: string;
  sebep: string;
  sure_dk: number | null;
  bitis_tarihi: string | null;
  aktif: boolean;
  created_at: string;
  // join
  profil_isim?: string;
}

export default function AdminBanlar() {
  const insets = useSafeAreaInsets();
  const { isYetkili, yukleniyor: adminYukleniyor } = useAdmin();

  const [banlar, setBanlar] = useState<Ban[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const cek = useCallback(async () => {
    const { data } = await supabase
      .from('banlanan_kullanicilar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Profil isimlerini çek
      const ids = [...new Set(data.map(b => b.kullanici_id))];
      const { data: profiller } = await supabase
        .from('profiles')
        .select('id, isim, soyisim')
        .in('id', ids);

      const profilMap: Record<string, string> = {};
      profiller?.forEach(p => {
        profilMap[p.id] = `${p.isim || ''} ${p.soyisim || ''}`.trim();
      });

      setBanlar(data.map(b => ({
        ...b,
        profil_isim: profilMap[b.kullanici_id] || 'Bilinmeyen',
      })));
    }
    setYukleniyor(false);
    setYenileniyor(false);
  }, []);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const banKaldir = (ban: Ban) => {
    Alert.alert(
      'Banı Kaldır',
      `${ban.profil_isim} için ban kaldırılacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          onPress: async () => {
            await supabase
              .from('banlanan_kullanicilar')
              .update({ aktif: false })
              .eq('id', ban.id);
            cek();
          },
        },
      ]
    );
  };

  if (adminYukleniyor || yukleniyor) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0077B6" />
      </View>
    );
  }

  if (!isYetkili) { router.back(); return null; }

  const aktifBanlar = banlar.filter(b => b.aktif);
  const kaldirilmisBanlar = banlar.filter(b => !b.aktif);

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Admin Panel</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Banlanan Kullanıcılar</Text>
        <Text style={s.headerAlt}>{aktifBanlar.length} aktif ban</Text>
      </LinearGradient>

      <ScrollView
        style={s.liste}
        refreshControl={
          <RefreshControl refreshing={yenileniyor} onRefresh={() => { setYenileniyor(true); cek(); }} />
        }
      >
        {aktifBanlar.length === 0 && (
          <View style={s.bosContainer}>
            <Text style={s.bosYazi}>Aktif ban yok</Text>
          </View>
        )}

        {aktifBanlar.map(b => (
          <View key={b.id} style={s.kart}>
            <View style={s.kartUst}>
              <View style={s.kartBilgi}>
                <Text style={s.kartIsim}>{b.profil_isim}</Text>
                <Text style={s.kartSebep}>{b.sebep}</Text>
                <Text style={s.kartTarih}>
                  {new Date(b.created_at).toLocaleString('tr-TR')}
                  {b.bitis_tarihi
                    ? ` — ${new Date(b.bitis_tarihi).toLocaleString('tr-TR')}'e kadar`
                    : ' — Kalıcı'}
                </Text>
              </View>
              <View style={s.aktifBadge}>
                <Text style={s.aktifBadgeYazi}>Aktif</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.kaldirBtn}
              onPress={() => banKaldir(b)}
            >
              <Text style={s.kaldirBtnYazi}>Banı Kaldır</Text>
            </TouchableOpacity>
          </View>
        ))}

        {kaldirilmisBanlar.length > 0 && (
          <>
            <Text style={s.bolumBaslik}>Kaldırılmış Banlar</Text>
            {kaldirilmisBanlar.map(b => (
              <View key={b.id} style={[s.kart, s.kartPasif]}>
                <Text style={s.kartIsim}>{b.profil_isim}</Text>
                <Text style={s.kartSebep}>{b.sebep}</Text>
                <Text style={s.kartTarih}>
                  {new Date(b.created_at).toLocaleString('tr-TR')} — Kaldırıldı
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },

  header: { paddingBottom: 16, paddingHorizontal: 16 },
  geriTus: { marginBottom: 8 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  liste: { flex: 1, padding: 16 },
  bosContainer: { paddingVertical: 60, alignItems: 'center' },
  bosYazi: { color: '#94A3B8', fontSize: 15 },

  bolumBaslik: {
    fontSize: 13, fontWeight: '600', color: '#8A9BAE',
    marginTop: 24, marginBottom: 12,
  },

  kart: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  kartPasif: { opacity: 0.5 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kartBilgi: { flex: 1, marginRight: 12 },
  kartIsim: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  kartSebep: { fontSize: 12, color: '#64748B', marginTop: 4 },
  kartTarih: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  aktifBadge: {
    backgroundColor: '#FEE2E2', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  aktifBadgeYazi: { fontSize: 11, fontWeight: '700', color: '#D62828' },

  kaldirBtn: {
    backgroundColor: '#EAF4FB', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center', marginTop: 12,
  },
  kaldirBtnYazi: { fontSize: 13, fontWeight: '700', color: '#0077B6' },
});
