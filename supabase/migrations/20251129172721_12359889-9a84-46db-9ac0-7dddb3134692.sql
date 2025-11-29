
-- ============================================
-- EDUTHINK - MIGRACIÓN COMPLETA v2
-- 23 tablas con datos sintéticos
-- ============================================

-- PASO 1: Crear ENUMs necesarios
-- ============================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'profesor', 'alumno', 'apoderado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_clase AS ENUM (
    'borrador', 
    'generando_clase', 
    'editando_guia', 
    'guia_aprobada', 
    'clase_programada', 
    'en_clase', 
    'completada', 
    'analizando_resultados'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_quiz AS ENUM ('previo', 'post');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_quiz AS ENUM ('borrador', 'publicado', 'cerrado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_pregunta AS ENUM ('opcion_multiple', 'verdadero_falso', 'respuesta_corta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_respuesta AS ENUM ('en_progreso', 'completado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE relacion_apoderado AS ENUM ('padre', 'madre', 'tutor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PASO 2: Crear tablas institucionales
-- ============================================

-- Tabla: instituciones
CREATE TABLE IF NOT EXISTS public.instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  logo TEXT,
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: anios_escolares
CREATE TABLE IF NOT EXISTS public.anios_escolares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_institucion UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  anio_escolar TEXT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: periodos_academicos
CREATE TABLE IF NOT EXISTS public.periodos_academicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_anio_escolar UUID NOT NULL REFERENCES public.anios_escolares(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  numero INTEGER NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT false
);

-- Tabla: configuracion_alertas
CREATE TABLE IF NOT EXISTS public.configuracion_alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_institucion UUID UNIQUE NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  dias_urgente INTEGER DEFAULT 2,
  dias_proxima INTEGER DEFAULT 5,
  dias_programada INTEGER DEFAULT 10,
  dias_lejana INTEGER DEFAULT 20,
  rango_dias_clases_pendientes INTEGER DEFAULT 7
);

-- PASO 3: Sistema de usuarios y roles
-- ============================================

-- Tabla: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nombre TEXT,
  apellido TEXT,
  avatar_url TEXT,
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: user_roles (separada para seguridad)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, id_institucion)
);

-- Tabla: profesores
CREATE TABLE IF NOT EXISTS public.profesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  especialidad TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: alumnos
CREATE TABLE IF NOT EXISTS public.alumnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  grado TEXT,
  seccion TEXT,
  edad INTEGER,
  caracteristicas JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: apoderados
CREATE TABLE IF NOT EXISTS public.apoderados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  id_alumno UUID REFERENCES public.alumnos(id) ON DELETE CASCADE,
  relacion relacion_apoderado DEFAULT 'tutor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PASO 4: Migrar tablas de currícula existentes
-- ============================================

-- 4.1: Agregar columnas nuevas a planes_anuales
ALTER TABLE public.planes_anuales 
ADD COLUMN IF NOT EXISTS id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS plan_base BOOLEAN DEFAULT false;

-- 4.2: Agregar columnas nuevas a cursos_plan (será materias)
ALTER TABLE public.cursos_plan
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 4.3: Agregar columnas nuevas a temas_plan (será temas)
ALTER TABLE public.temas_plan
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS objetivos TEXT,
ADD COLUMN IF NOT EXISTS bimestre INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tema_base_id UUID REFERENCES public.temas_plan(id) ON DELETE SET NULL;

-- Renombrar duracion_semanas a duracion_estimada si existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temas_plan' AND column_name = 'duracion_semanas') THEN
    ALTER TABLE public.temas_plan RENAME COLUMN duracion_semanas TO duracion_estimada;
  END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Agregar duracion_estimada si no existe
ALTER TABLE public.temas_plan
ADD COLUMN IF NOT EXISTS duracion_estimada INTEGER;

-- PASO 5: Crear tablas de grupos y asignaciones
-- ============================================

-- Tabla: grupos
CREATE TABLE IF NOT EXISTS public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_institucion UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  grado TEXT NOT NULL,
  seccion TEXT,
  cantidad_alumnos INTEGER DEFAULT 0,
  perfil JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: asignaciones_profesor
CREATE TABLE IF NOT EXISTS public.asignaciones_profesor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesor UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  id_materia UUID NOT NULL REFERENCES public.cursos_plan(id) ON DELETE CASCADE,
  id_grupo UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  anio_escolar TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id_profesor, id_materia, id_grupo, anio_escolar)
);

