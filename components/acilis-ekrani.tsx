import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Palette } from '../constants/theme';

/* ═══════════════════════════════════════════
   Açılış ekranı (Eyl 2026) — uygulama içi splash, native splash'in DEVAMI
   ─────────────────────────────────────────
   Android 12+ sistem splash'i: ekran düz renk + ortada ikon-maskeli logo (yazı kırpılır, gradyan
   olmaz). Expo, logoyu backgroundColor'lu 288dp kanvasa basar ve sistem bunu ikon şekliyle
   (Samsung: squircle) maskeler → kanvas rengi ekran renginden farklıysa "yuvarlak içinde logo"
   görünür (4 Eyl: karanlık modda #0F1530 zemin + kobalt kare). Bu yüzden app.json'da açık/koyu
   zemin AYNI kobalt (kare zemine karışır) ve native görsel yalnızca pusula (yazısız, güvenli bölgede).
   Bu ekran ilk karede aynı kobalt zeminle devralır: pusula native'deki yerinde (ekran ortası,
   ~100dp) durur, hafifçe büyür ve altında "PUSULA İSTANBUL" belirir. Hazır olunca solup kalkar.
   Font kullanmaz (yazı görsel) — fontlar yüklenmeden çizilir.
   ═══════════════════════════════════════════ */

const LOGO_BASLANGIC = 100;   // native splash'teki yaklaşık logo genişliği (dp)
const LOGO_BITIS = 150;
const LOGO_ORAN = 760 / 696;  // splash-logo.png yükseklik/genişlik
const YAZI_ORAN = 531 / 696;  // yazı genişliği / logo genişliği (özgün splash-icon oranı)
const YAZI_HW = 174 / 531;
const EN_AZ_SURE_MS = 700;
const SOLMA_MS = 380;

export function AcilisEkrani({ gorunur }: { gorunur: boolean }) {
  const opaklik = useRef(new Animated.Value(1)).current;
  const buyume = useRef(new Animated.Value(0)).current;   // 0 → 1
  const baslangic = useRef(Date.now()).current;
  const [bitti, setBitti] = useState(false);

  useEffect(() => {
    Animated.timing(buyume, { toValue: 1, duration: 450, delay: 60, useNativeDriver: true }).start();
  }, [buyume]);

  useEffect(() => {
    if (gorunur || bitti) return;
    const kalan = Math.max(0, EN_AZ_SURE_MS - (Date.now() - baslangic));
    const z = setTimeout(() => {
      Animated.timing(opaklik, { toValue: 0, duration: SOLMA_MS, useNativeDriver: true }).start(() => setBitti(true));
    }, kalan);
    return () => clearTimeout(z);
  }, [gorunur, bitti, opaklik, baslangic]);

  if (bitti) return null;

  const olcek = buyume.interpolate({ inputRange: [0, 1], outputRange: [1, LOGO_BITIS / LOGO_BASLANGIC] });
  const yaziW = LOGO_BITIS * YAZI_ORAN;
  const logoH = LOGO_BASLANGIC * LOGO_ORAN;

  return (
    <Animated.View pointerEvents={gorunur ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, s.zemin, { opacity: opaklik }]}>
      {/* Logo: merkez = ekran merkezi (native ile aynı yer), 100 → 150dp büyür */}
      <View style={s.merkez}>
        {/* Sabit kutu (başlangıç boyutu) ekran ortasında; logo içinde ölçeklenir, yazı kutuya göre konumlanır */}
        <View style={{ width: LOGO_BASLANGIC, height: logoH }}>
          <Animated.View style={{ transform: [{ scale: olcek }] }}>
            <Image source={require('../assets/images/splash-logo.png')} style={{ width: LOGO_BASLANGIC, height: logoH }} contentFit="contain" accessibilityLabel="Pusula İstanbul" />
          </Animated.View>
          {/* Yazı: büyümüş logonun hemen altında belirir */}
          <Animated.View style={{ position: 'absolute', top: logoH / 2 + (LOGO_BITIS * LOGO_ORAN) / 2 + 18, left: LOGO_BASLANGIC / 2 - yaziW / 2, opacity: buyume }}>
            <Image source={require('../assets/images/splash-yazi.png')} style={{ width: yaziW, height: yaziW * YAZI_HW }} contentFit="contain" />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  zemin: { backgroundColor: Palette.kobalt, zIndex: 1000, elevation: 1000 },
  merkez: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
