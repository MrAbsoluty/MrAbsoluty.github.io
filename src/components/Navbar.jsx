import { useFavorites } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'
import UserMenuDropdown from './auth/UserMenuDropdown'
import GuestMenuDropdown from './auth/GuestMenuDropdown'
import LanguageDropdown from './common/LanguageDropdown'

function Navbar({
  t,
  locale,
  onLocaleChange,
  onPokedexClick,
  onMovesClick,
  onHomeClick,
  onFavoritesClick,
  onProfileClick,
  onConstructionClick,
  activeNav = 'home',
}) {
  const { unseenCount, markFavoritesAsSeen } = useFavorites()
  const {
    isAuthenticated,
    isProfileComplete,
    profile,
    user,
    loading: authLoading,
    openAuthModal,
    signOut,
    setShowUsernameSetup,
  } = useAuth()

  function handleBrandClick(event) {
    if (onHomeClick) {
      event.preventDefault()
      onHomeClick()
    }
  }

  function handlePokedexNavClick(event) {
    if (onPokedexClick) {
      event.preventDefault()
      onPokedexClick()
    }
  }

  function handleMovesNavClick(event) {
    if (onMovesClick) {
      event.preventDefault()
      onMovesClick()
    }
  }

  function handleFavoritesNavClick(event) {
    markFavoritesAsSeen?.()
    if (onFavoritesClick) {
      event.preventDefault()
      onFavoritesClick()
    }
  }

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={t.nav.homeAria} onClick={handleBrandClick}>
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span>PokéGuide</span>
      </a>
      <nav className="main-nav" aria-label={t.nav.aria}>
        <a
          className={activeNav === 'home' ? 'active' : ''}
          href="#top"
          onClick={handleBrandClick}
        >
          {t.nav.home}
        </a>
        <a
          className={activeNav === 'pokedex' ? 'active' : ''}
          href="#pokedex"
          onClick={handlePokedexNavClick}
        >
          {t.nav.pokedex}
        </a>
        <a
          className={activeNav === 'moves' ? 'active' : ''}
          href="#moves"
          onClick={handleMovesNavClick}
        >
          {t?.nav?.moves || 'Movimientos'}
        </a>
        {!isAuthenticated && (
          <a
            className={activeNav === 'favorites' ? 'active' : ''}
            href="#favorites"
            onClick={handleFavoritesNavClick}
          >
            {t?.nav?.favorites || 'Favoritos'}
            {unseenCount > 0 && activeNav !== 'favorites' && (
              <span className="nav-fav-badge" aria-label={`${unseenCount} nuevos favoritos`}>
                {unseenCount}
              </span>
            )}
          </a>
        )}
        <a
          href="#construction"
          onClick={(e) => {
            if (onConstructionClick) {
              e.preventDefault()
              onConstructionClick(t?.nav?.competitive)
            }
          }}
        >
          {t.nav.competitive}
        </a>
        <a
          href="#construction"
          onClick={(e) => {
            if (onConstructionClick) {
              e.preventDefault()
              onConstructionClick(t?.nav?.guide)
            }
          }}
        >
          {t.nav.guide}
        </a>
      </nav>
      <div className="header-actions">
        {!isAuthenticated && (
          <LanguageDropdown locale={locale} onLocaleChange={onLocaleChange} t={t} />
        )}

        {!authLoading && (
          <div className="nav-auth-group">
            {isAuthenticated ? (
              <>
                {isProfileComplete ? (
                  <UserMenuDropdown
                    profile={profile}
                    user={user}
                    t={t}
                    locale={locale}
                    onLocaleChange={onLocaleChange}
                    onFavoritesClick={onFavoritesClick}
                    onProfileClick={onProfileClick}
                    unseenCount={unseenCount}
                    markFavoritesAsSeen={markFavoritesAsSeen}
                    signOut={signOut}
                  />
                ) : (
                  <button
                    type="button"
                    className="nav-incomplete-btn"
                    onClick={() => setShowUsernameSetup(true)}
                    title="Debes elegir un nombre de usuario"
                  >
                    ⚠️ Elegir username
                  </button>
                )}
              </>
            ) : (
              <GuestMenuDropdown t={t} openAuthModal={openAuthModal} />
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar