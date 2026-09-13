import {
  megaDescriptionsEs,
  megaDescriptionsEn,
  getGenericMegaDescription,
} from '../locales/megaDescriptions.js'
import {
  getGen9DescriptionEs,
  translateEnglishPokedexToSpanish,
} from '../locales/pokedexGen9Es.js'
import { getRegionalDescriptionEs } from '../locales/regionalDescriptions.js'
import { gen9AbilitiesEs } from '../locales/gen9AbilitiesEs.js'
import { abilityCatalogEs } from '../locales/abilityCatalogEs.js'
import {
  itemCategoriesEs,
  itemEffectsEs,
  canonicalItemCosts,
  getLocalizedCategoryName,
} from '../locales/itemCatalogEs.js'
import {
  cleanPokemonSlug,
  getPokemonDisplayName,
  POKEMON_ID_TO_SLUG,
  SPANISH_NAME_TO_CANONICAL,
} from '../utils/pokemonNames.js'

export { cleanPokemonSlug, getPokemonDisplayName }

const API_URL = 'https://pokeapi.co/api/v2/pokemon/'
const SPECIES_LIST_URL = 'https://pokeapi.co/api/v2/pokemon-species?limit=2000'
const INDEX_CACHE_KEY = 'pokeguide-pokemon-search-index-v2'
let pokemonIndexPromise
const itemPageCache = new Map()
const itemDetailCache = new Map()

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

