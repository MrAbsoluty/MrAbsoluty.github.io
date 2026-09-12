import { supabase, isSupabaseConfigured } from './supabase'

const PROFILE_FIELDS = 'id, username, username_normalized, avatar_url, bio, featured_pokemon, profile_visibility, favorites_visibility, follow_list_visibility, created_at, updated_at'

function client() {
  if (!supabase || !isSupabaseConfigured) {
    return null
  }
  return supabase
}

/**
 * Normaliza y limpia una consulta de búsqueda de usuario por username.
 */
function sanitizeUsernameQuery(query) {
  return (query || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/[%_,()]/g, '')
    .toLowerCase()
}

/**
 * Busca perfiles por username (case-insensitive, omitiendo emails y UUIDs).
 */
export async function searchUsers(query, currentUserId = null) {
  const term = sanitizeUsernameQuery(query)
  if (term.length < 2) return []

  const sb = client()
  if (!sb) return []

  try {
    let queryBuilder = sb
      .from('profiles')
      .select('id, username, avatar_url, bio, profile_visibility')
      .ilike('username', `%${term}%`)
      .limit(10)

    if (currentUserId) {
      queryBuilder = queryBuilder.neq('id', currentUserId)
    }

    const { data, error } = await queryBuilder
    if (error) {
      if (error.code === 'PGRST205') return []
      console.warn('[Social] Error en búsqueda de usuarios:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Social] Excepción en searchUsers:', err)
    return []
  }
}

/**
 * Consulta el perfil completo de un usuario por su @username, calculando
 * dinámicamente los contadores de Seguidores, Siguiendo y Favoritos,
 * además del estado de seguimiento relativo al usuario espectador.
 */
export async function getProfileByUsername(rawUsername, currentUserId = null) {
  const normalized = sanitizeUsernameQuery(rawUsername)
  if (!normalized) return null

  const sb = client()
  if (!sb) return null

  try {
    // 1. Obtener datos base del perfil
    const { data: profile, error } = await sb
      .from('profiles')
      .select(PROFILE_FIELDS)
      .or(`username_normalized.eq.${normalized},username.ilike.${normalized}`)
      .maybeSingle()

    if (error) {
      // Fallback si algunas columnas nuevas aún no se han aplicado con la migración
      if (error.code === '42703' || error.message?.includes('column')) {
        const fallback = await sb
          .from('profiles')
          .select('id, username, avatar_url, created_at')
          .or(`username_normalized.eq.${normalized},username.ilike.${normalized}`)
          .maybeSingle()

        if (!fallback.error && fallback.data) {
          return decorateProfileWithCounts(fallback.data, currentUserId)
        }
      }
      console.warn('[Social] Error cargando perfil por username:', error.message)
      return null
    }

    if (!profile) return null

    return decorateProfileWithCounts(profile, currentUserId)
  } catch (err) {
    console.error('[Social] Excepción en getProfileByUsername:', err)
    return null
  }
}

/**
 * Consulta un perfil por su UUID.
 */
export async function getProfileById(userId, currentUserId = null) {
  if (!userId) return null
  const sb = client()
  if (!sb) return null

  try {
    const { data: profile, error } = await sb
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        const fallback = await sb
          .from('profiles')
          .select('id, username, avatar_url, created_at')
          .eq('id', userId)
          .maybeSingle()

        if (!fallback.error && fallback.data) {
          return decorateProfileWithCounts(fallback.data, currentUserId)
        }
      }
      return null
    }

    if (!profile) return null

    return decorateProfileWithCounts(profile, currentUserId)
  } catch (err) {
    console.error('[Social] Excepción en getProfileById:', err)
    return null
  }
}

/**
 * Añade contadores dinámicos y estado de relación relativo a currentUserId.
 */
