/**
 * Utilidades para nombres canónicos, resolución de variantes,
 * y traducciones oficiales en español (e inglés) para todos los Pokémon.
 */

import { ALL_SPECIES_NAMES } from './allPokemonSpecies.js'

export function getPokemonSlugById(id) {
  const num = typeof id === 'number' ? id : parseInt(id, 10)
  if (!Number.isNaN(num) && num >= 1 && num <= ALL_SPECIES_NAMES.length) {
    return ALL_SPECIES_NAMES[num - 1]
  }
  return POKEMON_ID_TO_SLUG[num] || null
}

// Las 39 especies canónicas de PokéAPI cuyo nombre base incluye guión (-)
export const CANONICAL_HYPHENATED_SPECIES = new Set([
  'nidoran-f',
  'nidoran-m',
  'mr-mime',
  'ho-oh',
  'mime-jr',
  'porygon-z',
  'type-null',
  'jangmo-o',
  'hakamo-o',
  'kommo-o',
  'tapu-koko',
  'tapu-lele',
  'tapu-bulu',
  'tapu-fini',
  'mr-rime',
  'great-tusk',
  'scream-tail',
  'brute-bonnet',
  'flutter-mane',
  'slither-wing',
  'sandy-shocks',
  'iron-treads',
  'iron-bundle',
  'iron-hands',
  'iron-jugulis',
  'iron-moth',
  'iron-thorns',
  'wo-chien',
  'chien-pao',
  'ting-lu',
  'chi-yu',
  'roaring-moon',
  'iron-valiant',
  'walking-wake',
  'iron-leaves',
  'gouging-fire',
  'raging-bolt',
  'iron-boulder',
  'iron-crown',
])

// Mapa de IDs canónicos para las especies con guión o traducción especial
export const POKEMON_ID_TO_SLUG = {
  29: 'nidoran-f',
  32: 'nidoran-m',
  122: 'mr-mime',
  250: 'ho-oh',
  439: 'mime-jr',
  474: 'porygon-z',
  772: 'type-null',
  782: 'jangmo-o',
  783: 'hakamo-o',
  784: 'kommo-o',
  785: 'tapu-koko',
  786: 'tapu-lele',
  787: 'tapu-bulu',
  788: 'tapu-fini',
  866: 'mr-rime',
  984: 'great-tusk',
  985: 'scream-tail',
  986: 'brute-bonnet',
  987: 'flutter-mane',
  988: 'slither-wing',
  989: 'sandy-shocks',
  990: 'iron-treads',
  991: 'iron-bundle',
  992: 'iron-hands',
  993: 'iron-jugulis',
  994: 'iron-moth',
  995: 'iron-thorns',
  1001: 'wo-chien',
  1002: 'chien-pao',
  1003: 'ting-lu',
  1004: 'chi-yu',
  1005: 'roaring-moon',
  1006: 'iron-valiant',
  1009: 'walking-wake',
  1010: 'iron-leaves',
  1020: 'gouging-fire',
  1021: 'raging-bolt',
  1022: 'iron-boulder',
  1023: 'iron-crown',
}

// Inverso de ID a slug
export const POKEMON_SLUG_TO_ID = Object.fromEntries(
  Object.entries(POKEMON_ID_TO_SLUG).map(([id, slug]) => [slug, Number(id)])
)

// Alias truncados heredados (debido a split('-')[0] anterior) para auto-reparación
export const LEGACY_TRUNCATED_ALIASES = {
  roaring: 'roaring-moon',
  gouging: 'gouging-fire',
  raging: 'raging-bolt',
  great: 'great-tusk',
  scream: 'scream-tail',
  brute: 'brute-bonnet',
  flutter: 'flutter-mane',
  slither: 'slither-wing',
  sandy: 'sandy-shocks',
  walking: 'walking-wake',
  type: 'type-null',
  wo: 'wo-chien',
  chien: 'chien-pao',
  ting: 'ting-lu',
  chi: 'chi-yu',
  ho: 'ho-oh',
}

