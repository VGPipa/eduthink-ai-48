import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfesor } from './useProfesor';

// Tipos para las métricas del salón
export interface ResumenSalon {
  participacion: number;
  alumnosRequierenRefuerzo: number;
  porcentajeRefuerzo: number;
  desempeno: number;
}

export interface MetricasPRE {
  participacion: number;
  nivelPreparacion: number;
  conceptosRefuerzo: { nombre: string; porcentajeAcierto: number }[];
}

export interface MetricasPOST {
  participacion: number;
  nivelDesempeno: number;
  alumnosRefuerzo: { id: string; nombre: string; porcentaje: number }[];
}

export interface RecomendacionSalon {
  id: string;
  tipo: 'refuerzo' | 'extension' | 'practica';
  titulo: string;
  descripcion: string;
}

export interface GrupoConMetricas {
  id: string;
  nombre: string;
  grado: string;
  seccion: string | null;
  cantidadAlumnos: number;
}

export interface AsignacionConMetricas {
  id: string;
  materia: { id: string; nombre: string };
  grupo: { id: string; nombre: string; grado: string; seccion: string | null; cantidad_alumnos: number };
  promedio: number;
  totalQuizzes: number;
  asistencia: number;
}

export interface MetricasGlobales {
  promedioGeneral: number;
  totalAlumnos: number;
  quizzesCompletados: number;
  participacion: number;
}

// Hook para obtener métricas globales del profesor
export function useMetricasGlobalesProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['metricas-globales-profesor', profesor?.id],
    queryFn: async (): Promise<MetricasGlobales> => {
      if (!profesor?.id) {
        return { promedioGeneral: 0, totalAlumnos: 0, quizzesCompletados: 0, participacion: 0 };
      }

      // Obtener todas las asignaciones del profesor
      const { data: asignaciones, error } = await supabase
        .from('asignaciones_profesor')
        .select('id_grupo')
        .eq('id_profesor', profesor.id);

      if (error) throw error;
      if (!asignaciones || asignaciones.length === 0) {
        return { promedioGeneral: 0, totalAlumnos: 0, quizzesCompletados: 0, participacion: 0 };
      }

      const grupoIds = [...new Set(asignaciones.map(a => a.id_grupo))];

      // Obtener alumnos únicos de todos los grupos
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select('id_alumno')
        .in('id_grupo', grupoIds);

      const alumnosUnicos = new Set(alumnosGrupo?.map(a => a.id_alumno) || []);
      const totalAlumnos = alumnosUnicos.size;
      const alumnoIds = Array.from(alumnosUnicos);

      // Obtener todas las clases del profesor
      const { data: clases } = await supabase
        .from('clases')
        .select('id')
        .eq('id_profesor', profesor.id);

      const claseIds = clases?.map(c => c.id) || [];

      if (claseIds.length === 0 || totalAlumnos === 0) {
        return { promedioGeneral: 0, totalAlumnos, quizzesCompletados: 0, participacion: 0 };
      }

      // Obtener todos los quizzes de las clases
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id')
        .in('id_clase', claseIds);

      const quizIds = quizzes?.map(q => q.id) || [];

      if (quizIds.length === 0) {
        return { promedioGeneral: 0, totalAlumnos, quizzesCompletados: 0, participacion: 0 };
      }

      // Obtener notas de los alumnos
      const { data: respuestas } = await supabase
        .from('nota_alumno')
        .select('id_alumno, puntaje_total, estado')
        .in('id_quiz', quizIds)
        .in('id_alumno', alumnoIds);

      // Calcular métricas
      const respuestasCompletadas = respuestas?.filter(r => r.estado === 'completado') || [];
      const quizzesCompletados = respuestasCompletadas.length;

      // Promedio general
      const puntajes = respuestasCompletadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const promedioGeneral = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Participación: alumnos únicos que han completado al menos un quiz
      const alumnosQueCompletaron = new Set(respuestasCompletadas.map(r => r.id_alumno));
      const participacion = totalAlumnos > 0
        ? Math.round((alumnosQueCompletaron.size / totalAlumnos) * 100)
        : 0;

      return {
        promedioGeneral,
        totalAlumnos,
        quizzesCompletados,
        participacion,
      };
    },
    enabled: !!profesor?.id,
  });
}

