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
  assert(esContent.includes("analyzeButton: '✨ Analizar con IA'"), 'Falta analyzeButton en es.js')
  assert(esContent.includes("analyzing: 'Analizando habilidad...'"), 'Falta analyzing en es.js')
  assert(esContent.includes("hide: 'Ocultar análisis'"), 'Falta hide en es.js')
  assert(esContent.includes("viewAnalysisButton: '✨ Ver análisis de IA'"), 'Falta viewAnalysisButton en es.js')
})

test('2. i18n: en.js incluye analyzeButton, analyzing, hide, viewAnalysisButton', () => {
  assert(enContent.includes("analyzeButton: '✨ Analyze with AI'"), 'Falta analyzeButton en en.js')
  assert(enContent.includes("analyzing: 'Analyzing ability...'"), 'Falta analyzing en en.js')
  assert(enContent.includes("hide: 'Hide analysis'"), 'Falta hide en en.js')
  assert(enContent.includes("viewAnalysisButton: '✨ View AI Analysis'"), 'Falta viewAnalysisButton en en.js')
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
test('6. PokemonDetail.jsx: importa AIAbilityIntegratedPanel, AIAbilityLoadingCard, AIAbilityErrorCard', () => {
  assert(detailContent.includes('AIAbilityIntegratedPanel'), 'Falta import de AIAbilityIntegratedPanel')
  assert(detailContent.includes('AIAbilityLoadingCard'), 'Falta import de AIAbilityLoadingCard')
  assert(detailContent.includes('AIAbilityErrorCard'), 'Falta import de AIAbilityErrorCard')
})

test('7. PokemonDetail.jsx: renderiza botón integrado "✨ Analizar con IA" dentro de ability-detail-panel', () => {
  assert(detailContent.includes('ability-panel-ai-section'), 'Falta ability-panel-ai-section')
  assert(detailContent.includes('ability-ai-action-btn'), 'Falta ability-ai-action-btn')
  assert(detailContent.includes('t.aiAnalysis?.analyzeButton'), 'Falta analyzeButton i18n')
})

test('8. PokemonDetail.jsx: previene doble petición simultánea en executeAIAnalysis', () => {
  const fnBody = detailContent.slice(
    detailContent.indexOf('function executeAIAnalysis('),
    detailContent.indexOf('function handleAbilityAIAnalysis(')
  )
  assert(fnBody.includes('if (aiStatus === AI_STATUS.LOADING) return'), 'Falta guard de loading para prevenir doble request')
})

test('9. PokemonDetail.jsx: maneja estado loading con botón deshabilitado, aria-busy y AIAbilityLoadingCard', () => {
  assert(detailContent.includes('isCurrentLoading'), 'Falta flag isCurrentLoading')
  assert(detailContent.includes('ability-ai-btn-spinner'), 'Falta spinner en botón')
  assert(detailContent.includes('<AIAbilityLoadingCard'), 'Falta componente AIAbilityLoadingCard en JSX')
})

test('10. PokemonDetail.jsx: maneja estado error con AIAbilityErrorCard y onRetry', () => {
  assert(detailContent.includes('isCurrentError'), 'Falta flag isCurrentError')
  assert(detailContent.includes('<AIAbilityErrorCard'), 'Falta componente AIAbilityErrorCard en JSX')
  assert(detailContent.includes('onRetry={handleAiRetry}'), 'Falta prop onRetry')
})

test('11. PokemonDetail.jsx: maneja estado success con AIAbilityIntegratedPanel y onClose={handleHideAnalysis}', () => {
  assert(detailContent.includes('showIntegratedAnalysis'), 'Falta flag showIntegratedAnalysis')
  assert(detailContent.includes('<AIAbilityIntegratedPanel'), 'Falta componente AIAbilityIntegratedPanel en JSX')
  assert(detailContent.includes('onClose={handleHideAnalysis}'), 'Falta prop onClose handleHideAnalysis')
})

test('12. PokemonDetail.jsx: cambio de habilidad no muestra análisis obsoleto de otra habilidad', () => {
  assert(detailContent.includes('const isCurrentTarget = aiTargetAbility === activeSelectedAbility'), 'Falta validación de target habilidad')
})

test('13. PokemonDetail.jsx: cambio de Pokémon resetea estado de IA', () => {
  const resetBlock = detailContent.slice(
    detailContent.indexOf('// Reset active form and states safely when pokemon changes'),
    detailContent.indexOf('// Fetch mega forms in background')
  )
  assert(resetBlock.includes('setAiStatus(AI_STATUS.IDLE)'), 'Falta reset aiStatus')
  assert(resetBlock.includes('setAiData(null)'), 'Falta reset aiData')
  assert(resetBlock.includes('setAiTargetAbility(null)'), 'Falta reset aiTargetAbility')
  assert(resetBlock.includes('setIsAnalysisHidden(false)'), 'Falta reset isAnalysisHidden')
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
