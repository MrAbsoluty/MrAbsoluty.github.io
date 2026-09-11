import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { findProfiles, getConversation, getRelationships, removeRelationship, respondToRequest, sendFriendRequest, sendMessage } from '../../services/social'
import { supabase } from '../../services/supabase'
import '../../styles/social.css'
import '../../styles/social-states.css'

function Avatar({ person, online = false }) {
  return <span className={`social-avatar-wrap ${online ? 'is-online' : ''}`}>{person?.avatar_url ? <img className="social-avatar" src={person.avatar_url} alt="" /> : <span className="social-avatar social-avatar-fallback">{person?.username?.[0]?.toUpperCase() || '?'}</span>}</span>
}

export default function SocialModal() {
  const { user, isSocialOpen, closeSocialModal } = useAuth()
  const [relations, setRelations] = useState([])
  const [tab, setTab] = useState('friends')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [onlineIds, setOnlineIds] = useState(new Set())
  const [sendingTo, setSendingTo] = useState(null)

  const reload = async () => {
    if (!user) return
    try { setRelations(await getRelationships(user.id)); setError('') } catch (err) { setError(err.message || 'No se pudo cargar la sección social.') }
  }
  useEffect(() => { if (isSocialOpen) reload() }, [isSocialOpen, user?.id])
  useEffect(() => {
    if (!isSocialOpen || !user || !supabase) return undefined
    const channel = supabase.channel(`social-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, reload).on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => selected && loadMessages(selected.id)).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isSocialOpen, user?.id, selected?.id])
  useEffect(() => {
    if (!isSocialOpen || !user || !supabase) return undefined
    const channel = supabase.channel('pokeguide-presence', { config: { presence: { key: user.id } } })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineIds(new Set(Object.values(state).flat().map(entry => entry.user_id)))
      })
      .subscribe(status => { if (status === 'SUBSCRIBED') channel.track({ user_id: user.id }) })
    return () => { supabase.removeChannel(channel) }
  }, [isSocialOpen, user?.id])
  useEffect(() => {
    const timer = setTimeout(async () => { if (!user || query.trim().length < 2) return setResults([]); try { setResults(await findProfiles(query, user.id)) } catch { setResults([]) } }, 250)
    return () => clearTimeout(timer)
  }, [query, user?.id])

  const incoming = useMemo(() => relations.filter(r => r.status === 'pending' && r.recipient_id === user?.id), [relations, user?.id])
  const friends = useMemo(() => relations.filter(r => r.status === 'accepted').map(r => r.requester_id === user?.id ? r.recipient : r.requester).filter(Boolean), [relations, user?.id])
  function relationshipFor(personId) { return relations.find(r => r.requester_id === personId || r.recipient_id === personId) }
  function requestLabel(personId) {
    const relation = relationshipFor(personId)
    if (!relation) return 'Agregar'
    if (relation.status === 'accepted') return 'Amigo'
    if (relation.status === 'rejected') return 'Solicitud rechazada'
    return relation.requester_id === user?.id ? 'Solicitud enviada' : 'Te envió solicitud'
  }
  async function loadMessages(friendId) { try { setMessages(await getConversation(user.id, friendId)) } catch (err) { setError(err.message) } }
  async function chooseFriend(friend) { setSelected(friend); setTab('chat'); await loadMessages(friend.id) }
  async function action(fn) { try { await fn(); await reload() } catch (err) { setError(err.message || 'No se pudo completar la acción.') } }
  async function handleSendRequest(personId) { if (relationshipFor(personId) || sendingTo) return; setSendingTo(personId); await action(() => sendFriendRequest(personId)); setSendingTo(null) }
  async function submitMessage(e) { e.preventDefault(); if (!selected || !draft.trim()) return; await action(async () => { await sendMessage(selected.id, draft); setDraft(''); await loadMessages(selected.id) }) }
  if (!isSocialOpen) return null

  return <div className="social-overlay" role="dialog" aria-modal="true" aria-label="Amigos y mensajes" onClick={e => e.target === e.currentTarget && closeSocialModal()}>
    <section className="social-modal">
      <header className="social-header"><div><span className="social-kicker">COMUNIDAD</span><h2>Entrenadores</h2></div><button className="social-close" onClick={closeSocialModal} aria-label="Cerrar">×</button></header>
      <nav className="social-tabs"><button className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>Amigos <b>{friends.length}</b></button><button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>Solicitudes <b>{incoming.length}</b></button><button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>Chat</button></nav>
      {error && <p className="social-error">{error}</p>}
      {tab === 'friends' && <div className="social-content"><label className="social-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca un entrenador…" /></label>{results.map(person => { const label = requestLabel(person.id); const disabled = label !== 'Agregar' || sendingTo === person.id; return <div className="social-row" key={person.id}><Avatar person={person} online={onlineIds.has(person.id)}/><strong>@{person.username}</strong><button className={disabled ? 'social-request-state' : ''} disabled={disabled} onClick={() => handleSendRequest(person.id)}>{sendingTo === person.id ? 'Enviando…' : label}</button></div>})}<h3>Mis amigos</h3>{friends.length ? friends.map(friend => <div className="social-row" key={friend.id}><Avatar person={friend} online={onlineIds.has(friend.id)}/><strong>@{friend.username}</strong><span className="social-presence">{onlineIds.has(friend.id) ? 'Conectado' : 'Desconectado'}</span><button className="social-chat-button" onClick={() => chooseFriend(friend)}>Chat</button></div>) : <p className="social-empty">Aún no tienes amigos. Busca un entrenador para enviarle una solicitud.</p>}</div>}
      {tab === 'requests' && <div className="social-content">{incoming.length ? incoming.map(request => <div className="social-row" key={request.id}><Avatar person={request.requester}/><strong>@{request.requester?.username}</strong><button onClick={() => action(() => respondToRequest(request.id, 'accepted'))}>Aceptar</button><button className="social-text-button" onClick={() => action(() => respondToRequest(request.id, 'rejected'))}>Rechazar</button></div>) : <p className="social-empty">No tienes solicitudes pendientes.</p>}</div>}
      {tab === 'chat' && <div className="social-content social-chat">{selected ? <><div className="social-chat-title"><Avatar person={selected}/><strong>@{selected.username}</strong><button className="social-text-button" onClick={() => action(async () => { const relation = relations.find(r => r.status === 'accepted' && (r.requester_id === selected.id || r.recipient_id === selected.id)); await removeRelationship(relation.id); setSelected(null); setTab('friends') })}>Eliminar</button></div><div className="social-messages">{messages.length ? messages.map(message => <p key={message.id} className={message.sender_id === user.id ? 'mine' : ''}>{message.content}</p>) : <p className="social-empty">Inicia la conversación.</p>}</div><form onSubmit={submitMessage} className="social-compose"><input maxLength="1000" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Escribe un mensaje…"/><button>Enviar</button></form></> : <p className="social-empty">Elige un amigo desde la pestaña Amigos para chatear.</p>}</div>}
    </section>
  </div>
}
