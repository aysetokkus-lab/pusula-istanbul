import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ═══ Tipler ═══
export type DurumTipi = 'normal' | 'kuyruk' | 'yogun_kuyruk' | 'kismi_kapali' | 'kapali' | 'restorasyon';

export interface CanliDurumItem {
  id: string;
  nokta_id: string;
  nokta_isim: string;
  nokta_emoji: string;
  nokta_kategori: string;
  durum: DurumTipi;
  bekleme_dk: number | null;
  not_metni: string | null;
  kapali_bolum: string | null;
  created_at: string;
  kullanici_id: string;
  rehber_isim: string | null;
  dakika_once: number;
}

export interface SahaNokta {
  id: string;
  isim: string;
  emoji: string;
  kategori: string;
}

export interface DurumBildirPayload {
  nokta_id: string;
  durum: DurumTipi;
  bekleme_dk?: number;
  not_metni?: string;
  kapali_bolum?: string;
}

// ═══ Durum etiketleri ve renkleri ═══
export const DURUM_SECENEKLERI: { key: DurumTipi; emoji: string; label: string; renk: string }[] = [
  { key: 'normal', emoji: '🟢', label: 'Normal', renk: '#0096C7' },
  { key: 'kuyruk', emoji: '🟡', label: 'Kuyruk Var', renk: '#E09F3E' },
  { key: 'yogun_kuyruk', emoji: '🟠', label: 'Yoğun Kuyruk', renk: '#D62828' },
  { key: 'kismi_kapali', emoji: '🔶', label: 'Kısmen Kapalı', renk: '#B0D4E8' },
  { key: 'kapali', emoji: '🔴', label: 'Kapalı', renk: '#D62828' },
  { key: 'restorasyon', emoji: '🔧', label: 'Restorasyon', renk: '#7B8FA1' },
];

export function durumBilgi(durum: DurumTipi) {
  return DURUM_SECENEKLERI.find(d => d.key === durum) ?? DURUM_SECENEKLERI[0];
}

export function zamanOnce(dakika: number): string {
  if (dakika < 1) return 'Az önce';
  if (dakika < 60) return `${Math.floor(dakika)} dk önce`;
  const saat = Math.floor(dakika / 60);
  return `${saat} saat önce`;
}

// ═══ Ana Hook ═══
export function useCanliDurum() {
  const [durumlar, setDurumlar] = useState<CanliDurumItem[]>([]);
  const [noktalar, setNoktalar] = useState<SahaNokta[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Noktaları çek (bir kez)
  const noktalariCek = useCallback(async () => {
    const { data, error } = await supabase
      .from('saha_noktalari')
      .select('id, isim, emoji, kategori')
      .eq('aktif', true)
      .order('sira');
    if (error) { setHata('Noktalar yüklenemedi'); return; }
    setNoktalar(data ?? []);
  }, []);

  // Güncel durumları çek
  const durumlariCek = useCallback(async () => {
    const { data, error } = await supabase
      .from('v_canli_durum')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      // View yoksa düz sorgu yap
      const { data: d2, error: e2 } = await supabase
        .from('canli_durum')
        .select(`
          id, nokta_id, durum, bekleme_dk, not_metni, kapali_bolum,
          created_at, kullanici_id, gecerli_mi,
          saha_noktalari(isim, emoji, kategori),
          profiles(isim)
        `)
        .eq('gecerli_mi', true)
        .order('created_at', { ascending: false });
      if (!e2 && d2) {
        // Distinct on nokta_id (en son bildirim)
        const seen = new Set<string>();
        const filtered: CanliDurumItem[] = [];
        for (const row of d2) {
          if (seen.has(row.nokta_id)) continue;
          seen.add(row.nokta_id);
          const sn = row.saha_noktalari as any;
          const pr = row.profiles as any;
          filtered.push({
            id: row.id,
            nokta_id: row.nokta_id,
            nokta_isim: sn?.isim ?? row.nokta_id,
            nokta_emoji: sn?.emoji ?? '📍',
            nokta_kategori: sn?.kategori ?? 'genel',
            durum: row.durum as DurumTipi,
            bekleme_dk: row.bekleme_dk,
            not_metni: row.not_metni,
            kapali_bolum: row.kapali_bolum,
            created_at: row.created_at,
            kullanici_id: row.kullanici_id,
            rehber_isim: pr?.isim ?? null,
            dakika_once: (Date.now() - new Date(row.created_at).getTime()) / 60000,
          });
        }
        setDurumlar(filtered);
      }
      return;
    }
    setDurumlar((data ?? []) as CanliDurumItem[]);
  }, []);

  // İlk yükleme
  useEffect(() => {
    (async () => {
      setYukleniyor(true);
      await Promise.all([noktalariCek(), durumlariCek()]);
      setYukleniyor(false);
    })();
  }, [noktalariCek, durumlariCek]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('canli-durum-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'canli_durum' },
        (_payload) => {
          // Yeni bildirim geldi — tüm listeyi yenile
          durumlariCek();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'canli_durum' },
        (_payload) => {
          durumlariCek();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [durumlariCek]);

  // Durum bildir
  const durumBildir = useCallback(async (payload: DurumBildirPayload): Promise<boolean> => {
    setGonderiyor(true);
    setHata(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHata('Giriş yapmalısınız'); return false; }

      // Aynı noktaya aynı kullanıcının önceki geçerli bildirimlerini kaldır
      await supabase
        .from('canli_durum')
        .update({ gecerli_mi: false })
        .eq('nokta_id', payload.nokta_id)
        .eq('kullanici_id', user.id)
        .eq('gecerli_mi', true);

      // Yeni bildirim ekle
      const { error } = await supabase
        .from('canli_durum')
        .insert({
          nokta_id: payload.nokta_id,
          kullanici_id: user.id,
          durum: payload.durum,
          bekleme_dk: payload.bekleme_dk ?? null,
          not_metni: payload.not_metni ?? null,
          kapali_bolum: payload.kapali_bolum ?? null,
        });

      if (error) { setHata('Bildirim gönderilemedi'); return false; }
      return true;
    } catch {
      setHata('Bağlantı hatası');
      return false;
    } finally {
      setGonderiyor(false);
    }
  }, []);

  // Bildirimi geçersiz kıl (admin/moderator silme)
  const durumKaldir = useCallback(async (bildirimId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('canli_durum')
        .update({ gecerli_mi: false })
        .eq('id', bildirimId);
      if (error) { setHata('Bildirim kaldırılamadı'); return false; }
      await durumlariCek();
      return true;
    } catch {
      setHata('Bağlantı hatası');
      return false;
    }
  }, [durumlariCek]);

  // Tüm bildirimleri geçersiz kıl (admin toplu temizlik)
  const tumunuTemizle = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('canli_durum')
        .update({ gecerli_mi: false })
        .eq('gecerli_mi', true);
      if (error) { setHata('Temizleme başarısız'); return false; }
      await durumlariCek();
      return true;
    } catch {
      setHata('Bağlantı hatası');
      return false;
    }
  }, [durumlariCek]);

  // Manuel yenileme
  const yenile = useCallback(async () => {
    setYukleniyor(true);
    await durumlariCek();
    setYukleniyor(false);
  }, [durumlariCek]);

  return {
    durumlar,
    noktalar,
    yukleniyor,
    gonderiyor,
    hata,
    durumBildir,
    durumKaldir,
    tumunuTemizle,
    yenile,
  };
}
