-- Create enum for plan status
CREATE TYPE public.plan_estado AS ENUM ('activo', 'borrador', 'pendiente');

-- Create planes_anuales table
CREATE TABLE public.planes_anuales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grado TEXT NOT NULL,
  anio TEXT NOT NULL,
  estado plan_estado NOT NULL DEFAULT 'pendiente',
  descripcion TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grado, anio)
);

-- Create cursos_plan table
CREATE TABLE public.cursos_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.planes_anuales(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  objetivos TEXT,
  horas_semanales INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create temas_plan table
CREATE TABLE public.temas_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_plan_id UUID NOT NULL REFERENCES public.cursos_plan(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  duracion_semanas INTEGER,
  estandares TEXT[],
  competencias TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.planes_anuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temas_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies for planes_anuales (admin only)
CREATE POLICY "Admin users can view all plans"
  ON public.planes_anuales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert plans"
  ON public.planes_anuales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update plans"
  ON public.planes_anuales FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can delete plans"
  ON public.planes_anuales FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for cursos_plan
CREATE POLICY "Admin users can view all cursos"
  ON public.cursos_plan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert cursos"
  ON public.cursos_plan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update cursos"
  ON public.cursos_plan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can delete cursos"
  ON public.cursos_plan FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for temas_plan
CREATE POLICY "Admin users can view all temas"
  ON public.temas_plan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert temas"
  ON public.temas_plan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update temas"
  ON public.temas_plan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can delete temas"
  ON public.temas_plan FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_cursos_plan_plan_id ON public.cursos_plan(plan_id);
CREATE INDEX idx_temas_plan_curso_id ON public.temas_plan(curso_plan_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_planes_anuales_updated_at
  BEFORE UPDATE ON public.planes_anuales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cursos_plan_updated_at
  BEFORE UPDATE ON public.cursos_plan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_temas_plan_updated_at
  BEFORE UPDATE ON public.temas_plan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();