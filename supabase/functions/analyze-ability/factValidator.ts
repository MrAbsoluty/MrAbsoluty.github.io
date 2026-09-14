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

  return {
    valid: violations.length === 0,
    correctedResult: corrected,
    violationsFound: violations,
    wasCorrected: violations.length > 0,
  }
}
