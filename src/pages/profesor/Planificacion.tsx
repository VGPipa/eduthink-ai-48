import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  PlayCircle,
  Eye,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const MOCK_STATS = {
  totalTemas: 48,
  temasCompletados: 18,
  progresoGeneral: 38,
  materiasAsignadas: 4
};

const MOCK_MATERIAS = [
  {
    id: '1',
    nombre: 'Matemáticas',
    grado: '3ro',
    grupo: 'A',
    seccion: 'Primaria',
    horasSemanales: 6,
    progreso: 42,
    bimestres: [
      {
        numero: 1,
        nombre: 'Bimestre I',
        temas: 4,
        progreso: 100,
        temasDetalle: [
          { id: '1', nombre: 'Números naturales', estado: 'completado', progreso: 100, sesiones: 4 },
          { id: '2', nombre: 'Operaciones básicas', estado: 'completado', progreso: 100, sesiones: 5 },
          { id: '3', nombre: 'Fracciones', estado: 'completado', progreso: 100, sesiones: 4 },
          { id: '4', nombre: 'Decimales', estado: 'completado', progreso: 100, sesiones: 3 }
        ]
      },
      {
        numero: 2,
        nombre: 'Bimestre II',
        temas: 4,
        progreso: 50,
        temasDetalle: [
          { id: '5', nombre: 'Ecuaciones de primer grado', estado: 'completado', progreso: 100, sesiones: 4 },
          { id: '6', nombre: 'Ecuaciones de segundo grado', estado: 'en_progreso', progreso: 60, sesiones: 5 },
          { id: '7', nombre: 'Sistemas de ecuaciones', estado: 'pendiente', progreso: 0, sesiones: 0 },
          { id: '8', nombre: 'Inecuaciones', estado: 'pendiente', progreso: 0, sesiones: 0 }
        ]
      },
      {
        numero: 3,
        nombre: 'Bimestre III',
        temas: 4,
        progreso: 0,
        temasDetalle: [
          { id: '9', nombre: 'Geometría plana', estado: 'pendiente', progreso: 0, sesiones: 0 },
          { id: '10', nombre: 'Perímetros y áreas', estado: 'pendiente', progreso: 0, sesiones: 0 },
          { id: '11', nombre: 'Volúmenes', estado: 'pendiente', progreso: 0, sesiones: 0 },
          { id: '12', nombre: 'Transformaciones', estado: 'pendiente', progreso: 0, sesiones: 0 }
        ]
      }
    ]
  },
  {
    id: '2',
    nombre: 'Lenguaje',
    grado: '3ro',
    grupo: 'A',
    seccion: 'Primaria',
    horasSemanales: 5,
    progreso: 35,
    bimestres: [
      {
        numero: 1,
        nombre: 'Bimestre I',
        temas: 3,
        progreso: 100,
        temasDetalle: [
          { id: '13', nombre: 'Comprensión lectora', estado: 'completado', progreso: 100, sesiones: 4 },
          { id: '14', nombre: 'Redacción básica', estado: 'completado', progreso: 100, sesiones: 3 },
          { id: '15', nombre: 'Gramática', estado: 'completado', progreso: 100, sesiones: 4 }
        ]
      },
      {
        numero: 2,
        nombre: 'Bimestre II',
        temas: 3,
        progreso: 33,
        temasDetalle: [
          { id: '16', nombre: 'Verbos irregulares', estado: 'en_progreso', progreso: 75, sesiones: 3 },
          { id: '17', nombre: 'Análisis literario', estado: 'pendiente', progreso: 0, sesiones: 0 },
          { id: '18', nombre: 'Ensayo', estado: 'pendiente', progreso: 0, sesiones: 0 }
        ]
      }
    ]
  }
];

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  en_progreso: { label: 'En progreso', variant: 'default' },
  completado: { label: 'Completado', variant: 'default' }
};

export default function Planificacion() {
  const navigate = useNavigate();
  const [selectedMateria, setSelectedMateria] = useState(MOCK_MATERIAS[0].id);

  const materiaActual = MOCK_MATERIAS.find(m => m.id === selectedMateria);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Planificación Académica 2024</h1>
        <p className="text-muted-foreground">
          Gestiona tus materias, temas y sesiones de clase
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de temas"
          value={MOCK_STATS.totalTemas}
          icon={BookOpen}
        />
        <StatCard
          title="Temas completados"
          value={MOCK_STATS.temasCompletados}
          icon={Target}
        />
        <StatCard
          title="Progreso general"
          value={`${MOCK_STATS.progresoGeneral}%`}
          icon={TrendingUp}
          variant="gradient"
        />
        <StatCard
          title="Materias asignadas"
          value={MOCK_STATS.materiasAsignadas}
          icon={Calendar}
        />
      </div>

      {/* Alert */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm">
            <span className="font-medium">2 materias</span> tienen temas sin guía maestra configurada.
          </p>
          <Button variant="outline" size="sm" className="ml-auto shrink-0">
            Ver detalles
          </Button>
        </CardContent>
      </Card>

      {/* Materias tabs */}
      <Tabs value={selectedMateria} onValueChange={setSelectedMateria}>
        <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0">
          {MOCK_MATERIAS.map((materia) => (
            <TabsTrigger
              key={materia.id}
              value={materia.id}
              className="data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground border flex-col items-start h-auto p-3 min-w-[200px]"
            >
              <span className="font-semibold">{materia.nombre}</span>
              <span className="text-xs opacity-80">
                {materia.grado} {materia.grupo} • {materia.horasSemanales}h/sem
              </span>
              <Progress value={materia.progreso} className="h-1 mt-2 w-full" />
            </TabsTrigger>
          ))}
        </TabsList>

        {MOCK_MATERIAS.map((materia) => (
          <TabsContent key={materia.id} value={materia.id} className="mt-6">
            <Accordion type="multiple" className="space-y-4" defaultValue={['bim-2']}>
              {materia.bimestres.map((bimestre) => (
                <AccordionItem
                  key={`bim-${bimestre.numero}`}
                  value={`bim-${bimestre.numero}`}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{bimestre.nombre}</span>
                        <Badge variant="secondary">{bimestre.temas} temas</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <Progress value={bimestre.progreso} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground">{bimestre.progreso}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {bimestre.temasDetalle.map((tema) => (
                        <Card key={tema.id} className="hover:shadow-elevated transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-2">{tema.nombre}</h4>
                              <Badge 
                                variant={estadoConfig[tema.estado]?.variant || 'secondary'}
                                className={tema.estado === 'completado' ? 'bg-success text-success-foreground' : ''}
                              >
                                {estadoConfig[tema.estado]?.label}
                              </Badge>
                            </div>
                            <Progress value={tema.progreso} className="h-1.5 mb-3" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <span>{tema.progreso}% completado</span>
                              <span>{tema.sesiones} sesiones</span>
                            </div>
                            <div className="flex gap-2">
                              {tema.estado === 'pendiente' ? (
                                <Button 
                                  variant="gradient" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => navigate('/profesor/generar-clase')}
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Iniciar
                                </Button>
                              ) : tema.estado === 'en_progreso' ? (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => navigate('/profesor/generar-clase')}
                                >
                                  <PlayCircle className="w-3 h-3 mr-1" />
                                  Continuar
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver detalle
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
