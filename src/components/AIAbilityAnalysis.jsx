import { useEffect, useState } from 'react'
import { sanitizePokemonTerms } from '../utils/sanitizePokemonTerms'
import { formatCompetitiveContextBadge } from '../data/competitiveContexts'

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
 * Contenido progresivo del análisis de habilidad.
 * Primera capa (siempre visible): Idea clave, Cómo se aprovecha, Estrategias destacadas.
 * Segunda capa (bajo "Explorar más"): Mecánicas, Singles, Doubles, Sinergias, Counters, Pro Tip, Alternativas.
 */
export function AIAbilityAnalysisContent({
  analysis: rawAnalysis,
  t,
  locale = 'es',
}) {
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false)

  if (!rawAnalysis) return null

  const analysis = sanitizePokemonTerms(rawAnalysis)

  // Extracción segura de campos del contrato progresivo
  const coreInsight = analysis.coreInsight || ''
  const howToLeverage = analysis.howToLeverage || ''
  const strategies = Array.isArray(analysis.strategies) ? analysis.strategies : []
  const alternatives = Array.isArray(analysis.alternatives) ? analysis.alternatives : []
  const deepDive = analysis.deepDive && typeof analysis.deepDive === 'object' ? analysis.deepDive : {}

  // Valor competitivo
  const cv = analysis.competitiveValue || analysis.rating || {}
  const cvScore = Number(cv.score) || null
  const cvLabel = cv.label || ''
  const cvSummary = cv.summary || ''

  // Determinación de frase natural y contextual para el valor competitivo
  let naturalCompetitiveText = cvSummary
  if (!naturalCompetitiveText && (cvLabel || cvScore !== null)) {
    const isEn = String(locale || 'es').toLowerCase().startsWith('en')
    if (cvScore !== null && cvScore < 5) {
      naturalCompetitiveText = isEn
        ? 'Its competitive value is very limited in this setting.'
        : 'Su valor competitivo es muy limitado.'
    } else if (cvScore !== null && cvScore < 7) {
      naturalCompetitiveText = isEn
        ? 'It has situational competitive applications.'
        : 'Tiene aplicaciones competitivas situacionales.'
    } else if (cvScore !== null && cvScore >= 8) {
      naturalCompetitiveText = isEn
        ? 'It has outstanding competitive value in this context.'
        : 'Tiene un valor competitivo destacado en este contexto.'
    } else {
      naturalCompetitiveText = isEn
        ? 'It has solid competitive value in this context.'
        : 'Tiene un valor competitivo sólido en este contexto.'
    }
  }

  // Deep dive fields
  const mechanics = deepDive.mechanics || ''
  const singles = deepDive.singles || ''
  const doubles = deepDive.doubles || ''
  const synergies = Array.isArray(deepDive.synergies) ? deepDive.synergies : []
  const counters = Array.isArray(deepDive.counters) ? deepDive.counters : []
  const proTip = deepDive.proTip || ''

  // Check if there's any deep dive content to show
  const hasDeepDive = mechanics || singles || doubles || synergies.length > 0 || counters.length > 0 || proTip || alternatives.length > 0

  // Score class for visual styling
  let scoreClass = 'score-high'
  if (cvScore !== null) {
    if (cvScore < 6.0) scoreClass = 'score-low'
    else if (cvScore < 8.0) scoreClass = 'score-medium'
  }

  // i18n labels
  const aiT = t?.aiAnalysis || {}
  const coreInsightTitle = aiT.coreInsightLabel || 'Idea clave'
  const howToLeverageTitle = aiT.howToLeverageLabel || 'Cómo se aprovecha'
  const strategiesTitle = strategies.length === 1
    ? (aiT.strategyLabel || 'Estrategia destacada')
    : (aiT.strategiesLabel || 'Estrategias destacadas')
  const whyFeaturedLabel = aiT.whyFeaturedLabel || '¿Por qué es destacada?'
  const exploreMoreLabel = aiT.exploreMore || 'Explorar más'
  const collapseLabel = aiT.collapseDetails || 'Menos detalles'
  const mechanicsTitle = aiT.mechanicsLabel || 'Mecánicas en detalle'
  const singlesTitle = aiT.singlesTitle || 'Singles'
  const doublesTitle = aiT.doublesTitle || 'Doubles'
  const synergiesTitle = aiT.synergiesLabel || 'Sinergias recomendadas'
  const countersTitle = aiT.countersLabel || 'Amenazas y contramedidas'
  const proTipTitle = aiT.proTipLabel || 'Consejo competitivo'
  const alternativesTitle = aiT.alternativesLabel || 'Alternativas'

  return (
    <div className="ability-ai-focus-sections ability-ai-progressive">
      {/* ====================================================================
          VALOR COMPETITIVO (Texto natural y contextual — sin puntuación numérica)
          ==================================================================== */}
      {naturalCompetitiveText && (
        <div className={`ability-ai-cv-contextual-wrap ${scoreClass}`}>
          <div className="ability-ai-cv-contextual-header">
            <span className="ability-ai-cv-contextual-icon" aria-hidden="true">
              {scoreClass === 'score-low' ? '⚠️' : scoreClass === 'score-medium' ? '⚖️' : '✨'}
            </span>
            <p className="ability-ai-cv-contextual-text">
              {naturalCompetitiveText}
            </p>
            {cvLabel && (
              <span className={`ability-ai-cv-pill ${scoreClass}`}>{cvLabel}</span>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PRIMERA CAPA: IDEA CLAVE
          ==================================================================== */}
      {coreInsight && (
        <section className="ability-ai-focus-section section-core-insight">
          <div className="ability-ai-focus-section-header">
            <span className="ability-ai-focus-section-icon" aria-hidden="true">💡</span>
            <h3 className="ability-ai-focus-section-title">{coreInsightTitle}</h3>
          </div>
          <p className="ability-ai-focus-insight-text">{coreInsight}</p>
        </section>
      )}

      {/* ====================================================================
          PRIMERA CAPA: CÓMO SE APROVECHA
          ==================================================================== */}
      {howToLeverage && (
        <section className="ability-ai-focus-section section-leverage">
          <div className="ability-ai-focus-section-header">
            <span className="ability-ai-focus-section-icon" aria-hidden="true">⚙️</span>
            <h3 className="ability-ai-focus-section-title">{howToLeverageTitle}</h3>
          </div>
          <p className="ability-ai-focus-leverage-text">{howToLeverage}</p>
        </section>
      )}

      {/* ====================================================================
          PRIMERA CAPA: ESTRATEGIAS DESTACADAS (0 a 3)
          ==================================================================== */}
      {strategies.length > 0 && (
        <section className="ability-ai-focus-section section-strategies">
          <div className="ability-ai-focus-section-header">
            <span className="ability-ai-focus-section-icon" aria-hidden="true">⭐</span>
            <h3 className="ability-ai-focus-section-title">{strategiesTitle}</h3>
          </div>
          <div className="ability-ai-strategies-list">
            {strategies.map((strat, idx) => (
              <div key={`strat-${idx}`} className="ability-ai-strategy-card">
                <h4 className="ability-ai-strategy-name">
                  <span className="ability-ai-strategy-star" aria-hidden="true">⭐</span>
                  {strat.name}
                </h4>
                {strat.explanation && (
                  <p className="ability-ai-strategy-explanation">{strat.explanation}</p>
                )}
                {strat.whyFeatured && (
                  <div className="ability-ai-strategy-why">
                    <span className="ability-ai-strategy-why-label">{whyFeaturedLabel}</span>
                    <p className="ability-ai-strategy-why-text">{strat.whyFeatured}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          EXPLORAR MÁS (toggle)
          ==================================================================== */}
      {hasDeepDive && (
        <>
          <button
            type="button"
            className={`ability-ai-explore-toggle ${isDeepDiveOpen ? 'is-open' : ''}`}
            onClick={() => setIsDeepDiveOpen((prev) => !prev)}
            aria-expanded={isDeepDiveOpen}
          >
            <span className="ability-ai-explore-icon" aria-hidden="true">
              {isDeepDiveOpen ? '▼' : '▶'}
            </span>
            <span>{isDeepDiveOpen ? collapseLabel : exploreMoreLabel}</span>
            <span className="ability-ai-explore-chevron" aria-hidden="true">›</span>
          </button>

          {isDeepDiveOpen && (
            <div className="ability-ai-deep-dive">
              {/* Mecánicas en detalle */}
              {mechanics && (
                <section className="ability-ai-focus-section section-mechanics">
                  <div className="ability-ai-focus-section-header">
                    <span className="ability-ai-focus-section-icon" aria-hidden="true">⚙️</span>
                    <h3 className="ability-ai-focus-section-title">{mechanicsTitle}</h3>
                  </div>
                  <p className="ability-ai-focus-format-text">{mechanics}</p>
                </section>
              )}

              {/* Singles & Doubles */}
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

              {/* Sinergias */}
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

              {/* Counters / Amenazas */}
              {counters.length > 0 && (
                <section className="ability-ai-focus-section section-counters">
                  <div className="ability-ai-focus-section-header">
                    <span className="ability-ai-focus-section-icon" aria-hidden="true">🛡️</span>
                    <h3 className="ability-ai-focus-section-title">{countersTitle}</h3>
                  </div>
                  <ul className="ability-ai-focus-list">
                    {counters.map((item, idx) => (
                      <li key={`ctr-${idx}`} className="ability-ai-focus-item">
                        <span className="ability-ai-item-bullet red" aria-hidden="true">▼</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pro Tip */}
              {proTip && (
                <section className="ability-ai-focus-protip">
                  <div className="ability-ai-protip-icon-col" aria-hidden="true">
                    <span className="ability-ai-protip-bulb">💡</span>
                  </div>
                  <div className="ability-ai-protip-body">
                    <span className="ability-ai-protip-eyebrow">{proTipTitle}</span>
                    <p className="ability-ai-protip-text">{proTip}</p>
                  </div>
                </section>
              )}

              {/* Alternativas */}
              {alternatives.length > 0 && (
                <section className="ability-ai-focus-section section-alternatives">
                  <div className="ability-ai-focus-section-header">
                    <span className="ability-ai-focus-section-icon" aria-hidden="true">🔄</span>
                    <h3 className="ability-ai-focus-section-title">{alternativesTitle}</h3>
                  </div>
                  <div className="ability-ai-strategies-list">
                    {alternatives.map((alt, idx) => (
                      <div key={`alt-${idx}`} className="ability-ai-alternative-card">
                        <h4 className="ability-ai-alternative-name">{alt.name}</h4>
                        {alt.explanation && (
                          <p className="ability-ai-alternative-explanation">{alt.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
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
  onChangeContext,
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
  const focusEyebrow = aiT.contextBadgePrefix || aiT.focusEyebrow || '✦ ANÁLISIS IA'
  const pressEscHint = aiT.pressEscToClose || 'Esc para salir'
  const closeLabel = aiT.close || 'Cerrar análisis'
  const disclaimerText = aiT.disclaimer || 'Interpretación táctica generada por IA · No oficial'
  const abilityIcon = getAbilityIcon(abilityName, abilityRawName)

  const activeContextId = context?.context || context?.platform || 'general'
  const contextBadgeText = formatCompetitiveContextBadge(
    activeContextId,
    context?.format,
    context?.regulation,
  )

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
                <span className="ability-ai-focus-spark" aria-hidden="true">✦</span>
                <span>{focusEyebrow}</span>
              </span>
              <span className="ability-ai-focus-context-pill" title={contextBadgeText}>
                {contextBadgeText}
              </span>
              {pokemonName && (
                <span className="ability-ai-focus-pokemon-pill">
                  {pokemonName}
                </span>
              )}
              {onChangeContext && (
                <button
                  type="button"
                  className="ability-ai-change-context-btn"
                  onClick={onChangeContext}
                  title={aiT.changeContext || 'Cambiar contexto'}
                >
                  <span aria-hidden="true">⇄</span>
                  <span>{aiT.changeContext || 'Cambiar contexto'}</span>
                </button>
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
              locale={context?.locale || 'es'}
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
 * Panel visual integrado de análisis de habilidad (Fase 3).
 * Se renderiza directamente dentro de la tarjeta de habilidad en la Pokédex.
 */
export function AIAbilityIntegratedPanel({
  pokemonName,
  abilityName,
  abilityRawName,
  analysis,
  context,
  t,
  locale = 'es',
  onClose,
}) {
  const aiT = t?.aiAnalysis || {}
  const abilityIcon = getAbilityIcon(abilityName, abilityRawName)
  const isEn = String(locale).toLowerCase().startsWith('en')

  const rawContext = context?.context || context?.platform || 'general'
  const battleMode = context?.battleMode || 'singles'
  const userLevel = context?.userLevel || 'beginner'

  const contextLabel = formatCompetitiveContextBadge(rawContext, isEn ? 'en' : 'es')
  const battleModeLabel = battleMode === 'doubles' ? 'Doubles' : 'Singles'
  const userLevelLabels = {
    beginner: isEn ? 'Beginner' : 'Principiante',
    intermediate: isEn ? 'Intermediate' : 'Intermedio',
    advanced: isEn ? 'Advanced' : 'Avanzado',
    competitive: isEn ? 'Competitive' : 'Competitivo',
  }
  const levelLabel = userLevelLabels[userLevel] || userLevelLabels.beginner
  const disclaimerText = aiT.disclaimer || (isEn ? 'AI-generated tactical interpretation · Unofficial' : 'Interpretación táctica generada por IA · No oficial')

  return (
    <div
      className="ability-ai-integrated-panel"
      role="region"
      aria-label={aiT.title || (isEn ? 'AI Tactical Analysis' : 'Análisis Táctico con IA')}
    >
      <div className="ability-ai-integrated-header">
        <div className="ability-ai-integrated-meta">
          <div className="ability-ai-integrated-badge-row">
            <span className="ai-brand-badge">
              <span className="ai-spark-icon" aria-hidden="true">✨</span>
              <span>{aiT.badge || 'PokeGuide AI'}</span>
            </span>
            <span className="ability-ai-context-pill">{contextLabel}</span>
          </div>
          <h4 className="ability-ai-integrated-title">
            <span className="ability-ai-icon-weather" aria-hidden="true">{abilityIcon}</span>
            <span>{aiT.subtitle || (isEn ? 'Competitive Analysis' : 'Análisis competitivo')}</span>
          </h4>
          <div className="ability-ai-integrated-submeta">
            <span className="ability-ai-submeta-target">{pokemonName} · {abilityName}</span>
            <span className="ability-ai-submeta-dot" aria-hidden="true">•</span>
            <span className="ability-ai-submeta-config">{levelLabel} · {battleModeLabel}</span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="ability-ai-integrated-close-btn"
            onClick={onClose}
            aria-label={aiT.hide || aiT.close || (isEn ? 'Hide analysis' : 'Ocultar análisis')}
            title={aiT.hide || aiT.close || (isEn ? 'Hide analysis' : 'Ocultar análisis')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="ability-ai-integrated-body">
        <AIAbilityAnalysisContent
          analysis={analysis}
          t={t}
          locale={locale}
        />
      </div>

      <div className="ability-ai-integrated-footer">
        <span className="ability-ai-disclaimer-dot" aria-hidden="true" />
        <span className="ability-ai-disclaimer-text">{disclaimerText}</span>
      </div>
    </div>
  )
}

/**
 * Componente por defecto para retrocompatibilidad directa.
 */
export default function AIAbilityAnalysis(props) {
  if (props.isIntegrated) {
    return <AIAbilityIntegratedPanel {...props} />
  }
  return <AIAbilityAnalysisContent {...props} />
}
