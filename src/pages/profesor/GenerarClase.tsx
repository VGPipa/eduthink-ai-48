import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useProfesor } from '@/hooks/useProfesor';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useClases, type Clase } from '@/hooks/useClases';
import { useGuiasClase } from '@/hooks/useGuias';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useTemasProfesor } from '@/hooks/useTemasProfesor';
import { supabase } from '@/integrations/supabase/client';
import { generateGuiaClase, generateQuiz, type GuiaClaseData, type QuizData } from '@/lib/ai/generate';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Target,
  ClipboardList,
  FileCheck,
  Loader2,
  Info,
  Lock,
  Calendar,
  Users,
  Plus,
  X
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Contexto', icon: BookOpen },
  { id: 2, title: 'Generar Guía', icon: Sparkles },
  { id: 3, title: 'Quiz PRE', icon: ClipboardList },
  { id: 4, title: 'Quiz POST', icon: ClipboardList },
  { id: 5, title: 'Validar', icon: FileCheck }
];

const RECURSOS = [
  { id: 'proyector', nombre: 'Proyector/Pantalla' },
  { id: 'pizarra', nombre: 'Pizarra' },
  { id: 'libros', nombre: 'Libros de texto' },
  { id: 'dispositivos', nombre: 'Dispositivos electrónicos' },
  { id: 'material', nombre: 'Material manipulativo' },
  { id: 'otro', nombre: 'Otro' }
];

