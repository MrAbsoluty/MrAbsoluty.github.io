/**
 * knowledgeLayer.ts
 * Capa de conocimiento verificada y determinista para PokeGuide AI.
 *
 * Principio:
 * "PokeGuide AI no debe inventar el conocimiento; debe interpretar,
 * contextualizar y enseñar conocimiento verificado."
 */

export interface StatChangeFact {
  stat: 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed' | 'accuracy' | 'evasion' | 'all'
  target: 'self' | 'target' | 'all-allies' | 'all-foes' | 'field'
  multiplier?: number
  stages?: number
  explanation: string
}

export interface VerifiedAbilityFacts {
  name: string
  canonicalName: string
  officialEffect: string
  statChanges: StatChangeFact[]
  speedChanges: {
    affectsSpeedStat: boolean
    explanation: string
  }
  turnCycle?: {
    hasTurnSkip: boolean
    pattern?: string
    explanation: string
  }
  weatherTrigger?: string | null
  terrainTrigger?: string | null
  damageImmunity?: {
    type?: string
    condition?: string
  }
  activation: string
  category: 'offensive' | 'defensive' | 'utility' | 'hindrance' | 'weather' | 'terrain'
  deterministicRating?: {
    score: number
    label: string
    source: 'deterministic'
  }
  prohibitedClaims: string[]
}

/**
 * Registro curado de hechos objetivos inmutables para habilidades clave.
 */
