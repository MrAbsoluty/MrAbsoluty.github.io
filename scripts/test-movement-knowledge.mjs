/**
 * test-movement-knowledge.mjs
 * Fase 2.5 — Movement Knowledge Layer + Validación Factual de Movimientos.
 *
 * Verifica:
 *   A — Sucker Punch / Golpe Bajo: prioridad +1, condición de daño directo, independencia de Velocidad
 *   B — Trick Room / Espacio Raro: duración 5 turnos, inversión de orden, no desactiva Liviano, no altera prioridad
 *   C — Knock Off / Desarme: remueve objeto, activa Liviano al perderlo, no lo cancela
 *   D — Close Combat / A Bocajarro: reducción de Def/SpD (-1), sinergia con Hierba Blanca y Liviano
 *   E — Solar Beam / Rayo Solar: movimiento de carga, omisión de carga en Sol / Hierba Única, no cura
 *   F — Giga Drain / Gigadrenado: NO es de carga (1 turno), cura 50% de daño, no cura sin daño
 *   G — White Herb / Hierba Blanca: restaura drops negativos, se consume, no aumenta Velocidad directamente
 *   H — Air Balloon / Globo Helio: inmunidad a Tierra, estalla por daño directo, no universal
 *   I — Sitrus Berry / Baya Zidra: consumo al 50% PS, activación reactiva/secundaria de Liviano
 *   J — TEST ESPECIAL NO-MEZCLA: Solar Beam ≠ Giga Drain (mecánicas mutuamente excluyentes)
 *   K — TEST ESPECIAL SNEASLER: White Herb + Close Combat como strategies[0] con causalidad estricta
 *   L — FACT VALIDATOR: Corrección determinista de errores conocidos de movimientos y objetos
 *   M — REGRESIÓN: Compatibilidad total con suites de fases anteriores
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

let passed = 0
let failed = 0
const results = []

function test(id, description, fn) {
  try {
    fn()
    passed++
    results.push(`✅ [PASS] ${id}. ${description}`)
  } catch (err) {
    failed++
    results.push(`❌ [FAIL] ${id}. ${description}\n   → ${err.message}`)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed')
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8')
}

console.log('======================================================================')
console.log('🧪 POKEGUIDE AI — FASE 2.5: MOVEMENT KNOWLEDGE LAYER & MOVE FACTS')
console.log('======================================================================\n')

const knowledgeCode = readFile('supabase/functions/analyze-ability/knowledgeLayer.ts')
const promptCode    = readFile('supabase/functions/analyze-ability/promptBuilder.ts')
const validatorCode = readFile('supabase/functions/analyze-ability/factValidator.ts')

// ============================================================================
// BLOQUE A: SUCKER PUNCH / GOLPE BAJO
// ============================================================================
test('A1', 'Knowledge Layer: Sucker Punch catalogado con prioridad +1 y categoría physical', () => {
  assert(knowledgeCode.includes("'sucker-punch': {"), 'sucker-punch no encontrado en CANONICAL_MOVE_KNOWLEDGE')
  assert(knowledgeCode.includes("priority: 1"), 'Prioridad de Sucker Punch debe ser 1')
  assert(knowledgeCode.includes("category: 'physical'"), 'Categoría debe ser physical')
})

test('A2', 'Knowledge Layer: Sucker Punch documenta condición obligatoria de movimiento de ataque', () => {
  assert(knowledgeCode.includes("haya seleccionado un movimiento que cause daño directo"), 'Debe requerir daño directo')
  assert(knowledgeCode.includes("Falla si el objetivo seleccionó un movimiento de estado"), 'Debe fallar si el objetivo usa estado')
})

test('A3', 'Knowledge Layer: Sucker Punch documenta independencia entre prioridad y Velocidad', () => {
  assert(knowledgeCode.includes("Golpe Bajo NO supera la Velocidad del rival"), 'Debe aclarar que no supera en Velocidad')
  assert(knowledgeCode.includes("Golpe Bajo NO siempre golpea primero"), 'Debe prohibir la afirmación absoluta')
})

// ============================================================================
// BLOQUE B: TRICK ROOM / ESPACIO RARO
// ============================================================================
test('B1', 'Knowledge Layer: Trick Room documenta duración de 5 turnos e inversión de orden', () => {
  assert(knowledgeCode.includes("'trick-room': {"), 'trick-room no encontrado en CANONICAL_MOVE_KNOWLEDGE')
  assert(knowledgeCode.includes("dura exactamente 5 turnos"), 'Debe durar 5 turnos')
  assert(knowledgeCode.includes("Invierte el orden de actuación basado en la estadística de Velocidad"), 'Debe invertir orden')
})

test('B2', 'Knowledge Layer: Trick Room explicita que NO reduce Velocidad ni desactiva Liviano', () => {
  assert(knowledgeCode.includes("Espacio Raro NO reduce ni modifica el valor numérico de la estadística de Velocidad"), 'No reduce stat')
  assert(knowledgeCode.includes("Espacio Raro NO desactiva, anula ni elimina la habilidad Liviano"), 'No desactiva Liviano')
})

test('B3', 'Knowledge Layer: Trick Room explicita que NO altera el sistema de prioridad', () => {
  assert(knowledgeCode.includes("Espacio Raro NO altera el sistema de prioridad de movimientos"), 'No altera prioridad')
})

// ============================================================================
// BLOQUE C: KNOCK OFF / DESARME
// ============================================================================
test('C1', 'Knowledge Layer: Knock Off catalogado con 65 BP y multiplicador 1.5x ante objeto', () => {
  assert(knowledgeCode.includes("'knock-off': {"), 'knock-off no encontrado')
  assert(knowledgeCode.includes("basePower: 65"), 'Base power debe ser 65')
  assert(knowledgeCode.includes("Multiplica su potencia base por 1.5x"), 'Debe documentar multiplicador 1.5x')
})

test('C2', 'Knowledge Layer: Knock Off no cancela Liviano y su remoción CUMPLE la condición de activación', () => {
  assert(knowledgeCode.includes("Desarme NO impide ni cancela la habilidad Liviano"), 'No cancela Liviano')
  assert(knowledgeCode.includes("CUMPLE la condición de activación de Liviano"), 'Cumple activación de Liviano')
})

// ============================================================================
// BLOQUE D: CLOSE COMBAT / A BOCAJARRO
// ============================================================================
test('D1', 'Knowledge Layer: Close Combat catalogado con 120 BP y drops de Def y SpDef', () => {
  assert(knowledgeCode.includes("'close-combat': {"), 'close-combat no encontrado')
  assert(knowledgeCode.includes("basePower: 120"), 'Base power debe ser 120')
  assert(knowledgeCode.includes("reduce la Defensa y Defensa Especial del usuario en un nivel"), 'Drops documentados')
})

test('D2', 'Knowledge Layer: Close Combat + Hierba Blanca documentado como sinergia canónica de activación', () => {
  assert(knowledgeCode.includes("combinadas con Hierba Blanca, activan la restauración del objeto y su consumo inmediato"), 'Sinergia explicada')
  assert(knowledgeCode.includes("constituye la sinergia prioritaria y canónica"), 'Sinergia prioritaria documentada')
})

// ============================================================================
// BLOQUE E: SOLAR BEAM / RAYO SOLAR
// ============================================================================
test('E1', 'Knowledge Layer: Solar Beam marcado con isChargeMove: true', () => {
  const sbSection = knowledgeCode.slice(knowledgeCode.indexOf("'solar-beam':"), knowledgeCode.indexOf("'giga-drain':"))
  assert(sbSection.includes("isChargeMove: true"), 'Solar Beam debe tener isChargeMove: true')
})

test('E2', 'Knowledge Layer: Solar Beam omite carga bajo Sol o con Hierba Única', () => {
  const sbSection = knowledgeCode.slice(knowledgeCode.indexOf("'solar-beam':"), knowledgeCode.indexOf("'giga-drain':"))
  assert(sbSection.includes("omite por completo la fase de carga"), 'Debe omitir carga en sol')
  assert(sbSection.includes("Hierba Única (Power Herb)"), 'Debe mencionar Hierba Única')
})

test('E3', 'Knowledge Layer: Solar Beam NO recupera salud bajo ninguna circunstancia', () => {
  const sbSection = knowledgeCode.slice(knowledgeCode.indexOf("'solar-beam':"), knowledgeCode.indexOf("'giga-drain':"))
  assert(sbSection.includes("NO recupera puntos de salud (PS)"), 'Solar Beam no recupera PS')
  assert(sbSection.includes("Rayo Solar NO recupera PS al infligir daño (eso es Gigadrenado)"), 'Diferencia con Gigadrenado')
})

// ============================================================================
// BLOQUE F: GIGA DRAIN / GIGADRENADO
// ============================================================================
test('F1', 'Knowledge Layer: Giga Drain marcado con isChargeMove: false y healsFromDamagePercent: 50', () => {
  const gdSection = knowledgeCode.slice(knowledgeCode.indexOf("'giga-drain':"), knowledgeCode.indexOf("CANONICAL_ITEM_KNOWLEDGE"))
  assert(gdSection.includes("isChargeMove: false"), 'Giga Drain debe tener isChargeMove: false')
  assert(gdSection.includes("healsFromDamagePercent: 50"), 'Debe curar 50% de daño')
})

test('F2', 'Knowledge Layer: Giga Drain ataca en un solo turno y NO requiere carga ni Sol', () => {
  const gdSection = knowledgeCode.slice(knowledgeCode.indexOf("'giga-drain':"), knowledgeCode.indexOf("CANONICAL_ITEM_KNOWLEDGE"))
  assert(gdSection.includes("Se ejecuta SIEMPRE en un solo turno"), 'Debe ser en 1 turno')
  assert(gdSection.includes("Gigadrenado NUNCA requiere un turno de carga"), 'Nunca requiere carga')
})

test('F3', 'Knowledge Layer: Giga Drain NO recupera salud sin infligir daño', () => {
  const gdSection = knowledgeCode.slice(knowledgeCode.indexOf("'giga-drain':"), knowledgeCode.indexOf("CANONICAL_ITEM_KNOWLEDGE"))
  assert(gdSection.includes("Gigadrenado NO recupera salud sin infligir daño"), 'No cura sin daño')
})

// ============================================================================
// BLOQUE G: WHITE HERB / HIERBA BLANCA
// ============================================================================
test('G1', 'Knowledge Layer: White Herb restaura bajadas de stats a 0 y es consumible (isConsumption: true)', () => {
  assert(knowledgeCode.includes("'white-herb': {"), 'white-herb no encontrado en CANONICAL_ITEM_KNOWLEDGE')
  assert(knowledgeCode.includes("isConsumption: true"), 'White Herb debe tener isConsumption: true')
  assert(knowledgeCode.includes("Restaura automáticamente a cero cualquier modificación negativa"), 'Restaura a cero')
})

test('G2', 'Knowledge Layer: White Herb NO aumenta la Velocidad directamente (es el consumo lo que activa Liviano)', () => {
  assert(knowledgeCode.includes("La Hierba Blanca NO aumenta la Velocidad directamente"), 'No sube velocidad directamente')
})

// ============================================================================
// BLOQUE H: AIR BALLOON / GLOBO HELIO
// ============================================================================
test('H1', 'Knowledge Layer: Air Balloon tiene isConsumption: false y se pierde por daño directo', () => {
  const abSection = knowledgeCode.slice(knowledgeCode.indexOf("'air-balloon':"), knowledgeCode.indexOf("'sitrus-berry':"))
  assert(abSection.includes("isConsumption: false"), 'Air Balloon no es de consumo')
  assert(abSection.includes("Se pierde (estalla) cuando el portador recibe daño directo"), 'Estalla por daño')
})

test('H2', 'Knowledge Layer: Air Balloon no es activador universal de Liviano', () => {
  const abSection = knowledgeCode.slice(knowledgeCode.indexOf("'air-balloon':"), knowledgeCode.indexOf("'sitrus-berry':"))
  assert(abSection.includes("El Globo Helio NO activa Liviano de forma universal"), 'No es activador universal')
})

// ============================================================================
// BLOQUE I: SITRUS BERRY / BAYA ZIDRA
// ============================================================================
test('I1', 'Knowledge Layer: Sitrus Berry se consume a <= 50% HP y restaura 25% max HP', () => {
  assert(knowledgeCode.includes("'sitrus-berry': {"), 'sitrus-berry no encontrado')
  assert(knowledgeCode.includes("50% o menos"), 'Condición 50%')
  assert(knowledgeCode.includes("25% de los PS máximos"), 'Cura 25%')
})

test('I2', 'Knowledge Layer: Sitrus Berry es secundaria y no desplaza a Hierba Blanca + A Bocajarro', () => {
  assert(knowledgeCode.includes("La Baya Zidra NO debe desplazar a Hierba Blanca + A Bocajarro"), 'No desplaza sinergia principal')
})

// ============================================================================
// BLOQUE J: TEST ESPECIAL DE NO-MEZCLA (SOLAR BEAM ≠ GIGA DRAIN)
// ============================================================================
test('J1', 'Test Especial: Solar Beam tiene isChargeMove: true y Giga Drain tiene isChargeMove: false', () => {
  const sbSection = knowledgeCode.slice(knowledgeCode.indexOf("'solar-beam':"), knowledgeCode.indexOf("'giga-drain':"))
  const gdSection = knowledgeCode.slice(knowledgeCode.indexOf("'giga-drain':"), knowledgeCode.indexOf("CANONICAL_ITEM_KNOWLEDGE"))
  assert(sbSection.includes("isChargeMove: true"), 'Solar Beam debe ser charge move')
  assert(gdSection.includes("isChargeMove: false"), 'Giga Drain NO debe ser charge move')
})

test('J2', 'Test Especial: Giga Drain tiene healsFromDamagePercent y Solar Beam NO lo tiene', () => {
  const sbSection = knowledgeCode.slice(knowledgeCode.indexOf("'solar-beam':"), knowledgeCode.indexOf("'giga-drain':"))
  const gdSection = knowledgeCode.slice(knowledgeCode.indexOf("'giga-drain':"), knowledgeCode.indexOf("CANONICAL_ITEM_KNOWLEDGE"))
  assert(!sbSection.includes("healsFromDamagePercent"), 'Solar Beam NO debe tener healsFromDamagePercent')
  assert(gdSection.includes("healsFromDamagePercent: 50"), 'Giga Drain debe tener healsFromDamagePercent: 50')
})

test('J3', 'Test Especial: Prompt competitivo prohíbe explícitamente mezclar Solar Beam y Giga Drain', () => {
  assert(promptCode.includes("Rayo Solar (Solar Beam) vs Gigadrenado (Giga Drain): NUNCA los confundas ni mezcles sus propiedades"), 'Regla anti-mezcla en prompt')
  assert(promptCode.includes("Rayo Solar es un ataque de carga (2 turnos)"), 'Solar Beam explicado en prompt')
  assert(promptCode.includes("Gigadrenado se ejecuta de forma instantánea (1 turno) y recupera el 50%"), 'Giga Drain explicado en prompt')
})

// ============================================================================
// BLOQUE K: TEST ESPECIAL SNEASLER (WHITE HERB + CLOSE COMBAT)
// ============================================================================
test('K1', 'Prompt Builder: sección [MOVIMIENTOS VERIFICADOS] inyectada si hay relevantMoves', () => {
  assert(promptCode.includes("[MOVIMIENTOS VERIFICADOS (VERIFIED MOVES)]"), 'Bloque de movimientos verificados presente')
})

test('K2', 'Prompt Builder: sección [OBJETOS VERIFICADOS] inyectada si hay relevantItems', () => {
  assert(promptCode.includes("[OBJETOS VERIFICADOS (VERIFIED ITEMS)]"), 'Bloque de objetos verificados presente')
})

test('K3', 'Fact Validator: Hierba Blanca + A Bocajarro sigue garantizada en strategies[0]', () => {
  assert(validatorCode.includes("hierba blanca") && validatorCode.includes("close combat"), 'Garantía intacta')
  assert(validatorCode.includes("filtered.unshift"), 'Inyección en [0] conservada')
})

// ============================================================================
// BLOQUE L: FACT VALIDATOR (CORRECCIONES DE MOVIMIENTOS Y OBJETOS)
// ============================================================================
test('L1', 'Fact Validator: exporta MOVE_ITEM_CORRECTION_PATTERNS', () => {
  assert(validatorCode.includes("export const MOVE_ITEM_CORRECTION_PATTERNS"), 'Array de patrones exportado')
})

test('L2', 'Fact Validator: corrige afirmación de que Gigadrenado necesita carga', () => {
  assert(validatorCode.includes("Gigadrenado no requiere carga"), 'Regla de Gigadrenado presente')
  assert(validatorCode.includes("Giga Drain does not require a charge turn"), 'Regla en inglés presente')
})

test('L3', 'Fact Validator: corrige afirmación de que Rayo Solar siempre necesita carga', () => {
  assert(validatorCode.includes("Rayo Solar requiere un turno de carga salvo bajo clima de Sol"), 'Regla de Rayo Solar presente')
})

test('L4', 'Fact Validator: corrige afirmación de que Gigadrenado cura sin daño', () => {
  assert(validatorCode.includes("Gigadrenado recupera PS proporcionalmente al daño infligido"), 'Regla de curación proporcional presente')
})

test('L5', 'Fact Validator: corrige afirmación de que Hierba Blanca aumenta directamente la velocidad', () => {
  assert(validatorCode.includes("la Hierba Blanca restaura las defensas y se consume, siendo su pérdida lo que activa Liviano"), 'Regla de causalidad Hierba Blanca presente')
})

test('L6', 'Fact Validator: corrige afirmaciones falsas de Espacio Raro (desactiva Liviano / elimina velocidad)', () => {
  assert(validatorCode.includes("Espacio Raro no desactiva Liviano"), 'Regla Espacio Raro desactiva Liviano presente')
  assert(validatorCode.includes("Espacio Raro conserva la Velocidad duplicada"), 'Regla Espacio Raro conserva velocidad presente')
})

test('L7', 'Fact Validator: corrige afirmación de que Desarme impide Liviano', () => {
  assert(validatorCode.includes("Desarme no impide Liviano; al remover el objeto equipado, activa la duplicación"), 'Regla Desarme presente')
})

test('L8', 'Fact Validator: corrige afirmación de que Golpe Bajo supera en velocidad o siempre ataca primero', () => {
  assert(validatorCode.includes("Golpe Bajo actúa antes por su prioridad +1 (no por superar a Sneasler en Velocidad)"), 'Regla Golpe Bajo velocidad presente')
  assert(validatorCode.includes("Golpe Bajo puede actuar antes por su prioridad +1 siempre que el rival use un ataque"), 'Regla Golpe Bajo condicional presente')
})

// ============================================================================
// BLOQUE M: EJECUCIÓN DE SUITES DE REGRESIÓN
// ============================================================================
console.log('\n--- Ejecutando suites de regresión previas ---')

function runSuite(name, script) {
  try {
    execSync(`node ${path.join(ROOT, script)}`, { stdio: 'pipe' })
    passed++
    results.push(`✅ [PASS] Suite de regresión: ${name}`)
  } catch (err) {
    failed++
    results.push(`❌ [FAIL] Suite de regresión: ${name}\n   → Error al ejecutar ${script}:\n${err.stderr ? err.stderr.toString() : err.message}`)
  }
}

runSuite('Fase 1 (Progressive Analysis)', 'scripts/test-fase1-progressive-analysis.mjs')
runSuite('Fase 2 (Knowledge Layer)', 'scripts/test-fase2-knowledge-layer.mjs')
runSuite('Fase 3 (Competitive Contexts)', 'scripts/test-fase3-competitive-contexts.mjs')
runSuite('Competitive Precision (Microfase)', 'scripts/test-competitive-precision.mjs')
runSuite('Fase 2.3 (Competitive Interactions)', 'scripts/test-competitive-interactions.mjs')

console.log('\n' + results.join('\n'))
console.log('\n======================================================================')
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
} else {
  console.log('🎉 ¡Todos los tests de Movement Knowledge Layer pasaron exitosamente!')
}
