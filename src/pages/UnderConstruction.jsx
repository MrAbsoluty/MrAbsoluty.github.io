import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import conkeldurrGif from '../assets/conkeldurr.gif'
import '../styles/under-construction.css'

function UnderConstruction({
  onBack,
  onHomeClick,
  onPokedexClick,
  onItemsClick,
  onFavoritesClick,
  t,
  locale,
  onLocaleChange,
  featureName = '',
}) {
  const constructionT = t?.construction || {}

  const eyebrowText = constructionT.eyebrow || 'ZONA EN OBRAS · PRÓXIMAMENTE'
  const titleBase = featureName
    ? (locale === 'en' ? `${featureName} is` : `${featureName} está`)
    : (constructionT.title || 'Página en')
  const titleAccent = constructionT.titleAccent || 'construcción.'

  const subtitleText =
    constructionT.subtitle ||
    'Conkeldurr y nuestro equipo están levantando los cimientos de esta sección con los mejores materiales. ¡Muy pronto estará disponible con nuevas funciones y herramientas!'

  function handleBackClick(e) {
    e.preventDefault()
    if (onBack) {
      onBack()
    } else if (onHomeClick) {
      onHomeClick()
    }
  }

  function handleHomeClick(e) {
    e.preventDefault()
    if (onHomeClick) {
      onHomeClick()
    }
  }

  function handlePokedexClick(e) {
    e.preventDefault()
    if (onPokedexClick) {
      onPokedexClick()
    }
  }

  function handleItemsClick(e) {
    e.preventDefault()
    if (onItemsClick) {
      onItemsClick()
    }
  }

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        onHomeClick={onHomeClick}
        onPokedexClick={onPokedexClick}
        onFavoritesClick={onFavoritesClick}
        activeNav=""
      />

      <main className="construction-page">
        <div className="construction-container">
          <div className="construction-top-nav">
            <button className="back-link" type="button" onClick={handleBackClick}>
              <span aria-hidden="true">←</span> {t?.detail?.backHome || t?.detail?.back || 'Volver al inicio'}
            </button>
          </div>

          <div className="construction-card">
            <header className="construction-header">
              <p className="eyebrow">
                <span aria-hidden="true" />
                {eyebrowText}
              </p>
              <h1 className="construction-title">
                {titleBase} <em>{titleAccent}</em>
              </h1>
              <p className="construction-subtitle">{subtitleText}</p>
            </header>

            {/* Conkeldurr Arena */}
            <div className="construction-arena">
              <div className="conkeldurr-stage">
                <div className="conkeldurr-pedestal" aria-hidden="true" />
                <div className="conkeldurr-pedestal-ring" aria-hidden="true" />
                <img
                  src={conkeldurrGif}
                  alt="Conkeldurr trabajando en la construcción"
                  className="conkeldurr-gif"
                  loading="eager"
                  decoding="sync"
                />
              </div>

              <div className="construction-badges">
                <span className="construction-chip">
                  <span className="construction-chip-icon" aria-hidden="true">🔨</span>
                  <span>{constructionT.badgeWork || 'En desarrollo activo'}</span>
                </span>
                <span className="construction-chip">
                  <span className="construction-chip-icon" aria-hidden="true">🧱</span>
                  <span>{constructionT.badgeConcrete || 'Cimientos reforzados'}</span>
                </span>
                <span className="construction-chip">
                  <span className="construction-chip-icon" aria-hidden="true">💪</span>
                  <span>{constructionT.badgeConkeldurr || 'Supervisado por Conkeldurr'}</span>
                </span>
              </div>
            </div>

            {/* Tarjeta de estado y sugerencias temáticas */}
            <div className="construction-notice-card">
              <div className="construction-notice-header">
                <span className="construction-notice-icon" aria-hidden="true">💡</span>
                <div className="construction-notice-title-wrap">
                  <strong className="construction-notice-title">
                    {constructionT.noticeTitle || 'Cimientos legendarios en marcha'}
                  </strong>
                  <span className="construction-notice-tag">
                    {constructionT.noticeTag || 'DATO POKÉMON'}
                  </span>
                </div>
              </div>
              <p className="construction-notice-text">
                {constructionT.noticeText ||
                  'Conkeldurr enseñó a los humanos a mezclar concreto hace más de 2.000 años. Puedes tener la seguridad de que esta sección se está forjando con la máxima solidez táctica.'}
              </p>
              <div className="construction-features-preview">
                <div className="construction-preview-item">
                  <span className="construction-preview-dot" aria-hidden="true">✦</span>
                  <span>{constructionT.feature1 || 'La Pokédex completa y los Objetos están 100% operativos'}</span>
                </div>
                <div className="construction-preview-item">
                  <span className="construction-preview-dot" aria-hidden="true">✦</span>
                  <span>{constructionT.feature2 || 'El análisis de habilidades con PokeGuide AI sigue activo'}</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="construction-actions">
              <button
                type="button"
                className="construction-btn primary"
                onClick={handleHomeClick}
              >
                <span aria-hidden="true">←</span>
                <span>{constructionT.backHome || 'Volver al inicio'}</span>
              </button>
              <button
                type="button"
                className="construction-btn secondary"
                onClick={handlePokedexClick}
              >
                <span>{constructionT.explorePokedex || 'Explorar Pokédex'}</span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                type="button"
                className="construction-btn secondary"
                onClick={handleItemsClick}
              >
                <span>{constructionT.exploreItems || 'Ver Objetos'}</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  )
}

export default UnderConstruction
