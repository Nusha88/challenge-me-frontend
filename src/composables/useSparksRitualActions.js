import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService, userService } from '../services/api'
import { useUserStore } from '../stores/user'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'

export const FREEZE_COST = 50
export const SECOND_CHANCE_COST = 30

export function useSparksRitualActions({ onUpdated, updateChallengeInList } = {}) {
  const { t } = useI18n()
  const userStore = useUserStore()

  const freezeLoading = ref(false)
  const secondChanceLoadingId = ref(null)
  const ritualError = ref('')

  const userSparks = computed(() => userStore.userSparks)
  const hasEnoughSparksForFreeze = computed(() => userSparks.value >= FREEZE_COST)
  const hasEnoughSparksForSecondChance = computed(() => userSparks.value >= SECOND_CHANCE_COST)

  function applySparksResponse(data, defaultSpent) {
    if (data?.user) {
      userStore.updateUser(data.user)
    } else if (typeof data?.sparks === 'number') {
      userStore.updateUser({ sparks: data.sparks })
    }

    const sparksSpent = Number(data?.sparksSpent || defaultSpent)
    if (sparksSpent > 0) {
      dispatchAppEvent(APP_EVENTS.SPARKS_SPENT, { spent: sparksSpent })
    }
  }

  async function useSecondChance(challenge) {
    if (!challenge?._id) return null

    secondChanceLoadingId.value = challenge._id
    ritualError.value = ''

    try {
      const response = await challengeService.secondChance(challenge._id)
      const data = response?.data
      const updatedChallenge = data?.challenge

      applySparksResponse(data, SECOND_CHANCE_COST)

      if (updatedChallenge) {
        updateChallengeInList?.(updatedChallenge)
      }

      dispatchAppEvent('participant-completed-days-updated')
      dispatchAppEvent('challenge-updated')
      await onUpdated?.()

      return updatedChallenge || null
    } catch (error) {
      const reason = error.response?.data?.reason
      if (reason === 'second_chance_window_closed') {
        ritualError.value = t('sparks.rituals.secondChanceWindowError')
      } else {
        ritualError.value =
          error.response?.data?.message || t('sparks.rituals.secondChanceError')
      }
      throw error
    } finally {
      secondChanceLoadingId.value = null
    }
  }

  async function freezeDay({ target = 'today' } = {}) {
    freezeLoading.value = true
    ritualError.value = ''

    try {
      const response = await userService.freezeDay({ target })
      const data = response?.data
      const updatedChallenges = data?.challenges || []

      applySparksResponse(data, FREEZE_COST)

      for (const challenge of updatedChallenges) {
        updateChallengeInList?.(challenge)
      }

      dispatchAppEvent('participant-completed-days-updated')
      dispatchAppEvent('challenge-updated')
      await onUpdated?.()

      return updatedChallenges
    } catch (error) {
      const reason = error.response?.data?.reason
      if (reason === 'freeze_window_closed') {
        ritualError.value = t('sparks.rituals.freezeWindowError')
      } else if (reason === 'save_yesterday_window_closed') {
        ritualError.value = t('sparks.rituals.saveYesterdayWindowError')
      } else {
        ritualError.value = error.response?.data?.message || t('sparks.rituals.freezeError')
      }
      throw error
    } finally {
      freezeLoading.value = false
    }
  }

  return {
    freezeLoading,
    secondChanceLoadingId,
    ritualError,
    hasEnoughSparksForFreeze,
    hasEnoughSparksForSecondChance,
    useSecondChance,
    freezeDay,
    FREEZE_COST,
    SECOND_CHANCE_COST
  }
}
