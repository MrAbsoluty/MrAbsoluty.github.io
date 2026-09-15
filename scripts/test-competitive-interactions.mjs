/**
 * test-competitive-interactions.mjs
 * Fase 2.3 — Precisión de interacciones competitivas para PokeGuide AI.
 *
 * Verifica estáticamente:
 *   A. Velocidad vs Prioridad — diferenciación explícita en prompt competitivo
 *   B. Golpe Bajo / Sucker Punch — condición de daño directo documentada
 *   C. Golpe Bajo + Liviano — prioridad independiente de Velocidad
 *   D. Espacio Raro / Trick Room — orden basado en Velocidad, NO desactivación
 *   E. Air Balloon / Globo Helio — no es activador universal
 *   F. Knock Off / Desarme — no impide Liviano
 *   G. Activación sin objeto — entrar sin objeto ≠ activar Liviano
 *   H. White Herb / Hierba Blanca — sigue siendo estrategia prioritaria
 *   I. No regresión — suites de fases anteriores siguen pasando
 *
 * IMPORTANTE: Estos tests validan Knowledge Layer, Prompt Builder y Fact Validator.
 * No validan respuestas concretas del modelo en runtime.
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

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8')
}

console.log('======================================================================')
console.log('🧪 POKEGUIDE AI — FASE 2.3: PRECISIÓN DE INTERACCIONES COMPETITIVAS')
console.log('======================================================================\n')

const knowledgeCode = readFile('supabase/functions/analyze-ability/knowledgeLayer.ts')
const promptCode    = readFile('supabase/functions/analyze-ability/promptBuilder.ts')
const validatorCode = readFile('supabase/functions/analyze-ability/factValidator.ts')

// ============================================================================
// CASO A — Velocidad vs Prioridad: diferenciación explícita en prompt
// ============================================================================

test('A1', 'Prompt competitive: Velocidad y prioridad descritos como sistemas independientes', () => {
  assert(
    promptCode.includes('Velocidad y prioridad de movimientos son sistemas completamente independientes'),
    'Falta declaración explícita de independencia Velocidad/Prioridad en el bloque competitive',
  )
})

test('A2', 'Prompt competitive: prohíbe afirmar que la Velocidad permite superar movimientos prioritarios', () => {
  assert(
    promptCode.includes('NUNCA afirmes que un aumento de Velocidad permite superar movimientos prioritarios'),
    'Falta regla contra confundir Velocidad con sistema de prioridad',
  )
})

test('A3', 'Prompt competitive: distingue la Velocidad (orden dentro del mismo nivel) de la prioridad (sistema diferente)', () => {
  assert(
    promptCode.includes('La Velocidad determina el orden entre acciones dentro del mismo nivel de prioridad'),
    'Falta definición mecánica de cómo actúa la Velocidad dentro de la prioridad',
  )
})

test('A4', 'Knowledge Layer: interfaces VerifiedCounterplayMechanism y VerifiedPriorityMechanic presentes', () => {
  assert(
    knowledgeCode.includes('VerifiedCounterplayMechanism'),
    'Falta interfaz VerifiedCounterplayMechanism en knowledgeLayer',
  )
  assert(
    knowledgeCode.includes('VerifiedPriorityMechanic'),
    'Falta interfaz VerifiedPriorityMechanic en knowledgeLayer',
  )
})

test('A5', 'Knowledge Layer: campos verifiedCounterplay y verifiedPriorityMechanics exportados por buildVerifiedAbilityFacts', () => {
  assert(
    knowledgeCode.includes('verifiedCounterplay: base.verifiedCounterplay || []'),
    'buildVerifiedAbilityFacts no expone verifiedCounterplay',
  )
  assert(
    knowledgeCode.includes('verifiedPriorityMechanics: base.verifiedPriorityMechanics || []'),
    'buildVerifiedAbilityFacts no expone verifiedPriorityMechanics',
  )
})

test('A6', 'Prompt Builder: bloque [COUNTERPLAY VERIFICADO] inyectado desde Knowledge Layer', () => {
  assert(
    promptCode.includes('[COUNTERPLAY VERIFICADO]'),
    'Falta bloque [COUNTERPLAY VERIFICADO] en buildVerifiedFactsSection',
  )
  assert(
    promptCode.includes('facts.verifiedCounterplay'),
    'buildVerifiedFactsSection no lee facts.verifiedCounterplay',
  )
})

test('A7', 'Prompt Builder: bloque [MECÁNICAS DE PRIORIDAD VERIFICADAS] inyectado desde Knowledge Layer', () => {
  assert(
    promptCode.includes('[MECÁNICAS DE PRIORIDAD VERIFICADAS]'),
    'Falta bloque de mecánicas de prioridad en buildVerifiedFactsSection',
  )
  assert(
    promptCode.includes('facts.verifiedPriorityMechanics'),
    'buildVerifiedFactsSection no lee facts.verifiedPriorityMechanics',
  )
})

// ============================================================================
// CASO B — Golpe Bajo / Sucker Punch: condición de daño directo documentada
// ============================================================================

test('B1', 'Knowledge Layer: Golpe Bajo registrado en verifiedPriorityMechanics con prioridad +1', () => {
  assert(
    knowledgeCode.includes('Golpe Bajo (Sucker Punch)'),
    'Falta Golpe Bajo en verifiedPriorityMechanics del Knowledge Layer',
  )
  assert(
    knowledgeCode.includes('priorityValue: 1'),
    'Golpe Bajo no tiene priorityValue: 1',
  )
})

test('B2', 'Knowledge Layer: condición de éxito de Golpe Bajo documentada (movimiento de daño directo)', () => {
  assert(
    knowledgeCode.includes('solo tiene éxito si el objetivo va a ejecutar ese mismo turno un movimiento que cause daño directo'),
    'Falta condición de éxito de Golpe Bajo (daño directo) en Knowledge Layer',
  )
})

test('B3', 'Knowledge Layer: falla si el objetivo usa movimiento de estado, cambia o no ataca', () => {
  assert(
    knowledgeCode.includes('falla') && knowledgeCode.includes('movimiento de estado'),
    'Falta documentación de casos de fallo de Golpe Bajo en Knowledge Layer',
  )
})

test('B4', 'Knowledge Layer: malentendido explícitamente documentado en commonMisconception', () => {
  assert(
    knowledgeCode.includes('commonMisconception'),
    'Falta campo commonMisconception en verifiedPriorityMechanics',
  )
  assert(
    knowledgeCode.includes('NO afirmar que Golpe Bajo') && knowledgeCode.includes('supera la Velocidad'),
    'commonMisconception no documenta el error de confundir Golpe Bajo con ventaja de Velocidad',
  )
})

test('B5', 'Prompt competitive: regla explícita que prohíbe "Golpe Bajo supera la Velocidad"', () => {
  assert(
    promptCode.includes('NUNCA afirmes que Golpe Bajo') && promptCode.includes('supera la Velocidad de Sneasler'),
    'Falta regla explícita en competitive contra describir Golpe Bajo como ventaja de Velocidad',
  )
})

test('B6', 'Fact Validator: patrón UNBURDEN_COUNTERPLAY_PATTERNS presente', () => {
  assert(
    validatorCode.includes('UNBURDEN_COUNTERPLAY_PATTERNS'),
    'Falta UNBURDEN_COUNTERPLAY_PATTERNS en factValidator',
  )
})

test('B7', 'Fact Validator: patrón para detectar "Golpe Bajo supera velocidad" presente', () => {
  assert(
    validatorCode.includes('golpe\\s+bajo\\s+(?:supera|es\\s+m[aá]s\\s+r[aá]pido'),
    'Falta regex de corrección "Golpe Bajo supera velocidad" en UNBURDEN_COUNTERPLAY_PATTERNS',
  )
})

test('B8', 'Fact Validator: UNBURDEN_COUNTERPLAY_PATTERNS aplicado en correctText cuando facts.name === unburden', () => {
  assert(
    validatorCode.includes("facts.name === 'unburden'") &&
    validatorCode.includes('for (const rule of UNBURDEN_COUNTERPLAY_PATTERNS)'),
    'UNBURDEN_COUNTERPLAY_PATTERNS declarado pero no iterado en correctText cuando facts.name === unburden',
  )
})

// ============================================================================
// CASO C — Golpe Bajo + Liviano: prioridad actúa antes independiente de Velocidad
// ============================================================================

test('C1', 'Knowledge Layer: counterplay Golpe Bajo explica que actúa por prioridad, no Velocidad', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Opera mediante el sistema de prioridad, independiente del valor de Velocidad del objetivo'),
    'Knowledge Layer no documenta que Golpe Bajo opera por prioridad (independiente de Velocidad)',
  )
})

test('C2', 'Knowledge Layer: counterplay Golpe Bajo documenta consecuencia contra Sneasler con Liviano', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Puede actuar antes que Sneasler aunque su Velocidad esté duplicada por Liviano'),
    'Falta consecuencia explícita de Golpe Bajo contra Sneasler con Liviano en Knowledge Layer',
  )
})

test('C3', 'Prompt competitive: estructura causal Golpe Bajo → prioridad → antes que Sneasler documentada', () => {
  assert(
    promptCode.includes('Golpe Bajo / Sucker Punch: prioridad +1 → actúa antes que movimientos de prioridad 0'),
    'Falta estructura causal de Golpe Bajo en el bloque competitive del prompt',
  )
})

test('C4', 'Fact Validator: corrige "Golpe Bajo siempre golpea primero" a frase condicional', () => {
  assert(
    validatorCode.includes('golpe\\s+bajo\\s+siempre\\s+golpea\\s+primero'),
    'Falta patrón para "Golpe Bajo siempre golpea primero" en UNBURDEN_COUNTERPLAY_PATTERNS',
  )
})

// ============================================================================
// CASO D — Espacio Raro / Trick Room: orden basado en Velocidad, NO desactivación
// ============================================================================

test('D1', 'Knowledge Layer: Espacio Raro documentado en verifiedCounterplay con consecuencia correcta', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Espacio Raro (Trick Room)'),
    'Falta Espacio Raro en verifiedCounterplay de Liviano',
  )
  assert(
    unburdenSection.includes('Altera el orden en que actúan los Pokémon según sus valores de Velocidad'),
    'Knowledge Layer no documenta correctamente la mecánica de Trick Room',
  )
})

test('D2', 'Knowledge Layer: Espacio Raro NO desactiva ni anula Liviano (constraint explícita)', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Espacio Raro NO desactiva ni anula Liviano'),
    'Falta constraint explícita de que Trick Room no desactiva Liviano',
  )
})

test('D3', 'Prompt competitive: Trick Room descrito como inversión del orden, NO reducción de Velocidad', () => {
  assert(
    promptCode.includes('Trick Room altera el orden en que actúan los Pokémon según sus valores de Velocidad'),
    'Prompt competitive no describe Trick Room como inversión del orden',
  )
  assert(
    promptCode.includes('NO lo describas como') && (promptCode.includes('desactiva Liviano') || promptCode.includes('anula la habilidad')),
    'Prompt competitive no prohíbe describir Trick Room como desactivación de Liviano',
  )
})

test('D4', 'Prompt competitive: Trick Room no afecta la prioridad de movimientos (regla separada)', () => {
  assert(
    promptCode.includes('Espacio Raro NO afecta el sistema de prioridad de movimientos'),
    'Falta regla explícita de que Trick Room no afecta el sistema de prioridad',
  )
})

test('D5', 'Fact Validator: corrige "Trick Room desactiva Liviano" a descripción de inversión de orden', () => {
  assert(
    validatorCode.includes('espacio\\s+raro|trick\\s+room') &&
    validatorCode.includes('desactiva|anula|cancela|elimina|bloquea|impide'),
    'Falta patrón para "Trick Room desactiva Liviano" en UNBURDEN_COUNTERPLAY_PATTERNS',
  )
})

test('D6', 'Fact Validator: corrige "Trick Room reduce la Velocidad" a descripción correcta', () => {
  assert(
    validatorCode.includes('trick\\s+room\\s+(?:reduces?|lowers?)\\s+speed') ||
    validatorCode.includes('espacio\\s+raro.*reduce.*velocidad'),
    'Falta patrón para "Trick Room reduce Velocidad" en UNBURDEN_COUNTERPLAY_PATTERNS',
  )
})

// ============================================================================
// CASO E — Air Balloon / Globo Helio: no es activador universal
// ============================================================================

test('E1', 'Knowledge Layer: Globo Helio en verifiedActivations con isConsumption: false', () => {
  assert(
    knowledgeCode.includes('Pérdida de Globo Helio') && knowledgeCode.includes('isConsumption: false'),
    'Globo Helio no está en verifiedActivations con isConsumption: false',
  )
})

test('E2', 'Knowledge Layer: constraint de Globo Helio no afirma activación universal', () => {
  const activationSection = knowledgeCode.slice(
    knowledgeCode.indexOf('Pérdida de Globo Helio'),
    knowledgeCode.indexOf('Pérdida de Globo Helio') + 400,
  )
  assert(
    activationSection.includes('se PIERDE (estalla), NO se consume'),
    'Constraint de Globo Helio no documenta que se pierde, no se consume',
  )
})

test('E3', 'Knowledge Layer: verifiedCounterplay o verifiedActivations de Globo Helio expresa condición de pérdida (no universal)', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Globo Helio') &&
    (unburdenSection.includes('se PIERDE (estalla), NO se consume') || unburdenSection.includes('pérdida del objeto activa Liviano')),
    'Knowledge Layer no documenta condición condicional del Globo Helio en counterplay',
  )
})

test('E4', 'Fact Validator: corrige "Globo Helio siempre activa Liviano" a frase condicional', () => {
  assert(
    validatorCode.includes('globo\\s+helio\\s+(?:siempre|garantiza)\\s+(?:activa|activar|activaci'),
    'Falta patrón para "Globo Helio siempre activa Liviano" en UNBURDEN_COUNTERPLAY_PATTERNS',
  )
})

test('E5', 'prohibitedClaims: "globo helio se consume" y "el globo helio se consume" prohibidos', () => {
  assert(
    knowledgeCode.includes('globo helio se consume') && knowledgeCode.includes('el globo helio se consume'),
    'Falta "globo helio se consume" en prohibitedClaims de Liviano',
  )
})

// ============================================================================
// CASO F — Knock Off / Desarme: no impide Liviano, puede activarlo antes
// ============================================================================

test('F1', 'Knowledge Layer: Desarme en verifiedCounterplay con consecuencia de activación adelantada', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Desarme (Knock Off)'),
    'Falta Desarme en verifiedCounterplay de Liviano',
  )
  assert(
    unburdenSection.includes('puede provocar la pérdida del objeto antes del turno previsto'),
    'Knowledge Layer no documenta que Desarme puede activar Liviano prematuramente',
  )
})

test('F2', 'Knowledge Layer: Desarme NO impide Liviano (constraint explícita)', () => {
  const unburdenStart = knowledgeCode.indexOf('unburden:')
  const gutsStart = knowledgeCode.indexOf('guts:', unburdenStart)
  const unburdenSection = knowledgeCode.slice(unburdenStart, gutsStart)
  assert(
    unburdenSection.includes('Desarme NO impide ni bloquea Liviano'),
    'Falta constraint explícita de que Desarme no impide Liviano',
  )
})

test('F3', 'Prompt competitive: Desarme descrito como activación adelantada, no bloqueo', () => {
  assert(
    promptCode.includes('Desarme / Knock Off') &&
    promptCode.includes('puede activar Liviano prematuramente'),
    'Prompt competitive no describe Desarme como activación adelantada',
  )
  assert(
    promptCode.includes('NO impide Liviano') || promptCode.includes('NO afirmar que Desarme impide'),
    'Prompt competitive no prohíbe describir Desarme como bloqueo de Liviano',
  )
})

test('F4', 'Fact Validator: corrige "Desarme impide Liviano" a frase sobre activación adelantada', () => {
  assert(
    validatorCode.includes('desarme\\s+(?:impide|bloquea|evita|cancela|anula)\\s+(?:liviano|unburden)'),
    'Falta patrón para "Desarme impide Liviano" en UNBURDEN_COUNTERPLAY_PATTERNS',
  )
})

// ============================================================================
// CASO G — Activación sin objeto: entrar sin objeto ≠ activar Liviano
// ============================================================================

test('G1', 'Knowledge Layer: condición "Entrar sin objeto NO activa Liviano" presente', () => {
  assert(
    knowledgeCode.includes('Entrar al combate sin objeto NO activa la habilidad por sí solo'),
    'Condición de no-activación al entrar sin objeto ausente en Knowledge Layer',
  )
})

test('G2', 'prohibitedClaims: frases de activación al entrar sin objeto prohibidas', () => {
  assert(
    knowledgeCode.includes('se activa si entra sin objeto') &&
    knowledgeCode.includes('se activa al entrar sin objeto'),
    'Faltan frases de activación-sin-objeto en prohibitedClaims',
  )
})

test('G3', 'Fact Validator: UNBURDEN_CORRECTION_PATTERNS corrige "se activa al entrar sin objeto"', () => {
  assert(
    validatorCode.includes('se\\s+activa\\s+(?:al|simplemente\\s+por)\\s+entrar\\s+sin\\s+objeto'),
    'Falta patrón de corrección para activación al entrar sin objeto',
  )
})

test('G4', 'Knowledge Layer: caso de entrar sin objeto y obtener uno después está documentado', () => {
  assert(
    knowledgeCode.includes('Si el Pokémon entra sin objeto y obtiene uno durante el combate, perderlo o consumirlo puede activar Liviano'),
    'Falta documentación del caso obtención de objeto durante combate',
  )
})

// ============================================================================
// CASO H — Hierba Blanca + A Bocajarro: sigue siendo estrategia prioritaria
// ============================================================================

test('H1', 'Knowledge Layer: Hierba Blanca + A Bocajarro con priority: 1 y featured: true intactos', () => {
  assert(knowledgeCode.includes('priority: 1'), 'priority: 1 ausente')
  assert(knowledgeCode.includes('featured: true'), 'featured: true ausente')
  assert(
    knowledgeCode.includes('applicablePokemon: [\'Sneasler\''),
    'Sneasler no está en applicablePokemon',
  )
})

test('H2', 'Prompt competitive: Hierba Blanca + A Bocajarro nombrada como sinergia prioritaria', () => {
  assert(
    promptCode.includes('Hierba Blanca + A Bocajarro') &&
    promptCode.includes('estrategia prioritaria destacada sigue siendo Hierba Blanca + A Bocajarro'),
    'Prompt competitive no nombra Hierba Blanca + A Bocajarro como sinergia prioritaria',
  )
})

test('H3', 'Fact Validator: garantía de strategies[0] para Hierba Blanca + A Bocajarro intacta', () => {
  assert(
    validatorCode.includes('hierba blanca') && validatorCode.includes('a bocajarro'),
    'Matcher de Hierba Blanca + A Bocajarro ausente en factValidator',
  )
  assert(
    validatorCode.includes('filtered.unshift'),
    'Garantía de strategies[0] (unshift) ausente en factValidator',
  )
})

test('H4', 'Fact Validator: bayas y Globo Helio siguen moviéndose a alternatives', () => {
  assert(
    validatorCode.includes('isGenericActivation'),
    'Función isGenericActivation ausente en factValidator',
  )
  assert(
    validatorCode.includes("name.includes('baya')") && validatorCode.includes("name.includes('globo helio')"),
    'isGenericActivation no detecta bayas y Globo Helio',
  )
})

test('H5', 'Prompt factuales: regla 13 de prioridad de sinergia destacada conservada', () => {
  assert(
    promptCode.includes('PRIORIDAD DE SINERGIA DESTACADA'),
    'Regla 13 de prioridad de sinergia ausente en buildVerifiedFactsSection',
  )
  assert(
    promptCode.includes("'Hierba Blanca + A Bocajarro' DEBE aparecer como la primera estrategia destacada"),
    'Instrucción de strategies[0] ausente en buildVerifiedFactsSection',
  )
})

// ============================================================================
// CASO I — No regresión: reglas de Fases anteriores intactas
// ============================================================================

test('I1', 'Regresión Fase 2: Liviano activa al perder/consumir objeto (no al entrar sin objeto)', () => {
  assert(
    knowledgeCode.includes('Duplica la estadística de Velocidad del Pokémon cuando este pierde o consume'),
    'officialEffect de Liviano alterado',
  )
})

test('I2', 'Regresión Fase 2: duración "mientras permanezca sin objeto" sigue en verifiedConditions', () => {
  assert(
    knowledgeCode.includes('Mientras el Pokémon permanezca sin objeto, conserva la duplicación de Velocidad'),
    'Condición de duración ausente en verifiedConditions',
  )
})

test('I3', 'Regresión Fase 2.2: gap fix idx === -1 sin guarda de length === 0', () => {
  assert(
    !validatorCode.includes('idx === -1 && filtered.length === 0'),
    'El gap de inyección sigue presente (condición con filtered.length === 0)',
  )
  assert(
    validatorCode.includes('else if (idx === -1)'),
    'Condición corregida idx === -1 ausente',
  )
})

test('I4', 'Regresión: UNBURDEN_CORRECTION_PATTERNS siguen presentes', () => {
  assert(
    validatorCode.includes('UNBURDEN_CORRECTION_PATTERNS'),
    'UNBURDEN_CORRECTION_PATTERNS ausente',
  )
})

test('I5', 'Regresión: prohibitedClaims de "para el resto del combate" y "velocidad extrema" intactos', () => {
  assert(
    knowledgeCode.includes('para el resto del combate'),
    '"para el resto del combate" ausente en prohibitedClaims',
  )
  assert(
    knowledgeCode.includes('velocidad extrema'),
    '"velocidad extrema" ausente en prohibitedClaims',
  )
})

test('I6', 'Regresión: deterministicRating score 8 "Muy buena" para Liviano intacto', () => {
  const unburdenSection = knowledgeCode.slice(
    knowledgeCode.indexOf('unburden:'),
    knowledgeCode.indexOf('guts:'),
  )
  assert(unburdenSection.includes('score: 8'), 'score: 8 alterado')
  assert(unburdenSection.includes("label: 'Muy buena'"), '"Muy buena" ausente')
})

test('I7', 'Regresión: buildVerifiedAbilityFacts exporta verifiedSynergies y verifiedConditions', () => {
  assert(
    knowledgeCode.includes('verifiedSynergies: base.verifiedSynergies || []'),
    'verifiedSynergies no expuesto en buildVerifiedAbilityFacts',
  )
  assert(
    knowledgeCode.includes('verifiedConditions: base.verifiedConditions || []'),
    'verifiedConditions no expuesto en buildVerifiedAbilityFacts',
  )
})

test('I8', 'Regresión: niveles Beginner, Intermediate y Advanced NO modificados', () => {
  assert(
    promptCode.includes('DIRECTRICES DIDÁCTICAS PARA NIVEL PRINCIPIANTE'),
    'Bloque beginner alterado',
  )
  assert(
    promptCode.includes('DIRECTRICES TÁCTICAS PARA NIVEL INTERMEDIO'),
    'Bloque intermediate alterado',
  )
  assert(
    promptCode.includes('DIRECTRICES ESTRATÉGICAS PARA NIVEL AVANZADO'),
    'Bloque advanced alterado',
  )
  assert(
    promptCode.includes('DIRECTRICES DE ÉLITE Y PRECISIÓN PARA NIVEL COMPETITIVO'),
    'Bloque competitive alterado o ausente',
  )
})

test('I9', 'Regresión: ejemplo beginner con "superar a muchos rivales que antes podían ser más rápidos" intacto', () => {
  assert(
    promptCode.includes('superar a muchos rivales que antes podían ser más rápidos'),
    'Ejemplo de beginner con formulación accesible ausente',
  )
})

test('I10', 'Regresión: prompt competitive NO contiene el ejemplo antiguo "benchmarks relevantes"', () => {
  const competitiveSection = promptCode.slice(
    promptCode.indexOf("userLevel === 'competitive'"),
    promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"),
  )
  assert(
    !competitiveSection.includes('benchmarks relevantes'),
    'El ejemplo antiguo con "benchmarks relevantes" aún presente en el bloque competitive',
  )
})

test('I11', 'Regresión: ejemplo de precisión Fase 2.3 presente en competitive (sin flechas)', () => {
  assert(
    promptCode.includes('EJEMPLO DE PRECISIÓN MECÁNICA (Fase 2.3)'),
    'Falta ejemplo de precisión mecánica de Fase 2.3 en competitive',
  )
  const exampleSection = promptCode.slice(
    promptCode.indexOf('EJEMPLO DE PRECISIÓN MECÁNICA'),
    promptCode.indexOf('EJEMPLO DE PRECISIÓN MECÁNICA') + 500,
  )
  assert(
    !exampleSection.includes('→') && !exampleSection.includes('↓'),
    'Ejemplo de precisión contiene flechas (prohibidas)',
  )
})

// ============================================================================
// SUITE DE NO REGRESIÓN: ejecutar las suites de fases anteriores
// ============================================================================

console.log('\n--- Ejecutando suites de regresión ---\n')

const suites = [
  { label: 'Fase 1 (Progressive Analysis)', script: 'test-fase1-progressive-analysis.mjs' },
  { label: 'Fase 2 (Knowledge Layer)', script: 'test-fase2-knowledge-layer.mjs' },
  { label: 'Fase 3 (Competitive Contexts)', script: 'test-fase3-competitive-contexts.mjs' },
  { label: 'Competitive Precision (Microfase)', script: 'test-competitive-precision.mjs' },
]

for (const suite of suites) {
  const scriptPath = path.join(__dirname, suite.script)
  if (!fs.existsSync(scriptPath)) {
    results.push(`⚠️  [SKIP] Suite "${suite.label}" no encontrada en scripts/`)
    continue
  }
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'pipe', cwd: ROOT })
    passed++
    results.push(`✅ [PASS] Suite de regresión: ${suite.label}`)
  } catch (err) {
    failed++
    const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '')
    const failLines = output.split('\n').filter((l) => l.includes('[FAIL]')).slice(0, 5)
    results.push(
      `❌ [FAIL] Suite de regresión: ${suite.label}\n` +
      failLines.map((l) => `   ${l.trim()}`).join('\n'),
    )
  }
}

// ============================================================================
// RESULTADOS
// ============================================================================

console.log('')
results.forEach((r) => console.log(r))
console.log('')
console.log('======================================================================')
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
}
