function PokemonCard({ number, name, type, image, accent, onClick }) {
  function handleKeyDown(event) {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick(name)
    }
  }

  return (
    <article
      className="pokemon-card"
      style={{ '--card-accent': accent, cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(name) : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="pokemon-meta">
        <span>#{number}</span>
        <span className="type-label">{type}</span>
      </div>
      <img src={image} alt={name} loading="lazy" />
      <div className="pokemon-name">
        <h3>{name}</h3>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  )
}

export default PokemonCard