const updates = [
  {
    id: 'learning-path',
    date: '2026-10-09',
    content: {
      es: {
        title: 'Camino de Aprendizaje',
        summary: 'La guía organiza objetivos, evaluaciones y progreso por secciones.',
        category: 'Guía',
        details: [
          'La guía está organizada en secciones con objetivos educativos y lecciones.',
          'El Camino de Aprendizaje presenta los objetivos en páginas de cinco elementos, con navegación y trazado visual en zigzag.',
          'Los objetivos visitados y aprendidos, los resultados de examen y las insignias se gestionan mediante el servicio de progreso de la guía y se guardan localmente.',
        ],
      },
      en: {
        title: 'Learning Path',
        summary: 'The guide organizes objectives, assessments, and progress by section.',
        category: 'Guide',
        details: [
          'The guide is organized into sections with learning objectives and lessons.',
          'The Learning Path shows objectives in pages of five, with pagination and a zigzag layout.',
          'Visited and learned objectives, exam results, and badges are handled by the guide progress service and stored locally.',
        ],
      },
    },
  },
  {
    id: 'global-updates-panel',
    date: '2026-10-09',
    content: {
      es: {
        title: 'Panel global de novedades',
        summary: 'Un acceso flotante permite consultar novedades sin salir de la página.',
        category: 'Interfaz',
        details: [
          'El botón de novedades está montado globalmente y fuera de la barra de navegación.',
          'El panel ofrece una lista de novedades, un resumen general de cambios y contenido localizado en español e inglés.',
          'Las novedades leídas se recuerdan en este navegador; las nuevas entradas siguen apareciendo como pendientes.',
          'El panel se adapta al tema activo y al espacio disponible de la ventana.',
        ],
      },
      en: {
        title: 'Global updates panel',
        summary: 'A floating entry point shows updates without leaving the page.',
        category: 'Interface',
        details: [
          'The updates button is mounted globally and remains outside the navigation bar.',
          'The panel provides an updates list, a general change overview, and localized content in Spanish and English.',
          'Read updates are remembered in this browser; new entries still appear as unread.',
          'The panel adapts to the active theme and available viewport space.',
        ],
      },
    },
  },
]

const overview = {
  es: {
    title: 'Resumen general de cambios',
    introduction:
      'Este resumen reúne funciones verificables disponibles en la versión actual de PokeGuide. No representa un historial completo de versiones.',
  },
  en: {
    title: 'General change overview',
    introduction:
      'This overview collects verifiable features available in the current version of PokeGuide. It is not a complete release history.',
  },
}

export { overview }
export default updates
