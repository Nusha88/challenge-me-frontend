import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import { useWatchedActivityFeed } from './useWatchedActivityFeed'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { challengeIdsMatch } from '../utils/openChallengeDetails'

export function useWatchedPage(currentUserId) {
  const { t } = useI18n()
  const { applyRewardResponse } = useXpAwardFeedback()
  const watchedStore = useWatchedChallengesStore()
  const { feedActivities, loadFeedActivities } = useWatchedActivityFeed()

  const errorMessage = ref('')
  const joiningId = ref(null)
  const leavingId = ref(null)
  const unwatchingId = ref(null)

  const challenges = computed(() => watchedStore.challenges)
  const loading = computed(() => watchedStore.loading)

  function clearError() {
    errorMessage.value = ''
  }

  async function loadWatchedChallenges({ force = false, refreshFeed = true } = {}) {
    const userId = currentUserId.value
    if (!userId) {
      errorMessage.value = t('challenges.loginPrompt')
      return
    }

    errorMessage.value = ''

    try {
      const shouldForce = force || watchedStore.isListStale()
      await watchedStore.fetchForUser(userId, { force: shouldForce })
      if (refreshFeed) {
        await loadFeedActivities(userId)
      }
    } catch (error) {
      console.error('Error loading watched challenges:', error)
      errorMessage.value = error.response?.data?.message || t('challenges.loadError')
    }
  }

  function updateChallengeInList(challenge) {
    if (!challenge?._id) return
    const index = watchedStore.challenges.findIndex((c) => c._id === challenge._id)
    if (index !== -1) {
      watchedStore.challenges[index] = challenge
    }
  }

  async function refreshSelectedChallenge(challengeId, selectedChallenge, fallbackChallenge) {
    if (!selectedChallenge?.value || !challengeIdsMatch(selectedChallenge.value._id, challengeId)) {
      return false
    }

    try {
      const { data } = await challengeService.getChallenge(challengeId)
      selectedChallenge.value = data
      updateChallengeInList(data)
      return true
    } catch {
      if (fallbackChallenge) {
        selectedChallenge.value = fallbackChallenge
        updateChallengeInList(fallbackChallenge)
      }
      return false
    }
  }

  async function joinChallenge(challenge, { selectedChallenge, onAfterJoin } = {}) {
    const userId = currentUserId.value
    if (!userId || !challenge?._id) return

    joiningId.value = challenge._id
    errorMessage.value = ''

    try {
      const response = await challengeService.joinChallenge(challenge._id, { userId })
      applyRewardResponse(response)

      const updated = response.data?.challenge
      if (updated) {
        updateChallengeInList(updated)
      } else {
        await loadWatchedChallenges({ force: true, refreshFeed: false })
      }

      if (selectedChallenge?.value && challengeIdsMatch(selectedChallenge.value._id, challenge._id)) {
        await refreshSelectedChallenge(challenge._id, selectedChallenge, updated)
      }

      await onAfterJoin?.()
    } catch (error) {
      console.error('Error joining challenge:', error)
      errorMessage.value = error.response?.data?.message || t('challenges.joinError')
    } finally {
      joiningId.value = null
    }
  }

  async function leaveChallenge(challenge, { selectedChallenge } = {}) {
    const userId = currentUserId.value
    if (!userId || !challenge?._id) {
      errorMessage.value = t('notifications.mustLogin')
      return
    }

    leavingId.value = challenge._id
    errorMessage.value = ''

    try {
      const response = await challengeService.leaveChallenge(challenge._id, { userId })
      const updated = response.data?.challenge

      if (updated) {
        updateChallengeInList(updated)
      }

      if (selectedChallenge?.value?._id === challenge._id) {
        if (updated) {
          selectedChallenge.value = updated
        } else {
          await refreshSelectedChallenge(challenge._id, selectedChallenge)
        }
      }

      if (!updated) {
        await loadWatchedChallenges({ force: true, refreshFeed: false })
      }
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('challenges.leaveError')
    } finally {
      leavingId.value = null
    }
  }

  async function unwatchChallenge(challenge, { onUnwatched } = {}) {
    const userId = currentUserId.value
    if (!userId || !challenge?._id) return

    unwatchingId.value = challenge._id

    try {
      await watchedStore.unwatch(challenge._id, userId)
      await loadFeedActivities(userId)
      onUnwatched?.(challenge)
    } catch (error) {
      console.error('Error unwatching challenge:', error)
      errorMessage.value = error.response?.data?.message || t('challenges.unwatchError')
    } finally {
      unwatchingId.value = null
    }
  }

  return {
    challenges,
    loading,
    errorMessage,
    joiningId,
    leavingId,
    unwatchingId,
    feedActivities,
    loadWatchedChallenges,
    clearError,
    updateChallengeInList,
    joinChallenge,
    leaveChallenge,
    unwatchChallenge
  }
}
