import confetti from 'canvas-confetti'

export function fireConfetti(options = {}) {
  // SSR-safe guard
  if (typeof window === 'undefined') return

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (prefersReducedMotion) return

  const duration = typeof options.duration === 'number' ? options.duration : 3_000
  const end = Date.now() + duration

  const particleCount = typeof options.particleCount === 'number' ? options.particleCount : 3
  const colors = Array.isArray(options.colors) && options.colors.length
    ? options.colors
    : ['#7048E8', '#F4A782', '#FFFFFF']

  const leftOrigin = options.leftOrigin || { x: 0, y: 0.6 }
  const rightOrigin = options.rightOrigin || { x: 1, y: 0.6 }

  const spread = typeof options.spread === 'number' ? options.spread : 55
  const angles = Array.isArray(options.angles) && options.angles.length ? options.angles : [60, 120]

  ;(function frame() {
    confetti({
      particleCount,
      angle: angles[0],
      spread,
      origin: leftOrigin,
      colors
    })

    confetti({
      particleCount,
      angle: angles[1] ?? angles[0] + 60,
      spread,
      origin: rightOrigin,
      colors
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }())
}

