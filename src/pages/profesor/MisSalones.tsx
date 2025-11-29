import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  BookOpen,
  ChevronRight,
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
  useRecomendacionesSalon
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
  const { data: recomendaciones } = useRecomendacionesSalon(selectedSalon || null, filtros);

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

  // Función para obtener badge de nivel
  const getNivelBadge = (valor: number) => {
    if (valor >= 80) return <Badge className="bg-success text-success-foreground">Excelente</Badge>;
    if (valor >= 60) return <Badge className="bg-primary text-primary-foreground">Bueno</Badge>;
    if (valor >= 40) return <Badge variant="secondary">Medio</Badge>;
    return <Badge variant="destructive">Bajo</Badge>;
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

  // Vista de detalle del salón
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con filtros */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSalon('')}>
                ← Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {salonActual?.nombre} - {salonActual?.grado} {salonActual?.seccion || ''}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {salonActual?.cantidadAlumnos} estudiantes
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filtro Salón (solo lectura) */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Salón</label>
                <Select value={selectedSalon} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={selectedSalon}>
                      {salonActual?.nombre} - {salonActual?.grado}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Materia */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Materia</label>
                <Select value={selectedMateria} onValueChange={handleMateriaChange}>
                  <SelectTrigger>
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

              {/* Filtro Tema */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tema</label>
                <Select 
                  value={selectedTema} 
                  onValueChange={handleTemaChange}
                  disabled={selectedMateria === 'todos'}
                >
                  <SelectTrigger>
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

              {/* Filtro Clase/Sesión */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Clase / Sesión</label>
                <Select 
                  value={selectedClase} 
                  onValueChange={setSelectedClase}
                  disabled={selectedTema === 'todos'}
                >
                  <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Resumen del salón - 3 StatCards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Resumen del salón</h2>
        <p className="text-sm text-muted-foreground mb-4">Métricas del grupo durante el año escolar</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoadingResumen ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Participación</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.participacion || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Alumnos que completan quizzes</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm text-muted-foreground">Alumnos que requieren refuerzo</span>
                  </div>
                  <p className="text-3xl font-bold">{resumen?.alumnosRequierenRefuerzo || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{resumen?.porcentajeRefuerzo || 0}% del grupo</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-success" />
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

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Participación y Nivel PRE */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Participación</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Porcentaje de completación</p>
                {isLoadingPre ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <div className="space-y-1">
                    <Progress value={metricasPre?.participacion || 0} className="h-2" />
                    <p className="text-right text-sm font-medium">{metricasPre?.participacion || 0}%</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Nivel de Preparación</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Porcentaje de aciertos promedio</p>
                {isLoadingPre ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <div className="space-y-1">
                    <Progress value={metricasPre?.nivelPreparacion || 0} className="h-2" />
                    <p className="text-right text-sm font-medium">{metricasPre?.nivelPreparacion || 0}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conceptos que necesitan refuerzo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Conceptos que necesitan refuerzo</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Ranking de conceptos que requieren más atención</p>
                {isLoadingPre ? (
                  <Skeleton className="h-20" />
                ) : metricasPre?.conceptosRefuerzo && metricasPre.conceptosRefuerzo.length > 0 ? (
                  <div className="space-y-2">
                    {metricasPre.conceptosRefuerzo.map((concepto, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm truncate">{concepto.nombre}</span>
                        <Badge variant="outline" className="ml-2">{concepto.porcentajeAcierto}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin conceptos identificados</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-info" />
                  <span className="text-sm font-medium">Recomendaciones</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Acciones sugeridas para preparar la sesión</p>
                {recomendaciones && recomendaciones.length > 0 ? (
                  <div className="space-y-2">
                    {recomendaciones.slice(0, 2).map((rec) => (
                      <div key={rec.id} className="p-2 rounded bg-info/5 border border-info/10">
                        <p className="text-sm font-medium">{rec.titulo}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{rec.descripcion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin recomendaciones disponibles</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Logro de la Clase (POST) */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Logro de la Clase (POST)</h2>
        <p className="text-sm text-muted-foreground mb-4">Conocimientos después de la clase</p>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Participación y Nivel POST */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Participación</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Porcentaje de completación</p>
                {isLoadingPost ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <div className="space-y-1">
                    <Progress value={metricasPost?.participacion || 0} className="h-2" />
                    <p className="text-right text-sm font-medium">{metricasPost?.participacion || 0}%</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Nivel de Desempeño</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Promedio de logro</p>
                {isLoadingPost ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <div className="space-y-1">
                    <Progress value={metricasPost?.nivelDesempeno || 0} className="h-2" />
                    <p className="text-right text-sm font-medium">{metricasPost?.nivelDesempeno || 0}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alumnos que requieren refuerzo y Recomendaciones POST */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Alumnos que requieren refuerzo</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Alumnos con bajo desempeño</p>
                {isLoadingPost ? (
                  <Skeleton className="h-20" />
                ) : metricasPost?.alumnosRefuerzo && metricasPost.alumnosRefuerzo.length > 0 ? (
                  <div className="space-y-2">
                    {metricasPost.alumnosRefuerzo.map((alumno) => (
                      <div key={alumno.id} className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/10">
                        <span className="text-sm truncate">{alumno.nombre}</span>
                        <Badge variant="destructive">{alumno.porcentaje}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay alumnos en riesgo</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Recomendaciones</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Acciones sugeridas después de la clase</p>
                {recomendaciones && recomendaciones.length > 0 ? (
                  <div className="space-y-2">
                    {recomendaciones.slice(0, 1).map((rec) => (
                      <div key={rec.id} className="p-2 rounded bg-warning/5 border border-warning/10">
                        <Badge className="mb-1 bg-warning text-warning-foreground text-xs">
                          {rec.tipo === 'refuerzo' ? 'Refuerzo' : 'Práctica'}
                        </Badge>
                        <p className="text-sm font-medium">{rec.titulo}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{rec.descripcion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin recomendaciones disponibles</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
