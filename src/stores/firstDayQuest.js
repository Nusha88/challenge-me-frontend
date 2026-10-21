import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { userService } from '../services/api'
import {
  getDemoChecklistForDate,
  setDemoChecklistForDate
} from '../services/demoStorage'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { fireConfetti } from '../utils/confetti'
import { toDateInputValue } from '../utils/dateUtils'
import {
  FIRST_DAY_STATUS,
  hasFirstDayQuestStep,
  isOnboardingPending,
  markOnboardingComplete,
  readFirstDayQuest,
  writeFirstDayQuest
} from '../utils/firstDayQuest'

let plantInFlight = null

export const useFirstDayQuestStore = defineStore('firstDayQuest', () => {
  const { applyRewardResponse } = useXpAwardFeedback()

  const initial = readFirstDayQuest()
  const status = ref(initial.status)
  const completedOn = ref(initial.completedOn)
  const closedDismissed = ref(false)
  const planting = ref(false)
  const plantError = ref('')
  const plantedThisSession = ref(false)

  const isQuestActive = computed(() => status.value === FIRST_DAY_STATUS.ACTIVE)

  const showClosedMessage = computed(() => {
    return status.value === FIRST_DAY_STATUS.DONE
      && completedOn.value === toDateInputValue()
      && !closedDismissed.value
  })

  const suppressCompletionCelebration = computed(() => {
    return isQuestActive.value
      || (status.value === FIRST_DAY_STATUS.DONE && completedOn.value === toDateInputValue())
  })

  function persist() {
    writeFirstDayQuest({
      status: status.value,
      completedOn: completedOn.value
    })
  }

  function activate() {
    status.value = FIRST_DAY_STATUS.ACTIVE
    completedOn.value = null
    persist()
  }

  function skipForExistingUser() {
    status.value = FIRST_DAY_STATUS.DONE
    completedOn.value = null
    persist()
    markOnboardingComplete()
  }

  function dismissClosed() {
    closedDismissed.value = true
  }

  function clearPlantError() {
    plantError.value = ''
  }

  function completeIfActive() {
    if (status.value !== FIRST_DAY_STATUS.ACTIVE) return false

    status.value = FIRST_DAY_STATUS.DONE
    completedOn.value = toDateInputValue()
    closedDismissed.value = false
    persist()
    markOnboardingComplete()
    fireConfetti({ duration: 1600, particleCount: 4 })
    return true
  }

  function syncFromToday({ hasCompletedToday } = {}) {
    if (status.value === FIRST_DAY_STATUS.ACTIVE && hasCompletedToday) {
      completeIfActive()
    }
  }

  function reopenIfStale({ hasCompletedToday } = {}) {
    if (status.value !== FIRST_DAY_STATUS.DONE) return false
    if (completedOn.value !== toDateInputValue()) return false
    if (hasCompletedToday) return false

    status.value = FIRST_DAY_STATUS.ACTIVE
    completedOn.value = null
    plantedThisSession.value = false
    persist()
    return true
  }

  function shouldPlant({ hasMissions, isDemo, existingTasks, stepTitle }) {
    if (status.value === FIRST_DAY_STATUS.DONE) return false
    if (plantedThisSession.value) return false

    if (hasFirstDayQuestStep(existingTasks, stepTitle)) {
      if (status.value !== FIRST_DAY_STATUS.ACTIVE) activate()
      return false
    }

    if (isDemo) return true
    if (hasMissions && status.value !== FIRST_DAY_STATUS.ACTIVE) {
      skipForExistingUser()
      return false
    }

    return isOnboardingPending() || status.value === FIRST_DAY_STATUS.ACTIVE
  }

  async function plantStep({ isDemo, existingTasks, stepTitle }) {
    const title = String(stepTitle || '').trim()
    if (!title) throw new Error('first-day-step-missing')

    if (isDemo) {
      const currentTasks = Array.isArray(existingTasks)
        ? existingTasks
        : getDemoChecklistForDate().tasks
      if (!hasFirstDayQuestStep(currentTasks, title)) {
        setDemoChecklistForDate(toDateInputValue(), [{ title, done: false }, ...currentTasks])
      }
      plantedThisSession.value = true
      activate()
      return true
    }

    const todayResponse = await userService.getTodayChecklist()
    const currentTasks = todayResponse.data?.checklist?.tasks || []
    if (hasFirstDayQuestStep(currentTasks, title)) {
      plantedThisSession.value = true
      activate()
      return true
    }

    const response = await userService.updateTodayChecklist([
      { title, done: false },
      ...currentTasks
    ])
    applyRewardResponse(response)
    plantedThisSession.value = true
    activate()
    return true
  }

  async function ensureFirstDayStep({
    hasMissions = false,
    isDemo = false,
    existingTasks = [],
    stepTitle = ''
  } = {}) {
    if (status.value === FIRST_DAY_STATUS.DONE) return false

    if (!shouldPlant({ hasMissions, isDemo, existingTasks, stepTitle })) return false

    if (plantInFlight) return plantInFlight

    planting.value = true
    plantError.value = ''

    plantInFlight = (async () => {
      try {
        return await plantStep({ isDemo, existingTasks, stepTitle })
      } catch (error) {
        plantError.value = 'plant'
        if (import.meta.env.DEV) {
          console.error('Failed to start first-day step', error)
        }
        return false
      } finally {
        planting.value = false
        plantInFlight = null
      }
    })()

    return plantInFlight
  }

  return {
    status,
    completedOn,
    planting,
    plantError,
    isQuestActive,
    showClosedMessage,
    suppressCompletionCelebration,
    activate,
    skipForExistingUser,
    dismissClosed,
    clearPlantError,
    completeIfActive,
    syncFromToday,
    reopenIfStale,
    ensureFirstDayStep
  }
})
