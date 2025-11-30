import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfesor } from './useProfesor';

// Cache times for React Query
const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 10 * 60 * 1000; // 10 minutos

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

// Hook para obtener métricas globales del profesor (OPTIMIZADO)
export function useMetricasGlobalesProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['metricas-globales-profesor', profesor?.id],
    queryFn: async (): Promise<MetricasGlobales> => {
      if (!profesor?.id) {
        return { promedioGeneral: 0, totalAlumnos: 0, quizzesCompletados: 0, participacion: 0 };
      }

      // Una sola consulta para obtener clases con quizzes y notas usando joins
      const { data: clasesConDatos, error } = await supabase
        .from('clases')
        .select(`
          id,
          id_grupo,
          quizzes (
            id,
            nota_alumno (
              id_alumno,
              puntaje_total,
              estado
            )
          )
        `)
        .eq('id_profesor', profesor.id);

      if (error) throw error;

      // Obtener grupos únicos de las clases
      const grupoIds = [...new Set(clasesConDatos?.map(c => c.id_grupo) || [])];
      
      if (grupoIds.length === 0) {
        return { promedioGeneral: 0, totalAlumnos: 0, quizzesCompletados: 0, participacion: 0 };
      }

      // Una consulta para todos los alumnos de esos grupos
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select('id_alumno')
        .in('id_grupo', grupoIds);

      const alumnosUnicos = new Set(alumnosGrupo?.map(a => a.id_alumno) || []);
      const totalAlumnos = alumnosUnicos.size;

      if (totalAlumnos === 0) {
        return { promedioGeneral: 0, totalAlumnos: 0, quizzesCompletados: 0, participacion: 0 };
      }

      // Procesar todas las notas en memoria
      const todasLasNotas: { id_alumno: string; puntaje_total: number | null; estado: string | null }[] = [];
      clasesConDatos?.forEach(clase => {
        const quizzes = clase.quizzes as any[] || [];
        quizzes.forEach(quiz => {
          const notas = quiz.nota_alumno as any[] || [];
          notas.forEach(nota => {
            if (alumnosUnicos.has(nota.id_alumno)) {
              todasLasNotas.push(nota);
            }
          });
        });
      });

      const respuestasCompletadas = todasLasNotas.filter(r => r.estado === 'completado');
      const quizzesCompletados = respuestasCompletadas.length;

      const puntajes = respuestasCompletadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const promedioGeneral = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      const alumnosQueCompletaron = new Set(respuestasCompletadas.map(r => r.id_alumno));
      const participacion = Math.round((alumnosQueCompletaron.size / totalAlumnos) * 100);

      return {
        promedioGeneral,
        totalAlumnos,
        quizzesCompletados,
        participacion,
      };
    },
    enabled: !!profesor?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener las asignaciones del profesor con métricas (OPTIMIZADO - SIN N+1)
