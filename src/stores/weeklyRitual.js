import { computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getMissionTemplateById,
  getMissionTemplateIds,
  WEEKLY_RITUAL_REWARD_SPARKS
} from '../constants/missionTemplates'

function getIsoWeekNumber(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc - yearStart) / 86400000 + 1) / 7)
}

export const useWeeklyRitualStore = defineStore('weeklyRitual', () => {
  const currentWeeklyRitualId = computed(() => {
    const ids = getMissionTemplateIds()
    if (!ids.length) return null
    return ids[getIsoWeekNumber() % ids.length]
  })

  const weeklyRitualTemplate = computed(() => (
    getMissionTemplateById(currentWeeklyRitualId.value)
  ))

  const weeklyRewardSparks = WEEKLY_RITUAL_REWARD_SPARKS

  function isWeeklyRitual(templateId) {
    return Boolean(templateId) && templateId === currentWeeklyRitualId.value
  }

  return {
    currentWeeklyRitualId,
    weeklyRitualTemplate,
    weeklyRewardSparks,
    isWeeklyRitual
  }
})
