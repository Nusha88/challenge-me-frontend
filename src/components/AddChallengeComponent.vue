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
                <v-row class="mb-4">
                  <v-col cols="12" md="6">
                    <label class="field-label">{{ t('challenges.title') }}</label>
          <v-text-field
            v-model="form.title"
            variant="outlined"
            required
            :error-messages="errors.title"
                      :placeholder="titlePlaceholder"
                      :rules="[v => !!v || t('challenges.validation.titleRequired')]"
          ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center mt-2">
                    <v-btn
                      @click="showImageUpload = !showImageUpload"
                      :class="['cover-photo-toggle-btn', { 'active': showImageUpload }]"
                      variant="outlined"
                      block
                    >
                      <v-icon left>mdi-image</v-icon>
                      {{ coverMediaTitle }}
                    </v-btn>
                  </v-col>
                </v-row>
                
                <div v-if="showImageUpload" class="mb-4 mobile-upload-section">
                  <ChallengeImageUpload
                    v-model="form.imageUrl"
                    :editable="true"
                  />
                </div>

                <label class="field-label">{{ t('challenges.description') }}</label>
          <v-textarea
            v-model="form.description"
            variant="outlined"
            rows="5"
            class="mb-4"
            :error-messages="errors.description"
          ></v-textarea>

                <!-- Habit Form Section -->
                <template v-if="form.challengeType === 'habit'">
                  <div class="duration-frequency-row">
                    <div class="duration-selector">
                      <p class="field-label">{{ t('challenges.duration') }}</p>
                      <div v-if="errors.duration" class="error-message mb-2">{{ errors.duration }}</div>
                      <div class="duration-toggle-wrapper" :class="{ 'error-border': errors.duration }">
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

                    <div class="frequency-selector">
                      <p class="field-label">{{ t('challenges.frequency') }}</p>
                      <div class="frequency-toggle-wrapper">
                        <v-btn-toggle
                          v-model="form.frequency"
                          mandatory
                          class="custom-chips-group"
                        >
                          <v-btn value="daily" class="chip-btn">
                            <span>{{ t('challenges.frequencyOptions.daily') }}</span>
                          </v-btn>
                          <v-btn value="everyOtherDay" class="chip-btn">
                            <span>{{ t('challenges.frequencyOptions.everyOtherDay') }}</span>
                          </v-btn>
                        </v-btn-toggle>
                      </div>
                    </div>
                  </div>

                  <div class="start-time-selector">
                    <p class="field-label">{{ t('challenges.start') }}</p>
                    
                    <div class="d-flex align-center gap-3">
                      <v-btn-toggle
                        v-model="form.startOption"
                        mandatory
                        class="custom-toggle-group"
                      >
                        <v-btn value="today" class="toggle-btn">
                          <span>{{ t('challenges.startOptions.today') }}</span>
                        </v-btn>
                        
                        <v-btn value="tomorrow" class="toggle-btn">
                          <span>{{ t('challenges.startOptions.tomorrow') }}</span>
                        </v-btn>
                      </v-btn-toggle>

                      <v-btn 
                        @click="showDatePicker = true"
                        :class="['calendar-btn', { 'is-active': isCustomDate }]"
                        variant="outlined"
                      >
                        <v-icon size="20">mdi-calendar-month-outline</v-icon>
                        <span v-if="isCustomDate" class="ml-2">{{ formattedDate }}</span>
                        <span v-else class="ml-2">{{ t('challenges.pickDate') }}</span>
                      </v-btn>
                    </div>
                    
                    <v-dialog v-model="showDatePicker" max-width="400">
                      <v-date-picker
                        v-model="form.startDate"
                        @update:model-value="handleDatePick"
                      ></v-date-picker>
                    </v-dialog>
                  </div>

                  <div class="social-settings-block mt-8">
                    <div class="social-header d-flex align-center mb-4">
                      <v-icon color="#7e46c4" class="mr-2">mdi-share-variant-outline</v-icon>
                      <h3 class="text-h6 font-weight-bold">{{ t('challenges.accessCommunity') }}</h3>
                    </div>

                    <v-item-group v-model="form.privacy" mandatory>
                      <v-row class="px-3">
                        <v-col cols="12" md="6" class="pa-2">
                          <v-item v-slot="{ isSelected, toggle }" value="solo">
                            <div 
                              :class="['mode-card', { 'active': isSelected }]" 
                              @click="toggle"
                            >
                              <div class="d-flex align-center justify-space-between mb-2">
                                <v-icon :color="isSelected ? '#7e46c4' : '#94a3b8'">mdi-lock-outline</v-icon>
                                <v-icon v-if="isSelected" color="#7e46c4" size="20">mdi-check-circle</v-icon>
                              </div>
                              <span class="mode-title">{{ t('challenges.personalPath') }}</span>
                              <p class="mode-desc">{{ t('challenges.personalPathDesc') }}</p>
                            </div>
                          </v-item>
                        </v-col>

                        <v-col cols="12" md="6" class="pa-2">
                          <v-item v-slot="{ isSelected, toggle }" value="public">
                            <div 
                              :class="['mode-card', { 'active': isSelected }]" 
                              @click="toggle"
                            >
                              <div class="d-flex align-center justify-space-between mb-2">
                                <v-icon :color="isSelected ? '#7e46c4' : '#94a3b8'">mdi-earth</v-icon>
                                <v-icon v-if="isSelected" color="#7e46c4" size="20">mdi-check-circle</v-icon>
                              </div>
                              <span class="mode-title">{{ t('challenges.commonWorld') }}</span>
                              <p class="mode-desc">{{ t('challenges.commonWorldDesc') }}</p>
                            </div>
                          </v-item>
                        </v-col>
                      </v-row>
                    </v-item-group>

                    <v-expand-transition>
                      <div v-if="form.privacy === 'public'" class="public-preview-box mt-4 pa-5">
                        <div class="d-flex align-center">
                          <v-icon color="#7e46c4" size="32" class="mr-3">mdi-sparkles</v-icon>
                          <div>
                            <span class="d-block font-weight-bold" style="color: #1a1a2e;">{{ t('challenges.readinessToAnnounce') }}</span>
                            <span class="text-caption text-grey-darken-1">
                              {{ t('challenges.shareLinkAfterCreation') }}
                            </span>
                          </div>
                        </div>
                        
                        <v-divider class="my-4"></v-divider>

                        <v-checkbox
                          v-model="form.allowComments"
                          :label="t('challenges.allowCommentsLabel')"
                          color="#7e46c4"
                          hide-details
                          class="compact-checkbox"
                        ></v-checkbox>
                      </div>
                    </v-expand-transition>
                  </div>
                </template>

                <!-- Result Form Section -->
                <template v-if="form.challengeType === 'result'">
                  <div class="milestones-manager mt-6">
                  <p class="field-label mb-4">{{ t('challenges.milestonesTitle') }}</p>
                  
                  <div class="milestones-timeline mb-4">
                    <div
                      v-for="(step, index) in form.milestones"
                      :key="index"
                      class="milestone-item d-flex align-center pa-3 mb-2"
                    >
                      <div class="step-number">{{ index + 1 }}</div>
            <v-text-field
                        v-model="step.title"
                        :placeholder="t('challenges.milestonePlaceholder')"
                        variant="plain"
                        hide-details
                        class="ml-3"
            ></v-text-field>
                      <v-btn
                        icon="mdi-close"
                        variant="text"
                        size="small"
                        color="grey"
                        @click="removeStep(index)"
                      ></v-btn>
                    </div>
                  </div>

                  <v-btn 
                    variant="dashed" 
                    block 
                    prepend-icon="mdi-flag-plus-outline" 
                    class="add-step-btn"
                    @click="addStep"
                  >
                    {{ t('challenges.addMilestone') }}
                  </v-btn>
                  </div>

                  <div class="deadline-block mt-8">
                  <p class="field-label mb-4">{{ t('challenges.deadlineTitle') }}</p>
                  
                  <v-menu
                    v-model="deadlineMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ props }">
                      <div 
                        v-bind="props" 
                        class="deadline-selector d-flex align-center pa-4"
                        :class="{ 'has-date': form.endDate }"
                      >
                        <v-icon size="28" color="#7e46c4" class="mr-4">mdi-calendar-check</v-icon>
                        
                        <div class="d-flex flex-column text-left">
                          <span class="date-display">
                            {{ form.endDate ? formatDate(form.endDate) : t('challenges.deadlinePlaceholder') }}
                          </span>
                          <span v-if="form.endDate" class="time-left-hint">
                            {{ t('challenges.daysLeft') }}: {{ calculateDaysLeft(form.endDate) }}
                          </span>
                        </div>
                        
                        <v-spacer></v-spacer>
                        <v-icon color="#94a3b8">mdi-chevron-right</v-icon>
                      </div>
                    </template>

                    <v-date-picker
                      v-model="form.endDate"
                      color="#7e46c4"
                      elevation="24"
                      class="rounded-xl"
                      @update:model-value="deadlineMenu = false"
                    ></v-date-picker>
                  </v-menu>
                  </div>

                  <div class="difficulty-section mt-8">
                  <p class="field-label mb-4">{{ t('challenges.difficultyTitle') }}</p>
                  
                  <div class="diff-cards-container">
                    <div 
                      class="diff-option easy" 
                      :class="{ active: form.difficulty === 'easy' }"
                      @click="form.difficulty = 'easy'"
                    >
                      <div class="diff-icon">
                        <v-icon>mdi-leaf</v-icon>
                      </div>
                      <div class="diff-content">
                        <span class="diff-name">{{ t('challenges.difficultyEasy') }}</span>
                        <span class="diff-xp">+50 XP</span>
                      </div>
                      <v-icon class="check-icon" size="20">mdi-check-circle</v-icon>
                    </div>

                    <div 
                      class="diff-option normal" 
                      :class="{ active: form.difficulty === 'normal' }"
                      @click="form.difficulty = 'normal'"
                    >
                      <div class="diff-icon">
                        <v-icon>mdi-sword</v-icon>
                      </div>
                      <div class="diff-content">
                        <span class="diff-name">{{ t('challenges.difficultyNormal') }}</span>
                        <span class="diff-xp">+150 XP</span>
                      </div>
                      <v-icon class="check-icon" size="20">mdi-check-circle</v-icon>
                    </div>

                    <div 
                      class="diff-option heroic" 
                      :class="{ active: form.difficulty === 'heroic' }"
                      @click="form.difficulty = 'heroic'"
                    >
                      <div class="diff-icon">
                        <v-icon>mdi-fire</v-icon>
                      </div>
                      <div class="diff-content">
                        <span class="diff-name">{{ t('challenges.difficultyHeroic') }}</span>
                        <span class="diff-xp">+500 XP</span>
                      </div>
                      <v-icon class="check-icon" size="20">mdi-check-circle</v-icon>
                    </div>
                  </div>
                  </div>

                  <div class="privacy-selection mt-8">
                  <p class="field-label mb-4">{{ t('challenges.privacyMode') }}</p>
                  
                  <v-row>
                    <v-col cols="12" sm="6">
                      <div 
                        class="privacy-card" 
                        :class="{ active: form.privacy === 'solo' || form.privacy === 'private' }"
                        @click="form.privacy = 'private'"
                      >
                        <v-icon size="32">mdi-shield-lock-outline</v-icon>
                        <div class="ml-4">
                          <span class="d-block font-weight-bold">{{ t('challenges.secretQuest') }}</span>
                          <span class="text-caption">{{ t('challenges.secretQuestDesc') }}</span>
                        </div>
                        <v-spacer></v-spacer>
                        <v-radio v-model="form.privacy" value="private" color="#7e46c4"></v-radio>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <div 
                        class="privacy-card" 
                        :class="{ active: form.privacy === 'public' }"
                        @click="form.privacy = 'public'"
                      >
                        <v-icon size="32">mdi-fountain-pen-tip</v-icon>
                        <div class="ml-4">
                          <span class="d-block font-weight-bold">{{ t('challenges.worldChronicle') }}</span>
                          <span class="text-caption">{{ t('challenges.worldChronicleDesc') }}</span>
                        </div>
                        <v-spacer></v-spacer>
                        <v-radio v-model="form.privacy" value="public" color="#7e46c4"></v-radio>
                      </div>
                    </v-col>
                  </v-row>
                  </div>

                  <div class="reward-block mt-8">
                  <p class="field-label mb-4">{{ t('challenges.rewardTitle') }}</p>
                  
                  <div class="loot-container pa-1">
                    <v-text-field
                      v-model="form.reward"
                      :placeholder="t('challenges.rewardPlaceholder')"
                      variant="solo"
                      flat
                      bg-color="white"
                      class="reward-input"
                      hide-details
                    >
                      <template v-slot:prepend-inner>
                        <div class="reward-icon-box">
                          <v-icon color="#FFD700">mdi-trophy-variant</v-icon>
                        </div>
                      </template>
                    </v-text-field>
                  </div>
                  
                  <p class="text-caption text-grey-darken-1 mt-2 ml-2">
                    {{ t('challenges.rewardHint') }}
                  </p>
                  </div>
                </template>

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
                    :disabled="loading || !isFormValid"
                    class="create-mission-btn"
                    :class="{ 
                      'disabled-grayscale': !isFormValid,
                      'create-mission-btn--ready': isFormValid && !loading
                    }"
            >
              {{ createButtonText }}
            </v-btn>
          </div>
              </div>
            </v-col>
            <v-col v-if="showImageUpload" cols="12" md="4" class="desktop-upload-section">
              <ChallengeImageUpload
                v-model="form.imageUrl"
                :editable="true"
              />
            </v-col>
          </v-row>
        </v-form>
    </div>
    
    <SuccessModal
      v-model="showSuccessModal"
      :challenge-id="createdChallengeId"
      :is-public="form.privacy === 'public'"
      @add-another="resetForm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import SuccessModal from './SuccessModal.vue'
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
  privacy: 'solo',
  challengeType: 'habit',
  frequency: 'daily',
  startOption: 'today',
  actions: [{ text: '', checked: false, children: [] }],
  milestones: [{ title: '' }],
  endDate: '',
  reward: '',
  difficulty: 'normal',
  allowComments: true,
  communityQuest: false
})

