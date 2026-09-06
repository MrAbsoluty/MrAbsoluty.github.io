function ItemCard({ name, localizedName, category, image, onClick }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter') onClick()
  }

  return <div className="pokemon-card" role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}><div className="pokemon-meta"><span className="type-label">{category}</span></div><img src={image} alt={name} loading="lazy" /><div className="pokemon-name"><h3>{localizedName}</h3><span aria-hidden="true">↗</span></div></div>
}

export default ItemCard