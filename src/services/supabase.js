import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || ''

// Validar si las variables de entorno requeridas están presentes
const missingVars = []
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
if (!supabaseKey) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY')

export const isSupabaseConfigured = missingVars.length === 0

if (!isSupabaseConfigured) {
  if (import.meta.env.DEV) {
    console.warn(
      `[Supabase] ⚠️ Configuración incompleta en PokeGuide:\n` +
      `Faltan las siguientes variables en .env.local: ${missingVars.join(', ')}.\n` +
      `Supabase no estará disponible hasta que agregues estas variables.`
    )
  }
}

/**
 * Cliente de Supabase inicializado.
 * Si las variables no están presentes, es null para prevenir errores de inicialización.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

/**
 * Función de prueba para verificar la comunicación con Supabase sin requerir tablas creadas.
 * Realiza una comprobación segura del estado de autenticación / API.
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured || !supabase) {
    const errorMsg = `Supabase no está configurado. Faltan variables: ${missingVars.join(', ')}.`
    console.warn(`[Supabase Test] ${errorMsg}`)
    return {
      success: false,
      status: 'unconfigured',
      missing: missingVars,
      message: errorMsg,
    }
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[Supabase Test] ❌ Error de conexión:', error.message)
      return {
        success: false,
        status: 'error',
        message: error.message,
        error,
      }
    }

    console.info('[Supabase Test] ✅ Conexión con Supabase verificada correctamente.')
    return {
      success: true,
      status: 'connected',
      message: 'Conexión con Supabase verificada correctamente.',
      session: data.session,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Supabase Test] ❌ Error inesperado de red:', message)
    return {
      success: false,
      status: 'network_error',
      message,
      error: err,
    }
  }
}
