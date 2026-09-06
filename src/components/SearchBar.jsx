import { useEffect, useRef, useState } from 'react'
import { getPokemonIndex, normalizeSearchText } from '../services/pokeapi'

function formatName(name) {
  return name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function SearchBar({ onSearch, isLoading = false, t, locale }) {
  const [query, setQuery] = useState('')
  const [pokemonIndex, setPokemonIndex] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

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
    setIsOpen(false)
    setActiveIndex(-1)
    onSearch(value)
  }

  function handleSubmit(event) {
    event.preventDefault()
    submitSearch(suggestions[activeIndex]?.apiName || query)
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
      <input type="search" value={query} onFocus={() => setIsOpen(true)} onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setIsOpen(true) }} onKeyDown={handleKeyDown} placeholder={t.search.placeholder} aria-label={t.search.aria} aria-expanded={isOpen && suggestions.length > 0} aria-controls="pokemon-suggestions" disabled={isLoading} />
      <button type="submit" aria-label={t.search.button} disabled={isLoading}>{isLoading ? t.search.loading : t.search.button} <span aria-hidden="true">↗</span></button>
      {isOpen && suggestions.length > 0 && <ul className="suggestions-list" id="pokemon-suggestions" aria-label={t.search.suggestions}>{suggestions.map((pokemon, index) => <li key={pokemon.apiName}><button type="button" className={index === activeIndex ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(pokemon.displayName); submitSearch(pokemon.apiName) }}><img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt="" /><span>{pokemon.displayName}</span><small>#{String(pokemon.id).padStart(3, '0')}</small></button></li>)}</ul>}
    </form>
  )
}

export default SearchBar