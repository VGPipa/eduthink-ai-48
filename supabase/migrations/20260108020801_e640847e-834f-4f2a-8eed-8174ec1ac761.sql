-- =============================================
-- FASE 1: Crear Tablas de Catálogos Curriculares
-- =============================================

-- Tabla de Competencias
CREATE TABLE catalogo_competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_curricular TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ciclo TEXT[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Capacidades (relacionada a Competencias)
CREATE TABLE catalogo_capacidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_competencia UUID REFERENCES catalogo_competencias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Desempeños (relacionada a Capacidades + Grado)
CREATE TABLE catalogo_desempenos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_capacidad UUID REFERENCES catalogo_capacidades(id) ON DELETE CASCADE,
  grado TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Enfoques Transversales
CREATE TABLE catalogo_enfoques_transversales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  valores TEXT[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Materiales
CREATE TABLE catalogo_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  icono TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true
);

-- Tabla de Adaptaciones NEE
CREATE TABLE catalogo_adaptaciones_nee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  recomendaciones_ia TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true
);

-- =============================================
-- FASE 2: Políticas RLS para Catálogos
-- =============================================

-- Competencias
ALTER TABLE catalogo_competencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogo_competencias" ON catalogo_competencias FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalogo_competencias" ON catalogo_competencias FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Capacidades
ALTER TABLE catalogo_capacidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogo_capacidades" ON catalogo_capacidades FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalogo_capacidades" ON catalogo_capacidades FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Desempeños
ALTER TABLE catalogo_desempenos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogo_desempenos" ON catalogo_desempenos FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalogo_desempenos" ON catalogo_desempenos FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enfoques Transversales
ALTER TABLE catalogo_enfoques_transversales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogo_enfoques" ON catalogo_enfoques_transversales FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalogo_enfoques" ON catalogo_enfoques_transversales FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Materiales
ALTER TABLE catalogo_materiales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogo_materiales" ON catalogo_materiales FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalogo_materiales" ON catalogo_materiales FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Adaptaciones NEE
ALTER TABLE catalogo_adaptaciones_nee ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalogo_adaptaciones_nee" ON catalogo_adaptaciones_nee FOR SELECT USING (true);
CREATE POLICY "Admin can manage catalogo_adaptaciones_nee" ON catalogo_adaptaciones_nee FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FASE 3: Agregar Columnas a Tablas Existentes
-- =============================================

-- Columnas para tabla clases
ALTER TABLE clases
ADD COLUMN IF NOT EXISTS id_competencia UUID REFERENCES catalogo_competencias(id),
ADD COLUMN IF NOT EXISTS id_capacidad UUID REFERENCES catalogo_capacidades(id),
ADD COLUMN IF NOT EXISTS id_desempeno UUID REFERENCES catalogo_desempenos(id),
ADD COLUMN IF NOT EXISTS id_enfoque_transversal UUID REFERENCES catalogo_enfoques_transversales(id),
ADD COLUMN IF NOT EXISTS materiales_seleccionados TEXT[],
ADD COLUMN IF NOT EXISTS adaptaciones_nee TEXT[],
ADD COLUMN IF NOT EXISTS contexto_adaptaciones TEXT;

-- Columnas para tabla grupos
ALTER TABLE grupos
ADD COLUMN IF NOT EXISTS adaptaciones_nee_predeterminadas TEXT[],
ADD COLUMN IF NOT EXISTS contexto_nee TEXT;

-- =============================================
-- FASE 4: Población de Datos
-- =============================================

-- Competencias de Comunicación
INSERT INTO catalogo_competencias (area_curricular, nombre, ciclo) VALUES
('Comunicación', 'Se comunica oralmente en su lengua materna', ARRAY['VI','VII']),
('Comunicación', 'Lee diversos tipos de textos escritos en su lengua materna', ARRAY['VI','VII']),
('Comunicación', 'Escribe diversos tipos de textos en su lengua materna', ARRAY['VI','VII']);

