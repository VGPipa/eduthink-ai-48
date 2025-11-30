-- Add new columns to recomendaciones table for richer recommendation data
ALTER TABLE public.recomendaciones ADD COLUMN IF NOT EXISTS titulo text;
ALTER TABLE public.recomendaciones ADD COLUMN IF NOT EXISTS tipo text; -- metodologia, contenido, actividad, seguimiento
ALTER TABLE public.recomendaciones ADD COLUMN IF NOT EXISTS prioridad text; -- alta, media, baja
ALTER TABLE public.recomendaciones ADD COLUMN IF NOT EXISTS momento text; -- durante_clase, proxima_sesion
ALTER TABLE public.recomendaciones ADD COLUMN IF NOT EXISTS concepto_relacionado text;
ALTER TABLE public.recomendaciones ADD COLUMN IF NOT EXISTS analisis_general jsonb;