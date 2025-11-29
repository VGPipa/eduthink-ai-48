import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { StatCard } from '@/components/dashboard/StatCard';
import { useTemasProfesor } from '@/hooks/useTemasProfesor';
import { useProfesor } from '@/hooks/useProfesor';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useGuiasTema } from '@/hooks/useGuias';
import { useClases } from '@/hooks/useClases';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  PlayCircle,
  Eye,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  en_progreso: { label: 'En progreso', variant: 'default' },
  completado: { label: 'Completado', variant: 'default' }
};

const METODOLOGIAS = [
  { id: 'socratico', nombre: 'Método Socrático' },
  { id: 'casos', nombre: 'Aprendizaje basado en casos' },
  { id: 'problemas', nombre: 'Aprendizaje basado en problemas' },
  { id: 'colaborativo', nombre: 'Aprendizaje colaborativo' },
  { id: 'reflexivo', nombre: 'Pensamiento reflexivo' }
];

export default function Planificacion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profesorId } = useProfesor();
  const { asignaciones, grupos } = useAsignaciones('2024');
  const { cursosConTemas, isLoading, stats, getTemasByBimestre } = useTemasProfesor('2024');
  const { createClase } = useClases();
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null);
  const [iniciarTemaDialogOpen, setIniciarTemaDialogOpen] = useState(false);
  const [programarSesionDialogOpen, setProgramarSesionDialogOpen] = useState(false);
  const [selectedTema, setSelectedTema] = useState<{ id: string; nombre: string; cursoId: string } | null>(null);
  const [iniciarTemaForm, setIniciarTemaForm] = useState({
    totalSesiones: 4,
    contextoGrupo: '',
    metodologias: [] as string[]
  });
  const [programarSesionForm, setProgramarSesionForm] = useState({
    grupoId: '',
    numeroSesion: 1,
    fechaProgramada: '',
    duracion: 55,
    contexto: ''
  });
  const { createOrUpdateGuiaTema, isLoading: isCreatingGuia } = useGuiasTema(profesorId, selectedTema?.id);

  // Set first curso as selected when data loads
  useEffect(() => {
    if (!selectedCurso && cursosConTemas.length > 0) {
      setSelectedCurso(cursosConTemas[0].id);
    }
  }, [cursosConTemas, selectedCurso]);

  const cursoActual = cursosConTemas.find(c => c.id === selectedCurso);

  const handleIniciarTema = (tema: { id: string; nombre: string; cursoId: string }) => {
    setSelectedTema(tema);
    setIniciarTemaDialogOpen(true);
  };

  const handleCrearGuiaTema = async () => {
    if (!selectedTema || !profesorId) return;

    try {
      // Generate estructura_sesiones based on totalSesiones
      const estructuraSesiones = Array.from({ length: iniciarTemaForm.totalSesiones }, (_, i) => ({
        numero: i + 1,
        nombre: `Sesión ${i + 1}`,
        objetivos: [],
        actividades: []
      }));

      await createOrUpdateGuiaTema.mutateAsync({
        id_tema: selectedTema.id,
        id_profesor: profesorId,
        total_sesiones: iniciarTemaForm.totalSesiones,
        contexto_grupo: iniciarTemaForm.contextoGrupo,
        metodologias: iniciarTemaForm.metodologias,
        estructura_sesiones: estructuraSesiones,
        contenido: {
          total_sesiones: iniciarTemaForm.totalSesiones,
          contexto_grupo: iniciarTemaForm.contextoGrupo,
          metodologias: iniciarTemaForm.metodologias
        }
      });

      toast({ title: 'Tema iniciado', description: 'Guía maestra creada exitosamente' });
      setIniciarTemaDialogOpen(false);
      setSelectedTema(null);
      setIniciarTemaForm({ totalSesiones: 4, contextoGrupo: '', metodologias: [] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al crear la guía maestra: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const handleProgramarSesion = (tema: { id: string; nombre: string; cursoId: string }) => {
    setSelectedTema(tema);
    setProgramarSesionDialogOpen(true);
    // Set default grupo from asignaciones for this materia
    const asignacion = asignaciones.find(a => a.id_materia === tema.cursoId);
    if (asignacion?.grupo) {
      setProgramarSesionForm(prev => ({
        ...prev,
        grupoId: asignacion.grupo!.id
      }));
    }
  };

  const handleCrearSesion = async () => {
    if (!selectedTema || !profesorId || !programarSesionForm.grupoId || !programarSesionForm.fechaProgramada) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get guia_tema for this tema
      const { data: guiaTema } = await supabase
        .from('guias_tema')
        .select('id')
        .eq('id_tema', selectedTema.id)
        .eq('id_profesor', profesorId)
        .maybeSingle();

      const nuevaClase = await createClase.mutateAsync({
        id_tema: selectedTema.id,
        id_grupo: programarSesionForm.grupoId,
        fecha_programada: programarSesionForm.fechaProgramada,
        duracion_minutos: programarSesionForm.duracion,
        contexto: programarSesionForm.contexto,
        numero_sesion: programarSesionForm.numeroSesion,
      });

      toast({ title: 'Sesión programada', description: 'Clase creada en borrador' });
      setProgramarSesionDialogOpen(false);
      setSelectedTema(null);
      setProgramarSesionForm({ grupoId: '', numeroSesion: 1, fechaProgramada: '', duracion: 55, contexto: '' });
      
      // Navigate to GenerarClase
      navigate(`/profesor/generar-clase?clase=${nuevaClase.id}&tema=${selectedTema.id}&materia=${selectedTema.cursoId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al programar la sesión: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cursosConTemas.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Planificación Académica 2024</h1>
          <p className="text-muted-foreground">
            Gestiona tus materias, temas y sesiones de clase
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No tienes materias asignadas. Contacta al administrador para obtener asignaciones.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Planificación Académica 2024</h1>
        <p className="text-muted-foreground">
          Gestiona tus materias, temas y sesiones de clase
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de temas"
          value={stats.totalTemas}
          icon={BookOpen}
        />
        <StatCard
          title="Temas completados"
          value={stats.temasCompletados}
          icon={Target}
        />
        <StatCard
          title="Progreso general"
          value={`${stats.progresoGeneral}%`}
          icon={TrendingUp}
          variant="gradient"
        />
        <StatCard
          title="Materias asignadas"
          value={stats.materiasAsignadas}
          icon={Calendar}
        />
      </div>

      {/* Cursos tabs */}
      {selectedCurso && (
      <Tabs value={selectedCurso} onValueChange={setSelectedCurso}>
        <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0">
            {cursosConTemas.map((curso) => (
            <TabsTrigger
              key={curso.id}
              value={curso.id}
              className="data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground border flex-col items-start h-auto p-3 min-w-[200px]"
            >
              <span className="font-semibold">{curso.nombre}</span>
              <span className="text-xs opacity-80">
                  {curso.grupo?.grado} {curso.grupo?.seccion} • {curso.horas_semanales || 0}h/sem
              </span>
              <Progress value={curso.progreso} className="h-1 mt-2 w-full" />
            </TabsTrigger>
          ))}
        </TabsList>

          {cursosConTemas.map((curso) => {
            const bimestres = getTemasByBimestre(curso.id);
            return (
          <TabsContent key={curso.id} value={curso.id} className="mt-6">
                {bimestres.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No hay temas asignados para este curso.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Accordion type="multiple" className="space-y-4" defaultValue={bimestres.length > 1 ? [`bim-${bimestres[1].numero}`] : [`bim-${bimestres[0].numero}`]}>
                    {bimestres.map((bimestre) => (
                <AccordionItem
                  key={`bim-${bimestre.numero}`}
                  value={`bim-${bimestre.numero}`}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{bimestre.nombre}</span>
                              <Badge variant="secondary">{bimestre.temas.length} temas</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <Progress value={bimestre.progreso} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground">{bimestre.progreso}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {bimestre.temas.map((tema) => (
                        <Card key={tema.id} className="hover:shadow-elevated transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-2">{tema.nombre}</h4>
                              <Badge 
                                variant={estadoConfig[tema.estado]?.variant || 'secondary'}
                                className={tema.estado === 'completado' ? 'bg-success text-success-foreground' : ''}
                              >
                                {estadoConfig[tema.estado]?.label}
                              </Badge>
                            </div>
                            <Progress value={tema.progreso} className="h-1.5 mb-3" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <span>{tema.progreso}% completado</span>
                              <span>{tema.sesiones} sesiones</span>
                            </div>
                            <div className="flex gap-2">
                              {tema.estado === 'pendiente' ? (
                                <Button 
                                  variant="gradient" 
                                  size="sm" 
                                  className="flex-1"
                                        onClick={() => handleIniciarTema({ id: tema.id, nombre: tema.nombre, cursoId: curso.id })}
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Iniciar
                                </Button>
                              ) : tema.estado === 'en_progreso' ? (
                                      <>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="flex-1"
                                          onClick={() => handleProgramarSesion({ id: tema.id, nombre: tema.nombre, cursoId: curso.id })}
                                        >
                                          <Calendar className="w-3 h-3 mr-1" />
                                          Programar
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="flex-1"
                                          onClick={() => navigate(`/profesor/generar-clase?tema=${tema.id}&materia=${curso.id}`)}
                                >
                                  <PlayCircle className="w-3 h-3 mr-1" />
                                  Continuar
                                </Button>
                                      </>
                              ) : (
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver detalle
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
                )}
          </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Dialog Iniciar Tema */}
      <Dialog open={iniciarTemaDialogOpen} onOpenChange={setIniciarTemaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Iniciar Tema: {selectedTema?.nombre}</DialogTitle>
            <DialogDescription>
              Crea una guía maestra para este tema. Define la estructura general de sesiones y metodologías.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Total de sesiones estimadas *</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={iniciarTemaForm.totalSesiones}
                onChange={(e) => setIniciarTemaForm({ ...iniciarTemaForm, totalSesiones: parseInt(e.target.value) || 4 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Contexto del grupo *</Label>
              <Textarea
                placeholder="Describe el contexto del grupo: nivel académico, características, necesidades especiales..."
                value={iniciarTemaForm.contextoGrupo}
                onChange={(e) => setIniciarTemaForm({ ...iniciarTemaForm, contextoGrupo: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Metodologías preferidas</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {METODOLOGIAS.map((met) => (
                  <div
                    key={met.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      iniciarTemaForm.metodologias.includes(met.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      const newMet = iniciarTemaForm.metodologias.includes(met.id)
                        ? iniciarTemaForm.metodologias.filter(m => m !== met.id)
                        : [...iniciarTemaForm.metodologias, met.id];
                      setIniciarTemaForm({ ...iniciarTemaForm, metodologias: newMet });
                    }}
                  >
                    <Checkbox checked={iniciarTemaForm.metodologias.includes(met.id)} />
                    <span className="text-sm">{met.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIniciarTemaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearGuiaTema}
              disabled={!iniciarTemaForm.contextoGrupo || isCreatingGuia}
            >
              {isCreatingGuia ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Crear Guía Maestra
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Programar Sesión */}
      <Dialog open={programarSesionDialogOpen} onOpenChange={setProgramarSesionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Programar Sesión: {selectedTema?.nombre}</DialogTitle>
            <DialogDescription>
              Crea una nueva sesión de clase en borrador para este tema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Grupo (Salón) *</Label>
              <Select
                value={programarSesionForm.grupoId}
                onValueChange={(value) => setProgramarSesionForm({ ...programarSesionForm, grupoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nombre || `${grupo.grado} ${grupo.seccion || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de sesión *</Label>
                <Input
                  type="number"
                  min="1"
                  value={programarSesionForm.numeroSesion}
                  onChange={(e) => setProgramarSesionForm({ ...programarSesionForm, numeroSesion: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Duración (minutos) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={programarSesionForm.duracion}
                  onChange={(e) => setProgramarSesionForm({ ...programarSesionForm, duracion: parseInt(e.target.value) || 55 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha programada *</Label>
              <Input
                type="date"
                value={programarSesionForm.fechaProgramada}
                onChange={(e) => setProgramarSesionForm({ ...programarSesionForm, fechaProgramada: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Contexto específico (opcional)</Label>
              <Textarea
                placeholder="Contexto específico para esta sesión..."
                value={programarSesionForm.contexto}
                onChange={(e) => setProgramarSesionForm({ ...programarSesionForm, contexto: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramarSesionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearSesion}
              disabled={!programarSesionForm.grupoId || !programarSesionForm.fechaProgramada || createClase.isPending}
            >
              {createClase.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Programar Sesión
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
