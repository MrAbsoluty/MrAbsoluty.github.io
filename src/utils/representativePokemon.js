import { POKEMON_METADATA } from '../data/pokemonMetadata.js'
import { MOVE_NATURAL_LEARNERS } from '../data/moveNaturalLearners.js'

const METHOD_PRIORITY = {
  'level-up': 4,
  egg: 3,
  tutor: 2,
  machine: 1,
}

/**
 * Normaliza los argumentos para admitir tanto:
 *   selectRepresentativePokemon({ move, learners, limit })
 * como:
 *   selectRepresentativePokemon(move, learners, { limit })
 */
function parseArgs(arg1, arg2, arg3) {
  if (arg1 && typeof arg1 === 'object' && ('move' in arg1 || 'learners' in arg1)) {
    return {
      move: arg1.move,
      learners: arg1.learners || arg1.move?.learnedBy || [],
      limit: typeof arg1.limit === 'number' ? arg1.limit : 4,
    }
  }
  return {
    move: arg1,
    learners: arg2 || arg1?.learnedBy || [],
    limit: typeof arg3?.limit === 'number' ? arg3.limit : 4,
  }
}

/**
 * Selecciona de forma determinista y reproducible los Pokémon representativos
 * para un movimiento dado, basándose en métodos de aprendizaje reales, STAB,
 * consistencia histórica entre generaciones y diversidad de líneas evolutivas.
 *
 * @param {Object} params
 * @param {Object} params.move Datos del movimiento (debe incluir type y name)
 * @param {Array} params.learners Lista completa de Pokémon compatibles (learnedBy)
 * @param {number} [params.limit=4] Cantidad máxima de representantes a seleccionar
 * @returns {Array} Lista ordenada de Pokémon representativos
 */
export function selectRepresentativePokemon(arg1, arg2, arg3) {
  const { move, learners, limit } = parseArgs(arg1, arg2, arg3)

  if (!move || !Array.isArray(learners) || learners.length === 0) {
    return []
  }

  const moveType = String(move.type || '').toLowerCase().trim()
  const moveKey = String(move.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const naturalLearnersMap = MOVE_NATURAL_LEARNERS[moveKey] || {}

  // Filtrar candidatos válidos de la Pokédex Nacional (1-1025)
  const validLearners = learners.filter((p) => p && p.id && p.id > 0 && p.id <= 1025)
  if (validLearners.length === 0) {
    return []
  }

  // Scoring determinista de cada candidato
  const scoredCandidates = validLearners.map((pokemon) => {
    const id = pokemon.id
    const meta = POKEMON_METADATA[id] || {
      name: pokemon.name,
      types: [],
      family: id,
      stage: 1,
      isFinal: true,
    }

    const naturalCode = naturalLearnersMap[id] || null
    let methodType = 'machine'
    let naturalGens = 0

    if (naturalCode) {
      const codeType = naturalCode[0]
      naturalGens = Number(naturalCode.slice(1)) || 1
      if (codeType === 'L') {
        methodType = 'level-up'
      } else if (codeType === 'E') {
        methodType = 'egg'
      } else if (codeType === 'T') {
        methodType = 'tutor'
      }
    }

    // 1. Criterio Método de Aprendizaje & Consistencia
    let methodScore = 5
    if (methodType === 'level-up') {
      methodScore = 60 + Math.min(naturalGens * 3, 25)
    } else if (methodType === 'egg' || methodType === 'tutor') {
      methodScore = 25 + Math.min(naturalGens * 2, 10)
    }

    // 2. Criterio STAB
    const hasStab = meta.types.includes(moveType)
    const stabScore = hasStab ? 40 : 0

    // 3. Ponderación de etapa evolutiva (favorece forma final para representatividad)
    const stageScore = meta.isFinal ? 3 : meta.stage > 1 ? 1 : 0

    const totalScore = methodScore + stabScore + stageScore

    return {
      id,
      name: pokemon.name,
      types: meta.types,
      familyRoot: meta.family || id,
      score: totalScore,
      methodType,
      naturalGens,
      isFinal: meta.isFinal,
      isStab: hasStab,
    }
  })

  // Ordenamiento determinista (sin Math.random)
  scoredCandidates.sort((a, b) => {
    // 1. Mayor score total
    if (b.score !== a.score) {
      return b.score - a.score
    }
    // 2. Prioridad de método de aprendizaje (level-up > egg > tutor > machine)
    const prioA = METHOD_PRIORITY[a.methodType] || 0
    const prioB = METHOD_PRIORITY[b.methodType] || 0
    if (prioB !== prioA) {
      return prioB - prioA
    }
    // 3. Cantidad de generaciones en las que aprende naturalmente
    if (b.naturalGens !== a.naturalGens) {
      return b.naturalGens - a.naturalGens
    }
    // 4. Preferencia de forma final dentro del empate
    if (a.isFinal !== b.isFinal) {
      return (b.isFinal ? 1 : 0) - (a.isFinal ? 1 : 0)
    }
    // 5. Desempate final determinista: menor ID de Pokédex Nacional
    return a.id - b.id
  })

  // Criterio de Diversidad de Líneas Evolutivas:
  // Máximo 1 representante por línea evolutiva hasta llenar el cupo
  const selected = []
  const usedFamilies = new Set()

  for (const candidate of scoredCandidates) {
    if (!usedFamilies.has(candidate.familyRoot)) {
      usedFamilies.add(candidate.familyRoot)
      selected.push(candidate)
      if (selected.length >= limit) {
        break
      }
    }
  }

  // Si no se alcanzó el límite por falta de familias distintas, permitir miembros adicionales de fallback
  if (selected.length < limit && selected.length < scoredCandidates.length) {
    const selectedIds = new Set(selected.map((s) => s.id))
    for (const candidate of scoredCandidates) {
      if (!selectedIds.has(candidate.id)) {
        selectedIds.add(candidate.id)
        selected.push(candidate)
        if (selected.length >= limit) {
          break
        }
      }
    }
  }

  return selected
}

// Alias requerido para coherencia arquitectónica
export const getRepresentativePokemon = selectRepresentativePokemon
