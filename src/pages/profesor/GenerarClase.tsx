import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useProfesor } from '@/hooks/useProfesor';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useClases, type Clase } from '@/hooks/useClases';
import { useGuiasClase } from '@/hooks/useGuias';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useTemasProfesor } from '@/hooks/useTemasProfesor';
import { supabase } from '@/integrations/supabase/client';
import { generateGuiaClase, generateQuizPre, generateQuizPost, type GuiaClaseData, type QuizPreData, type QuizPostData } from '@/lib/ai/generate';
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
  X,
  Brain,
  Heart,
  GraduationCap,
  Clock,
  Lightbulb,
  User,
  Rocket,
  ImageIcon,
  Eye
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Contexto', icon: BookOpen },
  { id: 2, title: 'Guía de Clase', icon: Sparkles },
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
  const [generarEnParalelo, setGenerarEnParalelo] = useState(false);
  
  // Parallel generation progress
  const [generacionProgreso, setGeneracionProgreso] = useState({
    guia: { estado: 'pendiente' as 'pendiente' | 'generando' | 'completado' | 'error', error: null as string | null },
    quizPre: { estado: 'pendiente' as 'pendiente' | 'generando' | 'completado' | 'error', error: null as string | null },
    quizPost: { estado: 'pendiente' as 'pendiente' | 'generando' | 'completado' | 'error', error: null as string | null }
  });
  
  // Data from DB
  const [temaData, setTemaData] = useState<any>(null);
  const [cursoData, setCursoData] = useState<any>(null);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [claseData, setClaseData] = useState<any>(null);
  
  // Check if class is completed (read-only mode)
  const isClaseCompletada = claseData?.estado === 'completada';
  
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
  const [quizPreData, setQuizPreData] = useState<QuizPreData | null>(null);
  const [quizPostData, setQuizPostData] = useState<QuizPostData | null>(null);
  
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

  // Get all unique temas from cursos asignados for filter
  const temasDisponibles = useMemo(() => {
    const temasMap = new Map<string, { id: string; nombre: string }>();
    
    // Get temas from cursosConTemas (all temas from assigned courses)
    cursosConTemas.forEach(curso => {
      curso.temas.forEach(tema => {
        if (!temasMap.has(tema.id)) {
          temasMap.set(tema.id, { id: tema.id, nombre: tema.nombre });
        }
      });
    });
    
    return Array.from(temasMap.values());
  }, [cursosConTemas]);

  // Get all unique grupos from asignaciones for filter
  const gruposDisponibles = useMemo(() => {
    const gruposMap = new Map<string, { id: string; nombre: string }>();
    
    // Get grupos from asignaciones (all groups assigned to the profesor)
    grupos.forEach(grupo => {
      if (grupo && !gruposMap.has(grupo.id)) {
        const nombre = grupo.nombre || `${grupo.grado}° ${grupo.seccion || ''}`.trim();
        gruposMap.set(grupo.id, { id: grupo.id, nombre });
      }
    });
    
    return Array.from(gruposMap.values());
  }, [grupos]);
  
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

              // Load existing guide if it exists
              if (clase.id_guia_version_actual) {
                try {
                  const { data: guia } = await supabase
                    .from('guias_clase_versiones')
                    .select('*')
                    .eq('id', clase.id_guia_version_actual)
                    .single();

                  if (guia && guia.contenido) {
                    const contenidoGuia = guia.contenido as any;
                    setGuiaGenerada(contenidoGuia);
                    // Advance to step 2 to show the guide
                    setCurrentStep(2);
                  }
                } catch (error) {
                  console.error('Error loading guide:', error);
                }
              }

              // Load existing quizzes if they exist
              await loadQuizzesFromDB(clase.id);

              // Advance to appropriate step based on what exists
              // If class is completed, don't go to step 5 (validation)
              const claseCompletada = clase.estado === 'completada';
              if (guiaGenerada && quizPreData && quizPostData) {
                setCurrentStep(claseCompletada ? 4 : 5);
              } else if (guiaGenerada && quizPreData) {
                setCurrentStep(4);
              } else if (guiaGenerada) {
                setCurrentStep(3);
              }
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

          // Load existing guide if it exists
          if (clase.id_guia_version_actual) {
            try {
              const { data: guia } = await supabase
                .from('guias_clase_versiones')
                .select('*')
                .eq('id', clase.id_guia_version_actual)
                .single();

              if (guia && guia.contenido) {
                const contenidoGuia = guia.contenido as any;
                setGuiaGenerada(contenidoGuia);
                // Advance to step 2 to show the guide
                setCurrentStep(2);
              }
            } catch (error) {
              console.error('Error loading guide:', error);
            }
          }

          // Load existing quizzes if they exist
          await loadQuizzesFromDB(clase.id);
          
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

  // Effect to advance to appropriate step when data is loaded
  useEffect(() => {
    if (!isLoadingData && viewMode === 'wizard' && claseData) {
      // Only advance if we're still on step 1 (don't override user navigation)
      if (currentStep === 1) {
        // If class is completed, max step is 4 (don't show validation step)
        if (isClaseCompletada) {
          if (guiaGenerada && quizPreData && quizPostData) {
            setCurrentStep(4);
          } else if (guiaGenerada && quizPreData) {
            setCurrentStep(4);
          } else if (guiaGenerada) {
            setCurrentStep(2);
          }
        } else {
          // Normal flow for non-completed classes
          if (guiaGenerada && quizPreData && quizPostData) {
            setCurrentStep(5);
          } else if (guiaGenerada && quizPreData) {
            setCurrentStep(4);
          } else if (guiaGenerada) {
            setCurrentStep(2);
          }
        }
      }
    }
  }, [isLoadingData, viewMode, guiaGenerada, quizPreData, quizPostData, currentStep, claseData, isClaseCompletada]);

  // Helper function to load quizzes from database
  const loadQuizzesFromDB = async (claseId: string) => {
    try {
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select(`
          *,
          preguntas:preguntas(*)
        `)
        .eq('id_clase', claseId)
        .order('tipo', { ascending: true });

      if (quizzes) {
        const quizPre = quizzes.find(q => q.tipo === 'previo');
        const quizPost = quizzes.find(q => q.tipo === 'post');

        if (quizPre && quizPre.preguntas && Array.isArray(quizPre.preguntas) && quizPre.preguntas.length > 0) {
          // Reconstruct QuizPreData from database
          // Extract estimulo info from titulo and instrucciones
          const tituloMatch = quizPre.titulo?.match(/Micro-Learning:\s*(.+)/);
          const tiempoMatch = quizPre.instrucciones?.match(/Tiempo estimado de lectura:\s*(.+)/);
          
          const quizPreData: QuizPreData = {
            estimulo_aprendizaje: {
              titulo: tituloMatch ? tituloMatch[1] : quizPre.titulo || 'Estímulo de Aprendizaje',
              texto_contenido: 'Contenido de aprendizaje previo a la clase', // This is not stored in DB anymore
              descripcion_visual: 'Ilustración educativa relacionada con el tema', // This is not stored in DB anymore
              tiempo_lectura_estimado: tiempoMatch ? tiempoMatch[1] : '2 minutos'
            },
            quiz_comprension: (quizPre.preguntas as any[]).map((p: any) => ({
              pregunta: p.texto_pregunta,
              concepto: p.concepto || '',
              opciones: p.opciones || [],
              feedback_acierto: p.feedback_acierto || '¡Correcto!',
              feedback_error: p.justificacion || 'Revisa nuevamente.'
            }))
          };
          setQuizPreData(quizPreData);
        }

        if (quizPost && quizPost.preguntas && Array.isArray(quizPost.preguntas) && quizPost.preguntas.length > 0) {
          const quizPostData: QuizPostData = {
            metadata: {
              titulo_evaluacion: quizPost.titulo || 'Evaluación de Competencias',
              proposito: quizPost.instrucciones?.split('\n\n')[0] || 'Evaluar el aprendizaje',
              nivel_taxonomico: quizPost.instrucciones?.match(/Nivel taxonómico:\s*(.+)/)?.[1] || 'Aplicación',
              tiempo_sugerido: `${quizPost.tiempo_limite || 15} minutos`
            },
            preguntas: (quizPost.preguntas as any[]).map((p: any) => {
              // Parse contexto_situacional and pregunta from texto_pregunta
              const partes = p.texto_pregunta?.split('\n\n') || [];
              const contexto = partes.length > 1 ? partes[0] : '';
              const pregunta = partes.length > 1 ? partes[1] : p.texto_pregunta || '';
              
              return {
                numero: p.orden || 0,
                contexto_situacional: contexto,
                pregunta: pregunta,
                concepto: p.concepto || '',
                opciones: p.opciones || [],
                retroalimentacion_detallada: p.justificacion || ''
              };
            })
          };
          setQuizPostData(quizPostData);
        }
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

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
    
    // Load existing guide if it exists
    if (clase.id_guia_version_actual) {
      try {
        const { data: guia } = await supabase
          .from('guias_clase_versiones')
          .select('*')
          .eq('id', clase.id_guia_version_actual)
          .single();
        console.log('Guía:', guia);
        if (guia && guia.contenido) {
          const contenidoGuia = guia.contenido as any;
          setGuiaGenerada(contenidoGuia);
          // Advance to step 2 to show the guide
          // setCurrentStep(2);
        }
      } catch (error) {
        console.error('Error loading guide:', error);
      }
    }
    
    // Load existing quizzes if they exist
    await loadQuizzesFromDB(clase.id);
    
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
    setGenerarEnParalelo(false);
    setGeneracionProgreso({
      guia: { estado: 'pendiente', error: null },
      quizPre: { estado: 'pendiente', error: null },
      quizPost: { estado: 'pendiente', error: null }
    });
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
    // If there are URL params, user came from dashboard - navigate back
    if (claseId || temaId || cursoId) {
      navigate('/profesor/dashboard');
      return;
    }
    
    // Otherwise, switch to selection mode
    setViewMode('selection');
    setIsExtraordinaria(false);
    setTemaData(null);
    setCursoData(null);
    setGrupoData(null);
    setClaseData(null);
    setGuiaGenerada(null);
    setQuizPreData(null);
    setQuizPostData(null);
    setGenerarEnParalelo(false);
    setGeneracionProgreso({
      guia: { estado: 'pendiente', error: null },
      quizPre: { estado: 'pendiente', error: null },
      quizPost: { estado: 'pendiente', error: null }
    });
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

      // Save to DB with new schema content
      const guiaVersion = await createGuiaVersion.mutateAsync({
        id_clase: clase.id,
        objetivos: `Cognitivo: ${guia.objetivos_aprendizaje.cognitivo}\nHumano: ${guia.objetivos_aprendizaje.humano}`,
        estructura: guia.secuencia_didactica,
        contenido: guia, // Save full new schema
        preguntas_socraticas: [], // No longer generated in new prompt
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
      
      // Avanzar automáticamente al paso 2
      setCurrentStep(2);
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

  const handleGenerarTodoEnParalelo = async () => {
    // Use custom name if provided, otherwise use tema name from DB
    const temaNombre = formData.temaPersonalizado || temaData?.nombre;
    
    if (!temaNombre || !formData.contexto) {
      toast({
        title: 'Error',
        description: 'Completa el tema y contexto antes de generar',
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
    setGeneracionProgreso({
      guia: { estado: 'generando', error: null },
      quizPre: { estado: 'generando', error: null },
      quizPost: { estado: 'generando', error: null }
    });

    try {
      // Ensure clase exists
      const clase = await ensureClase();
      
      // Update clase state
      await updateClase.mutateAsync({
        id: clase.id,
        estado: 'generando_clase',
        contexto: formData.contexto,
      });

      // Generate all three in parallel
      const [guiaResult, quizPreResult, quizPostResult] = await Promise.allSettled([
        // Generate guía
        generateGuiaClase(
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
        ),
        // Generate quiz PRE (without guia info initially)
        generateQuizPre({
          tema: temaNombre,
          contexto: formData.contexto,
          grado: grupoData?.grado,
          area: cursoData?.nombre
        }),
        // Generate quiz POST (without guia info initially)
        generateQuizPost({
          tema: temaNombre,
          contexto: formData.contexto,
          grado: grupoData?.grado,
          area: cursoData?.nombre
        })
      ]);

      // Process guía result
      if (guiaResult.status === 'fulfilled') {
        const guia = guiaResult.value;
        setGuiaGenerada(guia);
        setGeneracionProgreso(prev => ({ ...prev, guia: { estado: 'completado', error: null } }));

        // Save guía to DB
        const guiaVersion = await createGuiaVersion.mutateAsync({
          id_clase: clase.id,
          objetivos: `Cognitivo: ${guia.objetivos_aprendizaje.cognitivo}\nHumano: ${guia.objetivos_aprendizaje.humano}`,
          estructura: guia.secuencia_didactica,
          contenido: guia,
          preguntas_socraticas: [],
          generada_ia: true,
          estado: 'borrador'
        });

        await updateClase.mutateAsync({
          id: clase.id,
          estado: 'editando_guia',
          id_guia_version_actual: guiaVersion.id
        });
      } else {
        const errorMsg = guiaResult.reason?.message || 'Error desconocido';
        setGeneracionProgreso(prev => ({ ...prev, guia: { estado: 'error', error: errorMsg } }));
        toast({
          title: 'Error al generar guía',
          description: errorMsg,
          variant: 'destructive'
        });
      }

      // Process quiz PRE result
      if (quizPreResult.status === 'fulfilled') {
        const quiz = quizPreResult.value;
        setQuizPreData(quiz);
        setGeneracionProgreso(prev => ({ ...prev, quizPre: { estado: 'completado', error: null } }));

        // Save quiz PRE to DB
        const quizCreated = await createQuiz.mutateAsync({
          id_clase: clase.id,
          tipo: 'previo',
          titulo: `Micro-Learning: ${quiz.estimulo_aprendizaje.titulo}`,
          instrucciones: `Lee atentamente el siguiente contenido y responde las preguntas de comprensión. Tiempo estimado de lectura: ${quiz.estimulo_aprendizaje.tiempo_lectura_estimado}`,
          tiempo_limite: 5,
          estado: 'borrador'
        });

        const preguntasToInsert = quiz.quiz_comprension.map((p, index) => {
          const opcionCorrecta = p.opciones.find(o => o.es_correcta)?.texto || '';
          return {
            id_quiz: quizCreated.id,
            texto_pregunta: p.pregunta,
            concepto: p.concepto,
            tipo: 'opcion_multiple' as const,
            opciones: p.opciones,
            respuesta_correcta: opcionCorrecta,
            justificacion: p.feedback_error,
            feedback_acierto: p.feedback_acierto,
            orden: index + 1
          };
        });

        const { error: preguntasError } = await supabase
          .from('preguntas')
          .insert(preguntasToInsert);

        if (preguntasError) throw preguntasError;
      } else {
        const errorMsg = quizPreResult.reason?.message || 'Error desconocido';
        setGeneracionProgreso(prev => ({ ...prev, quizPre: { estado: 'error', error: errorMsg } }));
        toast({
          title: 'Error al generar Quiz PRE',
          description: errorMsg,
          variant: 'destructive'
        });
      }

      // Process quiz POST result
      if (quizPostResult.status === 'fulfilled') {
        const quiz = quizPostResult.value;
        setQuizPostData(quiz);
        setGeneracionProgreso(prev => ({ ...prev, quizPost: { estado: 'completado', error: null } }));

        // Save quiz POST to DB
        const quizCreated = await createQuiz.mutateAsync({
          id_clase: clase.id,
          tipo: 'post',
          titulo: quiz.metadata.titulo_evaluacion,
          instrucciones: `${quiz.metadata.proposito}\n\nNivel taxonómico: ${quiz.metadata.nivel_taxonomico}`,
          tiempo_limite: 15,
          estado: 'borrador'
        });

        const preguntasToInsert = quiz.preguntas.map(p => {
          const opcionCorrecta = p.opciones.find(o => o.es_correcta)?.texto || '';
          return {
            id_quiz: quizCreated.id,
            texto_pregunta: `${p.contexto_situacional}\n\n${p.pregunta}`,
            concepto: temaData?.nombre || 'Aplicación práctica',
            tipo: 'opcion_multiple' as const,
            opciones: p.opciones,
            respuesta_correcta: opcionCorrecta,
            justificacion: p.retroalimentacion_detallada,
            orden: p.numero
          };
        });

        const { error: preguntasError } = await supabase
          .from('preguntas')
          .insert(preguntasToInsert);

        if (preguntasError) throw preguntasError;
      } else {
        const errorMsg = quizPostResult.reason?.message || 'Error desconocido';
        setGeneracionProgreso(prev => ({ ...prev, quizPost: { estado: 'error', error: errorMsg } }));
        toast({
          title: 'Error al generar Quiz POST',
          description: errorMsg,
          variant: 'destructive'
        });
      }

      // Show success message if at least one succeeded
      const successCount = [
        guiaResult.status === 'fulfilled',
        quizPreResult.status === 'fulfilled',
        quizPostResult.status === 'fulfilled'
      ].filter(Boolean).length;

      if (successCount > 0) {
        toast({
          title: 'Generación completada',
          description: `${successCount} de 3 componentes generados exitosamente`
        });
        
        // Advance to step 2 if guía was generated
        if (guiaResult.status === 'fulfilled') {
          setCurrentStep(2);
        }
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error durante la generación: ' + error.message,
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

      // Extract enriched info from guia for better quiz generation with concept alignment
      const guiaInfo = guiaGenerada ? {
        objetivo_cognitivo: guiaGenerada.objetivos_aprendizaje.cognitivo,
        objetivo_humano: guiaGenerada.objetivos_aprendizaje.humano,
        desempeno_cneb: guiaGenerada.curriculo_peru.desempeno_precisado,
        actividad_inicio: guiaGenerada.secuencia_didactica.find(s => s.fase === 'INICIO')?.actividad_detallada,
        actividad_desarrollo: guiaGenerada.secuencia_didactica.find(s => s.fase === 'DESARROLLO')?.actividad_detallada,
        criterios_evaluacion: guiaGenerada.recursos_y_evaluacion.criterios_evaluacion,
        capacidad_cneb: guiaGenerada.curriculo_peru.capacidad,
        habilidad_foco: guiaGenerada.secuencia_didactica.find(s => s.fase === 'DESARROLLO')?.habilidad_foco
      } : undefined;

      // Generate quiz with AI using new edge function
      const quiz = await generateQuizPre({
        tema: temaNombre,
        contexto: formData.contexto,
        grado: grupoData?.grado,
        area: cursoData?.nombre,
        guia_clase: guiaInfo
      });
      
      setQuizPreData(quiz);

      // Save quiz to DB
      const quizCreated = await createQuiz.mutateAsync({
        id_clase: clase.id,
        tipo: 'previo',
        titulo: `Micro-Learning: ${quiz.estimulo_aprendizaje.titulo}`,
        instrucciones: `Lee atentamente el siguiente contenido y responde las preguntas de comprensión. Tiempo estimado de lectura: ${quiz.estimulo_aprendizaje.tiempo_lectura_estimado}`,
        tiempo_limite: 5,
        estado: 'borrador'
      });

      // Save questions with new structure
      const preguntasToInsert = quiz.quiz_comprension.map((p, index) => {
        // Find the correct option text
        const opcionCorrecta = p.opciones.find(o => o.es_correcta)?.texto || '';
        
        return {
          id_quiz: quizCreated.id,
          texto_pregunta: p.pregunta,
          concepto: p.concepto,
          tipo: 'opcion_multiple' as const,
          opciones: p.opciones,
          respuesta_correcta: opcionCorrecta,
          justificacion: p.feedback_error,
          feedback_acierto: p.feedback_acierto,
          orden: index + 1
        };
      });

      const { error: preguntasError } = await supabase
        .from('preguntas')
        .insert(preguntasToInsert);

      if (preguntasError) throw preguntasError;

      toast({ title: 'Quiz PRE generado', description: `Micro-Learning con ${quiz.quiz_comprension.length} preguntas de comprensión` });
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

      // Extract enriched info from guia for better quiz generation
      const guiaInfo = guiaGenerada ? {
        objetivo_humano: guiaGenerada.objetivos_aprendizaje.humano,
        objetivo_aprendizaje: guiaGenerada.objetivos_aprendizaje.cognitivo,
        competencia: guiaGenerada.curriculo_peru.competencia,
        capacidad: guiaGenerada.curriculo_peru.capacidad,
        desempeno_cneb: guiaGenerada.curriculo_peru.desempeno_precisado,
        enfoque_transversal: guiaGenerada.curriculo_peru.enfoque_transversal,
        actividad_desarrollo: guiaGenerada.secuencia_didactica.find(s => s.fase === 'DESARROLLO')?.actividad_detallada,
        actividad_cierre: guiaGenerada.secuencia_didactica.find(s => s.fase === 'CIERRE')?.actividad_detallada,
        criterios_evaluacion: guiaGenerada.recursos_y_evaluacion.criterios_evaluacion
      } : undefined;

      // Generate quiz with AI using new edge function
      const quiz = await generateQuizPost({
        tema: temaNombre,
        contexto: formData.contexto,
        grado: grupoData?.grado,
        area: cursoData?.nombre,
        guia_clase: guiaInfo
      });
      
      setQuizPostData(quiz);

      // Save quiz to DB with metadata in instrucciones
      const quizCreated = await createQuiz.mutateAsync({
        id_clase: clase.id,
        tipo: 'post',
        titulo: quiz.metadata.titulo_evaluacion,
        instrucciones: `${quiz.metadata.proposito}\n\nNivel taxonómico: ${quiz.metadata.nivel_taxonomico}`,
        tiempo_limite: 15,
        estado: 'borrador'
      });

      // Save questions
      const preguntasToInsert = quiz.preguntas.map(p => {
        const opcionCorrecta = p.opciones.find(o => o.es_correcta)?.texto || '';
        
        return {
          id_quiz: quizCreated.id,
          texto_pregunta: `${p.contexto_situacional}\n\n${p.pregunta}`,
          concepto: temaData?.nombre || 'Aplicación práctica',
          tipo: 'opcion_multiple' as const,
          opciones: p.opciones,
          respuesta_correcta: opcionCorrecta,
          justificacion: p.retroalimentacion_detallada,
          orden: p.numero
        };
      });

      const { error: preguntasError } = await supabase
        .from('preguntas')
        .insert(preguntasToInsert);

      if (preguntasError) throw preguntasError;

      toast({ title: 'Quiz POST generado', description: `Evaluación de competencias con ${quiz.preguntas.length} preguntas` });
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
      // Transición directa a clase_programada (validación completa)
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

  // Calculate progress based on completion status
  const totalSteps = isClaseCompletada ? 4 : STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

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
          {STEPS.filter(step => !isClaseCompletada || step.id <= 4).map((step) => (
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
              {/* Read-only mode banner for completed classes */}
              {isClaseCompletada && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Modo solo lectura - Esta clase está completada y no puede ser editada</span>
                  </div>
                </div>
              )}
              
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
                          disabled={isClaseCompletada}
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
                          disabled={!cursoData || isClaseCompletada}
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
                          disabled={isClaseCompletada}
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
                          disabled={isClaseCompletada}
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
                    <DatePicker
                      value={formData.fecha}
                      onChange={(value) => setFormData({...formData, fecha: value})}
                      placeholder="Selecciona una fecha"
                      disabled={isClaseCompletada}
                    />
                  </div>

                    {/* Duración */}
                  <div className="space-y-2">
                    <Label>Duración (minutos)</Label>
                    <Input 
                      type="number" 
                      value={formData.duracion} 
                      onChange={(e) => setFormData({...formData, duracion: parseInt(e.target.value)})}
                      disabled={isClaseCompletada}
                    />
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
                        className={isClaseCompletada ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                        onClick={() => {
                          if (!isClaseCompletada) {
                            const newRec = formData.recursos.includes(rec.id)
                              ? formData.recursos.filter(r => r !== rec.id)
                              : [...formData.recursos, rec.id];
                            setFormData({...formData, recursos: newRec});
                          }
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
                  disabled={isClaseCompletada}
                />
              </div>

              {/* Opción de generación en paralelo (para demo) */}
              {!isClaseCompletada && (
                <div className="flex items-center space-x-2 p-4 rounded-lg border bg-muted/30">
                  <Checkbox 
                    id="generar-paralelo" 
                    checked={generarEnParalelo}
                    onCheckedChange={(checked) => setGenerarEnParalelo(checked === true)}
                  />
                  <Label htmlFor="generar-paralelo" className="cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Generar todo en paralelo (Demo)</span>
                      <span className="text-xs text-muted-foreground">
                        Genera la guía y ambos quizzes simultáneamente para acelerar el proceso
                      </span>
                    </div>
                  </Label>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Generate Guide */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Read-only mode banner for completed classes */}
              {isClaseCompletada && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Modo solo lectura - Esta clase está completada y no puede ser editada</span>
                  </div>
                </div>
              )}
              
              {isGenerating && generarEnParalelo ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-lg font-semibold mb-2">Generando en Paralelo</h2>
                    <p className="text-muted-foreground">
                      Generando guía y quizzes simultáneamente...
                    </p>
                  </div>
                  
                  {/* Progress indicators */}
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border ${
                      generacionProgreso.guia.estado === 'completado' ? 'bg-success/10 border-success/20' :
                      generacionProgreso.guia.estado === 'error' ? 'bg-destructive/10 border-destructive/20' :
                      'bg-muted/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {generacionProgreso.guia.estado === 'completado' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : generacionProgreso.guia.estado === 'error' ? (
                            <X className="w-5 h-5 text-destructive" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          )}
                          <span className="font-medium">Guía de Clase</span>
                        </div>
                        <Badge variant={
                          generacionProgreso.guia.estado === 'completado' ? 'default' :
                          generacionProgreso.guia.estado === 'error' ? 'destructive' :
                          'secondary'
                        }>
                          {generacionProgreso.guia.estado === 'completado' ? 'Completado' :
                           generacionProgreso.guia.estado === 'error' ? 'Error' :
                           'Generando...'}
                        </Badge>
                      </div>
                      {generacionProgreso.guia.error && (
                        <p className="text-xs text-destructive mt-2">{generacionProgreso.guia.error}</p>
                      )}
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      generacionProgreso.quizPre.estado === 'completado' ? 'bg-success/10 border-success/20' :
                      generacionProgreso.quizPre.estado === 'error' ? 'bg-destructive/10 border-destructive/20' :
                      'bg-muted/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {generacionProgreso.quizPre.estado === 'completado' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : generacionProgreso.quizPre.estado === 'error' ? (
                            <X className="w-5 h-5 text-destructive" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          )}
                          <span className="font-medium">Quiz PRE</span>
                        </div>
                        <Badge variant={
                          generacionProgreso.quizPre.estado === 'completado' ? 'default' :
                          generacionProgreso.quizPre.estado === 'error' ? 'destructive' :
                          'secondary'
                        }>
                          {generacionProgreso.quizPre.estado === 'completado' ? 'Completado' :
                           generacionProgreso.quizPre.estado === 'error' ? 'Error' :
                           'Generando...'}
                        </Badge>
                      </div>
                      {generacionProgreso.quizPre.error && (
                        <p className="text-xs text-destructive mt-2">{generacionProgreso.quizPre.error}</p>
                      )}
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      generacionProgreso.quizPost.estado === 'completado' ? 'bg-success/10 border-success/20' :
                      generacionProgreso.quizPost.estado === 'error' ? 'bg-destructive/10 border-destructive/20' :
                      'bg-muted/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {generacionProgreso.quizPost.estado === 'completado' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : generacionProgreso.quizPost.estado === 'error' ? (
                            <X className="w-5 h-5 text-destructive" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          )}
                          <span className="font-medium">Quiz POST</span>
                        </div>
                        <Badge variant={
                          generacionProgreso.quizPost.estado === 'completado' ? 'default' :
                          generacionProgreso.quizPost.estado === 'error' ? 'destructive' :
                          'secondary'
                        }>
                          {generacionProgreso.quizPost.estado === 'completado' ? 'Completado' :
                           generacionProgreso.quizPost.estado === 'error' ? 'Error' :
                           'Generando...'}
                        </Badge>
                      </div>
                      {generacionProgreso.quizPost.error && (
                        <p className="text-xs text-destructive mt-2">{generacionProgreso.quizPost.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="text-lg font-semibold mb-2">Generando Guía de Clase</h2>
                  <p className="text-muted-foreground">
                    El Arquitecto Pedagógico está creando tu experiencia de aprendizaje...
                  </p>
                </div>
              ) : !guiaGenerada ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay guía generada. Vuelve al paso anterior.
                  </p>
                  {!isClaseCompletada && (
                    <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(1)}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Volver a Contexto
                    </Button>
                  )}
                </div>
              ) : null}

              {guiaGenerada && (
                <div className="space-y-6 animate-fade-in">
                  {/* Success Banner */}
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-medium">{claseData?.id_guia_version_actual ? 'Guía de clase cargada' : 'Guía generada exitosamente'}</span>
                    </div>
                  </div>

                  {/* Metadata Header */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <h3 className="text-lg font-bold text-primary mb-1">{guiaGenerada.metadata.titulo}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{guiaGenerada.metadata.resumen}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guiaGenerada.metadata.duracion} min
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {guiaGenerada.metadata.grado_sugerido}
                      </Badge>
                    </div>
                  </div>

                  {/* Currículo CNEB */}
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Alineación Curricular (CNEB)
                    </h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-32">Área:</span>
                        <span>{guiaGenerada.curriculo_peru.area}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-32">Competencia:</span>
                        <span>{guiaGenerada.curriculo_peru.competencia}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-32">Capacidad:</span>
                        <span>{guiaGenerada.curriculo_peru.capacidad}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-32">Desempeño:</span>
                        <span>{guiaGenerada.curriculo_peru.desempeno_precisado}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-32">Enfoque:</span>
                        <Badge variant="outline">{guiaGenerada.curriculo_peru.enfoque_transversal}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Objetivos de Aprendizaje - Dual Pillars */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50">
                      <h4 className="font-semibold flex items-center gap-2 mb-2 text-blue-700">
                        <Brain className="w-5 h-5" />
                        Objetivo Cognitivo (Mente)
                      </h4>
                      <p className="text-sm">{guiaGenerada.objetivos_aprendizaje.cognitivo}</p>
                    </div>
                    <div className="p-4 rounded-lg border-2 border-rose-200 bg-rose-50/50">
                      <h4 className="font-semibold flex items-center gap-2 mb-2 text-rose-700">
                        <Heart className="w-5 h-5" />
                        Objetivo Humano (Corazón)
                      </h4>
                      <p className="text-sm">{guiaGenerada.objetivos_aprendizaje.humano}</p>
                    </div>
                  </div>

                  {/* Secuencia Didáctica */}
                  <div>
                    <h4 className="font-semibold mb-4">Secuencia Didáctica</h4>
                    <div className="space-y-4">
                      {guiaGenerada.secuencia_didactica.map((fase, i) => {
                        const faseColors = {
                          INICIO: 'border-l-amber-500 bg-amber-50/50',
                          DESARROLLO: 'border-l-blue-500 bg-blue-50/50',
                          CIERRE: 'border-l-green-500 bg-green-50/50'
                        };
                        const faseTextColors = {
                          INICIO: 'text-amber-700',
                          DESARROLLO: 'text-blue-700',
                          CIERRE: 'text-green-700'
                        };
                        return (
                          <div 
                            key={i} 
                            className={`p-4 rounded-lg border-l-4 ${faseColors[fase.fase] || 'border-l-gray-500 bg-gray-50/50'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${faseTextColors[fase.fase] || 'text-gray-700'}`}>
                                  {fase.fase}
                                </span>
                                <span className="text-sm text-muted-foreground">- {fase.subtitulo}</span>
                              </div>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fase.tiempo}
                              </Badge>
                            </div>
                            <p className="text-sm mb-3">{fase.actividad_detallada}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                <Lightbulb className="w-3 h-3" />
                                {fase.habilidad_foco}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                <User className="w-3 h-3" />
                                {fase.rol_docente}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recursos y Evaluación */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold mb-3">Materiales Necesarios</h4>
                      <ul className="space-y-1">
                        {guiaGenerada.recursos_y_evaluacion.materiales_necesarios.map((mat, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            {mat}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold mb-3">Evaluación</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Criterios:</span>
                          <ul className="mt-1 space-y-1">
                            {guiaGenerada.recursos_y_evaluacion.criterios_evaluacion.map((crit, i) => (
                              <li key={i} className="text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-success" />
                                {crit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Instrumento:</span>
                          <Badge variant="secondary" className="ml-2">{guiaGenerada.recursos_y_evaluacion.instrumento_sugerido}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tips para el Profesor */}
                  <div className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-600" />
                      Tips para el Profesor
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-purple-600 flex items-center gap-1 mb-1">
                          <Target className="w-3 h-3" />
                          Diferenciación
                        </span>
                        <p className="text-sm">{guiaGenerada.tips_profesor.diferenciacion}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-pink-600 flex items-center gap-1 mb-1">
                          <Rocket className="w-3 h-3" />
                          Reto Extra
                        </span>
                        <p className="text-sm">{guiaGenerada.tips_profesor.reto_extra}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Quiz PRE */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Read-only mode banner for completed classes */}
              {isClaseCompletada && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Modo solo lectura - Esta clase está completada y no puede ser editada</span>
                  </div>
                </div>
              )}
              
              {!quizPreData && (
                <div className="text-center py-4">
                  <ClipboardList className="w-12 h-12 text-info mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Micro-Learning (PRE)</h2>
                  <p className="text-muted-foreground mb-6">
                    Estímulo de aprendizaje + 3 preguntas de comprensión
                  </p>
                  <Button variant="gradient" size="lg" onClick={handleGenerarQuizPre} disabled={isGenerating || isClaseCompletada}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Micro-Learning
                      </>
                    )}
                  </Button>
                </div>
              )}

              {quizPreData && (
                <div className="space-y-6 animate-fade-in">
                  {/* Success Banner */}
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Micro-Learning generado ({quizPreData.quiz_comprension.length} preguntas)</span>
                    </div>
                  </div>

                  {/* Estímulo de Aprendizaje */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-900">Estímulo de Aprendizaje</h3>
                      <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quizPreData.estimulo_aprendizaje.tiempo_lectura_estimado}
                      </Badge>
                    </div>
                    
                    <h4 className="text-xl font-semibold text-blue-800 mb-3">
                      {quizPreData.estimulo_aprendizaje.titulo}
                    </h4>
                    
                    <p className="text-blue-900/80 leading-relaxed mb-4">
                      {quizPreData.estimulo_aprendizaje.texto_contenido}
                    </p>
                    
                    {/* Visual description placeholder */}
                    <div className="p-4 rounded-lg bg-white/60 border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Descripción Visual (para generar imagen)</span>
                      </div>
                      <p className="text-sm text-blue-800/70 italic">
                        {quizPreData.estimulo_aprendizaje.descripcion_visual}
                      </p>
                    </div>
                  </div>

                  {/* Preguntas de Comprensión */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      Preguntas de Comprensión
                    </h4>
                    <div className="space-y-4">
                      {quizPreData.quiz_comprension.map((pregunta, i) => (
                        <div key={i} className="p-4 rounded-lg border bg-card">
                          {/* Concepto sutil en gris cursiva */}
                          <p className="text-xs text-muted-foreground italic mb-2">
                            {i + 1}. {pregunta.concepto}
                          </p>
                          
                          {/* Pregunta principal en negrita */}
                          <p className="font-semibold mb-3">{pregunta.pregunta}</p>
                          
                          <div className="space-y-2 mb-4">
                            {pregunta.opciones.map((opcion, j) => (
                              <div 
                                key={j} 
                                className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                                  opcion.es_correcta 
                                    ? 'bg-success/10 border border-success/30 text-success' 
                                    : 'bg-muted/50 border border-muted'
                                }`}
                              >
                                {opcion.es_correcta && <CheckCircle2 className="w-4 h-4" />}
                                <span>{opcion.texto}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                              <span className="text-xs font-medium text-success flex items-center gap-1 mb-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Feedback Acierto
                              </span>
                              <p className="text-sm text-success/80">{pregunta.feedback_acierto}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                              <span className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                                <Info className="w-3 h-3" />
                                Feedback Error
                              </span>
                              <p className="text-sm text-destructive/80">{pregunta.feedback_error}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Quiz POST */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Read-only mode banner for completed classes */}
              {isClaseCompletada && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Modo solo lectura - Esta clase está completada y no puede ser editada</span>
                  </div>
                </div>
              )}
              
              {!quizPostData && (
                <div className="text-center py-4">
                  <ClipboardList className="w-12 h-12 text-success mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Evaluación de Competencias (POST)</h2>
                  <p className="text-muted-foreground mb-6">
                    7 preguntas de situación y análisis • 15 minutos
                  </p>
                  <Button variant="gradient" size="lg" onClick={handleGenerarQuizPost} disabled={isGenerating || isClaseCompletada}>
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
                </div>
              )}

              {quizPostData && (
                <div className="space-y-6 animate-fade-in">
                  {/* Metadata Header */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold">{quizPostData.metadata.titulo_evaluacion}</span>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quizPostData.metadata.tiempo_sugerido}
                      </Badge>
                    </div>
                    <p className="text-sm text-emerald-600 mb-2">{quizPostData.metadata.proposito}</p>
                    <Badge variant="outline" className="text-xs">
                      Nivel: {quizPostData.metadata.nivel_taxonomico}
                    </Badge>
                  </div>

                  {/* Questions - Clean layout */}
                  <div className="space-y-4">
                    {quizPostData.preguntas.map((pregunta, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card">
                        {/* Contexto situacional - cursiva y gris suave */}
                        <p className="text-sm italic text-muted-foreground mb-2">
                          {pregunta.contexto_situacional}
                        </p>
                        
                        {/* Pregunta principal - negrita con número */}
                        <p className="font-semibold mb-4">
                          {pregunta.numero}. {pregunta.pregunta}
                        </p>
                        
                        {/* Opciones */}
                        <div className="space-y-2 mb-4">
                          {pregunta.opciones.map((opcion, j) => (
                            <div 
                              key={j} 
                              className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                                opcion.es_correcta 
                                  ? 'bg-success/10 border border-success/30 text-success' 
                                  : 'bg-muted/50 border border-muted'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium">
                                {String.fromCharCode(65 + j)}
                              </span>
                              {opcion.es_correcta && <CheckCircle2 className="w-4 h-4" />}
                              <span>{opcion.texto}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Retroalimentación expandible */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            Ver retroalimentación detallada
                          </summary>
                          <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-sm text-amber-800">{pregunta.retroalimentacion_detallada}</p>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Validate - Only show if class is not completed */}
          {currentStep === 5 && !isClaseCompletada && (
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
          
          {/* Show completion message if class is completed and on step 5 */}
          {currentStep === 5 && isClaseCompletada && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Clase Completada</h2>
                <p className="text-muted-foreground mb-6">
                  Esta clase ya ha sido completada y validada
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
                <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">Clase completada exitosamente</p>
                  <p className="text-sm text-muted-foreground">Todos los componentes están completos</p>
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

        {/* Determine max step based on completion status */}
        {(() => {
          const maxStep = isClaseCompletada ? 4 : 5;
          
          if (currentStep < maxStep) {
            if (currentStep === 1) {
              if (guiaGenerada) {
                return (
                  <Button 
                    variant="gradient"
                    onClick={() => setCurrentStep(2)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Guía
                  </Button>
                );
              } else {
                return (
                  <Button 
                    variant="gradient"
                    onClick={generarEnParalelo ? handleGenerarTodoEnParalelo : handleGenerarGuia}
                    disabled={!canProceed() || isGenerating || isClaseCompletada}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {generarEnParalelo ? 'Generando todo...' : 'Generando...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {generarEnParalelo ? 'Generar Todo en Paralelo' : 'Generar Guía'}
                      </>
                    )}
                  </Button>
                );
              }
            } else {
              return (
                <Button 
                  variant="gradient"
                  onClick={() => setCurrentStep(Math.min(maxStep, currentStep + 1))}
                  disabled={!canProceed()}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              );
            }
          } else {
            // Step 5 - only show validate button if not completed
            if (!isClaseCompletada) {
              return (
                <Button 
                  variant="gradient"
                  onClick={handleValidar}
                  disabled={!guiaGenerada || !quizPreData || !quizPostData}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Validar Clase
                </Button>
              );
            } else {
              // If completed, just show a message or nothing
              return null;
            }
          }
        })()}
      </div>
    </div>
  );
  };

  // Main render
  return viewMode === 'selection' ? renderSelectionMode() : renderWizardMode();
}
