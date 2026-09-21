import { useEffect, useState } from 'react'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import Items from './pages/Items'
import MoveDetail from './pages/MoveDetail'
import Moves from './pages/Moves'
import Pokedex from './pages/Pokedex'
import PokemonDetail from './pages/PokemonDetail'
import UnderConstruction from './pages/UnderConstruction'
import { defaultLocale, getTranslations, SUPPORTED_LOCALES } from './locales'
import { getItem, getMove, getPokemon } from './services/pokeapi'
import MusicPlayer from './components/MusicPlayer'
import AuthModal from './components/auth/AuthModal'
import UsernameSetupModal from './components/auth/UsernameSetupModal'
import ProfileModal from './components/profile/ProfileModal'
import Profile from './pages/Profile'
import SettingsModal from './components/profile/SettingsModal'
import SocialModal from './components/social/SocialModal'
import SocialToast from './components/social/SocialToast'
import FloatingChat from './components/social/FloatingChat'
import FollowersModal from './components/social/FollowersModal'
import FollowingModal from './components/social/FollowingModal'
import FollowRequestsModal from './components/social/FollowRequestsModal'
import PrivacySettingsModal from './components/social/PrivacySettingsModal'
import UserSearchModal from './components/social/UserSearchModal'
import SuccessPopup from './components/common/SuccessPopup'
import { useAuth } from './context/AuthContext'
import { scrollToTop } from './utils/scroll'
import './styles/profile.css'
import './styles/social.css'
import './App.css'


