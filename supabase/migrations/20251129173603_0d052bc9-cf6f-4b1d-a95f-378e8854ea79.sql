-- Actualizar el trigger handle_new_user para leer el rol desde metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  
  -- Crear profile
  INSERT INTO public.profiles (user_id, email, nombre, apellido, id_institucion)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'apellido',
    '00000000-0000-0000-0000-000000000001' -- Institución demo por defecto
  );
  
  -- Asignar rol según selección del usuario
  IF _role IN ('admin', 'profesor', 'alumno', 'apoderado') THEN
    INSERT INTO public.user_roles (user_id, role, id_institucion)
    VALUES (NEW.id, _role::app_role, '00000000-0000-0000-0000-000000000001');
    
    -- Crear registro en tabla específica del rol
    IF _role = 'profesor' THEN
      INSERT INTO public.profesores (user_id) VALUES (NEW.id);
    ELSIF _role = 'alumno' THEN
      INSERT INTO public.alumnos (user_id) VALUES (NEW.id);
    ELSIF _role = 'apoderado' THEN
      INSERT INTO public.apoderados (user_id) VALUES (NEW.id);
    END IF;
  ELSE
    -- Si no hay rol especificado, asignar admin por defecto (compatibilidad)
    INSERT INTO public.user_roles (user_id, role, id_institucion)
    VALUES (NEW.id, 'admin', '00000000-0000-0000-0000-000000000001');
  END IF;
  
  RETURN NEW;
END;
$$;