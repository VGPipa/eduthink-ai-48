import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  ChevronRight,
  ChevronDown,
  Lightbulb
} from 'lucide-react';
import {
  useGruposProfesor,
  useMateriasGrupo,
  useTemasMateria,
  useClasesTema,
  useResumenSalon,
  useMetricasPRE,
  useMetricasPOST,
  useRecomendacionesIA
} from '@/hooks/useMisSalones';

export default function MisSalones() {
  const [selectedSalon, setSelectedSalon] = useState<string>('');
  const [selectedMateria, setSelectedMateria] = useState<string>('todos');
  const [selectedTema, setSelectedTema] = useState<string>('todos');
  const [selectedClase, setSelectedClase] = useState<string>('todos');

  // Hooks de datos
  const { data: grupos, isLoading: isLoadingGrupos } = useGruposProfesor();
  const { data: materias } = useMateriasGrupo(selectedSalon || null);
  const { data: temas } = useTemasMateria(selectedMateria !== 'todos' ? selectedMateria : null);
  const { data: clases } = useClasesTema(
    selectedTema !== 'todos' ? selectedTema : null,
    selectedSalon || null
  );

  // Filtros para métricas
  const filtros = {
    materiaId: selectedMateria !== 'todos' ? selectedMateria : undefined,
    temaId: selectedTema !== 'todos' ? selectedTema : undefined,
    claseId: selectedClase !== 'todos' ? selectedClase : undefined,
  };

  // Métricas
  const { data: resumen, isLoading: isLoadingResumen } = useResumenSalon(selectedSalon || null, filtros);
  const { data: metricasPre, isLoading: isLoadingPre } = useMetricasPRE(selectedSalon || null, filtros);
  const { data: metricasPost, isLoading: isLoadingPost } = useMetricasPOST(selectedSalon || null, filtros);
  
  // Recomendaciones generadas por IA
  const { recomendacion: recomendacionPre } = useRecomendacionesIA(metricasPre?.conceptosRefuerzo || [], 'PRE');
  const { recomendacion: recomendacionPost } = useRecomendacionesIA(metricasPre?.conceptosRefuerzo || [], 'POST');

  const salonActual = grupos?.find(g => g.id === selectedSalon);

  // Reset filtros cuando cambia el salón
  const handleSalonChange = (salonId: string) => {
    setSelectedSalon(salonId);
    setSelectedMateria('todos');
    setSelectedTema('todos');
    setSelectedClase('todos');
  };

  // Reset tema y clase cuando cambia materia
  const handleMateriaChange = (materiaId: string) => {
    setSelectedMateria(materiaId);
    setSelectedTema('todos');
    setSelectedClase('todos');
  };

  // Reset clase cuando cambia tema
  const handleTemaChange = (temaId: string) => {
    setSelectedTema(temaId);
    setSelectedClase('todos');
  };

  // Vista de lista de salones
  if (!selectedSalon) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Mis Salones</h1>
          <p className="text-muted-foreground">
            Métricas del desempeño del grupo
          </p>
        </div>

        {isLoadingGrupos ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : grupos && grupos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map((salon) => (
              <Card 
                key={salon.id} 
                className="cursor-pointer hover:shadow-elevated transition-all hover:border-primary"
                onClick={() => handleSalonChange(salon.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl gradient-bg">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{salon.nombre}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {salon.grado} {salon.seccion ? `- ${salon.seccion}` : ''}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{salon.cantidadAlumnos} estudiantes</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes salones asignados</h3>
              <p className="text-muted-foreground">
                Contacta al administrador para que te asigne grupos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Vista de detalle del salón con métricas
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSalon('')}>
          ← Volver
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Mis Salones</h1>
        <p className="text-muted-foreground">Métricas del desempeño del grupo</p>
      </div>

      {/* Filtros */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Salón selector */}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Salón:</label>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer">
              <span className="font-medium">
                {salonActual?.nombre} - {salonActual?.grado} {salonActual?.seccion || ''}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Filtros en fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Materia</label>
              <Select value={selectedMateria} onValueChange={handleMateriaChange}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Todas las materias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las materias</SelectItem>
                  {materias?.map((materia) => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Tema</label>
              <Select 
                value={selectedTema} 
                onValueChange={handleTemaChange}
                disabled={selectedMateria === 'todos'}
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Todos los temas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los temas</SelectItem>
                  {temas?.map((tema) => (
                    <SelectItem key={tema.id} value={tema.id}>
                      {tema.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Clase / Sesión</label>
              <Select 
                value={selectedClase} 
                onValueChange={setSelectedClase}
                disabled={selectedTema === 'todos'}
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Todas las clases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las clases</SelectItem>
                  {clases?.map((clase) => (
                    <SelectItem key={clase.id} value={clase.id}>
                      Sesión {clase.numero_sesion || '?'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del salón */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Resumen del salón</h2>
        <p className="text-sm text-muted-foreground mb-4">Métricas del grupo durante el año escolar</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingResumen ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Participación</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.participacion || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Alumnos que completan quizzes</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Alumnos que requieren refuerzo</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.alumnosRequierenRefuerzo || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{resumen?.porcentajeRefuerzo || 0}% del grupo</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Desempeño</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.desempeno || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Promedio general del salón</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Evaluación Inicial (PRE) */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Evaluación Inicial (PRE)</h2>
        <p className="text-sm text-muted-foreground mb-4">Conocimientos antes de la clase</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Participación PRE */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Participación</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Porcentaje de completación</p>
              {isLoadingPre ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPre?.participacion || 0} 
                    className="h-2 flex-1 [&>div]:bg-orange-500" 
                  />
                  <span className="text-sm font-medium w-12 text-right">{metricasPre?.participacion || 0}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nivel de Preparación PRE */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Nivel de Preparación</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Porcentaje de aciertos promedio</p>
              {isLoadingPre ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPre?.nivelPreparacion || 0} 
                    className="h-2 flex-1 [&>div]:bg-orange-500" 
                  />
                  <span className="text-sm font-medium w-12 text-right">{metricasPre?.nivelPreparacion || 0}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conceptos que necesitan refuerzo PRE */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Conceptos que necesitan refuerzo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Ranking de conceptos que requieren más atención</p>
              {isLoadingPre ? (
                <Skeleton className="h-16" />
              ) : metricasPre?.conceptosRefuerzo && metricasPre.conceptosRefuerzo.length > 0 ? (
                <div className="space-y-2">
                  {metricasPre.conceptosRefuerzo.slice(0, 3).map((concepto, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{concepto.nombre}</span>
                        <p className="text-xs text-muted-foreground">{concepto.porcentajeAcierto}% de acierto</p>
                      </div>
                      <Badge className="bg-orange-500 hover:bg-orange-600">{concepto.porcentajeAcierto}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  Sin conceptos identificados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recomendaciones PRE */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Recomendaciones</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Acciones sugeridas para preparar la sesión</p>
              {recomendacionPre ? (
                <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-amber-500">
                  <p className="text-sm font-medium mb-1">{recomendacionPre.titulo}</p>
                  <p className="text-sm text-muted-foreground">{recomendacionPre.descripcion}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  Sin recomendaciones disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logro de la Clase (POST) */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Logro de la Clase (POST)</h2>
        <p className="text-sm text-muted-foreground mb-4">Conocimientos después de la clase</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Participación POST */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Participación</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Porcentaje de completación</p>
              {isLoadingPost ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPost?.participacion || 0} 
                    className="h-2 flex-1 [&>div]:bg-orange-500" 
                  />
                  <span className="text-sm font-medium w-12 text-right">{metricasPost?.participacion || 0}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nivel de Desempeño POST */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Nivel de Desempeño</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Promedio de logro</p>
              {isLoadingPost ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPost?.nivelDesempeno || 0} 
                    className="h-2 flex-1 [&>div]:bg-orange-500" 
                  />
                  <span className="text-sm font-medium w-12 text-right">{metricasPost?.nivelDesempeno || 0}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alumnos que requieren refuerzo POST */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Alumnos que requieren refuerzo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Alumnos con bajo desempeño</p>
              {isLoadingPost ? (
                <Skeleton className="h-16" />
              ) : metricasPost?.alumnosRefuerzo && metricasPost.alumnosRefuerzo.length > 0 ? (
                <div className="space-y-2">
                  {metricasPost.alumnosRefuerzo.slice(0, 3).map((alumno) => (
                    <div key={alumno.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">{alumno.nombre}</span>
                      <Badge className="bg-orange-500 hover:bg-orange-600">{alumno.porcentaje}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  No hay alumnos que requieran refuerzo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recomendaciones POST */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Recomendaciones</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Acciones sugeridas después de la clase</p>
              {recomendacionPost ? (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <Badge className="bg-orange-500 hover:bg-orange-600 mb-2">Refuerzo</Badge>
                  <p className="text-sm font-medium mb-1">{recomendacionPost.titulo}</p>
                  <p className="text-sm text-muted-foreground">{recomendacionPost.descripcion}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  Sin recomendaciones disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
