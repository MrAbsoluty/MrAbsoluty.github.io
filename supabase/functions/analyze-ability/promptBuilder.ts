/**
 * promptBuilder.ts
 * Motor modular de construcción de prompts para PokeGuide AI.
 *
 * Separa conceptualmente:
 * MASTER_PROMPT + VERIFIED_FACTS (Knowledge Layer) + DYNAMIC_CONTEXT (User Level) + POKEMON_DATA + ABILITY_DATA + FORMAT_CONTEXT
 */

import { type VerifiedAbilityFacts } from './knowledgeLayer.ts'

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
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'competitive' | string
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
Eres PokeGuide AI, el analista y educador de élite especializado en Pokémon competitivo de la plataforma PokeGuide.
Tu misión es interpretar, contextualizar y enseñar conocimiento verificado con rigor y precisión pedagógica.

PRINCIPIO FUNDAMENTAL:
"PokeGuide AI no debe inventar el conocimiento; debe interpretar, contextualizar y enseñar conocimiento verificado."

REGLAS FUNDAMENTALES DE ANÁLISIS COMPETITIVO:
1. FUENTE DE VERDAD Y REGLAS FACTUALES:
   - Los datos proporcionados en [HECHOS VERIFICADOS OBLIGATORIOS] son la verdad absoluta.
   - NUNCA contradigas, alteres ni inventes efectos que no aparezcan en los hechos verificados.
   - Si no tienes suficiente información para afirmar algo, indícalo claramente en lugar de especular.
   - NUNCA atribuyas a una habilidad un cambio de estadística que no aparezca en los datos verificados.
   - DISTINCIÓN ESTRICTA DE VELOCIDAD: NUNCA confundas una reducción de frecuencia de actuación (ej. turnos alternos) con una reducción de la estadística de Velocidad (Speed).
     * En Truant (Ausente): El Pokémon NO puede atacar en turnos alternos (holgazanea en turnos pares). Esto NO reduce su estadística de Velocidad. Su Speed es idéntica y se calcula normalmente. Queda terminantemente PROHIBIDO decir "reduce la velocidad", "disminuye speed", "hace más lento" o expresiones similares.
     * En Huge Power / Pure Power: Duplica ÚNICAMENTE el Ataque físico (x2), jamás la Velocidad ni el Ataque Especial.
     * En Drought (Sequía): Activa Sol (Luz Solar Intensa), jamás lluvia ni tormentas.
     * En Wonder Guard (Superguarda): Solo es vulnerable a daño directo de movimientos supereficaces; el daño indirecto le afecta con normalidad.
     * En Intimidate (Intimidación): Reduce el Ataque físico del rival en 1 nivel, NO la Velocidad ni la Defensa.

2. DISTINCIÓN RIGUROSA DE FORMATOS:
   - NUNCA asumas que las reglas de un formato aplican a otro.
   - Singles (Individuales/Smogon): Ritmo, cambios continuos, control de hazards (trampas/púas), wallbreaking y sweepers.
   - Doubles / VGC (Dobles Oficial): Control de velocidad (Tailwind, Trick Room), Protección (Protect), Fake Out, redirección (Follow Me), sinergia directa con el compañero y daño en área.

3. IDIOMA Y TERMINOLOGÍA OFICIAL DE POKÉMON EN ESPAÑOL:
   - Responde SIEMPRE en el idioma especificado en el contexto (Español para "es" y "es-419", Inglés para "en").
   - Utiliza rigurosamente los nombres canónicos oficiales de Nintendo / Game Freak en español.
   - PROHIBIDAS TERMINANTEMENTE LAS TRADUCCIONES LITERALES O ALUCINADAS:
     * "Light Ball" NUNCA es "Bolamadrastra" ni "Bola ligera" -> DEBE SER SIEMPRE "Bola Luminosa".
     * "Life Orb" NUNCA es "Orbe de Vida" ni "Esfera de Vida" -> DEBE SER SIEMPRE "Vidasfera".
     * "Choice Band" -> "Cinta Elección".
     * "Choice Specs" -> "Gafas Elección".
     * "Choice Scarf" -> "Pañuelo Elección".
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

