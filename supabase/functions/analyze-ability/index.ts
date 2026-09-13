/**
 * Supabase Edge Function: analyze-ability
 *
 * Núcleo seguro de análisis con Google Gemini para PokeGuide.
 * La clave GEMINI_API_KEY reside exclusivamente en los secretos de Supabase.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildFullPrompt,
  ABILITY_RESPONSE_SCHEMA,
  GROQ_ABILITY_RESPONSE_SCHEMA,
  type AnalysisRequestPayload,
} from './promptBuilder.ts'

// Proveedor de IA configurable mediante Supabase Secrets ('groq' | 'gemini')
// Por defecto se establece 'groq' para garantizar alta disponibilidad y mitigar límites de cuota
const AI_PROVIDER = (Deno.env.get('AI_PROVIDER')?.trim() || 'groq').toLowerCase()

// Modelos configurables mediante variables de entorno en Supabase
const GROQ_MODEL = Deno.env.get('GROQ_MODEL')?.trim() || 'openai/gpt-oss-120b'
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-3.6-flash'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface JsonErrorResponse {
  success: false
  error: string
  code: string
  status?: number
  details?: string
}

function jsonResponse(body: Record<string, unknown> | JsonErrorResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Extrae y parsea de forma robusta y defensiva un objeto JSON desde una respuesta textual de IA.
 * Soporta:
 * 1. JSON puro directo (cuando responseSchema funciona al 100%)
 * 2. Bloques Markdown (```json ... ``` o ``` ... ```)
 * 3. Aislamiento del primer '{' al último '}' si hay texto conversacional
 * 4. Limpieza segura de trailing commas antes de cerrar llave o corchete
 */
export function extractJsonObject(rawContent: string): Record<string, unknown> | null {
  if (!rawContent || typeof rawContent !== 'string') return null

  const trimmed = rawContent.trim()
  if (!trimmed) return null

  // 1. Intento directo (caso estándar)
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // Continuar con estrategias de fallback
  }

  // 2. Extracción de bloque de código Markdown ```json ... ``` o ``` ... ```
  let candidate = trimmed
  const codeBlockMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    candidate = codeBlockMatch[1].trim()
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Continuar buscando llaves
    }
  }

  // 3. Aislamiento de llaves exteriores: desde el primer '{' hasta el último '}'
  const firstBrace = candidate.indexOf('{')
  const lastBrace = candidate.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const isolated = candidate.slice(firstBrace, lastBrace + 1).trim()
    try {
      const parsed = JSON.parse(isolated)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // 4. Intento de limpieza de comas finales (trailing commas) accidentales
      try {
        const cleanedCommas = isolated.replace(/,\s*([}\]])/g, '$1')
        const parsed = JSON.parse(cleanedCommas)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>
        }
      } catch {
        // Falló
      }
    }
  }

  return null
}

