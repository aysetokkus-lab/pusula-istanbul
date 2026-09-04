import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   useTureb (Eyl 2026) — TUREB rehber veritabanı eşleşmesi
   ───────────────────────────────────────────
   Edge Function `tureb-dogrula`: profil ad-soyadıyla TUREB'e sorar, sonucu
   profiles.tureb_* alanlarına yazar (kullanıcı bu alanları değiştiremez).
   durum: eylemli | eylemsiz | coklu (adaylar arasından seçim) | bulunamadi | bilinmiyor
   Rozet: eylemli/eylemsiz için görünür; kayıt engellenmez (Ayşe kararı).
   ═══════════════════════════════════════════ */

export type TurebDurum = 'eylemli' | 'eylemsiz' | 'coklu' | 'bulunamadi' | 'bilinmiyor';
export type TurebAday = { ad: string; oda: string; dil: string; durum: 'eylemli' | 'eylemsiz' | '' };
export type TurebBilgi = {
  durum: TurebDurum | null;
  oda: string | null;
  dil: string | null;
  ad: string | null;
  adaylar: TurebAday[] | null;
  kontrolAt: string | null;
};

const BOS: TurebBilgi = { durum: null, oda: null, dil: null, ad: null, adaylar: null, kontrolAt: null };
const YENIDEN_KONTROL_GUN = 180;

function satirdan(p: any): TurebBilgi {
  return {
    durum: (p?.tureb_durum as TurebDurum) ?? null,
    oda: p?.tureb_oda ?? null,
    dil: p?.tureb_dil ?? null,
    ad: p?.tureb_ad ?? null,
    adaylar: (p?.tureb_adaylar as TurebAday[]) ?? null,
    kontrolAt: p?.tureb_kontrol_at ?? null,
  };
}

/** Edge Function çağrısı — secim verilirse çoklu eşleşmeden seçilen aday yazılır */
export async function turebDogrula(secim?: number): Promise<{ ok: boolean; durum?: TurebDurum; adaylar?: TurebAday[] | null; hata?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('tureb-dogrula', { body: secim === undefined ? {} : { secim } });
    if (error) return { ok: false, hata: error.message };
    if (data?.hata && !data?.durum) return { ok: false, hata: data.hata };
    return { ok: true, durum: data?.durum, adaylar: data?.adaylar ?? null, hata: data?.hata };
  } catch (e: any) {
    return { ok: false, hata: e?.message || 'TUREB doğrulaması yapılamadı' };
  }
}

/** Kendi TUREB durumum (profil ekranı, rozet) + yeniden kontrol */
export function useTureb() {
  const [bilgi, setBilgi] = useState<TurebBilgi>(BOS);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(false);

  const yukle = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) { setYukleniyor(false); return; }
    const { data } = await supabase.from('profiles')
      .select('tureb_durum, tureb_oda, tureb_dil, tureb_ad, tureb_adaylar, tureb_kontrol_at')
      .eq('id', uid).maybeSingle();
    setBilgi(satirdan(data));
    setYukleniyor(false);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const kontrolEt = useCallback(async (secim?: number) => {
    setKontrolEdiliyor(true);
    const r = await turebDogrula(secim);
    await yukle();
    setKontrolEdiliyor(false);
    return r;
  }, [yukle]);

  return { bilgi, yukleniyor, kontrolEdiliyor, kontrolEt, yenile: yukle };
}

/**
 * Otomatik kontrol (uygulama açılışında, _layout): hiç kontrol edilmemişse, profil adı
 * TUREB'deki eşleşen addan farklıysa ya da 180 günden eskiyse arka planda yeniden sorar.
 * Oturum başına en fazla bir kez.
 */
export function useTurebOtomatik(aktif: boolean) {
  const yapildi = useRef(false);
  useEffect(() => {
    if (!aktif || yapildi.current) return;
    yapildi.current = true;
    (async () => {
      try {
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return;
        const { data: p } = await supabase.from('profiles')
          .select('isim, soyisim, tureb_durum, tureb_ad, tureb_kontrol_at')
          .eq('id', uid).maybeSingle();
        if (!p || !p.isim || !p.soyisim) return;
        const tamAd = `${p.isim} ${p.soyisim}`.trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
        const eskiMi = !p.tureb_kontrol_at || (Date.now() - new Date(p.tureb_kontrol_at).getTime()) > YENIDEN_KONTROL_GUN * 86400_000;
        const adDegisti = !!p.tureb_ad && p.tureb_durum !== 'coklu' && !p.tureb_ad.split(' ').every((k: string) => tamAd.includes(k));
        const tekrar = p.tureb_durum === 'bilinmiyor';
        if (eskiMi || adDegisti || tekrar) await turebDogrula();
      } catch {}
    })();
  }, [aktif]);
}

/** Başkalarının rozetleri (ilan kartları, DM) — id listesi için toplu okuma + basit önbellek */
const rozetOnbellek = new Map<string, { durum: TurebDurum | null; oda: string | null }>();
export function useTurebRozetleri(ids: string[]) {
  const [harita, setHarita] = useState<Record<string, { durum: TurebDurum | null; oda: string | null }>>({});
  const anahtar = ids.filter(Boolean).sort().join(',');
  useEffect(() => {
    const eksik = ids.filter(id => id && !rozetOnbellek.has(id));
    const uygula = () => {
      const h: Record<string, { durum: TurebDurum | null; oda: string | null }> = {};
      for (const id of ids) { const v = rozetOnbellek.get(id); if (v) h[id] = v; }
      setHarita(h);
    };
    if (!eksik.length) { uygula(); return; }
    let iptal = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('id, tureb_durum, tureb_oda').in('id', eksik);
      for (const p of data ?? []) rozetOnbellek.set(p.id, { durum: (p.tureb_durum as TurebDurum) ?? null, oda: p.tureb_oda ?? null });
      for (const id of eksik) if (!rozetOnbellek.has(id)) rozetOnbellek.set(id, { durum: null, oda: null });
      if (!iptal) uygula();
    })();
    return () => { iptal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar]);
  return harita;
}
