import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Grupo {
  id: string;
  nombre: string;
  grado: string;
  seccion: string | null;
  cantidad_alumnos: number | null;
  id_institucion: string;
  created_at: string;
}

export function useGrupos() {
  const { data: grupos = [], isLoading, error } = useQuery({
    queryKey: ['grupos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grupos')
        .select('*')
        .order('grado', { ascending: true })
        .order('seccion', { ascending: true });

      if (error) throw error;

      return (data || []) as Grupo[];
    },
  });

  return {
    grupos,
    isLoading,
    error,
  };
}