function getInitialLocale() {
  try {
    const savedLocale = window.localStorage.getItem('pokeguide-locale')
    if (savedLocale === 'es-419') {
      window.localStorage.setItem('pokeguide-locale', 'es')
      return 'es'
    }
    return SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : defaultLocale
  } catch {
    return defaultLocale
  }
}

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem('pokeguide-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function App() {
  const { openUserProfile } = useAuth()
  const [view, setView] = useState('home')
  const [profileUsername, setProfileUsername] = useState(null)
  const [constructionFeature, setConstructionFeature] = useState(null)
  const [pokemon, setPokemon] = useState(null)
  const [item, setItem] = useState(null)
  const [move, setMove] = useState(null)
  const [itemReturnView, setItemReturnView] = useState('home')
  const [moveReturnView, setMoveReturnView] = useState('home')
  const [pokemonReturnView, setPokemonReturnView] = useState('home')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [locale, setLocale] = useState(getInitialLocale)
  const [theme, setTheme] = useState(getInitialTheme)
  const t = getTranslations(locale)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem('pokeguide-theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  function handleThemeChange(nextTheme) {
    const validTheme = nextTheme === 'dark' ? 'dark' : 'light'
    setTheme(validTheme)
  }

  async function loadPokemonByQuery(query, pushHistory = true) {
    scrollToTop('instant')
    setView('detail')
    setPokemon(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getPokemon(query, locale, t.errors)
      setPokemon(result)
      if (pushHistory) {
        window.history.pushState({}, '', `/#pokemon/${result.name}`)
      }
    } catch (searchError) {
      console.error('SEARCH ERROR IN APP:', searchError)
      setError(searchError)
      if (pushHistory) {
        window.history.pushState({}, '', '/#pokemon/not-found')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function loadItemByName(name, pushHistory = true) {
    scrollToTop('instant')
    setView('item-detail')
    setItem(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getItem(name, locale, t.errors)
      setItem(result)
      if (pushHistory) {
        window.history.pushState({}, '', `/#item/${result.name}`)
      }
    } catch (itemError) {
      setError(itemError)
      if (pushHistory) {
        window.history.pushState({}, '', '/#item/not-found')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function loadMoveByName(name, pushHistory = true) {
    scrollToTop('instant')
    setView('move-detail')
    setMove(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await getMove(name, locale, t.errors)
      setMove(result)
      if (pushHistory) {
        window.history.pushState({}, '', `/#move/${result.name}`)
      }
    } catch (moveError) {
      setError(moveError)
      if (pushHistory) {
        window.history.pushState({}, '', '/#move/not-found')
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

  function handleMoveClick(name) {
    loadMoveByName(name, true)
  }

  // Desactivar restauración automática de scroll del navegador para controlar el comportamiento SPA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Posicionar siempre la ventana en el encabezado (tope superior) al cambiar de página o detalle
  useEffect(() => {
    scrollToTop('instant')
  }, [
    view,
    profileUsername,
    pokemon?.id,
    pokemon?.name,
    item?.id,
    item?.name,
    move?.id,
    move?.name,
    constructionFeature,
  ])

  useEffect(() => {
    function handlePopState() {
      scrollToTop('instant')

      // 1. Verificar ruta en pathname: /profile/:username
      const pathname = window.location.pathname
      const profilePathMatch = pathname.match(/^\/profile\/([^/]+)/i)
      if (profilePathMatch) {
        const username = decodeURIComponent(profilePathMatch[1].trim())
        if (username) {
          setView('profile')
          setProfileUsername(username)
          setPokemon(null)
          setItem(null)
          setError(null)
          return
        }
      }

      // 2. Verificar ruta en hash: #profile/:username o #/profile/:username
      const hash = window.location.hash
      const profileHashMatch = hash.match(/^#\/?profile\/([^/]+)/i)
      if (profileHashMatch) {
        const username = decodeURIComponent(profileHashMatch[1].trim())
        if (username) {
          setView('profile')
          setProfileUsername(username)
          setPokemon(null)
          setItem(null)
          setError(null)
          return
        }
      }

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
      if (hash.startsWith('#move/')) {
        const moveName = decodeURIComponent(hash.slice('#move/'.length).trim())
        if (moveName && moveName !== 'not-found') {
          loadMoveByName(moveName, false)
          return
        }
      }
      if (hash === '#pokedex') {
        setView('pokedex')
        setPokemon(null)
        setItem(null)
        setMove(null)
        setError(null)
      } else if (hash === '#favorites') {
        setView('favorites')
        setPokemon(null)
        setItem(null)
        setMove(null)
        setError(null)
      } else if (hash === '#items') {
        setView('items')
        setPokemon(null)
        setItem(null)
        setMove(null)
        setError(null)
      } else if (hash === '#moves') {
        setView('moves')
        setPokemon(null)
        setItem(null)
        setMove(null)
        setError(null)
      } else if (hash === '#construction' || hash === '#en-construccion' || hash === '#construccion') {
        setView('construction')
        setPokemon(null)
        setItem(null)
        setMove(null)
        setError(null)
      } else {
        setView('home')
        setPokemon(null)
        setItem(null)
        setMove(null)
        setError(null)
      }
    }

    handlePopState()

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [locale])

  function handleProfileOpen(username) {
    if (!username) return
    scrollToTop('instant')
    setView('profile')
    setProfileUsername(username)
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', `/profile/${encodeURIComponent(username)}`)
  }

  function handleItemsOpen() {
    scrollToTop('instant')
    setView('items')
    setPokemon(null)
    setItem(null)
    setMove(null)
    setError(null)
    window.history.pushState({}, '', '/#items')
  }

  function handleMovesOpen() {
    scrollToTop('instant')
    setView('moves')
    setPokemon(null)
    setItem(null)
    setMove(null)
    setError(null)
    window.history.pushState({}, '', '/#moves')
  }

  function handlePokedexOpen() {
    scrollToTop('instant')
    setView('pokedex')
    setPokemon(null)
    setItem(null)
    setMove(null)
    setError(null)
    window.history.pushState({}, '', '/#pokedex')
  }

  function handleFavoritesOpen() {
    scrollToTop('instant')
    setView('favorites')
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '/#favorites')
  }

  function handleHome() {
    scrollToTop('instant')
    setView('home')
    setConstructionFeature(null)
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '/#top')
  }

  function handleConstructionOpen(featureName = '') {
    scrollToTop('instant')
    setView('construction')
    setConstructionFeature(featureName)
    setPokemon(null)
    setItem(null)
    setError(null)
    window.history.pushState({}, '', '/#construction')
  }

  function handlePokemonFromPokedex(query) {
    setPokemonReturnView('pokedex')
    handleSearch(query)
  }

  function handlePokemonFromFavorites(query) {
    setPokemonReturnView('favorites')
    handleSearch(query)
  }

  function handlePokemonFromProfile(query) {
    setPokemonReturnView('profile')
    handleSearch(query)
  }

  function handlePokemonFromHome(query) {
    setPokemonReturnView('home')
    handleSearch(query)
  }

  async function handleLocaleChange(nextLocale) {
    const targetLocale = nextLocale === 'es-419' || !SUPPORTED_LOCALES.includes(nextLocale)
      ? (String(nextLocale || '').toLowerCase().startsWith('en') ? 'en' : 'es')
      : nextLocale
    setLocale(targetLocale)
    try {
      window.localStorage.setItem('pokeguide-locale', targetLocale)
    } catch {
      // ignore
    }

    if (view === 'detail' && pokemon) {
      setIsLoading(true)
      setError(null)
      try {
        setPokemon(await getPokemon(pokemon.name, targetLocale, getTranslations(targetLocale).errors))
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
        setItem(await getItem(item.name, targetLocale, getTranslations(targetLocale).errors))
      } catch (itemError) {
        setError(itemError)
      } finally {
        setIsLoading(false)
      }
    }

    if (view === 'move-detail' && move) {
      setIsLoading(true)
      setError(null)
      try {
        setMove(await getMove(move.name, targetLocale, getTranslations(targetLocale).errors))
      } catch (moveError) {
        setError(moveError)
      } finally {
        setIsLoading(false)
      }
    }
  }

  function handleBack() {
    scrollToTop('instant')
    if (view === 'profile' || view === 'construction') {
      handleHome()
      return
    }
    if (view === 'item-detail' && itemReturnView === 'items') {
      setView('items')
      setItem(null)
      setError(null)
      window.history.pushState({}, '', '/#items')
      return
    }
    if (view === 'move-detail' && moveReturnView === 'moves') {
      setView('moves')
      setMove(null)
      setError(null)
      window.history.pushState({}, '', '/#moves')
      return
    }
    if (view === 'detail' && pokemonReturnView === 'move-detail') {
      if (move) {
        setView('move-detail')
        setPokemon(null)
        setError(null)
        window.history.pushState({}, '', `/#move/${move.name}`)
        return
      }
    }
    if (view === 'detail' && pokemonReturnView === 'profile') {
      setView('profile')
      setPokemon(null)
      setError(null)
      if (profileUsername) {
        window.history.pushState({}, '', `/profile/${encodeURIComponent(profileUsername)}`)
      } else {
        window.history.pushState({}, '', '/#top')
      }
      return
    }
    if (view === 'detail' && pokemonReturnView === 'pokedex') {
      setView('pokedex')
      setPokemon(null)
      setError(null)
      window.history.pushState({}, '', '/#pokedex')
      return
    }
    if (view === 'detail' && pokemonReturnView === 'favorites') {
      setView('favorites')
      setPokemon(null)
      setError(null)
      window.history.pushState({}, '', '/#favorites')
      return
    }
    setView('home')
    setPokemon(null)
    setItem(null)
    setMove(null)
    setError(null)
    window.history.pushState({}, '', '/#top')
  }

  function handleItemFromItems(name) {
    setItemReturnView('items')
    handleItemClick(name)
  }

  function handleMoveFromMoves(name) {
    setMoveReturnView('moves')
    handleMoveClick(name)
  }

  function handlePokemonFromMoveDetail(pokemonName) {
    setPokemonReturnView('move-detail')
    handleSearch(pokemonName)
  }

  let currentView = null

  if (view === 'profile') {
    currentView = (
      <Profile
        username={profileUsername}
        onPokemonClick={handlePokemonFromProfile}
        onBack={handleBack}
        onHomeClick={handleHome}
        onPokedexClick={handlePokedexOpen}
        onFavoritesClick={handleFavoritesOpen}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
  } else if (view === 'pokedex') {
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
  } else if (view === 'moves') {
    currentView = (
      <Moves
        onMoveClick={handleMoveFromMoves}
        onBack={handleBack}
        onHomeClick={handleHome}
        onPokedexClick={handlePokedexOpen}
        onFavoritesClick={handleFavoritesOpen}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
  } else if (view === 'move-detail') {
    currentView = (
      <MoveDetail
        move={move}
        error={error}
        isLoading={isLoading}
        onBack={handleBack}
        onPokemonClick={handlePokemonFromMoveDetail}
        onHomeClick={handleHome}
        onPokedexClick={handlePokedexOpen}
        onFavoritesClick={handleFavoritesOpen}
        t={t}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    )
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
  } else if (view === 'construction') {
    currentView = (
      <UnderConstruction
        onBack={handleBack}
        onHomeClick={handleHome}
        onPokedexClick={handlePokedexOpen}
        onItemsClick={handleItemsOpen}
        onMovesClick={handleMovesOpen}
        onFavoritesClick={handleFavoritesOpen}
        featureName={constructionFeature}
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
        onMovesClick={handleMovesOpen}
        onPokedexClick={handlePokedexOpen}
        onFavoritesClick={handleFavoritesOpen}
        onConstructionClick={handleConstructionOpen}
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
      <SettingsModal
        locale={locale}
        onLocaleChange={handleLocaleChange}
        t={t}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
      <FollowingModal t={t} />
      <FollowRequestsModal t={t} />
      <PrivacySettingsModal t={t} />
      <UserSearchModal t={t} />
      <SocialModal />
      <SocialToast t={t} />
      <SuccessPopup />
      <FloatingChat />
    </>
  )
}

export default App
