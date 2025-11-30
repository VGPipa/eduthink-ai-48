import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuizzesPendientes, useQuizzesCompletados } from '@/hooks/useAlumnoQuizzes';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  BookOpen,
  Play,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function Evaluaciones() {
  const navigate = useNavigate();
  const { quizzesPendientes, isLoading: pendientesLoading } = useQuizzesPendientes();
  const { quizzesCompletados, isLoading: completadosLoading } = useQuizzesCompletados();

  const isLoading = pendientesLoading || completadosLoading;

  const handleComenzarQuiz = (quizId: string) => {
    navigate(`/alumno/quiz/${quizId}`);
  };

  const handleVerResultado = (quizId: string) => {
    navigate(`/alumno/quiz/${quizId}/resultado`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Evaluaciones</h1>
        <p className="text-muted-foreground">
          Completa tus quizzes y revisa tus resultados
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Tabs */}
      {!isLoading && (
        <Tabs defaultValue="pendientes">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pendientes" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Pendientes ({quizzesPendientes.length})
            </TabsTrigger>
            <TabsTrigger value="completados" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completados ({quizzesCompletados.length})
            </TabsTrigger>
          </TabsList>

          {/* Pendientes Tab */}
          <TabsContent value="pendientes" className="mt-6 space-y-4">
            {quizzesPendientes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">¡Todo al día!</h3>
                  <p className="text-muted-foreground">No tienes evaluaciones pendientes por completar.</p>
                </CardContent>
              </Card>
            ) : (
              quizzesPendientes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-elevated transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${quiz.tipo === 'previo' ? 'bg-info/10' : 'bg-success/10'}`}>
                          <BookOpen className={`w-6 h-6 ${quiz.tipo === 'previo' ? 'text-info' : 'text-success'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{quiz.titulo}</h3>
                          <p className="text-muted-foreground">{quiz.curso_nombre}</p>
                          <p className="text-sm text-muted-foreground">{quiz.tema_nombre}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {quiz.tiempo_limite || 15} minutos
                            </div>
                            <div className="flex items-center gap-1">
                              <ClipboardList className="w-4 h-4" />
                              {quiz.total_preguntas} preguntas
                            </div>
                          </div>
                          {quiz.fecha_limite && (
                            <p className="text-xs text-warning mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Fecha límite: {new Date(quiz.fecha_limite).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="gradient" 
                        size="lg" 
                        className="shrink-0"
                        onClick={() => handleComenzarQuiz(quiz.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Comenzar Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completados Tab */}
          <TabsContent value="completados" className="mt-6 space-y-4">
            {quizzesCompletados.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Sin evaluaciones completadas</h3>
                  <p className="text-muted-foreground">Completa tu primer quiz para ver tus resultados aquí.</p>
                </CardContent>
              </Card>
            ) : (
              quizzesCompletados.map((quiz) => (
                <Card key={quiz.nota_alumno_id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${
                          (quiz.puntaje || 0) >= 80 ? 'bg-success/10' : 
                          (quiz.puntaje || 0) >= 60 ? 'bg-warning/10' : 'bg-destructive/10'
                        }`}>
                          <CheckCircle2 className={`w-6 h-6 ${
                            (quiz.puntaje || 0) >= 80 ? 'text-success' : 
                            (quiz.puntaje || 0) >= 60 ? 'text-warning' : 'text-destructive'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{quiz.titulo}</h3>
                          <p className="text-sm text-muted-foreground">{quiz.curso_nombre}</p>
                          <p className="text-xs text-muted-foreground">{quiz.tema_nombre}</p>
                          {quiz.fecha_completado && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Completado el {new Date(quiz.fecha_completado).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            (quiz.puntaje || 0) >= 80 ? 'text-success' : 
                            (quiz.puntaje || 0) >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {quiz.puntaje || 0}%
                          </p>
                          <Badge variant={quiz.tipo === 'previo' ? 'secondary' : 'default'}>
                            {quiz.tipo === 'previo' ? 'Diagnóstico' : 'Evaluación'}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVerResultado(quiz.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
