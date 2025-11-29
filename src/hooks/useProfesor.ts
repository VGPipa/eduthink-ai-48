import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profesor {
  id: string;
  user_id: string;
  especialidad: string | null;
  activo: boolean | null;
  created_at: string;
}

export function useProfesor() {
  const { user } = useAuth();

  const { data: profesor, isLoading, error } = useQuery({
    queryKey: ['profesor', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profesores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Si no existe el profesor, podría ser un error esperado
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Profesor;
    },
    enabled: !!user,
  });

  return {
    profesor,
    profesorId: profesor?.id || null,
    isLoading,
    error,
  };
}

