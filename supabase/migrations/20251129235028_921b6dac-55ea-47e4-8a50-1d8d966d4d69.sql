-- Renombrar tabla respuestas_alumno a nota_alumno
ALTER TABLE public.respuestas_alumno RENAME TO nota_alumno;

-- Renombrar las foreign keys para reflejar el nuevo nombre
ALTER TABLE public.nota_alumno 
  RENAME CONSTRAINT respuestas_alumno_id_alumno_fkey TO nota_alumno_id_alumno_fkey;

ALTER TABLE public.nota_alumno 
  RENAME CONSTRAINT respuestas_alumno_id_quiz_fkey TO nota_alumno_id_quiz_fkey;

-- Actualizar la foreign key en respuestas_detalle
ALTER TABLE public.respuestas_detalle 
  RENAME CONSTRAINT respuestas_detalle_id_respuesta_alumno_fkey TO respuestas_detalle_id_nota_alumno_fkey;

-- Renombrar la columna en respuestas_detalle
ALTER TABLE public.respuestas_detalle 
  RENAME COLUMN id_respuesta_alumno TO id_nota_alumno;

-- Actualizar RLS policies - primero eliminar las existentes
DROP POLICY IF EXISTS "Admin can manage respuestas_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Alumnos can manage own respuestas" ON public.nota_alumno;
DROP POLICY IF EXISTS "Profesores can view respuestas" ON public.nota_alumno;

-- Recrear policies con nombres actualizados
CREATE POLICY "Admin can manage nota_alumno" 
ON public.nota_alumno 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Alumnos can manage own nota_alumno" 
ON public.nota_alumno 
FOR ALL 
USING (id_alumno IN (SELECT id FROM alumnos WHERE user_id = auth.uid()));

CREATE POLICY "Profesores can view nota_alumno" 
ON public.nota_alumno 
FOR SELECT 
USING (has_role(auth.uid(), 'profesor'::app_role));

-- Actualizar policies de respuestas_detalle para usar el nuevo nombre de columna
DROP POLICY IF EXISTS "Alumnos can manage own respuestas_detalle" ON public.respuestas_detalle;

CREATE POLICY "Alumnos can manage own respuestas_detalle" 
ON public.respuestas_detalle 
FOR ALL 
USING (id_nota_alumno IN (
  SELECT id FROM nota_alumno WHERE id_alumno IN (
    SELECT id FROM alumnos WHERE user_id = auth.uid()
  )
));