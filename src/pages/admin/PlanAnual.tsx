import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { usePlanes } from '@/hooks/usePlanes';
import PlanDialog, { PlanFormData } from '@/components/admin/PlanDialog';
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

const ANIOS_ESCOLARES = ['2024', '2025', '2026'];

export default function PlanAnual() {
  const [selectedAnio, setSelectedAnio] = useState('2024');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const { planes, isLoading, createPlan, updatePlan, deletePlan, duplicatePlan } = usePlanes(selectedAnio);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, ...data });
    } else {
      createPlan.mutate(data);
    }
  };

  const handleDeleteClick = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (planToDelete) {
      deletePlan.mutate(planToDelete);
      setPlanToDelete(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-success text-success-foreground">Activo</Badge>;
      case 'borrador':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Plan Anual</h1>
          <p className="text-muted-foreground">
            Configura los planes académicos por grado y año escolar
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedAnio} onValueChange={setSelectedAnio}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Año escolar" />
            </SelectTrigger>
            <SelectContent>
              {ANIOS_ESCOLARES.map((anio) => (
                <SelectItem key={anio} value={anio}>Año {anio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="gradient" onClick={handleCreatePlan}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Plans grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : planes.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay planes para el año {selectedAnio}</p>
            <Button variant="gradient" className="mt-4" onClick={handleCreatePlan}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((plan) => (
          <Card key={plan.id} className="hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-bg">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.grado}</CardTitle>
                    <p className="text-sm text-muted-foreground">Año {plan.anio}</p>
                  </div>
                </div>
                {getEstadoBadge(plan.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Cursos</p>
                  <p className="text-xl font-bold">{plan.cursos}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Temas</p>
                  <p className="text-xl font-bold">{plan.temas}</p>
                </div>
              </div>

              {plan.estado !== 'pendiente' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Cobertura</span>
                    <span className="font-medium">{plan.cobertura}%</span>
                  </div>
                  <Progress value={plan.cobertura} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                {plan.estado === 'pendiente' ? (
                  <Button variant="gradient" className="flex-1" onClick={() => handleEditPlan(plan)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Plan
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEditPlan(plan)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => duplicatePlan.mutate(plan.id)}
                      disabled={duplicatePlan.isPending}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingPlan ? {
          grado: editingPlan.grado,
          anio: editingPlan.anio,
          descripcion: editingPlan.descripcion || '',
          estado: editingPlan.estado,
        } : undefined}
        title={editingPlan ? 'Editar Plan Anual' : 'Crear Nuevo Plan'}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el plan anual y todos sus cursos y temas asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
