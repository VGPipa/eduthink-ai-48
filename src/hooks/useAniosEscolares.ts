import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnioEscolar {
  id: string;
  anio_escolar: string;
  activo: boolean | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  id_institucion: string;
  created_at: string;
}

export function useAniosEscolares() {
  const { data: aniosEscolares = [], isLoading, error } = useQuery({
    queryKey: ['anios-escolares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anios_escolares')
        .select('*')
        .order('anio_escolar', { ascending: false });

      if (error) throw error;

      return (data || []) as AnioEscolar[];
    },
  });

  const anioActivo = aniosEscolares.find(a => a.activo);

  return {
    aniosEscolares,
    anioActivo,
    isLoading,
    error,
  };
}
