import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Materia {
  id: string;
  nombre: string;
  descripcion: string | null;
  objetivos: string | null;
  horas_semanales: number | null;
  plan_id: string;
  orden: number;
  created_at: string;
}

export function useMaterias() {
  const { data: materias = [], isLoading, error } = useQuery({
    queryKey: ['materias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cursos_plan')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      return (data || []) as Materia[];
    },
  });

  return {
    materias,
    isLoading,
    error,
  };
}
