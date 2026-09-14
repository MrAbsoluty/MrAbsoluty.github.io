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
  context?: 'general' | 'showdown' | 'champions' | string
  format?: string | null // ej. "gen9-ou", "vgc", "ranked-singles"
  regulation?: string | null
  generation?: number | string | null // ej. 9
  battleMode?: 'singles' | 'doubles' | 'vgc' | string | null
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'competitive' | string
  locale?: 'es' | 'en' | string
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

FILOSOFÍA DE ANÁLISIS PROGRESIVO:
"PokeGuide no debe demostrar cuánto sabe. Debe decidir qué conocimiento es útil para el usuario y enseñarle por qué es útil."

No generes un informe competitivo extenso. Genera primero lo más importante:
1. La idea clave de la habilidad (breve y clara).
2. Cómo se aprovecha tácticamente (breve y práctico).
3. Estrategias destacadas SOLO si existen (0 a 3 máximo).
4. Contenido profundo secundario para usuarios que quieran explorar más.

PRINCIPIO FUNDAMENTAL:
"PokeGuide AI no debe inventar el conocimiento; debe interpretar, contextualizar y enseñar conocimiento verificado."

REGLAS DE ESTRATEGIAS:
- Una habilidad puede tener 0, 1, 2 o hasta 3 estrategias destacadas. NUNCA inventes estrategias para llenar el campo.
- Si una habilidad es limitada o perjudicial (ej. Truant/Ausente), devuelve un array vacío de estrategias.
- 1 estrategia excelente > 2 estrategias mediocres > 3 estrategias de relleno.
- Cada estrategia DEBE explicar POR QUÉ es destacada con lenguaje natural y conectores ("al utilizar", "debido a", "como consecuencia", "porque", "de esta forma").
- NUNCA uses cadenas de flechas (→, ↓) como sustituto de explicaciones. Las flechas SOLO en diagramas visuales, no en texto generado.

REGLAS SOBRE ALTERNATIVAS:
- Solo incluye alternativas cuando existan realmente y sean relevantes.
- Si no hay alternativas reales, devuelve un array vacío. NO inventes alternativas artificiales.

REGLAS FUNDAMENTALES DE ANÁLISIS COMPETITIVO:
1. FUENTE DE VERDAD Y REGLAS FACTUALES:
   - Los datos proporcionados en [HECHOS VERIFICADOS OBLIGATORIOS] son la verdad absoluta.
   - NUNCA contradigas, alteres ni inventes efectos que no aparezcan en los hechos verificados.
   - Si no tienes suficiente información para afirmar algo, indícalo claramente en lugar de especular.
   - NUNCA atribuyas a una habilidad un cambio de estadística que no aparezca en los datos verificados.
   - DISTINCIÓN ESTRICTA DE VELOCIDAD: NUNCA confundas una reducción de frecuencia de actuación (ej. turnos alternos) con una reducción de la estadística de Velocidad (Speed).
     * En Truant (Ausente): El Pokémon NO puede atacar en turnos alternos (holgazanea en turnos pares). Esto NO reduce su estadística de Velocidad. Su Speed es idéntica y se calcula normalmente. Queda terminantemente PROHIBIDO decir "reduce la velocidad", "disminuye speed", "hace más lento" o expresiones similares.
     * En Unburden (Liviano): Al usar un movimiento como A Bocajarro, Sneasler reduce sus defensas; Hierba Blanca restaura esas reducciones y se consume en el proceso; al quedar sin objeto, Liviano duplica su Velocidad a partir de ese momento para las acciones y turnos siguientes. La ejecución de A Bocajarro ocurre a velocidad normal; el aumento de velocidad entra en vigor tras consumirse el objeto. NUNCA decir que A Bocajarro se ejecuta a velocidad duplicada ni que se activa si entra sin objeto.
     * En Huge Power / Pure Power: Duplica ÚNICAMENTE el Ataque físico (x2), jamás la Velocidad ni el Ataque Especial.
     * En Drought (Sequía): Activa Sol (Luz Solar Intensa), jamás lluvia ni tormentas. NUNCA califiques los efectos globales del clima (como potenciar fuego rival) como una debilidad o autodaño intrínseco de la habilidad.
     * En Wonder Guard (Superguarda): Solo es vulnerable a daño directo de movimientos supereficaces; el daño indirecto le afecta con normalidad.
     * En Intimidate (Intimidación): Reduce el Ataque físico del rival en 1 nivel, NO la Velocidad ni la Defensa.

