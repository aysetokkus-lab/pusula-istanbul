// Pusula İstanbul — Masraf Pusulası PDF üretici (pdf-lib + Poppins alt kümesi), "Kobalt & Menekşe" (Eyl 2026)
// A4 dikey. Üst bant kobalt→menekşe gradyanı (dilimli), minik beyaz logo rozeti; lavanta bilgi kartları;
// masraf/ücret/avans tabloları (kobalt başlık, dönüşümlü lavanta satır, çok günlü turda GÜN sütunu); özet kartı (safran vurgu); fiş sayfaları 2×2.
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import type { Varliklar } from './varliklar.ts';
import {
  PALET, type Satir, type Veri, cokGunlu, damgaTR, gunKisaTR, hexToRgb, kalanEtiket, kategoriEtiket, paraTR, tarihAraligiTR, PARA_AD,
} from './ortak.ts';

const A4 = { w: 595.28, h: 841.89 };
const KENAR = 40;
const ICERIK_W = A4.w - KENAR * 2;
const BANT_H = 64;
const ALT_BOSLUK = 46;

const renk = (hex: string) => { const [r, g, b] = hexToRgb(hex); return rgb(r, g, b); };
const R = {
  kobalt: renk(PALET.kobalt), menekse: renk(PALET.menekse), safran: renk(PALET.safran),
  metin: renk(PALET.metin), ikincil: renk(PALET.metinIkincil), soluk: renk(PALET.metinSoluk),
  kart: renk(PALET.kart), border: renk(PALET.border), beyaz: rgb(1, 1, 1), acik: renk(PALET.acik), kapali: renk(PALET.kapali),
  kobaltTint: renk(PALET.kobaltTint), safranTint: renk(PALET.safranTint),
};

interface Fontlar { normal: PDFFont; yariKalin: PDFFont; kalin: PDFFont }

class Sayfalayici {
  doc: PDFDocument; sayfa!: PDFPage; y = 0; f: Fontlar; logo: PDFImage | null; veri: Veri; sayfaNo = 0;
  constructor(doc: PDFDocument, f: Fontlar, logo: PDFImage | null, veri: Veri) { this.doc = doc; this.f = f; this.logo = logo; this.veri = veri; }

  /** Yeni sayfa: ilkinde büyük bant, sonrakilerde ince bant */
  yeniSayfa(ilk = false) {
    this.sayfa = this.doc.addPage([A4.w, A4.h]);
    this.sayfaNo++;
    if (ilk) { this.bant(); this.y = A4.h - BANT_H - 22; }
    else { this.inceBant(); this.y = A4.h - 34; }
  }

  /** Kobalt→menekşe yatay gradyan (dilimli) */
  gradyan(x: number, y: number, w: number, h: number, dilim = 72) {
    const [r1, g1, b1] = hexToRgb(PALET.kobalt);
    const [r2, g2, b2] = hexToRgb(PALET.menekse);
    const dw = w / dilim;
    for (let i = 0; i < dilim; i++) {
      const t = i / (dilim - 1);
      this.sayfa.drawRectangle({ x: x + i * dw, y, width: dw + 0.6, height: h, color: rgb(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t) });
    }
  }

  bant() {
    const { sayfa, f, veri } = this;
    const top = A4.h;
    this.gradyan(0, top - BANT_H, A4.w, BANT_H);
    // Minik logo (beyaz windrose) — 22pt
    const L = 22;
    if (this.logo) sayfa.drawImage(this.logo, { x: KENAR, y: top - BANT_H / 2 - L / 2, width: L, height: L });
    // Marka kicker + başlık
    const bx = this.logo ? KENAR + L + 10 : KENAR;
    this.metin('PUSULA İSTANBUL', bx, top - 24, f.kalin, 7.5, R.beyaz, 1.2);
    this.metin('Masraf Pusulası', bx, top - 44, f.kalin, 17, R.beyaz, -0.2);
    // Sağ: tarih + rehber
    const tarih = tarihAraligiTR(veri.tur);
    this.metinSag(tarih, A4.w - KENAR, top - 26, f.yariKalin, 9.5, R.beyaz);
    this.metinSag(veri.rehber.adSoyad, A4.w - KENAR, top - 42, f.normal, 9, rgb(1, 1, 1));
  }