-- Tabla: alumnos_grupo
CREATE TABLE IF NOT EXISTS public.alumnos_grupo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_alumno UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  id_grupo UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  anio_escolar TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id_alumno, id_grupo, anio_escolar)
);

-- PASO 6: Crear tablas de clases y guías
-- ============================================

-- Tabla: guias_tema
CREATE TABLE IF NOT EXISTS public.guias_tema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tema UUID NOT NULL REFERENCES public.temas_plan(id) ON DELETE CASCADE,
  id_profesor UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  contenido JSONB DEFAULT '{}',
  estructura_sesiones JSONB DEFAULT '[]',
  total_sesiones INTEGER DEFAULT 1,
  metodologias TEXT[],
  objetivos_generales TEXT,
  contexto_grupo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: clases
CREATE TABLE IF NOT EXISTS public.clases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tema UUID NOT NULL REFERENCES public.temas_plan(id) ON DELETE CASCADE,
  id_grupo UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  id_profesor UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  id_guia_tema UUID REFERENCES public.guias_tema(id) ON DELETE SET NULL,
  id_guia_version_actual UUID,
  numero_sesion INTEGER DEFAULT 1,
  estado estado_clase DEFAULT 'borrador',
  fecha_programada DATE,
  fecha_ejecutada DATE,
  duracion_minutos INTEGER DEFAULT 45,
  contexto TEXT,
  metodologia TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: guias_clase_versiones
CREATE TABLE IF NOT EXISTS public.guias_clase_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  version_numero INTEGER DEFAULT 1,
  contenido JSONB DEFAULT '{}',
  objetivos TEXT,
  estructura JSONB DEFAULT '{}',
  preguntas_socraticas JSONB DEFAULT '[]',
  estado TEXT DEFAULT 'borrador',
  es_version_final BOOLEAN DEFAULT false,
  generada_ia BOOLEAN DEFAULT false,
  aprobada_por UUID REFERENCES public.profesores(id),
  fecha_aprobacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar FK circular después de crear guias_clase_versiones
ALTER TABLE public.clases
DROP CONSTRAINT IF EXISTS clases_id_guia_version_actual_fkey;

ALTER TABLE public.clases
ADD CONSTRAINT clases_id_guia_version_actual_fkey 
FOREIGN KEY (id_guia_version_actual) 
REFERENCES public.guias_clase_versiones(id) ON DELETE SET NULL;

-- PASO 7: Crear tablas de evaluaciones
-- ============================================

-- Tabla: quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  tipo tipo_quiz NOT NULL,
  titulo TEXT NOT NULL,
  instrucciones TEXT,
  estado estado_quiz DEFAULT 'borrador',
  fecha_disponible TIMESTAMPTZ,
  fecha_limite TIMESTAMPTZ,
  tiempo_limite INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: preguntas
CREATE TABLE IF NOT EXISTS public.preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_quiz UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  texto_pregunta TEXT NOT NULL,
  texto_contexto TEXT,
  tipo tipo_pregunta DEFAULT 'opcion_multiple',
  opciones JSONB DEFAULT '[]',
  respuesta_correcta TEXT,
  justificacion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: respuestas_alumno
CREATE TABLE IF NOT EXISTS public.respuestas_alumno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_alumno UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  id_quiz UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  estado estado_respuesta DEFAULT 'en_progreso',
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_envio TIMESTAMPTZ,
  puntaje_total DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: respuestas_detalle
CREATE TABLE IF NOT EXISTS public.respuestas_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_respuesta_alumno UUID NOT NULL REFERENCES public.respuestas_alumno(id) ON DELETE CASCADE,
  id_pregunta UUID NOT NULL REFERENCES public.preguntas(id) ON DELETE CASCADE,
  respuesta_alumno TEXT,
  es_correcta BOOLEAN,
  tiempo_segundos INTEGER
);

-- PASO 8: Crear tablas de métricas
-- ============================================

-- Tabla: metricas_clase
CREATE TABLE IF NOT EXISTS public.metricas_clase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  tipo tipo_quiz,
  datos_estadisticos JSONB DEFAULT '{}',
  recomendaciones JSONB DEFAULT '[]',
  fecha_generacion TIMESTAMPTZ DEFAULT now()
);

-- Tabla: recomendaciones
CREATE TABLE IF NOT EXISTS public.recomendaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  id_clase_anterior UUID REFERENCES public.clases(id),
  contenido TEXT,
  aplicada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla: retroalimentaciones
