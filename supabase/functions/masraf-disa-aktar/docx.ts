// Pusula İstanbul — Masraf Pusulası Word (.docx) üretici, "Kobalt & Menekşe" (Eyl 2026)
// Üst bilgi: minik kobalt logo + marka kicker; başlık; lavanta bilgi tablosu; kobalt başlıklı masraf/ücret/avans tabloları (çok günlü turda Gün sütunu);
// özet (safran sol çizgi); notlar; fiş görselleri. Yazı tipi: Poppins (yüklüyse) → Calibri yedeği.
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, PageNumber, Packer, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType, TabStopType, TabStopPosition, type TableVerticalAlign,
} from 'npm:docx@9.7.1';
import type { Varliklar } from './varliklar.ts';
import {
  PALET, PARA_AD, type Satir, type Veri, base64ToBytes, cokGunlu, damgaTR, gunKisaTR, kalanEtiket, kategoriEtiket, paraTR, tarihAraligiTR,
} from './ortak.ts';

const FONT = 'Poppins';
const hex = (h: string) => h.replace('#', '');
const YOK = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const INCE = { style: BorderStyle.SINGLE, size: 4, color: hex(PALET.border) };
const SAYFA_W = 11906 - 2 * 1000; // A4 dxa − kenarlar (1000 dxa ≈ 1.76 cm)

function run(text: string, o: { bold?: boolean; size?: number; color?: string; caps?: boolean; spacing?: number } = {}) {
  return new TextRun({ text, font: FONT, bold: o.bold, size: o.size ?? 18, color: hex(o.color ?? PALET.metin), allCaps: o.caps, characterSpacing: o.spacing });
}

function p(children: TextRun[] | TextRun, o: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number; line?: number; tabSol?: number; tabSag?: number } = {}) {
  const tabStops = o.tabSol ? [{ type: TabStopType.LEFT, position: o.tabSol }] : o.tabSag ? [{ type: TabStopType.RIGHT, position: o.tabSag }] : undefined;
  return new Paragraph({ children: Array.isArray(children) ? children : [children], alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 0, line: o.line }, tabStops });
}

function kicker(text: string, color = PALET.kobalt, before = 280) {
  return p(run(text, { bold: true, size: 15, color, caps: true, spacing: 20 }), { before, after: 100 });
}

function hucre(children: Paragraph[], o: { w: number; fill?: string; borders?: typeof INCE | typeof YOK; pad?: number; valign?: TableVerticalAlign }) {
  const b = o.borders ?? INCE;
  return new TableCell({
    children, width: { size: o.w, type: WidthType.DXA }, verticalAlign: o.valign ?? VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: hex(o.fill), color: 'auto' } : undefined,
    borders: { top: b, bottom: b, left: b, right: b },
    margins: { top: o.pad ?? 80, bottom: o.pad ?? 80, left: 120, right: 120 },
  });
}

function bilgiTablosu(baslik: string, satirlar: [string, string][], w: number): Table {
  const rows = [
    new TableRow({ children: [hucre([p(run(baslik, { bold: true, size: 14, color: PALET.kobalt, caps: true, spacing: 20 }))], { w, fill: PALET.kart, borders: YOK, pad: 60 })] }),
    ...satirlar.map(([e, v]) => new TableRow({
      children: [hucre([p([run(`${e}`, { size: 16, color: PALET.metinIkincil }), new TextRun({ text: '\t', font: FONT }), run(v || '—', { bold: true, size: 17 })], { tabSol: 1300 })], { w, fill: PALET.kart, borders: YOK, pad: 40 })],
    })),
    new TableRow({ children: [hucre([p(run(''))], { w, fill: PALET.kart, borders: YOK, pad: 40 })] }),
  ];
  return new Table({ rows, width: { size: w, type: WidthType.DXA }, columnWidths: [w] });
}