// Hook para obtener las asignaciones del profesor con métricas
export function useAsignacionesProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['asignaciones-profesor-metricas', profesor?.id],
    queryFn: async (): Promise<AsignacionConMetricas[]> => {
      if (!profesor?.id) return [];

      // Obtener asignaciones con grupos y materias
      const { data: asignaciones, error } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id,
          id_grupo,
          id_materia,
          grupos (
            id,
            nombre,
            grado,
            seccion,
            cantidad_alumnos
          ),
          cursos_plan (
            id,
            nombre
          )
        `)
        .eq('id_profesor', profesor.id);

      if (error) throw error;
      if (!asignaciones || asignaciones.length === 0) return [];

      // Para cada asignación, calcular métricas
      const asignacionesConMetricas: AsignacionConMetricas[] = [];

      for (const asig of asignaciones) {
        const grupo = asig.grupos as any;
        const materia = asig.cursos_plan as any;
        
        if (!grupo || !materia) continue;

        // Obtener alumnos del grupo
        const { data: alumnosGrupo } = await supabase
          .from('alumnos_grupo')
          .select('id_alumno')
          .eq('id_grupo', grupo.id);

        const totalAlumnos = alumnosGrupo?.length || 0;
        const alumnoIds = alumnosGrupo?.map(a => a.id_alumno) || [];

        // Obtener temas de la materia
        const { data: temas } = await supabase
          .from('temas_plan')
          .select('id')
          .eq('curso_plan_id', materia.id);

        const temaIds = temas?.map(t => t.id) || [];

        if (temaIds.length === 0) {
          asignacionesConMetricas.push({
            id: asig.id,
            materia: { id: materia.id, nombre: materia.nombre },
            grupo: { id: grupo.id, nombre: grupo.nombre, grado: grupo.grado, seccion: grupo.seccion, cantidad_alumnos: grupo.cantidad_alumnos || 0 },
            promedio: 0,
            totalQuizzes: 0,
            asistencia: 0,
          });
          continue;
        }

        // Obtener clases de esos temas en ese grupo
        const { data: clases } = await supabase
          .from('clases')
          .select('id')
          .eq('id_grupo', grupo.id)
          .in('id_tema', temaIds);

        const claseIds = clases?.map(c => c.id) || [];

        if (claseIds.length === 0) {
          asignacionesConMetricas.push({
            id: asig.id,
            materia: { id: materia.id, nombre: materia.nombre },
            grupo: { id: grupo.id, nombre: grupo.nombre, grado: grupo.grado, seccion: grupo.seccion, cantidad_alumnos: grupo.cantidad_alumnos || 0 },
            promedio: 0,
            totalQuizzes: 0,
            asistencia: 0,
          });
          continue;
        }

        // Obtener quizzes de esas clases
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id')
          .in('id_clase', claseIds);

        const quizIds = quizzes?.map(q => q.id) || [];
        const totalQuizzes = quizIds.length;

        if (totalQuizzes === 0 || totalAlumnos === 0) {
          asignacionesConMetricas.push({
            id: asig.id,
            materia: { id: materia.id, nombre: materia.nombre },
            grupo: { id: grupo.id, nombre: grupo.nombre, grado: grupo.grado, seccion: grupo.seccion, cantidad_alumnos: grupo.cantidad_alumnos || 0 },
            promedio: 0,
            totalQuizzes: 0,
            asistencia: 0,
          });
          continue;
        }

        // Obtener notas de los alumnos
        const { data: respuestas } = await supabase
          .from('nota_alumno')
          .select('id_alumno, puntaje_total, estado')
          .in('id_quiz', quizIds)
          .in('id_alumno', alumnoIds);

        // Calcular métricas
        const completadas = respuestas?.filter(r => r.estado === 'completado') || [];
        const puntajes = completadas
          .filter(r => r.puntaje_total !== null)
          .map(r => r.puntaje_total as number);
        
        const promedio = puntajes.length > 0
          ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
          : 0;

        const alumnosQueCompletaron = new Set(completadas.map(r => r.id_alumno));
        const asistencia = Math.round((alumnosQueCompletaron.size / totalAlumnos) * 100);

        asignacionesConMetricas.push({
          id: asig.id,
          materia: { id: materia.id, nombre: materia.nombre },
          grupo: { id: grupo.id, nombre: grupo.nombre, grado: grupo.grado, seccion: grupo.seccion, cantidad_alumnos: grupo.cantidad_alumnos || 0 },
          promedio,
          totalQuizzes,
          asistencia,
        });
      }

      return asignacionesConMetricas;
    },
    enabled: !!profesor?.id,
  });
}

// Hook para obtener los grupos/salones asignados al profesor
export function useGruposProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['grupos-profesor', profesor?.id],
    queryFn: async () => {
      if (!profesor?.id) return [];

      const { data, error } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id_grupo,
          grupos (
            id,
            nombre,
            grado,
            seccion,
            cantidad_alumnos
          )
        `)
        .eq('id_profesor', profesor.id);

      if (error) throw error;

      // Eliminar duplicados y mapear
      const gruposUnicos = new Map<string, GrupoConMetricas>();
      data?.forEach((asig) => {
        const grupo = asig.grupos as any;
        if (grupo && !gruposUnicos.has(grupo.id)) {
          gruposUnicos.set(grupo.id, {
            id: grupo.id,
            nombre: grupo.nombre,
            grado: grupo.grado,
            seccion: grupo.seccion,
            cantidadAlumnos: grupo.cantidad_alumnos || 0,
          });
        }
      });

      return Array.from(gruposUnicos.values());
    },
    enabled: !!profesor?.id,
  });
}

