import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   Özel Mesajlaşma (DM) Hook'ları — Eyl 2026
   ─────────────────────────────────────────
   Tablolar: dm_konusmalar (RLS: yalnızca katılımcı), dm_mesajlar (SELECT katılımcı, DELETE kendi).
   Yazma yalnızca RPC ile: dm_konusma_getir, dm_gonder, dm_okundu, dm_okunmamis_sayisi.
   Push bildirimi sunucuda (dm_gonder) atılır — client push yapmaz.
   - useDmKonusmalar: konuşma listesi (realtime + 15 sn polling)
   - useDmMesajlar: tek konuşmanın mesajları (realtime INSERT + 5 sn polling), okundu takibi
   - konusmaBaslat: alıcıyla konuşma id'si al/oluştur
   - useDmOkunmamis: tab rozeti için okunmamış konuşma sayısı (20 sn polling + realtime)
   ═══════════════════════════════════════════ */

export interface DmKonusma {
  id: string;
  karsi_id: string;
  karsi_isim: string;
  son_mesaj: string | null;
  son_mesaj_at: string | null;
  okunmamis: boolean;
}

export interface DmMesaj {
  id: string;
  konusma_id: string;
  gonderen_id: string;
  gonderen_isim: string | null;
  mesaj: string | null;
  gorsel_url: string | null;
  created_at: string;
}

/** dm_konusmalar tablo satırı (ham) */
interface DmKonusmaSatiri {
  id: string;
  kullanici_a: string;
  kullanici_b: string;
  a_isim: string | null;
  b_isim: string | null;
  son_mesaj: string | null;
  son_mesaj_at: string | null;
  son_gonderen: string | null;
  a_okundu_at: string | null;
  b_okundu_at: string | null;
  created_at: string;
}

