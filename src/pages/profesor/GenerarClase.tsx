import { useState } from 'react';
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

// Mock de guía generada
const MOCK_GUIA = {
  objetivos: [
    'Comprender los conceptos fundamentales de las ecuaciones de segundo grado',
    'Aplicar la fórmula general para resolver ecuaciones cuadráticas',
    'Analizar críticamente los resultados obtenidos'
  ],
  estructura: [
    { tiempo: '10 min', actividad: 'Introducción', descripcion: 'Activación de conocimientos previos mediante preguntas socráticas' },
    { tiempo: '15 min', actividad: 'Desarrollo conceptual', descripcion: 'Explicación de la fórmula general con ejemplos' },
    { tiempo: '20 min', actividad: 'Práctica guiada', descripcion: 'Resolución de ejercicios en grupos pequeños' },
    { tiempo: '10 min', actividad: 'Cierre', descripcion: 'Reflexión metacognitiva y preguntas de verificación' }
  ],
  preguntasSocraticas: [
    '¿Qué patrones observas en las soluciones de estas ecuaciones?',
    '¿Cómo podrías verificar si tu respuesta es correcta?',
    '¿En qué situaciones de la vida real podrías aplicar este conocimiento?'
  ]
};

const MOCK_QUIZ_PRE = [
  { tipo: 'conocimiento', texto: '¿Cuál es la forma general de una ecuación de segundo grado?' },
  { tipo: 'conocimiento', texto: '¿Qué significa el discriminante en una ecuación cuadrática?' },
  { tipo: 'razonamiento', texto: 'Si una ecuación tiene discriminante negativo, ¿qué puedes inferir sobre sus soluciones?' }
];

const MOCK_QUIZ_POST = [
  { tipo: 'aplicacion', texto: 'Resuelve: x² + 5x + 6 = 0' },
  { tipo: 'analisis', texto: 'Explica por qué la ecuación x² + 1 = 0 no tiene soluciones reales' },
  { tipo: 'razonamiento', texto: 'Un jardín rectangular tiene área de 24m². Si el largo es 2m más que el ancho, ¿cuáles son sus dimensiones?' },
  { tipo: 'aplicacion', texto: 'Determina los valores de x para los cuales x² - 4x = 0' },
  { tipo: 'analisis', texto: 'Compara las soluciones de x² = 9 y x² = -9. ¿Qué diferencias observas y por qué?' }
];

export default function GenerarClase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    curso: 'Matemáticas',
    tema: 'Ecuaciones de segundo grado',
    salon: '3ro A',
    fecha: '2024-01-25',
    duracion: 55,
    objetivo: '',
    metodologias: ['socratico'],
    recursos: ['proyector', 'pizarra'],
    adaptaciones: ['ninguna'],
    recursoOtro: '',
    adaptacionOtro: '',
    contexto: ''
  });

  // Generated content
  const [guiaGenerada, setGuiaGenerada] = useState<typeof MOCK_GUIA | null>(null);
  const [quizPre, setQuizPre] = useState<typeof MOCK_QUIZ_PRE | null>(null);
  const [quizPost, setQuizPost] = useState<typeof MOCK_QUIZ_POST | null>(null);

  const handleGenerarGuia = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGuiaGenerada(MOCK_GUIA);
    setIsGenerating(false);
    toast({ title: '¡Guía generada!', description: 'La guía de clase ha sido creada con éxito' });
  };

  const handleGenerarQuizPre = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setQuizPre(MOCK_QUIZ_PRE);
    setIsGenerating(false);
    toast({ title: 'Quiz PRE generado', description: '3 preguntas diagnósticas listas' });
  };

  const handleGenerarQuizPost = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setQuizPost(MOCK_QUIZ_POST);
    setIsGenerating(false);
    toast({ title: 'Quiz POST generado', description: '5 preguntas de evaluación listas' });
  };

  const handleValidar = () => {
    if (!guiaGenerada || !quizPre || !quizPost) {
      toast({ 
        title: 'Pasos incompletos', 
        description: 'Debes completar todos los pasos anteriores',
        variant: 'destructive'
      });
      return;
    }
    toast({ title: '¡Clase validada!', description: 'Tu clase está lista para ser impartida' });
    navigate('/profesor/dashboard');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.objetivo && formData.metodologias.length > 0 && formData.contexto;
      case 2:
        return guiaGenerada !== null;
      case 3:
        return quizPre !== null;
      case 4:
        return quizPost !== null;
      default:
        return true;
    }
  };

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
                    <Input value={formData.curso} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Tema <Lock className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input value={formData.tema} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Salón</Label>
                    <Input value={formData.salon} disabled />
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

              {quizPre && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Quiz PRE generado ({quizPre.length} preguntas)</span>
                    </div>
                  </div>

                  {quizPre.map((pregunta, i) => (
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

              {quizPost && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Quiz POST generado ({quizPost.length} preguntas)</span>
                    </div>
                  </div>

                  {quizPost.map((pregunta, i) => (
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
                  { label: 'Quiz PRE (diagnóstico)', completed: !!quizPre },
                  { label: 'Quiz POST (evaluación)', completed: !!quizPost }
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

              {guiaGenerada && quizPre && quizPost && (
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
            disabled={!guiaGenerada || !quizPre || !quizPost}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Validar Clase
          </Button>
        )}
      </div>
    </div>
  );
}
