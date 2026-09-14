-- ==============================================================================
-- Migración: add_ai_ability_analysis_cache_v2
-- PokeGuide AI — Fase 3: Contextos competitivos + Cache V2
-- ==============================================================================

-- 1. Añadir columnas de contexto competitivo preservando los registros de V1
ALTER TABLE public.ai_ability_analysis_cache
ADD COLUMN IF NOT EXISTS context TEXT NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS regulation TEXT DEFAULT NULL;

-- 2. Asegurar que los registros existentes se traten explícitamente como contexto 'general'
UPDATE public.ai_ability_analysis_cache
SET context = 'general'
WHERE context IS NULL;

-- 3. Restricción de validación para contextos competitivos soportados
ALTER TABLE public.ai_ability_analysis_cache
DROP CONSTRAINT IF EXISTS ai_cache_context_check;

ALTER TABLE public.ai_ability_analysis_cache
ADD CONSTRAINT ai_cache_context_check
CHECK (context IN ('general', 'showdown', 'champions'));

-- 4. Actualizar la identidad única del caché (Caché V2)
-- Se elimina la restricción única de V1 (pokemon_id, ability_id, user_level, locale)
ALTER TABLE public.ai_ability_analysis_cache
DROP CONSTRAINT IF EXISTS unique_ability_analysis_context;

ALTER TABLE public.ai_ability_analysis_cache
DROP CONSTRAINT IF EXISTS unique_ability_analysis_context_v2;

-- Restricción UNIQUE NULLS NOT DISTINCT (PostgreSQL 15+) para unicidad determinista con valores NULL
ALTER TABLE public.ai_ability_analysis_cache
ADD CONSTRAINT unique_ability_analysis_context_v2
UNIQUE NULLS NOT DISTINCT (
  pokemon_id,
  ability_id,
  user_level,
  locale,
  context,
  format,
  regulation
);

-- 5. Índice de consulta optimizado para búsquedas contextuales
DROP INDEX IF EXISTS public.idx_ai_ability_cache_lookup;
DROP INDEX IF EXISTS public.idx_ai_ability_cache_lookup_v2;

CREATE INDEX idx_ai_ability_cache_lookup_v2
ON public.ai_ability_analysis_cache (
  pokemon_id,
  ability_id,
  user_level,
  locale,
  context
);

-- 6. Actualización del comentario de la tabla
COMMENT ON TABLE public.ai_ability_analysis_cache IS 'Caché compartido global de análisis de habilidades tácticas de PokeGuide AI V2, indexado por identidad completa (Pokémon, habilidad, nivel, idioma, plataforma/contexto, formato y regulación).';
