import { getMove } from '../src/services/pokeapi.js'

async function checkRaw() {
  const res = await fetch('https://pokeapi.co/api/v2/move/psychic')
  const data = await res.json()
  const en = data.effect_entries.find(e => e.language.name === 'en')
  console.log('raw psychic effect_chance:', data.effect_chance)
  console.log('raw psychic short_effect:', en.short_effect)
  console.log('raw psychic effect:', en.effect)

  const ftRes = await fetch('https://pokeapi.co/api/v2/move/flamethrower')
  const ftData = await ftRes.json()
  const ftEn = ftData.effect_entries.find(e => e.language.name === 'en')
  console.log('raw flamethrower effect_chance:', ftData.effect_chance)
  console.log('raw flamethrower short_effect:', ftEn.short_effect)
}

checkRaw().catch(console.error)