4. FORMATO DE SALIDA:
   - La respuesta DEBE ser EXCLUSIVAMENTE un único objeto JSON válido sin sintaxis Markdown, sin bloques de código y sin texto antes o después.
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
        source: {
          type: 'STRING',
          description: 'Origen de la calificación: deterministic, hybrid o ai.',
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
          source: {
            type: 'string',
            description: 'Origen de la evaluación: deterministic, hybrid o ai.',
          },
        },
        required: ['score', 'label', 'source'],
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
 * Instrucción explícita del esquema JSON esperado por el frontend.
 */
export const JSON_SCHEMA_INSTRUCTIONS = `
Estructura JSON obligatoria de salida (DEBE ser un JSON estrictamente válido, sin comentarios ni sintaxis Markdown):
{
  "summary": "Resumen conciso y directo del impacto de la habilidad en combate.",
  "rating": {
    "score": 8,
    "label": "Excelente",
    "source": "deterministic"
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
- "rating.source": "deterministic", "hybrid" o "ai".
`

/**
 * Construye la sección de Hechos Verificados provenientes del Knowledge Layer.
 */
export function buildVerifiedFactsSection(facts?: VerifiedAbilityFacts): string {
  if (!facts) return ''

  const statChangesStr = facts.statChanges.length > 0
    ? facts.statChanges.map((s) => s.explanation).join('; ')
    : 'Ninguno (Esta habilidad NO modifica directamente ninguna estadística base ni niveles de stats).'

  const turnCycleStr = facts.turnCycle
    ? `Ciclo de turnos: ${facts.turnCycle.pattern}. ${facts.turnCycle.explanation}`
    : 'Ciclo de turnos: Estándar (actúa en cada turno según iniciativa).'

  const prohibitedStr = facts.prohibitedClaims.length > 0
    ? facts.prohibitedClaims.map((p) => `"${p}"`).join(', ')
    : 'Ninguna adicional.'

  const ratingHint = facts.deterministicRating
    ? `- Calificación objetiva de referencia: ${facts.deterministicRating.score}/10 (${facts.deterministicRating.label})`
    : ''

  return `
[HECHOS VERIFICADOS OBLIGATORIOS (KNOWLEDGE LAYER - VERIFIED FACTS)]
Los siguientes datos son inmutables y la ÚNICA fuente de verdad para este análisis:
- Habilidad: ${facts.canonicalName}
- Efecto oficial en el juego: ${facts.officialEffect}
- Modificaciones de estadísticas comprobadas: ${statChangesStr}
- Interacción con la estadística Speed (Velocidad): ${facts.speedChanges.explanation}
- ${turnCycleStr}
- Activación: ${facts.activation}
- Categoría táctica: ${facts.category}
${ratingHint}
- AFIRMACIONES ESTRICTAMENTE PROHIBIDAS: ${prohibitedStr}

REGLAS FACTUALES OBLIGATORIAS:
1. No puedes contradecir, modificar ni reinterpretar estos hechos verificados.
2. NUNCA atribuyas a una habilidad un cambio de estadística que no aparezca en los datos verificados.
3. NUNCA confundas una reducción de frecuencia de actuación (turnos alternos) con una reducción de la estadística Speed.
`
}

/**
 * Construye el contexto dinámico adaptado rigurosamente al nivel del usuario (Fase 1, 7 y 9).
 */
