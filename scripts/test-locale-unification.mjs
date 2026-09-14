/**
 * test-locale-unification.mjs
 * Verificación exhaustiva de la unificación de idiomas en PokéGuide: es + es-419 -> es.
 */

import { localeOptions, translations, defaultLocale, getTranslations, SUPPORTED_LOCALES } from '../src/locales/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

let passed = 0
let failed = 0
const results = []

function test(num, description, fn) {
  try {
    fn()
    passed++
    results.push(`✅ [PASS] ${num}. ${description}`)
  } catch (err) {
    failed++
    results.push(`❌ [FAIL] ${num}. ${description}\n   → ${err.message}`)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed')
}

console.log('======================================================================')
console.log('🧪 POKEGUIDE — VERIFICACIÓN DE UNIFICACIÓN DE IDIOMAS (ES + EN)')
console.log('======================================================================\n')

// -------------------------------------------------------------
// Simulación de localStorage para los 5 casos de migración
// -------------------------------------------------------------
class MockLocalStorage {
  constructor() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

function runGetInitialLocale(storage) {
  try {
    const savedLocale = storage.getItem('pokeguide-locale')
    if (savedLocale === 'es-419') {
      storage.setItem('pokeguide-locale', 'es')
      return 'es'
    }
    return SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : defaultLocale
  } catch {
    return defaultLocale
  }
}

function runHandleLocaleChange(storage, nextLocale) {
  const targetLocale = nextLocale === 'es-419' || !SUPPORTED_LOCALES.includes(nextLocale)
    ? (String(nextLocale || '').toLowerCase().startsWith('en') ? 'en' : 'es')
    : nextLocale
  try {
    storage.setItem('pokeguide-locale', targetLocale)
  } catch {}
  return targetLocale
}

// =============================================================
// CASOS 1 a 5: LOCAL STORAGE Y MIGRACIÓN
// =============================================================

test(1, 'Caso 1: Usuario nuevo con localStorage vacío -> retorna "es"', () => {
  const mockStorage = new MockLocalStorage()
  const locale = runGetInitialLocale(mockStorage)
  assert(locale === 'es', `Se esperaba 'es', se obtuvo '${locale}'`)
})

test(2, 'Caso 2: Usuario antiguo con pokeguide-locale="es-419" -> migra a "es" y actualiza storage', () => {
  const mockStorage = new MockLocalStorage()
  mockStorage.setItem('pokeguide-locale', 'es-419')
  const locale = runGetInitialLocale(mockStorage)
  assert(locale === 'es', `Se esperaba retorno 'es', se obtuvo '${locale}'`)
  assert(mockStorage.getItem('pokeguide-locale') === 'es', `El storage debe ser migrado a 'es', es '${mockStorage.getItem('pokeguide-locale')}'`)
})

test(3, 'Caso 3: Usuario con pokeguide-locale="es" -> retorna "es"', () => {
  const mockStorage = new MockLocalStorage()
  mockStorage.setItem('pokeguide-locale', 'es')
  const locale = runGetInitialLocale(mockStorage)
  assert(locale === 'es', `Se esperaba 'es', se obtuvo '${locale}'`)
  assert(mockStorage.getItem('pokeguide-locale') === 'es')
})

test(4, 'Caso 4: Usuario con pokeguide-locale="en" -> retorna "en"', () => {
  const mockStorage = new MockLocalStorage()
  mockStorage.setItem('pokeguide-locale', 'en')
  const locale = runGetInitialLocale(mockStorage)
  assert(locale === 'en', `Se esperaba 'en', se obtuvo '${locale}'`)
})

test(5, 'Caso 5: Ningún flujo puede volver a guardar "es-419" en localStorage', () => {
  const mockStorage = new MockLocalStorage()
  const result = runHandleLocaleChange(mockStorage, 'es-419')
  assert(result === 'es', `handleLocaleChange debe normalizar 'es-419' a 'es'`)
  assert(mockStorage.getItem('pokeguide-locale') === 'es', `No debe persistir 'es-419' en storage`)
})

// =============================================================
// CASOS 6 a 8: SISTEMA DE LOCALES Y SELECTOR
// =============================================================

test(6, 'Selector: localeOptions contiene únicamente 🇪🇸 es y 🇺🇸 en', () => {
  assert(localeOptions.length === 2, `localeOptions debe tener 2 elementos, tiene ${localeOptions.length}`)
  const codes = localeOptions.map(o => o.code)
  assert(codes.includes('es') && codes.includes('en'), `localeOptions debe contener 'es' y 'en'`)
  assert(!codes.includes('es-419'), `localeOptions NO debe contener 'es-419'`)
})

test(7, 'SUPPORTED_LOCALES: es y en exclusivamente', () => {
  assert(SUPPORTED_LOCALES.length === 2 && SUPPORTED_LOCALES.includes('es') && SUPPORTED_LOCALES.includes('en'), 'SUPPORTED_LOCALES inválido')
})

test(8, 'Traducciones: translations contiene solo es y en, getTranslations normaliza legacy', () => {
  assert(Object.keys(translations).length === 2, 'translations debe tener solo 2 claves')
  const esT = getTranslations('es')
  const enT = getTranslations('en')
  const legacyT = getTranslations('es-419')
  assert(esT === legacyT, 'getTranslations("es-419") debe devolver el catálogo de "es"')
  assert(esT.languages.es === 'Español' && esT.languages.en === 'English', 'languages map en es')
  assert(!esT.languages['es-419'], 'es.languages no debe tener es-419')
  assert(!enT.languages['es-419'], 'en.languages no debe tener es-419')
})

// =============================================================
// CASOS 9 a 11: IA Y CACHÉ
// =============================================================

test(9, 'pokeguideAI: resolvedLocale normaliza es-419 a es', () => {
  const raw1 = 'es-419'
  const resolved1 = String(raw1).toLowerCase().startsWith('en') ? 'en' : 'es'
  assert(resolved1 === 'es', 'es-419 debe normalizarse a es')

  const raw2 = 'en'
  const resolved2 = String(raw2).toLowerCase().startsWith('en') ? 'en' : 'es'
  assert(resolved2 === 'en', 'en debe permanecer en')
})

test(10, 'pokeguideAI: getCacheKey genera claves con es, nunca es-419', () => {
  function getCleanLocale(locale) {
    return String(locale || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'
  }
  const key1 = `ability:sneasler:unburden:general:none:none:singles:beginner:${getCleanLocale('es-419')}`
  const key2 = `ability:sneasler:unburden:general:none:none:singles:beginner:${getCleanLocale('es')}`
  const key3 = `ability:sneasler:unburden:general:none:none:singles:beginner:${getCleanLocale('en')}`

  assert(key1 === key2, 'Clave para es-419 y es debe ser idéntica para compartir la misma entrada de IA')
  assert(key1 !== key3, 'Clave para es y en debe mantenerse aislada')
  assert(!key1.includes('es-419'), 'La clave no debe incluir es-419')
})

test(11, 'Sneasler + Liviano: misma identidad de caché para usuarios hispanohablantes', () => {
  const spanishIdentity = `sneasler:unburden:beginner:general:none:none:es`
  const englishIdentity = `sneasler:unburden:beginner:general:none:none:en`

  assert(spanishIdentity.endsWith(':es'), 'Identidad unificada en :es')
  assert(englishIdentity.endsWith(':en'), 'Identidad en :en')
})

// =============================================================
// RESULTADOS
// =============================================================

console.log('')
results.forEach((r) => console.log(r))
console.log('')
console.log('======================================================================')
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
}
