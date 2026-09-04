import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTema } from '../../hooks/use-tema';
import { useAdmin } from '../../hooks/use-admin';
import { Font, Palette, Radius } from '../../constants/theme';

/* ═══════════════════════════════════════════
   YETKİLİ BÖLÜMÜ — Inline Yönetim Sarmalayıcısı (Eyl 2026)
   ─────────────────────────────────────────
   Admin paneli KALDIRILDI. Her bölümün hemen altında,
   yalnızca admin/moderatör görür: "Yönet" satırı → açılır
   panel. GenelDuyuruPanel pattern'inin genellenmiş hali.

   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi.
   Görünüm: kesikli safran border + safran tint zemin, "YÖNET ·" etiketi safran.

   Kullanım:
     <YetkiliBolum baslik="Saha Bildirimleri" sadeceAdmin>
       <SahaYonetim />
     </YetkiliBolum>

   - Yetkisiz kullanıcıya HİÇBİR ŞEY render etmez (0 yükseklik).
   - `sadeceAdmin` → moderatör de görmez.
   - Panel kapalıyken içerik mount EDİLMEZ (gereksiz sorgu yok).
   ═══════════════════════════════════════════ */

interface Props {
  baslik: string;
  aciklama?: string;
  sadeceAdmin?: boolean;
  /** Başlık yanında sayaç (ör. bekleyen rapor) */
  rozet?: number;
  /** Panel ilk açılışta açık olsun mu */
  varsayilanAcik?: boolean;
  children: ReactNode;
}

export function YetkiliBolum({ baslik, aciklama, sadeceAdmin, rozet, varsayilanAcik, children }: Props) {
  const { t } = useTema();
  const { isAdmin, isYetkili, yukleniyor } = useAdmin();
  const [acik, setAcik] = useState(!!varsayilanAcik);

  if (yukleniyor) return null;
  if (sadeceAdmin ? !isAdmin : !isYetkili) return null;

  return (
    <View style={[s.kutu, { borderColor: t.accent, backgroundColor: Palette.safranTint }]}>
      <TouchableOpacity
        onPress={() => setAcik(a => !a)}
        activeOpacity={0.7}
        style={s.baslikSatir}
        accessibilityRole="button"
        accessibilityLabel={`${baslik} yönetimini ${acik ? 'kapat' : 'aç'}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.baslik, { color: t.text }]}>
            <Text style={[s.etiket, { color: t.accent }]}>YÖNET · </Text>
            {baslik}
          </Text>
          {aciklama ? <Text style={[s.aciklama, { color: t.textSecondary }]}>{aciklama}</Text> : null}
        </View>
        {rozet && rozet > 0 ? (
          <View style={[s.rozet, { backgroundColor: t.durumKapali }]}>
            <Text style={s.rozetYazi}>{rozet}</Text>
          </View>
        ) : null}
        <Text style={[s.ok, { color: t.accent }]}>{acik ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {acik && (
        <View style={[s.icerik, { borderTopColor: t.kartBorder, backgroundColor: t.bg }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  kutu: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  baslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  etiket: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 1 },
  baslik: { fontFamily: Font.bold, fontSize: 14, letterSpacing: -0.3 },
  aciklama: { fontFamily: Font.regular, fontSize: 11, marginTop: 1 },
  rozet: {
    borderRadius: Radius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rozetYazi: { color: '#FFFFFF', fontFamily: Font.bold, fontSize: 11 },
  ok: { fontFamily: Font.bold, fontSize: 16, marginLeft: 4 },
  icerik: { borderTopWidth: 1 },
});
