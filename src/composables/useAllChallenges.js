import { ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'

export function useAllChallenges(filters, currentUserId) {
  const { t } = useI18n()
  const watchedStore = useWatchedChallengesStore()

  const challenges = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const hasMore = ref(true)
  const total = ref(0)
  let latestFetchId = 0

  function buildFilterParams(page) {
    const f = unref(filters)

    return {
      page,
      limit: 20,
      ...(f.title && { title: f.title }),
      ...(f.type && f.type !== 'all' && { type: f.type }),
      ...(f.owner && { owner: f.owner }),
      ...(f.popularity && { popularity: f.popularity }),
      ...(f.isCompleted === 'all'
        ? { isCompleted: 'all' }
        : f.isCompleted !== undefined && {
            isCompleted: f.isCompleted ? 'true' : 'false'
          })
    }
  }

  function clearErrorMessage() {
    errorMessage.value = ''
  }

  function syncWatchedState(list) {
    const userId = unref(currentUserId)
    if (userId) {
      watchedStore.syncIdsFromChallengeList(list)
    }
  }

  function updateChallengeInList(challenge) {
    if (!challenge?._id) return false
    const id = String(challenge._id)
    const index = challenges.value.findIndex((item) => String(item._id) === id)
    if (index === -1) return false
    const next = [...challenges.value]
    next[index] = { ...next[index], ...challenge }
    challenges.value = next
    syncWatchedState(next)
    return true
  }

  async function fetchChallenges(page = 1, append = false, { silent = false } = {}) {
    const fetchId = ++latestFetchId

    if (append) {
      loadingMore.value = true
    } else if (!silent) {
      loading.value = true
      currentPage.value = 1
    }
    errorMessage.value = ''

    try {
      const { data } = await challengeService.getAllChallenges(buildFilterParams(page))

      if (fetchId !== latestFetchId) {
        return
      }

      if (append) {
        challenges.value = [...challenges.value, ...(data?.challenges || [])]
      } else {
        challenges.value = data?.challenges || []
      }

      hasMore.value = data?.pagination?.hasMore || false
      currentPage.value = page
      total.value = data?.pagination?.total || 0
      syncWatchedState(challenges.value)
    } catch (error) {
      if (fetchId === latestFetchId) {
        errorMessage.value = error.response?.data?.message || t('notifications.apiError')
        if (!append) {
          hasMore.value = false
        }
      }
    } finally {
      if (fetchId === latestFetchId) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  return {
    challenges,
    loading,
    loadingMore,
    errorMessage,
    currentPage,
    hasMore,
    total,
    fetchChallenges,
    updateChallengeInList,
    clearErrorMessage
  }
}
