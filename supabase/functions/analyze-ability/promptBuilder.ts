/**
 * promptBuilder.ts
 * Motor modular de construcción de prompts para PokeGuide AI.
 *
 * Separa conceptualmente:
 * MASTER_PROMPT + DYNAMIC_CONTEXT + POKEMON_DATA + ABILITY_DATA + FORMAT_CONTEXT
 */

export interface PokemonContextData {
  name: string
  localizedName?: string
  types?: string[]
  abilities?: string[]
  stats?: Array<{ name: string; value: number }> | Record<string, number>
}

export interface AbilityContextData {
  name: string
  localizedName?: string
  description?: string
}

export interface AnalysisContext {
  platform?: 'general' | 'showdown' | 'champions' | string
  format?: string | null // ej. "OU", "UU", "Ubers", "VGC", "Regulation H"
  generation?: number | string | null // ej. 9
  battleMode?: 'singles' | 'doubles' | 'vgc' | string | null
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | string
  locale?: 'es' | 'es-419' | 'en' | string
}

export interface AnalysisRequestPayload {
  type?: 'ability' | 'pokemon' | 'move' | 'item' | 'team' | 'matchup' | string
  pokemon?: PokemonContextData
  ability?: AbilityContextData
  context?: AnalysisContext
}

/**
 * Prompt Maestro: Establece la personalidad, rigor analítico y comprensión
 * de metagames competitivos de PokeGuide AI.
 */
export const MASTER_PROMPT = `
Eres PokeGuide AI, el analista de élite especializado en Pokémon competitivo de la plataforma PokeGuide.
Tu misión es proporcionar análisis tácticos profundos, pedagógicos y precisos sobre Pokémon, habilidades, movimientos, objetos y metagames.

REGLAS FUNDAMENTALES DE ANÁLISIS COMPETITIVO:
1. DISTINCIÓN RIGUROSA DE FORMATOS:
   - NUNCA asumas que las reglas de un formato aplican a otro.
   - Singles (Individuales/Smogon): El combate se basa en ritmo, cambios continuos, control de trampas de rocas/púas (hazards), wallbreaking y sweepers.
   - Doubles / VGC (Dobles Oficial): El combate se basa en control de velocidad (Tailwind, Trick Room), Protección (Protect), Fake Out, redirección (Follow Me) y daño en área.
   - Pokémon Showdown: Respeta las cláusulas de Smogon (Sleep Clause, Evasion Clause, etc.) y tiers específicas si se indican.
   - Pokémon Champions: Considera las mecánicas propias de dicho ecosistema.
2. RIGOR MECÁNICO:
   - No inventes interacciones ni estadísticas. Si la habilidad interactúa con climas, estados alterados o tipos específicos, explica exactamente cómo y por qué.
3. ADAPTACIÓN AL NIVEL DEL USUARIO (userLevel):
   - "beginner": Explicaciones didácticas, claras y motivadoras. Usa analogías sencillas, evita jerga cruda sin explicar o acompáñala de su significado.
   - "intermediate": Enfoque práctico con terminología estándar (STAB, Pivot, Sweeper, Wall, Hazard, Check, Counter).
   - "advanced" o "expert": Análisis minucioso de metagame, sinergias complejas, distribución de amenazas y cálculo de riesgo/recompensa.
4. IDIOMA Y TERMINOLOGÍA OFICIAL DE POKÉMON EN ESPAÑOL:
   - Responde SIEMPRE en el idioma especificado en el contexto (Español para "es" y "es-419", Inglés para "en").
   - Utiliza rigurosamente los nombres canónicos oficiales de Nintendo / Game Freak en español.
   - PROHIBIDAS TERMINANTEMENTE LAS TRADUCCIONES LITERALES O ALUCINADAS:
     * "Light Ball" NUNCA es "Bolamadrastra" ni "Bola ligera" -> DEBE SER SIEMPRE "Bola Luminosa".
     * "Life Orb" NUNCA es "Orbe de Vida" ni "Esfera de Vida" -> DEBE SER SIEMPRE "Vidasfera".
     * "Choice Band" -> "Cinta Elección" o "Cinta Elegida".
     * "Choice Specs" -> "Gafas Elección" o "Gafas Elegidas".
     * "Choice Scarf" -> "Pañuelo Elección" o "Pañuelo Elegido".
     * "Focus Sash" -> "Banda Focus".
     * "Focus Band" -> "Cinta Focus".
     * "Assault Vest" -> "Chaleco Asalto".
     * "Leftovers" -> "Restos".
     * "Heavy-Duty Boots" -> "Botas Gruesas".
     * "Rocky Helmet" -> "Casco Dentado".
     * "Eviolite" -> "Mineral Evolutivo".
     * "Heat Rock" -> "Roca Calor".
     * "Damp Rock" -> "Roca Lluvia".
     * "Smooth Rock" -> "Roca Arena".
     * "Loaded Dice" -> "Dado Trucado".
     * "Covert Cloak" -> "Capa Furtiva".
     * "Air Balloon" -> "Globo Helio".
     * "Booster Energy" -> "Tanque de Energía" o "Energía Potenciadora".
     * "Mirror Herb" -> "Hierba Copia".
     * "Clear Amulet" -> "Amuleto Puro".
     * "Weakness Policy" -> "Seguro Debilidad".
     * "Throat Spray" -> "Espray Bucal".
     * "Safety Goggles" -> "Gafas Protectoras".
5. FORMATO DE SALIDA:
   - La respuesta DEBE ser EXCLUSIVAMENTE un único objeto JSON válido sin sintaxis Markdown, sin bloques de código y sin explicaciones antes o después.
`

