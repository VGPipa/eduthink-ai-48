import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RetroalimentacionRow = Database['public']['Tables']['retroalimentaciones']['Row'];

export interface Retroalimentacion extends RetroalimentacionRow {
  clase?: {
    id: string;
    tema?: {
      nombre: string;
    };
  };
  alumno?: {
    id: string;
    user_id: string;
  };
}

export interface CreateRetroalimentacionData {
  id_clase: string;
  id_alumno?: string;
  tipo: 'individual' | 'grupal';
  contenido: string;
  fortalezas?: string[];
  areas_mejora?: string[];
  recomendaciones?: string[];
}

export function useRetroalimentaciones(claseId?: string, alumnoId?: string) {
  const queryClient = useQueryClient();

  const { data: retroalimentaciones = [], isLoading, error } = useQuery({
    queryKey: ['retroalimentaciones', claseId, alumnoId],
    queryFn: async () => {
      if (!claseId) return [];

      let query = supabase
        .from('retroalimentaciones')
        .select(`
          *,
          clase:clases(
            id,
            tema:temas_plan(nombre)
          ),
          alumno:alumnos(id, user_id)
        `)
        .eq('id_clase', claseId);

      if (alumnoId) {
        query = query.eq('id_alumno', alumnoId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Retroalimentacion[];
    },
    enabled: !!claseId,
  });

  const createRetroalimentacion = useMutation({
    mutationFn: async (data: CreateRetroalimentacionData) => {
      const { data: retroalimentacion, error } = await supabase
        .from('retroalimentaciones')
        .insert([{
          ...data,
          fortalezas: data.fortalezas || [],
          areas_mejora: data.areas_mejora || [],
          recomendaciones: data.recomendaciones || [],
        }])
        .select()
        .single();

      if (error) throw error;
      return retroalimentacion as Retroalimentacion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['retroalimentaciones', variables.id_clase] });
      toast.success('Retroalimentación creada');
    },
    onError: (error: any) => {
      toast.error('Error al crear la retroalimentación: ' + error.message);
    },
  });

  // Helper to get only individual feedback
  const retroalimentacionesIndividuales = retroalimentaciones.filter(r => r.tipo === 'individual');
  
  // Helper to get only group feedback
  const retroalimentacionesGrupales = retroalimentaciones.filter(r => r.tipo === 'grupal');

  return {
    retroalimentaciones,
    retroalimentacionesIndividuales,
    retroalimentacionesGrupales,
    isLoading,
    error,
    createRetroalimentacion,
  };
}

