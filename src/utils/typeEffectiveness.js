/**
 * typeEffectiveness.js
 * Comprehensive Pokémon Type Effectiveness Engine (Gen 6 - 9)
 * Supports defensive calculation (×4, ×2, ×1, ×½, ×¼, ×0),
 * offensive coverage, and beginner-friendly pedagogical explanations.
 */

export const ALL_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

export const TYPE_COLORS = {
  bug: '#65a47b',
  dark: '#59636b',
  dragon: '#7d77a9',
  electric: '#ddb431',
  fairy: '#c875a6',
  fighting: '#c87545',
  fire: '#e5764f',
  flying: '#7f9db2',
  ghost: '#756d9a',
  grass: '#65a47b',
  ground: '#b18a62',
  ice: '#70afae',
  normal: '#929a98',
  poison: '#a46f9a',
  psychic: '#dd7181',
  rock: '#a29468',
  steel: '#77858e',
  water: '#5d98b4',
}

export const TYPE_ICONS = {
  normal: '🔘',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '🏜️',
  flying: '🪽',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '✨',
}

/**
 * Standard Gen 6 - 9 Type Chart
 * TYPE_CHART[attacker][defender] = multiplier (default 1 if unspecified)
 */
export const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5, grass: 2 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

/**
 * Normalizes input types to an array of lowercase type string identifiers.
 * Accepts strings (e.g. 'fire') or PokeAPI objects (e.g. { type: { name: 'fire' } } or { name: 'fire' }).
 */
export function normalizeTypes(activeTypes = []) {
  if (!Array.isArray(activeTypes)) return []
  return activeTypes
    .map((item) => {
      if (!item) return null
      if (typeof item === 'string') return item.toLowerCase()
      if (typeof item === 'object' && item.type?.name) return item.type.name.toLowerCase()
      if (typeof item === 'object' && item.name) return item.name.toLowerCase()
      return null
    })
    .filter(Boolean)
}

/**
 * Returns the damage multiplier of attacker against a single defender type.
 */
export function getSingleTypeMultiplier(attacker, defender) {
  if (!TYPE_CHART[attacker]) return 1
  const val = TYPE_CHART[attacker][defender]
  return val !== undefined ? val : 1
}

/**
 * Calculates defensive affinities for a Pokémon with given active types (1 or 2 types).
 * Returns grouped attacking types by vulnerability level.
 */
export function getDefensiveAffinities(activeTypes = []) {
  const types = normalizeTypes(activeTypes)
  if (types.length === 0) {
    return {
      hyperWeakness: [],
      weakness: [],
      neutral: [],
      resistance: [],
      extremeResistance: [],
      immunity: [],
      all: [],
      byType: {},
    }
  }

  const items = ALL_TYPES.map((attackingType) => {
    const breakdown = types.map((defType) => ({
      defendingType: defType,
      multiplier: getSingleTypeMultiplier(attackingType, defType),
    }))

    const totalMultiplier = breakdown.reduce((acc, curr) => acc * curr.multiplier, 1)

    return {
      type: attackingType,
      multiplier: totalMultiplier,
      breakdown,
    }
  })

  const byType = {}
  items.forEach((item) => {
    byType[item.type] = item
  })

  return {
    hyperWeakness: items.filter((item) => item.multiplier === 4),
    weakness: items.filter((item) => item.multiplier === 2),
    neutral: items.filter((item) => item.multiplier === 1),
    resistance: items.filter((item) => item.multiplier === 0.5),
    extremeResistance: items.filter((item) => item.multiplier === 0.25),
    immunity: items.filter((item) => item.multiplier === 0),
    all: items,
    byType,
    ...byType,
  }
}

/**
 * Calculates offensive coverage for a Pokémon's active attacking types.
 * For each of the 18 defending types, analyzes the effectiveness of each of the Pokémon's types.
 */