// Nombres oficiales en español (las 21 especies con traducción distinta a inglés + puntuación especial)
export const OFFICIAL_POKEMON_NAMES_ES = {
  // Las 21 especies con nombre oficial traducido en español
  772: 'Código Cero',
  'type-null': 'Código Cero',
  984: 'Colmilargo',
  'great-tusk': 'Colmilargo',
  985: 'Colagrito',
  'scream-tail': 'Colagrito',
  986: 'Furioseta',
  'brute-bonnet': 'Furioseta',
  987: 'Melenaleteo',
  'flutter-mane': 'Melenaleteo',
  988: 'Reptalada',
  'slither-wing': 'Reptalada',
  989: 'Pelarena',
  'sandy-shocks': 'Pelarena',
  990: 'Ferrodada',
  'iron-treads': 'Ferrodada',
  991: 'Ferrosaco',
  'iron-bundle': 'Ferrosaco',
  992: 'Ferropalmas',
  'iron-hands': 'Ferropalmas',
  993: 'Ferrocuello',
  'iron-jugulis': 'Ferrocuello',
  994: 'Ferropolilla',
  'iron-moth': 'Ferropolilla',
  995: 'Ferropúas',
  'iron-thorns': 'Ferropúas',
  1005: 'Bramaluna',
  'roaring-moon': 'Bramaluna',
  1006: 'Ferropaladín',
  'iron-valiant': 'Ferropaladín',
  1009: 'Ondulagua',
  'walking-wake': 'Ondulagua',
  1010: 'Ferroverdor',
  'iron-leaves': 'Ferroverdor',
  1020: 'Flamariete',
  'gouging-fire': 'Flamariete',
  1021: 'Electrofuria',
  'raging-bolt': 'Electrofuria',
  1022: 'Ferromole',
  'iron-boulder': 'Ferromole',
  1023: 'Ferrotesta',
  'iron-crown': 'Ferrotesta',

  // Puntuación y tipografía canónica en español
  29: 'Nidoran♀',
  'nidoran-f': 'Nidoran♀',
  32: 'Nidoran♂',
  'nidoran-m': 'Nidoran♂',
  122: 'Mr. Mime',
  'mr-mime': 'Mr. Mime',
  250: 'Ho-Oh',
  'ho-oh': 'Ho-Oh',
  439: 'Mime Jr.',
  'mime-jr': 'Mime Jr.',
  474: 'Porygon-Z',
  'porygon-z': 'Porygon-Z',
  782: 'Jangmo-o',
  'jangmo-o': 'Jangmo-o',
  783: 'Hakamo-o',
  'hakamo-o': 'Hakamo-o',
  784: 'Kommo-o',
  'kommo-o': 'Kommo-o',
  785: 'Tapu Koko',
  'tapu-koko': 'Tapu Koko',
  786: 'Tapu Lele',
  'tapu-lele': 'Tapu Lele',
  787: 'Tapu Bulu',
  'tapu-bulu': 'Tapu Bulu',
  788: 'Tapu Fini',
  'tapu-fini': 'Tapu Fini',
  866: 'Mr. Rime',
  'mr-rime': 'Mr. Rime',
  1001: 'Wo-Chien',
  'wo-chien': 'Wo-Chien',
  1002: 'Chien-Pao',
  'chien-pao': 'Chien-Pao',
  1003: 'Ting-Lu',
  'ting-lu': 'Ting-Lu',
  1004: 'Chi-Yu',
  'chi-yu': 'Chi-Yu',
}