// Hook para obtener las materias de un grupo específico
export function useMateriasGrupo(grupoId: string | null) {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['materias-grupo', grupoId, profesor?.id],
    queryFn: async () => {
      if (!grupoId || !profesor?.id) return [];

      const { data, error } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id_materia,
          cursos_plan (
            id,
            nombre
          )
        `)
        .eq('id_profesor', profesor.id)
        .eq('id_grupo', grupoId);

      if (error) throw error;

      return data?.map((asig) => {
        const curso = asig.cursos_plan as any;
        return {
          id: curso?.id || asig.id_materia,
          nombre: curso?.nombre || 'Sin nombre',
        };
      }) || [];
    },
    enabled: !!grupoId && !!profesor?.id,
  });
}

// Hook para obtener los temas de una materia
export function useTemasMateria(materiaId: string | null) {
  return useQuery({
    queryKey: ['temas-materia', materiaId],
    queryFn: async () => {
      if (!materiaId) return [];

      const { data, error } = await supabase
        .from('temas_plan')
        .select('id, nombre, orden')
        .eq('curso_plan_id', materiaId)
        .order('orden');

      if (error) throw error;
      return data || [];
    },
    enabled: !!materiaId,
  });
}

// Hook para obtener las clases/sesiones de un tema desde guias_tema.estructura_sesiones
export function useClasesTema(temaId: string | null, grupoId: string | null) {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['clases-tema', temaId, grupoId, profesor?.id],
    queryFn: async () => {
      if (!temaId || !profesor?.id) return [];

      // Obtener estructura_sesiones de guias_tema
      const { data: guiaTema, error: guiaError } = await supabase
        .from('guias_tema')
        .select('id, estructura_sesiones, total_sesiones')
        .eq('id_tema', temaId)
        .eq('id_profesor', profesor.id)
        .maybeSingle();

      if (guiaError) throw guiaError;

      // Si existe guia_tema con estructura_sesiones, usarla
      if (guiaTema?.estructura_sesiones && Array.isArray(guiaTema.estructura_sesiones)) {
        const sesiones = guiaTema.estructura_sesiones as Array<{ numero?: number; nombre?: string }>;
        
        // También obtener clases existentes para mapear IDs
        const { data: clasesExistentes } = await supabase
          .from('clases')
          .select('id, numero_sesion, fecha_programada, estado')
          .eq('id_tema', temaId)
          .eq('id_profesor', profesor.id)
          .order('numero_sesion');

        return sesiones.map((sesion, index) => {
          const numeroSesion = sesion.numero || index + 1;
          const claseExistente = clasesExistentes?.find(c => c.numero_sesion === numeroSesion);
          
          return {
            id: claseExistente?.id || `virtual-${numeroSesion}`,
            numero_sesion: numeroSesion,
            fecha_programada: claseExistente?.fecha_programada || null,
            estado: claseExistente?.estado || 'borrador',
            nombre: sesion.nombre || `Clase ${numeroSesion}`,
            es_virtual: !claseExistente
          };
        });
      }

      // Fallback: si no hay guia_tema, obtener clases directamente
      const { data, error } = await supabase
        .from('clases')
        .select('id, numero_sesion, fecha_programada, estado')
        .eq('id_tema', temaId)
        .eq('id_profesor', profesor.id)
        .order('numero_sesion');

      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        nombre: `Clase ${c.numero_sesion || 1}`,
        es_virtual: false
      }));
    },
    enabled: !!temaId && !!profesor?.id,
  });
}

// Hook para obtener el resumen del salón
export function useResumenSalon(grupoId: string | null, filtros?: { materiaId?: string; temaId?: string; claseId?: string }) {
  return useQuery({
    queryKey: ['resumen-salon', grupoId, filtros],
    queryFn: async (): Promise<ResumenSalon> => {
      if (!grupoId) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      // Obtener alumnos del grupo
      const { data: alumnosGrupo, error: errorAlumnos } = await supabase
        .from('alumnos_grupo')
        .select('id_alumno')
        .eq('id_grupo', grupoId);

      if (errorAlumnos) throw errorAlumnos;
      const totalAlumnos = alumnosGrupo?.length || 0;
      if (totalAlumnos === 0) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      const alumnoIds = alumnosGrupo?.map(a => a.id_alumno) || [];

      // Construir query de clases con filtros
      let clasesQuery = supabase
        .from('clases')
        .select('id')
        .eq('id_grupo', grupoId);

      if (filtros?.temaId) {
        clasesQuery = clasesQuery.eq('id_tema', filtros.temaId);
      }

      const { data: clases } = await clasesQuery;
      const claseIds = clases?.map(c => c.id) || [];

      if (claseIds.length === 0) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      // Obtener quizzes de esas clases
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id')
        .in('id_clase', claseIds);

      const quizIds = quizzes?.map(q => q.id) || [];

      if (quizIds.length === 0) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      // Obtener notas de los alumnos del grupo
      const { data: respuestas } = await supabase
        .from('nota_alumno')
        .select('id_alumno, puntaje_total, estado')
        .in('id_quiz', quizIds)
        .in('id_alumno', alumnoIds);

      // Calcular métricas
      const respuestasCompletadas = respuestas?.filter(r => r.estado === 'completado') || [];
      const alumnosQueCompletaron = new Set(respuestasCompletadas.map(r => r.id_alumno));
      const participacion = Math.round((alumnosQueCompletaron.size / totalAlumnos) * 100);

      // Calcular desempeño promedio
      const puntajes = respuestasCompletadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const desempeno = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Calcular alumnos en riesgo (promedio < 60)
      const promediosPorAlumno = new Map<string, number[]>();
      respuestasCompletadas.forEach(r => {
        if (r.puntaje_total !== null) {
          const lista = promediosPorAlumno.get(r.id_alumno) || [];
          lista.push(r.puntaje_total);
          promediosPorAlumno.set(r.id_alumno, lista);
        }
      });

      let alumnosEnRiesgo = 0;
      promediosPorAlumno.forEach((puntajes) => {
        const promedio = puntajes.reduce((a, b) => a + b, 0) / puntajes.length;
        if (promedio < 60) alumnosEnRiesgo++;
      });

      return {
        participacion,
        alumnosRequierenRefuerzo: alumnosEnRiesgo,
        porcentajeRefuerzo: totalAlumnos > 0 ? Math.round((alumnosEnRiesgo / totalAlumnos) * 100) : 0,
        desempeno,
      };
    },
    enabled: !!grupoId,
  });
}

// Hook para obtener métricas PRE de un salón
export function useMetricasPRE(grupoId: string | null, filtros?: { materiaId?: string; temaId?: string; claseId?: string }) {
  return useQuery({
    queryKey: ['metricas-pre', grupoId, filtros],
    queryFn: async (): Promise<MetricasPRE> => {
      if (!grupoId) {
        return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
      }

      // Obtener alumnos del grupo
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select('id_alumno')
        .eq('id_grupo', grupoId);

      const totalAlumnos = alumnosGrupo?.length || 0;
      const alumnoIds = alumnosGrupo?.map(a => a.id_alumno) || [];

      if (totalAlumnos === 0) {
        return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
      }

      // Obtener clases del grupo
      let clasesQuery = supabase
        .from('clases')
        .select('id')
        .eq('id_grupo', grupoId);

      if (filtros?.temaId) {
        clasesQuery = clasesQuery.eq('id_tema', filtros.temaId);
      }
      if (filtros?.claseId) {
        clasesQuery = clasesQuery.eq('id', filtros.claseId);
      }

      const { data: clases } = await clasesQuery;
      const claseIds = clases?.map(c => c.id) || [];

      if (claseIds.length === 0) {
        return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
      }

      // Obtener quizzes PRE
      const { data: quizzesPre } = await supabase
        .from('quizzes')
        .select('id')
        .in('id_clase', claseIds)
        .eq('tipo', 'previo');

      const quizPreIds = quizzesPre?.map(q => q.id) || [];

      if (quizPreIds.length === 0) {
        return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
      }

      // Obtener notas PRE
      const { data: respuestasPre } = await supabase
        .from('nota_alumno')
        .select('id, id_alumno, puntaje_total, estado')
        .in('id_quiz', quizPreIds)
        .in('id_alumno', alumnoIds);

      const completadas = respuestasPre?.filter(r => r.estado === 'completado') || [];
      const participacion = Math.round((new Set(completadas.map(r => r.id_alumno)).size / totalAlumnos) * 100);

      const puntajes = completadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const nivelPreparacion = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Obtener conceptos débiles desde las preguntas
      const respuestaIds = completadas.map(r => r.id);
      if (respuestaIds.length === 0) {
        return { participacion, nivelPreparacion, conceptosRefuerzo: [] };
      }

      const { data: detalles } = await supabase
        .from('respuestas_detalle')
        .select(`
          es_correcta,
          preguntas (
            concepto
          )
        `)
        .in('id_nota_alumno', respuestaIds);

      // Agrupar por concepto
      const conceptoStats = new Map<string, { correctas: number; total: number }>();
      detalles?.forEach((d) => {
        const pregunta = d.preguntas as any;
        const concepto = pregunta?.concepto || 'Concepto no identificado';

        const stats = conceptoStats.get(concepto) || { correctas: 0, total: 0 };
        stats.total++;
        if (d.es_correcta) stats.correctas++;
        conceptoStats.set(concepto, stats);
      });

      // Calcular porcentajes y filtrar los débiles
      const conceptosRefuerzo = Array.from(conceptoStats.entries())
        .map(([nombre, stats]) => ({
          nombre,
          porcentajeAcierto: Math.round((stats.correctas / stats.total) * 100),
        }))
        .filter(c => c.porcentajeAcierto < 75)
        .sort((a, b) => a.porcentajeAcierto - b.porcentajeAcierto)
        .slice(0, 5);

      return { participacion, nivelPreparacion, conceptosRefuerzo };
    },
    enabled: !!grupoId,
  });
}

// Hook para obtener métricas POST de un salón
export function useMetricasPOST(grupoId: string | null, filtros?: { materiaId?: string; temaId?: string; claseId?: string }) {
  return useQuery({
    queryKey: ['metricas-post', grupoId, filtros],
    queryFn: async (): Promise<MetricasPOST> => {
      if (!grupoId) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Obtener alumnos del grupo con sus perfiles
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select(`
          id_alumno,
          alumnos (
            id,
            user_id
          )
        `)
        .eq('id_grupo', grupoId);

      const totalAlumnos = alumnosGrupo?.length || 0;
      const alumnoIds = alumnosGrupo?.map(a => a.id_alumno) || [];

      if (totalAlumnos === 0) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Obtener clases del grupo
      let clasesQuery = supabase
        .from('clases')
        .select('id')
        .eq('id_grupo', grupoId);

      if (filtros?.temaId) {
        clasesQuery = clasesQuery.eq('id_tema', filtros.temaId);
      }
      if (filtros?.claseId) {
        clasesQuery = clasesQuery.eq('id', filtros.claseId);
      }

      const { data: clases } = await clasesQuery;
      const claseIds = clases?.map(c => c.id) || [];

      if (claseIds.length === 0) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Obtener quizzes POST
      const { data: quizzesPost } = await supabase
        .from('quizzes')
        .select('id')
        .in('id_clase', claseIds)
        .eq('tipo', 'post');

      const quizPostIds = quizzesPost?.map(q => q.id) || [];

      if (quizPostIds.length === 0) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Obtener notas POST
      const { data: respuestasPost } = await supabase
        .from('nota_alumno')
        .select('id_alumno, puntaje_total, estado')
        .in('id_quiz', quizPostIds)
        .in('id_alumno', alumnoIds);

      const completadas = respuestasPost?.filter(r => r.estado === 'completado') || [];
      const participacion = Math.round((new Set(completadas.map(r => r.id_alumno)).size / totalAlumnos) * 100);

      const puntajes = completadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const nivelDesempeno = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Calcular promedios por alumno para encontrar los de bajo rendimiento
      const promediosPorAlumno = new Map<string, number[]>();
      completadas.forEach(r => {
        if (r.puntaje_total !== null) {
          const lista = promediosPorAlumno.get(r.id_alumno) || [];
          lista.push(r.puntaje_total);
          promediosPorAlumno.set(r.id_alumno, lista);
        }
      });

      // Obtener perfiles de los alumnos para los nombres
      const userIds = alumnosGrupo
        ?.map(a => (a.alumnos as any)?.user_id)
        .filter(Boolean) || [];

      const { data: perfiles } = await supabase
        .from('profiles')
        .select('user_id, nombre, apellido')
        .in('user_id', userIds);

      const perfilMap = new Map<string, string>();
      perfiles?.forEach(p => {
        perfilMap.set(p.user_id!, `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre');
      });

      // Construir lista de alumnos en riesgo
      const alumnosRefuerzo: { id: string; nombre: string; porcentaje: number }[] = [];
      promediosPorAlumno.forEach((puntajes, alumnoId) => {
        const promedio = Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);
        if (promedio < 60) {
          const alumnoData = alumnosGrupo?.find(a => a.id_alumno === alumnoId);
          const userId = (alumnoData?.alumnos as any)?.user_id;
          const nombre = userId ? perfilMap.get(userId) || 'Sin nombre' : 'Sin nombre';
          alumnosRefuerzo.push({ id: alumnoId, nombre, porcentaje: promedio });
        }
      });

      alumnosRefuerzo.sort((a, b) => a.porcentaje - b.porcentaje);

      return { participacion, nivelDesempeno, alumnosRefuerzo: alumnosRefuerzo.slice(0, 5) };
    },
    enabled: !!grupoId,
  });
}

