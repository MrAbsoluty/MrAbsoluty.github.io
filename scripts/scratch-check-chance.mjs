import { getMove } from '../src/services/pokeapi.js'

async function checkChanceMoves() {
  const listRes = await fetch('https://pokeapi.co/api/v2/move?limit=1000')
  const listData = await listRes.json()
  const moves = listData.results

  const chanceWithPercent = []
  const chanceWithoutPercent = []

  for (let i = 0; i < 200; i++) {
    const res = await fetch(moves[i].url)
    const data = await res.json()
    const en = data.effect_entries?.find(e => e.language.name === 'en')?.short_effect || ''
    if (/has an? \d+% chance/i.test(en)) {
      chanceWithPercent.push({ name: data.name, en, chance: data.effect_chance })
    } else if (/has a chance/i.test(en)) {
      chanceWithoutPercent.push({ name: data.name, en, chance: data.effect_chance })
    }
  }

  console.log(`Moves with % in short_effect: ${chanceWithPercent.length}`)
  console.log(`Moves with 'has a chance' (without %): ${chanceWithoutPercent.length}`)
  console.log('Sample without %:', chanceWithoutPercent.slice(0, 5))
}

checkChanceMoves().catch(console.error)
