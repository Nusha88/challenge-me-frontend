export const TELEGRAM_FEEDBACK_URL = 'https://t.me/Ignite_support_team_bot'

/**
 * Where landing CTAs send a visitor.
 *
 * Deliberately /register and not /login: everyone arriving here is by definition
 * a first-time visitor, and the login form asks for credentials they do not have.
 */
export const SIGN_UP_ROUTE = '/register'

/** Public, browsable without an account — used for the low-commitment CTA. */
export const BROWSE_MISSIONS_ROUTE = '/missions'
export const BROWSE_HEROES_ROUTE = '/heroes'
