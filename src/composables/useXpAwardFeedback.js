import { useUserStore } from '../stores/user'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import {
  getXpGainedFromResponse,
  getSparksGainedFromResponse,
  getUserFromResponse
} from '../utils/rewardResponse'
import { normalizeToastAnchor } from '../utils/xpToastTheme'

function normalizeRewardUser(data, existingUser) {
  const user = getUserFromResponse(data)
  const xp = Number(user?.xp ?? data?.xp ?? existingUser?.xp ?? 0)
  const sparks = Number(user?.sparks ?? data?.sparks ?? existingUser?.sparks ?? 0)
  const id = user?.id || user?._id || existingUser?.id || existingUser?._id || null

  if (!user && !Number.isFinite(xp) && !Number.isFinite(sparks)) {
    return null
  }

  return {
    ...(existingUser || {}),
    ...(user || {}),
    ...(id ? { id } : {}),
    xp,
    sparks
  }
}

/**
 * Apply backend reward response: sync user XP/Sparks and optionally show toasts.
 * @param {import('axios').AxiosResponse|{ data?: object }} response
 * @param {{ showToast?: boolean, toastAnchor?: Element|{ x: number, y: number }|null }} options
 * @returns {{ xpGained: number, sparksGained: number }}
 */
export function useXpAwardFeedback() {
  const userStore = useUserStore()

  function applyRewardResponse(response, { showToast = true, toastAnchor = null } = {}) {
    const data = response?.data
    if (!data) return { xpGained: 0, sparksGained: 0 }

    const normalizedUser = normalizeRewardUser(data, userStore.user)
    if (normalizedUser) {
      userStore.updateUser(normalizedUser)
      dispatchAppEvent(APP_EVENTS.AUTH_CHANGED)
    }

    const anchor = normalizeToastAnchor(toastAnchor)
    const xpGained = getXpGainedFromResponse(data)
    const sparksGained = getSparksGainedFromResponse(data)

    if (showToast && xpGained > 0) {
      window.dispatchEvent(
        new CustomEvent(APP_EVENTS.XP_AWARDED, {
          detail: { gained: xpGained, anchor }
        })
      )
    }

    if (showToast && sparksGained > 0) {
      window.dispatchEvent(
        new CustomEvent(APP_EVENTS.SPARKS_AWARDED, {
          detail: { gained: sparksGained, anchor }
        })
      )
    }

    return { xpGained, sparksGained }
  }

  /** @deprecated Use applyRewardResponse — kept for existing call sites */
  function applyXpAwardResponse(response, options) {
    const { xpGained } = applyRewardResponse(response, options)
    return xpGained
  }

  return { applyRewardResponse, applyXpAwardResponse }
}
