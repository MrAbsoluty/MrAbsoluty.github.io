/**
 * Estructura de datos centralizada para la Guía Educativa de PokeGuide.
 * Fase 1.5: Modelo evolucionado con mini-lección, deep dive, recorrido secuencial,
 * exámenes tácticos por sección y diccionario de consulta rápida.
 */

export const GUIDE_SECTIONS = [
  {
    id: 'fundamentals',
    icon: '🌱',
    colorAccent: '#4c9b8a',
  },
  {
    id: 'combat',
    icon: '⚔️',
    colorAccent: '#e05b4b',
  },
  {
    id: 'stats',
    icon: '📊',
    colorAccent: '#3b82f6',
  },
  {
    id: 'teambuilding',
    icon: '🧩',
    colorAccent: '#8b5cf6',
  },
  {
    id: 'roles',
    icon: '🎯',
    colorAccent: '#f59e0b',
  },
  {
    id: 'strategies',
    icon: '🌪️',
    colorAccent: '#06b6d4',
  },
  {
    id: 'glossary',
    icon: '📚',
    colorAccent: '#ec4899',
    isDictionary: true,
  },
]

export const GUIDE_OBJECTIVES = [
  // =========================================================================
  // 1. 🌱 Fundamentos
  // =========================================================================
  {
    id: 'fundamentals-what-is-competitive',
    sectionId: 'fundamentals',
    title: {
      es: '¿Qué es Pokémon competitivo?',
      en: 'What is competitive Pokémon?',
    },
    description: {
      es: 'Comprende el formato de combates estratégicos por turnos, las reglas oficiales y en qué se diferencia de una partida convencional.',
      en: 'Understand turn-based strategic battle formats, official tournament rules, and how competitive play differs from a regular playthrough.',
    },
    lesson: {
      introduction: {
        es: 'En la aventura tradicional de Pokémon basta con atacar con el movimiento más fuerte para ganar. En el competitivo, ambos jugadores tienen acceso a las mismas herramientas y el factor determinante es la toma de decisiones por turnos, la predicción y el conocimiento de mecánicas.',
        en: 'In the single-player adventure, using your strongest attack is usually enough to win. In competitive play, both trainers have access to the exact same resources, making turn-by-turn decision making, prediction, and deep mechanics knowledge the winning factors.',
      },
      sections: [
        {
          title: {
            es: 'Formatos principales: Individuales y Dobles',
            en: 'Core Formats: Singles and Doubles',
          },
          content: {
            es: 'Existen dos grandes vertientes: VGC (formato oficial de The Pokémon Company, jugado en combates dobles de 4 vs 4) y Smogon (formato comunitario jugado principalmente en combates individuales de 6 vs 6 divididos en categorías de uso llamadas Tiers).',
            en: 'There are two major competitive ecosystems: VGC (The Pokémon Company’s official 4v4 doubles tournament format) and Smogon (community-driven 6v6 singles format organized into tiers based on usage).',
          },
        },
        {
          title: {
            es: 'Reglas de torneo e igualdad de condiciones',
            en: 'Tournament Rules and Equal Playing Field',
          },
          content: {
            es: 'Todos los Pokémon combaten al nivel 50. Se prohíbe repetir dos Pokémon iguales (Species Clause) o equipar dos objetos idénticos en el mismo equipo (Item Clause). No hay objetos curativos de mochila durante el combate.',
            en: 'All Pokémon are leveled to 50. You cannot bring two of the same Pokémon (Species Clause) or hold duplicate items on the same squad (Item Clause). Bag items like Potions are strictly forbidden.',
          },
        },
      ],
      summary: {
        es: 'El competitivo no se trata de nivelar a tu Pokémon al 100, sino de optimizar cada recurso y anticipar las jugadas del rival bajo un reglamento equilibrado.',
        en: 'Competitive play isn’t about grinding to level 100; it’s about tactical optimization and reading your opponent’s plays under a balanced ruleset.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'La mentalidad competitiva: Información abierta vs. oculta',
            en: 'Competitive Mindset: Open vs. Hidden Information',
          },
          content: {
            es: 'Durante una partida conoces los Pokémon de tu rival en la fase de Selección de Equipo (Team Preview). Sin embargo, desconoces inicialmente sus movimientos exactos, objetos equipados y habilidades. Deducir esta información en los primeros turnos define quién controlará la partida.',
            en: 'At Team Preview, you see all six opposing Pokémon. However, you don’t know their exact moves, held items, or abilities right away. Inferring these details in the opening turns decides who seizes control.',
          },
        },
        {
          title: {
            es: 'La importancia de los turnos neutros y el posicionamiento',
            en: 'Neutral Turns and Positional Advantage',
          },
          content: {
            es: 'Un turno donde no infliges daño directo pero cambias a un Pokémon que resiste al rival o colocas una trampa puede ser mucho más valioso que un ataque impulsivo. En la Guía aprenderás paso a paso cómo dominar estos fundamentos.',
            en: 'A turn where you deal zero damage but pivot to a counter or lay down a field hazard can be far more valuable than blindly attacking. Throughout this Guide, you will master these exact concepts.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Ejemplo: VGC vs. Aventura',
            en: 'Example: VGC vs. Story Mode',
          },
          description: {
            es: 'En la historia, un Charizard usa Lanzallamas contra todo. En VGC, Charizard puede usar Protección mientras su compañero activa Viento Afín para duplicar la velocidad de ambos en el siguiente turno.',
            en: 'In story mode, Charizard spams Flamethrower. In VGC, Charizard uses Protect while its ally casts Tailwind, doubling team speed for the next turn.',
          },
        },
      ],
      summary: {
        es: 'El combate competitivo es una partida de ajedrez donde cada especie tiene atributos únicos, límites claros y un rol específico que cumplir.',
        en: 'Competitive Pokémon is chess with elemental creatures where every piece has tailored stats, specific boundaries, and a distinct tactical role.',
      },
    },
    nextObjectiveId: 'fundamentals-types-effectiveness',
  },

  {
    id: 'fundamentals-types-effectiveness',
    sectionId: 'fundamentals',
    title: {
      es: 'Tipos y efectividad',
      en: 'Types and effectiveness',
    },
    description: {
      es: 'Aprende a dominar las debilidades, resistencias e inmunidades del matchup entre los 18 tipos elementales.',
      en: 'Master weaknesses, resistances, and immunities across all 18 elemental types.',
    },
    lesson: {
      introduction: {
        es: 'Los 18 tipos elementales son la piedra angular de cualquier interacción. Un movimiento puede causar daño súper eficaz (x2 o x4), poco eficaz (x0.5 o x0.25) o ser completamente inútil debido a una inmunidad (x0).',
        en: 'The 18 elemental types are the foundation of Pokémon battles. Moves deal super-effective damage (x2 or x4), not very effective damage (x0.5 or x0.25), or zero damage due to type immunities (x0).',
      },
      sections: [
        {
          title: {
            es: 'Inmunidades tácticas: Cambios gratuitos',
            en: 'Tactical Immunities: Free Switch-ins',
          },
          content: {
            es: 'Las inmunidades por tipo son las mejores herramientas de cambio en combate: Tierra no afecta a Volador, Fantasma es inmune a Normal y Lucha, Eléctrico no afecta a Tierra, y Hada es inmune a Dragón.',
            en: 'Type immunities offer free switches: Ground cannot touch Flying, Ghost is immune to Normal and Fighting, Electric does zero to Ground, and Fairy is immune to Dragon.',
          },
        },
        {
          title: {
            es: 'Debilidades dobles (x4)',
            en: 'Double Weaknesses (x4)',
          },
          content: {
            es: 'Cuando un Pokémon posee dos tipos y ambos comparten debilidad hacia un mismo elemento (como Tierra/Volador contra Hielo en Landorus o Bicho/Acero contra Fuego en Scizor), el daño se multiplica por 4, resultando habitualmente en un K.O. directo.',
            en: 'When dual-typed Pokémon share a common weakness (like Ice against Ground/Flying or Fire against Bug/Steel), damage multiplies by 4, almost always resulting in a direct Knockout.',
          },
        },
      ],
      summary: {
        es: 'Memorizar la tabla de tipos no es solo para atacar fuerte: sirve primordialmente para saber qué Pokémon puede entrar al campo a recibir el golpe del rival sin sufrir daños.',
        en: 'Memorizing type matchups is not just for dealing damage: it allows you to switch safely into incoming opponent attacks.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Tipos con cobertura defensiva premium',
            en: 'Top Defensive Typings',
          },
          content: {
            es: 'El tipo Acero es el rey defensivo con 10 resistencias y 1 inmunidad (Veneno). Combinado con Hada o Volador, produce algunos de los Pokémon defensivos más difíciles de romper en la historia del juego (como Corviknight o Zacian).',
            en: 'Steel is the defensive gold standard with 10 resistances and 1 immunity (Poison). Combined with Fairy or Flying, it forms defensive cornerstones like Corviknight and Magearna.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Ejemplo de predicción por inmunidad',
            en: 'Immunity Prediction Example',
          },
          description: {
            es: 'Si el rival tiene un Electivire frente a tu Pokémon de Agua, cambiar a un Pokémon de Tierra absorbe el ataque eléctrico sin recibir ni un solo punto de daño.',
            en: 'If your opponent has an Electric attacker facing your Water type, switching to a Ground Pokémon absorbs the attack with zero damage taken.',
          },
        },
      ],
      summary: {
        es: 'Dominar las interacciones de tipos te permite anticipar las opciones del rival y controlar el flujo del enfrentamiento.',
        en: 'Mastering type interactions allows you to anticipate enemy options and dictate the pacing of the clash.',
      },
    },
    nextObjectiveId: 'fundamentals-stab',
  },

  {
    id: 'fundamentals-stab',
    sectionId: 'fundamentals',
    title: {
      es: 'Bonificación de mismo tipo (STAB)',
      en: 'Same-Type Attack Bonus (STAB)',
    },
    description: {
      es: 'Aprovecha el multiplicador de potencia x1.5 al ejecutar movimientos del mismo tipo elemental que tu Pokémon.',
      en: 'Take advantage of the x1.5 damage multiplier when using moves matching your Pokémon’s elemental typing.',
    },
    lesson: {
      introduction: {
        es: 'STAB son las siglas en inglés de Same-Type Attack Bonus. Cuando un Pokémon ejecuta un movimiento que coincide con alguno de sus tipos primario o secundario, la potencia base de ese ataque aumenta en un 50% (multiplicador x1.5).',
        en: 'STAB stands for Same-Type Attack Bonus. When a Pokémon executes a move matching its primary or secondary type, that attack receives a 50% boost to its base power (x1.5 multiplier).',
      },
      sections: [
        {
          title: {
            es: 'El impacto numérico del STAB',
            en: 'The Numerical Impact of STAB',
          },
          content: {
            es: 'Un ataque estándar de 80 de potencia (como Escaldar o Triturar) se convierte en un ataque devastador de 120 de potencia cuando lo utiliza un Pokémon de tipo Agua o Siniestro respectivamente.',
            en: 'A standard 80 base power move (like Scald or Crunch) transforms into a 120 base power strike when used by a Water or Dark type respectively.',
          },
        },
        {
          title: {
            es: 'STAB vs. Coberturas secundarias',
            en: 'STAB vs. Coverage Moves',
          },
          content: {
            es: 'Los movimientos con STAB constituyen las fuentes de daño primarias del Pokémon. Los movimientos de otros tipos se conocen como "movimientos de cobertura" y se usan para castigar debilidades del rival que resistirían tus ataques con STAB.',
            en: 'STAB moves represent your primary damage tools. Non-STAB moves are called "coverage moves," carried specifically to hit Pokémon that resist your STAB attacks.',
          },
        },
      ],
      summary: {
        es: 'El STAB convierte ataques promedio en golpes amenazantes. Todo atacante competitivo debe contar con al menos una opción consistente con STAB.',
        en: 'STAB elevates average attacks into severe threats. Every competitive attacker relies on at least one solid STAB move.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Mecánicas que potencian el STAB',
            en: 'Mechanics That Boost STAB Further',
          },
          content: {
            es: 'Habilidades como Adaptable (Adaptability) elevan el multiplicador de STAB de x1.5 a x2.0. Asimismo, mecánicas generacionales como la Teracristalización permiten obtener un bono de STAB acumulado de x2.0 cuando el teratipo coincide con el tipo original.',
            en: 'Abilities like Adaptability increase STAB from x1.5 to x2.0. Additionally, Terastallization provides an accumulated x2.0 STAB bonus when the Tera type matches the Pokémon’s original typing.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Comparativa de daño real',
            en: 'Real Damage Comparison',
          },
          description: {
            es: 'Un Terremoto (potencia 100) usado por Snorlax tiene potencia 100. El mismo Terremoto usado por Garchomp (tipo Tierra) tiene potencia real de 150 gracias al STAB.',
            en: 'Earthquake (base 100) used by Snorlax has 100 power. The same Earthquake used by Garchomp (Ground type) has 150 effective power thanks to STAB.',
          },
        },
      ],
      summary: {
        es: 'Priorizar movimientos con STAB garantiza la máxima eficiencia en el daño por turno de tus atacantes.',
        en: 'Prioritizing STAB attacks guarantees optimal damage per turn across all your offensive Pokémon.',
      },
    },
    nextObjectiveId: 'fundamentals-physical-special',
  },

  {
    id: 'fundamentals-physical-special',
    sectionId: 'fundamentals',
    title: {
      es: 'Daño físico vs. especial',
      en: 'Physical vs. Special damage',
    },
    description: {
      es: 'Diferencia el cálculo de daño físico (Ataque y Defensa) frente al daño especial (Ataque Especial y Defensa Especial).',
      en: 'Differentiate physical damage (Attack and Defense) from special damage (Special Attack and Special Defense).',
    },
    lesson: {
      introduction: {
        es: 'Desde la 4ª generación, cada movimiento se clasifica individualmente como Físico, Especial o de Estado. Los movimientos físicos comparan el Ataque del usuario contra la Defensa del objetivo. Los movimientos especiales comparan el Ataque Especial contra la Defensa Especial.',
        en: 'Since Generation 4, every move is categorized as Physical, Special, or Status. Physical attacks calculate damage using the attacker’s Attack and defender’s Defense. Special moves use Special Attack and Special Defense.',
      },
      sections: [
        {
          title: {
            es: 'Cómo identificar la categoría de un ataque',
            en: 'How to Identify Move Categories',
          },
          content: {
            es: 'En PokeGuide y en los juegos, el icono de explosión naranja indica movimiento Físico; los anillos concéntricos azules indican movimiento Especial; y el círculo gris-blanco indica movimiento de Estado (no inflige daño directo).',
            en: 'In PokeGuide and the games, the orange explosion icon designates Physical moves; blue concentric ripples designate Special moves; and a grey ring represents Status moves (no direct damage).',
          },
        },
        {
          title: {
            es: 'Especialización de atacantes y murallas',
            en: 'Specialized Attackers and Walls',
          },
          content: {
            es: 'Un atacante físico como Lucario aprovecha movimientos como A Bocajarro porque su Ataque es alto. Un atacante especial como Alakazam utiliza Psíquico aprovechando su alto Ataque Especial. Cruzar categorías sin motivo reduce drásticamente el daño.',
            en: 'A physical sweeper like Lucario relies on Close Combat because its Attack is supreme. A special attacker like Alakazam casts Psychic. Mixing categories without purpose severely degrades damage output.',
          },
        },
      ],
      summary: {
        es: 'Alinear los ataques del Pokémon con su estadística ofensiva más alta es la primera regla para maximizar el daño en combate.',
        en: 'Aligning moves with your Pokémon’s higher offensive stat is the primary rule for optimizing damage in battle.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Excepciones mecánicas clave',
            en: 'Key Mechanical Exceptions',
          },
          content: {
            es: 'Existen ataques especiales que calculan daño contra la Defensa física del rival (como Psicocarga / Psyshock). Esto permite a atacantes especiales derribar murallas especiales como Blissey atacando su lado físico débil.',
            en: 'A few special attacks calculate damage against physical Defense (such as Psyshock). This allows special sweepers to overcome dedicated special walls like Blissey by hitting their weaker physical side.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Caso práctico: Psyshock vs. Blissey',
            en: 'Case Study: Psyshock vs. Blissey',
          },
          description: {
            es: 'Blissey posee una Defensa Especial masiva (base 135) pero una Defensa física nula (base 10). Un ataque como Psicocarga calcula el daño contra su Defensa de 10, logrando un noqueo fulminante.',
            en: 'Blissey has massive Special Defense (base 135) but almost non-existent physical Defense (base 10). Psyshock strikes its base 10 defense, knocking it out easily.',
          },
        },
      ],
      summary: {
        es: 'Saber si el rival es vulnerable por el lado físico o especial te ayuda a elegir el ataque o Pokémon adecuado para romper sus defensas.',
        en: 'Identifying whether a foe is vulnerable on the physical or special side allows you to deploy the perfect counter to crack their defense.',
      },
    },
    nextObjectiveId: 'fundamentals-status-conditions',
  },

  {
    id: 'fundamentals-status-conditions',
    sectionId: 'fundamentals',
    title: {
      es: 'Estados alterados',
      en: 'Status conditions',
    },
    description: {
      es: 'Conoce el impacto táctico de parálisis, quemadura, sueño, envenenamiento y congelamiento durante el combate.',
      en: 'Understand the tactical impact of paralysis, burn, sleep, poison, and freeze in battle.',
    },
    lesson: {
      introduction: {
        es: 'Los estados alterados primarios o no volátiles afectan permanentemente al Pokémon hasta que finaliza el combate o se curan con un movimiento o baya. Un Pokémon solo puede sufrir un estado primario a la vez.',
        en: 'Primary (non-volatile) status conditions persist until healed or until the battle ends. A Pokémon can only suffer from one primary status condition at a time.',
      },
      sections: [
        {
          title: {
            es: 'Quemadura y Parálisis: Más allá del daño',
            en: 'Burn and Paralysis: Beyond Direct Damage',
          },
          content: {
            es: 'La quemadura (BRN) reduce a la mitad (50%) el daño de los ataques físicos del Pokémon afectado, además de restar 1/16 de PS por turno. La parálisis (PAR) reduce la velocidad del Pokémon en un 50% y tiene un 25% de probabilidad de impedirle actuar en cada turno.',
            en: 'Burn (BRN) cuts the victim’s physical Attack in half (50%) while sapping 1/16th HP per turn. Paralysis (PAR) slashes speed by 50% with a 25% chance of being fully paralyzed each turn.',
          },
        },
        {
          title: {
            es: 'Veneno y Veneno Grave (Tóxico)',
            en: 'Poison and Toxic Poisoning',
          },
          content: {
            es: 'El veneno común resta 1/8 de PS por turno. El veneno grave (Tóxico) incrementa su daño turno tras turno (1/16, 2/16, 3/16...), siendo el método por excelencia para desgastar murallas con alta recuperación.',
            en: 'Regular poison inflicts 1/8th max HP each turn. Badly poisoned (Toxic) inflicts escalating damage each turn (1/16, 2/16, 3/16...), making it the premier tool to dismantle bulky recovery walls.',
          },
        },
      ],
      summary: {
        es: 'Inutilizar al atacante físico del rival con quemadura o neutralizar a su velocista con parálisis puede ganar partidas enteras sin lanzar un solo golpe directo.',
        en: 'Crippling an opponent’s physical sweeper with burn or neutralizing a speedster with paralysis wins games without needing brute force.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Inmunidades innatas a estados',
            en: 'Innate Status Immunities',
          },
          content: {
            es: 'Los tipos elementales otorgan inmunidades lógicas: Eléctrico no puede ser paralizado; Fuego no puede ser quemado; Veneno y Acero no pueden ser envenenados; Hielo no puede ser congelado.',
            en: 'Certain types have innate immunities: Electric types cannot be paralyzed; Fire types cannot be burned; Poison and Steel cannot be poisoned; Ice types cannot be frozen.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Fuego Fatuo contra atacantes físicos',
            en: 'Will-O-Wisp against Physical Threats',
          },
          description: {
            es: 'Lanzar Fuego Fatuo sobre un atacante físico letal como Dragonite o Great Tusk divide inmediatamente su potencial ofensivo a la mitad durante el resto del encuentro.',
            en: 'Landing Will-O-Wisp onto a fearsome physical attacker like Dragonite immediately halves its damage output for the rest of the game.',
          },
        },
      ],
      summary: {
        es: 'El control de estados es una de las mayores fuentes de ventaja pasiva en el competitivo.',
        en: 'Status management is one of the highest leverage sources of passive advantage in competitive matches.',
      },
    },
    nextObjectiveId: 'fundamentals-held-items',
  },

  {
    id: 'fundamentals-held-items',
    sectionId: 'fundamentals',
    title: {
      es: 'Objetos equipables competitivos',
      en: 'Competitive held items',
    },
    description: {
      es: 'Descubre cómo objetos como Restos, Vidasfera, Cinta Elegida o Chaleco Asalto transforman la viabilidad de un Pokémon.',
      en: 'Discover how items like Leftovers, Life Orb, Choice Band, or Assault Vest transform a Pokémon’s viability.',
    },
    lesson: {
      introduction: {
        es: 'En competitivo, cada Pokémon debe llevar equipado un objeto que potencie su estrategia. Un Pokémon sin objeto o con un objeto inadecuado lucha con una desventaja insalvable.',
        en: 'In competitive play, every Pokémon carries a strategic held item. Battling without an item or with an inefficient one puts you at a massive structural disadvantage.',
      },
      sections: [
        {
          title: {
            es: 'Objetos de supervivencia y recuperación',
            en: 'Recovery and Longevity Items',
          },
          content: {
            es: 'Restos (Leftovers) recupera 1/16 de PS al final de cada turno, vital para murallas. La Banda Focus (Focus Sash) permite resistir cualquier golpe fulminante con 1 PS si el usuario tenía la salud al 100%.',
            en: 'Leftovers restores 1/16th max HP every turn, essential for defensive anchors. Focus Sash guarantees surviving any fatal strike with 1 HP remaining when at full health.',
          },
        },
        {
          title: {
            es: 'Objetos de elección (Choice Items)',
            en: 'Choice Items',
          },
          content: {
            es: 'Cinta Elegida (Choice Band) multiplica el Ataque por x1.5, Gafas Elegidas (Choice Specs) multiplica el Ataque Especial por x1.5, y Pañuelo Elegido (Choice Scarf) multiplica la Velocidad por x1.5. A cambio, el Pokémon solo puede usar el primer movimiento que elija hasta que sea retirado.',
            en: 'Choice Band boosts Attack by x1.5, Choice Specs boosts Special Attack by x1.5, and Choice Scarf boosts Speed by x1.5. The drawback: you are locked into the first move used until switching out.',
          },
        },
      ],
      summary: {
        es: 'El objeto adecuado potencia los puntos fuertes del Pokémon o mitiga sus debilidades más críticas.',
        en: 'The right held item amplifies a Pokémon’s greatest strength or patches its most glaring vulnerability.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Chaleco Asalto y Vidasfera: Poder con contrapartida',
            en: 'Assault Vest & Life Orb: Power with Tradeoffs',
          },
          content: {
            es: 'La Vidasfera (Life Orb) aumenta el daño de todos los ataques un 30% a cambio de perder un 10% de PS con cada golpe. El Chaleco Asalto (Assault Vest) incrementa la Defensa Especial un 50% pero impide ejecutar movimientos que no causen daño directo.',
            en: 'Life Orb increases move damage by 30% at the cost of 10% max HP per strike. Assault Vest elevates Special Defense by 50% but restricts you to using only damaging attacks.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Sorpresa de velocidad con Pañuelo Elegido',
            en: 'Speed Ambush with Choice Scarf',
          },
          description: {
            es: 'Un Gengar con Pañuelo Elegido supera en velocidad a amenazas naturalmente más veloces como Dragapult, noqueándolas de un golpe antes de que puedan reaccionar.',
            en: 'A Choice Scarf Gengar outspeeds naturally faster threats like Dragapult, knocking them out before they can retaliate.',
          },
        },
      ],
      summary: {
        es: 'Equipar objetos coherentes con el rol del Pokémon es fundamental para que el equipo funcione como una máquina coordinada.',
        en: 'Matching held items with your Pokémon’s explicit role ensures your team operates as a harmonious machine.',
      },
    },
    nextObjectiveId: null, // Final de la sección -> lleva al Examen de Fundamentos
  },

  // =========================================================================
  // 2. ⚔️ Combate
  // =========================================================================
  {
    id: 'combat-how-it-works',
    sectionId: 'combat',
    title: {
      es: 'Cómo funciona un combate competitivo',
      en: 'How a competitive battle works',
    },
    description: {
      es: 'Comprende la estructura de una partida, la selección de equipo (Team Preview), el flujo de turnos simultáneos y cómo se define la victoria.',
      en: 'Understand match structure, Team Preview, simultaneous turn flow, and how victory is decided.',
    },
    lesson: {
      introduction: {
        es: 'En la aventura individual juegas por turnos donde la máquina espera pacientemente tus acciones. En el competitivo, ambos entrenadores eligen sus jugadas al mismo tiempo sin saber con certeza qué hará el oponente.',
        en: 'In the single-player story you play through simple turn sequences where AI waits for your inputs. In competitive play, both trainers lock in decisions simultaneously without absolute knowledge of the opponent’s choice.',
      },
      sections: [
        {
          title: {
            es: 'La Selección de Equipo (Team Preview)',
            en: 'Team Preview',
          },
          content: {
            es: 'Antes de lanzar el primer Pokémon a la arena, ambos jugadores ven los 6 integrantes del equipo rival. Este momento se conoce como Team Preview. Aquí deduces qué amenazas tiene el rival, cuál es tu mejor Pokémon inicial (Lead) y cuál será tu plan general.',
            en: 'Before the opening turn, both players see all six Pokémon on the opposing roster. This phase is Team Preview. Here you deduce major threats, decide on your lead Pokémon, and formulate an overall game plan.',
          },
        },
        {
          title: {
            es: 'Estructura del turno simultáneo',
            en: 'Simultaneous Turn Resolution',
          },
          content: {
            es: 'Cada turno es una ventana cerrada de tiempo. Ambos jugadores envían su acción (atacar, cambiar de Pokémon o protegerse). El juego recopila ambas decisiones y las resuelve en un orden estricto determinado por prioridad y velocidad.',
            en: 'Every turn is a discrete decision window. Both players lock in their action (attack, switch, or protect). The engine collects both choices and resolves them in a strict sequence dictated by priority and Speed.',
          },
        },
      ],
      summary: {
        es: 'Un combate competitivo no es una carrera de fuerza ciega, sino una secuencia ordenada de decisiones simultáneas donde cada turno cuenta.',
        en: 'A competitive match is not a raw brawl, but a disciplined sequence of simultaneous decisions where every single turn matters.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Entornos de juego: Simulador vs. Torneo oficial',
            en: 'Environments: Simulators vs. Official Tournaments',
          },
          content: {
            es: 'En herramientas comunitarias como Pokémon Showdown practicas en un simulador ágil vía web. En Pokémon Champions o consolas oficiales compites con cronómetros por turno estrictos y animaciones completas. Las reglas lógicas de decisión son idénticas en ambos contextos.',
            en: 'On community platforms like Pokémon Showdown you practice in a streamlined web simulator. In Pokémon Champions or official console events you battle under strict turn timers and full battle animations. Tactical decision logic is identical across both.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Ejemplo: La primera decisión de la partida',
            en: 'Example: The Opening Decision',
          },
          description: {
            es: 'En Team Preview ves que el rival tiene un atacante de tipo Fuego amenazante. Decides abrir la partida con tu Pokémon de tipo Agua para forzarlo a defenderse desde el primer segundo.',
            en: 'At Team Preview you notice the rival carries a threatening Fire sweeper. You choose your Water type as your lead to exert immediate positional pressure from turn one.',
          },
        },
      ],
      summary: {
        es: 'Comprender la estructura del turno te quita la ansiedad de jugar rápido: tómate tu tiempo para planificar cada acción.',
        en: 'Understanding turn mechanics alleviates rush anxiety: take your allotted time to plan out every move.',
      },
    },
    nextObjectiveId: 'combat-turn-actions',
  },

  {
    id: 'combat-turn-actions',
    sectionId: 'combat',
    title: {
      es: '¿Qué puedo hacer durante un turno?',
      en: 'What can I do during a turn?',
    },
    description: {
      es: 'Conoce las acciones disponibles en cada turno —atacar, cambiar o usar movimientos de estado— y aprende a verlas como decisiones tácticas.',
      en: 'Learn available turn actions —attacking, switching, or using status moves— and treat them as tactical decisions.',
    },
    lesson: {
      introduction: {
        es: 'En cada turno no solo eliges un botón de ataque: estás eligiendo qué objetivo quieres alcanzar en la partida. Cada acción tiene consecuencias que afectan el ritmo del enfrentamiento.',
        en: 'Every turn is not just about clicking an attack button: you are selecting what objective you want to accomplish in the game. Each action ripples into match tempo.',
      },
      sections: [
        {
          title: {
            es: 'Atacar vs. Usar movimientos de estado',
            en: 'Attacking vs. Status Moves',
          },
          content: {
            es: 'Puedes infligir daño directo para reducir los PS del rival o ejecutar movimientos de estado para alterar el ritmo (dormir, paralizar, aumentar tus estadísticas o protegerte). No todos los turnos se ganan haciendo daño.',
            en: 'You can deal direct damage to drain rival HP or cast status moves to manipulate tempo (inflict sleep, paralyze, buff stats, or shield yourself). Not all turns are won by dealing raw damage.',
          },
        },
        {
          title: {
            es: 'Cambiar de Pokémon: Una acción con prioridad',
            en: 'Switching: A High-Priority Move',
          },
          content: {
            es: 'Cambiar retira a tu Pokémon activo y coloca a otro de tu equipo en el campo. Los cambios se ejecutan antes que casi cualquier ataque. Elegir cambiar significa renunciar a golpear este turno para ganar una mejor posición o salvar a tu criatura.',
            en: 'Switching withdraws your active Pokémon and deploys a teammate. Switches resolve before almost all standard attacks. Choosing to switch concedes your attack this turn in exchange for superior positioning.',
          },
        },
      ],
      summary: {
        es: 'Cada turno ofrece la alternativa de golpear, preparar el terreno o reubicar a tus piezas en el campo.',
        en: 'Every turn presents the choice to strike, prepare the field, or reposition your pieces on the board.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'El turno como inversión de recursos',
            en: 'Turns as Resource Investments',
          },
          content: {
            es: 'Usar Protección (Protect) te permite observar qué intenta hacer el rival sin recibir daño, mientras que usar un movimiento de potenciación como Danza Espada invierte un turno entero para duplicar tu fuerza en los turnos posteriores.',
            en: 'Using Protect lets you scout the opponent’s intention without taking damage, whereas using Swords Dance invests a full turn to double your firepower for subsequent turns.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Decisión: ¿Atacar o Protegerse?',
            en: 'Scenario: Attack or Protect?',
          },
          description: {
            es: 'Tu Pokémon está débil y el rival prepara un ataque rápido. Usar Protección bloquea el golpe en este turno y permite que el efecto de un clima o el desgaste del rival jueguen a tu favor.',
            en: 'Your Pokémon is low on HP and the opponent prepares a fast strike. Using Protect blocks the attack this turn, letting weather chip or partner pressure turn the tide.',
          },
        },
      ],
      summary: {
        es: 'No elijas una acción solo por impulso; pregúntate qué ventaja concreta obtendrás al final del turno.',
        en: 'Never act on raw impulse; ask yourself what tangible advantage you will hold once the turn concludes.',
      },
    },
    nextObjectiveId: 'combat-priority-speed',
  },

  {
    id: 'combat-priority-speed',
    sectionId: 'combat',
    title: {
      es: 'Cómo se resuelven las acciones: Prioridad y velocidad',
      en: 'How actions resolve: Priority and Speed',
    },
    description: {
      es: 'Comprende los rangos de prioridad (-7 a +5), la estadística de Velocidad como desempate y qué ocurre en un Speed Tie.',
      en: 'Understand priority brackets (-7 to +5), the Speed stat as a tiebreaker, and what happens during Speed Ties.',
    },
    lesson: {
      introduction: {
        es: 'Cuando ambos jugadores ordenan sus acciones, el juego decide quién actúa primero mediante un sistema de dos filtros: primero evalúa el rango de prioridad del movimiento y luego la velocidad del Pokémon.',
        en: 'When both players input commands, the battle engine decides move order through two sequential filters: first it checks move priority brackets, and then it compares Pokémon Speed stats.',
      },
      sections: [
        {
          title: {
            es: 'Los escalones de prioridad (-7 a +5)',
            en: 'Priority Brackets (-7 to +5)',
          },
          content: {
            es: 'La inmensa mayoría de ataques estándar tienen prioridad 0. Movimientos como Velocidad Extrema (+2) o Golpe Bajo (+1) actúan antes que cualquier ataque de prioridad 0, sin importar qué tan veloz sea el rival. Movimientos como Rugido o Espacio Raro tienen prioridad negativa (-6 o -7) y actúan al final.',
            en: 'The vast majority of standard moves sit at priority 0. Moves like Extreme Speed (+2) or Sucker Punch (+1) strike before any 0-priority move regardless of rival Speed. Moves like Roar or Trick Room carry negative priority (-6 or -7) and trigger last.',
          },
        },
        {
          title: {
            es: 'La Velocidad como desempate y los Speed Ties',
            en: 'Speed as Tiebreaker and Speed Ties',
          },
          content: {
            es: 'Si dos movimientos pertenecen al mismo escalón de prioridad (por ejemplo, ambos usan ataques de prioridad 0), se mueve primero el Pokémon con mayor Velocidad actual. Si ambos tienen exactamente la misma cifra de Velocidad, ocurre un Speed Tie: una moneda al aire al 50% decide quién golpea primero.',
            en: 'If two moves share the exact same priority bracket (e.g. both use 0-priority attacks), the Pokémon with higher current Speed acts first. If both share identical Speed numbers, a Speed Tie occurs: a 50/50 coin flip determines who moves first.',
          },
        },
      ],
      summary: {
        es: 'Los movimientos con prioridad positiva superan a la velocidad estándar y permiten rematar rivales veloces antes de que puedan actuar.',
        en: 'Positive priority bypasses natural Speed, allowing you to finish off frail speedsters before they can strike.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Modificadores del orden en combate',
            en: 'In-Battle Turn Order Modifiers',
          },
          content: {
            es: 'La parálisis divide la velocidad de un Pokémon a la mitad (-50%). Efectos de equipo como Viento Afín la duplican (+100%), mientras que Espacio Raro invierte la jerarquía de velocidad durante 5 turnos, haciendo que los más lentos actúen antes dentro de su prioridad.',
            en: 'Paralysis cuts a Pokémon’s Speed in half (-50%). Team effects like Tailwind double team Speed, whereas Trick Room inverts the speed ladder for 5 turns, making slower creatures move first within their priority tier.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Golpe Bajo para asegurar la victoria',
            en: 'Sucker Punch Closes the Match',
          },
          description: {
            es: 'A tu Pokémon le quedan 10 PS frente a un rival naturalmente mucho más rápido. En lugar de usar un ataque normal que perdería en velocidad, usas Golpe Bajo (+1). Al tener prioridad, golpeas primero y ganas el encuentro.',
            en: 'Your Pokémon has 10 HP facing an opponent that naturally outspeeds you. Instead of using a normal attack, you pick Sucker Punch (+1). Priority guarantees you strike first and seal the win.',
          },
        },
      ],
      summary: {
        es: 'Conocer las prioridades evita perder partidas por intentar superar en velocidad a un movimiento prioritario.',
        en: 'Tracking priority brackets prevents costly defeats caused by attempting to outspeed priority strikes.',
      },
    },
    nextObjectiveId: 'combat-choosing-moves',
  },

  {
    id: 'combat-choosing-moves',
    sectionId: 'combat',
    title: {
      es: 'Cómo elegir un movimiento',
      en: 'How to choose a move',
    },
    description: {
      es: 'Aprende a evaluar el contexto antes de presionar un botón: daño proyectado, efectividad, precisión y la respuesta esperada del rival.',
      en: 'Learn to evaluate battle context before clicking a move: projected damage, effectiveness, accuracy, and expected enemy responses.',
    },
    lesson: {
      introduction: {
        es: 'El error más común de los novatos es presionar siempre el ataque con mayor número de potencia. En competitivo, la elección correcta depende enteramente de la situación del tablero.',
        en: 'The most common beginner blunder is blindly selecting the move with the highest power number. In competitive play, the optimal choice depends strictly on board context.',
      },
      sections: [
        {
          title: {
            es: '¿Logra el daño que necesito?',
            en: 'Does it achieve the damage threshold I need?',
          },
          content: {
            es: 'Si al rival le queda un 15% de vida, usar un ataque impreciso de 120 de potencia como Hidrobomba es un riesgo innecesario. Un ataque seguro de 80 de potencia con 100% de precisión como Surf garantiza el K.O. sin riesgo de fallar.',
            en: 'If a rival has 15% HP remaining, casting an inaccurate 120-power move like Hydro Pump is an unforced gamble. A reliable 80-power move with 100% accuracy like Surf secures the knockout risk-free.',
          },
        },
        {
          title: {
            es: 'Anticipar la reacción del oponente',
            en: 'Anticipating Opponent Reactions',
          },
          content: {
            es: 'Pregúntate: si selecciono este ataque, ¿el rival se quedará en el campo o cambiará a un Pokémon resistente? Si cambia, ¿este ataque daña al Pokémon que va a entrar o le regala un turno libre?',
            en: 'Ask yourself: if I choose this move, will the rival stay in or switch to a resistant teammate? If they switch, does this move punish the incoming creature or grant them a free turn?',
          },
        },
      ],
      summary: {
        es: 'El movimiento correcto no es el más fuerte, sino el que mejor responde al contexto de ambos jugadores en ese turno.',
        en: 'The right move is never merely the strongest, but the one that best addresses both players’ positions this turn.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Potencia vs. Precisión y Consistencia',
            en: 'Power vs. Accuracy and Consistency',
          },
          content: {
            es: 'Un ataque de 90 de potencia con 100% de precisión suele ser infinitamente superior en torneos a uno de 110 con 70% de precisión. Un fallo en el turno decisivo cuesta la partida.',
            en: 'A 90-power attack with 100% accuracy is almost always superior in competitive play to a 110-power move with 70% accuracy. A single miss on a decisive turn forfeits the game.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Rayo Hielo vs. Ventisca',
            en: 'Ice Beam vs. Blizzard',
          },
          description: {
            es: 'Rayo Hielo (90 de potencia, 100% precisión) conecta de forma fiable cada vez que lo ordenas. Ventisca (110 de potencia, 70% precisión) fallará casi 1 de cada 3 veces salvo que haya clima de nieve activo.',
            en: 'Ice Beam (90 power, 100% accuracy) connects reliably every single time. Blizzard (110 power, 70% accuracy) will miss roughly 1 out of 3 times unless snow weather is active.',
          },
        },
      ],
      summary: {
        es: 'Elige movimientos que reduzcan la incertidumbre y aseguren la ejecución de tu plan.',
        en: 'Select moves that minimize RNG uncertainty and guarantee tactical execution.',
      },
    },
    nextObjectiveId: 'combat-type-effectiveness',
  },

  {
    id: 'combat-type-effectiveness',
    sectionId: 'combat',
    title: {
      es: 'Efectividad de tipos durante un combate',
      en: 'Type effectiveness in battle',
    },
    description: {
      es: 'Aplica las ventajas y desventajas elementales en tiempo real: lee el campo y toma decisiones basadas en qué espera tu oponente.',
      en: 'Apply elemental advantages in real time: read the field and make battle decisions based on what your opponent anticipates.',
    },
    lesson: {
      introduction: {
        es: 'En Fundamentos aprendiste la tabla de los 18 tipos elementales. En Combate, esa tabla deja de ser teoría estática y se convierte en la brújula para predecir jugadas y crear ventajas posicionales.',
        en: 'In Fundamentals you learned the 18-type elemental chart. In Combat, that chart transforms from passive theory into your active compass for predicting plays and building positional leverage.',
      },
      sections: [
        {
          title: {
            es: 'La presión del enfrentamiento elemental',
            en: 'Elemental Matchup Pressure',
          },
          content: {
            es: 'Cuando tu Pokémon activo tiene ventaja de tipo sobre el rival (por ejemplo, Agua contra Fuego), el oponente siente una inmensa presión de retirarse. Esta posición favorable te otorga el control de la iniciativa.',
            en: 'When your active Pokémon holds a natural type advantage over the rival (e.g. Water against Fire), the opponent feels intense pressure to retreat. This favorable position awards you match tempo.',
          },
        },
        {
          title: {
            es: 'Ataques de cobertura: Sorprender al cambio',
            en: 'Coverage Moves: Catching the Switch',
          },
          content: {
            es: 'Si tienes a tu Pokémon de Agua frente al de Fuego, pero sabes que su equipo tiene un Pokémon de Planta en la reserva, usar un movimiento de tipo Hielo puede castigar severamente al Pokémon de Planta en el mismo turno en que entra.',
            en: 'If your Water Pokémon faces a Fire foe but you know their bench holds a Grass type, firing an Ice coverage move will heavily punish that Grass Pokémon on the very turn it switches in.',
          },
        },
      ],
      summary: {
        es: 'Los tipos dictan las intenciones de ambos entrenadores en cada turno del combate.',
        en: 'Typings dictate both trainers’ tactical intentions on every single turn.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Inmunidades como escudos gratuitos',
            en: 'Immunities as Free Shields',
          },
          content: {
            es: 'Los tipos con inmunidades totales (Volador contra Tierra, Fantasma contra Normal/Lucha, Tierra contra Eléctrico, Hada contra Dragón) te permiten anular turnos enteros del rival si anticipas su ataque con un cambio limpio.',
            en: 'Typings with natural immunities (Flying vs. Ground, Ghost vs. Normal/Fighting, Ground vs. Electric, Fairy vs. Dragon) allow you to nullify opponent turns entirely by switching in cleanly.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Cambio defensivo ante Terremoto',
            en: 'Defensive Switch into Earthquake',
          },
          description: {
            es: 'Tu Pokémon de Fuego está a punto de recibir un Terremoto letal. Cambias en ese mismo turno a tu Pokémon Volador, que entra flotando e inmune, haciendo que el oponente gaste su turno sin infligir daño.',
            en: 'Your Fire Pokémon faces an impending lethal Earthquake. You switch immediately to your Flying teammate, who enters completely immune, causing the opponent to waste their turn doing zero damage.',
          },
        },
      ],
      summary: {
        es: 'Usa las ventajas elementales no solo para golpear fuerte, sino para forzar al rival a jugar bajo tus condiciones.',
        en: 'Use elemental advantages not just to hit hard, but to force the opponent to play entirely on your terms.',
      },
    },
    nextObjectiveId: 'combat-stab-application',
  },

  {
    id: 'combat-stab-application',
    sectionId: 'combat',
    title: {
      es: 'STAB aplicado al combate',
      en: 'STAB applied to combat',
    },
    description: {
      es: 'Descubre cómo el multiplicador del 50% altera los cálculos prácticos en batalla y cuándo conviene priorizar cobertura sobre STAB.',
      en: 'Discover how the 50% multiplier affects battle calculations and when to prioritize coverage over STAB.',
    },
    lesson: {
      introduction: {
        es: 'El STAB (Same-Type Attack Bonus) otorga un 50% extra de daño a los ataques que coinciden con el tipo de tu Pokémon. En combate, este bono define tu ataque más fiable y consistente.',
        en: 'STAB (Same-Type Attack Bonus) grants a 50% damage boost to moves matching your Pokémon’s typing. In battle, this bonus defines your most dependable offensive weapon.',
      },
      sections: [
        {
          title: {
            es: 'STAB neutro vs. Cobertura súper eficaz',
            en: 'Neutral STAB vs. Super Effective Coverage',
          },
          content: {
            es: 'Un ataque con STAB de 80 de potencia tiene una fuerza real de 120 (80 x 1.5). Un ataque sin STAB de 60 de potencia que golpea súper eficaz (x2) también tiene fuerza de 120 (60 x 2). El STAB te da potencia de súper eficaz sin necesidad de acertar una debilidad elemental.',
            en: 'An 80-power STAB move packs an effective 120 power (80 x 1.5). A non-STAB 60-power move hitting super-effectively (x2) also delivers 120 power. STAB provides super-effective damage output without requiring a weakness matchup.',
          },
        },
        {
          title: {
            es: 'Cuándo NO usar tu movimiento con STAB',
            en: 'When NOT to use your STAB move',
          },
          content: {
            es: 'Si el rival resiste tu tipo elemental (daño x0.5) o es inmune (x0), tu ataque con STAB pierde toda su eficacia. En esos turnos es cuando brilla un movimiento de cobertura o un cambio oportuno.',
            en: 'If the opponent resists your elemental type (x0.5 damage) or is immune (x0), your STAB strike loses its effectiveness. In those turns, a coverage attack or a timely switch takes priority.',
          },
        },
      ],
      summary: {
        es: 'Tu movimiento con STAB es tu martillo principal, pero la cobertura elemental es la llave que abre a los rivales que resisten tu tipo.',
        en: 'Your STAB attack is your main sledgehammer, but coverage moves unlock the doors against foes that resist your typing.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'La regla de oro del daño consistente',
            en: 'The Golden Rule of Consistent Output',
          },
          content: {
            es: 'Como norma general, si un ataque con STAB causa daño neutro y no hay riesgo de inmunidad, suele ser la jugada más segura y con mayor daño garantizado para tu atacante.',
            en: 'As a rule of thumb, if a STAB attack hits neutrally with zero immunity risk, it is almost always the safest and most consistent play for your attacker.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Garchomp: Terremoto vs. Demolición',
            en: 'Garchomp: Earthquake vs. Brick Break',
          },
          description: {
            es: 'Garchomp (Dragón/Tierra) usando Terremoto (potencia 100 + STAB = 150) inflige 150 de daño neutro contra un rival Normal. Usar Demolición (potencia 75, Lucha, súper eficaz x2 = 150) hace exactamente el mismo daño pero sin aprovechar el STAB natural.',
            en: 'Garchomp (Dragon/Ground) using Earthquake (base 100 + STAB = 150) deals 150 neutral damage against a Normal type. Using Brick Break (base 75, Fighting, x2 = 150) deals the exact same damage without utilizing natural STAB.',
          },
        },
      ],
      summary: {
        es: 'Entender el valor numérico del STAB te ayuda a no complicar tus decisiones cuando un ataque con STAB neutro ya resuelve el problema.',
        en: 'Understanding STAB values prevents overcomplicating plays when neutral STAB already solves the board.',
      },
    },
    nextObjectiveId: 'combat-when-to-switch',
  },

  {
    id: 'combat-when-to-switch',
    sectionId: 'combat',
    title: {
      es: 'Cuándo cambiar de Pokémon',
      en: 'When to switch Pokémon',
    },
    description: {
      es: 'Comprende cuándo retirarse para salvar una pieza clave, cómo absorber ataques con resistencias y cuándo quedarse a pelear.',
      en: 'Understand when to retreat to preserve a key piece, how to absorb hits with resistances, and when to stay and fight.',
    },
    lesson: {
      introduction: {
        es: 'Cambiar de Pokémon no es una señal de debilidad o miedo: es una de las decisiones más estratégicas y frecuentes del competitivo. Un cambio a tiempo salva partidas enteras.',
        en: 'Switching Pokémon is never a sign of retreat or fear: it is one of the most tactical and frequent decisions in competitive play. A timely switch saves entire matches.',
      },
      sections: [
        {
          title: {
            es: 'Motivos fundamentales para cambiar',
            en: 'Core Reasons to Switch',
          },
          content: {
            es: 'Cambias para: 1) Salvar a un Pokémon clave de un K.O. inminente; 2) Enviar a un compañero que resiste los ataques del rival; 3) Recuperar la ventaja de tipo en el campo.',
            en: 'You switch to: 1) Save a vital teammate from an impending knockout; 2) Deploy a partner that resists incoming enemy attacks; 3) Reclaim elemental matchup advantage.',
          },
        },
        {
          title: {
            es: 'El coste del cambio: El turno libre del rival',
            en: 'The Cost of Switching: Giving a Free Turn',
          },
          content: {
            es: 'Cuando cambias, tu Pokémon entrante recibe el ataque del rival sin poder responder en ese mismo turno. Si cambias sin un plan claro, le estás regalando un turno gratis al oponente para atacar o potenciarse.',
            en: 'When switching, your incoming Pokémon absorbs the rival’s hit without responding that turn. Switching without a clear purpose hands your opponent a free turn to attack or set up.',
          },
        },
      ],
      summary: {
        es: 'Cambiar es una decisión activa que busca una mejor posición, pero exige considerar qué golpe recibirá el compañero entrante.',
        en: 'Switching is an active positional move, but demands considering the damage your incoming partner will take.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Quedarse y atacar: El valor de aguantar',
            en: 'Staying In: The Value of Standing Ground',
          },
          content: {
            es: 'A veces tu Pokémon activo está en desventaja aparente, pero el rival espera que cambies. Si te quedas y atacas, puedes sorprender al oponente y castigar su jugada.',
            en: 'Sometimes your active Pokémon faces an apparent disadvantage, but the rival expects an immediate switch. Staying in and attacking can surprise the opponent and punish their anticipation.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Cambio directo a una muralla',
            en: 'Hard Switch to a Dedicated Wall',
          },
          description: {
            es: 'Tu atacante frágil está frente a un rival amenazante. En lugar de arriesgarte a que caiga debilitado, cambias directamente a Corviknight, cuya tremenda defensa absorbe el golpe con facilidad.',
            en: 'Your frail sweeper faces a threatening foe. Rather than risking a knockout, you hard-switch directly to Corviknight, whose defensive bulk easily absorbs the strike.',
          },
        },
      ],
      summary: {
        es: 'Antes de cambiar, asegúrate de que el Pokémon que entra puede resistir el impacto y tomar el control del siguiente turno.',
        en: 'Before switching, verify that the incoming teammate can withstand the blow and seize control next turn.',
      },
    },
    nextObjectiveId: 'combat-momentum-pivoting',
  },

  {
    id: 'combat-momentum-pivoting',
    sectionId: 'combat',
    title: {
      es: 'Inercia y cambios de ritmo (Momentum y Pivoting)',
      en: 'Momentum and pivoting',
    },
    description: {
      es: 'Utiliza movimientos de pivote como Ida y Vuelta o Voltiocambio para mantener la iniciativa y dictar el ritmo del encuentro.',
      en: 'Use pivot moves like U-turn and Volt Switch to maintain initiative and dictate the flow of the game.',
    },
    lesson: {
      introduction: {
        es: 'El Momentum o inercia es la ventaja de forzar al rival a reaccionar continuamente a tus decisiones en lugar de permitirle ejecutar su propio plan de juego.',
        en: 'Momentum is the strategic initiative of forcing your opponent to react constantly to your plays rather than letting them execute their own game plan.',
      },
      sections: [
        {
          title: {
            es: 'Movimientos de pivoteo: Atacar y cambiar a la vez',
            en: 'Pivot Moves: Striking and Switching Together',
          },
          content: {
            es: 'Movimientos como Ida y Vuelta (U-turn) y Voltiocambio (Volt Switch) permiten infligir daño y cambiar de Pokémon en la misma acción, evitando ceder un turno neutro al oponente.',
            en: 'Moves like U-turn and Volt Switch inflict direct damage and switch Pokémon within the same action, preventing you from conceding a neutral turn.',
          },
        },
        {
          title: {
            es: 'El pivote lento: Entrada limpia',
            en: 'The Slow Pivot: Clean Entry',
          },
          content: {
            es: 'Si tu Pokémon con Ida y Vuelta es más lento que el rival, primero absorbe el ataque enemigo con sus defensas y luego cambia al final del turno, permitiendo que tu atacante frágil entre al campo con el 100% de PS.',
            en: 'If your U-turn user is slower than the opponent, it takes the enemy hit on its defensive bulk first and switches last, allowing your frail attacker to enter the field with 100% HP.',
          },
        },
      ],
      summary: {
        es: 'Los movimientos de pivoteo te otorgan la iniciativa permanente y permiten posicionar a tus atacantes sin peligro.',
        en: 'Pivot moves award permanent initiative and position your offensive threats without taking damage on entry.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Romper el ritmo del oponente',
            en: 'Disrupting Opponent Rhythm',
          },
          content: {
            es: 'Cuando mantienes el momentum, el rival pasa la partida cambiando y defendiéndose sin poder presionar tus puntos débiles. Mantener la iniciativa es la forma más consistente de ganar.',
            en: 'When maintaining momentum, your opponent spends the match defensively switching without pressuring your weak points. Sustaining initiative is the most consistent path to victory.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Rotom-Lavadora con Voltiocambio',
            en: 'Rotom-Wash with Volt Switch',
          },
          description: {
            es: 'Rotom absorbe un ataque rival con su gran resistencia, usa Voltiocambio para infligir daño eléctrico y de inmediato da paso a tu atacante más letal en una posición inmejorable.',
            en: 'Rotom absorbs an incoming hit with solid bulk, fires Volt Switch to deal Electric damage, and immediately brings in your lethal sweeper in an advantageous position.',
          },
        },
      ],
      summary: {
        es: 'Quien domina el momentum dicta el compás de la partida y fuerza al oponente a cometer errores.',
        en: 'Whoever controls momentum dictates match tempo and coerces the opponent into unforced errors.',
      },
    },
    nextObjectiveId: 'combat-prediction',
  },

  {
    id: 'combat-prediction',
    sectionId: 'combat',
    title: {
      es: 'Leer al rival sin adivinar: El arte de la predicción',
      en: 'The art of prediction',
    },
    description: {
      es: 'Aprende a anticipar cambios del rival y jugadas de alto valor basándote en la lógica del tablero en vez de apostar a ciegas.',
      en: 'Learn to anticipate switches and high-value plays based on board logic rather than blind gambles.',
    },
    lesson: {
      introduction: {
        es: 'Predecir (o hacer una "read") no consiste en leer la mente ni adivinar por arte de magia: consiste en analizar qué opciones tiene el rival y cuál de ellas es la más lógica para él.',
        en: 'Predicting (or making a "read") does not mean psychic mind reading: it means analyzing the opponent’s available options and deducing their most logical move.',
      },
      sections: [
        {
          title: {
            es: 'Identificar la jugada más evidente del oponente',
            en: 'Identifying the Obvious Play',
          },
          content: {
            es: 'Si tu rival está en un enfrentamiento pésimo donde su Pokémon caería noqueado de un golpe, lo más probable es que cambie a su mejor resistencia. Reconocer esa obviedad es el primer paso de la predicción.',
            en: 'If your opponent sits in a catastrophic matchup where their active Pokémon will be knocked out in one hit, they will almost certainly switch to their best counter. Recognizing that reality is step one.',
          },
        },
        {
          title: {
            es: 'Predecir no es apostar la partida',
            en: 'Prediction is Not Gambling',
          },
          content: {
            es: 'Una buena predicción tiene una recompensa enorme si aciertas, pero no te deja en la ruina si fallas. Si equivocarte en la predicción te hace perder la partida de inmediato, la jugada es imprudente.',
            en: 'A sound prediction yields high rewards when successful, but does not ruin you if incorrect. If being wrong loses the game on the spot, the move is an irresponsible gamble.',
          },
        },
      ],
      summary: {
        es: 'Predecir consiste en deducir la decisión más razonable del rival basándote en la información visible en el campo.',
        en: 'Prediction means deducing the opponent’s most rational choice based on visible board information.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Observar patrones de comportamiento',
            en: 'Observing Behavioral Patterns',
          },
          content: {
            es: 'A lo largo de los primeros turnos, observa si el rival juega de forma muy conservadora (cambia siempre ante el menor peligro) o agresiva (se queda siempre a golpear). Adapta tus lecturas a su estilo.',
            en: 'Across opening turns, observe whether the rival plays conservatively (switches on any mild threat) or aggressively (always stays in and hits). Adapt your reads to their tendencies.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Castigar el cambio esperado',
            en: 'Punishing the Predicted Switch',
          },
          description: {
            es: 'Tienes a un atacante eléctrico frente a un Pokémon de agua. Es casi seguro que el rival cambiará a su Pokémon de tierra. En lugar de usar un ataque eléctrico, seleccionas un ataque de planta: el rival cambia y su Pokémon de tierra recibe el golpe directo al entrar.',
            en: 'Your Electric attacker faces a Water Pokémon. The rival is almost guaranteed to switch to their Ground type. Instead of clicking Electric, you choose a Grass attack: the rival switches and their Ground counter takes heavy damage on entry.',
          },
        },
      ],
      summary: {
        es: 'La predicción sólida surge de entender qué necesita el rival en cada momento y ofrecerle respuestas preparadas.',
        en: 'Rock-solid prediction stems from understanding what the rival needs and preparing answers in advance.',
      },
    },
    nextObjectiveId: 'combat-risk-reward',
  },

  {
    id: 'combat-risk-reward',
    sectionId: 'combat',
    title: {
      es: 'Gestión de riesgo y recompensa',
      en: 'Risk vs. Reward management',
    },
    description: {
      es: 'Evalúa cuándo jugar sobre seguro y cuándo arriesgar con una jugada agresiva dependiendo del estado de la partida.',
      en: 'Evaluate when to play safe and when to take aggressive risks based on the current match state.',
    },
    lesson: {
      introduction: {
        es: 'En cada turno de combate existe una balanza entre el riesgo que asumes y la recompensa que esperas obtener. Los mejores jugadores calculan qué opción ofrece el mayor porcentaje de victoria.',
        en: 'Every turn presents a balance between the risk you assume and the reward you expect. Elite players calculate which option provides the highest mathematical win rate.',
      },
      sections: [
        {
          title: {
            es: 'La jugada sólida (Safe Play)',
            en: 'The Solid Safe Play',
          },
          content: {
            es: 'Una jugada sólida es aquella que te proporciona una ventaja constante o avance en la partida con un riesgo mínimo de desastre, independientemente de lo que decida hacer el rival.',
            en: 'A safe play delivers consistent progress or board advantage with minimal risk of catastrophe, regardless of what the opponent decides to do.',
          },
        },
        {
          title: {
            es: 'Cuándo arriesgar y cuándo asegurar',
            en: 'When to Risk and When to Consolidate',
          },
          content: {
            es: 'Si vas liderando el combate con ventaja numérica, tu objetivo es minimizar riesgos con jugadas seguras. Si estás en desventaja crítica y perdiendo, jugar sobre seguro solo consolidará tu derrota: es el momento de asumir riesgos calculados.',
            en: 'When leading with a numeric advantage, minimize risks with solid safe plays. When falling far behind, playing safe only cements defeat: that is the exact time to take calculated aggressive risks.',
          },
        },
      ],
      summary: {
        es: 'Si vas ganando, simplifica y asegura; si vas perdiendo, busca jugadas que alteren el rumbo del combate.',
        en: 'When ahead, simplify and play safe; when behind, seek high-upside plays that flip the game.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'El error de sobre-predecir (Overpredicting)',
            en: 'The Trap of Overpredicting',
          },
          content: {
            es: 'Muchos principiantes pierden porque intentan adivinar jugadas complejas cuando el rival simplemente iba a presionar su ataque más obvio. No busques jugadas extravagantes si la opción simple ya gana.',
            en: 'Many novices blunder by predicting intricate multi-step reads when the opponent was just going to click their most obvious attack. Do not overcomplicate when simple execution wins.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'La jugada segura con ventaja',
            en: 'Safe Play with Advantage',
          },
          description: {
            es: 'Te queda 1 Pokémon rival con 20% de PS y tú tienes 3 Pokémon sanos. La jugada segura es atacar con tu movimiento más preciso para cerrar el combate, sin inventar cambios ni predicciones de alto riesgo.',
            en: 'The rival has 1 Pokémon at 20% HP while you hold 3 healthy teammates. The safe play is clicking your 100% accurate move to close the game, avoiding unnecessary risky reads.',
          },
        },
      ],
      summary: {
        es: 'El juego de alto nivel se define por la disciplina de minimizar los errores no forzados.',
        en: 'High-level mastery is defined by the discipline of minimizing unforced errors.',
      },
    },
    nextObjectiveId: 'combat-status-conditions',
  },

  {
    id: 'combat-status-conditions',
    sectionId: 'combat',
    title: {
      es: 'Estados alterados en combate',
      en: 'Status conditions in battle',
    },
    description: {
      es: 'Comprende cómo quemadura, parálisis, sueño y veneno transforman el ritmo del enfrentamiento y anulan estrategias enemigas.',
      en: 'Understand how burn, paralysis, sleep, and poison transform the battle tempo and shut down enemy strategies.',
    },
    lesson: {
      introduction: {
        es: 'Los estados alterados no son simples molestias numéricas: son herramientas tácticas capaces de inutilizar por completo a los atacantes o murallas más poderosos del rival.',
        en: 'Status conditions are not mere nuisances: they are tactical tools capable of completely dismantling the opponent’s deadliest attackers and walls.',
      },
      sections: [
        {
          title: {
            es: 'Quemadura (BRN) y Parálisis (PAR)',
            en: 'Burn and Paralysis Impact',
          },
          content: {
            es: 'Quemar a un atacante físico reduce su daño físico a la mitad (50%) de forma permanente, quitándole todo su peligro. Paralizar a un velocista divide su velocidad a la mitad y le da un 25% de probabilidad de perder el turno por completo.',
            en: 'Burning a physical attacker cuts its physical damage output in half (50%) permanently, stripping its threat level. Paralyzing a speedster cuts its speed in half with a 25% chance of being fully immobilized.',
          },
        },
        {
          title: {
            es: 'Sueño (SLP) y Veneno Grave (TOX)',
            en: 'Sleep and Toxic Poison',
          },
          content: {
            es: 'Dormir a un Pokémon le impide actuar durante 1 a 3 turnos, otorgándote turnos libres para atacar o potenciarte. El veneno grave desgasta porcentajes crecientes de PS (1/16, 2/16, 3/16...), siendo la pesadilla de las murallas que intentan curarse.',
            en: 'Inflicting sleep immobilizes the target for 1 to 3 turns, granting you free setup or attack turns. Badly poisoned (Toxic) deals escalating damage each turn, becoming the ultimate counter against bulky walls.',
          },
        },
      ],
      summary: {
        es: 'Un estado alterado bien aplicado puede neutralizar la mayor amenaza del rival sin necesidad de noquearla de inmediato.',
        en: 'A well-placed status condition can neutralize the rival’s greatest threat without needing an immediate knockout.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Inmunidades naturales a estados',
            en: 'Natural Status Immunities',
          },
          content: {
            es: 'Los tipos Fuego no pueden quemarse; los tipos Eléctrico no pueden paralizarse; los tipos Veneno y Acero no pueden envenenarse. Recordar estas reglas te evita desperdiciar turnos intentando aplicar estados inútiles.',
            en: 'Fire types cannot be burned; Electric types cannot be paralyzed; Poison and Steel types cannot be poisoned. Remembering these immunities prevents wasted turns trying to apply invalid conditions.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Neutralizar con Fuego Fatuo',
            en: 'Crippling with Will-O-Wisp',
          },
          description: {
            es: 'Ante un imponente atacante físico rival que amenaza con barrer a tu equipo, usas Fuego Fatuo en el primer turno. Al quedar quemado, sus ataques pasan a hacer la mitad de daño, permitiendo que tu equipo resista cómodamente.',
            en: 'Facing a menacing physical sweeper that threatens your team, you click Will-O-Wisp on turn one. Burned, its attacks deal half damage, allowing your squad to comfortably weather the storm.',
          },
        },
      ],
      summary: {
        es: 'Integrar estados alterados en tu forma de jugar te da respuestas eficaces contra Pokémon numéricamente superiores.',
        en: 'Weaving status conditions into your play provides reliable answers against statistically superior threats.',
      },
    },
    nextObjectiveId: 'combat-stat-changes',
  },

  {
    id: 'combat-stat-changes',
    sectionId: 'combat',
    title: {
      es: 'Cambios de estadísticas durante el combate',
      en: 'Stat stage changes in battle',
    },
    description: {
      es: 'Domina el sistema de niveles (-6 a +6), los movimientos de potenciación y cómo el cambio de Pokémon resetea los modificadores.',
      en: 'Master the stat stage system (-6 to +6), boosting moves, and how switching resets battle modifiers.',
    },
    lesson: {
      introduction: {
        es: 'Durante el combate, las estadísticas de un Pokémon no son inalterables: pueden aumentar (boosts) o reducirse (drops) en una escala de -6 a +6 niveles o "stages".',
        en: 'During battle, a Pokémon’s stats are not static: they can be boosted or dropped along a scale of -6 to +6 stages.',
      },
      sections: [
        {
          title: {
            es: 'El poder multiplicador de los niveles (+1 a +6)',
            en: 'The Multiplier Power of Stages (+1 to +6)',
          },
          content: {
            es: 'Un nivel (+1) en Ataque o Velocidad multiplica la estadística por 1.5 (+50%). Un +2 (como Danza Espada) la multiplica por 2.0 (+100%, ¡el doble!). Con un solo turno de preparación, un Pokémon puede pasar de hacer daño moderado a noquear de un solo impacto.',
            en: 'A +1 stage in Attack or Speed multiplies that stat by 1.5 (+50%). A +2 stage (like Swords Dance) multiplies it by 2.0 (+100%, double!). With one turn of setup, an attacker transforms from moderate into an unstoppable powerhouse.',
          },
        },
        {
          title: {
            es: 'Reducciones de estadísticas y el reseteo al cambiar',
            en: 'Stat Drops and Switch Resets',
          },
          content: {
            es: 'Reducir las estadísticas del rival (por ejemplo, con la habilidad Intimidación que baja el Ataque) frena su ofensiva. Regla fundamental de oro: al retirar a un Pokémon del campo, ¡todos sus aumentos y reducciones se resetean a cero!',
            en: 'Lowering rival stats (such as through Intimidate dropping Attack) halts enemy offense. Golden rule: when a Pokémon switches out, all its positive and negative stat stages immediately reset to zero!',
          },
        },
      ],
      summary: {
        es: 'Potenciarse en el turno oportuno crea condiciones para cerrar partidas, mientras que forzar al rival a cambiar borra todas sus mejoras.',
        en: 'Setting up on the right turn creates game-winning conditions, while forcing switches erases all accumulated boosts.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'El riesgo del turno de Setup',
            en: 'The Risk of the Setup Turn',
          },
          content: {
            es: 'Gastar un turno usando Danza Espada o Paz Mental te deja expuesto a recibir daño sin responder. Debes potenciarte únicamente cuando estás frente a un Pokémon que no puede amenazarte o que se verá forzado a cambiar.',
            en: 'Spending a turn casting Swords Dance or Calm Mind leaves you open to incoming damage without hitting back. You must only set up when facing a foe that cannot threaten you or is forced to switch.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Danza Dragón en el momento justo',
            en: 'Dragon Dance at the Right Moment',
          },
          description: {
            es: 'Tu Dragonite entra frente a un rival que no puede hacerle daño significativo. Aprovechas ese turno para usar Danza Dragón (+1 Ataque y +1 Velocidad). Ahora eres más rápido que todo el equipo rival y golpeas un 50% más fuerte.',
            en: 'Your Dragonite enters against a foe unable to deal meaningful damage. You capitalize on that turn with Dragon Dance (+1 Attack, +1 Speed). Now you outspeed their entire squad and hit 50% harder.',
          },
        },
      ],
      summary: {
        es: 'Los modificadores de estadísticas convierten buenas posiciones en victorias definitivas si sabes cuándo activarlos.',
        en: 'Stat stage modifications turn favorable board positions into decisive victories when timed properly.',
      },
    },
    nextObjectiveId: 'combat-status-moves',
  },

  {
    id: 'combat-status-moves',
    sectionId: 'combat',
    title: {
      es: 'Movimientos de estado: Más allá del daño',
      en: 'Status moves: Beyond direct damage',
    },
    description: {
      es: 'Aprende por qué los movimientos sin daño directo —curación, protección, control de campo e interrupción— ganan las partidas más difíciles.',
      en: 'Learn why non-damaging moves —recovery, protection, field control, and disruption— win the toughest matches.',
    },
    lesson: {
      introduction: {
        es: 'Muchos jugadores novatos llenan a sus Pokémon con 4 ataques de daño directo. Los jugadores experimentados saben que los movimientos de estado a menudo tienen un impacto mucho más profundo en el resultado final.',
        en: 'Many novices pack four direct damaging moves on their Pokémon. Veteran competitors know that status moves often carry a far deeper impact on the final outcome.',
      },
      sections: [
        {
          title: {
            es: 'Categorías esenciales de movimientos de estado',
            en: 'Essential Categories of Status Moves',
          },
          content: {
            es: '1) Protección (Protect, Detección) para frenar turnos rivales; 2) Curación (Recuperación, Respiro) para alargar la vida útil; 3) Control de ritmo (Viento Afín, Espacio Raro); 4) Interrupción (Mofa / Taunt, que impide al rival usar movimientos de estado).',
            en: '1) Protection (Protect, Detect) to block turns; 2) Recovery (Recover, Roost) to extend longevity; 3) Speed control (Tailwind, Trick Room); 4) Disruption (Taunt, preventing opponent status moves).',
          },
        },
        {
          title: {
            es: 'Mofa: El freno a las tácticas pasivas',
            en: 'Taunt: Shutting Down Passive Play',
          },
          content: {
            es: 'Mofa obliga al rival a usar únicamente movimientos de ataque directo durante 3 turnos. Si el oponente depende de curarse o colocar estados, Mofa desmantela su estrategia de raíz.',
            en: 'Taunt forces the target to use only direct attacking moves for 3 turns. If the rival relies on healing or spreading status, Taunt completely dismantles their game plan.',
          },
        },
      ],
      summary: {
        es: 'Un equipo equilibrado combina fuerza bruta con movimientos de estado que dictan cómo y cuándo se combate.',
        en: 'A balanced squad combines firepower with utility status moves that dictate the terms of engagement.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Sustituto: El señuelo multipropósito',
            en: 'Substitute: The Multi-Purpose Shield',
          },
          content: {
            es: 'Sacrificar un 25% de PS para crear un Sustituto bloquea estados alterados, absorbe ataques letales y te garantiza un turno de acción seguro si el rival cambia de Pokémon.',
            en: 'Sacrificing 25% HP to erect a Substitute shields you from status conditions, absorbs lethal blows, and guarantees a safe action turn if the opponent switches.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Protección para desgastar con veneno',
            en: 'Protect to Stall Poison Damage',
          },
          description: {
            es: 'El Pokémon rival sufre veneno grave (Tóxico). Alternar entre atacar y usar Protección permite que el veneno le reste grandes cantidades de PS en cada turno mientras tu Pokémon permanece ileso tras el escudo.',
            en: 'The rival suffers from Toxic. Alternating between attacking and clicking Protect allows poison to drain massive HP chunks each turn while your Pokémon stays completely safe behind its shield.',
          },
        },
      ],
      summary: {
        es: 'Dominar los movimientos de estado es el puente definitivo entre jugar casualmente y jugar con maestría competitiva.',
        en: 'Mastering status moves is the ultimate bridge between casual battling and true competitive mastery.',
      },
    },
    nextObjectiveId: 'combat-resource-management',
  },

  {
    id: 'combat-resource-management',
    sectionId: 'combat',
    title: {
      es: 'No todos los recursos son iguales',
      en: 'Not all resources are created equal',
    },
    description: {
      es: 'Aprende a gestionar la vida de tus Pokémon, entender el valor de una pieza a 1 PS y realizar sacrificios tácticos a favor de la posición.',
      en: 'Learn to manage HP, understand the value of a 1-HP piece, and execute tactical sacrifices for position.',
    },
    lesson: {
      introduction: {
        es: 'En competitivo, tus recursos son tus PS, tus Pokémon vivos, tus turnos y la información que vas revelando. No todos tienen el mismo valor en cada momento.',
        en: 'In competitive play, your resources are your HP, live Pokémon, turns, and revealed information. Not all carry the same value at every stage.',
      },
      sections: [
        {
          title: {
            es: 'El mito de los PS: 1 PS es suficiente',
            en: 'The HP Myth: 1 HP is Enough',
          },
          content: {
            es: 'Un Pokémon con 1 PS es tan rápido y golpea tan fuerte como si estuviera al 100%. Si supera en velocidad al rival o tiene un ataque de prioridad, puede conseguir un noqueo crucial antes de caer.',
            en: 'A Pokémon with 1 HP is just as fast and hits just as hard as one at 100%. If it outspeeds the rival or carries priority, it can deliver a decisive knockout before fainting.',
          },
        },
        {
          title: {
            es: 'El sacrificio táctico (Fodder Switch)',
            en: 'The Tactical Sacrifice',
          },
          content: {
            es: 'Permitir que un Pokémon secundario caiga debilitado voluntariamente tiene un beneficio enorme: te permite enviar a tu mejor atacante al campo limpio, al inicio del siguiente turno, ¡sin recibir daño en el cambio!',
            en: 'Allowing a spent teammate to faint voluntarily yields a massive advantage: it lets your primary sweeper enter the field completely clean next turn without taking switch-in damage!',
          },
        },
      ],
      summary: {
        es: 'La vida de tus Pokémon es una moneda de cambio: inviértela donde te otorgue la mayor ventaja posicional.',
        en: 'Your Pokémon’s HP is trade currency: invest it where it secures maximum positional advantage.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Preservar las piezas correctas',
            en: 'Preserving the Right Pieces',
          },
          content: {
            es: 'Pregúntate siempre: ¿cuál de mis Pokémon es indispensable para ganar contra los que le quedan al rival? Ese Pokémon debe preservarse a toda costa; los demás pueden usarse para desgastar y absorber golpes.',
            en: 'Always ask yourself: which of my Pokémon is irreplaceable to win against the rival’s remaining pieces? That piece must be preserved at all costs; others can absorb hits and chip away.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Sacrificio para traer al rematador',
            en: 'Sacrifice to Bring in the Cleaner',
          },
          description: {
            es: 'Tu Pokémon de soporte tiene 8% de vida y el rival prepara un ataque letal. Lo dejas caer en ese turno. Al quedar libre el campo, entra tu atacante más rápido y potente sin haber sufrido un rasguño, listo para barrer.',
            en: 'Your support teammate has 8% HP and the rival readies a lethal strike. You let it faint. With a clean field, your fastest powerhouse enters without a scratch, ready to sweep.',
          },
        },
      ],
      summary: {
        es: 'No temas perder Pokémon si ese sacrificio asegura la entrada limpia de tu herramienta de victoria.',
        en: 'Never fear losing a Pokémon if that sacrifice guarantees the clean entry of your win condition.',
      },
    },
    nextObjectiveId: 'combat-win-conditions',
  },

  {
    id: 'combat-win-conditions',
    sectionId: 'combat',
    title: {
      es: '¿Cómo se gana realmente un combate?: Condición de victoria',
      en: 'Identifying win conditions',
    },
    description: {
      es: 'Aprende a identificar tu plan maestro (Wincon), eliminar los obstáculos que la frenan y conducir la partida hacia el jaque mate.',
      en: 'Learn to identify your master plan (Wincon), eliminate its obstacles, and navigate the endgame towards checkmate.',
    },
    lesson: {
      introduction: {
        es: 'Ganar un combate no consiste en noquear Pokémon al azar: consiste en ejecutar una "Win Condition" (Wincon), es decir, un plan claro que garantiza que el rival se quede sin respuestas posibles.',
        en: 'Winning a battle is not about collecting random knockouts: it is about executing a Win Condition (Wincon), a definitive plan that leaves the opponent with zero viable answers.',
      },
      sections: [
        {
          title: {
            es: '¿Qué es una Wincon?',
            en: 'What is a Wincon?',
          },
          content: {
            es: 'Tu Wincon suele ser un Pokémon específico (un atacante veloz que puede barrer al equipo rival una vez que sus resistencias estén debilitadas) o una posición estratégica (como desgastar a todos con daño residual hasta que no puedan responder).',
            en: 'Your Wincon is typically a specific Pokémon (a swift sweeper that wipes the opposing team once counters are weakened) or a strategic state (like relentless residual chip damage).',
          },
        },
        {
          title: {
            es: 'Identificar los obstáculos del rival',
            en: 'Identifying Opposing Roadblocks',
          },
          content: {
            es: 'Durante la Selección de Equipo debes preguntarte: ¿qué Pokémon del rival impide que mi Wincon gane sola? Tu objetivo durante los primeros turnos debe ser eliminar o desgastar ese único obstáculo.',
            en: 'During Team Preview ask yourself: which opposing Pokémon prevents my wincon from sweeping? Your primary goal in the early turns must be eliminating or softening that sole obstacle.',
          },
        },
      ],
      summary: {
        es: 'Una vez que eliminas los Pokémon que amenazan a tu Wincon, la victoria se convierte en una simple cuestión de turnos.',
        en: 'Once you eliminate the pieces threatening your wincon, victory becomes an inevitable matter of turns.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Alinear tus turnos con el final de la partida',
            en: 'Aligning Turns with the Endgame',
          },
          content: {
            es: 'Si tu Wincon es un atacante de tipo Agua, todo movimiento previo de tu equipo debe orientarse a derribar al Pokémon de Planta o Dragón del oponente. Cada jugada debe servir a este objetivo supremo.',
            en: 'If your wincon is a Water sweeper, every prior move must focus on cracking the rival’s Grass or Dragon types. Every play must serve this overarching endgame.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Limpiar el camino para un Sweeper',
            en: 'Paving the Way for a Sweeper',
          },
          description: {
            es: 'Tienes un Scizor veloz que puede ganar con Puño Bala, pero el rival tiene un Heatran que resiste todo su repertorio. Todo tu equipo colabora para noquear a Heatran. Una vez eliminado Heatran, Scizor entra y remata al resto sin oposición.',
            en: 'You hold a Scizor that sweeps with Bullet Punch, but the rival has Heatran walling it. Your team focuses entirely on eliminating Heatran. Once Heatran faints, Scizor enters and finishes the game unopposed.',
          },
        },
      ],
      summary: {
        es: 'Jugar con una condición de victoria clara transforma una partida caótica en un plan estructurado hacia el triunfo.',
        en: 'Battling with a clear win condition transforms chaos into a structured roadmap toward victory.',
      },
    },
    nextObjectiveId: 'combat-common-mistakes',
  },

  {
    id: 'combat-common-mistakes',
    sectionId: 'combat',
    title: {
      es: 'Errores comunes durante un combate',
      en: 'Common combat mistakes',
    },
    description: {
      es: 'Reconoce los tropiezos habituales de los principiantes: jugar con el piloto automático, cambios impulsivos y descuidar el orden de turnos.',
      en: 'Recognize typical beginner pitfalls: autopilot play, panicky switches, and neglecting turn order.',
    },
    lesson: {
      introduction: {
        es: 'Mejorar en Pokémon competitivo requiere tanto aprender buenas prácticas como desaprender hábitos impulsivos que cuestan partidas ganadas.',
        en: 'Improving in competitive Pokémon requires both learning sound fundamentals and unlearning impulsive habits that forfeit won games.',
      },
      sections: [
        {
          title: {
            es: 'Jugar en "piloto automático"',
            en: 'Autopilot Play',
          },
          content: {
            es: 'Presionar siempre el ataque más potente sin mirar la vida del rival, sin pensar si cambiará y sin considerar qué pasará en el siguiente turno. Cada turno exige detenerse unos segundos a pensar.',
            en: 'Clicking your strongest move without checking rival HP, without anticipating switches, and without planning next turn. Every turn warrants pausing for a few seconds to evaluate.',
          },
        },
        {
          title: {
            es: 'Cambiar por pánico y sacrificar la pieza clave',
            en: 'Panic Switching and Sacrificing the Wincon',
          },
          content: {
            es: 'Cambiar de Pokémon cada vez que recibes un golpe neutro descoloca a tu equipo y regala turnos. Igualmente grave es dejar caer a tu mejor atacante solo por intentar salvar a un Pokémon de apoyo que ya no aporta nada.',
            en: 'Switching every time you take neutral damage fractures your momentum and gifts free turns. Equally fatal is letting your wincon faint just to preserve an exhausted utility piece.',
          },
        },
      ],
      summary: {
        es: 'Reconocer y corregir los errores no forzados es la forma más rápida de subir de nivel competitivo.',
        en: 'Recognizing and weeding out unforced errors is the fastest way to elevate your competitive rank.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Olvidar la velocidad y la prioridad',
            en: 'Neglecting Speed Brackets and Priority',
          },
          content: {
            es: 'Creer erróneamente que eres más rápido que el rival o ignorar que su Pokémon puede tener un ataque prioritario como Golpe Bajo o Onda Vacío es una de las causas más frecuentes de derrotas inesperadas.',
            en: 'Falsely assuming you outspeed the opponent or forgetting they carry priority strikes like Sucker Punch or Vacuum Wave is one of the most common causes of preventable losses.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'El ataque precipitado',
            en: 'The Hasty Attack',
          },
          description: {
            es: 'Un jugador ataca con toda su fuerza a un rival al que solo le queda 5% de vida, olvidando que el rival tenía prioridad +1 con Acua Jet. El rival ataca primero y noquea al jugador antes de que pueda tocarlo.',
            en: 'A player fires an all-out attack into a rival with 5% HP, forgetting the rival packs +1 Aqua Jet. The rival strikes first, taking the knockout before the player even connects.',
          },
        },
      ],
      summary: {
        es: 'Mantén la calma, revisa el tablero y no regales recursos por apresurarte.',
        en: 'Stay calm, survey the board, and never throw away resources by rushing decisions.',
      },
    },
    nextObjectiveId: 'combat-singles-vs-doubles',
  },

  {
    id: 'combat-singles-vs-doubles',
    sectionId: 'combat',
    title: {
      es: 'Diferencias entre Singles y Doubles',
      en: 'Singles vs. Doubles differences',
    },
    description: {
      es: 'Compara los dos grandes formatos competitivos: el ritmo metódico de Individuales frente a la explosiva interacción de Dobles (VGC).',
      en: 'Compare the two premier competitive formats: the deliberate pacing of Singles versus the explosive interaction of Doubles (VGC).',
    },
    lesson: {
      introduction: {
        es: 'Aunque ambos formatos comparten las mismas reglas mecánicas básicas, la forma de enfocar la toma de decisiones en Individuales (Singles) y Dobles (Doubles) es radicalmente distinta.',
        en: 'While both formats share identical core mechanics, the strategic approach to turn-by-turn decision making in Singles versus Doubles is fundamentally distinct.',
      },
      sections: [
        {
          title: {
            es: 'Combates Individuales (Singles): Desgaste y posicionamiento',
            en: 'Singles: Attrition and Positioning',
          },
          content: {
            es: 'En Singles hay 1 Pokémon activo por bando. Las partidas suelen durar más turnos, con mucho énfasis en los cambios, la colocación de trampas de entrada (como Trampa Rocas) y el desgaste gradual del rival.',
            en: 'Singles features 1 active Pokémon per side. Matches generally span more turns, placing heavy emphasis on switching, entry hazard deployment (Stealth Rock), and progressive attrition.',
          },
        },
        {
          title: {
            es: 'Combates Dobles (VGC): Dinamismo y sinergia inmediata',
            en: 'Doubles (VGC): Dynamism and Immediate Synergy',
          },
          content: {
            es: 'En Dobles combaten 2 Pokémon por lado simultáneamente (4 vs 4 elegidos de 6). El ritmo es vertiginoso: hay 4 acciones por turno, mayor peligro de K.O. inmediato y la coordinación entre compañeros es el núcleo de la estrategia.',
            en: 'Doubles features 2 active Pokémon per side (bring 6, pick 4). The pace is explosive: 4 actions resolve per turn, knockout danger is constant, and partner synergy is the core of play.',
          },
        },
      ],
      summary: {
        es: 'Singles premia la paciencia y el control a largo plazo; Dobles premia la coordinación inmediata y la selección quirúrgica de objetivos.',
        en: 'Singles rewards long-term patience and attrition; Doubles rewards immediate coordination and pinpoint target selection.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'El valor absoluto de Protección en Dobles',
            en: 'The Vital Role of Protect in Doubles',
          },
          content: {
            es: 'Mientras que en Singles Protección tiene un uso más situacional, en Dobles es el movimiento más importante del formato. Permite que un Pokémon se defienda mientras su compañero noquea a la mayor amenaza o cambia el ritmo del combate.',
            en: 'While Protect is situational in Singles, in Doubles it is arguably the premier move in the game. It shields one slot while the partner eliminates a key threat or resets field speed.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Doble ataque focalizado (Double Target)',
            en: 'Double Target Knockout',
          },
          description: {
            es: 'En Dobles, tus dos Pokémon activos pueden atacar al mismo Pokémon rival en el mismo turno, combinando su daño para derribar a una muralla que en Singles resistiría cualquier golpe individual.',
            en: 'In Doubles, both active teammates can focus attacks onto the same rival slot on the same turn, combining damage to take down a wall that would survive any single hit in Singles.',
          },
        },
      ],
      summary: {
        es: 'Entender el formato en el que juegas te permite adaptar tus decisiones al ritmo correcto de la batalla.',
        en: 'Grasping your active format allows you to calibrate decisions to the correct battle tempo.',
      },
    },
    nextObjectiveId: 'combat-thinking-in-doubles',
  },

  {
    id: 'combat-thinking-in-doubles',
    sectionId: 'combat',
    title: {
      es: 'Cómo pensar en Doubles',
      en: 'How to think in Doubles',
    },
    description: {
      es: 'Aprende los pilares del combate por parejas: coordinación entre compañeros, selección de objetivos, control de velocidad y redirección.',
      en: 'Learn the pillars of pair-based combat: partner coordination, target selection, speed control, and redirection.',
    },
    lesson: {
      introduction: {
        es: 'Jugar en Dobles no es jugar dos combates individuales a la vez: es liderar una unidad táctica donde cada acción de un Pokémon debe potenciar o proteger a la de su compañero.',
        en: 'Playing Doubles is not playing two Singles battles simultaneously: you lead a tactical unit where every action must empower or protect its partner.',
      },
      sections: [
        {
          title: {
            es: 'Coordinación y Cobertura Mutua',
            en: 'Coordination and Mutual Cover',
          },
          content: {
            es: 'Si tu atacante es vulnerable al tipo Fuego, su compañero ideal puede tener una habilidad que absorba ataques de fuego o conocer un movimiento que reduzca el daño elemental recibido por ambos.',
            en: 'If your sweeper is weak to Fire, an ideal partner carries an ability absorbing fire strikes or casts screens mitigating elemental damage across both slots.',
          },
        },
        {
          title: {
            es: 'Selección de objetivos: ¿A quién atacar?',
            en: 'Target Selection: Who to Attack?',
          },
          content: {
            es: 'En cada turno tienes 2 objetivos rivales posibles. Debes decidir: ¿atacas al más peligroso para intentar noquearlo, o neutralizas al compañero de apoyo que está alterando la velocidad del campo?',
            en: 'Every turn presents 2 opposing targets. You must weigh: do you strike the offensive threat to take a knockout, or disrupt the utility support modifying field speed?',
          },
        },
      ],
      summary: {
        es: 'En Dobles ninguna jugada se evalúa de forma aislada: siempre se piensa en términos de pareja coordinada.',
        en: 'In Doubles no move is judged in isolation: you always evaluate turns through the lens of a coordinated pair.',
      },
    },
    deepDive: {
      sections: [
        {
          title: {
            es: 'Herramientas icónicas: Sorpresa y Redirección',
            en: 'Iconic Tools: Fake Out and Redirection',
          },
          content: {
            es: 'Movimientos como Sorpresa (Fake Out, prioridad +3 que hace retroceder al rival en su primer turno) o Señuelo (Follow Me, que atrae todos los ataques hacia un Pokémon resistente) permiten que tu compañero actúe con total libertad.',
            en: 'Moves like Fake Out (+3 priority flinch on entry turn) or Follow Me (redirecting all attacks to a bulky tank) allow your sweeper partner to execute freely without harassment.',
          },
        },
      ],
      examples: [
        {
          title: {
            es: 'Pareja clásica: Viento Afín + Atacante',
            en: 'Classic Duo: Tailwind + Heavy Hitter',
          },
          description: {
            es: 'Whimsicott activa Viento Afín para duplicar la velocidad de ambos en ese turno, mientras su compañero Urshifu aprovecha la ventaja de velocidad para conectar un golpe fulminante antes de que los rivales puedan reaccionar.',
            en: 'Whimsicott casts Tailwind to double team Speed that turn, while partner Urshifu capitalizes on priority speed to deliver a crushing blow before rivals can respond.',
          },
        },
      ],
      summary: {
        es: 'Pensar en parejas coordinadas desbloquea la dimensión más emocionante y estratégica del combate Pokémon.',
        en: 'Thinking in coordinated duos unlocks the most thrilling and deeply strategic dimension of competitive Pokémon.',
      },
    },
    nextObjectiveId: null, // Final de la sección Combate -> lleva a la Evaluación Táctica
  },

  // =========================================================================
  // 3. 📊 Estadísticas
  // =========================================================================
  {
    id: 'stats-base-stats',
    sectionId: 'stats',
    title: {
      es: 'Estadísticas base',
      en: 'Base stats',
    },
    description: {
      es: 'Conoce los valores numéricos intrínsecos de cada especie que definen su potencial en cada atributo.',
      en: 'Understand the species-intrinsic numeric baselines that define a Pokémon’s natural strengths.',
    },
    lesson: {
      introduction: {
        es: 'Las estadísticas base son valores fijos e inalterables asignados a cada especie Pokémon que determinan su vocación natural (atacante, tanque, velocista).',
        en: 'Base stats are permanent species-specific numbers that determine a Pokémon’s natural disposition (sweeper, wall, speedster).',
      },
      sections: [],
      summary: {
        es: 'Un Pokémon con 130 de Ataque base siempre golpeará físicamente más fuerte que uno con 60.',
        en: 'A Pokémon with 130 base Attack will naturally hit harder physically than one with 60.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Las estadísticas base dictan qué rol competitivo puede cumplir cada criatura de forma viable.',
        en: 'Base stats dictate which competitive role a creature can realistically perform.',
      },
    },
    nextObjectiveId: 'stats-ivs',
  },
  {
    id: 'stats-ivs',
    sectionId: 'stats',
    title: {
      es: 'Valores individuales (IVs)',
      en: 'Individual Values (IVs)',
    },
    description: {
      es: 'Entiende la genética oculta (de 0 a 31 puntos en cada estadística) y cuándo buscar 0 IVs en Velocidad o Ataque.',
      en: 'Understand hidden genetics (0 to 31 in each stat) and strategic cases for 0 IVs in Speed or Attack.',
    },
    lesson: {
      introduction: {
        es: 'Los IVs son los genes individuales de cada ejemplar, que van de 0 a 31 en cada una de las 6 estadísticas. En competitivo casi siempre se busca 31 en todo, salvo excepciones estratégicas como 0 IVs en Velocidad para Espacio Raro.',
        en: 'IVs are individual genetic values ranging from 0 to 31 across all six stats. Competitive standard is 31 in all relevant stats, with niche cases like 0 Speed IVs for Trick Room.',
      },
      sections: [],
      summary: {
        es: 'Un atacante especial prefiere 0 IVs en Ataque para sufrir el mínimo daño posible al estar confundido o recibir Juego Sucio.',
        en: 'Special sweepers prefer 0 Attack IVs to minimize self-inflicted confusion damage and Foul Play strikes.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'La crianza o el entrenamiento extremo permiten garantizar 31 IVs fácilmente en los juegos modernos.',
        en: 'Breeding or Hyper Training guarantees 31 IVs straightforwardly in modern titles.',
      },
    },
    nextObjectiveId: 'stats-evs',
  },
  {
    id: 'stats-evs',
    sectionId: 'stats',
    title: {
      es: 'Puntos de esfuerzo (EVs)',
      en: 'Effort Values (EVs)',
    },
    description: {
      es: 'Aprende a distribuir los 508 puntos de esfuerzo para maximizar las estadísticas clave de tu Pokémon.',
      en: 'Learn how to invest 508 effort values to optimize your Pokémon’s most critical stats.',
    },
    lesson: {
      introduction: {
        es: 'Los EVs (Puntos de Esfuerzo) son puntos personalizables que puedes entrenar para moldear las características de tu Pokémon. Cuentas con un máximo de 508 EVs en total, con un tope de 252 en una sola estadística.',
        en: 'EVs (Effort Values) are customizable training points that sculpt your Pokémon’s final stats. You have 508 total EVs to allocate, with a maximum cap of 252 in any single attribute.',
      },
      sections: [],
      summary: {
        es: 'A nivel 50, 4 EVs en una estadística otorgan 1 punto real adicional, y cada 8 EVs posteriores otorgan otro punto más.',
        en: 'At level 50, the first 4 EVs provide 1 actual stat point, with every subsequent 8 EVs providing an additional point.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Distribuir EVs es la forma principal de personalizar tus Pokémon para sobrevivir a golpes específicos.',
        en: 'EV spreads are the core method for tuning Pokémon to survive designated benchmarks.',
      },
    },
    nextObjectiveId: 'stats-natures',
  },
  {
    id: 'stats-natures',
    sectionId: 'stats',
    title: {
      es: 'Naturalezas',
      en: 'Natures',
    },
    description: {
      es: 'Domina el incremento del +10% y reducción del -10% en estadísticas que otorgan las naturalezas.',
      en: 'Master the +10% boost and -10% reduction to stats provided by each nature.',
    },
    lesson: {
      introduction: {
        es: 'La naturaleza de un Pokémon potencia una de sus estadísticas en un +10% y reduce otra en un -10% (PS nunca se ve afectado). Elegir la naturaleza correcta optimiza la estadística determinante.',
        en: 'A Pokémon’s Nature enhances one stat by +10% while reducing another by -10% (HP is never modified). Choosing the correct Nature maximizes your primary attribute.',
      },
      sections: [],
      summary: {
        es: 'Un atacante físico elegirá Firme (+Atq, -Atq.Esp) o Alegre (+Vel, -Atq.Esp). Un atacante especial elegirá Modesta (+Atq.Esp, -Atq) o Miedosa (+Vel, -Atq).',
        en: 'Physical attackers opt for Adamant (+Atk, -SpAtk) or Jolly (+Spe, -SpAtk). Special attackers prefer Modest (+SpAtk, -Atk) or Timid (+Spe, -Atk).',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Las mentas de naturaleza permiten cambiar el efecto de la naturaleza en los juegos actuales sin alterar la personalidad del Pokémon.',
        en: 'Nature Mints allow modifying stat multipliers on demand without altering base flavor text.',
      },
    },
    nextObjectiveId: 'stats-ev-spreads',
  },
  {
    id: 'stats-ev-spreads',
    sectionId: 'stats',
    title: {
      es: 'Repartos de EVs eficientes (EV Spreads)',
      en: 'Efficient EV spreads',
    },
    description: {
      es: 'Diseña repartos calculados para aguantar golpes de amenazas específicas o superar a rivales clave en velocidad.',
      en: 'Design tailored spreads to survive benchmark attacks or outspeed designated threats.',
    },
    lesson: {
      introduction: {
        es: 'Mientras que los novatos usan siempre 252/252/4, los jugadores avanzados diseñan repartos milimétricos (EV Spreads) para resistir ataques calculados de los Pokémon más populares del metajuego.',
        en: 'While beginners invest 252/252/4, advanced competitors craft tailored EV spreads calculated to survive benchmark hits from dominant meta threats.',
      },
      sections: [],
      summary: {
        es: 'Invertir justo los EVs necesarios en velocidad para superar por 1 punto a una amenaza te deja el resto de puntos para mejorar tu durabilidad.',
        en: 'Investing just enough Speed EVs to outspeed a benchmark by 1 point leaves valuable points to boost survivability.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Las calculadoras de daño son la herramienta estándar para diseñar repartos competitivos eficientes.',
        en: 'Damage calculators are the standard tool for crafting benchmark EV spreads.',
      },
    },
    nextObjectiveId: null,
  },

  // =========================================================================
  // 4. 🧩 Construcción de equipos
  // =========================================================================
  {
    id: 'teambuilding-type-synergy',
    sectionId: 'teambuilding',
    title: {
      es: 'Sinergia de tipos',
      en: 'Type synergy',
    },
    description: {
      es: 'Construye coberturas defensivas donde las debilidades de un integrante sean absorbidas por sus compañeros.',
      en: 'Build defensive backbones where team members resist or absorb each other’s vulnerabilities.',
    },
    lesson: {
      introduction: {
        es: 'Un buen equipo no es un rejunte de Pokémon poderosos individuales, sino una red de compañeros donde cada miembro cubre las vulnerabilidades de los demás.',
        en: 'A strong team is not a collection of individual powerhouses, but a cohesive network where teammates cover each other’s vulnerabilities.',
      },
      sections: [],
      summary: {
        es: 'Si 3 de tus Pokémon son débiles a Tierra, es obligatorio incluir inmunidades de tipo Volador o la habilidad Levitación.',
        en: 'If 3 teammates are weak to Ground, bringing Flying types or Levitate users is mandatory.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'La sinergia de tipos permite realizar cambios seguros durante todo el combate.',
        en: 'Type synergy enables safe defensive rotations throughout the entire match.',
      },
    },
    nextObjectiveId: 'teambuilding-cores',
  },
  {
    id: 'teambuilding-cores',
    sectionId: 'teambuilding',
    title: {
      es: 'Núcleos tácticos (Cores)',
      en: 'Tactical cores',
    },
    description: {
      es: 'Aprende combinaciones elementales clásicas como Fuego-Agua-Planta o Hada-Acero-Dragón.',
      en: 'Learn staple elemental combinations such as Fire-Water-Grass or Fairy-Steel-Dragon.',
    },
    lesson: {
      introduction: {
        es: 'Un "Core" o núcleo es un grupo de 2 o 3 Pokémon que se complementan a la perfección tanto ofensiva como defensivamente.',
        en: 'A core is a duo or trio of Pokémon that synergize seamlessly on both offense and defense.',
      },
      sections: [],
      summary: {
        es: 'El trío Hada-Acero-Dragón cubre casi todas las debilidades elementales existentes en el juego.',
        en: 'The Fairy-Steel-Dragon triad covers virtually every major elemental weakness in the game.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Construir tu equipo alrededor de un Core sólido simplifica la toma de decisiones.',
        en: 'Building around a resilient core simplifies battle decision trees.',
      },
    },
    nextObjectiveId: 'teambuilding-hazard-control',
  },
  {
    id: 'teambuilding-hazard-control',
    sectionId: 'teambuilding',
    title: {
      es: 'Control de trampas (Hazards)',
      en: 'Hazard control',
    },
    description: {
      es: 'Integra colocadores de Trampa Rocas o Púas y métodos para retirarlas (Giro Rápido, Despejar).',
      en: 'Incorporate entry hazard setters and removal options like Rapid Spin or Defog.',
    },
    lesson: {
      introduction: {
        es: 'Las trampas de entrada desgastan al rival cada vez que cambia de Pokémon y rompen la Banda Focus o la habilidad Compensación (Multiscale).',
        en: 'Entry hazards chip foes on every switch-in and break Focus Sashes or Multiscale abilities.',
      },
      sections: [],
      summary: {
        es: 'Tener una forma de poner Trampa Rocas y una forma de quitarlas es mandatorio en individuales (6v6).',
        en: 'Having a Stealth Rock setter and a removal method is mandatory in standard 6v6 singles.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Las Botas Gruesas (Heavy-Duty Boots) otorgan inmunidad completa al daño de trampas al entrar.',
        en: 'Heavy-Duty Boots grant complete immunity to entry hazards upon switching in.',
      },
    },
    nextObjectiveId: 'teambuilding-speed-control',
  },
  {
    id: 'teambuilding-speed-control',
    sectionId: 'teambuilding',
    title: {
      es: 'Control de velocidad de campo',
      en: 'Field speed control',
    },
    description: {
      es: 'Asegura formas de manipular la velocidad colectiva mediante Viento Afín, Espacio Raro o Red Viscosa.',
      en: 'Secure mechanisms to alter collective field speed through Tailwind, Trick Room, or Sticky Web.',
    },
    lesson: {
      introduction: {
        es: 'Quien ataca primero suele tener una ventaja abrumadora. Las herramientas de control de velocidad alteran este balance a tu favor.',
        en: 'Whoever moves first often holds overwhelming leverage. Speed control tools tilt this equation in your favor.',
      },
      sections: [],
      summary: {
        es: 'Viento Afín duplica la velocidad de tu equipo por 4 turnos. Espacio Raro invierte el orden durante 5 turnos.',
        en: 'Tailwind doubles team speed for 4 turns. Trick Room inverts speed brackets for 5 turns.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'En VGC, casi todas las partidas se definen por el timing del control de velocidad.',
        en: 'In VGC doubles, matches are routinely won or lost on speed control timing.',
      },
    },
    nextObjectiveId: 'teambuilding-meta-checks',
  },
  {
    id: 'teambuilding-meta-checks',
    sectionId: 'teambuilding',
    title: {
      es: 'Respuestas al metajuego (Checks y Counters)',
      en: 'Metagame answers (Checks and Counters)',
    },
    description: {
      es: 'Asegúrate de que tu equipo no sea barrido por las amenazas más populares y dominantes del formato.',
      en: 'Ensure your squad has answers against dominant offensive and defensive staples in the tier.',
    },
    lesson: {
      introduction: {
        es: 'Un Counter puede entrar al campo ante cualquier ataque del rival y ganar el 1v1. Un Check solo puede ganar si ya está dentro del campo.',
        en: 'A Counter can switch into any attack from the opponent and win the 1v1. A Check can only win if already safely on the field.',
      },
      sections: [],
      summary: {
        es: 'Revisar las estadísticas de uso de tu formato te ayuda a no dejar flancos abiertos ante las amenazas dominantes.',
        en: 'Studying usage tier stats ensures your team has answers for top tier staples.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Todo equipo competitivo de élite cuenta con respuestas directas para las 5 mayores amenazas del meta.',
        en: 'Every elite competitive squad carries dedicated answers for the top 5 threats in the tier.',
      },
    },
    nextObjectiveId: null,
  },

  // =========================================================================
  // 5. 🎯 Roles competitivos
  // =========================================================================
  {
    id: 'roles-sweeper',
    sectionId: 'roles',
    title: {
      es: 'Sweepers ofensivos',
      en: 'Offensive sweepers',
    },
    description: {
      es: 'Pokémon de alta velocidad o potencia destructiva diseñados para rematar al rival una vez debilitado.',
      en: 'Fast, hard-hitting attackers designed to clean up weakened opposing teams.',
    },
    lesson: {
      introduction: {
        es: 'Un Sweeper es el encargado de barrer con los miembros restantes del rival tras potenciarse o aprovechar su velocidad y daño.',
        en: 'A sweeper cleans up opposing teams after setting up stat boosts or leveraging overwhelming speed.',
      },
      sections: [],
      summary: {
        es: 'Preserva a tu Sweeper hasta que las murallas del oponente hayan sido desgastadas.',
        en: 'Preserve your sweeper until the opposing walls have been softened.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Danza Dragón o Danza Espada convierten a atacantes rápidos en máquinas de victoria instantánea.',
        en: 'Dragon Dance or Swords Dance turn fast attackers into immediate game-enders.',
      },
    },
    nextObjectiveId: 'roles-wall-tank',
  },
  {
    id: 'roles-wall-tank',
    sectionId: 'roles',
    title: {
      es: 'Murallas (Walls) y tanques',
      en: 'Walls and tanks',
    },
    description: {
      es: 'Especialistas con alta durabilidad y recuperación capaces de absorber castigo continuo sin ceder.',
      en: 'Resilient bulwarks boasting high defensive stats and recovery to absorb prolonged punishment.',
    },
    lesson: {
      introduction: {
        es: 'Las murallas absorben castigo con altos PS y defensas, apoyándose en movimientos curativos como Recuperación, Respiro o Deseo.',
        en: 'Walls sponge punishment with high HP and defenses, relying on recovery moves like Recover, Roost, or Wish.',
      },
      sections: [],
      summary: {
        es: 'Una muralla frena a los atacantes del rival y los desgasta pasivamente con problemas de estado.',
        en: 'Walls stall opposing sweepers and chip them down with passive status ailments.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Dondozo, Ting-Lu, Toxapex y Blissey son ejemplos emblemáticos de solidez defensiva.',
        en: 'Dondozo, Ting-Lu, Toxapex, and Blissey are quintessential defensive bastions.',
      },
    },
    nextObjectiveId: 'roles-pivot',
  },
  {
    id: 'roles-pivot',
    sectionId: 'roles',
    title: {
      es: 'Pivotes',
      en: 'Pivots',
    },
    description: {
      es: 'Pokémon que entran con facilidad gracias a sus resistencias y facilitan el cambio seguro a un compañero.',
      en: 'Sturdy switch-ins that absorb hits and generate safe entry opportunities for teammates.',
    },
    lesson: {
      introduction: {
        es: 'Los pivotes absorben un golpe rival y usan Ida y Vuelta, Voltiocambio o Teletransporte para sacar al atacante ideal sin peligro.',
        en: 'Pivots absorb an enemy hit and execute U-turn, Volt Switch, or Teleport to bring in your attacker safely.',
      },
      sections: [],
      summary: {
        es: 'Los pivotes lentos son oro porque reciben el golpe ellos mismos antes de que su compañero entre al campo.',
        en: 'Slow pivots are invaluable because they absorb the hit before the fragile teammate enters.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Rotom-Wash y Corviknight son de los pivotes más consistentes de todas las generaciones.',
        en: 'Rotom-Wash and Corviknight remain timeless staple pivots across competitive generations.',
      },
    },
    nextObjectiveId: 'roles-wallbreaker',
  },
  {
    id: 'roles-wallbreaker',
    sectionId: 'roles',
    title: {
      es: 'Rompedores de murallas (Wallbreakers)',
      en: 'Wallbreakers',
    },
    description: {
      es: 'Atacantes con fuerza bruta inmediata capaces de demoler las defensas de tanques y murallas rivales.',
      en: 'Brute-force powerhouses capable of shattering opposing defensive cores and walls.',
    },
    lesson: {
      introduction: {
        es: 'A diferencia de los sweepers veloces, el Wallbreaker tiene potencia inmediata masiva para abrir brechas en la defensa enemiga.',
        en: 'Unlike agile sweepers, wallbreakers prioritize immediate raw firepower to punch holes through enemy bulwarks.',
      },
      sections: [],
      summary: {
        es: 'Su misión es debilitar las murallas para que tu sweeper pueda terminar la partida.',
        en: 'Their goal is breaking opposing walls so your cleaner can close out the match.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Ursaluna, Iron Valiant y Hoopa-Unbound personifican el poder de los Wallbreakers.',
        en: 'Ursaluna, Iron Valiant, and Hoopa-Unbound embody wallbreaking destruction.',
      },
    },
    nextObjectiveId: 'roles-support-utility',
  },
  {
    id: 'roles-support-utility',
    sectionId: 'roles',
    title: {
      es: 'Soporte y utilidad',
      en: 'Support and utility',
    },
    description: {
      es: 'Pokémon centrados en pantallas, curar problemas de estado, colocar trampas o mermar al rival con mofa y fuego fatuo.',
      en: 'Pokémon dedicated to screens, status clearing, setting hazards, or shutting down foes with Taunt.',
    },
    lesson: {
      introduction: {
        es: 'Los apoyos usan Reflejo, Pantalla Luz, Pantalla Aurora, Refuerzo o Mofa para inclinar la balanza sin necesidad de golpear directamente.',
        en: 'Support units deploy Reflect, Light Screen, Aurora Veil, Helping Hand, or Taunt to control the field.',
      },
      sections: [],
      summary: {
        es: 'Grimmsnarl con Bromista (Prankster) es el ejemplo moderno supremo de soporte con pantallas prioritarias.',
        en: 'Prankster Grimmsnarl is the gold standard for priority dual-screen utility.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Un buen soporte duplica la longevidad de todos los demás integrantes del equipo.',
        en: 'A premier support doubles the effective lifespan of the entire squad.',
      },
    },
    nextObjectiveId: null,
  },

  // =========================================================================
  // 6. 🌪️ Estrategias
  // =========================================================================
  {
    id: 'strategies-weather',
    sectionId: 'strategies',
    title: {
      es: 'Equipos de clima',
      en: 'Weather teams',
    },
    description: {
      es: 'Estrategias basadas en potenciar habilidades y ataques bajo Lluvia, Sol, Arena o Nieve.',
      en: 'Archetypes built around maximizing abilities and damage output under Rain, Sun, Sand, or Snow.',
    },
    lesson: {
      introduction: {
        es: 'Lluvia, Sol, Tormenta de Arena y Nieve potencian ciertos tipos y activan habilidades devastadoras como Nado Rápido o Clorofila.',
        en: 'Rain, Sun, Sandstorm, and Snow amplify specific typings and trigger terrifying abilities like Swift Swim or Chlorophyll.',
      },
      sections: [],
      summary: {
        es: 'Bajo lluvia, los ataques de Agua hacen 50% más de daño y Trueno nunca falla.',
        en: 'Under rain, Water attacks gain a 50% power boost and Thunder never misses.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Pelipper con Llovizna y Barraskewda forman el dúo de lluvia arquetípico.',
        en: 'Drizzle Pelipper paired with Barraskewda is the quintessential rain duo.',
      },
    },
    nextObjectiveId: 'strategies-hyper-offense',
  },
  {
    id: 'strategies-hyper-offense',
    sectionId: 'strategies',
    title: {
      es: 'Hyper Offense (HO)',
      en: 'Hyper Offense (HO)',
    },
    description: {
      es: 'Presión ofensiva ininterrumpida que busca abrumar al rival sin depender de opciones defensivas.',
      en: 'Relentless offensive pressure designed to overwhelm opponents without relying on defensive pivots.',
    },
    lesson: {
      introduction: {
        es: 'Hyper Offense busca colocar trampas y encadenar atacantes feroces para no darle al rival un solo turno de respiro.',
        en: 'Hyper Offense deploys entry hazards and unleashes relentless offensive threats, denying the rival any breathing room.',
      },
      sections: [],
      summary: {
        es: 'Cada baja que sufres es una oportunidad para sacar a tu siguiente atacante sin recibir daño.',
        en: 'Every faint is simply a free opportunity to bring in your next devastating attacker.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Glimmora es uno de los líderes más populares para iniciar arquetipos de Hyper Offense.',
        en: 'Glimmora is among the most dominant suicide leads for setting up Hyper Offense squads.',
      },
    },
    nextObjectiveId: 'strategies-balance-bulky',
  },
  {
    id: 'strategies-balance-bulky',
    sectionId: 'strategies',
    title: {
      es: 'Balance y Bulky Offense',
      en: 'Balance and Bulky Offense',
    },
    description: {
      es: 'El equilibrio clásico entre solidez defensiva y capacidad ofensiva para adaptarse a cualquier situación.',
      en: 'The classic blend of defensive resilience and offensive firepower adaptable to diverse matchups.',
    },
    lesson: {
      introduction: {
        es: 'El arquetipo Balance combina Pokémon duraderos que pueden pegar fuerte y absorber golpes, ofreciendo el estilo de juego más flexible.',
        en: 'Balance combines tanky attackers with dedicated defensive anchors for maximum flexibility across matchups.',
      },
      sections: [],
      summary: {
        es: 'Permite pivotar con seguridad sin sacrificar poder ofensivo en ningún momento.',
        en: 'Enables safe pivoting rotations without ever conceding offensive pressure.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Es el arquetipo más premiado a largo plazo en torneos por su consistencia.',
        en: 'Historically the most consistent and rewarded archetype in tournament play.',
      },
    },
    nextObjectiveId: 'strategies-stall',
  },
  {
    id: 'strategies-stall',
    sectionId: 'strategies',
    title: {
      es: 'Stall y desgaste defensivo',
      en: 'Stall and defensive attrition',
    },
    description: {
      es: 'Estrategia basada en agotar los recursos del rival mediante daño residual, trampas y curación infinita.',
      en: 'A grind strategy aiming to deplete opponent resources via passive residual damage and endless recovery.',
    },
    lesson: {
      introduction: {
        es: 'Stall busca neutralizar todos los ataques del oponente y ganar por agotamiento de turnos, veneno, quemadura y daño de trampas.',
        en: 'Stall aims to systematically neutralize enemy attacks, winning through attrition, hazards, toxic chip, and endless recovery.',
      },
      sections: [],
      summary: {
        es: 'Exige un conocimiento perfecto del metajuego para no dejar entrar a ningún atacante sin respuesta.',
        en: 'Demands flawless meta mastery so no opposing threat ever enters without a complete counter.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Dondozo, Clodsire, Blissey y Corviknight son los pilares tradicionales del Stall en 9ª Gen.',
        en: 'Dondozo, Clodsire, Blissey, and Corviknight form the defensive backbone of Gen 9 Stall.',
      },
    },
    nextObjectiveId: 'strategies-trick-room',
  },
  {
    id: 'strategies-trick-room',
    sectionId: 'strategies',
    title: {
      es: 'Espacio Raro (Trick Room)',
      en: 'Trick Room',
    },
    description: {
      es: 'Invierte la jerarquía de velocidad para permitir que especies lentas pero devastadoras ataquen primero.',
      en: 'Inverts the Speed hierarchy, granting monstrous but traditionally slow Pokémon immediate turn priority.',
    },
    lesson: {
      introduction: {
        es: 'Espacio Raro convierte la lentitud en la mayor ventaja: durante 5 turnos, los Pokémon más lentos atacan primero dentro de su prioridad.',
        en: 'Trick Room converts sluggishness into speed dominance: for 5 turns, slower Pokémon move first within their priority bracket.',
      },
      sections: [],
      summary: {
        es: 'Permite que Pokémon con estadísticas descomunales pero baja velocidad como Ursaluna o Torkoal ataquen antes que nadie.',
        en: 'Unleashes devastating low-speed powerhouses like Ursaluna or Torkoal to strike before anyone else.',
      },
    },
    deepDive: {
      sections: [],
      examples: [],
      summary: {
        es: 'Torkoal y Hatterene son dos de las piezas centrales más temibles bajo Espacio Raro.',
        en: 'Torkoal and Hatterene are two of the most terrifying anchors under Trick Room.',
      },
    },
    nextObjectiveId: null,
  },

  // =========================================================================
  // 7. 📚 Diccionario competitivo (Términos de consulta rápida)
  // =========================================================================
  {
    id: 'glossary-entry-hazards',
    sectionId: 'glossary',
    title: {
      es: 'Entry Hazards',
      en: 'Entry Hazards',
    },
    description: {
      es: 'Trampas de campo que dañan o penalizan a los Pokémon rivales al entrar (Trampa Rocas, Púas, Red Viscosa).',
      en: 'Field obstacles that damage or hinder opposing Pokémon upon entering the battle.',
    },
    lesson: {
      introduction: {
        es: 'Trampas colocadas en el campo rival que castigan cada cambio que realice.',
        en: 'Field hazards placed on the opposing side that punish every single switch.',
      },
      sections: [],
      summary: {
        es: 'En pocas palabras: trampas que dañan al rival cuando cambia de Pokémon.',
        en: 'In short: field traps that damage incoming Pokémon as they switch in.',
      },
    },
    deepDive: { sections: [], examples: [], summary: { es: '', en: '' } },
    nextObjectiveId: 'glossary-setup-boost',
  },
  {
    id: 'glossary-setup-boost',
    sectionId: 'glossary',
    title: {
      es: 'Setup y Boosters',
      en: 'Setup and Boosters',
    },
    description: {
      es: 'Movimientos que aumentan estadísticas (Danza Espada, Danza Dragón, Paz Mental, Maquinación).',
      en: 'Moves that raise stat stages (Swords Dance, Dragon Dance, Calm Mind, Nasty Plot).',
    },
    lesson: {
      introduction: {
        es: 'Usar un turno para aumentar tus estadísticas antes de atacar.',
        en: 'Spending a turn to increase your stats before launching an offensive barrage.',
      },
      sections: [],
      summary: {
        es: 'En pocas palabras: doparse las estadísticas para golpear mucho más fuerte.',
        en: 'In short: buffing your stats to hit dramatically harder.',
      },
    },
    deepDive: { sections: [], examples: [], summary: { es: '', en: '' } },
    nextObjectiveId: 'glossary-speed-tiers',
  },
  {
    id: 'glossary-speed-tiers',
    sectionId: 'glossary',
    title: {
      es: 'Speed Tiers',
      en: 'Speed Tiers',
    },
    description: {
      es: 'Escalas de velocidad de referencia para saber exactamente qué supera a qué dentro del metajuego.',
      en: 'Speed benchmark tiers used to calculate exactly who outspeeds whom in competitive matchups.',
    },
    lesson: {
      introduction: {
        es: 'Tablas comparativas de velocidad para planificar tus puntos de esfuerzo.',
        en: 'Speed benchmark scales used to fine-tune your EV spreads.',
      },
      sections: [],
      summary: {
        es: 'En pocas palabras: la lista de quién es más rápido que quién.',
        en: 'In short: the benchmark ranking of who outspeeds whom.',
      },
    },
    deepDive: { sections: [], examples: [], summary: { es: '', en: '' } },
    nextObjectiveId: 'glossary-wincon-endgame',
  },
  {
    id: 'glossary-wincon-endgame',
    sectionId: 'glossary',
    title: {
      es: 'Win Condition y Endgame',
      en: 'Win Condition and Endgame',
    },
    description: {
      es: 'El plan decisivo para ganar la partida y la fase final en la que se ejecutan los turnos determinantes.',
      en: 'The definitive roadmap to victory and the critical closing phase where the match is decided.',
    },
    lesson: {
      introduction: {
        es: 'La estrategia exacta con la que vas a dar el golpe de gracia y cerrar el juego.',
        en: 'The specific tactical pathway that secures final victory.',
      },
      sections: [],
      summary: {
        es: 'En pocas palabras: tu plan para rematar y ganar la partida.',
        en: 'In short: your clear blueprint to finish the battle and win.',
      },
    },
    deepDive: { sections: [], examples: [], summary: { es: '', en: '' } },
    nextObjectiveId: 'glossary-cleric-hazard-remover',
  },
  {
    id: 'glossary-cleric-hazard-remover',
    sectionId: 'glossary',
    title: {
      es: 'Cleric y Spinner',
      en: 'Cleric and Spinner',
    },
    description: {
      es: 'Términos para curadores de estado del equipo (Aromaterapia/Campana Cura) y limpiadores de hazards (Giro Rápido).',
      en: 'Slang for team status curers (Aromatherapy/Heal Bell) and hazard cleaners (Rapid Spin/Defog).',
    },
    lesson: {
      introduction: {
        es: 'Roles de soporte dedicados a limpiar el campo o sanar a todo el equipo.',
        en: 'Dedicated support roles that purge hazards or cleanse team status conditions.',
      },
      sections: [],
      summary: {
        es: 'En pocas palabras: el médico del equipo y el barrendero de trampas.',
        en: 'In short: the team doctor and the field sweeper.',
      },
    },
    deepDive: { sections: [], examples: [], summary: { es: '', en: '' } },
    nextObjectiveId: null,
  },
]

