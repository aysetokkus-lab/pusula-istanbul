// Eyl 2026 — Alert yardımcıları: react-native-web'de Alert.alert NO-OP olduğu için (Chrome incelemesi)
// web'de window.alert / window.confirm'e düşer; native'de Alert.alert. Yeni ekranlarda (ajanda, tur, masraf) kullanılır.
import { Alert, Platform } from 'react-native';

export function uyar(baslik: string, mesaj?: string): void {
  if (Platform.OS === 'web') { window.alert(mesaj ? `${baslik}\n\n${mesaj}` : baslik); return; }
  Alert.alert(baslik, mesaj);
}

/** Onay sorusu: true = onaylandı */
export function onayla(baslik: string, mesaj: string, onayMetni = 'Sil', tehlike = true): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${baslik}\n\n${mesaj}`));
  return new Promise(resolve => {
    Alert.alert(baslik, mesaj, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: onayMetni, style: tehlike ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
