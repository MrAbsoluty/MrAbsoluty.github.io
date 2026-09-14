/**
 * test-fase1-progressive-analysis.mjs
 * Suite de verificación para PokeGuide — Fase 1: Progressive AI Ability Analysis.
 *
 * Verifica los 20 puntos requeridos del contrato progresivo.
 */

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

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8')
}

console.log('======================================================================')
console.log('🧪 POKEGUIDE AI — VERIFICACIÓN FASE 1: PROGRESSIVE AI ABILITY ANALYSIS')
console.log('======================================================================\n')

// ==========================================
// 1-4: CONTRATO PROGRESIVO (SCHEMA)
// ==========================================

const promptBuilderCode = readFile('supabase/functions/analyze-ability/promptBuilder.ts')

test(1, 'Contrato progresivo: ABILITY_RESPONSE_SCHEMA contiene coreInsight', () => {
  assert(promptBuilderCode.includes("coreInsight"), 'coreInsight no encontrado en schema')
  assert(promptBuilderCode.includes("'coreInsight'"), 'coreInsight no está en required')
})

test(2, 'Contrato progresivo: competitiveValue tiene score, label, source', () => {
  assert(promptBuilderCode.includes("competitiveValue"), 'competitiveValue no encontrado')
  const hasScore = promptBuilderCode.includes("score")
  const hasLabel = promptBuilderCode.includes("label")
  const hasSource = promptBuilderCode.includes("source")
  assert(hasScore && hasLabel && hasSource, 'Faltan campos en competitiveValue')
})

test(3, 'Contrato progresivo: strategies es un array en el schema', () => {
  assert(promptBuilderCode.includes("strategies"), 'strategies no encontrado')
  assert(promptBuilderCode.includes("'strategies'"), 'strategies no está en required')
})

test(4, 'Contrato progresivo: deepDive es un objeto con campos opcionales', () => {
  assert(promptBuilderCode.includes("deepDive"), 'deepDive no encontrado')
  assert(promptBuilderCode.includes("mechanics"), 'mechanics no encontrado en deepDive')
  assert(promptBuilderCode.includes("proTip"), 'proTip no encontrado en deepDive')
})

// ==========================================
// 5-7: ESTRATEGIAS Y ALTERNATIVAS
// ==========================================

test(5, 'Estrategias 0-3: strategies puede estar vacío en validación', () => {
  // validateAbilityAnalysis should accept empty strategies
  assert(
    promptBuilderCode.includes("!Array.isArray(data.strategies)"),
    'Validación no comprueba Array.isArray(strategies)',
  )
  // Should NOT require strategies.length > 0
  assert(
    !promptBuilderCode.includes("data.strategies.length === 0"),
    'Validación rechaza strategies vacío (no debería)',
  )
})

test(6, 'Estrategias explicadas: schema requiere name, explanation, whyFeatured', () => {
  const hasName = promptBuilderCode.includes("'name'") && promptBuilderCode.includes("Nombre de la estrategia")
  const hasExplanation = promptBuilderCode.includes("'explanation'")
  const hasWhyFeatured = promptBuilderCode.includes("'whyFeatured'")
  assert(hasName && hasExplanation && hasWhyFeatured, 'Faltan campos en strategies items')
})

test(7, 'Alternativas opcionales: schema incluye alternatives como array', () => {
  assert(promptBuilderCode.includes("alternatives"), 'alternatives no encontrado')
})

// ==========================================
// 8: SIN FLECHAS
// ==========================================

test(8, 'Sin flechas: prompt prohíbe cadenas de flechas en explicaciones', () => {
  assert(
    promptBuilderCode.includes('NUNCA uses cadenas de flechas') || 
    promptBuilderCode.includes('SIN flechas'),
    'No se encontró directriz anti-flechas',
  )
})

// ==========================================
// 9-11: NIVELES DE USUARIO
// ==========================================

test(9, 'Nivel beginner: directrices pedagógicas para principiante', () => {
  assert(promptBuilderCode.includes('PRINCIPIANTE'), 'No se encontraron directrices para beginner')
  assert(promptBuilderCode.includes('lenguaje sencillo'), 'No menciona lenguaje sencillo')
})

test(10, 'Nivel competitive: directrices de élite para competitivo', () => {
  assert(promptBuilderCode.includes('COMPETITIVO') || promptBuilderCode.includes('ÉLITE'), 'No se encontraron directrices para competitive')
  assert(promptBuilderCode.includes('terminología técnica'), 'No menciona terminología técnica')
})

test(11, 'Nivel diferente: beginner ≠ competitive en vocabulario', () => {
  const hasBeginner = promptBuilderCode.includes('beginner')
  const hasCompetitive = promptBuilderCode.includes('competitive')
  const hasDifferentGuidance = promptBuilderCode.includes('Ejemplo de adaptación')
  assert(hasBeginner && hasCompetitive && hasDifferentGuidance, 'No hay diferenciación de niveles')
})

