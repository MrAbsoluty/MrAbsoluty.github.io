/**
 * pokemonStats.js
 * Utility functions for Pokemon stats visual system and data processing.
 */

// Official ordered list of 6 base stats in standard Pokédex order
export const STAT_ORDER = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
]

/**
 * Concise visual emoji icons for the 6 canonical stats.
 */
export const STAT_ICONS = {
  hp: '❤️',
  attack: '⚔️',
  defense: '🛡️',
  'special-attack': '🔮',
  'special-defense': '🪞',
  speed: '⚡',
}

/**
 * Multi-stop color interpolation along a continuous 0 -> 255 scale:
 * 0 - 30:   Rojo / Coral (#ed6d5d) - Matches PokeGuide primary accent
 * 40 - 60:  Coral anaranjado a Naranja (#f37e4b -> #f59e0b)
 * 70 - 90:  Naranja a Amarillo dorado (#f59e0b -> #eab308)
 * 95 - 110: Amarillo a Lima suave (#eab308 -> #98d85b)
 * 115 - 140: Verde vibrante (#48bb78 / #22c55e)
 * 145 - 175: Verde esmeralda a Teal (#10b981)
 * 180 - 255: Aqua / Cyan celestial (#06b6d4 -> #0ea5e9)
 *
 * @param {number|string} value - The base stat value (0 to 255)
 * @returns {string} Hex color code (e.g. "#48bb78")
 */
export function getStatColor(value) {
  const v = Math.max(0, Math.min(255, Number(value) || 0))

  const stops = [
    { pos: 0,   r: 237, g: 109, b: 93 },  // #ed6d5d (PokeGuide Coral)
    { pos: 35,  r: 243, g: 126, b: 75 },  // #f37e4b (Coral Orange)
    { pos: 65,  r: 245, g: 158, b: 11 },  // #f59e0b (Warm Amber)
    { pos: 90,  r: 234, g: 179, b: 8 },   // #eab308 (Golden Yellow)
    { pos: 115, r: 132, g: 204, b: 22 },  // #84cc16 (Lime Green)
    { pos: 140, r: 72,  g: 187, b: 120 }, // #48bb78 (Vibrant Green)
    { pos: 175, r: 16,  g: 185, b: 129 }, // #10b981 (Teal Emerald)
    { pos: 215, r: 6,   g: 182, b: 212 }, // #06b6d4 (Aqua Cyan)
    { pos: 255, r: 14,  g: 165, b: 233 }, // #0ea5e9 (Deep Sky Cyan)
  ]

  let lower = stops[0]
  let upper = stops[stops.length - 1]

  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].pos && v <= stops[i + 1].pos) {
      lower = stops[i]
      upper = stops[i + 1]
      break
    }
  }

  const range = upper.pos - lower.pos
  const factor = range === 0 ? 0 : (v - lower.pos) / range

  const r = Math.round(lower.r + factor * (upper.r - lower.r))
  const g = Math.round(lower.g + factor * (upper.g - lower.g))
  const b = Math.round(lower.b + factor * (upper.b - lower.b))

  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Calculates bar fill percentage based on max 255:
 * @param {number|string} value
 * @returns {number} Value between 0 and 100
 */
export function getStatPercentage(value) {
  const num = Number(value) || 0
  return Math.min(Math.max((num / 255) * 100, 0), 100)
}

/**
 * Determines which stats stand out as signature strengths for a given Pokémon.
 *
 * Requirements:
 * - Does NOT blindly pick the top 2.
 * - Does NOT highlight stats if all stats are virtually identical (e.g. Mew 100, Glalie 80, Ditto 48).
 * - Highlights at most 2 stats (or 3 in rare cases of high-tier tied stats >= 120).
 * - Considers absolute value and statistical dispersion above the mean.
 *
 * @param {Array<{name: string, value: number}>} stats
 * @returns {Set<string>} Set of stat names that are highlighted
 */
