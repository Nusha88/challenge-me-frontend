import { computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getMissionTemplateById,
  WEEKLY_RITUAL_REWARD_SPARKS
} from '../constants/missionTemplates'
import {
  getWeeklyRitualIdForDate,
  isWeeklyRitualTemplate
} from '../utils/weeklyRitualSchedule'

export const useWeeklyRitualStore = defineStore('weeklyRitual', () => {
  const currentWeeklyRitualId = computed(() => getWeeklyRitualIdForDate())

  const weeklyRitualTemplate = computed(() => (
    getMissionTemplateById(currentWeeklyRitualId.value)
  ))

  const weeklyRewardSparks = WEEKLY_RITUAL_REWARD_SPARKS

  function isWeeklyRitual(templateId) {
    return isWeeklyRitualTemplate(templateId)
  }

  return {
    currentWeeklyRitualId,
    weeklyRitualTemplate,
    weeklyRewardSparks,
    isWeeklyRitual
  }
})
