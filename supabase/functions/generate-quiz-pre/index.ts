import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres el experto en Diseño Instruccional y Evaluación de Cognitia. Tu tarea es generar un recurso de "Micro-Learning" (Pre-Quiz) diseñado para activar conocimientos previos mediante una dinámica de Comprensión de Contenidos.

### FLUJO DE LA INTERACCIÓN:
El alumno se enfrentará a un "Estímulo de Aprendizaje" (un texto breve + una referencia visual) y luego deberá responder preguntas basadas EXCLUSIVAMENTE en esa información.

### INSTRUCCIONES DE GENERACIÓN:

1. EL ESTÍMULO (La Base Teórica):
   - Genera un párrafo explicativo (máximo 120 palabras) que sintetice la idea central o el concepto "básico" que el alumno DEBE saber antes de entrar a clase.
   - Basándote en el objetivo cognitivo y el desempeño CNEB proporcionados.
   - Genera un "Prompt de Imagen" detallado que describa una ilustración o diagrama que complementaría visualmente este texto.

2. LA EVALUACIÓN (3 Preguntas alineadas a conceptos de la clase):
   - Genera exactamente 3 preguntas de opción múltiple.
   - REGLA CRÍTICA: Cada pregunta debe evaluar UN CONCEPTO CLAVE DIFERENTE extraído de la actividad de desarrollo de la guía de clase.
   - El campo "concepto" debe ser conciso (2-4 palabras) y representar un concepto específico de la sesión.
   - Ejemplos de conceptos buenos: "Trayectoria parabólica", "Vector velocidad", "Ley de conservación", "Ecuación cuadrática".
   - NO uses conceptos genéricos como "Comprensión del tema" o el nombre del tema completo.
   - Las preguntas deben medir la COMPRENSIÓN del texto. El alumno debe sentir que si leyó con atención, tiene la respuesta.
   - Cada pregunta debe tener exactamente 3 opciones.
   - Cada pregunta debe tener feedback inmediato tanto para acierto como para error.

### FORMATO DE SALIDA (JSON SCHEMA):
Tu respuesta debe ser un único objeto JSON válido con esta estructura exacta:

{
  "estimulo_aprendizaje": {
    "titulo": "String (Corto y pegajoso, máximo 8 palabras)",
    "texto_contenido": "String (El párrafo teórico clave, claro y directo, máximo 120 palabras)",
    "descripcion_visual": "String (Prompt detallado para generar una imagen que refuerce el texto)",
    "tiempo_lectura_estimado": "String (ej: '2 minutos')"
  },
  "quiz_comprension": [
    {
      "pregunta": "String (La pregunta clara y directa)",
      "concepto": "String (Concepto específico de 2-4 palabras extraído de la actividad de desarrollo)",
      "opciones": [
        {"texto": "String", "es_correcta": true},
        {"texto": "String", "es_correcta": false},
        {"texto": "String", "es_correcta": false}
      ],
      "feedback_acierto": "String (Refuerzo positivo breve)",
      "feedback_error": "String (Explicación de por qué es incorrecto basada en el texto)"
    }
  ]
}

IMPORTANTE: El JSON debe ser válido. No incluyas texto antes ni después del JSON.`;

interface GenerateQuizPreRequest {
  tema: string;
  contexto: string;
  grado?: string;
  area?: string;
  guia_clase?: {
    objetivo_cognitivo?: string;
    objetivo_humano?: string;
    desempeno_cneb?: string;
    actividad_inicio?: string;
    actividad_desarrollo?: string;
    criterios_evaluacion?: string[];
    capacidad_cneb?: string;
    habilidad_foco?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tema, 
      contexto, 
      grado,
      area,
      guia_clase
    }: GenerateQuizPreRequest = await req.json();

    console.log("=== Generate Quiz PRE Request ===");
    console.log("Tema:", tema);
    console.log("Área:", area);
    console.log("Grado:", grado);
    console.log("Guía clase objetivos:", guia_clase?.objetivo_cognitivo);

    // Build the user prompt with all available data
    const userPrompt = `
DATOS DE LA SESIÓN:
- Tema: ${tema}
- Área Curricular: ${area || '[NO ESPECIFICADA]'}
- Grado: ${grado || '[NO ESPECIFICADO]'}

