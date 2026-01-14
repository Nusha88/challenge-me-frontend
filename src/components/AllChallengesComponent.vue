<template>
  <div class="all-challenges">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('challenges.listTitle') }} ({{ totalChallenges }})</h1>

    <!-- Filter Panel -->
    <FilterPanel v-model="filters" @search="handleFilterSearch" />

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-alert v-else-if="!filteredChallenges.length && !loading" type="info">
          {{ t('challenges.noChallenges') }}
        </v-alert>

        <div v-else class="challenges-grid">
          <ChallengeCard
            v-for="challenge in filteredChallenges"
            :key="challenge._id"
            :challenge="challenge"
            :current-user-id="currentUserId"
            :show-join-button="true"
            :joining-id="joiningId"
            :leaving-id="leavingId"
            :watching-id="watchingId"
            :is-watched="isWatched(challenge)"
            @click="openDetails"
            @join="joinChallenge"
            @leave="leaveChallenge"
            @watch="watchChallenge"
            @unwatch="unwatchChallenge"
            @owner-navigated="handleOwnerNavigated"
          />
        </div>
        
        <!-- Loading More Indicator -->
        <div v-if="loadingMore" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        </div>
      </v-card-text>
    </v-card>

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
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()

const challenges = ref([])
const loading = ref(false)
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
  type: null,
  owner: null,
  popularity: null,
  creationDate: null
})

// Challenges are already filtered by the backend, so use them directly
const filteredChallenges = computed(() => {
  return challenges.value
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
        router.push('/challenges')
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
      excludeFinished: true, // Default to excluding finished challenges
      ...(filters.value.title && { title: filters.value.title }),
      ...(filters.value.type && { type: filters.value.type }),
      ...(filters.value.owner && { owner: filters.value.owner }),
      ...(filters.value.popularity && { popularity: filters.value.popularity }),
      ...(filters.value.creationDate && { creationDate: filters.value.creationDate })
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
  if (loadingMore.value || !hasMore.value) {
    return
  }
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // Load more when user is within 200px of the bottom
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMoreChallenges()
  }
}

async function openDetails(challenge) {
  // Prevent recursive calls
  if (isOpeningChallenge.value) return
  
  // Check if user is owner - navigate to edit page
  if (isChallengeOwner(challenge.owner)) {
    router.push(`/challenges/edit/${challenge._id}`)
    return
  }
  
  // Otherwise open modal for non-owners
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
    router.push(`/challenges/${challenge._id}`).finally(() => {
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

// Handle filter search button click
const handleFilterSearch = () => {
  fetchChallenges(1, false) // Reset to page 1 when search is triggered
}

// Watch for filter changes (except title which uses search button)
// Watch each filter property individually to avoid triggering on title changes
watch(() => filters.value.type, () => {
  fetchChallenges(1, false)
})

watch(() => filters.value.owner, () => {
  fetchChallenges(1, false)
})

watch(() => filters.value.popularity, () => {
  fetchChallenges(1, false)
})

watch(() => filters.value.creationDate, () => {
  fetchChallenges(1, false)
})

onMounted(async () => {
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
  padding: 0 8px;
}

@media (min-width: 600px) {
  .all-challenges {
    padding: 0 16px;
  }
}

.challenges-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
  width: 100%;
}

@media (min-width: 600px) {
  .challenges-grid {
    gap: 24px;
    padding: 16px 0;
  }
}



@media (min-width: 768px) {
  .challenges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .challenges-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.privacy-icon {
  flex-shrink: 0;
}

.challenge-type-chip {
  width: fit-content;
}

.page-title {
  font-size: 1.5rem;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.date-pickers {
  display: grid;
  gap: 16px;
}

@media (min-width: 600px) {
  .date-pickers {
    grid-template-columns: repeat(2, 1fr);
  }
}


</style>
