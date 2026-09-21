import { useState, useEffect, useRef } from 'react'
import '../../styles/success-popup.css'
import { playBubbleSound } from '../../utils/audio'

/**
 * Función utilitaria global para desplegar la ventana emergente verde
 * de guardado exitoso desde cualquier componente.
 */
export function showSuccessToast(message = 'Se guardaron los cambios con éxito.', title = '¡Cambios guardados!') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pokeguide-success-popup', {
        detail: { message, title },
      })
    )
  }
}

export default function SuccessPopup() {
  const [toastData, setToastData] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef(null)
  const animTimerRef = useRef(null)

  function closeToast() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setIsClosing(true)
    animTimerRef.current = setTimeout(() => {
      setToastData(null)
      setIsClosing(false)
    }, 240)
  }

  useEffect(() => {
    function handlePopupEvent(e) {
      if (!e.detail) return

      const title = e.detail.title || '¡Cambios guardados!'
      const message = e.detail.message || 'Se guardaron los cambios con éxito.'

      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      if (animTimerRef.current) clearTimeout(animTimerRef.current)

      setIsClosing(false)
      setToastData({ title, message })

      try {
        playBubbleSound()
      } catch {
        // Sonido opcional no bloqueante
      }

      // Desvanecer automáticamente tras 3.5 segundos
      closeTimerRef.current = setTimeout(() => {
        closeToast()
      }, 3500)
    }

    window.addEventListener('pokeguide-success-popup', handlePopupEvent)
    return () => {
      window.removeEventListener('pokeguide-success-popup', handlePopupEvent)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
    }
  }, [])

  if (!toastData) return null

  return (
    <div className="success-popup-container" role="status" aria-live="polite">
      <div className={`success-popup-card ${isClosing ? 'is-closing' : ''}`}>
        <div className="success-popup-icon-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="success-popup-body">
          <h4 className="success-popup-title">{toastData.title}</h4>
          {toastData.message && toastData.message !== toastData.title && (
            <p className="success-popup-message">{toastData.message}</p>
          )}
        </div>

        <button
          type="button"
          className="success-popup-close-btn"
          onClick={closeToast}
          aria-label="Cerrar notificación de éxito"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
