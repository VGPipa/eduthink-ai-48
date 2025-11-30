import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database, Json } from '@/integrations/supabase/types';

type RecomendacionRow = Database['public']['Tables']['recomendaciones']['Row'];

export interface Recomendacion extends RecomendacionRow {
  quiz?: {
    id: string;
    tipo: string;
    titulo: string;
  };
}

export interface CreateRecomendacionData {
  id_quiz: string;
  contenido: string;
  titulo?: string;
  tipo?: string;
  prioridad?: string;
  momento?: string;
  concepto_relacionado?: string;
  analisis_general?: Json;
}

export function useRecomendaciones(quizId?: string) {
  const queryClient = useQueryClient();

  const { data: recomendaciones = [], isLoading, error } = useQuery({
    queryKey: ['recomendaciones', quizId],
    queryFn: async () => {
      if (!quizId) return [];

      const { data, error } = await supabase
        .from('recomendaciones')
        .select(`
          *,
          quiz:quizzes(id, tipo, titulo)
        `)
        .eq('id_quiz', quizId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Recomendacion[];
    },
    enabled: !!quizId,
  });

  const createRecomendacion = useMutation({
    mutationFn: async (data: CreateRecomendacionData) => {
      const { data: recomendacion, error } = await supabase
        .from('recomendaciones')
        .insert([{
          id_quiz: data.id_quiz,
          contenido: data.contenido,
          titulo: data.titulo,
          tipo: data.tipo,
          prioridad: data.prioridad,
          momento: data.momento,
          concepto_relacionado: data.concepto_relacionado,
          analisis_general: data.analisis_general
        }])
        .select()
        .single();

      if (error) throw error;
      return recomendacion as Recomendacion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recomendaciones', variables.id_quiz] });
      toast.success('Recomendación creada');
    },
    onError: (error: any) => {
      toast.error('Error al crear la recomendación: ' + error.message);
    },
  });

  return {
    recomendaciones,
    isLoading,
    error,
    createRecomendacion,
  };
}
