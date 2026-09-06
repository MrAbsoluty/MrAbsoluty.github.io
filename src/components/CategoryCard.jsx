function CategoryCard({ icon, title, description, accent }) {
  return <a className="category-card" href="#featured" style={{ '--card-accent': accent }}><span className="category-icon" aria-hidden="true">{icon}</span><span className="category-content"><strong>{title}</strong><small>{description}</small></span><span className="arrow" aria-hidden="true">↗</span></a>
}

export default CategoryCard