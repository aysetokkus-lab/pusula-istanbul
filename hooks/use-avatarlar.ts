import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ─── Oturum içi önbellek (id → url | null) + değişiklik dinleyicileri ───
   lib/avatar.ts (yükle/kaldır) buradan yazar; native bağımlılık yok, her ekran güvenle import eder. */
export const avatarOnbellek = new Map<string, string | null>();
const dinleyiciler = new Set<() => void>();
export function avatarDinle(fn: () => void): () => void {
  dinleyiciler.add(fn);
  return () => { dinleyiciler.delete(fn); };
}
export function avatarDinleyicileriUyar() {
  dinleyiciler.forEach(fn => { try { fn(); } catch {} });
}

/* ═══════════════════════════════════════════
   useAvatarlar (Eyl 2026) — id listesi için profil fotoğrafı URL'leri
   useTurebRozetleri ile aynı desen: eksik id'ler toplu okunur, oturum önbelleğine
   yazılır; kendi fotoğrafın değişince (avatarYukle/avatarKaldir) dinleyiciyle yenilenir.
   Kullanım: const avatarlar = useAvatarlar(ids); <Avatar url={avatarlar[id]} isim=... />
   ═══════════════════════════════════════════ */
export function useAvatarlar(ids: string[]): Record<string, string | null> {
  const [harita, setHarita] = useState<Record<string, string | null>>({});
  const anahtar = ids.filter(Boolean).sort().join(',');
  const [sayac, setSayac] = useState(0);

  useEffect(() => avatarDinle(() => setSayac(s => s + 1)), []);

  useEffect(() => {
    const liste = anahtar ? anahtar.split(',') : [];
    const eksik = liste.filter(id => !avatarOnbellek.has(id));
    const uygula = () => {
      const h: Record<string, string | null> = {};
      for (const id of liste) { const v = avatarOnbellek.get(id); if (v !== undefined) h[id] = v; }
      setHarita(h);
    };
    if (!eksik.length) { uygula(); return; }
    let iptal = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('id, avatar_url').in('id', eksik);
      for (const p of data ?? []) avatarOnbellek.set(p.id, p.avatar_url ?? null);
      for (const id of eksik) if (!avatarOnbellek.has(id)) avatarOnbellek.set(id, null);
      if (!iptal) uygula();
    })();
    return () => { iptal = true; };
  }, [anahtar, sayac]);

  return harita;
}

/** Tek kullanıcı (DM başlığı vb.) */
export function useAvatar(id: string | null | undefined): string | null {
  const h = useAvatarlar(id ? [id] : []);
  return id ? (h[id] ?? null) : null;
}
