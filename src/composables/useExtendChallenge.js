import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useUserStore } from '../stores/user'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { getInclusiveDaysBetween } from '../utils/dateUtils'
import { isChallengeFinished, isChallengeParticipant } from '../utils/challengeStatus'

export const EXTEND_COST = 100

export function useExtendChallenge() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const extendingId = ref(null)
  const extendError = ref('')

  const userSparks = computed(() => userStore.userSparks)
  const hasEnoughSparks = computed(() => userSparks.value >= EXTEND_COST)
  const sparksNeeded = computed(() => Math.max(0, EXTEND_COST - userSparks.value))

  function getDurationDays(challenge) {
    return getInclusiveDaysBetween(challenge?.startDate, challenge?.endDate)
  }

  function canExtend(challenge, userId) {
    if (!challenge || !userId) return false
    if (!isChallengeParticipant(challenge, userId)) return false
    return isChallengeFinished(challenge)
  }

  async function extendChallenge(challenge) {
    if (!challenge?._id) {
      return null
    }

    extendingId.value = challenge._id
    extendError.value = ''

    try {
      const response = await challengeService.extendChallenge(challenge._id)
      const data = response?.data
      const updatedChallenge = data?.challenge

      if (data?.user) {
        userStore.updateUser(data.user)
      } else if (typeof data?.sparks === 'number') {
        userStore.updateUser({ sparks: data.sparks })
      }

      const sparksSpent = Number(data?.sparksSpent || EXTEND_COST)
      if (sparksSpent > 0) {
        dispatchAppEvent(APP_EVENTS.SPARKS_SPENT, { spent: sparksSpent })
      }

      dispatchAppEvent(APP_EVENTS.AUTH_CHANGED)

      return updatedChallenge || null
    } catch (error) {
      extendError.value = error.response?.data?.message || t('missions.extendError')
      throw error
    } finally {
      extendingId.value = null
    }
  }

  return {
    extendingId,
    extendError,
    userSparks,
    getDurationDays,
    canExtend,
    sparksNeeded,
    hasEnoughSparks,
    extendChallenge
  }
}