function masrafTablosu(satirlar: Satir[], toplamEtiketi: string, gunluMu = false, fisliMi = true): Table {
  const gunW = gunluMu ? 900 : 0, fisW = fisliMi ? 800 : 0;
  const kol = [500, gunW, 1900, SAYFA_W - 500 - gunW - 1900 - fisW - 1800, fisW, 1800].filter((w) => w > 0);
  const bas = ['#', ...(gunluMu ? ['Gün'] : []), 'Kategori', 'Açıklama', ...(fisliMi ? ['Fiş'] : []), 'Tutar'];
  const son = kol.length - 1;
  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: bas.map((b, i) => hucre([p(run(b, { bold: true, size: 15, color: PALET.beyaz, caps: true }), { align: i === son ? AlignmentType.RIGHT : AlignmentType.LEFT })], { w: kol[i], fill: PALET.kobalt, borders: { style: BorderStyle.SINGLE, size: 4, color: hex(PALET.kobalt) } })),
    }),
  ];
  satirlar.forEach((s, i) => {
    const fill = i % 2 === 0 ? PALET.kart : undefined;
    const hucreler = [
      hucre([p(run(String(s.sira), { size: 16, color: PALET.metinIkincil }))], { w: kol[0], fill }),
      ...(gunluMu ? [hucre([p(run(gunKisaTR(s.tarih), { size: 15, color: PALET.metinIkincil }))], { w: kol[1], fill })] : []),
      hucre([p(run(kategoriEtiket(s.kategori), { bold: true, size: 16 }))], { w: kol[gunluMu ? 2 : 1], fill }),
      hucre([p(run(s.aciklama || '—', { size: 16 }))], { w: kol[gunluMu ? 3 : 2], fill }),
      ...(fisliMi ? [hucre([p(run(s.fis ? 'Var' : '—', { size: 15, color: s.fis ? PALET.acik : PALET.metinSoluk }))], { w: kol[son - 1], fill })] : []),
      hucre([p(run(paraTR(s.tutar, s.para_birimi), { bold: true, size: 17 }), { align: AlignmentType.RIGHT })], { w: kol[son], fill }),
    ];
    rows.push(new TableRow({ children: hucreler }));
  });
  if (satirlar.length === 0) {
    rows.push(new TableRow({ children: [hucre([p(run('Kayıt yok', { size: 16, color: PALET.metinSoluk }))], { w: SAYFA_W })] }));
  }
  const toplamlar = new Map<string, number>();
  for (const s of satirlar) toplamlar.set(s.para_birimi, (toplamlar.get(s.para_birimi) ?? 0) + s.tutar);
  for (const [pb, t] of toplamlar) {
    rows.push(new TableRow({
      children: [
        hucre([p(run(`${toplamEtiketi} (${pb})`, { size: 16, color: PALET.metinIkincil }), { align: AlignmentType.RIGHT })], { w: SAYFA_W - kol[son], borders: YOK }),
        hucre([p(run(paraTR(t, pb as Satir['para_birimi']), { bold: true, size: 18, color: PALET.kobalt }), { align: AlignmentType.RIGHT })], { w: kol[son], borders: YOK }),
      ],
    }));
  }
  return new Table({ rows, width: { size: SAYFA_W, type: WidthType.DXA }, columnWidths: kol });
}

