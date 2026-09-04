// Eyl 2026 — Masraf Pusulası dışa aktarma (istemci tarafı).
// Edge Function `masraf-disa-aktar` PDF/Word/Excel'i sunucuda üretir (logolu, Kobalt & Menekşe) → base64 döner;
// burada önbelleğe yazılır; üç eylem (Ayşe kararı, Pusula/Resend göndermez): (a) MAIL GÖNDER — telefonun mail uygulaması ekli açılır,
// (b) WHATSAPP İLE GÖNDER — paylaşım sayfası (WhatsApp seçilir; wa.me metni), (c) TELEFONA KAYDET — Android: Storage Access Framework
// (klasör seç → yaz), iOS: Dosyalar'a kaydet sayfası. Web (Chrome inceleme): dosyalar indirilir; mailto / wa.me açılır.
// Dosyalar cacheDirectory/masraf-pusulasi/ altında tutulur.
import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';
import { paraTR } from '../constants/masraf';
import { kalanEtiket, type OzetSatiri } from '../hooks/use-masraflar';

export type DisaAktarFormat = 'pdf' | 'docx' | 'xlsx';

export const FORMATLAR: { id: DisaAktarFormat; baslik: string }[] = [
  { id: 'pdf', baslik: 'PDF' },
  { id: 'docx', baslik: 'Word' },
  { id: 'xlsx', baslik: 'Excel' },
];

export interface UretilenDosya { ad: string; mime: string; uri: string; format: DisaAktarFormat; base64: string }

export interface UretimSonucu {
  dosyalar: UretilenDosya[];
  ozet: OzetSatiri[];
  acenteEmail: string | null;
  konu: string;
}

const KLASOR = `${FileSystem.cacheDirectory ?? ''}masraf-pusulasi/`;

const UTI: Record<DisaAktarFormat, string> = {
  pdf: 'com.adobe.pdf',
  docx: 'org.openxmlformats.wordprocessingml.document',
  xlsx: 'org.openxmlformats.spreadsheetml.sheet',
};

