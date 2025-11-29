import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'profesor' | 'alumno' | 'apoderado';

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  profesor: 'Profesor',
  alumno: 'Alumno',
  apoderado: 'Apoderado'
};

export function useUserRole() {
  const { user } = useAuth();
  
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user,
  });

  // Prioridad: admin > profesor > alumno > apoderado
  const primaryRole: AppRole | null = roles?.includes('admin') 
    ? 'admin' 
    : roles?.includes('profesor') 
    ? 'profesor' 
    : roles?.includes('alumno') 
    ? 'alumno' 
    : roles?.includes('apoderado') 
    ? 'apoderado' 
    : null;

  const roleLabel = primaryRole ? ROLE_LABELS[primaryRole] : 'Sin rol';

  return {
    roles: roles || [],
    primaryRole,
    roleLabel,
    isAdmin: roles?.includes('admin') || false,
    isProfesor: roles?.includes('profesor') || false,
    isAlumno: roles?.includes('alumno') || false,
    isApoderado: roles?.includes('apoderado') || false,
    isLoading,
    error,
  };
}
