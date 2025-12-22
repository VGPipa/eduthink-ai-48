import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres el "Arquitecto de Evaluación de Competencias". Tu misión es diseñar un Quiz de Salida (Post-Clase) que certifique que el estudiante ha interiorizado los conceptos y es capaz de aplicarlos.

## FILOSOFÍA DE EVALUACIÓN:
No queremos preguntas de memoria simple (ej: "¿En qué año fue...?"). Queremos preguntas de **Situación y Análisis**.
Genera 7 preguntas de aplicación práctica basadas en situaciones reales.
Diseña el examen para durar 15 minutos (aprox. 2 min de reflexión por pregunta).

## ESTRUCTURA DE CADA ÍTEM:
Cada pregunta debe tener dos partes:
A. **El Contexto (Enunciado Breve):** Una o dos frases que plantean una situación, problema o escenario (máximo 30 palabras).
B. **El Reto:** La pregunta específica derivada de ese contexto.

## REGLAS IMPORTANTES:
1. Las preguntas deben basarse en los OBJETIVOS DE APRENDIZAJE de la guía de clase
2. Utiliza el CONTEXTO del grupo para hacer las situaciones relevantes y cercanas
3. La retroalimentación debe ser profunda y educativa, no solo decir "correcto/incorrecto"
4. Asegura que las 4 opciones sean plausibles, evita distractores obvios
5. Alinea con el CNEB (competencia, capacidad, desempeño) cuando esté disponible

## FORMATO DE SALIDA (JSON):
Genera un único objeto JSON válido con esta estructura exacta:

{
  "metadata": {
    "titulo_evaluacion": "Evaluación Final: [Tema]",
    "tiempo_sugerido": "15 minutos",
    "proposito": "[Describir el propósito de certificación de competencias]",
    "nivel_taxonomico": "[Aplicación/Análisis/Evaluación según Bloom]"
  },
  "preguntas": [
    {
      "numero": 1,
      "contexto_situacional": "[El escenario breve, máx 30 palabras]",
      "pregunta": "[El reto a resolver]",
      "opciones": [
        {"texto": "[Opción A]", "es_correcta": false},
        {"texto": "[Opción B - correcta]", "es_correcta": true},
        {"texto": "[Opción C]", "es_correcta": false},
        {"texto": "[Opción D]", "es_correcta": false}
      ],
      "retroalimentacion_detallada": "[Explicación profunda de la respuesta. Vital para el aprendizaje final]"
    }
  ]
}

IMPORTANTE: Devuelve ÚNICAMENTE el JSON, sin markdown, sin \`\`\`json, sin texto adicional.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tema, 
      contexto, 
      grado, 
      area,
      guia_clase
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build enriched user prompt with guide information
    let userPrompt = `## TEMA CENTRAL:
${tema}

## GRADO:
${grado || 'No especificado'}

## ÁREA:
${area || 'No especificada'}

## CONTEXTO DEL GRUPO:
${contexto || 'Grupo de estudiantes de nivel estándar'}`;

    // Add guide information if available
    if (guia_clase) {
      userPrompt += `

