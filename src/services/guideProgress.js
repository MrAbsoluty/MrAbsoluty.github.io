import { useCallback, useEffect, useState } from 'react'
import { getAllObjectives, getSectionObjectives } from '../data/guideData.js'

export const GUIDE_PROGRESS_KEY = 'pokeguide-guide-progress'
export const GUIDE_PROGRESS_EVENT = 'pokeguide-guide-progress-update'

/**
 * Lee el estado persistido del progreso desde localStorage.
 * Garantiza retrocompatibilidad total y estructura limpia para la Fase 1.5.
 */
export function getStoredProgress() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      completedObjectives: [],
      visitedObjectives: [],
      passedExams: [],
      failedExams: [],
      unlockedBadges: [],
    }
  }

  try {
    const raw = window.localStorage.getItem(GUIDE_PROGRESS_KEY)
    if (!raw) {
      return {
        completedObjectives: [],
        visitedObjectives: [],
        passedExams: [],
        failedExams: [],
        unlockedBadges: [],
      }
    }
    const parsed = JSON.parse(raw)
    const completedList = Array.isArray(parsed?.completedObjectives)
      ? parsed.completedObjectives
      : []
    const visitedList = Array.isArray(parsed?.visitedObjectives)
      ? parsed.visitedObjectives
      : []
    const rawPassed = Array.isArray(parsed?.passedExams)
      ? parsed.passedExams
      : []
    const rawFailed = Array.isArray(parsed?.failedExams)
      ? parsed.failedExams
      : []
    const rawBadges = Array.isArray(parsed?.unlockedBadges)
      ? parsed.unlockedBadges
      : []

    // Limpiar inconsistencias heredadas:
    // Una sección NUNCA puede considerarse aprobada o con insignia si no tiene
    // TODOS sus objetivos completados/aprendidos en el progreso actual.
    const validPassed = rawPassed.filter((secId) => {
      const secObjectives = getSectionObjectives(secId)
      if (!secObjectives || secObjectives.length === 0) return false
      return secObjectives.every((obj) => completedList.includes(obj.id))
    })

    // Los badges ya desbloqueados en localStorage se preservan de por vida (retrocompatibilidad)
    const validBadges = Array.from(new Set([...rawBadges, ...validPassed]))

    const cleaned = {
      completedObjectives: completedList,
      visitedObjectives: visitedList,
      passedExams: validPassed,
      failedExams: rawFailed,
      unlockedBadges: validBadges,
    }

    // Auto-sanear localStorage si existían estados de examen o insignias huérfanas
    if (
      validPassed.length !== rawPassed.length ||
      validBadges.length !== rawBadges.length
    ) {
      try {
        window.localStorage.setItem(GUIDE_PROGRESS_KEY, JSON.stringify({
          ...cleaned,
          lastUpdated: Date.now(),
        }))
      } catch {
        // Silencioso
      }
    }

    return cleaned
  } catch (err) {
    console.warn('Error al leer el progreso de la guía:', err)
    return {
      completedObjectives: [],
      visitedObjectives: [],
      passedExams: [],
      failedExams: [],
      unlockedBadges: [],
    }
  }
}

/**
 * Guarda el progreso en localStorage y notifica de forma reactiva.
 */
export function saveStoredProgress(progress) {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    const payload = {
      completedObjectives: Array.from(new Set(progress.completedObjectives || [])),
      visitedObjectives: Array.from(new Set(progress.visitedObjectives || [])),
      passedExams: Array.from(new Set(progress.passedExams || [])),
      failedExams: Array.from(new Set(progress.failedExams || [])),
      unlockedBadges: Array.from(new Set(progress.unlockedBadges || [])),
      lastUpdated: Date.now(),
    }
    window.localStorage.setItem(GUIDE_PROGRESS_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(GUIDE_PROGRESS_EVENT, { detail: payload }))
  } catch (err) {
    console.warn('Error al guardar el progreso de la guía:', err)
  }
}

/**
 * Retorna el estado de aprendizaje de un objetivo:
 * - 'learned': Estado 3 (aprendido explícitamente, tick verde ✓)
 * - 'visited': Estado 2 (visitado / estudiado pero no marcado, tick gris ◉)
 * - 'unvisited': Estado 1 (no visitado, círculo neutro ○)
 */
