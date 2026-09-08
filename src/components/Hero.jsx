import { useState } from 'react'
import SearchBar from './SearchBar'

const pokemonOrbitPool = [
  { id: 25, name: 'pikachu', label: 'Pikachu', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
  { id: 133, name: 'eevee', label: 'Eevee', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
  { id: 94, name: 'gengar', label: 'Gengar', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
  { id: 448, name: 'lucario', label: 'Lucario', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
  { id: 6, name: 'charizard', label: 'Charizard', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
  { id: 149, name: 'dragonite', label: 'Dragonite', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png' },
]

function randomSample(items, amount) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, amount)
}

function createOrbitObjects() {
  const pokemon = randomSample(pokemonOrbitPool, 3)
  const orbitDefinitions = [{ objects: pokemon, kind: 'pokemon', radius: 130, size: 42, duration: 18 }]

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

function Hero({ onSearch, onPokemonClick, isLoading, t, locale }) {
  const [orbitObjects] = useState(createOrbitObjects)
  const [selectedPokemon, setSelectedPokemon] = useState(null)

  function handlePokemonClick(name) {
    setSelectedPokemon(name)
    onPokemonClick(name)
  }

  return (
    <section className="hero-section" id="top">
      <div className="hero-copy"><p className="eyebrow"><span /> {t.hero.eyebrow}</p><h1>{t.hero.title}<br /><em>{t.hero.titleAccent}</em> {t.hero.titleEnd}</h1><p className="hero-subtitle">{t.hero.subtitle}</p><SearchBar onSearch={onSearch} isLoading={isLoading} t={t} locale={locale} /><p className="search-hint">{t.hero.hint}</p></div>
      <div className="hero-orbit"><div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" /><div className="orbiting-objects">{orbitObjects.map((object) => <button className={`orbit-object${selectedPokemon === object.name ? ' selected' : ''}`} key={object.name} type="button" aria-label={`${t.hero.orbitAria} ${object.label}`} onClick={() => handlePokemonClick(object.name)} style={{ '--orbit-angle': `${object.angle}deg`, '--orbit-radius': `${object.radius}px`, '--orbit-size': `${object.size}px`, '--orbit-duration': `${object.duration}s` }}><img className={object.kind} src={object.image} alt={object.label} /></button>)}</div><div className="hero-pokeball" aria-hidden="true"><span /></div></div>
    </section>
  )
}

export default Hero