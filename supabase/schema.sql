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
  ai_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Validaciones de integridad en la base de datos
  CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT unique_username_normalized UNIQUE (username_normalized),
  CONSTRAINT profiles_ai_level_check CHECK (ai_level IN ('beginner', 'intermediate', 'advanced', 'competitive'))
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

-- ================================================================
-- Tabla: ai_ability_analysis_cache (PokeGuide AI - Fase 2)
-- Caché compartido global indexado por contexto competitivo
-- ================================================================

CREATE TABLE IF NOT EXISTS public.ai_ability_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pokemon_id TEXT NOT NULL,
  ability_id TEXT NOT NULL,
  user_level TEXT NOT NULL,
  locale TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  validation_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT unique_ability_analysis_context UNIQUE (pokemon_id, ability_id, user_level, locale),
  CONSTRAINT ai_cache_user_level_check CHECK (user_level IN ('beginner', 'intermediate', 'advanced', 'competitive'))
);

COMMENT ON TABLE public.ai_ability_analysis_cache IS 'Caché compartido global de análisis de habilidades tácticas de PokeGuide AI, indexado por contexto (Pokémon, habilidad, nivel e idioma).';

CREATE INDEX IF NOT EXISTS idx_ai_ability_cache_lookup 
ON public.ai_ability_analysis_cache (pokemon_id, ability_id, user_level, locale);

CREATE INDEX IF NOT EXISTS idx_ai_ability_cache_expires 
ON public.ai_ability_analysis_cache (expires_at);

DROP TRIGGER IF EXISTS update_ai_ability_cache_updated_at ON public.ai_ability_analysis_cache;
CREATE TRIGGER update_ai_ability_cache_updated_at
BEFORE UPDATE ON public.ai_ability_analysis_cache
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.ai_ability_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for valid non-expired cache"
ON public.ai_ability_analysis_cache FOR SELECT
USING (expires_at > timezone('utc'::text, now()));

