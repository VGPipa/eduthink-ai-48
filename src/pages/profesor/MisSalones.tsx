import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const MOCK_MIS_SALONES = [
  { id: '1', nombre: '3ro A', grado: '3ro Primaria', alumnos: 28 },
  { id: '2', nombre: '3ro B', grado: '3ro Primaria', alumnos: 30 },
  { id: '3', nombre: '4to A', grado: '4to Primaria', alumnos: 32 }
];

const MOCK_METRICAS = {
  participacion: 85,
  dominioConceptos: 72,
  areasFuertes: ['Resolución de problemas', 'Trabajo en equipo', 'Comprensión lectora'],
  areasDificultad: ['Operaciones con fracciones', 'Redacción de ensayos'],
  alumnosEnRiesgo: 4,
  preMetricas: {
    participacion: 92,
    nivelPreparacion: 65,
    conceptosDebiles: ['Ecuaciones con fracciones', 'Factorización']
  },
  postMetricas: {
    nivelLogro: 78,
    distribucion: {
      riesgo: 4,
      suficiente: 8,
      bueno: 12,
      destacado: 4
    },
    conceptosLogrados: ['Ecuaciones básicas', 'Gráficas lineales']
  }
};

const MOCK_ALUMNOS_RIESGO = [
  { nombre: 'Carlos M.', promedio: 45, quizzesPendientes: 3 },
  { nombre: 'Ana R.', promedio: 48, quizzesPendientes: 2 },
  { nombre: 'Pedro S.', promedio: 52, quizzesPendientes: 1 },
  { nombre: 'Laura G.', promedio: 55, quizzesPendientes: 2 }
];

export default function MisSalones() {
  const [selectedSalon, setSelectedSalon] = useState<string>('');
  const [selectedCurso, setSelectedCurso] = useState('todos');

  const salonActual = MOCK_MIS_SALONES.find(s => s.id === selectedSalon);

  if (!selectedSalon) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Mis Salones</h1>
          <p className="text-muted-foreground">
            Selecciona un salón para ver sus métricas detalladas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_MIS_SALONES.map((salon) => (
            <Card 
              key={salon.id} 
              className="cursor-pointer hover:shadow-elevated transition-all hover:border-primary"
              onClick={() => setSelectedSalon(salon.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl gradient-bg">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-1">{salon.nombre}</h3>
                <p className="text-sm text-muted-foreground mb-3">{salon.grado}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{salon.alumnos} estudiantes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSalon('')}>
              ← Volver
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{salonActual?.nombre} - {salonActual?.grado}</h1>
          <p className="text-muted-foreground">
            {salonActual?.alumnos} estudiantes • Métricas de desempeño
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCurso} onValueChange={setSelectedCurso}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cursos</SelectItem>
              <SelectItem value="matematicas">Matemáticas</SelectItem>
              <SelectItem value="lenguaje">Lenguaje</SelectItem>
              <SelectItem value="ciencias">Ciencias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Participación promedio"
          value={`${MOCK_METRICAS.participacion}%`}
          icon={Users}
        />
        <StatCard
          title="Dominio de conceptos"
          value={`${MOCK_METRICAS.dominioConceptos}%`}
          icon={Target}
          variant="gradient"
        />
        <StatCard
          title="Nivel de logro"
          value={`${MOCK_METRICAS.postMetricas.nivelLogro}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Alumnos en riesgo"
          value={MOCK_METRICAS.alumnosEnRiesgo}
          icon={AlertTriangle}
          description="Requieren atención"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Metrics detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* PRE Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-info" />
                Métricas PRE (Diagnóstico)
              </CardTitle>
              <CardDescription>Evaluación de conocimientos previos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Participación</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{MOCK_METRICAS.preMetricas.participacion}%</span>
                    <Badge className="bg-success text-success-foreground">Excelente</Badge>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Nivel de preparación</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{MOCK_METRICAS.preMetricas.nivelPreparacion}%</span>
                    <Badge variant="secondary">Medio</Badge>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Conceptos débiles identificados:</p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_METRICAS.preMetricas.conceptosDebiles.map((concepto, i) => (
                    <Badge key={i} variant="destructive" className="bg-destructive/10 text-destructive">
                      {concepto}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* POST Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Métricas POST (Evaluación)
              </CardTitle>
              <CardDescription>Resultados de aprendizaje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">Distribución de niveles</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Riesgo', value: MOCK_METRICAS.postMetricas.distribucion.riesgo, color: 'bg-destructive' },
                    { label: 'Suficiente', value: MOCK_METRICAS.postMetricas.distribucion.suficiente, color: 'bg-warning' },
                    { label: 'Bueno', value: MOCK_METRICAS.postMetricas.distribucion.bueno, color: 'bg-primary' },
                    { label: 'Destacado', value: MOCK_METRICAS.postMetricas.distribucion.destacado, color: 'bg-success' }
                  ].map((nivel) => (
                    <div key={nivel.label} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className={`w-8 h-8 rounded-full ${nivel.color} mx-auto mb-2 flex items-center justify-center text-sm font-bold text-white`}>
                        {nivel.value}
                      </div>
                      <p className="text-xs text-muted-foreground">{nivel.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Conceptos logrados:</p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_METRICAS.postMetricas.conceptosLogrados.map((concepto, i) => (
                    <Badge key={i} className="bg-success/10 text-success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {concepto}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Areas fuertes y débiles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Áreas Fuertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_METRICAS.areasFuertes.map((area, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-success/10">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Áreas de Dificultad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_METRICAS.areasDificultad.map((area, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-warning/10">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Alumnos en riesgo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Alumnos que Requieren Atención
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_ALUMNOS_RIESGO.map((alumno, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div>
                    <p className="font-medium text-sm">{alumno.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Promedio: {alumno.promedio}% • {alumno.quizzesPendientes} quiz pendiente(s)
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">Ver</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
