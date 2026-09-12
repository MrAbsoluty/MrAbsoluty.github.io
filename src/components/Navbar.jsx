import { localeOptions } from '../locales'
import { useFavorites } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'
import UserMenuDropdown from './auth/UserMenuDropdown'

function Navbar({
  t,
  locale,
  onLocaleChange,
  onPokedexClick,
  onHomeClick,
  onFavoritesClick,
  onProfileClick,
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
        <a href="#categories">{t.nav.competitive}</a>
        <a href="#categories">{t.nav.guide}</a>
      </nav>
      <div className="header-actions">
        {!isAuthenticated && (
          <>
            <label className="language-picker">
              <span aria-hidden="true">{localeOptions.find((option) => option.code === locale)?.flag}</span>
              <select value={locale} onChange={(event) => onLocaleChange(event.target.value)} aria-label="Language">
                <option value="es">{t.languages.es}</option>
                <option value="es-419">{t.languages['es-419']}</option>
                <option value="en">{t.languages.en}</option>
              </select>
            </label>
            <button className="ai-link" type="button" aria-label={t.nav.ai}>
              <span className="spark" aria-hidden="true">✦</span>
              <span>{t.nav.ai}</span>
            </button>
          </>
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
              <>
                <button
                  type="button"
                  className="nav-auth-btn btn-login"
                  onClick={() => openAuthModal('login')}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className="nav-auth-btn btn-register"
                  onClick={() => openAuthModal('register')}
                >
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar