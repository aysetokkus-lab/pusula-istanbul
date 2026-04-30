import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCanliDurum, durumBilgi, zamanOnce } from '../hooks/use-canli-durum';
import { useAdmin } from '../hooks/use-admin';
import { useTema } from '../hooks/use-tema';
import type { TemaRenkleri } from '../constants/theme';

export default function AdminSaha() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili, isAdmin, yukleniyor: adminYukleniyor } = useAdmin();
  const { durumlar, yukleniyor, durumKaldir, sabitlemeDegistir, tumunuTemizle, yenile } = useCanliDurum();
  const [siliniyor, setSiliniyor] = useState<string | null>(null);
  const [sabitleniyor, setSabitleniyor] = useState<string | null>(null);

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
        <Text style={s.yetkisizBaslik}>Erişim Engellendi</Text>
        <TouchableOpacity style={s.geriBtn} onPress={() => router.back()}>
          <Text style={s.geriBtnYazi}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sabitlenmiş bildirimler süre sınırından muaf
  const gecerliDurumlar = durumlar.filter(d => d.sabitlendi || d.dakika_once < 120);

  const tekBildirimKaldir = (id: string, mekanIsim: string) => {
    Alert.alert(
      'Bildirimi Kaldır',
      `"${mekanIsim}" için yapılan saha bildirimini kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
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
      Alert.alert('Bilgi', 'Kaldırılacak aktif bildirim yok.');
      return;
    }
    Alert.alert(
      'Tüm Bildirimleri Kaldır',
      `Aktif ${gecerliDurumlar.length} bildirimin tümünü kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hepsini Kaldır',
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
              <Text style={s.topluBtnYazi}>Tümünü Kaldır ({gecerliDurumlar.length})</Text>
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
              Şu an geçerli saha bildirimi bulunmuyor. Bildirimler 2 saat sonra otomatik olarak geçersiz olur.
            </Text>
          </View>
        ) : (
          gecerliDurumlar.map((d) => {
            const bilgi = durumBilgi(d.durum);
            return (
              <View key={d.id} style={[s.kart, d.sabitlendi && s.kartSabitKenarlık]}>
                <View style={[s.kartRenk, { backgroundColor: d.sabitlendi ? '#0077B6' : bilgi.renk }]} />
                <View style={s.kartIcerik}>
                  <View style={s.kartUst}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      {d.sabitlendi && (
                        <View style={s.sabitBadge}>
                          <Text style={s.sabitBadgeYazi}>SABiT</Text>
                        </View>
                      )}
                      <Text style={s.kartMekan} numberOfLines={1}>{d.nokta_isim}</Text>
                    </View>
                    <Text style={[s.kartDurum, { color: bilgi.renk }]}>{bilgi.label}</Text>
                  </View>

                  {d.bekleme_dk ? (
                    <Text style={s.kartDetay}>Bekleme: ~{d.bekleme_dk} dk</Text>
                  ) : null}

                  {d.not_metni ? (
                    <Text style={s.kartNot}>{d.not_metni}</Text>
                  ) : null}

                  {d.kapali_bolum ? (
                    <Text style={s.kartDetay}>Kapalı bölüm: {d.kapali_bolum}</Text>
                  ) : null}

                  <View style={s.kartAlt}>
                    <Text style={s.kartRehber}>
                      {d.rehber_isim ?? 'Bilinmeyen'} - {zamanOnce(d.dakika_once)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {/* Sabitle / Kaldir butonu */}
                      <TouchableOpacity
                        style={d.sabitlendi ? s.sabitCozBtn : s.sabitleBtn}
                        onPress={async () => {
                          setSabitleniyor(d.id);
                          await sabitlemeDegistir(d.id, !d.sabitlendi);
                          setSabitleniyor(null);
                        }}
                        disabled={sabitleniyor === d.id}
                      >
                        {sabitleniyor === d.id ? (
                          <ActivityIndicator size="small" color="#0077B6" />
                        ) : (
                          <Text style={d.sabitlendi ? s.sabitCozBtnYazi : s.sabitlBtnYazi}>
                            {d.sabitlendi ? 'Sabiti Kaldır' : 'Sabitle'}
                          </Text>
                        )}
                      </TouchableOpacity>
                      {/* Bildirimi kaldir butonu */}
                      <TouchableOpacity
                        style={s.kaldirBtn}
                        onPress={() => tekBildirimKaldir(d.id, d.nokta_isim)}
                        disabled={siliniyor === d.id}
                      >
                        {siliniyor === d.id ? (
                          <ActivityIndicator size="small" color="#D62828" />
                        ) : (
                          <Text style={s.kaldirBtnYazi}>Kaldır</Text>
                        )}
                      </TouchableOpacity>
                    </View>
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

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  yukleniyorContainer: {
    flex: 1, backgroundColor: t.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  yetkisizBaslik: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 16 },
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
  bosBaslik: { fontSize: 16, fontWeight: '700', color: t.textSecondary, marginBottom: 8 },
  bosAlt: { fontSize: 13, color: t.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Kart
  kart: {
    backgroundColor: t.bgCard, borderRadius: 12,
    flexDirection: 'row', overflow: 'hidden',
    marginBottom: 10, borderWidth: 1, borderColor: t.kartBorder,
  },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartIcerik: { flex: 1, padding: 14 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kartMekan: { fontSize: 15, fontWeight: '700', color: t.text, flex: 1 },
  kartDurum: { fontSize: 13, fontWeight: '600' },
  kartDetay: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  kartNot: { fontSize: 12, color: t.textSecondary, fontStyle: 'italic', marginTop: 4 },
  kartAlt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.divider,
  },
  kartRehber: { fontSize: 11, color: t.textMuted, flex: 1 },
  kaldirBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  kaldirBtnYazi: { color: '#D62828', fontSize: 12, fontWeight: '700' },

  // Sabitleme
  kartSabitKenarlık: { borderColor: '#B0D4E8', borderWidth: 1.5, backgroundColor: t.bgSecondary },
  sabitBadge: {
    backgroundColor: '#0077B620', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  sabitBadgeYazi: { color: '#0077B6', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  sabitleBtn: {
    backgroundColor: '#D6EAF8', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  sabitlBtnYazi: { color: '#0077B6', fontSize: 12, fontWeight: '700' },
  sabitCozBtn: {
    backgroundColor: '#FFF3E0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  sabitCozBtnYazi: { color: '#E09F3E', fontSize: 12, fontWeight: '700' },
});
