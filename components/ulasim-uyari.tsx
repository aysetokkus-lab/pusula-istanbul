// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Bant → Kart + safran kicker + "N aktif" rozeti; satırlar hat kodu (dolu rozet) + metin.
// Veri kaynağı (ulasim_uyarilari), filtreler, çözüldü mantığı ve tüm onPress'ler birebir korundu.
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { Palette, Font, Radius, type TemaRenkleri } from '../constants/theme';
import { Kart, Kicker, Rozet, DurumNoktasi } from './ui/pusula-ui';

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
   Tip → Renk & Etiket (tasarım sistemi tokenları)
   ariza = kırmızı, kesinti/gecikme = safran, bilgi/duyuru = kobalt
   ═══════════════════════════════════════════ */
const TIP_STIL: Record<string, { renk: string; etiket: string }> = {
  ariza:   { renk: Palette.kapali,     etiket: 'ARIZA' },
  kesinti: { renk: Palette.uyari,      etiket: 'KESİNTİ' },
  gecikme: { renk: Palette.uyari,      etiket: 'GECİKME' },
  bilgi:   { renk: Palette.kobalt,     etiket: 'BİLGİ' },
  duyuru:  { renk: Palette.kobaltOrta, etiket: 'DUYURU' },
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

      // Son 4 saat (eski tweet'ler gosterilmesin)
      const dortSaatOnce = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('ulasim_uyarilari')
        .select('*')
        .eq('aktif', true)
        .gte('tarih', dortSaatOnce)
        .order('tarih', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Sadece rayli sistem uyarilari (IBB Ulasim/trafik haric)
      // Sadece ariza, kesinti, gecikme goster — cozulmus (bilgi) olanlari GOSTERME
      const filtrelenmis = (data || []).filter((u: any) =>
        u.kaynak !== 'x:IBBUlasim' &&
        !u.cozuldu &&
        (u.tip === 'ariza' || u.tip === 'kesinti' || u.tip === 'gecikme')
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
   Bileşen: UlasimUyariBandi
   ═══════════════════════════════════════════ */
const X_HESAPLARI = [
  { isim: 'Metro İstanbul', kullanici: 'metroistanbul', renk: Palette.kobalt, aciklama: 'Metro, Tramvay, Füniküler, Teleferik' },
  { isim: 'TCDD Taşımacılık', kullanici: 'TCDDTasimacilik', renk: Palette.kobaltKoyu, aciklama: 'Marmaray, YHT, Banliyö' },
  { isim: 'Marmaray', kullanici: 'Marmaraytcdd', renk: Palette.kobaltOrta, aciklama: 'Marmaray seferleri ve duyuruları' },
];

const ONIZLEME_LIMIT = 2;

export function UlasimUyariBandi({ t }: { t: TemaRenkleri }) {
  const { uyarilar, yukleniyor, hata, yenile } = useUlasimUyarilari();
  const [xMenuAcik, setXMenuAcik] = useState(false);
  const [genisletildi, setGenisletildi] = useState(false);

  // X senkronizasyonu _layout.tsx'de global olarak yapiliyor.
  // Bu bilesen sadece Supabase'den veri okur.

  const xAc = (kullanici: string) => {
    setXMenuAcik(false);
    WebBrowser.openBrowserAsync(`https://x.com/${kullanici}`);
  };

  return (
    <Kart style={s.kart}>
      {/* Baslik: safran kicker + "N aktif" rozeti + X Canlı toggle */}
      <View style={s.baslikSatir}>
        <Kicker color={Palette.uyari} style={{ flexShrink: 1 }}>Ulaşım Uyarıları</Kicker>
        <View style={s.baslikSag}>
          {!yukleniyor && uyarilar.length > 0 && (
            <Rozet renk={Palette.uyari}>{uyarilar.length} aktif</Rozet>
          )}
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

      {/* X hesaplari dropdown */}
      {xMenuAcik && (
        <View style={[s.xMenu, { backgroundColor: t.bgCardAlt, borderColor: t.kartBorder }]}>
          {X_HESAPLARI.map((h, i) => (
            <TouchableOpacity
              key={h.kullanici}
              style={[s.xMenuItem, i < X_HESAPLARI.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.divider }]}
              onPress={() => xAc(h.kullanici)}
              activeOpacity={0.7}
            >
              <DurumNoktasi renk={h.renk} boyut={12} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[s.xMenuIsim, { color: t.text }]}>{h.isim}</Text>
                <Text style={[s.xMenuAciklama, { color: t.textSecondary }]}>{h.aciklama}</Text>
              </View>
              <Text style={[s.xMenuKullanici, { color: t.textMuted }]}>@{h.kullanici}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Yukleniyor */}
      {yukleniyor && (
        <View style={s.durumSatir}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={[s.durumYazi, { color: t.textSecondary }]}>Uyarilar kontrol ediliyor...</Text>
        </View>
      )}

      {/* Hata veya tablo yok */}
      {!yukleniyor && hata && (
        <TouchableOpacity
          style={s.durumSatir}
          onPress={() => setXMenuAcik(true)}
          activeOpacity={0.7}
        >
          <DurumNoktasi renk={t.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: t.text }]}>Bilinen bir sorun yok</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Metro, Tramvay, Marmaray — X'ten canlı takip</Text>
          </View>
          <ChevronSag renk={t.primary} />
        </TouchableOpacity>
      )}

      {/* Uyari yok — her sey normal */}
      {!yukleniyor && !hata && uyarilar.length === 0 && (
        <TouchableOpacity
          style={s.durumSatir}
          onPress={() => setXMenuAcik(true)}
          activeOpacity={0.7}
        >
          <DurumNoktasi renk={t.durumAcik} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: t.durumAcik }]}>Tüm hatlar normal</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Metro, Tramvay, Marmaray — arıza/kesinti yok</Text>
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
                  {/* Hat kodu — küçük dolu rozet (tip rengi) */}
                  <Rozet renk={stil.renk} dolu style={s.hatRozet}>{u.hat}</Rozet>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.uyariIcerik, { color: t.text }]}>{u.icerik}</Text>
                    <Text style={[s.uyariMeta, { color: t.textMuted }]}>
                      {stil.etiket} · {zamanOnce(u.tarih)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  baslikSag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  // X hesapları dropdown
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

  // Uyarı satırı: hat rozeti + metin
  uyariSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
  },
  hatRozet: {
    marginTop: 1,
    minWidth: 32,
    alignItems: 'center',
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
