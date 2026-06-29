import { isFutureDate, isPastDate, getScheduledDaysCount } from './dateUtils'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

function getParticipantUserId(participant) {
  return participant?.userId?._id || participant?.userId || participant?._id || participant
}

function findChallengeParticipant(challenge, userId) {
  if (!challenge || !userId || !Array.isArray(challenge.participants)) {
    return null
  }

  return challenge.participants.find((participant) => {
    const participantId = getParticipantUserId(participant)
    return participantId && participantId.toString() === userId.toString()
  }) || null
}

function isHabitChallengeCompleted(challenge, participant) {
  const totalScheduled = getScheduledDaysCount(
    challenge.startDate,
    challenge.endDate,
    challenge.frequency
  )
  if (totalScheduled <= 0) return false

  const completedCount = Array.isArray(participant?.completedDays)
    ? participant.completedDays.length
    : 0

  return completedCount >= totalScheduled
}

export function isChallengeEnded(challenge) {
  return isPastDate(challenge?.endDate)
}

export function isChallengeUpcoming(challenge) {
  return isFutureDate(challenge?.startDate)
}

export function areActionsCompleted(actions) {
  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    return false
  }

  return actions.every((action) => {
    if (!action.checked) {
      return false
    }

    if (action.children && Array.isArray(action.children) && action.children.length > 0) {
      return action.children.every((child) => child.checked)
    }

    return true
  })
}

export function isChallengeFinished(challenge) {
  if (!challenge) {
    return false
  }

  if (isChallengeEnded(challenge)) {
    return true
  }

  if (challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    return Boolean(challenge.resultMissionEndedAt)
  }

  return false
}

export function isChallengeSuccessful(challenge, userId) {
  if (!isChallengeFinished(challenge)) {
    return false
  }

  if (challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    return areActionsCompleted(challenge.actions)
  }

  if (challenge.challengeType === CHALLENGE_TYPES.HABIT) {
    const participant = findChallengeParticipant(challenge, userId)
    if (!participant) return false
    return isHabitChallengeCompleted(challenge, participant)
  }

  return false
}

export function isChallengeParticipant(challenge, userId) {
  return Boolean(findChallengeParticipant(challenge, userId))
}

export function isChallengeOwner(challenge, userId) {
  if (!challenge?.owner || !userId) return false

  const ownerId = challenge.owner._id || challenge.owner
  return Boolean(ownerId && ownerId.toString() === userId.toString())
}

export function canOpenChallenge(challenge, userId) {
  if (!challenge) return false
  if (!isChallengeUpcoming(challenge)) return true
  return isChallengeOwner(challenge, userId)
}