// Nombres oficiales en inglés formateados
export const OFFICIAL_POKEMON_NAMES_EN = {
  772: 'Type: Null',
  'type-null': 'Type: Null',
  984: 'Great Tusk',
  'great-tusk': 'Great Tusk',
  985: 'Scream Tail',
  'scream-tail': 'Scream Tail',
  986: 'Brute Bonnet',
  'brute-bonnet': 'Brute Bonnet',
  987: 'Flutter Mane',
  'flutter-mane': 'Flutter Mane',
  988: 'Slither Wing',
  'slither-wing': 'Slither Wing',
  989: 'Sandy Shocks',
  'sandy-shocks': 'Sandy Shocks',
  990: 'Iron Treads',
  'iron-treads': 'Iron Treads',
  991: 'Iron Bundle',
  'iron-bundle': 'Iron Bundle',
  992: 'Iron Hands',
  'iron-hands': 'Iron Hands',
  993: 'Iron Jugulis',
  'iron-jugulis': 'Iron Jugulis',
  994: 'Iron Moth',
  'iron-moth': 'Iron Moth',
  995: 'Iron Thorns',
  'iron-thorns': 'Iron Thorns',
  1005: 'Roaring Moon',
  'roaring-moon': 'Roaring Moon',
  1006: 'Iron Valiant',
  'iron-valiant': 'Iron Valiant',
  1009: 'Walking Wake',
  'walking-wake': 'Walking Wake',
  1010: 'Iron Leaves',
  'iron-leaves': 'Iron Leaves',
  1020: 'Gouging Fire',
  'gouging-fire': 'Gouging Fire',
  1021: 'Raging Bolt',
  'raging-bolt': 'Raging Bolt',
  1022: 'Iron Boulder',
  'iron-boulder': 'Iron Boulder',
  1023: 'Iron Crown',
  'iron-crown': 'Iron Crown',

  29: 'Nidoran♀',
  'nidoran-f': 'Nidoran♀',
  32: 'Nidoran♂',
  'nidoran-m': 'Nidoran♂',
  122: 'Mr. Mime',
  'mr-mime': 'Mr. Mime',
  250: 'Ho-Oh',
  'ho-oh': 'Ho-Oh',
  439: 'Mime Jr.',
  'mime-jr': 'Mime Jr.',
  474: 'Porygon-Z',
  'porygon-z': 'Porygon-Z',
  782: 'Jangmo-o',
  'jangmo-o': 'Jangmo-o',
  783: 'Hakamo-o',
  'hakamo-o': 'Hakamo-o',
  784: 'Kommo-o',
  'kommo-o': 'Kommo-o',
  785: 'Tapu Koko',
  'tapu-koko': 'Tapu Koko',
  786: 'Tapu Lele',
  'tapu-lele': 'Tapu Lele',
  787: 'Tapu Bulu',
  'tapu-bulu': 'Tapu Bulu',
  788: 'Tapu Fini',
  'tapu-fini': 'Tapu Fini',
  866: 'Mr. Rime',
  'mr-rime': 'Mr. Rime',
  1001: 'Wo-Chien',
  'wo-chien': 'Wo-Chien',
  1002: 'Chien-Pao',
  'chien-pao': 'Chien-Pao',
  1003: 'Ting-Lu',
  'ting-lu': 'Ting-Lu',
  1004: 'Chi-Yu',
  'chi-yu': 'Chi-Yu',
}

// Mapa de nombres en español a IDs / slugs canónicos para búsquedas
export const SPANISH_NAME_TO_CANONICAL = {
  'codigo cero': { id: 772, slug: 'type-null' },
  colmilargo: { id: 984, slug: 'great-tusk' },
  colagrito: { id: 985, slug: 'scream-tail' },
  furioseta: { id: 986, slug: 'brute-bonnet' },
  melenaleteo: { id: 987, slug: 'flutter-mane' },
  reptalada: { id: 988, slug: 'slither-wing' },
  pelarena: { id: 989, slug: 'sandy-shocks' },
  ferrodada: { id: 990, slug: 'iron-treads' },
  ferrosaco: { id: 991, slug: 'iron-bundle' },
  ferropalmas: { id: 992, slug: 'iron-hands' },
  ferrocuello: { id: 993, slug: 'iron-jugulis' },
  ferropolilla: { id: 994, slug: 'iron-moth' },
  ferropuas: { id: 995, slug: 'iron-thorns' },
  bramaluna: { id: 1005, slug: 'roaring-moon' },
  ferropaladin: { id: 1006, slug: 'iron-valiant' },
  ondulagua: { id: 1009, slug: 'walking-wake' },
  ferroverdor: { id: 1010, slug: 'iron-leaves' },
  flamariete: { id: 1020, slug: 'gouging-fire' },
  electrofuria: { id: 1021, slug: 'raging-bolt' },
  ferromole: { id: 1022, slug: 'iron-boulder' },
  ferrotesta: { id: 1023, slug: 'iron-crown' },
}

// Sufijos de formas regionales o alternativas (para no romper nombres canónicos)
const FORM_SUFFIX_REGEX = /-(?:alola|galar|hisui|paldea|mega(?:-[xy])?|gmax|totem|primal|therian|incarnate|origin|dusk|dawn|ultra|crowned|black|white|sensu|pom-pom|baile|pau|attack|defense|speed|zen|resolute|pirouette|ash|school|red-meteor|orange-meteor)$/i

/**
 * Limpia y resuelve el slug canónico de un Pokémon, reparando nombres
 * truncados por versiones anteriores y evitando la pérdida de nombres con guión.
 */
