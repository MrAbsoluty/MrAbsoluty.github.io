import { useEffect, useRef, useState } from 'react'
import Footer from '../components/Footer'
import MoveCard from '../components/MoveCard'
import Navbar from '../components/Navbar'
import { getFeaturedMove, getMovesList } from '../services/pokeapi'
import { playBuscarSound, playButtonSound } from '../utils/audio'

const TYPE_OPTIONS = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'steel',
  'dark',
  'fairy',
]

const CATEGORY_OPTIONS = ['all', 'physical', 'special', 'status']

const POWER_OPTIONS = [
  { id: 'all', labelKey: 'all' },
  { id: 'status', labelKey: 'status' },
  { id: 'low', labelKey: 'low' },
  { id: 'medium', labelKey: 'medium' },
  { id: 'high', labelKey: 'high' },
  { id: 'extreme', labelKey: 'extreme' },
]

const PRIORITY_OPTIONS = [
  'all',
  '+4',
  '+3',
  '+2',
  '+1',
  '0',
  '-1',
  '-2',
  '-3',
  '-4',
  '-5',
  '-6',
]

function Moves({
  onMoveClick,
  onBack,
  onHomeClick,
  onPokedexClick,
  onFavoritesClick,
  t,
  locale,
  onLocaleChange,
}) {
  const [moves, setMoves] = useState([])
  const [featuredMove, setFeaturedMove] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPower, setSelectedPower] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')

  const [nextOffset, setNextOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const activeFetchIdRef = useRef(0)
  const searchDebounceRef = useRef(null)

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  // Cargar movimiento destacado al montar o cambiar idioma
  useEffect(() => {
    let isMounted = true
    getFeaturedMove(locale).then((feat) => {
      if (isMounted && feat) {
        setFeaturedMove(feat)
      }
    }).catch(() => {})
    return () => {
      isMounted = false
    }
  }, [locale])

  async function loadMoves(
    offset = 0,
    searchQuery = query,
    typeFilter = selectedType,
    catFilter = selectedCategory,
    powerFilter = selectedPower,
    priorityFilter = selectedPriority,
  ) {
    const fetchId = ++activeFetchIdRef.current

    if (offset === 0) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const result = await getMovesList({
        limit: 24,
        offset,
        query: searchQuery,
        type: typeFilter === 'all' ? '' : typeFilter,
        category: catFilter === 'all' ? '' : catFilter,
        power: powerFilter,
        priority: priorityFilter === 'all' ? '' : priorityFilter.replace('+', ''),
        locale,
        messages: t?.errors,
      })

      if (fetchId !== activeFetchIdRef.current) return

      setMoves((current) => (offset === 0 ? result.moves : [...current, ...result.moves]))
      setTotalCount(result.totalCount || 0)
      setHasMore(result.hasMore)
      setNextOffset(result.nextOffset)
    } catch (err) {
      if (fetchId === activeFetchIdRef.current) {
        setError(err)
      }
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  // Recarga al cambiar filtros o idioma
  useEffect(() => {
    loadMoves(0, query, selectedType, selectedCategory, selectedPower, selectedPriority)
  }, [locale, selectedType, selectedCategory, selectedPower, selectedPriority])

  // Búsqueda reactiva con debounce al tipear
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    searchDebounceRef.current = setTimeout(() => {
      loadMoves(0, query, selectedType, selectedCategory, selectedPower, selectedPriority)
    }, 280)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [query])

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    playBuscarSound()
    loadMoves(0, query, selectedType, selectedCategory, selectedPower, selectedPriority)
  }

  function handleClearSearch() {
    playButtonSound()
    setQuery('')
  }

  function handleClearAllFilters() {
    playButtonSound()
    setQuery('')
    setSelectedType('all')
    setSelectedCategory('all')
    setSelectedPower('all')
    setSelectedPriority('all')
  }

  function handleLoadMore() {
    if (hasMore && !isLoadingMore && nextOffset !== null) {
      playButtonSound()
      loadMoves(nextOffset, query, selectedType, selectedCategory, selectedPower, selectedPriority)
    }
  }

  const hasActiveFilters = Boolean(
    query.trim() ||
      selectedType !== 'all' ||
      selectedCategory !== 'all' ||
      selectedPower !== 'all' ||
      selectedPriority !== 'all',
  )

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        onHomeClick={onHomeClick}
        onPokedexClick={onPokedexClick}
        onFavoritesClick={onFavoritesClick}
        activeNav="moves"
      />

      <main className="moves-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t?.detail?.back || 'Volver'}
        </button>

        <header className="moves-header">
          <p className="eyebrow">{t?.moves?.eyebrow || 'MOVE DEX'}</p>
          <h1>
            {t?.moves?.title || 'Explora los'}{' '}
            <em>{t?.moves?.titleAccent || 'movimientos.'}</em>
          </h1>
          <p>{t?.moves?.description}</p>

          <div className="moves-search-wrapper">
            <form className="moves-search" role="search" onSubmit={handleSearchSubmit}>
              <span className="moves-search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t?.moves?.searchPlaceholder}
                aria-label={t?.moves?.searchPlaceholder}
              />
              {query && (
                <button
                  type="button"
                  className="moves-search-clear"
                  onClick={handleClearSearch}
                  title={t?.moves?.clearSearch || 'Borrar'}
                  aria-label={t?.moves?.clearSearch || 'Borrar'}
                >
                  ✕
                </button>
              )}
              <button type="submit" className="moves-search-submit">
                {t?.search?.button || 'Buscar'}
              </button>
            </form>
          </div>
        </header>

        {/* Sección de Filtros de Movimientos */}
        <section className="moves-filters-section" aria-label={t?.moves?.filterToggle}>
          <div className="moves-filter-groups">
            {/* Tipo */}
            <div className="moves-filter-field">
              <label htmlFor="move-filter-type">{t?.moves?.filterType || 'Tipo'}</label>
              <select
                id="move-filter-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">{t?.moves?.allTypes || 'Todos los tipos'}</option>
                {TYPE_OPTIONS.map((typeKey) => (
                  <option key={typeKey} value={typeKey}>
                    {t?.types?.[typeKey] || typeKey}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div className="moves-filter-field">
              <label htmlFor="move-filter-category">{t?.moves?.filterCategory || 'Categoría'}</label>
              <select
                id="move-filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">{t?.moves?.allCategories || 'Todas las categorías'}</option>
                {CATEGORY_OPTIONS.filter((c) => c !== 'all').map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {t?.moves?.categories?.[catKey] || catKey}
                  </option>
                ))}
              </select>
            </div>

            {/* Potencia */}
            <div className="moves-filter-field">
              <label htmlFor="move-filter-power">{t?.moves?.filterPower || 'Potencia'}</label>
              <select
                id="move-filter-power"
                value={selectedPower}
                onChange={(e) => setSelectedPower(e.target.value)}
              >
                {POWER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t?.moves?.powerRanges?.[opt.labelKey] || opt.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            <div className="moves-filter-field">
              <label htmlFor="move-filter-priority">{t?.moves?.filterPriority || 'Prioridad'}</label>
              <select
                id="move-filter-priority"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="all">{t?.moves?.allPriorities || 'Cualquier prioridad'}</option>
                {PRIORITY_OPTIONS.filter((p) => p !== 'all').map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="moves-filter-actions">
            <span className="moves-count-text">
              {hasActiveFilters
                ? (t?.moves?.countFiltered || '{count} encontrados').replace('{count}', totalCount)
                : (t?.moves?.countTotal || '{count} movimientos').replace('{count}', totalCount)}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                className="moves-clear-btn"
                onClick={handleClearAllFilters}
              >
                {t?.moves?.clearFilters || 'Limpiar filtros'}
              </button>
            )}
          </div>
        </section>

        {/* Movimiento Destacado (Factual & Determinista) */}
        {!hasActiveFilters && featuredMove && !isLoading && (
          <section className="featured-move-card" aria-label={t?.moves?.featuredMove}>
            <div>
              <span className="featured-move-tag">
                ◆ {t?.moves?.featuredMove || 'Movimiento destacado'}
              </span>
              <h2 className="featured-move-title">
                {featuredMove.displayName || featuredMove.localizedName}
              </h2>
              <p className="featured-move-subtitle">{featuredMove.originalName}</p>
              <p className="featured-move-desc">
                {featuredMove.effect || featuredMove.description}
              </p>
              <div className="featured-move-badges">
                <span className="move-type-badge">
                  {t?.types?.[featuredMove.type] || featuredMove.type}
                </span>
                <span className={`move-category-badge ${featuredMove.category}`}>
                  {t?.moves?.categories?.[featuredMove.category] || featuredMove.category}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="featured-move-stats">
                <div className="featured-stat-box">
                  <span className="featured-stat-value">
                    {featuredMove.power !== null && featuredMove.power > 0 ? featuredMove.power : '—'}
                  </span>
                  <span className="featured-stat-label">
                    {t?.moveDetail?.powerShort || 'POT'}
                  </span>
                </div>
                <div className="featured-stat-box">
                  <span className="featured-stat-value">
                    {featuredMove.accuracy !== null ? `${featuredMove.accuracy}%` : '—'}
                  </span>
                  <span className="featured-stat-label">
                    {t?.moveDetail?.accuracyShort || 'PREC'}
                  </span>
                </div>
                <div className="featured-stat-box">
                  <span className="featured-stat-value">{featuredMove.pp}</span>
                  <span className="featured-stat-label">
                    {t?.moveDetail?.ppShort || 'PP'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="featured-move-btn"
                onClick={() => {
                  playButtonSound()
                  onMoveClick?.(featuredMove.name)
                }}
              >
                {t?.moves?.viewMove || 'Ver movimiento'} ▸
              </button>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <div className="detail-state" style={{ margin: '40px 0' }}>
            <span className="error-mark" aria-hidden="true">!</span>
            <p className="eyebrow">{t?.moves?.eyebrow || 'MOVE DEX'}</p>
            <h1>
              {t?.moveDetail?.errorTitle || 'No pudimos cargar'} <br />
              <em>{t?.moveDetail?.errorAccent || 'los movimientos.'}</em>
            </h1>
            <p>{error?.message || t?.errors?.network}</p>
            <div className="detail-actions">
              <button
                className="primary-action"
                type="button"
                onClick={() => loadMoves(0, query, selectedType, selectedCategory, selectedPower, selectedPriority)}
              >
                {t?.moves?.retry || 'Reintentar'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && moves.length === 0 && (
          <div className="detail-state" style={{ margin: '40px 0' }}>
            <span className="error-mark" aria-hidden="true">⌕</span>
            <p className="eyebrow">{t?.moves?.eyebrow || 'MOVE DEX'}</p>
            <h1>
              {t?.moveDetail?.errorTitle || 'Sin resultados'} <br />
              <em>{t?.moveDetail?.errorAccent || 'de movimientos.'}</em>
            </h1>
            <p>{t?.moves?.empty || 'No encontramos movimientos que coincidan con tu búsqueda.'}</p>
            <div className="detail-actions">
              <button
                className="primary-action"
                type="button"
                onClick={handleClearAllFilters}
              >
                {t?.moves?.clearFilters || 'Limpiar filtros'}
              </button>
            </div>
          </div>
        )}

        {/* Grid de Movimientos */}
        <section className="moves-grid" aria-label={t?.moves?.eyebrow}>
          {isLoading && moves.length === 0
            ? Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="move-card move-card-skeleton" aria-hidden="true" />
              ))
            : moves.map((move) => (
                <MoveCard
                  key={move.name}
                  move={move}
                  t={t}
                  onClick={(slug) => onMoveClick?.(slug)}
                />
              ))}
        </section>

        {/* Paginación */}
        {hasMore && !isLoading && (
          <div className="moves-pagination-wrapper">
            <button
              type="button"
              className="moves-load-more-btn"
              disabled={isLoadingMore}
              onClick={handleLoadMore}
            >
              {isLoadingMore
                ? (t?.moves?.loading || 'Cargando...')
                : (t?.moves?.loadMore || 'Cargar más movimientos')}
            </button>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  )
}

export default Moves