/* ─── RPC hata kodlarını Türkçe metne çevir ─── */
export function dmHataMetni(e: unknown): string {
  const m = String((e as any)?.message ?? (e as any)?.details ?? e ?? '');
  if (m.includes('engelli')) return 'Bu kişiyle mesajlaşma engellenmiş';
  if (m.includes('banli')) return 'Hesabınız askıya alınmış';
  if (m.includes('bos_mesaj')) return 'Mesaj boş olamaz';
  if (m.includes('mesaj_uzun')) return 'Mesaj çok uzun';
  return m || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

async function benimIdAl(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function satiriKonusmayaCevir(s: DmKonusmaSatiri, ben: string): DmKonusma {
  const benA = s.kullanici_a === ben;
  const benimOkundu = benA ? s.a_okundu_at : s.b_okundu_at;
  const okunmamis =
    !!s.son_mesaj_at &&
    !!s.son_gonderen &&
    s.son_gonderen !== ben &&
    (!benimOkundu || new Date(s.son_mesaj_at).getTime() > new Date(benimOkundu).getTime());
  return {
    id: s.id,
    karsi_id: benA ? s.kullanici_b : s.kullanici_a,
    karsi_isim: (benA ? s.b_isim : s.a_isim) || 'Rehber',
    son_mesaj: s.son_mesaj,
    son_mesaj_at: s.son_mesaj_at,
    okunmamis,
  };
}

function kanalAdi(on: string): string {
  return `${on}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/* ═══════════════════════════════════════════
   useDmKonusmalar — konuşma listesi
   ═══════════════════════════════════════════ */
export function useDmKonusmalar() {
  const [konusmalar, setKonusmalar] = useState<DmKonusma[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const benRef = useRef<string | null>(null);
  const kanalRef = useRef<any>(null);

  const yenile = useCallback(async () => {
    try {
      if (!benRef.current) benRef.current = await benimIdAl();
      const ben = benRef.current;
      if (!ben) { setKonusmalar([]); return; }
      const { data, error } = await supabase
        .from('dm_konusmalar')
        .select('*')
        .order('son_mesaj_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      setKonusmalar(((data || []) as DmKonusmaSatiri[]).map(s => satiriKonusmayaCevir(s, ben)));
    } catch (e) {
      console.warn('[DM] konuşma listesi yüklenemedi:', e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yenile();

    // Realtime: dm_konusmalar INSERT/UPDATE → listeyi tazele
    const kanal = supabase
      .channel(kanalAdi('dm-konusmalar'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_konusmalar' }, () => { yenile(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dm_konusmalar' }, () => { yenile(); })
      .subscribe();
    kanalRef.current = kanal;

    // Polling yedeği: 15 sn
    const aralik = setInterval(yenile, 15000);

    return () => {
      clearInterval(aralik);
      if (kanalRef.current) {
        supabase.removeChannel(kanalRef.current);
        kanalRef.current = null;
      }
    };
  }, [yenile]);

  const okunmamisSayisi = konusmalar.reduce((a, k) => a + (k.okunmamis ? 1 : 0), 0);

  return { konusmalar, yukleniyor, yenile, okunmamisSayisi };
}

/* ═══════════════════════════════════════════
   useDmMesajlar — tek konuşma
   ═══════════════════════════════════════════ */
export function useDmMesajlar(konusmaId: string | null) {
  const [mesajlar, setMesajlar] = useState<DmMesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [benimId, setBenimId] = useState<string | null>(null);
  const [konusma, setKonusma] = useState<DmKonusmaSatiri | null>(null);
  const benRef = useRef<string | null>(null);
  const sonOkunduRef = useRef<string | null>(null);   // en son "okundu" bildirilen karşı-taraf mesajının created_at'i
  const kanalRef = useRef<any>(null);

  /* Okundu bildir (yalnızca daha yeni bir karşı-taraf mesajı varsa) */
  const okunduBildir = useCallback(async (liste: DmMesaj[], zorla = false) => {
    if (!konusmaId) return;
    const ben = benRef.current;
    const sonKarsi = [...liste].reverse().find(m => m.gonderen_id !== ben);
    if (!zorla) {
      if (!sonKarsi) return;
      if (sonOkunduRef.current && new Date(sonKarsi.created_at).getTime() <= new Date(sonOkunduRef.current).getTime()) return;
    }
    if (sonKarsi) sonOkunduRef.current = sonKarsi.created_at;
    try {
      await supabase.rpc('dm_okundu', { p_konusma_id: konusmaId });
    } catch (e) {
      console.warn('[DM] okundu bildirilemedi:', e);
    }
  }, [konusmaId]);

  /* Konuşma satırı (karşı tarafın okundu_at'i ve isimler için) */
  const konusmaYukle = useCallback(async () => {
    if (!konusmaId) return;
    try {
      const { data, error } = await supabase.from('dm_konusmalar').select('*').eq('id', konusmaId).maybeSingle();
      if (error) throw error;
      if (data) setKonusma(data as DmKonusmaSatiri);
    } catch (e) {
      console.warn('[DM] konuşma satırı yüklenemedi:', e);
    }
  }, [konusmaId]);

  /* Mesajlar: son 200, artan sırada */
  const mesajlariYukle = useCallback(async () => {
    if (!konusmaId) return;
    try {
      const { data, error } = await supabase
        .from('dm_mesajlar')
        .select('*')
        .eq('konusma_id', konusmaId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const liste = ((data || []) as DmMesaj[]).slice().reverse();
      setMesajlar(liste);
      okunduBildir(liste);
    } catch (e) {
      console.warn('[DM] mesajlar yüklenemedi:', e);
    }
  }, [konusmaId, okunduBildir]);

  useEffect(() => {
    if (!konusmaId) { setYukleniyor(false); return; }
    let iptal = false;
    setYukleniyor(true);
    setMesajlar([]);
    sonOkunduRef.current = null;

    (async () => {
      const ben = await benimIdAl();
      if (iptal) return;
      benRef.current = ben;
      setBenimId(ben);
      await Promise.all([konusmaYukle(), mesajlariYukle()]);
      if (iptal) return;
      // Ekran açıldı: okundu işaretle (mesaj olmasa bile okundu_at güncellensin)
      okunduBildir([], true);
      setYukleniyor(false);
    })();

    // Realtime: bu konuşmanın mesajları + konuşma satırı (karşı taraf okundu_at)
    const kanal = supabase
      .channel(kanalAdi(`dm-mesajlar-${konusmaId}`))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_mesajlar', filter: `konusma_id=eq.${konusmaId}` },
        (payload: any) => {
          const yeni = payload.new as DmMesaj;
          if (!yeni?.id) return;
          setMesajlar(prev => (prev.some(m => m.id === yeni.id) ? prev : [...prev, yeni]));
          // Ekran açıkken karşı taraftan mesaj geldi → okundu bildir
          if (yeni.gonderen_id !== benRef.current) okunduBildir([yeni]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'dm_mesajlar', filter: `konusma_id=eq.${konusmaId}` },
        (payload: any) => {
          const silinen = payload.old as { id?: string };
          if (!silinen?.id) return;
          setMesajlar(prev => prev.filter(m => m.id !== silinen.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dm_konusmalar', filter: `id=eq.${konusmaId}` },
        (payload: any) => {
          const yeni = payload.new as DmKonusmaSatiri;
          if (yeni?.id) setKonusma(yeni);
        }
      )
      .subscribe();
    kanalRef.current = kanal;

    // Polling yedeği: 5 sn (mesajlar + konuşma satırı)
    const aralik = setInterval(() => {
      mesajlariYukle();
      konusmaYukle();
    }, 5000);

    return () => {
      iptal = true;
      clearInterval(aralik);
      if (kanalRef.current) {
        supabase.removeChannel(kanalRef.current);
        kanalRef.current = null;
      }
    };
  }, [konusmaId, konusmaYukle, mesajlariYukle, okunduBildir]);

  /* Gönder: RPC dm_gonder (ban/engel kontrolü + son_mesaj + push sunucuda) */
  const gonder = useCallback(async (metin: string, gorselUrl?: string | null): Promise<{ ok: boolean; hata?: string }> => {
    if (!konusmaId) return { ok: false, hata: 'Konuşma bulunamadı' };
    try {
      const { data, error } = await supabase.rpc('dm_gonder', {
        p_konusma_id: konusmaId,
        p_mesaj: metin,
        p_gorsel_url: gorselUrl ?? null,
      });
      if (error) throw error;
      const satir = (Array.isArray(data) ? data[0] : data) as DmMesaj | null;
      if (satir?.id) {
        setMesajlar(prev => (prev.some(m => m.id === satir.id) ? prev : [...prev, satir]));
      } else {
        mesajlariYukle();
      }
      return { ok: true };
    } catch (e) {
      console.warn('[DM] gönderme hatası:', e);
      return { ok: false, hata: dmHataMetni(e) };
    }
  }, [konusmaId, mesajlariYukle]);

  /* Kendi mesajını sil (RLS: DELETE yalnızca kendi) */
  const sil = useCallback(async (mesajId: string): Promise<{ ok: boolean; hata?: string }> => {
    try {
      const { error } = await supabase.from('dm_mesajlar').delete().eq('id', mesajId);
      if (error) throw error;
      setMesajlar(prev => prev.filter(m => m.id !== mesajId));
      return { ok: true };
    } catch (e) {
      return { ok: false, hata: dmHataMetni(e) };
    }
  }, []);

  const benA = !!konusma && !!benimId && konusma.kullanici_a === benimId;
  const karsiOkunduAt: string | null = konusma ? (benA ? konusma.b_okundu_at : konusma.a_okundu_at) : null;
  const karsiId: string | null = konusma ? (benA ? konusma.kullanici_b : konusma.kullanici_a) : null;
  const karsiIsim: string | null = konusma ? ((benA ? konusma.b_isim : konusma.a_isim) || null) : null;

  return { mesajlar, yukleniyor, gonder, sil, karsiOkunduAt, benimId, karsiId, karsiIsim };
}

/* ═══════════════════════════════════════════
   konusmaBaslat — var olan konuşmayı döner ya da oluşturur
   ═══════════════════════════════════════════ */
export async function konusmaBaslat(aliciId: string): Promise<string> {
  const { data, error } = await supabase.rpc('dm_konusma_getir', { alici_id: aliciId });
  if (error) throw new Error(dmHataMetni(error));
  const id = Array.isArray(data) ? data[0] : data;
  if (!id || typeof id !== 'string') throw new Error('Konuşma başlatılamadı');
  return id;
}

/* ═══════════════════════════════════════════
   useDmOkunmamis — tab rozeti (okunmamış konuşma sayısı)
   ═══════════════════════════════════════════ */
export function useDmOkunmamis() {
  const [sayi, setSayi] = useState(0);
  const kanalRef = useRef<any>(null);

  const kontrol = useCallback(async () => {
    try {
      const ben = await benimIdAl();
      if (!ben) { setSayi(0); return; }
      const { data, error } = await supabase.rpc('dm_okunmamis_sayisi');
      if (error) throw error;
      const n = typeof data === 'number' ? data : parseInt(String(data ?? 0), 10);
      setSayi(isNaN(n) ? 0 : n);
    } catch (e) {
      console.warn('[DM] okunmamış sayısı alınamadı:', e);
    }
  }, []);

  useEffect(() => {
    kontrol();

    const kanal = supabase
      .channel(kanalAdi('dm-okunmamis'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_konusmalar' }, () => { kontrol(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dm_konusmalar' }, () => { kontrol(); })
      .subscribe();
    kanalRef.current = kanal;

    const aralik = setInterval(kontrol, 20000);

    // Giriş/çıkışta yeniden say
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { kontrol(); });

    return () => {
      clearInterval(aralik);
      subscription.unsubscribe();
      if (kanalRef.current) {
        supabase.removeChannel(kanalRef.current);
        kanalRef.current = null;
      }
    };
  }, [kontrol]);

  return { sayi };
}
