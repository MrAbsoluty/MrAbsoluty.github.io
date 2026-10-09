# Borradores editoriales de Novedades

Este flujo prepara un archivo JSON descargable para revisión humana. No actualiza el catálogo público `src/data/updates.js`, no publica novedades y no comenta ni modifica Pull Requests.

## Etiquetas editoriales

Configura manualmente estas etiquetas en **Settings → Labels** del repositorio. Los nombres deben coincidir exactamente:

| Etiqueta | Clasificación del borrador |
| --- | --- |
| `release-note:feature` | Funcionalidad |
| `release-note:improvement` | Mejora |
| `release-note:fix` | Corrección |
| `release-note:maintenance` | Mantenimiento interno; normalmente debe excluirse de novedades públicas salvo que se confirme impacto visible |
| `release-note:skip` | Excluye el PR |

No hay automatización que cree estas etiquetas. Cada PR dirigido a `main` debe tener exactamente una etiqueta de inclusión (`feature`, `improvement`, `fix` o `maintenance`) para ser elegible. Sin etiqueta, con varias etiquetas de inclusión o con `release-note:skip`, no se genera un artefacto.

## Eventos y elegibilidad

`.github/workflows/release-note-draft.yml` se activa con `opened`, `edited`, `labeled`, `unlabeled`, `synchronize`, `reopened` y `closed`:

- `opened` permite un borrador preliminar cuando el PR ya trae una etiqueta válida.
- `edited`, `synchronize` y cambios de etiquetas permiten regenerar con los metadatos actuales.
- `reopened` vuelve a evaluar el PR.
- `closed` solo genera borrador si el PR fue fusionado; los cierres sin merge se ignoran.
- Los PR abiertos se marcan explícitamente como preliminares y no publicados.

El script comprueba el repositorio, la rama base `main`, el estado, la acción y las etiquetas. Usa el payload proporcionado por GitHub Actions; no ejecuta ni interpreta instrucciones presentes en el título o descripción. El checkout apunta al SHA de la rama base del PR y deshabilita la persistencia de credenciales, para no ejecutar la versión del generador propuesta por el propio PR.

## Descargar y revisar

1. Abre **Actions → Generate release note draft** y selecciona la ejecución asociada al evento del PR.
2. Si el PR es elegible, descarga el artefacto `release-note-draft-pr-<número>-run-<run>-<intento>`.
3. Revisa el JSON. El ID determinista `pr-<número>` y `source.pullRequest.url` identifican el origen; la fecha de generación solo es metadato técnico.
4. Completa `date` con una fecha editorial confirmada, redacta y revisa `content.es` y `content.en`, confirma las categorías propuestas y decide si merece publicarse.
5. Solo después de esa revisión una persona puede incorporar manualmente el contenido aprobado al catálogo existente.

El borrador se genera deliberadamente incompleto: el título, la descripción y las etiquetas del PR se guardan como fuente, pero no se convierten automáticamente en afirmaciones editoriales ni traducciones. El artefacto no equivale a aprobación. La etiqueta `maintenance` incluye una advertencia adicional para confirmar impacto público.

## Regenerar y duplicados

Editar título o descripción, actualizar el contenido del PR, cambiar etiquetas o volver a abrirlo activa otra evaluación. También se puede volver a ejecutar una ejecución anterior desde Actions; cada intento obtiene un nombre de artefacto distinto. El ID del borrador permanece como `pr-<número>`, mientras que el contenido refleja los metadatos del evento más reciente.

No se mantiene un registro global de borradores o publicaciones y, por ello, el flujo no detecta duplicados globales ni prueba si un borrador fue aprobado o publicado. Los artefactos caducan a los 30 días.

## Permisos y aislamiento

El workflow solo concede `contents: read` (necesario para checkout) y `pull-requests: read`. No tiene permisos de escritura sobre contenido, PR o despliegues; no usa tokens personales ni secretos nuevos. Solo carga el JSON producido por el script del checkout de confianza de la rama base.

Para desactivar la automatización, deshabilita el workflow **Generate release note draft** desde Actions o elimina únicamente `.github/workflows/release-note-draft.yml`. Esto no afecta el panel, `src/data/updates.js` ni el workflow de Pages.

## Límites de esta fase

- No redacta ni traduce contenido editorial; requiere revisión humana en español e inglés.
- No determina por sí sola si un cambio técnico tiene impacto para usuarios.
- No añade novedades al catálogo, no publica, no crea commits/ramas/releases y no comenta en GitHub.
- No consulta releases, tags ni historial de commits.
- Los eventos `pull_request` no se ejecutan en todos los casos cuando el repositorio restringe workflows de PR provenientes de forks; las reglas de seguridad o aprobación de Actions del repositorio pueden requerir aprobación manual.
- Si el evento no contiene contexto suficiente o no coincide con el repositorio esperado, el generador falla de forma cerrada en vez de crear un artefacto.

## Pruebas locales

Con Node.js 20 o posterior, ejecuta:

```sh
node --test scripts/test-release-note-draft.mjs
```

Las pruebas usan PR ficticios en memoria y no realizan llamadas a GitHub.

Para la primera comprobación real, incorpora primero el workflow y el generador a `main`; después, en un PR de prueba dirigido a `main`, añade una sola etiqueta de inclusión y descarga el artefacto de la ejecución `labeled`. El PR que introduce esta automatización puede no producir artefacto: el workflow hace checkout de la revisión base confiable, que todavía no contendrá el generador antes de fusionar ese PR.
