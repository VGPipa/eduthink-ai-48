import { useState, useEffect } from 'react';
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
import { useTemasProfesor } from '@/hooks/useTemasProfesor';
import { Loader2 } from 'lucide-react';
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

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  en_progreso: { label: 'En progreso', variant: 'default' },
  completado: { label: 'Completado', variant: 'default' }
};

export default function Planificacion() {
  const navigate = useNavigate();
  const { cursosConTemas, isLoading, stats, getTemasByBimestre } = useTemasProfesor('2024');
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null);

  // Set first curso as selected when data loads
  useEffect(() => {
    if (!selectedCurso && cursosConTemas.length > 0) {
      setSelectedCurso(cursosConTemas[0].id);
    }
  }, [cursosConTemas, selectedCurso]);

  const cursoActual = cursosConTemas.find(c => c.id === selectedCurso);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cursosConTemas.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Planificación Académica 2024</h1>
          <p className="text-muted-foreground">
            Gestiona tus materias, temas y sesiones de clase
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No tienes materias asignadas. Contacta al administrador para obtener asignaciones.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          value={stats.totalTemas}
          icon={BookOpen}
        />
        <StatCard
          title="Temas completados"
          value={stats.temasCompletados}
          icon={Target}
        />
        <StatCard
          title="Progreso general"
          value={`${stats.progresoGeneral}%`}
          icon={TrendingUp}
          variant="gradient"
        />
        <StatCard
          title="Materias asignadas"
          value={stats.materiasAsignadas}
          icon={Calendar}
        />
      </div>

      {/* Cursos tabs */}
      {selectedCurso && (
        <Tabs value={selectedCurso} onValueChange={setSelectedCurso}>
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0">
            {cursosConTemas.map((curso) => (
              <TabsTrigger
                key={curso.id}
                value={curso.id}
                className="data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground border flex-col items-start h-auto p-3 min-w-[200px]"
              >
                <span className="font-semibold">{curso.nombre}</span>
                <span className="text-xs opacity-80">
                  {curso.grupo?.grado} {curso.grupo?.seccion} • {curso.horas_semanales || 0}h/sem
                </span>
                <Progress value={curso.progreso} className="h-1 mt-2 w-full" />
              </TabsTrigger>
            ))}
          </TabsList>

          {cursosConTemas.map((curso) => {
            const bimestres = getTemasByBimestre(curso.id);
            return (
              <TabsContent key={curso.id} value={curso.id} className="mt-6">
                {bimestres.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No hay temas asignados para este curso.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Accordion type="multiple" className="space-y-4" defaultValue={bimestres.length > 1 ? [`bim-${bimestres[1].numero}`] : [`bim-${bimestres[0].numero}`]}>
                    {bimestres.map((bimestre) => (
                      <AccordionItem
                        key={`bim-${bimestre.numero}`}
                        value={`bim-${bimestre.numero}`}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{bimestre.nombre}</span>
                              <Badge variant="secondary">{bimestre.temas.length} temas</Badge>
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
                            {bimestre.temas.map((tema) => (
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
                                        onClick={() => navigate(`/profesor/generar-clase?tema=${tema.id}&materia=${curso.id}`)}
                                      >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Iniciar
                                      </Button>
                                    ) : tema.estado === 'en_progreso' ? (
                                      <Button 
                                        variant="default" 
                                        size="sm" 
                                        className="flex-1"
                                        onClick={() => navigate(`/profesor/generar-clase?tema=${tema.id}&materia=${curso.id}`)}
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
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
