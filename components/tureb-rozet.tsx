import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTema } from '../hooks/use-tema';
import { Font, Palette } from '../constants/theme';
import { BirincilButon, Kart, Kicker, ModalKapak, Rozet } from './ui/pusula-ui';
import { type TurebAday, type TurebBilgi, type TurebDurum, useTureb } from '../hooks/use-tureb';

/* ═══════════════════════════════════════════
   TUREB rozeti + profil kartı (Eyl 2026)
   ───────────────────────────────────────────
   TurebRozet: "TUREB · İRO" (yeşil, eylemli) / "TUREB · İRO · Eylemsiz" (gri) — diğer durumlarda hiç.
   TurebKarti: profil ekranı — durum açıklaması, çoklu eşleşmede aday seçimi, yeniden kontrol.
   Eylemsiz rehber de ilan verebilir / başvurabilir (Ayşe: "belki ilandan sonra eylemli olacak").
   ═══════════════════════════════════════════ */

export function TurebRozet({ durum, oda, style }: { durum: TurebDurum | null | undefined; oda?: string | null; style?: any }) {
  const { t } = useTema();
  if (durum !== 'eylemli' && durum !== 'eylemsiz') return null;
  const eylemli = durum === 'eylemli';
  const metin = `TUREB${oda ? ` · ${oda}` : ''}${eylemli ? '' : ' · Eylemsiz'}`;
  return <Rozet renk={eylemli ? Palette.acik : t.textMuted} style={style}>{metin}</Rozet>;
}

function durumMetni(b: TurebBilgi): { baslik: string; aciklama: string; renk?: string } {
  switch (b.durum) {
    case 'eylemli':
      return { baslik: 'TUREB kayıtlı rehber', aciklama: `${b.ad || ''} · ${b.oda || ''}${b.dil ? ` · ${b.dil}` : ''} · Eylemli`, renk: Palette.acik };
    case 'eylemsiz':
      return { baslik: 'TUREB kayıtlı rehber (eylemsiz)', aciklama: `${b.ad || ''} · ${b.oda || ''}${b.dil ? ` · ${b.dil}` : ''} · Eylemsiz — ilan verebilir ve başvurabilirsin.` };
    case 'coklu':
      return { baslik: 'TUREB’de birden fazla kayıt bulundu', aciklama: 'Aynı ad-soyadla birden fazla rehber var. Kendi kaydını seç.' };
    case 'bulunamadi':
      return { baslik: 'TUREB’de bulunamadı', aciklama: 'Adını ve soyadını ruhsatnamendeki gibi yazıp yeniden kontrol et. Kayıt engellenmez; rozet görünmez.' };
    case 'bilinmiyor':
      return { baslik: 'TUREB’e ulaşılamadı', aciklama: 'Daha sonra otomatik yeniden denenir; istersen şimdi kontrol et.' };
    default:
      return { baslik: 'TUREB kontrolü yapılmadı', aciklama: 'Ad-soyadın TUREB rehber veritabanında aranır; eşleşirse profilinde ve ilanlarında rozet görünür.' };
  }
}

export function TurebKarti() {
  const { t } = useTema();
  const { bilgi, yukleniyor, kontrolEdiliyor, kontrolEt } = useTureb();
  const [secici, setSecici] = useState(false);
  if (yukleniyor) return null;
  const m = durumMetni(bilgi);

  const yenidenKontrol = async () => {
    const r = await kontrolEt();
    if (!r.ok) Alert.alert('Kontrol yapılamadı', r.hata || 'Tekrar dene.');
    else if (r.durum === 'coklu') setSecici(true);
  };

  const sec = async (i: number) => {
    const r = await kontrolEt(i);
    setSecici(false);
    if (!r.ok) Alert.alert('Kaydedilemedi', r.hata || 'Tekrar dene.');
  };

  return (
    <Kart accent={bilgi.durum === 'eylemli' ? Palette.acik : undefined}>
      <Kicker color={m.renk ?? t.textSecondary}>TUREB</Kicker>
      <View style={s.ustSatir}>
        <Text style={[s.baslik, { color: t.text }]}>{m.baslik}</Text>
        <TurebRozet durum={bilgi.durum} oda={bilgi.oda} />
      </View>
      <Text style={[s.aciklama, { color: t.textSecondary }]}>{m.aciklama}</Text>
      {bilgi.durum === 'coklu' && (bilgi.adaylar?.length ?? 0) > 0 && (
        <BirincilButon baslik="Kaydımı seç" onPress={() => setSecici(true)} varyant="cta" />
      )}
      <TouchableOpacity onPress={yenidenKontrol} disabled={kontrolEdiliyor} activeOpacity={0.7} style={s.linkSatir}>
        <Text style={[s.link, { color: t.primary }]}>{kontrolEdiliyor ? 'Kontrol ediliyor…' : 'Yeniden kontrol et'}</Text>
      </TouchableOpacity>

      <Modal visible={secici} animationType="slide" transparent onRequestClose={() => setSecici(false)}>
        <ModalKapak baslik="Hangisi sensin?" alt="TUREB veritabanında aynı ad-soyadla birden fazla kayıt var. Odanı ve dilini kontrol ederek kendi kaydını seç." onKapat={() => setSecici(false)} altButonBaslik="Vazgeç">
          <ScrollView style={{ maxHeight: 360 }}>
            {(bilgi.adaylar ?? []).map((a: TurebAday, i: number) => (
              <TouchableOpacity key={i} onPress={() => sec(i)} activeOpacity={0.75} style={[s.aday, { borderColor: t.kartBorder, backgroundColor: t.bgCardAlt }]}>
                <Text style={[s.adayAd, { color: t.text }]}>{a.ad}</Text>
                <Text style={[s.adayAlt, { color: t.textSecondary }]}>{a.oda}{a.dil ? ` · ${a.dil}` : ''}{a.durum ? ` · ${a.durum === 'eylemli' ? 'Eylemli' : 'Eylemsiz'}` : ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ModalKapak>
      </Modal>
    </Kart>
  );
}

const s = StyleSheet.create({
  ustSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  baslik: { fontFamily: Font.bold, fontSize: 15, flexShrink: 1 },
  aciklama: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18 },
  linkSatir: { alignSelf: 'flex-start', paddingVertical: 2 },
  link: { fontFamily: Font.semibold, fontSize: 13 },
  aday: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  adayAd: { fontFamily: Font.semibold, fontSize: 14 },
  adayAlt: { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
});
