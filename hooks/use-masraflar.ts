// Eyl 2026 — Masraf Pusulası: bir turun masraf + avans satırları (`masraflar`, RLS yalnızca kendi).
// Fiş fotoğrafları ÖZEL bucket `masraf-fisler` (<uid>/<tur_id>/<dosya>): yükleme + imzalı URL ile önizleme + silme.
// Özet: para birimi bazında masraf − avans = kalan (>0 acenteden alınacak, <0 acenteye iade).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { uyar } from '../lib/uyari';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import type { MasrafKategori, ParaBirimi } from '../constants/masraf';

export type MasrafTip = 'masraf' | 'avans' | 'ucret';   // ucret = rehberlik ücreti (acenteden alınacak)

export interface Masraf {
  id: string;
  tur_id: string;
  kullanici_id: string;
  tip: MasrafTip;
  kategori: MasrafKategori | 'avans' | 'ucret';
  tarih: string | null;         // satırın günü (çok günlü turda); null = tur başlangıcı
  aciklama: string | null;
  tutar: number;
  para_birimi: ParaBirimi;
  fis_path: string | null;
  sira: number;
  created_at: string;
}

export interface MasrafPayload {
  tip: MasrafTip;
  kategori: MasrafKategori | 'avans' | 'ucret';
  tarih?: string | null;
  aciklama?: string | null;
  tutar: number;
  para_birimi: ParaBirimi;
  fis?: SecilenFis | null;      // yeni fiş (yüklenir)
  fisKaldir?: boolean;          // güncellemede mevcut fişi sil
}

export interface SecilenFis { uri: string; mime: string }

export interface OzetSatiri { para_birimi: ParaBirimi; masraf: number; ucret: number; avans: number; kalan: number }   // kalan = masraf + ucret − avans

export interface MasrafSonuc { ok: boolean; hata?: string }

const SECIM = 'id, tur_id, kullanici_id, tip, kategori, tarih, aciklama, tutar, para_birimi, fis_path, sira, created_at';
const BUCKET = 'masraf-fisler';

function normalize(r: any): Masraf {
  return { ...r, tutar: Number(r.tutar) || 0, sira: Number(r.sira) || 0 };
}

export function ozetHesapla(satirlar: Masraf[]): OzetSatiri[] {
  const m = new Map<ParaBirimi, OzetSatiri>();
  for (const s of satirlar) {
    let o = m.get(s.para_birimi);
    if (!o) { o = { para_birimi: s.para_birimi, masraf: 0, ucret: 0, avans: 0, kalan: 0 }; m.set(s.para_birimi, o); }
    if (s.tip === 'avans') o.avans += s.tutar; else if (s.tip === 'ucret') o.ucret += s.tutar; else o.masraf += s.tutar;
  }
  const sira: ParaBirimi[] = ['TRY', 'EUR', 'USD'];
  return sira.filter(pb => m.has(pb)).map(pb => { const o = m.get(pb)!; o.kalan = Math.round((o.masraf + o.ucret - o.avans) * 100) / 100; return o; });
}

export function kalanEtiket(o: OzetSatiri): string {
  if (Math.abs(o.kalan) < 0.005) return 'Hesap kapandı';
  return o.kalan > 0 ? 'Acenteden alınacak' : 'Acenteye iade';
}

/** Kamera / galeri ile fiş seç (Alert menüsü) */
export async function fisSec(): Promise<SecilenFis | null> {
  return new Promise(resolve => {
    const galeri = async () => {
      try {
        const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!izin.granted) { uyar('İzin Gerekli', 'Fiş seçebilmek için galeri erişimi gerekli.'); return resolve(null); }
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: false, exif: false });
        if (r.canceled || !r.assets?.length) return resolve(null);
        resolve({ uri: r.assets[0].uri, mime: r.assets[0].mimeType || 'image/jpeg' });
      } catch (e: any) { uyar('Hata', e?.message || 'Fiş seçilemedi.'); resolve(null); }
    };
    const kamera = async () => {
      try {
        const izin = await ImagePicker.requestCameraPermissionsAsync();
        if (!izin.granted) { uyar('İzin Gerekli', 'Fiş çekebilmek için kamera erişimi gerekli.'); return resolve(null); }
        const r = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false, exif: false });
        if (r.canceled || !r.assets?.length) return resolve(null);
        resolve({ uri: r.assets[0].uri, mime: r.assets[0].mimeType || 'image/jpeg' });
      } catch (e: any) { uyar('Hata', e?.message || 'Fiş çekilemedi.'); resolve(null); }
    };
    if (Platform.OS === 'web') { galeri(); return; }   // web'de Alert çalışmaz → doğrudan dosya seçici
    Alert.alert('Fiş / Fatura Ekle', 'Fotoğrafı nereden alalım?', [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(null) },
      { text: 'Kamera', onPress: kamera },
      { text: 'Galeri', onPress: galeri },
    ]);
  });
}

