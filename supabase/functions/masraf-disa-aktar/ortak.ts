// Pusula İstanbul — Masraf Pusulası dışa aktarma: ortak tipler, palet ve biçimleyiciler (Eyl 2026)
// Kaynak repoda: supabase/functions/masraf-disa-aktar/ortak.ts

export type ParaBirimi = 'TRY' | 'EUR' | 'USD';

export interface Satir {
  sira: number;                // tablo numarası (1'den)
  tip: 'masraf' | 'avans' | 'ucret';
  kategori: string;
  tarih: string | null;        // satırın günü ('YYYY-MM-DD'), çok günlü turlarda
  aciklama: string | null;
  tutar: number;
  para_birimi: ParaBirimi;
  fis_path: string | null;
  fis?: { bytes: Uint8Array; mime: string } | null;   // indirilmiş fiş görseli (jpeg/png)
}

export interface Rehber {
  adSoyad: string;
  telefon: string | null;
  email: string | null;
  ruhsatNo: string | null;
}

export interface Tur {
  tarih: string;               // 'YYYY-MM-DD' (başlangıç)
  bitis_tarih: string | null;  // çok günlü tur bitişi (NULL = tek gün)
  baslik: string;
  acente: string | null;
  acente_email: string | null;
  grup: string | null;
  saat: string | null;
  bulusma: string | null;
  notlar: string | null;
}

export interface OzetSatiri {
  para_birimi: ParaBirimi;
  masraf: number;
  ucret: number;               // rehberlik ücreti
  avans: number;
  kalan: number;               // masraf + ucret - avans  (>0: acenteden alınacak, <0: acenteye iade)
}

export interface Veri {
  rehber: Rehber;
  tur: Tur;
  masraflar: Satir[];
  avanslar: Satir[];
  ucretler: Satir[];           // rehberlik ücreti satırları
  ozet: OzetSatiri[];
  olusturma: Date;
}

/* ─── Palet (constants/theme.ts ile aynı — "Kobalt & Menekşe") ─── */
export const PALET = {
  kobalt: '#1E40AF',
  kobaltKoyu: '#172E8A',
  menekse: '#7C3AED',
  safran: '#F59E0B',
  acik: '#16A34A',
  kapali: '#DC2626',
  metin: '#121A3E',
  metinIkincil: '#6B7290',
  metinSoluk: '#9AA1BD',
  kart: '#F6F7FD',
  border: '#E6E8F5',
  kobaltTint: '#E8EDFB',
  safranTint: '#FEF3C7',
  beyaz: '#FFFFFF',
} as const;

export const KATEGORI_ETIKET: Record<string, string> = {
  muze_giris: 'Müze / Giriş',
  ulasim: 'Ulaşım',
  otoyol_kopru: 'Otoyol / Köprü',
  otopark: 'Otopark',
  kaptan_yemek: 'Kaptan Yemek',
  rehber_yemek: 'Rehber Yemek',
  bahsis: 'Bahşiş',
  telefon: 'Telefon',
  diger: 'Diğer',
  avans: 'Avans',
  ucret: 'Rehberlik Ücreti',
};

export const PARA_SEMBOL: Record<ParaBirimi, string> = { TRY: '₺', EUR: '€', USD: '$' };
export const PARA_AD: Record<ParaBirimi, string> = { TRY: 'Türk Lirası', EUR: 'Euro', USD: 'Amerikan Doları' };

export function kategoriEtiket(k: string): string {
  return KATEGORI_ETIKET[k] ?? k;
}

/** 1250.5 → "1.250,50" (TR biçimi, Intl'e bağımlı değil) */
export function sayiTR(n: number): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  const [tam, kesir] = abs.toFixed(2).split('.');
  const grup = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${grup},${kesir}`;
}

/** 1250.5,'TRY' → "1.250,50 ₺" */
export function paraTR(n: number, pb: ParaBirimi): string {
  return `${sayiTR(n)} ${PARA_SEMBOL[pb]}`;
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** '2026-09-05' → "5 Eylül 2026, Cumartesi" */
export function tarihUzunTR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${d} ${AYLAR[m - 1]} ${y}, ${GUNLER[dt.getUTCDay()]}`;
}

