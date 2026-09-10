import buscarSoundUrl from '../audio/buscar.mp3'
import buttonSoundUrl from '../audio/button.mp3'
import clickSoundUrl from '../audio/click.mp3'
import bubbleSoundUrl from '../audio/bubble.mp3'
import hoverBubbleSoundUrl from '../audio/hover-bubble.mp3'
import shinySoundUrl from '../audio/shiny.mp3'
import shinylessSoundUrl from '../audio/shinyless.mp3'

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

let lastClickTime = 0
export function playClickSound() {
  const now = Date.now()
  if (now - lastClickTime < 100) return
  lastClickTime = now

  try {
    const audio = new Audio(clickSoundUrl)
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}

let lastBubbleTime = 0
export function playBubbleSound() {
  const now = Date.now()
  if (now - lastBubbleTime < 150) return
  lastBubbleTime = now

  try {
    const audio = new Audio(bubbleSoundUrl)
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}

let lastHoverBubbleTime = 0
export function playHoverBubbleSound() {
  const now = Date.now()
  if (now - lastHoverBubbleTime < 50) return
  lastHoverBubbleTime = now

  try {
    const audio = new Audio(hoverBubbleSoundUrl)
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}

let lastShinyTime = 0
export function playShinySound() {
  const now = Date.now()
  if (now - lastShinyTime < 300) return
  lastShinyTime = now

  try {
    const audio = new Audio(shinySoundUrl)
    audio.currentTime = 0
    audio.volume = 0.85
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}

let lastShinylessTime = 0
export function playShinylessSound() {
  const now = Date.now()
  if (now - lastShinylessTime < 300) return
  lastShinylessTime = now

  try {
    const audio = new Audio(shinylessSoundUrl)
    audio.currentTime = 0
    audio.volume = 0.85
    audio.play().catch(() => {})
  } catch {
    // Ignore playback restrictions/errors
  }
}


