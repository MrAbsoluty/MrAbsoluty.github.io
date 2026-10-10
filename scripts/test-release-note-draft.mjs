import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test, { after } from 'node:test'
import {
  createReleaseNoteDraft,
  evaluatePullRequestEvent,
  validateReleaseNoteDraft,
} from './lib/release-note-draft.mjs'

const repository = 'MrAbsoluty/MrAbsoluty.github.io'
const temporaryDirectories = []

after(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })))
})

function makePullRequest(overrides = {}) {
  const number = overrides.number ?? 42
  return {
    number,
    html_url: `https://github.com/${repository}/pull/${number}`,
    title: 'Añade mejoras a la guía',
    body: 'Se actualiza la guía.\n\nIncluye cambios visibles.',
    state: 'open',
    merged: false,
    merged_at: null,
    base: {
      ref: 'main',
      repo: { full_name: repository },
    },
    labels: [{ name: 'release-note:feature' }],
    ...overrides,
  }
}

function evaluate(pullRequest, action = 'opened', repo = repository) {
  return evaluatePullRequestEvent({
    eventName: 'pull_request',
    action,
    repository: repo,
    pullRequest,
  })
}

test('PR con una etiqueta de inclusión válida genera un borrador incompleto', () => {
  const pr = makePullRequest()
  const eligibility = evaluate(pr)
  const draft = createReleaseNoteDraft(pr, eligibility, '2026-10-09T12:00:00.000Z')

  assert.equal(eligibility.eligible, true)
  assert.equal(draft.id, 'pr-42')
  assert.equal(draft.draftStatus, 'incomplete-not-approved')
  assert.equal(draft.publicationStatus, 'not-published')
  assert.deepEqual(validateReleaseNoteDraft(draft), [])
})

test('PR sin etiqueta editorial no genera borrador', () => {
  const result = evaluate(makePullRequest({ labels: [] }))
  assert.deepEqual(result, { eligible: false, reason: 'missing-inclusion-label' })
})

test('etiquetas de inclusión incompatibles impiden generar el borrador', () => {
  const result = evaluate(makePullRequest({
    labels: [
      { name: 'release-note:feature' },
      { name: 'release-note:fix' },
    ],
  }))
  assert.deepEqual(result, { eligible: false, reason: 'conflicting-inclusion-labels' })
})

test('release-note:skip excluye incluso si también hay etiqueta de inclusión', () => {
  const result = evaluate(makePullRequest({
    labels: [
      { name: 'release-note:feature' },
      { name: 'release-note:skip' },
    ],
  }))
  assert.deepEqual(result, { eligible: false, reason: 'release-note-skip' })
})

test('un PR cerrado sin fusionar se ignora', () => {
  const result = evaluate(makePullRequest({ state: 'closed', merged: false }))
  assert.deepEqual(result, { eligible: false, reason: 'closed-without-merge' })
})

test('un PR fusionado con etiqueta válida puede generar borrador', () => {
  const pr = makePullRequest({
    state: 'closed',
    merged: true,
    merged_at: '2026-10-09T10:00:00Z',
  })
  const result = evaluate(pr, 'closed')
  assert.equal(result.eligible, true)
  assert.equal(result.status, 'merged-awaiting-editorial-review')
})

test('un PR dirigido a otra rama no genera borrador', () => {
  const pr = makePullRequest({ base: { ref: 'develop', repo: { full_name: repository } } })
  const result = evaluate(pr)
  assert.deepEqual(result, { eligible: false, reason: 'target-branch-not-main' })
})

test('título ausente se rechaza y la descripción ambigua deja textos editoriales pendientes', () => {
  const invalidTitle = makePullRequest({ title: '  ' })
  assert.throws(() => createReleaseNoteDraft(invalidTitle, evaluate(invalidTitle)), /title/)

  const ambiguous = makePullRequest({ title: 'Cambios varios', body: '' })
  const draft = createReleaseNoteDraft(ambiguous, evaluate(ambiguous))
  assert.match(draft.content.es.title, /Pendiente/)
  assert.match(draft.content.en.title, /required/)
  assert.equal(draft.source.pullRequest.description, '')
  assert.ok(draft.editorialReviewRequired.length > 0)
})

test('reprocesar el mismo PR conserva el ID y refleja los metadatos actualizados', () => {
  const original = makePullRequest()
  const changed = makePullRequest({ title: 'Título actualizado', body: 'Descripción revisada' })
  const first = createReleaseNoteDraft(original, evaluate(original), '2026-10-09T12:00:00Z')
  const second = createReleaseNoteDraft(changed, evaluate(changed), '2026-10-09T12:05:00Z')

  assert.equal(first.id, second.id)
  assert.equal(second.source.pullRequest.title, 'Título actualizado')
  assert.equal(second.source.pullRequest.description, 'Descripción revisada')
})

