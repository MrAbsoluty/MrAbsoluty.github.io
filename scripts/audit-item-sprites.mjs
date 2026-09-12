import fs from 'fs';
import path from 'path';
import {
  getAllItemSlugs,
  getItemSprite,
  isExcludedItem,
  CUSTOM_ITEM_SPRITES
} from '../src/services/pokeapi.js';

function decodePngDimensions(buf) {
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  }
  return null;
}

async function checkUrlExists(url) {
  if (!url || url.startsWith('data:image/svg')) {
    return { exists: true, isSvg: true, width: 100, height: 100 };
  }
  if (url.startsWith('/items/')) {
    const fullPath = path.resolve('public' + url);
    if (fs.existsSync(fullPath)) {
      const buf = fs.readFileSync(fullPath);
      const dims = decodePngDimensions(buf);
      return { exists: true, width: dims?.width || 160, height: dims?.height || 160 };
    }
    return { exists: false };
  }
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.status === 200) {
      return { exists: true };
    }
    return { exists: false, status: res.status };
  } catch {
    return { exists: false };
  }
}

async function getUrlDimensions(url) {
  if (url.startsWith('/items/')) {
    const fullPath = path.resolve('public' + url);
    if (fs.existsSync(fullPath)) {
      const buf = fs.readFileSync(fullPath);
      return decodePngDimensions(buf);
    }
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return decodePngDimensions(buf);
  } catch {
    return null;
  }
}

