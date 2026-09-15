/**
 * audit-move-quality.mjs
 * Script de auditoría profunda de calidad factual, numérica y mecánica
 * para las traducciones de movimientos en PokeGuide (Fase 1.1.1).
 */

import { getMove } from '../src/services/pokeapi.js'
import { getMoveLocalizedText, VERIFIED_MOVE_EFFECTS_ES } from '../src/data/moveTranslations.js'

// Muestra amplia de 80 movimientos cubriendo todas las categorías y arquetipos mecánicos
const MOVES_SAMPLE = [
  // Básicos / Normales sin efecto
  'pound', 'scratch', 'tackle', 'cut', 'swift',
  // Golpes críticos
  'karate-chop', 'slash', 'razor-leaf', 'cross-chop', 'stone-edge', 'night-slash',
  // Multi-hit
  'double-slap', 'comet-punch', 'fury-swipes', 'bullet-seed', 'icicle-spear', 'rock-blast', 'double-kick', 'bonemerang',
  // Recoil
  'take-down', 'double-edge', 'submission', 'brave-bird', 'flare-blitz', 'wood-hammer', 'head-smash', 'struggle',
  // Recarga / Carga
  'hyper-beam', 'giga-impact', 'frenzy-plant', 'solar-beam', 'skull-bash', 'sky-attack', 'freeze-shock',
  // Aumentos de estadística del usuario (1 stat)
  'swords-dance', 'agility', 'iron-defense', 'nasty-plot', 'amnesia', 'rock-polish', 'acid-armor', 'barrier',
  // Aumentos multi-stat del usuario
  'calm-mind', 'dragon-dance', 'bulk-up', 'shell-smash', 'quiver-dance', 'shift-gear', 'coil', 'growth',
  // Reducciones de estadística del objetivo (1 stat)
  'growl', 'tail-whip', 'screech', 'sweet-scent', 'charm', 'fake-tears', 'metal-sound', 'feather-dance',
  // Reducciones auto-infligidas tras daño (self-drop)
  'close-combat', 'draco-meteor', 'overheat', 'leaf-storm', 'superpower', 'v-create', 'hammer-arm', 'fleur-cannon',
  // Efectos secundarios de estado con % (burn, freeze, para, poison, flinch, confuse)
  'flamethrower', 'fire-blast', 'scald', 'ice-beam', 'blizzard', 'thunderbolt', 'thunder', 'discharge',
  'sludge-bomb', 'poison-jab', 'water-pulse', 'dynamic-punch', 'bite', 'iron-head', 'rock-slide', 'air-slash',
  'shadow-ball', 'psychic', 'earth-power', 'bug-buzz', 'crunch', 'focus-blast', 'moonblast',
  // Estados directos (100% status)
  'toxic', 'thunder-wave', 'will-o-wisp', 'spore', 'sleep-powder', 'hypnosis', 'confuse-ray', 'supersonic',
  // Recuperación / Drenaje
  'recover', 'roost', 'soft-boiled', 'slack-off', 'giga-drain', 'drain-punch', 'leech-life', 'absorb',
  // Pivote / Cambio
  'u-turn', 'volt-switch', 'flip-turn', 'parting-shot', 'baton-pass', 'teleport', 'whirlwind', 'roar',
  // Campo / Clima / Trampas
  'stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web', 'defog', 'rapid-spin', 'rain-dance', 'sunny-day', 'sandstorm', 'snowscape',
  // Protección y utilidad
  'protect', 'detect', 'substitute', 'taunt', 'encore', 'disable', 'knock-off', 'trick', 'haze', 'clear-smog'
]

