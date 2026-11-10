export const STREAK_STATUS = Object.freeze({
  LIVE: 'live',
  PAUSED: 'paused',
  COOLED: 'cooled',
  EMPTY: 'empty'
})

export const MAX_STREAK_SKIPS = 2
export const MAX_CONSECUTIVE_EMPTY = 2

export function resolveStreakFromDays(isFilled, { todayIsGrace = true, maxDays = 365 } = {}) {
  let days = 0
  let totalSkipped = 0
  let consecutiveEmpty = 0
  let leadingEmpty = 0
  let seenLive = false
  let countedToday = false

  for (let i = 0; i < maxDays; i++) {
    if (isFilled(i)) {
      consecutiveEmpty = 0
      days += 1
      seenLive = true
      if (i === 0) countedToday = true
      continue
    }

    if (i === 0 && todayIsGrace) continue

    consecutiveEmpty += 1
    totalSkipped += 1
    if (!seenLive) leadingEmpty = consecutiveEmpty
    if (consecutiveEmpty > MAX_CONSECUTIVE_EMPTY || totalSkipped > MAX_STREAK_SKIPS) {
      if (!seenLive) return { days: 0, status: STREAK_STATUS.EMPTY }
      break
    }
  }

  if (days === 0) return { days: 0, status: STREAK_STATUS.EMPTY }
  if (countedToday) return { days, status: STREAK_STATUS.LIVE }
  if (leadingEmpty >= 2) return { days, status: STREAK_STATUS.COOLED }
  if (leadingEmpty >= 1) return { days, status: STREAK_STATUS.PAUSED }
  return { days, status: STREAK_STATUS.LIVE }
}

export function getStreakHeatTier(days, status = STREAK_STATUS.LIVE) {
  const n = Math.max(0, Number(days) || 0)
  let tier = 0
  if (n >= 14) tier = 14
  else if (n >= 7) tier = 7
  else if (n >= 3) tier = 3
  else if (n > 0) tier = 1

  if (status === STREAK_STATUS.COOLED) {
    if (tier >= 14) return 7
    if (tier >= 7) return 3
    if (tier >= 3) return 1
    return tier
  }

  return tier
}
