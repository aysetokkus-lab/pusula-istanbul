// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// GradyanHeader + BolumBaslik + Kart/Rozet + BirincilButon (112 = tehlike varyantı) ile yeniden boyandı.
// Turizm Polisi, 112 kartı, Faydalı Telefonlar (112 hariç — 14 Haz 2026 fix'i), meslek kuruluşları,
// faydalı linkler, sözleşme örnekleri ve tüm Linking / WebBrowser çağrıları aynen korundu.
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAcilRehber } from '../../hooks/use-acil-rehber';
import { useTema } from '../../hooks/use-tema';
import { YetkiliBolum } from '../../components/yetkili/yetkili-bolum';
import { AcilRehberYonetim } from '../../components/yetkili/acil-rehber-yonetim';
import { BirincilButon, BolumBaslik, GradyanHeader, HeaderBaslik, Kart, Rozet } from '../../components/ui/pusula-ui';
import { Font, Palette } from '../../constants/theme';

/* ═══════════════════════════════════════════
   Fallback veriler — Supabase'den veri gelmezse
   ═══════════════════════════════════════════ */
const FALLBACK_TURIZM = { isim: 'Turizm Polisi', numara: '02125274503', goruntu: '0212 527 45 03', aciklama: 'Turistlere yönelik güvenlik birimi' };
// 2021 itibarıyla tüm acil çağrı numaraları (110, 155, 156, 122, 158, 177) 112'de toplandı.
// Kaynak: EGM duyurusu (14 Kasım 2021) — Resmi Gazete 18.02.2018 yönetmelik
const FALLBACK_ACIL = [
  { isim: 'Tüm Acil Durumlar', numara: '112', goruntu: '112' },
];
const FALLBACK_MESLEK = [
  { isim: 'İstanbul Rehberler Odası (İRO)', numara: '02122920520', goruntu: '0212 292 05 20' },
  { isim: 'TUREB', numara: '03124170392', goruntu: '0312 417 03 92' },
];
const FALLBACK_LINK = [
  { isim: 'Nöbetçi Eczane', url: 'https://www.eczaneler.gen.tr/nobetci-istanbul' },
];

