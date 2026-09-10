import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import PokedexCard from '../components/PokedexCard'
import { useFavorites } from '../context/FavoritesContext'
import { getPokedexCard } from '../services/pokeapi'
import { playButtonSound } from '../utils/audio'

function Favorites({
  onPokemonClick,
  onBack,
  onHomeClick,
  onPokedexClick,
  t,
  locale,
  onLocaleChange,
}) {
  const { favorites, favoritesCount, markFavoritesAsSeen } = useFavorites()
  const [cards, setCards] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Marcar automáticamente como vistos al entrar a la página de favoritos
  useEffect(() => {
    markFavoritesAsSeen?.()
  }, [markFavoritesAsSeen, favorites.length])

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  function handleExploreClick() {
    playButtonSound()
    onPokedexClick?.()
  }

  // Cargar datos completos para cada Pokémon favorito
  useEffect(() => {
    let isCurrent = true

    if (favorites.length === 0) {
      setCards([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const promises = favorites.map(async (fav) => {
      const identifier = fav.id || fav.name
      try {
        return await getPokedexCard(identifier, locale)
      } catch (err) {
        console.warn(`Error al cargar tarjeta de favorito (${identifier}):`, err)
        return null
      }
    })

    Promise.all(promises).then((results) => {
      if (!isCurrent) return
      // Filtrar los que hayan fallado
      setCards(results.filter(Boolean))
      setIsLoading(false)
    })

    return () => {
      isCurrent = false
    }
  }, [favorites, locale])

  const countText = (t?.favorites?.count || '{count} guardados').replace(
    '{count}',
    favoritesCount,
  )

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        activeNav="favorites"
        onHomeClick={onHomeClick}
        onPokedexClick={onPokedexClick}
      />

      <main className="favorites-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t?.detail?.back || 'Volver'}
        </button>

        <header className="favorites-header">
          <p className="eyebrow">{t?.favorites?.eyebrow || 'COLECCIÓN PERSONAL'}</p>
          <h1>
            {t?.favorites?.title || 'Tus Pokémon'}{' '}
            <em>{t?.favorites?.titleAccent || 'favoritos.'}</em>
          </h1>

          <div className="favorites-header-meta">
            <p className="favorites-subtitle">
              {t?.favorites?.subtitle ||
                'Accede rápidamente a tus compañeros guardados para consultar sus perfiles.'}
            </p>
            {favoritesCount > 0 && (
              <div className="favorites-count-pill" aria-label={countText}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{countText}</span>
              </div>
            )}
          </div>
        </header>

        {/* Loading Skeletons */}
        {isLoading && cards.length === 0 && (
          <div className="pokemon-grid pokedex-grid" aria-busy="true">
            {Array.from({ length: Math.min(favoritesCount || 4, 8) }).map((_, index) => (
              <div key={index} className="pokemon-card pokedex-skeleton-card" aria-hidden="true">
                <div className="pokemon-meta">
                  <span className="skeleton-line skeleton-id" />
                  <span className="skeleton-line skeleton-type" />
                </div>
                <div className="skeleton-art-circle" />
                <div className="pokemon-name">
                  <span className="skeleton-line skeleton-name" />
                  <span className="skeleton-line skeleton-arrow" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && favoritesCount === 0 && (
          <div className="favorites-empty-card">
            <div className="favorites-empty-icon-wrap" aria-hidden="true">
              <span className="favorites-empty-icon">★</span>
            </div>
            <h3>{t?.favorites?.empty || 'No tienes Pokémon favoritos todavía.'}</h3>
            <p>
              {t?.favorites?.emptySubtitle ||
                'Explora la Pokédex o busca cualquier especie y presiona la estrella para guardarla en tu colección.'}
            </p>
            <button
              className="primary-action favorites-explore-btn"
              type="button"
              onClick={handleExploreClick}
            >
              {t?.favorites?.explorePokedex || 'Explorar Pokédex'}
              <span aria-hidden="true"> ↗</span>
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {cards.length > 0 && (
          <div
            className="pokemon-grid pokedex-grid"
            role="region"
            aria-label={t?.favorites?.title || 'Favoritos'}
          >
            {cards.map((card) => (
              <PokedexCard
                key={card.id}
                pokemon={card}
                onClick={onPokemonClick}
                t={t}
              />
            ))}
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  )
}

export default Favorites
