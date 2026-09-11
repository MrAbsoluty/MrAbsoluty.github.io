import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getRelationships } from '../../services/social'
import { supabase } from '../../services/supabase'
import '../../styles/social-states.css'
import { localeOptions } from '../../locales'
import {
  playHoverBubbleSound,
  playDespliegueSound,
  playClickUserSound,
} from '../../utils/audio'

function UserMenuDropdown({
  profile,
  user,
  t,
  locale,
  onLocaleChange,
  onFavoritesClick,
  unseenCount = 0,
  markFavoritesAsSeen,
  signOut,
  openProfileModal: propOpenProfileModal,
  openSettingsModal: propOpenSettingsModal,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null)
  const [socialNotifications, setSocialNotifications] = useState(0)
  const menuRef = useRef(null)

  const authContext = useAuth()
  const openProfile = propOpenProfileModal || authContext.openProfileModal
  const openSettings = propOpenSettingsModal || authContext.openSettingsModal
  const openSocial = authContext.openSocialModal

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!user?.id || !supabase) return undefined
    const refresh = async () => {
      try { setSocialNotifications((await getRelationships(user.id)).filter(item => item.status === 'pending' && item.recipient_id === user.id).length) } catch { setSocialNotifications(0) }
    }
    refresh()
    const channel = supabase.channel(`social-menu-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, refresh).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  function handleToggle() {
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        playDespliegueSound()
      }
      return next
    })
  }

  function handleProfileClick() {
    playClickUserSound()
    setIsOpen(false)
    if (openProfile) {
      openProfile()
    }
  }

  function handleSettingsClick(tab = 'account') {
    playClickUserSound()
    setIsOpen(false)
    if (openSettings) {
      openSettings(tab)
    }
  }

  function handleFavorites() {
    playClickUserSound()
    markFavoritesAsSeen?.()
    if (onFavoritesClick) {
      onFavoritesClick()
    }
    setIsOpen(false)
  }

  function handleLogout() {
    playClickUserSound()
    setIsOpen(false)
    if (signOut) {
      signOut()
    }
  }

  function handleSelectLocale(code) {
    playClickUserSound()
    if (onLocaleChange && code !== locale) {
      onLocaleChange(code)
    }
  }

  const username = profile?.username || user?.user_metadata?.username || 'Entrenador'
  const userInitial = username.charAt(0).toUpperCase()
  const hasAvatar = Boolean(profile?.avatar_url && failedAvatarUrl !== profile.avatar_url)

  return (
    <div className="nav-user-menu-container" ref={menuRef}>
      {/* Botón trigger del usuario en el Navbar */}
      <button
        type="button"
        className={`nav-user-menu-trigger ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        onMouseEnter={playHoverBubbleSound}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Menú de usuario para ${username}`}
      >
        <span className="nav-user-avatar-pill" aria-hidden="true">
          {hasAvatar ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="nav-user-avatar-img"
              onError={() => setFailedAvatarUrl(profile.avatar_url)}
            />
          ) : (
            <span className="nav-user-initial">{userInitial}</span>
          )}
          {socialNotifications > 0 && <span className="social-profile-notice" />}
        </span>
        <span className="nav-user-name-text">{username}</span>
        <svg
          className={`nav-user-chevron ${isOpen ? 'is-open' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="nav-user-dropdown-panel" role="menu">
          {/* Encabezado con información del usuario (clicable para ir a Mi Perfil) */}
          <div
            className="dropdown-user-header dropdown-user-header-clickable"
            onClick={handleProfileClick}
            onMouseEnter={playHoverBubbleSound}
            role="button"
            tabIndex={0}
            title="Abrir Mi Perfil"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleProfileClick()
              }
            }}
          >
            <div className="dropdown-avatar-wrap">
              {hasAvatar ? (
                <img
                  src={profile.avatar_url}
                  alt={username}
                  className="dropdown-user-avatar-img"
                  onError={() => setFailedAvatarUrl(profile.avatar_url)}
                />
              ) : (
                <span className="dropdown-user-avatar">{userInitial}</span>
              )}
              <span className="dropdown-online-dot" aria-hidden="true" />
            </div>
            <div className="dropdown-user-info">
              <strong className="dropdown-username">{username}</strong>
              <span className="dropdown-user-email">
                {user?.email || 'Entrenador PokéGuide'}
              </span>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Opción 1: Mi Perfil */}
          <button
            type="button"
            className="dropdown-menu-item item-profile"
            onClick={handleProfileClick}
            onMouseEnter={playHoverBubbleSound}
            role="menuitem"
          >
            <span className="dropdown-item-icon icon-profile" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <div className="dropdown-item-content">
              <span className="dropdown-item-title">Mi perfil</span>
              <span className="dropdown-item-desc">Foto, nombre y cuenta</span>
            </div>
          </button>

          <button type="button" className="dropdown-menu-item item-profile" onClick={() => { setIsOpen(false); openSocial?.() }} onMouseEnter={playHoverBubbleSound} role="menuitem">
            <span className="dropdown-item-icon icon-profile" aria-hidden="true">👥</span>
            <div className="dropdown-item-content"><span className="dropdown-item-title">Amigos</span><span className="dropdown-item-desc">Comunidad y solicitudes</span></div>
          </button>

          {/* Opción 2: Favoritos */}
          <button
            type="button"
            className="dropdown-menu-item item-favorites"
            onClick={handleFavorites}
            onMouseEnter={playHoverBubbleSound}
            role="menuitem"
          >
            <span className="dropdown-item-icon icon-star" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
            <div className="dropdown-item-content">
              <span className="dropdown-item-title">
                {t?.nav?.favorites || 'Favoritos'}
              </span>
              <span className="dropdown-item-desc">Tus Pokémon guardados</span>
            </div>
            {unseenCount > 0 && (
              <span className="dropdown-badge-count" aria-label={`${unseenCount} nuevos favoritos`}>
                {unseenCount}
              </span>
            )}
          </button>

          {/* Opción 3: Ajustes */}
          <button
            type="button"
            className="dropdown-menu-item item-settings"
            onClick={() => handleSettingsClick('account')}
            onMouseEnter={playHoverBubbleSound}
            role="menuitem"
          >
            <span className="dropdown-item-icon icon-settings" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <div className="dropdown-item-content">
              <span className="dropdown-item-title">Ajustes</span>
              <span className="dropdown-item-desc">Seguridad y preferencias</span>
            </div>
          </button>

          {/* Opción 4: Próximamente (AI Link) */}
          <div
            className="dropdown-menu-item item-sparkle"
            role="menuitem"
            onClick={() => playClickUserSound()}
            onMouseEnter={playHoverBubbleSound}
            style={{ cursor: 'pointer' }}
          >
            <span className="dropdown-item-icon icon-sparkle" aria-hidden="true">
              ✦
            </span>
            <div className="dropdown-item-content">
              <div className="dropdown-item-title-row">
                <span className="dropdown-item-title">{t?.nav?.ai || 'Próximamente'}</span>
                <span className="dropdown-tag-pill">IA</span>
              </div>
              <span className="dropdown-item-desc">Asistente y batallas</span>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Opción 5: Idioma / Traducción */}
          <div className="dropdown-lang-section">
            <div className="dropdown-section-label">
              <span aria-hidden="true">🌐</span>
              <span>Traducción / Idioma</span>
            </div>
            <div className="dropdown-lang-pills">
              {localeOptions.map((opt) => {
                const isActive = opt.code === locale
                const labelText =
                  opt.code === 'es' ? 'ES' : opt.code === 'es-419' ? 'LATAM' : 'EN'

                return (
                  <button
                    key={opt.code}
                    type="button"
                    className={`dropdown-lang-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSelectLocale(opt.code)}
                    onMouseEnter={playHoverBubbleSound}
                    title={t.languages[opt.code] || opt.code}
                  >
                    <span className="lang-flag" aria-hidden="true">{opt.flag}</span>
                    <span className="lang-code">{labelText}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Opción 6: Cerrar Sesión */}
          <button
            type="button"
            className="dropdown-menu-item item-logout"
            onClick={handleLogout}
            onMouseEnter={playHoverBubbleSound}
            role="menuitem"
          >
            <span className="dropdown-item-icon icon-logout" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <div className="dropdown-item-content">
              <span className="dropdown-item-title">Cerrar sesión</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenuDropdown
