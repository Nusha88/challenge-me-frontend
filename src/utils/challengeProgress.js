import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { getScheduledDaysCount } from './dateUtils'
import { getParticipantUserId } from './challengeMembership'

export function getChallengeTotalDays(challenge) {
  const total = getScheduledDaysCount(
    challenge?.startDate,
    challenge?.endDate,
    challenge?.frequency
  )
  return total > 0 ? total : 0
}

export function getOwnerProgressDone(challenge) {
  if (!challenge?.owner) return 0

  if (challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    if (!challenge.actions || !Array.isArray(challenge.actions)) return 0

    let checkedCount = 0
    challenge.actions.forEach((action) => {
      if (action.checked) checkedCount++
      if (action.children && Array.isArray(action.children)) {
        action.children.forEach((child) => {
          if (child.checked) checkedCount++
        })
      }
    })
    return checkedCount
  }

  if (!challenge.participants) return 0

  const ownerId = challenge.owner._id || challenge.owner
  const participant = challenge.participants.find((p) => {
    const userId = getParticipantUserId(p)
    return userId && userId.toString() === ownerId.toString()
  })

  if (!participant?.completedDays) return 0
  return participant.completedDays.length
}

export function getOwnerProgressTotal(challenge) {
  if (challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    if (!challenge.actions || !Array.isArray(challenge.actions)) return 0

    let totalCount = 0
    challenge.actions.forEach((action) => {
      totalCount++
      if (action.children && Array.isArray(action.children)) {
        totalCount += action.children.length
      }
    })
    return Math.max(1, totalCount)
  }

  return getChallengeTotalDays(challenge)
}

export function getOwnerProgressPercentage(challenge) {
  const done = getOwnerProgressDone(challenge)
  const total = getOwnerProgressTotal(challenge)
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

export function getParticipantProgressDone(participant, challenge) {
  if (!participant || challenge?.challengeType === CHALLENGE_TYPES.RESULT) return 0
  if (!participant.completedDays || !Array.isArray(participant.completedDays)) return 0
  return participant.completedDays.length
}

export function getParticipantProgressPercentage(participant, challenge) {
  if (participant?._cachedProgressPercentage !== undefined) {
    return participant._cachedProgressPercentage
  }

  const progress = getParticipantProgressDone(participant, challenge)
  const total = getChallengeTotalDays(challenge)
  if (total === 0) return 0
  return Math.round((progress / total) * 100)
}

export function getParticipantDisplayName(participant, unknownLabel = 'Unknown') {
  return participant?.userId?.name || participant?.name || unknownLabel
}

export function getParticipantAvatar(participant) {
  return participant?.userId?.avatarUrl || participant?.avatarUrl || null
}

export function getParticipantInitial(participant, unknownLabel = 'Unknown') {
  const name = getParticipantDisplayName(participant, unknownLabel)
  return name.charAt(0).toUpperCase()
}

export function buildTopPerformers(challenges, { limit = 5 } = {}) {
  const participantMap = new Map()

  ;(challenges || []).forEach((challenge) => {
    if (challenge.challengeType !== CHALLENGE_TYPES.HABIT) return
    if (!Array.isArray(challenge.participants)) return

    challenge.participants.forEach((participant) => {
      const participantId = getParticipantUserId(participant)
      const progressPercentage = getParticipantProgressPercentage(participant, challenge)
      if (progressPercentage <= 0) return

      const existing = participantMap.get(participantId)
      if (!existing || existing.progressPercentage < progressPercentage) {
        participantMap.set(participantId, {
          participant,
          challenge,
          progressPercentage
        })
      }
    })
  })

  return Array.from(participantMap.values())
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, limit)
    .map((item) => ({
      ...item.participant,
      _cachedProgressPercentage: item.progressPercentage,
      _cachedChallenge: item.challenge
    }))
}