const CANONICAL_KNOWLEDGE_BASE: Record<string, Partial<VerifiedAbilityFacts>> = {
  truant: {
    name: 'truant',
    canonicalName: 'Truant (Ausente)',
    officialEffect: 'El Pokémon no puede ejecutar movimientos en turnos alternos (holgazanea en los turnos pares).',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Truant NO modifica la estadística Speed (Velocidad). El Pokémon mantiene intacta su velocidad base y orden de prioridad en los turnos en que puede actuar.',
    },
    turnCycle: {
      hasTurnSkip: true,
      pattern: 'En el primer turno puede actuar con normalidad; en el siguiente turno holgazanea y no actúa; después vuelve a actuar con normalidad, alternando sucesivamente.',
      explanation: 'La restricción es estrictamente de frecuencia de actuación por turno, NUNCA una reducción de la estadística de Velocidad.',
    },
    activation: 'Pasiva al inicio de cada turno par tras haber actuado en el impar.',
    category: 'hindrance',
    deterministicRating: {
      score: 2,
      label: 'Deficiente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'reduce la velocidad',
      'reduce la estadística speed',
      'disminuye la velocidad',
      'disminuye speed',
      'hace más lento en velocidad',
      'baja la velocidad',
      'penaliza la velocidad',
      'reducción de velocidad',
      'lowers speed',
      'reduces speed',
      'decreases speed',
      'speed reduction',
    ],
  },
  drought: {
    name: 'drought',
    canonicalName: 'Drought (Sequía)',
    officialEffect: 'Establece el clima de Luz Solar Intensa (Sol) durante 5 turnos (u 8 turnos si porta Roca Calor) al entrar al campo.',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Drought no altera la estadística de Velocidad de forma directa (puede activar Clorofila en compañeros de equipo).',
    },
    weatherTrigger: 'sunny',
    activation: 'Al entrar en combate (Switch-in).',
    category: 'weather',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'activa lluvia',
      'activa tormenta de arena',
      'activa nieve',
      'reduce el ataque',
      'reduce la velocidad',
      'daña al usuario cada turno',
      'debilita al usuario',
      'reduce las estadísticas del usuario',
      'la habilidad es débil porque potencia ataques de fuego del rival',
    ],
  },
  'huge-power': {
    name: 'huge-power',
    canonicalName: 'Huge Power (Potencia)',
    officialEffect: 'Duplica la estadística de Ataque físico del Pokémon (multiplicador x2 exacto).',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 2,
        explanation: 'Duplica el valor real del Ataque físico en combate.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Huge Power actúa EXCLUSIVAMENTE sobre el Ataque físico. NO modifica la Velocidad ni el Ataque Especial.',
    },
    activation: 'Permanente en combate.',
    category: 'offensive',
    deterministicRating: {
      score: 10,
      label: 'Imprescindible',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'duplica la velocidad',
      'aumenta la velocidad',
      'duplica el ataque especial',
      'lowers speed',
      'aumenta speed',
    ],
  },
  'pure-power': {
    name: 'pure-power',
    canonicalName: 'Pure Power (Energía Pura)',
    officialEffect: 'Duplica la estadística de Ataque físico del Pokémon (multiplicador x2 exacto).',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 2,
        explanation: 'Duplica el valor real del Ataque físico en combate.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Pure Power actúa EXCLUSIVAMENTE sobre el Ataque físico. NO modifica la Velocidad.',
    },
    activation: 'Permanente en combate.',
    category: 'offensive',
    deterministicRating: {
      score: 10,
      label: 'Imprescindible',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'duplica la velocidad',
      'aumenta la velocidad',
      'duplica el ataque especial',
    ],
  },
  'wonder-guard': {
    name: 'wonder-guard',
    canonicalName: 'Wonder Guard (Superguarda)',
    officialEffect: 'El Pokémon solo recibe daño directo de movimientos que le resulten supereficaces.',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'No modifica la estadística de Velocidad.',
    },
    damageImmunity: {
      condition: 'Inmune a ataques directos no supereficaces. Daño indirecto (trampas, veneno, quemadura, clima) le afecta normalmente.',
    },
    activation: 'Permanente en combate.',
    category: 'defensive',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'inmune a todo daño',
      'inmune al daño indirecto',
      'reduce la velocidad',
    ],
  },
  intimidate: {
    name: 'intimidate',
    canonicalName: 'Intimidate (Intimidación)',
    officialEffect: 'Reduce en 1 nivel el Ataque físico de los oponentes adyacentes al entrar en combate (-1 nivel de Ataque).',
    statChanges: [
      {
        stat: 'attack',
        target: 'all-foes',
        stages: -1,
        explanation: 'Reduce en 1 nivel el Ataque físico del rival.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Intimidate reduce EXCLUSIVAMENTE el Ataque físico del oponente; NO reduce la Velocidad ni la Defensa.',
    },
    activation: 'Al entrar en combate (Switch-in).',
    category: 'defensive',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'reduce la velocidad',
      'disminuye la velocidad',
      'baja la velocidad',
      'reduce la defensa',
      'lowers speed',
    ],
  },
  'speed-boost': {
    name: 'speed-boost',
    canonicalName: 'Speed Boost (Impulso)',
    officialEffect: 'Aumenta en 1 nivel la Velocidad del Pokémon al final de cada turno (+1 Velocidad).',
    statChanges: [
      {
        stat: 'speed',
        target: 'self',
        stages: 1,
        explanation: 'Sube 1 nivel de Velocidad al final del turno.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: true,
      explanation: 'Aumenta activamente la estadística de Velocidad en 1 nivel al final de cada turno.',
    },
    activation: 'Al final de cada turno en combate.',
    category: 'utility',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: ['reduce la velocidad', 'duplica el ataque'],
  },
  'slow-start': {
    name: 'slow-start',
    canonicalName: 'Slow Start (Inicio Lento)',
    officialEffect: 'Reduce a la mitad el Ataque físico y la Velocidad del Pokémon durante los primeros 5 turnos en combate.',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 0.5,
        explanation: 'Ataque reducido al 50% durante 5 turnos.',
      },
      {
        stat: 'speed',
        target: 'self',
        multiplier: 0.5,
        explanation: 'Velocidad reducida al 50% durante 5 turnos.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: true,
      explanation: 'Slow Start SÍ reduce la estadística Speed al 50% durante los primeros 5 turnos.',
    },
    activation: 'Durante los primeros 5 turnos en combate.',
    category: 'hindrance',
    deterministicRating: {
      score: 2,
      label: 'Deficiente',
      source: 'deterministic',
    },
    prohibitedClaims: ['aumenta la velocidad', 'sin penalización'],
  },
  unburden: {
    name: 'unburden',
    canonicalName: 'Unburden (Liviano)',
    officialEffect: 'Duplica la estadística de Velocidad del Pokémon tras perder o consumir el objeto equipado que llevaba al entrar en combate.',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: true,
      explanation: 'Duplica (x2) la Velocidad del Pokémon a partir del momento en que su objeto equipado es consumido o perdido en combate, para las acciones y turnos siguientes. No duplica la velocidad retroactivamente durante la ejecución del movimiento que causó el consumo.',
    },
    activation: 'Al consumir o perder el objeto equipado durante el combate (por ejemplo: al usar A Bocajarro, Sneasler reduce su Defensa y Defensa Especial; Hierba Blanca restaura esas reducciones y se consume en el proceso; al quedar sin objeto, Liviano duplica su Velocidad a partir de ese momento para las acciones y turnos siguientes).',
    category: 'utility',
    deterministicRating: {
      score: 8,
      label: 'Muy buena',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'se activa si entra sin objeto',
      'se activa sin tener objeto inicial',
      'aumenta el ataque',
      'reduce la velocidad',
    ],
  },
  guts: {
    name: 'guts',
    canonicalName: 'Guts (Agallas)',
    officialEffect: 'Aumenta el Ataque físico en un 50% (multiplicador x1.5) cuando el Pokémon sufre un problema de estado alterado (quemadura, parálisis, envenenamiento o sueño). Ignora la penalización de daño por quemadura.',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 1.5,
        explanation: 'Aumenta el Ataque en un 50% al sufrir un problema de estado alterado persistente. Ignora la penalización pasiva de daño provocada por la quemadura.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Guts NO altera la estadística de Velocidad. La parálisis sigue reduciendo la velocidad habitual salvo inmunidades.',
    },
    activation: 'Condicional a sufrir un problema de estado alterado persistente (típicamente autoinducido mediante Llamasfera o Toxisfera, o por recibir un ataque de estado del rival).',
    category: 'offensive',
    deterministicRating: {
      score: 8,
      label: 'Muy buena',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'se activa con confusión',
      'aumenta la velocidad',
      'se activa sin estado alterado',
      'cura el estado alterado',
    ],
  },
}

