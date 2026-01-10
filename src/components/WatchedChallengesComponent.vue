<template>
  <div class="watched-challenges">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('challenges.watchedListTitle') }}</h1>

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
          {{ t('challenges.noWatchedChallenges') }}
        </v-alert>

        <div v-else class="challenges-grid">
          <ChallengeCard
            v-for="challenge in challenges"
            :key="challenge._id"
            :challenge="challenge"
            :current-user-id="currentUserId"
            :show-join-button="true"
            :joining-id="joiningId"
            :watching-id="watchingId"
            :is-watched="true"
            @click="openDetails"
            @join="joinChallenge"
            @watch="watchChallenge"
            @unwatch="unwatchChallenge"
            @owner-navigated="handleOwnerNavigated"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import ChallengeCard from './ChallengeCard.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUserId = ref(getCurrentUserId())
const joiningId = ref(null)
const watchingId = ref(null)

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const saveLoading = ref(false)
const saveError = ref('')
const deleteLoading = ref(false)
const { t } = useI18n()

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
  
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    !selectedIsParticipant.value
  )
})

function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return user.id || user._id || null
  } catch {
    return null
  }
}

function isChallengeOwner(owner) {
  if (!owner || !currentUserId.value) return false
  const ownerId = owner._id || owner
  return ownerId.toString() === currentUserId.value.toString()
}

function isParticipant(challenge) {
  if (!challenge.participants || !currentUserId.value) return false
  return challenge.participants.some(participant => {
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

async function loadWatchedChallenges() {
  if (!currentUserId.value) {
    errorMessage.value = t('challenges.loginPrompt')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getWatchedChallenges(currentUserId.value)
    challenges.value = data.challenges || []
  } catch (error) {
    console.error('Error loading watched challenges:', error)
    errorMessage.value = error.response?.data?.message || t('challenges.loadError')
  } finally {
    loading.value = false
  }
}

async function joinChallenge(challenge) {
  if (!currentUserId.value) return

  joiningId.value = challenge._id
  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    await loadWatchedChallenges()
    if (detailsDialogOpen.value && selectedChallenge.value?._id === challenge._id) {
      await handleDialogUpdate()
    }
  } catch (error) {
    console.error('Error joining challenge:', error)
    alert(error.response?.data?.message || t('challenges.joinError'))
  } finally {
    joiningId.value = null
  }
}

async function watchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  try {
    await challengeService.watchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    console.error('Error watching challenge:', error)
    alert(error.response?.data?.message || t('challenges.watchError'))
  } finally {
    watchingId.value = null
  }
}

async function unwatchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  try {
    await challengeService.unwatchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
    if (detailsDialogOpen.value && selectedChallenge.value?._id === challenge._id) {
      detailsDialogOpen.value = false
    }
  } catch (error) {
    console.error('Error unwatching challenge:', error)
    alert(error.response?.data?.message || t('challenges.unwatchError'))
  } finally {
    watchingId.value = null
  }
}

function openDetails(challenge) {
  selectedChallenge.value = challenge
  detailsDialogOpen.value = true
}

function handleOwnerNavigated() {
  // Close dialog when owner is navigated
  detailsDialogOpen.value = false
}

async function handleDialogSave() {
  // Not implemented for watched challenges
}

async function handleDialogJoin(challenge) {
  await joinChallenge(challenge)
}

async function handleDialogDelete() {
  // Not implemented for watched challenges
}

async function handleDialogUpdate() {
  if (!selectedChallenge.value) return
  try {
    const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
    selectedChallenge.value = data
    // Update in challenges list
    const index = challenges.value.findIndex(c => c._id === data._id)
    if (index !== -1) {
      challenges.value[index] = data
    }
  } catch (error) {
    console.error('Error updating challenge:', error)
  }
}

onMounted(() => {
  loadWatchedChallenges()
})
</script>

<style scoped>
.watched-challenges {
  width: 100%;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 16px 0;
}

@media (max-width: 600px) {
  .challenges-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>

