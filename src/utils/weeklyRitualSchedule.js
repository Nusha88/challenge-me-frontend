import { getMissionTemplateIds } from '../constants/missionTemplates'

/**
 * ISO week number. Must match backend `utils/weeklyRitual.js`.
 */
export function getIsoWeekNumber(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc - yearStart) / 86400000 + 1) / 7)
}

export function getWeeklyRitualIdForDate(date = new Date()) {
  const ids = getMissionTemplateIds()
  if (!ids.length) return null
  return ids[getIsoWeekNumber(date) % ids.length]
}

export function isWeeklyRitualTemplate(templateId, date = new Date()) {
  return Boolean(templateId) && templateId === getWeeklyRitualIdForDate(date)
}
