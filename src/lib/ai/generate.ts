/**
 * AI Integration Module
 * 
 * This module provides functions for AI-powered generation of:
 * - Class guides (guías de clase)
 * - Quizzes (PRE and POST)
 * - Processing quiz responses and generating recommendations
 * - Generating personalized feedback (retroalimentaciones)
 * 
 * Uses Supabase Edge Functions with OpenAI for real AI generation.
 */

import { supabase } from '@/integrations/supabase/client';

// New schema aligned with "Arquitecto Pedagógico" prompt
export interface GuiaClaseData {
  metadata: {
    titulo: string;
    resumen: string;
    duracion: number;
    grado_sugerido: string;
  };
  curriculo_peru: {
    area: string;
    competencia: string;
    capacidad: string;
    desempeno_precisado: string;
    enfoque_transversal: string;
  };
  objetivos_aprendizaje: {
    cognitivo: string;
    humano: string;
  };
  secuencia_didactica: Array<{
    fase: 'INICIO' | 'DESARROLLO' | 'CIERRE';
    subtitulo: string;
    tiempo: string;
    actividad_detallada: string;
    habilidad_foco: string;
    rol_docente: string;
  }>;
  recursos_y_evaluacion: {
    materiales_necesarios: string[];
    criterios_evaluacion: string[];
    instrumento_sugerido: string;
  };
  tips_profesor: {
    diferenciacion: string;
    reto_extra: string;
  };
}

export interface GenerateGuiaClaseInput {
  tema: string;
  contexto: string;
  recursos?: string[];
  grado?: string;
  seccion?: string;
  numeroEstudiantes?: number;
  duracion?: number;
  area?: string;
}

export interface QuizQuestion {
  tipo: 'conocimiento' | 'aplicacion' | 'analisis' | 'razonamiento' | 'evaluacion';
  texto: string;
  concepto?: string;
  opciones?: string[];
  respuesta_correcta: string;
  justificacion: string;
  orden: number;
}

export interface QuizData {
  titulo: string;
  instrucciones: string;
  preguntas: QuizQuestion[];
}

// New Pre-Quiz with Learning Stimulus
export interface EstimuloAprendizaje {
  titulo: string;
  texto_contenido: string;
  descripcion_visual: string;
  tiempo_lectura_estimado: string;
}

export interface QuizPrePregunta {
  pregunta: string;
  concepto: string;
  opciones: Array<{ texto: string; es_correcta: boolean }>;
  feedback_acierto: string;
  feedback_error: string;
}

export interface QuizPreData {
  estimulo_aprendizaje: EstimuloAprendizaje;
  quiz_comprension: QuizPrePregunta[];
}

export interface GenerateQuizPreInput {
  tema: string;
  contexto: string;
  grado?: string;
  area?: string;
  guia_clase?: {
    objetivo_cognitivo?: string;
    objetivo_humano?: string;
    desempeno_cneb?: string;
    actividad_inicio?: string;
  };
}

export interface RecomendacionData {
  titulo: string;
  contenido: string;
  tipo: 'metodologia' | 'contenido' | 'actividad' | 'seguimiento';
  prioridad: 'alta' | 'media' | 'baja';
  momento: 'durante_clase' | 'proxima_sesion';
  concepto_relacionado: string;
}

export interface AnalisisGeneral {
  participacion: number;
  promedio_grupo: number;
  nivel_preparacion: 'bajo' | 'medio' | 'alto';
  resumen: string;
}

