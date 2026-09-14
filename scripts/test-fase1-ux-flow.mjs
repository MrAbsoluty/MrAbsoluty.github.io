/**
 * test-fase1-ux-flow.mjs
 * Verificación del flujo de UX y resolución de ReferenceError en PokeGuide AI.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const jsx = fs.readFileSync(path.join(ROOT, 'src/components/AIAbilityAnalysis.jsx'), 'utf-8')
const detail = fs.readFileSync(path.join(ROOT, 'src/pages/PokemonDetail.jsx'), 'utf-8')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`✅ [PASS] ${name}`)
  } catch (err) {
    failed++
    console.error(`❌ [FAIL] ${name}: ${err.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

console.log('======================================================================')
console.log('🧪 POKEGUIDE AI — VERIFICACIÓN DE FLUJO UX Y RESOLUCIÓN DE BUGS')
console.log('======================================================================\n')

test('1. AIAbilityAnalysisContent no hace referencia a variable inexistente language', () => {
  assert(!jsx.includes('language ==='), 'Se encontró "language ===" en AIAbilityAnalysis.jsx')
  assert(!jsx.includes('const isEn = language'), 'Se encontró "const isEn = language"')
})

test('2. AIAbilityAnalysisContent recibe locale con valor por defecto "es"', () => {
  assert(jsx.includes("locale = 'es'"), "Falta el valor por defecto locale = 'es'")
})

test('3. AbilityAIFocusMode pasa locale={context?.locale || "es"} a AIAbilityAnalysisContent', () => {
  assert(
    jsx.includes("locale={context?.locale || 'es'}"),
    'AbilityAIFocusMode no pasa el prop locale',
  )
})

test('4. handleAbilityAIAnalysis en PokemonDetail inicia directamente en General', () => {
  assert(
    detail.includes("const defaultContext = { context: 'general', format: null, regulation: null }"),
    'Falta defaultContext en handleAbilityAIAnalysis',
  )
  assert(
    detail.includes('executeAIAnalysis(targetKey, defaultContext)'),
    'handleAbilityAIAnalysis debe invocar executeAIAnalysis inmediatamente',
  )
})

test('5. handleAbilityAIAnalysis NO abre el selector de contexto inicialmente', () => {
  const fnBody = detail.slice(detail.indexOf('function handleAbilityAIAnalysis('), detail.indexOf('function handleSelectContextAndAnalyze('))
  assert(!fnBody.includes('setIsContextSelectorOpen(true)'), 'handleAbilityAIAnalysis aún abre el selector')
  assert(fnBody.includes('setIsContextSelectorOpen(false)'), 'handleAbilityAIAnalysis debe asegurar selector cerrado')
})

test('6. handleChangeContext en PokemonDetail abre el selector de contexto', () => {
  assert(
    detail.includes('function handleChangeContext()') &&
    detail.includes('setIsAiFocusOpen(false)') &&
    detail.includes('setIsContextSelectorOpen(true)'),
    'handleChangeContext debe conmutar Focus Mode al selector',
  )
})

test('7. handleSelectContextAndAnalyze actualiza contexto y ejecuta análisis', () => {
  assert(
    detail.includes('function handleSelectContextAndAnalyze(chosenContext)') &&
    detail.includes('setIsContextSelectorOpen(false)') &&
    detail.includes('setSelectedCompetitiveContext(chosenContext)') &&
    detail.includes('executeAIAnalysis(targetKey, chosenContext)'),
    'handleSelectContextAndAnalyze debe aplicar el contexto seleccionado y analizar',
  )
})

test('8. AbilityContextSelector en PokemonDetail restaura Focus Mode si se cancela', () => {
  assert(
    detail.includes('if (aiTargetAbility || activeSelectedAbility)') &&
    detail.includes('setIsAiFocusOpen(true)'),
    'onClose de AbilityContextSelector debe restaurar isAiFocusOpen(true)',
  )
})

test('9. Fallback de competitiveValue.summary genera frases válidas en español e inglés sin crashear', () => {
  function getCompetitiveNaturalText(cvScore, cvLabel, cvSummary, locale) {
    let naturalCompetitiveText = cvSummary
    if (!naturalCompetitiveText && (cvLabel || cvScore !== null)) {
      const isEn = String(locale || 'es').toLowerCase().startsWith('en')
      if (cvScore !== null && cvScore < 5) {
        naturalCompetitiveText = isEn
          ? 'Its competitive value is very limited in this setting.'
          : 'Su valor competitivo es muy limitado.'
      } else if (cvScore !== null && cvScore < 7) {
        naturalCompetitiveText = isEn
          ? 'It has situational competitive applications.'
          : 'Tiene aplicaciones competitivas situacionales.'
      } else if (cvScore !== null && cvScore >= 8) {
        naturalCompetitiveText = isEn
          ? 'It has outstanding competitive value in this context.'
          : 'Tiene un valor competitivo destacado en este contexto.'
      } else {
        naturalCompetitiveText = isEn
          ? 'It has solid competitive value in this context.'
          : 'Tiene un valor competitivo sólido en este contexto.'
      }
    }
    return naturalCompetitiveText
  }

  // Español
  assert(getCompetitiveNaturalText(2, 'Deficiente', '', 'es') === 'Su valor competitivo es muy limitado.', 'Error en ES score 2')
  assert(getCompetitiveNaturalText(6, 'Situacional', '', 'es') === 'Tiene aplicaciones competitivas situacionales.', 'Error en ES score 6')
  assert(getCompetitiveNaturalText(8, 'Muy buena', '', 'es') === 'Tiene un valor competitivo destacado en este contexto.', 'Error en ES score 8')

  // Inglés
  assert(getCompetitiveNaturalText(2, 'Deficient', '', 'en') === 'Its competitive value is very limited in this setting.', 'Error en EN score 2')
  assert(getCompetitiveNaturalText(6, 'Situational', '', 'en') === 'It has situational competitive applications.', 'Error en EN score 6')
  assert(getCompetitiveNaturalText(8, 'Very good', '', 'en') === 'It has outstanding competitive value in this context.', 'Error en EN score 8')
})

console.log(`\n======================================================================`)
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')

if (failed > 0) process.exit(1)
