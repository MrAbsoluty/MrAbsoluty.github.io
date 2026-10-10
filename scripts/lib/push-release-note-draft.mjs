const RELEVANT_ROOTS = ['src/', 'public/']
const TEMPORARY_PATH_SEGMENT = /(^|\/)(?:tmp|temp|temporary|cache|dist|node_modules)(\/|$)/i
const TEMPORARY_FILE_SUFFIX = /\.(?:tmp|temp|bak|swp|log)$/i
const TEST_PATH_SEGMENT = /(^|\/)(__tests__|tests?)(\/|$)/i
const TEST_FILE_SUFFIX = /\.(?:test|spec)\.[^.]+$/i

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${field} falta o no es válido.`)
  }
  return value
}

export function isRelevantPushFile(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) return false
  const normalizedPath = filePath.replaceAll('\\', '/').replace(/^\.\/+/, '')
  if (!RELEVANT_ROOTS.some((root) => normalizedPath.startsWith(root))) return false
  if (normalizedPath === 'src/data/updates.js') return false
  if (TEMPORARY_PATH_SEGMENT.test(normalizedPath)) return false
  if (TEMPORARY_FILE_SUFFIX.test(normalizedPath)) return false
  if (TEST_PATH_SEGMENT.test(normalizedPath) || TEST_FILE_SUFFIX.test(normalizedPath)) return false
  return true
}

export function evaluatePushChanges(files) {
  if (!Array.isArray(files)) throw new TypeError('La lista de archivos modificados debe ser un array.')
  const relevantFiles = Array.from(new Set(files.filter(isRelevantPushFile))).sort()
  return {
    eligible: relevantFiles.length > 0,
    reason: relevantFiles.length > 0 ? null : 'no-relevant-product-files',
    relevantFiles,
  }
}

export function createPushReleaseNoteDraft({
  repository,
  before,
  after,
  commits,
  changedFiles,
  generatedAt = new Date().toISOString(),
}) {
  requireString(repository, 'repository')
  requireString(before, 'before')
  requireString(after, 'after')
  if (!Array.isArray(commits) || commits.length === 0) {
    throw new TypeError('Se requiere al menos un commit para crear el borrador.')
  }
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    throw new TypeError('Se requiere al menos un archivo relevante para crear el borrador.')
  }
  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new TypeError('generatedAt debe ser una fecha válida.')
  }

  const normalizedCommits = commits.map((commit, index) => {
    if (!commit || typeof commit !== 'object') {
      throw new TypeError(`commits[${index}] debe ser un objeto.`)
    }
    return {
      sha: requireString(commit.sha, `commits[${index}].sha`),
      message: typeof commit.message === 'string'
        ? commit.message
        : requireString(commit.message, `commits[${index}].message`),
    }
  })
  const normalizedFiles = Array.from(new Set(changedFiles.filter(isRelevantPushFile))).sort()
  if (normalizedFiles.length === 0) {
    throw new TypeError('No hay archivos relevantes para crear el borrador.')
  }

  const editorialPlaceholder = {
    es: '[Pendiente de redacción y revisión editorial]',
    en: '[Editorial writing and review required]',
  }
  const detailsPlaceholder = {
    es: '[Contrastar los cambios enumerados en source con el producto; no inferir funcionalidades.]',
    en: '[Verify the changes listed in source against the product; do not infer features.]',
  }

  return {
    schemaVersion: 1,
    draftStatus: 'incomplete-not-approved',
    id: `push-${after.slice(0, 12)}`,
    generatedAt,
    date: null,
    editorialLabel: null,
    editorialType: null,
    publicationStatus: 'not-published',
    source: {
      repository,
      push: {
        before,
        after,
        commits: normalizedCommits,
        changedFiles: normalizedFiles,
      },
    },
    content: {
      es: {
        title: editorialPlaceholder.es,
        summary: editorialPlaceholder.es,
        category: editorialPlaceholder.es,
        details: [detailsPlaceholder.es],
      },
      en: {
        title: editorialPlaceholder.en,
        summary: editorialPlaceholder.en,
        category: editorialPlaceholder.en,
        details: [detailsPlaceholder.en],
      },
    },
    editorialReviewRequired: [
      'date: confirmar una fecha editorial; generatedAt no es una fecha de publicación.',
      'content.es y content.en: redactar y revisar manualmente sin inferir afirmaciones desde nombres o mensajes.',
      'editorialLabel y editorialType: determinar y confirmar manualmente la categoría.',
      'publication: decidir manualmente si los cambios tienen impacto público y merecen anunciarse.',
      'source.push.changedFiles y source.push.commits: referencias de origen, no contenido editorial verificado.',
    ],
  }
}
