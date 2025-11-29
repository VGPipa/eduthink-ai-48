-- Drop the texto_contexto column from preguntas table
ALTER TABLE public.preguntas DROP COLUMN IF EXISTS texto_contexto;