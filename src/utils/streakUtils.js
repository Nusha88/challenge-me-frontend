import { normalizeDateKey, toDateInputValue } from './dateUtils'

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
  let streak = 0
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateInputValue(currentDate)

    if (!completedDates.has(dateStr)) {
      break
    }

    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

export function getStreakHeatTier(days) {
  const n = Math.max(0, Number(days) || 0)
  if (n >= 14) return 14
  if (n >= 7) return 7
  if (n >= 3) return 3
  return n > 0 ? 1 : 0
}
