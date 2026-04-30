import { useEffect } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTema } from '../hooks/use-tema';

/* ═══════════════════════════════════════════
   Deneme Başlat — REDIRECT
   ─────────────────────────────────────────
   Freemium modele gecildi. Bu ekran artik
   kullanilmiyor — eski deep link'ler icin
   ana ekrana yonlendirir.
   ═══════════════════════════════════════════ */

export default function DenemeBaslat() {
  const { t } = useTema();

  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return <View style={{ flex: 1, backgroundColor: t.bg }} />;
}
