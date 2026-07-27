import confetti from 'canvas-confetti'

const EPIC_COLORS = ['#FBBF24', '#F59E0B', '#7048E8', '#8B5CF6', '#4FD1C5', '#FFFFFF']

export function fireEpicConfetti() {
  if (typeof window === 'undefined') return

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (prefersReducedMotion) return

  const duration = 4_000
  const end = Date.now() + duration

  confetti({
    particleCount: 140,
    spread: 110,
    startVelocity: 45,
    origin: { y: 0.55 },
    colors: EPIC_COLORS
  })

  confetti({
    particleCount: 90,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.65 },
    colors: EPIC_COLORS
  })

  confetti({
    particleCount: 90,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.65 },
    colors: EPIC_COLORS
  })

  const burst = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(burst)
      return
    }

    confetti({
      particleCount: 36,
      startVelocity: 28,
      spread: 360,
      ticks: 70,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.35
      },
      colors: EPIC_COLORS
    })
  }, 220)
}

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
    : ['#4FD1C5', '#FBBF24', '#FFFFFF']

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

/**
 * Fire confetti originating from an element's bounding box (dialog surface / CTA).
 * @param {Element|{ $el?: Element }|null|undefined} el
 * @param {object} [options]
 */
export function fireConfettiFromElement(el, options = {}) {
  if (typeof window === 'undefined') return

  const node = el?.$el instanceof Element ? el.$el : el
  if (!(node instanceof Element)) {
    fireConfetti(options)
    return
  }

  const rect = node.getBoundingClientRect()
  const vw = window.innerWidth || 1
  const vh = window.innerHeight || 1
  const cx = (rect.left + rect.width / 2) / vw
  const cy = (rect.top + rect.height * 0.55) / vh
  const clamp = (n) => Math.min(0.95, Math.max(0.05, n))

  fireConfetti({
    ...options,
    leftOrigin: { x: clamp(cx - 0.12), y: clamp(cy) },
    rightOrigin: { x: clamp(cx + 0.12), y: clamp(cy) },
    duration: options.duration ?? 2200,
    colors: options.colors || ['#4FD1C5', '#FBBF24', '#FFFFFF']
  })
}

