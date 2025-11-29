import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/StatCard';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  Star,
  AlertTriangle,
  BookOpen,
  Award
} from 'lucide-react';

const MOCK_STATS = {
  promedioGeneral: 76,
  totalAlumnos: 128,
  quizzesCompletados: 342,
  tasaAprobacion: 82
};

const MOCK_POR_CURSO = [
  { id: '1', materia: 'Matemáticas', grupo: '3ro A', promedio: 78, quizzes: 45, asistencia: 92 },
  { id: '2', materia: 'Matemáticas', grupo: '3ro B', promedio: 74, quizzes: 42, asistencia: 88 },
  { id: '3', materia: 'Lenguaje', grupo: '3ro A', promedio: 82, quizzes: 38, asistencia: 94 },
  { id: '4', materia: 'Ciencias', grupo: '4to A', promedio: 71, quizzes: 35, asistencia: 90 }
];

const MOCK_ALUMNOS_DESTACADOS = [
  { nombre: 'María García', promedio: 95, racha: 12, curso: '3ro A - Matemáticas' },
  { nombre: 'Juan López', promedio: 92, racha: 8, curso: '3ro A - Lenguaje' },
  { nombre: 'Ana Martínez', promedio: 90, racha: 10, curso: '4to A - Ciencias' }
];

const MOCK_ALUMNOS_ATENCION = [
  { nombre: 'Carlos Ruiz', promedio: 48, pendientes: 3, curso: '3ro B - Matemáticas' },
  { nombre: 'Pedro Sánchez', promedio: 52, pendientes: 2, curso: '3ro A - Matemáticas' },
  { nombre: 'Laura Gómez', promedio: 55, pendientes: 4, curso: '4to A - Ciencias' }
];

const MOCK_TEMAS_DESAFIANTES = [
  { tema: 'Ecuaciones de segundo grado', materia: 'Matemáticas', dificultad: 'alta', promedio: 62, intentos: 45 },
  { tema: 'Análisis literario', materia: 'Lenguaje', dificultad: 'media', promedio: 68, intentos: 38 },
  { tema: 'Reacciones químicas', materia: 'Ciencias', dificultad: 'alta', promedio: 58, intentos: 35 }
];

export default function Metricas() {
  const [selectedTab, setSelectedTab] = useState('curso');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Métricas Globales</h1>
        <p className="text-muted-foreground">
          Análisis del rendimiento de todos tus estudiantes
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
          title="Total alumnos"
          value={MOCK_STATS.totalAlumnos}
          icon={Users}
        />
        <StatCard
          title="Quizzes completados"
          value={MOCK_STATS.quizzesCompletados}
          icon={ClipboardList}
        />
        <StatCard
          title="Tasa de aprobación"
          value={`${MOCK_STATS.tasaAprobacion}%`}
          icon={CheckCircle2}
        />
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="curso">Por Curso</TabsTrigger>
          <TabsTrigger value="alumno">Por Alumno</TabsTrigger>
          <TabsTrigger value="tema">Por Tema</TabsTrigger>
        </TabsList>

        <TabsContent value="curso" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_POR_CURSO.map((curso) => (
              <Card key={curso.id} className="hover:shadow-elevated transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{curso.materia}</h3>
                      <p className="text-sm text-muted-foreground">{curso.grupo}</p>
                    </div>
                    <Badge variant={curso.promedio >= 75 ? 'default' : 'secondary'}>
                      {curso.promedio}%
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Promedio</span>
                        <span className="font-medium">{curso.promedio}%</span>
                      </div>
                      <Progress value={curso.promedio} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Quizzes</p>
                        <p className="font-semibold">{curso.quizzes}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Asistencia</p>
                        <p className="font-semibold">{curso.asistencia}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alumno" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Destacados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-warning" />
                  Alumnos Destacados
                </CardTitle>
                <CardDescription>Mejores promedios y rachas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOCK_ALUMNOS_DESTACADOS.map((alumno, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-success/5 border border-success/20">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{alumno.nombre}</p>
                      <p className="text-sm text-muted-foreground">{alumno.curso}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">{alumno.promedio}%</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        {alumno.racha} días
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Requieren atención */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Requieren Atención
                </CardTitle>
                <CardDescription>Alumnos con bajo rendimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOCK_ALUMNOS_ATENCION.map((alumno, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{alumno.nombre}</p>
                      <p className="text-sm text-muted-foreground">{alumno.curso}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">{alumno.promedio}%</p>
                      <p className="text-xs text-muted-foreground">
                        {alumno.pendientes} pendientes
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tema" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Temas Más Desafiantes
              </CardTitle>
              <CardDescription>Temas con mayor dificultad para los estudiantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_TEMAS_DESAFIANTES.map((tema, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{tema.tema}</h4>
                        <p className="text-sm text-muted-foreground">{tema.materia}</p>
                      </div>
                      <Badge variant={tema.dificultad === 'alta' ? 'destructive' : 'secondary'}>
                        Dificultad {tema.dificultad}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Promedio</p>
                        <div className="flex items-center gap-2">
                          <Progress value={tema.promedio} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{tema.promedio}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Intentos de quiz</p>
                        <p className="font-semibold">{tema.intentos}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
