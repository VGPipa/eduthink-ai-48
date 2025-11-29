import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Settings,
  TrendingUp,
  ChevronRight,
  UserPlus,
  FileText
} from 'lucide-react';

const MOCK_STATS = {
  profesores: 24,
  alumnos: 580,
  cursos: 12,
  quizzes: 156
};

const MOCK_ACTIVIDAD = [
  { accion: 'Profesor registrado', detalle: 'María García se unió al sistema', tiempo: 'hace 2 horas' },
  { accion: 'Plan anual actualizado', detalle: '3er grado - Matemáticas', tiempo: 'hace 4 horas' },
  { accion: 'Salón creado', detalle: '2do A - 32 estudiantes', tiempo: 'hace 1 día' },
  { accion: 'Asignación completada', detalle: 'Prof. López - Ciencias 4to', tiempo: 'hace 2 días' }
];

const MOCK_SALONES = [
  { nombre: '1ro A', ocupacion: 95, estudiantes: 30, capacidad: 32 },
  { nombre: '1ro B', ocupacion: 88, estudiantes: 28, capacidad: 32 },
  { nombre: '2do A', ocupacion: 100, estudiantes: 32, capacidad: 32 },
  { nombre: '2do B', ocupacion: 78, estudiantes: 25, capacidad: 32 },
  { nombre: '3ro A', ocupacion: 91, estudiantes: 29, capacidad: 32 }
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Bienvenido. Gestiona tu institución desde aquí.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Profesores"
          value={MOCK_STATS.profesores}
          icon={GraduationCap}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Alumnos"
          value={MOCK_STATS.alumnos}
          icon={Users}
        />
        <StatCard
          title="Cursos"
          value={MOCK_STATS.cursos}
          icon={BookOpen}
        />
        <StatCard
          title="Quizzes creados"
          value={MOCK_STATS.quizzes}
          icon={ClipboardList}
          variant="gradient"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_ACTIVIDAD.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{item.accion}</p>
                      <p className="text-sm text-muted-foreground">{item.detalle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.tiempo}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Salones status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Salones</CardTitle>
              <CardDescription>Ocupación por salón</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_SALONES.map((salon) => (
                <div key={salon.nombre} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{salon.nombre}</span>
                    <span className="text-muted-foreground">
                      {salon.estudiantes}/{salon.capacidad} estudiantes
                    </span>
                  </div>
                  <Progress value={salon.ocupacion} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/admin/plan-anual')}
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Plan Anual
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/admin/asignaciones')}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Asignaciones
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/admin/configuracion')}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuración
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-bg text-primary-foreground">
            <CardContent className="p-6">
              <TrendingUp className="w-10 h-10 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Rendimiento General</h3>
              <p className="text-sm opacity-90 mb-4">
                El promedio institucional ha mejorado un 8% este bimestre.
              </p>
              <Button variant="secondary" size="sm" className="text-primary">
                Ver reportes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
