import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { addDays, toDateInputValue } from './dateUtils'

export function buildHabitChallengeFromTemplate(template, { startDate = new Date() } = {}) {
  if (!template) return null

  const start = toDateInputValue(startDate)
  const duration = Number(template.durationDays || 21)
  const days = Number.isFinite(duration) && duration > 0 ? duration : 21

  return {
    title: template.title || '',
    description: template.description || '',
    startDate: start,
    endDate: toDateInputValue(addDays(start, days - 1)),
    imageUrl: template.imageUrl || '',
    privacy: template.privacy || 'public',
    challengeType: template.challengeType || CHALLENGE_TYPES.HABIT,
    frequency: template.frequency || 'daily',
    allowComments: true,
    templateId: template.id || ''
  }
}
