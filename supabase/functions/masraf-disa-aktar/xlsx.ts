// Pusula İstanbul — Masraf Pusulası Excel (.xlsx) üretici (exceljs), "Kobalt & Menekşe" (Eyl 2026)
// Sayfa 1 "Masraf Pusulası": kobalt üst bant + minik beyaz logo, lavanta bilgi blokları, kobalt başlıklı tablolar (masraf / rehberlik ücreti / avans;
// çok günlü turda B "Gün" sütunu görünür), para birimine göre SUMIF formüllü toplamlar, özet (formüllü kalan), notlar. Sayfa 2 "Fişler": görseller.
// Sütunlar: A # · B Gün · C Kategori · D Açıklama · E Fiş · F Tutar · G PB
import ExcelJS from 'npm:exceljs@4.4.0';
import type { Varliklar } from './varliklar.ts';
import {
  PALET, PARA_AD, PARA_SEMBOL, type ParaBirimi, type Satir, type Veri, cokGunlu, damgaTR, gunKisaTR, kategoriEtiket, tarihAraligiTR,
} from './ortak.ts';

const FONT = 'Poppins';
const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`;
const dolgu = (hex: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } });
const inceKenar: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: argb(PALET.border) } };
const KENARLAR: Partial<ExcelJS.Borders> = { top: inceKenar, bottom: inceKenar, left: inceKenar, right: inceKenar };
const NUMFMT: Record<ParaBirimi, string> = {
  TRY: `#,##0.00 "${PARA_SEMBOL.TRY}"`, EUR: `#,##0.00 "${PARA_SEMBOL.EUR}"`, USD: `#,##0.00 "${PARA_SEMBOL.USD}"`,
};

function yazi(o: { bold?: boolean; size?: number; color?: string } = {}): Partial<ExcelJS.Font> {
  return { name: FONT, bold: o.bold ?? false, size: o.size ?? 10, color: { argb: argb(o.color ?? PALET.metin) } };
}

