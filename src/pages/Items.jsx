import { useEffect, useMemo, useRef, useState } from 'react'
import Footer from '../components/Footer'
import ItemCard from '../components/ItemCard'
import Navbar from '../components/Navbar'
import {
  getItems,
  HIDDEN_ITEM_CATEGORIES,
  QUICK_ITEM_CATEGORIES,
  searchItemsCatalog,
} from '../services/pokeapi'
import { itemCategoriesEs } from '../locales/itemCatalogEs'
import { playBuscarSound, playButtonSound } from '../utils/audio'

const PILL_OPTIONS = [
  { id: 'all', icon: '🌐' },
  { id: 'balls', icon: '🔴' },
  { id: 'healing', icon: '💖' },
  { id: 'battle', icon: '⚔️' },
  { id: 'evolution', icon: '🧬' },
  { id: 'berries', icon: '🍒' },
  { id: 'vitamins', icon: '💊' },
  { id: 'key', icon: '🗝️' },
]

// Se mantiene una sola fuente para la relación entre filtros rápidos y las
// categorías reales de PokéAPI. Antes esta lista y la del servicio podían
// divergir, dejando objetos fuera de una píldora aunque sí pertenecieran al
// grupo.
const QUICK_CATEGORY_MAP = {
  ...QUICK_ITEM_CATEGORIES,
}

function getActivePillId(category) {
  if (!category || category === 'all') return 'all'
  for (const [pillId, slugs] of Object.entries(QUICK_CATEGORY_MAP)) {
    if (slugs.includes(category)) return pillId
  }
  return null
}

