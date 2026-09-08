import { memo, useMemo, useState } from 'react'
import {
  TYPE_COLORS,
  TYPE_ICONS,
  formatMultiplier,
  getAffinitiesSummary,
  getDefensiveAffinities,
  getDefensiveExplanation,
  getOffensiveAffinities,
  getOffensiveExplanation,
} from '../utils/typeEffectiveness'

function TypeAffinityCard({
  type,
  multiplier,
  categoryLabel,
  onClick,
  isSelected,
  t,
  badgeNote,
}) {
  const typeColor = TYPE_COLORS[type] || '#6c747d'
  const typeIcon = TYPE_ICONS[type] || '✨'
  const localizedTypeName = t?.types?.[type] || type
  const multText = formatMultiplier(multiplier)

  // Map multiplier to visual tone class
  const toneClass =
    multiplier === 4
      ? 'mult-x4'
      : multiplier === 2
        ? 'mult-x2'
        : multiplier === 0.25
          ? 'mult-xquarter'
          : multiplier === 0.5
            ? 'mult-xhalf'
            : multiplier === 0
              ? 'mult-x0'
              : 'mult-x1'

  return (
    <button
      type="button"
      className={`affinity-card ${toneClass} ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
      style={{ '--type-theme': typeColor }}
      aria-expanded={isSelected}
      aria-label={`${localizedTypeName} ${multText}: ${categoryLabel}`}
    >
      <div className="affinity-card-header">
        <span className="affinity-type-icon" aria-hidden="true">
          {typeIcon}
        </span>
        <span className="affinity-type-name">{localizedTypeName}</span>
      </div>

      <div className="affinity-card-body">
        <span className="affinity-card-mult">{multText}</span>
        <span className="affinity-card-category">{categoryLabel}</span>
      </div>

      {badgeNote && (
        <div className="affinity-card-footer">
          <span className="affinity-card-note">{badgeNote}</span>
        </div>
      )}
    </button>
  )
}

function PokemonTypeAffinities({
  types = [],
  pokemonName = 'Pokémon',
  t,
  locale = 'es',
}) {
  const [activeTab, setActiveTab] = useState('defensive') // 'defensive' | 'offensive'
  const [showNeutral, setShowNeutral] = useState(false)
  const [selectedMatchup, setSelectedMatchup] = useState(null)
  const [prevTypes, setPrevTypes] = useState(types)

  // Recalculate affinities dynamically whenever active types change (e.g. Mega Evolution)
  const defensiveAffinities = useMemo(() => {
    return getDefensiveAffinities(types)
  }, [types])

  const offensiveAffinities = useMemo(() => {
    return getOffensiveAffinities(types)
  }, [types])

  const smartSummary = useMemo(() => {
    return getAffinitiesSummary(defensiveAffinities, offensiveAffinities, pokemonName, t, locale)
  }, [defensiveAffinities, offensiveAffinities, pokemonName, t, locale])

  // Reset selected matchup when types change so explanation remains fresh (React pattern)
  if (prevTypes !== types) {
    setPrevTypes(types)
    setSelectedMatchup(null)
  }

  function handleCardClick(item, isOffensive = false) {
    if (
      selectedMatchup &&
      selectedMatchup.type === item.type &&
      selectedMatchup.isOffensive === isOffensive
    ) {
      setSelectedMatchup(null)
      return
    }

    setSelectedMatchup({
      ...item,
      isOffensive,
    })
  }

  // Generate explanation text for the currently selected card
  const activeExplanation = useMemo(() => {
    if (!selectedMatchup) return null

    if (selectedMatchup.isOffensive) {
      return getOffensiveExplanation(
        types,
        selectedMatchup.type,
        selectedMatchup,
        pokemonName,
        t,
        locale,
      )
    }

    return getDefensiveExplanation(
      types,
      selectedMatchup.type,
      selectedMatchup.multiplier,
      pokemonName,
      t,
      locale,
    )
  }, [selectedMatchup, types, pokemonName, t, locale])

  const affT = t?.affinities || {}

  return (
    <section className="type-affinities-section" aria-label={affT.title || 'Afinidades de tipo'}>
      <header className="affinities-header">
        <div className="affinities-header-copy">
          <p className="eyebrow">{affT.eyebrow || 'RELACIONES ELEMENTALES'}</p>
          <h2>
            {affT.title || 'Afinidades de'}{' '}
            <em>{affT.titleAccent || 'tipo.'}</em>
          </h2>
          <p className="affinities-subtitle">
            {affT.subtitle ||
              'Comprende qué tan vulnerable es este Pokémon y qué ventajas ofensivas le otorgan sus tipos.'}
          </p>
        </div>

        {/* Mode Selector Tabs: Defensivas / Ofensivas */}
        <div
          className="affinities-tab-bar"
          role="tablist"
          aria-label={locale?.startsWith('es') ? 'Modo de afinidad' : 'Affinity mode'}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'defensive'}
            className={`affinities-tab-btn ${activeTab === 'defensive' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('defensive')
              setSelectedMatchup(null)
            }}
          >
            <span className="tab-icon" aria-hidden="true">🛡️</span>
            <span>{affT.tabDefensive || 'Defensivas'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'offensive'}
            className={`affinities-tab-btn ${activeTab === 'offensive' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('offensive')
              setSelectedMatchup(null)
            }}
          >
            <span className="tab-icon" aria-hidden="true">⚔️</span>
            <span>{affT.tabOffensive || 'Ofensivas'}</span>
          </button>
        </div>
      </header>

      {/* Smart Summary Card */}
      {smartSummary && (
        <div className="affinities-summary-card">
          <div className="summary-badge">
            <span aria-hidden="true">🧠</span>
            <strong>{affT.summaryTitle || 'En resumen'}</strong>
          </div>
          <p>{smartSummary}</p>
        </div>
      )}

      {/* Helper text prompt */}
      <div className="affinities-prompt-note">
        <span className="prompt-sparkle" aria-hidden="true">✦</span>
        <span>{affT.howItWorks || 'Haz clic en cualquier tipo para ver la explicación didáctica del cálculo.'}</span>
      </div>

      {/* Interactive Explanation Drawer */}
      {selectedMatchup && (
        <div
          className="affinity-explanation-drawer"
          role="region"
          aria-live="polite"
          aria-label={affT.explanationTitle || 'Explicación del multiplicador'}
        >
          <div className="drawer-header">
            <div className="drawer-matchup-badge">
              <span
                className="matchup-chip"
                style={{
                  backgroundColor: colorMix(TYPE_COLORS[selectedMatchup.type] || '#6c747d', 18),
                  borderColor: TYPE_COLORS[selectedMatchup.type],
                  color: 'var(--navy)',
                }}
              >
                {TYPE_ICONS[selectedMatchup.type]} {t?.types?.[selectedMatchup.type] || selectedMatchup.type}
              </span>

              <span className="matchup-arrow" aria-hidden="true">
                {selectedMatchup.isOffensive ? '→' : '←'}
              </span>

              <span className="matchup-mult-chip">
                {formatMultiplier(
                  selectedMatchup.isOffensive
                    ? selectedMatchup.bestMultiplier
                    : selectedMatchup.multiplier,
                )}
              </span>
            </div>

            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setSelectedMatchup(null)}
              aria-label={affT.closeExplanation || 'Cerrar'}
              title={affT.closeExplanation || 'Cerrar'}
            >
              ✕
            </button>
          </div>

          <div className="drawer-content">
            <p className="drawer-text">{activeExplanation}</p>

            {/* If dual-type defensive, show mathematical calculation breakdown */}
            {!selectedMatchup.isOffensive && selectedMatchup.breakdown?.length > 1 && (
              <div className="drawer-breakdown">
                <span className="breakdown-label">
                  {affT.breakdownLabel || 'Desglose por tipo'}:
                </span>
                <div className="breakdown-chips">
                  {selectedMatchup.breakdown.map((b) => (
                    <span key={b.defendingType} className="breakdown-chip">
                      {t?.types?.[b.defendingType] || b.defendingType}:{' '}
                      <strong>{formatMultiplier(b.multiplier)}</strong>
                    </span>
                  ))}
                  <span className="breakdown-formula">
                    = <strong>{formatMultiplier(selectedMatchup.multiplier)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          DEFENSIVE TAB
          =================================================================== */}
      {activeTab === 'defensive' && (
        <div className="affinities-content-block">
          {/* Hyper Weaknesses (×4) */}
          {defensiveAffinities.hyperWeakness.length > 0 && (
            <div className="affinity-group group-hyper-weakness">
              <div className="group-heading">
                <h3>{affT.hyperWeakness || 'Hiperdebilidad'}</h3>
                <span className="group-pill mult-x4">×4</span>
              </div>
              <div className="affinity-grid">
                {defensiveAffinities.hyperWeakness.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.multiplier}
                    categoryLabel={affT.hyperWeakness || 'Hiperdebilidad'}
                    isSelected={selectedMatchup?.type === item.type && !selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, false)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses (×2) */}
          {defensiveAffinities.weakness.length > 0 && (
            <div className="affinity-group group-weakness">
              <div className="group-heading">
                <h3>{affT.weakness || 'Debilidad'}</h3>
                <span className="group-pill mult-x2">×2</span>
              </div>
              <div className="affinity-grid">
                {defensiveAffinities.weakness.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.multiplier}
                    categoryLabel={affT.weakness || 'Debilidad'}
                    isSelected={selectedMatchup?.type === item.type && !selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, false)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Extreme Resistances (×¼) */}
          {defensiveAffinities.extremeResistance.length > 0 && (
            <div className="affinity-group group-extreme-resistance">
              <div className="group-heading">
                <h3>{affT.extremeResistance || 'Resistencia extrema'}</h3>
                <span className="group-pill mult-xquarter">×¼</span>
              </div>
              <div className="affinity-grid">
                {defensiveAffinities.extremeResistance.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.multiplier}
                    categoryLabel={affT.extremeResistance || 'Resistencia extrema'}
                    isSelected={selectedMatchup?.type === item.type && !selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, false)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resistances (×½) */}
          {defensiveAffinities.resistance.length > 0 && (
            <div className="affinity-group group-resistance">
              <div className="group-heading">
                <h3>{affT.resistance || 'Resistencia'}</h3>
                <span className="group-pill mult-xhalf">×½</span>
              </div>
              <div className="affinity-grid">
                {defensiveAffinities.resistance.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.multiplier}
                    categoryLabel={affT.resistance || 'Resistencia'}
                    isSelected={selectedMatchup?.type === item.type && !selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, false)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Immunities (×0) */}
          {defensiveAffinities.immunity.length > 0 && (
            <div className="affinity-group group-immunity">
              <div className="group-heading">
                <h3>{affT.immunity || 'Inmunidad'}</h3>
                <span className="group-pill mult-x0">×0</span>
              </div>
              <div className="affinity-grid">
                {defensiveAffinities.immunity.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.multiplier}
                    categoryLabel={affT.immunity || 'Inmunidad'}
                    isSelected={selectedMatchup?.type === item.type && !selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, false)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Neutral Types (×1) - Initially Hidden with Toggle */}
          {defensiveAffinities.neutral.length > 0 && (
            <div className="affinity-neutral-wrapper">
              <button
                type="button"
                className="toggle-neutral-btn"
                onClick={() => setShowNeutral((prev) => !prev)}
                aria-expanded={showNeutral}
              >
                <span>
                  {showNeutral
                    ? affT.hideNeutral || 'Ocultar tipos neutrales'
                    : (affT.showNeutral || 'Mostrar tipos neutrales ({count})').replace(
                        '{count}',
                        defensiveAffinities.neutral.length,
                      )}
                </span>
                <span className="toggle-chevron" aria-hidden="true">
                  {showNeutral ? '▲' : '▼'}
                </span>
              </button>

              {showNeutral && (
                <div className="affinity-group group-neutral">
                  <div className="affinity-grid">
                    {defensiveAffinities.neutral.map((item) => (
                      <TypeAffinityCard
                        key={item.type}
                        type={item.type}
                        multiplier={item.multiplier}
                        categoryLabel={affT.neutral || 'Neutral'}
                        isSelected={selectedMatchup?.type === item.type && !selectedMatchup?.isOffensive}
                        onClick={() => handleCardClick(item, false)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          OFFENSIVE TAB
          =================================================================== */}
      {activeTab === 'offensive' && (
        <div className="affinities-content-block">
          {/* Super Effective (×2) */}
          {offensiveAffinities.superEffective.length > 0 && (
            <div className="affinity-group group-super-effective">
              <div className="group-heading">
                <h3>{affT.superEffective || 'Supereficaz'}</h3>
                <span className="group-pill mult-x2">×2</span>
              </div>
              <div className="affinity-grid">
                {offensiveAffinities.superEffective.map((item) => {
                  const attackerLabel = item.bestTypes
                    .map((typeKey) => t?.types?.[typeKey] || typeKey)
                    .join(', ')

                  return (
                    <TypeAffinityCard
                      key={item.type}
                      type={item.type}
                      multiplier={item.bestMultiplier}
                      categoryLabel={affT.superEffective || 'Supereficaz'}
                      badgeNote={item.bestTypes.length > 0 ? (locale?.startsWith('es') ? `vía ${attackerLabel}` : `via ${attackerLabel}`) : null}
                      isSelected={selectedMatchup?.type === item.type && selectedMatchup?.isOffensive}
                      onClick={() => handleCardClick(item, true)}
                      t={t}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Resisted (×½) */}
          {offensiveAffinities.resisted.length > 0 && (
            <div className="affinity-group group-resisted">
              <div className="group-heading">
                <h3>{affT.resisted || 'Poco eficaz'}</h3>
                <span className="group-pill mult-xhalf">×½</span>
              </div>
              <div className="affinity-grid">
                {offensiveAffinities.resisted.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.bestMultiplier}
                    categoryLabel={affT.resisted || 'Poco eficaz'}
                    isSelected={selectedMatchup?.type === item.type && selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, true)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Immune / No effect (×0) */}
          {offensiveAffinities.immune.length > 0 && (
            <div className="affinity-group group-immune">
              <div className="group-heading">
                <h3>{affT.noEffect || 'Sin efecto'}</h3>
                <span className="group-pill mult-x0">×0</span>
              </div>
              <div className="affinity-grid">
                {offensiveAffinities.immune.map((item) => (
                  <TypeAffinityCard
                    key={item.type}
                    type={item.type}
                    multiplier={item.bestMultiplier}
                    categoryLabel={affT.noEffect || 'Sin efecto'}
                    isSelected={selectedMatchup?.type === item.type && selectedMatchup?.isOffensive}
                    onClick={() => handleCardClick(item, true)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Neutral Types (×1) - Initially Hidden with Toggle */}
          {offensiveAffinities.neutral.length > 0 && (
            <div className="affinity-neutral-wrapper">
              <button
                type="button"
                className="toggle-neutral-btn"
                onClick={() => setShowNeutral((prev) => !prev)}
                aria-expanded={showNeutral}
              >
                <span>
                  {showNeutral
                    ? affT.hideNeutral || 'Ocultar tipos neutrales'
                    : (affT.showNeutral || 'Mostrar tipos neutrales ({count})').replace(
                        '{count}',
                        offensiveAffinities.neutral.length,
                      )}
                </span>
                <span className="toggle-chevron" aria-hidden="true">
                  {showNeutral ? '▲' : '▼'}
                </span>
              </button>

              {showNeutral && (
                <div className="affinity-group group-neutral">
                  <div className="affinity-grid">
                    {offensiveAffinities.neutral.map((item) => (
                      <TypeAffinityCard
                        key={item.type}
                        type={item.type}
                        multiplier={item.bestMultiplier}
                        categoryLabel={affT.neutral || 'Neutral'}
                        isSelected={selectedMatchup?.type === item.type && selectedMatchup?.isOffensive}
                        onClick={() => handleCardClick(item, true)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function colorMix(hex, pct = 15) {
  return `color-mix(in srgb, ${hex} ${pct}%, #fafbf9)`
}

export default memo(PokemonTypeAffinities)