export function buildDynamicContext(context: AnalysisContext = {}): string {
  const platform = context.platform || 'general'
  const battleMode = context.battleMode || 'singles'
  const format = context.format || 'Estándar'
  const generation = context.generation ? `Gen ${context.generation}` : 'Gen 9 (Actual)'
  const userLevel = (context.userLevel || 'beginner').toLowerCase()
  const locale = context.locale || 'es'

  let pedagogicalGuidance = ''

  if (userLevel === 'beginner') {
    pedagogicalGuidance = `
DIRECTRICES DIDÁCTICAS PARA NIVEL PRINCIPIANTE (beginner):
- Objetivo: Usuario que está aprendiendo Pokémon competitivo.
- Utiliza lenguaje sencillo, claro y motivador.
- Explica los términos competitivos siempre que los uses (ej. si mencionas qué es STAB, explícalo brevemente).
- Utiliza ejemplos concretos y paso a paso (ej. qué ocurre exactamente en el turno 1 y en el turno 2).
- Evita jerga técnica innecesaria ("speed tiers", "momentum", "wallbreaker", "spread", "hazard stacking").
- En Truant: explica que el Pokémon puede atacar un turno y en el siguiente holgazanea descansando, sin complicar con términos abstractos.
`
  } else if (userLevel === 'intermediate') {
    pedagogicalGuidance = `
DIRECTRICES TÁCTICAS PARA NIVEL INTERMEDIO (intermediate):
- Objetivo: Usuario que conoce las bases competitivas y mecánicas esenciales.
- Utiliza terminología competitiva estándar: STAB, Sweeper, Muralla (Wall), Pivote, Check, Counter, Hazard, Sinergia.
- Explica estrategias claras y cómo la habilidad define el rol del Pokémon en el equipo.
- Reduce explicaciones demasiado básicas sobre qué es un tipo o qué es daño físico.
- En Truant: explica que obliga a alternar turnos activos e inactivos, facilitando que el rival se prepare en el turno libre.
`
  } else if (userLevel === 'advanced') {
    pedagogicalGuidance = `
DIRECTRICES ESTRATÉGICAS PARA NIVEL AVANZADO (advanced):
- Objetivo: Usuario con experiencia competitiva sólida.
- Utiliza terminología competitiva avanzada: Matchups, control de velocidad (speed control), presión ofensiva (pressure), setup, condición de victoria (win condition), momentum.
- Céntrate en optimización, escenarios de riesgo/recompensa y tempo de la partida.
- En Truant: explica que impone un ciclo de acción/inacción que elimina la presión ofensiva constante y concede turnos de setup gratuitos al oponente.
`
  } else if (userLevel === 'competitive') {
    pedagogicalGuidance = `
DIRECTRICES DE ÉLITE PARA NIVEL COMPETITIVO (competitive):
- Objetivo: Usuario avanzado/competitivo y jugador de torneos.
- Utiliza terminología técnica completa y análisis profundo.
- Analiza el metajuego específico, roles, teambuilding, distribución de amenazas, daño relativo y counterplay óptimo.
- Asume conocimientos previos avanzados sin explicaciones introductorias.
- En Truant: analiza el gravísimo déficit de tempo, la extrema vulnerabilidad frente a Protect/Substitute y las posibles opciones nicho (como Gastro Acid o Skill Swap/Entrainment en VGC).
`
  }

  return `
[CONTEXTO DEL ANÁLISIS]
- Plataforma: ${platform}
- Modalidad de Batalla: ${battleMode.toUpperCase()}
- Formato / Tier: ${format}
- Generación: ${generation}
- Nivel de audiencia asignado: ${userLevel.toUpperCase()}
- Idioma de respuesta requerido: ${locale === 'es-419' ? 'Español Latinoamericano' : locale === 'en' ? 'Inglés' : 'Español'}
${pedagogicalGuidance}
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
 * Ensambla el prompt completo para enviar al proveedor de IA.
 */
export function buildFullPrompt(
  payload: AnalysisRequestPayload,
  verifiedFacts?: VerifiedAbilityFacts,
): string {
  const master = MASTER_PROMPT.trim()
  const facts = buildVerifiedFactsSection(verifiedFacts).trim()
  const dynamic = buildDynamicContext(payload.context).trim()
  const pokemon = buildPokemonData(payload.pokemon).trim()
  const ability = buildAbilityData(payload.ability).trim()
  const formatCtx = buildFormatContext(payload.context).trim()
  const schema = JSON_SCHEMA_INSTRUCTIONS.trim()

  return `${master}

${facts ? `${facts}\n\n` : ''}${dynamic}

${pokemon}

${ability}

${formatCtx}

INSTRUCCIÓN FINAL:
Analiza en profundidad la habilidad indicada para el Pokémon especificado respetando rigurosamente los hechos verificados y adaptando la explicación al nivel de usuario indicado.
${schema}
`
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

