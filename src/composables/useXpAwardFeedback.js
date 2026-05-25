import { useUserStore } from '../stores/user'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { getXpGainedFromResponse, getUserFromResponse } from '../utils/xpResponse'
import { normalizeToastAnchor } from '../utils/xpToastTheme'

/**
 * Apply backend XP award response: sync user XP and optionally show a toast.
 * @param {import('axios').AxiosResponse|{ data?: object }} response
 * @param {{ showToast?: boolean, toastAnchor?: Element|{ x: number, y: number }|null }} options
 * @returns {number} XP gained according to the server
 */
export function useXpAwardFeedback() {
  const userStore = useUserStore()

  function applyXpAwardResponse(response, { showToast = true, toastAnchor = null } = {}) {
    const data = response?.data
    if (!data) return 0

    const user = getUserFromResponse(data)
    if (user) {
      userStore.updateUser(user)
      dispatchAppEvent(APP_EVENTS.AUTH_CHANGED)
    } else if (Number.isFinite(Number(data.xp))) {
      userStore.updateUser({ ...userStore.user, xp: Number(data.xp) })
      dispatchAppEvent(APP_EVENTS.AUTH_CHANGED)
    }

    const gained = getXpGainedFromResponse(data)
    if (showToast && gained > 0) {
      window.dispatchEvent(
        new CustomEvent(APP_EVENTS.XP_AWARDED, {
          detail: {
            gained,
            anchor: normalizeToastAnchor(toastAnchor)
          }
        })
      )
    }

    return gained
  }

  return { applyXpAwardResponse }
}