export interface ConceptoDebil {
  concepto: string;
  pregunta_id?: string;
  pregunta_texto?: string;
  porcentaje_acierto: number;
  patron_error?: string;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface ProcessQuizResult {
  analisis_general: AnalisisGeneral;
  conceptos_debiles: ConceptoDebil[];
  recomendaciones: RecomendacionData[];
  alertas: string[];
}

export interface RetroalimentacionData {
  contenido: string;
  fortalezas: string[];
  areas_mejora: string[];
  recomendaciones: string[];
  tipo: 'individual' | 'grupal';
}

export interface ProcessQuizResponseData {
  respuestas: Array<{
    id_alumno: string;
    respuestas_detalle: Array<{
      id_pregunta: string;
      respuesta_alumno: string;
      es_correcta: boolean;
    }>;
  }>;
  preguntas: Array<{
    id: string;
    texto_pregunta: string;
    concepto?: string;
    respuesta_correcta?: string;
  }>;
  tema?: string;
  grado?: string;
  area?: string;
  contexto?: string;
}

/**
 * Generates a class guide using AI via Supabase Edge Function
 * 
 * @param tema - Topic name
 * @param contexto - Context about the class/group
 * @param recursos - Available resources
 * @param opciones - Optional additional context (grado, seccion, etc.)
 * @returns Generated guide data aligned with CNEB
 */
export async function generateGuiaClase(
  tema: string,
  contexto: string,
  recursos: string[],
  opciones?: {
    grado?: string;
    seccion?: string;
    numeroEstudiantes?: number;
    duracion?: number;
    area?: string;
  }
): Promise<GuiaClaseData> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-guia-clase', {
      body: {
        tema,
        contexto,
        recursos: recursos || [],
        grado: opciones?.grado,
        seccion: opciones?.seccion,
        numeroEstudiantes: opciones?.numeroEstudiantes,
        duracion: opciones?.duracion,
        area: opciones?.area
      }
    });

    if (error) {
      console.error('Error calling generate-guia-clase:', error);
      throw new Error(error.message || 'Error al generar la guía');
    }

    // Check if the response contains an error
    if (data?.error) {
      throw new Error(data.error);
    }

    return data as GuiaClaseData;
  } catch (error) {
    console.error('Error in generateGuiaClase:', error);
    throw error; // Re-throw to let UI handle the error
  }
}


/**
 * Generates PRE quiz with learning stimulus using AI via Edge Function
 * 
 * @param input - Input data including tema, contexto, and guia_clase info
 * @returns Generated pre-quiz data with stimulus and questions
 */
export async function generateQuizPre(input: GenerateQuizPreInput): Promise<QuizPreData> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quiz-pre', {
      body: input
    });

    if (error) {
      console.error('Error calling generate-quiz-pre:', error);
      throw new Error(error.message || 'Error al generar el quiz PRE');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data as QuizPreData;
  } catch (error) {
    console.error('Error in generateQuizPre:', error);
    throw error;
  }
}

/**
 * Generates quiz questions (POST only now - PRE uses generateQuizPre)
 * 
 * @param tipo - 'previo' or 'post'
 * @param tema - Topic name
 * @param nivel - Expected level
 * @param cantidad - Number of questions to generate
 * @returns Generated quiz data
 */
export async function generateQuiz(
  tipo: 'previo' | 'post',
  tema: string,
  nivel: string = 'intermedio',
  cantidad: number = tipo === 'previo' ? 5 : 10
): Promise<QuizData> {
  // TODO: Replace with actual AI API call for POST quiz
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

  const titulo = tipo === 'previo' 
    ? `Evaluación Diagnóstica: ${tema}`
    : `Evaluación Final: ${tema}`;

  const instrucciones = tipo === 'previo'
    ? 'Responde las siguientes preguntas para evaluar tus conocimientos previos sobre el tema.'
    : 'Responde las siguientes preguntas para evaluar tu comprensión del tema después de la clase.';

  const preguntas: QuizQuestion[] = [];

  // POST quiz: Focus on application and analysis
  for (let i = 1; i <= cantidad; i++) {
    const tipos = ['aplicacion', 'analisis', 'razonamiento', 'evaluacion'] as const;
    const tipoPregunta = tipos[(i - 1) % tipos.length];
    
    preguntas.push({
      tipo: tipoPregunta,
      texto: `Pregunta ${i} sobre ${tema}: Aplica los conceptos aprendidos para resolver este problema.`,
      concepto: tema,
      opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
      respuesta_correcta: 'Opción B',
      justificacion: `Esta respuesta demuestra comprensión adecuada de ${tema}.`,
      orden: i
    });
  }

  return {
    titulo,
    instrucciones,
    preguntas
  };
}

