import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { telefonNormalize } from '../lib/telefon';

/* ═══════════════════════════════════════════
   useIlanlar (Eyl 2026 — İş İlanları)
   ───────────────────────────────────────────
   - Herkese açık aktif ilanlar: durum='aktif' VE tarih >= dün
     (dünkü ilanlar akşam listeden kaybolmasın), tarih ASC, saat ASC
   - + kullanıcının kendi ilanları (dolduruldu dahil, son 30 gün)
   - Realtime (INSERT/UPDATE/DELETE) + 30 sn polling yedeği
   - ilanEkle: kullanici_id + kullanici_isim yazar, .select().single() ile
     RLS sessiz reddini yakalar
   - useProfilDilleri: profiles.diller / profiles.telefon (optimistic)
   ═══════════════════════════════════════════ */

export type IlanTur = 'rehber_araniyor' | 'is_ariyorum' | 'diger';
export type IlanSure = 'yarim_gun' | 'tam_gun' | 'coklu_gun' | 'transfer' | 'diger';
export type IlanDurum = 'aktif' | 'dolduruldu' | 'kaldirildi';

export interface Ilan {
  id: string;
  kullanici_id: string;
  kullanici_isim: string | null;
  tur: IlanTur;
  baslik: string;
  aciklama: string | null;
  diller: string[] | null;
  tarih: string;            // 'YYYY-MM-DD'
  bitis_tarih: string | null;   // 4 Eyl 2026: çok günlü ilanın son günü (NULL = tek gün)
  saat: string | null;      // 'HH:MM'
  sure: IlanSure | null;
  grup_buyuklugu: number | null;
  ucret: string | null;
  iletisim: string;
  durum: IlanDurum;
  created_at: string;
  updated_at: string;
}

export interface IlanPayload {
  tur: IlanTur;
  baslik: string;
  aciklama?: string | null;
  diller: string[];
  tarih: string;
  bitis_tarih?: string | null;
  saat?: string | null;
  sure?: IlanSure | null;
  grup_buyuklugu?: number | null;
  ucret?: string | null;
  iletisim: string;
}

export type IlanPatch = Partial<Omit<Ilan, 'id' | 'kullanici_id' | 'kullanici_isim' | 'created_at' | 'updated_at'>>;

export interface IlanSonuc { ok: boolean; hata?: string }

/* ─── Tarih yardımcıları (yerel gün, saat dilimi kaymasız) ─── */
function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

export function gunStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function gunOnce(gun: number): string {
  const d = new Date();
  d.setDate(d.getDate() - gun);
  return gunStr(d);
}

function sirala(liste: Ilan[]): Ilan[] {
  return [...liste].sort((a, b) => {
    if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih);
    const sa = a.saat || '99:99';
    const sb = b.saat || '99:99';
    if (sa !== sb) return sa.localeCompare(sb);
    return a.created_at.localeCompare(b.created_at);
  });
}

/* ═══════════════════════════════════════════
   useIlanlar
   ═══════════════════════════════════════════ */
