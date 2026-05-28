import { ref, computed, unref } from 'vue'
import { challengeService } from '../services/api'
import { isChallengeUpcoming } from '../utils/challengeStatus'

export function useMainRitual(filters, challenges) {
  const mainRitual = ref(null)
  const loadingMainRitual = ref(false)

  const showMainRitual = computed(() => !unref(filters).owner)

  async function fetchMainRitual() {
    loadingMainRitual.value = true
    try {
      const { data } = await challengeService.getMainRitual()
      mainRitual.value = data?.challenge ?? null
    } catch (error) {
      console.error('Error fetching main ritual:', error)
      mainRitual.value = null
    } finally {
      loadingMainRitual.value = false
    }
  }

  function clearMainRitual() {
    mainRitual.value = null
    loadingMainRitual.value = false
  }

  const gridChallenges = computed(() => {
    const list = unref(challenges)
    if (!list?.length) return []

    let filtered = [...list]

    if (mainRitual.value) {
      filtered = filtered.filter((c) => c._id !== mainRitual.value._id)
    }

    return filtered.filter((c) => !isChallengeUpcoming(c))
  })

  const upcomingChallenges = computed(() => {
    const list = unref(challenges)
    if (!list?.length) return []

    let upcoming = list.filter((c) => isChallengeUpcoming(c))

    if (mainRitual.value && isChallengeUpcoming(mainRitual.value)) {
      upcoming = upcoming.filter((c) => c._id !== mainRitual.value._id)
    }

    return upcoming
  })

  return {
    loadingMainRitual,
    showMainRitual,
    mainRitual,
    gridChallenges,
    upcomingChallenges,
    fetchMainRitual,
    clearMainRitual
  }
}
