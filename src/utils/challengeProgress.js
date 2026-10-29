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