export function getHighlightedStats(stats = []) {
  if (!stats || !Array.isArray(stats) || stats.length === 0) {
    return new Set()
  }

  const values = stats.map((s) => Number(s?.value) || 0)
  const maxVal = Math.max(...values)
  const minVal = Math.min(...values)

  // If the profile is flat (e.g. Mew with 100 across all stats, Glalie with 80),
  // no single stat is a signature standout.
  if (maxVal - minVal < 12) {
    return new Set()
  }

  const sum = values.reduce((acc, v) => acc + v, 0)
  const mean = sum / values.length
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Sort descending by value
  const sorted = [...stats].sort((a, b) => (Number(b?.value) || 0) - (Number(a?.value) || 0))
  const highlighted = new Set()

  for (const s of sorted) {
    const val = Number(s?.value) || 0
    const isTop = val === maxVal

    // Primary top stat qualifies if it's noticeably above the mean or a solid absolute number
    if (isTop && (val >= 70 || val >= mean + 0.4 * stdDev)) {
      highlighted.add(s.name)
      continue
    }

    // Secondary stat qualifies only if it represents a genuine peak:
    // Close to the maximum, or >= 100, and clearly above the Pokémon's own average
    if (highlighted.size < 2) {
      const isCloseToMax = val >= maxVal - 25 && val >= 85
      const isStandout = val >= 100 && val >= mean + 0.5 * stdDev
      const isStatisticalPeak = val >= mean + 0.85 * stdDev

      if ((isCloseToMax || isStandout || isStatisticalPeak) && val >= 75) {
        highlighted.add(s.name)
      }
    } else if (highlighted.size < 3 && val === maxVal && val >= 120) {
      // 3-way high tier tie
      highlighted.add(s.name)
    }
  }

  return highlighted
}

/**
 * Full canonical names for the 6 stats (unabbreviated for the expanded educational panel).
 */
export const STAT_FULL_NAMES = {
  hp: {
    es: 'Puntos de Salud (PS)',
    en: 'HP (Health Points)',
  },
  attack: {
    es: 'Ataque',
    en: 'Attack',
  },
  defense: {
    es: 'Defensa',
    en: 'Defense',
  },
  'special-attack': {
    es: 'Ataque Especial',
    en: 'Special Attack',
  },
  'special-defense': {
    es: 'Defensa Especial',
    en: 'Special Defense',
  },
  speed: {
    es: 'Velocidad',
    en: 'Speed',
  },
}

/**
 * Universal definitions for the 6 base stats (clear and accessible for beginners).
 */
export const STAT_DEFINITIONS = {
  hp: {
    es: 'Determina la cantidad de puntos de salud del Pokémon y cuánto daño puede soportar antes de quedar fuera de combate.',
    en: "Determines the Pokémon's health points and how much damage it can endure before fainting.",
  },
  attack: {
    es: 'Determina el poder y la fuerza de los movimientos de categoría física que utiliza el Pokémon.',
    en: "Determines the power and damage dealt by the Pokémon's physical moves.",
  },
  defense: {
    es: 'Influye en la cantidad de daño que recibe el Pokémon al ser alcanzado por movimientos físicos.',
    en: "Influences how much damage the Pokémon takes when struck by physical moves.",
  },
  'special-attack': {
    es: 'Determina el poder de los movimientos de categoría especial utilizados por el Pokémon.',
    en: "Determines the power and damage dealt by the Pokémon's special moves.",
  },
  'special-defense': {
    es: 'Influye en la cantidad de daño que recibe el Pokémon al ser alcanzado por movimientos especiales.',
    en: "Influences how much damage the Pokémon takes when struck by special moves.",
  },
  speed: {
    es: 'Determina qué Pokémon actúa primero en la mayoría de las situaciones durante el combate.',
    en: "Determines which Pokémon acts first in most battle turns and situations.",
  },
}

