import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useProfesor } from '@/hooks/useProfesor';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useClases } from '@/hooks/useClases';
import { useGuiasClase } from '@/hooks/useGuias';
import { useQuizzes } from '@/hooks/useQuizzes';
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
  Lock
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Contexto', icon: BookOpen },
  { id: 2, title: 'Generar Guía', icon: Sparkles },
  { id: 3, title: 'Quiz PRE', icon: ClipboardList },
  { id: 4, title: 'Quiz POST', icon: ClipboardList },
  { id: 5, title: 'Validar', icon: FileCheck }
];

const METODOLOGIAS = [
  { id: 'socratico', nombre: 'Método Socrático', descripcion: 'Preguntas guiadas para fomentar el razonamiento' },
  { id: 'casos', nombre: 'Aprendizaje basado en casos', descripcion: 'Análisis de situaciones reales o simuladas' },
  { id: 'problemas', nombre: 'Aprendizaje basado en problemas', descripcion: 'Resolución de problemas auténticos' },
  { id: 'colaborativo', nombre: 'Aprendizaje colaborativo', descripcion: 'Trabajo en equipo y discusión grupal' },
  { id: 'reflexivo', nombre: 'Pensamiento reflexivo', descripcion: 'Metacognición y autoevaluación' }
];

const RECURSOS = [
  { id: 'proyector', nombre: 'Proyector/Pantalla' },
  { id: 'pizarra', nombre: 'Pizarra' },
  { id: 'libros', nombre: 'Libros de texto' },
  { id: 'dispositivos', nombre: 'Dispositivos electrónicos' },
  { id: 'material', nombre: 'Material manipulativo' },
  { id: 'otro', nombre: 'Otro' }
];

const ADAPTACIONES = [
  { id: 'tdah', nombre: 'TDAH' },
  { id: 'dislexia', nombre: 'Dislexia' },
  { id: 'tea', nombre: 'TEA' },
  { id: 'ninguna', nombre: 'Ninguna' },
  { id: 'otro', nombre: 'Otro' }
];

