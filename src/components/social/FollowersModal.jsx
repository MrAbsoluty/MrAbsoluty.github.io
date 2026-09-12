import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFollowers, getProfileById } from '../../services/social'
import FollowButton from './FollowButton'
import { playHoverBubbleSound } from '../../utils/audio'

export default function FollowersModal({ t }) {
  const {
    isFollowersOpen,
    followersTargetUserId,
    closeFollowers,
    openUserProfile,
    user,
  } = useAuth()

  const [followers, setFollowers] = useState([])
  const [targetProfile, setTargetProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrivacyRestricted, setIsPrivacyRestricted] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isFollowersOpen || !followersTargetUserId) {
      setFollowers([])
      setTargetProfile(null)
      setIsPrivacyRestricted(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    async function loadData() {
      try {
        const profile = await getProfileById(followersTargetUserId, user?.id)
        if (!isMounted) return
        setTargetProfile(profile)

        // Verificar si la lista de seguidores es privada para terceros
        const isOwner = user?.id === followersTargetUserId
        const isRestricted = !isOwner && profile?.follow_list_visibility === 'private'
        setIsPrivacyRestricted(isRestricted)

        if (!isRestricted) {
          const list = await getFollowers(followersTargetUserId, user?.id)
          if (isMounted) {
            setFollowers(list)
          }
        }
      } catch (err) {
        console.error('[FollowersModal] Error cargando seguidores:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isFollowersOpen, followersTargetUserId, user?.id])

  // Cierre con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isFollowersOpen) {
        closeFollowers()
      }
    }
    if (isFollowersOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFollowersOpen, closeFollowers])

  if (!isFollowersOpen) return null

  function handleUserClick(targetUser) {
    playHoverBubbleSound()
    closeFollowers()
    openUserProfile(targetUser.username || targetUser.id)
  }

  const title = t?.social?.followers || 'Seguidores'
  const emptyText = t?.social?.noFollowersYet || 'Aún no tiene seguidores.'
  const privateNotice = t?.social?.privateFollowersNotice || 'La lista de seguidores de este usuario es privada.'

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="followers-modal-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeFollowers()
        }
      }}
    >
      <div className="social-list-modal-card" ref={modalRef}>
        <div className="social-list-header">
          <div>
            <span className="social-kicker">{t?.social?.community || 'COMUNIDAD'}</span>
            <h3 id="followers-modal-title" className="social-list-title">
              {title}
              {targetProfile?.username && (
                <span className="social-list-target">
                  {' ' + (t?.social?.ofUser?.replace('{username}', targetProfile.username) || `de @${targetProfile.username}`)}
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeFollowers}
            aria-label="Cerrar modal de seguidores"
          >
            ✕
          </button>
        </div>

        <div className="social-list-body">
          {isLoading ? (
            <div className="social-loading-state">
              <span className="auth-spinner" aria-hidden="true" />
              <span>{t?.social?.loadingFollowers || 'Cargando seguidores...'}</span>
            </div>
          ) : isPrivacyRestricted ? (
            <div className="social-private-box">
              <span className="social-lock-icon">🔒</span>
              <p>{privateNotice}</p>
            </div>
          ) : followers.length === 0 ? (
            <div className="social-empty-state">
              <span className="social-empty-icon">👥</span>
              <p>{emptyText}</p>
            </div>
          ) : (
            <div className="social-user-rows">
              {followers.map((person) => {
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
