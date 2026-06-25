import { ref, computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import { isChallengeFinished, isChallengeUpcoming } from '../utils/challengeStatus'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { useXpAwardFeedback } from './useXpAwardFeedback'

export function useMyChallenges(currentUserId) {
  const { t } = useI18n()
  const { applyRewardResponse } = useXpAwardFeedback()
  const watchedStore = useWatchedChallengesStore()

  const challenges = ref([])
  const loading = ref(false)
  const error = ref('')
  const joiningId = ref(null)
  const leavingId = ref(null)
  const watchingId = ref(null)

  let getSelectedChallengeId = () => null
  let refreshSelectedChallenge = async () => {}
  let selectedChallengeRef = null

  function configureDialogSync({ selectedChallenge, refreshSelectedChallenge: refreshSelected }) {
    selectedChallengeRef = selectedChallenge
    getSelectedChallengeId = () => unref(selectedChallenge)?._id
    refreshSelectedChallenge = refreshSelected
  }

  function challengeIdsMatch(a, b) {
    return a != null && b != null && String(a) === String(b)
  }

  const challengeGroups = computed(() => {
    const groups = {
      activeQuests: [],
      activeRituals: [],
      upcoming: [],
      finished: []
    }

    for (const challenge of challenges.value) {
      if (isChallengeFinished(challenge)) {
        groups.finished.push(challenge)
        continue
      }

      if (isChallengeUpcoming(challenge)) {
        groups.upcoming.push(challenge)
        continue
      }

      if (challenge.challengeType === CHALLENGE_TYPES.RESULT) {
        groups.activeQuests.push(challenge)
      } else if (challenge.challengeType === CHALLENGE_TYPES.HABIT) {
        groups.activeRituals.push(challenge)
      }
    }

    return groups
  })

  const activeQuests = computed(() => challengeGroups.value.activeQuests)
  const activeRituals = computed(() => challengeGroups.value.activeRituals)
  const upcomingChallenges = computed(() => challengeGroups.value.upcoming)
  const upcomingQuests = computed(() =>
    challengeGroups.value.upcoming.filter((c) => c.challengeType === CHALLENGE_TYPES.RESULT)
  )
  const upcomingRituals = computed(() =>
    challengeGroups.value.upcoming.filter((c) => c.challengeType === CHALLENGE_TYPES.HABIT)
  )
  const finishedChallenges = computed(() => challengeGroups.value.finished)
  const activeChallenges = computed(() => [
    ...activeQuests.value,
    ...activeRituals.value
  ])

  function isWatched(challenge) {
    return !!challenge?.isWatched
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

  function replaceChallengeInList(updatedChallenge) {
    if (!updatedChallenge?._id) return

    challenges.value = challenges.value.map((item) => {
      if (!challengeIdsMatch(item._id, updatedChallenge._id)) return item
      return { ...item, ...updatedChallenge }
    })

    const selected = unref(selectedChallengeRef)
    if (selected && challengeIdsMatch(selected._id, updatedChallenge._id)) {
      selectedChallengeRef.value = { ...selected, ...updatedChallenge }
    }
  }

  async function fetchChallenges() {
    const userId = unref(currentUserId)
    if (!userId) {
      error.value = t('users.userNotFound')
      return
    }

    loading.value = true
    error.value = ''

    try {
      const { data } = await challengeService.getChallengesByUser(userId, {
        excludePrivate: false
      })
      challenges.value = data?.challenges || []
      watchedStore.syncIdsFromChallengeList(challenges.value, userId)
    } catch (err) {
      error.value = err.response?.data?.message || t('notifications.apiError')
    } finally {
      loading.value = false
    }
  }

  async function refreshChallengesAfterMembershipChange(challengeId) {
    await fetchChallenges()

    if (getSelectedChallengeId() === challengeId) {
      await refreshSelectedChallenge(challengeId)
    }
  }

  async function joinChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) {
      error.value = t('notifications.mustLogin')
      return
    }

    if (!challenge?._id) {
      error.value = t('notifications.joinError')
      return
    }

    joiningId.value = challenge._id
    error.value = ''

    try {
      const response = await challengeService.joinChallenge(challenge._id, { userId })
      applyRewardResponse(response)
      await refreshChallengesAfterMembershipChange(challenge._id)
    } catch (err) {
      error.value = err.response?.data?.message || t('notifications.joinError')
    } finally {
      joiningId.value = null
    }
  }

  async function leaveChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) {
      error.value = t('notifications.mustLogin')
      return
    }

    if (!challenge?._id) {
      error.value = t('notifications.joinError')
      return
    }

    leavingId.value = challenge._id
    error.value = ''

    try {
      await challengeService.leaveChallenge(challenge._id, { userId })
      await refreshChallengesAfterMembershipChange(challenge._id)
    } catch (err) {
      error.value = err.response?.data?.message || t('notifications.joinError')
    } finally {
      leavingId.value = null
    }
  }

  function updateChallengeWatchersCount(challengeId, delta) {
    challenges.value = challenges.value.map((item) => {
      if (!challengeIdsMatch(item._id, challengeId)) return item
      if (item.watchersCount === undefined) return item

      return {
        ...item,
        watchersCount: Math.max(0, (item.watchersCount || 0) + delta)
      }
    })

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
  }

  async function watchChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) {
      error.value = t('notifications.mustLogin')
      return
    }

    watchingId.value = challenge._id
    error.value = ''

    const challengeId = challenge._id.toString()
    setChallengeWatched(challenge._id, true)
    watchedStore.addId(challengeId)
    updateChallengeWatchersCount(challenge._id, 1)

    try {
      await watchedStore.watch(challenge._id, userId)
    } catch (err) {
      setChallengeWatched(challenge._id, false)
      watchedStore.removeId(challengeId)
      updateChallengeWatchersCount(challenge._id, -1)
      error.value = err.response?.data?.message || t('challenges.watchError')
    } finally {
      watchingId.value = null
    }
  }

  async function unwatchChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) return

    watchingId.value = challenge._id
    error.value = ''

    const challengeId = challenge._id.toString()
    setChallengeWatched(challenge._id, false)
    watchedStore.removeId(challengeId)
    updateChallengeWatchersCount(challenge._id, -1)

    try {
      await watchedStore.unwatch(challenge._id, userId)
    } catch (err) {
      setChallengeWatched(challenge._id, true)
      watchedStore.addId(challengeId)
      updateChallengeWatchersCount(challenge._id, 1)
      error.value = err.response?.data?.message || t('challenges.watchError')
    } finally {
      watchingId.value = null
    }
  }

  return {
    challenges,
    loading,
    error,
    joiningId,
    leavingId,
    watchingId,
    challengeGroups,
    activeQuests,
    activeRituals,
    upcomingChallenges,
    upcomingQuests,
    upcomingRituals,
    finishedChallenges,
    activeChallenges,
    isWatched,
    fetchChallenges,
    joinChallenge,
    leaveChallenge,
    watchChallenge,
    unwatchChallenge,
    replaceChallengeInList,
    configureDialogSync
  }
}
