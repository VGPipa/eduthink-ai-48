import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useGuiaTemaDetalle, useClasesByTema } from '@/hooks/useGuias';
import { useClases } from '@/hooks/useClases';
import { useProfesor } from '@/hooks/useProfesor';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Target,
  CheckCircle2,
  Eye,
  FileText,
  MessageSquare,
  Sparkles,
  PlayCircle
} from 'lucide-react';

const estadoClaseConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  borrador: { label: 'Borrador', variant: 'secondary', color: 'text-gray-500' },
  generando_clase: { label: 'Generando...', variant: 'secondary', color: 'text-blue-500' },
  editando_guia: { label: 'Editando', variant: 'outline', color: 'text-orange-500' },
  guia_aprobada: { label: 'Guía Lista', variant: 'default', color: 'text-green-600' },
  clase_programada: { label: 'Programada', variant: 'default', color: 'text-green-600' },
  en_clase: { label: 'En Clase', variant: 'default', color: 'text-blue-600' },
  completada: { label: 'Completada', variant: 'default', color: 'text-green-700' }
};

export default function TemaDetalle() {
  const { temaId } = useParams<{ temaId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profesorId } = useProfesor();
  const { grupos } = useAsignaciones('2025');
  const { guiaTema, tema, isLoading: loadingGuia } = useGuiaTemaDetalle(temaId);
  const { clases, clasesByGrupo, stats: clasesStats, isLoading: loadingClases } = useClasesByTema(temaId);
  const { createClase } = useClases();

  const [programarClaseDialogOpen, setProgramarClaseDialogOpen] = useState(false);
  const [programarClaseForm, setProgramarClaseForm] = useState({
    grupoId: '',
    numeroClase: 1,
    fechaProgramada: '',
    duracion: 60,
    contexto: '',
    programarOtra: false
  });

  // Parse contenido from guia_tema
  const contenidoGuia = useMemo(() => {
    if (!guiaTema?.contenido) return null;
    try {
      return typeof guiaTema.contenido === 'string' 
        ? JSON.parse(guiaTema.contenido) 
        : guiaTema.contenido;
    } catch {
      return null;
    }
  }, [guiaTema?.contenido]);

  // Get estructura_sesiones
  const estructuraSesiones = useMemo(() => {
    if (guiaTema?.estructura_sesiones) {
      return Array.isArray(guiaTema.estructura_sesiones) 
        ? guiaTema.estructura_sesiones 
        : [];
    }
    if (contenidoGuia?.estructura_sesiones) {
      return contenidoGuia.estructura_sesiones;
    }
    return [];
  }, [guiaTema?.estructura_sesiones, contenidoGuia]);

  // Calculate total and pending classes
  const totalClasesEstructura = estructuraSesiones.length || guiaTema?.total_sesiones || 0;
  const clasesPendientes = Math.max(0, totalClasesEstructura - clases.length);

  // Calculate progress
  const progreso = totalClasesEstructura > 0
    ? Math.round((clasesStats.completadas / totalClasesEstructura) * 100)
    : 0;

  // Get next clase number to program
  const getNextClaseNumber = (grupoId: string) => {
    const clasesGrupo = clases.filter(c => c.id_grupo === grupoId);
    if (clasesGrupo.length === 0) return 1;
    const maxNumero = Math.max(...clasesGrupo.map(c => c.numero_sesion || 0));
    return maxNumero + 1;
  };

  const handleOpenProgramarClase = () => {
    // Pre-select first grupo if available
    if (grupos.length > 0) {
      const primerGrupo = grupos[0];
      setProgramarClaseForm(prev => ({
        ...prev,
        grupoId: primerGrupo.id,
        numeroClase: getNextClaseNumber(primerGrupo.id)
      }));
    }
    setProgramarClaseDialogOpen(true);
  };

  const handleGrupoChange = (grupoId: string) => {
    setProgramarClaseForm(prev => ({
      ...prev,
      grupoId,
      numeroClase: getNextClaseNumber(grupoId)
    }));
  };

  const handleProgramarClase = async () => {
    if (!temaId || !profesorId || !programarClaseForm.grupoId || !programarClaseForm.fechaProgramada) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      const nuevaClase = await createClase.mutateAsync({
        id_tema: temaId,
        id_grupo: programarClaseForm.grupoId,
        fecha_programada: programarClaseForm.fechaProgramada,
        duracion_minutos: programarClaseForm.duracion,
        contexto: programarClaseForm.contexto,
        numero_sesion: programarClaseForm.numeroClase,
      });

      toast({ title: 'Clase programada', description: 'Clase creada exitosamente' });

      if (programarClaseForm.programarOtra) {
        // Reset for next clase
        setProgramarClaseForm(prev => ({
          ...prev,
          numeroClase: prev.numeroClase + 1,
          fechaProgramada: '',
          contexto: '',
          programarOtra: false
        }));
      } else {
        setProgramarClaseDialogOpen(false);
        setProgramarClaseForm({
          grupoId: '',
          numeroClase: 1,
          fechaProgramada: '',
          duracion: 60,
          contexto: '',
          programarOtra: false
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al programar la clase: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const handleNavigateToClase = (claseId: string) => {
    navigate(`/profesor/generar-clase?clase=${claseId}&tema=${temaId}&curso=${tema?.curso_plan_id}`);
  };

  if (loadingGuia || loadingClases) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tema) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Tema no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get clase for selected number in dialog
  const claseSeleccionada = estructuraSesiones.find(
    (s: any) => s.numero === programarClaseForm.numeroClase
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profesor/planificacion')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tema.nombre}</h1>
            <p className="text-muted-foreground">
              {tema.curso?.nombre} • {tema.curso?.grado} • Bimestre {tema.bimestre || 1}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" onClick={handleOpenProgramarClase}>
            <Calendar className="w-4 h-4 mr-2" />
            Programar Clase
          </Button>
        </div>
      </div>

      {/* Info del Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Tema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Descripción</h4>
            <p className="text-sm text-muted-foreground">
              {tema.descripcion || 'Sin descripción'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Objetivos</h4>
            <p className="text-sm text-muted-foreground">
              {tema.objetivos || 'Sin objetivos definidos'}
            </p>
          </div>
          {tema.duracion_estimada && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Duración: {tema.duracion_estimada} semanas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progreso General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progreso del Tema</span>
            <span className="font-semibold">{progreso}%</span>
          </div>
          <Progress value={progreso} className="h-2" />
          
          <div className="grid grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{clasesStats.completadas}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{clasesStats.programadas}</p>
              <p className="text-xs text-muted-foreground">Programadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{clasesPendientes}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalClasesEstructura}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Guía Maestra y Clases */}
      <Tabs defaultValue="clases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="guia">Guía Maestra</TabsTrigger>
          <TabsTrigger value="clases">Clases</TabsTrigger>
        </TabsList>

        {/* Tab: Guía Maestra */}
        <TabsContent value="guia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guía Maestra</CardTitle>
              <CardDescription>Objetivos, estructura de clases y recursos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!guiaTema ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No hay guía maestra creada para este tema.
                  </p>
                  <Button variant="gradient" onClick={() => navigate('/profesor/planificacion')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Crear Guía Maestra
                  </Button>
                </div>
              ) : (
                <>
                  {/* Objetivos Generales */}
                  {(guiaTema.objetivos_generales || contenidoGuia?.objetivos_generales) && (
                    <div>
                      <h4 className="font-semibold mb-2">Objetivos Generales</h4>
                      <p className="text-sm text-muted-foreground">
                        {guiaTema.objetivos_generales || contenidoGuia?.objetivos_generales}
                      </p>
                    </div>
                  )}

                  {/* Estructura de Clases */}
                  {estructuraSesiones.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Estructura de Clases</h4>
                      <div className="space-y-3">
                        {estructuraSesiones.map((sesion: any, index: number) => (
                          <div 
                            key={index} 
                            className="p-4 rounded-lg border-l-4 border-l-primary/50 bg-muted/30"
                          >
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="shrink-0">
                                Clase {sesion.numero}
                              </Badge>
                              <div className="flex-1">
                                <h5 className="font-medium">{sesion.nombre}</h5>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {sesion.descripcion}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Duración sugerida: {sesion.duracion_sugerida || 60} minutos
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recursos Recomendados */}
                  {contenidoGuia?.recursos_recomendados?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recursos Recomendados</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {contenidoGuia.recursos_recomendados.map((recurso: string, i: number) => (
                          <li key={i}>{recurso}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metodologías */}
                  {(guiaTema.metodologias?.length > 0 || contenidoGuia?.metodologias?.length > 0) && (
                    <div>
                      <h4 className="font-semibold mb-2">Metodologías</h4>
                      <div className="flex flex-wrap gap-2">
                        {(guiaTema.metodologias || contenidoGuia?.metodologias || []).map((met: string, i: number) => (
                          <Badge key={i} variant="secondary">{met}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estrategias de Evaluación */}
                  {contenidoGuia?.estrategias_evaluacion?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Estrategias de Evaluación</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {contenidoGuia.estrategias_evaluacion.map((est: string, i: number) => (
                          <li key={i}>{est}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actividades Transversales */}
                  {contenidoGuia?.actividades_transversales?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Actividades Transversales</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {contenidoGuia.actividades_transversales.map((act: string, i: number) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Competencias */}
                  {contenidoGuia?.competencias?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Competencias</h4>
                      <div className="flex flex-wrap gap-2">
                        {contenidoGuia.competencias.map((comp: string, i: number) => (
                          <Badge key={i} variant="outline">{comp}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contexto del Grupo */}
                  {guiaTema.contexto_grupo && (
                    <div>
                      <h4 className="font-semibold mb-2">Contexto del Grupo</h4>
                      <p className="text-sm text-muted-foreground">
                        {guiaTema.contexto_grupo}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Clases */}
        <TabsContent value="clases">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clases por Grupo</CardTitle>
              <CardDescription>Clases programadas y su estado</CardDescription>
            </CardHeader>
            <CardContent>
              {clasesByGrupo.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No hay clases programadas para este tema.
                  </p>
                  <Button variant="gradient" onClick={handleOpenProgramarClase}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Programar Primera Clase
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {clasesByGrupo.map(({ grupo, clases: clasesGrupo }) => (
                    <div key={grupo?.id || 'unknown'} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-semibold">
                            {grupo?.nombre || `${grupo?.grado} ${grupo?.seccion || ''}`}
                          </h4>
                        </div>
                        <Badge variant="outline">
                          {clasesGrupo.filter(c => c.estado === 'completada').length}/{clasesGrupo.length} completadas
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {clasesGrupo.map((clase) => {
                          const estadoConfig = estadoClaseConfig[clase.estado] || estadoClaseConfig.borrador;
                          return (
                            <div
                              key={clase.id}
                              className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline">Clase {clase.numero_sesion || '?'}</Badge>
                                  <Badge variant={estadoConfig.variant}>
                                    {estadoConfig.label}
                                  </Badge>
                                  <span className="font-medium">{tema.nombre}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {clase.fecha_programada && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(clase.fecha_programada).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short'
                                      })}
                                    </span>
                                  )}
                                  {clase.duracion_minutos && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {clase.duracion_minutos} min
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-3">
                                {clase.estado === 'borrador' || 
                                 clase.estado === 'generando_clase' || 
                                 clase.estado === 'editando_guia' ? (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleNavigateToClase(clase.id)}
                                  >
                                    <PlayCircle className="w-3 h-3 mr-1" />
                                    {clase.estado === 'borrador' ? 'Generar Guía' : 'Continuar'}
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleNavigateToClase(clase.id)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Ver
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Quizzes
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Retroalimentación
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Programar Clase */}
      <Dialog open={programarClaseDialogOpen} onOpenChange={setProgramarClaseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programar Clase
            </DialogTitle>
            <DialogDescription>
              Programa una clase específica para este tema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Grupo *</Label>
              <Select
                value={programarClaseForm.grupoId}
                onValueChange={handleGrupoChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nombre || `${grupo.grado} ${grupo.seccion || ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número de Clase</Label>
              <Select
                value={String(programarClaseForm.numeroClase)}
                onValueChange={(val) => setProgramarClaseForm(prev => ({
                  ...prev,
                  numeroClase: parseInt(val)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estructuraSesiones.length > 0 ? (
                    estructuraSesiones.map((sesion: any) => {
                      const yaExiste = clases.some(
                        c => c.id_grupo === programarClaseForm.grupoId && 
                             c.numero_sesion === sesion.numero
                      );
                      return (
                        <SelectItem 
                          key={sesion.numero} 
                          value={String(sesion.numero)}
                          disabled={yaExiste}
                        >
                          Clase {sesion.numero} {yaExiste ? '(Ya programada)' : '(Pendiente)'}
                        </SelectItem>
                      );
                    })
                  ) : (
                    Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={String(num)}>
                        Clase {num}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Info de la clase seleccionada */}
            {claseSeleccionada && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="font-medium text-sm">{claseSeleccionada.nombre}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {claseSeleccionada.descripcion}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Duración sugerida: {claseSeleccionada.duracion_sugerida || 60} minutos
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Programada *</Label>
                <Input
                  type="date"
                  value={programarClaseForm.fechaProgramada}
                  onChange={(e) => setProgramarClaseForm(prev => ({
                    ...prev,
                    fechaProgramada: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (minutos)</Label>
                <Input
                  type="number"
                  min="1"
                  value={programarClaseForm.duracion}
                  onChange={(e) => setProgramarClaseForm(prev => ({
                    ...prev,
                    duracion: parseInt(e.target.value) || 60
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contexto Específico (Opcional)</Label>
              <Textarea
                placeholder="Contexto adicional para esta clase específica..."
                value={programarClaseForm.contexto}
                onChange={(e) => setProgramarClaseForm(prev => ({
                  ...prev,
                  contexto: e.target.value
                }))}
                rows={3}
              />
            </div>

            <div
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                programarClaseForm.programarOtra
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setProgramarClaseForm(prev => ({
                ...prev,
                programarOtra: !prev.programarOtra
              }))}
            >
              <Checkbox checked={programarClaseForm.programarOtra} />
              <span className="text-sm">Programar otra clase después de esta</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramarClaseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleProgramarClase}
              disabled={
                !programarClaseForm.grupoId || 
                !programarClaseForm.fechaProgramada || 
                createClase.isPending
              }
            >
              {createClase.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Programando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Programar Clase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

