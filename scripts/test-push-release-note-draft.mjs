import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPushReleaseNoteDraft,
  evaluatePushChanges,
  isRelevantPushFile,
} from './lib/push-release-note-draft.mjs'

const sampleDraftInput = {
  repository: 'MrAbsoluty/MrAbsoluty.github.io',
  before: '1'.repeat(40),
  after: '2'.repeat(40),
  commits: [{ sha: '2'.repeat(40), message: 'feat: add guide page' }],
  changedFiles: ['src/pages/Guide.jsx'],
  generatedAt: '2026-10-10T00:00:00.000Z',
}

test('acepta cambios de producto en src y public', () => {
  assert.equal(isRelevantPushFile('src/pages/Guide.jsx'), true)
  assert.equal(isRelevantPushFile('public/images/guide.png'), true)
})

test('excluye documentación, automatización, pruebas, temporales y el catálogo', () => {
  const result = evaluatePushChanges([
    'docs/release-note-drafts.md',
    'scripts/generate-release-note-draft.mjs',
    '.github/workflows/release-note-push-draft.yml',
    'src/data/updates.js',
    'src/components/Component.test.jsx',
    'src/cache/temporary.json',
    'src/components/Component.jsx.tmp',
  ])
  assert.deepEqual(result, {
    eligible: false,
    reason: 'no-relevant-product-files',
    relevantFiles: [],
  })
})

test('deduplica y ordena rutas relevantes', () => {
  assert.deepEqual(evaluatePushChanges([
    'src/z.js',
    'src/a.js',
    'src/z.js',
    'docs/guide.md',
  ]).relevantFiles, ['src/a.js', 'src/z.js'])
})

test('genera un borrador bilingüe no aprobado sin inferir contenido', () => {
  const draft = createPushReleaseNoteDraft(sampleDraftInput)
  assert.equal(draft.draftStatus, 'incomplete-not-approved')
  assert.equal(draft.publicationStatus, 'not-published')
  assert.equal(draft.date, null)
  assert.equal(draft.editorialLabel, null)
  assert.equal(draft.editorialType, null)
  assert.match(draft.content.es.title, /Pendiente/)
  assert.match(draft.content.en.title, /required/)
  assert.deepEqual(draft.source.push.changedFiles, ['src/pages/Guide.jsx'])
  assert.equal(draft.source.push.commits[0].message, 'feat: add guide page')
})

test('rechaza borradores sin commit o archivos relevantes', () => {
  assert.throws(
    () => createPushReleaseNoteDraft({ ...sampleDraftInput, commits: [] }),
    /al menos un commit/,
  )
  assert.throws(
    () => createPushReleaseNoteDraft({ ...sampleDraftInput, changedFiles: ['docs/internal.md'] }),
    /No hay archivos relevantes/,
  )
})

test('conserva commits sin mensaje como evidencia para revisión manual', () => {
  const draft = createPushReleaseNoteDraft({
    ...sampleDraftInput,
    commits: [{ sha: '2'.repeat(40), message: '' }],
  })
  assert.equal(draft.source.push.commits[0].message, '')
  assert.ok(draft.editorialReviewRequired.length > 0)
})
