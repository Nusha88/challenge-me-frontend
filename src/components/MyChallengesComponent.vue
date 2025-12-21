<template>
  <div class="my-challenges">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('challenges.myListTitle') }}</h1>

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-alert v-else-if="!isLoggedIn" type="info">
          {{ t('challenges.loginPrompt') }}
        </v-alert>

        <v-alert v-else-if="!challenges.length && !loading" type="info">
          {{ t('challenges.noMyChallenges') }}
        </v-alert>

        <div v-else class="challenges-grid">
          <v-card
            v-for="challenge in challenges"
            :key="challenge._id"
            class="challenge-card"
            :class="{ 
              'owner-challenge': isChallengeOwner(challenge.owner),
              'finished-challenge': isChallengeEnded(challenge)
            }"
            @click="openDetails(challenge)"
          >
            <div v-if="isChallengeUpcoming(challenge)" class="upcoming-badge">
              {{ t('challenges.upcoming') }}
            </div>
            <!-- Header with image and title -->
            <div class="challenge-header">
              <div class="challenge-image-container">
                <img
                  v-if="challenge.imageUrl"
                  :src="challenge.imageUrl"
                  :alt="challenge.title"
                  class="challenge-image"
                />
                <v-icon
                  v-else
                  size="48"
                  color="grey-lighten-1"
                  class="challenge-image-placeholder"
                >
                  mdi-image-outline
                </v-icon>
              </div>
              <div class="challenge-header-content">
                <span class="text-h6 mb-1">{{ challenge.title }}</span>
                <div class="challenge-duration text-caption text-medium-emphasis mb-1">
                  {{ formatDateRange(challenge.startDate, challenge.endDate) }}
                </div>
                <v-chip
                  v-if="challenge.challengeType"
                  :color="challenge.challengeType === 'habit' ? 'success' : 'warning'"
                  size="small"
                  class="challenge-type-chip"
                >
                  {{ challenge.challengeType === 'habit' ? t('challenges.typeHabit') : t('challenges.typeResult') }}
                </v-chip>
              </div>
            </div>
            
            <v-card-text class="flex-grow-1 pt-3">
              <p class="mb-3 text-body-2">{{ challenge.description }}</p>
              
              <v-card-subtitle v-if="challenge.owner" class="mb-2 pa-0">
                <template v-if="isChallengeOwner(challenge.owner)">
                  {{ t('challenges.createdByMe') }}
                </template>
                <template v-else>
                  {{ t('challenges.createdBy', { name: challenge.owner.name || t('common.unknown') }) }}
                </template>
              </v-card-subtitle>
              
              <v-chip-group column class="mb-2">
                <v-chip
                  v-for="participant in challenge.participants"
                  :key="participant.userId?._id || participant.userId || participant._id || participant"
                  size="small"
                  class="mr-1"
                >
                  {{ (participant.userId?.name || participant.name) || t('common.unknown') }}
                </v-chip>
              </v-chip-group>
            </v-card-text>
            
            <!-- Progress Bar - Stuck to bottom -->
            <div v-if="challenge.challengeType" class="progress-bar-container">
              <div class="d-flex justify-space-between mb-1 px-4">
                <span class="text-caption">
                  <template v-if="challenge.challengeType === 'result'">
                    {{ t('challenges.progressActions', { done: calculateProgressDone(challenge), total: calculateProgressTotal(challenge) }) }}
                  </template>
                  <template v-else>
                    {{ t('challenges.progressDays', { passed: calculateProgressDone(challenge), total: calculateProgressTotal(challenge) }) }}
                  </template>
                </span>
                <span class="text-caption font-weight-medium">{{ calculateProgressPercentage(challenge) }}%</span>
              </div>
              <v-progress-linear
                :model-value="calculateProgressPercentage(challenge)"
                color="primary"
                height="6"
                rounded
                class="mx-0"
              ></v-progress-linear>
            </div>
          </v-card>
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
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import { useI18n } from 'vue-i18n'

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUserId = ref(getCurrentUserId())

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

.challenge-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.upcoming-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 0 0 0 4px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(31, 160, 246, 0.3);
  white-space: nowrap;
}

.challenge-card.owner-challenge {
  background: linear-gradient(135deg, rgba(31, 160, 246, 0.12) 0%, rgba(166, 46, 232, 0.12) 100%);
}

.challenge-card.finished-challenge {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.06) 100%);
}

.challenge-card.finished-challenge.owner-challenge {
  background: linear-gradient(135deg, 
    rgba(31, 160, 246, 0.06) 0%, 
    rgba(166, 46, 232, 0.06) 50%,
    rgba(0, 0, 0, 0.04) 100%);
}

.challenge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.challenge-card.owner-challenge:hover {
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.3);
}

.challenge-header {
  display: flex;
  gap: 12px;
  padding: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

@media (min-width: 600px) {
  .challenge-header {
    gap: 16px;
    padding: 16px;
  }
}

.challenge-image-container {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 600px) {
  .challenge-image-container {
    width: 80px;
    height: 80px;
  }
}

.challenge-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.challenge-image-placeholder {
  opacity: 0.5;
}

.challenge-header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
}

.challenge-duration {
  margin-top: 4px;
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

.progress-bar-container {
  margin-top: auto;
  padding-bottom: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.progress-bar-container :deep(.v-progress-linear__determinate) {
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
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
