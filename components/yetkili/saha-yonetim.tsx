/*
  SAHA YÖNETİM — Inline saha bildirimi yönetim bileşeni.
  Ana sayfada CanliDurumOzet bileşeninin hemen altında,
  <YetkiliBolum baslik="Saha Bildirimleri"> sarmalayıcısı içinde render edilir.
  Aktif saha bildirimlerini listeler; sabitleme / kaldırma / toplu temizleme yapar.
  Eyl 2026: admin paneli kaldırıldı, inline yönetim (eski: app/admin-saha.tsx).
  Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi (hex → token, Poppins, Rozet).
*/
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useCanliDurum, durumBilgi, zamanOnce } from '../../hooks/use-canli-durum';
import { useAdmin } from '../../hooks/use-admin';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, Rozet } from '../ui/pusula-ui';

export function SahaYonetim() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isAdmin, yukleniyor: adminYukleniyor } = useAdmin();
  const { durumlar, yukleniyor, durumKaldir, sabitlemeDegistir, tumunuTemizle, yenile } = useCanliDurum();
  const [siliniyor, setSiliniyor] = useState<string | null>(null);
  const [sabitleniyor, setSabitleniyor] = useState<string | null>(null);

  if (adminYukleniyor || yukleniyor) {
    return (
      <View style={s.yukleniyorSatir}>
        <ActivityIndicator size="small" color={t.primary} />
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
    <View style={s.icerik}>
      {/* Özet + yenile satırı */}
      <View style={s.ustSatir}>
        <Text style={s.ozet}>{gecerliDurumlar.length} aktif bildirim</Text>
        <TouchableOpacity onPress={yenile} accessibilityRole="button" accessibilityLabel="Yenile" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.yenileYazi}>Yenile</Text>
        </TouchableOpacity>
      </View>

      {/* Toplu temizle butonu */}
      {isAdmin && gecerliDurumlar.length > 0 && (
        <View style={s.topluBar}>
          <BirincilButon
            baslik={`Tümünü Kaldır (${gecerliDurumlar.length})`}
            onPress={topluTemizle}
            varyant="tehlike"
            yukleniyor={siliniyor === 'all'}
          />
        </View>
      )}

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
              <View style={[s.kartRenk, { backgroundColor: d.sabitlendi ? t.primary : bilgi.renk }]} />
              <View style={s.kartIcerik}>
                <View style={s.kartUst}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    {d.sabitlendi && (
                      <Rozet renk={t.primary}>SABiT</Rozet>
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
                      activeOpacity={0.8}
                    >
                      {sabitleniyor === d.id ? (
                        <ActivityIndicator size="small" color={t.primary} />
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
                      activeOpacity={0.8}
                    >
                      {siliniyor === d.id ? (
                        <ActivityIndicator size="small" color={t.durumKapali} />
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
    </View>
  );
}

const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  icerik: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  yukleniyorSatir: { paddingVertical: 16, alignItems: 'center' },

  // Üst satır
  ustSatir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  ozet: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary },
  yenileYazi: { fontFamily: Font.bold, fontSize: 12, color: t.primary },

  // Toplu temizle
  topluBar: { marginBottom: 12 },

  // Bos
  bosKutu: { alignItems: 'center', paddingVertical: 20 },
  bosBaslik: { fontFamily: Font.bold, fontSize: 16, color: t.textSecondary, marginBottom: 8, letterSpacing: -0.3 },
  bosAlt: { fontFamily: Font.regular, fontSize: 13, color: t.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Kart
  kart: {
    backgroundColor: t.bgCard, borderRadius: Radius.lg,
    flexDirection: 'row', overflow: 'hidden',
    marginBottom: 12, borderWidth: 1, borderColor: t.kartBorder,
  },
  kartRenk: { width: 5, alignSelf: 'stretch' },
  kartIcerik: { flex: 1, padding: 14 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kartMekan: { fontFamily: Font.bold, fontSize: 15, color: t.text, flex: 1, letterSpacing: -0.3 },
  kartDurum: { fontFamily: Font.semibold, fontSize: 13 },
  kartDetay: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginTop: 2 },
  kartNot: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, fontStyle: 'italic', marginTop: 4 },
  kartAlt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.divider,
  },
  kartRehber: { fontFamily: Font.regular, fontSize: 11, color: t.textMuted, flex: 1 },
  kaldirBtn: {
    backgroundColor: Palette.kapaliTint, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 6, minHeight: 32, justifyContent: 'center',
  },
  kaldirBtnYazi: { fontFamily: Font.bold, color: t.durumKapali, fontSize: 12 },

  // Sabitleme
  kartSabitKenarlık: { borderColor: t.primary, borderWidth: 1.5, backgroundColor: t.bgCardAlt },
  sabitleBtn: {
    backgroundColor: Palette.kobaltTint, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6, minHeight: 32, justifyContent: 'center',
  },
  sabitlBtnYazi: { fontFamily: Font.bold, color: t.primary, fontSize: 12 },
  sabitCozBtn: {
    backgroundColor: Palette.safranTint, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6, minHeight: 32, justifyContent: 'center',
  },
  sabitCozBtnYazi: { fontFamily: Font.bold, color: Palette.uyari, fontSize: 12 },
});
