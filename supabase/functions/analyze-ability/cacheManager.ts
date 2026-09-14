/**
 * cacheManager.ts
 * Gestor del Caché Compartido de Análisis de Habilidades para PokeGuide AI (Cache V3 — Progressive).
 *
 * Implementa una política Cache-First con:
 * - TTL configurable (por defecto 30 días)
 * - Identidad estricta: pokemon_id, ability_id, user_level, locale, context, format, regulation
 * - Control de versiones de validación (validation_version 'v3' para contrato progresivo,
 *   con compatibilidad 'v1'/'v2' para contexto 'general' legacy)
 * - Prevención de condiciones de carrera con UPSERT
 * - Verificación integral previa de esquema y hechos antes de retornar un HIT
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateAbilityAnalysis } from './promptBuilder.ts'
import { validateAndCorrectFacts, type FactCheckResult } from './factValidator.ts'
import { type VerifiedAbilityFacts } from './knowledgeLayer.ts'

// Configuración centralizada de TTL y versión de validación
export const AI_CACHE_TTL_DAYS = 30
export const CURRENT_VALIDATION_VERSION = 'v3'

export interface CacheLookupParams {
  pokemonId: string
  abilityId: string
  userLevel: string
  locale: string
  context?: string
  format?: string | null
  regulation?: string | null
}

export interface CacheSaveParams extends CacheLookupParams {
  analysisJson: Record<string, unknown>
  provider: string
  model: string
  ttlDays?: number
  validationVersion?: string
}

export interface CacheLookupResult {
  hit: boolean
  reason?: 'not_found' | 'expired' | 'version_mismatch' | 'invalid_schema' | 'fact_violation' | 'lookup_error'
  data?: Record<string, unknown>
  cachedAt?: string
  provider?: string
  model?: string
  validationVersion?: string
  context?: string
  format?: string | null
  regulation?: string | null
}

/**
 * Consulta el caché compartido para un contexto competitivo específico.
 * Valida expiración, versión de validación, completitud de esquema y hechos objetivos.
 */
