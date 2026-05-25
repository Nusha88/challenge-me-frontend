import { isFutureDate, isPastDate } from './dateUtils'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

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
    return areActionsCompleted(challenge.actions)
  }

  return false
}
