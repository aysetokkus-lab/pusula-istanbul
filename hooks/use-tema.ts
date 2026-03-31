import { useColorScheme } from 'react-native';
import { Tema, type TemaRenkleri } from '../constants/theme';

/**
 * Aktif temayı döndürür (light/dark)
 * Şimdilik dark modda kilitli — ileride toggle eklenecek
 */
export function useTema(): { t: TemaRenkleri; isDark: boolean } {
  const scheme = useColorScheme();
  // Light mode aktif — mockup'a uygun
  const isDark = false;
  return {
    t: isDark ? Tema.dark : Tema.light,
    isDark,
  };
}
