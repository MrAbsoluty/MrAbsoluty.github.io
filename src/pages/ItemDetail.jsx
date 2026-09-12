import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { playButtonSound } from '../utils/audio'

function ItemDetail({ item, error, isLoading, onBack, t, locale, onLocaleChange }) {
  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  function handleImageError(event) {
    const img = event.currentTarget
    const step = Number(img.dataset.fallbackStep || '0')

    if (step === 0 && item?.fallbackImage && img.src !== item.fallbackImage) {
      img.dataset.fallbackStep = '1'
      img.src = item.fallbackImage
      return
    }
    if (step <= 1 && item?.defaultImage && img.src !== item.defaultImage) {
      img.dataset.fallbackStep = '2'
      img.src = item.defaultImage
      return
    }
    if (step <= 2 && item?.placeholderImage) {
      img.dataset.fallbackStep = '3'
      img.src = item.placeholderImage
    }
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} />
        <main className="detail-state">
          <div className="loader-orbit" aria-hidden="true"><span /></div>
          <p className="eyebrow">{t.itemDetail.loadingEyebrow}</p>
          <h1>{t.itemDetail.loadingTitle} <em>{t.itemDetail.loadingAccent}</em></h1>
          <p>{t.itemDetail.loadingText}</p>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="page-shell">
        <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} />
        <main className="detail-state">
          <span className="error-mark" aria-hidden="true">!</span>
          <p className="eyebrow">{t.itemDetail.errorEyebrow}</p>
          <h1>{t.itemDetail.errorTitle}<br /><em>{t.itemDetail.errorAccent}</em></h1>
          <p>{error?.message || t.itemDetail.noEffect}</p>
          <div className="detail-actions">
            <button className="primary-action" type="button" onClick={handleBackClick}>
              {t.detail.backHome}
            </button>
          </div>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  const hasDistinctEffect = Boolean(item.effect && !item.hasDuplicateText)

  return (
    <div className="page-shell">
      <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} />
      <main className="detail-page item-detail-page">
        <button className="back-link" type="button" onClick={handleBackClick}>
          <span aria-hidden="true">←</span> {t.detail.back}
        </button>

        <article className="item-detail-container">
          {/* Escenario destacado del Sprite HD */}
          <section
            className="item-showcase-stage"
            aria-label={`Sprite de ${item.localizedName || item.name}`}
          >
            <div className="item-stage-pedestal">
              <div className="item-stage-glow" aria-hidden="true" />
              <div className="item-stage-ring" aria-hidden="true" />
              <div className="item-stage-ring inner" aria-hidden="true" />
              <img
                key={item.name || item.image}
                src={item.image}
                alt={item.localizedName || item.name}
                className="item-showcase-sprite"
                onError={handleImageError}
              />
            </div>
          </section>

          {/* Información principal y títulos */}
          <header className="item-header-meta">
            <p className="eyebrow">{t.itemDetail.eyebrow} #{String(item.id).padStart(3, '0')}</p>
            <h1 className="item-main-title">
              {item.localizedName || item.name}
              <em className="item-title-dot">.</em>
            </h1>
            <div className="item-badge-row">
              <span className="item-category-pill">{item.category}</span>
            </div>
          </header>

          {/* Fichas de contenido: Descripción y Efecto */}
          <section className="item-content-cards">
            {/* Tarjeta de Descripción */}
            <div className="item-card-block item-description-block">
              <div className="item-block-header">
                <span className="item-block-icon" aria-hidden="true">📜</span>
                <h3>{t.itemDetail.descriptionLabel}</h3>
              </div>
              <p className="item-block-text">
                {item.description || t.itemDetail.noEffect}
              </p>
            </div>

            {/* Tarjeta de Efecto (cuando hay efecto mecánico diferenciado) */}
            {hasDistinctEffect && (
              <div className="item-card-block item-effect-block">
                <div className="item-block-header">
                  <span className="item-block-icon" aria-hidden="true">⚡</span>
                  <h3>{t.itemDetail.effectLabel}</h3>
                </div>
                <p className="item-block-text">
                  {item.effect}
                </p>
              </div>
            )}

            {/* Chips de Información: Categoría e Identificador */}
            <div className="item-meta-chips">
              <div className="item-chip">
                <small>{t.itemDetail.categoryLabel}</small>
                <strong>{item.category}</strong>
              </div>
              <div className="item-chip">
                <small>{t.itemDetail.indexLabel || 'ÍNDICE'}</small>
                <strong>#{String(item.id).padStart(3, '0')}</strong>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer t={t} />
    </div>
  )
}

export default ItemDetail