/**
 * Processes quiz responses and generates AI-powered recommendations
 * 
 * @param data - Quiz response data including student answers
 * @param tipo - 'previo' or 'post'
 * @returns AI-generated recommendations and analysis
 */
export async function processQuizResponses(
  data: ProcessQuizResponseData,
  tipo: 'previo' | 'post'
): Promise<ProcessQuizResult> {
  try {
    // Pre-process data to aggregate responses
    const totalAlumnos = data.respuestas.length;
    const respuestasCompletas = data.respuestas.filter(r => 
      r.respuestas_detalle.length > 0
    );
    const participacion = totalAlumnos > 0 
      ? Math.round((respuestasCompletas.length / totalAlumnos) * 100)
      : 0;

    // Calculate metrics per question
    const respuestasAgregadas = data.preguntas.map(pregunta => {
      const respuestasParaPregunta = respuestasCompletas.flatMap(r => 
        r.respuestas_detalle.filter(d => d.id_pregunta === pregunta.id)
      );
      
      const total = respuestasParaPregunta.length;
      const correctas = respuestasParaPregunta.filter(r => r.es_correcta).length;
      const incorrectas = total - correctas;
      
      // Get frequent incorrect answers
      const incorrectasMap = new Map<string, number>();
      respuestasParaPregunta
        .filter(r => !r.es_correcta && r.respuesta_alumno)
        .forEach(r => {
          const count = incorrectasMap.get(r.respuesta_alumno) || 0;
          incorrectasMap.set(r.respuesta_alumno, count + 1);
        });
      
      const respuestasIncorrectasFrecuentes = Array.from(incorrectasMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([respuesta]) => respuesta);

      return {
        id_pregunta: pregunta.id,
        total_respuestas: total,
        correctas,
        incorrectas,
        porcentaje_acierto: total > 0 ? Math.round((correctas / total) * 100) : 0,
        respuestas_incorrectas_frecuentes: respuestasIncorrectasFrecuentes
      };
    });

    // Calculate overall average
    const totalCorrectas = respuestasAgregadas.reduce((sum, r) => sum + r.correctas, 0);
    const totalRespuestas = respuestasAgregadas.reduce((sum, r) => sum + r.total_respuestas, 0);
    const promedio = totalRespuestas > 0 ? Math.round((totalCorrectas / totalRespuestas) * 100) : 0;

    // Call AI Edge Function
    const { data: aiResult, error } = await supabase.functions.invoke('generate-recomendaciones', {
      body: {
        tipo_quiz: tipo,
        tema: data.tema || 'Tema no especificado',
        grado: data.grado || 'No especificado',
        area: data.area || 'No especificada',
        contexto: data.contexto || '',
        preguntas: data.preguntas.map(p => ({
          id: p.id,
          texto_pregunta: p.texto_pregunta,
          concepto: p.concepto || 'General',
          respuesta_correcta: p.respuesta_correcta || ''
        })),
        respuestas_agregadas: respuestasAgregadas,
        metricas: {
          participacion,
          promedio
        }
      }
    });

    if (error) {
      console.error('Error calling generate-recomendaciones:', error);
      throw new Error(error.message || 'Error al procesar respuestas');
    }

    return aiResult as ProcessQuizResult;
  } catch (error) {
    console.error('Error in processQuizResponses:', error);
    // Return a fallback result if AI fails
    return {
      analisis_general: {
        participacion: 0,
        promedio_grupo: 0,
        nivel_preparacion: 'bajo',
        resumen: 'No se pudo generar el análisis automático.'
      },
      conceptos_debiles: [],
      recomendaciones: [{
        titulo: 'Revisión manual requerida',
        contenido: 'El análisis automático no pudo completarse. Revise las respuestas manualmente.',
        tipo: 'seguimiento',
        prioridad: 'alta',
        momento: tipo === 'previo' ? 'durante_clase' : 'proxima_sesion',
        concepto_relacionado: 'General'
      }],
      alertas: ['Error al procesar las recomendaciones con IA']
    };
  }
}

