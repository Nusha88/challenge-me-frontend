/**
 * App Badging API — show unread count on the installed PWA icon (desktop taskbar/dock).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

const MAX_BADGE_COUNT = 99

export function isAppBadgeSupported() {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator
}

/** True when the app runs as an installed PWA (not a regular browser tab). */
export function isInstalledPwa() {
  if (typeof window === 'undefined') return false
  if (window.navigator?.standalone === true) return true
  const modes = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
  return modes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)
}

/**
 * Update or clear the OS / launcher badge for the installed PWA.
 * No-op in unsupported browsers or when not installed as PWA.
 */
export async function syncAppBadge(unreadCount) {
  if (!isAppBadgeSupported() || !isInstalledPwa()) return

  const count = Math.max(0, Math.floor(Number(unreadCount) || 0))

  try {
    if (count > 0) {
      await navigator.setAppBadge(Math.min(count, MAX_BADGE_COUNT))
    } else {
      await navigator.clearAppBadge()
    }
  } catch (err) {
    console.warn('[AppBadge] Failed to update badge:', err)
  }
}

export async function clearAppBadge() {
  if (!isAppBadgeSupported()) return
  try {
    await navigator.clearAppBadge()
  } catch (err) {
    console.warn('[AppBadge] Failed to clear badge:', err)
  }
}
