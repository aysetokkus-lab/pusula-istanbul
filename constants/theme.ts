/**
 * Pusula İstanbul — Tasarım Sistemi v2 (Eylül 2026 redesign)
 * Yön: "Kobalt & Menekşe" — kobalt ana renk, menekşe ikincil (header gradyanı kobalt→menekşe),
 * safran CTA, beyaz zemin + açık lavanta kartlar. Poppins tipografi.
 * Light + Dark mode desteği. Bkz. claude-context/PROJECT.md "Tasarım Kuralları".
 *
 * NOT: Eski anahtar adları (istanbulMavi, maviAcik, maviOrta, maviKoyu, gradientStart/End)
 * geriye uyumluluk için KORUNDU ve yeni değerlere bağlandı — eski kod yeniden boyanmış olur.
 */

import { Platform } from 'react-native';

// ═══ Ana Renk Paleti — Kobalt & Menekşe ═══
export const Palette = {
  // Marka
  kobalt: '#1E40AF',          // ana renk — header, birincil buton, aktif tab
  kobaltKoyu: '#172E8A',      // basılı durum, koyu vurgular
  kobaltOrta: '#2B5BD7',      // ikincil mavi vurgu, link
  kobaltAcik: '#6C8CFF',      // açık mavi (dark modda aktif tab, ince vurgular)
  menekse: '#7C3AED',         // ikincil marka rengi — gradyan ucu, müzeler, rozetler
  safran: '#F59E0B',          // AKSİYON / CTA — "Sahadan bildir", "+ Yeni", birincil eylem

  // Gradient uç noktaları (header: kobalt → menekşe)
  gradientStart: '#1E40AF',
  gradientEnd: '#7C3AED',

  // Durum renkleri
  acik: '#16A34A',            // yeşil (AÇIK / sakin)
  uyari: '#F59E0B',           // safran (KUYRUK / gecikme)
  kapali: '#DC2626',          // kırmızı (KAPALI / arıza)
  bilgi: '#6B7290',           // gri-mavi (nötr bilgi)
  restorasyon: '#6B7290',     // gri-mavi (restorasyon)
  yogun: '#DC2626',           // kırmızı (yoğun kuyruk)

  // Ek vurgu renkleri
  murdum: '#7C3AED',          // müzeler için mor (= menekşe)
  altin: '#B45309',           // saraylar / altın vurgusu (safrandan koyu, CTA ile karışmaz)

  // Tint'ler (açık zeminler — rozet/chip arka planı, ikon karosu)
  kobaltTint: '#E8EDFB',
  menekseTint: '#EFE7FD',
  safranTint: '#FEF3C7',
  acikTint: '#DCFCE7',
  kapaliTint: '#FEE2E2',

  // Nötr tonlar
  beyaz: '#FFFFFF',
  siyah: '#000000',
  seffafSiyah50: 'rgba(0,0,0,0.5)',
  seffafBeyaz10: 'rgba(255,255,255,0.1)',
  seffafBeyaz20: 'rgba(255,255,255,0.2)',

  // ─── Geriye uyumluluk (eski adlar → yeni değerler) ───
  istanbulMavi: '#1E40AF',
  maviAcik: '#6C8CFF',
  maviOrta: '#2B5BD7',
  maviKoyu: '#172E8A',
};

// ═══ Gradyanlar (LinearGradient colors dizileri) ═══
export const Gradient = {
  /** Header / hero: kobalt → menekşe (diagonal) */
  header: ['#1E40AF', '#4338CA', '#7C3AED'] as const,
  /** Birincil buton */
  buton: ['#1E40AF', '#2B5BD7'] as const,
  /** Uyarı / sıcak bant (etkinlik, ulaşım) */
  sicak: ['#F59E0B', '#F97316'] as const,
  /** Dark mod header */
  headerKoyu: ['#1E2A6E', '#3B2A8F'] as const,
};

