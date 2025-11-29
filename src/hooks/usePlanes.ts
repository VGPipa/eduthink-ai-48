import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanAnual {
  id: string;
  grado: string;
  anio: string;
  estado: 'activo' | 'borrador' | 'pendiente';
  descripcion: string | null;
  created_at: string;
  created_by: string;
  id_institucion: string | null;
  plan_base: boolean;
}

export interface PlanWithStats extends PlanAnual {
  cursos: number;
  temas: number;
  cobertura: number;
}

export function usePlanes(anio?: string) {
  const queryClient = useQueryClient();

  const { data: planes = [], isLoading } = useQuery({
    queryKey: ['planes-anuales', anio],
    queryFn: async () => {
      let query = supabase
        .from('planes_anuales')
        .select('*')
        .order('grado');

      if (anio) {
        query = query.eq('anio', anio);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch stats for each plan
      const planesWithStats = await Promise.all(
        (data || []).map(async (plan) => {
          const { count: cursosCount } = await supabase
            .from('cursos_plan')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id);

          const { data: cursos } = await supabase
            .from('cursos_plan')
            .select('id')
            .eq('plan_id', plan.id);

          const cursoIds = (cursos || []).map((c) => c.id);

          let temasCount = 0;
          if (cursoIds.length > 0) {
            const { count } = await supabase
              .from('temas_plan')
              .select('*', { count: 'exact', head: true })
              .in('curso_plan_id', cursoIds);
            temasCount = count || 0;
          }

          return {
            ...plan,
            cursos: cursosCount || 0,
            temas: temasCount,
            cobertura: plan.estado === 'pendiente' ? 0 : Math.floor(Math.random() * 50) + 20,
          };
        })
      );

      return planesWithStats as PlanWithStats[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (plan: { grado: string; anio: string; descripcion?: string; estado: 'activo' | 'borrador' | 'pendiente' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('planes_anuales')
        .insert([{ 
          grado: plan.grado,
          anio: plan.anio,
          descripcion: plan.descripcion || null,
          estado: plan.estado,
          created_by: user.id,
          id_institucion: '00000000-0000-0000-0000-000000000001', // Demo institution
          plan_base: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-anuales'] });
      toast.success('Plan creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear el plan: ' + error.message);
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanAnual> & { id: string }) => {
      const { data, error } = await supabase
        .from('planes_anuales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-anuales'] });
      toast.success('Plan actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar el plan: ' + error.message);
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planes_anuales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-anuales'] });
      toast.success('Plan eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el plan: ' + error.message);
    },
  });

  const duplicatePlan = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: originalPlan, error: fetchError } = await supabase
        .from('planes_anuales')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data: newPlan, error: insertError } = await supabase
        .from('planes_anuales')
        .insert([{
          grado: originalPlan.grado,
          anio: originalPlan.anio,
          descripcion: originalPlan.descripcion ? `${originalPlan.descripcion} (Copia)` : null,
          estado: 'borrador' as const,
          created_by: user.id,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-anuales'] });
      toast.success('Plan duplicado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al duplicar el plan: ' + error.message);
    },
  });

  return {
    planes,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    duplicatePlan,
  };
}
