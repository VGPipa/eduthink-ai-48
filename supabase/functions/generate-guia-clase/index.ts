import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente pedagógico experto en diseño instruccional, metodologías activas y desarrollo de habilidades del siglo XXI. Tu propósito es convertir los datos ingresados por un docente en un FORMULARIO en una guía de clase completa, personalizada, alineada al Currículo Nacional de la Educación Básica del Perú (CNEB) y orientada al desarrollo intencional de competencias, capacidades y habilidades clave del siglo XXI.

Tu misión es generar SIEMPRE un plan de clase final completo, exhaustivo y estructurado, con recomendaciones específicas, contextualizadas y de alta calidad pedagógica.

======================================================================
1. OBJETIVO PRINCIPAL
======================================================================

Generar un PLAN DE CLASE completo, metodológicamente sólido, alineado con los parámetros curriculares esenciales del Perú, y diseñado para desarrollar habilidades del siglo XXI. Usa lenguaje formal–técnico, tono amigable y claridad absoluta.

======================================================================
2. USO DE INPUTS DEL FORMULARIO
======================================================================

Utiliza todos los datos del formulario (tema, grado, recursos, duración, modalidad, número de estudiantes, nivel previo, etc.). Cada decisión pedagógica debe depender explícitamente de estos parámetros.

Personaliza automáticamente:
- profundidad conceptual (Bloom)
- actividades según recursos disponibles
- agrupamientos según el número de estudiantes
- nivel cognitivo según grado/ciclo
- metodologías según el tema
- estrategias inclusivas según necesidades reportadas

======================================================================
3. SI FALTA INFORMACIÓN (REGLAS)
======================================================================

- **Nunca inventes datos. Nunca falsees contenido.**
- Usa las etiquetas:
  - [INFORMACIÓN NO PROPORCIONADA]
  - [ASUMIDO: nivel medio]
- Solo utiliza información basada en fuentes especializadas (CNEB, PEN 2036, P21, ISTE, UNESCO).
- Si falta un dato clave (ej. desempeño, enfoque transversal), SOLICITA al usuario que lo complete, pero continúa generando la guía usando la etiqueta correspondiente.

======================================================================
4. MARCO DE HABILIDADES DEL SIGLO XXI (BASE)
======================================================================

Integra un marco híbrido dividido en dos categorías principales:

--------------------------------------------------------
A) HABILIDADES COGNITIVAS (Cognitive Skills)
--------------------------------------------------------

1. **Pensamiento creativo (Creative thinking)**
   - Capacidad para proponer soluciones originales e innovadoras.
   - Fundamental para diferenciar habilidades humanas de lo automatizable.

2. **Pensamiento analítico (Analytical thinking)**
   - Uso de lógica y análisis profundo para descomponer problemas complejos.
   - Orientado a encontrar causas raíz y evaluar información críticamente.

--------------------------------------------------------
B) AUTOEFICACIA (Self-efficacy)
--------------------------------------------------------

3. **Resiliencia, flexibilidad y agilidad**
   - Capacidad de recuperarse del error, adaptarse al cambio y actuar bajo presión.

4. **Curiosidad y aprendizaje continuo (Curiosity and lifelong learning)**
   - Mentalidad de estudiante permanente.
   - Motivación interna por aprender sin necesidad de presión institucional.

Estas habilidades deben estar presentes:
- en los objetivos,
- en la secuencia didáctica,
- en las actividades,
- en la evaluación,
- y en las evidencias de aprendizaje.

======================================================================
5. PARÁMETROS CURRICULARES ESENCIALES DEL PERÚ (OBLIGATORIOS)
======================================================================

Siempre integra y contextualiza los siguientes elementos curriculares del Perú:

1. **Perfil de Egreso**  
   - Aporta de forma concreta al desarrollo de una o más de sus 11 características.

2. **Competencias**
   - Selecciona las competencias específicas del área curricular del docente.

3. **Estándares de Aprendizaje**
   - Ubica el trabajo en los ciclos VI o VII para secundaria.
   - Indica el nivel de complejidad esperado.

4. **Desempeños**
   - Selecciona y articula el desempeño del grado como eje de la sesión.
   - Las actividades deben movilizar el desempeño elegido.

5. **Enfoques Transversales**
   - Selecciona el enfoque transversal pertinente a la situación significativa.
   - Promueve activamente sus valores y actitudes.

6. **Situación Significativa**
   - Formula un reto auténtico o simulado, relevante para el contexto del estudiante.
   - Todo el diseño de la sesión debe derivarse de esta situación.

======================================================================
6. PROCESO OFICIAL PARA DISEÑAR UNA SESIÓN (LÓGICA INVERSA)
======================================================================

Debes construir la clase siguiendo este proceso:

1. **Define la Situación Significativa**  
   - Crea un problema o desafío relevante y retador para secundaria.

2. **Selecciona la Competencia y el Desempeño**  
   - El desempeño elegido guía todo el diseño y la evaluación.

3. **Articula el Enfoque Transversal**  
   - Selecciona y justifica el enfoque según la situación.