  inceBant() {
    this.gradyan(0, A4.h - 8, A4.w, 8, 48);
    this.metin('PUSULA İSTANBUL · MASRAF PUSULASI', KENAR, A4.h - 22, this.f.kalin, 7, R.soluk, 1);
    this.metinSag(`${tarihAraligiTR(this.veri.tur)} · ${this.veri.rehber.adSoyad}`, A4.w - KENAR, A4.h - 22, this.f.normal, 7.5, R.soluk);
  }

  altBilgi(toplam: number) {
    const sayfalar = this.doc.getPages();
    sayfalar.forEach((sy, i) => {
      sy.drawLine({ start: { x: KENAR, y: 30 }, end: { x: A4.w - KENAR, y: 30 }, thickness: 0.6, color: R.border });
      const sol = `Pusula İstanbul ile oluşturuldu · pusulaistanbul.app · ${damgaTR(this.veri.olusturma)}`;
      sy.drawText(sol, { x: KENAR, y: 18, size: 7, font: this.f.normal, color: R.soluk });
      const sag = `Sayfa ${i + 1} / ${toplam}`;
      const w = this.f.normal.widthOfTextAtSize(sag, 7);
      sy.drawText(sag, { x: A4.w - KENAR - w, y: 18, size: 7, font: this.f.normal, color: R.soluk });
    });
  }

  /** Yeterli yer yoksa yeni sayfa aç */
  yerAc(h: number) { if (this.y - h < ALT_BOSLUK) this.yeniSayfa(false); }

  metin(s: string, x: number, y: number, font: PDFFont, size: number, color = R.metin, letterSpacing?: number) {
    if (letterSpacing) {
      // pdf-lib harf aralığı desteklemez → harf harf çiz
      let cx = x;
      for (const ch of s) { this.sayfa.drawText(ch, { x: cx, y, size, font, color }); cx += font.widthOfTextAtSize(ch, size) + letterSpacing; }
      return;
    }
    this.sayfa.drawText(s, { x, y, size, font, color });
  }
  metinSag(s: string, xSag: number, y: number, font: PDFFont, size: number, color = R.metin) {
    this.sayfa.drawText(s, { x: xSag - font.widthOfTextAtSize(s, size), y, size, font, color });
  }

  /** Sığmayan metni "…" ile kırp */
  kirp(s: string, font: PDFFont, size: number, maxW: number): string {
    if (font.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && font.widthOfTextAtSize(out + '…', size) > maxW) out = out.slice(0, -1);
    return out.trimEnd() + '…';
  }

  /** Kelime sarma */
  sar(s: string, font: PDFFont, size: number, maxW: number): string[] {
    const satirlar: string[] = [];
    for (const paragraf of s.split(/\r?\n/)) {
      const kelimeler = paragraf.split(/\s+/).filter(Boolean);
      let cur = '';
      for (const k of kelimeler) {
        const deneme = cur ? `${cur} ${k}` : k;
        if (font.widthOfTextAtSize(deneme, size) <= maxW) cur = deneme;
        else {
          if (cur) satirlar.push(cur);
          // Tek kelime sığmıyorsa karakter bazlı böl
          if (font.widthOfTextAtSize(k, size) > maxW) {
            let parca = '';
            for (const ch of k) {
              if (font.widthOfTextAtSize(parca + ch, size) > maxW) { satirlar.push(parca); parca = ch; } else parca += ch;
            }
            cur = parca;
          } else cur = k;
        }
      }
      satirlar.push(cur);
    }
    return satirlar.length ? satirlar : [''];
  }

  kicker(s: string, color = R.kobalt) {
    this.yerAc(26);
    this.metin(s.toLocaleUpperCase('tr-TR'), KENAR, this.y - 8, this.f.kalin, 8, color, 1);
    this.y -= 22;
  }

