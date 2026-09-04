/*
  Moderatör Yönetimi inline bileşeni (e-posta ile moderatör atama / kaldırma, aktif liste).
  Mount yeri: Profil sekmesi, yalnızca admin:
  <YetkiliBolum baslik="Moderatör Yönetimi" sadeceAdmin> içinde render edilir.
  Eyl 2026: admin paneli kaldırıldı, inline yönetim. Eski kaynak: app/admin.tsx ("Moderatör Yönetimi" bölümü)
  Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi (hex → token, Poppins, BirincilButon/BosDurum).
*/
import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, TextInput
} from 'react-native';
import { useAdmin } from '../../hooks/use-admin';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum } from '../ui/pusula-ui';

export function ModeratorYonetim() {
  const { t } = useTema();
  const s = createStyles(t);
  const { rol, isAdmin } = useAdmin();

  // Moderator atama
  const [modEmail, setModEmail] = useState('');
  const [modIslem, setModIslem] = useState(false);
  const [moderatorlar, setModeratorlar] = useState<{ id: string; isim: string; soyisim: string; email: string }[]>([]);

  useEffect(() => {
    // Moderator listesini cek (sadece admin gorur)
    if (rol === 'admin') {
      moderatorlariCek();
    }
  }, [rol]);

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

      // Moderator yap — RLS sessiz red'e karsi defansif: .select().single() ile
      // donen veriyi kontrol et. UPDATE 0 satir etkilerse PostgREST hata atmaz,
      // ama .single() data'yi null donecegi icin yakalariz. (BUG FIX v1.0.12)
      const { data: guncel, error: updateErr } = await supabase
        .from('profiles')
        .update({ rol: 'moderator' })
        .eq('id', profil.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      if (!guncel) throw new Error('Yetki sorunu — kayıt güncellenmedi.');

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
            // RLS sessiz red'e karsi defansif: .select().single() ile donen
            // veriyi kontrol et. (BUG FIX v1.0.12)
            const { data: guncel, error } = await supabase
              .from('profiles')
              .update({ rol: 'user' })
              .eq('id', id)
              .select()
              .single();
            if (error) {
              Alert.alert('Hata', error.message);
            } else if (!guncel) {
              Alert.alert('Hata', 'Yetki sorunu — kayıt güncellenmedi.');
            } else {
              Alert.alert('Başarılı', 'Moderatörlük kaldırıldı.');
              moderatorlariCek();
            }
          },
        },
      ]
    );
  };

  // Sarmalayıcı (YetkiliBolum sadeceAdmin) zaten filtreler; ek güvenlik
  if (!isAdmin) return null;

  return (
    <View style={s.modBolum}>
      <Text style={s.modBolumAciklama}>
        Moderatörler sadece saha durumu bildirimi, kent etkinlikleri ve Sultanahmet Camii saat girişine erişebilir.
      </Text>

      {/* Atama formu */}
      <View style={s.modForm}>
        <TextInput
          style={s.modInput}
          placeholder="Kullanıcı e-posta adresi"
          placeholderTextColor={t.textMuted}
          value={modEmail}
          onChangeText={setModEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!modIslem}
        />
        <BirincilButon
          baslik="Ata"
          onPress={moderatorAta}
          varyant="kobalt"
          yukleniyor={modIslem}
          style={s.modAtaBtn}
        />
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
        <BosDurum metin="Henüz atanmış moderatör yok." />
      )}
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  // Moderator Yonetimi
  modBolum: {
    paddingHorizontal: 16, paddingVertical: 14,
  },
  modBolumAciklama: {
    fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginBottom: 16, lineHeight: 18,
  },
  modForm: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  modInput: {
    flex: 1, height: 48, backgroundColor: t.bgInput, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 0,
    fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder,
  },
  modAtaBtn: { paddingHorizontal: 22 },
  modListe: { marginTop: 4 },
  modListeBaslik: {
    fontFamily: Font.semibold, fontSize: 13, color: t.textSecondary, marginBottom: 10,
  },
  modSatir: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.divider,
  },
  modIsim: { fontFamily: Font.semibold, fontSize: 14, color: t.text },
  modMail: { fontFamily: Font.regular, fontSize: 12, color: t.textMuted, marginTop: 1 },
  modKaldirBtn: {
    backgroundColor: Palette.kapaliTint, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6, minHeight: 32, justifyContent: 'center',
  },
  modKaldirBtnYazi: {
    fontFamily: Font.bold, color: t.durumKapali, fontSize: 12,
  },
});
