<template>
  <div class="add-challenge">
    <div class="header-section">
      <div class="header-content">
        <h1 class="page-header">{{ t('challenges.addTitle') }}</h1>
        <p class="text-subtitle-1 motive-text">{{ t('challenges.motiveText') }}</p>
      </div>
      <img :src="treeImage" alt="Tree" class="tree-image" />
    </div>
    <div class="form-container">
      <v-form @submit.prevent="handleSubmit">
          <div class="challenge-type-section mb-4">
            <div class="challenge-type-grid">
              <div
                class="type-card habit-style"
                :class="{ 'is-active': form.challengeType === 'habit' }"
                @click="selectChallengeType('habit')"
              >
                <div class="type-card-content">
                  <div class="icon-box">
                    <v-icon size="32">mdi-sync</v-icon>
                  </div>
                  <div class="text-block">
                    <h3 class="type-title">{{ t('challenges.typeHabit') }}</h3>
                    <p class="type-description">{{ t('challenges.typeHabitDescription') }}</p>
                  </div>
                  <div class="selection-indicator">
                    <v-icon v-if="form.challengeType === 'habit'">mdi-check-circle</v-icon>
                    <div v-else class="empty-circle"></div>
                  </div>
                </div>
              </div>

              <div
                class="type-card result-style"
                :class="{ 'is-active': form.challengeType === 'result' }"
                @click="selectChallengeType('result')"
              >
                <div class="type-card-content">
                  <div class="icon-box">
                    <v-icon size="32">mdi-medal-outline</v-icon>
                  </div>
                  <div class="text-block">
                    <h3 class="type-title">{{ t('challenges.typeResult') }}</h3>
                    <p class="type-description">{{ t('challenges.typeResultDescription') }}</p>
                  </div>
                  <div class="selection-indicator">
                    <v-icon v-if="form.challengeType === 'result'">mdi-check-circle</v-icon>
                    <div v-else class="empty-circle"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <v-row>
            <v-col cols="12" md="8">
              <div class="form-fields-wrapper">
                <label class="field-label">{{ t('challenges.title') }}</label>
                <v-text-field
                  v-model="form.title"
                  variant="outlined"
                  required
                  class="mb-4"
                  :error-messages="errors.title"
                ></v-text-field>

                <label class="field-label">{{ t('challenges.description') }}</label>
                <v-textarea
                  v-model="form.description"
                  variant="outlined"
                  rows="5"
                  required
                  class="mb-4"
                  :error-messages="errors.description"
                ></v-textarea>

                <div class="duration-selector">
                  <p class="field-label">{{ t('challenges.duration') }}</p>
                  <div class="duration-toggle-wrapper">
                    <v-btn-toggle
                      v-model="form.duration"
                      mandatory
                      class="custom-chips-group"
                    >
                      <v-btn value="7" class="chip-btn">
                        <span>7 days</span>
                      </v-btn>
                      <v-btn value="21" class="chip-btn">
                        <v-icon left size="18">mdi-fire</v-icon>
                        <span>21 days</span>
                      </v-btn>
                      <v-btn value="30" class="chip-btn">
                        <span>30 days</span>
                      </v-btn>
                      <v-btn value="custom" class="chip-btn custom-choice" @click="toggleCustomSlider">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </v-btn-toggle>
                  </div>
                  <div v-if="form.duration === 'custom' && showSlider" class="custom-slider-container">
                    <div class="days-display">{{ customDays }} days</div>
                    <v-slider
                      v-model="customDays"
                      min="1"
                      max="365"
                      step="1"
                      hide-details
                      class="ignite-slider"
                    ></v-slider>
                  </div>
                </div>

                <ChallengeImageUpload
                  v-model="form.imageUrl"
                  :editable="true"
                />

                <div class="selects-grid mb-4">

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

                <!-- Allow Comments Switcher -->
                <div class="mb-4">
                  <v-switch
                    v-model="form.allowComments"
                    :label="t('challenges.allowComments')"
                    color="primary"
                    hide-details
                  ></v-switch>
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
              </div>
            </v-col>
          </v-row>
        </v-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'
import treeImage from '../assets/tree.png'

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
  actions: [{ text: '', checked: false, children: [] }],
  allowComments: true
})

const showSlider = ref(false)
const customDays = ref(60)

// Toggle slider when custom button is clicked
function toggleCustomSlider() {
  if (form.value.duration === 'custom') {
    showSlider.value = !showSlider.value
    if (showSlider.value) {
      if (!form.value.customDuration) {
        customDays.value = 60
        form.value.customDuration = '60'
      } else {
        customDays.value = parseInt(form.value.customDuration) || 60
      }
    }
  }
}

// Watch for custom duration selection (when switching away from custom)
watch(() => form.value.duration, (newVal) => {
  if (newVal !== 'custom') {
    showSlider.value = false
    form.value.customDuration = ''
  }
})

