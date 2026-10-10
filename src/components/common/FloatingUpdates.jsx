import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import updates, { overview } from '../../data/updates'
import '../../styles/floating-updates.css'

const STORAGE_KEY = 'pokeguide-updates-read-v1'

function readStoredIds() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('[FloatingUpdates] El estado guardado de lectura no es válido.')
      return []
    }
    return parsed.filter((id) => typeof id === 'string')
  } catch (error) {
    console.warn('[FloatingUpdates] No se pudo leer el estado guardado de novedades.', error)
    return []
  }
}

function formatDate(date, locale) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export default function FloatingUpdates({ locale, t }) {
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState(readStoredIds)
  const [showDetails, setShowDetails] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const dialogBackdropRef = useRef(null)
  const dialogRef = useRef(null)
  const detailsButtonRef = useRef(null)
  const dialogCloseRef = useRef(null)
  const panelId = 'pokeguide-updates-panel'

  const localizedUpdates = useMemo(() => {
    const translation = locale === 'en' ? 'en' : 'es'
    return updates.map((update) => ({ ...update, ...update.content[translation] }))
  }, [locale])
  const localizedOverview = overview[locale === 'en' ? 'en' : 'es']
  const unreadCount = localizedUpdates.reduce(
    (count, update) => count + (readIds.includes(update.id) ? 0 : 1),
    0,
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds))
    } catch (error) {
      console.warn('[FloatingUpdates] No se pudo guardar el estado de lectura.', error)
    }
  }, [readIds])

  function closePanel(restoreFocus = true) {
    setIsOpen(false)
    setShowDetails(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  function openDetails() {
    setReadIds((currentIds) => Array.from(new Set([
      ...currentIds,
      ...localizedUpdates.map((update) => update.id),
    ])))
    setShowDetails(true)
    requestAnimationFrame(() => dialogCloseRef.current?.focus())
  }

  function returnToList() {
    setShowDetails(false)
    requestAnimationFrame(() => detailsButtonRef.current?.focus())
  }

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (showDetails && event.target === dialogBackdropRef.current) return
      if (
        !panelRef.current?.contains(event.target) &&
        !dialogRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        const target = event.target
        closePanel(false)
        if (
          !(target instanceof Element) ||
          !target.closest('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ) {
          window.setTimeout(() => triggerRef.current?.focus(), 0)
        }
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (showDetails) returnToList()
        else closePanel()
        return
      }

      if (showDetails && event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable?.length) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showDetails])

  return createPortal(
    <div className={`floating-updates-root${showDetails ? ' has-details-dialog' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`floating-updates-trigger${unreadCount ? ' has-unread' : ''}`}
        onClick={() => {
          setIsOpen((open) => !open)
          if (!isOpen) {
            setShowDetails(false)
            requestAnimationFrame(() => panelRef.current?.querySelector('button')?.focus())
          }
        }}
        aria-label={
          unreadCount
            ? `${t.updates.open}: ${t.updates.unreadCount.replace('{count}', unreadCount)}`
            : t.updates.open
        }
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && <span className="floating-updates-indicator" aria-hidden="true" />}
      </button>

      <section
        ref={panelRef}
        id={panelId}
        className={`floating-updates-panel${isOpen ? ' is-open' : ''}`}
        aria-labelledby="floating-updates-title"
        aria-hidden={!isOpen || showDetails}
        inert={!isOpen || showDetails}
        tabIndex="-1"
      >
        <header className="floating-updates-header">
          <h2 id="floating-updates-title">{t.updates.heading}</h2>
          <button
            type="button"
            className="floating-updates-close"
            onClick={closePanel}
            aria-label={t.updates.close}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {localizedUpdates.length > 0 ? (
          <ul className="floating-updates-list" aria-label={t.updates.listLabel}>
            {localizedUpdates.map((update) => {
              const isRead = readIds.includes(update.id)
              return (
                <li key={update.id}>
                  <article
                    className="floating-updates-item"
                    aria-label={`${update.title}. ${isRead ? t.updates.read : t.updates.unread}`}
                  >
                    <span className="floating-updates-item-heading">
                      <strong>{update.title}</strong>
                      <span className="floating-updates-item-labels">
                        {update.category && (
                          <span className="floating-updates-category">{update.category}</span>
                        )}
                        {!isRead && <span className="floating-updates-new">{t.updates.new}</span>}
                      </span>
                    </span>
                    <time dateTime={update.date}>{formatDate(update.date, locale)}</time>
                    <span className="floating-updates-summary">{update.summary}</span>
                  </article>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="floating-updates-empty">{t.updates.empty}</p>
        )}
        <footer className="floating-updates-footer">
          <button
            ref={detailsButtonRef}
            type="button"
            className="floating-updates-details-button"
            disabled={localizedUpdates.length === 0}
            onClick={openDetails}
          >
            {t.updates.details}
          </button>
        </footer>
      </section>
      {isOpen && showDetails && (
        <div
          ref={dialogBackdropRef}
          className="floating-updates-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) returnToList()
          }}
        >
          <section
            ref={dialogRef}
            className="floating-updates-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-updates-dialog-title"
          >
            <header className="floating-updates-dialog-header">
              <div>
                <span className="floating-updates-dialog-kicker">{t.updates.heading}</span>
                <h2 id="floating-updates-dialog-title">{localizedOverview.title}</h2>
              </div>
              <button
                ref={dialogCloseRef}
                type="button"
                className="floating-updates-close"
                onClick={returnToList}
                aria-label={t.updates.closeDetails}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <div className="floating-updates-dialog-content">
              <p className="floating-updates-overview-intro">{localizedOverview.introduction}</p>
              {localizedUpdates.map((update) => (
                <section key={update.id} className="floating-updates-overview-section">
                  <div className="floating-updates-overview-heading">
                    <h3>{update.title}</h3>
                    <time dateTime={update.date}>{formatDate(update.date, locale)}</time>
                  </div>
                  {update.details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
            </div>
            <footer className="floating-updates-dialog-footer">
              <button type="button" className="floating-updates-dialog-back" onClick={returnToList}>
                <span aria-hidden="true">←</span> {t.updates.back}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>,
    document.body,
  )
}
