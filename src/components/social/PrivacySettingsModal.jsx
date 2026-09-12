import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { playClickUserSound, playBubbleSound } from '../../utils/audio'

export default function PrivacySettingsModal({ t }) {
  const {
    isPrivacyModalOpen,
    closePrivacyModal,
    profile,
    updateProfilePrivacy,
  } = useAuth()

  const [profileVisibility, setProfileVisibility] = useState('public')
  const [favoritesVisibility, setFavoritesVisibility] = useState('public')
  const [followListVisibility, setFollowListVisibility] = useState('public')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isPrivacyModalOpen && profile) {
      setProfileVisibility(profile.profile_visibility || 'public')
      setFavoritesVisibility(profile.favorites_visibility || 'public')
      setFollowListVisibility(profile.follow_list_visibility || 'public')
      setStatusMessage(null)
      setErrorMessage(null)
    }
  }, [isPrivacyModalOpen, profile])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isPrivacyModalOpen) {
        closePrivacyModal()
      }
    }
    if (isPrivacyModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPrivacyModalOpen, closePrivacyModal])

  if (!isPrivacyModalOpen) return null

  const opt = t?.social?.privacyOptions || {}

  async function handleSave(e) {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)
    playClickUserSound()

    try {
      const res = await updateProfilePrivacy({
        profile_visibility: profileVisibility,
        favorites_visibility: favoritesVisibility,
        follow_list_visibility: followListVisibility,
      })

      if (res.success) {
        playBubbleSound()
        setStatusMessage(opt.savedSuccess || 'Preferencias de privacidad guardadas correctamente.')
      } else {
        setErrorMessage(res.error || 'Error al guardar la privacidad.')
      }
    } catch (err) {
      setErrorMessage('Error inesperado al conectar con el servidor.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closePrivacyModal()
        }
      }}
    >
      <div className="social-privacy-modal-card" ref={modalRef}>
        <div className="social-list-header">
          <div>
            <span className="social-kicker">SEGURIDAD Y CONTROL</span>
            <h3 id="privacy-modal-title" className="social-list-title">
              {t?.social?.privacySettings || 'Configuración de privacidad'}
            </h3>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closePrivacyModal}
            aria-label="Cerrar modal de privacidad"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="social-privacy-body">
          {statusMessage && (
            <div className="auth-alert alert-success" role="status">
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="auth-alert alert-error" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 1. VISIBILIDAD DEL PERFIL */}
          <div className="privacy-section">
            <h4 className="privacy-section-title">
              <span>👤</span> {opt.profileTitle || 'Visibilidad del perfil'}
            </h4>
            <div className="privacy-radio-group">
              <label className={`privacy-radio-card ${profileVisibility === 'public' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="profile_visibility"
                  value="public"
                  checked={profileVisibility === 'public'}
                  onChange={() => setProfileVisibility('public')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.public || 'Público'}</strong>
                  <p>{opt.profilePublicDesc || 'Cualquier usuario puede ver tu perfil y seguirte de inmediato.'}</p>
                </div>
              </label>

              <label className={`privacy-radio-card ${profileVisibility === 'private' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="profile_visibility"
                  value="private"
                  checked={profileVisibility === 'private'}
                  onChange={() => setProfileVisibility('private')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.private || 'Privado'}</strong>
                  <p>{opt.profilePrivateDesc || 'Solo los usuarios que apruebes pueden seguirte y ver tus datos privados.'}</p>
                </div>
              </label>
            </div>
          </div>

          {/* 2. VISIBILIDAD DE FAVORITOS */}
          <div className="privacy-section">
            <h4 className="privacy-section-title">
              <span>⭐</span> {opt.favoritesTitle || 'Visibilidad de favoritos'}
            </h4>
            <div className="privacy-radio-group">
              <label className={`privacy-radio-card ${favoritesVisibility === 'public' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="favorites_visibility"
                  value="public"
                  checked={favoritesVisibility === 'public'}
                  onChange={() => setFavoritesVisibility('public')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.public || 'Público'}</strong>
                  <p>{opt.favoritesPublicDesc || 'Cualquier visitante puede ver tu lista de Pokémon favoritos.'}</p>
                </div>
              </label>

              <label className={`privacy-radio-card ${favoritesVisibility === 'followers' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="favorites_visibility"
                  value="followers"
                  checked={favoritesVisibility === 'followers'}
                  onChange={() => setFavoritesVisibility('followers')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.followers || 'Seguidores'}</strong>
                  <p>{opt.favoritesFollowersDesc || 'Solo tus seguidores aceptados pueden ver tus Pokémon favoritos.'}</p>
                </div>
              </label>

              <label className={`privacy-radio-card ${favoritesVisibility === 'private' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="favorites_visibility"
                  value="private"
                  checked={favoritesVisibility === 'private'}
                  onChange={() => setFavoritesVisibility('private')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.private || 'Privado'}</strong>
                  <p>{opt.favoritesPrivateDesc || 'Solo tú puedes ver tu colección de Pokémon favoritos.'}</p>
                </div>
              </label>
            </div>
          </div>

          {/* 3. SEGUIDORES Y SIGUIENDO */}
          <div className="privacy-section">
            <h4 className="privacy-section-title">
              <span>👥</span> {opt.followListTitle || 'Seguidores y Siguiendo'}
            </h4>
            <div className="privacy-radio-group">
              <label className={`privacy-radio-card ${followListVisibility === 'public' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="follow_list_visibility"
                  value="public"
                  checked={followListVisibility === 'public'}
                  onChange={() => setFollowListVisibility('public')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.public || 'Público'}</strong>
                  <p>{opt.followListPublicDesc || 'Cualquiera puede consultar a quién sigues y quién te sigue.'}</p>
                </div>
              </label>

              <label className={`privacy-radio-card ${followListVisibility === 'private' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="follow_list_visibility"
                  value="private"
                  checked={followListVisibility === 'private'}
                  onChange={() => setFollowListVisibility('private')}
                />
                <div className="privacy-radio-content">
                  <strong>{opt.private || 'Privado'}</strong>
                  <p>{opt.followListPrivateDesc || 'Solo tú puedes ver tus listas de seguidores y seguidos.'}</p>
                </div>
              </label>
            </div>
          </div>

          <div className="modal-footer-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={closePrivacyModal}
            >
              {t?.social?.cancel || 'Cerrar'}
            </button>
            <button
              type="submit"
              className="auth-primary-btn"
              style={{ width: 'auto', padding: '10px 24px', margin: 0 }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{opt.saveChanges || 'Guardar privacidad'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
