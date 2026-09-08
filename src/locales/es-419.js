import es from './es'

const es419 = {
  ...es,
  nav: { ...es.nav, guide: 'Guía' },
  hero: { ...es.hero, subtitle: 'Una guía interactiva para descubrir Pokémon, aprender sus mecánicas y entender cómo funcionan en batalla.' },
  detail: { ...es.detail, description: 'Una mirada rápida a sus características, habilidades y estadísticas base.', back: 'Volver a explorar' },
  itemDetail: { eyebrow: 'OBJETO', cost: 'COSTO', categoryLabel: 'CATEGORÍA', descriptionLabel: 'DESCRIPCIÓN', effectLabel: 'EFECTO', noEffect: 'Este objeto no tiene una descripción disponible.', loadingEyebrow: 'CONSULTANDO LOS OBJETOS', loadingTitle: 'Buscando', loadingAccent: 'un objeto.', loadingText: 'Estamos trayendo los datos desde PokéAPI.', errorEyebrow: 'NO HAY RESULTADOS', errorTitle: 'No encontramos', errorAccent: 'ese objeto.' },
  items: { eyebrow: 'GUÍA DE OBJETOS', title: 'Explora los', titleAccent: 'objetos.', description: 'Descubre herramientas, recursos y objetos del mundo Pokémon.', searchPlaceholder: 'Busca un objeto...', loading: 'Cargando objetos...', empty: 'No encontramos objetos con ese nombre.', loadMore: 'Cargar más', retry: 'Reintentar' },
  footer: { ...es.footer, note: 'Una guía hecha por y para entrenadores curiosos.' },
}

export default es419