function ozetTablosu(veri: Veri): Table {
  const cizgiW = 70; const w = SAYFA_W - cizgiW; const icW = w - 240;
  const rows: TableRow[] = [];
  const satir = (e: string, d: string, kalin = false, renk: string = PALET.metin, size = 17) =>
    p([run(e, { size: 16, color: PALET.metinIkincil }), new TextRun({ text: '\t', font: FONT }), run(d, { bold: kalin, size, color: renk })], { tabSag: icW, after: 40 });
  for (const o of veri.ozet) {
    const icerik = [
      p(run(`${PARA_AD[o.para_birimi]} (${o.para_birimi})`, { bold: true, size: 15, color: PALET.menekse, caps: true, spacing: 10 }), { before: 60, after: 80 }),
      satir('Toplam masraf', paraTR(o.masraf, o.para_birimi)),
      satir('Rehberlik ücreti', paraTR(o.ucret, o.para_birimi)),
      satir('Alınan avans', paraTR(o.avans, o.para_birimi)),
      satir(kalanEtiket(o), paraTR(Math.abs(o.kalan), o.para_birimi), true, o.kalan > 0 ? PALET.kobalt : o.kalan < 0 ? PALET.kapali : PALET.acik, 21),
      p(run(''), { after: 40 }),
    ];
    rows.push(new TableRow({
      cantSplit: true,
      children: [
        hucre([p(run(''))], { w: cizgiW, fill: PALET.safran, borders: YOK, pad: 0 }),
        hucre(icerik, { w, fill: PALET.kart, borders: YOK, pad: 40, valign: VerticalAlign.TOP }),
      ],
    }));
  }
  return new Table({
    rows, width: { size: SAYFA_W, type: WidthType.DXA }, columnWidths: [cizgiW, w],
    borders: { top: YOK, bottom: YOK, left: YOK, right: YOK, insideHorizontal: YOK, insideVertical: YOK },
  });
}

