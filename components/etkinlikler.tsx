import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

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

/* ═══════════════════════════════════════════
   Tip → Emoji eşleştirmesi
   ═══════════════════════════════════════════ */

const TIP_EMOJI: Record<string, string> = {
  maraton: '🏃',
  yuruyus: '🚶',
  bisiklet: '🚴',
  diplomatik: '🏛',
  miting: '📢',
  festival: '🎉',
  resmi_toren: '👑',
  diger: '📌',
};

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

  const cek = useCallback(async () => {
    try {
      setYukleniyor(true);
      setHata(false);

      const { data, error } = await supabase
        .from('etkinlikler')
        .select('*')
        .eq('aktif', true)
        .gte('tarih', new Date().toISOString())
        .order('tarih', { ascending: true })
        .limit(50);

      if (error) throw error;

      setEtkinlikler(data || []);
    } catch {
      setHata(true);
      setEtkinlikler([]);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { cek(); }, [cek]);

  return { etkinlikler, yukleniyor, hata, yenile: cek };
}

/* ═══════════════════════════════════════════
   Bileşen: EtkinliklerBandi
   ═══════════════════════════════════════════ */

export function EtkinliklerBandi() {
  const { etkinlikler, yukleniyor, hata } = useEtkinlikler();
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
    <View style={s.container}>
      {/* Başlık */}
      <View style={s.baslikSatir}>
        <Text style={s.baslik}>Yaklaşan Kent Etkinlikleri</Text>
      </View>

      {/* Yükleniyor */}
      {yukleniyor && (
        <View style={[s.durumKutu, { backgroundColor: '#FFFFFF', borderColor: '#B0D4E8' }]}>
          <ActivityIndicator size="small" color="#0077B6" />
          <Text style={[s.durumYazi, { color: '#5A7A8A' }]}>Etkinlikler kontrol ediliyor...</Text>
        </View>
      )}

      {/* Hata */}
      {!yukleniyor && hata && (
        <View style={[s.durumKutu, { backgroundColor: '#FFFFFF', borderColor: '#B0D4E8' }]}>
          <Text style={{ fontSize: 22 }}>⚠️</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: '#1A1A2E' }]}>Bağlantı hatası</Text>
            <Text style={[s.normalAlt, { color: '#5A7A8A' }]}>Etkinlikler yüklenemiyor</Text>
          </View>
        </View>
      )}

      {/* Etkinlik yok */}
      {!yukleniyor && !hata && etkinlikler.length === 0 && (
        <View style={[s.durumKutu, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
          <Text style={{ fontSize: 22 }}>✅</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.normalYazi, { color: '#2E7D32' }]}>Yaklaşan etkinlik yok</Text>
            <Text style={[s.normalAlt, { color: '#5A7A8A' }]}>İstanbul'da trafik rahat!</Text>
          </View>
        </View>
      )}

      {/* Etkinlik kartları */}
      {!yukleniyor && etkinlikler.length > 0 && (
        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
          {etkinlikler.map(e => {
            const emojiTip = TIP_EMOJI[e.tip] || '📌';
            const efkiStil = ETKI_STIL[e.etki] || ETKI_STIL.diger;
            return (
              <TouchableOpacity
                key={e.id}
                style={[s.etkinlikKart, { backgroundColor: '#FFFFFF', borderColor: '#B0D4E8' }]}
                onPress={() => ayrinti(e)}
                activeOpacity={0.7}
              >
                <View style={s.kartUst}>
                  <Text style={s.emoji}>{emojiTip}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.baslikKart, { color: '#0077B6' }]} numberOfLines={2}>
                      {e.baslik}
                    </Text>
                    <Text style={[s.tarihKart, { color: '#5A7A8A' }]}>
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
                  <Text style={[s.konumKart, { color: '#1A1A2E' }]} numberOfLines={1}>
                    📍 {e.konum}
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
}: {
  visible: boolean;
  etkinlik: Etkinlik;
  onClose: () => void;
}) {
  const emojiTip = TIP_EMOJI[etkinlik.tip] || '📌';
  const efkiStil = ETKI_STIL[etkinlik.etki] || ETKI_STIL.diger;

  const baslangic = tarihinTurkce(etkinlik.tarih);
  const bitis = etkinlik.bitis_tarih ? tarihinTurkce(etkinlik.bitis_tarih) : null;
  const tarihAraligi = bitis ? `${baslangic} - ${bitis}` : baslangic;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalArka}>
        <View style={s.modalKutu}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Başlık */}
            <View style={s.detailBaslik}>
              <Text style={{ fontSize: 48 }}>{emojiTip}</Text>
              <Text style={[s.detailBaslikYazi, { color: '#0077B6' }]}>
                {etkinlik.baslik}
              </Text>
            </View>

            {/* Etki Badge */}
            <View style={[s.detailEtkiBadge, { backgroundColor: efkiStil.renk + '20' }]}>
              <Text style={[s.detailEtkiBadgeYazi, { color: efkiStil.renk }]}>
                {efkiStil.etiket}
              </Text>
            </View>

            {/* Tarih Aralığı */}
            <View style={s.detailSecim}>
              <Text style={s.detailSecimBaslik}>Tarih</Text>
              <Text style={[s.detailSecimIcerik, { color: '#1A1A2E' }]}>
                {tarihAraligi}
              </Text>
            </View>

            {/* Konum */}
            <View style={s.detailSecim}>
              <Text style={s.detailSecimBaslik}>📍 Konum</Text>
              <Text style={[s.detailSecimIcerik, { color: '#1A1A2E' }]}>
                {etkinlik.konum}
              </Text>
            </View>

            {/* Etkilenen Yollar */}
            <View style={s.detailSecim}>
              <Text style={s.detailSecimBaslik}>🛣 Etkilenen Yollar</Text>
              <Text style={[s.detailSecimIcerik, { color: '#1A1A2E' }]}>
                {etkinlik.etkilenen_yollar}
              </Text>
            </View>

            {/* Açıklama */}
            <View style={s.detailSecim}>
              <Text style={s.detailSecimBaslik}>📝 Açıklama</Text>
              <Text style={[s.detailSecimIcerik, { color: '#1A1A2E' }]}>
                {etkinlik.aciklama}
              </Text>
            </View>
          </ScrollView>

          {/* Kapat Butonu */}
          <TouchableOpacity
            style={[s.kapatBtn, { backgroundColor: '#D6EAF8' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[s.kapatYazi, { color: '#0077B6' }]}>Kapat</Text>
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
  emoji: {
    fontSize: 24,
    marginRight: 10,
    marginTop: 2,
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
  },
  detailBaslikYazi: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
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
