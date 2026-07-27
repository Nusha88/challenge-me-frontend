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
  const listError = ref('')
  const actionError = ref('')
  const joiningId = ref(null)
  const leavingId = ref(null)
  const watchingId = ref(null)

  /** @deprecated Prefer listError / actionError — kept for dialog clear-on-open */
  const error = actionError

  let getSelectedChallengeId = () => null
  let refreshSelectedChallenge = async () => {}
  let selectedChallengeRef = null

  function configureDialogSync({ selectedChallenge, refreshSelectedChallenge: refreshSelected }) {
    selectedChallengeRef = selectedChallenge
    getSelectedChallengeId = () => unref(selectedChallenge)?._id
    refreshSelectedChallenge = refreshSelected
  }

  function clearListError() {
    listError.value = ''
  }

  function clearActionError() {
    actionError.value = ''
  }

  function clearErrors() {
    clearListError()
    clearActionError()
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

  /** Move an updated mission to the front of the list (e.g. after extend). */
  function promoteChallengeToFront(updatedChallenge) {
    if (!updatedChallenge?._id) return

    const rest = challenges.value.filter(
      (item) => !challengeIdsMatch(item._id, updatedChallenge._id)
    )
    const previous = challenges.value.find((item) =>
      challengeIdsMatch(item._id, updatedChallenge._id)
    )
    const merged = {
      ...(previous || {}),
      ...updatedChallenge,
      // Ensure list order treats extend like a brand-new mission immediately.
      createdAt: updatedChallenge.createdAt || new Date().toISOString()
    }
    challenges.value = [merged, ...rest]

    const selected = unref(selectedChallengeRef)
    if (selected && challengeIdsMatch(selected._id, updatedChallenge._id)) {
      selectedChallengeRef.value = { ...selected, ...merged }
    }
  }

  async function fetchChallenges() {
    const userId = unref(currentUserId)
    if (!userId) {
      listError.value = t('users.userNotFound')
      return
    }

    loading.value = true
    listError.value = ''

    try {
      const { data } = await challengeService.getChallengesByUser(userId, {
        excludePrivate: false
      })
      challenges.value = data?.challenges || []
      watchedStore.syncIdsFromChallengeList(challenges.value, userId)
    } catch (err) {
      listError.value = err.response?.data?.message || t('notifications.apiError')
    } finally {
      loading.value = false
    }
  }

  async function refreshChallengesAfterMembershipChange(challengeId) {
    await fetchChallenges()

    if (challengeIdsMatch(getSelectedChallengeId(), challengeId)) {
      await refreshSelectedChallenge(challengeId)
    }
  }

  async function joinChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) {
      actionError.value = t('notifications.mustLogin')
      return
    }

    if (!challenge?._id) {
      actionError.value = t('notifications.joinError')
      return
    }

    joiningId.value = challenge._id
    actionError.value = ''

    try {
      const response = await challengeService.joinChallenge(challenge._id, { userId })
      applyRewardResponse(response)
      await refreshChallengesAfterMembershipChange(challenge._id)
    } catch (err) {
      actionError.value = err.response?.data?.message || t('notifications.joinError')
    } finally {
      joiningId.value = null
    }
  }

  async function leaveChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) {
      actionError.value = t('notifications.mustLogin')
      return
    }

    if (!challenge?._id) {
      actionError.value = t('notifications.joinError')
      return
    }

    leavingId.value = challenge._id
    actionError.value = ''

    try {
      const response = await challengeService.leaveChallenge(challenge._id, { userId })
      if (response.data?.challenge) {
        replaceChallengeInList(response.data.challenge)
      }
      await refreshChallengesAfterMembershipChange(challenge._id)
    } catch (err) {
      actionError.value = err.response?.data?.message || t('notifications.joinError')
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
      actionError.value = t('notifications.mustLogin')
      return
    }

    watchingId.value = challenge._id
    actionError.value = ''

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
      actionError.value = err.response?.data?.message || t('challenges.watchError')
    } finally {
      watchingId.value = null
    }
  }

  async function unwatchChallenge(challenge) {
    const userId = unref(currentUserId)
    if (!userId) return

    watchingId.value = challenge._id
    actionError.value = ''

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
      actionError.value = err.response?.data?.message || t('challenges.watchError')
    } finally {
      watchingId.value = null
    }
  }

  return {
    challenges,
    loading,
    listError,
    actionError,
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
    clearListError,
    clearActionError,
    clearErrors,
    fetchChallenges,
    joinChallenge,
    leaveChallenge,
    watchChallenge,
    unwatchChallenge,
    replaceChallengeInList,
    promoteChallengeToFront,
    configureDialogSync
  }
}
