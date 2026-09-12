import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import EvolutionChain from '../components/EvolutionChain'
import PokemonStats from '../components/PokemonStats'
import PokemonTypeAffinities from '../components/PokemonTypeAffinities'
import PokemonFocusMenu from '../components/PokemonFocusMenu'
import PokemonFavoriteButton from '../components/PokemonFavoriteButton'
import { getMegaForms, getRegionalForms, getAbilityDetails } from '../services/pokeapi'
import megaSound from '../audio/mega.mp3'
import megaRevertSound from '../audio/mega-revert.mp3'
import alolaFormSound from '../audio/alolaform.mp3'
import galarFormSound from '../audio/galarform.mp3'
import hisuiFormSound from '../audio/hisuiform.mp3'
import { playButtonSound, playClickSound, playShinySound, playShinylessSound } from '../utils/audio'

const typeColors = {
  bug: '#65a47b', dark: '#59636b', dragon: '#7d77a9', electric: '#ddb431', fairy: '#c875a6', fighting: '#c87545', fire: '#e5764f', flying: '#7f9db2', ghost: '#756d9a', grass: '#65a47b', ground: '#b18a62', ice: '#70afae', normal: '#929a98', poison: '#a46f9a', psychic: '#dd7181', rock: '#a29468', steel: '#77858e', water: '#5d98b4',
}

