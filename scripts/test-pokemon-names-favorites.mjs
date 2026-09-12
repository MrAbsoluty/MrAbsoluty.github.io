import {
  cleanPokemonSlug,
  getPokemonDisplayName,
  CANONICAL_HYPHENATED_SPECIES,
  POKEMON_ID_TO_SLUG,
  OFFICIAL_POKEMON_NAMES_ES,
  OFFICIAL_POKEMON_NAMES_EN,
  normalizePokemonForFavorite,
} from '../src/utils/pokemonNames.js'
import { getPokemon } from '../src/services/pokeapi.js'
import es from '../src/locales/es.js'
import en from '../src/locales/en.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✓ ${message}`)
  } else {
    failed++
    console.error(`  ✗ FAIL: ${message}`)
  }
}

async function runSuite() {
  console.log('=== TEST SUITE: NOMBRES POKÉMON, TRADUCCIONES Y FAVORITOS ===\n')

  console.log('1. Normalización y auto-reparación de favoritos:')
  const favRoaring = normalizePokemonForFavorite({ id: 1005, name: 'roaring' })
  assert(favRoaring?.id === 1005 && favRoaring?.name === 'roaring-moon', 'Repara id: 1005 con nombre "roaring" a "roaring-moon"')

  const favGouging = normalizePokemonForFavorite({ id: 1020, name: 'gouging' })
  assert(favGouging?.id === 1020 && favGouging?.name === 'gouging-fire', 'Repara id: 1020 con nombre "gouging" a "gouging-fire"')

  const favLegacyStringRoaring = normalizePokemonForFavorite('roaring')
  assert(favLegacyStringRoaring?.id === 1005 && favLegacyStringRoaring?.name === 'roaring-moon', 'Repara string "roaring" a { id: 1005, name: "roaring-moon" }')

  const favLegacyStringGouging = normalizePokemonForFavorite('gouging')
  assert(favLegacyStringGouging?.id === 1020 && favLegacyStringGouging?.name === 'gouging-fire', 'Repara string "gouging" a { id: 1020, name: "gouging-fire" }')

  const favMega = normalizePokemonForFavorite('charizard-mega-x')
  assert(favMega?.name === 'charizard', 'Mantiene la normalización de megas a especie base (charizard-mega-x -> charizard)')

  const favRegional = normalizePokemonForFavorite('raichu-alola')
  assert(favRegional?.name === 'raichu', 'Mantiene la normalización de formas regionales a especie base (raichu-alola -> raichu)')

  console.log('\n2. Preservación de las 39 especies canónicas con guión:')
  for (const slug of CANONICAL_HYPHENATED_SPECIES) {
    const cleaned = cleanPokemonSlug(slug)
    const norm = normalizePokemonForFavorite(slug)
    assert(cleaned === slug && norm?.name === slug, `Especie canónica preservada sin truncar: "${slug}"`)
  }

  console.log('\n3. Traducciones oficiales de nombres en español e inglés:')
  assert(getPokemonDisplayName(1005, 'es') === 'Bramaluna', 'ID 1005 en ES es "Bramaluna"')
  assert(getPokemonDisplayName(1005, 'en') === 'Roaring Moon', 'ID 1005 en EN es "Roaring Moon"')
  assert(getPokemonDisplayName(1020, 'es') === 'Flamariete', 'ID 1020 en ES es "Flamariete"')
  assert(getPokemonDisplayName(1020, 'en') === 'Gouging Fire', 'ID 1020 en EN es "Gouging Fire"')
  assert(getPokemonDisplayName('roaring-moon', 'es') === 'Bramaluna', 'Slug "roaring-moon" en ES es "Bramaluna"')
  assert(getPokemonDisplayName('gouging-fire', 'es') === 'Flamariete', 'Slug "gouging-fire" en ES es "Flamariete"')
  assert(getPokemonDisplayName('roaring', 'es') === 'Bramaluna', 'Alias truncado "roaring" en ES es "Bramaluna"')
  assert(getPokemonDisplayName('gouging', 'es') === 'Flamariete', 'Alias truncado "gouging" en ES es "Flamariete"')
  assert(getPokemonDisplayName(772, 'es') === 'Código Cero', 'ID 772 en ES es "Código Cero"')
  assert(getPokemonDisplayName(772, 'en') === 'Type: Null', 'ID 772 en EN es "Type: Null"')
  assert(getPokemonDisplayName(984, 'es') === 'Colmilargo', 'ID 984 en ES es "Colmilargo"')
  assert(getPokemonDisplayName(1006, 'es') === 'Ferropaladín', 'ID 1006 en ES es "Ferropaladín"')
  assert(getPokemonDisplayName(6, 'es') === 'Charizard', 'ID 6 en ES es "Charizard"')

  console.log('\n4. Resolución de getPokemon con alias truncados y nombres en español:')
  try {
    const pRoaring = await getPokemon('roaring', 'es')
    assert(pRoaring?.id === 1005 && pRoaring?.name === 'roaring-moon', 'getPokemon("roaring") resuelve a Bramaluna (#1005)')

    const pGouging = await getPokemon('gouging', 'es')
    assert(pGouging?.id === 1020 && pGouging?.name === 'gouging-fire', 'getPokemon("gouging") resuelve a Flamariete (#1020)')

    const pBramaluna = await getPokemon('bramaluna', 'es')
    assert(pBramaluna?.id === 1005 && pBramaluna?.name === 'roaring-moon', 'getPokemon("bramaluna") resuelve a Bramaluna (#1005)')

    const pFlamariete = await getPokemon('flamariete', 'es')
    assert(pFlamariete?.id === 1020 && pFlamariete?.name === 'gouging-fire', 'getPokemon("flamariete") resuelve a Flamariete (#1020)')
  } catch (err) {
    failed++
    console.error('  ✗ Error en getPokemon:', err)
  }

  console.log('\n5. Consistencia de traducciones en diccionarios ES y EN:')
  const requiredKeys = [
    'following',
    'followers',
    'community',
    'notifications',
    'privacyKicker',
    'loadingProfile',
    'loadingFollowers',
    'loadingFollowing',
    'loadingRequests',
    'userNotFound',
    'userNotFoundDesc',
    'noBio',
    'changePhotoOrUsername',
    'viewPokemonDetails',
    'save',
    'saving',
    'ofUser',
    'viewFollowing',
    'viewFollowers',
  ]

  for (const key of requiredKeys) {
    assert(typeof es.social[key] === 'string' && es.social[key].length > 0, `es.social.${key} existe y no está vacío: "${es.social[key]}"`)
    assert(typeof en.social[key] === 'string' && en.social[key].length > 0, `en.social.${key} existe y no está vacío: "${en.social[key]}"`)
  }

  console.log(`\n========================================`)
  console.log(`TOTAL PRUEBAS: ${passed + failed} | PASADAS: ${passed} | FALLADAS: ${failed}`)
  console.log(`========================================`)

  if (failed > 0) {
    process.exit(1)
  }
}

runSuite()
