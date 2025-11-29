import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClases } from '@/hooks/useClases';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useRecomendaciones } from '@/hooks/useRecomendaciones';
import { useGuiasClase } from '@/hooks/useGuias';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { processQuizResponses } from '@/lib/ai/generate';
import { Loader2, ChevronLeft, Send, Brain, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PreClase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get clases with estado clase_programada
  const { clases, isLoading: clasesLoading } = useClases({ estado: 'clase_programada' });
  
  // Get quiz PRE for selected clase
  const { quizzes: quizzesPre, publishQuiz } = useQuizzes(selectedClaseId, 'previo');
  const quizPre = quizzesPre[0];
  
  // Get recomendaciones for selected clase
  const { recomendaciones, createRecomendacion, aplicarRecomendacion } = useRecomendaciones(selectedClaseId);
  
  // Get guias for selected clase
  const { createGuiaVersion } = useGuiasClase(selectedClaseId);

  // Get respuestas for quiz PRE
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [isLoadingRespuestas, setIsLoadingRespuestas] = useState(false);

  const loadRespuestas = async (quizId: string) => {
    setIsLoadingRespuestas(true);
    try {
      const { data, error } = await supabase
        .from('respuestas_alumno')
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
            pregunta:preguntas(id, texto_pregunta, concepto)
          `)
          .in('id_respuesta_alumno', respuestaIds);

        if (detallesError) throw detallesError;

        // Group detalles by respuesta
        const respuestasConDetalles = data?.map(respuesta => ({
          ...respuesta,
          respuestas_detalle: detalles?.filter(d => d.id_respuesta_alumno === respuesta.id) || []
        })) || [];

        setRespuestas(respuestasConDetalles);
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
    if (!quizPre) return;

    try {
      const fechaDisponible = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 2); // 2 días para responder

      await publishQuiz.mutateAsync(quizPre.id);
      
      // Update quiz dates
      await supabase
        .from('quizzes')
        .update({
          fecha_disponible: fechaDisponible.toISOString(),
          fecha_limite: fechaLimite.toISOString()
        })
        .eq('id', quizPre.id);

      toast({ title: 'Quiz PRE publicado', description: 'Los estudiantes pueden responder ahora' });
      
      // Reload respuestas
      if (quizPre.id) {
        loadRespuestas(quizPre.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al publicar: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const handleProcesarRespuestas = async () => {
    if (!quizPre || respuestas.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay respuestas para procesar',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get preguntas del quiz
      const { data: preguntas, error: preguntasError } = await supabase
        .from('preguntas')
        .select('id, texto_pregunta, concepto')
        .eq('id_quiz', quizPre.id)
        .order('orden');

      if (preguntasError) throw preguntasError;

      // Prepare data for AI processing
      const processData = {
        respuestas: respuestas.map(r => ({
          id_alumno: r.id_alumno,
          respuestas_detalle: r.respuestas_detalle.map((d: any) => ({
            id_pregunta: d.id_pregunta,
            respuesta_alumno: d.respuesta_alumno,
            es_correcta: d.es_correcta
          }))
        })),
        preguntas: preguntas || []
      };

      // Process with AI
      const resultado = await processQuizResponses(processData, 'previo');

      // Save recomendaciones to DB
      for (const rec of resultado.recomendaciones) {
        await createRecomendacion.mutateAsync({
          id_clase: selectedClaseId!,
          contenido: rec.contenido,
          aplicada: false
        });
      }


      toast({ 
        title: 'Respuestas procesadas', 
        description: `${resultado.recomendaciones.length} recomendaciones generadas` 
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al procesar respuestas: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAplicarRecomendacion = async (recomendacionId: string) => {
    if (!selectedClaseId || !quizPre) return;

    try {
      // Mark recomendacion as applied
      await aplicarRecomendacion.mutateAsync({
        id: recomendacionId,
        id_clase: selectedClaseId
      });

      // Get current guia version
      const { data: clase } = await supabase
        .from('clases')
        .select('id_guia_version_actual')
        .eq('id', selectedClaseId)
        .single();

      if (clase?.id_guia_version_actual) {
        const { data: guiaActual } = await supabase
          .from('guias_clase_versiones')
          .select('*')
          .eq('id', clase.id_guia_version_actual)
          .single();

        if (guiaActual) {
          // Create new version with recommendations applied
          await createGuiaVersion.mutateAsync({
            id_clase: selectedClaseId,
            objetivos: guiaActual.objetivos,
            estructura: guiaActual.estructura,
            contenido: guiaActual.contenido,
            preguntas_socraticas: guiaActual.preguntas_socraticas,
            generada_ia: true,
            estado: 'borrador'
          });
        }
      }

      toast({ title: 'Recomendación aplicada', description: 'Nueva versión de guía creada' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al aplicar recomendación: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  // Load respuestas when quiz is selected and published
  useEffect(() => {
    if (quizPre && quizPre.estado === 'publicado' && quizPre.id) {
      loadRespuestas(quizPre.id);
    }
  }, [quizPre?.id, quizPre?.estado]);

  if (clasesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pre-Clase: Quiz PRE</h1>
          <p className="text-muted-foreground">
            Publica y procesa evaluaciones diagnósticas antes de la clase
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clases disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Clases Programadas</CardTitle>
            <CardDescription>Selecciona una clase para gestionar su quiz PRE</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {clases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay clases programadas
              </p>
            ) : (
              clases.map((clase) => (
                <Card
                  key={clase.id}
                  className={`cursor-pointer transition-colors ${
                    selectedClaseId === clase.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedClaseId(clase.id);
                    if (quizPre?.id && quizPre.estado === 'publicado') {
                      loadRespuestas(quizPre.id);
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
                        {clase.fecha_programada && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(clase.fecha_programada).toLocaleDateString('es-ES')}
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

        {/* Quiz PRE Management */}
        {selectedClaseId && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión Quiz PRE</CardTitle>
              <CardDescription>
                {quizPre ? `Quiz: ${quizPre.titulo}` : 'No hay quiz PRE creado'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizPre ? (
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
                        <Badge variant={quizPre.estado === 'publicado' ? 'default' : 'secondary'}>
                          {quizPre.estado}
                        </Badge>
                      </div>
                      {quizPre.estado === 'borrador' && (
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
                              Publicar Quiz PRE
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {respuestas.length} respuesta(s) recibida(s)
                          </span>
                          <Button
                            size="sm"
                            onClick={handleProcesarRespuestas}
                            disabled={isProcessing || respuestas.length === 0}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <Brain className="w-4 h-4 mr-2" />
                                Procesar con IA
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {respuestas.map((respuesta) => (
                            <div key={respuesta.id} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Alumno</span>
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
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="recomendaciones" className="space-y-4">
                    {recomendaciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay recomendaciones. Procesa las respuestas primero.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {recomendaciones.map((rec) => (
                          <div
                            key={rec.id}
                            className={`p-4 rounded-lg border ${
                              rec.aplicada ? 'bg-success/10 border-success/20' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm">{rec.contenido}</p>
                              </div>
                              {rec.aplicada ? (
                                <Badge variant="default" className="ml-2">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Aplicada
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAplicarRecomendacion(rec.id)}
                                  className="ml-2"
                                >
                                  Aplicar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Esta clase no tiene quiz PRE. Créalo desde Generar Clase.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

