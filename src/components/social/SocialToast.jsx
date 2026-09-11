import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getRelationships } from '../../services/social'
import { supabase } from '../../services/supabase'
import '../../styles/social-states.css'

export default function SocialToast() {
  const { user, isAuthenticated } = useAuth()
  const [notice, setNotice] = useState(null)
  const knownCount = useRef(null)
  useEffect(() => {
    if (!isAuthenticated || !user || !supabase) return undefined
    const refresh = async () => {
      try {
        const requests = (await getRelationships(user.id)).filter(item => item.status === 'pending' && item.recipient_id === user.id)
        if (knownCount.current !== null && requests.length > knownCount.current) {
          const latest = requests[0]
          setNotice(latest?.requester?.username || 'Un entrenador')
        }
        knownCount.current = requests.length
      } catch { /* La interfaz social muestra el error si el esquema no está disponible. */ }
    }
    refresh()
    const channel = supabase.channel(`social-notice-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, refresh).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, user?.id])
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(() => setNotice(null), 6500); return () => clearTimeout(timer) }, [notice])
  return notice ? <aside className="social-toast" role="status"><span>✦</span><div><strong>Nueva solicitud de amistad</strong><p>@{notice} quiere ser tu amigo.</p></div><button onClick={() => setNotice(null)} aria-label="Cerrar aviso">×</button></aside> : null
}
