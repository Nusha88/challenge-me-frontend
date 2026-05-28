import { ref, watch, nextTick } from 'vue'

const DEFAULT_FILTERS = {
  title: null,
  type: 'all',
  owner: null,
  popularity: null,
  showUpcoming: true,
  isCompleted: false
}

export function useChallengeFilters(route, router) {
  const filters = ref({ ...DEFAULT_FILTERS })
  const isSyncingFromUrl = ref(false)

  function syncFiltersFromUrl() {
    const query = route.query

    if (query.owner) {
      filters.value.owner = query.owner
    } else if (query.createdBy) {
      filters.value.owner = query.createdBy
    } else {
      filters.value.owner = null
    }

    if (query.isCompleted === 'all') {
      filters.value.isCompleted = 'all'
    } else if (query.isCompleted !== undefined) {
      filters.value.isCompleted = query.isCompleted === 'true'
    } else {
      filters.value.isCompleted = false
    }

    filters.value.type = query.type || 'all'
    filters.value.popularity = query.popularity || null
    filters.value.title = query.title || null

    if (query.showUpcoming !== undefined) {
      filters.value.showUpcoming = query.showUpcoming === 'true'
    } else {
      filters.value.showUpcoming = true
    }
  }

  function syncFiltersToUrl() {
    const query = { ...route.query }

    if (filters.value.owner) {
      query.createdBy = filters.value.owner
      delete query.owner
    } else {
      delete query.createdBy
      delete query.owner
    }

    if (filters.value.isCompleted === 'all') {
      query.isCompleted = 'all'
    } else if (filters.value.isCompleted === true) {
      query.isCompleted = 'true'
    } else {
      delete query.isCompleted
    }

    if (filters.value.type && filters.value.type !== 'all') {
      query.type = filters.value.type
    } else {
      delete query.type
    }

    if (filters.value.popularity) {
      query.popularity = filters.value.popularity
    } else {
      delete query.popularity
    }

    if (filters.value.title) {
      query.title = filters.value.title
    } else {
      delete query.title
    }

    if (filters.value.showUpcoming === false) {
      query.showUpcoming = 'false'
    } else {
      delete query.showUpcoming
    }

    router.replace({ query })
  }

  function setupFilterWatchers({ fetchChallenges, onOwnerFilterChange }) {
    watch(
      () => ({
        type: filters.value.type,
        owner: filters.value.owner,
        popularity: filters.value.popularity,
        isCompleted: filters.value.isCompleted
      }),
      (current, previous) => {
        if (previous && current.owner !== previous.owner) {
          onOwnerFilterChange?.(current.owner)
        }

        if (isSyncingFromUrl.value) return

        syncFiltersToUrl()
        fetchChallenges(1, false)
      }
    )

    watch(
      () => filters.value.showUpcoming,
      () => {
        if (isSyncingFromUrl.value) return
        syncFiltersToUrl()
      }
    )

    watch(
      () => filters.value.title,
      () => {
        if (isSyncingFromUrl.value) return
        syncFiltersToUrl()
      }
    )

    watch(
      () => route.query,
      () => {
        isSyncingFromUrl.value = true
        syncFiltersFromUrl()
        fetchChallenges(1, false)
        nextTick(() => {
          isSyncingFromUrl.value = false
        })
      },
      { deep: true }
    )
  }

  function handleFilterSearch(fetchChallenges) {
    fetchChallenges(1, false)
  }

  return {
    filters,
    isSyncingFromUrl,
    syncFiltersFromUrl,
    setupFilterWatchers,
    handleFilterSearch
  }
}
