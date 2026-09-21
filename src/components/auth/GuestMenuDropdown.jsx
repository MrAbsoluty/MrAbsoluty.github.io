import { useState, useRef, useEffect } from 'react'
import {
  playHoverBubbleSound,
  playDespliegueSound,
  playClickUserSound,
} from '../../utils/audio'

export default function GuestMenuDropdown({ t, openAuthModal }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Cerrar al hacer clic fuera o pulsar Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleToggle(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        playDespliegueSound()
      }
      return next
    })
  }

  function handleAction(view, e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    playClickUserSound()
    setIsOpen(false)
    if (openAuthModal) {
      openAuthModal(view)
    }
  }

  return (
    <div className="nav-user-menu-container" ref={menuRef} style={{ position: 'relative' }}>
      {/* Botón circular de perfil sin foto */}
      <button
        type="button"
        className={`nav-guest-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        onMouseEnter={playHoverBubbleSound}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Acceso a la cuenta (Iniciar sesión o Registrarse)"
        title="Acceso a la cuenta"
      >
        <span className="nav-guest-avatar-wrap" aria-hidden="true">
          <svg
            className="nav-guest-avatar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div
          className="nav-user-dropdown-panel nav-guest-dropdown-panel"
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 10001 }}
        >
          {/* Encabezado del menú */}
          <div className="dropdown-user-header" style={{ padding: '6px 10px 10px' }}>
            <div className="dropdown-avatar-wrap">
              <span className="dropdown-user-avatar guest-avatar" style={{ background: 'var(--paper)', color: 'var(--muted)', border: '1.5px solid var(--line)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            </div>
            <div className="dropdown-user-info">
              <strong className="dropdown-username">¡Hola, Entrenador!</strong>
              <span className="dropdown-user-email">Accede para guardar tu progreso</span>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Opción 1: Iniciar sesión */}
          <button
            type="button"
            className="dropdown-menu-item"
            onClick={(e) => handleAction('login', e)}
            onMouseEnter={playHoverBubbleSound}
            role="menuitem"
          >
            <span className="dropdown-item-icon icon-login" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </span>
            <div className="dropdown-item-content">
              <span className="dropdown-item-title">Iniciar sesión</span>
              <span className="dropdown-item-desc">Entra con tu cuenta de usuario</span>
            </div>
          </button>

          {/* Opción 2: Registrarse */}
          <button
            type="button"
            className="dropdown-menu-item"
            onClick={(e) => handleAction('register', e)}
            onMouseEnter={playHoverBubbleSound}
            role="menuitem"
          >
            <span className="dropdown-item-icon icon-register" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </span>
            <div className="dropdown-item-content">
              <span className="dropdown-item-title">Registrarse</span>
              <span className="dropdown-item-desc">Crea tu cuenta de entrenador</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
