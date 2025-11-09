<template>
  <div class="my-challenges">
    <h1 class="mb-6">My Challenges</h1>

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-alert v-else-if="!isLoggedIn" type="info">
          Please log in to view your challenges.
        </v-alert>

        <v-alert v-else-if="!challenges.length && !loading" type="info">
          You haven't created any challenges yet.
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
              <p class="mb-0">{{ challenge.description }}</p>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon color="primary" @click="openEditDialog(challenge)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-title>Edit Challenge</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleEditSubmit">
            <v-text-field
              v-model="editForm.title"
              label="Title"
              variant="outlined"
              required
              class="mb-4"
              :error-messages="editErrors.title"
            ></v-text-field>

            <v-textarea
              v-model="editForm.description"
              label="Description"
              variant="outlined"
              rows="5"
              required
              class="mb-4"
              :error-messages="editErrors.description"
            ></v-textarea>

            <div class="date-pickers mb-4">
              <v-menu
                v-model="editStartMenu"
                :close-on-content-click="false"
                max-width="290px"
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    :model-value="formatDisplayDate(editForm.startDate)"
                    label="Start Date"
                    variant="outlined"
                    readonly
                    v-bind="props"
                    :error-messages="editErrors.startDate"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="editStartTemp"
                  @update:modelValue="val => onSelectEditStart(val)"
                ></v-date-picker>
              </v-menu>

              <v-menu
                v-model="editEndMenu"
                :close-on-content-click="false"
                max-width="290px"
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    :model-value="formatDisplayDate(editForm.endDate)"
                    label="End Date"
                    variant="outlined"
                    readonly
                    v-bind="props"
                    :error-messages="editErrors.endDate"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="editEndTemp"
                  @update:modelValue="val => onSelectEditEnd(val)"
                ></v-date-picker>
              </v-menu>
            </div>

            <v-alert v-if="editErrorMessage" type="error" class="mb-4">
              {{ editErrorMessage }}
            </v-alert>

            <v-card-actions class="px-0">
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="closeEditDialog" :disabled="editLoading">
                Cancel
              </v-btn>
              <v-btn type="submit" color="primary" :loading="editLoading" :disabled="editLoading">
                Save
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { challengeService } from '../services/api'

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))

const editDialog = ref(false)
const editForm = ref({ title: '', description: '', startDate: '', endDate: '' })
const editErrors = ref({})
const editErrorMessage = ref('')
const editLoading = ref(false)
const activeChallengeId = ref(null)
const editStartMenu = ref(false)
const editEndMenu = ref(false)
const editStartTemp = ref('')
const editEndTemp = ref('')

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

function formatDisplayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function onSelectEditStart(val) {
  editStartTemp.value = val
  editForm.value.startDate = val
  editStartMenu.value = false
}

function onSelectEditEnd(val) {
  editEndTemp.value = val
  editForm.value.endDate = val
  editEndMenu.value = false
}

async function fetchChallenges() {
  const userId = getCurrentUserId()
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
    errorMessage.value = error.response?.data?.message || 'Failed to load challenges'
  } finally {
    loading.value = false
  }
}

function openEditDialog(challenge) {
  activeChallengeId.value = challenge._id
  editForm.value = {
    title: challenge.title,
    description: challenge.description,
    startDate: challenge.startDate?.slice(0, 10) || '',
    endDate: challenge.endDate?.slice(0, 10) || ''
  }
  editErrors.value = {}
  editErrorMessage.value = ''
  editDialog.value = true
}

function closeEditDialog() {
  editDialog.value = false
  activeChallengeId.value = null
}

function validateEdit() {
  const validationErrors = {}

  if (!editForm.value.title) {
    validationErrors.title = 'Title is required'
  }

  if (!editForm.value.description) {
    validationErrors.description = 'Description is required'
  }

  if (!editForm.value.startDate) {
    validationErrors.startDate = 'Start date is required'
  }

  if (!editForm.value.endDate) {
    validationErrors.endDate = 'End date is required'
  }

  if (editForm.value.startDate && editForm.value.endDate) {
    if (new Date(editForm.value.startDate) > new Date(editForm.value.endDate)) {
      validationErrors.endDate = 'End date must be after start date'
    }
  }

  editErrors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

async function handleEditSubmit() {
  if (!validateEdit()) return

  if (!activeChallengeId.value) return

  editLoading.value = true
  editErrorMessage.value = ''

  try {
    await challengeService.updateChallenge(activeChallengeId.value, {
      ...editForm.value
    })
    editDialog.value = false
    await fetchChallenges()
  } catch (error) {
    editErrorMessage.value = error.response?.data?.message || 'Failed to update challenge'
  } finally {
    editLoading.value = false
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
