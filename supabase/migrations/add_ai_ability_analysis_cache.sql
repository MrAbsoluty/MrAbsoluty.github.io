-- ==============================================================================
-- Migración: add_ai_ability_analysis_cache
-- PokeGuide AI — Fase 2: Caché Compartido de Análisis de Habilidades
-- ==============================================================================

-- 1. Crear tabla public.ai_ability_analysis_cache
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

  -- Restricción UNIQUE para evitar duplicados en el mismo contexto analizado
  CONSTRAINT unique_ability_analysis_context UNIQUE (pokemon_id, ability_id, user_level, locale),

  -- Validación de nivel de usuario
  CONSTRAINT ai_cache_user_level_check CHECK (user_level IN ('beginner', 'intermediate', 'advanced', 'competitive'))
);

-- Comentario descriptivo de la tabla
COMMENT ON TABLE public.ai_ability_analysis_cache IS 'Caché compartido global de análisis de habilidades tácticas de PokeGuide AI, indexado por contexto (Pokémon, habilidad, nivel e idioma).';

-- 2. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_ai_ability_cache_lookup 
ON public.ai_ability_analysis_cache (pokemon_id, ability_id, user_level, locale);

CREATE INDEX IF NOT EXISTS idx_ai_ability_cache_expires 
ON public.ai_ability_analysis_cache (expires_at);

-- 3. Trigger para actualización automática de updated_at
DROP TRIGGER IF EXISTS update_ai_ability_cache_updated_at ON public.ai_ability_analysis_cache;
CREATE TRIGGER update_ai_ability_cache_updated_at
BEFORE UPDATE ON public.ai_ability_analysis_cache
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.ai_ability_analysis_cache ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Seguridad (RLS)
-- Lectura pública para cualquier cliente autenticado o anónimo sobre análisis vigentes
DROP POLICY IF EXISTS "Public read for valid non-expired cache" ON public.ai_ability_analysis_cache;
CREATE POLICY "Public read for valid non-expired cache"
ON public.ai_ability_analysis_cache FOR SELECT
USING (expires_at > timezone('utc'::text, now()));

-- Nota: Las inserciones y actualizaciones se gestionan exclusivamente desde la Edge Function
-- mediante la clave de servicio (service_role), la cual sobrepasa RLS de manera segura.
