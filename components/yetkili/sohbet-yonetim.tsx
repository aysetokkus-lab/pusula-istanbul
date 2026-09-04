/* ═══════════════════════════════════════════
   SOHBET YÖNETİMİ — Inline yönetim bileşeni (Eyl 2026)
   Eski admin-moderasyon / admin-banlar / admin-kufur ekranlarının
   tek bileşende birleşmiş hali. Sohbet sekmesinde, header'ın altında
   ve mesaj listesinin ÜSTÜNDE, <YetkiliBolum sadeceAdmin> içinde render edilir.
   Eyl 2026: admin paneli kaldırıldı, inline yönetim.
   Eyl 2026 redesign — Kobalt & Menekşe; işlev değişmedi
   (hex → token, Poppins, Segmentler/Rozet/BirincilButon/BosDurum).
   ═══════════════════════════════════════════ */
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { useAdmin } from '../../hooks/use-admin';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../hooks/use-tema';
import { Font, Palette, Radius, type TemaRenkleri } from '../../constants/theme';
import { BirincilButon, BosDurum, Rozet, Segmentler } from '../ui/pusula-ui';

type Sekme = 'raporlar' | 'banlar' | 'kufur';

/* ─────────────────────────────────────────
   ANA BİLEŞEN — sekme çubuğu
   ───────────────────────────────────────── */
export function SohbetYonetim() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isAdmin } = useAdmin();

  const [sekme, setSekme] = useState<Sekme>('raporlar');
  const [bekleyenSayisi, setBekleyenSayisi] = useState(0);

  // Sekme rozetinde gösterilen bekleyen rapor sayısı (yalnızca sayım)
  const bekleyenSay = useCallback(async () => {
    const { count } = await supabase
      .from('raporlanan_mesajlar')
      .select('id', { count: 'exact', head: true })
      .eq('durum', 'bekliyor');
    setBekleyenSayisi(count ?? 0);
  }, []);

  useEffect(() => {
    if (isAdmin) bekleyenSay();
  }, [isAdmin, bekleyenSay]);

  // Bekleyen sayısı segment etiketinde parantez içinde gösterilir (eski rozet davranışı)
  const sekmeler: { id: Sekme; baslik: string }[] = [
    { id: 'raporlar', baslik: bekleyenSayisi > 0 ? `Raporlar (${bekleyenSayisi})` : 'Raporlar' },
    { id: 'banlar', baslik: 'Banlar' },
    { id: 'kufur', baslik: 'Küfür Listesi' },
  ];

  return (
    <View style={s.govde}>
      <View style={s.sekmeBar}>
        <Segmentler secenekler={sekmeler} aktif={sekme} onSec={setSekme} />
      </View>

      {sekme === 'raporlar' && <RaporlarSekmesi onDegisti={bekleyenSay} />}
      {sekme === 'banlar' && <BanlarSekmesi />}
      {sekme === 'kufur' && <KufurSekmesi />}
    </View>
  );
}

/* ─────────────────────────────────────────
   RAPORLAR SEKMESİ (eski admin-moderasyon)
   ───────────────────────────────────────── */
interface Rapor {
  id: string;
  mesaj_id: string;
  mesaj_metni: string;
  mesaj_sahibi_id: string;
  mesaj_sahibi_isim: string;
  raporlayan_id: string | null;
  sebep: string;
  otomatik: boolean;
  durum: string;
  created_at: string;
}

const SEBEP_RENK: Record<string, string> = {
  kufur: Palette.kapali,
  spam: Palette.uyari,
  uygunsuz: Palette.menekse,
  diger: Palette.bilgi,
};