  /** Lavanta kart: etiket/değer satırları; iki sütun yan yana çizilebilir */
  bilgiKarti(x: number, w: number, baslik: string, satirlar: [string, string][], yTop: number): number {
    const f = this.f; const pad = 12; const satirH = 15;
    const icW = w - pad * 2;
    // Değer sarmaları
    const hazir = satirlar.map(([e, v]) => [e, this.sar(v || '—', f.yariKalin, 9, icW - 66)] as [string, string[]]);
    const h = pad * 2 + 16 + hazir.reduce((a, [, l]) => a + Math.max(1, l.length) * satirH, 0);
    this.sayfa.drawRectangle({ x, y: yTop - h, width: w, height: h, color: R.kart, borderColor: R.border, borderWidth: 0.8 });
    this.metin(baslik.toLocaleUpperCase('tr-TR'), x + pad, yTop - pad - 7, f.kalin, 7.5, R.kobalt, 1);
    let y = yTop - pad - 24;
    for (const [etiket, satirlarV] of hazir) {
      this.metin(etiket, x + pad, y, f.normal, 8.5, R.ikincil);
      for (const l of satirlarV) { this.metin(l, x + pad + 66, y, f.yariKalin, 9, R.metin); y -= satirH; }
    }
    return h;
  }

  /** Tablo: [#, (Gün), Kategori, Açıklama, (Fiş), Tutar] */
  tablo(baslik: string, satirlar: Satir[], toplamEtiketi: string, gunluMu = false, fisliMi = true) {
    const f = this.f;
    const gunW = gunluMu ? 44 : 0;
    const fisW = fisliMi ? 34 : 0;
    const kol = { no: 22, gun: gunW, kat: 96, acik: ICERIK_W - 22 - gunW - 96 - fisW - 92, fis: fisW, tutar: 92 };
    const xNo = KENAR, xGun = xNo + kol.no, xKat = xGun + kol.gun, xAcik = xKat + kol.kat, xFis = xAcik + kol.acik, xTutar = xFis + kol.fis;
    this.kicker(baslik);
    const baslikCiz = () => {
      this.yerAc(22);
      this.sayfa.drawRectangle({ x: KENAR, y: this.y - 18, width: ICERIK_W, height: 18, color: R.kobalt });
      const ty = this.y - 12.5;
      this.metin('#', xNo + 6, ty, f.kalin, 7.5, R.beyaz);
      if (gunluMu) this.metin('GÜN', xGun + 6, ty, f.kalin, 7.5, R.beyaz);
      this.metin('KATEGORİ', xKat + 6, ty, f.kalin, 7.5, R.beyaz);
      this.metin('AÇIKLAMA', xAcik + 6, ty, f.kalin, 7.5, R.beyaz);
      if (fisliMi) this.metin('FİŞ', xFis + 6, ty, f.kalin, 7.5, R.beyaz);
      this.metinSag('TUTAR', xTutar + kol.tutar - 6, ty, f.kalin, 7.5, R.beyaz);
      this.y -= 18;
    };
    baslikCiz();
    satirlar.forEach((s, i) => {
      const acikSatirlar = this.sar(s.aciklama || '—', f.normal, 8.5, kol.acik - 12);
      const h = Math.max(18, 8 + acikSatirlar.length * 11);
      if (this.y - h < ALT_BOSLUK) { this.yeniSayfa(false); baslikCiz(); }
      if (i % 2 === 0) this.sayfa.drawRectangle({ x: KENAR, y: this.y - h, width: ICERIK_W, height: h, color: R.kart });
      this.sayfa.drawLine({ start: { x: KENAR, y: this.y - h }, end: { x: KENAR + ICERIK_W, y: this.y - h }, thickness: 0.5, color: R.border });
      const ty = this.y - 12.5;
      this.metin(String(s.sira), xNo + 6, ty, f.normal, 8.5, R.ikincil);
      if (gunluMu) this.metin(gunKisaTR(s.tarih), xGun + 6, ty, f.normal, 8, R.ikincil);
      this.metin(kategoriEtiket(s.kategori), xKat + 6, ty, f.yariKalin, 8.5, R.metin);
      acikSatirlar.forEach((l, j) => this.metin(l, xAcik + 6, ty - j * 11, f.normal, 8.5, R.metin));
      if (fisliMi) this.metin(s.fis ? 'Var' : '—', xFis + 6, ty, f.normal, 8, s.fis ? R.acik : R.soluk);
      this.metinSag(paraTR(s.tutar, s.para_birimi), xTutar + kol.tutar - 6, ty, f.yariKalin, 9, R.metin);
      this.y -= h;
    });
    if (satirlar.length === 0) {
      this.yerAc(18);
      this.metin('Kayıt yok', KENAR + 6, this.y - 12.5, f.normal, 8.5, R.soluk);
      this.y -= 18;
    }
    // Para birimi bazlı ara toplamlar
    const toplamlar = new Map<string, number>();
    for (const s of satirlar) toplamlar.set(s.para_birimi, (toplamlar.get(s.para_birimi) ?? 0) + s.tutar);
    for (const [pb, t] of toplamlar) {
      this.yerAc(18);
      this.metinSag(`${toplamEtiketi} (${pb})`, xTutar - 8, this.y - 12.5, f.normal, 8.5, R.ikincil);
      this.metinSag(paraTR(t, pb as Satir['para_birimi']), xTutar + kol.tutar - 6, this.y - 12.5, f.kalin, 9.5, R.kobalt);
      this.y -= 18;
    }
    this.y -= 10;
  }

