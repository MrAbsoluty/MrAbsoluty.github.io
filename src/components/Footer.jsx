import { scrollToTop } from '../utils/scroll'
import logoImg from '../assets/logo.png'

function Footer({ t }) {
  function handleBrandClick(event) {
    event.preventDefault()
    scrollToTop('instant')
    if (window.location.hash !== '#top') {
      window.history.pushState({}, '', '/#top')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <footer className="site-footer">
      <a className="brand" href="#top" onClick={handleBrandClick}>
        <img src={logoImg} alt="PokeGuide" className="brand-logo-img" />
        <span>PokéGuide</span>
      </a>
      <p>{t.footer.tagline}</p>
      <span className="footer-note">{t.footer.note}</span>
    </footer>
  )
}

export default Footer