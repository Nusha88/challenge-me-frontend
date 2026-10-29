import { computed, unref } from 'vue'
import { isChallengeOwner, isChallengeUpcoming } from '../utils/challengeStatus'

function isTemplateMission(challenge) {
  return Boolean(challenge?.templateId)
}

export function useMainRitual(filters, challenges, currentUserId) {
  const showMainRitual = computed(() => !unref(filters).owner)

  const catalogChallenges = computed(() => {
    const list = unref(challenges)
    if (!list?.length) return []
    if (unref(filters)?.owner) return [...list]
    return list.filter((challenge) => !isTemplateMission(challenge))
  })

  const gridChallenges = computed(() => {
    return catalogChallenges.value.filter((c) => !isChallengeUpcoming(c))
  })

  const upcomingChallenges = computed(() => {
    const userId = unref(currentUserId)
    if (!userId) return []
    return catalogChallenges.value.filter((challenge) => {
      return isChallengeUpcoming(challenge) && isChallengeOwner(challenge, userId)
    })
  })

  return {
    showMainRitual,
    gridChallenges,
    upcomingChallenges
  }
}