// ═══ Tema Tanımları ═══
export const Tema = {
  light: {
    // Arka planlar
    bg: '#FFFFFF',
    bgSecondary: '#F6F7FD',
    bgCard: '#F6F7FD',
    bgCardAlt: '#FFFFFF',
    bgInput: '#FFFFFF',

    // Header gradient
    headerGradientStart: '#1E40AF',
    headerGradientEnd: '#7C3AED',
    headerText: '#FFFFFF',
    headerSubtext: 'rgba(255,255,255,0.82)',

    // Metin
    text: '#121A3E',
    textSecondary: '#6B7290',
    textMuted: '#9AA1BD',
    textOnPrimary: '#FFFFFF',

    // Kart
    kartBorder: '#E6E8F5',
    kartShadow: 'rgba(30,64,175,0.08)',
    kartRadius: 24,

    // Tab bar
    tabBg: '#FFFFFF',
    tabBorder: '#E6E8F5',
    tabActive: Palette.kobalt,
    tabInactive: '#9AA1BD',

    // Aksiyon
    primary: Palette.kobalt,
    secondary: Palette.menekse,
    accent: Palette.safran,

    // Durum
    durumAcik: Palette.acik,
    durumUyari: Palette.uyari,
    durumKapali: Palette.kapali,
    durumBilgi: Palette.bilgi,

    // Divider
    divider: '#E6E8F5',

    // Modal
    modalOverlay: 'rgba(18,26,62,0.55)',
    modalBg: '#FFFFFF',

    // İkon karosu (8'li ızgara)
    tileBg: Palette.kobalt,
    tileIcon: '#FFFFFF',
  },
  dark: {
    // Arka planlar
    bg: '#0F1530',
    bgSecondary: '#182046',
    bgCard: '#182046',
    bgCardAlt: '#131A3C',
    bgInput: '#131A3C',

    // Header gradient
    headerGradientStart: '#1E2A6E',
    headerGradientEnd: '#3B2A8F',
    headerText: '#FFFFFF',
    headerSubtext: 'rgba(255,255,255,0.75)',

    // Metin
    text: '#F1F4FF',
    textSecondary: '#A3ABCC',
    textMuted: '#6E779C',
    textOnPrimary: '#FFFFFF',

    // Kart
    kartBorder: '#26306A',
    kartShadow: 'rgba(0,0,0,0.4)',
    kartRadius: 24,

    // Tab bar
    tabBg: '#121A3C',
    tabBorder: '#26306A',
    tabActive: Palette.kobaltAcik,
    tabInactive: '#8A93B8',

    // Aksiyon
    primary: Palette.kobaltOrta,
    secondary: '#A78BFA',
    accent: Palette.safran,

    // Durum
    durumAcik: '#34D399',
    durumUyari: '#FBBF24',
    durumKapali: '#F87171',
    durumBilgi: '#8A93B8',

    // Divider
    divider: '#26306A',

    // Modal
    modalOverlay: 'rgba(0,0,0,0.7)',
    modalBg: '#182046',

    // İkon karosu
    tileBg: '#1F2A5C',
    tileIcon: '#A78BFA',
  },
};

export type TemaRenkleri = typeof Tema.light;

// ═══ Tipografi (Poppins — fontFamily varken fontWeight VERME, Android sahte-bold basar) ═══
export const Font = {
  regular: 'Poppins_400Regular',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
};

export const Typo = {
  baslikBuyuk: { fontSize: 26, fontFamily: Font.extrabold, letterSpacing: -0.5 },
  baslik: { fontSize: 20, fontFamily: Font.bold, letterSpacing: -0.3 },
  altBaslik: { fontSize: 16, fontFamily: Font.bold },
  govde: { fontSize: 14, fontFamily: Font.regular },
  govdeKalin: { fontSize: 14, fontFamily: Font.semibold },
  kucuk: { fontSize: 12, fontFamily: Font.regular },
  kucukKalin: { fontSize: 12, fontFamily: Font.semibold },
  /** KICKER: bölüm etiketi — büyük harf, 1px letter-spacing */
  etiket: { fontSize: 11, fontFamily: Font.bold, letterSpacing: 1, textTransform: 'uppercase' as const },
  buyukSaat: { fontSize: 42, fontFamily: Font.regular },
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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

// ═══ Fonts (sistem) ═══
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
    tint: Palette.kobalt,
    icon: '#6B7290',
    tabIconDefault: '#6B7290',
    tabIconSelected: Palette.kobalt,
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
