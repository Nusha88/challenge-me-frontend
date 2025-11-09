<template>
  <div class="all-challenges">
    <h1 class="mb-6">All Challenges</h1>

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-alert v-else-if="!challenges.length && !loading" type="info">
          No challenges have been created yet.
        </v-alert>

        <v-list v-else>
          <v-list-item
            v-for="challenge in challenges"
            :key="challenge._id"
            class="challenge-item"
          >
            <v-list-item-content>
              <v-list-item-title class="text-h6">{{ challenge.title }}</v-list-item-title>
              <v-list-item-subtitle class="mb-1">
                {{ formatDateRange(challenge.startDate, challenge.endDate) }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="challenge.owner" class="mb-2">
                Created by {{ challenge.owner.name || 'Unknown user' }}
              </v-list-item-subtitle>
              <p class="mb-0">{{ challenge.description }}</p>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { challengeService } from '../services/api'

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDateRange(start, end) {
  const startFormatted = formatDate(start)
  const endFormatted = formatDate(end)
  return startFormatted && endFormatted
    ? `From ${startFormatted} to ${endFormatted}`
    : startFormatted || endFormatted || ''
}

async function fetchChallenges() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getAllChallenges()
    challenges.value = data?.challenges || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to load challenges'
  } finally {
    loading.value = false
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
</style>
