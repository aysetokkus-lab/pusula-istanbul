// Eyl 2026 — Özel mesaj (DM) ekranı (Stack route: /dm/[id]?isim=...), "Kobalt & Menekşe" dili.
// GradyanHeader (geri + avatar harfi + isim + "..." menü), balonlar sohbet.tsx diliyle (kendi = kobalt sağda, karşı = kart solda),
// giriş alanı GorselButon + TextInput + safran Gönder. Veri: hooks/use-dm.ts (RPC dm_gonder, realtime + polling, okundu takibi).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTema } from '../../hooks/use-tema';
import { useDmMesajlar, type DmMesaj } from '../../hooks/use-dm';
import { useKufurFiltre } from '../../hooks/use-kufur-filtre';
import { supabase } from '../../lib/supabase';
import { Font, Palette, Radius, Space, type TemaRenkleri } from '../../constants/theme';
import { GradyanHeader } from '../../components/ui/pusula-ui';
// Eyl 2026: karşı tarafın profil fotoğrafı (yoksa harf)
import { Avatar } from '../../components/avatar';
import { useAvatar } from '../../hooks/use-avatarlar';
// Eyl 2026 GIZLILIK: DM görselleri özel bucket (dm-gorseller) + imzalı URL — sohbetGorselYukle (public) DM'de KULLANILMAZ
import { DmMesajGorseli, GorselButon, GorselOnizleme, TamEkranGorsel, dmGorselYukle, gorselSec, type SecilenGorsel } from '../../components/sohbet-gorsel';

/* ═══════════════════════════════════════════
   Yardımcılar (sohbet.tsx ile aynı)
   ═══════════════════════════════════════════ */
function basHarfler(isim: string): string {
  return isim.trim().charAt(0).toUpperCase() || '?';
}

function saat(iso: string): string {
  try {
    const d = new Date(iso);
    const simdi = new Date();
    const sa = String(d.getHours()).padStart(2, '0');
    const dk = String(d.getMinutes()).padStart(2, '0');
    const saatStr = `${sa}:${dk}`;
    if (d.toDateString() === simdi.toDateString()) return saatStr;
    const dun = new Date(simdi);
    dun.setDate(dun.getDate() - 1);
    if (d.toDateString() === dun.toDateString()) return `Dün ${saatStr}`;
    const farkGun = Math.floor((simdi.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (farkGun < 7) {
      const gunler = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      return `${gunler[d.getDay()]} ${saatStr}`;
    }
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    return `${gun}.${ay} ${saatStr}`;
  } catch {
    return '';
  }
}

// Avatar rengi: isim ilk harfine göre deterministik (sohbet.tsx kopyası)
function renkUret(isim: string): string {
  const renkler = [
    Palette.kobalt,
    Palette.kobaltAcik,
    Palette.kobaltKoyu,
    Palette.menekse,
    Palette.kobaltOrta,
  ];
  const kod = isim.charCodeAt(0);
  return renkler[kod % renkler.length];
}

/* ─── İkonlar: 24px stroke SVG (emoji yok) ─── */
function GeriIkon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MenuIkon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={2} fill={color} />
      <Circle cx={12} cy={12} r={2} fill={color} />
      <Circle cx={19} cy={12} r={2} fill={color} />
    </Svg>
  );
}

/* ═══════════════════════════════════════════
   Ekran
   ═══════════════════════════════════════════ */
