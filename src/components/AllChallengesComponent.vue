<template>
  <div class="all-challenges">
    <div class="header-section text-left mb-10 reveal-animation">
  <div class="d-flex align-center mb-1">
    <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-compass-rose</v-icon>
    <h1 class="page-title-dark">Global Missions</h1>
  </div>
  <div class="text-overline text-teal-accent-4 tracking-widest ml-13">Strategic Operations Center</div>
  <p class="journal-subtitle-dark mt-2">Join existing squads or discover new rituals to master.</p>
</div>

    <!-- Main Ritual Card with Skeleton -->
    <div v-if="loadingMainRitual" class="main-ritual-skeleton mb-8">
      <v-skeleton-loader
        type="image, article"
        height="400"
        class="main-ritual-skeleton-loader"
      ></v-skeleton-loader>
    </div>
    <MainRitualCard
      v-else-if="mainRitual"
      :challenge="mainRitual"
      :current-user-id="currentUserId"
      :joining="joiningId === mainRitual._id"
      @join="joinChallenge"
      @click="openDetails"
    />

    <FilterPanel v-model="filters" @search="handleFilterSearch" />

    <div class="content-section">
      <div v-if="loading && !loadingMore" class="challenges-grid">
  <v-skeleton-loader
    v-for="n in 6"
    :key="n"
    type="card, list-item-two-line"
    class="skeleton-card"
  ></v-skeleton-loader>
</div>

      <transition-group v-else name="staggered-fade" tag="div" class="challenges-grid">
        <ChallengeCard
          v-for="challenge in gridChallenges"
          :key="challenge._id"
          :challenge="challenge"
          :current-user-id="currentUserId"
          :show-join-button="true"
          :joining-id="joiningId"
          :leaving-id="leavingId"
          :watching-id="watchingId"
          all-challenges="true"
          :is-watched="isWatched(challenge)"
          @click="openDetails"
          @join="joinChallenge"
          @leave="leaveChallenge"
          @watch="watchChallenge"
          @unwatch="unwatchChallenge"
          @owner-navigated="handleOwnerNavigated"
        />
      </transition-group>
      
      <div v-if="loadingMore" class="challenges-grid mt-6">
  <v-skeleton-loader
    v-for="n in 3"
    :key="'more-' + n"
    type="card"
    class="skeleton-card"
  ></v-skeleton-loader>
</div>
    </div>

    <!-- Upcoming Challenges Section -->
    <div v-if="upcomingChallenges.length > 0 && filters.showUpcoming !== false" class="upcoming-section mt-8">
      <h2 class="section-title mb-4">{{ t('challenges.upcoming') }}</h2>
      <div class="challenges-grid">
          <ChallengeCard
          v-for="challenge in upcomingChallenges"
            :key="challenge._id"
            :challenge="challenge"
            :current-user-id="currentUserId"
            :show-join-button="true"
            :joining-id="joiningId"
          :leaving-id="leavingId"
          :watching-id="watchingId"
          all-challenges="true"
          :is-watched="isWatched(challenge)"
            @click="openDetails"
            @join="joinChallenge"
          @leave="leaveChallenge"
          @watch="watchChallenge"
          @unwatch="unwatchChallenge"
          @owner-navigated="handleOwnerNavigated"
          />
        </div>
    </div>

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="showDialogJoinButton"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="selectedJoinLoading"
      :leave-loading="selectedLeaveLoading"
      :save-loading="saveLoading"
      :save-error="saveError"
      :delete-loading="deleteLoading"
      @save="handleDialogSave"
      @join="handleDialogJoin"
      @leave="handleDialogLeave"
      @delete="handleDialogDelete"
      @update="handleDialogUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import FilterPanel from './FilterPanel.vue'
import ChallengeCard from './ChallengeCard.vue'
import MainRitualCard from './MainRitualCard.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()

