/**
 * moveTranslations.js
 * Capa de traducción local verificada y normalización de textos tácticos para el Move Dex.
 *
 * Flujo:
 * 1. PokéAPI texto localizado directo en el idioma solicitado (si existe).
 * 2. Traducción local verificada por slug o patrones mecánicos recurrentes.
 * 3. Fallback seguro en el idioma solicitado (descripción localizada oficial).
 * 4. Inglés original sin alterar cuando locale = 'en'.
 */

// Traducciones verificadas para movimientos clave y casos recurrentes
export const VERIFIED_MOVE_EFFECTS_ES = {
  pound: {
    effect: 'Inflige daño normal sin ningún efecto adicional.',
    fullEffect: 'Golpea al objetivo e inflige daño normal sin ningún efecto secundario adicional.',
  },
  scratch: {
    effect: 'Inflige daño normal sin ningún efecto adicional.',
    fullEffect: 'Araña al objetivo con garras afiladas infligiendo daño regular sin efectos secundarios.',
  },
  tackle: {
    effect: 'Inflige daño normal sin ningún efecto adicional.',
    fullEffect: 'Embiste con todo el cuerpo e inflige daño regular sin efectos secundarios adicionales.',
  },
  'close-combat': {
    effect: 'Reduce la Defensa y la Defensa Especial del usuario en un nivel tras causar daño.',
    fullEffect: 'Lucha cuerpo a cuerpo sin protegerse. Causa gran daño y reduce la Defensa y Defensa Especial del usuario.',
  },
  'swords-dance': {
    effect: 'Aumenta el Ataque del usuario en dos niveles.',
    fullEffect: 'Una danza frenética de combate que aumenta el Ataque del usuario en dos niveles.',
  },
  earthquake: {
    effect: 'Inflige daño a todos los Pokémon en combate. Potencia duplicada si el objetivo está bajo tierra.',
    fullEffect: 'Provoca un temblor que daña a todos los Pokémon en combate excepto a aquellos con Levitación o tipo Volador.',
  },
  flamethrower: {
    effect: 'Tiene un 10% de probabilidad de quemar al objetivo.',
    fullEffect: 'Ataca con una intensa corriente de fuego con un 10% de probabilidad de causar quemaduras.',
  },
  surf: {
    effect: 'Inflige daño a todos los Pokémon adyacentes en combate.',
    fullEffect: 'Crea una gran ola que ataca a todos los Pokémon adyacentes. La potencia se duplica si el objetivo está buceando.',
  },
  'ice-beam': {
    effect: 'Tiene un 10% de probabilidad de congelar al objetivo.',
    fullEffect: 'Dispara un rayo de hielo concentrado con un 10% de probabilidad de congelar al objetivo.',
  },
  thunderbolt: {
    effect: 'Tiene un 10% de probabilidad de paralizar al objetivo.',
    fullEffect: 'Lanza una fuerte descarga eléctrica con un 10% de probabilidad de paralizar al objetivo.',
  },
  'shadow-ball': {
    effect: 'Tiene un 20% de probabilidad de reducir la Defensa Especial del objetivo en un nivel.',
    fullEffect: 'Lanza una esfera oscura con un 20% de probabilidad de reducir la Defensa Especial del objetivo.',
  },
  moonblast: {
    effect: 'Tiene un 30% de probabilidad de reducir el Ataque Especial del objetivo en un nivel.',
    fullEffect: 'Ataca con el poder de la luna con un 30% de probabilidad de reducir el Ataque Especial del rival.',
  },
  'draco-meteor': {
    effect: 'Reduce el Ataque Especial del usuario en dos niveles tras causar daño.',
    fullEffect: 'Invoca cometas del cielo. Reduce el Ataque Especial del usuario en dos niveles tras el impacto.',
  },
  'calm-mind': {
    effect: 'Aumenta el Ataque Especial y la Defensa Especial del usuario en un nivel.',
    fullEffect: 'El usuario entra en calma para aumentar su Ataque Especial y su Defensa Especial en un nivel.',
  },
  roost: {
    effect: 'Restaura hasta la mitad de los PS máximos y pierde temporalmente el tipo Volador.',
    fullEffect: 'Aterriza para descansar, recuperando hasta la mitad de sus PS máximos ese turno.',
  },
  toxic: {
    effect: 'Envenena gravemente al objetivo; el daño aumenta gradualmente cada turno.',
    fullEffect: 'Envenena de forma grave al objetivo, haciendo que el daño por veneno aumente en cada turno.',
  },
  'u-turn': {
    effect: 'El usuario cambia por otro Pokémon inmediatamente después de atacar.',
    fullEffect: 'Tras infligir daño, el usuario regresa a su Poké Ball y da paso a otro compañero del equipo.',
  },
  'knock-off': {
    effect: 'Inutiliza el objeto del objetivo e inflige 50% más de daño si lo tiene equipado.',
    fullEffect: 'Derriba el objeto equipado del rival. Si el rival porta un objeto válido, la potencia aumenta un 50%.',
  },
  'stealth-rock': {
    effect: 'Coloca piedras flotantes en el campo rival que dañan a los Pokémon al entrar.',
    fullEffect: 'Trampa de rocas flotantes que inflige daño a los Pokémon rivales al entrar al combate.',
  },
  taunt: {
    effect: 'Obliga al objetivo a usar únicamente movimientos de ataque durante 3 turnos.',
    fullEffect: 'Provoca al rival para que durante 3 turnos solo pueda utilizar movimientos de ataque directo.',
  },
  protect: {
    effect: 'Evita todos los ataques durante ese turno. Puede fallar si se usa consecutivamente.',
    fullEffect: 'Bloquea cualquier ataque directo dirigido al usuario en ese turno. Su probabilidad disminuye con el uso continuo.',
  },
  substitute: {
    effect: 'Usa el 25% de los PS máximos para crear un señuelo que absorbe daño.',
    fullEffect: 'Sacrifica una cuarta parte de sus PS máximos para crear un sustituto que lo protege de ataques y estados.',
  },
  recover: {
    effect: 'Restaura hasta la mitad de los PS máximos del usuario.',
    fullEffect: 'Restaura hasta el 50% de los puntos de salud máximos del usuario.',
  },
  'rapid-spin': {
    effect: 'Elimina trampas y ataduras del campo, y aumenta la Velocidad del usuario en un nivel.',
    fullEffect: 'Gira a gran velocidad para eliminar Trampa Rocas, Púas y ataduras, además de aumentar la Velocidad.',
  },
  'flare-blitz': {
    effect: 'El usuario recibe como daño de retroceso un tercio del daño infligido. Tiene un 10% de probabilidad de quemar al objetivo.',
    fullEffect: 'El usuario se cubre de llamas y carga contra el objetivo. Recibe un tercio del daño causado en retroceso y tiene un 10% de probabilidad de causar quemaduras.',
  },
  'volt-tackle': {
    effect: 'El usuario recibe como daño de retroceso un tercio del daño infligido. Tiene un 10% de probabilidad de paralizar al objetivo.',
    fullEffect: 'Carga eléctrica arriesgada. Recibe un tercio del daño causado en retroceso y tiene un 10% de probabilidad de paralizar al objetivo.',
  },
}

