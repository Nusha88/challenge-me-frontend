<template>
  <div class="add-challenge">
    <h1 class="mb-6">{{ t('challenges.addTitle') }}</h1>
    <v-card>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <div class="challenge-type-section mb-4">
            <label class="text-body-2 mb-2 d-block">{{ t('challenges.challengeType') }}</label>
            <div class="challenge-type-cards">
              <v-card
                class="challenge-type-card"
                :class="{ 'selected': form.challengeType === 'habit' }"
                @click="selectChallengeType('habit')"
              >
                <v-card-title class="text-h6">
                  <v-icon class="mr-2">mdi-repeat</v-icon>
                  {{ t('challenges.typeHabit') }}
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2">{{ t('challenges.typeHabitDescription') }}</p>
                </v-card-text>
                <v-card-actions>
                  <v-radio
                    :model-value="form.challengeType === 'habit'"
                    @click.stop="selectChallengeType('habit')"
                  ></v-radio>
                </v-card-actions>
              </v-card>

              <v-card
                class="challenge-type-card"
                :class="{ 'selected': form.challengeType === 'result' }"
                @click="selectChallengeType('result')"
              >
                <v-card-title class="text-h6">
                  <v-icon class="mr-2">mdi-target</v-icon>
                  {{ t('challenges.typeResult') }}
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2">{{ t('challenges.typeResultDescription') }}</p>
                </v-card-text>
                <v-card-actions>
                  <v-radio
                    :model-value="form.challengeType === 'result'"
                    @click.stop="selectChallengeType('result')"
                  ></v-radio>
                </v-card-actions>
              </v-card>
            </div>
          </div>

          <v-text-field
            v-model="form.title"
            :label="t('challenges.title')"
            variant="outlined"
            required
            class="mb-4"
            :error-messages="errors.title"
          ></v-text-field>

          <v-textarea
            v-model="form.description"
            :label="t('challenges.description')"
            variant="outlined"
            rows="5"
            required
            class="mb-4"
            :error-messages="errors.description"
          ></v-textarea>

          <ChallengeImageUpload
            v-model="form.imageUrl"
            :editable="true"
          />

          <div class="selects-grid mb-4">
            <v-select
              v-model="form.duration"
              :items="durationOptions"
              :label="t('challenges.duration')"
              item-title="title"
              item-value="value"
              variant="outlined"
              :error-messages="errors.duration"
            ></v-select>

            <v-text-field
              v-if="form.duration === 'custom'"
              v-model="form.customDuration"
              :label="t('challenges.customDuration')"
              type="number"
              variant="outlined"
              :error-messages="errors.customDuration"
              :hint="t('challenges.customDurationHint')"
              persistent-hint
              min="1"
            ></v-text-field>

            <v-select
              v-model="form.startOption"
              :items="startOptions"
              :label="t('challenges.start')"
              item-title="title"
              item-value="value"
              variant="outlined"
              :error-messages="errors.startOption"
            ></v-select>

            <v-select
              v-if="form.challengeType === 'habit'"
              v-model="form.frequency"
              :items="frequencyOptions"
              :label="t('challenges.frequency')"
              item-title="title"
              item-value="value"
              variant="outlined"
              :error-messages="errors.frequency"
            ></v-select>

            <v-select
              v-model="form.privacy"
              :items="privacyOptions"
              :label="t('challenges.privacy')"
              item-title="title"
              item-value="value"
              variant="outlined"
            ></v-select>
          </div>

          <div class="actions-container" v-if="form.challengeType === 'result'">
            <ChallengeActions
              v-model="form.actions"
            />
          </div>

          <v-alert
            v-if="errorMessage"
            type="error"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <div class="create-button-wrapper">
            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="loading"
              :disabled="loading"
              class="create-button"
            >
              {{ t('challenges.create') }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'

const router = useRouter()
const { t, locale } = useI18n()

const form = ref({
  title: '',
  description: '',
  startDate: '',
  imageUrl: '',
  duration: '21',
  customDuration: '',
  privacy: 'public',
  challengeType: 'habit',
  frequency: 'daily',
  startOption: 'today',
  actions: [{ text: '', checked: false, children: [] }]
})

const durationOptions = computed(() => [
  { title: t('challenges.durationOptions.7days'), value: '7' },
  { title: t('challenges.durationOptions.14days'), value: '14' },
  { title: t('challenges.durationOptions.21days'), value: '21' },
  { title: t('challenges.durationOptions.30days'), value: '30' },
  { title: t('challenges.durationOptions.60days'), value: '60' },
  { title: t('challenges.durationOptions.90days'), value: '90' },
  { title: t('challenges.durationOptions.custom'), value: 'custom' }
])

const frequencyOptions = computed(() => [
  { title: t('challenges.frequencyOptions.daily'), value: 'daily' },
  { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' }
])

const startOptions = computed(() => [
  { title: t('challenges.startOptions.today'), value: 'today' },
  { title: t('challenges.startOptions.tomorrow'), value: 'tomorrow' }
])

const privacyOptions = computed(() => [
  { title: t('challenges.privacyOptions.public'), value: 'public' },
  { title: t('challenges.privacyOptions.private'), value: 'private' }
])

// Watch for startOption changes and update startDate
watch(() => form.value.startOption, (newValue) => {
  if (newValue) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (newValue === 'tomorrow') {
      today.setDate(today.getDate() + 1)
    }
    
    // Format date as YYYY-MM-DD without timezone conversion
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    form.value.startDate = `${year}-${month}-${day}`
  }
}, { immediate: true })
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

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

function selectChallengeType(type) {
  form.value.challengeType = type
  // Preselect duration based on type: habit -> 21 days, result -> 30 days
  if (type === 'habit') {
    form.value.duration = '21'
    form.value.startOption = 'today'
    form.value.frequency = 'daily' // Set default frequency for habit
    // startDate will be set automatically by the watcher
  } else if (type === 'result') {
    form.value.duration = '30'
    form.value.startOption = 'today'
    form.value.frequency = '' // Clear frequency for result challenges
    // startDate will be set automatically by the watcher
    // Initialize actions with default item if empty
    if (!form.value.actions || form.value.actions.length === 0) {
      form.value.actions = [{ text: '', checked: false, children: [] }]
    }
  }
  // Clear custom duration if it was set
  if (form.value.duration !== 'custom') {
    form.value.customDuration = ''
  }
}

function validate() {
  const validationErrors = {}

  if (!form.value.title) {
    validationErrors.title = t('validation.titleRequired')
  }

  if (!form.value.description) {
    validationErrors.description = t('validation.descriptionRequired')
  }

  if (!form.value.startOption) {
    validationErrors.startOption = t('validation.startOptionRequired')
  }

  if (form.value.duration === 'custom') {
    if (!form.value.customDuration || form.value.customDuration < 1) {
      validationErrors.customDuration = t('validation.customDurationRequired')
    }
  }

  if (form.value.challengeType === 'habit' && !form.value.frequency) {
    validationErrors.frequency = t('validation.frequencyRequired')
  }

  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

function formatDisplayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
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

function calculateStartDate() {
  // Use the startDate from form if it's already set (set by watcher)
  if (form.value.startDate) {
    return form.value.startDate
  }
  // Fallback calculation if startDate is not set
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (form.value.startOption === 'tomorrow') {
    today.setDate(today.getDate() + 1)
  }
  
  // Format date as YYYY-MM-DD without timezone conversion
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateEndDate() {
  // For both types, calculate end date from start date and duration
  const startDate = calculateStartDate()
  if (!startDate) return ''
  
  const start = new Date(startDate)
  const duration = form.value.duration === 'custom' 
    ? parseInt(form.value.customDuration) 
    : parseInt(form.value.duration)
  
  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + duration - 1)
  endDate.setHours(0, 0, 0, 0)
  
  // Format date as YYYY-MM-DD without timezone conversion
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function handleSubmit() {
  if (!validate()) return

  const userId = getCurrentUserId()
  if (!userId) {
    errorMessage.value = t('challenges.mustBeLoggedIn')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const startDate = calculateStartDate()
    const endDate = calculateEndDate()
    
    const challengeData = {
      title: form.value.title,
      description: form.value.description,
      startDate: startDate,
      endDate: endDate,
      owner: userId,
      privacy: form.value.privacy || 'public',
      challengeType: form.value.challengeType || 'habit'
    }
    
    if (form.value.imageUrl) {
      challengeData.imageUrl = form.value.imageUrl
    }
    
    // Only include frequency for habit challenges
    if (form.value.challengeType === 'habit') {
      if (form.value.frequency) {
        challengeData.frequency = form.value.frequency
      }
    }
    // Don't send frequency for result challenges (it will be null/undefined)
    
    // Only include actions for result challenges
    if (form.value.challengeType === 'result' && form.value.actions) {
      challengeData.actions = form.value.actions
    }

    await challengeService.createChallenge(challengeData)
    router.push('/challenges/my')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.createError')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-challenge {
  width: 100%;
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

.challenge-type-section {
  width: 100%;
}

.challenge-type-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.challenge-type-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  border-radius: 16px !important;
  background: linear-gradient(135deg, rgba(31, 160, 246, 0.08) 0%, rgba(166, 46, 232, 0.08) 100%);
}

.challenge-type-card:hover {
  border-color: #1FA0F6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(31, 160, 246, 0.2);
  background: linear-gradient(135deg, rgba(31, 160, 246, 0.15) 0%, rgba(166, 46, 232, 0.15) 100%);
}

.challenge-type-card.selected {
  position: relative;
  background: linear-gradient(135deg, rgba(31, 160, 246, 0.15) 0%, rgba(166, 46, 232, 0.15) 100%);
  border: none;
}

.challenge-type-card.selected::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  z-index: 0;
}

.challenge-type-card.selected :deep(.v-card-title),
.challenge-type-card.selected :deep(.v-card-text),
.challenge-type-card.selected :deep(.v-card-actions) {
  position: relative;
  z-index: 1;
}

.challenge-type-card .v-card-title {
  display: flex;
  align-items: center;
}

.challenge-type-card .v-card-actions {
  justify-content: flex-end;
  padding-top: 0;
}

.selects-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 960px) {
  .selects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .selects-grid {
    grid-template-columns: 1fr;
  }
}

.actions-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.actions-container > * {
  grid-column: 1 / 10; /* spans columns 1-9 (9 columns) */
}

@media (max-width: 960px) {
  .actions-container > * {
    grid-column: 1 / -1; /* full width on smaller screens */
  }
}

/* Rounder borders for input fields */
:deep(.v-field),
:deep(.v-field__outline),
:deep(.v-field__input) {
  border-radius: 16px !important;
}

:deep(.v-textarea .v-field),
:deep(.v-textarea .v-field__outline) {
  border-radius: 16px !important;
}

/* Rounder borders for actions block */
.actions-container :deep(.v-card) {
  border-radius: 16px !important;
}

/* Create button wrapper */
.create-button-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 1em;
}

/* Create button gradient styling */
.create-button {
  border-radius: 24px !important;
  background: linear-gradient(135deg, #1FA0F6 0%, #2196F3 100%) !important;
  color: white !important;
  font-weight: 600;
  padding: 16px 32px;
  padding-top: 16px;
  padding-bottom: 16px;
  height: auto;
  width: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.create-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.create-button:hover::before {
  left: 100%;
}

.create-button :deep(.v-btn__overlay) {
  background: linear-gradient(135deg, #1FA0F6 0%, #2196F3 100%) !important;
}

.create-button:hover {
  background: linear-gradient(135deg, #2196F3 0%, #1FA0F6 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.4);
}

.create-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(31, 160, 246, 0.3);
}

.create-button:disabled {
  opacity: 0.6;
}
</style>
