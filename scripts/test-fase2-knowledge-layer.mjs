/**
 * test-fase2-knowledge-layer.mjs
 * Suite de pruebas para PokeGuide — Fase 2 & 2.1: Knowledge Layer verificable (Piloto: Liviano / Unburden).
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
console.log('🧪 POKEGUIDE AI — FASE 2 & 2.1: KNOWLEDGE LAYER VERIFICABLE (LIVIANO)')
console.log('======================================================================\n')

const knowledgeCode = readFile('supabase/functions/analyze-ability/knowledgeLayer.ts')
const promptCode = readFile('supabase/functions/analyze-ability/promptBuilder.ts')
const validatorCode = readFile('supabase/functions/analyze-ability/factValidator.ts')

// ==========================================
// 1-3: MECÁNICA Y CONDICIONES (Fase 2)
// ==========================================

test(1, 'Mecánica: Liviano duplica Velocidad tras perder o consumir el objeto', () => {
  assert(knowledgeCode.includes('Duplica la estadística de Velocidad'), 'No especifica duplicación de Velocidad')
  assert(knowledgeCode.includes('pierde o consume el objeto'), 'No especifica perder o consumir objeto')
})

test(2, 'Condiciones: Liviano NO se activa simplemente por entrar sin objeto', () => {
  assert(
    knowledgeCode.includes('Entrar al combate sin objeto NO activa la habilidad por sí solo') ||
    knowledgeCode.includes('se activa sin tener objeto inicial'),
    'Condición de no activación al entrar sin objeto no declarada',
  )
  assert(knowledgeCode.includes('se activa al entrar sin objeto'), 'Falta en prohibitedClaims')
})

test(3, 'Condiciones: Conserva la duplicación mientras permanezca sin objeto', () => {
  assert(
    knowledgeCode.includes('Mientras el Pokémon permanezca sin objeto, conserva la duplicación de Velocidad') ||
    knowledgeCode.includes('mientras continúe sin objeto'),
    'No especifica duración del beneficio mientras esté sin objeto',
  )
})

// ==========================================
// 4-6: SINERGIA VERIFICADA PRINCIPAL (HIERBA BLANCA + A BOCAJARRO)
// ==========================================

test(4, 'Sinergia estructurada: Hierba Blanca + A Bocajarro está registrada y verified=true', () => {
  assert(knowledgeCode.includes('Hierba Blanca + A Bocajarro'), 'Sinergia no encontrada')
  assert(knowledgeCode.includes('White Herb') && knowledgeCode.includes('Close Combat'), 'Nombres oficiales no encontrados')
  assert(knowledgeCode.includes('verified: true'), 'No marcada como verified: true')
  assert(knowledgeCode.includes('featured: true'), 'No marcada como featured: true')
})

test(5, 'Sinergia: Interacción causal de A Bocajarro y Hierba Blanca documentada', () => {
  assert(knowledgeCode.includes('reduce en 1 nivel la Defensa'), 'No documenta bajada de stats de A Bocajarro')
  assert(knowledgeCode.includes('restaura'), 'No documenta restauración de Hierba Blanca')
  assert(knowledgeCode.includes('se consume en el proceso'), 'No documenta consumo de Hierba Blanca')
})

test(6, 'Sinergia: Resultado táctico explica por qué es destacada', () => {
  assert(knowledgeCode.includes('whyUseful'), 'No incluye whyUseful')
  assert(
    knowledgeCode.includes('Convierte la desventaja de reducción') ||
    knowledgeCode.includes('oportunidad táctica para activar Liviano'),
    'whyUseful no documenta valor estratégico causal',
  )
})

// ==========================================
// 7-8: OTRAS ACTIVACIONES VERIFICADAS (BAYAS Y GLOBO HELIO)
// ==========================================

test(7, 'Activación por Bayas: No asume 50% universal; depende de la baya individual', () => {
  assert(knowledgeCode.includes('Consumo de Baya Sitrus'), 'Activación de Baya Sitrus no registrada')
  assert(
    knowledgeCode.includes('NUNCA afirmar que todas las bayas se activan al 50% de PS') ||
    knowledgeCode.includes('NUNCA generalizar esta condición a otras bayas'),
    'No previene la generalización falsa del 50%',
  )
  assert(knowledgeCode.includes('las bayas se activan al bajar de 50%'), 'Falta en prohibitedClaims')
})

test(8, 'Activación por Globo Helio: Se distingue pérdida (estallido) de consumo', () => {
  assert(knowledgeCode.includes('Globo Helio'), 'Globo Helio no registrado')
  assert(knowledgeCode.includes('isConsumption: false'), 'Globo Helio no debe catalogarse como consumo')
  assert(knowledgeCode.includes('globo helio se consume'), 'Falta en prohibitedClaims')
})

// ==========================================
// 9-12: ANTI-ALUCINACIÓN Y FACT VALIDATOR
// ==========================================

test(9, 'Anti-alucinación: Prohíbe objetos genéricos (Choice Band, Life Orb) como sinergias con Liviano', () => {
  assert(knowledgeCode.includes('choice band + a bocajarro'), 'Choice Band no prohibido para Liviano')
  assert(knowledgeCode.includes('life orb + a bocajarro') || knowledgeCode.includes('vidasfera + a bocajarro'), 'Life Orb no prohibido para Liviano')
})

test(10, 'Fact Validator: Corrige afirmación falsa de entrar sin objeto', () => {
  assert(validatorCode.includes('se activa tras perder o consumir'), 'Regla de corrección de entrada sin objeto ausente')
  assert(validatorCode.includes('UNBURDEN_CORRECTION_PATTERNS'), 'UNBURDEN_CORRECTION_PATTERNS ausente en validator')
})

test(11, 'Fact Validator: Corrige confusión de Globo Helio ("se consume" -> "se pierde")', () => {
  assert(validatorCode.includes('el Globo Helio se pierde tras recibir un ataque'), 'Regla de Globo Helio ausente en validator')
})

test(12, 'Fact Validator: Filtra estrategias no verificadas para Liviano (Choice/Orb)', () => {
  assert(validatorCode.includes('Estrategia no verificada rechazada para Liviano'), 'Filtro de estrategias inválidas ausente')
  assert(validatorCode.includes('choice') && validatorCode.includes('vidasfera'), 'Condición de filtro Choice/Vidasfera ausente')
})

// ==========================================
// 13-16: PROMPT BUILDER Y PRINCIPIANTES
// ==========================================

test(13, 'Prompt Builder: Sección [SINERGIAS VERIFICADAS] inyectada en prompt', () => {
  assert(promptCode.includes('[SINERGIAS VERIFICADAS (VERIFIED SYNERGIES)]'), 'Bloque de sinergias ausente en prompt')
  assert(promptCode.includes('facts.verifiedSynergies'), 'promptBuilder no lee facts.verifiedSynergies')
})

test(14, 'Prompt Builder: Sección [MECANISMOS DE ACTIVACIÓN VERIFICADOS] inyectada', () => {
  assert(promptCode.includes('[MECANISMOS DE ACTIVACIÓN VERIFICADOS]'), 'Bloque de mecanismos ausente en prompt')
  assert(promptCode.includes('facts.verifiedActivations'), 'promptBuilder no lee facts.verifiedActivations')
})

test(15, 'Prompt Builder: Regla estricta contra flechas y sinergias inventadas', () => {
  assert(promptCode.includes('NUNCA uses cadenas de flechas'), 'Regla anti-flechas ausente')
  assert(promptCode.includes('EXCLUSIVAMENTE sinergias verificadas del Knowledge Layer'), 'Regla de exclusividad ausente')
})

test(16, 'Prompt Builder: Nivel Principiante evita jerga sin explicación (sweep, outspeed, benchmark)', () => {
  assert(promptCode.includes('sweep') && promptCode.includes('outspeeds') && promptCode.includes('benchmark'), 'No advierte sobre jerga para beginner')
  assert(promptCode.includes('superar en Velocidad') && promptCode.includes('aumento de Velocidad'), 'Términos preferidos ausentes')
})

// ==========================================
// 17-18: RETROCOMPATIBILIDAD V3
// ==========================================

test(17, 'Retrocompatibilidad V3: buildVerifiedAbilityFacts entrega interfaces compatibles', () => {
  assert(knowledgeCode.includes('verifiedSynergies: base.verifiedSynergies || []'), 'buildVerifiedAbilityFacts no expone verifiedSynergies')
  assert(knowledgeCode.includes('verifiedConditions: base.verifiedConditions || []'), 'buildVerifiedAbilityFacts no expone verifiedConditions')
})

test(18, 'Rating determinista: Liviano mantiene score 8 ("Muy buena")', () => {
  assert(knowledgeCode.includes('score: 8') && knowledgeCode.includes('Muy buena'), 'Rating determinista de Liviano alterado')
})

// ==========================================
// 19-25: CORRECCIONES FACTUALES FASE 2.1 (CASOS A A G)
// ==========================================

test(19, 'Caso A: Entrar sin objeto NO activa Liviano simplemente por entrar (y no exige haber entrado con objeto)', () => {
  assert(knowledgeCode.includes('Entrar al combate sin objeto NO activa la habilidad por sí solo'), 'Falta precisión en condición')
  assert(knowledgeCode.includes('Si el Pokémon entra sin objeto y obtiene uno durante el combate, perderlo o consumirlo puede activar Liviano'), 'No contempla obtención de objeto durante el combate')
  assert(promptCode.includes('NUNCA afirmes que tener objeto al inicio o entrar con objeto es un requisito obligatorio'), 'Falta regla en prompt')
})

test(20, 'Caso B: Tener objeto y perderlo activa Liviano (reconocido en mecánicas y condiciones)', () => {
  assert(knowledgeCode.includes('cuando este pierde o consume el objeto equipado que esté llevando'), 'No reconoce pérdida de objeto que esté llevando')
  assert(knowledgeCode.includes('Pérdida de Globo Helio'), 'Falta mecanismo de pérdida verificado')
})

test(21, 'Caso C: Consumir objeto activa Liviano (reconocido en bayas y hierbas)', () => {
  assert(knowledgeCode.includes('Consumo de Baya Sitrus'), 'Falta activación de consumo por baya')
  assert(knowledgeCode.includes('Uso de A Bocajarro y activación inmediata de Hierba Blanca'), 'Falta activación de consumo por Hierba Blanca')
})

test(22, 'Caso D: Sinergia A Bocajarro + Hierba Blanca verificada sin flechas y con causalidad', () => {
  const unburdenEntry = knowledgeCode.slice(knowledgeCode.indexOf('unburden:'), knowledgeCode.indexOf('guts:'))
  assert(!unburdenEntry.includes('->') && !unburdenEntry.includes('→'), 'Sinergia de Liviano contiene flechas en el Knowledge Layer')
  assert(unburdenEntry.includes('Hierba Blanca + A Bocajarro'), 'Sinergia ausente')
})

test(23, 'Caso E: Duración del efecto corregida a "mientras permanezca sin objeto" (no "para el resto del combate")', () => {
  assert(knowledgeCode.includes('para el resto del combate'), 'Falta "para el resto del combate" en prohibitedClaims')
  assert(promptCode.includes('mientras permanezca sin objeto'), 'Falta "mientras permanezca sin objeto" en prompt')
  assert(validatorCode.includes('mientras permanezca sin objeto'), 'Falta corrección en validator')
})

test(24, 'Caso F: Prohibido "casi cualquier rival" / "velocidad extrema"; preferir formulación relativa', () => {
  assert(knowledgeCode.includes('casi cualquier rival'), 'Falta "casi cualquier rival" en prohibitedClaims')
  assert(knowledgeCode.includes('velocidad extrema'), 'Falta "velocidad extrema" en prohibitedClaims')
  assert(promptCode.includes('superar a muchos rivales que antes podían ser más rápidos'), 'Falta frase preferida en prompt')
  assert(validatorCode.includes('a muchos rivales que antes podían ser más rápidos'), 'Falta corrección determinista en validator')
})

test(25, 'Caso G: Baya Sitrus y Baya de Resistencia tienen condiciones individuales separadas', () => {
  assert(knowledgeCode.includes('Consumo de Baya Sitrus'), 'Falta entrada independiente de Baya Sitrus')
  assert(knowledgeCode.includes('Consumo de Baya de Resistencia'), 'Falta entrada independiente de Baya de Resistencia')
  assert(knowledgeCode.includes('impacto supereficaz de su tipo'), 'No documenta condición supereficaz de Baya de Resistencia')
  assert(knowledgeCode.includes('umbral de PS'), 'No documenta condición de PS de Baya Sitrus')
})

// ==========================================
// 26-28: PRIORIZACIÓN CANÓNICA FASE 2.2 (CASOS H A J)
// ==========================================

test(26, 'Caso H: Hierba Blanca + A Bocajarro registrada con prioridad y garantizada en strategies[0]', () => {
  assert(knowledgeCode.includes('priority: 1'), 'Sinergia no tiene prioridad: 1 asignada')
  assert(promptCode.includes('PRIORIDAD DE SINERGIA DESTACADA'), 'Directriz de prioridad ausente en prompt')
  assert(validatorCode.includes('Sinergia prioritaria'), 'Lógica de sinergia prioritaria ausente en validator')
})

test(27, 'Caso I: Las bayas van a alternatives y NO desplazan a Hierba Blanca + A Bocajarro', () => {
  assert(validatorCode.includes('reubicado de \'strategies\' a \'alternatives\''), 'Validator no reubica activaciones genéricas')
  assert(promptCode.includes('Los mecanismos de activación genéricos (como Bayas o Globo Helio) NO deben desplazar a la sinergia destacada'), 'Regla ausente en prompt')
})

test(28, 'Caso J: Prohibición y sanitización de sobreafirmaciones (la única forma, siempre es el mejor, obligatorio)', () => {
  assert(knowledgeCode.includes('la única forma') && knowledgeCode.includes('es obligatorio'), 'Faltan sobreafirmaciones en prohibitedClaims')
  assert(promptCode.includes('NO SOBREAFIRMAR'), 'Regla anti-sobreafirmación ausente en prompt')
  assert(validatorCode.includes('Sobreafirmación: no es la única forma'), 'Validator no corrige "la única forma"')
  assert(validatorCode.includes('Sobreafirmación: no es obligatorio'), 'Validator no corrige "obligatorio"')
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

if (failed > 0) {
  process.exit(1)
}
