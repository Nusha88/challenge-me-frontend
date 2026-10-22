import { isChallengeFinished, isChallengeUpcoming } from './challengeStatus'

export function isActiveTemplateChallenge(challenge, templateId) {
  if (!challenge || !templateId) return false
  if (String(challenge.templateId || '') !== String(templateId)) return false
  return !isChallengeFinished(challenge)
}

export function findActiveTemplateChallenge(challenges, templateId) {
  if (!templateId) return null

  const matches = (challenges || []).filter((challenge) => {
    return isActiveTemplateChallenge(challenge, templateId)
  })

  return matches.find((challenge) => !isChallengeUpcoming(challenge)) || matches[0] || null
}

export function indexActiveTemplateChallenges(challenges) {
  const map = {}
  const ids = new Set()

  for (const challenge of challenges || []) {
    const id = String(challenge?.templateId || '')
    if (id) ids.add(id)
  }

  for (const id of ids) {
    const found = findActiveTemplateChallenge(challenges, id)
    if (found) map[id] = found
  }

  return map
}