async function auditCatalog() {
  console.log('====================================================');
  console.log('       POKEGUIDE ITEM SPRITE CATALOG AUDIT          ');
  console.log('====================================================');

  const allSlugs = await getAllItemSlugs();
  const validSlugs = allSlugs.filter((s) => !isExcludedItem(s));

  console.log(`Total Slugs en PokeGuide: ${allSlugs.length}`);
  console.log(`Total Slugs Válidos (sin stubs/dinamax): ${validSlugs.length}\n`);

  const summary = {
    total: validSlugs.length,
    hd_count: 0,
    canonical_count: 0,
    fallback_count: 0,
    by_source: {
      custom_local: 0,
      serebii_sv: 0,
      serebii_pgl: 0,
      serebii_base: 0,
      pokeapi: 0,
      placeholder: 0,
    },
    items: [],
    url_to_items: {},
  };

  const BATCH_SIZE = 50;
  let processed = 0;
  let lastLogged = 0;

  for (let i = 0; i < validSlugs.length; i += BATCH_SIZE) {
    const batch = validSlugs.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (name) => {
        const sprites = getItemSprite({ name });
        let chosenSource = null;
        let chosenUrl = null;
        let resolution = null;
        let isFallback = false;

        // Nivel 1: Local HD
        if (CUSTOM_ITEM_SPRITES[name]) {
          chosenSource = 'CUSTOM_LOCAL_HD';
          chosenUrl = sprites.primary;
          resolution = name === 'linking-cord' ? '128x128' : (name === 'town-map' ? '99x99' : '160x160');
        }

        // Nivel 2: Serebii SV (160x160 px)
        if (!chosenSource) {
          const svRes = await checkUrlExists(sprites.primary);
          if (svRes.exists) {
            chosenSource = 'SEREBII_SV_HD';
            chosenUrl = sprites.primary;
            resolution = '160x160';
          }
        }

        // Nivel 3: Serebii PGL (160x160 / 80x80 px)
        if (!chosenSource) {
          const pglRes = await checkUrlExists(sprites.fallback);
          if (pglRes.exists) {
            chosenSource = 'SEREBII_PGL_HD';
            chosenUrl = sprites.fallback;
            resolution = '160x160/80x80';
          }
        }

        // Nivel 4: Serebii Base (sprite canónico específico)
        if (!chosenSource) {
          const baseRes = await checkUrlExists(sprites.defaultImage);
          if (baseRes.exists) {
            chosenSource = 'SEREBII_BASE_CANONICAL';
            chosenUrl = sprites.defaultImage;
            resolution = '24x24/40x40';
          }
        }

        // Nivel 5: PokéAPI Raw Sprite
        if (!chosenSource) {
          const pokeRes = await checkUrlExists(sprites.quaternary);
          if (pokeRes.exists) {
            chosenSource = 'POKEAPI_CANONICAL';
            chosenUrl = sprites.quaternary;
            resolution = '32x32';
          }
        }

        // Nivel 6: Fallback a Placeholder SVG
        if (!chosenSource) {
          chosenSource = 'FALLBACK_PLACEHOLDER';
          chosenUrl = sprites.placeholder;
          resolution = 'vector (SVG)';
          isFallback = true;
        }

        // Contadores
        if (chosenSource.includes('HD')) {
          summary.hd_count++;
        } else if (chosenSource.includes('CANONICAL')) {
          summary.canonical_count++;
        } else {
          summary.fallback_count++;
        }

        if (chosenSource === 'CUSTOM_LOCAL_HD') summary.by_source.custom_local++;
        else if (chosenSource === 'SEREBII_SV_HD') summary.by_source.serebii_sv++;
        else if (chosenSource === 'SEREBII_PGL_HD') summary.by_source.serebii_pgl++;
        else if (chosenSource === 'SEREBII_BASE_CANONICAL') summary.by_source.serebii_base++;
        else if (chosenSource === 'POKEAPI_CANONICAL') summary.by_source.pokeapi++;
        else summary.by_source.placeholder++;

        // Duplicate tracking
        if (!isFallback && chosenUrl) {
          if (!summary.url_to_items[chosenUrl]) {
            summary.url_to_items[chosenUrl] = [];
          }
          summary.url_to_items[chosenUrl].push(name);
        }

        summary.items.push({
          name,
          source: chosenSource,
          url: chosenUrl,
          resolution,
          isFallback,
        });
      })
    );

    processed += batch.length;
    if (processed - lastLogged >= 200 || processed >= validSlugs.length) {
      console.log(`Progreso: ${Math.min(processed, validSlugs.length)}/${validSlugs.length} objetos auditados...`);
      lastLogged = processed;
    }
  }

  // Detect duplicates
  const suspiciousDuplicates = [];
  for (const [url, items] of Object.entries(summary.url_to_items)) {
    if (items.length > 3) {
      suspiciousDuplicates.push({ url, count: items.length, items });
    }
  }

  console.log('\n====================================================');
  console.log('                RESUMEN DE AUDITORÍA                ');
  console.log('====================================================');
  console.log(`TOTAL OBJETOS AUDITADOS: ${summary.total}`);
  console.log(`1. Sprites HD (≥ 80x80 px, 160x160 nativos): ${summary.hd_count} (${((summary.hd_count / summary.total) * 100).toFixed(1)}%)`);
  console.log(`   - Serebii SV (160x160): ${summary.by_source.serebii_sv}`);
  console.log(`   - Serebii PGL (160x160/80x80): ${summary.by_source.serebii_pgl}`);
  console.log(`   - Assets Locales HD: ${summary.by_source.custom_local}`);
  console.log(`2. Sprites Canónicos Específicos: ${summary.canonical_count} (${((summary.canonical_count / summary.total) * 100).toFixed(1)}%)`);
  console.log(`   - Serebii Base: ${summary.by_source.serebii_base}`);
  console.log(`   - PokéAPI Sprites: ${summary.by_source.pokeapi}`);
  console.log(`3. Fallback a Placeholder SVG (genérica): ${summary.fallback_count} (${((summary.fallback_count / summary.total) * 100).toFixed(1)}%)`);

  if (summary.fallback_count > 0) {
    const fallbackItems = summary.items.filter((i) => i.isFallback).map((i) => i.name);
    console.log(`\nObjetos que cayeron en fallback (${fallbackItems.length}):`, fallbackItems);
  } else {
    console.log('\n¡ÉXITO TOTAL: 0 OBJETOS CAYERON EN EL PLACEHOLDER GENÉRICO!');
  }

  if (suspiciousDuplicates.length > 0) {
    console.log(`\nDuplicaciones detectadas (> 3 objetos comparten URL): ${suspiciousDuplicates.length}`);
    for (const d of suspiciousDuplicates.slice(0, 10)) {
      console.log(`  - ${d.count} objetos -> ${d.url} (${d.items.slice(0, 5).join(', ')}...)`);
    }
  } else {
    console.log('\nNo se detectaron duplicaciones anómalas en el catálogo.');
  }

  // Comprobar ítems de prueba clave
  console.log('\n--- VERIFICACIÓN DE OBJETOS CLAVE Y EJEMPLOS ---');
  const testKeys = [
    'grass-mail', 'flame-mail', 'bubble-mail', 'wood-mail',
    'master-ball', 'poke-ball', 'leftovers', 'choice-band',
    'heavy-duty-boots', 'kings-rock', 'exp-share', 'exp-candy-s',
    'exp-candy-xl', 'linking-cord', 'black-augurite', 'peat-block',
    'miraidons-poke-ball', 'koraidons-poke-ball', 'kofus-wallet'
  ];
  for (const k of testKeys) {
    const itemInfo = summary.items.find((i) => i.name === k);
    console.log(`[ItemAudit] ${k} -> source: ${itemInfo?.source}, res: ${itemInfo?.resolution}, url: ${itemInfo?.url}`);
  }

  // Guardar archivo JSON con el reporte detallado
  const reportPath = path.resolve('scratch/item_sprite_audit_report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`\nReporte completo guardado en: ${reportPath}`);

  return summary;
}

auditCatalog();
