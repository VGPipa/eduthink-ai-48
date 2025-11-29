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
  const { data: profesores = [], isLoading, error } = useQuery({
    queryKey: ['profesores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profesores')
        .select(`
          *,
          profile:profiles(nombre, apellido, email)
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      })) as ProfesorWithProfile[];
    },
  });

  return {
    profesores,
    isLoading,
    error,
  };
}
