import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfesor } from './useProfesor';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type EstadoClase = Database['public']['Enums']['estado_clase'];
type ClaseRow = Database['public']['Tables']['clases']['Row'];

export interface Clase extends ClaseRow {
  grupo?: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string | null;
  };
  tema?: {
    id: string;
    nombre: string;
    curso_plan_id: string;
  };
  materia?: {
    id: string;
    nombre: string;
  };
  guia_version?: {
    id: string;
    version_numero: number;
    estado: string | null;
  };
}

export interface CreateClaseData {
  id_grupo: string;
  id_tema: string;
  fecha_programada?: string;
  duracion_minutos?: number;
  contexto?: string;
  metodologia?: string;
  numero_sesion?: number;
}

// Valid transitions for estado_clase
const VALID_TRANSITIONS: Record<EstadoClase, EstadoClase[]> = {
  borrador: ['generando_clase', 'borrador'],
  generando_clase: ['editando_guia', 'borrador'],
  editando_guia: ['guia_aprobada', 'clase_programada', 'editando_guia', 'borrador'],
  guia_aprobada: ['clase_programada', 'editando_guia'],
  clase_programada: ['en_clase', 'clase_programada'],
  en_clase: ['completada', 'en_clase'],
  completada: ['completada'],
  analizando_resultados: ['completada']
};

/**
 * Validates if a state transition is allowed
 */
export function isValidEstadoTransition(from: EstadoClase | null, to: EstadoClase): boolean {
  if (!from) return true; // New clase can start with any estado
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function useClases(filters?: {
  estado?: EstadoClase;
  id_grupo?: string;
  id_tema?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  const { profesorId } = useProfesor();
  const queryClient = useQueryClient();

  const { data: clases = [], isLoading, error } = useQuery({
    queryKey: ['clases', profesorId, filters],
    queryFn: async () => {
      if (!profesorId) return [];

      let query = supabase
        .from('clases')
        .select(`
          *,
          grupo:grupos(id, nombre, grado, seccion),
          tema:temas_plan(id, nombre, curso_plan_id),
          guia_version:guias_clase_versiones!clases_id_guia_version_actual_fkey(id, version_numero, estado)
        `)
        .eq('id_profesor', profesorId)
        .order('fecha_programada', { ascending: true, nullsFirst: false });

      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }
      if (filters?.id_grupo) {
        query = query.eq('id_grupo', filters.id_grupo);
      }
      if (filters?.id_tema) {
        query = query.eq('id_tema', filters.id_tema);
      }
      if (filters?.fecha_desde) {
        query = query.gte('fecha_programada', filters.fecha_desde);
      }
      if (filters?.fecha_hasta) {
        query = query.lte('fecha_programada', filters.fecha_hasta);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        grupo: Array.isArray(item.grupo) ? item.grupo[0] : item.grupo,
        tema: Array.isArray(item.tema) ? item.tema[0] : item.tema,
        guia_version: Array.isArray(item.guia_version) ? item.guia_version[0] : item.guia_version,
      })) as Clase[];
    },
    enabled: !!profesorId,
  });

  const createClase = useMutation({
    mutationFn: async (data: CreateClaseData) => {
      if (!profesorId) throw new Error('No hay profesor asociado');

      const { data: clase, error } = await supabase
        .from('clases')
        .insert([{
          ...data,
          id_profesor: profesorId,
          estado: 'borrador' as EstadoClase,
        }])
        .select(`
          *,
          grupo:grupos(id, nombre, grado, seccion),
          tema:temas_plan(id, nombre, curso_plan_id)
        `)
        .single();

      if (error) throw error;
      return clase as Clase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      toast.success('Clase creada exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al crear la clase: ' + error.message);
    },
  });

  const updateClase = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClaseRow> & { id: string }) => {
      // Validate estado transition if estado is being updated
      if (updates.estado) {
        // Get current clase estado
        const { data: currentClase, error: fetchError } = await supabase
          .from('clases')
          .select('estado')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        const currentEstado = currentClase?.estado as EstadoClase | null;
        const newEstado = updates.estado as EstadoClase;

        if (!isValidEstadoTransition(currentEstado, newEstado)) {
          throw new Error(
            `Transición de estado inválida: ${currentEstado} → ${newEstado}. ` +
            `Estados permitidos desde ${currentEstado}: ${VALID_TRANSITIONS[currentEstado || 'borrador']?.join(', ') || 'ninguno'}`
          );
        }
      }

      const { data, error } = await supabase
        .from('clases')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Clase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      toast.success('Clase actualizada');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deleteClase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      toast.success('Clase eliminada');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Helper: Get clases by estado
  const getClasesByEstado = (estado: EstadoClase) => {
    return clases.filter(c => c.estado === estado);
  };

  // Helper: Get clases programadas (hoy, mañana, esta semana)
  const getClasesProgramadas = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);

    const hoyStr = hoy.toISOString().split('T')[0];
    const mananaStr = manana.toISOString().split('T')[0];
    const finSemanaStr = finSemana.toISOString().split('T')[0];

    return {
      hoy: clases.filter(c => 
        c.fecha_programada && 
        c.fecha_programada.split('T')[0] === hoyStr &&
        (c.estado === 'clase_programada' || c.estado === 'guia_aprobada')
      ),
      manana: clases.filter(c => 
        c.fecha_programada && 
        c.fecha_programada.split('T')[0] === mananaStr &&
        (c.estado === 'clase_programada' || c.estado === 'guia_aprobada')
      ),
      estaSemana: clases.filter(c => {
        if (!c.fecha_programada) return false;
        const fecha = c.fecha_programada.split('T')[0];
        return fecha >= hoyStr && fecha <= finSemanaStr &&
          (c.estado === 'clase_programada' || c.estado === 'guia_aprobada');
      }),
    };
  };

  return {
    clases,
    isLoading,
    error,
    createClase,
    updateClase,
    deleteClase,
    getClasesByEstado,
    getClasesProgramadas,
  };
}