2. DISTINCIÓN RIGUROSA DE FORMATOS:
   - NUNCA asumas que las reglas de un formato aplican a otro.
   - Singles (Individuales/Smogon): Ritmo, cambios continuos, control de hazards (trampas/púas), wallbreaking y sweepers.
   - Doubles / VGC (Dobles Oficial): Control de velocidad (Tailwind, Trick Room), Protección (Protect), Fake Out, redirección (Follow Me), sinergia directa con el compañero y daño en área.

3. IDIOMA Y TERMINOLOGÍA OFICIAL DE POKÉMON EN ESPAÑOL:
   - Responde SIEMPRE en el idioma especificado en el contexto (Español neutro e internacional para "es", Inglés para "en").
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

4. PRECISIÓN PEDAGÓGICA:
   - Evita frases técnicamente ambiguas.
   - EVITAR: "El Pokémon debe descansar cada dos turnos." PREFERIR: "El Pokémon debe descansar turno por medio."
   - Explica las mecánicas con lenguaje claro y directamente interpretable en combate.

5. FORMATO DE SALIDA:
   - La respuesta DEBE ser EXCLUSIVAMENTE un único objeto JSON válido sin sintaxis Markdown, sin bloques de código y sin texto antes o después.
`

/**
 * Esquema oficial para generación estructurada en Gemini REST API (responseSchema).
 */
export const ABILITY_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    coreInsight: {
      type: 'STRING',
      description: 'Idea clave de la habilidad: qué hace y por qué importa (1-3 frases adaptadas al nivel del usuario).',
    },
    howToLeverage: {
      type: 'STRING',
      description: 'Cómo se aprovecha tácticamente esta habilidad (1-3 frases prácticas).',
    },
    competitiveValue: {
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
        summary: {
          type: 'STRING',
          description: 'Frase natural describiendo el valor competitivo (ej. "Tiene aplicaciones competitivas claras" o "Su valor competitivo es muy limitado").',
        },
      },
      required: ['score', 'label', 'summary'],
    },
    strategies: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: 'Nombre de la estrategia o combinación (ej. "Hierba Blanca + A Bocajarro").' },
          explanation: { type: 'STRING', description: 'Explicación en lenguaje natural con conectores causales. SIN flechas.' },
          whyFeatured: { type: 'STRING', description: 'Justificación de por qué esta estrategia es destacada.' },
        },
        required: ['name', 'explanation', 'whyFeatured'],
      },
      description: 'Estrategias destacadas (0 a 3 máximo). Puede ser un array vacío si no hay estrategias relevantes.',
    },
    alternatives: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: 'Nombre de la alternativa.' },
          explanation: { type: 'STRING', description: 'Breve explicación de la alternativa.' },
        },
        required: ['name', 'explanation'],
      },
      description: 'Alternativas relevantes. Array vacío si no existen alternativas reales. NUNCA inventar alternativas artificiales.',
    },
    deepDive: {
      type: 'OBJECT',
      properties: {
        mechanics: { type: 'STRING', description: 'Explicación profunda de la mecánica interna de la habilidad (opcional, puede ser cadena vacía).' },
        singles: { type: 'STRING', description: 'Análisis contextualizado en Singles/Smogon (opcional, puede ser cadena vacía).' },
        doubles: { type: 'STRING', description: 'Análisis contextualizado en Doubles/VGC (opcional, puede ser cadena vacía).' },
        synergies: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Sinergias con compañeros, objetos o movimientos.' },
        counters: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Amenazas, counters o contramedidas.' },
        proTip: { type: 'STRING', description: 'Consejo avanzado para sacar el máximo provecho (opcional, puede ser cadena vacía).' },
      },
    },
  },
  required: [
    'coreInsight',
    'howToLeverage',
    'competitiveValue',
    'strategies',
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
      coreInsight: {
        type: 'string',
        description: 'Idea clave de la habilidad: qué hace y por qué importa (1-3 frases adaptadas al nivel del usuario).',
      },
      howToLeverage: {
        type: 'string',
        description: 'Cómo se aprovecha tácticamente esta habilidad (1-3 frases prácticas).',
      },
      competitiveValue: {
        type: 'object',
        properties: {
          score: { type: 'number', description: 'Calificación numérica entera del 1 al 10.' },
          label: { type: 'string', description: 'Etiqueta cualitativa: Deficiente, Situacional, Buena, Muy buena, Excelente o Imprescindible.' },
          source: { type: 'string', description: 'Origen: deterministic, hybrid o ai.' },
          summary: { type: 'string', description: 'Frase natural describiendo el valor competitivo.' },
        },
        required: ['score', 'label', 'source', 'summary'],
        additionalProperties: false,
      },
      strategies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nombre de la estrategia o combinación.' },
            explanation: { type: 'string', description: 'Explicación en lenguaje natural. SIN flechas.' },
            whyFeatured: { type: 'string', description: 'Justificación de por qué es destacada.' },
          },
          required: ['name', 'explanation', 'whyFeatured'],
          additionalProperties: false,
        },
        description: 'Estrategias destacadas (0 a 3 máximo). Puede ser array vacío.',
      },
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nombre de la alternativa.' },
            explanation: { type: 'string', description: 'Breve explicación.' },
          },
          required: ['name', 'explanation'],
          additionalProperties: false,
        },
        description: 'Alternativas relevantes. Array vacío si no existen.',
      },
      deepDive: {
        type: 'object',
        properties: {
          mechanics: { type: 'string', description: 'Explicación profunda de la mecánica (puede ser cadena vacía).' },
          singles: { type: 'string', description: 'Análisis contextualizado en Singles (puede ser cadena vacía).' },
          doubles: { type: 'string', description: 'Análisis contextualizado en Doubles/VGC (puede ser cadena vacía).' },
          synergies: { type: 'array', items: { type: 'string' }, description: 'Sinergias con compañeros, objetos o movimientos.' },
          counters: { type: 'array', items: { type: 'string' }, description: 'Amenazas y contramedidas.' },
          proTip: { type: 'string', description: 'Consejo avanzado (puede ser cadena vacía).' },
        },
        required: ['mechanics', 'singles', 'doubles', 'synergies', 'counters', 'proTip'],
        additionalProperties: false,
      },
    },
    required: [
      'coreInsight',
      'howToLeverage',
      'competitiveValue',
      'strategies',
      'alternatives',
      'deepDive',
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
  "coreInsight": "Idea clave de la habilidad: qué hace y por qué importa (1-3 frases adaptadas al nivel del usuario).",
  "howToLeverage": "Cómo se aprovecha tácticamente (1-3 frases prácticas).",
  "competitiveValue": {
    "score": 8,
    "label": "Excelente",
    "source": "ai",
    "summary": "Frase natural describiendo el valor competitivo."
  },
  "strategies": [
    {
      "name": "Nombre de la estrategia o combinación",
      "explanation": "Explicación en lenguaje natural usando conectores como 'al utilizar', 'debido a', 'como consecuencia'. NUNCA usar cadenas de flechas.",
      "whyFeatured": "Justificación de por qué esta estrategia es destacada."
    }
  ],
  "alternatives": [
    {
      "name": "Nombre de alternativa",
      "explanation": "Breve explicación"
    }
  ],
  "deepDive": {
    "mechanics": "Explicación profunda de la mecánica (cadena vacía si no aplica).",
    "singles": "Análisis en Singles (cadena vacía si no aplica).",
    "doubles": "Análisis en Doubles/VGC (cadena vacía si no aplica).",
    "synergies": ["Sinergia con contexto táctico"],
    "counters": ["Amenaza o contramedida"],
    "proTip": "Consejo avanzado (cadena vacía si no aplica)."
  }
}

Reglas sobre los valores:
- "competitiveValue.score": número del 1 al 10.
- "competitiveValue.label": una de: "Deficiente", "Situacional", "Buena", "Muy buena", "Excelente", "Imprescindible".
- "competitiveValue.source": "deterministic", "hybrid" o "ai".
- "strategies": array de 0 a 3 elementos. Si la habilidad no tiene estrategias competitivas relevantes (ej. Truant), devuelve [].
- "alternatives": array de 0 a N. Si no hay alternativas reales, devuelve [].
- "deepDive": campos opcionales. Usa cadena vacía "" si la sección no aporta valor.
- NUNCA uses flechas (→, ↓, ↑) en explanation ni en whyFeatured. Usa conectores naturales.
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

  let conditionsBlock = ''
  if (facts.verifiedConditions && facts.verifiedConditions.length > 0) {
    conditionsBlock = `\n- CONDICIONES OBLIGATORIAS:\n${facts.verifiedConditions.map((c) => `  * ${c}`).join('\n')}`
  }

  let synergiesBlock = ''
  if (facts.verifiedSynergies && facts.verifiedSynergies.length > 0) {
    synergiesBlock = `\n\n[SINERGIAS VERIFICADAS (VERIFIED SYNERGIES)]\nLas siguientes combinaciones tácticas están verificadas por el Knowledge Layer. La IA puede seleccionarlas para la sección de estrategias destacadas ('strategies'):\n${facts.verifiedSynergies.map((s, idx) => `Sinergia ${idx + 1}: ${s.name}${s.featured || s.priority === 1 ? ' [DESTACADA PRIORITARIA]' : ''}
- Objeto: ${s.item || 'N/A'}
- Movimiento: ${s.move || 'N/A'}
- Detonante / Activación: ${s.trigger}
- Interacción mecánica: ${s.interaction}
- Resultado: ${s.result}
- Justificación táctica: ${s.whyUseful}`).join('\n\n')}`
  }

  let activationsBlock = ''
  if (facts.verifiedActivations && facts.verifiedActivations.length > 0) {
    activationsBlock = `\n\n[MECANISMOS DE ACTIVACIÓN VERIFICADOS]\n${facts.verifiedActivations.map((a) => `- ${a.trigger}: ${a.itemOrCondition} (${a.isConsumption ? 'Consumo' : 'Pérdida - NO consumo'}). ${a.explanation} ${a.constraints || ''}`).join('\n')}`
  }

  return `