async function fisYukle(uid: string, turId: string, fis: SecilenFis): Promise<string | null> {
  try {
    const res = await fetch(fis.uri);
    const blob = await res.blob();
    const buf = await new Response(blob).arrayBuffer();
    if (buf.byteLength > 8 * 1024 * 1024) { uyar('Fiş çok büyük', 'En fazla 8 MB.'); return null; }
    // HEIC vb. → Edge Function yalnızca jpeg/png gömer; picker quality<1 ile çoğunlukla jpeg üretir
    const mime = /png/.test(fis.mime) ? 'image/png' : 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const path = `${uid}/${turId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: mime, upsert: false });
    if (error) throw error;
    return path;
  } catch (e: any) {
    console.warn('[Masraf] fiş yükleme hatası:', e?.message);
    uyar('Fiş yüklenemedi', e?.message || 'Bağlantıyı kontrol edin.');
    return null;
  }
}

async function fisSilStorage(path: string | null) {
  if (!path) return;
  try { await supabase.storage.from(BUCKET).remove([path]); } catch { /* sessiz */ }
}

/** Fiş önizlemesi için kısa ömürlü imzalı URL (özel bucket) */
export async function fisUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch { return null; }
}

export function useMasraflar(turId: string | undefined) {
  const [satirlar, setSatirlar] = useState<Masraf[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);

  const uidAl = useCallback(async () => {
    if (uidRef.current) return uidRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    uidRef.current = user?.id ?? null;
    return uidRef.current;
  }, []);

  const yukle = useCallback(async () => {
    if (!turId) { setSatirlar([]); setYukleniyor(false); return; }
    setYukleniyor(true);
    try {
      const { data, error } = await supabase
        .from('masraflar').select(SECIM).eq('tur_id', turId)
        .order('tarih', { ascending: true, nullsFirst: true }).order('sira', { ascending: true }).order('created_at', { ascending: true });
      if (error) { setHata(error.message); return; }
      setSatirlar((data ?? []).map(normalize));
      setHata(null);
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setYukleniyor(false);
    }
  }, [turId]);

  useEffect(() => { yukle(); }, [yukle]);

  const ekle = useCallback(async (p: MasrafPayload): Promise<MasrafSonuc> => {
    if (!turId) return { ok: false, hata: 'Tur yok' };
    const uid = await uidAl();
    if (!uid) return { ok: false, hata: 'Giriş yapmalısınız' };
    let fis_path: string | null = null;
    if (p.fis) {
      fis_path = await fisYukle(uid, turId, p.fis);
      if (!fis_path) return { ok: false, hata: 'Fiş yüklenemedi' };
    }
    const sira = satirlar.filter(s => s.tip === p.tip).reduce((m, s) => Math.max(m, s.sira), 0) + 1;
    const { data, error } = await supabase
      .from('masraflar')
      .insert({
        tur_id: turId, kullanici_id: uid, tip: p.tip, kategori: p.tip === 'masraf' ? p.kategori : p.tip, tarih: p.tarih ?? null,
        aciklama: (p.aciklama ?? '').trim() || null, tutar: p.tutar, para_birimi: p.para_birimi, fis_path, sira,
      })
      .select(SECIM).single();
    if (error || !data) { await fisSilStorage(fis_path); return { ok: false, hata: error?.message ?? 'Kaydedilemedi' }; }
    setSatirlar(prev => [...prev, normalize(data)]);
    return { ok: true };
  }, [turId, uidAl, satirlar]);

  const guncelle = useCallback(async (id: string, p: MasrafPayload): Promise<MasrafSonuc> => {
    const mevcut = satirlar.find(s => s.id === id);
    if (!mevcut || !turId) return { ok: false, hata: 'Satır yok' };
    const uid = await uidAl();
    if (!uid) return { ok: false, hata: 'Giriş yapmalısınız' };
    let fis_path = mevcut.fis_path;
    let eskiFis: string | null = null;
    if (p.fis) {
      const yeni = await fisYukle(uid, turId, p.fis);
      if (!yeni) return { ok: false, hata: 'Fiş yüklenemedi' };
      eskiFis = mevcut.fis_path; fis_path = yeni;
    } else if (p.fisKaldir) {
      eskiFis = mevcut.fis_path; fis_path = null;
    }
    const { data, error } = await supabase
      .from('masraflar')
      .update({
        tip: p.tip, kategori: p.tip === 'masraf' ? p.kategori : p.tip, tarih: p.tarih ?? null, aciklama: (p.aciklama ?? '').trim() || null,
        tutar: p.tutar, para_birimi: p.para_birimi, fis_path,
      })
      .eq('id', id).select(SECIM).single();
    if (error || !data) { if (p.fis && fis_path) await fisSilStorage(fis_path); return { ok: false, hata: error?.message ?? 'Güncellenemedi' }; }
    await fisSilStorage(eskiFis);
    setSatirlar(prev => prev.map(s => (s.id === id ? normalize(data) : s)));
    return { ok: true };
  }, [satirlar, turId, uidAl]);

  const sil = useCallback(async (id: string): Promise<MasrafSonuc> => {
    const mevcut = satirlar.find(s => s.id === id);
    const { data, error } = await supabase.from('masraflar').delete().eq('id', id).select('id');
    if (error) return { ok: false, hata: error.message };
    if (!data || data.length === 0) return { ok: false, hata: 'Silinemedi (yetki)' };
    await fisSilStorage(mevcut?.fis_path ?? null);
    setSatirlar(prev => prev.filter(s => s.id !== id));
    return { ok: true };
  }, [satirlar]);

  const masraflar = useMemo(() => satirlar.filter(s => s.tip === 'masraf'), [satirlar]);
  const avanslar = useMemo(() => satirlar.filter(s => s.tip === 'avans'), [satirlar]);
  const ucretler = useMemo(() => satirlar.filter(s => s.tip === 'ucret'), [satirlar]);
  const ozet = useMemo(() => ozetHesapla(satirlar), [satirlar]);

  return { satirlar, masraflar, avanslar, ucretler, ozet, yukleniyor, hata, yenile: yukle, ekle, guncelle, sil };
}
