export const EXPECTED_REPOSITORY = 'MrAbsoluty/MrAbsoluty.github.io'
export const TARGET_BRANCH = 'main'

export const EDITORIAL_LABELS = Object.freeze({
  'release-note:feature': {
    type: 'feature',
    category: { es: 'Funcionalidad', en: 'Feature' },
  },
  'release-note:improvement': {
    type: 'improvement',
    category: { es: 'Mejora', en: 'Improvement' },
  },
  'release-note:fix': {
    type: 'fix',
    category: { es: 'Corrección', en: 'Fix' },
  },
  'release-note:maintenance': {
    type: 'maintenance',
    category: { es: 'Mantenimiento', en: 'Maintenance' },
  },
})

export const SUPPORTED_ACTIONS = Object.freeze([
  'opened',
  'edited',
  'labeled',
  'unlabeled',
  'synchronize',
  'reopened',
  'closed',
])

const SKIP_LABEL = 'release-note:skip'
const MAX_TITLE_LENGTH = 500
const MAX_BODY_LENGTH = 20_000

function requireString(value, field, { allowEmpty = false, maxLength = Infinity } = {}) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > maxLength) {
    throw new TypeError(`El campo ${field} falta o no es válido.`)
  }
  return value
}

function getLabelNames(labels) {
  if (!Array.isArray(labels)) throw new TypeError('La lista de etiquetas del PR no es válida.')
  return labels.map((label) => {
    if (typeof label === 'string') return label
    if (label && typeof label.name === 'string') return label.name
    throw new TypeError('Una etiqueta del PR tiene un formato no válido.')
  })
}

export function evaluatePullRequestEvent({
  eventName,
  action,
  repository,
  pullRequest,
}) {
  if (eventName !== 'pull_request') {
    throw new Error(`Evento no admitido: ${String(eventName)}.`)
  }
  if (!SUPPORTED_ACTIONS.includes(action)) {
    throw new Error(`Acción pull_request no admitida: ${String(action)}.`)
  }
  if (repository !== EXPECTED_REPOSITORY) {
    throw new Error(`Repositorio inesperado: se requiere ${EXPECTED_REPOSITORY}.`)
  }
  if (!pullRequest || typeof pullRequest !== 'object') {
    throw new TypeError('El evento no contiene metadatos válidos del Pull Request.')
  }
  if (pullRequest.base?.repo?.full_name !== EXPECTED_REPOSITORY) {
    throw new Error(`El Pull Request no pertenece a ${EXPECTED_REPOSITORY}.`)
  }
  if (pullRequest.base?.ref !== TARGET_BRANCH) {
    return { eligible: false, reason: 'target-branch-not-main' }
  }

  const labels = getLabelNames(pullRequest.labels)
  if (labels.includes(SKIP_LABEL)) {
    return { eligible: false, reason: 'release-note-skip' }
  }

  const inclusionLabels = labels.filter((label) => Object.hasOwn(EDITORIAL_LABELS, label))
  if (inclusionLabels.length !== 1) {
    return {
      eligible: false,
      reason: inclusionLabels.length === 0
        ? 'missing-inclusion-label'
        : 'conflicting-inclusion-labels',
    }
  }

  const state = pullRequest.state
  const merged = pullRequest.merged === true || Boolean(pullRequest.merged_at)
  if (state !== 'open' && state !== 'closed') {
    throw new TypeError('El estado del Pull Request no es válido.')
  }
  if (state === 'open' && merged) {
    throw new Error('El evento indica un PR abierto como fusionado; se cancela por seguridad.')
  }
  if (state === 'closed' && !merged) {
    return { eligible: false, reason: 'closed-without-merge' }
  }

  return {
    eligible: true,
    editorialLabel: inclusionLabels[0],
    editorialType: EDITORIAL_LABELS[inclusionLabels[0]].type,
    status: state === 'open' ? 'preliminary-open' : 'merged-awaiting-editorial-review',
  }
}

function getCanonicalPullRequestUrl(number) {
  return `https://github.com/${EXPECTED_REPOSITORY}/pull/${number}`
}

