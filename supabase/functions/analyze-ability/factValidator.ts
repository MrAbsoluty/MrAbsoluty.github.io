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
 * Patrones de corrección para afirmaciones incorrectas sobre counterplay, prioridad
 * y mecánicas de orden aplicables a Liviano (Unburden).
 * Se aplica solo cuando facts.name === 'unburden'.
 */
const UNBURDEN_COUNTERPLAY_PATTERNS: Array<{ regex: RegExp; replacement: string; description: string }> = [
  // ── Golpe Bajo / Sucker Punch: prioridad ≠ velocidad ──
  {
    regex: /\bgolpe\s+bajo\s+(?:supera|es\s+m[aá]s\s+r[aá]pido\s+que|contrarresta\s+la\s+velocidad\s+de|neutraliza\s+la\s+velocidad\s+de)\b/gi,
    replacement: 'Golpe Bajo actúa antes por su prioridad +1, independientemente de la Velocidad de',
    description: 'Error: Golpe Bajo descrito como ventaja de Velocidad en vez de prioridad',
  },
  {
    regex: /\bsucker\s+punch\s+(?:supera|is\s+faster\s+than|counters?\s+the\s+speed\s+of|neutralizes?\s+the\s+speed\s+of)\b/gi,
    replacement: 'Sucker Punch acts first via priority +1, regardless of the Speed of',
    description: 'Error (EN): Sucker Punch described as Speed advantage instead of priority',
  },
  {
    regex: /\bgolpe\s+bajo\s+siempre\s+golpea\s+primero\b/gi,
    replacement: 'Golpe Bajo actúa antes que movimientos de prioridad inferior, pero solo si el objetivo va a usar un movimiento de daño directo ese turno',
    description: 'Absoluto incorrecto: Golpe Bajo no siempre golpea primero (tiene condición)',
  },
  {
    regex: /\bsucker\s+punch\s+always\s+(?:goes|hits)\s+first\b/gi,
    replacement: 'Sucker Punch acts before lower-priority moves, but only if the target is using a direct-damage move that turn',
    description: 'Absolute incorrect (EN): Sucker Punch does not always go first (has condition)',
  },
  // ── Trick Room / Espacio Raro: no desactiva ni anula Liviano ──
  {
    regex: /\b(?:espacio\s+raro|trick\s+room)\s+(?:desactiva|anula|cancela|elimina|bloquea|impide)\s+(?:liviano|unburden)\b/gi,
    replacement: 'Espacio Raro convierte la Velocidad elevada en desventaja táctica mientras está activo, pero Liviano sigue activo',
    description: 'Error: Trick Room descrito como desactivación de Liviano',
  },
  {
    regex: /\b(?:trick\s+room|espacio\s+raro)\s+(?:disables?|negates?|cancels?|removes?|blocks?|prevents?)\s+(?:liviano|unburden)\b/gi,
    replacement: 'Trick Room makes high Speed a tactical disadvantage while active, but Unburden remains active',
    description: 'Error (EN): Trick Room described as disabling Unburden',
  },
  {
    regex: /\b(?:espacio\s+raro|trick\s+room)\s+(?:reduce|disminuye|baja)\s+(?:la\s+)?velocidad\b/gi,
    replacement: 'Espacio Raro altera el orden de acción basado en Velocidad (los Pokémon más lentos actúan primero dentro de su nivel de prioridad)',
    description: 'Error: Trick Room descrito como reducción de Velocidad',
  },
  {
    regex: /\btrick\s+room\s+(?:reduces?|lowers?)\s+speed\b/gi,
    replacement: 'Trick Room reverses the Speed-based action order within each priority tier (slower Pokémon act first)',
    description: 'Error (EN): Trick Room described as reducing Speed stat',
  },
  // ── Globo Helio: no es activador universal ni garantizado ──
  {
    regex: /\bglobo\s+helio\s+(?:siempre|garantiza)\s+(?:activa|activar|activación)\s+(?:liviano|unburden)\b/gi,
    replacement: 'el Globo Helio puede activar Liviano al perderse cuando es golpeado por un ataque, si era el objeto equipado',
    description: 'Absoluto incorrecto: Globo Helio no siempre activa Liviano',
  },
  {
    regex: /\bair\s+balloon\s+(?:always|guarantees)\s+(?:activates?|triggers?)\s+(?:unburden|liviano)\b/gi,
    replacement: 'Air Balloon can trigger Unburden when it bursts upon taking damage, if it was the held item',
    description: 'Absolute incorrect (EN): Air Balloon does not always activate Unburden',
  },
  // ── Desarme / Knock Off: no impide Liviano ──
  {
    regex: /\bdesarme\s+(?:impide|bloquea|evita|cancela|anula)\s+(?:liviano|unburden)\b/gi,
    replacement: 'Desarme puede provocar la pérdida del objeto antes de lo planeado, activando Liviano en ese momento si el Pokémon llevaba un objeto',
    description: 'Error: Desarme descrito como bloqueo de Liviano',
  },
  {
    regex: /\bknock\s+off\s+(?:prevents?|blocks?|stops?|negates?|cancels?)\s+(?:unburden|liviano)\b/gi,
    replacement: 'Knock Off can cause the item to be lost earlier than planned, activating Unburden at that moment if the Pokémon was holding an item',
    description: 'Error (EN): Knock Off described as blocking Unburden',
  },
  // ── Absolutos no respaldados (extensión del UNBURDEN_CORRECTION_PATTERNS) ──
  {
    regex: /\bgarantiza\s+(?:la\s+)?activaci[oó]n\s+(?:de\s+)?liviano\b/gi,
    replacement: 'puede activar Liviano bajo las condiciones de pérdida o consumo del objeto',
    description: 'Absoluto: "garantiza la activación de Liviano" no está respaldado',
  },
  {
    regex: /\bguarantees?\s+(?:the\s+)?activation\s+of\s+unburden\b/gi,
    replacement: 'can activate Unburden under item loss or consumption conditions',
    description: 'Absolute (EN): "guarantees activation of Unburden" not supported',
  },
  {
    regex: /\bextremadamente\s+r[aá]pido\b/gi,
    replacement: 'más rápido que rivales que dependían de su Velocidad natural para actuar primero',
    description: 'Hipérbole: "extremadamente rápido" reemplazado por formulación mecánica condicional',
  },
  {
    regex: /\bextremely\s+fast\b/gi,
    replacement: 'faster than opponents relying on their natural Speed to act first',
    description: 'Hyperbole (EN): "extremely fast" replaced with conditional mechanical phrasing',
  },
  {
    regex: /\b(?:mucho[sa]?|much[ao]s?)\s+(?:rival|oponente|pok[eé]mon)[es]?\b/gi,
    replacement: 'amenazas que dependen de su Velocidad natural para actuar primero',
    description: 'Vaguedad: "muchos rivales/oponentes" reemplazado por formulación mecánica condicional',
  },
]

