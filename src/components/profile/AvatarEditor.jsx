import { useState, useRef, useEffect, useCallback } from 'react'

const RESOLUTIONS = [
  { size: 64, label: '64 × 64', desc: 'Muy pequeño / ligero', cssClass: 'size-64' },
  { size: 128, label: '128 × 128', desc: 'Avatar compacto', cssClass: 'size-128' },
  { size: 256, label: '256 × 256', desc: 'Recomendado para la mayoría', recommended: true, cssClass: 'size-256' },
  { size: 384, label: '384 × 384', desc: 'Alta nitidez', cssClass: 'size-384' },
  { size: 512, label: '512 × 512', desc: 'Máxima resolución', cssClass: 'size-512' },
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

function AvatarEditor({
  imageFile,
  onCancel,
  onSave,
  isSaving = false,
  username = 'Entrenador',
  errorMessage = null,
  onClearError,
}) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1.2)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedResolution, setSelectedResolution] = useState(256)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const panRef = useRef({ x: 0, y: 0 })

  // Canvases
  const mainCanvasRef = useRef(null)
  const previewCanvasesRef = useRef({})
  const mockNavbarCanvasRef = useRef(null)

  // Cargar imagen desde el archivo seleccionado
  useEffect(() => {
    if (!imageFile) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        // Reset pan & zoom
        setPan({ x: 0, y: 0 })
        panRef.current = { x: 0, y: 0 }
        setZoom(1.15)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Función matemática unificada de renderizado de Canvas
  const renderToCanvas = useCallback((canvas, targetWidth, targetHeight, customPan, customZoom) => {
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = targetWidth
    canvas.height = targetHeight

    ctx.clearRect(0, 0, targetWidth, targetHeight)

    const imgW = image.naturalWidth || image.width
    const imgH = image.naturalHeight || image.height

    // Escala base para cubrir el lienzo cuadrado
    const baseScale = Math.max(targetWidth / imgW, targetHeight / imgH)
    const currentScale = baseScale * customZoom

    const scaledW = imgW * currentScale
    const scaledH = imgH * currentScale

    // Factor de posición proporcional según el tamaño del lienzo
    const panFactor = targetWidth / 300
    const posX = (targetWidth - scaledW) / 2 + customPan.x * panFactor
    const posY = (targetHeight - scaledH) / 2 + customPan.y * panFactor

    // Configurar suavizado de imagen de alta calidad
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(image, posX, posY, scaledW, scaledH)
  }, [image])

  // Actualizar todos los lienzos cuando cambian zoom o pan
  useEffect(() => {
    if (!image) return

    // 1. Lienzo principal de edición (300x300)
    renderToCanvas(mainCanvasRef.current, 300, 300, pan, zoom)

    // 2. Previews de resoluciones (cada canvas dibuja a su resolución real interna)
    RESOLUTIONS.forEach((res) => {
      const c = previewCanvasesRef.current[res.size]
      if (c) {
        renderToCanvas(c, res.size, res.size, pan, zoom)
      }
    })

    // 3. Mockup del Navbar (32x32)
    if (mockNavbarCanvasRef.current) {
      renderToCanvas(mockNavbarCanvasRef.current, 48, 48, pan, zoom)
    }
  }, [image, zoom, pan, renderToCanvas])

  // Controladores de arrastre con puntero (ratón y pantallas táctiles)
  function handlePointerDown(e) {
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panRef.current = { ...pan }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y
    setPan({
      x: panRef.current.x + deltaX,
      y: panRef.current.y + deltaY,
    })
  }

  function handlePointerUp(e) {
    if (isDragging) {
      setIsDragging(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Ignorar si el puntero ya se liberó
      }
    }
  }

  // Generar WebP a la resolución seleccionada al guardar
  function handleSaveClick() {
    if (!image) return
    onClearError?.()

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = selectedResolution
    exportCanvas.height = selectedResolution

    renderToCanvas(exportCanvas, selectedResolution, selectedResolution, pan, zoom)

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob, selectedResolution)
        } else {
          // Fallback a PNG si toBlob con webp no estuviera soportado
          exportCanvas.toBlob((pngBlob) => {
            if (pngBlob) {
              onSave(pngBlob, selectedResolution)
            }
          }, 'image/png')
        }
      },
      'image/webp',
      0.92
    )
  }

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
      <div className="avatar-editor-modal-card">
        {/* Encabezado */}
        <div className="auth-modal-header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
          <div>
            <div className="auth-brand-badge">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span className="brand-text">PokéGuide</span>
            </div>
            <h2 id="avatar-editor-title" className="auth-modal-title">
              Editor de <em>Foto de Perfil</em>
            </h2>
            <p className="auth-modal-subtitle">
              Ajusta el encuadre arrastrando la imagen y elige la resolución ideal para tu avatar.
            </p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Cerrar editor"
          >
            ✕
          </button>
        </div>

        <div className="avatar-editor-body">
          {/* Alerta de error visible si la subida falla */}
          {errorMessage && (
            <div className="auth-alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '16px', lineHeight: 1 }} aria-hidden="true">⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '3px' }}>No se pudo guardar la foto de perfil:</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Área interactiva de recorte */}
          <div
            className={`crop-viewport-container ${isDragging ? 'is-dragging' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Haz clic y arrastra para mover la imagen"
          >
            <canvas ref={mainCanvasRef} className="crop-canvas-layer" />
            <div className="crop-circle-mask" aria-hidden="true" />
            <span className="crop-hint-badge">Arrastra para encuadrar</span>
          </div>

          {/* Controles de zoom */}
          <div className="crop-controls-row">
            <button
              type="button"
              className="crop-zoom-btn"
              onClick={() => setZoom((z) => Math.max(1, z - 0.15))}
              disabled={zoom <= 1 || isSaving}
              aria-label="Reducir zoom"
            >
              −
            </button>
            <input
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="crop-zoom-slider"
              disabled={isSaving}
              aria-label="Control de zoom"
            />
            <button
              type="button"
              className="crop-zoom-btn"
              onClick={() => setZoom((z) => Math.min(3.5, z + 0.15))}
              disabled={zoom >= 3.5 || isSaving}
              aria-label="Aumentar zoom"
            >
              +
            </button>
          </div>

          {/* Previsualización de resoluciones */}
          <section className="resolutions-section">
            <div className="resolutions-title-group">
              <h3 className="resolutions-title">Elige la resolución de tu avatar</h3>
              <p className="resolutions-subtitle">
                Compara cómo se verá tu foto en cada tamaño antes de exportarla en formato WebP:
              </p>
            </div>

            <div className="resolutions-grid">
              {RESOLUTIONS.map((res) => {
                const isSelected = selectedResolution === res.size

                return (
                  <button
                    key={res.size}
                    type="button"
                    className={`resolution-card-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedResolution(res.size)}
                    disabled={isSaving}
                    aria-pressed={isSelected}
                  >
                    {res.recommended && (
                      <span className="resolution-recommended-tag">RECOMENDADO</span>
                    )}

                    {/* Previsualización circular con la foto real del usuario */}
                    <div className={`resolution-preview-circle-wrap ${res.cssClass}`}>
                      <canvas
                        ref={(el) => {
                          if (el) previewCanvasesRef.current[res.size] = el
                        }}
                      />
                    </div>

                    <div className="resolution-info">
                      <strong className="resolution-label">{res.label}</strong>
                      <span className="resolution-status-text">
                        {isSelected ? '✓ Elegido' : ''}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Previsualización en el contexto del Navbar */}
            <div className="navbar-mock-preview-wrap">
              <span className="navbar-mock-title">Así se verá en PokéGuide:</span>
              <div className="navbar-mock-pill">
                <canvas ref={mockNavbarCanvasRef} className="navbar-mock-avatar" />
                <span className="navbar-mock-name">{username}</span>
                <svg className="navbar-mock-chevron" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </section>

          {/* Acciones del pie */}
          <div className="modal-footer-actions">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="auth-primary-btn"
              style={{ width: 'auto', padding: '10px 24px', margin: 0 }}
              onClick={handleSaveClick}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  <span>Guardando avatar...</span>
                </>
              ) : (
                <span>Guardar avatar ({selectedResolution}×{selectedResolution})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarEditor
