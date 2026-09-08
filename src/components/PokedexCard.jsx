import { memo } from 'react'

const typeColors = {
  bug: '#65a47b',
  dark: '#59636b',
  dragon: '#7d77a9',
  electric: '#ddb431',
  fairy: '#c875a6',
  fighting: '#c87545',
  fire: '#e5764f',
  flying: '#7f9db2',
  ghost: '#756d9a',
  grass: '#65a47b',
  ground: '#b18a62',
  ice: '#70afae',
  normal: '#929a98',
  poison: '#a46f9a',
  psychic: '#dd7181',
  rock: '#a29468',
  steel: '#77858e',
  water: '#5d98b4',
}

function PokedexCard({
  pokemon,
  isShiny = false,
  onClick,
  t,
}) {
  const { id, name, apiName, types = [], accentColor, image, shinyImage } = pokemon
  const currentImage = isShiny && shinyImage ? shinyImage : image
  const formattedId = String(id).padStart(3, '0')

  // Derive signature accent color: primary type color > species accent color
  const primaryType = types[0]
  const cardAccent = typeColors[primaryType] || accentColor || '#aa3bff'

  // Format type string: e.g. "Planta · Veneno" or "Fuego"
  const typesText = types
    .map((typeKey) => t.types[typeKey] || typeKey.charAt(0).toUpperCase() + typeKey.slice(1))
    .join(' · ')

  return (
    <button
      type="button"
      className="pokemon-card pokedex-interactive-card"
      style={{ '--card-accent': cardAccent }}
      onClick={() => onClick?.(apiName || String(id))}
      aria-label={`${name} #${formattedId} - ${typesText}`}
    >
      <div className="pokemon-meta">
        <span>
          #{formattedId}
          {isShiny && (
            <em className="shiny-indicator" title="Shiny" aria-label="Shiny">
              {' '}✦
            </em>
          )}
        </span>
        <span className="type-label">{typesText}</span>
      </div>

      <img
        src={currentImage}
        alt={name}
        loading="lazy"
      />

      <div className="pokemon-name">
        <h3>{name}</h3>
        <span aria-hidden="true">↗</span>
      </div>
    </button>
  )
}

export default memo(PokedexCard)
