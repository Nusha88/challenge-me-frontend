import { computed, unref } from 'vue'
import { isChallengeUpcoming } from '../utils/challengeStatus'

function isTemplateMission(challenge) {
  return Boolean(challenge?.templateId)
}

export function useMainRitual(filters, challenges) {
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
    return catalogChallenges.value.filter((c) => isChallengeUpcoming(c))
  })

  return {
    showMainRitual,
    gridChallenges,
    upcomingChallenges
  }
}
