import { getLevelFromXp, getXpForLevel, getLevelInfo } from './levelSystem'

export function getUserInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0] || ''}${parts[1][0] || ''}`
  return initials.toUpperCase()
}

export function getDaysOnSite(dateString) {
  if (!dateString) return 0

  try {
    const registrationDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    registrationDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today - registrationDate) / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  } catch {
    return 0
  }
}

export function getUserTotalXp(user) {
  return Math.max(0, Number(user?.xp || 0))
}

export function getUserLevel(user) {
  const explicitLevel = Number(user?.level)
  if (Number.isFinite(explicitLevel) && explicitLevel > 0) {
    return Math.floor(explicitLevel)
  }
  return getLevelFromXp(getUserTotalXp(user))
}

export function getUserCurrentXp(user) {
  const xp = getUserTotalXp(user)
  const level = getUserLevel(user)
  const xpForCurrentLevel = getXpForLevel(level)
  return Math.max(0, xp - xpForCurrentLevel)
}

export function getUserLevelProgressPercent(user) {
  const level = getUserLevel(user)
  const levelInfo = getLevelInfo(level)
  const currentXp = getUserCurrentXp(user)
  const xpPerLevel = levelInfo.xpPerLvl || 1
  return Math.min(100, Math.max(0, (currentXp / xpPerLevel) * 100))
}

export function getLocalizedLevelInfo(level, t) {
  const levelInfo = getLevelInfo(level)
  return {
    ...levelInfo,
    rankName: t(`profile.ranks.${levelInfo.rankKey}`)
  }
}

export function enrichUserForDisplay(user, t) {
  const level = getUserLevel(user)
  const levelInfo = getLocalizedLevelInfo(level, t)

  return {
    ...user,
    daysOnSite: getDaysOnSite(user.createdAt),
    displayLevel: level,
    displayXp: getUserTotalXp(user),
    progressPercent: getUserLevelProgressPercent(user),
    rankName: levelInfo.rankName,
    rankColor: levelInfo.color,
    initials: getUserInitials(user.name)
  }
}
