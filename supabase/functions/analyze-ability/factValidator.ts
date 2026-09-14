/**
 * factValidator.ts
 * Validador determinista de hechos objetivos entre el LLM y el frontend.
 *
 * Principio:
 * "Si una afirmación contradice claramente los hechos proporcionados al modelo,
 * no mostrarla directamente."
 */

import { type VerifiedAbilityFacts } from './knowledgeLayer.ts'

export interface FactValidationResult {
  valid: boolean
  correctedResult: Record<string, unknown>
  violationsFound: string[]
  wasCorrected: boolean
}

/**
 * Patrones de afirmaciones de velocidad que resultan falsas para habilidades
 * que NO modifican la estadística de Velocidad (como Truant, Intimidate, Huge Power).
 */
const FALSE_SPEED_REDUCTION_PATTERNS: Array<{ regex: RegExp; replacement: string; description: string }> = [
  {
    regex: /\b(?:reduce|reduciendo|reduce\s+su)\s+(?:la\s+)?(?:estad[ií]stica\s+de\s+)?velocidad\b/gi,
    replacement: 'reduce su frecuencia de actuación (sin reducir su estadística de Velocidad)',
    description: 'Afirmación errónea de reducción de estadística de Velocidad',
  },
  {
    regex: /\b(?:disminuye|disminuyendo)\s+(?:la\s+)?(?:estad[ií]stica\s+de\s+)?velocidad\b/gi,
    replacement: 'limita sus turnos de actuación (sin alterar su Velocidad base)',
    description: 'Afirmación errónea de disminución de Velocidad',
  },
  {
    regex: /\b(?:baja|bajando)\s+(?:la\s+)?velocidad\b/gi,
    replacement: 'restringe sus turnos de ataque',
    description: 'Afirmación errónea de bajada de Velocidad',
  },
  {
    regex: /\bpenalizaci[oó]n\s+(?:en|de)\s+velocidad\b/gi,
    replacement: 'penalización en frecuencia de turnos',
    description: 'Afirmación de penalización de Velocidad',
  },
  {
    regex: /\bp[eé]rdida\s+de\s+velocidad\b/gi,
    replacement: 'pérdida de turnos activos',
    description: 'Afirmación de pérdida de Velocidad',
  },
  {
    regex: /\breducci[oó]n\s+de\s+velocidad\b/gi,
    replacement: 'restricción de turnos',
    description: 'Afirmación de reducción de Velocidad',
  },
  {
    regex: /\bhace\s+que\s+(?:sea\s+)?m[aá]s\s+lento(?:\s+en\s+velocidad)?\b/gi,
    replacement: 'le impide atacar de forma continua',
    description: 'Afirmación de lentitud en Velocidad',
  },
  {
    regex: /\blowers?\s+(?:its\s+)?speed\b/gi,
    replacement: 'skips alternate turns without lowering Speed',
    description: 'English claim of lowering speed',
  },
  {
    regex: /\breduces?\s+(?:its\s+)?speed\b/gi,
    replacement: 'restricts action frequency without reducing Speed',
    description: 'English claim of reducing speed',
  },
  {
    regex: /\bspeed\s+reduction\b/gi,
    replacement: 'turn limitation',
    description: 'English claim of speed reduction',
  },
]

/**
 * Patrones para eliminar frases ambiguas en Truant (Ausente) como "cada dos turnos".
 * Sustituye deterministamente por "turno por medio" / "turnos alternos".
 */
const AMBIGUOUS_TRUANT_PATTERNS: Array<{ regex: RegExp; replacement: string; description: string }> = [
  {
    regex: /\bcada\s+dos\s+turnos\b/gi,
    replacement: 'turno por medio',
    description: 'Ambigüedad: sustituido "cada dos turnos" por "turno por medio"',
  },
  {
    regex: /\bevery\s+two\s+turns\b/gi,
    replacement: 'every other turn',
    description: 'Ambiguity: replaced "every two turns" with "every other turn"',
  },
]

/**
 * Patrones específicos de corrección para Liviano (Unburden).
 */
