import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClases } from '@/hooks/useClases';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useRecomendacionesSalon } from '@/hooks/useMisSalones';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EstadoClase } from '@/components/profesor/EstadoClase';
import { Loader2 } from 'lucide-react';
import {
  Sparkles,
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  FileText,
  CheckCircle2,
  Lightbulb,
  PlayCircle
} from 'lucide-react';


const estadoBadgeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  sin_guia: { label: 'Sin guía', variant: 'destructive' },
  generando_clase: { label: 'Generando...', variant: 'secondary' },
  editando_guia: { label: 'Editando guía', variant: 'outline' },
  guia_aprobada: { label: 'Guía lista', variant: 'default' },
  quiz_pre_enviado: { label: 'Quiz PRE enviado', variant: 'secondary' },
  quiz_post_enviado: { label: 'Quiz POST enviado', variant: 'secondary' }
};

export default function ProfesorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('preparacion');
  const [activatingQuiz, setActivatingQuiz] = useState<{ claseId: string; tipo: 'previo' | 'post' } | null>(null);
  
  // Get real data
  const { clases, isLoading: clasesLoading } = useClases();
  const { asignaciones, cursos, grupos } = useAsignaciones('2025');
  
  // Hook for quiz operations
  const { publishQuiz, closeQuiz } = useQuizzes();
  
  // Calculate stats
  const stats = useMemo(() => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    
    const clasesEstaSemana = clases.filter(c => {
      if (!c.fecha_programada) return false;
      const fecha = new Date(c.fecha_programada);
      return fecha >= inicioSemana && fecha <= finSemana;
    }).length;
    
    const totalEstudiantes = grupos.reduce((sum, g) => sum + (g?.cantidad_alumnos || 0), 0);
    
    return {
      clasesEstaSemana,
      cursosAsignados: cursos.length,
      totalEstudiantes,
      promedioGeneral: 0 // TODO: Calculate from quiz results
    };
  }, [clases, cursos, grupos]);
  
  // Filter classes by state
  const clasesEnPreparacion = useMemo(() => {
    return clases.filter(c => 
      c.estado === 'borrador' || 
      c.estado === 'generando_clase' || 
      c.estado === 'editando_guia'
    );
  }, [clases]);
  
  const clasesProgramadas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);
    finSemana.setHours(23, 59, 59, 999); // End of day
    
    const programadas = clases.filter(c => 
      c.estado === 'clase_programada' || 
      c.estado === 'guia_aprobada'
    );
    
    const hoyClases = programadas.filter(c => {
      if (!c.fecha_programada) return false;
      const fecha = new Date(c.fecha_programada);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === hoy.getTime();
    });
    
    const mananaClases = programadas.filter(c => {
      if (!c.fecha_programada) return false;
      const fecha = new Date(c.fecha_programada);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === manana.getTime();
    });
    
    const estaSemanaClases = programadas.filter(c => {
      if (!c.fecha_programada) return false;
      const fecha = new Date(c.fecha_programada);
      fecha.setHours(0, 0, 0, 0);
      return fecha >= hoy && fecha <= finSemana && 
             fecha.getTime() !== hoy.getTime() && 
             fecha.getTime() !== manana.getTime();
    });
    
    return { hoy: hoyClases, manana: mananaClases, estaSemana: estaSemanaClases };
  }, [clases]);
  
  // Load quizzes for all programmed classes
  const clasesProgramadasIds = useMemo(() => {
    const all = [
      ...clasesProgramadas.hoy,
      ...clasesProgramadas.manana,
      ...clasesProgramadas.estaSemana
    ];
    return all.map(c => c.id);
  }, [clasesProgramadas]);
  
  // Fetch quizzes for all classes (including those in preparation)
  const todasLasClasesIds = useMemo(() => {
    return [...new Set([...clases.map(c => c.id), ...clasesProgramadasIds])];
  }, [clases, clasesProgramadasIds]);
  
  const [quizzesMap, setQuizzesMap] = useState<Record<string, { previo?: string; post?: string }>>({});
  
  React.useEffect(() => {
    const loadQuizzes = async () => {
      if (todasLasClasesIds.length === 0) return;
      
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('id, id_clase, tipo, estado')
        .in('id_clase', todasLasClasesIds)
        .in('tipo', ['previo', 'post']);
      
      if (error) {
        console.error('Error loading quizzes:', error);
        return;
      }
      
      const map: Record<string, { previo?: string; post?: string }> = {};
      quizzes?.forEach(quiz => {
        if (!map[quiz.id_clase]) {
          map[quiz.id_clase] = {};
        }
        if (quiz.tipo === 'previo') {
          map[quiz.id_clase].previo = quiz.estado;
        } else if (quiz.tipo === 'post') {
          map[quiz.id_clase].post = quiz.estado;
        }
      });
      
      setQuizzesMap(map);
    };
    
    loadQuizzes();
  }, [todasLasClasesIds]);
  
  // Get recommendations from first grupo (or combine all)
  const primerGrupoId = grupos[0]?.id || null;
  const { data: recomendaciones = [] } = useRecomendacionesSalon(primerGrupoId);

  // Handler to activate/finalize PRE quiz
  const handleActivarQuizPre = async (claseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivatingQuiz({ claseId, tipo: 'previo' });
    try {
      // Get PRE quiz for this class
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, estado')
        .eq('id_clase', claseId)
        .eq('tipo', 'previo')
        .maybeSingle();

      if (quizError) throw quizError;

      if (!quiz) {
        toast({
          title: 'No hay quiz PRE',
          description: 'Esta clase no tiene quiz PRE generado',
          variant: 'destructive'
        });
        return;
      }

      // If quiz is published, close it; otherwise, publish it
      if (quiz.estado === 'publicado') {
        await closeQuiz.mutateAsync(quiz.id);
        toast({
          title: 'Quiz PRE finalizado',
          description: 'El quiz PRE ha sido cerrado'
        });
      } else {
        const fechaDisponible = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7); // 7 días para responder

        await publishQuiz.mutateAsync(quiz.id);
        
        await supabase
          .from('quizzes')
          .update({
            fecha_disponible: fechaDisponible.toISOString(),
            fecha_limite: fechaLimite.toISOString()
          })
          .eq('id', quiz.id);

        toast({
          title: 'Quiz PRE activado',
          description: 'Los estudiantes pueden responder el quiz PRE ahora'
        });
      }
      
      // Refresh quizzes map
      const { data: updatedQuiz } = await supabase
        .from('quizzes')
        .select('id, id_clase, tipo, estado')
        .eq('id_clase', claseId)
        .eq('tipo', 'previo')
        .maybeSingle();
      
      if (updatedQuiz) {
        setQuizzesMap(prev => ({
          ...prev,
          [claseId]: {
            ...prev[claseId],
            previo: updatedQuiz.estado
          }
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al procesar el quiz PRE: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setActivatingQuiz(null);
    }
  };

  // Handler to activate/finalize POST quiz
  const handleActivarQuizPost = async (claseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivatingQuiz({ claseId, tipo: 'post' });
    try {
      // Get POST quiz for this class
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, estado')
        .eq('id_clase', claseId)
        .eq('tipo', 'post')
        .maybeSingle();

      if (quizError) throw quizError;

      if (!quiz) {
        toast({
          title: 'No hay quiz POST',
          description: 'Esta clase no tiene quiz POST generado',
          variant: 'destructive'
        });
        return;
      }

      // If quiz is published, close it; otherwise, publish it
      if (quiz.estado === 'publicado') {
        await closeQuiz.mutateAsync(quiz.id);
        toast({
          title: 'Quiz POST finalizado',
          description: 'El quiz POST ha sido cerrado'
        });
      } else {
        const fechaDisponible = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7); // 7 días para responder

        await publishQuiz.mutateAsync(quiz.id);
        
        await supabase
          .from('quizzes')
          .update({
            fecha_disponible: fechaDisponible.toISOString(),
            fecha_limite: fechaLimite.toISOString()
          })
          .eq('id', quiz.id);

        toast({
          title: 'Quiz POST activado',
          description: 'Los estudiantes pueden responder el quiz POST ahora'
        });
      }
      
      // Refresh quizzes map
      const { data: updatedQuiz } = await supabase
        .from('quizzes')
        .select('id, id_clase, tipo, estado')
        .eq('id_clase', claseId)
        .eq('tipo', 'post')
        .maybeSingle();
      
      if (updatedQuiz) {
        setQuizzesMap(prev => ({
          ...prev,
          [claseId]: {
            ...prev[claseId],
            post: updatedQuiz.estado
          }
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al procesar el quiz POST: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setActivatingQuiz(null);
    }
  };
  
  if (clasesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">¡Hola!</h1>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tu actividad docente
          </p>
        </div>
        <Button 
          variant="gradient" 
          size="lg"
          onClick={() => navigate('/profesor/generar-clase')}
          className="gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Nueva Clase con IA
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clases esta semana"
          value={stats.clasesEstaSemana}
          icon={Calendar}
        />
        <StatCard
          title="Cursos asignados"
          value={stats.cursosAsignados}
          icon={BookOpen}
        />
        <StatCard
          title="Total estudiantes"
          value={stats.totalEstudiantes}
          icon={Users}
        />
        <StatCard
          title="Promedio general"
          value={stats.promedioGeneral > 0 ? `${stats.promedioGeneral}%` : 'N/A'}
          icon={TrendingUp}
          variant="gradient"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Classes section */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preparacion" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                En Preparación
              </TabsTrigger>
              <TabsTrigger value="programadas" className="gap-2">
                <Calendar className="w-4 h-4" />
                Programadas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preparacion" className="space-y-3 mt-4">
              {clasesEnPreparacion.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No hay clases en preparación</p>
                  </CardContent>
                </Card>
              ) : (
                clasesEnPreparacion.map((clase) => (
                  <Card 
                    key={clase.id} 
                    className="hover:shadow-elevated transition-shadow cursor-pointer"
                    onClick={() => navigate(`/profesor/generar-clase?clase=${clase.id}&tema=${clase.id_tema}&materia=${clase.tema?.curso_plan_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{clase.tema?.nombre || 'Sin tema'}</h3>
                            <Badge variant={estadoBadgeConfig[clase.estado || '']?.variant || 'outline'}>
                              {estadoBadgeConfig[clase.estado || '']?.label || clase.estado}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {clase.grupo?.nombre || `${clase.grupo?.grado} ${clase.grupo?.seccion || ''}`.trim()}
                            {clase.numero_sesion && ` • Sesión ${clase.numero_sesion}`}
                          </p>
                          {clase.fecha_programada && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(clase.fecha_programada).toLocaleDateString('es-ES', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                          )}
                          <div className="mt-2">
                            <EstadoClase
                              tieneGuia={!!clase.guia_version || !!clase.id_guia_version_actual}
                              tienePreQuiz={!!quizzesMap[clase.id]?.previo}
                              tienePostQuiz={!!quizzesMap[clase.id]?.post}
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="programadas" className="space-y-4 mt-4">
              {/* Today */}
              {clasesProgramadas.hoy.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Hoy</h3>
                  <div className="space-y-2">
                    {clasesProgramadas.hoy.map((clase) => (
                      <Card key={clase.id} className="hover:shadow-elevated transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-success/10 text-success">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{clase.tema?.nombre || 'Sin tema'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {clase.grupo?.nombre || `${clase.grupo?.grado} ${clase.grupo?.seccion || ''}`.trim()}
                                {clase.numero_sesion && ` • Sesión ${clase.numero_sesion}`}
                              </p>
                              <div className="mt-2">
                                <EstadoClase
                                  tieneGuia={!!clase.guia_version || !!clase.id_guia_version_actual}
                                  tienePreQuiz={!!quizzesMap[clase.id]?.previo}
                                  tienePostQuiz={!!quizzesMap[clase.id]?.post}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/profesor/generar-clase?clase=${clase.id}`)}
                            >
                              Ver guía
                            </Button>
                            <Button 
                              variant={quizzesMap[clase.id]?.previo === 'publicado' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(e) => handleActivarQuizPre(clase.id, e)}
                              disabled={activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'previo'}
                            >
                              {activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'previo' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {quizzesMap[clase.id]?.previo === 'publicado' ? 'Finalizando...' : 'Activando...'}
                                </>
                              ) : quizzesMap[clase.id]?.previo === 'publicado' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Finalizar PRE
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Empezar PRE
                                </>
                              )}
                            </Button>
                            <Button 
                              variant={quizzesMap[clase.id]?.post === 'publicado' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(e) => handleActivarQuizPost(clase.id, e)}
                              disabled={activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'post'}
                            >
                              {activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'post' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {quizzesMap[clase.id]?.post === 'publicado' ? 'Finalizando...' : 'Activando...'}
                                </>
                              ) : quizzesMap[clase.id]?.post === 'publicado' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Finalizar POST
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Empezar POST
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow */}
              {clasesProgramadas.manana.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Mañana</h3>
                  <div className="space-y-2">
                    {clasesProgramadas.manana.map((clase) => (
                      <Card key={clase.id} className="hover:shadow-elevated transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{clase.tema?.nombre || 'Sin tema'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {clase.grupo?.nombre || `${clase.grupo?.grado} ${clase.grupo?.seccion || ''}`.trim()}
                                {clase.numero_sesion && ` • Sesión ${clase.numero_sesion}`}
                              </p>
                              <div className="mt-2">
                                <EstadoClase
                                  tieneGuia={!!clase.guia_version || !!clase.id_guia_version_actual}
                                  tienePreQuiz={!!quizzesMap[clase.id]?.previo}
                                  tienePostQuiz={!!quizzesMap[clase.id]?.post}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/profesor/generar-clase?clase=${clase.id}`)}
                            >
                              Ver guía
                            </Button>
                            <Button 
                              variant={quizzesMap[clase.id]?.previo === 'publicado' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(e) => handleActivarQuizPre(clase.id, e)}
                              disabled={activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'previo'}
                            >
                              {activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'previo' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {quizzesMap[clase.id]?.previo === 'publicado' ? 'Finalizando...' : 'Activando...'}
                                </>
                              ) : quizzesMap[clase.id]?.previo === 'publicado' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Finalizar PRE
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Empezar PRE
                                </>
                              )}
                            </Button>
                            <Button 
                              variant={quizzesMap[clase.id]?.post === 'publicado' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(e) => handleActivarQuizPost(clase.id, e)}
                              disabled={activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'post'}
                            >
                              {activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'post' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {quizzesMap[clase.id]?.post === 'publicado' ? 'Finalizando...' : 'Activando...'}
                                </>
                              ) : quizzesMap[clase.id]?.post === 'publicado' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Finalizar POST
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Empezar POST
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* This week */}
              {clasesProgramadas.estaSemana.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Esta semana</h3>
                  <div className="space-y-2">
                    {clasesProgramadas.estaSemana.map((clase) => (
                      <Card key={clase.id} className="hover:shadow-elevated transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{clase.tema?.nombre || 'Sin tema'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {clase.grupo?.nombre || `${clase.grupo?.grado} ${clase.grupo?.seccion || ''}`.trim()}
                                {clase.numero_sesion && ` • Sesión ${clase.numero_sesion}`}
                                {clase.fecha_programada && ` • ${new Date(clase.fecha_programada).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/profesor/generar-clase?clase=${clase.id}`)}
                            >
                              Ver guía
                            </Button>
                            <Button 
                              variant={quizzesMap[clase.id]?.previo === 'publicado' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(e) => handleActivarQuizPre(clase.id, e)}
                              disabled={activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'previo'}
                            >
                              {activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'previo' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {quizzesMap[clase.id]?.previo === 'publicado' ? 'Finalizando...' : 'Activando...'}
                                </>
                              ) : quizzesMap[clase.id]?.previo === 'publicado' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Finalizar PRE
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Empezar PRE
                                </>
                              )}
                            </Button>
                            <Button 
                              variant={quizzesMap[clase.id]?.post === 'publicado' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(e) => handleActivarQuizPost(clase.id, e)}
                              disabled={activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'post'}
                            >
                              {activatingQuiz?.claseId === clase.id && activatingQuiz?.tipo === 'post' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {quizzesMap[clase.id]?.post === 'publicado' ? 'Finalizando...' : 'Activando...'}
                                </>
                              ) : quizzesMap[clase.id]?.post === 'publicado' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Finalizar POST
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Empezar POST
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {clasesProgramadas.hoy.length === 0 && clasesProgramadas.manana.length === 0 && clasesProgramadas.estaSemana.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No hay clases programadas</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Recommendations sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Recomendaciones IA
              </CardTitle>
              <CardDescription>
                Sugerencias basadas en el análisis de tus clases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recomendaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay recomendaciones disponibles
                </p>
              ) : (
                <>
                  {recomendaciones.slice(0, 3).map((rec) => (
                    <div 
                      key={rec.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <Badge variant={rec.tipo === 'refuerzo' ? 'destructive' : 'secondary'} className="text-xs">
                          {rec.tipo}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{rec.titulo}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{rec.descripcion}</p>
                    </div>
                  ))}
                  {recomendaciones.length > 3 && (
                    <Button variant="ghost" className="w-full text-sm">
                      Ver todas las recomendaciones ({recomendaciones.length})
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/profesor/planificacion')}
              >
                <FileText className="w-4 h-4" />
                Ver planificación
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/profesor/mis-salones')}
              >
                <Users className="w-4 h-4" />
                Métricas por salón
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/profesor/metricas')}
              >
                <TrendingUp className="w-4 h-4" />
                Métricas globales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
