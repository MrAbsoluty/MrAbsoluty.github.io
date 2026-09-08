/**
 * Descripciones de Pokédex para Mega Evoluciones (Español e Inglés).
 * Incluye las entradas oficiales procedentes de Pokémon Sol, Luna, Ultrasol,
 * Ultraluna, Let's Go y los registros oficiales de Pokémon ORAS y XY.
 */

export function getGenericMegaDescription(pokemonName, formName, locale = 'es') {
  const isSpanish = locale.startsWith('es')
  const variant = formName ? ` ${formName.toUpperCase().replace('MEGA-', '')}` : ''
  const name = pokemonName || 'este Pokémon'

  if (isSpanish) {
    return `Al desatar la megaevolución con su megapiedra, ${name}${variant} supera sus límites naturales, canalizando una energía desbordante que incrementa enormemente su poder de combate.`
  }
  return `By unleashing the power of Mega Evolution with its Mega Stone, ${name}${variant} surpasses its natural limits, channeling an overwhelming surge of energy that drastically amplifies its combat prowess.`
}

export const megaDescriptionsEs = {
  // Gen 1
  'venusaur-mega':
    'Para soportar el peso de la enorme flor que ha crecido gracias a la megaevolución, su lomo y sus patas se han fortalecido.',
  'charizard-mega-x':
    'El poder abrumador que llena su cuerpo hace que se vuelva de color negro y que desprenda intensas llamaradas azules.',
  'charizard-mega-y':
    'El vínculo con su Entrenador es la fuente de su poder. Su velocidad y maniobrabilidad superan a las de un avión de combate.',
  'blastoise-mega':
    'El cañón de su lomo es tan potente como el de un tanque. Sus robustas patas y su espalda le permiten soportar el retroceso del disparo.',
  'beedrill-mega':
    'Sus patas se han transformado en aguijones venenosos. Ensarta a sus presas repetidamente con ellos antes de asestar el golpe de gracia con el aguijón de su abdomen.',
  'pidgeot-mega':
    'Con su fuerza muscular enormemente potenciada, puede volar sin descanso durante dos semanas seguidas.',
  'alakazam-mega':
    'Como resultado de la megaevolución, todo su poder se ha transformado en energía psíquica, perdiendo la fuerza en sus músculos.',
  'slowbro-mega':
    'Toda la energía de la megaevolución se concentró en el Shellder de su cola, devorando a Slowpoke casi por completo.',
  'gengar-mega':
    'Los lazos de Gengar están trastocados. Solo siente interés por sus oponentes si los considera una presa.',
  'kangaskhan-mega':
    'La fuerza de Mega-Kangaskhan procede de la felicidad de la madre al ver crecer a su cría, lo cual mantiene siempre su ánimo en lo más alto.',
  'pinsir-mega':
    'La influencia de la megaevolución lo deja en un estado de constante exaltación. Ensarta a sus enemigos con sus enormes cuernos antes de despedazarlos.',
  'gyarados-mega':
    'La megaevolución también afecta a su cerebro, dejando solo activo su instinto destructivo de reducirlo todo a cenizas.',
  'aerodactyl-mega':
    'Parte de su cuerpo se ha petrificado. Algunos expertos afirman que este es el aspecto que tenía Aerodactyl en sus orígenes.',
  'mewtwo-mega-x':
    'El poder psíquico ha aumentado su masa muscular. Posee una fuerza de agarre de una tonelada y corre los 100 metros en dos segundos.',
  'mewtwo-mega-y':
    'Pese a su reducido tamaño, su poder mental ha aumentado extraordinariamente. Con un mero pensamiento puede pulverizar un rascacielos.',

  // Gen 2
  'ampharos-mega':
    'El exceso de energía de la megaevolución estimula sus genes, haciendo que vuelva a brotar la lana que había perdido.',
  'steelix-mega':
    'La energía de la megaevolución recubre su cuerpo de fragmentos minerales y virutas de diamante, volviéndolo más duro que cualquier metal conocido.',
  'scizor-mega':
    'El exceso de energía que baña a este Pokémon lo mantiene en constante riesgo de desbordamiento, por lo que no puede sostener combates prolongados.',
  'heracross-mega':
    'Puede sujetar objetos entre sus dos cuernos y levantar hasta 500 veces su propio peso corporal.',
  'houndoom-mega':
    'Sus garras rojas y la punta de su cola se funden debido a las altísimas temperaturas internas que causan dolor al propio Houndoom.',
  'tyranitar-mega':
    'Debido a la descomunal energía recibida, su lomo se ha desgarrado por completo. Solo sus instintos destructivos lo mantienen en movimiento.',

  // Gen 3
  'sceptile-mega':
    'Gracias a la megaevolución, la enorme aguja de su cola puede dispararse como un misil hacia sus enemigos, regenerándose rápidamente mientras mantenga su energía.',
  'blaziken-mega':
    'Al megaevolucionar pule aún más la potencia de sus patadas. Al lanzar una feroz ráfaga de golpes, la fricción prende fuego a sus piernas, aumentando su fuerza y velocidad.',
  'swampert-mega':
    'La musculatura del torso y de sus brazos se expande de forma descomunal con la megaevolución, confiriéndole una fuerza demoledora tanto en tierra como bajo el agua.',
  'gardevoir-mega':
    'Al megaevolucionar libera un inmenso caudal de energía psicoquinética. Es capaz de abrir agujeros de gusano dimensionales para proteger la vida de su Entrenador.',
  'sableye-mega':
    'La gema de su pecho, que ha crecido desmesuradamente por efecto de la megaevolución, es capaz de repeler cualquier ataque.',
  'mawile-mega':
    'Posee una naturaleza sumamente agresiva. Atrapa a sus presas con sus dos grandes fauces y las destroza con pura fuerza bruta.',
  'aggron-mega':
    'Al desprenderse de sus elementos de roca, su cuerpo pasa a ser de puro acero templado. Sus descomunales cuernos pueden partir montañas de un solo embate.',
  'medicham-mega':
    'Mediante una meditación extrema impulsada por la megaevolución, materializa su espíritu en extremidades etéreas con las que asesta veloces golpes invisibles.',
  'manectric-mega':
    'La megaevolución llena su cuerpo con una tremenda cantidad de electricidad, tanta que Manectric no es capaz de controlarla por completo.',
  'sharpedo-mega':
    'Las espinas que brotan de su cabeza son colmillos transformados. Si se dañan o se rompen, se regeneran una y otra vez.',
  'camerupt-mega':
    'Las jorobas de su lomo se fusionan en un colosal volcán que entra en continua erupción de magma ardiente, pulverizando su entorno con un calor abrasador.',
  'altaria-mega':
    'El plumaje algodonoso que lo rodea resplandece con energía de tipo Hada. Su hermoso canto purifica el alma y apacigua los corazones de quienes lo oyen.',
  'banette-mega':
    'Una energía extraordinaria amplifica su poder maldito hasta tal punto que es incapaz de evitar maldecir a su propio Entrenador.',
  'absol-mega':
    'Al agitar el pelaje de su espalda como si batiera unas alas, proyecta una intimidante aura hacia sus adversarios.',
  'glalie-mega':
    'El desbordamiento de energía de la megaevolución le desencajó la mandíbula inferior, de la que expulsa ventiscas sin cesar.',
  'salamence-mega':
    'Parte en dos a cualquiera que se interponga en su camino mientras continúa surcando el cielo sin aminorar la marcha.',
  'metagross-mega':
    'Esta forma es el resultado de la unión entre un Metagross, un Metang y dos Beldum.',
  'latias-mega':
    'Su cuerpo aerodinámico alcanza velocidades que superan el mach. El brillo cristalino de sus plumas dispersa la luz y la oculta en pleno vuelo.',
  'latios-mega':
    'Al megaevolucionar se vuelve más veloz que un avión caza, canalizando su tremendo poder psíquico para abatir objetivos a distancias colosales.',
  'rayquaza-mega':
    'Habiendo consumido meteoritos durante incontables milenios, su cuerpo desata tempestades aerodinámicas y ráfagas delta que anulan cualquier clima adverso.',

  // Gen 4
  'lopunny-mega':
    'Bate sus orejas como si fuesen látigos para castigar a sus enemigos. Posee un temperamento sumamente combativo.',
  'garchomp-mega':
    'El exceso de energía fundió sus alas y brazos, transformándolos en unas gigantescas guadañas.',
  'lucario-mega':
    'Las marcas negras de su cuerpo reflejan la energía de la megaevolución fusionada con su aura recorriéndolo a toda velocidad.',
  'abomasnow-mega':
    'Los brotes de su lomo se han transformado en gigantescos pilares de hielo. Desata tempestades polares tan gélidas que congelan todo a su paso.',
  'gallade-mega':
    'Infundido con el espíritu de la caballería, sus brazos se convierten en sables gemelos de energía pura con los que defiende con honor a su Entrenador.',

  // Gen 5
  'audino-mega':
    'Su cuerpo emite un pulso balsámico tan profundo que aquieta de inmediato la ira y hostilidad de cualquier rival en el campo de batalla.',

  // Gen 6
  'diancie-mega':
    'Conocida como la Princesa Real Rosa, el resplandeciente diamante sobre su cabeza deslumbra con una pureza indestructible que maravilla a quien lo contempla.',

  // Variantes especiales y PokeAPI
  'lucario-mega-z':
    'Canaliza una energía Z concentrada en su megaevolución. Su aura se afila como una lanza de luz capaz de atravesar cualquier defensa.',
  'garchomp-mega-z':
    'La frecuencia Z potencia el filo de sus guadañas a niveles térmicos extremos, hendiendo el suelo con ondas de choque sísmicas.',
  'absol-mega-z':
    'Su sensibilidad psíquica para percibir desastres se entrelaza con el poder Z, permitiéndole advertir y esquivar ataques antes de que ocurran.',
  'raichu-mega-x':
    'La energía de la megaevolución acumula descargas de alto voltaje en su cola, permitiéndole deslizarse sobre corrientes eléctricas.',
  'raichu-mega-y':
    'Amplifica sus ondas electromagnéticas con poder telequinético, levitando ingrávidamente mientras desata tormentas de centellas.',
  'dragonite-mega':
    'Al alcanzar la megaevolución, sus alas se expanden colosalmente, permitiéndole generar corrientes marinas y surcar tormentas a velocidades supersónicas.',
  'greninja-mega':
    'Su sincronización de combate culmina en shurikens de agua gigantescos impregnados de energía pura que lanza con una velocidad imperceptible.',
  'zygarde-mega':
    'Canaliza la fuerza del ecosistema entero, manifestando su máxima potencia celular para restaurar el equilibrio de la naturaleza.',
}

