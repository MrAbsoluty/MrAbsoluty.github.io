import { useEffect, useState } from 'react'
import { getEvolutionChain } from '../services/pokeapi'
import { playButtonSound } from '../utils/audio'

const typeColors = {
  bug: '#65a47b', dark: '#59636b', dragon: '#7d77a9', electric: '#ddb431', fairy: '#c875a6', fighting: '#c87545', fire: '#e5764f', flying: '#7f9db2', ghost: '#756d9a', grass: '#65a47b', ground: '#b18a62', ice: '#70afae', normal: '#929a98', poison: '#a46f9a', psychic: '#dd7181', rock: '#a29468', steel: '#77858e', water: '#5d98b4',
}

function ArrowIcon() {
  return (
    <svg className="evolution-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function EvolutionCard({ node, isCurrent, onPokemonClick, t }) {
  const handleClick = () => {
    if (isCurrent) return
    playButtonSound()
    onPokemonClick?.(node.name)
  }

  const content = (
    <>
      {isCurrent && (
        <span className="evolution-badge-current">
          <span className="evolution-dot" aria-hidden="true" />
          {t.detail?.currentPokemon || 'Actual'}
        </span>
      )}
      <span className="evolution-card-num">#{String(node.id).padStart(3, '0')}</span>
      <div className="evolution-card-stage">
        <img
          className="evolution-card-sprite"
          src={node.image}
          alt={node.localizedName}
          loading="lazy"
        />
      </div>
      <strong className="evolution-card-name">{node.localizedName}</strong>
      {node.types && node.types.length > 0 && (
        <div className="evolution-card-types">
          {node.types.map((type) => (
            <span
              key={type}
              className="evolution-type-tag"
              style={{ '--type-color': typeColors[type] || '#ed6d5d' }}
            >
              {t.types?.[type] || type}
            </span>
          ))}
        </div>
      )}
    </>
  )

  if (isCurrent) {
    return (
      <div
        className="evolution-card is-current"
        aria-current="page"
        aria-label={`${node.localizedName} #${String(node.id).padStart(3, '0')}, ${t.detail?.currentPokemon || 'Actual'}`}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="evolution-card is-interactive"
      onClick={handleClick}
      aria-label={`${node.localizedName} #${String(node.id).padStart(3, '0')}`}
    >
      {content}
    </button>
  )
}

function EvolutionNode({ node, currentPokemonName, pokemonId, onPokemonClick, t }) {
  const isCurrent = node.id === pokemonId || node.name === currentPokemonName
  const hasChildren = node.evolvesTo && node.evolvesTo.length > 0
  const isMultiBranch = node.evolvesTo && node.evolvesTo.length > 1

  return (
    <div className={`evolution-tree-branch ${isMultiBranch ? 'has-multiple-branches' : ''}`}>
      <div className="evolution-card-cell">
        <EvolutionCard
          node={node}
          isCurrent={isCurrent}
          onPokemonClick={onPokemonClick}
          t={t}
        />
      </div>

      {hasChildren && (
        <div className={`evolution-children-cluster ${isMultiBranch ? 'is-branched-cluster' : ''}`}>
          {node.evolvesTo.map((child) => (
            <div className="evolution-child-path" key={child.name || child.id}>
              <div className="evolution-connector">
                <span className="evolution-condition-pill" title={child.conditions || ''}>
                  {child.conditions || (t.detail?.evolutionConditions?.special || 'Evolución')}
                </span>
                <div className="evolution-arrow-wrap">
                  <ArrowIcon />
                </div>
              </div>
              <EvolutionNode
                node={child}
                currentPokemonName={currentPokemonName}
                pokemonId={pokemonId}
                onPokemonClick={onPokemonClick}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EvolutionChain({ pokemonId, speciesUrl, currentPokemonName, onPokemonClick, locale, t }) {
  const [chainData, setChainData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [prevTarget, setPrevTarget] = useState(`${speciesUrl || pokemonId}_${locale}`)

  const currentTarget = `${speciesUrl || pokemonId}_${locale}`
  if (currentTarget !== prevTarget) {
    setPrevTarget(currentTarget)
    setIsLoading(true)
    setChainData(null)
  }

  useEffect(() => {
    let isMounted = true

    getEvolutionChain(speciesUrl || pokemonId, locale)
      .then((data) => {
        if (!isMounted) return
        setChainData(data)
      })
      .catch((err) => {
        console.error('Error fetching evolution chain:', err)
        if (isMounted) setChainData(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [speciesUrl, pokemonId, locale])

  if (isLoading) {
    return (
      <section className="evolution-section is-loading" aria-busy="true">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-icon" aria-hidden="true">🧬</span> {t.detail?.evolutionEyebrow || 'LÍNEA EVOLUTIVA'}
            </p>
            <h2>
              {t.detail?.evolutionTitle || 'Cadena'} <em>{t.detail?.evolutionTitleAccent || 'evolutiva.'}</em>
            </h2>
          </div>
        </div>
        <div className="evolution-skeleton-container">
          <div className="evolution-skeleton-card" />
          <div className="evolution-skeleton-arrow" />
          <div className="evolution-skeleton-card" />
        </div>
      </section>
    )
  }

  // If there is no evolution chain or the Pokemon does not evolve, hide the section
  if (!chainData || !chainData.chain) {
    return null
  }

  return (
    <section className="evolution-section" aria-label={t.detail?.evolutionEyebrow || 'Línea evolutiva'}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-icon" aria-hidden="true">🧬</span> {t.detail?.evolutionEyebrow || 'LÍNEA EVOLUTIVA'}
          </p>
          <h2>
            {t.detail?.evolutionTitle || 'Cadena'} <em>{t.detail?.evolutionTitleAccent || 'evolutiva.'}</em>
          </h2>
        </div>
        <p className="section-intro">
          {t.detail?.evolutionSubtitle || 'Etapas de crecimiento y condiciones para alcanzar cada forma.'}
        </p>
      </div>

      <div className="evolution-scroll-canvas" tabIndex={0} role="region" aria-label={t.detail?.evolutionTitle || 'Línea evolutiva'}>
        <div className="evolution-tree-root">
          <EvolutionNode
            node={chainData.chain}
            currentPokemonName={currentPokemonName}
            pokemonId={pokemonId}
            onPokemonClick={onPokemonClick}
            t={t}
          />
        </div>
      </div>
    </section>
  )
}

export default EvolutionChain
