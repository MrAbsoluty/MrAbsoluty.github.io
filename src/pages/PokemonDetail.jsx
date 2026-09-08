import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import EvolutionChain from '../components/EvolutionChain'
import { getMegaForms } from '../services/pokeapi'
import megaSymbol from '../assets/mega-symbol.png'
import PokemonCryButton from '../components/PokemonCryButton'
import megaSound from '../audio/mega.mp3'
import megaRevertSound from '../audio/mega-revert.mp3'
import { playButtonSound } from '../utils/audio'

const typeColors = {
  bug: '#65a47b', dark: '#59636b', dragon: '#7d77a9', electric: '#ddb431', fairy: '#c875a6', fighting: '#c87545', fire: '#e5764f', flying: '#7f9db2', ghost: '#756d9a', grass: '#65a47b', ground: '#b18a62', ice: '#70afae', normal: '#929a98', poison: '#a46f9a', psychic: '#dd7181', rock: '#a29468', steel: '#77858e', water: '#5d98b4',
}

function formatName(name) {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function RevertIcon() {
  return (
    <svg className="revert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  )
}

function PokemonDetail({
  pokemon,
  error,
  isLoading,
  onBack,
  onPokemonClick,
  onPokedexClick,
  onHomeClick,
  t,
  locale,
  onLocaleChange,
}) {
  const [megaForms, setMegaForms] = useState([])
  const [isLoadingMegas, setIsLoadingMegas] = useState(false)
  const [activeForm, setActiveForm] = useState(null)
  const [isMegaExpanded, setIsMegaExpanded] = useState(false)
  const [prevPokemonId, setPrevPokemonId] = useState(pokemon?.id)
  const [isTransforming, setIsTransforming] = useState(false)
  const [transformStage, setTransformStage] = useState('idle')
  const [statsBump, setStatsBump] = useState(false)

  // Reset active form during render when pokemon prop changes
  if (pokemon?.id !== prevPokemonId) {
    setPrevPokemonId(pokemon?.id)
    setActiveForm(null)
    setIsMegaExpanded(false)
    setMegaForms([])
    setIsLoadingMegas(true)
  }

  // Fetch mega forms in background
  useEffect(() => {
    if (!pokemon?.id) return

    let isMounted = true

    getMegaForms(pokemon.id, locale)
      .then((forms) => {
        if (!isMounted) return
        setMegaForms(forms)
        setActiveForm((currentActive) => {
          if (!currentActive) return null
          return (
            forms.find(
              (f) => f.id === currentActive.id || f.name === currentActive.name,
            ) || currentActive
          )
        })
      })
      .catch((err) => {
        console.error('Error loading mega forms:', err)
        if (isMounted) setMegaForms([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingMegas(false)
      })

    return () => {
      isMounted = false
    }
  }, [pokemon?.id, locale])

  function handleTransform(targetForm) {
    if (isTransforming) return

    const isReverting =
      !targetForm || (activeForm && activeForm.id === targetForm.id)

    const audio = new Audio(isReverting ? megaRevertSound : megaSound)
    audio.currentTime = 0
    audio.play().catch(() => { })

    // Revert to base form
    if (!targetForm || (activeForm && activeForm.id === targetForm.id)) {
      setIsMegaExpanded(false)
      setIsTransforming(true)
      setTransformStage('charging')

      setTimeout(() => {
        setActiveForm(null)
        setTransformStage('impact')
        setStatsBump(true)

        setTimeout(() => {
          setIsTransforming(false)
          setTransformStage('idle')
          setStatsBump(false)
        }, 450)
      }, 350)
      return
    }

    // Transform to target Mega form
    setIsMegaExpanded(true)
    setIsTransforming(true)
    setTransformStage('charging')

    setTimeout(() => {
      setActiveForm(targetForm)
      setTransformStage('impact')
      setStatsBump(true)

      setTimeout(() => {
        setIsTransforming(false)
        setTransformStage('idle')
        setStatsBump(false)
      }, 450)
    }, 350)
  }

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} onHomeClick={onHomeClick} />
        <main className="detail-state">
          <div className="loader-orbit" aria-hidden="true"><span /></div>
          <p className="eyebrow">{t.detail.loadingEyebrow}</p>
          <h1>{t.detail.loadingTitle} <em>{t.detail.loadingAccent}</em></h1>
          <p>{t.detail.loadingText}</p>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} onHomeClick={onHomeClick} />
        <main className="detail-state">
          <span className="error-mark" aria-hidden="true">!</span>
          <p className="eyebrow">{t.detail.errorEyebrow}</p>
          <h1>{t.detail.errorTitle}<br /><em>{t.detail.errorAccent}</em></h1>
          <p>{error.message}</p>
          <div className="detail-actions">
            <button className="primary-action" type="button" onClick={handleBackClick}>{t.detail.backHome}</button>
          </div>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  const currentData = activeForm || pokemon
  const currentName = activeForm?.localizedName || pokemon?.localizedName || formatName(pokemon?.name || '')
  const currentImage = currentData?.image || pokemon?.image
  const currentTypes = currentData?.types || []
  const currentTypeLabels = currentData?.typeLabels || {}
  const currentAbilities = currentData?.abilities || []
  const currentAbilityLabels = currentData?.abilityLabels || {}
  const currentStats = currentData?.stats || []
  const currentHeight = currentData?.height
  const currentWeight = currentData?.weight
  const currentCry = activeForm?.cry || pokemon?.cry || null
  const currentPokedexDescription = activeForm
    ? (activeForm.pokedexDescription || null)
    : (pokemon?.pokedexDescription || null)

  const hasMegas = megaForms.length > 0
  const hasMultipleMegas = megaForms.length > 1
  const isDrawerOpen = isMegaExpanded && hasMultipleMegas

  const nameLength = currentName.length
  const titleLengthClass =
    nameLength > 14
      ? 'title-ultra-long'
      : nameLength > 9
        ? 'title-long'
        : ''

  return (
    <div className="page-shell">
      <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} onHomeClick={onHomeClick} />
      <main className="detail-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t.detail.back}
        </button>

        <section className="detail-hero">
          <div className="detail-copy">
            <p className="eyebrow">
              {t.detail.pokedex} #{String(pokemon.id).padStart(3, '0')}
              {activeForm && <span className="mega-indicator-eyebrow">✦ {activeForm.megaVariant?.toUpperCase()}</span>}
            </p>
            <h1 className={`detail-title ${titleLengthClass}`.trim()}>
              {currentName}
              <em>.</em>
            </h1>
            <div className="type-list">
              {currentTypes.map((type) => (
                <span key={type} style={{ '--type-color': typeColors[type] || '#ed6d5d' }}>
                  {currentTypeLabels[type] || formatName(type)}
                </span>
              ))}
            </div>
            <p className="detail-description">{t.detail.description}</p>
            <div className="measurements">
              <div>
                <small>{t.detail.height}</small>
                <strong>{currentHeight} m</strong>
              </div>
              <div>
                <small>{t.detail.weight}</small>
                <strong>{currentWeight} kg</strong>
              </div>
            </div>
          </div>

          <div className="detail-art">
            <div className="art-stage">
              <div className={`art-ring ${activeForm ? 'is-mega' : ''}`} />

              {/* Transformation energy shockwave aura */}
              <div className={`mega-energy-ring ${transformStage !== 'idle' ? transformStage : ''}`} aria-hidden="true" />

              <img
                key={activeForm ? activeForm.name : pokemon.name}
                className={`detail-art-image ${transformStage === 'charging' ? 'sprite-charging' : ''} ${transformStage === 'impact' ? 'sprite-impact' : ''}`}
                src={currentImage}
                alt={currentName}
              />

              {/* Background loading indicator for Mega forms */}
              {isLoadingMegas && !hasMegas && (
                <div className="mega-loading-dot" title={t.detail.megaLoading} aria-label={t.detail.megaLoading} />
              )}
            </div>

            {/* Interactive controls: Mega Evolution + Cry Audio (Outside the circle on the lateral right) */}
            {(hasMegas || currentCry) && (
              <div className="interactive-controls" role="region" aria-label={t.detail.combat}>
                {hasMegas && (
                  <div className="mega-control-dock">
                    <button
                      type="button"
                      className={`mega-btn ${activeForm ? 'is-active' : ''}`}
                      onClick={() => handleTransform(activeForm ? null : megaForms[0])}
                      disabled={isTransforming}
                      title={activeForm ? t.detail.megaRevert : t.detail.megaButton}
                      aria-pressed={!!activeForm}
                    >
                      {activeForm ? (
                        <RevertIcon />
                      ) : (
                        <img
                          src={megaSymbol}
                          alt={t.detail.megaButton}
                          className="mega-symbol-img"
                        />
                      )}
                    </button>

                    {hasMultipleMegas && (
                      <div
                        className={`mega-variants-drawer ${isDrawerOpen ? 'is-expanded' : 'is-collapsed'}`}
                        role="group"
                        aria-label={t.detail.megaSelect}
                        aria-hidden={!isDrawerOpen}
                      >
                        {megaForms.map((form) => {
                          const variantLetter = form.megaVariant?.replace('mega-', '').toUpperCase() || 'M'
                          const isThisActive = activeForm?.id === form.id
                          return (
                            <button
                              key={form.name}
                              type="button"
                              className={`mega-variant-pill ${isThisActive ? 'is-active' : ''}`}
                              onClick={() => handleTransform(isThisActive ? null : form)}
                              disabled={isTransforming}
                              title={form.localizedName}
                              aria-pressed={isThisActive}
                              tabIndex={isDrawerOpen ? 0 : -1}
                            >
                              {variantLetter}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <PokemonCryButton
                  cry={currentCry}
                  pokemonName={currentName}
                  title={t.detail.playCry}
                  ariaLabel={t.detail.playCry}
                />
              </div>
            )}
          </div>
        </section>

        {currentPokedexDescription && (
          <section className="pokedex-entry" aria-label={t.detail.pokedex}>
            <div className="pokedex-entry-header">
              <span className="pokedex-entry-title">{t.detail.pokedex}</span>
              <span className="pokedex-entry-number">
                #{String(pokemon.id).padStart(3, '0')}
              </span>
            </div>
            <p className="pokedex-entry-text">{currentPokedexDescription}</p>
          </section>
        )}

        <section className="detail-info">
          <div className="info-column">
            <p className="eyebrow">{t.detail.traits}</p>
            <h2>{t.detail.abilities}</h2>
            <div className="ability-list">
              {currentAbilities.map((ability) => (
                <span key={ability} className={statsBump ? 'ability-updated' : ''}>
                  {currentAbilityLabels[ability] || formatName(ability.replaceAll('-', ' '))}
                </span>
              ))}
            </div>
          </div>

          <div className="stats-column">
            <p className="eyebrow">{t.detail.combat}</p>
            <h2>{t.detail.stats}</h2>
            <div className="stats-list">
              {currentStats.map((stat) => (
                <div className="stat-row" key={stat.name}>
                  <span>{t.detail.statLabels[stat.name] || formatName(stat.name)}</span>
                  <strong className={statsBump ? 'stat-animating' : ''}>{stat.value}</strong>
                  <div className="stat-track">
                    <i style={{ width: `${Math.min((stat.value / 255) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {pokemon && (
          <EvolutionChain
            pokemonId={pokemon.id}
            speciesUrl={pokemon.speciesUrl}
            currentPokemonName={pokemon.name}
            onPokemonClick={onPokemonClick}
            locale={locale}
            t={t}
          />
        )}
      </main>
      <Footer t={t} />
    </div>
  )
}

export default PokemonDetail