export function getObjectiveState(objectiveId, completedObjectives, visitedObjectives) {
  const completed = completedObjectives !== undefined ? completedObjectives : getStoredProgress().completedObjectives
  const visited = visitedObjectives !== undefined ? visitedObjectives : getStoredProgress().visitedObjectives
  if (completed.includes(objectiveId)) {
    return 'learned'
  }
  if (visited.includes(objectiveId)) {
    return 'visited'
  }
  return 'unvisited'
}

export function isObjectiveLearned(objectiveId, completedObjectives) {
  const completed = completedObjectives !== undefined ? completedObjectives : getStoredProgress().completedObjectives
  return completed.includes(objectiveId)
}

export function isObjectiveVisited(objectiveId, visitedObjectives) {
  const visited = visitedObjectives !== undefined ? visitedObjectives : getStoredProgress().visitedObjectives
  return visited.includes(objectiveId)
}

/**
 * Marca un objetivo como visitado (Estado 2: ◉) sin marcarlo como aprendido.
 * Navegar o leer nunca marca automáticamente como aprendido.
 */
export function markObjectiveVisited(objectiveId) {
  if (!objectiveId) return
  const current = getStoredProgress()
  if (current.completedObjectives.includes(objectiveId)) {
    return current
  }
  if (current.visitedObjectives.includes(objectiveId)) {
    return current
  }

  const updatedProgress = {
    ...current,
    visitedObjectives: [...current.visitedObjectives, objectiveId],
  }
  saveStoredProgress(updatedProgress)
  return updatedProgress
}

/**
 * Determina si todos los objetivos de una sección están aprendidos.
 */
export function areAllObjectivesLearned(sectionId, completedObjectives) {
  const completed = completedObjectives !== undefined ? completedObjectives : getStoredProgress().completedObjectives
  const sectionObjectives = getSectionObjectives(sectionId)
  if (!sectionObjectives || sectionObjectives.length === 0) return false
  return sectionObjectives.every((obj) => completed.includes(obj.id))
}

/**
 * Determina si el examen de una sección ha sido aprobado.
 */
export function isExamPassed(sectionId, passedExams) {
  const passed = passedExams !== undefined ? passedExams : getStoredProgress().passedExams
  return passed.includes(sectionId)
}

/**
 * Determina el estado del examen de una sección:
 * 'passed' | 'failed' | 'not_taken'
 */
export function getExamStatus(sectionId, passedExams = [], failedExams = []) {
  if (passedExams.includes(sectionId)) return 'passed'
  if (failedExams.includes(sectionId)) return 'failed'
  return 'not_taken'
}

/**
 * Determina si una insignia de sección ya está desbloqueada permanentemente.
 */
export function isBadgeUnlocked(sectionId, unlockedBadges, completedObjectives, passedExams) {
  const current = getStoredProgress()
  const badges = unlockedBadges !== undefined ? unlockedBadges : current.unlockedBadges
  if (Array.isArray(badges) && badges.includes(sectionId)) {
    return true
  }
  const completed = completedObjectives !== undefined ? completedObjectives : current.completedObjectives
  const passed = passedExams !== undefined ? passedExams : current.passedExams

  const allLearned = areAllObjectivesLearned(sectionId, completed)
  const examPassed = isExamPassed(sectionId, passed)
  return allLearned && examPassed
}

/**
 * Comprueba si una sección está COMPLETADA.
 * REGLA ESTRICTA:
 * Una sección se completa EXCLUSIVAMENTE cuando:
 * TODOS LOS OBJETIVOS APRENDIDOS (100%) + EXAMEN APROBADO = SECCIÓN COMPLETADA
 * (o si ya poseía la insignia desbloqueada permanentemente).
 */
