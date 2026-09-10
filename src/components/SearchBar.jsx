import { useEffect, useRef, useState } from 'react'
import { getPokemonIndex, normalizeSearchText } from '../services/pokeapi'
import { playBuscarSound } from '../utils/audio'
import PokemonFavoriteButton from './PokemonFavoriteButton'

function SearchBar({
  onSearch,
  isLoading = false,
  t,
  locale,
  onRandom,
  onQueryChange,
  placeholder,
  initialQuery = '',
}) {
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [pokemonIndex, setPokemonIndex] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery)
    setQuery(initialQuery)
  }

  useEffect(() => {
    getPokemonIndex(locale).then(setPokemonIndex).catch(() => setPokemonIndex([]))
  }, [locale])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const suggestions = query.trim()
    ? (() => {
      const normalizedQuery = normalizeSearchText(query)
      const matches = pokemonIndex.filter((pokemon) => pokemon.searchNames.some((name) => name.includes(normalizedQuery)))
      return [...matches.filter((pokemon) => normalizeSearchText(pokemon.displayName).startsWith(normalizedQuery)), ...matches.filter((pokemon) => !normalizeSearchText(pokemon.displayName).startsWith(normalizedQuery))].slice(0, 6)
    })()
    : []

  function submitSearch(value = query) {
    playBuscarSound()
    setIsOpen(false)
    setActiveIndex(-1)
    onQueryChange?.(value)
    onSearch(value)
  }

  function handleSubmit(event) {
    event.preventDefault()
    submitSearch(suggestions[activeIndex]?.apiName || query)
  }

  function handleRandom(event) {
    event?.preventDefault()
    if (isLoading) return
    playBuscarSound()
    setIsOpen(false)
    setActiveIndex(-1)

    if (onRandom) {
      onRandom()
      return
    }

    if (pokemonIndex && pokemonIndex.length > 0) {
      const randomIndex = Math.floor(Math.random() * pokemonIndex.length)
      const chosen = pokemonIndex[randomIndex]
      onSearch(chosen.apiName || String(chosen.id))
    } else {
      const randomId = Math.floor(Math.random() * 1025) + 1
      onSearch(String(randomId))
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
    }
    if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
    }
    if (event.key === 'Escape') setIsOpen(false)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} ref={containerRef}>
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          const val = event.target.value
          setQuery(val)
          setActiveIndex(-1)
          setIsOpen(true)
          onQueryChange?.(val)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t.search.placeholder}
        aria-label={t.search.aria}
        aria-expanded={isOpen && suggestions.length > 0}
        aria-controls="pokemon-suggestions"
        disabled={isLoading}
      />
      <button type="button" className="search-random-btn" title={t.search.random || 'Pokémon aleatorio'} aria-label={t.search.random || 'Pokémon aleatorio'} disabled={isLoading} onClick={handleRandom}>
        <svg className="random-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      </button>
      <button type="submit" aria-label={t.search.button} disabled={isLoading} onClick={playBuscarSound}>{isLoading ? t.search.loading : t.search.button} <span aria-hidden="true">↗</span></button>
      {isOpen && suggestions.length > 0 && (
        <ul className="suggestions-list" id="pokemon-suggestions" aria-label={t.search.suggestions}>
          {suggestions.map((pokemon, index) => (
            <li key={pokemon.apiName}>
              <div className="search-suggestion-item">
                <button
                  type="button"
                  className={index === activeIndex ? 'active' : ''}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery(pokemon.displayName)
                    submitSearch(pokemon.apiName)
                  }}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                    alt=""
                  />
                  <span>{pokemon.displayName}</span>
                  <small>#{String(pokemon.id).padStart(3, '0')}</small>
                </button>
                <PokemonFavoriteButton
                  pokemon={{ id: pokemon.id, name: pokemon.displayName || pokemon.apiName }}
                  size="small"
                  t={t}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}

export default SearchBar