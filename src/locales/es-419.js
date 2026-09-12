import es from './es'

const es419 = {
  ...es,
  nav: { ...es.nav, guide: 'Guía' },
  hero: { ...es.hero, subtitle: 'Una guía interactiva para descubrir Pokémon, aprender sus mecánicas y entender cómo funcionan en batalla.' },
  detail: { ...es.detail, description: 'Una mirada rápida a sus características, habilidades y estadísticas base.', back: 'Volver a explorar' },
  itemDetail: { eyebrow: 'OBJETO', indexLabel: 'ÍNDICE', categoryLabel: 'CATEGORÍA', descriptionLabel: 'DESCRIPCIÓN', effectLabel: 'EFECTO', noEffect: 'Este objeto no tiene una descripción disponible.', loadingEyebrow: 'CONSULTANDO LOS OBJETOS', loadingTitle: 'Buscando', loadingAccent: 'un objeto.', loadingText: 'Estamos trayendo los datos desde PokéAPI.', errorEyebrow: 'NO HAY RESULTADOS', errorTitle: 'No encontramos', errorAccent: 'ese objeto.' },
  items: { eyebrow: 'GUÍA DE OBJETOS', title: 'Explora los', titleAccent: 'objetos.', description: 'Descubre herramientas, recursos y objetos del mundo Pokémon.', searchPlaceholder: 'Busca por nombre o categoría...', loading: 'Cargando objetos...', empty: 'No encontramos ningún objeto que coincida con estos filtros o búsqueda.', loadMore: 'Cargar más objetos', retry: 'Reintentar', filterCategory: 'Categoría', allCategories: 'Todas las categorías', clearFilters: 'Limpiar filtros', clearSearch: 'Borrar texto', countTotal: '{count} objetos', countFiltered: '{count} objetos encontrados', quickFilters: { all: 'Todos', balls: 'Poké Balls', healing: 'Curación', battle: 'Combate', evolution: 'Evolución', berries: 'Bayas', vitamins: 'Vitaminas', key: 'Objetos clave' } },
  footer: { ...es.footer, note: 'Una guía hecha por y para entrenadores curiosos.' },
}

export default es419
