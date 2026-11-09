import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { userService } from '../services/api'
import { isSuperAdminUserId } from '../constants/superAdmin'

const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

function compactParams(params) {
  const next = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return
    next[key] = value
  })
  return next
}

function createDebounced(fn, delay) {
  let timer = 0
  const run = (...args) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }
  const cancel = () => window.clearTimeout(timer)
  return { run, cancel }
}

export function useAdminStatistics() {
  const tab = ref('users')

  const overview = ref(null)
  const overviewError = ref('')

  const users = ref([])
  const usersTotal = ref(0)
  const usersPage = ref(1)
  const usersPerPage = ref(DEFAULT_PAGE_SIZE)
  const usersSearchInput = ref('')
  const usersSearch = ref('')
  const usersStatus = ref('all')
  const usersLoading = ref(false)
  const usersError = ref('')
  const updatingUserIds = ref(new Set())
  const deletingUser = ref(false)

  const missions = ref([])
  const missionsTotal = ref(0)
  const missionsPage = ref(1)
  const missionsPerPage = ref(DEFAULT_PAGE_SIZE)
  const missionsSearchInput = ref('')
  const missionsSearch = ref('')
  const missionsType = ref('all')
  const missionsPrivacy = ref('all')
  const missionsStatus = ref('all')
  const missionsLoading = ref(false)
  const missionsError = ref('')
  const updatingMissionIds = ref(new Set())
  const deletingMission = ref(false)

  const campaigns = ref([])
  const campaignsTotal = ref(0)
  const campaignsPage = ref(1)
  const campaignsPerPage = ref(DEFAULT_PAGE_SIZE)
  const campaignsSearchInput = ref('')
  const campaignsSearch = ref('')
  const campaignsLoading = ref(false)
  const campaignsError = ref('')

  const visits = ref([])
  const visitsTotal = ref(0)
  const visitsPage = ref(1)
  const visitsPerPage = ref(DEFAULT_PAGE_SIZE)
  const visitsConverted = ref('lurkers')
  const visitsDays = ref('7')
  const visitsLoading = ref(false)
  const visitsError = ref('')

  function isUserRowLocked(item) {
    return isSuperAdminUserId(item?.id)
  }

  async function loadOverview() {
    overviewError.value = ''
    try {
      const { data } = await userService.getAdminOverview()
      overview.value = data || null
    } catch (err) {
      console.error('Failed to load admin overview:', err)
      overviewError.value = err.response?.data?.message || 'overview'
      overview.value = null
    }
  }

  async function loadUsers() {
    usersLoading.value = true
    usersError.value = ''
    try {
      const { data } = await userService.getAdminUsers(compactParams({
        page: usersPage.value,
        limit: usersPerPage.value,
        search: usersSearch.value.trim(),
        status: usersStatus.value
      }))
      users.value = Array.isArray(data?.users) ? data.users : []
      usersTotal.value = Number(data?.pagination?.total || data?.totalUsers || 0)
    } catch (err) {
      console.error('Failed to load admin users:', err)
      usersError.value = err.response?.data?.message || 'users'
      users.value = []
      usersTotal.value = 0
    } finally {
      usersLoading.value = false
    }
  }

  async function loadMissions() {
    missionsLoading.value = true
    missionsError.value = ''
    try {
      const { data } = await userService.getAdminMissions(compactParams({
        page: missionsPage.value,
        limit: missionsPerPage.value,
        search: missionsSearch.value.trim(),
        type: missionsType.value,
        privacy: missionsPrivacy.value,
        status: missionsStatus.value
      }))
      missions.value = Array.isArray(data?.missions) ? data.missions : []
      missionsTotal.value = Number(data?.pagination?.total || data?.totalMissions || 0)
    } catch (err) {
      console.error('Failed to load admin missions:', err)
      missionsError.value = err.response?.data?.message || 'missions'
      missions.value = []
      missionsTotal.value = 0
    } finally {
      missionsLoading.value = false
    }
  }

  async function loadVisits() {
    visitsLoading.value = true
    visitsError.value = ''
    try {
      const { data } = await userService.getAdminVisits(compactParams({
        page: visitsPage.value,
        limit: visitsPerPage.value,
        converted: visitsConverted.value,
        days: visitsDays.value
      }))
      visits.value = Array.isArray(data?.visits) ? data.visits : []
      visitsTotal.value = Number(data?.pagination?.total || 0)
    } catch (err) {
      console.error('Failed to load admin visits:', err)
      visitsError.value = err.response?.data?.message || 'visits'
      visits.value = []
      visitsTotal.value = 0
    } finally {
      visitsLoading.value = false
    }
  }

  async function loadCampaigns() {
    campaignsLoading.value = true
    campaignsError.value = ''
    try {
      const { data } = await userService.getAdminCampaigns(compactParams({
        page: campaignsPage.value,
        limit: campaignsPerPage.value,
        search: campaignsSearch.value.trim()
      }))
      campaigns.value = Array.isArray(data?.campaigns) ? data.campaigns : []
      campaignsTotal.value = Number(data?.pagination?.total || data?.totalCampaigns || 0)
    } catch (err) {
      console.error('Failed to load admin campaigns:', err)
      campaignsError.value = err.response?.data?.message || 'campaigns'
      campaigns.value = []
      campaignsTotal.value = 0
    } finally {
      campaignsLoading.value = false
    }
  }

  function normalizePageSize(itemsPerPage) {
    if (!itemsPerPage || itemsPerPage < 1) return DEFAULT_PAGE_SIZE
    return Math.min(200, itemsPerPage)
  }

  function handleUsersOptions({ page, itemsPerPage }) {
    const nextPage = page || 1
    const nextPerPage = normalizePageSize(itemsPerPage)
    if (nextPage === usersPage.value && nextPerPage === usersPerPage.value) return
    usersPage.value = nextPage
    usersPerPage.value = nextPerPage
    loadUsers()
  }

  function handleMissionsOptions({ page, itemsPerPage }) {
    const nextPage = page || 1
    const nextPerPage = normalizePageSize(itemsPerPage)
    if (nextPage === missionsPage.value && nextPerPage === missionsPerPage.value) return
    missionsPage.value = nextPage
    missionsPerPage.value = nextPerPage
    loadMissions()
  }

  function handleVisitsOptions({ page, itemsPerPage }) {
    const nextPage = page || 1
    const nextPerPage = normalizePageSize(itemsPerPage)
    if (nextPage === visitsPage.value && nextPerPage === visitsPerPage.value) return
    visitsPage.value = nextPage
    visitsPerPage.value = nextPerPage
    loadVisits()
  }

  function handleCampaignsOptions({ page, itemsPerPage }) {
    const nextPage = page || 1
    const nextPerPage = normalizePageSize(itemsPerPage)
    if (nextPage === campaignsPage.value && nextPerPage === campaignsPerPage.value) return
    campaignsPage.value = nextPage
    campaignsPerPage.value = nextPerPage
    loadCampaigns()
  }

  const usersSearchDebounced = createDebounced((value) => {
    usersSearch.value = value
    usersPage.value = 1
    loadUsers()
  }, SEARCH_DEBOUNCE_MS)

  const missionsSearchDebounced = createDebounced((value) => {
    missionsSearch.value = value
    missionsPage.value = 1
    loadMissions()
  }, SEARCH_DEBOUNCE_MS)

  const campaignsSearchDebounced = createDebounced((value) => {
    campaignsSearch.value = value
    campaignsPage.value = 1
    loadCampaigns()
  }, SEARCH_DEBOUNCE_MS)

  watch(usersSearchInput, (value) => usersSearchDebounced.run(value))
  watch(missionsSearchInput, (value) => missionsSearchDebounced.run(value))
  watch(campaignsSearchInput, (value) => campaignsSearchDebounced.run(value))

  watch(usersStatus, () => {
    usersPage.value = 1
    loadUsers()
  })

  watch([missionsType, missionsPrivacy, missionsStatus], () => {
    missionsPage.value = 1
    loadMissions()
  })

  watch([visitsConverted, visitsDays], () => {
    if (tab.value !== 'visits') return
    visitsPage.value = 1
    loadVisits()
  })

  watch(tab, (nextTab) => {
    if (nextTab === 'missions') loadMissions()
    if (nextTab === 'campaigns') loadCampaigns()
    if (nextTab === 'visits') loadVisits()
  })

  async function handleStatusToggle(item, checked) {
    if (isUserRowLocked(item) || updatingUserIds.value.has(item.id)) return

    const nextStatus = checked ? 'active' : 'disabled'
    const previousStatus = item.status

    item.status = nextStatus
    updatingUserIds.value = new Set([...updatingUserIds.value, item.id])

    try {
      const { data } = await userService.updateUserStatus(item.id, nextStatus)
      item.status = data?.status === 'disabled' ? 'disabled' : 'active'
      await loadOverview()
    } catch (err) {
      console.error('Failed to update user status:', err)
      item.status = previousStatus
      usersError.value = err.response?.data?.message || 'status'
    } finally {
      const next = new Set(updatingUserIds.value)
      next.delete(item.id)
      updatingUserIds.value = next
    }
  }

  async function handleVisibilityToggle(item, checked) {
    if (updatingMissionIds.value.has(item.id)) return

    const nextVisibility = Boolean(checked)
    const previousVisibility = item.visibility !== false

    item.visibility = nextVisibility
    updatingMissionIds.value = new Set([...updatingMissionIds.value, item.id])

    try {
      const { data } = await userService.updateMissionVisibility(item.id, nextVisibility)
      item.visibility = data?.visibility !== false
      await loadOverview()
    } catch (err) {
      console.error('Failed to update mission visibility:', err)
      item.visibility = previousVisibility
      missionsError.value = err.response?.data?.message || 'visibility'
    } finally {
      const next = new Set(updatingMissionIds.value)
      next.delete(item.id)
      updatingMissionIds.value = next
    }
  }

  async function confirmDeleteUser(item) {
    if (!item || isUserRowLocked(item)) return false

    deletingUser.value = true
    usersError.value = ''
    try {
      await userService.deleteAdminUser(item.id)
      await Promise.all([loadUsers(), loadOverview()])
      return true
    } catch (err) {
      console.error('Failed to delete user:', err)
      usersError.value = err.response?.data?.message || 'delete'
      return false
    } finally {
      deletingUser.value = false
    }
  }

  async function confirmDeleteMission(item) {
    if (!item) return false

    deletingMission.value = true
    missionsError.value = ''
    try {
      await userService.deleteAdminMission(item.id)
      await Promise.all([loadMissions(), loadOverview()])
      return true
    } catch (err) {
      console.error('Failed to delete mission:', err)
      missionsError.value = err.response?.data?.message || 'delete-mission'
      return false
    } finally {
      deletingMission.value = false
    }
  }

  onMounted(() => {
    loadOverview()
    loadUsers()
  })

  onBeforeUnmount(() => {
    usersSearchDebounced.cancel()
    missionsSearchDebounced.cancel()
    campaignsSearchDebounced.cancel()
  })

  return {
    tab,
    overview,
    overviewError,
    users,
    usersTotal,
    usersPage,
    usersPerPage,
    usersSearchInput,
    usersStatus,
    usersLoading,
    usersError,
    updatingUserIds,
    deletingUser,
    missions,
    missionsTotal,
    missionsPage,
    missionsPerPage,
    missionsSearchInput,
    missionsType,
    missionsPrivacy,
    missionsStatus,
    missionsLoading,
    missionsError,
    updatingMissionIds,
    deletingMission,
    campaigns,
    campaignsTotal,
    campaignsPage,
    campaignsPerPage,
    campaignsSearchInput,
    campaignsLoading,
    campaignsError,
    visits,
    visitsTotal,
    visitsPage,
    visitsPerPage,
    visitsConverted,
    visitsDays,
    visitsLoading,
    visitsError,
    isUserRowLocked,
    handleUsersOptions,
    handleMissionsOptions,
    handleCampaignsOptions,
    handleVisitsOptions,
    handleStatusToggle,
    handleVisibilityToggle,
    confirmDeleteUser,
    confirmDeleteMission
  }
}
