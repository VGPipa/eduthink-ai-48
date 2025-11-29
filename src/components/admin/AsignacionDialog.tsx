import { useState, useEffect } from 'react';
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
import { useMaterias } from '@/hooks/useMaterias';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const asignacionSchema = z.object({
  id_profesor: z.string().min(1, 'Selecciona un profesor'),
  id_materia: z.string().min(1, 'Selecciona una materia'),
  grado: z.string().min(1, 'Selecciona una clase'),
  seccion: z.string().min(1, 'Selecciona una sección'),
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
    grado: string;
    seccion: string;
    anio_escolar: string;
  } | null;
}

export function AsignacionDialog({ open, onOpenChange, onSuccess, editData }: AsignacionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profesores, isLoading: loadingProfesores, refetch: refetchProfesores } = useProfesores();
  const { materias, isLoading: loadingMaterias } = useMaterias();

  // Refetch data when dialog opens
  useEffect(() => {
    if (open) {
      refetchProfesores();
    }
  }, [open, refetchProfesores]);

  const form = useForm<AsignacionFormData>({
    resolver: zodResolver(asignacionSchema),
    defaultValues: editData || {
      id_profesor: '',
      id_materia: '',
      grado: '',
      seccion: '',
      anio_escolar: '2025',
    },
  });

  const onSubmit = async (data: AsignacionFormData) => {
    setIsSubmitting(true);
    try {
      // Buscar el grupo que coincide con grado y sección
      const { data: grupoData, error: grupoError } = await supabase
        .from('grupos')
        .select('id')
        .eq('grado', data.grado)
        .eq('seccion', data.seccion)
        .maybeSingle();

      if (grupoError) throw grupoError;
      
      if (!grupoData) {
        throw new Error(`No existe el grupo ${data.grado} - Sección ${data.seccion}. Por favor, créalo primero en la gestión de grupos.`);
      }

      if (editData) {
        const { error } = await supabase
          .from('asignaciones_profesor')
          .update({
            id_profesor: data.id_profesor,
            id_materia: data.id_materia,
            id_grupo: grupoData.id,
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
            id_grupo: grupoData.id,
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

  const isLoading = loadingProfesores || loadingMaterias;

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
                      <SelectContent className="bg-background z-50">
                        {profesores.length === 0 ? (
                          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                            No hay profesores disponibles
                          </div>
                        ) : (
                          profesores.map((profesor) => (
                            <SelectItem key={profesor.id} value={profesor.id}>
                              {profesor.profile?.nombre && profesor.profile?.apellido 
                                ? `${profesor.profile.nombre} ${profesor.profile.apellido}`
                                : profesor.profile?.email || 'Profesor sin nombre'}
                              {profesor.especialidad && ` - ${profesor.especialidad}`}
                            </SelectItem>
                          ))
                        )}
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="1° Primaria">1° Primaria</SelectItem>
                          <SelectItem value="2° Primaria">2° Primaria</SelectItem>
                          <SelectItem value="3° Primaria">3° Primaria</SelectItem>
                          <SelectItem value="4° Primaria">4° Primaria</SelectItem>
                          <SelectItem value="5° Primaria">5° Primaria</SelectItem>
                          <SelectItem value="6° Primaria">6° Primaria</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sección</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="A">Sección A</SelectItem>
                          <SelectItem value="B">Sección B</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="anio_escolar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año Escolar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un año" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
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
