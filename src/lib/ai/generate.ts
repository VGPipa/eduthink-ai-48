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

export interface GuiaClaseData {
  objetivos: string[];
  estructura: Array<{
    tiempo: string;
    actividad: string;
    descripcion: string;
  }>;
  preguntasSocraticas: string[];
  recursos?: string[];
  adaptaciones?: string[];
  // Additional CNEB data from AI
  situacionSignificativa?: string;
  competencia?: string;
  desempeno?: string;
  enfoqueTransversal?: string;
  habilidadesSigloXXI?: string[];
  evaluacion?: {
    evidencias: string[];
    criterios: string[];
    instrumento: string;
  };
}

export interface GenerateGuiaClaseInput {
  tema: string;
  contexto: string;
  metodologias: string[];
  objetivo: string;
  recursos?: string[];
  adaptaciones?: string[];
  // Additional context data
  grado?: string;
  seccion?: string;
  numeroEstudiantes?: number;
  duracion?: number;
  area?: string;
}

export interface QuizQuestion {
  tipo: 'conocimiento' | 'aplicacion' | 'analisis' | 'razonamiento' | 'evaluacion';
  texto: string;
  texto_contexto?: string;
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

export interface RecomendacionData {
  contenido: string;
  tipo: 'refuerzo' | 'adaptacion' | 'metodologia';
  prioridad: 'alta' | 'media' | 'baja';
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
    texto_contexto?: string;
  }>;
}

/**
 * Generates a class guide using AI via Supabase Edge Function
 * 
 * @param tema - Topic name
 * @param contexto - Context about the class/group
 * @param metodologias - Teaching methodologies to use
 * @param objetivo - Specific objective for this session
 * @param recursos - Available resources
 * @param adaptaciones - Special adaptations needed
 * @param additionalData - Optional additional context (grado, seccion, etc.)
 * @returns Generated guide data aligned with CNEB
 */
export async function generateGuiaClase(
  tema: string,
  contexto: string,
  metodologias: string[],
  objetivo: string,
  recursos?: string[],
  adaptaciones?: string[],
  additionalData?: {
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
        metodologias,
        objetivo,
        recursos: recursos || [],
        adaptaciones: adaptaciones || [],
        grado: additionalData?.grado,
        seccion: additionalData?.seccion,
        numeroEstudiantes: additionalData?.numeroEstudiantes,
        duracion: additionalData?.duracion,
        area: additionalData?.area
      }
    });

    if (error) {
      console.error('Error calling generate-guia-clase:', error);
      throw new Error(error.message || 'Error al generar la guía');
    }

    return data as GuiaClaseData;
  } catch (error) {
    console.error('Error in generateGuiaClase:', error);
    // Fallback to mock data if Edge Function fails
    return generateGuiaClaseMock(tema, contexto, metodologias, objetivo, recursos, adaptaciones);
  }
}

/**
 * Fallback mock implementation for when Edge Function is unavailable
 */
function generateGuiaClaseMock(
  tema: string,
  contexto: string,
  metodologias: string[],
  objetivo: string,
  recursos?: string[],
  adaptaciones?: string[]
): GuiaClaseData {
  const objetivos = [
    objetivo || `Comprender los conceptos fundamentales de ${tema}`,
    `Aplicar conocimientos de ${tema} en situaciones prácticas`,
    'Desarrollar pensamiento crítico mediante análisis y reflexión'
  ];

  const estructura = [
    {
      tiempo: '10 min',
      actividad: 'Inicio - Motivación',
      descripcion: `Activación de conocimientos previos sobre ${tema} mediante preguntas socráticas y presentación de la situación significativa`
    },
    {
      tiempo: '25 min',
      actividad: 'Desarrollo - Exploración',
      descripcion: `Explicación de conceptos clave de ${tema} con ejemplos prácticos y trabajo guiado`
    },
    {
      tiempo: '15 min',
      actividad: 'Desarrollo - Práctica',
      descripcion: metodologias.includes('colaborativo') 
        ? `Resolución de ejercicios en grupos pequeños sobre ${tema}`
        : `Resolución de ejercicios individuales sobre ${tema}`
    },
    {
      tiempo: '5 min',
      actividad: 'Cierre - Metacognición',
      descripcion: 'Reflexión metacognitiva, preguntas de verificación y conexión con la próxima sesión'
    }
  ];

  const preguntasSocraticas = [
    `¿Qué patrones observas en los ejemplos de ${tema}?`,
    `¿Cómo podrías verificar si tu respuesta es correcta?`,
    `¿En qué situaciones de la vida real podrías aplicar este conocimiento sobre ${tema}?`,
    `¿Qué preguntas te surgen después de trabajar con ${tema}?`
  ];

  return {
    objetivos,
    estructura,
    preguntasSocraticas,
    recursos: recursos || [],
    adaptaciones: adaptaciones || [],
    situacionSignificativa: `[MOCK] Reto relacionado con ${tema} que conecta con la vida del estudiante`,
    competencia: '[MOCK] Competencia del área curricular',
    desempeno: '[MOCK] Desempeño específico del grado',
    enfoqueTransversal: 'Enfoque de búsqueda de la excelencia',
    habilidadesSigloXXI: ['Pensamiento crítico', 'Creatividad', 'Colaboración'],
    evaluacion: {
      evidencias: ['Participación activa', 'Resolución de ejercicios', 'Reflexión escrita'],
      criterios: ['Identifica conceptos clave', 'Aplica procedimientos', 'Argumenta sus respuestas'],
      instrumento: 'Lista de cotejo'
    }
  };
}

