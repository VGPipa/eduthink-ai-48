
-- Crear trigger para auto-crear profile y asignar rol admin al primer usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear profile
  INSERT INTO public.profiles (user_id, email, nombre, apellido, id_institucion)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'apellido',
    '00000000-0000-0000-0000-000000000001' -- Institución demo por defecto
  );
  
  -- Asignar rol admin por defecto (para desarrollo)
  INSERT INTO public.user_roles (user_id, role, id_institucion)
  VALUES (NEW.id, 'admin', '00000000-0000-0000-0000-000000000001');
  
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Agregar política para que usuarios autenticados puedan insertar su propio profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