function RaporlarSekmesi({ onDegisti }: { onDegisti?: () => void }) {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();

  const [raporlar, setRaporlar] = useState<Rapor[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState<'bekliyor' | 'hepsi'>('bekliyor');

  // Ban modal
  const [banModal, setBanModal] = useState(false);
  const [banHedef, setBanHedef] = useState<{ id: string; isim: string } | null>(null);
  const [banSebep, setBanSebep] = useState('');
  const [banSure, setBanSure] = useState('');

  const cek = useCallback(async () => {
    let query = supabase
      .from('raporlanan_mesajlar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filtre === 'bekliyor') {
      query = query.eq('durum', 'bekliyor');
    }

    const { data } = await query;
    if (data) setRaporlar(data);
    setYukleniyor(false);
  }, [filtre]);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const islemYap = async (rapor: Rapor, yeniDurum: 'onaylandi' | 'silindi') => {
    const { data: { user } } = await supabase.auth.getUser();

    // Raporu güncelle
    await supabase
      .from('raporlanan_mesajlar')
      .update({
        durum: yeniDurum,
        islem_yapan_id: user?.id,
        islem_tarihi: new Date().toISOString(),
      })
      .eq('id', rapor.id);

    // Mesajı sil (eğer 'silindi' ise)
    if (yeniDurum === 'silindi') {
      await supabase
        .from('sohbet_mesajlari')
        .delete()
        .eq('id', rapor.mesaj_id);
    }

    cek();
    onDegisti?.();
  };

  const mesajSilOnayla = (rapor: Rapor) => {
    Alert.alert(
      'Mesajı Sil',
      `"${rapor.mesaj_metni.substring(0, 80)}..." mesajı silinecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => islemYap(rapor, 'silindi'),
        },
      ]
    );
  };

  const banAc = (rapor: Rapor) => {
    setBanHedef({ id: rapor.mesaj_sahibi_id, isim: rapor.mesaj_sahibi_isim });
    setBanSebep(`Uygunsuz mesaj: "${rapor.mesaj_metni.substring(0, 50)}..."`);
    setBanSure('');
    setBanModal(true);
  };

  const banUygula = async () => {
    if (!banHedef) return;

    const { data: { user } } = await supabase.auth.getUser();
    const sureDk = banSure ? parseInt(banSure) : null;

    await supabase.from('banlanan_kullanicilar').insert({
      kullanici_id: banHedef.id,
      sebep: banSebep || 'Uygunsuz davranış',
      banlayan_id: user?.id,
      sure_dk: sureDk,
      bitis_tarihi: sureDk
        ? new Date(Date.now() + sureDk * 60 * 1000).toISOString()
        : null,
      aktif: true,
    });

    setBanModal(false);
    Alert.alert('Ban Uygulandı', `${banHedef.isim} banlandı.`);
  };

  return (
    <View>
      {/* Filtre */}
      <View style={s.filtreBar}>
        <View style={{ flex: 1 }}>
          <Segmentler
            secenekler={[
              { id: 'bekliyor' as const, baslik: 'Bekleyenler' },
              { id: 'hepsi' as const, baslik: 'Tümü' },
            ]}
            aktif={filtre}
            onSec={f => { setFiltre(f); setYukleniyor(true); }}
          />
        </View>
        <TouchableOpacity onPress={() => { setYukleniyor(true); cek(); onDegisti?.(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.yenileYazi}>Yenile</Text>
        </TouchableOpacity>
      </View>

      {/* Rapor Listesi */}
      <View style={s.liste}>
        {yukleniyor ? (
          <View style={s.inlineYukleniyor}>
            <ActivityIndicator size="small" color={t.primary} />
          </View>
        ) : raporlar.length === 0 ? (
          <BosDurum metin="Bekleyen rapor yok" />
        ) : (
          raporlar.map(r => (
            <View key={r.id} style={s.kart}>
              {/* Üst bilgi */}
              <View style={s.kartUst}>
                <View style={s.kartBilgi}>
                  <Text style={s.kartIsim}>{r.mesaj_sahibi_isim}</Text>
                  <Text style={s.kartTarih}>
                    {new Date(r.created_at).toLocaleString('tr-TR')}
                  </Text>
                </View>
                <View style={s.kartEtiketler}>
                  <Rozet renk={SEBEP_RENK[r.sebep] ?? Palette.bilgi}>{r.sebep}</Rozet>
                  {r.otomatik && (
                    <Rozet renk={t.primary}>Otomatik</Rozet>
                  )}
                </View>
              </View>

              {/* Mesaj içeriği */}
              <View style={s.mesajKutu}>
                <Text style={s.mesajMetni}>{r.mesaj_metni}</Text>
              </View>

              {/* İşlem butonları */}
              {r.durum === 'bekliyor' ? (
                <View style={s.kartAlt}>
                  <TouchableOpacity
                    style={[s.islemBtn, s.onayBtn]}
                    onPress={() => islemYap(r, 'onaylandi')}
                  >
                    <Text style={s.onayBtnYazi}>Uygun</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.islemBtn, s.silBtn]}
                    onPress={() => mesajSilOnayla(r)}
                  >
                    <Text style={s.silBtnYazi}>Mesajı Sil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.islemBtn, s.banBtn]}
                    onPress={() => banAc(r)}
                  >
                    <Text style={s.banBtnYazi}>Banla</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.kartAlt}>
                  <Rozet renk={r.durum === 'silindi' ? t.durumKapali : r.durum === 'onaylandi' ? Palette.acik : t.textSecondary}>
                    {r.durum === 'silindi' ? 'Silindi' :
                      r.durum === 'onaylandi' ? 'Onaylandı' : r.durum}
                  </Rozet>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Ban Modal */}
      <Modal visible={banModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setBanModal(false)}>
              <Text style={s.modalIptal}>İptal</Text>
            </TouchableOpacity>
            <Text style={s.modalBaslik}>Kullanıcı Banla</Text>
            <TouchableOpacity onPress={banUygula}>
              <Text style={s.modalKaydet}>Banla</Text>
            </TouchableOpacity>
          </View>

          <View style={s.formAlani}>
            <Text style={s.label}>Kullanıcı</Text>
            <Text style={s.banIsim}>{banHedef?.isim}</Text>

            <Text style={s.label}>Sebep</Text>
            <TextInput
              style={s.input}
              value={banSebep}
              onChangeText={setBanSebep}
              placeholder="Ban sebebi"
              placeholderTextColor={t.textMuted}
              multiline
            />

            <Text style={s.label}>Süre (dakika, boş = kalıcı)</Text>
            <TextInput
              style={s.input}
              value={banSure}
              onChangeText={setBanSure}
              placeholder="Boş bırakırsan kalıcı ban"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
            />

            <View style={s.sureSec}>
              {[
                { label: '1 saat', dk: '60' },
                { label: '1 gün', dk: '1440' },
                { label: '1 hafta', dk: '10080' },
                { label: 'Kalıcı', dk: '' },
              ].map(o => (
                <TouchableOpacity
                  key={o.label}
                  style={[s.sureBtn, banSure === o.dk && s.sureBtnAktif]}
                  onPress={() => setBanSure(o.dk)}
                >
                  <Text style={[s.sureBtnYazi, banSure === o.dk && s.sureBtnYaziAktif]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─────────────────────────────────────────
   BANLAR SEKMESİ (eski admin-banlar)
   ───────────────────────────────────────── */
interface Ban {
  id: string;
  kullanici_id: string;
  sebep: string;
  sure_dk: number | null;
  bitis_tarihi: string | null;
  aktif: boolean;
  created_at: string;
  // join
  profil_isim?: string;
}

function BanlarSekmesi() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();

  const [banlar, setBanlar] = useState<Ban[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const cek = useCallback(async () => {
    const { data } = await supabase
      .from('banlanan_kullanicilar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Profil isimlerini çek
      const ids = [...new Set(data.map(b => b.kullanici_id))];
      const { data: profiller } = await supabase
        .from('profiles')
        .select('id, isim, soyisim')
        .in('id', ids);

      const profilMap: Record<string, string> = {};
      profiller?.forEach(p => {
        profilMap[p.id] = `${p.isim || ''} ${p.soyisim || ''}`.trim();
      });

      setBanlar(data.map(b => ({
        ...b,
        profil_isim: profilMap[b.kullanici_id] || 'Bilinmeyen',
      })));
    }
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const banKaldir = (ban: Ban) => {
    Alert.alert(
      'Banı Kaldır',
      `${ban.profil_isim} için ban kaldırılacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          onPress: async () => {
            await supabase
              .from('banlanan_kullanicilar')
              .update({ aktif: false })
              .eq('id', ban.id);
            cek();
          },
        },
      ]
    );
  };

  const aktifBanlar = banlar.filter(b => b.aktif);
  const kaldirilmisBanlar = banlar.filter(b => !b.aktif);

  return (
    <View>
      <View style={s.aracSatir}>
        <Text style={s.aracBilgi}>{aktifBanlar.length} aktif ban</Text>
        <TouchableOpacity onPress={() => { setYukleniyor(true); cek(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.yenileYazi}>Yenile</Text>
        </TouchableOpacity>
      </View>

      <View style={s.liste}>
        {yukleniyor ? (
          <View style={s.inlineYukleniyor}>
            <ActivityIndicator size="small" color={t.primary} />
          </View>
        ) : (
          <>
            {aktifBanlar.length === 0 && (
              <BosDurum metin="Aktif ban yok" />
            )}

            {aktifBanlar.map(b => (
              <View key={b.id} style={s.kart}>
                <View style={s.kartUst}>
                  <View style={s.kartBilgiBan}>
                    <Text style={s.kartIsimBan}>{b.profil_isim}</Text>
                    <Text style={s.kartSebep}>{b.sebep}</Text>
                    <Text style={s.kartTarihBan}>
                      {new Date(b.created_at).toLocaleString('tr-TR')}
                      {b.bitis_tarihi
                        ? ` — ${new Date(b.bitis_tarihi).toLocaleString('tr-TR')}'e kadar`
                        : ' — Kalıcı'}
                    </Text>
                  </View>
                  <Rozet renk={t.durumKapali}>Aktif</Rozet>
                </View>
                <BirincilButon
                  baslik="Banı Kaldır"
                  onPress={() => banKaldir(b)}
                  varyant="kobalt"
                  style={s.kaldirBtn}
                />
              </View>
            ))}

            {kaldirilmisBanlar.length > 0 && (
              <>
                <Text style={s.banBolumBaslik}>Kaldırılmış Banlar</Text>
                {kaldirilmisBanlar.map(b => (
                  <View key={b.id} style={[s.kart, s.kartPasif]}>
                    <Text style={s.kartIsimBan}>{b.profil_isim}</Text>
                    <Text style={s.kartSebep}>{b.sebep}</Text>
                    <Text style={s.kartTarihBan}>
                      {new Date(b.created_at).toLocaleString('tr-TR')} — Kaldırıldı
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────
   KÜFÜR LİSTESİ SEKMESİ (eski admin-kufur)
   ───────────────────────────────────────── */
interface KufurKelime {
  id: string;
  kelime: string;
  seviye: 'kesin' | 'suphe';
  aktif: boolean;
}

function KufurSekmesi() {
  const { t } = useTema();
  const s = createStyles(t);
  const { isYetkili } = useAdmin();

  const [kelimeler, setKelimeler] = useState<KufurKelime[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yeniKelime, setYeniKelime] = useState('');
  const [yeniSeviye, setYeniSeviye] = useState<'kesin' | 'suphe'>('kesin');

  const cek = useCallback(async () => {
    const { data } = await supabase
      .from('kufur_listesi')
      .select('*')
      .order('seviye', { ascending: true })
      .order('kelime', { ascending: true });
    if (data) setKelimeler(data);
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    if (isYetkili) cek();
  }, [isYetkili, cek]);

  const ekle = async () => {
    const temiz = yeniKelime.trim().toLowerCase();
    if (!temiz) return;

    const { error } = await supabase.from('kufur_listesi').insert({
      kelime: temiz,
      seviye: yeniSeviye,
      aktif: true,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Zaten var', 'Bu kelime listede zaten mevcut.');
      } else {
        Alert.alert('Hata', error.message);
      }
    } else {
      setYeniKelime('');
      cek();
    }
  };

  const sil = (k: KufurKelime) => {
    Alert.alert(
      'Kelimeyi Sil',
      `"${k.kelime}" listeden kaldırılacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            await supabase.from('kufur_listesi').delete().eq('id', k.id);
            cek();
          },
        },
      ]
    );
  };

  const seviyeDegistir = async (k: KufurKelime) => {
    const yeni = k.seviye === 'kesin' ? 'suphe' : 'kesin';
    await supabase
      .from('kufur_listesi')
      .update({ seviye: yeni })
      .eq('id', k.id);
    cek();
  };

  const kesinler = kelimeler.filter(k => k.seviye === 'kesin');
  const supheler = kelimeler.filter(k => k.seviye === 'suphe');

  return (
    <View>
      {/* Yeni kelime ekle */}
      <View style={s.ekleBar}>
        <TextInput
          style={s.ekleInput}
          value={yeniKelime}
          onChangeText={setYeniKelime}
          placeholder="Yeni kelime ekle..."
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[s.seviyeBtn, yeniSeviye === 'kesin' ? s.kesinBtn : s.supheBtn]}
          onPress={() => setYeniSeviye(yeniSeviye === 'kesin' ? 'suphe' : 'kesin')}
        >
          <Text style={[s.seviyeBtnYazi, { color: yeniSeviye === 'kesin' ? t.durumKapali : Palette.uyari }]}>
            {yeniSeviye === 'kesin' ? 'Kesin' : 'Şüphe'}
          </Text>
        </TouchableOpacity>
        <BirincilButon baslik="+" onPress={ekle} varyant="cta" style={s.ekleBtn} />
      </View>

      <View style={s.aracSatir}>
        <Text style={s.aracBilgi}>{kelimeler.length} kelime</Text>
        <TouchableOpacity onPress={() => { setYukleniyor(true); cek(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.yenileYazi}>Yenile</Text>
        </TouchableOpacity>
      </View>

      <View style={s.liste}>
        {yukleniyor ? (
          <View style={s.inlineYukleniyor}>
            <ActivityIndicator size="small" color={t.primary} />
          </View>
        ) : (
          <>
            {/* Kesin engellenenler */}
            <Text style={s.kufurBolumBaslik}>
              Kesin Engel ({kesinler.length})
            </Text>
            <Text style={s.bolumAciklama}>Bu kelimeler mesajın gönderilmesini engeller</Text>
            <View style={s.kelimeGrid}>
              {kesinler.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={[s.kelimeChip, s.kesinChip]}
                  onLongPress={() => sil(k)}
                  onPress={() => seviyeDegistir(k)}
                >
                  <Text style={s.kelimeChipYazi}>{k.kelime}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Şüpheli */}
            <Text style={[s.kufurBolumBaslik, { marginTop: 24 }]}>
              Şüpheli ({supheler.length})
            </Text>
            <Text style={s.bolumAciklama}>Bu kelimeler admin kuyruğuna düşer, mesaj gönderilir</Text>
            <View style={s.kelimeGrid}>
              {supheler.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={[s.kelimeChip, s.supheChip]}
                  onLongPress={() => sil(k)}
                  onPress={() => seviyeDegistir(k)}
                >
                  <Text style={[s.kelimeChipYazi, { color: Palette.uyari }]}>{k.kelime}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.ipucu}>
              <Text style={s.ipucuYazi}>
                Kelimeye dokun: seviye değiştir | Basılı tut: sil
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────
   STİLLER
   ───────────────────────────────────────── */
const createStyles = (t: TemaRenkleri) => StyleSheet.create({
  govde: { paddingBottom: 12 },

  // Sekme çubuğu (Segmentler sarmalayıcısı)
  sekmeBar: { marginHorizontal: 16, marginTop: 12, marginBottom: 4 },

  // Ortak
  inlineYukleniyor: { paddingVertical: 24, alignItems: 'center' },
  yenileYazi: { fontFamily: Font.bold, fontSize: 12, color: t.primary },
  aracSatir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  aracBilgi: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary },
  liste: { paddingHorizontal: 16 },
  kart: {
    backgroundColor: t.bgCard, borderRadius: Radius.lg, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: t.kartBorder,
  },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  // Raporlar
  filtreBar: {
    flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, gap: 12,
  },
  kartBilgi: { flex: 1 },
  kartIsim: { fontFamily: Font.bold, fontSize: 14, color: t.text, letterSpacing: -0.3 },
  kartTarih: { fontFamily: Font.regular, fontSize: 11, color: t.textMuted, marginTop: 2 },
  kartEtiketler: { flexDirection: 'row', gap: 6 },
  mesajKutu: {
    backgroundColor: t.bgInput, borderRadius: Radius.sm, padding: 12,
    marginTop: 12, borderLeftWidth: 3, borderLeftColor: t.kartBorder,
  },
  mesajMetni: { fontFamily: Font.regular, fontSize: 13, color: t.text, lineHeight: 18 },
  kartAlt: { flexDirection: 'row', marginTop: 12, gap: 8 },
  islemBtn: { borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8, minHeight: 32, justifyContent: 'center' },
  onayBtn: { backgroundColor: Palette.acikTint },
  onayBtnYazi: { fontFamily: Font.bold, fontSize: 12, color: Palette.acik },
  silBtn: { backgroundColor: Palette.kapaliTint },
  silBtnYazi: { fontFamily: Font.bold, fontSize: 12, color: t.durumKapali },
  banBtn: { backgroundColor: t.text },
  banBtnYazi: { fontFamily: Font.bold, fontSize: 12, color: t.bg },

  // Ban modal
  modal: { flex: 1, backgroundColor: t.bg, paddingTop: 16 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: t.kartBorder, backgroundColor: t.bgCard,
  },
  modalIptal: { fontFamily: Font.regular, color: t.textSecondary, fontSize: 15 },
  modalBaslik: { fontFamily: Font.bold, fontSize: 16, color: t.text, letterSpacing: -0.3 },
  modalKaydet: { fontFamily: Font.bold, color: t.durumKapali, fontSize: 15 },
  formAlani: { padding: 16 },
  label: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary, marginTop: 16, marginBottom: 6 },
  banIsim: { fontFamily: Font.bold, fontSize: 16, color: t.text, letterSpacing: -0.3 },
  input: {
    minHeight: 48, backgroundColor: t.bgInput, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder,
  },
  sureSec: { flexDirection: 'row', gap: 8, marginTop: 16 },
  sureBtn: {
    backgroundColor: t.bgCard, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: t.kartBorder,
  },
  sureBtnAktif: { backgroundColor: t.primary, borderColor: t.primary },
  sureBtnYazi: { fontFamily: Font.semibold, fontSize: 12, color: t.textSecondary },
  sureBtnYaziAktif: { color: '#FFFFFF' },

  // Banlar
  banBolumBaslik: {
    fontFamily: Font.semibold, fontSize: 13, color: t.textSecondary,
    marginTop: 24, marginBottom: 12,
  },
  kartPasif: { opacity: 0.5 },
  kartBilgiBan: { flex: 1, marginRight: 12 },
  kartIsimBan: { fontFamily: Font.bold, fontSize: 15, color: t.text, letterSpacing: -0.3 },
  kartSebep: { fontFamily: Font.regular, fontSize: 12, color: t.textSecondary, marginTop: 4 },
  kartTarihBan: { fontFamily: Font.regular, fontSize: 11, color: t.textMuted, marginTop: 4 },
  kaldirBtn: { marginTop: 12 },

  // Küfür listesi
  ekleBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8, alignItems: 'center',
  },
  ekleInput: {
    flex: 1, height: 48, backgroundColor: t.bgInput, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 0,
    fontFamily: Font.regular, fontSize: 14, color: t.text, borderWidth: 1, borderColor: t.kartBorder,
  },
  seviyeBtn: {
    borderRadius: Radius.sm, paddingHorizontal: 14, height: 48, justifyContent: 'center',
  },
  kesinBtn: { backgroundColor: Palette.kapaliTint },
  supheBtn: { backgroundColor: Palette.safranTint },
  seviyeBtnYazi: { fontFamily: Font.bold, fontSize: 12, color: t.text },
  ekleBtn: { width: 48, paddingHorizontal: 0 },
  kufurBolumBaslik: {
    fontFamily: Font.bold, fontSize: 14, color: t.text, marginBottom: 4, letterSpacing: -0.3,
  },
  bolumAciklama: {
    fontFamily: Font.regular, fontSize: 11, color: t.textMuted, marginBottom: 12,
  },
  kelimeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kelimeChip: {
    borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5,
  },
  kesinChip: {
    backgroundColor: `${Palette.kapali}14`, borderColor: `${Palette.kapali}40`,
  },
  supheChip: {
    backgroundColor: `${Palette.uyari}14`, borderColor: `${Palette.uyari}40`,
  },
  kelimeChipYazi: { fontFamily: Font.semibold, fontSize: 13, color: t.durumKapali },
  ipucu: {
    marginTop: 24, alignItems: 'center',
  },
  ipucuYazi: { fontFamily: Font.regular, fontSize: 11, color: t.textMuted, fontStyle: 'italic' },
});