/**
 * Patrones de corrección para errores factuales de movimientos y objetos (Fase 2.5).
 */
export const MOVE_ITEM_CORRECTION_PATTERNS: Array<{ regex: RegExp; replacement: string; description: string }> = [
  // 1. Gigadrenado no requiere carga
  {
    regex: /\b(?:gigadrenado|giga drain)[^.\n,;]*(?:necesita|requiere|tiene)\s+(?:un\s+)?(?:turno\s+de\s+)?carga\b/gi,
    replacement: 'Gigadrenado no requiere carga (ataca en un solo turno y recupera PS basado en el daño infligido)',
    description: 'Error factual: Gigadrenado no es un movimiento de carga',
  },
  {
    regex: /\b(?:giga drain)[^.\n,;]*(?:requires|needs)\s+(?:a\s+)?charge(?:\s+turn)?\b/gi,
    replacement: 'Giga Drain does not require a charge turn',
    description: 'Factual error: Giga Drain does not require a charge turn',
  },
  // 2. Rayo Solar siempre requiere carga (falso en Sol o con Hierba Única)
  {
    regex: /\b(?:rayo solar|solar beam)\s+siempre\s+(?:necesita|requiere)\s+(?:un\s+)?(?:turno\s+de\s+)?carga\b/gi,
    replacement: 'Rayo Solar requiere un turno de carga salvo bajo clima de Sol o con Hierba Única',
    description: 'Error factual: Rayo Solar omite la carga bajo Sol o con Hierba Única',
  },
  {
    regex: /\b(?:solar beam)\s+always\s+(?:requires|needs)\s+(?:a\s+)?charge(?:\s+turn)?\b/gi,
    replacement: 'Solar Beam requires a charge turn unless Sun or Power Herb is active',
    description: 'Factual error: Solar Beam skips charge under Sun or Power Herb',
  },
  // 3. Gigadrenado cura sin daño
  {
    regex: /\b(?:gigadrenado|giga drain)\s+(?:cura|recupera\s+ps)\s+sin\s+(?:hacer|causar|infligir)\s+daño\b/gi,
    replacement: 'Gigadrenado recupera PS proporcionalmente al daño infligido al objetivo (50% del daño)',
    description: 'Error factual: Gigadrenado recupera PS en base al daño realizado',
  },
  {
    regex: /\b(?:giga drain)\s+heals\s+without\s+dealing\s+damage\b/gi,
    replacement: 'Giga Drain restores HP proportionally to the damage dealt',
    description: 'Factual error: Giga Drain heals based on damage dealt',
  },
  // 4. Hierba Blanca aumenta directamente la velocidad
  {
    regex: /\b(?:la\s+)?(?:hierba blanca|white herb)\s+(?:aumenta|duplica|incrementa)\s+(?:directamente\s+)?(?:la\s+)?velocidad\b/gi,
    replacement: 'la Hierba Blanca restaura las defensas y se consume, siendo su pérdida lo que activa Liviano para duplicar la Velocidad',
    description: 'Error de causalidad: la Hierba Blanca restaura stats y se consume; el consumo es lo que activa Liviano',
  },
  {
    regex: /\b(?:white herb)\s+(?:directly\s+)?(?:increases|doubles|boosts)\s+speed\b/gi,
    replacement: 'White Herb restores stat drops and is consumed, triggering Unburden to double Speed',
    description: 'Causality error: White Herb restores drops and consumes, which triggers Unburden',
  },
  // 5. Espacio Raro desactiva Liviano
  {
    regex: /\b(?:espacio raro|trick room)\s+(?:desactiva|anula|cancela|elimina)\s+(?:a\s+)?(?:liviano|unburden)\b/gi,
    replacement: 'Espacio Raro no desactiva Liviano, sino que invierte el orden de actuación basado en Velocidad',
    description: 'Error conceptual: Espacio Raro no desactiva Liviano',
  },
  {
    regex: /\b(?:trick room)\s+(?:disables|cancels|nullifies)\s+unburden\b/gi,
    replacement: 'Trick Room inverts turn order based on Speed without disabling Unburden',
    description: 'Conceptual error: Trick Room does not disable Unburden',
  },
  // 6. Espacio Raro elimina la duplicación de Velocidad
  {
    regex: /\b(?:espacio raro|trick room)\s+(?:elimina|quita|borra)\s+(?:la\s+duplicaci[oó]n|el\s+aumento|el\s+boost)\s+de\s+velocidad\b/gi,
    replacement: 'Espacio Raro conserva la Velocidad duplicada pero hace que los Pokémon más lentos actúen primero',
    description: 'Error conceptual: Espacio Raro no borra el stat de Velocidad',
  },
  {
    regex: /\b(?:trick room)\s+(?:removes|eliminates)\s+(?:the\s+)?(?:speed\s+boost|speed\s+duplication)\b/gi,
    replacement: 'Trick Room keeps the Speed boost while causing slower Pokémon to act first',
    description: 'Conceptual error: Trick Room keeps the Speed stat while inverting order',
  },
  // 7. Desarme impide / cancela Liviano
  {
    regex: /\b(?:desarme|knock off)\s+(?:impide|cancela|bloquea|evita\s+que\s+se\s+active)\s+(?:a\s+)?(?:liviano|unburden)\b/gi,
    replacement: 'Desarme no impide Liviano; al remover el objeto equipado, activa la duplicación de Velocidad',
    description: 'Error de interacción: Desarme activa Liviano al eliminar el objeto',
  },
  {
    regex: /\b(?:knock off)\s+(?:prevents|cancels|blocks)\s+unburden\b/gi,
    replacement: 'Knock Off does not prevent Unburden; removing the item triggers the ability',
    description: 'Interaction error: Knock Off triggers Unburden by removing item',
  },
  // 8. Golpe Bajo es más rápido por Velocidad
  {
    regex: /\b(?:golpe bajo|sucker punch)\s+(?:es\s+m[aá]s\s+r[aá]pido|supera\s+(?:en|la)\s+velocidad)\s+(?:que|a)\s+sneasler\b/gi,
    replacement: 'Golpe Bajo actúa antes por su prioridad +1 (no por superar a Sneasler en Velocidad)',
    description: 'Error de orden: Golpe Bajo actúa antes por prioridad, no por Velocidad',
  },
  {
    regex: /\b(?:sucker punch)\s+(?:is\s+faster\s+than|outspeeds)\s+sneasler\b/gi,
    replacement: 'Sucker Punch acts first due to +1 priority, not by outspeeding Sneasler',
    description: 'Ordering error: Sucker Punch acts first via priority',
  },
  // 9. Golpe Bajo siempre ataca primero
  {
    regex: /\b(?:golpe bajo|sucker punch)\s+siempre\s+(?:ataca|golpea|act[uú]a)\s+primero\b/gi,
    replacement: 'Golpe Bajo puede actuar antes por su prioridad +1 siempre que el rival use un ataque de daño directo',
    description: 'Error absoluto: Golpe Bajo solo tiene éxito si el objetivo ataca',
  },
  {
    regex: /\b(?:sucker punch)\s+always\s+(?:attacks|strikes|goes)\s+first\b/gi,
    replacement: 'Sucker Punch can strike first via +1 priority provided the target selects an attack',
    description: 'Absolute error: Sucker Punch requires the target to attack',
  },
]

