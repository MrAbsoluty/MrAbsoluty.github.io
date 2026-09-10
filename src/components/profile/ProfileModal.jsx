import { useState, useRef, useEffect } from 'react'
import {
  useAuth,
  validateUsernameFormat,
} from '../../context/AuthContext'
import AvatarEditor, { MAX_FILE_SIZE_BYTES } from './AvatarEditor'

function ProfileModal() {
  const {
    isProfileOpen,
    closeProfileModal,
    profile,
    user,
    updateUsername,
    uploadAvatar,
    deleteAvatar,
    checkUsernameAvailability,
    openSettingsModal,
  } = useAuth()

  const [usernameInput, setUsernameInput] = useState('')
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' })
  const [avatarImageFile, setAvatarImageFile] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const [confirmDeleteAvatar, setConfirmDeleteAvatar] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  const [statusMessage, setStatusMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const fileInputRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const modalRef = useRef(null)

  // Sincronizar input al abrir o al cambiar perfil
  useEffect(() => {
    if (isProfileOpen && profile?.username) {
      setUsernameInput(profile.username)
      setUsernameStatus({ state: 'idle', message: '' })
      setStatusMessage(null)
      setErrorMessage(null)
      setConfirmDeleteAvatar(false)
      setAvatarLoadError(false)
    }
  }, [isProfileOpen, profile?.username])

  // Cierre con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isProfileOpen && !showEditor) {
        closeProfileModal()
      }
    }
    if (isProfileOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileOpen, showEditor, closeProfileModal])

  // Comprobar disponibilidad con debounce
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    const trimmed = usernameInput.trim()
    if (!trimmed) {
      setUsernameStatus({ state: 'idle', message: '' })
      return
    }

    // Si es el mismo username actual
    if (profile?.username && trimmed.toLowerCase() === profile.username.toLowerCase()) {
      if (trimmed !== profile.username) {
        setUsernameStatus({ state: 'available', message: '✓ Nueva capitalización disponible' })
      } else {
        setUsernameStatus({ state: 'idle', message: '' })
      }
      return
    }

    const val = validateUsernameFormat(trimmed)
    if (!val.valid) {
      setUsernameStatus({ state: 'invalid', message: val.error })
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
          message: res.error || 'Este nombre de usuario ya está ocupado.',
        })
      }
    }, 380)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [usernameInput, profile?.username, checkUsernameAvailability, user?.id])

  if (!isProfileOpen) return null

  // Manejar selección de archivo de imagen
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setStatusMessage(null)

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Formato de imagen no soportado. Por favor, selecciona un archivo PNG, JPG o WebP.')
      e.target.value = ''
      return
    }

    // Validar tamaño máximo (10 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('Esta imagen es demasiado grande. El tamaño máximo permitido es 10 MB.')
      e.target.value = ''
      return
    }

    setAvatarImageFile(file)
    setShowEditor(true)
    e.target.value = ''
  }

  // Guardar avatar desde el editor
  async function handleSaveAvatar(blob) {
    setIsSavingAvatar(true)
    setErrorMessage(null)
    setStatusMessage(null)

    const res = await uploadAvatar(blob)
    setIsSavingAvatar(false)

    if (res.success) {
      setShowEditor(false)
      setAvatarImageFile(null)
      setAvatarLoadError(false)
      setStatusMessage('Foto de perfil actualizada correctamente.')
    } else {
      setErrorMessage(res.error || 'Error al guardar la foto de perfil.')
    }
  }

  // Eliminar foto de perfil
  async function handleDeleteAvatar() {
    setIsDeletingAvatar(true)
    setErrorMessage(null)
    setStatusMessage(null)

    const res = await deleteAvatar()
    setIsDeletingAvatar(false)
    setConfirmDeleteAvatar(false)

    if (res.success) {
      setAvatarLoadError(false)
      setStatusMessage('Tu foto de perfil ha sido eliminada.')
    } else {
      setErrorMessage(res.error || 'Error al eliminar la foto.')
    }
  }

  // Guardar cambios en el username
  async function handleSaveProfile(e) {
    e.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    const val = validateUsernameFormat(usernameInput)
    if (!val.valid) {
      setErrorMessage(val.error)
      return
    }

    if (usernameStatus.state === 'taken') {
      setErrorMessage('Este nombre de usuario ya está ocupado.')
      return
    }

    setIsSavingProfile(true)
    const res = await updateUsername(val.trimmed)
    setIsSavingProfile(false)

    if (res.success) {
      setStatusMessage('Nombre de usuario actualizado con éxito.')
    } else {
      setErrorMessage(res.error || 'Error al actualizar el perfil.')
    }
  }

  const username = profile?.username || user?.user_metadata?.username || 'Entrenador'
  const userInitial = username.charAt(0).toUpperCase()
  const hasCustomAvatar = Boolean(profile?.avatar_url && !avatarLoadError)
  const isUsernameModified = usernameInput.trim() !== (profile?.username || '')

  return (
    <>
      <div
        className="auth-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(e) => {
          if (modalRef.current && !modalRef.current.contains(e.target) && !showEditor) {
            closeProfileModal()
          }
        }}
      >
        <div className="profile-modal-card" ref={modalRef}>
          {/* Encabezado */}
          <div className="auth-modal-header" style={{ paddingBottom: '8px' }}>
            <div>
              <div className="auth-brand-badge">
                <span className="brand-mark" aria-hidden="true"><span /></span>
                <span className="brand-text">PokéGuide</span>
              </div>
              <h2 id="profile-modal-title" className="auth-modal-title">
                Mi <em>Perfil</em>
              </h2>
              <p className="auth-modal-subtitle">
                Personaliza tu avatar y tu nombre de entrenador en PokéGuide.
              </p>
            </div>
            <button
              type="button"
              className="auth-modal-close"
              onClick={closeProfileModal}
              aria-label="Cerrar modal de perfil"
            >
              ✕
            </button>
          </div>

          <div className="auth-form-body">
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

            {/* Sección de Foto de Perfil */}
            <div className="profile-avatar-header">
              <div className="profile-avatar-preview-wrap">
                {hasCustomAvatar ? (
                  <img
                    src={profile.avatar_url}
                    alt={username}
                    className="profile-avatar-img"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  <span className="profile-avatar-fallback">{userInitial}</span>
                )}
              </div>

              {/* Botones de acción para foto */}
              <div className="profile-avatar-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="profile-btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSavingAvatar || isDeletingAvatar}
                >
                  <span>📷</span>
                  <span>Cambiar foto</span>
                </button>

                {hasCustomAvatar && !confirmDeleteAvatar && (
                  <button
                    type="button"
                    className="profile-btn-delete"
                    onClick={() => setConfirmDeleteAvatar(true)}
                    disabled={isSavingAvatar || isDeletingAvatar}
                  >
                    Eliminar foto
                  </button>
                )}
              </div>

              {/* Confirmación para eliminar foto */}
              {confirmDeleteAvatar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    ¿Eliminar tu foto de perfil?
                  </span>
                  <button
                    type="button"
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    onClick={handleDeleteAvatar}
                    disabled={isDeletingAvatar}
                  >
                    {isDeletingAvatar ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setConfirmDeleteAvatar(false)}
                    disabled={isDeletingAvatar}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Formulario de información de perfil */}
            <form onSubmit={handleSaveProfile} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="profile-username-input">
                  Nombre de usuario
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="profile-username-input"
                    type="text"
                    className={`auth-input ${usernameStatus.state === 'taken' || usernameStatus.state === 'invalid' ? 'has-error' : ''} ${usernameStatus.state === 'available' ? 'has-success' : ''}`}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    maxLength={20}
                    disabled={isSavingProfile}
                    required
                  />
                </div>
                {usernameStatus.message && (
                  <div className={`auth-field-status status-${usernameStatus.state}`}>
                    {usernameStatus.message}
                  </div>
                )}
              </div>

              <div className="auth-field" style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">Correo electrónico</label>
                  <button
                    type="button"
                    className="auth-link-btn"
                    style={{ fontSize: '11.5px' }}
                    onClick={() => {
                      closeProfileModal()
                      openSettingsModal('account')
                    }}
                  >
                    Cambiar en Ajustes →
                  </button>
                </div>
                <input
                  type="email"
                  className="auth-input"
                  value={user?.email || ''}
                  disabled
                  style={{ background: '#f4f5f2', color: 'var(--muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="modal-footer-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={closeProfileModal}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="auth-primary-btn"
                  style={{ width: 'auto', padding: '10px 22px', margin: 0 }}
                  disabled={
                    !isUsernameModified ||
                    isSavingProfile ||
                    usernameStatus.state === 'taken' ||
                    usernameStatus.state === 'invalid'
                  }
                >
                  {isSavingProfile ? (
                    <>
                      <span className="auth-spinner" aria-hidden="true" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Editor visual de Avatar */}
      {showEditor && avatarImageFile && (
        <AvatarEditor
          imageFile={avatarImageFile}
          username={username}
          isSaving={isSavingAvatar}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          onCancel={() => {
            setShowEditor(false)
            setAvatarImageFile(null)
            setErrorMessage(null)
          }}
          onSave={handleSaveAvatar}
        />
      )}
    </>
  )
}

export default ProfileModal