export default function GenerarClase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profesorId } = useProfesor();
  const { asignaciones, grupos, cursos } = useAsignaciones('2025');
  const { clases, isLoading: clasesLoading, deleteClase } = useClases();
  const { cursosConTemas } = useTemasProfesor('2025');
  
  const temaId = searchParams.get('tema');
  const cursoId = searchParams.get('curso') || searchParams.get('materia'); // Support both for backwards compatibility
  const claseId = searchParams.get('clase');
  
  // View mode state
  const [viewMode, setViewMode] = useState<'selection' | 'wizard'>('selection');
  const [isExtraordinaria, setIsExtraordinaria] = useState(false);
  
  // Selection filters
  const [filtroTema, setFiltroTema] = useState<string>('todos');
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Data from DB
  const [temaData, setTemaData] = useState<any>(null);
  const [cursoData, setCursoData] = useState<any>(null);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [claseData, setClaseData] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fecha: '',
    duracion: 55,
    recursos: [] as string[],
    contexto: '',
    temaPersonalizado: '' // For extraordinaria mode
  });

  // Generated content
  const [guiaGenerada, setGuiaGenerada] = useState<GuiaClaseData | null>(null);
  const [quizPreData, setQuizPreData] = useState<QuizData | null>(null);
  const [quizPostData, setQuizPostData] = useState<QuizData | null>(null);
  
  // Hooks for DB operations
  const { createClase, updateClase } = useClases();
  const { createGuiaVersion } = useGuiasClase(claseData?.id);
  const { createQuiz } = useQuizzes(claseData?.id);

  // Computed data for selection mode
  const clasesEnProceso = useMemo(() => {
    return clases.filter(c => 
      ['generando_clase', 'editando_guia'].includes(c.estado)
    );
  }, [clases]);

  const claseEnEdicion = useMemo(() => {
    return clasesEnProceso[0] || null;
  }, [clasesEnProceso]);

  const sesionesPendientes = useMemo(() => {
    return clases
      .filter(c => c.estado === 'borrador')
      .sort((a, b) => {
        if (!a.fecha_programada && !b.fecha_programada) return 0;
        if (!a.fecha_programada) return 1;
        if (!b.fecha_programada) return -1;
        return new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime();
      });
  }, [clases]);

  const sesionSugerida = useMemo(() => {
    return sesionesPendientes[0] || null;
  }, [sesionesPendientes]);

  const sesionesFiltradas = useMemo(() => {
    let filtered = sesionesPendientes.filter(s => s.id !== sesionSugerida?.id);
    
    if (filtroTema !== 'todos') {
      filtered = filtered.filter(s => s.id_tema === filtroTema);
    }
    if (filtroGrupo !== 'todos') {
      filtered = filtered.filter(s => s.id_grupo === filtroGrupo);
    }
    
    return filtered;
  }, [sesionesPendientes, sesionSugerida, filtroTema, filtroGrupo]);

  // Get all unique temas from sesiones for filter
  const temasDisponibles = useMemo(() => {
    const temasMap = new Map<string, { id: string; nombre: string }>();
    sesionesPendientes.forEach(s => {
      if (s.tema && !temasMap.has(s.tema.id)) {
        temasMap.set(s.tema.id, { id: s.tema.id, nombre: s.tema.nombre });
      }
    });
    return Array.from(temasMap.values());
  }, [sesionesPendientes]);

  // Get all unique grupos from clases for filter
  const gruposDisponibles = useMemo(() => {
    const gruposMap = new Map<string, { id: string; nombre: string }>();
    sesionesPendientes.forEach(s => {
      if (s.grupo && !gruposMap.has(s.grupo.id)) {
        const nombre = s.grupo.nombre || `${s.grupo.grado}° ${s.grupo.seccion || ''}`.trim();
        gruposMap.set(s.grupo.id, { id: s.grupo.id, nombre });
      }
    });
    return Array.from(gruposMap.values());
  }, [sesionesPendientes]);
  
  // Load initial data based on URL params
  useEffect(() => {
    const loadData = async () => {
      // If there are URL params, go directly to wizard
      if (temaId && cursoId) {
        setViewMode('wizard');
        try {
          // Load tema
          const { data: tema, error: temaError } = await supabase
            .from('temas_plan')
            .select('*')
            .eq('id', temaId)
            .single();
          
          if (temaError) throw temaError;
          setTemaData(tema);

          // Load curso
          const { data: curso, error: cursoError } = await supabase
            .from('cursos_plan')
            .select('*')
            .eq('id', cursoId)
            .single();
          
          if (cursoError) throw cursoError;
          setCursoData(curso);

          // Find grupo from asignaciones
          const asignacion = asignaciones.find(a => a.id_materia === cursoId);
          if (asignacion?.grupo) {
            setGrupoData(asignacion.grupo);
          }

          // Load existing clase if claseId provided
          if (claseId) {
            const { data: clase, error: claseError } = await supabase
              .from('clases')
              .select(`
                *,
                grupo:grupos(id, nombre, grado, seccion),
                tema:temas_plan(id, nombre)
              `)
              .eq('id', claseId)
              .single();
            
            if (!claseError && clase) {
              setClaseData(clase);
              setFormData(prev => ({
                ...prev,
                fecha: clase.fecha_programada || '',
                duracion: clase.duracion_minutos || 55,
                metodologias: clase.metodologia ? [clase.metodologia] : [],
                contexto: clase.contexto || ''
              }));
            }
          }

          setIsLoadingData(false);
        } catch (error: any) {
          toast({
            title: 'Error',
            description: 'Error al cargar datos: ' + error.message,
            variant: 'destructive'
          });
          setIsLoadingData(false);
          setViewMode('selection');
        }
      } else if (claseId) {
        // Only claseId provided, load clase and derive tema/materia
        setViewMode('wizard');
        try {
          const { data: clase, error: claseError } = await supabase
            .from('clases')
            .select(`
              *,
              grupo:grupos(id, nombre, grado, seccion),
              tema:temas_plan(id, nombre, curso_plan_id)
            `)
            .eq('id', claseId)
            .single();
          
          if (claseError) throw claseError;
          
          setClaseData(clase);
          
          if (clase.tema) {
            setTemaData(clase.tema);
            
            // Load curso from tema
            const { data: curso } = await supabase
              .from('cursos_plan')
              .select('*')
              .eq('id', clase.tema.curso_plan_id)
              .single();
            
            if (curso) setCursoData(curso);
          }
          
          if (clase.grupo) {
            setGrupoData(clase.grupo);
          }
          
          setFormData(prev => ({
            ...prev,
            fecha: clase.fecha_programada || '',
            duracion: clase.duracion_minutos || 55,
            metodologias: clase.metodologia ? [clase.metodologia] : [],
            contexto: clase.contexto || ''
          }));
          
          setIsLoadingData(false);
        } catch (error: any) {
          toast({
            title: 'Error',
            description: 'Error al cargar la clase: ' + error.message,
            variant: 'destructive'
          });
          setViewMode('selection');
          setIsLoadingData(false);
        }
      } else {
        // No params - selection mode
        setViewMode('selection');
        setIsLoadingData(false);
      }
    };

    if (profesorId) {
      loadData();
    }
  }, [temaId, cursoId, claseId, profesorId, asignaciones]);

  // Handler: Select a session to continue
  const handleSeleccionarSesion = async (clase: Clase) => {
    setClaseData(clase);
    
    if (clase.tema) {
      setTemaData(clase.tema);
      
      // Load full curso data
      const { data: curso } = await supabase
        .from('cursos_plan')
        .select('*')
        .eq('id', clase.tema.curso_plan_id)
        .single();
      
      if (curso) setCursoData(curso);
    }
    
    if (clase.grupo) {
      setGrupoData(clase.grupo);
    }
    
    setFormData(prev => ({
      ...prev,
      fecha: clase.fecha_programada || '',
      duracion: clase.duracion_minutos || 55,
      metodologias: clase.metodologia ? [clase.metodologia] : [],
      contexto: clase.contexto || ''
    }));
    
    setIsExtraordinaria(false);
    setViewMode('wizard');
  };

  // Handler: Create extraordinaria class
  const handleCrearExtraordinaria = () => {
    setIsExtraordinaria(true);
    setTemaData(null);
    setCursoData(null);
    setGrupoData(null);
    setClaseData(null);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      duracion: 55,
      recursos: [],
      contexto: '',
      temaPersonalizado: ''
    });
    setGuiaGenerada(null);
    setQuizPreData(null);
    setQuizPostData(null);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Get temas for selected materia (for extraordinaria mode)
  const temasParaCurso = useMemo(() => {
    if (!isExtraordinaria || !cursoData?.id) return [];
    const curso = cursosConTemas.find(c => c.id === cursoData.id);
    return curso?.temas || [];
  }, [isExtraordinaria, cursoData?.id, cursosConTemas]);

  // Handler: Discard a class in process
  const handleDescartar = async (claseId: string) => {
    try {
      await deleteClase.mutateAsync(claseId);
      toast({ title: 'Clase descartada' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al descartar la clase: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  // Handler: Back to selection
  const handleVolverSeleccion = () => {
    setViewMode('selection');
    setIsExtraordinaria(false);
    setTemaData(null);
    setCursoData(null);
    setGrupoData(null);
    setClaseData(null);
    setGuiaGenerada(null);
    setQuizPreData(null);
    setQuizPostData(null);
    setCurrentStep(1);
  };

  // Ensure clase exists before generating
  const ensureClase = async () => {
    if (claseData) return claseData;

    if (!grupoData || !profesorId) {
      throw new Error('Faltan datos necesarios para crear la clase (grupo o profesor)');
    }

    // Get tema ID - must be available in both normal and extraordinaria mode
    const temaIdToUse = temaData?.id || temaId;
    if (!temaIdToUse) {
      throw new Error('Debes seleccionar un tema antes de continuar');
    }

    const nuevaClase = await createClase.mutateAsync({
      id_tema: temaIdToUse,
      id_grupo: grupoData.id,
      fecha_programada: formData.fecha || new Date().toISOString().split('T')[0],
      duracion_minutos: formData.duracion,
      contexto: formData.contexto,
    });

    setClaseData(nuevaClase);
    return nuevaClase;
  };

  const handleGenerarGuia = async () => {
    // Use custom name if provided, otherwise use tema name from DB
    const temaNombre = formData.temaPersonalizado || temaData?.nombre;
    
    if (!temaNombre || !formData.contexto) {
      toast({
        title: 'Error',
        description: 'Completa el tema y contexto antes de generar la guía',
        variant: 'destructive'
      });
      return;
    }

    if (!temaData?.id) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un tema antes de continuar',
        variant: 'destructive'
      });
      return;
    }

    if (!grupoData) {
      toast({
        title: 'Error',
        description: 'Selecciona un salón antes de continuar',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Ensure clase exists
      const clase = await ensureClase();
      
      // Update clase state
      await updateClase.mutateAsync({
        id: clase.id,
        estado: 'generando_clase',
        contexto: formData.contexto,
      });

      // Generate guide with AI, passing additional context data
      const guia = await generateGuiaClase(
        temaNombre,
        formData.contexto,
        formData.recursos,
        {
          grado: grupoData?.grado,
          seccion: grupoData?.seccion,
          numeroEstudiantes: grupoData?.cantidad_alumnos,
          duracion: formData.duracion,
          area: cursoData?.nombre
        }
      );

      setGuiaGenerada(guia);

      // Save to DB with extended content
      const guiaVersion = await createGuiaVersion.mutateAsync({
        id_clase: clase.id,
        objetivos: guia.objetivos.join('\n'),
        estructura: guia.estructura,
        contenido: {
          objetivos: guia.objetivos,
          estructura: guia.estructura,
          recursos: guia.recursos,
          adaptaciones: guia.adaptaciones,
          // Extended CNEB data
          situacionSignificativa: guia.situacionSignificativa,
          competencia: guia.competencia,
          desempeno: guia.desempeno,
          enfoqueTransversal: guia.enfoqueTransversal,
          habilidadesSigloXXI: guia.habilidadesSigloXXI,
          evaluacion: guia.evaluacion
        },
        preguntas_socraticas: guia.preguntasSocraticas,
        generada_ia: true,
        estado: 'borrador'
      });

      // Update clase to reference guia and change state
      await updateClase.mutateAsync({
        id: clase.id,
        estado: 'editando_guia',
        id_guia_version_actual: guiaVersion.id
      });

    toast({ title: '¡Guía generada!', description: 'La guía de clase ha sido creada con éxito' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al generar la guía: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerarQuizPre = async () => {
    // Use custom name if provided, otherwise use tema name from DB
    const temaNombre = formData.temaPersonalizado || temaData?.nombre;
    
    if (!temaNombre) {
      toast({
        title: 'Error',
        description: 'No se encontró la información del tema',
        variant: 'destructive'
      });
      return;
    }

    if (!claseData && !guiaGenerada) {
      toast({
        title: 'Error',
        description: 'Primero debes generar la guía de clase',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const clase = claseData || await ensureClase();

      // Generate quiz with AI
      const quiz = await generateQuiz('previo', temaNombre, 'intermedio', 5);
      setQuizPreData(quiz);

      // Save quiz to DB
      const quizCreated = await createQuiz.mutateAsync({
        id_clase: clase.id,
        tipo: 'previo',
        titulo: quiz.titulo,
        instrucciones: quiz.instrucciones,
        tiempo_limite: 20,
        estado: 'borrador'
      });

      // Save questions directly to DB
      const preguntasToInsert = quiz.preguntas.map(p => ({
        id_quiz: quizCreated.id,
        texto_pregunta: p.texto,
        texto_contexto: p.texto_contexto,
        tipo: 'opcion_multiple' as const,
        opciones: p.opciones || [],
        respuesta_correcta: p.respuesta_correcta,
        justificacion: p.justificacion,
        orden: p.orden
      }));

      const { error: preguntasError } = await supabase
        .from('preguntas')
        .insert(preguntasToInsert);

      if (preguntasError) throw preguntasError;

      toast({ title: 'Quiz PRE generado', description: `${quiz.preguntas.length} preguntas diagnósticas listas` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al generar el quiz PRE: ' + error.message,
        variant: 'destructive'
      });
    } finally {
    setIsGenerating(false);
    }
  };

  const handleGenerarQuizPost = async () => {
    // Use custom name if provided, otherwise use tema name from DB
    const temaNombre = formData.temaPersonalizado || temaData?.nombre;
    
    if (!temaNombre) {
      toast({
        title: 'Error',
        description: 'No se encontró la información del tema',
        variant: 'destructive'
      });
      return;
    }

    if (!claseData && !guiaGenerada) {
      toast({
        title: 'Error',
        description: 'Primero debes generar la guía de clase',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const clase = claseData || await ensureClase();

      // Generate quiz with AI
      const quiz = await generateQuiz('post', temaNombre, 'intermedio', 10);
      setQuizPostData(quiz);

      // Save quiz to DB
      const quizCreated = await createQuiz.mutateAsync({
        id_clase: clase.id,
        tipo: 'post',
        titulo: quiz.titulo,
        instrucciones: quiz.instrucciones,
        tiempo_limite: 30,
        estado: 'borrador'
      });

      // Save questions directly to DB
      const preguntasToInsert = quiz.preguntas.map(p => ({
        id_quiz: quizCreated.id,
        texto_pregunta: p.texto,
        texto_contexto: p.texto_contexto,
        tipo: 'opcion_multiple' as const,
        opciones: p.opciones || [],
        respuesta_correcta: p.respuesta_correcta,
        justificacion: p.justificacion,
        orden: p.orden
      }));

      const { error: preguntasError } = await supabase
        .from('preguntas')
        .insert(preguntasToInsert);

      if (preguntasError) throw preguntasError;

      toast({ title: 'Quiz POST generado', description: `${quiz.preguntas.length} preguntas de evaluación listas` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al generar el quiz POST: ' + error.message,
        variant: 'destructive'
      });
    } finally {
    setIsGenerating(false);
    }
  };

  const handleValidar = async () => {
    if (!guiaGenerada || !quizPreData || !quizPostData || !claseData) {
      toast({ 
        title: 'Pasos incompletos', 
        description: 'Debes completar todos los pasos anteriores',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update clase state to clase_programada
      await updateClase.mutateAsync({
        id: claseData.id,
        estado: 'clase_programada'
      });

    toast({ title: '¡Clase validada!', description: 'Tu clase está lista para ser impartida' });
    navigate('/profesor/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al validar la clase: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // In extraordinaria mode, we need a selected tema (from DB) plus optional custom name
        // In normal mode, we need temaData from URL params
        const hasTema = temaData?.id ? true : false;
        const temaNombre = isExtraordinaria ? (formData.temaPersonalizado || temaData?.nombre) : temaData?.nombre;
        return hasTema && temaNombre && formData.contexto && formData.fecha && grupoData;
      case 2:
        return guiaGenerada !== null;
      case 3:
        return quizPreData !== null;
      case 4:
        return quizPostData !== null;
      default:
        return true;
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get estado label
  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      borrador: 'GUÍA PENDIENTE',
      generando_clase: 'generando clase',
      editando_guia: 'editando guía',
      guia_aprobada: 'guía aprobada',
      clase_programada: 'programada',
    };
    return labels[estado] || estado;
  };

  // Render SELECTION MODE
  const renderSelectionMode = () => {
    if (clasesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Seleccionar Clase para Generar
          </h1>
          <p className="text-muted-foreground">
            Elige una clase programada o crea una clase extraordinaria.
          </p>
        </div>

        {/* Clase en Proceso */}
        {claseEnEdicion && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-primary font-medium">Clase en proceso</p>
                    <p className="font-semibold">
                      {claseEnEdicion.tema?.nombre || 'Sin tema'} • {claseEnEdicion.grupo?.grado}° {claseEnEdicion.grupo?.seccion || ''}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {getEstadoLabel(claseEnEdicion.estado)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDescartar(claseEnEdicion.id)}
                  >
                    Descartar
                  </Button>
                  <Button 
                    variant="gradient"
                    onClick={() => handleSeleccionarSesion(claseEnEdicion)}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filtrar por Tema</Label>
            <Select value={filtroTema} onValueChange={setFiltroTema}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los temas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los temas</SelectItem>
                {temasDisponibles.map(tema => (
                  <SelectItem key={tema.id} value={tema.id}>{tema.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Filtrar por Grupo</Label>
            <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los grupos</SelectItem>
                {gruposDisponibles.map(grupo => (
                  <SelectItem key={grupo.id} value={grupo.id}>{grupo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Siguiente Clase Sugerida */}
        {sesionSugerida && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Siguiente Clase Sugerida</p>
                  <p className="font-semibold">
                    {sesionSugerida.tema?.nombre || 'Sin tema'} - Clase {sesionSugerida.numero_sesion || 1}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <Badge variant="outline">{getEstadoLabel(sesionSugerida.estado)}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(sesionSugerida.fecha_programada)}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="default"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => handleSeleccionarSesion(sesionSugerida)}
                >
                  Usar Esta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Clases */}
        {sesionesFiltradas.length > 0 && (
          <div className="space-y-3">
            {sesionesFiltradas.map((sesion) => (
              <Card key={sesion.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Clase {sesion.numero_sesion || 1}
                        </span>
                        <span className="font-semibold">{sesion.tema?.nombre || 'Sin tema'}</span>
                        <Badge variant="secondary">{getEstadoLabel(sesion.estado)}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {sesion.grupo?.nombre || `${sesion.grupo?.grado}° Primaria ${sesion.grupo?.seccion || ''}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sesion.fecha_programada)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={() => handleSeleccionarSesion(sesion)}
                    >
                      Seleccionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!sesionSugerida && sesionesFiltradas.length === 0 && !claseEnEdicion && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay clases pendientes. Crea una clase extraordinaria o programa clases desde Planificación.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Crear Clase Extraordinaria */}
        <Card className="border-dashed hover:border-primary/50 cursor-pointer transition-colors" onClick={handleCrearExtraordinaria}>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Crear Clase Extraordinaria</span>
            </div>
          </CardContent>
        </Card>

        {/* Link to Planificación */}
        <div className="text-center">
          <Link 
            to="/profesor/planificacion" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Ir a Planificación para Crear Guía Maestra
          </Link>
        </div>
      </div>
    );
  };

  // Render WIZARD MODE
  const renderWizardMode = () => {
    if (isLoadingData) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    // For extraordinaria mode, we need grupoData but not necessarily tema/curso
    if (!isExtraordinaria && (!temaData || !cursoData || !grupoData)) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No se pudieron cargar los datos necesarios. Por favor, vuelve a la selección.
              </p>
              <Button onClick={handleVolverSeleccion} className="mt-4">
                Volver a Selección
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleVolverSeleccion}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
              {isExtraordinaria ? 'Crear Clase Extraordinaria' : 'Generar Clase con IA'}
          </h1>
          <p className="text-muted-foreground">
            Crea clases centradas en el desarrollo del pensamiento crítico
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div 
              key={step.id}
              className={`flex items-center gap-2 ${
                step.id === currentStep 
                  ? 'text-primary' 
                  : step.id < currentStep 
                    ? 'text-success' 
                    : 'text-muted-foreground'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.id === currentStep 
                  ? 'gradient-bg text-primary-foreground' 
                  : step.id < currentStep 
                    ? 'bg-success text-success-foreground' 
                    : 'bg-muted'
              }`}>
                {step.id < currentStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Context */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Información de la Clase</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Curso */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                        Curso {!isExtraordinaria && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </Label>
                      {isExtraordinaria ? (
                        <Select 
                          value={cursoData?.id || ''} 
                          onValueChange={(value) => {
                            const curso = cursos.find(c => c?.id === value);
                            setCursoData(curso);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursos.filter(Boolean).map(c => (
                              <SelectItem key={c!.id} value={c!.id}>{c!.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={cursoData?.nombre || ''} disabled />
                      )}
                  </div>

                    {/* Tema */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                        Tema {!isExtraordinaria && <Lock className="w-3 h-3 text-muted-foreground" />}
                        {isExtraordinaria && '*'}
                    </Label>
                      {isExtraordinaria ? (
                        <Select 
                          value={temaData?.id || ''} 
                          onValueChange={(value) => {
                            const tema = temasParaCurso.find(t => t.id === value);
                            setTemaData(tema || null);
                            // Pre-fill custom name with tema name
                            if (tema && !formData.temaPersonalizado) {
                              setFormData(prev => ({...prev, temaPersonalizado: tema.nombre}));
                            }
                          }}
                          disabled={!cursoData}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={cursoData ? "Selecciona un tema" : "Primero selecciona un curso"} />
                          </SelectTrigger>
                          <SelectContent>
                            {temasParaCurso.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={temaData?.nombre || ''} disabled />
                      )}
                  </div>

                    {/* Nombre personalizado del tema (solo extraordinaria) */}
                    {isExtraordinaria && temaData && (
                  <div className="space-y-2">
                        <Label>Nombre personalizado (opcional)</Label>
                        <Input 
                          value={formData.temaPersonalizado} 
                          onChange={(e) => setFormData({...formData, temaPersonalizado: e.target.value})}
                          placeholder="Personaliza el nombre del tema si lo deseas"
                        />
                  </div>
                    )}

                    {/* Grupo */}
                    <div className="space-y-2">
                      <Label>Grupo {isExtraordinaria && '*'}</Label>
                      {isExtraordinaria ? (
                        <Select 
                          value={grupoData?.id || ''} 
                          onValueChange={(value) => {
                            const grupo = grupos.find(g => g?.id === value);
                            setGrupoData(grupo);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupos.filter(Boolean).map(g => (
                              <SelectItem key={g!.id} value={g!.id}>
                                {g!.nombre || `${g!.grado}° ${g!.seccion || ''}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={grupoData?.nombre || `${grupoData?.grado} ${grupoData?.seccion || ''}`.trim()} disabled />
                      )}
                    </div>

                    {/* Fecha */}
                  <div className="space-y-2">
                    <Label>Fecha programada</Label>
                    <Input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
                  </div>

                    {/* Duración */}
                  <div className="space-y-2">
                    <Label>Duración (minutos)</Label>
                    <Input type="number" value={formData.duracion} onChange={(e) => setFormData({...formData, duracion: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

                <div className="space-y-2">
                  <Label>Recursos disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                    {RECURSOS.map((rec) => (
                      <Badge
                        key={rec.id}
                        variant={formData.recursos.includes(rec.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newRec = formData.recursos.includes(rec.id)
                            ? formData.recursos.filter(r => r !== rec.id)
                            : [...formData.recursos, rec.id];
                          setFormData({...formData, recursos: newRec});
                        }}
                      >
                        {rec.nombre}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contexto específico del salón *</Label>
                <Textarea 
                  placeholder="Describe el contexto del salón: conocimientos previos, necesidades especiales, dinámica del aula..."
                  value={formData.contexto}
                  onChange={(e) => setFormData({...formData, contexto: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Generate Guide */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Generar Guía de Clase</h2>
                <p className="text-muted-foreground mb-6">
                  La IA creará una guía estructurada basada en el contexto proporcionado
                </p>
                {!guiaGenerada && (
                  <Button variant="gradient" size="lg" onClick={handleGenerarGuia} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Guía
                      </>
                    )}
                  </Button>
                )}
              </div>

              {guiaGenerada && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Guía generada exitosamente</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Objetivos de aprendizaje</h3>
                    <ul className="space-y-2">
                      {guiaGenerada.objetivos.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-primary mt-1 shrink-0" />
                          <span className="text-sm">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Estructura de la clase</h3>
                    <div className="space-y-3">
                      {guiaGenerada.estructura.map((fase, i) => (
                        <div key={i} className="flex gap-4 p-3 rounded-lg bg-muted/50">
                          <Badge variant="secondary" className="shrink-0">{fase.tiempo}</Badge>
                          <div>
                            <p className="font-medium text-sm">{fase.actividad}</p>
                            <p className="text-xs text-muted-foreground">{fase.descripcion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Preguntas socráticas</h3>
                    <ul className="space-y-2">
                      {guiaGenerada.preguntasSocraticas.map((preg, i) => (
                        <li key={i} className="flex items-start gap-2 p-2 rounded bg-primary/5">
                          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm italic">{preg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Quiz PRE */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <ClipboardList className="w-12 h-12 text-info mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Evaluación Diagnóstica (PRE)</h2>
                <p className="text-muted-foreground mb-6">
                  Quiz corto para evaluar conocimientos previos (máx. 3 preguntas)
                </p>
                  {!quizPreData && (
                  <Button variant="gradient" size="lg" onClick={handleGenerarQuizPre} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Quiz PRE
                      </>
                    )}
                  </Button>
                )}
              </div>

                {quizPreData && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Quiz PRE generado ({quizPreData.preguntas.length} preguntas)</span>
                    </div>
                  </div>

                    {quizPreData.preguntas.map((pregunta, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{pregunta.tipo}</Badge>
                        <span className="text-sm text-muted-foreground">Pregunta {i + 1}</span>
                      </div>
                      <p className="font-medium">{pregunta.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Quiz POST */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <ClipboardList className="w-12 h-12 text-success mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Evaluación Final (POST)</h2>
                <p className="text-muted-foreground mb-6">
                  Quiz completo para evaluar el aprendizaje (5-10 preguntas)
                </p>
                  {!quizPostData && (
                  <Button variant="gradient" size="lg" onClick={handleGenerarQuizPost} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Quiz POST
                      </>
                    )}
                  </Button>
                )}
              </div>

                {quizPostData && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Quiz POST generado ({quizPostData.preguntas.length} preguntas)</span>
                    </div>
                  </div>

                    {quizPostData.preguntas.map((pregunta, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{pregunta.tipo}</Badge>
                        <span className="text-sm text-muted-foreground">Pregunta {i + 1}</span>
                      </div>
                      <p className="font-medium">{pregunta.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Validate */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <FileCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Validar y Finalizar</h2>
                <p className="text-muted-foreground mb-6">
                  Revisa que todos los componentes estén completos
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Contexto de la clase', completed: true },
                  { label: 'Guía de clase generada', completed: !!guiaGenerada },
                    { label: 'Quiz PRE (diagnóstico)', completed: !!quizPreData },
                    { label: 'Quiz POST (evaluación)', completed: !!quizPostData }
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-4 rounded-lg ${item.completed ? 'bg-success/10' : 'bg-muted'}`}>
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className={item.completed ? 'text-success font-medium' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

                {guiaGenerada && quizPreData && quizPostData && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-medium text-primary">¡Todo listo!</p>
                  <p className="text-sm text-muted-foreground">Tu clase está preparada para ser impartida</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {currentStep < 5 ? (
          <Button 
            variant="gradient"
            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
            disabled={!canProceed()}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            variant="gradient"
            onClick={handleValidar}
              disabled={!guiaGenerada || !quizPreData || !quizPostData}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Validar Clase
          </Button>
        )}
      </div>
    </div>
  );
  };

  // Main render
  return viewMode === 'selection' ? renderSelectionMode() : renderWizardMode();
}
