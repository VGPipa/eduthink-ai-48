import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database, Json } from '@/integrations/supabase/types';

type QuizRow = Database['public']['Tables']['quizzes']['Row'];
type PreguntaRow = Database['public']['Tables']['preguntas']['Row'];
type TipoQuiz = Database['public']['Enums']['tipo_quiz'];
type EstadoQuiz = Database['public']['Enums']['estado_quiz'];

export interface Quiz extends QuizRow {
  preguntas?: Pregunta[];
  clase?: {
    id: string;
    tema?: {
      nombre: string;
    };
  };
}

export interface Pregunta extends PreguntaRow {
  quiz?: {
    id: string;
    titulo: string;
  };
}

export interface EstimuloAprendizaje {
  titulo: string;
  texto_contenido: string;
  descripcion_visual: string;
  tiempo_lectura_estimado: string;
}

export interface CreateQuizData {
  id_clase: string;
  tipo: TipoQuiz;
  titulo: string;
  instrucciones?: string;
  tiempo_limite?: number;
  fecha_disponible?: string;
  fecha_limite?: string;
  estado?: EstadoQuiz;
  estimulo_aprendizaje?: EstimuloAprendizaje;
}

export interface CreatePreguntaData {
  id_quiz: string;
  texto_pregunta: string;
  tipo?: Database['public']['Enums']['tipo_pregunta'];
  opciones?: any;
  respuesta_correcta?: string;
  justificacion?: string;
  concepto?: string;
  orden?: number;
  feedback_acierto?: string;
}

export function useQuizzes(claseId?: string, tipo?: TipoQuiz) {
  const queryClient = useQueryClient();

  const { data: quizzes = [], isLoading, error } = useQuery({
    queryKey: ['quizzes', claseId, tipo],
    queryFn: async () => {
      if (!claseId) return [];

      let query = supabase
        .from('quizzes')
        .select(`
          *,
          clase:clases!quizzes_id_clase_fkey(
            id,
            tema:temas_plan(nombre)
          )
        `)
        .eq('id_clase', claseId);

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Quiz[];
    },
    enabled: !!claseId,
  });

  const createQuiz = useMutation({
    mutationFn: async (data: CreateQuizData) => {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert([{
          id_clase: data.id_clase,
          tipo: data.tipo,
          titulo: data.titulo,
          instrucciones: data.instrucciones,
          tiempo_limite: data.tiempo_limite,
          fecha_disponible: data.fecha_disponible,
          fecha_limite: data.fecha_limite,
          estado: data.estado || 'borrador'
        }])
        .select()
        .single();

      if (error) throw error;
      return quiz as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error: any) => {
      toast.error('Error al crear el quiz: ' + error.message);
    },
  });

  const updateQuiz = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuizRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz actualizado');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const publishQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ estado: 'publicado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error: any) => {
      toast.error('Error al publicar: ' + error.message);
    },
  });

  const closeQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ estado: 'cerrado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error: any) => {
      toast.error('Error al finalizar: ' + error.message);
    },
  });

  return {
    quizzes,
    isLoading,
    error,
    createQuiz,
    updateQuiz,
    publishQuiz,
    closeQuiz,
  };
}

export function usePreguntas(quizId?: string) {
  const queryClient = useQueryClient();

  const { data: preguntas = [], isLoading, error } = useQuery({
    queryKey: ['preguntas', quizId],
    queryFn: async () => {
      if (!quizId) return [];

      const { data, error } = await supabase
        .from('preguntas')
        .select(`
          *,
          quiz:quizzes(id, titulo)
        `)
        .eq('id_quiz', quizId)
        .order('orden', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return (data || []) as Pregunta[];
    },
    enabled: !!quizId,
  });

  const createPregunta = useMutation({
    mutationFn: async (data: CreatePreguntaData) => {
      // Get max orden if not provided
      if (!data.orden) {
        const { data: existing } = await supabase
          .from('preguntas')
          .select('orden')
          .eq('id_quiz', data.id_quiz)
          .order('orden', { ascending: false })
          .limit(1);

        data.orden = existing && existing.length > 0
          ? (existing[0].orden || 0) + 1
          : 1;
      }

      const { data: pregunta, error } = await supabase
        .from('preguntas')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return pregunta as Pregunta;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['preguntas', variables.id_quiz] });
      toast.success('Pregunta agregada');
    },
    onError: (error: any) => {
      toast.error('Error al crear la pregunta: ' + error.message);
    },
  });

  const updatePregunta = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PreguntaRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('preguntas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Pregunta;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preguntas', data.id_quiz] });
      toast.success('Pregunta actualizada');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deletePregunta = useMutation({
    mutationFn: async (id: string) => {
      // Get quizId before deleting
      const { data: pregunta, error: fetchError } = await supabase
        .from('preguntas')
        .select('id_quiz')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('preguntas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return pregunta?.id_quiz;
    },
    onSuccess: (quizId) => {
      if (quizId) {
        queryClient.invalidateQueries({ queryKey: ['preguntas', quizId] });
      }
      toast.success('Pregunta eliminada');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  return {
    preguntas,
    isLoading,
    error,
    createPregunta,
    updatePregunta,
    deletePregunta,
  };
}

