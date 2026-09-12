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
    profile,
    updateProfilePrivacy,
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

  // Estados para privacidad
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [favoritesVisibility, setFavoritesVisibility] = useState('public')
  const [followListVisibility, setFollowListVisibility] = useState('public')
  const [isChangingPrivacy, setIsChangingPrivacy] = useState(false)
  const [privacyMessage, setPrivacyMessage] = useState(null)
  const [privacyError, setPrivacyError] = useState(null)

  useEffect(() => {
    if (isSettingsOpen && profile) {
      setProfileVisibility(profile.profile_visibility || 'public')
      setFavoritesVisibility(profile.favorites_visibility || 'public')
      setFollowListVisibility(profile.follow_list_visibility || 'public')
      setPrivacyMessage(null)
      setPrivacyError(null)
    }
  }, [isSettingsOpen, profile])

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
            aria-selected={settingsTab === 'privacy'}
            className={`settings-tab-btn ${settingsTab === 'privacy' ? 'is-active' : ''}`}
            onClick={() => setSettingsTab('privacy')}
          >
            🛡️ Privacidad
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

          {/* TAB PRIVACIDAD (SECCIÓN 17) */}
          {settingsTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ font: '600 15px var(--display)', color: 'var(--navy)', margin: '0 0 6px' }}>
                  {t?.social?.privacySettings || 'Configuración de privacidad'}
                </h4>
                <p style={{ font: '12.5px var(--sans)', color: 'var(--muted)', margin: '0 0 16px' }}>
                  Controla quién puede ver tu perfil, tus Pokémon favoritos y tus listas sociales.
                </p>

                {privacyError && (
                  <div className="auth-alert alert-error" role="alert" style={{ marginBottom: '12px' }}>
                    {privacyError}
                  </div>
                )}
                {privacyMessage && (
                  <div className="auth-alert alert-success" role="status" style={{ marginBottom: '12px' }}>
                    {privacyMessage}
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setIsChangingPrivacy(true)
                    setPrivacyMessage(null)
                    setPrivacyError(null)
                    try {
                      const res = await updateProfilePrivacy({
                        profile_visibility: profileVisibility,
                        favorites_visibility: favoritesVisibility,
                        follow_list_visibility: followListVisibility,
                      })
                      if (res.success) {
                        setPrivacyMessage(t?.social?.privacyOptions?.savedSuccess || 'Preferencias de privacidad guardadas correctamente.')
                      } else {
                        setPrivacyError(res.error || 'Error al guardar privacidad.')
                      }
                    } catch {
                      setPrivacyError('Error inesperado al conectar con el servidor.')
                    } finally {
                      setIsChangingPrivacy(false)
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
                >
                  {/* Perfil */}
                  <div className="privacy-section">
                    <h5 style={{ font: '600 13.5px var(--display)', color: 'var(--navy)', margin: '0 0 8px' }}>
                      👤 {t?.social?.privacyOptions?.profileTitle || 'Visibilidad del perfil'}
                    </h5>
                    <div className="privacy-radio-group">
                      <label className={`privacy-radio-card ${profileVisibility === 'public' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_profile_vis"
                          value="public"
                          checked={profileVisibility === 'public'}
                          onChange={() => setProfileVisibility('public')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.public || 'Público'}</strong>
                          <p>{t?.social?.privacyOptions?.profilePublicDesc || 'Cualquier usuario puede ver tu perfil y seguirte de inmediato.'}</p>
                        </div>
                      </label>

                      <label className={`privacy-radio-card ${profileVisibility === 'private' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_profile_vis"
                          value="private"
                          checked={profileVisibility === 'private'}
                          onChange={() => setProfileVisibility('private')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.private || 'Privado'}</strong>
                          <p>{t?.social?.privacyOptions?.profilePrivateDesc || 'Solo los usuarios que apruebes pueden seguirte y ver tus datos privados.'}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Favoritos */}
                  <div className="privacy-section">
                    <h5 style={{ font: '600 13.5px var(--display)', color: 'var(--navy)', margin: '0 0 8px' }}>
                      ⭐ {t?.social?.privacyOptions?.favoritesTitle || 'Visibilidad de favoritos'}
                    </h5>
                    <div className="privacy-radio-group">
                      <label className={`privacy-radio-card ${favoritesVisibility === 'public' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_fav_vis"
                          value="public"
                          checked={favoritesVisibility === 'public'}
                          onChange={() => setFavoritesVisibility('public')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.public || 'Público'}</strong>
                          <p>{t?.social?.privacyOptions?.favoritesPublicDesc || 'Cualquier visitante puede ver tu lista de Pokémon favoritos.'}</p>
                        </div>
                      </label>

                      <label className={`privacy-radio-card ${favoritesVisibility === 'followers' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_fav_vis"
                          value="followers"
                          checked={favoritesVisibility === 'followers'}
                          onChange={() => setFavoritesVisibility('followers')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.followers || 'Seguidores'}</strong>
                          <p>{t?.social?.privacyOptions?.favoritesFollowersDesc || 'Solo tus seguidores aceptados pueden ver tus Pokémon favoritos.'}</p>
                        </div>
                      </label>

                      <label className={`privacy-radio-card ${favoritesVisibility === 'private' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_fav_vis"
                          value="private"
                          checked={favoritesVisibility === 'private'}
                          onChange={() => setFavoritesVisibility('private')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.private || 'Privado'}</strong>
                          <p>{t?.social?.privacyOptions?.favoritesPrivateDesc || 'Solo tú puedes ver tu colección de Pokémon favoritos.'}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Seguidores y Siguiendo */}
                  <div className="privacy-section">
                    <h5 style={{ font: '600 13.5px var(--display)', color: 'var(--navy)', margin: '0 0 8px' }}>
                      👥 {t?.social?.privacyOptions?.followListTitle || 'Seguidores y Siguiendo'}
                    </h5>
                    <div className="privacy-radio-group">
                      <label className={`privacy-radio-card ${followListVisibility === 'public' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_follow_vis"
                          value="public"
                          checked={followListVisibility === 'public'}
                          onChange={() => setFollowListVisibility('public')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.public || 'Público'}</strong>
                          <p>{t?.social?.privacyOptions?.followListPublicDesc || 'Cualquiera puede consultar a quién sigues y quién te sigue.'}</p>
                        </div>
                      </label>

                      <label className={`privacy-radio-card ${followListVisibility === 'private' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="settings_follow_vis"
                          value="private"
                          checked={followListVisibility === 'private'}
                          onChange={() => setFollowListVisibility('private')}
                        />
                        <div className="privacy-radio-content">
                          <strong>{t?.social?.privacyOptions?.private || 'Privado'}</strong>
                          <p>{t?.social?.privacyOptions?.followListPrivateDesc || 'Solo tú puedes ver tus listas de seguidores y seguidos.'}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-primary-btn"
                    style={{ width: 'auto', alignSelf: 'center', margin: '8px auto 0', padding: '10px 28px' }}
                    disabled={isChangingPrivacy}
                  >
                    {isChangingPrivacy ? 'Guardando...' : (t?.social?.privacyOptions?.saveChanges || 'Guardar privacidad')}
                  </button>
                </form>
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
