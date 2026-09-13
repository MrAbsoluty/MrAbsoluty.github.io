-- ================================================================
-- PokeGuide - Migración: Agregar ai_level a public.profiles
-- ================================================================

-- 1. Agregar columna ai_level a public.profiles si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_level TEXT DEFAULT 'beginner';

-- 2. Asegurar restricción de valores válidos para ai_level
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_ai_level_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_ai_level_check 
CHECK (ai_level IN ('beginner', 'intermediate', 'advanced', 'competitive'));

-- 3. Comentario explicativo en la columna
COMMENT ON COLUMN public.profiles.ai_level IS 'Nivel de análisis de IA para adaptar profundidad y terminología: beginner, intermediate, advanced, competitive';
