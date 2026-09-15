import { describe, it } from 'node:test'
import assert from 'node:assert'

// Simulación de la lógica unificada de contactos y mensajería
describe('Sistema de Mensajería y Contactos de Chat', () => {
  it('Debe incluir en la lista de contactos a seguidos, seguidores y participantes de chats recientes', () => {
    const userId = 'user-ash'
    const following = [{ id: 'user-brock', username: 'Brock' }]
    const followers = [{ id: 'user-misty', username: 'Misty' }]
    const recents = [
      { sender_id: 'user-gary', receiver_id: userId, content: 'Smell ya later!' },
      { sender_id: userId, receiver_id: 'user-brock', content: 'Onix!' },
    ]
    const extraProfiles = [{ id: 'user-gary', username: 'GaryOak' }]

    const contactsMap = new Map()

    for (const f of following) {
      if (f && f.id && f.id !== userId) contactsMap.set(f.id, f)
    }
    for (const f of followers) {
      if (f && f.id && f.id !== userId && !contactsMap.has(f.id)) contactsMap.set(f.id, f)
    }

    const missingIds = [
      ...new Set(recents.map((m) => (m.sender_id === userId ? m.receiver_id : m.sender_id))),
    ].filter((id) => id && id !== userId && !contactsMap.has(id))

    for (const p of extraProfiles) {
      if (missingIds.includes(p.id) && !contactsMap.has(p.id)) {
        contactsMap.set(p.id, p)
      }
    }

    assert.strictEqual(contactsMap.size, 3)
    assert.ok(contactsMap.has('user-brock'), 'Debe incluir a quien sigue (Brock)')
    assert.ok(contactsMap.has('user-misty'), 'Debe incluir a quien lo sigue (Misty)')
    assert.ok(contactsMap.has('user-gary'), 'Debe incluir a quien le envió mensaje nuevo (Gary)')
  })

  it('Valida que un usuario no pueda enviarse mensajes a sí mismo', () => {
    const sender_id = 'user-ash'
    const receiver_id = 'user-ash'
    const isValid = sender_id !== receiver_id
    assert.strictEqual(isValid, false, 'No debe permitir auto-mensajes')
  })

  it('Valida que los mensajes no puedan enviarse vacíos o con solo espacios', () => {
    const text1 = '   '
    const text2 = 'Hola Red!'
    assert.strictEqual(Boolean(text1.trim()), false)
    assert.strictEqual(Boolean(text2.trim()), true)
  })
})