-- Capacidades para "Se comunica oralmente en su lengua materna"
INSERT INTO catalogo_capacidades (id_competencia, nombre) VALUES
((SELECT id FROM catalogo_competencias WHERE nombre = 'Se comunica oralmente en su lengua materna'), 'Obtiene información del texto oral'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Se comunica oralmente en su lengua materna'), 'Infiere e interpreta información del texto oral'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Se comunica oralmente en su lengua materna'), 'Adecúa, organiza y desarrolla las ideas de forma coherente y cohesionada'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Se comunica oralmente en su lengua materna'), 'Utiliza recursos no verbales y paraverbales de forma estratégica'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Se comunica oralmente en su lengua materna'), 'Interactúa estratégicamente con distintos interlocutores'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Se comunica oralmente en su lengua materna'), 'Reflexiona y evalúa la forma, el contenido y contexto del texto oral');

-- Capacidades para "Lee diversos tipos de textos escritos en su lengua materna"
INSERT INTO catalogo_capacidades (id_competencia, nombre) VALUES
((SELECT id FROM catalogo_competencias WHERE nombre = 'Lee diversos tipos de textos escritos en su lengua materna'), 'Obtiene información del texto escrito'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Lee diversos tipos de textos escritos en su lengua materna'), 'Infiere e interpreta información del texto'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Lee diversos tipos de textos escritos en su lengua materna'), 'Reflexiona y evalúa la forma, el contenido y contexto del texto');

-- Capacidades para "Escribe diversos tipos de textos en su lengua materna"
INSERT INTO catalogo_capacidades (id_competencia, nombre) VALUES
((SELECT id FROM catalogo_competencias WHERE nombre = 'Escribe diversos tipos de textos en su lengua materna'), 'Adecúa el texto a la situación comunicativa'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Escribe diversos tipos de textos en su lengua materna'), 'Organiza y desarrolla las ideas de forma coherente y cohesionada'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Escribe diversos tipos de textos en su lengua materna'), 'Utiliza convenciones del lenguaje escrito de forma pertinente'),
((SELECT id FROM catalogo_competencias WHERE nombre = 'Escribe diversos tipos de textos en su lengua materna'), 'Reflexiona y evalúa la forma, el contenido y contexto del texto escrito');

-- Enfoques Transversales del CNEB
INSERT INTO catalogo_enfoques_transversales (nombre, valores) VALUES
('Enfoque de derechos', ARRAY['Conciencia de derechos', 'Libertad y responsabilidad', 'Diálogo y concertación']),
('Enfoque inclusivo o de Atención a la diversidad', ARRAY['Respeto por las diferencias', 'Equidad en la enseñanza', 'Confianza en la persona']),
('Enfoque intercultural', ARRAY['Respeto a la identidad cultural', 'Justicia', 'Diálogo intercultural']),
('Enfoque de igualdad de género', ARRAY['Igualdad y Dignidad', 'Justicia', 'Empatía']),
('Enfoque ambiental', ARRAY['Solidaridad planetaria', 'Justicia y solidaridad', 'Respeto a toda forma de vida']),
('Enfoque de orientación al bien común', ARRAY['Equidad y justicia', 'Solidaridad', 'Empatía', 'Responsabilidad']),
('Enfoque de búsqueda de la excelencia', ARRAY['Flexibilidad y apertura', 'Superación personal']);

-- Materiales disponibles
INSERT INTO catalogo_materiales (nombre, icono, orden) VALUES
('Proyector / TV', 'monitor', 1),
('Patio / espacio libre', 'trees', 2),
('Material impreso', 'file-text', 3),
('Computador / Celular', 'smartphone', 4),
('Pizarra', 'square', 5);

-- Adaptaciones NEE
INSERT INTO catalogo_adaptaciones_nee (codigo, nombre, recomendaciones_ia, orden) VALUES
('TDA', 'Trastorno por Déficit de Atención', 'Incluir actividades cortas, pausas frecuentes, instrucciones claras y concisas, retroalimentación inmediata', 1),
('TDAH', 'Trastorno por Déficit de Atención e Hiperactividad', 'Incluir movimiento en actividades, cambios frecuentes de dinámica, tareas manuales, espacios para energía física', 2),
('TEA', 'Trastorno del Espectro Autista', 'Usar rutinas predecibles, anticipar cambios, incluir apoyo visual, evitar sobreestimulación sensorial', 3),
('DOWN', 'Síndrome de Down', 'Usar lenguaje simple, material concreto, repetición, actividades multisensoriales, tiempo adicional', 4);