import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  TrendingUp,
  Star,
  Target,
  BookOpen,
  CheckCircle2,
  Trophy
} from 'lucide-react';

const MOCK_STATS = {
  promedioGeneral: 82,
  temasCompletados: 18,
  rachaActual: 5,
  posicionClase: 4
};

const MOCK_CURSOS = [
  { nombre: 'Matemáticas', promedio: 85, temas: 12, completados: 8, tendencia: 'up' },
  { nombre: 'Lenguaje', promedio: 78, temas: 10, completados: 6, tendencia: 'up' },
  { nombre: 'Ciencias', promedio: 88, temas: 8, completados: 7, tendencia: 'stable' },
  { nombre: 'Historia', promedio: 72, temas: 9, completados: 5, tendencia: 'down' }
];

const MOCK_LOGROS = [
  { nombre: 'Primera Evaluación', descripcion: 'Completaste tu primer quiz', fecha: '2024-01-05', icono: '🎯' },
  { nombre: 'Racha de 5 días', descripcion: 'Estudiaste 5 días consecutivos', fecha: '2024-01-18', icono: '🔥' },
  { nombre: 'Promedio Alto', descripcion: 'Obtuviste más de 90% en un quiz', fecha: '2024-01-15', icono: '⭐' },
  { nombre: 'Top 10', descripcion: 'Estás en el top 10 de tu clase', fecha: '2024-01-12', icono: '🏆' }
];

export default function Progreso() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mi Progreso</h1>
        <p className="text-muted-foreground">
          Sigue tu avance y celebra tus logros
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Promedio general"
          value={`${MOCK_STATS.promedioGeneral}%`}
          icon={TrendingUp}
          variant="gradient"
        />
        <StatCard
          title="Temas completados"
          value={MOCK_STATS.temasCompletados}
          icon={Target}
        />
        <StatCard
          title="Racha actual"
          value={`${MOCK_STATS.rachaActual} días`}
          icon={Star}
        />
        <StatCard
          title="Posición en clase"
          value={`#${MOCK_STATS.posicionClase}`}
          icon={Trophy}
          description="de 28 estudiantes"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress by subject */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Progreso por Curso
              </CardTitle>
              <CardDescription>Tu avance en cada asignatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {MOCK_CURSOS.map((curso) => (
                <div key={curso.nombre} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{curso.nombre}</h4>
                      <p className="text-sm text-muted-foreground">
                        {curso.completados} de {curso.temas} temas completados
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${
                        curso.promedio >= 80 ? 'text-success' : 
                        curso.promedio >= 60 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {curso.promedio}%
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {curso.tendencia === 'up' && <TrendingUp className="w-3 h-3 text-success" />}
                        {curso.tendencia === 'down' && <TrendingUp className="w-3 h-3 text-destructive rotate-180" />}
                        {curso.tendencia === 'stable' && <span className="w-3 h-3 bg-muted-foreground rounded-full inline-block" />}
                        <span>
                          {curso.tendencia === 'up' ? 'Mejorando' : 
                           curso.tendencia === 'down' ? 'Bajando' : 'Estable'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress value={(curso.completados / curso.temas) * 100} className="h-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Logros Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_LOGROS.map((logro, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="text-2xl">{logro.icono}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{logro.nombre}</p>
                    <p className="text-xs text-muted-foreground">{logro.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(logro.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gradient-bg text-primary-foreground">
            <CardContent className="p-6 text-center">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h3 className="font-bold text-lg mb-2">¡Excelente trabajo!</h3>
              <p className="text-sm opacity-90">
                Estás en el camino correcto. Sigue así y alcanzarás todas tus metas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
