/**
 * Utilidad global de posicionamiento y scroll para PokeGuide.
 * Asegura que al navegar a cualquier página nueva, vista de detalle o ruta,
 * la pantalla siempre se posicione en el encabezado (tope superior / scrollY = 0),
 * evitando que la nueva página se cargue en la parte inferior cuando el usuario
 * o el mouse estaban en el fondo de la página previa.
 */

export function scrollToTop(behavior = 'instant') {
  if (typeof window === 'undefined') return

  const applyScroll = () => {
    // 1. Reset standard de ventana con comportamiento instantáneo
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior,
      })
    } catch {
      window.scrollTo(0, 0)
    }

    // 2. Asignación directa a las propiedades de scrollTop en document y body
    if (document.documentElement && document.documentElement.scrollTop !== 0) {
      document.documentElement.scrollTop = 0
    }
    if (document.body && document.body.scrollTop !== 0) {
      document.body.scrollTop = 0
    }

    // 3. Reset de posibles contenedores internos con overflow
    const containers = document.querySelectorAll(
      '.page-shell, main, .pokedex-page, .moves-page, .items-page, .detail-page, .profile-page, .favorites-page'
    )
    containers.forEach((el) => {
      if (el && el.scrollTop !== 0) {
        el.scrollTop = 0
      }
    })
  }

  // Ejecutar inmediatamente
  applyScroll()

  // Ejecutar en el siguiente frame de animación por si React realiza reconciliación o reflow
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      applyScroll()
    })
  }
}
