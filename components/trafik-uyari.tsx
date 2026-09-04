// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Bant → Kart + kırmızı kicker, sağda "İBB Ulaşım · X dk önce"; satırlar DurumNoktasi + metin.
// Veri kaynağı (ulasim_uyarilari, x:IBBUlasim filtresi) ve tüm onPress'ler birebir korundu.
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { Palette, Font, Radius, type TemaRenkleri } from '../constants/theme';
import { Kart, Kicker, DurumNoktasi } from './ui/pusula-ui';

/* ═══════════════════════════════════════════
   Tipler
   ═══════════════════════════════════════════ */
interface TrafikUyari {
  id: string;
  icerik: string;
  tip: 'ariza' | 'kesinti' | 'gecikme' | 'bilgi' | 'duyuru';
  hat: string;
  tarih: string;
  aktif: boolean;
  kaynak?: string;
}

/* ═══════════════════════════════════════════
   Tip → Renk & Etiket (tasarım sistemi tokenları)
   ariza/kesinti = kırmızı, gecikme (yoğun) = safran, bilgi = kobalt, duyuru = gri-mavi
   ═══════════════════════════════════════════ */
const TIP_STIL: Record<string, { renk: string; etiket: string }> = {
  ariza:   { renk: Palette.kapali,     etiket: 'ARIZA' },
  kesinti: { renk: Palette.kapali,     etiket: 'KAPALI' },
  gecikme: { renk: Palette.uyari,      etiket: 'YOĞUN' },
  bilgi:   { renk: Palette.kobaltOrta, etiket: 'BİLGİ' },
  duyuru:  { renk: Palette.bilgi,      etiket: 'DUYURU' },
};

/* ═══════════════════════════════════════════
   Zaman formatlama
   ═══════════════════════════════════════════ */
