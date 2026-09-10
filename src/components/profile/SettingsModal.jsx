import { useState, useEffect, useRef } from 'react'
import { useAuth, MIN_PASSWORD_LENGTH } from '../../context/AuthContext'
import { localeOptions } from '../../locales'

function SettingsModal({ locale, onLocaleChange, t }) {
  const {
    isSettingsOpen,
    closeSettingsModal,
    settingsTab,
    setSettingsTab,
    user,
    updateEmail,
    updatePasswordInSettings,
    signOut,
  } = useAuth()

  // Estados para cambio de email
  const [newEmail, setNewEmail] = useState('')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState(null)
  const [emailError, setEmailError] = useState(null)

  // Estados para cambio de contraseña
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  const modalRef = useRef(null)

  // Cierre con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettingsModal()
      }
    }
    if (isSettingsOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSettingsOpen, closeSettingsModal])

  if (!isSettingsOpen) return null

  // Manejar cambio de email
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setEmailError(null)
    setEmailMessage(null)

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Por favor, ingresa un correo electrónico válido.')
      return
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('El nuevo correo no puede ser idéntico al actual.')
      return
    }

    setIsChangingEmail(true)
    const res = await updateEmail(newEmail)
    setIsChangingEmail(false)

    if (res.success) {
      setEmailMessage(res.message)
      setNewEmail('')
    } else {
      setEmailError(res.error)
    }
  }

  // Manejar cambio de contraseña
  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setIsChangingPassword(true)
    const res = await updatePasswordInSettings(newPassword, confirmPassword)
    setIsChangingPassword(false)

    if (res.success) {
      setPasswordMessage(res.message)
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setPasswordError(res.error)
    }
  }

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeSettingsModal()
        }
      }}
    >
      <div className="settings-modal-card" ref={modalRef}>
        {/* Encabezado perfectamente centrado */}
        <div className="settings-modal-header">
          <div className="auth-brand-badge">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span className="brand-text">PokéGuide</span>
          </div>
          <h2 id="settings-modal-title" className="auth-modal-title">
            Ajustes de <em>Cuenta</em>
          </h2>
          <p className="auth-modal-subtitle">
            Gestiona tu correo, seguridad, preferencias y privacidad.
          </p>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeSettingsModal}
            aria-label="Cerrar ajustes"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="settings-tabs-header" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === 'account'}
            className={`settings-tab-btn ${settingsTab === 'account' ? 'is-active' : ''}`}
            onClick={() => setSettingsTab('account')}
          >
            ✉️ Cuenta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === 'security'}
            className={`settings-tab-btn ${settingsTab === 'security' ? 'is-active' : ''}`}
            onClick={() => setSettingsTab('security')}
          >
            🔒 Seguridad
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === 'preferences'}
            className={`settings-tab-btn ${settingsTab === 'preferences' ? 'is-active' : ''}`}
            onClick={() => setSettingsTab('preferences')}
          >
            🌐 Preferencias
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === 'data'}
            className={`settings-tab-btn ${settingsTab === 'data' ? 'is-active' : ''}`}
            onClick={() => setSettingsTab('data')}
          >
            ⚠️ Datos
          </button>
        </div>

        {/* Contenido de la pestaña */}
        <div className="settings-tab-body">
          {/* TAB 1: CUENTA */}
          {settingsTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="auth-label">Correo electrónico actual</span>
                <p style={{ font: '600 14px var(--sans)', color: 'var(--navy)', margin: '4px 0 0' }}>
                  {user?.email || 'No disponible'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <h4 style={{ font: '600 15px var(--display)', color: 'var(--navy)', margin: '0 0 6px' }}>
                  Cambiar correo electrónico
                </h4>
                <p style={{ font: '12.5px var(--sans)', color: 'var(--muted)', margin: '0 0 14px' }}>
                  Te enviaremos un enlace de confirmación a tu nueva dirección para validar el cambio.
                </p>

                {emailError && (
                  <div className="auth-alert alert-error" role="alert" style={{ marginBottom: '12px' }}>
                    {emailError}
                  </div>
                )}
                {emailMessage && (
                  <div className="auth-alert alert-success" role="status" style={{ marginBottom: '12px' }}>
                    {emailMessage}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
                  <div className="auth-field" style={{ alignItems: 'center', textAlign: 'center' }}>
                    <label className="auth-label" htmlFor="settings-new-email" style={{ textAlign: 'center', width: '100%' }}>
                      Nuevo correo electrónico
                    </label>
                    <input
                      id="settings-new-email"
                      type="email"
                      className="auth-input"
                      placeholder="nuevo-correo@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={isChangingEmail}
                      style={{ textAlign: 'center' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="auth-primary-btn"
                    style={{ width: 'auto', alignSelf: 'center', margin: '4px auto 0', padding: '10px 24px' }}
                    disabled={isChangingEmail || !newEmail.trim()}
                  >
                    {isChangingEmail ? (
                      <>
                        <span className="auth-spinner" aria-hidden="true" />
                        <span>Enviando confirmación...</span>
                      </>
                    ) : (
                      <span>Solicitar cambio de correo</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: SEGURIDAD */}
          {settingsTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ font: '600 15px var(--display)', color: 'var(--navy)', margin: '0 0 6px', textAlign: 'center' }}>
                  Cambiar contraseña
                </h4>
                <p style={{ font: '12.5px var(--sans)', color: 'var(--muted)', margin: '0 0 14px', textAlign: 'center' }}>
                  Define una nueva clave de acceso de al menos {MIN_PASSWORD_LENGTH} caracteres.
                </p>

                {passwordError && (
                  <div className="auth-alert alert-error" role="alert" style={{ marginBottom: '12px', maxWidth: '420px', margin: '0 auto 12px' }}>
                    {passwordError}
                  </div>
                )}
                {passwordMessage && (
                  <div className="auth-alert alert-success" role="status" style={{ marginBottom: '12px', maxWidth: '420px', margin: '0 auto 12px' }}>
                    {passwordMessage}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '420px', margin: '0 auto', width: '100%' }}>
                  <div className="auth-field" style={{ alignItems: 'center', textAlign: 'center' }}>
                    <label className="auth-label" htmlFor="settings-new-password" style={{ textAlign: 'center', width: '100%' }}>
                      Nueva contraseña
                    </label>
                    <input
                      id="settings-new-password"
                      type="password"
                      className="auth-input"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                      style={{ textAlign: 'center' }}
                      required
                    />
                  </div>

                  <div className="auth-field" style={{ alignItems: 'center', textAlign: 'center' }}>
                    <label className="auth-label" htmlFor="settings-confirm-password" style={{ textAlign: 'center', width: '100%' }}>
                      Confirmar nueva contraseña
                    </label>
                    <input
                      id="settings-confirm-password"
                      type="password"
                      className={`auth-input ${confirmPassword && confirmPassword !== newPassword ? 'has-error' : ''}`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isChangingPassword}
                      style={{ textAlign: 'center' }}
                      required
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <span className="auth-field-status status-error">
                        Las contraseñas no coinciden.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="auth-primary-btn"
                    style={{ width: 'auto', alignSelf: 'center', margin: '4px auto 0', padding: '10px 24px' }}
                    disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="auth-spinner" aria-hidden="true" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <span>Actualizar contraseña</span>
                    )}
                  </button>
                </form>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', textAlign: 'center' }}>
                <h4 style={{ font: '600 15px var(--display)', color: 'var(--navy)', margin: '0 0 6px', textAlign: 'center' }}>
                  Sesión activa
                </h4>
                <p style={{ font: '12.5px var(--sans)', color: 'var(--muted)', margin: '0 0 12px', textAlign: 'center' }}>
                  ¿Deseas cerrar tu sesión en este navegador?
                </p>
                <button
                  type="button"
                  className="nav-logout-btn"
                  onClick={() => {
                    closeSettingsModal()
                    signOut()
                  }}
                  style={{ alignSelf: 'center', margin: '0 auto', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCIAS */}
          {settingsTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ font: '600 15px var(--display)', color: 'var(--navy)', margin: '0 0 6px' }}>
                  Idioma de la aplicación
                </h4>
                <p style={{ font: '12.5px var(--sans)', color: 'var(--muted)', margin: '0 0 14px' }}>
                  Selecciona tu idioma preferido para la Pokédex, objetos y menús de PokéGuide.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '340px' }}>
                  {localeOptions.map((opt) => {
                    const isSelected = opt.code === locale
                    const langTitle = t?.languages?.[opt.code] || opt.code

                    return (
                      <button
                        key={opt.code}
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: isSelected ? '1.5px solid var(--coral)' : '1px solid var(--line)',
                          background: isSelected ? '#fffafa' : '#ffffff',
                          cursor: 'pointer',
                          font: '600 13px var(--display)',
                          color: 'var(--navy)',
                          transition: 'all 0.18s',
                        }}
                        onClick={() => onLocaleChange && onLocaleChange(opt.code)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{opt.flag}</span>
                          <span>{langTitle}</span>
                        </div>
                        {isSelected && (
                          <span style={{ color: 'var(--coral)', fontWeight: 'bold' }}>✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATOS / ZONA DE PELIGRO */}
          {settingsTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-danger-box">
                <strong className="settings-danger-title">Zona de peligro: Eliminación de cuenta</strong>
                <p className="settings-danger-text">
                  La eliminación de una cuenta de entrenador borra de forma permanente tu perfil, nombre de usuario y avatar en Supabase.
                </p>
                <p className="settings-danger-text">
                  Para proteger la integridad de tus datos de juego y evitar eliminaciones accidentales no autorizadas, la eliminación definitiva de cuentas en esta fase requiere confirmación administrativa o solicitud de baja a través del soporte de PokéGuide.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
