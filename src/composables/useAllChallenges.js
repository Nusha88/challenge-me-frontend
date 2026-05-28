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

  async function fetchChallenges(page = 1, append = false) {
    const fetchId = ++latestFetchId

    if (append) {
      loadingMore.value = true
    } else {
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

      const userId = unref(currentUserId)
      if (userId) {
        watchedStore.syncIdsFromChallengeList(challenges.value, userId)
      }
    } catch (error) {
      if (fetchId === latestFetchId) {
        errorMessage.value = error.response?.data?.message || t('notifications.apiError')
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
    fetchChallenges
  }
}