export function useIlanlar() {
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [benimId, setBenimId] = useState<string | null>(null);
  const benimIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);

  /* Bir satır listede görünmeli mi? (sorgu filtresinin realtime karşılığı) */
  const gorunurMu = useCallback((i: Ilan): boolean => {
    if (!i || i.durum === 'kaldirildi') return false;
    const benim = !!benimIdRef.current && i.kullanici_id === benimIdRef.current;
    if (benim) return i.tarih >= gunOnce(30);
    return i.durum === 'aktif' && i.tarih >= gunOnce(1);
  }, []);

  const yukle = useCallback(async () => {
    try {
      setHata(null);
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      benimIdRef.current = uid;
      setBenimId(uid);

      // 1) Herkese açık aktif ilanlar (dün ve sonrası)
      const { data: aktifler, error: e1 } = await supabase
        .from('ilanlar')
        .select('*')
        .eq('durum', 'aktif')
        .gte('tarih', gunOnce(1))
        .order('tarih', { ascending: true })
        .order('saat', { ascending: true });
      if (e1) throw e1;

      // 2) Kendi ilanlarım (dolduruldu dahil, son 30 gün)
      let benimkiler: Ilan[] = [];
      if (uid) {
        const { data, error: e2 } = await supabase
          .from('ilanlar')
          .select('*')
          .eq('kullanici_id', uid)
          .neq('durum', 'kaldirildi')
          .gte('tarih', gunOnce(30))
          .order('tarih', { ascending: true })
          .order('saat', { ascending: true });
        if (e2) throw e2;
        benimkiler = (data || []) as Ilan[];
      }

      // Birleştir (id'ye göre tekilleştir) ve sırala
      const harita = new Map<string, Ilan>();
      for (const i of (aktifler || []) as Ilan[]) harita.set(i.id, i);
      for (const i of benimkiler) harita.set(i.id, i);
      setIlanlar(sirala(Array.from(harita.values())));
    } catch (e: any) {
      console.warn('[Ilanlar] yükleme hatası:', e?.message);
      setHata(e?.message || 'İlanlar yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yukle();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('ilanlar-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ilanlar' },
        (payload: any) => {
          const yeni = payload.new as Ilan;
          if (!gorunurMu(yeni)) return;
          setIlanlar(prev => {
            if (prev.some(i => i.id === yeni.id)) return prev;
            return sirala([...prev, yeni]);
          });
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ilanlar' },
        (payload: any) => {
          const guncel = payload.new as Ilan;
          if (!guncel?.id) return;
          setIlanlar(prev => {
            if (!gorunurMu(guncel)) return prev.filter(i => i.id !== guncel.id);
            const varMi = prev.some(i => i.id === guncel.id);
            return sirala(varMi ? prev.map(i => (i.id === guncel.id ? guncel : i)) : [...prev, guncel]);
          });
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'ilanlar' },
        (payload: any) => {
          const silinen = payload.old as { id?: string };
          if (!silinen?.id) return;
          setIlanlar(prev => prev.filter(i => i.id !== silinen.id));
        })
      .subscribe();

    channelRef.current = channel;

    // Polling yedeği: realtime kopsa bile 30 sn'de bir liste tazelenir
    const polling = setInterval(() => { yukle(); }, 30000);

    return () => {
      clearInterval(polling);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [yukle, gorunurMu]);

  /* ─── İlan ekle ─── */
  const ilanEkle = useCallback(async (payload: IlanPayload): Promise<IlanSonuc> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ok: false, hata: 'Giriş gerekli' };

      const { data: profil } = await supabase
        .from('profiles')
        .select('isim, soyisim')
        .eq('id', user.id)
        .single();
      const kullanici_isim = profil
        ? `${profil.isim || ''} ${profil.soyisim || ''}`.trim() || null
        : null;

      const { data, error } = await supabase
        .from('ilanlar')
        .insert({
          kullanici_id: user.id,
          kullanici_isim,
          tur: payload.tur,
          baslik: payload.baslik.trim(),
          aciklama: payload.aciklama?.trim() || null,
          diller: payload.diller,
          tarih: payload.tarih,
          bitis_tarih: payload.bitis_tarih || null,
          saat: payload.saat?.trim() || null,
          sure: payload.sure || null,
          grup_buyuklugu: payload.grup_buyuklugu ?? null,
          ucret: payload.ucret?.trim() || null,
          iletisim: payload.iletisim.trim(),
          durum: 'aktif',
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return { ok: false, hata: 'İlan kaydedilemedi (yetki reddi)' };

      // Optimistic: realtime'ı beklemeden listeye koy
      const yeni = data as Ilan;
      setIlanlar(prev => (prev.some(i => i.id === yeni.id) ? prev : sirala([...prev, yeni])));
      return { ok: true };
    } catch (e: any) {
      console.warn('[Ilanlar] ekleme hatası:', e?.message);
      return { ok: false, hata: e?.message || 'İlan eklenemedi' };
    }
  }, []);

  /* ─── İlan güncelle ─── */
  const ilanGuncelle = useCallback(async (id: string, patch: IlanPatch): Promise<IlanSonuc> => {
    try {
      const { data, error } = await supabase
        .from('ilanlar')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (!data) return { ok: false, hata: 'Güncelleme reddedildi (yetki yok)' };

      const guncel = data as Ilan;
      setIlanlar(prev => {
        if (!gorunurMu(guncel)) return prev.filter(i => i.id !== guncel.id);
        return sirala(prev.map(i => (i.id === guncel.id ? guncel : i)));
      });
      return { ok: true };
    } catch (e: any) {
      console.warn('[Ilanlar] güncelleme hatası:', e?.message);
      return { ok: false, hata: e?.message || 'İlan güncellenemedi' };
    }
  }, [gorunurMu]);

  /* ─── İlan sil ─── */
  const ilanSil = useCallback(async (id: string): Promise<IlanSonuc> => {
    try {
      // RLS sessiz reddi: DELETE ... RETURNING boş dönerse policy reddetti
      const { data, error } = await supabase
        .from('ilanlar')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) return { ok: false, hata: 'Silme reddedildi (yetki yok)' };
      setIlanlar(prev => prev.filter(i => i.id !== id));
      return { ok: true };
    } catch (e: any) {
      console.warn('[Ilanlar] silme hatası:', e?.message);
      return { ok: false, hata: e?.message || 'İlan silinemedi' };
    }
  }, []);

  /* ─── Durum değiştir (dolduruldu / aktif / kaldirildi) ─── */
  const durumDegistir = useCallback(async (id: string, durum: IlanDurum): Promise<IlanSonuc> => {
    return ilanGuncelle(id, { durum });
  }, [ilanGuncelle]);

  return {
    ilanlar,
    yukleniyor,
    hata,
    benimId,
    yenile: yukle,
    ilanEkle,
    ilanGuncelle,
    ilanSil,
    durumDegistir,
  };
}

/* ═══════════════════════════════════════════
   useProfilDilleri — profiles.diller / profiles.telefon
   Optimistic: state hemen güncellenir, hata olursa geri alınır.
   ═══════════════════════════════════════════ */
export function useProfilDilleri() {
  const [diller, setDiller] = useState<string[]>([]);
  const [telefon, setTelefon] = useState<string>('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const uidRef = useRef<string | null>(null);

  const yukle = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { uidRef.current = null; return; }
      uidRef.current = user.id;
      const { data } = await supabase
        .from('profiles')
        .select('diller, telefon')
        .eq('id', user.id)
        .single();
      setDiller(Array.isArray(data?.diller) ? (data!.diller as string[]) : []);
      setTelefon((data?.telefon as string | null) || '');
    } catch (e: any) {
      console.warn('[ProfilDilleri] yükleme hatası:', e?.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const kaydet = useCallback(async (yeni: string[]): Promise<boolean> => {
    const eski = diller;
    setDiller(yeni);
    try {
      const uid = uidRef.current ?? (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error('Giriş gerekli');
      const { data, error } = await supabase
        .from('profiles')
        .update({ diller: yeni })
        .eq('id', uid)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Kayıt reddedildi');
      return true;
    } catch (e: any) {
      console.warn('[ProfilDilleri] dil kaydetme hatası:', e?.message);
      setDiller(eski);
      return false;
    }
  }, [diller]);

  const telefonKaydet = useCallback(async (yeni: string): Promise<boolean> => {
    const eski = telefon;
    // Eyl 2026: E.164'e normalize edilir (+905321234567); geçersiz numara kaydedilmez
    const temiz = yeni.trim() ? telefonNormalize(yeni) : '';
    if (temiz === null) return false;
    setTelefon(temiz);
    try {
      const uid = uidRef.current ?? (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error('Giriş gerekli');
      const { data, error } = await supabase
        .from('profiles')
        .update({ telefon: temiz || null })
        .eq('id', uid)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Kayıt reddedildi');
      return true;
    } catch (e: any) {
      console.warn('[ProfilDilleri] telefon kaydetme hatası:', e?.message);
      setTelefon(eski);
      return false;
    }
  }, [telefon]);

  return { diller, kaydet, telefon, telefonKaydet, yukleniyor, yenile: yukle };
}

/* ═══════════════════════════════════════════
   telefonNumaraRaporla (Eyl 2026) — beyan usulü numara için topluluk denetimi
   raporlanan_mesajlar'a kaynak='telefon' ile yazılır; mesaj_id = ilan id,
   metin = ilan başlığı + numara. Yetkili, SohbetYonetim → Raporlar'da görür.
   ═══════════════════════════════════════════ */
export async function telefonNumaraRaporla(ilan: Pick<Ilan, 'id' | 'baslik' | 'iletisim' | 'kullanici_id' | 'kullanici_isim'>): Promise<{ ok: boolean; hata?: string }> {
  try {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return { ok: false, hata: 'Giriş gerekli' };
    const { error } = await supabase.from('raporlanan_mesajlar').insert({
      mesaj_id: ilan.id,
      mesaj_metni: `[Telefon bildirimi] İlan: "${ilan.baslik}" · Numara: ${ilan.iletisim || '—'} · Ulaşılamıyor / yanlış numara`,
      mesaj_sahibi_id: ilan.kullanici_id,
      mesaj_sahibi_isim: ilan.kullanici_isim || null,
      raporlayan_id: uid,
      sebep: 'diger',
      kaynak: 'telefon',
    });
    if (error) return { ok: false, hata: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, hata: e?.message || 'Bildirim gönderilemedi' };
  }
}
