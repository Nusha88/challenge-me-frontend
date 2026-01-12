<template>
  <div class="my-challenges">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('challenges.myListTitle') }} ({{ totalChallenges }})</h1>

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="error" type="error" class="mb-4">
          {{ error }}
        </v-alert>

        <v-alert v-else-if="!loading && challenges.length === 0" type="info">
          {{ t('challenges.noMyChallenges') }}
        </v-alert>

        <v-alert v-else-if="!loading && filteredChallenges.length === 0" type="info">
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
                :joining-id="joiningId"
                :leaving-id="leavingId"
                :watching-id="watchingId"
                :is-watched="isWatched(challenge)"
                @click="handleChallengeClick"
                @join="joinChallenge"
                @leave="leaveChallenge"
                @watch="watchChallenge"
                @unwatch="unwatchChallenge"
                @owner-navigated="handleOwnerNavigated"
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
            :joining-id="joiningId"
            :leaving-id="leavingId"
            :watching-id="watchingId"
            :is-watched="isWatched(challenge)"
                @click="handleChallengeClick"
                @join="joinChallenge"
                @leave="leaveChallenge"
                @watch="watchChallenge"
                @unwatch="unwatchChallenge"
                @owner-navigated="handleOwnerNavigated"
          />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Challenge Details Dialog -->
    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="false"
      :leave-loading="selectedLeaveLoading"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update="handleDialogUpdate"
      @leave="handleDialogLeave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import ChallengeCard from './ChallengeCard.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'

const router = useRouter()
const { t } = useI18n()

const challenges = ref([])
const loading = ref(false)
const error = ref('')

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)

// Get current user ID
function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || null
  } catch {
    return null
  }
}

const currentUserId = ref(getCurrentUserId())

// Helper functions to determine if challenge is finished
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

// Challenges are already filtered by the backend, so use them directly
const filteredChallenges = computed(() => {
  return challenges.value
})

// Separate active and finished challenges
const activeChallenges = computed(() => {
  return filteredChallenges.value.filter(challenge => !isChallengeFinished(challenge))
})

const finishedChallenges = computed(() => {
  return filteredChallenges.value.filter(challenge => isChallengeFinished(challenge))
})

const totalChallenges = computed(() => {
  return challenges.value.length
})

const selectedIsOwner = computed(() => {
  if (!selectedChallenge.value || !currentUserId.value) return false
  const ownerId = selectedChallenge.value.owner?._id || selectedChallenge.value.owner
  return ownerId && ownerId.toString() === currentUserId.value.toString()
})

const selectedIsParticipant = computed(() => {
  if (!selectedChallenge.value || !currentUserId.value) return false
  return (selectedChallenge.value.participants || []).some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
})

const leavingId = ref(null)
const joiningId = ref(null)
const watchingId = ref(null)
const watchedChallenges = ref([])

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

function isChallengeOwner(owner) {
  if (!currentUserId.value || !owner) return false
  const ownerId = owner._id || owner
  return ownerId && ownerId.toString() === currentUserId.value.toString()
}

const fetchChallenges = async () => {
  if (!currentUserId.value) {
    error.value = t('users.userNotFound')
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Get current user's challenges
    const { data } = await challengeService.getChallengesByUser(currentUserId.value, {
      excludePrivate: false // Include private challenges for own profile
    })
    challenges.value = data?.challenges || []
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.apiError')
  } finally {
    loading.value = false
  }
}

const handleChallengeClick = (challenge) => {
  // If user owns the challenge, navigate to edit page
  if (isChallengeOwner(challenge.owner)) {
    router.push(`/challenges/edit/${challenge._id}`)
    return
  }
  
  // Otherwise open details dialog
  selectedChallenge.value = challenge
  detailsDialogOpen.value = true
}

async function joinChallenge(challenge) {
  if (!currentUserId.value) {
    error.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    error.value = t('notifications.joinError')
    return
  }

  joiningId.value = challenge._id
  error.value = ''

  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh challenges list
    await fetchChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (err) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.joinError')
  } finally {
    joiningId.value = null
  }
}

async function leaveChallenge(challenge) {
  if (!currentUserId.value) {
    error.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    error.value = t('notifications.joinError')
    return
  }

  leavingId.value = challenge._id
  error.value = ''

  try {
    await challengeService.leaveChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh challenges list
    await fetchChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (err) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.joinError')
  } finally {
    leavingId.value = null
  }
}

function isWatched(challenge) {
  if (!challenge || !currentUserId.value) return false
  const challengeId = challenge._id?.toString()
  if (!challengeId) return false
  return watchedChallenges.value.some(id => id.toString() === challengeId)
}

async function loadWatchedChallenges() {
  if (!currentUserId.value) return
  
  try {
    const { data } = await challengeService.getWatchedChallenges()
    watchedChallenges.value = (data?.challenges || []).map(c => (c._id?.toString() || c._id))
  } catch (err) {
    console.error('Error loading watched challenges:', err)
  }
}

async function watchChallenge(challenge) {
  if (!currentUserId.value) {
    error.value = t('notifications.mustLogin')
    return
  }

  watchingId.value = challenge._id
  error.value = ''

  // Optimistic update
  const challengeId = challenge._id.toString()
  if (!watchedChallenges.value.includes(challengeId)) {
    watchedChallenges.value.push(challengeId)
  }

  try {
    await challengeService.watchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (err) {
    // Revert optimistic update on error
    const index = watchedChallenges.value.indexOf(challengeId)
    if (index > -1) {
      watchedChallenges.value.splice(index, 1)
    }
    error.value = err.response?.data?.message || t('challenges.watchError')
  } finally {
    watchingId.value = null
  }
}

async function unwatchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  error.value = ''

  // Optimistic update
  const challengeId = challenge._id.toString()
  const index = watchedChallenges.value.indexOf(challengeId)
  if (index > -1) {
    watchedChallenges.value.splice(index, 1)
  }

  try {
    await challengeService.unwatchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (err) {
    // Revert optimistic update on error
    if (!watchedChallenges.value.includes(challengeId)) {
      watchedChallenges.value.push(challengeId)
    }
    error.value = err.response?.data?.message || t('challenges.watchError')
  } finally {
    watchingId.value = null
  }
}

async function handleDialogLeave() {
  if (!selectedChallenge.value) return
  await leaveChallenge(selectedChallenge.value)
}

const handleDialogUpdate = async () => {
  // Refresh challenges when participant updates their completedDays
  await fetchChallenges()
  await loadWatchedChallenges()
  // Also refresh the selected challenge if dialog is open
  if (selectedChallenge.value) {
    const updatedChallenge = challenges.value.find(c => c._id === selectedChallenge.value._id)
    if (updatedChallenge) {
      selectedChallenge.value = updatedChallenge
    }
  }
}

function handleOwnerNavigated() {
  // Close dialog when owner is navigated
  detailsDialogOpen.value = false
}

onMounted(() => {
  fetchChallenges()
  loadWatchedChallenges()
})
</script>

<style scoped>
.my-challenges {
  width: 100%;
  padding: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
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
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 16px 0;
  }
}

@media (min-width: 960px) {
  .challenges-grid {
    grid-template-columns: repeat(3, 1fr);
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

.finished-section {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  padding-top: 24px;
  margin-top: 24px;
}
</style>
