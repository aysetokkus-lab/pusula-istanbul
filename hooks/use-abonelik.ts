import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   Abonelik Durumu Hook'u
   ─────────────────────────────────────────
   Supabase-tabanlı deneme süresi kontrolü.
   Auth state değiştiğinde otomatik yenilenir.
   ═══════════════════════════════════════════ */

export interface AbonelikDurumu {
  yukleniyor: boolean;
  aktifAbonelik: boolean;
  denemeSuresi: boolean;
  denemeBitis: Date | null;
  kalanGun: number;
  paywallGoster: boolean;
  yenile: () => Promise<void>;
}

const DENEME_GUN = 7;

export function useAbonelik(): AbonelikDurumu {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifAbonelik, setAktifAbonelik] = useState(false);
  const [denemeSuresi, setDenemeSuresi] = useState(true); // Default: deneme aktif (engelleme)
  const [denemeBitis, setDenemeBitis] = useState<Date | null>(null);
  const [kalanGun, setKalanGun] = useState(7);
  const [authDegisti, setAuthDegisti] = useState(0);

  const kontrolEt = useCallback(async () => {
    setYukleniyor(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAktifAbonelik(false);
        setDenemeSuresi(false);
        setKalanGun(0);
        setDenemeBitis(null);
        setYukleniyor(false);
        return;
      }

      // Tek query ile hem rol hem abonelik durumunu çek
      const { data: profil, error } = await supabase
        .from('profiles')
        .select('rol, abonelik_durumu, abonelik_bitis')
        .eq('id', user.id)
        .single();

      // Profil bulunamazsa (yeni kayıt, henüz oluşmamış olabilir)
      // veya hata varsa → deneme süresini aktif say
      if (error || !profil) {
        console.log('Profil bulunamadı, deneme süresi aktif sayılıyor');
        setAktifAbonelik(false);
        setDenemeSuresi(true);
        setKalanGun(DENEME_GUN);
        setDenemeBitis(null);
        setYukleniyor(false);
        return;
      }

      // Admin/moderatör → abonelik gerekmez
      if (profil.rol === 'admin' || profil.rol === 'moderator') {
        setAktifAbonelik(true);
        setDenemeSuresi(false);
        setKalanGun(999);
        setDenemeBitis(null);
        setYukleniyor(false);
        return;
      }

      // Aktif abonelik var mı?
      if (profil.abonelik_durumu === 'aktif' && profil.abonelik_bitis) {
        const bitis = new Date(profil.abonelik_bitis);
        if (bitis > new Date()) {
          setAktifAbonelik(true);
          setDenemeSuresi(false);
          setDenemeBitis(bitis);
          setYukleniyor(false);
          return;
        }
      }

      // Deneme süresi kontrolü — kayıt tarihinden 7 gün
      const kayitTarihi = new Date(user.created_at);
      const denemeBitisT = new Date(kayitTarihi);
      denemeBitisT.setDate(denemeBitisT.getDate() + DENEME_GUN);

      const simdi = new Date();
      const kalanMs = denemeBitisT.getTime() - simdi.getTime();
      const kalanGunHesap = Math.max(0, Math.ceil(kalanMs / (1000 * 60 * 60 * 24)));

      setDenemeBitis(denemeBitisT);
      setKalanGun(kalanGunHesap);

      if (kalanGunHesap > 0) {
        setDenemeSuresi(true);
        setAktifAbonelik(false);
      } else {
        setDenemeSuresi(false);
        setAktifAbonelik(false);
      }
    } catch (e) {
      console.warn('Abonelik kontrol hatası:', e);
      // Hata → kullanıcıyı engelleme, deneme aktif say
      setAktifAbonelik(false);
      setDenemeSuresi(true);
      setKalanGun(7);
    } finally {
      setYukleniyor(false);
    }
  }, [authDegisti]);

  // Auth state değiştiğinde hook'u yeniden tetikle
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Auth değişti → kontrolü yeniden çalıştır
      setAuthDegisti(prev => prev + 1);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    kontrolEt();
  }, [kontrolEt]);

  const paywallGoster = !yukleniyor && !aktifAbonelik && !denemeSuresi;

  return {
    yukleniyor,
    aktifAbonelik,
    denemeSuresi,
    denemeBitis,
    kalanGun,
    paywallGoster,
    yenile: kontrolEt,
  };
}