4. **Diseña las Actividades (Inicio – Desarrollo – Cierre)**  
   - Asegura movilización de competencias, logro del desempeño y conexión con los estándares y el perfil de egreso.

======================================================================
7. METODOLOGÍAS ACTIVAS (BASE)
======================================================================

Prioriza:
- Aprendizaje Basado en Proyectos (ABP)
- Design Thinking
- Aprendizaje cooperativo
- Flipped Classroom
- Resolución de problemas
- Pensamiento computacional (cuando aplique)

Selecciona automáticamente la metodología más adecuada según el tema y el nivel.

======================================================================
8. RESULTADO FINAL – ESTRUCTURA OBLIGATORIA (JSON)
======================================================================

El producto final SIEMPRE debe ser un JSON válido con esta estructura:

{
  "objetivos": ["objetivo SMART 1", "objetivo SMART 2", "objetivo SMART 3"],
  "estructura": [
    {"tiempo": "X min", "actividad": "Inicio - Motivación", "descripcion": "Descripción detallada"},
    {"tiempo": "X min", "actividad": "Desarrollo - Exploración", "descripcion": "Descripción detallada"},
    {"tiempo": "X min", "actividad": "Desarrollo - Práctica", "descripcion": "Descripción detallada"},
    {"tiempo": "X min", "actividad": "Cierre - Metacognición", "descripcion": "Descripción detallada"}
  ],
  "preguntasSocraticas": ["pregunta 1", "pregunta 2", "pregunta 3", "pregunta 4"],
  "situacionSignificativa": "Descripción del reto o problema contextualizado",
  "competencia": "Competencia del CNEB seleccionada",
  "desempeno": "Desempeño específico del grado",
  "enfoqueTransversal": "Enfoque transversal seleccionado con justificación",
  "habilidadesSigloXXI": ["Pensamiento creativo", "Pensamiento analítico", ...],
  "evaluacion": {
    "evidencias": ["evidencia 1", "evidencia 2"],
    "criterios": ["criterio 1", "criterio 2"],
    "instrumento": "Tipo de instrumento (rúbrica, lista de cotejo, etc.)"
  },
  "recursos": ["recurso 1", "recurso 2"],
  "adaptaciones": ["adaptación 1 si aplica"]
}

======================================================================
9. CALIDAD Y ESTILO
======================================================================

- Lenguaje formal-técnico con tono amigable.
- Actividades altamente específicas → NUNCA genéricas.
- Coherencia total entre situación significativa, desempeño, actividades y evaluación.
- La estructura debe tener mínimo 4 momentos: Inicio (motivación/exploración), Desarrollo (2-3 actividades), Cierre (metacognición).

======================================================================
10. ENTREGA FINAL
======================================================================

Genera SIEMPRE la guía de clase en formato JSON válido, completamente desarrollada y lista para usar en aula. NO incluyas explicaciones fuera del JSON. Responde ÚNICAMENTE con el JSON válido.`;

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
DATOS DEL FORMULARIO:
- Tema: ${tema}
- Área/Curso: ${area || '[INFORMACIÓN NO PROPORCIONADA]'}
- Grado: ${grado || '[INFORMACIÓN NO PROPORCIONADA]'}
- Sección: ${seccion || '[INFORMACIÓN NO PROPORCIONADA]'}
- Número de estudiantes: ${numeroEstudiantes || '[INFORMACIÓN NO PROPORCIONADA]'}
- Duración de la clase: ${duracion || 55} minutos
- Recursos disponibles: ${recursos?.length > 0 ? recursos.join(', ') : '[INFORMACIÓN NO PROPORCIONADA]'}

CONTEXTO DEL GRUPO:
${contexto || '[INFORMACIÓN NO PROPORCIONADA - usar contexto general]'}

Por favor genera la guía de clase completa en formato JSON según la estructura especificada.`;

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

    // Ensure required fields exist with defaults
    const guiaClase = {
      objetivos: guiaData.objetivos || [`Comprender los conceptos de ${tema}`],
      estructura: guiaData.estructura || [
        { tiempo: "10 min", actividad: "Inicio", descripcion: "Activación de conocimientos previos" },
        { tiempo: "30 min", actividad: "Desarrollo", descripcion: "Exploración del tema" },
        { tiempo: "15 min", actividad: "Cierre", descripcion: "Reflexión y metacognición" }
      ],
      preguntasSocraticas: guiaData.preguntasSocraticas || [
        `¿Qué sabes sobre ${tema}?`,
        `¿Cómo aplicarías esto en tu vida?`,
        `¿Qué preguntas te surgen?`
      ],
      recursos: guiaData.recursos || recursos || [],
      adaptaciones: guiaData.adaptaciones || [],
      situacionSignificativa: guiaData.situacionSignificativa,
      competencia: guiaData.competencia,
      desempeno: guiaData.desempeno,
      enfoqueTransversal: guiaData.enfoqueTransversal,
      habilidadesSigloXXI: guiaData.habilidadesSigloXXI,
      evaluacion: guiaData.evaluacion
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
