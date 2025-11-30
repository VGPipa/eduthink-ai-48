import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type GuiaVersionRow = Database['public']['Tables']['guias_clase_versiones']['Row'];
type GuiaTemaRow = Database['public']['Tables']['guias_tema']['Row'];

export interface GuiaVersion extends GuiaVersionRow {
  clase?: {
    id: string;
    tema?: {
      nombre: string;
    };
  };
}

export interface GuiaTema extends GuiaTemaRow {
  tema?: {
    id: string;
    nombre: string;
  };
}

export interface CreateGuiaVersionData {
  id_clase: string;
  objetivos?: string;
  estructura?: any;
  contenido?: any;
  preguntas_socraticas?: any;
  generada_ia?: boolean;
  estado?: string;
}

export interface CreateGuiaTemaData {
  id_tema: string;
  id_profesor: string;
  objetivos_generales?: string;
  estructura_sesiones?: any;
  contenido?: any;
  contexto_grupo?: string;
  metodologias?: string[];
  total_sesiones?: number;
}

export function useGuiasClase(claseId?: string) {
  const queryClient = useQueryClient();

  const { data: guias = [], isLoading, error } = useQuery({
    queryKey: ['guias-clase', claseId],
    queryFn: async () => {
      if (!claseId) return [];

      const { data, error } = await supabase
        .from('guias_clase_versiones')
        .select(`
          *,
          clase:clases!guias_clase_versiones_id_clase_fkey(
            id,
            tema:temas_plan(nombre)
          )
        `)
        .eq('id_clase', claseId)
        .order('version_numero', { ascending: false });

      if (error) throw error;
      return (data || []) as GuiaVersion[];
    },
    enabled: !!claseId,
  });

  const createGuiaVersion = useMutation({
    mutationFn: async (data: CreateGuiaVersionData) => {
      // Get current max version number
      const { data: existingVersions } = await supabase
        .from('guias_clase_versiones')
        .select('version_numero')
        .eq('id_clase', data.id_clase)
        .order('version_numero', { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions.length > 0
        ? (existingVersions[0].version_numero || 0) + 1
        : 1;

      const { data: guia, error } = await supabase
        .from('guias_clase_versiones')
        .insert([{
          ...data,
          version_numero: nextVersion,
          es_version_final: false,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update clase to reference this version
      const { error: updateError } = await supabase
        .from('clases')
        .update({ id_guia_version_actual: guia.id })
        .eq('id', data.id_clase);

      if (updateError) {
        // If update fails, we should rollback or at least throw the error
        // For now, we'll throw to prevent inconsistent state
        throw new Error(`Failed to update clase reference: ${updateError.message}`);
      }

      return guia as GuiaVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guias-clase', variables.id_clase] });
      queryClient.invalidateQueries({ queryKey: ['clases'] });
    },
    onError: (error: any) => {
      toast.error('Error al crear la guía: ' + error.message);
    },
  });

  const updateGuiaVersion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GuiaVersionRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('guias_clase_versiones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GuiaVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guias-clase', data.id_clase] });
      toast.success('Guía actualizada');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const approveGuiaVersion = useMutation({
    mutationFn: async ({ id, aprobada_por }: { id: string; aprobada_por: string }) => {
      const { data, error } = await supabase
        .from('guias_clase_versiones')
        .update({
          estado: 'aprobada',
          es_version_final: true,
          aprobada_por,
          fecha_aprobacion: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Get clase to update its estado
      const { data: guia, error: guiaError } = await supabase
        .from('guias_clase_versiones')
        .select('id_clase')
        .eq('id', id)
        .single();

      if (guiaError) throw guiaError;

      if (guia) {
        const { error: updateError } = await supabase
          .from('clases')
          .update({ estado: 'guia_aprobada' })
          .eq('id', guia.id_clase);

        if (updateError) {
          throw new Error(`Failed to update clase estado: ${updateError.message}`);
        }
      }

      return data as GuiaVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guias-clase'] });
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      toast.success('Guía aprobada');
    },
    onError: (error: any) => {
      toast.error('Error al aprobar: ' + error.message);
    },
  });

  return {
    guias,
    isLoading,
    error,
    createGuiaVersion,
    updateGuiaVersion,
    approveGuiaVersion,
  };
}

export function useGuiasTema(profesorId?: string, temaId?: string) {
  const queryClient = useQueryClient();

  const { data: guia, isLoading, error } = useQuery({
    queryKey: ['guia-tema', profesorId, temaId],
    queryFn: async () => {
      if (!profesorId || !temaId) return null;

      const { data, error } = await supabase
        .from('guias_tema')
        .select(`
          *,
          tema:temas_plan(id, nombre)
        `)
        .eq('id_profesor', profesorId)
        .eq('id_tema', temaId)
        .maybeSingle();

      if (error) throw error;
      return data as GuiaTema | null;
    },
    enabled: !!profesorId && !!temaId,
  });

  const createOrUpdateGuiaTema = useMutation({
    mutationFn: async (data: CreateGuiaTemaData) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('guias_tema')
        .select('id')
        .eq('id_profesor', data.id_profesor)
        .eq('id_tema', data.id_tema)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabase
          .from('guias_tema')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated as GuiaTema;
      } else {
        const { data: created, error } = await supabase
          .from('guias_tema')
          .insert([data])
          .select()
          .single();

        if (error) throw error;
        return created as GuiaTema;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guia-tema'] });
      toast.success('Guía de tema guardada');
    },
    onError: (error: any) => {
      toast.error('Error al guardar: ' + error.message);
    },
  });

  return {
    guia,
    isLoading,
    error,
    createOrUpdateGuiaTema,
  };
}

// ============================================================================
// HOOKS AUXILIARES PARA TEMA DETALLE
// ============================================================================

export interface GuiaTemaDetalle extends GuiaTemaRow {
  tema?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    objetivos: string | null;
    duracion_estimada: number | null;
    bimestre: number | null;
    orden: number;
    curso_plan_id: string;
    curso?: {
      id: string;
      nombre: string;
      grado: string;
      horas_semanales: number | null;
    };
  };
}

export interface ClaseConDetalles {
  id: string;
  id_tema: string;
  id_grupo: string;
  estado: string;
  numero_sesion: number | null;
  fecha_programada: string | null;
  fecha_ejecutada: string | null;
  duracion_minutos: number | null;
  contexto: any;
  observaciones: any;
  created_at: string;
  tema?: {
    id: string;
    nombre: string;
  };
  grupo?: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string | null;
    cantidad_alumnos: number | null;
  };
  guia_version?: {
    id: string;
    version_numero: number;
    estado: string;
  };
}

/**
 * Hook para obtener el detalle completo de una guía de tema
 * Incluye información del tema, curso, y la guía maestra si existe
 */
export function useGuiaTemaDetalle(temaId?: string) {
  const { data: guiaTema, isLoading, error, refetch } = useQuery({
    queryKey: ['guia-tema-detalle', temaId],
    queryFn: async () => {
      if (!temaId) return null;

      // Get tema info with curso
      const { data: tema, error: temaError } = await supabase
        .from('temas_plan')
        .select(`
          id,
          nombre,
          descripcion,
          objetivos,
          duracion_estimada,
          bimestre,
          orden,
          curso_plan_id,
          curso:cursos_plan(
            id,
            nombre,
            horas_semanales
          )
        `)
        .eq('id', temaId)
        .single();

      if (temaError) throw temaError;

      // Get guia_tema if exists (any profesor for now, or we could filter by current user)
      const { data: guia, error: guiaError } = await supabase
        .from('guias_tema')
        .select('*')
        .eq('id_tema', temaId)
        .maybeSingle();

      if (guiaError && guiaError.code !== 'PGRST116') throw guiaError;

      return {
        ...guia,
        tema: tema as GuiaTemaDetalle['tema']
      } as GuiaTemaDetalle | null;
    },
    enabled: !!temaId,
  });

  return {
    guiaTema,
    tema: guiaTema?.tema,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook para obtener todas las clases de un tema específico
 * Agrupa por grupo y ordena por número de clase
 */
export function useClasesByTema(temaId?: string) {
  const { data: clases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['clases-by-tema', temaId],
    queryFn: async () => {
      if (!temaId) return [];

      const { data, error } = await supabase
        .from('clases')
        .select(`
          *,
          tema:temas_plan(id, nombre),
          grupo:grupos(id, nombre, grado, seccion, cantidad_alumnos),
          guia_version:guias_clase_versiones!clases_id_guia_version_actual_fkey(
            id,
            version_numero,
            estado
          )
        `)
        .eq('id_tema', temaId)
        .order('numero_sesion', { ascending: true })
        .order('fecha_programada', { ascending: true });

      if (error) throw error;
      return (data || []) as ClaseConDetalles[];
    },
    enabled: !!temaId,
  });

  // Group clases by grupo
  const clasesByGrupo = clases.reduce((acc, clase) => {
    const grupoId = clase.id_grupo;
    if (!acc[grupoId]) {
      acc[grupoId] = {
        grupo: clase.grupo,
        clases: []
      };
    }
    acc[grupoId].clases.push(clase);
    return acc;
  }, {} as Record<string, { grupo: ClaseConDetalles['grupo']; clases: ClaseConDetalles[] }>);

  // Calculate stats
  const stats = {
    total: clases.length,
    completadas: clases.filter(c => c.estado === 'completada').length,
    programadas: clases.filter(c => 
      c.estado === 'borrador' || 
      c.estado === 'guia_aprobada' || 
      c.estado === 'clase_programada'
    ).length,
    enProceso: clases.filter(c => 
      c.estado === 'generando_clase' || 
      c.estado === 'editando_guia'
    ).length,
    pendientes: 0 // Will be calculated from estructura_sesiones - clases.length
  };

  return {
    clases,
    clasesByGrupo: Object.values(clasesByGrupo),
    stats,
    isLoading,
    error,
    refetch
  };
}