  ozetKarti() {
    const f = this.f; const v = this.veri;
    if (v.ozet.length === 0) return;
    const satirH = 15; const pad = 14;
    const h = pad * 2 + 18 + v.ozet.length * (satirH * 4 + 10);
    this.yerAc(h + 26);
    this.kicker('Özet');
    const yTop = this.y;
    this.sayfa.drawRectangle({ x: KENAR, y: yTop - h, width: ICERIK_W, height: h, color: R.kart, borderColor: R.border, borderWidth: 0.8 });
    this.sayfa.drawRectangle({ x: KENAR, y: yTop - h, width: 5, height: h, color: R.safran });
    let y = yTop - pad - 6;
    for (const o of v.ozet) {
      this.metin(`${PARA_AD[o.para_birimi]} (${o.para_birimi})`, KENAR + pad + 6, y, f.kalin, 8, R.menekse, 0.6);
      y -= satirH + 2;
      const cift: [string, string, PDFFont, ReturnType<typeof rgb>][] = [
        ['Toplam masraf', paraTR(o.masraf, o.para_birimi), f.yariKalin, R.metin],
        ['Rehberlik ücreti', paraTR(o.ucret, o.para_birimi), f.yariKalin, R.metin],
        ['Alınan avans', paraTR(o.avans, o.para_birimi), f.yariKalin, R.metin],
        [kalanEtiket(o), paraTR(Math.abs(o.kalan), o.para_birimi), f.kalin, o.kalan > 0 ? R.kobalt : o.kalan < 0 ? R.kapali : R.acik],
      ];
      for (const [e, d, font, c] of cift) {
        this.metin(e, KENAR + pad + 6, y, f.normal, 9, R.ikincil);
        this.metinSag(d, KENAR + ICERIK_W - pad, y, font, font === f.kalin ? 11 : 9.5, c);
        y -= satirH;
      }
      y -= 8;
    }
    this.y = yTop - h - 14;
  }

  paragraf(baslik: string, metin: string) {
    const satirlar = this.sar(metin, this.f.normal, 9, ICERIK_W - 24);
    const h = 20 + satirlar.length * 13;
    this.yerAc(h + 26);
    this.kicker(baslik);
    this.sayfa.drawRectangle({ x: KENAR, y: this.y - h, width: ICERIK_W, height: h, color: R.kart, borderColor: R.border, borderWidth: 0.8 });
    let y = this.y - 14;
    for (const l of satirlar) { this.metin(l, KENAR + 12, y, this.f.normal, 9, R.metin); y -= 13; }
    this.y -= h + 12;
  }

