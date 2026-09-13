import { useEffect } from 'react'
import { sanitizePokemonTerms } from '../utils/sanitizePokemonTerms'

/**
 * Determina un icono contextual adecuado según la temática de la habilidad.
 */
export function getAbilityIcon(abilityName = '', abilityRawName = '') {
  const text = `${abilityName} ${abilityRawName}`.toLowerCase()

  if (text.includes('sol') || text.includes('sequ') || text.includes('drought') || text.includes('sun')) return '☀️'
  if (text.includes('llov') || text.includes('drizzle') || text.includes('lluv') || text.includes('rain')) return '🌧️'
  if (text.includes('aren') || text.includes('sand') || text.includes('tormenta')) return '🌪️'
  if (text.includes('niev') || text.includes('snow') || text.includes('graniz') || text.includes('hail') || text.includes('ice')) return '❄️'
  if (text.includes('electr') || text.includes('volti') || (text.includes('surge') && text.includes('elec'))) return '⚡'
  if (text.includes('psí') || text.includes('psi') || text.includes('psychic')) return '🔮'
  if (text.includes('hierb') || text.includes('herb') || text.includes('grassy')) return '🌿'
  if (text.includes('niebl') || text.includes('misty') || text.includes('hada')) return '🌸'
  if (text.includes('intimid') || text.includes('fiera')) return '🦁'
  if (text.includes('levit') || text.includes('alado')) return '🕊️'
  if (text.includes('espej') || text.includes('magic bounce') || text.includes('refle')) return '🪞'
  if (text.includes('fuego') || text.includes('fire') || text.includes('flame') || text.includes('llama')) return '🔥'
  if (text.includes('sombr') || text.includes('shadow') || text.includes('fant') || text.includes('dark')) return '🌑'
  if (text.includes('venen') || text.includes('poison') || text.includes('tox')) return '🧪'
  if (text.includes('acero') || text.includes('steel') || text.includes('metal')) return '🛡️'
  if (text.includes('drag') || text.includes('dragon')) return '🐉'

  return '✦'
}

/**
 * Componente de carga pedagógico para el Ability AI Focus Mode con animación shimmer.
 */
export function AIAbilityLoadingCard({ pokemonName, abilityName, t }) {
  const loadingEyebrow = t?.aiAnalysis?.loadingEyebrow || 'CONSULTANDO A LA IA'
  const loadingTitle = t?.aiAnalysis?.loadingTitle || 'Analizando sinergias competitivas...'
  const subtitleTemplate =
    t?.aiAnalysis?.loadingSubtitle ||
    'Evaluando viabilidad competitiva, sinergias y formatos para {ability} en {pokemon}.'
  const loadingSubtitle = subtitleTemplate
    .replace('{ability}', abilityName || '')
    .replace('{pokemon}', pokemonName || '')

  return (
    <div
      className="ai-loading-card focus-loading-card"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ai-loading-header">
        <div className="ai-loading-spinner" aria-hidden="true" />
        <div className="ai-loading-meta">
          <span className="ai-loading-eyebrow">{loadingEyebrow}</span>
          <h4 className="ai-loading-title">{loadingTitle}</h4>
        </div>
      </div>
      <p className="ai-loading-subtitle">{loadingSubtitle}</p>
      <div className="ai-loading-skeleton" aria-hidden="true">
        <div className="ai-skeleton-line h-lg w-full" />
        <div className="ai-skeleton-line w-85" />
        <div className="ai-skeleton-line w-full" />
        <div className="ai-skeleton-line w-70" />
        <div className="ai-skeleton-line w-90" />
        <div className="ai-skeleton-line w-60" />
      </div>
    </div>
  )
}

/**
 * Componente de error accesible con botón de reintento.
 */
export function AIAbilityErrorCard({ error, onRetry, t }) {
  const errorEyebrow = t?.aiAnalysis?.errorEyebrow || 'ANÁLISIS NO DISPONIBLE'
  const errorTitle = t?.aiAnalysis?.errorTitle || 'No se pudo completar el análisis'
  const retryLabel = t?.aiAnalysis?.retry || 'Reintentar análisis'

  return (
    <div className="ai-error-card focus-error-card" role="alert">
      <div className="ai-error-header">
        <span className="ai-error-icon" aria-hidden="true">!</span>
        <div>
          <span className="ai-error-eyebrow">{errorEyebrow}</span>
          <h4 className="ai-error-title">{errorTitle}</h4>
        </div>
      </div>
      <p className="ai-error-message">
        {error || 'Ocurrió un error inesperado al consultar el análisis con IA.'}
      </p>
      {onRetry && (
        <div className="ai-error-actions">
          <button
            type="button"
            className="ai-retry-btn"
            onClick={onRetry}
          >
            <span aria-hidden="true">↻</span>
            <span>{retryLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Contenido estructurado en las 8 secciones temáticas para el Focus Mode.
 */
export function AIAbilityAnalysisContent({
  analysis: rawAnalysis,
  t,
}) {
  if (!rawAnalysis) return null

  const analysis = sanitizePokemonTerms(rawAnalysis)

  // Extracción segura de campos
  const summary = analysis.summary || ''
  const ratingScore = Number(analysis.rating?.score) || null
  const ratingLabel = analysis.rating?.label || ''
  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : []
  const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : []
  const synergies = Array.isArray(analysis.synergies) ? analysis.synergies : []
  const singles = analysis.singles || ''
  const doubles = analysis.doubles || ''
  const whenToUse = Array.isArray(analysis.whenToUse) ? analysis.whenToUse : []
  const whenToAvoid = Array.isArray(analysis.whenToAvoid) ? analysis.whenToAvoid : []
  const competitiveTip = analysis.competitiveTip || ''

  // Determinación de clase de color según el score (0 - 10)
  let scoreClass = 'score-high'
  if (ratingScore !== null) {
    if (ratingScore < 6.0) scoreClass = 'score-low'
    else if (ratingScore < 8.0) scoreClass = 'score-medium'
  }
  const scorePercent = ratingScore !== null ? Math.min(100, Math.max(0, (ratingScore / 10) * 100)) : 0

  // Textos y etiquetas con soporte i18n
  const aiT = t?.aiAnalysis || {}
  const ratingHeaderLabel = aiT.competitiveValue || aiT.ratingLabel || 'Valor competitivo'
  const summaryTitle = aiT.summaryLabel || 'Resumen Táctico'
  const strengthsTitle = aiT.strengthsLabel || 'Fortalezas'
  const weaknessesTitle = aiT.weaknessesLabel || 'Debilidades'
  const synergiesTitle = aiT.synergiesLabel || 'Sinergias'
  const singlesTitle = aiT.singlesTitle || 'Singles'
  const doublesTitle = aiT.doublesTitle || 'Doubles'
  const whenToUseTitle = aiT.whenToUseLabel || 'Cuándo usarla'
  const whenToAvoidTitle = aiT.whenToAvoidLabel || 'Cuándo evitarla'
  const proTipTitle = aiT.proTipLabel || 'Consejo competitivo'
  const ratingOutOf = aiT.ratingOutOf || '/ 10'

  return (
    <div className="ability-ai-focus-sections">
      {/* ====================================================================
          BLOQUE 1: ⭐ VALOR COMPETITIVO
          ==================================================================== */}
      {ratingScore !== null && (
        <section className="ability-ai-focus-section section-rating">
          <div className="ability-ai-focus-section-header">
            <span className="ability-ai-focus-section-icon" aria-hidden="true">⭐</span>
            <h3 className="ability-ai-focus-section-title">{ratingHeaderLabel}</h3>
          </div>
          <div className="ability-ai-focus-rating-box">
            <div className="ability-ai-focus-rating-left">
              <div className="ability-ai-focus-score-badge">
                <span className="ability-ai-focus-score-number">{ratingScore.toFixed(0)}</span>
                <span className="ability-ai-focus-score-max">{ratingOutOf}</span>
              </div>
              <div className="ability-ai-focus-label-wrap">
                <span className={`ability-ai-focus-qualifier ${scoreClass}`}>
                  {ratingLabel}
                </span>
                <span className="ability-ai-focus-score-sub">
                  Evaluación basada en metagame competitivo
                </span>
              </div>
            </div>
            <div className="ability-ai-focus-bar-wrap" aria-hidden="true">
              <div className="ability-ai-focus-bar-track">
                <div
                  className={`ability-ai-focus-bar-fill ${scoreClass}`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="ability-ai-focus-pips">
                {[...Array(10)].map((_, i) => (
                  <span
                    key={`pip-${i}`}
                    className={`ability-ai-focus-pip ${i < Math.round(ratingScore) ? 'is-filled' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          BLOQUE 2: 📖 RESUMEN
          ==================================================================== */}
      {summary && (
        <section className="ability-ai-focus-section section-summary">
          <div className="ability-ai-focus-section-header">
            <span className="ability-ai-focus-section-icon" aria-hidden="true">📖</span>
            <h3 className="ability-ai-focus-section-title">{summaryTitle}</h3>
          </div>
          <p className="ability-ai-focus-summary-text">{summary}</p>
        </section>
      )}

      {/* ====================================================================
          BLOQUE 3: DOS COLUMNAS (✓ FORTALEZAS vs ⚠ DEBILIDADES)
          ==================================================================== */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="ability-ai-focus-grid two-columns">
          {strengths.length > 0 && (
            <section className="ability-ai-focus-section section-strengths">
              <div className="ability-ai-focus-section-header">
                <span className="ability-ai-bullet-icon green" aria-hidden="true">✓</span>
                <h3 className="ability-ai-focus-section-title">{strengthsTitle}</h3>
              </div>
              <ul className="ability-ai-focus-list">
                {strengths.map((item, idx) => (
                  <li key={`str-${idx}`} className="ability-ai-focus-item">
                    <span className="ability-ai-item-bullet green" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {weaknesses.length > 0 && (
            <section className="ability-ai-focus-section section-weaknesses">
              <div className="ability-ai-focus-section-header">
                <span className="ability-ai-bullet-icon red" aria-hidden="true">⚠</span>
                <h3 className="ability-ai-focus-section-title">{weaknessesTitle}</h3>
              </div>
              <ul className="ability-ai-focus-list">
                {weaknesses.map((item, idx) => (
                  <li key={`weak-${idx}`} className="ability-ai-focus-item">
                    <span className="ability-ai-item-bullet red" aria-hidden="true">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ====================================================================
          BLOQUE 4: 🔗 SINERGIAS
          ==================================================================== */}
      {synergies.length > 0 && (
        <section className="ability-ai-focus-section section-synergies">
          <div className="ability-ai-focus-section-header">
            <span className="ability-ai-focus-section-icon" aria-hidden="true">🔗</span>
            <h3 className="ability-ai-focus-section-title">{synergiesTitle}</h3>
          </div>
          <div className="ability-ai-focus-synergies-wrap">
            {synergies.map((item, idx) => (
              <div key={`syn-${idx}`} className="ability-ai-focus-synergy-chip">
                <span className="ability-ai-synergy-spark" aria-hidden="true">✦</span>
                <span className="ability-ai-synergy-text">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          BLOQUE 5: DOS COLUMNAS (⚔ SINGLES vs 👥 DOUBLES)
          ==================================================================== */}
      {(singles || doubles) && (
        <div className="ability-ai-focus-grid two-columns">
          {singles && (
            <section className="ability-ai-focus-section section-format">
              <div className="ability-ai-focus-section-header">
                <span className="ability-ai-focus-section-icon" aria-hidden="true">⚔</span>
                <h3 className="ability-ai-focus-section-title">{singlesTitle}</h3>
              </div>
              <p className="ability-ai-focus-format-text">{singles}</p>
            </section>
          )}

          {doubles && (
            <section className="ability-ai-focus-section section-format">
              <div className="ability-ai-focus-section-header">
                <span className="ability-ai-focus-section-icon" aria-hidden="true">👥</span>
                <h3 className="ability-ai-focus-section-title">{doublesTitle}</h3>
              </div>
              <p className="ability-ai-focus-format-text">{doubles}</p>
            </section>
          )}
        </div>
      )}

      {/* ====================================================================
          BLOQUE 6: 🎯 CUÁNDO USARLA & BLOQUE 7: 🚫 CUÁNDO EVITARLA
          ==================================================================== */}
      {(whenToUse.length > 0 || whenToAvoid.length > 0) && (
        <div className="ability-ai-focus-grid two-columns">
          {whenToUse.length > 0 && (
            <section className="ability-ai-focus-section section-usage">
              <div className="ability-ai-focus-section-header">
                <span className="ability-ai-focus-section-icon" aria-hidden="true">🎯</span>
                <h3 className="ability-ai-focus-section-title">{whenToUseTitle}</h3>
              </div>
              <ul className="ability-ai-focus-list">
                {whenToUse.map((item, idx) => (
                  <li key={`use-${idx}`} className="ability-ai-focus-item">
                    <span className="ability-ai-item-bullet green" aria-hidden="true">▲</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {whenToAvoid.length > 0 && (
            <section className="ability-ai-focus-section section-avoid">
              <div className="ability-ai-focus-section-header">
                <span className="ability-ai-focus-section-icon" aria-hidden="true">🚫</span>
                <h3 className="ability-ai-focus-section-title">{whenToAvoidTitle}</h3>
              </div>
              <ul className="ability-ai-focus-list">
                {whenToAvoid.map((item, idx) => (
                  <li key={`avoid-${idx}`} className="ability-ai-focus-item">
                    <span className="ability-ai-item-bullet red" aria-hidden="true">▼</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ====================================================================
          BLOQUE 8: 💡 CONSEJO PRO COMPETITIVO
          ==================================================================== */}
      {competitiveTip && (
        <section className="ability-ai-focus-protip">
          <div className="ability-ai-protip-icon-col" aria-hidden="true">
            <span className="ability-ai-protip-bulb">💡</span>
          </div>
          <div className="ability-ai-protip-body">
            <span className="ability-ai-protip-eyebrow">{proTipTitle}</span>
            <p className="ability-ai-protip-text">{competitiveTip}</p>
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * Contenedor principal de Ability AI Focus Mode.
 * Despliega el backdrop inmersivo, la tarjeta expandida (horizontal + vertical),
 * el encabezado completo, scroll interno y atajos accesibles (Escape, clic fuera).
 */
export function AbilityAIFocusMode({
  isOpen,
  onClose,
  pokemonName,
  abilityName,
  abilityRawName,
  status,
  error,
  data,
  context,
  t,
  onRetry,
}) {
  // Manejo de tecla Escape y bloqueo de scroll de fondo
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const aiT = t?.aiAnalysis || {}
  const focusEyebrow = aiT.focusEyebrow || 'ANÁLISIS CON IA'
  const pressEscHint = aiT.pressEscToClose || 'Esc para salir'
  const closeLabel = aiT.close || 'Cerrar análisis'
  const disclaimerText = aiT.disclaimer || 'Interpretación táctica generada por IA · No oficial'
  const abilityIcon = getAbilityIcon(abilityName, abilityRawName)

  return (
    <>
      {/* 1. Backdrop difuminado y oscurecido */}
      <div
        className="ability-ai-focus-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* 2. Tarjeta Focus Mode expandida (Horizontal + Vertical) */}
      <div
        className="ability-ai-focus-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${focusEyebrow} - ${abilityName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Focus Mode */}
        <header className="ability-ai-focus-header">
          <div className="ability-ai-focus-header-meta">
            <div className="ability-ai-focus-badge-row">
              <span className="ability-ai-focus-badge">
                <span className="ability-ai-focus-spark" aria-hidden="true">✨</span>
                <span>{focusEyebrow}</span>
              </span>
              {pokemonName && (
                <span className="ability-ai-focus-pokemon-pill">
                  {pokemonName}
                </span>
              )}
              {context?.battleMode && (
                <span className="ability-ai-focus-mode-pill">
                  {context.battleMode.toUpperCase()}
                </span>
              )}
            </div>

            <div className="ability-ai-focus-title-group">
              <h2 className="ability-ai-focus-ability-name">
                <span className="ability-ai-focus-weather-icon" aria-hidden="true">
                  {abilityIcon}
                </span>
                <span>{abilityName}</span>
                {abilityRawName && abilityRawName.toLowerCase() !== abilityName.toLowerCase() && (
                  <span className="ability-ai-focus-raw-name">
                    {abilityRawName}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="ability-ai-focus-actions">
            <span className="ability-ai-focus-esc-hint" aria-hidden="true">
              {pressEscHint}
            </span>
            <button
              type="button"
              className="ability-ai-focus-close-btn"
              onClick={onClose}
              aria-label={closeLabel}
              title={`${closeLabel} (Esc)`}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Contenido interno con scroll propio */}
        <div className="ability-ai-focus-content">
          {status === 'loading' && (
            <AIAbilityLoadingCard
              pokemonName={pokemonName}
              abilityName={abilityName}
              t={t}
            />
          )}

          {status === 'error' && (
            <AIAbilityErrorCard
              error={error}
              onRetry={onRetry}
              t={t}
            />
          )}

          {status === 'success' && data && (
            <AIAbilityAnalysisContent
              analysis={data}
              t={t}
            />
          )}
        </div>

        {/* Pie del Focus Mode con disclaimer */}
        <footer className="ability-ai-focus-footer">
          <div className="ability-ai-focus-disclaimer">
            <span className="ability-ai-disclaimer-dot" aria-hidden="true" />
            <span>{disclaimerText}</span>
          </div>
        </footer>
      </div>
    </>
  )
}

/**
 * Componente por defecto para retrocompatibilidad directa.
 */
export default function AIAbilityAnalysis(props) {
  return <AIAbilityAnalysisContent {...props} />
}