export function getOffensiveAffinities(activeTypes = []) {
  const types = normalizeTypes(activeTypes)
  if (types.length === 0) {
    return {
      superEffective: [],
      neutral: [],
      resisted: [],
      immune: [],
      all: [],
      byType: {},
    }
  }

  const items = ALL_TYPES.map((defendingType) => {
    const breakdown = types.map((atkType) => ({
      attackingType: atkType,
      multiplier: getSingleTypeMultiplier(atkType, defendingType),
    }))

    // Best offensive multiplier available to the Pokémon against this target
    const bestMultiplier = Math.max(...breakdown.map((b) => b.multiplier))
    // Types that achieve this best multiplier
    const bestTypes = breakdown
      .filter((b) => b.multiplier === bestMultiplier)
      .map((b) => b.attackingType)

    return {
      type: defendingType,
      bestMultiplier,
      bestTypes,
      breakdown,
    }
  })

  const byType = {}
  items.forEach((item) => {
    byType[item.type] = item
  })

  return {
    superEffective: items.filter((item) => item.bestMultiplier === 2),
    neutral: items.filter((item) => item.bestMultiplier === 1),
    resisted: items.filter((item) => item.bestMultiplier === 0.5),
    immune: items.filter((item) => item.bestMultiplier === 0),
    all: items,
    byType,
    ...byType,
  }
}

/**
 * Returns formatted multiplier text: "×4", "×2", "×1", "×½", "×¼", "×0"
 */
export function formatMultiplier(multiplier) {
  if (multiplier === 4) return '×4'
  if (multiplier === 2) return '×2'
  if (multiplier === 1) return '×1'
  if (multiplier === 0.5) return '×½'
  if (multiplier === 0.25) return '×¼'
  if (multiplier === 0) return '×0'
  return `×${multiplier}`
}

/**
 * Determines whether the active language is Spanish based on locale code or dictionary content.
 */
export function isSpanishLocale(locale, t) {
  if (typeof locale === 'string' && locale.trim().length > 0) {
    return locale.startsWith('es')
  }
  if (t?.affinities?.tabDefensive === 'Defensive' || t?.types?.fire === 'Fire') {
    return false
  }
  return true
}

/**
 * Generates an easy-to-understand explanation for a defensive matchup.
 */