// Sync customDays with form.customDuration
watch(customDays, (newVal) => {
  form.value.customDuration = String(newVal)
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
      challengeType: form.value.challengeType || 'habit',
      allowComments: form.value.allowComments !== undefined ? form.value.allowComments : true
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
    router.push('/missions/my')
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2em 1em;
  position: relative;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  position: relative;
}

.header-content {
  flex: 1;
}

.tree-image {
  width: 360px;
  height: auto;
  object-fit: contain;
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.6;
  z-index: 1;
}

@media (max-width: 960px) {
  .tree-image {
    width: 240px;
    opacity: 0.4;
  }
}

@media (max-width: 600px) {
  .tree-image {
    width: 180px;
    opacity: 0.3;
  }
}

.page-header {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -1px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #1A1A2E 0%, #7E46C4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.motive-text {
  color: #64748b;
  font-style: italic;
  opacity: 0.8;
  border-left: 3px solid #7e46c4;
  padding-left: 15px;
  margin-top: 8px;
  margin-bottom: 40px;
}

.form-container {
  width: 100%;
}

.form-fields-wrapper {
  width: 100%;
}

.field-label {
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
  margin-top: 16px;
}

.field-label:first-child {
  margin-top: 0;
}

.duration-selector {
  margin: 24px 0;
}

.duration-selector .field-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.duration-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.custom-chips-group {
  display: flex;
  gap: 12px;
  background: transparent !important;
  flex-wrap: wrap;
}


.custom-chips-group .chip-btn {
  border: 2px solid #f1f1f4 !important;
  background-color: #ffffff !important;
  border-radius: 12px !important;
  height: 48px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  color: #64748b !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  padding: 0 20px !important;
  box-shadow: none !important;
}

.custom-chips-group .chip-btn:hover:not(.v-btn--active) {
  border-color: #e2e8f0 !important;
  background-color: #f8fafc !important;
  transform: translateY(-2px);
}

.custom-chips-group .chip-btn.v-btn--active {
  border-color: #7e46c4 !important;
  background: linear-gradient(135deg, #7e46c4 0%, #6b39a8 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(126, 70, 196, 0.3) !important;
}

.custom-chips-group .chip-btn.v-btn--active .v-icon {
  color: #ffffff !important;
}

.custom-chips-group .chip-btn .v-icon {
  color: #f4a782;
  margin-right: 6px;
}

.custom-chips-group .custom-choice {
  min-width: 50px !important;
  padding: 0 !important;
}

.custom-slider-container {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 15px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  animation: fadeIn 0.3s ease;
}

.custom-slider-container .days-display {
  min-width: 80px;
  font-weight: 800;
  color: #7e46c4;
  font-size: 1.2rem;
  text-align: center;
  border-right: 2px solid #e2e8f0;
  padding-right: 15px;
}

.custom-slider-container .ignite-slider {
  flex-grow: 1;
}

.custom-slider-container .ignite-slider :deep(.v-slider-track__fill) {
  background: linear-gradient(90deg, #7e46c4, #f4a782) !important;
}

.custom-slider-container .ignite-slider :deep(.v-slider-thumb) {
  color: #7e46c4 !important;
  border: 3px solid white !important;
  box-shadow: 0 4px 10px rgba(126, 70, 196, 0.3) !important;
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
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

.challenge-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 960px) {
  .challenge-type-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .challenge-type-grid {
    grid-template-columns: 1fr;
  }
}

.type-card {
  position: relative;
  cursor: pointer;
  background: #ffffff;
  border: 2px solid #f1f1f4;
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.type-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.type-card .icon-box {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
  color: #94a3b8;
}

.type-card .type-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-card .type-description {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
}

.type-card .selection-indicator {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.type-card .selection-indicator .empty-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
}

.type-card .selection-indicator .v-icon {
  font-size: 26px;
}

/* ЭФФЕКТЫ ПРИ ВЫБОРЕ (Habit - Purple) */
.type-card.habit-style.is-active {
  border-color: #7e46c4;
  background: linear-gradient(135deg, #ffffff 0%, #f9f5ff 100%);
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.15);
}

.type-card.habit-style.is-active .icon-box {
  background: #7e46c4;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(126, 70, 196, 0.3);
}

.type-card.habit-style.is-active .selection-indicator .v-icon {
  color: #7e46c4;
}

/* ЭФФЕКТЫ ПРИ ВЫБОРЕ (Result - Orange) */
.type-card.result-style.is-active {
  border-color: #f4a782;
  background: linear-gradient(135deg, #ffffff 0%, #fffaf5 100%);
  box-shadow: 0 10px 25px rgba(244, 167, 130, 0.15);
}

.type-card.result-style.is-active .icon-box {
  background: #f4a782;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(244, 167, 130, 0.3);
}

.type-card.result-style.is-active .selection-indicator .v-icon {
  color: #f4a782;
}

/* Ховер эффект */
.type-card:hover:not(.is-active) {
  transform: translateY(-4px);
  border-color: #e2e8f0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
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
