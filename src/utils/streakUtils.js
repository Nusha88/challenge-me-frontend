import { normalizeDateKey, toDateInputValue } from './dateUtils'
import {
  STREAK_STATUS,
  MAX_STREAK_SKIPS,
  MAX_CONSECUTIVE_EMPTY,
  resolveStreakFromDays,
  getStreakHeatTier
} from './streakResolve'

export {
  STREAK_STATUS,
  MAX_STREAK_SKIPS,
  MAX_CONSECUTIVE_EMPTY,
  resolveStreakFromDays,
  getStreakHeatTier
}

export function buildCompletedDateSet(checklists, habitChallenges, userId) {
  const completedDates = new Set()

  checklists.forEach((checklist) => {
    const hasCompletedTask = checklist.tasks?.some((task) => task.done === true)

    if (hasCompletedTask) {
      const dateKey = toDateInputValue(new Date(checklist.date))
      if (dateKey) {
        completedDates.add(dateKey)
      }
    }
  })

  habitChallenges.forEach((challenge) => {
    const participant = challenge.participants?.find((p) => {
      const participantUserId = p.userId?._id || p.userId || p._id
      return participantUserId && participantUserId.toString() === userId.toString()
    })

    participant?.completedDays?.forEach((completedDate) => {
      const dateStr = normalizeDateKey(completedDate)
      if (dateStr) {
        completedDates.add(dateStr)
      }
    })

    participant?.frozenDays?.forEach((frozenDate) => {
      const dateStr = normalizeDateKey(frozenDate)
      if (dateStr) {
        completedDates.add(dateStr)
      }
    })

    participant?.secondChanceDays?.forEach((secondChanceDate) => {
      const dateStr = normalizeDateKey(secondChanceDate)
      if (dateStr) {
        completedDates.add(dateStr)
      }
    })
  })

  return completedDates
}

export function resolveStreak(completedDates, today = new Date()) {
  const completed = completedDates instanceof Set ? completedDates : new Set(completedDates || [])
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)
  const keys = []
  for (let i = 0; i < 365; i++) {
    keys.push(toDateInputValue(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return resolveStreakFromDays((index) => completed.has(keys[index]))
}

export function isAuraDimmed(completedDates, today = new Date()) {
  if (!(completedDates instanceof Set) || completedDates.size === 0) {
    return false
  }

  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() - 1)

  for (let i = 0; i < 3; i++) {
    const dateStr = toDateInputValue(cursor)
    if (completedDates.has(dateStr)) {
      return false
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return true
}

export function calculateStreakFromDate(startDate, completedDates) {
  return resolveStreak(completedDates, startDate).days
}
