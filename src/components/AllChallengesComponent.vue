<template>
  <div class="all-challenges">
    <h1 class="mb-6">{{ t('challenges.listTitle') }}</h1>

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-alert v-else-if="!challenges.length && !loading" type="info">
          {{ t('challenges.noChallenges') }}
        </v-alert>

        <div v-else class="challenges-grid">
          <v-card
            v-for="challenge in challenges"
            :key="challenge._id"
            class="challenge-card"
            @click="openDetails(challenge)"
          >
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-h6">{{ challenge.title }}</span>
              <v-chip
                v-if="isChallengeOwner(challenge.owner)"
                color="secondary"
                size="small"
              >
                {{ t('challenges.mineBadge') }}
              </v-chip>
            </v-card-title>
            
            <v-card-subtitle class="mb-2">
              {{ formatDateRange(challenge.startDate, challenge.endDate) }}
            </v-card-subtitle>
            
            <v-card-subtitle v-if="challenge.owner" class="mb-2">
              {{ t('challenges.createdBy', { name: challenge.owner.name || t('common.unknown') }) }}
            </v-card-subtitle>
            
            <v-card-text class="flex-grow-1">
              <p class="mb-3 text-body-2">{{ challenge.description }}</p>
              
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
            
            <v-card-actions>
              <v-btn
                v-if="canJoin(challenge)"
                color="primary"
                size="small"
                variant="flat"
                :loading="joiningId === challenge._id"
                @click.stop="joinChallenge(challenge)"
              >
                {{ t('challenges.join') }}
              </v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
            
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
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import { useI18n } from 'vue-i18n'

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const currentUserId = ref(getCurrentUserId())
const joiningId = ref(null)

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
  return (
    !!selectedChallenge.value &&
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
    ? t('challenges.dateRange', { start: startFormatted, end: endFormatted })
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

function canJoin(challenge) {
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
    detailsDialogOpen.value = false
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.updateError')
  } finally {
    saveLoading.value = false
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
.all-challenges {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

.challenges-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 16px 0;
}

.challenge-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.challenge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.progress-bar-container {
  margin-top: auto;
  padding-bottom: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

@media (min-width: 600px) {
  .challenges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .challenges-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
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