async function decorateProfileWithCounts(profile, currentUserId) {
  const sb = client()
  const isOwner = Boolean(currentUserId && profile.id === currentUserId)

  let followersCount = 0
  let followingCount = 0
  let favoritesCount = 0
  let followStatus = isOwner ? 'self' : 'none' // 'none' | 'pending' | 'accepted' | 'self'
  let followRelationId = null

  if (!sb) {
    return {
      ...profile,
      profile_visibility: profile.profile_visibility || 'public',
      favorites_visibility: profile.favorites_visibility || 'public',
      follow_list_visibility: profile.follow_list_visibility || 'public',
      bio: profile.bio || '',
      featured_pokemon: profile.featured_pokemon || 'charizard',
      followersCount,
      followingCount,
      favoritesCount,
      followStatus,
      followRelationId,
      isOwner,
    }
  }

  try {
    // 1. Contar seguidores (following_id = profile.id AND status = 'accepted')
    const { count: fCount, error: fErr } = await sb
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id)
      .eq('status', 'accepted')

    if (!fErr && typeof fCount === 'number') {
      followersCount = fCount
    }

    // 2. Contar siguiendo (follower_id = profile.id AND status = 'accepted')
    const { count: ingCount, error: ingErr } = await sb
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id)
      .eq('status', 'accepted')

    if (!ingErr && typeof ingCount === 'number') {
      followingCount = ingCount
    }

    // 3. Contar favoritos desde user_favorites
    const { count: favCount, error: favErr } = await sb
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    if (!favErr && typeof favCount === 'number') {
      favoritesCount = favCount
    }

    // 4. Determinar estado de seguimiento si hay un visitante autenticado distinto al dueño
    if (currentUserId && !isOwner) {
      const { data: rel, error: relErr } = await sb
        .from('follows')
        .select('id, status')
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
        .maybeSingle()

      if (!relErr && rel) {
        followStatus = rel.status // 'accepted' o 'pending'
        followRelationId = rel.id
      }
    }
  } catch (err) {
    console.warn('[Social] Error al calcular contadores dinámicos:', err)
  }

  return {
    ...profile,
    profile_visibility: profile.profile_visibility || 'public',
    favorites_visibility: profile.favorites_visibility || 'public',
    follow_list_visibility: profile.follow_list_visibility || 'public',
    bio: profile.bio || '',
    featured_pokemon: profile.featured_pokemon || 'charizard',
    followersCount,
    followingCount,
    favoritesCount,
    followStatus,
    followRelationId,
    isOwner,
  }
}

/**
 * Seguir a un usuario:
 * - Si el perfil objetivo es 'private', crea la relación con status = 'pending'.
 * - Si el perfil objetivo es 'public', crea la relación con status = 'accepted'.
 * - Controla a nivel de BD e interfaz la restricción de no auto-seguirse.
 */
export async function followUser(targetUserId, currentUserId) {
  if (!currentUserId) throw new Error('Debes iniciar sesión para seguir a un entrenador.')
  if (targetUserId === currentUserId) throw new Error('No puedes seguirte a ti mismo.')

  const sb = client()
  if (!sb) throw new Error('Supabase no está configurado.')

  // Consultar visibilidad del perfil objetivo
  const { data: targetProfile, error: pErr } = await sb
    .from('profiles')
    .select('profile_visibility')
    .eq('id', targetUserId)
    .maybeSingle()

  if (pErr && pErr.code !== '42703') {
    throw pErr
  }

  const isPrivate = targetProfile?.profile_visibility === 'private'
  const targetStatus = isPrivate ? 'pending' : 'accepted'

  const { data, error } = await sb
    .from('follows')
    .insert([
      {
        follower_id: currentUserId,
        following_id: targetUserId,
        status: targetStatus,
      },
    ])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Ya existe el registro
      return { success: true, alreadyFollowed: true, status: targetStatus }
    }
    if (error.code === '23514') {
      throw new Error('No puedes seguirte a ti mismo.')
    }
    throw error
  }

  return { success: true, follow: data, status: targetStatus }
}

/**
 * Dejar de seguir a un usuario o cancelar solicitud pendiente.
 */