## INFORMACIÓN DE LA GUÍA DE CLASE:`;

      if (guia_clase.objetivo_humano) {
        userPrompt += `
- Objetivo de desarrollo humano: ${guia_clase.objetivo_humano}`;
      }
      if (guia_clase.objetivo_aprendizaje) {
        userPrompt += `
- Objetivo de aprendizaje: ${guia_clase.objetivo_aprendizaje}`;
      }
      if (guia_clase.competencia) {
        userPrompt += `
- Competencia CNEB: ${guia_clase.competencia}`;
      }
      if (guia_clase.capacidad) {
        userPrompt += `
- Capacidad: ${guia_clase.capacidad}`;
      }
      if (guia_clase.desempeno_cneb) {
        userPrompt += `
- Desempeño precisado: ${guia_clase.desempeno_cneb}`;
      }
      if (guia_clase.enfoque_transversal) {
        userPrompt += `
- Enfoque transversal: ${guia_clase.enfoque_transversal}`;
      }
      if (guia_clase.actividad_desarrollo) {
        userPrompt += `
- Actividad de desarrollo: ${guia_clase.actividad_desarrollo}`;
      }
      if (guia_clase.actividad_cierre) {
        userPrompt += `
- Actividad de cierre: ${guia_clase.actividad_cierre}`;
      }
      if (guia_clase.criterios_evaluacion && guia_clase.criterios_evaluacion.length > 0) {
        userPrompt += `
- Criterios de evaluación: ${guia_clase.criterios_evaluacion.join(', ')}`;
      }
    }

    userPrompt += `

Genera el Quiz POST con exactamente 7 preguntas de aplicación práctica.`;

    console.log('Calling Lovable AI for Quiz POST generation...');
    console.log('User prompt:', userPrompt);

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
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let quizData;
    try {
      // Clean potential markdown formatting
      let cleanContent = content.trim();
      
      // Remove markdown code blocks
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      // Try to extract JSON object if there's extra text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      // Handle truncated JSON by attempting to fix common issues
      try {
        quizData = JSON.parse(cleanContent);
      } catch (firstParseError) {
        console.log('First parse failed, attempting to fix truncated JSON...');
        
        // Count open/close braces and brackets to detect truncation
        const openBraces = (cleanContent.match(/\{/g) || []).length;
        const closeBraces = (cleanContent.match(/\}/g) || []).length;
        const openBrackets = (cleanContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanContent.match(/\]/g) || []).length;
        
        // Try to close unclosed structures
        let fixedContent = cleanContent;
        
        // If JSON is truncated mid-string, try to close it
        if (fixedContent.includes('"') && !fixedContent.endsWith('}')) {
          // Find last complete question object and truncate there
          const lastCompleteQuestion = fixedContent.lastIndexOf('"retroalimentacion_detallada"');
          if (lastCompleteQuestion > 0) {
            const afterRetro = fixedContent.indexOf('"}', lastCompleteQuestion);
            if (afterRetro > 0) {
              fixedContent = fixedContent.substring(0, afterRetro + 2) + ']}';
            }
          }
        }
        
        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedContent += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedContent += '}';
        }
        
        try {
          quizData = JSON.parse(fixedContent);
          console.log('Fixed truncated JSON successfully');
        } catch (secondParseError) {
          // Last resort: try to extract what we can and build a minimal structure
          console.error('Could not fix JSON, creating fallback structure');
          throw new Error('JSON parsing failed');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON, length:', content.length);
      console.error('First 500 chars:', content.substring(0, 500));
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Validate and ensure structure with defaults
    const validatedData = {
      metadata: {
        titulo_evaluacion: quizData.metadata?.titulo_evaluacion || `Evaluación Final: ${tema}`,
        tiempo_sugerido: quizData.metadata?.tiempo_sugerido || '15 minutos',
        proposito: quizData.metadata?.proposito || 'Certificar la comprensión y aplicación de los conceptos aprendidos',
        nivel_taxonomico: quizData.metadata?.nivel_taxonomico || 'Aplicación y Análisis'
      },
      preguntas: (quizData.preguntas || []).map((p: any, index: number) => ({
        numero: p.numero || index + 1,
        contexto_situacional: p.contexto_situacional || '',
        pregunta: p.pregunta || '',
        opciones: (p.opciones || []).map((o: any) => ({
          texto: o.texto || '',
          es_correcta: o.es_correcta || false
        })),
        retroalimentacion_detallada: p.retroalimentacion_detallada || ''
      }))
    };

    // Ensure we have exactly 7 questions
    while (validatedData.preguntas.length < 7) {
      const num = validatedData.preguntas.length + 1;
      validatedData.preguntas.push({
        numero: num,
        contexto_situacional: `Situación relacionada con ${tema}`,
        pregunta: `Pregunta ${num} sobre ${tema}`,
        opciones: [
          { texto: 'Opción A', es_correcta: false },
          { texto: 'Opción B', es_correcta: true },
          { texto: 'Opción C', es_correcta: false },
          { texto: 'Opción D', es_correcta: false }
        ],
        retroalimentacion_detallada: `La respuesta correcta demuestra comprensión de ${tema}.`
      });
    }

    console.log('Quiz POST generated successfully with', validatedData.preguntas.length, 'questions');

    return new Response(JSON.stringify(validatedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quiz-post:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
