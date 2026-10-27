export const TELEGRAM_FEEDBACK_URL = 'https://t.me/Ignite_support_team_bot'

/**
 * Where landing CTAs send a visitor.
 *
 * Primary: /register, not /login — a first-time visitor has no credentials yet.
 * Secondary demo: /today after startDemo().
 * Browse: public /missions, no account and no demo session.
 */
export const SIGN_UP_ROUTE = '/register'

/** Public, browsable without an account — used for the low-commitment CTA. */
export const BROWSE_MISSIONS_ROUTE = '/missions'
export const BROWSE_HEROES_ROUTE = '/heroes'
