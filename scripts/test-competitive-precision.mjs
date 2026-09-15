/**
 * test-competitive-precision.mjs
 * Test suite para la Microfase: Precisión del Lenguaje Competitive en PokeGuide AI.
 *
 * Valida:
 * 1. Aislamiento de niveles (Beginner, Intermediate, Advanced, Competitive).
 * 2. Lenguaje no vago y alta densidad en Competitive.
 * 3. Prohibición de inventar números (Speed tiers, EV spreads, damage calcs, percentages).
 * 4. Distinción rigurosa entre Velocidad, Prioridad (Sucker Punch, etc.) y Speed Control.
 * 5. Tratamiento exacto de Espacio Raro (Trick Room).
 * 6. Explicaciones causales explícitas (por qué ocurre algo).
 * 7. Preservación canónica de Hierba Blanca + A Bocajarro en Sneasler + Liviano (Fase 2.2).
 * 8. Fact Validator y sanitización de sobreafirmaciones intactos.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const promptBuilderPath = path.join(root, 'supabase/functions/analyze-ability/promptBuilder.ts')
const knowledgeLayerPath = path.join(root, 'supabase/functions/analyze-ability/knowledgeLayer.ts')
const factValidatorPath = path.join(root, 'supabase/functions/analyze-ability/factValidator.ts')

const promptCode = fs.readFileSync(promptBuilderPath, 'utf8')
const knowledgeCode = fs.readFileSync(knowledgeLayerPath, 'utf8')
const validatorCode = fs.readFileSync(factValidatorPath, 'utf8')

let passed = 0
let failed = 0

function test(num, description, fn) {
  try {
    fn()
    console.log(`✅ [PASS] ${num}. ${description}`)
    passed++
  } catch (err) {
    console.error(`❌ [FAIL] ${num}. ${description}`)
    console.error(`   ${err.message}`)
    failed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

console.log('='.repeat(70))
console.log('🧪 POKEGUIDE AI — MICROFASE: PRECISIÓN DEL LENGUAJE COMPETITIVE')
console.log('='.repeat(70))
console.log()

// ====================================================================
// 1-4: PROTECCIÓN Y AISLAMIENTO DE NIVELES (REGRESIÓN)
// ====================================================================

test(1, 'Nivel Beginner conserva directrices didácticas y pedagógicas', () => {
  assert(promptCode.includes('DIRECTRICES DIDÁCTICAS PARA NIVEL PRINCIPIANTE'), 'Falta bloque beginner')
  assert(promptCode.includes('lenguaje sencillo, claro y motivador'), 'Beginner perdió tono pedagógico')
  assert(promptCode.includes('Evita jerga técnica sin explicación'), 'Beginner perdió restricción de jerga')
  assert(promptCode.includes('superar a muchos rivales que antes podían ser más rápidos'), 'Beginner perdió ejemplo accesible')
})

test(2, 'Nivel Intermediate conserva directrices tácticas estándar', () => {
  assert(promptCode.includes('DIRECTRICES TÁCTICAS PARA NIVEL INTERMEDIO'), 'Falta bloque intermediate')
  assert(promptCode.includes('STAB, Sweeper, Muralla (Wall), Pivote, Check, Counter, Hazard, Sinergia'), 'Intermediate perdió términos clave')
})

test(3, 'Nivel Advanced conserva directrices estratégicas de optimización', () => {
  assert(promptCode.includes('DIRECTRICES ESTRATÉGICAS PARA NIVEL AVANZADO'), 'Falta bloque advanced')
  assert(promptCode.includes('Matchups, control de velocidad (speed control), presión ofensiva (pressure)'), 'Advanced perdió términos estratégicos')
})

test(4, 'Diferenciación estricta entre niveles (Beginner ≠ Intermediate ≠ Advanced ≠ Competitive)', () => {
  const getSection = (level) => {
    const start = promptCode.indexOf(`userLevel === '${level}'`)
    if (start === -1) return ''
    return promptCode.slice(start, start + 1200)
  }

  const beg = getSection('beginner')
  const inter = getSection('intermediate')
  const adv = getSection('advanced')
  const comp = getSection('competitive')

  assert(beg !== comp, 'Beginner y Competitive no deben ser iguales')
  assert(inter !== comp, 'Intermediate y Competitive no deben ser iguales')
  assert(adv !== comp, 'Advanced y Competitive no deben ser iguales')
  assert(comp.includes('DIRECTRICES DE ÉLITE Y PRECISIÓN PARA NIVEL COMPETITIVO'), 'Competitive no tiene encabezado de precisión')
})

// ====================================================================
// 5-10: DIRECTRICES ESPECÍFICAS DE ALTA PRECISIÓN PARA COMPETITIVE
// ====================================================================

test(5, 'Competitive: principio de alta densidad informativa y cadena causal', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('DENSIDAD INFORMATIVA'), 'Falta directriz de densidad informativa')
  assert(compSection.includes('Mecánica → Condición de activación → Consecuencia práctica → Valor competitivo → Counterplay'), 'Falta cadena causal completa')
})

test(6, 'Competitive: directriz explícita contra lenguaje vago e hiperbólico', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('REDUCCIÓN DE LENGUAJE VAGO E HIPERBÓLICO'), 'Falta directriz contra lenguaje vago')
  assert(compSection.includes('muy rápido'), 'Falta mención de "muy rápido"')
  assert(compSection.includes('extremadamente rápido'), 'Falta mención de "extremadamente rápido"')
  assert(compSection.includes('muchos rivales'), 'Falta mención de "muchos rivales"')
  assert(compSection.includes('amenaza decisiva'), 'Falta mención de "amenaza decisiva"')
})

test(7, 'Competitive: prohibición estricta de inventar números (Speed tiers, EV spreads, calcs)', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('PROHIBICIÓN ESTRICTA DE INVENTAR PRECISIÓN'), 'Falta directriz contra alucinación de precisión')
  assert(compSection.includes('Speed tiers'), 'Falta mención de Speed tiers')
  assert(compSection.includes('EV spreads'), 'Falta mención de EV spreads')
  assert(compSection.includes('cálculos de daño'), 'Falta mención de cálculos de daño')
  assert(compSection.includes('NUNCA de fabricar números'), 'Falta prohibición explícita de fabricar números')
})

test(8, 'Competitive: distinción rigurosa entre Velocidad, Prioridad y Speed Control', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('DISTINCIÓN RIGUROSA ENTRE VELOCIDAD, PRIORIDAD Y SPEED CONTROL'), 'Falta sección de distinción')
  assert(compSection.includes('NUNCA afirmes que un aumento de Velocidad permite superar movimientos prioritarios'), 'Falta regla sobre prioridad')
  assert(compSection.includes('Sucker Punch') || compSection.includes('Golpe Bajo'), 'Falta ejemplo de movimiento de prioridad')
})

test(9, 'Competitive: tratamiento preciso de Espacio Raro (Trick Room)', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('Trick Room') || compSection.includes('Espacio Raro'), 'Falta mención de Trick Room')
  assert(compSection.includes('altera el orden en que actúan los Pokémon según sus valores de Velocidad'), 'Falta mecánica precisa de Trick Room')
  assert(compSection.includes('NO lo describas como "reduce la Velocidad"'), 'Falta advertencia contra decir que reduce la velocidad')
})

test(10, 'Competitive: causalidad mecánica paso a paso y distinción activación vs estrategia', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('CAUSALIDAD MECÁNICA EXPLÍCITA'), 'Falta sección de causalidad explícita')
  assert(compSection.includes('DISTINCIÓN DE ACTIVACIÓN VS VALOR COMPETITIVO'), 'Falta sección de activación vs estrategia')
  assert(compSection.includes('Hierba Blanca + A Bocajarro'), 'Falta mención de la sinergia prioritaria canónica')
})

// ====================================================================
// 11-15: PRESERVACIÓN CANÓNICA DE SNEASLER + LIVIANO Y VALIDATOR
// ====================================================================

test(11, 'Knowledge Layer: Sneasler + Liviano preserva Hierba Blanca + A Bocajarro con priority: 1', () => {
  assert(knowledgeCode.includes("applicablePokemon: ['Sneasler', 'Hawlucha']"), 'Falta aplicabilidad de Sneasler en synergy')
  assert(knowledgeCode.includes('priority: 1'), 'Sinergia canónica no tiene priority 1')
  assert(knowledgeCode.includes('featured: true'), 'Sinergia canónica no está marcada como featured')
})

test(12, 'Fact Validator: conserva la garantía de inyección/promoción de Hierba Blanca + A Bocajarro en strategies[0]', () => {
  assert(validatorCode.includes('prioritySynergy'), 'Falta prioritySynergy en factValidator')
  assert(validatorCode.includes('Hierba Blanca') && validatorCode.includes('A Bocajarro'), 'Falta matching de sinergia en validator')
  assert(validatorCode.includes('filtered.unshift'), 'Validator no garantiza strategies[0]')
})

test(13, 'Fact Validator: corrección de sobreafirmaciones absolutas sigue activa', () => {
  assert(validatorCode.includes('es la única forma') || validatorCode.includes('[uú]nica\\s+(?:forma|manera|estrategia)'), 'Falta regla anti "la única forma"')
  assert(validatorCode.includes('siempre es el mejor') || validatorCode.includes('siempre\\s+es'), 'Falta regla anti "siempre es el mejor"')
  assert(validatorCode.includes('obligatorio'), 'Falta regla anti "es obligatorio"')
})

test(14, 'Prompt Master: regla universal contra flechas y reglas factuales conservadas', () => {
  assert(promptCode.includes('NUNCA uses cadenas de flechas'), 'Prompt Master perdió regla anti-flechas')
  assert(promptCode.includes('DISTINCIÓN ESTRICTA DE VELOCIDAD'), 'Prompt Master perdió regla de distinción de velocidad')
  assert(promptCode.includes('FILOSOFÍA DE ANÁLISIS PROGRESIVO'), 'Prompt Master perdió filosofía progresiva')
})

test(15, 'Prompt Competitive: ejemplo de precisión Fase 2.3 presente, sin inventar números y con distinción de prioridad', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(
    compSection.includes('EJEMPLO DE PRECISIÓN MECÁNICA (Fase 2.3)'),
    'Falta ejemplo de precisión mecánica de Fase 2.3',
  )
  assert(
    compSection.includes('mejorando su capacidad de actuar antes en el orden basado en Velocidad'),
    'Ejemplo no describe la ventaja de Velocidad de forma mecánica y condicional',
  )
  assert(
    compSection.includes('operan mediante prioridad +1, no mediante comparación de Velocidad'),
    'Ejemplo no distingue prioridad de Velocidad para Golpe Bajo',
  )
  assert(
    !compSection.includes('benchmarks relevantes'),
    'Ejemplo sigue usando la expresión vaga previa "benchmarks relevantes"',
  )
})

test(16, 'Prompt Competitive: 4 criterios obligatorios para el valor competitivo y fallback condicional', () => {
  const compSection = promptCode.slice(promptCode.indexOf("userLevel === 'competitive'"), promptCode.indexOf("return `\n[CONTEXTO DEL ANÁLISIS]"))
  assert(compSection.includes('CRITERIOS OBLIGATORIOS PARA EL VALOR COMPETITIVO'), 'Falta sección de criterios de valor competitivo')
  assert(compSection.includes('Qué ventaja concreta proporciona la habilidad'), 'Falta criterio 1: ventaja concreta')
  assert(compSection.includes('Bajo qué condición exacta se obtiene'), 'Falta criterio 2: condición exacta')
  assert(compSection.includes('Qué tipo de situación competitiva aprovecha'), 'Falta criterio 3: situación competitiva')
  assert(compSection.includes('Qué formas de counterplay pueden limitarla'), 'Falta criterio 4: counterplay')
  assert(compSection.includes('NO utilices afirmaciones como "supera a muchos rivales"'), 'Falta directriz anti-frases vagas')
  assert(compSection.includes('describe la ventaja de forma estrictamente mecánica y condicional'), 'Falta regla de fallback mecánico y condicional')
})

console.log()
console.log('='.repeat(70))
console.log(`🏁 RESULTADO: ${passed} PASADOS, ${failed} FALLIDOS (Total: ${passed + failed})`)
console.log('='.repeat(70))

if (failed > 0) {
  process.exit(1)
} else {
  console.log('🎉 ¡Todos los tests de precisión competitiva pasaron exitosamente!')
}
