import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAsignaciones } from './useAsignaciones';
import { useClases } from './useClases';

export interface TemaConProgreso {
  id: string;
  nombre: string;
  curso_plan_id: string;
  bimestre: number | null;
  orden: number;
  duracion_estimada: number | null;
  objetivos: string | null;
  descripcion: string | null;
  // Calculated fields
  estado: 'pendiente' | 'en_progreso' | 'completado';
  progreso: number;
  sesiones: number;
  materia?: {
    id: string;
    nombre: string;
    horas_semanales: number | null;
  };
}

export interface CursoConTemas {
  id: string;
  nombre: string;
  horas_semanales: number | null;
  progreso: number;
  temas: TemaConProgreso[];
  grupo?: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string | null;
  };
}

export function useTemasProfesor(anioEscolar?: string) {
  const { cursos, grupos, asignaciones, isLoading: asignacionesLoading } = useAsignaciones(anioEscolar);
  // Get all clases (we'll filter by grupoIds after fetching)
  const { clases: allClases, isLoading: clasesLoading } = useClases();
  
  // Filter classes by academic year - only include clases from grupos assigned this year
  const grupoIds = asignaciones.map(a => a.id_grupo).filter(Boolean) as string[];
  const clases = allClases.filter(c => grupoIds.includes(c.id_grupo));

  const { data: cursosConTemas = [], isLoading, error } = useQuery({
    queryKey: ['temas-profesor', cursos.map(c => c?.id).filter(Boolean), anioEscolar],
    queryFn: async () => {
      if (!cursos || cursos.length === 0) return [];

      const cursoIds = cursos.map(c => c?.id).filter(Boolean) as string[];

      // Get all temas for assigned cursos
      const { data: temas, error: temasError } = await supabase
        .from('temas_plan')
        .select('*')
        .in('curso_plan_id', cursoIds)
        .order('bimestre', { ascending: true, nullsFirst: true })
        .order('orden', { ascending: true });

      if (temasError) throw temasError;

      // Group temas by curso and calculate progress
      const cursosMap = new Map<string, CursoConTemas>();

      cursos.forEach((curso) => {
        if (!curso) return;

        const temasCurso = (temas || []).filter(t => t.curso_plan_id === curso.id);

        // Calculate progress for each tema
        const temasConProgreso: TemaConProgreso[] = temasCurso.map((tema) => {
          // Find clases for this tema
          const clasesTema = clases.filter(c => c.id_tema === tema.id);

          // Calculate estado and progreso
          let estado: 'pendiente' | 'en_progreso' | 'completado' = 'pendiente';
          let progreso = 0;
          let sesiones = 0;

          if (clasesTema.length > 0) {
            const clasesCompletadas = clasesTema.filter(c => c.estado === 'completada').length;
            const clasesEnProgreso = clasesTema.filter(c => 
              c.estado === 'en_clase' || 
              c.estado === 'clase_programada' || 
              c.estado === 'guia_aprobada' ||
              c.estado === 'editando_guia'
            ).length;

            sesiones = clasesTema.length;

            if (clasesCompletadas === clasesTema.length && clasesTema.length > 0) {
              estado = 'completado';
              progreso = 100;
            } else if (clasesEnProgreso > 0 || clasesCompletadas > 0) {
              estado = 'en_progreso';
              progreso = Math.round((clasesCompletadas / Math.max(clasesTema.length, 1)) * 100);
            }
          }

          return {
            ...tema,
            estado,
            progreso,
            sesiones,
            materia: {
              id: curso.id,
              nombre: curso.nombre,
              horas_semanales: curso.horas_semanales,
            },
          } as TemaConProgreso;
        });

        // Calculate curso progress
        const totalTemas = temasConProgreso.length;
        const temasCompletados = temasConProgreso.filter(t => t.estado === 'completado').length;
        const progresoCurso = totalTemas > 0 
          ? Math.round((temasCompletados / totalTemas) * 100)
          : 0;

        // Find grupo for this curso (from asignaciones)
        // Get the first asignacion for this curso to find its grupo
        const asignacionCurso = asignaciones.find(a => a.id_materia === curso.id);
        const grupo = asignacionCurso?.grupo;

        cursosMap.set(curso.id, {
          id: curso.id,
          nombre: curso.nombre,
          horas_semanales: curso.horas_semanales,
          progreso: progresoCurso,
          temas: temasConProgreso,
          grupo: grupo || undefined,
        });
      });

      return Array.from(cursosMap.values());
    },
    enabled: !asignacionesLoading && cursos.length > 0,
  });

  // Helper: Get temas grouped by bimestre
  const getTemasByBimestre = (cursoId: string) => {
    const curso = cursosConTemas.find(c => c.id === cursoId);
    if (!curso) return [];

    const bimestresMap = new Map<number, TemaConProgreso[]>();

    curso.temas.forEach((tema) => {
      const bimestre = tema.bimestre || 1;
      if (!bimestresMap.has(bimestre)) {
        bimestresMap.set(bimestre, []);
      }
      bimestresMap.get(bimestre)!.push(tema);
    });

    return Array.from(bimestresMap.entries())
      .map(([numero, temas]) => ({
        numero,
        nombre: `Bimestre ${numero}`,
        temas,
        progreso: temas.length > 0
          ? Math.round(temas.reduce((sum, t) => sum + t.progreso, 0) / temas.length)
          : 0,
      }))
      .sort((a, b) => a.numero - b.numero);
  };

  // Calculate stats
  const stats = {
    totalTemas: cursosConTemas.reduce((sum, c) => sum + c.temas.length, 0),
    temasCompletados: cursosConTemas.reduce(
      (sum, c) => sum + c.temas.filter(t => t.estado === 'completado').length,
      0
    ),
    materiasAsignadas: cursosConTemas.length,
    progresoGeneral: cursosConTemas.length > 0
      ? Math.round(
          cursosConTemas.reduce((sum, c) => sum + c.progreso, 0) / cursosConTemas.length
        )
      : 0,
  };

  return {
    cursosConTemas,
    isLoading: isLoading || asignacionesLoading || clasesLoading,
    error,
    getTemasByBimestre,
    stats,
  };
}

