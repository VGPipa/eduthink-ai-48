import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuizParaResolver, type PreguntaCompleta } from '@/hooks/useAlumnoQuizzes';
import { useQuizSession } from '@/hooks/useQuizSession';
import {
  Loader2,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
  Brain
} from 'lucide-react';

type QuizViewState = 'loading' | 'estimulo' | 'pregunta' | 'confirmar' | 'submitting';

export default function ResolverQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const { quiz, isLoading: quizLoading, error: quizError } = useQuizParaResolver(quizId);
  const {
    session,
    timeRemaining,
    formatTimeRemaining,
    isStarted,
    isSubmitted,
    startQuiz,
    saveRespuesta,
    submitQuiz,
    getRespuesta,
    isStarting,
    isSubmitting,
    result,
  } = useQuizSession(quizId, quiz?.tiempo_limite || 15);

  const [viewState, setViewState] = useState<QuizViewState>('loading');
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [preguntaStartTime, setPreguntaStartTime] = useState<number>(Date.now());

  // Initialize view state
  useEffect(() => {
    if (quizLoading) {
      setViewState('loading');
    } else if (quiz) {
      // If quiz PRE has estimulo, show it first
      if (quiz.tipo === 'previo' && quiz.estimulo_aprendizaje && !isStarted) {
        setViewState('estimulo');
      } else if (!isStarted) {
        setViewState('estimulo'); // Show intro even for POST
      } else {
        setViewState('pregunta');
      }
    }
  }, [quiz, quizLoading, isStarted]);

  // Navigate to results when submitted
  useEffect(() => {
    if (isSubmitted && result) {
      navigate(`/alumno/quiz/${quizId}/resultado`, { 
        state: { result, quiz } 
      });
    }
  }, [isSubmitted, result, quizId, navigate, quiz]);

  // Load saved respuesta when changing pregunta
  useEffect(() => {
    if (quiz && quiz.preguntas[currentPreguntaIndex]) {
      const preguntaId = quiz.preguntas[currentPreguntaIndex].id;
      const savedRespuesta = getRespuesta(preguntaId);
      setSelectedOption(savedRespuesta?.respuesta_alumno || null);
      setPreguntaStartTime(Date.now());
    }
  }, [currentPreguntaIndex, quiz, getRespuesta]);

  const handleStartQuiz = async () => {
    await startQuiz();
    setViewState('pregunta');
    setCurrentPreguntaIndex(0);
    setPreguntaStartTime(Date.now());
  };

  const handleSelectOption = async (opcionTexto: string, esCorrecta: boolean) => {
    if (!quiz) return;
    
    setSelectedOption(opcionTexto);
    
    const pregunta = quiz.preguntas[currentPreguntaIndex];
    const tiempoSegundos = Math.floor((Date.now() - preguntaStartTime) / 1000);
    
    await saveRespuesta(pregunta.id, opcionTexto, esCorrecta, tiempoSegundos);
  };

  const handleNext = () => {
    if (!quiz) return;
    
    if (currentPreguntaIndex < quiz.preguntas.length - 1) {
      setCurrentPreguntaIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      // Last question - show confirmation
      setViewState('confirmar');
    }
  };

  const handlePrevious = () => {
    if (currentPreguntaIndex > 0) {
      setCurrentPreguntaIndex(prev => prev - 1);
      setSelectedOption(null);
    }
  };

  const handleSubmit = async () => {
    setViewState('submitting');
    await submitQuiz();
  };

  const handleBackToQuestions = () => {
    setViewState('pregunta');
  };

  // Loading state
  if (viewState === 'loading' || quizLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (quizError || !quiz) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error al cargar el quiz</h2>
            <p className="text-muted-foreground mb-4">
              {quizError?.message || 'No se pudo encontrar el quiz'}
            </p>
            <Button onClick={() => navigate('/alumno/evaluaciones')}>
              Volver a Evaluaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitting state
  if (viewState === 'submitting') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Enviando respuestas...</p>
          <p className="text-muted-foreground">Por favor espera</p>
        </div>
      </div>
    );
  }

  const currentPregunta = quiz.preguntas[currentPreguntaIndex];
  const progress = ((currentPreguntaIndex + 1) / quiz.preguntas.length) * 100;
  const answeredCount = session.respuestas.size;
  const isTimeWarning = timeRemaining < 60 && timeRemaining > 0;
  const isTimeCritical = timeRemaining <= 30 && timeRemaining > 0;

  // Estímulo / Intro view
  if (viewState === 'estimulo') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/alumno/evaluaciones')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quiz.titulo}</h1>
            <p className="text-muted-foreground">
              {quiz.curso_nombre} • {quiz.tema_nombre}
            </p>
          </div>
        </div>

        {/* Quiz Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <Badge variant={quiz.tipo === 'previo' ? 'secondary' : 'default'}>
                {quiz.tipo === 'previo' ? 'Diagnóstico' : 'Evaluación'}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {quiz.tiempo_limite} minutos
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                {quiz.preguntas.length} preguntas
              </div>
            </div>

            {/* Estímulo de aprendizaje for PRE quiz */}
            {quiz.tipo === 'previo' && quiz.estimulo_aprendizaje && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-900">Estímulo de Aprendizaje</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {quiz.estimulo_aprendizaje.tiempo_lectura_estimado}
                  </Badge>
                </div>
                
                <h4 className="text-xl font-semibold text-blue-800 mb-3">
                  {quiz.estimulo_aprendizaje.titulo}
                </h4>
                
                <p className="text-blue-900/80 leading-relaxed whitespace-pre-line">
                  {quiz.estimulo_aprendizaje.texto_contenido}
                </p>
              </div>
            )}

            {/* Instructions for POST quiz */}
            {quiz.tipo === 'post' && quiz.instrucciones && (
              <div className="p-4 rounded-lg bg-muted/50 mb-6">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {quiz.instrucciones}
                </p>
              </div>
            )}

            {/* Start button */}
            <div className="text-center">
              <Button 
                variant="gradient" 
                size="lg" 
                onClick={handleStartQuiz}
                disabled={isStarting}
                className="px-8"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Comenzar Quiz
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Una vez iniciado, el tiempo comenzará a correr
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation view
  if (viewState === 'confirmar') {
    const unanswered = quiz.preguntas.length - answeredCount;
    
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header with timer */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Confirmar Envío</h1>
          <Badge 
            variant={isTimeCritical ? 'destructive' : isTimeWarning ? 'secondary' : 'outline'}
            className="text-lg px-4 py-2"
          >
            <Clock className="w-4 h-4 mr-2" />
            {formatTimeRemaining()}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              ¿Estás seguro de enviar tus respuestas?
            </h2>
            
            <div className="p-4 rounded-lg bg-muted/50 mb-6">
              <p className="text-muted-foreground">
                Has respondido <span className="font-bold text-foreground">{answeredCount}</span> de{' '}
                <span className="font-bold text-foreground">{quiz.preguntas.length}</span> preguntas
              </p>
              {unanswered > 0 && (
                <p className="text-warning text-sm mt-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Tienes {unanswered} pregunta(s) sin responder
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleBackToQuestions}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Revisar Respuestas
              </Button>
              <Button variant="gradient" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Quiz
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Question view
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header with progress and timer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{quiz.titulo}</h1>
            <p className="text-sm text-muted-foreground">
              {quiz.curso_nombre} • {quiz.tema_nombre}
            </p>
          </div>
          <Badge 
            variant={isTimeCritical ? 'destructive' : isTimeWarning ? 'secondary' : 'outline'}
            className={`text-lg px-4 py-2 ${isTimeCritical ? 'animate-pulse' : ''}`}
          >
            <Clock className="w-4 h-4 mr-2" />
            {formatTimeRemaining()}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Pregunta {currentPreguntaIndex + 1} de {quiz.preguntas.length}
            </span>
            <span className="text-muted-foreground">
              {answeredCount} respondidas
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question card */}
      <Card className="animate-slide-up">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold shrink-0">
              {currentPreguntaIndex + 1}
            </div>
            <div>
              {currentPregunta.concepto && (
                <p className="text-xs text-muted-foreground italic mb-2">
                  {currentPregunta.concepto}
                </p>
              )}
              <CardTitle className="text-lg font-semibold leading-relaxed">
                {currentPregunta.texto_pregunta}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentPregunta.opciones_parsed.map((opcion, index) => {
            const isSelected = selectedOption === opcion.texto;
            const letter = String.fromCharCode(65 + index);
            
            return (
              <button
                key={index}
                onClick={() => handleSelectOption(opcion.texto, opcion.es_correcta)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    isSelected
                      ? 'gradient-bg text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {letter}
                  </div>
                  <span className={isSelected ? 'font-medium' : ''}>
                    {opcion.texto}
                  </span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentPreguntaIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button
          variant="gradient"
          onClick={handleNext}
          disabled={!selectedOption}
        >
          {currentPreguntaIndex === quiz.preguntas.length - 1 ? (
            <>
              Finalizar
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Question dots navigator */}
      <div className="flex justify-center gap-2 flex-wrap">
        {quiz.preguntas.map((_, index) => {
          const preguntaId = quiz.preguntas[index].id;
          const hasAnswer = session.respuestas.has(preguntaId);
          const isCurrent = index === currentPreguntaIndex;
          
          return (
            <button
              key={index}
              onClick={() => setCurrentPreguntaIndex(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? 'gradient-bg text-primary-foreground scale-110'
                  : hasAnswer
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
