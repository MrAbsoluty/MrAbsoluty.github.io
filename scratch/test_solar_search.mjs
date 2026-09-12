import { searchItemsCatalog, getItems, KNOWN_STUB_ITEMS } from '../src/services/pokeapi.js';

async function verifyAll() {
  console.log('=== VERIFICANDO BUSCADOR Y OBJETOS STUB ===\n');

  // 1. Probar búsqueda de "Solar"
  console.log('1. Búsqueda de "Solar":');
  const resSolar = await searchItemsCatalog('Solar', 'es');
  console.log('   Total encontrados:', resSolar.totalCount);
  console.log('   Objetos:', resSolar.items.map(i => `${i.localizedName} (${i.name})`));
  const hasPiedraSolar = resSolar.items.some(i => i.name === 'sun-stone' && i.localizedName === 'Piedra Solar');
  if (!hasPiedraSolar) throw new Error('No se encontró Piedra Solar al buscar "Solar".');
  console.log('   ✅ "Solar" encuentra Piedra Solar correctamente.');

  // 2. Probar búsqueda de "Piedra Solar"
  console.log('\n2. Búsqueda de "Piedra Solar":');
  const resPiedraSolar = await searchItemsCatalog('Piedra Solar', 'es');
  console.log('   Objetos:', resPiedraSolar.items.map(i => `${i.localizedName} (${i.name})`));
  if (!resPiedraSolar.items.some(i => i.name === 'sun-stone')) throw new Error('No se encontró Piedra Solar.');
  console.log('   ✅ "Piedra Solar" encuentra Piedra Solar correctamente.');

  // 3. Probar categoría Megapiedras (sin objetos stub/falsos)
  console.log('\n3. Categoría "mega-stones":');
  const resMegas = await getItems({ category: 'mega-stones', limit: 100, offset: 0, locale: 'es' });
  console.log('   Total de megapiedras válidas:', resMegas.totalCount);
  console.log('   Primeras 8:', resMegas.items.slice(0, 8).map(i => `${i.localizedName} [${i.image}]`));

  // Verificar que ninguno de los stubs esté presente
  const foundStubs = resMegas.items.filter(i => KNOWN_STUB_ITEMS.has(i.name));
  if (foundStubs.length > 0) {
    throw new Error(`Se encontraron ${foundStubs.length} stubs en mega-stones: ${foundStubs.map(i => i.name).join(', ')}`);
  }
  console.log('   ✅ 0 objetos stub/falsos en Megapiedras. Todos los objetos tienen nombres y sprites oficiales.');

  // 4. Probar categoría Evolución
  console.log('\n4. Categoría "evolution":');
  const resEvo = await getItems({ category: 'evolution', limit: 10, offset: 0, locale: 'es' });
  console.log('   Primeras en Evolución:', resEvo.items.map(i => i.localizedName));
  const stones = resEvo.items.filter(i => i.localizedName.includes('Piedra'));
  console.log(`   Piedras en página 1: ${stones.length}`);
  if (stones.length < 5) throw new Error('Se esperaban las piedras evolutivas en los primeros resultados.');

  console.log('\n=== TODAS LAS PRUEBAS PASARON CON ÉXITO ===');
}

verifyAll().catch(e => {
  console.error('\n❌ ERROR:', e);
  process.exit(1);
});
