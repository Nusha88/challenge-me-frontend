import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { enrichUserForDisplay } from '../utils/userLevelDisplay'

const PAGE_LIMIT = 21

export function useHeroesList() {
  const { t } = useI18n()

  const users = ref([])
  const totalUsers = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')
  const searchQuery = ref('')
  const currentPage = ref(1)
  const hasMore = ref(true)

  const topThreeUsers = computed(() => users.value.slice(0, 3))
  const remainingUsers = computed(() => users.value.slice(3))

  function mapUsers(list) {
    return (list || []).map((user) => enrichUserForDisplay(user, t))
  }

  async function fetchUsers(page = 1, append = false) {
    if (append) {
      loadingMore.value = true
    } else {
      loading.value = true
      if (!append) {
        currentPage.value = 1
      }
    }

    error.value = ''

    try {
      const params = { page, limit: PAGE_LIMIT }

      if (searchQuery.value?.trim()) {
        params.search = searchQuery.value.trim()
      }

      const response = await userService.getAllUsers(params)
      const usersWithDisplay = mapUsers(response.data.users)

      if (append) {
        users.value = [...users.value, ...usersWithDisplay]
      } else {
        users.value = usersWithDisplay
      }

      totalUsers.value = response.data.totalUsers || 0
      hasMore.value = response.data.pagination?.hasMore || false
      currentPage.value = page
    } catch (err) {
      error.value = err.response?.data?.message || t('notifications.usersError')
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  async function loadMoreUsers() {
    if (loadingMore.value || !hasMore.value || loading.value) return
    await fetchUsers(currentPage.value + 1, true)
  }

  function handleSearch() {
    fetchUsers(1, false)
  }

  return {
    users,
    totalUsers,
    loading,
    loadingMore,
    error,
    searchQuery,
    hasMore,
    topThreeUsers,
    remainingUsers,
    fetchUsers,
    loadMoreUsers,
    handleSearch
  }
}
