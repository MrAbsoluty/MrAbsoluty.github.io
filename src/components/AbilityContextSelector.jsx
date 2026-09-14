/**
 * AbilityContextSelector.jsx
 * Selector contextual competitivo para análisis de habilidades con IA (Fase 3).
 *
 * Flujo pedagógico de 2 pasos:
 * 1. Selección de plataforma/contexto: Champions | Showdown | General
 * 2. Si es Showdown o Champions: Selección de formato/modalidad específica.
 *    Si es General: Selección inmediata sin paso intermedio.
 */

import { useState, useEffect } from 'react'
import {
  COMPETITIVE_CONTEXTS,
  getCompetitiveContextConfig,
} from '../data/competitiveContexts'
import { playClickSound, playButtonSound } from '../utils/audio'

/**
 * Insignias visuales temáticas discretas y vectoriales con diseño original PokeGuide.
 */
function ContextVisualBadge({ type }) {
  if (type === 'champions') {
    return (
      <div className="ctx-badge-art ctx-art-champions" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" className="ctx-svg-art">
          <circle cx="24" cy="24" r="22" stroke="url(#champGrad)" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
          <path
            d="M14 18L24 10L34 18L30 34H18L14 18Z"
            fill="url(#champFill)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M24 16L27 24H21L24 16Z"
            fill="#fef3c7"
          />
          <circle cx="24" cy="27" r="2" fill="#d97706" />
          <defs>
            <linearGradient id="champGrad" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="champFill" x1="14" y1="10" x2="34" y2="34">
              <stop stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="1" stopColor="#78350f" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  if (type === 'showdown') {
    return (
      <div className="ctx-badge-art ctx-art-showdown" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" className="ctx-svg-art">
          <circle cx="24" cy="24" r="22" stroke="url(#sdGrad)" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
          {/* Espadas cruzadas */}
          <path d="M13 13L21 21M35 13L27 21" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M21 21L33 33M27 21L15 33" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M31 35L35 31M17 35L13 31" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="21" r="3" fill="#3b82f6" />
          <defs>
            <linearGradient id="sdGrad" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  // General: ✦
  return (
    <div className="ctx-badge-art ctx-art-general" aria-hidden="true">
      <span className="ctx-sparkle-symbol">✦</span>
    </div>
  )
}

export function AbilityContextSelector({
  isOpen,
  onClose,
  onSelectContext,
  pokemonName = '',
  abilityName = '',
  initialContext = 'general',
  t,
}) {
  const [selectedContextId, setSelectedContextId] = useState(null)
  const [viewStep, setViewStep] = useState('contexts') // 'contexts' | 'formats'

  // Manejo de tecla Escape
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

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setViewStep('contexts')
      setSelectedContextId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const aiT = t?.aiAnalysis || {}
  const modalTitle = aiT.contextSelectorTitle || '¿Dónde quieres analizar esta habilidad?'
  const modalSubtitle = aiT.contextSelectorSubtitle || 'Selecciona el contexto competitivo para adaptar el enfoque táctico.'
  const cancelLabel = aiT.cancel || 'Cancelar'
  const backLabel = aiT.backToContexts || 'Volver a plataformas'

  const activeContextConfig = selectedContextId
    ? getCompetitiveContextConfig(selectedContextId)
    : null

  function handleContextClick(contextId) {
    playClickSound()
    const ctx = getCompetitiveContextConfig(contextId)

    if (!ctx || ctx.id === 'general' || !ctx.formats || ctx.formats.length === 0) {
      // General: abrir directamente el análisis sin segundo menú
      onSelectContext?.({
        context: 'general',
        format: null,
        regulation: null,
      })
      onClose?.()
      return
    }

    // Showdown o Champions: pasar al paso 2 (selector de formato)
    setSelectedContextId(ctx.id)
    setViewStep('formats')
  }

  function handleFormatClick(formatId) {
    playClickSound()
    const formatConfig = activeContextConfig?.formats?.find((f) => f.id === formatId)
    onSelectContext?.({
      context: activeContextConfig.id,
      format: formatId,
      regulation: formatConfig?.regulation || null,
    })
    onClose?.()
  }

  function handleBackToContexts() {
    playButtonSound()
    setViewStep('contexts')
    setSelectedContextId(null)
  }

  return (
    <>
      {/* 1. Backdrop difuminado y oscurecido */}
      <div
        className="ability-ai-focus-backdrop context-selector-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* 2. Tarjeta del Selector de Contexto */}
      <div
        className="ability-ai-focus-card context-selector-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ctx-selector-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <header className="context-selector-header">
          <div className="context-selector-badge-row">
            <span className="ability-ai-focus-badge">
              <span className="ability-ai-focus-spark" aria-hidden="true">✨</span>
              <span>{aiT.focusEyebrow || 'POKEGUIDE AI'}</span>
            </span>
            {pokemonName && (
              <span className="ability-ai-focus-pokemon-pill">{pokemonName}</span>
            )}
            {abilityName && (
              <span className="ability-ai-focus-mode-pill">{abilityName}</span>
            )}
          </div>

          <div className="context-selector-title-wrap">
            <h2 id="ctx-selector-title" className="context-selector-heading">
              {viewStep === 'contexts' ? modalTitle : (
                selectedContextId === 'showdown'
                  ? (aiT.selectFormatTitle || 'Selecciona el formato:')
                  : (aiT.selectContextTitle || 'Selecciona el contexto:')
              )}
            </h2>
            <p className="context-selector-subheading">
              {viewStep === 'contexts' ? modalSubtitle : (
                activeContextConfig?.label || ''
              )}
            </p>
          </div>

          <button
            type="button"
            className="ability-ai-focus-close-btn"
            onClick={onClose}
            aria-label={aiT.close || 'Cerrar selector'}
            title={`${aiT.close || 'Cerrar'} (Esc)`}
          >
            ✕
          </button>
        </header>

        {/* Contenido principal: Paso 1 (Plataformas) o Paso 2 (Formatos) */}
        <div className="context-selector-body">
          {viewStep === 'contexts' && (
            <div className="context-cards-grid" role="radiogroup" aria-label={modalTitle}>
              {COMPETITIVE_CONTEXTS.map((ctx) => {
                const locContext = aiT.contexts?.[ctx.id]
                const name = locContext?.name || ctx.label
                const tag = locContext?.tag || ctx.tag
                const desc = locContext?.description || ctx.description

                return (
                  <button
                    key={ctx.id}
                    type="button"
                    className={`context-option-card ctx-card-${ctx.id}`}
                    onClick={() => handleContextClick(ctx.id)}
                    aria-label={`${name}: ${desc}`}
                  >
                    <div className="context-option-top">
                      <ContextVisualBadge type={ctx.id} />
                      <span className="context-option-tag">{tag}</span>
                    </div>

                    <div className="context-option-info">
                      <h3 className="context-option-name">{name}</h3>
                      <p className="context-option-desc">{desc}</p>
                    </div>

                    <div className="context-option-action">
                      <span className="context-option-arrow" aria-hidden="true">
                        {ctx.id === 'general' ? '✦ Analizar' : 'Continuar →'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {viewStep === 'formats' && activeContextConfig && (
            <div className="context-formats-step">
              <div className="context-formats-header">
                <button
                  type="button"
                  className="context-back-btn"
                  onClick={handleBackToContexts}
                >
                  <span aria-hidden="true">←</span>
                  <span>{backLabel}</span>
                </button>
                <div className="context-formats-platform-chip">
                  <ContextVisualBadge type={activeContextConfig.id} />
                  <span>{activeContextConfig.label}</span>
                </div>
              </div>

              <div className="context-formats-list" role="menu" aria-label={activeContextConfig.label}>
                {activeContextConfig.formats.map((fmt) => {
                  const locFormat = aiT.formats?.[fmt.id]
                  const formatName = locFormat?.name || fmt.label
                  const formatDesc = locFormat?.description || fmt.description

                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      className="context-format-card"
                      onClick={() => handleFormatClick(fmt.id)}
                    >
                      <div className="context-format-main">
                        <span className="context-format-bullet" aria-hidden="true">⚔</span>
                        <div className="context-format-text">
                          <strong className="context-format-name">{formatName}</strong>
                          <span className="context-format-desc">{formatDesc}</span>
                        </div>
                      </div>
                      <span className="context-format-select-hint" aria-hidden="true">
                        Seleccionar →
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pie del selector con cancelar */}
        <footer className="context-selector-footer">
          <button
            type="button"
            className="context-cancel-btn"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
        </footer>
      </div>
    </>
  )
}

export default AbilityContextSelector
