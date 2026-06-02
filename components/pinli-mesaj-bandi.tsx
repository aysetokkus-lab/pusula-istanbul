import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTema } from '../hooks/use-tema';
import { usePinliMesajlar, type PinliMesaj } from '../hooks/use-pinli-mesajlar';
import { Palette, type TemaRenkleri } from '../constants/theme';

/* ═══════════════════════════════════════════
   PinliMesajBandi (v1.1.0)
   ───────────────────────────────────────────
   Ana sayfada "Sahadan Onemli" basligi altinda
   son 48 saatin pin'li sohbet mesajlarini gosterir.
   Admin/moderator pin yetkisi sohbet ekraninda
   uzun basma menusunden.
   ═══════════════════════════════════════════ */

function zamanOnce(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return 'şimdi';
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} saat önce`;
  return `${Math.floor(saat / 24)} gün önce`;
}

export function PinliMesajBandi() {
  const { t } = useTema();
  const s = createStyles(t);
  const { mesajlar, yukleniyor } = usePinliMesajlar();
  const [detayMesaj, setDetayMesaj] = useState<PinliMesaj | null>(null);

  if (yukleniyor || mesajlar.length === 0) return null;

  return (
    <View>
      <LinearGradient
        colors={[Palette.altin, '#B8651A', Palette.altin]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.bandHeader}>
        <Text style={s.bandTitle}>Sahadan Önemli</Text>
        <Text style={s.bandSayac}>{mesajlar.length}</Text>
      </LinearGradient>

      {mesajlar.slice(0, 3).map(m => (
        <TouchableOpacity
          key={m.id}
          activeOpacity={0.7}
          onPress={() => setDetayMesaj(m)}
          style={[s.kart, { backgroundColor: t.bgCard, borderLeftColor: Palette.altin }]}>
          <Text style={[s.mesajMetni, { color: t.text }]} numberOfLines={3}>
            {m.mesaj}
          </Text>
          <View style={s.kartAlt}>
            <Text style={[s.meta, { color: t.textMuted }]}>
              {m.kullanici_isim} · {m.pinned_at ? zamanOnce(m.pinned_at) : ''}
            </Text>
            <Text style={[s.tikla, { color: Palette.altin }]}>Detay ›</Text>
          </View>
        </TouchableOpacity>
      ))}

      {mesajlar.length > 3 && (
        <TouchableOpacity onPress={() => router.push('/(tabs)/sohbet')} style={[s.dahaFazla, { backgroundColor: t.bgCard }]}>
          <Text style={[s.dahaFazlaText, { color: t.primary }]}>
            +{mesajlar.length - 3} sabit mesaj daha — Sohbete git ›
          </Text>
        </TouchableOpacity>
      )}

      {/* Detay modal */}
      <Modal visible={!!detayMesaj} animationType="slide" transparent onRequestClose={() => setDetayMesaj(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: t.bgCard }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalBaslik, { color: t.text }]}>Sahadan Önemli</Text>
              <TouchableOpacity onPress={() => setDetayMesaj(null)} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Text style={[s.modalKapatX, { color: t.textMuted }]}>×</Text>
              </TouchableOpacity>
            </View>
            {detayMesaj && (
              <>
                <Text style={[s.modalMeta, { color: t.textSecondary }]}>
                  {detayMesaj.kullanici_isim} · {detayMesaj.pinned_at ? zamanOnce(detayMesaj.pinned_at) : ''}
                  {detayMesaj.pinned_by_isim ? ` · Sabit: ${detayMesaj.pinned_by_isim}` : ''}
                </Text>
                <ScrollView style={{ maxHeight: 400 }}>
                  <Text style={[s.modalMetin, { color: t.text }]}>{detayMesaj.mesaj}</Text>
                </ScrollView>
                <TouchableOpacity
                  onPress={() => { setDetayMesaj(null); router.push('/(tabs)/sohbet'); }}
                  style={[s.modalSohbetBtn, { backgroundColor: Palette.istanbulMavi }]}>
                  <Text style={s.modalSohbetBtnText}>Sohbete Git</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (t: TemaRenkleri) =>
  StyleSheet.create({
    bandHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    bandTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    bandSayac: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 12,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.18)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 24,
      textAlign: 'center',
    },
    kart: {
      marginHorizontal: 16,
      marginTop: 6,
      padding: 12,
      borderRadius: 10,
      borderLeftWidth: 4,
    },
    mesajMetni: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 13,
      lineHeight: 19,
    },
    kartAlt: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    meta: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 10,
    },
    tikla: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 11,
    },
    dahaFazla: {
      marginHorizontal: 16,
      marginTop: 4,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    dahaFazlaText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalBox: {
      maxHeight: '80%',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    modalBaslik: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
    },
    modalKapatX: {
      fontSize: 28,
      lineHeight: 28,
    },
    modalMeta: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      marginBottom: 14,
    },
    modalMetin: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 15,
      lineHeight: 22,
    },
    modalSohbetBtn: {
      marginTop: 16,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalSohbetBtnText: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 14,
      color: '#FFFFFF',
    },
  });
