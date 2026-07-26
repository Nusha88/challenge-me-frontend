import { onBeforeUnmount, ref, watch } from 'vue'

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3)

/**
 * Animates a number from 0 to `source` once it becomes non-zero.
 *
 * Skipped entirely under prefers-reduced-motion, where the final value is set
 * directly instead.
 */
export function useCountUp(source, duration = 1100) {
  const displayed = ref(0)
  let frame = null

  function cancel() {
    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }
  }

  function run(target) {
    cancel()

    const reduceMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || typeof requestAnimationFrame === 'undefined' || target <= 0) {
      displayed.value = target
      return
    }

    const start = performance.now()

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      displayed.value = Math.round(target * EASE_OUT_CUBIC(progress))

      if (progress < 1) {
        frame = requestAnimationFrame(step)
      } else {
        frame = null
      }
    }

    frame = requestAnimationFrame(step)
  }

  watch(source, (value) => run(Number(value) || 0), { immediate: true })
  onBeforeUnmount(cancel)

  return displayed
}
