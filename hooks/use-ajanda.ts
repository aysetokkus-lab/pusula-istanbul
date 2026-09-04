// Eyl 2026 — Ajanda: rehberin kendi tur takvimi (`ajanda_turlar`, RLS yalnızca kendi).
// useAjanda(): tüm turlar (tarih ASC) + ekle/güncelle/sil (optimistic, .select().single() ile RLS sessiz reddi yakalanır).
// useTur(id): tek tur (tur ekranı). Rota planlayıcının yerine geçti (Ayşe kararı, 3 Eyl 2026).
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Tur {
  id: string;
  kullanici_id: string;
  tarih: string;               // 'YYYY-MM-DD' (başlangıç)
  bitis_tarih: string | null;  // çok günlü tur bitişi (null = tek gün)
  baslik: string;
  acente: string | null;
  acente_email: string | null;
  grup: string | null;
  saat: string | null;         // 'HH:MM'
  bulusma: string | null;
  notlar: string | null;
  created_at: string;
  updated_at: string;
}

export interface TurPayload {
  tarih: string;
  bitis_tarih?: string | null;
  baslik: string;
  acente?: string | null;
  acente_email?: string | null;
  grup?: string | null;
  saat?: string | null;
  bulusma?: string | null;
  notlar?: string | null;
}

export interface AjandaSonuc { ok: boolean; hata?: string; id?: string }

const SECIM = 'id, kullanici_id, tarih, bitis_tarih, baslik, acente, acente_email, grup, saat, bulusma, notlar, created_at, updated_at';

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
export function gunStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function bugunStr(): string { return gunStr(new Date()); }

/** 'YYYY-MM-DD' → lokal Date (saat 00:00) */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/* ─── Çok günlü tur yardımcıları ─── */
export function cokGunlu(t: Pick<Tur, 'tarih' | 'bitis_tarih'>): boolean {
  return !!t.bitis_tarih && t.bitis_tarih > t.tarih;
}
export function turBitis(t: Pick<Tur, 'tarih' | 'bitis_tarih'>): string {
  return cokGunlu(t) ? t.bitis_tarih! : t.tarih;
}
/** Tur bu günü kapsıyor mu */
export function turKapsar(t: Pick<Tur, 'tarih' | 'bitis_tarih'>, iso: string): boolean {
  return iso >= t.tarih && iso <= turBitis(t);
}
/** Turun günleri ('YYYY-MM-DD' listesi, dahil) — en fazla 120 gün */
export function turGunleri(t: Pick<Tur, 'tarih' | 'bitis_tarih'>): string[] {
  const out: string[] = [];
  const d = isoToDate(t.tarih); const son = turBitis(t);
  while (out.length < 120) { const iso = gunStr(d); out.push(iso); if (iso >= son) break; d.setDate(d.getDate() + 1); }
  return out;
}
export function gunSayisi(t: Pick<Tur, 'tarih' | 'bitis_tarih'>): number {
  return cokGunlu(t) ? Math.round((isoToDate(t.bitis_tarih!).getTime() - isoToDate(t.tarih).getTime()) / 86400000) + 1 : 1;
}
/** Kaçıncı gün (1'den; aralık dışında null) */
export function kacinciGun(t: Pick<Tur, 'tarih' | 'bitis_tarih'>, iso: string): number | null {
  if (!turKapsar(t, iso)) return null;
  return Math.round((isoToDate(iso).getTime() - isoToDate(t.tarih).getTime()) / 86400000) + 1;
}
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
/** "12 – 30 Eyl (19 gün)" / "28 Eyl – 2 Eki (5 gün)" / tek gün: "5 Eyl" */
export function tarihAraligiKisa(t: Pick<Tur, 'tarih' | 'bitis_tarih'>): string {
  const [, m1, d1] = t.tarih.split('-').map(Number);
  if (!cokGunlu(t)) return `${d1} ${AY_KISA[m1 - 1]}`;
  const [, m2, d2] = t.bitis_tarih!.split('-').map(Number);
  const n = gunSayisi(t);
  return m1 === m2 ? `${d1} – ${d2} ${AY_KISA[m1 - 1]} (${n} gün)` : `${d1} ${AY_KISA[m1 - 1]} – ${d2} ${AY_KISA[m2 - 1]} (${n} gün)`;
}

/** Turun fiş klasörünü (masraf-fisler/<uid>/<tur_id>/) boşalt — DB cascade dosyaları silmez */
async function fisKlasorunuTemizle(turId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const klasor = `${user.id}/${turId}`;
    const { data } = await supabase.storage.from('masraf-fisler').list(klasor, { limit: 200 });
    if (data?.length) await supabase.storage.from('masraf-fisler').remove(data.map(f => `${klasor}/${f.name}`));
  } catch { /* sessiz */ }
}

function temizle(p: TurPayload): TurPayload {
  const t = (s?: string | null) => { const v = (s ?? '').trim(); return v ? v : null; };
  const bitis = p.bitis_tarih && p.bitis_tarih > p.tarih ? p.bitis_tarih : null;
  return {
    tarih: p.tarih,
    bitis_tarih: bitis,
    baslik: p.baslik.trim(),
    acente: t(p.acente),
    acente_email: t(p.acente_email)?.toLowerCase() ?? null,
    grup: t(p.grup),
    saat: t(p.saat),
    bulusma: t(p.bulusma),
    notlar: t(p.notlar),
  };
}

