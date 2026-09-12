import { useEffect, useState } from 'react'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import Items from './pages/Items'
import Pokedex from './pages/Pokedex'
import PokemonDetail from './pages/PokemonDetail'
import { defaultLocale, getTranslations } from './locales'
import { getItem, getPokemon } from './services/pokeapi'
import MusicPlayer from './components/MusicPlayer'
import AuthModal from './components/auth/AuthModal'
import UsernameSetupModal from './components/auth/UsernameSetupModal'
import ProfileModal from './components/profile/ProfileModal'
import UserProfileModal from './components/profile/UserProfileModal'
import SettingsModal from './components/profile/SettingsModal'
import SocialModal from './components/social/SocialModal'
import SocialToast from './components/social/SocialToast'
import FloatingChat from './components/social/FloatingChat'
import FollowersModal from './components/social/FollowersModal'
import FollowingModal from './components/social/FollowingModal'
import FollowRequestsModal from './components/social/FollowRequestsModal'
import PrivacySettingsModal from './components/social/PrivacySettingsModal'
import UserSearchModal from './components/social/UserSearchModal'
import { useAuth } from './context/AuthContext'
import './styles/profile.css'
import './styles/social.css'
import './App.css'

function getInitialLocale() {
  const savedLocale = window.localStorage.getItem('pokeguide-locale')
  return ['es', 'es-419', 'en'].includes(savedLocale) ? savedLocale : defaultLocale
}

