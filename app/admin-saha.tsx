import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCanliDurum, durumBilgi, zamanOnce } from '../hooks/use-canli-durum';
import { useAdmin } from '../hooks/use-admin';

export default function AdminSaha() {
  const insets = useSafeAreaInsets();
  const { isYetkili, isAdmin, yukleniyor: adminYukleniyor } = useAdmin();
  const { durumlar, yukleniyor, durumKaldir, tumunuTemizle, yenile } = useCanliDurum();
  const [siliniyor, setSiliniyor] = useState<string | null>(null);

  if (adminYukleniyor || yukleniyor) {
    return (
      <View style={s.yukleniyorContainer}>
        <ActivityIndicator size="large" color="#0077B6" />
      </View>
    );
  }

  if (!isYetkili) {
    return (
      <View style={s.yukleniyorContainer}>
        <Text style={s.yetkisizBaslik}>Erisim Engellendi</Text>
        <TouchableOpacity style={s.geriBtn} onPress={() => router.back()}>
          <Text style={s.geriBtnYazi}>Geri Don</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gecerliDurumlar = durumlar.filter(d => d.dakika_once < 120);

  const tekBildirimKaldir = (id: string, mekanIsim: string) => {
    Alert.alert(
      'Bildirimi Kaldir',
      `"${mekanIsim}" icin yapilan saha bildirimini kaldirmak istediginize emin misiniz?`,
      [
        { text: 'Vazgec', style: 'cancel' },
        {
          text: 'Kaldir',
          style: 'destructive',
          onPress: async () => {
            setSiliniyor(id);
            await durumKaldir(id);
            setSiliniyor(null);
          },
        },
      ],
    );
  };

  const topluTemizle = () => {
    if (gecerliDurumlar.length === 0) {
      Alert.alert('Bilgi', 'Kaldirilacak aktif bildirim yok.');
      return;
    }
    Alert.alert(
      'Tum Bildirimleri Kaldir',
      `Aktif ${gecerliDurumlar.length} bildirimin tumunu kaldirmak istediginize emin misiniz?`,
      [
        { text: 'Vazgec', style: 'cancel' },
        {
          text: 'Hepsini Kaldir',
          style: 'destructive',
          onPress: async () => {
            setSiliniyor('all');
            await tumunuTemizle();
            setSiliniyor(null);
          },
        },
      ],
    );
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#005A8D', '#0077B6', '#0096C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.geriTus}>
          <Text style={s.geriTusYazi}>{'<'} Geri</Text>
        </TouchableOpacity>
        <Text style={s.headerBaslik}>Saha Bildirimleri</Text>
        <Text style={s.headerAlt}>
          {gecerliDurumlar.length} aktif bildirim
        </Text>
      </LinearGradient>

      {/* Toplu temizle butonu */}
      {isAdmin && gecerliDurumlar.length > 0 && (
        <View style={s.topluBar}>
          <TouchableOpacity
            style={s.topluBtn}
            onPress={topluTemizle}
            disabled={siliniyor === 'all'}
          >
            {siliniyor === 'all' ? (
              <ActivityIndicator size="small" color="#D62828" />
            ) : (
              <Text style={s.topluBtnYazi}>Tumunu Kaldir ({gecerliDurumlar.length})</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={s.liste}
        contentContainerStyle={s.listeIcerik}
        refreshControl={
          <RefreshControl refreshing={yukleniyor} onRefresh={yenile} colors={['#0077B6']} />
        }
      >
        {gecerliDurumlar.length === 0 ? (
          <View style={s.bosKutu}>
            <Text style={s.bosBaslik}>Aktif bildirim yok</Text>
            <Text style={s.bosAlt}>
              Su an gecerli saha bildirimi bulunmuyor. Bildirimler 2 saat sonra otomatik olarak gecersiz olur.
            </Text>
          </View>
        ) : (
          gecerliDurumlar.map((d) => {
            const bilgi = durumBilgi(d.durum);
            return (
              <View key={d.id} style={s.kart}>
                <View style={[s.kartRenk, { backgroundColor: bilgi.renk }]} />
                <View style={s.kartIcerik}>
                  <View style={s.kartUst}>
                    <Text style={s.kartMekan}>{d.nokta_isim}</Text>
                    <Text style={[s.kartDurum, { color: bilgi.renk }]}>{bilgi.label}</Text>
                  </View>

                  {d.bekleme_dk ? (
                    <Text style={s.kartDetay}>Bekleme: ~{d.bekleme_dk} dk</Text>
                  ) : null}

                  {d.not_metni ? (
                    <Text style={s.kartNot}>{d.not_metni}</Text>
                  ) : null}

                  {d.kapali_bolum ? (
                    <Text style={s.kartDetay}>Kapali bolum: {d.kapali_bolum}</Text>
                  ) : null}

                  <View style={s.kartAlt}>
                    <Text style={s.kartRehber}>
                      {d.rehber_isim ?? 'Bilinmeyen'} - {zamanOnce(d.dakika_once)}
                    </Text>
                    <TouchableOpacity
                      style={s.kaldirBtn}
                      onPress={() => tekBildirimKaldir(d.id, d.nokta_isim)}
                      disabled={siliniyor === d.id}
                    >
                      {siliniyor === d.id ? (
                        <ActivityIndicator size="small" color="#D62828" />
                      ) : (
                        <Text style={s.kaldirBtnYazi}>Kaldir</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  yukleniyorContainer: {
    flex: 1, backgroundColor: '#F5F7FA',
    justifyContent: 'center', alignItems: 'center',
  },
  yetkisizBaslik: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
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
    color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  headerAlt: {
    color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4,
  },

  // Toplu temizle
  topluBar: { paddingHorizontal: 16, paddingTop: 12 },
  topluBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  topluBtnYazi: { color: '#D62828', fontWeight: '700', fontSize: 14 },

  // Liste
  liste: { flex: 1 },
  listeIcerik: { padding: 16 },

  // Bos
  bosKutu: { alignItems: 'center', paddingTop: 60 },
  bosBaslik: { fontSize: 16, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  bosAlt: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Kart
  kart: {
    backgroundColor: '#FFF', borderRadius: 12,
    flexDirection: 'row', overflow: 'hidden',
    marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartIcerik: { flex: 1, padding: 14 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kartMekan: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },
  kartDurum: { fontSize: 13, fontWeight: '600' },
  kartDetay: { fontSize: 12, color: '#64748B', marginTop: 2 },
  kartNot: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 4 },
  kartAlt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  kartRehber: { fontSize: 11, color: '#94A3B8', flex: 1 },
  kaldirBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  kaldirBtnYazi: { color: '#D62828', fontSize: 12, fontWeight: '700' },
});
