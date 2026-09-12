import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FollowButton from '../components/social/FollowButton'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import {
  getProfileByUsername,
  getUserFavorites,
  updateProfileDetails,
} from '../services/social'
import {
  cleanPokemonSlug,
  getPokemonDisplayName,
} from '../utils/pokemonNames'
import { ALL_SPECIES_NAMES } from '../utils/allPokemonSpecies'
import {
  playHoverBubbleSound,
  playButtonSound,
  playClickUserSound,
} from '../utils/audio'

function getFeaturedPokemonId(slugOrName) {
  if (!slugOrName) return 6 // Default Charizard (#6)
  const clean = cleanPokemonSlug(slugOrName.trim().toLowerCase())
  const idx = ALL_SPECIES_NAMES.indexOf(clean)
  if (idx !== -1) return idx + 1
  return 6
}

export default function Profile({
  username: routeUsername,
  onPokemonClick,
  onBack,
  onHomeClick,
  onPokedexClick,
  onFavoritesClick,
  t,
  locale = 'es',
  onLocaleChange,
}) {
  const {
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
  const [activeTab, setActiveTab] = useState('favorites')

  // Determinar el nombre de usuario canónico para cargar
  const targetUsername = useMemo(() => {
    if (routeUsername) {
      return routeUsername.trim().replace(/^@+/, '')
    }
    return currentAuthProfile?.username || ''
  }, [routeUsername, currentAuthProfile?.username])

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
    if (!targetUsername) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setEditError(null)

    try {
      const data = await getProfileByUsername(targetUsername, user?.id)
      setProfileData(data)

      if (data) {
        setEditBio(data.bio || '')
        setEditFeaturedPokemon(data.featured_pokemon || 'charizard')

        // Si es el propietario, usamos la lista de favoritos viva del contexto
        if (user?.id && data.id === user.id) {
          setFavoritesList(localFavorites || [])
        } else if (data.favorites_visibility !== 'private') {
          const favs = await getUserFavorites(data.id)
          setFavoritesList(favs)
        } else {
          setFavoritesList([])
        }
      } else {
        setFavoritesList([])
      }
    } catch (err) {
      console.error('[Profile Page] Error cargando perfil:', err)
      setProfileData(null)
    } finally {
      setIsLoading(false)
    }
  }, [targetUsername, user?.id, localFavorites])

  useEffect(() => {
    loadProfile()
    setIsEditing(false)
  }, [loadProfile])

  // Sincronizar favoritos locales si es el dueño
  useEffect(() => {
    if (isOwner && localFavorites) {
      setFavoritesList(localFavorites)
    }
  }, [isOwner, localFavorites])

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!user?.id) return
    setIsSavingEdit(true)
    setEditError(null)

    try {
      const cleanFeatured = cleanPokemonSlug(editFeaturedPokemon.trim().toLowerCase())
      const res = await updateProfileDetails(user.id, {
        bio: editBio,
        featured_pokemon: cleanFeatured || 'charizard',
      })

      if (res.success) {
        setIsEditing(false)
        setProfileData((prev) => ({
          ...prev,
          bio: editBio.trim(),
          featured_pokemon: cleanFeatured || 'charizard',
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
    playClickUserSound()
    if (onPokemonClick) {
      const targetQuery = fav?.id ? String(fav.id) : cleanPokemonSlug(fav?.name || '')
      onPokemonClick(targetQuery)
    }
  }

  function handleFeaturedPokemonClick() {
    playClickUserSound()
    if (onPokemonClick && profileData?.featured_pokemon) {
      const currentFeaturedId = getFeaturedPokemonId(profileData.featured_pokemon)
      onPokemonClick(String(currentFeaturedId))
    }
  }

  function handleBackClick() {
    playButtonSound()
    if (onBack) {
      onBack()
    } else {
      window.history.back()
    }
  }

  const displayName = profileData?.username || targetUsername || 'Entrenador'
  const userInitial = displayName.charAt(0).toUpperCase()
  const featuredSlug = cleanPokemonSlug(profileData?.featured_pokemon || 'charizard')
  const currentFeaturedId = getFeaturedPokemonId(featuredSlug)
  const featuredDisplayName = getPokemonDisplayName(featuredSlug, locale)
  const featuredArtworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentFeaturedId}.png`

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        activeNav="profile"
        onHomeClick={onHomeClick}
        onPokedexClick={onPokedexClick}
        onFavoritesClick={onFavoritesClick}
      />

      <main className="profile-page">
        {/* Enlace de regreso */}
        <button
          className="back-link profile-back-btn"
          type="button"
          onClick={handleBackClick}
          onMouseEnter={playHoverBubbleSound}
        >
          <span aria-hidden="true">←</span> {t?.detail?.back || 'Volver'}
        </button>

        {isLoading ? (
          /* Skeletons de carga del perfil */
          <div className="trainer-card-skeleton" aria-busy="true">
            <div className="trainer-card-skeleton-header">
              <div className="skeleton-line skeleton-badge" />
              <div className="skeleton-line skeleton-id" />
            </div>
            <div className="trainer-card-skeleton-body">
              <div className="skeleton-avatar" />
              <div className="skeleton-info">
                <div className="skeleton-line skeleton-name" />
                <div className="skeleton-line skeleton-handle" />
                <div className="skeleton-line skeleton-bio" />
              </div>
            </div>
            <div className="trainer-card-skeleton-stats">
              <div className="skeleton-stat-box" />
              <div className="skeleton-stat-box" />
              <div className="skeleton-stat-box" />
            </div>
          </div>
        ) : !profileData ? (
          /* Estado de perfil no encontrado (404 Trainer) */
          <div className="trainer-card trainer-not-found-card">
            <div className="trainer-not-found-icon">🔍</div>
            <h2>{t?.social?.userNotFound || 'Entrenador no encontrado'}</h2>
            <p>
              {t?.social?.userNotFoundDesc ||
                `No existe ningún perfil público registrado con el usuario @${targetUsername}.`}
            </p>
            <button
              type="button"
              className="primary-action"
              onClick={onHomeClick}
              onMouseEnter={playHoverBubbleSound}
            >
              {t?.nav?.home || 'Ir al Inicio'}
            </button>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* TRAINER CARD MODERNA DE POKE-GUIDE                             */}
            {/* ============================================================== */}
            <section className="trainer-card" aria-label={`Trainer Card de ${displayName}`}>
              {/* Cinta superior de la Trainer Card */}
              <div className="trainer-card-ribbon">
                <div className="trainer-card-brand">
                  <span className="trainer-pokeball-mark" aria-hidden="true" />
                  <span className="trainer-card-badge-text">TRAINER PASSPORT</span>
                </div>
                <div className="trainer-card-meta-tags">
                  {profileData.profile_visibility === 'private' && (
                    <span className="trainer-private-badge" title="Perfil privado">
                      🔒 Privado
                    </span>
                  )}
                  <span className="trainer-id-badge">
                    ID: #{String(profileData.id ? profileData.id.slice(0, 6) : '000000').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Contenido principal de la Trainer Card */}
              <div className="trainer-card-main-grid">
                {/* Columna Izquierda: Avatar con halo y estado */}
                <div className="trainer-avatar-column">
                  <div className="trainer-avatar-halo-wrap">
                    <div className="trainer-avatar-inner">
                      {profileData.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt={displayName}
                          className="trainer-avatar-image"
                        />
                      ) : (
                        <span className="trainer-avatar-fallback">{userInitial}</span>
                      )}
                    </div>
                    <span className="trainer-online-pip" title="Entrenador en línea" aria-hidden="true" />
                  </div>

                  {/* Acciones rápidas del avatar para el dueño */}
                  {isOwner && (
                    <button
                      type="button"
                      className="trainer-avatar-edit-chip"
                      onClick={openProfileModal}
                      onMouseEnter={playHoverBubbleSound}
                      title={t?.social?.changePhotoOrUsername || 'Cambiar foto o username'}
                    >
                      📷 {t?.social?.changePhoto || 'Cambiar foto'}
                    </button>
                  )}
                </div>

                {/* Columna Central: Información del Entrenador */}
                <div className="trainer-info-column">
                  <div className="trainer-identity-header">
                    <h1 className="trainer-name">{displayName}</h1>
                    <span className="trainer-handle">@{profileData.username}</span>
                  </div>

                  {/* Biografía */}
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="trainer-edit-form">
                      {editError && <div className="auth-alert alert-error">{editError}</div>}
                      <div className="trainer-form-group">
                        <label className="trainer-form-label">{t?.social?.bio || 'Biografía'}</label>
                        <textarea
                          className="trainer-bio-input"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder={t?.social?.bioPlaceholder || 'Escribe sobre tu viaje Pokémon...'}
                          maxLength={250}
                          rows={3}
                        />
                      </div>

                      <div className="trainer-form-group">
                        <label className="trainer-form-label">
                          {t?.social?.featuredPokemon || 'Pokémon principal'}
                        </label>
                        <input
                          type="text"
                          className="trainer-featured-input"
                          value={editFeaturedPokemon}
                          onChange={(e) => setEditFeaturedPokemon(e.target.value)}
                          placeholder="Ej: charizard, gengar, pikachu, bramaluna, flamariete..."
                          maxLength={30}
                        />
                        <span className="trainer-input-hint">
                          Escribe el nombre del Pokémon que te representa.
                        </span>
                      </div>

                      <div className="trainer-edit-btn-row">
                        <button
                          type="button"
                          className="trainer-btn-cancel"
                          onClick={() => setIsEditing(false)}
                          onMouseEnter={playHoverBubbleSound}
                        >
                          {t?.social?.cancel || 'Cancelar'}
                        </button>
                        <button
                          type="submit"
                          className="trainer-btn-save"
                          disabled={isSavingEdit}
                          onMouseEnter={playHoverBubbleSound}
                        >
                          {isSavingEdit ? (t?.social?.saving || 'Guardando...') : (t?.social?.save || 'Guardar')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="trainer-bio-quote">
                        {profileData.bio ? (
                          <p className="trainer-bio-text">"{profileData.bio}"</p>
                        ) : (
                          <p className="trainer-bio-empty">
                            <em>{t?.social?.noBio || 'Este entrenador no ha escrito una biografía aún.'}</em>
                          </p>
                        )}
                      </div>

                      {/* Pokémon Principal (Partner Pokémon) */}
                      <div
                        className="trainer-partner-pill is-interactive"
                        onClick={handleFeaturedPokemonClick}
                        onMouseEnter={playHoverBubbleSound}
                        role="button"
                        tabIndex={0}
                        title={`Ver detalles de ${featuredDisplayName}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleFeaturedPokemonClick()
                          }
                        }}
                      >
                        <div className="trainer-partner-art-wrap">
                          <img
                            src={featuredArtworkUrl}
                            alt={featuredDisplayName}
                            className="trainer-partner-art"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png'
                            }}
                          />
                        </div>
                        <div className="trainer-partner-details">
                          <span className="trainer-partner-kicker">
                            ★ {t?.social?.featuredPokemon || 'Pokémon principal'}
                          </span>
                          <strong className="trainer-partner-name">{featuredDisplayName}</strong>
                        </div>
                        <span className="trainer-partner-arrow" aria-hidden="true">↗</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Columna Derecha: Contadores y Acciones Principales */}
                <div className="trainer-actions-column">
                  {/* Fila de Contadores de Entrenador */}
                  <div className="trainer-stats-trio">
                    <div className="trainer-stat-pill">
                      <span className="stat-symbol">⭐</span>
                      <strong className="stat-val">{profileData.favoritesCount || 0}</strong>
                      <span className="stat-tag">{t?.social?.favorites || 'Favoritos'}</span>
                    </div>

                    <button
                      type="button"
                      className="trainer-stat-pill is-clickable"
                      onClick={() => openFollowing(profileData.id)}
                      onMouseEnter={playHoverBubbleSound}
                      title={t?.social?.viewFollowing || 'Ver a quién sigue'}
                    >
                      <span className="stat-symbol">👤</span>
                      <strong className="stat-val">{profileData.followingCount || 0}</strong>
                      <span className="stat-tag">{t?.social?.following || 'Siguiendo'}</span>
                    </button>

                    <button
                      type="button"
                      className="trainer-stat-pill is-clickable"
                      onClick={() => openFollowers(profileData.id)}
                      onMouseEnter={playHoverBubbleSound}
                      title={t?.social?.viewFollowers || 'Ver seguidores'}
                    >
                      <span className="stat-symbol">👥</span>
                      <strong className="stat-val">{profileData.followersCount || 0}</strong>
                      <span className="stat-tag">{t?.social?.followers || 'Seguidores'}</span>
                    </button>
                  </div>

                  {/* Botones de acción principales */}
                  <div className="trainer-action-buttons">
                    {isOwner ? (
                      <div className="trainer-owner-controls">
                        {!isEditing && (
                          <button
                            type="button"
                            className="trainer-action-btn btn-edit-profile"
                            onClick={() => setIsEditing(true)}
                            onMouseEnter={playHoverBubbleSound}
                          >
                            ✏️ {t?.social?.editProfile || 'Editar perfil'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="trainer-action-btn btn-privacy-settings"
                          onClick={openPrivacyModal}
                          onMouseEnter={playHoverBubbleSound}
                          title={t?.social?.privacySettings || 'Ajustes de privacidad'}
                        >
                          🔒 {t?.social?.privacy || 'Privacidad'}
                        </button>
                        {pendingRequestsCount > 0 && (
                          <button
                            type="button"
                            className="trainer-action-btn btn-requests-alert"
                            onClick={openFollowRequests}
                            onMouseEnter={playHoverBubbleSound}
                          >
                            🔔 Solicitudes ({pendingRequestsCount})
                          </button>
                        )}
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
              </div>
            </section>

            {/* ============================================================== */}
            {/* SECCIÓN INFERIOR: POKÉMON FAVORITOS & TABS FUTUROS             */}
            {/* ============================================================== */}
            <section className="trainer-body-container">
              {/* Barra de pestañas */}
              <nav className="trainer-tabs-bar" aria-label="Secciones del perfil">
                <button
                  type="button"
                  className={`trainer-tab-item ${activeTab === 'favorites' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('favorites')}
                  onMouseEnter={playHoverBubbleSound}
                >
                  ⭐ {t?.favorites?.title || 'Pokémon favoritos'}
                  <span className="trainer-tab-counter">{favoritesList.length}</span>
                </button>

                <button
                  type="button"
                  className="trainer-tab-item is-disabled"
                  disabled
                  title="Próximamente disponible"
                >
                  🏆 Equipos
                  <span className="trainer-tab-soon">Pronto</span>
                </button>

                <button
                  type="button"
                  className="trainer-tab-item is-disabled"
                  disabled
                  title="Próximamente disponible"
                >
                  📊 Estadísticas
                  <span className="trainer-tab-soon">Pronto</span>
                </button>

                <button
                  type="button"
                  className="trainer-tab-item is-disabled"
                  disabled
                  title="Próximamente disponible"
                >
                  🏅 Insignias
                  <span className="trainer-tab-soon">Pronto</span>
                </button>

                <button
                  type="button"
                  className="trainer-tab-item is-disabled"
                  disabled
                  title="Próximamente disponible"
                >
                  📝 Actividad
                  <span className="trainer-tab-soon">Pronto</span>
                </button>
              </nav>

              {/* Panel de Contenido: Favoritos */}
              {activeTab === 'favorites' && (
                <div className="trainer-favorites-panel">
                  {!canViewFavorites ? (
                    /* Tarjeta de contenido restringido por privacidad */
                    <div className="trainer-privacy-box">
                      <div className="trainer-lock-icon" aria-hidden="true">🔒</div>
                      <h3>{t?.social?.privateContent || 'Este contenido es privado.'}</h3>
                      <p>
                        {favoritesRestrictedReason === 'followers'
                          ? (t?.social?.privateFavoritesFollowers ||
                              'Los Pokémon favoritos de este usuario solo están disponibles para sus seguidores.')
                          : (t?.social?.privateFavoritesOwner ||
                              'Los Pokémon favoritos de este entrenador están configurados como privados.')}
                      </p>
                    </div>
                  ) : favoritesList.length === 0 ? (
                    /* Estado vacío */
                    <div className="trainer-empty-favorites-box">
                      <div className="empty-star-icon" aria-hidden="true">★</div>
                      <h3>{t?.social?.noFavoritesYet || 'No hay Pokémon favoritos guardados'}</h3>
                      <p>
                        {isOwner
                          ? (t?.favorites?.emptySubtitle ||
                              'Explora la Pokédex y guarda a tus compañeros favoritos para exhibirlos en tu Trainer Card.')
                          : 'Este entrenador aún no ha añadido ningún Pokémon a su colección de favoritos.'}
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          className="primary-action trainer-explore-btn"
                          onClick={onPokedexClick}
                          onMouseEnter={playHoverBubbleSound}
                        >
                          {t?.favorites?.explorePokedex || 'Explorar Pokédex'} ↗
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Grid de Pokémon Favoritos */
                    <div className="trainer-fav-grid" role="region" aria-label="Pokémon favoritos">
                      {favoritesList.map((fav) => {
                        const pokeId = fav.id
                        const pokeSlug = cleanPokemonSlug(fav.name || '', pokeId)
                        const pokeDisplayName = getPokemonDisplayName(pokeId || pokeSlug, locale)
                        const spriteUrl = pokeId
                          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png`
                          : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png`

                        return (
                          <div
                            key={pokeId || pokeSlug}
                            className="trainer-fav-card is-interactive"
                            onClick={() => handlePokemonCardClick(fav)}
                            onMouseEnter={playHoverBubbleSound}
                            role="button"
                            tabIndex={0}
                            title={`Ver detalles de ${pokeDisplayName}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handlePokemonCardClick(fav)
                              }
                            }}
                          >
                            <div className="trainer-fav-img-wrap">
                              <img
                                src={spriteUrl}
                                alt={pokeDisplayName}
                                className="trainer-fav-img"
                                loading="lazy"
                              />
                            </div>
                            <div className="trainer-fav-info">
                              {pokeId && (
                                <span className="trainer-fav-id">
                                  #{String(pokeId).padStart(3, '0')}
                                </span>
                              )}
                              <strong className="trainer-fav-name">{pokeDisplayName}</strong>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer t={t} />
    </div>
  )
}
