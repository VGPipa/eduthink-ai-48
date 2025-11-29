import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClases } from '@/hooks/useClases';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useRetroalimentaciones } from '@/hooks/useRetroalimentaciones';
import { supabase } from '@/integrations/supabase/client';
import { generateRetroalimentaciones } from '@/lib/ai/generate';
import { Loader2, ChevronLeft, Send, Brain, CheckCircle2, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PostClase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get clases with estado en_clase or completada
  const { clases, updateClase, isLoading: clasesLoading } = useClases();
  const clasesPost = clases.filter(c => 
    c.estado === 'en_clase' || c.estado === 'completada'
  );
  
  // Get quiz POST for selected clase
  const { quizzes: quizzesPost, publishQuiz } = useQuizzes(selectedClaseId, 'post');
  const quizPost = quizzesPost[0];
  
  // Get retroalimentaciones for selected clase
  const { retroalimentaciones, retroalimentacionesIndividuales, retroalimentacionesGrupales, createRetroalimentacion } = useRetroalimentaciones(selectedClaseId);

  // Get respuestas for quiz POST
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [isLoadingRespuestas, setIsLoadingRespuestas] = useState(false);
  const [alumnos, setAlumnos] = useState<any[]>([]);

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

  const handleGenerarRetroalimentaciones = async () => {
    if (!quizPost || respuestas.length === 0 || !selectedClaseId) {
      toast({
        title: 'Error',
        description: 'No hay respuestas para procesar',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare data for individual feedback
      for (const respuesta of respuestas) {
        const alumno = alumnos.find(a => a.id === respuesta.id_alumno);
        const nombreAlumno = alumno?.profiles 
          ? `${alumno.profiles.nombre} ${alumno.profiles.apellido}`.trim()
          : undefined;

        const retroIndividual = await generateRetroalimentaciones(
          [respuesta],
          'individual',
          nombreAlumno
        );

        await createRetroalimentacion.mutateAsync({
          id_clase: selectedClaseId,
          id_alumno: respuesta.id_alumno,
          tipo: 'individual',
          contenido: retroIndividual.contenido,
          fortalezas: retroIndividual.fortalezas,
          areas_mejora: retroIndividual.areas_mejora,
          recomendaciones: retroIndividual.recomendaciones
        });
      }

      // Generate group feedback
      const retroGrupal = await generateRetroalimentaciones(
        respuestas,
        'grupal'
      );

      await createRetroalimentacion.mutateAsync({
        id_clase: selectedClaseId,
        tipo: 'grupal',
        contenido: retroGrupal.contenido,
        fortalezas: retroGrupal.fortalezas,
        areas_mejora: retroGrupal.areas_mejora,
        recomendaciones: retroGrupal.recomendaciones
      });


      // Update clase estado to completada
      await updateClase.mutateAsync({
        id: selectedClaseId,
        estado: 'completada'
      });

      toast({ 
        title: 'Retroalimentaciones generadas', 
        description: `${respuestas.length} individuales + 1 grupal` 
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al generar retroalimentaciones: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load respuestas when quiz is selected and published
  useEffect(() => {
    if (quizPost && quizPost.estado === 'publicado' && quizPost.id) {
      loadRespuestas(quizPost.id);
    }
  }, [quizPost?.id, quizPost?.estado]);

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
          <h1 className="text-2xl font-bold">Post-Clase: Quiz POST</h1>
          <p className="text-muted-foreground">
            Publica evaluaciones finales y genera retroalimentaciones
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
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {respuestas.length} respuesta(s) recibida(s)
                          </span>
                          <Button
                            size="sm"
                            onClick={handleGenerarRetroalimentaciones}
                            disabled={isGenerating || respuestas.length === 0}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Brain className="w-4 h-4 mr-2" />
                                Generar Feedback
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

                  <TabsContent value="feedback" className="space-y-4">
                    {retroalimentaciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay retroalimentaciones. Genera feedback desde la pestaña Respuestas.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Grupal */}
                        {retroalimentacionesGrupales.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4" />
                              <h4 className="font-medium">Retroalimentación Grupal</h4>
                            </div>
                            {retroalimentacionesGrupales.map((retro) => (
                              <Card key={retro.id} className="mb-3">
                                <CardContent className="p-4">
                                  <p className="text-sm mb-3">{retro.contenido}</p>
                                  {retro.fortalezas && Array.isArray(retro.fortalezas) && retro.fortalezas.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs font-medium text-success mb-1">Fortalezas:</p>
                                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                                        {(retro.fortalezas as string[]).map((f, i) => (
                                          <li key={i}>{f}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {retro.areas_mejora && Array.isArray(retro.areas_mejora) && retro.areas_mejora.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs font-medium text-warning mb-1">Áreas de mejora:</p>
                                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                                        {(retro.areas_mejora as string[]).map((a, i) => (
                                          <li key={i}>{a}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}

                        {/* Individuales */}
                        {retroalimentacionesIndividuales.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4" />
                              <h4 className="font-medium">Retroalimentaciones Individuales</h4>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {retroalimentacionesIndividuales.map((retro) => {
                                const alumno = alumnos.find(a => a.id === retro.id_alumno);
                                const nombre = alumno?.profiles 
                                  ? `${alumno.profiles.nombre} ${alumno.profiles.apellido}`.trim()
                                  : 'Alumno';
                                
                                return (
                                  <Card key={retro.id}>
                                    <CardContent className="p-3">
                                      <p className="text-xs font-medium mb-2">{nombre}</p>
                                      <p className="text-xs mb-2">{retro.contenido}</p>
                                      {retro.recomendaciones && (retro.recomendaciones as string[]).length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium mb-1">Recomendaciones:</p>
                                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                                            {(retro.recomendaciones as string[]).map((r, i) => (
                                              <li key={i}>{r}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}
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

