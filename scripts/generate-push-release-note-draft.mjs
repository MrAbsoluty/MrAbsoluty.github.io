import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  createPushReleaseNoteDraft,
  evaluatePushChanges,
} from './lib/push-release-note-draft.mjs'

const [eventPath, outputDirectory] = process.argv.slice(2)
if (!eventPath || !outputDirectory) {
  throw new Error('Uso: node scripts/generate-push-release-note-draft.mjs <event.json> <output-directory>')
}

const repository = process.env.GITHUB_REPOSITORY
const outputFile = process.env.GITHUB_OUTPUT
if (!repository || !outputFile) {
  throw new Error('Falta el contexto requerido de GitHub Actions; no se generó ningún borrador.')
}

let event
try {
  event = JSON.parse(await readFile(eventPath, 'utf8'))
} catch (error) {
  throw new Error(`No se pudo leer el payload del evento de GitHub: ${error.message}`)
}

if (event.ref !== 'refs/heads/main') {
  throw new Error('El evento push debe corresponder a refs/heads/main.')
}
if (event.repository?.full_name !== repository) {
  throw new Error('El repositorio del payload no coincide con GITHUB_REPOSITORY.')
}
if (!/^[a-f0-9]{40}$/i.test(event.after || '')) {
  throw new TypeError('El SHA after del evento push no es válido.')
}

const before = event.before
if (!/^[a-f0-9]{40}$/i.test(before || '')) {
  throw new TypeError('El SHA before del evento push no es válido.')
}
if (/^0+$/.test(before)) {
  await appendFile(outputFile, 'eligible=false\nskip_reason=no-previous-commit\n')
  console.log('No se generó borrador: el push no tiene un SHA base previo comparable.')
  process.exit(0)
}

const changedFilesOutput = execFileSync(
  'git',
  ['diff', '--name-only', '-z', before, event.after],
  { encoding: 'utf8' },
)
const changedFiles = changedFilesOutput.split('\0').filter(Boolean)
const evaluation = evaluatePushChanges(changedFiles)

if (!evaluation.eligible) {
  await appendFile(outputFile, `eligible=false\nskip_reason=${evaluation.reason}\n`)
  console.log('No se generó borrador: el push no modificó archivos de producto elegibles.')
  process.exit(0)
}

const commitShas = execFileSync(
  'git',
  ['rev-list', '--reverse', `${before}..${event.after}`],
  { encoding: 'utf8' },
).trim().split(/\r?\n/).filter(Boolean)
const commits = commitShas.map((sha) => ({
  sha,
  message: execFileSync('git', ['show', '-s', '--format=%B', sha], { encoding: 'utf8' }).trim(),
}))

const draft = createPushReleaseNoteDraft({
  repository,
  before,
  after: event.after,
  commits,
  changedFiles: evaluation.relevantFiles,
})
await mkdir(outputDirectory, { recursive: true })
const draftPath = path.join(outputDirectory, `release-note-draft-push-${event.after}.json`)
await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, { flag: 'wx' })
await appendFile(
  outputFile,
  `eligible=true\ndraft_path=${draftPath}\ncommit=${event.after}\n`,
)
console.log(`Borrador incompleto generado para el push ${event.after.slice(0, 12)}.`)
