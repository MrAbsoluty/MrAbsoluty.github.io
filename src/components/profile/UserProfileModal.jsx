import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import {
  getProfileByUsername,
  getProfileById,
  getUserFavorites,
  updateProfileDetails,
} from '../../services/social'
import FollowButton from '../social/FollowButton'
import { playHoverBubbleSound } from '../../utils/audio'
import {
  cleanPokemonSlug,
  getPokemonDisplayName,
} from '../../utils/pokemonNames'

export default function UserProfileModal({ onPokemonClick, t, locale = 'es' }) {
  const {
    isUserProfileOpen,
    closeUserProfile,
    viewingUser,
    user,
    profile: currentAuthProfile,
    openProfileModal,
    openPrivacyModal,
    openFollowers,
    openFollowing,
    openFollowRequests,
    pendingRequestsCount,
  } = useAuth()

  const { favorites: localFavorites } = useFavorites()

  const [profileData, setProfileData] = useState(null)
  const [favoritesList, setFavoritesList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editFeaturedPokemon, setEditFeaturedPokemon] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)
  const modalRef = useRef(null)

  const isOwner = Boolean(
    profileData && user?.id && profileData.id === user.id
  )

  const isAcceptedFollower = profileData?.followStatus === 'accepted'
  const isProfilePrivate = profileData?.profile_visibility === 'private'
  const canViewFullProfile = isOwner || !isProfilePrivate || isAcceptedFollower

  // Determinar si los favoritos son visibles para el espectador actual
  const favoritesVisibility = profileData?.favorites_visibility || 'public'
  let canViewFavorites = false
  let favoritesRestrictedReason = null

  if (isOwner) {
    canViewFavorites = true
  } else if (!canViewFullProfile) {
    canViewFavorites = false
    favoritesRestrictedReason = 'profile_private'
  } else if (favoritesVisibility === 'private') {
    canViewFavorites = false
    favoritesRestrictedReason = 'private'
  } else if (favoritesVisibility === 'followers') {
    if (isAcceptedFollower) {
      canViewFavorites = true
    } else {
      canViewFavorites = false
      favoritesRestrictedReason = 'followers'
    }
  } else {
    canViewFavorites = true
  }

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setEditError(null)

    try {
      let data = null
      // Si viewingUser es string
      if (typeof viewingUser === 'string') {
        const clean = viewingUser.trim().replace(/^@+/, '')
        data = await getProfileByUsername(clean, user?.id)
      } else if (viewingUser?.username) {
        data = await getProfileByUsername(viewingUser.username, user?.id)
      } else if (viewingUser?.id) {
        data = await getProfileById(viewingUser.id, user?.id)
      } else if (user?.id) {
        // Por defecto ver mi propio perfil
        data = await getProfileById(user.id, user.id)
      }

      setProfileData(data)

      if (data) {
        setEditBio(data.bio || '')
        setEditFeaturedPokemon(data.featured_pokemon || 'charizard')

        // Si es el propietario, usamos la lista de favoritos viva del contexto o de la BD
        if (user?.id && data.id === user.id) {
          setFavoritesList(localFavorites || [])
        } else if (data.favorites_visibility !== 'private') {
          const favs = await getUserFavorites(data.id)
          setFavoritesList(favs)
        } else {
          setFavoritesList([])
        }
      }
    } catch (err) {
      console.error('[UserProfileModal] Error cargando perfil:', err)
    } finally {
      setIsLoading(false)
    }
  }, [viewingUser, user?.id, localFavorites])

  useEffect(() => {
    if (isUserProfileOpen) {
      loadProfile()
      setIsEditing(false)
    }
  }, [isUserProfileOpen, loadProfile])

  // Cierre con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isUserProfileOpen && !isEditing) {
        closeUserProfile()
      }
    }
    if (isUserProfileOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUserProfileOpen, isEditing, closeUserProfile])

  if (!isUserProfileOpen) return null

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!user?.id) return
    setIsSavingEdit(true)
    setEditError(null)

    try {
      const res = await updateProfileDetails(user.id, {
        bio: editBio,
        featured_pokemon: editFeaturedPokemon,
      })

      if (res.success) {
        setIsEditing(false)
        setProfileData((prev) => ({
          ...prev,
          bio: editBio.trim(),
          featured_pokemon: editFeaturedPokemon.trim().toLowerCase(),
        }))
      } else {
        setEditError(res.error || 'Error al guardar cambios')
      }
    } catch {
      setEditError('Error de red al guardar')
    } finally {
      setIsSavingEdit(false)
    }
  }

  function handleFollowStatusChange(newStatus) {
    setProfileData((prev) => {
      if (!prev) return prev
      const prevFollowers = prev.followersCount || 0
      let nextFollowers = prevFollowers

      if (prev.followStatus !== 'accepted' && newStatus === 'accepted') {
        nextFollowers = prevFollowers + 1
      } else if (prev.followStatus === 'accepted' && newStatus !== 'accepted') {
        nextFollowers = Math.max(0, prevFollowers - 1)
      }

      return {
        ...prev,
        followStatus: newStatus,
        followersCount: nextFollowers,
      }
    })
  }

  function handlePokemonCardClick(fav) {
    playHoverBubbleSound()
    closeUserProfile()
    if (onPokemonClick) {
      // Priorizar el ID numérico canónico si está presente para una búsqueda exacta en PokeAPI,
      // o el slug canónico reparado sin truncar
      const targetQuery = fav?.id ? String(fav.id) : cleanPokemonSlug(fav?.name || '')
      onPokemonClick(targetQuery)
    }
  }

  const username = profileData?.username || currentAuthProfile?.username || 'Entrenador'
  const initial = username.charAt(0).toUpperCase()
  const featuredPokemonRaw = (profileData?.featured_pokemon || 'charizard').toLowerCase()
  const featuredSlug = cleanPokemonSlug(featuredPokemonRaw)
  const featuredDisplayName = getPokemonDisplayName(featuredSlug, locale)

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeUserProfile()
        }
      }}
    >
      <div className="user-profile-modal-card" ref={modalRef}>
        {/* Barra superior de acciones */}
        <div className="user-profile-topbar">
          <div className="auth-brand-badge">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span className="brand-text">PokéGuide</span>
          </div>

          <div className="user-profile-top-buttons">
            {isOwner && (
              <>
                <button
                  type="button"
                  className="profile-icon-action-btn"
                  onClick={openPrivacyModal}
                  title={t?.social?.privacySettings || 'Privacidad'}
                  aria-label="Configuración de privacidad"
                >
                  🔒 <span>{t?.social?.privacy || 'Privacidad'}</span>
                </button>
                {pendingRequestsCount > 0 && (
                  <button
                    type="button"
                    className="profile-icon-action-btn has-badge"
                    onClick={openFollowRequests}
                    title={t?.social?.pendingRequests || 'Solicitudes de seguimiento'}
                  >
                    🔔 <span className="profile-badge-pill">{pendingRequestsCount}</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              className="auth-modal-close"
              onClick={closeUserProfile}
              aria-label="Cerrar perfil"
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="profile-loading-box">
            <span className="auth-spinner" aria-hidden="true" />
            <span>{t?.social?.loadingProfile || 'Cargando perfil...'}</span>
          </div>
        ) : !profileData ? (
          <div className="profile-error-box">
            <span className="profile-error-icon">⚠️</span>
            <h4>{t?.social?.userNotFound || 'Entrenador no encontrado'}</h4>
            <p>{t?.social?.userNotFoundDesc || 'No existe ningún perfil público con ese nombre de usuario.'}</p>
          </div>
        ) : (
          <div className="user-profile-scroll-content">
            {/* ENCABEZADO DEL PERFIL (SECCIÓN 14 & 15) */}
            <div className="user-profile-hero">
              <div className="user-profile-avatar-outer">
                <div className="user-profile-avatar-wrap">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={username}
                      className="user-profile-avatar-img"
                    />
                  ) : (
                    <span className="user-profile-avatar-fallback">{initial}</span>
                  )}
                  <span className="user-profile-online-badge" title="En línea" />
                </div>
              </div>

              <h2 id="user-profile-title" className="user-profile-name">
                {username}
              </h2>
              <span className="user-profile-handle">@{profileData.username}</span>

              {/* Bio o edición de bio */}
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="user-profile-edit-form">
                  {editError && <div className="auth-alert alert-error">{editError}</div>}
                  <div className="auth-field">
                    <label className="auth-label">{t?.social?.bio || 'Biografía'}</label>
                    <textarea
                      className="user-profile-bio-textarea"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder={t?.social?.bioPlaceholder || 'Escribe algo sobre ti...'}
                      maxLength={250}
                      rows={3}
                    />
                  </div>
                  <div className="auth-field" style={{ marginTop: '10px' }}>
                    <label className="auth-label">{t?.social?.featuredPokemon || 'Pokémon principal'}</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={editFeaturedPokemon}
                      onChange={(e) => setEditFeaturedPokemon(e.target.value)}
                      placeholder="Ej: charizard, gengar, pikachu, bramaluna..."
                      maxLength={30}
                    />
                  </div>
                  <div className="user-profile-edit-actions">
                    <button
                      type="button"
                      className="modal-btn-cancel"
                      onClick={() => setIsEditing(false)}
                    >
                      {t?.social?.cancel || 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      className="auth-primary-btn"
                      style={{ width: 'auto', padding: '8px 20px', margin: 0 }}
                      disabled={isSavingEdit}
                    >
                      {isSavingEdit ? (t?.social?.saving || 'Guardando...') : (t?.social?.save || 'Guardar')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="user-profile-bio">
                    {profileData.bio ? `"${profileData.bio}"` : (
                      <em className="user-profile-bio-empty">{t?.social?.noBio || 'Sin biografía'}</em>
                    )}
                  </p>

                  {/* Pokémon principal destacado */}
                  <div className="user-profile-featured-pill">
                    <span className="featured-badge-icon">🔥</span>
                    <div className="featured-badge-text">
                      <strong className="featured-badge-name">
                        {featuredDisplayName}
                      </strong>
                      <span className="featured-badge-label">
                        {t?.social?.featuredPokemon || 'Pokémon principal'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* CONTADORES (SECCIÓN 9) */}
              <div className="user-profile-stats-row">
                <div className="user-stat-card">
                  <span className="stat-icon">⭐</span>
                  <strong className="stat-number">{profileData.favoritesCount || 0}</strong>
                  <span className="stat-label">{t?.social?.favorites || 'Favoritos'}</span>
                </div>

                <button
                  type="button"
                  className="user-stat-card is-clickable"
                  onClick={() => openFollowing(profileData.id)}
                  title={t?.social?.viewFollowing || 'Ver siguiendo'}
                >
                  <span className="stat-icon">👤</span>
                  <strong className="stat-number">{profileData.followingCount || 0}</strong>
                  <span className="stat-label">{t?.social?.following || 'Siguiendo'}</span>
                </button>

                <button
                  type="button"
                  className="user-stat-card is-clickable"
                  onClick={() => openFollowers(profileData.id)}
                  title={t?.social?.viewFollowers || 'Ver seguidores'}
                >
                  <span className="stat-icon">👥</span>
                  <strong className="stat-number">{profileData.followersCount || 0}</strong>
                  <span className="stat-label">{t?.social?.followers || 'Seguidores'}</span>
                </button>
              </div>

              {/* BOTONES DE ACCIÓN PRINCIPALES */}
              <div className="user-profile-main-actions">
                {isOwner ? (
                  <div className="user-owner-actions">
                    {!isEditing && (
                      <button
                        type="button"
                        className="user-btn-edit-profile"
                        onClick={() => setIsEditing(true)}
                      >
                        ✏️ {t?.social?.editProfile || 'Editar perfil'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="user-btn-avatar-settings"
                      onClick={() => {
                        closeUserProfile()
                        openProfileModal()
                      }}
                    >
                      📷 {t?.social?.changePhotoOrUsername || 'Cambiar foto / username'}
                    </button>
                  </div>
                ) : (
                  <FollowButton
                    targetUserId={profileData.id}
                    targetUsername={profileData.username}
                    isTargetPrivate={profileData.profile_visibility === 'private'}
                    initialStatus={profileData.followStatus || 'none'}
                    onStatusChange={handleFollowStatusChange}
                    size="large"
                    t={t}
                  />
                )}
              </div>
            </div>

            {/* CONTENIDO DEL PERFIL: SECCIÓN DE FAVORITOS O BLOQUEO PRIVADO */}
            <div className="user-profile-body-section">
              <div className="user-profile-section-divider">
                <span>{t?.social?.favorites || 'FAVORITOS'}</span>
              </div>

              {!canViewFavorites ? (
                <div className="user-profile-private-content-card">
                  <span className="private-content-lock">🔒</span>
                  <h4>{t?.social?.privateContent || 'Este contenido es privado.'}</h4>
                  <p>
                    {favoritesRestrictedReason === 'followers'
                      ? (t?.social?.privateFavoritesFollowers || 'Los Pokémon favoritos de este usuario solo están disponibles para sus seguidores.')
                      : (t?.social?.privateFavoritesOwner || 'Los Pokémon favoritos de este usuario son privados.')}
                  </p>
                </div>
              ) : favoritesList.length === 0 ? (
                <div className="user-profile-empty-favorites">
                  <span className="empty-fav-icon">⭐</span>
                  <p>{t?.social?.noFavoritesYet || 'No ha añadido Pokémon favoritos todavía.'}</p>
                </div>
              ) : (
                <div className="user-profile-favorites-grid">
                  {favoritesList.map((fav) => {
                    const pokeId = fav.id
                    const pokeSlug = cleanPokemonSlug(fav.name || '', pokeId)
                    const displayName = getPokemonDisplayName(pokeId || pokeSlug, locale)
                    // Sprites canónicos
                    const spriteUrl = pokeId
                      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png`
                      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png`

                    const cardTitle = (t?.social?.viewPokemonDetails || 'Ver detalles de {name}').replace(
                      '{name}',
                      displayName,
                    )

                    return (
                      <div
                        key={pokeId || pokeSlug}
                        className="profile-fav-card"
                        onClick={() => handlePokemonCardClick(fav)}
                        role="button"
                        tabIndex={0}
                        title={cardTitle}
                      >
                        <div className="profile-fav-img-wrap">
                          <img
                            src={spriteUrl}
                            alt={displayName}
                            className="profile-fav-img"
                            loading="lazy"
                          />
                        </div>
                        <strong className="profile-fav-name">
                          {displayName}
                        </strong>
                        {pokeId && (
                          <span className="profile-fav-id">
                            #{String(pokeId).padStart(3, '0')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
