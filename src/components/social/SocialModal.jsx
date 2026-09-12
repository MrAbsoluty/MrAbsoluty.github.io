import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { searchUsers, getFollowing, getPendingRequests, acceptFollowRequest, rejectFollowRequest } from '../../services/social'
import { supabase } from '../../services/supabase'
import { playHoverBubbleSound, playClickUserSound, playBubbleSound } from '../../utils/audio'
import FollowButton from './FollowButton'
import '../../styles/social.css'
import '../../styles/social-states.css'

function Avatar({ person, online = false }) {
  return (
    <span className={`social-avatar-wrap ${online ? 'is-online' : ''}`}>
      {person?.avatar_url ? (
        <img className="social-avatar" src={person.avatar_url} alt="" />
      ) : (
        <span className="social-avatar social-avatar-fallback">
          {person?.username?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </span>
  )
}

export default function SocialModal() {
  const { user, isSocialOpen, closeSocialModal, openUserProfile, setPendingRequestsCount } = useAuth()
  const [following, setFollowing] = useState([])
  const [incoming, setIncoming] = useState([])
  const [tab, setTab] = useState('following')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [onlineIds, setOnlineIds] = useState(new Set())

  const reload = async () => {
    if (!user?.id) return
    try {
      const [fList, reqList] = await Promise.all([
        getFollowing(user.id, user.id),
        getPendingRequests(user.id),
      ])
      setFollowing(fList)
      setIncoming(reqList)
      setPendingRequestsCount(reqList.length)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo cargar la sección social.')
    }
  }

  useEffect(() => {
    if (isSocialOpen) reload()
  }, [isSocialOpen, user?.id])

  useEffect(() => {
    if (!isSocialOpen || !user?.id || !supabase) return undefined
    const channel = supabase
      .channel(`social-follows-modal-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, reload)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isSocialOpen, user?.id])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!user || query.trim().length < 2) return setResults([])
      try {
        setResults(await searchUsers(query, user.id))
      } catch {
        setResults([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, user?.id])

  if (!isSocialOpen) return null

  function handleUserClick(targetUser) {
    playHoverBubbleSound()
    closeSocialModal()
    openUserProfile(targetUser.username || targetUser.id)
  }

  return (
    <div
      className="social-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Comunidad de entrenadores"
      onClick={(e) => e.target === e.currentTarget && closeSocialModal()}
    >
      <section className="social-modal">
        <header className="social-header">
          <div>
            <span className="social-kicker">COMUNIDAD</span>
            <h2>Entrenadores</h2>
          </div>
          <button className="social-close" onClick={closeSocialModal} aria-label="Cerrar">
            ×
          </button>
        </header>

        <nav className="social-tabs">
          <button
            className={tab === 'following' ? 'active' : ''}
            onClick={() => setTab('following')}
          >
            Siguiendo <b>{following.length}</b>
          </button>
          <button
            className={tab === 'requests' ? 'active' : ''}
            onClick={() => setTab('requests')}
          >
            Solicitudes <b>{incoming.length}</b>
          </button>
        </nav>

        {error && <p className="social-error">{error}</p>}

        {tab === 'following' && (
          <div className="social-content">
            <label className="social-search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca un entrenador por @username…"
              />
            </label>

            {results.map((person) => (
              <div
                className="social-row"
                key={person.id}
                onClick={() => handleUserClick(person)}
                style={{ cursor: 'pointer' }}
              >
                <Avatar person={person} online={onlineIds.has(person.id)} />
                <div style={{ flex: 1 }}>
                  <strong>@{person.username}</strong>
                  {person.bio && (
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                      {person.bio}
                    </span>
                  )}
                </div>
                <FollowButton
                  targetUserId={person.id}
                  targetUsername={person.username}
                  isTargetPrivate={person.profile_visibility === 'private'}
                  initialStatus="none"
                  size="small"
                />
              </div>
            ))}

            <h3>Entrenadores que sigues</h3>
            {following.length ? (
              following.map((friend) => (
                <div
                  className="social-row"
                  key={friend.id}
                  onClick={() => handleUserClick(friend)}
                  style={{ cursor: 'pointer' }}
                >
                  <Avatar person={friend} online={onlineIds.has(friend.id)} />
                  <div style={{ flex: 1 }}>
                    <strong>@{friend.username}</strong>
                    {friend.bio && (
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                        {friend.bio}
                      </span>
                    )}
                  </div>
                  <FollowButton
                    targetUserId={friend.id}
                    targetUsername={friend.username}
                    initialStatus="accepted"
                    size="small"
                  />
                </div>
              ))
            ) : (
              <p className="social-empty">
                Aún no sigues a ningún entrenador. ¡Busca un entrenador para seguirlo!
              </p>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="social-content">
            {incoming.length ? (
              incoming.map((request) => {
                const requester = request.follower
                return (
                  <div className="social-row" key={request.id}>
                    <Avatar person={requester} />
                    <div
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handleUserClick(requester)}
                    >
                      <strong>@{requester?.username}</strong>
                      {requester?.bio && (
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                          {requester.bio}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        playClickUserSound()
                        await acceptFollowRequest(request.id, user.id)
                        playBubbleSound()
                        reload()
                      }}
                    >
                      Aceptar
                    </button>
                    <button
                      className="social-text-button"
                      onClick={async () => {
                        playClickUserSound()
                        await rejectFollowRequest(request.id, user.id)
                        reload()
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                )
              })
            ) : (
              <p className="social-empty">No tienes solicitudes pendientes.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
