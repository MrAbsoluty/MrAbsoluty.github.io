import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import ItemCard from '../components/ItemCard'
import Navbar from '../components/Navbar'
import { getItems, normalizeSearchText } from '../services/pokeapi'
import { playBuscarSound, playButtonSound } from '../utils/audio'

function Items({ onItemClick, onBack, t, locale, onLocaleChange }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [nextOffset, setNextOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  async function loadItems(offset = 0) {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getItems({ offset, locale, messages: t.errors })
      setItems((current) => offset === 0 ? result.items : [...current, ...result.items])
      setNextOffset(result.nextOffset)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadItems(0) }, [locale])

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery) return items
    return items.filter((item) => normalizeSearchText(`${item.name} ${item.localizedName}`).includes(normalizedQuery))
  }, [items, query])

  return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="items-page"><button className="back-link" type="button" onClick={handleBackClick}><span aria-hidden="true">←</span> {t.detail.back}</button><header className="items-header"><p className="eyebrow">{t.items.eyebrow}</p><h1>{t.items.title} <em>{t.items.titleAccent}</em></h1><p>{t.items.description}</p><form className="items-search" onSubmit={(event) => event.preventDefault()}><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.items.searchPlaceholder} aria-label={t.items.searchPlaceholder} /><button type="submit" onClick={playBuscarSound}>{t.search.button}</button></form></header>{error && <div className="items-state"><span className="error-mark">!</span><p>{error.message}</p><button className="primary-action" type="button" onClick={() => loadItems(0)}>{t.items.retry}</button></div>}{isLoading && items.length === 0 && <div className="items-state"><div className="loader-orbit" aria-hidden="true"><span /></div><p>{t.items.loading}</p></div>}{!isLoading && !error && filteredItems.length === 0 && <div className="items-state"><p>{t.items.empty}</p></div>}{filteredItems.length > 0 && <div className="items-grid">{filteredItems.map((item) => <ItemCard key={item.id} {...item} category={item.category} onClick={() => onItemClick(item.name)} />)}</div>}{nextOffset !== null && !query && <button className="load-more" type="button" onClick={() => loadItems(nextOffset)} disabled={isLoading}>{isLoading ? t.items.loading : t.items.loadMore}</button>}</main><Footer t={t} /></div>
}

export default Items