/**
 * Generates quiz questions (PRE or POST) using AI
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
  // TODO: Replace with actual AI API call
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

  const titulo = tipo === 'previo' 
    ? `Evaluación Diagnóstica: ${tema}`
    : `Evaluación Final: ${tema}`;

  const instrucciones = tipo === 'previo'
    ? 'Responde las siguientes preguntas para evaluar tus conocimientos previos sobre el tema.'
    : 'Responde las siguientes preguntas para evaluar tu comprensión del tema después de la clase.';

  const preguntas: QuizQuestion[] = [];

  if (tipo === 'previo') {
    // PRE quiz: Focus on prior knowledge
    preguntas.push(
      {
        tipo: 'conocimiento',
        texto: `¿Cuál es la definición básica de ${tema}?`,
        texto_contexto: `Concepto: ${tema}`,
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        respuesta_correcta: 'Opción B',
        justificacion: `La definición correcta de ${tema} es fundamental para comprender el tema.`,
        orden: 1
      },
      {
        tipo: 'conocimiento',
        texto: `¿Qué elementos caracterizan a ${tema}?`,
        texto_contexto: `Concepto: ${tema}`,
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        respuesta_correcta: 'Opción C',
        justificacion: `Los elementos característicos son esenciales para identificar ${tema}.`,
        orden: 2
      },
      {
        tipo: 'razonamiento',
        texto: `Si no conoces ${tema}, ¿qué podrías inferir sobre su importancia?`,
        texto_contexto: `Concepto: ${tema}`,
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        respuesta_correcta: 'Opción A',
        justificacion: `El razonamiento sobre la importancia ayuda a contextualizar el aprendizaje.`,
        orden: 3
      },
      {
        tipo: 'conocimiento',
        texto: `¿Qué relación tiene ${tema} con otros conceptos que ya conoces?`,
        texto_contexto: `Concepto: ${tema}`,
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        respuesta_correcta: 'Opción B',
        justificacion: `Establecer conexiones facilita el aprendizaje significativo.`,
        orden: 4
      },
      {
        tipo: 'razonamiento',
        texto: `¿Qué preguntas te surgen sobre ${tema} antes de estudiarlo?`,
        texto_contexto: `Concepto: ${tema}`,
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        respuesta_correcta: 'Opción D',
        justificacion: `La curiosidad es fundamental para el aprendizaje activo.`,
        orden: 5
      }
    );
  } else {
    // POST quiz: Focus on application and analysis
    for (let i = 1; i <= cantidad; i++) {
      const tipos = ['aplicacion', 'analisis', 'razonamiento', 'evaluacion'] as const;
      const tipoPregunta = tipos[(i - 1) % tipos.length];
      
      preguntas.push({
        tipo: tipoPregunta,
        texto: `Pregunta ${i} sobre ${tema}: Aplica los conceptos aprendidos para resolver este problema.`,
        texto_contexto: `Concepto: ${tema}`,
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        respuesta_correcta: 'Opción B',
        justificacion: `Esta respuesta demuestra comprensión adecuada de ${tema}.`,
        orden: i
      });
    }
  }

  return {
    titulo,
    instrucciones,
    preguntas
  };
}

/**
 * Processes quiz responses and generates recommendations
 * 
 * @param data - Quiz response data including student answers
 * @param tipo - 'previo' or 'post'
 * @returns Recommendations and metrics
 */
