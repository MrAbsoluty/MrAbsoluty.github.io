-- ================================================================
-- PokeGuide - Esquema de Base de Datos para Supabase
-- Tabla: profiles, RLS y Trigger updated_at
-- ================================================================

-- 1. Crear tabla public.profiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  username_normalized TEXT GENERATED ALWAYS AS (LOWER(TRIM(username))) STORED,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Validaciones de integridad en la base de datos
  CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT unique_username_normalized UNIQUE (username_normalized)
);

-- Comentario descriptivo de la tabla
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario de PokeGuide con nombres de usuario únicos insensibles a mayúsculas/minúsculas.';

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad (RLS)

-- Política 1: Lectura pública (SELECT)
-- Permite comprobar la disponibilidad de nombres de usuario y consultar perfiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Política 2: Inserción restringida (INSERT)
-- Los usuarios autenticados solo pueden crear su propio perfil coincidiendo con su auth.uid()
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política 3: Modificación restringida (UPDATE)
-- Los usuarios autenticados solo pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Función y Trigger para mantener actualizado el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
