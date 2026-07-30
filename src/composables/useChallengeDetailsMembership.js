import { computed, ref, unref } from 'vue'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

/**
 * Membership / CTA visibility + watch handlers for ChallengeDetailsDialog.
 */
export function useChallengeDetailsMembership({
  challenge,
  isOwner,
  showJoinButton,
  currentUserId,
  isFinished,
  isCurrentUserParticipant,
  watchedStore,
  t,
  onClose,
  onUpdate,
  onError
}) {
  const watchingId = ref(null)
  const watchersCount = ref(0)

  const isJoined = computed(() => unref(isCurrentUserParticipant))

  const showLeaveButtonEffective = computed(() => {
    const c = unref(challenge)
    const userId = unref(currentUserId)
    if (!c || !userId) return false
    if (unref(isOwner)) return false
    if (unref(isFinished)) return false
    if (c.challengeType !== CHALLENGE_TYPES.HABIT) return false
    return unref(isCurrentUserParticipant)
  })

  const canInviteFriends = computed(() => unref(isOwner) || isJoined.value)

  const canJoinPublicHabit = computed(() => {
    const c = unref(challenge)
    const userId = unref(currentUserId)
    if (!c || !userId) return false
    if (unref(isFinished)) return false
    if (c.challengeType !== CHALLENGE_TYPES.HABIT) return false
    if (c.privacy === 'private') return false
    if (unref(isOwner)) return false
    if (isJoined.value) return false
    return true
  })

  const showJoinActionButton = computed(() => {
    if (isJoined.value || unref(isOwner) || unref(isFinished) || !unref(currentUserId)) return false
    if (unref(showJoinButton)) return true
    return canJoinPublicHabit.value
  })

  const showWatchActionButton = computed(() => {
    return !unref(isOwner) && !unref(isFinished) && unref(currentUserId) && !isJoined.value
  })

  const isWatched = computed(() => {
    const c = unref(challenge)
    const userId = unref(currentUserId)
    if (!c || !userId) return false
    return watchedStore.isWatched(c)
  })

  function syncWatchersCount() {
    const c = unref(challenge)
    watchersCount.value = Math.max(0, Number(c?.watchersCount) || 0)
  }

  function applyWatchersCount(nextCount) {
    const count = Math.max(0, Number(nextCount) || 0)
    watchersCount.value = count
    const c = unref(challenge)
    if (c && typeof c === 'object') {
      c.watchersCount = count
    }
  }

  function mainActionButtonText(tab, saveLabel, updateLabel, joinLabel) {
    if (showJoinActionButton.value) return joinLabel
    if (unref(isOwner) && unref(challenge)?.challengeType === CHALLENGE_TYPES.RESULT) {
      return updateLabel
    }
    return saveLabel
  }

  async function handleWatch() {
    const userId = unref(currentUserId)
    const c = unref(challenge)
    if (!userId || !c) return

    const challengeId = c._id
    watchingId.value = challengeId

    const prevCount = watchersCount.value
    applyWatchersCount(prevCount + 1)
    if (c && typeof c === 'object') {
      c.isWatched = true
    }
    watchedStore.addId(challengeId)

    try {
      const data = await watchedStore.watch(challengeId, userId, c)
      if (typeof data?.watchersCount === 'number') {
        applyWatchersCount(data.watchersCount)
      }
      onUpdate?.()
    } catch (error) {
      applyWatchersCount(prevCount)
      if (c && typeof c === 'object') {
        c.isWatched = false
      }
      watchedStore.removeId(challengeId)
      onError?.(error.response?.data?.message || t('challenges.watchError'))
    } finally {
      watchingId.value = null
    }
  }

  async function handleUnwatch() {
    const userId = unref(currentUserId)
    const c = unref(challenge)
    if (!userId || !c) return

    const challengeId = c._id
    watchingId.value = challengeId

    const prevCount = watchersCount.value
    applyWatchersCount(prevCount - 1)
    if (c && typeof c === 'object') {
      c.isWatched = false
    }
    watchedStore.removeId(challengeId)

    try {
      const data = await watchedStore.unwatch(challengeId, userId)
      if (typeof data?.watchersCount === 'number') {
        applyWatchersCount(data.watchersCount)
      }
      onUpdate?.()
    } catch (error) {
      applyWatchersCount(prevCount)
      if (c && typeof c === 'object') {
        c.isWatched = true
      }
      watchedStore.addId(challengeId)
      onError?.(error.response?.data?.message || t('challenges.unwatchError'))
    } finally {
      watchingId.value = null
    }
  }

  return {
    watchingId,
    watchersCount,
    syncWatchersCount,
    isJoined,
    showLeaveButtonEffective,
    canInviteFriends,
    canJoinPublicHabit,
    showJoinActionButton,
    showWatchActionButton,
    isWatched,
    mainActionButtonText,
    handleWatch,
    handleUnwatch
  }
}
