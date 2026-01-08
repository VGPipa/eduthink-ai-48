import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres el "Arquitecto Pedagógico" de Cognitia, una IA experta en diseñar sesiones de aprendizaje transformadoras para escuelas peruanas. Tu misión es generar una SESIÓN DE CLASE en formato JSON estricto, alineada al Currículo Nacional de la Educación Básica (CNEB).

### 1. FILOSOFÍA PEDAGÓGICA (MANDATORIO)
No diseñas clases tradicionales. Diseñas experiencias basadas en la indagación y el aprendizaje socioemocional.
Tu estructura interna de pensamiento para la secuencia didáctica debe ser:
A. INICIO (Conexión): No es solo llamar lista. Es conectar el tema con una emoción o valor humano.
B. DESARROLLO (Provocación + Construcción): Presentar un desafío complejo (Cognitivo) y resolverlo colaborativamente (Humano).
C. CIERRE (Metacognición): Reflexión sobre el proceso de aprendizaje y transferencia a la vida real.

### 2. MARCO DE HABILIDADES (CNEB + SIGLO XXI)
Debes integrar:
- COGNITIVAS (Future Skills): Pensamiento Crítico, Resolución de Problemas Complejos, Alfabetización de Datos, Pensamiento Sistémico.
- HUMANAS (Soft Skills): Empatía, Colaboración Radical, Ética, Resiliencia, Comunicación Asertiva.
- CNEB: Debes citar Competencia, Capacidad y Desempeño precisos del área curricular.

### 3. REGLAS DE GENERACIÓN
- Si falta información (ej. grado), infiere lo más adecuado y márcalo como [INFERIDO].
- El formato de salida debe ser ÚNICAMENTE un objeto JSON válido. No incluyas texto antes ni después del JSON.