const CANONICAL_TERMS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bbolamadrastra\b/gi, 'Bola Luminosa'],
  [/\bbola\s+madrastra\b/gi, 'Bola Luminosa'],
  [/\bbola\s+ligera\b/gi, 'Bola Luminosa'],
  [/\borbe\s+(?:de\s+)?vida\b/gi, 'Vidasfera'],
  [/\besfera\s+(?:de\s+)?vida\b/gi, 'Vidasfera'],
  [/\bbanda\s+(?:de\s+)?elecci[oó]n\b/gi, 'Cinta Elección'],
  [/\bbanda\s+elegida\b/gi, 'Cinta Elección'],
  [/\bgafas\s+(?:de\s+)?elecci[oó]n\b/gi, 'Gafas Elección'],
  [/\bbufanda\s+(?:de\s+)?elecci[oó]n\b/gi, 'Pañuelo Elección'],
  [/\bbufanda\s+elegida\b/gi, 'Pañuelo Elección'],
  [/\bfaja\s+focus\b/gi, 'Banda Focus'],
  [/\bbanda\s+(?:de\s+)?enfoque\b/gi, 'Banda Focus'],
  [/\bcinta\s+(?:de\s+)?enfoque\b/gi, 'Cinta Focus'],
  [/\bchaleco\s+de\s+asalto\b/gi, 'Chaleco Asalto'],
  [/\bbotas\s+(?:de\s+)?trabajo\s+pesado\b/gi, 'Botas Gruesas'],
  [/\bbotas\s+pesadas\b/gi, 'Botas Gruesas'],
  [/\bcasco\s+rocoso\b/gi, 'Casco Dentado'],
  [/\beviolita\b/gi, 'Mineral Evolutivo'],
  [/\bmineral\s+(?:de\s+)?evoluci[oó]n\b/gi, 'Mineral Evolutivo'],
  [/\broca\s+caliente\b/gi, 'Roca Calor'],
  [/\broca\s+h[uú]meda\b/gi, 'Roca Lluvia'],
  [/\broca\s+suave\b/gi, 'Roca Arena'],
  [/\bdado\s+cargado\b/gi, 'Dado Trucado'],
  [/\bcapa\s+encubierta\b/gi, 'Capa Furtiva'],
  [/\bglobo\s+(?:de\s+)?aire\b/gi, 'Globo Helio'],
  [/\bamuleto\s+claro\b/gi, 'Amuleto Puro'],
  [/\bhierba\s+espejo\b/gi, 'Hierba Copia'],
  [/\bp[oó]liza\s+(?:de\s+)?debilidad\b/gi, 'Seguro Debilidad'],
  [/\bp[oó]liza\s+(?:de\s+)?fallo\b/gi, 'Seguro Fallo'],
  [/\bp[oó]liza\s+(?:de\s+)?error\b/gi, 'Seguro Fallo'],
  [/\bspray\s+(?:de\s+)?garganta\b/gi, 'Espray Bucal'],
  [/\bgafas\s+(?:de\s+)?seguridad\b/gi, 'Gafas Protectoras'],
  [/\bcintur[oó]n\s+(?:de\s+)?experto\b/gi, 'Cinta Experto'],
  [/\benerg[ií]a\s+de\s+refuerzo\b/gi, 'Tanque de Energía'],
  [/\bviento\s+(?:de\s+)?cola\b/gi, 'Viento Afín'],
  [/\brocas\s+sigilosas\b/gi, 'Trampa Rocas'],
  [/\bdisparo\s+de\s+despedida\b/gi, 'Última Palabra'],
  [/\bvuelta\s+en\s+u\b/gi, 'Ida y Vuelta'],
  [/\bcambio\s+(?:de\s+)?voltio\b/gi, 'Voltiocambio'],
  [/\bplacaje\s+de\s+voltios\b/gi, 'Placaje Eléctrico'],
]

export function sanitizeSpanishPokemonTerms<T>(input: T): T {
  if (typeof input === 'string') {
    let result = input
    for (const [pattern, replacement] of CANONICAL_TERMS_REPLACEMENTS) {
      result = result.replace(pattern, replacement)
    }
    return result as T
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeSpanishPokemonTerms(item)) as T
  }

  if (input && typeof input === 'object') {
    const sanitizedObj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeSpanishPokemonTerms(value)
    }
    return sanitizedObj as T
  }

  return input
}

/**
 * Valida que la estructura del análisis de habilidad devuelta por la IA contenga
 * todos los campos requeridos por el frontend de PokeGuide.
 */
