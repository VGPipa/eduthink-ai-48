import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Lightbulb
} from 'lucide-react';

// Mock data
const MOCK_STATS = {
  clasesEstaSemana: 12,
  materiasAsignadas: 4,
  totalEstudiantes: 128,
  promedioGeneral: 78
};

const MOCK_CLASES_EN_PREPARACION = [
  {
    id: '1',
    tema: 'Ecuaciones de segundo grado',
    materia: 'Matemáticas',
    grupo: '3ro A',
    fecha: '2024-01-20',
    estado: 'sin_guia',
    categoria: 'guia_pendiente'
  },
  {
    id: '2',
    tema: 'La Revolución Industrial',
    materia: 'Historia',
    grupo: '4to B',
    fecha: '2024-01-21',
    estado: 'editando_guia',
    categoria: 'evaluacion_pre_pendiente'
  },
  {
    id: '3',
    tema: 'El ciclo del agua',
    materia: 'Ciencias',
    grupo: '2do A',
    fecha: '2024-01-22',
    estado: 'quiz_pre_enviado',
    categoria: 'evaluacion_post_pendiente'
  }
];

const MOCK_CLASES_PROGRAMADAS = {
  hoy: [
    { id: '4', tema: 'Fracciones equivalentes', materia: 'Matemáticas', grupo: '2do B', hora: '08:00' },
    { id: '5', tema: 'Verbos irregulares', materia: 'Lenguaje', grupo: '3ro A', hora: '10:30' }
  ],
  manana: [
    { id: '6', tema: 'Ecosistemas', materia: 'Ciencias', grupo: '4to A', hora: '09:00' }
  ],
  estaSemana: [
    { id: '7', tema: 'Geometría básica', materia: 'Matemáticas', grupo: '1ro C', fecha: '2024-01-24' },
    { id: '8', tema: 'Comprensión lectora', materia: 'Lenguaje', grupo: '2do A', fecha: '2024-01-25' }
  ]
};

const MOCK_RECOMENDACIONES = [
  {
    id: '1',
    titulo: 'Reforzar conceptos básicos',
    descripcion: 'Los estudiantes de 3ro A mostraron dificultades en el quiz PRE sobre ecuaciones.',
    clase: 'Ecuaciones de segundo grado',
    prioridad: 'alta'
  },
  {
    id: '2',
    titulo: 'Excelente comprensión',
    descripcion: 'El grupo 2do B demostró dominio sólido en fracciones. Considera avanzar más rápido.',
    clase: 'Fracciones equivalentes',
    prioridad: 'media'
  }
];

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
  const [selectedTab, setSelectedTab] = useState('preparacion');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">¡Hola, {user?.nombre}!</h1>
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
          value={MOCK_STATS.clasesEstaSemana}
          icon={Calendar}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Materias asignadas"
          value={MOCK_STATS.materiasAsignadas}
          icon={BookOpen}
        />
        <StatCard
          title="Total estudiantes"
          value={MOCK_STATS.totalEstudiantes}
          icon={Users}
        />
        <StatCard
          title="Promedio general"
          value={`${MOCK_STATS.promedioGeneral}%`}
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
              {MOCK_CLASES_EN_PREPARACION.map((clase) => (
                <Card key={clase.id} className="hover:shadow-elevated transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{clase.tema}</h3>
                          <Badge variant={estadoBadgeConfig[clase.estado]?.variant || 'outline'}>
                            {estadoBadgeConfig[clase.estado]?.label || clase.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {clase.materia} • {clase.grupo}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(clase.fecha).toLocaleDateString('es-ES', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="programadas" className="space-y-4 mt-4">
              {/* Today */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Hoy</h3>
                <div className="space-y-2">
                  {MOCK_CLASES_PROGRAMADAS.hoy.map((clase) => (
                    <Card key={clase.id} className="hover:shadow-elevated transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-success/10 text-success">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{clase.tema}</h4>
                            <p className="text-sm text-muted-foreground">
                              {clase.materia} • {clase.grupo} • {clase.hora}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Ver guía</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tomorrow */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Mañana</h3>
                <div className="space-y-2">
                  {MOCK_CLASES_PROGRAMADAS.manana.map((clase) => (
                    <Card key={clase.id} className="hover:shadow-elevated transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{clase.tema}</h4>
                            <p className="text-sm text-muted-foreground">
                              {clase.materia} • {clase.grupo} • {clase.hora}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Ver guía</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* This week */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Esta semana</h3>
                <div className="space-y-2">
                  {MOCK_CLASES_PROGRAMADAS.estaSemana.map((clase) => (
                    <Card key={clase.id} className="hover:shadow-elevated transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{clase.tema}</h4>
                            <p className="text-sm text-muted-foreground">
                              {clase.materia} • {clase.grupo} • {new Date(clase.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
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
              {MOCK_RECOMENDACIONES.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2 mb-1">
                    <Badge variant={rec.prioridad === 'alta' ? 'destructive' : 'secondary'} className="text-xs">
                      {rec.prioridad}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{rec.titulo}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rec.descripcion}</p>
                  <p className="text-xs text-primary mt-2">{rec.clase}</p>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-sm">
                Ver todas las recomendaciones
              </Button>
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