export default function DmEkrani() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const styles = createStyles(t);
  const params = useLocalSearchParams<{ id: string; isim?: string }>();
  const konusmaId = typeof params.id === 'string' ? params.id : null;
  const paramIsim = typeof params.isim === 'string' ? params.isim : '';

  const flatListRef = useRef<FlatList>(null);
  const { mesajlar, yukleniyor, gonder, sil, karsiOkunduAt, benimId, karsiId, karsiIsim } = useDmMesajlar(konusmaId);
  const { filtrele } = useKufurFiltre();

  const [yeniMesaj, setYeniMesaj] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);
  const [secilenGorsel, setSecilenGorsel] = useState<SecilenGorsel | null>(null);
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [tamEkranUrl, setTamEkranUrl] = useState<string | null>(null);

  // Karşı tarafın adı: parametre > konuşma satırı > mesajlardan
  const digerAd =
    paramIsim ||
    karsiIsim ||
    mesajlar.find(m => m.gonderen_id !== benimId)?.gonderen_isim ||
    'Rehber';
  const avatarRenk = renkUret(digerAd);
  // Eyl 2026: karşı tarafın id'si konuşma satırından, yoksa mesajlardan
  const digerId = karsiId || mesajlar.find(m => m.gonderen_id !== benimId)?.gonderen_id || null;
  const digerAvatar = useAvatar(digerId);

  // Kendi son mesajım (Okundu / İletildi etiketi için)
  const sonKendiId = (() => {
    for (let i = mesajlar.length - 1; i >= 0; i--) {
      if (mesajlar[i].gonderen_id === benimId) return mesajlar[i].id;
    }
    return null;
  })();

  /* ─── Aşağı kaydır ─── */
  useEffect(() => {
    if (mesajlar.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [mesajlar.length]);

  /* ─── Gönder ─── */
  const mesajGonder = async () => {
    const metin = yeniMesaj.trim();
    if ((!metin && !secilenGorsel) || !konusmaId || gonderiyor) return;

    // Küfür filtresi (görsel-only mesajda boş metin filtreden geçer)
    if (metin) {
      const filtreResult = filtrele(metin);
      if (filtreResult.engellendi) {
        Alert.alert('Mesaj Engelendi', 'Mesajınız uygunsuz içerik barındırıyor. Lütfen düzenleyip tekrar gönderin.');
        return;
      }
    }

    setGonderiyor(true);
    try {
      let gorselUrl: string | null = null;
      if (secilenGorsel) {
        setGorselYukleniyor(true);
        gorselUrl = await dmGorselYukle(konusmaId, secilenGorsel.uri, secilenGorsel.mime);   // özel bucket yolu
        setGorselYukleniyor(false);
        if (!gorselUrl) {
          Alert.alert('Görsel yüklenemedi', 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
          return;
        }
      }
      const sonuc = await gonder(metin, gorselUrl);
      if (!sonuc.ok) {
        Alert.alert('Gönderilemedi', sonuc.hata || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        return;
      }
      setYeniMesaj('');
      setSecilenGorsel(null);
    } finally {
      setGonderiyor(false);
      setGorselYukleniyor(false);
    }
  };

  /* ─── Görsel seç ─── */
  const gorselEkle = async () => {
    const g = await gorselSec();
    if (g) setSecilenGorsel(g);
  };

  /* ─── Kullanıcıyı engelle (sohbet.tsx kullaniciEngelle ile aynı tablo) ─── */
  const kullaniciEngelle = useCallback(() => {
    if (!benimId || !karsiId) { Alert.alert('Bilgi', 'Konuşma bilgisi henüz yüklenmedi.'); return; }
    if (karsiId === benimId) { Alert.alert('Bilgi', 'Kendinizi engelleyemezsiniz.'); return; }
    const sonKarsiMesaj = [...mesajlar].reverse().find(m => m.gonderen_id === karsiId)?.mesaj || '';
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${digerAd} adlı kullanıcıyı engellemek istiyor musunuz?\n\nEngellediğiniz kullanıcı size özel mesaj gönderemeyecek. Uygunsuz içerik geliştiriciye bildirilecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('engellenen_kullanicilar').insert({
                engelleyen_id: benimId,
                engellenen_id: karsiId,
                engellenen_isim: digerAd,
                sebep: sonKarsiMesaj.substring(0, 200),
                bildirildi: false,
              });
              if (error && !error.message.includes('duplicate')) throw error;
              Alert.alert('Engellendi', `${digerAd} engellendi. Geliştirici bu durumdan haberdar edildi.`, [
                { text: 'Tamam', onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert('Hata', e?.message || 'Engelleme başarısız. Lütfen tekrar deneyin.');
            }
          },
        },
      ]
    );
  }, [benimId, karsiId, digerAd, mesajlar]);

  /* ─── Header "..." menüsü ─── */
  const headerMenu = useCallback(() => {
    Alert.alert(digerAd, 'Bu konuşma için', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kullanıcıyı Engelle', style: 'destructive', onPress: kullaniciEngelle },
    ]);
  }, [digerAd, kullaniciEngelle]);

  /* ─── Mesaj raporla (kaynak: dm) ─── */
  const mesajRaporla = useCallback((mesaj: DmMesaj) => {
    if (!benimId) return;
    const metin = mesaj.mesaj || (mesaj.gorsel_url ? 'Görsel' : '');
    Alert.alert(
      'Mesajı Raporla',
      `"${metin.substring(0, 80)}${metin.length > 80 ? '...' : ''}"\n\nBu mesajı uygunsuz içerik olarak raporlamak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('raporlanan_mesajlar').insert({
                mesaj_id: mesaj.id,
                mesaj_metni: metin,
                mesaj_sahibi_id: mesaj.gonderen_id,
                mesaj_sahibi_isim: mesaj.gonderen_isim || digerAd,
                raporlayan_id: benimId,
                sebep: 'uygunsuz',
                kaynak: 'dm',
              });
              if (error) throw error;
              Alert.alert('Teşekkürler', 'Raporunuz moderatörlere iletildi.');
            } catch {
              Alert.alert('Hata', 'Rapor gönderilemedi. Lütfen tekrar deneyin.');
            }
          },
        },
      ]
    );
  }, [benimId, digerAd]);

  /* ─── Kendi mesajını sil ─── */
  const mesajSil = useCallback((mesaj: DmMesaj) => {
    const metin = mesaj.mesaj || (mesaj.gorsel_url ? 'Görsel' : '');
    Alert.alert(
      'Mesajı Sil',
      `"${metin.substring(0, 100)}${metin.length > 100 ? '...' : ''}"\n\nBu mesaj kalıcı olarak silinecek. Devam edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const r = await sil(mesaj.id);
            if (!r.ok) Alert.alert('Hata', r.hata || 'Mesaj silinemedi. Lütfen tekrar deneyin.');
          },
        },
      ]
    );
  }, [sil]);

  /* ─── Balona uzun basma: kendi → Sil, karşı → Raporla ─── */
  const mesajAksiyonlari = useCallback((mesaj: DmMesaj) => {
    if (!benimId) return;
    const kendi = mesaj.gonderen_id === benimId;
    const metin = mesaj.mesaj || (mesaj.gorsel_url ? 'Görsel' : '');
    Alert.alert(
      kendi ? 'Mesajınız' : digerAd,
      `"${metin.substring(0, 100)}${metin.length > 100 ? '...' : ''}"`,
      kendi
        ? [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => mesajSil(mesaj) },
          ]
        : [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Raporla', style: 'destructive', onPress: () => mesajRaporla(mesaj) },
          ]
    );
  }, [benimId, digerAd, mesajSil, mesajRaporla]);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  const header = (
    <GradyanHeader paddingTop={insets.top + 8} style={styles.header}>
      <View style={styles.headerSatir}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn} accessibilityLabel="Geri" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <GeriIkon />
        </TouchableOpacity>
        <Avatar url={digerAvatar} isim={digerAd} boyut={40} renk={avatarRenk} harf={basHarfler(digerAd)} cerceveRenk={Palette.seffafBeyaz20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerIsim} numberOfLines={1}>{digerAd}</Text>
          {/* Eyl 2026 GIZLILIK: açık ifade — DM yalnızca iki katılımcıya görünür (RLS), yönetici okuyamaz */}
          <Text style={styles.headerAlt} numberOfLines={1}>Özel mesaj · yalnızca ikinize açık</Text>
        </View>
        <TouchableOpacity onPress={headerMenu} activeOpacity={0.7} style={styles.headerBtn} accessibilityLabel="Konuşma menüsü" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <MenuIkon />
        </TouchableOpacity>
      </View>
    </GradyanHeader>
  );

  if (yukleniyor) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        {header}
        <View style={styles.ortala}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {header}

      {/* ── Mesajlar ── */}
      <FlatList
        ref={flatListRef}
        data={mesajlar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mesajListesi}
        renderItem={({ item }) => {
          const kendi = !!benimId && item.gonderen_id === benimId;
          const okundu = !!karsiOkunduAt && new Date(karsiOkunduAt).getTime() >= new Date(item.created_at).getTime();
          return (
            <View style={[styles.mesajSatir, kendi && styles.mesajSatirKendi]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => mesajAksiyonlari(item)}
                delayLongPress={500}
                style={[
                  styles.mesajBubble,
                  kendi
                    ? [styles.mesajBubbleKendi, { backgroundColor: t.primary }]
                    : [styles.mesajBubbleDiger, { backgroundColor: t.bgCard, borderColor: t.kartBorder }],
                ]}
              >
                {item.gorsel_url && (
                  <DmMesajGorseli yol={item.gorsel_url} onPress={(url) => setTamEkranUrl(url)} />
                )}
                {!!item.mesaj && (
                  <Text style={[styles.mesajMetin, { color: kendi ? t.textOnPrimary : t.text }]}>
                    {item.mesaj}
                  </Text>
                )}
                <Text style={[styles.mesajSaat, { color: kendi ? t.headerSubtext : t.textMuted }]}>
                  {saat(item.created_at)}
                </Text>
              </TouchableOpacity>
              {kendi && item.id === sonKendiId && (
                <Text style={[styles.durumYazi, { color: okundu ? t.primary : t.textMuted }]}>
                  {okundu ? 'Okundu' : 'İletildi'}
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.bosMesaj}>
            <Avatar url={digerAvatar} isim={digerAd} boyut={64} renk={avatarRenk} harf={basHarfler(digerAd)} style={{ marginBottom: 14 }} />
            <Text style={[styles.bosBaslik, { color: t.text }]}>{digerAd}</Text>
            <Text style={[styles.bosAlt, { color: t.textSecondary }]}>İlk mesajı sen yaz</Text>
            <Text style={[styles.bosAlt, { color: t.textMuted, marginTop: 10, fontSize: 12, paddingHorizontal: 24 }]}>
              Bu yazışma yalnızca ikinize açıktır; Pusula İstanbul yöneticileri dâhil hiç kimse tarafından okunamaz.
            </Text>
          </View>
        }
        inverted={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />

      {/* ── Seçilen görsel önizleme ── */}
      {secilenGorsel && (
        <GorselOnizleme gorsel={secilenGorsel} yukleniyor={gorselYukleniyor} onKaldir={() => setSecilenGorsel(null)} />
      )}

      {/* ── Giriş alanı ── */}
      <View style={[styles.girisBolumu, { paddingBottom: insets.bottom + 8 }]}>
        <GorselButon onPress={gorselEkle} disabled={gonderiyor} />
        <TextInput
          style={[styles.girisiInput, { backgroundColor: t.bgInput, color: t.text, borderColor: t.kartBorder }]}
          placeholder={`${digerAd} adlı rehbere yaz...`}
          placeholderTextColor={t.textMuted}
          value={yeniMesaj}
          onChangeText={setYeniMesaj}
          multiline={true}
          maxLength={500}
          editable={!gonderiyor}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.gonderBtn, { backgroundColor: t.accent, opacity: gonderiyor || (!yeniMesaj.trim() && !secilenGorsel) ? 0.6 : 1 }]}
          onPress={mesajGonder}
          disabled={gonderiyor || (!yeniMesaj.trim() && !secilenGorsel)}
        >
          {gonderiyor ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.gonderBtnYazi}>Gönder</Text>
          )}
        </TouchableOpacity>
      </View>

      <TamEkranGorsel url={tamEkranUrl} onKapat={() => setTamEkranUrl(null)} />
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════
   Stiller
   ═══════════════════════════════════════════ */