export function cleanPokemonSlug(name, id = null) {
  if (id) {
    const slugById = getPokemonSlugById(id)
    if (slugById) return slugById
  }

  if (!name || typeof name !== 'string') {
    return id ? String(id) : ''
  }

  const raw = name.toLowerCase().trim()

  // 1. Si es un alias truncado legado (ej. 'roaring', 'gouging')
  if (LEGACY_TRUNCATED_ALIASES[raw]) {
    return LEGACY_TRUNCATED_ALIASES[raw]
  }

  // 2. Si es una especie canónica con guión
  if (CANONICAL_HYPHENATED_SPECIES.has(raw)) {
    return raw
  }

  // 3. Si es un nombre en español (ej. 'bramaluna', 'flamariete')
  const normalizedEs = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (SPANISH_NAME_TO_CANONICAL[normalizedEs]) {
    return SPANISH_NAME_TO_CANONICAL[normalizedEs].slug
  }

  // 4. Si tiene sufijo de forma (ej. 'charizard-mega-x' -> 'charizard', 'raichu-alola' -> 'raichu')
  if (FORM_SUFFIX_REGEX.test(raw)) {
    return raw.replace(FORM_SUFFIX_REGEX, '')
  }

  return raw
}

/**
 * Retorna el nombre de visualización oficial localizado según el idioma (es, es-419, en).
 */
export function getPokemonDisplayName(idOrName, locale = 'es') {
  if (!idOrName && idOrName !== 0) return ''

  const isSpanish = !locale || locale.startsWith('es')
  const dict = isSpanish ? OFFICIAL_POKEMON_NAMES_ES : OFFICIAL_POKEMON_NAMES_EN

  // 1. Búsqueda por ID directo
  const num = typeof idOrName === 'number' ? idOrName : parseInt(idOrName, 10)
  if (!Number.isNaN(num) && num > 0) {
    if (dict[num]) return dict[num]
    const slugById = getPokemonSlugById(num)
    if (slugById) {
      if (dict[slugById]) return dict[slugById]
      return slugById
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }

  // 2. Búsqueda por slug o nombre
  const slug = cleanPokemonSlug(String(idOrName), !Number.isNaN(num) ? num : null)
  if (dict[slug]) return dict[slug]

  // Si no está en las excepciones oficiales, capitalizar respetando palabras
  return slug
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Normaliza cualquier objeto Pokémon o referencia (incluso Megaevoluciones,
 * Formas Regionales o Shiny) para identificar inequívocamente al Pokémon base.
 * Respeta especies con guión (Paradox, Ho-Oh, etc.) y repara nombres legados.
 */
export function normalizePokemonForFavorite(pokemon) {
  if (!pokemon) return null

  if (typeof pokemon === 'number') {
    const slug = getPokemonSlugById(pokemon) || String(pokemon)
    return { id: pokemon, name: slug }
  }

  if (typeof pokemon === 'string') {
    const parsed = parseInt(pokemon, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      const slug = getPokemonSlugById(parsed) || String(parsed)
      return { id: parsed, name: slug }
    }
    const cleanName = cleanPokemonSlug(pokemon)
    const matchedId = POKEMON_SLUG_TO_ID[cleanName] || null
    return { id: matchedId, name: cleanName }
  }

  let baseId = null

  // 1. Extraer ID canónico desde la URL de especie si está presente
  const speciesUrl = pokemon.speciesUrl || pokemon.species?.url
  if (typeof speciesUrl === 'string') {
    const match = speciesUrl.match(/\/pokemon-species\/(\d+)\/?/)
    if (match) {
      baseId = parseInt(match[1], 10)
    }
  }

  // 2. Si no tiene speciesUrl pero tiene ID nacional estándar (1 a 1025)
  if (!baseId && typeof pokemon.id === 'number' && pokemon.id > 0 && pokemon.id <= 1025) {
    baseId = pokemon.id
  }

  // 3. Extraer nombre canónico base
  let rawName = ''
  if (pokemon.species?.name) {
    rawName = pokemon.species.name.toLowerCase()
  } else if (pokemon.apiName) {
    rawName = pokemon.apiName.toLowerCase()
  } else if (pokemon.name) {
    rawName = pokemon.name.toLowerCase()
  }

  const finalId = baseId || (typeof pokemon.id === 'number' && pokemon.id > 0 ? pokemon.id : null)
  const cleanName = cleanPokemonSlug(rawName, finalId)

  return {
    id: finalId || POKEMON_SLUG_TO_ID[cleanName] || null,
    name: cleanName || (finalId ? String(finalId) : ''),
  }
}

