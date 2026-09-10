import { useCallback, useEffect, useRef, useState } from 'react'
import { musicPlaylist } from '../services/musicPlaylist'
import { playButtonSound, playClickSound } from '../utils/audio'

const STORAGE_KEY_ENABLED = 'pokeguide_music_enabled'
const STORAGE_KEY_VOLUME = 'pokeguide_music_volume'
const STORAGE_KEY_TRACK = 'pokeguide_music_track'

function HeadphoneIcon() {
  return (
    <svg className="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}

function MusicNoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function PrevTrackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function NextTrackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function VolumeIcon({ volume }) {
  if (volume === 0) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  }
  if (volume < 50) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function MarqueeTitle({ text, className, isVisible = true }) {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    function measure() {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const textWidth = textRef.current.scrollWidth
        setOverflow(textWidth > containerWidth + 2)
      }
    }

    measure()
    const timer = setTimeout(measure, 60)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
    }
  }, [text, isVisible])

  // Velocidad de desplazamiento suave y cómoda para leer
  const duration = Math.max(12, Math.min(28, (text?.length || 20) * 0.4 + 6))

  return (
    <div
      ref={containerRef}
      className={`marquee-wrapper ${overflow ? 'has-overflow' : ''} ${className || ''}`}
      title={text}
    >
      {overflow ? (
        <div
          className="marquee-track"
          style={{ animationDuration: `${duration}s` }}
        >
          <span ref={textRef} className="marquee-item">
            {text}
            <span className="marquee-separator" aria-hidden="true"> • </span>
          </span>
          <span className="marquee-item" aria-hidden="true">
            {text}
            <span className="marquee-separator" aria-hidden="true"> • </span>
          </span>
        </div>
      ) : (
        <span ref={textRef} className="marquee-static">
          {text}
        </span>
      )}
    </div>
  )
}

