function PokemonCard({ number, name, type, image, accent }) {
  return <article className="pokemon-card" style={{ '--card-accent': accent }}><div className="pokemon-meta"><span>#{number}</span><span className="type-label">{type}</span></div><img src={image} alt={name} loading="lazy" /><div className="pokemon-name"><h3>{name}</h3><span aria-hidden="true">↗</span></div></article>
}

export default PokemonCard