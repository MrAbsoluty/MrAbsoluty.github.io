import { localeOptions } from '../locales'
import { useFavorites } from '../context/FavoritesContext'

function Navbar({
  t,
  locale,
  onLocaleChange,
  onPokedexClick,
  onHomeClick,
  onFavoritesClick,
  activeNav = 'home',
}) {
  const { favoritesCount } = useFavorites()

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
          className={activeNav === 'favorites' ? 'active' : ''}
          href="#favorites"
          onClick={handleFavoritesNavClick}
        >
          {t?.nav?.favorites || 'Favoritos'}
          {favoritesCount > 0 && activeNav !== 'favorites' && (
            <span className="nav-fav-badge" aria-label={`${favoritesCount} favoritos`}>
              {favoritesCount}
            </span>
          )}
        </a>
        <a href="#categories">{t.nav.competitive}</a>
        <a href="#categories">{t.nav.guide}</a>
      </nav>
      <div className="header-actions">
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
      </div>
    </header>
  )
}

export default Navbar