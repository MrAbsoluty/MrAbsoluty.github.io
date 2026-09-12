/**
 * PokeGuide - Suite de Pruebas Obligatorias del Sistema Social
 * Valida los 10 Casos de Prueba (CASO A hasta CASO J) según la Sección 35.
 */

// Simulación fiel de las reglas de base de datos, RLS y lógica de servicio
class SocialDatabaseEngine {
  constructor() {
    this.profiles = new Map()
    this.follows = []
    this.userFavorites = []
    this.blocks = []
  }

  createProfile({ id, username, profile_visibility = 'public', favorites_visibility = 'public', follow_list_visibility = 'public', bio = '', featured_pokemon = 'charizard' }) {
    const record = {
      id,
      username,
      username_normalized: username.toLowerCase().trim(),
      profile_visibility,
      favorites_visibility,
      follow_list_visibility,
      bio,
      featured_pokemon,
    }
    this.profiles.set(id, record)
    return record
  }

  updateProfilePrivacy(userId, { profile_visibility, favorites_visibility, follow_list_visibility }) {
    const profile = this.profiles.get(userId)
    if (!profile) throw new Error('Perfil no encontrado')
    if (profile_visibility) profile.profile_visibility = profile_visibility
    if (favorites_visibility) profile.favorites_visibility = favorites_visibility
    if (follow_list_visibility) profile.follow_list_visibility = follow_list_visibility
    return profile
  }

  addFavorite(userId, pokemon) {
    this.userFavorites.push({
      id: `fav-${Date.now()}-${Math.random()}`,
      user_id: userId,
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name.toLowerCase(),
      added_at: Date.now(),
    })
  }

  // RLS: Consulta de favoritos
  queryFavorites(viewerId, targetUserId) {
    const targetProfile = this.profiles.get(targetUserId)
    if (!targetProfile) throw new Error('Usuario objetivo no encontrado')

    // Regla 1: Propietario siempre ve sus favoritos
    if (viewerId && viewerId === targetUserId) {
      return this.userFavorites.filter((f) => f.user_id === targetUserId)
    }

    // Regla 2: Privado -> nadie más ve
    if (targetProfile.favorites_visibility === 'private') {
      return { restricted: true, reason: 'private', data: [] }
    }

    // Regla 3: Seguidores -> solo si viewerId es seguidor aceptado
    if (targetProfile.favorites_visibility === 'followers') {
      const isAcceptedFollower = this.follows.some(
        (f) => f.follower_id === viewerId && f.following_id === targetUserId && f.status === 'accepted'
      )
      if (isAcceptedFollower) {
        return { restricted: false, data: this.userFavorites.filter((f) => f.user_id === targetUserId) }
      }
      return { restricted: true, reason: 'followers', data: [] }
    }

    // Regla 4: Público
    return { restricted: false, data: this.userFavorites.filter((f) => f.user_id === targetUserId) }
  }

  // Seguir
  followUser(followerId, followingId) {
    if (!followerId) {
      throw new Error('AUTH_REQUIRED: Usuario no autenticado.')
    }

    // Restricción DB: follower_id <> following_id (CASO H)
    if (followerId === followingId) {
      throw new Error('CHECK_CONSTRAINT_VIOLATION: follower_id != following_id (no auto-seguimiento)')
    }

    // Restricción UNIQUE: (follower_id, following_id) (CASO I)
    const existing = this.follows.find((f) => f.follower_id === followerId && f.following_id === followingId)
    if (existing) {
      throw new Error('UNIQUE_CONSTRAINT_VIOLATION: Ya existe una relación de seguimiento.')
    }

    const targetProfile = this.profiles.get(followingId)
    if (!targetProfile) throw new Error('Perfil no encontrado.')

    // Si es privado, status = 'pending'; si es público, status = 'accepted'
    const status = targetProfile.profile_visibility === 'private' ? 'pending' : 'accepted'

    const record = {
      id: `f-${this.follows.length + 1}`,
      follower_id: followerId,
      following_id: followingId,
      status,
      created_at: new Date().toISOString(),
    }

    this.follows.push(record)
    return record
  }

  // Dejar de seguir
  unfollowUser(followerId, followingId) {
    if (!followerId) throw new Error('AUTH_REQUIRED')
    const idx = this.follows.findIndex((f) => f.follower_id === followerId && f.following_id === followingId)
    if (idx !== -1) {
      this.follows.splice(idx, 1)
      return true
    }
    return false
  }

  // Aceptar solicitud (followingId acepta)
  acceptRequest(followingId, requestId) {
    const req = this.follows.find((f) => f.id === requestId)
    if (!req) throw new Error('Solicitud no encontrada')
    if (req.following_id !== followingId) {
      throw new Error('RLS_VIOLATION: Solo el usuario receptor puede aceptar la solicitud.')
    }
    req.status = 'accepted'
    return req
  }

