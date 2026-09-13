import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)

const torkoalPayload = {
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
      { name: 'speed', value: 20 }
    ]
  },
  ability: {
    name: 'drought',
    localizedName: 'Sequía',
    description: 'El Pokémon hace que brille un sol intenso en el terreno de combate al entrar en batalla.'
  },
  context: {
    platform: 'general',
    battleMode: 'singles',
    userLevel: 'beginner',
    locale: 'es'
  }
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
  'competitiveTip'
]

const results = []

console.log('===========================================================')
console.log('🧪 POKEGUIDE AI — PRUEBA DE 5 INVOCACIONES CONSECUTIVAS (GROQ)')
console.log('===========================================================\n')

for (let i = 1; i <= 5; i++) {
  if (i > 1) {
    await new Promise(r => setTimeout(r, 3000))
  }
  console.log(`---> INVOCACIÓN ${i} / 5...`)
  const start = Date.now()
  const { data, error } = await supabase.functions.invoke('analyze-ability', {
    body: torkoalPayload
  })
  const duration = Date.now() - start

  if (error) {
    let status = 'non-2xx'
    let errorBody = ''
    if (error.context) {
      status = error.context.status
      try {
        errorBody = await error.context.text()
      } catch (e) {
        errorBody = e.message
      }
    }
    console.error(`❌ Invocación ${i} FALLÓ (${duration}ms): HTTP ${status} - ${error.message}`)
    console.error(`   Cuerpo: ${errorBody}`)
    results.push({
      iteration: i,
      success: false,
      status,
      duration,
      error: error.message,
      body: errorBody
    })
  } else {
    // Validate fields
    const missing = requiredFields.filter(f => !(f in (data?.data || {})))
    const hasScore = data?.data?.rating && 'score' in data.data.rating
    const hasLabel = data?.data?.rating && 'label' in data.data.rating

    if (missing.length > 0 || !hasScore || !hasLabel) {
      console.error(`❌ Invocación ${i} incompleta: Faltan campos: ${missing.join(', ')} (score: ${hasScore}, label: ${hasLabel})`)
      results.push({
        iteration: i,
        success: false,
        duration,
        status: 200,
        missing: [...missing, (!hasScore ? 'rating.score' : null), (!hasLabel ? 'rating.label' : null)].filter(Boolean)
      })
    } else {
      console.log(`✅ Invocación ${i} EXITOSA en ${duration}ms (HTTP 200)`)
      console.log(`   Proveedor activo: ${data.metadata?.provider || 'N/A'} (Modelo: ${data.metadata?.model || 'N/A'})`)
      console.log(`   Rating: ${data.data.rating.score}/10 (${data.data.rating.label})`)
      console.log(`   Summary: "${data.data.summary.slice(0, 80)}..."`)
      console.log(`   Strengths (${data.data.strengths.length}), Weaknesses (${data.data.weaknesses.length}), Synergies (${data.data.synergies.length})`)
      console.log(`   Tip: "${data.data.competitiveTip.slice(0, 70)}..."`)
      results.push({
        iteration: i,
        success: true,
        status: 200,
        duration,
        provider: data.metadata?.provider,
        model: data.metadata?.model,
        score: data.data.rating.score,
        label: data.data.rating.label
      })
    }
  }
}

console.log('\n===========================================================')
console.log('RESUMEN DE LAS 5 PRUEBAS:')
const allSuccess = results.every(r => r.success)
console.log(`Total exitosas: ${results.filter(r => r.success).length} / 5`)
console.log(`Estado final: ${allSuccess ? '🎉 TODAS LAS 5 INVOCACIONES FUERON EXITOSAS (100%)' : '❌ HUBO FALLOS'}`)
console.log('===========================================================')
