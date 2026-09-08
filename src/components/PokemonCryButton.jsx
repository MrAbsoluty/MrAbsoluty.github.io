import { useEffect, useRef, useState } from 'react'

function SoundIcon({ isPlaying }) {
  return (
    <svg
      className={`cry-speaker-icon ${isPlaying ? 'is-playing' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <path className="sound-wave wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path className="sound-wave wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function PokemonCryButton({ cry, pokemonName, title, ariaLabel }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [prevCry, setPrevCry] = useState(cry)
  const audioRef = useRef(null)

  // Reset playing state during render if cry changes
  if (cry !== prevCry) {
    setPrevCry(cry)
    setIsPlaying(false)
  }

  // Clean up and stop audio whenever the cry URL changes or the component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }
  }, [cry])

  if (!cry) return null

  function handlePlay() {
    try {
      if (!audioRef.current) {
        const audio = new Audio(cry)
        audio.preload = 'auto'

        audio.onplay = () => setIsPlaying(true)
        audio.onended = () => setIsPlaying(false)
        audio.onpause = () => setIsPlaying(false)
        audio.onerror = () => setIsPlaying(false)

        audioRef.current = audio
      } else {
        // If already exists or currently playing, restart from beginning
        audioRef.current.currentTime = 0
      }

      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio playback prevented or interrupted:', err)
          setIsPlaying(false)
        })
      }
    } catch (err) {
      console.warn('Cry playback error:', err)
      setIsPlaying(false)
    }
  }

  const accessibleLabel =
    ariaLabel || (title ? `${title}: ${pokemonName}` : `Play cry for ${pokemonName}`)

  return (
    <button
      type="button"
      className={`cry-btn ${isPlaying ? 'is-playing' : ''}`}
      onClick={handlePlay}
      title={title || 'Reproducir sonido'}
      aria-label={accessibleLabel}
      aria-pressed={isPlaying}
    >
      <span className="cry-sound-ripples" aria-hidden="true">
        <span className="cry-ripple" />
        <span className="cry-ripple" />
      </span>
      <SoundIcon isPlaying={isPlaying} />
    </button>
  )
}

export default PokemonCryButton
