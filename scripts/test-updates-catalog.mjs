import assert from 'node:assert/strict'
import test from 'node:test'
import updates from '../src/data/updates.js'
import { validateUpdatesCatalog } from './lib/updates-catalog.mjs'

function makeEntry(overrides = {}) {
  return {
    id: 'sample-update',
    date: '2026-10-09',
    content: {
      es: {
        title: 'Título de prueba',
        summary: 'Resumen de prueba',
        category: 'Categoría nueva',
        details: ['Detalle de prueba'],
      },
      en: {
        title: 'Sample title',
        summary: 'Sample summary',
        category: 'New category',
        details: ['Sample detail'],
      },
    },
    ...overrides,
  }
}

function diagnostics(catalog) {
  return validateUpdatesCatalog(catalog)
}

function expectError(result, path) {
  assert.ok(result.errors.some((error) => error.path === path), `Se esperaba error en ${path}`)
}

test('el catálogo actual es válido', () => {
  assert.deepEqual(diagnostics(updates), { errors: [], warnings: [] })
})

test('un catálogo vacío es válido', () => {
  assert.deepEqual(diagnostics([]), { errors: [], warnings: [] })
})

test('rechaza todos los índices vacíos de arrays dispersos', () => {
  const oneHole = diagnostics(new Array(1))
  expectError(oneHole, 'updates[0]')

  const multipleHoles = new Array(3)
  multipleHoles[2] = makeEntry({ id: 'valid-entry' })
  const result = diagnostics(multipleHoles)
  expectError(result, 'updates[0]')
  expectError(result, 'updates[1]')
  assert.deepEqual(result.errors.filter((error) => error.path === 'updates[2]'), [])
})

test('rechaza un catálogo que no sea array', () => {
  expectError(diagnostics({}), 'updates')
})

test('rechaza entradas que no sean objetos', () => {
  expectError(diagnostics([null]), 'updates[0]')
})

test('rechaza un ID vacío y acepta IDs flexibles', () => {
  const emptyId = diagnostics([makeEntry({ id: '   ' })])
  expectError(emptyId, 'updates[0].id')

  assert.deepEqual(diagnostics([makeEntry({ id: ' id libre / v2 ' })]).errors, [])
})

test('rechaza IDs duplicados tras eliminar espacios exteriores', () => {
  const result = diagnostics([makeEntry({ id: 'sample-update' }), makeEntry({ id: ' sample-update ' })])
  expectError(result, 'updates[1].id')
})

test('rechaza fechas nulas, con formato incorrecto e imposibles', () => {
  for (const date of [null, '09-10-2026', '2026-02-30']) {
    expectError(diagnostics([makeEntry({ date })]), 'updates[0].date')
  }
})

test('acepta 2024-02-29 y 2000-02-29, pero rechaza 1900-02-29', () => {
  for (const date of ['2024-02-29', '2000-02-29']) {
    assert.deepEqual(diagnostics([makeEntry({ date })]).errors, [])
  }
  expectError(diagnostics([makeEntry({ date: '1900-02-29' })]), 'updates[0].date')
})

test('rechaza traducciones españolas o inglesas ausentes', () => {
  const missingSpanish = makeEntry({ content: { en: makeEntry().content.en } })
  const missingEnglish = makeEntry({ content: { es: makeEntry().content.es } })
  expectError(diagnostics([missingSpanish]), 'updates[0].content.es')
  expectError(diagnostics([missingEnglish]), 'updates[0].content.en')
})

test('rechaza título, resumen y categoría vacíos', () => {
  for (const field of ['title', 'summary', 'category']) {
    const entry = makeEntry()
    entry.content.es[field] = '  '
    expectError(diagnostics([entry]), `updates[0].content.es.${field}`)
  }
})

test('rechaza title, summary y category ausentes o con tipo incorrecto', () => {
  for (const field of ['title', 'summary', 'category']) {
    const missing = makeEntry()
    delete missing.content.en[field]
    expectError(diagnostics([missing]), `updates[0].content.en.${field}`)

    const wrongType = makeEntry()
    wrongType.content.en[field] = 42
    expectError(diagnostics([wrongType]), `updates[0].content.en.${field}`)
  }
})

test('rechaza details ausente o con tipo incorrecto', () => {
  const missing = makeEntry()
  delete missing.content.es.details
  expectError(diagnostics([missing]), 'updates[0].content.es.details')

  const wrongType = makeEntry()
  wrongType.content.es.details = 'Detalle'
  expectError(diagnostics([wrongType]), 'updates[0].content.es.details')
})

