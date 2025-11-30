import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AlumnoRow = Database['public']['Tables']['alumnos']['Row'];
type GrupoRow = Database['public']['Tables']['grupos']['Row'];

export interface Alumno extends AlumnoRow {
  grupos?: GrupoConAnio[];
}

export interface GrupoConAnio extends GrupoRow {
  anio_escolar: string;
}

export function useAlumno() {
  const { user } = useAuth();

  const { data: alumno, isLoading: alumnoLoading, error: alumnoError } = useQuery({
    queryKey: ['alumno', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No alumno found for this user
          return null;
        }
        throw error;
      }
      return data as AlumnoRow;
    },
    enabled: !!user?.id,
  });

  const { data: grupos = [], isLoading: gruposLoading, error: gruposError } = useQuery({
    queryKey: ['alumno-grupos', alumno?.id],
    queryFn: async () => {
      if (!alumno?.id) return [];

      // First get active school year
      const { data: anioActivo, error: anioError } = await supabase
        .from('anios_escolares')
        .select('anio_escolar')
        .eq('activo', true)
        .single();

      if (anioError) {
        console.error('Error fetching active school year:', anioError);
        // Fallback to current year
      }

      const anioEscolar = anioActivo?.anio_escolar || new Date().getFullYear().toString();

      // Get grupos for this alumno and school year
      const { data, error } = await supabase
        .from('alumnos_grupo')
        .select(`
          anio_escolar,
          grupo:grupos(*)
        `)
        .eq('id_alumno', alumno.id)
        .eq('anio_escolar', anioEscolar);

      if (error) throw error;

      // Transform to flat array of grupos with anio_escolar
      const gruposConAnio: GrupoConAnio[] = (data || [])
        .filter(item => item.grupo)
        .map(item => ({
          ...(item.grupo as GrupoRow),
          anio_escolar: item.anio_escolar
        }));

      return gruposConAnio;
    },
    enabled: !!alumno?.id,
  });

  const grupoIds = grupos.map(g => g.id);

  return {
    alumno,
    alumnoId: alumno?.id,
    grupos,
    grupoIds,
    isLoading: alumnoLoading || gruposLoading,
    error: alumnoError || gruposError,
  };
}
