import { computed, ref, unref, watch } from 'vue'
import { challengeService } from '../services/api'

function seedFromChallenge(challenge) {
  const c = unref(challenge)
  return {
    likesCount: Number(c?.likesCount) || 0,
    dislikesCount: Number(c?.dislikesCount) || 0,
    userReaction: c?.userReaction === 'like' || c?.userReaction === 'dislike' ? c.userReaction : null
  }
}

/**
 * YouTube-style like/dislike for a challenge (optimistic toggle).
 */
export function useChallengeReaction({
  challenge,
  isOwner,
  currentUserId,
  t,
  onError
}) {
  const likesCount = ref(0)
  const dislikesCount = ref(0)
  const userReaction = ref(null)
  const reactionLoading = ref(false)

  function syncFromChallenge() {
    const seeded = seedFromChallenge(challenge)
    likesCount.value = seeded.likesCount
    dislikesCount.value = seeded.dislikesCount
    userReaction.value = seeded.userReaction
  }

  watch(
    () => {
      const c = unref(challenge)
      return c ? `${c._id}:${c.likesCount}:${c.dislikesCount}:${c.userReaction}` : ''
    },
    () => syncFromChallenge(),
    { immediate: true }
  )

  const canReact = computed(() => {
    return !!unref(currentUserId) && !unref(isOwner)
  })

  const showReactionControls = computed(() => {
    return !!unref(challenge)
  })

  function nextState(current, value) {
    if (current === value) {
      return { userReaction: null, likesDelta: value === 'like' ? -1 : 0, dislikesDelta: value === 'dislike' ? -1 : 0 }
    }
    if (value === 'like') {
      return {
        userReaction: 'like',
        likesDelta: 1,
        dislikesDelta: current === 'dislike' ? -1 : 0
      }
    }
    return {
      userReaction: 'dislike',
      likesDelta: current === 'like' ? -1 : 0,
      dislikesDelta: 1
    }
  }

  async function toggleReaction(value) {
    const c = unref(challenge)
    const userId = unref(currentUserId)
    if (!c?._id || reactionLoading.value) return

    if (!userId) {
      onError?.(t('challenges.reactionLoginRequired'))
      return
    }
    if (unref(isOwner)) {
      onError?.(t('challenges.cannotReactOwn'))
      return
    }

    const prev = {
      likesCount: likesCount.value,
      dislikesCount: dislikesCount.value,
      userReaction: userReaction.value
    }
    const next = nextState(userReaction.value, value)

    likesCount.value = Math.max(0, likesCount.value + next.likesDelta)
    dislikesCount.value = Math.max(0, dislikesCount.value + next.dislikesDelta)
    userReaction.value = next.userReaction
    reactionLoading.value = true

    try {
      const { data } = await challengeService.setChallengeReaction(c._id, value)
      likesCount.value = Number(data?.likesCount) || 0
      dislikesCount.value = Number(data?.dislikesCount) || 0
      userReaction.value =
        data?.userReaction === 'like' || data?.userReaction === 'dislike' ? data.userReaction : null

      if (c && typeof c === 'object') {
        c.likesCount = likesCount.value
        c.dislikesCount = dislikesCount.value
        c.userReaction = userReaction.value
      }
    } catch (error) {
      likesCount.value = prev.likesCount
      dislikesCount.value = prev.dislikesCount
      userReaction.value = prev.userReaction
      onError?.(error.response?.data?.message || t('challenges.reactionError'))
    } finally {
      reactionLoading.value = false
    }
  }

  function handleLike() {
    return toggleReaction('like')
  }

  function handleDislike() {
    return toggleReaction('dislike')
  }

  return {
    likesCount,
    dislikesCount,
    userReaction,
    reactionLoading,
    canReact,
    showReactionControls,
    handleLike,
    handleDislike,
    syncFromChallenge
  }
}
