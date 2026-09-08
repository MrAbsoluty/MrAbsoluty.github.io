import {
  megaDescriptionsEs,
  megaDescriptionsEn,
  getGenericMegaDescription,
} from '../locales/megaDescriptions.js'
import {
  getGen9DescriptionEs,
  translateEnglishPokedexToSpanish,
} from '../locales/pokedexGen9Es.js'

const API_URL = 'https://pokeapi.co/api/v2/pokemon/'
const SPECIES_LIST_URL = 'https://pokeapi.co/api/v2/pokemon-species?limit=2000'
const INDEX_CACHE_KEY = 'pokeguide-pokemon-search-index-v2'
let pokemonIndexPromise
const itemPageCache = new Map()

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

  let normalizedQuery = numericQuery || normalizePokemonQuery(query)

  if (!normalizedSearchQuery) {
    throw new PokeApiError(
      getErrorMessage('empty', query, messages),
      'empty',
    )
  }

  if (!numericQuery) {
    const index = await getPokemonIndex(locale)

    const match = index.find(({ names, apiName }) =>
      [apiName, names.en, names.es]
        .filter(Boolean)
        .some(
          (name) =>
            normalizeSearchText(name) === normalizedSearchQuery,
        ),
    )

    if (match) normalizedQuery = match.apiName
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
    ].map(async (url) => {
      try {
        const response = await fetch(url)
        return response.ok ? response.json() : null
      } catch {
        return null
      }
    }),
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
    }
  } catch {
    speciesName = data.name
    pokedexDescription = null
  }

  return {
    id: data.id,
    name: data.name,
    localizedName: speciesName,
    image:
      data.sprites.other?.['official-artwork']?.front_default ||
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
      data.abilities.map(({ ability }, index) => [
        ability.name,
        abilityResources[index]?.names?.find(
          ({ language }) =>
            language.name === locale ||
            (locale.startsWith('es') && language.name === 'es'),
        )?.name || ability.name,
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
      data.sprites.front_shiny ||
      null,
    cry: data.cries?.latest || data.cries?.legacy || null,
  }
}

const pokemonFormsCache = new Map()
const resourceLabelCache = new Map()

async function fetchResourceData(url) {
  if (!url) return null
  if (resourceLabelCache.has(url)) return resourceLabelCache.get(url)
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    resourceLabelCache.set(url, data)
    return data
  } catch {
    return null
  }
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
        const abilityLabels = Object.fromEntries(
          pokemonData.abilities.map(({ ability }, index) => [
            ability.name,
            resolveLocalizedResourceName(abilityResources[index], locale, ability.name),
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
          pokemonData.sprites.front_default ||
          formData.sprites?.front_default ||
          null

        const shinyImage =
          pokemonData.sprites.other?.['official-artwork']?.front_shiny ||
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

/*
 * Imagen de alta resolución para objetos.
 *
 * Scarlet/Violet utiliza imágenes de 256x256 px
 * dentro del repositorio oficial de sprites de PokeAPI.
 */
function getItemImageUrl(name) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/gen9/scarlet-violet/${name}.png`
}

const itemCategoryCache = new Map()

/*
 * Devuelve la entrada localizada de una lista tipo
 * names / flavor_text_entries / effect_entries.
 *
 * Prioridad: locale exacto → es (si locale empieza por "es") → en →
 * cualquier entrada disponible (última versión) → null.
 *
 * Si hay varias entradas para el mismo idioma (p. ej. flavor_text por
 * versión), se queda con la última (versión más reciente).
 */
function getLocalizedEntry(entries, locale) {
  if (!Array.isArray(entries) || entries.length === 0) return null

  const candidates = [...entries].reverse()
  const exact = candidates.find((e) => e.language?.name === locale)
  if (exact) return exact

  if (locale.startsWith('es')) {
    const es = candidates.find((e) => e.language?.name === 'es')
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
 *
 * Usado para detectar descripción === efecto cuando PokeAPI repite
 * el mismo contenido en ambos campos.
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
 * Se usa como fallback cuando no hay traducción de categoría, para
 * mantener capitalización consistente con formatName() en componentes.
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
 *
 * PokeAPI ha cambiado del campo legacy `cost` a `prices[]` con precios
 * por versión. Si `cost` es válido lo usa; sino busca el último
 * `purchase_price` útil en prices. Si no hay nada útil devuelve null.
 */
function getItemCost(data) {
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

  return null
}

/*
 * Obtiene el nombre localizado de una categoría (fetchea category.url).
 * Devuelve { name, lang } para poder determinar si el resultado está
 * realmente en el idioma solicitado o es un fallback.
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
  if (locale.startsWith('es') && entryLang === 'es') return true
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

  const nameEntry = getLocalizedEntry(data.names, locale)
  const localizedName = nameEntry?.name || data.name

  /*
   * DESCRIPCIÓN  ←  flavor_text_entries (SIEMPRE, nunca effect_entries)
   */
  const flavorEntry = getLocalizedEntry(data.flavor_text_entries, locale)
  const description = cleanItemText(flavorEntry?.text)

  /*
   * EFECTO  ←  effect_entries.short_effect || effect_entries.effect (SIEMPRE)
   */
  const effectEntry = getLocalizedEntry(data.effect_entries, locale)
  const effect = cleanItemText(
    effectEntry?.short_effect || effectEntry?.effect,
  )

  /*
   * Detección de duplicado para que la UI no repita el mismo texto.
   * getItem() NUNCA elimina campos: devuelve ambos + el flag.
   */
  const hasDuplicateText = Boolean(
    description &&
      effect &&
      normalizeComparisonText(description) ===
        normalizeComparisonText(effect),
  )

  // Categoría: si PokeAPI no la tradujo al locale del usuario,
  // humanizamos el slug para mantener la consistencia visual.
  const categoryMeta = await getItemCategoryMeta(data.category?.url, locale)
  const categoryIsLocalized = entryLanguageMatches(categoryMeta.lang, locale)

  let category
  if (categoryIsLocalized && categoryMeta.name) {
    category = categoryMeta.name
  } else if (categoryMeta.name) {
    if (locale === 'en' || locale.startsWith('fr')) {
      category = categoryMeta.name
    } else {
      category = humanizeSlug(data.category?.name || '')
    }
  } else {
    category = humanizeSlug(data.category?.name || '')
  }

  const cost = getItemCost(data)

  return {
    id: data.id,
    name: data.name,
    localizedName,

    // Imagen grande de Scarlet/Violet.
    image: getItemImageUrl(data.name),

    // Sprite original de PokeAPI para usar como fallback.
    fallbackImage: data.sprites.default,

    category,
    cost,

    // Campos de texto: independientes, nunca se mezclan.
    description,
    effect,
    hasDuplicateText,
  }
}

export async function getItems({
  limit = 24,
  offset = 0,
  locale = 'en',
  messages = {},
} = {}) {
  const cacheKey = `${locale}:${limit}:${offset}`

  if (itemPageCache.has(cacheKey)) {
    return itemPageCache.get(cacheKey)
  }

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

  const items = await Promise.all(
    data.results.map(({ name }) =>
      getItem(name, locale, messages),
    ),
  )

  const result = {
    items,
    nextOffset: data.next ? offset + limit : null,
  }

  itemPageCache.set(cacheKey, result)

  return result
}

const evolutionChainCache = new Map()
const evolutionPokemonCache = new Map()

const itemTranslationsEs = {
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
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

    const shinyImage =
      pokemonData?.sprites?.other?.['official-artwork']?.front_shiny ||
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


