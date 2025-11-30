-- Eliminar columna estimulo_aprendizaje de la tabla quizzes
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS estimulo_aprendizaje;