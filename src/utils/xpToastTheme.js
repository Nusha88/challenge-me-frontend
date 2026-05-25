/**
 * Visual tier for XP toast from server-awarded amount (never computed on client for awarding).
 */
export function getXpToastVariant(gained) {
  const amount = Number(gained) || 0
  if (amount >= 150) return 'heroic'
  if (amount >= 100) return 'medium'
  if (amount >= 50) return 'easy'
  return 'spark' // +5, +10, etc.
}

export function normalizeToastAnchor(anchor) {
  if (!anchor) return null

  if (typeof anchor.x === 'number' && typeof anchor.y === 'number') {
    return { x: anchor.x, y: anchor.y }
  }

  if (typeof anchor.getBoundingClientRect === 'function') {
    const rect = anchor.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
  }

  return null
}

let sharedAudioContext = null

export function playXpAwardChime() {
  if (typeof window === 'undefined') return

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    sharedAudioContext = sharedAudioContext || new AudioContext()
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {})
    }

    const ctx = sharedAudioContext
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch {
    // Audio optional — ignore if blocked
  }
}
