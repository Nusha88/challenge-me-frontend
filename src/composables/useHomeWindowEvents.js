import { onMounted, onBeforeUnmount } from 'vue'

const HOME_WINDOW_EVENT_BINDINGS = [
  ['auth-changed', 'onAuthChanged'],
  ['checklist-updated', 'onChecklistUpdated'],
  ['challenge-updated', 'onChallengeUpdated'],
  ['challenge-completed', 'onChallengeCompleted'],
  ['participant-completed-days-updated', 'onParticipantCompletedDaysUpdated']
]

export function useHomeWindowEvents(handlers) {
  onMounted(() => {
    for (const [eventName, handlerKey] of HOME_WINDOW_EVENT_BINDINGS) {
      const handler = handlers[handlerKey]
      if (handler) {
        window.addEventListener(eventName, handler)
      }
    }
  })

  onBeforeUnmount(() => {
    for (const [eventName, handlerKey] of HOME_WINDOW_EVENT_BINDINGS) {
      const handler = handlers[handlerKey]
      if (handler) {
        window.removeEventListener(eventName, handler)
      }
    }
  })
}
