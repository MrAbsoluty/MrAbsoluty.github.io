/**
 * knowledgeLayer.ts
 * Capa de conocimiento verificada y determinista para PokeGuide AI.
 *
 * Principio:
 * "PokeGuide AI no debe inventar el conocimiento; debe interpretar,
 * contextualizar y enseñar conocimiento verificado."
 */

export interface StatChangeFact {
  stat: 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed' | 'accuracy' | 'evasion' | 'all'
  target: 'self' | 'target' | 'all-allies' | 'all-foes' | 'field'
  multiplier?: number
  stages?: number
  explanation: string
}

export interface VerifiedSynergy {
  name: string
  verified: true
  ability: string
  item?: string
  move?: string
  trigger: string
  interaction: string
  result: string
  whyUseful: string
  featured?: boolean
  priority?: number
  applicablePokemon?: string[]
}

export interface VerifiedActivationMechanism {
  trigger: string
  itemOrCondition: string
  isConsumption: boolean
  explanation: string
  constraints?: string
}

export interface VerifiedCounterplayMechanism {
  tool: string
  mechanism: string
  consequence: string
  constraints?: string
}

export interface VerifiedPriorityMechanic {
  moveName: string
  priorityValue: number
  condition?: string
  explanation: string
  commonMisconception?: string
}

export interface VerifiedAbilityFacts {
  name: string
  canonicalName: string
  officialEffect: string
  statChanges: StatChangeFact[]
  speedChanges: {
    affectsSpeedStat: boolean
    explanation: string
  }
  turnCycle?: {
    hasTurnSkip: boolean
    pattern?: string
    explanation: string
  }
  weatherTrigger?: string | null
  terrainTrigger?: string | null
  damageImmunity?: {
    type?: string
    condition?: string
  }
  activation: string
  category: 'offensive' | 'defensive' | 'utility' | 'hindrance' | 'weather' | 'terrain'
  deterministicRating?: {
    score: number
    label: string
    source: 'deterministic'
  }
  verifiedConditions?: string[]
  verifiedSynergies?: VerifiedSynergy[]
  verifiedActivations?: VerifiedActivationMechanism[]
  verifiedCounterplay?: VerifiedCounterplayMechanism[]
  verifiedPriorityMechanics?: VerifiedPriorityMechanic[]
  relevantMoves?: VerifiedMoveFacts[]
  relevantItems?: VerifiedItemFacts[]
  prohibitedClaims: string[]
}

export interface VerifiedMoveFacts {
  id: string
  name: string
  canonicalName: string
  type: string
  category: 'physical' | 'special' | 'status'
  priority: number
  basePower?: number
  accuracy?: number
  isChargeMove: boolean
  healsFromDamagePercent?: number
  statDrops?: Array<{ stat: string; stages: number; target: string }>
  mechanics: string[]
  conditions: string[]
  competitiveImplications: string[]
  commonMisconceptions: string[]
}

export interface VerifiedItemFacts {
  id: string
  name: string
  canonicalName: string
  isConsumption: boolean
  mechanics: string[]
  conditions: string[]
  competitiveImplications: string[]
  commonMisconceptions: string[]
}

/**
 * Catálogo canónico de movimientos competitivos verificados (Fase 2.5).
 */
