// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Altın gradyan bant + açık kartlar → tek koyu kobalt Kart (zemin t.primary): "SAHADAN ÖNEMLİ" Kicker beyaz %70,
// mesaj metni beyaz, sayaç Rozet. usePinliMesajlar, detay modalı (ModalKapak) ve tüm onPress/router hedefleri birebir.
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTema } from '../hooks/use-tema';
import { usePinliMesajlar, type PinliMesaj } from '../hooks/use-pinli-mesajlar';
import { Font, Palette } from '../constants/theme';
import { BirincilButon, Kart, Kicker, ModalKapak, Rozet } from './ui/pusula-ui';

/* ═══════════════════════════════════════════
   PinliMesajBandi (v1.1.0)
   ───────────────────────────────────────────
   Ana sayfada "Sahadan Onemli" basligi altinda
   son 48 saatin pin'li sohbet mesajlarini gosterir.
   Admin/moderator pin yetkisi sohbet ekraninda
   uzun basma menusunden.
   ═══════════════════════════════════════════ */

/** Koyu kobalt zemin üstü ikincil beyaz (%70) */
const BEYAZ_70 = 'rgba(255,255,255,0.7)';

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
  const { mesajlar, yukleniyor } = usePinliMesajlar();
  const [detayMesaj, setDetayMesaj] = useState<PinliMesaj | null>(null);

  if (yukleniyor || mesajlar.length === 0) return null;

  return (
    <View style={s.zarf}>
      <Kart style={{ backgroundColor: t.primary, borderColor: t.primary }}>
        {/* Kicker + sayaç */}
        <View style={s.bandHeader}>
          <Kicker color={BEYAZ_70}>Sahadan Önemli</Kicker>
          <Rozet renk={Palette.beyaz}>{mesajlar.length}</Rozet>
        </View>

        {mesajlar.slice(0, 3).map((m, i) => (
          <TouchableOpacity
            key={m.id}
            activeOpacity={0.7}
            onPress={() => setDetayMesaj(m)}
            style={[s.satir, i > 0 && { borderTopWidth: 1, borderTopColor: Palette.seffafBeyaz20 }]}>
            <Text style={[s.mesajMetni, { color: Palette.beyaz }]} numberOfLines={3}>
              {m.mesaj}
            </Text>
            <View style={s.kartAlt}>
              <Text style={[s.meta, { color: BEYAZ_70 }]} numberOfLines={1}>
                {m.kullanici_isim} · {m.pinned_at ? zamanOnce(m.pinned_at) : ''}
              </Text>
              <Text style={[s.tikla, { color: Palette.beyaz }]}>Detay ›</Text>
            </View>
          </TouchableOpacity>
        ))}

        {mesajlar.length > 3 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/sohbet')} style={[s.dahaFazla, { backgroundColor: Palette.seffafBeyaz10 }]}>
            <Text style={[s.dahaFazlaText, { color: Palette.beyaz }]}>
              +{mesajlar.length - 3} sabit mesaj daha — Sohbete git ›
            </Text>
          </TouchableOpacity>
        )}
      </Kart>

      {/* Detay modal */}
      <Modal visible={!!detayMesaj} animationType="slide" transparent onRequestClose={() => setDetayMesaj(null)}>
        <ModalKapak baslik="Sahadan Önemli" onKapat={() => setDetayMesaj(null)}>
          {detayMesaj && (
            <>
              <Text style={[s.modalMeta, { color: t.textSecondary }]}>
                {detayMesaj.kullanici_isim} · {detayMesaj.pinned_at ? zamanOnce(detayMesaj.pinned_at) : ''}
                {detayMesaj.pinned_by_isim ? ` · Sabit: ${detayMesaj.pinned_by_isim}` : ''}
              </Text>
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={[s.modalMetin, { color: t.text }]}>{detayMesaj.mesaj}</Text>
              </ScrollView>
              <BirincilButon
                baslik="Sohbete Git"
                onPress={() => { setDetayMesaj(null); router.push('/(tabs)/sohbet'); }}
                varyant="cta"
                style={s.modalSohbetBtn}
              />
            </>
          )}
        </ModalKapak>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  zarf: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  bandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  satir: {
    paddingVertical: 10,
    minHeight: 44,
  },
  mesajMetni: {
    fontFamily: Font.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  meta: {
    fontFamily: Font.regular,
    fontSize: 11,
    flex: 1,
  },
  tikla: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  dahaFazla: {
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dahaFazlaText: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },

  // Modal (ModalKapak içi)
  modalMeta: {
    fontFamily: Font.regular,
    fontSize: 12,
    marginBottom: 12,
  },
  modalMetin: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  modalSohbetBtn: {
    marginTop: 16,
  },
});
