import { readFileSync } from 'fs'
import { join } from 'path'

console.log('======================================================================')
console.log('🧪 POKEGUIDE AI — FASE 3: INTEGRACIÓN REAL DE ANÁLISIS EN HABILIDADES')
console.log('======================================================================\n')

let passed = 0
let failed = 0

function test(description, fn) {
  try {
    fn()
    console.log(`✅ [PASS] ${description}`)
    passed++
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`)
    console.error(`   Error: ${err.message}`)
    failed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

const esContent = readFileSync(join(process.cwd(), 'src/locales/es.js'), 'utf-8')
const enContent = readFileSync(join(process.cwd(), 'src/locales/en.js'), 'utf-8')
const detailContent = readFileSync(join(process.cwd(), 'src/pages/PokemonDetail.jsx'), 'utf-8')
const aiCompContent = readFileSync(join(process.cwd(), 'src/components/AIAbilityAnalysis.jsx'), 'utf-8')
const cssContent = readFileSync(join(process.cwd(), 'src/styles/ai-ability-analysis.css'), 'utf-8')

// 1. i18n
test('1. i18n: es.js incluye analyzeButton, analyzing, hide, viewAnalysisButton', () => {
  assert(esContent.includes("analyzeButton: 'Analizar con IA'"), 'Falta analyzeButton en es.js')
  assert(esContent.includes("analyzing: 'Analizando habilidad...'"), 'Falta analyzing en es.js')
  assert(esContent.includes("hide: 'Ocultar análisis'"), 'Falta hide en es.js')
  assert(esContent.includes("viewAnalysisButton: 'Ver análisis de IA'"), 'Falta viewAnalysisButton en es.js')
})

test('2. i18n: en.js incluye analyzeButton, analyzing, hide, viewAnalysisButton', () => {
  assert(enContent.includes("analyzeButton: 'Analyze with AI'"), 'Falta analyzeButton en en.js')
  assert(enContent.includes("analyzing: 'Analyzing ability...'"), 'Falta analyzing en en.js')
  assert(enContent.includes("hide: 'Hide analysis'"), 'Falta hide en en.js')
  assert(enContent.includes("viewAnalysisButton: 'View AI Analysis'"), 'Falta viewAnalysisButton en en.js')
})

// 2. Componente AIAbilityAnalysis.jsx
test('3. AIAbilityAnalysis.jsx: exporta AIAbilityIntegratedPanel', () => {
  assert(aiCompContent.includes('export function AIAbilityIntegratedPanel('), 'Falta AIAbilityIntegratedPanel')
  assert(aiCompContent.includes('ability-ai-integrated-panel'), 'Falta clase ability-ai-integrated-panel')
})

test('4. AIAbilityIntegratedPanel: renderiza header con PokeGuide AI, contexto, y botón cerrar/ocultar', () => {
  assert(aiCompContent.includes('ai-brand-badge'), 'Falta ai-brand-badge en integrated panel')
  assert(aiCompContent.includes('ability-ai-integrated-title'), 'Falta título en integrated panel')
  assert(aiCompContent.includes('ability-ai-integrated-close-btn'), 'Falta botón cerrar en integrated panel')
  assert(aiCompContent.includes('AIAbilityAnalysisContent'), 'Falta AIAbilityAnalysisContent en integrated panel')
  assert(aiCompContent.includes('ability-ai-integrated-footer'), 'Falta footer con disclaimer en integrated panel')
})

test('5. AIAbilityAnalysisContent: renderizado defensivo de V3 sin score bar numérico', () => {
  assert(aiCompContent.includes('coreInsight'), 'coreInsight ausente')
  assert(aiCompContent.includes('howToLeverage'), 'howToLeverage ausente')
  assert(aiCompContent.includes('strategies'), 'strategies ausente')
  assert(aiCompContent.includes('deepDive'), 'deepDive ausente')
  assert(aiCompContent.includes('naturalCompetitiveText'), 'naturalCompetitiveText ausente')
  assert(!aiCompContent.includes('ai-score-bar'), 'Se encontró ai-score-bar en componente V3')
})

// 3. Integración en PokemonDetail.jsx
test('6. PokemonDetail.jsx: importa AbilityAIFocusMode y AbilityContextSelector', () => {
  assert(detailContent.includes('AbilityAIFocusMode'), 'Falta import de AbilityAIFocusMode')
  assert(detailContent.includes('AbilityContextSelector'), 'Falta import de AbilityContextSelector')
})

test('7. PokemonDetail.jsx: renderiza botón único "✨ Analizar con IA" dentro de ability-detail-panel y NO tiene botón residual .ability-ai-btn', () => {
  assert(detailContent.includes('ability-panel-ai-section'), 'Falta ability-panel-ai-section')
  assert(detailContent.includes('ability-ai-action-btn'), 'Falta ability-ai-action-btn')
  assert(detailContent.includes('t.aiAnalysis?.analyzeButton'), 'Falta analyzeButton i18n')
  assert(!/(['"\s`])ability-ai-btn(['"\s`])/.test(detailContent), 'Se encontró botón residual ability-ai-btn en cabecera')
})

