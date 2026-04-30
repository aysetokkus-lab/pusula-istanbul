import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../hooks/use-admin';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import type { TemaRenkleri } from '../constants/theme';

interface KufurKelime {
  id: string;
  kelime: string;
  seviye: 'kesin' | 'suphe';
  aktif: boolean;
}

export default function AdminKufur() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili, yukleniyor: adminYukleniyor } = useAdmin();

  const [kelimeler, setKelimeler] = useState<KufurKelime[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [yeniKelime, setYeniKelime] = useState('');
  const [yeniSeviye, setYeniSeviye] = useState<'kesin' | 'suphe'>('kesin');

  const cek = useCallback(async () => {
    const { data } = await supabase
      .from('kufur_listesi')
      .select('*')
      .order('seviye', { ascending: true })
      .order('kelime', { ascending: true });
    if (data) setKelimeler(data);
    setYukleniyor(false);
    setYenileniyor(false);
  }, []);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const ekle = async () => {
    const temiz = yeniKelime.trim().toLowerCase();
    if (!temiz) return;

    const { error } = await supabase.from('kufur_listesi').insert({
      kelime: temiz,
      seviye: yeniSeviye,
      aktif: true,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Zaten var', 'Bu kelime listede zaten mevcut.');
      } else {
        Alert.alert('Hata', error.message);
      }
    } else {
      setYeniKelime('');
      cek();
    }
  };

  const sil = (k: KufurKelime) => {
    Alert.alert(
      'Kelimeyi Sil',
      `"${k.kelime}" listeden kaldırılacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            await supabase.from('kufur_listesi').delete().eq('id', k.id);
            cek();
          },
        },
      ]
    );
  };

  const seviyeDegistir = async (k: KufurKelime) => {
    const yeni = k.seviye === 'kesin' ? 'suphe' : 'kesin';
    await supabase
      .from('kufur_listesi')
      .update({ seviye: yeni })
      .eq('id', k.id);
    cek();
  };

  if (adminYukleniyor || yukleniyor) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0077B6" />
      </View>
    );
  }

  if (!isYetkili) { router.back(); return null; }

  const kesinler = kelimeler.filter(k => k.seviye === 'kesin');
  const supheler = kelimeler.filter(k => k.seviye === 'suphe');

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
        <Text style={s.headerBaslik}>Küfür Listesi</Text>
        <Text style={s.headerAlt}>{kelimeler.length} kelime</Text>
      </LinearGradient>

      {/* Yeni kelime ekle */}
      <View style={s.ekleBar}>
        <TextInput
          style={s.ekleInput}
          value={yeniKelime}
          onChangeText={setYeniKelime}
          placeholder="Yeni kelime ekle..."
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[s.seviyeBtn, yeniSeviye === 'kesin' ? s.kesinBtn : s.supheBtn]}
          onPress={() => setYeniSeviye(yeniSeviye === 'kesin' ? 'suphe' : 'kesin')}
        >
          <Text style={s.seviyeBtnYazi}>
            {yeniSeviye === 'kesin' ? 'Kesin' : 'Şüphe'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ekleBtn} onPress={ekle}>
          <Text style={s.ekleBtnYazi}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.liste}
        refreshControl={
          <RefreshControl refreshing={yenileniyor} onRefresh={() => { setYenileniyor(true); cek(); }} />
        }
      >
        {/* Kesin engellenenler */}
        <Text style={s.bolumBaslik}>
          Kesin Engel ({kesinler.length})
        </Text>
        <Text style={s.bolumAciklama}>Bu kelimeler mesajın gönderilmesini engeller</Text>
        <View style={s.kelimeGrid}>
          {kesinler.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[s.kelimeChip, s.kesinChip]}
              onLongPress={() => sil(k)}
              onPress={() => seviyeDegistir(k)}
            >
              <Text style={s.kelimeChipYazi}>{k.kelime}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Şüpheli */}
        <Text style={[s.bolumBaslik, { marginTop: 24 }]}>
          Şüpheli ({supheler.length})
        </Text>
        <Text style={s.bolumAciklama}>Bu kelimeler admin kuyruğuna düşer, mesaj gönderilir</Text>
        <View style={s.kelimeGrid}>
          {supheler.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[s.kelimeChip, s.supheChip]}
              onLongPress={() => sil(k)}
              onPress={() => seviyeDegistir(k)}
            >
              <Text style={[s.kelimeChipYazi, { color: '#E09F3E' }]}>{k.kelime}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.ipucu}>
          <Text style={s.ipucuYazi}>
            Kelimeye dokun: seviye değiştir | Basılı tut: sil
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },

  header: { paddingBottom: 16, paddingHorizontal: 16 },
  geriTus: { marginBottom: 8 },
  geriTusYazi: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerBaslik: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  ekleBar: {
    flexDirection: 'row', padding: 16, gap: 8, alignItems: 'center',
  },
  ekleInput: {
    flex: 1, backgroundColor: t.bgCard, borderRadius: 10, padding: 12,
    fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder,
  },
  seviyeBtn: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
  },
  kesinBtn: { backgroundColor: '#FEE2E2' },
  supheBtn: { backgroundColor: '#FEF3C7' },
  seviyeBtnYazi: { fontSize: 12, fontWeight: '700', color: t.text },
  ekleBtn: {
    backgroundColor: '#0077B6', borderRadius: 10,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  ekleBtnYazi: { color: '#FFF', fontSize: 22, fontWeight: '700' },

  liste: { flex: 1, paddingHorizontal: 16 },

  bolumBaslik: {
    fontSize: 14, fontWeight: '700', color: t.text, marginBottom: 4,
  },
  bolumAciklama: {
    fontSize: 11, color: t.textMuted, marginBottom: 12,
  },

  kelimeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kelimeChip: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5,
  },
  kesinChip: {
    backgroundColor: '#FEE2E220', borderColor: '#D6282840',
  },
  supheChip: {
    backgroundColor: '#FEF3C720', borderColor: '#E09F3E40',
  },
  kelimeChipYazi: { fontSize: 13, fontWeight: '600', color: '#D62828' },

  ipucu: {
    marginTop: 32, alignItems: 'center',
  },
  ipucuYazi: { fontSize: 11, color: t.textMuted, fontStyle: 'italic' },
});
