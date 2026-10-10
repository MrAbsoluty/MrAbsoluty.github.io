import updates from '../src/data/updates.js'
import { validateUpdatesCatalog } from './lib/updates-catalog.mjs'

const { errors, warnings } = validateUpdatesCatalog(updates)

for (const error of errors) {
  console.error(`ERROR ${error.path}: ${error.message}`)
}

for (const warning of warnings) {
  const related = warning.relatedPath ? ` (coincide con ${warning.relatedPath})` : ''
  console.warn(`ADVERTENCIA ${warning.path}: ${warning.message}${related}`)
}

if (errors.length > 0) {
  console.error(`Validación fallida: ${errors.length} error(es), ${warnings.length} advertencia(s).`)
  process.exitCode = 1
} else if (warnings.length > 0) {
  console.log(`Validación correcta con ${warnings.length} advertencia(s); requieren revisión editorial.`)
} else {
  console.log('Catálogo de Novedades válido; sin errores ni advertencias.')
}
