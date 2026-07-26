import { onBeforeUnmount, onMounted, ref } from 'vue'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * Adds `is-revealed` to elements as they scroll into view.
 *
 * Elements opt in with the `reveal` class, which starts them transparent. That
 * makes a broken observer indistinguishable from broken content, so the class is
 * only applied once we know IntersectionObserver exists and motion is wanted —
 * otherwise everything is revealed immediately.
 */
export function useReveal(options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px', selector = '.reveal' } = options

  const rootRef = ref(null)
  let observer = null

  function revealAll(elements) {
    elements.forEach((el) => el.classList.add('is-revealed'))
  }

  onMounted(() => {
    const root = rootRef.value
    if (!root) return

    const elements = Array.from(root.querySelectorAll(selector))
    if (!elements.length) return

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      revealAll(elements)
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          observer?.unobserve(entry.target)
        })
      },
      { threshold, rootMargin }
    )

    elements.forEach((el) => observer.observe(el))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { rootRef }
}