test('details vacío genera advertencia sin error', () => {
  const entry = makeEntry()
  entry.content.es.details = []
  const result = diagnostics([entry])
  assert.deepEqual(result.errors, [])
  assert.ok(result.warnings.some((warning) => warning.path === 'updates[0].content.es.details'))
})

test('rechaza elementos inválidos dentro de details', () => {
  const entry = makeEntry()
  entry.content.en.details = ['válido', '  ', 42]
  const result = diagnostics([entry])
  expectError(result, 'updates[0].content.en.details[1]')
  expectError(result, 'updates[0].content.en.details[2]')
})

test('acepta categorías nuevas como texto libre', () => {
  const entry = makeEntry()
  entry.content.es.category = 'Categoría inédita'
  entry.content.en.category = 'Unlisted category'
  assert.deepEqual(diagnostics([entry]).errors, [])
})

test('acepta propiedades adicionales desconocidas', () => {
  const entry = makeEntry({ futureMetadata: { retained: true } })
  assert.deepEqual(diagnostics([entry]).errors, [])
})

test('rechaza metadata técnica de borradores de Fase B', () => {
  const result = diagnostics([makeEntry({ generatedAt: '2026-10-09T00:00:00Z' })])
  expectError(result, 'updates[0].generatedAt')
})

test('advierte títulos repetidos con espacios y mayúsculas normalizados', () => {
  const first = makeEntry()
  const second = makeEntry({ id: 'second' })
  second.content.es.title = '  TÍTULO   DE PRUEBA '
  const result = diagnostics([first, second])
  assert.ok(result.warnings.some((warning) => (
    warning.path === 'updates[1].content.es.title'
    && warning.relatedPath === 'updates[0].content.es.title'
  )))
})

test('advierte contenido exactamente repetido con IDs diferentes', () => {
  const first = makeEntry()
  const second = makeEntry({ id: 'second' })
  const result = diagnostics([first, second])
  assert.ok(result.warnings.some((warning) => (
    warning.path === 'updates[1].content.es'
    && warning.relatedPath === 'updates[0].content.es'
  )))
})

test('no confunde campos diferentes que antes colisionaban con el separador', () => {
  const first = makeEntry()
  first.content.es.title = 'A\u0000B'
  first.content.es.summary = 'C'
  first.content.es.category = 'D'
  first.content.es.details = ['E']

  const second = makeEntry({ id: 'second' })
  second.content.es.title = 'A'
  second.content.es.summary = 'B\u0000C'
  second.content.es.category = 'D'
  second.content.es.details = ['E']

  const result = diagnostics([first, second])
  assert.equal(result.warnings.some((warning) => warning.path === 'updates[1].content.es'), false)
})

test('no compara títulos entre idiomas diferentes', () => {
  const first = makeEntry()
  first.content.es.title = 'Título compartido'
  first.content.en.title = 'English title'

  const second = makeEntry({ id: 'second' })
  second.content.es.title = 'Otro título'
  second.content.en.title = 'Título compartido'

  const result = diagnostics([first, second])
  assert.equal(result.warnings.some((warning) => warning.message.startsWith('Título')), false)
})

test('normaliza espacios y mayúsculas al advertir contenido duplicado', () => {
  const first = makeEntry()
  const second = makeEntry({ id: 'second' })
  second.content.es.title = '  TÍTULO   DE PRUEBA '
  second.content.es.summary = ' RESUMEN DE PRUEBA '
  second.content.es.category = 'CATEGORÍA   NUEVA'
  second.content.es.details = [' DETALLE DE PRUEBA ']

  const result = diagnostics([first, second])
  assert.ok(result.warnings.some((warning) => (
    warning.path === 'updates[1].content.es'
    && warning.relatedPath === 'updates[0].content.es'
  )))
})

test('no advierte duplicados cuando el contenido es diferente', () => {
  const first = makeEntry()
  const second = makeEntry({ id: 'second' })
  second.content.es.title = 'Otro título'
  second.content.es.summary = 'Otro resumen'
  second.content.es.details = ['Otro detalle']
  second.content.en.title = 'Different title'
  second.content.en.summary = 'Different summary'
  second.content.en.details = ['Different detail']
  assert.deepEqual(diagnostics([first, second]).warnings, [])
})
