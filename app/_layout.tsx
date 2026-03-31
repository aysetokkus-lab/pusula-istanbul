import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';
import { useBildirimler } from '../hooks/use-bildirimler';
import { useAbonelik } from '../hooks/use-abonelik';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [oturum, setOturum] = useState<boolean | null>(null);
  const segments = useSegments();

  // Tüm bildirim kategorilerini uygulama seviyesinde başlat
  useBildirimler();

  // Abonelik durumu kontrolü
  const abonelik = useAbonelik();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setOturum(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setOturum(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Oturum + abonelik durumuna göre yönlendir
  useEffect(() => {
    if (oturum === null || !fontsLoaded || abonelik.yukleniyor) return;

    const mevcut = segments[0];
    const girisEkraninda = mevcut === 'giris';
    const paywallEkraninda = mevcut === 'abone-ol';
    const hosgeldinEkraninda = mevcut === 'hos-geldin' || mevcut === 'deneme-baslat';
    const gizlilikEkraninda = mevcut === 'gizlilik-politikasi' || mevcut === 'kullanim-kosullari';
    const adminEkraninda = mevcut?.toString().startsWith('admin');

    // Korunan ekranlar — bunlardayken yönlendirme YAPMA
    if (hosgeldinEkraninda || gizlilikEkraninda || adminEkraninda) return;

    if (!oturum) {
      // Oturum yok ve giris ekraninda degilse → girise yonlendir
      if (!girisEkraninda) {
        router.replace('/giris');
      }
      return;
    } else if (oturum && girisEkraninda) {
      // Oturum var, giriş ekranındaysa → duruma göre yönlendir
      if (abonelik.paywallGoster) {
        router.replace('/abone-ol');
      } else {
        router.replace('/(tabs)');
      }
    } else if (oturum && abonelik.paywallGoster && !paywallEkraninda) {
      // Deneme süresi dolmuş + abonelik yok → paywall
      router.replace('/abone-ol');
    }
  }, [oturum, segments, fontsLoaded, abonelik.yukleniyor, abonelik.paywallGoster]);

  useEffect(() => {
    if (fontsLoaded && oturum !== null && !abonelik.yukleniyor) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, oturum, abonelik.yukleniyor]);

  if (!fontsLoaded || oturum === null || abonelik.yukleniyor) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}
        initialRouteName={oturum ? '(tabs)' : 'giris'}>
        <Stack.Screen name="giris" />
        <Stack.Screen name="abone-ol" />
        <Stack.Screen name="hos-geldin" />
        <Stack.Screen name="deneme-baslat" />
        <Stack.Screen name="gizlilik-politikasi" options={{ headerShown: true, headerTitle: 'Gizlilik Politikası', headerBackTitle: 'Geri' }} />
        <Stack.Screen name="kullanim-kosullari" options={{ headerShown: true, headerTitle: 'Kullanım Koşulları', headerBackTitle: 'Geri' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="admin-saha" />
        <Stack.Screen name="admin-etkinlik" />
        <Stack.Screen name="admin-moderasyon" />
        <Stack.Screen name="admin-banlar" />
        <Stack.Screen name="admin-kufur" />
        <Stack.Screen name="admin-saatler" />
        <Stack.Screen name="admin-ulasim-tarife" />
        <Stack.Screen name="admin-acil" />
      </Stack>
    </>
  );
}