export function formatName(name) {
  if (!name) return ''
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizePokemonQuery(query) {
  return query.trim().toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeItemQuery(query) {
  return query.trim().toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '')
}

function getErrorMessage(code, query, messages = {}) {
  if (code === 'empty') return messages?.empty || 'Ingresa un término de búsqueda.'
  if (code === 'network') return messages?.network || 'Error de conexión con el servidor.'
  if (code === 'not-found') return messages?.notFound?.replace('{query}', (query || '').trim()) || `No se encontró el objeto "${query}".`
  if (code === 'invalid') return messages?.invalid || 'Respuesta no válida del servidor.'
  return messages?.api || 'Ocurrió un error al consultar la PokéAPI.'
}

function getLocalizedName(names, locale, fallback) {
  return names[locale] || (locale.startsWith('es') ? names.es : names.en) || fallback
}

export function cleanFlavorText(text = '') {
  if (!text) return ''
  return text
    .replace(/[\n\f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolvePokedexDescription(
  entries,
  locale = 'es',
  pokemonId = null,
  pokemonName = null,
) {
  const isSpanish = locale.startsWith('es')

  // 1. If Spanish is requested, check dedicated Gen 9 Spanish catalog first (since PokeAPI has no Spanish entries for Gen 9)
  if (isSpanish) {
    const gen9Es = getGen9DescriptionEs(pokemonId, pokemonName)
    if (gen9Es) return gen9Es

    // Look for Spanish entry in PokeAPI entries
    const esMatch = entries?.find(
      (e) => e?.language?.name === 'es' || e?.language?.name === 'es-419',
    )
    if (esMatch?.flavor_text) {
      const cleaned = cleanFlavorText(esMatch.flavor_text)
      if (cleaned.length > 0) return cleaned
    }
  }

  // 2. Exact requested locale match (e.g. en)
  let matched = entries?.find((e) => e?.language?.name === locale)

  // 3. Fallback to English 'en'
  if (!matched) {
    matched = entries?.find((e) => e?.language?.name === 'en')
  }

  // 4. Fallback to first available entry with flavor_text
  if (!matched && Array.isArray(entries) && entries.length > 0) {
    matched = entries.find((e) => Boolean(e?.flavor_text)) || entries[0]
  }

  if (matched?.flavor_text) {
    const cleaned = cleanFlavorText(matched.flavor_text)
    if (isSpanish && matched?.language?.name === 'en') {
      const translated = translateEnglishPokedexToSpanish(cleaned)
      return translated || cleaned
    }
    return cleaned.length > 0 ? cleaned : null
  }

  return null
}

export function resolveFormPokedexDescription(
  formData,
  speciesData,
  locale = 'es',
  baseFallbackDescription = null,
) {
  const isSpanish = locale.startsWith('es')
  const formKey = formData?.name?.toLowerCase()
  const formSubKey = formData?.form_name?.toLowerCase()
  const speciesKey = speciesData?.name?.toLowerCase()
  const isMega = Boolean(
    formData?.is_mega ||
    formKey?.includes('mega') ||
    formSubKey?.includes('mega')
  )

  // 1. Dedicated Mega descriptions dictionary
  if (isSpanish) {
    if (formKey && megaDescriptionsEs[formKey]) {
      return megaDescriptionsEs[formKey]
    }
    if (speciesKey && formSubKey && megaDescriptionsEs[`${speciesKey}-${formSubKey}`]) {
      return megaDescriptionsEs[`${speciesKey}-${formSubKey}`]
    }
    if (speciesKey && megaDescriptionsEs[`${speciesKey}-mega`]) {
      return megaDescriptionsEs[`${speciesKey}-mega`]
    }
  } else {
    if (formKey && megaDescriptionsEn[formKey]) {
      return megaDescriptionsEn[formKey]
    }
    if (speciesKey && formSubKey && megaDescriptionsEn[`${speciesKey}-${formSubKey}`]) {
      return megaDescriptionsEn[`${speciesKey}-${formSubKey}`]
    }
    if (speciesKey && megaDescriptionsEn[`${speciesKey}-mega`]) {
      return megaDescriptionsEn[`${speciesKey}-mega`]
    }
  }

  // 2. Check form flavor_text_entries in PokeAPI
  if (Array.isArray(formData?.flavor_text_entries) && formData.flavor_text_entries.length > 0) {
    let matched = formData.flavor_text_entries.find((e) => e?.language?.name === locale)

    if (!matched && isSpanish) {
      matched = formData.flavor_text_entries.find((e) => e?.language?.name === 'es')
    }

    if (!matched && !isSpanish) {
      matched = formData.flavor_text_entries.find((e) => e?.language?.name === 'en')
    }

    if (matched?.flavor_text) {
      const cleaned = cleanFlavorText(matched.flavor_text)
      if (cleaned) return cleaned
    }
  }

  // 3. Check species form_descriptions if present
  if (Array.isArray(speciesData?.form_descriptions) && speciesData.form_descriptions.length > 0) {
    let matchedDesc = speciesData.form_descriptions.find((d) => d?.language?.name === locale)
    if (!matchedDesc && isSpanish) {
      matchedDesc = speciesData.form_descriptions.find((d) => d?.language?.name === 'es')
    }
    if (!matchedDesc && !isSpanish) {
      matchedDesc = speciesData.form_descriptions.find((d) => d?.language?.name === 'en')
    }
    if (matchedDesc?.description) {
      const cleaned = cleanFlavorText(matchedDesc.description)
      if (cleaned) return cleaned
    }
  }

  // 4. For Mega forms, NEVER return base species description (megas must have distinct entries)
  if (isMega) {
    const speciesDisplayName =
      speciesData?.names?.find(
        ({ language }) =>
          language.name === locale ||
          (isSpanish && language.name === 'es'),
      )?.name || speciesData?.name || ''

    return getGenericMegaDescription(speciesDisplayName, formData?.form_name, locale)
  }

  // 5. Fallback for non-mega forms
  if (baseFallbackDescription) {
    return baseFallbackDescription
  }

  if (Array.isArray(speciesData?.flavor_text_entries) && speciesData.flavor_text_entries.length > 0) {
    return resolvePokedexDescription(
      speciesData.flavor_text_entries,
      locale,
      speciesData.id,
      speciesData.name,
    )
  }

  return null
}

export function resolveRegionalPokedexDescription(
  formData,
  speciesData,
  region,
  locale = 'es',
  baseFallbackDescription = null,
) {
  const isSpanish = locale.startsWith('es')
  const formKey = formData?.name?.toLowerCase() || ''

  // 1. If Spanish is requested, check dedicated regional Spanish catalog first
  // (official canonical game translations from Pokémon Sol/Luna, Espada/Escudo, Arceus)
  if (isSpanish) {
    const regionalEs =
      getRegionalDescriptionEs(formKey) ||
      (region && speciesData?.name ? getRegionalDescriptionEs(`${speciesData.name}-${region}`) : null)
    if (regionalEs) return regionalEs
  }

  // 2. Check form flavor_text_entries in PokeAPI (e.g. all 18 Alola forms in PokéAPI)
  const formEntries = Array.isArray(formData?.flavor_text_entries) ? formData.flavor_text_entries : []
  if (formEntries.length > 0) {
    if (isSpanish) {
      const esMatch = formEntries.find((e) => e?.language?.name === 'es' || e?.language?.name === 'es-419')
      if (esMatch?.flavor_text) {
        const cleaned = cleanFlavorText(esMatch.flavor_text)
        if (cleaned) return cleaned
      }
      const enMatch = formEntries.find((e) => e?.language?.name === 'en') || formEntries[0]
      if (enMatch?.flavor_text) {
        const cleaned = cleanFlavorText(enMatch.flavor_text)
        const translated = translateEnglishPokedexToSpanish(cleaned)
        return translated || cleaned
      }
    } else {
      let matched = formEntries.find((e) => e?.language?.name === locale)
      if (!matched) matched = formEntries.find((e) => e?.language?.name === 'en') || formEntries[0]
      if (matched?.flavor_text) {
        const cleaned = cleanFlavorText(matched.flavor_text)
        if (cleaned) return cleaned
      }
    }
  }

  // 3. Check species flavor_text_entries for region-specific version (e.g. Legends Arceus for Hisui)
  const speciesEntries = Array.isArray(speciesData?.flavor_text_entries) ? speciesData.flavor_text_entries : []
  if (speciesEntries.length > 0) {
    if (region === 'hisui') {
      const arceusEntries = speciesEntries.filter((e) => e?.version?.name === 'legends-arceus')
      if (arceusEntries.length > 0) {
        if (isSpanish) {
          const esMatch = arceusEntries.find((e) => e?.language?.name === 'es' || e?.language?.name === 'es-419')
          if (esMatch?.flavor_text) return cleanFlavorText(esMatch.flavor_text)
          const enMatch = arceusEntries.find((e) => e?.language?.name === 'en') || arceusEntries[0]
          if (enMatch?.flavor_text) {
            const cleaned = cleanFlavorText(enMatch.flavor_text)
            const translated = translateEnglishPokedexToSpanish(cleaned)
            return translated || cleaned
          }
        } else {
          let matched =
            arceusEntries.find((e) => e?.language?.name === locale) ||
            arceusEntries.find((e) => e?.language?.name === 'en') ||
            arceusEntries[0]
          if (matched?.flavor_text) return cleanFlavorText(matched.flavor_text)
        }
      }
    }

    // Check version entries that explicitly mention the regional form (e.g. Galar mentions in Sword/Shield)
    if (region === 'galar') {
      const galarEntries = speciesEntries.filter((e) => {
        const v = e?.version?.name
        return (v === 'sword' || v === 'shield') && e?.flavor_text?.toLowerCase().includes('galar')
      })
      if (galarEntries.length > 0) {
        if (isSpanish) {
          const esMatch = galarEntries.find((e) => e?.language?.name === 'es' || e?.language?.name === 'es-419')
          if (esMatch?.flavor_text) return cleanFlavorText(esMatch.flavor_text)
        } else {
          const enMatch = galarEntries.find((e) => e?.language?.name === locale || e?.language?.name === 'en')
          if (enMatch?.flavor_text) return cleanFlavorText(enMatch.flavor_text)
        }
      }
    }
  }

  // 4. Safe fallback: maintain base species description if PokeAPI does not provide a specific one
  return baseFallbackDescription || null
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

    if (!response.ok) {
      return {
        names: { en: species.name },
        id: Number(species.url.split('/').filter(Boolean).pop()),
      }
    }

    const data = await response.json()

    return {
      id: data.id,
      apiName: data.name,
      names: Object.fromEntries(
        data.names
          .filter(({ language }) => ['en', 'es'].includes(language.name))
          .map(({ language, name }) => [language.name, name]),
      ),
    }
  } catch {
    return {
      id: Number(species.url.split('/').filter(Boolean).pop()),
      apiName: species.name,
      names: { en: species.name },
    }
  }
}

export async function getPokemonIndex(locale = 'en') {
  if (!pokemonIndexPromise) {
    const cachedIndex = getCachedIndex()

    if (cachedIndex?.length) {
      return cachedIndex.map((pokemon) => ({
        ...pokemon,
        displayName: getLocalizedName(
          pokemon.names,
          locale,
          pokemon.apiName,
        ),
        searchNames: Object.values(pokemon.names).map(normalizeSearchText),
      }))
    }

    pokemonIndexPromise = fetch(SPECIES_LIST_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new PokeApiError(
            'Could not load the Pokémon index.',
            'index',
          )
        }

        const data = await response.json()
        const index = []

        for (let offset = 0; offset < data.results.length; offset += 100) {
          const batch = await Promise.all(
            data.results
              .slice(offset, offset + 100)
              .map(fetchSpeciesNames),
          )

          index.push(...batch)
        }

        try {
          window.localStorage.setItem(
            INDEX_CACHE_KEY,
            JSON.stringify(index),
          )
        } catch {
          /* Cache is optional. */
        }

        return index
      })
      .catch((error) => {
        pokemonIndexPromise = null
        throw error
      })
  }

  const index = await pokemonIndexPromise

  return index.map((pokemon) => ({
    ...pokemon,
    displayName: getLocalizedName(
      pokemon.names,
      locale,
      pokemon.apiName,
    ),
    searchNames: Object.values(pokemon.names).map(normalizeSearchText),
  }))
}

export async function getPokemon(query, locale = 'en', messages = {}) {
  const normalizedSearchQuery = normalizeSearchText(query)
  const numericQuery = /^\d+$/.test(normalizedSearchQuery)
    ? normalizedSearchQuery
    : null

  // Limpiar y resolver posibles nombres truncados (ej. 'roaring' -> 'roaring-moon', 'gouging' -> 'gouging-fire')
  // o nombres en español (ej. 'bramaluna' -> 'roaring-moon', 'flamariete' -> 'gouging-fire')
  const cleanedSlug = !numericQuery ? cleanPokemonSlug(query) : null

  let normalizedQuery = numericQuery || cleanedSlug || normalizePokemonQuery(query)

  if (!normalizedSearchQuery) {
    throw new PokeApiError(
      getErrorMessage('empty', query, messages),
      'empty',
    )
  }

  if (!numericQuery) {
    if (cleanedSlug && cleanedSlug !== normalizePokemonQuery(query)) {
      normalizedQuery = cleanedSlug
    } else {
      const index = await getPokemonIndex(locale)

      const match = index.find(({ names, apiName }) =>
        [apiName, names.en, names.es]
          .filter(Boolean)
          .some(
            (name) =>
              normalizeSearchText(name) === normalizedSearchQuery,
          ),
      )

      if (match) {
        normalizedQuery = match.id ? String(match.id) : match.apiName
      }
    }
  }

  let response

  try {
    response = await fetch(
      `${API_URL}${encodeURIComponent(normalizedQuery)}`,
    )
  } catch {
    throw new PokeApiError(
      getErrorMessage('network', query, messages),
      'network',
    )
  }

  if (response.status === 404) {
    // Si el endpoint /pokemon/ da 404, verificar si es una especie cuya forma por defecto tiene sufijo (ej: landorus -> landorus-incarnate, deoxys -> deoxys-normal)
    try {
      const fallbackQuery = normalizePokemonQuery(query)
      const speciesResponse = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(fallbackQuery)}`,
      )
      if (speciesResponse.ok) {
        const speciesData = await speciesResponse.json()
        const defaultVariety =
          speciesData.varieties?.find((v) => v.is_default) ||
          speciesData.varieties?.[0]

        if (defaultVariety?.pokemon?.url) {
          response = await fetch(defaultVariety.pokemon.url)
        } else if (speciesData.id) {
          response = await fetch(`${API_URL}${speciesData.id}`)
        }
      }
    } catch {
      // Ignorar error del fallback y continuar al manejo de 404
    }
  }

  if (response.status === 404) {
    throw new PokeApiError(
      getErrorMessage('not-found', query, messages),
      'not-found',
    )
  }

  if (!response.ok) {
    throw new PokeApiError(
      getErrorMessage('api', query, messages),
      'api',
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new PokeApiError(
      getErrorMessage('invalid', query, messages),
      'api',
    )
  }

  let speciesName = data.name
  let pokedexDescription = null

  const localizedResources = await Promise.all(
    [
      ...data.types.map(({ type }) => type.url),
      ...data.abilities.map(({ ability }) => ability.url),
    ].map((url) => fetchResourceData(url)),
  )

  const typeResources = localizedResources.slice(
    0,
    data.types.length,
  )

  const abilityResources = localizedResources.slice(
    data.types.length,
  )

  try {
    const speciesResponse = await fetch(data.species.url)

    if (speciesResponse.ok) {
      const species = await speciesResponse.json()

      speciesName =
        getPokemonDisplayName(data.id, locale) ||
        species.names.find(
          ({ language }) =>
            language.name === locale ||
            (locale.startsWith('es') && language.name === 'es'),
        )?.name || data.name

      pokedexDescription = resolvePokedexDescription(
        species.flavor_text_entries,
        locale,
        data.id,
        data.name,
      )
    } else {
      speciesName = getPokemonDisplayName(data.id, locale) || data.name
    }
  } catch {
    speciesName = getPokemonDisplayName(data.id, locale) || data.name
    pokedexDescription = null
  }

  return {
    id: data.id,
    name: data.name,
    localizedName: speciesName,
    image:
      data.sprites.other?.['official-artwork']?.front_default ||
      data.sprites.other?.home?.front_default ||
      data.sprites.front_default,
    types: data.types.map(({ type }) => type.name),
    typeLabels: Object.fromEntries(
      data.types.map(({ type }, index) => [
        type.name,
        typeResources[index]?.names?.find(
          ({ language }) =>
            language.name === locale ||
            (locale.startsWith('es') && language.name === 'es'),
        )?.name || type.name,
      ]),
    ),
    abilities: data.abilities.map(({ ability }) => ability.name),
    abilityLabels: Object.fromEntries(
      data.abilities.map(({ ability }, index) => {
        const isSpanish = locale.startsWith('es')
        const fallbackName = (isSpanish && abilityCatalogEs[ability.name]?.name) || formatName(ability.name.replaceAll('-', ' '))
        return [
          ability.name,
          resolveLocalizedResourceName(
            abilityResources[index],
            locale,
            fallbackName,
          ),
        ]
      }),
    ),
    abilityDescriptions: Object.fromEntries(
      data.abilities.map(({ ability }, index) => [
        ability.name,
        resolveAbilityDescription(abilityResources[index], locale, ability.name),
      ]),
    ),
    stats: data.stats.map(
      ({ base_stat: baseStat, stat }) => ({
        name: stat.name,
        value: baseStat,
      }),
    ),
    height: data.height / 10,
    weight: data.weight / 10,
    speciesUrl: data.species.url,
    pokedexDescription,
    shinyImage:
      data.sprites.other?.['official-artwork']?.front_shiny ||
      data.sprites.other?.home?.front_shiny ||
      data.sprites.front_shiny ||
      null,
    cry: data.cries?.latest || data.cries?.legacy || null,
  }
}

const pokemonFormsCache = new Map()
const resourceLabelCache = new Map()

async function fetchResourceData(url, retries = 2) {
  if (!url) return null
  if (resourceLabelCache.has(url)) return resourceLabelCache.get(url)
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)))
          continue
        }
        return null
      }
      const data = await response.json()
      resourceLabelCache.set(url, data)
      return data
    } catch {
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)))
        continue
      }
      return null
    }
  }
  return null
}

function resolveLocalizedResourceName(data, locale, fallback) {
  if (!data?.names) return fallback
  const exact = data.names.find(({ language }) => language.name === locale)
  if (exact) return exact.name
  if (locale.startsWith('es')) {
    const es = data.names.find(({ language }) => language.name === 'es')
    if (es) return es.name
  }
  const en = data.names.find(({ language }) => language.name === 'en')
  if (en) return en.name
  return fallback
}

export function resolveAbilityDescription(data, locale = 'es', fallbackAbilityName = '') {
  const isSpanish = locale.startsWith('es')
  const abilityName = data?.name || fallbackAbilityName || ''

  // 1. Catálogo dedicado Gen 9 en español si aplica
  if (isSpanish && abilityName && gen9AbilitiesEs[abilityName]) {
    return gen9AbilitiesEs[abilityName]
  }

  // 2. Extraer flavor_text_entries según el idioma solicitado
  if (Array.isArray(data?.flavor_text_entries) && data.flavor_text_entries.length > 0) {
    if (isSpanish) {
      const esEntries = data.flavor_text_entries.filter(
        (entry) => entry?.language?.name === 'es' || entry?.language?.name === 'es-419',
      )
      if (esEntries.length > 0) {
        const latest = esEntries[esEntries.length - 1]
        if (latest?.flavor_text) {
          const cleaned = cleanFlavorText(latest.flavor_text)
          if (cleaned) return cleaned
        }
      }
    } else {
      const localeEntries = data.flavor_text_entries.filter(
        (entry) => entry?.language?.name === locale,
      )
      if (localeEntries.length > 0) {
        const latest = localeEntries[localeEntries.length - 1]
        if (latest?.flavor_text) {
          const cleaned = cleanFlavorText(latest.flavor_text)
          if (cleaned) return cleaned
        }
      }
    }
  }

  // 3. Revisar effect_entries (short_effect prioritario sobre effect)
  if (Array.isArray(data?.effect_entries) && data.effect_entries.length > 0) {
    if (isSpanish) {
      const esEffect = data.effect_entries.find(
        (entry) => entry?.language?.name === 'es' || entry?.language?.name === 'es-419',
      )
      if (esEffect?.short_effect) return cleanFlavorText(esEffect.short_effect)
      if (esEffect?.effect) return cleanFlavorText(esEffect.effect)
    } else {
      const localeEffect = data.effect_entries.find(
        (entry) => entry?.language?.name === locale,
      )
      if (localeEffect?.short_effect) return cleanFlavorText(localeEffect.short_effect)
      if (localeEffect?.effect) return cleanFlavorText(localeEffect.effect)
    }
  }

  // 4. Catálogo de respaldo estático en español si no se encontró en la API
  if (isSpanish && abilityName && abilityCatalogEs[abilityName]?.description) {
    return abilityCatalogEs[abilityName].description
  }

  // 5. Fallback a texto en inglés (flavor_text o effect) como último recurso
  if (Array.isArray(data?.flavor_text_entries) && data.flavor_text_entries.length > 0) {
    const enEntries = data.flavor_text_entries.filter(
      (entry) => entry?.language?.name === 'en',
    )
    if (enEntries.length > 0) {
      const latest = enEntries[enEntries.length - 1]
      if (latest?.flavor_text) {
        return cleanFlavorText(latest.flavor_text)
      }
    }
  }

  if (Array.isArray(data?.effect_entries) && data.effect_entries.length > 0) {
    const enEffect = data.effect_entries.find(
      (entry) => entry?.language?.name === 'en',
    )
    if (enEffect?.short_effect) return cleanFlavorText(enEffect.short_effect)
    if (enEffect?.effect) return cleanFlavorText(enEffect.effect)
  }

  return ''
}

export async function getAbilityDescription(abilityName, locale = 'es') {
  if (!abilityName) return ''
  const isSpanish = locale.startsWith('es')
  if (isSpanish && gen9AbilitiesEs[abilityName]) {
    return gen9AbilitiesEs[abilityName]
  }
  const data = await fetchResourceData(`https://pokeapi.co/api/v2/ability/${abilityName}`, 2)
  return resolveAbilityDescription(data, locale, abilityName)
}

export async function getAbilityDetails(abilityName, locale = 'es') {
  if (!abilityName) return { name: '', description: '' }
  const isSpanish = locale.startsWith('es')
  const catalogEntry = isSpanish ? (abilityCatalogEs[abilityName] || null) : null
  const gen9Desc = isSpanish ? (gen9AbilitiesEs[abilityName] || null) : null

  try {
    const data = await fetchResourceData(`https://pokeapi.co/api/v2/ability/${abilityName}`, 2)
    if (data) {
      const fallbackName = catalogEntry?.name || formatName(abilityName.replaceAll('-', ' '))
      const name = resolveLocalizedResourceName(data, locale, fallbackName)
      const description = resolveAbilityDescription(data, locale, abilityName)
      return { name, description }
    }
  } catch {
    // Ignore error and fall back to catalog
  }

  return {
    name: catalogEntry?.name || formatName(abilityName.replaceAll('-', ' ')),
    description: gen9Desc || catalogEntry?.description || '',
  }
}

function resolveFormLocalizedName(formData, baseLocalizedName, locale) {
  if (!formData) return baseLocalizedName

  if (Array.isArray(formData.form_names) && formData.form_names.length > 0) {
    const exact = formData.form_names.find(({ language }) => language.name === locale)
    if (exact?.name) return exact.name
    if (locale.startsWith('es')) {
      const es = formData.form_names.find(({ language }) => language.name === 'es')
      if (es?.name) return es.name
    }
    const en = formData.form_names.find(({ language }) => language.name === 'en')
    if (en?.name) return en.name
  }

  if (Array.isArray(formData.names) && formData.names.length > 0) {
    const exact = formData.names.find(({ language }) => language.name === locale)
    if (exact?.name) return exact.name
    if (locale.startsWith('es')) {
      const es = formData.names.find(({ language }) => language.name === 'es')
      if (es?.name) return es.name
    }
    const en = formData.names.find(({ language }) => language.name === 'en')
    if (en?.name) return en.name
  }

  const formName = formData.form_name || ''
  if (formName === 'mega-x') return `Mega ${baseLocalizedName} X`
  if (formName === 'mega-y') return `Mega ${baseLocalizedName} Y`
  if (formName === 'mega-z') return `Mega ${baseLocalizedName} Z`
  if (formName.startsWith('mega')) return `Mega ${baseLocalizedName}`

  return formData.name || baseLocalizedName
}

function resolveMegaVariant(formName, name) {
  const normalized = `${formName || ''} ${name || ''}`.toLowerCase()
  if (normalized.includes('mega-x') || normalized.includes('mega x')) return 'mega-x'
  if (normalized.includes('mega-y') || normalized.includes('mega y')) return 'mega-y'
  if (normalized.includes('mega-z') || normalized.includes('mega z')) return 'mega-z'
  if (normalized.includes('mega')) return 'mega'
  return null
}

export function detectRegionalVariant(formName = '', pokemonName = '') {
  const normalized = `${formName || ''} ${pokemonName || ''}`.toLowerCase()

  // Strict exclusions (Megas, Gigantamax, Dominant Totem, Costumes/Caps)
  if (
    normalized.includes('mega') ||
    normalized.includes('gmax') ||
    normalized.includes('totem') ||
    normalized.includes('cap') ||
    normalized.includes('cosplay') ||
    normalized.includes('starter')
  ) {
    return null
  }

  if (normalized.includes('alola')) return 'alola'
  if (normalized.includes('galar')) return 'galar'
  if (normalized.includes('hisui')) return 'hisui'
  if (normalized.includes('paldea')) return 'paldea'

  return null
}

export function resolveRegionalLocalizedName(
  formData,
  pokemonData,
  baseLocalizedName,
  region,
  locale = 'es',
) {
  const isSpanish = String(locale).startsWith('es')
  const pName = (pokemonData?.name || '').toLowerCase()

  if (!isSpanish) {
    const enName = formData?.names?.find(({ language }) => language?.name === 'en')?.name
    if (enName) return enName

    const regionAdjective = {
      alola: 'Alolan',
      galar: 'Galarian',
      hisui: 'Hisuian',
      paldea: 'Paldean',
    }[region] || region

    if (pName.includes('combat')) return `${regionAdjective} ${baseLocalizedName} (Combat Breed)`
    if (pName.includes('blaze')) return `${regionAdjective} ${baseLocalizedName} (Blaze Breed)`
    if (pName.includes('aqua')) return `${regionAdjective} ${baseLocalizedName} (Aqua Breed)`
    return `${regionAdjective} ${baseLocalizedName}`
  }

  const regionProper = {
    alola: 'Alola',
    galar: 'Galar',
    hisui: 'Hisui',
    paldea: 'Paldea',
  }[region] || region

  if (pName.includes('combat')) return `${baseLocalizedName} de ${regionProper} (Variedad Combatiente)`
  if (pName.includes('blaze')) return `${baseLocalizedName} de ${regionProper} (Variedad Ígnea)`
  if (pName.includes('aqua')) return `${baseLocalizedName} de ${regionProper} (Variedad Acuática)`
  return `${baseLocalizedName} de ${regionProper}`
}

export async function getPokemonForm(formUrlOrId) {
  const url = String(formUrlOrId).startsWith('http')
    ? formUrlOrId
    : `https://pokeapi.co/api/v2/pokemon-form/${encodeURIComponent(formUrlOrId)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load Pokémon form.')
  return res.json()
}

export async function getMegaForms(pokemonIdOrName, locale = 'en') {
  if (!pokemonIdOrName) return []

  const cacheKey = `${String(pokemonIdOrName).toLowerCase()}:${locale}`
  if (pokemonFormsCache.has(cacheKey)) {
    return pokemonFormsCache.get(cacheKey)
  }

  try {
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(String(pokemonIdOrName).toLowerCase())}`
    const speciesResponse = await fetch(speciesUrl)
    if (!speciesResponse.ok) {
      pokemonFormsCache.set(cacheKey, [])
      return []
    }
    const speciesData = await speciesResponse.json()

    const baseLocalizedName =
      speciesData.names?.find(
        ({ language }) =>
          language.name === locale ||
          (locale.startsWith('es') && language.name === 'es'),
      )?.name || speciesData.name

    const basePokedexDescription = resolvePokedexDescription(
      speciesData.flavor_text_entries,
      locale,
      speciesData.id,
      speciesData.name,
    )

    const varieties = speciesData.varieties || []
    const candidateVarieties = varieties.filter((v) => !v.is_default)

    if (candidateVarieties.length === 0) {
      pokemonFormsCache.set(cacheKey, [])
      return []
    }

    const varietyPokemonList = await Promise.all(
      candidateVarieties.map(async ({ pokemon }) => {
        try {
          const res = await fetch(pokemon.url)
          return res.ok ? res.json() : null
        } catch {
          return null
        }
      }),
    )

    const megaEntries = []

    for (const pData of varietyPokemonList) {
      if (!pData || !Array.isArray(pData.forms)) continue

      for (const formRef of pData.forms) {
        try {
          const formRes = await fetch(formRef.url)
          if (!formRes.ok) continue
          const formData = await formRes.json()

          if (formData.is_mega === true) {
            megaEntries.push({ pokemonData: pData, formData })
          }
        } catch {
          // ignore individual fetch errors
        }
      }
    }

    if (megaEntries.length === 0) {
      pokemonFormsCache.set(cacheKey, [])
      return []
    }

    const normalizedMegaForms = await Promise.all(
      megaEntries.map(async ({ pokemonData, formData }) => {
        const typeResources = await Promise.all(
          pokemonData.types.map(({ type }) => fetchResourceData(type.url)),
        )
        const abilityResources = await Promise.all(
          pokemonData.abilities.map(({ ability }) => fetchResourceData(ability.url)),
        )

        const types = pokemonData.types.map(({ type }) => type.name)
        const typeLabels = Object.fromEntries(
          pokemonData.types.map(({ type }, index) => [
            type.name,
            resolveLocalizedResourceName(typeResources[index], locale, type.name),
          ]),
        )

        const abilities = pokemonData.abilities.map(({ ability }) => ability.name)
        const isSpanish = locale.startsWith('es')
        const abilityLabels = Object.fromEntries(
          pokemonData.abilities.map(({ ability }, index) => {
            const fallbackName = (isSpanish && abilityCatalogEs[ability.name]?.name) || formatName(ability.name.replaceAll('-', ' '))
            return [
              ability.name,
              resolveLocalizedResourceName(abilityResources[index], locale, fallbackName),
            ]
          }),
        )
        const abilityDescriptions = Object.fromEntries(
          pokemonData.abilities.map(({ ability }, index) => [
            ability.name,
            resolveAbilityDescription(abilityResources[index], locale, ability.name),
          ]),
        )

        const localizedName = resolveFormLocalizedName(
          formData,
          baseLocalizedName,
          locale,
        )

        const megaVariant = resolveMegaVariant(
          formData.form_name,
          formData.name,
        )

        const image =
          pokemonData.sprites.other?.['official-artwork']?.front_default ||
          pokemonData.sprites.other?.home?.front_default ||
          pokemonData.sprites.front_default ||
          formData.sprites?.front_default ||
          null

        const shinyImage =
          pokemonData.sprites.other?.['official-artwork']?.front_shiny ||
          pokemonData.sprites.other?.home?.front_shiny ||
          pokemonData.sprites.front_shiny ||
          formData.sprites?.front_shiny ||
          null

        return {
          id: pokemonData.id,
          name: pokemonData.name,
          formName: formData.form_name,
          localizedName,
          image,
          shinyImage,
          types,
          typeLabels,
          abilities,
          abilityLabels,
          abilityDescriptions,
          stats: pokemonData.stats.map(({ base_stat, stat }) => ({
            name: stat.name,
            value: base_stat,
          })),
          height: pokemonData.height / 10,
          weight: pokemonData.weight / 10,
          isMega: true,
          megaVariant,
          formLocale: locale,
          pokedexDescription: resolveFormPokedexDescription(
            formData,
            speciesData,
            locale,
            basePokedexDescription,
          ),
          cry: pokemonData.cries?.latest || pokemonData.cries?.legacy || null,
        }
      }),
    )

    normalizedMegaForms.sort((a, b) => {
      const order = { 'mega': 1, 'mega-x': 2, 'mega-y': 3, 'mega-z': 4 }
      return (order[a.megaVariant] || 99) - (order[b.megaVariant] || 99)
    })

    pokemonFormsCache.set(cacheKey, normalizedMegaForms)
    return normalizedMegaForms
  } catch (error) {
    console.error('Failed to get Mega forms:', error)
    return []
  }
}

export async function getPokemonForms(pokemonIdOrName, locale = 'en') {
  return getMegaForms(pokemonIdOrName, locale)
}

export async function getRegionalForms(pokemonIdOrName, locale = 'en') {
  if (!pokemonIdOrName) return []

  const cacheKey = `regional:${String(pokemonIdOrName).toLowerCase()}:${locale}`
  if (pokemonFormsCache.has(cacheKey)) {
    return pokemonFormsCache.get(cacheKey)
  }

  try {
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(String(pokemonIdOrName).toLowerCase())}`
    let speciesResponse = await fetch(speciesUrl)
    let speciesData = null
    if (speciesResponse.ok) {
      speciesData = await speciesResponse.json()
    } else {
      // If pokemonIdOrName was a variety slug (e.g. vulpix-alola), fetch pokemon first to get species.url
      try {
        const pRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(String(pokemonIdOrName).toLowerCase())}`)
        if (pRes.ok) {
          const pData = await pRes.json()
          if (pData?.species?.url) {
            const sRes = await fetch(pData.species.url)
            if (sRes.ok) speciesData = await sRes.json()
          }
        }
      } catch {
        // ignore
      }
    }

    if (!speciesData) {
      pokemonFormsCache.set(cacheKey, [])
      return []
    }

    const baseLocalizedName =
      speciesData.names?.find(
        ({ language }) =>
          language.name === locale ||
          (locale.startsWith('es') && language.name === 'es'),
      )?.name || speciesData.name

    const basePokedexDescription = resolvePokedexDescription(
      speciesData.flavor_text_entries,
      locale,
      speciesData.id,
      speciesData.name,
    )

    const varieties = speciesData.varieties || []
    const candidateVarieties = varieties.filter((v) => !v.is_default)

    if (candidateVarieties.length === 0) {
      pokemonFormsCache.set(cacheKey, [])
      return []
    }

    const varietyPokemonList = await Promise.all(
      candidateVarieties.map(async ({ pokemon }) => {
        try {
          const res = await fetch(pokemon.url)
          return res.ok ? res.json() : null
        } catch {
          return null
        }
      }),
    )

    const regionalEntries = []

    for (const pData of varietyPokemonList) {
      if (!pData || !Array.isArray(pData.forms)) continue

      for (const formRef of pData.forms) {
        try {
          const formRes = await fetch(formRef.url)
          if (!formRes.ok) continue
          const formData = await formRes.json()

          if (formData.is_mega === true) continue
          if (formData.is_battle_only === true) continue

          const region = detectRegionalVariant(formData.form_name, pData.name)
          if (!region) continue

          regionalEntries.push({ pokemonData: pData, formData, region })
        } catch {
          // ignore individual fetch errors
        }
      }
    }

    if (regionalEntries.length === 0) {
      pokemonFormsCache.set(cacheKey, [])
      return []
    }

    const normalizedRegionalForms = await Promise.all(
      regionalEntries.map(async ({ pokemonData, formData, region }) => {
        const typeResources = await Promise.all(
          pokemonData.types.map(({ type }) => fetchResourceData(type.url)),
        )
        const abilityResources = await Promise.all(
          pokemonData.abilities.map(({ ability }) => fetchResourceData(ability.url)),
        )

        const types = pokemonData.types.map(({ type }) => type.name)
        const typeLabels = Object.fromEntries(
          pokemonData.types.map(({ type }, index) => [
            type.name,
            resolveLocalizedResourceName(typeResources[index], locale, type.name),
          ]),
        )

        const abilities = pokemonData.abilities.map(({ ability }) => ability.name)
        const isSpanish = locale.startsWith('es')
        const abilityLabels = Object.fromEntries(
          pokemonData.abilities.map(({ ability }, index) => {
            const fallbackName = (isSpanish && abilityCatalogEs[ability.name]?.name) || formatName(ability.name.replaceAll('-', ' '))
            return [
              ability.name,
              resolveLocalizedResourceName(abilityResources[index], locale, fallbackName),
            ]
          }),
        )
        const abilityDescriptions = Object.fromEntries(
          pokemonData.abilities.map(({ ability }, index) => [
            ability.name,
            resolveAbilityDescription(abilityResources[index], locale, ability.name),
          ]),
        )

        const localizedName = resolveRegionalLocalizedName(
          formData,
          pokemonData,
          baseLocalizedName,
          region,
          locale,
        )

        const image =
          pokemonData.sprites.other?.['official-artwork']?.front_default ||
          pokemonData.sprites.other?.home?.front_default ||
          pokemonData.sprites.front_default ||
          formData.sprites?.front_default ||
          null

        const shinyImage =
          pokemonData.sprites.other?.['official-artwork']?.front_shiny ||
          pokemonData.sprites.other?.home?.front_shiny ||
          pokemonData.sprites.front_shiny ||
          formData.sprites?.front_shiny ||
          null

        return {
          id: pokemonData.id,
          name: pokemonData.name,
          formName: formData.form_name,
          localizedName,
          image,
          shinyImage,
          types,
          typeLabels,
          abilities,
          abilityLabels,
          abilityDescriptions,
          stats: pokemonData.stats.map(({ base_stat, stat }) => ({
            name: stat.name,
            value: base_stat,
          })),
          height: pokemonData.height / 10,
          weight: pokemonData.weight / 10,
          isRegional: true,
          region,
          formLocale: locale,
          pokedexDescription: resolveRegionalPokedexDescription(
            formData,
            speciesData,
            region,
            locale,
            basePokedexDescription,
          ),
          cry: pokemonData.cries?.latest || pokemonData.cries?.legacy || null,
        }
      }),
    )

    const regionOrder = { alola: 1, galar: 2, hisui: 3, paldea: 4 }
    normalizedRegionalForms.sort((a, b) => {
      return (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99)
    })

    pokemonFormsCache.set(cacheKey, normalizedRegionalForms)
    return normalizedRegionalForms
  } catch (error) {
    console.error('Failed to get Regional forms:', error)
    return []
  }
}

