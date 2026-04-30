import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';
import { useBildirimler } from '../hooks/use-bildirimler';
import { useAbonelik } from '../hooks/use-abonelik';
import { revenueCatInit } from '../lib/revenuecat';
import { TemaProvider } from '../hooks/use-tema';
import { useXUlasim } from '../hooks/use-x-ulasim';
import { X_SENKRON_ARALIK_DK } from '../lib/config';

SplashScreen.preventAutoHideAsync();

/* ═══════════════════════════════════════════
   Root Layout — Freemium Model
   ─────────────────────────────────────────
   Temel ozellikler herkese acik (muzeler, ulasim, acil vb.)
   Premium ozellikler (sohbet, canli durum, etkinlikler)
   icin abonelik gerekir — ekran bazinda kontrol edilir.
   Giris zorunlu DEGIL — misafirler de bilgi ekranlarini gorebilir.
   ═══════════════════════════════════════════ */

export default function RootLayout() {
  const [oturum, setOturum] = useState<boolean | null>(null);
  // Şifre sıfırlama recovery deep link'i ile gelindi mi?
  // /sifre-sifirla'da iken otomatik /(tabs)'a redirect olmamasi icin.
  const [sifreSifirlamaModu, setSifreSifirlamaModu] = useState(false);
  // Ref versiyonu — State async olduğu için race condition'ı engellemek için
  // senkron olarak okunabilen flag. setSession await'i sırasında auth state
  // değişip routing useEffect'i tetiklendiğinde bu ref hala true.
  const sifreSifirlamaRef = useRef(false);
  // Pending flag — Stack henüz mount olmamışsa router.replace silently fail eder.
  // Bu yüzden setSession başarılı olduktan sonra "navigate edilmeyi bekliyor"
  // işareti veriyoruz. Stack hazır olur olmaz aşağıdaki useEffect navigate eder.
  const [sifreSifirlamaPending, setSifreSifirlamaPending] = useState(false);
  const segments = useSegments();

  // RevenueCat'i uygulama acilirken baslat (anonim — giris gerekmez)
  // Boylece giris yapmamis kullanicilar da IAP satin alabilir.
  useEffect(() => { revenueCatInit(); }, []);

  // Şifre sıfırlama deep link handler'ı
  // Mailden gelen "Şifremi Sıfırla" linki bu app'i açar.
  // İki olası URL formatı:
  //   - Implicit flow: pusulaistanbul://giris#access_token=...&refresh_token=...&type=recovery
  //   - PKCE flow:     pusulaistanbul://giris?code=xxx&type=recovery
  // Her ikisini de destekliyoruz.
  useEffect(() => {
    const handleAuthDeepLink = async (url: string | null) => {
      if (!url) return;
      console.log('[DeepLink] URL alındı:', url);

      let access_token: string | null = null;
      let refresh_token: string | null = null;
      let code: string | null = null;
      let type: string | null = null;

      // Hash parse et (implicit flow)
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hash = url.substring(hashIndex + 1);
        const hp = new URLSearchParams(hash);
        access_token = hp.get('access_token');
        refresh_token = hp.get('refresh_token');
        type = hp.get('type');
      }

      // Query parse et (PKCE flow veya hash'te eksik bilgi varsa)
      const queryIndex = url.indexOf('?');
      if (queryIndex !== -1 && (queryIndex < hashIndex || hashIndex === -1)) {
        const queryStr = url.substring(queryIndex + 1).split('#')[0];
        const qp = new URLSearchParams(queryStr);
        if (!code) code = qp.get('code');
        if (!type) type = qp.get('type');
      }

      console.log('[DeepLink] type:', type, '| token var:', !!access_token, '| code var:', !!code);

      if (type !== 'recovery') return;

      // KRITIK: Ref'i awaıt'ten ÖNCE senkron olarak set et.
      // Aksi halde setSession beklenirken onAuthStateChange fire eder,
      // routing useEffect tetiklenir, sifreSifirlamaModu state'i henüz
      // güncellenmediği için /(tabs)'a redirect yapar.
      sifreSifirlamaRef.current = true;
      setSifreSifirlamaModu(true);

      let sessionError = null;
      if (access_token && refresh_token) {
        // Implicit flow
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        sessionError = error;
      } else if (code) {
        // PKCE flow — code'u session'a çevir
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        sessionError = error;
      } else {
        console.log('[DeepLink] Token veya code bulunamadı');
        sifreSifirlamaRef.current = false;
        setSifreSifirlamaModu(false);
        return;
      }

      if (sessionError) {
        console.log('[DeepLink] Recovery session kurulamadı:', sessionError.message);
        sifreSifirlamaRef.current = false;
        setSifreSifirlamaModu(false);
        return;
      }

      console.log('[DeepLink] Recovery session kuruldu, navigate pending olarak işaretleniyor');
      // Stack mount olmadan router.replace silently fail eder.
      // Pending flag bırakıyoruz; aşağıdaki useEffect Stack hazır olunca navigate eder.
      setSifreSifirlamaPending(true);
    };

    // Uygulama deep link ile açıldıysa initial URL'i al
    Linking.getInitialURL().then(handleAuthDeepLink);

    // Uygulama açıkken gelen URL'leri de yakala
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthDeepLink(url));
    return () => sub.remove();
  }, []);

  // PASSWORD_RECOVERY event'i fire olduğunda da pending'i set et — deep link
  // handler ile çift güvence (Supabase clients farklı durumlarda farklı path izler).
  // Direkt router.replace çağırmıyoruz — Stack mount race riski. Pending flag ile
  // aşağıdaki useEffect Stack hazır olunca navigate eder.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        sifreSifirlamaRef.current = true;
        setSifreSifirlamaModu(true);
        setSifreSifirlamaPending(true);
        // Ek guvence: PASSWORD_RECOVERY app foreground'da iken fire ederse
        // (Apple Mail -> Safari -> "Ac" akisi), Stack zaten mount olmustur.
        // (tabs) group'undan disari escape Expo Router'da bazen state batch
        // ile race giriyor — defer ile bir frame sonra navigate ediyoruz.
        setTimeout(() => {
          console.log('[DeepLink] PASSWORD_RECOVERY direkt navigate (defer)');
          router.replace('/sifre-sifirla' as never);
        }, 150);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Bildirim badge temizligi — uygulama acildiginda ve foreground'a gectiginde
  // hem uygulama ikonundaki sayiyi (setBadgeCountAsync) hem de
  // sistem bildirim cubugundaki bildirimleri (dismissAllNotificationsAsync) temizler
  useEffect(() => {
    const bildirimleriTemizle = async () => {
      try {
        await Notifications.setBadgeCountAsync(0);
        await Notifications.dismissAllNotificationsAsync();
      } catch {}
    };

    // Ilk acilista bir kez calistir
    bildirimleriTemizle();

    // Background → foreground gecislerinde de tetikle
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') bildirimleriTemizle();
    });

    return () => sub.remove();
  }, []);

  // Tüm bildirim kategorilerini uygulama seviyesinde başlat
  useBildirimler();

  // X (Twitter) senkronizasyonu — tek global timer
  // Bilesenlerde (ulasim-uyari, trafik-uyari) ayri senkron KALDIRILDI.
  const { senkronize } = useXUlasim();
  useEffect(() => {
    senkronize();
    const interval = setInterval(() => senkronize(), X_SENKRON_ARALIK_DK * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Abonelik durumu kontrolü (premium özellik gating için)
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

  // Recovery navigate — Stack mount edildikten sonra koşar.
  // _layout.tsx'in render'ı `if (!fontsLoaded || oturum === null || abonelik.yukleniyor) return null;`
  // ile gating ediliyor. Yani fonts/oturum/abonelik hazır olmadan Stack yok,
  // erken router.replace silently fail eder. Bu useEffect tüm hazır işaretler
  // geldikten sonra (Stack mount olduktan sonra) navigate'i tetikler.
  // EK: setTimeout ile defer — Expo Router state batch'inden sonra navigate
  // (group escape race condition icin sigorta).
  useEffect(() => {
    if (!sifreSifirlamaPending) return;
    if (!fontsLoaded || oturum === null || abonelik.yukleniyor) return;
    console.log('[DeepLink] Stack hazır, /sifre-sifirla\'ya yönlendiriliyor');
    const t = setTimeout(() => {
      router.replace('/sifre-sifirla' as never);
      setSifreSifirlamaPending(false);
    }, 150);
    return () => clearTimeout(t);
  }, [sifreSifirlamaPending, fontsLoaded, oturum, abonelik.yukleniyor]);

  // Freemium routing:
  // - Uygulamayi acik birak (misafir de girebilir)
  // - Giris ekranindaki kullanici oturum acarsa → onboarding veya tabs
  // - Admin ekranlari korumali (giris gerekli)
  useEffect(() => {
    if (oturum === null || !fontsLoaded || abonelik.yukleniyor) return;

    const mevcut = segments[0];
    const girisEkraninda = mevcut === 'giris';
    const hosgeldinEkraninda = mevcut === 'hos-geldin';
    const gizlilikEkraninda = mevcut === 'gizlilik-politikasi' || mevcut === 'kullanim-kosullari';
    const adminEkraninda = mevcut?.toString().startsWith('admin');
    const aboneOlEkraninda = mevcut === 'abone-ol';
    const sifreSifirlamaEkraninda = mevcut === ('sifre-sifirla' as typeof mevcut);

    // Korunan ekranlar — bunlardayken yönlendirme YAPMA
    // sifre-sifirla: recovery session'ı aktifken bu ekranda kalmamız gerekiyor
    if (hosgeldinEkraninda || gizlilikEkraninda || aboneOlEkraninda || sifreSifirlamaEkraninda) return;

    // Recovery modunda iken hiçbir koşulda redirect yapma
    // Ref synchronous okunur (state async, race oluyor) — ikisini birden kontrol et
    if (sifreSifirlamaRef.current || sifreSifirlamaModu) return;

    // Admin ekranlarına girmeye çalışan oturumsuz kullanıcıyı giriş'e yönlendir
    if (!oturum && adminEkraninda) {
      router.replace('/giris');
      return;
    }

    // Oturum var + giriş ekranında → ana ekrana yönlendir
    if (oturum && girisEkraninda) {
      router.replace('/(tabs)');
    }
  }, [oturum, segments, fontsLoaded, abonelik.yukleniyor, sifreSifirlamaModu]);

  useEffect(() => {
    if (fontsLoaded && oturum !== null && !abonelik.yukleniyor) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, oturum, abonelik.yukleniyor]);

  if (!fontsLoaded || oturum === null || abonelik.yukleniyor) return null;

  return (
    <TemaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}
        initialRouteName="(tabs)">
        <Stack.Screen name="giris" />
        <Stack.Screen name="sifre-sifirla" />
        <Stack.Screen name="abone-ol" />
        <Stack.Screen name="hos-geldin" />
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
    </TemaProvider>
  );
}