function App() {
  const { openUserProfile } = useAuth()
  const [view, setView] = useState('home')
  const [pokemon, setPokemon] = useState(null)
  const [item, setItem] = useState(null)
  const [itemReturnView, setItemReturnView] = useState('home')
  const [pokemonReturnView, setPokemonReturnView] = useState('home')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [locale, setLocale] = useState(getInitialLocale)
  const t = getTranslations(locale)

  async function loadPokemonByQuery(query, pushHistory = true) {
    setView('detail')
    setPokemon(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getPokemon(query, locale, t.errors)
      setPokemon(result)
      if (pushHistory) {
        window.history.pushState({}, '', `#pokemon/${result.name}`)
      }
    } catch (searchError) {
      console.error('SEARCH ERROR IN APP:', searchError)
      setError(searchError)
      if (pushHistory) {
        window.history.pushState({}, '', '#pokemon/not-found')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function loadItemByName(name, pushHistory = true) {
    setView('item-detail')
    setItem(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getItem(name, locale, t.errors)
      setItem(result)
      if (pushHistory) {
        window.history.pushState({}, '', `#item/${result.name}`)
      }
    } catch (itemError) {
      setError(itemError)
      if (pushHistory) {
        window.history.pushState({}, '', '#item/not-found')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(query) {
    loadPokemonByQuery(query, true)
  }

  function handleItemClick(name) {
    loadItemByName(name, true)
  }

  useEffect(() => {
    function handlePopState() {
      const hash = window.location.hash
      if (hash.startsWith('#pokemon/')) {
        const query = decodeURIComponent(hash.slice('#pokemon/'.length).trim())
        if (query && query !== 'not-found') {
          loadPokemonByQuery(query, false)
          return
        }
      }
      if (hash.startsWith('#item/')) {
        const itemName = decodeURIComponent(hash.slice('#item/'.length).trim())
        if (itemName && itemName !== 'not-found') {
          loadItemByName(itemName, false)
          return
        }
      }
      if (hash.startsWith('#profile/')) {
        const username = decodeURIComponent(hash.slice('#profile/'.length).trim())
        if (username) {
          openUserProfile(username)
          return
        }
      }
      if (hash === '#pokedex') {
        setView('pokedex')
        setPokemon(null)
        setItem(null)
        setError(null)
      } else if (hash === '#favorites') {
        setView('favorites')
        setPokemon(null)
        setItem(null)
        setError(null)
      } else if (hash === '#items') {
        setView('items')
        setPokemon(null)
        setItem(null)
        setError(null)
      } else {
        setView('home')
        setPokemon(null)
        setItem(null)
        setError(null)
      }
    }

    handlePopState()

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [locale])

  function handleItemsOpen() {
    setView('items')
    window.history.pushState({}, '', '#items')
  }

  function handlePokedexOpen() {
    setView('pokedex')
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '#pokedex')
  }

  function handleFavoritesOpen() {
    setView('favorites')
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '#favorites')
  }

  function handleHome() {
    setView('home')
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '#top')
  }

  function handlePokemonFromPokedex(query) {
    setPokemonReturnView('pokedex')
    handleSearch(query)
  }

  function handlePokemonFromFavorites(query) {
    setPokemonReturnView('favorites')
    handleSearch(query)
  }

  function handlePokemonFromHome(query) {
    setPokemonReturnView('home')
    handleSearch(query)
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
    if (view === 'item-detail' && itemReturnView === 'items') {
      setView('items')
      setItem(null)
      setError(null)
      window.history.pushState({}, '', '#items')
      return
    }
    if (view === 'detail' && pokemonReturnView === 'pokedex') {
      setView('pokedex')
      setPokemon(null)
      setError(null)
      window.history.pushState({}, '', '#pokedex')
      return
    }
    if (view === 'detail' && pokemonReturnView === 'favorites') {
      setView('favorites')
      setPokemon(null)
      setError(null)
      window.history.pushState({}, '', '#favorites')
      return
    }
    setView('home')
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '#top')
  }

  function handleItemFromItems(name) {
    setItemReturnView('items')
    handleItemClick(name)
  }

  let currentView = null

  if (view === 'pokedex') {
    currentView = (
      <Pokedex
        onPokemonClick={handlePokemonFromPokedex}
        onBack={handleBack}
        onHomeClick={handleHome}
        onFavoritesClick={handleFavoritesOpen}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
  } else if (view === 'favorites') {
    currentView = (
      <Favorites
        onPokemonClick={handlePokemonFromFavorites}
        onBack={handleBack}
        onHomeClick={handleHome}
        onPokedexClick={handlePokedexOpen}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
  } else if (view === 'items') {
    currentView = <Items onItemClick={handleItemFromItems} onBack={handleBack} t={t} locale={locale} onLocaleChange={handleLocaleChange} />
  } else if (view === 'item-detail') {
    currentView = <ItemDetail item={item} error={error} isLoading={isLoading} onBack={handleBack} t={t} locale={locale} onLocaleChange={handleLocaleChange} />
  } else if (view === 'detail') {
    currentView = (
      <PokemonDetail
        pokemon={pokemon}
        error={error}
        isLoading={isLoading}
        onBack={handleBack}
        onPokemonClick={handleSearch}
        onPokedexClick={handlePokedexOpen}
        onHomeClick={handleHome}
        onFavoritesClick={handleFavoritesOpen}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
  } else {
    currentView = (
      <Home
        onSearch={handlePokemonFromHome}
        onPokemonClick={handlePokemonFromHome}
        onItemClick={handleItemClick}
        onItemsClick={handleItemsOpen}
        onPokedexClick={handlePokedexOpen}
        onFavoritesClick={handleFavoritesOpen}
        isLoading={isLoading}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
  }

  return (
    <>
      {currentView}
      <MusicPlayer locale={locale} t={t} />
      <AuthModal />
      <UsernameSetupModal />
      <ProfileModal />
      <UserProfileModal onPokemonClick={handleSearch} t={t} />
      <SettingsModal locale={locale} onLocaleChange={handleLocaleChange} t={t} />
      <FollowersModal t={t} />
      <FollowingModal t={t} />
      <FollowRequestsModal t={t} />
      <PrivacySettingsModal t={t} />
      <UserSearchModal t={t} />
      <SocialModal />
      <SocialToast t={t} />
      <FloatingChat />
    </>
  )
}

export default App