CONTEXTO DEL GRUPO:
${contexto || '[NO PROPORCIONADO]'}

${guia_clase ? `
INFORMACIÓN DE LA GUÍA DE CLASE:
- Objetivo Cognitivo: ${guia_clase.objetivo_cognitivo || '[NO DISPONIBLE]'}
- Objetivo Humano: ${guia_clase.objetivo_humano || '[NO DISPONIBLE]'}
- Desempeño CNEB: ${guia_clase.desempeno_cneb || '[NO DISPONIBLE]'}
- Capacidad CNEB: ${guia_clase.capacidad_cneb || '[NO DISPONIBLE]'}
- Actividad de Inicio: ${guia_clase.actividad_inicio || '[NO DISPONIBLE]'}

CONCEPTOS CLAVE DE LA CLASE (extraer de aquí los conceptos para cada pregunta):
- Actividad de Desarrollo: ${guia_clase.actividad_desarrollo || '[NO DISPONIBLE]'}
- Habilidad Foco: ${guia_clase.habilidad_foco || '[NO DISPONIBLE]'}
- Criterios de Evaluación: ${guia_clase.criterios_evaluacion?.join(', ') || '[NO DISPONIBLE]'}
` : ''}

INSTRUCCIÓN CRÍTICA: Cada una de las 3 preguntas debe evaluar un CONCEPTO ESPECÍFICO DIFERENTE extraído de la actividad de desarrollo. El campo "concepto" debe ser conciso (2-4 palabras) y representar un concepto clave de la sesión.

Genera el Pre-Quiz de Micro-Learning con el estímulo de aprendizaje y las 3 preguntas de comprensión según el schema especificado.`;

    console.log("User prompt built, calling Lovable AI...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.");
      }
      if (response.status === 402) {
        throw new Error("Se requiere agregar créditos. Contacta al administrador.");
      }
      
      throw new Error(`Error del servicio de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI Response received, parsing...");

    if (!content) {
      throw new Error("La IA no generó contenido");
    }

    // Parse the JSON response - handle markdown code blocks
    let quizData;
    try {
      // Remove markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.slice(7);
      } else if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith("```")) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();
      
      quizData = JSON.parse(jsonContent);
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      throw new Error("La respuesta de la IA no es un JSON válido");
    }

    // Validate and ensure required fields exist with defaults
    const resultado = {
      estimulo_aprendizaje: {
        titulo: quizData.estimulo_aprendizaje?.titulo || `Prepárate para: ${tema}`,
        texto_contenido: quizData.estimulo_aprendizaje?.texto_contenido || `Contenido introductorio sobre ${tema}`,
        descripcion_visual: quizData.estimulo_aprendizaje?.descripcion_visual || `Ilustración educativa sobre ${tema}`,
        tiempo_lectura_estimado: quizData.estimulo_aprendizaje?.tiempo_lectura_estimado || "2 minutos"
      },
      quiz_comprension: (quizData.quiz_comprension || []).map((q: any, index: number) => ({
        pregunta: q.pregunta || `Pregunta ${index + 1} sobre ${tema}`,
        concepto: q.concepto || tema,
        opciones: q.opciones || [
          { texto: "Opción A", es_correcta: true },
          { texto: "Opción B", es_correcta: false },
          { texto: "Opción C", es_correcta: false }
        ],
        feedback_acierto: q.feedback_acierto || "¡Correcto! Has comprendido bien el concepto.",
        feedback_error: q.feedback_error || "Revisa nuevamente el texto del estímulo para encontrar la respuesta."
      }))
    };

    // Ensure we have exactly 3 questions
    while (resultado.quiz_comprension.length < 3) {
      resultado.quiz_comprension.push({
        pregunta: `Pregunta ${resultado.quiz_comprension.length + 1} sobre ${tema}`,
        concepto: tema,
        opciones: [
          { texto: "Opción A", es_correcta: true },
          { texto: "Opción B", es_correcta: false },
          { texto: "Opción C", es_correcta: false }
        ],
        feedback_acierto: "¡Correcto!",
        feedback_error: "Revisa el texto del estímulo."
      });
    }

    console.log("=== Quiz PRE generated successfully ===");

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-quiz-pre:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
