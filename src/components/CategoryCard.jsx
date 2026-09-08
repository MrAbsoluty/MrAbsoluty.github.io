function CategoryCard({ icon, title, description, accent, href = '#featured', onClick }) {
  function handleClick(event) {
    if (onClick) { event.preventDefault(); onClick() }
  }

  return <a className="category-card" href={href} onClick={handleClick} style={{ '--card-accent': accent }}><span className="category-icon" aria-hidden="true">{icon}</span><span className="category-content"><strong>{title}</strong><small>{description}</small></span><span className="arrow" aria-hidden="true">↗</span></a>
}

export default CategoryCard