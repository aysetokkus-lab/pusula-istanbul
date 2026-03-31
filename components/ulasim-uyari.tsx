import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Palette, Space, Radius, type TemaRenkleri } from '../constants/theme';
import { useXUlasim } from '../hooks/use-x-ulasim';
import { X_SENKRON_ARALIK_DK } from '../lib/config';

/* ═══════════════════════════════════════════
   Tipler
   ═══════════════════════════════════════════ */
export interface UlasimUyari {
  id: string;
  icerik: string;
  tip: 'ariza' | 'kesinti' | 'gecikme' | 'bilgi' | 'duyuru';
  hat: string;         // M1, T1, Marmaray, vb.
  tarih: string;       // ISO string
  aktif: boolean;
  kaynak?: string;     // "x:metroistanbul", "ibb", "manuel"
}

/* ═══════════════════════════════════════════
   Filtreleme mantigi — SIKI FILTRE
   Sadece gercek ariza/kesinti/gecikme/iptal tweetleri gecer.
   Genel transport kelimeleri (sefer, metro, hat vb.) TEK BASLARINA yetmez.
   ═══════════════════════════════════════════ */

// Kesin uyari kaliplari — bunlardan EN AZ BIR TANESI eslesirse uyaridir
const UYARI_KALIPLARI: RegExp[] = [
  /ar[ıi]za/i,
  /kesinti/i,
  /gecikme/i,
  /gecikmeli/i,
  /iptal/i,
  /yap[ıi]lamamaktad[ıi]r/i,
  /yap[ıi]lam[ıi]yor/i,
  /durdu|durdurulmu/i,
  /aks[ıi]yor|aksama/i,
  /tek hat/i,
  /sinyalizasyon/i,
  /kapal[ıi]/i,
  /kapan[ıi]yor|kapanm[ıi][şs]/i,
  /k[ıi]s[ıi]tl/i,
  /normale d[öo]nm[üu][şs]/i,
  /seferler.*ba[şs]lanm[ıi][şs]/i,
  /aras[ıi]nda yap[ıi]lmaktad[ıi]r/i,    // kismi sefer = gecikme
];

/**
 * Bir tweet metninin gercek ulasim uyarisi olup olmadigini belirler.
 * Sadece ariza/kesinti/gecikme/iptal kaliplari eslestigi zaman true doner.
 */
export function ulasimUyarisiMi(metin: string): boolean {
  return UYARI_KALIPLARI.some(regex => regex.test(metin));
}

/* ═══════════════════════════════════════════
   Tip → Emoji & Renk
   ═══════════════════════════════════════════ */
