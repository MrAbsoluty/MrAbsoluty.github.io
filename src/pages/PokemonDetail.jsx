import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const typeColors = {
  bug: '#65a47b', dark: '#59636b', dragon: '#7d77a9', electric: '#ddb431', fairy: '#c875a6', fighting: '#c87545', fire: '#e5764f', flying: '#7f9db2', ghost: '#756d9a', grass: '#65a47b', ground: '#b18a62', ice: '#70afae', normal: '#929a98', poison: '#a46f9a', psychic: '#dd7181', rock: '#a29468', steel: '#77858e', water: '#5d98b4',
}

const statLabels = { hp: 'PS', attack: 'Ataque', defense: 'Defensa', 'special-attack': 'At. especial', 'special-defense': 'Def. especial', speed: 'Velocidad' }

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function PokemonDetail({ pokemon, error, isLoading, onBack, t, locale, onLocaleChange }) {
  if (isLoading) {
    return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="detail-state"><div className="loader-orbit" aria-hidden="true"><span /></div><p className="eyebrow">{t.detail.loadingEyebrow}</p><h1>{t.detail.loadingTitle} <em>{t.detail.loadingAccent}</em></h1><p>{t.detail.loadingText}</p></main><Footer t={t} /></div>
  }

  if (error) {
    return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="detail-state"><span className="error-mark" aria-hidden="true">!</span><p className="eyebrow">{t.detail.errorEyebrow}</p><h1>{t.detail.errorTitle}<br /><em>{t.detail.errorAccent}</em></h1><p>{error.message}</p><div className="detail-actions"><button className="primary-action" type="button" onClick={onBack}>{t.detail.backHome}</button></div></main><Footer t={t} /></div>
  }

  return <div className="page-shell"><Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} /><main className="detail-page"><button className="back-link" type="button" onClick={onBack}><span aria-hidden="true">←</span> {t.detail.back}</button><section className="detail-hero"><div className="detail-copy"><p className="eyebrow">{t.detail.pokedex} #{String(pokemon.id).padStart(3, '0')}</p><h1>{pokemon.localizedName || formatName(pokemon.name)}<em>.</em></h1><div className="type-list">{pokemon.types.map((type) => <span key={type} style={{ '--type-color': typeColors[type] || '#ed6d5d' }}>{pokemon.typeLabels?.[type] || formatName(type)}</span>)}</div><p className="detail-description">{t.detail.description}</p><div className="measurements"><div><small>{t.detail.height}</small><strong>{pokemon.height} m</strong></div><div><small>{t.detail.weight}</small><strong>{pokemon.weight} kg</strong></div></div></div><div className="detail-art"><div className="art-ring" /><img src={pokemon.image} alt={pokemon.localizedName || formatName(pokemon.name)} /></div></section><section className="detail-info"><div className="info-column"><p className="eyebrow">{t.detail.traits}</p><h2>{t.detail.abilities}</h2><div className="ability-list">{pokemon.abilities.map((ability) => <span key={ability}>{pokemon.abilityLabels?.[ability] || formatName(ability.replaceAll('-', ' '))}</span>)}</div></div><div className="stats-column"><p className="eyebrow">{t.detail.combat}</p><h2>{t.detail.stats}</h2><div className="stats-list">{pokemon.stats.map((stat) => <div className="stat-row" key={stat.name}><span>{t.detail.statLabels[stat.name] || formatName(stat.name)}</span><strong>{stat.value}</strong><div className="stat-track"><i style={{ width: `${Math.min((stat.value / 255) * 100, 100)}%` }} /></div></div>)}</div></div></section></main><Footer t={t} /></div>
}

export default PokemonDetail