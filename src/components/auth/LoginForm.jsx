import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import GoogleButton from './GoogleButton'

function LoginForm() {
  const { signInWithEmail, setAuthModalView } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico.')
      return
    }
    if (!password) {
      setErrorMessage('Por favor, ingresa tu contraseña.')
      return
    }

    setIsSubmitting(true)
    const result = await signInWithEmail({ email, password })
    if (!result.success) {
      setErrorMessage(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form-body" onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label" htmlFor="login-email">
          Correo electrónico
        </label>
        <div className="auth-input-wrapper">
          <input
            id="login-email"
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

      <div className="auth-field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="auth-label" htmlFor="login-password">
            Contraseña
          </label>
          <button
            type="button"
            className="auth-forgot-link"
            onClick={() => setAuthModalView('forgot-password')}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="auth-input-wrapper">
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <span>Iniciar sesión</span>
        )}
      </button>

      <div className="auth-divider">
        <span>o</span>
      </div>

      <GoogleButton label="Continuar con Google" />

      <div className="auth-footer-links">
        <span>
          ¿No tienes una cuenta?{' '}
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => setAuthModalView('register')}
          >
            Crear cuenta
          </button>
        </span>
      </div>
    </form>
  )
}

export default LoginForm
