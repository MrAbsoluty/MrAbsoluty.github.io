import CategoryCard from '../components/CategoryCard'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import ItemCard from '../components/ItemCard'
import Navbar from '../components/Navbar'
import PokemonCard from '../components/PokemonCard'

const categories = [
  { icon: '◉', title: 'Pokédex', description: 'Descubre cada especie', accent: '#ee6a5f' }, { icon: '↗', title: 'Competitivo', description: 'Piensa como un estratega', accent: '#e0a52b' }, { icon: '✦', title: 'Aprende', description: 'Las bases, sin complicaciones', accent: '#4c9b8a' }, { icon: '▣', title: 'Objetos', description: 'Todo tiene un propósito', accent: '#7d77a9' }, { icon: '✧', title: 'Movimientos', description: 'Elige tu próximo movimiento', accent: '#c87545' },
]
const featuredPokemon = [
  { number: '001', name: 'Bulbasaur', typeKeys: ['grass', 'poison'], accent: '#65a47b', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' }, { number: '004', name: 'Charmander', typeKeys: ['fire'], accent: '#e5764f', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png' }, { number: '007', name: 'Squirtle', typeKeys: ['water'], accent: '#5d98b4', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' }, { number: '025', name: 'Pikachu', typeKeys: ['electric'], accent: '#ddb431', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
]
const featuredItems = [
  { name: 'poke-ball', localizedName: 'Poké Ball', category: 'Objeto', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' }, { name: 'rare-candy', localizedName: 'Caramelo Raro', category: 'Objeto', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png' }, { name: 'leftovers', localizedName: 'Restos', category: 'Objeto', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leftovers.png' }, { name: 'master-ball', localizedName: 'Master Ball', category: 'Objeto', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png' },
]

function Home({ onSearch, onPokemonClick, onItemClick, onItemsClick, onPokedexClick, isLoading, t, locale, onLocaleChange }) {
  const categoryKeys = ['pokedex', 'competitive', 'learn', 'items', 'moves']
  return (
    <div className="page-shell">
      <Navbar t={t} locale={locale} onLocaleChange={onLocaleChange} onPokedexClick={onPokedexClick} activeNav="home" />
      <main>
        <Hero onSearch={onSearch} onPokemonClick={onPokemonClick} isLoading={isLoading} t={t} locale={locale} />
        <section className="content-section categories-section" id="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.categories.eyebrow}</p>
              <h2>{t.categories.title}<br /><em>{t.categories.accent}</em></h2>
            </div>
            <p className="section-intro">{t.categories.intro}</p>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => {
              const [title, description] = t.categories.items[categoryKeys[index]]
              const isItems = categoryKeys[index] === 'items'
              const isPokedex = categoryKeys[index] === 'pokedex'
              return (
                <CategoryCard
                  key={title}
                  {...category}
                  title={title}
                  description={description}
                  href={isItems ? '#items' : isPokedex ? '#pokedex' : '#featured'}
                  onClick={isItems ? onItemsClick : isPokedex ? onPokedexClick : undefined}
                />
              )
            })}
          </div>
        </section>
        <section className="content-section featured-section" id="featured">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">{t.featured.eyebrow}</p>
              <h2>{t.featured.title} <em>{t.featured.accent}</em></h2>
            </div>
            <a
              className="text-link"
              href="#pokedex"
              onClick={(e) => {
                if (onPokedexClick) {
                  e.preventDefault()
                  onPokedexClick()
                }
              }}
            >
              {t.featured.link} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="pokemon-grid">
            {featuredPokemon.map((pokemon) => (
              <PokemonCard key={pokemon.number} {...pokemon} type={pokemon.typeKeys.map((type) => t.types[type]).join(' · ')} />
            ))}
          </div>
        </section>
        <section className="content-section featured-section" id="items">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">{t.itemDetail.eyebrow}</p>
              <h2>{t.categories.items.items[0]}</h2>
            </div>
          </div>
          <div className="pokemon-grid">
            {featuredItems.map((item) => (
              <ItemCard key={item.name} {...item} category={t.itemDetail.eyebrow} onClick={() => onItemClick(item.name)} />
            ))}
          </div>
        </section>
      </main>
      <Footer t={t} />
    </div>
  )
}

export default Home