const UNBURDEN_CORRECTION_PATTERNS: Array<{ regex: RegExp; replacement: string; description: string }> = [
  {
    regex: /\b(?:se\s+activa\s+(?:al|simplemente\s+por)\s+entrar\s+sin\s+objeto|se\s+activa\s+sin\s+(?:tener\s+)?objeto\s+inicial)\b/gi,
    replacement: 'se activa tras perder o consumir un objeto que esté llevando',
    description: 'Afirmación errónea: Liviano no se activa por entrar sin objeto',
  },
  {
    regex: /\b(?:debe|exige|requiere)\s+(?:haber\s+entrado|tener\s+un\s+objeto)\s+al\s+(?:iniciar|entrar\s+al?)\s+combate\b/gi,
    replacement: 'se activa cuando el Pokémon pierde o consume un objeto que esté llevando',
    description: 'Requisito inicial demasiado estricto: aclarada condición de pérdida/consumo de objeto',
  },
  {
    regex: /\bliviano\s+no\s+tiene\s+efecto\s+si\s+(?:el\s+pok[eé]mon\s+)?entra\s+al\s+combate\s+sin\s+objeto\s+inicial\b/gi,
    replacement: 'entrar al combate sin objeto no activa Liviano por sí solo',
    description: 'Aclaración: entrar sin objeto no activa Liviano por sí solo',
  },
  {
    regex: /\b(?:para\s+el\s+resto\s+del?\s+combate|durante\s+el\s+resto\s+del?\s+combate|hasta\s+el\s+final\s+del?\s+combate)\b/gi,
    replacement: 'mientras permanezca sin objeto',
    description: 'Duración absoluta: reemplazado por "mientras permanezca sin objeto"',
  },
  {
    regex: /\b(?:a\s+)?(?:casi\s+)?cualquier\s+(?:rival|oponente|pok[eé]mon)\b/gi,
    replacement: 'a muchos rivales que antes podían ser más rápidos',
    description: 'Generalización absoluta de velocidad: reemplazado por "a muchos rivales que antes podían ser más rápidos"',
  },
  {
    regex: /\b(?:la\s+)?velocidad\s+extrema\b/gi,
    replacement: 'el aumento de Velocidad de Liviano',
    description: 'Término hiperbólico: reemplazado por "el aumento de Velocidad de Liviano"',
  },
  {
    regex: /\b(?:el\s+)?globo\s+helio\s+se\s+consume\b/gi,
    replacement: 'el Globo Helio se pierde tras recibir un ataque',
    description: 'Afirmación errónea: Globo Helio no se consume, se pierde tras recibir un impacto',
  },
  {
    regex: /\b(?:todas\s+)?las\s+bayas\s+(?:se\s+activan|activan\s+liviano)\s+al\s+bajar\s+(?:del?|de)\s+50\s*%\b/gi,
    replacement: 'las bayas se activan al cumplir su condición específica',
    description: 'Afirmación errónea: no todas las bayas se activan al 50% de PS',
  },
  {
    regex: /\b(?:es\s+)?la\s+[uú]nica\s+(?:forma|manera|estrategia|opci[oó]n)\b/gi,
    replacement: 'una interacción destacada',
    description: 'Sobreafirmación: no es la única forma',
  },
  {
    regex: /\b(?:siempre\s+es|es\s+siempre)\s+el\s+mejor\b/gi,
    replacement: 'es una opción muy destacada',
    description: 'Sobreafirmación: no siempre es el mejor',
  },
  {
    regex: /\b(?:es\s+)?obligatorio(?:\s+para\s+sneasler)?\b/gi,
    replacement: 'muy recomendable',
    description: 'Sobreafirmación: no es obligatorio',
  },
  {
    regex: /\bla\s+mejor\s+estrategia\s+en\s+todos\s+los\s+formatos\b/gi,
    replacement: 'una estrategia destacada en este formato',
    description: 'Sobreafirmación: no es la mejor en todos los formatos',
  },
]

/**
 * Aplica correcciones deterministas sobre un string si viola hechos verificados.
 */