export const megaDescriptionsEn = {
  // Gen 1
  'venusaur-mega':
    'In order to support its flower, which has grown larger due to Mega Evolution, its back and legs have become stronger.',
  'charizard-mega-x':
    'The overwhelming power that fills its entire body causes it to turn black and creates intense blue flames.',
  'charizard-mega-y':
    'Its bond with its Trainer is the source of its power. It boasts speed and maneuverability greater than that of a jet fighter.',
  'blastoise-mega':
    'The cannon on its back is as powerful as a tank gun. Its tough legs and back enable it to withstand the recoil from firing the cannon.',
  'beedrill-mega':
    'Its legs have become poison stingers. It stabs its prey repeatedly with the stingers on its limbs, dealing the final blow with the stinger on its rear.',
  'pidgeot-mega':
    'With its muscular strength now greatly increased, it can fly continuously for two weeks without resting.',
  'alakazam-mega':
    'As a result of Mega Evolution, its power has been entirely converted into psychic energy, and it has lost all strength in its muscles.',
  'slowbro-mega':
    'All the energy from Mega Evolution poured into the Shellder on its tail, leaving Slowpoke to be swallowed whole.',
  'gengar-mega':
    'Gengar’s relationships are warped. It has no interest in opponents unless it perceives them as prey.',
  'kangaskhan-mega':
    'Mega Kangaskhan’s strength derives from the mother’s happiness about her child’s growth. Watching it grow up keeps her spirits high.',
  'pinsir-mega':
    'The influence of Mega Evolution leaves it in a state of constant excitement. It pierces enemies with its two large horns before shredding them.',
  'gyarados-mega':
    'Mega Evolution also affects its brain, leaving no other function except its destructive instinct to burn everything to cinders.',
  'aerodactyl-mega':
    'Part of its body has become stone. Some scholars claim that this is Aerodactyl’s true appearance.',
  'mewtwo-mega-x':
    'Psychic power has augmented its muscles. It has a grip strength of one ton and can sprint a hundred meters in two seconds flat!',
  'mewtwo-mega-y':
    'Despite its diminished size, its mental power has grown phenomenally. With a mere thought, it can smash a skyscraper to smithereens.',

  // Gen 2
  'ampharos-mega':
    'Excess energy from Mega Evolution stimulates its genes, and the wool it had lost grows in again.',
  'steelix-mega':
    'The energy of Mega Evolution coats its body in mineral shards and diamond dust, making it harder than any known metal.',
  'scizor-mega':
    'The excess energy that bathes this Pokémon keeps it in constant danger of overflow. It can’t sustain a battle over long periods of time.',
  'heracross-mega':
    'It can grip things with its two horns and lift 500 times its own body weight.',
  'houndoom-mega':
    'Its red claws and the tips of its tail are melting from high internal temperatures that are painful to Houndoom itself.',
  'tyranitar-mega':
    'Due to the colossal power poured into it, this Pokémon’s back split right open. Its destructive instincts are the only thing keeping it moving.',

  // Gen 3
  'sceptile-mega':
    'Thanks to Mega Evolution, the large stinger at the tip of its tail can be launched like a missile at foes, regenerating rapidly as long as its energy lasts.',
  'blaziken-mega':
    'Upon Mega Evolving, it further hones the power of its kicks. A fierce flurry of strikes causes its legs to ignite with friction, ramping up its power and speed.',
  'swampert-mega':
    'The musculature of its upper body expands enormously through Mega Evolution, granting it devastating power both on land and underwater.',
  'gardevoir-mega':
    'Upon Mega Evolving, it unleashes an immense surge of psychokinetic energy, capable of warping dimensions to protect its Trainer.',
  'sableye-mega':
    'The jewel from its chest, which has grown gigantic due to the effects of Mega Evolution, can turn back any attack.',
  'mawile-mega':
    'It has an extremely vicious disposition. It grips prey in its two sets of jaws and tears them apart with raw power.',
  'aggron-mega':
    'Shedding its rock composition, its body turns into pure tempered steel. Its colossal horns can cleave whole mountains in a single blow.',
  'medicham-mega':
    'Through intense meditation driven by Mega Evolution, it materializes its spirit into ethereal arms that deliver lightning-fast strikes.',
  'manectric-mega':
    'Mega Evolution fills its body with a tremendous amount of electricity, but it’s too much for Manectric to fully control.',
  'sharpedo-mega':
    'The spines sprouting from its head are transformed fangs. If they’re injured or broken off, the spines will regenerate countless times.',
  'camerupt-mega':
    'The humps on its back fuse into a single colossal volcano that continuously erupts with molten magma, scorching everything in its path.',
  'altaria-mega':
    'The soft, cottony plumage enveloping it radiates Fairy-type energy. Its melodious song cleanses the spirit and pacifies hostile hearts.',
  'banette-mega':
    'Extraordinary energy amplifies its cursing power to such an extent that it can’t help but curse its own Trainer.',
  'absol-mega':
    'When this Pokémon whips the winglike fur on its back as though beating its wings, it sends an intimidating aura flying at its opponents.',
  'glalie-mega':
    'The excess energy from Mega Evolution spilled over from its mouth, breaking its jaw. It spews endless blizzards.',
  'salamence-mega':
    'Anyone standing in its path gets sliced right in two, while this Pokémon continues its flight without interruption.',
  'metagross-mega':
    'This form results from one Metagross, one Metang, and two Beldum linking up.',
  'latias-mega':
    'Its sleek, aerodynamic body surpasses Mach speeds. The crystalline sheen of its plumage refracts light to cloak it mid-flight.',
  'latios-mega':
    'Mega Evolving makes it faster than a jet fighter, focusing tremendous psychic power to strike down targets from great distances.',
  'rayquaza-mega':
    'Having consumed meteorites for eons, its body unleashes violent delta winds and tempestuous currents that neutralize all weather.',

  // Gen 4
  'lopunny-mega':
    'It swings its ears like whips and strikes its enemies with them. It has an intensely combative disposition.',
  'garchomp-mega':
    'Excess energy melted its arms and wings, transforming them into giant scythes.',
  'lucario-mega':
    'Black streaks all over its body show where its auras and the energy of Mega Evolution intermingled and raced through it.',
  'abomasnow-mega':
    'The ice sprouts on its back grow into massive icicles. It unleashes raging polar blizzards that freeze everything solid.',
  'gallade-mega':
    'Embodying the soul of chivalry, its arms transform into twin energy blades that it brandishes with supreme honor to protect its Trainer.',

  // Gen 5
  'audino-mega':
    'Its body emits a gentle, soothing pulse that instantly pacifies aggression and calms hostility across the battlefield.',

  // Gen 6
  'diancie-mega':
    'Known as the Royal Pink Princess, the gleaming diamond atop its head radiates indestructible purity that captivates all who behold it.',

  // Special Variants
  'lucario-mega-z':
    'Channeling concentrated Z-energy into its Mega Evolution, its aura sharpens like a spear of light capable of piercing any barrier.',
  'garchomp-mega-z':
    'Z-energy superheats the edges of its scythes, cleaving through the ground with seismic shockwaves.',
  'absol-mega-z':
    'Its precognitive sensitivity to disasters merges with Z-power, allowing it to foresee and evade enemy strikes before they occur.',
  'raichu-mega-x':
    'Mega Evolution condenses high-voltage electrical charges onto its tail, enabling it to surf swiftly on electrical currents.',
  'raichu-mega-y':
    'It amplifies its electromagnetic waves with telekinetic power, levitating weightlessly while unleashing brilliant lightning storms.',
  'dragonite-mega':
    'Upon Mega Evolving, its wings expand colossally, allowing it to summon sea currents and soar through hurricanes at supersonic speeds.',
  'greninja-mega':
    'Its combat bond manifests massive water shurikens brimming with pure energy that it hurls at imperceptible speeds.',
  'zygarde-mega':
    'Drawing upon the full power of the ecosystem, it manifests its complete cellular force to restore balance to the world.',
}
