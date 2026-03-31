import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Rol = 'admin' | 'moderator' | 'user';

interface AdminState {
  rol: Rol;
  isAdmin: boolean;       // admin mi?
  isMod: boolean;         // moderator mi?
  isYetkili: boolean;     // admin VEYA moderator mi?
  yukleniyor: boolean;
}

export function useAdmin(): AdminState {
  const [rol, setRol] = useState<Rol>('user');
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const kontrol = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setYukleniyor(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single();

      if (data?.rol) setRol(data.rol as Rol);
      setYukleniyor(false);
    };

    kontrol();
  }, []);

  return {
    rol,
    isAdmin: rol === 'admin',
    isMod: rol === 'moderator',
    isYetkili: rol === 'admin' || rol === 'moderator',
    yukleniyor,
  };
}