test('acentos y saltos de línea se conservan en el JSON del borrador', () => {
  const pr = makePullRequest({
    title: 'Corrección: evolución y Pokémon',
    body: 'Primera línea.\nSegunda línea con ñ y acentos: acción.',
  })
  const draft = createReleaseNoteDraft(pr, evaluate(pr))
  const roundTrip = JSON.parse(JSON.stringify(draft))

  assert.equal(roundTrip.source.pullRequest.title, pr.title)
  assert.equal(roundTrip.source.pullRequest.description, pr.body)
  assert.deepEqual(validateReleaseNoteDraft(roundTrip), [])
})

test('los textos editoriales y de validación en español conservan sus acentos', () => {
  const pr = makePullRequest({ labels: [{ name: 'release-note:fix' }] })
  const draft = createReleaseNoteDraft(pr, evaluate(pr))
  const generatedSpanishText = JSON.stringify({
    content: draft.content.es,
    editorialReviewRequired: draft.editorialReviewRequired,
  })

  assert.equal(draft.content.es.category, 'Corrección')
  for (const expectedText of ['redacción', 'español', 'únicamente', 'categoría', 'clasificación', 'público']) {
    assert.ok(generatedSpanishText.includes(expectedText), `Falta el texto acentuado: ${expectedText}`)
  }
  assert.doesNotMatch(generatedSpanishText, /Ã[óñá]/)

  const invalidTitle = makePullRequest({ title: '  ' })
  assert.throws(
    () => createReleaseNoteDraft(invalidTitle, evaluate(invalidTitle)),
    (error) => {
      assert.match(error.message, /válido/)
      assert.doesNotMatch(error.message, /Ã[óñá]/)
      return true
    },
  )
})

test('evento o repositorio inesperado falla de forma segura', () => {
  assert.throws(
    () => evaluatePullRequestEvent({
      eventName: 'push',
      action: 'opened',
      repository,
      pullRequest: makePullRequest(),
    }),
    /Evento no admitido/,
  )
  assert.throws(() => evaluate(makePullRequest(), 'opened', 'otro/repositorio'), /Repositorio inesperado/)
})

test('el validador rechaza borradores sin estructura bilingüe válida', () => {
  const pr = makePullRequest()
  const draft = createReleaseNoteDraft(pr, evaluate(pr))
  const invalid = { ...draft, content: { es: draft.content.es, en: null } }
  assert.ok(validateReleaseNoteDraft(invalid).some((error) => error.includes('content.en')))

  const invalidCategory = {
    ...draft,
    content: { ...draft.content, en: { ...draft.content.en, category: 'Other' } },
  }
  assert.ok(validateReleaseNoteDraft(invalidCategory).some((error) => error.includes('category')))
})

test('la etiqueta de mantenimiento genera borrador, pero requiere validar relevancia pública', () => {
  const pr = makePullRequest({ labels: [{ name: 'release-note:maintenance' }] })
  const draft = createReleaseNoteDraft(pr, evaluate(pr))
  assert.equal(draft.content.es.category, 'Mantenimiento')
  assert.ok(draft.editorialReviewRequired.some((item) => item.includes('maintenance normalmente no se publica')))
})

test('el CLI escribe el borrador solo en el directorio temporal indicado y expone su ruta', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'pokeguide-release-note-test-'))
  temporaryDirectories.push(temporaryDirectory)
  const eventPath = path.join(temporaryDirectory, 'event.json')
  const outputPath = path.join(temporaryDirectory, 'github-output.txt')
  const artifactDirectory = path.join(temporaryDirectory, 'artifacts')
  const event = {
    action: 'opened',
    pull_request: makePullRequest(),
  }
  await writeFile(eventPath, JSON.stringify(event))

  const scriptPath = fileURLToPath(new URL('./generate-release-note-draft.mjs', import.meta.url))
  const result = spawnSync(
    process.execPath,
    [scriptPath, eventPath, artifactDirectory],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_REPOSITORY: repository,
        GITHUB_OUTPUT: outputPath,
      },
    },
  )

  assert.equal(result.status, 0, result.stderr)
  const output = await readFile(outputPath, 'utf8')
  assert.match(output, /eligible=true/)
  assert.match(output, /pull_request_number=42/)
  const draft = JSON.parse(await readFile(path.join(artifactDirectory, 'release-note-draft-pr-42.json'), 'utf8'))
  assert.equal(draft.source.pullRequest.number, 42)
})