export function isSectionCompleted(
  sectionId,
  completedObjectives,
  passedExams,
  unlockedBadges,
) {
  const current = getStoredProgress()
  const badges = unlockedBadges !== undefined ? unlockedBadges : current.unlockedBadges
  if (Array.isArray(badges) && badges.includes(sectionId)) {
    return true
  }
  const completed = completedObjectives !== undefined ? completedObjectives : current.completedObjectives
  const passed = passedExams !== undefined ? passedExams : current.passedExams

  // Si no se han aprendido todos los objetivos de la sección, no está completada
  const allLearned = areAllObjectivesLearned(sectionId, completed)
  if (!allLearned) {
    return false
  }

  // Requiere además haber aprobado el examen de la sección
  const examPassed = isExamPassed(sectionId, passed)
  return examPassed
}

/**
 * Calcula el progreso detallado de una sección.
 */
export function getSectionProgress(
  sectionId,
  completedObjectives = [],
  passedExams = [],
  failedExams = [],
  unlockedBadges = [],
) {
  const sectionObjectives = getSectionObjectives(sectionId)
  const total = sectionObjectives.length
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      isCompleted: false,
      allObjectivesLearned: false,
      examStatus: 'not_taken',
      examPassed: false,
    }
  }

  const completed = sectionObjectives.filter((obj) =>
    completedObjectives.includes(obj.id),
  ).length
  const percentage = Math.round((completed / total) * 100)
  const allObjectivesLearned = completed === total
  const examPassed = isExamPassed(sectionId, passedExams)
  const examStatus = getExamStatus(sectionId, passedExams, failedExams)
  const isCompleted = isSectionCompleted(
    sectionId,
    completedObjectives,
    passedExams,
    unlockedBadges,
  )

  return {
    total,
    completed,
    percentage,
    isCompleted,
    allObjectivesLearned,
    examStatus,
    examPassed,
  }
}

/**
 * Calcula el progreso global de toda la Guía.
 */
export function getGlobalProgress(
  completedObjectives = [],
  passedExams = [],
  unlockedBadges = [],
) {
  const allObjectives = getAllObjectives()
  const total = allObjectives.length
  if (total === 0) {
    return { total: 0, completed: 0, percentage: 0, isCompleted: false }
  }

  const completed = allObjectives.filter((obj) =>
    completedObjectives.includes(obj.id),
  ).length
  const percentage = Math.round((completed / total) * 100)
  const isCompleted = completed === total

  return {
    total,
    completed,
    percentage,
    isCompleted,
    unlockedBadgesCount: unlockedBadges.length,
    passedExamsCount: passedExams.length,
  }
}

/**
 * Alterna explícitamente el estado de aprendido de un objetivo.
 * Requiere acción deliberada del usuario (botón "Marcar como aprendido").
 * Si la sección alcanza todos los objetivos aprendidos Y el examen ya estaba aprobado,
 * desbloquea permanentemente la insignia.
 */
export function toggleObjectiveLearned(objectiveId, sectionId) {
  const current = getStoredProgress()
  const isCurrentlyLearned = current.completedObjectives.includes(objectiveId)

  let nextCompleted
  let nextVisited = [...current.visitedObjectives]

  if (isCurrentlyLearned) {
    // Desmarcar: pasa a visitado pero no aprendido
    nextCompleted = current.completedObjectives.filter((id) => id !== objectiveId)
    if (!nextVisited.includes(objectiveId)) {
      nextVisited.push(objectiveId)
    }
  } else {
    // Marcar como aprendido
    nextCompleted = [...current.completedObjectives, objectiveId]
    nextVisited = nextVisited.filter((id) => id !== objectiveId)
  }

  let nextBadges = new Set(current.unlockedBadges)

  // Comprobar si se desbloquea insignia (todos aprendidos + examen aprobado)
  if (sectionId) {
    const allLearned = areAllObjectivesLearned(sectionId, nextCompleted)
    const examPassed = isExamPassed(sectionId, current.passedExams)

    if (allLearned && examPassed) {
      nextBadges.add(sectionId)
    } else {
      nextBadges.delete(sectionId)
    }
  }

  const updatedProgress = {
    ...current,
    completedObjectives: nextCompleted,
    visitedObjectives: nextVisited,
    unlockedBadges: Array.from(nextBadges),
  }

  saveStoredProgress(updatedProgress)
  return updatedProgress
}

