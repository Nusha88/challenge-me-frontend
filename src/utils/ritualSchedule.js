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

  if (challenge.endDate) {
    const endDate = new Date(challenge.endDate)
    endDate.setHours(0, 0, 0, 0)
    if (targetDate > endDate) return false
  }

  if (challenge.frequency !== 'everyOtherDay') {
    return true
  }

  const diffDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays % 2 === 0
}

export function getCurrentScheduledDayNumber(challenge, todayStr = toDateInputValue()) {
  if (!challenge?.startDate) return 0

  const startKey = toDateInputValue(challenge.startDate)
  if (!startKey || todayStr < startKey) return 0

  const endKey = challenge.endDate ? toDateInputValue(challenge.endDate) : todayStr
  const lastKey = todayStr < endKey ? todayStr : endKey

  let count = 0
  const cursor = new Date(`${startKey}T00:00:00`)
  const last = new Date(`${lastKey}T00:00:00`)
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return 0

  while (cursor <= last) {
    const key = toDateInputValue(cursor)
    if (isDateScheduledForChallenge(challenge, key)) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  return count
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
