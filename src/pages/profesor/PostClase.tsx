import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClases } from '@/hooks/useClases';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useRecomendaciones } from '@/hooks/useRecomendaciones';
import { supabase } from '@/integrations/supabase/client';
import { processQuizResponses } from '@/lib/ai/generate';
import { Loader2, ChevronLeft, Send, CheckCircle2, Lightbulb, BookOpen, Target, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PostClase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [isProcessingRecomendaciones, setIsProcessingRecomendaciones] = useState(false);
  const [selectedClase, setSelectedClase] = useState<any>(null);

  // Get clases with estado en_clase or completada
  const { clases, isLoading: clasesLoading } = useClases();
  const clasesPost = clases.filter(c => 
    c.estado === 'en_clase' || c.estado === 'completada'
  );
  
  // Get quiz POST for selected clase
  const { quizzes: quizzesPost, publishQuiz } = useQuizzes(selectedClaseId, 'post');
  const quizPost = quizzesPost[0];

  // Get recomendaciones for quiz POST
  const { recomendaciones, createRecomendacion } = useRecomendaciones(quizPost?.id);

  // Get respuestas for quiz POST
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [isLoadingRespuestas, setIsLoadingRespuestas] = useState(false);
  const [alumnos, setAlumnos] = useState<any[]>([]);

  const loadRespuestas = async (quizId: string) => {
    setIsLoadingRespuestas(true);
    try {
      const { data, error } = await supabase
        .from('nota_alumno')
        .select(`
          *,
          alumno:alumnos(id, user_id)
        `)
        .eq('id_quiz', quizId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get detalles de respuestas
      const respuestaIds = data?.map(r => r.id) || [];
      if (respuestaIds.length > 0) {
        const { data: detalles, error: detallesError } = await supabase
          .from('respuestas_detalle')
          .select(`
            *,
            pregunta:preguntas(id, texto_pregunta, concepto, respuesta_correcta)
          `)
          .in('id_nota_alumno', respuestaIds);

        if (detallesError) throw detallesError;

        // Group detalles by respuesta
        const respuestasConDetalles = data?.map(respuesta => ({
          ...respuesta,
          respuestas_detalle: detalles?.filter(d => d.id_nota_alumno === respuesta.id) || []
        })) || [];

        setRespuestas(respuestasConDetalles);

        // Get alumnos info
        const alumnoIds = [...new Set(data?.map(r => r.id_alumno) || [])];
        if (alumnoIds.length > 0) {
          const { data: alumnosData, error: alumnosError } = await supabase
            .from('alumnos')
            .select(`
              id,
              user_id,
              profiles:profiles!alumnos_user_id_fkey(nombre, apellido)
            `)
            .in('id', alumnoIds);

          if (!alumnosError && alumnosData) {
            setAlumnos(alumnosData);
          }
        }
      } else {
        setRespuestas([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al cargar respuestas: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingRespuestas(false);
    }
  };

  const handlePublicarQuiz = async () => {
    if (!quizPost) return;

    try {
      const fechaDisponible = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 3); // 3 días para responder

      await publishQuiz.mutateAsync(quizPost.id);
      
      // Update quiz dates
      await supabase
        .from('quizzes')
        .update({
          fecha_disponible: fechaDisponible.toISOString(),
          fecha_limite: fechaLimite.toISOString()
        })
        .eq('id', quizPost.id);

      toast({ title: 'Quiz POST publicado', description: 'Los estudiantes pueden responder ahora' });
      
      // Reload respuestas
      if (quizPost.id) {
        loadRespuestas(quizPost.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al publicar: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const handleGenerarRecomendaciones = async () => {
    if (!quizPost || respuestas.length === 0 || !selectedClase) {
      toast({
        title: 'Error',
        description: 'No hay respuestas para procesar',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingRecomendaciones(true);
    try {
      // Get preguntas del quiz
      const { data: preguntas, error: preguntasError } = await supabase
        .from('preguntas')
        .select('id, texto_pregunta, concepto, respuesta_correcta')
        .eq('id_quiz', quizPost.id)
        .order('orden');

      if (preguntasError) throw preguntasError;

      // Prepare data for AI processing with context
      const processData = {
        respuestas: respuestas.map(r => ({
          id_alumno: r.id_alumno,
          respuestas_detalle: r.respuestas_detalle.map((d: any) => ({
            id_pregunta: d.id_pregunta,
            respuesta_alumno: d.respuesta_alumno,
            es_correcta: d.es_correcta
          }))
        })),
        preguntas: preguntas?.map(p => ({
          id: p.id,
          texto_pregunta: p.texto_pregunta,
          concepto: p.concepto,
          respuesta_correcta: p.respuesta_correcta
        })) || [],
        tema: selectedClase?.tema?.nombre || 'Tema no especificado',
        grado: selectedClase?.grupo?.grado || 'No especificado',
        area: selectedClase?.tema?.curso_plan?.nombre || 'No especificada',
        contexto: selectedClase?.contexto || ''
      };

      // Process with AI
      const resultado = await processQuizResponses(processData, 'post');

      // Save analysis general to first recommendation
      const analisisGeneral = resultado.analisis_general;

      // Save recomendaciones to DB
      for (const rec of resultado.recomendaciones) {
        await createRecomendacion.mutateAsync({
          id_quiz: quizPost.id,
          contenido: rec.contenido,
          titulo: rec.titulo,
          tipo: rec.tipo,
          prioridad: rec.prioridad,
          momento: rec.momento,
          concepto_relacionado: rec.concepto_relacionado,
          analisis_general: analisisGeneral as any
        });
      }

      toast({ 
        title: 'Recomendaciones generadas', 
        description: `${resultado.recomendaciones.length} recomendaciones para próximas sesiones` 
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al generar recomendaciones: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingRecomendaciones(false);
    }
  };

  // Update selected clase when selection changes
  useEffect(() => {
    if (selectedClaseId) {
      const clase = clasesPost.find(c => c.id === selectedClaseId);
      setSelectedClase(clase);
    }
  }, [selectedClaseId, clasesPost]);

  // Load respuestas when quiz is selected and published
  useEffect(() => {
    if (quizPost && quizPost.estado === 'publicado' && quizPost.id) {
      loadRespuestas(quizPost.id);
    }
  }, [quizPost?.id, quizPost?.estado]);

  const getPrioridadColor = (prioridad: string | null) => {
    switch (prioridad) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'outline';
    }
  };

  const getTipoIcon = (tipo: string | null) => {
    switch (tipo) {
      case 'metodologia': return <BookOpen className="w-4 h-4" />;
      case 'contenido': return <Target className="w-4 h-4" />;
      case 'actividad': return <Lightbulb className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (clasesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get analysis from first recommendation if available
  const analisisGeneral = recomendaciones[0]?.analisis_general as any;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Post-Clase: Quiz POST</h1>
          <p className="text-muted-foreground">
            Publica evaluaciones finales y genera recomendaciones
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clases disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Clases Dictadas</CardTitle>
            <CardDescription>Selecciona una clase para gestionar su quiz POST</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {clasesPost.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay clases dictadas
              </p>
            ) : (
              clasesPost.map((clase) => (
                <Card
                  key={clase.id}
                  className={`cursor-pointer transition-colors ${
                    selectedClaseId === clase.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedClaseId(clase.id);
                    if (quizPost?.id && quizPost.estado === 'publicado') {
                      loadRespuestas(quizPost.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{clase.tema?.nombre || 'Sin tema'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {clase.grupo?.nombre || `${clase.grupo?.grado} ${clase.grupo?.seccion || ''}`.trim()}
                        </p>
                        {clase.fecha_ejecutada && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Dictada: {new Date(clase.fecha_ejecutada).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                      {selectedClaseId === clase.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quiz POST Management */}
        {selectedClaseId && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión Quiz POST</CardTitle>
              <CardDescription>
                {quizPost ? `Quiz: ${quizPost.titulo}` : 'No hay quiz POST creado'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizPost ? (
                <Tabs defaultValue="publicar">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="publicar">Publicar</TabsTrigger>
                    <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
                    <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
                  </TabsList>

                  <TabsContent value="publicar" className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Estado:</span>
                        <Badge variant={quizPost.estado === 'publicado' ? 'default' : 'secondary'}>
                          {quizPost.estado}
                        </Badge>
                      </div>
                      {quizPost.estado === 'borrador' && (
                        <Button
                          className="w-full mt-4"
                          onClick={handlePublicarQuiz}
                          disabled={publishQuiz.isPending}
                        >
                          {publishQuiz.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Publicar Quiz POST
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="respuestas" className="space-y-4">
                    {isLoadingRespuestas ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : respuestas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay respuestas aún
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-medium">
                            {respuestas.length} respuesta(s) recibida(s)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleGenerarRecomendaciones}
                            disabled={isProcessingRecomendaciones || respuestas.length === 0}
                          >
                            {isProcessingRecomendaciones ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Generar Recomendaciones
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {respuestas.map((respuesta) => {
                            const alumno = alumnos.find(a => a.id === respuesta.id_alumno);
                            const nombre = alumno?.profiles 
                              ? `${alumno.profiles.nombre} ${alumno.profiles.apellido}`.trim()
                              : 'Alumno';
                            
                            return (
                              <div key={respuesta.id} className="p-3 rounded-lg border">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{nombre}</span>
                                  <Badge variant={respuesta.estado === 'completado' ? 'default' : 'secondary'}>
                                    {respuesta.estado}
                                  </Badge>
                                </div>
                                {respuesta.puntaje_total !== null && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Puntaje: {respuesta.puntaje_total}%
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="recomendaciones" className="space-y-4">
                    {recomendaciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay recomendaciones. Genera recomendaciones desde la pestaña Respuestas.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Análisis General */}
                        {analisisGeneral && (
                          <Card className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Análisis General</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-background">
                                  <p className="text-xs text-muted-foreground">Participación</p>
                                  <p className="text-lg font-bold">{analisisGeneral.participacion || 0}%</p>
                                </div>
                                <div className="p-2 rounded-lg bg-background">
                                  <p className="text-xs text-muted-foreground">Promedio</p>
                                  <p className="text-lg font-bold">{analisisGeneral.promedio_grupo || 0}%</p>
                                </div>
                                <div className="p-2 rounded-lg bg-background">
                                  <p className="text-xs text-muted-foreground">Nivel</p>
                                  <Badge variant={
                                    analisisGeneral.nivel_preparacion === 'alto' ? 'default' :
                                    analisisGeneral.nivel_preparacion === 'medio' ? 'secondary' : 'destructive'
                                  }>
                                    {analisisGeneral.nivel_preparacion || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                              {analisisGeneral.resumen && (
                                <p className="text-sm text-muted-foreground">{analisisGeneral.resumen}</p>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Recomendaciones */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Recomendaciones para Próximas Sesiones
                          </h4>
                          {recomendaciones.map((rec) => (
                            <Card
                              key={rec.id}
                              className="border-l-4"
                              style={{
                                borderLeftColor: rec.prioridad === 'alta' ? 'hsl(var(--destructive))' :
                                  rec.prioridad === 'media' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    {getTipoIcon(rec.tipo)}
                                    <span className="font-medium text-sm">{rec.titulo || 'Recomendación'}</span>
                                  </div>
                                  <Badge variant={getPrioridadColor(rec.prioridad)}>
                                    {rec.prioridad || 'Normal'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{rec.contenido}</p>
                                {rec.concepto_relacionado && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Concepto: {rec.concepto_relacionado}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Esta clase no tiene quiz POST. Créalo desde Generar Clase.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
