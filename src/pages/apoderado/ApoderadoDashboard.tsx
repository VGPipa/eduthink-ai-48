import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  TrendingUp,
  BookOpen,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react';

const MOCK_HIJOS = [
  {
    id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    grado: '3ro Primaria',
    seccion: 'A',
    promedioGeneral: 82,
    quizzesCompletados: 24,
    ultimaActividad: 'hace 2 horas'
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'Pérez',
    grado: '1ro Secundaria',
    seccion: 'B',
    promedioGeneral: 88,
    quizzesCompletados: 28,
    ultimaActividad: 'hace 1 día'
  }
];

const MOCK_RETROALIMENTACIONES = [
  {
    id: '1',
    hijo: 'Juan',
    clase: 'Ecuaciones de segundo grado',
    materia: 'Matemáticas',
    mensaje: 'Juan mostró un buen entendimiento de los conceptos básicos. Se recomienda practicar más ejercicios de ecuaciones con fracciones.',
    fecha: '2024-01-18',
    tipo: 'mejora'
  },
  {
    id: '2',
    hijo: 'María',
    clase: 'La Revolución Industrial',
    materia: 'Historia',
    mensaje: 'María demostró excelente comprensión del tema y participación activa. Felicitaciones por su desempeño.',
    fecha: '2024-01-17',
    tipo: 'logro'
  },
  {
    id: '3',
    hijo: 'Juan',
    clase: 'El ciclo del agua',
    materia: 'Ciencias',
    mensaje: 'Juan necesita reforzar los conceptos de evaporación y condensación. Se sugiere revisar el material de apoyo.',
    fecha: '2024-01-15',
    tipo: 'atencion'
  }
];

const MOCK_PROGRESO_DETALLE = {
  juan: [
    { materia: 'Matemáticas', progreso: 75, estado: 'bueno' },
    { materia: 'Lenguaje', progreso: 68, estado: 'regular' },
    { materia: 'Ciencias', progreso: 82, estado: 'bueno' },
    { materia: 'Historia', progreso: 55, estado: 'atencion' }
  ]
};

export default function ApoderadoDashboard() {
  const { user } = useAuth();

  const getEstadoBadge = (tipo: string) => {
    switch (tipo) {
      case 'logro':
        return <Badge className="bg-success text-success-foreground">Logro</Badge>;
      case 'mejora':
        return <Badge variant="secondary">Por mejorar</Badge>;
      case 'atencion':
        return <Badge variant="destructive">Atención</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">¡Hola!</h1>
        <p className="text-muted-foreground">
          Aquí puedes seguir el progreso educativo de tus hijos
        </p>
      </div>

      {/* Hijos cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_HIJOS.map((hijo) => (
          <Card key={hijo.id} className="hover:shadow-elevated transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="gradient-bg text-primary-foreground text-lg font-semibold">
                    {hijo.nombre[0]}{hijo.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{hijo.nombre} {hijo.apellido}</h3>
                  <p className="text-sm text-muted-foreground">{hijo.grado} - Sección {hijo.seccion}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{hijo.promedioGeneral}%</p>
                      <p className="text-xs text-muted-foreground">Promedio general</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{hijo.quizzesCompletados}</p>
                      <p className="text-xs text-muted-foreground">Quizzes completados</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    Última actividad: {hijo.ultimaActividad}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Retroalimentaciones */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Mensajes de los Profesores
              </CardTitle>
              <CardDescription>
                Retroalimentación sobre el desempeño de tus hijos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_RETROALIMENTACIONES.map((ret) => (
                <div 
                  key={ret.id}
                  className="p-4 rounded-lg border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {ret.hijo[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{ret.hijo}</p>
                        <p className="text-xs text-muted-foreground">{ret.materia} - {ret.clase}</p>
                      </div>
                    </div>
                    {getEstadoBadge(ret.tipo)}
                  </div>
                  <p className="text-sm text-muted-foreground">{ret.mensaje}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(ret.fecha).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Progress sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Juan</CardTitle>
              <CardDescription>Por materia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_PROGRESO_DETALLE.juan.map((materia) => (
                <div key={materia.materia} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{materia.materia}</span>
                    <Badge variant={
                      materia.estado === 'bueno' ? 'default' : 
                      materia.estado === 'regular' ? 'secondary' : 'destructive'
                    }>
                      {materia.progreso}%
                    </Badge>
                  </div>
                  <Progress value={materia.progreso} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gradient-bg text-primary-foreground">
            <CardContent className="p-6">
              <Star className="w-10 h-10 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Resumen del Bimestre</h3>
              <p className="text-sm opacity-90 mb-4">
                Tus hijos están progresando bien. El promedio familiar es de 85%.
              </p>
              <Button variant="secondary" size="sm" className="text-primary">
                Ver reporte completo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximas Evaluaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <BookOpen className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Quiz de Matemáticas</p>
                  <p className="text-xs text-muted-foreground">Juan - Mañana</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <BookOpen className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Quiz de Ciencias</p>
                  <p className="text-xs text-muted-foreground">María - En 3 días</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
