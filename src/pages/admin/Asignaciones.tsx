import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useAniosEscolares } from '@/hooks/useAniosEscolares';
import { AsignacionDialog } from '@/components/admin/AsignacionDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Asignaciones() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { anioActivo } = useAniosEscolares();
  const { asignaciones, grupos, materias, isLoading } = useAsignaciones(anioActivo?.anio_escolar);

  const filteredAsignaciones = asignaciones.filter(a => {
    const profesorNombre = `${a.materia?.nombre || ''} ${a.grupo?.nombre || ''}`;
    return profesorNombre.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleEdit = (asignacion: any) => {
    setEditData({
      id: asignacion.id,
      id_profesor: asignacion.id_profesor,
      id_materia: asignacion.id_materia,
      grado: asignacion.grupo?.grado || '',
      seccion: asignacion.grupo?.seccion || '',
      anio_escolar: asignacion.anio_escolar,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('asignaciones_profesor')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Asignación eliminada',
        description: 'La asignación se eliminó correctamente',
      });

      queryClient.invalidateQueries({ queryKey: ['asignaciones'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al eliminar',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['asignaciones'] });
    setEditData(null);
  };

  const handleNewAsignacion = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const stats = {
    totalAsignaciones: asignaciones.length,
    cursosCubiertos: materias.length,
    salonesCubiertos: grupos.length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Asignaciones</h1>
          <p className="text-muted-foreground">
            Asigna profesores a cursos y salones
          </p>
        </div>
        <Button variant="gradient" onClick={handleNewAsignacion}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total asignaciones"
          value={stats.totalAsignaciones}
          icon={Users}
        />
        <StatCard
          title="Cursos cubiertos"
          value={stats.cursosCubiertos}
          icon={BookOpen}
        />
        <StatCard
          title="Salones cubiertos"
          value={stats.salonesCubiertos}
          icon={GraduationCap}
          variant="gradient"
        />
      </div>

      {/* Search and table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Asignaciones Actuales</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredAsignaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No se encontraron asignaciones' : 'No hay asignaciones registradas'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAsignaciones.map((asignacion) => (
                  <TableRow key={asignacion.id}>
                    <TableCell>
                      <Badge variant="secondary">{asignacion.materia?.nombre}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {asignacion.grupo?.grado}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Sección {asignacion.grupo?.seccion}</Badge>
                    </TableCell>
                    <TableCell>{asignacion.anio_escolar}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(asignacion)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(asignacion.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AsignacionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        editData={editData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la asignación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