export const CANONICAL_MOVE_KNOWLEDGE: Record<string, VerifiedMoveFacts> = {
  'sucker-punch': {
    id: 'sucker-punch',
    name: 'sucker-punch',
    canonicalName: 'Sucker Punch (Golpe Bajo)',
    type: 'dark',
    category: 'physical',
    priority: 1,
    basePower: 70,
    accuracy: 100,
    isChargeMove: false,
    mechanics: [
      'Ataca en el escalón de prioridad +1 antes de que se ejecuten los movimientos de prioridad estándar (0).',
      'Requiere que el Pokémon objetivo haya seleccionado un movimiento que cause daño directo ese mismo turno y que aún no haya actuado.',
    ],
    conditions: [
      'Falla si el objetivo seleccionó un movimiento de estado (ej. Danza Espada, Protección, Paz Mental).',
      'Falla si el objetivo cambia de Pokémon.',
      'Falla si el objetivo actúa antes mediante un movimiento con prioridad superior (+2 o más) o por mayor Velocidad en el mismo escalón (+1).',
    ],
    competitiveImplications: [
      'Herramienta de venganza (revenge kill) y presión contra atacantes rápidos o debilitados.',
      'Crea un juego mental (mind game o 50/50) donde el rival puede castigar el uso de Golpe Bajo usando movimientos de estado o sustituto.',
    ],
    commonMisconceptions: [
      'Golpe Bajo NO supera la Velocidad del rival: actúa antes porque opera en un escalón de prioridad superior (+1).',
      'Golpe Bajo NO siempre golpea primero: falla contra movimientos de estado y no supera movimientos de prioridad +2 o superior.',
      'Tener mayor Velocidad o duplicarla con Liviano no evita ser amenazado por Golpe Bajo si se selecciona un ataque de daño directo.',
    ],
  },
  'trick-room': {
    id: 'trick-room',
    name: 'trick-room',
    canonicalName: 'Trick Room (Espacio Raro)',
    type: 'psychic',
    category: 'status',
    priority: -7,
    isChargeMove: false,
    mechanics: [
      'Crea una dimensión distorsionada que dura exactamente 5 turnos en el campo (incluyendo el turno de activación).',
      'Invierte el orden de actuación basado en la estadística de Velocidad dentro de cada escalón de prioridad (los Pokémon más lentos actúan primero).',
    ],
    conditions: [
      'Afecta a todos los Pokémon en el campo.',
      'Si se usa nuevamente mientras está activo, cancela la dimensión anticipadamente.',
    ],
    competitiveImplications: [
      'Transforma una Velocidad elevada en una desventaja táctica relativa durante sus 5 turnos.',
      'Permite a equipos lentos y voluminosos tomar la iniciativa ofensiva absoluta.',
    ],
    commonMisconceptions: [
      'Espacio Raro NO reduce ni modifica el valor numérico de la estadística de Velocidad.',
      'Espacio Raro NO desactiva, anula ni elimina la habilidad Liviano ni su multiplicador x2.',
      'Espacio Raro NO altera el sistema de prioridad de movimientos: un movimiento de prioridad +1 (como Golpe Bajo) sigue actuando antes que movimientos de prioridad 0 dentro de Espacio Raro.',
    ],
  },
  protect: {
    id: 'protect',
    name: 'protect',
    canonicalName: 'Protect (Protección)',
    type: 'normal',
    category: 'status',
    priority: 4,
    isChargeMove: false,
    mechanics: [
      'Protege al usuario de la gran mayoría de movimientos ofensivos y de estado dirigidos hacia él durante ese turno.',
      'Opera en el escalón de prioridad +4.',
    ],
    conditions: [
      'Su probabilidad de éxito se reduce progresivamente si se utiliza de forma consecutiva tras otro movimiento de protección.',
      'No protege contra daño indirecto residual (clima, veneno, quemadura, drenadoras) ni movimientos perforantes de protección (Amago, Golpe Umbrío).',
    ],
    competitiveImplications: [
      'Herramienta fundamental de scouting para identificar la jugada u objeto del rival.',
      'Permite consumir turnos de efectos temporales (clima, terrenos, Espacio Raro, Viento Afín).',
      'Vital en formatos Dobles/VGC para gestionar el posicionamiento y mitigar presión focalizada.',
    ],
    commonMisconceptions: [
      'Protección NO garantiza éxito absoluto en turnos consecutivos.',
      'Protección NO anula el daño residual de estados alterados como veneno o quemadura.',
    ],
  },
  'fake-out': {
    id: 'fake-out',
    name: 'fake-out',
    canonicalName: 'Fake Out (Sorpresa)',
    type: 'normal',
    category: 'physical',
    priority: 3,
    basePower: 40,
    accuracy: 100,
    isChargeMove: false,
    mechanics: [
      'Movimiento de prioridad +3 que causa retroceso (flinch) garantizado al objetivo si conecta.',
      'Solo puede ejecutarse con éxito durante el primer turno en que el usuario entra al campo (primer turno tras switch-in).',
    ],
    conditions: [
      'Falla si el usuario intenta utilizarlo después de su primer turno en combate sin haber cambiado previamente.',
      'Falla o no causa retroceso contra tipos Fantasma, Pokémon con Foco Interno (Inner Focus), o equipados con Capa Furtiva (Covert Cloak).',
      'Bloqueado por Protección, Detección o Terreno Psíquico en objetivos en contacto con el suelo.',
    ],
    competitiveImplications: [
      'Control de tempo y mitigación de amenazas inmediatas en el primer turno.',
      'Pilar fundamental en Dobles/VGC para permitir que el compañero prepare una estrategia (setup, Viento Afín, Espacio Raro) sin interferencia.',
    ],
    commonMisconceptions: [
      'Sorpresa NO causa retroceso siempre ni de forma incondicional; existen inmunidades de tipo, habilidades y objetos que previenen el flinch.',
      'NO puede usarse en turnos sucesivos sin salir y volver a entrar al campo.',
    ],
  },
  'knock-off': {
    id: 'knock-off',
    name: 'knock-off',
    canonicalName: 'Knock Off (Desarme)',
    type: 'dark',
    category: 'physical',
    priority: 0,
    basePower: 65,
    accuracy: 100,
    isChargeMove: false,
    mechanics: [
      'Inflige daño físico y remueve permanentemente el objeto equipado del objetivo durante el resto del combate.',
      'Multiplica su potencia base por 1.5x (alcanzando 97.5 de potencia base) si el objetivo porta un objeto que pueda ser removido.',
    ],
    conditions: [
      'No puede remover objetos no desprendibles (ej. Megapiedras, Cristales Z, Recuerdos de Silvally, Tablas de Arceus, o Energía Potenciadora en Pokémon Paradoja).',
      'Si el objetivo no lleva objeto, inflige su potencia base estándar de 65.',
    ],
    competitiveImplications: [
      'Uno de los movimientos más desestabilizadores del juego competitivo por eliminar la utilidad de objetos clave (Botas Gruesas, Restos, Mineral Evolutivo, Vidasfera).',
      'Proporciona progreso táctico permanente independientemente del cambio del rival.',
    ],
    commonMisconceptions: [
      'Desarme NO impide ni cancela la habilidad Liviano (Unburden).',
      'Al forzar la pérdida del objeto equipado, Desarme CUMPLE la condición de activación de Liviano, provocando que la duplicación de Velocidad se active (incluso si ocurre antes del momento planeado por el usuario).',
    ],
  },
  'close-combat': {
    id: 'close-combat',
    name: 'close-combat',
    canonicalName: 'Close Combat (A Bocajarro)',
    type: 'fighting',
    category: 'physical',
    priority: 0,
    basePower: 120,
    accuracy: 100,
    isChargeMove: false,
    statDrops: [
      { stat: 'defense', stages: -1, target: 'self' },
      { stat: 'special-defense', stages: -1, target: 'self' },
    ],
    mechanics: [
      'Ataque físico de alta potencia (120 de daño base) que reduce la Defensa y Defensa Especial del usuario en un nivel (-1 cada una) tras infligir daño.',
    ],
    conditions: [
      'Las reducciones defensivas se aplican al usuario inmediatamente después del ataque si este conecta.',
    ],
    competitiveImplications: [
      'Ataque con STAB demoledor para Pokémon tipo Lucha con excelente cobertura ofensiva.',
      'Su penalización defensiva convierte al usuario en un objetivo más vulnerable al contraataque.',
    ],
    commonMisconceptions: [
      'Las reducciones defensivas NO son una desventaja insuperable: combinadas con Hierba Blanca, activan la restauración del objeto y su consumo inmediato.',
      'Para Sneasler con Liviano, A Bocajarro + Hierba Blanca constituye la sinergia prioritaria y canónica, ya que elimina las bajadas de defensas y activa la duplicación de Velocidad en el mismo turno.',
    ],
  },
  'solar-beam': {
    id: 'solar-beam',
    name: 'solar-beam',
    canonicalName: 'Solar Beam (Rayo Solar)',
    type: 'grass',
    category: 'special',
    priority: 0,
    basePower: 120,
    accuracy: 100,
    isChargeMove: true,
    mechanics: [
      'Ataque especial de alta potencia (120 de daño base) que normalmente requiere un turno de carga (absorbe luz en el turno 1 y golpea en el turno 2).',
      'Bajo clima de Sol Intenso / Luz Solar (Drought / Despejado), omite por completo la fase de carga y se ejecuta en un solo turno.',
      'Si se porta el objeto Hierba Única (Power Herb), se consume para omitir el turno de carga en cualquier clima.',
      'Bajo climas adversos (Lluvia, Tormenta de Arena, Nieve), su potencia base se reduce a la mitad (60 de daño base) y sigue requiriendo carga.',
    ],
    conditions: [
      'Requiere 2 turnos para ejecutarse en condiciones climáticas estándar o sin Hierba Única.',
      'NO recupera puntos de salud (PS) del usuario bajo ninguna circunstancia.',
    ],
    competitiveImplications: [
      'Movimiento de cobertura devastador para sweepers de Fuego o activadores de Sol (como Torkoal, Charizard) para castigar a tipos Agua, Tierra y Roca en un solo turno.',
    ],
    commonMisconceptions: [
      'Rayo Solar NO recupera PS al infligir daño (eso es Gigadrenado).',
      'Rayo Solar NO siempre requiere un turno de carga: en Sol o con Hierba Única ataca inmediatamente.',
      'No debe confundirse con Gigadrenado ni en mecánicas de curación ni en necesidad de carga.',
    ],
  },
  'giga-drain': {
    id: 'giga-drain',
    name: 'giga-drain',
    canonicalName: 'Giga Drain (Gigadrenado)',
    type: 'grass',
    category: 'special',
    priority: 0,
    basePower: 75,
    accuracy: 100,
    isChargeMove: false,
    healsFromDamagePercent: 50,
    mechanics: [
      'Ataque especial de tipo Planta con 75 de potencia base que restaura los PS del usuario en una cantidad equivalente al 50% del daño infligido al objetivo.',
      'Se ejecuta SIEMPRE en un solo turno; es un movimiento de daño directo y recuperación, NO un movimiento de carga.',
    ],
    conditions: [
      'La cantidad de salud recuperada es estrictamente proporcional al daño real infligido (si golpea una sustitución o una inmunidad, no recupera PS).',
      'No depende del clima de Sol ni de Hierba Única para atacar inmediatamente en 1 turno.',
    ],
    competitiveImplications: [
      'Proporciona daño de cobertura y longevidad simultánea a Pokémon defensivos u ofensivos especiales.',
    ],
    commonMisconceptions: [
      'Gigadrenado NUNCA requiere un turno de carga; ataca de forma instantánea en cualquier clima.',
      'Gigadrenado NO requiere Sol ni Hierba Única para usarse en un solo turno.',
      'Gigadrenado NO recupera salud sin infligir daño; la curación se calcula a partir del daño causado.',
      'NUNCA debe confundirse con Rayo Solar.',
    ],
  },
}