function Items({ onItemClick, onBack, t, locale, onLocaleChange }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [nextOffset, setNextOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const activeFetchIdRef = useRef(0)
  const searchDebounceRef = useRef(null)
  const isSearchActiveRef = useRef(false)

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  async function loadItems(offset = 0, category = selectedCategory) {
    const fetchId = ++activeFetchIdRef.current

    if (offset === 0) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const result = await getItems({
        category,
        limit: 40,
        offset,
        locale,
        messages: t.errors,
      })

      if (fetchId !== activeFetchIdRef.current) return

      setItems((current) => offset === 0 ? result.items : [...current, ...result.items])
      setNextOffset(result.nextOffset)
      setTotalCount(result.totalCount || 0)
    } catch (loadError) {
      if (fetchId === activeFetchIdRef.current) {
        setError(loadError)
      }
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    loadItems(0, selectedCategory)
  }, [locale])

  // Búsqueda reactiva con debounce automático al escribir
  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      if (isSearchActiveRef.current) {
        isSearchActiveRef.current = false
        loadItems(0, selectedCategory)
      }
      return
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    searchDebounceRef.current = setTimeout(async () => {
      isSearchActiveRef.current = true
      const fetchId = ++activeFetchIdRef.current
      setIsLoading(true)
      setError(null)

      try {
        const searchResult = await searchItemsCatalog(trimmed, locale, t.errors)
        if (fetchId !== activeFetchIdRef.current) return

        setItems(searchResult.items || [])
        setTotalCount(searchResult.totalCount || 0)
        setNextOffset(null)
      } catch (searchErr) {
        if (fetchId === activeFetchIdRef.current) {
          setError(searchErr)
        }
      } finally {
        if (fetchId === activeFetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }, 280)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [query, locale, t.errors, selectedCategory])

  function handleClearSearch() {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    playButtonSound()
    setQuery('')
    isSearchActiveRef.current = false
    loadItems(0, selectedCategory)
  }

  function handleClearAllFilters() {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    playButtonSound()
    setQuery('')
    isSearchActiveRef.current = false
    setSelectedCategory('all')
    loadItems(0, 'all')
  }

  function handlePillClick(pillId) {
    if (pillId === selectedCategory && !query) return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    playButtonSound()
    setSelectedCategory(pillId)
    setQuery('')
    isSearchActiveRef.current = false
    loadItems(0, pillId)
  }

  function handleCategorySelectChange(event) {
    const val = event.target.value
    if (val === selectedCategory && !query) return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    playButtonSound()
    setSelectedCategory(val)
    setQuery('')
    isSearchActiveRef.current = false
    loadItems(0, val)
  }

  async function handleSearchSubmit(event) {
    event?.preventDefault()
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    playBuscarSound()

    const trimmed = query.trim()
    if (!trimmed) {
      isSearchActiveRef.current = false
      loadItems(0, selectedCategory)
      return
    }

    isSearchActiveRef.current = true
    const fetchId = ++activeFetchIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const searchResult = await searchItemsCatalog(trimmed, locale, t.errors)
      if (fetchId !== activeFetchIdRef.current) return

      setItems(searchResult.items || [])
      setTotalCount(searchResult.totalCount || 0)
      setNextOffset(null)
    } catch (searchErr) {
      if (fetchId === activeFetchIdRef.current) {
        setError(searchErr)
      }
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  const activePillId = useMemo(() => getActivePillId(selectedCategory), [selectedCategory])

  // Lista de todas las categorías disponibles traducidas
  const allCategoryOptions = useMemo(() => {
    return Object.entries(itemCategoriesEs)
      .filter(([slug]) => !HIDDEN_ITEM_CATEGORIES.has(slug))
      .map(([slug, esName]) => ({
        slug,
        name: locale.startsWith('es')
          ? esName
          : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [locale])

  // La búsqueda ya se resuelve en el catálogo (incluye nombres en español,
  // alias y búsquedas por categoría). Volver a filtrar aquí con el slug inglés
  // eliminaba resultados válidos como “stone” → “Piedra Solar” o consultas
  // semánticas como “fuego”.
  const filteredItems = items

  const hasActiveFilters = Boolean(query.trim() || (selectedCategory && selectedCategory !== 'all'))

  return (
    <div className="page-shell">
      <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} />

      <main className="items-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t.detail.back}
        </button>

        <header className="items-header">
          <p className="eyebrow">{t.items.eyebrow}</p>
          <h1>
            {t.items.title} <em>{t.items.titleAccent}</em>
          </h1>
          <p>{t.items.description}</p>

          {/* Barra de búsqueda interactiva y mejorada */}
          <div className="items-search-wrapper">
            <form
              className="items-search"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <span className="items-search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.items.searchPlaceholder}
                aria-label={t.items.searchPlaceholder}
              />
              {query && (
                <button
                  type="button"
                  className="items-search-clear"
                  onClick={handleClearSearch}
                  title={t.items.clearSearch || 'Borrar texto'}
                  aria-label={t.items.clearSearch || 'Borrar texto'}
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="items-search-submit"
              >
                {t.search.button}
              </button>
            </form>
          </div>
        </header>

        {/* Sección de Filtros de Objetos */}
        <section className="items-filters-section" aria-label={t.items.filterCategory}>
          {/* Píldoras de filtrado rápido */}
          <div className="items-pills-row" role="tablist" aria-label={t.items.filterCategory}>
            {PILL_OPTIONS.map((pill) => {
              const label = t.items.quickFilters?.[pill.id] || pill.id
              const isActive = activePillId === pill.id

              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`items-filter-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handlePillClick(pill.id)}
                >
                  <span className="pill-icon" aria-hidden="true">{pill.icon}</span>
                  <span className="pill-label">{label}</span>
                </button>
              )
            })}
          </div>

          {/* Barra de herramientas: selector fino de categoría y contador dinámico */}
          <div className="items-filters-toolbar">
            <div className="items-select-group">
              <label htmlFor="items-cat-select" className="items-select-label">
                {t.items.filterCategory}:
              </label>
              <select
                id="items-cat-select"
                className="items-category-select"
                value={selectedCategory}
                onChange={handleCategorySelectChange}
              >
                <option value="all">{t.items.allCategories}</option>
                <optgroup label={locale.startsWith('es') ? 'Grupos principales' : 'Main Groups'}>
                  <option value="balls">🔴 {t.items.quickFilters?.balls || 'Poké Balls'} ({locale.startsWith('es') ? 'Todas' : 'All'})</option>
                  <option value="healing">💖 {t.items.quickFilters?.healing || 'Curación y Medicina'}</option>
                  <option value="battle">⚔️ {t.items.quickFilters?.battle || 'Combate y Equipables'}</option>
                  <option value="evolution">🧬 {t.items.quickFilters?.evolution || 'Evolución y Piedras'}</option>
                  <option value="berries">🍒 {t.items.quickFilters?.berries || 'Bayas'} ({locale.startsWith('es') ? 'Todas' : 'All'})</option>
                  <option value="vitamins">💊 {t.items.quickFilters?.vitamins || 'Vitaminas y Mentas'}</option>
                  <option value="key">🗝️ {t.items.quickFilters?.key || 'Objetos Clave'}</option>
                </optgroup>
                <optgroup label={locale.startsWith('es') ? 'Categorías detalladas' : 'Detailed Categories'}>
                  {allCategoryOptions.map(({ slug, name }) => (
                    <option key={slug} value={slug}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="items-toolbar-meta">
              <div className="items-count-badge" aria-live="polite">
                <strong>
                  {query.trim()
                    ? (t.items.countFiltered || '{count} objetos encontrados').replace(
                        '{count}',
                        filteredItems.length.toLocaleString()
                      )
                    : (t.items.countTotal || '{count} objetos').replace(
                        '{count}',
                        (totalCount || items.length).toLocaleString()
                      )}
                </strong>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="items-clear-filters-btn"
                  onClick={handleClearAllFilters}
                >
                  ✕ {t.items.clearFilters}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Estado de Error */}
        {error && (
          <div className="items-state">
            <span className="error-mark">!</span>
            <p>{error.message}</p>
            <button
              className="primary-action"
              type="button"
              onClick={() => loadItems(0, selectedCategory)}
            >
              {t.items.retry}
            </button>
          </div>
        )}

        {/* Estado de Carga Inicial */}
        {isLoading && items.length === 0 && (
          <div className="items-state">
            <div className="loader-orbit" aria-hidden="true"><span /></div>
            <p>{t.items.loading}</p>
          </div>
        )}

        {/* Estado Vacío por Búsqueda o Filtros */}
        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="items-state items-empty-state">
            <span className="items-empty-icon" aria-hidden="true">🔍</span>
            <p>{t.items.empty}</p>
            {hasActiveFilters && (
              <button
                type="button"
                className="primary-action"
                onClick={handleClearAllFilters}
              >
                {t.items.clearFilters}
              </button>
            )}
          </div>
        )}

        {/* Cuadrícula de Objetos */}
        {filteredItems.length > 0 && (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                {...item}
                category={item.category}
                onClick={() => onItemClick(item.name)}
              />
            ))}
          </div>
        )}

        {/* Botón de Cargar Más */}
        {nextOffset !== null && !query && (
          <button
            className="load-more"
            type="button"
            onClick={() => loadItems(nextOffset, selectedCategory)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? t.items.loading : t.items.loadMore}
          </button>
        )}
      </main>

      <Footer t={t} />
    </div>
  )
}

export default Items