/**
 * Normaliza nombres de habilidades a slug estándar (ej. "Huge Power" a "huge-power").
 */
function toAbilitySlug(name: string): string {
  if (!name) return ''
  return name.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/**
 * Construye hechos verificados objetivos para cualquier habilidad dada.
 * Combina el registro curado y análisis heurístico de descripción oficial.
 */
export function buildVerifiedAbilityFacts(
  abilityName: string,
  abilityDescription?: string,
  localizedAbilityName?: string,
): VerifiedAbilityFacts {
  const slug = toAbilitySlug(abilityName)

  if (CANONICAL_KNOWLEDGE_BASE[slug]) {
    const base = CANONICAL_KNOWLEDGE_BASE[slug]
    return {
      name: slug,
      canonicalName: base.canonicalName || localizedAbilityName || abilityName,
      officialEffect: base.officialEffect || abilityDescription || 'Efecto verificado en combate.',
      statChanges: base.statChanges || [],
      speedChanges: base.speedChanges || {
        affectsSpeedStat: false,
        explanation: 'No modifica la estadística de Velocidad.',
      },
      turnCycle: base.turnCycle,
      weatherTrigger: base.weatherTrigger || null,
      terrainTrigger: base.terrainTrigger || null,
      damageImmunity: base.damageImmunity,
      activation: base.activation || 'Pasiva en combate.',
      category: base.category || 'utility',
      deterministicRating: base.deterministicRating,
      prohibitedClaims: base.prohibitedClaims || [],
    }
  }

  // Análisis heurístico para habilidades no catalogadas directamente
  const desc = (abilityDescription || '').toLowerCase()
  const affectsSpeed = desc.includes('velocidad') || desc.includes('speed')
  const isHindrance = desc.includes('negativo') || desc.includes('baja') || desc.includes('penaliz')

  const statChanges: StatChangeFact[] = []
  const prohibitedClaims: string[] = []

  if (!affectsSpeed) {
    prohibitedClaims.push(
      'reduce la velocidad',
      'disminuye la velocidad',
      'reduce speed',
      'lowers speed',
    )
  }

  return {
    name: slug,
    canonicalName: localizedAbilityName ? `${localizedAbilityName} (${abilityName})` : abilityName,
    officialEffect: abilityDescription || 'Descripción oficial provista por PokeGuide/PokéAPI.',
    statChanges,
    speedChanges: {
      affectsSpeedStat: affectsSpeed,
      explanation: affectsSpeed
        ? 'Puede interactuar con la Velocidad según su descripción oficial.'
        : 'Esta habilidad NO modifica la estadística Speed (Velocidad).',
    },
    activation: 'Condiciones descritas en el juego oficial.',
    category: isHindrance ? 'hindrance' : 'utility',
    prohibitedClaims,
  }
}

/* ==========================================================================
 * PREPARACIÓN PARA FASE 4: Competitive Knowledge Layer
 * ========================================================================== */

export type CompetitiveSource = 'general' | 'showdown' | 'champions'

export interface CompetitiveSetData {
  name: string
  item?: string
  ability?: string
  nature?: string
  evs?: Record<string, number>
  moves: string[]
}

export interface CompetitiveUsageStat {
  rank?: number
  usagePercent?: number
  winRate?: number
  commonPartners?: string[]
}

export interface CompetitiveContextData {
  source: CompetitiveSource
  format: string | null
  regulation: string | null
  verifiedFacts: string[]
  recommendedItems: string[]
  recommendedMoves: string[]
  commonSets: CompetitiveSetData[]
  usageStats: CompetitiveUsageStat[]
}

/**
 * Stub preparatorio para la siguiente fase (Fase 4):
 * Proveerá datos competitivos estructurados provenientes de Showdown, Smogon y Champions.
 */
export function getCompetitiveContext(
  source: CompetitiveSource = 'general',
  format: string | null = null,
  regulation: string | null = null,
): CompetitiveContextData {
  return {
    source,
    format,
    regulation,
    verifiedFacts: [],
    recommendedItems: [],
    recommendedMoves: [],
    commonSets: [],
    usageStats: [],
  }
}