  async fisSayfalari(satirlar: Satir[]) {
    const fisli = satirlar.filter((s) => s.fis);
    if (fisli.length === 0) return;
    const bosluk = 12; const kutuW = (ICERIK_W - bosluk) / 2; const kutuH = 300;
    let i = 0;
    while (i < fisli.length) {
      this.yeniSayfa(false);
      this.kicker(`Fişler ve faturalar (${fisli.length} adet)`);
      for (let satir = 0; satir < 2 && i < fisli.length; satir++) {
        const yTop = this.y;
        for (let kolon = 0; kolon < 2 && i < fisli.length; kolon++) {
          const s = fisli[i++];
          const x = KENAR + kolon * (kutuW + bosluk);
          this.sayfa.drawRectangle({ x, y: yTop - kutuH, width: kutuW, height: kutuH, color: R.kart, borderColor: R.border, borderWidth: 0.8 });
          this.metin(`#${s.sira} · ${kategoriEtiket(s.kategori)} · ${paraTR(s.tutar, s.para_birimi)}`, x + 8, yTop - 14, this.f.yariKalin, 8, R.kobalt);
          if (s.aciklama) this.metin(this.kirp(s.aciklama, this.f.normal, 7.5, kutuW - 16), x + 8, yTop - 25, this.f.normal, 7.5, R.ikincil);
          try {
            const img = s.fis!.mime.includes('png') ? await this.doc.embedPng(s.fis!.bytes) : await this.doc.embedJpg(s.fis!.bytes);
            const maxW = kutuW - 16, maxH = kutuH - 42;
            const olcek = Math.min(maxW / img.width, maxH / img.height);
            const w = img.width * olcek, h = img.height * olcek;
            this.sayfa.drawImage(img, { x: x + (kutuW - w) / 2, y: yTop - 34 - maxH + (maxH - h) / 2, width: w, height: h });
          } catch {
            this.metin('Görsel okunamadı', x + 8, yTop - kutuH / 2, this.f.normal, 8, R.soluk);
          }
        }
        this.y = yTop - kutuH - bosluk;
      }
    }
  }
}

export async function pdfUret(veri: Veri, v: Varliklar): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Masraf Pusulası — ${veri.tur.baslik} — ${veri.tur.tarih}`);
  doc.setAuthor(veri.rehber.adSoyad);
  doc.setCreator('Pusula İstanbul');
  doc.setProducer('Pusula İstanbul · pusulaistanbul.app');
  doc.setLanguage('tr-TR');
  const f: Fontlar = {
    normal: await doc.embedFont(v.regular, { subset: true }),
    yariKalin: await doc.embedFont(v.semibold, { subset: true }),
    kalin: await doc.embedFont(v.bold, { subset: true }),
  };
  let logo: PDFImage | null = null;
  if (v.logoBeyaz) { try { logo = await doc.embedPng(v.logoBeyaz); } catch { logo = null; } }
  const S = new Sayfalayici(doc, f, logo, veri);
  S.yeniSayfa(true);

  // Bilgi kartları (yan yana)
  const yTop = S.y;
  const w = (ICERIK_W - 12) / 2;
  const t = veri.tur; const r = veri.rehber;
  const h1 = S.bilgiKarti(KENAR, w, 'Tur bilgileri', [
    ['Tur', t.baslik], ['Tarih', tarihAraligiTR(t)], ['Acente', t.acente || '—'], ['Grup', t.grup || '—'],
    ['Saat', t.saat ? `${t.saat}${t.bulusma ? ` · ${t.bulusma}` : ''}` : (t.bulusma || '—')],
  ], yTop);
  const h2 = S.bilgiKarti(KENAR + w + 12, w, 'Rehber', [
    ['Ad Soyad', r.adSoyad], ['Telefon', r.telefon || '—'], ['E-posta', r.email || '—'], ['Ruhsat No', r.ruhsatNo || '—'],
  ], yTop);
  S.y = yTop - Math.max(h1, h2) - 18;

  const gunlu = cokGunlu(t);
  S.tablo('Masraflar', veri.masraflar, 'Masraf toplamı', gunlu, true);
  if (veri.ucretler.length) S.tablo('Rehberlik ücreti', veri.ucretler, 'Ücret toplamı', gunlu, false);
  if (veri.avanslar.length) S.tablo('Avanslar', veri.avanslar, 'Avans toplamı', gunlu, false);
  S.ozetKarti();
  if (t.notlar) S.paragraf('Notlar', t.notlar);
  await S.fisSayfalari(veri.masraflar);
  S.altBilgi(doc.getPageCount());
  return await doc.save();
}