### 4. ESTRUCTURA DEL JSON (SCHEMA SESIÓN DE CLASE)
Debes responder siguiendo exactamente esta estructura:
{
  "datos_generales": {
    "titulo_sesion": "String descriptivo de la sesión",
    "docente": "String (puede ser vacío si no se proporciona)",
    "fecha": "String (fecha en formato legible)",
    "nivel": "String (Inicial/Primaria/Secundaria)",
    "grado": "String (ej: Tercero)",
    "area_academica": "String (ej: Comunicación, Matemática)"
  },
  "propositos_aprendizaje": {
    "filas": [
      {
        "competencia": "String (Competencia CNEB)",
        "criterios_evaluacion": "String (Desempeños precisados)",
        "evidencia_aprendizaje": "String (Qué producirá el estudiante)",
        "instrumento_valorizacion": "String (Rúbrica, Lista de cotejo, etc.)"
      }
    ],
    "enfoques_transversales": ["String", "String"],
    "descripcion_enfoques": "String (Cómo se manifiestan los enfoques en la sesión)"
  },
  "preparacion": {
    "que_hacer_antes": "String (Acciones previas del docente)",
    "recursos_materiales": ["String", "String"]
  },
  "momentos_sesion": {
    "inicio": {
      "tiempo_minutos": Integer,
      "contenido": "String (Descripción detallada de las actividades de inicio, incluyendo:\\n- Activación de saberes previos\\n- Presentación del propósito\\n- Acuerdos de convivencia)"
    },
    "desarrollo": {
      "tiempo_minutos": Integer,
      "contenido": "String (Descripción detallada del desarrollo, incluyendo:\\n- Actividades principales\\n- Trabajo individual/grupal\\n- Rol del docente)"
    },
    "cierre": {
      "tiempo_minutos": Integer,
      "contenido": "String (Descripción detallada del cierre, incluyendo:\\n- Reflexión metacognitiva\\n- Evaluación del aprendizaje\\n- Extensión o tarea)"
    }
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
  nivel?: string;
  competencias?: string[];
  capacidades?: string[];
  enfoques_transversales?: string[];
  materiales?: string[];
  adaptaciones_nee?: {
    codigo: string;
    nombre: string;
    recomendaciones: string;
  }[];
  contexto_adaptaciones?: string;
  fecha?: string;
  docente?: string;
}

serve(async (req) => {
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
      area,
      nivel,
      competencias,
      capacidades,
      enfoques_transversales,
      materiales,
      adaptaciones_nee,
      contexto_adaptaciones,
      fecha,
      docente
    }: GenerateGuiaRequest = await req.json();

    console.log("=== Generate Sesión Request ===");
    console.log("Tema:", tema);
    console.log("Área:", area);
    console.log("Grado:", grado);
    console.log("Duración:", duracion);

    const adaptacionesSection = adaptaciones_nee?.length ? `
ADAPTACIONES PARA NECESIDADES EDUCATIVAS ESPECIALES:
El aula incluye estudiantes con las siguientes condiciones. DEBES incluir estrategias de diferenciación específicas:
${adaptaciones_nee.map(a => `- ${a.nombre}: ${a.recomendaciones}`).join('\n')}
${contexto_adaptaciones ? `\nNotas adicionales del profesor: ${contexto_adaptaciones}` : ''}
` : '';

    const userPrompt = `
DATOS DE LA SESIÓN:
- Tema: ${tema}
- Área Curricular: ${area || '[INFERIDO: según el tema]'}
- Nivel: ${nivel || 'Secundaria'}
- Grado: ${grado || '[INFERIDO]'}
- Sección: ${seccion || '[NO PROPORCIONADO]'}
- Número de estudiantes: ${numeroEstudiantes || '[NO PROPORCIONADO]'}
- Duración de la clase: ${duracion || 55} minutos
- Materiales disponibles: ${materiales?.length ? materiales.join(', ') : (recursos?.length ? recursos.join(', ') : '[INFERIDO: recursos básicos de aula]')}
- Fecha: ${fecha || '[NO PROPORCIONADA]'}
- Docente: ${docente || '[NO PROPORCIONADO]'}

PROPÓSITOS DE APRENDIZAJE (CNEB):
- Competencia(s): ${competencias?.length ? competencias.join('; ') : '[INFERIR del tema y área curricular]'}
- Capacidad(es): ${capacidades?.length ? capacidades.join('; ') : '[INFERIR de la competencia]'}
- Enfoque(s) transversal(es): ${enfoques_transversales?.length ? enfoques_transversales.join('; ') : '[Seleccionar el más apropiado]'}

CONTEXTO DEL GRUPO:
${contexto || '[NO PROPORCIONADO - usar contexto general para adolescentes peruanos]'}
${adaptacionesSection}

INSTRUCCIONES IMPORTANTES:
1. Distribuye el tiempo proporcionalmente: INICIO ~15%, DESARROLLO ~70%, CIERRE ~15%
2. Para cada competencia, genera criterios de evaluación (desempeños) realistas
3. Genera evidencias de aprendizaje concretas y medibles
4. Sugiere instrumentos de valorización apropiados (rúbrica, lista de cotejo, etc.)
5. En "que_hacer_antes", describe acciones específicas de preparación

Genera la SESIÓN DE CLASE completa en formato JSON según el schema especificado.`;

    console.log("User prompt built, calling Lovable AI...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    const sesionTool = {
      type: "function",
      function: {
        name: "generate_sesion_clase",
        description: "Genera una sesión de clase completa con estructura pedagógica CNEB",
        parameters: {
          type: "object",
          properties: {
            datos_generales: {
              type: "object",
              properties: {
                titulo_sesion: { type: "string" },
                docente: { type: "string" },
                fecha: { type: "string" },
                nivel: { type: "string" },
                grado: { type: "string" },
                area_academica: { type: "string" }
              },
              required: ["titulo_sesion", "nivel", "grado", "area_academica"]
            },
            propositos_aprendizaje: {
              type: "object",
              properties: {
                filas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      competencia: { type: "string" },
                      criterios_evaluacion: { type: "string" },
                      evidencia_aprendizaje: { type: "string" },
                      instrumento_valorizacion: { type: "string" }
                    },
                    required: ["competencia", "criterios_evaluacion", "evidencia_aprendizaje", "instrumento_valorizacion"]
                  }
                },
                enfoques_transversales: { type: "array", items: { type: "string" } },
                descripcion_enfoques: { type: "string" }
              },
              required: ["filas", "enfoques_transversales", "descripcion_enfoques"]
            },
            preparacion: {
              type: "object",
              properties: {
                que_hacer_antes: { type: "string" },
                recursos_materiales: { type: "array", items: { type: "string" } }
              },
              required: ["que_hacer_antes", "recursos_materiales"]
            },
            momentos_sesion: {
              type: "object",
              properties: {
                inicio: {
                  type: "object",
                  properties: {
                    tiempo_minutos: { type: "integer" },
                    contenido: { type: "string" }
                  },
                  required: ["tiempo_minutos", "contenido"]
                },
                desarrollo: {
                  type: "object",
                  properties: {
                    tiempo_minutos: { type: "integer" },
                    contenido: { type: "string" }
                  },
                  required: ["tiempo_minutos", "contenido"]
                },
                cierre: {
                  type: "object",
                  properties: {
                    tiempo_minutos: { type: "integer" },
                    contenido: { type: "string" }
                  },
                  required: ["tiempo_minutos", "contenido"]
                }
              },
              required: ["inicio", "desarrollo", "cierre"]
            }
          },
          required: ["datos_generales", "propositos_aprendizaje", "preparacion", "momentos_sesion"]
        }
      }
    };

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
        tools: [sesionTool],
        tool_choice: { type: "function", function: { name: "generate_sesion_clase" } }
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
    console.log("AI Response received, parsing tool call...");

    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "generate_sesion_clase") {
      console.error("No tool call found in response:", JSON.stringify(data, null, 2));
      throw new Error("La IA no generó la sesión correctamente");
    }

    let sesionData;
    try {
      sesionData = JSON.parse(toolCall.function.arguments);
      console.log("Tool call arguments parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse tool call arguments:", parseError);
      console.error("Raw arguments:", toolCall.function.arguments);
      throw new Error("Error al procesar la respuesta de la IA");
    }

    // Calculate default times based on duration
    const totalDuration = duracion || 55;
    const inicioTime = Math.round(totalDuration * 0.15);
    const desarrolloTime = Math.round(totalDuration * 0.70);
    const cierreTime = totalDuration - inicioTime - desarrolloTime;

    // Ensure required fields exist with defaults
    const sesionClase = {
      datos_generales: sesionData.datos_generales || {
        titulo_sesion: `Sesión: ${tema}`,
        docente: docente || "",
        fecha: fecha || new Date().toLocaleDateString('es-PE'),
        nivel: nivel || "Secundaria",
        grado: grado || "[INFERIDO]",
        area_academica: area || "[NO ESPECIFICADA]"
      },
      propositos_aprendizaje: sesionData.propositos_aprendizaje || {
        filas: [{
          competencia: competencias?.[0] || "[POR DEFINIR]",
          criterios_evaluacion: "[POR DEFINIR]",
          evidencia_aprendizaje: "[POR DEFINIR]",
          instrumento_valorizacion: "Lista de cotejo"
        }],
        enfoques_transversales: enfoques_transversales || ["[POR DEFINIR]"],
        descripcion_enfoques: "[POR DEFINIR]"
      },
      preparacion: sesionData.preparacion || {
        que_hacer_antes: "Preparar los materiales necesarios para la sesión.",
        recursos_materiales: materiales || recursos || []
      },
      momentos_sesion: sesionData.momentos_sesion || {
        inicio: {
          tiempo_minutos: inicioTime,
          contenido: "Activación de conocimientos previos y presentación del propósito de la sesión."
        },
        desarrollo: {
          tiempo_minutos: desarrolloTime,
          contenido: "Desarrollo de las actividades principales de aprendizaje."
        },
        cierre: {
          tiempo_minutos: cierreTime,
          contenido: "Reflexión metacognitiva y síntesis del aprendizaje."
        }
      }
    };

    console.log("=== Sesión de Clase generated successfully ===");

    return new Response(JSON.stringify(sesionClase), {
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