export default function GenerarClase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profesorId } = useProfesor();
  const { asignaciones, grupos, materias } = useAsignaciones('2024');
  
  const temaId = searchParams.get('tema');
  const materiaId = searchParams.get('materia');
  const claseId = searchParams.get('clase');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Data from DB
  const [temaData, setTemaData] = useState<any>(null);
  const [materiaData, setMateriaData] = useState<any>(null);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [claseData, setClaseData] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fecha: '',
    duracion: 55,
    objetivo: '',
    metodologias: [] as string[],
    recursos: [] as string[],
    adaptaciones: [] as string[],
    contexto: ''
  });

  // Generated content
  const [guiaGenerada, setGuiaGenerada] = useState<GuiaClaseData | null>(null);
  const [quizPreData, setQuizPreData] = useState<QuizData | null>(null);
  const [quizPostData, setQuizPostData] = useState<QuizData | null>(null);
  
  // Hooks for DB operations
  const { createClase, updateClase } = useClases();
  const { createGuiaVersion } = useGuiasClase(claseData?.id);
  const { createQuiz } = useQuizzes(claseData?.id);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!temaId || !materiaId || !profesorId) {
        toast({
          title: 'Error',
          description: 'Faltan parámetros necesarios (tema, materia)',
          variant: 'destructive'
        });
        navigate('/profesor/planificacion');
        return;
      }

      try {
        // Load tema
        const { data: tema, error: temaError } = await supabase
          .from('temas_plan')
          .select('*')
          .eq('id', temaId)
          .single();
        
        if (temaError) throw temaError;
        setTemaData(tema);

        // Load materia
        const { data: materia, error: materiaError } = await supabase
          .from('cursos_plan')
          .select('*')
          .eq('id', materiaId)
          .single();
        
        if (materiaError) throw materiaError;
        setMateriaData(materia);

        // Find grupo from asignaciones
        const asignacion = asignaciones.find(a => a.id_materia === materiaId);
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
            setFormData({
              fecha: clase.fecha_programada || '',
              duracion: clase.duracion_minutos || 55,
              objetivo: '',
              metodologias: clase.metodologia ? [clase.metodologia] : [],
              recursos: [],
              adaptaciones: [],
              contexto: clase.contexto || ''
            });
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
      }
    };

    loadData();
  }, [temaId, materiaId, claseId, profesorId, asignaciones]);

  // Ensure clase exists before generating
  const ensureClase = async () => {
    if (claseData) return claseData;

    if (!temaData || !grupoData || !profesorId) {
      throw new Error('Faltan datos necesarios para crear la clase');
    }

    const nuevaClase = await createClase.mutateAsync({
      id_tema: temaId!,
      id_grupo: grupoData.id,
      fecha_programada: formData.fecha || new Date().toISOString().split('T')[0],
      duracion_minutos: formData.duracion,
      contexto: formData.contexto,
      metodologia: formData.metodologias.join(', '),
      estado: 'borrador'
    });

    setClaseData(nuevaClase);
    return nuevaClase;
  };

  const handleGenerarGuia = async () => {
    if (!temaData || !formData.objetivo || !formData.contexto) {
      toast({
        title: 'Error',
        description: 'Completa el objetivo y contexto antes de generar la guía',
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
        metodologia: formData.metodologias.join(', ')
      });

      // Generate guide with AI
      const guia = await generateGuiaClase(
        temaData.nombre,
        formData.contexto,
        formData.metodologias,
        formData.objetivo,
        formData.recursos,
        formData.adaptaciones
      );

      setGuiaGenerada(guia);

      // Save to DB
      const guiaVersion = await createGuiaVersion.mutateAsync({
        id_clase: clase.id,
        objetivos: guia.objetivos.join('\n'),
        estructura: guia.estructura,
        contenido: {
          objetivos: guia.objetivos,
          estructura: guia.estructura,
          recursos: guia.recursos,
          adaptaciones: guia.adaptaciones
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
    if (!temaData) {
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
      const quiz = await generateQuiz('previo', temaData.nombre, 'intermedio', 5);
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
    if (!temaData) {
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
      const quiz = await generateQuiz('post', temaData.nombre, 'intermedio', 10);
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
        return formData.objetivo && formData.metodologias.length > 0 && formData.contexto && formData.fecha;
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

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!temaData || !materiaData || !grupoData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No se pudieron cargar los datos necesarios. Por favor, vuelve a la planificación.
            </p>
            <Button onClick={() => navigate('/profesor/planificacion')} className="mt-4">
              Volver a Planificación
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
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generar Clase con IA
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
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Curso <Lock className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input value={materiaData.nombre} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Tema <Lock className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input value={temaData.nombre} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Salón</Label>
                    <Input value={grupoData.nombre || `${grupoData.grado} ${grupoData.seccion || ''}`.trim()} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha programada</Label>
                    <Input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duración (minutos)</Label>
                    <Input type="number" value={formData.duracion} onChange={(e) => setFormData({...formData, duracion: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objetivo específico de la sesión *</Label>
                <Textarea 
                  placeholder="Describe el objetivo principal que deseas lograr en esta clase..."
                  value={formData.objetivo}
                  onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Metodologías de pensamiento crítico *</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {METODOLOGIAS.map((met) => (
                    <div
                      key={met.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.metodologias.includes(met.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        const newMet = formData.metodologias.includes(met.id)
                          ? formData.metodologias.filter(m => m !== met.id)
                          : [...formData.metodologias, met.id];
                        setFormData({...formData, metodologias: newMet});
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.metodologias.includes(met.id)} />
                        <span className="font-medium text-sm">{met.nombre}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">{met.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                  <Label>Adaptaciones necesarias</Label>
                  <div className="flex flex-wrap gap-2">
                    {ADAPTACIONES.map((adap) => (
                      <Badge
                        key={adap.id}
                        variant={formData.adaptaciones.includes(adap.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newAdap = formData.adaptaciones.includes(adap.id)
                            ? formData.adaptaciones.filter(a => a !== adap.id)
                            : [...formData.adaptaciones, adap.id];
                          setFormData({...formData, adaptaciones: newAdap});
                        }}
                      >
                        {adap.nombre}
                      </Badge>
                    ))}
                  </div>
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
                {!quizPre && (
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
                {!quizPost && (
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
}
