-- Agregar campo 'concepto' a la tabla preguntas para métricas de "Mis Salones"
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS concepto TEXT;

-- Crear índice para mejorar consultas por concepto
CREATE INDEX IF NOT EXISTS idx_preguntas_concepto ON preguntas(concepto);

-- Comentario explicativo
COMMENT ON COLUMN preguntas.concepto IS 'Concepto evaluado por la pregunta, usado para métricas de refuerzo';