// Hook para obtener recomendaciones de un salón/clase
export function useRecomendacionesSalon(grupoId: string | null, filtros?: { quizId?: string }) {
  return useQuery({
    queryKey: ['recomendaciones-salon', grupoId, filtros],
    queryFn: async (): Promise<RecomendacionSalon[]> => {
      if (!grupoId) return [];

      // Obtener clases del grupo
      const { data: clases } = await supabase
        .from('clases')
        .select('id')
        .eq('id_grupo', grupoId);

      const claseIds = clases?.map(c => c.id) || [];

      if (claseIds.length === 0) return [];

      // Obtener quizzes de esas clases
      let quizzesQuery = supabase
        .from('quizzes')
        .select('id')
        .in('id_clase', claseIds);

      if (filtros?.quizId) {
        quizzesQuery = quizzesQuery.eq('id', filtros.quizId);
      }

      const { data: quizzes } = await quizzesQuery;
      const quizIds = quizzes?.map(q => q.id) || [];

      if (quizIds.length === 0) return [];

      // Obtener recomendaciones
      const { data: recomendaciones } = await supabase
        .from('recomendaciones')
        .select('id, contenido')
        .in('id_quiz', quizIds)
        .order('created_at', { ascending: false })
        .limit(5);

      return recomendaciones?.map(r => ({
        id: r.id,
        tipo: 'refuerzo' as const,
        titulo: r.contenido?.split('.')[0]?.replace('[DEMO]', '').trim() || 'Recomendación',
        descripcion: r.contenido?.replace('[DEMO]', '').trim() || '',
      })) || [];
    },
    enabled: !!grupoId,
  });
}