// Patrones mecánicos recurrentes de PokéAPI para short_effect
const RECURRING_PATTERNS_ES = [
  {
    pattern: /^inflicts regular damage with no additional effect\.?$/i,
    translation: 'Inflige daño normal sin ningún efecto adicional.',
  },
  {
    pattern: /^has an increased chance for a critical hit\.?$/i,
    translation: 'Tiene una mayor probabilidad de asestar un golpe crítico.',
  },
  {
    pattern: /^hits 2-5 times in one turn\.?$/i,
    translation: 'Ataca de 2 a 5 veces en un mismo turno.',
  },
  {
    pattern: /^hits twice in one turn\.?$/i,
    translation: 'Ataca dos veces en un mismo turno.',
  },
  {
    pattern: /^user receives 1\/3 the damage inflicted in recoil\.?$/i,
    translation: 'El usuario recibe como daño de retroceso un tercio del daño infligido.',
  },
  {
    pattern: /^user receives 1\/4 the damage (?:it inflicts|inflicted) in recoil\.?$/i,
    translation: 'El usuario recibe como daño de retroceso un cuarto del daño infligido.',
  },
  {
    pattern: /^user takes 1\/4 its max hp in recoil\.?$/i,
    translation: 'El usuario recibe como daño de retroceso un cuarto de sus PS máximos.',
  },
  {
    pattern: /^user takes 1\/3 the damage inflicted in recoil\.  has a (?:10% )?chance to burn the target\.?$/i,
    translation: 'El usuario recibe como daño de retroceso un tercio del daño infligido. Tiene un 10% de probabilidad de quemar al objetivo.',
  },
  {
    pattern: /^user takes 1\/3 the damage inflicted in recoil\.  has a (?:10% )?chance to paralyze the target\.?$/i,
    translation: 'El usuario recibe como daño de retroceso un tercio del daño infligido. Tiene un 10% de probabilidad de paralizar al objetivo.',
  },
  {
    pattern: /^user receives 1\/2 the damage inflicted in recoil\.?$/i,
    translation: 'El usuario recibe como daño de retroceso la mitad del daño infligido.',
  },
  {
    pattern: /^user foregoes its next turn to recharge\.?$/i,
    translation: 'El usuario debe recargar en el turno siguiente tras atacar.',
  },
  {
    pattern: /^user charges for one turn before attacking\.?$/i,
    translation: 'El usuario se prepara en el primer turno para atacar en el segundo.',
  },
  {
    pattern: /^never misses\.?$/i,
    translation: 'Nunca falla al golpear al objetivo.',
  },
  {
    pattern: /^puts the target to sleep\.?$/i,
    translation: 'Duerme al objetivo.',
  },
  {
    pattern: /^paralyzes the target\.?$/i,
    translation: 'Paraliza al objetivo.',
  },
  {
    pattern: /^poisons the target\.?$/i,
    translation: 'Envenena al objetivo.',
  },
  {
    pattern: /^badly poisons the target\.?$/i,
    translation: 'Envenena gravemente al objetivo.',
  },
  {
    pattern: /^burns the target\.?$/i,
    translation: 'Quema al objetivo.',
  },
  {
    pattern: /^confuses the target\.?$/i,
    translation: 'Confunde al objetivo.',
  },
  {
    pattern: /^prevents the target from fleeing or switching\.?$/i,
    translation: 'Impide huir o cambiar de Pokémon al objetivo.',
  },
  {
    pattern: /^user switches out immediately after attacking\.?$/i,
    translation: 'El usuario cambia por otro Pokémon inmediatamente tras atacar.',
  },
  {
    pattern: /^(?:user recovers|drains) half the damage inflicted(?: to heal the user)?\.?$/i,
    translation: 'El usuario recupera la mitad del daño infligido.',
  },
  {
    pattern: /^(?:restores half of the user's maximum hp|heals the user by half its max hp)\.?$/i,
    translation: 'Restaura hasta la mitad de los PS máximos del usuario.',
  },
]

const STAT_NAMES_ES = {
  attack: 'el Ataque',
  defense: 'la Defensa',
  'special-attack': 'el Ataque Especial',
  'special-defense': 'la Defensa Especial',
  speed: 'la Velocidad',
  accuracy: 'la Precisión',
  evasion: 'la Evasión',
}

const STAGES_ES = {
  one: 'un nivel',
  two: 'dos niveles',
  three: 'tres niveles',
}

function translatePatternWithChance(englishText, effectChance = null) {
  if (!englishText) return null

  // Normalizar comillas curvas tipográficas (U+2018, U+2019) y comillas dobles
  const clean = englishText
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()

  const chanceText = (pct) => (pct !== null && pct !== undefined ? ` un ${pct}% de` : '')

  // Estados con probabilidad porcentual (en el texto o pasada por effectChance)
  const poisonMatch = clean.match(/has (?:an? )?(?:(\d+)% )?chance to poison the target/i)
  if (poisonMatch) {
    const pct = poisonMatch[1] || effectChance
    return `Tiene${chanceText(pct)} probabilidad de envenenar al objetivo.`
  }

  const paralyzeMatch = clean.match(/has (?:an? )?(?:(\d+)% )?chance to paralyze the target/i)
  if (paralyzeMatch) {
    const pct = paralyzeMatch[1] || effectChance
    return `Tiene${chanceText(pct)} probabilidad de paralizar al objetivo.`
  }

  const burnMatch = clean.match(/has (?:an? )?(?:(\d+)% )?chance to burn the target/i)
  if (burnMatch) {
    const pct = burnMatch[1] || effectChance
    return `Tiene${chanceText(pct)} probabilidad de quemar al objetivo.`
  }

  const freezeMatch = clean.match(/has (?:an? )?(?:(\d+)% )?chance to freeze the target/i)
  if (freezeMatch) {
    const pct = freezeMatch[1] || effectChance
    return `Tiene${chanceText(pct)} probabilidad de congelar al objetivo.`
  }

  const flinchMatch = clean.match(/has (?:an? )?(?:(\d+)% )?chance to make the target flinch/i)
  if (flinchMatch) {
    const pct = flinchMatch[1] || effectChance
    return `Tiene${chanceText(pct)} probabilidad de hacer retroceder al objetivo.`
  }

  const confuseMatch = clean.match(/has (?:an? )?(?:(\d+)% )?chance to confuse the target/i)
  if (confuseMatch) {
    const pct = confuseMatch[1] || effectChance
    return `Tiene${chanceText(pct)} probabilidad de confundir al objetivo.`
  }

  const STAT_REGEX = '(?:attack|defense|special[\\s-]attack|special[\\s-]defense|speed|accuracy|evasion)'

  // Reducciones de estadísticas tras causar daño (self-drops: overheat, leaf-storm)
  const selfDropMatch = clean.match(new RegExp(`^lowers (?:the )?user's (${STAT_REGEX}) by (one|two|three) stages? after inflicting damage\\.?$`, 'i'))
  if (selfDropMatch) {
    const statKey = selfDropMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || selfDropMatch[1]
    const stage = STAGES_ES[selfDropMatch[2].toLowerCase()] || selfDropMatch[2]
    return `Reduce ${stat} del usuario en ${stage} tras causar daño.`
  }

  // Reducción auto-infligida simple (ej. Hammer Arm: lowers user's Speed by one stage)
  const userLowerMatch = clean.match(new RegExp(`^lowers (?:the )?user's (${STAT_REGEX}) by (one|two|three) stages?\\.?$`, 'i'))
  if (userLowerMatch) {
    const statKey = userLowerMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || userLowerMatch[1]
    const stage = STAGES_ES[userLowerMatch[2].toLowerCase()] || userLowerMatch[2]
    return `Reduce ${stat} del usuario en ${stage}.`
  }

  // Reducción al objetivo (ej. screech, tail-whip, fake-tears, scary-face)
  const lowerMatch = clean.match(new RegExp(`^lowers (?:the )?target's (${STAT_REGEX}) by (one|two|three) stages?\\.?$`, 'i'))
  if (lowerMatch) {
    const statKey = lowerMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || lowerMatch[1]
    const stage = STAGES_ES[lowerMatch[2].toLowerCase()] || lowerMatch[2]
    return `Reduce ${stat} del objetivo en ${stage}.`
  }

  // Aumento al usuario (ej. cotton-guard, swords-dance, iron-defense, agility)
  const raiseMatch = clean.match(new RegExp(`^raises (?:the )?user's (${STAT_REGEX}) by (one|two|three) stages?\\.?$`, 'i'))
  if (raiseMatch) {
    const statKey = raiseMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || raiseMatch[1]
    const stage = STAGES_ES[raiseMatch[2].toLowerCase()] || raiseMatch[2]
    return `Aumenta ${stat} del usuario en ${stage}.`
  }

  return null
}

/**
 * Obtiene los textos localizados (description, effect, fullEffect) con separación estricta
 * y fallback determinista en cascada.
 */
export function getMoveLocalizedText({
  moveSlug,
  locale = 'es',
  rawDescription = '',
  rawEffect = '',
  rawFullEffect = '',
  effectChance = null,
  isEffectSpanish = false,
  isDescriptionSpanish = false,
}) {
  const isSpanish = String(locale || '').toLowerCase().startsWith('es')

  // Si se solicita inglés (o no español), devolver directamente los textos de PokéAPI
  if (!isSpanish) {
    const description = rawDescription || ''
    const effect = rawEffect || description || ''
    const fullEffect = rawFullEffect || rawEffect || description || ''
    return { description, effect, fullEffect }
  }

  // === IDIOMA ESPAÑOL (es / es-419) ===

  // 1. DESCRIPCIÓN: flavor_text de PokéAPI en español si existe
  const description = isDescriptionSpanish && rawDescription ? rawDescription : rawDescription || ''

  // 2. EFECTO:
  let effect = null
  let fullEffect = null

  // Nivel 1: Si PokéAPI ya proporcionó efecto en español
  if (isEffectSpanish && rawEffect) {
    effect = rawEffect
    fullEffect = rawFullEffect || rawEffect
  }

  // Nivel 2: Traducción verificada por slug
  if (!effect && VERIFIED_MOVE_EFFECTS_ES[moveSlug]) {
    const verified = VERIFIED_MOVE_EFFECTS_ES[moveSlug]
    effect = verified.effect
    fullEffect = verified.fullEffect || verified.effect
  }

  // Nivel 3: Patrones mecánicos recurrentes para el texto en inglés
  if (!effect && rawEffect) {
    for (const item of RECURRING_PATTERNS_ES) {
      if (item.pattern.test(rawEffect)) {
        effect = item.translation
        fullEffect = item.translation
        break
      }
    }

    if (!effect) {
      const dynamicTranslation = translatePatternWithChance(rawEffect, effectChance)
      if (dynamicTranslation) {
        effect = dynamicTranslation
        fullEffect = dynamicTranslation
      }
    }
  }

  // Nivel 4: Fallback controlado sin mostrar inglés en interfaz en español
  if (!effect) {
    if (isDescriptionSpanish && description) {
      effect = description
      fullEffect = description
    } else {
      effect = 'Sin efectos adicionales registrados.'
      fullEffect = 'Este movimiento no cuenta con efectos secundarios registrados.'
    }
  }

  return {
    description: description || 'Este movimiento no cuenta con una descripción registrada.',
    effect: effect || 'Sin efectos adicionales registrados.',
    fullEffect: fullEffect || effect || 'Sin efectos adicionales registrados.',
  }
}
