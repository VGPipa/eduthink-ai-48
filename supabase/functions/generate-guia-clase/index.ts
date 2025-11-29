import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres el "Arquitecto Pedagógico" de Cognitia, una IA experta en diseñar experiencias de aprendizaje transformadoras para escuelas peruanas. Tu misión es generar una guía de clase en formato JSON estricto, alineada al Currículo Nacional de la Educación Básica (CNEB) y enfocada en dos pilares: Habilidades Cognitivas (Mente) y Habilidades Humanas (Corazón).

### 1. FILOSOFÍA PEDAGÓGICA (MANDATORIO)
No diseñas clases tradicionales. Diseñas experiencias basadas en la indagación y el aprendizaje socioemocional.
Tu estructura interna de pensamiento para la secuencia didáctica debe ser:
A. INICIO (Conexión): No es solo llamar lista. Es conectar el tema con una emoción o valor humano.
B. DESARROLLO (Provocación + Construcción): Presentar un desafío complejo (Cognitivo) y resolverlo colaborativamente (Humano).
C. CIERRE (Metacognición): Reflexión sobre el proceso de aprendizaje y transferencia a la vida real.

### 2. MARCO DE HABILIDADES (CNEB + SIGLO XXI)
Debes seleccionar explícitamente una habilidad de cada categoría para la sesión:
- COGNITIVAS (Future Skills): Pensamiento Crítico, Resolución de Problemas Complejos, Alfabetización de Datos, Pensamiento Sistémico.
- HUMANAS (Soft Skills): Empatía, Colaboración Radical, Ética, Resiliencia, Comunicación Asertiva.
- CNEB: Debes citar Competencia, Capacidad y Desempeño precisos del área curricular.

### 3. REGLAS DE GENERACIÓN
- Si falta información (ej. grado), infiere lo más adecuado para Secundaria (Ciclo VI/VII) y márcalo como [INFERIDO].
- La "Situación Significativa" debe ser un problema del mundo real, relevante para un adolescente peruano.
- El formato de salida debe ser ÚNICAMENTE un objeto JSON válido. No incluyas texto antes ni después del JSON.

### 4. ESTRUCTURA DEL JSON (SCHEMA)
Debes responder siguiendo exactamente esta estructura:
{
  "metadata": {
    "titulo": "String creativo y atractivo",
    "resumen": "Breve descripción de la clase en 1 frase",
    "duracion": "Integer (minutos)",
    "grado_sugerido": "String"
  },
  "curriculo_peru": {
    "area": "String",
    "competencia": "String (CNEB)",
    "capacidad": "String (CNEB)",
    "desempeno_precisado": "String (Adaptado del CNEB)",
    "enfoque_transversal": "String (Valores y actitudes)"
  },
  "objetivos_aprendizaje": {
    "cognitivo": "String (Lo que resolverán mentalmente)",
    "humano": "String (Cómo interactuarán social/emocionalmente)"
  },
  "secuencia_didactica": [
    {
      "fase": "INICIO",
      "subtitulo": "Conexión y Propósito",
      "tiempo": "String (ej. 15 min)",
      "actividad_detallada": "String (Instrucciones paso a paso para el docente)",
      "habilidad_foco": "String",
      "rol_docente": "String (ej. Motivador, Observador)"
    },
    {
      "fase": "DESARROLLO",
      "subtitulo": "Provocación y Construcción",
      "tiempo": "String (ej. 50 min)",
      "actividad_detallada": "String (El reto central y la dinámica de trabajo)",
      "habilidad_foco": "String",
      "rol_docente": "String (ej. Mentor Socrático)"
    },
    {
      "fase": "CIERRE",
      "subtitulo": "Metacognición",
      "tiempo": "String (ej. 15 min)",
      "actividad_detallada": "String (Dinámica de reflexión final)",
      "habilidad_foco": "String",
      "rol_docente": "String (ej. Facilitador)"
    }
  ],
  "recursos_y_evaluacion": {
    "materiales_necesarios": ["String", "String"],
    "criterios_evaluacion": ["String", "String"],
    "instrumento_sugerido": "String (ej. Rúbrica Holística, Lista de Cotejo)"
  },
  "tips_profesor": {
    "diferenciacion": "Consejo para alumnos con dificultades",
    "reto_extra": "Consejo para alumnos avanzados"
  }
}`;

interface GenerateGuiaRequest {
  tema: string;
  contexto: string;
  recursos: string[];
  grado?: string;
  seccion?: string;
  numeroEstudiantes?: number;
  duracion?: number;
  area?: string;
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
      recursos,
      grado,
      seccion,
      numeroEstudiantes,
      duracion,
      area
    }: GenerateGuiaRequest = await req.json();

    console.log("=== Generate Guía Request ===");
    console.log("Tema:", tema);
    console.log("Área:", area);
    console.log("Grado:", grado);
    console.log("Duración:", duracion);
    console.log("Recursos:", recursos);

    // Build the user prompt with all available data
    const userPrompt = `