export default function MusicPlayer({ t }) {
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY_ENABLED) === 'true'
    } catch {
      return false
    }
  })

  const [volume, setVolume] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_VOLUME)
      if (saved !== null) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed
      }
    } catch {
      // Default to 25% for ambient music
    }
    return 25
  })

  const [trackIndex, setTrackIndex] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_TRACK)
      if (saved !== null) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed < musicPlaylist.length) return parsed
      }
    } catch {
      // Default to first track
    }
    return 0
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  const playerRef = useRef(null)
  const toastTimerRef = useRef(null)
  const miniPlayerRef = useRef(null)
  const fabBtnRef = useRef(null)
  const trackIndexRef = useRef(trackIndex)
  const isEnabledRef = useRef(isEnabled)
  const volumeRef = useRef(volume)
  const handleNextTrackRef = useRef(null)

  useEffect(() => {
    trackIndexRef.current = trackIndex
    isEnabledRef.current = isEnabled
  }, [trackIndex, isEnabled])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  const currentTrack = musicPlaylist[trackIndex] || musicPlaylist[0]

  // Mostrar el toast "Now Playing" temporalmente
  const triggerToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setShowToast(true)
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false)
    }, 4500)
  }, [])

  // Cambiar a una pista específica
  const changeTrack = useCallback((newIndex) => {
    setTrackIndex(newIndex)
    try {
      window.localStorage.setItem(STORAGE_KEY_TRACK, String(newIndex))
    } catch {
      // Ignore localStorage errors
    }

    const nextTrack = musicPlaylist[newIndex]
    if (playerRef.current && isPlayerReady && nextTrack) {
      try {
        if (nextTrack.youtubeId && !nextTrack.youtubeId.startsWith('PLACEHOLDER_')) {
          playerRef.current.loadVideoById(nextTrack.youtubeId)
          playerRef.current.playVideo()
          setIsPlaying(true)
          setIsEnabled(true)
          try {
            window.localStorage.setItem(STORAGE_KEY_ENABLED, 'true')
          } catch {
            // Ignore
          }
        }
      } catch (err) {
        console.warn('Error changing YouTube track:', err)
      }
    }

    triggerToast()
  }, [isPlayerReady, triggerToast])

  // Pista Siguiente (cíclica)
  const handleNextTrack = useCallback(() => {
    playClickSound()
    const nextIdx = (trackIndexRef.current + 1) % musicPlaylist.length
    changeTrack(nextIdx)
  }, [changeTrack])

  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack
  }, [handleNextTrack])

  // Pista Anterior (cíclica)
  const handlePrevTrack = useCallback(() => {
    playClickSound()
    const prevIdx = (trackIndexRef.current - 1 + musicPlaylist.length) % musicPlaylist.length
    changeTrack(prevIdx)
  }, [changeTrack])

  // Inicializar YouTube IFrame Player API (única vez al montar)
  useEffect(() => {
    let isCancelled = false

    function initYTPlayer() {
      if (isCancelled || !window.YT || !window.YT.Player) return
      if (playerRef.current) return

      try {
        const initialTrack = musicPlaylist[trackIndexRef.current] || musicPlaylist[0]
        const videoId = initialTrack.youtubeId && !initialTrack.youtubeId.startsWith('PLACEHOLDER_')
          ? initialTrack.youtubeId
          : ''

        new window.YT.Player('pokeguide-yt-player-iframe', {
          height: '1',
          width: '1',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event) => {
              if (isCancelled) return
              playerRef.current = event.target
              setIsPlayerReady(true)
              event.target.setVolume(volumeRef.current)
            },
            onStateChange: (event) => {
              if (isCancelled) return
              // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true)
              } else if (event.data === 2) {
                setIsPlaying(false)
              } else if (event.data === 0) {
                // Pasar automáticamente a la siguiente pista
                handleNextTrackRef.current?.()
              }
            },
            onError: (event) => {
              console.warn('PokeGuide Radio: YouTube notice (code ' + event.data + ').')
            },
          },
        })
      } catch (err) {
        console.warn('Error instantiating YouTube player:', err)
      }
    }

    if (window.YT && window.YT.Player) {
      initYTPlayer()
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback()
        initYTPlayer()
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        tag.async = true
        document.head.appendChild(tag)
      }
    }

    return () => {
      isCancelled = true
    }
  }, [])

  // Cierre al hacer clic fuera del mini reproductor
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isMiniPlayerOpen &&
        miniPlayerRef.current &&
        !miniPlayerRef.current.contains(event.target) &&
        fabBtnRef.current &&
        !fabBtnRef.current.contains(event.target)
      ) {
        setIsMiniPlayerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMiniPlayerOpen])

  // Clic en el botón principal 🎧
  function handleFabClick() {
    if (!isEnabled) {
      // Activar música
      playButtonSound()
      setIsEnabled(true)
      setIsPlaying(true)
      try {
        window.localStorage.setItem(STORAGE_KEY_ENABLED, 'true')
      } catch {
        // Ignore
      }

      triggerToast()

      if (playerRef.current && isPlayerReady) {
        try {
          const track = musicPlaylist[trackIndex]
          if (track && track.youtubeId && !track.youtubeId.startsWith('PLACEHOLDER_')) {
            playerRef.current.loadVideoById(track.youtubeId)
          }
          playerRef.current.playVideo()
        } catch (err) {
          console.warn('Playback error on start:', err)
        }
      }
    } else {
      // Toggle de mini reproductor
      playClickSound()
      setIsMiniPlayerOpen((prev) => !prev)
    }
  }

  // Toggle Play / Pausa desde el mini reproductor
  function handleTogglePlay() {
    playClickSound()
    if (isPlaying) {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.pauseVideo()
        } catch (err) {
          console.warn('Error pausing video:', err)
        }
      }
      setIsPlaying(false)
    } else {
      if (playerRef.current && isPlayerReady) {
        try {
          const track = musicPlaylist[trackIndexRef.current]
          if (track && track.youtubeId && !track.youtubeId.startsWith('PLACEHOLDER_')) {
            playerRef.current.playVideo()
          }
        } catch (err) {
          console.warn('Error playing video:', err)
        }
      }
      setIsPlaying(true)
    }
  }

  // Cambio de volumen
  function handleVolumeChange(e) {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
    try {
      window.localStorage.setItem(STORAGE_KEY_VOLUME, String(newVolume))
    } catch {
      // Ignore
    }
    if (playerRef.current && isPlayerReady) {
      try {
        playerRef.current.setVolume(newVolume)
        if (newVolume > 0 && playerRef.current.isMuted && playerRef.current.isMuted()) {
          playerRef.current.unMute()
        }
      } catch (err) {
        console.warn(err)
      }
    }
  }

  // Silenciar / Restaurar volumen rápido
  function handleToggleMute() {
    playClickSound()
    if (volume > 0) {
      handleVolumeChange({ target: { value: 0 } })
    } else {
      handleVolumeChange({ target: { value: 25 } })
    }
  }

  const musicLabels = t?.music || {
    nowPlaying: 'Estás escuchando',
    previous: 'Anterior',
    play: 'Reproducir',
    pause: 'Pausa',
    next: 'Siguiente',
    volume: 'Volumen',
    close: 'Cerrar reproductor',
    open: 'Abrir reproductor',
    musicOff: 'Música desactivada',
    musicOn: 'Música activada',
    radio: 'PokeGuide Radio',
  }

  return (
    <>
      {/* Contenedor IFrame de YouTube (Oculto pero activo en DOM para evitar pausas en segundo plano) */}
      <div className="pokeguide-yt-frame-container" aria-hidden="true">
        <div id="pokeguide-yt-player-iframe" />
      </div>

      {/* 1. Botón Principal Flotante (🎧) */}
      <button
        ref={fabBtnRef}
        type="button"
        className={`music-fab-btn ${!isEnabled ? 'is-off' : ''} ${isPlaying ? 'is-playing' : ''}`}
        onClick={handleFabClick}
        aria-label={!isEnabled ? `${musicLabels.musicOff} - ${musicLabels.play}` : (isMiniPlayerOpen ? musicLabels.close : musicLabels.open)}
        title={!isEnabled ? `${musicLabels.radio} (${musicLabels.musicOff})` : `${musicLabels.radio} - ${currentTrack.title}`}
      >
        {isPlaying && <span className="active-pulse-ring" aria-hidden="true" />}
        <HeadphoneIcon />
        {!isEnabled && <span className="off-slash-badge" aria-hidden="true" />}
      </button>

      {/* 2. Aviso "Now Playing" (Toast elegante) */}
      <div
        className={`music-toast ${showToast && isEnabled && !isMiniPlayerOpen ? 'is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="music-toast-icon-wrap" aria-hidden="true">
          <MusicNoteIcon />
        </div>
        <div className="music-toast-content">
          <div className="music-toast-eyebrow">
            <span>{musicLabels.nowPlaying}</span>
            {isPlaying && (
              <span className="mini-equalizer" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            )}
          </div>
          <MarqueeTitle text={currentTrack.title} className="music-toast-title" isVisible={showToast && isEnabled} />
          <p className="music-toast-artist">{currentTrack.artist}</p>
        </div>
      </div>

      {/* 3. Mini Reproductor Oculto */}
      <div
        ref={miniPlayerRef}
        className={`music-mini-player ${isMiniPlayerOpen ? 'is-open' : ''}`}
        aria-hidden={!isMiniPlayerOpen}
        role="dialog"
        aria-label={musicLabels.radio}
      >
        {/* Cabecera */}
        <div className="mini-player-header">
          <div className="mini-player-tag">
            <MusicNoteIcon />
            <span>{musicLabels.radio}</span>
          </div>
          <button
            type="button"
            className="mini-player-close-btn"
            onClick={() => {
              playClickSound()
              setIsMiniPlayerOpen(false)
            }}
            aria-label={musicLabels.close}
            title={musicLabels.close}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Información de canción actual */}
        <div className="mini-player-track">
          <MarqueeTitle text={currentTrack.title} className="mini-player-track-title" isVisible={isMiniPlayerOpen} />
          <p className="mini-player-track-artist">{currentTrack.artist}</p>
          <span className="mini-player-track-index">
            {trackIndex + 1} / {musicPlaylist.length}
          </span>
        </div>

        {/* Controles de reproducción (⏮ ⏯ ⏭) */}
        <div className="mini-player-controls">
          <button
            type="button"
            className="control-btn btn-skip"
            onClick={handlePrevTrack}
            aria-label={musicLabels.previous}
            title={musicLabels.previous}
          >
            <PrevTrackIcon />
          </button>

          <button
            type="button"
            className="control-btn btn-play-pause"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? musicLabels.pause : musicLabels.play}
            title={isPlaying ? musicLabels.pause : musicLabels.play}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            type="button"
            className="control-btn btn-skip"
            onClick={handleNextTrack}
            aria-label={musicLabels.next}
            title={musicLabels.next}
          >
            <NextTrackIcon />
          </button>
        </div>

        {/* Control de volumen */}
        <div className="mini-player-volume-row">
          <button
            type="button"
            className="volume-icon-btn"
            onClick={handleToggleMute}
            aria-label={musicLabels.volume}
            title={musicLabels.volume}
          >
            <VolumeIcon volume={volume} />
          </button>
          <div className="volume-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              aria-label={musicLabels.volume}
            />
          </div>
          <span className="volume-percent">{volume}%</span>
        </div>
      </div>
    </>
  )
}