export function useAjanda() {
  const [turlar, setTurlar] = useState<Tur[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);

  const uidAl = useCallback(async () => {
    if (uidRef.current) return uidRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    uidRef.current = user?.id ?? null;
    return uidRef.current;
  }, []);

  const yukle = useCallback(async (sessiz?: boolean) => {
    if (!sessiz) setYukleniyor(true);
    try {
      const uid = await uidAl();
      if (!uid) { setTurlar([]); setHata('Giriş yapmalısınız'); return; }
      const { data, error } = await supabase
        .from('ajanda_turlar')
        .select(SECIM)
        .eq('kullanici_id', uid)
        .order('tarih', { ascending: true })
        .order('saat', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (error) { setHata(error.message); return; }
      setTurlar((data ?? []) as Tur[]);
      setHata(null);
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      if (!sessiz) setYukleniyor(false);
    }
  }, [uidAl]);

  useEffect(() => { yukle(); }, [yukle]);

  // Oturum değişince tazele
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((olay, session) => {
      if (olay !== 'SIGNED_IN' && olay !== 'SIGNED_OUT') return;
      uidRef.current = session?.user?.id ?? null;
      yukle(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [yukle]);

  const turEkle = useCallback(async (p: TurPayload): Promise<AjandaSonuc> => {
    const uid = await uidAl();
    if (!uid) return { ok: false, hata: 'Giriş yapmalısınız' };
    const { data, error } = await supabase
      .from('ajanda_turlar')
      .insert({ kullanici_id: uid, ...temizle(p) })
      .select(SECIM)
      .single();
    if (error || !data) return { ok: false, hata: error?.message ?? 'Kaydedilemedi' };
    setTurlar(prev => [...prev, data as Tur].sort(turSirala));
    return { ok: true, id: (data as Tur).id };
  }, [uidAl]);

  const turGuncelle = useCallback(async (id: string, p: TurPayload): Promise<AjandaSonuc> => {
    const { data, error } = await supabase
      .from('ajanda_turlar')
      .update(temizle(p))
      .eq('id', id)
      .select(SECIM)
      .single();
    if (error || !data) return { ok: false, hata: error?.message ?? 'Güncellenemedi' };
    setTurlar(prev => prev.map(t => (t.id === id ? (data as Tur) : t)).sort(turSirala));
    return { ok: true, id };
  }, []);

  const turSil = useCallback(async (id: string): Promise<AjandaSonuc> => {
    await fisKlasorunuTemizle(id);
    const { data, error } = await supabase.from('ajanda_turlar').delete().eq('id', id).select('id');
    if (error) return { ok: false, hata: error.message };
    if (!data || data.length === 0) return { ok: false, hata: 'Silinemedi (yetki)' };
    setTurlar(prev => prev.filter(t => t.id !== id));
    return { ok: true };
  }, []);

  return { turlar, yukleniyor, hata, yenile: yukle, turEkle, turGuncelle, turSil };
}

export function turSirala(a: Tur, b: Tur): number {
  if (a.tarih !== b.tarih) return a.tarih < b.tarih ? -1 : 1;
  const sa = a.saat ?? '99:99', sb = b.saat ?? '99:99';
  if (sa !== sb) return sa < sb ? -1 : 1;
  return a.created_at < b.created_at ? -1 : 1;
}

/** Tek tur (tur ekranı) */
export function useTur(id: string | undefined) {
  const [tur, setTur] = useState<Tur | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    if (!id) { setTur(null); setYukleniyor(false); return; }
    setYukleniyor(true);
    try {
      const { data, error } = await supabase.from('ajanda_turlar').select(SECIM).eq('id', id).maybeSingle();
      if (error) { setHata(error.message); return; }
      setTur((data as Tur) ?? null);
      setHata(data ? null : 'Tur bulunamadı');
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setYukleniyor(false);
    }
  }, [id]);

  useEffect(() => { yukle(); }, [yukle]);

  const guncelle = useCallback(async (p: TurPayload): Promise<AjandaSonuc> => {
    if (!id) return { ok: false, hata: 'Tur yok' };
    const { data, error } = await supabase.from('ajanda_turlar').update(temizle(p)).eq('id', id).select(SECIM).single();
    if (error || !data) return { ok: false, hata: error?.message ?? 'Güncellenemedi' };
    setTur(data as Tur);
    return { ok: true, id };
  }, [id]);

  const sil = useCallback(async (): Promise<AjandaSonuc> => {
    if (!id) return { ok: false, hata: 'Tur yok' };
    await fisKlasorunuTemizle(id);
    const { data, error } = await supabase.from('ajanda_turlar').delete().eq('id', id).select('id');
    if (error) return { ok: false, hata: error.message };
    if (!data || data.length === 0) return { ok: false, hata: 'Silinemedi (yetki)' };
    return { ok: true };
  }, [id]);

  return { tur, yukleniyor, hata, yenile: yukle, guncelle, sil };
}
