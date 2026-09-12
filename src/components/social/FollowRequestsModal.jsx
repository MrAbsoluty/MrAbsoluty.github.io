import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPendingRequests, acceptFollowRequest, rejectFollowRequest } from '../../services/social'
import { playClickUserSound, playBubbleSound, playHoverBubbleSound } from '../../utils/audio'

export default function FollowRequestsModal({ t }) {
  const {
    isFollowRequestsOpen,
    closeFollowRequests,
    user,
    setPendingRequestsCount,
    openUserProfile,
  } = useAuth()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const modalRef = useRef(null)

  const loadRequests = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const list = await getPendingRequests(user.id)
      setRequests(list)
      setPendingRequestsCount(list.length)
    } catch (err) {
      console.error('[FollowRequestsModal] Error cargando solicitudes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isFollowRequestsOpen) {
      loadRequests()
    }
  }, [isFollowRequestsOpen, user?.id])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isFollowRequestsOpen) {
        closeFollowRequests()
      }
    }
    if (isFollowRequestsOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFollowRequestsOpen, closeFollowRequests])

  if (!isFollowRequestsOpen) return null

  async function handleAccept(request) {
    setProcessingId(request.id)
    playClickUserSound()
    try {
      await acceptFollowRequest(request.id, user.id)
      playBubbleSound()
      const updated = requests.filter((r) => r.id !== request.id)
      setRequests(updated)
      setPendingRequestsCount(updated.length)
    } catch (err) {
      console.error('[FollowRequestsModal] Error aceptando solicitud:', err)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(request) {
    setProcessingId(request.id)
    playClickUserSound()
    try {
      await rejectFollowRequest(request.id, user.id)
      const updated = requests.filter((r) => r.id !== request.id)
      setRequests(updated)
      setPendingRequestsCount(updated.length)
    } catch (err) {
      console.error('[FollowRequestsModal] Error rechazando solicitud:', err)
    } finally {
      setProcessingId(null)
    }
  }

  function handleUserClick(requester) {
    playHoverBubbleSound()
    closeFollowRequests()
    openUserProfile(requester.username || requester.id)
  }

  const title = t?.social?.pendingRequests || 'Solicitudes de seguimiento'
  const emptyText = t?.social?.noPendingRequests || 'No tienes solicitudes pendientes.'
  const textAccept = t?.social?.accept || 'Aceptar'
  const textReject = t?.social?.reject || 'Rechazar'

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="follow-requests-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeFollowRequests()
        }
      }}
    >
      <div className="social-list-modal-card" ref={modalRef}>
        <div className="social-list-header">
          <div>
            <span className="social-kicker">NOTIFICACIONES</span>
            <h3 id="follow-requests-title" className="social-list-title">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeFollowRequests}
            aria-label="Cerrar solicitudes"
          >
            ✕
          </button>
        </div>

        <div className="social-list-body">
          {isLoading ? (
            <div className="social-loading-state">
              <span className="auth-spinner" aria-hidden="true" />
              <span>Cargando solicitudes...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="social-empty-state">
              <span className="social-empty-icon">🔔</span>
              <p>{emptyText}</p>
            </div>
          ) : (
            <div className="social-user-rows">
              {requests.map((req) => {
                const requester = req.follower || {}
                const initial = (requester.username || '?').charAt(0).toUpperCase()
                const isProcessing = processingId === req.id

                return (
                  <div key={req.id} className="social-user-row">
                    <div
                      className="social-user-info-clickable"
                      onClick={() => handleUserClick(requester)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="social-row-avatar-wrap">
                        {requester.avatar_url ? (
                          <img
                            src={requester.avatar_url}
                            alt=""
                            className="social-row-avatar-img"
                          />
                        ) : (
                          <span className="social-row-avatar-fallback">{initial}</span>
                        )}
                      </div>
                      <div className="social-row-names">
                        <strong className="social-row-username">@{requester.username}</strong>
                        {requester.bio && <span className="social-row-bio">{requester.bio}</span>}
                      </div>
                    </div>

                    <div className="social-request-actions">
                      <button
                        type="button"
                        className="social-btn-accept"
                        onClick={() => handleAccept(req)}
                        disabled={isProcessing}
                      >
                        {textAccept}
                      </button>
                      <button
                        type="button"
                        className="social-btn-reject"
                        onClick={() => handleReject(req)}
                        disabled={isProcessing}
                      >
                        {textReject}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
