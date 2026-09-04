// Pusula İstanbul — dışa aktarma varlıkları: Poppins alt kümesi (Latin + Türkçe + € ₺) ve minik logo PNG'leri.
// Birincil kaynak: pusulaistanbul.app/varliklar/ (repo docs/varliklar/, GitHub Pages). Yedek: google/fonts deposu (tam TTF).
// İzolasyon ömrü boyunca bellekte önbelleklenir; logo alınamazsa çıktılar logosuz üretilir (kırılmaz).

export interface Varliklar {
  regular: Uint8Array;
  semibold: Uint8Array;
  bold: Uint8Array;
  logoKobalt: Uint8Array | null;   // kobalt windrose, şeffaf zemin (Word başlığı — beyaz zemin)
  logoBeyaz: Uint8Array | null;    // beyaz windrose (PDF/Excel kobalt bandı)
}

const TABAN = 'https://pusulaistanbul.app/varliklar';
const GOOGLE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins';

async function indir(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'PusulaIstanbul-MasrafDisaAktar/1.0' } });
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch { return null; }
}

async function fontIndir(ad: 'Regular' | 'SemiBold' | 'Bold'): Promise<Uint8Array> {
  const b = (await indir(`${TABAN}/Poppins-${ad}-tr.ttf`)) ?? (await indir(`${GOOGLE}/Poppins-${ad}.ttf`));
  if (!b) throw new Error(`Yazı tipi indirilemedi: Poppins ${ad}`);
  return b;
}

let onbellek: Promise<Varliklar> | null = null;

export function varliklariYukle(): Promise<Varliklar> {
  if (!onbellek) {
    onbellek = (async () => {
      const [regular, semibold, bold, logoKobalt, logoBeyaz] = await Promise.all([
        fontIndir('Regular'), fontIndir('SemiBold'), fontIndir('Bold'),
        indir(`${TABAN}/logo-kobalt-192.png`), indir(`${TABAN}/logo-beyaz-192.png`),
      ]);
      return { regular, semibold, bold, logoKobalt, logoBeyaz };
    })().catch((e) => { onbellek = null; throw e; });
  }
  return onbellek;
}