/** Sunucuda üret, önbelleğe yaz */
export async function masrafDosyalariniUret(turId: string, formatlar: DisaAktarFormat[]): Promise<UretimSonucu> {
  if (formatlar.length === 0) throw new Error('En az bir format seçin');
  const { data, error } = await supabase.functions.invoke('masraf-disa-aktar', { body: { tur_id: turId, formatlar } });
  if (error) {
    // FunctionsHttpError: sunucunun JSON mesajını çıkarmaya çalış
    let mesaj = error.message || 'Dosya üretilemedi';
    try { const j = await (error as any).context?.json?.(); if (j?.hata) mesaj = j.hata; } catch { /* yoksay */ }
    throw new Error(mesaj);
  }
  if (!data?.dosyalar?.length) throw new Error(data?.hata || 'Dosya üretilemedi');

  const dosyalar: UretilenDosya[] = [];
  if (Platform.OS === 'web') {
    // Web (Chrome ile inceleme): blob URL üretilir; indirme eylem anında yapılır (dosyalariIndir)
    for (const d of data.dosyalar as { ad: string; mime: string; base64: string }[]) {
      const bin = atob(d.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const uri = URL.createObjectURL(new Blob([bytes], { type: d.mime }));
      dosyalar.push({ ad: d.ad, mime: d.mime, uri, format: (d.ad.split('.').pop() ?? 'pdf') as DisaAktarFormat, base64: d.base64 });
    }
  } else {
    await FileSystem.makeDirectoryAsync(KLASOR, { intermediates: true }).catch(() => undefined);
    for (const d of data.dosyalar as { ad: string; mime: string; base64: string }[]) {
      const uri = `${KLASOR}${d.ad}`;
      await FileSystem.writeAsStringAsync(uri, d.base64, { encoding: FileSystem.EncodingType.Base64 });
      const format = (d.ad.split('.').pop() ?? 'pdf') as DisaAktarFormat;
      dosyalar.push({ ad: d.ad, mime: d.mime, uri, format, base64: d.base64 });
    }
  }
  return { dosyalar, ozet: data.ozet ?? [], acenteEmail: data.acente_email ?? null, konu: data.konu ?? 'Masraf Pusulası' };
}

/** Web: tarayıcı indirmesi (birden fazla dosyada Chrome "çoklu indirme" izni isteyebilir) */
export function dosyalariIndir(dosyalar: UretilenDosya[]): void {
  if (Platform.OS !== 'web') return;
  dosyalar.forEach((d, i) => {
    setTimeout(() => {
      const a = document.createElement('a'); a.href = d.uri; a.download = d.ad; document.body.appendChild(a); a.click(); a.remove();
    }, i * 400);
  });
}

/** Mail / WhatsApp gövdesi (düz metin): özet + REHBERİN imzası (Ayşe: gönderen Pusula değil, kullanıcının kendisi; Pusula satırı yok) */
export function mailGovdesi(o: { turBaslik: string; tarihUzun: string; rehberAdi: string; rehberTelefon?: string | null; ozet: OzetSatiri[] }): string {
  const satirlar = [
    'Merhaba,',
    '',
    `${o.tarihUzun} tarihli "${o.turBaslik}" turunun masraf pusulası ektedir.`,
    '',
  ];
  for (const s of o.ozet) {
    satirlar.push(`${s.para_birimi}: Masraf ${paraTR(s.masraf, s.para_birimi)}${s.ucret ? ` · Rehberlik ücreti ${paraTR(s.ucret, s.para_birimi)}` : ''} · Avans ${paraTR(s.avans, s.para_birimi)} · ${kalanEtiket(s)} ${paraTR(Math.abs(s.kalan), s.para_birimi)}`);
  }
  if (o.ozet.length) satirlar.push('');
  satirlar.push('İyi çalışmalar,', o.rehberAdi.trim() || 'Rehberiniz');
  if (o.rehberTelefon) satirlar.push(o.rehberTelefon);
  return satirlar.join('\n');
}

/** Telefonun mail uygulamasını ekli açar. Dönüş: 'sent' | 'saved' | 'cancelled' | 'undetermined' | 'unavailable' */
export async function mailUygulamasiniAc(o: { alici: string | null; konu: string; govde: string; dosyalar: UretilenDosya[] }): Promise<string> {
  if (Platform.OS === 'web') {
    // Tarayıcıda e-postaya ek eklenemez: dosyalar indirilir, varsayılan mail uygulaması mailto ile açılır (konu + gövde)
    dosyalariIndir(o.dosyalar);
    const mailto = `mailto:${o.alici ?? ''}?subject=${encodeURIComponent(o.konu)}&body=${encodeURIComponent(o.govde + '\n\n(Ekler: indirilen dosyaları e-postaya ekleyin.)')}`;
    setTimeout(() => { window.location.href = mailto; }, o.dosyalar.length * 400 + 200);
    return 'web';
  }
  try {
    if (!(await MailComposer.isAvailableAsync())) return 'unavailable';
    const r = await MailComposer.composeAsync({
      recipients: o.alici ? [o.alici] : [],
      subject: o.konu,
      body: o.govde,
      attachments: o.dosyalar.map(d => d.uri),
    });
    return r.status;
  } catch {
    // Android: isAvailableAsync hep true; mail uygulaması yoksa composeAsync reddeder
    return 'unavailable';
  }
}

/** Sistem paylaşım sayfası — dosyalar sırayla (expo-sharing tek dosya paylaşır) */
export async function paylas(dosyalar: UretilenDosya[], baslik?: string): Promise<boolean> {
  if (Platform.OS === 'web') { dosyalariIndir(dosyalar); return true; }
  if (!(await Sharing.isAvailableAsync())) return false;
  for (const d of dosyalar) {
    await Sharing.shareAsync(d.uri, { mimeType: d.mime, dialogTitle: baslik ?? d.ad, UTI: Platform.OS === 'ios' ? UTI[d.format] : undefined });
  }
  return true;
}

/** WHATSAPP İLE GÖNDER — telefonda paylaşım sayfası açılır (WhatsApp'ı seçersin; dosya ek olarak gider).
 *  Dönüş: 'ok' | 'nowhatsapp' (yüklü değil ama sayfa yine açıldı) | 'unavailable' */
export async function whatsappIleGonder(dosyalar: UretilenDosya[], metin: string): Promise<'ok' | 'nowhatsapp' | 'unavailable'> {
  if (Platform.OS === 'web') {
    dosyalariIndir(dosyalar);
    setTimeout(() => { window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, '_blank'); }, dosyalar.length * 400 + 200);
    return 'ok';
  }
  let yuklu = true;
  try { yuklu = await Linking.canOpenURL('whatsapp://send?text=x'); } catch { yuklu = false; }
  const ok = await paylas(dosyalar, 'WhatsApp ile gönder');
  if (!ok) return 'unavailable';
  return yuklu ? 'ok' : 'nowhatsapp';
}

/** TELEFONA KAYDET — Android: klasör seç (Storage Access Framework) ve yaz; iOS: "Dosyalara Kaydet" sayfası; web: indir.
 *  Dönüş: 'saved' | 'cancelled' | 'unavailable' */
export async function telefonaKaydet(dosyalar: UretilenDosya[]): Promise<'saved' | 'cancelled' | 'unavailable'> {
  if (Platform.OS === 'web') { dosyalariIndir(dosyalar); return 'saved'; }
  if (Platform.OS === 'android') {
    const SAF = FileSystem.StorageAccessFramework;
    const izin = await SAF.requestDirectoryPermissionsAsync();
    if (!izin.granted) return 'cancelled';
    for (const d of dosyalar) {
      const adUzantisiz = d.ad.replace(/\.[^.]+$/, '');
      const hedef = await SAF.createFileAsync(izin.directoryUri, adUzantisiz, d.mime);
      await FileSystem.writeAsStringAsync(hedef, d.base64, { encoding: FileSystem.EncodingType.Base64 });
    }
    return 'saved';
  }
  // iOS: paylaşım sayfasında "Dosyalara Kaydet"
  const ok = await paylas(dosyalar, 'Dosyalara kaydet');
  return ok ? 'saved' : 'unavailable';
}
