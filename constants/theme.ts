/**
 * Pusula Rehber — Tasarım Sistemi
 * İstanbulkart Mobil tasarım dilinden ilham
 * Light + Dark mode desteği
 */

import { Platform } from 'react-native';

// ═══ Ana Renk Paleti ═══
// Mavi palet — İstanbulkart Mobil ilhamı
export const Palette = {
  // Marka renkleri
  istanbulMavi: '#0077B6',
  maviAcik: '#48CAE4',
  maviOrta: '#0096C7',
  maviKoyu: '#005A8D',

  // Gradient uç noktaları
  gradientStart: '#00A8E8',
  gradientEnd: '#0077B6',

  // Durum renkleri
  acik: '#0096C7',            // mavi (AÇIK)
  uyari: '#E09F3E',           // koyu sarı-amber (KUYRUK — sadece durum göstergesi)
  kapali: '#D62828',          // kırmızı (KAPALI)
  bilgi: '#7B8FA1',           // gri-mavi (nötr bilgi)
  restorasyon: '#7B8FA1',     // gri-mavi (restorasyon)
  yogun: '#D62828',           // kırmızı (yoğun kuyruk)

  // Nötr tonlar
  beyaz: '#FFFFFF',
  siyah: '#000000',
  seffafSiyah50: 'rgba(0,0,0,0.5)',
  seffafBeyaz10: 'rgba(255,255,255,0.1)',
  seffafBeyaz20: 'rgba(255,255,255,0.2)',
};

// ═══ Tema Tanımları ═══
export const Tema = {
  light: {
    // Arka planlar
    bg: '#F5F7FA',
    bgSecondary: '#EAF4FB',
    bgCard: '#FFFFFF',
    bgCardAlt: '#EAF4FB',
    bgInput: '#EAF4FB',

    // Header gradient
    headerGradientStart: '#00A8E8',
    headerGradientEnd: '#0077B6',
    headerText: '#FFFFFF',
    headerSubtext: 'rgba(255,255,255,0.8)',

    // Metin
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // Kart
    kartBorder: '#E2E8F0',
    kartShadow: 'rgba(0,0,0,0.06)',
    kartRadius: 14,

    // Tab bar
    tabBg: '#FFFFFF',
    tabBorder: '#E2E8F0',
    tabActive: Palette.istanbulMavi,
    tabInactive: '#94A3B8',

    // Aksiyon butonları
    primary: Palette.istanbulMavi,
    secondary: '#0096C7',
    accent: Palette.istanbulMavi,

    // Durum
    durumAcik: Palette.acik,
    durumUyari: Palette.uyari,
    durumKapali: Palette.kapali,
    durumBilgi: Palette.bilgi,

    // Divider
    divider: '#E2E8F0',

    // Modal
    modalOverlay: 'rgba(0,0,0,0.5)',
    modalBg: '#FFFFFF',
  },
  dark: {
    // Arka planlar
    bg: '#0B1929',
    bgSecondary: '#112233',
    bgCard: '#112233',
    bgCardAlt: '#0E1E30',
    bgInput: '#0E1E30',

    // Header gradient
    headerGradientStart: '#0A3050',
    headerGradientEnd: '#0077B6',
    headerText: '#FFFFFF',
    headerSubtext: 'rgba(255,255,255,0.7)',

    // Metin
    text: '#E2E8F0',
    textSecondary: '#7B8FA1',
    textMuted: '#506070',
    textOnPrimary: '#FFFFFF',

    // Kart
    kartBorder: '#1E3A50',
    kartShadow: 'rgba(0,0,0,0.3)',
    kartRadius: 14,

    // Tab bar
    tabBg: '#0B1929',
    tabBorder: '#1E3A50',
    tabActive: Palette.maviAcik,
    tabInactive: '#7B8FA1',

    // Aksiyon butonları
    primary: Palette.istanbulMavi,
    secondary: '#0096C7',
    accent: Palette.maviAcik,

    // Durum
    durumAcik: Palette.acik,
    durumUyari: Palette.uyari,
    durumKapali: Palette.kapali,
    durumBilgi: Palette.bilgi,

    // Divider
    divider: '#1E3A50',

    // Modal
    modalOverlay: 'rgba(0,0,0,0.7)',
    modalBg: '#112233',
  },
};

export type TemaRenkleri = typeof Tema.light;

// ═══ Tipografi ═══
export const Typo = {
  baslikBuyuk: { fontSize: 26, fontWeight: '800' as const, letterSpacing: 0.5 },
  baslik: { fontSize: 20, fontWeight: '700' as const },
  altBaslik: { fontSize: 16, fontWeight: '700' as const },
  govde: { fontSize: 14, fontWeight: '400' as const },
  govdeKalin: { fontSize: 14, fontWeight: '600' as const },
  kucuk: { fontSize: 12, fontWeight: '400' as const },
  kucukKalin: { fontSize: 12, fontWeight: '600' as const },
  etiket: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
  buyukSaat: { fontSize: 42, fontWeight: '200' as const },
};

// ═══ Spacing ═══
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ═══ Radius ═══
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// ═══ Fonts ═══
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

// Eski uyumluluk için
export const Colors = {
  light: {
    text: Tema.light.text,
    background: Tema.light.bg,
    tint: Palette.istanbulMavi,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: Palette.istanbulMavi,
  },
  dark: {
    text: Tema.dark.text,
    background: Tema.dark.bg,
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};