[HECHOS VERIFICADOS OBLIGATORIOS (KNOWLEDGE LAYER - VERIFIED FACTS)]
Los siguientes datos son inmutables y la ÚNICA fuente de verdad para este análisis:
- Habilidad: ${facts.canonicalName}
- Efecto oficial en el juego: ${facts.officialEffect}
- Modificaciones de estadísticas comprobadas: ${statChangesStr}
- Interacción con la estadística Speed (Velocidad): ${facts.speedChanges.explanation}
- ${turnCycleStr}
- Activación: ${facts.activation}
- Categoría táctica: ${facts.category}${conditionsBlock}
${ratingHint}
- AFIRMACIONES ESTRICTAMENTE PROHIBIDAS: ${prohibitedStr}${synergiesBlock}${activationsBlock}

REGLAS FACTUALES Y DE SINERGIAS OBLIGATORIAS:
1. No puedes contradecir, modificar ni reinterpretar estos hechos verificados.
2. NUNCA atribuyas a una habilidad un cambio de estadística que no aparezca en los datos verificados.
3. NUNCA confundas una reducción de frecuencia de actuación (turnos alternos) con una reducción de la estadística Speed.
4. Para la sección 'strategies', utiliza EXCLUSIVAMENTE sinergias verificadas del Knowledge Layer.
5. Cada estrategia DEBE explicarse en prosa natural y causal (usando conectores como 'al utilizar', 'debido a', 'como consecuencia', 'de esta forma'). NUNCA uses cadenas de flechas (→, ↓).
6. NUNCA inventes sinergias o combinaciones con objetos competitivos genéricos (Choice Band, Choice Scarf, Life Orb) tratándolos como si activaran o interactuaran con la habilidad cuando no es el caso.
7. Si no existen sinergias verificadas aplicables al Pokémon o contexto, devuelve strategies: [].
8. NUNCA afirmes que el aumento de Velocidad dura "para el resto del combate" o que es permanente; la duración precisa es "mientras permanezca sin objeto".
9. NUNCA afirmes que la habilidad permite superar a "casi cualquier rival" o "a cualquier rival"; utiliza formulaciones precisas como "permitiéndole superar a muchos rivales que antes podían ser más rápidos".
10. Evita expresiones espectaculares o imprecisas como "velocidad extrema"; utiliza siempre términos precisos como "aumento de Velocidad" o "duplicación de Velocidad".
11. NUNCA afirmes que tener objeto al inicio o entrar con objeto es un requisito obligatorio de la habilidad: entrar sin objeto no activa Liviano por sí solo, pero si el Pokémon entra sin objeto y obtiene uno durante el combate, perderlo o consumirlo sí puede activar la habilidad.
12. En los consejos avanzados o proTip, no formules prohibiciones absolutas (ej. "evita equipar X"); formula pedagógicamente el principio: "Si buscas activar Liviano mediante la pérdida del objeto, necesitas utilizar un objeto que pueda perderse o consumirse durante el combate".
13. PRIORIDAD DE SINERGIA DESTACADA: Las sinergias verificadas marcadas como prioritarias tienen preferencia absoluta sobre mecanismos de activación genéricos al seleccionar 'strategies'. Para Liviano en Sneasler, la sinergia prioritaria 'Hierba Blanca + A Bocajarro' DEBE aparecer como la primera estrategia destacada (strategies[0]). Los mecanismos de activación genéricos (como Bayas o Globo Helio) NO deben desplazar a la sinergia destacada principal; deben ubicarse en 'alternatives' cuando sean relevantes.
14. NO SOBREAFIRMAR: La prioridad de una estrategia destacada NO significa afirmar que sea la única forma de jugar, obligatoria para el Pokémon, o la mejor en todos los formatos. Preséntala con rigor como una interacción destacada y verificada que optimiza la activación de la habilidad de forma controlada.
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
- Evita jerga técnica sin explicación ("speed tiers", "momentum", "wallbreaker", "sweep", "sweeps", "outspeeds", "benchmark", "win condition").
- Prefiere términos universales y comprensibles: "superar en Velocidad", "amenaza", "aumento de Velocidad", "rival", "estrategia", "sinergia".
- En coreInsight: la idea clave debe poder entenderse sin conocimientos previos de competitivo.
- En strategies.explanation: explica cada paso de la interacción con lenguaje accesible y causal.
- Ejemplo de adaptación: "Liviano duplica la Velocidad de Sneasler cuando pierde o consume su objeto, permitiéndole superar a muchos rivales que antes podían ser más rápidos. Por eso, podemos buscar una forma de hacer que el objeto se consuma durante el combate."
`
  } else if (userLevel === 'intermediate') {
    pedagogicalGuidance = `
