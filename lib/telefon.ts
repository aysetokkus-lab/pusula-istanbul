/* ═══════════════════════════════════════════
   Telefon yardımcıları (Eyl 2026)
   ───────────────────────────────────────────
   Beyan usulü telefon: SMS/WhatsApp doğrulaması YOK (Ayşe kararı, 4 Eyl 2026).
   Numara E.164 biçiminde saklanır (+905321234567). Türkiye varsayılan ülke;
   "+" ya da "00" ile başlayan yurt dışı numaralar olduğu gibi kabul edilir.
   Kendi kendine sağlama: kullanıcı "WhatsApp'ta aç" ile numarasını test eder.
   ═══════════════════════════════════════════ */

/** Sadece rakamları bırak; baştaki "+" korunur */
function rakamlar(girdi: string): string {
  return (girdi || '').replace(/\D/g, '');
}

/**
 * Girdiyi E.164'e çevirir. Geçersizse null.
 * Kabul edilen biçimler:
 *   05321234567 · 5321234567 · +90 532 123 45 67 · 0090532... · 90532...
 *   +33 6 12 34 56 78 (yurt dışı: + ya da 00 zorunlu)
 */
export function telefonNormalize(girdi: string): string | null {
  const ham = (girdi || '').trim();
  if (!ham) return null;
  const artiIle = ham.startsWith('+');
  let d = rakamlar(ham);
  if (!d) return null;

  if (artiIle || d.startsWith('00')) {
    if (d.startsWith('00')) d = d.slice(2);
    // Yurt dışı / uluslararası: ülke kodu dahil 8–15 hane (E.164)
    if (d.startsWith('90')) return trKontrol(d.slice(2));
    if (d.length < 8 || d.length > 15) return null;
    return `+${d}`;
  }

  // Ülke kodu yazılmamış → Türkiye varsayılır
  if (d.startsWith('90') && d.length === 12) return trKontrol(d.slice(2));
  if (d.startsWith('0')) d = d.slice(1);
  return trKontrol(d);
}

/** 10 haneli, 5 ile başlayan TR GSM numarası */
function trKontrol(d: string): string | null {
  if (d.length !== 10 || d[0] !== '5') return null;
  return `+90${d}`;
}

export function telefonGecerliMi(girdi: string): boolean {
  return telefonNormalize(girdi) !== null;
}

/** +905321234567 → "+90 532 123 45 67"; yurt dışı numarada sadece + ve boşluksuz */
export function telefonGoster(e164: string | null | undefined): string {
  if (!e164) return '';
  const d = rakamlar(e164);
  if (d.startsWith('90') && d.length === 12) {
    const n = d.slice(2);
    return `+90 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
  }
  return e164.startsWith('+') ? e164 : `+${d}`;
}

/** wa.me bağlantısı (E.164 ya da serbest metin) */
export function whatsappLink(girdi: string): string | null {
  const n = telefonNormalize(girdi) ?? (rakamlar(girdi) || null);
  if (!n) return null;
  return `https://wa.me/${rakamlar(n)}`;
}

/** tel: bağlantısı */
export function aramaLink(girdi: string): string | null {
  const n = telefonNormalize(girdi) ?? (rakamlar(girdi) ? `+${rakamlar(girdi)}` : null);
  if (!n) return null;
  return `tel:${n}`;
}

export const TELEFON_YARDIM = 'Örn. 0532 123 45 67 · yurt dışı için +33 6 12 34 56 78';
export const TELEFON_HATA = 'Geçerli bir cep telefonu yaz (05xx ile başlayan 10 hane ya da +ülke kodu ile).';