const showSlider = ref(false)
const customDays = ref(60)
const showImageUpload = ref(false)
const showDatePicker = ref(false)
const deadlineMenu = ref(false)
const showSuccessModal = ref(false)
const createdChallengeId = ref('')

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
  // Clear duration error when duration is selected
  if (errors.value.duration) {
    errors.value.duration = ''
  }
})

// Watch title to clear error
watch(() => form.value.title, () => {
  if (errors.value.title) {
    errors.value.title = ''
  }
})

// Watch custom duration to clear error
watch(() => form.value.customDuration, () => {
  if (errors.value.duration && form.value.customDuration) {
    errors.value.duration = ''
  }
})

// Sync customDays with form.customDuration
watch(customDays, (newVal) => {
  form.value.customDuration = String(newVal)
})

const titlePlaceholder = computed(() => {
  if (form.value.challengeType === 'habit') {
    return t('challenges.titlePlaceholder.habit')
  } else {
    return t('challenges.titlePlaceholder.result')
  }
})

const coverMediaTitle = computed(() => {
  return form.value.challengeType === 'result'
    ? t('challenges.epicBannerTitle')
    : t('challenges.coverPhotoTitle')
})

const createButtonText = computed(() => {
  return form.value.challengeType === 'result'
    ? t('challenges.createResult')
    : t('challenges.createHabit')
})

