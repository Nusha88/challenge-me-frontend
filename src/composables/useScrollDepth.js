import { onBeforeUnmount, onMounted } from 'vue'
import { GOALS, reachGoalOnce } from '../services/analytics'

/**
 * Fires the 50%-scroll goal once per page load.
 *
 * Combined with landing_cta_click this is what makes the landing funnel legible:
 * it separates "nobody got past the fold" from "people read it and still did not
 * sign up", which need completely different fixes.
 */
export function useScrollDepth(threshold = 0.5) {
  let frame = null

  function measure() {
    frame = null

    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    if (scrollable <= 0) return

    if (window.scrollY / scrollable >= threshold) {
      reachGoalOnce(GOALS.LANDING_SCROLL_50)
      detach()
    }
  }

  function onScroll() {
    if (frame === null) {
      frame = requestAnimationFrame(measure)
    }
  }

  function detach() {
    window.removeEventListener('scroll', onScroll)
    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onBeforeUnmount(detach)
}