DIRECTRICES TÁCTICAS PARA NIVEL INTERMEDIO (intermediate):
- Objetivo: Usuario que conoce las bases competitivas y mecánicas esenciales.
- Utiliza terminología competitiva estándar: STAB, Sweeper, Muralla (Wall), Pivote, Check, Counter, Hazard, Sinergia.
- Explica estrategias claras y cómo la habilidad define el rol del Pokémon en el equipo.
- Reduce explicaciones demasiado básicas sobre qué es un tipo o qué es daño físico.
- Ejemplo de adaptación: "Liviano duplica la Velocidad cuando el Pokémon pierde su objeto, por lo que podemos construir una estrategia alrededor de objetos consumibles o interacciones que provoquen su pérdida de forma controlada."
`
  } else if (userLevel === 'advanced') {
    pedagogicalGuidance = `
DIRECTRICES ESTRATÉGICAS PARA NIVEL AVANZADO (advanced):
- Objetivo: Usuario con experiencia competitiva sólida.
- Utiliza terminología competitiva avanzada: Matchups, control de velocidad (speed control), presión ofensiva (pressure), setup, condición de victoria (win condition), momentum.
- Céntrate en optimización, escenarios de riesgo/recompensa y tempo de la partida.
- Ejemplo de adaptación: "Liviano convierte la pérdida del objeto en una condición de control de Velocidad propia, permitiendo que Sneasler supere amenazas más rápidas una vez activada la habilidad."
`
  } else if (userLevel === 'competitive') {
    pedagogicalGuidance = `
