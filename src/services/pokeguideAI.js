/**
 * pokeguideAI.js
 * Servicio cliente en React para la comunicación segura con PokeGuide AI
 * a través de Supabase Edge Functions.
 *
 * CERO EXPOSICIÓN DE SECRETOS:
 * La API Key de Gemini reside exclusivamente en los secretos de Supabase.
 * El cliente sólo invoca la Edge Function correspondiente.
 */

import { supabase, isSupabaseConfigured } from './supabase.js'
import { sanitizePokemonTerms } from '../utils/sanitizePokemonTerms.js'

/**
 * Estados del ciclo de vida del análisis de IA para la UI.
 */
export const AI_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
})

// Caché en memoria para evitar peticiones duplicadas en la misma sesión
const memoryCache = new Map()

/**
 * Genera una clave de caché determinista según los parámetros de la consulta.
 */
function getResolvedUserLevel(contextLevel) {
  if (contextLevel) return contextLevel
  try {
    return window.localStorage.getItem('pokeguide_ai_level') || 'beginner'
  } catch {
    return 'beginner'
  }
}

function getCacheKey(type, entityId, subId, {
  context = 'general',
  format = 'none',
  regulation = 'none',
  battleMode = 'singles',
  userLevel,
  locale = 'es',
} = {}) {
  const resolvedLevel = getResolvedUserLevel(userLevel)
  const normalizedLocale = String(locale || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'
  const parts = [
    type,
    entityId?.toLowerCase(),
    subId?.toLowerCase(),
    context?.toLowerCase() || 'general',
    format?.toLowerCase() || 'none',
    regulation?.toLowerCase() || 'none',
    battleMode?.toLowerCase() || 'singles',
    resolvedLevel,
    normalizedLocale,
  ]
  return parts.filter(Boolean).join(':')
}

/**
 * Analiza una habilidad Pokémon en contexto competitivo llamando a la Edge Function segura.
 *
 * Soporta la nueva firma contextual:
 * analyzeAbility({ pokemon, ability, context, format, regulation, userLevel, locale })
 * y mantiene 100% de retrocompatibilidad con firmas previas ({ pokemon, ability, context: { ... } }).
 *
 * @param {Object} params
 * @param {Object} params.pokemon - Datos del Pokémon (nombre, tipos, stats, etc.)
 * @param {Object} params.ability - Datos de la habilidad (nombre, descripción)
 * @param {string|Object} [params.context='general'] - Identificador o payload de contexto ('general', 'showdown', 'champions')
 * @param {string|null} [params.format=null] - Formato o modalidad (ej. 'gen9-ou', 'vgc', 'ranked-singles')
 * @param {string|null} [params.regulation=null] - Regulación específica opcional
 * @param {string} [params.userLevel] - Nivel de usuario ('beginner', 'intermediate', 'advanced', 'competitive')
 * @param {string} [params.locale='es'] - Idioma ('es', 'en')
 * @returns {Promise<{ success: boolean, data?: Object, error?: string, code?: string }>}
 */
export async function analyzeAbility({
  pokemon,
  ability,
  userLevel,
  locale,
  context = 'general',
  format = null,
  regulation = null,
}) {
  if (!pokemon?.name || !ability?.name) {
    return {
      success: false,
      error: 'Se requiere especificar el Pokémon y la habilidad para el análisis.',
      code: 'MISSING_PARAMS',
    }
  }

  // Normalización compatible de parámetros (soporta context como string o como objeto antiguo)
  const contextObj = typeof context === 'object' && context !== null ? context : {}
  const resolvedContext = (
    typeof context === 'string'
      ? context
      : (contextObj.context || contextObj.platform || 'general')
  ).toLowerCase().trim()

  const resolvedFormat = format || contextObj.format || null
  const resolvedRegulation = regulation || contextObj.regulation || null
  const resolvedLevel = getResolvedUserLevel(userLevel || contextObj.userLevel)
  const rawLocale = locale || contextObj.locale || 'es'
  const resolvedLocale = String(rawLocale).toLowerCase().startsWith('en') ? 'en' : 'es'

  let resolvedBattleMode = contextObj.battleMode
  if (!resolvedBattleMode) {
    const fmt = (resolvedFormat || '').toLowerCase()
    resolvedBattleMode = fmt.includes('double') || fmt.includes('vgc') ? 'doubles' : 'singles'
  }

  const resolvedGeneration = contextObj.generation || 9

  // 1. Comprobación de caché en memoria de sesión
  const cacheKey = getCacheKey('ability', pokemon.name, ability.name, {
    context: resolvedContext,
    format: resolvedFormat,
    regulation: resolvedRegulation,
    battleMode: resolvedBattleMode,
    userLevel: resolvedLevel,
    locale: resolvedLocale,
  })

  if (memoryCache.has(cacheKey)) {
    return {
      success: true,
      data: sanitizePokemonTerms(memoryCache.get(cacheKey)),
      fromCache: true,
    }
  }

  // 2. Comprobar disponibilidad de Supabase
  if (!supabase || !isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase no está configurado en este entorno. Revisa tus variables de entorno.',
      code: 'SUPABASE_UNCONFIGURED',
    }
  }

  // 3. Estructuración del payload contextual extensible para la Edge Function
  const payload = {
    type: 'ability',
    pokemon: {
      name: pokemon.name,
      localizedName: pokemon.localizedName || pokemon.name,
      types: Array.isArray(pokemon.types) ? pokemon.types : [],
      abilities: Array.isArray(pokemon.abilities) ? pokemon.abilities : [],
      stats: pokemon.stats || [],
    },
    ability: {
      name: ability.name,
      localizedName: ability.localizedName || ability.name,
      description: ability.description || '',
    },
    context: {
      context: resolvedContext,
      platform: resolvedContext,
      format: resolvedFormat,
      regulation: resolvedRegulation,
      generation: resolvedGeneration,
      battleMode: resolvedBattleMode,
      userLevel: resolvedLevel,
      locale: resolvedLocale,
    },
    userLevel: resolvedLevel,
    locale: resolvedLocale,
    format: resolvedFormat,
    regulation: resolvedRegulation,
  }

  try {
    // 4. Invocación segura de la Edge Function en Supabase
    const { data, error } = await supabase.functions.invoke('analyze-ability', {
      body: payload,
    })

    if (error) {
      console.error('[PokeGuide AI] Error invocando Edge Function:', error)

      let detailedError = error.message || 'Error al conectar con el servicio de análisis de IA.'
      let detailedCode = 'FUNCTION_INVOCATION_ERROR'
      let httpStatus = null

      if (error.context) {
        httpStatus = error.context.status || null
        try {
          // Intentar extraer el mensaje de error estructurado emitido por la Edge Function
          const errorJson = await error.context.json()
          if (errorJson?.error) {
            detailedError = errorJson.error
          }
          if (errorJson?.code) {
            detailedCode = errorJson.code
          }
        } catch {
          try {
            const rawText = await error.context.text()
            if (rawText && rawText.length < 300) {
              detailedError = rawText
            }
          } catch {
            // Fallback seguro al mensaje del error
          }
        }
      }

      return {
        success: false,
        error: detailedError,
        code: detailedCode,
        status: httpStatus,
      }
    }

    if (!data || !data.success || !data.data) {
      return {
        success: false,
        error: data?.error || 'Respuesta no válida del servidor de análisis.',
        code: data?.code || 'INVALID_AI_RESPONSE',
      }
    }

    const sanitizedData = sanitizePokemonTerms(data.data)

    // 5. Almacenar en caché en memoria y retornar
    memoryCache.set(cacheKey, sanitizedData)

    return {
      success: true,
      data: sanitizedData,
      metadata: data.metadata,
      fromCache: false,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PokeGuide AI] Excepción de red al analizar habilidad:', message)
    return {
      success: false,
      error: 'Error de red o conexión inesperada al solicitar el análisis.',
      code: 'NETWORK_ERROR',
    }
  }
}

