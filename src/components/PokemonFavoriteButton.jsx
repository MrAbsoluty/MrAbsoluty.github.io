import { useState, useRef, useEffect } from 'react'
import { useFavorites } from '../context/FavoritesContext'
import { playButtonSound, playFavoritoSound } from '../utils/audio'

export default function PokemonFavoriteButton({
  pokemon,
  size = 'medium',
  className = '',
  t,
}) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [animating, setAnimating] = useState(null)
  const timerRef = useRef(null)

  const active = Boolean(pokemon && isFavorite(pokemon))

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  if (!pokemon) return null

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    const willBeFavorite = !active
    if (willBeFavorite) {
      playFavoritoSound()
    } else {
      playButtonSound()
    }

    setAnimating(willBeFavorite ? 'add' : 'remove')
    toggleFavorite(pokemon)

    timerRef.current = setTimeout(
      () => {
        setAnimating(null)
      },
      willBeFavorite ? 500 : 350,
    )
  }

  const label = active
    ? (typeof t === 'function' ? t('favorites.remove') : (t?.favorites?.remove || 'Quitar de favoritos'))
    : (typeof t === 'function' ? t('favorites.add') : (t?.favorites?.add || 'Agregar a favoritos'))

  return (
    <button
      type="button"
      className={`pokemon-favorite-btn size-${size} ${active ? 'is-favorite' : ''} ${animating === 'add' ? 'is-animating-add' : ''} ${animating === 'remove' ? 'is-animating-remove' : ''} ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <svg
        className="fav-star-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      {animating === 'add' && (
        <span className="fav-sparkles" aria-hidden="true">
          <span className="fav-sparkle sp-1">✦</span>
          <span className="fav-sparkle sp-2">✧</span>
          <span className="fav-sparkle sp-3">✦</span>
          <span className="fav-sparkle sp-4">✧</span>
        </span>
      )}
    </button>
  )
}