export function validateAbilityAnalysis(data: Record<string, unknown>): { valid: boolean; missingField?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, missingField: 'root' }
  }

  if (typeof data.summary !== 'string' || !data.summary.trim()) {
    return { valid: false, missingField: 'summary' }
  }

  if (!data.rating || typeof data.rating !== 'object') {
    return { valid: false, missingField: 'rating' }
  }

  const rating = data.rating as Record<string, unknown>
  if (typeof rating.score !== 'number' && isNaN(Number(rating.score))) {
    return { valid: false, missingField: 'rating.score' }
  }
  if (typeof rating.label !== 'string' || !rating.label.trim()) {
    return { valid: false, missingField: 'rating.label' }
  }

  if (!Array.isArray(data.strengths) || data.strengths.length === 0) {
    return { valid: false, missingField: 'strengths' }
  }

  if (!Array.isArray(data.weaknesses) || data.weaknesses.length === 0) {
    return { valid: false, missingField: 'weaknesses' }
  }

  if (!Array.isArray(data.synergies)) {
    return { valid: false, missingField: 'synergies' }
  }

  if (typeof data.singles !== 'string' || !data.singles.trim()) {
    return { valid: false, missingField: 'singles' }
  }

  if (typeof data.doubles !== 'string' || !data.doubles.trim()) {
    return { valid: false, missingField: 'doubles' }
  }

  if (!Array.isArray(data.whenToUse)) {
    return { valid: false, missingField: 'whenToUse' }
  }

  if (!Array.isArray(data.whenToAvoid)) {
    return { valid: false, missingField: 'whenToAvoid' }
  }

  if (typeof data.competitiveTip !== 'string' || !data.competitiveTip.trim()) {
    return { valid: false, missingField: 'competitiveTip' }
  }

  return { valid: true }
}

interface ProviderCallResult {
  ok: boolean
  rawContent?: string
  status?: number
  error?: string
  code?: string
}

async function callGroqProvider(
  fullPrompt: string,
  model: string,
  apiKey: string,
): Promise<ProviderCallResult> {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions'
  const maxRetries = 2
  let attempt = 0

  while (attempt <= maxRetries) {
    attempt++

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Eres PokeGuide AI, el analista de élite especializado en Pokémon competitivo de la plataforma PokeGuide. Responde con análisis táctico estricto en formato JSON estructurado según el esquema.',
            },
            {
              role: 'user',
              content: fullPrompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: GROQ_ABILITY_RESPONSE_SCHEMA,
          },
          reasoning_effort: 'low',
          temperature: 0.2,
          max_tokens: 2500,
        }),
      })

      if (!response.ok) {
        const errorStatus = response.status
        let errorDetail = ''

        try {
          const errorJson = await response.json()
          errorDetail =
            errorJson?.error?.message ||
            errorJson?.error?.code ||
            `HTTP ${errorStatus}`
        } catch {
          const errorText = await response.text().catch(() => '')
          errorDetail = errorText.slice(0, 200) || `HTTP ${errorStatus}`
        }

        console.error(
          `[Edge Function] Error respuesta Groq API (${errorStatus}, intento ${attempt}):`,
          errorDetail,
        )

        if (errorStatus === 429) {
          if (attempt <= maxRetries) {
            const resetTokensHeader = response.headers.get('x-ratelimit-reset-tokens')
            let waitMs = 3000
            if (resetTokensHeader) {
              const parsedSec = parseFloat(resetTokensHeader.replace('s', '').trim())
              if (!isNaN(parsedSec) && parsedSec > 0) {
                waitMs = Math.min(Math.ceil(parsedSec * 1000) + 600, 25000)
              }
            } else {
              const retryAfterSec = parseFloat(response.headers.get('retry-after') || '3')
              if (!isNaN(retryAfterSec) && retryAfterSec > 0) {
                waitMs = Math.min(Math.ceil(retryAfterSec * 1000) + 600, 25000)
              }
            }
            console.warn(`[Edge Function] Rate limit 429 de Groq. Esperando ${waitMs}ms para reintento automático...`)
            await new Promise((resolve) => setTimeout(resolve, waitMs))
            continue
          }

          return {
            ok: false,
            status: 429,
            error:
              'Límite de cuota de Groq alcanzado temporalmente. Intenta nuevamente en unos momentos.',
            code: 'RATE_LIMIT_EXCEEDED',
          }
        }

        return {
          ok: false,
          status: errorStatus === 401 || errorStatus === 403 ? 500 : 502,
          error: `Error al comunicarse con el proveedor de IA (Groq API): ${errorDetail}`,
          code: 'GROQ_PROVIDER_ERROR',
        }
      }

      const groqData = await response.json()
      const rawContent = groqData.choices?.[0]?.message?.content || ''

      if (!rawContent) {
        return {
          ok: false,
          status: 502,
          error: 'Groq no generó una respuesta utilizable.',
          code: 'EMPTY_AI_RESPONSE',
        }
      }

      return { ok: true, rawContent }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[Edge Function] Excepción conectando con Groq:', errorMsg)
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        continue
      }
      return {
        ok: false,
        status: 502,
        error: `Fallo de conexión al contactar a Groq API: ${errorMsg}`,
        code: 'GROQ_NETWORK_ERROR',
      }
    }
  }

  return {
    ok: false,
    status: 502,
    error: 'No se pudo obtener una respuesta de Groq tras múltiples intentos.',
    code: 'GROQ_MAX_RETRIES_EXCEEDED',
  }
}

