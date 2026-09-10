import { useState, useEffect, useRef } from 'react'
import {
  useAuth,
  validateUsernameFormat,
  MIN_PASSWORD_LENGTH,
} from '../../context/AuthContext'
import GoogleButton from './GoogleButton'

function RegisterForm() {
  const { signUpWithEmail, checkUsernameAvailability, setAuthModalView } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Estados de disponibilidad del username
  const [usernameStatus, setUsernameStatus] = useState({
    state: 'idle', // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const debounceTimerRef = useRef(null)

  // Comprobar disponibilidad con debounce
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
      const res = await checkUsernameAvailability(trimmed)
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
  }, [username, checkUsernameAvailability])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validar username
    const userVal = validateUsernameFormat(username)
    if (!userVal.valid) {
      setErrorMessage(userVal.error)
      return
    }
    if (usernameStatus.state === 'taken') {
      setErrorMessage('Este nombre de usuario ya está ocupado.')
      return
    }

    // Validar email
    const cleanEmail = email.trim()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('El correo electrónico no es válido.')
      return
    }

    // Validar contraseña
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    // Validar confirmación
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    const result = await signUpWithEmail({
      username: userVal.trimmed,
      email: cleanEmail,
      password,
      confirmPassword,
    })

    if (!result.success) {
      setErrorMessage(result.error)
      setIsSubmitting(false)
      return
    }

    if (result.emailConfirmationRequired) {
      setSuccessMessage(result.message)
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

      {successMessage && (
        <div className="auth-alert alert-success" role="status">
          {successMessage}
        </div>
      )}

      {/* Nombre de usuario */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="register-username">
          Nombre de usuario
        </label>
        <div className="auth-input-wrapper">
          <input
            id="register-username"
            type="text"
            className={`auth-input ${usernameStatus.state === 'taken' || usernameStatus.state === 'invalid' ? 'has-error' : ''} ${usernameStatus.state === 'available' ? 'has-success' : ''}`}
            placeholder="Ej. Red_Champion"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
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

      {/* Correo electrónico */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="register-email">
          Correo electrónico
        </label>
        <div className="auth-input-wrapper">
          <input
            id="register-email"
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

      {/* Contraseña */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="register-password">
          Contraseña (mínimo 8 caracteres)
        </label>
        <div className="auth-input-wrapper">
          <input
            id="register-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="register-confirm-password">
          Confirmar contraseña
        </label>
        <div className="auth-input-wrapper">
          <input
            id="register-confirm-password"
            type="password"
            className={`auth-input ${confirmPassword && confirmPassword !== password ? 'has-error' : ''}`}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
          />
        </div>
        {confirmPassword && confirmPassword !== password && (
          <div className="auth-field-status status-error">
            Las contraseñas no coinciden.
          </div>
        )}
      </div>

      <button
        type="submit"
        className="auth-primary-btn"
        disabled={isSubmitting || usernameStatus.state === 'taken'}
      >
        {isSubmitting ? (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <span>Creando cuenta...</span>
          </>
        ) : (
          <span>Crear cuenta</span>
        )}
      </button>

      <div className="auth-divider">
        <span>o</span>
      </div>

      <GoogleButton label="Continuar con Google" />

      <div className="auth-footer-links">
        <span>
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => setAuthModalView('login')}
          >
            Iniciar sesión
          </button>
        </span>
      </div>
    </form>
  )
}

export default RegisterForm
