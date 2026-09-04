import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Alert, Linking, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTema } from '../hooks/use-tema';
import { Font } from '../constants/theme';
import { BirincilButon, ModalKapak } from './ui/pusula-ui';
import { useProfilDilleri } from '../hooks/use-ilanlar';
import { supabase } from '../lib/supabase';
import { TELEFON_HATA, telefonGoster, telefonNormalize, whatsappLink } from '../lib/telefon';

/* ═══════════════════════════════════════════
   TelefonModal + useTelefonGerekli (Eyl 2026)
   ───────────────────────────────────────────
   Beyan usulü telefon (doğrulama SMS'i yok). Profilinde telefon olmayan
   kullanıcı ilan verirken / özel mesaj başlatırken bu modalla numarasını
   girer; kaydedince bekleyen işlem devam eder.
   "WhatsApp'ta aç": kullanıcı kendi numarasını WhatsApp'ta açıp doğru
   yazdığını kendisi kontrol eder (sıfır maliyetli sağlama).
   ═══════════════════════════════════════════ */

export function TelefonAlani({ deger, onDegis, otoOdak }: { deger: string; onDegis: (v: string) => void; otoOdak?: boolean }) {
  const { t } = useTema();
  const gecerli = telefonNormalize(deger);
  const waAc = () => {
    const link = whatsappLink(deger);
    if (!gecerli || !link) { Alert.alert('Numara eksik', TELEFON_HATA); return; }
    Linking.openURL(link).catch(() => Alert.alert('WhatsApp açılamadı', 'Telefonunda WhatsApp yüklü olmayabilir.'));
  };
  return (
    <View style={{ gap: 6 }}>
      <TextInput
        style={[s.input, { backgroundColor: t.bgInput, color: t.text, borderColor: deger && !gecerli ? t.durumKapali : t.divider }]}
        value={deger}
        onChangeText={onDegis}
        placeholder="0532 123 45 67"
        placeholderTextColor={t.textMuted}
        keyboardType="phone-pad"
        autoFocus={otoOdak}
        maxLength={20}
        accessibilityLabel="Telefon numarası"
      />
      {/* 4 Eyl 2026 (Ayşe): form içi açıklama yok — yalnızca hata ya da kaydedilecek biçim gösterilir */}
      {deger ? (
        <Text style={[s.yardim, { color: !gecerli ? t.durumKapali : t.textMuted }]}>
          {!gecerli ? TELEFON_HATA : `Kaydedilecek: ${telefonGoster(gecerli)}`}
        </Text>
      ) : null}
      <TouchableOpacity onPress={waAc} activeOpacity={0.7} style={s.waSatir} accessibilityLabel="Numaramı WhatsApp'ta aç">
        <Text style={[s.waYazi, { color: t.primary }]}>{"Numaramı WhatsApp'ta aç ve kontrol et"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function TelefonModal({ visible, mevcut, aciklama, onKapat, onKaydet }: {
  visible: boolean;
  mevcut: string;
  aciklama?: string;
  onKapat: () => void;
  onKaydet: (e164: string) => Promise<boolean>;
}) {
  const { t } = useTema();
  const [deger, setDeger] = useState(mevcut);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => { if (visible) setDeger(mevcut ? telefonGoster(mevcut) : ''); }, [visible, mevcut]);

  const kaydet = async () => {
    const norm = telefonNormalize(deger);
    if (!norm) { Alert.alert('Hatalı numara', TELEFON_HATA); return; }
    setKaydediliyor(true);
    const ok = await onKaydet(norm);
    setKaydediliyor(false);
    if (!ok) Alert.alert('Kaydedilemedi', 'Telefon kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onKapat}>
      <ModalKapak
        baslik="Telefon numaran"
        alt={aciklama}
        onKapat={onKapat}
        altButonBaslik="Vazgeç"
      >
        <TelefonAlani deger={deger} onDegis={setDeger} otoOdak />
        <BirincilButon baslik="Kaydet" onPress={kaydet} varyant="cta" yukleniyor={kaydediliyor} style={{ marginTop: 12 }} />
      </ModalKapak>
    </Modal>
  );
}

/**
 * useTelefonGerekli — bir işlemden önce profilde telefon olmasını şart koşar.
 *   const { telefonGerekli, telefonModal } = useTelefonGerekli();
 *   telefonGerekli(() => konusmayiBaslat());   // telefon varsa hemen, yoksa modal → kaydedince
 *   ... return (<>{...}{telefonModal}</>)
 */
export function useTelefonGerekli(aciklama?: string): { telefonGerekli: (islem: () => void) => void; telefonModal: ReactElement; telefon: string } {
  const { telefon, telefonKaydet, yukleniyor } = useProfilDilleri();
  const [acik, setAcik] = useState(false);
  const bekleyen = useRef<(() => void) | null>(null);

  const telefonGerekli = useCallback((islem: () => void) => {
    (async () => {
      let mevcut = telefon;
      if (!mevcut && yukleniyor) {
        // Hook henüz yüklenmediyse doğrudan sor (yanlış modal açma)
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (uid) {
          const { data } = await supabase.from('profiles').select('telefon').eq('id', uid).single();
          mevcut = (data?.telefon as string | null) || '';
        }
      }
      if (mevcut) { islem(); return; }
      bekleyen.current = islem;
      setAcik(true);
    })();
  }, [telefon, yukleniyor]);

  const kapat = useCallback(() => { setAcik(false); bekleyen.current = null; }, []);
  const kaydet = useCallback(async (e164: string) => {
    const ok = await telefonKaydet(e164);
    if (ok) {
      setAcik(false);
      const islem = bekleyen.current;
      bekleyen.current = null;
      islem?.();
    }
    return ok;
  }, [telefonKaydet]);

  const telefonModal = <TelefonModal visible={acik} mevcut={telefon} aciklama={aciklama} onKapat={kapat} onKaydet={kaydet} />;
  return { telefonGerekli, telefonModal, telefon };
}

const s = StyleSheet.create({
  input: { fontFamily: Font.regular, fontSize: 16, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  yardim: { fontFamily: Font.regular, fontSize: 12, lineHeight: 16 },
  waSatir: { alignSelf: 'flex-start', paddingVertical: 4 },
  waYazi: { fontFamily: Font.semibold, fontSize: 13 },
  not: { fontFamily: Font.regular, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