const challenges = ref([])
const allHabitChallenges = ref([]) // Store all habit challenges for main ritual selection
const loading = ref(false)
const loadingMainRitual = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const currentUserId = ref(getCurrentUserId())
const joiningId = ref(null)
const leavingId = ref(null)
const watchingId = ref(null)
const watchedChallenges = ref([])
const currentPage = ref(1)
const hasMore = ref(true)

// Filter state
const filters = ref({
  title: null,
  type: 'all',
  owner: null,
  popularity: null,
  showUpcoming: true, // Default to showing upcoming challenges
  isCompleted: false // Default to hiding completed challenges
})

// Challenges are already filtered by the backend, so use them directly
const filteredChallenges = computed(() => {
  return challenges.value
})

// Find the main ritual (most popular habit challenge)
const mainRitual = computed(() => {
  // Use allHabitChallenges which contains all habit challenges, not just paginated ones
  if (allHabitChallenges.value.length === 0) return null
  
  // Find the challenge with the most participants
  return allHabitChallenges.value.reduce((prev, current) => {
    const prevCount = prev?.participants?.length || 0
    const currentCount = current?.participants?.length || 0
    return currentCount > prevCount ? current : prev
  }, allHabitChallenges.value[0])
})

const totalChallenges = computed(() => {
  // Return the total from pagination if available, otherwise use current count
  // This will be updated when we get pagination info from backend
  return challenges.value.length
})

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const isOpeningChallenge = ref(false) // Flag to prevent recursive updates
const saveLoading = ref(false)
const saveError = ref('')
const deleteLoading = ref(false)
const { t, locale } = useI18n()

const selectedIsOwner = computed(() => {
  if (!selectedChallenge.value) return false
  return isChallengeOwner(selectedChallenge.value.owner)
})

const selectedIsParticipant = computed(() => {
  if (!selectedChallenge.value) return false
  return isParticipant(selectedChallenge.value)
})

const selectedJoinLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return joiningId.value === selectedChallenge.value._id
})

const showDialogJoinButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  // Cannot join if challenge has ended
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  // Can only join habit challenges
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    !selectedIsParticipant.value
  )
})

const showDialogLeaveButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  // Cannot leave if challenge has ended
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  // Can only leave habit challenges
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    selectedIsParticipant.value
  )
})

const selectedLeaveLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return leavingId.value === selectedChallenge.value._id
})

watch(detailsDialogOpen, value => {
  if (!value && !isOpeningChallenge.value) {
    selectedChallenge.value = null
    saveError.value = ''
    // Update route when dialog closes if we're on a challenge view route
    // Use nextTick to avoid recursive updates
    if (route.params.id) {
      nextTick(() => {
        router.push('/missions')
      })
    }
  }
})

function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null

  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || null
  } catch (error) {
    return null
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

function formatDateRange(start, end) {
  const startFormatted = formatDate(start)
  const endFormatted = formatDate(end)
  return startFormatted && endFormatted
    ? `${startFormatted} - ${endFormatted}`
    : startFormatted || endFormatted || ''
}

function isChallengeOwner(owner) {
  if (!owner) return false
  if (!currentUserId.value) return false
  const ownerId = owner._id || owner
  return ownerId === currentUserId.value
}

function isParticipant(challenge) {
  if (!currentUserId.value) return false
  return (challenge.participants || []).some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
}

function isChallengeEnded(challenge) {
  if (!challenge.endDate) return false
  try {
    const endDate = new Date(challenge.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today
  } catch {
    return false
  }
}

function isChallengeUpcoming(challenge) {
  if (!challenge.startDate) return false
  try {
    const startDate = new Date(challenge.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    return startDate > today
  } catch {
    return false
  }
}

function canJoin(challenge) {
  // Cannot join if challenge has ended
  if (isChallengeEnded(challenge)) {
    return false
  }
  // Can only join habit challenges
  if (challenge.challengeType !== 'habit') {
    return false
  }
  return currentUserId.value && !isChallengeOwner(challenge.owner) && !isParticipant(challenge)
}


function isWatched(challenge) {
  if (!challenge || !currentUserId.value) return false
  return watchedChallenges.value.some(id => id.toString() === challenge._id.toString())
}

async function watchChallenge(challenge) {
  if (!currentUserId.value) {
    errorMessage.value = t('notifications.mustLogin')
    return
  }

  watchingId.value = challenge._id
  errorMessage.value = ''

  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
  }

  try {
    await challengeService.watchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
    }
    errorMessage.value = error.response?.data?.message || t('challenges.watchError')
  } finally {
    watchingId.value = null
  }
}

async function unwatchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  errorMessage.value = ''

  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
  }

  try {
    await challengeService.unwatchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
    }
    errorMessage.value = error.response?.data?.message || t('challenges.unwatchError')
  } finally {
    watchingId.value = null
  }
}

