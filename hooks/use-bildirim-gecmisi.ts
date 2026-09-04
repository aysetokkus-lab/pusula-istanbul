import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   useBildirimGecmisi (4 Eyl 2026) — uygulama içi Bildirimler
   ─────────────────────────────────────────
   Kaynak: bildirim_gecmisi (push-gonder v7 yazar; RLS: hedef = ben ya da haric olmayan herkes).
   Sunucu filtresine ek istemci filtresi (push ile birebir): kapattığım kategoriler gizli; ilan
   dilleri profil dillerimle kesişmiyorsa gizli.
   Okunmamış: AsyncStorage `bildirim-son-goruldu` (ISO) — listeyi açınca güncellenir; sayaç
   = son görülmeden yeni satır sayısı. Uygulama öne gelince yenilenir.
   ═══════════════════════════════════════════ */

export interface BildirimSatir {
  id: string;
  kategori: string;
  baslik: string;
  icerik: string;
  veri: Record<string, unknown> | null;
  hedef_kullanici_id: string | null;
  diller: string[] | null;
  created_at: string;
}

const SON_GORULDU_KEY = 'bildirim-son-goruldu';
const LIMIT = 100;

async function profilFiltresi(): Promise<{ tercih: Record<string, boolean> | null; diller: string[] }> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return { tercih: null, diller: [] };
  const { data } = await supabase.from('profiles').select('bildirim_tercihleri, diller').eq('id', uid).maybeSingle();
  return {
    tercih: (data?.bildirim_tercihleri as Record<string, boolean> | null) ?? null,
    diller: Array.isArray(data?.diller) ? (data!.diller as string[]).map(d => d.toLocaleLowerCase('tr')) : [],
  };
}

function gorunurMu(b: BildirimSatir, f: { tercih: Record<string, boolean> | null; diller: string[] }): boolean {
  if (b.hedef_kullanici_id) return true;   // kişiye özel: her zaman
  if (f.tercih && f.tercih[b.kategori] === false) return false;
  if (b.kategori === 'ilanlar' && b.diller && b.diller.length > 0 && f.diller.length > 0) {
    const bd = b.diller.map(d => d.toLocaleLowerCase('tr'));
    if (!f.diller.some(d => bd.includes(d))) return false;
  }
  return true;
}

export async function sonGorulduOku(): Promise<string | null> {
  try { return await AsyncStorage.getItem(SON_GORULDU_KEY); } catch { return null; }
}
export async function sonGorulduYaz(iso = new Date().toISOString()) {
  try { await AsyncStorage.setItem(SON_GORULDU_KEY, iso); } catch {}
}

/** Liste (Bildirimler ekranı) */
export function useBildirimGecmisi() {
  const [liste, setListe] = useState<BildirimSatir[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    try {
      const [f, { data }] = await Promise.all([
        profilFiltresi(),
        supabase.from('bildirim_gecmisi').select('*').order('created_at', { ascending: false }).limit(LIMIT),
      ]);
      setListe(((data ?? []) as BildirimSatir[]).filter(b => gorunurMu(b, f)));
    } catch (e) {
      console.warn('[Bildirim] geçmiş yüklenemedi:', e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);
  return { liste, yukleniyor, yenile: yukle };
}

/** Okunmamış sayısı (ana sayfa zili) — öne gelince ve 90 sn'de bir yenilenir */
export function useBildirimOkunmamis(aktif = true) {
  const [sayi, setSayi] = useState(0);
  const calisiyor = useRef(false);

  const hesapla = useCallback(async () => {
    if (calisiyor.current) return;
    calisiyor.current = true;
    try {
      const son = (await sonGorulduOku()) ?? new Date(Date.now() - 7 * 86400_000).toISOString();
      const [f, { data }] = await Promise.all([
        profilFiltresi(),
        supabase.from('bildirim_gecmisi').select('*').gt('created_at', son).order('created_at', { ascending: false }).limit(50),
      ]);
      setSayi(((data ?? []) as BildirimSatir[]).filter(b => gorunurMu(b, f)).length);
    } catch {} finally { calisiyor.current = false; }
  }, []);

  useEffect(() => {
    if (!aktif) return;
    hesapla();
    const z = setInterval(hesapla, 90_000);
    const abone = AppState.addEventListener('change', s => { if (s === 'active') hesapla(); });
    return () => { clearInterval(z); abone.remove(); };
  }, [aktif, hesapla]);

  const sifirla = useCallback(async () => { await sonGorulduYaz(); setSayi(0); }, []);
  return { sayi, yenile: hesapla, sifirla };
}
