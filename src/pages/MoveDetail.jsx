import { useMemo, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { formatName } from '../services/pokeapi'
import { playClickSound, playButtonSound } from '../utils/audio'
import { selectRepresentativePokemon } from '../utils/representativePokemon'

const typeColors = {
  bug: '#65a47b',
  dark: '#59636b',
  dragon: '#7d77a9',
  electric: '#ddb431',
  fairy: '#c875a6',
  fighting: '#c87545',
  fire: '#e5764f',
  flying: '#7f9db2',
  ghost: '#756d9a',
  grass: '#65a47b',
  ground: '#b18a62',
  ice: '#70afae',
  normal: '#929a98',
  poison: '#a46f9a',
  psychic: '#dd7181',
  rock: '#a29468',
  steel: '#77858e',
  water: '#5d98b4',
}

function MoveDetail({
  move,
  error,
  isLoading,
  onBack,
  onPokemonClick,
  onHomeClick,
  onPokedexClick,
  onFavoritesClick,
  t,
  locale,
  onLocaleChange,
}) {
  const [visibleCount, setVisibleCount] = useState(48)

  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  function handleLearnerClick(pokemonName) {
    playClickSound()
    onPokemonClick?.(pokemonName)
  }

  // Selección determinista de Pokémon representativos (4 especies diversas y características)
  const { featuredLearners, allLearners } = useMemo(() => {
    if (!move?.learnedBy) return { featuredLearners: [], allLearners: [] }
    const valid = move.learnedBy.filter((p) => p.id && p.id <= 1025)
    const representatives = selectRepresentativePokemon({ move, learners: valid, limit: 4 })
    return {
      featuredLearners: representatives,
      allLearners: valid,
    }
  }, [move])

  if (isLoading) {
    return (
      <div className="page-shell">
        <Navbar
          t={t}
          locale={locale}
          onLocaleChange={onLocaleChange}
          onHomeClick={onHomeClick}
          onPokedexClick={onPokedexClick}
          onFavoritesClick={onFavoritesClick}
          activeNav="moves"
        />
        <main className="detail-state">
          <div className="loader-orbit" aria-hidden="true">
            <span />
          </div>
          <p className="eyebrow">{t?.moveDetail?.loadingEyebrow || 'CONSULTANDO EL MOVE DEX'}</p>
          <h1>
            {t?.moveDetail?.loadingTitle || 'Buscando'}{' '}
            <em>{t?.moveDetail?.loadingAccent || 'movimiento.'}</em>
          </h1>
          <p>{t?.moveDetail?.loadingText}</p>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  if (error || !move) {
    return (
      <div className="page-shell">
        <Navbar
          t={t}
          locale={locale}
          onLocaleChange={onLocaleChange}
          onHomeClick={onHomeClick}
          onPokedexClick={onPokedexClick}
          onFavoritesClick={onFavoritesClick}
          activeNav="moves"
        />
        <main className="detail-state">
          <span className="error-mark" aria-hidden="true">!</span>
          <p className="eyebrow">{t?.moveDetail?.errorEyebrow || 'NO HAY RESULTADOS'}</p>
          <h1>
            {t?.moveDetail?.errorTitle || 'No encontramos'}{' '}
            <em>{t?.moveDetail?.errorAccent || 'ese movimiento.'}</em>
          </h1>
          <p>{error?.message || t?.moveDetail?.noDescription}</p>
          <div className="detail-actions">
            <button className="primary-action" type="button" onClick={handleBackClick}>
              {t?.moveDetail?.back || 'Volver a movimientos'}
            </button>
          </div>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  const typeColor = typeColors[move.type] || '#77858e'
  const localizedTypeName = t?.types?.[move.type] || move.type.toUpperCase()
  const localizedCategoryName = t?.moves?.categories?.[move.category] || move.category.toUpperCase()
  const targetText = t?.moves?.targets?.[move.target] || formatName(move.target)

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        onHomeClick={onHomeClick}
        onPokedexClick={onPokedexClick}
        onFavoritesClick={onFavoritesClick}
        activeNav="moves"
      />

      <main className="move-detail-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t?.moveDetail?.back || 'Volver a movimientos'}
        </button>

        <div className="move-detail-container" style={{ '--detail-accent': typeColor }}>
          {/* Cabecera Principal del Movimiento */}
          <section className="move-detail-hero">
            <div className="move-detail-hero-header">
              <div className="move-detail-title-group">
                <p className="eyebrow" style={{ color: typeColor, marginBottom: '6px' }}>
                  {t?.moveDetail?.eyebrow || 'MOVIMIENTO'} #{String(move.id).padStart(3, '0')}
                </p>
                <h1>{move.displayName || move.localizedName}</h1>
                <p className="move-detail-orig-name">{move.originalName}</p>
              </div>

              <div className="move-detail-badges-row">
                <span className="move-detail-type-badge">{localizedTypeName}</span>
                <span className={`move-detail-cat-badge ${move.category}`}>
                  {localizedCategoryName}
                </span>
              </div>
            </div>

            {/* Parrilla de Estadísticas Factuales */}
            <div className="move-detail-stats-grid">
              <div className="move-detail-stat-card">
                <div className="move-detail-stat-val">
                  {move.power !== null && move.power > 0 ? move.power : '—'}
                </div>
                <div className="move-detail-stat-lbl">
                  {t?.moveDetail?.powerLabel || 'POTENCIA'}
                </div>
              </div>

              <div className="move-detail-stat-card">
                <div className="move-detail-stat-val">
                  {move.accuracy !== null ? `${move.accuracy}%` : '—'}
                </div>
                <div className="move-detail-stat-lbl">
                  {t?.moveDetail?.accuracyLabel || 'PRECISIÓN'}
                </div>
              </div>

              <div className="move-detail-stat-card">
                <div className="move-detail-stat-val">{move.pp}</div>
                <div className="move-detail-stat-lbl">
                  {t?.moveDetail?.ppLabel || 'PP'}
                </div>
              </div>

              <div className="move-detail-stat-card">
                <div className="move-detail-stat-val">
                  {move.priority > 0 ? `+${move.priority}` : move.priority}
                </div>
                <div className="move-detail-stat-lbl">
                  {t?.moveDetail?.priorityLabel || 'PRIORIDAD'}
                </div>
              </div>

              <div className="move-detail-stat-card">
                <div className="move-detail-stat-val" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                  {targetText}
                </div>
                <div className="move-detail-stat-lbl">
                  {t?.moveDetail?.targetLabel || 'OBJETIVO'}
                </div>
              </div>

              {move.effectChance !== null && (
                <div className="move-detail-stat-card">
                  <div className="move-detail-stat-val">{move.effectChance}%</div>
                  <div className="move-detail-stat-lbl">
                    {t?.moveDetail?.effectChanceLabel || 'PROBABILIDAD'}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Bloques de Descripción y Efectos */}
          <section className="move-detail-content-blocks">
            <div className="move-content-block">
              <div className="move-block-header">
                <span className="move-block-glyph" aria-hidden="true">📜</span>
                <h3>{t?.moveDetail?.descriptionLabel || 'DESCRIPCIÓN'}</h3>
              </div>
              <p className="move-block-text">
                {move.description || t?.moveDetail?.noDescription}
              </p>
            </div>

            <div className="move-content-block">
              <div className="move-block-header">
                <span className="move-block-glyph" aria-hidden="true">✦</span>
                <h3>{t?.moveDetail?.effectLabel || 'EFECTO TÁCTICO'}</h3>
              </div>
              <p className="move-block-text">
                {move.effect || t?.moveDetail?.noEffect}
              </p>

              {move.statChanges && move.statChanges.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    {t?.moveDetail?.statChangesLabel || 'MODIFICACIÓN DE ESTADÍSTICAS'}:
                  </div>
                  {move.statChanges.map((sc) => {
                    const sign = sc.change > 0 ? `+${sc.change}` : sc.change
                    const statName =
                      t?.detail?.statLabels?.[sc.stat] || formatName(sc.stat)
                    return (
                      <span key={sc.stat} className="move-stat-change-tag">
                        {sc.change > 0 ? '↑' : '↓'} {statName} ({sign})
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Sección de Pokémon que aprenden este movimiento */}
          <section className="move-learners-section" aria-label={t?.moveDetail?.allPokemon}>
            <div className="move-learners-heading">
              <h2>{t?.moveDetail?.allPokemon || 'Pokémon que aprenden este movimiento'}</h2>
              <p>
                {t?.moveDetail?.learnersCount?.replace('{count}', allLearners.length) ||
                  `${allLearners.length} Pokémon compatibles`}
              </p>
            </div>

            {/* Usuarios destacados */}
            {featuredLearners.length > 0 && (
              <>
                <div className="move-learners-subheading">
                  <span>◆</span>
                  <span>{t?.moveDetail?.featuredPokemon || 'Usuarios destacados'}</span>
                </div>
                <div className="move-learners-grid">
                  {featuredLearners.map((pokemon) => (
                    <div
                      key={pokemon.name}
                      role="button"
                      tabIndex={0}
                      className="move-learner-chip"
                      onClick={() => handleLearnerClick(pokemon.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleLearnerClick(pokemon.name)
                        }
                      }}
                      aria-label={`${formatName(pokemon.name)} #${String(pokemon.id).padStart(3, '0')}`}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                        alt={formatName(pokemon.name)}
                        loading="lazy"
                        className="move-learner-img"
                        onError={(e) => {
                          e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                        }}
                      />
                      <div className="move-learner-info">
                        <span className="move-learner-num">
                          #{String(pokemon.id).padStart(3, '0')}
                        </span>
                        <span className="move-learner-name">{formatName(pokemon.name)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Todos los aprendices */}
            {allLearners.length > 0 ? (
              <>
                <div className="move-learners-subheading" style={{ color: 'var(--navy)', marginTop: '36px' }}>
                  <span>▸</span>
                  <span>{t?.moveDetail?.allPokemon || 'Todos los usuarios'}</span>
                </div>
                <div className="move-learners-grid">
                  {allLearners.slice(0, visibleCount).map((pokemon) => (
                    <div
                      key={pokemon.name}
                      role="button"
                      tabIndex={0}
                      className="move-learner-chip"
                      onClick={() => handleLearnerClick(pokemon.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleLearnerClick(pokemon.name)
                        }
                      }}
                      aria-label={`${formatName(pokemon.name)} #${String(pokemon.id).padStart(3, '0')}`}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                        alt={formatName(pokemon.name)}
                        loading="lazy"
                        className="move-learner-img"
                        onError={(e) => {
                          e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                        }}
                      />
                      <div className="move-learner-info">
                        <span className="move-learner-num">
                          #{String(pokemon.id).padStart(3, '0')}
                        </span>
                        <span className="move-learner-name">{formatName(pokemon.name)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleCount < allLearners.length && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
                    <button
                      type="button"
                      className="moves-load-more-btn"
                      onClick={() => {
                        playButtonSound()
                        setVisibleCount((c) => c + 48)
                      }}
                    >
                      {t?.moves?.loadMore || 'Ver más Pokémon'} (+{Math.min(48, allLearners.length - visibleCount)})
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--muted)', marginTop: '16px' }}>
                {t?.moveDetail?.noLearners || 'No se encontraron Pokémon compatibles.'}
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer t={t} />
    </div>
  )
}

export default MoveDetail
