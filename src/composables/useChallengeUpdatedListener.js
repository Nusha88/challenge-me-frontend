/**
 * Listen for CHALLENGE_UPDATED from the global details provider and refresh lists.
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { APP_EVENTS } from '../constants/appEvents'

export function useChallengeUpdatedListener(handler) {
  function onUpdated(event) {
    handler?.(event?.detail || {})
  }

  onMounted(() => {
    window.addEventListener(APP_EVENTS.CHALLENGE_UPDATED, onUpdated)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(APP_EVENTS.CHALLENGE_UPDATED, onUpdated)
  })
}
