-- Agregar columnas nombre y apellido a la tabla alumnos
ALTER TABLE public.alumnos 
ADD COLUMN IF NOT EXISTS nombre TEXT,
ADD COLUMN IF NOT EXISTS apellido TEXT;