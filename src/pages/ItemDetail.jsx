import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { playButtonSound } from '../utils/audio'

function formatName(name) {
  return name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function ItemDetail({ item, error, isLoading, onBack, t, locale, onLocaleChange }) {
  function handleBackClick() {
    playButtonSound()
    onBack?.()
  }

  if (isLoading) {
    return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="detail-state"><div className="loader-orbit" aria-hidden="true"><span /></div><p className="eyebrow">{t.itemDetail.loadingEyebrow}</p><h1>{t.itemDetail.loadingTitle} <em>{t.itemDetail.loadingAccent}</em></h1><p>{t.itemDetail.loadingText}</p></main><Footer t={t} /></div>
  }

  if (error) {
    return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="detail-state"><span className="error-mark" aria-hidden="true">!</span><p className="eyebrow">{t.itemDetail.errorEyebrow}</p><h1>{t.itemDetail.errorTitle}<br /><em>{t.itemDetail.errorAccent}</em></h1><p>{error.message}</p><div className="detail-actions"><button className="primary-action" type="button" onClick={handleBackClick}>{t.detail.backHome}</button></div></main><Footer t={t} /></div>
  }

  function handleImageError(event) {
    const img = event.currentTarget
    if (img.dataset.fallbackApplied || !item.fallbackImage) return
    img.dataset.fallbackApplied = 'true'
    img.src = item.fallbackImage
  }

  return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="detail-page"><button className="back-link" type="button" onClick={handleBackClick}><span aria-hidden="true">←</span> {t.detail.back}</button><section className="detail-hero"><div className="detail-copy"><p className="eyebrow">{t.itemDetail.eyebrow} #{String(item.id).padStart(3, '0')}</p><h1>{item.localizedName}<em>.</em></h1><div className="type-list"><span>{formatName(item.category)}</span></div><p className="detail-description"><strong>{t.itemDetail.descriptionLabel}</strong>{item.description || t.itemDetail.noEffect}</p><p className="detail-description"><strong>{t.itemDetail.effectLabel}</strong>{item.effect || t.itemDetail.noEffect}</p><div className="measurements"><div><small>{t.itemDetail.categoryLabel}</small><strong>{formatName(item.category)}</strong></div>{item.cost !== null && item.cost !== undefined && <div><small>{t.itemDetail.cost}</small><strong>₽{item.cost}</strong></div>}</div></div><div className="detail-art"><div className="art-ring" /><img src={item.image} alt={item.localizedName || item.name} onError={handleImageError} /></div></section></main><Footer t={t} /></div>
}

export default ItemDetail