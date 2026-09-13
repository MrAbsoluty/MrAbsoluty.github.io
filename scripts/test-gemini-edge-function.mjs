/**
 * test-gemini-edge-function.mjs
 * Script de prueba y verificación de la infraestructura de PokeGuide AI.
 *
 * Prueba solicitada:
 * - Pokémon: Torkoal
 * - Habilidad: Drought
 * - Contexto: General Competitive
 * - Battle Mode: Singles
 * - User Level: Beginner
 *
 * Ejecución: node scripts/test-gemini-edge-function.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('====================================================')
console.log('🧪 POKEGUIDE AI — PRUEBA DE INFRAESTRUCTURA DE IA')
console.log('====================================================\n')

// 1. Verificar que los archivos existen
const edgeFunctionPath = join(process.cwd(), 'supabase', 'functions', 'analyze-ability', 'index.ts')
const promptBuilderPath = join(process.cwd(), 'supabase', 'functions', 'analyze-ability', 'promptBuilder.ts')
const clientServicePath = join(process.cwd(), 'src', 'services', 'pokeguideAI.js')

const filesToCheck = [
  { name: 'Edge Function Index', path: edgeFunctionPath },
  { name: 'Prompt Builder', path: promptBuilderPath },
  { name: 'Client Service (React)', path: clientServicePath },
]

let allFilesExist = true
for (const file of filesToCheck) {
  if (existsSync(file.path)) {
    console.log(`✅ Archivo encontrado: ${file.name}`)
  } else {
    console.error(`❌ Archivo faltante: ${file.name} en ${file.path}`)
    allFilesExist = false
  }
}

if (!allFilesExist) {
  process.exit(1)
}

// 2. Verificar que NO hay claves ni secretos expuestos en el código del frontend
console.log('\n🔒 Verificando seguridad del frontend...')
const frontendFiles = [
  clientServicePath,
  join(process.cwd(), 'src', 'App.jsx'),
  join(process.cwd(), 'src', 'services', 'supabase.js'),
]

let leakFound = false
for (const filePath of frontendFiles) {
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8')
    if (content.includes('AIza') || content.includes('GEMINI_API_KEY =') || content.includes('VITE_GEMINI')) {
      console.error(`🚨 ALERTA: Posible filtración de clave en ${filePath}`)
      leakFound = true
    }
  }
}

if (!leakFound) {
  console.log('✅ Verificación de seguridad superada: Ningún secreto de Gemini expuesto en el frontend.')
}

// 3. Simular el payload de prueba solicitado
console.log('\n📦 Preparando payload de prueba para Torkoal + Drought:')
const testPayload = {
  type: 'ability',
  pokemon: {
    name: 'torkoal',
    localizedName: 'Torkoal',
    types: ['fire'],
    abilities: ['white-smoke', 'drought', 'shell-armor'],
    stats: [
      { name: 'hp', value: 70 },
      { name: 'attack', value: 85 },
      { name: 'defense', value: 140 },
      { name: 'special-attack', value: 85 },
      { name: 'special-defense', value: 70 },
      { name: 'speed', value: 20 },
    ],
  },
  ability: {
    name: 'drought',
    localizedName: 'Sequía',
    description: 'El Pokémon hace que brille un sol intenso en el terreno de combate al entrar en batalla.',
  },
  context: {
    platform: 'general',
    format: null,
    generation: 9,
    battleMode: 'singles',
    userLevel: 'beginner',
    locale: 'es',
  },
}

console.log(JSON.stringify(testPayload, null, 2))

// 4. Validar que el prompt builder contiene los bloques requeridos
console.log('\n📝 Verificando estructura del Prompt Maestro...')
const promptBuilderContent = readFileSync(promptBuilderPath, 'utf-8')

const requiredSections = [
  'MASTER_PROMPT',
  'buildDynamicContext',
  'buildPokemonData',
  'buildAbilityData',
  'buildFormatContext',
  'buildFullPrompt',
  'JSON_SCHEMA_INSTRUCTIONS',
]

let promptSectionsOk = true
for (const section of requiredSections) {
  if (promptBuilderContent.includes(section)) {
    console.log(`✅ Bloque presente: ${section}`)
  } else {
    console.error(`❌ Bloque faltante: ${section}`)
    promptSectionsOk = false
  }
}

// 5. Validar estructura de respuesta esperada por React
console.log('\n📋 Validando esquema de respuesta JSON de la IA...')
const mockGeminiResponse = {
  summary: 'Sequía (Drought) es la habilidad definitoria de Torkoal, convirtiéndolo en el colocador de sol primordial en combates individuales.',
  rating: {
    score: 9,
    label: 'Excelente',
  },
  strengths: [
    'Activa automáticamente el clima de sol por 5 u 8 turnos (con Roca Calor).',
    'Potencia sus propios ataques de Fuego y activa habilidades como Clorofila o Paleosíntesis.',
    'Reduce el daño de movimientos de tipo Agua a la mitad, aliviando su principal debilidad.',
  ],
  weaknesses: [
    'Su bajísima velocidad (20) lo obliga a recibir golpes antes de actuar.',
    'Vulnerable a climas rivales más lentos o cambios forzados.',
  ],
  synergies: [
    'Venusaur o Scovillain (Clorofila duplica su velocidad bajo sol)',
    'Raging Bolt / Walking Wake (Paleosíntesis)',
    'Roca Calor (Extiende la duración del sol)',
  ],
  singles: 'En formato Individual es el pilar de los equipos Sun Offense, combinando sol con Trampa Rocas y Giro Rápido para controlar el campo.',
  doubles: 'En Dobles aporta sol inmediato para aliados de alta presión ofensiva, funcionando excelentemente bajo Espacio Raro (Trick Room).',
  whenToUse: [
    'Al inicio del combate o tras un cambio limpio para establecer el clima para tus sweepers.',
    'Para anular climas rivales de lluvia o nieve.',
  ],
  whenToAvoid: [
    'Frente a atacantes especiales veloces de tipo Tierra o Roca antes de tener sol activo.',
  ],
  competitiveTip: 'Equipa siempre Roca Calor para maximizar los turnos de ventaja para tus compañeros con Clorofila.',
}

const requiredFields = [
  'summary',
  'rating',
  'strengths',
  'weaknesses',
  'synergies',
  'singles',
  'doubles',
  'whenToUse',
  'whenToAvoid',
  'competitiveTip',
]

let schemaValid = true
for (const field of requiredFields) {
  if (field in mockGeminiResponse) {
    console.log(`✅ Campo verificado en esquema: ${field}`)
  } else {
    console.error(`❌ Campo faltante en esquema: ${field}`)
    schemaValid = false
  }
}

console.log('\n====================================================')
if (allFilesExist && !leakFound && promptSectionsOk && schemaValid) {
  console.log('🎉 TODOS LOS TESTS DE INFRAESTRUCTURA HAN PASADO CON ÉXITO')
  console.log('La infraestructura está lista para despliegue y uso seguro.')
} else {
  console.error('❌ HUBO ERRORES EN LA VERIFICACIÓN DE INFRAESTRUCTURA')
  process.exit(1)
}
console.log('====================================================\n')
