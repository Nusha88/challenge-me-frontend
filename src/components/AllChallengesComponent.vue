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

        <v-list v-else>
          <v-list-item
            v-for="challenge in challenges"
            :key="challenge._id"
            class="challenge-item"
            @click="openDetails(challenge)"
          >
            <v-list-item-content>
              <div class="item-header">
                <v-list-item-title class="text-h6">{{ challenge.title }}</v-list-item-title>
                <v-chip
                  v-if="isChallengeOwner(challenge.owner)"
                  color="secondary"
                  size="small"
                  class="ml-2"
                >
                  {{ t('challenges.mineBadge') }}
                </v-chip>
              </div>
              <v-list-item-subtitle class="mb-1">
                {{ formatDateRange(challenge.startDate, challenge.endDate) }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="challenge.owner" class="mb-2">
                {{ t('challenges.createdBy', { name: challenge.owner.name || t('common.unknown') }) }}
              </v-list-item-subtitle>
              <p class="mb-2">{{ challenge.description }}</p>
              <v-chip-group column class="mb-2">
                <v-chip
                  v-for="participant in challenge.participants"
                  :key="participant._id || participant"
                  size="small"
                  class="mr-1"
                >
                  {{ participant.name || t('common.unknown') }}
                </v-chip>
              </v-chip-group>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn
                v-if="canJoin(challenge)"
                color="primary"
                size="small"
                :loading="joiningId === challenge._id"
                @click.stop="joinChallenge(challenge)"
              >
                {{ t('challenges.join') }}
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
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
    const id = participant._id || participant
    return id === currentUserId.value
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

onMounted(() => {
  fetchChallenges()
})
</script>

<style scoped>
.all-challenges {
  max-width: 800px;
  margin: 0 auto;
}

.challenge-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.challenge-item:last-child {
  border-bottom: none;
}

.item-header {
  display: flex;
  align-items: center;
}

.item-header .ml-2 {
  margin-left: 8px;
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