test('8. PokemonDetail.jsx: previene doble petición simultánea en executeAIAnalysis', () => {
  const fnBody = detailContent.slice(
    detailContent.indexOf('function executeAIAnalysis('),
    detailContent.indexOf('function handleAbilityAIAnalysis(')
  )
  assert(fnBody.includes('if (aiStatus === AI_STATUS.LOADING) return'), 'Falta guard de loading para prevenir doble request')
})

test('9. PokemonDetail.jsx: handleAbilityAIAnalysis abre AbilityAIFocusMode (setIsAiFocusOpen)', () => {
  const fnBody = detailContent.slice(
    detailContent.indexOf('function handleAbilityAIAnalysis('),
    detailContent.indexOf('function handleSelectContextAndAnalyze(')
  )
  assert(fnBody.includes('setIsAiFocusOpen(true)'), 'Falta setIsAiFocusOpen(true) en handleAbilityAIAnalysis')
})

test('10. PokemonDetail.jsx: executeAIAnalysis abre AbilityAIFocusMode al ejecutar', () => {
  const fnBody = detailContent.slice(
    detailContent.indexOf('function executeAIAnalysis('),
    detailContent.indexOf('function handleAbilityAIAnalysis(')
  )
  assert(fnBody.includes('setIsAiFocusOpen(true)'), 'Falta setIsAiFocusOpen(true) en executeAIAnalysis')
})

test('11. PokemonDetail.jsx: AbilityAIFocusMode recibe props status, error, data y onRetry', () => {
  assert(detailContent.includes('<AbilityAIFocusMode'), 'Falta render de AbilityAIFocusMode')
  assert(detailContent.includes('isOpen={isAiFocusOpen}'), 'Falta isOpen={isAiFocusOpen}')
  assert(detailContent.includes('onClose={handleCloseAiFocus}'), 'Falta onClose={handleCloseAiFocus}')
  assert(detailContent.includes('status={aiStatus}'), 'Falta prop status')
  assert(detailContent.includes('error={aiError}'), 'Falta prop error')
  assert(detailContent.includes('data={aiData}'), 'Falta prop data')
  assert(detailContent.includes('onRetry={handleAiRetry}'), 'Falta prop onRetry')
})

test('12. PokemonDetail.jsx: tarjeta factual conserva descripción breve (activeAbilityDescription)', () => {
  assert(detailContent.includes('activeAbilityDescription'), 'Falta activeAbilityDescription')
  assert(detailContent.includes('ability-panel-text'), 'Falta ability-panel-text')
  assert(detailContent.includes('ability-panel-eyebrow'), 'Falta ability-panel-eyebrow')
})

test('13. PokemonDetail.jsx: cambio de Pokémon resetea estado de IA y cierra focus mode', () => {
  const resetBlock = detailContent.slice(
    detailContent.indexOf('// Reset active form and states safely when pokemon changes'),
    detailContent.indexOf('// Fetch mega forms in background')
  )
  assert(resetBlock.includes('setAiStatus(AI_STATUS.IDLE)'), 'Falta reset aiStatus')
  assert(resetBlock.includes('setAiData(null)'), 'Falta reset aiData')
  assert(resetBlock.includes('setAiTargetAbility(null)'), 'Falta reset aiTargetAbility')
  assert(resetBlock.includes('setIsAiFocusOpen(false)'), 'Falta reset setIsAiFocusOpen')
})

test('14. PokemonDetail.jsx: cambio de idioma en PokeGuide resetea análisis para evitar desincronización', () => {
  assert(detailContent.includes('if (aiLocale !== locale)'), 'Falta sincronización por locale')
  assert(detailContent.includes('setAiLocale(locale)'), 'Falta setAiLocale')
})

// 4. CSS
test('15. CSS: estilos para botón trigger, panel integrado, loading y responsive', () => {
  assert(cssContent.includes('.ability-panel-ai-section'), 'Falta .ability-panel-ai-section en CSS')
  assert(cssContent.includes('.ability-ai-action-btn'), 'Falta .ability-ai-action-btn en CSS')
  assert(cssContent.includes('.ability-ai-integrated-panel'), 'Falta .ability-ai-integrated-panel en CSS')
  assert(cssContent.includes('.ability-ai-integrated-header'), 'Falta .ability-ai-integrated-header en CSS')
  assert(cssContent.includes('.ability-ai-integrated-close-btn'), 'Falta .ability-ai-integrated-close-btn en CSS')
})

console.log('\n======================================================================')
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
} else {
  console.log('🎉 ¡Todos los tests de integración frontend pasaron exitosamente!')
}
