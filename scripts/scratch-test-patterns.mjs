// scratch-test-patterns.mjs
const STAT_NAMES_ES = {
  attack: 'el Ataque',
  defense: 'la Defensa',
  'special-attack': 'el Ataque Especial',
  'special-defense': 'la Defensa Especial',
  speed: 'la Velocidad',
  accuracy: 'la Precisión',
  evasion: 'la Evasión',
}

const STAGES_ES = {
  one: 'un nivel',
  two: 'dos niveles',
  three: 'tres niveles',
}

function testPattern(englishText) {
  // Normalizar comillas tipográficas y espacios
  const clean = englishText
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()

  const raiseMatch = clean.match(/raises (?:the )?user's ([a-z\s-]+) by (one|two|three) stages?/i)
  if (raiseMatch) {
    const statKey = raiseMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || raiseMatch[1]
    const stage = STAGES_ES[raiseMatch[2].toLowerCase()] || raiseMatch[2]
    return `Aumenta ${stat} del usuario en ${stage}.`
  }

  const lowerMatch = clean.match(/lowers (?:the )?target's ([a-z\s-]+) by (one|two|three) stages?/i)
  if (lowerMatch) {
    const statKey = lowerMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || lowerMatch[1]
    const stage = STAGES_ES[lowerMatch[2].toLowerCase()] || lowerMatch[2]
    return `Reduce ${stat} del objetivo en ${stage}.`
  }

  // Self drops
  const selfDropMatch = clean.match(/lowers (?:the )?user's ([a-z\s-]+) by (one|two|three) stages? after inflicting damage/i)
  if (selfDropMatch) {
    const statKey = selfDropMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
    const stat = STAT_NAMES_ES[statKey] || selfDropMatch[1]
    const stage = STAGES_ES[selfDropMatch[2].toLowerCase()] || selfDropMatch[2]
    return `Reduce ${stat} del usuario en ${stage} tras causar daño.`
  }

  return null
}

const tests = [
  "Raises the user’s Defense by three stages.", // cotton-guard
  "Raises the user’s Defense by two stages.",   // iron-defense
  "Lowers the target’s Defense by two stages.", // screech
  "Lowers the target’s Defense by one stage.",  // tail-whip
  "Lowers the target’s Special Defense by two stages.", // fake-tears
  "Lowers the target’s Speed by two stages.",   // scary-face
  "Lowers user’s Speed by one stage.",          // hammer-arm
  "Lowers the user’s Special Attack by two stages after inflicting damage.", // overheat, leaf-storm
]

for (const t of tests) {
  console.log(`INPUT:  "${t}"`)
  console.log(`OUTPUT: "${testPattern(t)}"\n`)
}
