import { unref } from 'vue'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { isChallengeEnded } from './challengeStatus'

export function getParticipantUserId(participant) {
  return participant?.userId?._id || participant?.userId || participant?._id || participant
}

export function isChallengeOwner(owner, currentUserId) {
  const userId = unref(currentUserId)
  if (!owner || !userId) return false
  const ownerId = owner._id || owner
  return ownerId.toString() === userId.toString()
}

export function isChallengeParticipant(challenge, currentUserId) {
  const userId = unref(currentUserId)
  if (!userId || !challenge?.participants) return false

  return challenge.participants.some((participant) => {
    const participantId = getParticipantUserId(participant)
    return participantId && participantId.toString() === userId.toString()
  })
}

export function canJoinHabitChallenge(challenge, currentUserId) {
  if (!challenge || !unref(currentUserId)) return false
  if (isChallengeEnded(challenge)) return false
  if (challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false
  if (isChallengeOwner(challenge.owner, currentUserId)) return false
  if (isChallengeParticipant(challenge, currentUserId)) return false
  return true
}
