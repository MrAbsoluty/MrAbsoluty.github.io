import { useState, useEffect, useRef } from 'react'
import {
  useAuth,
  validateUsernameFormat,
} from '../../context/AuthContext'

function UsernameSetupModal() {
  const { showUsernameSetup, createProfile, checkUsernameAvailability, signOut, user } = useAuth()

  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState({
    state: 'idle',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const debounceTimerRef = useRef(null)

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const trimmed = username.trim()
    if (!trimmed) {
      setUsernameStatus({ state: 'idle', message: '' })
      return
    }

    const validation = validateUsernameFormat(trimmed)
    if (!validation.valid) {
      setUsernameStatus({ state: 'invalid', message: validation.error })
      return
    }

    setUsernameStatus({ state: 'checking', message: 'Comprobando disponibilidad...' })

    debounceTimerRef.current = setTimeout(async () => {
      const res = await checkUsernameAvailability(trimmed, user?.id)
      if (res.available) {
        setUsernameStatus({ state: 'available', message: '✓ Nombre de usuario disponible' })
      } else {
        setUsernameStatus({
          state: res.status === 'taken' ? 'taken' : 'invalid',
          message: res.error || 'Este nombre de usuario no está disponible.',
        })
      }
    }, 380)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [username, checkUsernameAvailability, user?.id])

  if (!showUsernameSetup) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage(null)

    const validation = validateUsernameFormat(username)
    if (!validation.valid) {
      setErrorMessage(validation.error)
      return
    }

    if (usernameStatus.state === 'taken') {
      setErrorMessage('Este nombre de usuario ya está ocupado.')
      return
    }

    setIsSubmitting(true)
    const result = await createProfile(validation.trimmed)
    if (!result.success) {
      setErrorMessage(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="username-setup-title">
      <div className="auth-modal-card">
        <div className="auth-modal-header">
          <div>
            <div className="auth-brand-badge">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span className="brand-text">PokéGuide</span>
            </div>
            <h2 id="username-setup-title" className="auth-modal-title">
              ¡Bienvenido a <em>PokéGuide</em>! 🎉
            </h2>
            <p className="auth-modal-subtitle">
              Antes de continuar, elige tu nombre de usuario para identificarte en la comunidad.
            </p>
          </div>
        </div>

        <form className="auth-form-body" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div className="auth-alert alert-error" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="setup-username">
              Nombre de usuario
            </label>
            <div className="auth-input-wrapper">
              <input
                id="setup-username"
                type="text"
                className={`auth-input ${usernameStatus.state === 'taken' || usernameStatus.state === 'invalid' ? 'has-error' : ''} ${usernameStatus.state === 'available' ? 'has-success' : ''}`}
                placeholder="Elige tu nombre de entrenador"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={isSubmitting}
                maxLength={20}
                required
              />
            </div>
            {usernameStatus.message && (
              <div className={`auth-field-status status-${usernameStatus.state}`}>
                {usernameStatus.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-primary-btn"
            disabled={isSubmitting || usernameStatus.state === 'taken' || !username.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>Guardando perfil...</span>
              </>
            ) : (
              <span>Completar registro</span>
            )}
          </button>

          <div className="auth-footer-links" style={{ marginTop: '12px' }}>
            <button
              type="button"
              className="auth-forgot-link"
              style={{ alignSelf: 'center' }}
              onClick={signOut}
            >
              Cancelar y cerrar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsernameSetupModal
