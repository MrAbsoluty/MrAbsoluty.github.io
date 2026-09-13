/**
 * sanitizePokemonTerms.js
 * Purificador de términos y nombres de Pokémon en español.
 * Corrige errores comunes de traducción automática y alucinaciones de LLMs
 * (ej. "Bolamadrastra" -> "Bola Luminosa", "Orbe de Vida" -> "Vidasfera").
 */

const CANONICAL_REPLACEMENTS = [
  // Objetos emblemáticos
  { pattern: /\bbolamadrastra\b/gi, replacement: 'Bola Luminosa' },
  { pattern: /\bbola\s+madrastra\b/gi, replacement: 'Bola Luminosa' },
  { pattern: /\bbola\s+ligera\b/gi, replacement: 'Bola Luminosa' },
  { pattern: /\borbe\s+(?:de\s+)?vida\b/gi, replacement: 'Vidasfera' },
  { pattern: /\besfera\s+(?:de\s+)?vida\b/gi, replacement: 'Vidasfera' },
  { pattern: /\bbanda\s+(?:de\s+)?elecci[oó]n\b/gi, replacement: 'Cinta Elección' },
  { pattern: /\bbanda\s+elegida\b/gi, replacement: 'Cinta Elección' },
  { pattern: /\bgafas\s+(?:de\s+)?elecci[oó]n\b/gi, replacement: 'Gafas Elección' },
  { pattern: /\bbufanda\s+(?:de\s+)?elecci[oó]n\b/gi, replacement: 'Pañuelo Elección' },
  { pattern: /\bbufanda\s+elegida\b/gi, replacement: 'Pañuelo Elección' },
  { pattern: /\bfaja\s+focus\b/gi, replacement: 'Banda Focus' },
  { pattern: /\bbanda\s+(?:de\s+)?enfoque\b/gi, replacement: 'Banda Focus' },
  { pattern: /\bcinta\s+(?:de\s+)?enfoque\b/gi, replacement: 'Cinta Focus' },
  { pattern: /\bchaleco\s+de\s+asalto\b/gi, replacement: 'Chaleco Asalto' },
  { pattern: /\bbotas\s+(?:de\s+)?trabajo\s+pesado\b/gi, replacement: 'Botas Gruesas' },
  { pattern: /\bbotas\s+pesadas\b/gi, replacement: 'Botas Gruesas' },
  { pattern: /\bcasco\s+rocoso\b/gi, replacement: 'Casco Dentado' },
  { pattern: /\beviolita\b/gi, replacement: 'Mineral Evolutivo' },
  { pattern: /\bmineral\s+(?:de\s+)?evoluci[oó]n\b/gi, replacement: 'Mineral Evolutivo' },
  { pattern: /\broca\s+caliente\b/gi, replacement: 'Roca Calor' },
  { pattern: /\broca\s+h[uú]meda\b/gi, replacement: 'Roca Lluvia' },
  { pattern: /\broca\s+suave\b/gi, replacement: 'Roca Arena' },
  { pattern: /\bdado\s+cargado\b/gi, replacement: 'Dado Trucado' },
  { pattern: /\bcapa\s+encubierta\b/gi, replacement: 'Capa Furtiva' },
  { pattern: /\bglobo\s+(?:de\s+)?aire\b/gi, replacement: 'Globo Helio' },
  { pattern: /\bamuleto\s+claro\b/gi, replacement: 'Amuleto Puro' },
  { pattern: /\bhierba\s+espejo\b/gi, replacement: 'Hierba Copia' },
  { pattern: /\bp[oó]liza\s+(?:de\s+)?debilidad\b/gi, replacement: 'Seguro Debilidad' },
  { pattern: /\bp[oó]liza\s+(?:de\s+)?fallo\b/gi, replacement: 'Seguro Fallo' },
  { pattern: /\bp[oó]liza\s+(?:de\s+)?error\b/gi, replacement: 'Seguro Fallo' },
  { pattern: /\bspray\s+(?:de\s+)?garganta\b/gi, replacement: 'Espray Bucal' },
  { pattern: /\bgafas\s+(?:de\s+)?seguridad\b/gi, replacement: 'Gafas Protectoras' },
  { pattern: /\bcintur[oó]n\s+(?:de\s+)?experto\b/gi, replacement: 'Cinta Experto' },
  { pattern: /\benerg[ií]a\s+de\s+refuerzo\b/gi, replacement: 'Tanque de Energía' },

  // Movimientos competitivos clave
  { pattern: /\bviento\s+(?:de\s+)?cola\b/gi, replacement: 'Viento Afín' },
  { pattern: /\brocas\s+sigilosas\b/gi, replacement: 'Trampa Rocas' },
  { pattern: /\bdisparo\s+de\s+despedida\b/gi, replacement: 'Última Palabra' },
  { pattern: /\bvuelta\s+en\s+u\b/gi, replacement: 'Ida y Vuelta' },
  { pattern: /\bcambio\s+(?:de\s+)?voltio\b/gi, replacement: 'Voltiocambio' },
  { pattern: /\bplacaje\s+de\s+voltios\b/gi, replacement: 'Placaje Eléctrico' },
  { pattern: /\bataque\s+fulgor\b/gi, replacement: 'Placaje Eléctrico' },
]

/**
 * Sanitiza recursivamente cadenas, arreglos u objetos reemplazando términos mal traducidos.
 *
 * @template T
 * @param {T} input
 * @returns {T}
 */
export function sanitizePokemonTerms(input) {
  if (typeof input === 'string') {
    let text = input
    for (const { pattern, replacement } of CANONICAL_REPLACEMENTS) {
      text = text.replace(pattern, replacement)
    }
    return text
  }

  if (Array.isArray(input)) {
    return input.map(sanitizePokemonTerms)
  }

  if (input && typeof input === 'object') {
    const output = {}
    for (const [key, value] of Object.entries(input)) {
      output[key] = sanitizePokemonTerms(value)
    }
    return output
  }

  return input
}
