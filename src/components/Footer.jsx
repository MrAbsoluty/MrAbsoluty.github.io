function Footer({ t }) {
  return <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><span /></span><span>PokéGuide</span></a><p>{t.footer.tagline}</p><span className="footer-note">{t.footer.note}</span></footer>
}

export default Footer