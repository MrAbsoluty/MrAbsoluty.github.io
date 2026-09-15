/**
 * audit-all-short-effects.mjs
 * Descarga y audita las descripciones y short_effects de todos los movimientos
 * de PokéAPI para encontrar variaciones de patrones y posibles desajustes mecánicos.
 */

import { getMoveLocalizedText, VERIFIED_MOVE_EFFECTS_ES } from '../src/data/moveTranslations.js'

async function runGlobalPatternAudit() {
  console.log('Descargando lista completa de movimientos de PokéAPI...')
  const listRes = await fetch('https://pokeapi.co/api/v2/move?limit=1000')
  const listData = await listRes.json()
  const moves = listData.results // ~920 movimientos

  console.log(`Total movimientos encontrados: ${moves.length}. Obteniendo datos en lotes...`)

  const BATCH_SIZE = 40
  const allShortEffects = new Map() // shortEffectText -> [slugs]
  const patternFailures = []
  const numberLosses = []
  const potentialFalsePositives = []

  for (let i = 0; i < moves.length; i += BATCH_SIZE) {
    const batch = moves.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(async (m) => {
        const res = await fetch(m.url)
        if (!res.ok) return null
        return await res.json()
      })
    )

    for (const r of batchResults) {
      if (r.status !== 'fulfilled' || !r.value) continue
      const data = r.value
      const slug = data.name

      const enEntry = data.effect_entries?.find(e => e?.language?.name === 'en')
      const esEntry = data.effect_entries?.find(e => e?.language?.name === 'es')
      const enShort = (enEntry?.short_effect || '').replace(/\$effect_chance%?/g, `${data.effect_chance || 0}%`).trim()
      const esShort = (esEntry?.short_effect || '').trim()

      const esFlavor = data.flavor_text_entries?.find(f => f?.language?.name === 'es')?.flavor_text || ''

      if (!enShort) continue

      if (!allShortEffects.has(enShort)) {
        allShortEffects.set(enShort, [])
      }
      allShortEffects.get(enShort).push(slug)

      // Ejecutar getMoveLocalizedText para evaluar la traducción resultante
      const localized = getMoveLocalizedText({
        moveId: data.id,
        moveSlug: slug,
        locale: 'es',
        rawDescription: esFlavor,
        rawEffect: esShort || enShort,
        rawFullEffect: enEntry?.effect || '',
        isEffectSpanish: Boolean(esShort),
        isDescriptionSpanish: Boolean(esFlavor),
      })

      // 1. Verificar si el original inglés tiene números importantes que se pierden
      const enNumbers = enShort.match(/\b\d+%\b|\b1\/[234]\b|\b\d+ to \d+\b|\b2-5\b/g) || []
      for (const num of enNumbers) {
        if (!localized.effect.includes(num) && !localized.fullEffect.includes(num)) {
          // Si es una fracción expresada en texto ("la mitad", "un tercio", "un cuarto", "25%")
          const fracMap = {
            '1/2': ['mitad', '1/2', '50%'],
            '1/3': ['tercio', '1/3'],
            '1/4': ['cuarto', '1/4', '25%'],
          }
          const alternatives = fracMap[num] || []
          const hasAlternative = alternatives.some(alt => localized.effect.toLowerCase().includes(alt) || localized.fullEffect.toLowerCase().includes(alt))

          if (!hasAlternative) {
            numberLosses.push({
              slug,
              num,
              enShort,
              translatedEffect: localized.effect,
              source: VERIFIED_MOVE_EFFECTS_ES[slug] ? 'verified' : (esShort ? 'pokeapi-es' : 'pattern/fallback')
            })
          }
        }
      }

      // 2. Verificar posibles fugas de inglés
      const enKeywords = ['inflicts', 'chance to', 'lowers the', 'raises the', 'recoil', 'stages']
      for (const kw of enKeywords) {
        if (localized.effect.toLowerCase().includes(kw)) {
          patternFailures.push({
            slug,
            issue: `Fuga de inglés (${kw})`,
            translated: localized.effect,
            en: enShort
          })
        }
      }
    }

    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= moves.length) {
      console.log(`Procesados ${Math.min(i + BATCH_SIZE, moves.length)}/${moves.length} movimientos...`)
    }
  }

  console.log('\n==================================================')
  console.log(`ANÁLISIS GLOBAL COMPLETADO`)
  console.log(`Plantillas únicas de short_effect en inglés: ${allShortEffects.size}`)
  console.log(`Fugas de inglés detectadas: ${patternFailures.length}`)
  console.log(`Pérdidas numéricas/fraccionarias detectadas: ${numberLosses.length}`)
  console.log('==================================================\n')

  if (patternFailures.length > 0) {
    console.log('--- FUGAS DE INGLÉS ---')
    for (const f of patternFailures) {
      console.log(`[${f.slug}] ${f.issue} -> "${f.translated}" (EN: "${f.en}")`)
    }
  }

  if (numberLosses.length > 0) {
    console.log('--- PÉRDIDAS NUMÉRICAS / MECÁNICAS ---')
    // Agrupar por patrón para ver qué plantillas de PokéAPI no están siendo capturadas
    const grouped = new Map()
    for (const l of numberLosses) {
      if (!grouped.has(l.enShort)) grouped.set(l.enShort, [])
      grouped.get(l.enShort).push(l.slug)
    }

    for (const [template, slugs] of grouped.entries()) {
      console.log(`\nPlantilla EN: "${template}"`)
      console.log(`Afecta a (${slugs.length} movimientos): ${slugs.slice(0, 5).join(', ')}${slugs.length > 5 ? '...' : ''}`)
    }
  }
}

runGlobalPatternAudit().catch(console.error)
