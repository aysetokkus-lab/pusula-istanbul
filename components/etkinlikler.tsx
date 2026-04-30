import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTema } from '../hooks/use-tema';

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
  yol_kapanma: { renk: '#D62828', etiket: 'YOL KAPANMA' },
  kopru_kapanma: { renk: '#E09F3E', etiket: 'KÖPRÜ KAPANMA' },
  trafik: { renk: '#B0D4E8', etiket: 'TRAFİK' },
  gezi_kisitlama: { renk: '#D62828', etiket: 'GEZİ KISITLAMA' },
  diger: { renk: '#7B8FA1', etiket: 'DİĞER' },
};

/* ═══════════════════════════════════════════
   Tarih formatlama (Türkçe)
   ═══════════════════════════════════════════ */

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

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
    <View style={[s.container, { backgroundColor: t.bgSecondary, borderBottomColor: t.kartBorder }]}>
      {/* Baslik */}
      <View style={s.baslikSatir}>
        <Text style={[s.baslik, { color: t.primary }]}>Yaklaşan Kent Etkinlikleri</Text>
      </View>

      {/* Yukleniyor */}
      {yukleniyor && (
        <View style={[s.durumKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={[s.durumYazi, { color: t.textSecondary }]}>Etkinlikler kontrol ediliyor...</Text>
        </View>
      )}

      {/* Hata */}
      {!yukleniyor && hata && (
        <View style={[s.durumKutu, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#D62828' }}>!</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: t.text }]}>Bağlantı hatası</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>Etkinlikler yüklenemiyor</Text>
          </View>
        </View>
      )}

      {/* Etkinlik yok */}
      {!yukleniyor && !hata && etkinlikler.length === 0 && (
        <View style={[s.durumKutu, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#A5D6A7', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+</Text></View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: '#2E7D32' }]}>Yaklaşan etkinlik yok</Text>
            <Text style={[s.normalAlt, { color: t.textSecondary }]}>İstanbul'da trafik rahat!</Text>
          </View>
        </View>
      )}

      {/* Etkinlik kartlari */}
      {!yukleniyor && etkinlikler.length > 0 && (
        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
          {etkinlikler.map(e => {
            const efkiStil = ETKI_STIL[e.etki] || ETKI_STIL.diger;
            return (
              <TouchableOpacity
                key={e.id}
                style={[s.etkinlikKart, { backgroundColor: t.bgCard, borderColor: t.kartBorder }]}
                onPress={() => ayrinti(e)}
                activeOpacity={0.7}
              >
                <View style={s.kartUst}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.baslikKart, { color: t.primary }]} numberOfLines={2}>
                      {e.baslik}
                    </Text>
                    <Text style={[s.tarihKart, { color: t.textSecondary }]}>
                      {tarihinTurkce(e.tarih)}
                    </Text>
                  </View>
                </View>
                <View style={s.kartAlt}>
                  <View style={[s.etkiBadge, { backgroundColor: efkiStil.renk + '20' }]}>
                    <Text style={[s.etkiBadgeYazi, { color: efkiStil.renk }]}>
                      {efkiStil.etiket}
                    </Text>
                  </View>
                  <Text style={[s.konumKart, { color: t.text }]} numberOfLines={1}>
                    {e.konum}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
   Detail Modal
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
      <View style={[s.modalArka, { backgroundColor: t.modalOverlay }]}>
        <View style={[s.modalKutu, { backgroundColor: t.modalBg }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Baslik */}
            <View style={s.detailBaslik}>
              <Text style={[s.detailBaslikYazi, { color: t.primary }]}>
                {etkinlik.baslik}
              </Text>
            </View>

            {/* Etki Badge */}
            <View style={[s.detailEtkiBadge, { backgroundColor: efkiStil.renk + '20' }]}>
              <Text style={[s.detailEtkiBadgeYazi, { color: efkiStil.renk }]}>
                {efkiStil.etiket}
              </Text>
            </View>

            {/* Tarih Araligi */}
            <View style={s.detailSecim}>
              <Text style={[s.detailSecimBaslik, { color: t.primary }]}>Tarih</Text>
              <Text style={[s.detailSecimIcerik, { color: t.text }]}>
                {tarihAraligi}
              </Text>
            </View>

            {/* Konum */}
            <View style={s.detailSecim}>
              <Text style={[s.detailSecimBaslik, { color: t.primary }]}>Konum</Text>
              <Text style={[s.detailSecimIcerik, { color: t.text }]}>
                {etkinlik.konum}
              </Text>
            </View>

            {/* Etkilenen Yollar */}
            <View style={s.detailSecim}>
              <Text style={[s.detailSecimBaslik, { color: t.primary }]}>Etkilenen Yollar</Text>
              <Text style={[s.detailSecimIcerik, { color: t.text }]}>
                {etkinlik.etkilenen_yollar}
              </Text>
            </View>

            {/* Aciklama */}
            <View style={s.detailSecim}>
              <Text style={[s.detailSecimBaslik, { color: t.primary }]}>Açıklama</Text>
              <Text style={[s.detailSecimIcerik, { color: t.text }]}>
                {etkinlik.aciklama}
              </Text>
            </View>
          </ScrollView>

          {/* Kapat Butonu */}
          <TouchableOpacity
            style={[s.kapatBtn, { backgroundColor: t.bgSecondary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[s.kapatYazi, { color: t.primary }]}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */

const s = StyleSheet.create({
  // Container
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EAF4FB',
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

  // Başlık satırı
  baslikSatir: {
    marginBottom: 12,
  },
  baslik: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0077B6',
  },

  // Durum kutusu (yükleniyor, hata, boş)
  durumKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
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

  // Etkinlik kartı
  etkinlikKart: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  baslikKart: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  tarihKart: {
    fontSize: 12,
    marginTop: 4,
  },
  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  etkiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etkiBadgeYazi: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  konumKart: {
    fontSize: 11,
    flex: 1,
  },

  // Detail Modal
  modalArka: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKutu: {
    backgroundColor: '#F0F8FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '88%',
  },
  detailBaslik: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  detailBaslikYazi: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 28,
  },
  detailEtkiBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailEtkiBadgeYazi: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailSecim: {
    marginBottom: 16,
  },
  detailSecimBaslik: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0077B6',
    marginBottom: 6,
  },
  detailSecimIcerik: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Kapat butonu
  kapatBtn: {
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  kapatYazi: {
    fontSize: 14,
    fontWeight: '600',
  },
});
