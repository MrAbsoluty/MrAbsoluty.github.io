import { useEffect, useRef, useState } from 'react'
import megaSymbol from '../assets/mega-symbol.png'
import { playButtonSound, playBubbleSound, playHoverBubbleSound } from '../utils/audio'

function SparklesIcon() {
  return (
    <svg className="bubble-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.912 4.886L18.8 9.8 13.912 11.714 12 16.6l-1.912-4.886L5.2 9.8l4.888-1.914L12 3z" />
      <path d="M19 16l.8 2.043 2.043.8-2.043.8L19 21.685l-.8-2.042-2.043-.8 2.043-.8L19 16z" />
    </svg>
  )
}

function SoundSpeakerIcon({ isPlaying }) {
  return (
    <svg className={`bubble-icon cry-speaker-icon ${isPlaying ? 'is-playing' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <path className="sound-wave wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path className="sound-wave wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function StatsIcon() {
  return (
    <svg className="bubble-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="bubble-icon close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function RevertIcon() {
  return (
    <svg className="bubble-icon revert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg className="bubble-icon globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function PokemonFocusMenu({
  isOpen,
  onClose,
  isShiny,
  onToggleShiny,
  hasShiny = true,
  currentCry,
  pokemonName,
  basePokemonName,
  hasMegas,
  megaForms = [],
  activeForm,
  onTransform,
  isTransforming,
  hasRegionalForms,
  regionalForms = [],
  activeRegionalForm,
  onSelectRegionalForm,
  isRegionalTransforming,
  onScrollToStats,
  t,
}) {
  const [isPlayingCry, setIsPlayingCry] = useState(false)
  const [showVariantsDrawer, setShowVariantsDrawer] = useState(false)
  const [showRegionalDrawer, setShowRegionalDrawer] = useState(false)
  const audioRef = useRef(null)

  // Listen to Escape key to close Focus Mode
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset drawer submenus when closing
  useEffect(() => {
    if (!isOpen) {
      setShowVariantsDrawer(false)
      setShowRegionalDrawer(false)
    }
  }, [isOpen])

  // Play bubble deploy sound when options bubbles deploy
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      playBubbleSound()
    }, 60)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Stop sound when focus menu closes, unmounts, or when cry changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsPlayingCry(false)
    }
  }, [currentCry, isOpen])

  if (!isOpen) return null

  const handlePlayCry = (e) => {
    e.stopPropagation()
    if (!currentCry || isPlayingCry) return

    try {
      if (!audioRef.current || audioRef.current._crySrc !== currentCry) {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current = null
        }
        const audio = new Audio(currentCry)
        audio._crySrc = currentCry
        audio.preload = 'auto'
        audio.volume = 0.35
        audio.onplay = () => setIsPlayingCry(true)
        audio.onended = () => setIsPlayingCry(false)
        audio.onpause = () => setIsPlayingCry(false)
        audio.onerror = () => setIsPlayingCry(false)
        audioRef.current = audio
      } else {
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.35
      }

      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlayingCry(false))
      }
    } catch {
      setIsPlayingCry(false)
    }
  }

  const handleShinyClick = (e) => {
    e.stopPropagation()
    playButtonSound()
    onToggleShiny?.()
  }

  const handleMegaClick = (e) => {
    e.stopPropagation()
    if (isTransforming || isRegionalTransforming) return
    setShowRegionalDrawer(false)

    // If there are multiple mega forms (e.g. Charizard X & Y), toggle the variant selection drawer
    if (megaForms.length > 1) {
      if (activeForm) {
        // Revert directly if already transformed
        onTransform?.(null)
      } else {
        playButtonSound()
        setShowVariantsDrawer((prev) => !prev)
      }
    } else {
      // Single Mega form: toggle between Mega and Base
      onTransform?.(activeForm ? null : megaForms[0])
    }
  }

  const handleVariantSelect = (e, form) => {
    e.stopPropagation()
    if (isTransforming || isRegionalTransforming) return
    onTransform?.(form)
    setShowVariantsDrawer(false)
  }

  const handleFormsClick = (e) => {
    e.stopPropagation()
    if (isTransforming || isRegionalTransforming) return
    playButtonSound()
    setShowVariantsDrawer(false)
    setShowRegionalDrawer((prev) => !prev)
  }

  const handleRegionalOptionClick = (e, form) => {
    e.stopPropagation()
    if (isTransforming || isRegionalTransforming) return
    playButtonSound()
    setShowRegionalDrawer(false)
    onSelectRegionalForm?.(form)
  }

  const handleStatsClick = (e) => {
    e.stopPropagation()
    playButtonSound()
    onScrollToStats?.()
  }

  const hasMultipleMegas = hasMegas && megaForms.length > 1

  const handleBackdropClick = () => {
    if (showRegionalDrawer || showVariantsDrawer) {
      setShowRegionalDrawer(false)
      setShowVariantsDrawer(false)
      return
    }
    onClose?.()
  }

  return (
    <>
      {/* Darkened blur backdrop covering page */}
      <div
        className="pokemon-focus-backdrop"
        onClick={handleBackdropClick}
        role="presentation"
        aria-hidden="true"
      />

      {/* Focus Mode top bar / hint */}
      <div className="pokemon-focus-header" onClick={(e) => e.stopPropagation()}>
        <span className="focus-header-badge">
          ✦ {t.detail.focusMode || 'Modo Interacción'} ✦
        </span>
        <span className="focus-header-sub">
          {pokemonName} · Esc para salir
        </span>
      </div>

      {/* Orbital Bubble Menu surrounding Pokémon */}
      <div
        className={`focus-bubble-container ${hasMegas ? 'has-mega' : 'no-mega'} ${hasRegionalForms ? 'has-regional' : 'no-regional'} ${hasMegas && hasRegionalForms ? 'has-both-modes' : ''} ${showRegionalDrawer || showVariantsDrawer ? 'has-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${t.detail.focusMode || 'Interacción'} ${pokemonName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. ✨ SHINY BUBBLE */}
        {hasShiny && (
          <div className="focus-bubble-slot slot-shiny">
            <button
              type="button"
              className={`focus-bubble bubble-shiny ${isShiny ? 'is-active' : ''}`}
              onClick={handleShinyClick}
              onMouseEnter={playHoverBubbleSound}
              title={isShiny ? 'Forma normal' : t.detail.bubbleShiny || 'Shiny'}
              aria-pressed={isShiny}
            >
              <span className="bubble-icon-wrap">
                <SparklesIcon />
              </span>
              <span className="bubble-label">{t.detail.bubbleShiny || 'Shiny'}</span>
              {isShiny && <span className="bubble-active-glow" aria-hidden="true" />}
            </button>
          </div>
        )}

        {/* 2. 🔄 FORMA / MEGA BUBBLE (Only if Pokémon has Mega forms) */}
        {hasMegas && (
          <div className={`focus-bubble-slot slot-mega ${showVariantsDrawer ? 'is-active-slot' : ''}`}>
            <div className="mega-bubble-group">
              <button
                type="button"
                className={`focus-bubble bubble-mega ${activeForm && !activeRegionalForm ? 'is-active' : ''}`}
                onClick={handleMegaClick}
                onMouseEnter={playHoverBubbleSound}
                disabled={isTransforming || isRegionalTransforming}
                title={activeForm ? t.detail.megaRevert : t.detail.megaButton}
                aria-pressed={!!activeForm}
              >
                <span className="bubble-icon-wrap">
                  {activeForm && !activeRegionalForm ? (
                    <RevertIcon />
                  ) : (
                    <img
                      src={megaSymbol}
                      alt={t.detail.megaButton}
                      className="mega-symbol-img bubble-mega-img"
                    />
                  )}
                </span>
                <span className="bubble-label">
                  {activeForm && !activeRegionalForm
                    ? (activeForm.megaVariant?.replace('mega-', '').toUpperCase() || (t.detail.megaActive || 'Mega'))
                    : (t.detail.bubbleMega || 'Mega')}
                </span>
              </button>

              {/* Multi-Mega variant choices (e.g. Charizard X / Y) */}
              {hasMultipleMegas && (
                <div className={`focus-mega-drawer ${showVariantsDrawer || (activeForm && !activeRegionalForm) ? 'is-open' : ''}`}>
                  {megaForms.map((form) => {
                    const variantLetter = form.megaVariant?.replace('mega-', '').toUpperCase() || 'M'
                    const isThisActive = activeForm?.id === form.id
                    return (
                      <button
                        key={form.name}
                        type="button"
                        className={`focus-variant-pill ${isThisActive ? 'is-active' : ''}`}
                        onClick={(e) => handleVariantSelect(e, isThisActive ? null : form)}
                        onMouseEnter={playHoverBubbleSound}
                        disabled={isTransforming || isRegionalTransforming}
                        title={form.localizedName || form.name}
                      >
                        {variantLetter}
                      </button>
                    )
                  })}
                  {activeForm && !activeRegionalForm && (
                    <button
                      type="button"
                      className="focus-variant-pill pill-base"
                      onClick={(e) => handleVariantSelect(e, null)}
                      onMouseEnter={playHoverBubbleSound}
                      disabled={isTransforming || isRegionalTransforming}
                      title={t.detail.baseForm || 'Normal'}
                    >
                      {t.detail.baseForm || 'Normal'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 🌎 FORMAS REGIONALES BUBBLE (Rendered ONLY if Pokémon has actual Regional Forms) */}
        {hasRegionalForms && (
          <div className={`focus-bubble-slot slot-forms ${showRegionalDrawer ? 'is-active-slot' : ''}`}>
            <div className="forms-bubble-group">
              <button
                type="button"
                className={`focus-bubble bubble-forms ${activeRegionalForm ? 'is-active' : ''}`}
                onClick={handleFormsClick}
                onMouseEnter={playHoverBubbleSound}
                disabled={isTransforming || isRegionalTransforming}
                title={t.detail.formsButton || 'Formas'}
                aria-pressed={!!activeRegionalForm}
              >
                <span className="bubble-icon-wrap">
                  <GlobeIcon />
                </span>
                <span className="bubble-label">
                  {activeRegionalForm
                    ? (activeRegionalForm.region?.toUpperCase() || (t.detail.bubbleForms || 'Formas'))
                    : (t.detail.bubbleForms || 'Formas')}
                </span>
                {activeRegionalForm && <span className="bubble-active-glow" aria-hidden="true" />}
              </button>

              {/* Regional Forms Selection Drawer */}
              <div className={`focus-regional-drawer ${showRegionalDrawer ? 'is-open' : ''}`}>
                <div className="regional-drawer-header">
                  <span>{t.detail.formsSelect || 'Formas'}</span>
                </div>

                {/* Base / Normal form option */}
                <button
                  type="button"
                  className={`focus-regional-option ${!activeRegionalForm ? 'is-selected' : ''}`}
                  onClick={(e) => handleRegionalOptionClick(e, null)}
                  onMouseEnter={playHoverBubbleSound}
                  disabled={isTransforming || isRegionalTransforming}
                >
                  <span className="regional-radio-circle" aria-hidden="true">
                    <span className="regional-radio-fill" />
                  </span>
                  <span className="regional-option-label">
                    {basePokemonName || t.detail.baseForm || 'Normal'}
                  </span>
                  {!activeRegionalForm && (
                    <span className="regional-tag tag-base">
                      {t.detail.baseForm || 'Normal'}
                    </span>
                  )}
                </button>

                {/* Regional form options */}
                {regionalForms.map((rForm) => {
                  const isSelected = activeRegionalForm?.id === rForm.id
                  return (
                    <button
                      key={rForm.id || rForm.name}
                      type="button"
                      className={`focus-regional-option ${isSelected ? 'is-selected' : ''}`}
                      onClick={(e) => handleRegionalOptionClick(e, isSelected ? null : rForm)}
                      onMouseEnter={playHoverBubbleSound}
                      disabled={isTransforming || isRegionalTransforming}
                    >
                      <span className="regional-radio-circle" aria-hidden="true">
                        <span className="regional-radio-fill" />
                      </span>
                      <span className="regional-option-label">
                        {rForm.localizedName}
                      </span>
                      <span className={`regional-tag region-${rForm.region}`}>
                        {rForm.region.toUpperCase()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. 🔊 SONIDO (CRY) BUBBLE */}
        {currentCry && (
          <div className="focus-bubble-slot slot-cry">
            <button
              type="button"
              className={`focus-bubble bubble-cry ${isPlayingCry ? 'is-playing' : ''}`}
              onClick={handlePlayCry}
              onMouseEnter={playHoverBubbleSound}
              title={isPlayingCry ? t.detail.playingCry : t.detail.playCry}
              aria-pressed={isPlayingCry}
            >
              {isPlayingCry && (
                <span className="cry-sound-ripples" aria-hidden="true">
                  <span className="cry-ripple" />
                  <span className="cry-ripple" />
                </span>
              )}
              <span className="bubble-icon-wrap">
                <SoundSpeakerIcon isPlaying={isPlayingCry} />
              </span>
              <span className="bubble-label">{t.detail.bubbleCry || 'Sonido'}</span>
            </button>
          </div>
        )}

        {/* 5. 📊 ESTADÍSTICAS BUBBLE */}
        <div className="focus-bubble-slot slot-stats">
          <button
            type="button"
            className="focus-bubble bubble-stats"
            onClick={handleStatsClick}
            onMouseEnter={playHoverBubbleSound}
            title={t.detail.stats}
          >
            <span className="bubble-icon-wrap">
              <StatsIcon />
            </span>
            <span className="bubble-label">{t.detail.bubbleStats || 'Stats'}</span>
          </button>
        </div>

        {/* 6. ✕ CERRAR BUBBLE */}
        <div className="focus-bubble-slot slot-close">
          <button
            type="button"
            className="focus-bubble bubble-close"
            onClick={(e) => {
              e.stopPropagation()
              playButtonSound()
              onClose?.()
            }}
            onMouseEnter={playHoverBubbleSound}
            title={t.detail.bubbleClose || 'Cerrar'}
            aria-label={t.detail.bubbleClose || 'Cerrar'}
          >
            <span className="bubble-icon-wrap">
              <CloseIcon />
            </span>
            <span className="bubble-label">{t.detail.bubbleClose || 'Cerrar'}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default PokemonFocusMenu