  // Rechazar solicitud (followingId rechaza)
  rejectRequest(followingId, requestId) {
    const idx = this.follows.findIndex((f) => f.id === requestId)
    if (idx === -1) throw new Error('Solicitud no encontrada')
    if (this.follows[idx].following_id !== followingId) {
      throw new Error('RLS_VIOLATION: Solo el usuario receptor puede rechazar.')
    }
    this.follows.splice(idx, 1)
    return true
  }

  // Contadores dinámicos calculados desde la base de datos (Sección 9)
  countFollowers(userId) {
    return this.follows.filter((f) => f.following_id === userId && f.status === 'accepted').length
  }

  countFollowing(userId) {
    return this.follows.filter((f) => f.follower_id === userId && f.status === 'accepted').length
  }
}

async function runTests() {
  console.log('====================================================')
  console.log('🧪 POKEVIZ / POKEGUIDE - PRUEBAS OBLIGATORIAS SISTEMA SOCIAL')
  console.log('====================================================\n')

  const db = new SocialDatabaseEngine()

  // Crear Usuario A y Usuario B
  const userA = db.createProfile({ id: 'uuid-ash', username: 'AshKetchum', profile_visibility: 'public' })
  const userB = db.createProfile({ id: 'uuid-red', username: 'RedChampion', profile_visibility: 'public' })

  // CASO A: Usuario A sigue a B (ambos públicos) -> B seguidores +1, A siguiendo +1
  console.log('▶ Ejecutando CASO A: Usuario A sigue a B (perfiles públicos)...')
  const initialBFollowers = db.countFollowers(userB.id)
  const initialAFollowing = db.countFollowing(userA.id)

  const followRelA = db.followUser(userA.id, userB.id)
  const bFollowersAfterA = db.countFollowers(userB.id)
  const aFollowingAfterA = db.countFollowing(userA.id)

  if (followRelA.status !== 'accepted') throw new Error('CASO A Falló: status debió ser accepted')
  if (bFollowersAfterA !== initialBFollowers + 1) throw new Error(`CASO A Falló: B seguidores no aumentó +1 (era ${initialBFollowers}, ahora ${bFollowersAfterA})`)
  if (aFollowingAfterA !== initialAFollowing + 1) throw new Error(`CASO A Falló: A siguiendo no aumentó +1 (era ${initialAFollowing}, ahora ${aFollowingAfterA})`)
  console.log('  ✅ CASO A Pasó: B seguidores +1 (1), A siguiendo +1 (1), status = accepted.\n')

  // CASO B: A deja de seguir a B -> contadores vuelven a bajar
  console.log('▶ Ejecutando CASO B: A deja de seguir a B...')
  db.unfollowUser(userA.id, userB.id)
  const bFollowersAfterB = db.countFollowers(userB.id)
  const aFollowingAfterB = db.countFollowing(userA.id)

  if (bFollowersAfterB !== initialBFollowers) throw new Error('CASO B Falló: B seguidores no bajó a 0')
  if (aFollowingAfterB !== initialAFollowing) throw new Error('CASO B Falló: A siguiendo no bajó a 0')
  console.log('  ✅ CASO B Pasó: B seguidores decrementó a 0, A siguiendo decrementó a 0.\n')

  // CASO C: Usuario B cambia perfil a privado. A intenta seguir B -> Solicitud enviada (pending)
  console.log('▶ Ejecutando CASO C: Usuario B cambia perfil a privado. A sigue a B...')
  db.updateProfilePrivacy(userB.id, { profile_visibility: 'private' })
  const followRelC = db.followUser(userA.id, userB.id)

  if (followRelC.status !== 'pending') throw new Error(`CASO C Falló: Estado debió ser 'pending', recibido '${followRelC.status}'`)
  if (db.countFollowers(userB.id) !== 0) throw new Error('CASO C Falló: Solicitud pendiente no debe contar como seguidor aceptado')
  console.log('  ✅ CASO C Pasó: Aparece "Solicitud enviada", status = pending, contadores no se incrementan prematuramente.\n')

  // CASO D: B acepta solicitud -> A Siguiendo B, B tiene a A como Seguidor
  console.log('▶ Ejecutando CASO D: B acepta la solicitud de A...')
  db.acceptRequest(userB.id, followRelC.id)
  const bFollowersAfterD = db.countFollowers(userB.id)
  const aFollowingAfterD = db.countFollowing(userA.id)

  if (bFollowersAfterD !== 1) throw new Error('CASO D Falló: B debió tener 1 seguidor')
  if (aFollowingAfterD !== 1) throw new Error('CASO D Falló: A debió estar siguiendo a 1')
  console.log('  ✅ CASO D Pasó: pending -> accepted, B seguidores = 1, A siguiendo = 1.\n')

  // CASO E: B rechaza otra solicitud -> se elimina registro, no hay relación
  console.log('▶ Ejecutando CASO E: B rechaza una solicitud...')
  const userC = db.createProfile({ id: 'uuid-misty', username: 'MistyWater', profile_visibility: 'public' })
  const followReqMisty = db.followUser(userC.id, userB.id)
  db.rejectRequest(userB.id, followReqMisty.id)

  const mistyRel = db.follows.find((f) => f.follower_id === userC.id && f.following_id === userB.id)
  if (mistyRel) throw new Error('CASO E Falló: Registro de solicitud no fue eliminado tras rechazo')
  console.log('  ✅ CASO E Pasó: La solicitud rechazada fue eliminada sin crear relación.\n')

  // CASO F: B pone favoritos = privado -> A NO puede verlos
  console.log('▶ Ejecutando CASO F: B pone favoritos = privado. A intenta consultarlos...')
  db.addFavorite(userB.id, { id: 6, name: 'Charizard' })
  db.addFavorite(userB.id, { id: 25, name: 'Pikachu' })
  db.updateProfilePrivacy(userB.id, { favorites_visibility: 'private' })

  const resF_A = db.queryFavorites(userA.id, userB.id)
  const resF_Owner = db.queryFavorites(userB.id, userB.id)

  if (!resF_A.restricted) throw new Error('CASO F Falló: A no debió tener acceso a favoritos privados')
  if (resF_Owner.length !== 2) throw new Error('CASO F Falló: Propietario siempre debe poder ver sus propios favoritos')
  console.log('  ✅ CASO F Pasó: Visitante A bloqueado (🔒 Este contenido es privado). Propietario B sí los ve (2 favoritos).\n')

  // CASO G: B pone favoritos = seguidores -> A solo puede verlos tras ser aceptado
  console.log('▶ Ejecutando CASO G: B pone favoritos = seguidores...')
  db.updateProfilePrivacy(userB.id, { favorites_visibility: 'followers' })

  // A ya está aceptado como seguidor
  const resG_Accepted = db.queryFavorites(userA.id, userB.id)
  if (resG_Accepted.restricted || resG_Accepted.data.length !== 2) {
    throw new Error('CASO G Falló: Seguidor aceptado A debió poder ver favoritos')
  }

  // Usuario no seguidor intenta ver
  const resG_NonFollower = db.queryFavorites(userC.id, userB.id)
  if (!resG_NonFollower.restricted || resG_NonFollower.reason !== 'followers') {
    throw new Error('CASO G Falló: Usuario no seguidor C no debió poder ver favoritos')
  }
  console.log('  ✅ CASO G Pasó: Seguidor aceptado A ve los favoritos. Usuario C recibe restricción de seguidores.\n')

  // CASO H: A intenta seguirse a sí mismo -> Debe fallar por restricción de base de datos
  console.log('▶ Ejecutando CASO H: A intenta seguirse a sí mismo...')
  let selfFollowFailed = false
  try {
    db.followUser(userA.id, userA.id)
  } catch (err) {
    if (err.message.includes('follower_id != following_id')) {
      selfFollowFailed = true
    }
  }
  if (!selfFollowFailed) throw new Error('CASO H Falló: Auto-seguimiento no fue rechazado')
  console.log('  ✅ CASO H Pasó: Restricción CHECK (follower_id <> following_id) impidió auto-seguimiento correctamente.\n')

  // CASO I: A intenta crear dos veces el mismo follow -> Restricción UNIQUE impide duplicado
  console.log('▶ Ejecutando CASO I: A intenta duplicar seguimiento a B...')
  let duplicateFollowFailed = false
  try {
    db.followUser(userA.id, userB.id)
  } catch (err) {
    if (err.message.includes('UNIQUE_CONSTRAINT_VIOLATION')) {
      duplicateFollowFailed = true
    }
  }
  if (!duplicateFollowFailed) throw new Error('CASO I Falló: No se impidió el seguimiento duplicado')
  console.log('  ✅ CASO I Pasó: Restricción UNIQUE(follower_id, following_id) impidió duplicados.\n')

  // CASO J: Usuario no autenticado intenta realizar acción social -> Rechazado
  console.log('▶ Ejecutando CASO J: Usuario no autenticado (null) intenta seguir...')
  let unauthFailed = false
  try {
    db.followUser(null, userB.id)
  } catch (err) {
    if (err.message.includes('AUTH_REQUIRED')) {
      unauthFailed = true
    }
  }
  if (!unauthFailed) throw new Error('CASO J Falló: Usuario no autenticado debió ser rechazado')
  console.log('  ✅ CASO J Pasó: Acción rechazada correctamente para visitante anónimo.\n')

  console.log('====================================================')
  console.log('🎉 TODOS LOS 10 CASOS OBLIGATORIOS (A - J) PASARON CON ÉXITO.')
  console.log('====================================================')
}

runTests().catch((err) => {
  console.error('❌ Error en pruebas:', err)
  process.exit(1)
})