export async function unfollowUser(targetUserId, currentUserId) {
  if (!currentUserId) throw new Error('No hay usuario autenticado.')

  const sb = client()
  if (!sb) throw new Error('Supabase no está configurado.')

  const { error } = await sb
    .from('follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)

  if (error) throw error
  return { success: true }
}

/**
 * Aceptar una solicitud de seguimiento pendiente (solo el receptor).
 */
export async function acceptFollowRequest(followId, currentUserId) {
  if (!currentUserId) throw new Error('No hay usuario autenticado.')

  const sb = client()
  if (!sb) throw new Error('Supabase no está configurado.')

  const { error } = await sb
    .from('follows')
    .update({ status: 'accepted' })
    .eq('id', followId)
    .eq('following_id', currentUserId)

  if (error) throw error
  return { success: true }
}

/**
 * Rechazar una solicitud de seguimiento (elimina el registro).
 */
export async function rejectFollowRequest(followId, currentUserId) {
  if (!currentUserId) throw new Error('No hay usuario autenticado.')

  const sb = client()
  if (!sb) throw new Error('Supabase no está configurado.')

  const { error } = await sb
    .from('follows')
    .delete()
    .eq('id', followId)
    .eq('following_id', currentUserId)

  if (error) throw error
  return { success: true }
}

/**
 * Obtener la lista de Seguidores de un usuario:
 * - Registros donde following_id = targetUserId AND status = 'accepted'.
 * - Incluye datos del perfil seguidor y si el usuario espectador actual lo sigue.
 */
export async function getFollowers(targetUserId, currentUserId = null) {
  if (!targetUserId) return []
  const sb = client()
  if (!sb) return []

  try {
    const { data, error } = await sb
      .from('follows')
      .select(`
        id,
        created_at,
        follower:profiles!follows_follower_id_fkey(
          id,
          username,
          avatar_url,
          bio,
          profile_visibility
        )
      `)
      .eq('following_id', targetUserId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') return []
      console.warn('[Social] Error cargando seguidores:', error.message)
      return []
    }

    const followersList = (data || [])
      .map((item) => item.follower)
      .filter(Boolean)

    // Si hay un usuario conectado, verificar a quiénes de estos sigue él
    if (currentUserId && followersList.length > 0) {
      const ids = followersList.map((f) => f.id)
      const { data: myFollows } = await sb
        .from('follows')
        .select('following_id, status')
        .eq('follower_id', currentUserId)
        .in('following_id', ids)

      const followMap = new Map((myFollows || []).map((m) => [m.following_id, m.status]))

      return followersList.map((f) => ({
        ...f,
        isSelf: f.id === currentUserId,
        followStatus: f.id === currentUserId ? 'self' : followMap.get(f.id) || 'none',
      }))
    }

    return followersList.map((f) => ({
      ...f,
      isSelf: false,
      followStatus: 'none',
    }))
  } catch (err) {
    console.error('[Social] Excepción en getFollowers:', err)
    return []
  }
}

/**
 * Obtener la lista de usuarios que sigue un usuario (Siguiendo):
 * - Registros donde follower_id = targetUserId AND status = 'accepted'.
 */
export async function getFollowing(targetUserId, currentUserId = null) {
  if (!targetUserId) return []
  const sb = client()
  if (!sb) return []

  try {
    const { data, error } = await sb
      .from('follows')
      .select(`
        id,
        created_at,
        following:profiles!follows_following_id_fkey(
          id,
          username,
          avatar_url,
          bio,
          profile_visibility
        )
      `)
      .eq('follower_id', targetUserId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') return []
      console.warn('[Social] Error cargando seguidos:', error.message)
      return []
    }

    const followingList = (data || [])
      .map((item) => item.following)
      .filter(Boolean)

    if (currentUserId && followingList.length > 0) {
      const ids = followingList.map((f) => f.id)
      const { data: myFollows } = await sb
        .from('follows')
        .select('following_id, status')
        .eq('follower_id', currentUserId)
        .in('following_id', ids)

      const followMap = new Map((myFollows || []).map((m) => [m.following_id, m.status]))

      return followingList.map((f) => ({
        ...f,
        isSelf: f.id === currentUserId,
        followStatus: f.id === currentUserId ? 'self' : followMap.get(f.id) || 'none',
      }))
    }

    return followingList.map((f) => ({
      ...f,
      isSelf: false,
      followStatus: 'none',
    }))
  } catch (err) {
    console.error('[Social] Excepción en getFollowing:', err)
    return []
  }
}

/**
 * Obtener solicitudes de seguimiento pendientes recibidas por el dueño del perfil.
 */
export async function getPendingRequests(userId) {
  if (!userId) return []
  const sb = client()
  if (!sb) return []

  try {
    const { data, error } = await sb
      .from('follows')
      .select(`
        id,
        created_at,
        status,
        follower:profiles!follows_follower_id_fkey(
          id,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('following_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') return []
      console.warn('[Social] Error cargando solicitudes pendientes:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Social] Excepción en getPendingRequests:', err)
    return []
  }
}

/**
 * Actualizar configuraciones de privacidad del perfil.
 */
export async function updatePrivacySettings(userId, { profile_visibility, favorites_visibility, follow_list_visibility }) {
  if (!userId) throw new Error('No hay usuario autenticado.')
  const sb = client()
  if (!sb) throw new Error('Supabase no está configurado.')

  const updates = {}
  if (['public', 'private'].includes(profile_visibility)) {
    updates.profile_visibility = profile_visibility
  }
  if (['public', 'followers', 'private'].includes(favorites_visibility)) {
    updates.favorites_visibility = favorites_visibility
  }
  if (['public', 'private'].includes(follow_list_visibility)) {
    updates.follow_list_visibility = follow_list_visibility
  }

  const { data, error } = await sb
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return { success: true, profile: data }
}

/**
 * Actualizar detalles públicos del perfil (bio, pokemon principal).
 */
export async function updateProfileDetails(userId, { bio, featured_pokemon }) {
  if (!userId) throw new Error('No hay usuario autenticado.')
  const sb = client()
  if (!sb) throw new Error('Supabase no está configurado.')

  const updates = {}
  if (typeof bio === 'string') {
    updates.bio = bio.slice(0, 250).trim()
  }
  if (typeof featured_pokemon === 'string') {
    updates.featured_pokemon = featured_pokemon.trim().toLowerCase()
  }

  const { data, error } = await sb
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return { success: true, profile: data }
}

/**
 * Obtener los Pokémon favoritos de un usuario desde la BD Supabase,
 * aplicando las restricciones RLS y de visibilidad.
 */
export async function getUserFavorites(targetUserId) {
  if (!targetUserId) return []
  const sb = client()
  if (!sb) return []

  try {
    const { data, error } = await sb
      .from('user_favorites')
      .select('id, pokemon_id, pokemon_name, added_at')
      .eq('user_id', targetUserId)
      .order('added_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') return []
      console.warn('[Social] Error al consultar favoritos de usuario:', error.message)
      return []
    }

    return (data || []).map((fav) => ({
      id: fav.pokemon_id,
      name: fav.pokemon_name,
      addedAt: fav.added_at,
    }))
  } catch (err) {
    console.error('[Social] Excepción en getUserFavorites:', err)
    return []
  }
}

/**
 * Sincroniza la lista de favoritos de localStorage con Supabase para el usuario autenticado.
 */
export async function syncFavoritesToSupabase(userId, favoritesList) {
  if (!userId || !Array.isArray(favoritesList)) return
  const sb = client()
  if (!sb) return

  try {
    const rows = favoritesList
      .filter((f) => f && (f.id || f.name))
      .map((f) => ({
        user_id: userId,
        pokemon_id: typeof f.id === 'number' ? f.id : null,
        pokemon_name: (f.name || String(f.id)).toLowerCase(),
        added_at: typeof f.addedAt === 'number' ? f.addedAt : Date.now(),
      }))

    if (rows.length === 0) return

    // Insertar con upsert ignorando duplicados
    const { error } = await sb
      .from('user_favorites')
      .upsert(rows, { onConflict: 'user_id, pokemon_name', ignoreDuplicates: true })

    if (error && error.code !== 'PGRST205') {
      console.warn('[Social] Error sincronizando favoritos a Supabase:', error.message)
    }
  } catch (err) {
    console.warn('[Social] Excepción sincronizando favoritos:', err)
  }
}

/**
 * Agrega un favorito a la tabla user_favorites en Supabase.
 */
export async function addFavoriteToSupabase(userId, pokemon) {
  if (!userId || !pokemon) return
  const sb = client()
  if (!sb) return

  try {
    const name = (pokemon.name || String(pokemon.id)).toLowerCase()
    const pokemonId = typeof pokemon.id === 'number' ? pokemon.id : null

    await sb
      .from('user_favorites')
      .upsert(
        [
          {
            user_id: userId,
            pokemon_id: pokemonId,
            pokemon_name: name,
            added_at: Date.now(),
          },
        ],
        { onConflict: 'user_id, pokemon_name' }
      )
  } catch {
    // Silencioso
  }
}

/**
 * Elimina un favorito de la tabla user_favorites en Supabase.
 */
export async function removeFavoriteFromSupabase(userId, pokemonOrName) {
  if (!userId || !pokemonOrName) return
  const sb = client()
  if (!sb) return

  try {
    const name = (typeof pokemonOrName === 'string' ? pokemonOrName : pokemonOrName.name || '').toLowerCase()
    if (!name) return

    await sb
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('pokemon_name', name)
  } catch {
    // Silencioso
  }
}

/**
 * Arquitectura preparada para futuras funciones de mensajería / chat.
 */
export async function getConversation(userId, otherUserId) {
  const sb = client()
  if (!sb || !userId || !otherUserId) return []
  try {
    const { data, error } = await sb
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at')
      .limit(100)
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function sendMessage(receiver_id, content) {
  const sb = client()
  if (!sb) return
  const text = content?.trim()
  if (!text) return
  try {
    await sb.from('messages').insert({ receiver_id, content: text })
  } catch {
    // Silencioso
  }
}

export async function getRecentConversations(userId) {
  const sb = client()
  if (!sb || !userId) return []
  try {
    const { data, error } = await sb
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function markConversationAsRead(userId, otherUserId) {
  const sb = client()
  if (!sb || !userId || !otherUserId) return
  try {
    await sb
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
      .is('read_at', null)
  } catch {
    // Silencioso
  }
}

export async function getUnreadSenderIds(userId) {
  const sb = client()
  if (!sb || !userId) return []
  try {
    const { data, error } = await sb
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .is('read_at', null)
    if (error) return []
    return [...new Set((data || []).map((m) => m.sender_id))]
  } catch {
    return []
  }
}

/**
 * Compatible stub para FloatingChat: conecta con la lista de usuarios seguidos.
 */
export async function getRelationships(userId) {
  if (!userId) return []
  try {
    const following = await getFollowing(userId, userId)
    return following.map((f) => ({
      id: f.id,
      requester_id: userId,
      recipient_id: f.id,
      status: 'accepted',
      recipient: f,
      requester: { id: userId },
    }))
  } catch {
    return []
  }
}