export async function docxUret(veri: Veri, v: Varliklar): Promise<Uint8Array> {
  const t = veri.tur; const r = veri.rehber;
  const logo = v.logoKobalt;

  const header = new Header({
    children: [
      new Paragraph({
        children: [
          ...(logo ? [new ImageRun({ type: 'png' as const, data: logo, transformation: { width: 20, height: 20 }, altText: { title: 'Pusula İstanbul', description: 'Pusula İstanbul logosu', name: 'logo' } })] : []),
          run(logo ? '   PUSULA İSTANBUL' : 'PUSULA İSTANBUL', { bold: true, size: 14, color: PALET.kobalt, spacing: 24 }),
          run('   ·   Masraf Pusulası', { size: 14, color: PALET.metinSoluk }),
          new TextRun({ text: '\t', font: FONT }),
          run(`${tarihAraligiTR(t)} · ${r.adSoyad}`, { size: 14, color: PALET.metinSoluk }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(PALET.kobalt), space: 6 } },
        spacing: { after: 120 },
      }),
    ],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        children: [
          run(`Pusula İstanbul ile oluşturuldu · pusulaistanbul.app · ${damgaTR(veri.olusturma)}`, { size: 13, color: PALET.metinSoluk }),
          new TextRun({ text: '\t', font: FONT }),
          new TextRun({ children: ['Sayfa ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], font: FONT, size: 13, color: hex(PALET.metinSoluk) }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: hex(PALET.border), space: 6 } },
      }),
    ],
  });

  const yariW = Math.floor((SAYFA_W - 240) / 2);
  const bilgi = new Table({
    width: { size: SAYFA_W, type: WidthType.DXA }, columnWidths: [yariW, 240, yariW],
    borders: { top: YOK, bottom: YOK, left: YOK, right: YOK, insideHorizontal: YOK, insideVertical: YOK },
    rows: [new TableRow({
      children: [
        new TableCell({ children: [bilgiTablosu('Tur bilgileri', [
          ['Tur', t.baslik], ['Tarih', tarihAraligiTR(t)], ['Acente', t.acente || '—'], ['Grup', t.grup || '—'],
          ['Saat', t.saat ? `${t.saat}${t.bulusma ? ` · ${t.bulusma}` : ''}` : (t.bulusma || '—')],
        ], yariW)], width: { size: yariW, type: WidthType.DXA }, borders: { top: YOK, bottom: YOK, left: YOK, right: YOK }, verticalAlign: VerticalAlign.TOP }),
        new TableCell({ children: [p(run(''))], width: { size: 240, type: WidthType.DXA }, borders: { top: YOK, bottom: YOK, left: YOK, right: YOK } }),
        new TableCell({ children: [bilgiTablosu('Rehber', [
          ['Ad Soyad', r.adSoyad], ['Telefon', r.telefon || '—'], ['E-posta', r.email || '—'], ['Ruhsat No', r.ruhsatNo || '—'],
        ], yariW)], width: { size: yariW, type: WidthType.DXA }, borders: { top: YOK, bottom: YOK, left: YOK, right: YOK }, verticalAlign: VerticalAlign.TOP }),
      ],
    })],
  });

  const govde: (Paragraph | Table)[] = [
    p(run('Masraf Pusulası', { bold: true, size: 40, color: PALET.kobalt }), { after: 40 }),
    p([run(t.baslik, { bold: true, size: 20 }), run(`   ·   ${tarihAraligiTR(t)}`, { size: 18, color: PALET.metinIkincil })], { after: 200 }),
    bilgi,
    kicker('Masraflar'),
    masrafTablosu(veri.masraflar, 'Masraf toplamı', cokGunlu(t), true),
  ];
  if (veri.ucretler.length) { govde.push(kicker('Rehberlik ücreti'), masrafTablosu(veri.ucretler, 'Ücret toplamı', cokGunlu(t), false)); }
  if (veri.avanslar.length) { govde.push(kicker('Avanslar'), masrafTablosu(veri.avanslar, 'Avans toplamı', cokGunlu(t), false)); }
  if (veri.ozet.length) { govde.push(kicker('Özet'), ozetTablosu(veri)); }
  if (t.notlar) {
    govde.push(kicker('Notlar'));
    for (const satir of t.notlar.split(/\r?\n/)) govde.push(p(run(satir, { size: 17 }), { after: 60, line: 300 }));
  }
  const fisli = veri.masraflar.filter((s) => s.fis);
  if (fisli.length) {
    govde.push(new Paragraph({ children: [], pageBreakBefore: true }));
    govde.push(kicker(`Fişler ve faturalar (${fisli.length} adet)`, PALET.kobalt, 0));
    for (const s of fisli) {
      const png = s.fis!.mime.includes('png');
      const olcu = fisOlcu(s.fis!.bytes, png);
      govde.push(p([run(`#${s.sira} · ${kategoriEtiket(s.kategori)} · ${paraTR(s.tutar, s.para_birimi)}`, { bold: true, size: 16, color: PALET.kobalt }), ...(s.aciklama ? [run(`   ${s.aciklama}`, { size: 15, color: PALET.metinIkincil })] : [])], { before: 160, after: 60 }));
      govde.push(new Paragraph({
        children: [new ImageRun({ type: png ? 'png' : 'jpg', data: s.fis!.bytes, transformation: olcu, altText: { title: 'Fiş', description: kategoriEtiket(s.kategori), name: `fis-${s.sira}` } })],
        spacing: { after: 120 },
      }));
    }
  }

  const doc = new Document({
    creator: 'Pusula İstanbul', title: `Masraf Pusulası — ${t.baslik} — ${t.tarih}`, description: 'Pusula İstanbul masraf pusulası',
    styles: { default: { document: { run: { font: FONT, size: 18, color: hex(PALET.metin) } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1100, bottom: 1000, left: 1000, right: 1000 } } },
      headers: { default: header }, footers: { default: footer },
      children: govde,
    }],
  });
  const b64 = await Packer.toBase64String(doc);
  return base64ToBytes(b64);
}

/** JPEG/PNG boyutunu başlıktan okuyup 300×360 pt kutusuna sığdırır */
function fisOlcu(bytes: Uint8Array, png: boolean): { width: number; height: number } {
  let w = 0, h = 0;
  try {
    if (png) {
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      w = dv.getUint32(16); h = dv.getUint32(20);
    } else {
      let i = 2;
      while (i < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const m = bytes[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { h = (bytes[i + 5] << 8) | bytes[i + 6]; w = (bytes[i + 7] << 8) | bytes[i + 8]; break; }
        i += 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
      }
    }
  } catch { /* yoksay */ }
  if (!w || !h) return { width: 300, height: 360 };
  const olcek = Math.min(300 / w, 360 / h);
  return { width: Math.round(w * olcek), height: Math.round(h * olcek) };
}