DIRECTRICES DE ÉLITE PARA NIVEL COMPETITIVO (competitive):
- Objetivo: Usuario avanzado/competitivo y jugador de torneos.
- Utiliza terminología técnica completa y análisis profundo.
- Analiza el metajuego específico, roles, teambuilding, distribución de amenazas, daño relativo y counterplay óptimo.
- Asume conocimientos previos avanzados sin explicaciones introductorias.
- Ejemplo de adaptación: "Liviano proporciona un multiplicador de ×2 a la Velocidad tras la pérdida del objeto, permitiendo alcanzar benchmarks relevantes y convertir ciertas interacciones de consumo o remoción de objeto en una condición de snowball."
`
  }

  return `
[CONTEXTO DEL ANÁLISIS]
- Plataforma: ${platform}
- Modalidad de Batalla: ${battleMode.toUpperCase()}
- Formato / Tier: ${format}
- Generación: ${generation}
- Nivel de audiencia asignado: ${userLevel.toUpperCase()}
- Idioma de respuesta requerido: ${locale === 'en' ? 'Inglés' : 'Español (neutro e internacional)'}
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
 * Construye directrices específicas según el contexto competitivo seleccionado
 * (General, Pokémon Showdown o Pokémon Champions).
 *
 * PRINCIPIO: Separa CONTEXTO de CONOCIMIENTO. No finge tener datos no integrados.
 */
