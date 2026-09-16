/**
 * Test suite para la Fase 1.2 del Move Dex:
 * Sistema determinista de Pokémon representativos.
 */

import { selectRepresentativePokemon, getRepresentativePokemon } from '../src/utils/representativePokemon.js'
import { getMove } from '../src/services/pokeapi.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    Error: ${err.message}`)
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

async function run() {
  console.log('==================================================')
  console.log('🧪 POKÉGUIDE — PRUEBAS DE POKÉMON REPRESENTATIVOS')
  console.log('==================================================\n')

  console.log('Cargando datos de movimientos desde PokéAPI...')
  const [
    iceBeam,
    earthquake,
    protect,
    fakeOut,
    solarBeam,
    knockOff,
    closeCombat,
    thunderbolt,
    flamethrower,
    chatter,
  ] = await Promise.all([
    getMove('ice-beam'),
    getMove('earthquake'),
    getMove('protect'),
    getMove('fake-out'),
    getMove('solar-beam'),
    getMove('knock-off'),
    getMove('close-combat'),
    getMove('thunderbolt'),
    getMove('flamethrower'),
    getMove('chatter'),
  ])

  // ==========================================
  // CASO 1: ICE BEAM (OBLIGATORIO)
  // ==========================================
  console.log('\nCaso 1: Ice Beam (Rayo Hielo)')
  const iceBeamReps = selectRepresentativePokemon({ move: iceBeam, learners: iceBeam.learnedBy, limit: 4 })
  const iceBeamNames = iceBeamReps.map((p) => p.name.toLowerCase())

  test('Ice Beam devuelve exactamente 4 representantes', () => {
    assert(iceBeamReps.length === 4, `Esperados 4, recibidos ${iceBeamReps.length}`)
  })

  test('Lapras emerge entre los representantes de Ice Beam', () => {
    assert(iceBeamNames.includes('lapras'), `Lapras no encontrado en: ${iceBeamNames.join(', ')}`)
  })

  test('Articuno emerge entre los representantes de Ice Beam', () => {
    assert(iceBeamNames.includes('articuno'), `Articuno no encontrado en: ${iceBeamNames.join(', ')}`)
  })

  test('Squirtle y Wartortle (solo MT) NO desplazan a los aprendices naturales', () => {
    assert(!iceBeamNames.includes('squirtle'), 'Squirtle no debería ser representante frente a Lapras/Articuno')
    assert(!iceBeamNames.includes('wartortle'), 'Wartortle no debería ser representante frente a Lapras/Articuno')
  })

  // ==========================================
  // CASO 2: EARTHQUAKE (TERREMOTO)
  // ==========================================
  console.log('\nCaso 2: Earthquake (Terremoto)')
  const eqReps = selectRepresentativePokemon({ move: earthquake, learners: earthquake.learnedBy, limit: 4 })
  const eqNames = eqReps.map((p) => p.name.toLowerCase())

  test('Earthquake devuelve exactamente 4 representantes', () => {
    assert(eqReps.length === 4, `Esperados 4, recibidos ${eqReps.length}`)
  })

  test('Earthquake excluye a usuarios no naturales iniciales como Venusaur/Charizard', () => {
    assert(!eqNames.includes('venusaur'), 'Venusaur (solo MT) no debe ser representante de Terremoto')
    assert(!eqNames.includes('charizard'), 'Charizard (solo MT) no debe ser representante de Terremoto')
  })

  test('Earthquake prioriza aprendices naturales con STAB de Tierra', () => {
    const allHaveGround = eqReps.every((p) => p.types.includes('ground'))
    assert(allHaveGround, `Todos los representantes deben tener STAB Tierra: ${JSON.stringify(eqReps.map((p) => [p.name, p.types]))}`)
  })

  // ==========================================
  // CASO 3: PROTECT (PROTECCIÓN - LISTA MASIVA 1200+ USUARIOS)
  // ==========================================
  console.log('\nCaso 3: Protect (Protección - Lista Masiva)')
  const protectReps = selectRepresentativePokemon({ move: protect, learners: protect.learnedBy, limit: 4 })

  test('Protect maneja más de 1200 aprendices y devuelve exactamente 4 representantes', () => {
    assert(protectReps.length === 4, `Esperados 4, recibidos ${protectReps.length}`)
  })

  test('Protect no se congela ni devuelve duplicados con listas masivas', () => {
    const ids = new Set(protectReps.map((p) => p.id))
    assert(ids.size === protectReps.length, 'No debe haber IDs duplicados')
  })

  // ==========================================
  // CASO 4: FAKE OUT (SORPRESA)
  // ==========================================
  console.log('\nCaso 4: Fake Out (Sorpresa)')
  const fakeOutReps = selectRepresentativePokemon({ move: fakeOut, learners: fakeOut.learnedBy, limit: 4 })
  const fakeOutNames = fakeOutReps.map((p) => p.name.toLowerCase())

  test('Fake Out prioriza aprendices naturales característicos (ej. Persian/Kangaskhan)', () => {
    assert(fakeOutNames.includes('persian') || fakeOutNames.includes('kangaskhan'), `Se esperaba Persian o Kangaskhan, recibidos: ${fakeOutNames.join(', ')}`)
  })

  // ==========================================
  // CASO 5: SOLAR BEAM (RAYO SOLAR)
  // ==========================================
  console.log('\nCaso 5: Solar Beam (Rayo Solar)')
  const solarReps = selectRepresentativePokemon({ move: solarBeam, learners: solarBeam.learnedBy, limit: 4 })
  const solarNames = solarReps.map((p) => p.name.toLowerCase())

  test('Solar Beam prioriza Pokémon de planta naturales y excluye Charizard/Butterfree de MT', () => {
    assert(!solarNames.includes('charizard'), 'Charizard no debe estar en Solar Beam')
    assert(!solarNames.includes('butterfree'), 'Butterfree no debe estar en Solar Beam')
    const hasVenusaur = solarNames.includes('venusaur') || solarNames.includes('ivysaur')
    assert(hasVenusaur, 'Línea de Venusaur/Ivysaur debe emerger')
  })

  // ==========================================
  // CASO 6: KNOCK OFF (DESARME)
  // ==========================================
  console.log('\nCaso 6: Knock Off (Desarme)')
  const knockOffReps = selectRepresentativePokemon({ move: knockOff, learners: knockOff.learnedBy, limit: 4 })
  const knockOffNames = knockOffReps.map((p) => p.name.toLowerCase())

  test('Knock Off destaca usuarios naturales (ej. Sableye/Crawdaunt)', () => {
    assert(knockOffNames.includes('sableye') || knockOffNames.includes('crawdaunt'), `Esperado Sableye o Crawdaunt en: ${knockOffNames.join(', ')}`)
  })

  // ==========================================
  // CASO 7: CLOSE COMBAT (A BOCAJARRO)
  // ==========================================
  console.log('\nCaso 7: Close Combat (A Bocajarro)')
  const ccReps = selectRepresentativePokemon({ move: closeCombat, learners: closeCombat.learnedBy, limit: 4 })
  const ccNames = ccReps.map((p) => p.name.toLowerCase())

  test('Close Combat selecciona usuarios Lucha emblemáticos (Lucario/Heracross/Hitmonlee/Gallade)', () => {
    const matches = ccNames.filter((n) => ['lucario', 'heracross', 'hitmonlee', 'gallade'].includes(n))
    assert(matches.length >= 2, `Esperados al menos 2 luchadores emblemáticos, recibidos: ${ccNames.join(', ')}`)
  })

  // ==========================================
  // CASO 8: THUNDERBOLT (RAYO)
  // ==========================================
  console.log('\nCaso 8: Thunderbolt (Rayo)')
  const tbReps = selectRepresentativePokemon({ move: thunderbolt, learners: thunderbolt.learnedBy, limit: 4 })
  const tbNames = tbReps.map((p) => p.name.toLowerCase())

  test('Thunderbolt destaca la línea de Pikachu/Raichu y eléctricos naturales', () => {
    const hasPikaLine = tbNames.includes('pikachu') || tbNames.includes('raichu')
    assert(hasPikaLine, `Línea de Pikachu/Raichu debe emerger en Rayo: ${tbNames.join(', ')}`)
  })

  // ==========================================
  // CASO 9: FLAMETHROWER (LANZALLAMAS)
  // ==========================================
  console.log('\nCaso 9: Flamethrower (Lanzallamas)')
  const flameReps = selectRepresentativePokemon({ move: flamethrower, learners: flamethrower.learnedBy, limit: 4 })
  const flameNames = flameReps.map((p) => p.name.toLowerCase())

  test('Flamethrower destaca la línea de Charmander/Charizard y usuarios fuego naturales', () => {
    const hasCharLine = flameNames.includes('charizard') || flameNames.includes('charmander')
    assert(hasCharLine, `Línea de Charizard debe emerger en Lanzallamas: ${flameNames.join(', ')}`)
  })

  // ==========================================
  // CASO 10: MOVIMIENTO CON POCOS USUARIOS (CHATTER)
  // ==========================================
  console.log('\nCaso 10: Movimiento con pocos usuarios (Chatter / Cháchara)')
  const chatterReps = selectRepresentativePokemon({ move: chatter, learners: chatter.learnedBy, limit: 4 })

  test('Chatter devuelve solo los usuarios reales sin inventar candidatos', () => {
    assert(chatterReps.length === 1, `Esperado 1 usuario para Chatter, recibidos ${chatterReps.length}`)
    assert(chatterReps[0].name.toLowerCase() === 'chatot', `Esperado Chatot, recibido ${chatterReps[0].name}`)
  })

  // ==========================================
  // TESTS DE PROPIEDADES (SECCIÓN 27)
  // ==========================================
  console.log('\nTests de Propiedades Fundamentales')

  test('Propiedad 1: resultado <= limit', () => {
    const limit2 = selectRepresentativePokemon({ move: iceBeam, learners: iceBeam.learnedBy, limit: 2 })
    assert(limit2.length <= 2, `Límite 2 no respetado: ${limit2.length}`)
  })

  test('Propiedad 2: resultado no contiene duplicados', () => {
    const ids = eqReps.map((p) => p.id)
    const uniqueIds = new Set(ids)
    assert(ids.length === uniqueIds.size, 'Hay IDs duplicados en el resultado')
  })

  test('Propiedad 3: todos los representantes pertenecen estrictamente a learnedBy', () => {
    const learnedByNames = new Set(iceBeam.learnedBy.map((p) => p.name))
    for (const rep of iceBeamReps) {
      assert(learnedByNames.has(rep.name), `${rep.name} no está en learnedBy de Ice Beam`)
    }
  })

  test('Propiedad 4: determinismo estricto (resultado A === resultado B)', () => {
    const runA = selectRepresentativePokemon({ move: iceBeam, learners: iceBeam.learnedBy, limit: 4 })
    const runB = selectRepresentativePokemon({ move: iceBeam, learners: iceBeam.learnedBy, limit: 4 })
    assert(JSON.stringify(runA) === JSON.stringify(runB), 'Los resultados deben ser idénticos en múltiples ejecuciones')
  })

  test('Propiedad 5: diversidad evolutiva (máximo 1 por familia evolutiva mientras haya candidatos)', () => {
    const families = iceBeamReps.map((p) => p.familyRoot)
    const uniqueFamilies = new Set(families)
    assert(families.length === uniqueFamilies.size, `Familias duplicadas detectadas: ${families.join(', ')}`)
  })

  test('Propiedad 6: interoperabilidad de alias y firmas de función', () => {
    const byObj = selectRepresentativePokemon({ move: iceBeam, learners: iceBeam.learnedBy, limit: 3 })
    const byArgs = getRepresentativePokemon(iceBeam, iceBeam.learnedBy, { limit: 3 })
    assert(JSON.stringify(byObj) === JSON.stringify(byArgs), 'Ambas firmas de llamada deben retornar exactamente lo mismo')
  })

  console.log('\n==================================================')
  console.log(`RESULTADOS: ${passed} PASADOS | ${failed} FALLADOS`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
