-- First drop the existing RLS policies that depend on id_clase
DROP POLICY IF EXISTS "Admin can manage recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Profesores can manage recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Users can view recomendaciones" ON public.recomendaciones;

-- Add id_quiz column
ALTER TABLE public.recomendaciones 
ADD COLUMN id_quiz uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- Now drop the old columns
ALTER TABLE public.recomendaciones 
DROP COLUMN id_clase,
DROP COLUMN id_clase_anterior,
DROP COLUMN aplicada;

-- Create new RLS policies
CREATE POLICY "Admin can manage recomendaciones" 
ON public.recomendaciones 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Profesores can manage recomendaciones" 
ON public.recomendaciones 
FOR ALL 
USING (id_quiz IN (
  SELECT q.id FROM quizzes q
  WHERE q.id_clase IN (
    SELECT c.id FROM clases c
    WHERE c.id_profesor IN (
      SELECT p.id FROM profesores p
      WHERE p.user_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can view recomendaciones" 
ON public.recomendaciones 
FOR SELECT 
USING (true);