// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Mavi bant → Kart + Kicker "YAKLAŞAN ETKİNLİKLER"; her satır kobalt tarih kutusu (gün + ay) + başlık + yer/saat.
// useEtkinlikler (realtime + 15 sn polling), detay modalı (ModalKapak) ve tüm onPress'ler birebir korundu.
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';
import { Font, Palette, Radius } from '../constants/theme';
import { BolumBaslik, DurumNoktasi, Kart, Kicker, ModalKapak, Rozet } from './ui/pusula-ui';

/* ═══════════════════════════════════════════
   Tipler
   ═══════════════════════════════════════════ */

export interface Etkinlik {
  id: string;
  baslik: string;
  aciklama: string;
  tarih: string;           // ISO timestamp
  bitis_tarih?: string;    // ISO timestamp (optional)
  konum: string;
  etki: 'yol_kapanma' | 'kopru_kapanma' | 'trafik' | 'gezi_kisitlama' | 'diger';
  etkilenen_yollar: string;
  tip: 'maraton' | 'yuruyus' | 'bisiklet' | 'diplomatik' | 'miting' | 'festival' | 'resmi_toren' | 'diger';
  aktif: boolean;
}


const ETKI_STIL: Record<string, { renk: string; etiket: string }> = {
  yol_kapanma: { renk: Palette.kapali, etiket: 'YOL KAPANMA' },
  kopru_kapanma: { renk: Palette.uyari, etiket: 'KÖPRÜ KAPANMA' },
  trafik: { renk: Palette.kobaltOrta, etiket: 'TRAFİK' },
  gezi_kisitlama: { renk: Palette.kapali, etiket: 'GEZİ KISITLAMA' },
  diger: { renk: Palette.bilgi, etiket: 'DİĞER' },
};

/* ═══════════════════════════════════════════
   Tarih formatlama (Türkçe)
   ═══════════════════════════════════════════ */

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/** Tarih kutusu için 3 harfli ay kısaltması (büyük harf, Türkçe) */
const AY_KISA = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function tarihinTurkce(iso: string): string {
  const tarih = new Date(iso);
  const gun = GUNLER[tarih.getDay()];
  const gunSayisi = tarih.getDate();
  const ay = AYLAR[tarih.getMonth()];
  const saat = tarih.getHours().toString().padStart(2, '0');
  const dakika = tarih.getMinutes().toString().padStart(2, '0');
  return `${gunSayisi} ${ay} ${gun}, ${saat}:${dakika}`;
}

