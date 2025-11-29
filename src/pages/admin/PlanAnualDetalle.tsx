import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  BookOpen,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Curso {
  id: string;
  nombre: string;
  objetivos: string | null;
  horas_semanales: number | null;
  orden: number;
}

interface Tema {
  id: string;
  nombre: string;
  competencias: string[] | null;
  estandares: string[] | null;
  duracion_estimada: number | null;
  orden: number;
  curso_plan_id: string;
}

export default function PlanAnualDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [cursoDialogOpen, setCursoDialogOpen] = useState(false);
  const [temaDialogOpen, setTemaDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null);

  // Fetch plan details
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['plan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planes_anuales')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch courses
  const { data: cursos = [], isLoading: cursosLoading } = useQuery({
    queryKey: ['cursos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cursos_plan')
        .select('*')
        .eq('plan_id', id)
        .order('orden');
      if (error) throw error;
      return data;
    },
  });

  // Fetch topics
  const { data: temas = [], isLoading: temasLoading } = useQuery({
    queryKey: ['temas', id],
    queryFn: async () => {
      if (!cursos.length) return [];
      const cursoIds = cursos.map((c) => c.id);
      const { data, error } = await supabase
        .from('temas_plan')
        .select('*')
        .in('curso_plan_id', cursoIds)
        .order('orden');
      if (error) throw error;
      return data;
    },
    enabled: cursos.length > 0,
  });

  // Update plan mutation
  const updatePlan = useMutation({
    mutationFn: async (updates: any) => {
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
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      toast.success('Plan actualizado');
      setIsEditingPlan(false);
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  // Create/Update curso
  const saveCurso = useMutation({
    mutationFn: async (curso: any) => {
      if (curso.id) {
        const { data, error } = await supabase
          .from('cursos_plan')
          .update(curso)
          .eq('id', curso.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('cursos_plan')
          .insert([{ ...curso, plan_id: id }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos', id] });
      toast.success('Curso guardado');
      setCursoDialogOpen(false);
      setEditingCurso(null);
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Delete curso
  const deleteCurso = useMutation({
    mutationFn: async (cursoId: string) => {
      const { error } = await supabase
        .from('cursos_plan')
        .delete()
        .eq('id', cursoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos', id] });
      queryClient.invalidateQueries({ queryKey: ['temas', id] });
      toast.success('Curso eliminado');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Create/Update tema
  const saveTema = useMutation({
    mutationFn: async (tema: any) => {
      if (tema.id) {
        const { data, error } = await supabase
          .from('temas_plan')
          .update(tema)
          .eq('id', tema.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('temas_plan')
          .insert([tema])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas', id] });
      toast.success('Tema guardado');
      setTemaDialogOpen(false);
      setEditingTema(null);
      setSelectedCursoId(null);
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Delete tema
  const deleteTema = useMutation({
    mutationFn: async (temaId: string) => {
      const { error } = await supabase
        .from('temas_plan')
        .delete()
        .eq('id', temaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas', id] });
      toast.success('Tema eliminado');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

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

  if (planLoading || cursosLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan no encontrado</p>
        <Button onClick={() => navigate('/admin/plan-anual')} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin/plan-anual')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{plan.grado} - {plan.anio}</h1>
            {getEstadoBadge(plan.estado)}
          </div>
          {plan.descripcion && (
            <p className="text-muted-foreground">{plan.descripcion}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setIsEditingPlan(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{cursos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Temas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{temas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {cursos.reduce((sum, c) => sum + (c.horas_semanales || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cursos del Plan</CardTitle>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                setEditingCurso(null);
                setCursoDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Curso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cursos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay cursos agregados. Comienza agregando el primer curso.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {cursos.map((curso) => {
                const cursoTemas = temas.filter((t) => t.curso_plan_id === curso.id);
                return (
                  <AccordionItem key={curso.id} value={curso.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg gradient-bg">
                          <BookOpen className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold">{curso.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {cursoTemas.length} temas • {curso.horas_semanales || 0} hrs/semana
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCurso(curso);
                              setCursoDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('¿Eliminar este curso y todos sus temas?')) {
                                deleteCurso.mutate(curso.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-12 pt-4 space-y-4">
                        {curso.objetivos && (
                          <div>
                            <p className="text-sm font-medium mb-1">Objetivos:</p>
                            <p className="text-sm text-muted-foreground">{curso.objetivos}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="text-sm font-medium">Temas ({cursoTemas.length})</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCursoId(curso.id);
                              setEditingTema(null);
                              setTemaDialogOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            Agregar Tema
                          </Button>
                        </div>

                        {cursoTemas.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay temas agregados
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cursoTemas.map((tema, idx) => (
                              <div
                                key={tema.id}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{tema.nombre}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {tema.duracion_estimada ? `${tema.duracion_estimada} semanas` : 'Duración no definida'}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setSelectedCursoId(curso.id);
                                      setEditingTema(tema);
                                      setTemaDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      if (confirm('¿Eliminar este tema?')) {
                                        deleteTema.mutate(tema.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <EditPlanDialog
        open={isEditingPlan}
        onOpenChange={setIsEditingPlan}
        plan={plan}
        onSave={(data) => updatePlan.mutate(data)}
      />

      {/* Curso Dialog */}
      <CursoDialog
        open={cursoDialogOpen}
        onOpenChange={setCursoDialogOpen}
        curso={editingCurso}
        onSave={saveCurso.mutate}
        cursosCount={cursos.length}
      />

      {/* Tema Dialog */}
      <TemaDialog
        open={temaDialogOpen}
        onOpenChange={setTemaDialogOpen}
        tema={editingTema}
        cursoId={selectedCursoId}
        onSave={saveTema.mutate}
        temasCount={temas.filter((t) => t.curso_plan_id === selectedCursoId).length}
      />
    </div>
  );
}

// Edit Plan Dialog Component
function EditPlanDialog({ open, onOpenChange, plan, onSave }: any) {
  const [formData, setFormData] = useState({
    grado: plan.grado,
    anio: plan.anio,
    descripcion: plan.descripcion || '',
    estado: plan.estado,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Plan Anual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Grado</Label>
            <Input
              value={formData.grado}
              onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
            />
          </div>
          <div>
            <Label>Año</Label>
            <Input
              value={formData.anio}
              onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={() => onSave(formData)}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Curso Dialog Component
function CursoDialog({ open, onOpenChange, curso, onSave, cursosCount }: any) {
  const [formData, setFormData] = useState({
    nombre: curso?.nombre || '',
    objetivos: curso?.objetivos || '',
    horas_semanales: curso?.horas_semanales || 0,
    orden: curso?.orden || cursosCount,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{curso ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre del Curso *</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Matemáticas"
            />
          </div>
          <div>
            <Label>Objetivos</Label>
            <Textarea
              value={formData.objetivos}
              onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
              placeholder="Objetivos del curso..."
              rows={3}
            />
          </div>
          <div>
            <Label>Horas Semanales</Label>
            <Input
              type="number"
              value={formData.horas_semanales}
              onChange={(e) => setFormData({ ...formData, horas_semanales: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="gradient"
            onClick={() => onSave(curso ? { ...formData, id: curso.id } : formData)}
            disabled={!formData.nombre}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tema Dialog Component
function TemaDialog({ open, onOpenChange, tema, cursoId, onSave, temasCount }: any) {
  const [formData, setFormData] = useState({
    nombre: tema?.nombre || '',
    competencias: tema?.competencias?.join(', ') || '',
    estandares: tema?.estandares?.join(', ') || '',
    duracion_estimada: tema?.duracion_estimada || 1,
    orden: tema?.orden || temasCount,
    curso_plan_id: tema?.curso_plan_id || cursoId,
  });

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      competencias: formData.competencias ? formData.competencias.split(',').map(s => s.trim()).filter(Boolean) : null,
      estandares: formData.estandares ? formData.estandares.split(',').map(s => s.trim()).filter(Boolean) : null,
    };
    
    if (tema) {
      onSave({ ...dataToSave, id: tema.id });
    } else {
      onSave(dataToSave);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tema ? 'Editar Tema' : 'Nuevo Tema'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre del Tema *</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Números y Operaciones"
            />
          </div>
          <div>
            <Label>Duración (semanas)</Label>
            <Input
              type="number"
              value={formData.duracion_estimada}
              onChange={(e) => setFormData({ ...formData, duracion_estimada: parseInt(e.target.value) || 1 })}
              min="1"
            />
          </div>
          <div>
            <Label>Competencias (separadas por coma)</Label>
            <Textarea
              value={formData.competencias}
              onChange={(e) => setFormData({ ...formData, competencias: e.target.value })}
              placeholder="Competencia 1, Competencia 2, ..."
              rows={2}
            />
          </div>
          <div>
            <Label>Estándares (separados por coma)</Label>
            <Textarea
              value={formData.estandares}
              onChange={(e) => setFormData({ ...formData, estandares: e.target.value })}
              placeholder="Estándar 1, Estándar 2, ..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="gradient"
            onClick={handleSave}
            disabled={!formData.nombre}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
