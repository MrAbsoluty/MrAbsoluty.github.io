import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  addFavoriteToSupabase,
  removeFavoriteFromSupabase,
  syncFavoritesToSupabase,
  getUserFavorites,
} from '../services/social'
import {
  cleanPokemonSlug,
  POKEMON_ID_TO_SLUG,
  POKEMON_SLUG_TO_ID,
} from '../utils/pokemonNames'

const FAVORITES_STORAGE_KEY = 'pokeguide-favorites'
const LAST_VIEWED_KEY = 'pokeguide-favorites-last-viewed'

export const FavoritesContext = createContext(null)
export { normalizePokemonForFavorite } from '../utils/pokemonNames'
import { normalizePokemonForFavorite } from '../utils/pokemonNames'

function loadInitialFavorites() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      let hasRepaired = false
      const list = parsed
        .filter((item) => item && (typeof item.id === 'number' || typeof item.name === 'string'))
        .map((item) => {
          const norm = normalizePokemonForFavorite(item)
          const repairedName = norm?.name || (item.name || '').toLowerCase()
          const repairedId = norm?.id || item.id || null
          if (repairedName !== item.name || repairedId !== item.id) {
            hasRepaired = true
          }
          return {
            id: repairedId,
            name: repairedName,
            addedAt: typeof item.addedAt === 'number' ? item.addedAt : 0,
          }
        })

      if (hasRepaired) {
        try {
          window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list))
        } catch {
          // Silencioso
        }
      }
      return list
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
  const { user } = useAuth()
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

  // Sincronizar con Supabase cuando el usuario inicia sesión
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    async function syncWithRemote() {
      try {
        const remoteFavorites = await getUserFavorites(user.id)
        if (!isMounted) return

        // Combinar favoritos remotos con locales existentes sin duplicados y normalizados
        const local = loadInitialFavorites()
        const combinedMap = new Map()

        // Primero agregar locales normalizados
        local.forEach((item) => {
          const norm = normalizePokemonForFavorite(item)
          if (!norm) return
          const itemKey = (norm.id ? String(norm.id) : norm.name).toLowerCase()
          combinedMap.set(itemKey, {
            id: norm.id,
            name: norm.name,
            addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
          })
        })

        // Luego agregar o actualizar con remotos normalizados
        remoteFavorites.forEach((item) => {
          const norm = normalizePokemonForFavorite(item)
          if (!norm) return
          const itemKey = (norm.id ? String(norm.id) : norm.name).toLowerCase()
          if (!combinedMap.has(itemKey)) {
            combinedMap.set(itemKey, {
              id: norm.id,
              name: norm.name,
              addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
            })
          }
        })

        const mergedList = Array.from(combinedMap.values())
        setFavorites(mergedList)
        try {
          window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(mergedList))
        } catch {
          // Silencioso
        }

        // Subir a Supabase cualquier favorito que estuviese en local
        await syncFavoritesToSupabase(user.id, mergedList)
      } catch (err) {
        console.warn('[FavoritesContext] Error sincronizando con Supabase:', err)
      }
    }

    syncWithRemote()

    return () => {
      isMounted = false
    }
  }, [user?.id])

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

    const nextFavorites = [newItem, ...favorites]
    saveFavorites(nextFavorites)

    if (user?.id) {
      addFavoriteToSupabase(user.id, newItem)
    }
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

    if (user?.id) {
      removeFavoriteFromSupabase(user.id, target)
    }
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
