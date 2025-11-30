import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAlumno } from './useAlumno';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type NotaAlumnoInsert = Database['public']['Tables']['nota_alumno']['Insert'];
type RespuestaDetalleInsert = Database['public']['Tables']['respuestas_detalle']['Insert'];

export interface RespuestaLocal {
  id_pregunta: string;
  respuesta_alumno: string;
  es_correcta: boolean;
  tiempo_segundos?: number;
}

export interface QuizSessionState {
  notaAlumnoId: string | null;
  fechaInicio: Date | null;
  respuestas: Map<string, RespuestaLocal>;
  tiempoLimite: number; // in minutes
  submitted: boolean;
}

export interface QuizResult {
  puntaje: number;
  totalPreguntas: number;
  correctas: number;
  respuestas: RespuestaLocal[];
}

export function useQuizSession(quizId: string | undefined, tiempoLimiteMinutos: number = 15) {
  const { alumnoId } = useAlumno();
  const queryClient = useQueryClient();
  
  const [session, setSession] = useState<QuizSessionState>({
    notaAlumnoId: null,
    fechaInicio: null,
    respuestas: new Map(),
    tiempoLimite: tiempoLimiteMinutos,
    submitted: false,
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(tiempoLimiteMinutos * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef<(() => Promise<void>) | null>(null);

  // Start quiz mutation
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      if (!alumnoId || !quizId) throw new Error('Missing alumnoId or quizId');

      // Check if there's an existing in-progress session
      const { data: existingNota } = await supabase
        .from('nota_alumno')
        .select('id, fecha_inicio')
        .eq('id_alumno', alumnoId)
        .eq('id_quiz', quizId)
        .eq('estado', 'en_progreso')
        .single();

      if (existingNota) {
        // Resume existing session
        return {
          id: existingNota.id,
          fecha_inicio: existingNota.fecha_inicio,
          isResume: true,
        };
      }

      // Create new nota_alumno
      const fechaInicio = new Date().toISOString();
      const { data, error } = await supabase
        .from('nota_alumno')
        .insert({
          id_alumno: alumnoId,
          id_quiz: quizId,
          estado: 'en_progreso',
          fecha_inicio: fechaInicio,
        } as NotaAlumnoInsert)
        .select()
        .single();

      if (error) throw error;
      return { id: data.id, fecha_inicio: fechaInicio, isResume: false };
    },
    onSuccess: (data) => {
      const fechaInicio = new Date(data.fecha_inicio);
      setSession(prev => ({
        ...prev,
        notaAlumnoId: data.id,
        fechaInicio,
      }));

      // Calculate remaining time based on when quiz started
      const elapsed = Math.floor((Date.now() - fechaInicio.getTime()) / 1000);
      const remaining = Math.max(0, tiempoLimiteMinutos * 60 - elapsed);
      setTimeRemaining(remaining);

      if (data.isResume) {
        toast.info('Continuando quiz en progreso');
      }
    },
    onError: (error: any) => {
      toast.error('Error al iniciar el quiz: ' + error.message);
    },
  });

  // Save respuesta mutation
  const saveRespuestaMutation = useMutation({
    mutationFn: async (respuesta: RespuestaLocal) => {
      if (!session.notaAlumnoId) throw new Error('Quiz session not started');

      // Check if respuesta already exists
      const { data: existing } = await supabase
        .from('respuestas_detalle')
        .select('id')
        .eq('id_nota_alumno', session.notaAlumnoId)
        .eq('id_pregunta', respuesta.id_pregunta)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('respuestas_detalle')
          .update({
            respuesta_alumno: respuesta.respuesta_alumno,
            es_correcta: respuesta.es_correcta,
            tiempo_segundos: respuesta.tiempo_segundos,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('respuestas_detalle')
          .insert({
            id_nota_alumno: session.notaAlumnoId,
            id_pregunta: respuesta.id_pregunta,
            respuesta_alumno: respuesta.respuesta_alumno,
            es_correcta: respuesta.es_correcta,
            tiempo_segundos: respuesta.tiempo_segundos,
          } as RespuestaDetalleInsert);

        if (error) throw error;
      }

      return respuesta;
    },
    onSuccess: (respuesta) => {
      setSession(prev => {
        const newRespuestas = new Map(prev.respuestas);
        newRespuestas.set(respuesta.id_pregunta, respuesta);
        return { ...prev, respuestas: newRespuestas };
      });
    },
    onError: (error: any) => {
      console.error('Error saving respuesta:', error);
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!session.notaAlumnoId) throw new Error('Quiz session not started');

      // Calculate score
      const respuestasArray = Array.from(session.respuestas.values());
      const correctas = respuestasArray.filter(r => r.es_correcta).length;
      const total = respuestasArray.length;
      const puntaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

      // Update nota_alumno
      const { error } = await supabase
        .from('nota_alumno')
        .update({
          estado: 'completado',
          puntaje_total: puntaje,
          fecha_envio: new Date().toISOString(),
        })
        .eq('id', session.notaAlumnoId);

      if (error) throw error;

      return {
        puntaje,
        totalPreguntas: total,
        correctas,
        respuestas: respuestasArray,
      } as QuizResult;
    },
    onSuccess: () => {
      setSession(prev => ({ ...prev, submitted: true }));
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['quizzes-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes-completados'] });
      toast.success('Quiz enviado correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al enviar el quiz: ' + error.message);
    },
  });

  // Start quiz function
  const startQuiz = useCallback(async () => {
    return startQuizMutation.mutateAsync();
  }, [startQuizMutation]);

  // Save respuesta function
  const saveRespuesta = useCallback(async (
    preguntaId: string,
    respuestaTexto: string,
    esCorrecta: boolean,
    tiempoSegundos?: number
  ) => {
    const respuesta: RespuestaLocal = {
      id_pregunta: preguntaId,
      respuesta_alumno: respuestaTexto,
      es_correcta: esCorrecta,
      tiempo_segundos: tiempoSegundos,
    };

    // Update local state immediately
    setSession(prev => {
      const newRespuestas = new Map(prev.respuestas);
      newRespuestas.set(preguntaId, respuesta);
      return { ...prev, respuestas: newRespuestas };
    });

    // Save to DB
    return saveRespuestaMutation.mutateAsync(respuesta);
  }, [saveRespuestaMutation]);

  // Submit quiz function
  const submitQuiz = useCallback(async () => {
    return submitQuizMutation.mutateAsync();
  }, [submitQuizMutation]);

  // Get current respuesta for a pregunta
  const getRespuesta = useCallback((preguntaId: string) => {
    return session.respuestas.get(preguntaId);
  }, [session.respuestas]);

  // Track if auto-submit has been triggered
  const hasAutoSubmittedRef = useRef(false);

  // Timer effect
  useEffect(() => {
    // Don't start timer if already submitted or auto-submitted
    if (!session.fechaInicio || session.submitted || hasAutoSubmittedRef.current) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        
        // Auto-submit when time reaches 0, but only once
        if (newTime === 0 && !hasAutoSubmittedRef.current && autoSubmitRef.current) {
          hasAutoSubmittedRef.current = true;
          // Clear interval immediately to prevent further calls
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          autoSubmitRef.current();
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session.fechaInicio, session.submitted]);

  // Store auto-submit function ref
  useEffect(() => {
    autoSubmitRef.current = async () => {
      if (!session.submitted && session.notaAlumnoId && !hasAutoSubmittedRef.current) {
        toast.warning('¡Tiempo agotado! Enviando respuestas...');
        await submitQuiz();
      }
    };
  }, [session.submitted, session.notaAlumnoId, submitQuiz]);

  // Format time remaining
  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    // State
    session,
    timeRemaining,
    formatTimeRemaining,
    isStarted: !!session.notaAlumnoId,
    isSubmitted: session.submitted,
    respuestasCount: session.respuestas.size,

    // Actions
    startQuiz,
    saveRespuesta,
    submitQuiz,
    getRespuesta,

    // Loading states
    isStarting: startQuizMutation.isPending,
    isSaving: saveRespuestaMutation.isPending,
    isSubmitting: submitQuizMutation.isPending,

    // Results
    result: submitQuizMutation.data,
  };
}