// Hook para generar recomendaciones con IA basadas en conceptos débiles
export function useRecomendacionesIA(conceptosDebiles: { nombre: string; porcentajeAcierto: number }[], tipo: 'PRE' | 'POST') {
  // Genera recomendaciones dinámicas basadas en los conceptos débiles
  // TODO: Integrar con servicio de IA real
  
  if (!conceptosDebiles || conceptosDebiles.length === 0) {
    return {
      recomendacion: null,
      isLoading: false,
    };
  }

  const conceptoMasDebil = conceptosDebiles[0];
  
  const recomendacion: RecomendacionSalon = tipo === 'PRE' 
    ? {
        id: 'ia-pre',
        tipo: 'refuerzo',
        titulo: `Refuerza el concepto de ${conceptoMasDebil.nombre}`,
        descripcion: `El grupo muestra solo ${conceptoMasDebil.porcentajeAcierto}% de aciertos en este concepto. Considera activar conocimientos previos o usar ejemplos visuales antes de abordar el tema.`,
      }
    : {
        id: 'ia-post',
        tipo: 'refuerzo',
        titulo: `Fortalece la comprensión de ${conceptoMasDebil.nombre}`,
        descripcion: `Incluye un mini-ejercicio de refuerzo sobre este concepto durante el calentamiento de la siguiente clase.`,
      };

  return {
    recomendacion,
    isLoading: false,
  };
}