export const ITEM_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="44" stroke="%23ed6d5d" stroke-width="6" stroke-dasharray="4 2" opacity="0.45"/><circle cx="50" cy="50" r="14" stroke="%23172733" stroke-width="5" opacity="0.6"/><line x1="6" y1="50" x2="36" y2="50" stroke="%23172733" stroke-width="5" opacity="0.6"/><circle cx="50" cy="50" r="6" fill="%23ed6d5d"/></svg>`

const RETRO_PGL_ITEMS = new Set([
  'lava-cookie', 'berry-juice', 'sacred-ash', 'rage-candy-bar', 'old-gateau',
  'casteliacone', 'lumiose-galette', 'shalour-sable', 'big-malasada',
  'blue-flute', 'yellow-flute', 'red-flute', 'black-flute', 'white-flute',
  'shoal-salt', 'shoal-shell', 'red-shard', 'blue-shard', 'yellow-shard', 'green-shard',
  'growth-mulch', 'damp-mulch', 'stable-mulch', 'gooey-mulch',
])

export const SEREBII_SLUG_OVERRIDES = {
  'heavy-duty-boots': 'heavy-dutyboots',
  'exp-share': 'exp.share',
  'never-melt-ice': 'never-meltice',
  'x-sp-atk': 'xsp.atk',
  'x-sp-def': 'xsp.def',
  'kings-rock': "king'srock",
  'up-grade': 'upgrade',
  'miraidons-poke-ball': "miraidon'spokeball",
  'koraidons-poke-ball': "koraidon'spokeball",
  'kofus-wallet': "kofu'swallet",
  'fresh-start-mochi': 'fresh-startmochi',
  'jangmo-o-scales': 'jangmo-oscales',
  'bobs-food-tin': "bob'sfoodtin",
  'bachs-food-tin': "bach'sfoodtin",
  'sonias-book': "sonia'sbook",
  'hi-tech-earbuds': 'hi-techearbuds',
  'roto-stick': 'roto-stick',
  'pika-pika-pick': 'pika-pikapick',
  'vee-vee-pick': 'vee-veepick',
  'blue-flag-pick': 'blue-flagpick',
  'red-flag-pick': 'red-flagpick',
  'polka-dot-cup': 'polka-dotcup',
  'polka-dot-bottle': 'polka-dotbottle',
  'polka-dot-tablecloth': 'polka-dottablecloth',
  'steel-bottle-r': 'steelbottle(r)',
  'steel-bottle-b': 'steelbottle(b)',
  'steel-bottle-y': 'steelbottle(y)',
  'plaid-tablecloth-y': 'plaidtablecloth(y)',
  'plaid-tablecloth-b': 'plaidtablecloth(b)',
  'plaid-tablecloth-r': 'plaidtablecloth(r)',
  'bw-grass-tablecloth': 'b&wgrasstablecloth',
  'blue-sky-flower-pick': 'blue-skyflowerpick',
  'smoke-poke-tail': 'smoke-poketail',
  'legendary-clue-question': 'legendaryclue',
  'farfetchd-candy': "farfetch'dcandy",
  'mr-mime-candy': 'mr.mimecandy',
  // Poké Balls de Hisui
  'origin-ball': 'originball',
  'feather-ball': 'featherball',
  'wing-ball': 'wingball',
  'jet-ball': 'jetball',
  'leaden-ball': 'leadenball',
  'gigaton-ball': 'gigatonball',
}

export function getCleanSerebiiSlug(name) {
  if (!name) return ''

  // 1. Quitar sufijo de variante interna de PokeAPI (--held, --split, --merge, --letsgo, etc.)
  const baseName = name.split('--')[0]

  // 2. Revisar diccionario de mapeos específicos
  if (SEREBII_SLUG_OVERRIDES[baseName]) return SEREBII_SLUG_OVERRIDES[baseName]
  if (SEREBII_SLUG_OVERRIDES[name]) return SEREBII_SLUG_OVERRIDES[name]

  // 3. Normalizar Caramelos Exp (exp-candy-s -> exp.candys)
  if (baseName.startsWith('exp-candy-')) {
    return 'exp.candy' + baseName.replace('exp-candy-', '')
  }

  // 4. Limpieza por defecto
  return baseName.replace(/[^a-z0-9]/g, '')
}

/**
 * Inspecciona y valida la resolución nativa de un sprite en tiempo de desarrollo.
 */
export function validateItemSpriteResolution(item, imgElement) {
  if (typeof window !== 'undefined' && import.meta.env?.DEV && imgElement) {
    const { naturalWidth, naturalHeight, src } = imgElement
    if (naturalWidth > 0 && naturalWidth < 80 && !src.startsWith('data:image/svg')) {
      console.warn(`[ItemSprite] Low resolution sprite detected for ${item?.name || 'item'}: ${naturalWidth}x${naturalHeight} (${src})`)
    }
  }
}

// Registro de sprites cargados en desarrollo para detectar duplicaciones anómalas
const loadedSpritesRegistry = new Map()

export function trackLoadedSprite(item, src) {
  if (typeof window !== 'undefined' && import.meta.env?.DEV && src) {
    if (src.startsWith('data:image/svg')) {
      return
    }
    const name = item?.name || 'unknown'
    if (!loadedSpritesRegistry.has(src)) {
      loadedSpritesRegistry.set(src, new Set())
    }
    const set = loadedSpritesRegistry.get(src)
    set.add(name)
    if (set.size > 5 && set.size % 5 === 0) {
      console.warn(`[ItemSprite] Duplicación inusual detectada (${set.size} objetos apuntan a la misma URL ${src}):`, Array.from(set).join(', '))
    }
  }
}

/**
 * Construye y centraliza las URLs de los sprites de un objeto
 * siguiendo el sistema de prioridades y fallback.
 *
 * 1. Render HD Local Dedicado (/public/items/)
 * 2. Serebii SV (160x160 px render oficial de 9ª Gen).
 * 3. Serebii PGL (160x160 px / 80x80 px render oficial HD de Gen 5-7).
 * 4. Serebii Base (sprite canónico específico del objeto para cartas, abonos, MTs).
 * 5. PokéAPI Sprites (sprite oficial de respaldo).
 * 6. Placeholder Oficial estilizado de PokeGuide (SVG, ÚLTIMO RECURSO).
 */
export const KNOWN_STUB_ITEMS = new Set([
  'clefablite', 'victreebelite', 'starminite', 'dragoninite', 'meganiumite',
  'feraligite', 'skarmorite', 'froslassite', 'heatranite', 'darkranite',
  'emboarite', 'excadrite', 'scolipite', 'scraftinite', 'eelektrossite',
  'chandelurite', 'chesnaughtite', 'delphoxite', 'greninjite', 'pyroarite',
  'floettite', 'malamarite', 'barbaracite', 'dragalgite', 'hawluchanite',
  'zygardite', 'drampanite', 'zeraorite', 'falinksite', 'raichunite-x',
  'raichunite-y', 'chimechite', 'absolite-z', 'staraptite', 'garchompite-z',
  'lucarionite-z', 'golurkite', 'meowsticite', 'crabominite', 'golisopite',
  'magearnite', 'scovillainite', 'baxcalibrite', 'tatsugirinite', 'glimmoranite',
  // Contenedores/Bolsillos internos de UI de Let's Go (sin sprite físico de inventario)
  'candy-jar', 'pokemon-box', 'medicine-pocket', 'power-up-pocket',
  'clothing-trunk', 'catching-pocket', 'battle-pocket',
])

export function isExcludedItem(name) {
  if (!name) return true
  if (KNOWN_STUB_ITEMS.has(name)) return true
  if (name.startsWith('dynamax-crystal')) return true
  return false
}

export const CUSTOM_ITEM_SPRITES = {
  'linking-cord': {
    primary: '/items/linking-cord.png',
    fallback: '/items/linking-cord.png',
    defaultImage: ITEM_PLACEHOLDER_SVG,
    quaternary: ITEM_PLACEHOLDER_SVG,
  },
  'black-augurite': {
    primary: '/items/black-augurite.png',
    fallback: 'https://www.serebii.net/itemdex/sprites/sv/blackaugurite.png',
    defaultImage: ITEM_PLACEHOLDER_SVG,
    quaternary: ITEM_PLACEHOLDER_SVG,
  },
  'peat-block': {
    primary: '/items/peat-block.png',
    fallback: 'https://www.serebii.net/itemdex/sprites/sv/peatblock.png',
    defaultImage: ITEM_PLACEHOLDER_SVG,
    quaternary: ITEM_PLACEHOLDER_SVG,
  },
  'leader-crest': {
    primary: '/items/leaders-crest.png',
    fallback: '/items/leaders-crest.png',
    defaultImage: ITEM_PLACEHOLDER_SVG,
    quaternary: ITEM_PLACEHOLDER_SVG,
  },
  'leaders-crest': {
    primary: '/items/leaders-crest.png',
    fallback: '/items/leaders-crest.png',
    defaultImage: ITEM_PLACEHOLDER_SVG,
    quaternary: ITEM_PLACEHOLDER_SVG,
  },
  'town-map': {
    primary: '/items/town-map.png',
    fallback: '/items/town-map.png',
    defaultImage: ITEM_PLACEHOLDER_SVG,
    quaternary: ITEM_PLACEHOLDER_SVG,
  },
}

export const HISUI_ITEMS = new Set([
  'linking-cord', 'black-augurite', 'peat-block',
  'aux-power', 'aux-guard', 'aux-evasion', 'aux-powerguard',
  'choice-dumpling', 'twice-spice', 'swap-snack',
  'stealth-spray', 'scatter-bang', 'smoke-bomb', 'sticky-ball',
  'jubilife-muffin', 'remedy', 'fine-remedy', 'superb-remedy',
  'snowball', 'dazzling-honey', 'hearty-grains', 'plump-beans',
  'springy-mushroom', 'crunchy-salt', 'wood', 'iron-chunk',
  'origin-ball', 'feather-ball', 'wing-ball', 'jet-ball',
  'leaden-ball', 'gigaton-ball', 'legend-plate',
  'tumble-stone', 'black-tumblestone', 'sky-tumblestone',
  'bean-cake', 'grain-cake', 'honey-cake', 'mushroom-cake', 'salt-cake',
])

export function getItemSprite(itemData) {
  if (!itemData) {
    return {
      primary: ITEM_PLACEHOLDER_SVG,
      fallback: ITEM_PLACEHOLDER_SVG,
      defaultImage: ITEM_PLACEHOLDER_SVG,
      quaternary: ITEM_PLACEHOLDER_SVG,
      placeholder: ITEM_PLACEHOLDER_SVG,
    }
  }

  const name = itemData.name || ''

  // 1. Objetos con render local HD dedicado en /public/items/
  if (CUSTOM_ITEM_SPRITES[name]) {
    return {
      ...CUSTOM_ITEM_SPRITES[name],
      placeholder: ITEM_PLACEHOLDER_SVG,
    }
  }

  const serebiiSlug = getCleanSerebiiSlug(name)
  const isRetro = RETRO_PGL_ITEMS.has(name)
  const isMegaStone = name.endsWith('ite') || name.endsWith('ite-x') || name.endsWith('ite-y') || name === 'red-orb' || name === 'blue-orb'
  const pokeApiSprite = itemData.sprites?.default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`
  const baseSerebiiSprite = `https://www.serebii.net/itemdex/sprites/${serebiiSlug}.png`

  let primary
  let fallback
  let defaultImage
  let quaternary

  if (isMegaStone || isRetro) {
    // Para megapiedras y objetos retro, Pokémon Global Link (PGL) tiene renders oficiales HD
    primary = `https://www.serebii.net/itemdex/sprites/pgl/${serebiiSlug}.png`
    fallback = `https://www.serebii.net/itemdex/sprites/sv/${serebiiSlug}.png`
    defaultImage = baseSerebiiSprite
    quaternary = pokeApiSprite
  } else {
    // Para objetos generales:
    // 1. Serebii SV (160x160 px render 9ª Gen moderno HD)
    // 2. Serebii PGL (160x160 px / 80x80 px render oficial Global Link HD de Gen 5-7)
    // 3. Serebii Base (sprite canónico específico del objeto)
    // 4. PokéAPI Sprites (sprite oficial de respaldo)
    primary = `https://www.serebii.net/itemdex/sprites/sv/${serebiiSlug}.png`
    fallback = `https://www.serebii.net/itemdex/sprites/pgl/${serebiiSlug}.png`
    defaultImage = baseSerebiiSprite
    quaternary = pokeApiSprite
  }

  return {
    primary,
    fallback,
    defaultImage,
    quaternary,
    placeholder: ITEM_PLACEHOLDER_SVG,
  }
}

