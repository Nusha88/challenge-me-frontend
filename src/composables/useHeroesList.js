import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { enrichUserForDisplay } from '../utils/userLevelDisplay'

const PAGE_LIMIT = 21
const SEARCH_DEBOUNCE_MS = 300
const LIST_TTL_MS = 15000
const SORT_VALUES = ['xp', 'missions', 'newest']

const listCache = {
  signature: '',
  users: [],
  totalUsers: 0,
  hasMore: false,
  fetchedAt: 0
}

function listSignature(sort, search) {
  return `${sort}|${String(search || '').trim().toLowerCase()}`
}

export function useHeroesList() {
  const { t } = useI18n()

  const users = ref([])
  const totalUsers = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')
  const searchQuery = ref('')
  const sortBy = ref('xp')
  const currentPage = ref(1)
  const hasMore = ref(true)
  const hasLoadedOnce = ref(false)

  let latestFetchId = 0
  let searchDebounceTimer = null
  let skipNextSearchWatch = false

  const showPodium = computed(
    () => sortBy.value === 'xp' && !searchQuery.value.trim()
  )
  const topThreeUsers = computed(() =>
    showPodium.value ? users.value.slice(0, 3) : []
  )
  const remainingUsers = computed(() =>
    showPodium.value ? users.value.slice(3) : users.value
  )

  function mapUsers(list) {
    return (list || []).map((user) => enrichUserForDisplay(user, t))
  }

  function currentSignature() {
    return listSignature(
      SORT_VALUES.includes(sortBy.value) ? sortBy.value : 'xp',
      searchQuery.value
    )
  }

  function applyPage(list, total, more, page) {
    users.value = list
    totalUsers.value = total
    hasMore.value = more
    currentPage.value = page
    hasLoadedOnce.value = true
  }

  function hydrateFromCache() {
    if (!listCache.fetchedAt) return false
    if (listCache.signature !== currentSignature()) return false
    if (Date.now() - listCache.fetchedAt >= LIST_TTL_MS) return false

    applyPage(listCache.users, listCache.totalUsers, listCache.hasMore, 1)
    return true
  }

  function writeCache() {
    listCache.signature = currentSignature()
    listCache.users = users.value
    listCache.totalUsers = totalUsers.value
    listCache.hasMore = hasMore.value
    listCache.fetchedAt = Date.now()
  }

  function clearError() {
    error.value = ''
  }

  async function fetchUsers(page = 1, append = false, { force = false } = {}) {
    if (!append && page === 1 && !force && hydrateFromCache()) {
      return
    }

    const fetchId = ++latestFetchId

    if (append) {
      loadingMore.value = true
    } else {
      loading.value = !hasLoadedOnce.value
      currentPage.value = 1
    }

    error.value = ''

    try {
      const params = {
        page,
        limit: PAGE_LIMIT,
        sort: SORT_VALUES.includes(sortBy.value) ? sortBy.value : 'xp'
      }

      if (searchQuery.value?.trim()) {
        params.search = searchQuery.value.trim()
      }

      const response = await userService.getAllUsers(params)

      if (fetchId !== latestFetchId) return

      const usersWithDisplay = mapUsers(response.data.users)
      const total = response.data.totalUsers || 0
      const more = response.data.pagination?.hasMore || false

      if (append) {
        users.value = [...users.value, ...usersWithDisplay]
        totalUsers.value = total
        hasMore.value = more
        currentPage.value = page
        hasLoadedOnce.value = true
      } else {
        applyPage(usersWithDisplay, total, more, page)
        writeCache()
      }
    } catch (err) {
      if (fetchId !== latestFetchId) return
      error.value = err.response?.data?.message || t('notifications.usersError')
      if (!append) {
        hasMore.value = false
      }
    } finally {
      if (fetchId === latestFetchId) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  async function loadMoreUsers() {
    if (loadingMore.value || !hasMore.value || loading.value) return
    await fetchUsers(currentPage.value + 1, true)
  }

  function handleSearch() {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
      searchDebounceTimer = null
    }
    fetchUsers(1, false)
  }

  function setSort(value) {
    if (!SORT_VALUES.includes(value) || sortBy.value === value) return
    sortBy.value = value
    fetchUsers(1, false)
  }

  function clearSearch() {
    if (!searchQuery.value) return
    skipNextSearchWatch = true
    searchQuery.value = ''
    fetchUsers(1, false)
  }

  watch(searchQuery, () => {
    if (skipNextSearchWatch) {
      skipNextSearchWatch = false
      return
    }
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null
      fetchUsers(1, false)
    }, SEARCH_DEBOUNCE_MS)
  })

  onBeforeUnmount(() => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    latestFetchId += 1
  })

  return {
    users,
    totalUsers,
    loading,
    loadingMore,
    error,
    searchQuery,
    sortBy,
    hasMore,
    hasLoadedOnce,
    showPodium,
    topThreeUsers,
    remainingUsers,
    fetchUsers,
    loadMoreUsers,
    handleSearch,
    setSort,
    clearSearch,
    clearError
  }
}
