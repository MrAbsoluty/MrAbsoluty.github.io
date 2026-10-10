const REQUIRED_LOCALES = ['es', 'en']
const REQUIRED_TEXT_FIELDS = ['title', 'summary', 'category']
const DRAFT_METADATA_FIELDS = [
  'schemaVersion',
  'draftStatus',
  'generatedAt',
  'editorialLabel',
  'editorialType',
  'publicationStatus',
  'source',
  'editorialReviewRequired',
]

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12 || day < 1) return false

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysPerMonth[month - 1]
}

function addDuplicateWarnings(entries, field, getValue) {
  const seen = new Map()
  for (const entry of entries) {
    const value = getValue(entry)
    if (!value) continue
    const previous = seen.get(value.normalized)
    if (previous) {
      entry.warnings.push({
        path: value.path,
        message: `${field} coincide exactamente con otra entrada; revisar si es un duplicado.`,
        relatedPath: previous.path,
      })
    } else {
      seen.set(value.normalized, { path: value.path })
    }
  }
}

export function validateUpdatesCatalog(catalog) {
  const errors = []
  const warnings = []
  const addError = (path, message) => errors.push({ path, message })

  if (!Array.isArray(catalog)) {
    addError('updates', 'El catálogo debe ser un array.')
    return { errors, warnings }
  }

  const seenIds = new Map()
  const validatedEntries = []

  for (let index = 0; index < catalog.length; index += 1) {
    const entry = catalog[index]
    const entryPath = `updates[${index}]`
    if (!isObject(entry)) {
      addError(entryPath, 'Cada entrada debe ser un objeto.')
      continue
    }

    const entryWarnings = []
    validatedEntries.push({ entry, index, warnings: entryWarnings })

    for (const field of DRAFT_METADATA_FIELDS) {
      if (Object.hasOwn(entry, field)) {
        addError(`${entryPath}.${field}`, 'La metadata técnica del borrador Fase B no pertenece al catálogo.')
      }
    }

    if (typeof entry.id !== 'string' || !entry.id.trim()) {
      addError(`${entryPath}.id`, 'id debe ser una cadena no vacía.')
    } else {
      const normalizedId = entry.id.trim()
      const previous = seenIds.get(normalizedId)
      if (previous !== undefined) {
        addError(`${entryPath}.id`, `id duplicado; ya aparece en updates[${previous}].id.`)
      } else {
        seenIds.set(normalizedId, index)
      }
    }

    if (!isValidDate(entry.date)) {
      addError(`${entryPath}.date`, 'date debe ser una fecha válida con formato YYYY-MM-DD.')
    }

    if (!isObject(entry.content)) {
      addError(`${entryPath}.content`, 'content debe ser un objeto con traducciones es y en.')
      continue
    }

    for (const locale of REQUIRED_LOCALES) {
      const localePath = `${entryPath}.content.${locale}`
      const localized = entry.content[locale]
      if (!isObject(localized)) {
        addError(localePath, `La traducción ${locale} debe ser un objeto.`)
        continue
      }

      for (const field of REQUIRED_TEXT_FIELDS) {
        if (typeof localized[field] !== 'string' || !localized[field].trim()) {
          addError(`${localePath}.${field}`, `${field} debe ser una cadena no vacía.`)
        }
      }

      if (!Array.isArray(localized.details)) {
        addError(`${localePath}.details`, 'details debe ser un array de cadenas no vacías.')
      } else {
        localized.details.forEach((detail, detailIndex) => {
          if (typeof detail !== 'string' || !detail.trim()) {
            addError(`${localePath}.details[${detailIndex}]`, 'Cada detalle debe ser una cadena no vacía.')
          }
        })
        if (localized.details.length === 0) {
          entryWarnings.push({
            path: `${localePath}.details`,
            message: 'details está vacío; confirmar que la entrada debe publicarse sin detalles.',
          })
        }
      }
    }
  }

  for (const locale of REQUIRED_LOCALES) {
    addDuplicateWarnings(
      validatedEntries.map(({ entry, index, warnings: entryWarnings }) => {
        const localized = isObject(entry.content) ? entry.content[locale] : null
        const title = isObject(localized) && typeof localized.title === 'string' && localized.title.trim()
          ? { normalized: normalizeText(localized.title), path: `updates[${index}].content.${locale}.title` }
          : null
        return { title, entry, index, warnings: entryWarnings }
      }),
      `Título en ${locale}`,
      (item) => item.title,
    )

    const seenContent = new Map()
    for (const { entry, index, warnings: entryWarnings } of validatedEntries) {
      const localized = isObject(entry.content) ? entry.content[locale] : null
      if (!isObject(localized)) continue
      const textFields = [
        localized.title,
        localized.summary,
        localized.category,
        ...(Array.isArray(localized.details) ? localized.details : []),
      ]
      if (textFields.some((field) => typeof field !== 'string' || !field.trim())) continue

      const normalizedContent = JSON.stringify(textFields.map(normalizeText))
      const currentPath = `updates[${index}].content.${locale}`
      const previousPath = seenContent.get(normalizedContent)
      if (previousPath) {
        entryWarnings.push({
          path: currentPath,
          message: `El contenido en ${locale} coincide exactamente con otra entrada; revisar si es un duplicado.`,
          relatedPath: previousPath,
        })
      } else {
        seenContent.set(normalizedContent, currentPath)
      }
    }
  }

  for (const { warnings: entryWarnings } of validatedEntries) warnings.push(...entryWarnings)
  return { errors, warnings }
}
