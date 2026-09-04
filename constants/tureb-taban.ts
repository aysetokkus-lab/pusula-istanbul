/**
 * TUREB rehber taban ücretleri — İlan formunda alt sınır olarak uygulanır.
 * Kaynak: tureb.org.tr/Sayfa?id=16 (2026 yılı tarifesi). Her yıl güncellenir.
 * Yarım gün için TUREB'de ayrı kalem yoktur → günlük tur tabanı uygulanır.
 * Çok günlü (paket tur) taban GÜNLÜK tutardır; ilanlardaki ücret günlük yazılır.
 */
export const TUREB_TABAN_YILI = 2026;

export interface TabanTarife {
  gunluk: number;   // A- Günlük tur
  transfer: number; // B- Transfer
  gece: number;     // C- Gece turu
  paket: number;    // D- Paket tur (günlük)
}

export const TUREB_TABAN: { yabanci: TabanTarife; turkce: TabanTarife } = {
  yabanci: { gunluk: 5566, transfer: 2790, gece: 2790, paket: 6708 },
  turkce:  { gunluk: 3897, transfer: 1953, gece: 1953, paket: 4696 },
};

export type IlanSureTipi = 'yarim_gun' | 'tam_gun' | 'coklu_gun' | 'transfer' | 'diger';

/** İlan süresi + dillere göre geçerli taban (TL, günlük) */
export function tabanUcret(sure: IlanSureTipi, diller: string[]): { tutar: number; etiket: string } {
  const sadeceTurkce = diller.length > 0 && diller.every(d => d.toLocaleLowerCase('tr') === 'türkçe');
  const t = sadeceTurkce ? TUREB_TABAN.turkce : TUREB_TABAN.yabanci;
  const dil = sadeceTurkce ? 'Türkçe tur' : 'yabancı dil';
  switch (sure) {
    case 'transfer': return { tutar: t.transfer, etiket: `transfer, ${dil}` };
    case 'coklu_gun': return { tutar: t.paket, etiket: `paket tur günlük, ${dil}` };
    default: return { tutar: t.gunluk, etiket: `günlük tur, ${dil}` };
  }
}

export function tlFormat(n: number): string {
  return `${n.toLocaleString('tr-TR')} TL`;
}

/** Kullanıcı girişinden sayı çıkar ("5.600", "5600 tl", "5 600") */
export function ucretSayi(metin: string): number | null {
  const temiz = metin.replace(/[^\d]/g, '');
  if (!temiz) return null;
  const n = parseInt(temiz, 10);
  return isNaN(n) ? null : n;
}