/**
 * Limpia la caché local de análisis si es necesario (ej. al cambiar de idioma).
 */
export function clearAICache() {
  memoryCache.clear()
}

/* ==========================================================================
 * EXTENSIBILIDAD FUTURA: Stubs preparados para fases subsiguientes
 * ========================================================================== */

/**
 * Futura Fase 2: Análisis completo de Pokémon.
 */
export async function analyzePokemon(_params) {
  throw new Error('analyzePokemon() no está implementado aún en esta fase.')
}

/**
 * Futura Fase 3: Análisis de movimientos competitivos.
 */
export async function analyzeMove(_params) {
  throw new Error('analyzeMove() no está implementado aún en esta fase.')
}

/**
 * Futura Fase 5: Análisis de objetos competitivos.
 */
export async function analyzeItem(_params) {
  throw new Error('analyzeItem() no está implementado aún en esta fase.')
}

/**
 * Futura Fase 6: Análisis de equipos y sinergias.
 */
export async function analyzeTeam(_params) {
  throw new Error('analyzeTeam() no está implementado aún en esta fase.')
}

/**
 * Futura Fase 7: Asistente y comparador de Matchups.
 */
export async function analyzeMatchup(_params) {
  throw new Error('analyzeMatchup() no está implementado aún en esta fase.')
}
