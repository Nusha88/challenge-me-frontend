import { toDateInputValue } from './dateUtils'
import { getDayProtectionSource, isDayEffectiveCompleted } from './participantDays'

export function getYesterdayDateStr(referenceDate = new Date()) {
  const yesterday = new Date(referenceDate)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return toDateInputValue(yesterday)
}

export function isDateScheduledForChallenge(challenge, dateStr) {
  if (!challenge?.startDate || !dateStr) return false

  const startDate = new Date(challenge.startDate)
  const targetDate = new Date(dateStr)
  startDate.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  if (targetDate < startDate) return false

  if (challenge.frequency !== 'everyOtherDay') {
    return true
  }

  const diffDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays % 2 === 0
}

export function getMissionRitualState(participant, challenge, todayStr = toDateInputValue(new Date())) {
  if (!participant || !challenge) return 'active'

  const todaySource = getDayProtectionSource(participant, todayStr)
  if (todaySource === 'frozen') return 'frozen_today'

  const yesterdayStr = getYesterdayDateStr(new Date(todayStr))
  if (
    isDateScheduledForChallenge(challenge, yesterdayStr) &&
    !isDayEffectiveCompleted(participant, yesterdayStr)
  ) {
    return 'failed_yesterday'
  }

  return 'active'
}
