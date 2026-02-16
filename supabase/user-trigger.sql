-- =============================================================================
-- TRIGGER PARA CREAR USUARIO AUTOMÁTICAMENTE EN public.users
-- =============================================================================
-- Este trigger crea automáticamente un registro en public.users
-- cuando un nuevo usuario se registra en auth.users (incluyendo OAuth)
--
-- NOTA: auth.users.id es UUID, public.users.id es TEXT (Prisma CUID)
-- NOTA: roles es tipo UserRole[] (enum), no text[]
-- =============================================================================

-- Primero, verificar que el enum UserRole existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'HOST', 'DRIVER', 'ADMIN');
  END IF;
END
$$;

-- Función para crear el usuario en public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, "fullName", roles, "kycStatus", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    ARRAY['USER'::"UserRole", 'DRIVER'::"UserRole"],
    'PENDING'::"KYCStatus",
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Eliminar trigger existente si hay
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- CREAR USUARIOS EXISTENTES QUE FALTAN
-- =============================================================================

INSERT INTO public.users (id, email, "fullName", roles, "kycStatus", "createdAt", "updatedAt")
SELECT
  u.id::text,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  ARRAY['USER'::"UserRole", 'DRIVER'::"UserRole"],
  'PENDING'::"KYCStatus",
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = u.id::text
);

-- =============================================================================
-- VERIFICAR RESULTADO
-- =============================================================================

-- Mostrar usuarios en auth que no tienen perfil
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN pu.id IS NULL THEN 'FALTA PERFIL' ELSE 'OK' END as status
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id::text
ORDER BY u.created_at DESC;
