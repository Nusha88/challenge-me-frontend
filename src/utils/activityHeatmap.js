import { normalizeDateKey, toDateInputValue, addDays } from './dateUtils'
import { isDateScheduledForChallenge } from './ritualSchedule'
import { findParticipantForUser, isDayEffectiveCompleted } from './participantDays'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

export const ACTIVITY_LEVEL = {
  EMPTY: 'empty',
  MISS: 'miss',
  LOW: 'low',
  MID: 'mid',
  HIGH: 'high'
}

export const ACTIVITY_WEEKS = 26

/** Monday = 1 … Sunday = 0 in JS getDay(); we want Monday-start weeks. */
function startOfWeekMonday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function getChecklistDateKey(entry) {
  if (!entry) return null
  if (entry.clientDay) {
    return normalizeDateKey(entry.clientDay) || String(entry.clientDay).slice(0, 10)
  }
  if (entry.localDate) {
    return normalizeDateKey(entry.localDate) || String(entry.localDate).slice(0, 10)
  }
  if (entry.date) {
    return normalizeDateKey(entry.date) || toDateInputValue(new Date(entry.date))
  }
  return null
}

export function indexChecklistByDate(checklistHistory = []) {
  const map = new Map()
  for (const entry of checklistHistory || []) {
    const key = getChecklistDateKey(entry)
    if (key) map.set(key, entry)
  }
  return map
}

export function filterHabitChallengesForUser(challenges, userId) {
  if (!userId) return []
  return (challenges || []).filter((challenge) => {
    if (challenge?.challengeType !== CHALLENGE_TYPES.HABIT) return false
    return Boolean(findParticipantForUser(challenge, userId))
  })
}

function isChallengeActiveOnDate(challenge, dateStr) {
  if (!challenge?.startDate || !dateStr) return false

  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)

  const start = new Date(challenge.startDate)
  start.setHours(0, 0, 0, 0)
  if (target < start) return false

  if (challenge.endDate) {
    const end = new Date(challenge.endDate)
    end.setHours(0, 0, 0, 0)
    if (target > end) return false
  }

  return isDateScheduledForChallenge(challenge, dateStr)
}

export function activityLevelFromRatio(completed, total) {
  if (total <= 0) return ACTIVITY_LEVEL.EMPTY
  const pct = (completed / total) * 100
  if (pct === 0) return ACTIVITY_LEVEL.MISS
  if (pct <= 50) return ACTIVITY_LEVEL.LOW
  if (pct <= 80) return ACTIVITY_LEVEL.MID
  return ACTIVITY_LEVEL.HIGH
}

/**
 * Compute activity stats for a single owner-local date key.
 */
export function computeDayActivity({
  dateStr,
  habitChallenges = [],
  userId,
  checklistByDate = new Map()
}) {
  let scheduledHabits = 0
  let completedHabits = 0

  for (const challenge of habitChallenges) {
    if (!isChallengeActiveOnDate(challenge, dateStr)) continue
    scheduledHabits += 1
    const participant = findParticipantForUser(challenge, userId)
    if (participant && isDayEffectiveCompleted(participant, dateStr)) {
      completedHabits += 1
    }
  }

  const checklist = checklistByDate.get(dateStr) || null
  const tasks = Array.isArray(checklist?.tasks) ? checklist.tasks : []
  const checklistSteps = tasks.length
  const completedSteps = tasks.filter((task) => task && task.done).length

  const total = scheduledHabits + checklistSteps
  const completed = completedHabits + completedSteps
  const level = activityLevelFromRatio(completed, total)
  const pct = total > 0 ? (completed / total) * 100 : 0

  return {
    dateStr,
    level,
    scheduledHabits,
    completedHabits,
    checklistSteps,
    completedSteps,
    total,
    completed,
    pct
  }
}

/**
 * Fixed 26-week calendar-aligned window ending at `endDate` (viewer “today” is fine).
 * Cell keys are YYYY-MM-DD strings for lookup against stored API dates.
 */
export function buildActivityWindow({ weeks = ACTIVITY_WEEKS, endDate = new Date() } = {}) {
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const endWeekStart = startOfWeekMonday(end)
  const start = addDays(endWeekStart, -(weeks - 1) * 7)

  const days = []
  const columns = []

  for (let w = 0; w < weeks; w += 1) {
    const weekStart = addDays(start, w * 7)
    const weekDays = []
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(weekStart, d)
      const dateStr = toDateInputValue(date)
      const cell = { dateStr, date, future: date > end }
      weekDays.push(cell)
      days.push(cell)
    }
    columns.push({
      weekStart,
      weekStartStr: toDateInputValue(weekStart),
      days: weekDays
    })
  }

  return { start, end, days, columns, weeks }
}

export function buildMonthLabels(columns, locale = 'en') {
  const labels = []
  let lastMonthKey = ''

  columns.forEach((col, index) => {
    const monthKey = `${col.weekStart.getFullYear()}-${col.weekStart.getMonth()}`
    if (monthKey === lastMonthKey) {
      labels.push({ index, label: '', show: false })
      return
    }
    lastMonthKey = monthKey
    const label = col.weekStart.toLocaleDateString(locale, { month: 'short' })
    labels.push({ index, label, show: true })
  })

  return labels
}

/**
 * Precompute Map<dateStr, dayStats> + grid for the Activity heatmap.
 */
export function buildActivityHeatmap({
  habitChallenges = [],
  userId,
  checklistHistory = [],
  weeks = ACTIVITY_WEEKS,
  endDate = new Date(),
  locale = 'en'
} = {}) {
  const window = buildActivityWindow({ weeks, endDate })
  const checklistByDate = indexChecklistByDate(checklistHistory)
  const byDate = new Map()

  for (const cell of window.days) {
    if (cell.future) {
      byDate.set(cell.dateStr, {
        dateStr: cell.dateStr,
        level: ACTIVITY_LEVEL.EMPTY,
        scheduledHabits: 0,
        completedHabits: 0,
        checklistSteps: 0,
        completedSteps: 0,
        total: 0,
        completed: 0,
        pct: 0,
        future: true
      })
      continue
    }

    const stats = computeDayActivity({
      dateStr: cell.dateStr,
      habitChallenges,
      userId,
      checklistByDate
    })
    byDate.set(cell.dateStr, { ...stats, future: false })
  }

  const monthLabels = buildMonthLabels(window.columns, locale)
  const hasAnyScheduled = [...byDate.values()].some((d) => d.total > 0)

  return {
    ...window,
    byDate,
    monthLabels,
    hasAnyScheduled
  }
}
