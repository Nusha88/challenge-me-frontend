/**
 * Thin wrapper around the Yandex.Metrica counter installed in index.html.
 *
 * The counter script is loaded asynchronously and can be blocked entirely by
 * ad blockers, so every call has to tolerate `window.ym` being absent. Tracking
 * must never be able to break a CTA.
 */

const COUNTER_ID = 107077864

export const GOALS = {
  LANDING_CTA_CLICK: 'landing_cta_click',
  LANDING_SCROLL_50: 'landing_scroll_50',
  LANDING_SECONDARY_CLICK: 'landing_secondary_click',
  MISSION_CARD_OPEN: 'mission_card_open',
  FAQ_OPEN: 'faq_open',
  REGISTER_START: 'register_start',
  REGISTER_SUCCESS: 'register_success',
  LOGIN_SUCCESS: 'login_success'
}

export function reachGoal(goal, params) {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') return

  try {
    if (params) {
      window.ym(COUNTER_ID, 'reachGoal', goal, params)
    } else {
      window.ym(COUNTER_ID, 'reachGoal', goal)
    }
  } catch {
    // Analytics is best-effort and must never surface to the user.
  }
}

/**
 * Fires `goal` at most once per page load. Used for milestones like scroll depth
 * where repeated events would distort the funnel.
 */
const firedOnce = new Set()

export function reachGoalOnce(goal, params) {
  if (firedOnce.has(goal)) return
  firedOnce.add(goal)
  reachGoal(goal, params)
}
