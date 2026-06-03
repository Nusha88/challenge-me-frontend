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
  })

  return completedDates
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
