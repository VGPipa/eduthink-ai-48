import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useProfesores } from '@/hooks/useProfesores';
import { useGrupos } from '@/hooks/useGrupos';
import { useMaterias } from '@/hooks/useMaterias';
import { useAniosEscolares } from '@/hooks/useAniosEscolares';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const asignacionSchema = z.object({
  id_profesor: z.string().min(1, 'Selecciona un profesor'),
  id_materia: z.string().min(1, 'Selecciona una materia'),
  id_grupo: z.string().min(1, 'Selecciona un grupo'),
  anio_escolar: z.string().min(1, 'Selecciona un año escolar'),
});

type AsignacionFormData = z.infer<typeof asignacionSchema>;

interface AsignacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    id_profesor: string;
    id_materia: string;
    id_grupo: string;
    anio_escolar: string;
  } | null;
}

export function AsignacionDialog({ open, onOpenChange, onSuccess, editData }: AsignacionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profesores, isLoading: loadingProfesores } = useProfesores();
  const { grupos, isLoading: loadingGrupos } = useGrupos();
  const { materias, isLoading: loadingMaterias } = useMaterias();
  const { aniosEscolares, anioActivo, isLoading: loadingAnios } = useAniosEscolares();

  const form = useForm<AsignacionFormData>({
    resolver: zodResolver(asignacionSchema),
    defaultValues: editData || {
      id_profesor: '',
      id_materia: '',
      id_grupo: '',
      anio_escolar: anioActivo?.anio_escolar || '',
    },
  });

  const onSubmit = async (data: AsignacionFormData) => {
    setIsSubmitting(true);
    try {
      if (editData) {
        const { error } = await supabase
          .from('asignaciones_profesor')
          .update({
            id_profesor: data.id_profesor,
            id_materia: data.id_materia,
            id_grupo: data.id_grupo,
            anio_escolar: data.anio_escolar,
          })
          .eq('id', editData.id);

        if (error) throw error;

        toast({
          title: 'Asignación actualizada',
          description: 'La asignación se actualizó correctamente',
        });
      } else {
        const { error } = await supabase
          .from('asignaciones_profesor')
          .insert({
            id_profesor: data.id_profesor,
            id_materia: data.id_materia,
            id_grupo: data.id_grupo,
            anio_escolar: data.anio_escolar,
          });

        if (error) throw error;

        toast({
          title: 'Asignación creada',
          description: 'La asignación se creó correctamente',
        });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar la asignación',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loadingProfesores || loadingGrupos || loadingMaterias || loadingAnios;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Asignación' : 'Nueva Asignación'}</DialogTitle>
          <DialogDescription>
            {editData 
              ? 'Actualiza los datos de la asignación'
              : 'Asigna un profesor a una materia y grupo'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id_profesor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un profesor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profesores.map((profesor) => (
                          <SelectItem key={profesor.id} value={profesor.id}>
                            {profesor.profile?.nombre} {profesor.profile?.apellido}
                            {profesor.especialidad && ` - ${profesor.especialidad}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_materia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una materia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id}>
                            {materia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_grupo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clase y Sección</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona clase y sección" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grupos.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {grupo.grado} - Sección {grupo.seccion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="anio_escolar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año Escolar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un año escolar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {aniosEscolares.map((anio) => (
                          <SelectItem key={anio.id} value={anio.anio_escolar}>
                            {anio.anio_escolar}
                            {anio.activo && ' (Activo)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editData ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
