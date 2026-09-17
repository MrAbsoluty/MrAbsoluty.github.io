import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { supabase } from '../services/supabase.js'
import {
  addFavoriteToSupabase,
  removeFavoriteFromSupabase,
  syncFavoritesToSupabase,
  getUserFavorites,
  GRAMITOS_CANONICAL_FAVORITES,
} from '../services/social.js'
import {
  cleanPokemonSlug,
  POKEMON_ID_TO_SLUG,
  POKEMON_SLUG_TO_ID,
} from '../utils/pokemonNames.js'

const LEGACY_STORAGE_KEY = 'pokeguide-favorites'
const LAST_VIEWED_KEY = 'pokeguide-favorites-last-viewed'

export const MR_GRAMITOS_ID = 'b3bdfa84-2188-4b9a-a70c-1db4f07815d7'
export const MR_ABSOLUTY_ID = 'b08dfadd-0c8c-4104-b4ef-5761070dcbc4'

export function getFavoritesStorageKey(userId) {
  if (userId) return `pokeguide-favorites_${userId}`
  return 'pokeguide-favorites_guest'
}

export const FavoritesContext = createContext(null)
export { normalizePokemonForFavorite } from '../utils/pokemonNames'
import { normalizePokemonForFavorite } from '../utils/pokemonNames'

function loadInitialFavorites(userId) {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    // MrAbsoluty nunca debe tener favoritos cargados desde almacenamiento local
    if (userId === MR_ABSOLUTY_ID) return []

    const key = getFavoritesStorageKey(userId)
    let raw = window.localStorage.getItem(key)

    // Si no existe la clave individual pero es MrGramitos o invitado, verificar clave legada
    if (!raw) {
      if (userId === MR_GRAMITOS_ID || !userId) {
        raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
      }
    }

    if (!raw) {
      if (userId === MR_GRAMITOS_ID) {
        return GRAMITOS_CANONICAL_FAVORITES.map((f, i) => ({
          id: f.id,
          name: f.name,
          addedAt: Date.now() - i * 1000,
        }))
      }
      return []
    }

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const seen = new Set()
      const list = []
      for (const item of parsed) {
        if (!item) continue
        const norm = normalizePokemonForFavorite(item)
        if (!norm) continue
        const mapKey = (norm.id ? String(norm.id) : norm.name).toLowerCase()
        if (seen.has(mapKey)) continue
        seen.add(mapKey)
        list.push({
          id: norm.id,
          name: norm.name,
          addedAt: typeof item?.addedAt === 'number' ? item.addedAt : Date.now(),
        })
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
  const [favorites, setFavorites] = useState(() => loadInitialFavorites(user?.id))
  const [lastViewedTime, setLastViewedTime] = useState(loadInitialLastViewed)

  // Sincronizar con eventos de almacenamiento externo (otras pestañas)
  useEffect(() => {
    function handleStorage(e) {
      const activeKey = getFavoritesStorageKey(user?.id)
      if (e.key === activeKey || e.key === LEGACY_STORAGE_KEY) {
        setFavorites(loadInitialFavorites(user?.id))
      }
      if (e.key === LAST_VIEWED_KEY) {
        setLastViewedTime(loadInitialLastViewed())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [user?.id])

  // Sincronizar con Supabase y aislar datos cuando el usuario cambia
  useEffect(() => {
    let isMounted = true

    async function handleUserSync() {
      // 1. Caso: Cuenta secundaria MrAbsoluty conectada
      // Purgar los favoritos filtrados accidentalmente de la base de datos y de localStorage
      if (user?.id === MR_ABSOLUTY_ID) {
        setFavorites([])
        try {
          window.localStorage.removeItem(getFavoritesStorageKey(MR_ABSOLUTY_ID))
          window.localStorage.removeItem(LEGACY_STORAGE_KEY)
          if (supabase) {
            await supabase.from('user_favorites').delete().eq('user_id', MR_ABSOLUTY_ID)
          }
        } catch (e) {
          console.warn('[FavoritesContext] Error limpiando favoritos de MrAbsoluty:', e)
        }
        return
      }

      // 2. Caso: Usuario no autenticado (invitado)
      if (!user?.id) {
        const guestFavs = loadInitialFavorites(null)
        if (isMounted) setFavorites(guestFavs)
        return
      }

      // 3. Caso: Usuario autenticado (ej: MrGramitos u otro)
      try {
        const remoteFavorites = await getUserFavorites(user.id)
        if (!isMounted) return

        const localFavs = loadInitialFavorites(user.id)
        const combinedMap = new Map()

        // Prioridad: favoritos canónicos de MrGramitos si no hay nada
        if (user.id === MR_GRAMITOS_ID && remoteFavorites.length === 0 && localFavs.length === 0) {
          GRAMITOS_CANONICAL_FAVORITES.forEach((item, i) => {
            combinedMap.set(String(item.id), {
              id: item.id,
              name: item.name,
              addedAt: Date.now() - (i * 1000),
            })
          })
        } else {
          // Agregar favoritos locales deduplicados
          localFavs.forEach((item) => {
            const norm = normalizePokemonForFavorite(item)
            if (!norm) return
            const key = (norm.id ? String(norm.id) : norm.name).toLowerCase()
            combinedMap.set(key, {
              id: norm.id,
              name: norm.name,
              addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
            })
          })

          // Combinar con remotos
          remoteFavorites.forEach((item) => {
            const norm = normalizePokemonForFavorite(item)
            if (!norm) return
            const key = (norm.id ? String(norm.id) : norm.name).toLowerCase()
            if (!combinedMap.has(key)) {
              combinedMap.set(key, {
                id: norm.id,
                name: norm.name,
                addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
              })
            }
          })
        }

        const mergedList = Array.from(combinedMap.values())
        setFavorites(mergedList)

        // Guardar en la clave aislada del usuario
        try {
          const userKey = getFavoritesStorageKey(user.id)
          window.localStorage.setItem(userKey, JSON.stringify(mergedList))
          // Limpiar clave legada si este era MrGramitos
          if (user.id === MR_GRAMITOS_ID) {
            window.localStorage.removeItem(LEGACY_STORAGE_KEY)
          }
        } catch {
          // Silencioso
        }

        // Subir a Supabase con RLS del usuario conectado
        await syncFavoritesToSupabase(user.id, mergedList)
      } catch (err) {
        console.warn('[FavoritesContext] Error sincronizando con Supabase:', err)
      }
    }

    handleUserSync()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  function saveFavorites(nextFavorites) {
    const seen = new Set()
    const deduplicated = []
    for (const item of nextFavorites) {
      const norm = normalizePokemonForFavorite(item)
      if (!norm) continue
      const mapKey = (norm.id ? String(norm.id) : norm.name).toLowerCase()
      if (seen.has(mapKey)) continue
      seen.add(mapKey)
      deduplicated.push(item)
    }

    setFavorites(deduplicated)
    try {
      const key = getFavoritesStorageKey(user?.id)
      window.localStorage.setItem(key, JSON.stringify(deduplicated))
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