export function createReleaseNoteDraft(pullRequest, eligibility, generatedAt = new Date().toISOString()) {
  if (!eligibility?.eligible || !EDITORIAL_LABELS[eligibility.editorialLabel]) {
    throw new Error('No se puede crear un borrador para un Pull Request no elegible.')
  }

  const number = pullRequest.number
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new TypeError('El número del Pull Request no es válido.')
  }

  const title = requireString(pullRequest.title, 'pull_request.title', {
    maxLength: MAX_TITLE_LENGTH,
  })
  const description = pullRequest.body == null
    ? ''
    : requireString(pullRequest.body, 'pull_request.body', {
      allowEmpty: true,
      maxLength: MAX_BODY_LENGTH,
    })
  const canonicalUrl = getCanonicalPullRequestUrl(number)
  if (pullRequest.html_url !== canonicalUrl) {
    throw new Error('La URL del Pull Request no coincide con su repositorio y número.')
  }
  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new TypeError('La fecha de generación no es válida.')
  }

  const editorial = EDITORIAL_LABELS[eligibility.editorialLabel]
  const placeholder = {
    es: '[Pendiente de redacción editorial]',
    en: '[Editorial copy required]',
  }
  const detailsPlaceholder = {
    es: '[Completar con cambios verificables para usuarios.]',
    en: '[Describe verified user-facing changes.]',
  }
  const reviewRequired = [
    'date: confirmar la fecha editorial; generatedAt no es una fecha de lanzamiento.',
    'content.es.title: redactar y revisar en español.',
    'content.en.title: redactar y revisar en inglés.',
    'content.es.summary: redactar un resumen verificable en español.',
    'content.en.summary: redactar un resumen verificable en inglés.',
    'content.es.details: describir únicamente cambios confirmados en español.',
    'content.en.details: describir únicamente cambios confirmados en inglés.',
    'content.es.category y content.en.category: confirmar la categoría sugerida por la etiqueta.',
    'editorialLabel: confirmar que la clasificación representa el impacto del cambio.',
    'publication: decidir si el cambio merece aparecer en el panel público.',
  ]
  if (editorial.type === 'maintenance') {
    reviewRequired.push(
      'publication: maintenance normalmente no se publica; confirmar un impacto visible antes de incluirlo.',
    )
  }

  const draft = {
    schemaVersion: 1,
    draftStatus: 'incomplete-not-approved',
    id: `pr-${number}`,
    generatedAt,
    date: null,
    editorialLabel: eligibility.editorialLabel,
    editorialType: editorial.type,
    publicationStatus: 'not-published',
    source: {
      repository: EXPECTED_REPOSITORY,
      pullRequest: {
        number,
        url: canonicalUrl,
        state: pullRequest.state,
        mergedAt: pullRequest.merged_at || null,
        title,
        description,
        baseBranch: pullRequest.base.ref,
        labels: getLabelNames(pullRequest.labels),
      },
    },
    content: {
      es: {
        title: placeholder.es,
        summary: placeholder.es,
        category: editorial.category.es,
        details: [detailsPlaceholder.es],
      },
      en: {
        title: placeholder.en,
        summary: placeholder.en,
        category: editorial.category.en,
        details: [detailsPlaceholder.en],
      },
    },
    editorialReviewRequired: reviewRequired,
  }

  const validationErrors = validateReleaseNoteDraft(draft)
  if (validationErrors.length > 0) {
    throw new Error(`El borrador generado no pasó la validación: ${validationErrors.join('; ')}`)
  }
  return draft
}

export function validateReleaseNoteDraft(draft) {
  const errors = []
  const add = (message) => errors.push(message)

  if (!draft || typeof draft !== 'object') return ['El borrador debe ser un objeto.']
  if (draft.schemaVersion !== 1) add('schemaVersion debe ser 1.')
  if (draft.draftStatus !== 'incomplete-not-approved') add('El borrador debe permanecer sin aprobar.')
  if (!/^pr-[1-9]\d*$/.test(draft.id || '')) add('id debe derivarse del número del PR.')
  if (typeof draft.generatedAt !== 'string' || Number.isNaN(Date.parse(draft.generatedAt))) {
    add('generatedAt debe ser una fecha válida.')
  }
  if (draft.date !== null) add('date debe quedar pendiente como null.')
  if (draft.publicationStatus !== 'not-published') add('El borrador no puede marcarse como publicado.')
  const editorial = EDITORIAL_LABELS[draft.editorialLabel]
  if (!editorial) {
    add('La etiqueta editorial no es válida.')
  } else if (draft.editorialType !== editorial.type) {
    add('editorialType no corresponde a la etiqueta editorial.')
  }
  if (!Array.isArray(draft.editorialReviewRequired) || draft.editorialReviewRequired.length === 0) {
    add('editorialReviewRequired debe contener los campos pendientes de revisión.')
  }

  const source = draft.source
  const sourcePr = source?.pullRequest
  if (source?.repository !== EXPECTED_REPOSITORY) add('Falta la referencia al repositorio de origen.')
  if (!Number.isSafeInteger(sourcePr?.number) || sourcePr.number <= 0) {
    add('Falta un número de PR válido.')
  } else {
    if (draft.id !== `pr-${sourcePr.number}`) add('id no corresponde al número del PR.')
    if (sourcePr.url !== getCanonicalPullRequestUrl(sourcePr.number)) {
      add('La URL de origen no corresponde al repositorio y número del PR.')
    }
  }
  if (sourcePr?.baseBranch !== TARGET_BRANCH) add('El PR de origen debe dirigirse a main.')
  if (typeof sourcePr?.title !== 'string' || !sourcePr.title.trim()) add('Falta el título original del PR.')
  if (typeof sourcePr?.description !== 'string') add('La descripción original del PR debe ser texto.')
  if (!['open', 'closed'].includes(sourcePr?.state)) add('Falta un estado de PR válido.')
  if (!Array.isArray(sourcePr?.labels)) add('Faltan las etiquetas de origen.')

  for (const locale of ['es', 'en']) {
    const content = draft.content?.[locale]
    if (!content || typeof content !== 'object') {
      add(`Falta content.${locale}.`)
      continue
    }
    for (const field of ['title', 'summary', 'category']) {
      if (typeof content[field] !== 'string' || !content[field].trim()) {
        add(`content.${locale}.${field} debe ser texto no vacío.`)
      }
    }
    if (editorial && content.category !== editorial.category[locale]) {
      add(`content.${locale}.category no corresponde a la categoría editorial.`)
    }
    if (!Array.isArray(content.details) || content.details.length === 0
      || content.details.some((detail) => typeof detail !== 'string' || !detail.trim())) {
      add(`content.${locale}.details debe ser una lista de textos no vacía.`)
    }
  }
  return errors
}