CREATE TABLE IF NOT EXISTS public.retroalimentaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clase UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  id_alumno UUID REFERENCES public.alumnos(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'grupal',
  contenido TEXT,
  fortalezas JSONB DEFAULT '[]',
  areas_mejora JSONB DEFAULT '[]',
  recomendaciones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PASO 9: Crear triggers para updated_at
-- ============================================

CREATE TRIGGER update_instituciones_updated_at
  BEFORE UPDATE ON public.instituciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guias_tema_updated_at
  BEFORE UPDATE ON public.guias_tema
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clases_updated_at
  BEFORE UPDATE ON public.clases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PASO 10: Función de seguridad has_role
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para obtener institución del usuario
CREATE OR REPLACE FUNCTION public.get_user_institucion(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id_institucion FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- PASO 11: Habilitar RLS en todas las tablas
-- ============================================

ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anios_escolares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoderados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_profesor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_tema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_clase_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_alumno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retroalimentaciones ENABLE ROW LEVEL SECURITY;

-- PASO 12: Políticas RLS
-- ============================================

-- Instituciones: admin puede gestionar, otros pueden ver su institución
CREATE POLICY "Admin can manage instituciones" ON public.instituciones
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own institucion" ON public.instituciones
  FOR SELECT TO authenticated USING (id = public.get_user_institucion(auth.uid()));

-- Años escolares
CREATE POLICY "Admin can manage anios_escolares" ON public.anios_escolares
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view anios_escolares" ON public.anios_escolares
  FOR SELECT TO authenticated USING (id_institucion = public.get_user_institucion(auth.uid()));

-- Periodos académicos
CREATE POLICY "Admin can manage periodos" ON public.periodos_academicos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view periodos" ON public.periodos_academicos
  FOR SELECT TO authenticated USING (
    id_anio_escolar IN (SELECT id FROM public.anios_escolares WHERE id_institucion = public.get_user_institucion(auth.uid()))
  );

-- Configuración alertas
CREATE POLICY "Admin can manage config_alertas" ON public.configuracion_alertas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view config_alertas" ON public.configuracion_alertas
  FOR SELECT TO authenticated USING (id_institucion = public.get_user_institucion(auth.uid()));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles (solo admin puede gestionar)
CREATE POLICY "Admin can manage user_roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Profesores
CREATE POLICY "Admin can manage profesores" ON public.profesores
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can view self" ON public.profesores
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view profesores" ON public.profesores
  FOR SELECT TO authenticated USING (true);

-- Alumnos
CREATE POLICY "Admin can manage alumnos" ON public.alumnos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Alumnos can view self" ON public.alumnos
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Profesores can view alumnos" ON public.profesores
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'profesor'));

-- Apoderados
CREATE POLICY "Admin can manage apoderados" ON public.apoderados
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apoderados can view self" ON public.apoderados
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Grupos
CREATE POLICY "Admin can manage grupos" ON public.grupos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view grupos" ON public.grupos
  FOR SELECT TO authenticated USING (id_institucion = public.get_user_institucion(auth.uid()));

-- Asignaciones profesor
CREATE POLICY "Admin can manage asignaciones" ON public.asignaciones_profesor
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can view own asignaciones" ON public.asignaciones_profesor
  FOR SELECT TO authenticated USING (
    id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  );

-- Alumnos grupo
CREATE POLICY "Admin can manage alumnos_grupo" ON public.alumnos_grupo
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view alumnos_grupo" ON public.alumnos_grupo
  FOR SELECT TO authenticated USING (true);