/**
 * Esquema oficial para generación estructurada en Gemini REST API (responseSchema).
 */
export const ABILITY_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'Resumen conciso y directo del impacto táctico de la habilidad en combate.',
    },
    rating: {
      type: 'OBJECT',
      properties: {
        score: {
          type: 'NUMBER',
          description: 'Calificación numérica entera del 1 al 10 según su viabilidad competitiva.',
        },
        label: {
          type: 'STRING',
          description: 'Etiqueta cualitativa: Deficiente, Situacional, Buena, Muy buena, Excelente o Imprescindible.',
        },
      },
      required: ['score', 'label'],
    },
    strengths: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Puntos fuertes clave con contexto táctico.',
    },
    weaknesses: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Puntos débiles, riesgos o limitaciones en combate.',
    },
    synergies: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Sinergias con compañeros de equipo, objetos o movimientos.',
    },
    singles: {
      type: 'STRING',
      description: 'Análisis detallado de viabilidad en combate individual (Singles / Smogon).',
    },
    doubles: {
      type: 'STRING',
      description: 'Análisis detallado de viabilidad en combate doble (VGC / Doubles).',
    },
    whenToUse: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Escenarios y momentos óptimos para aprovechar la habilidad.',
    },
    whenToAvoid: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Situaciones o amenazas donde evitar o tener cautela.',
    },
    competitiveTip: {
      type: 'STRING',
      description: 'Consejo pro competitivo o truco táctico para sacarle el máximo provecho.',
    },
  },
  required: [
    'summary',
    'rating',
    'strengths',
    'weaknesses',
    'synergies',
    'singles',
    'doubles',
    'whenToUse',
    'whenToAvoid',
    'competitiveTip',
  ],
}

/**
 * Esquema JSON estricto para Structured Outputs en Groq API (compatible con estándar OpenAI).
 */
export const GROQ_ABILITY_RESPONSE_SCHEMA = {
  name: 'ability_analysis_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Resumen conciso y directo del impacto táctico de la habilidad en combate.',
      },
      rating: {
        type: 'object',
        properties: {
          score: {
            type: 'number',
            description: 'Calificación numérica entera del 1 al 10 según su viabilidad competitiva.',
          },
          label: {
            type: 'string',
            description: 'Etiqueta cualitativa: Deficiente, Situacional, Buena, Muy buena, Excelente o Imprescindible.',
          },
        },
        required: ['score', 'label'],
        additionalProperties: false,
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Puntos fuertes clave con contexto táctico.',
      },
      weaknesses: {
        type: 'array',
        items: { type: 'string' },
        description: 'Puntos débiles, riesgos o limitaciones en combate.',
      },
      synergies: {
        type: 'array',
        items: { type: 'string' },
        description: 'Sinergias con compañeros de equipo, objetos o movimientos.',
      },
      singles: {
        type: 'string',
        description: 'Análisis detallado de viabilidad en combate individual (Singles / Smogon).',
      },
      doubles: {
        type: 'string',
        description: 'Análisis detallado de viabilidad en combate doble (VGC / Doubles).',
      },
      whenToUse: {
        type: 'array',
        items: { type: 'string' },
        description: 'Escenarios y momentos óptimos para aprovechar la habilidad.',
      },
      whenToAvoid: {
        type: 'array',
        items: { type: 'string' },
        description: 'Situaciones o amenazas donde evitar o tener cautela.',
      },
      competitiveTip: {
        type: 'string',
        description: 'Consejo pro competitivo o truco táctico para sacarle el máximo provecho.',
      },
    },
    required: [
      'summary',
      'rating',
      'strengths',
      'weaknesses',
      'synergies',
      'singles',
      'doubles',
      'whenToUse',
      'whenToAvoid',
      'competitiveTip',
    ],
    additionalProperties: false,
  },
}

/**
 * Instrucción explícita del esquema JSON esperado por el frontend (100% JSON puro, sin comentarios).
 */
