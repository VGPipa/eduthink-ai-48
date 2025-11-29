import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfesorWithProfile {
  id: string;
  user_id: string | null;
  especialidad: string | null;
  activo: boolean | null;
  created_at: string;
  profile?: {
    nombre: string | null;
    apellido: string | null;
    email: string | null;
  };
}

export function useProfesores() {
  const { data: profesores = [], isLoading, error, refetch } = useQuery({
    queryKey: ['profesores'],
    staleTime: 0, // Datos siempre se consideran obsoletos
    gcTime: 0, // No cachear
    queryFn: async () => {
      // Primero obtenemos los profesores
      const { data: profesoresData, error: profesoresError } = await supabase
        .from('profesores')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (profesoresError) throw profesoresError;
      if (!profesoresData || profesoresData.length === 0) return [];

      // Obtenemos los IDs de usuarios únicos
      const userIds = profesoresData
        .map(p => p.user_id)
        .filter((id): id is string => id !== null);

      if (userIds.length === 0) return profesoresData.map(p => ({ ...p, profile: null }));

      // Obtenemos los perfiles correspondientes
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nombre, apellido, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Creamos un mapa de perfiles por user_id
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Combinamos los datos
      return profesoresData.map(profesor => ({
        ...profesor,
        profile: profesor.user_id ? profilesMap.get(profesor.user_id) || null : null,
      })) as ProfesorWithProfile[];
    },
  });

  return {
    profesores,
    isLoading,
    error,
    refetch,
  };
}
