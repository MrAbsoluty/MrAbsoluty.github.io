import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getConversation,
  getRelationships,
  sendMessage,
  getRecentConversations,
  markConversationAsRead,
  getUnreadSenderIds,
} from '../../services/social'
import { supabase } from '../../services/supabase'
import { playBubbleSound, playHoverBubbleSound } from '../../utils/audio'
import '../../styles/floating-chat.css'

function formatMessageTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ChatAvatar({ person, size = 32, online = false }) {
  const initial = person?.username?.[0]?.toUpperCase() || '?'
  return (
    <span
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: 'var(--coral, #ed6d5d)',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.42,
        overflow: 'visible',
      }}
    >
      {person?.avatar_url ? (
        <img
          src={person.avatar_url}
          alt=""
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        initial
      )}
      {online && (
        <span
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#16a34a',
            border: '2px solid #ffffff',
          }}
        />
      )}
    </span>
  )
}

export default function FloatingChat() {
  const {
    user,
    isAuthenticated,
    openAuthModal,
    isChatOpen,
    isChatMinimized,
    activeChatFriend,
    hasUnreadChat,
    setActiveChatFriend,
    setHasUnreadChat,
    openFloatingChat,
    closeFloatingChat,
    minimizeFloatingChat,
  } = useAuth()

  const [relations, setRelations] = useState([])
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineIds, setOnlineIds] = useState(new Set())
  const [isFriendTyping, setIsFriendTyping] = useState(false)
  const [unreadFriendIds, setUnreadFriendIds] = useState(new Set())
  const [lastMessagesMap, setLastMessagesMap] = useState(new Map())
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef(null)
  const typingTimerRef = useRef(null)
  const lastBroadcastRef = useRef(0)

  const userId = user?.id

  // Cargar lista de amigos desde Supabase
  const loadFriends = useCallback(async () => {
    if (!userId) return
    try {
      const data = await getRelationships(userId)
      setRelations(data || [])
    } catch {
      // Manejo silencioso de red/esquema
    }
  }, [userId])

  // Cargar las conversaciones recientes y sender IDs no leídos
  const loadRecentMessages = useCallback(async () => {
    if (!userId) return
    try {
      const [recents, unreadSenders] = await Promise.all([
        getRecentConversations(userId),
        getUnreadSenderIds(userId),
      ])

      const map = new Map()
      for (const msg of recents) {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        if (!map.has(otherId)) {
          map.set(otherId, msg)
        }
      }
      setLastMessagesMap(map)

      if (unreadSenders.length > 0) {
        setUnreadFriendIds(new Set(unreadSenders))
        setHasUnreadChat(true)
      }
    } catch {
      // Manejo silencioso
    }
  }, [userId, setHasUnreadChat])

  // Cargar conversación del amigo activo
  const loadMessages = useCallback(async (friendId) => {
    if (!userId || !friendId) return
    try {
      const data = await getConversation(userId, friendId)
      setMessages(data || [])
      setUnreadFriendIds((prev) => {
        const next = new Set(prev)
        next.delete(friendId)
        if (next.size === 0) setHasUnreadChat(false)
        return next
      })
      markConversationAsRead(userId, friendId)
    } catch {
      // Ignorar errores temporales
    }
  }, [userId, setHasUnreadChat])

  // Carga inicial al autenticar
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadFriends()
      loadRecentMessages()
    }
  }, [isAuthenticated, user?.id, loadFriends, loadRecentMessages])

  // Sincronización automática cuando la ventana recupera el foco (cambio de dispositivo móvil a PC)
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isAuthenticated && user?.id) {
        loadFriends()
        loadRecentMessages()
        if (activeChatFriend?.id && isChatOpen && !isChatMinimized) {
          loadMessages(activeChatFriend.id)
        }
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isAuthenticated, user?.id, activeChatFriend?.id, isChatOpen, isChatMinimized, loadFriends, loadRecentMessages, loadMessages])

  // Recargar amigos e interacciones cada vez que se despliega la ventana de chat
  useEffect(() => {
    if (isChatOpen && user?.id) {
      loadFriends()
      loadRecentMessages()
    }
  }, [isChatOpen, user?.id, loadFriends, loadRecentMessages])

  // Escuchar adición o cambios de amigos en tiempo real
  useEffect(() => {
    if (!user?.id || !supabase) return undefined

    const channel = supabase
      .channel(`chat-friend-requests-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => {
          loadFriends()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, loadFriends])

  // Presencia online
  useEffect(() => {
    if (!user || !supabase) return undefined
    const channel = supabase.channel('pokeguide-chat-presence', {
      config: { presence: { key: user.id } },
    })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineIds(new Set(Object.values(state).flat().map((entry) => entry.user_id)))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ user_id: user.id })
        }
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Filtrar amigos confirmados únicos
  const friends = useMemo(() => {
    if (!user) return []
    const map = new Map()
    for (const r of relations) {
      if (r.status === 'accepted') {
        const friend = r.requester_id === user.id ? r.recipient : r.requester
        if (friend && friend.id && !map.has(friend.id)) {
          map.set(friend.id, friend)
        }
      }
    }
    return Array.from(map.values())
  }, [relations, user])

  // Ordenar lista de amigos: 1° no leídos, 2° último mensaje reciente, 3° alfabético
  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = friends
    if (q) {
      list = friends.filter((f) => f.username?.toLowerCase().includes(q))
    }

    return [...list].sort((a, b) => {
      const aUnread = unreadFriendIds.has(a.id) ? 1 : 0
      const bUnread = unreadFriendIds.has(b.id) ? 1 : 0
      if (aUnread !== bUnread) return bUnread - aUnread

      const aMsg = lastMessagesMap.get(a.id)
      const bMsg = lastMessagesMap.get(b.id)
      const aTime = aMsg ? new Date(aMsg.created_at).getTime() : 0
      const bTime = bMsg ? new Date(bMsg.created_at).getTime() : 0
      if (aTime !== bTime) return bTime - aTime

      return (a.username || '').localeCompare(b.username || '')
    })
  }, [friends, searchQuery, unreadFriendIds, lastMessagesMap])

  // Cargar conversación al seleccionar amigo activo
  useEffect(() => {
    if (activeChatFriend?.id && isChatOpen && !isChatMinimized) {
      loadMessages(activeChatFriend.id)
    }
  }, [activeChatFriend?.id, isChatOpen, isChatMinimized, loadMessages])

  // Auto-scroll al fondo al llegar mensajes o activar tecleo
  useEffect(() => {
    if (isChatOpen && !isChatMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isFriendTyping, isChatOpen, isChatMinimized])

  // Escuchar mensajes en tiempo real (entrantes y enviados desde otros dispositivos como el celular)
  useEffect(() => {
    if (!user?.id || !supabase) return undefined

    const channel = supabase
      .channel(`chat-incoming-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          if (!newMsg) return

          const isOutgoing = newMsg.sender_id === user.id
          const isIncoming = newMsg.receiver_id === user.id

          if (!isOutgoing && !isIncoming) return

          const otherUserId = isOutgoing ? newMsg.receiver_id : newMsg.sender_id

          // Actualizar mapa de últimos mensajes al instante
          setLastMessagesMap((prev) => {
            const next = new Map(prev)
            next.set(otherUserId, newMsg)
            return next
          })

          const isCurrentlyViewing =
            isChatOpen && !isChatMinimized && activeChatFriend?.id === otherUserId

          if (isCurrentlyViewing) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            if (isIncoming) {
              setIsFriendTyping(false)
              markConversationAsRead(user.id, otherUserId)
            }
          } else if (isIncoming) {
            playBubbleSound()
            setHasUnreadChat(true)
            setUnreadFriendIds((prev) => new Set([...prev, otherUserId]))
          }

          // Asegurar que si es un amigo nuevo o se interactuó desde el celular,
          // la lista de amigos se actualice de inmediato
          loadFriends()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, isChatOpen, isChatMinimized, activeChatFriend?.id, setHasUnreadChat, loadFriends])

  // Canal de Broadcast en tiempo real para la animación de tecleo (typing)
  useEffect(() => {
    if (!user || !activeChatFriend?.id || !supabase) {
      return undefined
    }

    const conversationKey = [user.id, activeChatFriend.id].sort().join('-')
    const broadcastChannel = supabase.channel(`typing-${conversationKey}`)

    broadcastChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload?.payload?.senderId === activeChatFriend.id) {
          setIsFriendTyping(true)
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
          typingTimerRef.current = setTimeout(() => {
            setIsFriendTyping(false)
          }, 2800)
        }
      })
      .subscribe()

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      supabase.removeChannel(broadcastChannel)
    }
  }, [user, activeChatFriend?.id])

  // Notificar al amigo que estamos escribiendo (con debounce de 900ms)
  const handleInputChange = (e) => {
    const val = e.target.value
    setDraft(val)

    if (!user || !activeChatFriend?.id || !supabase) return
    const now = Date.now()
    if (now - lastBroadcastRef.current > 900) {
      lastBroadcastRef.current = now
      const conversationKey = [user.id, activeChatFriend.id].sort().join('-')
      const channel = supabase.channel(`typing-${conversationKey}`)
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { senderId: user.id },
      }).catch(() => {})
    }
  }

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!draft.trim() || !activeChatFriend || isSending) return

    const text = draft.trim()
    setIsSending(true)
    try {
      await sendMessage(activeChatFriend.id, text)
      setDraft('')
      setLastMessagesMap((prev) => {
        const next = new Map(prev)
        next.set(activeChatFriend.id, {
          sender_id: user.id,
          receiver_id: activeChatFriend.id,
          content: text,
          created_at: new Date().toISOString(),
        })
        return next
      })
      await loadMessages(activeChatFriend.id)
    } catch {
      // Error silencioso
    } finally {
      setIsSending(false)
    }
  }

  // Desplegar o alternar el chat
  const handlePillClick = () => {
    playHoverBubbleSound()
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }

    if (!isChatOpen || isChatMinimized) {
      openFloatingChat()
      loadFriends()
      loadRecentMessages()
    } else {
      minimizeFloatingChat()
    }
  }

  // Minimizar
  const handleMinimize = () => {
    playHoverBubbleSound()
    minimizeFloatingChat()
  }

  // Cerrar ventana
  const handleClose = () => {
    playHoverBubbleSound()
    closeFloatingChat()
  }

  // Elegir amigo para chatear
  const handleSelectFriend = (friend) => {
    playHoverBubbleSound()
    setIsFriendTyping(false)
    setActiveChatFriend(friend)
    setUnreadFriendIds((prev) => {
      const next = new Set(prev)
      next.delete(friend.id)
      if (next.size === 0) setHasUnreadChat(false)
      return next
    })
    markConversationAsRead(user?.id, friend.id)
  }

  // Volver a la lista de amigos
  const handleBackToList = () => {
    playHoverBubbleSound()
    setIsFriendTyping(false)
    setActiveChatFriend(null)
    loadFriends()
    loadRecentMessages()
  }

  const isVisible = isChatOpen && !isChatMinimized

  return (
    <aside className="floating-chat-wrapper" aria-label="Chat flotante de PokéGuide">
      {/* Botón Píldora de Chat */}
      {!isVisible && (
        <button
          type="button"
          className="floating-chat-pill"
          onClick={handlePillClick}
          aria-expanded={isVisible}
          aria-label="Abrir chat emergente"
        >
          {/* Círculo color coral brillante si hay mensajes sin leer */}
          {hasUnreadChat && (
            <span className="floating-chat-coral-dot" aria-label="Mensajes nuevos" />
          )}
          <span className="floating-chat-pill-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="floating-chat-pill-text">Chat</span>
        </button>
      )}

      {/* Ventana de Chat Desplegada */}
      {isVisible && (
        <section
          className="floating-chat-window"
          role="dialog"
          aria-label={activeChatFriend ? `Chat con @${activeChatFriend.username}` : 'Lista de amigos'}
        >
          {/* Cabecera Estilizada */}
          <header className="floating-chat-header">
            {activeChatFriend ? (
              <div className="floating-chat-header-user">
                <button
                  type="button"
                  className="floating-chat-header-btn floating-chat-back-btn"
                  onClick={handleBackToList}
                  title="Volver a lista de amigos"
                  aria-label="Volver"
                >
                  ←
                </button>
                <ChatAvatar
                  person={activeChatFriend}
                  size={32}
                  online={onlineIds.has(activeChatFriend.id)}
                />
                <div className="floating-chat-header-info">
                  <span className="floating-chat-header-name">@{activeChatFriend.username}</span>
                  <span
                    className={`floating-chat-header-status ${
                      onlineIds.has(activeChatFriend.id) ? 'is-online' : ''
                    }`}
                  >
                    <span className="floating-chat-status-dot" />
                    {onlineIds.has(activeChatFriend.id) ? 'En línea' : 'Desconectado'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="floating-chat-header-user">
                <span style={{ fontSize: 18, color: 'var(--coral, #ed6d5d)', marginRight: 6 }}>💬</span>
                <div className="floating-chat-header-info">
                  <span className="floating-chat-header-name">Chat de Amigos</span>
                  <span className="floating-chat-header-status">
                    {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
                  </span>
                </div>
              </div>
            )}

            <div className="floating-chat-header-actions">
              <button
                type="button"
                className="floating-chat-header-btn floating-chat-minimize-btn"
                onClick={handleMinimize}
                title="Minimizar chat"
                aria-label="Minimizar chat"
              >
                —
              </button>
              <button
                type="button"
                className="floating-chat-header-btn floating-chat-close-btn"
                onClick={handleClose}
                title="Cerrar chat"
                aria-label="Cerrar chat"
              >
                ×
              </button>
            </div>
          </header>

          {/* Cuerpo: Vista de Amigos O Conversación */}
          {activeChatFriend ? (
            /* Vista de Conversación */
            <div className="floating-chat-messages-view">
              <div className="floating-chat-messages-container">
                {messages.length === 0 ? (
                  <div className="floating-chat-empty-state">
                    <span className="floating-chat-empty-icon">✦</span>
                    <p>¡Inicia la conversación con @{activeChatFriend.username}!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id
                    return (
                      <div
                        key={msg.id || msg.created_at}
                        className={`floating-chat-msg-row ${isMine ? 'mine' : 'friend'}`}
                      >
                        {!isMine && (
                          <ChatAvatar
                            person={activeChatFriend}
                            size={26}
                            online={onlineIds.has(activeChatFriend.id)}
                          />
                        )}
                        <div className="floating-chat-bubble-text">
                          {msg.content}
                          <div className="floating-chat-msg-time">
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Animación de tecleo */}
                {isFriendTyping && (
                  <div className="floating-chat-typing-container" aria-live="polite">
                    <ChatAvatar
                      person={activeChatFriend}
                      size={26}
                      online={onlineIds.has(activeChatFriend.id)}
                    />
                    <div className="floating-chat-typing-box">
                      <span className="floating-chat-typing-bubble" />
                      <span className="floating-chat-typing-bubble" />
                      <span className="floating-chat-typing-bubble" />
                      <span className="floating-chat-typing-text">escribiendo…</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Formulario de Composición */}
              <form onSubmit={handleSendMessage} className="floating-chat-composer">
                <input
                  type="text"
                  className="floating-chat-input"
                  placeholder="Escribe un mensaje…"
                  value={draft}
                  onChange={handleInputChange}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="floating-chat-send-btn"
                  disabled={!draft.trim() || isSending}
                  title="Enviar mensaje"
                  aria-label="Enviar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            /* Vista de Selección de Amigos */
            <div className="floating-chat-list-view">
              <label className="floating-chat-search-bar">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Buscar entre tus amigos…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>

              <div className="floating-chat-friends-scroll">
                {filteredFriends.length === 0 ? (
                  <div className="floating-chat-empty-state">
                    <span className="floating-chat-empty-icon">👥</span>
                    <p>
                      {friends.length === 0
                        ? 'Aún no tienes amigos agregados. Agrega entrenadores desde la sección Amigos para chatear.'
                        : 'No se encontraron amigos con esa búsqueda.'}
                    </p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const isOnline = onlineIds.has(friend.id)
                    const hasUnread = unreadFriendIds.has(friend.id)
                    const lastMsg = lastMessagesMap.get(friend.id)
                    return (
                      <button
                        type="button"
                        key={friend.id}
                        className={`floating-chat-friend-item ${hasUnread ? 'has-unread' : ''}`}
                        onClick={() => handleSelectFriend(friend)}
                      >
                        <ChatAvatar person={friend} size={36} online={isOnline} />
                        <div className="floating-chat-friend-details">
                          <div className="floating-chat-friend-header-row">
                            <strong className="floating-chat-friend-name">@{friend.username}</strong>
                            {lastMsg && (
                              <span className="floating-chat-friend-time">
                                {formatMessageTime(lastMsg.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="floating-chat-friend-sub-row">
                            {lastMsg ? (
                              <span className={`floating-chat-last-preview ${hasUnread ? 'unread' : ''}`}>
                                {lastMsg.sender_id === user?.id ? 'Tú: ' : ''}{lastMsg.content}
                              </span>
                            ) : (
                              <span
                                className={`floating-chat-friend-sub ${isOnline ? 'online' : ''}`}
                              >
                                {isOnline ? '● En línea' : '○ Desconectado'}
                              </span>
                            )}
                          </div>
                        </div>
                        {hasUnread && (
                          <span
                            className="floating-chat-friend-dot"
                            title="Mensaje nuevo"
                            aria-label="Mensaje nuevo"
                          />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </aside>
  )
}
