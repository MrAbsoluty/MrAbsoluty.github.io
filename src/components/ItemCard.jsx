function ItemCard({ name, localizedName, category, image, fallbackImage, onClick }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick() }
  }

  function handleImageError(event) {
    const img = event.currentTarget
    if (img.dataset.fallbackApplied || !fallbackImage) return
    img.dataset.fallbackApplied = 'true'
    img.src = fallbackImage
  }

  return <div className="item-card" role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}><div className="item-card-meta"><span>{category}</span></div><div className="item-card-image"><img src={image} alt={localizedName || name} loading="lazy" onError={handleImageError} /></div><div className="item-card-name"><h3>{localizedName || name}</h3><span aria-hidden="true">↗</span></div></div>
}

export default ItemCard