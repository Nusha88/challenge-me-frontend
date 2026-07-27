/**
 * Progress / pace / invite / about-stats helpers for ChallengeDetailsDialog.
 * Heavy computeds still live in the dialog wiring; this module holds shared pure helpers.
 */
import { getScheduledDaysCount } from '../utils/dateUtils'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

export function countQuestActionsDone(actions = []) {
  let doneCount = 0
  actions.forEach((action) => {
    if (action.checked) doneCount += 1
    if (action.children && Array.isArray(action.children)) {
      action.children.forEach((child) => {
        if (child.checked) doneCount += 1
      })
    }
  })
  return doneCount
}

export function countQuestActionsTotal(actions = []) {
  let totalCount = 0
  actions.forEach((action) => {
    totalCount += 1
    if (action.children && Array.isArray(action.children)) {
      totalCount += action.children.length
    }
  })
  return Math.max(1, totalCount)
}

export function habitDaysElapsed(startDate) {
  if (!startDate) return 0
  const start = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  if (today < start) return 0
  const diffTime = today - start
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1)
}

export function habitScheduledTotal(startDate, endDate, frequency) {
  const total = getScheduledDaysCount(startDate, endDate, frequency)
  return total > 0 ? total : 0
}

export function isResultChallenge(challenge) {
  return challenge?.challengeType === CHALLENGE_TYPES.RESULT
}

export function isHabitChallenge(challenge) {
  return challenge?.challengeType === CHALLENGE_TYPES.HABIT
}
