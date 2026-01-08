import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Competencia {
  id: string;
  area_curricular: string;
  nombre: string;
  descripcion: string | null;
  ciclo: string[] | null;
  activo: boolean;
}

export interface Capacidad {
  id: string;
  id_competencia: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Desempeno {
  id: string;
  id_capacidad: string;
  grado: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface EnfoqueTransversal {
  id: string;
  nombre: string;
  descripcion: string | null;
  valores: string[] | null;
  activo: boolean;
}

export interface Material {
  id: string;
  nombre: string;
  icono: string | null;
  orden: number;
  activo: boolean;
}

export interface AdaptacionNEE {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  recomendaciones_ia: string | null;
  orden: number;
  activo: boolean;
}

export function useCatalogoCurricular(areaCurricular?: string) {
  // Query para competencias
  const competenciasQuery = useQuery({
    queryKey: ['catalogo-competencias', areaCurricular],
    queryFn: async () => {
      let query = supabase
        .from('catalogo_competencias')
        .select('*')
        .eq('activo', true);
      if (areaCurricular) {
        query = query.eq('area_curricular', areaCurricular);
      }
      const { data, error } = await query.order('nombre');
      if (error) throw error;
      return data as Competencia[];
    }
  });

  // Query para enfoques transversales
  const enfoquesQuery = useQuery({
    queryKey: ['catalogo-enfoques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_enfoques_transversales')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as EnfoqueTransversal[];
    }
  });

  // Query para materiales
  const materialesQuery = useQuery({
    queryKey: ['catalogo-materiales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_materiales')
        .select('*')
        .eq('activo', true)
        .order('orden');
      if (error) throw error;
      return data as Material[];
    }
  });

  // Query para adaptaciones NEE
  const adaptacionesNeeQuery = useQuery({
    queryKey: ['catalogo-adaptaciones-nee'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_adaptaciones_nee')
        .select('*')
        .eq('activo', true)
        .order('orden');
      if (error) throw error;
      return data as AdaptacionNEE[];
    }
  });

  return {
    competencias: competenciasQuery.data || [],
    isLoadingCompetencias: competenciasQuery.isLoading,
    enfoques: enfoquesQuery.data || [],
    isLoadingEnfoques: enfoquesQuery.isLoading,
    materiales: materialesQuery.data || [],
    isLoadingMateriales: materialesQuery.isLoading,
    adaptacionesNee: adaptacionesNeeQuery.data || [],
    isLoadingAdaptaciones: adaptacionesNeeQuery.isLoading
  };
}

// Hook separado para capacidades que depende de la competencia seleccionada
export function useCapacidades(idCompetencia: string | null) {
  return useQuery({
    queryKey: ['catalogo-capacidades', idCompetencia],
    queryFn: async () => {
      if (!idCompetencia) return [];
      const { data, error } = await supabase
        .from('catalogo_capacidades')
        .select('*')
        .eq('id_competencia', idCompetencia)
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Capacidad[];
    },
    enabled: !!idCompetencia
  });
}

// Hook para capacidades de MÚLTIPLES competencias seleccionadas
export function useCapacidadesMultiples(idsCompetencias: string[]) {
  return useQuery({
    queryKey: ['catalogo-capacidades-multiple', idsCompetencias],
    queryFn: async () => {
      if (!idsCompetencias.length) return [];
      const { data, error } = await supabase
        .from('catalogo_capacidades')
        .select('*')
        .in('id_competencia', idsCompetencias)
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Capacidad[];
    },
    enabled: idsCompetencias.length > 0
  });
}

// Hook separado para desempeños que depende de la capacidad seleccionada
export function useDesempenos(idCapacidad: string | null, grado?: string) {
  return useQuery({
    queryKey: ['catalogo-desempenos', idCapacidad, grado],
    queryFn: async () => {
      if (!idCapacidad) return [];
      let query = supabase
        .from('catalogo_desempenos')
        .select('*')
        .eq('id_capacidad', idCapacidad)
        .eq('activo', true);
      if (grado) {
        query = query.eq('grado', grado);
      }
      const { data, error } = await query.order('nombre');
      if (error) throw error;
      return data as Desempeno[];
    },
    enabled: !!idCapacidad
  });
}
