import { supabase } from './supabase'

const fields = 'id, username, avatar_url'
const client = () => {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

export async function findProfiles(query, userId) {
  const term = query.trim().replace(/[%_,()]/g, '')
  if (term.length < 2) return []
  const { data, error } = await client().from('profiles').select(fields).ilike('username', `%${term}%`).neq('id', userId).limit(8)
  if (error) throw error
  return data || []
}

export async function getRelationships(userId) {
  const { data, error } = await client().from('friend_requests')
    .select(`id, requester_id, recipient_id, status, created_at, requester:profiles!friend_requests_requester_id_fkey(${fields}), recipient:profiles!friend_requests_recipient_id_fkey(${fields})`)
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function sendFriendRequest(recipient_id) {
  const { error } = await client().from('friend_requests').insert({ recipient_id })
  if (error) throw error
}
export async function respondToRequest(id, status) {
  const { error } = await client().from('friend_requests').update({ status }).eq('id', id)
  if (error) throw error
}
export async function removeRelationship(id) {
  const { error } = await client().from('friend_requests').delete().eq('id', id)
  if (error) throw error
}
export async function getConversation(userId, friendId) {
  const { data, error } = await client().from('messages').select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order('created_at').limit(100)
  if (error) throw error
  return data || []
}
export async function sendMessage(receiver_id, content) {
  const text = content.trim()
  if (!text) return
  const { error } = await client().from('messages').insert({ receiver_id, content: text })
  if (error) throw error
}

export async function getRecentConversations(userId) {
  if (!userId) return []
  try {
    const { data, error } = await client()
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function markConversationAsRead(userId, friendId) {
  if (!userId || !friendId) return
  try {
    const { error } = await client()
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('sender_id', friendId)
      .is('read_at', null)
    if (error) throw error
  } catch {
    // Manejo silencioso
  }
}

export async function getUnreadSenderIds(userId) {
  if (!userId) return []
  try {
    const { data, error } = await client()
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .is('read_at', null)
    if (error) throw error
    return [...new Set((data || []).map((m) => m.sender_id))]
  } catch {
    return []
  }
}
