function ItemCard({
  name,
  localizedName,
  category,
  image,
  fallbackImage,
  defaultImage,
  placeholderImage,
  onClick,
}) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  function handleImageError(event) {
    const img = event.currentTarget
    const step = Number(img.dataset.fallbackStep || '0')

    if (step === 0 && fallbackImage && img.src !== fallbackImage) {
      img.dataset.fallbackStep = '1'
      img.src = fallbackImage
      return
    }
    if (step <= 1 && defaultImage && img.src !== defaultImage) {
      img.dataset.fallbackStep = '2'
      img.src = defaultImage
      return
    }
    if (step <= 2 && placeholderImage) {
      img.dataset.fallbackStep = '3'
      img.src = placeholderImage
    }
  }

  return (
    <div
      className="item-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="item-card-meta">
        <span>{category}</span>
      </div>
      <div className="item-card-image">
        <img
          key={name || image}
          src={image}
          alt={localizedName || name}
          loading="lazy"
          onError={handleImageError}
        />
      </div>
      <div className="item-card-name">
        <h3>{localizedName || name}</h3>
        <span aria-hidden="true">↗</span>
      </div>
    </div>
  )
}

export default ItemCard