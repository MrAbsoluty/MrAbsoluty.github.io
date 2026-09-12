import { searchItemsCatalog } from '../src/services/pokeapi.js';

async function test() {
  console.log('Testing search "piedra":');
  const piedras = await searchItemsCatalog('piedra', 'es');
  console.log('Piedras found:', piedras.totalCount, piedras.items.slice(0, 8).map(i => i.localizedName));

  console.log('Testing search "fuego":');
  const fuego = await searchItemsCatalog('fuego', 'es');
  console.log('Fuego found:', fuego.totalCount, fuego.items.slice(0, 8).map(i => i.localizedName));

  console.log('Testing search "bayas":');
  const bayas = await searchItemsCatalog('bayas', 'es');
  console.log('Bayas found:', bayas.totalCount, bayas.items.slice(0, 8).map(i => i.localizedName));
}

test().catch(console.error);

