import es from './es'

const es419 = {
  ...es,
  nav: { ...es.nav, guide: 'Guía' },
  hero: { ...es.hero, subtitle: 'Una guía interactiva para descubrir Pokémon, aprender sus mecánicas y entender cómo funcionan en batalla.' },
  detail: { ...es.detail, description: 'Una mirada rápida a sus características, habilidades y estadísticas base.', back: 'Volver a explorar' },
  itemDetail: { eyebrow: 'OBJETO', cost: 'COSTO', noEffect: 'Este objeto no tiene una descripción disponible.', loadingEyebrow: 'CONSULTANDO LOS OBJETOS', loadingTitle: 'Buscando', loadingAccent: 'un objeto.', loadingText: 'Estamos trayendo los datos desde PokéAPI.', errorEyebrow: 'NO HAY RESULTADOS', errorTitle: 'No encontramos', errorAccent: 'ese objeto.' },
  footer: { ...es.footer, note: 'Una guía hecha por y para entrenadores curiosos.' },
}

export default es419
