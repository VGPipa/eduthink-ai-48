import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAlumno } from './useAlumno';
import type { Database, Json } from '@/integrations/supabase/types';

type QuizRow = Database['public']['Tables']['quizzes']['Row'];
type PreguntaRow = Database['public']['Tables']['preguntas']['Row'];
type NotaAlumnoRow = Database['public']['Tables']['nota_alumno']['Row'];
type TipoQuiz = Database['public']['Enums']['tipo_quiz'];

export interface EstimuloAprendizaje {
  titulo: string;
  texto_contenido: string;
  descripcion_visual: string;
  tiempo_lectura_estimado: string;
}

export interface OpcionPregunta {
  texto: string;
  es_correcta: boolean;
}

export interface QuizPendiente {
  id: string;
  titulo: string;
  tipo: TipoQuiz;
  tiempo_limite: number | null;
  instrucciones: string | null;
  fecha_disponible: string | null;
  fecha_limite: string | null;
  curso_nombre: string;
  tema_nombre: string;
  grupo_nombre: string;
  total_preguntas: number;
}

export interface QuizCompletado {
  id: string;
  titulo: string;
  tipo: TipoQuiz;
  curso_nombre: string;
  tema_nombre: string;
  puntaje: number | null;
  fecha_completado: string | null;
  nota_alumno_id: string;
}

export interface PreguntaCompleta extends PreguntaRow {
  opciones_parsed: OpcionPregunta[];
}

export interface QuizParaResolver {
  id: string;
  titulo: string;
  tipo: TipoQuiz;
  tiempo_limite: number | null;
  instrucciones: string | null;
  estimulo_aprendizaje: EstimuloAprendizaje | null;
  preguntas: PreguntaCompleta[];
  curso_nombre: string;
  tema_nombre: string;
}

