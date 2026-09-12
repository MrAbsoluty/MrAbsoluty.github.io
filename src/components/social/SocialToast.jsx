import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPendingRequests } from '../../services/social'
import { supabase } from '../../services/supabase'
import '../../styles/social-states.css'

export default function SocialToast({ t }) {
  const { user, isAuthenticated, openFollowRequests } = useAuth()
  const [notice, setNotice] = useState(null)
  const knownCount = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !supabase) return undefined

    const refresh = async () => {
      try {
        const requests = await getPendingRequests(user.id)
        if (knownCount.current !== null && requests.length > knownCount.current) {
          const latest = requests[0]
          setNotice(latest?.follower?.username || 'Un entrenador')
        }
        knownCount.current = requests.length
      } catch {
        // Silencioso si aún no existe la tabla
      }
    }

    refresh()
    const channel = supabase
      .channel(`social-toast-follows-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        refresh
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 6500)
    return () => clearTimeout(timer)
  }, [notice])

  if (!notice) return null

  return (
    <aside
      className="social-toast"
      role="status"
      onClick={() => {
        setNotice(null)
        openFollowRequests?.()
      }}
      style={{ cursor: 'pointer' }}
    >
      <span>🔔</span>
      <div>
        <strong>{t?.social?.pendingRequests || 'Nueva solicitud de seguimiento'}</strong>
        <p>@{notice} solicitó seguirte.</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setNotice(null)
        }}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </aside>
  )
}