export async function getCachedAnalysis(
  supabaseClient: SupabaseClient,
  params: CacheLookupParams,
  verifiedFacts?: VerifiedAbilityFacts,
): Promise<CacheLookupResult> {
  const resolvedLocale = String(params.locale || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'
  const resolvedContext = (params.context || 'general').toLowerCase().trim()
  const resolvedFormat = params.format ? String(params.format).toLowerCase().trim() : null
  const resolvedRegulation = params.regulation ? String(params.regulation).toLowerCase().trim() : null

  const contextTag = `${params.pokemonId} | ${params.abilityId} | ${params.userLevel} | ${resolvedLocale} | ${resolvedContext} | ${resolvedFormat || 'none'} | ${resolvedRegulation || 'none'}`

  try {
    const buildQueryForLocale = (targetLocale: string) => {
      let q = supabaseClient
        .from('ai_ability_analysis_cache')
        .select('*')
        .eq('pokemon_id', params.pokemonId)
        .eq('ability_id', params.abilityId)
        .eq('user_level', params.userLevel)
        .eq('locale', targetLocale)
        .eq('context', resolvedContext)

      if (resolvedFormat) {
        q = q.eq('format', resolvedFormat)
      } else {
        q = q.is('format', null)
      }

      if (resolvedRegulation) {
        q = q.eq('regulation', resolvedRegulation)
      } else {
        q = q.is('regulation', null)
      }
      return q
    }

    let { data: row, error } = await buildQueryForLocale(resolvedLocale).maybeSingle()

    // Si no se encuentra en 'es', buscar si existe una entrada histórica en 'es-419' para reutilizarla
    if (!row && resolvedLocale === 'es') {
      const legacyResult = await buildQueryForLocale('es-419').maybeSingle()
      if (legacyResult.data) {
        row = legacyResult.data
      }
    }

    if (error) {
      console.warn(`[AI CACHE] Error consultando caché (${contextTag}):`, error.message)
      return { hit: false, reason: 'lookup_error' }
    }

    if (!row) {
      console.log(`[AI CACHE] MISS (${contextTag})`)
      return { hit: false, reason: 'not_found' }
    }

    // 1. Verificación de expiración
    const expiresAtTime = new Date(row.expires_at).getTime()
    if (expiresAtTime <= Date.now()) {
      console.log(`[AI CACHE] EXPIRED (${contextTag}) - expiró en ${row.expires_at}`)
      return { hit: false, reason: 'expired' }
    }

    // 2. Verificación de versión de validación (v1/v2 aceptadas para general histórico, v3 para contrato progresivo)
    const allowedVersions = resolvedContext === 'general' ? ['v1', 'v2', CURRENT_VALIDATION_VERSION] : [CURRENT_VALIDATION_VERSION]
    if (!allowedVersions.includes(row.validation_version)) {
      console.log(
        `[AI CACHE] VERSION_MISMATCH (${contextTag}) - entrada: '${row.validation_version}', permitidas: [${allowedVersions.join(', ')}]`,
      )
      return { hit: false, reason: 'version_mismatch' }
    }

    // 3. Verificación de esquema JSON
    const analysis = row.analysis_json
    if (!analysis || typeof analysis !== 'object') {
      console.warn(`[AI CACHE] INVALID_SCHEMA (${contextTag}) - contenido no es objeto JSON`)
      return { hit: false, reason: 'invalid_schema' }
    }

    const schemaCheck = validateAbilityAnalysis(analysis)
    if (!schemaCheck.valid) {
      console.warn(
        `[AI CACHE] INVALID_SCHEMA (${contextTag}) - falta campo obligatorio '${schemaCheck.missingField}'`,
      )
      return { hit: false, reason: 'invalid_schema' }
    }

    // 4. Verificación de hechos objetivos (Knowledge Layer)
    if (verifiedFacts) {
      const factCheck: FactCheckResult = validateAndCorrectFacts(analysis, verifiedFacts)
      if (factCheck.wasCorrected && factCheck.violationsFound.length > 0) {
        console.warn(
          `[AI CACHE] FACT_VIOLATION (${contextTag}) - viola hechos actuales:`,
          factCheck.violationsFound,
        )
        return { hit: false, reason: 'fact_violation' }
      }
    }

    // Entrada completamente válida: CACHE HIT
    console.log(`[AI CACHE] HIT (${contextTag})`)
    return {
      hit: true,
      data: analysis,
      cachedAt: row.created_at,
      provider: row.provider,
      model: row.model,
      validationVersion: row.validation_version,
      context: row.context || resolvedContext,
      format: row.format || null,
      regulation: row.regulation || null,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[AI CACHE] Excepción consultando caché (${contextTag}):`, errorMsg)
    return { hit: false, reason: 'lookup_error' }
  }
}

/**
 * Guarda o actualiza un análisis válido en el caché compartido.
 * Utiliza UPSERT sobre (pokemon_id, ability_id, user_level, locale, context, format, regulation)
 * para resolver condiciones de carrera de forma atómica y segura.
 */
export async function saveCachedAnalysis(
  supabaseClient: SupabaseClient,
  params: CacheSaveParams,
): Promise<{ success: boolean; error?: string }> {
  const resolvedLocale = String(params.locale || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'
  const resolvedContext = (params.context || 'general').toLowerCase().trim()
  const resolvedFormat = params.format ? String(params.format).toLowerCase().trim() : null
  const resolvedRegulation = params.regulation ? String(params.regulation).toLowerCase().trim() : null

  const contextTag = `${params.pokemonId} | ${params.abilityId} | ${params.userLevel} | ${resolvedLocale} | ${resolvedContext} | ${resolvedFormat || 'none'} | ${resolvedRegulation || 'none'}`
  const ttlDays = params.ttlDays || AI_CACHE_TTL_DAYS
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString()
  const version = params.validationVersion || CURRENT_VALIDATION_VERSION

  try {
    const { error } = await supabaseClient
      .from('ai_ability_analysis_cache')
      .upsert(
        {
          pokemon_id: params.pokemonId,
          ability_id: params.abilityId,
          user_level: params.userLevel,
          locale: resolvedLocale,
          context: resolvedContext,
          format: resolvedFormat,
          regulation: resolvedRegulation,
          analysis_json: params.analysisJson,
          provider: params.provider,
          model: params.model,
          validation_version: version,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'pokemon_id,ability_id,user_level,locale,context,format,regulation',
        },
      )

    if (error) {
      console.warn(`[AI CACHE] Error guardando análisis (${contextTag}):`, error.message)
      return { success: false, error: error.message }
    }

    console.log(`[AI CACHE] SAVED (${contextTag}) [expira en ${ttlDays} días, versión: ${version}]`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[AI CACHE] Excepción guardando análisis (${contextTag}):`, errorMsg)
    return { success: false, error: errorMsg }
  }
}