/** "07:00" */
function saatKisa(iso: string): string {
  const tarih = new Date(iso);
  return `${tarih.getHours().toString().padStart(2, '0')}:${tarih.getMinutes().toString().padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════
   Hook: useEtkinlikler
   ═══════════════════════════════════════════ */

export function useEtkinlikler() {
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);

  const ilkYuklemeRef = useRef(true);

  const cek = useCallback(async () => {
    try {
      // Sadece ilk yuklemede spinner goster, sonrakilerde arka planda yenile
      if (ilkYuklemeRef.current) {
        setYukleniyor(true);
      }
      setHata(false);

      const { data, error } = await supabase
        .from('etkinlikler')
        .select('*')
        .eq('aktif', true)
        .gte('tarih', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .order('tarih', { ascending: true })
        .limit(50);

      if (error) throw error;

      setEtkinlikler(data || []);
    } catch {
      setHata(true);
      setEtkinlikler([]);
    } finally {
      setYukleniyor(false);
      ilkYuklemeRef.current = false;
    }
  }, []);

  useEffect(() => {
    cek();

    // Realtime subscription — INSERT, UPDATE, DELETE
    // NOT: etkinlikler tablosu supabase_realtime publication'da olmali
    // SQL: ALTER PUBLICATION supabase_realtime ADD TABLE etkinlikler;
    const channel = supabase
      .channel('etkinlikler-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'etkinlikler' }, () => {
        cek();
      })
      .subscribe();

    // Polling yedegi: Realtime calismasa bile 15 saniyede bir kontrol et
    const polling = setInterval(() => {
      cek();
    }, 15000);

    return () => {
      clearInterval(polling);
      supabase.removeChannel(channel);
    };
  }, [cek]);

  return { etkinlikler, yukleniyor, hata, yenile: cek };
}

/* ═══════════════════════════════════════════
   Bileşen: EtkinliklerBandi
   ═══════════════════════════════════════════ */

export function EtkinliklerBandi() {
  const { etkinlikler, yukleniyor, hata } = useEtkinlikler();
  const { t } = useTema();
  const [detailModal, setDetailModal] = useState(false);
  const [secilenEtkinlik, setSecilenEtkinlik] = useState<Etkinlik | null>(null);

  const ayrinti = (etkinlik: Etkinlik) => {
    setSecilenEtkinlik(etkinlik);
    setDetailModal(true);
  };

  const kapat = () => {
    setDetailModal(false);
    setSecilenEtkinlik(null);
  };

  return (
    <View style={s.bolum}>
      <Kart>
        {/* Kicker */}
        <BolumBaslik baslik="Yaklaşan Etkinlikler" renk={t.primary} />

        {/* Yukleniyor */}
        {yukleniyor && (
          <View style={s.durumKutu}>
            <ActivityIndicator size="small" color={t.primary} />
            <Text style={[s.durumYazi, { color: t.textSecondary }]}>Etkinlikler kontrol ediliyor...</Text>
          </View>
        )}

        {/* Hata */}
        {!yukleniyor && hata && (
          <View style={s.durumKutu}>
            <DurumNoktasi renk={t.durumKapali} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.normalYazi, { color: t.text }]}>Bağlantı hatası</Text>
              <Text style={[s.normalAlt, { color: t.textSecondary }]}>Etkinlikler yüklenemiyor</Text>
            </View>
          </View>
        )}

        {/* Etkinlik yok */}
        {!yukleniyor && !hata && etkinlikler.length === 0 && (
          <View style={s.durumKutu}>
            <DurumNoktasi renk={t.durumAcik} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.normalYazi, { color: t.durumAcik }]}>Yaklaşan etkinlik yok</Text>
              <Text style={[s.normalAlt, { color: t.textSecondary }]}>İstanbul'da trafik rahat!</Text>
            </View>
          </View>
        )}

        {/* Etkinlik kartlari */}
        {!yukleniyor && etkinlikler.length > 0 && (
          <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
            {etkinlikler.map((e, i) => {
              const efkiStil = ETKI_STIL[e.etki] || ETKI_STIL.diger;
              const tarih = new Date(e.tarih);
              const saatAraligi = e.bitis_tarih ? `${saatKisa(e.tarih)}–${saatKisa(e.bitis_tarih)}` : saatKisa(e.tarih);
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[s.etkinlikSatir, i > 0 && { borderTopWidth: 1, borderTopColor: t.divider }]}
                  onPress={() => ayrinti(e)}
                  activeOpacity={0.7}
                >
                  {/* Tarih kutusu: kobalt dolgu, gün büyük + ay kısaltması */}
                  <View style={[s.tarihKutu, { backgroundColor: t.tileBg }]}>
                    <Text style={[s.tarihGun, { color: t.tileIcon }]}>{tarih.getDate().toString().padStart(2, '0')}</Text>
                    <Text style={[s.tarihAy, { color: t.tileIcon }]}>{AY_KISA[tarih.getMonth()]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.baslikKart, { color: t.text }]} numberOfLines={2}>
                      {e.baslik}
                    </Text>
                    <Text style={[s.konumKart, { color: t.textSecondary }]} numberOfLines={1}>
                      {e.konum} · {saatAraligi}
                    </Text>
                    <View style={s.kartAlt}>
                      <Rozet renk={efkiStil.renk}>{efkiStil.etiket}</Rozet>
                      <Text style={[s.tarihKart, { color: t.textMuted }]} numberOfLines={1}>
                        {tarihinTurkce(e.tarih)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Kart>

      {/* Detail Modal */}
      {secilenEtkinlik && (
        <EtkinlikDetailModal
          visible={detailModal}
          etkinlik={secilenEtkinlik}
          onClose={kapat}
          t={t}
        />
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════
   Detail Modal — ModalKapak dili
   ═══════════════════════════════════════════ */

function EtkinlikDetailModal({
  visible,
  etkinlik,
  onClose,
  t,
}: {
  visible: boolean;
  etkinlik: Etkinlik;
  onClose: () => void;
  t: ReturnType<typeof useTema>['t'];
}) {
  const efkiStil = ETKI_STIL[etkinlik.etki] || ETKI_STIL.diger;

  const baslangic = tarihinTurkce(etkinlik.tarih);
  const bitis = etkinlik.bitis_tarih ? tarihinTurkce(etkinlik.bitis_tarih) : null;
  const tarihAraligi = bitis ? `${baslangic} - ${bitis}` : baslangic;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ModalKapak baslik={etkinlik.baslik} onKapat={onClose}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Etki Badge */}
          <Rozet renk={efkiStil.renk} style={s.detailEtkiBadge}>{efkiStil.etiket}</Rozet>

          {/* Tarih Araligi */}
          <View style={[s.detailSecim, { borderTopColor: t.divider }]}>
            <Kicker color={t.primary}>Tarih</Kicker>
            <Text style={[s.detailSecimIcerik, { color: t.text }]}>
              {tarihAraligi}
            </Text>
          </View>

          {/* Konum */}
          <View style={[s.detailSecim, { borderTopColor: t.divider }]}>
            <Kicker color={t.primary}>Konum</Kicker>
            <Text style={[s.detailSecimIcerik, { color: t.text }]}>
              {etkinlik.konum}
            </Text>
          </View>

          {/* Etkilenen Yollar */}
          <View style={[s.detailSecim, { borderTopColor: t.divider }]}>
            <Kicker color={t.primary}>Etkilenen Yollar</Kicker>
            <Text style={[s.detailSecimIcerik, { color: t.text }]}>
              {etkinlik.etkilenen_yollar}
            </Text>
          </View>

          {/* Aciklama */}
          <View style={[s.detailSecim, { borderTopColor: t.divider }]}>
            <Kicker color={t.primary}>Açıklama</Kicker>
            <Text style={[s.detailSecimIcerik, { color: t.text }]}>
              {etkinlik.aciklama}
            </Text>
          </View>
        </ScrollView>
      </ModalKapak>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */

const s = StyleSheet.create({
  // Bölüm zarfı (Kart dışı)
  bolum: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Durum kutusu (yükleniyor, hata, boş)
  durumKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 4,
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

  // Etkinlik satırı
  etkinlikSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  tarihKutu: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarihGun: {
    fontFamily: Font.extrabold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  tarihAy: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 12,
  },
  baslikKart: {
    fontFamily: Font.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  konumKart: {
    fontFamily: Font.regular,
    fontSize: 12,
    marginTop: 2,
  },
  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  tarihKart: {
    fontFamily: Font.regular,
    fontSize: 11,
    flex: 1,
  },

  // Detail Modal
  detailEtkiBadge: {
    marginBottom: 6,
  },
  detailSecim: {
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  detailSecimIcerik: {
    fontFamily: Font.regular,
    fontSize: 13,
    lineHeight: 19,
  },
});
