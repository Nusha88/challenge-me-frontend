import { unref } from 'vue'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { isChallengeEnded } from './challengeStatus'

export function getParticipantUserId(participant) {
  return participant?.userId?._id
    || participant?.userId?.id
    || participant?.userId
    || participant?._id
    || participant?.id
    || participant
}

export function isChallengeOwner(owner, currentUserId) {
  const userId = unref(currentUserId)
  if (!owner || !userId) return false
  const ownerId = owner._id || owner.id || owner
  return ownerId.toString() === userId.toString()
}

export function isChallengeParticipant(challenge, currentUserId) {
  const userId = unref(currentUserId)
  if (!userId || !challenge) return false

  // Owners are always treated as members for CTA / community access.
  if (isChallengeOwner(challenge.owner, userId)) return true

  if (!Array.isArray(challenge.participants)) return false

  return challenge.participants.some((participant) => {
    const participantId = getParticipantUserId(participant)
    return participantId && participantId.toString() === userId.toString()
  })
}

export function canJoinHabitChallenge(challenge, currentUserId) {
  if (!challenge || !unref(currentUserId)) return false
  if (isChallengeEnded(challenge)) return false
  if (challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false
  if (challenge.inviteOnly) return false
  if (isChallengeOwner(challenge.owner, currentUserId)) return false
  if (isChallengeParticipant(challenge, currentUserId)) return false
  return true
}

export const MAX_SQUAD_GUESTS = 12

export function isSquadRitual(challenge) {
  return Boolean(challenge?.inviteOnly) && challenge?.challengeType === CHALLENGE_TYPES.HABIT
}

export function isPendingSquadInvite(challenge, currentUserId) {
  const userId = unref(currentUserId)
  if (!isSquadRitual(challenge) || !userId) return false
  if (challenge.isPendingInvite) return true
  return (challenge.invites || []).some((row) => {
    const inviteeId = row?.userId?._id || row?.userId?.id || row?.userId
    return inviteeId && String(inviteeId) === String(userId)
  })
}
