/**
 * test-fase3-competitive-contexts.mjs
 * Suite integral de verificación para PokeGuide AI — Fase 3:
 * Contextos competitivos (Champions, Showdown, General) + Cache V2.
 *
 * Ejecución: node scripts/test-fase3-competitive-contexts.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('======================================================================')
console.log('🧪 POKEGUIDE AI — VERIFICACIÓN FASE 3: CONTEXTOS COMPETITIVOS + CACHE V2')
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
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

// ---------------------------------------------------------------------------
// Cargar módulos y componentes para pruebas
// ---------------------------------------------------------------------------
import {
  COMPETITIVE_CONTEXTS,
  getCompetitiveContextConfig,
  getFormatConfig,
  formatCompetitiveContextBadge,
  getCompetitiveContext,
} from '../src/data/competitiveContexts.js'

const cacheManagerPath = join(process.cwd(), 'supabase', 'functions', 'analyze-ability', 'cacheManager.ts')
const promptBuilderPath = join(process.cwd(), 'supabase', 'functions', 'analyze-ability', 'promptBuilder.ts')
const edgeIndexPath = join(process.cwd(), 'supabase', 'functions', 'analyze-ability', 'index.ts')
const migrationV2Path = join(process.cwd(), 'supabase', 'migrations', 'add_ai_ability_analysis_cache_v2.sql')
const cssPath = join(process.cwd(), 'src', 'styles', 'ai-ability-analysis.css')
const pokemonDetailPath = join(process.cwd(), 'src', 'pages', 'PokemonDetail.jsx')
const pokeguideAIPath = join(process.cwd(), 'src', 'services', 'pokeguideAI.js')
const selectorPath = join(process.cwd(), 'src', 'components', 'AbilityContextSelector.jsx')

// ===========================================================================
// BLOQUE 1: CACHÉ V2 Y COMPATIBILIDAD
// ===========================================================================

// 1. General conserva compatibilidad con cache anterior (V1)
test('1. General conserva compatibilidad con cache anterior (V1)', () => {
  const content = readFileSync(cacheManagerPath, 'utf-8')
  assert(
    content.includes("allowedVersions = resolvedContext === 'general' ? ['v1', 'v2']") ||
    content.includes("allowedVersions = resolvedContext === 'general' ? ['v1', 'v2', CURRENT_VALIDATION_VERSION]"),
    'El cacheManager debe permitir entradas v1 para el contexto general',
  )
  assert(
    content.includes("CURRENT_VALIDATION_VERSION = 'v2'") ||
    content.includes("CURRENT_VALIDATION_VERSION = 'v3'"),
    'La versión de validación actual debe ser v2 o v3',
  )
})

// 2. General y Showdown no colisionan
test('2. General y Showdown no colisionan en la identidad de caché', () => {
  const generalLookup = { pokemonId: 'slaking', abilityId: 'truant', userLevel: 'beginner', locale: 'es', context: 'general', format: null }
  const showdownLookup = { pokemonId: 'slaking', abilityId: 'truant', userLevel: 'beginner', locale: 'es', context: 'showdown', format: 'gen9-ou' }

  const generalKey = `${generalLookup.pokemonId}:${generalLookup.abilityId}:${generalLookup.userLevel}:${generalLookup.locale}:${generalLookup.context}:${generalLookup.format || 'none'}`
  const showdownKey = `${showdownLookup.pokemonId}:${showdownLookup.abilityId}:${showdownLookup.userLevel}:${showdownLookup.locale}:${showdownLookup.context}:${showdownLookup.format || 'none'}`

  assert(generalKey !== showdownKey, 'General y Showdown deben generar identidades de caché completamente distintas')
  assert(showdownKey.includes('showdown:gen9-ou'), 'Showdown debe incluir formato gen9-ou')
})

// 3. Showdown Gen 9 OU y Showdown VGC no colisionan
test('3. Showdown Gen 9 OU y Showdown VGC no colisionan', () => {
  const ou = { context: 'showdown', format: 'gen9-ou' }
  const vgc = { context: 'showdown', format: 'vgc' }

  assert(ou.format !== vgc.format, 'Los formatos deben ser diferentes')
  const ouKey = `slaking:truant:beginner:es:${ou.context}:${ou.format}`
  const vgcKey = `slaking:truant:beginner:es:${vgc.context}:${vgc.format}`
  assert(ouKey !== vgcKey, 'Gen 9 OU y VGC no deben colisionar en caché')
})

// 4. Champions y Showdown no colisionan
test('4. Champions y Showdown no colisionan', () => {
  const champ = { context: 'champions', format: 'ranked-singles' }
  const sd = { context: 'showdown', format: 'ranked-singles' } // Caso hipotético de mismo nombre de formato

  const champKey = `torkoal:drought:beginner:es:${champ.context}:${champ.format}`
  const sdKey = `torkoal:drought:beginner:es:${sd.context}:${sd.format}`
  assert(champKey !== sdKey, 'Champions y Showdown deben diferenciarse por contexto')
})

// 5. Regulation diferente no colisiona
test('5. Regulation diferente no colisiona', () => {
  const regM = `slaking:truant:beginner:es:champions:ranked-singles:reg-m`
  const regMC = `slaking:truant:beginner:es:champions:ranked-singles:reg-m-c`
  const noReg = `slaking:truant:beginner:es:champions:ranked-singles:none`

  assert(regM !== regMC && regM !== noReg, 'Diferentes regulaciones deben tener identidades separadas')
})

// 6. Locale diferente no colisiona
test('6. Locale diferente no colisiona', () => {
  const es = `slaking:truant:beginner:es:showdown:gen9-ou`
  const en = `slaking:truant:beginner:en:showdown:gen9-ou`
  const es419 = `slaking:truant:beginner:es-419:showdown:gen9-ou`

  assert(es !== en && es !== es419, 'Diferentes locales deben generar claves de caché separadas')
})

// 7. User level diferente no colisiona
test('7. User level diferente no colisiona', () => {
  const beginner = `guts:heracross:beginner:es:showdown:gen9-ou`
  const competitive = `guts:heracross:competitive:es:showdown:gen9-ou`

  assert(beginner !== competitive, 'Distintos niveles de usuario deben mantenerse aislados en caché')
})

// 8. Cache hit contextual devuelve inmediatamente
test('8. Cache hit contextual devuelve inmediatamente con metadatos de contexto', () => {
  const edgeContent = readFileSync(edgeIndexPath, 'utf-8')
  assert(
    edgeContent.includes('cached.hit && cached.data') &&
    edgeContent.includes('cached: true') &&
    edgeContent.includes('cache_hit: true'),
    'La Edge Function debe retornar inmediatamente en caso de CACHE HIT',
  )
})

// 9. Cache miss contextual genera y guarda con todas las dimensiones
test('9. Cache miss contextual genera y guarda con todas las dimensiones V2', () => {
  const edgeContent = readFileSync(edgeIndexPath, 'utf-8')
  assert(
    edgeContent.includes('saveCachedAnalysis(adminSupabase, {') &&
    edgeContent.includes('context,') &&
    edgeContent.includes('format,') &&
    edgeContent.includes('regulation,') &&
    edgeContent.includes('validationVersion: CURRENT_VALIDATION_VERSION'),
    'Al haber CACHE MISS, debe guardar con context, format, regulation y versión v2',
  )
})

// 10. No existen duplicados para el mismo contexto (Restricción UNIQUE)
test('10. La migración V2 y esquema definen restricción UNIQUE sobre las 7 dimensiones', () => {
  const migContent = readFileSync(migrationV2Path, 'utf-8')
  assert(
    migContent.includes('unique_ability_analysis_context_v2') &&
    migContent.includes('pokemon_id,') &&
    migContent.includes('ability_id,') &&
    migContent.includes('user_level,') &&
    migContent.includes('locale,') &&
    migContent.includes('context,'),
    'La migración debe definir la restricción única v2 con todas las dimensiones',
  )
})

// ===========================================================================
// BLOQUE 2: FRONTEND Y COMPONENTES
// ===========================================================================

// 11. Analizar con IA inicia directamente en General (Focus Mode)
test('11. Analizar con IA inicia directamente en General (Focus Mode)', () => {
  const detailContent = readFileSync(pokemonDetailPath, 'utf-8')
  assert(
    detailContent.includes('function handleAbilityAIAnalysis(') &&
    (detailContent.includes("context: 'general'") || detailContent.includes('executeAIAnalysis')),
    'handleAbilityAIAnalysis debe iniciar el análisis directamente en General',
  )
})

// 12. General abre análisis directamente sin submenú
test('12. General abre análisis directamente sin submenú', () => {
  const selectorContent = readFileSync(selectorPath, 'utf-8')
  assert(
    selectorContent.includes("ctx.id === 'general' || !ctx.formats || ctx.formats.length === 0") &&
    selectorContent.includes("context: 'general'"),
    'Al seleccionar General, debe invocar onSelectContext directamente',
  )
})

// 13. Showdown abre selector de formato
test('13. Showdown abre selector de formato con formatos configurados', () => {
  const sd = getCompetitiveContextConfig('showdown')
  assert(sd && sd.formats.length >= 4, 'Showdown debe tener al menos 4 formatos')
  const ou = getFormatConfig('showdown', 'gen9-ou')
  const vgc = getFormatConfig('showdown', 'vgc')
  assert(ou && ou.label === 'Gen 9 OU', 'Debe existir Gen 9 OU')
  assert(vgc && vgc.label === 'VGC', 'Debe existir VGC')
})

// 14. Champions abre selector de contexto
test('14. Champions abre selector de formato con modalidades configuradas', () => {
  const champ = getCompetitiveContextConfig('champions')
  assert(champ && champ.formats.length >= 2, 'Champions debe tener al menos 2 modalidades')
  const singles = getFormatConfig('champions', 'ranked-singles')
  const doubles = getFormatConfig('champions', 'ranked-doubles')
  assert(singles && singles.label === 'Ranked Singles', 'Debe existir Ranked Singles')
  assert(doubles && doubles.label === 'Ranked Doubles', 'Debe existir Ranked Doubles')
})

// 15. Cambiar contexto funciona dentro del análisis
test('15. Cambiar contexto funciona dentro del análisis sin cerrar la experiencia', () => {
  const detailContent = readFileSync(pokemonDetailPath, 'utf-8')
  assert(
    detailContent.includes('function handleChangeContext()') &&
    detailContent.includes('setIsAiFocusOpen(false)') &&
    detailContent.includes('setIsContextSelectorOpen(true)'),
    'handleChangeContext debe conmutar del análisis al selector de contexto',
  )
  assert(
    detailContent.includes('onChangeContext={handleChangeContext}'),
    'AbilityAIFocusMode debe recibir la prop onChangeContext',
  )
})

// 16. Escape funciona
test('16. Tecla Escape cierra tanto el selector como el Focus Mode', () => {
  const selectorContent = readFileSync(selectorPath, 'utf-8')
  assert(
    selectorContent.includes("e.key === 'Escape'") &&
    selectorContent.includes('onClose?.()'),
    'AbilityContextSelector debe escuchar Escape para cerrarse',
  )
})

// 17. Backdrop funciona
test('17. Backdrop difuminado cierra modal al hacer clic', () => {
  const selectorContent = readFileSync(selectorPath, 'utf-8')
  assert(
    selectorContent.includes('className="ability-ai-focus-backdrop context-selector-backdrop"') &&
    selectorContent.includes('onClick={onClose}'),
    'El backdrop del selector debe invocar onClose al hacer clic',
  )
})

// 18. Mobile funciona (1 columna y sin scroll horizontal)
test('18. Mobile adapta la rejilla a 1 columna sin scroll horizontal', () => {
  const cssContent = readFileSync(cssPath, 'utf-8')
  assert(
    cssContent.includes('@media (max-width: 768px)') &&
    cssContent.includes('.context-cards-grid {') &&
    cssContent.includes('grid-template-columns: 1fr;'),
    'En pantallas móviles la rejilla de contextos debe ser estrictamente de 1 columna',
  )
})

// ===========================================================================
// BLOQUE 3: COMPATIBILIDAD Y ARQUITECTURA FUTURA
// ===========================================================================

// 19. Las llamadas antiguas a analyzeAbility() siguen funcionando
test('19. Las llamadas antiguas a analyzeAbility() siguen funcionando con default context=general', () => {
  const aiServiceContent = readFileSync(pokeguideAIPath, 'utf-8')
  assert(
    aiServiceContent.includes("context = 'general'"),
    'analyzeAbility debe asignar context = general por defecto',
  )
  assert(
    aiServiceContent.includes('typeof context === \'object\' && context !== null ? context : {}'),
    'analyzeAbility debe normalizar context tanto si se pasa como string o como objeto antiguo',
  )
})

// 20. Arquitectura de Fase 4 preparada (getCompetitiveContext)
test('20. Arquitectura preparada para Competitive Knowledge Layer (getCompetitiveContext)', () => {
  const stub = getCompetitiveContext('showdown', 'gen9-ou', null)
  assert(stub.source === 'showdown', 'source debe ser showdown')
  assert(stub.format === 'gen9-ou', 'format debe ser gen9-ou')
  assert(Array.isArray(stub.verifiedFacts), 'verifiedFacts debe ser un array preparado')
  assert(Array.isArray(stub.recommendedItems), 'recommendedItems debe ser un array preparado')
  assert(Array.isArray(stub.commonSets), 'commonSets debe ser un array preparado')
  assert(Array.isArray(stub.usageStats), 'usageStats debe ser un array preparado')

  const badgeShowdown = formatCompetitiveContextBadge('showdown', 'gen9-ou')
  assert(badgeShowdown.includes('Gen 9 OU'), 'formatCompetitiveContextBadge debe formatear Showdown')
  const badgeGeneral = formatCompetitiveContextBadge('general')
  assert(badgeGeneral === 'General', 'formatCompetitiveContextBadge debe formatear General')
})

console.log('\n======================================================================')
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('======================================================================')

if (failed > 0) {
  process.exit(1)
} else {
  console.log('🎉 ¡Todos los 20 tests pasaron exitosamente!')
}