function zamanOnce(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return 'Az önce';
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün önce`;
}

/* ═══════════════════════════════════════════
   Hook: useTrafikUyarilari
   Sadece x:IBBUlasim kaynakli uyarilari cekar
   ═══════════════════════════════════════════ */
export function useTrafikUyarilari() {
  const [uyarilar, setUyarilar] = useState<TrafikUyari[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);

  const cek = useCallback(async () => {
    try {
      setYukleniyor(true);
      setHata(false);

      const ikiSaatOnce = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('ulasim_uyarilari')
        .select('*')
        .eq('aktif', true)
        .eq('kaynak', 'x:IBBUlasim')
        .gte('tarih', ikiSaatOnce)
        .order('tarih', { ascending: false })
        .limit(10);

      if (error) throw error;

      const filtrelenmis = (data || []).filter((u: TrafikUyari) =>
        u.tip === 'ariza' || u.tip === 'kesinti' || u.tip === 'gecikme' || u.tip === 'bilgi'
      );

      setUyarilar(filtrelenmis);
    } catch {
      setHata(true);
      setUyarilar([]);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { cek(); }, [cek]);

  return { uyarilar, yukleniyor, hata, yenile: cek };
}

/* ═══════════════════════════════════════════
   X Hesabi
   ═══════════════════════════════════════════ */
const IBB_HESAP = {
  isim: 'İBB Ulaşım Yönetim Merkezi',
  kullanici: '4444154',
  renk: Palette.uyari,
  aciklama: 'Köprü, metrobüs, E-5, TEM, yol çalışması, trafik yoğunluğu',
};

/* ═══════════════════════════════════════════
   Küçük ikon: sağ ok (chevron) — 24px stroke SVG
   ═══════════════════════════════════════════ */
function ChevronSag({ renk, boyut = 18 }: { renk: string; boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={renk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ═══════════════════════════════════════════
   Bilesen: TrafikUyariBandi
   Kırmızı kicker'lı trafik ve yol durumu kartı
   ═══════════════════════════════════════════ */
const ONIZLEME_LIMIT = 2; // Ana sayfada max 2 uyari goster

export function TrafikUyariBandi({ t }: { t: TemaRenkleri }) {
  const { uyarilar, yukleniyor, hata, yenile } = useTrafikUyarilari();
  const [xMenuAcik, setXMenuAcik] = useState(false);
  const [genisletildi, setGenisletildi] = useState(false);

  // X senkronizasyonu _layout.tsx'de global olarak yapiliyor.
  // Bu bilesen sadece Supabase'den veri okur.

  const xAc = () => {
    setXMenuAcik(false);
    WebBrowser.openBrowserAsync(`https://x.com/${IBB_HESAP.kullanici}`);
  };

  // Sağ üst kaynak yazısı: en güncel uyarının zamanı
  const kaynakYazi = uyarilar.length > 0 ? `İBB Ulaşım · ${zamanOnce(uyarilar[0].tarih)}` : 'İBB Ulaşım';

  return (
    <Kart style={s.kart}>
      {/* Baslik: kırmızı kicker + sağda kaynak/zaman + X Canlı toggle */}
      <View style={s.baslikSatir}>
        <Kicker color={Palette.kapali} style={{ flexShrink: 1 }}>Trafik ve Yol Durumu</Kicker>
        <View style={s.baslikSag}>
          <Text style={[s.kaynakYazi, { color: t.textMuted }]} numberOfLines={1}>{kaynakYazi}</Text>
          <TouchableOpacity
            onPress={() => setXMenuAcik(!xMenuAcik)}
            style={[s.xBtn, { backgroundColor: `${t.primary}22` }]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[s.xBtnYazi, { color: t.primary }]}>X Canlı ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* X hesabi dropdown */}
      {xMenuAcik && (
        <View style={[s.xMenu, { backgroundColor: t.bgCardAlt, borderColor: t.kartBorder }]}>
          <TouchableOpacity
            style={s.xMenuItem}
            onPress={xAc}
            activeOpacity={0.7}
          >
            <DurumNoktasi renk={IBB_HESAP.renk} boyut={12} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.xMenuIsim, { color: t.text }]}>{IBB_HESAP.isim}</Text>
              <Text style={[s.xMenuAciklama, { color: t.textSecondary }]}>{IBB_HESAP.aciklama}</Text>
            </View>
            <Text style={[s.xMenuKullanici, { color: t.textMuted }]}>@{IBB_HESAP.kullanici}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Yukleniyor */}
      {yukleniyor && (
        <View style={s.durumSatir}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={[s.durumYazi, { color: t.textSecondary }]}>Trafik bilgileri kontrol ediliyor...</Text>
        </View>
      )}

      {/* Hata */}
      {!yukleniyor && hata && (
        <TouchableOpacity
          style={s.durumSatir}
          onPress={xAc}
          activeOpacity={0.7}
        >
          <DurumNoktasi renk={t.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: t.text }]}>Bilinen bir sorun yok</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Köprü, metrobüs, karayolu — X'ten canlı takip</Text>
          </View>
          <ChevronSag renk={t.primary} />
        </TouchableOpacity>
      )}

      {/* Uyari yok — trafik normal */}
      {!yukleniyor && !hata && uyarilar.length === 0 && (
        <TouchableOpacity
          style={s.durumSatir}
          onPress={xAc}
          activeOpacity={0.7}
        >
          <DurumNoktasi renk={t.durumAcik} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: t.durumAcik }]}>Trafik akışı normal</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Köprü, metrobüs, E-5, TEM — bilinen sorun yok</Text>
          </View>
          <ChevronSag renk={t.primary} />
        </TouchableOpacity>
      )}

      {/* Aktif uyarilar — ilk ONIZLEME_LIMIT kadar goster, geri kalani gizle */}
      {!yukleniyor && uyarilar.length > 0 && (() => {
        const gosterilecek = genisletildi ? uyarilar : uyarilar.slice(0, ONIZLEME_LIMIT);
        const gizliSayisi = uyarilar.length - ONIZLEME_LIMIT;
        return (
          <>
            {gosterilecek.map((u, i) => {
              const stil = TIP_STIL[u.tip] || TIP_STIL.bilgi;
              return (
                <View
                  key={u.id}
                  style={[s.uyariSatir, i < gosterilecek.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.divider }]}
                >
                  {/* Durum noktası (tip rengi) + metin */}
                  <View style={s.noktaKutu}>
                    <DurumNoktasi renk={stil.renk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.uyariIcerik, { color: t.text }]}>{u.icerik}</Text>
                    <Text style={[s.uyariMeta, { color: t.textMuted }]}>
                      <Text style={{ color: stil.renk }}>{stil.etiket}</Text> · {u.hat} · {zamanOnce(u.tarih)}
                    </Text>
                  </View>
                </View>
              );
            })}
            {gizliSayisi > 0 && (
              <TouchableOpacity
                onPress={() => setGenisletildi(!genisletildi)}
                style={s.genisletBtn}
                activeOpacity={0.7}
              >
                <Text style={[s.genisletYazi, { color: t.primary }]}>
                  {genisletildi ? 'Daralt' : `${gizliSayisi} uyari daha`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        );
      })()}
    </Kart>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
const s = StyleSheet.create({
  kart: {
    marginHorizontal: 16,
    marginVertical: 7, // kartlar arası 14px
  },
  baslikSatir: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  baslikSag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  kaynakYazi: {
    fontFamily: Font.semibold,
    fontSize: 11,
    flexShrink: 1,
  },
  xBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  xBtnYazi: {
    fontFamily: Font.bold,
    fontSize: 11,
  },

  // X hesabı dropdown
  xMenu: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  xMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  xMenuIsim: {
    fontFamily: Font.semibold,
    fontSize: 14,
  },
  xMenuAciklama: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginTop: 1,
  },
  xMenuKullanici: {
    fontFamily: Font.regular,
    fontSize: 12,
  },

  // Durum satırı (yükleniyor, hata, normal)
  durumSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  durumYazi: {
    marginLeft: 10,
    fontFamily: Font.regular,
    fontSize: 13,
  },
  normalYazi: {
    fontFamily: Font.semibold,
    fontSize: 14,
  },
  normalAlt: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginTop: 2,
  },

  // Uyarı satırı: durum noktası + metin
  uyariSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
  },
  noktaKutu: {
    height: 20, // ilk satır yüksekliğiyle hizala
    justifyContent: 'center',
  },
  uyariIcerik: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  uyariMeta: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginTop: 2,
  },
  genisletBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genisletYazi: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
});
