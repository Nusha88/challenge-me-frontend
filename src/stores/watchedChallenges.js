import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { challengeService } from '../services/api'

const LIST_TTL_MS = 15000

function normalizeId(id) {
  if (id == null) return ''
  return String(id._id ?? id)
}

export const useWatchedChallengesStore = defineStore('watchedChallenges', () => {
  const ids = ref([])
  const challenges = ref([])
  const loading = ref(false)
  const loadedForUserId = ref(null)
  let lastFetchAt = 0
  let inflightFetch = null

  const idSet = computed(() => new Set(ids.value.map(normalizeId).filter(Boolean)))

  function setFromChallenges(list) {
    const items = list ?? []
    challenges.value = items
    ids.value = items.map((c) => normalizeId(c._id)).filter(Boolean)
  }

  /** Merge isWatched flags from a partial catalog without wiping other ids. */
  function syncIdsFromChallengeList(challengeList) {
    const list = challengeList || []
    if (!list.length) return

    const next = new Set(ids.value.map(normalizeId).filter(Boolean))
    const removed = []

    for (const challenge of list) {
      const id = normalizeId(challenge._id)
      if (!id || !('isWatched' in challenge)) continue
      if (challenge.isWatched) {
        next.add(id)
      } else if (next.delete(id)) {
        removed.push(id)
      }
    }

    ids.value = [...next]
    if (removed.length) {
      const removedSet = new Set(removed)
      challenges.value = challenges.value.filter(
        (challenge) => !removedSet.has(normalizeId(challenge._id))
      )
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

  function upsertChallenge(challenge) {
    if (!challenge?._id) return

    const normalized = normalizeId(challenge._id)
    addId(normalized)

    const index = challenges.value.findIndex((c) => normalizeId(c._id) === normalized)
    if (index === -1) {
      challenges.value = [challenge, ...challenges.value]
      return
    }

    const next = [...challenges.value]
    next[index] = { ...next[index], ...challenge }
    challenges.value = next
  }

  function patchChallenge(challenge) {
    if (!challenge?._id) return false
    const normalized = normalizeId(challenge._id)
    const index = challenges.value.findIndex((c) => normalizeId(c._id) === normalized)
    if (index === -1) return false
    const next = [...challenges.value]
    next[index] = { ...next[index], ...challenge }
    challenges.value = next
    return true
  }

  function isListStale() {
    if (ids.value.length !== challenges.value.length) return true

    return ids.value.some(
      (id) => !challenges.value.some((c) => normalizeId(c._id) === id)
    )
  }

  function invalidateCache() {
    loadedForUserId.value = null
    lastFetchAt = 0
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
    lastFetchAt = 0
    loading.value = false
  }

  async function fetchForUser(userId, { force = false } = {}) {
    if (!userId) {
      clear()
      return []
    }

    const hasCache = loadedForUserId.value === userId && challenges.value.length > 0
    const withinTtl = Date.now() - lastFetchAt < LIST_TTL_MS

    if (!force && hasCache && !isListStale() && withinTtl) {
      return challenges.value
    }

    if (inflightFetch && !force) {
      return inflightFetch
    }

    const showLoader = !hasCache
    if (showLoader) loading.value = true

    inflightFetch = (async () => {
      try {
        const { data } = await challengeService.getWatchedChallenges(userId)
        const list = data?.challenges || []
        setFromChallenges(list)
        loadedForUserId.value = userId
        lastFetchAt = Date.now()
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

  async function watch(challengeId, userId, challenge = null) {
    const { data } = await challengeService.watchChallenge(challengeId, userId)

    if (challenge) {
      if (typeof data?.watchersCount === 'number') {
        challenge.watchersCount = data.watchersCount
      }
      challenge.isWatched = true
      upsertChallenge(challenge)
    } else {
      addId(challengeId)
      invalidateCache()
    }

    return data
  }

  async function unwatch(challengeId, userId) {
    const { data } = await challengeService.unwatchChallenge(challengeId, userId)
    removeId(challengeId)
    return data
  }

  return {
    ids,
    challenges,
    loading,
    idSet,
    isWatched,
    addId,
    upsertChallenge,
    patchChallenge,
    removeId,
    clear,
    invalidateCache,
    isListStale,
    fetchForUser,
    watch,
    unwatch,
    setFromChallenges,
    syncIdsFromChallengeList
  }
})