export const JSON_SCHEMA_INSTRUCTIONS = `
Estructura JSON obligatoria de salida (DEBE ser un JSON estrictamente válido, sin comentarios):
{
  "summary": "Resumen conciso y directo del impacto de la habilidad en combate.",
  "rating": {
    "score": 8,
    "label": "Excelente"
  },
  "strengths": [
    "Punto fuerte 1 con contexto táctico",
    "Punto fuerte 2 con contexto táctico"
  ],
  "weaknesses": [
    "Punto débil o limitación 1",
    "Punto débil o limitación 2"
  ],
  "synergies": [
    "Nombre de Pokémon, objeto o movimiento con el que combina y por qué"
  ],
  "singles": "Análisis específico de cómo se desenvuelve en combate individual (Singles).",
  "doubles": "Análisis específico de cómo se desenvuelve en combate doble / VGC.",
  "whenToUse": [
    "Escenario o condición de victoria donde brilla"
  ],
  "whenToAvoid": [
    "Situación, matchup o counter donde pierde efectividad"
  ],
  "competitiveTip": "Consejo maestro o secreto táctico para sacarle el máximo partido."
}

Reglas sobre los valores:
- "rating.score": número del 1 al 10.
- "rating.label": una de: "Deficiente", "Situacional", "Buena", "Muy buena", "Excelente", "Imprescindible".
- NO incluyas comentarios con // ni /* */ dentro del JSON.
`


/**
 * Construye la sección del contexto dinámico (plataforma, modo, nivel, idioma).
 */
export function buildDynamicContext(context: AnalysisContext = {}): string {
  const platform = context.platform || 'general'
  const battleMode = context.battleMode || 'singles'
  const format = context.format || 'Estándar'
  const generation = context.generation ? `Gen ${context.generation}` : 'Gen 9 (Actual)'
  const userLevel = context.userLevel || 'beginner'
  const locale = context.locale || 'es'

  return `
[CONTEXTO DEL ANÁLISIS]
- Plataforma: ${platform}
- Modalidad de Batalla: ${battleMode.toUpperCase()}
- Formato / Tier: ${format}
- Generación: ${generation}
- Nivel de audiencia: ${userLevel}
- Idioma de respuesta requerido: ${locale === 'es-419' ? 'Español Latinoamericano' : locale === 'en' ? 'Inglés' : 'Español'}
`
}

/**
 * Formatea los datos técnicos disponibles del Pokémon.
 */
export function buildPokemonData(pokemon?: PokemonContextData): string {
  if (!pokemon || !pokemon.name) {
    return '[DATOS DEL POKÉMON]: No especificado.'
  }

  const types = Array.isArray(pokemon.types) && pokemon.types.length > 0
    ? pokemon.types.join('/')
    : 'Desconocido'

  let statsStr = 'No disponibles'
  if (Array.isArray(pokemon.stats)) {
    statsStr = pokemon.stats.map((s) => `${s.name}: ${s.value}`).join(', ')
  } else if (pokemon.stats && typeof pokemon.stats === 'object') {
    statsStr = Object.entries(pokemon.stats).map(([k, v]) => `${k}: ${v}`).join(', ')
  }

  const otherAbilities = Array.isArray(pokemon.abilities)
    ? pokemon.abilities.join(', ')
    : 'No disponibles'

  return `
[DATOS DEL POKÉMON EN ANÁLISIS]
- Especie: ${pokemon.localizedName ? `${pokemon.localizedName} (${pokemon.name})` : pokemon.name}
- Tipos: ${types}
- Estadísticas Base: ${statsStr}
- Pool de Habilidades del Pokémon: ${otherAbilities}
`
}

/**
 * Formatea los datos de la habilidad a analizar.
 */
export function buildAbilityData(ability?: AbilityContextData): string {
  if (!ability || !ability.name) {
    return '[HABILIDAD A ANALIZAR]: No especificada.'
  }

  return `
[HABILIDAD A ANALIZAR]
- Nombre: ${ability.localizedName ? `${ability.localizedName} (${ability.name})` : ability.name}
- Descripción oficial en el juego: ${ability.description || 'Sin descripción oficial provista.'}
`
}

/**
 * Construye el contexto de formato y metagame específico.
 */
export function buildFormatContext(context: AnalysisContext = {}): string {
  const mode = (context.battleMode || '').toLowerCase()
  const format = (context.format || '').toUpperCase()

  let notes = ''
  if (mode.includes('vgc') || mode.includes('double')) {
    notes += 'Presta especial atención al impacto en el compañero de equipo, activación simultánea y control de turnos.'
  } else {
    notes += 'Considera la presencia de hazards en campo, capacidad de switch-in y matchups individuales directos.'
  }

  if (format.includes('OU') || format.includes('UU') || format.includes('UBERS')) {
    notes += ` Ten en cuenta las restricciones y amenazas típicas del tier ${format} de Smogon.`
  }

  return `
[GUÍA ESPECÍFICA DEL METAGAME]
${notes}
`
}

/**
 * Ensambla el prompt completo para enviar a Gemini API.
 */
export function buildFullPrompt(payload: AnalysisRequestPayload): string {
  const master = MASTER_PROMPT.trim()
  const dynamic = buildDynamicContext(payload.context).trim()
  const pokemon = buildPokemonData(payload.pokemon).trim()
  const ability = buildAbilityData(payload.ability).trim()
  const formatCtx = buildFormatContext(payload.context).trim()
  const schema = JSON_SCHEMA_INSTRUCTIONS.trim()

  return `${master}

${dynamic}

${pokemon}

${ability}

${formatCtx}

INSTRUCCIÓN FINAL:
Analiza en profundidad la habilidad indicada para el Pokémon especificado bajo el contexto anterior.
${schema}
`
}
