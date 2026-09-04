/**
 * Pusula İstanbul — Masraf Pusulası sabitleri (Eyl 2026)
 * Kategoriler / para birimleri DB CHECK kısıtlarıyla (migration `ajanda_ve_masraf_pusulasi`) ve
 * Edge Function `masraf-disa-aktar/ortak.ts` ile BİREBİR aynı olmalı.
 */

export type MasrafKategori =
  | 'muze_giris' | 'ulasim' | 'otoyol_kopru' | 'otopark' | 'kaptan_yemek' | 'rehber_yemek' | 'bahsis' | 'telefon' | 'diger';

export type ParaBirimi = 'TRY' | 'EUR' | 'USD';

export const MASRAF_KATEGORILERI: { id: MasrafKategori; baslik: string }[] = [
  { id: 'muze_giris', baslik: 'Müze / Giriş' },
  { id: 'ulasim', baslik: 'Ulaşım' },
  { id: 'otoyol_kopru', baslik: 'Otoyol / Köprü' },
  { id: 'otopark', baslik: 'Otopark' },
  { id: 'kaptan_yemek', baslik: 'Kaptan Yemek' },
  { id: 'rehber_yemek', baslik: 'Rehber Yemek' },
  { id: 'bahsis', baslik: 'Bahşiş' },
  { id: 'telefon', baslik: 'Telefon' },
  { id: 'diger', baslik: 'Diğer' },
];

export const PARA_BIRIMLERI: { id: ParaBirimi; baslik: string; sembol: string }[] = [
  { id: 'TRY', baslik: 'TL', sembol: '₺' },
  { id: 'EUR', baslik: 'EUR', sembol: '€' },
  { id: 'USD', baslik: 'USD', sembol: '$' },
];

export function kategoriBaslik(id: string): string {
  if (id === 'avans') return 'Avans';
  if (id === 'ucret') return 'Rehberlik Ücreti';
  return MASRAF_KATEGORILERI.find(k => k.id === id)?.baslik ?? id;
}

export function paraSembol(pb: ParaBirimi): string {
  return PARA_BIRIMLERI.find(p => p.id === pb)?.sembol ?? pb;
}

/** 1250.5 → "1.250,50" */
export function sayiTR(n: number): string {
  const neg = n < 0;
  const [tam, kesir] = Math.abs(n).toFixed(2).split('.');
  return `${neg ? '-' : ''}${tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${kesir}`;
}

/** 1250.5, 'TRY' → "1.250,50 ₺" */
export function paraTR(n: number, pb: ParaBirimi): string {
  return `${sayiTR(n)} ${paraSembol(pb)}`;
}

/** Kullanıcı girişi "1.250,50" / "1250.5" / "1250" → sayı (geçersizse null) */
export function tutarParse(s: string): number | null {
  const temiz = s.trim().replace(/\s/g, '');
  if (!temiz) return null;
  // Hem "1.250,50" hem "1250.50" kabul: son ayraç ondalık kabul edilir
  const sonVirgul = temiz.lastIndexOf(','), sonNokta = temiz.lastIndexOf('.');
  let norm = temiz;
  if (!temiz.includes(',') && /^\d{1,3}(\.\d{3})+$/.test(temiz)) norm = temiz.replace(/\./g, '');        // "1.250" / "1.250.000" → TR binlik
  else if (!temiz.includes('.') && /^\d{1,3}(,\d{3})+$/.test(temiz)) norm = temiz.replace(/,/g, '');     // "1,250,000" → binlik
  else if (sonVirgul > sonNokta) norm = temiz.replace(/\./g, '').replace(',', '.');
  else if (sonNokta > sonVirgul) norm = temiz.replace(/,/g, '');
  const n = Number(norm);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}