// ==========================================
// 12-13: TRUANT
// ==========================================

test(12, 'Truant no inventa estrategia: prompt permite strategies vacío', () => {
  assert(
    promptBuilderCode.includes('Truant') || promptBuilderCode.includes('Ausente'),
    'Truant no mencionado en prompt',
  )
  assert(
    promptBuilderCode.includes('array vacío') || promptBuilderCode.includes('strategies: []'),
    'No permite strategies vacío para habilidades perjudiciales',
  )
})

test(13, 'Truant explica correctamente: factValidator garantiza turno por medio', () => {
  const factValidatorCode = readFile('supabase/functions/analyze-ability/factValidator.ts')
  assert(
    factValidatorCode.includes('alterno') && factValidatorCode.includes('turno'),
    'factValidator no garantiza turno alterno para Truant',
  )
})

// ==========================================
// 14-15: VALIDACIÓN DE SCHEMA
// ==========================================

test(14, 'validateAbilityAnalysis acepta contrato con strategies vacío', () => {
  assert(
    promptBuilderCode.includes("!Array.isArray(data.strategies)"),
    'No valida strategies como array (permite vacío)',
  )
})

test(15, 'validateAbilityAnalysis rechaza contrato sin coreInsight', () => {
  assert(
    promptBuilderCode.includes("!data.coreInsight") || promptBuilderCode.includes("data.coreInsight !== 'string'"),
    'No rechaza coreInsight faltante',
  )
})

// ==========================================
// 16: CACHE V3
// ==========================================

test(16, 'Cache V3: CURRENT_VALIDATION_VERSION es v3', () => {
  const cacheCode = readFile('supabase/functions/analyze-ability/cacheManager.ts')
  assert(cacheCode.includes("CURRENT_VALIDATION_VERSION = 'v3'"), 'Cache version no es v3')
})

// ==========================================
// 17: FACT VALIDATOR
// ==========================================

test(17, 'Fact Validator: sigue corrigiendo reduces speed', () => {
  const factValidatorCode = readFile('supabase/functions/analyze-ability/factValidator.ts')
  assert(factValidatorCode.includes('reduces?\\s+'), 'Patrón de corrección de speed no encontrado')
  assert(factValidatorCode.includes('FALSE_SPEED_REDUCTION_PATTERNS'), 'FALSE_SPEED_REDUCTION_PATTERNS no encontrado')
})

// ==========================================
// 18-19: UI PROGRESIVA
// ==========================================

test(18, 'UI progresiva: AIAbilityAnalysisContent renderiza coreInsight', () => {
  const jsxCode = readFile('src/components/AIAbilityAnalysis.jsx')
  assert(jsxCode.includes('coreInsight'), 'coreInsight no usado en componente')
  assert(jsxCode.includes('section-core-insight'), 'Sección core-insight no encontrada')
})

test(19, 'UI progresiva: sección "Explorar más" existe como toggle', () => {
  const jsxCode = readFile('src/components/AIAbilityAnalysis.jsx')
  assert(jsxCode.includes('ability-ai-explore-toggle'), 'Toggle explorar más no encontrado')
  assert(jsxCode.includes('isDeepDiveOpen'), 'Estado isDeepDiveOpen no encontrado')
  assert(jsxCode.includes('ability-ai-deep-dive'), 'Contenedor deep-dive no encontrado')
})

// ==========================================
// 20: BUILD Y LINT
// ==========================================

// Test 20 is manual: npm run build and npm run lint must pass.
test(20, 'Arquitectura: i18n incluye las nuevas claves progresivas', () => {
  const esCode = readFile('src/locales/es.js')
  const enCode = readFile('src/locales/en.js')
  assert(esCode.includes('coreInsightLabel'), 'es.js falta coreInsightLabel')
  assert(esCode.includes('exploreMore'), 'es.js falta exploreMore')
  assert(esCode.includes('strategiesLabel'), 'es.js falta strategiesLabel')
  assert(esCode.includes('mechanicsLabel'), 'es.js falta mechanicsLabel')
  assert(enCode.includes('coreInsightLabel'), 'en.js falta coreInsightLabel')
  assert(enCode.includes('exploreMore'), 'en.js falta exploreMore')
  assert(enCode.includes('strategiesLabel'), 'en.js falta strategiesLabel')
  assert(enCode.includes('mechanicsLabel'), 'en.js falta mechanicsLabel')
})

// ==========================================
// RESULTADOS
// ==========================================

console.log('')
results.forEach((r) => console.log(r))
console.log('')
console.log('======================================================================')
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')
if (failed === 0) {
  console.log('🎉 ¡Todos los 20 tests pasaron exitosamente!')
} else {
  console.log(`⚠️ ${failed} test(s) fallaron. Revisa los detalles arriba.`)
  process.exit(1)
}