-- Guías tema
CREATE POLICY "Admin can manage guias_tema" ON public.guias_tema
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage own guias_tema" ON public.guias_tema
  FOR ALL TO authenticated USING (
    id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view guias_tema" ON public.guias_tema
  FOR SELECT TO authenticated USING (true);

-- Clases
CREATE POLICY "Admin can manage clases" ON public.clases
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage own clases" ON public.clases
  FOR ALL TO authenticated USING (
    id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view clases" ON public.clases
  FOR SELECT TO authenticated USING (true);

-- Guías clase versiones
CREATE POLICY "Admin can manage guias_versiones" ON public.guias_clase_versiones
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage own guias_versiones" ON public.guias_clase_versiones
  FOR ALL TO authenticated USING (
    id_clase IN (SELECT id FROM public.clases WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can view guias_versiones" ON public.guias_clase_versiones
  FOR SELECT TO authenticated USING (true);

-- Quizzes
CREATE POLICY "Admin can manage quizzes" ON public.quizzes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage quizzes" ON public.quizzes
  FOR ALL TO authenticated USING (
    id_clase IN (SELECT id FROM public.clases WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid()))
  );

CREATE POLICY "Alumnos can view published quizzes" ON public.quizzes
  FOR SELECT TO authenticated USING (estado = 'publicado');

-- Preguntas
CREATE POLICY "Admin can manage preguntas" ON public.preguntas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage preguntas" ON public.preguntas
  FOR ALL TO authenticated USING (
    id_quiz IN (SELECT id FROM public.quizzes WHERE id_clase IN (SELECT id FROM public.clases WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())))
  );

CREATE POLICY "Users can view preguntas" ON public.preguntas
  FOR SELECT TO authenticated USING (true);

-- Respuestas alumno
CREATE POLICY "Admin can manage respuestas_alumno" ON public.respuestas_alumno
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Alumnos can manage own respuestas" ON public.respuestas_alumno
  FOR ALL TO authenticated USING (
    id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid())
  );

CREATE POLICY "Profesores can view respuestas" ON public.respuestas_alumno
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'profesor'));

-- Respuestas detalle
CREATE POLICY "Admin can manage respuestas_detalle" ON public.respuestas_detalle
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Alumnos can manage own respuestas_detalle" ON public.respuestas_detalle
  FOR ALL TO authenticated USING (
    id_respuesta_alumno IN (SELECT id FROM public.respuestas_alumno WHERE id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid()))
  );

CREATE POLICY "Profesores can view respuestas_detalle" ON public.respuestas_detalle
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'profesor'));

-- Métricas clase
CREATE POLICY "Admin can manage metricas" ON public.metricas_clase
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage metricas" ON public.metricas_clase
  FOR ALL TO authenticated USING (
    id_clase IN (SELECT id FROM public.clases WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can view metricas" ON public.metricas_clase
  FOR SELECT TO authenticated USING (true);

-- Recomendaciones
CREATE POLICY "Admin can manage recomendaciones" ON public.recomendaciones
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage recomendaciones" ON public.recomendaciones
  FOR ALL TO authenticated USING (
    id_clase IN (SELECT id FROM public.clases WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can view recomendaciones" ON public.recomendaciones
  FOR SELECT TO authenticated USING (true);

-- Retroalimentaciones
CREATE POLICY "Admin can manage retroalimentaciones" ON public.retroalimentaciones
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profesores can manage retroalimentaciones" ON public.retroalimentaciones
  FOR ALL TO authenticated USING (
    id_clase IN (SELECT id FROM public.clases WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid()))
  );

CREATE POLICY "Alumnos can view own retroalimentaciones" ON public.retroalimentaciones
  FOR SELECT TO authenticated USING (
    id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid()) OR tipo = 'grupal'
  );

-- PASO 13: Crear índices para rendimiento
-- ============================================

CREATE INDEX IF NOT EXISTS idx_anios_escolares_institucion ON public.anios_escolares(id_institucion);
CREATE INDEX IF NOT EXISTS idx_periodos_anio ON public.periodos_academicos(id_anio_escolar);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_institucion ON public.profiles(id_institucion);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_grupos_institucion ON public.grupos(id_institucion);
CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor ON public.asignaciones_profesor(id_profesor);
CREATE INDEX IF NOT EXISTS idx_asignaciones_materia ON public.asignaciones_profesor(id_materia);
CREATE INDEX IF NOT EXISTS idx_asignaciones_grupo ON public.asignaciones_profesor(id_grupo);
CREATE INDEX IF NOT EXISTS idx_clases_tema ON public.clases(id_tema);
CREATE INDEX IF NOT EXISTS idx_clases_grupo ON public.clases(id_grupo);
CREATE INDEX IF NOT EXISTS idx_clases_profesor ON public.clases(id_profesor);
CREATE INDEX IF NOT EXISTS idx_clases_estado ON public.clases(estado);
CREATE INDEX IF NOT EXISTS idx_quizzes_clase ON public.quizzes(id_clase);
CREATE INDEX IF NOT EXISTS idx_preguntas_quiz ON public.preguntas(id_quiz);
CREATE INDEX IF NOT EXISTS idx_respuestas_alumno_quiz ON public.respuestas_alumno(id_quiz);
CREATE INDEX IF NOT EXISTS idx_respuestas_alumno_alumno ON public.respuestas_alumno(id_alumno);

-- PASO 14: Insertar datos sintéticos
-- ============================================

-- Institución demo
INSERT INTO public.instituciones (id, nombre, logo, configuracion) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Colegio EduThink Demo',
  null,
  '{"tema": "moderno", "idioma": "es"}'
) ON CONFLICT DO NOTHING;

-- Actualizar planes existentes con la institución demo
UPDATE public.planes_anuales 
SET id_institucion = '00000000-0000-0000-0000-000000000001' 
WHERE id_institucion IS NULL;

-- Configuración de alertas
INSERT INTO public.configuracion_alertas (id_institucion, dias_urgente, dias_proxima, dias_programada, dias_lejana)
VALUES ('00000000-0000-0000-0000-000000000001', 2, 5, 10, 20)
ON CONFLICT (id_institucion) DO NOTHING;

-- Año escolar activo
INSERT INTO public.anios_escolares (id, id_institucion, anio_escolar, fecha_inicio, fecha_fin, activo)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '2024-2025',
  '2024-03-01',
  '2024-12-15',
  true
) ON CONFLICT DO NOTHING;

