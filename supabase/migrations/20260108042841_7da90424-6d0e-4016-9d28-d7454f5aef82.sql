
-- Crear planes anuales para 2do y 3ro Secundaria
INSERT INTO planes_anuales (grado, anio, estado, descripcion, id_institucion, created_by)
VALUES 
  ('2do Secundaria', '2025', 'pendiente', 'Plan anual 2do Secundaria 2025', '00000000-0000-0000-0000-000000000001', '66897c77-121f-409f-850a-786c235b845d'),
  ('3ro Secundaria', '2025', 'pendiente', 'Plan anual 3ro Secundaria 2025', '00000000-0000-0000-0000-000000000001', '66897c77-121f-409f-850a-786c235b845d');

-- Crear cursos de Comunicación para cada plan de Secundaria
INSERT INTO cursos_plan (plan_id, nombre, descripcion, objetivos, horas_semanales, orden)
SELECT pa.id, 'Comunicación', 
  'Curso de Lenguaje y Comunicación para Secundaria', 
  'Desarrollar competencias comunicativas orales y escritas',
  6, 1
FROM planes_anuales pa
WHERE pa.grado IN ('2do Secundaria', '3ro Secundaria', '4to Secundaria')
AND pa.anio = '2025'
AND NOT EXISTS (
  SELECT 1 FROM cursos_plan cp WHERE cp.plan_id = pa.id AND cp.nombre = 'Comunicación'
);

-- Crear grupos para 2do y 3ro Secundaria
INSERT INTO grupos (nombre, grado, seccion, id_institucion, cantidad_alumnos)
VALUES 
  ('2do Secundaria A', '2do Secundaria', 'A', '00000000-0000-0000-0000-000000000001', 25),
  ('3ro Secundaria A', '3ro Secundaria', 'A', '00000000-0000-0000-0000-000000000001', 25);

-- Agregar "Computadoras" al catálogo de materiales
INSERT INTO catalogo_materiales (nombre, icono, orden) 
VALUES ('Computadoras', 'laptop', 0);

-- Asignar cursos de Comunicación al profesor docente@gmail.com
INSERT INTO asignaciones_profesor (id_profesor, id_materia, id_grupo, anio_escolar)
SELECT 
  '66897c77-121f-409f-850a-786c235b845d',
  cp.id,
  g.id,
  '2025'
FROM cursos_plan cp
JOIN planes_anuales pa ON cp.plan_id = pa.id
JOIN grupos g ON g.grado = pa.grado
WHERE cp.nombre = 'Comunicación'
AND pa.grado IN ('2do Secundaria', '3ro Secundaria', '4to Secundaria')
AND pa.anio = '2025'
AND NOT EXISTS (
  SELECT 1 FROM asignaciones_profesor ap 
  WHERE ap.id_profesor = '66897c77-121f-409f-850a-786c235b845d' 
  AND ap.id_materia = cp.id 
  AND ap.id_grupo = g.id
);
