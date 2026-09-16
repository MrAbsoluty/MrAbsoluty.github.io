import { getMovesList } from '../src/services/pokeapi.js'

async function run() {
  const queries = [
    'A Bocajarro',
    'A bOcajarro',
    'a bocajarro',
    'A BOCAJARRO',
    'boca',
    'Close Combat',
    'destructor',
    'Destructor',
    'arañazo',
    'aranazo',
    'pajaro osado',
    'Pájaro Osado',
    'fuerza lunar',
    'cometa draco',
    'lluevehojas',
    'ascuas',
    'pistola agua',
    'rayo solar'
  ]

  let allPassed = true
  for (const q of queries) {
    const res = await getMovesList({ query: q, locale: 'es' })
    const found = res.moves.map(m => `${m.displayName} (${m.name})`).join(', ')
    const pass = res.totalCount > 0
    if (!pass) allPassed = false
    console.log(`${pass ? '✓' : '✗'} Query "${q}" -> count: ${res.totalCount}, found: ${found}`)
  }

  if (allPassed) {
    console.log('\nTODAS LAS BÚSQUEDAS PASARON EXITOSAMENTE.')
  } else {
    console.error('\nHUBO FALLOS EN LA BÚSQUEDA.')
    process.exit(1)
  }
}

run().catch(console.error)
