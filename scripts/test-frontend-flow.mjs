import { analyzeAbility } from './src/services/pokeguideAI.js'

console.log('Testing frontend service analyzeAbility() with Groq active...')

const payload = {
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

const t0 = Date.now()
const result = await analyzeAbility(payload)
const elapsed = Date.now() - t0

console.log(`Execution time: ${elapsed}ms`)
console.log('Result success:', result.success)
if (result.success) {
  console.log('Provider in metadata:', result.metadata?.provider)
  console.log('Model in metadata:', result.metadata?.model)
  console.log('Rating:', result.data?.rating)
  console.log('Summary:', result.data?.summary)
  console.log('Strengths:', result.data?.strengths?.length)
  console.log('Weaknesses:', result.data?.weaknesses?.length)
  console.log('Synergies:', result.data?.synergies?.length)
  console.log('Competitive tip:', result.data?.competitiveTip)
} else {
  console.error('Failed:', result.error, result.code)
}