const itemCategoryCache = new Map()

/*
 * Devuelve la entrada localizada de una lista tipo
 * names / flavor_text_entries / effect_entries.
 *
 * Prioridad: locale exacto → es (si locale empieza por "es") → en →
 * cualquier entrada disponible (última versión) → null.
 */
function getLocalizedEntry(entries, locale) {
  if (!Array.isArray(entries) || entries.length === 0) return null

  const candidates = [...entries].reverse()
  const exact = candidates.find((e) => e.language?.name === locale)
  if (exact) return exact

  if (locale.startsWith('es')) {
    const es = candidates.find((e) => e.language?.name === 'es' || e.language?.name === 'es-419')
    if (es) return es
  }

  const en = candidates.find((e) => e.language?.name === 'en')
  if (en) return en

  if (candidates.length > 0) return candidates[0]

  return null
}

/*
 * Limpia los textos que vienen de PokeAPI:
 *   - normaliza saltos (\n, \f) y espacios
 *   - devuelve null si el texto queda vacío
 */
function cleanItemText(text) {
  return (
    String(text ?? '')
      .replace(/[\n\f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || null
  )
}

/*
 * Normaliza un texto para compararlo contra otro ignorando diferencias
 * sin importancia: acentos, mayúsculas, puntuación, espacios.
 */
function normalizeComparisonText(text) {
  const cleaned = cleanItemText(text)
  if (!cleaned) return ''

  return cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,!?;:()[\]"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/*
 * Convierte un slug tipo "standard-balls" en "Standard Balls".
 */
function humanizeSlug(slug) {
  return String(slug ?? '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/*
 * Resuelve el costo del objeto.
 * Considera precios canónicos para objetos de tienda comunes si PokeAPI no los tiene,
 * y devuelve 0 para objetos no comprables (como la Master Ball).
 */
function getItemCost(data) {
  if (canonicalItemCosts[data.name] !== undefined) {
    return canonicalItemCosts[data.name]
  }

  if (Number.isFinite(data.cost) && data.cost > 0) return data.cost

  if (Array.isArray(data.prices) && data.prices.length > 0) {
    const latest = [...data.prices]
      .reverse()
      .find(
        (p) =>
          Number.isFinite(p.purchase_price) && p.purchase_price > 0,
      )
    if (latest) return latest.purchase_price
  }

  return 0
}

/*
 * Obtiene el nombre localizado de una categoría (fetchea category.url).
 */
async function getItemCategoryMeta(categoryUrl, locale) {
  if (!categoryUrl) return { name: null, lang: null }

  if (!itemCategoryCache.has(categoryUrl)) {
    try {
      const response = await fetch(categoryUrl)
      if (!response.ok) throw new Error('category fetch failed')
      const cat = await response.json()
      itemCategoryCache.set(categoryUrl, cat.names || [])
    } catch {
      itemCategoryCache.set(categoryUrl, [])
    }
  }

  const names = itemCategoryCache.get(categoryUrl) || []
  const entry = getLocalizedEntry(names, locale)
  return {
    name: entry?.name || null,
    lang: entry?.language?.name || null,
  }
}

function entryLanguageMatches(entryLang, locale) {
  if (!entryLang) return false
  if (entryLang === locale) return true
  if (locale.startsWith('es') && (entryLang === 'es' || entryLang === 'es-419')) return true
  if (locale.startsWith('fr') && entryLang === 'fr') return true
  return false
}

export async function getItem(query, locale = 'en', messages = {}) {
  const normalizedQuery = normalizeItemQuery(query)

  if (!normalizedQuery) {
    throw new PokeApiError(
      getErrorMessage('empty', query, messages),
      'empty',
    )
  }

  const cacheKey = `${normalizedQuery}:${locale}`
  if (itemDetailCache.has(cacheKey)) {
    return itemDetailCache.get(cacheKey)
  }

  let response

  try {
    response = await fetch(
      `https://pokeapi.co/api/v2/item/${encodeURIComponent(normalizedQuery)}`,
    )
  } catch {
    throw new PokeApiError(
      getErrorMessage('network', query, messages),
      'network',
    )
  }

  if (response.status === 404) {
    throw new PokeApiError(
      getErrorMessage('not-found', query, messages),
      'not-found',
    )
  }

  if (!response.ok) {
    throw new PokeApiError(
      getErrorMessage('api', query, messages),
      'api',
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new PokeApiError(
      getErrorMessage('invalid', query, messages),
      'api',
    )
  }

  if (KNOWN_STUB_ITEMS.has(data.name)) {
    throw new PokeApiError('Item is an unreleased stub', 'stub')
  }

  const hasNoSprites = !data.sprites?.default
  const hasNoNames = !data.names || data.names.length === 0
  const hasNoFlavor = !data.flavor_text_entries || data.flavor_text_entries.length === 0
  const hasNoGameIndices = !data.game_indices || data.game_indices.length === 0

  if (hasNoSprites && hasNoNames && hasNoFlavor && hasNoGameIndices) {
    throw new PokeApiError('Item is an unreleased stub', 'stub')
  }

  const nameEntry = getLocalizedEntry(data.names, locale)
  const localizedName = nameEntry?.name || data.name

  /*
   * DESCRIPCIÓN  ←  flavor_text_entries en el idioma seleccionado.
   */
  const flavorEntry = getLocalizedEntry(data.flavor_text_entries, locale)
  const description = cleanItemText(flavorEntry?.text)

  /*
   * EFECTO  ←  itemEffectsEs en español; effect_entries en inglés.
   */
  let effect = null
  if (locale.startsWith('es')) {
    if (itemEffectsEs[data.name]) {
      effect = itemEffectsEs[data.name]
    } else {
      const esEffect = data.effect_entries?.find(
        (e) => e.language?.name === 'es' || e.language?.name === 'es-419'
      )
      if (esEffect) {
        effect = cleanItemText(esEffect.short_effect || esEffect.effect)
      }
    }
  } else {
    const effectEntry = getLocalizedEntry(data.effect_entries, locale)
    effect = cleanItemText(
      effectEntry?.short_effect || effectEntry?.effect,
    )
  }

  /*
   * Detección de duplicado para que la UI no repita el mismo texto.
   */
  const hasDuplicateText = Boolean(
    description &&
      effect &&
      normalizeComparisonText(description) ===
        normalizeComparisonText(effect),
  )

  // Categoría: traducción centralizada al español con fallback
  const categoryMeta = await getItemCategoryMeta(data.category?.url, locale)
  const categorySlug = data.category?.name || ''
  let category = ''

  if (locale.startsWith('es')) {
    category =
      itemCategoriesEs[categorySlug] ||
      (categoryMeta.name && entryLanguageMatches(categoryMeta.lang, locale)
        ? categoryMeta.name
        : humanizeSlug(categorySlug))
  } else {
    category = categoryMeta.name || humanizeSlug(categorySlug)
  }

  const cost = getItemCost(data)
  const sprites = getItemSprite(data)

  const result = {
    id: data.id,
    name: data.name,
    localizedName,

    // Sprites con jerarquía de calidad
    image: sprites.primary,
    fallbackImage: sprites.fallback,
    defaultImage: sprites.defaultImage,
    quaternaryImage: sprites.quaternary,
    placeholderImage: sprites.placeholder,

    category,
    categorySlug,
    cost,

    // Campos de texto diferenciados
    description,
    effect,
    hasDuplicateText,
  }

  itemDetailCache.set(cacheKey, result)
  return result
}

export const QUICK_ITEM_CATEGORIES = {
  balls: ['standard-balls', 'special-balls', 'apricorn-balls'],
  healing: ['healing', 'status-cures', 'revival', 'pp-recovery', 'medicine'],
  battle: ['held-items', 'choice', 'stat-boosts', 'type-enhancement', 'plates', 'bad-held-items'],
  evolution: ['evolution', 'mega-stones', 'tera-shard'],
  berries: ['picky-healing', 'in-a-pinch', 'type-protection', 'baking-only', 'effort-drop'],
  vitamins: ['vitamins', 'nature-mints', 'effort-training', 'training'],
  key: ['plot-advancement', 'event-items', 'gameplay', 'dex-completion', 'collectibles'],
}

const categoryItemNamesCache = new Map()

export async function getItemNamesForCategory(categorySlug) {
  if (categorySlug === 'dynamax-crystals') {
    return []
  }
  if (categoryItemNamesCache.has(categorySlug)) {
    return categoryItemNamesCache.get(categorySlug)
  }

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/item-category/${encodeURIComponent(categorySlug)}`)
    if (!res.ok) {
      categoryItemNamesCache.set(categorySlug, [])
      return []
    }
    const data = await res.json()
    const names = (data.items || [])
      .map((item) => item.name)
      .filter((name) => !isExcludedItem(name))
    categoryItemNamesCache.set(categorySlug, names)
    return names
  } catch {
    categoryItemNamesCache.set(categorySlug, [])
    return []
  }
}

export async function resolveCategoryItemNames(category) {
  if (!category || category === 'all') return null

  const slugs = QUICK_ITEM_CATEGORIES[category] || [category]
  const allNames = []
  const seen = new Set()

  for (const slug of slugs) {
    const names = await getItemNamesForCategory(slug)
    for (const name of names) {
      if (!seen.has(name)) {
        seen.add(name)
        allNames.push(name)
      }
    }
  }

  return allNames
}

const COMMON_ITEM_SLUGS_ES = {
  'bola luminosa': 'light-ball',
  'bolaluminosa': 'light-ball',
  'bola luz': 'light-ball',
  'light ball': 'light-ball',
  'piedra solar': 'sun-stone',
  'solar': 'sun-stone',
  'sol': 'sun-stone',
  'piedra lunar': 'moon-stone',
  'lunar': 'moon-stone',
  'piedra fuego': 'fire-stone',
  'piedra trueno': 'thunder-stone',
  'piedra agua': 'water-stone',
  'piedra hoja': 'leaf-stone',
  'piedra dia': 'shiny-stone',
  'piedra noche': 'dusk-stone',
  'piedra alba': 'dawn-stone',
  'piedra hielo': 'ice-stone',
  'piedra oval': 'oval-stone',
  'galleta lava': 'lava-cookie',
  'zumo de baya': 'berry-juice',
  'ceniza sagrada': 'sacred-ash',
  'caramelo raro': 'rare-candy',
  'caramelo': 'rare-candy',
  'restos': 'leftovers',
  'cinta eleccion': 'choice-band',
  'gafas eleccion': 'choice-specs',
  'panuelo eleccion': 'choice-scarf',
  'vidasfera': 'life-orb',
  'chaleco asalto': 'assault-vest',
  'mineral evolutivo': 'eviolite',
  'banda focus': 'focus-sash',
  'cinta focus': 'focus-band',
  'casco dentado': 'rocky-helmet',
  'botas gruesas': 'heavy-duty-boots',
  'super ball': 'great-ball',
  'ultra ball': 'ultra-ball',
  'master ball': 'master-ball',
  'master': 'master-ball',
  'pocion': 'potion',
  'superpocion': 'super-potion',
  'hyperpocion': 'hyper-potion',
  'hiperpocion': 'hyper-potion',
  'pocion maxima': 'max-potion',
  'restaura todo': 'full-restore',
  'revivir': 'revive',
  'revivir maximo': 'max-revive',
  'cordon union': 'linking-cord',
  'cordon': 'linking-cord',
  'mineral negro': 'black-augurite',
  'augurita': 'black-augurite',
  'augurita negra': 'black-augurite',
  'bloque de turba': 'peat-block',
  'bloque turba': 'peat-block',
  'turba': 'peat-block',
  'distintivo de lider': 'leader-crest',
  'distintivo lider': 'leader-crest',
}

export async function searchItemDirect(query, locale = 'en', messages = {}) {
  const norm = normalizeSearchText(query)
  if (!norm) return null

  const resolvedSlug = COMMON_ITEM_SLUGS_ES[norm] || norm.replace(/\s+/g, '-')

  try {
    return await getItem(resolvedSlug, locale, messages)
  } catch {
    return null
  }
}

let allItemsCache = null

export async function getAllItemSlugs() {
  if (allItemsCache && allItemsCache.length > 0) {
    return allItemsCache
  }
  try {
    const res = await fetch('https://pokeapi.co/api/v2/item?limit=2500')
    if (!res.ok) return []
    const data = await res.json()
    allItemsCache = (data.results || [])
      .map((r) => r.name)
      .filter((name) => !isExcludedItem(name))
    return allItemsCache
  } catch {
    return []
  }
}

const SEARCH_KEYWORD_CATEGORIES = {
  piedra: 'evolution',
  piedras: 'evolution',
  evolucion: 'evolution',
  stone: 'evolution',
  stones: 'evolution',
  mega: 'mega-stones',
  megapiedra: 'mega-stones',
  megapiedras: 'mega-stones',
  baya: 'berries',
  bayas: 'berries',
  berry: 'berries',
  berries: 'berries',
  ball: 'balls',
  balls: 'balls',
  bola: 'balls',
  bolas: 'balls',
  pokeball: 'balls',
  pocion: 'healing',
  pociones: 'healing',
  cura: 'healing',
  curacion: 'healing',
  medicina: 'healing',
  revivir: 'revival',
  vitamina: 'vitamins',
  vitaminas: 'vitamins',
  menta: 'nature-mints',
  mentas: 'nature-mints',
  combate: 'battle',
  batalla: 'battle',
  tabla: 'plates',
  tablas: 'plates',
  clave: 'key',
  historia: 'key',
}

const ES_EN_ITEM_KEYWORDS = {
  fuego: 'fire',
  agua: 'water',
  trueno: 'thunder',
  rayo: 'thunder',
  hoja: 'leaf',
  planta: 'leaf',
  luna: 'moon',
  lunar: 'moon',
  sol: 'sun',
  solar: 'sun',
  dia: 'shiny',
  noche: 'dusk',
  alba: 'dawn',
  hielo: 'ice',
  nieve: 'ice',
  oval: 'oval',
  caramelo: 'candy',
  restos: 'leftovers',
  cinta: 'band',
  gafas: 'specs',
  chaleco: 'vest',
  mineral: 'eviolite',
  casco: 'helmet',
  escama: 'scale',
  diente: 'tooth',
  garra: 'claw',
  colmillo: 'fang',
  roca: 'rock',
  arena: 'sand',
  perla: 'pearl',
  polvo: 'powder',
  hierba: 'herb',
  bota: 'boots',
  botas: 'boots',
}

export async function searchItemsCatalog(query, locale = 'en', messages = {}) {
  const norm = normalizeSearchText(query)
  if (!norm) return { items: [], totalCount: 0 }

  // 1. Si la palabra clave mapea a una categoría (ej. "piedra", "bayas", "bolas", "cura")
  const matchedCategory = SEARCH_KEYWORD_CATEGORIES[norm]
  if (matchedCategory) {
    return await getItems({
      category: matchedCategory,
      limit: 40,
      offset: 0,
      locale,
      messages,
    })
  }

  // 2. Si coincide directamente con el diccionario de traducción al español
  if (COMMON_ITEM_SLUGS_ES[norm]) {
    try {
      const item = await getItem(COMMON_ITEM_SLUGS_ES[norm], locale, messages)
      if (item) return { items: [item], totalCount: 1 }
    } catch {
      // continuar con búsqueda amplia
    }
  }

  // 3. Búsqueda amplia de candidatos por slug y catálogo
  const allSlugs = await getAllItemSlugs()
  const candidateSet = new Set()

  // a) Slugs del diccionario ES que contienen la palabra buscada
  for (const [esKey, slug] of Object.entries(COMMON_ITEM_SLUGS_ES)) {
    if (esKey.includes(norm) || norm.includes(esKey)) {
      candidateSet.add(slug)
    }
  }

  // b) Slugs de PokéAPI que contienen la palabra buscada
  const slugQuery = norm.replace(/\s+/g, '-')
  for (const slug of allSlugs) {
    if (slug.includes(slugQuery)) {
      candidateSet.add(slug)
    }
  }

  // c) Traducción semántica ES -> EN
  for (const [esWord, enWord] of Object.entries(ES_EN_ITEM_KEYWORDS)) {
    if (norm.includes(esWord)) {
      for (const slug of allSlugs) {
        if (slug.includes(enWord)) {
          candidateSet.add(slug)
        }
      }
    }
  }

  const candidateSlugs = Array.from(candidateSet).slice(0, 40)
  if (candidateSlugs.length === 0) {
    try {
      const direct = await getItem(slugQuery, locale, messages)
      if (direct) return { items: [direct], totalCount: 1 }
    } catch {
      return { items: [], totalCount: 0 }
    }
    return { items: [], totalCount: 0 }
  }

  const results = await Promise.allSettled(
    candidateSlugs.map((slug) => getItem(slug, locale, messages))
  )

  const items = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value)

  return {
    items,
    totalCount: items.length,
  }
}

export async function getItems({
  category = 'all',
  limit = 40,
  offset = 0,
  locale = 'en',
  messages = {},
} = {}) {
  const cacheKey = `${category}:${locale}:${limit}:${offset}`

  if (itemPageCache.has(cacheKey)) {
    return itemPageCache.get(cacheKey)
  }

  // 1. Paginación por categoría o grupo de categorías (ej. 'evolution', 'berries', 'held-items')
  if (category && category !== 'all') {
    const categoryItemNames = await resolveCategoryItemNames(category)
    const totalCount = categoryItemNames.length
    const pageSlice = categoryItemNames.slice(offset, offset + limit)

    const itemsResults = await Promise.allSettled(
      pageSlice.map((name) => getItem(name, locale, messages)),
    )

    const items = itemsResults
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value)

    const result = {
      items,
      totalCount,
      nextOffset: offset + limit < totalCount ? offset + limit : null,
    }

    itemPageCache.set(cacheKey, result)
    return result
  }

  // 2. Paginación global ('all')
  let response

  try {
    response = await fetch(
      `https://pokeapi.co/api/v2/item?limit=${limit}&offset=${offset}`,
    )
  } catch {
    throw new PokeApiError(
      getErrorMessage('network', 'items', messages),
      'network',
    )
  }

  if (!response.ok) {
    throw new PokeApiError(
      getErrorMessage('api', 'items', messages),
      'api',
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new PokeApiError(
      getErrorMessage('invalid', 'items', messages),
      'api',
    )
  }

  const validResults = (data.results || []).filter(({ name }) => !isExcludedItem(name))
  const itemsResults = await Promise.allSettled(
    validResults.map(({ name }) =>
      getItem(name, locale, messages),
    ),
  )

  const items = itemsResults
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value)

  const result = {
    items,
    totalCount: data.count || 0,
    nextOffset: data.next ? offset + limit : null,
  }

  itemPageCache.set(cacheKey, result)

  return result
}

const evolutionChainCache = new Map()
const evolutionPokemonCache = new Map()

const itemTranslationsEs = {
  'light-ball': 'Bola Luminosa',
  'fire-stone': 'Piedra Fuego',
  'water-stone': 'Piedra Agua',
  'thunder-stone': 'Piedra Trueno',
  'leaf-stone': 'Piedra Hoja',
  'moon-stone': 'Piedra Lunar',
  'sun-stone': 'Piedra Solar',
  'shiny-stone': 'Piedra Día',
  'dusk-stone': 'Piedra Noche',
  'dawn-stone': 'Piedra Alba',
  'ice-stone': 'Piedra Hielo',
  'oval-stone': 'Piedra Oval',
  'sweet-apple': 'Manzana Dulce',
  'tart-apple': 'Manzana Ácida',
  'syrupy-apple': 'Manzana Melosa',
  'cracked-pot': 'Tetera Rota',
  'chipped-pot': 'Tetera Agrietada',
  'metal-coat': 'Rev. Metálico',
  'kings-rock': 'Roca del Rey',
  'dragon-scale': 'Escama Dragón',
  'upgrade': 'Mejora',
  'dubious-disc': 'Disco Extraño',
  'protector': 'Protector',
  'electirizer': 'Electirizador',
  'magmarizer': 'Magmatizador',
  'reaper-cloth': 'Tela Terrible',
  'prism-scale': 'Escama Bella',
  'whipped-dream': 'Dulce de Nata',
  'sachet': 'Saquito Fragante',
  'razor-claw': 'Garra Afilada',
  'razor-fang': 'Colmillo Agudo',
  'deep-sea-tooth': 'Diente Marino',
  'deep-sea-scale': 'Escama Marina',
  'auspicious-armor': 'Armadura Auspiciosa',
  'malicious-armor': 'Armadura Maldita',
  'scroll-of-darkness': 'Manuscrito Sombrío',
  'scroll-of-waters': 'Manuscrito Aguas',
  'black-augurite': 'Mineral Negro',
  'peat-block': 'Bloque de Turba',
}

const typeTranslationsEs = {
  bug: 'Bicho', dark: 'Siniestro', dragon: 'Dragón', electric: 'Eléctrico', fairy: 'Hada',
  fighting: 'Lucha', fire: 'Fuego', flying: 'Volador', ghost: 'Fantasma', grass: 'Planta',
  ground: 'Tierra', ice: 'Hielo', normal: 'Normal', poison: 'Veneno', psychic: 'Psíquico',
  rock: 'Roca', steel: 'Acero', water: 'Agua',
}

function formatItemName(itemName, locale) {
  if (!itemName) return ''
  if (locale.startsWith('es') && itemTranslationsEs[itemName]) {
    return itemTranslationsEs[itemName]
  }
  return itemName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatSingleEvolutionDetail(detail, locale) {
  const isEs = locale.startsWith('es')
  const parts = []

  if (detail.min_level) {
    parts.push(isEs ? `Nivel ${detail.min_level}` : `Level ${detail.min_level}`)
  }

  if (detail.item) {
    parts.push(formatItemName(detail.item.name, locale))
  }

  if (detail.held_item) {
    const heldName = formatItemName(detail.held_item.name, locale)
    parts.push(isEs ? `Equipado con ${heldName}` : `Holding ${heldName}`)
  }

  if (detail.trigger?.name === 'trade') {
    if (detail.trade_species) {
      const tradeTarget = detail.trade_species.name.charAt(0).toUpperCase() + detail.trade_species.name.slice(1)
      parts.push(isEs ? `Intercambio por ${tradeTarget}` : `Trade for ${tradeTarget}`)
    } else {
      parts.push(isEs ? 'Intercambio' : 'Trade')
    }
  } else if (detail.trigger?.name === 'shed') {
    parts.push(isEs ? 'Espacio libre en equipo' : 'Empty party slot')
  } else if (detail.trigger?.name === 'spin') {
    parts.push(isEs ? 'Girar sobre sí mismo' : 'Spin around')
  } else if (detail.trigger?.name === 'three-critical-hits') {
    parts.push(isEs ? '3 golpes críticos' : '3 critical hits')
  } else if (detail.trigger?.name === 'take-damage') {
    parts.push(isEs ? 'Recibir daño bajo arco de piedra' : 'Take damage under stone arch')
  }

  if (detail.min_happiness) {
    parts.push(isEs ? 'Amistad alta' : 'High Friendship')
  }

  if (detail.min_affection) {
    parts.push(isEs ? 'Afecto alto' : 'High Affection')
  }

  if (detail.min_beauty) {
    parts.push(isEs ? 'Belleza alta' : 'High Beauty')
  }

  if (detail.time_of_day) {
    if (detail.time_of_day === 'day') {
      parts.push(isEs ? 'De día' : 'Daytime')
    } else if (detail.time_of_day === 'night') {
      parts.push(isEs ? 'De noche' : 'Nighttime')
    }
  }

  if (detail.known_move) {
    const moveName = detail.known_move.name
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
    parts.push(isEs ? `Conocer ${moveName}` : `Learn ${moveName}`)
  }

  if (detail.known_move_type) {
    const rawType = detail.known_move_type.name.toLowerCase()
    const typeName = isEs && typeTranslationsEs[rawType]
      ? typeTranslationsEs[rawType]
      : rawType.charAt(0).toUpperCase() + rawType.slice(1)
    parts.push(isEs ? `Mov. tipo ${typeName}` : `${typeName}-type move`)
  }

  if (detail.location) {
    const locationName = detail.location.name
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
    parts.push(isEs ? `En ${locationName}` : `At ${locationName}`)
  }

  if (detail.needs_overworld_rain) {
    parts.push(isEs ? 'Durante lluvia' : 'During rain')
  }

  if (detail.turn_upside_down) {
    parts.push(isEs ? 'Girar consola' : 'Turn upside down')
  }

  if (detail.gender === 1) {
    parts.push(isEs ? '♀ Hembra' : '♀ Female')
  } else if (detail.gender === 2) {
    parts.push(isEs ? '♂ Macho' : '♂ Male')
  }

  if (detail.party_species) {
    const partyTarget = detail.party_species.name.charAt(0).toUpperCase() + detail.party_species.name.slice(1)
    parts.push(isEs ? `Con ${partyTarget}` : `With ${partyTarget}`)
  }

  if (detail.party_type) {
    const rawPartyType = detail.party_type.name.toLowerCase()
    const partyTypeName = isEs && typeTranslationsEs[rawPartyType]
      ? typeTranslationsEs[rawPartyType]
      : rawPartyType.charAt(0).toUpperCase() + rawPartyType.slice(1)
    parts.push(isEs ? `Con tipo ${partyTypeName}` : `With ${partyTypeName}-type`)
  }

  if (typeof detail.relative_physical_stats === 'number') {
    if (detail.relative_physical_stats === 1) {
      parts.push(isEs ? 'Ataque > Defensa' : 'Attack > Defense')
    } else if (detail.relative_physical_stats === -1) {
      parts.push(isEs ? 'Ataque < Defensa' : 'Attack < Defense')
    } else if (detail.relative_physical_stats === 0) {
      parts.push(isEs ? 'Ataque = Defensa' : 'Attack = Defense')
    }
  }

  return parts.filter(Boolean).join(' + ')
}

function formatEvolutionDetails(detailsArray, locale) {
  if (!Array.isArray(detailsArray) || detailsArray.length === 0) {
    return locale.startsWith('es') ? 'Evolución' : 'Evolution'
  }

  // If there are multiple alternatives (e.g. Leafeon with 5 old game locations vs Leaf Stone), prefer item or level-based evolution
  let prioritizedDetails = detailsArray
  const itemOrLevelDetails = detailsArray.filter((d) => d.item || d.min_level)
  if (itemOrLevelDetails.length > 0) {
    prioritizedDetails = itemOrLevelDetails
  }

  const formattedOptions = Array.from(
    new Set(
      prioritizedDetails
        .map((detail) => formatSingleEvolutionDetail(detail, locale))
        .filter(Boolean),
    ),
  )

  if (formattedOptions.length === 0) {
    return locale.startsWith('es') ? 'Evolución' : 'Evolution'
  }

  // Display at most 2 alternative methods to keep condition badges concise
  return formattedOptions.slice(0, 2).join(locale.startsWith('es') ? ' o ' : ' or ')
}

function collectSpeciesNodes(node, list = []) {
  if (node?.species) list.push(node.species)
  if (Array.isArray(node?.evolves_to)) {
    node.evolves_to.forEach((child) => collectSpeciesNodes(child, list))
  }
  return list
}

function buildEvolutionTree(node, predecessorDetails, locale, speciesDataMap) {
  const id = Number(node.species.url.split('/').filter(Boolean).pop())
  const spData = speciesDataMap.get(id) || {
    id,
    name: node.species.name,
    apiName: node.species.name,
    localizedName: node.species.name,
    types: [],
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  }

  const conditions = predecessorDetails && predecessorDetails.length > 0
    ? formatEvolutionDetails(predecessorDetails, locale)
    : null

  const evolvesTo = (node.evolves_to || []).map((child) =>
    buildEvolutionTree(child, child.evolution_details, locale, speciesDataMap),
  )

  return {
    ...spData,
    conditions,
    evolvesTo,
  }
}

export async function getEvolutionChain(speciesUrlOrId, locale = 'es') {
  if (!speciesUrlOrId) return null

  const speciesUrl = typeof speciesUrlOrId === 'string' && speciesUrlOrId.startsWith('http')
    ? speciesUrlOrId
    : `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(String(speciesUrlOrId).trim().toLowerCase())}`

  const cacheKey = `${speciesUrl}_${locale}`
  if (evolutionChainCache.has(cacheKey)) {
    return evolutionChainCache.get(cacheKey)
  }

  let speciesData
  try {
    const speciesRes = await fetch(speciesUrl)
    if (!speciesRes.ok) return null
    speciesData = await speciesRes.json()
  } catch {
    return null
  }

  const chainUrl = speciesData.evolution_chain?.url
  if (!chainUrl) return null

  const chainCacheKey = `${chainUrl}_${locale}`
  if (evolutionChainCache.has(chainCacheKey)) {
    const cached = evolutionChainCache.get(chainCacheKey)
    evolutionChainCache.set(cacheKey, cached)
    return cached
  }

  let chainData
  try {
    const chainRes = await fetch(chainUrl)
    if (!chainRes.ok) return null
    chainData = await chainRes.json()
  } catch {
    return null
  }

  if (!chainData.chain?.evolves_to || chainData.chain.evolves_to.length === 0) {
    // Pokemon has no evolutionary stages (e.g. Mewtwo, Lapras, Kangaskhan)
    return null
  }

  const allSpecies = collectSpeciesNodes(chainData.chain)
  const uniqueSpecies = Array.from(new Map(allSpecies.map((s) => [s.name, s])).values())

  const speciesDataMap = new Map()

  await Promise.all(
    uniqueSpecies.map(async (sp) => {
      const id = Number(sp.url.split('/').filter(Boolean).pop())

      const cachedPokemon = evolutionPokemonCache.get(`${id}_${locale}`)
      if (cachedPokemon) {
        speciesDataMap.set(id, cachedPokemon)
        return
      }

      try {
        const [spRes, pokeRes] = await Promise.all([
          fetch(sp.url).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ])

        const localizedName = spRes?.names?.find(
          ({ language }) => language.name === locale || (locale.startsWith('es') && language.name === 'es'),
        )?.name || sp.name.charAt(0).toUpperCase() + sp.name.slice(1)

        const types = (pokeRes?.types || []).map(({ type }) => type.name)

        const item = {
          id,
          apiName: sp.name,
          name: sp.name,
          localizedName,
          types,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        }

        evolutionPokemonCache.set(`${id}_${locale}`, item)
        speciesDataMap.set(id, item)
      } catch {
        const fallback = {
          id,
          apiName: sp.name,
          name: sp.name,
          localizedName: sp.name.charAt(0).toUpperCase() + sp.name.slice(1),
          types: [],
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        }
        speciesDataMap.set(id, fallback)
      }
    }),
  )

  const rootNode = buildEvolutionTree(chainData.chain, null, locale, speciesDataMap)
  const result = { chain: rootNode }

  evolutionChainCache.set(chainCacheKey, result)
  evolutionChainCache.set(cacheKey, result)

  return result
}

/* ==========================================================================
   Pokédex Catalog & Progressive Filtering Services
   ========================================================================== */

export const POKEAPI_COLOR_MAP = {
  black: '#334155',
  blue: '#3b82f6',
  brown: '#b45309',
  gray: '#64748b',
  green: '#10b981',
  pink: '#ec4899',
  purple: '#8b5cf6',
  red: '#ef4444',
  white: '#94a3b8',
  yellow: '#eab308',
}

export function mapPokeApiColor(colorName) {
  if (!colorName) return '#8b5cf6'
  const key = String(colorName).toLowerCase().trim()
  return POKEAPI_COLOR_MAP[key] || '#8b5cf6'
}

export const GENERATION_RANGES = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
}

export const REGION_RANGES = {
  kanto: [1, 151],
  johto: [152, 251],
  hoenn: [252, 386],
  sinnoh: [387, 493],
  unova: [494, 649],
  kalos: [650, 721],
  alola: [722, 809],
  galar: [810, 905],
  paldea: [906, 1025],
}

const typePokemonCache = new Map()
const pokedexCardCache = new Map()

export async function getPokemonByType(typeName) {
  const normalizedType = String(typeName).toLowerCase().trim()
  if (typePokemonCache.has(normalizedType)) {
    return typePokemonCache.get(normalizedType)
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${normalizedType}`)
    if (!response.ok) {
      return new Set()
    }
    const data = await response.json()
    const ids = new Set(
      (data.pokemon || [])
        .map((p) => Number(p.pokemon.url.split('/').filter(Boolean).pop()))
        .filter((id) => id > 0 && id <= 1025),
    )
    typePokemonCache.set(normalizedType, ids)
    return ids
  } catch {
    return new Set()
  }
}

export async function getPokedexCard(id, locale = 'es') {
  const cacheKey = `${id}:${locale}`
  if (pokedexCardCache.has(cacheKey)) {
    return pokedexCardCache.get(cacheKey)
  }

  try {
    const [pokemonRes, speciesRes] = await Promise.allSettled([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
    ])

    const pokemonData =
      pokemonRes.status === 'fulfilled' && pokemonRes.value.ok
        ? await pokemonRes.value.json()
        : null

    const speciesData =
      speciesRes.status === 'fulfilled' && speciesRes.value.ok
        ? await speciesRes.value.json()
        : null

    const isSpanish = locale.startsWith('es')
    const localizedName =
      getPokemonDisplayName(id, locale) ||
      speciesData?.names?.find(
        (n) =>
          n?.language?.name === locale ||
          (isSpanish && n?.language?.name === 'es'),
      )?.name ||
      pokemonData?.name ||
      `Pokémon #${id}`

    const types = (pokemonData?.types || []).map((t) => t.type.name)
    const colorName = speciesData?.color?.name || 'purple'
    const accentColor = mapPokeApiColor(colorName)

    const image =
      pokemonData?.sprites?.other?.['official-artwork']?.front_default ||
      pokemonData?.sprites?.other?.home?.front_default ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

    const shinyImage =
      pokemonData?.sprites?.other?.['official-artwork']?.front_shiny ||
      pokemonData?.sprites?.other?.home?.front_shiny ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`

    const card = {
      id,
      apiName: pokemonData?.name || String(id),
      name: localizedName,
      types,
      colorName,
      accentColor,
      image,
      shinyImage,
    }

    pokedexCardCache.set(cacheKey, card)
    return card
  } catch {
    const fallback = {
      id,
      apiName: String(id),
      name: `Pokémon #${id}`,
      types: [],
      colorName: 'gray',
      accentColor: mapPokeApiColor('gray'),
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      shinyImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`,
    }
    return fallback
  }
}

export async function getPokedexList({
  limit = 24,
  offset = 0,
  query = '',
  type = '',
  generation = '',
  region = '',
  locale = 'es',
  messages = {},
} = {}) {
  let index = []
  try {
    index = await getPokemonIndex(locale)
  } catch {
    throw new PokeApiError(
      getErrorMessage('network', 'pokedex', messages),
      'network',
    )
  }

  let typeFilterSet = null
  if (type) {
    typeFilterSet = await getPokemonByType(type)
  }

  let genBounds = null
  if (generation && GENERATION_RANGES[generation]) {
    genBounds = GENERATION_RANGES[generation]
  }

  let regionBounds = null
  if (region && REGION_RANGES[region.toLowerCase()]) {
    regionBounds = REGION_RANGES[region.toLowerCase()]
  }

  const normalizedQuery = query ? normalizeSearchText(query) : ''

  const filteredList = index.filter((p) => {
    const id = p.id
    if (id <= 0 || id > 1025) return false

    if (normalizedQuery) {
      const matchesQuery =
        String(id) === normalizedQuery ||
        String(id).padStart(3, '0') === normalizedQuery ||
        (Array.isArray(p.searchNames) &&
          p.searchNames.some((n) => n.includes(normalizedQuery)))
      if (!matchesQuery) return false
    }

    if (typeFilterSet && !typeFilterSet.has(id)) {
      return false
    }

    if (genBounds && (id < genBounds[0] || id > genBounds[1])) {
      return false
    }

    if (regionBounds && (id < regionBounds[0] || id > regionBounds[1])) {
      return false
    }

    return true
  })

  const totalCount = filteredList.length
  const pageSlice = filteredList.slice(offset, offset + limit)

  const cards = await Promise.all(
    pageSlice.map((item) => getPokedexCard(item.id, locale)),
  )

  const hasMore = offset + limit < totalCount
  const nextOffset = hasMore ? offset + limit : null

  return {
    pokemon: cards,
    filteredItems: filteredList.map((p) => ({
      id: p.id,
      apiName: p.apiName,
      name: p.displayName,
    })),
    totalCount,
    hasMore,
    nextOffset,
  }
}