function formatName(name) {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function PokemonDetail({
  pokemon,
  error,
  isLoading,
  onBack,
  onPokemonClick,
  onPokedexClick,
  onHomeClick,
  onFavoritesClick,
  t,
  locale,
  onLocaleChange,
}) {
  const [megaForms, setMegaForms] = useState([])
  const [isLoadingMegas, setIsLoadingMegas] = useState(false)
  const [activeForm, setActiveForm] = useState(null)
  const [regionalForms, setRegionalForms] = useState([])
  const [isLoadingRegionals, setIsLoadingRegionals] = useState(false)
  const [activeRegionalForm, setActiveRegionalForm] = useState(null)
  const [isRegionalTransforming, setIsRegionalTransforming] = useState(false)
  const [regionalTransformStage, setRegionalTransformStage] = useState('idle')
  const [regionalTransformRegion, setRegionalTransformRegion] = useState(null)
  const [isTransforming, setIsTransforming] = useState(false)
  const [transformStage, setTransformStage] = useState('idle')
  const [statsBump, setStatsBump] = useState(false)
  const [isShiny, setIsShiny] = useState(false)
  const [isShinyAnimating, setIsShinyAnimating] = useState(false)
  const [shinyStage, setShinyStage] = useState('idle')
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [selectedAbility, setSelectedAbility] = useState(null)
  const [extraAbilityData, setExtraAbilityData] = useState({})

  // Reset active form and states safely when pokemon changes
  useEffect(() => {
    setActiveForm(null)
    setMegaForms([])
    setIsLoadingMegas(true)
    setActiveRegionalForm(null)
    setRegionalForms([])
    setIsLoadingRegionals(true)
    setIsRegionalTransforming(false)
    setRegionalTransformStage('idle')
    setRegionalTransformRegion(null)
    setIsShiny(false)
    setIsShinyAnimating(false)
    setShinyStage('idle')
    setIsFocusMode(false)
    setSelectedAbility(null)
    setExtraAbilityData({})
  }, [pokemon?.id])

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

  // Fetch regional forms in background
  useEffect(() => {
    if (!pokemon?.id) return

    let isMounted = true

    getRegionalForms(pokemon.id, locale)
      .then((forms) => {
        if (!isMounted) return
        setRegionalForms(forms)
        setActiveRegionalForm((currentActive) => {
          if (!currentActive) return null
          return (
            forms.find(
              (f) => f.id === currentActive.id || f.name === currentActive.name,
            ) || currentActive
          )
        })
      })
      .catch((err) => {
        console.error('Error loading regional forms:', err)
        if (isMounted) setRegionalForms([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingRegionals(false)
      })

    return () => {
      isMounted = false
    }
  }, [pokemon?.id, locale])

  function handleTransform(targetForm) {
    if (isTransforming || isRegionalTransforming) return

    const isReverting =
      !targetForm || (activeForm && activeForm.id === targetForm.id)

    const audio = new Audio(isReverting ? megaRevertSound : megaSound)
    audio.currentTime = 0
    audio.play().catch(() => { })

    // Clear active regional form if mega-evolving
    if (activeRegionalForm) setActiveRegionalForm(null)
    setSelectedAbility(null)

    // Revert to base form
    if (!targetForm || (activeForm && activeForm.id === targetForm.id)) {
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

  function handleSelectRegionalForm(targetForm) {
    if (isRegionalTransforming || isTransforming) return

    const isReverting =
      !targetForm || (activeRegionalForm && activeRegionalForm.id === targetForm.id)
    const region = isReverting ? 'reverting' : (targetForm.region || 'alola')
    const normalizedRegion = (targetForm?.region || targetForm?.formName || '').toLowerCase()

    let soundToPlay = megaSound
    let soundVolume = 0.85

    if (isReverting) {
      soundToPlay = megaRevertSound
    } else if (normalizedRegion.includes('alola')) {
      soundToPlay = alolaFormSound
    } else if (normalizedRegion.includes('galar')) {
      soundToPlay = galarFormSound
      soundVolume = 0.45
    } else if (normalizedRegion.includes('hisui')) {
      soundToPlay = hisuiFormSound
      soundVolume = 0.45
    }

    const audio = new Audio(soundToPlay)
    audio.currentTime = 0
    audio.volume = soundVolume
    audio.play().catch(() => { })

    // Clear active mega form if transforming into a regional form
    if (activeForm) setActiveForm(null)
    setSelectedAbility(null)

    setIsRegionalTransforming(true)
    setRegionalTransformRegion(region)
    setRegionalTransformStage('charging')

    // Clímax at 320ms: flash + swap sprite and all stats + stats bump
    setTimeout(() => {
      setActiveRegionalForm(isReverting ? null : targetForm)
      setRegionalTransformStage('flash')
      setStatsBump(true)

      // Particles disperse at 540ms
      setTimeout(() => {
        setRegionalTransformStage('fade')

        // Conclude animation cleanly at 840ms
        setTimeout(() => {
          setIsRegionalTransforming(false)
          setRegionalTransformStage('idle')
          setRegionalTransformRegion(null)
          setStatsBump(false)
        }, 320)
      }, 220)
    }, 320)
  }

  function handleToggleShiny() {
    if (!hasShiny || isShinyAnimating) return

    const nextShiny = !isShiny

    if (nextShiny) {
      setIsShinyAnimating(true)
      setShinyStage('charging')

      // Momento clímax (220ms): se reproduce sonido, flash luminoso y cambio de sprite
      setTimeout(() => {
        playShinySound()
        setShinyStage('flash')
        setIsShiny(true)
      }, 220)

      // Transición a estrellas y partículas doradas (460ms)
      setTimeout(() => {
        setShinyStage('sparkling')
      }, 460)

      // Conclusión suave y retorno a reposo (1150ms)
      setTimeout(() => {
        setIsShinyAnimating(false)
        setShinyStage('idle')
      }, 1150)
    } else {
      // Regreso a forma regular (shinyless) con animación suave y sonido
      setIsShinyAnimating(true)
      setShinyStage('reverting-charging')

      // Momento clímax de reversión (180ms): sonido shinyless, flash de disipación y cambio de sprite
      setTimeout(() => {
        playShinylessSound()
        setShinyStage('reverting-flash')
        setIsShiny(false)
      }, 180)

      // Dispersión suave de estela de brillo (420ms)
      setTimeout(() => {
        setShinyStage('reverting-fade')
      }, 420)

      // Retorno completo a reposo (950ms)
      setTimeout(() => {
        setIsShinyAnimating(false)
        setShinyStage('idle')
      }, 950)
    }
  }

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} onHomeClick={onHomeClick} onFavoritesClick={onFavoritesClick} />
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
        <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} onHomeClick={onHomeClick} onFavoritesClick={onFavoritesClick} />
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

  if (!pokemon) {
    return null
  }

  const matchedRegionalForm = activeRegionalForm
    ? regionalForms.find(
        (f) => f.id === activeRegionalForm.id || f.name === activeRegionalForm.name,
      ) || activeRegionalForm
    : null

  const currentData = matchedRegionalForm || activeForm || pokemon
  const currentName =
    matchedRegionalForm?.localizedName ||
    activeForm?.localizedName ||
    pokemon?.localizedName ||
    formatName(pokemon?.name || '')

  const currentImage =
    isShiny && currentData?.shinyImage
      ? currentData.shinyImage
      : (currentData?.image || pokemon?.image)

  const hasShiny = Boolean(currentData?.shinyImage || pokemon?.shinyImage)
  const currentTypes = currentData?.types || []
  const currentTypeLabels = currentData?.typeLabels || {}
  const currentAbilities = currentData?.abilities || []
  const currentAbilityLabels = currentData?.abilityLabels || {}
  const currentAbilityDescriptions = currentData?.abilityDescriptions || {}
  const activeSelectedAbility = currentAbilities.includes(selectedAbility) ? selectedAbility : null

  function handleAbilityClick(ability) {
    playClickSound()
    setSelectedAbility((prev) => (prev === ability ? null : ability))

    const existingLabel = currentAbilityLabels[ability]
    const isRawSlug =
      !existingLabel ||
      existingLabel.toLowerCase() === ability.toLowerCase() ||
      existingLabel.includes('-')
    const hasDesc = Boolean(
      currentAbilityDescriptions[ability] ||
      extraAbilityData[ability]?.description,
    )

    if (isRawSlug || !hasDesc) {
      getAbilityDetails(ability, locale).then((details) => {
        if (details?.name || details?.description) {
          setExtraAbilityData((prev) => ({
            ...prev,
            [ability]: {
              name: details.name || prev[ability]?.name || existingLabel,
              description: details.description || prev[ability]?.description || '',
            },
          }))
        }
      })
    }
  }

  function handleAbilityAIAnalysis(event, _abilityName) {
    event?.stopPropagation?.()
    playClickSound()
    // Futura integración con IA:
    // Esta función queda preparada para abrir el análisis profundo de la habilidad
    // (sinergias, viability en singles/doubles, counters, objetos y aliados).
    // Por ahora es solo visual y no ejecuta acciones ni llamadas.
  }
  const currentStats = currentData?.stats || []
  const currentHeight = currentData?.height
  const currentWeight = currentData?.weight
  const currentCry = matchedRegionalForm?.cry || activeForm?.cry || pokemon?.cry || null
  const currentPokedexDescription = matchedRegionalForm
    ? (matchedRegionalForm.pokedexDescription || pokemon?.pokedexDescription || null)
    : activeForm
      ? (activeForm.pokedexDescription || pokemon?.pokedexDescription || null)
      : (pokemon?.pokedexDescription || null)

  const hasMegas = megaForms.length > 0
  const hasRegionalForms = regionalForms.length > 0

  const nameLength = currentName.length
  const titleLengthClass =
    nameLength > 14
      ? 'title-ultra-long'
      : nameLength > 9
        ? 'title-long'
        : ''

  return (
    <div className="page-shell">
      <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} onHomeClick={onHomeClick} onFavoritesClick={onFavoritesClick} />
      <main className="detail-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t.detail.back}
        </button>

        <section className="detail-hero">
          <div className="detail-copy">
            <p className="eyebrow">
              {t.detail.pokedex} #{String(pokemon?.id || '').padStart(3, '0')}
              {activeForm && " ✦ " + activeForm.megaVariant?.toUpperCase()}
              {activeRegionalForm && " ✦ " + activeRegionalForm.region?.toUpperCase()}
            </p>
            <div className="detail-title-wrapper">
              <h1 className={`detail-title ${titleLengthClass}`.trim()}>
                {currentName}
                <em>.</em>
              </h1>
              <PokemonFavoriteButton pokemon={pokemon} t={t} size="large" />
            </div>
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

          <div className={`detail-art ${isFocusMode ? 'has-focus-active' : ''}`}>
            <div
              className={`art-stage is-interactive ${isFocusMode ? 'is-focused' : ''}`}
              onClick={() => {
                playClickSound()
                setIsFocusMode((prev) => !prev)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  playClickSound()
                  setIsFocusMode((prev) => !prev)
                }
              }}
              title={isFocusMode ? t.detail.bubbleClose : t.detail.interactHint}
              aria-label={isFocusMode ? t.detail.bubbleClose : `${pokemon?.name || ''}, ${t.detail.interactHint}`}
            >
              <div className={`art-ring ${activeForm ? 'is-mega' : ''} ${activeRegionalForm ? `is-regional region-${activeRegionalForm.region}` : ''}`} />

              {/* Transformation energy shockwave aura for Megas */}
              <div className={`mega-energy-ring ${transformStage !== 'idle' ? transformStage : ''}`} aria-hidden="true" />

              {/* Shiny & Shinyless transformation energy & particle effects */}
              {isShinyAnimating && (
                <div className={`shiny-transform-overlay stage-${shinyStage} ${shinyStage.startsWith('reverting') ? 'is-shinyless' : 'is-shiny'}`} aria-hidden="true">
                  <div className="shiny-energy-shockwave" />
                  <div className="shiny-aura-burst" />
                  <div className="shiny-light-flash" />
                  <div className="shiny-particles-cluster">
                    <span className="shiny-star star-1">✦</span>
                    <span className="shiny-star star-2">✦</span>
                    <span className="shiny-star star-3">✦</span>
                    <span className="shiny-star star-4">✦</span>
                    <span className="shiny-star star-5">✦</span>
                    <span className="shiny-star star-6">✦</span>
                    <span className="shiny-star star-7">✦</span>
                    <span className="shiny-star star-8">✦</span>
                  </div>
                </div>
              )}

              {/* Regional Transformation Visual Effects Overlay */}
              {isRegionalTransforming && (
                <div
                  className={`regional-transform-overlay region-${regionalTransformRegion} stage-${regionalTransformStage}`}
                  aria-hidden="true"
                >
                  <div className="regional-aura-burst" />
                  <div className="regional-energy-wave" />
                  <div className="regional-light-flash" />
                  <div className="regional-particles-cluster">
                    <span className="regional-particle p-1" />
                    <span className="regional-particle p-2" />
                    <span className="regional-particle p-3" />
                    <span className="regional-particle p-4" />
                    <span className="regional-particle p-5" />
                    <span className="regional-particle p-6" />
                    <span className="regional-particle p-7" />
                    <span className="regional-particle p-8" />
                  </div>
                </div>
              )}

              <img
                key={`${currentData?.name || pokemon.name}-${isShiny ? 'shiny' : 'regular'}`}
                className={`detail-art-image ${transformStage === 'charging' ? 'sprite-charging' : ''} ${transformStage === 'impact' ? 'sprite-impact' : ''} ${isShinyAnimating ? `shiny-sprite-${shinyStage}` : ''} ${isRegionalTransforming ? `regional-sprite-${regionalTransformStage} regional-sprite-${regionalTransformRegion}` : ''}`}
                src={currentImage}
                alt={currentName}
              />

              {/* Subtle hover interact pill hint in normal state */}
              {!isFocusMode && (
                <div className="pokemon-interact-pill" aria-hidden="true">
                  <span className="interact-pill-sparkle">✦</span> {t.detail.interactHint}
                </div>
              )}

              {/* Background loading indicator for Mega / Regional forms */}
              {(isLoadingMegas || isLoadingRegionals) && !hasMegas && !hasRegionalForms && (
                <div className="mega-loading-dot" title={t.detail.megaLoading} aria-label={t.detail.megaLoading} />
              )}
            </div>

            {/* Bubble Menu Focus Mode */}
            <PokemonFocusMenu
              isOpen={isFocusMode}
              onClose={() => setIsFocusMode(false)}
              isShiny={isShiny}
              onToggleShiny={handleToggleShiny}
              hasShiny={hasShiny}
              currentCry={currentCry}
              pokemonName={currentName}
              basePokemonName={pokemon?.localizedName || formatName(pokemon?.name || '')}
              hasMegas={hasMegas}
              megaForms={megaForms}
              activeForm={activeForm}
              onTransform={handleTransform}
              isTransforming={isTransforming}
              hasRegionalForms={hasRegionalForms}
              regionalForms={regionalForms}
              activeRegionalForm={matchedRegionalForm}
              onSelectRegionalForm={handleSelectRegionalForm}
              isRegionalTransforming={isRegionalTransforming}
              onScrollToStats={() => {
                setIsFocusMode(false)
                setTimeout(() => {
                  const target = document.querySelector('.detail-info') || document.querySelector('.pokemon-stats-container')
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }}
              t={t}
            />
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
            <div className="ability-list" role="tablist" aria-label={t.detail.abilities}>
              {currentAbilities.map((ability) => {
                const isSelected = activeSelectedAbility === ability
                const rawLabel = currentAbilityLabels[ability]
                const isInvalid = !rawLabel || rawLabel.toLowerCase() === ability.toLowerCase() || rawLabel.includes('-')
                const label =
                  extraAbilityData[ability]?.name ||
                  (!isInvalid ? rawLabel : formatName(ability.replaceAll('-', ' ')))
                return (
                  <button
                    key={ability}
                    type="button"
                    className={`ability-badge ${isSelected ? 'selected' : ''} ${statsBump ? 'ability-updated' : ''}`}
                    onClick={() => handleAbilityClick(ability)}
                    aria-expanded={isSelected}
                    aria-controls={isSelected ? `ability-panel-${ability}` : undefined}
                    title={t.detail.abilityClickHint || 'Haz clic para ver la explicación'}
                  >
                    <span>{label}</span>
                    <span className="ability-badge-arrow" aria-hidden="true">
                      {isSelected ? '▾' : '▸'}
                    </span>
                  </button>
                )
              })}
            </div>

            {activeSelectedAbility && (() => {
              const rawActive = currentAbilityLabels[activeSelectedAbility]
              const isInvalidActive = !rawActive || rawActive.toLowerCase() === activeSelectedAbility.toLowerCase() || rawActive.includes('-')
              const activeAbilityName =
                extraAbilityData[activeSelectedAbility]?.name ||
                (!isInvalidActive ? rawActive : formatName(activeSelectedAbility.replaceAll('-', ' ')))
              const activeAbilityDescription =
                extraAbilityData[activeSelectedAbility]?.description ||
                currentAbilityDescriptions[activeSelectedAbility] ||
                t.detail.abilityNoDescription

              return (
                <div
                  id={`ability-panel-${activeSelectedAbility}`}
                  className="ability-detail-panel"
                  role="region"
                  aria-label={activeAbilityName}
                >
                  <div className="ability-panel-header">
                    <div className="ability-panel-title-wrap">
                      <span className="ability-panel-title-label">{t.detail.ability || 'Habilidad'}:</span>
                      <strong className="ability-panel-name">
                        {activeAbilityName}
                      </strong>
                    </div>
                    <div className="ability-panel-actions">
                      <button
                        type="button"
                        className="ability-ai-btn"
                        onClick={(e) => handleAbilityAIAnalysis(e, activeSelectedAbility)}
                        title={t.detail.abilityAiTooltip || 'Analizar con IA (Próximamente)'}
                        aria-label={t.detail.abilityAiTooltip || 'Analizar con IA (Próximamente)'}
                      >
                        <span className="ability-ai-icon" aria-hidden="true">✦</span>
                        <span className="ability-ai-tooltip">{t.detail.abilityAiTooltip || 'Analizar con IA (Próximamente)'}</span>
                      </button>
                      <button
                        type="button"
                        className="ability-panel-close"
                        onClick={() => setSelectedAbility(null)}
                        aria-label={t.detail.abilityClose || 'Cerrar explicación'}
                        title={t.detail.abilityClose || 'Cerrar explicación'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="ability-panel-body">
                    <span className="ability-panel-eyebrow">
                      {t.detail.abilityBriefExplanation || 'Explicación breve'}
                    </span>
                    <p className="ability-panel-text">
                      {activeAbilityDescription}
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="stats-column">
            <p className="eyebrow">{t.detail.combat}</p>
            <h2>{t.detail.stats}</h2>
            <PokemonStats
              stats={currentStats}
              t={t}
              statsBump={statsBump}
              pokemonName={currentName}
              locale={locale}
            />
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

        <PokemonTypeAffinities
          types={currentTypes}
          pokemonName={currentName}
          t={t}
          locale={locale}
        />
      </main>
      <Footer t={t} />
    </div>
  )
}

export default PokemonDetail