export function getDefensiveExplanation(activeTypes, attackingType, multiplier, pokemonName, t, locale) {
  const atkLabel = t?.types?.[attackingType] || attackingType
  const types = normalizeTypes(activeTypes)
  const isSpanish = isSpanishLocale(locale, t)

  if (types.length === 1) {
    const typeLabel = t?.types?.[types[0]] || types[0]

    if (multiplier === 2) {
      return isSpanish
        ? `${pokemonName} recibe el doble de daño (×2) de ataques de tipo ${atkLabel} porque el tipo ${typeLabel} es débil frente a este elemento.`
        : `${pokemonName} takes double damage (×2) from ${atkLabel}-type attacks because the ${typeLabel} type is weak against it.`
    }
    if (multiplier === 0.5) {
      return isSpanish
        ? `${pokemonName} resiste los ataques de tipo ${atkLabel} y solo recibe la mitad del daño (×½) gracias a su tipo ${typeLabel}.`
        : `${pokemonName} resists ${atkLabel}-type attacks and takes half damage (×½) thanks to its ${typeLabel} type.`
    }
    if (multiplier === 0) {
      return isSpanish
        ? `${pokemonName} es inmune y no recibe daño (×0) de ataques de tipo ${atkLabel} porque el tipo ${typeLabel} no se ve afectado por este elemento.`
        : `${pokemonName} is immune and takes no damage (×0) from ${atkLabel}-type attacks because the ${typeLabel} type cannot be harmed by it.`
    }
    return isSpanish
      ? `Los ataques de tipo ${atkLabel} causan daño estándar (×1) frente al tipo ${typeLabel}.`
      : `${atkLabel}-type attacks deal normal damage (×1) against the ${typeLabel} type.`
  }

  // Dual type Pokémon
  const m1 = getSingleTypeMultiplier(attackingType, types[0])
  const m2 = getSingleTypeMultiplier(attackingType, types[1])
  const t1Label = t?.types?.[types[0]] || types[0]
  const t2Label = t?.types?.[types[1]] || types[1]

  if (multiplier === 4) {
    return isSpanish
      ? `${pokemonName} tiene una hiperdebilidad y recibe 4× de daño de tipo ${atkLabel}. Esto ocurre porque tanto ${t1Label} como ${t2Label} son débiles a este elemento, multiplicando ambas debilidades (2 × 2 = 4×).`
      : `${pokemonName} has an extreme weakness and takes 4× damage from ${atkLabel}. This happens because both ${t1Label} and ${t2Label} are weak to it, multiplying the damage (2 × 2 = 4×).`
  }

  if (multiplier === 2) {
    const weakType = m1 === 2 ? t1Label : t2Label
    const neutralType = m1 === 2 ? t2Label : t1Label
    return isSpanish
      ? `${pokemonName} recibe el doble de daño (2×) de tipo ${atkLabel} porque su tipo ${weakType} es débil ante él, mientras que su tipo ${neutralType} recibe daño neutral (2 × 1 = 2×).`
      : `${pokemonName} takes double damage (2×) from ${atkLabel} because its ${weakType} type is weak to it, while its ${neutralType} type receives neutral damage (2 × 1 = 2×).`
  }

  if (multiplier === 0.25) {
    return isSpanish
      ? `${pokemonName} tiene una gran resistencia y solo recibe un cuarto de daño (¼×) de tipo ${atkLabel}. Esto se debe a que tanto ${t1Label} como ${t2Label} resisten este elemento (½ × ½ = ¼×).`
      : `${pokemonName} has extreme resistance and takes only one-quarter damage (¼×) from ${atkLabel}, because both ${t1Label} and ${t2Label} resist it (½ × ½ = ¼×).`
  }

  if (multiplier === 0.5) {
    const resistType = m1 === 0.5 ? t1Label : t2Label
    const neutralType = m1 === 0.5 ? t2Label : t1Label
    return isSpanish
      ? `${pokemonName} reduce a la mitad el daño (½×) de tipo ${atkLabel} gracias a la resistencia de su tipo ${resistType}, mientras que su tipo ${neutralType} recibe daño neutral (½ × 1 = ½×).`
      : `${pokemonName} halves the damage (½×) from ${atkLabel} thanks to the resistance of its ${resistType} type, while its ${neutralType} type takes neutral damage (½ × 1 = ½×).`
  }

  if (multiplier === 0) {
    const immuneType = m1 === 0 ? t1Label : t2Label
    return isSpanish
      ? `${pokemonName} no recibe daño (0×) de ataques de tipo ${atkLabel} porque su tipo ${immuneType} es completamente inmune a este elemento.`
      : `${pokemonName} takes no damage (0×) from ${atkLabel} attacks because its ${immuneType} type is completely immune to this element.`
  }

  // Multiplier is 1
  if (m1 === 1 && m2 === 1) {
    return isSpanish
      ? `Los ataques de tipo ${atkLabel} causan daño normal (1×) porque ni ${t1Label} ni ${t2Label} presentan debilidad ni resistencia ante este tipo.`
      : `${atkLabel}-type attacks deal regular damage (1×) because neither ${t1Label} nor ${t2Label} have a weakness or resistance against it.`
  }

  // Neutral by cancellation (2 * 0.5 = 1)
  const weakType = m1 === 2 ? t1Label : t2Label
  const resistType = m1 === 0.5 ? t1Label : t2Label
  return isSpanish
    ? `El daño de tipo ${atkLabel} es neutral (1×) porque la debilidad del tipo ${weakType} (2×) se neutraliza con la resistencia del tipo ${resistType} (½×) (2 × ½ = 1×).`
    : `${atkLabel}-type damage is balanced out to neutral (1×) because the weakness of ${weakType} (2×) is cancelled by the resistance of ${resistType} (½×) (2 × ½ = 1×).`
}

/**
 * Generates an easy-to-understand explanation for an offensive matchup.
 */
export function getOffensiveExplanation(pokemonTypes, targetType, data, pokemonName, t, locale) {
  const targetLabel = t?.types?.[targetType] || targetType
  const isSpanish = isSpanishLocale(locale, t)
  const { bestMultiplier, bestTypes = [] } = data || {}

  const joinWord = isSpanish ? ' y ' : ' and '
  const typeLabels = bestTypes.map((typeKey) => t?.types?.[typeKey] || typeKey).join(joinWord)

  if (bestMultiplier === 2) {
    return isSpanish
      ? `${pokemonName} tiene ventaja ofensiva frente a Pokémon de tipo ${targetLabel} gracias a su tipo ${typeLabels}. Sus ataques de este elemento causarán el doble de daño (2×).`
      : `${pokemonName} has an offensive advantage against ${targetLabel}-type Pokémon thanks to its ${typeLabels} type. Its attacks of this element will deal double damage (2×).`
  }

  if (bestMultiplier === 0.5) {
    return isSpanish
      ? `Los Pokémon de tipo ${targetLabel} resisten los ataques de ${pokemonName}, reduciendo el daño a la mitad (½×).`
      : `${targetLabel}-type Pokémon resist ${pokemonName}'s elemental attacks, cutting damage in half (½×).`
  }

  if (bestMultiplier === 0) {
    return isSpanish
      ? `Los ataques elementales de ${pokemonName} no causan ningún daño (0×) frente a Pokémon de tipo ${targetLabel} debido a su inmunidad natural.`
      : `${pokemonName}'s elemental attacks deal no damage (0×) against ${targetLabel}-type Pokémon due to natural immunity.`
  }

  return isSpanish
    ? `Los ataques elementales de ${pokemonName} causan daño estándar (1×) contra Pokémon de tipo ${targetLabel}.`
    : `${pokemonName}'s elemental attacks deal regular damage (1×) against ${targetLabel}-type Pokémon.`
}

