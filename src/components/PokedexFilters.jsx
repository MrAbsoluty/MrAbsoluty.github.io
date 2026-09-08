const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

const GENERATIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const REGIONS = [
  'kanto', 'johto', 'hoenn', 'sinnoh', 'unova',
  'kalos', 'alola', 'galar', 'paldea',
]

function PokedexFilters({
  selectedType,
  onTypeChange,
  selectedGen,
  onGenChange,
  selectedRegion,
  onRegionChange,
  isShiny,
  onToggleShiny,
  onClearFilters,
  totalCount,
  hasFilters,
  t,
}) {
  return (
    <section className="pokedex-filters-bar" aria-label={t.pokedex.eyebrow}>
      <div className="pokedex-filters-group">
        {/* Type Select */}
        <div className="filter-field">
          <label htmlFor="filter-type" className="filter-label">
            {t.pokedex.filterType}
          </label>
          <select
            id="filter-type"
            className="filter-select"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">{t.pokedex.filterAllTypes}</option>
            {POKEMON_TYPES.map((typeKey) => (
              <option key={typeKey} value={typeKey}>
                {t.types[typeKey] || typeKey}
              </option>
            ))}
          </select>
        </div>

        {/* Generation Select */}
        <div className="filter-field">
          <label htmlFor="filter-gen" className="filter-label">
            {t.pokedex.filterGen}
          </label>
          <select
            id="filter-gen"
            className="filter-select"
            value={selectedGen}
            onChange={(e) => onGenChange(e.target.value)}
          >
            <option value="">{t.pokedex.filterAllGens}</option>
            {GENERATIONS.map((genKey) => (
              <option key={genKey} value={genKey}>
                {t.pokedex.generations[genKey] || `Gen ${genKey}`}
              </option>
            ))}
          </select>
        </div>

        {/* Region Select */}
        <div className="filter-field">
          <label htmlFor="filter-region" className="filter-label">
            {t.pokedex.filterRegion}
          </label>
          <select
            id="filter-region"
            className="filter-select"
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            <option value="">{t.pokedex.filterAllRegions}</option>
            {REGIONS.map((regionKey) => (
              <option key={regionKey} value={regionKey}>
                {t.pokedex.regions[regionKey] || regionKey}
              </option>
            ))}
          </select>
        </div>

        {/* Shiny Switch Toggle */}
        <button
          type="button"
          className={`shiny-toggle-btn ${isShiny ? 'is-active' : ''}`}
          onClick={onToggleShiny}
          aria-pressed={isShiny}
          title={t.pokedex.filterShiny}
        >
          <span className="shiny-sparkle" aria-hidden="true">✦</span>
          <span>{t.pokedex.filterShiny}</span>
        </button>

        {/* Reset Filters button */}
        {hasFilters && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={onClearFilters}
            title={t.pokedex.clearFilters}
          >
            ✕ {t.pokedex.clearFilters}
          </button>
        )}
      </div>

      {/* Dynamic Counter */}
      <div className="pokedex-counter" aria-live="polite">
        <strong>
          {hasFilters
            ? t.pokedex.countFiltered.replace('{count}', totalCount.toLocaleString())
            : t.pokedex.countTotal.replace('{count}', totalCount.toLocaleString())}
        </strong>
      </div>
    </section>
  )
}

export default PokedexFilters
