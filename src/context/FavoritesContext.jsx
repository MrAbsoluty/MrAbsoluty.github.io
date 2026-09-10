import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const FAVORITES_STORAGE_KEY = 'pokeguide-favorites'
const LAST_VIEWED_KEY = 'pokeguide-favorites-last-viewed'

export const FavoritesContext = createContext(null)

/**
 * Normaliza cualquier objeto Pokémon o referencia (incluso Megaevoluciones,
 * Formas Regionales o Shiny) para identificar inequívocamente al Pokémon base.
 */
export function normalizePokemonForFavorite(pokemon) {
  if (!pokemon) return null

  if (typeof pokemon === 'number') {
    return { id: pokemon, name: String(pokemon) }
  }

  if (typeof pokemon === 'string') {
    const parsed = parseInt(pokemon, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return { id: parsed, name: String(parsed) }
    }
    const cleanName = pokemon.toLowerCase().trim().split('-')[0]
    return { id: null, name: cleanName }
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

  // 3. Extraer nombre canónico base (eliminando sufijos como -alola, -galar, -hisui, -mega, -mega-x, etc.)
  const rawName = (pokemon.species?.name || pokemon.apiName || pokemon.name || '').toLowerCase()
  const baseName = rawName.split('-')[0] || rawName

  return {
    id: baseId || pokemon.id || null,
    name: baseName || rawName,
  }
}

function loadInitialFavorites() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && (typeof item.id === 'number' || typeof item.name === 'string'))
        .map((item) => ({
          id: item.id || null,
          name: (item.name || '').toLowerCase(),
          addedAt: typeof item.addedAt === 'number' ? item.addedAt : 0,
        }))
    }
    return []
  } catch (err) {
    console.warn('Error leyendo favoritos desde localStorage:', err)
    return []
  }
}

function loadInitialLastViewed() {
  if (typeof window === 'undefined' || !window.localStorage) return Date.now()
  try {
    const raw = window.localStorage.getItem(LAST_VIEWED_KEY)
    if (raw) {
      const parsed = parseInt(raw, 10)
      if (!Number.isNaN(parsed) && parsed > 0) return parsed
    }
    const now = Date.now()
    window.localStorage.setItem(LAST_VIEWED_KEY, String(now))
    return now
  } catch {
    return Date.now()
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(loadInitialFavorites)
  const [lastViewedTime, setLastViewedTime] = useState(loadInitialLastViewed)

  // Sincronizar con eventos de almacenamiento externo (otras pestañas)
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === FAVORITES_STORAGE_KEY) {
        setFavorites(loadInitialFavorites())
      }
      if (e.key === LAST_VIEWED_KEY) {
        setLastViewedTime(loadInitialLastViewed())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function saveFavorites(nextFavorites) {
    setFavorites(nextFavorites)
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(nextFavorites),
      )
    } catch (err) {
      console.error('Error guardando favoritos en localStorage:', err)
    }
  }

  const markFavoritesAsSeen = useCallback(() => {
    const now = Date.now()
    setLastViewedTime(now)
    try {
      window.localStorage.setItem(LAST_VIEWED_KEY, String(now))
    } catch (err) {
      console.error('Error guardando timestamp de favoritos vistos:', err)
    }
  }, [])

  function isFavorite(pokemonOrId) {
    const target = normalizePokemonForFavorite(pokemonOrId)
    if (!target) return false

    return favorites.some((f) => {
      if (target.id && f.id && target.id === f.id) return true
      if (target.name && f.name && target.name.toLowerCase() === f.name.toLowerCase()) return true
      return false
    })
  }

  function addFavorite(pokemon) {
    const target = normalizePokemonForFavorite(pokemon)
    if (!target || (!target.id && !target.name)) return

    if (isFavorite(target)) return

    const newItem = {
      id: target.id,
      name: target.name,
      addedAt: Date.now(),
    }

    saveFavorites([newItem, ...favorites])
  }

  function removeFavorite(pokemonOrId) {
    const target = normalizePokemonForFavorite(pokemonOrId)
    if (!target) return

    const filtered = favorites.filter((f) => {
      if (target.id && f.id && target.id === f.id) return false
      if (target.name && f.name && target.name.toLowerCase() === f.name.toLowerCase()) return false
      return true
    })

    saveFavorites(filtered)
  }

  function toggleFavorite(pokemon) {
    if (isFavorite(pokemon)) {
      removeFavorite(pokemon)
      return false
    } else {
      addFavorite(pokemon)
      return true
    }
  }

  const unseenCount = favorites.filter(
    (f) => typeof f.addedAt === 'number' && f.addedAt > lastViewedTime,
  ).length

  const value = {
    favorites,
    favoritesCount: favorites.length,
    unseenCount,
    markFavoritesAsSeen,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavorites: () => favorites,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites debe utilizarse dentro de un FavoritesProvider')
  }
  return context
}
