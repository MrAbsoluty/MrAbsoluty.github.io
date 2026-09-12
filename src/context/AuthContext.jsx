import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabase'

export const AuthContext = createContext(null)

export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/
export const MIN_USERNAME_LENGTH = 3
export const MAX_USERNAME_LENGTH = 20
export const MIN_PASSWORD_LENGTH = 8

export function validateUsernameFormat(username) {
  const trimmed = username?.trim() || ''
  if (!trimmed) {
    return { valid: false, error: 'El nombre de usuario es obligatorio.' }
  }
  if (trimmed.length < MIN_USERNAME_LENGTH || trimmed.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `El nombre de usuario debe tener entre ${MIN_USERNAME_LENGTH} y ${MAX_USERNAME_LENGTH} caracteres.` }
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos (sin espacios).' }
  }
  return { valid: true, trimmed }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCheckingProfile, setIsCheckingProfile] = useState(false)

  // Control de modales
  const [authModal, setAuthModal] = useState({ isOpen: false, view: 'login' })
  const [showUsernameSetup, setShowUsernameSetup] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('account')
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [activeChatFriend, setActiveChatFriend] = useState(null)
  const [hasUnreadChat, setHasUnreadChat] = useState(false)

  // Estados del sistema social de Seguidores / Siguiendo
  const [viewingUser, setViewingUser] = useState(null)
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
  const [isFollowersOpen, setIsFollowersOpen] = useState(false)
  const [followersTargetUserId, setFollowersTargetUserId] = useState(null)
  const [isFollowingOpen, setIsFollowingOpen] = useState(false)
  const [followingTargetUserId, setFollowingTargetUserId] = useState(null)
  const [isFollowRequestsOpen, setIsFollowRequestsOpen] = useState(false)
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  const openAuthModal = useCallback((view = 'login') => {
    setAuthModal({ isOpen: true, view })
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const setAuthModalView = useCallback((view) => {
    setAuthModal((prev) => ({ ...prev, view }))
  }, [])

  const openProfileModal = useCallback(() => {
    setIsProfileOpen(true)
  }, [])

  const closeProfileModal = useCallback(() => {
    setIsProfileOpen(false)
  }, [])

  const openSettingsModal = useCallback((tab = 'account') => {
    setSettingsTab(tab)
    setIsSettingsOpen(true)
  }, [])

  const closeSettingsModal = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  const openSocialModal = useCallback(() => setIsSocialOpen(true), [])
  const closeSocialModal = useCallback(() => setIsSocialOpen(false), [])

  const openUserProfile = useCallback((usernameOrUser = null) => {
    let targetUsername = null
    if (typeof usernameOrUser === 'string') {
      targetUsername = usernameOrUser.trim().replace(/^@+/, '')
    } else if (usernameOrUser?.username) {
      targetUsername = usernameOrUser.username
    } else if (profile?.username) {
      targetUsername = profile.username
    }

    if (targetUsername) {
      window.history.pushState({}, '', `/profile/${encodeURIComponent(targetUsername)}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [profile?.username])

  const closeUserProfile = useCallback(() => {
    setIsUserProfileOpen(false)
    setViewingUser(null)
  }, [])

  const openFollowers = useCallback((userId) => {
    setFollowersTargetUserId(userId)
    setIsFollowersOpen(true)
  }, [])

  const closeFollowers = useCallback(() => {
    setIsFollowersOpen(false)
    setFollowersTargetUserId(null)
  }, [])

  const openFollowing = useCallback((userId) => {
    setFollowingTargetUserId(userId)
    setIsFollowingOpen(true)
  }, [])

  const closeFollowing = useCallback(() => {
    setIsFollowingOpen(false)
    setFollowingTargetUserId(null)
  }, [])

  const openFollowRequests = useCallback(() => {
    setIsFollowRequestsOpen(true)
  }, [])

  const closeFollowRequests = useCallback(() => {
    setIsFollowRequestsOpen(false)
  }, [])

  const openUserSearch = useCallback(() => {
    setIsUserSearchOpen(true)
  }, [])

  const closeUserSearch = useCallback(() => {
    setIsUserSearchOpen(false)
  }, [])

  const openPrivacyModal = useCallback(() => {
    setIsPrivacyModalOpen(true)
  }, [])

  const closePrivacyModal = useCallback(() => {
    setIsPrivacyModalOpen(false)
  }, [])

  const openChatWithFriend = useCallback((friend) => {
    setActiveChatFriend(friend)
    setIsChatOpen(true)
    setIsChatMinimized(false)
    setHasUnreadChat(false)
    setIsSocialOpen(false)
  }, [])

  const openFloatingChat = useCallback(() => {
    setIsChatOpen(true)
    setIsChatMinimized(false)
    setHasUnreadChat(false)
  }, [])

  const closeFloatingChat = useCallback(() => {
    setIsChatOpen(false)
    setIsChatMinimized(false)
  }, [])

  const minimizeFloatingChat = useCallback(() => {
    setIsChatMinimized(true)
  }, [])

  const toggleFloatingChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev
      if (next) {
        setIsChatMinimized(false)
        setHasUnreadChat(false)
      }
      return next
    })
  }, [])

  // Cargar perfil desde la base de datos
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setProfile(null)
      return null
    }

    try {
      setIsCheckingProfile(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, featured_pokemon, profile_visibility, favorites_visibility, follow_list_visibility, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // Fallback si las nuevas columnas aún no existen en Supabase
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('avatar_url')) {
          const fallback = await supabase
            .from('profiles')
            .select('id, username, avatar_url, created_at, updated_at')
            .eq('id', userId)
            .maybeSingle()

          if (!fallback.error && fallback.data) {
            setProfile(fallback.data)
            return fallback.data
          }
        }

        // Si la tabla no existe aún en Supabase (código PGRST205), registrar advertencia en DEV
        if (error.code === 'PGRST205') {
          if (import.meta.env.DEV) {
            console.warn('[PokeGuide Auth] La tabla "profiles" aún no ha sido creada en Supabase. Ejecuta supabase/schema.sql en el panel de Supabase.')
          }
        } else {
          console.error('[PokeGuide Auth] Error al cargar perfil:', error.message)
        }
        setProfile(null)
        return null
      }

      setProfile(data || null)
      return data || null
    } catch (err) {
      console.error('[PokeGuide Auth] Excepción al consultar perfil:', err)
      setProfile(null)
      return null
    } finally {
      setIsCheckingProfile(false)
    }
  }, [])

  // Comprobar si el nombre de usuario está disponible en tiempo real
  const checkUsernameAvailability = useCallback(async (username, currentUserId = null) => {
    const validation = validateUsernameFormat(username)
    if (!validation.valid) {
      return { available: false, error: validation.error, status: 'invalid' }
    }

    if (!supabase || !isSupabaseConfigured) {
      return { available: false, error: 'Supabase no está configurado.', status: 'unconfigured' }
    }

    const normalized = validation.trimmed.toLowerCase()

    try {
      // Consultar por coincidencia en username normalizado (o insensitive)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .or(`username_normalized.eq.${normalized},username.ilike.${normalized}`)
        .limit(1)

      if (error) {
        if (error.code === 'PGRST205') {
          return { available: true, status: 'table_missing' }
        }
        return { available: false, error: 'No se pudo verificar el nombre de usuario.', status: 'error' }
      }

      if (data && data.length > 0) {
        const found = data[0]
        // Si es el mismo usuario actual, está disponible para él
        if (currentUserId && found.id === currentUserId) {
          return { available: true, status: 'available' }
        }
        return { available: false, error: 'Este nombre de usuario ya está ocupado.', status: 'taken' }
      }

      return { available: true, status: 'available' }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al verificar disponibilidad:', err)
      return { available: false, error: 'Error de red al comprobar disponibilidad.', status: 'network_error' }
    }
  }, [])

  // Inicialización de la sesión y observador de estado
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function initializeAuth() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (isMounted) {
          const activeSession = data?.session || null
          setSession(activeSession)
          const activeUser = activeSession?.user || null
          setUser(activeUser)

          if (activeUser) {
            const userProfile = await fetchProfile(activeUser.id)
            // Si el usuario autenticado (ej. Google) no tiene perfil, requerir setup de username
            if (!userProfile) {
              setShowUsernameSetup(true)
            }
          }
        }
      } catch (err) {
        console.error('[PokeGuide Auth] Error al recuperar sesión inicial:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return

      setSession(currentSession)
      const currentUser = currentSession?.user || null
      setUser(currentUser)

      if (event === 'PASSWORD_RECOVERY') {
        setAuthModal({ isOpen: true, view: 'reset-password' })
        return
      }

      if (event === 'SIGNED_IN' && currentUser) {
        const userProfile = await fetchProfile(currentUser.id)
        if (!userProfile) {
          setShowUsernameSetup(true)
        } else {
          setShowUsernameSetup(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setShowUsernameSetup(false)
        setAuthModal((prev) => ({ ...prev, isOpen: false }))
      } else if (event === 'USER_UPDATED' && currentUser) {
        await fetchProfile(currentUser.id)
      }
    })

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [fetchProfile])

  // Crear perfil en public.profiles
  const createProfile = useCallback(async (desiredUsername) => {
    if (!user) {
      return { success: false, error: 'Debes haber iniciado sesión para crear un perfil.' }
    }

    const validation = validateUsernameFormat(desiredUsername)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Verificar disponibilidad previa
    const check = await checkUsernameAvailability(validation.trimmed, user.id)
    if (!check.available && check.status !== 'table_missing') {
      return { success: false, error: check.error || 'Este nombre de usuario ya está ocupado.' }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: validation.trimmed,
          },
        ])
        .select()
        .single()

      if (error) {
        // Violación de restricción única en PostgreSQL (código 23505)
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique')) {
          return { success: false, error: 'Este nombre de usuario acaba de ser ocupado. Por favor, elige otro.' }
        }
        if (error.code === 'PGRST205') {
          return { success: false, error: 'La tabla profiles no existe en Supabase. Debes ejecutar el archivo supabase/schema.sql.' }
        }
        return { success: false, error: error.message || 'Error al guardar el perfil.' }
      }

      setProfile(data)
      setShowUsernameSetup(false)
      return { success: true, profile: data }
    } catch (err) {
      console.error('[PokeGuide Auth] Excepción al crear perfil:', err)
      return { success: false, error: 'Error inesperado de red al crear el perfil.' }
    }
  }, [user, checkUsernameAvailability])

  // Registro con Email + Contraseña + Username
  const signUpWithEmail = useCallback(async ({ email, password, confirmPassword, username }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase no está configurado en .env.local.' }
    }

    // 1. Validar Username
    const userValidation = validateUsernameFormat(username)
    if (!userValidation.valid) {
      return { success: false, error: userValidation.error }
    }

    // 2. Validar Email
    const cleanEmail = email?.trim() || ''
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'El correo electrónico no es válido.' }
    }

    // 3. Validar Contraseña
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` }
    }

    // 4. Confirmar contraseña
    if (password !== confirmPassword) {
      return { success: false, error: 'Las contraseñas no coinciden.' }
    }

    // 5. Verificar disponibilidad del username antes de proceder
    const check = await checkUsernameAvailability(userValidation.trimmed)
    if (!check.available && check.status !== 'table_missing') {
      return { success: false, error: check.error || 'Este nombre de usuario ya está ocupado.' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: userValidation.trimmed,
          },
        },
      })

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('User already exists')) {
          return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' }
        }
        return { success: false, error: error.message || 'Error al registrar la cuenta.' }
      }

      // Si Supabase devuelve sesión activa de inmediato (email confirmation desactivada):
      if (data?.session && data?.user) {
        // Intentar crear el registro en profiles de inmediato
        const profileRes = await createProfile(userValidation.trimmed)
        if (!profileRes.success) {
          // Si el trigger ya lo creó, intentamos cargarlo
          await fetchProfile(data.user.id)
        }
        closeAuthModal()
        return { success: true, emailConfirmationRequired: false, user: data.user }
      }

      // Si la confirmación por correo está activada en Supabase:
      return {
        success: true,
        emailConfirmationRequired: true,
        message: 'Cuenta creada correctamente. Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta.',
      }
    } catch (err) {
      console.error('[PokeGuide Auth] Error en registro:', err)
      return { success: false, error: 'Ocurrió un error inesperado al conectar con el servidor.' }
    }
  }, [checkUsernameAvailability, createProfile, fetchProfile, closeAuthModal])

  // Iniciar sesión con Email + Contraseña
  const signInWithEmail = useCallback(async ({ email, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    const cleanEmail = email?.trim() || ''
    if (!cleanEmail) {
      return { success: false, error: 'Por favor, ingresa tu correo electrónico.' }
    }
    if (!password) {
      return { success: false, error: 'Por favor, ingresa tu contraseña.' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'El correo o la contraseña no son correctos.' }
        }
        if (error.message?.includes('Email not confirmed')) {
          return { success: false, error: 'Por favor, confirma tu correo electrónico antes de iniciar sesión.' }
        }
        return { success: false, error: error.message || 'Error al iniciar sesión.' }
      }

      closeAuthModal()
      return { success: true, user: data.user }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al iniciar sesión:', err)
      return { success: false, error: 'Error de red al intentar iniciar sesión.' }
    }
  }, [closeAuthModal])

  // Iniciar sesión con Google OAuth
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        return { success: false, error: error.message || 'Error al conectar con Google.' }
      }

      return { success: true }
    } catch (err) {
      console.error('[PokeGuide Auth] Error en Google OAuth:', err)
      return { success: false, error: 'No se pudo iniciar el inicio de sesión con Google.' }
    }
  }, [])

  // Cerrar sesión
  const signOut = useCallback(async () => {
    if (!supabase) return { success: false }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setProfile(null)
      setShowUsernameSetup(false)
      closeAuthModal()
      return { success: true }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al cerrar sesión:', err)
      return { success: false, error: err.message }
    }
  }, [closeAuthModal])

  // Recuperación de contraseña: Enviar correo
  const resetPasswordForEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    const cleanEmail = email?.trim() || ''
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Por favor, ingresa un correo electrónico válido.' }
    }

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        console.error('[PokeGuide Auth] Error en resetPasswordForEmail:', error)
      }

      // Por seguridad, siempre mostramos mensaje neutral
      return {
        success: true,
        message: 'Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer tu contraseña.',
      }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al solicitar restablecimiento:', err)
      return {
        success: true,
        message: 'Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer tu contraseña.',
      }
    }
  }, [])

  // Actualizar contraseña tras volver de link de recuperación
  const updatePassword = useCallback(async (newPassword, confirmNewPassword) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` }
    }

    if (newPassword !== confirmNewPassword) {
      return { success: false, error: 'Las contraseñas no coinciden.' }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: error.message || 'Error al actualizar la contraseña.' }
      }

      closeAuthModal()
      return { success: true, message: 'Tu contraseña ha sido actualizada correctamente.' }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al actualizar contraseña:', err)
      return { success: false, error: 'Error inesperado al cambiar la contraseña.' }
    }
  }, [closeAuthModal])

  // Actualizar nombre de usuario desde Mi Perfil
  const updateUsername = useCallback(async (newUsername) => {
    if (!user) return { success: false, error: 'No hay usuario autenticado.' }
    const validation = validateUsernameFormat(newUsername)
    if (!validation.valid) return { success: false, error: validation.error }

    // Si no cambió
    if (profile?.username === validation.trimmed) {
      return { success: true, profile }
    }

    const check = await checkUsernameAvailability(validation.trimmed, user.id)
    if (!check.available && check.status !== 'table_missing') {
      return { success: false, error: check.error || 'Este nombre de usuario ya está ocupado.' }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: validation.trimmed })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique')) {
          return { success: false, error: 'Este nombre de usuario acaba de ser ocupado. Por favor, elige otro.' }
        }
        return { success: false, error: error.message || 'Error al actualizar el nombre de usuario.' }
      }

      setProfile(data)
      return { success: true, profile: data }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al actualizar username:', err)
      return { success: false, error: 'Error inesperado al actualizar nombre de usuario.' }
    }
  }, [user, profile, checkUsernameAvailability])

  // Subir foto de perfil recortada a Supabase Storage
  const uploadAvatar = useCallback(async (blob) => {
    if (!user || !supabase) return { success: false, error: 'No hay usuario autenticado.' }

    const filePath = `${user.id}/avatar.webp`

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/webp',
          upsert: true,
        })

      if (uploadError) {
        console.error('[PokeGuide Auth] Error Supabase Storage upload:', uploadError)
        const raw = (uploadError.message || '').toLowerCase()
        if (raw.includes('bucket not found') || uploadError.statusCode === '404' || uploadError.code === 'NoSuchBucket') {
          return {
            success: false,
            error: 'El bucket "avatars" no existe en Supabase Storage. Debes ejecutar el script SQL "supabase/migrations/add_profile_avatar.sql" en tu panel de Supabase.',
          }
        }
        if (raw.includes('row-level security') || raw.includes('violates') || raw.includes('policy')) {
          return {
            success: false,
            error: 'Permiso denegado por políticas de almacenamiento. Ejecuta el script de migración SQL en Supabase para habilitar los permisos.',
          }
        }
        return { success: false, error: uploadError.message || 'Error al subir la imagen al almacenamiento.' }
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrlWithTime = `${urlData.publicUrl}?t=${Date.now()}`

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlWithTime })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('[PokeGuide Auth] Error al actualizar avatar_url en profiles:', updateError)
        if (updateError.code === '42703' || (updateError.message || '').toLowerCase().includes('avatar_url')) {
          return {
            success: false,
            error: 'La columna "avatar_url" no existe en la tabla "profiles". Debes ejecutar el script SQL "supabase/migrations/add_profile_avatar.sql" en tu panel de Supabase.',
          }
        }
        return { success: false, error: updateError.message || 'Error al guardar la foto en el perfil.' }
      }

      setProfile(data)
      return { success: true, avatar_url: avatarUrlWithTime, profile: data }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al subir avatar:', err)
      return { success: false, error: 'Error de red o procesamiento al guardar el avatar.' }
    }
  }, [user])

  // Eliminar foto de perfil
  const deleteAvatar = useCallback(async () => {
    if (!user || !supabase) return { success: false, error: 'No hay usuario autenticado.' }

    try {
      const filePath = `${user.id}/avatar.webp`
      await supabase.storage.from('avatars').remove([filePath])

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === '42703' || (error.message || '').toLowerCase().includes('avatar_url')) {
          return {
            success: false,
            error: 'La columna "avatar_url" no existe en la base de datos. Ejecuta la migración en Supabase.',
          }
        }
        return { success: false, error: error.message || 'Error al eliminar la foto del perfil.' }
      }

      setProfile(data)
      return { success: true, profile: data }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al eliminar avatar:', err)
      return { success: false, error: 'Error inesperado al eliminar la foto.' }
    }
  }, [user])

  // Cambiar correo electrónico
  const updateEmail = useCallback(async (newEmail) => {
    if (!user || !supabase) return { success: false, error: 'No hay usuario autenticado.' }
    const clean = newEmail?.trim() || ''
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      return { success: false, error: 'Por favor, introduce un correo electrónico válido.' }
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ email: clean })
      if (error) return { success: false, error: error.message || 'Error al actualizar el correo.' }

      return {
        success: true,
        message: 'Te hemos enviado un correo a tu nueva dirección para confirmar el cambio.',
        user: data.user,
      }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al cambiar email:', err)
      return { success: false, error: 'Error de red al actualizar correo.' }
    }
  }, [user])

  // Cambiar contraseña desde Ajustes
  const updatePasswordInSettings = useCallback(async (newPassword, confirmNewPassword) => {
    if (!user || !supabase) return { success: false, error: 'No hay usuario autenticado.' }
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` }
    }
    if (newPassword !== confirmNewPassword) {
      return { success: false, error: 'Las contraseñas no coinciden.' }
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return { success: false, error: error.message || 'Error al cambiar la contraseña.' }

      return { success: true, message: 'Tu contraseña ha sido actualizada correctamente.' }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al cambiar contraseña:', err)
      return { success: false, error: 'Error inesperado al cambiar contraseña.' }
    }
  }, [user])

  // Actualizar biografía y Pokémon destacado
  const updateBioAndFeaturedPokemon = useCallback(async (bio, featuredPokemon) => {
    if (!user || !supabase) return { success: false, error: 'No hay usuario autenticado.' }

    try {
      const updates = {
        bio: typeof bio === 'string' ? bio.slice(0, 250).trim() : '',
        featured_pokemon: typeof featuredPokemon === 'string' ? featuredPokemon.trim().toLowerCase() : 'charizard',
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      setProfile(data)
      return { success: true, profile: data }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al actualizar biografía/pokemon destacado:', err)
      return { success: false, error: 'Error inesperado al actualizar perfil.' }
    }
  }, [user])

  // Actualizar configuraciones de privacidad
  const updateProfilePrivacy = useCallback(async (settings) => {
    if (!user || !supabase) return { success: false, error: 'No hay usuario autenticado.' }

    try {
      const updates = {}
      if (settings.profile_visibility) updates.profile_visibility = settings.profile_visibility
      if (settings.favorites_visibility) updates.favorites_visibility = settings.favorites_visibility
      if (settings.follow_list_visibility) updates.follow_list_visibility = settings.follow_list_visibility

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      setProfile(data)
      return { success: true, profile: data }
    } catch (err) {
      console.error('[PokeGuide Auth] Error al actualizar privacidad:', err)
      return { success: false, error: 'Error inesperado al guardar privacidad.' }
    }
  }, [user])

  // Escuchar en tiempo real solicitudes de seguimiento entrantes
  useEffect(() => {
    if (!user?.id || !supabase) return undefined

    async function refreshPendingCount() {
      try {
        const { count, error } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)
          .eq('status', 'pending')
        if (!error && typeof count === 'number') {
          setPendingRequestsCount(count)
        }
      } catch {
        // Silencioso
      }
    }

    refreshPendingCount()

    const channel = supabase
      .channel(`social-follows-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        refreshPendingCount
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const isAuthenticated = Boolean(user)
  const isProfileComplete = Boolean(user && profile?.username)

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      isCheckingProfile,
      isAuthenticated,
      isProfileComplete,
      authModal,
      showUsernameSetup,
      setShowUsernameSetup,
      openAuthModal,
      closeAuthModal,
      setAuthModalView,
      isProfileOpen,
      openProfileModal,
      closeProfileModal,
      isSettingsOpen,
      settingsTab,
      openSettingsModal,
      closeSettingsModal,
      setSettingsTab,
      isSocialOpen,
      openSocialModal,
      closeSocialModal,
      viewingUser,
      isUserProfileOpen,
      openUserProfile,
      closeUserProfile,
      isFollowersOpen,
      followersTargetUserId,
      openFollowers,
      closeFollowers,
      isFollowingOpen,
      followingTargetUserId,
      openFollowing,
      closeFollowing,
      isFollowRequestsOpen,
      openFollowRequests,
      closeFollowRequests,
      isUserSearchOpen,
      openUserSearch,
      closeUserSearch,
      isPrivacyModalOpen,
      openPrivacyModal,
      closePrivacyModal,
      pendingRequestsCount,
      setPendingRequestsCount,
      updateBioAndFeaturedPokemon,
      updateProfilePrivacy,
      isChatOpen,
      isChatMinimized,
      activeChatFriend,
      hasUnreadChat,
      setActiveChatFriend,
      setHasUnreadChat,
      openChatWithFriend,
      openFloatingChat,
      closeFloatingChat,
      minimizeFloatingChat,
      toggleFloatingChat,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      checkUsernameAvailability,
      createProfile,
      fetchProfile,
      resetPasswordForEmail,
      updatePassword,
      updateUsername,
      uploadAvatar,
      deleteAvatar,
      updateEmail,
      updatePasswordInSettings,
    }),
    [
      user,
      session,
      profile,
      loading,
      isCheckingProfile,
      isAuthenticated,
      isProfileComplete,
      authModal,
      showUsernameSetup,
      openAuthModal,
      closeAuthModal,
      setAuthModalView,
      isProfileOpen,
      openProfileModal,
      closeProfileModal,
      isSettingsOpen,
      settingsTab,
      openSettingsModal,
      closeSettingsModal,
      isSocialOpen,
      openSocialModal,
      closeSocialModal,
      viewingUser,
      isUserProfileOpen,
      openUserProfile,
      closeUserProfile,
      isFollowersOpen,
      followersTargetUserId,
      openFollowers,
      closeFollowers,
      isFollowingOpen,
      followingTargetUserId,
      openFollowing,
      closeFollowing,
      isFollowRequestsOpen,
      openFollowRequests,
      closeFollowRequests,
      isUserSearchOpen,
      openUserSearch,
      closeUserSearch,
      isPrivacyModalOpen,
      openPrivacyModal,
      closePrivacyModal,
      pendingRequestsCount,
      updateBioAndFeaturedPokemon,
      updateProfilePrivacy,
      isChatOpen,
      isChatMinimized,
      activeChatFriend,
      hasUnreadChat,
      openChatWithFriend,
      openFloatingChat,
      closeFloatingChat,
      minimizeFloatingChat,
      toggleFloatingChat,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      checkUsernameAvailability,
      createProfile,
      fetchProfile,
      resetPasswordForEmail,
      updatePassword,
      updateUsername,
      uploadAvatar,
      deleteAvatar,
      updateEmail,
      updatePasswordInSettings,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un <AuthProvider>')
  }
  return context
}