// =========================================================================
// EXÁMENES TÁCTICOS POR SECCIÓN
// =========================================================================

export const GUIDE_EXAMS = {
  fundamentals: {
    sectionId: 'fundamentals',
    title: {
      es: 'Evaluación Táctica: Fundamentos',
      en: 'Tactical Evaluation: Fundamentals',
    },
    description: {
      es: 'Demuestra tu comprensión de los conceptos elementales de combate. Necesitas un 80% para aprobar y desbloquear la Insignia de Fundamentos.',
      en: 'Prove your grasp of foundational battle mechanics. You need 80% or higher to pass and unlock the Fundamentals Badge.',
    },
    passingScore: 80,
    questions: [
      {
        id: 'fund-q1',
        prompt: {
          es: 'Un Garchomp (tipo Dragón/Tierra) usa el movimiento Terremoto (tipo Tierra, 100 de potencia base). ¿Cuál es la potencia real del ataque gracias al STAB?',
          en: 'A Garchomp (Dragon/Ground) executes Earthquake (Ground type, 100 base power). What is the effective attack power due to STAB?',
        },
        options: [
          { id: 'a', text: { es: '100 (sin bonificación adicional)', en: '100 (no additional bonus)' } },
          { id: 'b', text: { es: '150 (multiplicador del +50% por coincidir con su tipo)', en: '150 (50% bonus for matching elemental typing)' } },
          { id: 'c', text: { es: '200 (daño duplicado)', en: '200 (damage doubled)' } },
          { id: 'd', text: { es: '120 (bono plano de +20)', en: '120 (flat +20 bonus)' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'El STAB (Same-Type Attack Bonus) incrementa la potencia de los movimientos del mismo tipo del Pokémon en un 50% (x1.5). 100 x 1.5 = 150.',
          en: 'STAB (Same-Type Attack Bonus) increases moves matching the Pokémon’s typing by 50% (x1.5). 100 x 1.5 = 150.',
        },
      },
      {
        id: 'fund-q2',
        prompt: {
          es: 'Tienes en combate un Greninja (Agua/Siniestro) y el rival prepara un ataque de tipo Eléctrico. ¿Qué tipo elemental de tu equipo puede entrar al campo sin recibir daño alguno?',
          en: 'You have Greninja (Water/Dark) on the field and your opponent prepares an Electric move. Which typing on your squad can switch in taking zero damage?',
        },
        options: [
          { id: 'a', text: { es: 'Tipo Planta', en: 'Grass type' } },
          { id: 'b', text: { es: 'Tipo Tierra (inmunidad natural)', en: 'Ground type (natural immunity)' } },
          { id: 'c', text: { es: 'Tipo Dragón', en: 'Dragon type' } },
          { id: 'd', text: { es: 'Tipo Acero', en: 'Steel type' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'El tipo Tierra es totalmente inmune a los ataques de tipo Eléctrico (multiplicador x0), absorbiendo el golpe sin sufrir daño.',
          en: 'Ground is completely immune to Electric moves (x0 multiplier), absorbing the strike with zero damage.',
        },
      },
      {
        id: 'fund-q3',
        prompt: {
          es: 'Si un atacante físico letal como Dragonite sufre el estado de Quemadura (Burn), ¿qué impacto inmediato tiene en su potencial ofensivo?',
          en: 'If a menacing physical attacker like Dragonite suffers a Burn (BRN), what immediate impact does it have on its offensive output?',
        },
        options: [
          { id: 'a', text: { es: 'Su velocidad se reduce a la mitad', en: 'Its speed is cut in half' } },
          { id: 'b', text: { es: 'El daño de sus ataques físicos se reduce en un 50%', en: 'Damage from its physical attacks is slashed by 50%' } },
          { id: 'c', text: { es: 'No puede usar movimientos de estado', en: 'It cannot use status moves' } },
          { id: 'd', text: { es: 'Solo pierde 1/16 de vida sin afectar sus estadísticas', en: 'It only takes 1/16th chip damage without stat changes' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'La quemadura divide a la mitad (50%) el daño de todos los movimientos físicos ejecutados por el Pokémon quemado.',
          en: 'Burn cuts the raw damage of all physical moves used by the burned Pokémon in half (50%).',
        },
      },
      {
        id: 'fund-q4',
        prompt: {
          es: 'Tu Alakazam tiene 135 de Ataque Especial y 50 de Ataque físico. ¿Por qué es un error enseñarle el movimiento Puño Fuego (Físico) en lugar de Onda Certera (Especial)?',
          en: 'Your Alakazam has 135 Special Attack and 50 physical Attack. Why is teaching it Fire Punch (Physical) over Focus Blast (Special) a major mistake?',
        },
        options: [
          { id: 'a', text: { es: 'Porque Puño Fuego no hace daño crítico', en: 'Because Fire Punch cannot land critical hits' } },
          { id: 'b', text: { es: 'Porque calculará el daño con su estadística ofensiva más débil (50)', en: 'Because it will calculate damage using its weakest offensive stat (50)' } },
          { id: 'c', text: { es: 'Porque el tipo Fuego no cubre nada', en: 'Because Fire provides zero coverage' } },
          { id: 'd', text: { es: 'Porque fallará siempre', en: 'Because it will always miss' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'Los movimientos físicos calculan el daño según el Ataque del usuario. Usar ataques físicos en un especialista especial desperdicia su potencial.',
          en: 'Physical attacks calculate output using physical Attack. Using physical moves on a special specialist wastes its power.',
        },
      },
      {
        id: 'fund-q5',
        prompt: {
          es: '¿Cuál es la contrapartida de equipar a tu atacante con una Cinta Elegida (Choice Band)?',
          en: 'What is the tactical drawback of equipping your attacker with a Choice Band?',
        },
        options: [
          { id: 'a', text: { es: 'Pierde 10% de PS en cada ataque', en: 'It loses 10% HP on each strike' } },
          { id: 'b', text: { es: 'Solo puede ejecutar el primer movimiento elegido hasta que sea retirado', en: 'It is locked into the first move used until switched out' } },
          { id: 'c', text: { es: 'Su velocidad se reduce a la mitad', en: 'Its speed is reduced by half' } },
          { id: 'd', text: { es: 'No puede recibir curaciones', en: 'It cannot receive recovery' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'Los objetos de elección otorgan un multiplicador brutal de x1.5 pero bloquean al Pokémon en el primer movimiento que ejecute.',
          en: 'Choice items grant a massive x1.5 multiplier but lock the Pokémon into that move until it switches out.',
        },
      },
    ],
  },
  combat: {
    sectionId: 'combat',
    title: {
      es: 'Evaluación Táctica: Combate',
      en: 'Tactical Evaluation: Combat',
    },
    description: {
      es: 'Demuestra tu capacidad para tomar decisiones, gestionar riesgos, predecir jugadas y pensar en equipo.',
      en: 'Demonstrate your ability to make decisions, manage risks, anticipate plays, and coordinate teammates.',
    },
    passingScore: 75,
    questions: [
      {
        id: 'combat-q1',
        prompt: {
          es: 'Tienes en combate un Greninja con 12 PS frente a un Scizor rival con 10 PS. Greninja tiene mayor velocidad natural y prepara Surf (prioridad 0). Scizor prepara Puño Bala (prioridad +1). ¿Quién actuará primero y por qué?',
          en: 'You have Greninja on the field with 12 HP facing an opponent’s Scizor at 10 HP. Greninja is naturally faster and selects Surf (priority 0). Scizor selects Bullet Punch (priority +1). Who strikes first and why?',
        },
        options: [
          {
            id: 'a',
            text: {
              es: 'Greninja, porque su estadística de Velocidad es superior a la de Scizor.',
              en: 'Greninja, because its Speed stat is naturally higher than Scizor’s.',
            },
          },
          {
            id: 'b',
            text: {
              es: 'Scizor, porque los movimientos con prioridad positiva (+1) siempre actúan antes que los de prioridad neutra (0), sin importar la Velocidad.',
              en: 'Scizor, because positive priority moves (+1) always hit before neutral priority (0) moves, regardless of Speed.',
            },
          },
          {
            id: 'c',
            text: {
              es: 'Atacan exactamente al mismo tiempo y ambos caen debilitados a la vez.',
              en: 'They strike at the exact same instant and both knock each other out.',
            },
          },
          {
            id: 'd',
            text: {
              es: 'Se decide por un desempate de moneda al aire al 50% (Speed Tie).',
              en: 'It is decided by a 50/50 coin flip tiebreaker (Speed Tie).',
            },
          },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'El escalón de prioridad se evalúa siempre antes que la estadística de velocidad. Cualquier ataque con prioridad positiva actúa antes que un ataque de prioridad estándar.',
          en: 'Priority tiers are always evaluated before Speed stats. Any positive priority move executes before standard neutral priority attacks.',
        },
      },
      {
        id: 'combat-q2',
        prompt: {
          es: 'Tu Pokémon activo es de tipo Fuego y está frente a un atacante de tipo Agua que prepara un movimiento elemental devastador. En tu banca tienes un Gastrodon con la habilidad Colector (inmune al agua y aumenta su propio Ataque Especial). ¿Cuál es la decisión más sólida?',
          en: 'Your active Pokémon is Fire-type facing an opposing Water attacker clearly readied to launch a lethal Water move. On your bench you hold Gastrodon with Storm Drain (immune to Water and boosts its Special Attack). What is the most solid play?',
        },
        options: [
          {
            id: 'a',
            text: {
              es: 'Quedarte en el campo y atacar con tu Pokémon de Fuego esperando que resista milagrosamente el golpe.',
              en: 'Stay in and attack with your Fire Pokémon hoping it miraculously survives the hit.',
            },
          },
          {
            id: 'b',
            text: {
              es: 'Cambiar a Gastrodon: entra inmune al ataque de agua sin recibir daño, gana un aumento de estadísticas y te otorga el control del tablero.',
              en: 'Switch to Gastrodon: it enters immune to the Water attack taking zero damage, gains a stat boost, and gives you board control.',
            },
          },
          {
            id: 'c',
            text: {
              es: 'Rendirte de inmediato porque el tipo Fuego no puede hacer nada contra el tipo Agua.',
              en: 'Forfeit on the spot because Fire can never overcome Water.',
            },
          },
          {
            id: 'd',
            text: {
              es: 'Usar un movimiento de estado con tu Pokémon de Fuego para sacrificarte sin beneficio.',
              en: 'Cast a status move with your Fire Pokémon to sacrifice it with zero return.',
            },
          },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'Aprovechar las inmunidades naturales o por habilidad mediante un cambio te permite absorber turnos rivales a coste cero y construir una posición ganadora.',
          en: 'Exploiting natural or ability-based immunities via switching absorbs rival turns at zero HP cost and creates an advantageous board state.',
        },
      },
      {
        id: 'combat-q3',
        prompt: {
          es: 'Lideras la partida con 3 Pokémon saludables frente a 1 único Pokémon rival con 20% de PS. Dispones de un ataque con 100% de precisión que garantiza el K.O. y otro con 70% de precisión que inflige más daño. ¿Qué principio de gestión de riesgo debes aplicar?',
          en: 'You lead the match with 3 healthy Pokémon against 1 opposing Pokémon sitting at 20% HP. You can click a 100% accurate move that guarantees the knockout or a 70% accurate move that deals overkill damage. What risk-management principle should you apply?',
        },
        options: [
          {
            id: 'a',
            text: {
              es: 'Usar el ataque de 70% para intentar conseguir un golpe crítico llamativo.',
              en: 'Click the 70% accurate move to attempt a flashy critical hit.',
            },
          },
          {
            id: 'b',
            text: {
              es: 'Cambiar continuamente de Pokémon para alargar la partida sin motivo.',
              en: 'Continuously switch Pokémon to drag out the match needlessly.',
            },
          },
          {
            id: 'c',
            text: {
              es: 'Ejecutar la jugada segura con el ataque de 100% de precisión: cuando tienes la victoria al alcance, la regla de oro es eliminar la varianza y el azar.',
              en: 'Execute the safe play with the 100% accurate move: when holding decisive advantage, the golden rule is eliminating variance and luck.',
            },
          },
          {
            id: 'd',
            text: {
              es: 'Esperar a que el rival se desconecte sin seleccionar ninguna acción.',
              en: 'Wait for the rival to disconnect without inputting an action.',
            },
          },
        ],
        correctOptionId: 'c',
        explanation: {
          es: 'Cuando vas ganando, tu deber táctico es minimizar riesgos innecesarios. Si una jugada 100% segura ya asegura el cierre de la partida, nunca arriesgues el resultado en una tirada de suerte.',
          en: 'When leading, your tactical duty is minimizing unforced risk. If a 100% reliable play seals the game, never gamble the win on RNG.',
        },
      },
      {
        id: 'combat-q4',
        prompt: {
          es: '[Verdadero o Falso] Un Pokémon propio al que solo le queda 1 PS ya no tiene ningún valor táctico en la partida y debe ser descartado o sacrificado inmediatamente sin pensar.',
          en: '[True or False] A friendly Pokémon left with only 1 HP holds zero remaining tactical value in the match and should be discarded or sacrificed without thought.',
        },
        options: [
          {
            id: 'a',
            text: {
              es: 'Verdadero: al tener 1 PS cualquier ataque lo noquea, por lo que es una carga inútil para el equipo.',
              en: 'True: having 1 HP means any attack knocks it out, making it an unplayable liability.',
            },
          },
          {
            id: 'b',
            text: {
              es: 'Falso: un Pokémon con 1 PS conserva su velocidad y fuerza al 100%; puede rematar a un rival con prioridad, usar control de campo o ser sacrificado estratégicamente para traer limpio a otro compañero.',
              en: 'False: a 1-HP Pokémon retains 100% of its speed and offensive power; it can finish off a foe with priority, set field speed, or provide a clean safe switch for a teammate.',
            },
          },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'Un Pokémon con 1 PS es tan rápido y potente como al inicio. Conservarlo para rematar con prioridad o usarlo para un cambio limpio en el momento adecuado puede decidir la partida entera.',
          en: 'A 1-HP Pokémon is just as fast and powerful as when full. Preserving it for a priority strike or a calculated clean switch can decide the entire match.',
        },
      },
      {
        id: 'combat-q5',
        prompt: {
          es: 'En un combate Dobles (VGC), tu atacante principal corre el peligro inminente de recibir un ataque fulminante de los rivales antes de actuar. Sin embargo, su compañero en el campo conoce el movimiento Señuelo (Follow Me). ¿Cómo coordinas las acciones de ambos?',
          en: 'In a Doubles (VGC) battle, your main offensive sweeper faces impending lethal fire from both opponents before moving. However, its partner knows Follow Me. How do you coordinate their actions this turn?',
        },
        options: [
          {
            id: 'a',
            text: {
              es: 'Ordenas atacar a ciegas con ambos sin preocuparte por la supervivencia de tu atacante clave.',
              en: 'Blindly order attacks on both slots without caring about your key sweeper’s survival.',
            },
          },
          {
            id: 'b',
            text: {
              es: 'Usas Señuelo con el compañero para redirigir todos los ataques rivales hacia él, permitiendo que tu atacante principal actúe libremente sin sufrir daño.',
              en: 'Use Follow Me on the partner to redirect all rival attacks into its slot, allowing your primary sweeper to attack freely without taking damage.',
            },
          },
          {
            id: 'c',
            text: {
              es: 'Cambias a ambos Pokémon al mismo tiempo regalando dos turnos gratis al oponente.',
              en: 'Switch both Pokémon out simultaneously, conceding two free turns to the opponent.',
            },
          },
          {
            id: 'd',
            text: {
              es: 'Usas Protección con ambos y pasas el turno sin lograr ningún avance en la partida.',
              en: 'Use Protect on both slots and pass the turn without achieving any board progress.',
            },
          },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'La redirección con movimientos como Señuelo o Polvo Ira es uno de los pilares de Dobles: sacrifica o desgasta al compañero de soporte para garantizar que tu pieza ofensiva más valiosa elimine una amenaza crítica.',
          en: 'Redirection moves like Follow Me or Rage Powder are cornerstones of Doubles: they absorb pressure onto the support partner so your key offensive piece can eliminate critical threats unharmed.',
        },
      },
    ],
  },
  stats: {
    sectionId: 'stats',
    title: {
      es: 'Evaluación Táctica: Estadísticas',
      en: 'Tactical Evaluation: Stats',
    },
    description: {
      es: 'Verifica tu dominio sobre IVs, EVs, naturalezas y optimización de atributos.',
      en: 'Verify your mastery over IVs, EVs, natures, and attribute optimization.',
    },
    passingScore: 75,
    questions: [
      {
        id: 'stats-q1',
        prompt: {
          es: '¿Cuántos Puntos de Esfuerzo (EVs) totales puede recibir como máximo un Pokémon?',
          en: 'How many total Effort Values (EVs) can a Pokémon receive at maximum?',
        },
        options: [
          { id: 'a', text: { es: '252 EVs', en: '252 EVs' } },
          { id: 'b', text: { es: '508 (o 510) EVs en total', en: '508 (or 510) total EVs' } },
          { id: 'c', text: { es: '100 EVs', en: '100 EVs' } },
          { id: 'd', text: { es: 'Ilimitados', en: 'Unlimited' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'Un Pokémon puede acumular hasta 508 EVs útiles en total (510 con los dos residuales), con un límite de 252 en una estadística individual.',
          en: 'A Pokémon can hold up to 508 effective EVs in total (510 total pool), with a 252 cap in any individual stat.',
        },
      },
    ],
  },
  teambuilding: {
    sectionId: 'teambuilding',
    title: {
      es: 'Evaluación Táctica: Construcción de Equipos',
      en: 'Tactical Evaluation: Teambuilding',
    },
    description: {
      es: 'Comprueba si sabes diseñar combinaciones elementales coherentes y resolver debilidades de equipo.',
      en: 'Check if you can assemble cohesive type synergies and solve squad vulnerabilities.',
    },
    passingScore: 75,
    questions: [
      {
        id: 'team-q1',
        prompt: {
          es: '¿Por qué la combinación elemental Fuego - Agua - Planta se considera un núcleo (Core) legendario?',
          en: 'Why is the Fire - Water - Grass elemental trio considered a legendary competitive core?',
        },
        options: [
          { id: 'a', text: { es: 'Porque cada uno cubre y resiste las debilidades elementales de los otros dos', en: 'Because each member resists and covers the elemental weaknesses of the other two' } },
          { id: 'b', text: { es: 'Porque aprenden los mismos movimientos', en: 'Because they learn the same moves' } },
          { id: 'c', text: { es: 'Porque siempre ganan por defecto', en: 'Because they auto-win matchups' } },
          { id: 'd', text: { es: 'Porque son los tipos iniciales del juego', en: 'Simply because they are starter typings' } },
        ],
        correctOptionId: 'a',
        explanation: {
          es: 'Agua cubre el Fuego, Planta cubre el Agua y Fuego cubre la Planta. Crean un ciclo triangular de sinergia defensiva perfecto.',
          en: 'Water covers Fire, Grass covers Water, and Fire covers Grass. They form a perfect self-sustaining defensive triangle.',
        },
      },
    ],
  },
  roles: {
    sectionId: 'roles',
    title: {
      es: 'Evaluación Táctica: Roles',
      en: 'Tactical Evaluation: Roles',
    },
    description: {
      es: 'Identifica la función exacta de Sweepers, Walls, Pivots y Wallbreakers.',
      en: 'Identify the exact tactical duties of Sweepers, Walls, Pivots, and Wallbreakers.',
    },
    passingScore: 75,
    questions: [
      {
        id: 'roles-q1',
        prompt: {
          es: '¿Cuál es la función primordial de un Wallbreaker en una partida?',
          en: 'What is the primary role of a Wallbreaker during a battle?',
        },
        options: [
          { id: 'a', text: { es: 'Curar a sus compañeros de equipo', en: 'Heal teammates from status' } },
          { id: 'b', text: { es: 'Abrir brechas con daño masivo para demoler las murallas defensivas del rival', en: 'Punch holes with massive immediate damage to shatter opposing defensive walls' } },
          { id: 'c', text: { es: 'Colocar Trampa Rocas únicamente', en: 'Only set Stealth Rock' } },
          { id: 'd', text: { es: 'Ser el Pokémon más rápido del juego', en: 'Be the fastest Pokémon in the tier' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'El Wallbreaker posee una fuerza bruta inmediata que desmantela los tanques enemigos para que tu Sweeper pueda rematar después.',
          en: 'Wallbreakers possess brutal immediate offensive power designed to crack opposing tanks so your cleaner sweeps later.',
        },
      },
    ],
  },
  strategies: {
    sectionId: 'strategies',
    title: {
      es: 'Evaluación Táctica: Estrategias',
      en: 'Tactical Evaluation: Strategies',
    },
    description: {
      es: 'Demuestra que comprendes el funcionamiento de climas, Espacio Raro y arquetipos competitivos.',
      en: 'Prove your comprehension of weather, Trick Room, and competitive team archetypes.',
    },
    passingScore: 75,
    questions: [
      {
        id: 'strat-q1',
        prompt: {
          es: '¿Cómo altera el movimiento Espacio Raro (Trick Room) el orden de los turnos durante 5 turnos?',
          en: 'How does Trick Room alter turn order across its 5-turn duration?',
        },
        options: [
          { id: 'a', text: { es: 'Duplica la velocidad de todos', en: 'Doubles everyone’s Speed' } },
          { id: 'b', text: { es: 'Los Pokémon con menor velocidad se mueven antes dentro de su prioridad', en: 'Slower Pokémon move first within their priority bracket' } },
          { id: 'c', text: { es: 'Impide usar ataques físicos', en: 'Prevents physical attacks' } },
          { id: 'd', text: { es: 'Obliga a ambos a cambiar de Pokémon', en: 'Forces both players to switch' } },
        ],
        correctOptionId: 'b',
        explanation: {
          es: 'Espacio Raro invierte la jerarquía de velocidad, permitiendo que especies lentas pero demoledoras ataquen antes que nadie.',
          en: 'Trick Room inverts the speed hierarchy, allowing slow but monstrous attackers to strike before anyone else.',
        },
      },
    ],
  },
}

// =========================================================================
// DICCIONARIO COMPETITIVO (CONSULTA RÁPIDA)
// =========================================================================

export const DICTIONARY_TERMS = [
  {
    term: 'STAB',
    category: 'Mecánicas',
    simpleExplanation: {
      es: 'Multiplicador de daño del +50% que recibe un ataque cuando es del mismo tipo elemental que el Pokémon que lo usa.',
      en: '+50% damage multiplier a move receives when it matches the elemental typing of the user.',
    },
    inShort: {
      es: 'Pegas 50% más fuerte con ataques de tu propio tipo.',
      en: 'You hit 50% harder with moves matching your own type.',
    },
    deepDiveSectionId: 'fundamentals',
  },
  {
    term: 'EV (Puntos de Esfuerzo)',
    category: 'Estadísticas',
    simpleExplanation: {
      es: 'Puntos que entrenas en tu Pokémon para potenciar características específicas (Ataque, Defensa, Velocidad, etc.). Dispones de 508 puntos en total.',
      en: 'Training points invested into a Pokémon to sculpt specific stats (Attack, Defense, Speed, etc.). You have 508 total points to allocate.',
    },
    inShort: {
      es: 'Puntos que repartes para personalizar y mejorar las estadísticas de tu Pokémon.',
      en: 'Points allocated to customize and optimize your Pokémon’s stats.',
    },
    deepDiveSectionId: 'stats',
  },
  {
    term: 'IV (Valores Individuales)',
    category: 'Estadísticas',
    simpleExplanation: {
      es: 'La genética innata con la que nace cada Pokémon. Cada estadística tiene un valor entre 0 y 31 puntos inalterables.',
      en: 'Innate genetics a Pokémon is born with. Each stat holds an unchangeable value ranging from 0 to 31.',
    },
    inShort: {
      es: 'Los genes de tu Pokémon. 31 es la perfección genética.',
      en: 'Your Pokémon’s genes. 31 represents genetic perfection.',
    },
    deepDiveSectionId: 'stats',
  },
  {
    term: 'Sweeper',
    category: 'Roles',
    simpleExplanation: {
      es: 'Un atacante rápido y letal encargado de barrer y noquear a los Pokémon restantes del rival una vez que están debilitados.',
      en: 'A fast, lethal attacker tasked with sweeping through the opponent’s remaining weakened Pokémon.',
    },
    inShort: {
      es: 'El rematador de la partida.',
      en: 'The match closer and team sweeper.',
    },
    deepDiveSectionId: 'roles',
  },
  {
    term: 'Wall (Muralla)',
    category: 'Roles',
    simpleExplanation: {
      es: 'Un Pokémon con altísima resistencia defensiva y capacidad curativa diseñado para absorber golpes sin debilitarse.',
      en: 'A Pokémon with immense defensive bulk and recovery tools designed to absorb punishment without fainting.',
    },
    inShort: {
      es: 'El escudo que frena los ataques rivales.',
      en: 'The shield that stops opponent sweeps.',
    },
    deepDiveSectionId: 'roles',
  },
  {
    term: 'Pivot',
    category: 'Roles',
    simpleExplanation: {
      es: 'Un Pokémon que entra al campo gracias a sus resistencias y usa movimientos como Ida y Vuelta para cambiar de forma segura a un compañero.',
      en: 'A sturdy Pokémon that enters on resistances and uses moves like U-turn to safely bring in a teammate.',
    },
    inShort: {
      es: 'El puente seguro para cambiar de Pokémon sin regalar turnos.',
      en: 'The safe conduit to switch Pokémon without conceding turns.',
    },
    deepDiveSectionId: 'roles',
  },
  {
    term: 'Wallbreaker',
    category: 'Roles',
    simpleExplanation: {
      es: 'Un atacante con fuerza descomunal inmediata diseñado para quebrar y noquear a las murallas defensivas del oponente.',
      en: 'A powerhouse with devastating immediate firepower designed to smash through opponent defensive walls.',
    },
    inShort: {
      es: 'El ariete que rompe las defensas enemigas.',
      en: 'The battering ram that shatters enemy bulwarks.',
    },
    deepDiveSectionId: 'roles',
  },
  {
    term: 'Entry Hazards',
    category: 'Mecánicas',
    simpleExplanation: {
      es: 'Trampas colocadas en el campo rival (Trampa Rocas, Púas, Red Viscosa) que causan daño o reducen estadísticas cada vez que el oponente cambia de Pokémon.',
      en: 'Obstacles placed on the opposing field (Stealth Rock, Spikes, Sticky Web) that deal damage or lower stats upon switching.',
    },
    inShort: {
      es: 'Trampas que castigan al rival cada vez que cambia.',
      en: 'Field traps that penalize the rival whenever they switch.',
    },
    deepDiveSectionId: 'teambuilding',
  },
  {
    term: 'Setup / Booster',
    category: 'Mecánicas',
    simpleExplanation: {
      es: 'Movimientos como Danza Espada, Paz Mental o Danza Dragón que aumentan estadísticas en combate para multiplicar el poder ofensivo.',
      en: 'Moves like Swords Dance, Calm Mind, or Dragon Dance that raise stat stages in battle to multiply offensive strength.',
    },
    inShort: {
      es: 'Potenciarse las estadísticas antes de atacar.',
      en: 'Buffing your stats before attacking.',
    },
    deepDiveSectionId: 'combat',
  },
  {
    term: 'Speed Control',
    category: 'Estrategias',
    simpleExplanation: {
      es: 'Métodos para manipular la velocidad de los combatientes en el campo, como Viento Afín, Espacio Raro, Parálisis o Red Viscosa.',
      en: 'Techniques that manipulate turn order and field speed, such as Tailwind, Trick Room, Paralysis, or Sticky Web.',
    },
    inShort: {
      es: 'Asegurarte de que tu equipo ataque antes que el rival.',
      en: 'Ensuring your squad moves before the opponent.',
    },
    deepDiveSectionId: 'teambuilding',
  },
  {
    term: 'Win Condition (Wincon)',
    category: 'Estrategias',
    simpleExplanation: {
      es: 'El plan claro y determinante con el que vas a cerrar la victoria. Identificar qué Pokémon o qué jugada ganará la partida.',
      en: 'The explicit tactical roadmap that secures victory. Identifying which Pokémon or play sequence will close the game.',
    },
    inShort: {
      es: 'Tu plan maestro para ganar.',
      en: 'Your definitive master plan to win.',
    },
    deepDiveSectionId: 'combat',
  },
  {
    term: 'Momentum',
    category: 'Estrategias',
    simpleExplanation: {
      es: 'La iniciativa en el combate. Forzar al rival a defenderse y responder a tus decisiones sin permitirle ejecutar su propio plan.',
      en: 'Initiative in battle. Forcing the opponent to react defensively rather than executing their own strategy.',
    },
    inShort: {
      es: 'Llevar la batuta de la partida.',
      en: 'Dictating the flow and rhythm of the game.',
    },
    deepDiveSectionId: 'combat',
  },
]

// =========================================================================
// MÉTODOS DE BÚSQUEDA Y UTILIDADES
// =========================================================================

export function getSectionById(sectionId) {
  return GUIDE_SECTIONS.find((s) => s.id === sectionId) || null
}

export function getSectionObjectives(sectionId) {
  return GUIDE_OBJECTIVES.filter((obj) => obj.sectionId === sectionId)
}

export function getObjectiveById(objectiveId) {
  return GUIDE_OBJECTIVES.find((obj) => obj.id === objectiveId) || null
}

export function getAllObjectives() {
  return GUIDE_OBJECTIVES
}

export function getSectionExam(sectionId) {
  return GUIDE_EXAMS[sectionId] || null
}

export function getGlossaryTerms(searchQuery = '', categoryFilter = 'all') {
  const query = searchQuery.trim().toLowerCase()
  const filter = (categoryFilter || 'all').trim().toLowerCase()
  return DICTIONARY_TERMS.filter((item) => {
    const matchesCategory =
      filter === 'all' || item.category.toLowerCase() === filter
    if (!matchesCategory) return false

    if (!query) return true
    return (
      item.term.toLowerCase().includes(query) ||
      item.simpleExplanation.es.toLowerCase().includes(query) ||
      item.simpleExplanation.en.toLowerCase().includes(query) ||
      item.inShort.es.toLowerCase().includes(query)
    )
  })
}

export function getLocalizedObjective(objective, locale = 'es') {
  if (!objective) return null
  const lang = String(locale).toLowerCase().startsWith('en') ? 'en' : 'es'
  return {
    id: objective.id,
    sectionId: objective.sectionId,
    title: objective.title[lang] || objective.title.es,
    description: objective.description[lang] || objective.description.es,
    lesson: {
      introduction:
        objective.lesson?.introduction?.[lang] ||
        objective.lesson?.introduction?.es ||
        '',
      sections: (objective.lesson?.sections || []).map((sec) => ({
        title: sec.title[lang] || sec.title.es,
        content: sec.content[lang] || sec.content.es,
      })),
      summary:
        objective.lesson?.summary?.[lang] || objective.lesson?.summary?.es || '',
    },
    deepDive: {
      sections: (objective.deepDive?.sections || []).map((sec) => ({
        title: sec.title[lang] || sec.title.es,
        content: sec.content[lang] || sec.content.es,
      })),
      examples: (objective.deepDive?.examples || []).map((ex) => ({
        title: ex.title[lang] || ex.title.es,
        description: ex.description[lang] || ex.description.es,
      })),
      summary:
        objective.deepDive?.summary?.[lang] ||
        objective.deepDive?.summary?.es ||
        '',
    },
    nextObjectiveId: objective.nextObjectiveId || null,
  }
}
