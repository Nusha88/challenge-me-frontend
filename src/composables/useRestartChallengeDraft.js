import { getInclusiveDaysBetween, toDateInputValue } from '../utils/dateUtils'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

const RESTART_DRAFT_KEY = 'restartChallengeData'
const RESTARTED_CHALLENGE_ID_KEY = 'restartedChallengeId'

const STANDARD_DURATIONS = ['7', '21', '30']

function normalizePrivacy(privacy) {
  if (privacy === 'solo') {
    return 'private'
  }

  return privacy === 'public' ? 'public' : 'private'
}

function resolveDurationFromDraft(data) {
  if (data.startDate && data.endDate) {
    const diffDays = getInclusiveDaysBetween(data.startDate, data.endDate)

    if (diffDays === 7) {
      return { duration: '7', customDuration: '', customDays: null, showCustomSlider: false }
    }
    if (diffDays === 21) {
      return { duration: '21', customDuration: '', customDays: null, showCustomSlider: false }
    }
    if (diffDays === 30) {
      return { duration: '30', customDuration: '', customDays: null, showCustomSlider: false }
    }

    return {
      duration: 'custom',
      customDuration: String(diffDays),
      customDays: diffDays,
      showCustomSlider: true
    }
  }

  if (!data.duration) {
    return null
  }

  const duration = String(data.duration)
  if (STANDARD_DURATIONS.includes(duration)) {
    return { duration, customDuration: '', customDays: null, showCustomSlider: false }
  }

  return {
    duration: 'custom',
    customDuration: duration,
    customDays: parseInt(duration, 10) || 60,
    showCustomSlider: true
  }
}

function mapActionsToMilestones(actions) {
  const milestones = actions
    .map((action) => ({
      title: action.text || action.title || ''
    }))
    .filter((milestone) => milestone.title.trim() !== '')

  return milestones.length > 0 ? milestones : [{ title: '' }]
}

function normalizeRestartDraft(data) {
  const draft = {
    startOption: 'today'
  }

  if (data.title) draft.title = data.title
  if (data.description) draft.description = data.description
  if (data.imageUrl) draft.imageUrl = data.imageUrl
  if (data.challengeType) draft.challengeType = data.challengeType
  if (data.privacy) draft.privacy = normalizePrivacy(data.privacy)
  if (data.frequency) draft.frequency = data.frequency
  if (data.reward) draft.reward = data.reward
  if (data.difficulty) draft.difficulty = data.difficulty
  if (data.allowComments !== undefined) draft.allowComments = data.allowComments

  const durationState = resolveDurationFromDraft(data)
  if (durationState) {
    Object.assign(draft, durationState)
  }

  const challengeType = draft.challengeType || data.challengeType

  if (data.endDate && challengeType === CHALLENGE_TYPES.RESULT) {
    draft.endDate = toDateInputValue(data.endDate)
  }

  if (challengeType === CHALLENGE_TYPES.RESULT && Array.isArray(data.actions) && data.actions.length > 0) {
    draft.milestones = mapActionsToMilestones(data.actions)
  }

  if (challengeType === CHALLENGE_TYPES.HABIT && (draft.privacy === 'private' || draft.privacy === 'public')) {
    draft.lastHabitPrivacy = draft.privacy
  }

  return draft
}

export function useRestartChallengeDraft() {
  function clearRestartDraft() {
    sessionStorage.removeItem(RESTART_DRAFT_KEY)
  }

  function loadRestartDraft() {
    const raw = sessionStorage.getItem(RESTART_DRAFT_KEY)
    if (!raw) {
      return null
    }

    try {
      const data = JSON.parse(raw)
      clearRestartDraft()
      return normalizeRestartDraft(data)
    } catch (error) {
      console.error('Error loading restart challenge data:', error)
      clearRestartDraft()
      return null
    }
  }

  function getRestartedChallengeId() {
    return sessionStorage.getItem(RESTARTED_CHALLENGE_ID_KEY)
  }

  function clearRestartedChallengeId() {
    sessionStorage.removeItem(RESTARTED_CHALLENGE_ID_KEY)
  }

  return {
    loadRestartDraft,
    clearRestartDraft,
    getRestartedChallengeId,
    clearRestartedChallengeId
  }
}