-- Periodos académicos (4 bimestres)
INSERT INTO public.periodos_academicos (id, id_anio_escolar, nombre, numero, fecha_inicio, fecha_fin, activo) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Bimestre 1', 1, '2024-03-01', '2024-05-15', false),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Bimestre 2', 2, '2024-05-16', '2024-07-31', false),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Bimestre 3', 3, '2024-08-01', '2024-10-15', true),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Bimestre 4', 4, '2024-10-16', '2024-12-15', false)
ON CONFLICT DO NOTHING;

-- Grupos (salones)
INSERT INTO public.grupos (id, id_institucion, nombre, grado, seccion, cantidad_alumnos, perfil) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '5to A', '5to Primaria', 'A', 28, '{"nivel_promedio": "medio-alto", "caracteristicas": ["participativos", "creativos"]}'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '5to B', '5to Primaria', 'B', 25, '{"nivel_promedio": "medio", "caracteristicas": ["colaborativos", "visuales"]}'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '6to A', '6to Primaria', 'A', 30, '{"nivel_promedio": "alto", "caracteristicas": ["analíticos", "competitivos"]}'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '4to A', '4to Primaria', 'A', 26, '{"nivel_promedio": "medio", "caracteristicas": ["activos", "curiosos"]}')
ON CONFLICT DO NOTHING;

-- Profesor demo (sin user_id, será asignado cuando alguien se registre)
INSERT INTO public.profesores (id, user_id, especialidad, activo)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  null,
  'Matemáticas y Ciencias',
  true
) ON CONFLICT DO NOTHING;

-- Alumnos demo
INSERT INTO public.alumnos (id, user_id, grado, seccion, edad, caracteristicas) VALUES
('00000000-0000-0000-0000-000000000030', null, '5to Primaria', 'A', 10, '{"estilo_aprendizaje": "visual", "fortalezas": ["matemáticas"]}'),
('00000000-0000-0000-0000-000000000031', null, '5to Primaria', 'A', 11, '{"estilo_aprendizaje": "kinestésico", "fortalezas": ["ciencias"]}'),
('00000000-0000-0000-0000-000000000032', null, '5to Primaria', 'A', 10, '{"estilo_aprendizaje": "auditivo", "fortalezas": ["lectura"]}'),
('00000000-0000-0000-0000-000000000033', null, '5to Primaria', 'B', 10, '{"estilo_aprendizaje": "visual", "fortalezas": ["arte"]}'),
('00000000-0000-0000-0000-000000000034', null, '5to Primaria', 'B', 11, '{"estilo_aprendizaje": "kinestésico", "fortalezas": ["deportes"]}')
ON CONFLICT DO NOTHING;

-- Asignar alumnos a grupos
INSERT INTO public.alumnos_grupo (id_alumno, id_grupo, anio_escolar) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '2024-2025'),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', '2024-2025'),
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000010', '2024-2025'),
('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000011', '2024-2025'),
('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000011', '2024-2025')
ON CONFLICT DO NOTHING;

-- Actualizar temas existentes con bimestre
UPDATE public.temas_plan SET bimestre = 1 WHERE bimestre IS NULL;