async function auditSample() {
  console.log(`Iniciando auditoría sobre muestra de ${MOVES_SAMPLE.length} movimientos...\n`)

  const issues = []
  let analyzed = 0

  for (const slug of MOVES_SAMPLE) {
    try {
      const enMove = await getMove(slug, 'en')
      const esMove = await getMove(slug, 'es')
      const es419Move = await getMove(slug, 'es-419')
      analyzed++

      const enText = (enMove.effect || '').trim()
      const esText = (esMove.effect || '').trim()
      const esFull = (esMove.fullEffect || '').trim()

      // 1. Verificación de fuga de inglés en español
      // Excluir nombres propios o términos idénticos
      const englishTokens = [
        'inflicts regular damage', 'chance to', 'lowers the', 'raises the',
        'turns in recoil', 'damage inflicted', 'switches out', 'critical hit',
        'stage', 'stages', 'user receives', 'in recoil', 'must recharge',
        'charges for one turn', 'never misses', 'puts the target', 'paralyzes the target'
      ]
      for (const token of englishTokens) {
        if (esText.toLowerCase().includes(token)) {
          issues.push({
            id: `LEAK-${slug}`,
            severity: 'P0',
            slug,
            locale: 'es',
            problem: `Fuga de texto en inglés detectada: "${token}"`,
            detail: `es.effect = "${esText}" | en.effect = "${enText}"`
          })
        }
      }

      // 2. Verificación de preservación de porcentajes (ej. 10%, 20%, 30%, 50%, 100%)
      const enPercentages = enText.match(/\b\d+%/g) || []
      const esPercentages = esText.match(/\b\d+%/g) || []
      for (const pct of enPercentages) {
        if (!esPercentages.includes(pct) && !esText.includes(pct)) {
          // Revisar si el porcentaje está en fullEffect o si se perdió totalmente
          const inFull = esFull.includes(pct)
          issues.push({
            id: `NUM-PCT-${slug}`,
            severity: inFull ? 'P2' : 'P1',
            slug,
            locale: 'es',
            problem: `Porcentaje ${pct} presente en inglés pero ausente en efecto español`,
            detail: `en: "${enText}" -> es: "${esText}" (in fullEffect: ${inFull})`
          })
        }
      }

      // 3. Verificación de fracciones de recoil / curación (1/2, 1/3, 1/4)
      const enFractions = enText.match(/\b1\/[234]\b/g) || []
      for (const frac of enFractions) {
        const fractionWords = {
          '1/2': ['mitad', '1/2', '50%'],
          '1/3': ['tercio', '1/3'],
          '1/4': ['cuarto', '1/4', '25%']
        }
        const acceptable = fractionWords[frac] || [frac]
        const hasFrac = acceptable.some(w => esText.toLowerCase().includes(w) || esFull.toLowerCase().includes(w))
        if (!hasFrac) {
          issues.push({
            id: `NUM-FRAC-${slug}`,
            severity: 'P1',
            slug,
            locale: 'es',
            problem: `Fracción ${frac} presente en inglés pero ausente en español`,
            detail: `en: "${enText}" -> es: "${esText}"`
          })
        }
      }

      // 4. Verificación de multi-hit (ej. "2-5", "2 to 5", "twice")
      if (enText.match(/2-5|2 to 5/i)) {
        if (!esText.match(/2\s*(?:a|–|-)\s*5/i) && !esFull.match(/2\s*(?:a|–|-)\s*5/i)) {
          issues.push({
            id: `MULTIHIT-${slug}`,
            severity: 'P1',
            slug,
            locale: 'es',
            problem: 'Rango multi-hit 2-5 no preservado en español',
            detail: `en: "${enText}" -> es: "${esText}"`
          })
        }
      }
      if (enText.match(/hits twice/i)) {
        if (!esText.toLowerCase().includes('dos veces') && !esFull.toLowerCase().includes('dos veces')) {
          issues.push({
            id: `MULTIHIT-TWICE-${slug}`,
            severity: 'P1',
            slug,
            locale: 'es',
            problem: 'Multi-hit "twice" no preservado en español',
            detail: `en: "${enText}" -> es: "${esText}"`
          })
        }
      }

      // 5. Verificación de objetivos (Target vs User)
      if (enText.includes("user's") || enText.includes('the user')) {
        // Asegurar que no diga "del objetivo" cuando el original es del usuario
        if (enText.match(/lowers the user's|raises the user's/i) && esText.match(/del objetivo/i)) {
          issues.push({
            id: `TARGET-SWAP-${slug}`,
            severity: 'P0',
            slug,
            locale: 'es',
            problem: 'Efecto invertido: el original afecta al usuario pero la traducción dice "del objetivo"',
            detail: `en: "${enText}" -> es: "${esText}"`
          })
        }
      }
      if (enText.includes("target's") || enText.includes('the target')) {
        if (enText.match(/lowers the target's|raises the target's/i) && esText.match(/del usuario/i)) {
          issues.push({
            id: `TARGET-SWAP-${slug}`,
            severity: 'P0',
            slug,
            locale: 'es',
            problem: 'Efecto invertido: el original afecta al objetivo pero la traducción dice "del usuario"',
            detail: `en: "${enText}" -> es: "${esText}"`
          })
        }
      }

      // 6. Verificación de coherencia entre effect y fullEffect
      if (esText && esFull) {
        // Si effect habla de quemar pero fullEffect habla de congelar
        const ailments = [
          { en: 'burn', es: 'quemar' },
          { en: 'freeze', es: 'congelar' },
          { en: 'paralyze', es: 'paralizar' },
          { en: 'poison', es: 'envenenar' },
          { en: 'sleep', es: 'dormir' },
          { en: 'flinch', es: 'retroceder' },
        ]
        for (const a1 of ailments) {
          if (esText.includes(a1.es)) {
            for (const a2 of ailments) {
              if (a1 !== a2 && esFull.includes(a2.es) && !esText.includes(a2.es) && !enText.includes(a2.en)) {
                issues.push({
                  id: `CONTRADICTION-${slug}`,
                  severity: 'P0',
                  slug,
                  locale: 'es',
                  problem: `Contradicción entre effect (${a1.es}) y fullEffect (${a2.es})`,
                  detail: `effect: "${esText}" vs fullEffect: "${esFull}"`
                })
              }
            }
          }
        }
      }

      // 7. Verificación de paridad es-419 vs es
      if (esMove.effect !== es419Move.effect) {
        issues.push({
          id: `PARITY-ES419-${slug}`,
          severity: 'P2',
          slug,
          locale: 'es-419',
          problem: 'Discrepancia entre es y es-419',
          detail: `es: "${esMove.effect}" vs es-419: "${es419Move.effect}"`
        })
      }

      // 8. Verificación de no alteración de inglés
      if (enMove.effect.includes('Inflige daño normal') || enMove.effect.includes('probabilidad')) {
        issues.push({
          id: `EN-ALTERED-${slug}`,
          severity: 'P0',
          slug,
          locale: 'en',
          problem: 'Efecto en inglés fue contaminado con traducción al español',
          detail: `en: "${enMove.effect}"`
        })
      }

    } catch (err) {
      issues.push({
        id: `ERROR-${slug}`,
        severity: 'P1',
        slug,
        locale: 'es',
        problem: `Excepción al auditar movimiento: ${err.message}`,
        detail: err.stack
      })
    }
  }

  console.log(`\n==================================================`)
  console.log(`AUDITORÍA COMPLETADA: ${analyzed}/${MOVES_SAMPLE.length} analizados`)
  console.log(`PROBLEMAS DETECTADOS: ${issues.length}`)
  console.log(`==================================================\n`)

  for (const issue of issues) {
    console.log(`[${issue.severity}] ${issue.id} (${issue.slug})`)
    console.log(`  Problema: ${issue.problem}`)
    console.log(`  Detalle:  ${issue.detail}\n`)
  }

  return { analyzed, issues }
}

auditSample().catch(console.error)