/**
 * Catálogo canónico de objetos competitivos verificados (Fase 2.5).
 */
export const CANONICAL_ITEM_KNOWLEDGE: Record<string, VerifiedItemFacts> = {
  'white-herb': {
    id: 'white-herb',
    name: 'white-herb',
    canonicalName: 'White Herb (Hierba Blanca)',
    isConsumption: true,
    mechanics: [
      'Restaura automáticamente a cero cualquier modificación negativa de estadísticas (stat drops) que sufra el portador.',
      'Se consume de forma inmediata tras restaurar la estadística afectada, desapareciendo del portador.',
    ],
    conditions: [
      'Se activa únicamente cuando una o más estadísticas del portador caen por debajo de 0 etapas.',
      'No se activa por daño directo, cambios de estado ni bajadas de PS.',
    ],
    competitiveImplications: [
      'Permite mitigar penalizaciones auto-infligidas de movimientos potentes como A Bocajarro, Sofoco o Rompecoraza.',
      'Al consumirse y dejar al Pokémon sin objeto, es el catalizador óptimo para activar Liviano de forma controlada.',
    ],
    commonMisconceptions: [
      'La Hierba Blanca NO aumenta la Velocidad directamente: restaura las defensas y se consume; es la pérdida del objeto lo que activa Liviano.',
      'No devuelve las estadísticas a sus valores base absolutos, sino que restablece a 0 las etapas negativas de modificación de estadísticas.',
    ],
  },
  'air-balloon': {
    id: 'air-balloon',
    name: 'air-balloon',
    canonicalName: 'Air Balloon (Globo Helio)',
    isConsumption: false,
    mechanics: [
      'Otorga inmunidad total a movimientos y peligros de tipo Tierra (como Terremoto o Púas) mientras permanezca intacto.',
      'Se pierde (estalla) cuando el portador recibe daño directo de un movimiento de ataque rival.',
    ],
    conditions: [
      'No se pierde por daño indirecto (clima, veneno, quemadura, vidaesfera).',
      'Requiere recibir un ataque ofensivo directo para estallar.',
    ],
    competitiveImplications: [
      'Otorga oportunidades seguras de cambio ante atacantes de tipo Tierra.',
      'Su pérdida al recibir daño puede activar Liviano como vía secundaria o alternativa.',
    ],
    commonMisconceptions: [
      'El Globo Helio NO se consume; se pierde por estallido tras recibir daño directo.',
      'El Globo Helio NO activa Liviano de forma universal ni garantizada al inicio; depende de recibir daño para estallar.',
    ],
  },
  'sitrus-berry': {
    id: 'sitrus-berry',
    name: 'sitrus-berry',
    canonicalName: 'Sitrus Berry (Baya Zidra)',
    isConsumption: true,
    mechanics: [
      'Restaura automáticamente un 25% de los PS máximos del portador cuando su salud cae al 50% o menos.',
      'Se consume en el proceso, dejando al portador sin objeto.',
    ],
    conditions: [
      'Requiere que los PS caigan al 50% o menos para activarse.',
    ],
    competitiveImplications: [
      'Proporciona supervivencia crucial para resistir un golpe y contraatacar.',
      'Al consumirse, activa Liviano como alternativa defensiva/reactiva.',
    ],
    commonMisconceptions: [
      'La Baya Zidra NO debe desplazar a Hierba Blanca + A Bocajarro como estrategia prioritaria de Sneasler; pertenece a la categoría de alternativas.',
      'No se activa si el Pokémon es debilitado de un solo golpe desde más del 50% de PS.',
    ],
  },
}

