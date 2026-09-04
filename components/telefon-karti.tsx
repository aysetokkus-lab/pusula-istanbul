import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTema } from '../hooks/use-tema';
import { Font } from '../constants/theme';
import { BirincilButon, Kart, Kicker } from './ui/pusula-ui';
import { useProfilDilleri } from '../hooks/use-ilanlar';
import { TELEFON_HATA, telefonNormalize } from '../lib/telefon';
import { TelefonAlani } from './telefon-modal';

/* ═══════════════════════════════════════════
   TelefonKarti (Eyl 2026) — ana sayfa
   ───────────────────────────────────────────
   Profilinde telefon olmayan mevcut kullanıcılara (kayıt öncesi ~300 hesap)
   tek seferlik nazik kart: numarayı burada yaz → Kaydet. "Sonra" 3 gün
   erteler. Telefon dolunca kart bir daha görünmez.
   ═══════════════════════════════════════════ */

const ERTELE_KEY = 'telefon-karti-ertele';
const ERTELE_MS = 3 * 24 * 60 * 60 * 1000;

export function TelefonKarti() {
  const { t } = useTema();
  const { telefon, telefonKaydet, yukleniyor } = useProfilDilleri();
  const [deger, setDeger] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [ertelendi, setErtelendi] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(ERTELE_KEY);
        setErtelendi(!!v && Date.now() - Number(v) < ERTELE_MS);
      } catch { setErtelendi(false); }
    })();
  }, []);

  const sonra = useCallback(async () => {
    setErtelendi(true);
    try { await AsyncStorage.setItem(ERTELE_KEY, String(Date.now())); } catch {}
  }, []);

  const kaydet = useCallback(async () => {
    const norm = telefonNormalize(deger);
    if (!norm) { Alert.alert('Hatalı numara', TELEFON_HATA); return; }
    setKaydediliyor(true);
    const ok = await telefonKaydet(norm);
    setKaydediliyor(false);
    if (!ok) Alert.alert('Kaydedilemedi', 'Telefon kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
  }, [deger, telefonKaydet]);

  if (yukleniyor || ertelendi === null || ertelendi || telefon) return null;

  return (
    <View style={s.zarf}>
      <Kart accent={t.accent}>
        <Kicker color={t.accent}>Profilini tamamla</Kicker>
        <Text style={[s.baslik, { color: t.text }]}>Telefon numaranı ekle</Text>
        <Text style={[s.aciklama, { color: t.textSecondary }]}>
          Rehber Aranıyor ilanlarında ve özel mesajlarda meslektaşların sana ulaşabilsin. Doğrulama kodu gönderilmez.
        </Text>
        <TelefonAlani deger={deger} onDegis={setDeger} />
        <View style={s.butonlar}>
          <TouchableOpacity onPress={sonra} activeOpacity={0.7} style={s.sonraBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.sonraYazi, { color: t.textSecondary }]}>Sonra</Text>
          </TouchableOpacity>
          <BirincilButon baslik="Kaydet" onPress={kaydet} varyant="cta" yukleniyor={kaydediliyor} style={{ flex: 1 }} />
        </View>
      </Kart>
    </View>
  );
}

const s = StyleSheet.create({
  zarf: { marginBottom: 14 },
  baslik: { fontFamily: Font.bold, fontSize: 17 },
  aciklama: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18 },
  butonlar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  sonraBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  sonraYazi: { fontFamily: Font.semibold, fontSize: 14 },
});
