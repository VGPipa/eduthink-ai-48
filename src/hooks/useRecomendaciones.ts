import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RecomendacionRow = Database['public']['Tables']['recomendaciones']['Row'];

export interface Recomendacion extends RecomendacionRow {
  clase?: {
    id: string;
    tema?: {
      nombre: string;
    };
  };
}

export interface CreateRecomendacionData {
  id_clase: string;
  id_clase_anterior?: string;
  contenido: string;
  aplicada?: boolean;
}

export function useRecomendaciones(claseId?: string) {
  const queryClient = useQueryClient();

  const { data: recomendaciones = [], isLoading, error } = useQuery({
    queryKey: ['recomendaciones', claseId],
    queryFn: async () => {
      if (!claseId) return [];

      const { data, error } = await supabase
        .from('recomendaciones')
        .select(`
          *,
          clase:clases(
            id,
            tema:temas_plan(nombre)
          )
        `)
        .eq('id_clase', claseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Recomendacion[];
    },
    enabled: !!claseId,
  });

  const createRecomendacion = useMutation({
    mutationFn: async (data: CreateRecomendacionData) => {
      const { data: recomendacion, error } = await supabase
        .from('recomendaciones')
        .insert([{
          ...data,
          aplicada: data.aplicada || false,
        }])
        .select()
        .single();

      if (error) throw error;
      return recomendacion as Recomendacion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recomendaciones', variables.id_clase] });
      toast.success('Recomendación creada');
    },
    onError: (error: any) => {
      toast.error('Error al crear la recomendación: ' + error.message);
    },
  });

  const aplicarRecomendacion = useMutation({
    mutationFn: async ({ id, id_clase }: { id: string; id_clase: string }) => {
      // Mark as applied
      const { data, error } = await supabase
        .from('recomendaciones')
        .update({ aplicada: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Recomendacion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recomendaciones', variables.id_clase] });
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      toast.success('Recomendación aplicada');
    },
    onError: (error: any) => {
      toast.error('Error al aplicar la recomendación: ' + error.message);
    },
  });

  return {
    recomendaciones,
    isLoading,
    error,
    createRecomendacion,
    aplicarRecomendacion,
  };
}

