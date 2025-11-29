import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminAsignacion {
    id: string;
    id_profesor: string;
    id_materia: string; // Se mantiene el nombre del campo de BD
    id_grupo: string;
    anio_escolar: string;
    created_at: string;
    // Joined data - Estandarizado: curso (no materia)
    grupo?: {
        id: string;
        nombre: string;
        grado: string;
        seccion: string | null;
    };
    curso?: {
        id: string;
        nombre: string;
        horas_semanales: number | null;
    };
    profesor?: {
        id: string;
        user_id: string | null;
        profile?: {
            nombre: string | null;
            apellido: string | null;
            email: string | null;
        };
    };
}

export function useAdminAsignaciones(anioEscolar?: string) {
    const { data: asignaciones = [], isLoading, error, refetch } = useQuery({
        queryKey: ['admin-asignaciones', anioEscolar],
        queryFn: async () => {
            let query = supabase
                .from('asignaciones_profesor')
                .select(`
          *,
          grupo:grupos(id, nombre, grado, seccion),
          curso:cursos_plan(id, nombre, horas_semanales),
          profesor:profesores(id, user_id)
        `);
            const { data: rawData, error } = await query;

            if (error) throw error;

            if (!rawData || rawData.length === 0) return [];

            // Get unique user IDs to fetch profiles
            const userIds = rawData
                .map((item: any) => item.profesor?.user_id)
                .filter((id: string) => id);

            // Fetch profiles
            let profilesMap = new Map();
            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, nombre, apellido, email')
                    .in('user_id', userIds);

                if (profilesError) throw profilesError;

                profilesMap = new Map(
                    (profilesData || []).map((p: any) => [p.user_id, p])
                );
            }

            // Map data to include profiles
            return rawData.map((item: any) => ({
                ...item,
                grupo: Array.isArray(item.grupo) ? item.grupo[0] : item.grupo,
                curso: Array.isArray(item.curso) ? item.curso[0] : item.curso,
                profesor: item.profesor ? {
                    ...item.profesor,
                    profile: item.profesor.user_id ? profilesMap.get(item.profesor.user_id) : null
                } : null
            })) as AdminAsignacion[];
        },
    });

    return {
        asignaciones,
        isLoading,
        error,
        refetch
    };
}