/**
 * Generates personalized feedback for students
 * 
 * @param respuestas - Student quiz responses
 * @param tipo - 'individual' or 'grupal'
 * @param nombreAlumno - Student name (for individual feedback)
 * @returns Generated feedback data
 */
export async function generateRetroalimentaciones(
  respuestas: Array<{
    id_alumno: string;
    nombre?: string;
    respuestas_detalle: Array<{
      id_pregunta: string;
      respuesta_alumno: string;
      es_correcta: boolean;
      tiempo_segundos?: number;
    }>;
    puntaje_total?: number;
  }>,
  tipo: 'individual' | 'grupal',
  nombreAlumno?: string
): Promise<RetroalimentacionData> {
  // TODO: Replace with actual AI API call
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

  if (tipo === 'individual' && respuestas.length > 0) {
    const respuesta = respuestas[0];
    const correctas = respuesta.respuestas_detalle.filter(r => r.es_correcta).length;
    const total = respuesta.respuestas_detalle.length;
    const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

    const fortalezas: string[] = [];
    const areas_mejora: string[] = [];
    const recomendaciones: string[] = [];

    if (porcentaje >= 80) {
      fortalezas.push('Excelente comprensión de los conceptos principales');
      fortalezas.push('Buen dominio de la aplicación práctica');
      recomendaciones.push('Continúa practicando con ejercicios más complejos');
    } else if (porcentaje >= 60) {
      fortalezas.push('Comprensión básica de los conceptos');
      areas_mejora.push('Necesitas reforzar algunos conceptos específicos');
      recomendaciones.push('Revisa los temas donde tuviste dificultades');
      recomendaciones.push('Practica con ejercicios similares');
    } else {
      areas_mejora.push('Requieres refuerzo en los conceptos fundamentales');
      areas_mejora.push('Necesitas más práctica con ejercicios básicos');
      recomendaciones.push('Revisa el material de la clase nuevamente');
      recomendaciones.push('Consulta con tu profesor sobre los conceptos que no comprendiste');
      recomendaciones.push('Dedica tiempo adicional al estudio de estos temas');
    }

    return {
      contenido: `${nombreAlumno || 'Estudiante'}, has obtenido un ${porcentaje}% de aciertos. ${porcentaje >= 80 ? '¡Felicitaciones por tu excelente desempeño!' : 'Hay áreas de mejora que puedes trabajar.'}`,
      fortalezas,
      areas_mejora,
      recomendaciones,
      tipo: 'individual'
    };
  } else {
    // Grupal feedback
    const totalAlumnos = respuestas.length;
    const promedios = respuestas
      .map(r => r.puntaje_total || 0)
      .filter(p => p > 0);
    const promedioGrupal = promedios.length > 0
      ? Math.round(promedios.reduce((a, b) => a + b, 0) / promedios.length)
      : 0;

    const fortalezas: string[] = [];
    const areas_mejora: string[] = [];
    const recomendaciones: string[] = [];

    if (promedioGrupal >= 80) {
      fortalezas.push('El grupo demostró excelente comprensión del tema');
      fortalezas.push('Buena participación y compromiso general');
      recomendaciones.push('Pueden avanzar a conceptos más complejos');
    } else if (promedioGrupal >= 60) {
      fortalezas.push('El grupo tiene una base sólida de conocimientos');
      areas_mejora.push('Algunos estudiantes necesitan refuerzo adicional');
      recomendaciones.push('Organizar sesiones de apoyo para quienes lo necesiten');
      recomendaciones.push('Revisar los conceptos con menor dominio');
    } else {
      areas_mejora.push('El grupo requiere refuerzo en los conceptos fundamentales');
      areas_mejora.push('Necesitan más práctica con ejercicios básicos');
      recomendaciones.push('Realizar una sesión de repaso general');
      recomendaciones.push('Adaptar el ritmo de enseñanza');
      recomendaciones.push('Proporcionar material de apoyo adicional');
    }

    return {
      contenido: `El grupo obtuvo un promedio de ${promedioGrupal}% de aciertos. ${promedioGrupal >= 80 ? '¡Excelente trabajo en equipo!' : 'Hay oportunidades de mejora que podemos trabajar juntos.'}`,
      fortalezas,
      areas_mejora,
      recomendaciones,
      tipo: 'grupal'
    };
  }
}

