/**
 * Single payload shape for triumph / achievement share posters.
 */

export function createEmptyTriumphSharePayload() {
  return {
    questTitle: '',
    stepName: '',
    userText: '',
    userImage: '',
    userImageDataUrl: '',
    userLevel: 1,
    userRankTitle: '',
    isFinal: false,
    xpEarned: 0,
    sparksEarned: 0,
    completedSteps: 0,
    totalSteps: 0,
    missionDates: '',
    missionType: 'quest',
    completedDays: 0,
    totalDays: 0,
    completionTier: '',
    challengeId: null
  }
}

export function assignTriumphSharePayload(target, source = {}) {
  const next = { ...createEmptyTriumphSharePayload(), ...source }
  Object.keys(next).forEach((key) => {
    target[key] = next[key]
  })
  return target
}

export function buildQuestStepPayload({
  challenge,
  stepName = '',
  userText = '',
  userImage = '',
  userImageDataUrl = '',
  userLevel = 1,
  userRankTitle = ''
} = {}) {
  return {
    ...createEmptyTriumphSharePayload(),
    questTitle: challenge?.title || '',
    stepName,
    userText,
    userImage,
    userImageDataUrl,
    userLevel,
    userRankTitle,
    isFinal: false,
    missionType: 'quest',
    challengeId: challenge?._id || challenge?.id || null
  }
}

export function buildFinalTriumphPayload({
  challenge,
  reflection = '',
  userLevel = 1,
  userRankTitle = '',
  xpEarned = 0,
  sparksEarned = 0,
  completedSteps = 0,
  totalSteps = 0,
  missionDates = '',
  missionType = 'quest',
  completedDays = 0,
  totalDays = 0,
  completionTier = ''
} = {}) {
  return {
    ...createEmptyTriumphSharePayload(),
    questTitle: challenge?.title || '',
    userText: reflection,
    userLevel,
    userRankTitle,
    isFinal: true,
    xpEarned,
    sparksEarned,
    completedSteps,
    totalSteps,
    missionDates,
    missionType,
    completedDays,
    totalDays,
    completionTier,
    challengeId: challenge?._id || challenge?.id || null
  }
}
