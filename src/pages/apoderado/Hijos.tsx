import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  TrendingUp,
  BookOpen,
  ClipboardList,
  ChevronRight,
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
    materiasDetalle: [
      { nombre: 'Matemáticas', promedio: 85, estado: 'bueno' },
      { nombre: 'Lenguaje', promedio: 78, estado: 'regular' },
      { nombre: 'Ciencias', promedio: 88, estado: 'bueno' },
      { nombre: 'Historia', promedio: 72, estado: 'atencion' }
    ]
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'Pérez',
    grado: '1ro Secundaria',
    seccion: 'B',
    promedioGeneral: 88,
    quizzesCompletados: 28,
    materiasDetalle: [
      { nombre: 'Matemáticas', promedio: 90, estado: 'bueno' },
      { nombre: 'Lenguaje', promedio: 85, estado: 'bueno' },
      { nombre: 'Ciencias', promedio: 92, estado: 'destacado' },
      { nombre: 'Historia', promedio: 86, estado: 'bueno' }
    ]
  }
];

export default function Hijos() {
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'destacado':
        return <Badge className="bg-success text-success-foreground">Destacado</Badge>;
      case 'bueno':
        return <Badge variant="default">Bueno</Badge>;
      case 'regular':
        return <Badge variant="secondary">Regular</Badge>;
      case 'atencion':
        return <Badge variant="destructive">Requiere atención</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Hijos</h1>
        <p className="text-muted-foreground">
          Información detallada del progreso académico de cada uno
        </p>
      </div>

      {/* Hijos detail */}
      <div className="space-y-6">
        {MOCK_HIJOS.map((hijo) => (
          <Card key={hijo.id}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="gradient-bg text-primary-foreground text-xl font-bold">
                    {hijo.nombre[0]}{hijo.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{hijo.nombre} {hijo.apellido}</CardTitle>
                  <CardDescription>{hijo.grado} - Sección {hijo.seccion}</CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-medium">{hijo.promedioGeneral}%</span>
                      <span className="text-muted-foreground">promedio</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      <span className="font-medium">{hijo.quizzesCompletados}</span>
                      <span className="text-muted-foreground">quizzes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-4">Rendimiento por Materia</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {hijo.materiasDetalle.map((materia) => (
                  <div 
                    key={materia.nombre}
                    className="p-4 rounded-lg border hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="font-medium">{materia.nombre}</span>
                      </div>
                      {getEstadoBadge(materia.estado)}
                    </div>
                    <Progress 
                      value={materia.promedio} 
                      className={`h-2 ${
                        materia.promedio >= 80 ? '[&>div]:bg-success' : 
                        materia.promedio >= 60 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
                      }`} 
                    />
                    <p className="text-right text-sm font-medium mt-1">{materia.promedio}%</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver reporte completo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