// ============================================================================
// GUÍA MAESTRA (Tema Level)
// ============================================================================

export interface ClaseEstructura {
  numero: number;
  nombre: string;
  descripcion: string;
  duracion_sugerida: number; // minutos
}

export interface GuiaMaestraData {
  objetivos_generales: string;
  estructura_sesiones: ClaseEstructura[];
  recursos_recomendados: string[];
  metodologias: string[];
  estrategias_evaluacion: string[];
  actividades_transversales: string[];
  competencias: string[];
}

export interface GenerateGuiaMaestraInput {
  tema: {
    nombre: string;
    descripcion?: string;
    objetivos?: string;
    duracion_estimada?: number;
  };
  curso: {
    nombre: string;
    grado: string;
  };
  contextoGrupo: string;
  metodologiasPreferidas: string[];
  totalClases: number;
}

/**
 * Generates a complete master guide (Guía Maestra) for a topic using AI
 * 
 * @param input - Topic, course, context and preferences
 * @returns Generated master guide data with objectives, class structure, resources, etc.
 */
export async function generateGuiaMaestra(
  input: GenerateGuiaMaestraInput
): Promise<GuiaMaestraData> {
  // TODO: Replace with actual AI API call
  
  await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate API delay

  const { tema, curso, contextoGrupo, metodologiasPreferidas, totalClases } = input;

  // Generate objectives based on topic
  const objetivos_generales = `Al finalizar el tema, los estudiantes serán capaces de ${tema.objetivos || `comprender, aplicar y analizar los conceptos fundamentales de ${tema.nombre}`}. Se busca desarrollar el pensamiento crítico y la capacidad de resolver problemas relacionados con ${tema.nombre} en contextos reales y significativos para estudiantes de ${curso.grado}.`;

  // Generate class structure based on totalClases
  const estructura_sesiones: ClaseEstructura[] = [];
  
  // Define typical class progression patterns
  const clasesPatrones = [
    { tipo: 'introduccion', prefijo: 'Explorando', sufijo: 'conceptos básicos' },
    { tipo: 'desarrollo', prefijo: 'Práctica de', sufijo: 'con ejercicios' },
    { tipo: 'profundizacion', prefijo: 'Profundizando en', sufijo: 'y casos especiales' },
    { tipo: 'aplicacion', prefijo: 'Aplicando', sufijo: 'en situaciones reales' },
    { tipo: 'integracion', prefijo: 'Integrando', sufijo: 'con otros conceptos' },
    { tipo: 'evaluacion', prefijo: 'Evaluación y repaso:', sufijo: '' },
  ];

  for (let i = 1; i <= totalClases; i++) {
    const patronIndex = Math.min(i - 1, clasesPatrones.length - 1);
    const patron = clasesPatrones[patronIndex % clasesPatrones.length];
    
    let nombre: string;
    let descripcion: string;
    
    if (i === 1) {
      nombre = `Introducción a ${tema.nombre}`;
      descripcion = `Presentación del tema y activación de conocimientos previos. Exploración inicial de ${tema.nombre} mediante preguntas guiadas y ejemplos contextualizados.`;
    } else if (i === totalClases) {
      nombre = `Evaluación y consolidación: ${tema.nombre}`;
      descripcion = `Repaso general de los conceptos trabajados. Evaluación formativa y juego interactivo para consolidar los aprendizajes.`;
    } else {
      nombre = `${patron.prefijo} ${tema.nombre.split(' ').slice(0, 3).join(' ')} ${patron.sufijo}`.trim();
      descripcion = `Desarrollo de actividades prácticas relacionadas con ${tema.nombre}. ${
        metodologiasPreferidas.includes('colaborativo') 
          ? 'Trabajo en equipos pequeños.' 
          : 'Práctica individual guiada.'
      } Uso de materiales concretos y recursos visuales.`;
    }

    estructura_sesiones.push({
      numero: i,
      nombre,
      descripcion,
      duracion_sugerida: 60
    });
  }

  // Generate resources based on topic and grade
  const recursos_recomendados = [
    `Material concreto (manipulativos relacionados con ${tema.nombre})`,
    'Tarjetas didácticas con ejemplos visuales',
    `Fichas de trabajo con ejercicios graduados`,
    'Videos educativos cortos sobre el tema',
    'Aplicaciones y juegos interactivos (Gamificación)',
    'Recursos digitales para pizarra interactiva',
    'Material para trabajo colaborativo',
    `Guías de evaluación formativa`
  ];

  // Map methodology IDs to full names
  const metodologiasNombres: Record<string, string> = {
    'socratico': 'Método Socrático',
    'casos': 'Aprendizaje basado en casos',
    'problemas': 'Aprendizaje basado en problemas',
    'colaborativo': 'Aprendizaje colaborativo',
    'reflexivo': 'Pensamiento reflexivo',
    'flipped': 'Clase Invertida (Flipped Classroom)',
    'gamificacion': 'Gamificación',
    'descubrimiento': 'Aprendizaje por Descubrimiento'
  };

  const metodologias = metodologiasPreferidas.length > 0
    ? metodologiasPreferidas.map(m => metodologiasNombres[m] || m)
    : ['Aprendizaje activo', 'Trabajo colaborativo', 'Evaluación formativa'];

  // Generate evaluation strategies
  const estrategias_evaluacion = [
    'Observación directa de la participación y manipulación de materiales durante las actividades.',
    'Registro de avances en fichas de trabajo individuales.',
    'Evaluaciones formativas mediante juegos y actividades interactivas.',
    'Resolución de problemas de aplicación contextualizada.',
    'Portafolio de evidencias con trabajos seleccionados.',
    'Rúbricas de evaluación para habilidades de comunicación y razonamiento.',
    'Quizzes interactivos cortos (evaluación diagnóstica y sumativa).'
  ];

  // Generate cross-curricular activities
  const actividades_transversales = [
    `Conexión con lectura: Cuentos o textos relacionados con ${tema.nombre}.`,
    'Proyecto integrador con otras áreas del conocimiento.',
    'Actividades de expresión artística relacionadas con el tema.',
    'Juegos de mesa educativos que refuercen los conceptos.',
    'Vinculación con situaciones de la vida cotidiana.',
    'Trabajo con tecnología: uso de apps educativas.',
    'Actividades de comunicación oral: exposiciones breves.'
  ];

  // Generate competencies
  const competencias = [
    `Comprende y aplica conceptos de ${tema.nombre}.`,
    'Comunica su comprensión sobre los conceptos trabajados.',
    'Usa estrategias y procedimientos para resolver problemas.',
    'Argumenta afirmaciones sobre las relaciones y operaciones.',
    'Desarrolla pensamiento crítico y reflexivo.'
  ];

  return {
    objetivos_generales,
    estructura_sesiones,
    recursos_recomendados,
    metodologias,
    estrategias_evaluacion,
    actividades_transversales,
    competencias
  };
}

