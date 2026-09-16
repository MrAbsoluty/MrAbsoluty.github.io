import { playClickSound } from '../utils/audio'
import { formatName } from '../services/pokeapi'
import { selectRepresentativePokemon } from '../utils/representativePokemon'

const typeColors = {
  bug: '#65a47b',
  dark: '#59636b',
  dragon: '#7d77a9',
  electric: '#ddb431',
  fairy: '#c875a6',
  fighting: '#c87545',
  fire: '#e5764f',
  flying: '#7f9db2',
  ghost: '#756d9a',
  grass: '#65a47b',
  ground: '#b18a62',
  ice: '#70afae',
  normal: '#929a98',
  poison: '#a46f9a',
  psychic: '#dd7181',
  rock: '#a29468',
  steel: '#77858e',
  water: '#5d98b4',
}

function MoveCard({ move, onClick, t }) {
  if (!move) return null

  const {
    displayName,
    localizedName,
    originalName,
    type = 'normal',
    category = 'status',
    power,
    accuracy,
    pp,
    description,
    effect,
    learnedBy = [],
  } = move

  const typeColor = typeColors[type] || '#77858e'
  const localizedTypeName = t?.types?.[type] || type.toUpperCase()
  const localizedCategoryName = t?.moves?.categories?.[category] || category.toUpperCase()

  // Selección determinista del usuario representativo más característico
  const topRepresentative = selectRepresentativePokemon({ move, learners: learnedBy, limit: 1 })[0]
  const firstLearner = topRepresentative?.name
    ? formatName(topRepresentative.name)
    : (learnedBy[0]?.name ? formatName(learnedBy[0].name) : null)

  function handleClick() {
    playClickSound()
    onClick?.(move.name)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      className="move-card"
      style={{ '--move-accent': typeColor }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${displayName || localizedName || originalName}, ${localizedTypeName}, ${localizedCategoryName}`}
    >
      <div>
        <header className="move-card-header">
          <div className="move-card-names">
            <h3 className="move-card-title">{displayName || localizedName || originalName}</h3>
            <p className="move-card-original">{originalName}</p>
          </div>
          <div className="move-card-badges">
            <span className="move-type-badge">{localizedTypeName}</span>
            <span className={`move-category-badge ${category}`}>{localizedCategoryName}</span>
          </div>
        </header>

        <div className="move-card-stats">
          <div className="move-stat-item">
            <span className="move-stat-val">{power !== null && power > 0 ? power : '—'}</span>
            <span className="move-stat-lbl">{t?.moveDetail?.powerShort || 'POT'}</span>
          </div>
          <div className="move-stat-item">
            <span className="move-stat-val">{accuracy !== null ? `${accuracy}%` : '—'}</span>
            <span className="move-stat-lbl">{t?.moveDetail?.accuracyShort || 'PREC'}</span>
          </div>
          <div className="move-stat-item">
            <span className="move-stat-val">{pp || '—'}</span>
            <span className="move-stat-lbl">{t?.moveDetail?.ppShort || 'PP'}</span>
          </div>
        </div>

        <p className="move-card-desc">{effect || description || t?.moveDetail?.noDescription}</p>
      </div>

      <footer className="move-card-footer">
        {firstLearner && (
          <span className="move-card-featured-user">
            ◆ {t?.moves?.featuredLearner || 'Usuario'}: <strong>{firstLearner}</strong>
          </span>
        )}
        <span className="move-card-cta" aria-hidden="true">
          {t?.moves?.viewMove || 'Ver movimiento'} ▸
        </span>
      </footer>
    </article>
  )
}

export default MoveCard
