import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAlumno } from '@/hooks/useAlumno';
import { useQuizzesPendientes, useQuizzesCompletados } from '@/hooks/useAlumnoQuizzes';
import {
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle2,
  BookOpen,
  Star,
  ChevronRight,
  Trophy,
  Loader2,
  Play
} from 'lucide-react';

export default function AlumnoDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alumno, isLoading: alumnoLoading } = useAlumno();
  const { quizzesPendientes, isLoading: pendientesLoading } = useQuizzesPendientes();
  const { quizzesCompletados, isLoading: completadosLoading } = useQuizzesCompletados();

  const isLoading = alumnoLoading || pendientesLoading || completadosLoading;

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompletados = quizzesCompletados.length;
    const promedioGeneral = totalCompletados > 0
      ? Math.round(
          quizzesCompletados.reduce((acc, q) => acc + (q.puntaje || 0), 0) / totalCompletados
        )
      : 0;

    // Calculate trend (compare last 5 vs previous 5)
    const recentQuizzes = quizzesCompletados.slice(0, 5);
    const previousQuizzes = quizzesCompletados.slice(5, 10);
    
    const recentAvg = recentQuizzes.length > 0
      ? recentQuizzes.reduce((acc, q) => acc + (q.puntaje || 0), 0) / recentQuizzes.length
      : 0;
    const previousAvg = previousQuizzes.length > 0
      ? previousQuizzes.reduce((acc, q) => acc + (q.puntaje || 0), 0) / previousQuizzes.length
      : 0;
    
    const trendValue = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;
    const trendPositive = trendValue >= 0;

    return {
      quizzesPendientes: quizzesPendientes.length,
      promedioGeneral,
      quizzesCompletados: totalCompletados,
      trendValue: Math.abs(trendValue),
      trendPositive,
    };
  }, [quizzesPendientes, quizzesCompletados]);

  // Get progress by course
  const progresoPorCurso = useMemo(() => {
    const cursoMap = new Map<string, { total: number; suma: number }>();
    
    quizzesCompletados.forEach(quiz => {
      const curso = quiz.curso_nombre;
      const current = cursoMap.get(curso) || { total: 0, suma: 0 };
      cursoMap.set(curso, {
        total: current.total + 1,
        suma: current.suma + (quiz.puntaje || 0),
      });
    });

    return Array.from(cursoMap.entries())
      .map(([curso, data]) => ({
        curso,
        promedio: Math.round(data.suma / data.total),
        completados: data.total,
      }))
      .slice(0, 4);
  }, [quizzesCompletados]);

  // Get recent results for feedback section
  const retroalimentacionesRecientes = useMemo(() => {
    return quizzesCompletados.slice(0, 3).map(quiz => ({
      id: quiz.nota_alumno_id,
      titulo: quiz.titulo,
      curso: quiz.curso_nombre,
      tema: quiz.tema_nombre,
      puntaje: quiz.puntaje || 0,
      tipo: quiz.tipo,
    }));
  }, [quizzesCompletados]);

  // First 3 pending quizzes
  const quizzesPendientesPreview = quizzesPendientes.slice(0, 3);

  const handleComenzarQuiz = (quizId: string) => {
    navigate(`/alumno/quiz/${quizId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const nombreAlumno = alumno?.nombre || user?.email?.split('@')[0] || 'Estudiante';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">¡Hola, {nombreAlumno}!</h1>
          <p className="text-muted-foreground">
            Sigue aprendiendo y mejorando cada día
          </p>
        </div>
        {stats.quizzesCompletados > 0 && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
            <Trophy className="w-5 h-5 text-warning" />
            <span className="font-medium">{stats.quizzesCompletados} quizzes completados</span>
            <Star className="w-4 h-4 text-warning fill-warning" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Quizzes pendientes"
          value={stats.quizzesPendientes}
          icon={ClipboardList}
          description="Por completar"
        />
        <StatCard
          title="Promedio general"
          value={stats.promedioGeneral > 0 ? `${stats.promedioGeneral}%` : '-'}
          icon={TrendingUp}
          trend={stats.quizzesCompletados >= 5 ? { value: stats.trendValue, positive: stats.trendPositive } : undefined}
          variant="gradient"
        />
        <StatCard
          title="Quizzes completados"
          value={stats.quizzesCompletados}
          icon={CheckCircle2}
        />
        <StatCard
          title="Cursos activos"
          value={progresoPorCurso.length}
          icon={BookOpen}
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quizzes and feedback */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending quizzes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Evaluaciones Pendientes
                  </CardTitle>
                  <CardDescription>Completa tus quizzes para seguir avanzando</CardDescription>
                </div>
                {quizzesPendientes.length > 3 && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/alumno/evaluaciones')}>
                    Ver todas
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizzesPendientesPreview.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">¡Todo al día! No tienes quizzes pendientes.</p>
                </div>
              ) : (
                quizzesPendientesPreview.map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${quiz.tipo === 'previo' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{quiz.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{quiz.curso_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {quiz.tiempo_limite || 15} min
                      </div>
                      <Button 
                        variant="gradient" 
                        size="sm"
                        onClick={() => handleComenzarQuiz(quiz.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Comenzar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent results */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados Recientes</CardTitle>
              <CardDescription>Tu desempeño en las últimas evaluaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {retroalimentacionesRecientes.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Completa tu primer quiz para ver tus resultados aquí.</p>
                </div>
              ) : (
                retroalimentacionesRecientes.map((resultado) => (
                  <div key={resultado.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{resultado.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{resultado.curso}</p>
                        <p className="text-xs text-muted-foreground">{resultado.tema}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={resultado.puntaje >= 80 ? 'default' : resultado.puntaje >= 60 ? 'secondary' : 'destructive'}>
                          {resultado.puntaje}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resultado.tipo === 'previo' ? 'Diagnóstico' : 'Evaluación'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resultado.puntaje >= 80 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-sm text-success">¡Excelente desempeño!</span>
                        </>
                      ) : resultado.puntaje >= 60 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-warning" />
                          <span className="text-sm text-warning">Buen trabajo, sigue mejorando</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Revisa el material y vuelve a intentar</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi Progreso por Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progresoPorCurso.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Completa quizzes para ver tu progreso por curso.
                </p>
              ) : (
                progresoPorCurso.map((curso) => (
                  <div key={curso.curso} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{curso.curso}</span>
                      <span className="text-muted-foreground">{curso.promedio}%</span>
                    </div>
                    <Progress 
                      value={curso.promedio} 
                      className={`h-2 ${
                        curso.promedio >= 80 ? '[&>div]:bg-success' :
                        curso.promedio >= 60 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {curso.completados} quiz{curso.completados !== 1 ? 'zes' : ''} completado{curso.completados !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {stats.promedioGeneral >= 70 && (
            <Card className="gradient-bg text-primary-foreground">
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="font-bold text-lg mb-2">¡Sigue así!</h3>
                <p className="text-sm opacity-90 mb-4">
                  Tu promedio de {stats.promedioGeneral}% demuestra tu dedicación. ¡Continúa con el buen trabajo!
                </p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => navigate('/alumno/progreso')}
                >
                  Ver mi progreso
                </Button>
              </CardContent>
            </Card>
          )}

          {stats.quizzesPendientes > 0 && stats.promedioGeneral < 70 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-warning" />
                <h3 className="font-bold text-lg mb-2">¡Tienes quizzes pendientes!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Completa tus evaluaciones para mejorar tu promedio.
                </p>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/alumno/evaluaciones')}
                >
                  Ir a evaluaciones
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