/** Sağ ok ikonu — 24px stroke chevron */
function OkIkon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function Acil() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();
  const { turizmPolisi, acilNumaralar, meslekKuruluslari, faydaliLinkler, yukleniyor, hata } = useAcilRehber();

  const sozlesmeAc = (url: string) => {
    Linking.openURL(url);
  };

  const ara = (numara: string) => Linking.openURL(`tel:${numara}`);
  const ac = (url: string) => Linking.openURL(url);

  // Veri gelmezse fallback kullan
  const tp = turizmPolisi.length > 0 ? turizmPolisi[0] : FALLBACK_TURIZM;
  const aciller = acilNumaralar.length > 0 ? acilNumaralar : FALLBACK_ACIL;
  // 112'nin kendi ozel karti var; geri kalan acil_numara kayitlari (TURYOL vb.) ayri bolumde
  const faydaliTelefonlar = acilNumaralar.filter((k: any) => (k.numara || '').replace(/\s/g, '') !== '112');
  const meslekler = meslekKuruluslari.length > 0 ? meslekKuruluslari : FALLBACK_MESLEK;
  const linkler = faydaliLinkler.length > 0 ? faydaliLinkler : FALLBACK_LINK;

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]}>
      {/* HEADER */}
      <GradyanHeader paddingTop={insets.top + 12}>
        <HeaderBaslik baslik="Acil Durum" alt="Tüm butonlar doğrudan arama / site açar" />
      </GradyanHeader>

      {yukleniyor && (
        <ActivityIndicator size="small" color={t.primary} style={{ marginTop: 16 }} />
      )}

      {/* TURIZM POLISI */}
      <View style={s.bolum}>
        <BolumBaslik baslik="Turizm Polisi" renk={t.primary} />
        <Kart accent={t.primary} onPress={() => ara(tp.numara || '')}>
          <View style={s.turizmSatir}>
            <View style={s.turizmSol}>
              <Text style={[s.turizmIsim, { color: t.text }]}>{tp.isim}</Text>
  {/* aciklama kaldirildi */}
              <Text style={[s.turizmNumara, { color: t.primary }]}>{tp.goruntu || tp.numara}</Text>
            </View>
            <Rozet renk={t.primary} dolu style={s.araRozet}>Ara</Rozet>
          </View>
        </Kart>
      </View>

      {/* ACIL NUMARALAR — 2021'den itibaren tüm numaralar 112'de */}
      <View style={s.bolum}>
        <BolumBaslik baslik="Acil Durum" renk={t.durumKapali} />
        <Kart accent={t.durumKapali} onPress={() => ara('112')} style={[s.acil112Kart, { borderColor: t.durumKapali }]}>
          <View style={s.acil112Satir}>
            <View style={s.acil112Sol}>
              <Text style={[s.acil112Numara, { color: t.durumKapali }]}>112</Text>
              <Text style={[s.acil112Etiket, { color: t.text }]}>Tüm Acil Durumlar</Text>
            </View>
            <BirincilButon baslik="Ara" varyant="tehlike" onPress={() => ara('112')} style={s.acil112Btn} />
          </View>
        </Kart>
        <Text style={[s.acil112Bilgi, { color: t.textSecondary }]}>
          Polis, ambulans, itfaiye, jandarma, AFAD, sahil güvenlik ve orman yangın için tek numara.
          Eski numaralar (155, 110, 156, 158, 122, 177) 2021'den bu yana 112'ye yönlendirilir.
        </Text>
      </View>

      {/* FAYDALI TELEFONLAR — acil_numara kategorisi (112 haric) */}
      {faydaliTelefonlar.length > 0 && (
        <View style={s.bolum}>
          <BolumBaslik baslik="Faydalı Telefonlar" renk={Palette.uyari} />
          {faydaliTelefonlar.map((k: any, i: number) => (
            <Kart key={k.id || i}>
              <Text style={[s.listeIsim, { color: t.text }]}>{k.isim}</Text>
              {k.aciklama ? (
                <Text style={[s.sozlesmeAlt, { color: t.textSecondary }]}>{k.aciklama}</Text>
              ) : null}
              <View style={s.altSatir}>
                {k.numara ? (
                  <BirincilButon baslik={k.goruntu || k.numara} varyant="kobalt" onPress={() => ara(k.numara)} style={s.altBtn} />
                ) : null}
                {k.url ? (
                  <BirincilButon baslik="Web Sitesi" varyant="hayalet" onPress={() => WebBrowser.openBrowserAsync(k.url)} style={s.altBtn} />
                ) : null}
              </View>
            </Kart>
          ))}
        </View>
      )}

      {/* MESLEK KURULUSLARI */}
      <View style={s.bolum}>
        <BolumBaslik baslik="Meslek Kuruluşları" renk={t.secondary} />
        {meslekler.map((k: any, i: number) => (
          <Kart key={k.id || i}>
            <Text style={[s.listeIsim, { color: t.text }]}>{k.isim}</Text>
            <View style={s.altSatir}>
              {k.numara ? (
                <BirincilButon baslik={k.goruntu || k.numara} varyant="kobalt" onPress={() => ara(k.numara)} style={s.altBtn} />
              ) : null}
              {k.url ? (
                <BirincilButon baslik="Web Sitesi" varyant="hayalet" onPress={() => WebBrowser.openBrowserAsync(k.url)} style={s.altBtn} />
              ) : null}
            </View>
          </Kart>
        ))}
      </View>

      {/* FAYDALI KAYNAKLAR */}
      <View style={s.bolum}>
        <BolumBaslik baslik="Faydalı Kaynaklar" renk={t.primary} />
        {linkler.map((l: any, i: number) => (
          <Kart key={l.id || i} onPress={() => ac(l.url || '')}>
            <View style={s.linkSatir}>
              <Text style={[s.listeIsim, { color: t.text }]}>{l.isim}</Text>
              <OkIkon color={t.primary} />
            </View>
          </Kart>
        ))}
      </View>

      {/* SÖZLEŞME ÖRNEKLERİ */}
      <View style={s.bolum}>
        <BolumBaslik baslik="Sözleşme Örnekleri" renk={t.primary} />
        <Kart onPress={() => sozlesmeAc('https://pusulaistanbul.app/musteri-rehber-sozlesmesi.docx')}>
          <View style={s.linkSatir}>
            <View style={s.listeBilgi}>
              <Text style={[s.listeIsim, { color: t.text }]}>Müşteri — Rehber Sözleşmesi</Text>
              <Text style={[s.sozlesmeAlt, { color: t.textSecondary }]}>Word belgesi olarak indir</Text>
            </View>
            <OkIkon color={t.primary} />
          </View>
        </Kart>
        <Kart onPress={() => sozlesmeAc('https://pusulaistanbul.app/acente-hizmet-sozlesmesi.docx')}>
          <View style={s.linkSatir}>
            <View style={s.listeBilgi}>
              <Text style={[s.listeIsim, { color: t.text }]}>Acente — Rehber Hizmet Sözleşmesi</Text>
              <Text style={[s.sozlesmeAlt, { color: t.textSecondary }]}>Word belgesi olarak indir</Text>
            </View>
            <OkIkon color={t.primary} />
          </View>
        </Kart>
      </View>

      <YetkiliBolum baslik="Acil Durum Rehberi" aciklama="Numara, kurum ve faydalı linkler" sadeceAdmin>
        <AcilRehberYonetim />
      </YetkiliBolum>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ═══ Stiller ═══
const s = StyleSheet.create({
  container: { flex: 1 },
  bolum: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },

  // Turizm Polisi
  turizmSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  turizmSol: { flex: 1 },
  turizmIsim: { fontFamily: Font.bold, fontSize: 15, letterSpacing: -0.3 },
  turizmNumara: { fontFamily: Font.semibold, fontSize: 14, marginTop: 4 },
  araRozet: { paddingHorizontal: 18, paddingVertical: 8 },

  // 112 — Tüm Acil Durumlar tek büyük kart
  acil112Kart: { borderWidth: 2 },
  acil112Satir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  acil112Sol: { flex: 1 },
  acil112Numara: { fontFamily: Font.extrabold, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  acil112Etiket: { fontFamily: Font.semibold, fontSize: 14, marginTop: 2 },
  acil112Btn: { paddingHorizontal: 26 },
  acil112Bilgi: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17, paddingHorizontal: 4 },

  // Liste satırları
  listeBilgi: { flex: 1 },
  listeIsim: { fontFamily: Font.semibold, fontSize: 14, flex: 1 },
  sozlesmeAlt: { fontFamily: Font.regular, fontSize: 11, marginTop: 3 },
  linkSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  altSatir: { flexDirection: 'row', gap: 8, marginTop: 2 },
  altBtn: { flex: 1, paddingHorizontal: 12 },
});
