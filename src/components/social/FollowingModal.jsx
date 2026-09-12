import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFollowing, getProfileById } from '../../services/social'
import FollowButton from './FollowButton'
import { playHoverBubbleSound } from '../../utils/audio'

export default function FollowingModal({ t }) {
  const {
    isFollowingOpen,
    followingTargetUserId,
    closeFollowing,
    openUserProfile,
    user,
  } = useAuth()

  const [followingList, setFollowingList] = useState([])
  const [targetProfile, setTargetProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrivacyRestricted, setIsPrivacyRestricted] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isFollowingOpen || !followingTargetUserId) {
      setFollowingList([])
      setTargetProfile(null)
      setIsPrivacyRestricted(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    async function loadData() {
      try {
        const profile = await getProfileById(followingTargetUserId, user?.id)
        if (!isMounted) return
        setTargetProfile(profile)

        // Verificar si la lista es privada para terceros
        const isOwner = user?.id === followingTargetUserId
        const isRestricted = !isOwner && profile?.follow_list_visibility === 'private'
        setIsPrivacyRestricted(isRestricted)

        if (!isRestricted) {
          const list = await getFollowing(followingTargetUserId, user?.id)
          if (isMounted) {
            setFollowingList(list)
          }
        }
      } catch (err) {
        console.error('[FollowingModal] Error cargando siguiendo:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isFollowingOpen, followingTargetUserId, user?.id])

  // Cierre con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isFollowingOpen) {
        closeFollowing()
      }
    }
    if (isFollowingOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFollowingOpen, closeFollowing])

  if (!isFollowingOpen) return null

  function handleUserClick(targetUser) {
    playHoverBubbleSound()
    closeFollowing()
    openUserProfile(targetUser.username || targetUser.id)
  }

  const title = t?.social?.following || 'Siguiendo'
  const emptyText = t?.social?.noFollowingYet || 'Aún no sigue a ningún entrenador.'
  const privateNotice = t?.social?.privateFollowingNotice || 'La lista de seguidos de este usuario es privada.'

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="following-modal-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeFollowing()
        }
      }}
    >
      <div className="social-list-modal-card" ref={modalRef}>
        <div className="social-list-header">
          <div>
            <span className="social-kicker">COMUNIDAD</span>
            <h3 id="following-modal-title" className="social-list-title">
              {title}
              {targetProfile?.username && (
                <span className="social-list-target"> de @{targetProfile.username}</span>
              )}
            </h3>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeFollowing}
            aria-label="Cerrar modal de siguiendo"
          >
            ✕
          </button>
        </div>

        <div className="social-list-body">
          {isLoading ? (
            <div className="social-loading-state">
              <span className="auth-spinner" aria-hidden="true" />
              <span>Cargando seguidos...</span>
            </div>
          ) : isPrivacyRestricted ? (
            <div className="social-private-box">
              <span className="social-lock-icon">🔒</span>
              <p>{privateNotice}</p>
            </div>
          ) : followingList.length === 0 ? (
            <div className="social-empty-state">
              <span className="social-empty-icon">👤</span>
              <p>{emptyText}</p>
            </div>
          ) : (
            <div className="social-user-rows">
              {followingList.map((person) => {
                const initial = (person.username || '?').charAt(0).toUpperCase()
                return (
                  <div key={person.id} className="social-user-row">
                    <div
                      className="social-user-info-clickable"
                      onClick={() => handleUserClick(person)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="social-row-avatar-wrap">
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt=""
                            className="social-row-avatar-img"
                          />
                        ) : (
                          <span className="social-row-avatar-fallback">{initial}</span>
                        )}
                      </div>
                      <div className="social-row-names">
                        <strong className="social-row-username">@{person.username}</strong>
                        {person.bio && <span className="social-row-bio">{person.bio}</span>}
                      </div>
                    </div>

                    {!person.isSelf && user?.id && (
                      <FollowButton
                        targetUserId={person.id}
                        targetUsername={person.username}
                        isTargetPrivate={person.profile_visibility === 'private'}
                        initialStatus={person.followStatus || 'none'}
                        size="small"
                        t={t}
                      />
                    )}
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
