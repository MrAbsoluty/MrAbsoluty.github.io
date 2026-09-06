import { useEffect, useState } from 'react'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import PokemonDetail from './pages/PokemonDetail'
import { defaultLocale, getTranslations } from './locales'
import { getItem, getPokemon } from './services/pokeapi'
import './App.css'

function getInitialLocale() {
  const savedLocale = window.localStorage.getItem('pokeguide-locale')
  return ['es', 'es-419', 'en'].includes(savedLocale) ? savedLocale : defaultLocale
}

function App() {
  const [view, setView] = useState('home')
  const [pokemon, setPokemon] = useState(null)
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [locale, setLocale] = useState(getInitialLocale)
  const t = getTranslations(locale)

  useEffect(() => {
    function handlePopState() {
      setView('home')
      setPokemon(null)
      setItem(null)
      setError(null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  async function handleSearch(query) {
    setView('detail')
    setPokemon(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getPokemon(query, locale, t.errors)
      setPokemon(result)
      window.history.pushState({}, '', `#pokemon/${result.name}`)
    } catch (searchError) {
      setError(searchError)
      window.history.pushState({}, '', '#pokemon/not-found')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleItemClick(name) {
    setView('item-detail')
    setItem(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getItem(name, locale, t.errors)
      setItem(result)
      window.history.pushState({}, '', `#item/${result.name}`)
    } catch (itemError) {
      setError(itemError)
      window.history.pushState({}, '', '#item/not-found')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLocaleChange(nextLocale) {
    setLocale(nextLocale)
    window.localStorage.setItem('pokeguide-locale', nextLocale)

    if (view === 'detail' && pokemon) {
      setIsLoading(true)
      setError(null)
      try {
        setPokemon(await getPokemon(pokemon.name, nextLocale, getTranslations(nextLocale).errors))
      } catch (searchError) {
        setError(searchError)
      } finally {
        setIsLoading(false)
      }
    }

    if (view === 'item-detail' && item) {
      setIsLoading(true)
      setError(null)
      try {
        setItem(await getItem(item.name, nextLocale, getTranslations(nextLocale).errors))
      } catch (itemError) {
        setError(itemError)
      } finally {
        setIsLoading(false)
      }
    }
  }

  function handleBack() {
    setView('home')
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '#top')
  }

  if (view === 'item-detail') {
    return <ItemDetail item={item} error={error} isLoading={isLoading} onBack={handleBack} t={t} locale={locale} onLocaleChange={handleLocaleChange} />
  }

  if (view === 'detail') {
    return <PokemonDetail pokemon={pokemon} error={error} isLoading={isLoading} onBack={handleBack} t={t} locale={locale} onLocaleChange={handleLocaleChange} />
  }

  return <Home onSearch={handleSearch} onItemClick={handleItemClick} isLoading={isLoading} t={t} locale={locale} onLocaleChange={handleLocaleChange} />
}

export default App
