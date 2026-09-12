import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { searchUsers } from '../../services/social'
import { playHoverBubbleSound } from '../../utils/audio'

export default function UserSearchModal({ t }) {
  const {
    isUserSearchOpen,
    closeUserSearch,
    openUserProfile,
    user,
  } = useAuth()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isUserSearchOpen) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isUserSearchOpen])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const clean = query.trim().replace(/^@+/, '')
    if (clean.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchUsers(clean, user?.id)
        setResults(found)
      } catch (err) {
        console.error('[UserSearchModal] Error en búsqueda:', err)
      } finally {
        setIsSearching(false)
      }
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, user?.id])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isUserSearchOpen) {
        closeUserSearch()
      }
    }
    if (isUserSearchOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUserSearchOpen, closeUserSearch])

  if (!isUserSearchOpen) return null

  function handleSelectUser(person) {
    playHoverBubbleSound()
    closeUserSearch()
    openUserProfile(person.username || person.id)
  }

  const title = t?.social?.searchTitle || 'Descubrir entrenadores'
  const subtitle = t?.social?.searchSubtitle || 'Encuentra y sigue a otros entrenadores de PokéGuide.'
  const placeholder = t?.social?.searchPlaceholder || 'Buscar entrenador por @username...'
  const emptyText = t?.social?.noUsersFound || 'No encontramos ningún entrenador con ese nombre de usuario.'

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-search-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeUserSearch()
        }
      }}
    >
      <div className="social-list-modal-card user-search-modal-card" ref={modalRef}>
        <div className="social-list-header">
          <div>
            <span className="social-kicker">{t?.social?.community || 'COMUNIDAD'}</span>
            <h3 id="user-search-title" className="social-list-title">
              {title}
            </h3>
            <p className="social-list-subtitle">{subtitle}</p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeUserSearch}
            aria-label="Cerrar buscador"
          >
            ✕
          </button>
        </div>

        <div className="social-search-input-wrap">
          <span className="social-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="social-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            maxLength={20}
          />
          {query && (
            <button
              type="button"
              className="social-search-clear"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className="social-list-body user-search-results">
          {isSearching ? (
            <div className="social-loading-state">
              <span className="auth-spinner" aria-hidden="true" />
              <span>{t?.social?.searchingUsers || 'Buscando entrenadores...'}</span>
            </div>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <div className="social-empty-state">
              <span className="social-empty-icon">🔍</span>
              <p>{emptyText}</p>
            </div>
          ) : (
            <div className="social-user-rows">
              {results.map((person) => {
                const initial = (person.username || '?').charAt(0).toUpperCase()
                return (
                  <div
                    key={person.id}
                    className="social-user-row is-interactive"
                    onClick={() => handleSelectUser(person)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="social-user-info-clickable">
                      <div className="social-row-avatar-wrap">
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt=""
                            className="social-row-avatar-img"
                          />
                        ) : (
                          <span className="social-row-avatar-fallback">{initial}</span>
                        )}
                      </div>
                      <div className="social-row-names">
                        <strong className="social-row-username">@{person.username}</strong>
                        {person.bio ? (
                          <span className="social-row-bio">{person.bio}</span>
                        ) : (
                          <span className="social-row-sub">
                            {person.profile_visibility === 'private' ? '🔒 Perfil privado' : 'Entrenador PokéGuide'}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="social-view-profile-arrow" aria-hidden="true">→</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
