import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

async function run() {
  console.log('Downloading Showdown learnsets and pokedex data...')
  const [learnsetsRaw, pokedexRaw] = await Promise.all([
    fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/learnsets.ts').then((r) => r.text()),
    fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts').then((r) => r.text()),
  ])

  console.log('Parsing pokedex...')
  const pokedex = new Function(pokedexRaw.replace(/export const Pokedex[^{]*=/, 'const Pokedex =') + '; return Pokedex;')()
  console.log('Parsing learnsets...')
  const learnsets = new Function(learnsetsRaw.replace(/export const Learnsets[^{]*=/, 'const Learnsets =') + '; return Learnsets;')()

  // 1. Construir metadatos de las 1025 especies canónicas
  const speciesMap = {}
  for (const [key, data] of Object.entries(pokedex)) {
    if (data.num > 0 && data.num <= 1025 && !data.forme && !data.baseSpecies) {
      speciesMap[key] = {
        id: data.num,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        types: data.types.map((t) => t.toLowerCase()),
        prevo: data.prevo ? data.prevo.toLowerCase().replace(/[^a-z0-9]/g, '') : null,
        evos: data.evos || [],
      }
    }
  }

  const pokemonMetadata = {}
  for (const [key, sp] of Object.entries(speciesMap)) {
    let curr = sp
    let stage = 1
    while (curr.prevo && speciesMap[curr.prevo]) {
      curr = speciesMap[curr.prevo]
      stage++
    }
    const isFinal = !sp.evos || sp.evos.length === 0
    pokemonMetadata[sp.id] = {
      name: sp.name,
      types: sp.types,
      family: curr.id,
      stage,
      isFinal,
    }
  }

  // 2. Extraer aprendices naturales por movimiento
  // Formato compacto: { [moveKey]: { [pokemonId]: "L7" | "E3" | "T2" } }
  const moveNaturalLearners = {}

  for (const [pKey, sp] of Object.entries(speciesMap)) {
    const pLearn = learnsets[pKey]?.learnset
    if (!pLearn) continue

    for (const [mKey, codes] of Object.entries(pLearn)) {
      let levelUpGens = 0
      let eggGens = 0
      let tutorGens = 0

      for (const code of codes) {
        if (code.includes('L')) levelUpGens++
        else if (code.includes('E')) eggGens++
        else if (code.includes('T')) tutorGens++
      }

      if (levelUpGens > 0 || eggGens > 0 || tutorGens > 0) {
        if (!moveNaturalLearners[mKey]) {
          moveNaturalLearners[mKey] = {}
        }
        if (levelUpGens > 0) {
          moveNaturalLearners[mKey][sp.id] = `L${levelUpGens}`
        } else if (eggGens > 0) {
          moveNaturalLearners[mKey][sp.id] = `E${eggGens}`
        } else if (tutorGens > 0) {
          moveNaturalLearners[mKey][sp.id] = `T${tutorGens}`
        }
      }
    }
  }

  console.log('Writing src/data/pokemonMetadata.js...')
  const metaOut = `/**
 * Metadatos canónicos de Pokémon (1-1025): tipos, familias evolutivas y etapas.
 * Generado de forma determinista para la selección de Pokémon representativos en PokeGuide.
 */
export const POKEMON_METADATA = ${JSON.stringify(pokemonMetadata, null, 2)}
`
  fs.writeFileSync(path.join(ROOT, 'src/data/pokemonMetadata.js'), metaOut, 'utf-8')

  console.log('Writing src/data/moveNaturalLearners.js...')
  const learnOut = `/**
 * Índice determinista de aprendices naturales por movimiento.
 * L = level-up, E = egg, T = tutor; número = generaciones históricas.
 */
export const MOVE_NATURAL_LEARNERS = ${JSON.stringify(moveNaturalLearners, null, 2)}
`
  fs.writeFileSync(path.join(ROOT, 'src/data/moveNaturalLearners.js'), learnOut, 'utf-8')

  console.log('Done! Generated metadata for', Object.keys(pokemonMetadata).length, 'species and', Object.keys(moveNaturalLearners).length, 'moves.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
