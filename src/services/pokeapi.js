const API_URL = 'https://pokeapi.co/api/v2/pokemon/'
const SPECIES_LIST_URL = 'https://pokeapi.co/api/v2/pokemon-species?limit=2000'
const INDEX_CACHE_KEY = 'pokeguide-pokemon-search-index-v2'
let pokemonIndexPromise

export class PokeApiError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'PokeApiError'
    this.code = code
  }
}

export function normalizeSearchText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_-]+/g, ' ')
}

function normalizePokemonQuery(query) {
  return query.trim().toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeItemQuery(query) {
  return query.trim().toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '')
}

function getErrorMessage(code, query, messages) {
  if (code === 'empty') return messages.empty
  if (code === 'network') return messages.network
  if (code === 'not-found') return messages.notFound.replace('{query}', query.trim())
  if (code === 'invalid') return messages.invalid
  return messages.api
}

function getLocalizedName(names, locale, fallback) {
  return names[locale] || (locale.startsWith('es') ? names.es : names.en) || fallback
}

function getCachedIndex() {
  try {
    return JSON.parse(window.localStorage.getItem(INDEX_CACHE_KEY))
  } catch {
    return null
  }
}

async function fetchSpeciesNames(species) {
  try {
    const response = await fetch(species.url)
    if (!response.ok) return { names: { en: species.name }, id: Number(species.url.split('/').filter(Boolean).pop()) }
    const data = await response.json()
    return {
      id: data.id,
      apiName: data.name,
      names: Object.fromEntries(data.names.filter(({ language }) => ['en', 'es'].includes(language.name)).map(({ language, name }) => [language.name, name])),
    }
  } catch {
    return { id: Number(species.url.split('/').filter(Boolean).pop()), apiName: species.name, names: { en: species.name } }
  }
}

export async function getPokemonIndex(locale = 'en') {
  if (!pokemonIndexPromise) {
    const cachedIndex = getCachedIndex()
    if (cachedIndex?.length) return cachedIndex.map((pokemon) => ({ ...pokemon, displayName: getLocalizedName(pokemon.names, locale, pokemon.apiName), searchNames: Object.values(pokemon.names).map(normalizeSearchText) }))

    pokemonIndexPromise = fetch(SPECIES_LIST_URL).then(async (response) => {
      if (!response.ok) throw new PokeApiError('Could not load the Pokémon index.', 'index')
      const data = await response.json()
      const index = []
      for (let offset = 0; offset < data.results.length; offset += 100) {
        const batch = await Promise.all(data.results.slice(offset, offset + 100).map(fetchSpeciesNames))
        index.push(...batch)
      }
      try { window.localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index)) } catch { /* Cache is optional. */ }
      return index
    }).catch((error) => {
      pokemonIndexPromise = null
      throw error
    })
  }

  const index = await pokemonIndexPromise
  return index.map((pokemon) => ({ ...pokemon, displayName: getLocalizedName(pokemon.names, locale, pokemon.apiName), searchNames: Object.values(pokemon.names).map(normalizeSearchText) }))
}

export async function getPokemon(query, locale = 'en', messages = {}) {
  const normalizedSearchQuery = normalizeSearchText(query)
  const numericQuery = /^\d+$/.test(normalizedSearchQuery) ? normalizedSearchQuery : null
  let normalizedQuery = numericQuery || normalizePokemonQuery(query)

  if (!normalizedSearchQuery) {
    throw new PokeApiError(getErrorMessage('empty', query, messages), 'empty')
  }

  if (!numericQuery) {
    const index = await getPokemonIndex(locale)
    const match = index.find(({ names, apiName }) => [apiName, names.en, names.es].filter(Boolean).some((name) => normalizeSearchText(name) === normalizedSearchQuery))
    if (match) normalizedQuery = match.apiName
  }

  let response

  try {
    response = await fetch(`${API_URL}${encodeURIComponent(normalizedQuery)}`)
  } catch {
    throw new PokeApiError(getErrorMessage('network', query, messages), 'network')
  }

  if (response.status === 404) {
    throw new PokeApiError(getErrorMessage('not-found', query, messages), 'not-found')
  }

  if (!response.ok) {
    throw new PokeApiError(getErrorMessage('api', query, messages), 'api')
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new PokeApiError(getErrorMessage('invalid', query, messages), 'api')
  }

  let speciesName = data.name
  const localizedResources = await Promise.all([...data.types.map(({ type }) => type.url), ...data.abilities.map(({ ability }) => ability.url)].map(async (url) => {
    try {
      const response = await fetch(url)
      return response.ok ? response.json() : null
    } catch {
      return null
    }
  }))
  const typeResources = localizedResources.slice(0, data.types.length)
  const abilityResources = localizedResources.slice(data.types.length)
  try {
    const speciesResponse = await fetch(data.species.url)
    if (speciesResponse.ok) {
      const species = await speciesResponse.json()
      speciesName = species.names.find(({ language }) => language.name === locale || (locale.startsWith('es') && language.name === 'es'))?.name || data.name
    }
  } catch {
    speciesName = data.name
  }

  return {
    id: data.id,
    name: data.name,
    localizedName: speciesName,
    image: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default,
    types: data.types.map(({ type }) => type.name),
    typeLabels: Object.fromEntries(data.types.map(({ type }, index) => [type.name, typeResources[index]?.names?.find(({ language }) => language.name === locale || (locale.startsWith('es') && language.name === 'es'))?.name || type.name])),
    abilities: data.abilities.map(({ ability }) => ability.name),
    abilityLabels: Object.fromEntries(data.abilities.map(({ ability }, index) => [ability.name, abilityResources[index]?.names?.find(({ language }) => language.name === locale || (locale.startsWith('es') && language.name === 'es'))?.name || ability.name])),
    stats: data.stats.map(({ base_stat: baseStat, stat }) => ({ name: stat.name, value: baseStat })),
    height: data.height / 10,
    weight: data.weight / 10,
  }
}

export async function getItem(query, locale = 'en', messages = {}) {
  const normalizedQuery = normalizeItemQuery(query)

  if (!normalizedQuery) {
    throw new PokeApiError(getErrorMessage('empty', query, messages), 'empty')
  }

  let response

  try {
    response = await fetch(`https://pokeapi.co/api/v2/item/${encodeURIComponent(normalizedQuery)}`)
  } catch {
    throw new PokeApiError(getErrorMessage('network', query, messages), 'network')
  }

  if (response.status === 404) {
    throw new PokeApiError(getErrorMessage('not-found', query, messages), 'not-found')
  }

  if (!response.ok) {
    throw new PokeApiError(getErrorMessage('api', query, messages), 'api')
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new PokeApiError(getErrorMessage('invalid', query, messages), 'api')
  }

  const localizedName = data.names.find(({ language }) => language.name === locale || (locale.startsWith('es') && language.name === 'es') || language.name === 'en')?.name || data.name
  const localizedFlavorText = data.flavor_text_entries.find(({ language }) => language.name === locale || (locale.startsWith('es') && language.name === 'es') || language.name === 'en')?.text
  const fallbackEffect = data.effect_entries.find(({ language }) => language.name === 'en')?.short_effect

  return {
    id: data.id,
    name: data.name,
    localizedName,
    image: data.sprites.default,
    category: data.category.name,
    cost: data.cost,
    effect: (localizedFlavorText || fallbackEffect || '').replace(/[\n\f]+/g, ' ').trim(),
  }
}