DATOS DE LA SESIÓN:
- Tema: ${tema}
- Área Curricular: ${area || '[INFERIDO: según el tema]'}
- Grado: ${grado || '[INFERIDO: Secundaria]'}
- Sección: ${seccion || '[NO PROPORCIONADO]'}
- Número de estudiantes: ${numeroEstudiantes || '[NO PROPORCIONADO]'}
- Duración de la clase: ${duracion || 55} minutos
- Recursos disponibles: ${recursos?.length > 0 ? recursos.join(', ') : '[INFERIDO: recursos básicos de aula]'}

CONTEXTO DEL GRUPO:
${contexto || '[NO PROPORCIONADO - usar contexto general para adolescentes peruanos]'}

Genera la guía de clase completa en formato JSON según el schema especificado.`;

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
    let guiaData;
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
      
      guiaData = JSON.parse(jsonContent);
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      throw new Error("La respuesta de la IA no es un JSON válido");
    }

    // Ensure required fields exist with defaults based on new schema
    const guiaClase = {
      metadata: guiaData.metadata || {
        titulo: `Clase: ${tema}`,
        resumen: `Sesión sobre ${tema}`,
        duracion: duracion || 55,
        grado_sugerido: grado || "[INFERIDO]"
      },
      curriculo_peru: guiaData.curriculo_peru || {
        area: area || "[NO ESPECIFICADA]",
        competencia: "[POR DEFINIR]",
        capacidad: "[POR DEFINIR]",
        desempeno_precisado: "[POR DEFINIR]",
        enfoque_transversal: "[POR DEFINIR]"
      },
      objetivos_aprendizaje: guiaData.objetivos_aprendizaje || {
        cognitivo: `Comprender los conceptos fundamentales de ${tema}`,
        humano: "Desarrollar habilidades de colaboración durante la sesión"
      },
      secuencia_didactica: guiaData.secuencia_didactica || [
        {
          fase: "INICIO",
          subtitulo: "Conexión y Propósito",
          tiempo: "10 min",
          actividad_detallada: "Activación de conocimientos previos",
          habilidad_foco: "Pensamiento Crítico",
          rol_docente: "Motivador"
        },
        {
          fase: "DESARROLLO",
          subtitulo: "Provocación y Construcción",
          tiempo: "35 min",
          actividad_detallada: "Exploración y práctica del tema",
          habilidad_foco: "Resolución de Problemas",
          rol_docente: "Mentor Socrático"
        },
        {
          fase: "CIERRE",
          subtitulo: "Metacognición",
          tiempo: "10 min",
          actividad_detallada: "Reflexión y síntesis del aprendizaje",
          habilidad_foco: "Comunicación Asertiva",
          rol_docente: "Facilitador"
        }
      ],
      recursos_y_evaluacion: guiaData.recursos_y_evaluacion || {
        materiales_necesarios: recursos || [],
        criterios_evaluacion: ["Participación activa", "Comprensión de conceptos"],
        instrumento_sugerido: "Lista de Cotejo"
      },
      tips_profesor: guiaData.tips_profesor || {
        diferenciacion: "Proporcionar apoyo adicional con ejemplos concretos",
        reto_extra: "Plantear problemas más complejos para estudiantes avanzados"
      }
    };

    console.log("=== Guía generated successfully ===");

    return new Response(JSON.stringify(guiaClase), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-guia-clase:", error);
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
