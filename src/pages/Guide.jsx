import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GUIDE_SECTIONS,
  getGlossaryTerms,
  getLocalizedObjective,
  getObjectiveById,
  getSectionById,
  getSectionExam,
  getSectionObjectives,
} from '../data/guideData.js'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useGuideProgress } from '../services/guideProgress.js'
import {
  playButtonSound,
  playClickSound,
  playFavoritoSound,
  playShinySound,
} from '../utils/audio.js'

// Constante fácilmente modificable para la cantidad de objetivos por página del camino
const OBJECTIVES_PER_PAGE = 5

function Guide({
  sectionId = null,
  objectiveId = null,
  onSectionSelect,
  onObjectiveSelect,
  onBackToSection,
  onBackToGuide,
  onBack,
  onHomeClick,
  onPokedexClick,
  onMovesClick,
  onFavoritesClick,
  t,
  locale = 'es',
  onLocaleChange,
}) {
  const {
    completedObjectives,
    markVisited,
    toggleLearned,
    recordExamResult,
    getObjectiveState,
    getSectionProgress,
    getGlobalProgress,
  } = useGuideProgress()

  const guideT = t?.guide || {}
  const globalStats = getGlobalProgress()

  // Estado para el nodo seleccionado en el camino de aprendizaje
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  // Estado para la animación de destello al marcar como aprendido
  const [justLearnedId, setJustLearnedId] = useState(null)
  // Estado para la interfaz del examen
  const [isTakingExam, setIsTakingExam] = useState(false)
  const [examAnswers, setExamAnswers] = useState({})
  const [examSubmitted, setExamSubmitted] = useState(false)
  const [examScore, setExamScore] = useState(0)
  const [examPassedState, setExamPassedState] = useState(false)

  // Estado para el Diccionario competitivo
  const [dictSearch, setDictSearch] = useState('')
  const [dictCategory, setDictCategory] = useState('all')

  // Estado y referencias para paginación y trazado en zigzag del camino
  const [pathwayPage, setPathwayPage] = useState(1)
  const [svgPaths, setSvgPaths] = useState([])
  const trackRef = useRef(null)
  const nodeRefs = useRef([])

  const activeSection = sectionId ? getSectionById(sectionId) : null
  const activeObjective = objectiveId ? getObjectiveById(objectiveId) : null
  const sectionObjectives = activeSection ? getSectionObjectives(activeSection.id) : []
  const sectionStats = activeSection ? getSectionProgress(activeSection.id) : null
  const sectionExam = activeSection ? getSectionExam(activeSection.id) : null

  // Paginación dinámica del camino
  const totalObjectives = sectionObjectives.length
  const totalPages = Math.max(1, Math.ceil(totalObjectives / OBJECTIVES_PER_PAGE))
  const safePage = Math.min(Math.max(1, pathwayPage), totalPages)
  const pageStartIndex = (safePage - 1) * OBJECTIVES_PER_PAGE
  const pageEndIndex = safePage * OBJECTIVES_PER_PAGE
  const pageObjectives = useMemo(
    () => sectionObjectives.slice(pageStartIndex, pageEndIndex),
    [sectionObjectives, pageStartIndex, pageEndIndex]
  )
  const isLastPage = safePage === totalPages
  const pageRangeStart = totalObjectives > 0 ? pageStartIndex + 1 : 0
  const pageRangeEnd = Math.min(pageEndIndex, totalObjectives)

  // Lista de elementos visibles en la página actual (incluye evaluación al final si es la última página)
  const pageItems = useMemo(() => {
    const items = pageObjectives.map((obj, idx) => ({
      type: 'objective',
      objective: obj,
      globalIndex: pageStartIndex + idx,
    }))
    if (isLastPage) {
      items.push({
        type: 'exam',
        globalIndex: totalObjectives,
      })
    }
    return items
  }, [pageObjectives, isLastPage, pageStartIndex, totalObjectives])

  // Si se ingresa a un objetivo en vista profunda, marcarlo automáticamente como VISITADO (Estado 2: ◉)
  // IMPORTANTE: Esto NUNCA lo marca como aprendido (Estado 3: ✓)
  useEffect(() => {
    if (objectiveId) {
      markVisited(objectiveId)
    }
  }, [objectiveId, markVisited])

  // Ajustar el nodo activo inicial y página del camino al cambiar de sección
  useEffect(() => {
    if (sectionObjectives.length > 0) {
      const firstUncompleted = sectionObjectives.find(
        (obj) => !completedObjectives.includes(obj.id),
      )
      const targetId = firstUncompleted ? firstUncompleted.id : sectionObjectives[0].id
      setSelectedNodeId(targetId)

      const targetIdx = sectionObjectives.findIndex((o) => o.id === targetId)
      if (targetIdx !== -1) {
        setPathwayPage(Math.floor(targetIdx / OBJECTIVES_PER_PAGE) + 1)
      } else {
        setPathwayPage(1)
      }
    } else {
      setPathwayPage(1)
    }
  }, [sectionId])

  // Reiniciar estado de examen al cambiar de sección
  useEffect(() => {
    setIsTakingExam(false)
    setExamAnswers({})
    setExamSubmitted(false)
  }, [sectionId])

  function handleBackClick() {
    playButtonSound()
    if (isTakingExam) {
      setIsTakingExam(false)
      return
    }
    if (objectiveId && onBackToSection && activeSection) {
      onBackToSection(activeSection.id)
    } else if (sectionId && onBackToGuide) {
      onBackToGuide()
    } else if (onBack) {
      onBack()
    } else if (onHomeClick) {
      onHomeClick()
    }
  }

  function handleSectionClick(targetSectionId) {
    playButtonSound()
    if (onSectionSelect) {
      onSectionSelect(targetSectionId)
    }
  }

  function handleObjectiveClick(targetObjectiveId) {
    playButtonSound()
    if (onObjectiveSelect && activeSection) {
      onObjectiveSelect(activeSection.id, targetObjectiveId)
    }
  }

  function handleNodeSelect(targetObjectiveId) {
    playClickSound()
    setSelectedNodeId(targetObjectiveId)
  }

  // Trazado dinámico de líneas del camino en zigzag entre los centros de los nodos
  const updateSvgPaths = useCallback(() => {
    if (!trackRef.current) return
    const trackRect = trackRef.current.getBoundingClientRect()
    if (trackRect.width === 0 || trackRect.height === 0) return

    const newPaths = []
    const elements = nodeRefs.current

    for (let i = 0; i < pageItems.length - 1; i++) {
      const el1 = elements[i]
      const el2 = elements[i + 1]
      if (!el1 || !el2) continue

      const r1 = el1.getBoundingClientRect()
      const r2 = el2.getBoundingClientRect()

      const x1 = r1.left + r1.width / 2 - trackRect.left
      const y1 = r1.top + r1.height / 2 - trackRect.top
      const x2 = r2.left + r2.width / 2 - trackRect.left
      const y2 = r2.top + r2.height / 2 - trackRect.top

      const dy = y2 - y1
      const cp1Y = y1 + dy * 0.5
      const cp2Y = y2 - dy * 0.5
      const d = `M ${x1} ${y1} C ${x1} ${cp1Y}, ${x2} ${cp2Y}, ${x2} ${y2}`

      const currentItem = pageItems[i]
      const isCompleted =
        currentItem.type === 'objective' &&
        getObjectiveState(currentItem.objective.id) === 'learned'

      newPaths.push({ d, isCompleted })
    }

    setSvgPaths(newPaths)
  }, [pageItems, getObjectiveState])

  useEffect(() => {
    updateSvgPaths()
    const handleResize = () => updateSvgPaths()
    window.addEventListener('resize', handleResize)

    let observer = null
    if (trackRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateSvgPaths()
      })
      observer.observe(trackRef.current)
    }

    const timer1 = setTimeout(updateSvgPaths, 60)
    const timer2 = setTimeout(updateSvgPaths, 250)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (observer) observer.disconnect()
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [updateSvgPaths, safePage])

  // Cambio de página en el camino
  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages || newPage === safePage) return
    playButtonSound()
    setPathwayPage(newPage)

    const targetStart = (newPage - 1) * OBJECTIVES_PER_PAGE
    const targetEnd = newPage * OBJECTIVES_PER_PAGE
    const targetObjs = sectionObjectives.slice(targetStart, targetEnd)

    const isCurrentInTarget =
      targetObjs.some((o) => o.id === selectedNodeId) ||
      (newPage === totalPages && selectedNodeId === 'exam')

    if (!isCurrentInTarget && targetObjs.length > 0) {
      setSelectedNodeId(targetObjs[0].id)
    }
  }

  function handleToggleLearned(targetObjectiveId, targetSectionId) {
    playFavoritoSound()
    setJustLearnedId(targetObjectiveId)
    setTimeout(() => setJustLearnedId(null), 800)
    toggleLearned(targetObjectiveId, targetSectionId)
  }

  function handleStartExam() {
    if (!sectionStats?.allObjectivesLearned && !sectionStats?.examPassed) {
      return
    }
    playButtonSound()
    setExamAnswers({})
    setExamSubmitted(false)
    setIsTakingExam(true)
  }

  function handleSelectExamOption(questionId, optionId) {
    playClickSound()
    if (examSubmitted) return
    setExamAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  function handleSubmitExam() {
    if (!sectionExam) return
    const totalQuestions = sectionExam.questions.length
    if (totalQuestions === 0) return

    let correctCount = 0
    sectionExam.questions.forEach((q) => {
      if (examAnswers[q.id] === q.correctOptionId) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / totalQuestions) * 100)
    const passed = score >= sectionExam.passingScore

    setExamScore(score)
    setExamPassedState(passed)
    setExamSubmitted(true)

    if (passed) {
      playShinySound()
    } else {
      playButtonSound()
    }

    recordExamResult(activeSection.id, score, passed)
  }

  const activeSectionTranslation = activeSection
    ? guideT?.sections?.[activeSection.id] || {}
    : null
  const activeSectionTitle =
    activeSectionTranslation?.name ||
    activeSectionTranslation?.title ||
    activeSection?.id ||
    ''
  const activeSectionDesc = activeSectionTranslation?.description || ''

  const dictionaryList = useMemo(() => {
    return getGlossaryTerms(dictSearch, dictCategory)
  }, [dictSearch, dictCategory])

  return (
    <div className="page-shell">
      <Navbar
        t={t}
        locale={locale}
        onLocaleChange={onLocaleChange}
        activeNav="guide"
        onHomeClick={onHomeClick}
        onPokedexClick={onPokedexClick}
        onMovesClick={onMovesClick}
        onFavoritesClick={onFavoritesClick}
        onGuideClick={onBackToGuide || onBackClick}
      />

      <main className={`guide-page ${objectiveId ? 'has-deepdive' : ''}`}>
        {/* ================================================================= */}
        {/* CASO A: Diccionario Competitivo (Experiencia Dedicada)             */}
        {/* ================================================================= */}
        {activeSection && activeSection.id === 'glossary' ? (
          <div className="guide-dictionary-experience">
            <div className="guide-top-nav">
              <button className="guide-back-btn" type="button" onClick={handleBackClick}>
                <span aria-hidden="true">←</span> {guideT.backToGuide || 'Volver a Guía'}
              </button>
            </div>

            <header className="guide-header">
              <p className="eyebrow">{guideT.eyebrow || 'EDUCACIÓN COMPETITIVA'}</p>
              <h1 className="guide-title">
                {guideT.dictionaryTitle || 'Diccionario competitivo'}
              </h1>
              <p className="guide-subtitle">
                {guideT.dictionarySubtitle ||
                  'Consulta rápida de términos y jerga de Pokémon competitivo explicados de forma clara y directa.'}
              </p>
            </header>

            <div className="guide-dictionary-view">
              <div className="guide-dict-search-bar">
                <span style={{ marginRight: 10, fontSize: 18 }} aria-hidden="true">
                  🔍
                </span>
                <input
                  type="search"
                  className="guide-dict-search-input"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    boxShadow: 'none',
                    WebkitBoxShadow: 'none',
                    WebkitAppearance: 'none',
                  }}
                  placeholder={
                    guideT.searchDictionary ||
                    'Buscar término competitivo (ej. STAB, EV, Sweeper)...'
                  }
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                />
                {dictSearch && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: 'var(--theme-text-secondary)',
                    }}
                    onClick={() => setDictSearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="guide-dict-filters-row" role="tablist">
                {['all', 'Mecánicas', 'Estadísticas', 'Roles', 'Estrategias'].map(
                  (catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      className={`guide-dict-filter-chip ${dictCategory === catKey ? 'is-active' : ''}`}
                      onClick={() => {
                        playClickSound()
                        setDictCategory(catKey)
                      }}
                    >
                      {catKey === 'all' ? guideT.allCategories || 'Todos' : catKey}
                    </button>
                  ),
                )}
              </div>

              <div className="guide-dict-grid">
                {dictionaryList.map((item) => {
                  const simpleText =
                    locale === 'en'
                      ? item.simpleExplanation.en
                      : item.simpleExplanation.es
                  const inShortText =
                    locale === 'en' ? item.inShort.en : item.inShort.es

                  return (
                    <article key={item.term} className="guide-dict-card">
                      <div>
                        <div className="guide-dict-card-top">
                          <h3 className="guide-dict-term-title">{item.term}</h3>
                          <span className="guide-dict-category-tag">{item.category}</span>
                        </div>
                        <p className="guide-dict-simple-text">{simpleText}</p>
                        <div className="guide-dict-inshort-box">
                          <strong>{guideT.inShort || 'En pocas palabras:'} </strong>
                          <span>{inShortText}</span>
                        </div>
                      </div>

                      {item.deepDiveSectionId && (
                        <button
                          type="button"
                          className="guide-dict-deepdive-link"
                          onClick={() => handleSectionClick(item.deepDiveSectionId)}
                        >
                          {guideT.deepDiveLink || 'Profundizar en la Guía'} ↗
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        ) : activeSection && objectiveId && activeObjective ? (
          /* =============================================================== */
          /* CASO B: Página Profunda del Objetivo (Deep Dive View)             */
          /* =============================================================== */
          <div className="guide-deepdive-page">
            <div className="guide-top-nav">
              <button className="guide-back-btn" type="button" onClick={handleBackClick}>
                <span aria-hidden="true">←</span>{' '}
                {activeSectionTitle || guideT.backToGuide || 'Volver'}
              </button>
            </div>

            <div className="guide-deepdive-layout">
              {/* Índice de la Sección (Índice lateral flotante a la izquierda) */}
              <aside
                className="guide-context-nav"
                aria-label={guideT.contextNavTitle || 'Índice de la sección'}
              >
                <div className="guide-context-nav-header">
                  <p className="guide-context-nav-eyebrow">
                    {guideT.contextNavTitle || 'ÍNDICE DE LA SECCIÓN'}
                  </p>
                  <h4 className="guide-context-nav-title">
                    <span aria-hidden="true">{activeSection.icon}</span>{' '}
                    {activeSectionTitle}
                  </h4>
                </div>

                <nav className="guide-context-nav-list">
                  {sectionObjectives.map((rawObj) => {
                    const objLoc = getLocalizedObjective(rawObj, locale)
                    const state = getObjectiveState(rawObj.id)
                    const isCurrent = rawObj.id === activeObjective.id

                    return (
                      <div
                        key={rawObj.id}
                        className={`guide-context-nav-item state-${state} ${
                          isCurrent ? 'is-current' : ''
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleObjectiveClick(rawObj.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            handleObjectiveClick(rawObj.id)
                          }
                        }}
                      >
                        <span className="guide-context-state-icon" aria-hidden="true" />
                        <span className="guide-context-item-text">{objLoc.title}</span>
                      </div>
                    )
                  })}
                </nav>
              </aside>

              {/* Contenido Principal */}
              <div className="guide-deepdive-main">
                <article className="guide-deepdive-article">
                  {/* Cabecera del Objetivo */}
                  <header className="guide-deepdive-header">
                    <p className="eyebrow">
                      <span aria-hidden="true">{activeSection.icon}</span>{' '}
                      {activeSectionTitle}
                    </p>
                    <h1 className="guide-deepdive-title">
                      {getLocalizedObjective(activeObjective, locale).title}
                    </h1>
                    <p className="guide-deepdive-intro">
                      {getLocalizedObjective(activeObjective, locale).lesson.introduction ||
                        getLocalizedObjective(activeObjective, locale).description}
                    </p>
                  </header>

                  {/* Cuerpo Educativo */}
                  <div className="guide-deepdive-body">
                    {/* Secciones de la Mini-lección */}
                    {getLocalizedObjective(activeObjective, locale).lesson.sections.map(
                      (sec, idx) => (
                        <section key={idx} className="guide-deepdive-section">
                          <h3>{sec.title}</h3>
                          <p>{sec.content}</p>
                        </section>
                      ),
                    )}

                    {/* Secciones Profundas (Deep Dive) */}
                    {getLocalizedObjective(activeObjective, locale).deepDive.sections.map(
                      (sec, idx) => (
                        <section key={`deep-${idx}`} className="guide-deepdive-section">
                          <h3>{sec.title}</h3>
                          <p>{sec.content}</p>
                        </section>
                      ),
                    )}

                    {/* Ejemplos Prácticos */}
                    {getLocalizedObjective(activeObjective, locale).deepDive.examples.map(
                      (ex, idx) => (
                        <div key={`ex-${idx}`} className="guide-example-card">
                          <h4 className="guide-example-title">
                            <span aria-hidden="true">🎯</span> {ex.title}
                          </h4>
                          <p className="guide-example-desc">{ex.description}</p>
                        </div>
                      ),
                    )}

                    {/* Caja: 💡 Lo importante (Key Takeaways) */}
                    {(getLocalizedObjective(activeObjective, locale).lesson.summary ||
                      getLocalizedObjective(activeObjective, locale).deepDive.summary) && (
                      <div className="guide-key-takeaway-box">
                        <div className="guide-takeaway-header">
                          <span aria-hidden="true">💡</span>
                          <span>{guideT.keyTakeaway || 'Lo importante'}</span>
                        </div>
                        <p className="guide-takeaway-text">
                          {getLocalizedObjective(activeObjective, locale).lesson.summary ||
                            getLocalizedObjective(activeObjective, locale).deepDive.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acción: Marcar como aprendido */}
                  <div className="guide-learn-action-area">
                    <button
                      type="button"
                      className={`guide-mark-learned-btn ${
                        completedObjectives.includes(activeObjective.id)
                          ? 'is-learned-active'
                          : ''
                      } ${justLearnedId === activeObjective.id ? 'just-learned-flash' : ''}`}
                      onClick={() =>
                        handleToggleLearned(activeObjective.id, activeSection.id)
                      }
                    >
                      <span aria-hidden="true">
                        {completedObjectives.includes(activeObjective.id) ? '✓' : '○'}
                      </span>
                      <span>
                        {completedObjectives.includes(activeObjective.id)
                          ? guideT.alreadyLearned || 'Aprendido'
                          : guideT.markAsLearned || 'Marcar como aprendido'}
                      </span>
                    </button>

                    <span className="guide-review-hint">
                      {guideT.reviewNotice ||
                        'El contenido siempre está disponible para repasar.'}
                    </span>
                  </div>
                </article>

                {/* Navegación al Siguiente Concepto */}
                {activeObjective.nextObjectiveId ? (
                  (() => {
                    const nextObj = getObjectiveById(activeObjective.nextObjectiveId)
                    if (!nextObj) return null
                    const nextLocalized = getLocalizedObjective(nextObj, locale)
                    return (
                      <div className="guide-next-concept-card">
                        <div className="guide-next-concept-info">
                          <span className="guide-next-concept-eyebrow">
                            {guideT.nextConcept || 'Siguiente concepto'}
                          </span>
                          <h4 className="guide-next-concept-title">
                            {nextLocalized.title}
                          </h4>
                          <p className="guide-next-concept-desc">
                            {nextLocalized.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="guide-next-concept-btn"
                          onClick={() => handleObjectiveClick(nextObj.id)}
                        >
                          <span>{guideT.continueNext || 'Continuar'}</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    )
                  })()
                ) : (
                  /* Último concepto -> invita al Examen de la Sección o indica bloqueo si faltan objetivos */
                  sectionStats?.allObjectivesLearned || sectionStats?.examPassed ? (
                    <div className="guide-next-concept-card" style={{ borderColor: '#f59e0b' }}>
                      <div className="guide-next-concept-info">
                        <span
                          className="guide-next-concept-eyebrow"
                          style={{ color: '#d97706' }}
                        >
                          {guideT.sectionExamTitle || 'Evaluación de la sección'}
                        </span>
                        <h4 className="guide-next-concept-title">
                          {locale === 'en'
                            ? 'Ready for the Section Evaluation?'
                            : '¿Listo para la Evaluación de la Sección?'}
                        </h4>
                        <p className="guide-next-concept-desc">
                          {locale === 'en'
                            ? 'Test your understanding to unlock the section badge.'
                            : 'Pon a prueba tus conocimientos para desbloquear la insignia.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="guide-next-concept-btn"
                        style={{
                          background: '#f59e0b',
                          color: '#ffffff',
                          borderColor: '#f59e0b',
                        }}
                        onClick={() => {
                          onBackToSection(activeSection.id)
                          setTimeout(() => handleStartExam(), 80)
                        }}
                      >
                        <span>{guideT.takeExam || 'Realizar examen'}</span>
                        <span aria-hidden="true">🎓</span>
                      </button>
                    </div>
                  ) : (
                    <div className="guide-next-concept-card" style={{ borderColor: 'var(--theme-border, rgba(211, 220, 214, 0.75))' }}>
                      <div className="guide-next-concept-info">
                        <span
                          className="guide-next-concept-eyebrow"
                          style={{ color: 'var(--theme-text-secondary, #6c747d)' }}
                        >
                          🔒 {guideT.sectionExamTitle || 'Evaluación de la sección'}
                        </span>
                        <h4 className="guide-next-concept-title">
                          {locale === 'en'
                            ? 'Complete all objectives to unlock'
                            : 'Completa todos los objetivos para desbloquear'}
                        </h4>
                        <p className="guide-next-concept-desc">
                          {locale === 'en'
                            ? `You must mark all objectives in this section as learned (${sectionStats?.completed || 0}/${sectionStats?.total || 0}) before taking the evaluation.`
                            : `Debes marcar todos los objetivos de esta sección como aprendidos (${sectionStats?.completed || 0}/${sectionStats?.total || 0}) antes de realizar la evaluación.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="guide-next-concept-btn"
                        onClick={() => onBackToSection(activeSection.id)}
                      >
                        <span>{locale === 'en' ? 'Review pathway' : 'Ver camino de aprendizaje'}</span>
                        <span aria-hidden="true">←</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : activeSection ? (
          /* =============================================================== */
          /* CASO C: Vista de Sección (Camino de Aprendizaje / Examen)        */
          /* =============================================================== */
          <div className="guide-section-view">
            <div className="guide-top-nav">
              <button className="guide-back-btn" type="button" onClick={handleBackClick}>
                <span aria-hidden="true">←</span> {guideT.backToGuide || 'Volver a Guía'}
              </button>
            </div>

            <header className="guide-section-page-header">
              <p className="eyebrow">{guideT.eyebrow || 'EDUCACIÓN COMPETITIVA'}</p>
              <div className="guide-section-hero">
                <span className="guide-section-hero-icon" aria-hidden="true">
                  {activeSection.icon}
                </span>
                <div className="guide-section-hero-text">
                  <h1>{activeSectionTitle}</h1>
                  <p>{activeSectionDesc}</p>
                </div>
              </div>
            </header>

            {/* Banner de progreso y estado de examen */}
            <div className="guide-section-progress-banner">
              <div className="guide-section-progress-left">
                <div className="guide-section-progress-info">
                  <span className="guide-section-progress-count">
                    {sectionStats.completed}/{sectionStats.total}{' '}
                    {locale === 'en' ? 'objectives learned' : 'objetivos aprendidos'}
                  </span>
                  <span className="guide-section-progress-pct">
                    ({sectionStats.percentage}%)
                  </span>
                </div>
                <div className="guide-progress-bar-track" aria-hidden="true">
                  <div
                    className="guide-progress-bar-fill"
                    style={{ width: `${sectionStats.percentage}%` }}
                  />
                </div>
              </div>

              {/* Insignia / Estado de Sección */}
              {sectionStats.isCompleted ? (
                <div className="guide-section-complete-chip">
                  <span aria-hidden="true">✓</span>
                  <span>{guideT.sectionCompletedText || 'Sección completada'}</span>
                </div>
              ) : sectionStats.allObjectivesLearned ? (
                <button
                  type="button"
                  className="guide-preview-action-btn"
                  style={{ background: '#f59e0b', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}
                  onClick={handleStartExam}
                >
                  <span aria-hidden="true">🎯</span>
                  <span>{guideT.takeExam || 'Realizar examen'}</span>
                </button>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--theme-text-secondary)' }}>
                  {guideT.examLockedNotice ||
                    'Completa los objetivos para desbloquear el examen'}
                </span>
              )}
            </div>

            {/* Interfaz Interactiva de Examen */}
            {isTakingExam && sectionExam ? (
              <div className="guide-exam-view">
                <header className="guide-exam-header">
                  <p className="eyebrow" style={{ color: '#f59e0b' }}>
                    <span aria-hidden="true">🎓</span>{' '}
                    {guideT.sectionExamTitle || 'Evaluación de la sección'}
                  </p>
                  <h1>
                    {locale === 'en' ? sectionExam.title.en : sectionExam.title.es}
                  </h1>
                  <p>
                    {locale === 'en'
                      ? sectionExam.description.en
                      : sectionExam.description.es}
                  </p>
                </header>

                {!examSubmitted ? (
                  <div>
                    {sectionExam.questions.map((q, qIndex) => {
                      const promptText = locale === 'en' ? q.prompt.en : q.prompt.es
                      const selectedOptId = examAnswers[q.id]

                      return (
                        <div key={q.id} className="guide-exam-question-card">
                          <h4 className="guide-exam-prompt">
                            {qIndex + 1}. {promptText}
                          </h4>
                          <div className="guide-exam-options-list">
                            {q.options.map((opt) => {
                              const optText = locale === 'en' ? opt.text.en : opt.text.es
                              const isSelected = selectedOptId === opt.id

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={`guide-exam-option-btn ${
                                    isSelected ? 'is-selected' : ''
                                  }`}
                                  onClick={() => handleSelectExamOption(q.id, opt.id)}
                                >
                                  <span
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      border: '2px solid currentColor',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 11,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {isSelected ? '●' : opt.id.toUpperCase()}
                                  </span>
                                  <span>{optText}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                      <button
                        type="button"
                        className="guide-preview-action-btn"
                        style={{
                          background:
                            Object.keys(examAnswers).length === sectionExam.questions.length
                              ? '#10b981'
                              : 'var(--theme-text-muted)',
                        }}
                        disabled={
                          Object.keys(examAnswers).length !== sectionExam.questions.length
                        }
                        onClick={handleSubmitExam}
                      >
                        {locale === 'en' ? 'Submit evaluation' : 'Enviar evaluación'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Resultados del Examen */
                  <div className="guide-exam-results">
                    <div className="guide-exam-result-icon">
                      {examPassedState ? '🏆' : '📚'}
                    </div>
                    <h3 className="guide-exam-result-title">
                      {examPassedState
                        ? locale === 'en'
                          ? 'Evaluation Passed!'
                          : '¡Evaluación Aprobada!'
                        : locale === 'en'
                        ? 'Evaluation Not Passed'
                        : 'Evaluación no superada'}
                    </h3>
                    <div className="guide-exam-result-score">{examScore}%</div>
                    <p style={{ maxWidth: 540, margin: '0 auto', fontSize: 15 }}>
                      {examPassedState
                        ? locale === 'en'
                          ? 'Congratulations! You demonstrated full understanding of this section’s core principles and unlocked the section badge.'
                          : '¡Felicidades! Has demostrado comprender los principios de esta sección y desbloqueaste la insignia de la sección.'
                        : locale === 'en'
                        ? 'You can review any concepts and retry the evaluation as many times as you like with zero penalty.'
                        : 'Puedes repasar los conceptos y volver a intentarlo las veces que necesites sin penalización.'}
                    </p>

                    <div className="guide-exam-actions-row">
                      <button
                        type="button"
                        className="guide-preview-action-btn"
                        onClick={handleStartExam}
                      >
                        {guideT.retakeExam || 'Reintentar examen'}
                      </button>
                      <button
                        type="button"
                        className="guide-back-btn"
                        onClick={() => setIsTakingExam(false)}
                      >
                        {locale === 'en' ? 'Return to pathway' : 'Volver al camino'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Camino de Aprendizaje Visual (Learning Pathway) */
              <div className="guide-pathway-container">
                <div className="guide-pathway-header">
                  <h2>
                    {locale === 'en' ? 'Learning Pathway' : 'Camino de Aprendizaje'}
                  </h2>
                  <p>
                    {locale === 'en'
                      ? 'Follow the progressive trail. Tap any concept to preview its overview.'
                      : 'Sigue el recorrido progresivo. Toca cualquier concepto para ver su introducción.'}
                  </p>
                </div>

                {/* Navegación superior de páginas del camino */}
                {totalPages > 1 && (
                  <div
                    className="guide-pathway-pagination"
                    role="navigation"
                    aria-label={locale === 'en' ? 'Pathway pagination' : 'Paginación del camino'}
                  >
                    <div className="guide-pagination-controls">
                      {/* Flecha anterior */}
                      <button
                        type="button"
                        className="guide-page-nav-btn is-prev"
                        disabled={safePage === 1}
                        onClick={() => handlePageChange(safePage - 1)}
                        aria-label={locale === 'en' ? 'Previous page' : 'Página anterior'}
                        title={locale === 'en' ? 'Previous page' : 'Página anterior'}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>

                      {/* Números de página con separadores elegantes — */}
                      <div className="guide-page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum, idx) => (
                          <div key={pageNum} className="guide-page-num-wrap">
                            {idx > 0 && (
                              <span className="guide-page-sep" aria-hidden="true">
                                —
                              </span>
                            )}
                            <button
                              type="button"
                              className={`guide-page-num-btn ${safePage === pageNum ? 'is-active' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                              aria-label={
                                locale === 'en'
                                  ? `Go to page ${pageNum}${safePage === pageNum ? ' (current)' : ''}`
                                  : `Ir a la página ${pageNum}${safePage === pageNum ? ' (actual)' : ''}`
                              }
                              aria-current={safePage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Flecha siguiente */}
                      <button
                        type="button"
                        className="guide-page-nav-btn is-next"
                        disabled={safePage === totalPages}
                        onClick={() => handlePageChange(safePage + 1)}
                        aria-label={locale === 'en' ? 'Next page' : 'Página siguiente'}
                        title={locale === 'en' ? 'Next page' : 'Página siguiente'}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>

                    {/* Indicador discreto de objetivos mostrados */}
                    <div className="guide-page-range-badge">
                      <span>
                        {locale === 'en'
                          ? `Objectives ${pageRangeStart}–${pageRangeEnd} of ${totalObjectives}`
                          : `Objetivos ${pageRangeStart}–${pageRangeEnd} de ${totalObjectives}`}
                        {isLastPage && (
                          <span className="guide-range-exam-addon">
                            {locale === 'en' ? ' + Evaluation' : ' + Evaluación'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Recorrido en Zigzag con líneas conectadas */}
                <div
                  className="guide-pathway-zigzag-track"
                  ref={trackRef}
                  key={`page-${safePage}`}
                >
                  {/* Líneas SVG del camino que conectan los centros de los nodos */}
                  <svg className="guide-pathway-zigzag-svg" aria-hidden="true">
                    {svgPaths.map((seg, i) => (
                      <path
                        key={i}
                        d={seg.d}
                        className={`guide-pathway-svg-line ${seg.isCompleted ? 'is-completed' : ''}`}
                      />
                    ))}
                  </svg>

                  {/* Lista de nodos alternados en zigzag */}
                  <div className="guide-pathway-zigzag-list">
                    {pageItems.map((item, localIndex) => {
                      const isLeft = localIndex % 2 === 0

                      if (item.type === 'objective') {
                        const obj = item.objective
                        const objLoc = getLocalizedObjective(obj, locale)
                        const state = getObjectiveState(obj.id)
                        const isSelected = obj.id === selectedNodeId
                        const isLearned = state === 'learned'

                        return (
                          <div
                            key={obj.id}
                            className={`guide-zigzag-row ${isLeft ? 'is-left' : 'is-right'}`}
                          >
                            <div className="guide-pathway-node-wrap">
                              <button
                                ref={(el) => {
                                  nodeRefs.current[localIndex] = el
                                }}
                                type="button"
                                className={`guide-pathway-node is-${state} ${
                                  isSelected ? 'is-current-active' : ''
                                } ${justLearnedId === obj.id ? 'just-learned-flash' : ''}`}
                                aria-label={`${objLoc.title} (${state})`}
                                onClick={() => handleNodeSelect(obj.id)}
                              >
                                {state === 'learned' ? (
                                  <svg
                                    className="node-tick-green"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : state === 'visited' ? (
                                  <svg
                                    className="node-tick-gray"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <span className="node-symbol">○</span>
                                )}
                              </button>
                            </div>

                            <button
                              type="button"
                              className={`guide-zigzag-label-wrap ${
                                isSelected ? 'is-current-active' : ''
                              }`}
                              onClick={() => handleNodeSelect(obj.id)}
                            >
                              <span className="guide-zigzag-step-badge">
                                {item.globalIndex + 1}
                              </span>
                              <span className="guide-zigzag-title">{objLoc.title}</span>
                              {isLearned && (
                                <span className="guide-zigzag-check-tag" aria-hidden="true">
                                  ✓
                                </span>
                              )}
                            </button>
                          </div>
                        )
                      }

                      // Nodo de Evaluación / Examen en la última página
                      return (
                        <div
                          key="exam-node"
                          className={`guide-zigzag-row ${isLeft ? 'is-left' : 'is-right'}`}
                        >
                          <div className="guide-pathway-node-wrap">
                            <button
                              ref={(el) => {
                                nodeRefs.current[localIndex] = el
                              }}
                              type="button"
                              className={`guide-pathway-node guide-pathway-exam-node ${
                                sectionStats?.examPassed
                                  ? 'is-passed'
                                  : !sectionStats?.allObjectivesLearned
                                  ? 'is-locked'
                                  : 'is-ready'
                              } ${selectedNodeId === 'exam' ? 'is-current-active' : ''}`}
                              aria-label={
                                !sectionStats?.allObjectivesLearned && !sectionStats?.examPassed
                                  ? `${guideT.sectionExamTitle || 'Evaluación de la sección'} (${guideT.examLockedNotice || 'Bloqueado'})`
                                  : (guideT.sectionExamTitle || 'Examen de la sección')
                              }
                              title={
                                !sectionStats?.allObjectivesLearned && !sectionStats?.examPassed
                                  ? guideT.examLockedNotice || 'Completa todos los objetivos anteriores para desbloquear la evaluación'
                                  : ''
                              }
                              onClick={() => {
                                if (sectionStats?.allObjectivesLearned || sectionStats?.examPassed) {
                                  handleStartExam()
                                } else {
                                  playClickSound()
                                  setSelectedNodeId('exam')
                                }
                              }}
                            >
                              <span style={{ fontSize: 22 }} aria-hidden="true">
                                {sectionStats?.examPassed
                                  ? '🎓'
                                  : !sectionStats?.allObjectivesLearned
                                  ? '🔒'
                                  : '🎓'}
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            className={`guide-zigzag-label-wrap ${
                              selectedNodeId === 'exam' ? 'is-current-active' : ''
                            }`}
                            onClick={() => {
                              if (sectionStats?.allObjectivesLearned || sectionStats?.examPassed) {
                                handleStartExam()
                              } else {
                                playClickSound()
                                setSelectedNodeId('exam')
                              }
                            }}
                          >
                            <span className="guide-zigzag-step-badge">🎓</span>
                            <span className="guide-zigzag-title">
                              {sectionStats?.examPassed
                                ? guideT.examPassed || 'Aprobado'
                                : guideT.sectionExamTitle || 'Evaluación de la sección'}
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tarjeta Introductoria del Objetivo Seleccionado (Preview Card) */}
                {selectedNodeId === 'exam' ? (
                  <div
                    className="guide-node-preview-card"
                    style={{
                      borderColor:
                        !sectionStats?.allObjectivesLearned && !sectionStats?.examPassed
                          ? 'rgba(239, 68, 68, 0.35)'
                          : 'rgba(245, 158, 11, 0.45)',
                    }}
                  >
                    <div className="guide-preview-content">
                      <p
                        className="guide-preview-eyebrow"
                        style={{
                          color:
                            !sectionStats?.allObjectivesLearned && !sectionStats?.examPassed
                              ? '#ef4444'
                              : '#d97706',
                        }}
                      >
                        {!sectionStats?.allObjectivesLearned && !sectionStats?.examPassed
                          ? `🔒 ${guideT.examLockedNotice || 'EVALUACIÓN BLOQUEADA'}`
                          : `🎓 ${guideT.sectionExamTitle || 'EVALUACIÓN DE LA SECCIÓN'}`}
                      </p>
                      <h3 className="guide-preview-title">
                        {sectionStats?.examPassed ? '🎓 ' : !sectionStats?.allObjectivesLearned ? '🔒 ' : '🎯 '}
                        {guideT.sectionExamTitle || 'Evaluación de la sección'}
                      </h3>
                      <p className="guide-preview-desc">
                        {!sectionStats?.allObjectivesLearned && !sectionStats?.examPassed
                          ? locale === 'en'
                            ? `You must complete and learn all ${sectionStats?.total || 0} objectives in this section before taking the evaluation. Current progress: ${sectionStats?.completed || 0}/${sectionStats?.total || 0} learned.`
                            : `Debes completar y marcar como aprendidos los ${sectionStats?.total || 0} objetivos de esta sección antes de realizar la evaluación. Progreso actual: ${sectionStats?.completed || 0}/${sectionStats?.total || 0} aprendidos.`
                          : locale === 'en'
                          ? 'Test your understanding to unlock the permanent section badge!'
                          : '¡Pon a prueba tus conocimientos para desbloquear la insignia de la sección!'}
                      </p>
                    </div>

                    {sectionStats?.allObjectivesLearned || sectionStats?.examPassed ? (
                      <button
                        type="button"
                        className="guide-preview-action-btn"
                        style={{ background: '#f59e0b' }}
                        onClick={handleStartExam}
                      >
                        <span aria-hidden="true">🎯</span>
                        <span>{guideT.takeExam || 'Realizar examen'}</span>
                      </button>
                    ) : (
                      <div className="guide-exam-locked-pill">
                        <span>
                          🔒 {sectionStats?.completed || 0}/{sectionStats?.total || 0}{' '}
                          {locale === 'en' ? 'learned' : 'aprendidos'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  selectedNodeId &&
                  (() => {
                    const selObj = getObjectiveById(selectedNodeId)
                    if (!selObj) return null
                    const selLoc = getLocalizedObjective(selObj, locale)

                    return (
                      <div className="guide-node-preview-card">
                        <div className="guide-preview-content">
                          <p className="guide-preview-eyebrow">
                            {guideT.previewCardTitle || 'Introducción al concepto'}
                          </p>
                          <h3 className="guide-preview-title">
                            {activeSection.icon} {selLoc.title}
                          </h3>
                          <p className="guide-preview-desc">{selLoc.description}</p>
                        </div>

                        {/* IMPORTANTE: En esta tarjeta NO se muestra "Marcar como aprendido" */}
                        <button
                          type="button"
                          className="guide-preview-action-btn"
                          onClick={() => handleObjectiveClick(selObj.id)}
                        >
                          <span aria-hidden="true">📚</span>
                          <span>{guideT.learnMore || 'Aprender más'}</span>
                        </button>
                      </div>
                    )
                  })()
                )}
              </div>
            )}
          </div>
        ) : (
          /* =============================================================== */
          /* CASO D: Vista Principal de la Guía                              */
          /* =============================================================== */
          <div className="guide-main-view">
            <div className="guide-top-nav">
              <button className="guide-back-btn" type="button" onClick={handleBackClick}>
                <span aria-hidden="true">←</span> {guideT.backHome || 'Volver al inicio'}
              </button>
            </div>

            <header className="guide-header">
              <p className="eyebrow">{guideT.eyebrow || 'EDUCACIÓN COMPETITIVA'}</p>
              <h1 className="guide-title">
                {guideT.title || 'Guía'} <em>{guideT.titleAccent || 'competitiva.'}</em>
              </h1>
              <p className="guide-subtitle">
                {guideT.subtitle ||
                  'Aprende Pokémon competitivo de forma clara y progresiva. Desde los conceptos básicos hasta la construcción de equipos.'}
              </p>
            </header>

            {/* Progreso Global */}
            <section className="guide-progress-card">
              <div className="guide-progress-header">
                <div className="guide-progress-meta">
                  <span className="guide-progress-label">
                    {guideT.progressTitle || 'Tu progreso'}
                  </span>
                  <span className="guide-progress-stats">
                    {(guideT.progressCount || '{completed}/{total} objetivos completados')
                      .replace('{completed}', globalStats.completed)
                      .replace('{total}', globalStats.total)}
                  </span>
                </div>
                <div className="guide-progress-percentage-pill">
                  {globalStats.percentage}%
                </div>
              </div>

              <div className="guide-progress-bar-track" aria-hidden="true">
                <div
                  className="guide-progress-bar-fill"
                  style={{ width: `${globalStats.percentage}%` }}
                />
              </div>

              <div className="guide-progress-footer">
                <span>
                  {globalStats.isCompleted
                    ? guideT.allCompletedTitle || '¡Ruta completada!'
                    : guideT.sectionsSubtitle ||
                      'Sigue la ruta recomendada o explora directamente el tema que necesites.'}
                </span>
                {globalStats.isCompleted && (
                  <strong style={{ color: '#10b981' }}>100%</strong>
                )}
              </div>
            </section>

            {/* Cuadrícula de Secciones de Aprendizaje */}
            <section className="guide-sections-block">
              <div className="guide-block-heading">
                <h2>{guideT.sectionsTitle || 'Por dónde empezar'}</h2>
                <p>
                  {guideT.sectionsSubtitle ||
                    'Sigue la ruta recomendada o explora directamente el tema que necesites.'}
                </p>
              </div>

              <div className="guide-sections-grid">
                {GUIDE_SECTIONS.map((section) => {
                  const sectionTranslation = guideT?.sections?.[section.id] || {}
                  const title =
                    sectionTranslation.name || sectionTranslation.title || section.id
                  const description = sectionTranslation.description || ''
                  const stats = getSectionProgress(section.id)
                  const isDict = section.id === 'glossary'

                  return (
                    <div
                      key={section.id}
                      className={`guide-section-card ${
                        stats.isCompleted ? 'is-completed' : ''
                      }`}
                      onClick={() => handleSectionClick(section.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          handleSectionClick(section.id)
                        }
                      }}
                    >
                      <div className="guide-card-top">
                        <span className="guide-card-icon" aria-hidden="true">
                          {section.icon}
                        </span>
                        {isDict ? (
                          <span className="guide-card-badge dict-badge">
                            <span aria-hidden="true">📖</span>{' '}
                            {locale === 'en' ? 'Quick lookup' : 'Consulta rápida'}
                          </span>
                        ) : stats.isCompleted ? (
                          <span className="guide-card-badge">
                            <span aria-hidden="true">✓</span>{' '}
                            {guideT.completedTag || 'Completada'}
                          </span>
                        ) : stats.allObjectivesLearned ? (
                          <span className="guide-card-badge exam-pending">
                            <span aria-hidden="true">🎓</span>{' '}
                            {guideT.examPending || 'Examen pendiente'}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="guide-card-title">{title}</h3>
                      <p className="guide-card-desc">{description}</p>

                      <div className="guide-card-bottom">
                        <div className="guide-card-progress-meta">
                          <span>
                            {(guideT.sectionObjectivesCount || '{completed}/{total} objetivos')
                              .replace('{completed}', stats.completed)
                              .replace('{total}', stats.total)}
                          </span>
                          <span>{stats.percentage}%</span>
                        </div>
                        <div className="guide-card-mini-bar" aria-hidden="true">
                          <div
                            className="guide-card-mini-fill"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  )
}

export default Guide
