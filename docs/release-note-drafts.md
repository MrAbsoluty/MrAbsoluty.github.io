# Borradores editoriales de Novedades

Este flujo prepara un archivo JSON descargable para revisión humana. No actualiza el catálogo público `src/data/updates.js`, no publica novedades y no comenta ni modifica Pull Requests.

## Borradores desde pushes a `main`

El workflow independiente `.github/workflows/release-note-push-draft.yml` se ejecuta después de cada push a `main`. Compara los árboles de `before` y `after` y obtiene los mensajes de los commits del rango desde el checkout local con historial completo. No consulta la API de GitHub ni usa IA, secretos o servicios externos de generación.

Solo se consideran cambios bajo `src/` y `public/`, excluyendo `src/data/updates.js`, rutas de pruebas y directorios temporales/de dependencias. Documentación, scripts y workflows quedan fuera. Si no hay archivos de producto elegibles, la ejecución termina correctamente sin artefacto. El primer push sin SHA base comparable también se omite de forma segura.

Cuando hay cambios relevantes, el artefacto se llama `release-note-draft-push-run-<run_id>-<run_attempt>` y contiene `release-note-draft-push-<commit-after>.json`. Incluye los SHA `before`/`after`, mensajes de commits y rutas relevantes como referencias de origen. El texto bilingüe, la categoría y la fecha quedan explícitamente pendientes: mensajes y nombres de archivo no prueban qué funcionalidad existe ni su impacto público.

Para descargarlo, abre **Actions → Generate push release note draft**, elige el run correspondiente al push y descarga el artefacto con su número de ejecución e intento. Los artefactos se conservan 30 días. Los pushes que solo cambian el workflow, scripts, documentación o el propio catálogo no generan artefacto, por lo que el workflow no crea una cadena de ejecuciones recursivas. Cada push con cambios de producto genera un borrador independiente; no existe deduplicación entre runs.

La ruta de push conserva los mismos estados de seguridad que el flujo PR (`incomplete-not-approved` y `not-published`) pero tiene su propio origen `source.push`; no es un borrador con PR ni debe copiarse directamente al catálogo. La revisión, incorporación a `src/data/updates.js`, decisión de publicar y despliegue siguen siendo manuales.

Pruebas locales de esta ruta:

```sh
node --test scripts/test-push-release-note-draft.mjs
```

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

1. Abre **Actions → Generate release note draft** en el repositorio `MrAbsoluty/MrAbsoluty.github.io` y localiza el run del evento del PR que se pretende revisar. Comprueba el repositorio y el PR de origen antes de descargar.
2. En el run correcto, selecciona el artefacto cuyo nombre coincide exactamente con `release-note-draft-pr-<número>-run-<run_id>-<run_attempt>`. Comprueba que el número corresponde al PR y que `run_id` y `run_attempt` corresponden a esa ejecución e intento. No uses un artefacto de un run anterior ni un intento anterior aunque tenga el mismo número de PR.
3. Abre el JSON y verifica antes de evaluar su contenido editorial:
   - `source.repository` identifica el repositorio esperado.
   - `source.pullRequest.number` y `source.pullRequest.url` identifican el PR correcto; abre la URL y confirma el número.
   - `source.pullRequest.baseBranch` es `main`.
   - `source.pullRequest.labels` contiene exactamente una etiqueta de inclusión (`release-note:feature`, `release-note:improvement`, `release-note:fix` o `release-note:maintenance`) y no contiene `release-note:skip`.
   - `draftStatus` es `incomplete-not-approved` y `publicationStatus` es `not-published`.
   - El artefacto procede de la ejecución e intento que se quiere revisar, no de una ejecución anterior. `generatedAt` solo es metadato técnico de generación: no es una fecha de publicación ni una fecha editorial.
4. El título, la descripción y las etiquetas del PR en `source.pullRequest` son referencias de origen, no contenido público verificado. Contrasta cada afirmación con los cambios reales del producto. No inventes funcionalidades, beneficios, compatibilidad, resultados ni promesas.
5. Redacta y revisa `content.es` y `content.en`. Ambos textos deben ser semánticamente equivalentes y conservar los mismos hechos, condiciones, límites y advertencias. No dejes marcadores de posición, frases provisionales ni campos editoriales pendientes. Revisa la claridad y corrección de ambos idiomas antes de aprobar la novedad.
6. La etiqueta orienta la clasificación, pero no demuestra por sí sola que el cambio deba publicarse:
   - `feature`: confirma que es una funcionalidad nueva y que está realmente disponible o es pertinente para anunciar.
   - `improvement`: comprueba que existe una mejora concreta y describible.
   - `fix`: confirma qué problema se corrigió y no prometas más de lo que soluciona.
   - `maintenance`: excluye los cambios puramente internos que no tengan un impacto público significativo.
   Si no puedes confirmar el impacto, la categoría o la veracidad, no incorpores el borrador al catálogo.
7. Determina una fecha editorial confirmada de forma independiente. `generatedAt` no es una fecha editorial, y ni la fecha de creación ni la de cierre del PR prueban la fecha de publicación. El campo `date` del catálogo utiliza el formato `YYYY-MM-DD`, como las entradas existentes. Comprueba si ya existe una novedad equivalente. El `id` debe ser único y seguir las convenciones de las entradas existentes; el ID técnico `pr-<número>` del borrador no establece la convención del catálogo ni debe copiarse automáticamente.
8. Solo después de completar las comprobaciones, una persona puede trasladar al catálogo la información editorial revisada: la fecha confirmada, el ID validado y los textos localizados de título, resumen, categoría y detalles. El JSON descargado es un borrador técnico, no una entrada lista para copiar. No copies `schemaVersion`, `generatedAt`, `editorialLabel`, `editorialType`, `publicationStatus`, `draftStatus`, `source` (incluidos los metadatos del PR) ni `editorialReviewRequired`; tampoco traslades marcadores de posición o estados del borrador.

El catálogo actual organiza cada novedad en `id`, `date` y `content`, con las versiones `content.es` y `content.en`; cada versión contiene `title`, `summary`, `category` y `details` (una lista). Conserva esta estructura y las convenciones de las entradas existentes en `src/data/updates.js`; no añadas una estructura alternativa ni copies los campos técnicos del artefacto.

### Comprobación final antes de incorporar una entrada

- [ ] Veracidad de cada afirmación confirmada con los cambios reales del producto.
- [ ] Impacto público justificado.
- [ ] Categoría correcta para el cambio.
- [ ] Textos en español e inglés equivalentes y revisados.
- [ ] Fecha editorial confirmada y válida en formato `YYYY-MM-DD`.
- [ ] ID único y acorde con las convenciones existentes.
- [ ] Duplicados comprobados.
- [ ] Estructura compatible con `src/data/updates.js`.
- [ ] No se incorpora ningún marcador de posición ni estado de borrador.
- [ ] Cambios del catálogo revisados manualmente.

La modificación de `src/data/updates.js`, la decisión de publicar y el despliegue son procesos manuales e independientes. La generación del artefacto no aprueba ni publica contenido.

## Regenerar y duplicados

Editar título o descripción, actualizar el contenido del PR, cambiar etiquetas o volver a abrirlo activa otra evaluación. También se puede volver a ejecutar una ejecución anterior desde Actions; cada intento obtiene un nombre de artefacto distinto. El ID técnico del borrador permanece como `pr-<número>`. Volver a ejecutar un run anterior reutiliza el evento de ese run; para revisar datos actualizados, selecciona el run asociado al evento más reciente del PR.

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
