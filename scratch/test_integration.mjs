import { getItems, searchItemsCatalog, QUICK_ITEM_CATEGORIES } from '../src/services/pokeapi.js';

async function runIntegrationTests() {
  console.log('=== INICIANDO PRUEBAS DE INTEGRACIÓN DE OBJETOS ===\n');

  // 1. Probar categoría "evolution" (Piedras evolutivas)
  console.log('1. Probando filtro "evolution" (Piedras Evolutivas):');
  const evoResult = await getItems({ category: 'evolution', limit: 20, offset: 0, locale: 'es' });
  console.log('   Total de objetos en categoría:', evoResult.totalCount);
  console.log('   Objetos obtenidos en la página 1:', evoResult.items.length);
  const stones = evoResult.items.filter(i => (i.localizedName || '').toLowerCase().includes('piedra') || i.name.includes('stone'));
  console.log('   Piedras encontradas en página 1 (' + stones.length + '):');
  for (const s of stones) {
    console.log(`     - [${s.name}] ${s.localizedName} | Cat: ${s.category} | Sprite: ${s.image}`);
  }
  if (stones.length < 5) throw new Error('Se esperaban al menos 5 piedras evolutivas en los primeros resultados.');

  // 2. Probar todas las píldoras de filtrado rápido
  console.log('\n2. Probando todas las píldoras rápidas:');
  for (const [catKey, slugs] of Object.entries(QUICK_ITEM_CATEGORIES)) {
    const res = await getItems({ category: catKey, limit: 5, offset: 0, locale: 'es' });
    console.log(`   [${catKey}] -> Total: ${res.totalCount} | Primeros: ${res.items.map(i => i.localizedName).join(', ')}`);
    if (!res.items.length) throw new Error(`La categoría ${catKey} no devolvió ningún objeto.`);
  }

  // 3. Probar categorías específicas del menú desplegable
  console.log('\n3. Probando categorías específicas del desplegable:');
  const specificCategories = ['mega-stones', 'plates', 'choice', 'standard-balls', 'loot', 'healing'];
  for (const slug of specificCategories) {
    const res = await getItems({ category: slug, limit: 5, offset: 0, locale: 'es' });
    console.log(`   Dropdown [${slug}] -> Total: ${res.totalCount} | Primeros: ${res.items.map(i => i.localizedName).join(', ')}`);
    if (!res.items.length) throw new Error(`El desplegable ${slug} no devolvió objetos.`);
  }

  // 4. Probar búsqueda inteligente con "piedra"
  console.log('\n4. Probando búsqueda inteligente con "piedra":');
  const searchPiedra = await searchItemsCatalog('piedra', 'es');
  console.log('   Resultados para "piedra":', searchPiedra.totalCount);
  console.log('   Primeros resultados:', searchPiedra.items.slice(0, 6).map(i => i.localizedName).join(', '));
  if (!searchPiedra.items.length) throw new Error('La búsqueda de "piedra" no arrojó resultados.');

  // 5. Probar búsqueda de término compuesto "ultra ball" y "fuego"
  console.log('\n5. Probando búsquedas específicas "ultra ball" y "fuego":');
  const searchUltra = await searchItemsCatalog('ultra ball', 'es');
  console.log('   "ultra ball" ->', searchUltra.items.map(i => i.localizedName).join(', '));

  const searchFuego = await searchItemsCatalog('fuego', 'es');
  console.log('   "fuego" ->', searchFuego.items.map(i => i.localizedName).join(', '));

  console.log('\n=== TODAS LAS PRUEBAS PASARON SATISFACTORIAMENTE ===');
}

runIntegrationTests().catch(err => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
