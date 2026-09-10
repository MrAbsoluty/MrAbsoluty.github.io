import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function ForgotPasswordForm() {
  const { resetPasswordForEmail, setAuthModalView } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    const cleanEmail = email.trim()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido.')
      return
    }

    setIsSubmitting(true)
    const res = await resetPasswordForEmail(cleanEmail)
    setIsSubmitting(false)
    setStatusMessage(res.message)
  }

  return (
    <form className="auth-form-body" onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {statusMessage && (
        <div className="auth-alert alert-success" role="status">
          {statusMessage}
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label" htmlFor="forgot-email">
          Correo electrónico
        </label>
        <div className="auth-input-wrapper">
          <input
            id="forgot-email"
            type="email"
            className="auth-input"
            placeholder="entrenador@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <span>Enviando enlace...</span>
          </>
        ) : (
          <span>Enviar enlace de recuperación</span>
        )}
      </button>

      <div className="auth-footer-links">
        <button
          type="button"
          className="auth-link-btn"
          onClick={() => setAuthModalView('login')}
        >
          ← Volver a Iniciar sesión
        </button>
      </div>
    </form>
  )
}

export default ForgotPasswordForm