/**
 * Registro curado de hechos objetivos inmutables para habilidades clave.
 */
const CANONICAL_KNOWLEDGE_BASE: Record<string, Partial<VerifiedAbilityFacts>> = {
  truant: {
    name: 'truant',
    canonicalName: 'Truant (Ausente)',
    officialEffect: 'El Pokémon no puede ejecutar movimientos en turnos alternos (holgazanea en los turnos pares).',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Truant NO modifica la estadística Speed (Velocidad). El Pokémon mantiene intacta su velocidad base y orden de prioridad en los turnos en que puede actuar.',
    },
    turnCycle: {
      hasTurnSkip: true,
      pattern: 'En el primer turno puede actuar con normalidad; en el siguiente turno holgazanea y no actúa; después vuelve a actuar con normalidad, alternando sucesivamente.',
      explanation: 'La restricción es estrictamente de frecuencia de actuación por turno, NUNCA una reducción de la estadística de Velocidad.',
    },
    activation: 'Pasiva al inicio de cada turno par tras haber actuado en el impar.',
    category: 'hindrance',
    deterministicRating: {
      score: 2,
      label: 'Deficiente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'reduce la velocidad',
      'reduce la estadística speed',
      'disminuye la velocidad',
      'disminuye speed',
      'hace más lento en velocidad',
      'baja la velocidad',
      'penaliza la velocidad',
      'reducción de velocidad',
      'lowers speed',
      'reduces speed',
      'decreases speed',
      'speed reduction',
    ],
  },
  drought: {
    name: 'drought',
    canonicalName: 'Drought (Sequía)',
    officialEffect: 'Establece el clima de Luz Solar Intensa (Sol) durante 5 turnos (u 8 turnos si porta Roca Calor) al entrar al campo.',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Drought no altera la estadística de Velocidad de forma directa (puede activar Clorofila en compañeros de equipo).',
    },
    weatherTrigger: 'sunny',
    activation: 'Al entrar en combate (Switch-in).',
    category: 'weather',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    relevantMoves: [
      CANONICAL_MOVE_KNOWLEDGE['solar-beam'],
      CANONICAL_MOVE_KNOWLEDGE['giga-drain'],
      CANONICAL_MOVE_KNOWLEDGE['trick-room'],
      CANONICAL_MOVE_KNOWLEDGE['sucker-punch'],
    ],
    prohibitedClaims: [
      'activa lluvia',
      'activa tormenta de arena',
      'activa nieve',
      'reduce el ataque',
      'reduce la velocidad',
      'daña al usuario cada turno',
      'debilita al usuario',
      'reduce las estadísticas del usuario',
      'la habilidad es débil porque potencia ataques de fuego del rival',
    ],
  },
  'huge-power': {
    name: 'huge-power',
    canonicalName: 'Huge Power (Potencia)',
    officialEffect: 'Duplica la estadística de Ataque físico del Pokémon (multiplicador x2 exacto).',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 2,
        explanation: 'Duplica el valor real del Ataque físico en combate.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Huge Power actúa EXCLUSIVAMENTE sobre el Ataque físico. NO modifica la Velocidad ni el Ataque Especial.',
    },
    activation: 'Permanente en combate.',
    category: 'offensive',
    deterministicRating: {
      score: 10,
      label: 'Imprescindible',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'duplica la velocidad',
      'aumenta la velocidad',
      'duplica el ataque especial',
      'lowers speed',
      'aumenta speed',
    ],
  },
  'pure-power': {
    name: 'pure-power',
    canonicalName: 'Pure Power (Energía Pura)',
    officialEffect: 'Duplica la estadística de Ataque físico del Pokémon (multiplicador x2 exacto).',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 2,
        explanation: 'Duplica el valor real del Ataque físico en combate.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Pure Power actúa EXCLUSIVAMENTE sobre el Ataque físico. NO modifica la Velocidad.',
    },
    activation: 'Permanente en combate.',
    category: 'offensive',
    deterministicRating: {
      score: 10,
      label: 'Imprescindible',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'duplica la velocidad',
      'aumenta la velocidad',
      'duplica el ataque especial',
    ],
  },
  'wonder-guard': {
    name: 'wonder-guard',
    canonicalName: 'Wonder Guard (Superguarda)',
    officialEffect: 'El Pokémon solo recibe daño directo de movimientos que le resulten supereficaces.',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'No modifica la estadística de Velocidad.',
    },
    damageImmunity: {
      condition: 'Inmune a ataques directos no supereficaces. Daño indirecto (trampas, veneno, quemadura, clima) le afecta normalmente.',
    },
    activation: 'Permanente en combate.',
    category: 'defensive',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'inmune a todo daño',
      'inmune al daño indirecto',
      'reduce la velocidad',
    ],
  },
  intimidate: {
    name: 'intimidate',
    canonicalName: 'Intimidate (Intimidación)',
    officialEffect: 'Reduce en 1 nivel el Ataque físico de los oponentes adyacentes al entrar en combate (-1 nivel de Ataque).',
    statChanges: [
      {
        stat: 'attack',
        target: 'all-foes',
        stages: -1,
        explanation: 'Reduce en 1 nivel el Ataque físico del rival.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Intimidate reduce EXCLUSIVAMENTE el Ataque físico del oponente; NO reduce la Velocidad ni la Defensa.',
    },
    activation: 'Al entrar en combate (Switch-in).',
    category: 'defensive',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'reduce la velocidad',
      'disminuye la velocidad',
      'baja la velocidad',
      'reduce la defensa',
      'lowers speed',
    ],
  },
  'speed-boost': {
    name: 'speed-boost',
    canonicalName: 'Speed Boost (Impulso)',
    officialEffect: 'Aumenta en 1 nivel la Velocidad del Pokémon al final de cada turno (+1 Velocidad).',
    statChanges: [
      {
        stat: 'speed',
        target: 'self',
        stages: 1,
        explanation: 'Sube 1 nivel de Velocidad al final del turno.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: true,
      explanation: 'Aumenta activamente la estadística de Velocidad en 1 nivel al final de cada turno.',
    },
    activation: 'Al final de cada turno en combate.',
    category: 'utility',
    deterministicRating: {
      score: 9,
      label: 'Excelente',
      source: 'deterministic',
    },
    prohibitedClaims: ['reduce la velocidad', 'duplica el ataque'],
  },
  'slow-start': {
    name: 'slow-start',
    canonicalName: 'Slow Start (Inicio Lento)',
    officialEffect: 'Reduce a la mitad el Ataque físico y la Velocidad del Pokémon durante los primeros 5 turnos en combate.',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 0.5,
        explanation: 'Ataque reducido al 50% durante 5 turnos.',
      },
      {
        stat: 'speed',
        target: 'self',
        multiplier: 0.5,
        explanation: 'Velocidad reducida al 50% durante 5 turnos.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: true,
      explanation: 'Slow Start SÍ reduce la estadística Speed al 50% durante los primeros 5 turnos.',
    },
    activation: 'Durante los primeros 5 turnos en combate.',
    category: 'hindrance',
    deterministicRating: {
      score: 2,
      label: 'Deficiente',
      source: 'deterministic',
    },
    prohibitedClaims: ['aumenta la velocidad', 'sin penalización'],
  },
  unburden: {
    name: 'unburden',
    canonicalName: 'Unburden (Liviano)',
    officialEffect: 'Duplica la estadística de Velocidad del Pokémon cuando este pierde o consume el objeto equipado que esté llevando. Entrar al combate sin objeto no activa la habilidad por sí solo.',
    statChanges: [],
    speedChanges: {
      affectsSpeedStat: true,
      explanation: 'Duplica (x2) la Velocidad del Pokémon a partir del momento en que su objeto equipado es consumido o perdido en combate, manteniéndose mientras permanezca sin objeto. No duplica la velocidad retroactivamente durante la ejecución del movimiento que causó el consumo ni garantiza superar a cualquier rival.',
    },
    verifiedConditions: [
      'Liviano se activa cuando el Pokémon pierde o consume un objeto que esté llevando.',
      'Entrar al combate sin objeto NO activa la habilidad por sí solo.',
      'Si el Pokémon entra sin objeto y obtiene uno durante el combate, perderlo o consumirlo puede activar Liviano.',
      'El aumento de Velocidad comienza inmediatamente cuando la habilidad se activa (tras consumirse o perderse el objeto).',
      'Mientras el Pokémon permanezca sin objeto, conserva la duplicación de Velocidad (no describir el efecto como permanente para el resto del combate).',
      'Si el Pokémon vuelve a equipar o recibir un objeto en combate, pierde la bonificación de Liviano.',
    ],
    verifiedSynergies: [
      {
        name: 'Hierba Blanca + A Bocajarro',
        verified: true,
        ability: 'Unburden',
        item: 'Hierba Blanca (White Herb)',
        move: 'A Bocajarro (Close Combat)',
        trigger: 'Uso de A Bocajarro y activación inmediata de Hierba Blanca.',
        interaction: 'A Bocajarro reduce en 1 nivel la Defensa y la Defensa Especial del usuario. Hierba Blanca detecta estas reducciones, las restaura a 0 y se consume en el proceso. Al consumirse el objeto, Sneasler queda sin objeto equipado.',
        result: 'Liviano se activa inmediatamente al quedar sin objeto, duplicando la Velocidad de Sneasler mientras permanezca sin objeto, permitiéndole superar a muchos rivales que antes podían ser más rápidos.',
        whyUseful: 'Convierte la desventaja de reducción de estadísticas de A Bocajarro en una oportunidad táctica para activar Liviano de forma controlada, activando el aumento de Velocidad de Liviano en una sola jugada mientras Hierba Blanca mitiga las penalizaciones defensivas del movimiento.',
        featured: true,
        priority: 1,
        applicablePokemon: ['Sneasler', 'Hawlucha'],
      },
    ],
    verifiedActivations: [
      {
        trigger: 'Consumo de Baya Sitrus',
        itemOrCondition: 'Baya Sitrus (Sitrus Berry)',
        isConsumption: true,
        explanation: 'Se consume al cumplirse su condición de PS correspondiente (bajar del 50% de PS máximos en batalla). Al consumirse, restaura PS y deja al Pokémon sin objeto, activando Liviano mientras continúe sin objeto.',
        constraints: 'Condición de activación específica de umbral de PS. NUNCA generalizar esta condición a otras bayas ni afirmar que todas las bayas se activan al 50% de PS.',
      },
      {
        trigger: 'Consumo de Baya de Resistencia',
        itemOrCondition: 'Bayas de reducción de daño supereficaz (ej. Baya Pasio, Baya Chilan, etc.)',
        isConsumption: true,
        explanation: 'Se consume al cumplirse su condición específica al recibir un ataque supereficaz del tipo correspondiente. Al mitigar el daño y consumirse, deja al Pokémon sin objeto, activando Liviano mientras permanezca sin objeto.',
        constraints: 'Condición de activación específica por impacto supereficaz de su tipo. NUNCA afirmar que se activa al 50% de PS ni agrupar con otras bayas bajo una misma regla.',
      },
      {
        trigger: 'Pérdida de Globo Helio',
        itemOrCondition: 'Globo Helio (Air Balloon)',
        isConsumption: false,
        explanation: 'El Globo Helio estalla y se pierde cuando el portador recibe daño de un movimiento ofensivo rival.',
        constraints: 'El Globo Helio se PIERDE (estalla), NO se consume. La pérdida del objeto activa Liviano mientras continúe sin objeto.',
      },
    ],
    activation: 'Al consumir o perder un objeto que lleve en combate. Conserva la duplicación de Velocidad mientras continúe sin objeto.',
    category: 'utility',
    deterministicRating: {
      score: 8,
      label: 'Muy buena',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'se activa si entra sin objeto',
      'se activa al entrar sin objeto',
      'se activa sin tener objeto inicial',
      'se activa simplemente por no tener objeto',
      'reduce la velocidad',
      'disminuye la velocidad',
      'aumenta el ataque',
      'las bayas se activan al bajar de 50%',
      'las bayas activan liviano al bajar de 50%',
      'todas las bayas se activan al 50%',
      'para el resto del combate',
      'casi cualquier rival',
      'cualquier rival',
      'velocidad extrema',
      'debe tener objeto al entrar',
      'requiere haber entrado con objeto',
      'exige haber entrado con objeto',
      'no tiene efecto si entra sin objeto',
      'hierba blanca activa directamente liviano',
      'a bocajarro activa directamente liviano',
      'globo helio se consume',
      'el globo helio se consume',
      'choice band + a bocajarro',
      'choice scarf + a bocajarro',
      'cinta elección + a bocajarro',
      'pañuelo elección + a bocajarro',
      'vidasfera + a bocajarro',
      'life orb + a bocajarro',
      'la única forma',
      'la única estrategia',
      'siempre es el mejor',
      'es obligatorio',
      'obligatorio para sneasler',
      'la mejor estrategia en todos los formatos',
    ],
    verifiedCounterplay: [
      {
        tool: 'Golpe Bajo (Sucker Punch)',
        mechanism: 'Movimiento de prioridad +1 de tipo Siniestro. Opera mediante el sistema de prioridad, independiente del valor de Velocidad del objetivo.',
        consequence: 'Puede actuar antes que Sneasler aunque su Velocidad esté duplicada por Liviano, porque la prioridad se resuelve antes de comparar Velocidad.',
        constraints: 'Golpe Bajo solo tiene éxito si el objetivo va a ejecutar ese mismo turno un movimiento que cause daño directo. Si el objetivo usa un movimiento de estado, cambia o no ejecuta una acción ofensiva compatible, Golpe Bajo falla. NO afirmar que Golpe Bajo siempre golpea primero ni que supera la Velocidad de Sneasler: no depende de la Velocidad, sino del sistema de prioridad.',
      },
      {
        tool: 'Espacio Raro (Trick Room)',
        mechanism: 'Altera el orden en que actúan los Pokémon según sus valores de Velocidad durante 5 turnos: dentro de cada nivel de prioridad, actúa primero el Pokémon con menor Velocidad.',
        consequence: 'Bajo Espacio Raro, la Velocidad elevada de Sneasler activa con Liviano lo convierte en desventaja táctica dentro de su nivel de prioridad, ya que actuará después que rivales más lentos.',
        constraints: 'Espacio Raro NO desactiva ni anula Liviano. La habilidad sigue activa y el multiplicador x2 de Velocidad sigue aplicándose. Lo que cambia es cómo esa Velocidad participa en el orden de acciones. Los movimientos de prioridad (como Golpe Bajo) siguen resolviendo por su sistema de prioridad habitual incluso bajo Espacio Raro.',
      },
      {
        tool: 'Desarme (Knock Off)',
        mechanism: 'Movimiento de tipo Siniestro que elimina el objeto equipado del objetivo antes de calcular el daño.',
        consequence: 'Si Sneasler lleva el objeto que planea consumir para activar Liviano, Desarme puede provocar la pérdida del objeto antes del turno previsto. Al perder el objeto, Liviano puede activarse en ese momento según las condiciones habituales.',
        constraints: 'Desarme NO impide ni bloquea Liviano. La pérdida del objeto mediante Desarme cumple la condición de activación de Liviano. El efecto depende del contexto: si Sneasler no lleva objeto, Desarme no tiene efecto sobre la activación. NO afirmar que Desarme fuerza una activación prematura de Liviano en términos absolutos sin precisar el contexto.',
      },
    ],
    verifiedPriorityMechanics: [
      {
        moveName: 'Golpe Bajo (Sucker Punch)',
        priorityValue: 1,
        condition: 'El objetivo debe ejecutar ese mismo turno un movimiento que cause daño directo. Si el objetivo usa un movimiento de estado, cambia o no realiza una acción ofensiva compatible, el movimiento falla.',
        explanation: 'La prioridad +1 permite actuar antes que movimientos de prioridad 0 (prioridad estándar) independientemente de los valores de Velocidad. El aumento de Velocidad de Liviano no modifica este sistema: Golpe Bajo sigue actuando primero porque opera en un nivel de prioridad diferente, no porque sea más rápido en términos de Velocidad.',
        commonMisconception: 'NO afirmar que Golpe Bajo "supera la Velocidad", "es más rápido que Sneasler" o "contrarresta la Velocidad de Liviano". La Velocidad y la prioridad son sistemas independientes.',
      },
    ],
    relevantMoves: [
      CANONICAL_MOVE_KNOWLEDGE['close-combat'],
      CANONICAL_MOVE_KNOWLEDGE['sucker-punch'],
      CANONICAL_MOVE_KNOWLEDGE['trick-room'],
      CANONICAL_MOVE_KNOWLEDGE['knock-off'],
    ],
    relevantItems: [
      CANONICAL_ITEM_KNOWLEDGE['white-herb'],
      CANONICAL_ITEM_KNOWLEDGE['air-balloon'],
      CANONICAL_ITEM_KNOWLEDGE['sitrus-berry'],
    ],
  },
  guts: {
    name: 'guts',
    canonicalName: 'Guts (Agallas)',
    officialEffect: 'Aumenta el Ataque físico en un 50% (multiplicador x1.5) cuando el Pokémon sufre un problema de estado alterado (quemadura, parálisis, envenenamiento o sueño). Ignora la penalización de daño por quemadura.',
    statChanges: [
      {
        stat: 'attack',
        target: 'self',
        multiplier: 1.5,
        explanation: 'Aumenta el Ataque en un 50% al sufrir un problema de estado alterado persistente. Ignora la penalización pasiva de daño provocada por la quemadura.',
      },
    ],
    speedChanges: {
      affectsSpeedStat: false,
      explanation: 'Guts NO altera la estadística de Velocidad. La parálisis sigue reduciendo la velocidad habitual salvo inmunidades.',
    },
    activation: 'Condicional a sufrir un problema de estado alterado persistente (típicamente autoinducido mediante Llamasfera o Toxisfera, o por recibir un ataque de estado del rival).',
    category: 'offensive',
    deterministicRating: {
      score: 8,
      label: 'Muy buena',
      source: 'deterministic',
    },
    prohibitedClaims: [
      'se activa con confusión',
      'aumenta la velocidad',
      'se activa sin estado alterado',
      'cura el estado alterado',
    ],
  },
}

/**
 * Normaliza nombres de habilidades a slug estándar (ej. "Huge Power" a "huge-power").
 */
function toAbilitySlug(name: string): string {
  if (!name) return ''
  return name.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/**
 * Obtiene los hechos verificados de un movimiento catalogado.
 */
export function getVerifiedMoveFacts(moveIdOrName: string): VerifiedMoveFacts | undefined {
  const norm = moveIdOrName.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
  return CANONICAL_MOVE_KNOWLEDGE[norm] || Object.values(CANONICAL_MOVE_KNOWLEDGE).find(
    (m) => m.name.toLowerCase() === norm || m.canonicalName.toLowerCase().includes(norm),
  )
}

/**
 * Obtiene los hechos verificados de un objeto catalogado.
 */
export function getVerifiedItemFacts(itemIdOrName: string): VerifiedItemFacts | undefined {
  const norm = itemIdOrName.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
  return CANONICAL_ITEM_KNOWLEDGE[norm] || Object.values(CANONICAL_ITEM_KNOWLEDGE).find(
    (it) => it.name.toLowerCase() === norm || it.canonicalName.toLowerCase().includes(norm),
  )
}

/**
 * Determina los movimientos verificados relevantes para el análisis de una habilidad/Pokémon.
 */
export function getRelevantMoveFacts(abilityName: string, pokemonName?: string): VerifiedMoveFacts[] {
  const normAbility = (abilityName || '').toLowerCase().trim()
  const normPokemon = (pokemonName || '').toLowerCase().trim()
  const list: VerifiedMoveFacts[] = []

  if (normAbility === 'unburden' || normPokemon === 'sneasler') {
    list.push(
      CANONICAL_MOVE_KNOWLEDGE['close-combat'],
      CANONICAL_MOVE_KNOWLEDGE['sucker-punch'],
      CANONICAL_MOVE_KNOWLEDGE['trick-room'],
      CANONICAL_MOVE_KNOWLEDGE['knock-off'],
    )
  } else if (normAbility === 'drought' || normPokemon === 'torkoal') {
    list.push(
      CANONICAL_MOVE_KNOWLEDGE['solar-beam'],
      CANONICAL_MOVE_KNOWLEDGE['giga-drain'],
      CANONICAL_MOVE_KNOWLEDGE['trick-room'],
      CANONICAL_MOVE_KNOWLEDGE['sucker-punch'],
    )
  }
  return list
}

/**
 * Determina los objetos verificados relevantes para el análisis de una habilidad/Pokémon.
 */
export function getRelevantItemFacts(abilityName: string, pokemonName?: string): VerifiedItemFacts[] {
  const normAbility = (abilityName || '').toLowerCase().trim()
  const normPokemon = (pokemonName || '').toLowerCase().trim()
  const list: VerifiedItemFacts[] = []

  if (normAbility === 'unburden' || normPokemon === 'sneasler') {
    list.push(
      CANONICAL_ITEM_KNOWLEDGE['white-herb'],
      CANONICAL_ITEM_KNOWLEDGE['air-balloon'],
      CANONICAL_ITEM_KNOWLEDGE['sitrus-berry'],
    )
  }
  return list
}

/**
 * Construye hechos verificados objetivos para cualquier habilidad dada.
 * Combina el registro curado y análisis heurístico de descripción oficial.
 */
export function buildVerifiedAbilityFacts(
  abilityName: string,
  abilityDescription?: string,
  localizedAbilityName?: string,
  pokemonName?: string,
): VerifiedAbilityFacts {
  const slug = toAbilitySlug(abilityName)

  if (CANONICAL_KNOWLEDGE_BASE[slug]) {
    const base = CANONICAL_KNOWLEDGE_BASE[slug]
    return {
      name: slug,
      canonicalName: base.canonicalName || localizedAbilityName || abilityName,
      officialEffect: base.officialEffect || abilityDescription || 'Efecto verificado en combate.',
      statChanges: base.statChanges || [],
      speedChanges: base.speedChanges || {
        affectsSpeedStat: false,
        explanation: 'No modifica la estadística de Velocidad.',
      },
      turnCycle: base.turnCycle,
      weatherTrigger: base.weatherTrigger || null,
      terrainTrigger: base.terrainTrigger || null,
      damageImmunity: base.damageImmunity,
      activation: base.activation || 'Pasiva en combate.',
      category: base.category || 'utility',
      deterministicRating: base.deterministicRating,
      verifiedConditions: base.verifiedConditions || [],
      verifiedSynergies: base.verifiedSynergies || [],
      verifiedActivations: base.verifiedActivations || [],
      verifiedCounterplay: base.verifiedCounterplay || [],
      verifiedPriorityMechanics: base.verifiedPriorityMechanics || [],
      relevantMoves: base.relevantMoves || getRelevantMoveFacts(slug, pokemonName),
      relevantItems: base.relevantItems || getRelevantItemFacts(slug, pokemonName),
      prohibitedClaims: base.prohibitedClaims || [],
    }
  }

  // Análisis heurístico para habilidades no catalogadas directamente
  const desc = (abilityDescription || '').toLowerCase()
  const affectsSpeed = desc.includes('velocidad') || desc.includes('speed')
  const isHindrance = desc.includes('negativo') || desc.includes('baja') || desc.includes('penaliz')

  const statChanges: StatChangeFact[] = []
  const prohibitedClaims: string[] = []

  if (!affectsSpeed) {
    prohibitedClaims.push(
      'reduce la velocidad',
      'disminuye la velocidad',
      'reduce speed',
      'lowers speed',
    )
  }

  return {
    name: slug,
    canonicalName: localizedAbilityName ? `${localizedAbilityName} (${abilityName})` : abilityName,
    officialEffect: abilityDescription || 'Descripción oficial provista por PokeGuide/PokéAPI.',
    statChanges,
    speedChanges: {
      affectsSpeedStat: affectsSpeed,
      explanation: affectsSpeed
        ? 'Puede interactuar con la Velocidad según su descripción oficial.'
        : 'Esta habilidad NO modifica la estadística Speed (Velocidad).',
    },
    activation: 'Condiciones descritas en el juego oficial.',
    category: isHindrance ? 'hindrance' : 'utility',
    relevantMoves: getRelevantMoveFacts(slug, pokemonName),
    relevantItems: getRelevantItemFacts(slug, pokemonName),
    prohibitedClaims,
  }
}

/* ==========================================================================
 * PREPARACIÓN PARA FASE 4: Competitive Knowledge Layer
 * ========================================================================== */

export type CompetitiveSource = 'general' | 'showdown' | 'champions'

export interface CompetitiveSetData {
  name: string
  item?: string
  ability?: string
  nature?: string
  evs?: Record<string, number>
  moves: string[]
}

export interface CompetitiveUsageStat {
  rank?: number
  usagePercent?: number
  winRate?: number
  commonPartners?: string[]
}

export interface CompetitiveContextData {
  source: CompetitiveSource
  format: string | null
  regulation: string | null
  verifiedFacts: string[]
  recommendedItems: string[]
  recommendedMoves: string[]
  commonSets: CompetitiveSetData[]
  usageStats: CompetitiveUsageStat[]
}

/**
 * Stub preparatorio para la siguiente fase (Fase 4):
 * Proveerá datos competitivos estructurados provenientes de Showdown, Smogon y Champions.
 */
export function getCompetitiveContext(
  source: CompetitiveSource = 'general',
  format: string | null = null,
  regulation: string | null = null,
): CompetitiveContextData {
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
