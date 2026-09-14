/**
 * competitiveContexts.js
 * Configuración centralizada y extensible de los contextos competitivos
 * y formatos soportados en PokeGuide AI (Fase 3).
 *
 * Arquitectura modular preparada para la futura Competitive Knowledge Layer.
 */

export const COMPETITIVE_CONTEXTS = [
  {
    id: 'champions',
    label: 'Pokémon Champions',
    shortLabel: 'Champions',
    tag: 'Comunidad Champions',
    description: 'Analiza la habilidad dentro del contexto competitivo oficial de Pokémon Champions.',
    icon: '🏆',
    badgeType: 'champions',
    formats: [
      {
        id: 'ranked-singles',
        label: 'Ranked Singles',
        shortLabel: 'Singles',
        description: 'Modalidad individual competitiva clasificada.',
        battleMode: 'singles',
        regulation: null,
      },
      {
        id: 'ranked-doubles',
        label: 'Ranked Doubles',
        shortLabel: 'Doubles',
        description: 'Modalidad doble competitiva clasificada.',
        battleMode: 'doubles',
        regulation: null,
      },
    ],
    // Preparado para temporadas y regulaciones dinámicas en fases siguientes
    regulations: [],
  },
  {
    id: 'showdown',
    label: 'Pokémon Showdown',
    shortLabel: 'Showdown',
    tag: 'Simulador / Smogon',
    description: 'Analiza la viabilidad de la habilidad en el formato y tier seleccionado de Pokémon Showdown.',
    icon: '⚔️',
    badgeType: 'showdown',
    formats: [
      {
        id: 'gen9-ou',
        label: 'Gen 9 OU',
        shortLabel: 'OU',
        description: 'OverUsed estándar individual de 9ª Generación.',
        battleMode: 'singles',
        regulation: null,
      },
      {
        id: 'vgc',
        label: 'VGC',
        shortLabel: 'VGC',
        description: 'Formato oficial de combates dobles por equipos de 4.',
        battleMode: 'doubles',
        regulation: null,
      },
      {
        id: 'doubles-ou',
        label: 'Doubles OU',
        shortLabel: 'Doubles OU',
        description: 'Combates dobles competitivos bajo reglas de Smogon.',
        battleMode: 'doubles',
        regulation: null,
      },
      {
        id: 'battle-stadium-singles',
        label: 'Battle Stadium Singles',
        shortLabel: 'BSS',
        description: 'Formato individual oficial de consola Nintendo Switch.',
        battleMode: 'singles',
        regulation: null,
      },
    ],
    regulations: [],
  },
  {
    id: 'general',
    label: 'General',
    shortLabel: 'General',
    tag: 'Sin formato específico',
    description: 'Explicación táctica global y mecánica de combate sin asumir ningún metagame concreto.',
    icon: '✦',
    badgeType: 'general',
    formats: [],
    regulations: [],
  },
]

/**
 * Obtiene la configuración de un contexto específico por su ID.
 */
export function getCompetitiveContextConfig(contextId = 'general') {
  const normalized = String(contextId || 'general').toLowerCase().trim()
  return (
    COMPETITIVE_CONTEXTS.find((c) => c.id === normalized) ||
    COMPETITIVE_CONTEXTS.find((c) => c.id === 'general')
  )
}

/**
 * Obtiene la configuración de un formato específico dentro de un contexto.
 */
export function getFormatConfig(contextId = 'general', formatId = null) {
  const context = getCompetitiveContextConfig(contextId)
  if (!context || !formatId) return null
  const normalizedFormat = String(formatId).toLowerCase().trim()
  return context.formats.find((f) => f.id === normalizedFormat) || null
}

/**
 * Formatea una etiqueta legible del contexto actual para la cabecera del análisis.
 * Ej: "Gen 9 OU · Pokémon Showdown", "Ranked Singles · Pokémon Champions", "General"
 */
export function formatCompetitiveContextBadge(contextId = 'general', formatId = null, regulationId = null) {
  const context = getCompetitiveContextConfig(contextId)
  if (!context) return 'General'

  if (context.id === 'general') {
    return context.label
  }

  const format = getFormatConfig(context.id, formatId)
  const formatText = format ? format.label : formatId || ''

  if (formatText && regulationId) {
    return `${formatText} (${regulationId}) · ${context.label}`
  }

  if (formatText) {
    return `${formatText} · ${context.label}`
  }

  return context.label
}

/**
 * Estructura stub preparada para la siguiente fase (Fase 4):
 * Competitive Knowledge Layer client interface.
 */
export function getCompetitiveContext(source = 'general', format = null, regulation = null) {
  return {
    source,
    format,
    regulation,
    verifiedFacts: [],
    recommendedItems: [],
    recommendedMoves: [],
    commonSets: [],
    usageStats: [],
  }
}
