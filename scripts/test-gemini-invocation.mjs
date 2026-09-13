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
    abilities: ['white-smoke', 'drought', 'shell-armor']
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

console.log('Testing Edge Function with Gemini (AI_PROVIDER=gemini)...')
const start = Date.now()
const { data, error } = await supabase.functions.invoke('analyze-ability', {
  body: torkoalPayload
})
const duration = Date.now() - start

if (error) {
  console.error(`❌ Gemini test failed (${duration}ms):`, error)
} else {
  console.log(`✅ Gemini test SUCCESS in ${duration}ms (HTTP 200)`)
  console.log(`   Provider: ${data.metadata?.provider} (Model: ${data.metadata?.model})`)
  console.log(`   Rating: ${data.data?.rating?.score}/10 (${data.data?.rating?.label})`)
  console.log(`   Summary: "${data.data?.summary?.slice(0, 100)}..."`)
  console.log(`   Keys count: ${Object.keys(data.data || {}).length}`)
}
