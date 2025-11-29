-- Seed de datos sintéticos para Mis Salones
-- Incluye: alumnos de prueba, quizzes PRE/POST, respuestas y recomendaciones
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  profesor_id uuid;
  grupo_id uuid;
  institucion_id uuid;
  clase RECORD;
  alumno_record RECORD;
  quiz_pre_id uuid;
  quiz_post_id uuid;
  respuesta_id uuid;
  pregunta_id uuid;
  porcentaje numeric;
  completado boolean;
  respuestas_correctas integer;
  es_correcta boolean;
  concepto_idx integer;
  alumno_idx integer;
  new_user_id uuid;
  new_alumno_id uuid;
  
  -- Distribución de rendimiento por concepto PRE (% incorrectas)
  pre_conceptos text[] := ARRAY['Conteo de objetos', 'Comparación de cantidades', 'Orden numérico', 'Representación numérica', 'Secuencias numéricas'];
  pre_incorrectas numeric[] := ARRAY[0.08, 0.25, 0.45, 0.35, 0.18];
  
  -- Distribución de rendimiento por concepto POST (% incorrectas)
  post_conceptos text[] := ARRAY['Conteo de objetos', 'Comparación de cantidades', 'Orden numérico', 'Representación numérica', 'Secuencias numéricas', 'Sumas básicas', 'Restas básicas', 'Problemas de palabra', 'Descomposición numérica', 'Valor posicional'];
  post_incorrectas numeric[] := ARRAY[0.05, 0.12, 0.08, 0.20, 0.10, 0.38, 0.42, 0.55, 0.15, 0.22];
  
  -- Nombres de alumnos demo
  nombres_alumnos text[] := ARRAY['Isabella', 'Mateo', 'Valentina', 'Santiago', 'Sofía', 'Sebastián', 'Camila', 'Nicolás', 'Luciana', 'Daniel', 'María José', 'Alejandro', 'Antonella', 'Gabriel', 'Valeria', 'Diego', 'Catalina', 'Joaquín', 'Fernanda', 'Andrés', 'Mariana', 'Lucas', 'Paula', 'Emilio', 'Carolina'];
  apellidos_alumnos text[] := ARRAY['Parra', 'González', 'Rodríguez', 'Martínez', 'López', 'García', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales', 'Reyes', 'Cruz', 'Ortiz', 'Vargas', 'Castillo', 'Jiménez', 'Moreno', 'Romero', 'Álvarez'];

BEGIN
  -- Obtener el primer profesor disponible
  SELECT p.id, pr.id_institucion INTO profesor_id, institucion_id
  FROM profesores p
  JOIN profiles pr ON pr.user_id = p.user_id
  WHERE pr.id_institucion IS NOT NULL
  ORDER BY p.created_at
  LIMIT 1;

  IF profesor_id IS NULL THEN
    RAISE NOTICE 'No se encontró profesor. Aborta seed.';
    RETURN;
  END IF;

  -- Obtener un grupo asignado al profesor
  SELECT id_grupo INTO grupo_id
  FROM asignaciones_profesor
  WHERE id_profesor = profesor_id
  LIMIT 1;

  IF grupo_id IS NULL THEN
    RAISE NOTICE 'No se encontró grupo asignado al profesor. Aborta seed.';
    RETURN;
  END IF;

  -- =====================
  -- LIMPIEZA DE DATOS DEMO PREVIOS
  -- =====================
  DELETE FROM respuestas_detalle rd
  USING respuestas_alumno ra, quizzes q
  WHERE rd.id_respuesta_alumno = ra.id
    AND ra.id_quiz = q.id
    AND q.titulo LIKE '[DEMO]%';

  DELETE FROM respuestas_alumno ra
  USING quizzes q
  WHERE ra.id_quiz = q.id
    AND q.titulo LIKE '[DEMO]%';

  DELETE FROM preguntas p
  USING quizzes q
  WHERE p.id_quiz = q.id
    AND q.titulo LIKE '[DEMO]%';

  DELETE FROM recomendaciones
  WHERE contenido LIKE '%[DEMO]%';

  DELETE FROM quizzes
  WHERE titulo LIKE '[DEMO]%';

  -- Eliminar alumnos demo previos
  DELETE FROM alumnos_grupo ag
  USING alumnos a, profiles p
  WHERE ag.id_alumno = a.id
    AND a.user_id = p.user_id
    AND p.email LIKE '%demo.eduthink%';

  DELETE FROM alumnos a
  USING profiles p
  WHERE a.user_id = p.user_id
    AND p.email LIKE '%demo.eduthink%';

  DELETE FROM profiles
  WHERE email LIKE '%demo.eduthink%';

  -- =====================
  -- CREAR ALUMNOS DE PRUEBA
  -- =====================
  FOR alumno_idx IN 1..25 LOOP
    -- Crear user_id simulado (no es un auth.user real, solo para demo)
    new_user_id := gen_random_uuid();
    
    -- Crear profile
    INSERT INTO profiles (
      id,
      user_id,
      nombre,
      apellido,
      email,
      id_institucion,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      nombres_alumnos[alumno_idx],
      apellidos_alumnos[alumno_idx],
      'alumno' || alumno_idx || '@demo.eduthink.com',
      institucion_id,
      NOW(),
      NOW()
    );

    -- Crear alumno
    INSERT INTO alumnos (
      id,
      user_id,
      grado,
      seccion,
      edad,
      created_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      '1° Primaria',
      'A',
      6 + (alumno_idx % 2),
      NOW()
    ) RETURNING id INTO new_alumno_id;

    -- Asignar alumno al grupo
    INSERT INTO alumnos_grupo (
      id,
      id_alumno,
      id_grupo,
      anio_escolar,
      created_at
    ) VALUES (
      gen_random_uuid(),
      new_alumno_id,
      grupo_id,
      '2024',
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Creados 25 alumnos de prueba';

  -- =====================
  -- CREAR QUIZZES Y RESPUESTAS
  -- =====================
  FOR clase IN
    SELECT
      c.*,
      g.nombre AS grupo_nombre,
      g.grado AS grupo_grado,
      g.seccion AS grupo_seccion
    FROM clases c
    JOIN grupos g ON g.id = c.id_grupo
    WHERE c.id_profesor = profesor_id
      AND c.id_grupo = grupo_id
    ORDER BY COALESCE(c.fecha_programada, c.created_at) DESC
    LIMIT 4
  LOOP
    -- =====================
    -- QUIZ PREVIO (PRE)
    -- =====================
    INSERT INTO quizzes (
      id,
      id_clase,
      tipo,
      estado,
      titulo,
      instrucciones,
      fecha_disponible,
      fecha_limite,
      tiempo_limite,
      created_at
    ) VALUES (
      gen_random_uuid(),
      clase.id,
      'previo',
      'publicado',
      '[DEMO] Quiz Pre ' || COALESCE(clase.numero_sesion::text, '1'),
      'Evalúa conocimientos previos de la sesión ' || COALESCE(clase.numero_sesion::text, '1'),
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '4 days',
      20,
      NOW() - INTERVAL '5 days'
    ) RETURNING id INTO quiz_pre_id;

    -- Crear 5 preguntas para el quiz PRE con campo concepto
    FOR concepto_idx IN 1..5 LOOP
      INSERT INTO preguntas (
        id,
        id_quiz,
        tipo,
        texto_pregunta,
        texto_contexto,
        concepto,
        opciones,
        respuesta_correcta,
        justificacion,
        orden,
        created_at
      ) VALUES (
        gen_random_uuid(),
        quiz_pre_id,
        'opcion_multiple',
        CASE concepto_idx
          WHEN 1 THEN '¿Cuántas manzanas hay en la imagen?'
          WHEN 2 THEN '¿Cuál número es mayor: 8 o 14?'
          WHEN 3 THEN 'Ordena de menor a mayor: 17, 9, 13'
          WHEN 4 THEN '¿Qué número representa ●●●●● ●●●●● ●●●?'
          WHEN 5 THEN 'Completa la secuencia: 5, 10, ___, 20'
        END,
        'Matemática - Resuelve problemas de cantidad',
        pre_conceptos[concepto_idx],
        CASE concepto_idx
          WHEN 1 THEN '[{"valor": "A", "texto": "12"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "18"}, {"valor": "D", "texto": "20"}]'::jsonb
          WHEN 2 THEN '[{"valor": "A", "texto": "8"}, {"valor": "B", "texto": "14"}, {"valor": "C", "texto": "Son iguales"}, {"valor": "D", "texto": "No se puede saber"}]'::jsonb
          WHEN 3 THEN '[{"valor": "A", "texto": "9, 13, 17"}, {"valor": "B", "texto": "17, 13, 9"}, {"valor": "C", "texto": "13, 9, 17"}, {"valor": "D", "texto": "9, 17, 13"}]'::jsonb
          WHEN 4 THEN '[{"valor": "A", "texto": "13"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "17"}, {"valor": "D", "texto": "20"}]'::jsonb
          WHEN 5 THEN '[{"valor": "A", "texto": "12"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "17"}, {"valor": "D", "texto": "18"}]'::jsonb
        END,
        CASE concepto_idx
          WHEN 1 THEN 'B'
          WHEN 2 THEN 'B'
          WHEN 3 THEN 'A'
          WHEN 4 THEN 'B'
          WHEN 5 THEN 'B'
        END,
        CASE concepto_idx
          WHEN 1 THEN 'El conteo correcto muestra 15 manzanas.'
          WHEN 2 THEN '14 es mayor que 8.'
          WHEN 3 THEN 'El orden correcto es 9, 13, 17.'
          WHEN 4 THEN '15 puntos representan el número 15.'
          WHEN 5 THEN 'La secuencia avanza de 5 en 5: 10 + 5 = 15.'
        END,
        concepto_idx,
        NOW() - INTERVAL '5 days'
      );
    END LOOP;

    -- =====================
    -- QUIZ POST
    -- =====================
    INSERT INTO quizzes (
      id,
      id_clase,
      tipo,
      estado,
      titulo,
      instrucciones,
      fecha_disponible,
      fecha_limite,
      tiempo_limite,
      created_at
    ) VALUES (
      gen_random_uuid(),
      clase.id,
      'post',
      'publicado',
      '[DEMO] Quiz Post ' || COALESCE(clase.numero_sesion::text, '1'),
      'Confirma el nivel de comprensión posterior a la sesión',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '1 days',
      30,
      NOW() - INTERVAL '2 days'
    ) RETURNING id INTO quiz_post_id;

    -- Crear 10 preguntas para el quiz POST con campo concepto
    FOR concepto_idx IN 1..10 LOOP
      INSERT INTO preguntas (
        id,
        id_quiz,
        tipo,
        texto_pregunta,
        texto_contexto,
        concepto,
        opciones,
        respuesta_correcta,
        justificacion,
        orden,
        created_at
      ) VALUES (
        gen_random_uuid(),
        quiz_post_id,
        'opcion_multiple',
        CASE concepto_idx
          WHEN 1 THEN 'Cuenta los triángulos en la figura'
          WHEN 2 THEN '¿Cuántos más hay en el grupo A (12) que en el grupo B (7)?'
          WHEN 3 THEN '¿Qué número viene antes del 17?'
          WHEN 4 THEN 'Escribe el número: 1 decena y 5 unidades'
          WHEN 5 THEN 'Encuentra el número que falta: 8, 10, 12, ___, 16'
          WHEN 6 THEN '¿Cuánto es 9 + 7?'
          WHEN 7 THEN '¿Cuánto es 18 - 5?'
          WHEN 8 THEN 'María tiene 8 caramelos y le dan 6 más. ¿Cuántos tiene?'
          WHEN 9 THEN '¿Cómo se forma el número 14?'
          WHEN 10 THEN 'En el número 17, ¿cuántas decenas hay?'
        END,
        'Matemática - Resuelve problemas de cantidad',
        post_conceptos[concepto_idx],
        CASE concepto_idx
          WHEN 1 THEN '[{"valor": "A", "texto": "8"}, {"valor": "B", "texto": "10"}, {"valor": "C", "texto": "12"}, {"valor": "D", "texto": "14"}]'::jsonb
          WHEN 2 THEN '[{"valor": "A", "texto": "3"}, {"valor": "B", "texto": "5"}, {"valor": "C", "texto": "7"}, {"valor": "D", "texto": "19"}]'::jsonb
          WHEN 3 THEN '[{"valor": "A", "texto": "15"}, {"valor": "B", "texto": "16"}, {"valor": "C", "texto": "18"}, {"valor": "D", "texto": "19"}]'::jsonb
          WHEN 4 THEN '[{"valor": "A", "texto": "6"}, {"valor": "B", "texto": "14"}, {"valor": "C", "texto": "15"}, {"valor": "D", "texto": "51"}]'::jsonb
          WHEN 5 THEN '[{"valor": "A", "texto": "13"}, {"valor": "B", "texto": "14"}, {"valor": "C", "texto": "15"}, {"valor": "D", "texto": "17"}]'::jsonb
          WHEN 6 THEN '[{"valor": "A", "texto": "14"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "16"}, {"valor": "D", "texto": "17"}]'::jsonb
          WHEN 7 THEN '[{"valor": "A", "texto": "11"}, {"valor": "B", "texto": "12"}, {"valor": "C", "texto": "13"}, {"valor": "D", "texto": "23"}]'::jsonb
          WHEN 8 THEN '[{"valor": "A", "texto": "2"}, {"valor": "B", "texto": "12"}, {"valor": "C", "texto": "14"}, {"valor": "D", "texto": "16"}]'::jsonb
          WHEN 9 THEN '[{"valor": "A", "texto": "10 + 4"}, {"valor": "B", "texto": "5 + 5"}, {"valor": "C", "texto": "8 + 8"}, {"valor": "D", "texto": "7 + 5"}]'::jsonb
          WHEN 10 THEN '[{"valor": "A", "texto": "0"}, {"valor": "B", "texto": "1"}, {"valor": "C", "texto": "7"}, {"valor": "D", "texto": "17"}]'::jsonb
        END,
        CASE concepto_idx
          WHEN 1 THEN 'C'
          WHEN 2 THEN 'B'
          WHEN 3 THEN 'B'
          WHEN 4 THEN 'C'
          WHEN 5 THEN 'B'
          WHEN 6 THEN 'C'
          WHEN 7 THEN 'C'
          WHEN 8 THEN 'C'
          WHEN 9 THEN 'A'
          WHEN 10 THEN 'B'
        END,
        CASE concepto_idx
          WHEN 1 THEN 'Hay 12 triángulos en la figura.'
          WHEN 2 THEN 'Restamos: 12 - 7 = 5.'
          WHEN 3 THEN 'El número anterior al 17 es 16.'
          WHEN 4 THEN '1 decena + 5 unidades = 15.'
          WHEN 5 THEN 'La secuencia avanza de 2 en 2: 14.'
          WHEN 6 THEN '9 + 7 = 16.'
          WHEN 7 THEN '18 - 5 = 13.'
          WHEN 8 THEN '8 + 6 = 14 caramelos.'
          WHEN 9 THEN '14 = 10 + 4.'
          WHEN 10 THEN '17 tiene 1 decena.'
        END,
        concepto_idx,
        NOW() - INTERVAL '2 days'
      );
    END LOOP;

    -- =====================
    -- RESPUESTAS POR ALUMNO
    -- =====================
    FOR alumno_record IN
      SELECT a.id
      FROM alumnos a
      JOIN alumnos_grupo ag ON ag.id_alumno = a.id
      WHERE ag.id_grupo = clase.id_grupo
    LOOP
      -- RESPUESTA QUIZ PRE
      completado := random() > 0.33; -- 67% participación
      respuestas_correctas := 0;
      
      INSERT INTO respuestas_alumno (
        id,
        id_quiz,
        id_alumno,
        estado,
        fecha_inicio,
        fecha_envio,
        puntaje_total,
        created_at
      ) VALUES (
        gen_random_uuid(),
        quiz_pre_id,
        alumno_record.id,
        CASE WHEN completado THEN 'completado'::estado_respuesta ELSE 'en_progreso'::estado_respuesta END,
        NOW() - INTERVAL '4 days',
        CASE WHEN completado THEN NOW() - INTERVAL '4 days' + INTERVAL '10 minutes' ELSE NULL END,
        NULL,
        NOW() - INTERVAL '4 days'
      ) RETURNING id INTO respuesta_id;

      IF completado THEN
        FOR concepto_idx IN 1..5 LOOP
          SELECT id INTO pregunta_id
          FROM preguntas
          WHERE id_quiz = quiz_pre_id AND orden = concepto_idx;
          
          es_correcta := random() > pre_incorrectas[concepto_idx];
          
          IF es_correcta THEN
            respuestas_correctas := respuestas_correctas + 1;
          END IF;
          
          INSERT INTO respuestas_detalle (
            id,
            id_respuesta_alumno,
            id_pregunta,
            respuesta_alumno,
            es_correcta,
            tiempo_segundos
          ) VALUES (
            gen_random_uuid(),
            respuesta_id,
            pregunta_id,
            CASE WHEN es_correcta THEN 
              (SELECT respuesta_correcta FROM preguntas WHERE id = pregunta_id)
            ELSE 
              CASE (random() * 3)::integer WHEN 0 THEN 'A' WHEN 1 THEN 'C' ELSE 'D' END
            END,
            es_correcta,
            (60 + random() * 120)::integer
          );
        END LOOP;
        
        porcentaje := ROUND((respuestas_correctas::numeric / 5.0) * 100, 0);
        UPDATE respuestas_alumno SET puntaje_total = porcentaje::integer WHERE id = respuesta_id;
      END IF;

      -- RESPUESTA QUIZ POST
      completado := random() > 0.33; -- 67% participación
      respuestas_correctas := 0;
      
      INSERT INTO respuestas_alumno (
        id,
        id_quiz,
        id_alumno,
        estado,
        fecha_inicio,
        fecha_envio,
        puntaje_total,
        created_at
      ) VALUES (
        gen_random_uuid(),
        quiz_post_id,
        alumno_record.id,
        CASE WHEN completado THEN 'completado'::estado_respuesta ELSE 'en_progreso'::estado_respuesta END,
        NOW() - INTERVAL '1 days',
        CASE WHEN completado THEN NOW() - INTERVAL '1 days' + INTERVAL '15 minutes' ELSE NULL END,
        NULL,
        NOW() - INTERVAL '1 days'
      ) RETURNING id INTO respuesta_id;

      IF completado THEN
        FOR concepto_idx IN 1..10 LOOP
          SELECT id INTO pregunta_id
          FROM preguntas
          WHERE id_quiz = quiz_post_id AND orden = concepto_idx;
          
          es_correcta := random() > post_incorrectas[concepto_idx];
          
          IF es_correcta THEN
            respuestas_correctas := respuestas_correctas + 1;
          END IF;
          
          INSERT INTO respuestas_detalle (
            id,
            id_respuesta_alumno,
            id_pregunta,
            respuesta_alumno,
            es_correcta,
            tiempo_segundos
          ) VALUES (
            gen_random_uuid(),
            respuesta_id,
            pregunta_id,
            CASE WHEN es_correcta THEN 
              (SELECT respuesta_correcta FROM preguntas WHERE id = pregunta_id)
            ELSE 
              CASE (random() * 3)::integer WHEN 0 THEN 'A' WHEN 1 THEN 'C' ELSE 'D' END
            END,
            es_correcta,
            (90 + random() * 180)::integer
          );
        END LOOP;
        
        porcentaje := ROUND((respuestas_correctas::numeric / 10.0) * 100, 0);
        UPDATE respuestas_alumno SET puntaje_total = porcentaje::integer WHERE id = respuesta_id;
      END IF;
    END LOOP;

    -- =====================
    -- RECOMENDACIONES
    -- =====================
    INSERT INTO recomendaciones (id, id_clase, aplicada, contenido, created_at)
    VALUES (
      gen_random_uuid(),
      clase.id,
      FALSE,
      '[DEMO] Refuerza el concepto de Orden numérico. El grupo muestra solo 55% de aciertos en este concepto. Considera activar conocimientos previos o usar ejemplos visuales antes de abordar el tema.',
      NOW()
    );

    INSERT INTO recomendaciones (id, id_clase, aplicada, contenido, created_at)
    VALUES (
      gen_random_uuid(),
      clase.id,
      FALSE,
      '[DEMO] Fortalece la comprensión de Problemas de palabra. Incluye un mini-ejercicio de refuerzo sobre este concepto durante el calentamiento de la siguiente clase.',
      NOW()
    );
  END LOOP;

  -- Actualizar cantidad de alumnos en el grupo
  UPDATE grupos SET cantidad_alumnos = 25 WHERE id = grupo_id;

  RAISE NOTICE 'Seed demo de Mis Salones completado. Profesor: %, Grupo: %', profesor_id, grupo_id;
END $$ LANGUAGE plpgsql;
