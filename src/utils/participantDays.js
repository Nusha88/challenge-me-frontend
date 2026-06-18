import { normalizeDateKey } from './dateUtils'

function getParticipantDayKeys(participant, field) {
  return (participant?.[field] || [])
    .map((day) => normalizeDateKey(day))
    .filter(Boolean)
}

export function getEffectiveCompletedDays(participant) {
  if (!participant) return []

  const keys = new Set([
    ...getParticipantDayKeys(participant, 'completedDays'),
    ...getParticipantDayKeys(participant, 'frozenDays'),
    ...getParticipantDayKeys(participant, 'secondChanceDays')
  ])

  return [...keys].sort()
}

export function getDayProtectionSource(participant, dateStr) {
  if (!participant) return null

  const key = normalizeDateKey(dateStr)
  if (!key) return null

  if (getParticipantDayKeys(participant, 'completedDays').includes(key)) {
    return 'normal'
  }
  if (getParticipantDayKeys(participant, 'frozenDays').includes(key)) {
    return 'frozen'
  }
  if (getParticipantDayKeys(participant, 'secondChanceDays').includes(key)) {
    return 'secondChance'
  }

  return null
}

export function isDayEffectiveCompleted(participant, dateStr) {
  return getDayProtectionSource(participant, dateStr) !== null
}

export function findParticipantForUser(challenge, userId) {
  if (!challenge?.participants || !userId) return null

  return challenge.participants.find((participant) => {
    const participantUserId =
      participant?.userId?._id || participant?.userId || participant?._id
    return participantUserId && participantUserId.toString() === userId.toString()
  }) || null
}