async function callGeminiProvider(
  fullPrompt: string,
  model: string,
  apiKey: string,
): Promise<ProviderCallResult> {
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`

  try {
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ABILITY_RESPONSE_SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorStatus = geminiResponse.status
      let errorDetail = ''

      try {
        const errorJson = await geminiResponse.json()
        errorDetail =
          errorJson?.error?.message ||
          errorJson?.error?.status ||
          `HTTP ${errorStatus}`
      } catch {
        const errorText = await geminiResponse.text().catch(() => '')
        errorDetail = errorText.slice(0, 200) || `HTTP ${errorStatus}`
      }

      console.error(
        `[Edge Function] Error respuesta Gemini API (${errorStatus}):`,
        errorDetail,
      )

      if (errorStatus === 429) {
        return {
          ok: false,
          status: 429,
          error:
            'Límite de cuota de Gemini alcanzado temporalmente. Intenta nuevamente en unos momentos.',
          code: 'RATE_LIMIT_EXCEEDED',
        }
      }

      return {
        ok: false,
        status: 502,
        error: `Error al comunicarse con el proveedor de IA (Gemini API): ${errorDetail}`,
        code: 'GEMINI_PROVIDER_ERROR',
      }
    }

    const geminiData = await geminiResponse.json()
    const rawContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!rawContent) {
      return {
        ok: false,
        status: 502,
        error: 'Gemini no generó una respuesta utilizable.',
        code: 'EMPTY_AI_RESPONSE',
      }
    }

    return { ok: true, rawContent }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[Edge Function] Excepción conectando con Gemini:', errorMsg)
    return {
      ok: false,
      status: 502,
      error: `Fallo de conexión al contactar a Gemini API: ${errorMsg}`,
      code: 'GEMINI_NETWORK_ERROR',
    }
  }
}

Deno.serve(async (req: Request) => {
  // 1. Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Validación de método HTTP
  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Método no permitido. Utiliza POST.',
        code: 'METHOD_NOT_ALLOWED',
      },
      405,
    )
  }

  try {
    // 3. Recepción y validación de payload
    let payload: AnalysisRequestPayload

    try {
      payload = await req.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Cuerpo de solicitud JSON inválido o malformado.',
          code: 'INVALID_JSON',
        },
        400,
      )
    }

    if (!payload || typeof payload !== 'object') {
      return jsonResponse(
        {
          success: false,
          error: 'Se requiere un objeto de solicitud válido.',
          code: 'INVALID_REQUEST',
        },
        400,
      )
    }

    // Validación de campos mínimos según tipo de análisis
    const analysisType = payload.type || 'ability'
    if (analysisType === 'ability') {
      if (!payload.pokemon?.name && !payload.ability?.name) {
        return jsonResponse(
          {
            success: false,
            error: 'Debe especificarse al menos el nombre del Pokémon o de la habilidad a analizar.',
            code: 'MISSING_REQUIRED_FIELDS',
          },
          400,
        )
      }
    }

    // 4. Verificación de Autenticación de Supabase (si se provee Authorization)
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
          })
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (!userError && user) {
            userId = user.id
          }
        } catch (authErr) {
          console.warn('[Edge Function] No se pudo verificar la sesión de usuario:', authErr)
        }
      }
    }

    // 5. Construcción modular del prompt (compartido idénticamente entre proveedores)
    const fullPrompt = buildFullPrompt(payload)

    // 6. Despacho dinámico según el proveedor configurado en Supabase Secrets (AI_PROVIDER)
    let providerResult: ProviderCallResult
    let activeProvider = ''
    let activeModel = ''

    if (AI_PROVIDER === 'groq') {
      activeProvider = 'groq'
      activeModel = GROQ_MODEL
      const groqApiKey = Deno.env.get('GROQ_API_KEY')?.trim()
      if (!groqApiKey) {
        console.error('[Edge Function] ❌ GROQ_API_KEY no encontrada o vacía en Supabase Secrets.')
        return jsonResponse(
          {
            success: false,
            error: 'El servicio de IA no está configurado (falta GROQ_API_KEY en Supabase Secrets).',
            code: 'GROQ_NOT_CONFIGURED',
          },
          500,
        )
      }
      providerResult = await callGroqProvider(fullPrompt, activeModel, groqApiKey)
    } else if (AI_PROVIDER === 'gemini') {
      activeProvider = 'gemini'
      activeModel = GEMINI_MODEL
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
      if (!geminiApiKey) {
        console.error('[Edge Function] ❌ GEMINI_API_KEY no encontrada o vacía en Supabase Secrets.')
        return jsonResponse(
          {
            success: false,
            error: 'El servicio de IA no está configurado (falta GEMINI_API_KEY en Supabase Secrets).',
            code: 'GEMINI_NOT_CONFIGURED',
          },
          500,
        )
      }
      providerResult = await callGeminiProvider(fullPrompt, activeModel, geminiApiKey)
    } else {
      console.error(`[Edge Function] ❌ Proveedor de IA desconocido: '${AI_PROVIDER}'.`)
      return jsonResponse(
        {
          success: false,
          error: `Proveedor de IA no válido: '${AI_PROVIDER}'. Valores permitidos: 'groq' o 'gemini'.`,
          code: 'UNKNOWN_AI_PROVIDER',
        },
        400,
      )
    }

    if (!providerResult.ok) {
      return jsonResponse(
        {
          success: false,
          error: providerResult.error || 'Error al comunicarse con el proveedor de IA.',
          code: providerResult.code || 'PROVIDER_ERROR',
        },
        providerResult.status || 502,
      )
    }

    const rawContent = providerResult.rawContent || ''

    // 7. Parseo robusto y defensivo de respuesta estructurada
    const parsedResult = extractJsonObject(rawContent)

    if (!parsedResult) {
      console.error(
        `[Edge Function] ❌ Error extrayendo JSON de ${activeProvider} (modelo: ${activeModel}, longitud: ${rawContent.length}). Muestra segura:`,
        rawContent.slice(0, 150).replace(/[\r\n]+/g, ' '),
      )
      return jsonResponse(
        {
          success: false,
          error: 'La respuesta generada por la IA no tiene un formato JSON válido.',
          code: 'MALFORMED_AI_RESPONSE',
        },
        502,
      )
    }

    // 8. Sanitización de términos Pokémon oficiales en español (ej. Bolamadrastra -> Bola Luminosa)
    const sanitizedResult = sanitizeSpanishPokemonTerms(parsedResult)

    // 9. Validación de campos obligatorios requeridos por PokeGuide
    const validation = validateAbilityAnalysis(sanitizedResult)
    if (!validation.valid) {
      console.error(
        `[Edge Function] ❌ Esquema incompleto en respuesta de ${activeProvider}. Campo faltante: '${validation.missingField}'`,
      )
      return jsonResponse(
        {
          success: false,
          error: `La respuesta generada por la IA está incompleta (falta '${validation.missingField}').`,
          code: 'INVALID_AI_SCHEMA',
        },
        502,
      )
    }

    // 10. Respuesta final exitosa al cliente
    return jsonResponse(
      {
        success: true,
        data: sanitizedResult,
        metadata: {
          type: analysisType,
          provider: activeProvider,
          model: activeModel,
          authenticatedUser: Boolean(userId),
          timestamp: Date.now(),
        },
      },
      200,
    )
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[Edge Function] Excepción no controlada:', errorMsg)
    return jsonResponse(
      {
        success: false,
        error: 'Ocurrió un error interno en el servidor al procesar el análisis.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      500,
    )
  }
})
