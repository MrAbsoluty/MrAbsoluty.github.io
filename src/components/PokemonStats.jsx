import { memo, useEffect, useMemo, useState } from 'react'
import {
  STAT_ICONS,
  STAT_ORDER,
  getHighlightedStats,
  getStatColor,
  getStatExplanation,
  getStatPercentage,
  getTotalStatColor,
  getTotalStatExplanation,
  getTotalStatPercentage,
} from '../utils/pokemonStats'

function formatFallbackName(name) {
  if (!name) return ''
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function PokemonStats({
  stats = [],
  t,
  statsBump = false,
  onStatClick,
  pokemonName = 'Pokémon',
  locale = 'es',
}) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [expandedStat, setExpandedStat] = useState(null)
  const [prevStats, setPrevStats] = useState(stats)

  // Reset expanded stat when stats change (e.g. Mega Evolution transformation/reversion)
  if (prevStats !== stats) {
    setPrevStats(stats)
    setExpandedStat(null)
  }

  // Trigger smooth fill animation on mount or when stats array changes
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsAnimated(true)
    })

    return () => {
      cancelAnimationFrame(frameId)
      setIsAnimated(false)
    }
  }, [stats])

  // Create lookup dictionary for input stats
  const statsMap = useMemo(() => {
    const map = new Map()
    stats.forEach((s) => {
      if (s?.name) {
        map.set(s.name, Number(s.value) || 0)
      }
    })
    return map
  }, [stats])

  // Order stats according to canonical official Pokédex order
  const orderedStats = useMemo(() => {
    // If stats are already formatted with STAT_ORDER, respect order
    const ordered = STAT_ORDER.map((name) => ({
      name,
      value: statsMap.has(name) ? statsMap.get(name) : 0,
    }))

    // Include any custom/extra stats that weren't in STAT_ORDER if present
    stats.forEach((s) => {
      if (s?.name && !STAT_ORDER.includes(s.name)) {
        ordered.push({
          name: s.name,
          value: Number(s.value) || 0,
        })
      }
    })

    return ordered
  }, [statsMap, stats])

  // Compute highlighted stats dynamically
  const highlightedSet = useMemo(() => {
    return getHighlightedStats(orderedStats)
  }, [orderedStats])

  // Base Stat Total (BST) calculation
  const totalStatsValue = useMemo(() => {
    return orderedStats.reduce((acc, s) => acc + (Number(s.value) || 0), 0)
  }, [orderedStats])

  const totalExplanation = useMemo(() => {
    return getTotalStatExplanation(totalStatsValue, pokemonName, locale, t)
  }, [totalStatsValue, pokemonName, locale, t])

  const handleStatToggle = (statItem) => {
    const nextState = expandedStat === statItem.name ? null : statItem.name
    setExpandedStat(nextState)
    onStatClick?.(statItem)
  }

  return (
    <div
      className="pokemon-stats-container"
      role="region"
      aria-label={t?.detail?.stats || 'Estadísticas base'}
    >
      <div className="pokemon-stats-list">
        {orderedStats.map((stat) => {
          const isHighlighted = highlightedSet.has(stat.name)
          const isExpanded = expandedStat === stat.name
          const color = getStatColor(stat.value)
          const percent = getStatPercentage(stat.value)
          const label =
            t?.detail?.statLabels?.[stat.name] || formatFallbackName(stat.name)
          const statIcon = STAT_ICONS[stat.name] || '📊'

          const explanation = getStatExplanation(
            stat.name,
            stat.value,
            orderedStats,
            pokemonName,
            locale,
            t,
          )

          const ariaHighlightText = isHighlighted
            ? ' - ' + (t?.detail?.highlightedStat || 'Estadística destacada')
            : ''
          const ariaExpandedText = isExpanded ? ' (Expandido)' : ''
          const ariaLabel = `${label}: ${stat.value} de 255${ariaHighlightText}${ariaExpandedText}`

          return (
            <div
              key={stat.name}
              className={`pokemon-stat-card ${isExpanded ? 'is-expanded' : ''} ${isHighlighted ? 'is-highlighted' : ''} standing-${explanation.standing}`}
              style={{
                '--stat-color': color,
              }}
            >
              <button
                type="button"
                className={`pokemon-stat-row stat-card-trigger ${isHighlighted ? 'is-highlighted' : ''} ${isExpanded ? 'is-active' : ''}`}
                onClick={() => handleStatToggle(stat)}
                aria-expanded={isExpanded}
                aria-controls={`stat-panel-${stat.name}`}
                aria-label={ariaLabel}
              >
                <div className="stat-info">
                  <div className="stat-name-wrap">
                    <span className="stat-icon" aria-hidden="true">
                      {statIcon}
                    </span>
                    <span className="stat-name">{label}</span>
                  </div>

                  <div className="stat-value-group">
                    <strong
                      className={`stat-value ${statsBump ? 'stat-animating' : ''}`}
                    >
                      {stat.value}
                    </strong>

                    {isHighlighted && (
                      <span
                        className="stat-highlight-badge"
                        title={t?.detail?.highlightedStat || 'Estadística destacada'}
                        aria-hidden="true"
                      >
                        ✦
                      </span>
                    )}

                    <span
                      className={`stat-expand-chevron ${isExpanded ? 'is-open' : ''}`}
                      aria-hidden="true"
                      title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="11"
                        height="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="stat-track" aria-hidden="true">
                  <span
                    className="stat-fill"
                    style={{
                      width: `${isAnimated ? percent : 0}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </button>

              {/* Smooth animated explanation panel (0fr -> 1fr grid transition) */}
              <div
                id={`stat-panel-${stat.name}`}
                className={`stat-card-expandable ${isExpanded ? 'is-open' : ''}`}
                role="region"
                aria-label={explanation.title}
              >
                <div className="stat-card-expandable-inner">
                  <div className="stat-explanation-panel">
                    <div className="stat-explanation-header">
                      <h4 className="stat-explanation-title">{explanation.title}</h4>
                      <span className={`stat-standing-pill standing-${explanation.standing}`}>
                        <span className="standing-icon" aria-hidden="true">
                          {explanation.badgeIcon}
                        </span>
                        <span>{explanation.badgeLabel}</span>
                      </span>
                    </div>

                    <p className="stat-explanation-def">{explanation.definition}</p>

                    <div className="stat-interpretation-box">
                      <p className="stat-interpretation-text">{explanation.interpretation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Base Stat Total (BST) / Estadísticas Totales */}
        {totalStatsValue > 0 && (() => {
          const isTotalExpanded = expandedStat === 'total'
          const totalColor = getTotalStatColor(totalStatsValue)
          const totalPercent = getTotalStatPercentage(totalStatsValue)
          const totalLabel = t?.detail?.total || 'Total'
          const totalFullLabel = t?.detail?.totalStats || 'Estadísticas Totales'
          const ariaTotalText = `${totalFullLabel}: ${totalStatsValue} de 780${isTotalExpanded ? ' (Expandido)' : ''}`

          return (
            <div
              className={`pokemon-stat-card is-total ${isTotalExpanded ? 'is-expanded' : ''} standing-${totalExplanation.standing}`}
              style={{
                '--stat-color': totalColor,
              }}
            >
              <button
                type="button"
                className={`pokemon-stat-row stat-card-trigger is-total ${isTotalExpanded ? 'is-active' : ''}`}
                onClick={() => {
                  const nextState = expandedStat === 'total' ? null : 'total'
                  setExpandedStat(nextState)
                  onStatClick?.({ name: 'total', value: totalStatsValue })
                }}
                aria-expanded={isTotalExpanded}
                aria-controls="stat-panel-total"
                aria-label={ariaTotalText}
                title={totalFullLabel}
              >
                <div className="stat-info">
                  <div className="stat-name-wrap">
                    <span className="stat-icon" aria-hidden="true">
                      🏆
                    </span>
                    <span className="stat-name stat-name-total">
                      {totalLabel}
                    </span>
                  </div>

                  <div className="stat-value-group">
                    <strong
                      className={`stat-value stat-value-total ${statsBump ? 'stat-animating' : ''}`}
                    >
                      {totalStatsValue}
                    </strong>

                    <span
                      className={`stat-expand-chevron ${isTotalExpanded ? 'is-open' : ''}`}
                      aria-hidden="true"
                      title={isTotalExpanded ? 'Contraer' : 'Expandir'}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="11"
                        height="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="stat-track stat-track-total" aria-hidden="true">
                  <span
                    className="stat-fill stat-fill-total"
                    style={{
                      width: `${isAnimated ? totalPercent : 0}%`,
                      backgroundColor: totalColor,
                    }}
                  />
                </div>
              </button>

              {/* Smooth animated explanation panel */}
              <div
                id="stat-panel-total"
                className={`stat-card-expandable ${isTotalExpanded ? 'is-open' : ''}`}
                role="region"
                aria-label={totalExplanation.title}
              >
                <div className="stat-card-expandable-inner">
                  <div className="stat-explanation-panel">
                    <div className="stat-explanation-header">
                      <h4 className="stat-explanation-title">{totalExplanation.title}</h4>
                      <span className={`stat-standing-pill standing-${totalExplanation.standing}`}>
                        <span className="standing-icon" aria-hidden="true">
                          {totalExplanation.badgeIcon}
                        </span>
                        <span>{totalExplanation.badgeLabel}</span>
                      </span>
                    </div>

                    <p className="stat-explanation-def">{totalExplanation.definition}</p>

                    <div className="stat-interpretation-box">
                      <p className="stat-interpretation-text">{totalExplanation.interpretation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default memo(PokemonStats)