const TIP_STIL: Record<string, { renk: string; etiket: string }> = {
  ariza:   { renk: '#D62828', etiket: 'ARIZA' },
  kesinti: { renk: '#E09F3E', etiket: 'KESINTI' },
  gecikme: { renk: '#B0D4E8', etiket: 'GECIKME' },
  bilgi:   { renk: '#0077B6', etiket: 'BILGI' },
  duyuru:  { renk: '#0096C7', etiket: 'DUYURU' },
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
   Hook: useUlasimUyarilari
   ═══════════════════════════════════════════ */
export function useUlasimUyarilari() {
  const [uyarilar, setUyarilar] = useState<UlasimUyari[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);

  const cek = useCallback(async () => {
    try {
      setYukleniyor(true);
      setHata(false);

      // Son 24 saat
      const yirmidortSaatOnce = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('ulasim_uyarilari')
        .select('*')
        .eq('aktif', true)
        .gte('tarih', yirmidortSaatOnce)
        .order('tarih', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Sadece ariza, kesinti, gecikme + cozuldu (normale dondu) goster
      const filtrelenmis = (data || []).filter((u: UlasimUyari) =>
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
   Bileşen: UlasimUyariBandi
   ═══════════════════════════════════════════ */
const X_HESAPLARI = [
  { isim: 'Metro Istanbul', kullanici: 'metroistanbul', renk: '#0077B6', aciklama: 'Metro, Tramvay, Funikuler, Teleferik' },
  { isim: 'TCDD Tasimacilik', kullanici: 'TCDDTasimacilik', renk: '#005A8D', aciklama: 'Marmaray, YHT, Banliyo' },
  { isim: 'Marmaray', kullanici: 'Marmaraytcdd', renk: '#0096C7', aciklama: 'Marmaray seferleri ve duyurulari' },
];

export function UlasimUyariBandi({ t }: { t: TemaRenkleri }) {
  const { uyarilar, yukleniyor, hata, yenile } = useUlasimUyarilari();
  const { senkronize, senkronEdiyor } = useXUlasim();
  const [xMenuAcik, setXMenuAcik] = useState(false);
  const senkronRef = useRef(false);

  // Ilk yuklenmede ve periyodik olarak X'ten senkronize et
  useEffect(() => {
    if (senkronRef.current) return;
    senkronRef.current = true;

    // Ilk senkronizasyon
    senkronize().then(() => yenile());

    // Periyodik senkronizasyon
    const interval = setInterval(async () => {
      await senkronize();
      yenile();
    }, X_SENKRON_ARALIK_DK * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const xAc = (kullanici: string) => {
    setXMenuAcik(false);
    Linking.openURL(`https://x.com/${kullanici}`);
  };

  return (
    <View style={[s.container, { backgroundColor: '#EAF4FB' }]}>
      {/* Başlık */}
      <View style={s.baslikSatir}>
        <Text style={[s.baslik, { color: '#0077B6' }]}>Ulaşım Uyarıları</Text>
        <TouchableOpacity onPress={() => setXMenuAcik(!xMenuAcik)} style={[s.xBtn, { backgroundColor: '#D6EAF8' }]}>
          <Text style={[s.xBtnYazi, { color: '#0077B6' }]}>{senkronEdiyor ? 'Guncelleniyor...' : 'X Canli'} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* X hesapları dropdown */}
      {xMenuAcik && (
        <View style={[s.xMenu, { backgroundColor: '#FFFFFF', borderColor: '#B0D4E8' }]}>
          {X_HESAPLARI.map(h => (
            <TouchableOpacity
              key={h.kullanici}
              style={[s.xMenuItem, { borderBottomColor: '#D6EAF8' }]}
              onPress={() => xAc(h.kullanici)}
            >
              <View style={[s.hesapDot, { backgroundColor: h.renk }]} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[s.xMenuIsim, { color: '#1A1A2E' }]}>{h.isim}</Text>
                <Text style={[s.xMenuAciklama, { color: '#5A7A8A' }]}>{h.aciklama}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#7A9AAA' }}>@{h.kullanici}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Yükleniyor */}
      {yukleniyor && (
        <View style={[s.durumKutu, { backgroundColor: '#FFFFFF', borderColor: '#B0D4E8' }]}>
          <ActivityIndicator size="small" color="#0077B6" />
          <Text style={[s.durumYazi, { color: '#5A7A8A' }]}>Uyarılar kontrol ediliyor...</Text>
        </View>
      )}

      {/* Hata veya tablo yok */}
      {!yukleniyor && hata && (
        <TouchableOpacity
          style={[s.durumKutu, { backgroundColor: '#FFFFFF', borderColor: '#B0D4E8' }]}
          onPress={() => setXMenuAcik(true)}
          activeOpacity={0.7}
        >
          <View style={[s.durumDot, { backgroundColor: '#0077B6' }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: '#1A1A2E' }]}>Bilinen bir sorun yok</Text>
            <Text style={[s.normalAlt, { color: '#5A7A8A' }]}>Metro, Tramvay, Marmaray -- X'ten canli takip</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#0077B6', fontWeight: '600' }}>{'>'}</Text>
        </TouchableOpacity>
      )}

      {/* Uyarı yok — her şey normal */}
      {!yukleniyor && !hata && uyarilar.length === 0 && (
        <TouchableOpacity
          style={[s.durumKutu, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}
          onPress={() => setXMenuAcik(true)}
          activeOpacity={0.7}
        >
          <View style={[s.durumDot, { backgroundColor: '#2E7D32' }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: '#2E7D32' }]}>Tum hatlar normal</Text>
            <Text style={[s.normalAlt, { color: '#5A7A8A' }]}>Metro, Tramvay, Marmaray -- ariza/kesinti yok</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#0077B6', fontWeight: '600' }}>{'>'}</Text>
        </TouchableOpacity>
      )}

      {/* Aktif uyarılar */}
      {!yukleniyor && uyarilar.length > 0 && uyarilar.map(u => {
        const stil = TIP_STIL[u.tip] || TIP_STIL.bilgi;
        return (
          <View
            key={u.id}
            style={[s.uyariKart, { backgroundColor: '#FFFFFF', borderLeftColor: stil.renk, borderColor: '#B0D4E8' }]}
          >
            <View style={s.uyariUst}>
              <View style={[s.tipDot, { backgroundColor: stil.renk }]} />
              <View style={[s.tipBadge, { backgroundColor: `${stil.renk}20` }]}>
                <Text style={[s.tipBadgeYazi, { color: stil.renk }]}>{stil.etiket}</Text>
              </View>
              <Text style={[s.hatBadge, { color: '#1A1A2E', backgroundColor: '#D6EAF8' }]}>{u.hat}</Text>
              <Text style={[s.zamanYazi, { color: '#7A9AAA' }]}>{zamanOnce(u.tarih)}</Text>
            </View>
            <Text style={[s.uyariIcerik, { color: '#1A1A2E' }]}>{u.icerik}</Text>
          </View>
        );
      })}
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

  // X hesapları dropdown
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

  // Durum kutusu (yükleniyor, hata, normal)
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

  // Uyarı kartı
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

  // Dot stiller (emoji yerine)
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
});
