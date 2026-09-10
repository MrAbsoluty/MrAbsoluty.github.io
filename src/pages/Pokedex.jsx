import { useCallback, useEffect, useRef, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import PokedexCard from '../components/PokedexCard'
import PokedexFilters from '../components/PokedexFilters'
import SearchBar from '../components/SearchBar'
import { getPokedexList } from '../services/pokeapi'
import { playBuscarSound, playButtonSound } from '../utils/audio'

function Pokedex({
  onPokemonClick,
  onBack,
  onHomeClick,
  onFavoritesClick,
  t,
  locale,
  onLocaleChange,
}) {
  const [pokemonList, setPokemonList] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  // Filter & Search states
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedGen, setSelectedGen] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [isShiny, setIsShiny] = useState(false)

  const activeFetchIdRef = useRef(0)

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  // Load Pokédex batch
  const loadData = useCallback(async (offset = 0, isInitial = false) => {
    const fetchId = ++activeFetchIdRef.current

    if (isInitial) {
      setIsLoadingInitial(true)
      setError(null)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const result = await getPokedexList({
        limit: 24,
        offset,
        query,
        type: selectedType,
        generation: selectedGen,
        region: selectedRegion,
        locale,
        messages: t.errors,
      })

      // Guard against race conditions if filters changed quickly
      if (fetchId !== activeFetchIdRef.current) return

      if (offset === 0) {
        setPokemonList(result.pokemon)
      } else {
        setPokemonList((current) => [...current, ...result.pokemon])
      }

      setFilteredItems(result.filteredItems || [])
      setTotalCount(result.totalCount || 0)
      setHasMore(result.hasMore)
      setNextOffset(result.nextOffset)
    } catch (err) {
      if (fetchId === activeFetchIdRef.current) {
        setError(err)
      }
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setIsLoadingInitial(false)
        setIsLoadingMore(false)
      }
    }
  }, [query, selectedType, selectedGen, selectedRegion, locale, t.errors])

  // Re-fetch when filters, query, or locale change (with debounce on text search)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(0, true)
    }, query ? 250 : 0)

    return () => clearTimeout(timer)
  }, [loadData, query])

  // Smart random: picks from filtered list respecting all active criteria
  function handleSmartRandom() {
    playBuscarSound()

    if (filteredItems && filteredItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredItems.length)
      const chosen = filteredItems[randomIndex]
      onPokemonClick?.(chosen.apiName || String(chosen.id))
    } else {
      const fallbackId = Math.floor(Math.random() * 1025) + 1
      onPokemonClick?.(String(fallbackId))
    }
  }

  function handleClearFilters() {
    playButtonSound()
    setQuery('')
    setSelectedType('')
    setSelectedGen('')
    setSelectedRegion('')
  }

  function handleSearchSubmit(searchVal) {
    if (!searchVal) return
    onPokemonClick?.(searchVal)
  }

  const hasFilters = Boolean(query || selectedType || selectedGen || selectedRegion)

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        activeNav="pokedex"
        onHomeClick={onHomeClick}
        onFavoritesClick={onFavoritesClick}
      />

      <main className="pokedex-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t.detail.back}
        </button>

        <header className="pokedex-header">
          <p className="eyebrow">{t.pokedex.eyebrow}</p>
          <h1>
            {t.pokedex.title} <em>{t.pokedex.titleAccent}</em>
          </h1>
          <p className="pokedex-subtitle">{t.pokedex.subtitle}</p>

          <div className="pokedex-search-wrapper">
            <SearchBar
              onSearch={handleSearchSubmit}
              onRandom={handleSmartRandom}
              onQueryChange={setQuery}
              initialQuery={query}
              placeholder={t.pokedex.searchPlaceholder}
              t={t}
              locale={locale}
              isLoading={isLoadingInitial}
            />
          </div>
        </header>

        <PokedexFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedGen={selectedGen}
          onGenChange={setSelectedGen}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          isShiny={isShiny}
          onToggleShiny={() => setIsShiny((prev) => !prev)}
          onClearFilters={handleClearFilters}
          totalCount={totalCount}
          hasFilters={hasFilters}
          t={t}
        />

        {/* Error State */}
        {error && (
          <div className="pokedex-state">
            <span className="error-mark">!</span>
            <p>{error.message || t.errors.api}</p>
            <button
              className="primary-action"
              type="button"
              onClick={() => loadData(0, true)}
            >
              {t.pokedex.retry}
            </button>
          </div>
        )}

        {/* Initial Loading Skeletons */}
        {isLoadingInitial && (
          <div className="pokemon-grid pokedex-grid" aria-busy="true">
            {Array.from({ length: 12 }).map((_, index) => (
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
        {!isLoadingInitial && !error && pokemonList.length === 0 && (
          <div className="pokedex-state">
            <p>{t.pokedex.empty}</p>
            {hasFilters && (
              <button
                className="primary-action"
                type="button"
                onClick={handleClearFilters}
              >
                {t.pokedex.clearFilters}
              </button>
            )}
          </div>
        )}

        {/* Pokémon Grid */}
        {!isLoadingInitial && pokemonList.length > 0 && (
          <div className="pokemon-grid pokedex-grid" role="region" aria-label={t.pokedex.title}>
            {pokemonList.map((poke) => (
              <PokedexCard
                key={poke.id}
                pokemon={poke}
                isShiny={isShiny}
                onClick={onPokemonClick}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoadingInitial && (
          <div className="pokedex-pagination">
            <button
              className="load-more"
              type="button"
              onClick={() => loadData(nextOffset, false)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t.pokedex.loading : t.pokedex.loadMore}
            </button>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  )
}

export default Pokedex
