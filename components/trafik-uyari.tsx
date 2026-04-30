import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { Palette, Space, Radius, type TemaRenkleri } from '../constants/theme';

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
   Tip → Renk & Etiket
   ═══════════════════════════════════════════ */
const TIP_STIL: Record<string, { renk: string; etiket: string }> = {
  ariza:   { renk: '#D62828', etiket: 'ARIZA' },
  kesinti: { renk: '#C2185B', etiket: 'KAPALI' },
  gecikme: { renk: '#E09F3E', etiket: 'YOĞUN' },
  bilgi:   { renk: '#5C6BC0', etiket: 'BİLGİ' },
  duyuru:  { renk: '#7B8794', etiket: 'DUYURU' },
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
  renk: '#E09F3E',
  aciklama: 'Köprü, metrobüs, E-5, TEM, yol çalışması, trafik yoğunluğu',
};

/* ═══════════════════════════════════════════
   Bilesen: TrafikUyariBandi
   Amber/turuncu temali trafik ve yol durumu bandi
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

  return (
    <View style={[s.container, { backgroundColor: t.bgSecondary, borderBottomColor: t.kartBorder }]}>
      {/* Baslik */}
      <View style={s.baslikSatir}>
        <Text style={[s.baslik, { color: t.primary }]}>Trafik ve Yol Durumu</Text>
        <TouchableOpacity onPress={() => setXMenuAcik(!xMenuAcik)} style={[s.xBtn, { backgroundColor: t.bgCardAlt }]}>
          <Text style={[s.xBtnYazi, { color: t.primary }]}>X Canlı ▾</Text>
        </TouchableOpacity>
      </View>

      {/* X hesabi dropdown */}
      {xMenuAcik && (
        <View style={[s.xMenu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <TouchableOpacity
            style={[s.xMenuItem, { borderBottomColor: t.divider }]}
            onPress={xAc}
          >
            <View style={[s.hesapDot, { backgroundColor: IBB_HESAP.renk }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.xMenuIsim, { color: t.text }]}>{IBB_HESAP.isim}</Text>
              <Text style={[s.xMenuAciklama, { color: t.textSecondary }]}>{IBB_HESAP.aciklama}</Text>
            </View>
            <Text style={{ fontSize: 12, color: t.textMuted }}>@{IBB_HESAP.kullanici}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Yukleniyor */}
      {yukleniyor && (
        <View style={[s.durumKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={[s.durumYazi, { color: t.textSecondary }]}>Trafik bilgileri kontrol ediliyor...</Text>
        </View>
      )}

      {/* Hata */}
      {!yukleniyor && hata && (
        <TouchableOpacity
          style={[s.durumKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}
          onPress={xAc}
          activeOpacity={0.7}
        >
          <View style={[s.durumDot, { backgroundColor: t.primary }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: t.text }]}>Bilinen bir sorun yok</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Köprü, metrobüs, karayolu — X'ten canlı takip</Text>
          </View>
          <Text style={{ fontSize: 14, color: t.primary, fontWeight: '600' }}>{'>'}</Text>
        </TouchableOpacity>
      )}

      {/* Uyari yok — trafik normal */}
      {!yukleniyor && !hata && uyarilar.length === 0 && (
        <TouchableOpacity
          style={[s.durumKutu, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}
          onPress={xAc}
          activeOpacity={0.7}
        >
          <View style={[s.durumDot, { backgroundColor: '#2E7D32' }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: '#2E7D32' }]}>Trafik akışı normal</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Köprü, metrobüs, E-5, TEM — bilinen sorun yok</Text>
          </View>
          <Text style={{ fontSize: 14, color: t.primary, fontWeight: '600' }}>{'>'}</Text>
        </TouchableOpacity>
      )}

      {/* Aktif uyarilar — ilk ONIZLEME_LIMIT kadar goster, geri kalani gizle */}
      {!yukleniyor && uyarilar.length > 0 && (() => {
        const gosterilecek = genisletildi ? uyarilar : uyarilar.slice(0, ONIZLEME_LIMIT);
        const gizliSayisi = uyarilar.length - ONIZLEME_LIMIT;
        return (
          <>
            {gosterilecek.map(u => {
              const stil = TIP_STIL[u.tip] || TIP_STIL.bilgi;
              return (
                <View
                  key={u.id}
                  style={[s.uyariKart, { backgroundColor: t.bgCard, borderLeftColor: stil.renk, borderColor: t.kartBorder }]}
                >
                  <View style={s.uyariUst}>
                    <View style={[s.tipDot, { backgroundColor: stil.renk }]} />
                    <View style={[s.tipBadge, { backgroundColor: `${stil.renk}20` }]}>
                      <Text style={[s.tipBadgeYazi, { color: stil.renk }]}>{stil.etiket}</Text>
                    </View>
                    <Text style={[s.hatBadge, { color: t.text, backgroundColor: t.bgInput }]}>{u.hat}</Text>
                    <Text style={[s.zamanYazi, { color: t.textMuted }]}>{zamanOnce(u.tarih)}</Text>
                  </View>
                  <Text style={[s.uyariIcerik, { color: t.text }]}>{u.icerik}</Text>
                </View>
              );
            })}
            {gizliSayisi > 0 && (
              <TouchableOpacity
                onPress={() => setGenisletildi(!genisletildi)}
                style={[s.genisletBtn, { backgroundColor: t.bgCardAlt }]}
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
    </View>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
const s = StyleSheet.create({
  container: {
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#9DC5DB',
    borderLeftWidth: 0.5,
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  baslikSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  baslik: {
    fontSize: 15,
    fontWeight: '700',
  },
  xBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  xBtnYazi: {
    fontSize: 12,
    fontWeight: '700',
  },
  xMenu: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Space.md,
    overflow: 'hidden',
  },
  xMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  xMenuIsim: {
    fontSize: 14,
    fontWeight: '700',
  },
  xMenuAciklama: {
    fontSize: 11,
    marginTop: 1,
  },
  durumKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  durumYazi: {
    marginLeft: 10,
    fontSize: 13,
  },
  normalYazi: {
    fontSize: 14,
    fontWeight: '600',
  },
  normalAlt: {
    fontSize: 11,
    marginTop: 2,
  },
  uyariKart: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: Space.sm,
  },
  uyariUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tipBadgeYazi: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hatBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  zamanYazi: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  uyariIcerik: {
    fontSize: 13,
    lineHeight: 19,
  },
  hesapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  durumDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  genisletBtn: {
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center' as const,
    marginTop: 2,
  },
  genisletYazi: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
