import { getScheduledDaysCount, normalizeDateKey, toDateInputValue } from './dateUtils'
import { getEffectiveCompletedDays } from './participantDays'

export const MISSION_TIERS = Object.freeze({
  PERFECT: 'perfect',
  BRIGHT: 'bright',
  SUSTAINED: 'sustained',
  EXTINGUISHED: 'extinguished'
})

export function getParticipantJoinedAtKey(challenge, participant) {
  const joined = participant?.joinedAt || challenge?.startDate
  return normalizeDateKey(joined)
}

export function countPersonalScheduledDays(challenge, participant) {
  const startKey = getParticipantJoinedAtKey(challenge, participant)
  const endKey = normalizeDateKey(challenge?.endDate)
  if (!startKey || !endKey || endKey < startKey) return 0

  return getScheduledDaysCount(startKey, endKey, challenge?.frequency)
}

export function countPersonalEffectiveDays(challenge, participant) {
  const startKey = getParticipantJoinedAtKey(challenge, participant)
  const endKey = normalizeDateKey(challenge?.endDate)
  if (!startKey || !endKey) return 0

  const start = new Date(`${startKey}T00:00:00`)
  start.setHours(0, 0, 0, 0)

  return getEffectiveCompletedDays(participant).filter((dayKey) => {
    if (dayKey < startKey || dayKey > endKey) return false
    if (challenge?.frequency === 'everyOtherDay') {
      const current = new Date(`${dayKey}T00:00:00`)
      current.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24))
      return diffDays % 2 === 0
    }
    return true
  }).length
}

export function calculateCompletionRate(challenge, participant) {
  const total = countPersonalScheduledDays(challenge, participant)
  if (total <= 0) return 0
  const done = countPersonalEffectiveDays(challenge, participant)
  return Math.round((done / total) * 1000) / 10
}

export function resolveMissionTier(completionRate) {
  if (completionRate >= 100) return MISSION_TIERS.PERFECT
  if (completionRate >= 85) return MISSION_TIERS.BRIGHT
  if (completionRate >= 70) return MISSION_TIERS.SUSTAINED
  return MISSION_TIERS.EXTINGUISHED
}

export function isLateJoiner(challenge, participant) {
  const joinedKey = getParticipantJoinedAtKey(challenge, participant)
  const startKey = normalizeDateKey(challenge?.startDate)
  if (!joinedKey || !startKey) return false
  return joinedKey > startKey
}

export function getStandardMissionDuration(challenge) {
  return getScheduledDaysCount(
    challenge?.startDate,
    challenge?.endDate,
    challenge?.frequency
  )
}

export function needsSoloContinuation(challenge, participant) {
  if (!isLateJoiner(challenge, participant)) return false
  const personalTotal = countPersonalScheduledDays(challenge, participant)
  const standardDuration = getStandardMissionDuration(challenge)
  return personalTotal < standardDuration
}

export function shouldTriggerHabitMissionCompletion(
  challenge,
  completedDays,
  clientDayStr = toDateInputValue(new Date())
) {
  if (challenge?.challengeType !== 'habit') return false
  if (!isMissionFinalDay(challenge, clientDayStr)) return false

  const normalizedDays = (completedDays || [])
    .map(normalizeDateKey)
    .filter(Boolean)

  return normalizedDays.includes(clientDayStr)
}

export function isMissionFinalDay(challenge, clientDayStr) {
  const endKey = normalizeDateKey(challenge?.endDate)
  if (!endKey || clientDayStr !== endKey) return false

  if (challenge?.frequency === 'everyOtherDay') {
    const startKey = normalizeDateKey(challenge.startDate)
    if (!startKey) return false
    const start = new Date(`${startKey}T00:00:00`)
    const current = new Date(`${clientDayStr}T00:00:00`)
    start.setHours(0, 0, 0, 0)
    current.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24))
    return diffDays % 2 === 0
  }

  return true
}

export function getSuggestedSoloEndDate(challenge, participant) {
  const joinedKey = getParticipantJoinedAtKey(challenge, participant)
  const standardDuration = getStandardMissionDuration(challenge)
  if (!joinedKey || standardDuration <= 0) return ''

  const start = new Date(`${joinedKey}T00:00:00`)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + standardDuration - 1)
  return toDateInputValue(start)
}

export function getRemainingSoloDays(challenge, participant) {
  const personalTotal = countPersonalScheduledDays(challenge, participant)
  const standardDuration = getStandardMissionDuration(challenge)
  return Math.max(0, standardDuration - personalTotal)
}
