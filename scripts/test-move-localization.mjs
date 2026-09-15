/**
 * test-move-localization.mjs
 * Suite de verificación y auditoría de localización de movimientos para PokéGuide (Fase 1.1).
 */

import { getMove } from '../src/services/pokeapi.js'
import { getMoveLocalizedText, VERIFIED_MOVE_EFFECTS_ES } from '../src/data/moveTranslations.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

async function runTests() {
  console.log('\n==================================================')
  console.log('🧪 POKÉGUIDE — PRUEBAS DE LOCALIZACIÓN DE MOVIMIENTOS')
  console.log('==================================================\n')

  // --- TEST 1: Pound + es ---
  console.log('Test 1: Pound en español (es)')
  const poundEs = await getMove('pound', 'es')
  assert(poundEs.displayName === 'Destructor', 'Nombre localizado es Destructor')
  assert(!poundEs.effect.includes('Inflicts regular damage'), 'El efecto NO contiene texto en inglés')
  assert(poundEs.effect === 'Inflige daño normal sin ningún efecto adicional.', 'El efecto es la traducción al español esperada')
  assert(poundEs.description === 'Golpea con las patas o la cola.', 'La descripción oficial en español es correcta')

  // --- TEST 2: Pound + es-419 ---
  console.log('\nTest 2: Pound en español latino (es-419)')
  const poundEs419 = await getMove('pound', 'es-419')
  assert(!poundEs419.effect.includes('Inflicts regular damage'), 'El efecto en es-419 NO contiene inglés')
  assert(poundEs419.effect === 'Inflige daño normal sin ningún efecto adicional.', 'El efecto en es-419 es en español')

  // --- TEST 3: Pound + en ---
  console.log('\nTest 3: Pound en inglés (en)')
  const poundEn = await getMove('pound', 'en')
  assert(poundEn.displayName === 'Pound', 'Nombre en inglés es Pound')
  assert(poundEn.effect.includes('Inflicts regular damage with no additional effect.'), 'El efecto en inglés se mantiene idéntico a PokéAPI')
  assert(poundEn.fullEffect.includes('Inflicts regular damage.'), 'fullEffect en inglés se mantiene')

  // --- TEST 4: Movimiento con traducción propia verificada (Close Combat) ---
  console.log('\nTest 4: Close Combat (A Bocajarro) en español')
  const ccEs = await getMove('close-combat', 'es')
  assert(ccEs.displayName === 'A Bocajarro', 'Nombre localizado es A Bocajarro')
  assert(!ccEs.effect.includes('Lowers the user'), 'El efecto NO está en inglés')
  assert(ccEs.effect.includes('Defensa') && ccEs.effect.includes('Defensa Especial'), 'El efecto menciona Defensa y Defensa Especial')

  // --- TEST 5: Fallback seguro cuando no hay traducción directa ---
  console.log('\nTest 5: Fallback seguro sin fugas de inglés')
  const fallbackResult = getMoveLocalizedText({
    moveSlug: 'unknown-custom-move',
    locale: 'es',
    rawDescription: 'Ataque misterioso que emite una luz cegadora.',
    rawEffect: 'Some obscure english technical effect description.',
    rawFullEffect: 'Complete obscure english effect details.',
    isEffectSpanish: false,
    isDescriptionSpanish: true,
  })
  assert(!fallbackResult.effect.includes('obscure english'), 'Fallback de efecto no contiene inglés')
  assert(fallbackResult.effect === 'Ataque misterioso que emite una luz cegadora.', 'Fallback utiliza descripción oficial en español')
  assert(fallbackResult.effect !== undefined && fallbackResult.effect !== null, 'Efecto no es undefined ni null')
  assert(fallbackResult.effect !== '[object Object]', 'Efecto no es [object Object]')

  // --- TEST 6: Independencia de caché por locale ---
  console.log('\nTest 6: Independencia de caché por locale')
  const cachedEs = await getMove('pound', 'es')
  const cachedEn = await getMove('pound', 'en')
  assert(cachedEs.effect !== cachedEn.effect, 'Caché de es y en son completamente independientes')
  assert(cachedEs.displayName === 'Destructor' && cachedEn.displayName === 'Pound', 'Nombres cacheados son independientes')

  // --- TEST 7: Contrato de MoveCard ---
  console.log('\nTest 7: Contrato de datos para MoveCard')
  assert(typeof poundEs.displayName === 'string' && poundEs.displayName.length > 0, 'MoveCard tiene displayName válido')
  assert(typeof poundEs.effect === 'string' && poundEs.effect.length > 0, 'MoveCard tiene effect válido')
  assert(!poundEs.effect.includes('undefined') && !poundEs.effect.includes('null'), 'MoveCard effect no tiene undefined/null')

  // --- TEST 8: Contrato de datos para MoveDetail ---
  console.log('\nTest 8: Contrato de datos para MoveDetail')
  assert(typeof poundEs.description === 'string' && poundEs.description.length > 0, 'MoveDetail tiene description')
  assert(typeof poundEs.effect === 'string' && poundEs.effect.length > 0, 'MoveDetail tiene effect')
  assert(typeof poundEs.fullEffect === 'string' && poundEs.fullEffect.length > 0, 'MoveDetail tiene fullEffect')
  assert(poundEs.description !== poundEs.fullEffect || poundEs.description.length > 0, 'MoveDetail separa o respalda campos limpiamente')

  // --- TEST 9: Auditoría en lote de movimientos comunes en español ---
  console.log('\nTest 9: Auditoría en lote de movimientos en español')
  const sampleSlugs = ['scratch', 'karate-chop', 'swords-dance', 'earthquake', 'flamethrower', 'thunderbolt']
  for (const slug of sampleSlugs) {
    const move = await getMove(slug, 'es')
    const hasEnglishWords =
      move.effect.includes('Inflicts regular damage') ||
      move.effect.includes('Has an increased chance') ||
      move.effect.includes('Raises the user') ||
      move.effect.includes('chance to paralyze')
    assert(!hasEnglishWords, `Movimiento "${slug}" (${move.displayName}): efecto localizado en español sin inglés`)
  }

  console.log('\n==================================================')
  console.log(`RESULTADOS: ${passed} PASADOS | ${failed} FALLADOS`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Error fatal durante la ejecución de pruebas:', err)
  process.exit(1)
})
