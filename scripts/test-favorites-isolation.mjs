import fs from 'fs'

// Cargar .env.local para que supabase.js tenga las variables en Node
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [k, ...v] = trimmed.split('=')
    process.env[k.trim()] = v.join('=').trim()
  }
} catch {}

// Polyfill import.meta.env para Node
if (typeof import.meta.env === 'undefined') {
  import.meta.env = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
}

const {
  getUserFavorites,
  getProfileByUsername,
  MR_GRAMITOS_ID,
  MR_ABSOLUTY_ID,
  GRAMITOS_CANONICAL_FAVORITES,
} = await import('../src/services/social.js')

function getFavoritesStorageKey(userId) {
  if (userId) return `pokeguide-favorites_${userId}`
  return 'pokeguide-favorites_guest'
}

async function runTests() {
  console.log('=== TEST SUITE: FAVORITES ISOLATION & DEDUPLICATION ===\n')

  let passed = 0
  let failed = 0
  function assert(condition, desc) {
    if (condition) {
      console.log(`  ✓ ${desc}`)
      passed++
    } else {
      console.error(`  ✗ FAIL: ${desc}`)
      failed++
    }
  }

  // 1. Claves de almacenamiento aisladas
  console.log('1. Aislamiento de Storage Keys:')
  assert(getFavoritesStorageKey(MR_GRAMITOS_ID) === `pokeguide-favorites_${MR_GRAMITOS_ID}`, 'Clave única para MrGramitos')
  assert(getFavoritesStorageKey(MR_ABSOLUTY_ID) === `pokeguide-favorites_${MR_ABSOLUTY_ID}`, 'Clave única para MrAbsoluty')
  assert(getFavoritesStorageKey(null) === 'pokeguide-favorites_guest', 'Clave para invitado')

  // 2. getUserFavorites para MrAbsoluty
  console.log('\n2. Consulta de favoritos de MrAbsoluty:')
  const absFavs = await getUserFavorites(MR_ABSOLUTY_ID)
  assert(Array.isArray(absFavs) && absFavs.length === 0, `MrAbsoluty tiene exactamente 0 favoritos (obtenido: ${absFavs.length})`)

  // 3. getUserFavorites para MrGramitos
  console.log('\n3. Consulta de favoritos de MrGramitos:')
  const gramFavs = await getUserFavorites(MR_GRAMITOS_ID)
  assert(Array.isArray(gramFavs) && gramFavs.length === 14, `MrGramitos tiene exactamente 14 favoritos (obtenido: ${gramFavs.length})`)

  const names = gramFavs.map(f => f.name)
  const uniqueNames = new Set(names)
  assert(names.length === uniqueNames.size, `Todos los 14 nombres son únicos (sin repetición de flamariete/bramaluna)`)
  assert(names.includes('gouging-fire'), 'Contiene gouging-fire (Flamariete #1020)')
  assert(names.includes('roaring-moon'), 'Contiene roaring-moon (Bramaluna #1005)')
  assert(!names.includes('gouging'), 'No contiene slug legado duplicado "gouging"')
  assert(!names.includes('roaring'), 'No contiene slug legado duplicado "roaring"')

  // 4. Perfiles y contadores
  console.log('\n4. Contadores en Perfiles:')
  const absProfile = await getProfileByUsername('MrAbsoluty')
  if (absProfile) {
    assert(absProfile.favoritesCount === 0, `Contador de favoritos de MrAbsoluty es 0 (obtenido: ${absProfile.favoritesCount})`)
  }

  const gramProfile = await getProfileByUsername('MrGramitos')
  if (gramProfile) {
    assert(gramProfile.favoritesCount === 14, `Contador de favoritos de MrGramitos es 14 (obtenido: ${gramProfile.favoritesCount})`)
  }

  console.log(`\nResultados: ${passed} pasadas, ${failed} fallidas.`)
  if (failed > 0) process.exit(1)
}

runTests().catch(err => {
  console.error('Error en test:', err)
  process.exit(1)
})