export function buildCompetitiveContextPrompt(context: AnalysisContext = {}): string {
  const platform = (context.context || context.platform || 'general').toLowerCase().trim()
  const format = context.format ? String(context.format).trim() : null
  const regulation = context.regulation ? String(context.regulation).trim() : null

  if (platform === 'showdown') {
    const formatLabel = format || 'Gen 9 OU'
    return `
[CONTEXTO COMPETITIVO: POKÉMON SHOWDOWN]
- Plataforma: Pokémon Showdown
- Formato seleccionado: ${formatLabel}
- DIRECTRICES OBLIGATORIAS:
  1. Analiza el impacto de la habilidad EXCLUSIVAMENTE dentro del contexto de Pokémon Showdown (${formatLabel}).
  2. NO mezcles recomendaciones de otros formatos o tiers distintos (ej. no apliques reglas o dinámicas de VGC en formatos individuales ni viceversa).
  3. PRINCIPIO DE VERACIDAD (SEPARACIÓN DE CONTEXTO Y CONOCIMIENTO): No inventes datos estadísticos de uso, tiers o sets no verificados. Basa tus recomendaciones en mecánicas objetivas y sinergias reales del formato.
`
  }

  if (platform === 'champions') {
    const formatLabel = format || 'Ranked Singles'
    const regLabel = regulation ? `Regulación: ${regulation}` : 'Regulación estándar'
    return `
[CONTEXTO COMPETITIVO: POKÉMON CHAMPIONS]
- Plataforma: Pokémon Champions
- Contexto / Modalidad: ${formatLabel}
- ${regLabel}
- DIRECTRICES OBLIGATORIAS:
  1. Analiza la habilidad dentro del entorno competitivo de Pokémon Champions (${formatLabel}).
  2. NO mezcles datos ni reglas de Pokémon Showdown u otros reglamentos no aplicables.
  3. PRINCIPIO DE VERACIDAD: No asumas ni inventes restricciones no confirmadas. Evalúa la viabilidad táctica en este entorno.
`
  }

  // Por defecto: 'general'
  return `
[CONTEXTO COMPETITIVO: GENERAL]
- Plataforma: General (Sin metagame específico predefinido)
- DIRECTRICES OBLIGATORIAS:
  1. Explica la habilidad desde una perspectiva táctica general y mecánica de combate Pokémon.
  2. NO asumas ningún metagame concreto ni atribuyas recomendaciones a tiers específicos (ej. NO afirmes que un objeto o movimiento es "meta en Gen 9 OU" sin datos competitivos verificados).
  3. Céntrate en cómo funciona la habilidad, cuándo resulta ventajosa y con qué tipos de estrategias y roles sinergiza naturalmente.
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
  const compCtx = buildCompetitiveContextPrompt(payload.context).trim()
  const pokemon = buildPokemonData(payload.pokemon).trim()
  const ability = buildAbilityData(payload.ability).trim()
  const formatCtx = buildFormatContext(payload.context).trim()
  const schema = JSON_SCHEMA_INSTRUCTIONS.trim()

  return `${master}

${facts ? `${facts}\n\n` : ''}${dynamic}

${compCtx}

${pokemon}

${ability}

${formatCtx}

INSTRUCCIÓN FINAL:
Analiza la habilidad indicada para el Pokémon especificado siguiendo la FILOSOFÍA DE ANÁLISIS PROGRESIVO:
1. Empieza por la idea clave (coreInsight): breve, útil y adaptada al nivel del usuario.
2. Explica cómo se aprovecha (howToLeverage): práctico y directo.
3. Si existen estrategias destacadas REALES Y VERIFICADAS, inclúyelas (0 a 3). Si no existen, devuelve strategies: [].
4. Proporciona contenido profundo en deepDive para quienes quieran explorar más.
5. Respeta rigurosamente los hechos verificados y delimita el análisis al contexto competitivo solicitado.
6. Adapta el vocabulario y profundidad al nivel de usuario indicado.
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

  // Campos obligatorios del contrato progresivo
  if (typeof data.coreInsight !== 'string' || !data.coreInsight.trim()) {
    return { valid: false, missingField: 'coreInsight' }
  }

  if (!data.competitiveValue || typeof data.competitiveValue !== 'object') {
    return { valid: false, missingField: 'competitiveValue' }
  }

  const cv = data.competitiveValue as Record<string, unknown>
  if (typeof cv.score !== 'number' && isNaN(Number(cv.score))) {
    return { valid: false, missingField: 'competitiveValue.score' }
  }
  if (typeof cv.label !== 'string' || !cv.label.trim()) {
    return { valid: false, missingField: 'competitiveValue.label' }
  }
  if (typeof cv.summary !== 'string' || !cv.summary.trim()) {
    return { valid: false, missingField: 'competitiveValue.summary' }
  }

  // strategies es obligatorio pero puede ser un array vacío
  if (!Array.isArray(data.strategies)) {
    return { valid: false, missingField: 'strategies' }
  }

  // howToLeverage es obligatorio
  if (typeof data.howToLeverage !== 'string') {
    return { valid: false, missingField: 'howToLeverage' }
  }

  return { valid: true }
}

