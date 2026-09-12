import { getItems } from '../src/services/pokeapi.js';

async function testMega() {
  const result = await getItems({ category: 'mega-stones', limit: 20, offset: 0, locale: 'es' });
  console.log('Total mega stones:', result.totalCount);
  console.log('Sample items:', result.items.slice(0, 10).map(i => ({ name: i.name, loc: i.localizedName, img: i.image })));
}

testMega().catch(console.error);