/**
 * Registra el resultado de un examen de sección.
 * Si aprueba y todos los objetivos de la sección ya están aprendidos,
 * desbloquea de inmediato la insignia correspondiente.
 */
export function recordExamResult(sectionId, score, passed) {
  const current = getStoredProgress()
  const nextPassed = new Set(current.passedExams)
  const nextFailed = new Set(current.failedExams)
  const nextBadges = new Set(current.unlockedBadges)

  const allLearned = areAllObjectivesLearned(sectionId, current.completedObjectives)

  if (passed && allLearned) {
    nextPassed.add(sectionId)
    nextFailed.delete(sectionId)
    nextBadges.add(sectionId)
  } else if (!passed) {
    nextFailed.add(sectionId)
  }

  const updatedProgress = {
    ...current,
    passedExams: Array.from(nextPassed),
    failedExams: Array.from(nextFailed),
    unlockedBadges: Array.from(nextBadges),
  }

  saveStoredProgress(updatedProgress)
  return updatedProgress
}

/**
 * Hook reactivo para consumir y modificar el progreso interactivo de la Guía.
 */
export function useGuideProgress() {
  const [progress, setProgress] = useState(getStoredProgress)

  useEffect(() => {
    function handleUpdate(e) {
      if (e?.detail) {
        setProgress(e.detail)
      } else {
        setProgress(getStoredProgress())
      }
    }

    function handleStorage(e) {
      if (e.key === GUIDE_PROGRESS_KEY) {
        setProgress(getStoredProgress())
      }
    }

    window.addEventListener(GUIDE_PROGRESS_EVENT, handleUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(GUIDE_PROGRESS_EVENT, handleUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const markVisited = useCallback((objectiveId) => {
    return markObjectiveVisited(objectiveId)
  }, [])

  const toggleLearned = useCallback((objectiveId, sectionId) => {
    return toggleObjectiveLearned(objectiveId, sectionId)
  }, [])

  const saveExamResult = useCallback((sectionId, score, passed) => {
    return recordExamResult(sectionId, score, passed)
  }, [])

  const checkObjectiveState = useCallback(
    (objectiveId) =>
      getObjectiveState(
        objectiveId,
        progress.completedObjectives,
        progress.visitedObjectives,
      ),
    [progress.completedObjectives, progress.visitedObjectives],
  )

  const checkSectionCompleted = useCallback(
    (sectionId) =>
      isSectionCompleted(
        sectionId,
        progress.completedObjectives,
        progress.passedExams,
        progress.unlockedBadges,
      ),
    [progress.completedObjectives, progress.passedExams, progress.unlockedBadges],
  )

  const checkBadgeUnlocked = useCallback(
    (sectionId) =>
      isBadgeUnlocked(
        sectionId,
        progress.unlockedBadges,
        progress.completedObjectives,
        progress.passedExams,
      ),
    [progress.unlockedBadges, progress.completedObjectives, progress.passedExams],
  )

  const getSectionStats = useCallback(
    (sectionId) =>
      getSectionProgress(
        sectionId,
        progress.completedObjectives,
        progress.passedExams,
        progress.failedExams,
        progress.unlockedBadges,
      ),
    [
      progress.completedObjectives,
      progress.passedExams,
      progress.failedExams,
      progress.unlockedBadges,
    ],
  )

  const getGlobalStats = useCallback(
    () =>
      getGlobalProgress(
        progress.completedObjectives,
        progress.passedExams,
        progress.unlockedBadges,
      ),
    [progress.completedObjectives, progress.passedExams, progress.unlockedBadges],
  )

  return {
    progress,
    completedObjectives: progress.completedObjectives,
    visitedObjectives: progress.visitedObjectives,
    passedExams: progress.passedExams,
    failedExams: progress.failedExams,
    unlockedBadges: progress.unlockedBadges,
    markVisited,
    toggleLearned,
    recordExamResult: saveExamResult,
    getObjectiveState: checkObjectiveState,
    isSectionCompleted: checkSectionCompleted,
    isBadgeUnlocked: checkBadgeUnlocked,
    getSectionProgress: getSectionStats,
    getGlobalProgress: getGlobalStats,
  }
}
