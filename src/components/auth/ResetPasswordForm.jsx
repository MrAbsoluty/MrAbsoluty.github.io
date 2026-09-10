import { useState } from 'react'
import { useAuth, MIN_PASSWORD_LENGTH } from '../../context/AuthContext'

function ResetPasswordForm() {
  const { updatePassword, setAuthModalView } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    const result = await updatePassword(password, confirmPassword)
    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error)
    } else {
      setSuccessMessage(result.message)
    }
  }

  return (
    <form className="auth-form-body" onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="auth-alert alert-success" role="status">
          {successMessage}
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label" htmlFor="reset-new-password">
          Nueva contraseña
        </label>
        <div className="auth-input-wrapper">
          <input
            id="reset-new-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting || Boolean(successMessage)}
            required
          />
        </div>
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="reset-confirm-password">
          Confirmar nueva contraseña
        </label>
        <div className="auth-input-wrapper">
          <input
            id="reset-confirm-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting || Boolean(successMessage)}
            required
          />
        </div>
      </div>

      {!successMessage ? (
        <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              <span>Guardando contraseña...</span>
            </>
          ) : (
            <span>Guardar nueva contraseña</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          className="auth-primary-btn"
          onClick={() => setAuthModalView('login')}
        >
          Iniciar sesión ahora
        </button>
      )}

      <div className="auth-footer-links">
        <button
          type="button"
          className="auth-link-btn"
          onClick={() => setAuthModalView('login')}
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </form>
  )
}

export default ResetPasswordForm