const shareLink = computed(() => {
  // This will be set after challenge creation, for now use placeholder
  return 'ignite.app/quest/hero-777'
})

function copyLink() {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    // You can add a snackbar notification here if needed
    console.log('Link copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy link:', err)
  })
}

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

// Check if custom date is selected
const isCustomDate = computed(() => {
  if (!form.value.startDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const selectedDate = new Date(form.value.startDate)
  selectedDate.setHours(0, 0, 0, 0)
  
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  const tomorrowYear = tomorrow.getFullYear()
  const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0')
  const tomorrowStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`
  
  return form.value.startDate !== todayStr && form.value.startDate !== tomorrowStr
})

// Format date for display
const formattedDate = computed(() => {
  if (!form.value.startDate) return ''
  const date = new Date(form.value.startDate)
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
})

// Handle date pick from calendar
function handleDatePick(date) {
  if (date) {
    form.value.startDate = date
    form.value.startOption = 'custom'
  }
  showDatePicker.value = false
}

const privacyOptions = computed(() => [
  { title: t('challenges.privacyOptions.public'), value: 'public' },
  { title: t('challenges.privacyOptions.private'), value: 'private' }
])

// Watch for startOption changes and update startDate
watch(() => form.value.startOption, (newValue) => {
  // Don't update startDate if custom date is already selected
  if (newValue === 'custom') {
    return
  }
  
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
const errors = ref({
  title: '',
  description: '',
  duration: ''
})

const isFormValid = computed(() => {
  const hasTitle = form.value.title && form.value.title.trim() !== ''
  const hasDuration = form.value.duration && form.value.duration !== ''
  const hasCustomDuration = form.value.duration !== 'custom' || (form.value.customDuration && form.value.customDuration.trim() !== '')
  
  return hasTitle && hasDuration && hasCustomDuration
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
    form.value.privacy = 'private' // Set default privacy for result type
    form.value.difficulty = 'normal' // Set default difficulty for result type
    // startDate will be set automatically by the watcher
    // Initialize actions with default item if empty
    if (!form.value.actions || form.value.actions.length === 0) {
      form.value.actions = [{ text: '', checked: false, children: [] }]
    }
    if (!form.value.milestones || form.value.milestones.length === 0) {
      form.value.milestones = [{ title: '' }]
    }
  }
  // Clear custom duration if it was set
  if (form.value.duration !== 'custom') {
    form.value.customDuration = ''
  }
}

function addStep() {
  if (!form.value.milestones) form.value.milestones = []
  form.value.milestones.push({ title: '' })
}

function removeStep(index) {
  if (!form.value.milestones) return
  form.value.milestones.splice(index, 1)
  if (form.value.milestones.length === 0) {
    form.value.milestones.push({ title: '' })
  }
}

function validate() {
  const validationErrors = {}

  if (!form.value.title || form.value.title.trim() === '') {
    validationErrors.title = t('validation.titleRequired')
  }

  if (!form.value.startOption) {
    validationErrors.startOption = t('validation.startOptionRequired')
  }

  if (!form.value.duration || form.value.duration === '') {
    validationErrors.duration = t('validation.durationRequired')
  } else if (form.value.duration === 'custom') {
    if (!form.value.customDuration || form.value.customDuration < 1) {
      validationErrors.duration = t('validation.customDurationRequired')
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

function formatDate(value) {
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

function calculateDaysLeft(endDate) {
  if (!endDate) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const diffTime = end - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
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
    // Use manually set endDate for result type, otherwise calculate it
    const endDate = (form.value.challengeType === 'result' && form.value.endDate) 
      ? form.value.endDate 
      : calculateEndDate()
    
    const challengeData = {
      title: form.value.title,
      description: form.value.description,
      startDate: startDate,
      endDate: endDate,
      owner: userId,
      privacy: form.value.privacy === 'solo' ? 'private' : (form.value.privacy || 'public'),
      challengeType: form.value.challengeType || 'habit',
      allowComments: form.value.allowComments !== undefined ? form.value.allowComments : true,
      communityQuest: form.value.communityQuest || false
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
    
    // Only include actions and reward for result challenges
    if (form.value.challengeType === 'result') {
      const milestones = Array.isArray(form.value.milestones) ? form.value.milestones : []
      const actionsFromMilestones = milestones
        .map(m => (m?.title || '').trim())
        .filter(Boolean)
        .map(title => ({ text: title, checked: false, children: [] }))

      if (actionsFromMilestones.length) {
        challengeData.actions = actionsFromMilestones
      }
      
      if (form.value.reward && form.value.reward.trim()) {
        challengeData.reward = form.value.reward.trim()
      }
      
      if (form.value.difficulty) {
        challengeData.difficulty = form.value.difficulty
      }
    }

    const response = await challengeService.createChallenge(challengeData)
    
    // Store the created challenge ID
    // Backend returns { message, challenge: { _id, ... } }
    const challengeId = response.data?.challenge?._id || response.data?._id || response.data?.id || ''
    
    if (challengeId) {
      createdChallengeId.value = challengeId
    }
    
    // Show success modal if privacy is public, otherwise navigate
    if (form.value.privacy === 'public') {
      await nextTick()
      showSuccessModal.value = true
    } else {
      router.push('/missions/my')
    }
  } catch (error) {
    console.error('Error creating challenge:', error)
    console.error('Error response:', error.response)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    errorMessage.value = error.response?.data?.message || error.message || t('notifications.createError')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  // Reset form to default values
  form.value = {
    title: '',
    description: '',
    startDate: '',
    imageUrl: '',
    duration: '21',
    customDuration: '',
    privacy: 'solo',
    challengeType: 'habit',
    frequency: 'daily',
    startOption: 'today',
    actions: [{ text: '', checked: false, children: [] }],
    milestones: [{ title: '' }],
    endDate: '',
    reward: '',
    difficulty: 'normal',
    allowComments: true,
    communityQuest: false
  }
  
  // Reset other state
  showSlider.value = false
  customDays.value = 60
  showImageUpload.value = false
  showDatePicker.value = false
  deadlineMenu.value = false
  createdChallengeId.value = ''
  errorMessage.value = ''
  errors.value = {}
  
  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    top: -20px !important;
    right: -40px !important;
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
  letter-spacing: 0.5px;
}

.duration-frequency-row {
  display: flex;
  gap: 24px;
  margin: 24px 0;
  align-items: flex-start;
}

.duration-frequency-row .duration-selector {
  flex: 1;
  margin: 0;
  min-width: 0;
}

.duration-frequency-row .frequency-selector {
  flex: 0 0 auto;
  margin: 0;
  width: auto;
  max-width: 300px;
}

.duration-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.frequency-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .duration-toggle-wrapper {
    justify-content: center !important;
    width: 100% !important;
  }
  
  .duration-toggle-wrapper .custom-chips-group {
    width: 100% !important;
    justify-content: center !important;
  }
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

@media (max-width: 600px) {
  .custom-chips-group .chip-btn {
    height: 40px !important;
    padding: 0 12px !important;
    font-size: 0.85rem !important;
    border-radius: 10px !important;
  }
  
  .custom-chips-group .chip-btn .v-icon {
    font-size: 16px !important;
    margin-right: 4px !important;
  }
  
  .custom-chips-group .custom-choice {
    min-width: 40px !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
  }
  
  .custom-chips-group .custom-choice .v-icon {
    font-size: 20px !important;
    margin-right: 0 !important;
  }
  
  .custom-chips-group {
    gap: 8px !important;
  }
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

.custom-chips-group .custom-choice .v-icon {
  margin-right: 0 !important;
}

@media (max-width: 600px) {
  .duration-frequency-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .custom-chips-group {
    gap: 8px !important;
    justify-content: center !important;
  }
  
  .custom-chips-group .chip-btn {
    height: 40px !important;
    padding: 0 12px !important;
    font-size: 0.85rem !important;
    border-radius: 10px !important;
  }
  
  .custom-chips-group .chip-btn .v-icon {
    font-size: 16px !important;
    margin-right: 4px !important;
  }
  
  .custom-chips-group .custom-choice {
    min-width: 40px !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
  }
  
  .custom-chips-group .custom-choice .v-icon {
    font-size: 20px !important;
    margin-right: 0 !important;
  }
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

.start-time-selector {
  margin-top: 24px;
  margin-bottom: 24px;
}

.start-time-selector .field-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 12px;
  display: block;
}

.custom-toggle-group {
  background: #f1f5f9 !important;
  border-radius: 12px !important;
  padding: 4px !important;
  height: 44px !important;
  display: flex;
}

.custom-toggle-group .toggle-btn {
  border: none !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: #64748b !important;
  font-weight: 600 !important;
  text-transform: none !important;
  flex: 1;
  transition: all 0.2s ease;
}

.custom-toggle-group .toggle-btn.v-btn--active {
  background: #ffffff !important;
  color: #7e46c4 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

.calendar-btn {
  height: 44px !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 12px !important;
  color: #64748b !important;
  background: #ffffff !important;
  text-transform: none !important;
  font-weight: 600 !important;
  transition: all 0.2s ease;
  margin-left: 5px !important;
}

.calendar-btn:hover {
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
}

.calendar-btn.is-active {
  border-color: #7e46c4 !important;
  color: #7e46c4 !important;
  background: rgba(126, 70, 196, 0.05) !important;
}

.calendar-btn .v-icon {
  color: #94a3b8;
}

.calendar-btn.is-active .v-icon {
  color: #7e46c4;
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

/* Social Settings Block */
.social-settings-block {
  padding: 24px;
  background: rgba(126, 70, 196, 0.03);
  border: 1px dashed #7e46c4;
  border-radius: 24px;
}

.social-settings-block .mode-card {
  background: #ffffff;
  border: 2px solid #f1f5f9;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-settings-block .mode-card:hover {
  border-color: #e2e8f0;
  transform: translateY(-2px);
}

.social-settings-block .mode-card.active {
  border-color: #7e46c4;
  background: #fdfaff;
  box-shadow: 0 4px 15px rgba(126, 70, 196, 0.1);
}

.social-settings-block .mode-card.active .mode-title {
  color: #7e46c4;
}

.social-settings-block .mode-title {
  display: block;
  font-weight: 800;
  font-size: 1rem;
  margin-bottom: 4px;
  color: #1a1a2e;
}

.social-settings-block .mode-desc {
  font-size: 0.8rem;
  line-height: 1.3;
  color: #64748b;
  margin: 0;
}

.social-settings-block .public-preview-box {
  background: linear-gradient(135deg, rgba(126, 70, 196, 0.05) 0%, rgba(244, 167, 130, 0.05) 100%);
  border: 1px solid rgba(126, 70, 196, 0.2);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.social-settings-block .public-preview-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #7e46c4;
}

.social-settings-block .compact-checkbox :deep(.v-label) {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  opacity: 1 !important;
}

.social-settings-block .field-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

/* Create button wrapper */
.create-button-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 1em;
  margin-top: 2rem;
}

/* Create mission button styling */
.create-mission-btn {
  background: linear-gradient(135deg, #8a4af3 0%, #7e46c4 100%) !important;
  color: #ffffff !important;
  height: 56px !important;
  border-radius: 16px !important;
  padding: 0 40px !important;
  text-transform: uppercase !important;
  font-weight: 800 !important;
  font-size: 1.1rem !important;
  letter-spacing: 1.5px !important;
  box-shadow: 0 8px 20px rgba(126, 70, 196, 0.35) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: none !important;
}

.create-mission-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 28px rgba(126, 70, 196, 0.45) !important;
  background: linear-gradient(135deg, #965df5 0%, #8a4af3 100%) !important;
}

.create-mission-btn:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 4px 10px rgba(126, 70, 196, 0.3) !important;
}

.create-mission-btn.disabled-grayscale {
  filter: grayscale(100%) !important;
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.create-mission-btn.disabled-grayscale:hover {
  transform: none !important;
  box-shadow: 0 8px 20px rgba(126, 70, 196, 0.35) !important;
  background: linear-gradient(135deg, #8a4af3 0%, #7e46c4 100%) !important;
}

.error-message {
  color: #d32f2f;
  font-size: 0.75rem;
  font-weight: 500;
}

.duration-toggle-wrapper.error-border {
  border: 1px solid #d32f2f !important;
  border-radius: 12px;
  padding: 4px;
}

/* Анимация пульсации для готовой к нажатию кнопки */
@keyframes forge-glow {
  0% { 
    box-shadow: 0 8px 20px rgba(126, 70, 196, 0.35), 0 0 0 0 rgba(126, 70, 196, 0.5) !important;
  }
  70% { 
    box-shadow: 0 8px 20px rgba(126, 70, 196, 0.35), 0 0 0 12px rgba(126, 70, 196, 0) !important;
  }
  100% { 
    box-shadow: 0 8px 20px rgba(126, 70, 196, 0.35), 0 0 0 0 rgba(126, 70, 196, 0) !important;
  }
}

.create-mission-btn--ready {
  animation: forge-glow 2s infinite !important;
}

.title-cover-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.title-field-wrapper {
  flex: 1;
  min-width: 0;
}

.cover-photo-toggle-btn {
  height: 56px !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  white-space: nowrap;
  border: 2px solid #e2e8f0 !important;
  color: #64748b !important;
  transition: all 0.3s ease !important;
}

.cover-photo-toggle-btn:hover {
  border-color: #7e46c4 !important;
  color: #7e46c4 !important;
  background: rgba(126, 70, 196, 0.05) !important;
}

.cover-photo-toggle-btn.active {
  border-color: #7e46c4 !important;
  background: linear-gradient(135deg, #7e46c4 0%, #8a4af3 100%) !important;
  color: #ffffff !important;
}

.mobile-upload-section {
  display: block;
}

.desktop-upload-section {
  display: none;
}

.milestones-manager .milestone-item {
  background: #f8faff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: 0.2s;
}

.milestones-manager .milestone-item :deep(.v-input) {
  margin: 0 !important;
  align-self: center;
}

.milestones-manager .milestone-item :deep(.v-field) {
  align-items: center !important;
}

.milestones-manager .milestone-item :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.milestones-manager .milestone-item :deep(.v-field__field) {
  align-items: center !important;
}

.milestones-manager .milestone-item:hover {
  border-color: #7e46c4;
}

.milestones-manager .milestone-item .step-number {
  background: #7e46c4;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.75rem;
  flex: 0 0 auto;
  margin-right: 12px;
}

.milestones-manager .add-step-btn {
  border: 2px dashed #cbd5e1 !important;
  color: #64748b !important;
  text-transform: none !important;
  height: 48px !important;
  border-radius: 12px !important;
}

.milestones-manager .add-step-btn:hover {
  border-color: #7e46c4 !important;
  color: #7e46c4 !important;
  background: rgba(126, 70, 196, 0.02);
}

.deadline-selector {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.deadline-selector:hover {
  border-color: #7e46c4;
  background: rgba(126, 70, 196, 0.02);
  transform: translateY(-2px);
}

.deadline-selector.has-date {
  border-color: #7e46c4;
  background: linear-gradient(90deg, #ffffff 0%, #fdfaff 100%);
}

.deadline-selector .date-display {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a1a2e;
}

.deadline-selector .time-left-hint {
  font-size: 0.8rem;
  color: #7e46c4;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.v-date-picker) {
  .v-date-picker-month__day--selected .v-btn {
    background: #7e46c4 !important;
  }
}

.privacy-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.privacy-card .v-icon {
  color: #94a3b8;
  transition: 0.25s;
}

.privacy-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.privacy-card.active {
  border-color: #7e46c4;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(126, 70, 196, 0.1);
}

.privacy-card.active .v-icon {
  color: #7e46c4;
}

.privacy-card.active span.font-weight-bold {
  color: #7e46c4;
}

.privacy-card :deep(.v-selection-control) {
  justify-content: flex-end;
}

.loot-container {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
}

.loot-container .reward-input :deep(.v-field) {
  border-radius: 18px !important;
}

.loot-container .reward-input :deep(.v-field--focused) .reward-icon-box {
  transform: scale(1.1) rotate(-10deg);
}

.reward-icon-box {
  background: rgba(255, 215, 0, 0.1);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: transform 0.3s ease;
  margin-right: 8px;
}

.reward-input :deep(input) {
  font-weight: 600 !important;
  color: #1a1a2e !important;
}

.reward-input :deep(input::placeholder) {
  font-weight: 400;
  font-style: italic;
  opacity: 0.6;
}

.diff-cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-option {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.diff-option .diff-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  transition: 0.3s;
  background: #fff;
}

.diff-option .diff-content {
  display: flex;
  flex-direction: column;
}

.diff-option .diff-content .diff-name {
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.95rem;
  color: #1a1a2e;
}

.diff-option .diff-content .diff-xp {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.diff-option .check-icon {
  margin-left: auto;
  opacity: 0;
  transition: 0.3s;
  color: inherit;
}

.diff-option.active {
  transform: translateX(8px);
  background: white;
}

.diff-option.active .check-icon {
  opacity: 1;
}

.diff-option.active.easy {
  border-color: #4caf50;
}

.diff-option.active.easy .diff-icon {
  background: #e8f5e9;
  color: #4caf50;
}

.diff-option.active.easy .diff-name,
.diff-option.active.easy .diff-xp {
  color: #4caf50;
}

.diff-option.active.normal {
  border-color: #7e46c4;
}

.diff-option.active.normal .diff-icon {
  background: #f3e5f5;
  color: #7e46c4;
}

.diff-option.active.normal .diff-name,
.diff-option.active.normal .diff-xp {
  color: #7e46c4;
}

.diff-option.active.heroic {
  border-color: #ff5252;
  background: #fff5f5;
  animation: shake 0.5s ease-in-out;
}

.diff-option.active.heroic .diff-icon {
  background: #ffebee;
  color: #ff5252;
}

.diff-option.active.heroic .diff-name,
.diff-option.active.heroic .diff-xp {
  color: #ff5252;
}

@keyframes shake {
  0%, 100% { transform: translateX(8px); }
  25% { transform: translateX(12px); }
  75% { transform: translateX(4px); }
}

/* Mobile styles */
@media (max-width: 600px) {
  .create-mission-btn {
    width: 100% !important;
  }
  
  .mobile-upload-section {
    display: block;
  }
  
  .desktop-upload-section {
    display: none !important;
  }
}

/* Desktop styles */
@media (min-width: 960px) {
  .mobile-upload-section {
    display: none !important;
  }
  
  .desktop-upload-section {
    display: block;
  }
}

</style>
