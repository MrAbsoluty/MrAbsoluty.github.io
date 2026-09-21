import { useState, useRef, useEffect } from 'react'
import { localeOptions } from '../../locales'
import { playHoverBubbleSound, playClickUserSound, playDespliegueSound } from '../../utils/audio'

export default function LanguageDropdown({ locale, onLocaleChange, t }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
    if (e) e.stopPropagation()
    setIsOpen((prev) => {
      const next = !prev
      if (next) playDespliegueSound()
      return next
    })
  }

  function handleSelect(code) {
    playClickUserSound()
    setIsOpen(false)
    if (onLocaleChange && code !== locale) {
      onLocaleChange(code)
    }
  }

  const currentOption = localeOptions.find((opt) => opt.code === locale) || localeOptions[0]
  const currentLabel = t?.languages?.[currentOption?.code] || currentOption?.code?.toUpperCase()

  return (
    <div className="nav-lang-dropdown-container" ref={dropdownRef}>
      {/* Botón selector de idioma sin recuadros nativos */}
      <button
        type="button"
        className={`nav-lang-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        onMouseEnter={playHoverBubbleSound}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Idioma seleccionado: ${currentLabel}`}
      >
        <span className="nav-lang-flag" aria-hidden="true">
          {currentOption?.flag}
        </span>
        <span className="nav-lang-label">
          {currentLabel}
        </span>
        <svg
          className={`nav-lang-chevron ${isOpen ? 'is-open' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Menú de opciones de idioma */}
      {isOpen && (
        <div className="nav-lang-dropdown-panel" role="menu">
          {localeOptions.map((opt) => {
            const isSelected = opt.code === locale
            const langName = t?.languages?.[opt.code] || opt.code

            return (
              <button
                key={opt.code}
                type="button"
                className={`nav-lang-option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelect(opt.code)}
                onMouseEnter={playHoverBubbleSound}
                role="menuitem"
              >
                <span className="nav-lang-option-flag" aria-hidden="true">
                  {opt.flag}
                </span>
                <span className="nav-lang-option-name">{langName}</span>
                {isSelected && (
                  <span className="nav-lang-option-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
