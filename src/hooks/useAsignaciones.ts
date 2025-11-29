import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfesor } from './useProfesor';

export interface Asignacion {
  id: string;
  id_profesor: string;
  id_materia: string; // Se mantiene el nombre del campo de BD
  id_grupo: string;
  anio_escolar: string;
  created_at: string;
  // Joined data - Estandarizado: curso (no materia)
  grupo?: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string | null;
    cantidad_alumnos: number | null;
  };
  curso?: {
    id: string;
    nombre: string;
    horas_semanales: number | null;
  };
}

export function useAsignaciones(anioEscolar?: string) {
  const { profesorId } = useProfesor();

  const { data: asignaciones = [], isLoading, error } = useQuery({
    queryKey: ['asignaciones', profesorId, anioEscolar],
    queryFn: async () => {
      if (!profesorId) return [];

      let query = supabase
        .from('asignaciones_profesor')
        .select(`
          *,
          grupo:grupos(id, nombre, grado, seccion, cantidad_alumnos),
          curso:cursos_plan(id, nombre, horas_semanales)
        `)
        .eq('id_profesor', profesorId);

      if (anioEscolar) {
        query = query.eq('anio_escolar', anioEscolar);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        grupo: Array.isArray(item.grupo) ? item.grupo[0] : item.grupo,
        curso: Array.isArray(item.curso) ? item.curso[0] : item.curso,
      })) as Asignacion[];
    },
    enabled: !!profesorId,
  });

  // Helper: Get unique groups
  const grupos = asignaciones
    .map(a => a.grupo)
    .filter((g, index, self) => 
      g && index === self.findIndex(gr => gr?.id === g.id)
    ) as Asignacion['grupo'][];

  // Helper: Get unique cursos (estandarizado)
  const cursos = asignaciones
    .map(a => a.curso)
    .filter((c, index, self) => 
      c && index === self.findIndex(cur => cur?.id === c.id)
    ) as Asignacion['curso'][];

  // Helper: Get asignaciones for a specific grupo
  const getAsignacionesByGrupo = (grupoId: string) => {
    return asignaciones.filter(a => a.id_grupo === grupoId);
  };

  // Helper: Get asignaciones for a specific curso
  const getAsignacionesByCurso = (cursoId: string) => {
    return asignaciones.filter(a => a.id_materia === cursoId);
  };

  return {
    asignaciones,
    grupos,
    cursos,
    isLoading,
    error,
    getAsignacionesByGrupo,
    getAsignacionesByCurso,
  };
}
