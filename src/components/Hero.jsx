import { useState } from 'react'
import SearchBar from './SearchBar'

const pokemonOrbitPool = [
  { name: 'Pikachu', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
  { name: 'Eevee', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
  { name: 'Gengar', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
  { name: 'Lucario', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
  { name: 'Mimikyu', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png' },
  { name: 'Dragonite', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png' },
]

const itemOrbitPool = [
  { name: 'Poké Ball', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' },
  { name: 'Rare Candy', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png' },
  { name: 'Potion', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png' },
  { name: 'Master Ball', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png' },
  { name: 'Berry', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cheri-berry.png' },
  { name: 'Lucky Egg', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png' },
]

function randomSample(items, amount) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, amount)
}

function createOrbitObjects() {
  const pokemon = randomSample(pokemonOrbitPool, 3)
  const items = randomSample(itemOrbitPool, 3)
  const orbitDefinitions = [
    { objects: pokemon, kind: 'pokemon', radius: 138, size: 42, duration: 18 },
    { objects: items, kind: 'item', radius: 158, size: 27, duration: 24 },
  ]

  return orbitDefinitions.flatMap(({ objects, kind, radius, size, duration }) => {
    const angleStep = 360 / objects.length

    return objects.map((object, index) => ({
      ...object,
      kind,
      angle: index * angleStep,
      radius,
      size,
      duration,
    }))
  })
}

function Hero({ onSearch, isLoading, t, locale }) {
  const [orbitObjects] = useState(createOrbitObjects)

  return (
    <section className="hero-section" id="top">
      <div className="hero-copy"><p className="eyebrow"><span /> {t.hero.eyebrow}</p><h1>{t.hero.title}<br /><em>{t.hero.titleAccent}</em> {t.hero.titleEnd}</h1><p className="hero-subtitle">{t.hero.subtitle}</p><SearchBar onSearch={onSearch} isLoading={isLoading} t={t} locale={locale} /><p className="search-hint">{t.hero.hint}</p></div>
      <div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbiting-objects">{orbitObjects.map((object) => <div className="orbit-object" key={object.name} style={{ '--orbit-angle': `${object.angle}deg`, '--orbit-radius': `${object.radius}px`, '--orbit-size': `${object.size}px`, '--orbit-duration': `${object.duration}s` }}><img className={object.kind} src={object.image} alt="" /></div>)}</div><div className="hero-pokeball"><span /></div></div>
    </section>
  )
}

export default Hero