/**
 * Contextual impact notes explaining what having this stat high, low, or balanced means in battle.
 */
export const STAT_ROLE_NOTES = {
  hp: {
    high: {
      es: 'Posee una sólida reserva de vitalidad para aguantar combates prolongados.',
      en: 'Has a solid pool of vitality to endure prolonged battles.',
    },
    low: {
      es: 'Su salud es reducida, por lo que no puede recibir demasiados impactos directos.',
      en: 'Its health is low, making it vulnerable if hit by direct attacks.',
    },
    balanced: {
      es: 'Mantiene una cantidad de vida compensada acorde a su perfil.',
      en: 'Maintains a well-balanced health reserve.',
    },
  },
  attack: {
    high: {
      es: 'Destaca causando daño con ataques físicos contundentes.',
      en: 'Excels at dealing heavy damage with physical attacks.',
    },
    low: {
      es: 'No destaca con ataques físicos, rindiendo mejor con otras opciones.',
      en: 'Does not focus on physical power, performing better with other options.',
    },
    balanced: {
      es: 'Cuenta con una potencia física moderada y equilibrada.',
      en: 'Offers moderate and reliable physical strength.',
    },
  },
  defense: {
    high: {
      es: 'Destaca resistiendo ataques de categoría física con gran solidez.',
      en: 'Stands out in withstanding incoming physical strikes.',
    },
    low: {
      es: 'Es más vulnerable frente a movimientos físicos potentes.',
      en: 'Is softer and more vulnerable to strong physical moves.',
    },
    balanced: {
      es: 'Posee una resistencia física media y estable.',
      en: 'Maintains steady, average physical resilience.',
    },
  },
  'special-attack': {
    high: {
      es: 'Destaca causando gran daño con movimientos especiales.',
      en: 'Excels at unleashing high-damage special attacks.',
    },
    low: {
      es: 'Sus movimientos especiales causan un impacto limitado.',
      en: 'Its special moves deal comparatively modest damage.',
    },
    balanced: {
      es: 'Mantiene una capacidad ofensiva especial compensada.',
      en: 'Has a balanced special attack output.',
    },
  },
  'special-defense': {
    high: {
      es: 'Destaca absorbiendo ataques especiales del rival sin ceder terreno.',
      en: 'Effectively soaks up incoming special elemental strikes.',
    },
    low: {
      es: 'Presenta menor resistencia frente a ataques de categoría especial.',
      en: 'Shows lower resilience against special category moves.',
    },
    balanced: {
      es: 'Cuenta con una defensa especial moderada.',
      en: 'Has an evenly tuned special defense.',
    },
  },
  speed: {
    high: {
      es: 'Le permite adelantarse a la mayoría de rivales y tomar la iniciativa.',
      en: 'Allows it to outspeed many rivals and seize the initiative.',
    },
    low: {
      es: 'Suele actuar después de sus oponentes en la mayoría de turnos.',
      en: 'Usually acts after opponents in most battle turns.',
    },
    balanced: {
      es: 'Mantiene un ritmo de combate estándar y equilibrado.',
      en: 'Moves at an average, dependable combat pace.',
    },
  },
}

/**
 * Calculates the relative standing of a specific stat within the Pokémon's own 6 base stats.
 *
 * @param {string} statName
 * @param {Array<{name: string, value: number}>} stats
 * @param {Set<string>} highlightedSet
 * @returns {'strength' | 'weakness' | 'balanced' | 'flat'}
 */
