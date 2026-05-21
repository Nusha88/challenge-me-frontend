import { onMounted, onBeforeUnmount } from 'vue'
import { addAppEventListener, removeAppEventListener } from '../utils/appEvents'

/**
 * Register app-wide window event listeners with automatic cleanup on unmount.
 * @param {Array<{ event: string, handler: (event?: Event) => void }>} listeners
 */
export function useAppEventListeners(listeners) {
  onMounted(() => {
    for (const { event, handler } of listeners) {
      addAppEventListener(event, handler)
    }
  })

  onBeforeUnmount(() => {
    for (const { event, handler } of listeners) {
      removeAppEventListener(event, handler)
    }
  })
}