async function loadWatchedChallenges() {
  if (!currentUserId.value) return
  
  try {
    const { data } = await challengeService.getWatchedChallenges(currentUserId.value)
    watchedChallenges.value = (data.challenges || []).map(c => c._id)
  } catch (error) {
    console.error('Error loading watched challenges:', error)
  }
}

async function joinChallenge(challenge) {
  if (!currentUserId.value) {
    errorMessage.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    errorMessage.value = t('notifications.joinError')
    return
  }

  joiningId.value = challenge._id
  errorMessage.value = ''

  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh challenges list (keep current page)
    await fetchChallenges(currentPage.value, false)
    
    // Refresh all habit challenges to update main ritual
    await fetchAllHabitChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (error) {
        // Fallback to finding in list
      selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.joinError')
  } finally {
    joiningId.value = null
  }
}

async function leaveChallenge(challenge) {
  if (!currentUserId.value) {
    errorMessage.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    errorMessage.value = t('notifications.joinError')
    return
  }

  leavingId.value = challenge._id
  errorMessage.value = ''

  try {
    await challengeService.leaveChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh challenges list (keep current page)
    await fetchChallenges(currentPage.value, false)
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (error) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.joinError')
  } finally {
    leavingId.value = null
  }
}

async function fetchChallenges(page = 1, append = false) {
  if (append) {
    loadingMore.value = true
  } else {
  loading.value = true
    currentPage.value = 1
  }
  errorMessage.value = ''

  try {
    // Build filter object for API call
    const filterParams = {
      page,
      limit: 20,
      ...(filters.value.title && { title: filters.value.title }),
      ...(filters.value.type && { type: filters.value.type }),
      ...(filters.value.owner && { owner: filters.value.owner }),
      ...(filters.value.popularity && { popularity: filters.value.popularity }),
      // Send isCompleted as string 'true' when filter is enabled, 'false' when disabled
      // Backend expects: 'true' = show completed, 'false' = hide completed, undefined = default (hide)
      ...(filters.value.isCompleted !== undefined && { 
        isCompleted: filters.value.isCompleted ? 'true' : 'false' 
      })
    }
    
    const { data } = await challengeService.getAllChallenges(filterParams)
    
    if (append) {
      // Append new challenges to existing list
      challenges.value = [...challenges.value, ...(data?.challenges || [])]
    } else {
      // Replace challenges list (first page or filter change)
    challenges.value = data?.challenges || []
    }
    
    // Update pagination state
    hasMore.value = data?.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.apiError')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreChallenges = async () => {
  if (loadingMore.value || !hasMore.value) {
    return // Don't load more if already loading or no more pages
  }
  
  await fetchChallenges(currentPage.value + 1, true)
}

const handleScroll = () => {
  // Если уже грузим или страниц больше нет — выходим
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // Порог срабатывания: за 400px до конца страницы
  // Это позволит пользователю не видеть лоадер, если интернет быстрый
  if (scrollTop + windowHeight >= documentHeight - 400) {
    loadMoreChallenges()
  }
}

async function openDetails(challenge) {
  // Prevent recursive calls
  if (isOpeningChallenge.value) return
  
  // Always open details dialog for all users (owners can navigate to edit from dialog)
  isOpeningChallenge.value = true
  saveError.value = ''
  
  // Fetch full challenge data to ensure we have populated owner and participants
  try {
    const { data } = await challengeService.getChallenge(challenge._id)
    selectedChallenge.value = data
  } catch (error) {
    // Fallback to using the challenge from the list
    selectedChallenge.value = challenge
  }
  
  // Update route if not already set to this challenge
  if (route.params.id !== challenge._id) {
    router.push(`/missions/${challenge._id}`).finally(() => {
      nextTick(() => {
        detailsDialogOpen.value = true
        isOpeningChallenge.value = false
      })
    })
  } else {
    nextTick(() => {
  detailsDialogOpen.value = true
      isOpeningChallenge.value = false
    })
  }
}

async function handleDialogSave(formData) {
  if (!selectedChallenge.value) return

  saveLoading.value = true
  saveError.value = ''

  try {
    await challengeService.updateChallenge(selectedChallenge.value._id, { ...formData })
    await fetchChallenges(currentPage.value, false)
    // Update selected challenge if dialog is still open
    if (selectedChallenge.value) {
      const updatedChallenge = challenges.value.find(c => c._id === selectedChallenge.value._id)
      if (updatedChallenge) {
        selectedChallenge.value = updatedChallenge
      }
    }
    detailsDialogOpen.value = false
    router.push('/')
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.updateError')
  } finally {
    saveLoading.value = false
  }
}

async function handleDialogUpdate() {
  // Refresh challenges when participant updates their completedDays or watch/unwatch
  await fetchChallenges(currentPage.value, false)
  await loadWatchedChallenges()
  // Also refresh the selected challenge if dialog is open
  if (selectedChallenge.value) {
    const updatedChallenge = challenges.value.find(c => c._id === selectedChallenge.value._id)
    if (updatedChallenge) {
      selectedChallenge.value = updatedChallenge
    }
  }
}

async function handleDialogJoin() {
  if (!selectedChallenge.value) return
  await joinChallenge(selectedChallenge.value)
}

async function handleDialogLeave() {
  if (!selectedChallenge.value) return
  await leaveChallenge(selectedChallenge.value)
}

async function handleDialogDelete(challengeId) {
  if (!challengeId) return

  deleteLoading.value = true
  saveError.value = ''

  try {
    await challengeService.deleteChallenge(challengeId)
    await fetchChallenges(currentPage.value, false)
    detailsDialogOpen.value = false
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.deleteChallengeError')
  } finally {
    deleteLoading.value = false
  }
}
// Замени существующий gridChallenges на этот computed
const gridChallenges = computed(() => {
  if (!challenges.value) return []
  
  let filtered = [...challenges.value]
  
  // Если есть mainRitual, исключаем его из общей сетки, чтобы не дублировать
  if (mainRitual.value) {
    filtered = filtered.filter(c => c._id !== mainRitual.value._id)
  }
  
  // Always filter out upcoming challenges from main grid (they'll be shown separately at the bottom)
  filtered = filtered.filter(c => !isChallengeUpcoming(c))
  
  return filtered
})

// Separate upcoming challenges computed property
const upcomingChallenges = computed(() => {
  if (!challenges.value) return []
  
  // Get all upcoming challenges
  let upcoming = challenges.value.filter(c => isChallengeUpcoming(c))
  
  // Exclude mainRitual if it's upcoming (it's already shown in MainRitualCard)
  if (mainRitual.value && isChallengeUpcoming(mainRitual.value)) {
    upcoming = upcoming.filter(c => c._id !== mainRitual.value._id)
  }
  
  return upcoming
})

async function openChallengeById(challengeId) {
  if (!challengeId) return
  
  // Prevent multiple simultaneous calls
  if (loading.value) return
  
  // Check if challenge is already in the list
  let challenge = challenges.value.find(c => c._id === challengeId)
  
  if (!challenge) {
    // Fetch the challenge if not in list
    try {
      loading.value = true
      const { data } = await challengeService.getChallenge(challengeId)
      challenge = data
      // Add to challenges list if it's public or user has access
      // Use nextTick to avoid reactive updates during render
      if (challenge && challenge.privacy !== 'private') {
        await nextTick()
        // Check again if challenge was added by another process
        const existingChallenge = challenges.value.find(c => c._id === challengeId)
        if (!existingChallenge) {
          challenges.value.push(challenge)
        } else {
          challenge = existingChallenge
        }
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
      errorMessage.value = error.response?.data?.message || t('challenges.notFound')
      return
    } finally {
      loading.value = false
    }
  }
  
  if (challenge) {
    await nextTick()
    openDetails(challenge)
  }
}

// Sync filters from URL query parameters
const syncFiltersFromUrl = () => {
  const query = route.query
  
  // Sync owner/createdBy filter
  if (query.owner) {
    filters.value.owner = query.owner
  } else if (query.createdBy) {
    filters.value.owner = query.createdBy
  } else {
    filters.value.owner = null
  }
  
  // Sync isCompleted filter
  if (query.isCompleted !== undefined) {
    filters.value.isCompleted = query.isCompleted === 'true'
  } else {
    filters.value.isCompleted = false
  }
  
  // Sync type filter
  if (query.type) {
    filters.value.type = query.type
  } else {
    filters.value.type = 'all'
  }
  
  // Sync popularity filter
  if (query.popularity) {
    filters.value.popularity = query.popularity
  } else {
    filters.value.popularity = null
  }
  
  // Sync title filter
  if (query.title) {
    filters.value.title = query.title
  } else {
    filters.value.title = null
  }
  
  // Sync showUpcoming filter
  if (query.showUpcoming !== undefined) {
    filters.value.showUpcoming = query.showUpcoming === 'true'
  } else {
    filters.value.showUpcoming = true
  }
}

// Sync filters to URL query parameters
const syncFiltersToUrl = () => {
  const query = { ...route.query }
  
  // Update or remove filter parameters
  if (filters.value.owner) {
    query.createdBy = filters.value.owner
    delete query.owner // Remove old 'owner' param if exists
  } else {
    delete query.createdBy
    delete query.owner
  }
  
  if (filters.value.isCompleted === true) {
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
  
  // Update URL without triggering navigation
  router.replace({ query })
}

// Handle filter search button click
const handleFilterSearch = () => {
  fetchChallenges(1, false) // Reset to page 1 when search is triggered
}

// Flag to prevent infinite loops when syncing URL and filters
const isSyncingFromUrl = ref(false)

// Watch for filter changes (except title which uses search button)
// Watch each filter property individually to avoid triggering on title changes
watch(() => filters.value.type, () => {
  if (!isSyncingFromUrl.value) {
    syncFiltersToUrl()
    fetchChallenges(1, false)
  }
})

watch(() => filters.value.owner, () => {
  if (!isSyncingFromUrl.value) {
    syncFiltersToUrl()
    fetchChallenges(1, false)
  }
})

watch(() => filters.value.popularity, () => {
  if (!isSyncingFromUrl.value) {
    syncFiltersToUrl()
    fetchChallenges(1, false)
  }
})

watch(() => filters.value.showUpcoming, () => {
  if (!isSyncingFromUrl.value) {
    syncFiltersToUrl()
  }
  // No need to refetch, just filter client-side
})

watch(() => filters.value.isCompleted, () => {
  if (!isSyncingFromUrl.value) {
    syncFiltersToUrl()
    fetchChallenges(1, false)
  }
})

watch(() => filters.value.title, () => {
  if (!isSyncingFromUrl.value) {
    syncFiltersToUrl()
  }
  // Title uses search button, so don't auto-fetch
})

// Watch for route query changes and sync filters
watch(() => route.query, () => {
  isSyncingFromUrl.value = true
  syncFiltersFromUrl()
  fetchChallenges(1, false)
  nextTick(() => {
    isSyncingFromUrl.value = false
  })
}, { deep: true })

// Fetch all habit challenges to find the main ritual
async function fetchAllHabitChallenges() {
  loadingMainRitual.value = true
  try {
    // Fetch all habit challenges with a high limit to get the most popular ones
    const { data } = await challengeService.getAllChallenges({
      type: 'habit',
      excludeFinished: true,
      limit: 100, // Fetch more to find the most popular
      page: 1
    })
    allHabitChallenges.value = data?.challenges || []
  } catch (error) {
    console.error('Error fetching habit challenges for main ritual:', error)
    allHabitChallenges.value = []
  } finally {
    loadingMainRitual.value = false
  }
}

onMounted(async () => {
  // Sync filters from URL query parameters (prevent watchers from updating URL)
  isSyncingFromUrl.value = true
  syncFiltersFromUrl()
  await nextTick()
  isSyncingFromUrl.value = false
  
  // Fetch all habit challenges first to determine main ritual
  await fetchAllHabitChallenges()
  await fetchChallenges(1, false)
  loadWatchedChallenges()
  window.addEventListener('scroll', handleScroll)
  
  // Check if route has challenge ID parameter
  if (route.params.id) {
    // Small delay to ensure challenges are loaded
    setTimeout(() => {
      openChallengeById(route.params.id)
    }, 100)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Watch for route changes
watch(() => route.params.id, (newId, oldId) => {
  // Prevent recursive updates
  if (isOpeningChallenge.value) return
  
  // Only act if the ID actually changed
  if (newId && newId !== oldId) {
    // Check if dialog is already open for this challenge
    if (detailsDialogOpen.value && selectedChallenge.value?._id === newId) {
      return // Already showing this challenge
    }
    
    nextTick(() => {
      openChallengeById(newId)
    })
  } else if (!newId && oldId && !isOpeningChallenge.value) {
    // Close dialog if navigating away from challenge view
    // Use nextTick to avoid recursive updates
    nextTick(() => {
      detailsDialogOpen.value = false
    })
  }
})

function handleOwnerNavigated() {
  // Close dialog when owner is navigated
  detailsDialogOpen.value = false
}
</script>

<style scoped>
.all-challenges {
  width: 100%;
  max-width: 1400px; /* Ограничиваем ширину для больших мониторов */
  margin: 0 auto;
  padding: 16px;
  }

/* Заголовок страницы */
  .page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 4px;
}


/* Секция контента без рамок */
.content-section {
  position: relative;
  min-height: 400px;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px; /* Увеличили зазор для "маневра" карточек */
  padding: 20px 4px; /* Чтобы поднятая карточка не обрезалась сверху */
}

/* Анимация появления карточек */
.staggered-fade-enter-active,
.staggered-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.staggered-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.staggered-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}


.challenges-grid > * {
  transition: all 0.3s ease-in-out !important;
}

/* Мобильные фиксы */
@media (max-width: 600px) {
  .all-challenges {
    padding: 12px;
  }
  
  .challenges-grid {
    grid-template-columns: 1fr; /* На мобильных строго в одну колонку */
    gap: 16px;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
}

/* Планшеты */
@media (min-width: 601px) and (max-width: 1024px) {
  .challenges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .section-title {
    font-size: 1.5rem;
  }
}

.upcoming-section {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  padding-top: 24px;
  margin-top: 24px;
}

.main-ritual-skeleton {
  border-radius: 20px;
  overflow: hidden;
}

.main-ritual-skeleton-loader {
  border-radius: 20px;
  }
</style>
