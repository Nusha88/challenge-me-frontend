import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { challengeService } from '../services/api'

function normalizeId(id) {
  if (id == null) return ''
  return String(id._id ?? id)
}

export const useWatchedChallengesStore = defineStore('watchedChallenges', () => {
  const ids = ref([])
  const challenges = ref([])
  const loading = ref(false)
  const loadedForUserId = ref(null)

  let inflightFetch = null

  const idSet = computed(() => new Set(ids.value.map(normalizeId).filter(Boolean)))

  function setFromChallenges(list) {
    const items = list ?? []
    challenges.value = items
    ids.value = items.map((c) => normalizeId(c._id)).filter(Boolean)
  }

  /** Sync watched ids from challenge list that already includes isWatched flags. */
  function syncIdsFromChallengeList(challengeList, userId) {
    ids.value = (challengeList || [])
      .filter((c) => c.isWatched)
      .map((c) => normalizeId(c._id))
      .filter(Boolean)
    if (userId) {
      loadedForUserId.value = userId
    }
  }

  function isWatched(challengeOrId) {
    if (
      typeof challengeOrId === 'object' &&
      challengeOrId != null &&
      'isWatched' in challengeOrId
    ) {
      return !!challengeOrId.isWatched
    }

    const id =
      typeof challengeOrId === 'object' ? challengeOrId?._id : challengeOrId
    const normalized = normalizeId(id)
    return normalized ? idSet.value.has(normalized) : false
  }

  function addId(id) {
    const normalized = normalizeId(id)
    if (normalized && !ids.value.includes(normalized)) {
      ids.value.push(normalized)
    }
  }

  function removeId(id) {
    const normalized = normalizeId(id)
    ids.value = ids.value.filter((existing) => existing !== normalized)
    challenges.value = challenges.value.filter(
      (c) => normalizeId(c._id) !== normalized
    )
  }

  function clear() {
    ids.value = []
    challenges.value = []
    loadedForUserId.value = null
    inflightFetch = null
    loading.value = false
  }

  async function fetchForUser(userId, { force = false } = {}) {
    if (!userId) {
      clear()
      return []
    }

    if (!force && loadedForUserId.value === userId) {
      return challenges.value
    }

    if (inflightFetch && !force) {
      return inflightFetch
    }

    loading.value = true
    inflightFetch = (async () => {
      try {
        const { data } = await challengeService.getWatchedChallenges(userId)
        const list = data?.challenges || []
        setFromChallenges(list)
        loadedForUserId.value = userId
        return list
      } catch (err) {
        console.error('Error loading watched challenges:', err)
        throw err
      } finally {
        loading.value = false
        inflightFetch = null
      }
    })()

    return inflightFetch
  }

  async function watch(challengeId, userId) {
    await challengeService.watchChallenge(challengeId, userId)
    addId(challengeId)
  }

  async function unwatch(challengeId, userId) {
    await challengeService.unwatchChallenge(challengeId, userId)
    removeId(challengeId)
  }

  return {
    ids,
    challenges,
    loading,
    idSet,
    isWatched,
    addId,
    removeId,
    clear,
    fetchForUser,
    watch,
    unwatch,
    setFromChallenges,
    syncIdsFromChallengeList
  }
})
