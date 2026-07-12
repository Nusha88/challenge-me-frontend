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
  const watchingId = ref(null)

  const challenges = computed(() => watchedStore.challenges)
  const loading = computed(() => watchedStore.loading)

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

  async function joinChallenge(challenge, { selectedChallenge, onAfterJoin } = {}) {
    const userId = currentUserId.value
    if (!userId || !challenge?._id) return

    joiningId.value = challenge._id
    errorMessage.value = ''

    try {
      const response = await challengeService.joinChallenge(challenge._id, { userId })
      applyRewardResponse(response)
      await loadWatchedChallenges({ force: true, refreshFeed: false })

      if (selectedChallenge?.value && challengeIdsMatch(selectedChallenge.value._id, challenge._id)) {
        try {
          const { data } = await challengeService.getChallenge(challenge._id)
          selectedChallenge.value = data
          updateChallengeInList(data)
        } catch {
          if (response.data?.challenge) {
            selectedChallenge.value = response.data.challenge
            updateChallengeInList(response.data.challenge)
          }
        }
      } else if (response.data?.challenge) {
        updateChallengeInList(response.data.challenge)
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
      await challengeService.leaveChallenge(challenge._id, { userId })
      await loadWatchedChallenges({ force: true, refreshFeed: false })

      if (selectedChallenge?.value?._id === challenge._id) {
        try {
          const { data } = await challengeService.getChallenge(challenge._id)
          selectedChallenge.value = data
          updateChallengeInList(data)
        } catch {
          selectedChallenge.value =
            watchedStore.challenges.find((c) => c._id === challenge._id) || null
        }
      }
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('notifications.joinError')
    } finally {
      leavingId.value = null
    }
  }

  async function unwatchChallenge(challenge, { onUnwatchFromDialog } = {}) {
    const userId = currentUserId.value
    if (!userId || !challenge?._id) return

    watchingId.value = challenge._id

    try {
      await watchedStore.unwatch(challenge._id, userId)
      await loadFeedActivities(userId)
      onUnwatchFromDialog?.(challenge)
    } catch (error) {
      console.error('Error unwatching challenge:', error)
      errorMessage.value = error.response?.data?.message || t('challenges.unwatchError')
    } finally {
      watchingId.value = null
    }
  }

  return {
    challenges,
    loading,
    errorMessage,
    joiningId,
    leavingId,
    watchingId,
    feedActivities,
    loadWatchedChallenges,
    updateChallengeInList,
    joinChallenge,
    leaveChallenge,
    unwatchChallenge
  }
}