/**
 * Generates a concise smart summary highlighting key strengths and vulnerabilities.
 */
export function getAffinitiesSummary(defensive, offensive, pokemonName, t, locale) {
  const isSpanish = isSpanishLocale(locale, t)

  const hyperWeaknesses = defensive.hyperWeakness.map((i) => t?.types?.[i.type] || i.type)
  const weaknesses = defensive.weakness.map((i) => t?.types?.[i.type] || i.type)
  const immunities = defensive.immunity.map((i) => t?.types?.[i.type] || i.type)
  const extremeResistances = defensive.extremeResistance.map((i) => t?.types?.[i.type] || i.type)
  const resistances = defensive.resistance.map((i) => t?.types?.[i.type] || i.type)
  const offensiveAdvantages = offensive.superEffective.map((i) => t?.types?.[i.type] || i.type)

  const parts = []

  if (isSpanish) {
    if (hyperWeaknesses.length > 0) {
      parts.push(`Es especialmente vulnerable a ataques de tipo ${hyperWeaknesses.join(' y ')} (×4)`)
    } else if (weaknesses.length > 0) {
      parts.push(`Debe tener precaución frente a ataques de tipo ${weaknesses.slice(0, 3).join(', ')}${weaknesses.length > 3 ? '...' : ''} (×2)`)
    }

    if (immunities.length > 0) {
      parts.push(`es totalmente inmune a ${immunities.join(' y ')} (×0)`)
    }

    const keyResists = [...extremeResistances, ...resistances]
    if (keyResists.length > 0) {
      parts.push(`resiste firmemente ataques de tipo ${keyResists.slice(0, 3).join(', ')}`)
    }

    if (offensiveAdvantages.length > 0) {
      parts.push(`ofensivamente supera a ${offensiveAdvantages.slice(0, 3).join(', ')}${offensiveAdvantages.length > 3 ? '...' : ''}`)
    }

    if (parts.length === 0) {
      return `${pokemonName} posee un perfil elemental equilibrado sin debilidades extremas.`
    }

    const lastPart = parts[parts.length - 1] || ''
    const period = lastPart.endsWith('...') ? '' : '.'
    return `${pokemonName}: ` + parts.join(', ') + period
  }

  // English fallback
  if (hyperWeaknesses.length > 0) {
    parts.push(`is especially vulnerable to ${hyperWeaknesses.join(' and ')} attacks (×4)`)
  } else if (weaknesses.length > 0) {
    parts.push(`should watch out for ${weaknesses.slice(0, 3).join(', ')}${weaknesses.length > 3 ? '...' : ''} attacks (×2)`)
  }

  if (immunities.length > 0) {
    parts.push(`is completely immune to ${immunities.join(' and ')} (×0)`)
  }

  const keyResists = [...extremeResistances, ...resistances]
  if (keyResists.length > 0) {
    parts.push(`firmly resists ${keyResists.slice(0, 3).join(', ')}`)
  }

  if (offensiveAdvantages.length > 0) {
    parts.push(`offensively counters ${offensiveAdvantages.slice(0, 3).join(', ')}${offensiveAdvantages.length > 3 ? '...' : ''}`)
  }

  if (parts.length === 0) {
    return `${pokemonName} has a balanced elemental profile with no severe weaknesses.`
  }

  // Capitalize the first letter of the first part so "is especially..." -> "Is especially..."
  if (parts.length > 0) {
    parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }

  const lastPart = parts[parts.length - 1] || ''
  const period = lastPart.endsWith('...') ? '' : '.'
  return `${pokemonName}: ` + parts.join(', ') + period
}
