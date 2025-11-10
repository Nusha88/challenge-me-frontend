<template>
  <div class="my-challenges">
    <h1 class="mb-6">{{ t('challenges.myListTitle') }}</h1>

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
                <v-chip
                  v-else
                  color="primary"
                  variant="outlined"
                  size="small"
                  class="ml-2"
                >
                  {{ t('challenges.joinedBadge') }}
                </v-chip>
              </div>
              <v-list-item-subtitle class="mb-1">
                {{ formatDateRange(challenge.startDate, challenge.endDate) }}
              </v-list-item-subtitle>
              <p class="mb-0">{{ challenge.description }}</p>
            </v-list-item-content>
          </v-list-item>
        </v-list>
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
      @save="handleDialogSave"
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
const { t, locale } = useI18n()

const selectedIsOwner = computed(() => {
  if (!selectedChallenge.value) return false
  return isChallengeOwner(selectedChallenge.value.owner)
})

const selectedIsParticipant = computed(() => {
  if (!selectedChallenge.value) return false
  return (selectedChallenge.value.participants || []).some(participant => {
    const id = participant._id || participant
    return id === currentUserId.value
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
    ? t('challenges.dateRange', { start: startFormatted, end: endFormatted })
    : startFormatted || endFormatted || ''
}

function isChallengeOwner(owner) {
  if (!owner) return false
  if (!currentUserId.value) return false
  const ownerId = owner._id || owner
  return ownerId === currentUserId.value
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
    detailsDialogOpen.value = false
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.updateError')
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  fetchChallenges()
})
</script>

<style scoped>
.my-challenges {
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