export function getStatStanding(statName, stats = [], highlightedSet = new Set()) {
  if (!stats || !Array.isArray(stats) || stats.length === 0) {
    return 'balanced'
  }

  const values = stats.map((s) => Number(s?.value) || 0)
  const maxVal = Math.max(...values)
  const minVal = Math.min(...values)

  // Flat profile (Mew, Glalie, Ditto)
  if (maxVal - minVal < 12) {
    return 'flat'
  }

  // Highlights/signature strengths
  if (highlightedSet.has(statName)) {
    return 'strength'
  }

  const statItem = stats.find((s) => s?.name === statName)
  const val = Number(statItem?.value) || 0

  const sum = values.reduce((acc, v) => acc + v, 0)
  const mean = sum / values.length

  // Relative low stat: matches the minimum or is significantly below the Pokémon's own average
  const isTiedForMin = val === minVal
  const isNearMin = val <= minVal + 8 && val <= mean - 15

  if (isTiedForMin || isNearMin) {
    return 'weakness'
  }

  return 'balanced'
}

/**
 * Generates the complete structured educational explanation for a stat card.
 *
 * @param {string} statName
 * @param {number} value
 * @param {Array<{name: string, value: number}>} stats
 * @param {string} pokemonName
 * @param {string} locale
 * @param {object} t
 * @returns {{ title: string, definition: string, standing: string, badgeLabel: string, badgeIcon: string, interpretation: string }}
 */
export function getStatExplanation(statName, value, stats, pokemonName = 'Pokémon', locale = 'es', t) {
  const isSpanish = locale ? locale.startsWith('es') : (!t?.languages || t?.languages?.en !== 'English')
  const langKey = isSpanish ? 'es' : 'en'

  const title =
    STAT_FULL_NAMES[statName]?.[langKey] ||
    t?.detail?.statLabels?.[statName] ||
    statName

  const definition =
    STAT_DEFINITIONS[statName]?.[langKey] || ''

  const highlightedSet = getHighlightedStats(stats)
  const standing = getStatStanding(statName, stats, highlightedSet)

  const roleKey =
    standing === 'strength' ? 'high' : standing === 'weakness' ? 'low' : 'balanced'
  const roleNote =
    STAT_ROLE_NOTES[statName]?.[roleKey]?.[langKey] || ''

  let badgeLabel = ''
  let badgeIcon = ''
  let interpretation = ''

  if (standing === 'flat') {
    badgeIcon = '⭐'
    badgeLabel = isSpanish ? 'Perfil equilibrado' : 'Balanced spread'
    interpretation = isSpanish
      ? `⭐ En ${pokemonName}: Posee un reparto de estadísticas perfectamente equilibrado (${value} en cada una), por lo que rinde de forma uniforme en todas las facetas.`
      : `⭐ In ${pokemonName}: It has a balanced stat spread (${value} in each), performing consistently in every combat facet.`
  } else if (standing === 'strength') {
    badgeIcon = '⭐'
    badgeLabel = isSpanish ? 'Fortaleza' : 'Strength'
    interpretation = isSpanish
      ? `⭐ En ${pokemonName}: Es una de sus estadísticas más altas (${value}). ${roleNote}`
      : `⭐ In ${pokemonName}: It is one of its highest stats (${value}). ${roleNote}`
  } else if (standing === 'weakness') {
    badgeIcon = '⚠️'
    badgeLabel = isSpanish ? 'Estadística baja' : 'Lower stat'
    interpretation = isSpanish
      ? `⚠️ En ${pokemonName}: Es una de sus estadísticas más bajas (${value}). ${roleNote}`
      : `⚠️ In ${pokemonName}: It is one of its lower stats (${value}). ${roleNote}`
  } else {
    badgeIcon = '⚖️'
    badgeLabel = isSpanish ? 'Equilibrada' : 'Balanced'
    interpretation = isSpanish
      ? `⚖️ En ${pokemonName}: Con un valor de ${value}, se mantiene en un rango equilibrado dentro de sus estadísticas. ${roleNote}`
      : `⚖️ In ${pokemonName}: With a value of ${value}, it remains in a balanced range within its stats. ${roleNote}`
  }

  return {
    title,
    definition,
    standing,
    badgeLabel,
    badgeIcon,
    interpretation,
  }
}
