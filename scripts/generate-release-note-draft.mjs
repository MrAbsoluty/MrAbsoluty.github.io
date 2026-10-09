import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createReleaseNoteDraft,
  evaluatePullRequestEvent,
} from './lib/release-note-draft.mjs'

const [eventPath, outputDirectory] = process.argv.slice(2)
if (!eventPath || !outputDirectory) {
  throw new Error('Uso: node scripts/generate-release-note-draft.mjs <event.json> <output-directory>')
}

const eventName = process.env.GITHUB_EVENT_NAME
const repository = process.env.GITHUB_REPOSITORY
const outputFile = process.env.GITHUB_OUTPUT
if (!eventName || !repository || !outputFile) {
  throw new Error('Falta el contexto requerido de GitHub Actions; no se generó ningún borrador.')
}

let event
try {
  event = JSON.parse(await readFile(eventPath, 'utf8'))
} catch (error) {
  throw new Error(`No se pudo leer el payload del evento de GitHub: ${error.message}`)
}

const eligibility = evaluatePullRequestEvent({
  eventName,
  action: event.action,
  repository,
  pullRequest: event.pull_request,
})

if (!eligibility.eligible) {
  await appendFile(outputFile, `eligible=false\nskip_reason=${eligibility.reason}\n`)
  console.log(`No se generó borrador (${eligibility.reason}).`)
  process.exit(0)
}

const draft = createReleaseNoteDraft(event.pull_request, eligibility)
await mkdir(outputDirectory, { recursive: true })
const draftPath = path.join(outputDirectory, `release-note-draft-pr-${draft.source.pullRequest.number}.json`)
await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, { flag: 'wx' })
await appendFile(
  outputFile,
  `eligible=true\ndraft_path=${draftPath}\npull_request_number=${draft.source.pullRequest.number}\n`,
)
console.log(`Borrador incompleto generado para PR #${draft.source.pullRequest.number}.`)
