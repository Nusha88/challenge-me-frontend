<template>
  <div class="my-challenges">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('challenges.myListTitle') }}</h1>

    <!-- Filter Panel -->
    <FilterPanel v-if="isLoggedIn" v-model="filters" />

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-alert v-else-if="!isLoggedIn" type="info">
          {{ t('challenges.loginPrompt') }}
        </v-alert>

        <v-alert v-else-if="!filteredChallenges.length && !loading" type="info">
          {{ t('challenges.noMyChallenges') }}
        </v-alert>

        <div v-else>
          <!-- Active Challenges -->
          <div v-if="activeChallenges.length > 0">
            <h2 class="section-title mb-4">{{ t('challenges.activityActive') }}</h2>
            <div class="challenges-grid">
              <ChallengeCard
                v-for="challenge in activeChallenges"
                :key="challenge._id"
                :challenge="challenge"
                :current-user-id="currentUserId"
                :show-join-button="false"
                @click="openDetails"
              />
            </div>
          </div>

          <!-- Finished Challenges -->
          <div v-if="finishedChallenges.length > 0" :class="{ 'finished-section': activeChallenges.length > 0 }">
            <h2 class="section-title mb-4" :class="{ 'mt-8': activeChallenges.length > 0 }">{{ t('challenges.activityFinished') }}</h2>
            <div class="challenges-grid">
              <ChallengeCard
                v-for="challenge in finishedChallenges"
                :key="challenge._id"
                :challenge="challenge"
                :current-user-id="currentUserId"
                :show-join-button="false"
                @click="openDetails"
              />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :join-loading="false"
      :save-loading="saveLoading"
      :save-error="saveError"
      :delete-loading="deleteLoading"
      @save="handleDialogSave"
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
const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUserId = ref(getCurrentUserId())

// Filter state
const filters = ref({
  type: null,
  activity: null,
  participants: null,
  creationDate: null
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
  return (selectedChallenge.value.participants || []).some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
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

function isChallengeFinished(challenge) {
  // Check if endDate is in the past
  if (isChallengeEnded(challenge)) {
    return true
  }
  
  // For result challenges, check if all actions are done
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions) || challenge.actions.length === 0) {
      return false
    }
    
    // Check if all actions and their children are checked
    return challenge.actions.every(action => {
      // Parent action must be checked
      if (!action.checked) return false
      
      // All children must be checked (if any exist)
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      
      return true
    })
  }
  
  return false
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

async function fetchChallenges() {
  const userId = currentUserId.value
  if (!userId) {
    isLoggedIn.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getChallengesByUser(userId)
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

function calculateProgressDone(challenge) {
  if (!challenge) return 0
  
  if (challenge.challengeType === 'result') {
    // For result challenges, count checked actions
    if (!challenge.actions || !Array.isArray(challenge.actions)) return 0
    return challenge.actions.filter(action => action.checked).length
  } else {
    // For habit challenges, get current user's completed days from their participant entry
    if (!currentUserId.value || !challenge.participants) return 0
    
    const participant = challenge.participants.find(p => {
      const userId = p.userId?._id || p.userId || p._id
      return userId && userId.toString() === currentUserId.value.toString()
    })
    
    if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return 0
    return participant.completedDays.length
  }
}

function calculateProgressTotal(challenge) {
  if (!challenge) return 0
  
  if (challenge.challengeType === 'result') {
    // For result challenges, total number of actions
    if (!challenge.actions || !Array.isArray(challenge.actions)) return 0
    return challenge.actions.length
  } else {
    // For habit challenges, calculate days between start and end date
    if (!challenge.startDate || !challenge.endDate) return 0
    
    try {
      const start = new Date(challenge.startDate)
      const end = new Date(challenge.endDate)
      
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
      
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      
      // For "every other day" frequency, only count every other day
      if (challenge.frequency === 'everyOtherDay') {
        let count = 0
        const current = new Date(start)
        let dayIndex = 0
        
        while (current <= end) {
          // Only count enabled days (day 0, 2, 4, 6, etc.)
          if (dayIndex % 2 === 0) {
            count++
          }
          current.setDate(current.getDate() + 1)
          dayIndex++
        }
        
        return count
      }
      
      // For other frequencies, count all days
      const diffTime = end - start
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
      
      return diffDays
    } catch {
      return 0
    }
  }
}

function calculateProgressPercentage(challenge) {
  const done = calculateProgressDone(challenge)
  const total = calculateProgressTotal(challenge)
  
  if (total === 0) return 0
  const percentage = Math.round((done / total) * 100)
  return Math.min(100, Math.max(0, percentage)) // Clamp between 0 and 100
}

// Filtered challenges
const filteredChallenges = computed(() => {
  let result = [...challenges.value]

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

// Separate active and finished challenges
const activeChallenges = computed(() => {
  return filteredChallenges.value.filter(challenge => !isChallengeFinished(challenge))
})

const finishedChallenges = computed(() => {
  return filteredChallenges.value.filter(challenge => isChallengeFinished(challenge))
})

onMounted(() => {
  fetchChallenges()
})
</script>

<style scoped>
.my-challenges {
  width: 100%;
  padding: 0 8px;
}

@media (min-width: 600px) {
  .my-challenges {
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


.page-title {
  font-size: 1.5rem;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

@media (min-width: 600px) {
  .section-title {
    font-size: 1.5rem;
  }
}

.finished-section {
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 24px;
  margin-top: 24px;
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
</style>
