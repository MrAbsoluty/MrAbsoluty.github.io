import { validateItemSpriteResolution, trackLoadedSprite } from '../services/pokeapi'

function ItemCard({
  id,
  name,
  localizedName,
  category,
  image,
  fallbackImage,
  defaultImage,
  quaternaryImage,
  placeholderImage,
  onClick,
}) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  function handleImageLoad(event) {
    const img = event.currentTarget
    validateItemSpriteResolution({ name, id }, img)
    trackLoadedSprite({ name, id }, img.currentSrc || img.src)
  }

  function handleImageError(event) {
    const img = event.currentTarget
    const step = Number(img.dataset.fallbackStep || '0')

    // Paso 1: Intentar Fallback HD (PGL / SV)
    if (step === 0 && fallbackImage && img.src !== fallbackImage) {
      img.dataset.fallbackStep = '1'
      img.src = fallbackImage
      return
    }
    // Paso 2: Intentar Fuente Canónica Específica (Serebii Base)
    if (step <= 1 && defaultImage && img.src !== defaultImage) {
      img.dataset.fallbackStep = '2'
      img.src = defaultImage
      return
    }
    // Paso 3: Intentar PokéAPI Raw Sprite de Respaldo
    if (step <= 2 && quaternaryImage && img.src !== quaternaryImage) {
      img.dataset.fallbackStep = '3'
      img.src = quaternaryImage
      return
    }
    // Paso 4: ÚLTIMO RECURSO ABSOLUTO: Placeholder SVG
    if (step <= 3 && placeholderImage && img.src !== placeholderImage) {
      img.dataset.fallbackStep = '4'
      img.src = placeholderImage
      if (import.meta.env?.DEV) {
        console.warn(`[ItemSprite] FALLBACK: ${name} (ID: ${id || 'unknown'}, sources tried: [${[image, fallbackImage, defaultImage, quaternaryImage].filter(Boolean).join(', ')}])`)
      }
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
          onLoad={handleImageLoad}
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