<template>
  <div class="all-challenges">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('challenges.listTitle') }}</h1>

    <!-- Filter Panel -->
    <FilterPanel v-model="filters" />

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
            @click="openDetails"
            @join="joinChallenge"
          />
        </div>
      </v-card-text>
    </v-card>

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="showDialogJoinButton"
      :join-loading="selectedJoinLoading"
      :save-loading="saveLoading"
      :save-error="saveError"
      :delete-loading="deleteLoading"
      @save="handleDialogSave"
      @join="handleDialogJoin"
      @delete="handleDialogDelete"
      @update="handleDialogUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import FilterPanel from './FilterPanel.vue'
import ChallengeCard from './ChallengeCard.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const currentUserId = ref(getCurrentUserId())
const joiningId = ref(null)

// Filter state
const filters = ref({
  type: null,
  activity: null,
  participants: null,
  creationDate: null
})

// Filter out private challenges from the display
const publicChallenges = computed(() => {
  return challenges.value.filter(challenge => challenge.privacy !== 'private')
})

// Filtered challenges
const filteredChallenges = computed(() => {
  let result = [...publicChallenges.value]

  // Filter by type
  if (filters.value.type) {
    result = result.filter(challenge => challenge.challengeType === filters.value.type)
  }

  // Filter by activity
  if (filters.value.activity) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    result = result.filter(challenge => {
      if (!challenge.startDate || !challenge.endDate) return false
      
      const startDate = new Date(challenge.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(challenge.endDate)
      endDate.setHours(0, 0, 0, 0)
      
      if (filters.value.activity === 'active') {
        return startDate <= today && endDate >= today
      } else if (filters.value.activity === 'finished') {
        return endDate < today
      } else if (filters.value.activity === 'upcoming') {
        return startDate > today
      }
      return true
    })
  }

  // Filter by participants
  if (filters.value.participants) {
    result = result.filter(challenge => {
      const participantCount = (challenge.participants || []).length
      
      if (filters.value.participants === '0') {
        return participantCount === 0
      } else if (filters.value.participants === '1-5') {
        return participantCount >= 1 && participantCount <= 5
      } else if (filters.value.participants === '6+') {
        return participantCount >= 6
      }
      return true
    })
  }

  // Filter by creation date
  if (filters.value.creationDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    result = result.filter(challenge => {
      // Use createdAt if available, otherwise use startDate as fallback
      const creationDate = challenge.createdAt || challenge.startDate
      if (!creationDate) return false
      
      const created = new Date(creationDate)
      created.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today - created) / (1000 * 60 * 60 * 24))
      
      if (filters.value.creationDate === 'today') {
        return daysDiff === 0
      } else if (filters.value.creationDate === 'week') {
        return daysDiff >= 0 && daysDiff <= 7
      } else if (filters.value.creationDate === 'month') {
        return daysDiff >= 0 && daysDiff <= 30
      } else if (filters.value.creationDate === 'older') {
        return daysDiff > 30
      }
      return true
    })
  }

  return result
})

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
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

watch(detailsDialogOpen, value => {
  if (!value) {
    selectedChallenge.value = null
    saveError.value = ''
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


async function joinChallenge(challenge) {
  if (!currentUserId.value) {
    errorMessage.value = t('notifications.mustLogin')
    return
  }

  joiningId.value = challenge._id
  errorMessage.value = ''

  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    await fetchChallenges()
    if (selectedChallenge.value?._id === challenge._id) {
      selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.joinError')
  } finally {
    joiningId.value = null
  }
}

async function fetchChallenges() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getAllChallenges()
    challenges.value = data?.challenges || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.apiError')
  } finally {
    loading.value = false
  }
}

function openDetails(challenge) {
  // Check if user is owner - navigate to edit page
  if (isChallengeOwner(challenge.owner)) {
    router.push(`/challenges/edit/${challenge._id}`)
    return
  }
  
  // Otherwise open modal for non-owners
  selectedChallenge.value = challenge
  saveError.value = ''
  detailsDialogOpen.value = true
}

async function handleDialogSave(formData) {
  if (!selectedChallenge.value) return

  saveLoading.value = true
  saveError.value = ''

  try {
    await challengeService.updateChallenge(selectedChallenge.value._id, { ...formData })
    await fetchChallenges()
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
  // Refresh challenges when participant updates their completedDays
  await fetchChallenges()
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

async function handleDialogDelete(challengeId) {
  if (!challengeId) return

  deleteLoading.value = true
  saveError.value = ''

  try {
    await challengeService.deleteChallenge(challengeId)
    await fetchChallenges()
    detailsDialogOpen.value = false
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.deleteError')
  } finally {
    deleteLoading.value = false
  }
}


onMounted(() => {
  fetchChallenges()
})
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
