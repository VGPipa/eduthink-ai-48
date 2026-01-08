import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnsureTemaRequest {
  curso_plan_id: string;
  nombre: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: EnsureTemaRequest = await req.json();
    const { curso_plan_id, nombre } = body;

    // Validate inputs
    if (!curso_plan_id || typeof curso_plan_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'curso_plan_id es requerido y debe ser un UUID válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!nombre || typeof nombre !== 'string') {
      return new Response(
        JSON.stringify({ error: 'nombre es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nombreTrimmed = nombre.trim();
    if (nombreTrimmed.length < 2 || nombreTrimmed.length > 200) {
      return new Response(
        JSON.stringify({ error: 'El nombre del tema debe tener entre 2 y 200 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticación requerida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user auth (to verify user)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client for DB operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a profesor
    const { data: profesor, error: profError } = await supabaseAdmin
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profError || !profesor) {
      return new Response(
        JSON.stringify({ error: 'Solo los profesores pueden crear temas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify curso_plan exists
    const { data: curso, error: cursoError } = await supabaseAdmin
      .from('cursos_plan')
      .select('id')
      .eq('id', curso_plan_id)
      .single();

    if (cursoError || !curso) {
      return new Response(
        JSON.stringify({ error: 'El curso especificado no existe' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for existing tema with same name in this curso (case-insensitive)
    const { data: existingTema, error: searchError } = await supabaseAdmin
      .from('temas_plan')
      .select('id, nombre, curso_plan_id')
      .eq('curso_plan_id', curso_plan_id)
      .ilike('nombre', nombreTrimmed)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for tema:', searchError);
      return new Response(
        JSON.stringify({ error: 'Error al buscar tema existente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If tema exists, return it
    if (existingTema) {
      console.log('Found existing tema:', existingTema.id);
      return new Response(
        JSON.stringify({ 
          id: existingTema.id, 
          nombre: existingTema.nombre, 
          curso_plan_id: existingTema.curso_plan_id,
          created: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new tema
    const { data: newTema, error: insertError } = await supabaseAdmin
      .from('temas_plan')
      .insert({
        curso_plan_id: curso_plan_id,
        nombre: nombreTrimmed,
        descripcion: 'Tema creado para clase extraordinaria',
        orden: 999, // High order number for extraordinary topics
        bimestre: null // null indicates extraordinary topic
      })
      .select('id, nombre, curso_plan_id')
      .single();

    if (insertError) {
      console.error('Error creating tema:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al crear el tema: ' + insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created new tema:', newTema.id);
    return new Response(
      JSON.stringify({ 
        id: newTema.id, 
        nombre: newTema.nombre, 
        curso_plan_id: newTema.curso_plan_id,
        created: true 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
