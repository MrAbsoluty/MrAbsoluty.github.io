import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { followUser, unfollowUser } from '../../services/social'
import { playClickUserSound, playBubbleSound } from '../../utils/audio'

/**
 * FollowButton
 * 
 * Gestiona los 4 estados de seguimiento:
 * - 'none': [ ＋ Seguir ]
 * - 'private_unrequested': [ 🔒 Solicitar seguimiento ]
 * - 'pending': [ Solicitud enviada ] (con opción de cancelar)
 * - 'accepted': [ ✓ Siguiendo ] (con confirmación al dejar de seguir)
 */
export default function FollowButton({
  targetUserId,
  targetUsername = 'entrenador',
  isTargetPrivate = false,
  initialStatus = 'none', // 'none' | 'pending' | 'accepted'
  onStatusChange = null,
  size = 'medium', // 'small' | 'medium' | 'large'
  t = null,
}) {
  const { user, isAuthenticated, openAuthModal } = useAuth()
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isHoveringFollowing, setIsHoveringFollowing] = useState(false)

  // Sincronizar si cambia initialStatus
  if (initialStatus !== status && !isLoading && !showConfirm) {
    setStatus(initialStatus)
  }

  // Traducciones con fallbacks en español
  const textFollow = t?.social?.follow || '＋ Seguir'
  const textFollowing = t?.social?.followingState || '✓ Siguiendo'
  const textUnfollow = t?.social?.unfollow || 'Dejar de seguir'
  const textRequestFollow = t?.social?.requestFollow || '🔒 Solicitar seguimiento'
  const textRequestSent = t?.social?.requestSent || 'Solicitud enviada'
  const textCancelRequest = t?.social?.cancelRequest || 'Cancelar solicitud'
  const confirmTitle = (t?.social?.unfollowConfirmTitle || '¿Dejar de seguir a @{username}?').replace('{username}', targetUsername)
  const confirmDesc = t?.social?.unfollowConfirmDesc || 'Dejarás de ver sus actualizaciones y favoritos privados.'
  const confirmBtn = t?.social?.unfollowConfirmBtn || 'Sí, dejar de seguir'
  const cancelBtn = t?.social?.cancel || 'Cancelar'

  async function handleClick(e) {
    e.stopPropagation()

    if (!isAuthenticated || !user?.id) {
      openAuthModal('login')
      return
    }

    if (status === 'accepted') {
      // Mostrar confirmación para prevenir clics accidentales
      setShowConfirm(true)
      return
    }

    if (status === 'pending') {
      // Si la solicitud está pendiente, un clic permite cancelarla
      setShowConfirm(true)
      return
    }

    // Acción: Seguir o Solicitar
    setIsLoading(true)
    playClickUserSound()

    try {
      const res = await followUser(targetUserId, user.id)
      const nextStatus = res.status // 'accepted' o 'pending'
      setStatus(nextStatus)
      playBubbleSound()
      if (onStatusChange) onStatusChange(nextStatus)
    } catch (err) {
      console.error('[FollowButton] Error al seguir:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmUnfollow(e) {
    e.stopPropagation()
    setShowConfirm(false)
    setIsLoading(true)
    playClickUserSound()

    try {
      await unfollowUser(targetUserId, user.id)
      setStatus('none')
      if (onStatusChange) onStatusChange('none')
    } catch (err) {
      console.error('[FollowButton] Error al dejar de seguir:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancelConfirm(e) {
    e.stopPropagation()
    setShowConfirm(false)
  }

  // Renderizar contenido del botón según el estado
  let buttonText = textFollow
  let buttonClass = 'follow-btn follow-btn-follow'

  if (status === 'accepted') {
    buttonClass = `follow-btn follow-btn-following ${isHoveringFollowing ? 'is-danger-hover' : ''}`
    buttonText = isHoveringFollowing ? textUnfollow : textFollowing
  } else if (status === 'pending') {
    buttonClass = 'follow-btn follow-btn-pending'
    buttonText = isHoveringFollowing ? textCancelRequest : textRequestSent
  } else if (isTargetPrivate) {
    buttonClass = 'follow-btn follow-btn-private'
    buttonText = textRequestFollow
  }

  return (
    <div className={`follow-btn-container size-${size}`}>
      <button
        type="button"
        className={buttonClass}
        onClick={handleClick}
        onMouseEnter={() => setIsHoveringFollowing(true)}
        onMouseLeave={() => setIsHoveringFollowing(false)}
        disabled={isLoading}
        aria-label={buttonText}
      >
        {isLoading ? (
          <span className="follow-btn-spinner" aria-hidden="true" />
        ) : (
          <span>{buttonText}</span>
        )}
      </button>

      {/* Popover / Modal de confirmación al dejar de seguir o cancelar */}
      {showConfirm && (
        <div
          className="unfollow-confirm-backdrop"
          onClick={handleCancelConfirm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="unfollow-confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="unfollow-confirm-icon">👤</div>
            <h4 className="unfollow-confirm-title">{confirmTitle}</h4>
            <p className="unfollow-confirm-desc">{confirmDesc}</p>
            <div className="unfollow-confirm-actions">
              <button
                type="button"
                className="unfollow-btn-confirm"
                onClick={handleConfirmUnfollow}
                disabled={isLoading}
              >
                {confirmBtn}
              </button>
              <button
                type="button"
                className="unfollow-btn-cancel"
                onClick={handleCancelConfirm}
              >
                {cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
