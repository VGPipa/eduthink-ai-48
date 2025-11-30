import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuizParaResolver } from '@/hooks/useAlumnoQuizzes';
import { useAlumno } from '@/hooks/useAlumno';
import { supabase } from '@/integrations/supabase/client';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Home,
  RotateCcw,
  Loader2,
  Star,
  Target,
  BookOpen
} from 'lucide-react';
import type { QuizResult, RespuestaLocal } from '@/hooks/useQuizSession';

interface QuizResultadoDetalle {
  pregunta_id: string;
  texto_pregunta: string;
  concepto: string | null;
  respuesta_alumno: string | null;
  respuesta_correcta: string | null;
  es_correcta: boolean;
  feedback: string | null;
}

export default function ResultadoQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { alumnoId } = useAlumno();
  
  // Get result from navigation state or fetch from DB
  const stateResult = location.state?.result as QuizResult | undefined;
  const stateQuiz = location.state?.quiz;
  
  const { quiz, isLoading: quizLoading } = useQuizParaResolver(quizId);
  const [resultado, setResultado] = useState<{
    puntaje: number;
    totalPreguntas: number;
    correctas: number;
    detalles: QuizResultadoDetalle[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(!stateResult);

  // Fetch result from DB if not in state
  useEffect(() => {
    const fetchResultado = async () => {
      if (stateResult && quiz) {
        // Use state result
        const detalles: QuizResultadoDetalle[] = quiz.preguntas.map(pregunta => {
          const respuesta = stateResult.respuestas.find(r => r.id_pregunta === pregunta.id);
          return {
            pregunta_id: pregunta.id,
            texto_pregunta: pregunta.texto_pregunta,
            concepto: pregunta.concepto,
            respuesta_alumno: respuesta?.respuesta_alumno || null,
            respuesta_correcta: pregunta.respuesta_correcta,
            es_correcta: respuesta?.es_correcta || false,
            feedback: respuesta?.es_correcta ? pregunta.feedback_acierto : pregunta.justificacion,
          };
        });

        setResultado({
          puntaje: stateResult.puntaje,
          totalPreguntas: stateResult.totalPreguntas,
          correctas: stateResult.correctas,
          detalles,
        });
        setIsLoading(false);
        return;
      }

      if (!alumnoId || !quizId || !quiz) return;

      try {
        // Fetch nota_alumno
        const { data: nota, error: notaError } = await supabase
          .from('nota_alumno')
          .select('id, puntaje_total')
          .eq('id_alumno', alumnoId)
          .eq('id_quiz', quizId)
          .eq('estado', 'completado')
          .single();

        if (notaError) throw notaError;

        // Fetch respuestas_detalle
        const { data: respuestas, error: respuestasError } = await supabase
          .from('respuestas_detalle')
          .select('id_pregunta, respuesta_alumno, es_correcta')
          .eq('id_nota_alumno', nota.id);

        if (respuestasError) throw respuestasError;

        const respuestasMap = new Map(
          (respuestas || []).map(r => [r.id_pregunta, r])
        );

        const correctas = (respuestas || []).filter(r => r.es_correcta).length;

        const detalles: QuizResultadoDetalle[] = quiz.preguntas.map(pregunta => {
          const respuesta = respuestasMap.get(pregunta.id);
          return {
            pregunta_id: pregunta.id,
            texto_pregunta: pregunta.texto_pregunta,
            concepto: pregunta.concepto,
            respuesta_alumno: respuesta?.respuesta_alumno || null,
            respuesta_correcta: pregunta.respuesta_correcta,
            es_correcta: respuesta?.es_correcta || false,
            feedback: respuesta?.es_correcta ? pregunta.feedback_acierto : pregunta.justificacion,
          };
        });

        setResultado({
          puntaje: nota.puntaje_total || 0,
          totalPreguntas: quiz.preguntas.length,
          correctas,
          detalles,
        });
      } catch (error) {
        console.error('Error fetching resultado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (quiz) {
      fetchResultado();
    }
  }, [alumnoId, quizId, quiz, stateResult]);

  // Loading state
  if (isLoading || quizLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (!resultado || !quiz) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No se encontraron resultados</h2>
            <p className="text-muted-foreground mb-4">
              No pudimos cargar los resultados de este quiz
            </p>
            <Button onClick={() => navigate('/alumno/evaluaciones')}>
              Volver a Evaluaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPassing = resultado.puntaje >= 60;
  const isExcellent = resultado.puntaje >= 80;

  // Get score color
  const getScoreColor = () => {
    if (isExcellent) return 'text-success';
    if (isPassing) return 'text-warning';
    return 'text-destructive';
  };

  // Get score message
  const getScoreMessage = () => {
    if (resultado.puntaje >= 90) return '¡Excelente trabajo!';
    if (resultado.puntaje >= 80) return '¡Muy bien!';
    if (resultado.puntaje >= 60) return '¡Buen esfuerzo!';
    if (resultado.puntaje >= 40) return 'Puedes mejorar';
    return 'Sigue practicando';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/alumno/evaluaciones')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Resultados</h1>
          <p className="text-muted-foreground">{quiz.titulo}</p>
        </div>
      </div>

      {/* Score Card */}
      <Card className={`overflow-hidden ${isExcellent ? 'border-success/30' : isPassing ? 'border-warning/30' : 'border-destructive/30'}`}>
        <div className={`p-8 text-center ${isExcellent ? 'bg-success/5' : isPassing ? 'bg-warning/5' : 'bg-destructive/5'}`}>
          {/* Trophy or icon */}
          <div className="mb-4">
            {isExcellent ? (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 animate-scale-in">
                <Trophy className="w-10 h-10 text-success" />
              </div>
            ) : isPassing ? (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 animate-scale-in">
                <Star className="w-10 h-10 text-warning" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 animate-scale-in">
                <Target className="w-10 h-10 text-destructive" />
              </div>
            )}
          </div>

          {/* Score */}
          <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
            {resultado.puntaje}%
          </div>
          <p className="text-lg font-medium mb-4">{getScoreMessage()}</p>

          {/* Stats */}
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-success mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">{resultado.correctas}</span>
              </div>
              <span className="text-muted-foreground">Correctas</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                <XCircle className="w-4 h-4" />
                <span className="font-bold">{resultado.totalPreguntas - resultado.correctas}</span>
              </div>
              <span className="text-muted-foreground">Incorrectas</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="font-bold">{resultado.totalPreguntas}</span>
              </div>
              <span className="text-muted-foreground">Total</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <Progress 
              value={resultado.puntaje} 
              className={`h-3 ${isExcellent ? '[&>div]:bg-success' : isPassing ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`}
            />
          </div>
        </div>

        {/* Quiz type badge */}
        <div className="p-4 border-t flex justify-center">
          <Badge variant={quiz.tipo === 'previo' ? 'secondary' : 'default'}>
            {quiz.tipo === 'previo' ? 'Quiz Diagnóstico' : 'Evaluación de Competencias'}
          </Badge>
        </div>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revisión de Respuestas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultado.detalles.map((detalle, index) => (
            <div 
              key={detalle.pregunta_id}
              className={`p-4 rounded-lg border-l-4 ${
                detalle.es_correcta 
                  ? 'border-l-success bg-success/5' 
                  : 'border-l-destructive bg-destructive/5'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  detalle.es_correcta ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                }`}>
                  {detalle.es_correcta ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  {detalle.concepto && (
                    <p className="text-xs text-muted-foreground italic mb-1">
                      {detalle.concepto}
                    </p>
                  )}
                  <p className="font-medium">{detalle.texto_pregunta}</p>
                </div>
              </div>

              {/* Answers */}
              <div className="ml-11 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-24">Tu respuesta:</span>
                  <span className={detalle.es_correcta ? 'text-success font-medium' : 'text-destructive'}>
                    {detalle.respuesta_alumno || 'Sin respuesta'}
                  </span>
                </div>
                {!detalle.es_correcta && detalle.respuesta_correcta && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">Correcta:</span>
                    <span className="text-success font-medium">{detalle.respuesta_correcta}</span>
                  </div>
                )}
                
                {/* Feedback */}
                {detalle.feedback && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    detalle.es_correcta ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <p className={detalle.es_correcta ? 'text-success' : 'text-muted-foreground'}>
                      {detalle.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center pb-6">
        <Button variant="outline" onClick={() => navigate('/alumno/evaluaciones')}>
          <Home className="w-4 h-4 mr-2" />
          Volver a Evaluaciones
        </Button>
        <Button variant="gradient" onClick={() => navigate('/alumno/dashboard')}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Ir al Dashboard
        </Button>
      </div>
    </div>
  );
}
