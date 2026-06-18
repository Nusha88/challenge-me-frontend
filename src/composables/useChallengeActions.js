import { ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import { useXpAwardFeedback } from './useXpAwardFeedback'

export function useChallengeActions({
  challenges,
  currentUserId,
  errorMessage,
  currentPage,
  fetchChallenges,
  onAfterJoin
}) {
  const { t } = useI18n()
  const { applyRewardResponse } = useXpAwardFeedback()
  const watchedStore = useWatchedChallengesStore()

  const joiningId = ref(null)
  const leavingId = ref(null)
  const watchingId = ref(null)

  let getSelectedChallengeId = () => null
  let refreshSelectedChallenge = async () => {}
  let selectedChallengeRef = null

  function configureDialogSync({ selectedChallenge, refreshSelected }) {
    selectedChallengeRef = selectedChallenge
    getSelectedChallengeId = () => unref(selectedChallenge)?._id
    refreshSelectedChallenge = refreshSelected
  }

  function challengeIdsMatch(a, b) {
    return a != null && b != null && String(a) === String(b)
  }

  function isWatched(challenge) {
    if (!challenge || !unref(currentUserId)) return false
    return !!challenge.isWatched
  }

  function setChallengeWatched(challengeId, watched) {
    challenges.value = challenges.value.map((item) => {
      if (!challengeIdsMatch(item._id, challengeId)) return item
      return { ...item, isWatched: watched }
    })

    const selected = unref(selectedChallengeRef)
    if (selected && challengeIdsMatch(selected._id, challengeId)) {
      selectedChallengeRef.value = { ...selected, isWatched: watched }
    }
  }

  function updateChallengeWatchersCount(challengeId, delta) {
    const index = challenges.value.findIndex((c) => challengeIdsMatch(c._id, challengeId))
    if (index !== -1 && challenges.value[index].watchersCount !== undefined) {
      challenges.value[index].watchersCount = Math.max(
        0,
        (challenges.value[index].watchersCount || 0) + delta
      )
    }

    const selected = unref(selectedChallengeRef)
    if (
      selected &&
      challengeIdsMatch(selected._id, challengeId) &&
      selected.watchersCount !== undefined
    ) {
      selectedChallengeRef.value = {
        ...selected,
        watchersCount: Math.max(0, (selected.watchersCount || 0) + delta)
      }
    }

    return index
  }

  async function refreshAfterMembershipChange(challengeId, { refreshMainRitual = false } = {}) {
    await fetchChallenges(unref(currentPage), false)
    if (refreshMainRitual) {
      await onAfterJoin?.()
    }

    if (getSelectedChallengeId() === challengeId) {
      await refreshSelectedChallenge(challengeId)
    }
  }

  async function runChallengeParticipationAction({
    challenge,
    loadingRef,
    serviceCall,
    errorFallback,
    refreshMainRitual = false
  }) {
    const userId = unref(currentUserId)
    if (!userId) {
      errorMessage.value = t('notifications.mustLogin')
      return
    }

    if (!challenge?._id) {
      errorMessage.value = errorFallback
      return
    }

    loadingRef.value = challenge._id
    errorMessage.value = ''

    try {
      const response = await serviceCall(challenge._id, { userId })
      applyRewardResponse(response)
      if (
        response?.data?.challenge &&
        selectedChallengeRef &&
        challengeIdsMatch(unref(selectedChallengeRef)?._id, challenge._id)
      ) {
        selectedChallengeRef.value = response.data.challenge
      }
      await refreshAfterMembershipChange(challenge._id, { refreshMainRitual })
    } catch (error) {
      errorMessage.value = error.response?.data?.message || errorFallback
    } finally {
      loadingRef.value = null
    }
  }

  async function toggleWatchChallenge(challenge, shouldWatch) {
    const userId = unref(currentUserId)
    if (!userId) {
      if (shouldWatch) {
        errorMessage.value = t('notifications.mustLogin')
      }
      return
    }

    if (!challenge?._id) return

    const delta = shouldWatch ? 1 : -1

    watchingId.value = challenge._id
    errorMessage.value = ''

    updateChallengeWatchersCount(challenge._id, delta)
    setChallengeWatched(challenge._id, shouldWatch)

    if (shouldWatch) {
      watchedStore.upsertChallenge(challenge)
    } else {
      watchedStore.removeId(challenge._id)
    }

    try {
      if (shouldWatch) {
        await watchedStore.watch(challenge._id, userId, challenge)
      } else {
        await watchedStore.unwatch(challenge._id, userId)
      }
    } catch (error) {
      updateChallengeWatchersCount(challenge._id, -delta)
      setChallengeWatched(challenge._id, !shouldWatch)

      if (shouldWatch) {
        watchedStore.removeId(challenge._id)
      } else {
        watchedStore.addId(challenge._id)
      }

      errorMessage.value =
        error.response?.data?.message ||
        (shouldWatch ? t('challenges.watchError') : t('challenges.unwatchError'))
    } finally {
      watchingId.value = null
    }
  }

  function watchChallenge(challenge) {
    return toggleWatchChallenge(challenge, true)
  }

  function unwatchChallenge(challenge) {
    return toggleWatchChallenge(challenge, false)
  }

  async function joinChallenge(challenge) {
    await runChallengeParticipationAction({
      challenge,
      loadingRef: joiningId,
      serviceCall: challengeService.joinChallenge,
      errorFallback: t('notifications.joinError'),
      refreshMainRitual: true
    })
  }

  async function leaveChallenge(challenge) {
    await runChallengeParticipationAction({
      challenge,
      loadingRef: leavingId,
      serviceCall: challengeService.leaveChallenge,
      errorFallback: t('notifications.joinError')
    })
  }

  return {
    joiningId,
    leavingId,
    watchingId,
    isWatched,
    joinChallenge,
    leaveChallenge,
    watchChallenge,
    unwatchChallenge,
    configureDialogSync
  }
}