function createStyles(t: TemaRenkleri) {
  return StyleSheet.create({
    container: { flex: 1 },
    ortala: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: { paddingBottom: 14, paddingHorizontal: 12 },
    headerSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.seffafBeyaz20, alignItems: 'center', justifyContent: 'center' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Palette.seffafBeyaz20 },
    headerAvatarHarf: { fontFamily: Font.bold, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5 },
    headerIsim: { fontFamily: Font.extrabold, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 },
    headerAlt: { fontFamily: Font.regular, fontSize: 12, color: t.headerSubtext },

    // Mesajlar
    mesajListesi: { flexGrow: 1, paddingHorizontal: Space.lg, paddingVertical: Space.lg },
    mesajSatir: { marginBottom: 10, alignItems: 'flex-start' },
    mesajSatirKendi: { alignItems: 'flex-end' },
    mesajBubble: { maxWidth: '84%', borderRadius: Radius.lg, paddingHorizontal: Space.md, paddingVertical: 10 },
    mesajBubbleDiger: { borderWidth: 1, borderTopLeftRadius: 6 },
    mesajBubbleKendi: { borderTopRightRadius: 6 },
    mesajMetin: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, marginBottom: 4 },
    mesajSaat: { fontFamily: Font.regular, fontSize: 11 },
    durumYazi: { fontFamily: Font.semibold, fontSize: 11, marginTop: 4, marginRight: 4 },

    // Boş durum
    bosMesaj: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    bosAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    bosAvatarHarf: { fontFamily: Font.bold, fontSize: 24, color: '#FFFFFF' },
    bosBaslik: { fontFamily: Font.bold, fontSize: 16, letterSpacing: -0.3, marginBottom: 6 },
    bosAlt: { fontFamily: Font.regular, fontSize: 13, textAlign: 'center' },

    // Giriş alanı
    girisBolumu: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Space.lg,
      paddingTop: Space.md,
      gap: Space.sm,
      backgroundColor: t.bg,
      borderTopWidth: 1,
      borderTopColor: t.divider,
    },
    girisiInput: {
      flex: 1,
      borderRadius: Radius.xl,
      paddingHorizontal: Space.lg,
      paddingVertical: Space.md,
      fontFamily: Font.regular,
      fontSize: 14,
      minHeight: 48,
      maxHeight: 100,
      borderWidth: 1,
    },
    gonderBtn: { height: 48, borderRadius: Radius.xl, paddingHorizontal: Space.lg, justifyContent: 'center', alignItems: 'center', minWidth: 76 },
    gonderBtnYazi: { fontFamily: Font.bold, color: '#FFFFFF', fontSize: 13 },
  });
}
