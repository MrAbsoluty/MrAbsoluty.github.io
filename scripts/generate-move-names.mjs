/**
 * generate-move-names.mjs
 * Descarga los nombres canónicos en inglés y español de todos los movimientos
 * de PokéAPI y genera src/data/moveCatalogNames.js para búsqueda instantánea bidireccional.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, ' ')
}

function formatName(name = '') {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

async function run() {
  console.log('Obteniendo lista de todos los movimientos de PokéAPI...')
  const listRes = await fetch('https://pokeapi.co/api/v2/move?limit=1000')
  const listData = await listRes.json()
  const moves = listData.results
  console.log(`Total de movimientos a indexar: ${moves.length}`)

  const catalog = {}
  const BATCH_SIZE = 50

  for (let i = 0; i < moves.length; i += BATCH_SIZE) {
    const batch = moves.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (m) => {
        const res = await fetch(m.url)
        if (!res.ok) return { slug: m.name, en: formatName(m.name), es: formatName(m.name) }
        const data = await res.json()
        const esName = data.names?.find(n => n.language?.name === 'es')?.name
        const enName = data.names?.find(n => n.language?.name === 'en')?.name || formatName(m.name)
        return {
          slug: m.name,
          en: enName,
          es: esName || enName,
        }
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const item = r.value
        catalog[item.slug] = {
          en: item.en,
          es: item.es,
        }
      }
    }
    console.log(`Indexados ${Math.min(i + BATCH_SIZE, moves.length)}/${moves.length} movimientos...`)
  }

  const outPath = path.join(__dirname, '../src/data/moveCatalogNames.js')
  const fileContent = `/**
 * moveCatalogNames.js
 * Catálogo completo de nombres de movimientos en inglés y español para búsqueda instantánea,
 * insensible a mayúsculas, minúsculas, acentos y coincidencias parciales.
 * Auto-generado para PokéGuide Move Dex.
 */

export const MOVE_CATALOG_NAMES = ${JSON.stringify(catalog, null, 2)}
`

  fs.writeFileSync(outPath, fileContent, 'utf-8')
  console.log(`Catálogo generado exitosamente en ${outPath}`)
  console.log(`Total entradas guardadas: ${Object.keys(catalog).length}`)
}

run().catch(console.error)
