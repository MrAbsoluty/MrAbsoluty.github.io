import { localeOptions } from '../locales'

function Navbar({ t, locale, onLocaleChange }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={t.nav.homeAria}><span className="brand-mark" aria-hidden="true"><span /></span><span>PokéGuide</span></a>
      <nav className="main-nav" aria-label={t.nav.aria}><a className="active" href="#top">{t.nav.home}</a><a href="#featured">{t.nav.pokedex}</a><a href="#categories">{t.nav.competitive}</a><a href="#categories">{t.nav.guide}</a></nav>
      <div className="header-actions"><label className="language-picker"><span aria-hidden="true">{localeOptions.find((option) => option.code === locale)?.flag}</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value)} aria-label="Language"><option value="es">{t.languages.es}</option><option value="es-419">{t.languages['es-419']}</option><option value="en">{t.languages.en}</option></select></label><button className="ai-link" type="button" aria-label={t.nav.ai}><span className="spark" aria-hidden="true">✦</span><span>{t.nav.ai}</span></button></div>
    </header>
  )
}

export default Navbar