import { computed, onMounted, ref } from 'vue'
import { challengeService, userService } from '../services/api'

/**
 * Minimum hero count before we print the actual number on the landing page.
 *
 * During an open beta a literal "join 12+ heroes" is worse than saying nothing:
 * it reads as evidence that nobody uses the product. Below the threshold we fall
 * back to qualitative copy about being an early pioneer, which is both honest and
 * appealing to the audience that finds a project through a launch article.
 */
const HONEST_PROOF_THRESHOLD = 50

export function useLandingStats() {
  const heroes = ref(0)
  const missions = ref(0)
  const loaded = ref(false)

  const showHeroCount = computed(() => heroes.value >= HONEST_PROOF_THRESHOLD)
  const showMissionCount = computed(() => missions.value > 0)

  function readTotal(response) {
    const total = Number(response?.data?.pagination?.total ?? 0)
    return Number.isFinite(total) && total > 0 ? total : 0
  }

  onMounted(async () => {
    // Both endpoints are public. They are requested with limit=1 because only the
    // pagination total is needed, never the records themselves.
    const [heroesResult, missionsResult] = await Promise.allSettled([
      userService.getAllUsers({ page: 1, limit: 1 }),
      challengeService.getAllChallenges({ page: 1, limit: 1 })
    ])

    if (heroesResult.status === 'fulfilled') {
      heroes.value = readTotal(heroesResult.value)
    }

    if (missionsResult.status === 'fulfilled') {
      missions.value = readTotal(missionsResult.value)
    }

    loaded.value = true
  })

  return { heroes, missions, loaded, showHeroCount, showMissionCount }
}
