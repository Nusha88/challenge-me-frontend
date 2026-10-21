export const SPARKS_PER_LIVE_DAY = 20

export const WISH_COST_MIN = 10
export const WISH_COST_MAX = 9999
export const WISH_TITLE_MAX = 80
export const WISH_MAX_ITEMS = 20

export const WISH_SIZE_CHIPS = Object.freeze([
  { key: 'small', cost: 50 },
  { key: 'medium', cost: 80 },
  { key: 'large', cost: 300 }
])

export const WISH_TEMPLATES = Object.freeze([
  { key: 'series', cost: 50 },
  { key: 'cheatMeal', cost: 80 },
  { key: 'thatThing', cost: 300 }
])

export const DEFENSE_CATALOG = Object.freeze([
  { type: 'freeze', cost: 50, icon: 'mdi-diamond-stone' },
  { type: 'secondChance', cost: 30, icon: 'mdi-shield-star-outline' }
])

export function formatWishDays(cost) {
  const days = Number(cost) / SPARKS_PER_LIVE_DAY
  if (!Number.isFinite(days) || days <= 0) return ''
  if (Number.isInteger(days)) return String(days)
  return String(Math.round(days * 10) / 10)
}