function correctText(text: string, facts: VerifiedAbilityFacts, violations: string[]): string {
  if (!text || typeof text !== 'string') return text

  let cleaned = text

  // 1. Si la habilidad NO reduce Speed, limpiar afirmaciones falsas de velocidad
  if (!facts.speedChanges.affectsSpeedStat) {
    for (const rule of FALSE_SPEED_REDUCTION_PATTERNS) {
      if (rule.regex.test(cleaned)) {
        violations.push(`${rule.description}: "${rule.regex.source}"`)
        cleaned = cleaned.replace(rule.regex, rule.replacement)
      }
    }
  }

  // 2. Si la habilidad tiene ciclo de turnos (ej. Truant), evitar frase ambigua "cada dos turnos"
  if (facts.turnCycle?.hasTurnSkip) {
    for (const rule of AMBIGUOUS_TRUANT_PATTERNS) {
      if (rule.regex.test(cleaned)) {
        violations.push(`${rule.description}: "${rule.regex.source}"`)
        cleaned = cleaned.replace(rule.regex, rule.replacement)
      }
    }
  }

  // 3. Si la habilidad es Liviano (Unburden), aplicar correcciones específicas
  if (facts.name === 'unburden') {
    for (const rule of UNBURDEN_CORRECTION_PATTERNS) {
      if (rule.regex.test(cleaned)) {
        violations.push(`${rule.description}: "${rule.regex.source}"`)
        cleaned = cleaned.replace(rule.regex, rule.replacement)
      }
    }
  }

  // 3. Comprobar lista explícita de prohibitedClaims
  if (Array.isArray(facts.prohibitedClaims)) {
    for (const claim of facts.prohibitedClaims) {
      const claimRegex = new RegExp(`\\b${claim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      if (claimRegex.test(cleaned)) {
        violations.push(`Afirmación prohibida detectada: "${claim}"`)
        cleaned = cleaned.replace(claimRegex, 'efecto no atribuible a la habilidad')
      }
    }
  }

  return cleaned
}

/**
 * Recorre recursivamente un objeto o array y corrige textos que contradigan hechos verificados.
 */
function sanitizeRecursively(
  val: unknown,
  facts: VerifiedAbilityFacts,
  violations: string[],
): unknown {
  if (typeof val === 'string') {
    return correctText(val, facts, violations)
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeRecursively(item, facts, violations))
  }
  if (val && typeof val === 'object') {
    const res: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeRecursively(v, facts, violations)
    }
    return res
  }
  return val
}

/**
 * Valida y armoniza la respuesta del modelo frente a la capa de hechos objetivos.
 */
export function validateAndCorrectFacts(
  parsedJson: Record<string, unknown>,
  facts: VerifiedAbilityFacts,
): FactValidationResult {
  const violations: string[] = []
  const cloned = JSON.parse(JSON.stringify(parsedJson)) as Record<string, unknown>

  // 1. Sanitización profunda de campos de texto
  const corrected = sanitizeRecursively(cloned, facts, violations) as Record<string, unknown>

  // 2. Armonización determinista de puntuación (usa competitiveValue en contrato progresivo, rating en legacy)
  const existingCV = corrected.competitiveValue && typeof corrected.competitiveValue === 'object'
    ? (corrected.competitiveValue as Record<string, unknown>)
    : null
  // Compatibilidad: soportar rating legacy si competitiveValue no existe
  const existingRating = corrected.rating && typeof corrected.rating === 'object'
    ? (corrected.rating as Record<string, unknown>)
    : null
  const ratingTarget = existingCV || existingRating
  const ratingKey = existingCV ? 'competitiveValue' : 'rating'
  const cvSummary = typeof existingCV?.summary === 'string' && existingCV.summary.trim()
    ? existingCV.summary.trim()
    : (facts.deterministicRating
        ? `Tiene un valor competitivo ${facts.deterministicRating.label.toLowerCase()} en este contexto.`
        : 'Tiene un valor competitivo sólido en este contexto.')

  if (facts.deterministicRating) {
    const currentScore = Number(ratingTarget?.score) || 0
    const diff = Math.abs(currentScore - facts.deterministicRating.score)

    if (!ratingTarget || diff > 2) {
      violations.push(
        `Puntuación inconsistente de IA (${currentScore}/10). Normalizada a calificación determinista (${facts.deterministicRating.score}/10).`,
      )
      corrected[ratingKey] = {
        score: facts.deterministicRating.score,
        label: facts.deterministicRating.label,
        source: 'deterministic',
        ...(existingCV ? { summary: cvSummary } : {}),
      }
    } else {
      corrected[ratingKey] = {
        score: ratingTarget.score,
        label: ratingTarget.label,
        source: 'hybrid',
        ...(existingCV ? { summary: cvSummary } : {}),
      }
    }
  } else if (ratingTarget) {
    corrected[ratingKey] = {
      score: ratingTarget.score,
      label: ratingTarget.label,
      source: 'ai',
      ...(existingCV ? { summary: cvSummary } : {}),
    }
  }

  // 3. Garantía para el caso obligatorio de Truant
  if (facts.name === 'truant') {
    // Asegurar que coreInsight (contrato progresivo) o summary (legacy) aclare el ciclo de turnos
    const insightField = typeof corrected.coreInsight === 'string' ? 'coreInsight' : 'summary'
    const insight = String(corrected[insightField] || '')
    if (!insight.toLowerCase().includes('alterno') && !insight.toLowerCase().includes('turno')) {
      corrected[insightField] = `${insight} Actúa en turnos alternos (holgazanea en los turnos pares tras actuar, sin reducir su velocidad base).`.trim()
    }
  }

  // 4. Garantía de sinergias verificadas para Liviano (Unburden)
  if (facts.name === 'unburden') {
    if (Array.isArray(corrected.strategies)) {
      const originalStrategies = corrected.strategies as Array<Record<string, unknown>>

      // 4a. Filtrar estrategias con objetos no sinérgicos (Choice / Life Orb)
      let filtered = originalStrategies.filter((st) => {
        const name = String(st.name || '').toLowerCase()
        const expl = String(st.explanation || '').toLowerCase()
        const isChoiceOrOrb =
          name.includes('choice') ||
          name.includes('cinta elección') ||
          name.includes('gafas elección') ||
          name.includes('pañuelo elección') ||
          name.includes('life orb') ||
          name.includes('vidasfera') ||
          (expl.includes('choice band') && !expl.includes('rival')) ||
          (expl.includes('cinta elección') && !expl.includes('rival'))
        if (isChoiceOrOrb) {
          violations.push(`Estrategia no verificada rechazada para Liviano: "${st.name}"`)
          return false
        }
        return true
      })

      // 4b. Reubicar mecanismos de activación genéricos (bayas, globo helio) a 'alternatives'
      // para no desplazar a la sinergia destacada principal
      const isGenericActivation = (st: Record<string, unknown>) => {
        const name = String(st.name || '').toLowerCase()
        return (
          name.includes('baya') ||
          name.includes('berry') ||
          name.includes('globo helio') ||
          name.includes('air balloon')
        )
      }

      const displacedActivations: Array<Record<string, unknown>> = []
      filtered = filtered.filter((st) => {
        if (isGenericActivation(st)) {
          displacedActivations.push(st)
          violations.push(
            `Mecanismo de activación ("${st.name}") reubicado de 'strategies' a 'alternatives' para preservar la sinergia destacada.`,
          )
          return false
        }
        return true
      })

      // Agregar los mecanismos reubicados a 'alternatives' si no estaban ya presentes
      if (displacedActivations.length > 0) {
        if (!Array.isArray(corrected.alternatives)) {
          corrected.alternatives = []
        }
        const alternatives = corrected.alternatives as Array<Record<string, unknown>>
        for (const act of displacedActivations) {
          const exists = alternatives.some(
            (alt) => String(alt.name || '').toLowerCase() === String(act.name || '').toLowerCase(),
          )
          if (!exists) {
            alternatives.push({
              name: act.name,
              explanation: act.explanation,
            })
          }
        }
      }

      // 4c. Garantizar que la sinergia prioritaria (Hierba Blanca + A Bocajarro) sea strategies[0]
      const prioritySynergy = facts.verifiedSynergies?.find((s) => s.featured || s.priority === 1)
      if (prioritySynergy) {
        const idx = filtered.findIndex((st) => {
          const n = String(st.name || '').toLowerCase()
          return (
            (n.includes('hierba blanca') || n.includes('white herb')) &&
            (n.includes('a bocajarro') || n.includes('close combat'))
          )
        })

        if (idx > 0) {
          // Si estaba en la lista pero no al inicio, moverla al inicio
          const [promoted] = filtered.splice(idx, 1)
          filtered.unshift(promoted)
          violations.push(
            `Sinergia prioritaria "${prioritySynergy.name}" reordenada a primera posición en 'strategies'.`,
          )
        } else if (idx === -1 && filtered.length === 0) {
          // Si la IA no la incluyó pero es la sinergia canónica destacada, garantizarla
          filtered.unshift({
            name: prioritySynergy.name,
            explanation: `Al utilizar ${prioritySynergy.move || 'A Bocajarro'}, el usuario reduce su Defensa y Defensa Especial en un nivel; debido a esto, la ${prioritySynergy.item || 'Hierba Blanca'} restaura inmediatamente esas estadísticas y se consume en el proceso. Como consecuencia de quedar sin objeto, Liviano se activa y duplica la Velocidad mientras permanezca sin objeto.`,
            whyFeatured: prioritySynergy.whyUseful,
          })
          violations.push(
            `Sinergia prioritaria "${prioritySynergy.name}" garantizada como primera estrategia destacada.`,
          )
        }
      }

      corrected.strategies = filtered
    }
  }

  return {
    valid: violations.length === 0,
    correctedResult: corrected,
    violationsFound: violations,
    wasCorrected: violations.length > 0,
  }
}
