import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

function readWidth() {
  if (typeof window === 'undefined') return 1024
  return window.visualViewport?.width || window.innerWidth || 1024
}

/**
 * Layout viewport can be ~980px on iPhone when anything overflows, so Vuetify
 * breakpoints and CSS max-width media queries think the phone is a desktop.
 * visualViewport.width is the actual visible area.
 */
export function useVisualViewport() {
  const width = ref(readWidth())

  function measure() {
    width.value = readWidth()
  }

  onMounted(() => {
    measure()
    window.visualViewport?.addEventListener('resize', measure)
    window.addEventListener('resize', measure)
  })

  onBeforeUnmount(() => {
    window.visualViewport?.removeEventListener('resize', measure)
    window.removeEventListener('resize', measure)
  })

  const mdAndUp = computed(() => width.value >= 960)
  const lgAndUp = computed(() => width.value >= 1280)
  const smAndDown = computed(() => width.value < 960)

  return { width, mdAndUp, lgAndUp, smAndDown }
}
