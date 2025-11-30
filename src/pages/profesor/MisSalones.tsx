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
  ChevronDown,
  Lightbulb,
  BookOpen,
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import {
  useAsignacionesProfesor,
  useMetricasGlobalesProfesor,
  useGruposProfesor,
  useMateriasGrupo,
  useTemasMateria,
  useClasesTema,
  useResumenSalon,
  useMetricasPRE,
  useMetricasPOST,
  useRecomendacionesIA,
  type AsignacionConMetricas
} from '@/hooks/useMisSalones';

export default function MisSalones() {
  const [selectedAsignacion, setSelectedAsignacion] = useState<AsignacionConMetricas | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<string>('todos');
  const [selectedTema, setSelectedTema] = useState<string>('todos');
  const [selectedClase, setSelectedClase] = useState<string>('todos');

  // Hook de asignaciones con métricas para la vista inicial
  const { data: asignaciones, isLoading: isLoadingAsignaciones } = useAsignacionesProfesor();
  
  // Hook de métricas globales
  const { data: metricasGlobales, isLoading: isLoadingGlobales } = useMetricasGlobalesProfesor();
  
  // Hooks para la vista de detalle
  const { data: grupos } = useGruposProfesor();
  const { data: materias } = useMateriasGrupo(selectedAsignacion?.grupo.id || null);
  const { data: temas } = useTemasMateria(selectedMateria !== 'todos' ? selectedMateria : null);
  const { data: clases } = useClasesTema(
    selectedTema !== 'todos' ? selectedTema : null,
    selectedAsignacion?.grupo.id || null
  );

  // Filtros para métricas
  const filtros = {
    materiaId: selectedMateria !== 'todos' ? selectedMateria : undefined,
    temaId: selectedTema !== 'todos' ? selectedTema : undefined,
    claseId: selectedClase !== 'todos' ? selectedClase : undefined,
  };

  // Métricas
  const { data: resumen, isLoading: isLoadingResumen } = useResumenSalon(selectedAsignacion?.grupo.id || null, filtros);
  const { data: metricasPre, isLoading: isLoadingPre } = useMetricasPRE(selectedAsignacion?.grupo.id || null, filtros);
  const { data: metricasPost, isLoading: isLoadingPost } = useMetricasPOST(selectedAsignacion?.grupo.id || null, filtros);
  
  // Recomendaciones generadas por IA
  const { recomendacion: recomendacionPre } = useRecomendacionesIA(metricasPre?.conceptosRefuerzo || [], 'PRE');
  const { recomendacion: recomendacionPost } = useRecomendacionesIA(metricasPre?.conceptosRefuerzo || [], 'POST');

  // Reset filtros cuando selecciona una asignación
  const handleAsignacionSelect = (asignacion: AsignacionConMetricas) => {
    setSelectedAsignacion(asignacion);
    setSelectedMateria(asignacion.materia.id);
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

  // Vista de lista de asignaciones (cards según diseño)
  if (!selectedAsignacion) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Métricas</h1>
          <p className="text-muted-foreground">
            Métricas del desempeño del grupo
          </p>
        </div>

        {/* Métricas Globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingGlobales ? (
            <>
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </>
          ) : (
            <>
              {/* Card 1: Promedio general - Gradiente */}
              <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-white/90">Promedio general</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {metricasGlobales?.promedioGeneral || 0}%
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Total alumnos */}
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Total alumnos</p>
                      <p className="text-3xl font-bold mt-2">
                        {metricasGlobales?.totalAlumnos || 0}
                      </p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Quizzes completados */}
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Quizzes completados</p>
                      <p className="text-3xl font-bold mt-2">
                        {metricasGlobales?.quizzesCompletados || 0}
                      </p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Participación */}
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Participación</p>
                      <p className="text-3xl font-bold mt-2">
                        {metricasGlobales?.participacion || 0}%
                      </p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {isLoadingAsignaciones ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-20 mb-4" />
                  <Skeleton className="h-2 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : asignaciones && asignaciones.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {asignaciones.map((asignacion) => (
              <Card 
                key={asignacion.id} 
                className="border shadow-sm cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => handleAsignacionSelect(asignacion)}
              >
                <CardContent className="p-6">
                {/* Header con título y badge */}
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-foreground">{asignacion.grupo.nombre}</h3>
                        <span className="text-xs text-muted-foreground">
                          ({asignacion.grupo.cantidad_alumnos || 0} alumnos)
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {asignacion.materia.nombre}
                      </p>
                    </div>
                    <Badge 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 py-1 rounded-full"
                    >
                      {asignacion.promedio}%
                    </Badge>
                  </div>

                  {/* Barra de promedio */}
                  <div className="mt-4 mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-primary font-medium">Promedio</span>
                      <span className="text-sm font-semibold">{asignacion.promedio}%</span>
                    </div>
                    <Progress 
                      value={asignacion.promedio} 
                      className="h-2 [&>div]:bg-primary" 
                    />
                  </div>

                  {/* Fila de Quizzes y Participación */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Quizzes</p>
                      <p className="text-xl font-bold text-foreground">{asignacion.totalQuizzes}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Participación</p>
                      <p className="text-xl font-bold text-foreground">{asignacion.asistencia}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border shadow-sm">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes asignaciones</h3>
              <p className="text-muted-foreground">
                Contacta al administrador para que te asigne materias y grupos.
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
        <Button variant="ghost" size="sm" onClick={() => setSelectedAsignacion(null)}>
          ← Volver
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{selectedAsignacion.grupo.nombre}</h1>
        <p className="text-muted-foreground">Métricas del desempeño del grupo</p>
      </div>

      {/* Filtros */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
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
              <label className="text-sm text-muted-foreground mb-1.5 block">Clase</label>
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
                      Clase {clase.numero_sesion || '?'}
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
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Participación</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.participacion || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Alumnos que completan quizzes</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Alumnos que requieren refuerzo</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.alumnosRequierenRefuerzo || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{resumen?.porcentajeRefuerzo || 0}% del grupo</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
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
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">Participación</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Porcentaje de completación</p>
              {isLoadingPre ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPre?.participacion || 0} 
                    className="h-3 flex-[2] [&>div]:bg-primary" 
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
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">Nivel de Preparación</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Porcentaje de aciertos promedio</p>
              {isLoadingPre ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPre?.nivelPreparacion || 0} 
                    className="h-3 flex-[2] [&>div]:bg-primary" 
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
                      <Badge className="bg-primary hover:bg-primary/90">{concepto.porcentajeAcierto}%</Badge>
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
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="font-medium">Recomendaciones</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Acciones sugeridas para preparar la clase</p>
              {recomendacionPre ? (
                <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
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
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">Participación</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Porcentaje de completación</p>
              {isLoadingPost ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPost?.participacion || 0} 
                    className="h-3 flex-[2] [&>div]:bg-primary" 
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
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium">Nivel de Desempeño</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Promedio de logro</p>
              {isLoadingPost ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <Progress 
                    value={metricasPost?.nivelDesempeno || 0} 
                    className="h-3 flex-[2] [&>div]:bg-primary" 
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
                <AlertTriangle className="w-4 h-4 text-primary" />
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
                      <Badge className="bg-primary hover:bg-primary/90">{alumno.porcentaje}%</Badge>
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
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="font-medium">Recomendaciones</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Acciones sugeridas después de la clase</p>
              {recomendacionPost ? (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <Badge className="bg-primary hover:bg-primary/90 mb-2">Refuerzo</Badge>
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
