-- Add estimulo_aprendizaje column to quizzes table for pre-quiz learning stimulus
ALTER TABLE public.quizzes 
ADD COLUMN estimulo_aprendizaje JSONB DEFAULT NULL;

-- Add feedback_acierto column to preguntas table for positive feedback
ALTER TABLE public.preguntas 
ADD COLUMN feedback_acierto TEXT DEFAULT NULL;

-- Add comment to document the estimulo_aprendizaje structure
COMMENT ON COLUMN public.quizzes.estimulo_aprendizaje IS 'JSON structure: {titulo, texto_contenido, descripcion_visual, tiempo_lectura_estimado}';

-- Add comment to document the feedback_acierto
COMMENT ON COLUMN public.preguntas.feedback_acierto IS 'Positive feedback shown when student answers correctly';