export async function xlsxUret(veri: Veri, v: Varliklar): Promise<Uint8Array> {
  const t = veri.tur; const r = veri.rehber;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Pusula İstanbul'; wb.created = veri.olusturma; wb.title = `Masraf Pusulası — ${t.baslik} — ${t.tarih}`;
  const ws = wb.addWorksheet('Masraf Pusulası', {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 } },
  });
  const gunlu = cokGunlu(t);
  ws.columns = [{ width: 9 }, { width: gunlu ? 9 : 2, hidden: !gunlu }, { width: 18 }, { width: 44 }, { width: 7 }, { width: 16 }, { width: 8 }];
  const SON = 7; // son sütun (PB)
  ws.headerFooter.oddFooter = `&L&8&K9AA1BD Pusula İstanbul ile oluşturuldu · pusulaistanbul.app · ${damgaTR(veri.olusturma)}&R&8&K9AA1BD Sayfa &P / &N`;

  /* ─── Üst bant (1-3) ─── */
  for (let rr = 1; rr <= 3; rr++) for (let c = 1; c <= SON; c++) ws.getCell(rr, c).fill = dolgu(PALET.kobalt);
  ws.getRow(1).height = 16; ws.getRow(2).height = 26; ws.getRow(3).height = 8;
  if (v.logoBeyaz) {
    const logoId = wb.addImage({ buffer: v.logoBeyaz as unknown as ExcelJS.Buffer, extension: 'png' });
    ws.addImage(logoId, { tl: { col: 0.12, row: 0.35 }, ext: { width: 30, height: 30 }, editAs: 'absolute' } as ExcelJS.ImagePosition & { editAs: string });
  }
  ws.getCell('C1').value = 'PUSULA İSTANBUL'; ws.getCell('C1').font = yazi({ bold: true, size: 8, color: PALET.beyaz }); ws.getCell('C1').alignment = { vertical: 'bottom' };
  ws.getCell('C2').value = 'Masraf Pusulası'; ws.getCell('C2').font = yazi({ bold: true, size: 16, color: PALET.beyaz }); ws.getCell('C2').alignment = { vertical: 'middle' };
  ws.getCell('F1').value = tarihAraligiTR(t); ws.getCell('F1').font = yazi({ bold: true, size: 9, color: PALET.beyaz }); ws.getCell('F1').alignment = { horizontal: 'right', vertical: 'bottom' };
  ws.mergeCells('F1:G1');
  ws.getCell('F2').value = r.adSoyad; ws.getCell('F2').font = yazi({ size: 9, color: PALET.beyaz }); ws.getCell('F2').alignment = { horizontal: 'right', vertical: 'middle' };
  ws.mergeCells('F2:G2');

  /* ─── Bilgi blokları (5-10) ─── */
  const bilgi = (col: number, genislik: number, baslik: string, satirlar: [string, string][]) => {
    let rr = 5;
    for (let i = 0; i < satirlar.length + 2; i++) for (let c = col; c < col + genislik; c++) ws.getCell(rr + i, c).fill = dolgu(PALET.kart);
    ws.getCell(rr, col).value = baslik.toLocaleUpperCase('tr-TR'); ws.getCell(rr, col).font = yazi({ bold: true, size: 8, color: PALET.kobalt });
    rr++;
    for (const [e, v] of satirlar) {
      const dc = col === 1 ? 3 : col + 1;   // A'daki etiketin değeri C'den başlar (B gün sütunu gizlenebilir)
      ws.getCell(rr, col).value = e; ws.getCell(rr, col).font = yazi({ size: 9, color: PALET.metinIkincil });
      ws.getCell(rr, dc).value = v || '—'; ws.getCell(rr, dc).font = yazi({ bold: true, size: 9 });
      if (col + genislik - 1 > dc) ws.mergeCells(rr, dc, rr, col + genislik - 1);
      ws.getCell(rr, dc).alignment = { wrapText: true, vertical: 'top' };
      rr++;
    }
  };
  bilgi(1, 4, 'Tur bilgileri', [
    ['Tur', t.baslik], ['Tarih', tarihAraligiTR(t)], ['Acente', t.acente || '—'], ['Grup', t.grup || '—'],
    ['Saat', t.saat ? `${t.saat}${t.bulusma ? ` · ${t.bulusma}` : ''}` : (t.bulusma || '—')],
  ]);
  bilgi(5, 3, 'Rehber', [['Ad Soyad', r.adSoyad], ['Telefon', r.telefon || '—'], ['E-posta', r.email || '—'], ['Ruhsat No', r.ruhsatNo || '—'], ['', '']]);

  let satirNo = 12;
  const kicker = (metin: string) => {
    const c = ws.getCell(satirNo, 1); c.value = metin.toLocaleUpperCase('tr-TR'); c.font = yazi({ bold: true, size: 8, color: PALET.kobalt });
    ws.getRow(satirNo).height = 18; satirNo++;
  };

  /* ─── Tablo ─── */
  const tablo = (satirlar: Satir[], toplamEtiketi: string): { ilk: number; son: number; toplamHucre: Partial<Record<ParaBirimi, string>> } => {
    const bas = ['#', 'Gün', 'Kategori', 'Açıklama', 'Fiş', 'Tutar', 'PB'];
    bas.forEach((b, i) => {
      const c = ws.getCell(satirNo, i + 1); c.value = b; c.fill = dolgu(PALET.kobalt); c.font = yazi({ bold: true, size: 8, color: PALET.beyaz });
      c.alignment = { vertical: 'middle', horizontal: i === 5 ? 'right' : 'left' }; c.border = KENARLAR;
    });
    ws.getRow(satirNo).height = 18; satirNo++;
    const ilk = satirNo;
    satirlar.forEach((s, i) => {
      const row = ws.getRow(satirNo);
      const fisMetni = s.tip === 'masraf' ? (s.fis ? 'Var' : '—') : '';
      const degerler: (string | number)[] = [s.sira, gunKisaTR(s.tarih), kategoriEtiket(s.kategori), s.aciklama || '—', fisMetni, s.tutar, s.para_birimi];
      degerler.forEach((v, j) => {
        const c = row.getCell(j + 1); c.value = v; c.border = KENARLAR;
        if (i % 2 === 0) c.fill = dolgu(PALET.kart);
        c.font = yazi({ size: 9, bold: j === 2 || j === 5, color: (j === 0 || j === 1) ? PALET.metinIkincil : j === 4 ? (s.fis ? PALET.acik : PALET.metinSoluk) : j === 6 ? PALET.metinSoluk : PALET.metin });
        c.alignment = { vertical: 'top', wrapText: j === 3, horizontal: j === 5 ? 'right' : 'left' };
        if (j === 5) c.numFmt = NUMFMT[s.para_birimi];
      });
      satirNo++;
    });
    if (satirlar.length === 0) {
      const c = ws.getCell(satirNo, 1); c.value = 'Kayıt yok'; c.font = yazi({ size: 9, color: PALET.metinSoluk }); ws.mergeCells(satirNo, 1, satirNo, SON); satirNo++;
    }
    const son = Math.max(ilk, satirNo - 1);
    const toplamHucre: Partial<Record<ParaBirimi, string>> = {};
    const pbler = (['TRY', 'EUR', 'USD'] as ParaBirimi[]).filter((pb) => satirlar.some((s) => s.para_birimi === pb));
    for (const pb of pbler) {
      ws.mergeCells(satirNo, 3, satirNo, 5);
      ws.getCell(satirNo, 3).value = `${toplamEtiketi} (${pb})`; ws.getCell(satirNo, 3).font = yazi({ size: 9, color: PALET.metinIkincil }); ws.getCell(satirNo, 3).alignment = { horizontal: 'right' };
      const c = ws.getCell(satirNo, 6);
      c.value = satirlar.length ? { formula: `SUMIF(G${ilk}:G${son},"${pb}",F${ilk}:F${son})` } : 0;
      c.numFmt = NUMFMT[pb]; c.font = yazi({ bold: true, size: 10, color: PALET.kobalt }); c.alignment = { horizontal: 'right' };
      toplamHucre[pb] = `F${satirNo}`;
      satirNo++;
    }
    satirNo++;
    return { ilk, son, toplamHucre };
  };

  kicker('Masraflar');
  const m = tablo(veri.masraflar, 'Masraf toplamı');
  let u: ReturnType<typeof tablo> | null = null;
  if (veri.ucretler.length) { kicker('Rehberlik ücreti'); u = tablo(veri.ucretler, 'Ücret toplamı'); }
  let a: ReturnType<typeof tablo> | null = null;
  if (veri.avanslar.length) { kicker('Avanslar'); a = tablo(veri.avanslar, 'Avans toplamı'); }

  /* ─── Özet ─── */
  if (veri.ozet.length) {
    kicker('Özet');
    // Lavanta zemin (C-G) + sol safran kalın çizgi (C sütunu sol kenarı)
    const ozetZemin = () => {
      for (let c = 3; c <= SON; c++) ws.getCell(satirNo, c).fill = dolgu(PALET.kart);
      ws.getCell(satirNo, 3).border = { left: { style: 'thick', color: { argb: argb(PALET.safran) } } };
    };
    for (const o of veri.ozet) {
      const satir = (etiket: string | ExcelJS.CellFormulaValue, deger: number | ExcelJS.CellFormulaValue, kalin = false, renk: string = PALET.metin, size = 10) => {
        ozetZemin();
        ws.getCell(satirNo, 3).value = etiket; ws.getCell(satirNo, 3).font = yazi({ size: 9, color: PALET.metinIkincil, bold: kalin });
        ws.mergeCells(satirNo, 3, satirNo, 5);
        const c = ws.getCell(satirNo, 6); c.value = deger; c.numFmt = NUMFMT[o.para_birimi]; c.font = yazi({ bold: kalin, size, color: renk }); c.alignment = { horizontal: 'right' };
        satirNo++;
      };
      ozetZemin();
      ws.getCell(satirNo, 3).value = `${PARA_AD[o.para_birimi]} (${o.para_birimi})`.toLocaleUpperCase('tr-TR');
      ws.getCell(satirNo, 3).font = yazi({ bold: true, size: 8, color: PALET.menekse }); satirNo++;
      const mRef = m.toplamHucre[o.para_birimi];
      const uRef = u?.toplamHucre[o.para_birimi];
      const aRef = a?.toplamHucre[o.para_birimi];
      const masrafDeger = mRef ? { formula: `${mRef}` } : 0;
      const ucretDeger = uRef ? { formula: `${uRef}` } : 0;
      const avansDeger = aRef ? { formula: `${aRef}` } : 0;
      const masrafSatir = satirNo; satir('Toplam masraf', masrafDeger);
      const ucretSatir = satirNo; satir('Rehberlik ücreti', ucretDeger);
      const avansSatir = satirNo; satir('Alınan avans', avansDeger);
      const kalanF = `F${masrafSatir}+F${ucretSatir}-F${avansSatir}`;
      satir(
        { formula: `IF(ROUND(${kalanF},2)>0,"Acenteden alınacak",IF(ROUND(${kalanF},2)<0,"Acenteye iade edilecek","Hesap kapandı"))` },
        { formula: `ABS(${kalanF})` }, true, o.kalan > 0 ? PALET.kobalt : o.kalan < 0 ? PALET.kapali : PALET.acik, 12,
      );
      ozetZemin(); ws.getRow(satirNo).height = 6; satirNo++;
    }
    satirNo++;
  }

  /* ─── Notlar ─── */
  if (t.notlar) {
    kicker('Notlar');
    const c = ws.getCell(satirNo, 1); c.value = t.notlar; c.font = yazi({ size: 9 }); c.alignment = { wrapText: true, vertical: 'top' };
    ws.mergeCells(satirNo, 1, satirNo, SON);
    ws.getRow(satirNo).height = Math.max(20, Math.ceil(t.notlar.length / 90) * 14 + 6);
    satirNo += 2;
  }

  ws.getCell(satirNo, 1).value = `Pusula İstanbul ile oluşturuldu · pusulaistanbul.app · ${damgaTR(veri.olusturma)}`;
  ws.getCell(satirNo, 1).font = yazi({ size: 7, color: PALET.metinSoluk });
  ws.mergeCells(satirNo, 1, satirNo, SON);

  /* ─── Fişler sayfası ─── */
  const fisli = veri.masraflar.filter((s) => s.fis);
  if (fisli.length) {
    const wf = wb.addWorksheet('Fişler', { views: [{ showGridLines: false }], pageSetup: { paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    wf.columns = [{ width: 60 }];
    wf.getCell(1, 1).fill = dolgu(PALET.kobalt);
    wf.getRow(1).height = 24;
    wf.getCell('A1').value = `FİŞLER VE FATURALAR (${fisli.length} adet) — ${t.baslik} · ${tarihAraligiTR(t)}`;
    wf.getCell('A1').font = yazi({ bold: true, size: 9, color: PALET.beyaz }); wf.getCell('A1').alignment = { vertical: 'middle' };
    let rr = 3;
    for (const s of fisli) {
      const c = wf.getCell(rr, 1);
      c.value = `#${s.sira} · ${kategoriEtiket(s.kategori)} · ${s.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${PARA_SEMBOL[s.para_birimi]}${s.aciklama ? ` — ${s.aciklama}` : ''}`;
      c.font = yazi({ bold: true, size: 9, color: PALET.kobalt }); rr++;
      const png = s.fis!.mime.includes('png');
      const { w, h } = gorselOlcu(s.fis!.bytes, png, 380, 480);
      const id = wb.addImage({ buffer: s.fis!.bytes as unknown as ExcelJS.Buffer, extension: png ? 'png' : 'jpeg' });
      const satirSayisi = Math.ceil(h / 20) + 1;
      wf.addImage(id, { tl: { col: 0, row: rr - 1 }, ext: { width: w, height: h } });
      rr += satirSayisi + 1;
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

/** JPEG/PNG piksel boyutunu okuyup kutuya sığdırır (px) */
function gorselOlcu(bytes: Uint8Array, png: boolean, maxW: number, maxH: number): { w: number; h: number } {
  let w = 0, h = 0;
  try {
    if (png) { const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); w = dv.getUint32(16); h = dv.getUint32(20); }
    else {
      let i = 2;
      while (i < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const m = bytes[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { h = (bytes[i + 5] << 8) | bytes[i + 6]; w = (bytes[i + 7] << 8) | bytes[i + 8]; break; }
        i += 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
      }
    }
  } catch { /* yoksay */ }
  if (!w || !h) return { w: maxW, h: maxH };
  const olcek = Math.min(maxW / w, maxH / h, 1);
  return { w: Math.round(w * olcek), h: Math.round(h * olcek) };
}