export function useAsignacionesProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['asignaciones-profesor-metricas', profesor?.id],
    queryFn: async (): Promise<AsignacionConMetricas[]> => {
      if (!profesor?.id) return [];

      // 1. Obtener asignaciones con grupos y materias
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

      // Extraer IDs únicos para batch queries
      const grupoIds = [...new Set(asignaciones.map(a => a.id_grupo))];
      const materiaIds = [...new Set(asignaciones.map(a => a.id_materia))];

      // 2. BATCH: Obtener todos los alumnos de todos los grupos
      const { data: todosAlumnos } = await supabase
        .from('alumnos_grupo')
        .select('id_grupo, id_alumno')
        .in('id_grupo', grupoIds);

      // Crear mapa de alumnos por grupo
      const alumnosPorGrupo = new Map<string, string[]>();
      todosAlumnos?.forEach(a => {
        const lista = alumnosPorGrupo.get(a.id_grupo) || [];
        lista.push(a.id_alumno);
        alumnosPorGrupo.set(a.id_grupo, lista);
      });

      // 3. BATCH: Obtener todos los temas de todas las materias
      const { data: todosTemas } = await supabase
        .from('temas_plan')
        .select('id, curso_plan_id')
        .in('curso_plan_id', materiaIds);

      // Crear mapa de temas por materia
      const temasPorMateria = new Map<string, string[]>();
      todosTemas?.forEach(t => {
        const lista = temasPorMateria.get(t.curso_plan_id) || [];
        lista.push(t.id);
        temasPorMateria.set(t.curso_plan_id, lista);
      });

      const todosTemasIds = todosTemas?.map(t => t.id) || [];

      // 4. BATCH con JOIN: Obtener todas las clases con quizzes y notas
      const { data: todasClases } = await supabase
        .from('clases')
        .select(`
          id,
          id_grupo,
          id_tema,
          quizzes (
            id,
            nota_alumno (
              id_alumno,
              puntaje_total,
              estado
            )
          )
        `)
        .in('id_grupo', grupoIds)
        .in('id_tema', todosTemasIds.length > 0 ? todosTemasIds : ['']);

      // Indexar clases por grupo+tema
      const clasesPorGrupoTema = new Map<string, typeof todasClases>();
      todasClases?.forEach(c => {
        const key = `${c.id_grupo}-${c.id_tema}`;
        const lista = clasesPorGrupoTema.get(key) || [];
        lista.push(c);
        clasesPorGrupoTema.set(key, lista);
      });

      // 5. Procesar cada asignación en memoria (sin más queries)
      const asignacionesConMetricas: AsignacionConMetricas[] = [];

      for (const asig of asignaciones) {
        const grupo = asig.grupos as any;
        const materia = asig.cursos_plan as any;
        
        if (!grupo || !materia) continue;

        const alumnosDelGrupo = alumnosPorGrupo.get(grupo.id) || [];
        const totalAlumnos = alumnosDelGrupo.length;
        const temasDeMateria = temasPorMateria.get(materia.id) || [];

        if (temasDeMateria.length === 0 || totalAlumnos === 0) {
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

        // Recopilar notas de todas las clases de esta asignación
        const alumnosSet = new Set(alumnosDelGrupo);
        const notasAsignacion: { id_alumno: string; puntaje_total: number | null; estado: string | null }[] = [];
        let totalQuizzes = 0;

        temasDeMateria.forEach(temaId => {
          const clasesDelTema = clasesPorGrupoTema.get(`${grupo.id}-${temaId}`) || [];
          clasesDelTema.forEach(clase => {
            const quizzes = (clase as any).quizzes as any[] || [];
            totalQuizzes += quizzes.length;
            quizzes.forEach(quiz => {
              const notas = quiz.nota_alumno as any[] || [];
              notas.forEach(nota => {
                if (alumnosSet.has(nota.id_alumno)) {
                  notasAsignacion.push(nota);
                }
              });
            });
          });
        });

        // Calcular métricas
        const completadas = notasAsignacion.filter(r => r.estado === 'completado');
        const puntajes = completadas
          .filter(r => r.puntaje_total !== null)
          .map(r => r.puntaje_total as number);
        
        const promedio = puntajes.length > 0
          ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
          : 0;

        const alumnosQueCompletaron = new Set(completadas.map(r => r.id_alumno));
        const asistencia = totalAlumnos > 0 ? Math.round((alumnosQueCompletaron.size / totalAlumnos) * 100) : 0;

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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener el resumen del salón (OPTIMIZADO con joins)
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
      const alumnosSet = new Set(alumnoIds);

      // Si hay filtro de materia, obtener los temas de esa materia
      let temasIds: string[] | null = null;
      if (filtros?.materiaId && !filtros?.temaId) {
        const { data: temas } = await supabase
          .from('temas_plan')
          .select('id')
          .eq('curso_plan_id', filtros.materiaId);
        temasIds = temas?.map(t => t.id) || [];
        if (temasIds.length === 0) {
          return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
        }
      }

      // Construir query de clases con joins a quizzes y notas
      let clasesQuery = supabase
        .from('clases')
        .select(`
          id,
          quizzes (
            id,
            nota_alumno (
              id_alumno,
              puntaje_total,
              estado
            )
          )
        `)
        .eq('id_grupo', grupoId);

      // Aplicar filtros
      if (filtros?.claseId) {
        clasesQuery = clasesQuery.eq('id', filtros.claseId);
      } else if (filtros?.temaId) {
        clasesQuery = clasesQuery.eq('id_tema', filtros.temaId);
      } else if (temasIds && temasIds.length > 0) {
        clasesQuery = clasesQuery.in('id_tema', temasIds);
      }

      const { data: clases } = await clasesQuery;

      if (!clases || clases.length === 0) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      // Procesar notas en memoria
      const todasLasNotas: { id_alumno: string; puntaje_total: number | null; estado: string | null }[] = [];
      clases.forEach(clase => {
        const quizzes = (clase as any).quizzes as any[] || [];
        quizzes.forEach(quiz => {
          const notas = quiz.nota_alumno as any[] || [];
          notas.forEach(nota => {
            if (alumnosSet.has(nota.id_alumno)) {
              todasLasNotas.push(nota);
            }
          });
        });
      });

      if (todasLasNotas.length === 0) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      // Calcular métricas
      const respuestasCompletadas = todasLasNotas.filter(r => r.estado === 'completado');
      const alumnosQueCompletaron = new Set(respuestasCompletadas.map(r => r.id_alumno));
      const participacion = Math.round((alumnosQueCompletaron.size / totalAlumnos) * 100);

      const puntajes = respuestasCompletadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const desempeno = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Calcular alumnos en riesgo
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener métricas PRE de un salón (OPTIMIZADO con joins)
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
      const alumnosSet = new Set(alumnoIds);

      if (totalAlumnos === 0) {
        return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
      }

      // Si hay filtro de materia, obtener los temas de esa materia
      let temasIds: string[] | null = null;
      if (filtros?.materiaId && !filtros?.temaId) {
        const { data: temas } = await supabase
          .from('temas_plan')
          .select('id')
          .eq('curso_plan_id', filtros.materiaId);
        temasIds = temas?.map(t => t.id) || [];
        if (temasIds.length === 0) {
          return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
        }
      }

      // Obtener clases con quizzes PRE y notas usando joins
      let clasesQuery = supabase
        .from('clases')
        .select(`
          id,
          quizzes!inner (
            id,
            tipo,
            nota_alumno (
              id,
              id_alumno,
              puntaje_total,
              estado
            )
          )
        `)
        .eq('id_grupo', grupoId)
        .eq('quizzes.tipo', 'previo');

      // Aplicar filtros
      if (filtros?.claseId) {
        clasesQuery = clasesQuery.eq('id', filtros.claseId);
      } else if (filtros?.temaId) {
        clasesQuery = clasesQuery.eq('id_tema', filtros.temaId);
      } else if (temasIds && temasIds.length > 0) {
        clasesQuery = clasesQuery.in('id_tema', temasIds);
      }

      const { data: clases } = await clasesQuery;

      if (!clases || clases.length === 0) {
        return { participacion: 0, nivelPreparacion: 0, conceptosRefuerzo: [] };
      }

      // Recopilar notas PRE
      const notasPre: { id: string; id_alumno: string; puntaje_total: number | null; estado: string | null }[] = [];
      clases.forEach(clase => {
        const quizzes = (clase as any).quizzes as any[] || [];
        quizzes.forEach(quiz => {
          if (quiz.tipo === 'previo') {
            const notas = quiz.nota_alumno as any[] || [];
            notas.forEach(nota => {
              if (alumnosSet.has(nota.id_alumno)) {
                notasPre.push(nota);
              }
            });
          }
        });
      });

      const completadas = notasPre.filter(r => r.estado === 'completado');
      const participacion = Math.round((new Set(completadas.map(r => r.id_alumno)).size / totalAlumnos) * 100);

      const puntajes = completadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const nivelPreparacion = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Obtener conceptos débiles
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener métricas POST de un salón (OPTIMIZADO con joins)
export function useMetricasPOST(grupoId: string | null, filtros?: { materiaId?: string; temaId?: string; claseId?: string }) {
  return useQuery({
    queryKey: ['metricas-post', grupoId, filtros],
    queryFn: async (): Promise<MetricasPOST> => {
      if (!grupoId) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Obtener alumnos del grupo con sus datos directos
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select(`
          id_alumno,
          alumnos (
            id,
            user_id,
            nombre,
            apellido
          )
        `)
        .eq('id_grupo', grupoId);

      const totalAlumnos = alumnosGrupo?.length || 0;
      const alumnoIds = alumnosGrupo?.map(a => a.id_alumno) || [];
      const alumnosSet = new Set(alumnoIds);

      if (totalAlumnos === 0) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Si hay filtro de materia, obtener los temas de esa materia
      let temasIds: string[] | null = null;
      if (filtros?.materiaId && !filtros?.temaId) {
        const { data: temas } = await supabase
          .from('temas_plan')
          .select('id')
          .eq('curso_plan_id', filtros.materiaId);
        temasIds = temas?.map(t => t.id) || [];
        if (temasIds.length === 0) {
          return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
        }
      }

      // Obtener clases con quizzes POST y notas usando joins
      let clasesQuery = supabase
        .from('clases')
        .select(`
          id,
          quizzes!inner (
            id,
            tipo,
            nota_alumno (
              id_alumno,
              puntaje_total,
              estado
            )
          )
        `)
        .eq('id_grupo', grupoId)
        .eq('quizzes.tipo', 'post');

      // Aplicar filtros
      if (filtros?.claseId) {
        clasesQuery = clasesQuery.eq('id', filtros.claseId);
      } else if (filtros?.temaId) {
        clasesQuery = clasesQuery.eq('id_tema', filtros.temaId);
      } else if (temasIds && temasIds.length > 0) {
        clasesQuery = clasesQuery.in('id_tema', temasIds);
      }

      const { data: clases } = await clasesQuery;

      if (!clases || clases.length === 0) {
        return { participacion: 0, nivelDesempeno: 0, alumnosRefuerzo: [] };
      }

      // Recopilar notas POST
      const notasPost: { id_alumno: string; puntaje_total: number | null; estado: string | null }[] = [];
      clases.forEach(clase => {
        const quizzes = (clase as any).quizzes as any[] || [];
        quizzes.forEach(quiz => {
          if (quiz.tipo === 'post') {
            const notas = quiz.nota_alumno as any[] || [];
            notas.forEach(nota => {
              if (alumnosSet.has(nota.id_alumno)) {
                notasPost.push(nota);
              }
            });
          }
        });
      });

      const completadas = notasPost.filter(r => r.estado === 'completado');
      const participacion = Math.round((new Set(completadas.map(r => r.id_alumno)).size / totalAlumnos) * 100);

      const puntajes = completadas
        .filter(r => r.puntaje_total !== null)
        .map(r => r.puntaje_total as number);
      const nivelDesempeno = puntajes.length > 0
        ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length)
        : 0;

      // Calcular promedios por alumno
      const promediosPorAlumno = new Map<string, number[]>();
      completadas.forEach(r => {
        if (r.puntaje_total !== null) {
          const lista = promediosPorAlumno.get(r.id_alumno) || [];
          lista.push(r.puntaje_total);
          promediosPorAlumno.set(r.id_alumno, lista);
        }
      });

      // Obtener perfiles para fallback de nombres
      const userIds = alumnosGrupo
        ?.map(a => (a.alumnos as any)?.user_id)
        .filter(Boolean) || [];

      const { data: perfiles } = userIds.length > 0 
        ? await supabase
            .from('profiles')
            .select('user_id, nombre, apellido')
            .in('user_id', userIds)
        : { data: [] };

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
          const alumno = alumnoData?.alumnos as any;
          
          // Primero usar nombre/apellido de alumnos, luego fallback a profiles
          let nombre = 'Sin nombre';
          if (alumno?.nombre || alumno?.apellido) {
            nombre = `${alumno.nombre || ''} ${alumno.apellido || ''}`.trim();
          } else if (alumno?.user_id) {
            nombre = perfilMap.get(alumno.user_id) || 'Sin nombre';
          }
          
          alumnosRefuerzo.push({ id: alumnoId, nombre, porcentaje: promedio });
        }
      });

      alumnosRefuerzo.sort((a, b) => a.porcentaje - b.porcentaje);

      return { participacion, nivelDesempeno, alumnosRefuerzo: alumnosRefuerzo.slice(0, 5) };
    },
    enabled: !!grupoId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener recomendaciones de un salón/clase (OPTIMIZADO)
export function useRecomendacionesSalon(grupoId: string | null, filtros?: { quizId?: string }) {
  return useQuery({
    queryKey: ['recomendaciones-salon', grupoId, filtros],
    queryFn: async (): Promise<RecomendacionSalon[]> => {
      if (!grupoId) return [];

      // Usar join para obtener quizzes y recomendaciones en una query
      const { data: clases } = await supabase
        .from('clases')
        .select(`
          id,
          quizzes (
            id,
            recomendaciones (
              id,
              contenido
            )
          )
        `)
        .eq('id_grupo', grupoId);

      if (!clases || clases.length === 0) return [];

      // Recopilar recomendaciones
      const recomendaciones: { id: string; contenido: string | null }[] = [];
      clases.forEach(clase => {
        const quizzes = (clase as any).quizzes as any[] || [];
        quizzes.forEach(quiz => {
          if (filtros?.quizId && quiz.id !== filtros.quizId) return;
          const recs = quiz.recomendaciones as any[] || [];
          recs.forEach(rec => recomendaciones.push(rec));
        });
      });

      return recomendaciones.slice(0, 5).map(r => ({
        id: r.id,
        tipo: 'refuerzo' as const,
        titulo: r.contenido?.split('.')[0]?.replace('[DEMO]', '').trim() || 'Recomendación',
        descripcion: r.contenido?.replace('[DEMO]', '').trim() || '',
      }));
    },
    enabled: !!grupoId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para generar recomendaciones con IA basadas en conceptos débiles
export function useRecomendacionesIA(conceptosDebiles: { nombre: string; porcentajeAcierto: number }[], tipo: 'PRE' | 'POST') {
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
