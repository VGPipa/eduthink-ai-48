import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle2,
  BookOpen,
  Star,
  ChevronRight,
  Trophy
} from 'lucide-react';

const MOCK_STATS = {
  quizzesPendientes: 3,
  promedioGeneral: 82,
  quizzesCompletados: 24,
  rachaActual: 5
};

const MOCK_QUIZZES_PENDIENTES = [
  { id: '1', titulo: 'Quiz PRE - Ecuaciones', materia: 'Matemáticas', tipo: 'pre', tiempoLimite: 10 },
  { id: '2', titulo: 'Quiz POST - Revolución Industrial', materia: 'Historia', tipo: 'post', tiempoLimite: 15 },
  { id: '3', titulo: 'Quiz PRE - Ecosistemas', materia: 'Ciencias', tipo: 'pre', tiempoLimite: 10 }
];

const MOCK_RETROALIMENTACIONES = [
  {
    id: '1',
    clase: 'Fracciones equivalentes',
    materia: 'Matemáticas',
    fortalezas: ['Comprensión conceptual sólida', 'Aplicación correcta de fórmulas'],
    areas_mejora: ['Velocidad de resolución'],
    puntaje: 85
  },
  {
    id: '2',
    clase: 'Verbos irregulares',
    materia: 'Lenguaje',
    fortalezas: ['Excelente vocabulario', 'Uso correcto de tiempos verbales'],
    areas_mejora: ['Ortografía en algunos casos'],
    puntaje: 78
  }
];

const MOCK_PROGRESO_MATERIAS = [
  { materia: 'Matemáticas', progreso: 75, promedio: 82 },
  { materia: 'Lenguaje', progreso: 68, promedio: 78 },
  { materia: 'Ciencias', progreso: 82, promedio: 88 },
  { materia: 'Historia', progreso: 55, promedio: 72 }
];

export default function AlumnoDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">¡Hola, {user?.nombre}!</h1>
          <p className="text-muted-foreground">
            Sigue aprendiendo y mejorando cada día
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
          <Trophy className="w-5 h-5 text-warning" />
          <span className="font-medium">Racha de {MOCK_STATS.rachaActual} días</span>
          <Star className="w-4 h-4 text-warning fill-warning" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Quizzes pendientes"
          value={MOCK_STATS.quizzesPendientes}
          icon={ClipboardList}
          description="Por completar"
        />
        <StatCard
          title="Promedio general"
          value={`${MOCK_STATS.promedioGeneral}%`}
          icon={TrendingUp}
          trend={{ value: 5, positive: true }}
          variant="gradient"
        />
        <StatCard
          title="Quizzes completados"
          value={MOCK_STATS.quizzesCompletados}
          icon={CheckCircle2}
        />
        <StatCard
          title="Racha actual"
          value={`${MOCK_STATS.rachaActual} días`}
          icon={Star}
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quizzes and feedback */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Evaluaciones Pendientes
              </CardTitle>
              <CardDescription>Completa tus quizzes para seguir avanzando</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_QUIZZES_PENDIENTES.map((quiz) => (
                <div 
                  key={quiz.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${quiz.tipo === 'pre' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{quiz.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{quiz.materia}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {quiz.tiempoLimite} min
                    </div>
                    <Button variant="gradient" size="sm">
                      Comenzar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Retroalimentaciones Recientes</CardTitle>
              <CardDescription>Tu progreso en las últimas clases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_RETROALIMENTACIONES.map((feedback) => (
                <div key={feedback.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{feedback.clase}</h4>
                      <p className="text-sm text-muted-foreground">{feedback.materia}</p>
                    </div>
                    <Badge variant={feedback.puntaje >= 80 ? 'default' : 'secondary'}>
                      {feedback.puntaje}%
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-success mb-1">Fortalezas</p>
                      <ul className="space-y-1">
                        {feedback.fortalezas.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-warning mb-1">Por mejorar</p>
                      <ul className="space-y-1">
                        {feedback.areas_mejora.map((a, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="w-3 h-3 text-warning" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Progress sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi Progreso por Materia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_PROGRESO_MATERIAS.map((materia) => (
                <div key={materia.materia} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{materia.materia}</span>
                    <span className="text-muted-foreground">{materia.promedio}%</span>
                  </div>
                  <Progress value={materia.progreso} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gradient-bg text-primary-foreground">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h3 className="font-bold text-lg mb-2">¡Sigue así!</h3>
              <p className="text-sm opacity-90 mb-4">
                Estás en el top 15% de tu clase. Mantén tu racha de estudio.
              </p>
              <Button variant="secondary" size="sm" className="text-primary">
                Ver logros
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