export function useQuizzesPendientes() {
  const { alumnoId, grupoIds, isLoading: alumnoLoading } = useAlumno();

  const { data: quizzes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['quizzes-pendientes', alumnoId, grupoIds],
    queryFn: async () => {
      if (!alumnoId || grupoIds.length === 0) return [];

      // Get quizzes from clases of alumno's grupos that are published
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
          id,
          titulo,
          tipo,
          tiempo_limite,
          instrucciones,
          fecha_disponible,
          fecha_limite,
          clase:clases!quizzes_id_clase_fkey(
            id,
            id_grupo,
            tema:temas_plan(
              nombre,
              curso:cursos_plan(nombre)
            ),
            grupo:grupos(nombre, grado, seccion)
          )
        `)
        .eq('estado', 'publicado');

      if (quizzesError) throw quizzesError;

      // Filter quizzes to only those from alumno's grupos
      const quizzesFiltrados = (quizzesData || []).filter(quiz => {
        const claseGrupoId = quiz.clase?.id_grupo;
        return claseGrupoId && grupoIds.includes(claseGrupoId);
      });

      // Get completed quizzes for this alumno
      const { data: notasCompletadas, error: notasError } = await supabase
        .from('nota_alumno')
        .select('id_quiz')
        .eq('id_alumno', alumnoId)
        .eq('estado', 'completado');

      if (notasError) throw notasError;

      const quizzesCompletadosIds = new Set((notasCompletadas || []).map(n => n.id_quiz));

      // Filter out completed quizzes and get question count
      const quizzesPendientes: QuizPendiente[] = [];

      for (const quiz of quizzesFiltrados) {
        if (quizzesCompletadosIds.has(quiz.id)) continue;

        // Get question count
        const { count } = await supabase
          .from('preguntas')
          .select('*', { count: 'exact', head: true })
          .eq('id_quiz', quiz.id);

        const grupo = quiz.clase?.grupo;
        const grupoNombre = grupo?.nombre || (grupo?.grado ? `${grupo.grado}° ${grupo.seccion || ''}`.trim() : 'Sin grupo');

        quizzesPendientes.push({
          id: quiz.id,
          titulo: quiz.titulo,
          tipo: quiz.tipo,
          tiempo_limite: quiz.tiempo_limite,
          instrucciones: quiz.instrucciones,
          fecha_disponible: quiz.fecha_disponible,
          fecha_limite: quiz.fecha_limite,
          curso_nombre: quiz.clase?.tema?.curso?.nombre || 'Sin curso',
          tema_nombre: quiz.clase?.tema?.nombre || 'Sin tema',
          grupo_nombre: grupoNombre,
          total_preguntas: count || 0,
        });
      }

      return quizzesPendientes;
    },
    enabled: !!alumnoId && grupoIds.length > 0,
  });

  return {
    quizzesPendientes: quizzes,
    isLoading: alumnoLoading || isLoading,
    error,
    refetch,
  };
}

export function useQuizzesCompletados() {
  const { alumnoId, isLoading: alumnoLoading } = useAlumno();

  const { data: quizzes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['quizzes-completados', alumnoId],
    queryFn: async () => {
      if (!alumnoId) return [];

      // Get completed notas for this alumno
      const { data: notas, error: notasError } = await supabase
        .from('nota_alumno')
        .select(`
          id,
          id_quiz,
          puntaje_total,
          fecha_envio,
          quiz:quizzes(
            id,
            titulo,
            tipo,
            clase:clases!quizzes_id_clase_fkey(
              tema:temas_plan(
                nombre,
                curso:cursos_plan(nombre)
              )
            )
          )
        `)
        .eq('id_alumno', alumnoId)
        .eq('estado', 'completado')
        .order('fecha_envio', { ascending: false });

      if (notasError) throw notasError;

      const quizzesCompletados: QuizCompletado[] = (notas || [])
        .filter(nota => nota.quiz)
        .map(nota => ({
          id: nota.quiz!.id,
          titulo: nota.quiz!.titulo,
          tipo: nota.quiz!.tipo,
          curso_nombre: nota.quiz!.clase?.tema?.curso?.nombre || 'Sin curso',
          tema_nombre: nota.quiz!.clase?.tema?.nombre || 'Sin tema',
          puntaje: nota.puntaje_total,
          fecha_completado: nota.fecha_envio,
          nota_alumno_id: nota.id,
        }));

      return quizzesCompletados;
    },
    enabled: !!alumnoId,
  });

  return {
    quizzesCompletados: quizzes,
    isLoading: alumnoLoading || isLoading,
    error,
    refetch,
  };
}

export function useQuizParaResolver(quizId: string | undefined) {
  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz-resolver', quizId],
    queryFn: async () => {
      if (!quizId) return null;

      // Get quiz with clase info
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          id,
          titulo,
          tipo,
          tiempo_limite,
          instrucciones,
          clase:clases!quizzes_id_clase_fkey(
            tema:temas_plan(
              nombre,
              curso:cursos_plan(nombre)
            )
          )
        `)
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Get preguntas ordered
      const { data: preguntas, error: preguntasError } = await supabase
        .from('preguntas')
        .select('*')
        .eq('id_quiz', quizId)
        .order('orden', { ascending: true });

      if (preguntasError) throw preguntasError;

      // Parse opciones for each pregunta
      const preguntasCompletas: PreguntaCompleta[] = (preguntas || []).map(p => ({
        ...p,
        opciones_parsed: parseOpciones(p.opciones),
      }));

      // Try to get estimulo_aprendizaje from a custom query or stored JSON
      // Since the column was removed, we'll check if there's any in the instrucciones or create a default
      let estimuloAprendizaje: EstimuloAprendizaje | null = null;
      
      // For now, if it's a PRE quiz, we create a basic estimulo from the title/instrucciones
      if (quizData.tipo === 'previo' && quizData.instrucciones) {
        // Check if instrucciones contains estimulo info
        const temaName = quizData.clase?.tema?.nombre || 'el tema';
        estimuloAprendizaje = {
          titulo: quizData.titulo.replace('Micro-Learning: ', ''),
          texto_contenido: quizData.instrucciones,
          descripcion_visual: `Ilustración educativa sobre ${temaName}`,
          tiempo_lectura_estimado: '2 minutos',
        };
      }

      const quizCompleto: QuizParaResolver = {
        id: quizData.id,
        titulo: quizData.titulo,
        tipo: quizData.tipo,
        tiempo_limite: quizData.tiempo_limite,
        instrucciones: quizData.instrucciones,
        estimulo_aprendizaje: estimuloAprendizaje,
        preguntas: preguntasCompletas,
        curso_nombre: quizData.clase?.tema?.curso?.nombre || 'Sin curso',
        tema_nombre: quizData.clase?.tema?.nombre || 'Sin tema',
      };

      return quizCompleto;
    },
    enabled: !!quizId,
  });

  return {
    quiz,
    isLoading,
    error,
  };
}

// Helper to parse opciones JSON
function parseOpciones(opciones: Json | null): OpcionPregunta[] {
  if (!opciones) return [];
  
  try {
    if (Array.isArray(opciones)) {
      return opciones.map(op => {
        if (typeof op === 'object' && op !== null) {
          return {
            texto: (op as any).texto || '',
            es_correcta: (op as any).es_correcta || false,
          };
        }
        return { texto: String(op), es_correcta: false };
      });
    }
    return [];
  } catch {
    return [];
  }
}