/** '2026-09-05' → "05.09.2026" */
export function tarihKisaTR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Oluşturma damgası (İstanbul saati) */
export function damgaTR(d: Date): string {
  const ist = new Date(d.getTime() + 3 * 60 * 60 * 1000); // UTC+3 (İstanbul yıl boyu)
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(ist.getUTCDate())}.${p(ist.getUTCMonth() + 1)}.${ist.getUTCFullYear()} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`;
}

/** Türkçe karakterleri ASCII'ye indirip dosya adı için güvenli slug üretir */
export function slug(s: string, maxLen = 40): string {
  const map: Record<string, string> = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
  const ascii = s.replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => map[c] ?? c).normalize('NFD').replace(/[̀-ͯ]/g, '');
  return ascii.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, maxLen) || 'Tur';
}

export function dosyaAdi(tur: Tur, uzanti: string): string {
  return `Masraf-Pusulasi_${tur.tarih}_${slug(tur.baslik)}.${uzanti}`;
}

/** Özet: para birimi bazında masraf + ücret − avans */
export function ozetHesapla(masraflar: Satir[], avanslar: Satir[], ucretler: Satir[] = []): OzetSatiri[] {
  const m = new Map<ParaBirimi, OzetSatiri>();
  const al = (pb: ParaBirimi) => {
    let o = m.get(pb);
    if (!o) { o = { para_birimi: pb, masraf: 0, ucret: 0, avans: 0, kalan: 0 }; m.set(pb, o); }
    return o;
  };
  for (const s of masraflar) al(s.para_birimi).masraf += s.tutar;
  for (const s of ucretler) al(s.para_birimi).ucret += s.tutar;
  for (const s of avanslar) al(s.para_birimi).avans += s.tutar;
  const sira: ParaBirimi[] = ['TRY', 'EUR', 'USD'];
  return sira.filter((pb) => m.has(pb)).map((pb) => { const o = al(pb); o.kalan = +(o.masraf + o.ucret - o.avans).toFixed(2); return o; });
}

/** Tur çok günlü mü */
export function cokGunlu(t: Tur): boolean {
  return !!t.bitis_tarih && t.bitis_tarih !== t.tarih;
}

/** Gün sayısı (dahil) */
export function gunSayisi(t: Tur): number {
  if (!cokGunlu(t)) return 1;
  const a = new Date(`${t.tarih}T00:00:00Z`).getTime(), b = new Date(`${t.bitis_tarih}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

/** "12 – 30 Eylül 2026 (19 gün)" / "28 Eylül – 2 Ekim 2026 (5 gün)" / tek gün: tarihUzunTR */
export function tarihAraligiTR(t: Tur): string {
  if (!cokGunlu(t)) return tarihUzunTR(t.tarih);
  const [y1, m1, d1] = t.tarih.split('-').map(Number);
  const [y2, m2, d2] = t.bitis_tarih!.split('-').map(Number);
  const n = gunSayisi(t);
  if (y1 === y2 && m1 === m2) return `${d1} – ${d2} ${AYLAR[m1 - 1]} ${y1} (${n} gün)`;
  if (y1 === y2) return `${d1} ${AYLAR[m1 - 1]} – ${d2} ${AYLAR[m2 - 1]} ${y1} (${n} gün)`;
  return `${d1} ${AYLAR[m1 - 1]} ${y1} – ${d2} ${AYLAR[m2 - 1]} ${y2} (${n} gün)`;
}

const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
/** '2026-09-12' → "12 Eyl" (tablo gün sütunu) */
export function gunKisaTR(iso: string | null): string {
  if (!iso) return '—';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${AY_KISA[m - 1]}`;
}

export function kalanEtiket(o: OzetSatiri): string {
  if (Math.abs(o.kalan) < 0.005) return 'Hesap kapandı';
  return o.kalan > 0 ? 'Acenteden alınacak' : 'Acenteye iade edilecek';
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const parca = 0x8000;
  for (let i = 0; i < bytes.length; i += parca) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + parca)));
  }
  return btoa(bin);
}

/** Fiş satırının kısa başlığı: "#3 · Otopark · 150,00 ₺" */
export function fisBaslik(s: Satir): string {
  const parcalar = [`#${s.sira}`, kategoriEtiket(s.kategori)];
  if (s.aciklama) parcalar.push(s.aciklama);
  parcalar.push(paraTR(s.tutar, s.para_birimi));
  return parcalar.join(' · ');
}
