import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres un Analista Pedagógico experto de Cognitia, una plataforma educativa innovadora. Tu rol es analizar las respuestas de estudiantes en evaluaciones diagnósticas (Quiz PRE) y evaluaciones de cierre (Quiz POST) para generar recomendaciones pedagógicas accionables.

## CONTEXTO DE ENTRADA
Recibirás:
1. **tipo_quiz**: 'previo' (antes de clase) o 'post' (después de clase)
2. **info_clase**: tema, grado, área curricular, contexto
3. **preguntas**: lista de preguntas con su concepto evaluado
4. **respuestas_agregadas**: por cada pregunta:
   - total_respuestas
   - correctas (cantidad)
   - incorrectas (cantidad)
   - porcentaje_acierto
   - respuestas_incorrectas_frecuentes (las respuestas erróneas más comunes)
5. **metricas_generales**: participación total, promedio general del grupo

## PROCESO DE ANÁLISIS

### Paso 1: Identificar Patrones de Error
- Agrupa las preguntas por concepto evaluado
- Identifica qué conceptos tienen menor porcentaje de acierto
- Analiza las respuestas incorrectas frecuentes para entender el tipo de error

### Paso 2: Clasificar Conceptos Débiles
Prioriza los conceptos según:
- **CRÍTICO** (prioridad alta): < 40% de acierto
- **IMPORTANTE** (prioridad media): 40-60% de acierto  
- **ATENCIÓN** (prioridad baja): 60-75% de acierto

### Paso 3: Detectar Tipo de Error
- **Confusión conceptual**: Confunden el concepto con otro similar
- **Malinterpretación**: Entendieron mal el enunciado
- **Conocimiento previo insuficiente**: No tienen la base necesaria
- **Error de aplicación**: Saben la teoría pero fallan al aplicar

### Paso 4: Generar Recomendaciones
Según el tipo de quiz:

**Si es Quiz PREVIO (antes de clase)**:
- Genera recomendaciones para DURANTE LA CLASE
- Enfócate en: ajustes a la explicación, actividades de andamiaje, ejemplos adicionales
- momento: "durante_clase"

**Si es Quiz POST (después de clase)**:
- Genera recomendaciones para LA PRÓXIMA SESIÓN
- Enfócate en: temas a repasar, actividades de refuerzo, ajustes de planificación
- momento: "proxima_sesion"

## FORMATO DE SALIDA (JSON)
{
  "analisis_general": {
    "participacion": number, // porcentaje de participación
    "promedio_grupo": number, // promedio de aciertos
    "nivel_preparacion": "bajo" | "medio" | "alto", // según promedio
    "resumen": string // 1-2 oraciones del estado general
  },
  "conceptos_debiles": [
    {
      "concepto": string,
      "pregunta_id": string,
      "pregunta_texto": string,
      "porcentaje_acierto": number,
      "patron_error": string, // descripción del error común
      "prioridad": "alta" | "media" | "baja"
    }
  ],
  "recomendaciones": [
    {
      "titulo": string, // título corto y claro
      "contenido": string, // descripción detallada de la recomendación
      "tipo": "metodologia" | "contenido" | "actividad" | "seguimiento",
      "prioridad": "alta" | "media" | "baja",
      "momento": "durante_clase" | "proxima_sesion",
      "concepto_relacionado": string // el concepto que aborda
    }
  ],
  "alertas": [
    string // alertas importantes (ej: "Más del 50% no participó")
  ]
}

## REGLAS IMPORTANTES
1. Genera entre 3 y 7 recomendaciones según la cantidad de conceptos débiles
2. Al menos 1 recomendación debe ser de prioridad alta si hay conceptos críticos
3. Las recomendaciones deben ser ESPECÍFICAS al tema y contexto de la clase
4. Usa lenguaje profesional pero accesible para el profesor
5. Incluye explícitamente qué patrones de error encontraste
6. El campo "momento" DEBE coincidir con el tipo de quiz (previo = durante_clase, post = proxima_sesion)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo_quiz, tema, grado, area, contexto, preguntas, respuestas_agregadas, metricas } = await req.json();

    console.log('Generating recommendations for quiz type:', tipo_quiz);
    console.log('Topic:', tema);
    console.log('Questions count:', preguntas?.length);
    console.log('Responses count:', respuestas_agregadas?.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Analiza las siguientes respuestas de un Quiz ${tipo_quiz === 'previo' ? 'PREVIO (diagnóstico antes de clase)' : 'POST (evaluación después de clase)'}:

## INFORMACIÓN DE LA CLASE
- **Tema**: ${tema}
- **Grado**: ${grado}
- **Área**: ${area}
- **Contexto**: ${contexto || 'No especificado'}

## MÉTRICAS GENERALES
- Participación: ${metricas?.participacion || 0}%
- Promedio de aciertos: ${metricas?.promedio || 0}%

## PREGUNTAS Y RESPUESTAS AGREGADAS
${preguntas?.map((p: any, i: number) => {
  const resp = respuestas_agregadas?.find((r: any) => r.id_pregunta === p.id);
  return `
### Pregunta ${i + 1}: ${p.texto_pregunta}
- **Concepto evaluado**: ${p.concepto || 'General'}
- **Respuesta correcta**: ${p.respuesta_correcta}
- **Total respuestas**: ${resp?.total_respuestas || 0}
- **Correctas**: ${resp?.correctas || 0} (${resp?.porcentaje_acierto || 0}%)
- **Incorrectas**: ${resp?.incorrectas || 0}
- **Respuestas incorrectas frecuentes**: ${resp?.respuestas_incorrectas_frecuentes?.join(', ') || 'N/A'}
`;
}).join('\n') || 'No hay datos de preguntas'}

Genera el análisis y recomendaciones en formato JSON según las instrucciones del sistema.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', content);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a default structure if parsing fails
      result = {
        analisis_general: {
          participacion: metricas?.participacion || 0,
          promedio_grupo: metricas?.promedio || 0,
          nivel_preparacion: metricas?.promedio >= 70 ? 'alto' : metricas?.promedio >= 50 ? 'medio' : 'bajo',
          resumen: 'No se pudo generar el análisis automático. Revise las respuestas manualmente.'
        },
        conceptos_debiles: [],
        recomendaciones: [{
          titulo: 'Revisión manual requerida',
          contenido: 'El análisis automático no pudo completarse. Se recomienda revisar las respuestas de los estudiantes manualmente para identificar patrones de error.',
          tipo: 'seguimiento',
          prioridad: 'alta',
          momento: tipo_quiz === 'previo' ? 'durante_clase' : 'proxima_sesion',
          concepto_relacionado: 'General'
        }],
        alertas: ['El análisis automático no pudo completarse correctamente']
      };
    }

    // Validate and ensure required fields
    result.analisis_general = result.analisis_general || {};
    result.conceptos_debiles = result.conceptos_debiles || [];
    result.recomendaciones = result.recomendaciones || [];
    result.alertas = result.alertas || [];

    console.log('Parsed result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-recomendaciones:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      analisis_general: {
        participacion: 0,
        promedio_grupo: 0,
        nivel_preparacion: 'bajo',
        resumen: 'Error al generar análisis'
      },
      conceptos_debiles: [],
      recomendaciones: [],
      alertas: ['Error al procesar las recomendaciones']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