/**
 * Aplica correcciones deterministas sobre un string si viola hechos verificados.
 */
function correctText(text: string, facts: VerifiedAbilityFacts, violations: string[]): string {
  if (!text || typeof text !== 'string') return text

  let cleaned = text

  // 1. Correcciones factuales generales de movimientos y objetos (Fase 2.5)
  for (const rule of MOVE_ITEM_CORRECTION_PATTERNS) {
    if (rule.regex.test(cleaned)) {
      violations.push(`${rule.description}: "${rule.regex.source}"`)
      cleaned = cleaned.replace(rule.regex, rule.replacement)
    }
  }

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

  // 4. Si la habilidad es Liviano (Unburden), corregir afirmaciones incorrectas
  //    sobre counterplay, prioridad y mecánicas de orden (Golpe Bajo, Trick Room, etc.)
  if (facts.name === 'unburden') {
    for (const rule of UNBURDEN_COUNTERPLAY_PATTERNS) {
      if (rule.regex.test(cleaned)) {
        violations.push(`${rule.description}: "${rule.regex.source}"`)
        cleaned = cleaned.replace(rule.regex, rule.replacement)
      }
    }
  }

  // 5. Comprobar lista explícita de prohibitedClaims
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
        } else if (idx === -1) {
          // Si la IA no la incluyó (ya sea con strategies vacío o con otras estrategias),
          // inyectar la sinergia canónica prioritaria en la primera posición.
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