export async function processQuizResponses(
  data: ProcessQuizResponseData,
  tipo: 'previo' | 'post'
): Promise<{
  recomendaciones: RecomendacionData[];
  metricas: {
    participacion: number;
    promedio: number;
    conceptosDebiles: Array<{ concepto: string; porcentajeAcierto: number }>;
  };
}> {
  // TODO: Replace with actual AI API call
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

  const totalAlumnos = data.respuestas.length;
  const respuestasCompletas = data.respuestas.filter(r => 
    r.respuestas_detalle.length > 0
  );
  const participacion = totalAlumnos > 0 
    ? Math.round((respuestasCompletas.length / totalAlumnos) * 100)
    : 0;

  // Calculate average score
  let totalCorrectas = 0;
  let totalPreguntas = 0;
  const conceptosStats = new Map<string, { correctas: number; total: number }>();

  respuestasCompletas.forEach(respuesta => {
    respuesta.respuestas_detalle.forEach(detalle => {
      totalPreguntas++;
      if (detalle.es_correcta) totalCorrectas++;

      // Find question context
      const pregunta = data.preguntas.find(p => p.id === detalle.id_pregunta);
      if (pregunta?.texto_contexto) {
        const concepto = pregunta.texto_contexto.replace('Concepto: ', '').trim();
        const stats = conceptosStats.get(concepto) || { correctas: 0, total: 0 };
        stats.total++;
        if (detalle.es_correcta) stats.correctas++;
        conceptosStats.set(concepto, stats);
      }
    });
  });

  const promedio = totalPreguntas > 0
    ? Math.round((totalCorrectas / totalPreguntas) * 100)
    : 0;

  // Identify weak concepts
  const conceptosDebiles = Array.from(conceptosStats.entries())
    .map(([concepto, stats]) => ({
      concepto,
      porcentajeAcierto: Math.round((stats.correctas / stats.total) * 100)
    }))
    .filter(c => c.porcentajeAcierto < 70)
    .sort((a, b) => a.porcentajeAcierto - b.porcentajeAcierto)
    .slice(0, 5);

  // Generate recommendations
  const recomendaciones: RecomendacionData[] = [];

  if (tipo === 'previo') {
    if (promedio < 50) {
      recomendaciones.push({
        contenido: `El nivel de preparación previa es bajo (${promedio}%). Se recomienda comenzar con conceptos básicos y realizar una introducción más detallada.`,
        tipo: 'refuerzo',
        prioridad: 'alta'
      });
    }

    if (participacion < 80) {
      recomendaciones.push({
        contenido: `La participación en el quiz previo es del ${participacion}%. Considera recordar a los estudiantes la importancia de completar la evaluación.`,
        tipo: 'metodologia',
        prioridad: 'media'
      });
    }

    conceptosDebiles.forEach(concepto => {
      recomendaciones.push({
        contenido: `El concepto "${concepto.concepto}" muestra bajo dominio (${concepto.porcentajeAcierto}% de aciertos). Se recomienda dedicar tiempo adicional en la explicación.`,
        tipo: 'refuerzo',
        prioridad: concepto.porcentajeAcierto < 40 ? 'alta' : 'media'
      });
    });
  } else {
    // POST quiz recommendations
    if (promedio < 70) {
      recomendaciones.push({
        contenido: `El promedio de aciertos es ${promedio}%, lo que indica que algunos conceptos necesitan refuerzo. Considera realizar una sesión de repaso.`,
        tipo: 'refuerzo',
        prioridad: 'alta'
      });
    }

    conceptosDebiles.forEach(concepto => {
      recomendaciones.push({
        contenido: `El concepto "${concepto.concepto}" requiere atención adicional (${concepto.porcentajeAcierto}% de aciertos). Planifica actividades de refuerzo.`,
        tipo: 'refuerzo',
        prioridad: 'media'
      });
    });
  }

  return {
    recomendaciones,
    metricas: {
      participacion,
      promedio,
      conceptosDebiles
    }
  };
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

