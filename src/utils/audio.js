import buscarSoundUrl from '../audio/buscar.mp3'
import buttonSoundUrl from '../audio/button.mp3'

let lastBuscarTime = 0
export function playBuscarSound() {
  const now = Date.now()
  if (now - lastBuscarTime < 150) return
  lastBuscarTime = now

  try {
    const audio = new Audio(buscarSoundUrl)
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}

let lastButtonTime = 0
export function playButtonSound() {
  const now = Date.now()
  if (now - lastButtonTime < 150) return
  lastButtonTime = now

  try {
    const audio = new Audio(buttonSoundUrl)
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}
